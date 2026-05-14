/**
 * ==================================================================================
 * 模块名称：NotifyModule (业务逻辑精简版 v22)
 * 目标文件：js/notify.js
 * ==================================================================================
 */

import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { query, ref, limitToLast, orderByKey, onChildAdded, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { CloudDB, PATHS } from './db.js?v=4';

export const NotifyModule = {
    unreadSet: new Set(),
    engine: null, 
    audio: null,
    originalFavicon: '',
    
    context: {
        currentUser: null,
        allUsers: null,
        settings: null,
        appStartTime: Date.now(),
        globalListeners: new Set()
    },

    setEngine: function(engine) {
        this.engine = engine;
        if (this.engine) this.setupListeners();
    },

    init: function(deps) {
        const user = deps.currentUser || (window.AppModules?.User?.current);
        if (user) user.id = user.id || user.uid; 

        this.context.currentUser = user;
        this.context.allUsers = deps.allUsers || {};
        this.context.settings = deps.settings || {};
        this.context.globalListeners = deps.globalListeners || new Set();
        this.context.appStartTime = deps.appStartTime || Date.now();

        this.originalFavicon = document.querySelector('link[rel="icon"]')?.href || '';
        
        // 1. 初始化音频对象
        this.audio = new Audio();
        
        // 2. 提前预加载 (如果已有设置)
        if (this.context.settings?.soundUrl) {
            this.setSound(this.context.settings.soundUrl);
        }

        // 3. 标签页切换监听
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.activeTargetId) {
                this.markAsRead(window.activeTargetId);
            }
        });

        this.updateUI();
    },

    /**
     * [提前上膛] 显式设置并预加载音效，避免第一声不响的问题
     */
    setSound: function(url) {
        if (!url || !this.audio) return;
        if (this.audio.src !== url && !this.audio.src.includes(url)) {
            console.log(`DEBUG [Notify]: 音效预加载 -> ${url}`);
            this.audio.src = url;
            this.audio.load(); 
        }
    },

    updateUI: function() {
        try {
            const unreadCount = this.unreadSet.size;
            const mainDot = document.getElementById('mainUnreadDot');
            const recentDot = document.getElementById('recentTabDot');
            
            if (unreadCount > 0) {
                if (mainDot) mainDot.classList.remove('hidden');
                if (recentDot) recentDot.classList.remove('hidden');
                document.title = `(${unreadCount}) CHS Chat & Social`;
            } else {
                if (mainDot) mainDot.classList.add('hidden');
                if (recentDot) recentDot.classList.add('hidden');
                document.title = `CHS Chat & Social`;
            }

            this.updateFavicon(unreadCount > 0);
        } catch (e) {
            console.error('NotifyModule: updateUI failed', e);
        }
    },

    updateFavicon: function(isUnread) {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        if (!isUnread) link.href = this.originalFavicon;
    },

    initMonitor: function() {
        if (!this.context.currentUser && window.AppModules?.User?.current) {
            this.context.currentUser = window.AppModules.User.current;
        }
        const user = this.context.currentUser;
        if (!user || !user.id) return;

        if (this._scanTimer) clearInterval(this._scanTimer);
        this._scanTimer = setInterval(() => {
            const { allUsers } = this.context;
            const sidebarClasses = window.sidebarClasses || {};

            Object.keys(allUsers).forEach(targetId => {
                this._startChatListener(targetId);
            });

            Object.keys(sidebarClasses).forEach(classId => {
                this._startChatListener(`group_${classId}`);
            });
        }, 2000); 

        this.syncGroupListeners();
    },

    syncGroupListeners: function() {
        const classes = window.sidebarClasses || {};
        const classIds = Object.keys(classes);
        if (classIds.length === 0) return;
        classIds.forEach(classId => {
            this._startChatListener(`group_${classId}`);
        });
    },

    _startChatListener: function(targetId) {
        const { currentUser, globalListeners, appStartTime } = this.context;
        if (!targetId || !currentUser?.id) return;
        if (targetId === currentUser.id || globalListeners.has(targetId)) return;

        try {
            const chatId = targetId.startsWith('group_') ? targetId : [currentUser.id.toLowerCase(), targetId.toLowerCase()].sort().join('_');
            const dbRef = CloudDB._db();
            if (!dbRef) return;

            const msgPath = PATHS.messages(chatId);
            const q = query(ref(dbRef, msgPath), orderByKey(), limitToLast(1));
            
            onChildAdded(q, (snap) => {
                const msg = snap.val();
                if (!msg) return;

                const liveSettings = this.context.settings || {};
                const activeId = window.activeTargetId;
                const msgTime = msg?.timestamp || 0;

                if (msg.senderId === currentUser.id) return;
                if (msgTime <= (appStartTime - 5000)) return;

                const isLookingAtIt = !document.hidden && activeId === targetId;

                if (isLookingAtIt) {
                    if (!targetId.startsWith('group_')) {
                        const path = `user_chats/${currentUser.id.toLowerCase()}`;
                        update(ref(dbRef, path), { [targetId]: serverTimestamp() });
                    }
                    this.unreadSet.delete(targetId);
                } else {
                    if (liveSettings.soundEnabled && this.audio) {
                        this.audio.volume = 1.0;
                        this.audio.play().catch(e => {
                            console.warn(`DEBUG [Notify]: Audio play failed (possibly blocked by browser):`, e.message);
                        });
                    }
                    
                    this.unreadSet.add(targetId);
                    const dot = document.getElementById(`dot-${targetId}`);
                    if (dot) dot.classList.remove('hidden');
                }
                
                this.updateUI();
            });

            globalListeners.add(targetId);
        } catch (err) {
            console.error(`DEBUG [Notify]: Error attaching listener:`, err);
        }
    },

    markAsRead: function(targetId) {
        if (this.unreadSet.has(targetId)) {
            this.unreadSet.delete(targetId);
            const dot = document.getElementById(`dot-${targetId}`);
            if (dot) dot.classList.add('hidden');
            this.updateUI();
        }
    },

    requestPermission: async function() {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            await Notification.requestPermission();
        }
    }
};
