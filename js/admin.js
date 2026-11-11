/**
 * ==================================================================================
 * Module: AppModules.Admin (js/admin.js)
 * Purpose: Handles database admin console operations, integrity analysis scanning,
 *          user listings, filtering, and cascading account deletion.
 * ==================================================================================
 */

import { ref, get, set, update, sRef, deleteObject, query, orderByKey, limitToFirst, startAfter } from './core.js';
import { db, storage } from './db.js';

let adminAllUsers = {};
let adminGlobalLinks = {};

const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');

export const AdminModule = {
    /**
     * Retrieves the state of all loaded users.
     */
    getAllUsers() {
        return adminAllUsers;
    },

    /**
     * Opens the administrator database console, fetches records, and renders them.
     */
    async openAdminConsole() {
        if (!window.AppModules.User.isAdmin()) return;
        window.AppModules.View.openOverlay('adminConsolePage', { zIndex: window.AppModules.View.CONSTANTS.Z_INDEX.ADMIN, isExclusive: true });
        const listEl = document.getElementById('adminUserList');
        listEl.innerHTML = '<div class="text-center text-gray-400 mt-20 animate-pulse">Fetching all users...</div>';
        try {
            const [usersSnap, globalLinksSnap] = await Promise.all([
                get(ref(db, 'users')),
                get(ref(db, 'canvas_global_links')).catch(() => ({ val: () => ({}) }))
            ]);
            adminAllUsers = usersSnap.val() || {};
            adminGlobalLinks = (globalLinksSnap && globalLinksSnap.val()) || {};
            if (window.canvasStudentLinks) {
                window.canvasStudentLinks = { ...adminGlobalLinks, ...window.canvasStudentLinks };
            }
            this.renderAdminUserList(adminAllUsers, false, adminGlobalLinks);
        } catch (err) {
            listEl.innerHTML = `<div class="text-center text-red-500 mt-20 p-4 font-bold">Error: ${err.message}</div>`;
        }
    },

    /**
     * Closes the admin console overlay and clears searches/status.
     */
    closeAdminConsole() {
        window.AppModules.View.closeOverlay('adminConsolePage', {
            onClose: () => {
                document.getElementById('adminUserSearch').value = '';
                document.getElementById('scanStatus').classList.add('hidden');
            }
        });
    },

    /**
     * Filters list of users matching query in name, email, or ID.
     */
    filterAdminUsers() {
        const term = document.getElementById('adminUserSearch').value.toLowerCase().trim();
        if (!term) { this.renderAdminUserList(adminAllUsers, false, adminGlobalLinks); return; }
        const filtered = {};
        Object.keys(adminAllUsers).forEach(id => {
            const u = adminAllUsers[id];
            const match = (u.name || '').toLowerCase().includes(term) ||
                (u.email || '').toLowerCase().includes(term) ||
                id.toLowerCase().includes(term);
            if (match) filtered[id] = u;
        });
        this.renderAdminUserList(filtered, false, adminGlobalLinks);
    },

    /**
     * Scans database cache for orphaned accounts, duplicate emails, invalid emails, empty names, or role conflicts.
     */
    scanUserIssues() {
        const status = document.getElementById('scanStatus');
        status.classList.remove('hidden');
        status.innerText = "Analyzing accounts for integrity issues...";

        const emailMap = {};
        const problematic = {};

        Object.keys(adminAllUsers).forEach(id => {
            const u = adminAllUsers[id];
            const email = (u.email || '').toLowerCase().trim();
            const issues = [];

            // 1. Ghost ID Check (Legacy formats)
            if (id.includes('_gmail_') || id.includes('_inst_')) {
                issues.push("Ghost ID");
            }

            // 2. Missing or invalid email
            if (!email) {
                issues.push("Missing Email");
            } else if (!email.includes('@') || email.length < 5) {
                issues.push("Invalid Email");
            }

            // 3. Empty Name
            if (!(u.name || '').trim()) {
                issues.push("Empty Name");
            }

            // 4. Role Consistency Check
            if (email) {
                const domain = email.split('@')[1];
                if (domain === 'hcpss.org' && u.role !== 'teacher' && u.role !== 'admin') issues.push("Role Conflict (Staff)");
                if (domain === 'inst.hcpss.org' && u.role !== 'student') issues.push("Role Conflict (Student)");
            }

            if (issues.length > 0) {
                problematic[id] = { ...u, scanIssues: issues };
            }

            // Track emails for duplicate detection
            if (email) {
                if (!emailMap[email]) emailMap[email] = [];
                emailMap[email].push(id);
            }
        });

        // 5. Duplicate emails detection
        Object.keys(emailMap).forEach(email => {
            if (emailMap[email].length > 1) {
                emailMap[email].forEach(id => {
                    if (!problematic[id]) problematic[id] = { ...adminAllUsers[id], scanIssues: [] };
                    if (!problematic[id].scanIssues.includes("Duplicate Email")) {
                        problematic[id].scanIssues.push("Duplicate Email");
                    }
                });
            }
        });

        this.renderAdminUserList(problematic, true);
        status.innerText = `Scan Complete: Found ${Object.keys(problematic).length} accounts with potential issues.`;
        document.getElementById('adminShowAllBtn').classList.remove('hidden');
    },

    /**
     * Resets status displays and renders full user base.
     */
    resetAdminList() {
        document.getElementById('adminUserSearch').value = '';
        document.getElementById('scanStatus').classList.add('hidden');
        document.getElementById('adminShowAllBtn').classList.add('hidden');
        this.renderAdminUserList(adminAllUsers, false, adminGlobalLinks);
    },

    /**
     * Generates HTML layout and maps account cards onto UI list wrapper.
     */
    renderAdminUserList(users, isScanResult = false, globalLinks = null) {
        const container = document.getElementById('adminUserList');
        const ids = Object.keys(users);
        if (ids.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 mt-20">No users found.</div>';
            return;
        }

        const escapeHTML = window.escapeHTML || ((str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        const links = globalLinks || window.canvasStudentLinks || {};

        container.innerHTML = ids.map(id => {
            const u = users[id];
            const issues = u.scanIssues || [];
            const issuesHtml = issues.map(issue =>
                `<span class="bg-red-500/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">${issue}</span>`
            ).join(' ');

            const isCanvasActive = window.canvasConnectionActive === true;
            const link = links[id];
            const uEmail = (u.email || '').toLowerCase().trim();
            const uRole = (u.role || '').toLowerCase().trim();
            const isHcpssUser = uEmail.endsWith('@hcpss.org') || uEmail.endsWith('@inst.hcpss.org') || uRole === 'student' || uRole === 'teacher';

            let canvasLinkBtn = '';
            if (isCanvasActive) {
                if (link) {
                    canvasLinkBtn = `
                        <button onclick="adminLinkCanvas('${id}', '${escapeHTML(u.name || '').replace(/'/g, "\\'")}', '${escapeHTML(u.email || '').replace(/'/g, "\\'")}')"
                            class="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
                            title="Global Canvas Link: ${escapeHTML(link.canvasUserName || 'Linked')} (Click to manage)">
                            <svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71" />
                            </svg>
                            <span class="max-w-[120px] truncate">${escapeHTML(link.canvasUserName || 'Linked')}</span>
                        </button>
                    `;
                } else if (isHcpssUser) {
                    canvasLinkBtn = `
                        <button onclick="adminLinkCanvas('${id}', '${escapeHTML(u.name || '').replace(/'/g, "\\'")}', '${escapeHTML(u.email || '').replace(/'/g, "\\'")}')"
                            class="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-[#007AFF] hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
                            title="Link Canvas account globally">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71" />
                            </svg>
                            <span>Link Canvas</span>
                        </button>
                    `;
                }
            }

            return `
                <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div class="flex justify-between items-start gap-4">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <span class="font-bold text-black dark:text-white truncate">${escapeHTML(u.name || 'No Name')}</span>
                                <span class="bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">${u.role || 'user'}</span>
                                ${issuesHtml}
                            </div>
                            <div class="text-xs text-gray-400 truncate font-medium">${escapeHTML(window.formatDisplayEmail ? window.formatDisplayEmail(u.email) : (u.email || 'NO EMAIL'))}</div>
                            <div class="text-[10px] text-gray-500 font-mono mt-1 opacity-50 select-all">ID: ${id}</div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            ${canvasLinkBtn}
                            <button onclick="confirmDeleteUser('${id}')"
                                class="bg-red-50 dark:bg-red-500/10 text-red-500 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Double confirm prompts before running cascading database delete sequence.
     */
    async confirmDeleteUser(userId) {
        const u = adminAllUsers[userId] || { name: userId };
        const escapeHTML = window.escapeHTML || ((str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));

        const firstOk = await window.AppModules.Modal.confirm(
            "Destroy User Account?",
            `This will PERMANENTLY delete <b>${escapeHTML(u.name || userId)}</b> and all associated chat logs. Irreversible action.`,
            "DELETE ACCOUNT"
        );
        if (!firstOk) return;

        const secondOk = await window.AppModules.Modal.confirm(
            "FINAL WARNING",
            `Are you absolutely sure? You are about to wipe all data for ${escapeHTML(u.name || userId)}.`,
            "YES, WIPE EVERYTHING"
        );
        if (secondOk) {
            this.deleteUserFully(userId);
        }
    },

    /**
     * Executes database deletions cascaded across user profiles, user_chats, and mutual chat message logs.
     */
    async deleteUserFully(userId) {
        const listEl = document.getElementById('adminUserList');
        const status = document.getElementById('scanStatus');
        status.classList.remove('hidden');
        status.innerText = `Purging ${userId} from system...`;

        const helperDeleteStorage = async (url) => {
            if (!url || typeof url !== 'string' || !url.includes('firebasestorage')) return;
            try {
                const fileRef = sRef(storage, url);
                await deleteObject(fileRef);
            } catch (e) { }
        };

        try {
            const uidLower = userId.toLowerCase();

            // 1. Delete user record & private settings
            await set(ref(db, `users/${userId}`), null);
            await set(ref(db, `user_private/${userId}`), null);

            // 2. Load user's chat index
            const userChatsRef = ref(db, `user_chats/${uidLower}`);
            const chatsSnap = await get(userChatsRef);
            const chats = chatsSnap.val() || {};

            // 3. Process direct / 1-on-1 chats: delete images from storage, message threads, and peer chat references
            const otherUserIds = Object.keys(chats).filter(id => !id.startsWith('group_'));
            for (const otherId of otherUserIds) {
                const chatId = getChatId(userId, otherId);

                // Fetch messages in this direct chat to delete all storage images
                try {
                    const msgSnap = await get(ref(db, `messages/${chatId}`));
                    if (msgSnap.exists()) {
                        const msgs = msgSnap.val() || {};
                        for (const mk in msgs) {
                            const m = msgs[mk];
                            if (m.image) await helperDeleteStorage(m.image);
                            if (m.type === 'image_group' && m.text) {
                                try {
                                    const urls = JSON.parse(m.text);
                                    if (Array.isArray(urls)) {
                                        for (const u of urls) await helperDeleteStorage(u);
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`[DeleteUser] Failed to purge storage images for direct chat ${chatId}:`, e);
                }

                // Remove peer's pointer to this user
                await set(ref(db, `user_chats/${otherId.toLowerCase()}/${uidLower}`), null);
                // Delete message thread
                await set(ref(db, `messages/${chatId}`), null);
                // Delete associated writing projects and states for this 1-on-1 chat
                await set(ref(db, `writing_projects/${chatId}`), null);
                await set(ref(db, `writing_doc_state/${chatId}`), null);
            }

            // 4. Cascade into classes/groups: remove from roster, and purge messages/images authored by this user
            try {
                const classesSnap = await get(ref(db, 'classes'));
                if (classesSnap.exists()) {
                    const classesData = classesSnap.val() || {};
                    for (const classId in classesData) {
                        const cls = classesData[classId] || {};
                        let isMember = false;

                        // Check if user is in students roster
                        if (cls.students) {
                            for (const studentKey in cls.students) {
                                if (studentKey.toLowerCase() === uidLower || studentKey === userId) {
                                    await set(ref(db, `classes/${classId}/students/${studentKey}`), null);
                                    isMember = true;
                                }
                            }
                        }

                        // Also remove group chat pointer from user's index if exists
                        await set(ref(db, `user_chats/${uidLower}/group_${classId}`), null);

                        // If user was part of class or sent messages to group chat, scan and delete their authored messages & images
                        const groupChatId = `group_${classId}`;
                        try {
                            const grpMsgSnap = await get(ref(db, `messages/${groupChatId}`));
                            if (grpMsgSnap.exists()) {
                                const grpMsgs = grpMsgSnap.val() || {};
                                for (const mk in grpMsgs) {
                                    const m = grpMsgs[mk];
                                    const sender = (m.senderId || '').toLowerCase();
                                    if (sender === uidLower || sender === userId.toLowerCase()) {
                                        if (m.image) await helperDeleteStorage(m.image);
                                        if (m.type === 'image_group' && m.text) {
                                            try {
                                                const urls = JSON.parse(m.text);
                                                if (Array.isArray(urls)) {
                                                    for (const u of urls) await helperDeleteStorage(u);
                                                }
                                            } catch (e) { }
                                        }
                                        await set(ref(db, `messages/${groupChatId}/${mk}`), null);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`[DeleteUser] Error scanning group messages in ${groupChatId}:`, e);
                        }
                    }
                }
            } catch (e) {
                console.warn('[DeleteUser] Error cascading classes and group chats:', e);
            }

            // 5. Delete remaining user-uploaded images tracked in user_image_index
            try {
                const userImgSnap = await get(ref(db, `user_image_index/${uidLower}`));
                if (userImgSnap.exists()) {
                    const imgEntries = userImgSnap.val() || {};
                    for (const k in imgEntries) {
                        const entry = imgEntries[k];
                        if (entry && entry.chatId && entry.msgKey) {
                            try {
                                const mSnap = await get(ref(db, `messages/${entry.chatId}/${entry.msgKey}`));
                                if (mSnap.exists()) {
                                    const m = mSnap.val() || {};
                                    if (m.image) await helperDeleteStorage(m.image);
                                    if (m.type === 'image_group' && m.text) {
                                        try {
                                            const urls = JSON.parse(m.text);
                                            if (Array.isArray(urls)) {
                                                for (const u of urls) await helperDeleteStorage(u);
                                            }
                                        } catch (e) { }
                                    }
                                    await set(ref(db, `messages/${entry.chatId}/${entry.msgKey}`), null);
                                }
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) {
                console.warn('[DeleteUser] Error clearing user_image_index storage images:', e);
            }

            // 6. Delete user's own chat index
            await set(userChatsRef, null);

            // 7. Delete search index, image quota, and notifications
            await set(ref(db, `user_search/${userId}`), null);
            await set(ref(db, `user_image_index/${uidLower}`), null);
            await set(ref(db, `user_notifications/${uidLower}`), null);

            // 8. Delete user-specific tool/progress data and global link mappings
            await set(ref(db, `user_tools_data/canvas_data/${uidLower}`), null);
            await set(ref(db, `canvas_global_links/${userId}`), null);

            // Success
            delete adminAllUsers[userId];
            this.renderAdminUserList(adminAllUsers, false, adminGlobalLinks);
            status.innerText = `User ${userId} and all related messages, projects, and images successfully purged.`;
            setTimeout(() => status.classList.add('hidden'), 3000);
        } catch (err) {
            window.AppModules.Modal.alert("Error", "Purge failed: " + err.message);
            status.innerText = "Error during purge sequence.";
        }
    },

    /**
     * Shreds private photos from storage and marks respective messages as expired.
     */
    async adminPurgeImages() {
        if (!window.AppModules.User.isAdmin()) return;
        const confirmed = await window.AppModules.Modal.confirm(
            "PRIVATE PHOTO PURGE",
            "WARNING: This will PHYSICALLY DELETE all images from PRIVATE CHATS (non-group) for all users. Group chats and public posts will NOT be affected. Proceed?",
            "Yes, Shred Private Photos"
        );
        if (!confirmed) return;

        const helperDeleteStorage = async (url) => {
            if (!url || typeof url !== 'string' || !url.includes('firebasestorage')) return;
            try {
                const fileRef = sRef(storage, url);
                await deleteObject(fileRef);
            } catch (e) { }
        };

        try {
            window.AppModules.Modal.alert("Purge Started", "Shredding private chat files...");
            let dbCount = 0;
            let storageCount = 0;

            // 1. Scan Messages (ONLY non-group chats) - paginated to avoid memory crash
            const BATCH_SIZE = 50;
            let lastKey = null;
            let hasMore = true;

            while (hasMore) {
                let q = query(ref(db, 'messages'), orderByKey(), limitToFirst(BATCH_SIZE));
                if (lastKey) q = query(ref(db, 'messages'), orderByKey(), startAfter(lastKey), limitToFirst(BATCH_SIZE));
                const batchSnap = await get(q);
                const batchData = batchSnap.val() || {};
                const batchKeys = Object.keys(batchData);

                if (batchKeys.length === 0) { hasMore = false; break; }
                lastKey = batchKeys[batchKeys.length - 1];
                if (batchKeys.length < BATCH_SIZE) hasMore = false;

                for (const chatId of batchKeys) {
                    if (chatId.startsWith('group_')) continue;
                    const chatMsgs = batchData[chatId] || {};

                    for (const msgKey in chatMsgs) {
                        const m = chatMsgs[msgKey];
                        if (m.image || m.type === 'image_group') {
                            if (m.image) { await helperDeleteStorage(m.image); storageCount++; }
                            if (m.type === 'image_group' && m.text) {
                                try {
                                    const urls = JSON.parse(m.text);
                                    for (const u of urls) { await helperDeleteStorage(u); storageCount++; }
                                } catch (e) { }
                            }
                            await update(ref(db, `messages/${chatId}/${msgKey}`), { text: "Image Expired", type: "text", isExpired: true, image: null });
                            dbCount++;
                        }
                    }
                }
            }

            // 2. Clear Quota Indices (preserving ir_v7 if it exists under user_image_index)
            const quotaSnap = await get(ref(db, 'user_image_index'));
            if (quotaSnap.exists()) {
                const quotaData = quotaSnap.val();
                for (const key in quotaData) {
                    if (key !== 'ir_v7') {
                        await set(ref(db, `user_image_index/${key}`), null);
                    }
                }
            }

            await window.AppModules.Modal.alert("Purge Complete", `Deleted ${storageCount} private files and cleaned ${dbCount} entries. Group chats, news, and extension data remain untouched.`);
        } catch (err) {
            await window.AppModules.Modal.alert("Error", "Purge failed: " + err.message);
        }
    }
};

// Global bindings for inline HTML events integration
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Admin = AdminModule;
    window.openAdminConsole = () => AdminModule.openAdminConsole();
    window.closeAdminConsole = () => AdminModule.closeAdminConsole();
    window.filterAdminUsers = () => AdminModule.filterAdminUsers();
    window.scanUserIssues = () => AdminModule.scanUserIssues();
    window.resetAdminList = () => AdminModule.resetAdminList();
    window.confirmDeleteUser = (id) => AdminModule.confirmDeleteUser(id);
    window.deleteUserFully = (id) => AdminModule.deleteUserFully(id);
    window.adminPurgeImages = () => AdminModule.adminPurgeImages();
    window.adminLinkCanvas = (id, name, email) => {
        if (typeof window.openCanvasStudentLink === 'function') {
            window.openCanvasStudentLink(id, name, email, { isGlobal: true });
        }
    };
    window.addEventListener('canvas-student-links-updated', () => {
        const adminOverlay = document.getElementById('adminConsolePage');
        if (adminOverlay && !adminOverlay.classList.contains('hidden') && Object.keys(adminAllUsers).length > 0) {
            get(ref(db, 'canvas_global_links')).then(snap => {
                adminGlobalLinks = snap.val() || {};
                AdminModule.renderAdminUserList(adminAllUsers, false, adminGlobalLinks);
            }).catch(() => {});
        }
    });
}
