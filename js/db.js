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
 * 
 * 【成员清单 & 使用手册 (共 20 项)】：
 * 
 * 1. initCloudRefs(instances) [核心注入]
 *    - 【输入】：instances (Object: {db, auth, storage})。
 *    - 【存在理由】：遵循“单一实例”原则，由主入口初始化后注入。
 * 
 * 2. PATHS (Object) [路径字典]
 *    - 【包含】：user, userPrivate, news, settings, chats, messages。
 *    - 【存在理由】：全站路径统一定义中心。
 * 
 * 3. CloudDB._check() [私有防御]
 *    - 【存在理由】：确保数据库接通前操作报错，防止静默失败。
 * 
 * 4. CloudDB._db() [私有引用]
 *    - 【返回】：Firebase Database 实例。
 * 
 * 5. CloudDB.get(path) [原子读取]
 *    - 【输入】：path (String)。【返回】：Promise(Any)。
 * 
 * 6. CloudDB.set(path, data) [原子写入]
 *    - 【输入】：path (String)；data (Any)。
 * 
 * 7. CloudDB.update(path, data) [局部更新]
 * 
 * 8. CloudDB.push(path, data) [序列推入]
 *    - 【返回】：Promise(String: newKey)。
 * 
 * 9. CloudDB.remove(path) [原子删除]
 * 
 * 10. CloudDB.serverTime() [系统时间]
 *     - 【返回】：Firebase.ServerTimestamp。
 * 
 * 11. initLocalDB() [本地库启动]
 *     - 【返回】：Promise(IDBDatabase)。
 * 
 * 12. getLastKey(storeName, indexName, indexValue) [增量同步辅助]
 *     - 【输入】：storeName, indexName, indexValue。【返回】：Promise(Number: timestamp)。
 *     - 【存在理由】：查询本地最后记录时间，实现极速同步。
 * 
 * 13. saveMessageLocal(chatId, msgId, data) [本地持久化]
 * 
 * 14. getLocalMessages(chatId) [本地读取]
 * 
 * 15. saveNewsItemLocal(tabType, key, data) [本地持久化]
 * 
 * 16. getLocalNews(tabType) [本地读取]
 * 
 * 17. reconcileNews() [同步逻辑桩]
 * 
 * 18. saveModulePostLocal() [占位桩]
 * 
 * 19. getLocalModulePosts() [占位桩]
 * 
 * 20. saveLocalNews() [占位桩]
 *     - 【注】：占位桩确保重构期间旧逻辑不崩溃。
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
