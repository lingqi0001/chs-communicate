/**
 * js/notify.js
 * 通知系统 1.0 (Notification Module)
 * [职责] 处理 PWA 推送 (FCM)、未读消息红点、Favicon 徽章及提示音。
 * [依赖] 仅依赖 db.js?v=2 导出的标准接口，不直接操作数据库 SDK。
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
