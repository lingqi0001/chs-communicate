/**
 * ==================================================================================
 * Module: NotifyModule (Real-time Notifications)
 * Path: js/notify_v2.js
 * Version: 2026-05-16-v30 (Premium UX Edition)
 * ==================================================================================
 */

import { onValue, ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { db, auth, CloudDB, PATHS } from './db.js';

export const NotifyModule = {
    version: '2026-05-16-v30',
    unreadCount: 0,
    unreadSet: new Set(),
    context: {
        db: null,
        currentUser: null,
        allUsers: {},
        settings: {},
        appStartTime: Date.now()
    },
    audio: null,
    
    EAGLE_SVG: `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><polygon fill="white" points="12.6,121.7 75.6,96.1 74.1,90.8 127.5,79.2 130.2,76.3 140.4,75.3 164.3,75.7 192.3,81.8 212.9,81.8 215.1,87.3 246.7,95.8 251.7,112.8 245.5,125.3 235.5,130.4 233.5,128.5 233.9,112.7 218.4,114.3 204.7,120.5 206.6,125.3 220.7,152.5 208.3,152.5 178.9,137.5 170.9,136.1 156.2,141.7 147,152.1 148,168.7 88.4,174.1 35.2,145.8 33.3,138.1" /><path fill="#ED2129" d="M243.8,97.1c-14.5-6.1-17.4-4.7-32.5-4.8c-2.4,1.8-2.4,3.2-4.8,4.2l-6.6,3.1c-2.5,6.3-5,19.9-15.5,24.5 l-10.9,5.1c11.2,10.6,32.1,25.6,45.4,21.2l-4.1-8.2l-11.3-16.5l0.9-0.8l-3.1,3.4c0.7,2,0.4,2.4,1.2,3.5l11.4,14.2 c-10.4,0.4-20-7.2-28.3-15.1c1.9-3.5,4.6-6.3,9.2-9.3l3.8-2.5c10.7-7,31.6-13.2,37.6-4l1.5,2.3c1.8,2.8-0.2,8.5-2.9,10.6l1,1.5 l6.8-4.5C251.2,119.4,249.7,106.5,243.8,97.1L243.8,97.1z M76.6,92.4l0.5,0.8l15.6,0.2l-13.4,4.8c-6.2-0.8-47.9,18.3-57.7,24.8 c8.3,4.6,16.1,10.5,25.4,10.6c21.9-14.4,41.5-20,61.5-27.3l8-1.5l-15.6,6.4c-12.3,0.2-45.5,26.5-58.6,35.1 c4.8,4.6,21.4,8.2,27.7,9.1l18-15.5l3.3-1.7c16.7-11,30.4-10.8,44-15.8l10.5-1l-14.5,4.8l-29.2,11.6l-1.2,1.7 c-12.6,8.2-15.3,15.9-22.6,23.5c4,5.1,27.6,9.5,34,7.1c-0.8-8.4,5.4-17.6,14.8-23.8l6.1-4c13.2-8.7,25.5-10.2,36.9-10l-5.3-3.1 l-5.6-1.6c7.3-2.6,11.8-0.3,21.8-6.9l4.6-3c3.7-2.4,5.5-5.5,6.4-8.5l-10.4,5.9l-0.5-0.9l8.4-5.5l-0.9-8.1c-3.8-1.1-1.3,1.9-4.1,3.8 l-0.8,0.5c-2.5,1.6-1-0.3-4.8,1l-2.6-2.7l-0.2-1.9l2.1-1.5l-3-1.3c-0.4,1.3-1.5,4.3-0.6,5.8c1.5,2.3,4.5,2.5,6.5,3.3l1.8,0.9 l1.5-0.9l2.3-1.5c-0.6,2-0.3,2.4-2.8,4c-3.8,2.5-10.3,1-13.6-0.9c-2.8-1.3-6.7-4.5-10-5.6c-3.4-1.2-8.9-0.3-11.4-2.2l10.4-2.3 c-4.6-6.7-10.8-2.9-15.6-7.2l-16.1,2c5-3.3,16.9-3.8,22.6-4.4c9.4-1.1,14,1.5,21.3,1.6l-4.6-3.4c4.8-0.1,10.4,5.6,18.3,7.2 c4.5,1,14.9,0.3,19.9-4.1l6.2-5.4l-0.8-1.3c-16.9,6.2-55.7-15.2-80.2-6.2l0.5,0.8l2.5,0.5l3.8,1.2l-3.3-0.4L76.6,92.4L76.6,92.4z M213.5,100.6l-2.3,1.5c-3.3,2.2-3.1,0.3-7.1,2.5c0.5-1.7,1.1-4,3.1-5.3C208.5,98.4,212.2,99.4,213.5,100.6L213.5,100.6z M160,136.7c-3.7-0.5-8.4,1.1-12.6,3.9l-7.6,5c-6,3.9-12,11.6-12.1,16.6l-0.1,1.1l15.4,1.8l0.1-0.9 C135.9,152.7,148.3,144.4,160,136.7L160,136.7z M185,101.9l-1-1.5l-1.5,1l1,1.5L185,101.9L185,101.9z M162.5,74.2 c7.9,0.1,19.7,3.1,27.9,4.8c7,1.5,26.3,0.8,28.6,1.7l-2,5c1.9,1.8,28.5,4.1,31.9,9.2l1.5,2.3c7,10.6,4.4,24.3-5.8,31l-0.8,0.5 c-4.3,2.8-9,2.7-12.6,3.9l-1-1.5c3-2.3,4.2-6.9,2.1-10.1c-3.7-5.6-16.4-3.4-21.7,0.1c-1.8,1.2-2.9,5.5-2.1,6.8 c3.6,5.5,7,8.6,9.8,13.2c3.4,5.7,2.5,9.9,4.4,13.4c-9.1,3.3-35.4-6.1-42.8-15.5c-5.8,2.1-11.3-2.4-22,4.6l-0.8,0.5 c-4.5,2.9-7.6,10-4.4,14.8l2.5,3.8c1.5,2.3,5.8,4.9,3.2,6.6c-13.5,8.8-28,2.6-33.1,4.3l1.5,4.4c-7.2,4.6-12.6,2.4-19.5,3.1 c-7.7-0.2-45.7-7-49.8-13l5.5-4.9c-9-3.8-33.9-7.3-42.2-14.6l11.4-7.5l-31.4-18l0.5-1.3l48.8-18.7l22.4-6.8L59.8,94l-0.1-1.3 l59.6-13.1l-3.9-2.9l-0.1-0.9L162.5,74.2L162.5,74.2z" /></svg>`,

    /**
     * [初始化]
     */
    init(ctx) {
        this.context = { ...this.context, ...ctx };
        if ('Notification' in window) {
            this._lastPermissionState = Notification.permission;
        }
        this._initFocusListeners();
    },

    setSound(url) {
        if (!url) return;
        try {
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
            }
            this.audio = new Audio(url);
            this.audio.preload = 'auto';
            this.audio.volume = 0.5;
            this.audio.load(); 
        } catch (e) {
            console.warn('[Notify] Failed to init audio engine:', e);
        }
    },

    /**
     * [焦点管理] 监听用户是否正在查看网页
     */
    _initFocusListeners() {
        // 当用户回到网页时，自动清除当前活跃聊天室的红点
        const onBack = () => {
            if (window.activeTargetId) {
                this.markAsRead(window.activeTargetId);
            }
            this.syncPermissionState();
        };

        window.addEventListener('focus', onBack);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') onBack();
        });
        document.addEventListener('mousedown', onBack); // 只要点了页面任何地方也算回来
    },

    async syncPermissionState() {
        if (!('Notification' in window)) return;
        const currentPermission = Notification.permission;
        
        // If permission was granted, and app setting is NOT explicitly disabled ('false'), auto-enable it
        if (currentPermission === 'granted') {
            if (localStorage.getItem('pushNotificationsEnabled') !== 'false' && localStorage.getItem('pushNotificationsEnabled') !== 'true') {
                localStorage.setItem('pushNotificationsEnabled', 'true');
                console.log('[Notify] Notification permission granted by OS. Auto-enabling push settings.');
            }
        }
        
        // If permission state has changed, sync it
        if (this._lastPermissionState !== currentPermission) {
            console.log(`[Notify] Permission state changed from ${this._lastPermissionState} to ${currentPermission}. Syncing...`);
            this._lastPermissionState = currentPermission;
            if (currentPermission === 'granted') {
                await this.registerFCMToken();
            } else {
                await this.syncDeviceState();
            }
        }
    },

    /**
     * [监控器]
     */
    async initMonitor() {
        if (!this.context.currentUser && auth.currentUser) {
            this.context.currentUser = {
                id: auth.currentUser.email.split('@')[0].replace(/\./g, '_'),
                email: auth.currentUser.email
            };
        }

        const user = this.context.currentUser;
        if (!user) return;

        // Reset device registration flag on startup to prevent infinite logout loops during authentication redirects
        window.deviceRegistered = false;

        const uid = (user.id || user.email.split('@')[0].replace(/\./g, '_')).toLowerCase();

        // Remote logout check
        if (!window.getOrCreateDeviceId) {
            window.getOrCreateDeviceId = () => {
                let deviceId = localStorage.getItem('deviceId');
                if (!deviceId) {
                    deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
                    localStorage.setItem('deviceId', deviceId);
                }
                return deviceId;
            };
        }

        this.registerFCMToken();

        const deviceId = window.getOrCreateDeviceId();
        onValue(ref(db, `users/${uid}/devices/${deviceId}`), (snapshot) => {
            const data = snapshot.val();
            if (window.deviceRegistered && !data) {
                console.log('[Notify] Current device removed from DB. Logging out...');
                if (window.handleSignOut) {
                    window.handleSignOut();
                }
            }
        });

        onValue(ref(db, `user_notifications/${uid}`), (snapshot) => {
            const data = snapshot.val() || {};
            this.unreadSet.clear();
            for (const key in data) {
                if (data[key] === true) this.unreadSet.add(key);
            }
            this.unreadCount = this.unreadSet.size;
            this.updateUI();
            this._syncAllDots();
        });
    },

    _syncAllDots() {
        const dots = document.querySelectorAll('[id^="dot-"]');
        dots.forEach(dot => {
            const id = dot.id.replace('dot-', '');
            if (this.unreadSet.has(id)) {
                dot.classList.remove('hidden');
            } else {
                if (window.activeTargetId !== id) dot.classList.add('hidden');
            }
        });

        const mainDot = document.getElementById('mainUnreadDot');
        if (mainDot) {
            if (this.unreadCount > 0) mainDot.classList.remove('hidden');
            else mainDot.classList.add('hidden');
        }
    },

    triggerAlert(targetId, msg) {
        const SETTINGS = window.SETTINGS || {};
        // Lazy init to avoid "first extension alert has no sound" during startup race.
        if (!this.audio && SETTINGS.soundEnabled !== false && SETTINGS.soundUrl) {
            this.setSound(SETTINGS.soundUrl);
        }

        const webPushEnabled = (localStorage.getItem('pushNotificationsEnabled') === 'true') && 
                               ('Notification' in window) && (Notification.permission === 'granted');
        const isActivelyOnSite = document.visibilityState === 'visible' && document.hasFocus();
        
        let playSound = true;
        if (webPushEnabled && !isActivelyOnSite) {
            playSound = false;
        }

        if (this.audio && playSound) {
            this.audio.play().catch(e => console.warn('[Notify] Audio play failed:', e));
        }

        const dot = document.getElementById(`dot-${targetId}`);
        if (dot) dot.classList.remove('hidden');

        const mainDot = document.getElementById('mainUnreadDot');
        if (mainDot) mainDot.classList.remove('hidden');
        
        // Trigger Browser Desktop/System Notification (only if the tab is currently visible/active, to avoid double-notifying with FCM Service Worker)
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'hidden') {
            try {
                let notificationBody = msg.text || '';
                if (msg.type === 'image_group') {
                    try {
                        const urls = JSON.parse(msg.text);
                        notificationBody = `[Image] sent ${urls.length} images`;
                    } catch (e) {
                        notificationBody = '[Image]';
                    }
                }
                
                const notification = new Notification(msg.senderName || 'New Message', {
                    body: notificationBody,
                    icon: 'resources/favicon.svg'
                });
                
                notification.onclick = () => {
                    window.focus();
                    if (window.switchChat) {
                        window.switchChat(targetId);
                    }
                };
            } catch (e) {
                console.warn('[Notify] Failed to show system notification:', e);
            }
        }

        this.updateUI();
    },

    markAsRead(targetId) {
        if (!targetId) return;
        this.unreadSet.delete(targetId);
        
        const dot = document.getElementById(`dot-${targetId}`);
        if (dot) dot.classList.add('hidden');

        if (this.context.currentUser) {
            const uid = String(this.context.currentUser.id || '').toLowerCase();
            update(ref(db, `user_notifications/${uid}`), { [targetId]: false });
        }
        
        this.unreadCount = this.unreadSet.size;
        this.updateUI();
    },

    updateUI() {
        const originalTitle = "CHS Chat & Tools";
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${originalTitle}`;
            this._setFaviconDot(true);
        } else {
            document.title = originalTitle;
            this._setFaviconDot(false);
        }

        const mainDot = document.getElementById('mainUnreadDot');
        if (mainDot) {
            if (this.unreadCount > 0) mainDot.classList.remove('hidden');
            else mainDot.classList.add('hidden');
        }
    },

    /**
     * [高级 Favicon 合成]
     */
    _setFaviconDot(show) {
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) return;

        if (!show) {
            favicon.href = 'resources/favicon.svg';
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(img, 4, 4, 56, 56); 

            ctx.beginPath();
            ctx.arc(50, 50, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();

            const msgColor = localStorage.getItem('msgAccentColor') || 'blue';
            const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
            let dotColor = '#007AFF';
            if (msgColor === 'orange') {
                dotColor = isDark ? '#FB923C' : '#F97316';
            } else if (msgColor === 'blue') {
                dotColor = isDark ? '#0A84FF' : '#007AFF';
            } else if (msgColor === 'green') {
                dotColor = isDark ? '#95FF14' : '#34C759';
            } else if (msgColor === 'purple') {
                dotColor = isDark ? '#A724FF' : '#AF52DE';
            } else if (msgColor === 'custom') {
                const customLightHex = localStorage.getItem('msgCustomColorLightHex') || '#007AFF';
                const customDarkHex = localStorage.getItem('msgCustomColorDarkHex') || '#0A84FF';
                dotColor = isDark ? customDarkHex : customLightHex;
            }

            ctx.beginPath();
            ctx.arc(50, 50, 8.5, 0, Math.PI * 2);
            ctx.fillStyle = dotColor; 
            ctx.fill();

            favicon.href = canvas.toDataURL('image/png');
        };
        
        const svgBlob = new Blob([this.EAGLE_SVG], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => { URL.revokeObjectURL(url); };
        img.src = url;
    },

    _isShowingPrompt: false,

    showIosInstallGuideModal() {
        if (this._isShowingPrompt) return Promise.resolve(false);
        this._isShowingPrompt = true;

        return new Promise((resolve) => {
            const existing = document.getElementById('iosInstallGuideModal');
            if (existing) {
                existing.remove();
            }

            const hostName = window.location.hostname || 'chs-communicate.com';

            // Invert the SVG fills to show a red eagle with white details on the white background container
            // Also inject class="w-10 h-10" to prevent the SVG from collapsing to 0x0 size in flexbox container
            const logoSvg = (NotifyModule.EAGLE_SVG || '')
                .replace('<svg', '<svg class="w-10 h-10"')
                .replace('fill="white"', 'fill="TEMP_COLOR"')
                .replace('fill="#ED2129"', 'fill="white"')
                .replace('fill="TEMP_COLOR"', 'fill="#ED2129"');

            const modalHtml = `
                <div id="iosInstallGuideModal" class="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-md px-6 opacity-0 transition-opacity duration-300 pointer-events-none">
                    <div class="bg-zinc-900/95 text-white w-full max-w-[340px] rounded-[24px] p-6 shadow-2xl scale-95 transition-transform duration-300 border border-white/10 relative">
                        <!-- Close Button -->
                        <button id="iosObClose" class="absolute top-4 right-4 text-white/40 hover:text-white text-2xl outline-none focus:outline-none transition-colors">&times;</button>
                        
                        <!-- Title -->
                        <h3 class="text-sm font-bold text-white/95 mb-4 text-left leading-snug">Install the app to get notifications</h3>
                        
                        <!-- App Card -->
                        <div class="bg-zinc-800/80 rounded-2xl p-4 flex items-center gap-3.5 mb-5 border border-white/5">
                            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-md shrink-0">
                                ${logoSvg || '<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><polygon fill="red" points="12.6,121.7 75.6,96.1..." /></svg>'}
                            </div>
                            <div class="overflow-hidden">
                                <h4 class="font-bold text-white text-sm truncate">CHS Communicate</h4>
                                <p class="text-[11px] text-white/40 truncate">${hostName}</p>
                            </div>
                        </div>
                        
                        <!-- Steps for iOS installation -->
                        <div class="space-y-4 mb-6 text-sm text-left">
                            <div class="flex items-center gap-2">
                                <span class="text-[#007AFF] font-bold text-sm shrink-0">1.</span>
                                <p class="flex-1 text-xs text-white/80 leading-snug">
                                    Press <span class="inline-flex items-center justify-center bg-zinc-800 border border-white/10 w-6 h-6 rounded-full align-middle mx-1"><svg class="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></span> to open the browser menu
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[#007AFF] font-bold text-sm shrink-0">2.</span>
                                <p class="flex-1 text-xs text-white/80 leading-snug">
                                    Tap <span class="inline-flex items-center gap-1 bg-zinc-800 border border-white/10 px-2 py-0.5 rounded-md text-[10px] align-middle mx-1 text-white/90 font-medium"><svg class="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>Share</span> and then <span class="inline-flex items-center gap-1 bg-zinc-800 border border-white/10 px-2 py-0.5 rounded-md text-[10px] align-middle mx-1 text-white/90 font-medium"><svg class="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>View more</span>
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[#007AFF] font-bold text-sm shrink-0">3.</span>
                                <p class="flex-1 text-xs text-white/80 leading-snug">
                                    Select <span class="inline-flex items-center gap-1 bg-zinc-800 border border-white/10 px-2 py-0.5 rounded-md text-[10px] align-middle mx-1 text-white/90 font-medium"><svg class="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Add to Home Screen</span>
                                </p>
                            </div>
                        </div>
                        
                        <!-- Action Button -->
                        <div class="space-y-2.5">
                            <button id="iosObDone" class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all font-semibold text-xs text-white/90">Got it</button>
                            <button id="iosObDismiss" class="w-full text-center text-[10px] text-white/40 hover:text-white/60 transition-colors bg-transparent border-0 cursor-pointer">Don't show again</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('iosInstallGuideModal');
            const inner = modal.querySelector('div');
            const closeBtn = document.getElementById('iosObClose');
            const doneBtn = document.getElementById('iosObDone');
            const dismissBtn = document.getElementById('iosObDismiss');

            // Force reflow and show
            void modal.offsetHeight;
            modal.classList.remove('pointer-events-none');
            modal.classList.add('opacity-100');
            inner.classList.remove('scale-95');
            inner.classList.add('scale-100');

            const closeModal = () => {
                modal.classList.remove('opacity-100');
                modal.classList.add('opacity-0');
                inner.classList.remove('scale-100');
                inner.classList.add('scale-95');
                modal.classList.add('pointer-events-none');
                
                setTimeout(() => {
                    modal.remove();
                    this._isShowingPrompt = false;
                    resolve(false);
                }, 300);
            };

            closeBtn.onclick = closeModal;
            doneBtn.onclick = closeModal;
            dismissBtn.onclick = () => {
                localStorage.setItem('notification_prompt_dismissed', 'true');
                closeModal();
            };
        });
    },

    async requestPermission(isManual = false) {
        // iOS detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

        // Force simulation for test account moss932888
        const currentUser = this.context.currentUser;
        const currentUserId = currentUser?.id ? String(currentUser.id).toLowerCase() : '';
        const authUser = auth?.currentUser;
        const authUserId = authUser ? authUser.email.split('@')[0].replace(/\./g, '_').toLowerCase() : '';
        const isTestUser = currentUserId === 'moss932888' || authUserId === 'moss932888';

        if (((isIOS || isTestUser) && !isStandalone)) {
            // If user previously dismissed, don't auto-prompt
            if (!isManual && localStorage.getItem('notification_prompt_dismissed') === 'true') {
                return false;
            }
            await this.showIosInstallGuideModal();
            return false;
        }

        if (!('Notification' in window)) return false;

        // If already granted, return true
        if (Notification.permission === 'granted') return true;

        // If already denied, guide them to browser/system settings when manually requested
        if (Notification.permission === 'denied') {
            if (isManual) {
                window.AppModules.Modal.alert("Blocked by System", "Settings notification has been disabled. Notifications are blocked by your device settings. Please go to: <br><b class='text-[#007AFF]'>Settings ➔ Apps ➔ CHSchat ➔ Allow Notifications</b> to enable them.");
            }
            return false;
        }

        // If they previously dismissed the notification prompt, do not auto-prompt.
        if (!isManual && localStorage.getItem('notification_prompt_dismissed') === 'true') {
            return false;
        }

        // Trigger the native browser permission dialog directly
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        if (!granted) {
            if (!isManual) {
                localStorage.setItem('notification_prompt_dismissed', 'true');
            } else if (permission === 'denied') {
                window.AppModules.Modal.alert("Blocked by System", "Settings notification has been disabled. Notifications are blocked by your device settings. Please go to: <br><b class='text-[#007AFF]'>Settings ➔ Apps ➔ CHSchat ➔ Allow Notifications</b> to enable them.");
            }
        }
        return granted;
    },

    async registerFCMToken() {
        if (!this.engine) {
            console.log('[Notify] FCM engine not initialized yet.');
            await this.syncDeviceState();
            return;
        }

        const hasPermission = ('Notification' in window) && Notification.permission === 'granted';
        const isPermissionDenied = ('Notification' in window) && Notification.permission === 'denied';

        // Flow 2: If system allowed (granted), and app setting not explicitly disabled ('false'),
        // then auto-enable app setting (hook it up).
        if (hasPermission && localStorage.getItem('pushNotificationsEnabled') !== 'false') {
            localStorage.setItem('pushNotificationsEnabled', 'true');
        }

        // Flow 1: If app setting enabled ('true') but system blocked (denied),
        // alert the user to guide them to Settings.
        if (localStorage.getItem('pushNotificationsEnabled') === 'true' && isPermissionDenied) {
            if (!sessionStorage.getItem('blocked_alert_shown')) {
                sessionStorage.setItem('blocked_alert_shown', 'true');
                window.AppModules.Modal.alert("Blocked by System", "Settings notification has been disabled. Notifications are blocked by your device settings. Please go to: <br><b class='text-[#007AFF]'>Settings ➔ Apps ➔ CHSchat ➔ Allow Notifications</b> to enable them.");
            }
        }
        
        // Check if user has disabled notifications in settings
        const pushEnabled = localStorage.getItem('pushNotificationsEnabled') !== 'false';
        if (!pushEnabled) {
            console.log('[Notify] Web push notifications are disabled in local settings.');
            await this.syncDeviceState();
            return;
        }

        try {
            if (!('Notification' in window)) {
                console.log('[Notify] Notifications not supported in this environment.');
                await this.syncDeviceState();
                return;
            }
            if (Notification.permission !== 'granted') {
                const granted = await this.requestPermission();
                if (!granted) {
                    console.log('[Notify] Notification permission not granted.');
                    await this.syncDeviceState();
                    return;
                }
            }

            const token = await this.getCurrentToken();
            if (token) {
                console.log('[Notify] Got FCM Token:', token);
                await this.syncDeviceState(token);
            } else {
                console.warn('[Notify] No FCM token received.');
                await this.syncDeviceState();
            }
        } catch (error) {
            console.error('[Notify] Error registering FCM Token:', error);
            await this.syncDeviceState();
        }
    },

    async getCurrentToken() {
        if (!this.engine) return null;
        try {
            const vapidKey = 'BBqn6yGqPA7P7vF0sgj5Bu1gcdPR092y4OD4ifLBWiBXe2D3G82PV907LKub__wQf245fw8yKZTxqRMN5V5Yn5w';
            let registration = window.fcmRegistration;
            if (!registration && 'serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
                if (!registration) {
                    registration = await navigator.serviceWorker.ready;
                }
            }
            return await getToken(this.engine, { 
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });
        } catch (e) {
            console.warn('[Notify] Error getting current token:', e);
            return null;
        }
    },

    async syncDeviceState(fcmToken = null) {
        if (!this.context.currentUser) return;
        const uid = String(this.context.currentUser.id || '').toLowerCase();
        
        const deviceId = window.getOrCreateDeviceId();
        
        // Detect OS, Device Type, and Browser
        const ua = navigator.userAgent;
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const currentWidth = window.screen.width;
        
        let deviceType = "Computer";
        let os = "Unknown OS";
        
        if (ua.indexOf("iPhone") !== -1) {
            os = "iOS";
            deviceType = "iPhone";
        } else if (ua.indexOf("iPad") !== -1) {
            os = "iPadOS";
            deviceType = "iPad";
        } else if (ua.indexOf("Android") !== -1) {
            os = "Android";
            deviceType = currentWidth >= 800 ? "Tablet" : "Phone";
        } else if (ua.indexOf("Win") !== -1) {
            os = "Windows";
            deviceType = "Computer";
        } else if (ua.indexOf("Mac") !== -1) {
            if (isTouch) {
                os = "iPadOS";
                deviceType = "iPad";
            } else {
                os = "macOS";
                deviceType = "Computer";
            }
        } else if (ua.indexOf("Linux") !== -1) {
            os = "Linux";
            deviceType = "Computer";
        }
        
        let browser = "Unknown Browser";
        if (ua.indexOf("MicroMessenger") !== -1) browser = "WeChat";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("SamsungBrowser") !== -1) browser = "Samsung Browser";
        else if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) browser = "Opera";
        else if (ua.indexOf("Edge") !== -1 || ua.indexOf("Edg") !== -1) browser = "Edge";
        else if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        
        const isStandalone = !!(window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
        const deviceName = `${os} ${deviceType} (${browser})`;
        const hasPermission = ('Notification' in window) && Notification.permission === 'granted';
        const webPushEnabled = (localStorage.getItem('pushNotificationsEnabled') === 'true') && hasPermission;
        
        const updates = {};
        updates[`users/${uid}/devices/${deviceId}`] = {
            deviceId: deviceId,
            deviceName: deviceName,
            os: os,
            deviceType: deviceType,
            browser: browser,
            isStandalone: isStandalone,
            hasPermission: hasPermission,
            webPushEnabled: webPushEnabled,
            fcmToken: fcmToken || localStorage.getItem('fcmToken') || null,
            lastActive: Date.now()
        };
        
        const tokenToUse = fcmToken || localStorage.getItem('fcmToken');
        if (tokenToUse) {
            localStorage.setItem('fcmToken', tokenToUse);
            if (webPushEnabled && hasPermission) {
                updates[`users/${uid}/fcm_tokens/${tokenToUse}`] = true;
            } else {
                updates[`users/${uid}/fcm_tokens/${tokenToUse}`] = null;
            }
        }
        
        if (db) {
            await update(ref(db), updates);
            console.log('[Notify] Device state synchronized to DB.');
            window.deviceRegistered = true;
        }
    }
};
