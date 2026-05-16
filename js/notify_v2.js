/**
 * ==================================================================================
 * Module: NotifyModule (Real-time Notifications)
 * Path: js/notify.js
 * ==================================================================================
 */

import { onValue, ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db, auth, CloudDB, PATHS } from './db.js';

export const NotifyModule = {
    version: '2026-05-16-v25',
    unreadCount: 0,
    unreadSet: new Set(),
    context: {
        db: null,
        currentUser: null,
        allUsers: {},
        settings: {},
        globalListeners: new Set(),
        appStartTime: Date.now()
    },
    audio: null,
    _scanInterval: null,

    /**
     * [初始化] 注入依赖上下文
     */
    init(ctx) {
        this.context = { ...this.context, ...ctx };
        console.log('DEBUG [Notify]: Context initialized.', this.context);
    },

    /**
     * [设置声音] 预加载音频文件
     */
    setSound(url) {
        if (!url) return;
        try {
            this.audio = new Audio(url);
            this.audio.volume = 0.5;
            this.audio.load(); // 预加载，解决首次播放延迟
            console.log('DEBUG [Notify]: Sound engine ready ->', url);
        } catch (e) {
            console.warn('DEBUG [Notify]: Failed to init audio engine:', e);
        }
    },

    /**
     * [监控器] 启动全局通知监听
     */
    async initMonitor() {
        // 自动补全 currentUser
        if (!this.context.currentUser && auth.currentUser) {
            this.context.currentUser = {
                id: auth.currentUser.email.split('@')[0].replace(/\./g, '_'),
                email: auth.currentUser.email
            };
        }

        const user = this.context.currentUser;
        if (!user) {
            console.warn('DEBUG [Notify]: No user found, skipping monitor init.');
            return;
        }

        const uid = user.id || user.email.split('@')[0].replace(/\./g, '_');

        // 1. 监听全局未读通知计数
        onValue(ref(db, `user_notifications/${uid}`), (snapshot) => {
            const data = snapshot.val() || {};
            this.unreadSet.clear();
            for (const key in data) {
                if (data[key] === true) this.unreadSet.add(key);
            }
            this.unreadCount = this.unreadSet.size;
            this.updateUI();
            
            // 兼容性：如果侧边栏已经渲染，可能需要刷新红点
            if (window.renderSidebar) {
                // 这里通常不直接调用 renderSidebar 避免性能问题，
                // 而是通过 DOM ID 直接操作。triggerAlert 已经处理了动态到达的消息。
            }
        });

        // 2. 启动动态“巡逻兵”，发现新聊天即挂载监听
        this._startScanning();
    },

    /**
     * [巡逻兵] 每隔几秒扫描一次列表，确保新加入的群聊也能被监听到
     */
    _startScanning() {
        if (this._scanInterval) clearInterval(this._scanInterval);
        this._scanInterval = setInterval(() => {
            // A. 扫描所有已知用户 (私聊)
            const users = this.context.allUsers || window.ALL_USERS || {};
            Object.keys(users).forEach(uid => this._startChatListener(uid));

            // B. 扫描侧边栏班级 (群聊)
            const groups = window.sidebarClasses || {};
            Object.keys(groups).forEach(gid => this._startChatListener(`group_${gid}`));
        }, 2000);
    },

    /**
     * [监听器] 为特定聊天目标挂载实时监听
     */
    _startChatListener(targetId) {
        if (!targetId) return;
        const { globalListeners, appStartTime } = this.context;

        // 防止重复挂载
        if (globalListeners.has(targetId)) return;
        
        // 检查是否是自己（私聊中不需要监听自己）
        if (this.context.currentUser && targetId === this.context.currentUser.id) return;

        globalListeners.add(targetId);

        // 构造 Firebase 路径
        // 群聊: messages/group_xxx
        // 私聊: messages/uid1_uid2
        let path = '';
        if (targetId.startsWith('group_')) {
            path = `messages/${targetId}`;
        } else {
            const myUid = this.context.currentUser.id;
            const chatId = [myUid, targetId].sort().join('_');
            path = `messages/${chatId}`;
        }

        console.log(`DEBUG [Notify]: [流程1] 正在挂载监听器 -> 目标: ${targetId}, 路径: ${path}`);

        // 挂载监听
        onValue(ref(db, path), (snapshot) => {
            const messages = snapshot.val() || {};
            const messageKeys = Object.keys(messages);
            if (messageKeys.length === 0) return;

            // 获取最新一条消息
            const lastKey = messageKeys[messageKeys.length - 1];
            const msg = messages[lastKey];

            // 过滤逻辑
            // 1. 必须是应用启动后发出的消息
            if (msg.timestamp < appStartTime) return;
            // 2. 不能是自己发的消息
            if (msg.senderId === this.context.currentUser.id) return;

            console.log(`DEBUG [Notify]: [流程2] 收到新消息! -> 来源: ${targetId}`);

            // 只有当用户不在该聊天窗口且页面不可见/非当前房间时，才触发提示
            if (window.activeTargetId !== targetId) {
                this.triggerAlert(targetId, msg);
                
                // 核心：同步更新 user_notifications 触发全局红点
                if (this.context.currentUser) {
                    const uid = this.context.currentUser.id;
                    update(ref(db, `user_notifications/${uid}`), { [targetId]: true });
                }
            }
        });
    },

    /**
     * [提醒] 执行声音播放和红点点亮
     */
    triggerAlert(targetId, msg) {
        // 1. 播放声音
        if (this.audio) {
            this.audio.play().catch(e => console.warn('Audio play failed:', e));
        }

        // 2. 点亮对应侧边栏红点 (如果 DOM 存在)
        const dotId = targetId.startsWith('group_') ? `dot_${targetId.replace('group_', '')}` : `dot_${targetId}`;
        const dot = document.getElementById(dotId);
        if (dot) {
            dot.classList.remove('hidden');
        }

        // 3. 全局红点提示 (如果需要)
        const mainDot = document.getElementById('mainUnreadDot');
        if (mainDot) mainDot.classList.remove('hidden');

        console.log(`DEBUG [Notify]: [流程3] 提示已触发 -> ${targetId}`);
    },

    /**
     * [标记已读] 清除红点并同步到云端
     */
    markAsRead(targetId) {
        if (!targetId) return;
        this.unreadSet.delete(targetId);
        
        // 1. 更新 UI 红点
        const dotId = targetId.startsWith('group_') ? `dot_${targetId.replace('group_', '')}` : `dot_${targetId}`;
        const dot = document.getElementById(dotId);
        if (dot) dot.classList.add('hidden');

        // 2. 检查全局红点是否该消失
        if (this.unreadSet.size === 0) {
            const mainDot = document.getElementById('mainUnreadDot');
            if (mainDot) mainDot.classList.add('hidden');
        }

        // 3. 同步到 Firebase (触发其他端同步)
        if (this.context.currentUser) {
            const uid = this.context.currentUser.id;
            update(ref(db, `user_notifications/${uid}`), { [targetId]: false });
        }
        
        this.unreadCount = this.unreadSet.size;
        this.updateUI();
    },

    /**
     * [UI更新] 更新全局未读总数显示
     */
    updateUI() {
        const badge = document.getElementById('globalUnreadBadge');
        if (!badge) return;

        if (this.unreadCount > 0) {
            badge.innerText = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    /**
     * [权限] 请求浏览器通知权限
     */
    async requestPermission() {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
};