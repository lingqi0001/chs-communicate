/**
 * ==================================================================================
 * 模块名称：NotifyModule (通知与实时监控系统)
 * 目标文件：js/notify.js
 * 
 * 【设计哲学】：
 * 通知模块是全站的“触角”。它通过 PWA 推送 (FCM) 解决离线通知问题，通过 Canvas 
 * 动态绘图解决浏览器徽章显示问题，并通过 initMonitor 实现了一套极轻量的“全量
 * 实时消息监听器”，确保用户在任何界面都能第一时间收到未读红点。
 * 
 * 【函数清单 & 使用手册】：
 * 
 * 1. init(deps) [初始化]
 *    - 【输入】：deps (Object) - 包含 {currentUser, allUsers, settings, globalListeners}。
 *    - 【存在理由】：它不仅是依赖注入，还负责预加载提示音 (Audio)。
 * 
 * 2. updateUI() [UI 刷新]
 *    - 【输入】：无。
 *    - 【返回】：无。
 *    - 【存在理由】：它是通知视觉的“中控台”，同时控制主红点、页面 Title 以及 Favicon 的同步更新。
 * 
 * 3. updateFavicon(hasUnread) [Canvas 绘图]
 *    - 【输入】：hasUnread (Boolean)。
 *    - 【存在理由】：这是一个“黑科技”函数。浏览器原生不支持动态修改图标徽章，我们通过 Canvas 在原始图标右下角强行画一个 12px 的蓝点，再转成 Base64 塞回给 Favicon。
 * 
 * 4. requestPermission() [PWA 授权]
 *    - 【返回】：Promise(void)。
 *    - 【存在理由】：申请浏览器通知权限，并注册 Service Worker (firebase-messaging-sw.js) 以获取 FCM Token，从而支持关闭网页后的系统级推送。
 * 
 * 5. setupListeners() [FCM 监听]
 *    - 【存在理由】：处理网页处于前台（活跃状态）时收到的 FCM 消息，将其转化为自定义的 showCustomAlert 弹窗。
 * 
 * 6. initMonitor() [核心监控引擎]
 *    - 【存在理由】：这是全站最重也最重要的函数。它会遍历所有联系人，为每个会话创建一个 limitToLast(1) 的监听器。它解决了“人在 A 聊，B 聊来了消息没提示”的问题，是实时性的底层保证。
 * 
 * 7. markAsRead(targetId) [状态清理]
 *    - 【输入】：targetId (String)。
 *    - 【存在理由】：当用户点开某个聊天室时，调用此函数清除对应的未读标记，并自动触发 updateUI 同步视觉状态。
 * ==================================================================================
 */

import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { CloudDB, PATHS } from './db.js?v=2';

