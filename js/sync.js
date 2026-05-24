/**
 * ==================================================================================
 * Module Name: SyncModule (State Synchronization Engine)
 * File Path: js/sync.js
 * 
 * DESIGN PHILOSOPHY:
 * This module is the platform's synchronizer. It manages:
 * 1. User online status presence (real-time presence, idle updates, tab focus monitoring).
 * 2. Background offline data alignment and reconciliation (IndexedDB).
 * 3. Real-time incremental child listening for news and social feeds.
 * 
 * It keeps concern separation high by injecting UI render methods via callbacks.
 * ==================================================================================
 */

import { ref, get, onChildAdded, onChildRemoved, query, orderByKey, startAfter, limitToLast, set, onValue, update, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { DBModule } from './db.js';

export const SyncModule = {
    isSyncDone: false,
    sidebarClasses: {},
    cnCache: {},
    ctCache: {},
    callbacks: {
        renderNews: null,
        renderSidebar: null,
        onNewChatDiscovered: null
    },
    _heartbeatInterval: null,
    _groupSyncInterval: null,

    /**
     * Initializes UI render callbacks
     * @param {Object} cbs - Callback collection
     */
    init(cbs) {
        this.callbacks = { ...this.callbacks, ...cbs };
    },

    /**
     * Reconciles cloud news announcements with IndexedDB (moved from db.js)
     * @param {string} tab - 'school' | 'club'
     * @param {object} remoteData - Cloud data
     * @param {Array} localKeys - Existing local keys
     */
    async reconcileNews(tab, remoteData, localKeys) {
        console.log(`Sync: Reconciling news for [${tab}]...`);
        const remoteKeys = Object.keys(remoteData);

        // Remove locally cached items that were deleted from the server
        const deletedKeys = localKeys.filter(k => !remoteKeys.includes(k));
        for (const key of deletedKeys) {
            console.log(`Sync: Found deleted item [${key}] on server. Removing locally...`);
            if (DBModule.Local.deleteNews) {
                await DBModule.Local.deleteNews(tab, key);
            }
        }

        const missingKeys = remoteKeys.filter(k => !localKeys.includes(k));
        if (missingKeys.length === 0 && deletedKeys.length === 0) {
            console.log(`Sync: [${tab}] is already up to date.`);
            return;
        }

        console.log(`Sync: Found ${missingKeys.length} missing items for [${tab}]. Syncing...`);
        for (const key of missingKeys) {
            const post = { key, ...remoteData[key] };
            await DBModule.Local.saveNews(tab, key, post);
        }
    },

    /**
     * Global Database Sync Engine
     * Compares cloud databases with IndexedDB and mounts real-time listeners
     * @param {Object} db - Firebase database instance
     */
    async globalDataSync(db) {
        console.log('Sync: Starting background globalDataSync...');
        const syncHint = document.getElementById('newsSyncHint');
        if (syncHint) syncHint.classList.add('opacity-100');

        const newsTabs = ['school', 'club'];
        for (const tab of newsTabs) {
            try {
                const remoteSnap = await get(ref(db, `news/${tab}`));
                const remoteData = remoteSnap.val() || {};
                const remoteKeys = Object.keys(remoteData);

                // 1. Read local keys to find synchronization delta
                const localItems = await DBModule.Local.getNews(tab);
                const localKeys = localItems.map(it => it.key);

                // 2. Align local cache with cloud records
                await this.reconcileNews(tab, remoteData, localKeys);

                // 3. Render immediately to give instant feedback
                const finalLocal = await DBModule.Local.getNews(tab);
                if (this.callbacks.renderNews) {
                    this.callbacks.renderNews(finalLocal, tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent', tab);
                }

                // 4. Incremental Real-time Sync for future updates
                const lastKey = remoteKeys.sort().pop();
                const q = lastKey ? query(ref(db, `news/${tab}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `news/${tab}`), orderByKey(), limitToLast(1));
                onChildAdded(q, async (snap) => {
                    console.log(`Sync: New item received for news/${tab}`);
                    await DBModule.Local.saveNews(tab, snap.key, snap.val());
                    const updatedLocal = await DBModule.Local.getNews(tab);
                    if (this.callbacks.renderNews) {
                        this.callbacks.renderNews(updatedLocal, tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent', tab);
                    }
                });

                // Listen for announcement deletions to update UI and IndexedDB in real-time
                onChildRemoved(ref(db, `news/${tab}`), async (snap) => {
                    console.log(`Sync: Item removed from news/${tab}: ${snap.key}`);
                    if (DBModule.Local.deleteNews) {
                        await DBModule.Local.deleteNews(tab, snap.key);
                    }
                    const updatedLocal = await DBModule.Local.getNews(tab);
                    if (this.callbacks.renderNews) {
                        this.callbacks.renderNews(updatedLocal, tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent', tab);
                    }
                });
            } catch (err) {
                console.error(`Sync: Failed for news/${tab}:`, err);
                const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div class="text-center text-red-500 py-10 text-[13px]">Sync Error: ${err.message}<br/>Check internet or browser security settings.</div>`;
                }
            }
        }
        console.log('Sync: News sync complete.');

        // 5. Synchronize Social Modules Feeds (Marketplace, Suggestion, etc.)
        const moduleNames = window.MODULE_CONFIG ? Object.keys(window.MODULE_CONFIG) : [];
        for (const name of moduleNames) {
            try {
                const lastKey = await DBModule.Local.getLastKey('modules', 'moduleName', name);
                const q = lastKey ? query(ref(db, `modules/${name}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `modules/${name}`), orderByKey(), limitToLast(50));
                onChildAdded(q, async (snap) => {
                    try {
                        const post = { id: snap.key, ...snap.val() };
                        await DBModule.Local.saveModulePost(name, snap.key, post);
                        // Dispatches standard CustomEvent so other modules can handle UI updates
                        document.dispatchEvent(new CustomEvent('sync:module-post', { detail: { moduleName: name, post } }));
                    } catch (e) { console.error('Sync: Module child error:', e); }
                });
            } catch (err) {
                console.warn(`Sync: Failed for module/${name}:`, err);
            }
        }

        // Hide synchronization indicator
        if (syncHint) {
            syncHint.classList.add('hidden');
            setTimeout(() => syncHint.remove(), 1000);
        }
        this.isSyncDone = true;
    },

    /**
     * Presence Synchronization System
     * Reports user status, updates database active indicators, and cleans up on connection loss
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    initPresence(db, currentUser) {
        if (!currentUser || !currentUser.id) return;
        const userStatusRef = ref(db, `users/${currentUser.id}/status`);
        const connectedRef = ref(db, ".info/connected");

        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // Set status to online immediately on connection
                set(userStatusRef, "online");

                // Graceful presence handling on disconnect
                onDisconnect(userStatusRef).set("offline");
                onDisconnect(ref(db, `users/${currentUser.id}/lastSeen`)).set(serverTimestamp());
            }
        });

        // Tab focus monitoring
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                set(userStatusRef, "online");
            } else {
                set(userStatusRef, "away");
            }
        });

        // 60s Heartbeat loop (moved from index.html)
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(() => {
            update(ref(db, `users/${currentUser.id}`), { lastSeen: serverTimestamp() });
        }, 60000);
    },

    /**
     * Synchronize Group Chats / Classes (moved from index.html)
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    async syncGroupChats(db, currentUser) {
        if (!currentUser || !currentUser.id) return;
        try {
            const snap = await get(ref(db, 'classes'));
            const classes = snap.val() || {};
            const myClasses = Object.keys(classes).filter(id => {
                const c = classes[id];
                return c.teacherId === currentUser.id || (c.students && c.students[currentUser.id]);
            });

            this.sidebarClasses = {};
            myClasses.forEach(id => {
                this.sidebarClasses[id] = true;
                if (this.callbacks.onNewChatDiscovered) {
                    this.callbacks.onNewChatDiscovered(`group_${id}`);
                }
            });

            for (const cid of myClasses) {
                const c = classes[cid];
                this.cnCache[cid] = c.name;

                if (c.teacherId && window.AppModules?.User) {
                    window.AppModules.User.fetchUser(c.teacherId).then(u => {
                        if (u && u.name) {
                            this.ctCache[cid] = u.name;
                            if (this.callbacks.renderSidebar) this.callbacks.renderSidebar();
                        }
                    });
                }

                const classData = classes[cid];
                if (classData.lastActivity) {
                    const chatId = `group_${cid}`;
                    const localPath = `user_chats/${currentUser.id.toLowerCase()}/${chatId}`;
                    const localSnap = await get(ref(db, localPath));
                    if (!localSnap.exists() || localSnap.val() < classData.lastActivity) {
                        await update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [chatId]: classData.lastActivity });
                    }
                }
            }
            const firstSync = !this.isSyncDone;
            this.isSyncDone = true;
            if (firstSync && this.callbacks.renderSidebar) {
                this.callbacks.renderSidebar();
            }
        } catch (e) {
            console.warn("Group sync failed:", e);
        }
    },

    /**
     * Start periodic group chat syncing (moved from index.html)
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    startGroupSync(db, currentUser) {
        if (this._groupSyncInterval) clearInterval(this._groupSyncInterval);
        this.syncGroupChats(db, currentUser);
        this._groupSyncInterval = setInterval(() => {
            this.syncGroupChats(db, currentUser);
        }, 30000);
    }
};

// Global mount for ESM module system compatibility
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Sync = SyncModule;
}
