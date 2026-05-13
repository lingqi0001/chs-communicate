/**
 * CHS Communicate - Notification Module
 * Handles PWA Push Notifications (FCM), Unread Status, Favicon Badges, and Notification Sounds.
 */

import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { ref, update, onChildAdded, query, orderByKey, limitToLast, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const NotifyModule = {
    unreadSet: new Set(),
    engine: null, // Firebase Messaging instance
    audio: null,  // Notification sound object
    originalFavicon: document.querySelector('link[rel="icon"]')?.href || '',
    db: null,     // Firebase Database instance
    
    // Internal state passed during init
    context: {
        currentUser: null,
        allUsers: null,
        settings: null,
        appStartTime: Date.now(),
        globalListeners: null
    },

    /**
     * Initialize the notification system
     * @param {Object} deps - Dependencies: { db, currentUser, allUsers, settings, globalListeners }
     */
    init: function(deps) {
        this.db = deps.db;
        this.context.currentUser = deps.currentUser;
        this.context.allUsers = deps.allUsers;
        this.context.settings = deps.settings;
        this.context.globalListeners = deps.globalListeners;
        this.context.appStartTime = deps.appStartTime || Date.now();

        // Initialize Audio
        if (this.context.settings?.soundUrl) {
            this.audio = new Audio(this.context.settings.soundUrl);
        }

        // Initialize Messaging if engine is provided
        if (this.engine) {
            this.setupListeners();
        }
    },

    /**
     * Update UI elements (Main Unread Dot and Page Title)
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
     * Draw a blue dot badge on the favicon
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
        img.src = this.originalFavicon;
    },

    /**
     * Request Browser Notification Permission and Register FCM Token
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
                    await update(ref(this.db, `user_private/${this.context.currentUser.id}`), { fcmToken: token });
                    console.log('NotifyModule: FCM Token registered.');
                }
            }
        } catch (err) {
            console.error('NotifyModule: Permission error:', err);
        }
    },

    /**
     * Setup Foreground Messaging Listeners
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
     * Monitor all chats for new incoming messages while App is running
     */
    initMonitor: function() {
        if (!this.db || !this.context.currentUser) return;
        
        const { currentUser, allUsers, globalListeners, appStartTime, settings } = this.context;

        Object.keys(allUsers).forEach(targetId => {
            if (targetId === currentUser.id || globalListeners.has(targetId)) return;
            
            // Helper for Chat ID
            const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');
            const chatId = getChatId(currentUser.id, targetId);
            
            const q = query(ref(this.db, `messages/${chatId}`), orderByKey(), limitToLast(1));
            
            onChildAdded(q, (snap) => {
                const msg = snap.val();
                // activeTargetId check - accessing via window for now to ensure reactive updates
                const activeId = window.activeTargetId; 

                if (msg && msg.senderId !== currentUser.id && msg.timestamp > appStartTime) {
                    if (!document.hidden && activeId === targetId) {
                        // Mark as read immediately on server
                        update(ref(this.db, `user_chats/${currentUser.id}`), { [targetId]: serverTimestamp() });
                    } else {
                        // Play sound
                        if (settings?.soundEnabled && this.audio) {
                            this.audio.play().catch(() => { });
                        }
                        
                        // Add to unread set
                        this.unreadSet.add(targetId);
                        
                        // Show dot in UI
                        const dot = document.getElementById(`dot-${targetId}`);
                        if (dot) dot.classList.remove('hidden');
                        
                        this.updateUI();

                        // Move to top in sidebar list
                        update(ref(this.db, `user_chats/${currentUser.id}`), { [targetId]: serverTimestamp() });
                    }
                }
            });
            globalListeners.add(targetId);
        });
    },

    /**
     * Mark a specific chat as read and update UI
     * @param {string} targetId 
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
