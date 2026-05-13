/**
 * js/db.js
 * 数据中枢 1.0 (Data Hub)
 * [职责] 统一管理本地 IndexedDB 缓存与云端 Firebase 数据读写。
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
        const snapshot = await get(ref(db, path));
        return snapshot.exists() ? snapshot.val() : null;
    },
    async set(path, data) {
        this._check();
        return set(ref(db, path), data);
    },
    async update(path, data) {
        this._check();
        return update(ref(db, path), data);
    },
    async push(path, data) {
        this._check();
        const newRef = push(ref(db, path));
        if (data) await set(newRef, data);
        return newRef.key;
    },
    async remove(path) {
        this._check();
        return remove(ref(db, path));
    },
    serverTime() { return serverTimestamp(); }
};

// --- 4. 本地缓存引擎逻辑 (IndexedDB) ---
export let localDB;

export function initLocalDB() {
    return new Promise((resolve) => {
        const dbReq = indexedDB.open("CHSChatCache", 2);
        dbReq.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("messages")) db.createObjectStore("messages", { keyPath: "compositeId" });
            if (!db.objectStoreNames.contains("news")) db.createObjectStore("news", { keyPath: "compositeId" });
        };
        dbReq.onsuccess = (e) => { localDB = e.target.result; resolve(localDB); };
        dbReq.onerror = () => resolve(null);
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
            resolve(cursor ? cursor.value.timestamp : 0);
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

export async function saveNewsItemLocal(tabType, key, data) {
    const db = await dbReady;
    if (!db) return;
    const transaction = db.transaction(["news"], "readwrite");
    const store = transaction.objectStore("news");
    store.put({ compositeId: `${tabType}_${key}`, tabType, key, ...data });
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

// 占位函数，确保主文件导入不报错
export const reconcileNews = async () => { console.log("DB: reconcileNews placeholder"); };
export const saveModulePostLocal = async () => {};
export const getLocalModulePosts = async () => [];
export const saveLocalNews = async () => {};

// 统一导出
export const DBModule = {
    Cloud: CloudDB,
    Paths: PATHS,
    Local: {
        getLastKey,
        saveMessage: saveMessageLocal,
        getMessages: getLocalMessages,
        saveNews: saveNewsItemLocal,
        getNews: getLocalNews
    }
};
