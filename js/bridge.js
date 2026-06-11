/**
 * ==================================================================================
 * Module: AppModules.Bridge (js/bridge.js)
 * Purpose: Handles external plugins/sub-apps bridging, sandbox execution controls,
 *          navigation bar bridge protocols, and plugin notification events.
 * ==================================================================================
 */

import { ref, onValue, update } from './core.js';
import { db } from './db.js';

// State variables local to the module
let _pendingExtensionBridgeMessage = null;
let _irNotificationBridgeUnsub = null;
const _extensionNotifyState = {};
const _extensionNotifyRouteMap = {};
const _extensionUnreadCount = {};

// Helper functions
export const isExtensionTargetId = (id) => {
    const s = String(id || '').toLowerCase();
    return s.startsWith('extension_') || s.startsWith('ext_');
};

export const extensionIdFromTarget = (id) => {
    const s = String(id || '').toLowerCase();
    if (s.startsWith('extension_')) return s.slice('extension_'.length);
    if (s.startsWith('ext_')) return s.slice('ext_'.length);
    return s;
};

const escapeHTML = (str) => {
    if (window.escapeHTML) return window.escapeHTML(str);
    return String(str || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

export const BridgeModule = {
    isExtensionTargetId,
    extensionIdFromTarget,

    getPendingMessage() {
        return _pendingExtensionBridgeMessage;
    },

    clearPendingMessage() {
        _pendingExtensionBridgeMessage = null;
    },

    async openExtensionNotificationTarget(targetId) {
        const normalized = String(targetId || '').toLowerCase();
        if (!isExtensionTargetId(normalized)) return;

        const extensionId = extensionIdFromTarget(normalized);
        const canonicalTarget = `ext_${extensionId}`;
        const regItem = window.AppModules?.Extension?.getRegistryItem?.(extensionId);
        const readableName = extensionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const displayTitle = regItem?.title || readableName;

        const ok = await window.AppModules.Modal.confirm(
            "Open Extension",
            `You have a new message in an extension, do you want to open <b>${escapeHTML(displayTitle)}</b> notifications now?`,
            "Open",
            "Cancel"
        );
        if (!ok) return;

        const route = _extensionNotifyRouteMap[canonicalTarget] || _extensionNotifyRouteMap[normalized] || 'notification';
        _pendingExtensionBridgeMessage = route === 'notification'
            ? { type: 'OPEN_NOTIFICATION_VIEW' }
            : { type: 'OPEN_NOTIFICATION_VIEW' };

        if (window.openExtension) {
            window.openExtension(extensionId, regItem?.url || null, displayTitle);
        } else if (window.AppModules?.Extension?.openExtension) {
            window.AppModules.Extension.openExtension(extensionId, regItem?.url || null, displayTitle);
        }
    },

    initIRNavigatorNotificationBridge() {
        try {
            const currentUser = window.currentUser || window.AppModules?.User?.current;
            if (!currentUser || !currentUser.id) return;
            if (_irNotificationBridgeUnsub) {
                _irNotificationBridgeUnsub();
                _irNotificationBridgeUnsub = null;
            }
            const uid = currentUser.id.toLowerCase();
            const notifRef = ref(db, `user_image_index/ir_v7/notifications/${uid}`);
            _irNotificationBridgeUnsub = onValue(notifRef, (snap) => {
                const raw = snap.val();
                // Backward-compatible normalization: support both array and object-shaped lists.
                const list = Array.isArray(raw)
                    ? raw.filter(Boolean)
                    : (raw && typeof raw === 'object' ? Object.values(raw).filter(Boolean) : []);
                const unread = list.filter(n => !n.read).length;
                const latest = list.length > 0
                    ? [...list].sort((a, b) => (b.time || 0) - (a.time || 0))[0]
                    : null;

                this.handleExtensionNotify({
                    extensionId: 'ir_navigator',
                    title: 'IR Navigator',
                    body: latest && latest.text ? latest.text : 'No unread notifications',
                    route: 'notification',
                    unreadCount: unread
                });
            });
        } catch (e) {
            console.warn('IR notification bridge init failed:', e);
        }
    },

    async handleExtensionNotify(payload) {
        try {
            const currentUser = window.currentUser || window.AppModules?.User?.current;
            if (!currentUser || !currentUser.id) return;

        const extensionId = String(payload?.extensionId || '').trim();
        if (!extensionId) return;

        const targetId = `ext_${extensionId.toLowerCase()}`;
        const regItem = window.AppModules?.Extension?.getRegistryItem?.(extensionId);
        const text = String(payload?.body || payload?.title || 'Extension notification');
        const unreadCount = Number(payload?.unreadCount || 0);
        const route = String(payload?.route || 'notification');
            const uid = currentUser.id.toLowerCase();
            const prevUnread = Number(_extensionUnreadCount[targetId] || 0);
            _extensionUnreadCount[targetId] = unreadCount;

            _extensionNotifyRouteMap[targetId] = route;

            // Ensure we can display a friendly name immediately
            if (window.ALL_USERS && !window.ALL_USERS[targetId]) {
                window.ALL_USERS[targetId] = {
                    name: String(payload?.title || 'Extension'),
                    email: String(payload?.extensionId || 'extension'),
                    role: 'system_extension',
                    lastSeen: Date.now()
                };
            }

            // If unread is cleared, only clear dot; do not bump recency/order.
            if (unreadCount <= 0) {
                await update(ref(db, `user_notifications/${uid}`), { [targetId]: false, [`extension_${extensionId.toLowerCase()}`]: false });
                if (window.AppModules?.Notify?.markAsRead) {
                    window.AppModules.Notify.markAsRead(targetId);
                }
                if (window.AppModules?.Sidebar?.renderSidebar) {
                    window.AppModules.Sidebar.renderSidebar();
                }
                return;
            }

            // De-dup repeated bridge updates caused by opening extension / mark-read cycles.
            const sig = `${unreadCount}|${text}`;
            if (_extensionNotifyState[targetId] === sig) {
                return;
            }
            _extensionNotifyState[targetId] = sig;

            // Keep this entry discoverable in sidebar and mark unread.
            await update(ref(db, `user_chats/${uid}`), { [targetId]: Date.now(), [`extension_${extensionId.toLowerCase()}`]: null });
            await update(ref(db, `user_notifications/${uid}`), { [targetId]: true });

            // Play sound / visual alert when unread first appears or increases.
            if (unreadCount > prevUnread && window.AppModules?.Notify?.triggerAlert) {
                window.AppModules.Notify.triggerAlert(targetId, { text, senderId: targetId });
            }

            if (window.AppModules?.Sidebar?.renderSidebar) {
                window.AppModules.Sidebar.renderSidebar();
            }
        } catch (err) {
            console.error('Extension notify handling failed:', err);
        }
    },

    initMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                const currentUser = window.currentUser || window.AppModules?.User?.current;
                const ViewModule = window.ViewModule || window.AppModules?.View;
                switch (event.data.type) {
                    case 'GET_USER':
                        if (event.source) {
                            const isAdmin = window.AppModules?.User?.isAdmin ? window.AppModules.User.isAdmin() : false;
                            const isTeacher = window.AppModules?.User?.isTeacher ? window.AppModules.User.isTeacher() : false;
                            event.source.postMessage({
                                type: 'USER_RESPONSE',
                                user: currentUser,
                                isAdmin: isAdmin,
                                isStaff: (isTeacher || isAdmin)
                            }, '*');
                        }
                        break;
                    case 'GET_THEME':
                        if (event.source) {
                            const isDarkMode = ViewModule?.state?.isDarkMode || false;
                            event.source.postMessage({ type: 'THEME_UPDATE', isDarkMode }, '*');
                        }
                        break;
                    case 'SHOW_TOAST':
                        if (window.showToast) {
                            window.showToast(event.data.message);
                        } else {
                            console.log('Bridge SDK showToast:', event.data.message);
                        }
                        break;
                    case 'OPEN_GALLERY':
                        if (window.openGallery) {
                            window.openGallery(event.data.images, event.data.index || 0);
                        }
                        break;
                    case 'EXTENSION_NOTIFY':
                        this.handleExtensionNotify(event.data.payload || {});
                        break;
                    case 'CLOSE_EXTENSION':
                        if (window.closeExtension) {
                            window.closeExtension();
                        } else if (window.AppModules?.Extension?.closeExtension) {
                            window.AppModules.Extension.closeExtension();
                        }
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
    }
};

// Global mount for compatibility
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Bridge = BridgeModule;
    window.isExtensionTargetId = isExtensionTargetId;
    window.extensionIdFromTarget = extensionIdFromTarget;
    window.openExtensionNotificationTarget = (...args) => BridgeModule.openExtensionNotificationTarget(...args);
    window.initIRNavigatorNotificationBridge = () => BridgeModule.initIRNavigatorNotificationBridge();
    window.handleExtensionNotify = (payload) => BridgeModule.handleExtensionNotify(payload);

    // Auto init listener
    BridgeModule.initMessageListener();
}
