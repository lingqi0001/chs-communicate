/**
 * js/db.js
 * 本地存储与同步引擎 (Storage & Sync Engine)
 * 
 * [职责] 
 * 管理 IndexedDB 缓存，实现离线消息读取、新闻智能同步。
 * 
 * [包含函数清单]
 * 1. initLocalDB(): [基础] 数据库初始化与表结构定义。
 * 2. saveMessageLocal(chatId, key, msg): [消息] 缓存单条聊天消息。
 * 3. getLocalMessages(chatId): [消息] 获取特定聊天室的本地历史。
 * 4. saveModulePostLocal(moduleName, key, post): [功能] 缓存模块帖子。
 * 5. saveNewsItemLocal(tab, key, item): [新闻] 缓存单条公告。
 * 6. saveLocalNews(tab, posts): [新闻] 批量写入公告。
 * 7. getLocalNews(tab): [新闻] 获取本地分类公告。
 * 8. getLastKey(store, indexName, val): [工具] 获取本地最后一条数据的 ID。
 * 9. reconcileNews(tab, remoteData, localKeys): [同步] 云端与本地数据对齐算法。
 * 10. getLocalModulePosts(moduleName): [功能] 读取模块历史。
 */

export let localDB;

/**
 * [核心初始化] initLocalDB
 * 负责数据库的打开、版本管理及表结构定义
 */
export function initLocalDB() {
    return new Promise((resolve) => {
        // 设置 10 秒超时保护
        const timeout = setTimeout(() => {
            console.warn("DB Ready timeout (10s) - Falling back to no-cache mode");
            resolve(null);
        }, 10000);

        const dbReq = indexedDB.open("CHSChatCache", 2);

        dbReq.onblocked = () => {
            console.warn("DB Open Blocked. Please close other tabs.");
            clearTimeout(timeout);
            resolve(null);
        };

        // 数据库骨架定义 (Schema Definition)
        dbReq.onupgradeneeded = (e) => {
            const db = e.target.result;
            // 1. 聊天消息库
            if (!db.objectStoreNames.contains("messages")) {
                const store = db.createObjectStore("messages", { keyPath: "compositeId" });
                store.createIndex("chatId", "chatId", { unique: false });
            }
            // 2. 功能模块内容库
            if (!db.objectStoreNames.contains("modules")) {
                const store = db.createObjectStore("modules", { keyPath: "compositeId" });
                store.createIndex("moduleName", "moduleName", { unique: false });
            }
            // 3. 校园公告/新闻库
            if (!db.objectStoreNames.contains("news")) {
                const store = db.createObjectStore("news", { keyPath: "compositeId" });
                store.createIndex("tabType", "tabType", { unique: false });
            }
        };

        dbReq.onsuccess = (e) => {
            clearTimeout(timeout);
            localDB = e.target.result;
            localDB.onversionchange = () => {
                localDB.close();
                localDB = null;
                dbReady = initLocalDB();
            };
            resolve(localDB);
        };

        dbReq.onerror = (e) => {
            console.error("DB Open Error:", e.target.error);
            clearTimeout(timeout);
            resolve(null);
        };
    });
}

// 初始化状态锁
export let dbReady = initLocalDB();

/**
 * [本地消息持久化] saveMessageLocal
 */
export async function saveMessageLocal(chatId, key, msg) {
    if (!localDB) await dbReady;
    if (!localDB) return;

    try {
        const tx = localDB.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        store.put({ compositeId: `${chatId}_${key}`, chatId, key, ...msg });
    } catch (e) {
        console.warn("DB Save failed (Message):", e);
        if (e.name === 'InvalidStateError') {
            localDB = null;
            dbReady = initLocalDB();
        }
    }
}

/**
 * [读取消息] getLocalMessages
 */
export async function getLocalMessages(chatId) {
    if (!localDB) await dbReady;
    return new Promise((resolve) => {
        try {
            if (!localDB) return resolve([]);
            const tx = localDB.transaction("messages", "readonly");
            const store = tx.objectStore("messages");
            const index = store.index("chatId");
            const request = index.getAll(IDBKeyRange.only(chatId));
            request.onsuccess = () => {
                const msgs = request.result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                resolve(msgs);
            };
            request.onerror = () => resolve([]);
        } catch (e) {
            console.warn("DB Transaction failed (Messages):", e);
            if (e.name === 'InvalidStateError') {
                localDB = null;
                dbReady = initLocalDB();
            }
            resolve([]);
        }
    });
}

/**
 * [缓存模块帖子] saveModulePostLocal
 */
export async function saveModulePostLocal(moduleName, key, post) {
    if (!localDB) await dbReady;
    if (!localDB) return;

    try {
        const tx = localDB.transaction("modules", "readwrite");
        const store = tx.objectStore("modules");
        store.put({ compositeId: `${moduleName}_${key}`, moduleName, key, ...post });
    } catch (e) {
        console.warn("DB Save failed (Module Post):", e);
        if (e.name === 'InvalidStateError') {
            localDB = null;
            dbReady = initLocalDB();
        }
    }
}

