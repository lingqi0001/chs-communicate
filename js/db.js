/**
 * ==================================================================================
 * 模块名称：DBModule (全站数据中枢)
 * 目标文件：js/db.js
 * 
 * 【设计哲学】：
 * 本模块是全站的“心脏”，负责打通云端 (Firebase) 与本地 (IndexedDB) 的数据流。
 * 它通过 CloudDB 命名空间封装了所有云端原子操作，确保业务层不需要关心 Firebase
 * 的底层引用。同时，它管理的 LocalDB 引擎保证了在弱网或离线状态下，用户依然能
 * 秒开已加载过的消息和公告。
 * ==================================================================================
 */

import { getDatabase, ref, get, set, update, push, remove, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. 云端实例占位与注入 ---
export let db, auth, storage;
let isInitialized = false;

export const initCloudRefs = (instances) => {
    db = instances.db;
    auth = instances.auth;
    storage = instances.storage;
    isInitialized = true;
};

// --- 2. 全站路径字典 (PATHS) ---
export const PATHS = {
    user: (uid) => `users/${uid}`,
    userPrivate: (uid) => `user_private/${uid}`,
    news: (type) => `news/${type}`,
    settings: 'settings',
    chats: 'user_chats',
    messages: (chatId) => `messages/${chatId}`
};

// --- 3. 云端原子操作封装 (CloudDB) ---
export const CloudDB = {
    _check() {
        if (!isInitialized || !db) throw new Error("CloudDB: Not initialized.");
    },
    _db() { this._check(); return db; },
    async get(path) {
        this._check();
        const reference = (typeof path === 'string') ? ref(db, path) : path;
        const snapshot = await get(reference);
        return snapshot.exists() ? snapshot.val() : null;
    },
    async set(path, data) {
        this._check();
        const reference = (typeof path === 'string') ? ref(db, path) : path;
        return set(reference, data);
    },
    async update(path, data) {
        this._check();
        const reference = (typeof path === 'string') ? ref(db, path) : path;
        return update(reference, data);
    },
    async push(path, data) {
        this._check();
        const reference = (typeof path === 'string') ? ref(db, path) : path;
        const newRef = push(reference);
        if (data) await set(newRef, data);
        return newRef.key;
    },
    async remove(path) {
        this._check();
        const reference = (typeof path === 'string') ? ref(db, path) : path;
        return remove(reference);
    },
    serverTime() { return serverTimestamp(); }
};

// --- 4. 本地缓存引擎逻辑 (IndexedDB) ---
export let localDB;

export function initLocalDB() {
    return new Promise((resolve) => {
        const dbReq = indexedDB.open("CHSChatCache", 4);

        dbReq.onupgradeneeded = (e) => {
            const db = e.target.result;

            // 1. 消息表优化
            if (!db.objectStoreNames.contains("messages")) {
                const msgStore = db.createObjectStore("messages", { keyPath: "compositeId" });
                msgStore.createIndex("chatId", "chatId", { unique: false });
                msgStore.createIndex("timestamp", "timestamp", { unique: false });
            } else {
                const msgStore = e.currentTarget.transaction.objectStore("messages");
                if (!msgStore.indexNames.contains("chatId")) msgStore.createIndex("chatId", "chatId", { unique: false });
                if (!msgStore.indexNames.contains("timestamp")) msgStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // 2. 新闻表优化
            if (!db.objectStoreNames.contains("news")) {
                const newsStore = db.createObjectStore("news", { keyPath: "compositeId" });
                newsStore.createIndex("tabType", "tabType", { unique: false });
                newsStore.createIndex("timestamp", "timestamp", { unique: false });
            } else {
                const newsStore = e.currentTarget.transaction.objectStore("news");
                if (!newsStore.indexNames.contains("tabType")) newsStore.createIndex("tabType", "tabType", { unique: false });
                if (!newsStore.indexNames.contains("timestamp")) newsStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // 3. 社交模块表
            if (!db.objectStoreNames.contains("modules")) {
                const modStore = db.createObjectStore("modules", { keyPath: "id" });
                modStore.createIndex("moduleName", "moduleName", { unique: false });
                modStore.createIndex("timestamp", "timestamp", { unique: false });
            } else {
                const modStore = e.currentTarget.transaction.objectStore("modules");
                if (!modStore.indexNames.contains("moduleName")) modStore.createIndex("moduleName", "moduleName", { unique: false });
                if (!modStore.indexNames.contains("timestamp")) modStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };

        dbReq.onsuccess = (e) => { localDB = e.target.result; resolve(localDB); };
        dbReq.onerror = () => { console.error("IDB Error"); resolve(null); };
    });
}

export const dbReady = initLocalDB();

// --- 5. 恢复丢失的 IndexedDB 辅助函数 ---

export async function getLastKey(storeName, indexName, indexValue) {
    const db = await dbReady;
    if (!db) return null;
    return new Promise((resolve) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.openCursor(IDBKeyRange.only(indexValue), "prev");
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            resolve(cursor ? cursor.primaryKey : null);
        };
    });
}

export async function saveMessageLocal(chatId, msgId, messageData) {
    const db = await dbReady;
    if (!db) return;
    const transaction = db.transaction(["messages"], "readwrite");
    const store = transaction.objectStore("messages");
    store.put({ compositeId: `${chatId}_${msgId}`, chatId, ...messageData });
}

export async function getLocalMessages(chatId) {
    const db = await dbReady;
    if (!db) return [];
    return new Promise((resolve) => {
        const transaction = db.transaction(["messages"], "readonly");
        const store = transaction.objectStore("messages");
        const index = store.index("chatId");
        const request = index.getAll(IDBKeyRange.only(chatId));
        request.onsuccess = (e) => resolve(e.target.result || []);
    });
}

export async function isMessagesCacheEmpty() {
    const db = await dbReady;
    if (!db) return true;
    return new Promise((resolve) => {
        const transaction = db.transaction(["messages"], "readonly");
        const store = transaction.objectStore("messages");
        const request = store.count();
        request.onsuccess = () => resolve(request.result === 0);
        request.onerror = () => resolve(true);
    });
}

export async function saveNewsItemLocal(tabType, key, data) {
    const db = await dbReady;
    if (!db) return;
    const transaction = db.transaction(["news"], "readwrite");
    const store = transaction.objectStore("news");
    store.put({ compositeId: `${tabType}_${key}`, tabType, key, ...data });
}

export async function deleteNewsItemLocal(tabType, key) {
    const db = await dbReady;
    if (!db) return;
    return new Promise((resolve) => {
        const transaction = db.transaction(["news"], "readwrite");
        const store = transaction.objectStore("news");
        const request = store.delete(`${tabType}_${key}`);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
    });
}

export async function getLocalNews(tabType) {
    const db = await dbReady;
    if (!db) return [];
    return new Promise((resolve) => {
        const transaction = db.transaction(["news"], "readonly");
        const store = transaction.objectStore("news");
        const index = store.index("tabType");
        const request = index.getAll(IDBKeyRange.only(tabType));
        request.onsuccess = (e) => resolve(e.target.result || []);
    });
}

// reconcileNews 已迁移至 js/sync.js

export async function saveModulePostLocal(moduleName, postId, data) {
    console.log(`[DEBUG] DB: Attempting to save to modules store. ID=${postId}, Module=${moduleName}`);
    try {
        const db = await dbReady;
        if (!db) return;
        const transaction = db.transaction(["modules"], "readwrite");
        const store = transaction.objectStore("modules");
        store.put({ ...data, moduleName, id: postId });
    } catch (e) {
        console.error(`DB: Failed to save module post [${postId}]:`, e);
    }
}

export async function getLocalModulePosts(moduleName) {
    const db = await dbReady;
    if (!db) return [];
    return new Promise((resolve) => {
        const transaction = db.transaction(["modules"], "readonly");
        const store = transaction.objectStore("modules");
        const index = store.index("moduleName");
        const request = index.getAll(IDBKeyRange.only(moduleName));
        request.onsuccess = (e) => resolve(e.target.result || []);
    });
}

export const saveLocalNews = async (tabType, posts = []) => {
    if (!Array.isArray(posts) || !tabType) return;
    const tasks = posts.map((post) => {
        const key = post.id || post.key;
        if (!key) return Promise.resolve();
        return saveNewsItemLocal(tabType, key, post);
    });
    await Promise.all(tasks);
};

// 统一导出模块 (Namespace Bridge)
export const DBModule = {
    initCloudRefs,
    get: CloudDB.get.bind(CloudDB),
    set: CloudDB.set.bind(CloudDB),
    update: CloudDB.update.bind(CloudDB),
    push: CloudDB.push.bind(CloudDB),
    remove: CloudDB.remove.bind(CloudDB),
    serverTime: CloudDB.serverTime.bind(CloudDB),
    PATHS,
    Local: {
        getLastKey,
        saveMessage: saveMessageLocal,
        getMessages: getLocalMessages,
        isMessagesCacheEmpty,
        saveNews: saveNewsItemLocal,
        deleteNews: deleteNewsItemLocal,
        getNews: getLocalNews,
        saveModulePost: saveModulePostLocal,
        getModulePosts: getLocalModulePosts
    }
};
