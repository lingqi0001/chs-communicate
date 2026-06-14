import { LiquidGlassEffect } from './liquid-glass.js?v=20260612-1741';

export function initChatEngine(deps) {
    const {
        db, ref, push, set, get, update, query, orderByKey, startAfter, limitToLast, onChildAdded, onValue, serverTimestamp, endBefore,
        UIComponents, AppModules, getChatId, getLocalMessages, saveMessageLocal, escapeHTML,
        getCurrentUser, getActiveTargetId, getStopCurrentChatListener, setStopCurrentChatListener,
        getAllUsers, SAFETY_BOT_ID, getCnCache, uploadImageToStorage,
        setActiveTargetId, getCtCache, getSidebarClasses, getIsSyncDone, getIsPhotoDisabled,
        formatLastSeen, isExtensionTargetId, openExtensionNotificationTarget, extensionIdFromTarget, fetchUser,
        initGlobalNotificationMonitor
    } = deps;

    let chatLoadingLock = null;
    let lastLoadTime = 0;
    let loadedMsgKeys = new Set();
    let lastChatId = null;
    let currentQuote = null;
    let selectedMsgData = null;
    let longPressTimer = null;
    let hasMountedUIEvents = false;
    let lastKnownChatMap = {};
    let isFirebaseConnected = true;
    onValue(ref(db, '.info/connected'), (snap) => {
        isFirebaseConnected = !!snap.val();
        const placeholder = document.querySelector('[data-chat-placeholder="true"]');
        if (placeholder) {
            if (!isFirebaseConnected) {
                placeholder.innerText = navigator.onLine 
                    ? "Connection lost. Please check your network connection." 
                    : "Offline. Please check your network connection.";
            } else {
                placeholder.innerText = "No messages yet";
            }
        }
    });
    let wasDesktopWidth = window.innerWidth >= 800;
    let wasMobileLayout = window.innerWidth < 800;
    let wasFullDesktop = window.innerWidth >= 1024;
    let currentLocalMsgs = [];
    let currentDisplayMsgs = [];
    let currentOldestLoadedKey = null;
    const safeSetActiveTargetId = typeof setActiveTargetId === 'function'
        ? setActiveTargetId
        : (id) => { window.activeTargetId = id; };
    const safeGetCtCache = typeof getCtCache === 'function'
        ? getCtCache
        : () => (window.ctCache || {});
    const safeGetSidebarClasses = typeof getSidebarClasses === 'function'
        ? getSidebarClasses
        : () => (window.sidebarClasses || {});
    const safeGetIsSyncDone = typeof getIsSyncDone === 'function'
        ? getIsSyncDone
        : () => !!window.isSyncDone;
    const safeGetIsPhotoDisabled = typeof getIsPhotoDisabled === 'function'
        ? getIsPhotoDisabled
        : () => !!window.isPhotoDisabled;
    const safeFormatLastSeen = typeof formatLastSeen === 'function'
        ? formatLastSeen
        : ((v) => v || "");
    const safeIsExtensionTargetId = typeof isExtensionTargetId === 'function'
        ? isExtensionTargetId
        : (() => false);
    const safeOpenExtensionNotificationTarget = typeof openExtensionNotificationTarget === 'function'
        ? openExtensionNotificationTarget
        : (async () => { });
    const safeExtensionIdFromTarget = typeof extensionIdFromTarget === 'function'
        ? extensionIdFromTarget
        : ((v) => v || "");
    const safeFetchUser = typeof fetchUser === 'function'
        ? fetchUser
        : (async () => null);

    function ensureForwardPicker() {
        if (document.getElementById('forwardPicker')) return;
        document.body.insertAdjacentHTML('beforeend', `
    <div id="forwardPicker" class="hidden fixed inset-0 z-[260] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="closeForwardPicker()"></div>
        <div
            class="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                <h3 class="text-lg font-bold">Forward to...</h3>
            </div>
            <div id="forwardUserList" class="flex-1 overflow-y-auto max-h-[60vh] p-2"></div>
            <div class="p-4 bg-gray-50 dark:bg-white/5 flex justify-end">
                <button onclick="closeForwardPicker()"
                    class="px-5 py-2 text-[15px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
            </div>
        </div>
    </div>
        `);
    }

    function clearChatPlaceholders(chatBox) {
        if (!chatBox) return;
        const placeholders = chatBox.querySelectorAll('[data-chat-placeholder="true"]');
        placeholders.forEach(el => el.remove());
    }

    let chatGeneration = 0;

    async function loadChatThread(chatId, forceReload = false) {
        const now = Date.now();
        if (chatLoadingLock === chatId && (now - lastLoadTime < 1500)) return;

        chatLoadingLock = chatId;
        lastLoadTime = now;
        const thisGeneration = ++chatGeneration;

        const chatBox = document.getElementById('chatBox');
        if (chatBox && chatBox._scrollListener) {
            chatBox.removeEventListener('scroll', chatBox._scrollListener);
            chatBox._scrollListener = null;
        }

        // Force reload on mobile when re-opening the same chat
        const isMobile = window.innerWidth < 800;
        let loadingTimer = null;
        let isLoaded = false;
        if (forceReload || lastChatId !== chatId || isMobile) {
            chatBox.style.opacity = '1';
            chatBox.innerHTML = '';
            loadedMsgKeys.clear();
            lastChatId = chatId;

            loadingTimer = setTimeout(() => {
                if (!isLoaded) {
                    chatBox.innerHTML = `
                        <div class="h-full min-h-[200px] flex items-center justify-center">
                            <div class="flex flex-col items-center gap-2 text-gray-400">
                                <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                                <span class="text-xs font-medium">Loading messages...</span>
                            </div>
                        </div>
                    `;
                }
            }, 500);
        }

        const prevStop = getStopCurrentChatListener();
        if (prevStop) prevStop();

        currentLocalMsgs = await getLocalMessages(chatId);
        isLoaded = true;
        if (loadingTimer) clearTimeout(loadingTimer);

        // Sort chronologically
        currentLocalMsgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        currentDisplayMsgs = currentLocalMsgs.slice(-50);
        let lastKey = currentLocalMsgs.length > 0 ? currentLocalMsgs[currentLocalMsgs.length - 1].key : null;

        const initialFrag = document.createDocumentFragment();
        currentDisplayMsgs.forEach(m => {
            if (m.key) {
                loadedMsgKeys.add(m.key);
                const msgEl = UIComponents.createChatBubble(m, m.key, getCurrentUser(), setupLongPress);
                if (msgEl) initialFrag.appendChild(msgEl);
            }
        });

        chatBox.innerHTML = '';
        if (initialFrag.childNodes.length > 0) {
            chatBox.appendChild(initialFrag);
            chatBox.scrollTop = chatBox.scrollHeight;
        } else {
            let placeholderHtml = `
                <div class="font-semibold text-base">No messages here yet</div>
                <div class="text-xs opacity-75 mt-1">If this is unexpected, please check your connection</div>
            `;
            chatBox.innerHTML = `<div data-chat-placeholder="true" class="h-full min-h-[120px] flex flex-col items-center justify-center text-center text-gray-400 chat-placeholder-delay">${placeholderHtml}</div>`;
        }

        // --- SCROLL PAGINATION SETUP ---
        currentOldestLoadedKey = currentDisplayMsgs.length > 0 ? currentDisplayMsgs[0].key : null;
        let isLoadingOlder = false;

        const loadOlderMessages = async () => {
            if (isLoadingOlder) return;
            isLoadingOlder = true;

            const oldScrollHeight = chatBox.scrollHeight;

            // 1. Try loading older messages from local memory/IndexedDB array first
            const currentlyRenderedKeys = new Set(currentDisplayMsgs.map(m => m.key));
            const remainingLocalMsgs = currentLocalMsgs.filter(m => !currentlyRenderedKeys.has(m.key));

            if (remainingLocalMsgs.length > 0) {
                const nextChunk = remainingLocalMsgs.slice(-50);
                currentDisplayMsgs = [...nextChunk, ...currentDisplayMsgs];

                const batchFrag = document.createDocumentFragment();
                nextChunk.forEach(m => {
                    if (m.key) {
                        loadedMsgKeys.add(m.key);
                        const msgEl = UIComponents.createChatBubble(m, m.key, getCurrentUser(), setupLongPress);
                        if (msgEl) batchFrag.appendChild(msgEl);
                    }
                });

                chatBox.insertBefore(batchFrag, chatBox.firstChild);
                chatBox.scrollTop = chatBox.scrollHeight - oldScrollHeight;

                currentOldestLoadedKey = currentDisplayMsgs.length > 0 ? currentDisplayMsgs[0].key : null;
                isLoadingOlder = false;
            } else {
                // 2. Fetch older messages from Firebase
                if (currentOldestLoadedKey) {
                    try {
                        const olderQuery = query(
                            ref(db, `messages/${chatId}`),
                            orderByKey(),
                            endBefore(currentOldestLoadedKey),
                            limitToLast(50)
                        );
                        const olderSnap = await get(olderQuery);
                        const olderMsgs = olderSnap.val() || {};
                        const olderKeys = Object.keys(olderMsgs).sort();

                        if (olderKeys.length > 0) {
                            const nextChunk = olderKeys.map(k => ({ key: k, ...olderMsgs[k] }));

                            // Save to IndexedDB
                            for (const m of nextChunk) {
                                await saveMessageLocal(chatId, m.key, olderMsgs[m.key]);
                            }

                            // Update in-memory lists
                            currentLocalMsgs = [...nextChunk, ...currentLocalMsgs];
                            currentLocalMsgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                            currentDisplayMsgs = [...nextChunk, ...currentDisplayMsgs];

                            const batchFrag = document.createDocumentFragment();
                            nextChunk.forEach(m => {
                                if (m.key) {
                                    loadedMsgKeys.add(m.key);
                                    const msgEl = UIComponents.createChatBubble(m, m.key, getCurrentUser(), setupLongPress);
                                    if (msgEl) batchFrag.appendChild(msgEl);
                                }
                            });

                            chatBox.insertBefore(batchFrag, chatBox.firstChild);
                            chatBox.scrollTop = chatBox.scrollHeight - oldScrollHeight;

                            currentOldestLoadedKey = currentDisplayMsgs.length > 0 ? currentDisplayMsgs[0].key : null;
                        }
                    } catch (err) {
                        console.error("Failed to load older messages from Firebase:", err);
                    }
                }
                isLoadingOlder = false;
            }
        };

        const handleScroll = () => {
            if (chatBox.scrollTop <= 10) {
                loadOlderMessages();
            }
        };

        chatBox._scrollListener = handleScroll;
        chatBox.addEventListener('scroll', handleScroll);

        let isSyncing = true;
        let syncBuffer = [];
        const q = lastKey
            ? query(ref(db, `messages/${chatId}`), orderByKey(), startAfter(lastKey))
            : query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50));

        const stop = onChildAdded(q, (snap) => {
            const msg = snap.val();
            if (!msg || !snap.key || loadedMsgKeys.has(snap.key)) return;
            loadedMsgKeys.add(snap.key);

            if (isSyncing) {
                syncBuffer.push({ key: snap.key, msg });
            } else {
                appendMsg(msg, snap.key, chatId, true);
                requestAnimationFrame(() => {
                    chatBox.scrollTop = chatBox.scrollHeight;
                });
            }
        }, (error) => {
            if (error.message.includes('permission_denied')) {
                AppModules.Modal.alert("Permission Error", "You do not have permission to view messages in this chat.");
            }
        });
        setStopCurrentChatListener(() => stop());

        setTimeout(() => {
            if (chatGeneration !== thisGeneration) return;
            isSyncing = false;
            if (syncBuffer.length > 0) {
                clearChatPlaceholders(chatBox);
                const batchFrag = document.createDocumentFragment();
                syncBuffer.forEach(item => {
                    const div = UIComponents.createChatBubble(item.msg, item.key, getCurrentUser(), setupLongPress);
                    if (div) batchFrag.appendChild(div);
                    saveMessageLocal(chatId, item.key, item.msg);
                });
                chatBox.appendChild(batchFrag);
            }

            requestAnimationFrame(() => {
                if (chatGeneration !== thisGeneration) return;
                chatBox.scrollTop = chatBox.scrollHeight;
                chatBox.style.opacity = '1';
                setTimeout(() => {
                    if (chatGeneration !== thisGeneration) return;
                    chatBox.scrollTop = chatBox.scrollHeight;
                }, 50);
            });

            syncBuffer = [];
            chatLoadingLock = null;
        }, 60);
    }

    function isSafetyBotTarget(targetId) {
        return (targetId || '').toLowerCase() === SAFETY_BOT_ID;
    }

    async function blockIfRestrictedDirectTarget(targetId) {
        if (!isSafetyBotTarget(targetId)) return false;
        await AppModules.Modal.alert("Restricted", "Safety Bot is receive-only. Users cannot send or forward messages to it.");
        return true;
    }

    function handleMsgCopy() {
        if (!selectedMsgData) return;
        navigator.clipboard.writeText(selectedMsgData.text);
        const menu = document.getElementById('messageContextMenu');
        menu.classList.add('hidden');
        if (menu._hideListener) {
            document.removeEventListener('mousedown', menu._hideListener);
            document.removeEventListener('touchstart', menu._hideListener);
        }
    }

    function handleMsgQuote() {
        if (!selectedMsgData) return;
        currentQuote = { 
            senderName: selectedMsgData.senderName, 
            text: selectedMsgData.text,
            messageId: selectedMsgData.key || null
        };
        document.getElementById('quoteUser').innerText = currentQuote.senderName;
        document.getElementById('quoteText').innerText = (currentQuote.text || '').replace(/\r?\n/g, ' ');
        document.getElementById('quoteArea').classList.remove('hidden');
        const menu = document.getElementById('messageContextMenu');
        menu.classList.add('hidden');
        if (menu._hideListener) {
            document.removeEventListener('mousedown', menu._hideListener);
            document.removeEventListener('touchstart', menu._hideListener);
        }
        document.getElementById('u-msg').focus();
    }

    function clearQuote() {
        currentQuote = null;
        document.getElementById('quoteArea').classList.add('hidden');
    }

    function handleMsgForward() {
        if (!selectedMsgData) return;
        ensureForwardPicker();
        const menu = document.getElementById('messageContextMenu');
        menu.classList.add('hidden');
        if (menu._hideListener) {
            document.removeEventListener('mousedown', menu._hideListener);
            document.removeEventListener('touchstart', menu._hideListener);
        }
        const list = document.getElementById('forwardUserList');
        list.innerHTML = '';
        const allUsers = getAllUsers() || {};
        const currentUser = getCurrentUser();
        Object.keys(allUsers).forEach(id => {
            if (id === currentUser.id) return;
            if (isSafetyBotTarget(id)) return;
            const u = allUsers[id];
            const div = document.createElement('div');
            div.className = "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer rounded-xl transition-colors";
            div.onclick = () => forwardTo(id);
            div.innerHTML = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" class="w-9 h-9 rounded-full shadow-sm">
                <div><div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name)}</div><div class="text-xs text-gray-400">${escapeHTML(u.email)}</div></div>`;
            list.appendChild(div);
        });
        document.getElementById('forwardPicker').classList.remove('hidden');
    }

    function closeForwardPicker() {
        document.getElementById('forwardPicker')?.classList.add('hidden');
    }

    async function handleMsgReport() {
        if (!selectedMsgData) return;
        const menu = document.getElementById('messageContextMenu');
        if (menu) menu.classList.add('hidden');
        const confirmReport = await AppModules.Modal.confirm(
            "Report Content",
            "Report this message for harassment or inappropriate content?",
            "Report"
        );
        if (confirmReport) {
            AppModules.Security.reportMessage(selectedMsgData);
        }
    }

    async function forwardTo(targetId) {
        if (await blockIfRestrictedDirectTarget(targetId)) return;
        const currentUser = getCurrentUser();
        const chatId = getChatId(currentUser.id, targetId);
        const forwardText = `[Forwarded from ${escapeHTML(selectedMsgData.senderName)}]: ${escapeHTML(selectedMsgData.text)}`;

        await push(ref(db, `messages/${chatId}`), { senderId: currentUser.id, senderName: currentUser.name, text: forwardText, type: 'text', timestamp: serverTimestamp() });
        await update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [targetId.toLowerCase()]: serverTimestamp() });
        await update(ref(db, `user_chats/${targetId.toLowerCase()}`), { [currentUser.id.toLowerCase()]: serverTimestamp() });

        closeForwardPicker();
    }

    function setupLongPress(el, msg) {
        const start = (e) => {
            selectedMsgData = msg;
            longPressTimer = setTimeout(() => {
                const menu = document.getElementById('messageContextMenu');
                const touch = e.touches ? e.touches[0] : e;

                menu.style.transition = 'none';
                menu.style.opacity = '0';
                menu.classList.remove('hidden');

                const menuHeight = menu.offsetHeight || 200;
                const menuWidth = menu.offsetWidth || 180;
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
                setTimeout(() => {
                    document.addEventListener('mousedown', hide);
                    document.addEventListener('touchstart', hide);
                }, 50);
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

    function setComposerState({ disabled, placeholder, hideSend, hideCamera }) {
        const msgInput = document.getElementById('u-msg');
        if (!msgInput) return;
        const sendBtn = msgInput.nextElementSibling;
        const cameraBtn = document.getElementById('chatCameraBtn');
        const inputPill = document.getElementById('chatInputPill');

        msgInput.disabled = !!disabled;
        msgInput.rows = 1;
        if (placeholder) msgInput.placeholder = placeholder;

        if (sendBtn) {
            sendBtn.style.opacity = hideSend ? '0' : '1';
            sendBtn.style.pointerEvents = hideSend ? 'none' : 'auto';
            if (!hideSend) sendBtn.style.display = 'flex';
        }
        if (cameraBtn) {
            cameraBtn.style.opacity = hideCamera ? '0' : '1';
            cameraBtn.style.pointerEvents = hideCamera ? 'none' : 'auto';
            if (!hideCamera) cameraBtn.style.display = safeGetIsPhotoDisabled() ? 'none' : 'block';
        }
        if (inputPill) {
            if (disabled) {
                inputPill.style.width = '100%';
                inputPill.style.flex = 'none';
                setTimeout(updateComposerPadding, 50);
            } else {
                inputPill.style.width = '';
                inputPill.style.flex = '';
                setTimeout(updateComposerPadding, 50);
            }
        }
    }

    async function switchChat(targetId) {
        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        if (!targetId || targetId === currentUser.id) return;
        
        // Allow re-opening the same chat on mobile (when user clicks back and re-clicks contact)
        const isMobile = window.innerWidth < 800;
        if (targetId === activeTargetId && !isMobile) return;
        
        if (safeIsExtensionTargetId(targetId)) {
            await safeOpenExtensionNotificationTarget(targetId);
            return;
        }

        safeSetActiveTargetId(targetId);

        let isDisbanded = false;
        let isRemoved = false;
        if (targetId.startsWith('group_')) {
            const classId = targetId.replace('group_', '');
            isDisbanded = !!safeGetIsSyncDone() && !(AppModules.Sync.existingClassIds && AppModules.Sync.existingClassIds[classId]);
            isRemoved = !!safeGetIsSyncDone() && !isDisbanded && !(safeGetSidebarClasses()[classId]);
        }

        if (targetId === 'safety_bot') {
            setComposerState({
                disabled: true,
                placeholder: "System notifications only. Messaging is disabled.",
                hideSend: true,
                hideCamera: true
            });
        } else if (isDisbanded || isRemoved) {
            setComposerState({
                disabled: true,
                placeholder: isDisbanded
                    ? "This class has been disbanded. Messaging is disabled."
                    : "You have been removed from this chat. Messaging is disabled.",
                hideSend: true,
                hideCamera: true
            });
        } else {
            setComposerState({
                disabled: false,
                placeholder: window.innerWidth < 640
                    ? "Type a message..."
                    : "Type a message...Use Shift+Enter to change lines",
                hideSend: false,
                hideCamera: false
            });
        }
        AppModules.Notify.markAsRead(targetId);

        const titleEl = document.getElementById('chatTitle');
        const statusEl = document.getElementById('chatStatus');
        const ctCache = safeGetCtCache();
        let chatId = '';

        if (targetId.startsWith('group_')) {
            chatId = targetId;
            const classId = targetId.replace('group_', '');
            titleEl.innerText = getCnCache()[classId] || "Class Group Chat";
            if (isDisbanded) {
                statusEl.innerText = "Class disbanded";
            } else if (isRemoved) {
                statusEl.innerText = "You have been removed from this chat";
            } else {
                statusEl.innerText = ctCache[classId] || "Group Chat";
            }

            if (!getCnCache()[classId] || !ctCache[classId]) {
                get(ref(db, `classes/${classId}`)).then(async snap => {
                    if (!snap.exists()) return;
                    const cData = snap.val();
                    getCnCache()[classId] = cData.name;
                    if (getActiveTargetId() === targetId) titleEl.innerText = cData.name;
                    if (cData.teacherId) {
                        const teacher = await safeFetchUser(cData.teacherId);
                        ctCache[classId] = teacher?.name || "Teacher";
                        if (getActiveTargetId() === targetId) statusEl.innerText = teacher?.name || "Teacher";
                    }
                    AppModules.Sidebar.renderSidebar();
                });
            }
        } else {
            chatId = getChatId(currentUser.id, targetId);
            const u = (getAllUsers() || {})[targetId];
            if (safeIsExtensionTargetId(targetId)) {
                const extName = safeExtensionIdFromTarget(targetId).replace(/_/g, ' ');
                titleEl.innerText = u?.name || extName.replace(/\b\w/g, c => c.toUpperCase());
            } else {
                titleEl.innerText = u?.name || targetId;
            }

            const statusText = safeIsExtensionTargetId(targetId)
                ? "Extension Tool"
                : (u?.lastSeen ? safeFormatLastSeen(u.lastSeen) : (u?.email || ""));
            statusEl.innerText = statusText;
            if (statusText === "online") {
                statusEl.classList.add('text-[#007AFF]');
                statusEl.classList.remove('text-gray-400');
            } else {
                statusEl.classList.remove('text-[#007AFF]');
                statusEl.classList.add('text-gray-400');
            }

            safeFetchUser(targetId).then(user => {
                if (!user || getActiveTargetId() !== targetId) return;
                if (user.name) titleEl.innerText = user.name;
                if (!user.lastSeen) return;
                const updatedText = safeFormatLastSeen(user.lastSeen);
                statusEl.innerText = updatedText;
                if (updatedText === "online") {
                    statusEl.classList.add('text-[#007AFF]');
                    statusEl.classList.remove('text-gray-400');
                } else {
                    statusEl.classList.remove('text-[#007AFF]');
                    statusEl.classList.add('text-gray-400');
                }
            });
        }

        AppModules.View.showPanel('chat');

        loadChatThread(chatId);

        document.querySelectorAll('#sidebarSubList div[id^="item-"]').forEach(div => {
            const divId = div.id.replace('item-', '');
            if (divId === targetId) {
                div.classList.add('active-chat-item');
                div.classList.remove('hover:bg-gray-50/5', 'hover:bg-gray-50/50', 'hover:bg-black/5', 'dark:hover:bg-white/5');
            } else {
                div.classList.remove('active-chat-item');
                div.classList.remove('hover:bg-gray-50/5', 'hover:bg-gray-50/50');
                if (!div.classList.contains('hover:bg-black/5')) {
                    div.classList.add('hover:bg-black/5');
                }
                if (!div.classList.contains('dark:hover:bg-white/5')) {
                    div.classList.add('dark:hover:bg-white/5');
                }
            }
        });
    }

    async function deleteChatRecord(targetId) {
        if (window.AppModules && window.AppModules.Notify && typeof window.AppModules.Notify.markAsRead === 'function') {
            window.AppModules.Notify.markAsRead(targetId);
        }
        if (!await AppModules.Modal.confirm("Remove Chat", "Remove this chat from your list? Messages will not be deleted.", "Remove")) return;

        const currentUser = getCurrentUser();
        const lowerTarget = targetId.toLowerCase();
        const lowerUser = currentUser.id.toLowerCase();

        try {
            const updates = {};
            updates[`user_chats/${lowerUser}/${lowerTarget}`] = null;
            if (lowerTarget !== targetId) updates[`user_chats/${lowerUser}/${targetId}`] = null;
            if (lowerUser !== currentUser.id) updates[`user_chats/${currentUser.id}/${lowerTarget}`] = null;
            await update(ref(db), updates);
            document.getElementById(`item-${targetId}`)?.remove();
            setTimeout(() => AppModules.Sidebar.renderSidebar(), 500);
        } catch (err) {
            console.error("Delete chat failed:", err);
        }
    }

    function jumpToMessage(text, searchQuery, msgKey) {
        const chatBox = document.getElementById('chatBox');
        const messages = Array.from(chatBox.querySelectorAll('.msg-pop'));
        let target = null;
        if (msgKey) target = messages.find(m => m.dataset.key === msgKey);
        if (!target) {
            target = messages.find(m => {
                const raw = m.getAttribute('data-raw-text') || '';
                return raw.includes(text) || m.innerText.includes(text);
            });
        }

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const bubble = target.querySelector('.bg-\\[\\#007AFF\\], .bg-\\[\\#E9E9EB\\], .dark\\:bg-gray-700, img');
            if (bubble) setTimeout(() => window.UIUtils.highlight(bubble), 600);
        } else {
            const input = document.getElementById('chatSearchInput');
            if (input) {
                input.value = searchQuery || text;
                input.dispatchEvent(new Event('input'));
            }
        }

        if (searchQuery) {
            const input = document.getElementById('chatSearchInput');
            if (input) {
                input.value = searchQuery;
                input.dispatchEvent(new Event('input'));
            }
        }
    }

    function clearSearch() {
        const input = document.getElementById('chatSearchInput');
        if (input) input.value = '';
        const btn = document.getElementById('clearSearchBtn');
        if (btn) btn.classList.add('hidden');
        const resultsBox = document.getElementById('searchResults');
        if (resultsBox) {
            resultsBox.classList.add('hidden');
            resultsBox.innerHTML = '';
        }
    }

    async function handleSearch(e, scope) {
        const term = e.target.value.toLowerCase().trim();
        if (scope === 'sidebar') {
            if (AppModules.Sidebar && typeof AppModules.Sidebar.handleSidebarSearch === 'function') {
                AppModules.Sidebar.handleSidebarSearch(e);
            }
            return;
        }
        if (scope !== 'chat') return;

        const resultsBox = document.getElementById('searchResults');
        const clearBtn = document.getElementById('clearSearchBtn');
        if (!term) {
            resultsBox.classList.add('hidden');
            clearBtn.classList.add('hidden');
            return;
        }

        clearBtn.classList.remove('hidden');
        resultsBox.innerHTML = '';

        const activeTargetId = getActiveTargetId();
        if (!activeTargetId) return;
        const currentUser = getCurrentUser();
        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);

        // Fetch all local messages for this chat from IndexedDB
        const allMsgs = await getLocalMessages(chatId);
        
        // Filter messages containing the search term
        const matches = allMsgs.filter(m => {
            if (!m.text) return false;
            // Exclude images/base64 strings
            if (m.type === 'image' || m.type === 'image_group' || m.text.startsWith('data:image')) return false;
            return m.text.toLowerCase().includes(term);
        });

        if (matches.length > 0) {
            resultsBox.classList.remove('hidden');
            matches.forEach(m => {
                const item = document.createElement('div');
                item.className = "p-3 pl-5 pr-10 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-white/5 transition-all group hover:bg-gray-50 dark:hover:bg-white/5";
                
                const escapedSnippet = escapeHTML(m.text);
                const escapedTerm = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                item.innerHTML = `<div class="text-[14px] line-clamp-2 text-black dark:text-white">${escapedSnippet.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<span class="text-[#007AFF] font-bold">$1</span>')}</div>`;
                
                item.onclick = () => {
                    const chatBox = document.getElementById('chatBox');
                    let msgEl = document.querySelector(`[data-key="${m.key}"]`);
                    if (!msgEl) {
                        const idx = currentLocalMsgs.findIndex(item => item.key === m.key);
                        if (idx !== -1) {
                            const nextMsgs = currentLocalMsgs.slice(idx);
                            chatBox.innerHTML = '';
                            loadedMsgKeys.clear();
                            
                            const batchFrag = document.createDocumentFragment();
                            nextMsgs.forEach(item => {
                                if (item.key) {
                                    loadedMsgKeys.add(item.key);
                                    const el = UIComponents.createChatBubble(item, item.key, currentUser, setupLongPress);
                                    if (el) batchFrag.appendChild(el);
                                }
                            });
                            chatBox.appendChild(batchFrag);
                            
                            currentDisplayMsgs = nextMsgs;
                            currentOldestLoadedKey = currentDisplayMsgs.length > 0 ? currentDisplayMsgs[0].key : null;
                            msgEl = document.querySelector(`[data-key="${m.key}"]`);
                        }
                    }

                    if (msgEl) {
                        const textDiv = msgEl.querySelector('div[class*="px-"]');
                        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (textDiv) window.UIUtils.highlight(textDiv);
                    }
                    resultsBox.classList.add('hidden');
                };
                resultsBox.appendChild(item);
            });
        } else {
            resultsBox.innerHTML = '<div class="p-4 text-[14px] text-gray-500 text-center font-medium">No Results Found</div>';
            resultsBox.classList.remove('hidden');
        }
    }

    function initChatListObserver() {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return;

        const pickFirstRegularChat = (chatMap) => {
            const map = chatMap || {};
            const myId = String(currentUser.id || '').toLowerCase();
            const activeTargetId = getActiveTargetId();
            const hasRegularActive = !!activeTargetId &&
                !safeIsExtensionTargetId(activeTargetId) &&
                activeTargetId !== 'safety_bot';

            if (hasRegularActive) return;

            const sorted = Object.keys(map)
                .filter(id => !id.includes('_gmail_') && !id.includes('_inst_'))
                .sort((a, b) => (map[b] || 0) - (map[a] || 0));

            const firstUserId = sorted.find(id => {
                const normalized = String(id || '').toLowerCase();
                return (
                    !safeIsExtensionTargetId(id) &&
                    normalized !== 'safety_bot' &&
                    normalized !== myId
                );
            });

            if (firstUserId) window.switchChat?.(firstUserId);
        };

        onValue(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), (snapshot) => {
            const chatMap = snapshot.val() || {};
            lastKnownChatMap = chatMap;
            const chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

            chatIds.forEach(id => {
                safeFetchUser(id).then(() => AppModules.Sidebar.renderSidebar()).catch(e => console.warn(e));
            });

            AppModules.Sidebar.renderSidebar();
            if (typeof initGlobalNotificationMonitor === 'function') initGlobalNotificationMonitor();
            AppModules.Bridge.initIRNavigatorNotificationBridge();

            if (window.innerWidth >= 800) {
                pickFirstRegularChat(chatMap);
            }
        });

        if (window._chatListResizeHandler) {
            window.removeEventListener('resize', window._chatListResizeHandler);
        }
        window._chatListResizeHandler = () => {
            const isDesktopWidth = window.innerWidth >= 800;
            const isMobileLayout = window.innerWidth < 800;
            const isFullDesktop = window.innerWidth >= 1024;
            const isMidRange = window.innerWidth >= 800 && window.innerWidth < 1024;

            // When shrinking into mobile layout (<800), default back to message list panel.
            if (!wasMobileLayout && isMobileLayout) {
                window.AppModules?.View?.showPanel?.('messages');
                document.querySelectorAll('#sidebarSubList div[id^="item-"]').forEach(div => {
                    div.classList.remove('active-chat-item');
                    div.classList.remove('hover:bg-gray-50/5', 'hover:bg-gray-50/50');
                    if (!div.classList.contains('hover:bg-black/5')) {
                        div.classList.add('hover:bg-black/5');
                    }
                    if (!div.classList.contains('dark:hover:bg-white/5')) {
                        div.classList.add('dark:hover:bg-white/5');
                    }
                });
            }

            if (wasFullDesktop && isMidRange) {
                const View = window.AppModules?.View;
                if (View) {
                    View.state.currentPanel = 'messages';
                    View.showPanel('messages');
                    View.refreshBottomNav('messages');
                }
            }

            if (!wasDesktopWidth && isDesktopWidth) {
                const View = window.AppModules?.View;
                if (View) {
                    View.state.currentPanel = 'messages';
                    View.showPanel('messages');
                    View.refreshBottomNav('messages');
                }
                pickFirstRegularChat(lastKnownChatMap);
            }

            wasMobileLayout = isMobileLayout;
            wasDesktopWidth = isDesktopWidth;
            wasFullDesktop = isFullDesktop;
        };
        window.addEventListener('resize', window._chatListResizeHandler);
    }

    function appendMsg(msg, key, chatId = null, saveToLocal = true) {
        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        if (activeTargetId && (chatId === activeTargetId || chatId === getChatId(currentUser.id, activeTargetId))) {
            AppModules.Notify.markAsRead(activeTargetId);
        }

        const div = UIComponents.createChatBubble(msg, key, currentUser, setupLongPress);
        if (!div) return;
        const chatBox = document.getElementById('chatBox');
        clearChatPlaceholders(chatBox);
        chatBox.appendChild(div);
        if (saveToLocal && chatId) saveMessageLocal(chatId, key, msg);
    }

    const MessageEngine = {
        commit: async function (msgData) {
            const targetId = getActiveTargetId();
            if (!targetId || !msgData) return;
            if (await blockIfRestrictedDirectTarget(targetId)) return null;

            const currentUser = getCurrentUser();
            const isGroup = targetId.startsWith('group_');
            const chatId = isGroup ? targetId : getChatId(currentUser.id, targetId);
            const msgObj = { senderId: currentUser.id, senderName: currentUser.name, timestamp: serverTimestamp(), ...msgData };

            const newMsgRef = push(ref(db, `messages/${chatId}`));
            await set(newMsgRef, msgObj);

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
            return newMsgRef.key;
        },

        sendText: async function (customVal = null) {
            const input = document.getElementById('u-msg');
            const val = (customVal || input.value).trim();
            if (!val) return;
            if (val.length > 8000) {
                await AppModules.Modal.alert("Too Long", "Message limit is 8000 chars.");
                return;
            }
            const lines = val.split(/\r\n|\r|\n/);
            if (lines.length > 50) {
                await AppModules.Modal.alert("Too Many Lines", "Message cannot exceed 50 lines.");
                return;
            }
            const msgData = { text: val, type: 'text' };
            if (currentQuote) {
                msgData.quote = currentQuote;
                clearQuote();
            }
            await this.commit(msgData);
            if (!customVal) {
                input.value = '';
                input.style.height = 'auto';
            }
        },

        sendImages: async function (base64s) {
            if (!base64s || !base64s.length) return;
            const imageUrls = await Promise.all(base64s.map(b => uploadImageToStorage(b, 'chats')));
            const msgKey = await this.commit({ text: JSON.stringify(imageUrls), type: 'image_group' });

            const currentUser = getCurrentUser();
            if (msgKey && currentUser && !AppModules.User.isAdmin()) {
                const uidLower = currentUser.uid.toLowerCase();
                const targetId = getActiveTargetId();
                const isGroup = targetId.startsWith('group_');
                const chatId = isGroup ? targetId : getChatId(currentUser.id, targetId);
                try {
                    await update(ref(db, `user_image_index/${uidLower}/${msgKey}`), {
                        timestamp: serverTimestamp(),
                        chatId: chatId,
                        msgKey: msgKey,
                        imgCount: imageUrls.length
                    });
                } catch (e) {
                    console.error("Failed to update user_image_index:", e);
                }
            }
        }
    };

    async function sendMsg(type = 'text', customVal = null) {
        if (!AppModules.Security.checkRateLimit('msg', true)) return;
        const activeTargetId = getActiveTargetId();
        if (activeTargetId && activeTargetId.startsWith('group_')) {
            if (!getCnCache()[activeTargetId.replace('group_', '')]) {
                AppModules.Modal.alert("Disbanded", "Cannot message a disbanded class.");
                return;
            }
        }
        AppModules.Security.recordRateLimit('msg');
        await MessageEngine.sendText(customVal);
    }

    function updateComposerPadding() {
        const chatBox = document.getElementById('chatBox');
        const composer = document.getElementById('chatComposerWrap');
        if (!chatBox || !composer) return;
        const composerH = composer.getBoundingClientRect().height;
        const basePadding = window.innerWidth < 768 ? 80 : 96;
        const needed = Math.max(basePadding, composerH + 20);
        chatBox.style.paddingBottom = `${needed}px`;
    }

    function setupChatInput() {
        const input = document.getElementById('u-msg');
        if (!input) return;

        let hasAlertedLimit = false;
        let resizeTimeout;

        const adjustHeight = () => {
            if (!input.value) {
                input.style.height = '';
                updateComposerPadding();
                return;
            }
            input.style.height = 'auto';
            const computedMaxHeight = parseInt(window.getComputedStyle(input).maxHeight, 10);
            const newHeight = Math.min(input.scrollHeight, computedMaxHeight || 128);
            input.style.height = `${newHeight}px`;
            updateComposerPadding();
        };

        const updatePlaceholder = () => {
            input.placeholder = window.innerWidth < 640
                ? "Type a message..."
                : "Type a message...Use Shift+Enter to change lines";
        };

        input.addEventListener('input', () => {
            adjustHeight();
            if (input.value.length > 8000) {
                if (!hasAlertedLimit) {
                    AppModules.Modal.alert("Limit Exceeded", "You have reached the 8000 character limit.");
                    hasAlertedLimit = true;
                }
            } else {
                hasAlertedLimit = false;
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMsg();
            }
        });

        window.addEventListener('resize', () => {
            updatePlaceholder();
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(adjustHeight, 50);
        });

        updatePlaceholder();
        setTimeout(adjustHeight, 100);
    }

    function handleImg(e) {
        return AppModules.Utils.Image.handleUploadEvent(e);
    }

    function mountChatUIEvents() {
        if (hasMountedUIEvents) return;
        hasMountedUIEvents = true;
        setupChatInput();

        // Initialize Liquid Glass effect on the chat input pill
        const chatInputPill = document.getElementById('chatInputPill');
        if (chatInputPill) {
            new LiquidGlassEffect(chatInputPill, {
                radius: 24,            // matches rounded-[24px]
                refractionWidth: 12,   // width of the liquid edge bevel
                maxDisplacement: 8,    // warp refraction amount
                mouseRadius: 55,       // hover ripple size
                mouseStrength: 6       // hover ripple bulge size
            });
        }

        // Initialize Liquid Glass effect on the camera FAB button
        const chatCameraBtn = document.getElementById('chatCameraBtn');
        if (chatCameraBtn) {
            new LiquidGlassEffect(chatCameraBtn, {
                radius: 22,            // matches 44px diameter
                refractionWidth: 8,    // width of the liquid edge bevel
                maxDisplacement: 5,    // warp refraction amount
                mouseRadius: 40,       // hover ripple size
                mouseStrength: 4       // hover ripple bulge size
            });
        }
    }

    window.loadChatThread = loadChatThread;
    window.handleMsgCopy = handleMsgCopy;
    window.handleMsgQuote = handleMsgQuote;
    window.clearQuote = clearQuote;
    window.handleMsgForward = handleMsgForward;
    window.handleMsgReport = handleMsgReport;
    window.closeForwardPicker = closeForwardPicker;
    window.handleImg = handleImg;
    window.switchChat = switchChat;
    window.deleteChatRecord = deleteChatRecord;
    window.jumpToMessage = jumpToMessage;
    window.clearSearch = clearSearch;
    window.handleSearch = handleSearch;
    window.initChatListObserver = initChatListObserver;
    window.sendMsg = sendMsg;
    window.MessageEngine = MessageEngine;

    return {
        loadChatThread,
        appendMsg,
        setupLongPress,
        setupChatInput,
        mountChatUIEvents,
        handleImg,
        sendMsg,
        handleMsgCopy,
        handleMsgQuote,
        handleMsgForward,
        handleMsgReport,
        closeForwardPicker,
        clearQuote,
        switchChat,
        deleteChatRecord,
        jumpToMessage,
        clearSearch,
        handleSearch,
        initChatListObserver,
        forwardTo,
        getSelectedMsgData: () => selectedMsgData
    };
}