/**
 * [缓存单条新闻] saveNewsItemLocal
 */
export async function saveNewsItemLocal(tabType, key, item) {
    if (!localDB) await dbReady;
    if (!localDB) return;

    try {
        const tx = localDB.transaction("news", "readwrite");
        const store = tx.objectStore("news");
        store.put({ compositeId: `${tabType}_${key}`, tabType, key, ...item });
    } catch (e) {
        console.warn("DB Save failed (News Item):", e);
        if (e.name === 'InvalidStateError') {
            localDB = null;
            dbReady = initLocalDB();
        }
    }
}

/**
 * [批量缓存新闻] saveLocalNews
 */
export async function saveLocalNews(tabType, posts) {
    if (!localDB) await dbReady;
    if (!localDB) return;
    try {
        const tx = localDB.transaction("news", "readwrite");
        const store = tx.objectStore("news");
        posts.forEach(post => {
            store.put({ compositeId: `${tabType}_${post.key}`, tabType, key: post.key, ...post });
        });
    } catch (e) {
        console.warn("DB Save failed (Batch News):", e);
    }
}

/**
 * [获取新闻缓存] getLocalNews
 */
export async function getLocalNews(tabType) {
    if (!localDB) await dbReady;
    return new Promise((resolve) => {
        try {
            if (!localDB) return resolve([]);
            const tx = localDB.transaction("news", "readonly");
            const store = tx.objectStore("news");
            const index = store.index("tabType");
            const request = index.getAll(IDBKeyRange.only(tabType));
            request.onsuccess = () => {
                const msgs = request.result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                resolve(msgs);
            };
            request.onerror = () => resolve([]);
        } catch (e) {
            console.warn("DB Transaction failed (News):", e);
            if (e.name === 'InvalidStateError') {
                localDB = null;
                dbReady = initLocalDB();
            }
            resolve([]);
        }
    });
}

/**
 * [游标辅助] getLastKey
 */
export async function getLastKey(storeName, indexName, indexValue) {
    if (!localDB) await dbReady;
    return new Promise((resolve) => {
        try {
            if (!localDB) return resolve(null);
            const tx = localDB.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(IDBKeyRange.only(indexValue));
            request.onsuccess = () => {
                const items = request.result.sort((a, b) => a.key.localeCompare(b.key));
                resolve(items.length > 0 ? items[items.length - 1].key : null);
            };
            request.onerror = () => resolve(null);
        } catch (e) {
            console.warn("DB Transaction failed (LastKey):", e);
            if (e.name === 'InvalidStateError') {
                localDB = null;
                dbReady = initLocalDB();
            }
            resolve(null);
        }
    });
}

/**
 * [高阶抽象：同步对齐] reconcileNews
 * 作用：将远程获取的全量新闻数据，一次性同步到本地。
 * 处理逻辑：
 * 1. 批量写入远程数据（Put）
 * 2. 对比本地旧数据，如果远程已删除，则同步删除本地（Reconcile）
 * 
 * @param {string} tab - 新闻分类 ('school' 或 'club')
 * @param {Object} remoteData - 从 Firebase 获取的原始 JSON 对象 { key: {title, ...} }
 * @param {Array} localKeys - 本地数据库中当前已有的 Key 列表
 * @returns {Promise<void>}
 * 
 * 调用示例: await reconcileNews('school', remoteSnap.val(), ['key1', 'key2'])
 */
export async function reconcileNews(tab, remoteData, localKeys) {
    if (!localDB) await dbReady;
    if (!localDB) return;

    return new Promise((resolve, reject) => {
        try {
            const tx = localDB.transaction("news", "readwrite");
            const store = tx.objectStore("news");
            const remoteKeys = Object.keys(remoteData || {});

            // 1. 增量/更新写入
            remoteKeys.forEach(key => {
                store.put({
                    compositeId: `${tab}_${key}`,
                    tabType: tab,
                    key: key,
                    ...remoteData[key]
                });
            });

            // 2. 清理远程已不存在的“僵尸数据”
            localKeys.forEach(k => {
                if (!remoteKeys.includes(k)) {
                    store.delete(`${tab}_${k}`);
                }
            });

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        } catch (e) {
            console.error("DB Reconcile failed:", e);
            reject(e);
        }
    });
}

/**
 * [获取模块缓存列表] getLocalModulePosts
 */
export async function getLocalModulePosts(moduleName) {
    if (!localDB) await dbReady;
    return new Promise((resolve) => {
        if (!localDB) return resolve([]);
        try {
            const tx = localDB.transaction("modules", "readonly");
            const store = tx.objectStore("modules");
            const index = store.index("moduleName");
            const request = index.getAll(IDBKeyRange.only(moduleName));
            request.onsuccess = () => {
                const msgs = request.result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                resolve(msgs);
            };
            request.onerror = () => resolve([]);
        } catch (e) {
            console.warn("DB Transaction failed (Module Posts):", e);
            if (e.name === 'InvalidStateError') {
                localDB = null;
                dbReady = initLocalDB();
            }
            resolve([]);
        }
    });
}
