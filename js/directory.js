/**
 * ==================================================================================
 * Module: window.Directory (js/directory.js)
 * ==================================================================================
 * The offline index. IndexedDB (js/db.js) already keeps message, announcement and
 * module bodies, but nothing kept the list of WHICH chats and classes exist, so an
 * offline boot had cached messages it could never reach. This module stores that
 * index in localStorage: small, synchronous, and readable before Firebase wakes up.
 */

const DIR_KEY = 'chs_dir_cache';
const LAST_CHAT_KEY = 'chs_last_chat';
const MAX_USERS = 120;

function readAll() {
    try {
        const raw = localStorage.getItem(DIR_KEY);
        const data = raw ? JSON.parse(raw) : null;
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

function writeAll(data) {
    try {
        localStorage.setItem(DIR_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('[Directory] Cache write failed:', e.message);
    }
}

// Keeps the user map bounded: newest entries win, so the chats a student actually
// uses are the ones that survive.
function trimUsers(users) {
    const ids = Object.keys(users);
    if (ids.length <= MAX_USERS) return users;
    const trimmed = {};
    ids.slice(-MAX_USERS).forEach(id => { trimmed[id] = users[id]; });
    return trimmed;
}

export const DirectoryModule = {
    /** Recent/DM list: { chatId: lastActivity } straight from user_chats/{uid}. */
    saveChats(chatMap) {
        if (!chatMap || typeof chatMap !== 'object') return;
        const data = readAll();
        data.chats = chatMap;
        writeAll(data);
    },

    /**
     * Class rows, stored in the shape renderClassLevel1 already expects so the
     * online and offline paths share one renderer. Membership is reduced to the
     * owner of this cache: whose browser it is, is decided by who wrote it.
     */
    saveClasses(classes, uid) {
        if (!Array.isArray(classes) || !uid) return;
        const data = readAll();
        data.classes = {};
        classes.forEach(c => {
            if (!c || !c.id || !c.name) return;
            data.classes[c.id] = {
                name: c.name,
                teacherId: c.teacherId || null,
                students: { [uid.toLowerCase()]: true }
            };
        });
        writeAll(data);
    },

    /** Names/avatars for the people and bots in the list. */
    saveUsers(userMap) {
        if (!userMap || typeof userMap !== 'object') return;
        const data = readAll();
        const merged = { ...(data.users || {}) };
        Object.keys(userMap).forEach(id => {
            const u = userMap[id];
            if (!u || !u.name) return;
            merged[id] = {
                id: u.id || id,
                name: u.name,
                email: u.email || null,
                avatar: u.avatar || null,
                role: u.role || null,
                lastSeen: u.lastSeen || null
            };
        });
        data.users = trimUsers(merged);
        writeAll(data);
    },

    chats() {
        return readAll().chats || {};
    },

    classes() {
        return readAll().classes || {};
    },

    /** Seeds window.ALL_USERS so the existing renderers resolve names offline. */
    hydrateAllUsers() {
        const users = readAll().users || {};
        if (!window.ALL_USERS) window.ALL_USERS = {};
        Object.keys(users).forEach(id => {
            if (!window.ALL_USERS[id] || !window.ALL_USERS[id].name) {
                window.ALL_USERS[id] = users[id];
            }
        });
        return users;
    },

    rememberLastChat(chatId) {
        if (!chatId) return;
        try { localStorage.setItem(LAST_CHAT_KEY, chatId); } catch (e) { }
    },

    lastChat() {
        try { return localStorage.getItem(LAST_CHAT_KEY); } catch (e) { return null; }
    },

    /** Shared machines: the index must not outlive the session. */
    clear() {
        try {
            localStorage.removeItem(DIR_KEY);
            localStorage.removeItem(LAST_CHAT_KEY);
        } catch (e) { }
    }
};

window.Directory = DirectoryModule;
