/**
 * ==================================================================================
 * 妯″潡鍚嶇О锛欴BModule (鍏ㄧ珯鏁版嵁涓灑)
 * 鐩爣鏂囦欢锛歫s/db.js
 * 
 * 銆愯璁″摬瀛︺€戯細
 * 鏈ā鍧楁槸鍏ㄧ珯鐨勨€滃績鑴忊€濓紝璐熻矗鎵撻€氫簯锟?(Firebase) 涓庢湰锟?(IndexedDB) 鐨勬暟鎹祦锟? * 瀹冮€氳繃 CloudDB 鍛藉悕绌洪棿灏佽浜嗘墍鏈変簯绔師瀛愭搷浣滐紝纭繚涓氬姟灞備笉闇€瑕佸叧锟?Firebase
 * 鐨勫簳灞傚紩鐢ㄣ€傚悓鏃讹紝瀹冪鐞嗙殑 LocalDB 寮曟搸淇濊瘉浜嗗湪寮辩綉鎴栫绾跨姸鎬佷笅锛岀敤鎴蜂緷鐒惰兘
 * 绉掑紑宸插姞杞借繃鐨勬秷鎭拰鍏憡锟? * 
 * 銆愭垚鍛樻竻锟?& 浣跨敤鎵嬪唽 (锟?20 锟?銆戯細
 * 
 * 1. initCloudRefs(instances) [鏍稿績娉ㄥ叆]
 *    - 銆愯緭鍏ャ€戯細instances (Object: {db, auth, storage})锟? *    - 銆愬瓨鍦ㄧ悊鐢便€戯細閬靛惊鈥滃崟涓€瀹炰緥鈥濆師鍒欙紝鐢变富鍏ュ彛鍒濆鍖栧悗娉ㄥ叆锟? * 
 * 2. PATHS (Object) [璺緞瀛楀吀]
 *    - 銆愬寘鍚€戯細user, userPrivate, news, settings, chats, messages锟? *    - 銆愬瓨鍦ㄧ悊鐢便€戯細鍏ㄧ珯璺緞缁熶竴瀹氫箟涓績锟? * 
 * 3. CloudDB._check() [绉佹湁闃插尽]
 *    - 銆愬瓨鍦ㄧ悊鐢便€戯細纭繚鏁版嵁搴撴帴閫氬墠鎿嶄綔鎶ラ敊锛岄槻姝㈤潤榛樺け璐ワ拷? * 
 * 4. CloudDB._db() [绉佹湁寮曠敤]
 *    - 銆愯繑鍥炪€戯細Firebase Database 瀹炰緥锟? * 
 * 5. CloudDB.get(path) [鍘熷瓙璇诲彇]
 *    - 銆愯緭鍏ャ€戯細path (String)銆傘€愯繑鍥炪€戯細Promise(Any)锟? * 
 * 6. CloudDB.set(path, data) [鍘熷瓙鍐欏叆]
 *    - 銆愯緭鍏ャ€戯細path (String)锛沝ata (Any)锟? * 
 * 7. CloudDB.update(path, data) [灞€閮ㄦ洿鏂癩
 * 
 * 8. CloudDB.push(path, data) [搴忓垪鎺ㄥ叆]
 *    - 銆愯繑鍥炪€戯細Promise(String: newKey)锟? * 
 * 9. CloudDB.remove(path) [鍘熷瓙鍒犻櫎]
 * 
 * 10. CloudDB.serverTime() [绯荤粺鏃堕棿]
 *     - 銆愯繑鍥炪€戯細Firebase.ServerTimestamp锟? * 
 * 11. initLocalDB() [鏈湴搴撳惎鍔╙
 *     - 銆愯繑鍥炪€戯細Promise(IDBDatabase)锟? * 
 * 12. getLastKey(storeName, indexName, indexValue) [澧為噺鍚屾杈呭姪]
 *     - 銆愯緭鍏ャ€戯細storeName, indexName, indexValue銆傘€愯繑鍥炪€戯細Promise(Number: timestamp)锟? *     - 銆愬瓨鍦ㄧ悊鐢便€戯細鏌ヨ鏈湴鏈€鍚庤褰曟椂闂达紝瀹炵幇鏋侀€熷悓姝ワ拷? * 
 * 13. saveMessageLocal(chatId, msgId, data) [鏈湴鎸佷箙鍖朷
 * 
 * 14. getLocalMessages(chatId) [鏈湴璇诲彇]
 * 
 * 15. saveNewsItemLocal(tabType, key, data) [鏈湴鎸佷箙鍖朷
 * 
 * 16. getLocalNews(tabType) [鏈湴璇诲彇]
 * 
 * 17. reconcileNews() [鍚屾閫昏緫妗
 * 
 * 18. saveModulePostLocal() [鍗犱綅妗
 * 
 * 19. getLocalModulePosts() [鍗犱綅妗
 * 
 * 20. saveLocalNews() [鍗犱綅妗
 *     - 銆愭敞銆戯細鍗犱綅妗╃‘淇濋噸鏋勬湡闂存棫閫昏緫涓嶅穿婧冿拷? * ==================================================================================
 */

