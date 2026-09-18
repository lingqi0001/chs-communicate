import { LiquidGlassEffect } from './liquid-glass.js?v=20260612-1741';

export function initChatEngine(deps) {
    const {
        db, ref, push, set, get, update, query, orderByKey, startAfter, limitToLast, onChildAdded, onChildChanged, onChildRemoved, onValue, serverTimestamp, endBefore,
        UIComponents, AppModules, getChatId, getLocalMessages, saveMessageLocal, deleteMessageLocal, escapeHTML,
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
    let wasDesktopWidth = window.innerWidth >= 640;
    let wasMobileLayout = window.innerWidth < 640;
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
        const isMobile = window.innerWidth < 640;
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

        // Fetch recent messages from Firebase to reconcile with local cache (restores any messages deleted locally but still in Firebase)
        try {
            const remoteSnap = await get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50)));
            if (remoteSnap.exists()) {
                const remoteVal = remoteSnap.val() || {};
                const localKeySet = new Set((currentLocalMsgs || []).map(m => m.key));
                let hasMissing = false;
                for (const rKey of Object.keys(remoteVal)) {
                    if (!localKeySet.has(rKey)) {
                        const newMsg = { key: rKey, ...remoteVal[rKey] };
                        currentLocalMsgs.push(newMsg);
                        await saveMessageLocal(chatId, rKey, remoteVal[rKey]);
                        hasMissing = true;
                    }
                }
            }
        } catch (reconcileErr) {
            console.warn('[Chat] Message reconcile error:', reconcileErr);
        }

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

        const stopAdded = onChildAdded(q, (snap) => {
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

        const stopChanged = onChildChanged(q, (snap) => {
            const updatedMsg = snap.val();
            const msgKey = snap.key;
            if (!updatedMsg || !msgKey) return;

            // Save updated message locally
            saveMessageLocal(chatId, msgKey, updatedMsg);

            // If it's a doc message, update rendered bubble if present
            const oldEl = chatBox.querySelector(`[data-key="${msgKey}"]`);
            if (oldEl) {
                const newEl = UIComponents.createChatBubble(updatedMsg, msgKey, getCurrentUser(), setupLongPress);
                if (newEl) {
                    oldEl.replaceWith(newEl);
                }
            }
        });

        // A portfolio deletion is a real RTDB child removal. Mirror it into every
        // open client's cache and rendered chat instead of leaving a stale card.
        const stopRemoved = onChildRemoved(ref(db, `messages/${chatId}`), (snap) => {
            const msgKey = snap.key;
            if (!msgKey) return;

            deleteMessageLocal(chatId, msgKey).catch(err => {
                console.warn('[Chat] Could not remove deleted message from local cache:', err);
            });
            currentLocalMsgs = currentLocalMsgs.filter(message => message?.key !== msgKey);
            currentDisplayMsgs = currentDisplayMsgs.filter(message => message?.key !== msgKey);
            loadedMsgKeys.delete(msgKey);
            chatBox.querySelector(`[data-key="${msgKey}"]`)?.remove();
        });

        setStopCurrentChatListener(() => {
            stopAdded();
            stopChanged();
            stopRemoved();
        });

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
        if (!msgInput.value) {
            requestAnimationFrame(() => msgInput.dispatchEvent(new Event('input')));
        }
    }

    async function switchChat(targetId) {
        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        if (!targetId || targetId === currentUser.id) return;
        
        // Allow re-opening the same chat on mobile (when user clicks back and re-clicks contact)
        const isMobile = window.innerWidth < 640;
        if (targetId === activeTargetId && !isMobile) {
            // Clicking the chat that is already open is still a read action.
            // Previously this early return skipped the notification cleanup.
            AppModules.Notify.markAsRead(targetId);
            return;
        }
        
        if (safeIsExtensionTargetId(targetId)) {
            await safeOpenExtensionNotificationTarget(targetId);
            return;
        }

        safeSetActiveTargetId(targetId);

        const composerWrap = document.getElementById('chatComposerWrap');
        if (composerWrap) composerWrap.classList.remove('hidden');
        const chatSearchWrap = document.getElementById('chatSearchWrap');
        if (chatSearchWrap) chatSearchWrap.classList.remove('hidden');

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
                    if (getActiveTargetId() === targetId) {
                        titleEl.innerText = cData.name;
                        const wpTitleEl = document.getElementById('writingPortfolioTitle');
                        if (wpTitleEl) wpTitleEl.innerText = `WRITING PORTFOLIO - ${cData.name}`;
                    }
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
                if (user.name) {
                    titleEl.innerText = user.name;
                    const wpTitleEl = document.getElementById('writingPortfolioTitle');
                    if (wpTitleEl) wpTitleEl.innerText = `WRITING PORTFOLIO - ${user.name}`;
                }
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

        const writingBtn = document.getElementById('chatWritingBtn');
        if (writingBtn) {
            // Show writing button in chat if not safety bot
            if (targetId && targetId !== 'safety_bot') {
                writingBtn.classList.remove('hidden');
            } else {
                writingBtn.classList.add('hidden');
            }
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

        // If Writing Portfolio drawer is currently open, switch it to the newly active contact
        const writingDrawer = document.getElementById('writingPortfolioDrawer');
        if (writingDrawer && !writingDrawer.classList.contains('hidden') && !writingDrawer.classList.contains('translate-x-full')) {
            openWritingPortfolio();
        }
    }

    async function deleteChatRecord(targetId) {
        if (!await AppModules.Modal.confirm("Remove Chat", "Remove this chat from your list? Messages will not be deleted.", "Remove")) return;

        if (window.AppModules && window.AppModules.Notify && typeof window.AppModules.Notify.hideChat === 'function') {
            window.AppModules.Notify.hideChat(targetId);
        }

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

    function toggleChatSearch() {
        const wrap = document.getElementById('chatSearchWrap');
        const input = document.getElementById('chatSearchInput');
        const iconBtn = document.getElementById('chatSearchIconBtn');
        const leadingIcon = document.getElementById('chatSearchLeadingIcon');
        if (wrap) {
            wrap.classList.remove('w-8');
            wrap.classList.add('w-44');
        }
        if (iconBtn) iconBtn.classList.add('hidden');
        if (leadingIcon) leadingIcon.classList.remove('hidden');
        if (input) {
            input.classList.remove('hidden');
            setTimeout(() => input.focus(), 50);
        }
    }

    function maybeCollapseChatSearch() {
        const input = document.getElementById('chatSearchInput');
        setTimeout(() => {
            if (document.activeElement === input) return;
            const term = (input?.value || '').trim();
            if (term) return;
            const wrap = document.getElementById('chatSearchWrap');
            const iconBtn = document.getElementById('chatSearchIconBtn');
            const leadingIcon = document.getElementById('chatSearchLeadingIcon');
            const clearBtn = document.getElementById('clearSearchBtn');
            const resultsBox = document.getElementById('searchResults');
            if (wrap) {
                wrap.classList.remove('w-44');
                wrap.classList.add('w-8');
            }
            if (input) input.classList.add('hidden');
            if (leadingIcon) leadingIcon.classList.add('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
            if (iconBtn) iconBtn.classList.remove('hidden');
            if (resultsBox) {
                resultsBox.classList.add('hidden');
                resultsBox.innerHTML = '';
            }
        }, 150);
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
        maybeCollapseChatSearch();
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
                item.className = "p-3 pl-5 pr-10 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-white/5 transition-all group hover:bg-black/5 dark:hover:bg-white/10";
                
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

        let _chatListRenderTimer = null;
        onValue(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), (snapshot) => {
            const chatMap = snapshot.val() || {};
            lastKnownChatMap = chatMap;
            const chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

            const fetchPromises = chatIds.map(id => safeFetchUser(id).catch(e => console.warn(e)));
            Promise.all(fetchPromises).then(() => {
                if (_chatListRenderTimer) clearTimeout(_chatListRenderTimer);
                _chatListRenderTimer = setTimeout(() => {
                    AppModules.Sidebar.renderSidebar();
                    _chatListRenderTimer = null;
                }, 50);
            });
            if (typeof initGlobalNotificationMonitor === 'function') initGlobalNotificationMonitor();
            AppModules.Bridge.initIRNavigatorNotificationBridge();

            if (window.innerWidth >= 640) {
                pickFirstRegularChat(chatMap);
            }
        });

        if (window._chatListResizeHandler) {
            window.removeEventListener('resize', window._chatListResizeHandler);
        }
        window._chatListResizeHandler = () => {
            const isDesktopWidth = window.innerWidth >= 640;
            const isMobileLayout = window.innerWidth < 640;
            const isFullDesktop = window.innerWidth >= 1024;
            const isMidRange = window.innerWidth >= 640 && window.innerWidth < 1024;

            // When shrinking into phone layout (<640), default back to message list panel.
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

            if (window.AppModules && window.AppModules.Notify && typeof window.AppModules.Notify.unhideChat === 'function') {
                window.AppModules.Notify.unhideChat(targetId);
            }

            const currentUser = getCurrentUser();
            const isGroup = targetId.startsWith('group_');
            const chatId = isGroup ? targetId : getChatId(currentUser.id, targetId);
            const msgObj = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                ...(isGroup ? {} : { recipientId: targetId.toLowerCase() }),
                timestamp: serverTimestamp(),
                ...msgData
            };

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
            const newKey = await this.commit(msgData);
            if (!customVal) {
                input.value = '';
                input.style.height = 'auto';
            }

            // Auto-sync Google Doc metadata and created date in background
            if (val.includes('docs.google.com/document/d/') && newKey) {
                const match = val.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)[^\s]*/);
                if (match && typeof syncDocCardComments === 'function') {
                    setTimeout(() => {
                        syncDocCardComments(newKey, match[0], null).catch(err => {
                            console.warn('[GoogleDoc] Background auto-sync notice:', err);
                        });
                    }, 600);
                }
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
                // Measure the placeholder itself.  A one-line prompt keeps a
                // one-line composer; a wrapped prompt grows to two lines.
                input.style.height = 'auto';
                const styles = window.getComputedStyle(input);
                const lineHeight = parseFloat(styles.lineHeight) || 20;
                const padding = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
                const singleLineHeight = Math.ceil(lineHeight + padding);
                const computedMaxHeight = parseInt(styles.maxHeight, 10);
                const measuredHeight = Math.max(singleLineHeight, input.scrollHeight);
                // The empty composer follows its prompt for at most two lines;
                // it must never grow into a tall blank box in a narrow column.
                const twoLineHeight = Math.ceil(singleLineHeight + lineHeight);
                input.style.height = `${Math.min(measuredHeight, twoLineHeight, computedMaxHeight || 128)}px`;
                input.scrollTop = 0;
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
            const composerWidth = document.getElementById('chatInputPill')?.clientWidth || 0;
            input.placeholder = window.innerWidth < 640 || (composerWidth > 0 && composerWidth < 430)
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
        closeAttachMenu();
        return AppModules.Utils.Image.handleUploadEvent(e);
    }

    let attachMenuCloseTimer = null;

    function toggleAttachMenu(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const menu = document.getElementById('attachMenu');
        const btn = document.getElementById('chatCameraBtn');
        if (!menu) return;

        clearTimeout(attachMenuCloseTimer);
        const isHidden = menu.classList.contains('hidden') || menu.classList.contains('menu-hidden');
        if (isHidden) {
            menu.classList.remove('hidden');
            menu.classList.add('menu-hidden');
            if (btn) btn.classList.add('attach-open');

            // Force layout reflow then pop in with spring
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    menu.classList.remove('menu-hidden');
                    menu.classList.add('menu-visible');
                });
            });
        } else {
            closeAttachMenu();
        }
    }

    function closeAttachMenu() {
        const menu = document.getElementById('attachMenu');
        const btn = document.getElementById('chatCameraBtn');
        if (btn) {
            btn.classList.remove('attach-open');
        }
        if (menu && !menu.classList.contains('hidden') && !menu.classList.contains('menu-hidden')) {
            menu.classList.remove('menu-visible');
            menu.classList.add('menu-hidden');
            clearTimeout(attachMenuCloseTimer);
            attachMenuCloseTimer = setTimeout(() => {
                menu.classList.add('hidden');
            }, 230);
        }
    }

    function triggerPhotoUpload() {
        closeAttachMenu();
        if (safeGetIsPhotoDisabled()) {
            AppModules.Modal.alert("Photos Disabled", "Photo uploads are currently disabled.");
            return;
        }
        const fileInput = document.getElementById('chatImageFileInput');
        if (fileInput) fileInput.click();
    }

    async function openAddGoogleDocDialog() {
        closeAttachMenu();
        const url = await AppModules.Modal.prompt(
            "Add Google Doc",
            "Paste your Google Doc sharing link below.<br><span class='text-xs text-gray-400'>Make sure link access is set to 'Anyone with the link can comment'</span>",
            ""
        );
        if (!url || !url.trim()) return;

        const trimmed = url.trim();
        if (!trimmed.includes('docs.google.com/document/d/')) {
            AppModules.Modal.alert("Invalid Link", "Please provide a valid Google Doc URL (e.g. https://docs.google.com/document/d/...)");
            return;
        }

        // Send Google Doc link directly to chat
        await sendMsg('text', trimmed);
    }

    // Google Doc Card Expand / Collapse with Smooth Transition
    function toggleDocCommentsExpand(key, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // First try finding within the clicked card container (to handle duplicate cards or modal drawer cleanly)
        const btn = e && e.currentTarget ? e.currentTarget : null;
        const container = btn ? btn.closest('.doc-card-container') : null;
        
        const drawer = (container ? container.querySelector('[id^="docDrawer-"]') : null) || document.getElementById(`docDrawer-${key}`);
        const arrow = (container ? container.querySelector('[id^="docArrow-"]') : null) || document.getElementById(`docArrow-${key}`);
        if (!drawer) return;

        const isExpanded = drawer.classList.contains('expanded');
        if (!isExpanded) {
            drawer.classList.remove('hidden');
            void drawer.offsetHeight; // Force reflow so grid-template-rows transition triggers from 0fr
            drawer.classList.add('expanded');
            if (arrow) arrow.style.transform = 'rotate(180deg)';

            // Auto-sync: Check if document has never been synced or last sync was > 3 minutes ago
            try {
                const docId = container ? container.getAttribute('data-doc-id') : null;
                const docUrl = container ? container.getAttribute('data-doc-url') : null;
                if (docId && docUrl) {
                    const cached = window._docCache?.[docId];
                    const lastSynced = cached?.lastSyncedAt || 0;
                    const now = Date.now();
                    const THREE_MINUTES = 3 * 60 * 1000;
                    if (now - lastSynced > THREE_MINUTES) {
                        // Trigger background silent sync
                        syncDocCardComments(key, docUrl, null, null, true);
                    }
                }
            } catch (syncErr) {
                console.warn('[DocAutoSync] Error checking auto-sync freshness:', syncErr);
            }
        } else {
            drawer.classList.remove('expanded');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                if (!drawer.classList.contains('expanded')) {
                    drawer.classList.add('hidden');
                }
            }, 350);
        }
    }

    // Google Doc Card Comments Filter (All / Open / Resolved)
    function filterDocComments(key, filterType, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const btn = e && e.currentTarget ? e.currentTarget : null;
        const container = btn ? btn.closest('.doc-card-container') : (document.getElementById(`docDrawer-${key}`)?.closest('.doc-card-container') || document);

        const btnAll = container.querySelector(`#filterBtn-${key}-all`);
        const btnOpen = container.querySelector(`#filterBtn-${key}-open`);
        const btnResolved = container.querySelector(`#filterBtn-${key}-resolved`);

        const activeClasses = ['bg-[#007AFF]', 'text-white', 'shadow-sm'];
        const inactiveClasses = ['text-gray-500', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-white/5'];

        [btnAll, btnOpen, btnResolved].forEach(b => {
            if (b) {
                b.classList.remove(...activeClasses);
                b.classList.add(...inactiveClasses);
            }
        });

        const targetBtn = filterType === 'open' ? btnOpen : (filterType === 'resolved' ? btnResolved : btnAll);
        if (targetBtn) {
            targetBtn.classList.remove(...inactiveClasses);
            targetBtn.classList.add(...activeClasses);
        }

        const rows = container.querySelectorAll(`.comment-item-row[data-card-key="${key}"]`);
        let visibleCount = 0;
        rows.forEach(row => {
            const isResolved = row.getAttribute('data-resolved') === 'true';
            let show = true;
            if (filterType === 'open' && isResolved) show = false;
            if (filterType === 'resolved' && !isResolved) show = false;

            if (show) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });

        const emptyEl = container.querySelector(`#commentEmpty-${key}`);
        if (emptyEl) {
            if (visibleCount === 0) {
                emptyEl.classList.remove('hidden');
                emptyEl.innerText = filterType === 'open' ? '🎉 All comments have been resolved!' : (filterType === 'resolved' ? 'No resolved comments yet.' : 'No comments found.');
            } else {
                emptyEl.classList.add('hidden');
            }
        }
    }

    // Google Doc Card Comments Synchronization (supports silent auto-sync)
    async function syncDocCardComments(key, docUrl, e, explicitChatId = null, isSilent = false) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const badge = document.getElementById(`docBadge-${key}`);
        const list = document.getElementById(`docList-${key}`);
        const drawer = document.getElementById(`docDrawer-${key}`);
        const arrow = document.getElementById(`docArrow-${key}`);

        const prevBadgeText = badge ? badge.innerText : '';
        if (!isSilent && badge) badge.innerText = "Syncing...";

        try {
            // Call Cloud Function or fallback to local fetch
            const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            const docId = match ? match[1] : null;
            if (!docId) throw new Error("Invalid document ID");

            // Determine active chatId
            const currentUser = getCurrentUser();
            const activeTargetId = getActiveTargetId();
            const computedChatId = explicitChatId || lastChatId || (activeTargetId ? (activeTargetId.startsWith('group_') ? activeTargetId : getChatId(currentUser.id, activeTargetId)) : null);

            let resData = null;
            const payload = { 
                url: docUrl,
                chatId: computedChatId,
                messageKey: key
            };

            if (window.httpsCallable && window.firebaseFunctions) {
                const fetchFn = window.httpsCallable(window.firebaseFunctions, 'fetchGoogleDocComments');
                const res = await fetchFn(payload);
                resData = res.data;
            } else if (window.firebase && window.firebase.functions) {
                const fetchFn = window.firebase.functions().httpsCallable('fetchGoogleDocComments');
                const res = await fetchFn(payload);
                resData = res.data;
            }

            if (!resData || !resData.success) {
                const errDetail = resData?.error || 'Cloud function returned no data';
                if (!isSilent) {
                    if (badge) badge.innerText = "Error";
                    AppModules.Modal.alert("Sync Notice", `Unable to sync comments: ${errDetail}`);
                } else if (badge && prevBadgeText) {
                    badge.innerText = prevBadgeText;
                }
                return;
            }

            // Ensure lastSyncedAt is stamped
            resData.lastSyncedAt = resData.lastSyncedAt || Date.now();

            // Store in global memory cache
            window._docCache = window._docCache || {};
            window._docCache[docId] = resData;

            // Update badge & title and drawer for ALL cards in current view sharing the same docId
            const count = resData.commentsCount || 0;
            const comments = resData.comments || [];
            let openCount = 0;
            let resolvedCount = 0;
            comments.forEach(c => {
                if (c.resolved) resolvedCount++;
                else openCount++;
            });

            let badgeText = 'Google Doc';
            if (count > 0) {
                if (openCount > 0) {
                    badgeText = count === 1 ? `1 comment (${openCount} open)` : `${count} comments (${openCount} open)`;
                } else {
                    badgeText = count === 1 ? `1 comment (resolved)` : `${count} comments (all resolved)`;
                }
            }
            
            // Query all doc cards on screen matching this docId
            const docCards = document.querySelectorAll(`[data-doc-id="${docId}"]`);
            docCards.forEach(cardEl => {
                cardEl.setAttribute('data-open-count', openCount);
                cardEl.setAttribute('data-total-comments', count);

                // Find message key from parent container or inner elements
                const cardBadge = cardEl.querySelector('[id^="docBadge-"]');
                const cardTitle = cardEl.querySelector('[id^="docTitle-"]');
                const cardList = cardEl.querySelector('[id^="docList-"]');
                const cardDrawer = cardEl.querySelector('[id^="docDrawer-"]');
                const cardArrow = cardEl.querySelector('[id^="docArrow-"]');

                const cardDate = cardEl.querySelector('[id^="docDate-"]');
                if (cardDate && resData.createdTime) {
                    const cStr = new Date(resData.createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    cardDate.innerText = `Created ${cStr}`;
                    cardDate.classList.remove('hidden');
                }

                if (cardBadge) cardBadge.innerText = badgeText;
                if (cardTitle && resData.title) {
                    cardTitle.innerText = resData.title;
                    cardTitle.title = resData.title;
                }

                if (cardList && resData.comments) {
                    const cKey = cardList.id.replace('docList-', '');
                    cardList.innerHTML = UIComponents.renderDocCommentsHtml(cKey, resData.comments, count, openCount, resolvedCount, docId, docUrl);

                    // For the clicked card specifically, automatically open drawer to show results
                    if (cardDrawer && cardList.id === `docList-${key}` && (!cardDrawer.classList.contains('expanded') || cardDrawer.classList.contains('hidden'))) {
                        cardDrawer.classList.remove('hidden');
                        void cardDrawer.offsetHeight;
                        cardDrawer.classList.add('expanded');
                        if (cardArrow) cardArrow.style.transform = 'rotate(180deg)';
                    }
                }
            });

            // Update any portfolio date labels on screen matching this docId
            if (resData.createdTime) {
                const formattedDate = new Date(resData.createdTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const pfDateEls = document.querySelectorAll(`[id="portfolio-date-${docId}"]`);
                pfDateEls.forEach(el => {
                    el.innerText = `Created: ${formattedDate}`;
                });
            }

            // Also persist to all matching messages in local IndexedDB
            if (computedChatId) {
                try {
                    const localMessages = await getLocalMessages(computedChatId);
                    for (const targetMsg of localMessages) {
                        if (targetMsg && targetMsg.text && targetMsg.text.includes(docId)) {
                            targetMsg.docData = {
                                title: resData.title,
                                fileId: resData.fileId,
                                docUrl: resData.docUrl,
                                commentsCount: resData.commentsCount,
                                comments: resData.comments,
                                createdTime: resData.createdTime || null,
                                modifiedTime: resData.modifiedTime || null,
                                lastSyncedAt: resData.lastSyncedAt || Date.now()
                            };
                            await saveMessageLocal(computedChatId, targetMsg.key, targetMsg);
                        }
                    }
                } catch (dbSaveErr) {
                    console.warn('[DocSync] Failed to save updated docData to local DB:', dbSaveErr);
                }
            }

        } catch (err) {
            console.error("Sync comments error:", err);
            if (badge) badge.innerText = "Check access";
            
            const botEmail = "chscommunication@appspot.gserviceaccount.com";
            const noticeHtml = `
                <div class="text-left text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed space-y-2.5">
                    <div>To load comments, please set doc sharing to <b>"Anyone with the link can comment"</b>, or add the bot as a <b>Commenter</b>:</div>
                    <div class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <span class="text-[11px] font-mono select-all break-all text-black dark:text-white flex-1">${botEmail}</span>
                        <button type="button" onclick="navigator.clipboard.writeText('${botEmail}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500);" class="px-2.5 py-1 text-xs font-semibold bg-[#007AFF] text-white rounded-lg active:scale-95 transition-all flex-shrink-0">Copy</button>
                    </div>
                </div>
            `;
            AppModules.Modal.alert("Sync Notice", noticeHtml);
        }
    }

    // Close attach menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('attachMenu');
        const btn = document.getElementById('chatCameraBtn');
        if (menu && !menu.classList.contains('hidden')) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                closeAttachMenu();
            }
        }
    });

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

        // Initialize Liquid Glass effect on the attachment popover menu
        const attachMenu = document.getElementById('attachMenu');
        if (attachMenu) {
            new LiquidGlassEffect(attachMenu, {
                radius: 22,
                refractionWidth: 10,
                maxDisplacement: 6,
                mouseRadius: 50,
                mouseStrength: 5
            });
        }
    }

    function toggleQuoteText(quoteId, btn, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const box = document.getElementById(quoteId);
        if (!box) return;
        const isClamped = box.classList.contains('line-clamp-2');
        if (isClamped) {
            box.classList.remove('line-clamp-2');
            if (btn) btn.innerText = "Collapse";
        } else {
            box.classList.add('line-clamp-2');
            if (btn) btn.innerText = "Expand";
        }
    }

    async function openWritingPortfolio(targetMsgKey = null) {
        const drawer = document.getElementById('writingPortfolioDrawer');
        const content = document.getElementById('writingPortfolioContent');
        const subtitle = document.getElementById('writingPortfolioSubtitle');

        if (!drawer || !content) return;

        drawer.classList.remove('hidden');
        requestAnimationFrame(() => {
            drawer.classList.remove('translate-x-full');
        });

        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        if (!activeTargetId) return;

        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);

        let chatPartnerName = "";
        const chatTitleEl = document.getElementById('chatTitle');
        if (chatTitleEl && chatTitleEl.innerText.trim()) {
            chatPartnerName = chatTitleEl.innerText.trim();
        } else if (isGroup) {
            const classId = activeTargetId.replace('group_', '');
            chatPartnerName = getCnCache()[classId] || "Class Group";
        } else {
            chatPartnerName = (getAllUsers() || {})[activeTargetId]?.name || activeTargetId;
        }

        const titleEl = document.getElementById('writingPortfolioTitle');
        if (titleEl) {
            titleEl.innerText = chatPartnerName ? `WRITING PORTFOLIO - ${chatPartnerName}` : `WRITING PORTFOLIO`;
        }

        if (subtitle) {
            subtitle.innerText = '';
        }

        content.innerHTML = `
            <div class="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
                <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                <span class="text-xs font-medium">Scanning writing history...</span>
            </div>
        `;

        const requestTargetId = activeTargetId;

        try {
            // Retrieve all messages for this chat (merge local IndexedDB with Firebase RTDB for 100% sync)
            let localMsgs = (await getLocalMessages(chatId)) || [];
            const msgMap = new Map();
            localMsgs.forEach(m => {
                if (m && m.key) msgMap.set(m.key, m);
            });

            try {
                const snap = await get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(150)));
                if (snap.exists()) {
                    const val = snap.val();
                    Object.keys(val).forEach(k => {
                        msgMap.set(k, { key: k, ...val[k] });
                    });
                }
            } catch (e) {
                console.warn('[WritingPortfolio] Firebase query fallback error:', e);
            }

            localMsgs = Array.from(msgMap.values());

            // Ensure user hasn't switched to another chat while fetching
            if (getActiveTargetId() !== requestTargetId) return;

            const rawDocMsgs = (localMsgs || []).filter(m => {
                if (!m) return false;
                if (m.docData) return true;
                const text = m.text || '';
                return text.includes('docs.google.com/document/d/');
            }).sort((a, b) => {
                const timeA = a.docData?.createdTime ? new Date(a.docData.createdTime).getTime() : (a.timestamp || 0);
                const timeB = b.docData?.createdTime ? new Date(b.docData.createdTime).getTime() : (b.timestamp || 0);
                return timeB - timeA;
            });

            // Deduplicate: multiple cards sharing the same doc link/ID should only appear once
            // Also maintain a map of docId -> all corresponding message keys
            const seenDocIds = new Set();
            const docMessages = [];
            const docIdToKeys = new Map();

            for (let i = 0; i < rawDocMsgs.length; i++) {
                const m = rawDocMsgs[i];
                const text = m.text || '';
                const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
                const docId = m.docData?.fileId || (match ? match[1] : (m.key || `doc-${i}`));
                m._portfolioDocId = docId;

                if (!docIdToKeys.has(docId)) {
                    docIdToKeys.set(docId, []);
                }
                if (m.key) {
                    docIdToKeys.get(docId).push(m.key);
                }

                if (!seenDocIds.has(docId)) {
                    seenDocIds.add(docId);
                    docMessages.push(m);
                }
            }

            // Save docIdToKeys mapping for quick message lookup on delete
            window._portfolioDocIdToKeys = docIdToKeys;

            // Clear any legacy deleted docs blacklists so re-sent documents immediately show
            try {
                localStorage.removeItem(`writing_deleted_docs_${chatId}`);
                if (activeTargetId !== chatId) localStorage.removeItem(`writing_deleted_docs_${activeTargetId}`);
            } catch (e) {}

            const activeDocMessages = docMessages;

            if (activeDocMessages.length === 0) {
                content.innerHTML = `
                    <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 text-gray-400">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        </div>
                        <div class="font-semibold text-sm text-black dark:text-white">No Google Docs Found</div>
                        <div class="text-xs mt-1 text-gray-400">Documents shared with ${UIUtils.escape(chatPartnerName)} will appear here in chronological order.</div>
                    </div>
                `;
                return;
            }

            // 1. Fetch manual project assignments
            let assignedProjects = {};
            try {
                const projSnap = await get(ref(db, `writing_projects/${chatId}`));
                if (projSnap.exists()) {
                    assignedProjects = projSnap.val() || {};
                }
            } catch (e) {
                // Ignore permission/offline warnings gracefully
            }

            window._writingProjectsCache = window._writingProjectsCache || {};
            window._writingProjectsCache[chatId] = assignedProjects;


            // 2. Separate into manually grouped projects and standalone docs
            const projectMap = new Map();
            const standaloneItems = [];
            let totalPortfolioOpen = 0;

            activeDocMessages.forEach((m, idx) => {
                const key = m.key || `doc-${idx}`;
                const docId = m._portfolioDocId || key;
                const cachedDoc = (docId && window._docCache?.[docId]) || m.docData || null;
                const rawTitle = cachedDoc?.title || 'Google Document';

                const comments = cachedDoc?.comments || [];
                let openCount = 0;
                let resolvedCount = 0;
                comments.forEach(c => {
                    if (c.resolved) resolvedCount++;
                    else openCount++;
                });
                totalPortfolioOpen += openCount;

                // Timeline uses the document's writing date; first share is only a fallback.
                const writingDate = cachedDoc?.createdTime ? new Date(cachedDoc.createdTime).getTime() : 0;
                const firstSharedAt = m.timestamp || 0;
                const lastFeedbackAt = comments.reduce((latest, comment) => {
                    const when = comment?.createdTime ? new Date(comment.createdTime).getTime() : 0;
                    return Math.max(latest, Number.isFinite(when) ? when : 0);
                }, 0);
                const itemTime = writingDate || firstSharedAt;

                // Manual assignment check
                const manualAssign = assignedProjects[docId] || null;
                const projectName = manualAssign && manualAssign.projectName ? manualAssign.projectName.trim() : null;
                const versionLabel = manualAssign && manualAssign.versionLabel ? manualAssign.versionLabel.trim() : 'Draft';
                const versionOrder = manualAssign && manualAssign.versionOrder !== undefined ? Number(manualAssign.versionOrder) : 1;

                const itemObj = {
                    msg: m,
                    key: key,
                    docId: docId,
                    rawTitle: rawTitle,
                    cachedDoc: cachedDoc,
                    versionLabel: versionLabel,
                    versionOrder: versionOrder,
                    openCount: openCount,
                    resolvedCount: resolvedCount,
                    itemTime: itemTime,
                    writingDate: writingDate,
                    firstSharedAt: firstSharedAt,
                    lastFeedbackAt: lastFeedbackAt,
                    isGrouped: !!projectName
                };

                if (projectName) {
                    const normKey = projectName.toLowerCase().trim();
                    if (!projectMap.has(normKey)) {
                        projectMap.set(normKey, {
                            projectName: projectName,
                            items: [],
                            hasOpen: false,
                            hasResolved: false,
                            latestTime: 0
                        });
                    }
                    const pGroup = projectMap.get(normKey);
                    if (openCount > 0) pGroup.hasOpen = true;
                    if (resolvedCount > 0) pGroup.hasResolved = true;
                    if (itemTime > pGroup.latestTime) pGroup.latestTime = itemTime;
                    pGroup.items.push(itemObj);
                } else {
                    standaloneItems.push(itemObj);
                }
            });

            // Offer only conservative, user-confirmed project suggestions: two or
            // more ungrouped files with the same normalized title and a version label.
            const suggestionBuckets = new Map();
            standaloneItems.forEach(item => {
                const parsed = parseDocVersion(item.rawTitle);
                if (parsed.versionLabel === 'Doc') return;
                const normalized = parsed.baseTitle.toLowerCase().replace(/\s+/g, ' ').trim();
                if (!normalized) return;
                if (!suggestionBuckets.has(normalized)) suggestionBuckets.set(normalized, { projectName: parsed.baseTitle, items: [] });
                suggestionBuckets.get(normalized).items.push({ ...item, parsed });
            });
            const groupingSuggestions = Array.from(suggestionBuckets.values())
                .filter(suggestion => suggestion.items.length >= 2);

            // Sort projects by most recent activity
            const sortedProjects = Array.from(projectMap.values()).sort((a, b) => b.latestTime - a.latestTime);
            const totalCount = sortedProjects.length + standaloneItems.length;

            // Cache active portfolio data globally for seamless tab switching and export
            window._activePortfolioData = {
                chatId: chatId,
                chatPartnerName: chatPartnerName,
                totalCount: totalCount,
                totalPortfolioOpen: totalPortfolioOpen,
                sortedProjects: sortedProjects,
                standaloneItems: standaloneItems,
                groupingSuggestions: groupingSuggestions,
                docMessages: activeDocMessages,
                currentTab: 'cards',
                feedbackFilter: 'all',
                authorFilter: 'all'
            };

            let html = `
                <!-- Writing Portfolio Top Header Controls: Views & Actions -->
                <div class="space-y-2.5 mb-4 max-w-full overflow-x-hidden">
                    <!-- Row 1: 3-Mode Segmented View Switcher & Export Button -->
                    <div class="flex flex-wrap items-center justify-between gap-2 px-0.5">
                        <!-- Mode Tabs (Cards / Comments / Timeline) -->
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl flex-shrink-0">
                            <button type="button" onclick="window.switchPortfolioView('cards', this)" id="portfolioViewTab-cards" class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                <span>Cards</span>
                            </button>
                            <button type="button" onclick="window.switchPortfolioView('comments', this)" id="portfolioViewTab-comments" class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <span>Comments</span>
                            </button>
                            <button type="button" onclick="window.switchPortfolioView('timeline', this)" id="portfolioViewTab-timeline" class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>Timeline</span>
                            </button>
                        </div>

                        <!-- Right Actions: Export Button -->
                        <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
                            <button type="button" onclick="window.openPortfolioExportModal()" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2C2C2E] hover:text-[#007AFF] dark:hover:text-[#0A84FF] shadow-sm transition-all" title="Export complete writing history">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>Export</span>
                            </button>
                        </div>
                    </div>

                    <!-- Row 2: Contextual Filter Bar for Cards View -->
                    <div id="portfolioFilterBarCards" class="flex flex-wrap items-center justify-between gap-2 px-0.5">
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl flex-shrink-0">
                            <button type="button" onclick="window.filterPortfolioFeedback('all', this)" class="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all">All Documents</button>
                            <button type="button" onclick="window.filterPortfolioFeedback('open', this)" class="px-3 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <span>Opened</span>
                                ${totalPortfolioOpen > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/15 text-[#007AFF] dark:bg-[#0A84FF]/25 dark:text-[#0A84FF] leading-none">${totalPortfolioOpen}</span>` : ''}
                            </button>
                            <button type="button" onclick="window.filterPortfolioFeedback('resolved', this)" class="px-3 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">Resolved</button>
                        </div>
                    </div>

                    <!-- Row 2 (Alt): Contextual Author & Status Filter Bar for Comments View -->
                    <div id="portfolioFilterBarComments" class="hidden flex flex-wrap items-center justify-between gap-2 px-1">
                        <!-- Author Filter Chips -->
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl">
                            <button type="button" onclick="window.filterPortfolioAuthor('all', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all">All Feedback</button>
                            <button type="button" onclick="window.filterPortfolioAuthor('teacher', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Teachers</span>
                            </button>
                            <button type="button" onclick="window.filterPortfolioAuthor('student', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Students</span>
                            </button>
                            <button type="button" onclick="window.filterPortfolioAuthor('peer', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Peer Review</span>
                            </button>
                        </div>

                        <!-- Status Filter Chips -->
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl">
                            <button type="button" onclick="window.filterPortfolioCommentStatus('all', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all">All</button>
                            <button type="button" onclick="window.filterPortfolioCommentStatus('open', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">Open</button>
                            <button type="button" onclick="window.filterPortfolioCommentStatus('resolved', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">Resolved</button>
                        </div>
                    </div>
                </div>

                ${groupingSuggestions.map((suggestion, index) => `
                    <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/10 border border-[#007AFF]/15 dark:border-[#0A84FF]/20">
                        <div class="min-w-0">
                            <div class="text-[12px] font-bold text-[#007AFF] dark:text-[#0A84FF]">Possible versions of ${UIUtils.escape(suggestion.projectName)}</div>
                            <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${suggestion.items.map(item => UIUtils.escape(item.parsed.versionLabel)).join(' · ')} — group these ${suggestion.items.length} documents?</div>
                        </div>
                        <button type="button" onclick="window.acceptPortfolioGroupingSuggestion(${index})" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#007AFF] hover:bg-[#0062cc] text-white transition-colors">Group</button>
                    </div>
                `).join('')}

                <!-- VIEW 1: CARDS VIEW (Standard Grouped / Versioned Documents) -->
                <div id="portfolioCardsView" class="space-y-4">
            `;

            // Render Manually Grouped Writing Projects
            sortedProjects.forEach((proj, pIdx) => {
                const projId = `proj-${pIdx}`;
                // Sort versions by versionOrder ascending (Draft 1 -> Draft 2 -> Final)
                proj.items.sort((a, b) => a.versionOrder - b.versionOrder || a.itemTime - b.itemTime);

                const lastIdx = proj.items.length - 1; // Default to latest version

                html += `
                    <div id="${projId}" data-has-open="${proj.hasOpen ? 'true' : 'false'}" data-has-resolved="${proj.hasResolved ? 'true' : 'false'}" class="portfolio-group-item bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 text-left">
                        <!-- Project Header & Version Stepper -->
                        <div id="projHeader-${projId}" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-9 h-9 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-[16px] font-bold text-black dark:text-white truncate">${UIUtils.escape(proj.projectName)}</h3>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-[12px] text-gray-400 font-medium">${proj.items.length} ${proj.items.length === 1 ? 'Version' : 'Versions'}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Version Stepper Tabs -->
                            <div class="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl overflow-x-auto scrollbar-none">
                                ${proj.items.map((item, vIdx) => {
                                    const isActive = vIdx === lastIdx;
                                    return `
                                        <button type="button" onclick="window.switchProjectVersion('${projId}', ${vIdx}, event)" id="projTab-${projId}-${vIdx}" class="px-3 py-1 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}">
                                            ${UIUtils.escape(item.versionLabel)}
                                        </button>
                                    `;
                                }).join(proj.items.length > 1 ? '<span class="text-[11px] text-gray-300 dark:text-white/20 select-none px-0.5">→</span>' : '')}
                            </div>
                        </div>

                        <!-- Version Cards Container -->
                        <div id="projContainer-${projId}" class="mt-3">
                            ${proj.items.map((item, vIdx) => {
                                const isVisible = vIdx === lastIdx;
                                const pkey = `portfolio-${item.key}`;
                                const createdTime = item.cachedDoc?.createdTime;
                                let dateDisplay = '';
                                if (createdTime) {
                                    const formatted = new Date(createdTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    dateDisplay = `Created: ${formatted}`;
                                } else if (item.msg.timestamp) {
                                    const formatted = new Date(item.msg.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    dateDisplay = `Shared: ${formatted}`;
                                }
                                const cardHtml = UIComponents.renderDocCard(item.msg, pkey, false);

                                return `
                                    <div id="projVer-${projId}-${vIdx}" data-item-key="${item.key}" class="${isVisible ? '' : 'hidden'}">
                                        <div class="flex items-center justify-between text-[12px] font-medium text-gray-400 px-1 mb-1.5">
                                            <span id="portfolio-date-${item.docId}" data-msg-key="${item.key}">${dateDisplay}</span>
                                            <div class="flex items-center gap-2.5">
                                                <button type="button" onclick="window.openProjectAssignModal('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event)" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline transition-colors" title="Edit version or ungroup">
                                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    <span>Edit Project / Version</span>
                                                </button>
                                                <button type="button" onclick="window.deletePortfolioCard('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event, '${item.key}')" class="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-red-500 transition-colors" title="Delete card from writing portfolio">
                                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                    <span>Delete</span>
                                                </button>
                                                <span class="text-[12px] text-gray-400">${UIUtils.escape(item.msg.senderName || '')}</span>
                                            </div>
                                        </div>
                                        <div id="portfolio-item-${item.key}">
                                            ${cardHtml}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            });

            // Render Standalone (Unassigned) Documents
            standaloneItems.forEach(item => {
                const pkey = `portfolio-${item.key}`;
                const createdTime = item.cachedDoc?.createdTime;
                let dateDisplay = '';
                if (createdTime) {
                    const formatted = new Date(createdTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    dateDisplay = `Created: ${formatted}`;
                } else if (item.msg.timestamp) {
                    const formatted = new Date(item.msg.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    dateDisplay = `Shared: ${formatted}`;
                }
                const cardHtml = UIComponents.renderDocCard(item.msg, pkey, false);

                html += `
                    <div id="portfolio-item-${item.key}" data-has-open="${item.openCount > 0 ? 'true' : 'false'}" data-has-resolved="${item.resolvedCount > 0 ? 'true' : 'false'}" class="portfolio-group-item w-full">
                        <div class="flex items-center justify-between text-[12px] font-medium text-gray-400 px-1 mb-1.5">
                            <span id="portfolio-date-${item.docId}" data-msg-key="${item.key}">${dateDisplay}</span>
                            <div class="flex items-center gap-2.5">
                                <button type="button" onclick="window.openProjectAssignModal('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event)" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline transition-colors" title="Add this document to a Writing Project">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                        <line x1="12" y1="11" x2="12" y2="17"></line>
                                        <line x1="9" y1="14" x2="15" y2="14"></line>
                                    </svg>
                                    <span>Add to Project</span>
                                </button>
                                <button type="button" onclick="window.deletePortfolioCard('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event, '${item.key}')" class="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-red-500 transition-colors" title="Delete card from writing portfolio">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <span>Delete</span>
                                </button>
                                <span class="text-[12px] text-gray-400">${UIUtils.escape(item.msg.senderName || '')}</span>
                            </div>
                        </div>
                        ${cardHtml}
                    </div>
                `;
            });

            html += `
                </div>
                <div id="portfolioFeedbackEmpty" class="hidden py-8 text-center text-xs text-gray-400 dark:text-gray-500"></div>

                <!-- VIEW 2: COMMENTS VIEW (All-Year Feedback Stream with Author Filters) -->
                <div id="portfolioCommentsView" class="hidden space-y-3">
                    <!-- Populated dynamically via renderPortfolioCommentsContent() -->
                </div>

                <!-- VIEW 3: TIMELINE VIEW (Full-Year Monthly Writing Milestones) -->
                <div id="portfolioTimelineView" class="hidden space-y-6">
                    <!-- Populated dynamically via renderPortfolioTimelineContent() -->
                </div>
            `;
            content.innerHTML = html;

            if (targetMsgKey) {
                setTimeout(() => {
                    // If target message is inside a multi-version project, switch to its version tab first
                    const verWrapper = document.querySelector(`[data-item-key="${targetMsgKey}"]`);
                    if (verWrapper && verWrapper.id) {
                        const mMatch = verWrapper.id.match(/^projVer-([a-zA-Z0-9_-]+)-(\d+)$/);
                        if (mMatch) {
                            const pId = mMatch[1];
                            const vIdx = parseInt(mMatch[2], 10);
                            switchProjectVersion(pId, vIdx, null);
                        }
                    }

                    const targetEl = document.getElementById(`portfolio-item-${targetMsgKey}`);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Also auto-expand comments if target with smooth accordion animation
                        const drawer = document.getElementById(`docDrawer-portfolio-${targetMsgKey}`) || targetEl.querySelector('[id^="docDrawer-"]');
                        const arrow = document.getElementById(`docArrow-portfolio-${targetMsgKey}`) || targetEl.querySelector('[id^="docArrow-"]');
                        if (drawer && (!drawer.classList.contains('expanded') || drawer.classList.contains('hidden'))) {
                            drawer.classList.remove('hidden');
                            void drawer.offsetHeight;
                            drawer.classList.add('expanded');
                            if (arrow) arrow.style.transform = 'rotate(180deg)';
                        }
                    }
                }, 150);
            }
        } catch (err) {
            console.error('[WritingPortfolio] Failed to load timeline:', err);
            content.innerHTML = `<div class="p-6 text-center text-xs text-red-500">Failed to load writing history.</div>`;
        }
    }

    // Switch between Cards View, Comments View, and Timeline View
    function switchPortfolioView(viewName, btnEl) {
        const pData = window._activePortfolioData;
        if (pData) pData.currentTab = viewName;

        // Update tab buttons
        const tabCards = document.getElementById('portfolioViewTab-cards');
        const tabComments = document.getElementById('portfolioViewTab-comments');
        const tabTimeline = document.getElementById('portfolioViewTab-timeline');
        const allTabs = [tabCards, tabComments, tabTimeline].filter(Boolean);

        allTabs.forEach(t => {
            t.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
            t.classList.add('text-gray-500', 'dark:text-gray-400');
        });

        const activeBtn = btnEl || document.getElementById(`portfolioViewTab-${viewName}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            activeBtn.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
        }

        // View containers
        const cardsView = document.getElementById('portfolioCardsView');
        const commentsView = document.getElementById('portfolioCommentsView');
        const timelineView = document.getElementById('portfolioTimelineView');
        const filterCards = document.getElementById('portfolioFilterBarCards');
        const filterComments = document.getElementById('portfolioFilterBarComments');
        const emptyEl = document.getElementById('portfolioFeedbackEmpty');

        if (emptyEl) emptyEl.classList.add('hidden');

        if (viewName === 'cards') {
            if (cardsView) cardsView.classList.remove('hidden');
            if (commentsView) commentsView.classList.add('hidden');
            if (timelineView) timelineView.classList.add('hidden');
            if (filterCards) filterCards.classList.remove('hidden');
            if (filterComments) filterComments.classList.add('hidden');
        } else if (viewName === 'comments') {
            if (cardsView) cardsView.classList.add('hidden');
            if (commentsView) commentsView.classList.remove('hidden');
            if (timelineView) timelineView.classList.add('hidden');
            if (filterCards) filterCards.classList.add('hidden');
            if (filterComments) filterComments.classList.remove('hidden');
            renderPortfolioCommentsContent();
        } else if (viewName === 'timeline') {
            if (cardsView) cardsView.classList.add('hidden');
            if (commentsView) commentsView.classList.add('hidden');
            if (timelineView) timelineView.classList.remove('hidden');
            if (filterCards) filterCards.classList.add('hidden');
            if (filterComments) filterComments.classList.add('hidden');
            renderPortfolioTimelineContent();
        }
    }

    // Classify comment author into 'teacher', 'student', or 'peer'
    function classifyCommentAuthor(authorName, authorEmail, currentUserId) {
        const normName = (authorName || '').trim().toLowerCase();
        const normEmail = (authorEmail || '').trim().toLowerCase();

        if (normEmail.endsWith('@hcpss.org') || /^(mr|ms|mrs|dr)\.?\s/i.test(normName) || normName.includes('teacher') || normName.includes('instructor')) {
            return { role: 'teacher', label: 'Teacher' };
        }
        if (currentUserId && (normEmail.includes(currentUserId.toLowerCase()) || normName.includes(currentUserId.toLowerCase()))) {
            return { role: 'student', label: 'Author' };
        }
        if (normEmail.endsWith('@inst.hcpss.org')) {
            return { role: 'peer', label: 'Peer Reviewer' };
        }
        return { role: 'teacher', label: 'Teacher' };
    }

    // Render Comments View: All comments from all documents in this chat, sorted chronologically
    function renderPortfolioCommentsContent() {
        const container = document.getElementById('portfolioCommentsView');
        if (!container || !window._activePortfolioData) return;

        const { docMessages, authorFilter, commentStatusFilter } = window._activePortfolioData;
        const currentUser = getCurrentUser();
        const currentUserId = currentUser ? currentUser.id : '';

        // Extract all comments from all documents
        const allComments = [];
        docMessages.forEach(m => {
            const match = (m.text || '').match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
            const docId = m.docData?.fileId || (match ? match[1] : null);
            const cachedDoc = (docId && window._docCache?.[docId]) || m.docData || null;
            const docTitle = cachedDoc?.title || 'Google Document';
            const docUrl = m.docData?.docUrl || (match ? match[0] : (docId ? `https://docs.google.com/document/d/${docId}/edit` : ''));
            const comments = cachedDoc?.comments || [];

            comments.forEach(c => {
                const cTime = c.createdTime ? new Date(c.createdTime).getTime() : (m.timestamp || 0);
                const aName = c.author?.displayName || 'Reviewer';
                const aEmail = c.author?.emailAddress || '';
                const { role, label } = classifyCommentAuthor(aName, aEmail, currentUserId);

                allComments.push({
                    comment: c,
                    docId: docId,
                    docTitle: docTitle,
                    docUrl: docUrl,
                    authorName: aName,
                    authorEmail: aEmail,
                    authorRole: role,
                    roleLabel: label,
                    time: cTime,
                    resolved: !!c.resolved
                });
            });
        });

        // Sort comments chronologically descending (newest feedback first)
        allComments.sort((a, b) => b.time - a.time);

        const currentAuthor = authorFilter || 'all';
        const currentStatus = commentStatusFilter || 'all';

        const filtered = allComments.filter(item => {
            if (currentAuthor !== 'all' && item.authorRole !== currentAuthor) return false;
            if (currentStatus === 'open' && item.resolved) return false;
            if (currentStatus === 'resolved' && !item.resolved) return false;
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="py-12 text-center text-gray-400">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-gray-400">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div class="font-semibold text-sm text-black dark:text-white">No Comments Found</div>
                    <div class="text-xs mt-1 text-gray-400">Try adjusting your author or status filter.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(item => {
            const c = item.comment;
            const quoteVal = c.quotedFileContent?.value || '';
            const isResolved = item.resolved;
            const formattedDate = item.time ? new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            const commentDirectUrl = (item.docId && c.id)
                ? `https://docs.google.com/document/d/${item.docId}/edit?disco=${encodeURIComponent(c.id)}`
                : item.docUrl;

            // Role badge styling
            let roleBadgeClass = 'bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]';
            if (item.authorRole === 'peer') {
                roleBadgeClass = 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
            } else if (item.authorRole === 'student') {
                roleBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
            }

            let quoteHtml = '';
            if (quoteVal) {
                quoteHtml = `
                    <div class="mb-2 pl-3 border-l-2 border-[#007AFF]/40 dark:border-[#0A84FF]/50 text-left py-0.5">
                        <div class="text-[12px] text-gray-600 dark:text-gray-300 italic line-clamp-2">“${UIUtils.escape(quoteVal)}”</div>
                    </div>
                `;
            }

            let repliesHtml = '';
            if (c.replies && c.replies.length > 0) {
                repliesHtml = c.replies.map(r => `
                    <div class="mt-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 text-[12px]">
                        <span class="font-semibold text-black dark:text-white">${UIUtils.escape(r.author?.displayName || 'User')}:</span>
                        <span class="text-gray-600 dark:text-gray-300 ml-1">${UIUtils.escape(r.content || '')}</span>
                    </div>
                `).join('');
            }

            return `
                <div class="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-4 text-left">
                    <!-- Doc Reference & Date -->
                    <div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/5">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2 h-2 rounded-full ${isResolved ? 'bg-gray-300 dark:bg-white/20' : 'bg-[#007AFF] dark:bg-[#0A84FF]'} flex-shrink-0"></span>
                            <span class="text-[13px] font-bold text-black dark:text-white truncate">${UIUtils.escape(item.docTitle)}</span>
                        </div>
                        <span class="text-[11px] text-gray-400 whitespace-nowrap">${formattedDate}</span>
                    </div>

                    ${quoteHtml}

                    <!-- Author Info & Direct Google Doc link -->
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <div class="flex items-center gap-2">
                            <span class="text-[14px] font-semibold text-black dark:text-white">${UIUtils.escape(item.authorName)}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeClass}">${item.roleLabel}</span>
                            ${isResolved ? '<span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Resolved</span>' : ''}
                        </div>
                        <a href="${UIUtils.escape(commentDirectUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline" title="Jump to this comment in Google Doc">
                            <span>View Doc</span>
                            <svg class="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                    </div>

                    <div class="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed">${UIUtils.escape(c.content || '')}</div>
                    ${repliesHtml}
                </div>
            `;
        }).join('');
    }

    // Filter Comments View by Author (all / teacher / student / peer)
    function filterPortfolioAuthor(authorRole, btnEl) {
        if (!window._activePortfolioData) return;
        window._activePortfolioData.authorFilter = authorRole;

        if (btnEl && btnEl.parentElement) {
            const buttons = btnEl.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btnEl.classList.remove('text-gray-500', 'dark:text-gray-400');
            btnEl.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
        }
        renderPortfolioCommentsContent();
    }

    // Filter Comments View by Status (all / open / resolved)
    function filterPortfolioCommentStatus(status, btnEl) {
        if (!window._activePortfolioData) return;
        window._activePortfolioData.commentStatusFilter = status;

        if (btnEl && btnEl.parentElement) {
            const buttons = btnEl.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btnEl.classList.remove('text-gray-500', 'dark:text-gray-400');
            btnEl.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
        }
        renderPortfolioCommentsContent();
    }

    // Render Timeline View: Monthly breakdown of projects, drafts, final versions, comment counts, and dates
    function renderPortfolioTimelineContent() {
        const container = document.getElementById('portfolioTimelineView');
        if (!container || !window._activePortfolioData) return;

        const { sortedProjects, standaloneItems } = window._activePortfolioData;

        // Flatten all versions and items with their target times
        const allTimelineEntries = [];
        sortedProjects.forEach(proj => {
            proj.items.forEach(item => {
                allTimelineEntries.push({
                    projectName: proj.projectName,
                    versionLabel: item.versionLabel,
                    isFinal: /final/i.test(item.versionLabel),
                    isDraft: /draft/i.test(item.versionLabel),
                    time: item.itemTime || 0,
                    dateSource: item.writingDate ? 'Writing date' : 'First shared',
                    lastFeedbackAt: item.lastFeedbackAt || 0,
                    docId: item.docId,
                    rawTitle: item.rawTitle,
                    openCount: item.openCount,
                    resolvedCount: item.resolvedCount,
                    totalComments: item.openCount + item.resolvedCount,
                    key: item.key,
                    msg: item.msg
                });
            });
        });

        standaloneItems.forEach(item => {
            const isFinal = /final/i.test(item.versionLabel) || /final/i.test(item.rawTitle);
            allTimelineEntries.push({
                projectName: item.rawTitle,
                versionLabel: item.versionLabel || (isFinal ? 'Final' : 'Draft'),
                isFinal: isFinal,
                isDraft: !isFinal,
                time: item.itemTime || 0,
                dateSource: item.writingDate ? 'Writing date' : 'First shared',
                lastFeedbackAt: item.lastFeedbackAt || 0,
                docId: item.docId,
                rawTitle: item.rawTitle,
                openCount: item.openCount,
                resolvedCount: item.resolvedCount,
                totalComments: item.openCount + item.resolvedCount,
                key: item.key,
                msg: item.msg
            });
        });

        // Sort descending by time
        allTimelineEntries.sort((a, b) => b.time - a.time);

        if (allTimelineEntries.length === 0) {
            container.innerHTML = `
                <div class="py-12 text-center text-gray-400">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-gray-400">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div class="font-semibold text-sm text-black dark:text-white">No Writing Timeline Available</div>
                </div>
            `;
            return;
        }

        // Group by Month (e.g. "September 2026", "August 2026")
        const monthGroups = new Map();
        allTimelineEntries.forEach(entry => {
            const dateObj = entry.time ? new Date(entry.time) : new Date();
            const monthKey = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
            if (!monthGroups.has(monthKey)) {
                monthGroups.set(monthKey, []);
            }
            monthGroups.get(monthKey).push(entry);
        });

        let timelineHtml = '';
        monthGroups.forEach((entries, monthName) => {
            timelineHtml += `
                <div class="portfolio-timeline-month text-left">
                    <!-- Month Title Header -->
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-2.5 h-2.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]"></div>
                        <h4 class="text-[15px] font-bold text-black dark:text-white tracking-wide">${UIUtils.escape(monthName)}</h4>
                        <span class="text-[11px] font-semibold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">${entries.length} ${entries.length === 1 ? 'Milestone' : 'Milestones'}</span>
                    </div>

                    <!-- Timeline Vertical Line & Nodes -->
                    <div class="relative pl-6 ml-1.5 border-l-2 border-gray-200 dark:border-white/10 space-y-3">
                        ${entries.map(entry => {
                            const dateStr = entry.time ? new Date(entry.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                            const isFinal = entry.isFinal;
                            const versionTagClass = isFinal 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400' 
                                : 'bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]';

                            return `
                                <div class="relative bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-3.5 hover:border-[#007AFF]/50 transition-colors">
                                    <!-- Timeline Node Circle -->
                                    <div class="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full ${isFinal ? 'bg-emerald-500 ring-4 ring-white dark:ring-black' : 'bg-[#007AFF] ring-4 ring-white dark:ring-black'}"></div>

                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${versionTagClass}">${UIUtils.escape(entry.versionLabel)}</span>
                                                <h5 class="text-[14px] font-bold text-black dark:text-white truncate">${UIUtils.escape(entry.projectName)}</h5>
                                            </div>
                                        </div>

                                        <!-- Date & Comment Count Badges -->
                                        <div class="flex items-center gap-2.5 sm:self-center">
                                            <div class="flex items-center gap-1.5">
                                                <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                    <svg class="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                    <span>${entry.totalComments}</span>
                                                </span>
                                                ${entry.openCount > 0 ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:bg-[#0A84FF]/25 dark:text-[#0A84FF]">${entry.openCount} open</span>` : ''}
                                            </div>
                                            <span class="text-[11px] text-gray-400 whitespace-nowrap" title="${entry.dateSource}; last feedback is tracked separately">${entry.dateSource} · ${dateStr}</span>
                                            <button type="button" onclick="window.switchPortfolioView('cards'); setTimeout(() => { const el = document.getElementById('portfolio-item-${entry.key}'); if(el) el.scrollIntoView({behavior:'smooth', block:'center'}); }, 100);" class="text-[#007AFF] dark:text-[#0A84FF] hover:underline text-[12px] font-semibold ml-1">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = timelineHtml;
    }

    // Open Portfolio Export Modal and generate pristine printable dossier
    function openPortfolioExportModal() {
        const modal = document.getElementById('portfolioExportModal');
        const card = document.getElementById('portfolioExportCard');
        const body = document.getElementById('portfolioExportBody');
        const pData = window._activePortfolioData;

        if (!modal || !card || !body || !pData) return;

        const currentUser = getCurrentUser();
        const studentName = currentUser?.name || 'Student';
        const partnerName = pData.chatPartnerName || 'Instructor';
        const exportDateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

        // Collect all documents and full comment histories
        let dossierHtml = `
            <div id="portfolioPrintableArea" class="space-y-6">
                <!-- Academic Header Dossier -->
                <div class="border-b border-gray-200 dark:border-white/10 pb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-black dark:text-white uppercase tracking-wider">Writing Portfolio Dossier</h2>
                            <p class="text-xs text-gray-400 mt-0.5">CHS Communication • Comprehensive Academic Writing Record</p>
                        </div>
                        <div class="text-right text-[11px] text-gray-400">
                            <div><b>Date:</b> ${exportDateStr}</div>
                            <div><b>Student:</b> ${UIUtils.escape(studentName)}</div>
                            <div><b>Course / Partner:</b> ${UIUtils.escape(partnerName)}</div>
                        </div>
                    </div>
                </div>

                <!-- Projects & Versions List -->
                <div class="space-y-6">
        `;

        pData.docMessages.forEach((m, idx) => {
            const match = (m.text || '').match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
            const docId = m.docData?.fileId || (match ? match[1] : null);
            const cachedDoc = (docId && window._docCache?.[docId]) || m.docData || null;
            const docTitle = cachedDoc?.title || 'Google Document';
            const docUrl = m.docData?.docUrl || (match ? match[0] : (docId ? `https://docs.google.com/document/d/${docId}/edit` : ''));
            const comments = cachedDoc?.comments || [];

            const manualAssign = (window._writingProjectsCache && window._writingProjectsCache[pData.chatId]?.[docId]) || null;
            const projectName = manualAssign?.projectName || docTitle;
            const versionLabel = manualAssign?.versionLabel || (/final/i.test(docTitle) ? 'Final' : 'Draft');
            const createdTime = cachedDoc?.createdTime ? new Date(cachedDoc.createdTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (m.timestamp ? new Date(m.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

            dossierHtml += `
                <div class="border border-gray-200 dark:border-white/10 rounded-xl p-4 bg-gray-50/50 dark:bg-white/[0.02] space-y-3">
                    <div class="flex items-start justify-between gap-3 border-b border-gray-200/60 dark:border-white/5 pb-2.5">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] uppercase">${UIUtils.escape(versionLabel)}</span>
                                <h3 class="text-sm font-bold text-black dark:text-white">${UIUtils.escape(projectName)}</h3>
                            </div>
                            <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                <span><b>Document:</b> ${UIUtils.escape(docTitle)}</span>
                                <span class="mx-2">•</span>
                                <span><b>Date:</b> ${createdTime}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <a href="${UIUtils.escape(docUrl)}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-semibold text-[#007AFF] hover:underline">
                                Google Doc Link ↗
                            </a>
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div class="space-y-2 pt-1">
                        <div class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Feedback & Comments (${comments.length})
                        </div>
            `;

            if (comments.length === 0) {
                dossierHtml += `
                    <div class="text-[11px] text-gray-400 italic py-1">No recorded comments on this document.</div>
                `;
            } else {
                dossierHtml += comments.map(c => {
                    const quoteVal = c.quotedFileContent?.value || '';
                    const aName = c.author?.displayName || 'Instructor';
                    const isResolved = !!c.resolved;
                    const cDate = c.createdTime ? new Date(c.createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                    let quoteBlock = '';
                    if (quoteVal) {
                        quoteBlock = `
                            <div class="pl-2.5 border-l-2 border-gray-300 dark:border-white/20 text-[11px] text-gray-600 dark:text-gray-300 italic mb-1.5">
                                “${UIUtils.escape(quoteVal)}”
                            </div>
                        `;
                    }

                    let repliesBlock = '';
                    if (c.replies && c.replies.length > 0) {
                        repliesBlock = c.replies.map(r => `
                            <div class="mt-1.5 pl-2.5 border-l-2 border-[#007AFF]/30 dark:border-[#0A84FF]/30 text-[11px]">
                                <span class="font-semibold text-black dark:text-white">${UIUtils.escape(r.author?.displayName || 'Student')}:</span>
                                <span class="text-gray-600 dark:text-gray-300 ml-1">${UIUtils.escape(r.content || '')}</span>
                            </div>
                        `).join('');
                    }

                    return `
                        <div class="bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/5 rounded-lg p-2.5 text-left">
                            ${quoteBlock}
                            <div class="flex items-center justify-between text-[11px] mb-1">
                                <div class="flex items-center gap-1.5">
                                    <span class="font-semibold text-black dark:text-white">${UIUtils.escape(aName)}</span>
                                    <span class="text-[10px] px-1.5 py-0.2 rounded font-medium ${isResolved ? 'bg-gray-100 dark:bg-white/10 text-gray-400' : 'bg-[#007AFF]/10 text-[#007AFF]'}">${isResolved ? 'Resolved' : 'Open'}</span>
                                </div>
                                <span class="text-[10px] text-gray-400">${cDate}</span>
                            </div>
                            <div class="text-[12px] text-gray-800 dark:text-gray-200">${UIUtils.escape(c.content || '')}</div>
                            ${repliesBlock}
                        </div>
                    `;
                }).join('');
            }

            dossierHtml += `
                    </div>
                </div>
            `;
        });

        dossierHtml += `
                </div>
            </div>
        `;

        body.innerHTML = dossierHtml;

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            card.classList.remove('scale-95');
            card.classList.add('scale-100');
        });
    }

    function closePortfolioExportModal() {
        const modal = document.getElementById('portfolioExportModal');
        const card = document.getElementById('portfolioExportCard');
        if (!modal || !card) return;

        card.classList.remove('scale-100');
        card.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 150);
    }

    function printPortfolioDossier() {
        const bodyEl = document.getElementById('portfolioExportBody');
        if (!bodyEl) {
            window.print();
            return;
        }

        // Create an isolated hidden iframe for clean, reliable printing across all browsers/PWAs
        let printIframe = document.getElementById('portfolioPrintIframe');
        if (printIframe) {
            printIframe.remove();
        }

        printIframe = document.createElement('iframe');
        printIframe.id = 'portfolioPrintIframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = 'none';
        document.body.appendChild(printIframe);

        const contentHtml = bodyEl.innerHTML;
        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow.document;

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Writing Portfolio Dossier</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #111827;
                        background: #ffffff;
                        padding: 24px;
                    }
                    h2 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
                    h3 { font-size: 14px; font-weight: 700; }
                    h4 { font-size: 12px; font-weight: 700; }
                    .border-b { border-bottom: 1px solid #e5e7eb; }
                    .border { border: 1px solid #e5e7eb; }
                    .rounded-xl { border-radius: 12px; }
                    .rounded-lg { border-radius: 8px; }
                    .rounded { border-radius: 4px; }
                    .p-4 { padding: 16px; }
                    .p-2\\.5 { padding: 10px; }
                    .pb-4 { padding-bottom: 16px; }
                    .pb-2\\.5 { padding-bottom: 10px; }
                    .pt-1 { padding-top: 4px; }
                    .mt-0\\.5 { margin-top: 2px; }
                    .mt-1 { margin-top: 4px; }
                    .mt-1\\.5 { margin-top: 6px; }
                    .mb-1 { margin-bottom: 4px; }
                    .mb-1\\.5 { margin-bottom: 6px; }
                    .mx-2 { margin-left: 8px; margin-right: 8px; }
                    .space-y-6 > * + * { margin-top: 24px; }
                    .space-y-3 > * + * { margin-top: 12px; }
                    .space-y-2 > * + * { margin-top: 8px; }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .items-start { align-items: flex-start; }
                    .justify-between { justify-content: space-between; }
                    .gap-3 { gap: 12px; }
                    .gap-2 { gap: 8px; }
                    .gap-1\\.5 { gap: 6px; }
                    .text-right { text-align: right; }
                    .text-xs { font-size: 11px; color: #6b7280; }
                    .text-gray-400 { color: #9ca3af; }
                    .text-gray-500 { color: #6b7280; }
                    .text-gray-600 { color: #4b5563; }
                    .text-gray-800 { color: #1f2937; }
                    .uppercase { text-transform: uppercase; }
                    .tracking-wider { letter-spacing: 0.05em; }
                    .font-bold { font-weight: 700; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    .italic { font-style: italic; }
                    .bg-gray-50\\/50 { background: #f9fafb; }
                    .border-l-2 { border-left-width: 2px; border-left-style: solid; border-left-color: #d1d5db; padding-left: 10px; }
                    a { color: #007aff; text-decoration: none; font-weight: 600; font-size: 11px; }
                    @page { margin: 15mm; size: auto; }
                </style>
            </head>
            <body>
                ${contentHtml}
            </body>
            </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
            try {
                printIframe.contentWindow.focus();
                printIframe.contentWindow.print();
            } catch (err) {
                console.error('[Portfolio] Iframe print failed, falling back to window.print():', err);
                window.print();
            } finally {
                setTimeout(() => {
                    if (printIframe) printIframe.remove();
                }, 3000);
            }
        }, 300);
    }

    // Version switcher within a Writing Project
    function switchProjectVersion(projId, targetIndex, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const container = document.getElementById(`projContainer-${projId}`);
        const header = document.getElementById(`projHeader-${projId}`);
        if (!container) return;

        const verViews = container.querySelectorAll(`[id^="projVer-${projId}-"]`);
        verViews.forEach((vEl, idx) => {
            if (idx === targetIndex) {
                vEl.classList.remove('hidden');
            } else {
                vEl.classList.add('hidden');
            }
        });

        if (header) {
            const tabs = header.querySelectorAll(`[id^="projTab-${projId}-"]`);
            tabs.forEach((tab, idx) => {
                if (idx === targetIndex) {
                    tab.classList.remove('text-gray-500', 'dark:text-gray-400');
                    tab.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                } else {
                    tab.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                    tab.classList.add('text-gray-500', 'dark:text-gray-400');
                }
            });
        }
    }

    // Filter projects in Writing Portfolio (All / Open / Resolved)
    function filterPortfolioFeedback(filterType, btnEl) {
        const content = document.getElementById('writingPortfolioContent');
        if (!content) return;

        if (btnEl && btnEl.parentElement) {
            const buttons = btnEl.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btnEl.classList.remove('text-gray-500', 'dark:text-gray-400');
            btnEl.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
        }

        const projectItems = content.querySelectorAll('.portfolio-group-item');
        let visibleCount = 0;
        projectItems.forEach(item => {
            const hasOpen = item.getAttribute('data-has-open') === 'true';
            const hasResolved = item.getAttribute('data-has-resolved') === 'true';

            let show = true;
            if (filterType === 'open') {
                show = hasOpen;
            } else if (filterType === 'resolved') {
                show = hasResolved;
            }

            if (show) {
                item.classList.remove('hidden');
                visibleCount++;
                if (filterType === 'open') {
                    const cards = item.querySelectorAll('.doc-card-container');
                    cards.forEach(card => {
                        const openCount = parseInt(card.getAttribute('data-open-count') || '0', 10);
                        if (openCount > 0) {
                            const drawer = card.querySelector('[id^="docDrawer-"]');
                            const arrow = card.querySelector('[id^="docArrow-"]');
                            if (drawer && !drawer.classList.contains('expanded')) {
                                drawer.classList.remove('hidden');
                                void drawer.offsetHeight;
                                drawer.classList.add('expanded');
                                if (arrow) arrow.style.transform = 'rotate(180deg)';
                            }
                            const cardKey = card.querySelector('[id^="docList-"]')?.id.replace('docList-', '');
                            if (cardKey && typeof filterDocComments === 'function') {
                                filterDocComments(cardKey, 'open', null);
                            }
                        }
                    });
                }
            } else {
                item.classList.add('hidden');
            }
        });

        const emptyEl = document.getElementById('portfolioFeedbackEmpty');
        if (emptyEl) {
            if (visibleCount === 0) {
                emptyEl.classList.remove('hidden');
                emptyEl.innerText = filterType === 'open' ? '🎉 All projects have zero pending comments!' : (filterType === 'resolved' ? 'No resolved projects found.' : 'No documents found.');
            } else {
                emptyEl.classList.add('hidden');
            }
        }
    }

    // Helper: Parse title for version indicators (Draft 1, Draft 2, Final, v1, etc.)
    function parseDocVersion(rawTitle) {
        if (!rawTitle) return { baseTitle: 'Untitled Document', versionLabel: 'Doc', versionOrder: 0, isFinal: false };
        const title = rawTitle.trim();

        // Check prefix patterns e.g. "Draft 1 - Romeo and Juliet", "[Draft 1] Romeo and Juliet", "Peer Review - Macbeth"
        const prefixPatterns = [
            { re: /^(?:\[|\()?(?:draft|d)\s*(\d+)(?:\]|\))?[\s\-_–—:]+/i, orderFromMatch: m => parseInt(m[1], 10), labelFromMatch: m => `Draft ${m[1]}` },
            { re: /^(?:\[|\()?(?:final(?:\s*(?:draft|submission|version|paper|copy))?|\bfinal\b)(?:\]|\))?[\s\-_–—:]+/i, label: 'Final', order: 99, isFinal: true },
            { re: /^(?:\[|\()?peer\s*review(?:\]|\))?[\s\-_–—:]+/i, label: 'Peer Review', order: 1.5 }
        ];

        for (const p of prefixPatterns) {
            const match = title.match(p.re);
            if (match) {
                const stripped = title.replace(p.re, '').trim().replace(/^[\s\-_–—:]+/, '').trim();
                const baseTitle = stripped || title;
                const label = p.label || (p.labelFromMatch ? p.labelFromMatch(match) : 'Draft');
                const order = p.order !== undefined ? p.order : (p.orderFromMatch ? p.orderFromMatch(match) : 1);
                return {
                    baseTitle,
                    versionLabel: label,
                    versionOrder: order,
                    isFinal: !!p.isFinal
                };
            }
        }

        const patterns = [
            // Final variants: "Final Draft", "Final Submission", "Final Paper", "Final"
            { re: /[\s\-_–—(]+(?:final(?:\s*(?:draft|submission|version|paper|copy))?|\bfinal\b)[\s)\]]*$/i, label: 'Final', order: 99, isFinal: true },
            // Draft with numbers: "Draft 1", "Draft 2", "Draft 3", "d1", "d2"
            { re: /[\s\-_–—(]+(?:draft|d)\s*(\d+)[\s)\]]*$/i, orderFromMatch: m => parseInt(m[1], 10), labelFromMatch: m => `Draft ${m[1]}` },
            // Rough draft / First draft
            { re: /[\s\-_–—(]+(?:rough\s*draft|first\s*draft|1st\s*draft)[\s)\]]*$/i, label: 'Draft 1', order: 1 },
            // Second draft
            { re: /[\s\-_–—(]+(?:second\s*draft|2nd\s*draft)[\s)\]]*$/i, label: 'Draft 2', order: 2 },
            // Third draft
            { re: /[\s\-_–—(]+(?:third\s*draft|3rd\s*draft)[\s)\]]*$/i, label: 'Draft 3', order: 3 },
            // Version numbers: v1, v2, v2.0, ver 1
            { re: /[\s\-_–—(]+v(?:er(?:sion)?)?\s*(\d+(?:\.\d+)?)[\s)\]]*$/i, orderFromMatch: m => parseFloat(m[1]), labelFromMatch: m => `v${m[1]}` },
            // Revisions: Rev 1, Revision 2
            { re: /[\s\-_–—(]+rev(?:ision)?\s*(\d+)[\s)\]]*$/i, orderFromMatch: m => parseInt(m[1], 10), labelFromMatch: m => `Rev ${m[1]}` },
            // Peer review
            { re: /[\s\-_–—(]+peer\s*review[\s)\]]*$/i, label: 'Peer Review', order: 1.5 },
            // Standalone draft at the end
            { re: /[\s\-_–—(]+draft[\s)\]]*$/i, label: 'Draft', order: 1 }
        ];

        for (const p of patterns) {
            const match = title.match(p.re);
            if (match) {
                const stripped = title.replace(p.re, '').trim().replace(/[\s\-_–—]+$/, '').trim();
                const baseTitle = stripped || title;
                const label = p.label || (p.labelFromMatch ? p.labelFromMatch(match) : 'Draft');
                const order = p.order !== undefined ? p.order : (p.orderFromMatch ? p.orderFromMatch(match) : 1);
                return {
                    baseTitle,
                    versionLabel: label,
                    versionOrder: order,
                    isFinal: !!p.isFinal
                };
            }
        }

        return {
            baseTitle: title,
            versionLabel: 'Doc',
            versionOrder: 0,
            isFinal: false
        };
    }

    function closeWritingPortfolio() {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer) return;

        drawer.classList.add('translate-x-full');
        setTimeout(() => {
            drawer.classList.add('hidden');
        }, 380);
    }

    async function acceptPortfolioGroupingSuggestion(suggestionIndex) {
        const portfolio = window._activePortfolioData;
        const suggestion = portfolio?.groupingSuggestions?.[suggestionIndex];
        if (!portfolio || !suggestion) return;

        const updates = {};
        suggestion.items.forEach(item => {
            updates[item.docId] = {
                projectName: suggestion.projectName,
                versionLabel: item.parsed.versionLabel,
                versionOrder: item.parsed.versionOrder,
                updatedAt: Date.now()
            };
        });

        try {
            await update(ref(db, `writing_projects/${portfolio.chatId}`), updates);
            await openWritingPortfolio();
        } catch (err) {
            console.error('[WritingPortfolio] Failed to apply grouping suggestion:', err);
            AppModules.Modal.alert('Error', 'Could not group these suggested versions.');
        }
    }

    // ==========================================
    // IN-PANEL WRITING PROJECT ASSIGNMENT DIALOG
    // (Scoped directly inside writingPortfolioDrawer, no full screen)
    // ==========================================
    let _activeProjectAssignDoc = null;

    function openProjectAssignModal(docId, rawTitle = '', e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        if (!activeTargetId) return;

        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);

        const cachedProjects = (window._writingProjectsCache && window._writingProjectsCache[chatId]) || {};
        const currentAssign = cachedProjects[docId] || null;

        _activeProjectAssignDoc = {
            docId,
            rawTitle,
            chatId,
            isGrouped: !!(currentAssign && currentAssign.projectName)
        };

        const modal = document.getElementById('portfolioProjectModal');
        const card = document.getElementById('portfolioProjectCard');
        const titleEl = document.getElementById('portfolioProjectModalTitle');
        const docNameEl = document.getElementById('portfolioProjectDocName');
        const inputProj = document.getElementById('portfolioInputProjectName');
        const inputVer = document.getElementById('portfolioInputVersionLabel');
        const btnUngroup = document.getElementById('portfolioBtnUngroup');

        if (!modal || !card) return;

        if (titleEl) {
            titleEl.innerText = currentAssign?.projectName ? 'Edit Project / Version' : 'Add to Project';
        }
        if (docNameEl) {
            docNameEl.innerText = rawTitle || 'Google Document';
        }
        if (inputProj) {
            // Pre-fill project name with current or parsed baseTitle
            const parsed = parseDocVersion(rawTitle);
            inputProj.value = currentAssign?.projectName || parsed.baseTitle || '';
        }
        if (inputVer) {
            const parsed = parseDocVersion(rawTitle);
            inputVer.value = currentAssign?.versionLabel || parsed.versionLabel || 'Draft 1';
        }
        if (btnUngroup) {
            if (currentAssign?.projectName) {
                btnUngroup.classList.remove('hidden');
            } else {
                btnUngroup.classList.add('hidden');
            }
        }

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            card.classList.remove('translate-y-full', 'sm:scale-95');
            card.classList.add('translate-y-0', 'sm:scale-100');
            if (inputProj) inputProj.focus();
        });
    }

    function closePortfolioProjectModal() {
        const modal = document.getElementById('portfolioProjectModal');
        const card = document.getElementById('portfolioProjectCard');
        if (!modal || !card) return;

        card.classList.remove('translate-y-0', 'sm:scale-100');
        card.classList.add('translate-y-full', 'sm:scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            _activeProjectAssignDoc = null;
        }, 200);
    }

    function setPortfolioVersionPreset(preset) {
        const inputVer = document.getElementById('portfolioInputVersionLabel');
        if (inputVer) {
            inputVer.value = preset;
            inputVer.focus();
        }
    }

    async function submitPortfolioProjectSave() {
        if (!_activeProjectAssignDoc) return;
        const { docId, chatId } = _activeProjectAssignDoc;
        const inputProj = document.getElementById('portfolioInputProjectName');
        const inputVer = document.getElementById('portfolioInputVersionLabel');

        const trimmedProject = (inputProj?.value || '').trim();
        const trimmedVersion = (inputVer?.value || '').trim() || 'Draft 1';

        if (!trimmedProject) {
            if (inputProj) {
                inputProj.focus();
                inputProj.classList.add('border-red-500');
                setTimeout(() => inputProj.classList.remove('border-red-500'), 1500);
            }
            return;
        }

        let order = 1;
        const dMatch = trimmedVersion.match(/(\d+)/);
        if (/final/i.test(trimmedVersion)) {
            order = 99;
        } else if (/peer\s*review/i.test(trimmedVersion)) {
            order = 1.5;
        } else if (dMatch) {
            order = parseInt(dMatch[1], 10);
        }

        const assignObj = {
            projectName: trimmedProject,
            versionLabel: trimmedVersion,
            versionOrder: order,
            updatedAt: Date.now()
        };

        try {
            await set(ref(db, `writing_projects/${chatId}/${docId}`), assignObj);
            if (!window._writingProjectsCache) window._writingProjectsCache = {};
            if (!window._writingProjectsCache[chatId]) window._writingProjectsCache[chatId] = {};
            window._writingProjectsCache[chatId][docId] = assignObj;

            closePortfolioProjectModal();
            openWritingPortfolio();
        } catch (err) {
            console.error('[WritingPortfolio] Failed to save project assignment:', err);
            AppModules.Modal.alert("Error", "Failed to save project assignment. Please try again.");
        }
    }

    async function submitPortfolioUngroup() {
        if (!_activeProjectAssignDoc) return;
        const { docId, chatId } = _activeProjectAssignDoc;

        const confirmUngroup = await AppModules.Modal.confirm(
            "Ungroup Document",
            "Do you want to remove this document from its current project?",
            "Ungroup",
            "Cancel"
        );
        if (!confirmUngroup) return;

        try {
            await set(ref(db, `writing_projects/${chatId}/${docId}`), null);
            if (window._writingProjectsCache && window._writingProjectsCache[chatId]) {
                delete window._writingProjectsCache[chatId][docId];
            }
            closePortfolioProjectModal();
        } catch (err) {
            console.error('[WritingPortfolio] Failed to ungroup:', err);
            AppModules.Modal.alert("Error", "Failed to ungroup document.");
        }
    }

    async function deletePortfolioCard(docId, docTitle, e, targetMsgKey = null) {
        if (e && e.stopPropagation) e.stopPropagation();
        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        if (!activeTargetId) return;

        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : (currentUser?.id ? getChatId(currentUser.id, activeTargetId) : activeTargetId);
        if (!docId && !targetMsgKey) return;

        const displayName = docTitle ? `"${docTitle}"` : "this document card";
        const confirmed = await AppModules.Modal.confirm(
            "Delete Document Card",
            `Are you sure you want to delete ${displayName}? This will also remove the card from the chat history.`,
            "Delete",
            "Cancel"
        );
        if (!confirmed) return;

        try {
            // 1. Gather all message keys belonging to this document
            const targetKeys = new Set();
            if (targetMsgKey) {
                targetKeys.add(targetMsgKey);
            }

            if (docId && window._portfolioDocIdToKeys && window._portfolioDocIdToKeys.has(docId)) {
                (window._portfolioDocIdToKeys.get(docId) || []).forEach(k => targetKeys.add(k));
            }

            // Check in-memory / local IndexedDB messages
            const localMsgs = (await getLocalMessages(chatId)) || [];
            localMsgs.forEach(m => {
                if (!m) return;
                const text = m.text || '';
                const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
                const mDocId = m.docData?.fileId || (match ? match[1] : null);
                if ((docId && (mDocId === docId || m.key === docId || m._portfolioDocId === docId)) || (targetMsgKey && m.key === targetMsgKey)) {
                    if (m.key) targetKeys.add(m.key);
                }
            });

            // If still empty or docId provided, scan Firebase directly to guarantee removal
            if (docId) {
                try {
                    const snap = await get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(100)));
                    if (snap.exists()) {
                        const val = snap.val();
                        Object.keys(val).forEach(k => {
                            const m = val[k];
                            if (!m) return;
                            const text = m.text || '';
                            const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
                            const mDocId = m.docData?.fileId || (match ? match[1] : null);
                            if (mDocId === docId || k === docId || text.includes(docId)) {
                                targetKeys.add(k);
                            }
                        });
                    }
                } catch (fbScanErr) {
                    console.warn('[WritingPortfolio] Firebase scan fallback notice:', fbScanErr);
                }
            }

            if (targetKeys.size === 0) {
                throw new Error('The original chat message could not be located. It was not removed locally.');
            }

            console.log('[WritingPortfolio] Deleting messages from chat and Firebase:', Array.from(targetKeys));

            // 2. Delete from RTDB first.  This must succeed before touching IndexedDB
            // or the DOM; otherwise the UI would only hide a still-live chat message.
            const remoteDeletes = {};
            targetKeys.forEach(k => { remoteDeletes[k] = null; });
            await update(ref(db, `messages/${chatId}`), remoteDeletes);

            // RTDB success is now authoritative. Clean the local cache and rendered UI.
            await Promise.all(Array.from(targetKeys).map(async (k) => {
                if (typeof deleteMessageLocal === 'function') {
                    await deleteMessageLocal(chatId, k);
                }
                currentLocalMsgs = currentLocalMsgs.filter(message => message?.key !== k);
                currentDisplayMsgs = currentDisplayMsgs.filter(message => message?.key !== k);
                document.querySelector(`[data-key="${k}"]`)?.remove();
                loadedMsgKeys.delete(k);
            }));

            // 3. Remove project binding if any
            if (docId) {
                try {
                    await set(ref(db, `writing_projects/${chatId}/${docId}`), null);
                    if (window._writingProjectsCache && window._writingProjectsCache[chatId]) {
                        delete window._writingProjectsCache[chatId][docId];
                    }
                } catch (err) {
                    console.warn('[WritingPortfolio] Project ungroup error during delete:', err);
                }
            }

            // 4. Ensure no legacy blacklist locks this docId
            try {
                localStorage.removeItem(`writing_deleted_docs_${chatId}`);
                if (activeTargetId !== chatId) localStorage.removeItem(`writing_deleted_docs_${activeTargetId}`);
            } catch (e) {}

            // 5. Re-render writing portfolio
            await openWritingPortfolio();
        } catch (err) {
            console.error('[WritingPortfolio] Error deleting document card:', err);
            AppModules.Modal.alert("Error", "Failed to delete document card. Please try again.");
        }
    }

    window.deletePortfolioCard = deletePortfolioCard;
    window.openWritingPortfolio = openWritingPortfolio;
    window.closeWritingPortfolio = closeWritingPortfolio;
    window.switchProjectVersion = switchProjectVersion;
    window.filterPortfolioFeedback = filterPortfolioFeedback;
    window.parseDocVersion = parseDocVersion;
    window.acceptPortfolioGroupingSuggestion = acceptPortfolioGroupingSuggestion;
    window.filterDocComments = filterDocComments;
    window.openProjectAssignModal = openProjectAssignModal;
    window.closePortfolioProjectModal = closePortfolioProjectModal;
    window.setPortfolioVersionPreset = setPortfolioVersionPreset;
    window.submitPortfolioProjectSave = submitPortfolioProjectSave;
    window.submitPortfolioUngroup = submitPortfolioUngroup;
    window.switchPortfolioView = switchPortfolioView;
    window.filterPortfolioAuthor = filterPortfolioAuthor;
    window.filterPortfolioCommentStatus = filterPortfolioCommentStatus;
    window.openPortfolioExportModal = openPortfolioExportModal;
    window.closePortfolioExportModal = closePortfolioExportModal;
    window.printPortfolioDossier = printPortfolioDossier;
    window.renderPortfolioCommentsContent = renderPortfolioCommentsContent;
    window.renderPortfolioTimelineContent = renderPortfolioTimelineContent;

    window.toggleQuoteText = toggleQuoteText;
    window.toggleAttachMenu = toggleAttachMenu;
    window.triggerPhotoUpload = triggerPhotoUpload;
    window.openAddGoogleDocDialog = openAddGoogleDocDialog;
    window.closeAttachMenu = closeAttachMenu;
    window.toggleDocCommentsExpand = toggleDocCommentsExpand;
    window.syncDocCardComments = syncDocCardComments;
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
    window.toggleChatSearch = toggleChatSearch;
    window.maybeCollapseChatSearch = maybeCollapseChatSearch;
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
        toggleChatSearch,
        maybeCollapseChatSearch,
        initChatListObserver,
        forwardTo,
        getSelectedMsgData: () => selectedMsgData
    };
}
