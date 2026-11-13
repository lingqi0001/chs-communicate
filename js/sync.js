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

import { ref, get, onChildAdded, onChildRemoved, query, orderByKey, startAfter, endBefore, limitToLast, set, onValue, update, serverTimestamp, onDisconnect } from "../vendor/firebase/10.7.1/firebase-database.js";
import { DBModule } from './db.js';

export const SyncModule = {
    isSyncDone: false,
    sidebarClasses: {},
    existingClassIds: {},
    _newsSyncedTabs: new Set(),
    cnCache: (() => {
        try { return JSON.parse(localStorage.getItem('chs_cn_cache') || '{}'); } catch (e) { return {}; }
    })(),
    ctCache: (() => {
        try { return JSON.parse(localStorage.getItem('chs_ct_cache') || '{}'); } catch (e) { return {}; }
    })(),
    callbacks: {
        renderNews: null,
        renderSidebar: null,
        onNewChatDiscovered: null
    },
    _heartbeatInterval: null,
    _groupSyncInterval: null,
    _activeUnsubscribers: [],

    /**
     * Initializes UI render callbacks
     * @param {Object} cbs - Callback collection
     */
    init(cbs) {
        this.callbacks = { ...this.callbacks, ...cbs };
    },

    cleanupListeners() {
        this._activeUnsubscribers.forEach(unsub => { try { unsub(); } catch (e) {} });
        this._activeUnsubscribers = [];
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = null;
        }
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
        // The .info/connected listener and the browser online/offline handlers
        // are deliberately NOT torn down here. They are the session-lifetime
        // connection watchdog: globalDataSync re-runs constantly, and killing
        // the watchdog mid-boot swallows the "back online" edge, leaving the
        // offline banners latched forever. initConnectionStatus guards against
        // double-attaching.
        // if (this._browserOfflineHandler) {
        //     window.removeEventListener("offline", this._browserOfflineHandler);
        //     window.removeEventListener("online", this._browserOnlineHandler);
        //     this._browserOfflineHandler = null;
        //     this._browserOnlineHandler = null;
        // }
        // if (this._connStatusUnsub) {
        //     try { this._connStatusUnsub(); } catch (e) {}
        //     this._connStatusUnsub = null;
        //     this._connStatusRef = null;
        // }
    },

    /**
     * Reconciles cloud news announcements with IndexedDB (moved from db.js)
     * Safeguarded to only prune deletions within the fetched key range,
     * ensuring older historical records in IndexedDB are not wiped out.
     * @param {string} tab - 'school' | 'club'
     * @param {object} remoteData - Cloud data
     * @param {Array} localKeys - Existing local keys
     */
    async reconcileNews(tab, remoteData, localKeys) {
        console.log(`Sync: Reconciling news for [${tab}]...`);
        const remoteKeys = Object.keys(remoteData);
        if (remoteKeys.length === 0) return;

        const oldestRemoteKey = remoteKeys.slice().sort()[0];

        // Remove locally cached items only within the remote query window
        const deletedKeys = localKeys.filter(k => k >= oldestRemoteKey && !remoteKeys.includes(k));
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
     * @param {Object} currentUser - Current authenticated user
     */
    async globalDataSync(db, currentUser = null) {
        this.cleanupListeners();
        console.log('Sync: Starting background globalDataSync...');
        const syncHint = document.getElementById('newsSyncHint');
        if (syncHint) syncHint.classList.add('opacity-100');

        const newsTabs = ['school', 'club'];
        let newsCloudMiss = false;
        for (const tab of newsTabs) {
            try {
                const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                
                // 1. Read local items from IndexedDB first for instant rendering
                const localItems = await DBModule.Local.getNews(tab);
                const localKeys = (localItems || [])
                    .map(it => it.key || it.id || (it.compositeId ? String(it.compositeId).replace(new RegExp(`^${tab}_`), '') : null))
                    .filter(Boolean);
                if (this.callbacks.renderNews && localItems && localItems.length > 0) {
                    this.callbacks.renderNews(localItems, containerId, tab);
                }

                // If this session has already synced this tab, rely on real-time listeners
                if (this._newsSyncedTabs.has(tab)) {
                    console.log(`Sync: news/${tab} already synced this session, using cached data.`);
                    continue;
                }

                // Dual check: IndexedDB latest key + synchronous localStorage key cache
                const sortedLocalKeys = localKeys.slice().sort();
                const idbMaxKey = sortedLocalKeys.length > 0 ? sortedLocalKeys[sortedLocalKeys.length - 1] : null;
                const cachedMaxKey = localStorage.getItem(`chs_news_max_key_${tab}`);
                const maxLocalKey = idbMaxKey || cachedMaxKey || null;

                let remoteData;
                try {
                    let qLatest;
                    if (maxLocalKey) {
                        // Incremental sync: Only fetch announcements newer than our latest local cache
                        console.log(`Sync: news/${tab} incremental sync starting after [${maxLocalKey}]...`);
                        qLatest = query(ref(db, `news/${tab}`), orderByKey(), startAfter(maxLocalKey));
                    } else {
                        // Cold start: Only fetch the latest 20 announcements to populate initial cache
                        console.log(`Sync: news/${tab} cold start, fetching latest 20 items...`);
                        qLatest = query(ref(db, `news/${tab}`), orderByKey(), limitToLast(20));
                    }
                    const remoteSnap = await window.withNetworkTimeout(get(qLatest));
                    remoteData = remoteSnap.val() || {};
                } catch (remoteErr) {
                    // Offline boot: the IndexedDB copy is the only source this
                    // session, so render it and skip the cloud listeners.
                    console.warn(`Sync: news/${tab} unreachable, serving local cache:`, remoteErr.message);
                    newsCloudMiss = true;
                    if (!localItems || localItems.length === 0) {
                        const localOnly = await DBModule.Local.getNews(tab);
                        if (this.callbacks.renderNews) {
                            this.callbacks.renderNews(localOnly, containerId, tab);
                            window.bootMark?.(`news/${tab} painted from cache (${localOnly.length} items)`);
                        }
                    }
                    continue;
                }
                const remoteKeys = Object.keys(remoteData);

                // 2. Align local cache with cloud records
                if (maxLocalKey) {
                    if (remoteKeys.length > 0) {
                        console.log(`Sync: Found ${remoteKeys.length} new items for news/${tab}. Syncing...`);
                        for (const key of remoteKeys) {
                            const post = { key, ...remoteData[key] };
                            await DBModule.Local.saveNews(tab, key, post);
                        }
                        const updatedLocal = await DBModule.Local.getNews(tab);
                        if (this.callbacks.renderNews) {
                            this.callbacks.renderNews(updatedLocal, containerId, tab);
                        }
                        const newestRemoteKey = remoteKeys.slice().sort().pop();
                        if (newestRemoteKey) localStorage.setItem(`chs_news_max_key_${tab}`, newestRemoteKey);
                    } else {
                        console.log(`Sync: news/${tab} local cache is already up-to-date (0 bytes transferred).`);
                        if (maxLocalKey) localStorage.setItem(`chs_news_max_key_${tab}`, maxLocalKey);
                    }
                } else {
                    // Cold start: align full 20 items
                    await this.reconcileNews(tab, remoteData, localKeys);
                    const finalLocal = await DBModule.Local.getNews(tab);
                    if (this.callbacks.renderNews) {
                        this.callbacks.renderNews(finalLocal, containerId, tab);
                    }
                    if (remoteKeys.length > 0) {
                        const newestRemoteKey = remoteKeys.slice().sort().pop();
                        if (newestRemoteKey) localStorage.setItem(`chs_news_max_key_${tab}`, newestRemoteKey);
                    }
                }
                this._newsSyncedTabs.add(tab);

                // 3. Incremental Real-time Sync for future updates
                const lastKey = remoteKeys.length > 0 ? remoteKeys.slice().sort().pop() : maxLocalKey;
                const q = lastKey ? query(ref(db, `news/${tab}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `news/${tab}`), orderByKey(), limitToLast(1));
                const unsubNewsAdded = onChildAdded(q, async (snap) => {
                    console.log(`Sync: New item received for news/${tab}`);
                    await DBModule.Local.saveNews(tab, snap.key, snap.val());
                    const updatedLocal = await DBModule.Local.getNews(tab);
                    if (this.callbacks.renderNews) {
                        this.callbacks.renderNews(updatedLocal, containerId, tab);
                    }
                });
                this._activeUnsubscribers.push(unsubNewsAdded);

                // Listen for announcement deletions scoped to the cursor query (prevents downloading all historical items)
                const unsubNewsRemoved = onChildRemoved(q, async (snap) => {
                    console.log(`Sync: Item removed from news/${tab}: ${snap.key}`);
                    if (DBModule.Local.deleteNews) {
                        await DBModule.Local.deleteNews(tab, snap.key);
                    }
                    const updatedLocal = await DBModule.Local.getNews(tab);
                    if (this.callbacks.renderNews) {
                        this.callbacks.renderNews(updatedLocal, containerId, tab);
                    }
                });
                this._activeUnsubscribers.push(unsubNewsRemoved);
            } catch (err) {
                console.error(`Sync: Failed for news/${tab}:`, err);
                const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div class="text-center text-red-500 py-10 text-[13px]">Sync Error: ${err.message}<br/>Check internet or browser security settings.</div>`;
                }
            }
        }
        this._newsCloudMiss = newsCloudMiss;
        console.log('Sync: News sync complete.');

        // 5. Synchronize Social Modules Feeds (Marketplace, Suggestion, etc.)
        const moduleNames = window.MODULE_CONFIG ? Object.keys(window.MODULE_CONFIG) : [];
        for (const name of moduleNames) {
            try {
                const lastKey = await DBModule.Local.getLastKey('modules', 'moduleName', name);
                const q = lastKey ? query(ref(db, `modules/${name}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `modules/${name}`), orderByKey(), limitToLast(50));
                const unsubModule = onChildAdded(q, async (snap) => {
                    try {
                        const post = { id: snap.key, ...snap.val() };
                        await DBModule.Local.saveModulePost(name, snap.key, post);
                        // Dispatches standard CustomEvent so other modules can handle UI updates
                        document.dispatchEvent(new CustomEvent('sync:module-post', { detail: { moduleName: name, post } }));
                    } catch (e) { console.error('Sync: Module child error:', e); }
                });
                this._activeUnsubscribers.push(unsubModule);
            } catch (err) {
                console.warn(`Sync: Failed for module/${name}:`, err);
            }
        }

        // 6. Pre-fetch unread messages if IndexedDB cache is empty (limit to 5 most recent)
        try {
            const isCacheEmpty = await DBModule.Local.isMessagesCacheEmpty();
            if (isCacheEmpty && currentUser) {
                const uid = (currentUser.id || currentUser.uid || '').toLowerCase();
                if (uid) {
                    const notifySnap = await window.withNetworkTimeout(get(ref(db, `user_notifications/${uid}`)));
                    const notifyData = notifySnap.val() || {};
                    const unreadChatIds = Object.keys(notifyData).filter(key => notifyData[key] === true).slice(0, 5);
                    
                    console.log(`Sync: Pre-fetching ${unreadChatIds.length} unread chats...`);
                    for (const chatId of unreadChatIds) {
                        try {
                            const msgSnap = await window.withNetworkTimeout(get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50))));
                            const msgs = msgSnap.val() || {};
                            for (const msgKey in msgs) {
                                await DBModule.Local.saveMessage(chatId, msgKey, msgs[msgKey]);
                            }
                        } catch (e) {
                            console.error(`Sync: Failed to pre-fetch unread messages for ${chatId}`, e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Sync: Failed to pre-fetch unread messages:', err);
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
        const userSearchRef = ref(db, `user_search/${currentUser.id}`);
        const userSearchLastSeenRef = ref(db, `user_search/${currentUser.id}/lastSeen`);
        const connectedRef = ref(db, ".info/connected");

        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // Update presence timestamp in lightweight search index (0 listener bounce)
                update(userSearchRef, { lastSeen: serverTimestamp() }).catch(error => {
                    console.warn('Presence index update failed:', error);
                });

                // Graceful presence handling on disconnect
                onDisconnect(ref(db, `users/${currentUser.id}/lastSeen`)).set(serverTimestamp());
                onDisconnect(userSearchLastSeenRef).set(serverTimestamp());
            }
        });

        // Tab focus monitoring: refresh lastSeen only when tab becomes visible
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
        }
        this._visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                update(userSearchRef, { lastSeen: serverTimestamp() }).catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        // 60s Heartbeat loop: update ONLY lightweight user_search index (~50 bytes)
        // Never write to `users/${currentUser.id}` here to avoid triggering security.js onValue (saving 3.09 kB/min)
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(() => {
            update(userSearchRef, { lastSeen: serverTimestamp() }).catch(error => {
                console.warn('Presence index heartbeat failed:', error);
            });
        }, 60000);
    },

    isOffline: () => window.isOffline === true,

    /**
     * RTDB connection watchdog. `.info/connected` flips false the moment the
     * socket drops and true on reconnect, so the offline banners can update
     * incrementally without ever reloading the page (a reload would blow away
     * whatever the user was typing in the composer).
     */
    initConnectionStatus(db) {
        if (this._connStatusRef) return;
        this._connStatusRef = ref(db, ".info/connected");
        // `.info/connected` reads null until the socket finishes its handshake,
        // so a null snapshot means "not known yet", not "no network". Declaring
        // offline there painted the banners on every boot and made every cloud
        // read fail instantly through cloudUnreachable().
        this._everConnected = false;
        this._connStatusUnsub = onValue(this._connStatusRef, (snap) => {
            this._connSnapshotVal = snap.val();
            if (snap.val() === true) {
                this._everConnected = true;
                clearTimeout(this._connGraceTimer);
                this._setConnectionState(false, "rtdb");
            } else if (this._everConnected) {
                this._setConnectionState(true, "rtdb");
            }
        });

        // A socket that has not connected by the end of the grace window really
        // is unreachable, so the banners still arrive - just not before the
        // handshake got its chance. A link the browser already reports as down
        // needs no grace at all.
        clearTimeout(this._connGraceTimer);
        this._connGraceTimer = setTimeout(() => {
            if (!this._everConnected) this._setConnectionState(true, "boot-grace");
        }, navigator.onLine === false ? 0 : 5000);

        // Only the offline edge is trusted from the browser: navigator.onLine
        // lies "true" on captive/school Wi-Fi. On the online edge we only flip
        // back if the RTDB listener already agrees we're connected.
        this._browserOfflineHandler = () => this._setConnectionState(true, "browser");
        this._browserOnlineHandler = () => {
            if (window.isOffline && this._connSnapshotVal === true) {
                this._setConnectionState(false, "browser");
            }
        };
        window.addEventListener("offline", this._browserOfflineHandler);
        window.addEventListener("online", this._browserOnlineHandler);
    },

    _setConnectionState(offline, source) {
        const prev = window.isOffline === true;
        if (prev === offline) return;
        window.isOffline = offline;
        console.log(`Sync: connection state → ${offline ? "offline" : "online"} (${source})`);
        if (!offline && this._newsCloudMiss) {
            // Boot raced the RTDB handshake: news was painted from cache only.
            // One retry now that the socket is actually up.
            this._newsCloudMiss = false;
            console.log('Sync: back online - retrying news fetch');
            setTimeout(() => {
                try { if (typeof window.globalDataSync === 'function') window.globalDataSync(); } catch (e) {}
            }, 300);
        }
        document.dispatchEvent(new CustomEvent("connection:status", {
            detail: { offline, source }
        }));
    },

    /**
     * Synchronize Group Chats / Classes (moved from index.html)
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    async syncGroupChats(db, currentUser, classesFromListener = null) {
        if (!currentUser || !currentUser.id) return;
        try {
            let classes = classesFromListener;
            if (classes === null) {
                const chatsSnap = await window.withNetworkTimeout(get(ref(db, `user_chats/${currentUser.id.toLowerCase()}`)));
                const classIds = Object.keys(chatsSnap.val() || {})
                    .filter(id => id.startsWith('group_'))
                    .map(id => id.slice(6));
                const snaps = await Promise.all(classIds.map(id => window.withNetworkTimeout(get(ref(db, `classes/${id}`)))));
                classes = Object.fromEntries(snaps.flatMap((snap, index) => snap.exists() ? [[classIds[index], snap.val()]] : []));
            }
            
            this.existingClassIds = {};
            Object.keys(classes).forEach(id => {
                this.existingClassIds[id] = true;
            });

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
                            localStorage.setItem('chs_ct_cache', JSON.stringify(this.ctCache));
                        }
                    }).catch(() => {});
                }

                const classData = classes[cid];
                if (classData.lastActivity) {
                    const chatId = `group_${cid}`;
                    const localPath = `user_chats/${currentUser.id.toLowerCase()}/${chatId}`;
                    const localSnap = await window.withNetworkTimeout(get(ref(db, localPath)));
                    if (!localSnap.exists() || localSnap.val() < classData.lastActivity) {
                        await update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [chatId]: classData.lastActivity });
                    }
                }
            }

            localStorage.setItem('chs_cn_cache', JSON.stringify(this.cnCache));
            localStorage.setItem('chs_ct_cache', JSON.stringify(this.ctCache));

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
     * Synchronize and monitor user's own classes / group chats on demand
     * Avoids listening to the entire 'classes' root to prevent large data egress
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    async syncUserClasses(db, currentUser, classIds) {
        if (!currentUser || !currentUser.id || !classIds || classIds.length === 0) {
            this.isSyncDone = true;
            if (this.callbacks.renderSidebar) this.callbacks.renderSidebar();
            return;
        }
        try {
            const fetchedClasses = {};
            await Promise.all(classIds.map(async cid => {
                try {
                    const snap = await window.withNetworkTimeout(get(ref(db, `classes/${cid}`)));
                    if (snap.exists()) {
                        fetchedClasses[cid] = snap.val();
                    }
                } catch (err) {
                    console.warn(`Sync: Failed to fetch class ${cid}:`, err);
                }
            }));
            await this.syncGroupChats(db, currentUser, fetchedClasses);
        } catch (e) {
            console.warn('Sync: syncUserClasses error:', e);
        }
    },

    /**
     * Start group chat syncing targeted to user's joined chats instead of full root listener
     * @param {Object} db - Firebase database instance
     * @param {Object} currentUser - Currently authenticated user
     */
    startGroupSync(db, currentUser) {
        if (this._groupSyncInterval) { clearInterval(this._groupSyncInterval); this._groupSyncInterval = null; }
        if (this._groupSyncUnsub) { this._groupSyncUnsub(); this._groupSyncUnsub = null; }
        if (this._classItemUnsubs) { this._classItemUnsubs.forEach(u => { try { u(); } catch(e){} }); }
        this._classItemUnsubs = [];

        // Listen only to the user's personal chat list to know which group chats they belong to
        const userChatsRef = ref(db, `user_chats/${currentUser.id.toLowerCase()}`);
        this._groupSyncUnsub = onValue(userChatsRef, async (snap) => {
            const chats = snap.val() || {};
            const groupClassIds = Object.keys(chats)
                .filter(id => id.startsWith('group_'))
                .map(id => id.replace('group_', ''));

            // Clean up previous individual class listeners
            if (this._classItemUnsubs) {
                this._classItemUnsubs.forEach(u => { try { u(); } catch(e){} });
                this._classItemUnsubs = [];
            }

            if (groupClassIds.length === 0) {
                this.isSyncDone = true;
                if (this.callbacks.renderSidebar) this.callbacks.renderSidebar();
                return;
            }

            // Mount light listeners only on the specific classes user is part of
            const activeClassMap = {};
            groupClassIds.forEach(cid => {
                const u = onValue(ref(db, `classes/${cid}`), (cSnap) => {
                    if (cSnap.exists()) {
                        activeClassMap[cid] = cSnap.val();
                    } else {
                        delete activeClassMap[cid];
                    }
                    this.syncGroupChats(db, currentUser, activeClassMap);
                }, (err) => console.warn(`Sync: class listener error ${cid}:`, err));
                this._classItemUnsubs.push(u);
            });
        }, (err) => {
            console.warn('Sync: user_chats listener failed, falling back:', err);
        });
    },

    /**
     * Loads older news announcements on demand (paging backwards via endBefore)
     * @param {Object} db - Firebase database instance
     * @param {string} tab - 'school' | 'club'
     * @param {string} oldestKey - The oldest key currently loaded
     * @param {number} pageSize - Number of older items to fetch
     * @returns {Promise<Array>} Array of newly fetched posts
     */
    async loadOlderNews(db, tab, oldestKey, pageSize = 20) {
        if (!oldestKey) return [];
        try {
            console.log(`Sync: Fetching ${pageSize} older news for [${tab}] before ${oldestKey}...`);
            const q = query(ref(db, `news/${tab}`), orderByKey(), endBefore(oldestKey), limitToLast(pageSize));
            const snap = await window.withNetworkTimeout(get(q));
            const data = snap.val() || {};
            const keys = Object.keys(data);
            if (keys.length === 0) return [];

            for (const key of keys) {
                const post = { key, ...data[key] };
                await DBModule.Local.saveNews(tab, key, post);
            }
            return keys.map(k => ({ key: k, ...data[k] }));
        } catch (e) {
            console.warn(`Sync: Failed to load older news for ${tab}:`, e);
            return [];
        }
    }
};

// Global mount for ESM module system compatibility
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Sync = SyncModule;
}
