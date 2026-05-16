/**
 * ==================================================================================
 * Module: NotifyModule (Real-time Notifications)
 * Path: js/notify.js
 * ==================================================================================
 */

import { db, auth, onValue, ref } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { CloudDB, PATHS } from './db.js?v=5';

export const NotifyModule = {
    unreadCount: 0,

    async initMonitor() {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.email.split('@')[0].replace(/\./g, '_');
        
        onValue(ref(db, `user_notifications/${uid}`), (snapshot) => {
            const data = snapshot.val() || {};
            this.unreadCount = Object.values(data).filter(v => v === true).length;
            this.updateUI();
        });
    },

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

    async requestPermission() {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
};