import { getDatabase, ref, get, set, update, push, remove, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. 浜戠瀹炰緥鍗犱綅涓庢敞锟?---
export let db, auth, storage;
let isInitialized = false;

export const initCloudRefs = (instances) => {
    db = instances.db;
    auth = instances.auth;
    storage = instances.storage;
    isInitialized = true;
};

// --- 2. 鍏ㄧ珯璺緞瀛楀吀 (PATHS) ---
export const PATHS = {
    user: (uid) => `users/${uid}`,
    userPrivate: (uid) => `user_private/${uid}`,
    news: (type) => `news/${type}`,
    settings: 'settings',
    chats: 'user_chats',
    messages: (chatId) => `messages/${chatId}`
};

// --- 3. 浜戠鍘熷瓙鎿嶄綔灏佽 (CloudDB) ---
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

// --- 4. 鏈湴缂撳瓨寮曟搸閫昏緫 (IndexedDB) ---
export let localDB;

export function initLocalDB() {
    return new Promise((resolve) => {
        // 鍗囩骇鐗堟湰?4锛屽?modules 瀛樺偍?
        const dbReq = indexedDB.open("CHSChatCache", 4);

        dbReq.onupgradeneeded = (e) => {
            const db = e.target.result;

            // 1. 娑堟伅琛ㄤ紭?            
            if (!db.objectStoreNames.contains("messages")) {
                const msgStore = db.createObjectStore("messages", { keyPath: "compositeId" });
                msgStore.createIndex("chatId", "chatId", { unique: false });
                msgStore.createIndex("timestamp", "timestamp", { unique: false });
            } else {
                // 濡傛灉琛ㄥ凡瀛樺湪浣嗙储寮曚涪澶憋紙琛ユ晳閫昏緫?                
                const msgStore = e.currentTarget.transaction.objectStore("messages");
                if (!msgStore.indexNames.contains("chatId")) msgStore.createIndex("chatId", "chatId", { unique: false });
                if (!msgStore.indexNames.contains("timestamp")) msgStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // 2. 鏂伴椈琛ㄤ紭?            
            if (!db.objectStoreNames.contains("news")) {
                const newsStore = db.createObjectStore("news", { keyPath: "compositeId" });
                newsStore.createIndex("tabType", "tabType", { unique: false });
                newsStore.createIndex("timestamp", "timestamp", { unique: false });
            } else {
                const newsStore = e.currentTarget.transaction.objectStore("news");
                if (!newsStore.indexNames.contains("tabType")) newsStore.createIndex("tabType", "tabType", { unique: false });
                if (!newsStore.indexNames.contains("timestamp")) newsStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // 3. 绀句氦妯″潡锟?(Marketplace, Suggestions, etc.)
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

// --- 5. 鎭㈠涓㈠け锟?IndexedDB 杈呭姪鍑芥暟 ---

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
            // 鏍稿績淇锛欶irebase 鐨?push ID锛堝 -N...锛夋槸澶╃劧鎸夋椂闂存帓搴忕殑瀛楃涓层€?
            // 褰撻厤鍚?Firebase DB 鐨?orderByKey() 鏃讹紝蹇呴』杩斿洖璁板綍鐨勪富閿紙id / Firebase key 瀛楃涓诧級锛岃€屼笉鏄椂闂存埑鏁板€笺€?
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

// reconcileNews 宸茶縼绉昏嚦 js/sync.js

export async function saveModulePostLocal(moduleName, postId, data) {
    console.log(`[DEBUG] DB: Attempting to save to modules store. ID=${postId}, Module=${moduleName}`);
    try {
        const db = await dbReady;
        if (!db) return;
        const transaction = db.transaction(["modules"], "readwrite");
        const store = transaction.objectStore("modules");
        // 鏍稿績淇锛氱‘淇?id 鍦ㄦ渶鍚庯紝闃叉琚?data 涓殑 undefined id 瑕嗙洊
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
// 缁熶竴瀵煎嚭妯″潡 (Namespace Bridge)
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
        saveNews: saveNewsItemLocal,
        getNews: getLocalNews,
        saveModulePost: saveModulePostLocal,
        getModulePosts: getLocalModulePosts
    }
};

