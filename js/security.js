/**
 * ==================================================================================
 * Module: AppModules.Security (js/security.js)
 * Purpose: Handles rate limiting (cooldowns), admin permission checks, user fetch overrides,
 *          user account deletion checks, and message/post reporting.
 * ==================================================================================
 */
import { ref, update, push, get, onValue, serverTimestamp, set } from './core.js';
import { auth } from './db.js';

let db = null;

// Anti-abuse cooldown timers and thresholds (in milliseconds)
const cooldowns = {
    msg: { last: 0, limit: 1000 },       // Message limit: 1s
    post: { last: 0, limit: 10000 },     // Post limit: 10s
    comment: { last: 0, limit: 3000 }    // Comment limit: 3s
};

const SAFETY_BOT_ID = 'safety_bot';
const ADVICE_BOT_ID = 'advice_bot';

const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');

export const SecurityModule = {
    /**
     * Initializes the Security Module with database instance
     */
    init(dbInstance) {
        db = dbInstance;
    },

    /**
     * Checks if the rate limit for a certain action is active.
     * Does NOT update the rate limit timestamp (two-step validation pattern).
     */
    checkRateLimit(type, silent = false) {
        const now = Date.now();
        const cd = cooldowns[type];
        if (!cd) return true;

        if (now - cd.last < cd.limit) {
            if (!silent) {
                const seconds = Math.ceil((cd.limit - (now - cd.last)) / 1000);
                window.AppModules.Modal.alert("Cooldown", `Please wait ${seconds}s before operating again.`);
            }
            return false;
        }
        return true;
    },

    /**
     * Records the rate limit timestamp when the action successfully executes.
     */
    recordRateLimit(type, customTime = null) {
        if (cooldowns[type]) {
            cooldowns[type].last = customTime !== null ? customTime : Date.now();
        }
    },

    /**
     * Checks if photo uploads are allowed (not disabled by admin)
     */
    checkPhotoUploadAllowed() {
        if (window.isPhotoDisabled) {
            window.AppModules.Modal.alert("Restricted", "Photo uploads are currently disabled by the administrator.");
            return false;
        }
        return true;
    },

    /**
     * Storage Limit Verification & Old Photo Expiration Cleanup
     */
    async checkLimitAndCleanup(files) {
        if (!auth.currentUser) return false;

        // Admin bypass - administrators have unlimited storage quota
        if (window.AppModules && window.AppModules.User && window.AppModules.User.isAdmin()) {
            return true;
        }

        const uidLower = auth.currentUser.uid.toLowerCase();
        try {
            const snap = await get(ref(db, `user_image_index/${uidLower}`));
            const uploads = snap.val() || {};
            const keys = Object.keys(uploads);
            const currentTotalImages = keys.reduce((acc, k) => acc + (uploads[k].imgCount || 1), 0);

            if (currentTotalImages + files.length > 15) {
                const step1 = await window.AppModules.Modal.confirm(
                    "Storage Limit Reached",
                    `You currently have ${currentTotalImages} images saved. Sending these ${files.length} images will exceed your 15-image limit.`
                );
                if (!step1) return false;

                const step2 = await window.AppModules.Modal.confirm(
                    "Confirm Expiration",
                    "Are you REALLY sure? This will cause your oldest photos to be marked as expired and removed from the server history.",
                    "Yes, I'm Sure"
                );
                if (!step2) return false;

                const sortedKeys = keys.sort((a, b) => (uploads[a].timestamp || 0) - (uploads[b].timestamp || 0));
                let neededToDelete = (currentTotalImages + files.length) - 15;

                for (const k of sortedKeys) {
                    if (neededToDelete <= 0) break;
                    const item = uploads[k];
                    if (!item || !item.chatId || !item.msgKey) continue;
                    try {
                        await update(ref(db, `messages/${item.chatId}/${item.msgKey}`), {
                            text: "Image Expired",
                            type: "text",
                            isExpired: true
                        });
                        neededToDelete -= (item.imgCount || 1);
                    } catch (e) { }
                    await set(ref(db, `user_image_index/${uidLower}/${k}`), null);
                }
            }
            return true;
        } catch (err) {
            console.error("Security quota check failed:", err);
            return false;
        }
    },

    /**
     * Fetches user profile with Bot and Admin overrides.
     * Overrides safety_bot, advice_bot, and moss avatar with custom icons/properties.
     */
    async fetchUser(userId) {
        if (!userId) return null;
        const cleanedId = userId.toLowerCase();

        // 1. Bot Overrides
        if (cleanedId === SAFETY_BOT_ID) {
            return {
                id: SAFETY_BOT_ID,
                name: 'Safety Bot',
                avatar: 'https://cdn-icons-png.flaticon.com/512/1067/1067562.png'
            };
        }
        if (cleanedId === ADVICE_BOT_ID) {
            return {
                id: ADVICE_BOT_ID,
                name: 'Advice Bot',
                avatar: 'https://cdn-icons-png.flaticon.com/512/3260/3260831.png'
            };
        }

        // 2. Admin Overrides (Moss sushi avatar)
        if (cleanedId === 'moss104088' || cleanedId === 'admin_moss') {
            const adminUser = {
                id: 'moss104088',
                name: 'Moss',
                avatar: window.AppModules.Config.APP_CONSTANTS.SUSHI_AVATAR,
                email: window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL
            };
            window.ALL_USERS[cleanedId] = adminUser;
            return adminUser;
        }

        // 3. Check memory cache (ALL_USERS)
        if (window.ALL_USERS[cleanedId]) return window.ALL_USERS[cleanedId];

        // 4. Request Firebase database
        try {
            const snap = await get(ref(db, `users/${userId}`));
            if (snap.exists()) {
                window.ALL_USERS[cleanedId] = snap.val();
                return window.ALL_USERS[cleanedId];
            }
        } catch (err) {
            console.warn(`Failed to fetch user ${userId} in SecurityModule:`, err);
        }
        return null;
    },

    /**
     * Listens to the current user's profile database entry.
     * Force logs out if the user profile entry is deleted in the database.
     */
    initSecurityObserver() {
        if (!window.currentUser || !window.currentUser.id) return;

        console.log('Security: initSecurityObserver starting...');
        onValue(ref(db, `users/${window.currentUser.id}`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log('Security: Current user profile verified.');
                if (data.name) window.currentUser.name = data.name;
                window.currentUser.hasAcceptedTerms = data.hasAcceptedTerms || false;
                window.ALL_USERS[window.currentUser.id] = data;
            } else {
                console.warn('Security: User account deleted in database. Forcing logout.');
                if (window.clearAllLocalData) {
                    window.clearAllLocalData();
                }
            }
        });
    },

    /**
     * Updates news creation button visibility based on permission logic.
     */
    updateNewsAccess() {
        const isStaff = window.AppModules && window.AppModules.User && (window.AppModules.User.isTeacher() || window.AppModules.User.isAdmin());
        const setInlineAddVisible = (el, visible) => {
            if (!el) return;
            if (visible) el.classList.remove('is-hidden');
            else el.classList.add('is-hidden');
        };
        
        // Desktop plus button
        const btn = document.getElementById('addAnnouncementBtn');
        if (btn) {
            btn.classList.add('hidden');
        }

        // Mobile plus buttons inside sub-tabs
        const schoolAddBtn = document.getElementById('btnSchoolNewsAdd');
        const clubAddBtn = document.getElementById('btnClubNewsAdd');
        if (schoolAddBtn && clubAddBtn) {
            const currentTab = (window.AppModules && window.AppModules.News && typeof window.AppModules.News.getCurrentNewsTab === 'function')
                ? (window.AppModules.News.getCurrentNewsTab() || 'school')
                : 'school';

            if (isStaff) {
                if (currentTab === 'school') {
                    setInlineAddVisible(schoolAddBtn, true);
                    setInlineAddVisible(clubAddBtn, false);
                } else if (currentTab === 'club') {
                    setInlineAddVisible(schoolAddBtn, false);
                    setInlineAddVisible(clubAddBtn, true);
                } else {
                    setInlineAddVisible(schoolAddBtn, false);
                    setInlineAddVisible(clubAddBtn, false);
                }
            } else {
                setInlineAddVisible(schoolAddBtn, false);
                setInlineAddVisible(clubAddBtn, false);
            }
        }
    },

    /**
     * Report offensive/inappropriate chat messages
     */
    async reportMessage(msg) {
        try {
            const adminId = window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');

            // 1. Send report details to Admin chat
            const adminChatId = getChatId(SAFETY_BOT_ID, adminId);
            const reportText = `[REPORT - MESSAGE]\nFrom: ${msg.senderName} (${msg.senderId})\nReported by: ${window.currentUser.name} (${window.currentUser.id})\nContent: ${msg.text}\nReason: User reported harassment.`;
            await push(ref(db, `messages/${adminChatId}`), {
                senderId: SAFETY_BOT_ID,
                senderName: 'Safety Bot',
                text: reportText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            await update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

            // 2. Send receipt confirmation to Reporter
            const userChatId = getChatId(SAFETY_BOT_ID, window.currentUser.id);
            const confirmationText = `[REPORT - MESSAGE - SUCCESSFUL]\nYour report regarding message "${msg.text}" has been received. Our administration will review it shortly. Thank you for keeping our community safe.`;
            await push(ref(db, `messages/${userChatId}`), {
                senderId: SAFETY_BOT_ID,
                senderName: 'Safety Bot',
                text: confirmationText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            await update(ref(db, `user_chats/${window.currentUser.id.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

            window.AppModules.Modal.alert("Reported", "Report sent successfully. You can track status in your chat with Safety Bot.");
        } catch (e) {
            window.AppModules.Modal.alert("Error", "Failed to send report: " + e.message);
        }
    },

    /**
     * Report inappropriate forum posts
     */
    async reportPost(postId) {
        const adminId = window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');
        const post = window.modulePosts ? window.modulePosts.find(p => p.id === postId) : null;
        if (!post) return;

        const author = await SecurityModule.fetchUser(post.authorId);
        const receiverName = author?.name || 'Unknown';

        try {
            // 1. Notify Admin
            const adminChatId = getChatId(SAFETY_BOT_ID, adminId);
            const reportText = `[REPORT - POST]\nModule: ${window.currentModule}\nSubject: ${post.title}\nContent: ${post.desc}\nAuthor: ${receiverName} (${post.authorId})\nReported by: ${window.currentUser.name} (${window.currentUser.id})`;
            await push(ref(db, `messages/${adminChatId}`), {
                senderId: SAFETY_BOT_ID,
                senderName: 'Safety Bot',
                text: reportText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            await update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

            // 2. Notify Reporter
            const userChatId = getChatId(SAFETY_BOT_ID, window.currentUser.id);
            const confirmText = `[REPORT - POST - SUCCESSFUL]\nYour report regarding the post "${post.title}" has been submitted. Thank you.`;
            await push(ref(db, `messages/${userChatId}`), {
                senderId: SAFETY_BOT_ID,
                senderName: 'Safety Bot',
                text: confirmText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            await update(ref(db, `user_chats/${window.currentUser.id.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

            window.AppModules.Modal.alert("Reported", "Post reported successfully! Administrators will review it via Safety Bot.");
        } catch (e) {
            window.AppModules.Modal.alert("Error", "Reporting failed: " + e.message);
        }
    }
};

// Expose standard hooks on window to bypass inline HTML event handlers
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Security = SecurityModule;
    window.fetchUser = SecurityModule.fetchUser;
    window.reportPost = SecurityModule.reportPost;
    window.reportMessage = SecurityModule.reportMessage;
}
