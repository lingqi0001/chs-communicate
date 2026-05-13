

        // 配置 Tailwind 支持基于 'class' 的深色模式切换
        tailwind.config = { darkMode: 'class' }
    

        /* 
          SECTION 4: CORE ENGINE INITIALIZATION
          - Firebase 核心引擎与各大功能库导入
        */
        // 导入 Firebase 应用主程序
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        // 导入身份验证库：包含登录、退出、重定向等所有鉴权逻辑
        import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        // 导入实时数据库库：处理消息同步、帖子更新等
        import { getDatabase, ref, push, set, get, update, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey, startAfter, startAt, endAt, limitToFirst } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
        // 导入云存储库：处理图片上传、头像托管等
        import { getStorage, ref as sRef, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
        // 导入云消息库：处理移动端 PWA 推送通知
        import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

        // Firebase 生产环境配置（CHS 专属节点）
        const firebaseConfig = {
            apiKey: "AIzaSyCJX0prT18UJDn-hPsUWxVkXMdWAVrjgeM", // API 访问密钥
            authDomain: "chscommunication.firebaseapp.com", // 鉴权域名
            databaseURL: "https://chscommunication-default-rtdb.firebaseio.com", // 数据库实时端点
            projectId: "chscommunication", // 项目唯一 ID
            storageBucket: "chscommunication.firebasestorage.app", // 文件存储桶
            messagingSenderId: "61899173277", // 推送发送者 ID
            appId: "1:61899173277:web:330ad28d8de3c0527a5374" // 网页应用识别码
        };

        // 打印应用版本号，方便调试时确认缓存状态
        console.log('App: Version 2026-05-02-2115 (Latest)');
        // 正式初始化 Firebase 应用
        const app = initializeApp(firebaseConfig);
        window.firebaseApp = app; // 挂载到全局方便调试

        // 提取数据库对象
        const db = getDatabase(app);
        window.firebaseDb = db;
        // 缩写数据库常用操作符，提升代码简洁度
        window.fRef = ref; window.fSet = set; window.fUpdate = update; window.fPush = push; window.fGet = get; window.fOnValue = onValue;

        // 提取文件存储对象
        const storage = getStorage(app);
        window.firebaseStorage = storage;
        window.sRef = sRef; window.sUpload = uploadString; window.sGetUrl = getDownloadURL;

        // 提取鉴权对象
        const auth = getAuth(app);
        window.firebaseAuth = auth;
        window.firebaseOnAuth = onAuthStateChanged;

        /**
         * [回调函数] 处理第三方登录重定向结果
         * 该函数在从 Google/Microsoft 登录页面跳转回来时自动触发
         */
        getRedirectResult(auth).then((result) => {
            if (result) {
                // 如果结果存在，说明登录成功
                console.log('App: Sign-in redirect result handled.', result.user.email);
            }
        }).catch((error) => {
            // 登录失败时的错误处理
            console.error('App: Sign-in redirect error:', error);
            if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
                alert('Connection error during login. Please try again.');
            } else if (error.code !== 'auth/no-auth-event') {
                // 忽略没有认证事件的常规情况，显示其他严重错误
                if (window.showCustomAlert) window.showCustomAlert("Login Error", error.message);
                else alert('Login Error: ' + error.message);
            }
        });

        // 推送通知对象初始化
        let messaging = null;
        /**
         * [函数] 检查环境是否支持 Firebase Messaging
         * 因为有些浏览器（如 iOS Safari 旧版）不支持，所以需要先探测
         */
        isSupported().then(supported => {
            if (supported) {
                try {
                    // 环境支持，初始化推送引擎
                    messaging = getMessaging(app);
                    console.log('App: Firebase Messaging initialized.');
                    setupMessagingListeners(); // 设置监听器（该函数在文档后部定义）
                } catch (e) {
                    console.error('App: Messaging initialization failed:', e);
                }
            } else {
                console.warn('App: Firebase Messaging not supported in this environment.');
            }
        });

        // 初始化第三方登录提供者
        const googleProvider = new GoogleAuthProvider();
        const microsoftProvider = new OAuthProvider('microsoft.com');

        /**
         * [函数块] 服务工作线程清理逻辑
         * 强制卸载旧的 Service Worker，防止旧代码导致的缓存 Bug。
         */
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                // 遍历并卸载每一个已注册的 SW
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('App: Force Unregistered old SW');
                }
            });
        }

        /* 
          SECTION 5: GLOBAL UTILITIES & CONSTANTS
          - 全局静态常量与 UI 工具箱
        */
        window.CONSTANTS = {
            // 寿司默认头像的 SVG 数据，保证加载即显，无白屏
            SUSHI_AVATAR: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23FFF' d='M20 60c0-10 10-20 30-20s30 10 30 20-10 20-30 20-30-10-30-20z'/%3E%3Cpath fill='%23FF7F50' d='M15 55c0-15 20-30 35-30s35 15 35 30c0 5-10 10-35 10S15 60 15 55z'/%3E%3Cpath fill='none' stroke='%23FFF' stroke-width='1.5' d='M30 35c10 5 30 5 40 0M25 45c10 5 35 5 45 0M20 55c10 5 40 5 50 0'/%3E%3Cpath fill='%23333' d='M45 25c2 2 8 2 10 0l-2-3-6 1z'/%3E%3C/svg%3E`,
            SAFETY_BOT_ID: 'safety_bot', // 安全机器人唯一 ID
            ADVICE_BOT_ID: 'advice_bot', // 建议机器人唯一 ID
            ADMIN_EMAIL: 'moss104088@gmail.com' // 管理员控制邮箱
        };

        // UIUtils 工具对象：全站共用的逻辑提取
        window.UIUtils = {
            /**
             * [函数] 将时间戳转换为“几分钟前”风格
             * @param {number} timestamp 原始时间戳
             */
            formatTime: function (timestamp) {
                if (!timestamp) return "";
                const date = new Date(timestamp);
                const now = new Date();
                const diff = (now - date) / 1000; // 计算秒数差值

                if (diff < 60) return "Just now"; // 1分钟内
                if (diff < 3600) return Math.floor(diff / 60) + "m ago"; // 1小时内
                if (diff < 86400) return Math.floor(diff / 3600) + "h ago"; // 1天内
                return date.toLocaleDateString(); // 超过1天显示具体日期
            },

            /**
             * [函数] XSS 安全转义函数
             * 将用户输入的字符串转换为纯文本渲染，防止 HTML 注入攻击
             */
            escape: (str) => {
                const p = document.createElement('p');
                p.textContent = str; // 利用 innerText/textContent 的自动转义特性
                return p.innerHTML;
            },

            /**
             * [函数] 原子化高亮提示
             * 给指定元素添加一个短暂的闪烁类，1.2秒后自动移除
             */
            highlight: (el) => {
                if (!el) return;
                el.classList.add('highlight-pulse'); // 添加闪烁动画类
                // 1200ms 对应 CSS 动画的时长
                setTimeout(() => el.classList.remove('highlight-pulse'), 1200);
            }
        };

        // 应用运行时状态管理
        let ALL_USERS = {
            'safety_bot': {
                id: 'safety_bot',
                name: 'Safety Bot',
                email: 'safety@chschat.xyz',
                avatar: 'https://ui-avatars.com/api/?name=Safety+Bot&background=007AFF&color=fff'
            }
        };
        let currentUser = null; // 当前登录用户信息容器
        let DONATIONS = {}; // 捐款状态同步对象
        let activeTargetId = null; // 当前正在查看的对话/对象 ID
        let stopCurrentChatListener = null; // Firebase 实时监听器的销毁函数
        const globalListeners = new Set();
        const ADMIN_EMAIL = 'moss104088@gmail.com';
        const SAFETY_BOT_ID = 'safety_bot';
        const ADVICE_BOT_ID = 'advice_bot';
        const APP_START_TIME = Date.now();



        // SYSTEM CONFIG: Loaded from Firebase at runtime to avoid GitHub hardcoding.
        let SYSTEM_OPENAI_KEY = '';
        window.isPhotoDisabled = false;
        window.isSidebarAnimating = false;
        const MODERATION_THRESHOLD = 0.5;
        let currentNewsTab = 'school';
        const cnCache = {};
        const ctCache = {}; // Cache for class teacher names
        let isSyncDone = false;
        window.currentClassId = null;
        let sidebarClasses = {}; // Cache for classes user is part of

        const EAGLE_ICON = `<svg class="w-10 h-10" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="white" points="12.6,121.7 75.6,96.1 74.1,90.8 127.5,79.2 130.2,76.3 140.4,75.3 164.3,75.7 192.3,81.8 212.9,81.8 215.1,87.3 246.7,95.8 251.7,112.8 245.5,125.3 235.5,130.4 233.5,128.5 233.9,112.7 218.4,114.3 204.7,120.5 206.6,125.3 220.7,152.5 208.3,152.5 178.9,137.5 170.9,136.1 156.2,141.7 147,152.1 148,168.7 88.4,174.1 35.2,145.8 33.3,138.1" />
            <path fill="#ED2129" d="M243.8,97.1c-14.5-6.1-17.4-4.7-32.5-4.8c-2.4,1.8-2.4,3.2-4.8,4.2l-6.6,3.1c-2.5,6.3-5,19.9-15.5,24.5 l-10.9,5.1c11.2,10.6,32.1,25.6,45.4,21.2l-4.1-8.2l-11.3-16.5l0.9-0.8l-3.1,3.4c0.7,2,0.4,2.4,1.2,3.5l11.4,14.2 c-10.4,0.4-20-7.2-28.3-15.1c1.9-3.5,4.6-6.3,9.2-9.3l3.8-2.5c10.7-7,31.6-13.2,37.6-4l1.5,2.3c1.8,2.8-0.2,8.5-2.9,10.6l1,1.5 l6.8-4.5C251.2,119.4,249.7,106.5,243.8,97.1L243.8,97.1z M76.6,92.4l0.5,0.8l15.6,0.2l-13.4,4.8c-6.2-0.8-47.9,18.3-57.7,24.8 c8.3,4.6,16.1,10.5,25.4,10.6c21.9-14.4,41.5-20,61.5-27.3l8-1.5l-15.6,6.4c-12.3,0.2-45.5,26.5-58.6,35.1 c4.8,4.6,21.4,8.2,27.7,9.1l18-15.5l3.3-1.7c16.7-11,30.4-10.8,44-15.8l10.5-1l-14.5,4.8l-29.2,11.6l-1.2,1.7 c-12.6,8.2-15.3,15.9-22.6,23.5c4,5.1,27.6,9.5,34,7.1c-0.8-8.4,5.4-17.6,14.8-23.8l6.1-4c13.2-8.7,25.5-10.2,36.9-10l-5.3-3.1 l-5.6-1.6c7.3-2.6,11.8-0.3,21.8-6.9l4.6-3c3.7-2.4,5.5-5.5,6.4-8.5l-10.4,5.9l-0.5-0.9l8.4-5.5l-0.9-8.1c-3.8-1.1-1.3,1.9-4.1,3.8 l-0.8,0.5c-2.5,1.6-1-0.3-4.8,1l-2.6-2.7l-0.2-1.9l2.1-1.5l-3-1.3c-0.4,1.3-1.5,4.3-0.6,5.8c1.5,2.3,4.5,2.5,6.5,3.3l1.8,0.9 l1.5-0.9l2.3-1.5c-0.6,2-0.3,2.4-2.8,4c-3.8,2.5-10.3,1-13.6-0.9c-2.8-1.3-6.7-4.5-10-5.6c-3.4-1.2-8.9-0.3-11.4-2.2l10.4-2.3 c-4.6-6.7-10.8-2.9-15.6-7.2l-16.1,2c5-3.3,16.9-3.8,22.6-4.4c9.4-1.1,14,1.5,21.3,1.6l-4.6-3.4c4.8-0.1,10.4,5.6,18.3,7.2 c4.5,1,14.9,0.3,19.9-4.1l6.2-5.4l-0.8-1.3c-16.9,6.2-55.7-15.2-80.2-6.2l0.5,0.8l2.5,0.5l3.8,1.2l-3.3-0.4L76.6,92.4L76.6,92.4z M213.5,100.6l-2.3,1.5c-3.3,2.2-3.1,0.3-7.1,2.5c0.5-1.7,1.1-4,3.1-5.3C208.5,98.4,212.2,99.4,213.5,100.6L213.5,100.6z M160,136.7c-3.7-0.5-8.4,1.1-12.6,3.9l-7.6,5c-6,3.9-12,11.6-12.1,16.6l-0.1,1.1l15.4,1.8l0.1-0.9 C135.9,152.7,148.3,144.4,160,136.7L160,136.7z M185,101.9l-1-1.5l-1.5,1l1,1.5L185,101.9L185,101.9z M162.5,74.2 c7.9,0.1,19.7,3.1,27.9,4.8c7,1.5,26.3,0.8,28.6,1.7l-2,5c1.9,1.8,28.5,4.1,31.9,9.2l1.5,2.3c7,10.6,4.4,24.3-5.8,31l-0.8,0.5 c-4.3,2.8-9,2.7-12.6,3.9l-1-1.5c3-2.3,4.2-6.9,2.1-10.1c-3.7-5.6-16.4-3.4-21.7,0.1c-1.8,1.2-2.9,5.5-2.1,6.8 c3.6,5.5,7,8.6,9.8,13.2c3.4,5.7,2.5,9.9,4.4,13.4c-9.1,3.3-35.4-6.1-42.8-15.5c-5.8,2.1-11.3-2.4-22,4.6l-0.8,0.5 c-4.5,2.9-7.6,10-4.4,14.8l2.5,3.8c1.5,2.3,5.8,4.9,3.2,6.6c-13.5,8.8-28,2.6-33.1,4.3l1.5,4.4c-7.2,4.6-12.6,2.4-19.5,3.1 c-7.7-0.2-45.7-7-49.8-13l5.5-4.9c-9-3.8-33.9-7.3-42.2-14.6l11.4-7.5l-31.4-18l0.5-1.3l48.8-18.7l22.4-6.8L59.8,94l-0.1-1.3 l59.6-13.1l-3.9-2.9l-0.1-0.9L162.5,74.2L162.5,74.2z" />
        </svg>`;

        const EAGLE_ICON_BW = `<svg class="w-10 h-10" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="white" points="12.6,121.7 75.6,96.1 74.1,90.8 127.5,79.2 130.2,76.3 140.4,75.3 164.3,75.7 192.3,81.8 212.9,81.8 215.1,87.3 246.7,95.8 251.7,112.8 245.5,125.3 233.5,130.4 233.5,128.5 233.9,112.7 218.4,114.3 204.7,120.5 206.6,125.3 220.7,152.5 208.3,152.5 178.9,137.5 170.9,136.1 156.2,141.7 147,152.1 148,168.7 88.4,174.1 35.2,145.8 33.3,138.1" />
            <path fill="#000000" d="M243.8,97.1c-14.5-6.1-17.4-4.7-32.5-4.8c-2.4,1.8-2.4,3.2-4.8,4.2l-6.6,3.1c-2.5,6.3-5,19.9-15.5,24.5 l-10.9,5.1c11.2,10.6,32.1,25.6,45.4,21.2l-4.1-8.2l-11.3-16.5l0.9-0.8l-3.1,3.4c0.7,2,0.4,2.4,1.2,3.5l11.4,14.2 c-10.4,0.4-20-7.2-28.3-15.1c1.9-3.5,4.6-6.3,9.2-9.3l3.8-2.5c10.7-7,31.6-13.2,37.6-4l1.5,2.3c1.8,2.8-0.2,8.5-2.9,10.6l1,1.5 l6.8-4.5C251.2,119.4,249.7,106.5,243.8,97.1L243.8,97.1z M76.6,92.4l0.5,0.8l15.6,0.2l-13.4,4.8c-6.2-0.8-47.9,18.3-57.7,24.8 c8.3,4.6,16.1,10.5,25.4,10.6c21.9-14.4,41.5-20,61.5-27.3l8-1.5l-15.6,6.4c-12.3,0.2-45.5,26.5-58.6,35.1 c4.8,4.6,21.4,8.2,27.7,9.1l18-15.5l3.3-1.7c16.7-11,30.4-10.8,44-15.8l10.5-1l-14.5,4.8l-29.2,11.6l-1.2,1.7 c-12.6,8.2-15.3,15.9-22.6,23.5c4,5.1,27.6,9.5,34,7.1c-0.8-8.4,5.4-17.6,14.8-23.8l6.1-4c13.2-8.7,25.5-10.2,36.9-10l-5.3-3.1 l-5.6-1.6c7.3-2.6,11.8-0.3,21.8-6.9l4.6-3c3.7-2.4,5.5-5.5,6.4-8.5l-10.4,5.9l-0.5-0.9l8.4-5.5l-0.9-8.1c-3.8-1.1-1.3,1.9-4.1,3.8 l-0.8,0.5c-2.5,1.6-1-0.3-4.8,1l-2.6-2.7l-0.2-1.9l2.1-1.5l-3-1.3c-0.4,1.3-1.5,4.3-0.6,5.8c1.5,2.3,4.5,2.5,6.5,3.3l1.8,0.9 l1.5-0.9l2.3-1.5c-0.6,2-0.3,2.4-2.8,4c-3.8,2.5-10.3,1-13.6-0.9c-2.8-1.3-6.7-4.5-10-5.6c-3.4-1.2-8.9-0.3-11.4-2.2l10.4-2.3 c-4.6-6.7-10.8-2.9-15.6-7.2l-16.1,2c5-3.3,16.9-3.8,22.6-4.4c9.4-1.1,14,1.5,21.3,1.6l-4.6-3.4c4.8-0.1,10.4,5.6,18.3,7.2 c4.5,1,14.9,0.3,19.9-4.1l6.2-5.4l-0.8-1.3c-16.9,6.2-55.7-15.2-80.2-6.2l0.5,0.8l2.5,0.5l3.8,1.2l-3.3-0.4L76.6,92.4L76.6,92.4z M213.5,100.6l-2.3,1.5c-3.3,2.2-3.1,0.3-7.1,2.5c0.5-1.7,1.1-4,3.1-5.3C208.5,98.4,212.2,99.4,213.5,100.6L213.5,100.6z M160,136.7c-3.7-0.5-8.4,1.1-12.6,3.9l-7.6,5c-6,3.9-12,11.6-12.1,16.6l-0.1,1.1l15.4,1.8l0.1-0.9 C135.9,152.7,148.3,144.4,160,136.7L160,136.7z M185,101.9l-1-1.5l-1.5,1l1,1.5L185,101.9L185,101.9z M162.5,74.2 c7.9,0.1,19.7,3.1,27.9,4.8c7,1.5,26.3,0.8,28.6,1.7l-2,5c1.9,1.8,28.5,4.1,31.9,9.2l1.5,2.3c7,10.6,4.4,24.3-5.8,31l-0.8,0.5 c-4.3,2.8-9,2.7-12.6,3.9l-1-1.5c3-2.3,4.2-6.9,2.1-10.1c-3.7-5.6-16.4-3.4-21.7,0.1c-1.8,1.2-2.9,5.5-2.1,6.8 c3.6,5.5,7,8.6,9.8,13.2c3.4,5.7,2.5,9.9,4.4,13.4c-9.1,3.3-35.4-6.1-42.8-15.5c-5.8,2.1-11.3-2.4-22,4.6l-0.8,0.5 c-4.5,2.9-7.6,10-4.4,14.8l2.5,3.8c1.5,2.3,5.8,4.9,3.2,6.6c-13.5,8.8-28,2.6-33.1,4.3l1.5,4.4c-7.2,4.6-12.6,2.4-19.5,3.1 c-7.7-0.2-45.7-7-49.8-13l5.5-4.9c-9-3.8-33.9-7.3-42.2-14.6l11.4-7.5l-31.4-18l0.5-1.3l48.8-18.7l22.4-6.8L59.8,94l-0.1-1.3 l59.6-13.1l-3.9-2.9l-0.1-0.9L162.5,74.2L162.5,74.2z" />
        </svg>`;

        /* 
          SECTION 6: MODULE CONFIGURATION
          - Defines the behavior (comments, anonymity, labels) for all social sub-apps.
          - Maps logical modules to their physical DOM container IDs.
        */
        const MODULE_CONFIG = {
            lost_and_found: { title: 'Lost and Found', postBtn: 'Report', hasComments: false, anonymous: false },
            marketplace: { title: 'Marketplace', postBtn: 'Sell', hasComments: false, anonymous: false },
            peer_tutoring: { title: 'Peer Tutoring', postBtn: 'Help', hasComments: true, anonymous: false },
            suggestions: { title: 'Suggestions', postBtn: 'Suggest', hasComments: true, anonymous: true },
            info: { title: 'CHS Info', postBtn: 'Add', hasComments: false, anonymous: false },
            eagle_time: { title: 'Eagle Time', postBtn: null, hasComments: false, anonymous: false },
            grade_calculator: { title: 'Grade Calculator', postBtn: null, hasComments: false, anonymous: false },
            independent_research: { title: 'Independent Research', postBtn: null, hasComments: false, anonymous: false }
        };

        const OVERLAY_PAGE_IDS = [
            'lostFoundPage', 'marketplacePage', 'tutoringPage', 'suggestionsPage', 'infoPage',
            'eagleTimePage', 'gradeCalculatorPage', 'cafeteriaPage', 'adminConsolePage', 'extensionPage'
        ];

        const MODULE_PAGE_MAP = {
            lost_and_found: 'lostFoundPage',
            marketplace: 'marketplacePage',
            peer_tutoring: 'tutoringPage',
            suggestions: 'suggestionsPage',
            info: 'infoPage',
            eagle_time: 'eagleTimePage',
            grade_calculator: 'gradeCalculatorPage',
            cafeteria: 'cafeteriaPage',
            independent_research: 'extensionPage'
        };

        let currentModule = null;
        let currentModuleSort = 'latest';
        let moduleListener = null;
        let modulePosts = [];
        let currentPostId = null;
        let postDetailListener = null;
        let currentPostBase64 = null;

        /* 
          SECTION 7: LOCAL CACHING ENGINE (IndexedDB)
          - Offline-First: Stores messages, news, and posts locally for instant loads.
          - Synchronization: Prevents network lag from affecting user experience.
        */
        let localDB;
        function initLocalDB() {
            return new Promise((resolve) => {
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
                dbReq.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains("messages")) {
                        const store = db.createObjectStore("messages", { keyPath: "compositeId" });
                        store.createIndex("chatId", "chatId", { unique: false });
                    }
                    if (!db.objectStoreNames.contains("modules")) {
                        const store = db.createObjectStore("modules", { keyPath: "compositeId" });
                        store.createIndex("moduleName", "moduleName", { unique: false });
                    }
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
        let dbReady = initLocalDB();

        async function saveMessageLocal(chatId, key, msg) {
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

        async function getLocalMessages(chatId) {
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

        async function saveModulePostLocal(moduleName, key, post) {
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

        async function saveNewsItemLocal(tabType, key, item) {
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

        async function saveLocalNews(tabType, posts) {
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

        async function getLocalNews(tabType) {
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

        async function getLastKey(storeName, indexName, indexValue) {
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

        async function globalDataSync() {
            console.log('App: Starting background globalDataSync...');
            const syncHint = document.getElementById('newsSyncHint');
            if (syncHint) syncHint.classList.add('opacity-100');

            const newsTabs = ['school', 'club'];
            for (const tab of newsTabs) {
                try {
                    const remoteSnap = await get(ref(db, `news/${tab}`));
                    const remoteData = remoteSnap.val() || {};
                    const remoteKeys = Object.keys(remoteData);

                    // 1. Get current local state first
                    const localItems = await getLocalNews(tab);
                    const localKeys = localItems.map(it => it.key);

                    // 2. Batch save to LocalDB in a single transaction
                    if (localDB) {
                        const tx = localDB.transaction("news", "readwrite");
                        const store = tx.objectStore("news");
                        for (const key of remoteKeys) {
                            store.put({ compositeId: `${tab}_${key}`, tabType: tab, key, ...remoteData[key] });
                        }
                        // Cleanup local items not in remote
                        for (const k of localKeys) {
                            if (!remoteKeys.includes(k)) store.delete(`${tab}_${k}`);
                        }
                    }

                    // Immediate UI Refresh
                    const finalLocal = await getLocalNews(tab);
                    renderNewsContentFromData(finalLocal, tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent', tab);

                    // Future Listener
                    const lastKey = remoteKeys.sort().pop();
                    const q = lastKey ? query(ref(db, `news/${tab}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `news/${tab}`), orderByKey(), limitToLast(1));
                    onChildAdded(q, async (snap) => {
                        console.log(`App: New item received for news/${tab}`);
                        await saveNewsItemLocal(tab, snap.key, snap.val());
                        renderNewsContentFromData(await getLocalNews(tab), tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent', tab);
                    });
                } catch (err) {
                    console.error(`Sync failed for news/${tab}:`, err);
                    const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                    const container = document.getElementById(containerId);
                    if (container) container.innerHTML = `<div class="text-center text-red-500 py-10 text-[13px]">Sync Error: ${err.message}<br/>Check internet or browser security settings.</div>`;
                }
            }
            console.log('App: News sync complete.');

            // 2. Sync Modules (Restored and Hardened)
            const moduleNames = Object.keys(MODULE_CONFIG);
            for (const name of moduleNames) {
                try {
                    const lastKey = await getLastKey('modules', 'moduleName', name);
                    const q = lastKey ? query(ref(db, `modules/${name}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `modules/${name}`), orderByKey(), limitToLast(50));
                    onChildAdded(q, async (snap) => {
                        try {
                            const post = { id: snap.key, ...snap.val() };
                            await saveModulePostLocal(name, snap.key, post);
                        } catch (e) { console.error('Module sync error:', e); }
                    });
                } catch (err) {
                    console.warn(`Sync failed for module/${name}:`, err);
                }
            }

            // 3. Sync Extensions Automatically (New)
            syncExtensions();

            // Final hide of sync hint
            if (syncHint) {
                syncHint.classList.add('hidden');
                setTimeout(() => syncHint.remove(), 1000);
            }
            isSyncDone = true;
        }

        window.syncExtensions = async function () {
            const container = document.getElementById('dynamicExtensionsList');
            if (!container) return;
            container.innerHTML = ''; // Clear spinner

            const categoryMap = { 'school': 'Learning Tools', 'staff': 'Staff Tools' };

            // Helper to sync from a specific folder (Local Dev Mode)
            const syncFolderLocal = async (folder) => {
                try {
                    const resp = await fetch(`/extensions/${folder}/`);
                    if (resp.ok) {
                        const text = await resp.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        const links = Array.from(doc.querySelectorAll('a'))
                            .map(a => a.getAttribute('href'))
                            .filter(href => href && href.endsWith('.html') && !href.startsWith('/'));
                        if (links.length > 0) {
                            renderExtensionsCategory(categoryMap[folder] || folder, links.map(l => ({ name: decodeURIComponent(l), url: `extensions/${folder}/${l}` })));
                            return true;
                        }
                    }
                } catch (e) { }
                return false;
            };

            // Helper to sync via GitHub API
            const syncViaGitHub = async () => {
                try {
                    const ghResp = await fetch('https://api.github.com/repos/lingqi0001/chs-communicate/contents/extensions');
                    if (ghResp.ok) {
                        const items = await ghResp.json();
                        for (const item of items) {
                            if (item.type === 'dir') {
                                const subResp = await fetch(item.url);
                                if (subResp.ok) {
                                    const files = await subResp.json();
                                    const htmlFiles = files.filter(f => f.name.endsWith('.html'))
                                        .map(f => ({ name: f.name, url: f.path }));
                                    if (htmlFiles.length > 0) {
                                        renderExtensionsCategory(categoryMap[item.name] || item.name, htmlFiles);
                                    }
                                }
                            }
                        }
                        return true;
                    }
                } catch (e) { }
                return false;
            };

            // Try local first (dev server), then GitHub API
            let foundLocal = false;
            for (const cat of Object.keys(categoryMap)) {
                if (await syncFolderLocal(cat)) foundLocal = true;
            }

            if (!foundLocal) {
                await syncViaGitHub();
            }

            if (container.innerHTML === '') {
                container.innerHTML = `<div class="text-xs text-gray-400 text-center py-6 italic">No extensions found in /extensions/ folders.</div>`;
            }
        };

        function renderExtensionsCategory(title, files) {
            const container = document.getElementById('dynamicExtensionsList');
            if (!container) return;

            const header = document.createElement('div');
            header.className = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-6 px-1";
            header.innerText = title;
            container.appendChild(header);

            files.forEach(file => {
                const rawName = file.name.replace('.html', '');
                const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                const card = document.createElement('div');
                card.onclick = () => openExtension(rawName, file.url, displayName);
                card.className = "p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition group";

                let iconColor = "text-[#007AFF]";
                let iconBg = "bg-blue-100 dark:bg-blue-500/20";
                if (rawName.toLowerCase().includes('logic')) {
                    iconColor = "text-green-500";
                    iconBg = "bg-green-100 dark:bg-green-500/20";
                } else if (rawName.toLowerCase().includes('ir') || rawName.toLowerCase().includes('navigator')) {
                    iconColor = "text-cyan-500";
                    iconBg = "bg-cyan-100 dark:bg-cyan-500/20";
                } else if (title.toLowerCase().includes('staff')) {
                    iconColor = "text-purple-500";
                    iconBg = "bg-purple-100 dark:bg-purple-500/20";
                }

                card.innerHTML = `
                    <div class="w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-base text-black dark:text-white">${displayName}</h3>
                        <p class="text-xs text-gray-500">Extension Tool</p>
                    </div>
                `;
                container.appendChild(card);
            });
        }


        /* --- PRODUCT TOUR LOGIC (STORYTELLING MODE) --- */
        window.ProductTour = {
            currentStep: 0,
            autoPlayInterval: null,
            autoResumeTimeout: null,
            bgMusic: null,
            isAutoPlaying: false,
            sequenceTimeouts: [],

            inject() {
                if (document.getElementById('tour-container')) return;

                // Pre-initialize music here to start loading earlier
                this.initMusic();

                const container = document.createElement('div');
                container.id = 'tour-container';
                container.innerHTML = `
                    <div id="tourOverlay"></div>
                    <div id="tourHighlight"></div>
                    <div id="tourPointer"></div>
                    <div id="tourTooltip"></div>
                    <div id="tourCinematicOverlay" onclick="ProductTour.skipSequence()" class="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 pointer-events-auto opacity-0">
                        <!-- Narrative Opening -->
                        <div id="tourNarrative" class="text-center space-y-6 max-w-2xl px-8 transition-all duration-1000 opacity-0 transform translate-y-4">
                             <p class="text-2xl text-gray-400 font-medium italic">Have you ever wondered what the perfect app for Centennial High School would look like?</p>
                             <p class="text-xl text-blue-400 font-bold">Check out the software custom-built for MR. VW by students in Advanced Object Oriented Design!</p>
                             <p class="text-[10px] text-gray-600 uppercase tracking-widest mt-8 animate-pulse">Click anywhere to skip</p>
                        </div>

                        <!-- Triple Scaling Title -->
                        <div id="tourTitleSlide" class="hidden flex flex-col items-center justify-center gap-2">
                             <h2 class="text-2xl font-bold text-white/40 animate-in fade-in zoom-in duration-700">chschat.xyz</h2>
                             <h2 class="text-5xl font-black text-white/70 animate-in fade-in zoom-in duration-700 delay-300">chschat.xyz</h2>
                             <h1 class="text-8xl font-black text-white tracking-tighter animate-in fade-in zoom-in duration-700 delay-700 shadow-blue-500/20">chschat.xyz</h1>
                        </div>

                        <!-- End Credits -->
                        <div id="tourCreditsSlide" class="hidden text-center space-y-8">
                             <h1 class="text-8xl font-black text-white tracking-tighter shadow-xl">chschat.xyz</h1>
                             <div class="space-y-4">
                                 <p class="text-2xl text-blue-400 font-bold tracking-widest uppercase">This is our website. Register today!</p>
                                 <div class="pt-8 space-y-2 text-gray-400 font-medium">
                                     <p class="text-sm uppercase tracking-[0.3em]">Engineering Excellence</p>
                                     <p>Custom-built for <span class="text-white">MR. VW</span></p>
                                     <p>by <span class="text-blue-400">Advanced Object Oriented Design Students</span></p>
                                 </div>
                                 <p class="text-[10px] tracking-widest uppercase mt-20 opacity-30">Independent Student Project • Not affiliated with HCPSS</p>
                             </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(container);
            },

            clearSequence() {
                this.sequenceTimeouts.forEach(t => clearTimeout(t));
                this.sequenceTimeouts = [];
            },

            skipSequence() {
                const cin = document.getElementById('tourCinematicOverlay');
                const credits = document.getElementById('tourCreditsSlide');

                if (!credits.classList.contains('hidden')) {
                    this.end();
                    return;
                }

                this.clearSequence();
                cin.classList.replace('opacity-100', 'opacity-0');
                cin.classList.add('pointer-events-none');

                setTimeout(() => {
                    document.getElementById('tourOverlay').classList.add('active');
                    if (this.currentStep === 0) this.showStep();
                    if (this.isAutoPlaying) this.startAutoPlay();
                }, 500);
            },

            async askMusic(auto) {
                const choice = await window.showTourConfirm("Welcome to CHS-Communicate! 🎬", "Would you like a quick 45-second interactive tour of the app's features?");
                if (choice) {
                    this.start(auto, true);
                } else {
                    if (window.showCustomAlert) {
                        window.showCustomAlert(`Welcome!`, `Check out the 'Social' section to browse school activities and start chatting!`);
                    }
                }
            },

            initMusic() {
                if (!this.bgMusic) {
                    // Using a slightly different URL as fallback if needed, but sticking to SoundHelix
                    this.bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
                    this.bgMusic.loop = true;
                    this.bgMusic.volume = 0.4;
                    this.bgMusic.preload = 'auto';
                    this.bgMusic.onerror = () => {
                        console.warn("Music load failed, trying fallback...");
                        this.bgMusic.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
                        this.bgMusic.load();
                    };
                    this.bgMusic.load();
                }
            },

            tryPlayMusic() {
                if (this.bgMusic && this.bgMusic.paused && this.musicEnabled) {
                    this.bgMusic.play().catch(e => console.log("Music blocked"));
                }
            },

            start(auto = true, music = true) {
                this.initMusic();
                // PC Only Check
                if (window.innerWidth < 1024) {
                    if (window.showCustomAlert) {
                        window.showCustomAlert("PC Required", "The Product Tour is optimized for computer screens. Please view on a desktop or laptop for the best experience.");
                    } else {
                        alert("The Product Tour is optimized for computer screens.");
                    }
                    return;
                }

                // Auto Fullscreen for Immersion
                try {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    }
                } catch (e) {
                    console.warn("Fullscreen request blocked or failed", e);
                }

                this.inject();
                this.musicEnabled = music;
                if (this.musicEnabled) this.tryPlayMusic();

                this.isAutoPlaying = auto;
                this.currentStep = 0;

                if (window.toggleSettings) {
                    const modal = document.getElementById('settingsModal');
                    if (modal && !modal.classList.contains('hidden')) window.toggleSettings();
                }
                if (window.closeModule) window.closeModule();
                if (window.closeEagleTime) window.closeEagleTime();

                const cin = document.getElementById('tourCinematicOverlay');
                const narrative = document.getElementById('tourNarrative');
                const title = document.getElementById('tourTitleSlide');

                if (cin) {
                    cin.classList.remove('opacity-0', 'pointer-events-none');
                    cin.classList.add('opacity-100');
                }

                if (narrative) {
                    this.sequenceTimeouts.push(setTimeout(() => {
                        narrative.classList.remove('opacity-0', 'translate-y-4');
                        narrative.classList.add('opacity-100', 'translate-y-0');
                    }, 500));

                    this.sequenceTimeouts.push(setTimeout(() => {
                        narrative.classList.add('opacity-0');
                        setTimeout(() => {
                            narrative.classList.add('hidden');
                            if (title) title.classList.remove('hidden');
                            this.tryPlayMusic();
                        }, 1000);
                    }, 4500));
                }

                this.sequenceTimeouts.push(setTimeout(() => {
                    this.skipSequence();
                }, 8000));
            },

            steps: [
                {
                    title: "Revolutionary Communication",
                    content: "Welcome to CHS-Communicate. A platform designed for the modern Centennial High student experience.",
                    target: null
                },
                {
                    title: "Live School News",
                    content: "Stay ahead with real-time updates. CHS-Communicate syncs instantly with school announcements.",
                    target: "#schoolNewsContent",
                    action: () => {
                        if (window.switchLeftTab) window.switchLeftTab('news');
                        if (window.toggleNewsTab) window.toggleNewsTab('school');
                    }
                },
                {
                    title: "Club Highlights",
                    content: "Never miss a meeting. Explore a dedicated feed for clubs and student organizations.",
                    target: "#clubNewsContent",
                    action: () => {
                        if (window.switchLeftTab) window.switchLeftTab('news');
                        if (window.toggleNewsTab) window.toggleNewsTab('club');
                    }
                },
                {
                    title: "The 'Social' Menu",
                    content: "Access powerful productivity tools. CHS-Communicate is the central dashboard for your school day.",
                    target: "#headTabMore",
                    action: () => { if (window.switchLeftTab) window.switchLeftTab('more'); }
                },
                {
                    title: "Eagle Time Simplified",
                    content: "Enroll in sessions with one tap. Integrated directly into the CHS-Communicate system.",
                    target: "[onclick*='openEagleTime()']",
                    action: () => {
                        if (window.switchLeftTab) window.switchLeftTab('more');
                        setTimeout(() => { if (window.openEagleTime) window.openEagleTime(); }, 500);
                    }
                },
                {
                    title: "Digital Hall Pass",
                    content: "Secure, verified, and always on your phone. The modern way to move through your school day.",
                    target: "#eagleTimePage",
                    action: () => {
                        setTimeout(() => {
                            const el = document.querySelector('#studentPassContainer > div') || document.querySelector('#sessionListContainer .bg-white') || document.querySelector('#eagleTimePage .font-semibold');
                            if (el) ProductTour.focusElement(el);
                        }, 700);
                    }
                },
                {
                    title: "Student Suggestions",
                    content: "Have a voice. Share ideas anonymously with the CHS-Communicate community board.",
                    target: "[onclick*='suggestions']",
                    action: () => {
                        if (window.closeEagleTime) window.closeEagleTime();
                        setTimeout(() => { if (window.openModule) window.openModule('suggestions'); }, 500);
                    }
                },
                {
                    title: "Interactive Voting",
                    content: "Support the best ideas. Our high-fidelity bars show exactly where the student body stands.",
                    target: "#suggestionsPage .module-list",
                    action: () => {
                        setTimeout(() => {
                            const card = document.querySelector('#suggestionsPage .module-list > div div');
                            if (card) ProductTour.focusElement(card);
                        }, 800);
                    }
                },
                {
                    title: "School Marketplace",
                    content: "Buy and sell safely. The CHS-Communicate marketplace is built exclusively for Centennial students.",
                    target: "[onclick*='marketplace']",
                    action: () => {
                        if (window.closeModule) window.closeModule();
                        setTimeout(() => { if (window.openModule) window.openModule('marketplace'); }, 500);
                    }
                },
                {
                    title: "Lost & Found Board",
                    content: "Reunite with your belongings instantly through our real-time community board.",
                    target: "[onclick*='lost_and_found']",
                    action: () => {
                        if (window.closeModule) window.closeModule();
                        setTimeout(() => { if (window.openModule) window.openModule('lost_and_found'); }, 500);
                    }
                },
                {
                    title: "Essential School Info",
                    content: "All your links, schedules, and resources curated in one beautiful location.",
                    target: "[onclick*='info']",
                    action: () => {
                        if (window.closeModule) window.closeModule();
                        setTimeout(() => { if (window.openModule) window.openModule('info'); }, 500);
                    }
                },
                {
                    title: "Private Messaging",
                    content: "Connect instantly. CHS-Communicate offers the fastest messaging for student-to-student interaction.",
                    target: "#sidebarSubList",
                    action: () => {
                        if (window.closeModule) window.closeModule();
                        if (window.switchTab) window.switchTab('messages');
                        window.sidebarMode = 'recent';
                        if (window.renderSidebar) window.renderSidebar(true);
                        setTimeout(() => {
                            const firstChat = document.querySelector('#sidebarSubList > div[onclick*="switchChat"]');
                            if (firstChat) firstChat.click();
                        }, 500);
                    }
                },
                {
                    title: "Powerful Organization",
                    content: "Manage your conversations. Switch between Recent chats and your Contacts seamlessly.",
                    target: ".sidebar-tabs",
                    action: () => {
                        window.sidebarMode = 'recent';
                        if (window.renderSidebar) window.renderSidebar(true);
                    }
                },
                {
                    title: "Academic Roster",
                    content: "Your classes, automated. CHS-Communicate organizes your course rosters instantly.",
                    target: "#sidebarSubList",
                    action: () => {
                        window.sidebarMode = 'class';
                        if (window.renderSidebar) window.renderSidebar(true);
                        setTimeout(() => {
                            const firstClass = document.querySelector('#sidebarSubList > div[onclick*="currentClassId"]');
                            if (firstClass) {
                                firstClass.click();
                                setTimeout(() => {
                                    const roster = document.getElementById('sidebarSubList');
                                    if (roster) ProductTour.focusElement(roster);
                                }, 600);
                            }
                        }, 500);
                    }
                },
                {
                    title: "Full Media Support",
                    content: "Send high-res photos and documents. CHS-Communicate handles all your media sharing needs.",
                    target: "#chatBox",
                    action: () => {
                        window.sidebarMode = 'recent';
                        if (window.renderSidebar) window.renderSidebar(true);
                        setTimeout(() => {
                            const firstChat = document.querySelector('#sidebarSubList > div[onclick*="switchChat"]');
                            if (firstChat) firstChat.click();
                            setTimeout(() => {
                                const msg = document.querySelector('.msg-bubble');
                                if (msg) ProductTour.focusElement(msg);
                            }, 600);
                        }, 500);
                    }
                },
                {
                    title: "Universal Search",
                    content: "Never lose a detail again. Find anything in CHS-Communicate with lightning speed.",
                    target: "#globalSearchInput",
                    action: () => document.getElementById('globalSearchInput')?.focus()
                },
                {
                    title: "Premium Aesthetics",
                    content: "Dark Mode and custom themes. Tailor CHS-Communicate to your unique style.",
                    target: "#settingsBtn",
                    action: () => { if (window.toggleSettings) window.toggleSettings(); }
                },
                {
                    title: "Available Everywhere",
                    content: "Experience the ultimate school app today. Built by students, for students.",
                    target: null,
                    action: () => {
                        const modal = document.getElementById('settingsModal');
                        if (modal && !modal.classList.contains('hidden') && window.toggleSettings) window.toggleSettings();
                    }
                }
            ],

            startAutoPlay() {
                this.stopAutoPlay();
                this.autoPlayInterval = setInterval(() => this.next(true), 3500);
            },

            stopAutoPlay() {
                if (this.autoPlayInterval) {
                    clearInterval(this.autoPlayInterval);
                    this.autoPlayInterval = null;
                }
            },

            handleUserInteraction() {
                if (!this.isAutoPlaying) return;

                this.stopAutoPlay();
                if (this.autoResumeTimeout) clearTimeout(this.autoResumeTimeout);

                this.autoResumeTimeout = setTimeout(() => {
                    this.startAutoPlay();
                    this.next(true);
                }, 6000);
            },

            next(auto = false) {
                if (!auto) this.handleUserInteraction();

                this.currentStep++;
                if (this.currentStep >= this.steps.length) return this.showCredits();
                this.showStep();
            },

            showStep() {
                const step = this.steps[this.currentStep];
                const highlight = document.getElementById('tourHighlight');
                const tooltip = document.getElementById('tourTooltip');
                const pointer = document.getElementById('tourPointer');
                const overlay = document.getElementById('tourOverlay');

                if (!tooltip || !highlight || !pointer || !overlay) return this.end();

                tooltip.innerHTML = `
                    <div class="flex items-center mb-6">
                        <div class="tour-dot"></div>
                        <h3 class="font-black text-[32px] tracking-tight leading-none">${step.title}</h3>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-[20px] leading-relaxed mb-10 font-medium">${step.content}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">${this.currentStep + 1} / ${this.steps.length}</span>
                        <button class="tour-btn" onclick="ProductTour.next()">Next</button>
                    </div>
                `;

                if (step.action) {
                    try { step.action(); } catch (e) { console.warn("Tour action failed", e); }
                }

                if (!step.target) {
                    highlight.style.opacity = '0';
                    pointer.style.display = 'none';
                    tooltip.style.left = '50%';
                    tooltip.style.top = '50%';
                    tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
                    overlay.style.clipPath = 'none';
                } else {
                    const el = document.querySelector(step.target);
                    if (el) {
                        this.focusElement(el);
                    } else {
                        // Element not found, center tooltip
                        highlight.style.opacity = '0';
                        pointer.style.display = 'none';
                        tooltip.style.left = '50%';
                        tooltip.style.top = '50%';
                        tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
                        overlay.style.clipPath = 'none';
                    }
                }

                tooltip.classList.remove('active');
                setTimeout(() => { if (tooltip) tooltip.classList.add('active'); }, 100);
            },

            focusElement(el) {
                // Ensure the element is visible and centered
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const rect = el.getBoundingClientRect();
                this.updateHighlight(rect);
                const pointer = document.getElementById('tourPointer');
                pointer.style.display = 'block';
                pointer.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                pointer.style.top = (rect.top + rect.height / 2 - 15) + 'px';
            },

            updateHighlight(rect) {
                const highlight = document.getElementById('tourHighlight');
                const tooltip = document.getElementById('tourTooltip');
                const overlay = document.getElementById('tourOverlay');

                if (!highlight || !tooltip || !overlay) return;

                highlight.style.opacity = '1';
                highlight.style.left = (rect.left - 10) + 'px';
                highlight.style.top = (rect.top - 10) + 'px';
                highlight.style.width = (rect.width + 20) + 'px';
                highlight.style.height = (rect.height + 20) + 'px';

                const pad = 10;
                const L = rect.left - pad;
                const T = rect.top - pad;
                const R = rect.right + pad;
                const B = rect.bottom + pad;
                overlay.style.clipPath = `polygon(
                    0% 0%, 0% 100%, ${L}px 100%, ${L}px ${T}px, ${R}px ${T}px, ${R}px ${B}px, ${L}px ${B}px, ${L}px 100%, 100% 100%, 100% 0%
                )`;

                const tooltipWidth = 480;
                const margin = 40;
                let tLeft, tTop;

                // Standard Desktop Positioning
                if (rect.right + tooltipWidth + margin * 2 < window.innerWidth) {
                    tLeft = rect.right + margin;
                } else if (rect.left - tooltipWidth - margin * 2 > 0) {
                    tLeft = rect.left - tooltipWidth - margin;
                } else {
                    tLeft = (window.innerWidth - tooltipWidth) / 2;
                }

                tTop = rect.top + rect.height / 2 - 150;
                if (tTop < margin) tTop = margin;
                if (tTop + 350 > window.innerHeight) tTop = window.innerHeight - 350 - margin;

                tooltip.style.width = tooltipWidth + 'px';
                tooltip.style.left = tLeft + 'px';
                tooltip.style.top = tTop + 'px';
                tooltip.style.transform = 'translateY(0)';
            },

            showCredits() {
                if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
                const cin = document.getElementById('tourCinematicOverlay');
                const title = document.getElementById('tourTitleSlide');
                const credits = document.getElementById('tourCreditsSlide');
                const tooltip = document.getElementById('tourTooltip');
                const overlay = document.getElementById('tourOverlay');

                if (!cin || !title || !credits) return this.end();

                if (tooltip) tooltip.classList.remove('active');
                if (overlay) overlay.classList.remove('active');

                // 1. Show Cinematic Backdrop again
                cin.classList.remove('opacity-0', 'pointer-events-none');
                cin.classList.add('opacity-100');

                // 2. Repeat chschat.xyz animation (Small -> Big)
                title.classList.remove('hidden');
                credits.classList.add('hidden');

                // 3. After 4s of title, show final credits and STAY THERE
                setTimeout(() => {
                    title.classList.add('hidden');
                    credits.classList.remove('hidden');
                    credits.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-8', 'duration-1000');

                    // Add a Finish button to the credits slide
                    if (!document.getElementById('tourFinishBtn')) {
                        const finishBtn = document.createElement('button');
                        finishBtn.id = 'tourFinishBtn';
                        finishBtn.className = "mt-12 tour-btn pointer-events-auto bg-white text-black hover:bg-gray-200";
                        finishBtn.innerText = "Finish Presentation";
                        finishBtn.onclick = () => ProductTour.end();
                        credits.appendChild(finishBtn);
                    }
                }, 4000);

                // Slow music fade out but keep it playing softly
                let vol = 0.4;
                const fade = setInterval(() => {
                    vol -= 0.02;
                    if (vol <= 0.1) {
                        clearInterval(fade);
                    } else {
                        if (this.bgMusic) this.bgMusic.volume = vol;
                    }
                }, 500);
            },

            end() {
                if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
                if (this.bgMusic) {
                    this.bgMusic.pause();
                    this.bgMusic.currentTime = 0;
                }
                const container = document.getElementById('tour-container');
                if (container) {
                    container.style.opacity = '0';
                    setTimeout(() => container.remove(), 500);
                }
            }
        };



        const SETTINGS = {
            theme: localStorage.getItem('theme') || 'system',
            soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
            soundUrl: localStorage.getItem('soundUrl') || "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"
        };

        const SOUNDS = [
            { name: "Note", url: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" },
            { name: "Pop", url: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" },
            { name: "Blop", url: "https://assets.mixkit.co/active_storage/sfx/2351/2351-preview.mp3" },
            { name: "Chime", url: "https://assets.mixkit.co/active_storage/sfx/2347/2347-preview.mp3" },
            { name: "Bell", url: "https://assets.mixkit.co/active_storage/sfx/2341/2341-preview.mp3" }
        ];

        let notifySound = new Audio(SETTINGS.soundUrl);
        const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');

        // --- RATE LIMITING STATE ---
        let lastMsgSentTime = 0;
        let lastPostSentTime = 0;
        let lastCommentSentTime = 0;
        const MSG_COOLDOWN = 1000;
        const POST_COOLDOWN = 5000;
        const COMMENT_COOLDOWN = 2000;

        // --- SECURE AUTHORIZATION HELPERS ---
        // These rely on the immutable Firebase Auth state, making them harder to spoof than global objects.
        // REAL security is enforced by the database.rules.json on the server.
        var isAppAdmin = () => auth.currentUser && auth.currentUser.email === window.CONSTANTS.ADMIN_EMAIL;
        var isAppTeacher = () => auth.currentUser && auth.currentUser.email && auth.currentUser.email.endsWith('@hcpss.org');
        var isAppStaff = () => isAppAdmin() || isAppTeacher();


        console.log('App: Setting up onAuthStateChanged...');
        onAuthStateChanged(auth, async (user) => {
            console.log('App: Auth state changed. User:', user ? user.email : 'null');
            try {
                if (user) {
                    await setupUser(user);
                } else {
                    console.log('App: No user found. Showing login page.');
                    document.getElementById('loginPage')?.classList.remove('hidden');
                    document.getElementById('mainPage')?.classList.add('hidden');
                    hideLoading();
                }
            } catch (err) {
                console.error('App: Critical error during initialization:', err);
                if (window.showError) window.showError(err);
                hideLoading();
            }
        });



        window.handleSignOut = () => signOut(auth).then(() => location.reload());


        window.loginWithGoogle = async () => {
            const btns = document.querySelectorAll('#loginPage button');
            const hint = document.getElementById('loginHint');
            const originalHint = hint.innerText;
            btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

            hint.innerText = "Please check the Google popup window...";
            hint.classList.replace('text-gray-400', 'text-[#007AFF]');

            try {
                await signInWithPopup(auth, googleProvider);
            }
            catch (error) {
                console.error("Auth Error:", error);
                if (error.code === 'auth/popup-blocked') {
                    // Fallback to redirect only if popup is blocked
                    hint.innerText = "Popup blocked. Redirecting...";
                    await signInWithRedirect(auth, googleProvider);
                } else if (error.code !== 'auth/popup-closed-by-user') {
                    alert("Google Sign-In failed: " + error.message);
                    btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                    hint.innerText = originalHint;
                    hint.classList.replace('text-[#007AFF]', 'text-gray-400');
                } else {
                    btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                    hint.innerText = originalHint;
                    hint.classList.replace('text-[#007AFF]', 'text-gray-400');
                }
            }
        };

        window.loginWithMicrosoft = async () => {
            const btns = document.querySelectorAll('#loginPage button');
            const hint = document.getElementById('loginHint');
            const originalHint = hint.innerText;
            btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
            hint.innerText = "Please check the Microsoft popup window...";
            hint.classList.replace('text-gray-400', 'text-[#007AFF]');

            try { await signInWithPopup(auth, microsoftProvider); }
            catch (error) {
                if (error.code !== 'auth/popup-closed-by-user') alert("Microsoft Sign-In failed: " + error.message);
                btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                hint.innerText = originalHint;
                hint.classList.replace('text-[#007AFF]', 'text-gray-400');
            }
        };


        async function setupUser(user) {
            console.log('App: Entering setupUser for', user.email);
            const email = user.email.toLowerCase();
            // Use a slightly more robust ID prefix by including the domain part for uniqueness
            const idPrefix = email.split('@')[0].replace(/\./g, '_');

            let role = 'user';
            if (email === ADMIN_EMAIL) role = 'admin';
            else if (email.endsWith('@hcpss.org')) role = 'teacher';
            else if (email.endsWith('@inst.hcpss.org')) role = 'student';

            const defaultName = email.split('@')[0];
            const capitalizedDefaultName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
            currentUser = { name: capitalizedDefaultName, id: idPrefix, role: role, email: email };
            window.currentUser = currentUser; // Export for extensions

            const userRef = ref(db, `users/${idPrefix}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.name) currentUser.name = userData.name;
                currentUser.avatar = userData.avatar || null;
                currentUser.hasAcceptedTerms = userData.hasAcceptedTerms || false;
                await update(userRef, { lastSeen: serverTimestamp(), role: role, email: email });

                // Automatic Avatar Setup for Admin Moss (The Sushi Icon)
                if (currentUser.id === 'moss104088' && userData.avatar !== window.CONSTANTS.SUSHI_AVATAR) {
                    await update(userRef, { avatar: window.CONSTANTS.SUSHI_AVATAR });
                    currentUser.avatar = window.CONSTANTS.SUSHI_AVATAR;
                }
            } else {
                currentUser.hasAcceptedTerms = false;
                currentUser._isNewUser = true; // Flag for notification
                await set(userRef, {
                    name: currentUser.name,
                    role: role,
                    email: email,
                    lastSeen: serverTimestamp(),
                    registeredAt: serverTimestamp(),
                    hasAcceptedTerms: false
                });
            }
            ALL_USERS[currentUser.id] = currentUser;

            // Heartbeat for "Online" status
            if (window._heartbeat) clearInterval(window._heartbeat);
            window._heartbeat = setInterval(() => {
                if (auth.currentUser) {
                    update(ref(db, `users/${idPrefix}`), { lastSeen: serverTimestamp() });
                }
            }, 60000); // Update every minute

            // 2. Fetch required global data concurrently
            console.log('App: Fetching global data...');
            let dataFetchResult;
            try {
                dataFetchResult = await Promise.all([
                    get(ref(db, 'settings')),
                    get(ref(db, 'donations')),
                    get(ref(db, 'tos_content')),
                    get(ref(db, `user_private/${user.uid}`))
                ]);
            } catch (err) {
                console.error('App: Global data fetch failed:', err);
                // Continue with defaults if fetch fails to avoid blocking startup
                dataFetchResult = [null, null, null, null];
            }
            const [settingsSnap, donationsSnap, tosSnap, privateSnap] = dataFetchResult;

            // Populate settings
            const settingsData = settingsSnap?.val() || {};
            SETTINGS.soundEnabled = settingsData.soundEnabled !== undefined ? settingsData.soundEnabled : true;
            const soundToggle = document.getElementById('soundToggle');
            if (soundToggle) soundToggle.checked = SETTINGS.soundEnabled;

            onValue(ref(db, 'settings'), (snap) => {
                const s = snap.val() || {};
                window.isPhotoDisabled = s.isPhotoDisabled || false;
                const toggle = document.getElementById('globalPhotoToggle');
                if (toggle) toggle.checked = window.isPhotoDisabled;

                // 1. Photo Status Notification (Only show if DISABLED)
                const isNewOrTest = (user && user.email && user.email.toLowerCase().includes('moss932888')) || (currentUser && currentUser._isNewUser);
                if (!window._settingsInit && !isNewOrTest) {
                    window._settingsInit = true;
                    if (window.isPhotoDisabled) {
                        setTimeout(() => {
                            const statusTitle = "⚠️ Photos Temporarily Disabled";
                            const statusMsg = "Image sharing is currently disabled to ensure platform stability during high traffic. You can still send text messages. Contact administrator for details.";
                            if (window.showCustomAlert) window.showCustomAlert(statusTitle, statusMsg);
                        }, 2500);
                    }
                }

                // Hide/Show camera icon in chat input
                const cameraBtn = document.getElementById('chatCameraBtn');
                if (cameraBtn) cameraBtn.style.display = window.isPhotoDisabled ? 'none' : 'block';

                // Re-render current views to reflect the change
                if (activeTargetId) {
                    const chatId = getChatId(currentUser.id, activeTargetId);
                    loadChatThread(chatId);
                }
                if (currentModule) renderModuleList();

                // Also refresh News/Announcements
                const newsTabs = ['school', 'club'];
                newsTabs.forEach(tab => {
                    getLocalNews(tab).then(posts => {
                        const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                        renderNewsContentFromData(posts, containerId, tab);
                    }).catch(e => console.warn('Sync news error:', e));
                });
            });


            // Add Tour Button to Settings (Available to all students)
            const settingsView = document.getElementById('settingsView');
            if (settingsView && !document.getElementById('tourStartRow')) {
                const tourRow = document.createElement('div');
                tourRow.id = 'tourStartRow';
                tourRow.className = "p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 mb-4";
                tourRow.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-[15px] font-bold text-blue-600 dark:text-blue-400">Product Tour 🎬</div>
                            <div class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">Explore features in 45 seconds</div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="ProductTour.askMusic(true)" class="bg-blue-500 text-white px-3 py-1.5 rounded-xl text-[12px] font-bold active:scale-95 transition-transform shadow-sm">Auto Play</button>
                            <button onclick="ProductTour.askMusic(false)" class="bg-white dark:bg-white/10 text-blue-500 dark:text-blue-400 px-3 py-1.5 rounded-xl text-[12px] font-bold active:scale-95 transition-transform border border-blue-100 dark:border-blue-500/20">Manual</button>
                        </div>
                    </div>
                `;
                settingsView.prepend(tourRow);
            }

            // Update UI with donations and ToS from DB
            if (isAppAdmin()) {
                document.getElementById('adminPanel')?.classList.remove('hidden');
            } else {
                document.getElementById('adminPanel')?.classList.add('hidden');
            }

            const tosContent = tosSnap?.val() || "";
            const userData = privateSnap?.val() || {};
            const isAlwaysNewUser = user && user.email && user.email.toLowerCase().includes('moss932888');
            window._isNewUserFlag = userData.isNew || isAlwaysNewUser;

            // Force onboarding flags for test user
            if (isAlwaysNewUser) {
                currentUser.hasAcceptedTerms = false;
            }

            // Clear flag in background for real new users
            if (userData.isNew && !isAlwaysNewUser) {
                update(ref(db, `user_private/${user.uid}`), { isNew: null }).catch(e => console.warn('Flag clear fail:', e));
            }

            console.log('App: setupUser finalizing. hasAcceptedTerms:', currentUser.hasAcceptedTerms);

            if (currentUser.hasAcceptedTerms) {
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainPage').classList.remove('hidden');
                initUserObserver();
                initSettingsUI();
                updateNewsAccess();
                initNewsObserver();
                showSidebar();
                requestNotificationPermission();
                globalDataSync();
                syncGroupChats();

                onValue(ref(db, 'config/openai_key'), (snap) => {
                    const val = snap.val() || '';
                    if (val) SYSTEM_OPENAI_KEY = val;
                });

                console.log('App: All components initialized. Hiding loading.');
                hideLoading();
            } else {
                console.log('App: User must accept ToS.');
                showTos(true);
                hideLoading();
            }
        }

        window.showTos = (mandatory = false) => {
            const tosPage = document.getElementById('tosPage');
            const tosCloseBtn = document.getElementById('tosCloseBtn');
            const tosAcceptSection = document.getElementById('tosAcceptSection');

            tosPage.classList.remove('hidden');
            if (mandatory) {
                tosCloseBtn.classList.add('hidden');
                tosAcceptSection.classList.remove('hidden');
            } else {
                tosCloseBtn.classList.remove('hidden');
                tosAcceptSection.classList.add('hidden');
            }
        };

        window.closeTos = () => {
            document.getElementById('tosPage').classList.add('hidden');
        };

        window.acceptTerms = async () => {
            if (!currentUser) return;
            const userRef = ref(db, `users/${currentUser.id}`);
            await update(userRef, { hasAcceptedTerms: true });
            currentUser.hasAcceptedTerms = true;

            const isAlwaysNewUser = currentUser.email && currentUser.email.toLowerCase().includes('moss932888');

            // If new user (or test user), show name setup instead of entering app
            if (currentUser._isNewUser || isAlwaysNewUser) {
                document.getElementById('tosPage').classList.add('hidden');
                document.getElementById('nameSetupPage').classList.remove('hidden');

                // Pre-fill if auth provided a name
                if (currentUser.name) {
                    const parts = currentUser.name.split(' ');
                    const first = parts[0] || '';
                    const last = parts.slice(1).join(' ') || '';
                    document.getElementById('setupFirstName').value = first.charAt(0).toUpperCase() + first.slice(1);
                    document.getElementById('setupLastName').value = last.charAt(0).toUpperCase() + last.slice(1);
                }
                return;
            }

            enterApp();
        };

        window.enterApp = async () => {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('mainPage').classList.remove('hidden');
            initUserObserver();
            initSettingsUI();
            updateNewsAccess();
            initNewsObserver();
            showSidebar();
            requestNotificationPermission();
            closeTos();
            hideLoading();

            // Product Tour Invitation - ONLY after entering app
            const userEmail = auth.currentUser?.email?.toLowerCase() || "";
            const isAlwaysNewUser = userEmail.includes('moss932888');

            if ((window._isNewUserFlag || isAlwaysNewUser) && !window._tourPrompted) {
                window._tourPrompted = true;
                setTimeout(async () => {
                    ProductTour.askMusic(true);
                }, 1000);
            }
        };

        window.saveInitialProfile = async () => {
            const rawFirst = document.getElementById('setupFirstName').value.trim();
            const rawLast = document.getElementById('setupLastName').value.trim();
            const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
            const last = rawLast.charAt(0).toUpperCase() + rawLast.slice(1);
            const newName = [first, last].filter(Boolean).join(' ');

            if (!newName || !first || !last) {
                return showCustomAlert("Name Required", "Please enter both your first and last name to continue.");
            }

            const btn = document.getElementById('setupSubmitBtn');
            btn.disabled = true;
            btn.innerText = "Setting up...";

            try {
                await update(ref(db, `users/${currentUser.id}`), { name: newName });
                currentUser.name = newName;

                // Send the admin notification NOW with the real name
                try {
                    const adminId = 'moss104088';
                    const chatId = getChatId(currentUser.id, adminId);
                    const msg = { senderId: currentUser.id, senderName: currentUser.name, text: "[Auto Sent By System] I'm a new user", type: 'text', timestamp: serverTimestamp() };
                    await push(ref(db, `messages/${chatId}`), msg);
                    await update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [adminId]: serverTimestamp() });
                    await update(ref(db, `user_chats/${adminId}`), { [currentUser.id.toLowerCase()]: serverTimestamp() });
                } catch (e) { console.warn('Notification failed:', e); }

                delete currentUser._isNewUser;
                document.getElementById('nameSetupPage').classList.add('hidden');
                enterApp();
            } catch (err) {
                btn.disabled = false;
                btn.innerText = "Start Chatting";
                showCustomAlert("Error", "Failed to save profile: " + err.message);
            }
        };

        async function requestNotificationPermission() {
            try {
                if (!('Notification' in window) || !messaging) {
                    console.log('App: Notifications not supported or messaging not ready.');
                    return;
                }
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Fix for GitHub Pages subfolder
                    const swUrl = window.location.pathname.includes('chs-communicate') ? '/chs-communicate/firebase-messaging-sw.js' : '/firebase-messaging-sw.js';
                    const token = await getToken(messaging, {
                        vapidKey: 'BBqn6yGqPA7P7vF0sgj5Bu1gcdPR092y4OD4ifLBWiBXe2D3G82PV907LKub__wQf245fw8yKZTxqRMN5V5Yn5w',
                        serviceWorkerRegistration: await navigator.serviceWorker.register(swUrl)
                    });
                    if (token) {
                        await update(ref(db, `user_private/${currentUser.id}`), { fcmToken: token });
                    }
                }
            } catch (err) {
                console.log('FCM Token error:', err);
            }
        }

        function setupMessagingListeners() {
            if (!messaging) return;
            onMessage(messaging, (payload) => {
                console.log('Foreground message:', payload);
                if (payload.notification) {
                    alert(`${payload.notification.title}\n${payload.notification.body}`);
                }
            });
        }

        function updateNewsAccess() {
            const btn = document.getElementById('addAnnouncementBtn');
            if (btn) {
                if (isAppStaff()) {
                    btn.classList.remove('hidden');
                } else {
                    btn.classList.add('hidden');
                }
            }
        }

        function initNewsObserver() {
            for (const tab of ['school', 'club']) {
                const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                const container = document.getElementById(containerId);
                if (container) container.innerHTML = '<div class="text-center text-gray-400 py-20 animate-pulse">Loading...</div>';

                // Real-time listener for news
                onValue(ref(db, `news/${tab}`), async (snapshot) => {
                    const data = snapshot.val() || {};
                    const posts = Object.keys(data).map(key => ({ ...data[key], key }));

                    // Save to local cache
                    saveLocalNews(tab, posts);

                    // Render with transition
                    renderNewsContentFromData(posts, containerId, tab);
                });
            }
        }

        /* --- STEP 11-13: UNIFIED NEWS ENGINE --- */
        window.NewsCore = {
            getBadge: function (type) {
                const isSchool = type === 'school';
                return {
                    text: isSchool ? 'Announcement' : 'Club Update',
                    color: isSchool ? 'text-[#007AFF] bg-blue-100 dark:bg-blue-500/20' : 'text-orange-500 bg-orange-100 dark:bg-orange-500/20'
                };
            },

            renderCard: function (post, type) {
                const badge = this.getBadge(type);
                const dateStr = window.UIUtils.formatTime(post.timestamp);
                const isStaff = isAppStaff();

                return `
                    <div data-news-key="${post.key}" class="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div class="flex justify-between items-start">
                            <span class="text-[11px] font-bold ${badge.color} uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">${badge.text}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400 font-medium">${dateStr}</span>
                                ${isStaff ? `<button onclick="deleteNews('${post.key}', '${type}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : ''}
                            </div>
                        </div>
                        <h3 class="font-bold text-base mt-1.5 mb-1.5 text-black dark:text-white leading-snug">${window.UIUtils.escape(post.title)}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${linkify(window.UIUtils.escape(post.desc))}</p>
                        ${this.renderMedia(post)}
                    </div>`;
            },

            renderMedia: function (post) {
                if (!post.image) return '';
                if (window.isPhotoDisabled) {
                    return `<div class="mt-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled by Admin</div>`;
                }
                const enc = encodeURIComponent(JSON.stringify([post.image]));
                return `
                    <div class="relative w-full">
                        <img src="${post.image}" class="w-full h-auto rounded-xl mt-3 cursor-pointer object-cover max-h-[300px] border border-gray-100 dark:border-white/5" 
                             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                             onclick="openGallery('${enc}')">
                        <div class="hidden mt-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2 border border-dashed border-gray-200 dark:border-gray-800">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Photo no longer available
                        </div>
                    </div>`;
            }
        };

        function renderNewsContentFromData(posts, containerId, tabType) {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Handle deletion animation if we are updating an existing list
            const currentItems = Array.from(container.querySelectorAll('[data-news-key]'));
            if (currentItems.length > 0) {
                const newKeys = new Set(posts.map(p => p.key));
                const itemsToRemove = currentItems.filter(el => !newKeys.has(el.dataset.newsKey));

                if (itemsToRemove.length > 0) {
                    itemsToRemove.forEach(el => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(-10px) scale(0.95)';
                        el.style.pointerEvents = 'none';
                    });
                    // Wait for animation before re-rendering
                    setTimeout(() => doActualRender(), 300);
                    return;
                }
            }

            doActualRender();

            function doActualRender() {
                if (!posts || posts.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-400 mt-10 font-medium animate-in fade-in duration-500">No announcements yet.</div>';
                    return;
                }
                const sortedPosts = [...posts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                container.innerHTML = sortedPosts.map(post => window.NewsCore.renderCard(post, tabType)).join('');
            }
        }


        window.deleteNews = async (id, tabType) => {
            if (!confirm("Are you sure you want to delete this?")) return;
            await set(ref(db, `news/${tabType}/${id}`), null);
        };

        async function fetchUser(userId) {
            if (!userId) return null;
            const cleanedId = userId.toLowerCase();
            if (cleanedId === window.CONSTANTS.SAFETY_BOT_ID) {
                return { id: window.CONSTANTS.SAFETY_BOT_ID, name: 'Safety Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/1067/1067562.png' };
            }
            if (cleanedId === window.CONSTANTS.ADVICE_BOT_ID) {
                return { id: window.CONSTANTS.ADVICE_BOT_ID, name: 'Advice Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/3260/3260831.png' };
            }
            // Client-side hardcoded avatar override for admin accounts
            if (cleanedId === 'moss104088' || cleanedId === 'admin_moss') {
                const adminUser = { id: 'moss104088', name: 'Moss', avatar: window.CONSTANTS.SUSHI_AVATAR, email: window.CONSTANTS.ADMIN_EMAIL };
                ALL_USERS[cleanedId] = adminUser;
                return adminUser;
            }
            if (ALL_USERS[cleanedId]) return ALL_USERS[cleanedId];

            try {
                const snap = await get(ref(db, `users/${userId}`));
                if (snap.exists()) {
                    ALL_USERS[userId] = snap.val();
                    return ALL_USERS[userId];
                }
            } catch (err) {
                console.warn(`Failed to fetch user ${userId}:`, err);
            }
            return null;
        }

        function initUserObserver() {
            console.log('App: initUserObserver starting...');
            // Only listen to the current user's profile changes
            onValue(ref(db, `users/${currentUser.id}`), (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('App: Current user profile updated.');
                    if (data.name) currentUser.name = data.name;
                    currentUser.hasAcceptedTerms = data.hasAcceptedTerms || false;
                    ALL_USERS[currentUser.id] = data;
                } else {
                    // User was deleted from database - force immediate logout and cache clear
                    console.warn('App: User account no longer exists in database. Forcing logout.');
                    clearAllLocalData();
                }
            });

            // Listen to the user's chat list to populate the sidebar
            console.log('App: Setting up user_chats listener...');
            // Normalize path to lowercase to ensure consistency with sendMsg/delete logic
            onValue(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), (snapshot) => {
                const chatMap = snapshot.val() || {};
                // CRITICAL: Filter out legacy ghost IDs immediately at the source
                const chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

                console.log(`App: Found ${chatIds.length} valid recent chats.`);

                // Fetch info in background, don't block the UI
                chatIds.forEach(id => {
                    fetchUser(id).then(() => renderSidebar()).catch(e => console.warn(e));
                });

                renderSidebar();
                initGlobalNotificationMonitor();



                if (window.innerWidth >= 1024 && !activeTargetId) {
                    const sorted = chatIds.sort((a, b) => (chatMap[b] || 0) - (chatMap[a] || 0));
                    const firstUserId = sorted[0];
                    if (firstUserId) {
                        console.log('App: Desktop mode, switching to first valid chat:', firstUserId);
                        switchChat(firstUserId);
                    }
                }
            });
        }

        window.saveProfileName = async (e) => {
            const rawFirst = document.getElementById('firstNameInput').value.trim();
            const rawLast = document.getElementById('lastNameInput').value.trim();
            const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
            const last = rawLast.charAt(0).toUpperCase() + rawLast.slice(1);
            const newName = [first, last].filter(Boolean).join(' ');

            if (!newName) return alert("Please enter a valid name");

            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = "Updating...";
            btn.disabled = true;

            try {
                await update(ref(db, `users/${currentUser.id}`), { name: newName });
                currentUser.name = newName;
                btn.innerText = "Saved!";
                setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
            } catch (error) {
                alert("Failed to update name: " + error.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };

        window.applyTheme = (mode) => {
            SETTINGS.theme = mode;
            localStorage.setItem('theme', mode);
            const html = document.documentElement;
            if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) html.classList.add('dark');
            else html.classList.remove('dark');
        };
        applyTheme(SETTINGS.theme);

        window.clearGlobalSearch = () => {
            const input = document.getElementById('globalSearchInput');
            const results = document.getElementById('globalSearchResults');
            const resultList = document.getElementById('searchResultList');
            const clearBtn = document.getElementById('globalSearchClear');
            if (input) input.value = '';
            if (results) results.classList.add('hidden');
            if (resultList) resultList.innerHTML = '';
            if (clearBtn) clearBtn.classList.add('hidden');
        };

        window.currentSearchCategory = 'all';
        window.setSearchCategory = (cat) => {
            // Click the same category -> back to 'all'
            if (window.currentSearchCategory === cat) {
                window.currentSearchCategory = 'all';
            } else {
                window.currentSearchCategory = cat;
            }

            document.querySelectorAll('.search-cat-btn').forEach(btn => {
                const btnCat = btn.id.replace('searchCat-', '');
                if (window.currentSearchCategory === 'all') {
                    // In global search, no highlights
                    btn.classList.remove('text-white', 'opacity-100');
                    btn.classList.add('text-gray-400', 'opacity-50');
                } else if (btnCat === window.currentSearchCategory) {
                    btn.classList.add('text-white', 'opacity-100');
                    btn.classList.remove('text-gray-400', 'opacity-50');
                } else {
                    btn.classList.remove('text-white', 'opacity-100');
                    btn.classList.add('text-gray-400', 'opacity-50');
                }
            });

            const input = document.getElementById('globalSearchInput');
            if (input && input.value.trim().length >= 2) {
                handleGlobalSearch({ target: input });
            }
        };

        let searchTimeout;
        window.handleGlobalSearch = (e) => {
            clearTimeout(searchTimeout);
            const term = e.target.value.trim();
            const results = document.getElementById('globalSearchResults');
            const resultList = document.getElementById('searchResultList');
            const clearBtn = document.getElementById('globalSearchClear');

            if (term.length < 2) {
                if (clearBtn) term ? clearBtn.classList.remove('hidden') : clearBtn.classList.add('hidden');
                if (results) { results.classList.add('hidden'); if (resultList) resultList.innerHTML = ''; }
                return;
            }

            searchTimeout = setTimeout(async () => {
                if (clearBtn) clearBtn.classList.remove('hidden');
                let html = '';
                const cat = window.currentSearchCategory;
                const termLower = term.toLowerCase();

                // 1. People - Only if 'all' or 'messages'
                if (cat === 'all' || cat === 'messages') {
                    try {
                        const now = Date.now();
                        // Fetch or Refresh the "Hot Index" if older than 5 minutes or nearly empty
                        if (!window._lastUserFetch || (now - window._lastUserFetch > 300000) || Object.keys(ALL_USERS).length < 10) {
                            const allSnap = await get(query(ref(db, 'users'), orderByKey(), limitToFirst(5000)));
                            if (allSnap.exists()) {
                                Object.assign(ALL_USERS, allSnap.val());
                                window._lastUserFetch = now;
                            }
                        }

                        // Thorough local filter on the complete hot index
                        const matchedIds = Object.keys(ALL_USERS).filter(id => {
                            if (id === currentUser.id) return false;
                            const u = ALL_USERS[id];
                            const n = (u.name || '').toLowerCase();
                            const e = (u.email || '').toLowerCase();
                            const i = id.toLowerCase();
                            return n.includes(termLower) || e.includes(termLower) || i.includes(termLower);
                        });

                        if (matchedIds.length > 0) {
                            html += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">People</div>`;
                            const sortedMatches = matchedIds.sort((a, b) => {
                                const nameA = (ALL_USERS[a].name || '').toLowerCase();
                                const nameB = (ALL_USERS[b].name || '').toLowerCase();
                                if (nameA.startsWith(termLower) && !nameB.startsWith(termLower)) return -1;
                                if (!nameA.startsWith(termLower) && nameB.startsWith(termLower)) return 1;
                                return 0;
                            }).slice(0, 10);

                            for (const id of sortedMatches) {
                                const isMe = id === currentUser.id;
                                const u = isMe ? currentUser : ALL_USERS[id];
                                let avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || id)}&background=random`;
                                if (u.email === ADMIN_EMAIL) avatar = window.CONSTANTS.SUSHI_AVATAR;

                                const escapedId = id.replace(/'/g, "\\'");
                                html += `<div onclick="switchChat('${escapedId}'); clearGlobalSearch();" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                    <img src="${avatar}" class="w-9 h-9 rounded-full shadow-sm object-cover">
                                    <div><div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name || id)}</div><div class="text-xs text-gray-400">${escapeHTML(u.email || id)}</div></div>
                                </div>`;
                            }
                        }
                    } catch (err) { console.warn('Aggressive search failed:', err); }
                }

                // 1.5 Tools & Extensions Search - Only if 'all' or 'tools'
                if (cat === 'all' || cat === 'tools') {
                    const toolsResults = [];
                    const fullRegistry = [
                        { id: 'grade_calc', name: 'Grade Calculator', desc: 'Calculate your HCPSS final grades', type: 'module' },
                        { id: 'cafeteria', name: 'Cafeteria Menu', desc: 'View today\'s menus', type: 'module' },
                        { id: 'chs_info', name: 'CHS Info', desc: 'School links and resources', type: 'module' },
                        { id: 'calc_volume_3d', name: 'BC Volume 3D Present', desc: 'Extension Tool', type: 'extension' },
                        { id: 'independent_research', name: 'IR Navigator', desc: 'Extension Tool', type: 'extension' },
                        { id: 'selection_logic', name: 'Selection Logic Visualizer', desc: 'Extension Tool', type: 'extension' },
                        { id: 'honor_roll', name: 'Honor Roll', desc: 'Extension Tool', type: 'extension' }
                    ];

                    fullRegistry.forEach(t => {
                        if (t.name.toLowerCase().includes(termLower) || t.desc.toLowerCase().includes(termLower)) {
                            toolsResults.push(t);
                        }
                    });

                    if (toolsResults.length > 0) {
                        html += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tools</div>`;
                        toolsResults.forEach(t => {
                            const onClick = t.type === 'module' ? `openModule('${t.id}')` : `openExtension('${t.id}')`;
                            html += `
                                <div onclick="${onClick}; clearGlobalSearch();" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                    <div class="w-9 h-9 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(t.name)}</div>
                                        <div class="text-xs text-gray-400">${escapeHTML(t.desc)}</div>
                                    </div>
                                </div>`;
                        });
                    }
                }

                // 1.8 People Search - Only if 'all' or 'people'
                if (cat === 'all' || cat === 'people') {
                    const peopleResults = [];
                    if (window.allUsers) {
                        Object.values(window.allUsers).forEach(u => {
                            if (u.name.toLowerCase().includes(termLower) || (u.username && u.username.toLowerCase().includes(termLower))) {
                                peopleResults.push(u);
                            }
                        });
                    }

                    if (peopleResults.length > 0) {
                        html += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">People</div>`;
                        peopleResults.forEach(u => {
                            const photo = u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
                            html += `
                                <div onclick="openDirectChat('${u.id}'); clearGlobalSearch();" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                    <img src="${photo}" class="w-9 h-9 rounded-full object-cover">
                                    <div class="flex-1">
                                        <div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name)}</div>
                                        <div class="text-xs text-gray-400">@${escapeHTML(u.username || 'user')}</div>
                                    </div>
                                </div>`;
                        });
                    }
                }

                // 2. Global Messages Search
                if (cat === 'all' || cat === 'messages') {
                    if (!localDB) await dbReady;
                    try {
                        const tx = localDB.transaction("messages", "readonly");
                        const store = tx.objectStore("messages");
                        const allMsgs = await new Promise(res => {
                            const req = store.getAll();
                            req.onsuccess = () => res(req.result || []);
                        });
                        const currentUserIdLower = currentUser.id.toLowerCase();
                        const filtered = allMsgs.filter(m => {
                            if (!m.text || !m.chatId) return false;
                            if (m.type === 'image' || m.type === 'image_group' || m.text.startsWith('data:image')) return false;
                            if (m.chatId.startsWith('group_')) {
                                const classId = m.chatId.replace('group_', '');
                                if (!sidebarClasses[classId]) return false;
                            } else {
                                const participants = m.chatId.toLowerCase().split('_');
                                if (!participants.includes(currentUserIdLower)) return false;
                            }
                            return m.text.toLowerCase().includes(termLower);
                        }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15);

                        if (filtered.length > 0) {
                            html += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Messages</div>`;
                            filtered.forEach(m => {
                                let chatName = "Chat";
                                let jumpId = m.chatId;
                                if (m.chatId.startsWith('group_')) {
                                    const classId = m.chatId.replace('group_', '');
                                    chatName = cnCache[classId] || "Class Chat";
                                } else {
                                    const parts = m.chatId.split('_');
                                    if (parts.length >= 2) {
                                        const otherId = parts[0] === currentUser.id ? parts[1] : parts[0];
                                        chatName = ALL_USERS[otherId]?.name || otherId;
                                        jumpId = otherId;
                                    }
                                }
                                const escapedJumpId = jumpId.replace(/'/g, "\\'");
                                const escapedText = m.text.replace(/'/g, "\\'").replace(/\n/g, " ");
                                html += `<div onclick="switchChat('${escapedJumpId}'); setTimeout(() => jumpToMessage('${escapedText}'), 500); clearGlobalSearch();" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                    <div class="text-xs font-bold text-[#007AFF] mb-0.5">in ${escapeHTML(chatName)}</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-snug">${escapeHTML(m.text)}</div>
                                </div>`;
                            });
                        }
                    } catch (e) { }
                }

                // 3. Local Stores (News & Modules)
                if (cat === 'all' || cat === 'news' || cat === 'community') {
                    const searchLocalStore = async (storeName, label, targetCat) => {
                        if (cat !== 'all' && cat !== targetCat) return;
                        try {
                            const tx = localDB.transaction(storeName, "readonly");
                            const store = tx.objectStore(storeName);
                            const items = await new Promise(res => {
                                const req = store.getAll();
                                req.onsuccess = () => res(req.result || []);
                            });
                            let tempHtml = '';
                            items.forEach(item => {
                                const t = (item.title || item.name || '').toLowerCase();
                                const d = (item.desc || item.text || '').toLowerCase();
                                if (t.includes(termLower) || d.includes(termLower)) {
                                    const typeOrModule = storeName === 'news' ? item.tabType : item.moduleName;
                                    tempHtml += `<div onclick="handlePostJump('${storeName}', '${item.key}', '${typeOrModule}');" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">${label}</div>
                                        <div class="text-[14px] font-semibold text-black dark:text-white line-clamp-1">${escapeHTML(item.title || item.name || 'Post')}</div>
                                        <div class="text-xs text-gray-500 line-clamp-1 mt-0.5">${escapeHTML(item.desc || item.text || '')}</div>
                                    </div>`;
                                }
                            });
                            if (tempHtml) html += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">${storeName === 'news' ? 'Announcements' : 'Community'}</div>` + tempHtml;
                        } catch (e) { }
                    };
                    if (localDB) {
                        await searchLocalStore('news', 'Announcement', 'news');
                        await searchLocalStore('modules', 'Community', 'community');
                    }
                }

                // Final render
                if (html === '') {
                    if (resultList) resultList.innerHTML = '<div class="px-4 py-10 text-center text-gray-400 text-xs">No results found.</div>';
                } else {
                    if (resultList) resultList.innerHTML = html;
                }
                if (results) results.classList.remove('hidden');
            }, 300);
        };

        window.handlePostJump = (storeName, itemId, typeOrModule) => {
            if (storeName === 'news') {
                if (window.innerWidth < 1024) switchTab('news');
                switchLeftTab('news');
                toggleNewsTab(typeOrModule);
                setTimeout(() => {
                    const containerId = typeOrModule === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                    const container = document.getElementById(containerId);
                    if (container) {
                        const items = Array.from(container.children);
                        const target = items.find(it => it.innerHTML.includes(itemId) || it.innerText.includes(itemId));
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Wait for scroll to settle before highlighting
                            setTimeout(() => window.UIUtils.highlight(target), 600);
                        }
                    }
                }, 500);
            } else if (storeName === 'modules') {
                switchLeftTab('more');
                openModule(typeOrModule);
                setTimeout(() => openPostDetail(itemId), 400);
            }
            clearGlobalSearch();
        };

        window.jumpToMessage = (text) => {
            const chatBox = document.getElementById('chatBox');
            // Try to find by content
            const messages = Array.from(chatBox.querySelectorAll('.msg-pop'));
            const target = messages.find(m => m.innerText.includes(text));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Apply simple highlight to the main bubble or image after scroll
                const bubble = target.querySelector('.bg-\\[\\#007AFF\\], .bg-\\[\\#E9E9EB\\], .dark\\:bg-gray-700, img');
                if (bubble) {
                    setTimeout(() => window.UIUtils.highlight(bubble), 600);
                }
            } else {
                // Fallback to internal search if not found in current loaded view
                const input = document.getElementById('chatSearchInput');
                if (input) {
                    input.value = text;
                    input.dispatchEvent(new Event('input'));
                }
            }
        };

        window.clearSearch = () => {
            const input = document.getElementById('chatSearchInput');
            if (input) input.value = '';
            const btn = document.getElementById('clearSearchBtn');
            if (btn) btn.classList.add('hidden');
            const resultsBox = document.getElementById('searchResults');
            if (resultsBox) { resultsBox.classList.add('hidden'); resultsBox.innerHTML = ''; }
        };

        window.handleSearch = (e, scope) => {
            const term = e.target.value.toLowerCase().trim();
            if (scope === 'sidebar') {
                let matchCount = 0;
                document.querySelectorAll('#sidebarList > div').forEach(item => {
                    const nameEl = item.querySelector('span');
                    if (!nameEl) return;
                    const name = nameEl.innerText.toLowerCase();
                    const visible = name.includes(term);
                    item.style.display = visible ? 'flex' : 'none';
                    if (visible) matchCount++;
                });

                // If no matches in recent chats, suggest global search
                const existingHint = document.getElementById('sidebarSearchHint');
                if (term && matchCount === 0) {
                    if (!existingHint) {
                        const hint = document.createElement('div');
                        hint.id = 'sidebarSearchHint';
                        hint.className = "p-4 text-center text-gray-400 text-[13px]";
                        hint.innerHTML = `No recent chats match "${term}".<br>Use <b>Global Search</b> (top bar) to find anyone in school.`;
                        document.getElementById('sidebarList').appendChild(hint);
                    }
                } else if (existingHint) {
                    existingHint.remove();
                }
            } else if (scope === 'chat') {
                const resultsBox = document.getElementById('searchResults');
                const clearBtn = document.getElementById('clearSearchBtn');
                if (!term) { resultsBox.classList.add('hidden'); clearBtn.classList.add('hidden'); return; }
                clearBtn.classList.remove('hidden');
                resultsBox.innerHTML = '';
                let hasResults = false;
                document.querySelectorAll('#chatBox .msg-pop').forEach(msg => {
                    const textDiv = msg.querySelector('div[class*="px-"]');
                    if (!textDiv) return;
                    if (textDiv.innerText.toLowerCase().includes(term)) {
                        hasResults = true;
                        const item = document.createElement('div');
                        item.className = "p-3 pl-5 pr-10 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-white/5 transition-all group hover:bg-gray-50 dark:hover:bg-white/5";
                        const escapedSnippet = escapeHTML(textDiv.innerText);
                        item.innerHTML = `<div class="text-[14px] line-clamp-2 text-black dark:text-white">${escapedSnippet.replace(new RegExp(`(${term})`, 'gi'), '<span class="text-[#007AFF] font-bold">$1</span>')}</div>`;
                        item.onclick = () => {
                            msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            window.UIUtils.highlight(textDiv);
                        };
                        resultsBox.appendChild(item);
                    }
                });
                if (!hasResults) resultsBox.innerHTML = '<div class="p-4 text-[14px] text-gray-500 text-center font-medium">No Results Found</div>';
                resultsBox.classList.remove('hidden');
            }
        };

        function initSettingsUI() {
            document.getElementById('soundToggle').checked = SETTINGS.soundEnabled;
            updateSettingsLabels();
            const soundDropdown = document.getElementById('soundDropdown');
            if (soundDropdown) {
                soundDropdown.innerHTML = '';
                SOUNDS.forEach((s, index) => {
                    const btn = document.createElement('button');
                    btn.className = `w-full text-left px-4 py-3 text-[15px] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${index !== SOUNDS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`;
                    btn.innerText = s.name;
                    btn.onclick = (e) => selectSound(s.url, e);
                    soundDropdown.appendChild(btn);
                });
            }

            if (isAppAdmin()) {
                document.getElementById('adminPanel')?.classList.remove('hidden');
                document.getElementById('openaiKeyInput').value = SYSTEM_OPENAI_KEY || '';
            }
            window.saveAdminConfig = async () => {
                if (!isAppAdmin()) return;
                const val = document.getElementById('openaiKeyInput').value.trim();
                if (!val) { alert("Please enter a key."); return; }
                try {
                    await set(ref(db, 'config/openai_key'), val);
                    SYSTEM_OPENAI_KEY = val;
                    alert("Admin Config Saved!");
                } catch (err) {
                    alert("Cloud Save Failed: " + err.message);
                }
            };
        }

        function updateSettingsLabels() {
            document.getElementById('currentSoundLabel') ? document.getElementById('currentSoundLabel').innerText = SOUNDS.find(s => s.url === SETTINGS.soundUrl)?.name || 'Note' : null;
            document.getElementById('currentThemeLabel').innerText = SETTINGS.theme.charAt(0).toUpperCase() + SETTINGS.theme.slice(1);
        }

        window.updateSound = (url) => { SETTINGS.soundUrl = url; localStorage.setItem('soundUrl', url); notifySound = new Audio(url); notifySound.play(); };
        window.toggleSound = (enabled) => { SETTINGS.soundEnabled = enabled; localStorage.setItem('soundEnabled', enabled); };
        window.showChangelog = () => {
            document.getElementById('settingsView').classList.add('hidden');
            document.getElementById('changelogView').classList.remove('hidden');
            document.getElementById('modalTitle').innerText = "Engineering Log";
            const backBtn = document.createElement('button');
            backBtn.id = 'changelogBackBtn';
            backBtn.innerText = "Back";
            backBtn.className = "text-[#007AFF] font-medium text-[17px]";
            backBtn.onclick = () => {
                document.getElementById('changelogView').classList.add('hidden');
                document.getElementById('settingsView').classList.remove('hidden');
                document.getElementById('modalTitle').innerText = "Settings";
                backBtn.remove();
            };
            const header = document.querySelector('#settingsModal .rounded-t-2xl');
            const doneBtn = header.querySelector('button');
            doneBtn.classList.add('hidden');
            header.insertBefore(backBtn, doneBtn);
            window._restoreSettingsHeader = () => {
                backBtn.remove();
                doneBtn.classList.remove('hidden');
                document.getElementById('modalTitle').innerText = "Settings";
            };
        };

        window.toggleSettings = (view = 'settings') => {
            const modal = document.getElementById('settingsModal');
            const sv = document.getElementById('settingsView');
            const dv = document.getElementById('donationView');
            const cv = document.getElementById('changelogView');
            const title = document.getElementById('modalTitle');

            if (modal.classList.contains('hidden')) {
                if (view === 'settings') {
                    sv.classList.remove('hidden');
                    dv.classList.add('hidden');
                    title.innerText = "Settings";
                    if (currentUser && currentUser.name) {
                        const parts = currentUser.name.split(' ');
                        document.getElementById('firstNameInput').value = parts[0] || '';
                        document.getElementById('lastNameInput').value = parts.slice(1).join(' ') || '';
                    }
                } else {
                    sv.classList.add('hidden');
                    dv.classList.remove('hidden');
                    title.innerText = "Support Development";
                    // Reset QR view to show buttons
                    document.getElementById('donationQRContainer')?.classList.add('hidden');
                    document.getElementById('donationButtons')?.classList.remove('hidden');
                }
                modal.classList.remove('hidden', 'fade-out');
                modal.classList.add('fade-in');
            } else {
                modal.classList.add('fade-out');
                setTimeout(() => modal.classList.add('hidden'), 250);
            }
        };

        window.toggleDonation = () => toggleSettings('donation');

        window.openDonationQR = (method, fallbackUrl) => {
            const qrContainer = document.getElementById('donationQRContainer');
            const qrImg = document.getElementById('donationQRImg');
            const donationButtons = document.getElementById('donationButtons');
            if (!qrContainer || !qrImg) return;

            // Clear previous image and show loading state if needed
            qrImg.src = '';
            qrImg.onerror = () => {
                qrImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f9f9fb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23999"%3EQR Code Coming Soon%3C/text%3E%3C/svg%3E';
            };

            // Use database URL if available, otherwise fallback to local path
            qrImg.src = DONATIONS[method] || fallbackUrl;
            qrContainer.classList.remove('hidden');
            donationButtons.classList.add('hidden');
        };

        window.closeDonationQR = () => {
            const qrContainer = document.getElementById('donationQRContainer');
            const donationButtons = document.getElementById('donationButtons');
            if (qrContainer) qrContainer.classList.add('hidden');
            if (donationButtons) donationButtons.classList.remove('hidden');
        };

        /* --- STEP 1 & 2: UNIFIED VIEW MANAGER --- */
        window.AppView = {
            currentPanel: 'news', // Default panel
            isMobile: () => window.innerWidth <= 850,

            // Unified panel visibility controller
            showPanel: function (panelId) {
                const newsSec = document.getElementById('newsSection');
                const sidePanel = document.getElementById('sidePanel');
                const chatSec = document.getElementById('chatSection');
                const bottomNav = document.getElementById('bottomNav');

                if (!newsSec || !sidePanel || !chatSec) return;

                this.currentPanel = panelId;
                const mobile = this.isMobile();

                // Logic for Desktop: Everything is visible (flex)
                if (!mobile) {
                    newsSec.classList.remove('hidden'); newsSec.classList.add('flex');
                    sidePanel.classList.remove('hidden'); sidePanel.classList.add('flex');
                    chatSec.classList.remove('hidden'); chatSec.classList.add('flex');
                    if (bottomNav) bottomNav.classList.add('hidden');
                    return;
                }

                // Logic for Mobile: One panel at a time
                [newsSec, sidePanel, chatSec].forEach(p => {
                    p.classList.add('hidden');
                    p.classList.remove('flex', 'slide-in-left', 'slide-in-right');
                });

                if (panelId === 'news') {
                    newsSec.classList.remove('hidden'); newsSec.classList.add('flex');
                    if (bottomNav) bottomNav.classList.remove('hidden');
                } else if (panelId === 'tools') {
                    sidePanel.classList.remove('hidden'); sidePanel.classList.add('flex');
                    if (bottomNav) bottomNav.classList.remove('hidden');
                } else if (panelId === 'chat') {
                    chatSec.classList.remove('hidden'); chatSec.classList.add('flex');
                    // Hide bottom nav when actively chatting to maximize space
                    if (bottomNav) bottomNav.classList.add('hidden');
                }
            }
        };

        window.switchLeftTab = (tab) => {
            const tabs = ['news', 'tools', 'more'];
            const labels = { 'news': 'headTabNews', 'tools': 'headTabTools', 'more': 'headTabMore' };
            const contents = {
                'news': document.getElementById('newsMainContent'),
                'tools': document.getElementById('toolsMainContent'),
                'more': document.getElementById('moreMainContent')
            };

            const currentTabId = document.querySelector('.head-tab-active')?.id || 'headTabNews';
            const currentTab = currentTabId.replace('headTab', '').toLowerCase();
            const currentIndex = tabs.indexOf(currentTab);
            const targetIndex = tabs.indexOf(tab);

            if (currentIndex === targetIndex) return;

            // Update Header Styles
            tabs.forEach(t => {
                const el = document.getElementById(labels[t]);
                if (!el) return;
                if (t === tab) {
                    el.className = "text-3xl font-bold tracking-tight text-black dark:text-white transition-all leading-none head-tab-active";
                } else {
                    el.className = "text-2xl font-bold tracking-tight text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all leading-none mb-0.5";
                }
            });

            // Revert to original Style-based transitions
            tabs.forEach((t, idx) => {
                const content = contents[t];
                if (!content) return;

                if (t === tab) {
                    content.style.opacity = '1';
                    content.style.transform = 'translateX(0)';
                    content.style.pointerEvents = 'auto';
                    content.style.zIndex = '10';
                } else {
                    const offset = (idx < targetIndex) ? '-40px' : '40px';
                    content.style.opacity = '0';
                    content.style.transform = `translateX(${offset})`;
                    content.style.pointerEvents = 'none';
                    content.style.zIndex = '0';
                }
            });

            // Special News Sub-tabs handling
            const subTabs = document.getElementById('newsSubTabsWrapper');
            const addBtn = document.getElementById('addAnnouncementBtn');
            if (subTabs) {
                if (tab === 'news') {
                    subTabs.style.height = '32px'; subTabs.style.opacity = '1'; subTabs.style.marginTop = '0.75rem';
                    if (addBtn && isAppStaff()) addBtn.classList.remove('hidden');
                } else {
                    subTabs.style.height = '0'; subTabs.style.opacity = '0'; subTabs.style.marginTop = '0';
                    if (addBtn) addBtn.classList.add('hidden');
                }
            }

            // Sync with AppView for visibility
            if (window.AppView) {
                const panelMap = { 'news': 'news', 'tools': 'tools', 'more': 'chat' };
                window.AppView.showPanel(panelMap[tab]);
            }

            updateSettingsLabels();
        };
        window.toggleDropdown = (id, e) => {
            if (e) e.stopPropagation();
            const dropdown = document.getElementById(id);
            const isHidden = dropdown.classList.contains('hidden');

            document.querySelectorAll('.custom-dropdown').forEach(el => {
                if (el.id !== id) {
                    el.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => { if (el.classList.contains('opacity-0')) el.classList.add('hidden'); }, 200);
                }
            });

            if (isHidden) {
                dropdown.classList.remove('hidden');
                requestAnimationFrame(() => dropdown.classList.remove('opacity-0', 'scale-95'));
            } else {
                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => { if (dropdown.classList.contains('opacity-0')) dropdown.classList.add('hidden'); }, 200);
            }
        };
        const UNREAD_CHATS = new Set();
        let ORIGINAL_FAVICON = document.querySelector('link[rel="icon"]')?.href || '';

        window.updateGlobalUnreadStatus = () => {
            const unreadCount = UNREAD_CHATS.size;
            const mainDot = document.getElementById('mainUnreadDot');

            if (unreadCount > 0) {
                if (mainDot) mainDot.classList.remove('hidden');
                document.title = `(${unreadCount}) CHS Chat & Social`;
            } else {
                if (mainDot) mainDot.classList.add('hidden');
                document.title = `CHS Chat & Social`;
            }
            window.updateFaviconStatus(unreadCount > 0);
        };

        window.updateFaviconStatus = (hasUnread) => {
            const favicon = document.querySelector('link[rel="icon"]');
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (!favicon) return;

            if (!hasUnread) {
                favicon.href = ORIGINAL_FAVICON;
                if (appleIcon) appleIcon.href = ORIGINAL_FAVICON;
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, 64, 64);
                ctx.drawImage(img, 0, 0, 64, 64);

                // Draw Blue Dot in bottom right
                ctx.beginPath();
                ctx.arc(50, 50, 12, 0, 2 * Math.PI);
                ctx.fillStyle = '#007AFF';
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();

                const dataUrl = canvas.toDataURL('image/png');
                favicon.href = dataUrl;
                if (appleIcon) appleIcon.href = dataUrl;
            };
            img.src = ORIGINAL_FAVICON;
        };

        function initGlobalNotificationMonitor() {
            // Only listen to users we have already interacted with
            Object.keys(ALL_USERS).forEach(targetId => {
                if (targetId === currentUser.id || globalListeners.has(targetId)) return;
                const chatId = getChatId(currentUser.id, targetId);
                onChildAdded(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(1)), (snap) => {
                    const msg = snap.val();
                    if (msg && msg.senderId !== currentUser.id && msg.timestamp > APP_START_TIME) {
                        if (SETTINGS.soundEnabled) notifySound.play().catch(() => { });
                        UNREAD_CHATS.add(targetId);
                        document.getElementById(`dot-${targetId}`)?.classList.remove('hidden');
                        window.updateGlobalUnreadStatus();

                        // Also update chat timestamp to bring to top
                        update(ref(db, `user_chats/${currentUser.id}`), { [targetId]: serverTimestamp() });
                    }
                });
                globalListeners.add(targetId);
            });
        }

        let isRenderingSidebar = false;
        window.sidebarMode = 'recent'; // 'recent', 'all', or 'class'

        window.switchSidebarTab = (mode) => {
            if (window.sidebarMode === mode) {
                // If already in class mode and inside a specific class, clicking 'Class' tab should go back to list
                if (mode === 'class' && window.currentClassId) {
                    window.currentClassId = null;
                    window._isPopNav = true;
                    window.renderSidebar(true);
                }
                return;
            }
            window.sidebarMode = mode;
            window.currentClassId = null; // Reset Level 2 view when switching tabs
            window.renderSidebar(true);
        };

        window.renderSidebar = async function (isTabSwitch = false) {
            if (isRenderingSidebar) return;
            const container = document.getElementById('sidebarList');
            if (!container || !currentUser) return;

            isRenderingSidebar = true;

            // 1. Level 2 (Class Detail) View - Only if we have a currentClassId and are in 'class' mode
            if (window.sidebarMode === 'class' && window.currentClassId) {
                try {
                    await renderClassLevel2(container, isTabSwitch);
                } catch (err) {
                    console.error('renderClassLevel2 error:', err);
                    container.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">Failed to load class roster.</div>';
                } finally {
                    isRenderingSidebar = false;
                }
                return;
            }

            // 1b. Level 2 (Recently Joined) View
            if (window.sidebarMode === 'recent_joined') {
                try {
                    await renderRecentlyJoinedLevel2(container, isTabSwitch);
                } catch (err) {
                    console.error('renderRecentlyJoinedLevel2 error:', err);
                    container.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">Failed to load new members.</div>';
                } finally {
                    isRenderingSidebar = false;
                }
                return;
            }

            // 2. Level 1 (Tabs) View
            if (!container.querySelector('.sidebar-tabs')) {
                container.innerHTML = `
                    <div class="sidebar-tabs flex items-center border-b border-gray-100 dark:border-white/5 h-11 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
                        <button onclick="window.switchSidebarTab('recent')" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors ${window.sidebarMode === 'recent' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}">Recent</button>
                        <div class="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <button onclick="window.switchSidebarTab('all')" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors ${window.sidebarMode === 'all' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}">Contacts</button>
                        <div class="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <button onclick="window.switchSidebarTab('class')" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors ${window.sidebarMode === 'class' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}">Class</button>
                    </div>
                    <div id="sidebarSubList" class="flex-1 overflow-y-auto"></div>
                `;
            } else {
                const btns = container.querySelectorAll('.sidebar-tabs button');
                btns[0].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full transition-colors ${window.sidebarMode === 'recent' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}`;
                btns[1].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full transition-colors ${window.sidebarMode === 'all' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}`;
                btns[2].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full transition-colors ${window.sidebarMode === 'class' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}`;
            }

            const subList = document.getElementById('sidebarSubList');
            if (isTabSwitch || window._isPopNav) {
                // Don't clear here to avoid flash, let renderers handle it
                subList.classList.remove('sidebar-pop', 'sidebar-push');
            }

            try {
                if (window.sidebarMode === 'class') {
                    await renderClassLevel1(subList);
                } else {
                    await renderUserSidebarItems(subList);
                }

                // TRIGGER ANIMATION AFTER CONTENT IS LOADED
                if (isTabSwitch || window._isPopNav) {
                    void subList.offsetWidth; // Trigger reflow
                    requestAnimationFrame(() => {
                        subList.classList.add('sidebar-pop');
                        window._isPopNav = false;
                    });
                }
            } catch (err) {
                console.error('renderSidebar error:', err);
            } finally {
                isRenderingSidebar = false;
            }
        };

        // Refresh sidebar and active chat status every minute to keep "last seen" times fresh
        setInterval(() => {
            if (window.renderSidebar && !isRenderingSidebar) window.renderSidebar();
            // Update active chat status if it's an individual chat
            if (activeTargetId && !activeTargetId.startsWith('group_')) {
                const u = ALL_USERS[activeTargetId];
                if (u && u.lastSeen) {
                    const statusEl = document.getElementById('chatStatus');
                    if (statusEl) {
                        const statusText = formatLastSeen(u.lastSeen);
                        statusEl.innerText = statusText;
                        if (statusText === "online") {
                            statusEl.classList.add('text-[#007AFF]');
                            statusEl.classList.remove('text-gray-400');
                        } else {
                            statusEl.classList.remove('text-[#007AFF]');
                            statusEl.classList.add('text-gray-400');
                        }
                    }
                }
            }
        }, 60000);

        // Helper: Level 1 Class List
        async function renderClassLevel1(container) {
            try {
                const snap = await get(ref(db, 'classes'));
                const allClasses = snap.val() || {};
                const myClasses = Object.keys(allClasses)
                    .map(id => ({ id, ...allClasses[id] }))
                    .filter(c => c.teacherId === currentUser.id || (c.students && c.students[currentUser.id]));

                container.innerHTML = '';
                const wrapper = document.createElement('div');

                if (isAppStaff()) {
                    const createBtn = document.createElement('div');
                    createBtn.className = 'p-4 px-6 cursor-pointer flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group';
                    createBtn.onclick = () => addNewClass();
                    createBtn.innerHTML = `
                        <div class="w-10 h-10 bg-[#007AFF]/10 rounded-xl flex items-center justify-center text-[#007AFF]">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        </div>
                        <div>
                            <div class="font-bold text-base text-[#007AFF]">Create New Class</div>
                            <div class="text-xs text-gray-400 mt-0.5">Set up a new roster and group chat</div>
                        </div>
                    `;
                    wrapper.appendChild(createBtn);
                }

                if (myClasses.length === 0) {
                    const noClass = document.createElement('div');
                    noClass.className = 'p-10 text-center text-gray-400 text-sm font-medium';
                    noClass.innerText = 'You are not enrolled in any classes yet.';
                    wrapper.appendChild(noClass);
                } else {
                    myClasses.forEach(c => {
                        cnCache[c.id] = c.name;
                        const escName = escapeHTML(c.name);
                        const item = document.createElement('div');
                        item.className = 'p-4 px-6 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group';
                        item.onclick = () => {
                            window.currentClassId = c.id;
                            window.renderSidebar();
                            if (window.innerWidth >= 1024) switchChat('group_' + c.id);
                        };
                        item.innerHTML = `
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-[#007AFF]">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                                </div>
                                <div>
                                    <div class="font-bold text-base text-black dark:text-white leading-tight">${escName}</div>
                                    <div class="text-xs text-gray-400 mt-0.5">Click to view members</div>
                                </div>
                            </div>
                        `;
                        wrapper.appendChild(item);
                    });
                }

                container.appendChild(wrapper);
                window._isPopNav = false;
            } catch (err) {
                console.error('renderClassLevel1 error:', err);
                container.innerHTML = '<div class="p-10 text-center text-red-500 text-xs">Failed to load classes.</div>';
            }
        }

        // Helper: Level 2 Recently Joined List
        async function renderRecentlyJoinedLevel2(container, isTabSwitch) {
            try {
                // Optimization: If already in Recently Joined level 2, don't re-render shell
                const existingSubList = document.getElementById('sidebarSubList');
                const isAlreadyInRecentJoined = existingSubList && container.querySelector('.uppercase.tracking-widest')?.innerText.toUpperCase() === "NEW MEMBERS";

                if (!isAlreadyInRecentJoined) {
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E] ${isTabSwitch ? '' : 'sidebar-push'}">
                            <div class="flex items-center px-4 h-11 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 relative">
                                <button onclick="goBackToRecent()" class="text-[#007AFF] flex items-center text-sm font-bold z-10">
                                    <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                    Back
                                </button>
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div class="font-bold text-sm text-black dark:text-white uppercase tracking-widest text-center">New Members</div>
                                </div>
                            </div>
                            <div id="sidebarSubList" class="flex-1 overflow-y-auto">
                                <div class="p-4 space-y-4 animate-pulse">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const subList = document.getElementById('sidebarSubList');
                const recentSnap = await get(query(ref(db, 'users'), orderByKey(), limitToLast(20)));
                if (recentSnap.exists()) {
                    subList.innerHTML = '';
                    const users = recentSnap.val();
                    const sortedIds = Object.keys(users).reverse();

                    sortedIds.forEach(id => {
                        if (id === currentUser.id) return;
                        const u = users[id];
                        if (!ALL_USERS[id]) ALL_USERS[id] = u;

                        // Check for Teacher badge logic (unified with main sidebar)
                        let badge = '';
                        if (u.email === ADMIN_EMAIL) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                        else if (u.role === 'teacher' || (u.email && u.email.endsWith('@hcpss.org'))) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';

                        const div = document.createElement('div');
                        div.className = "p-3 pl-5 cursor-pointer flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/5 dark:hover:bg-white/5 transition-colors group";
                        div.onclick = () => switchChat(id);
                        div.innerHTML = `
                            <div class="flex flex-col overflow-hidden">
                                <span class="font-bold text-sm text-black dark:text-white truncate flex items-center">${escapeHTML(u.name || id)}${badge}</span>
                                <span class="text-xs text-gray-400 truncate">${escapeHTML(u.email || id)}</span>
                            </div>
                        `;
                        subList.appendChild(div);
                    });
                }
            } catch (err) {
                console.error('renderRecentlyJoinedLevel2 error:', err);
                container.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">Failed to load new members.</div>';
            }
        }

        // Helper: Level 2 Class Member List
        async function renderClassLevel2(container, isTabSwitch) {
            try {
                // Optimization: If already in Level 2 for this class, don't re-render shell and trigger animation
                const existingSubList = document.getElementById('sidebarSubList');
                const isAlreadyInLevel2 = existingSubList && container.querySelector('.uppercase.tracking-widest')?.innerText.toUpperCase().includes("STUDENTS"); // Simple check

                // Show shell immediately if not already there
                if (!isAlreadyInLevel2) {
                    const cachedName = cnCache[window.currentClassId] || "Class";
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E] ${isTabSwitch ? '' : 'sidebar-push'}">
                            <div class="flex items-center px-4 h-11 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 relative">
                                <button onclick="goBackToClassList()" class="text-[#007AFF] flex items-center text-sm font-bold z-10">
                                    <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                    Back
                                </button>
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div id="sidebarLevel2Title" class="font-bold text-sm text-black dark:text-white uppercase tracking-widest truncate max-w-[150px] text-center">${escapeHTML(cachedName)}</div>
                                </div>
                                <div class="flex-1"></div>
                            </div>
                            <div id="sidebarSubList" class="flex-1 overflow-y-auto">
                                <div class="p-4 space-y-4 animate-pulse">
                                    <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4 mb-6"></div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4 mt-8 mb-6"></div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const snap = await get(ref(db, `classes/${window.currentClassId}`));
                const c = snap.val();
                if (!c) { window.currentClassId = null; window.renderSidebar(); return; }

                const titleEl = document.getElementById('sidebarLevel2Title');
                if (titleEl) titleEl.innerText = c.name;

                // Add Edit/Delete buttons if admin/teacher
                if (isAppAdmin() || c.teacherId === currentUser.id) {
                    const header = container.querySelector('.relative');
                    if (header && !header.querySelector('.admin-actions')) {
                        const actionDiv = document.createElement('div');
                        actionDiv.className = 'flex items-center gap-3 z-10 admin-actions';
                        actionDiv.innerHTML = `
                            <button onclick="handleDeleteClass('${window.currentClassId}')" class="text-red-500 hover:text-red-600 active:scale-90 transition-all p-1" title="Delete Class">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button onclick="openStudentSelector('${window.currentClassId}')" class="text-[#007AFF] text-xs font-bold uppercase tracking-widest">Edit</button>
                        `;
                        header.appendChild(actionDiv);
                    }
                }

                const subList = document.getElementById('sidebarSubList');
                const teacher = await fetchUser(c.teacherId);
                const students = c.students ? Object.keys(c.students) : [];

                const teacherActive = activeTargetId === c.teacherId;
                const groupActive = activeTargetId === `group_${window.currentClassId}`;

                let extensionHtml = '';
                if (c.extensions) {
                    const activeExts = Object.keys(c.extensions).filter(eid => c.extensions[eid] === true);
                    if (activeExts.length > 0) {
                        extensionHtml += `<div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Extensions</div>`;
                        activeExts.forEach(eid => {
                            if (eid === 'calc_volume_3d') {
                                extensionHtml += `
                                    <div onclick="openExtension('calc_volume_3d')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5">
                                        <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#007AFF]">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="font-bold text-sm text-black dark:text-white">3D Volume Visualizer</div>
                                            <div class="text-[10px] text-gray-400 uppercase tracking-tight">Mathematics Tool</div>
                                        </div>
                                    </div>
                                `;
                            } else if (eid === 'independent_research') {
                                extensionHtml += `
                                    <div onclick="openExtension('independent_research')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5">
                                        <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="font-bold text-sm text-black dark:text-white">IR Navigator</div>
                                            <div class="text-[10px] text-gray-400 uppercase tracking-tight">Research Management Tool</div>
                                        </div>
                                    </div>
                                `;
                            }
                        });
                    }
                }

                let html = `
                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Teacher</div>
                    <div id="item-${c.teacherId}" onclick="switchChat('${c.teacherId}')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 ${teacherActive ? 'bg-blue-500/10 dark:bg-white/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}">
                        <div>
                            <div class="font-bold text-base text-black dark:text-white">${escapeHTML(teacher?.name || 'Teacher')}</div>
                            <div class="text-xs text-[#007AFF] font-bold">Class Teacher</div>
                        </div>
                    </div>

                    ${extensionHtml}

                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Group Chat</div>
                    <div id="item-group_${window.currentClassId}" onclick="switchChat('group_${window.currentClassId}')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 group ${groupActive ? 'bg-blue-500/10 dark:bg-white/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center p-2">
                            ${EAGLE_ICON}
                        </div>
                        <div class="flex-1">
                            <div class="font-bold text-base text-black dark:text-white">${escapeHTML(c.name)}</div>
                            <div class="text-xs text-gray-400">By ${escapeHTML(teacher?.name || 'Teacher')}</div>
                        </div>
                    </div>

                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Students (${students.length})</div>
                `;

                const studentData = await Promise.all(students.map(async uid => {
                    const data = await fetchUser(uid);
                    return data ? { ...data, id: uid } : null;
                }));
                const canEdit = (isAppAdmin() || c.teacherId === currentUser.id);

                html += studentData.map(u => {
                    if (!u) return '';
                    const isActive = activeTargetId === u.id;
                    // Unified badge logic
                    let badge = '';
                    if (u.email === ADMIN_EMAIL) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                    else if (u.role === 'teacher' || (u.email && u.email.endsWith('@hcpss.org'))) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';

                    return `
                        <div id="item-${u.id}" class="flex items-center transition-all border-b border-gray-100 dark:border-gray-800 group relative ${isActive ? 'bg-blue-500/10 dark:bg-white/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}">
                            <div onclick="switchChat('${u.id}')" class="flex flex-1 items-center gap-4 cursor-pointer p-3 px-5">
                                <div class="flex flex-col overflow-hidden">
                                    <div class="font-bold text-sm text-black dark:text-white flex items-center">${escapeHTML(u.name)}${badge} ${u.id === currentUser.id ? '<span class="text-[10px] text-gray-400 font-normal ml-1">(You)</span>' : ''}</div>
                                    <div class="text-xs text-gray-400 truncate">${escapeHTML(u.email || u.id)}</div>
                                </div>
                            </div>
                            ${canEdit && u.id !== c.teacherId ? `
                                <button onclick="removeStudentFromClass('${window.currentClassId}', '${u.id}', '${escapeHTML(u.name)}')" 
                                    class="opacity-0 group-hover:opacity-100 p-2 mr-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from class">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('');

                subList.innerHTML = html;
            } catch (e) { console.error(e); }
        }

        window.removeStudentFromClass = async (classId, studentId, studentName) => {
            const confirmed = await showCustomConfirm("Remove Student", `Are you sure you want to remove <b>${studentName}</b> from this class?`, "Remove");
            if (confirmed) {
                try {
                    await set(ref(db, `classes/${classId}/students/${studentId}`), null);
                    // Reverted: Do NOT delete user_chats entry so student can still view history
                    window.renderSidebar();
                } catch (e) {
                    showCustomAlert("Error", "Failed to remove student: " + e.message);
                }
            }
        };

        window.handleDeleteClass = async (classId) => {
            const confirm1 = await showCustomConfirm(
                "Delete Class",
                "Are you sure you want to delete this class? This will permanently remove the roster and the group chat for all members.",
                "Delete Class"
            );
            if (!confirm1) return;

            // Small delay for smooth modal transition
            await new Promise(r => setTimeout(r, 150));

            const confirm2 = await showCustomConfirm(
                "Final Confirmation",
                "This action cannot be undone. Are you absolutely certain you want to proceed with the deletion?",
                "Yes, Delete Permanently"
            );
            if (!confirm2) return;

            try {
                await set(ref(db, `classes/${classId}`), null);

                window.currentClassId = null;
                window._isPopNav = true; // Use pop animation for going back
                window.renderSidebar();

                // Clear chat if it was the current one
                if (activeTargetId === `group_${classId}`) {
                    activeTargetId = null;
                    if (window.switchChat) {
                        // Switch to a neutral state or clear chatbox
                        document.getElementById('chatBox').innerHTML = '<div class="h-full flex items-center justify-center text-gray-400 text-sm">Class deleted</div>';
                        document.getElementById('chatTitle').innerText = 'Chat Deleted';
                    }
                }

                // Removed showCustomAlert to prevent modal sticking issues
            } catch (e) {
                console.error('Delete Class Error:', e);
                showCustomAlert("Error", "Failed to delete class: " + e.message);
            }
        };

        window.openStudentSelector = async (classId) => {
            const classSnap = await get(ref(db, `classes/${classId}`));
            if (!classSnap.exists()) return;
            const classData = classSnap.val();
            const currentStudents = classData.students || {};

            const usersSnap = await get(ref(db, 'users'));
            const allUsers = usersSnap.val() || {};
            const userList = Object.keys(allUsers)
                .filter(uid => uid !== classData.teacherId)
                .map(uid => ({ id: uid, ...allUsers[uid] }))
                .sort((a, b) => a.name.localeCompare(b.name));

            let selectedIds = new Set(Object.keys(currentStudents));
            let extensionsState = {
                'calc_volume_3d': !!(classData.extensions && classData.extensions['calc_volume_3d']),
                'independent_research': !!(classData.extensions && classData.extensions['independent_research'])
            };

            const renderSelectorList = (filter = "") => {
                const filtered = userList.filter(u =>
                    u.name.toLowerCase().includes(filter.toLowerCase()) ||
                    (u.email || "").toLowerCase().includes(filter.toLowerCase())
                );
                return filtered.map(u => `
                    <div class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <div class="flex flex-col overflow-hidden mr-4">
                            <span class="font-bold text-sm text-black dark:text-white truncate">${escapeHTML(u.name)}</span>
                            <span class="text-xs text-gray-400 truncate">${escapeHTML(u.email || u.id)}</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" ${selectedIds.has(u.id) ? 'checked' : ''} onchange="toggleStudentSelection('${u.id}', this.checked)">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#007AFF]"></div>
                        </label>
                    </div>
                `).join('');
            };

            window.toggleStudentSelection = (uid, isChecked) => {
                if (isChecked) selectedIds.add(uid);
                else selectedIds.delete(uid);
            };

            window.toggleExtensionSelection = (eid, isChecked) => {
                extensionsState[eid] = !!isChecked;
            };

            const modal = document.getElementById('customModal');
            const tEl = modal.querySelector('#modalTitle');
            const bEl = modal.querySelector('#modalBody');
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');

            tEl.innerText = `Edit Class`;
            bEl.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Class Name</label>
                        <input type="text" id="editClassName" value="${escapeHTML(classData.name)}" placeholder="Enter class name..." class="w-full mt-1 p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Manage Extensions</label>
                        <div class="space-y-2 mt-1">
                            <div class="p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#007AFF]">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                    </div>
                                    <span class="font-bold text-sm text-black dark:text-white">3D Volume Visualizer</span>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" ${extensionsState['calc_volume_3d'] ? 'checked' : ''} onchange="toggleExtensionSelection('calc_volume_3d', this.checked)">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#007AFF]"></div>
                                </label>
                            </div>
                            <div class="p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <span class="font-bold text-sm text-black dark:text-white">IR Navigator</span>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" ${extensionsState['independent_research'] ? 'checked' : ''} onchange="toggleExtensionSelection('independent_research', this.checked)">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#007AFF]"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Manage Students</label>
                        <input type="text" id="selectorSearch" placeholder="Search by name or email..." class="w-full mt-1 p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all">
                    </div>
                    <div id="selectorList" class="max-h-[35vh] overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-black/20">
                        ${renderSelectorList()}
                    </div>
                </div>
            `;

            cancelBtn.classList.remove('hidden');
            cancelBtn.innerText = "Cancel";
            confirmBtn.innerText = "Save Changes";

            const nameInput = bEl.querySelector('#editClassName');
            const searchInput = bEl.querySelector('#selectorSearch');
            const listContainer = bEl.querySelector('#selectorList');
            searchInput.oninput = (e) => {
                listContainer.innerHTML = renderSelectorList(e.target.value);
            };

            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);

            return new Promise(resolve => {
                const cleanup = () => {
                    confirmBtn.onclick = null;
                    cancelBtn.onclick = null;
                    delete window.toggleStudentSelection;
                    delete window.toggleExtensionSelection;
                };

                confirmBtn.onclick = async () => {
                    const newName = nameInput.value.trim();
                    if (!newName) { showCustomAlert("Required", "Please enter a class name."); return; }

                    modal.classList.add('opacity-0');
                    _modalTimer = setTimeout(() => {
                        modal.classList.add('hidden');
                        _modalTimer = null;
                    }, 300);

                    const newStudents = {};
                    selectedIds.forEach(id => newStudents[id] = true);

                    try {
                        await update(ref(db, `classes/${classId}`), {
                            name: newName,
                            students: newStudents,
                            extensions: extensionsState
                        });
                        window.renderSidebar();
                        // Removed showCustomAlert to prevent modal sticking issues
                    } catch (e) {
                        showCustomAlert("Error", "Failed to update class: " + e.message);
                    }
                    cleanup();
                    resolve(true);
                };

                cancelBtn.onclick = () => {
                    modal.classList.add('opacity-0');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                    cleanup();
                    resolve(false);
                };
            });
        };

        window.goBackToClassList = () => {
            window.currentClassId = null;
            window._isPopNav = true;
            window.renderSidebar(true);
        };

        window.goBackToRecent = () => {
            window.sidebarMode = 'recent';
            window._isPopNav = true;
            window.renderSidebar(true);
        };

        // Helper: Existing User Sidebar Logic (Extracted)
        async function renderUserSidebarItems(subList) {
            // 1. Fetch chatted users from user_chats (lowercase path for consistency)
            const chatSnap = await get(ref(db, `user_chats/${currentUser.id.toLowerCase()}`));
            const chatMap = chatSnap.val() || {};
            // Filter out legacy ghost IDs but KEEP group IDs
            let chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

            // 2. New User Onboarding: Fetch most recent users ONLY if the user has no history
            if (Object.keys(chatMap).length === 0) {
                try {
                    const recentSnap = await get(query(ref(db, 'users'), orderByKey(), limitToLast(20)));
                    if (recentSnap.exists()) {
                        const recents = recentSnap.val();
                        Object.keys(recents).forEach(rid => {
                            if (rid !== currentUser.id && !chatIds.includes(rid)) {
                                chatIds.push(rid);
                                if (!ALL_USERS[rid]) ALL_USERS[rid] = recents[rid];
                            }
                        });
                    }
                } catch (e) { }
            }

            // 3. Fetch user data & Filter out invalid/legacy IDs
            const validIds = [];
            await Promise.all(chatIds.map(async id => {
                if (id.startsWith('group_')) {
                    validIds.push(id);
                    return;
                }
                let u = ALL_USERS[id];
                if (!u) u = await fetchUser(id); // Final cloud check
                if (u && u.name) validIds.push(id);
            }));

            // 4. Sort and Limit
            let sortedIds = [];
            if (window.sidebarMode === 'recent') {
                sortedIds = validIds.sort((a, b) => (chatMap[b] || 0) - (chatMap[a] || 0)).slice(0, 50);
            } else {
                sortedIds = validIds.sort((a, b) => {
                    if (a.startsWith('group_') && !b.startsWith('group_')) return -1;
                    if (!a.startsWith('group_') && b.startsWith('group_')) return 1;
                    const nameA = (a.startsWith('group_') ? 'Group' : (ALL_USERS[a]?.name || a)).toLowerCase();
                    const nameB = (b.startsWith('group_') ? 'Group' : (ALL_USERS[b]?.name || b)).toLowerCase();
                    return nameA.localeCompare(nameB);
                }).slice(0, 50);
            }

            const fragment = document.createDocumentFragment();

            // Insert "Recently Joined" entry if in Recent mode
            if (window.sidebarMode === 'recent') {
                const entry = document.createElement('div');
                entry.className = "p-3 pl-5 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group hover:bg-gray-50/5 dark:hover:bg-white/5";
                entry.onclick = () => { window.sidebarMode = 'recent_joined'; window.renderSidebar(); };
                entry.innerHTML = `
                    <div class="flex items-center gap-3 flex-1 overflow-hidden">
                        <div class="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center p-2 text-[#007AFF]">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-bold text-sm text-[#007AFF] truncate">Recently Joined</span>
                            <span class="text-xs text-gray-400 truncate">Meet new community members</span>
                        </div>
                    </div>
                `;
                fragment.appendChild(entry);
            }

            for (const id of sortedIds) {
                if (id.toLowerCase() === currentUser.id.toLowerCase()) continue;
                if (!id.startsWith('group_') && (id.includes('_gmail_') || id.includes('_inst_'))) continue;

                let displayName = id;
                let displayEmail = id;
                let avatarHtml = '';
                let badge = '';

                if (id.startsWith('group_')) {
                    const classId = id.replace('group_', '');
                    const isDisbanded = isSyncDone && !cnCache[classId];
                    const isParticipant = sidebarClasses[classId];

                    displayName = cnCache[classId] || "Class Group Chat";

                    if (isDisbanded) {
                        displayEmail = "Class disbanded";
                    } else if (isSyncDone && !isParticipant) {
                        displayEmail = "You have been removed from this chat";
                    } else {
                        displayEmail = ctCache[classId] || "Multi-person conversation";
                    }

                    const bgClass = isDisbanded || (isSyncDone && !isParticipant) ? "bg-gray-100 dark:bg-white/10" : "bg-[#ED2129]/10";
                    const iconToUse = isDisbanded || (isSyncDone && !isParticipant) ? EAGLE_ICON_BW : EAGLE_ICON;
                    avatarHtml = `<div class="w-10 h-10 ${bgClass} rounded-full flex items-center justify-center p-2">${iconToUse}</div>`;
                } else {
                    const user = ALL_USERS[id];
                    displayName = user?.name || id;
                    displayEmail = user?.email || id;
                    avatarHtml = ''; // Individual users have no avatar as per request
                    if (user && user.email === ADMIN_EMAIL) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                    else if (user && (user.role === 'teacher' || (user.email && user.email.endsWith('@hcpss.org')))) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';
                }

                const isDisbandedGroup = id.startsWith('group_') && !cnCache[id.replace('group_', '')];
                const isActive = activeTargetId === id;
                const div = document.createElement('div');
                div.id = `item-${id}`;
                div.className = `p-3 pl-5 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group ${isActive ? 'bg-blue-500/10 dark:bg-white/5' : 'hover:bg-gray-50/5 dark:hover:bg-white/5'}`;
                div.style.paddingRight = "60px";
                div.onclick = () => switchChat(id);

                div.innerHTML = `
                        <div class="flex items-center gap-3 flex-1 overflow-hidden">
                            ${avatarHtml}
                            <div class="flex flex-col overflow-hidden">
                                <span class="font-bold text-sm text-black dark:text-white truncate flex items-center">${escapeHTML(displayName)}${badge}</span>
                                <span class="text-xs text-gray-400 truncate">${escapeHTML(displayEmail)}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="dot-${id}" class="w-2 h-2 bg-[#007AFF] rounded-full ${UNREAD_CHATS.has(id) ? '' : 'hidden'}"></span>
                            <button onclick="event.stopPropagation(); deleteChatRecord('${id}')" class="opacity-0 group-hover:opacity-60 p-2 text-gray-400 hover:text-red-500 transition-all cursor-pointer pointer-events-none group-hover:pointer-events-auto" title="Remove Chat">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    `;
                fragment.appendChild(div);
            }
            subList.innerHTML = '';
            subList.appendChild(fragment);
        }

        window.renderSidebarOld = async function (isTabSwitch = false) {
            // Deleted in favor of refactored version above
        };

        // Sidebar Sticky Toggle Logic
        window.toggleSidebarPin = () => {
            const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarPinned', isCollapsed ? 'false' : 'true');

            // Trigger a resize event to ensure chat scrolls correctly
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500);
        };

        // Initialize Sidebar State
        (function initSidebarState() {
            const pinned = localStorage.getItem('sidebarPinned');
            // Default to true for new users, or respect existing preference
            if (pinned === 'false') {
                document.body.classList.add('sidebar-collapsed');
            } else {
                document.body.classList.remove('sidebar-collapsed');
            }
        })();

        window.switchChat = async (targetId) => {
            if (!targetId || targetId === currentUser.id) return;

            activeTargetId = targetId;

            // Handle UI for disbanded classes
            const msgInput = document.getElementById('u-msg');
            const sendBtn = msgInput.nextElementSibling;
            const cameraBtn = document.getElementById('chatCameraBtn');
            let isDisbanded = false;
            let isRemoved = false;

            if (targetId.startsWith('group_')) {
                const classId = targetId.replace('group_', '');
                isDisbanded = isSyncDone && !cnCache[classId];
                isRemoved = isSyncDone && !sidebarClasses[classId];
            }

            if (targetId === 'safety_bot') {
                msgInput.disabled = true;
                msgInput.placeholder = "System notifications only. Messaging is disabled.";
                if (sendBtn) {
                    sendBtn.style.opacity = '0';
                    sendBtn.style.pointerEvents = 'none';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '0';
                    cameraBtn.style.pointerEvents = 'none';
                }
            } else if (isDisbanded || isRemoved) {
                msgInput.disabled = true;
                msgInput.placeholder = isDisbanded ? "This class has been disbanded. Messaging is disabled." : "You have been removed from this chat. Messaging is disabled.";
                if (sendBtn) {
                    sendBtn.style.opacity = '0';
                    sendBtn.style.pointerEvents = 'none';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '0';
                    cameraBtn.style.pointerEvents = 'none';
                }
            } else {
                msgInput.disabled = false;
                msgInput.placeholder = "Type a message...";
                if (sendBtn) {
                    sendBtn.style.opacity = '1';
                    sendBtn.style.pointerEvents = 'auto';
                    sendBtn.style.display = 'flex';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '1';
                    cameraBtn.style.pointerEvents = 'auto';
                    cameraBtn.style.display = window.isPhotoDisabled ? 'none' : 'block';
                }
            }
            UNREAD_CHATS.delete(targetId);
            window.updateGlobalUnreadStatus();
            document.getElementById(`dot-${targetId}`)?.classList.add('hidden');

            const titleEl = document.getElementById('chatTitle');
            const statusEl = document.getElementById('chatStatus');
            let chatId = '';

            if (targetId.startsWith('group_')) {
                chatId = targetId;
                const classId = targetId.replace('group_', '');
                titleEl.innerText = cnCache[classId] || "Class Group Chat";
                statusEl.innerText = ctCache[classId] || "Group Chat";

                if (!cnCache[classId] || !ctCache[classId]) {
                    get(ref(db, `classes/${classId}`)).then(async snap => {
                        if (snap.exists()) {
                            const cData = snap.val();
                            cnCache[classId] = cData.name;
                            if (activeTargetId === targetId) titleEl.innerText = cData.name;

                            // Fetch teacher name
                            if (cData.teacherId) {
                                const teacher = await fetchUser(cData.teacherId);
                                ctCache[classId] = teacher?.name || "Teacher";
                                if (activeTargetId === targetId) statusEl.innerText = teacher?.name || "Teacher";
                            }
                            window.renderSidebar();
                        }
                    });
                }
            } else {
                chatId = getChatId(currentUser.id, targetId);
                // Set initial title (fallback to ID)
                const u = ALL_USERS[targetId];
                titleEl.innerText = u?.name || targetId;

                const statusText = u?.lastSeen ? formatLastSeen(u.lastSeen) : (u?.email || "");
                statusEl.innerText = statusText;
                if (statusText === "online") {
                    statusEl.classList.add('text-[#007AFF]');
                    statusEl.classList.remove('text-gray-400');
                } else {
                    statusEl.classList.remove('text-[#007AFF]');
                    statusEl.classList.add('text-gray-400');
                }

                // Re-fetch user to ensure we get the latest name if it was just an ID
                fetchUser(targetId).then(user => {
                    if (user && activeTargetId === targetId) {
                        if (user.name) titleEl.innerText = user.name;
                        if (user.lastSeen) {
                            const updatedText = formatLastSeen(user.lastSeen);
                            statusEl.innerText = updatedText;
                            if (updatedText === "online") {
                                statusEl.classList.add('text-[#007AFF]');
                                statusEl.classList.remove('text-gray-400');
                            } else {
                                statusEl.classList.remove('text-[#007AFF]');
                                statusEl.classList.add('text-gray-400');
                            }
                        }
                    }
                });
            }

            // Unified View Transition
            window.AppView.showPanel('chat');

            // Apply animation if mobile
            if (window.AppView.isMobile()) {
                chatSec.classList.add('slide-in-right');
                setTimeout(() => chatSec.classList.remove('slide-in-right'), 400);
            }

            const chatBox = document.getElementById('chatBox');
            chatBox.classList.remove('slide-up');
            void chatBox.offsetWidth; // Force reflow
            chatBox.classList.add('slide-up');

            loadChatThread(chatId);

            // Update sidebar active state manually to avoid flash
            document.querySelectorAll('#sidebarSubList > div').forEach(div => {
                const divId = div.id.replace('item-', '');
                if (divId === targetId) {
                    div.classList.add('bg-blue-500/10', 'dark:bg-white/5');
                    div.classList.remove('hover:bg-gray-50/5', 'dark:hover:bg-white/5');
                } else {
                    div.classList.remove('bg-blue-500/10', 'dark:bg-white/5');
                    div.classList.add('hover:bg-gray-50/5', 'dark:hover:bg-white/5');
                }
            });
        };

        window.deleteChatRecord = async (targetId) => {
            if (!confirm("Remove this chat from your list? Messages will not be deleted.")) return;

            const originalTarget = targetId.trim();
            const lowerTarget = originalTarget.toLowerCase();
            const originalUser = currentUser.id.trim();
            const lowerUser = originalUser.toLowerCase();

            try {
                // 1. Delete from current user's chat list (try multiple casings to be sure)
                const paths = [
                    `user_chats/${originalUser}/${originalTarget}`,
                    `user_chats/${lowerUser}/${lowerTarget}`,
                    `user_chats/${lowerUser}/${originalTarget}`,
                    `user_chats/${originalUser}/${lowerTarget}`
                ];

                await Promise.all(paths.map(path => set(ref(db, path), null)));

                // 2. Hide from UI immediately
                document.getElementById(`item-${targetId}`)?.remove();

                // 3. Refresh sidebar to confirm
                setTimeout(() => window.renderSidebar(), 500);
            } catch (err) {
                console.error("Delete chat failed:", err);
            }
        };

        window.showSidebar = () => {
            activeTargetId = null;
            window.AppView.showPanel('tools');

            if (window.AppView.isMobile()) {
                ['news', 'more'].forEach(t => {
                    document.getElementById(`icon-${t}`)?.classList.replace('text-[#007AFF]', 'text-gray-400');
                    document.getElementById(`text-${t}`)?.classList.replace('text-[#007AFF]', 'text-gray-400');
                });
                document.getElementById('icon-messages').classList.replace('text-gray-400', 'text-[#007AFF]');
                document.getElementById('text-messages').classList.replace('text-gray-400', 'text-[#007AFF]');
            }
            clearSearch();
        };

        window.refreshBottomNav = (activeTab) => {
            const newsBtn = document.getElementById('tabBtn-news');
            const msgBtn = document.getElementById('tabBtn-messages');
            const newsIconActive = `<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #007AFF;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 7H20" /></svg>`;
            const newsIconInactive = `<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #9CA3AF;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 7H20" /></svg>`;
            const msgIconActive = `<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24" style="color: #007AFF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`;
            const msgIconInactive = `<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24" style="color: #9CA3AF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`;

            if (newsBtn) {
                const active = (activeTab === 'news');
                newsBtn.innerHTML = (active ? newsIconActive : newsIconInactive) + `<span class="text-xs font-medium" style="color: ${active ? '#007AFF' : '#9CA3AF'}">News</span>`;
            }
            if (msgBtn) {
                const active = (activeTab === 'messages');
                msgBtn.innerHTML = `<div class="relative">${active ? msgIconActive : msgIconInactive}<div id="mainUnreadDot" class="hidden absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#007AFF] rounded-full border-2 border-white dark:border-[#1C1C1E]"></div></div><span class="text-xs font-medium" style="color: ${active ? '#007AFF' : '#9CA3AF'}">Messages</span>`;
            }
        };

        window.switchTab = (tab) => {
            const isMobile = window.innerWidth < 1024;
            if (!isMobile) return;

            const newsEl = document.getElementById('newsSection');
            const msgEl = document.getElementById('sidePanel');
            const chatSec = document.getElementById('chatSection');

            const isCurrentlyOnNews = !newsEl.classList.contains('hidden');
            const currentTab = isCurrentlyOnNews ? 'news' : 'messages';

            let normalizedTab = tab;
            if (tab === 'more' || tab === 'tools') normalizedTab = 'news';

            if (currentTab === normalizedTab) {
                if (tab === 'news' || tab === 'more' || tab === 'tools') switchLeftTab(tab);
                return;
            }

            // 1. INSTANT VISUAL FEEDBACK
            window.refreshBottomNav(normalizedTab);

            // 2. ANIMATION LOGIC
            if (window.closeDetail) window.closeDetail();
            if (window.closePostForm) window.closePostForm();

            const isForward = (normalizedTab === 'messages');
            const currentEl = isCurrentlyOnNews ? newsEl : msgEl;
            const targetEl = isCurrentlyOnNews ? msgEl : newsEl;

            if (normalizedTab === 'news' || normalizedTab === 'more' || normalizedTab === 'tools') switchLeftTab(normalizedTab);

            chatSec.classList.add('hidden');
            chatSec.classList.remove('flex');

            currentEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; transform:translateX(0); transition:none; display:flex;`;
            targetEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; z-index:11; transform:translateX(${isForward ? '100%' : '-100%'}); transition:none; display:flex;`;
            targetEl.classList.remove('hidden');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const ease = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                    currentEl.style.transition = ease;
                    targetEl.style.transition = ease;
                    currentEl.style.transform = `translateX(${isForward ? '-100%' : '100%'})`;
                    targetEl.style.transform = 'translateX(0)';
                });
            });

            setTimeout(() => {
                currentEl.classList.add('hidden');
                currentEl.classList.remove('flex');
                currentEl.style.cssText = '';
                targetEl.style.cssText = '';
                targetEl.classList.remove('hidden');
                targetEl.classList.add('flex');
            }, 350);
        };

        function escapeHTML(str) {
            if (!str) return "";
            return str.replace(/[&<>"']/g, function (m) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[m];
            });
        }

        function linkify(text) {
            if (!text) return "";
            // Use a regex that excludes trailing punctuation (brackets, periods, etc.)
            const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g;
            return text.replace(urlRegex, (url) => {
                return `<a href="${url}" target="_blank" class="text-[#007AFF] font-bold hover:underline inline-flex items-center gap-0.5 mx-1">Link <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>`;
            });
        }

        function formatLastSeen(timestamp) {
            if (!timestamp) return "";
            const now = Date.now();
            const diff = now - timestamp;
            const mins = Math.floor(diff / 60000);

            if (mins < 2) return "online";
            if (mins < 60) return `last seen ${mins} minute${mins > 1 ? 's' : ''} ago`;

            const hours = Math.floor(mins / 60);
            if (hours < 24) return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;

            const days = Math.floor(hours / 24);
            if (days === 1) return "last seen yesterday";
            return `last seen ${days} days ago`;
        }

        async function loadChatThread(chatId) {
            const chatBox = document.getElementById('chatBox');
            chatBox.innerHTML = '<div class="text-center text-gray-400 text-xs mt-4 mb-4 font-medium">Chat History</div>';
            if (stopCurrentChatListener) stopCurrentChatListener();

            // 1. Load from Local Cache (Instant UI)
            const localMsgs = await getLocalMessages(chatId);
            const displayMsgs = localMsgs.slice(-50);
            let lastKey = localMsgs.length > 0 ? localMsgs[localMsgs.length - 1].key : null;

            // Use a fragment for batch appending to minimize layout shifts
            const fragment = document.createDocumentFragment();
            displayMsgs.forEach(m => {
                const msgEl = createMsgElement(m, m.key, chatId);
                if (msgEl) fragment.appendChild(msgEl);
            });
            chatBox.appendChild(fragment);

            // Immediate scroll to bottom
            chatBox.scrollTop = chatBox.scrollHeight;
            // Short delay to handle any late layout shifts (like images from cache)
            requestAnimationFrame(() => {
                chatBox.scrollTop = chatBox.scrollHeight;
            });
            // 2. Incremental Sync: Only fetch what we don't have.
            // We removed the aggressive "Consistency Check" that fetched last 20 messages
            // to save traffic. The real-time listener below handles new messages.

            // 3. Start Firebase Listener (Sync NEW items only)
            let q = lastKey ? query(ref(db, `messages/${chatId}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50));

            stopCurrentChatListener = onChildAdded(q, (snap) => {
                const existingMsgs = Array.from(chatBox.querySelectorAll('.msg-pop'));
                // Prevent duplicate rendering if reconciliation already fetched it
                if (!existingMsgs.some(el => el.dataset.key === snap.key)) {
                    const msg = snap.val();
                    appendMsg(msg, snap.key, chatId, true);

                    // Smart Scroll: Only scroll if user was already near bottom or sent by self
                    const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 150;
                    if (isNearBottom || msg.senderId === currentUser.id) {
                        requestAnimationFrame(() => {
                            chatBox.scrollTop = chatBox.scrollHeight;
                        });
                    }
                }
            });
        }

        window.openGallery = (encodedImages, startIdx = 0) => {
            window.currentGalleryImages = JSON.parse(decodeURIComponent(encodedImages));
            window.currentImgIdx = startIdx;
            updateGalleryUI();
            document.getElementById('galleryModal').classList.remove('hidden');
        };

        window.toggleStack = (key, count, isMe) => {
            const container = document.getElementById(`stack-${key}`);
            const btn = document.getElementById(`btn-${key}`);
            const isExpanded = container.classList.contains('is-expanded');
            if (isExpanded) {
                container.classList.remove('is-expanded');
                container.style.height = '192px';
                btn.innerText = `Expand ${count}`;
                for (let i = 0; i < count; i++) {
                    const img = document.getElementById(`img-${key}-${i}`);
                    if (!img) continue;
                    let translateX = isMe ? (i * 12) : -(i * 12);
                    img.style.transform = `translateX(${translateX}px) scale(${1 - (i * 0.05)})`;
                    img.style.top = '0px';
                    img.style.opacity = i > 3 ? 0 : 1;
                }
            } else {
                container.classList.add('is-expanded');
                container.style.height = `${(192 * count) + (12 * (count - 1))}px`;
                btn.innerText = `Collapse`;
                for (let i = 0; i < count; i++) {
                    const img = document.getElementById(`img-${key}-${i}`);
                    if (!img) continue;
                    img.style.transform = `translateX(0px) scale(1)`;
                    img.style.top = `${i * (192 + 12)}px`;
                    img.style.opacity = 1;
                }
            }
        };

        let _modalTimer = null;
        function _getModalEls() {
            const modal = document.getElementById('customModal');
            return {
                modal,
                inner: modal.querySelector('div'),
                title: document.getElementById('modalTitle'),
                body: document.getElementById('modalBody'),
                cancel: document.getElementById('modalCancel'),
                alt: document.getElementById('modalAlt'),
                confirm: document.getElementById('modalConfirm')
            };
        }
        function _closeModal(val, resolve) {
            const { modal, inner, cancel, alt, confirm } = _getModalEls();
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0');
            inner.classList.remove('scale-100');
            inner.classList.add('scale-90');
            _modalTimer = setTimeout(() => {
                modal.classList.add('hidden');
                cancel.onclick = null;
                alt.onclick = null;
                confirm.onclick = null;
                _modalTimer = null;
                resolve(val);
            }, 300);
        }
        function _openModal() {
            const { modal, inner } = _getModalEls();
            if (_modalTimer) { clearTimeout(_modalTimer); _modalTimer = null; }
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('opacity-100');
                modal.classList.remove('opacity-0');
                inner.classList.add('scale-100');
                inner.classList.remove('scale-90');
            }, 10);
        }

        window.showCustomAlert = (title, body, btnText = "OK") => {
            return new Promise(resolve => {
                const els = _getModalEls();
                els.title.innerText = title;
                els.body.innerText = body;
                els.confirm.innerText = btnText;
                els.cancel.classList.add('hidden');
                els.alt.classList.add('hidden');
                els.confirm.onclick = () => _closeModal(true, resolve);
                _openModal();
            });
        };

        window.showCustomConfirm = (title, body, confirmText = "Continue") => {
            return new Promise(resolve => {
                const els = _getModalEls();
                els.title.innerText = title;
                els.body.innerHTML = body;
                els.confirm.innerText = confirmText;
                els.cancel.classList.remove('hidden');
                els.alt.classList.add('hidden');
                els.cancel.onclick = () => _closeModal(false, resolve);
                els.confirm.onclick = () => _closeModal(true, resolve);
                _openModal();
            });
        };

        window.showTourConfirm = (title, body) => {
            return new Promise(resolve => {
                const els = _getModalEls();
                els.title.innerText = title;
                els.body.innerText = body;
                els.confirm.innerText = "Begin Tour";
                els.cancel.innerText = "Maybe Later";
                els.cancel.classList.remove('hidden');
                els.alt.classList.add('hidden');
                els.cancel.onclick = () => _closeModal(false, resolve);
                els.confirm.onclick = () => _closeModal(true, resolve);
                _openModal();
            });
        };


        window.closeGallery = () => {
            document.getElementById('galleryModal').classList.add('hidden');
            document.getElementById('galleryPrevBtn')?.classList.remove('hidden');
            document.getElementById('galleryNextBtn')?.classList.remove('hidden');
        };

        window.downloadImage = () => {
            const imgSrc = window.currentGalleryImages[window.currentImgIdx];
            if (!imgSrc) return;
            const link = document.createElement('a');
            link.href = imgSrc;
            link.download = `CHS_Image_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        window.prevGalleryImg = () => {
            if (window.currentImgIdx > 0) {
                window.currentImgIdx--;
                updateGalleryUI();
            }
        };

        window.nextGalleryImg = () => {
            if (window.currentImgIdx < window.currentGalleryImages.length - 1) {
                window.currentImgIdx++;
                updateGalleryUI();
            }
        };

        function updateGalleryUI() {
            const img = document.getElementById('mainGalleryImg');
            img.src = window.currentGalleryImages[window.currentImgIdx];

            const prevBtn = document.getElementById('galleryPrevBtn');
            const nextBtn = document.getElementById('galleryNextBtn');

            if (window.currentGalleryImages.length <= 1) {
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden');
            } else {
                prevBtn.classList.toggle('hidden', window.currentImgIdx === 0);
                nextBtn.classList.toggle('hidden', window.currentImgIdx === window.currentGalleryImages.length - 1);
            }
        }

        window.addEventListener('keydown', (e) => {
            const gallery = document.getElementById('galleryModal');
            if (!gallery.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') window.prevGalleryImg();
                if (e.key === 'ArrowRight') window.nextGalleryImg();
                if (e.key === 'Escape') window.closeGallery();
            }
        });

        let currentQuote = null;
        let selectedMsgData = null;
        let longPressTimer = null;

        window.handleMsgCopy = () => {
            if (!selectedMsgData) return;
            navigator.clipboard.writeText(selectedMsgData.text);
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
        };

        window.handleMsgQuote = () => {
            if (!selectedMsgData) return;
            currentQuote = { senderName: selectedMsgData.senderName, text: selectedMsgData.text };
            document.getElementById('quoteUser').innerText = currentQuote.senderName;
            document.getElementById('quoteText').innerText = currentQuote.text;
            document.getElementById('quoteArea').classList.remove('hidden');
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
            document.getElementById('u-msg').focus();
        };

        window.clearQuote = () => { currentQuote = null; document.getElementById('quoteArea').classList.add('hidden'); };

        window.handleMsgForward = () => {
            if (!selectedMsgData) return;
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
            const list = document.getElementById('forwardUserList');
            list.innerHTML = '';
            Object.keys(ALL_USERS).forEach(id => {
                if (id === currentUser.id) return;
                const u = ALL_USERS[id];
                const div = document.createElement('div');
                div.className = "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer rounded-xl transition-colors";
                div.onclick = () => forwardTo(id);
                div.innerHTML = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" class="w-9 h-9 rounded-full shadow-sm">
                    <div><div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name)}</div><div class="text-xs text-gray-400">${escapeHTML(u.email)}</div></div>`;
                list.appendChild(div);
            });
            document.getElementById('forwardPicker').classList.remove('hidden');
        };

        window.closeForwardPicker = () => document.getElementById('forwardPicker').classList.add('hidden');

        function forwardTo(targetId) {
            const chatId = getChatId(currentUser.id, targetId);
            const forwardText = `[Forwarded from ${escapeHTML(selectedMsgData.senderName)}]: ${escapeHTML(selectedMsgData.text)}`;

            // 1. Send the message
            push(ref(db, `messages/${chatId}`), { senderId: currentUser.id, senderName: currentUser.name, text: forwardText, type: 'text', timestamp: serverTimestamp() });

            // 2. Critical Fix: Update interaction record for both users so chat appears in sidebars
            update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [targetId.toLowerCase()]: serverTimestamp() });
            update(ref(db, `user_chats/${targetId.toLowerCase()}`), { [currentUser.id.toLowerCase()]: serverTimestamp() });

            closeForwardPicker();
        }

        function setupLongPress(el, msg) {
            const start = (e) => {
                selectedMsgData = msg;
                longPressTimer = setTimeout(() => {
                    const menu = document.getElementById('messageContextMenu');
                    const touch = e.touches ? e.touches[0] : e;

                    // 1. Position it invisibly first to prevent sliding transition
                    menu.style.transition = 'none';
                    menu.style.opacity = '0';
                    menu.classList.remove('hidden');

                    const menuHeight = menu.offsetHeight || 200;
                    const menuWidth = menu.offsetWidth || 180;

                    // Hide report and reply buttons if message is from safety_bot
                    const reportBtn = menu.querySelector('button[onclick="handleMsgReport()"]');
                    const replyBtn = menu.querySelector('button[onclick="handleMsgQuote()"]');
                    if (msg.senderId === 'safety_bot') {
                        if (reportBtn) reportBtn.classList.add('hidden');
                        if (replyBtn) replyBtn.classList.add('hidden');
                    } else {
                        if (reportBtn) reportBtn.classList.remove('hidden');
                        if (replyBtn) replyBtn.classList.remove('hidden');
                    }

                    let top = touch.clientY;
                    let left = touch.clientX;

                    if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 15;
                    if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 15;

                    menu.style.top = `${Math.max(15, top)}px`;
                    menu.style.left = `${Math.max(15, left)}px`;

                    // 2. Force reflow and restore animations
                    void menu.offsetHeight;
                    menu.style.transition = '';
                    menu.style.opacity = '';
                    if (menu._hideListener) {
                        document.removeEventListener('mousedown', menu._hideListener);
                        document.removeEventListener('touchstart', menu._hideListener);
                    }
                    const hide = (ev) => {
                        if (ev && menu.contains(ev.target)) return;
                        menu.classList.add('hidden');
                        document.removeEventListener('mousedown', hide);
                        document.removeEventListener('touchstart', hide);
                    };
                    menu._hideListener = hide;
                    setTimeout(() => { document.addEventListener('mousedown', hide); document.addEventListener('touchstart', hide); }, 50);
                }, 600);
            };
            const end = () => clearTimeout(longPressTimer);
            el.addEventListener('mousedown', start);
            el.addEventListener('touchstart', start, { passive: true });
            el.addEventListener('mouseup', end);
            el.addEventListener('touchend', end);
            el.addEventListener('mouseleave', end);
            el.addEventListener('contextmenu', (e) => { e.preventDefault(); start(e); });
        }

        function createMsgElement(msg, key, chatId = null) {
            if (msg.isSecret && currentUser.email !== ADMIN_EMAIL) return null;
            const isMe = msg.senderId === currentUser.id;
            const div = document.createElement('div');
            div.dataset.key = key;
            div.className = `msg-pop flex flex-col mb-1.5 w-full ${isMe ? 'items-end' : 'items-start'}`;

            if (msg.quote) {
                const qDiv = document.createElement('div');
                qDiv.className = `text-xs opacity-50 mb-0.5 px-3 py-1 border-l-2 border-gray-400 max-w-[70%] truncate ${isMe ? 'mr-1 text-right' : 'ml-1 text-left'}`;
                qDiv.innerHTML = `<span class="font-bold">${escapeHTML(msg.quote.senderName)}:</span> ${escapeHTML(msg.quote.text)}`;
                div.appendChild(qDiv);
            }

            let content = '';
            let images = [];
            if (msg.type === 'image_group' || (msg.text && msg.text.trim().startsWith('['))) try { images = JSON.parse(msg.text); } catch (e) { }
            else if (msg.type === 'image' || (msg.text && msg.text.includes('data:image'))) images = [msg.text];

            if (images.length > 0) {
                if (window.isPhotoDisabled) {
                    content = `<div class="px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-400 text-xs italic flex items-center gap-2 border border-gray-200 dark:border-white/10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled</div>`;
                } else {
                    const enc = encodeURIComponent(JSON.stringify(images));
                    if (images.length === 1) {
                        content = `<div class="relative w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                                    <img src="${images[0]}" 
                                         onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" 
                                         onclick="openGallery('${enc}', 0)" 
                                         class="w-full h-full object-cover cursor-pointer ${msg.isExpired ? 'opacity-20 grayscale' : ''}">
                                    <div class="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                        <svg class="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        <span class="text-[9px] font-medium leading-tight">Photo<br>Unavailable</span>
                                    </div>
                                   </div>`;
                    } else {
                        let sH = '';
                        for (let i = images.length - 1; i >= 0; i--) {
                            let tX = isMe ? (i * 12) : -(i * 12);
                            sH += `<div id="img-${key}-${i}" class="absolute left-0 w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl shadow-md transition-all duration-300 ${isMe ? 'origin-left' : 'origin-right'} cursor-pointer overflow-hidden border border-gray-200 dark:border-white/5"
                                        style="top:0px; z-index:${30 - i}; transform:translateX(${tX}px) scale(${1 - (i * 0.05)}); opacity:${i > 3 ? 0 : 1};"
                                        onclick="openGallery('${enc}', ${i})">
                                        <img src="${images[i]}" 
                                             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                                             class="w-full h-full object-cover ${msg.isExpired ? 'opacity-20 grayscale' : ''}">
                                        <div class="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                            <svg class="w-5 h-5 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            <span class="text-[8px] font-medium">Unavailable</span>
                                        </div>
                                   </div>`;
                        }
                        content = `<div id="stack-${key}" class="relative w-36 h-48 ${isMe ? 'ml-24 mr-8' : 'mr-24 ml-8'} mb-2 mt-1 transition-all duration-300">
                                    <button id="btn-${key}" onclick="toggleStack('${key}', ${images.length}, ${isMe})" class="absolute ${isMe ? '-left-24' : '-right-24'} top-20 bg-[#E9E9EB] dark:bg-gray-700 text-black dark:text-white text-xs px-3.5 py-1.5 rounded-full z-40 font-medium shadow-sm">Expand ${images.length}</button>
                                    ${sH}
                                   </div>`;
                    }
                }
            } else {
                const bS = isMe ? 'bg-[#007AFF] text-white rounded-3xl rounded-br-sm' : 'bg-[#E9E9EB] dark:bg-gray-700 text-black dark:text-white rounded-3xl rounded-bl-sm';
                content = `<div class="px-3.5 py-2 text-base leading-[1.4] max-w-[75%] inline-block break-words whitespace-pre-wrap shadow-sm ${bS}">${linkify(window.UIUtils.escape(msg.text))}</div>`;
            }
            const wrapper = document.createElement('div');
            wrapper.innerHTML = content;
            const msgEl = wrapper.firstElementChild;
            setupLongPress(msgEl, msg);

            div.appendChild(!isMe ? (Object.assign(document.createElement('span'), { className: 'text-xs text-gray-400 mb-0.5 ml-3', innerText: msg.senderName || "Unknown" })) : document.createTextNode(''));
            div.appendChild(msgEl);
            return div;
        }

        function appendMsg(msg, key, chatId = null, saveToLocal = true) {
            const div = createMsgElement(msg, key, chatId);
            if (!div) return;
            const chatBox = document.getElementById('chatBox');
            chatBox.appendChild(div);

            if (saveToLocal && chatId) saveMessageLocal(chatId, key, msg);
        }

        /* --- STEP 6-9: UNIFIED MESSAGE ENGINE --- */
        window.MessageEngine = {
            // Internal: Core commit logic for both types
            commit: async function (msgData) {
                const targetId = activeTargetId;
                if (!targetId || !msgData) return;

                const isGroup = targetId.startsWith('group_');
                const chatId = isGroup ? targetId : getChatId(currentUser.id, targetId);
                const msgObj = {
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: serverTimestamp(),
                    ...msgData
                };

                // 1. Push Message
                const newMsgRef = push(ref(db, `messages/${chatId}`));
                await set(newMsgRef, msgObj);

                // 2. Update Recent Lists & Metadata
                if (isGroup) {
                    const classId = targetId.replace('group_', '');
                    update(ref(db, `classes/${classId}`), { lastActivity: serverTimestamp() });
                    update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [targetId]: serverTimestamp() });
                } else {
                    const myId = currentUser.id.toLowerCase();
                    const targetIdLower = targetId.toLowerCase();
                    update(ref(db, `user_chats/${myId}`), { [targetIdLower]: serverTimestamp() });
                    update(ref(db, `user_chats/${targetIdLower}`), { [myId]: serverTimestamp() });
                }

                console.log(`MessageEngine: Committed to ${chatId}`);
                return newMsgRef.key;
            },

            // High-level: Send Text
            sendText: async function (customVal = null) {
                const input = document.getElementById('u-msg');
                const val = (customVal || input.value).trim();
                if (!val) return;

                if (val.length > 1000) {
                    await showCustomAlert("Too Long", "Message limit is 1000 chars.");
                    return;
                }

                const msgData = { text: val, type: 'text' };
                if (currentQuote) { msgData.quote = currentQuote; clearQuote(); }

                await this.commit(msgData);
                if (!customVal) input.value = '';
            },

            // High-level: Send Images
            sendImages: async function (base64s) {
                if (!base64s || !base64s.length) return;
                const imageUrls = await Promise.all(base64s.map(b => uploadImageToStorage(b, 'chats')));
                await this.commit({
                    text: JSON.stringify(imageUrls),
                    type: 'image_group'
                });
            }
        };

        window.sendMsg = async (type = 'text', customVal = null) => {
            const now = Date.now();
            if (now - lastMsgSentTime < MSG_COOLDOWN) return;

            // Block disbanded
            if (activeTargetId && activeTargetId.startsWith('group_')) {
                if (!cnCache[activeTargetId.replace('group_', '')]) {
                    showCustomAlert("Disbanded", "Cannot message a disbanded class.");
                    return;
                }
            }

            lastMsgSentTime = now;
            await window.MessageEngine.sendText(customVal);
        };

        window.handleImg = async (e) => {
            let files = Array.from(e.target.files);
            if (!files.length) return;

            // Hard Cap: Only allow first 5 images in one go (Simplified Limit)
            if (files.length > 5) {
                await showCustomAlert("Limit Exceeded", "Maximum 5 images allowed per message. The rest will be ignored.");
                files = files.slice(0, 5);
            }

            const input = document.getElementById('u-msg');
            const originalPlaceholder = input ? input.placeholder : "iMessage";

            try {
                // 1. Quota check removed for simplicity

                if (input) {
                    input.placeholder = "Processing...";
                    input.disabled = true;
                }

                const processAndCompress = async (file) => {
                    return await new Promise((res, rej) => {
                        const r = new FileReader();
                        r.onload = (ev) => {
                            const i = new Image();
                            i.onerror = () => rej(new Error("Image failed"));
                            i.src = ev.target.result;
                            i.onload = () => {
                                const c = document.createElement('canvas');
                                const ctx = c.getContext('2d');
                                const MAX_SIZE = 800;
                                let width = i.width; let height = i.height;
                                if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
                                else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                                c.width = width; c.height = height;
                                ctx.drawImage(i, 0, 0, width, height);
                                res(c.toDataURL('image/jpeg', 0.6));
                            };
                        };
                        r.readAsDataURL(file);
                    });
                };

                const base64s = await Promise.all(files.map(processAndCompress));
                if (base64s.length > 0) {
                    if (input) input.placeholder = "Uploading images...";
                    await window.MessageEngine.sendImages(base64s);
                }
            } catch (err) {
                console.error("Image sending error:", err);
                await showCustomAlert("Upload Error", "Upload failed. Check your network.");
            } finally {
                if (input) {
                    input.disabled = false;
                    input.placeholder = "iMessage";
                }
                e.target.value = '';
            }
        };

        // Helper: Upload to Storage and record in DB
        async function checkImageLimitAndCleanup(files) {
            const uidLower = currentUser.id.toLowerCase();
            const snap = await get(ref(db, `user_image_index/${uidLower}`));
            const uploads = snap.val() || {};
            const keys = Object.keys(uploads);

            // Calculate current TOTAL images
            let currentTotalImages = 0;
            for (const k in uploads) currentTotalImages += (uploads[k].imgCount || 1);

            console.log(`Quota Check: Current stored=${currentTotalImages}, New=${files.length}, Total=${currentTotalImages + files.length}/15`);

            if (currentTotalImages + files.length > 15) {
                // Step 1: First Confirmation
                const step1 = await showCustomConfirm(
                    "Storage Limit Reached",
                    `You currently have ${currentTotalImages} images saved. Sending these ${files.length} images will exceed your 15-image limit.`
                );
                if (!step1) return false;

                // Step 2: Final Warning
                const step2 = await showCustomConfirm(
                    "Confirm Expiration",
                    "Are you REALLY sure? This will cause your oldest photos to be marked as expired and removed from the server history.",
                    "Yes, I'm Sure"
                );
                if (!step2) return false;

                // Execution
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
        }

        window.adminPurgeImages = async () => {
            if (currentUser.email !== ADMIN_EMAIL) return;
            const confirmed = await showCustomConfirm(
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
                showCustomAlert("Purge Started", "Shredding private chat files...");
                let dbCount = 0;
                let storageCount = 0;

                // 1. Scan Messages (ONLY non-group chats)
                const msgsSnap = await get(ref(db, 'messages'));
                const allMsgs = msgsSnap.val() || {};
                for (const chatId in allMsgs) {
                    // Skip Group Chats!
                    if (chatId.startsWith('group_')) continue;

                    for (const msgKey in allMsgs[chatId]) {
                        const m = allMsgs[chatId][msgKey];
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

                // 2. Clear Quota Indices
                await set(ref(db, 'user_image_index'), null);

                await showCustomAlert("Purge Complete", `Deleted ${storageCount} private files and cleaned ${dbCount} entries. Group chats and news remain untouched.`);
            } catch (err) {
                await showCustomAlert("Error", "Purge failed: " + err.message);
            }
        };

        /* --- FIREBASE STORAGE MIGRATION HELPER --- */
        window.uploadImageToStorage = async function (base64Data, folder = 'uploads') {
            if (!base64Data || !base64Data.startsWith('data:image')) return null;
            try {
                // Generate a unique filename using timestamp and random string
                const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

                // Generate path based on security rules (Chats are isolated by UID)
                let path = `${folder}/${filename}`;
                if (folder === 'chats' && window.currentUser) {
                    path = `chats/${window.currentUser.id}/${filename}`;
                }

                const storageRef = sRef(storage, path);

                // Upload the base64 string as a DATA_URL
                const snapshot = await uploadString(storageRef, base64Data, 'data_url');
                console.log('Storage: Upload successful', snapshot.metadata.fullPath);

                // Get and return the public download URL
                const downloadURL = await getDownloadURL(storageRef);
                return downloadURL;
            } catch (error) {
                console.error('Storage: Upload failed', error);
                showCustomAlert("Upload Error", "Failed to save image to cloud. Using temporary local data instead.");
                return base64Data; // Fallback to base64 if storage fails (emergency mode)
            }
        };

        window.toggleGlobalPhotos = async (enabled) => {
            if (currentUser.email !== ADMIN_EMAIL) return;
            try {
                await update(ref(db, 'settings'), { isPhotoDisabled: enabled });
            } catch (err) {
                alert("Failed to update setting: " + err.message);
            }
        };
        window.selectSound = (val, e) => { if (e) e.stopPropagation(); updateSound(val); updateSettingsLabels(); toggleDropdown('soundDropdown'); };
        window.selectTheme = (val, e) => { if (e) e.stopPropagation(); applyTheme(val); updateSettingsLabels(); toggleDropdown('themeDropdown', e); };

        window.toggleNewsTab = (type) => {
            currentNewsTab = type;
            const btnSchool = document.getElementById('btnSchoolNews');
            const btnClub = document.getElementById('btnClubNews');
            const contentSchool = document.getElementById('schoolNewsContent');
            const contentClub = document.getElementById('clubNewsContent');

            const activeClass = "flex-1 text-center text-xs font-bold h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all";
            const inactiveClass = "flex-1 text-center text-xs font-bold h-full flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all";

            if (type === 'school') {
                btnSchool.className = activeClass;
                btnClub.className = inactiveClass;

                contentClub.classList.add('opacity-0');
                setTimeout(() => {
                    contentClub.classList.add('hidden');
                    contentSchool.classList.remove('hidden');
                    void contentSchool.offsetWidth;
                    contentSchool.classList.remove('opacity-0');
                }, 150);
            } else {
                btnClub.className = activeClass;
                btnSchool.className = inactiveClass;

                contentSchool.classList.add('opacity-0');
                setTimeout(() => {
                    contentSchool.classList.add('hidden');
                    contentClub.classList.remove('hidden');
                    void contentClub.offsetWidth;
                    contentClub.classList.remove('opacity-0');
                }, 150);
            }
        };


        let _overlayZBase = 150;

        function openOverlayPage(pageId, init) {
            document.body.classList.add('is-fullscreen');
            const page = document.getElementById(pageId);
            if (!page) return;

            const prevActiveId = OVERLAY_PAGE_IDS.find(id => {
                if (id === pageId) return false;
                const el = document.getElementById(id);
                return el && !el.classList.contains('hidden');
            });

            OVERLAY_PAGE_IDS.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.zIndex = String(_overlayZBase);
            });
            page.style.zIndex = String(_overlayZBase + 2);

            page.classList.add('translate-x-full');
            page.classList.remove('hidden');
            requestAnimationFrame(() => requestAnimationFrame(() => page.classList.remove('translate-x-full')));

            if (init) init();

            if (prevActiveId) {
                setTimeout(() => {
                    const prev = document.getElementById(prevActiveId);
                    if (prev) {
                        prev.classList.add('hidden');
                        prev.classList.add('translate-x-full');
                        prev.style.zIndex = '';
                    }
                }, 420);
            }
        }

        function closeOverlayPage(pageId, callback) {
            document.body.classList.remove('is-fullscreen');
            const page = document.getElementById(pageId);
            if (!page || page.classList.contains('hidden')) return;
            page.classList.add('translate-x-full');
            setTimeout(() => {
                page.classList.add('hidden');
                page.style.zIndex = '';
                if (callback) callback();
            }, 400);
        }

        // Extension Management Logic
        let _currentExtensionUrl = '';
        window.openExtension = (eid, customUrl = null, customTitle = null) => {
            const titleEl = document.getElementById('extensionTitle');
            const iframe = document.getElementById('extensionIframe');
            const loader = document.getElementById('extensionLoading');

            let url = 'about:blank';
            let title = 'Tool';

            if (customUrl) {
                url = customUrl;
                title = customTitle || eid;
            } else if (eid === 'calc_volume_3d') {
                url = 'extensions/BC volume 3D present.html';
                title = '3D Volume Visualizer';
            } else if (eid === 'independent_research') {
                url = 'extensions/IR Navigator.html';
                title = 'Independent Research Hub';
            } else if (eid === 'grade_calculator') {
                url = 'extensions/grade_calculator.html';
                title = 'Grade Calculator';
            }

            _currentExtensionUrl = url;
            titleEl.innerText = title;
            const customBtn = document.getElementById('extensionCustomBtn');
            if(customBtn) customBtn.classList.add('hidden');
            loader.classList.remove('hidden');
            iframe.src = url + '?v=' + Date.now();

            iframe.onload = () => {
                loader.classList.add('hidden');
            };

            // Apply Panel vs Fullscreen logic based on extension type
            const isPanel = ['grade_calculator', 'eagle_time', 'cafeteria', 'social_engine', 'lost_and_found', 'marketplace', 'peer_tutoring', 'suggestions', 'info'].includes(eid);
            const extPage = document.getElementById('extensionPage');
            
            if (isPanel) {
                extPage.classList.add('lg:left-80');
                extPage.classList.remove('z-[160]');
                extPage.classList.add('z-[95]');
                document.body.classList.remove('is-fullscreen');
            } else {
                extPage.classList.remove('lg:left-80');
                extPage.classList.add('z-[160]');
                extPage.classList.remove('z-[95]');
                document.body.classList.add('is-fullscreen');
            }

            openOverlayPage('extensionPage');
        };

        // ==========================================
        // APP BRIDGE PROTOCOL
        // Provides safe access to main app functions for extensions
        // ==========================================
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                switch (event.data.type) {
                    case 'GET_USER':
                        if (event.source) event.source.postMessage({ type: 'USER_RESPONSE', user: currentUser, isAdmin: isAppAdmin(), isStaff: isAppStaff() }, '*');
                        break;
                    case 'SET_TITLE':
                        document.getElementById('extensionTitle').innerText = event.data.title;
                        break;
                    case 'SHOW_TOAST':
                        showToast(event.data.message);
                        break;
                    case 'OPEN_GALLERY':
                        openGallery(event.data.images, event.data.index || 0);
                        break;
                    case 'CLOSE_EXTENSION':
                        closeExtension();
                        break;
                    case 'SET_HEADER_BTN':
                        const customBtn = document.getElementById('extensionCustomBtn');
                        if (customBtn && event.data.text) {
                            customBtn.innerText = event.data.text;
                            customBtn.classList.remove('hidden');
                            customBtn.onclick = () => {
                                const iframe = document.getElementById('extensionIframe');
                                if (iframe && iframe.contentWindow) {
                                    iframe.contentWindow.postMessage({ type: 'HEADER_BTN_CLICKED', actionId: event.data.actionId }, '*');
                                }
                            };
                        } else if (customBtn) {
                            customBtn.classList.add('hidden');
                        }
                        break;
                }
            }
        });

        window.closeExtension = () => {
            closeOverlayPage('extensionPage', () => {
                document.body.classList.remove('is-fullscreen');
                document.getElementById('extensionIframe').src = 'about:blank';
                _currentExtensionUrl = '';
            });
        };

        window.reloadExtension = () => {
            const iframe = document.getElementById('extensionIframe');
            const loader = document.getElementById('extensionLoading');
            loader.classList.remove('hidden');
            iframe.contentWindow.location.reload();
        };

        window.openExtensionExternally = () => {
            if (_currentExtensionUrl && _currentExtensionUrl !== 'about:blank') {
                window.open(_currentExtensionUrl, '_blank');
            }
        };
        // ===== End Overlay Navigation Engine =====



        window.setModuleSort = (sort) => {
            currentModuleSort = sort;
            const pageId = MODULE_PAGE_MAP[currentModule];
            const page = document.getElementById(pageId);
            if (page) {
                const latestBtn = page.querySelector('.sort-latest-btn');
                const hotBtn = page.querySelector('.sort-hot-btn');
                if (latestBtn) latestBtn.className = sort === 'latest' ? 'sort-latest-btn text-sm font-semibold text-black dark:text-white transition-colors' : 'sort-latest-btn text-sm font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors';
                if (hotBtn) hotBtn.className = sort === 'hot' ? 'sort-hot-btn text-sm font-semibold text-black dark:text-white transition-colors' : 'sort-hot-btn text-sm font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors';
            }
            loadModuleData();
        };

        async function getLocalModulePosts(moduleName) {
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

        async function loadModuleData() {
            const moduleName = currentModule;
            const pageId = MODULE_PAGE_MAP[moduleName];
            const listEl = document.querySelector(`#${pageId} .module-list`);
            if (listEl) listEl.innerHTML = '<div class="text-center text-gray-400 mt-10">Loading...</div>';

            // 1. Initial Load from Cache (for instant UI)
            const cached = await getLocalModulePosts(moduleName);
            if (cached.length > 0 && currentModule === moduleName) {
                modulePosts = cached.map(m => ({ id: m.key, ...m }));
                await Promise.all(modulePosts.map(p => fetchUser(p.authorId)));
                renderModuleList();
            }

            // 2. Attach Real-time Listener (for updates like likes/votes/comments)
            if (moduleListener) moduleListener();
            moduleListener = onValue(ref(db, `modules/${moduleName}`), async (snap) => {
                if (currentModule !== moduleName) return;
                const data = snap.val() || {};
                const posts = Object.keys(data).map(key => ({ id: key, ...data[key] }));

                // Save to local cache for next time
                for (const p of posts) {
                    await saveModulePostLocal(moduleName, p.id, p);
                }

                modulePosts = posts;
                await Promise.all(modulePosts.map(p => fetchUser(p.authorId)));
                renderModuleList();

                // If detail page is open for one of these, it handles its own onValue listener
            });
        }

        function getSuggestionVotingHtml(post) {
            if (currentModule !== 'suggestions') return '';
            const supportVotes = post.supportVotes || {};
            const notSupportVotes = post.notSupportVotes || {};
            const supportCount = Object.keys(supportVotes).length;
            const notSupportCount = Object.keys(notSupportVotes).length;
            const totalVotes = supportCount + notSupportCount;
            const supportPercent = totalVotes > 0 ? Math.round((supportCount / totalVotes) * 100) : 0;
            const notSupportPercent = totalVotes > 0 ? Math.round((notSupportCount / totalVotes) * 100) : 0;
            const userVote = auth.currentUser ? (supportVotes[auth.currentUser.uid] ? 'support' : (notSupportVotes[auth.currentUser.uid] ? 'not_support' : null)) : null;

            let barHtml = '';
            if (totalVotes === 0) {
                barHtml = '<div class="h-full flex-1 bg-gray-200 dark:bg-white/10"></div>';
            } else {
                let slantHtml = '';
                if (notSupportPercent > 0 && supportPercent > 0) {
                    slantHtml = '<div class="h-[150%] w-[3px] bg-white dark:bg-[#1C1C1E] transform skew-x-[-20deg] z-10 -mx-[1.5px]"></div>';
                }
                barHtml = '<div class="h-full bg-red-500 transition-all duration-700 ease-out" style="width: ' + notSupportPercent + '%;"></div>' +
                    slantHtml +
                    '<div class="h-full bg-blue-500 transition-all duration-700 ease-out flex-1"></div>';
            }

            return `
                <div class="mt-4 border border-gray-100 dark:border-white/5 rounded-2xl p-2 bg-gray-50/50 dark:bg-white/5 shadow-sm">
                    <div class="flex justify-between items-center px-2 py-1 mb-2">
                        <button onclick="voteSuggestion('${post.id}', 'not_support'); event.stopPropagation();" 
                                class="flex flex-col items-start active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'not_support' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-red-100 text-red-500 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <span class="font-bold text-sm ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}">Not Support</span>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-400'} ml-7">${notSupportPercent}% (${notSupportCount})</div>
                        </button>
                        
                        <button onclick="voteSuggestion('${post.id}', 'support'); event.stopPropagation();" 
                                class="flex flex-col items-end active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5 justify-end w-full">
                                <span class="font-bold text-sm ${userVote === 'support' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}">Support</span>
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'support' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-blue-100 text-blue-500 dark:bg-blue-500/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'support' ? 'text-blue-500' : 'text-gray-400'} mr-7">${supportPercent}% (${supportCount})</div>
                        </button>
                    </div>
                    
                    <div class="h-2 w-full bg-gray-200 dark:bg-black/50 rounded-full overflow-hidden flex items-center shadow-inner">
                        ${barHtml}
                    </div>
                </div>
            `;
        }

        window.voteSuggestion = async (postId, voteType) => {
            if (!auth.currentUser) return;
            const uid = auth.currentUser.uid;
            const supportRef = ref(db, `modules/suggestions/${postId}/supportVotes/${uid}`);
            const notSupportRef = ref(db, `modules/suggestions/${postId}/notSupportVotes/${uid}`);

            const post = modulePosts.find(p => p.id === postId) || (currentPostId === postId ? (await get(ref(db, `modules/suggestions/${postId}`))).val() : null);
            if (!post) return;

            const currentVote = (post.supportVotes && post.supportVotes[uid]) ? 'support'
                : (post.notSupportVotes && post.notSupportVotes[uid]) ? 'not_support' : null;

            try {
                if (voteType === 'support') {
                    if (currentVote === 'support') {
                        await set(supportRef, null);
                    } else {
                        await set(supportRef, true);
                        if (currentVote === 'not_support') await set(notSupportRef, null);
                    }
                } else {
                    if (currentVote === 'not_support') {
                        await set(notSupportRef, null);
                    } else {
                        await set(notSupportRef, true);
                        if (currentVote === 'support') await set(supportRef, null);
                    }
                }
            } catch (err) {
                alert("Failed to vote: " + err.message);
                console.error(err);
            }
        };



        window.handleMsgReport = () => {
            if (!selectedMsgData) return;
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (confirm("Report this message for harassment or inappropriate content?")) {
                reportMessage(selectedMsgData);
            }
        };

        async function reportMessage(msg) {
            try {
                const adminId = ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');

                // 1. Send to Admin from Safety Bot
                const adminChatId = getChatId(SAFETY_BOT_ID, adminId);
                const reportText = `[REPORT - MESSAGE]\nFrom: ${msg.senderName} (${msg.senderId})\nReported by: ${currentUser.name} (${currentUser.id})\nContent: ${msg.text}\nReason: User reported harassment.`;
                await push(ref(db, `messages/${adminChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: reportText,
                    type: 'text',
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                // 2. Send confirmation to Reporter from Safety Bot
                const userChatId = getChatId(SAFETY_BOT_ID, currentUser.id);
                const confirmationText = `[REPORT - MESSAGE - SUCCESSFUL]\nYour report regarding message "${msg.text}" has been received. Our administration will review it shortly. Thank you for keeping our community safe.`;
                await push(ref(db, `messages/${userChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: confirmationText,
                    type: 'text',
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                alert("Report sent successfully. You can track status in your chat with Safety Bot.");
            } catch (e) {
                alert("Failed to send report: " + e.message);
            }
        }

        window.reportPost = async (postId) => {
            const adminId = ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');
            const post = modulePosts.find(p => p.id === postId);
            if (!post) return;
            const author = await fetchUser(post.authorId);
            const receiverName = author?.name || 'Unknown';

            try {
                // 1. Notify Admin
                const adminChatId = getChatId(SAFETY_BOT_ID, adminId);
                const reportText = `[REPORT - POST]\nModule: ${currentModule}\nSubject: ${post.title}\nContent: ${post.desc}\nAuthor: ${receiverName} (${post.authorId})\nReported by: ${currentUser.name} (${currentUser.id})`;
                await push(ref(db, `messages/${adminChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: reportText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                // 2. Notify Reporter
                const userChatId = getChatId(SAFETY_BOT_ID, currentUser.id);
                const confirmText = `[REPORT - POST - SUCCESSFUL]\nYour report regarding the post "${post.title}" has been submitted. Thank you.`;
                await push(ref(db, `messages/${userChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: confirmText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                alert("Post reported successfully! Administrators will review it via Safety Bot.");
            } catch (e) {
                alert("Reporting failed: " + e.message);
            }
        };

        window.startModuleChat = (authorId) => {
            closeModule();
            setTimeout(() => {
                const isMobile = window.innerWidth < 1024;
                if (isMobile) {
                    const messagesBtn = document.getElementById('tabBtn-messages');
                    if (messagesBtn) messagesBtn.click();
                }
                switchChat(authorId);
            }, 350);
        };



        let isPostingNews = false;
        let isRequestingExtension = false;

        window.openNewsPostForm = () => {
            console.log('App: Opening News Post Form');
            isPostingNews = true;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            window.clearPostImage();
            document.getElementById('postPageTitle').innerText = 'New Announcement';

            const batchBtn = document.getElementById('batchImportBtn');
            if (batchBtn) {
                batchBtn.classList.toggle('hidden', !isAppAdmin());
            }

            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.style.display = window.isPhotoDisabled ? 'none' : 'flex';

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            });
        };


        window.openExtensionRequest = () => {
            isPostingNews = false;
            isRequestingExtension = true;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            document.getElementById('postInputTitle').placeholder = "What's the tool's name?";
            document.getElementById('postInputDesc').placeholder = "Explain how it helps you or what features it should have...";
            document.getElementById('postPageTitle').innerText = 'Tool Suggestion';
            document.getElementById('batchImportBtn')?.classList.add('hidden');

            // Hide image area for requests
            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.classList.add('hidden');

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            }, 10);
        };









        window.openBatchImport = () => {
            document.getElementById('batchJsonInput').value = '';
            document.getElementById('batchImportModal').classList.remove('hidden');
        };

        window.closeBatchImport = () => {
            document.getElementById('batchImportModal').classList.add('hidden');
        };

        window.processBatchImport = async () => {
            if (!isAppAdmin()) {
                showCustomAlert("Unauthorized", "Only administrators can perform batch imports.");
                return;
            }
            const raw = document.getElementById('batchJsonInput').value.trim();
            if (!raw) return;
            let data;
            try {
                data = JSON.parse(raw);
            } catch (e) {
                alert("Invalid JSON format. Please check the template.");
                return;
            }

            if (!Array.isArray(data)) {
                alert("Data must be an array of announcements.");
                return;
            }

            const btn = document.querySelector('#batchImportModal button[onclick="processBatchImport()"]');
            const originalText = btn.innerText;
            btn.innerText = "Publishing...";
            btn.disabled = true;

            try {
                const promises = data.map(item => {
                    const type = (item.type === 'club' || item.type === 'club_news') ? 'club' : 'school';
                    return set(push(ref(db, `news/${type}`)), {
                        title: item.title || "Untitled",
                        desc: item.desc || "",
                        image: null,
                        authorId: currentUser.id,
                        authorName: currentUser.name,
                        timestamp: Date.now(),
                        likes: {}
                    });
                });

                await Promise.all(promises);
                showCustomAlert("Success", `Successfully imported ${data.length} announcements!`);
                closeBatchImport();
                closePostForm();
                globalDataSync();
            } catch (err) {
                alert("Import failed: " + err.message);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };


        window.openEagleTime = () => {
            currentModule = 'eagle_time';
            const btn = document.getElementById('eagleAddBtn');
            if (btn) btn.classList.toggle('hidden', !isAppStaff());
            openOverlayPage('eagleTimePage', renderEagleTime);
        };

        window.closeEagleTime = () => {
            closeOverlayPage('eagleTimePage', () => {
                currentModule = null;
            });
        };

        function renderEagleTime() {
            const container = document.getElementById('eagleTimeContent');
            const studentPassContainer = document.getElementById('studentPassContainer');

            onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
                const sessions = snapshot.val() || {};
                const sessionList = Object.keys(sessions).map(id => ({ id, ...sessions[id] }));

                // Check if user is already in a session
                let joinedSession = null;
                sessionList.forEach(s => {
                    if (s.students && s.students[currentUser.id]) joinedSession = s;
                });

                if (joinedSession) {
                    container.classList.add('hidden');
                    studentPassContainer.classList.remove('hidden');
                    renderStudentPass(joinedSession);
                } else {
                    container.classList.remove('hidden');
                    studentPassContainer.classList.add('hidden');
                    renderSessionList(sessionList);
                }
            });
        }

        async function renderSessionList(sessions) {
            const container = document.getElementById('sessionListContainer');
            if (sessions.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 mt-20">No Eagle Time sessions available.</div>';
                return;
            }

            let cols = 1;
            const w = window.innerWidth;
            if (w >= 1536) cols = 4;
            else if (w >= 1280) cols = 3;
            else if (w >= 768) cols = 2;

            const columns = Array.from({ length: cols }, () => []);
            sessions.forEach((s, i) => columns[i % cols].push(s));

            const html = await Promise.all(columns.map(async colSessions => {
                if (colSessions.length === 0) return '';
                const cards = await Promise.all(colSessions.map(async s => {
                    const studentCount = Object.keys(s.students || {}).length;
                    const teacher = await fetchUser(s.teacherId);
                    const teacherName = teacher?.name || 'Unknown Teacher';

                    const studentsHtml = await Promise.all(Object.keys(s.students || {}).map(async uid => {
                        const u = await fetchUser(uid);
                        return `<div class="text-[13px] text-gray-600 dark:text-gray-400 flex justify-between gap-2"><span>${escapeHTML(u?.name || uid)}</span></div>`;
                    }));

                    return `
                        <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                            <div class="flex justify-between items-start">
                                <div class="min-w-0">
                                    <h4 class="font-bold text-base text-black dark:text-white truncate">${escapeHTML(s.title)}</h4>
                                    <p class="text-sm text-gray-500 truncate">${escapeHTML(teacherName)} • Room ${escapeHTML(s.room)}</p>
                                </div>
                                <span class="bg-blue-100 dark:bg-blue-500/20 text-[#007AFF] text-xs font-bold px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                                    ${studentCount} Joined
                                </span>
                            </div>
                            <button onclick="joinEagleSession('${s.id}')" 
                                class="w-full bg-[#007AFF] text-white py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                                Join Session
                            </button>
                            ${(isAppAdmin() || currentUser.id === s.teacherId) ? `
                                <div class="pt-2 border-t border-gray-100 dark:border-white/5">
                                    <p class="text-xs font-bold text-gray-400 uppercase mb-2">Roster</p>
                                    <div class="space-y-1 max-h-32 overflow-y-auto">
                                        ${studentsHtml.join('') || '<p class="text-xs text-gray-400 italic">No students.</p>'}
                                    </div>
                                    <button onclick="deleteEagleSession('${s.id}')" class="mt-3 text-red-500 text-sm font-bold">Delete Session</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }));
                return `<div class="flex-1 flex flex-col gap-4 min-w-0">${cards.join('')}</div>`;
            }));

            const finalHtml = `<div class="flex flex-wrap md:flex-nowrap gap-4 items-start w-full mx-auto max-w-[1200px]">${html.join('')}</div>`;
            container.innerHTML = finalHtml;
        }

        // Add resize listener for Eagle Time grid
        window.addEventListener('resize', () => {
            if (currentModule === 'eagle_time') {
                // Debounce or just re-render if active
                const eaglePage = document.getElementById('eagleTimePage');
                if (eaglePage && !eaglePage.classList.contains('hidden')) {
                    // Re-render list to adjust columns
                    onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
                        const sessions = snapshot.val() || {};
                        renderSessionList(Object.keys(sessions).map(id => ({ id, ...sessions[id] })));
                    }, { onlyOnce: true });
                }
            }
        });

        async function renderStudentPass(session) {
            const container = document.getElementById('studentPassContainer');
            const teacher = await fetchUser(session.teacherId);
            container.innerHTML = `
                <div class="w-full max-w-[400px] mx-auto">
                    <div class="pass-gradient p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden space-y-6">
                        <div class="flex justify-between items-start relative z-10">
                            <div>
                                <p class="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mb-1">Digital Hall Pass</p>
                                <h2 class="text-3xl font-black tracking-tight leading-tight">EAGLE TIME</h2>
                            </div>
                        </div>

                        <div class="space-y-4 pt-4 border-t border-white/20 relative z-10">
                            <div class="flex justify-between">
                                <div>
                                    <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Student</p>
                                    <p class="font-bold text-lg">${escapeHTML(currentUser.name)}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Room</p>
                                    <p class="font-bold text-lg">${escapeHTML(session.room)}</p>
                                </div>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Course / Enrichment</p>
                                <p class="font-bold text-lg">${escapeHTML(session.title)}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Teacher</p>
                                <p class="font-bold text-lg">${escapeHTML(teacher?.name || 'Unknown')}</p>
                            </div>
                        </div>

                        <div class="ticket-cutout my-2 border-t-2 border-dashed border-white/30 relative z-10"></div>

                        <div class="pt-2 text-center relative z-10">
                             <div class="inline-block bg-white text-[#007AFF] px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase shadow-lg">
                                Active Pass
                             </div>
                             <p class="mt-4 text-[11px] opacity-70 font-medium">Valid for enrichment period only</p>
                        </div>

                        <!-- Abstract Background Decorations -->
                        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div class="absolute -top-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                    </div>

                    <button onclick="leaveEagleSession('${session.id}')" 
                        class="w-full mt-6 bg-white dark:bg-[#1C1C1E] text-red-500 py-3 rounded-2xl font-bold text-base shadow-sm active:scale-95 transition-transform border border-red-100 dark:border-red-900/30">
                        Cancel Registration
                    </button>
                </div>
            `;
        }

        window.joinEagleSession = async (sessionId) => {
            try {
                await update(ref(db, `eagle_time/sessions/${sessionId}/students`), { [currentUser.id]: true });
                alert("Successfully joined Eagle Time session!");
            } catch (e) { alert("Failed to join: " + e.message); }
        };

        window.leaveEagleSession = async (sessionId) => {
            if (!confirm("Are you sure you want to cancel your registration?")) return;
            try {
                await set(ref(db, `eagle_time/sessions/${sessionId}/students/${currentUser.id}`), null);
            } catch (e) { alert("Failed to leave: " + e.message); }
        };

        window.openCreateEagleForm = async () => {
            const form = document.getElementById('eagleCreateForm');
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Populate teacher select - This still requires some way to find teachers
            // For now, we use the cached users (those we have chats with)
            const select = document.getElementById('eagleTeacherSelect');
            select.innerHTML = '<option value="">Select Teacher</option>';
            for (const uid in ALL_USERS) {
                const u = ALL_USERS[uid];
                if (u.email && (u.email.endsWith('@hcpss.org') || u.email === ADMIN_EMAIL)) {
                    const opt = document.createElement('option');
                    opt.value = uid;
                    opt.innerText = u.name;
                    select.appendChild(opt);
                }
            }
        };

        window.submitEagleSession = async () => {
            const title = document.getElementById('eagleTitleInput').value.trim();
            const room = document.getElementById('eagleRoomInput').value.trim();
            const teacherId = document.getElementById('eagleTeacherSelect').value;

            if (!title || !room || !teacherId) return alert("Please fill all fields");

            try {
                const newRef = push(ref(db, 'eagle_time/sessions'));
                await set(newRef, { title, room, teacherId, timestamp: serverTimestamp(), students: {} });
                document.getElementById('eagleCreateForm').classList.add('hidden');
                document.getElementById('eagleTitleInput').value = '';
                document.getElementById('eagleRoomInput').value = '';
                alert("Session created successfully!");
            } catch (e) { alert("Failed to create: " + e.message); }
        };

        window.deleteEagleSession = async (id) => {
            if (!confirm("Delete this session and all its registrations?")) return;
            await set(ref(db, `eagle_time/sessions/${id}`), null);
        };
        // Grade Calculator Logic
        let lastIsMobile = window.innerWidth < 1024;
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth < 1024;
            if (isMobile !== lastIsMobile) {
                lastIsMobile = isMobile;
                const newsSec = document.getElementById('newsSection');
                const sidePanel = document.getElementById('sidePanel');
                const chatSec = document.getElementById('chatSection');
                const bottomNav = document.getElementById('bottomNav');

                // Clear any lingering animation states
                [newsSec, sidePanel, chatSec].forEach(el => {
                    if (el) {
                        el.style.animation = '';
                        el.style.zIndex = '';
                        el.classList.remove('absolute', 'h-full', 'top-0', 'left-0', 'slide-in-left', 'slide-in-right');
                    }
                });
                window.isTabAnimating = false;

                if (!isMobile) {
                    // Switch to Desktop: Use AppView to show all panels
                    window.AppView.showPanel('news'); // In Desktop, showPanel ensures all are flex
                } else {
                    // Switch to Mobile: determine which panel to show based on activeTargetId or currentPanel
                    const panelToRestore = activeTargetId ? 'chat' : (window.AppView.currentPanel || 'news');
                    window.AppView.showPanel(panelToRestore);
                }
            }
        });

        // Cafeteria Menu Logic
        let cafeteriaPool = {};
        let cafeteriaMenus = {};
        let currentCafeteriaTab = 'today';
        let selectedFoods = { today: new Set(), tomorrow: new Set() };
        let cafeteriaListener1 = null;
        let cafeteriaListener2 = null;

        function getLocalDateString(offsetDays = 0) {
            const d = new Date();
            d.setDate(d.getDate() + offsetDays);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        window.openCafeteria = () => {
            currentModule = 'cafeteria';
            const btn = document.getElementById('cafeteriaEditBtn');
            if (btn) {
                btn.classList.toggle('hidden', !isAppStaff());
            }

            document.getElementById('cafeteriaTodayDate').innerText = getLocalDateString(0);
            document.getElementById('cafeteriaTomorrowDate').innerText = getLocalDateString(1);

            moduleListener = () => {
                if (cafeteriaListener1) { cafeteriaListener1(); cafeteriaListener1 = null; }
                if (cafeteriaListener2) { cafeteriaListener2(); cafeteriaListener2 = null; }
            };

            openOverlayPage('cafeteriaPage', loadCafeteriaData);
        };

        function loadCafeteriaData() {
            if (cafeteriaListener1) cafeteriaListener1();
            if (cafeteriaListener2) cafeteriaListener2();

            cafeteriaListener1 = onValue(ref(db, 'cafeteria/pool'), (snap) => {
                cafeteriaPool = snap.val() || {};
                renderCafeteriaView();
                renderCafeteriaEditPool();
            });

            cafeteriaListener2 = onValue(ref(db, 'cafeteria/menus'), (snap) => {
                cafeteriaMenus = snap.val() || {};
                renderCafeteriaView();
            });
        }

        function renderCafeteriaView() {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            const todayIds = cafeteriaMenus[todayStr] || [];
            const tomorrowIds = cafeteriaMenus[tomorrowStr] || [];

            const todayList = document.getElementById('cafeteriaTodayList');
            const tomorrowList = document.getElementById('cafeteriaTomorrowList');

            const renderItems = (ids, container) => {
                if (!ids || ids.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-400 py-4 font-medium">No menu published yet.</div>';
                    return;
                }
                let html = '';
                ids.forEach(id => {
                    if (cafeteriaPool[id]) {
                        html += `
                            <div class="flex items-center gap-3 py-1">
                                <div class="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                                <span class="text-base font-bold text-black dark:text-white">${escapeHTML(cafeteriaPool[id].name)}</span>
                            </div>
                        `;
                    }
                });
                container.innerHTML = html || '<div class="text-center text-gray-400 py-4 font-medium">Items no longer available.</div>';
            };

            if (todayList) renderItems(todayIds, todayList);
            if (tomorrowList) renderItems(tomorrowIds, tomorrowList);
        }

        window.openCafeteriaEdit = () => {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            selectedFoods.today = new Set(cafeteriaMenus[todayStr] || []);
            selectedFoods.tomorrow = new Set(cafeteriaMenus[tomorrowStr] || []);

            switchCafeteriaTab('today');

            const sheet = document.getElementById('cafeteriaEditSheet');
            sheet.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('cafeteriaEditBackdrop').classList.add('opacity-100');
                document.getElementById('cafeteriaEditContent').classList.remove('translate-y-full');
            });
        };

        window.closeCafeteriaEdit = () => {
            document.getElementById('cafeteriaEditBackdrop').classList.remove('opacity-100');
            document.getElementById('cafeteriaEditContent').classList.add('translate-y-full');
            setTimeout(() => document.getElementById('cafeteriaEditSheet').classList.add('hidden'), 400);
        };

        window.switchCafeteriaTab = (tab) => {
            currentCafeteriaTab = tab;

            const btnToday = document.getElementById('cafeteriaTabToday');
            const btnTomorrow = document.getElementById('cafeteriaTabTomorrow');
            if (tab === 'today') {
                btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
                btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
            } else {
                btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
                btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
            }

            renderCafeteriaEditPool();
        };

        function renderCafeteriaEditPool() {
            const listEl = document.getElementById('cafeteriaPoolList');
            if (!listEl) return;

            const poolKeys = Object.keys(cafeteriaPool);
            if (poolKeys.length === 0) {
                listEl.innerHTML = '<div class="p-6 text-center text-gray-400 font-medium">Pool is empty. Add food above.</div>';
                return;
            }

            const currentSet = selectedFoods[currentCafeteriaTab];

            let html = '';
            poolKeys.sort((a, b) => cafeteriaPool[a].name.localeCompare(cafeteriaPool[b].name)).forEach(id => {
                const item = cafeteriaPool[id];
                const isChecked = currentSet.has(id);

                html += `
                    <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onclick="toggleFoodSelection('${id}')">
                        <div class="flex items-center gap-4 flex-1">
                            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300 dark:border-gray-600'}">
                                ${isChecked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>' : ''}
                            </div>
                            <span class="text-base font-semibold text-black dark:text-white ${isChecked ? '' : 'opacity-80'}">${item.name}</span>
                        </div>
                        <button onclick="deleteFoodFromPool('${id}', event)" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;
            });

            listEl.innerHTML = html;
        }

        window.toggleFoodSelection = (id) => {
            const currentSet = selectedFoods[currentCafeteriaTab];
            if (currentSet.has(id)) {
                currentSet.delete(id);
            } else {
                currentSet.add(id);
            }
            renderCafeteriaEditPool();
        };

        window.addFoodToPool = async () => {
            const input = document.getElementById('newFoodInput');
            const name = input.value.trim();
            if (!name) return;

            const isDuplicate = Object.values(cafeteriaPool).some(item => item.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                alert("This food is already in the pool!");
                return;
            }

            const newRef = push(ref(db, 'cafeteria/pool'));
            await set(newRef, { name: name, timestamp: serverTimestamp() });
            input.value = '';
        };

        window.deleteFoodFromPool = async (id, event) => {
            event.stopPropagation();
            if (!confirm("Are you sure you want to delete this food from the pool?")) return;
            await set(ref(db, `cafeteria/pool/${id}`), null);

            selectedFoods.today.delete(id);
            selectedFoods.tomorrow.delete(id);
            renderCafeteriaEditPool();
        };

        window.clearAllLocalData = async () => {
            if (!confirm("This will wipe all locally cached messages and reload. Continue?")) return;
            try {
                if (localDB) localDB.close();
                // Short delay to ensure connection is closed
                setTimeout(() => {
                    indexedDB.deleteDatabase("CHSChatCache");
                    location.reload();
                }, 100);
            } catch (e) {
                location.reload();
            }
        };

        window.saveCafeteriaMenu = async () => {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            const updates = {};
            updates[`cafeteria/menus/${todayStr}`] = Array.from(selectedFoods.today);
            updates[`cafeteria/menus/${tomorrowStr}`] = Array.from(selectedFoods.tomorrow);

            try {
                await update(ref(db), updates);
                closeCafeteriaEdit();
            } catch (e) {
                alert("Failed to save menu");
            }
        };

        let adminAllUsers = {};
        window.openAdminConsole = async () => {
            if (!isAppAdmin()) return;
            openOverlayPage('adminConsolePage');
            const listEl = document.getElementById('adminUserList');
            listEl.innerHTML = '<div class="text-center text-gray-400 mt-20 animate-pulse">Fetching all users...</div>';
            try {
                const snap = await get(ref(db, 'users'));
                adminAllUsers = snap.val() || {};
                renderAdminUserList(adminAllUsers);
            } catch (err) {
                listEl.innerHTML = `<div class="text-center text-red-500 mt-20 p-4 font-bold">Error: ${err.message}</div>`;
            }
        };

        window.closeAdminConsole = () => {
            closeOverlayPage('adminConsolePage');
            document.getElementById('adminUserSearch').value = '';
            document.getElementById('scanStatus').classList.add('hidden');
        };

        window.filterAdminUsers = () => {
            const term = document.getElementById('adminUserSearch').value.toLowerCase().trim();
            if (!term) { renderAdminUserList(adminAllUsers); return; }
            const filtered = {};
            Object.keys(adminAllUsers).forEach(id => {
                const u = adminAllUsers[id];
                const match = (u.name || '').toLowerCase().includes(term) ||
                    (u.email || '').toLowerCase().includes(term) ||
                    id.toLowerCase().includes(term);
                if (match) filtered[id] = u;
            });
            renderAdminUserList(filtered);
        };

        window.scanUserIssues = () => {
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

            renderAdminUserList(problematic, true);
            status.innerText = `Scan Complete: Found ${Object.keys(problematic).length} accounts with potential issues.`;
            document.getElementById('adminShowAllBtn').classList.remove('hidden');
        };

        window.resetAdminList = () => {
            document.getElementById('adminUserSearch').value = '';
            document.getElementById('scanStatus').classList.add('hidden');
            document.getElementById('adminShowAllBtn').classList.add('hidden');
            renderAdminUserList(adminAllUsers);
        };

        function renderAdminUserList(users, isScanResult = false) {
            const container = document.getElementById('adminUserList');
            const ids = Object.keys(users);
            if (ids.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 mt-20">No users found.</div>';
                return;
            }

            container.innerHTML = ids.map(id => {
                const u = users[id];
                const issues = u.scanIssues || [];
                const issuesHtml = issues.map(issue =>
                    `<span class="bg-red-500/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">${issue}</span>`
                ).join(' ');

                return `
                    <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div class="flex justify-between items-start gap-4">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 flex-wrap mb-1">
                                    <span class="font-bold text-black dark:text-white truncate">${escapeHTML(u.name || 'No Name')}</span>
                                    <span class="bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">${u.role || 'user'}</span>
                                    ${issuesHtml}
                                </div>
                                <div class="text-xs text-gray-400 truncate font-medium">${escapeHTML(u.email || 'NO EMAIL')}</div>
                                <div class="text-[10px] text-gray-500 font-mono mt-1 opacity-50 select-all">ID: ${id}</div>
                            </div>
                            <button onclick="confirmDeleteUser('${id}')" 
                                class="bg-red-50 dark:bg-red-500/10 text-red-500 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        window.confirmDeleteUser = async (userId) => {
            const u = adminAllUsers[userId] || { name: userId };
            if (window.showCustomConfirm) {
                const firstOk = await window.showCustomConfirm(
                    "Destroy User Account?",
                    `This will PERMANENTLY delete <b>${escapeHTML(u.name || userId)}</b> and all associated chat logs. Irreversible action.`,
                    "DELETE ACCOUNT"
                );
                if (!firstOk) return;

                const secondOk = await window.showCustomConfirm(
                    "FINAL WARNING",
                    `Are you absolutely sure? You are about to wipe all data for ${escapeHTML(u.name || userId)}.`,
                    "YES, WIPE EVERYTHING"
                );
                if (secondOk) {
                    deleteUserFully(userId);
                }
            } else {
                if (confirm(`Delete ${u.name}? ALL chat history will be lost.`)) {
                    if (confirm("FINAL CONFIRMATION: Wipe all data?")) {
                        deleteUserFully(userId);
                    }
                }
            }
        };

        window.deleteUserFully = async (userId) => {
            const listEl = document.getElementById('adminUserList');
            const status = document.getElementById('scanStatus');
            status.classList.remove('hidden');
            status.innerText = `Purging ${userId} from system...`;

            try {
                // 1. Delete user record
                await set(ref(db, `users/${userId}`), null);
                await set(ref(db, `user_private/${userId}`), null); // If exists

                // 2. Delete user chats index
                const userChatsRef = ref(db, `user_chats/${userId.toLowerCase()}`);
                const chatsSnap = await get(userChatsRef);
                const chats = chatsSnap.val() || {};

                // 3. Cascade delete: iterate all people this user chatted with
                const otherUserIds = Object.keys(chats);
                for (const otherId of otherUserIds) {
                    // Remove current user from other person's list
                    await set(ref(db, `user_chats/${otherId.toLowerCase()}/${userId.toLowerCase()}`), null);
                    // Delete the message thread
                    const chatId = getChatId(userId, otherId);
                    await set(ref(db, `messages/${chatId}`), null);
                }

                // Delete the user's own chat index
                await set(userChatsRef, null);

                // Success
                delete adminAllUsers[userId];
                renderAdminUserList(adminAllUsers);
                status.innerText = `User ${userId} successfully purged from database.`;
                setTimeout(() => status.classList.add('hidden'), 3000);
            } catch (err) {
                alert("Purge failed: " + err.message);
                status.innerText = "Error during purge sequence.";
            }
        };

        // Class Management Functions
        window.openClassEdit = async (classId) => {
            const snap = await get(ref(db, `classes/${classId}`));
            const c = snap.val();
            if (!c) return;

            // 1. Edit Name
            const newName = await showCustomPrompt("Edit Class Name", "Enter the new name for this class:", c.name);
            if (newName === null) return;
            if (newName.trim() && newName.trim() !== c.name) {
                await update(ref(db, `classes/${classId}`), { name: newName.trim() });
            }

            // 2. Manage Roster
            const rosterAction = await showCustomConfirm("Manage Roster", "Would you like to add a new student by email?", "Add Student");
            if (rosterAction) {
                const email = await showCustomPrompt("Add Student", "Enter the student's HCPSS email address:");
                if (email) {
                    const usersSnap = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(email.toLowerCase().trim())));
                    if (!usersSnap.exists()) {
                        await showCustomAlert("Error", "No registered user found with that email.");
                    } else {
                        const uid = Object.keys(usersSnap.val())[0];
                        await update(ref(db, `classes/${classId}/students`), { [uid]: true });
                        await showCustomAlert("Success", "Student added to the class roster.");
                    }
                }
            }

            const extAction = await showCustomConfirm("Manage Extensions", "Which extension would you like to manage?", "IR Hub", "3D Volume");
            if (extAction !== null) {
                const eid = extAction ? 'independent_research' : 'calc_volume_3d';
                const name = extAction ? 'IR Navigator' : '3D Volume Visualizer';
                const isEnabled = c.extensions && c.extensions[eid];
                const toggle = await showCustomConfirm(
                    name,
                    `${name} is currently <b>${isEnabled ? 'ENABLED' : 'DISABLED'}</b>. Would you like to ${isEnabled ? 'REMOVE' : 'ACTIVATE'} it?`,
                    isEnabled ? "DEACTIVATE" : "ACTIVATE"
                );
                if (toggle) {
                    await update(ref(db, `classes/${classId}/extensions`), { [eid]: !isEnabled });
                    await showCustomAlert("Success", `Extension updated successfully.`);
                }
            }

            window.renderSidebar();
        };

        window.addNewClass = async () => {
            const name = await showCustomPrompt("Create New Class", "Enter the name for the new class:");
            if (!name || !name.trim()) return;

            try {
                const newRef = push(ref(db, 'classes'));
                await set(newRef, {
                    name: name.trim(),
                    teacherId: currentUser.id,
                    timestamp: serverTimestamp(),
                    lastActivity: serverTimestamp(),
                    students: {}
                });
                window.renderSidebar();
                // Removed showCustomAlert to prevent modal sticking issues
            } catch (e) {
                showCustomAlert("Error", "Failed to create class: " + e.message);
            }
        };

        // Helper: Custom Prompt using the existing modal structure
        window.showCustomPrompt = (title, body, defaultValue = "") => {
            return new Promise(resolve => {
                const els = _getModalEls();
                els.title.innerText = title;
                els.body.innerHTML = `${body}<br/><input type="text" id="modalInput" class="w-full mt-4 p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all" value="${escapeHTML(defaultValue)}">`;
                els.cancel.classList.remove('hidden');
                els.alt.classList.add('hidden');
                els.cancel.innerText = "Cancel";
                els.confirm.innerText = "Save";
                els.cancel.onclick = () => _closeModal(null, resolve);
                els.confirm.onclick = () => {
                    const val = document.getElementById('modalInput').value;
                    _closeModal(val, resolve);
                };
                _openModal();
                setTimeout(() => {
                    const input = document.getElementById('modalInput');
                    if (input) input.focus();
                }, 50);
            });
        };

        // Initialize user interaction records for groups
        async function syncGroupChats() {
            if (!currentUser) return;
            try {
                const snap = await get(ref(db, 'classes'));
                const classes = snap.val() || {};
                const myClasses = Object.keys(classes).filter(id => {
                    const c = classes[id];
                    return c.teacherId === currentUser.id || (c.students && c.students[currentUser.id]);
                });

                // Update participant cache
                sidebarClasses = {};
                myClasses.forEach(id => sidebarClasses[id] = true);

                // For each class, ensure the group chat timestamp exists in user_chats if it has activity
                for (const cid of myClasses) {
                    const c = classes[cid];
                    cnCache[cid] = c.name;

                    // Pre-fetch teacher name for sidebar
                    if (c.teacherId) {
                        fetchUser(c.teacherId).then(u => {
                            if (u && u.name) {
                                ctCache[cid] = u.name;
                                window.renderSidebar();
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
                const firstSync = !isSyncDone;
                isSyncDone = true;
                if (firstSync) {
                    window.renderSidebar();
                }

                // Removed redundant switchChat call that caused periodic reloads

            } catch (e) { console.warn("Group sync failed:", e); }
        }

        // Run sync periodically
        setInterval(syncGroupChats, 30000);
        syncGroupChats();
    

        // Global error helper
        window.showError = function (err) {
            console.error('App Error:', err);
            const overlay = document.getElementById('errorOverlay');
            const msgEl = document.getElementById('errorMessage');
            if (overlay && msgEl) {
                msgEl.textContent = err && err.stack ? err.stack : String(err);
                overlay.classList.remove('hidden');
            }
        };
        // Global UI helpers
        window.hideLoading = function () {
            const lp = document.getElementById('loadingPage');
            if (lp) {
                lp.classList.add('opacity-0');
                setTimeout(function () {
                    lp.classList.add('hidden');
                    // Show compatibility info for first-time users
                    if (!localStorage.getItem('compatibility_dismissed')) {
                        var cp = document.getElementById('compatibilityPage');
                        if (cp) cp.classList.remove('hidden');
                    }
                }, 500);
            }
        };

        window.dismissCompatibility = function () {
            localStorage.setItem('compatibility_dismissed', 'true');
            var cp = document.getElementById('compatibilityPage');
            if (cp) cp.classList.add('hidden');
        };

        // Removed redundant showCustomAlert definition

        // Removed redundant showCustomConfirm definition

        // Catch all uncaught errors
        window.addEventListener('error', function (e) { showError(e.error || e.message); });
        window.addEventListener('unhandledrejection', function (e) { showError(e.reason); });

        // Failsafe: Force hide loading after 10 seconds
        setTimeout(() => {
            const lp = document.getElementById('loadingPage');
            if (lp && !lp.classList.contains('hidden')) {
                console.warn('Initialization watchdog: Forcing hide loading.');
                window.hideLoading();
            }
        }, 10000);
    

            // Initial bottom nav sync
            if (window.innerWidth < 1024 && window.refreshBottomNav) {
                window.refreshBottomNav('messages');
            }
        