export const NotifyModule = {
    unreadSet: new Set(),
    engine: null, // Firebase Messaging 实例
    audio: null,  // 提示音对象
    originalFavicon: document.querySelector('link[rel="icon"]')?.href || '',
    
    // 应用上下文（由 init 注入）
    context: {
        currentUser: null,
        allUsers: null,
        settings: null,
        appStartTime: Date.now(),
        globalListeners: null
    },

    /**
     * [初始化]
     * @param {Object} deps - 业务依赖: { currentUser, allUsers, settings, globalListeners }
     */
    init: function(deps) {
        this.context.currentUser = deps.currentUser;
        this.context.allUsers = deps.allUsers;
        this.context.settings = deps.settings;
        this.context.globalListeners = deps.globalListeners;
        this.context.appStartTime = deps.appStartTime || Date.now();

        // 初始化提示音
        if (this.context.settings?.soundUrl) {
            this.audio = new Audio(this.context.settings.soundUrl);
        }

        // 如果 Messaging 引擎已就绪，则启动监听
        if (this.engine) {
            this.setupListeners();
        }
    },

    /**
     * [UI 更新] 更新主红点及页面标题未读数
     */
    updateUI: function() {
        const unreadCount = this.unreadSet.size;
        const mainDot = document.getElementById('mainUnreadDot');

        if (unreadCount > 0) {
            if (mainDot) mainDot.classList.remove('hidden');
            document.title = `(${unreadCount}) CHS Chat & Social`;
        } else {
            if (mainDot) mainDot.classList.add('hidden');
            document.title = `CHS Chat & Social`;
        }
        this.updateFavicon(unreadCount > 0);
    },

    /**
     * [Favicon 徽章] 在浏览器图标上绘制蓝点
     */
    updateFavicon: function(hasUnread) {
        const favicon = document.querySelector('link[rel="icon"]');
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!favicon) return;

        if (!hasUnread) {
            favicon.href = this.originalFavicon;
            if (appleIcon) appleIcon.href = this.originalFavicon;
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(img, 0, 0, 64, 64);
            
            // 绘制右下角蓝色圆点
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
        img.src = this.originalFavicon;
    },

    /**
     * [权限申请] 申请通知权限并注册 FCM Token
     */
    requestPermission: async function() {
        try {
            if (!('Notification' in window) || !this.engine) return;
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const swUrl = window.location.pathname.includes('chs-communicate') ? '/chs-communicate/firebase-messaging-sw.js' : '/firebase-messaging-sw.js';
                const token = await getToken(this.engine, {
                    vapidKey: 'BBqn6yGqPA7P7vF0sgj5Bu1gcdPR092y4OD4ifLBWiBXe2D3G82PV907LKub__wQf245fw8yKZTxqRMN5V5Yn5w',
                    serviceWorkerRegistration: await navigator.serviceWorker.register(swUrl)
                });

                if (token && this.context.currentUser) {
                    // 使用 CloudDB 标准接口
                    await CloudDB.update(PATHS.userPrivate(this.context.currentUser.uid || this.context.currentUser.id), { fcmToken: token });
                    console.log('NotifyModule: FCM Token registered.');
                }
            }
        } catch (err) {
            console.error('NotifyModule: Permission error:', err);
        }
    },

    /**
     * [监听器] 前台消息监听
     */
    setupListeners: function() {
        if (!this.engine) return;
        onMessage(this.engine, (payload) => {
            console.log('NotifyModule: Foreground message received:', payload);
            if (payload.notification) {
                if (window.showCustomAlert) {
                    window.showCustomAlert(payload.notification.title, payload.notification.body);
                } else {
                    alert(`${payload.notification.title}\n${payload.notification.body}`);
                }
            }
        });
    },

    /**
     * [监控器] 全量监听聊天室消息变化
     */
    initMonitor: function() {
        const { currentUser, allUsers, globalListeners, appStartTime, settings } = this.context;
        if (!currentUser) return;

        Object.keys(allUsers).forEach(targetId => {
            if (targetId === currentUser.id || globalListeners.has(targetId)) return;
            
            const chatId = [currentUser.id.toLowerCase(), targetId.toLowerCase()].sort().join('_');
            
            // 使用 CloudDB 的原生引用接口进行监听
            import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js").then(sdk => {
                const q = sdk.query(sdk.ref(CloudDB._db(), PATHS.messages(chatId)), sdk.orderByKey(), sdk.limitToLast(1));
                
                sdk.onChildAdded(q, (snap) => {
                    const msg = snap.val();
                    const activeId = window.activeTargetId; 

                    if (msg && msg.senderId !== currentUser.id && msg.timestamp > appStartTime) {
                        if (!document.hidden && activeId === targetId) {
                            // 若当前正在该聊天室，直接标记为已读
                            CloudDB.update(`${PATHS.chats}/${currentUser.id}`, { [targetId]: CloudDB.serverTime() });
                        } else {
                            // 否则触发通知逻辑
                            if (settings?.soundEnabled && this.audio) {
                                this.audio.play().catch(() => { });
                            }
                            this.unreadSet.add(targetId);
                            const dot = document.getElementById(`dot-${targetId}`);
                            if (dot) dot.classList.remove('hidden');
                            this.updateUI();
                            
                            // 更新最后活动时间
                            CloudDB.update(`${PATHS.chats}/${currentUser.id}`, { [targetId]: CloudDB.serverTime() });
                        }
                    }
                });
            });
            globalListeners.add(targetId);
        });
    },

    /**
     * [标记已读] 清除特定聊天室的未读状态
     */
    markAsRead: function(targetId) {
        if (this.unreadSet.has(targetId)) {
            this.unreadSet.delete(targetId);
            const dot = document.getElementById(`dot-${targetId}`);
            if (dot) dot.classList.add('hidden');
            this.updateUI();
        }
    }
};
