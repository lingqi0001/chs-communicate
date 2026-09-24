import { LiquidGlassEffect } from './liquid-glass.js?v=20260922-lgpref-1';
import { initWritingBehavior, WritingDocCard } from './writing.js';

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
    let docReplyTarget = null; // Google Doc comment reply mode driven by the chat input
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
    // Name-bar width flight lives with repositionWpBar (bottom of this file)
    // and is exposed on window; fall back to a plain write before it loads.
    const animateNameBar = (mutate) => (typeof window.animateNameBarContent === 'function'
        ? window.animateNameBarContent(mutate)
        : mutate());
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
    <div id="forwardPicker" class="hidden fixed z-[260] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" onclick="closeForwardPicker()"></div>
        <div id="forwardPickerCard"
            class="menu-hidden relative w-full max-w-sm max-h-full rounded-3xl flex flex-col overflow-hidden">
            <div class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                <h3 class="text-lg font-bold">Forward to...</h3>
            </div>
            <div id="forwardUserList" class="flex-1 min-h-0 overflow-y-auto p-2"></div>
            <div class="p-4 flex justify-end">
                <button onclick="closeForwardPicker()"
                    class="px-5 py-2 text-[15px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
            </div>
        </div>
    </div>
        `);
        window.addEventListener('resize', positionForwardPicker);

        // Match the attachMenu liquid glass effect exactly (same bevel/refraction/ripple parameters)
        const pickerCard = document.getElementById('forwardPickerCard');
        if (pickerCard) {
            new LiquidGlassEffect(pickerCard, {
                radius: 24,            // matches rounded-3xl
                refractionWidth: 12,   // matches attachMenu bevel width
                maxDisplacement: 8,    // matches attachMenu refraction strength
                mouseRadius: 55,       // matches attachMenu hover ripple
                mouseStrength: 6       // matches attachMenu ripple strength
            });
        }
    }

    // Dim everything below the panel header down to the bottom of the panel
    // (including the composer), while keeping the chat header — or the Writing
    // Portfolio drawer header when open — and the global top bar visible.
    function positionForwardPicker() {
        const picker = document.getElementById('forwardPicker');
        if (!picker || picker.classList.contains('hidden')) return;
        let r = null;
        const chatBox = document.getElementById('chatBox');
        if (chatBox && chatBox.offsetWidth > 0 && chatBox.offsetHeight > 0) {
            const b = chatBox.getBoundingClientRect();
            let top = b.top;
            const drawer = document.getElementById('writingPortfolioDrawer');
            const drawerOpen = drawer && !drawer.classList.contains('hidden');
            const headerEl = drawerOpen
                ? document.getElementById('writingPortfolioHeader')
                : document.querySelector('#chatSection > header');
            if (headerEl) top = Math.max(top, headerEl.getBoundingClientRect().bottom);
            if (b.bottom - top > 80) {
                r = { left: b.left, top: top, width: b.width, height: b.bottom - top, scoped: true };
            }
        }
        if (!r) {
            const chatSec = document.getElementById('chatSection');
            if (chatSec && chatSec.offsetWidth > 0 && chatSec.offsetHeight > 0) {
                const b = chatSec.getBoundingClientRect();
                r = { left: b.left, top: b.top, width: b.width, height: b.height, scoped: true };
            }
        }
        if (!r) {
            r = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, scoped: false };
        }
        picker.style.left = `${r.left}px`;
        picker.style.top = `${r.top}px`;
        picker.style.width = `${r.width}px`;
        picker.style.height = `${r.height}px`;
        picker.style.padding = r.scoped ? '12px' : '24px';
        const card = document.getElementById('forwardPickerCard');
        if (card && card._liquidGlass) card._liquidGlass.refresh();
    }

    let forwardPickerCloseTimer = null;

    // Same pop-in mechanics as #attachMenu: show collapsed, then spring open on the next frames
    function openForwardPicker() {
        const picker = document.getElementById('forwardPicker');
        const card = document.getElementById('forwardPickerCard');
        if (!picker) return;
        // Forwarding is a write action into real conversations — the picker
        // lists actual people, so a guest must never see it open.
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to forward messages to your own conversations.', 'Sign in to forward');
            return;
        }
        clearTimeout(forwardPickerCloseTimer);
        picker.classList.remove('hidden');
        if (card) {
            card.classList.remove('menu-visible');
            card.classList.add('menu-hidden');
        }
        positionForwardPicker();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (card) {
                    card.classList.remove('menu-hidden');
                    card.classList.add('menu-visible');
                }
                positionForwardPicker();
            });
        });
    }

    function closeForwardPicker() {
        const picker = document.getElementById('forwardPicker');
        const card = document.getElementById('forwardPickerCard');
        if (!picker || picker.classList.contains('hidden')) return;
        if (card) {
            card.classList.remove('menu-visible');
            card.classList.add('menu-hidden');
        }
        clearTimeout(forwardPickerCloseTimer);
        forwardPickerCloseTimer = setTimeout(() => {
            picker.classList.add('hidden');
        }, 230);
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
            resetChatProjectFilter();
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

        const previewMessages = window.isChatPreview
            ? window.CHAT_PREVIEW?.messages?.[chatId]
            : null;
        const isPreviewChat = !!previewMessages;
        // Guests land at the TOP of the community preview so the demo reads
        // as a story from its first message.  Only that chat, only while
        // signed out — every other thread keeps anchoring to the newest
        // message at the bottom.
        const guestPreviewOpensAtTop = isPreviewChat && !window.isLoggedIn &&
            chatId === getChatId((getCurrentUser() || {}).id, 'preview_centennial');
        currentLocalMsgs = isPreviewChat
            ? Object.entries(previewMessages).map(([key, message]) => ({ key, ...message }))
            : await getLocalMessages(chatId);
        isLoaded = true;
        if (loadingTimer) clearTimeout(loadingTimer);

        // Fetch recent messages from Firebase to reconcile with local cache (restores any messages deleted locally but still in Firebase)
        if (!isPreviewChat) try {
            const remoteSnap = await window.withNetworkTimeout(get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50))));
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
            chatBox.scrollTop = guestPreviewOpensAtTop ? 0 : chatBox.scrollHeight;
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

                chatBox.insertBefore(quietHistory(batchFrag), chatBox.firstChild);
                // Filter the fresh chunk in the same task, before the next
                // paint: older pages loaded under an active project filter
                // would otherwise flash the unfiltered history at the top
                // until the debounced pass hid it.
                applyChatProjectFilter();
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
                        const olderSnap = await window.withNetworkTimeout(get(olderQuery));
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

                            chatBox.insertBefore(quietHistory(batchFrag), chatBox.firstChild);
                            // Same as above: hide before paint so an active project
                            // filter never flashes unfiltered All-messages history.
                            applyChatProjectFilter();
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

        if (isPreviewChat) {
            chatLoadingLock = null;
            return;
        }

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
            if (!oldEl) return;

            const newEl = UIComponents.createChatBubble(updatedMsg, msgKey, getCurrentUser(), setupLongPress);
            if (!newEl) return;

            // An outgoing message is written in full except for serverTimestamp(), which the
            // server fills back in tens of milliseconds later. That ack renders a byte-identical
            // bubble, and swapping the node restarts .msg-pop's entry animation — the flicker.
            // Nothing visible needs a new element, so carry the fresh attributes onto the node
            // already on screen and leave it where it is.
            if (newEl.innerHTML === oldEl.innerHTML) {
                for (const attr of newEl.attributes) oldEl.setAttribute(attr.name, attr.value);
                return;
            }

            oldEl.replaceWith(quietHistory(newEl));
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
                if (!guestPreviewOpensAtTop) chatBox.scrollTop = chatBox.scrollHeight;
                chatBox.style.opacity = '1';
                setTimeout(() => {
                    if (chatGeneration !== thisGeneration) return;
                    if (!guestPreviewOpensAtTop) chatBox.scrollTop = chatBox.scrollHeight;
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

    let quoteAreaCloseTimer = null;

    // Same pop-in mechanics as #attachMenu, growing from the bottom-right
    function showQuoteArea() {
        const quoteArea = document.getElementById('quoteArea');
        if (!quoteArea) return;
        clearTimeout(quoteAreaCloseTimer);
        quoteArea.classList.remove('hidden');
        quoteArea.classList.remove('menu-visible');
        quoteArea.classList.add('menu-hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                quoteArea.classList.remove('menu-hidden');
                quoteArea.classList.add('menu-visible');
                if (quoteArea._liquidGlass) quoteArea._liquidGlass.refresh();
            });
        });
    }

    function handleMsgQuote() {
        if (!selectedMsgData) return;
        if (docReplyTarget) exitDocReplyMode();
        const menu = document.getElementById('messageContextMenu');
        if (menu) {
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
        }
        // Replying to a comment card must go through the Google Doc bot
        // reply path, not the plain message-quote path.
        const card = selectedMsgData.type === 'comment_card' ? (selectedMsgData.commentCard || null) : null;
        if (card && card.comment && card.comment.id && card.docUrl) {
            startDocCommentReply({
                docId: card.docId,
                docUrl: card.docUrl,
                docTitle: card.docTitle,
                originMsgKey: card.originMsgKey || null,
                comment: card.comment
            });
            return;
        }
        currentQuote = { 
            senderName: selectedMsgData.senderName, 
            text: selectedMsgData.text,
            messageId: selectedMsgData.key || null
        };
        document.getElementById('quoteUser').innerText = currentQuote.senderName;
        document.getElementById('quoteText').innerText = (currentQuote.text || '').replace(/\r?\n/g, ' ');
        showQuoteArea();
        document.getElementById('u-msg').focus();
    }

    function clearQuote() {
        currentQuote = null;
        exitDocReplyMode();
        const quoteArea = document.getElementById('quoteArea');
        if (!quoteArea || quoteArea.classList.contains('hidden')) return;
        quoteArea.classList.remove('menu-visible');
        quoteArea.classList.add('menu-hidden');
        clearTimeout(quoteAreaCloseTimer);
        quoteAreaCloseTimer = setTimeout(() => {
            quoteArea.classList.add('hidden');
        }, 230);
    }

    function captureDraftFromComposer(chatId) {
        if (!chatId) return;
        const input = document.getElementById('u-msg');
        window.Drafts?.save(chatId, { text: input ? input.value : '', quote: currentQuote });
    }

    function applyDraftToComposer(chatId) {
        const input = document.getElementById('u-msg');
        if (!input) return;
        const draft = window.Drafts?.peek(chatId);
        input.value = draft?.text || '';
        if (draft?.quote) {
            currentQuote = draft.quote;
            const userEl = document.getElementById('quoteUser');
            const textEl = document.getElementById('quoteText');
            if (userEl) userEl.innerText = currentQuote.senderName;
            if (textEl) textEl.innerText = (currentQuote.text || '').replace(/\r?\n/g, ' ');
            showQuoteArea();
        } else {
            // No quote for this chat: the strip must not keep showing the one
            // the previous conversation was quoting.
            clearQuote();
        }
        // Let the composer's own input listener resize the textarea around the
        // restored text rather than duplicating that math here.
        input.dispatchEvent(new Event('input'));
    }

    function exitDocReplyMode() {
        if (!docReplyTarget) return;
        docReplyTarget = null;
        const tail = document.getElementById('quoteTail');
        if (tail) tail.innerText = "'s message: ";
        const input = document.getElementById('u-msg');
        if (input) input.placeholder = composerPlaceholder();
        liftComposerForPortfolio(false);
    }

    // #writingPortfolioDrawer is body-fixed at z-80, so the composer must
    // leave #chatSection (z-10) and ride above it while replying in-portfolio.
    function portfolioIsOpen() {
        return !!document.getElementById('writingPortfolioDrawer')?.classList.contains('wp-drawer-open');
    }

    // Keep the lifted composer exactly as wide as the portfolio drawer.
    function composerFollowDrawer(expanded, animate) {
        const wrap = document.getElementById('chatComposerWrap');
        if (!wrap || !wrap.classList.contains('composer-front')) return;
        const target = wpCurrentLeft(!!expanded) + 'px';
        if (animate) {
            wrap.style.transition = 'left 440ms cubic-bezier(0.22, 1, 0.36, 1)';
            wrap.style.left = target;
            setTimeout(() => { wrap.style.transition = ''; }, 460);
        } else {
            wrap.style.left = target;
        }
    }

    function liftComposerForPortfolio(on) {
        const wrap = document.getElementById('chatComposerWrap');
        if (!wrap) return;
        if (on) {
            clearTimeout(window._composerSinkT);
            wrap.classList.remove('composer-sink');
            if (wrap.parentElement === document.body) return;
            window._composerHome = wrap.parentElement;
            document.body.appendChild(wrap);
            wrap.classList.add('composer-front');
            const drawer = document.getElementById('writingPortfolioDrawer');
            composerFollowDrawer(drawer?.classList.contains('wp-expanded'), false);
        } else {
            if (wrap.parentElement !== document.body || !wrap.classList.contains('composer-front')) return;
            // No sink animation: the composer simply drops back into the chat
            // column in place, then the drawer slides out over it as usual.
            clearTimeout(window._composerSinkT);
            wrap.classList.remove('composer-front', 'composer-sink');
            wrap.style.left = '';
            wrap.style.transition = '';
            if (window._composerHome) window._composerHome.appendChild(wrap);
        }
    }

    // Gray out + lock the whole composer while the bot posts a reply to Google.
    // The .composer-busy CSS (style.css) dims children and freezes pointer
    // events on quote strip/X, attach menu, camera and pill; opacity must
    // never be set on the glass elements themselves or backdrop-filter dies.
    function setDocReplyBusy(on) {
        const wrap = document.getElementById('chatComposerWrap');
        const input = document.getElementById('u-msg');
        if (input) input.disabled = on;
        if (wrap) wrap.classList.toggle('composer-busy', on);
    }

    // Comment replies ride on the quote strip + main input instead of the
    // old per-comment inline box.
    function startDocCommentReply(ctx) {
        if (!ctx || !ctx.comment || !ctx.comment.id) return;
        currentQuote = null;
        const disp = WritingDocCard.docCommentDisplay(ctx.comment);
        const authorName = disp.author || 'Reviewer';
        docReplyTarget = {
            docId: ctx.docId || null,
            docUrl: ctx.docUrl || '',
            docTitle: ctx.docTitle || 'Google Document',
            originMsgKey: ctx.originMsgKey || null,
            comment: ctx.comment,
            photoUrls: []
        };
        const lead = document.getElementById('quoteLead');
        const userEl = document.getElementById('quoteUser');
        const tail = document.getElementById('quoteTail');
        const textEl = document.getElementById('quoteText');
        if (lead) lead.innerText = 'Reply to ';
        if (userEl) userEl.innerText = authorName;
        if (tail) tail.innerText = ' on this Google Doc comment: ';
        if (textEl) textEl.innerText = (disp.content || '').replace(/\r?\n/g, ' ');
        if (portfolioIsOpen()) liftComposerForPortfolio(true);
        showQuoteArea();
        const input = document.getElementById('u-msg');
        if (input) {
            input.placeholder = `Reply to ${authorName}…`;
            input.focus();
        }
    }

    // The doc button on a comment-card strip replies directly, without
    // going through the long-press menu.
    function replyCommentCardStrip(key, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const card = (window._commentCards || {})[key];
        if (!card || !card.comment || !card.comment.id) return;
        startDocCommentReply({
            docId: card.docId,
            docUrl: card.docUrl,
            docTitle: card.docTitle,
            originMsgKey: card.originMsgKey || null,
            comment: card.comment
        });
    }

    function handleMsgForward() {
        if (!selectedMsgData) return;
        ensureForwardPicker();
        const pickerTitle = document.querySelector('#forwardPicker h3');
        if (pickerTitle) pickerTitle.innerText = 'Forward to...';
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
        openForwardPicker();
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

    // Send a single comment as a comment card to a chosen person (reuses the Forward picker UI)
    function showSendToPicker(payload) {
        ensureForwardPicker();
        const pickerTitle = document.querySelector('#forwardPicker h3');
        if (pickerTitle) pickerTitle.innerText = 'Send to...';
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
            div.onclick = () => sendCommentCardTo(id, payload);
            div.innerHTML = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" class="w-9 h-9 rounded-full shadow-sm">
                <div><div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name)}</div><div class="text-xs text-gray-400">${escapeHTML(u.email)}</div></div>`;
            list.appendChild(div);
        });
        openForwardPicker();
    }

    function openCommentSendPicker(key, index, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const entry = (window._docCommentPayloads || {})[key];
        const comment = entry && entry.comments ? entry.comments[index] : null;
        if (!entry || !comment) return;
        showSendToPicker({ docId: entry.docId, docUrl: entry.docUrl, docTitle: entry.docTitle, originMsgKey: key, comment });
    }

    async function sendCommentCardTo(targetId, payload) {
        if (!payload || payload._sending) return;
        if (await blockIfRestrictedDirectTarget(targetId)) return;
        payload._sending = true;
        try {
            const currentUser = getCurrentUser();
            const chatId = getChatId(currentUser.id, targetId);
            const card = JSON.parse(JSON.stringify({
                docId: payload.docId,
                docUrl: payload.docUrl,
                docTitle: payload.docTitle,
                originMsgKey: payload.originMsgKey || null,
                comment: payload.comment
            }));
            await push(ref(db, `messages/${chatId}`), {
                senderId: currentUser.id,
                senderName: currentUser.name,
                text: `Comment on "${card.docTitle}"`,
                type: 'comment_card',
                commentCard: card,
                timestamp: serverTimestamp()
            });
            await update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [targetId.toLowerCase()]: serverTimestamp() });
            await update(ref(db, `user_chats/${targetId.toLowerCase()}`), { [currentUser.id.toLowerCase()]: serverTimestamp() });
            closeForwardPicker();
        } finally {
            delete payload._sending;
        }
    }

    function handleMsgJumpDoc() {
        const card = selectedMsgData && selectedMsgData.commentCard;
        const menu = document.getElementById('messageContextMenu');
        if (menu) menu.classList.add('hidden');
        if (!card) return;
        const c = card.comment || {};
        const url = (card.docId && c.id)
            ? `https://docs.google.com/document/d/${card.docId}/edit?disco=${encodeURIComponent(c.id)}`
            : (card.docUrl || '');
        if (url) window.open(url, '_blank', 'noopener');
    }

    // Clicking a comment_card's reply strip: jump to the source doc card in the
    // Writing Portfolio when we know its key, otherwise fall back to the Google Doc.

    function setupLongPress(el, msg) {
        const start = (e) => {
            selectedMsgData = msg;
            longPressTimer = setTimeout(() => {
                const menu = document.getElementById('messageContextMenu');
                const touch = e.touches ? e.touches[0] : e;

                menu.classList.remove('menu-visible');
                menu.classList.add('menu-hidden');
                menu.classList.remove('hidden');

                const menuHeight = menu.offsetHeight || 200;
                const menuWidth = menu.offsetWidth || 180;
                const reportBtn = menu.querySelector('button[onclick="handleMsgReport()"]');
                const replyBtn = menu.querySelector('button[onclick="handleMsgQuote()"]');
                const jumpBtn = menu.querySelector('button[onclick="handleMsgJumpDoc()"]');
                if (jumpBtn) jumpBtn.classList.toggle('hidden', msg.type !== 'comment_card');
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
                top = Math.max(15, top);
                left = Math.max(15, left);
                menu.style.top = `${top}px`;
                menu.style.left = `${left}px`;

                // Spring out of the corner nearest the press point, toward the menu body
                const originY = touch.clientY > top + menuHeight / 2 ? 'bottom' : 'top';
                const originX = touch.clientX > left + menuWidth / 2 ? 'right' : 'left';
                menu.style.transformOrigin = `${originY} ${originX}`;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        menu.classList.remove('menu-hidden');
                        menu.classList.add('menu-visible');
                        if (menu._liquidGlass) menu._liquidGlass.refresh();
                    });
                });
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

    // One placeholder source so no width/resize/quote path can hand a guest
    // the signed-in "Type a message…" prompt.
    function composerPlaceholder() {
        if (!window.isLoggedIn) return 'Sign in to type a message';
        const composerWidth = document.getElementById('chatInputPill')?.clientWidth || 0;
        return window.innerWidth < 640 || (composerWidth > 0 && composerWidth < 430)
            ? "Type a message..."
            : "Type a message...Use Shift+Enter to change lines";
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
            // The full-bleed width only exists to cover the spot of the
            // plus button that hidden-camera states (system/disbanded chats)
            // leave behind.  A disabled composer that still shows the plus
            // (guest preview) must keep the normal flex width, or the pill
            // overflows past the panel's right edge.
            if (disabled && hideCamera) {
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
        window.Directory?.rememberLastChat(targetId);

        // The preview ships a fixed set of conversations.  Roster rows
        // (classmates, the teacher) are visible but have no local thread;
        // opening one would land on an empty chat wired to real Firebase
        // paths, so route the visitor to sign in instead.
        if (window.isChatPreview) {
            const previewChatKey = targetId.startsWith('group_') ? targetId : getChatId(currentUser.id, targetId);
            if (!window.CHAT_PREVIEW?.messages?.[previewChatKey]) {
                window.promptSignIn?.('Sign in to start new conversations with your classmates.', 'Sign in to start a chat');
                return;
            }
        }
        
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

        // A pending doc-comment reply belongs to the chat it was started in.
        if (docReplyTarget) clearQuote();

        // Unsent text travels with its own conversation: park the outgoing one,
        // then put back whatever this chat had when we last left it.
        captureDraftFromComposer(activeTargetId);
        safeSetActiveTargetId(targetId);
        applyDraftToComposer(targetId);

        const composerWrap = document.getElementById('chatComposerWrap');
        if (composerWrap) composerWrap.classList.remove('hidden');
        const chatSearchWrap = document.getElementById('chatSearchWrap');
        if (chatSearchWrap) {
            // A search box left expanded by the previous chat must not flash
            // wide on re-entry (it makes the project pill shrink then re-grow):
            // reset to the collapsed icon state before unhiding. The width
            // swap is transition-suppressed in case the box is still visible
            // at this point — a flying w-44→w-8 would feed the pill stale
            // mid-animation measurements.
            const searchInput = document.getElementById('chatSearchInput');
            if (searchInput) searchInput.value = '';
            chatSearchWrap.style.transition = 'none';
            chatSearchWrap.classList.remove('w-44');
            chatSearchWrap.classList.add('w-8');
            document.getElementById('chatSearchInput')?.classList.add('hidden');
            document.getElementById('chatSearchLeadingIcon')?.classList.add('hidden');
            document.getElementById('clearSearchBtn')?.classList.add('hidden');
            document.getElementById('chatSearchIconBtn')?.classList.remove('hidden');
            const resultsBox = document.getElementById('searchResults');
            if (resultsBox) {
                resultsBox.classList.add('hidden');
                resultsBox.innerHTML = '';
            }
            chatSearchWrap.classList.remove('hidden');
            void chatSearchWrap.offsetWidth;
            chatSearchWrap.style.transition = '';
        }

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
        } else if (window.isChatPreview) {
            setComposerState({
                disabled: true,
                placeholder: composerPlaceholder(),
                hideSend: false,
                hideCamera: false
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
            animateNameBar(() => {
                titleEl.innerText = getCnCache()[classId] || "Class Group Chat";
                if (isDisbanded) {
                    statusEl.innerText = "Class disbanded";
                } else if (isRemoved) {
                    statusEl.innerText = "You have been removed from this chat";
                } else {
                    statusEl.innerText = ctCache[classId] || "Group Chat";
                }
            });

            if (!getCnCache()[classId] || !ctCache[classId]) {
                get(ref(db, `classes/${classId}`)).then(async snap => {
                    if (!snap.exists()) return;
                    const cData = snap.val();
                    getCnCache()[classId] = cData.name;
                    if (getActiveTargetId() === targetId) {
                        animateNameBar(() => {
                            titleEl.innerText = cData.name;
                        });
                        const wpTitleEl = document.getElementById('writingPortfolioTitle');
                        if (wpTitleEl) wpTitleEl.innerText = `WRITING PORTFOLIO - ${cData.name}`;
                    }
                    if (cData.teacherId) {
                        const teacher = await safeFetchUser(cData.teacherId);
                        ctCache[classId] = teacher?.name || "Teacher";
                        if (getActiveTargetId() === targetId) {
                            animateNameBar(() => {
                                statusEl.innerText = teacher?.name || "Teacher";
                            });
                        }
                    }
                    AppModules.Sidebar.renderSidebar();
                });
            }
        } else {
            chatId = getChatId(currentUser.id, targetId);
            const u = (getAllUsers() || {})[targetId];
            animateNameBar(() => {
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
            });

            safeFetchUser(targetId).then(user => {
                if (!user || getActiveTargetId() !== targetId) return;
                animateNameBar(() => {
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
        if (_activeChatProject !== WP_ALL_PROJECTS) resetChatProjectFilter();
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

    // The right bar grows/shrinks with #chatSearchWrap's width transition
    // (duration-300). The glass tracks the flight instead of being dropped: the
    // map is built for the box the bar is about to grow into and the region is
    // clipped by the bar's own box until it lands.
    function quietActionsBarGlass(predictGrow) {
        const bar = document.getElementById('chatActionsBar');
        const glass = bar?._liquidGlass;
        if (glass) glass.beginTrack();
        // While the width is in flight the bar's box shows mid-transition
        // sizes; ResizeObserver passes must keep deciding from the FINAL edge.
        // Record the absolute destination now (frame 1, while the rect is
        // still the start value) — adding the full growth to a half-flown
        // rect overshoots and the pill glides out, back, out again.
        if (bar && predictGrow) bar._wpAbLeftFinal = bar.getBoundingClientRect().left - predictGrow;
        setTimeout(() => {
            if (bar) delete bar._wpAbLeftFinal;
            if (glass) glass.endTrack();
            scheduleWpDocContext(false);
        }, 360);
    }

    function toggleChatSearch() {
        const wrap = document.getElementById('chatSearchWrap');
        const input = document.getElementById('chatSearchInput');
        const iconBtn = document.getElementById('chatSearchIconBtn');
        const leadingIcon = document.getElementById('chatSearchLeadingIcon');
        // Idempotent: re-expanding an already-expanded box must not fire a
        // second width prediction at the project pill.
        if (wrap && !wrap.classList.contains('w-44')) {
            wrap.classList.remove('w-8');
            wrap.classList.add('w-44');
            quietActionsBarGlass(144);
            // w-8→w-44 = 32→176px: decide the pill's shape now, not after the
            // bar finishes growing.
            repositionWpBar(144);
        }
        if (iconBtn) iconBtn.classList.add('hidden');
        if (leadingIcon) leadingIcon.classList.remove('hidden');
        if (input) {
            input.classList.remove('hidden');
            setTimeout(() => input.focus(), 50);
        }
    }

    // A press that outlives the 150ms blur timer must finish before the bar
    // collapses: otherwise the pill / portfolio button slides away between
    // mousedown and mouseup and the click dies on a stale ancestor (trackpad
    // taps register ~200ms down-to-up and lost every time).
    let _chatPtrDown = false;
    document.addEventListener('pointerdown', () => { _chatPtrDown = true; }, true);
    document.addEventListener('pointerup', () => { _chatPtrDown = false; }, true);

    function maybeCollapseChatSearch() {
        const input = document.getElementById('chatSearchInput');
        setTimeout(() => {
            if (_chatPtrDown) {
                window.addEventListener('pointerup', maybeCollapseChatSearch, { once: true });
                return;
            }
            if (document.activeElement === input) return;
            const term = (input?.value || '').trim();
            if (term) return;
            const wrap = document.getElementById('chatSearchWrap');
            const iconBtn = document.getElementById('chatSearchIconBtn');
            const leadingIcon = document.getElementById('chatSearchLeadingIcon');
            const clearBtn = document.getElementById('clearSearchBtn');
            const resultsBox = document.getElementById('searchResults');
            // A chat switch may have already reset the box to w-8; collapsing
            // again would fire a bogus -144px prediction at the pill.
            if (wrap && wrap.classList.contains('w-44')) {
                wrap.classList.remove('w-44');
                wrap.classList.add('w-8');
                quietActionsBarGlass(-144);
                // Mirror of the expand path: the bar will shrink 144px.
                repositionWpBar(-144);
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
            if (resultsBox._liquidGlass) {
                resultsBox._liquidGlass.refresh();
            }
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
                            chatBox.appendChild(quietHistory(batchFrag));
                            
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
            if (resultsBox._liquidGlass) {
                resultsBox._liquidGlass.refresh();
            }
        } else {
            resultsBox.innerHTML = '<div class="p-4 text-[14px] text-gray-500 text-center font-medium">No Results Found</div>';
            resultsBox.classList.remove('hidden');
            if (resultsBox._liquidGlass) {
                resultsBox._liquidGlass.refresh();
            }
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
            window.Directory?.saveChats(chatMap);
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

    // Bubbles animate in by default. Opt out only where content is spliced into a
    // list the user is already reading — paging up, a search jump backfilling older
    // messages, or an in-place update to a message already on screen. Opening or
    // switching to a chat still lets the whole restored list enter together.
    function quietHistory(node) {
        if (!node) return node;
        if (node.classList?.contains('msg-pop')) node.classList.add('msg-quiet');
        else node.querySelectorAll?.('.msg-pop').forEach(el => el.classList.add('msg-quiet'));
        return node;
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

        // Only a plain text bubble has its final box the moment it lands; photos and doc
        // cards resize as their media arrives, which would bend a flight mid-way.
        const isMine = msg.senderId === currentUser.id;
        const body = msg.text || '';
        const canFly = isMine && msg.type === 'text'
            && !body.includes('data:image') && !body.includes('docs.google.com/');
        const sendBtn = canFly ? document.getElementById('sendBtn') : null;
        if (sendBtn && sendBtn.offsetParent) {
            // Measure after the list settles at the bottom. The caller scrolls a frame
            // later, and a flight anchored to the pre-scroll rect would land short.
            chatBox.scrollTop = chatBox.scrollHeight;
            const landed = div.getBoundingClientRect();
            const origin = sendBtn.getBoundingClientRect();
            div.style.setProperty('--fly-dx', `${(origin.left + origin.width / 2) - landed.right}px`);
            div.style.setProperty('--fly-dy', `${(origin.top + origin.height / 2) - landed.bottom}px`);
            div.classList.add('msg-sent');
        }

        if (saveToLocal && chatId) saveMessageLocal(chatId, key, msg);
    }

    // Send button pending state. A write that lands quickly must not flicker, so
    // the spinner is only swapped in once the message is still in flight after 200ms.
    let sendPendingCount = 0;
    let sendPendingTimer = null;

    function renderSendPending(pending) {
        const icon = document.getElementById('sendBtnIcon');
        const spin = document.getElementById('sendBtnSpin');
        if (!icon || !spin) return;
        icon.classList.toggle('hidden', pending);
        spin.classList.toggle('hidden', !pending);
    }

    function beginSendPending() {
        sendPendingCount++;
        if (sendPendingCount > 1) return;
        clearTimeout(sendPendingTimer);
        sendPendingTimer = setTimeout(() => {
            sendPendingTimer = null;
            renderSendPending(true);
        }, 200);
    }

    function endSendPending() {
        sendPendingCount = Math.max(0, sendPendingCount - 1);
        if (sendPendingCount > 0) return;
        clearTimeout(sendPendingTimer);
        sendPendingTimer = null;
        renderSendPending(false);
    }

    const MessageEngine = {
        commit: async function (msgData) {
            const targetId = getActiveTargetId();
            if (!targetId || !msgData) return null;
            if (await blockIfRestrictedDirectTarget(targetId)) return null;

            if (window.AppModules && window.AppModules.Notify && typeof window.AppModules.Notify.unhideChat === 'function') {
                window.AppModules.Notify.unhideChat(targetId);
            }

            const currentUser = getCurrentUser();
            
            // 🆕 NEW: Check if we're in a specific project view and attach docIds
            const currentProject = wpActiveProject();
            if (currentProject && currentProject.docIds.size > 0) {
                msgData.projectDocIds = Array.from(currentProject.docIds);
            }
            
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
            beginSendPending();
            try {
                await set(newMsgRef, msgObj);
            } finally {
                endSendPending();
            }

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
            if (docReplyTarget) {
                await this.sendDocCommentReply(val);
                return;
            }
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
                window.Drafts?.clear(getActiveTargetId());
            }

            // Auto-sync Google Doc metadata and created date in background
            if (val.includes('docs.google.com/document/d/') && newKey) {
                const match = val.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)[^\s]*/);
                if (match && typeof syncDocCardComments === 'function') {
                    setTimeout(() => {
                        // Nobody asked for this sync, so it stays out of the way: no failure
                        // modal, and it must not flip the card's comment drawer open.
                        syncDocCardComments(newKey, match[0], null, null, true, false).catch(err => {
                            console.warn('[GoogleDoc] Background auto-sync notice:', err);
                        });
                    }, 600);
                }
            }
        },

        // Post the chat-input draft as a reply to the selected Google Doc
        // comment: bot posts it to Google, then one comment_card (quote +
        // main comment + replies) lands in this chat.
        sendDocCommentReply: async function (val) {
            const target = docReplyTarget;
            if (!target) return;
            let content = val || '';
            if (target.photoUrls && target.photoUrls.length) {
                const urls = target.photoUrls.join(' ');
                content = `${content ? content + '\n' : ''}With ${target.photoUrls.length === 1 ? 'a photo' : 'photos'}: ${urls}`;
            }
            if (!content.trim()) {
                await AppModules.Modal.alert("Empty reply", "Type your reply or attach a photo before posting.");
                return;
            }
            if (content.length > 3000) {
                await AppModules.Modal.alert("Reply too long", "Google Doc replies are limited to 3000 characters (the photo links count too).");
                return;
            }
            if (target._posting) return;
            const input = document.getElementById('u-msg');
            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }
            const textEl = document.getElementById('quoteText');
            const prevText = textEl ? textEl.innerText : '';
            if (textEl) textEl.innerText = 'Posting to Google Doc…';
            target._posting = true;
            beginSendPending();
            setDocReplyBusy(true);
            let posted = null;
            try {
                posted = await WB.submitDocCommentPost(target.originMsgKey, target.docUrl, target.comment.id, content, null);
            } finally {
                setDocReplyBusy(false);
                endSendPending();
                target._posting = false;
            }
            if (posted) {
                await WB.autoForwardCommentCardToChat(target.originMsgKey, target.docUrl, target.comment, content, (posted && posted.postedCommentId) || null);
                clearQuote();
            } else if (docReplyTarget === target) {
                // Keep the draft so the user can fix it and retry
                if (input) input.value = val;
                if (textEl) textEl.innerText = prevText;
            }
        },

        sendImages: async function (base64s) {
            if (!base64s || !base64s.length) return;
            if (docReplyTarget) {
                const urls = await Promise.all(base64s.map(b => uploadImageToStorage(b, 'chats')));
                docReplyTarget.photoUrls = urls.slice(0, 3);
                if (urls.length > 3) {
                    await AppModules.Modal.alert("Up to three photos", "Only the first three photos were attached.");
                }
                const textEl = document.getElementById('quoteText');
                if (textEl) {
                    const n = docReplyTarget.photoUrls.length;
                    textEl.innerText = `${n} photo${n > 1 ? 's' : ''} attached · ` + textEl.innerText.replace(/^\d+ photos? attached · /, '');
                }
                const input = document.getElementById('u-msg');
                if (input) input.placeholder = `Reply to ${(WritingDocCard.docCommentDisplay(docReplyTarget.comment).author) || 'Reviewer'}…`;
                return;
            }
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
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to join the conversation and keep your work connected to the people who support it.', 'Sign in to send a message');
            return;
        }
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
        let draftSaveTimer = null;

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
            input.placeholder = composerPlaceholder();
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
            // A reload or a closed tab must not cost the draft either, so the
            // text is parked shortly after typing rather than only on switch.
            if (draftSaveTimer) clearTimeout(draftSaveTimer);
            draftSaveTimer = setTimeout(() => {
                window.Drafts?.save(getActiveTargetId(), { text: input.value, quote: currentQuote });
            }, 400);
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

            if (menu._liquidGlass) {
                menu._liquidGlass.refresh();
            }

            // Force layout reflow then pop in with spring
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    menu.classList.remove('menu-hidden');
                    menu.classList.add('menu-visible');
                    if (menu._liquidGlass) {
                        menu._liquidGlass.refresh();
                    }
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
        // Invalidate any in-flight doc list load and reset to the main view
        attachDocListToken++;
        stopDocRequestStatusWatch();
        setAttachView('main');
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
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to share photos, annotated pages, and visual notes.', 'Sign in to share photos');
            return;
        }
        closeAttachMenu();
        if (safeGetIsPhotoDisabled()) {
            AppModules.Modal.alert("Photos Disabled", "Photo uploads are currently disabled.");
            return;
        }
        const fileInput = document.getElementById('chatImageFileInput');
        if (fileInput) fileInput.click();
    }

    // --- Attachment panel Google Doc sub-views (all in-place inside #attachMenu) ---
    let attachCurrentView = 'main';
    let attachAnimTimer = null;

    // dir: +1 push forward (slide from right), -1 back (slide from left), 0 silent swap
    function setAttachView(view, dir = 0) {
        const views = { main: 'attachViewMain', gdoc: 'attachViewGdoc', input: 'attachViewInput', docs: 'attachViewDocs', request: 'attachViewRequest' };
        const menu = document.getElementById('attachMenu');
        const newEl = document.getElementById(views[view]);
        if (!menu || !newEl) return;

        const oldEl = document.getElementById(views[attachCurrentView]);
        const glassRefresh = () => {
            if (menu._liquidGlass && typeof menu._liquidGlass.refresh === 'function') menu._liquidGlass.refresh();
        };

        // Finish any in-flight transition before swapping again
        if (attachAnimTimer) { clearTimeout(attachAnimTimer); attachAnimTimer = null; }
        menu.classList.remove('attach-animating');
        menu.style.height = '';

        const startH = menu.offsetHeight;
        if (oldEl && oldEl !== newEl) oldEl.classList.add('hidden');
        newEl.classList.remove('hidden', 'attach-view-enter');
        attachCurrentView = view;

        if (!dir || !oldEl || oldEl === newEl) {
            glassRefresh();
            return;
        }

        const endH = menu.offsetHeight;
        // All view swaps enter the same way as the menu itself: growing out from the bottom-left
        void newEl.offsetWidth;
        newEl.classList.add('attach-view-enter');
        menu.style.height = startH + 'px';
        void menu.offsetHeight; // commit start height before easing to end height
        menu.classList.add('attach-animating');
        requestAnimationFrame(() => { menu.style.height = endH + 'px'; });

        // Keep the liquid-glass backdrop in sync with the animating height
        const tick = () => {
            if (!menu.classList.contains('attach-animating')) return;
            glassRefresh();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);

        attachAnimTimer = setTimeout(() => {
            attachAnimTimer = null;
            menu.classList.remove('attach-animating');
            menu.style.height = '';
            newEl.classList.remove('attach-view-enter');
            glassRefresh();
        }, 280);
    }

    function openGdocMenu() {
        setAttachView('gdoc', 1);
    }

    // Same height easing setAttachView uses, but for swapping content inside the
    // view that is already on screen.
    function animateMenuSwap(mutate) {
        const menu = document.getElementById('attachMenu');
        if (!menu) { mutate(); return; }
        const glassRefresh = () => {
            if (menu._liquidGlass && typeof menu._liquidGlass.refresh === 'function') menu._liquidGlass.refresh();
        };
        menu.classList.remove('attach-animating');
        menu.style.height = '';
        const startH = menu.offsetHeight;
        mutate();
        const endH = menu.offsetHeight;
        if (startH === endH) { glassRefresh(); return; }
        menu.style.height = startH + 'px';
        void menu.offsetHeight;
        menu.classList.add('attach-animating');
        requestAnimationFrame(() => { menu.style.height = endH + 'px'; });
        const tick = () => {
            if (!menu.classList.contains('attach-animating')) return;
            glassRefresh();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => {
            menu.classList.remove('attach-animating');
            menu.style.height = '';
            glassRefresh();
        }, 280);
    }

    function backToAttachMain() {
        setAttachView('main', -1);
    }

    function backToGdocMenu() {
        stopDocRequestStatusWatch();
        setAttachView('gdoc', -1);
    }

    function chooseGdocNew() {
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to share a writing draft and keep feedback beside the work it belongs to.', 'Sign in to add a Google Doc');
            return;
        }
        setAttachView('input', 1);
        const input = document.getElementById('attachDocUrlInput');
        const err = document.getElementById('attachDocUrlError');
        if (err) { err.classList.add('hidden'); err.innerText = ''; }
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 60);
        }
    }

    function submitAttachNewDoc() {
        const input = document.getElementById('attachDocUrlInput');
        const err = document.getElementById('attachDocUrlError');
        const val = (input ? input.value : '').trim();
        if (!val) return;
        if (!val.includes('docs.google.com/document/d/')) {
            if (err) {
                err.innerText = "Invalid link. Use a https://docs.google.com/document/d/... URL";
                err.classList.remove('hidden');
            }
            return;
        }
        closeAttachMenu();
        sendMsg('text', val);
    }

    let attachDocListToken = 0;


    async function chooseGdocExisting() {
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to re-share one of your synced drafts with a classmate, teacher, or group.', 'Sign in to send a saved doc');
            return;
        }
        const listEl = document.getElementById('attachDocList');
        const btn = document.getElementById('gdocExistingBtn');
        if (!listEl) return;
        const myToken = ++attachDocListToken;

        // Stay on the level-2 view (panel keeps its size) while fetching;
        // the sub-label is the only loading feedback, so there is no
        // shrink-then-expand jump when the list finally renders.
        const subEl = btn ? btn.querySelector('.gdoc-row-sub') : null;
        if (btn) btn.disabled = true;
        if (subEl) subEl.innerText = 'Loading saved docs...';

        const { ok, docs } = await loadSavedDocs();

        if (btn) btn.disabled = false;
        if (subEl) subEl.innerText = 'Re-send a synced doc';
        // Menu closed or navigated away while fetching
        if (myToken !== attachDocListToken || attachCurrentView !== 'gdoc') return;

        const notice = (html) => `<div class="px-3 py-4 text-center text-[12px] text-gray-400 leading-relaxed">${html}</div>`;

        if (!ok) {
            listEl.innerHTML = notice("Could not load saved docs.<br>Check your connection and try again.");
        } else if (!docs.length) {
            listEl.innerHTML = notice("No Google Docs synced<br>in this chat yet.");
        } else {
            listEl.innerHTML = docs.map(d => `
                <button type="button" class="attach-doc-row w-full px-3 py-2.5 rounded-[14px] flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all" data-doc-url="${escapeHTML(d.docUrl).replace(/"/g, '&quot;')}">
                    <div class="w-8 h-8 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-black dark:text-white flex items-center justify-center flex-shrink-0">
                        <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                    </div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-[13px] font-semibold text-black dark:text-white leading-tight truncate">${escapeHTML(d.title)}</span>
                        <span class="text-[11px] text-black dark:text-white mt-0.5">${d.sub}</span>
                    </div>
                </button>`).join('');
        }

        // Content is already laid out, so the panel expands to its final height in one motion
        setAttachView('docs', 1);
        listEl.querySelectorAll('.attach-doc-row').forEach(row => {
            row.onclick = () => sendExistingDoc(row.getAttribute('data-doc-url'));
        });
    }

    function copyTextToPanel(text, btn) {
        const done = () => {
            if (!btn) return;
            btn.innerText = 'Copied!';
            setTimeout(() => { btn.innerText = 'Copy'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            ta.remove();
            done();
        }
    }

    function copyAttachBotEmail(btn) {
        copyTextToPanel(document.getElementById('attachBotEmail')?.innerText?.trim() || '', btn);
    }

    function copyDocRequestLink(btn) {
        copyTextToPanel(document.getElementById('docRequestLink')?.value || '', btn);
    }

    let docRequestStatusUnsub = null;

    function stopDocRequestStatusWatch() {
        if (docRequestStatusUnsub) {
            docRequestStatusUnsub();
            docRequestStatusUnsub = null;
        }
    }

    // Only the request's status node is readable by clients, so the panel can
    // flip to "Submitted" the moment someone uploads through the link.
    function watchDocRequestStatus(requestId) {
        stopDocRequestStatusWatch();
        const dot = document.getElementById('docRequestStatusDot');
        const label = document.getElementById('docRequestStatusLabel');
        if (!dot || !label) return;
        const paint = (submitted) => {
            dot.className = submitted
                ? 'w-1.5 h-1.5 rounded-full bg-[#34C759] flex-shrink-0'
                : 'w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse flex-shrink-0';
            label.innerText = submitted ? 'Submitted' : 'Awaiting submission...';
        };
        paint(false);
        docRequestStatusUnsub = onValue(
            ref(db, `writing_doc_requests/${requestId}/status`),
            (snap) => paint(snap.val() === 'submitted'),
            () => paint(false)
        );
    }

    async function chooseGdocRequest() {
        if (!window.isLoggedIn) {
            window.promptSignIn?.('Sign in to create a secure request link for a writing draft.', 'Sign in to request a document');
            return;
        }
        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        if (!currentUser || !activeTargetId) return;

        const loadingEl = document.getElementById('docRequestLoading');
        const readyEl = document.getElementById('docRequestReady');
        const showLoading = () => {
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (readyEl) readyEl.classList.add('hidden');
        };

        // Enter the loading screen first: the request round-trip should not
        // freeze the menu on the previous view.
        stopDocRequestStatusWatch();
        showLoading();
        setAttachView('request', 1);

        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);
        const payload = {
            chatId,
            requesterId: currentUser.id,
            requesterName: currentUser.name || 'A CHSchat user',
            recipientId: isGroup ? '' : activeTargetId
        };

        try {
            let resData = null;
            if (window.httpsCallable && window.firebaseFunctions) {
                const createFn = window.httpsCallable(window.firebaseFunctions, 'createDocRequest');
                resData = (await createFn(payload)).data;
            } else if (window.firebase && window.firebase.functions) {
                const createFn = window.firebase.functions().httpsCallable('createDocRequest');
                resData = (await createFn(payload)).data;
            }
            if (!resData || !resData.requestId) throw new Error('No request id returned');

            const linkEl = document.getElementById('docRequestLink');
            if (linkEl) linkEl.value = `${location.origin}/request.html?id=${resData.requestId}`;
            animateMenuSwap(() => {
                if (loadingEl) loadingEl.classList.add('hidden');
                if (readyEl) readyEl.classList.remove('hidden');
            });
            watchDocRequestStatus(resData.requestId);
        } catch (e) {
            console.warn('[DocRequest] Could not create the request link:', e);
            setAttachView('gdoc', -1);
            AppModules.Modal.alert("Request Failed", "Could not create the request link. Please try again in a moment.");
        }
    }

    async function sendExistingDoc(url) {
        closeAttachMenu();
        await sendMsg('text', url);
    }

    // Google Doc Card Expand / Collapse with Smooth Transition

    // Comment-card strip expand: reuse the doc card comment renderer so the
    // thread row (quote + comment + replies) is 100% identical to the card list.


    // Google Doc Card Comments Filter (All / Open / Resolved)

    // Google Doc Card Comments Synchronization (supports silent auto-sync).
    // The Cloud Function owns the access state machine and snapshot merge;
    // the frontend only renders the normalized status it receives back.

    // ============================================================
    // [Bot Comment Post] Inline composer on Google Doc cards.
    // The bot is only the courier: content is posted as
    // "Created by <platform user>: <text>" so real attribution survives
    // the round trip (UIComponents.docCommentDisplay strips it back out).
    // ============================================================

    // Shared send path for both the whole-doc note composer and per-comment
    // reply boxes. Returns true when the comment was posted.

    // When a user posts a reply/comment through a doc card, drop the same
    // content into the current chat as a comment_card, so it shows up
    // immediately without waiting for the Google sync to surface a row.

    // Whole-doc note composer (header bubble button)



    // Per-comment inline reply box, rendered directly under its comment row.



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
                radius: 22,            // matches rounded-[22px]
                refractionWidth: 12,   // matches chatInputPill bevel width
                maxDisplacement: 8,    // matches chatInputPill refraction strength
                mouseRadius: 55,       // matches chatInputPill hover ripple
                mouseStrength: 6       // matches chatInputPill ripple strength
            });
        }

        // Initialize Liquid Glass effect on the portfolio project/version modal
        const projectModalCard = document.getElementById('portfolioProjectCard');
        if (projectModalCard) {
            new LiquidGlassEffect(projectModalCard, {
                radius: 24,            // matches rounded-3xl
                refractionWidth: 12,   // matches attachMenu bevel width
                maxDisplacement: 8,    // matches attachMenu refraction strength
                mouseRadius: 55,       // matches attachMenu hover ripple
                mouseStrength: 6       // matches attachMenu ripple strength
            });
        }

        // Initialize Liquid Glass effect on the in-chat search results box
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            new LiquidGlassEffect(searchResults, {
                radius: 24,            // matches the 24px radius of #searchResults
                refractionWidth: 12,   // matches chatInputPill bevel width
                maxDisplacement: 8,    // matches chatInputPill refraction strength
                mouseRadius: 55,       // matches chatInputPill hover ripple
                mouseStrength: 6       // matches chatInputPill ripple strength
            });
        }

        // Initialize Liquid Glass on the two chat top-row bars (name/left,
        // actions/right), matching #wpDocContextBar and #chatInputPill.
        ['chatNameBar', 'chatActionsBar'].forEach(id => {
            const bar = document.getElementById(id);
            if (bar) {
                new LiquidGlassEffect(bar, {
                    radius: 24,
                    refractionWidth: 12,
                    maxDisplacement: 8,
                    mouseRadius: 55,
                    mouseStrength: 6
                });
            }
        });

        // Initialize Liquid Glass effect on the reply quote bar (same parameters as attachMenu)
        const quoteArea = document.getElementById('quoteArea');
        if (quoteArea) {
            new LiquidGlassEffect(quoteArea, {
                radius: 24,            // matches rounded-[24px]
                refractionWidth: 12,
                maxDisplacement: 8,
                mouseRadius: 55,
                mouseStrength: 6
            });
        }

        // Initialize Liquid Glass effect on the message context menu (same parameters as attachMenu)
        const messageContextMenu = document.getElementById('messageContextMenu');
        if (messageContextMenu) {
            new LiquidGlassEffect(messageContextMenu, {
                radius: 16,            // matches rounded-2xl (16px)
                refractionWidth: 12,
                maxDisplacement: 8,
                mouseRadius: 55,
                mouseStrength: 6
            });
        }
    }


    // ============================================================
    // [Doc Sync State Layer] writing_doc_state is the single snapshot
    // source of truth; message.docData is only a lightweight fallback.
    // ============================================================


    // Spread-merge two doc views, but never let a placeholder title ("Google
    // Document", produced by a failed file read) erase a real known title.

    // Merge a fresher doc view (state or sync response) into the session cache.

    // Resolve the best doc view for rendering: whichever source synced more
    // recently wins; a stale message copy can never hide state-backed comments.

    async function openWritingPortfolio(targetMsgKey = null, targetCommentId = null, targetDocId = null) {
        if (!window.isLoggedIn && !window.isChatPreview) {
            window.promptSignIn?.('Sign in to view the writing history connected to your conversations.', 'Sign in to view Writing Portfolio');
            return;
        }
        
        const drawer = document.getElementById('writingPortfolioDrawer');
        const content = document.getElementById('writingPortfolioContent');
        const subtitle = document.getElementById('writingPortfolioSubtitle');

        if (!drawer || !content) {
            console.error('%c❌ Portfolio DOM elements not found!', 'color:red');
            return;
        }

        // While open, the drawer lives under <body> and is viewport-fixed so its
        // left edge can animate smoothly and it is never clipped or z-trapped by
        // #chatSection. It returns to its original parent once fully closed.
        if (drawer.parentElement !== document.body) {
            window._wpDrawerHome = drawer.parentElement;
            document.body.appendChild(drawer);
        }
        
        
        drawer.classList.remove('hidden');
        drawer.classList.add('wp-drawer-open');
        setWritingPortfolioExpanded(false);
        
        requestAnimationFrame(() => {
            drawer.classList.remove('translate-x-full');
        });
        

        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        if (!activeTargetId) {
            console.error('%c❌ No active target chat!', 'color:red');
            return;
        }

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
        
        
        if (targetDocId) {
        }
        if (targetMsgKey) {
        }
        if (targetCommentId) {
        }

        try {
            
            // Retrieve all messages for this chat (merge local IndexedDB with Firebase RTDB for 100% sync)
            const fetchStart = Date.now();
            const previewMessages = window.isChatPreview
                ? window.CHAT_PREVIEW?.messages?.[chatId]
                : null;
            let localMsgs = previewMessages
                ? Object.entries(previewMessages).map(([key, message]) => ({ key, ...message }))
                : (await getLocalMessages(chatId)) || [];
            const localFetchTime = Date.now() - fetchStart;
            
            const msgMap = new Map();
            localMsgs.forEach(m => {
                if (m && m.key) msgMap.set(m.key, m);
            });

            if (!previewMessages) try {
                // Increased limit to ensure we capture documents that may be grouped
                // but not visible in the most recent 150 messages. This prevents
                // "doc not found" errors when opening portfolio from All Projects bar.
                const snap = await get(query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(500)));
                if (snap.exists()) {
                    const val = snap.val();
                    const rtdbKeys = Object.keys(val).length;
                    
                    Object.keys(val).forEach(k => {
                        msgMap.set(k, { key: k, ...val[k] });
                    });
                } else {
                    console.warn('%c⚠️ No messages found in Firebase for this chat', 'color:orange');
                }
            } catch (e) {
                console.error('%c❌ Firebase query error:', 'color:red', e);
            }

            const finalMsgCount = msgMap.size;
            localMsgs = Array.from(msgMap.values());
            
            if (targetDocId) {
                const docMatchCount = localMsgs.filter(m => 
                    (m.docData?.fileId === targetDocId) || 
                    (m.text?.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1] === targetDocId)
                ).length;
                if (docMatchCount === 0) {
                    console.warn('%c⚠️ WARNING: Target doc NOT FOUND in message list!', 'color:orange;font-weight:bold');
                }
            }

            // If targeting a specific docId that may not be in recent messages,
            // pre-load its data from writing_doc_state to ensure it appears in the portfolio
            let targetDocFoundInMessages = false;
            if (targetDocId && localMsgs.length > 0) {
                targetDocFoundInMessages = localMsgs.some(m => 
                    (m.docData?.fileId || (m.text?.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1])) === targetDocId
                );
                
                // If target doc not found in recent messages, try loading from writing_doc_state
                if (!targetDocFoundInMessages) {
                    try {
                        const stateSnap = await get(ref(db, `writing_doc_state/${chatId}/${targetDocId}`));
                        if (stateSnap.exists()) {
                            const docState = normalizeDocSyncState(stateSnap.val());
                            if (docState) {
                                // Merge cached doc info into message processing
                                mergeDocViewIntoCache(targetDocId, docState);
                            }
                        }
                    } catch (e) {
                        console.error('%c❌ Error loading from writing_doc_state:', 'color:red', e);
                    }
                }
            }

            // Ensure user hasn't switched to another chat while fetching
            if (getActiveTargetId() !== requestTargetId) {
                console.warn('%c⚠️ Chat switched during loading, aborting', 'color:orange');
                return;
            }

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
            
            
            // Debug: Show each doc message's docId extraction
            if (rawDocMsgs.length > 0) {
                rawDocMsgs.forEach((m, idx) => {
                    const text = m.text || '';
                    const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
                    const fileId = m.docData?.fileId;
                    const extractedId = match ? match[1] : null;
                    const finalId = fileId || extractedId || (m.key || `doc-${idx}`);
                    
                    if (finalId === targetDocId) {
                    }
                });
            }
            

            // Deduplicate: multiple cards sharing the same doc link/ID should only appear once
            // Also maintain a map of docId -> all corresponding message keys
            const seenDocIds = new Set();
            const docMessages = [];
            const docIdToKeys = new Map();

            for (let i = 0; i < rawDocMsgs.length; i++) {
                const m = rawDocMsgs[i];
                const text = m.text || '';
                const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
                const fileId = m.docData?.fileId;
                const extractedId = match ? match[1] : null;
                const docId = fileId || extractedId || (m.key || `doc-${i}`);
                
                m._portfolioDocId = docId;
                
                // Debug: Show if this matches target
                if (targetDocId && docId === targetDocId) {
                }

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
            
            if (targetDocId) {
            }

            // Save docIdToKeys mapping for quick message lookup on delete
            window._portfolioDocIdToKeys = docIdToKeys;

            const activeDocMessages = docMessages;

            if (activeDocMessages.length === 0) {
                content.innerHTML = `
                    <div class="min-h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 text-gray-400">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                        <div class="font-semibold text-sm text-black dark:text-white">No Google Docs Found</div>
                        <div class="text-xs mt-1 text-gray-400">Documents shared with ${UIUtils.escape(chatPartnerName)} will appear here.</div>
                        <div class="text-xs mt-3 text-gray-400 max-w-md mx-auto leading-relaxed">Writing Portfolio is an automatically built record of a student’s writing growth, collecting shared Google Docs, draft versions, teacher feedback, comment history, and reflections from the chat into one organized view so teachers can review progress, track revisions, and export a clear writing dossier without manually organizing every document.</div>
                        <div class="text-xs mt-3 text-gray-400 max-w-md mx-auto leading-relaxed">We do not use any kind of AI to analyse or summarize your documents.</div>
                        <button type="button" onclick="portfolioOpenAttachGdocMenu()" class="mt-5 w-full max-w-xs mx-auto self-center px-3 py-2.5 rounded-[14px] flex items-center gap-3 text-left bg-black/5 dark:bg-white/10 transition-colors duration-150 hover:bg-black/10 dark:hover:bg-white/[0.16]">
                            <div class="w-8 h-8 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-black dark:text-white flex items-center justify-center flex-shrink-0">
                                <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="12" y1="18" x2="12" y2="12"/>
                                    <line x1="9" y1="15" x2="15" y2="15"/>
                                </svg>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[14px] font-semibold text-black dark:text-white leading-tight">Add New Doc</span>
                                <span class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Paste sharing link</span>
                            </div>
                        </button>
                    </div>
                `;
                return;
            }

            // 1. Fetch manual project assignments
            let assignedProjects = {};
            if (!previewMessages) try {
                const projSnap = await get(ref(db, `writing_projects/${chatId}`));
                if (projSnap.exists()) {
                    assignedProjects = projSnap.val() || {};
                }
            } catch (e) {
                // Ignore permission/offline warnings gracefully
            }

            window._writingProjectsCache = window._writingProjectsCache || {};
            window._writingProjectsCache[chatId] = assignedProjects;

            // Load the snapshot state (single source of truth) and seed the session cache,
            // so docs wiped by the legacy empty-overwrite bug recover from RTDB state.
            if (!previewMessages) try {
                const stSnap = await get(ref(db, `writing_doc_state/${chatId}`));
                if (stSnap.exists()) {
                    const docStates = stSnap.val() || {};
                    Object.entries(docStates).forEach(([fid, st]) => {
                        const view = normalizeDocSyncState(st);
                        if (view) {
                            view.fileId = view.fileId || fid;
                            mergeDocViewIntoCache(fid, view);
                        }
                    });
                }
            } catch (e) {
                console.warn('[WritingPortfolio] Failed to load writing_doc_state (falling back to docData):', e);
            }


            // 2. Separate into manually grouped projects and standalone docs
            const projectMap = new Map();
            const standaloneItems = [];
            let totalPortfolioOpen = 0;

            activeDocMessages.forEach((m, idx) => {
                const key = m.key || `doc-${idx}`;
                const docId = m._portfolioDocId || key;
                const cachedDoc = resolveDocViewData(docId, m.docData);
                const rawTitle = cachedDoc?.title || 'Google Document';

                const comments = cachedDoc?.comments || [];
                // Deleted / not-returned snapshot comments never inflate the counts.
                const liveComments = UIComponents.docLiveComments(comments);
                let openCount = 0;
                let resolvedCount = 0;
                liveComments.forEach(c => {
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
                    deletedCount: comments.length - liveComments.length,
                    syncStatus: cachedDoc?.syncStatus || null,
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
            const totalPortfolioDeleted = [...sortedProjects.flatMap(p => p.items), ...standaloneItems]
                .reduce((sum, item) => sum + (item.deletedCount || 0), 0);

            // Cache active portfolio data globally for seamless tab switching and export
            window._activePortfolioData = {
                chatId: chatId,
                chatPartnerName: chatPartnerName,
                totalCount: totalCount,
                totalPortfolioOpen: totalPortfolioOpen,
                totalPortfolioDeleted: totalPortfolioDeleted,
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
                            <button type="button" onclick="window.switchPortfolioView('comments', this)" id="portfolioViewTab-comments" class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <span>Comments</span>
                            </button>
                            <button type="button" onclick="window.switchPortfolioView('timeline', this)" id="portfolioViewTab-timeline" class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>Timeline</span>
                            </button>
                        </div>

                        <!-- Right Actions: Export Button -->
                        <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
                            <button type="button" onclick="window.openPortfolioExportModal()" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gray-200/70 dark:bg-white/10 text-black dark:text-white accent-hover-medium shadow-sm transition-all" title="Export complete writing history">
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
                            <button type="button" onclick="window.filterPortfolioFeedback('open', this)" class="px-3 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5">
                                <span>Opened</span>
                                ${totalPortfolioOpen > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-black dark:text-white leading-none">${totalPortfolioOpen}</span>` : ''}
                            </button>
                            <button type="button" onclick="window.filterPortfolioFeedback('resolved', this)" class="px-3 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all">Resolved</button>
                        </div>
                    </div>

                    <!-- Row 2 (Alt): Contextual Author & Status Filter Bar for Comments View -->
                    <div id="portfolioFilterBarComments" class="hidden flex flex-wrap items-center justify-between gap-2 px-1">
                        <!-- Author Filter Chips -->
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl">
                            <button type="button" onclick="window.filterPortfolioAuthor('all', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all">All Feedback</button>
                            <button type="button" onclick="window.filterPortfolioAuthor('teacher', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Teachers</span>
                            </button>
                            <button type="button" onclick="window.filterPortfolioAuthor('student', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Students</span>
                            </button>
                            <button type="button" onclick="window.filterPortfolioAuthor('peer', this)" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all flex items-center gap-1">
                                <span>Peer Review</span>
                            </button>
                        </div>

                        <!-- Status Filter Chips -->
                        <div class="inline-flex items-center gap-1 bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl">
                            <button type="button" onclick="window.filterPortfolioCommentStatus('all', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm transition-all">All</button>
                            <button type="button" onclick="window.filterPortfolioCommentStatus('open', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all">Open</button>
                            <button type="button" onclick="window.filterPortfolioCommentStatus('resolved', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all">Resolved</button>
                            ${totalPortfolioDeleted > 0 ? `<button type="button" onclick="window.filterPortfolioCommentStatus('deleted', this)" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-black dark:text-white hover:text-black dark:hover:text-white transition-all">Deleted</button>` : ''}
                        </div>
                    </div>
                </div>

                ${groupingSuggestions.map((suggestion, index) => `
                    <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/10 border border-[#007AFF]/15 dark:border-[#0A84FF]/20">
                        <div class="min-w-0">
                            <div class="text-[12px] font-bold text-[#007AFF] dark:text-[#0A84FF]">Possible versions of ${UIUtils.escape(suggestion.projectName)}</div>
                            <div class="text-[11px] text-black dark:text-white mt-0.5">${suggestion.items.map(item => UIUtils.escape(item.parsed.versionLabel)).join(' · ')} — group these ${suggestion.items.length} documents?</div>
                        </div>
                        <button type="button" onclick="window.acceptPortfolioGroupingSuggestion(${index})" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#007AFF] hover:bg-[#0062cc] text-white transition-colors">Group</button>
                    </div>
                `).join('')}

                <!-- VIEW 1: CARDS VIEW (Standard Grouped / Versioned Documents) -->
                <div id="portfolioCardsView">
            `;

            // Render Manually Grouped Writing Projects
            sortedProjects.forEach((proj, pIdx) => {
                const projId = `proj-${pIdx}`;
                // Sort versions by versionOrder ascending (Draft 1 -> Draft 2 -> Final)
                proj.items.sort((a, b) => a.versionOrder - b.versionOrder || a.itemTime - b.itemTime);

                const lastIdx = proj.items.length - 1; // Default to latest version

                html += `
                    <div id="${projId}" data-has-open="${proj.hasOpen ? 'true' : 'false'}" data-has-resolved="${proj.hasResolved ? 'true' : 'false'}" class="portfolio-group-item bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-4 text-left">
                        <!-- Project Header & Version Stepper -->
                        <div id="projHeader-${projId}" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-9 h-9 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-gray-700 dark:text-gray-200 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-[16px] font-bold text-black dark:text-white truncate">${UIUtils.escape(proj.projectName)}</h3>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-[12px] text-black dark:text-white font-medium">${proj.items.length} ${proj.items.length === 1 ? 'Version' : 'Versions'}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Version Stepper Tabs -->
                            <div class="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl overflow-x-auto scrollbar-none">
                                ${proj.items.map((item, vIdx) => {
                                    const isActive = vIdx === lastIdx;
                                    return `
                                        <button type="button" onclick="window.switchProjectVersion('${projId}', ${vIdx}, event)" id="projTab-${projId}-${vIdx}" class="px-3 py-1 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-black dark:text-white hover:text-black dark:hover:text-white'}">
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
                                        <div class="flex items-center justify-between gap-2 text-[12px] font-medium px-1 mb-1.5">
                                            <span class="text-black dark:text-white truncate">${UIUtils.escape(item.msg.senderName || '')}</span>
                                            <span id="portfolio-date-${item.docId}" data-msg-key="${item.key}" class="text-black dark:text-white truncate text-center flex-1 min-w-0">${dateDisplay}</span>
                                            <div class="flex items-center gap-1 flex-shrink-0">
                                                <button type="button" onclick="window.openProjectAssignModal('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event)" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Edit version or ungroup">
                                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button type="button" onclick="window.deletePortfolioCard('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event, '${item.key}')" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Delete card from writing portfolio">
                                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
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
                        <div class="flex items-center justify-between gap-2 text-[12px] font-medium px-1 mb-1.5">
                            <span class="text-black dark:text-white truncate">${UIUtils.escape(item.msg.senderName || '')}</span>
                            <span id="portfolio-date-${item.docId}" data-msg-key="${item.key}" class="text-black dark:text-white truncate text-center flex-1 min-w-0">${dateDisplay}</span>
                            <div class="flex items-center gap-1 flex-shrink-0">
                                <button type="button" onclick="window.openProjectAssignModal('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event)" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Add this document to a Writing Project">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                        <line x1="12" y1="11" x2="12" y2="17"></line>
                                        <line x1="9" y1="14" x2="15" y2="14"></line>
                                    </svg>
                                </button>
                                <button type="button" onclick="window.deletePortfolioCard('${item.docId}', '${UIUtils.escape(item.rawTitle)}', event, '${item.key}')" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Delete card from writing portfolio">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
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
                        const content = document.getElementById('writingPortfolioContent');
                        const needsScroll = content && content.scrollHeight > content.clientHeight;
                        
                        if (needsScroll) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        // Also auto-expand comments if target with smooth accordion animation
                        const drawer = document.getElementById(`docDrawer-portfolio-${targetMsgKey}`) || targetEl.querySelector('[id^="docDrawer-"]');
                        const arrow = document.getElementById(`docArrow-portfolio-${targetMsgKey}`) || targetEl.querySelector('[id^="docArrow-"]');
                        if (drawer && !drawer.classList.contains('expanded') && drawer.classList.contains('hidden')) {
                            drawer.classList.remove('hidden');
                            void drawer.offsetHeight;
                            drawer.classList.add('expanded');
                            if (arrow) arrow.style.transform = 'rotate(180deg)';
                        }

                        // Jump to the specific comment once the drawer has opened.
                        if (targetCommentId && drawer) {
                            setTimeout(() => {
                                const row = drawer.querySelector(`[data-comment-id="${targetCommentId}"]`);
                                if (row) {
                                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    row.classList.add('wp-comment-flash');
                                    setTimeout(() => row.classList.remove('wp-comment-flash'), 1800);
                                }
                            }, 380);
                        }
                    }
                }, 150);
            } else if (targetDocId) {
                
                // Capture mapping state IMMEDIATELY (before any async operations)
                const currentMappings = window._portfolioDocIdToKeys || new Map();
                
                // Find and expand the card for this docId - use captured reference
                setTimeout(() => {
                    const mappings = window._portfolioDocIdToKeys || new Map();
                    
                    // Debug: Check if it's the same object or different
                    
                    const keys = mappings.get(targetDocId) || [];
                    
                    if (keys.length > 0) {
                        const firstKey = keys[0];
                        const targetEl = document.getElementById(`portfolio-item-${firstKey}`);
                        if (targetEl) {
                            
                            const content = document.getElementById('writingPortfolioContent');
                            const needsScroll = content && content.scrollHeight > content.clientHeight;
                            
                            if (needsScroll) {
                                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            
                            const drawer = document.getElementById(`docDrawer-portfolio-${firstKey}`) || targetEl.querySelector('[id^="docDrawer-"]');
                            const arrow = document.getElementById(`docArrow-portfolio-${firstKey}`) || targetEl.querySelector('[id^="docArrow-"]');
                            
                            
                            if (drawer && !drawer.classList.contains('expanded') && drawer.classList.contains('hidden')) {
                                drawer.classList.remove('hidden');
                                void drawer.offsetHeight;  // Force reflow for transition
                                drawer.classList.add('expanded');
                                if (arrow) {
                                    arrow.style.transform = 'rotate(180deg)';
                                }
                            }
                        } else {
                            console.warn('%c⚠️ Portfolio item element NOT found!', 'color:orange');
                        }
                    } else {
                        console.warn('%c❌ Doc not in _portfolioDocIdToKeys mapping!', 'color:red;font-weight:bold');
                    }
                }, 150);
            }
        } catch (err) {
            console.error('%c❌ Failed to load timeline:', 'color:red', err);
            return;
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
            t.classList.add('text-black', 'dark:text-white');
        });

        const activeBtn = btnEl || document.getElementById(`portfolioViewTab-${viewName}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-black', 'dark:text-white');
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
            const cachedDoc = resolveDocViewData(docId, m.docData);
            const docTitle = cachedDoc?.title || 'Google Document';
            const docUrl = m.docData?.docUrl || (match ? match[0] : (docId ? `https://docs.google.com/document/d/${docId}/edit` : ''));
            const comments = cachedDoc?.comments || [];

            comments.forEach(c => {
                const cTime = c.createdTime ? new Date(c.createdTime).getTime() : (m.timestamp || 0);
                const disp = UIComponents.docCommentDisplay(c);
                const aName = disp.author || 'Reviewer';
                const aEmail = c.author?.emailAddress || '';
                const { role, label } = classifyCommentAuthor(aName, aEmail, currentUserId, currentUser);
                const isDeleted = !!(c.deleted || c.status === 'deleted_on_google');
                const isMissing = !isDeleted && c.status === 'missing_from_latest_sync';

                allComments.push({
                    comment: c,
                    displayContent: disp.content,
                    viaBot: disp.viaBot,
                    docId: docId,
                    docTitle: docTitle,
                    docUrl: docUrl,
                    msgKey: m.key || '',
                    authorName: aName,
                    authorEmail: aEmail,
                    authorRole: role,
                    roleLabel: label,
                    time: cTime,
                    isDeleted: isDeleted,
                    isMissing: isMissing,
                    resolved: !!c.resolved && !isDeleted
                });
            });
        });

        // Sort comments chronologically descending (newest feedback first)
        allComments.sort((a, b) => b.time - a.time);

        const currentAuthor = authorFilter || 'all';
        const currentStatus = commentStatusFilter || 'all';

        const filtered = allComments.filter(item => {
            if (currentAuthor !== 'all' && item.authorRole !== currentAuthor) return false;
            if (currentStatus === 'open' && (item.resolved || item.isDeleted)) return false;
            if (currentStatus === 'resolved' && (!item.resolved || item.isDeleted)) return false;
            if (currentStatus === 'deleted' && !item.isDeleted) return false;
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
            const dimRow = item.isDeleted || item.isMissing;
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
            // Google inserts empty-content replies on resolve/reopen; skip them.
            const visibleReplies = (c.replies || []).filter(r => r && String((UIComponents.docCommentDisplay(r).content) || '').trim());
            if (visibleReplies.length > 0) {
                repliesHtml = visibleReplies.map(r => {
                    const rDisp = UIComponents.docCommentDisplay(r);
                    return `
                    <div class="mt-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 text-[12px]">
                        <span class="font-semibold text-black dark:text-white">${UIUtils.escape(rDisp.author || 'User')}:</span>
                        <span class="text-gray-600 dark:text-gray-300 ml-1">${UIUtils.escape(rDisp.content || '')}</span>
                    </div>
                `;
                }).join('');
            }

            return `
                <div class="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-4 text-left${dimRow ? ' opacity-60' : ''}">
                    <!-- Doc Reference & Date -->
                    <div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/5">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2 h-2 rounded-full ${isResolved ? 'bg-gray-300 dark:bg-white/20' : 'bg-[#007AFF] dark:bg-[#0A84FF]'} flex-shrink-0"></span>
                            <span class="text-[13px] font-bold text-black dark:text-white truncate">${UIUtils.escape(item.docTitle)}</span>
                        </div>
                        <span class="text-[11px] text-black dark:text-white whitespace-nowrap">${formattedDate}</span>
                    </div>

                    ${quoteHtml}

                    <!-- Author Info & Direct Google Doc link -->
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[14px] font-semibold text-black dark:text-white">${UIUtils.escape(item.authorName)}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeClass}">${item.roleLabel}</span>
                            ${item.isDeleted ? '<span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Deleted in Google Docs</span>' : ''}
                            ${item.isMissing ? '<span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium" title="Google has not returned this comment in recent full syncs">Not in latest sync</span>' : ''}
                            ${isResolved && !item.isDeleted ? '<span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Resolved</span>' : ''}
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                            <button type="button" onclick="window.portfolioJumpToChat('${item.msgKey}', '${item.docId}', '${c.id || ''}', '${UIUtils.escape(item.docTitle)}')" class="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#007AFF] dark:hover:text-[#0A84FF] transition-colors" title="Locate this comment in chat">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <line x1="12" y1="2.5" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="21.5"></line><line x1="2.5" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="21.5" y2="12"></line>
                                </svg>
                                <span>Locate</span>
                            </button>
                            <a href="${UIUtils.escape(commentDirectUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline" title="Jump to this comment in Google Doc">
                                <span>View Doc</span>
                                <svg class="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                        </div>
                    </div>

                    <div class="text-[13px] ${dimRow ? 'italic text-black dark:text-white' : 'text-gray-800 dark:text-gray-200'} leading-relaxed">${UIUtils.escape(item.displayContent || '')}</div>
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
                b.classList.add('text-black', 'dark:text-white');
            });
            btnEl.classList.remove('text-black', 'dark:text-white');
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
                b.classList.add('text-black', 'dark:text-white');
            });
            btnEl.classList.remove('text-black', 'dark:text-white');
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
                    syncStatus: item.syncStatus || null,
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
                syncStatus: item.syncStatus || null,
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
                                <div onclick="window.portfolioJumpToChat('${entry.key}', '${entry.docId}', '', '${UIUtils.escape(entry.rawTitle)}')" class="relative cursor-pointer bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-3.5 hover:border-[#007AFF]/50 transition-colors">
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
                                                ${entry.syncStatus && entry.syncStatus !== 'synced' && entry.syncStatus !== 'no_comments_yet' ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400" title="Showing saved snapshot — sync status: ${UIUtils.escape(entry.syncStatus)}">snapshot</span>` : ''}
                                            </div>
                                            <span class="text-[11px] text-black dark:text-white whitespace-nowrap" title="${entry.dateSource}; last feedback is tracked separately">${entry.dateSource} · ${dateStr}</span>
                                            <button type="button" onclick="event.stopPropagation(); window.switchPortfolioView('cards'); setTimeout(() => { const el = document.getElementById('portfolio-item-${entry.key}'); if(el) el.scrollIntoView({behavior:'smooth', block:'center'}); }, 100);" class="text-[#007AFF] dark:text-[#0A84FF] hover:underline text-[12px] font-semibold ml-1">
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
            const cachedDoc = resolveDocViewData(docId, m.docData);
            const docTitle = cachedDoc?.title || 'Google Document';
            const docUrl = m.docData?.docUrl || (match ? match[0] : (docId ? `https://docs.google.com/document/d/${docId}/edit` : ''));
            const comments = cachedDoc?.comments || [];
            const liveComments = UIComponents.docLiveComments(comments);
            const dossierStatus = cachedDoc?.syncStatus || '';
            const isSnapshotView = !!dossierStatus && dossierStatus !== 'synced' && dossierStatus !== 'no_comments_yet';
            const dossierSyncedAt = cachedDoc?.lastSuccessfulSyncAt || cachedDoc?.lastSyncedAt || null;

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
                            <div class="text-[11px] text-black dark:text-white mt-1">
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
                        <div class="text-[11px] font-bold text-black dark:text-white uppercase tracking-wider">
                            Feedback & Comments (${liveComments.length})
                        </div>
                        ${isSnapshotView ? `<div class="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Snapshot record (${UIUtils.escape(dossierStatus)})${dossierSyncedAt ? ' as of ' + new Date(dossierSyncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} — newer comments may exist in Google Docs.</div>` : ''}
            `;

            if (comments.length === 0) {
                dossierHtml += `
                    <div class="text-[11px] text-gray-400 italic py-1">No recorded comments on this document.</div>
                `;
            } else {
                dossierHtml += comments.map(c => {
                    const quoteVal = c.quotedFileContent?.value || '';
                    const cDisp = UIComponents.docCommentDisplay(c);
                    const aName = cDisp.author || 'Instructor';
                    const cDeleted = !!(c.deleted || c.status === 'deleted_on_google');
                    const cMissing = !cDeleted && c.status === 'missing_from_latest_sync';
                    const isResolved = !!c.resolved && !cDeleted;
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
                    // Google inserts empty-content replies on resolve/reopen; skip them.
                    const dossierReplies = (c.replies || []).filter(r => r && String((UIComponents.docCommentDisplay(r).content) || '').trim());
                    if (dossierReplies.length > 0) {
                        repliesBlock = dossierReplies.map(r => {
                            const rDisp = UIComponents.docCommentDisplay(r);
                            return `
                            <div class="mt-1.5 pl-2.5 border-l-2 border-[#007AFF]/30 dark:border-[#0A84FF]/30 text-[11px]">
                                <span class="font-semibold text-black dark:text-white">${UIUtils.escape(rDisp.author || 'Student')}:</span>
                                <span class="text-gray-600 dark:text-gray-300 ml-1">${UIUtils.escape(rDisp.content || '')}</span>
                            </div>
                        `;
                        }).join('');
                    }

                    return `
                        <div class="bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/5 rounded-lg p-2.5 text-left${cDeleted || cMissing ? ' opacity-60' : ''}">
                            ${quoteBlock}
                            <div class="flex items-center justify-between text-[11px] mb-1">
                                <div class="flex items-center gap-1.5">
                                    <span class="font-semibold text-black dark:text-white">${UIUtils.escape(aName)}</span>
                                    ${cDeleted
                                        ? `<span class="text-[10px] px-1.5 py-0.2 rounded font-medium bg-gray-100 dark:bg-white/10 text-gray-400">Deleted in Google Docs</span>`
                                        : cMissing
                                            ? `<span class="text-[10px] px-1.5 py-0.2 rounded font-medium bg-gray-100 dark:bg-white/10 text-gray-400">Not in latest sync</span>`
                                            : `<span class="text-[10px] px-1.5 py-0.2 rounded font-medium ${isResolved ? 'bg-gray-100 dark:bg-white/10 text-gray-400' : 'bg-[#007AFF]/10 text-[#007AFF]'}">${isResolved ? 'Resolved' : 'Open'}</span>`}
                                </div>
                                <span class="text-[10px] text-gray-400">${cDate}</span>
                            </div>
                            <div class="text-[12px] ${cDeleted || cMissing ? 'italic text-black dark:text-white' : 'text-gray-800 dark:text-gray-200'}">${UIUtils.escape(cDisp.content || '')}</div>
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
                    tab.classList.remove('text-black', 'dark:text-white');
                    tab.classList.add('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                } else {
                    tab.classList.remove('bg-white', 'dark:bg-[#2C2C2E]', 'text-black', 'dark:text-white', 'shadow-sm');
                    tab.classList.add('text-black', 'dark:text-white');
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
                b.classList.add('text-black', 'dark:text-white');
            });
            btnEl.classList.remove('text-black', 'dark:text-white');
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

    function wpCurrentLeft(expanded) {
        const ref = document.getElementById(expanded ? 'sidePanel' : 'chatSection');
        if (!ref) return 0;
        return Math.max(0, Math.round(ref.getBoundingClientRect().left));
    }

    let _wpExpandAnimT = null;

    // Expanding only makes sense when the collapsed drawer (chat-column wide)
    // actually leaves room on screen — on phones the drawer is already the
    // full viewport, so hide the button and keep the drawer collapsed.
    function wpCanExpand() {
        const chat = document.getElementById('chatSection');
        if (!chat || chat.offsetParent === null) return false;
        return chat.getBoundingClientRect().left >= 80;
    }

    function setWritingPortfolioExpanded(isExpanded, animate) {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer) return;
        const exp = !!isExpanded && wpCanExpand();
        drawer.classList.toggle('wp-expanded', exp);
        // Only position while the drawer is actually mounted as the open overlay.
        if (drawer.classList.contains('wp-drawer-open')) {
            const target = wpCurrentLeft(exp) + 'px';
            if (animate) {
                // Explicit expand/collapse click: enable a left transition just
                // for this change, then revert so open / tracking stay instant.
                drawer.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1), left 440ms cubic-bezier(0.22, 1, 0.36, 1)';
                drawer.style.left = target;
                clearTimeout(_wpExpandAnimT);
                _wpExpandAnimT = setTimeout(() => {
                    const d = document.getElementById('writingPortfolioDrawer');
                    if (d) d.style.transition = '';
                }, 460);
            } else {
                drawer.style.left = target;
            }
        }
        const expIcon = document.getElementById('wpExpandIcon');
        const colIcon = document.getElementById('wpCollapseIcon');
        const btn = document.getElementById('writingPortfolioExpandBtn');
        if (btn) btn.style.display = wpCanExpand() ? '' : 'none';
        if (expIcon) expIcon.classList.toggle('hidden', exp);
        if (colIcon) colIcon.classList.toggle('hidden', !exp);
        if (btn) btn.setAttribute('title', exp ? 'Collapse' : 'Expand');
        composerFollowDrawer(exp, animate);
    }

    // Restore the drawer to its resting state after the slide-out finishes.
    function resetWritingPortfolioDrawer() {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer) return;
        drawer.classList.remove('wp-expanded', 'wp-drawer-open');
        drawer.style.transition = '';
        drawer.style.left = '';
        if (window._wpDrawerHome && drawer.parentElement !== window._wpDrawerHome) {
            window._wpDrawerHome.appendChild(drawer);
        }
        drawer.classList.add('translate-x-full');
    }

    // Track the panel edge in lockstep while #sidePanel / #chatSection animate
    // their width (window resize or the Tools/Writing collapse toggle). left is
    // not transitioned by default, so this repositions instantly on every tick.
    function wpFollowPanelGeometry() {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer || !drawer.classList.contains('wp-drawer-open')) return;
        setWritingPortfolioExpanded(drawer.classList.contains('wp-expanded'), false);
    }

    function toggleWritingPortfolioExpand() {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer || !wpCanExpand()) return;
        setWritingPortfolioExpanded(!drawer.classList.contains('wp-expanded'), true);
    }

    function closeWritingPortfolio() {
        const drawer = document.getElementById('writingPortfolioDrawer');
        if (!drawer) return;

        // Any overlays anchored to portfolio views must not outlive the drawer.
        const projModal = document.getElementById('portfolioProjectModal');
        if (projModal && !projModal.classList.contains('hidden')) closePortfolioProjectModal();
        const exportModal = document.getElementById('portfolioExportModal');
        if (exportModal && !exportModal.classList.contains('hidden')) closePortfolioExportModal();
        closeForwardPicker();
        // A composer lifted over the drawer must not float once it closes.
        liftComposerForPortfolio(false);

        // Slide out to the right from wherever it is (collapsed or expanded),
        // then reset geometry once the transition has finished.
        drawer.classList.add('translate-x-full');
        setTimeout(() => {
            drawer.classList.add('hidden');
            resetWritingPortfolioDrawer();
            // Chat geometry/visibility may have changed while the drawer covered
            // it, and no scroll event fires after the slide-out — resync the bar.
            scheduleWpDocContext();
        }, 400);
    }

    // Portfolio empty-state shortcut: close the drawer and pop open the chat
    // attachment menu directly on the Google Doc sub-view (user still picks
    // "Add New Doc" / "Send Existing Doc" themselves).
    function portfolioOpenAttachGdocMenu() {
        closeWritingPortfolio();
        setTimeout(() => {
            setAttachView('gdoc', 0);
            const menu = document.getElementById('attachMenu');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden') || menu.classList.contains('menu-hidden');
            if (isHidden) toggleAttachMenu(null);
        }, 420);
    }
    window.portfolioOpenAttachGdocMenu = portfolioOpenAttachGdocMenu;

    // ---- Chat project soft-filter (writing-doc context bar) ---------------
    // The always-visible glass bar under the chat header is a project
    // switcher. Picking a project hides the messages that are not tied to one
    // of its docs; nothing is moved or refetched, so "All Projects" restores
    // the full chat. A grouped project is the Portfolio folder name, an
    // ungrouped doc is its own project named after the Google Doc title.
    const WP_ALL_PROJECTS = '__all__';
    let _activeChatProject = WP_ALL_PROJECTS;
    let _chatProjects = [];
    let _wpBarPending = null;
    let _wpFilterSince = 0;

    // Expanded, the row above the divider is always "All Projects"; collapsed,
    // the pill shows the current scope. Either way it is rendered with the same
    // icon language as the list: folder for a collection, doc for a single file.
    function updateWpProjectHeader(isOpen) {
        const selected = wpActiveProject();
        const showingAll = isOpen || !selected;
        const card = document.getElementById('wpDocContextBar');

        const titleOut = document.getElementById('wpDocContextTitle');
        const name = showingAll ? 'All Projects' : selected.name;
        if (titleOut && titleOut.innerText !== name) titleOut.innerText = name;

        const iconOut = document.getElementById('wpProjectHeaderIcon');
        if (iconOut) {
            // Icon logic:
            // - When OPEN: show folder/doc icon matching the type
            // - When CLOSED and ALL PROJECTS: always show FOLDER icon (can expand to view projects)
            // - When CLOSED and SPECIFIC PROJECT: show EXPAND/COLLAPSE icon (toggle filter on/off)
            let iconHtml;
            if (isOpen) {
                // Open state: show folder/icon based on project type
                iconHtml = (showingAll || selected.isGroup) ? WP_ROW_FOLDER_ICON : WP_ROW_DOC_ICON;
            } else {
                // Closed state
                if (showingAll) {
                    // All Projects: use folder icon (click to open project list)
                    iconHtml = WP_ROW_FOLDER_ICON;
                } else if (selected.isGroup) {
                    // Specific group project: use expand icon (toggle filter)
                    iconHtml = WP_ROW_EXPAND_ICON;
                } else {
                    // Standalone doc project: use collapse icon (toggle filter)
                    iconHtml = WP_ROW_COLLAPSE_ICON;
                }
            }
            if (iconOut.innerHTML !== iconHtml) iconOut.innerHTML = iconHtml;
        }

        const subOut = document.getElementById('wpProjectHeaderSub');
        if (subOut) {
            let sub = '';
            if (showingAll) {
                sub = wpCountLabel(_chatProjects.length, 'project');
            } else if (selected.isGroup) {
                sub = wpCountLabel(selected.docIds.size, 'version');
            }
            if (subOut.innerText !== sub) subOut.innerText = sub;
        }

        // The tick marks the row that is actually in effect, and only while open.
        if (card) card.classList.toggle('wp-header-checked', !!isOpen && !selected);
        // "All Projects" must never ellipsize, in the pill or the open header.
        if (card) card.classList.toggle('wp-title-full', name === 'All Projects');
        // A selected document may have a much longer name than the previous
        // scope.  Re-evaluate in the same task so that title never gets a
        // frame to paint at its max-content width before compacting/truncating.
        if (!isOpen) repositionWpBar();
    }

    // Open Writing Portfolio for the currently selected project and auto-expand its latest card
    async function openPortfolioForSelectedProject(e) {
        e?.stopPropagation(); // Prevent triggering toggleWpProjectMenu
        
        
        const selected = wpActiveProject();
        if (!selected) {
            console.warn('%c❌ No project selected (currently "All Projects")', 'color:orange');
            console.warn('Hint: Please select a specific project first, then click the folder icon.');
            return; // If all projects selected, do nothing
        }
        
        const activeDocId = Array.from(selected.docIds)[0];
        if (!activeDocId) {
            console.warn('%c❌ Project has no docIds', 'color:orange');
            return;
        }
        
        
        // Get current chat context
        const activeTargetId = getActiveTargetId();
        const currentUser = getCurrentUser();
        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);
        
        
        // Check if target doc exists in writing_doc_state BEFORE opening
        try {
            const stateRef = ref(db, `writing_doc_state/${chatId}/${activeDocId}`);
            const stateSnap = await get(stateRef);
            if (stateSnap.exists()) {
                const docState = normalizeDocSyncState(stateSnap.val());
                if (docState) {
                }
            } else {
                console.warn('%c⚠️ Not found in writing_doc_state', 'color:orange');
            }
        } catch (e) {
            console.error('%c❌ Error checking writing_doc_state:', 'color:red', e);
        }
        
        
        // Open Writing Portfolio with targetDocId - let internal logic handle auto-expand
        const startTime = Date.now();
        await openWritingPortfolio(null, null, activeDocId);
        const endTime = Date.now();
        
    }
    

    function wpCountLabel(count, noun) {
        if (!count) return '';
        return `${count} ${count === 1 ? noun : noun + 's'}`;
    }

    function wpActiveProject() {
        if (_activeChatProject === WP_ALL_PROJECTS) return null;
        return _chatProjects.find(p => p.id === _activeChatProject) || null;
    }

    // True while something is hidden or the empty hint is on screen: it is what
    // forces a restore pass even after the filter itself has been cleared.
    let _wpFilterDirty = false;

    function applyChatProjectFilter() {
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;
        const project = wpActiveProject();
        if (!project && !_wpFilterDirty) return;
        let hidden = 0;
        
        chatBox.querySelectorAll('.msg-pop').forEach(el => {
            // 🆕 NEW: Support multiple docIds (comma-separated)
            const elDocIdAttr = el.getAttribute('data-doc-id') || '';
            const elDocIds = elDocIdAttr.split(',').filter(Boolean).map(id => id.trim());
            
            // Anything that lands after the filter was switched on stays visible,
            // so a message sent from inside a project view never disappears.
            const isNewer = _wpFilterSince && Number(el.dataset.timestampMs || 0) > _wpFilterSince;
            const show = !project || isNewer || (elDocIds.length > 0 && elDocIds.some(id => project.docIds.has(id)));
            el.classList.toggle('hidden', !show);
            if (!show) hidden++;
        });

        const host = chatBox.parentElement;
        let hint = document.getElementById('wpProjectEmptyHint');
        const wantHint = !!project && hidden === chatBox.querySelectorAll('.msg-pop').length;
        if (wantHint && !hint && host) {
            hint = document.createElement('div');
            hint.id = 'wpProjectEmptyHint';
            hint.className = 'text-xs text-gray-400';
            host.appendChild(hint);
            hint.innerHTML = `<div class="font-semibold text-sm text-black dark:text-white">No messages in this project yet</div>
                <div class="mt-1">Docs shared into ${UIUtils.escape(project.name)} will appear here.</div>`;
        } else if (!wantHint && hint) {
            hint.remove();
            hint = null;
        }
        _wpFilterDirty = hidden > 0 || !!hint;
    }

    function resetChatProjectFilter() {
        _activeChatProject = WP_ALL_PROJECTS;
        _chatProjects = [];
        _wpFilterSince = 0;
        updateWpProjectHeader(false);
        applyChatProjectFilter();
    }

    function selectChatProject(projectId) {
        const project = _chatProjects.find(p => p.id === projectId) || null;
        _activeChatProject = project ? project.id : WP_ALL_PROJECTS;
        _wpFilterSince = project ? Date.now() : 0;
        // NOT updateWpProjectHeader(false) here: the card is still open, and
        // shrinking its header content would snap the max-content card to the
        // pill width on the click frame — the collapse branch would then
        // measure an already-narrow "expanded" width and the whole retract
        // animation would degenerate into a vertical clip. The close path in
        // setWpProjectMenuOpen(false) performs the header swap after the ghost
        // clone has captured the wide card.
        applyChatProjectFilter();
        setWpProjectMenuOpen(false);
        // Every switch lands at the newest end of what is now on screen, whether
        // that is a project's last message or the restored full history.
        const chatBox = document.getElementById('chatBox');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        // All->sub only HIDES messages, so nothing re-enters and the switch
        // reads as an instant flash (sub->all animates because hidden->visible
        // replays the entrance on its own). Replay the entrance on the surviving
        // visible set so every direction animates alike. Deliberately not in
        // applyChatProjectFilter: new messages arriving under an active filter
        // must not re-pop the whole list.
        if (chatBox) {
            const survivors = Array.from(chatBox.querySelectorAll('.msg-pop:not(.hidden)'));
            survivors.forEach(el => { el.classList.remove('msg-replay'); });
            void chatBox.offsetWidth;
            survivors.forEach(el => { el.classList.add('msg-replay'); });
        }
    }

    // Newest-first, matching how the chat and Portfolio list the material.
    function scanChatWritingDocs() {
        const docs = [];
        const seen = new Set();
        const add = (docId, title, ts) => {
            if (!docId || seen.has(docId)) return;
            seen.add(docId);
            docs.push({ docId, title: (title || 'Google Document').trim(), ts: Number(ts) || 0 });
        };
        // #chatBox only carries the latest message window, so on a chat switch it
        // is rebuilt from a truncated slice and older doc cards vanish from it.
        // The stored message list is the full history, so scan that first and
        // union the DOM afterwards to keep cards shown outside it (search jumps).
        (currentLocalMsgs || []).forEach(m => {
            const text = m?.text || '';
            if (!text.includes('docs.google.com/document/d/')) return;
            const docId = m.docData?.fileId
                || text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)?.[1]
                || '';
            add(docId, window.resolveDocViewData?.(docId, m.docData)?.title, m.timestamp);
        });
        const chatBox = document.getElementById('chatBox');
        chatBox?.querySelectorAll('.doc-card-container').forEach(card => {
            add(card.dataset.docId || '', card.querySelector('h4[id^="docTitle-"]')?.innerText);
        });
        return docs;
    }

    async function buildChatProjects() {
        const docs = scanChatWritingDocs();
        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        if (!currentUser || !activeTargetId) return [];

        const isGroup = activeTargetId.startsWith('group_');
        const chatId = isGroup ? activeTargetId : getChatId(currentUser.id, activeTargetId);

        let assigned = {};
        try {
            const snap = await get(ref(db, `writing_projects/${chatId}`));
            if (snap.exists()) assigned = snap.val() || {};
        } catch (e) {
            console.warn('[ChatProjects] Failed to load writing_projects:', e);
        }

        // The message scan is bounded by what is currently rendered, so a chat
        // switch (which rebuilds #chatBox from a truncated window) silently drops
        // older projects.  Union in the authoritative per-chat sources so the
        // project list is stable regardless of scroll position.
        let docStates = {};
        try {
            const stSnap = await get(ref(db, `writing_doc_state/${chatId}`));
            if (stSnap.exists()) docStates = stSnap.val() || {};
        } catch (e) {
            console.warn('[ChatProjects] Failed to load writing_doc_state:', e);
        }

        const known = new Map();
        docs.forEach(d => known.set(d.docId, d));
        Object.keys(assigned).forEach(docId => {
            if (known.has(docId)) return;
            const st = normalizeDocSyncState(docStates[docId]);
            known.set(docId, {
                docId,
                title: (assigned[docId]?.title || st?.title || 'Google Document').trim(),
                ts: Number(st?.createdTime) || 0
            });
        });
        Object.keys(docStates).forEach(docId => {
            if (known.has(docId)) return;
            const st = normalizeDocSyncState(docStates[docId]);
            if (!st) return;
            known.set(docId, { docId, title: (st.title || 'Google Document').trim(), ts: Number(st.createdTime) || 0 });
        });
        const allDocs = Array.from(known.values()).sort((a, b) => (a.ts || 0) - (b.ts || 0));

        const groups = new Map();
        const standalone = [];
        allDocs.forEach(doc => {
            const projectName = (assigned[doc.docId]?.projectName || '').trim();
            if (!projectName) {
                standalone.push({
                    id: doc.docId,
                    name: doc.title,
                    docIds: new Set([doc.docId]),
                    isGroup: false
                });
                return;
            }
            const norm = projectName.toLowerCase();
            if (!groups.has(norm)) {
                groups.set(norm, { id: `p:${norm}`, name: projectName, docIds: new Set(), isGroup: true });
            }
            groups.get(norm).docIds.add(doc.docId);
        });

        return Array.from(groups.values()).reverse().concat(standalone.reverse());
    }

    const WP_ROW_DOC_ICON = `<svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    const WP_ROW_FOLDER_ICON = `<svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path></svg>`;
    const WP_ROW_EXPAND_ICON = `<svg class="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" /></svg>`;
    const WP_ROW_COLLAPSE_ICON = `<svg class="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3" /></svg>`;

    const WP_ROW_CHECK = `<svg class="w-4 h-4 flex-shrink-0 text-black dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // Below the divider sit the projects themselves, the active one ticked.
    function renderWpProjectList() {
        const list = document.getElementById('wpProjectMenuList');
        if (!list) return;
        // Runs on every open, so the header row is refreshed from the same data.
        updateWpProjectHeader(true);

        const row = (index, icon, name, sub, selected) => `
            <button type="button" onclick="selectChatProjectAt(${index})" role="option" aria-selected="${selected ? 'true' : 'false'}"
                class="w-full px-3 py-2.5 rounded-[14px] flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                <span class="w-7 h-7 rounded-full wp-row-disc text-black dark:text-white flex items-center justify-center flex-shrink-0">${icon}</span>
                <span class="flex flex-col min-w-0 flex-1">
                    <span class="text-[14px] font-semibold text-black dark:text-white leading-tight truncate">${UIUtils.escape(name)}</span>
                    ${sub ? `<span class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${sub}</span>` : ''}
                </span>
                ${selected ? WP_ROW_CHECK : ''}
            </button>`;

        list.innerHTML = _chatProjects.length
            ? _chatProjects.map((p, i) => row(
                i,
                p.isGroup ? WP_ROW_FOLDER_ICON : WP_ROW_DOC_ICON,
                p.name,
                p.isGroup ? wpCountLabel(p.docIds.size, 'version') : '',
                p.id === _activeChatProject
            )).join('')
            : '<div class="px-3 py-2 text-[12px] text-black dark:text-white">No documents shared in this chat yet.</div>';
    }

    function selectChatProjectAt(index) {
        const project = _chatProjects[index];
        if (project) selectChatProject(project.id);
    }
    window.selectChatProjectAt = selectChatProjectAt;

    // The visual growth is a reveal, not a height animation.  The card is first
    // laid out at its final size (and its glass map is refreshed once), then a
    // clip-path reveals the extra area from the header down.  This preserves the
    // "one card growing" story without forcing backdrop-filter/SVG work on every
    // animation frame or a large canvas rebuild after it settles.
    function revealWpCard(card, startWidth) {
        const duration = 300;
        const endWidth = card.offsetWidth;
        const widthScale = endWidth ? Math.max(0.01, Math.min(1, (startWidth || endWidth) / endWidth)) : 1;
        card.style.setProperty('--wp-start-width-scale', widthScale);
        // Commit the narrow visual start without transitioning from the old
        // pill into it; only the next frame should perform the outward growth.
        card.style.transition = 'none';
        card.classList.remove('wp-project-menu-closing', 'wp-project-menu-visible');
        card.classList.add('wp-project-menu-animating');
        void card.offsetWidth;
        card.style.transition = '';
        if (card._liquidGlass?.refresh) card._liquidGlass.refresh();

        // The first frame contains only the collapsed pill.  Starting on the
        // following frame lets the browser commit the final glass surface before
        // the compositor starts revealing it.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            card.classList.add('wp-project-menu-visible');
            card._wpAnimUntil = Date.now() + duration + 60;
        }));
        setTimeout(() => {
            card.classList.remove('wp-project-menu-animating', 'wp-project-menu-visible');
            card.style.removeProperty('--wp-start-width-scale');
        }, duration + 60);
    }

    function setWpProjectMenuOpen(open) {
        const card = document.getElementById('wpDocContextBar');
        const listWrap = document.getElementById('wpProjectList');
        const header = document.getElementById('wpProjectHeader');
        if (!card || !listWrap) return;
        if (card.classList.contains('wp-project-menu-open') === open) return;

        if (card.classList.contains('wp-project-menu-closing')) return;
        const startingWidth = open ? card.offsetWidth : 0;

        if (open) {
            // A re-open during the close glide must un-hide the real card
            // immediately; the ghost is cancelled below.
            card.style.visibility = '';
            // Keep the exact pre-open geometry so the ghost can restore compact
            // mode faithfully even if layout shifts while the card is open.
            card._wpOpenOrigin = {
                width: startingWidth,
                wasCompact: card.classList.contains('wp-bar-compact')
            };
            // A re-open landing mid-fade must not fight the ghost still on screen.
            if (card._wpGhost) { card._wpGhost.cancel?.(); card._wpGhost.remove(); card._wpGhost = null; }
            renderWpProjectList();
            listWrap.classList.remove('hidden');
            card.classList.add('wp-project-menu-open');
            if (header) header.setAttribute('aria-expanded', 'true');
            if (!card._hideListener) {
                card._hideListener = (e) => {
                    // A row's mousedown re-renders the list, which detaches the
                    // button that was pressed; a detached target is not an
                    // outside click, and treating it as one collapsed the card a
                    // frame before the row's click reopened it.
                    if (!card.classList.contains('wp-project-menu-open')) return;
                    if (Date.now() < (card._wpAnimUntil || 0)) return;
                    if (!e.target || !e.target.isConnected || card.contains(e.target)) return;
                    setWpProjectMenuOpen(false);
                };
                document.addEventListener('mousedown', card._hideListener);
                document.addEventListener('touchstart', card._hideListener);
            }
            // Let the final panel establish its natural width before revealing.
            // There is no intermediate width/height animation for the glass to
            // chase; clip-path performs the perceived growth instead.
            card.style.maxWidth = 'none';
            void card.offsetWidth;
            const naturalW = card.offsetWidth;
            // "All Projects" must never ellipsize: measure the header row on
            // its own and let it lift the width floor above the viewport cap.
            // Over-long project names in the list truncate instead.
            listWrap.classList.add('hidden');
            void card.offsetWidth;
            const headerW = card.offsetWidth;
            listWrap.classList.remove('hidden');
            
            // Calculate max width based on the chat panel width (4th panel)
            // - Card should be responsive within its parent container
            // - Max at 70% of viewport or available panel space, whichever is smaller
            // - Min at content width or a reasonable floor, whichever is larger
            const cardParent = card.parentElement;
            const parentWidth = cardParent ? cardParent.offsetWidth : window.innerWidth;
            const availableWidth = parentWidth * 0.7; // Use up to 70% of panel width
            
            // Don't force minimum expansion beyond content needs
            card.style.maxWidth = `${availableWidth}px`;
            // The floor must be bounded by the same available width.  A long
            // document title otherwise turns `min-width` into an escape hatch
            // that defeats max-width and pushes the list beyond the right edge.
            card.style.minWidth = `${Math.min(availableWidth, Math.max(headerW, 200))}px`;

            // A second-row pill is right-aligned while closed.  Its list can
            // be substantially wider than that pill, so re-anchor it only
            // after the final constrained width is known; otherwise it grows
            // equally in both directions and escapes past the actions bar.
            if (card._wpSecondRow) {
                const openSection = document.getElementById('chatSection');
                const openActions = document.getElementById('chatActionsBar');
                const openName = document.getElementById('chatNameBar');
                if (openSection && openActions && openName) {
                    const openSr = openSection.getBoundingClientRect();
                    const openAb = openActions.getBoundingClientRect();
                    const openNb = openName.getBoundingClientRect();
                    // Land the re-anchor instantly: the CSS left/top glide
                    // would otherwise slide the card in from the left while
                    // the clip reveal grows it — the perceived growth belongs
                    // to revealWpCard, not to this box moving.
                    card.style.transition = 'none';
                    card.style.top = (openNb.bottom - openSr.top + 8) + 'px';
                    card.style.left = (openAb.right - openSr.left - card.offsetWidth / 2) + 'px';
                    // The reveal's first frame is scaleX(start/end) around the
                    // card's transform-origin.  With the default top-center it
                    // lands left of the right-aligned pill (the perceived
                    // "slide left, then expand").  Anchor it to the right edge
                    // so frame 1 covers the pill exactly and the card grows
                    // leftward from it.
                    card.style.transformOrigin = 'top right';
                    void card.offsetWidth;
                    card.style.transition = '';
                }
            } else {
                card.style.transformOrigin = '';
            }
            
            revealWpCard(card, startingWidth);
        } else {
            // Swap-first + ghost.  The old path kept the expanded DOM alive and
            // clip/scale-shrunk it, so the animation ENDED on a fake frame (the
            // squashed expanded header: check mark, up-chevron, squeezed text)
            // and the real-DOM swap after finish was the visible pop.  Here the
            // real card becomes the collapsed pill on frame 1 — its resting box
            // IS the animation's destination, so no pop is possible — and a
            // fixed clone (the "ghost") of the expanded card replays the
            // retraction above it and fades out into the real pill.
            const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            // The retraction must run the expand animation's own 280ms so the
            // shape moves at the same speed both ways; the dissolve is extra
            // tail time after the shape has landed.
            const retractMs = reduced ? 1 : 280;
            const duration = reduced ? 1 : retractMs + 80;
            const retractAt = retractMs / duration;
            const origin = card._wpOpenOrigin || {};
            const wasSecondRow = !!card._wpSecondRow;
            const rect = card.getBoundingClientRect();
            const expandedW = rect.width;
            const expandedH = rect.height;
            const clipBottom = Math.max(0, expandedH - 46);

            const ghost = card.cloneNode(true);
            ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;` +
                `width:${expandedW}px;height:${expandedH}px;max-width:none;margin:0;` +
                `transform:none;transition:none;z-index:100;pointer-events:none;`;
            // Retract around the same edge the expand grew from: a second-row
            // card is right-anchored, so its ghost must land right-aligned on
            // the pill instead of drifting to the expanded card's centre.
            ghost.style.transformOrigin = wasSecondRow ? 'top right' : 'top center';
            document.body.appendChild(ghost);
            card._wpGhost = ghost;

            // Collapse the real DOM before the ghost animates.
            card.classList.remove('wp-project-menu-animating', 'wp-project-menu-visible', 'wp-project-menu-closing', 'wp-project-menu-closing-active', 'wp-project-menu-open');
            card.classList.toggle('wp-bar-compact', !!origin.wasCompact);
            listWrap.classList.add('hidden');
            card.style.maxWidth = '';
            // The open list temporarily gives the card a text-sized minimum
            // width.  It must not survive the close: otherwise a compact
            // pill hides its title but still keeps the All Projects-sized
            // blank area, and that oversized measurement can force row two
            // after returning to this chat.
            card.style.minWidth = '';
            if (header) header.setAttribute('aria-expanded', 'false');
            // Collapsed, the header row is the current scope, not "All Projects".
            // Same-row closes must land the pill's left/top instantly (the
            // ghost covers it; a glide would slide visibly after the fade).
            // A ROW CHANGE (the search bar collapsed while the list was open,
            // freeing row-1 space) must NOT teleport — the pill flashing into
            // row 1 reads as a pop.  There the real pill glides to its new
            // row on the standard 350ms transition while the ghost retracts
            // where the list was: the animation ends on the real DOM.
            const openTop = card.style.top, openLeft = card.style.left;
            card.style.transition = 'none';
            updateWpProjectHeader(false);
            void card.offsetWidth;
            const finalTop = card.style.top, finalLeft = card.style.left;
            const pillRect = card.getBoundingClientRect();
            const rowChanged = Math.abs(pillRect.top - rect.top) > 1;
            if (rowChanged) {
                card.style.top = openTop;
                card.style.left = openLeft;
                void card.offsetWidth;
                card.style.transition = '';
                card.style.top = finalTop;
                card.style.left = finalLeft;
            } else {
                card.style.transition = '';
            }
            if (card._hideListener) {
                document.removeEventListener('mousedown', card._hideListener);
                document.removeEventListener('touchstart', card._hideListener);
                card._hideListener = null;
            }
            if (card._liquidGlass?.refresh) card._liquidGlass.refresh();

            // Measure the true destination after the swap: the ghost's final
            // width is the pill's real width, not a remembered guess.
            const collapsedW = card.getBoundingClientRect().width;
            const scale = expandedW ? Math.min(1, collapsedW / expandedW) : 1;
            // The ghost squashes around the expanded card's centre.  A
            // right-aligned second-row pill has a different centre, so shift
            // the ghost's landing by that delta: it dissolves into exactly
            // where the real pill already sits.  On a row change the pill is
            // gliding away underneath, so the ghost retracts in place.
            const ghostLandCenterX = wasSecondRow
                ? rect.right - pillRect.width / 2
                : rect.left + expandedW / 2;
            const dx = rowChanged ? 0 : (pillRect.left + pillRect.width / 2) - ghostLandCenterX;
            const dy = rowChanged ? 0 : pillRect.top - rect.top;

            // Align the ghost's header with the real pill it dissolves into:
            // same text/icon (the real card was just updated), the pill's row
            // width, and a counter-scale that cancels the card squish exactly
            // at the landing frame (same easing, so both ends match; any
            // mid-flight drift is hidden under an opaque ghost).
            ghost.classList.add('wp-ghost-closing');
            const ghostRow = ghost.querySelector('#wpProjectHeader');
            if (ghostRow) {
                const ghostTitle = ghost.querySelector('#wpDocContextTitle');
                const realTitle = document.getElementById('wpDocContextTitle');
                if (ghostTitle && realTitle) ghostTitle.innerText = realTitle.innerText;
                const ghostIcon = ghost.querySelector('#wpProjectHeaderIcon');
                const realIcon = document.getElementById('wpProjectHeaderIcon');
                if (ghostIcon && realIcon) ghostIcon.innerHTML = realIcon.innerHTML;
                ghostRow.style.transformOrigin = 'left center';
                if (origin.wasCompact) {
                    ghostRow.style.gap = '6px';
                    ghostRow.style.paddingLeft = '6px';
                    ghostRow.style.paddingRight = '10px';
                    if (ghostTitle) ghostTitle.style.display = 'none';
                }
                // The row's width retracts on the same 280ms curve as the
                // card's scaleX (they cancel: rendered width = layout width),
                // so the header content glides to the pill instead of snapping
                // to the final width on frame 1.
                ghostRow.animate([
                    { width: `${Math.max(0, expandedW - 12)}px`, transform: 'translateX(0px) scaleX(1)' },
                    { width: `${Math.max(0, collapsedW - 12)}px`, transform: `translateX(${scale ? 6 * (1 / scale - 1) : 0}px) scaleX(${scale ? 1 / scale : 1})` }
                ], { duration: retractMs, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
            }
            const animation = ghost.animate([
                { clipPath: 'inset(0 0 0 0 round 24px)', webkitClipPath: 'inset(0 0 0 0 round 24px)', transform: 'scaleX(1)', opacity: 1, offset: 0 },
                { clipPath: `inset(0 0 ${clipBottom}px 0 round 24px)`, webkitClipPath: `inset(0 0 ${clipBottom}px 0 round 24px)`, transform: `translateX(${dx}px) translateY(${dy}px) scaleX(${scale})`, opacity: 1, offset: retractAt },
                { clipPath: `inset(0 0 ${clipBottom}px 0 round 24px)`, webkitClipPath: `inset(0 0 ${clipBottom}px 0 round 24px)`, transform: `translateX(${dx}px) translateY(${dy}px) scaleX(${scale})`, opacity: 0, offset: 1 }
            ], {
                duration,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'forwards'
            });
            card._wpCloseAnimation?.cancel?.();
            card._wpCloseAnimation = animation;
            card._wpAnimUntil = Date.now() + duration + 60;
            animation.onfinish = () => {
                if (card._wpCloseAnimation !== animation) return;
                ghost.remove();
                card.style.visibility = '';
                card._wpGhost = null;
                card._wpCloseAnimation = null;
                card._wpOpenOrigin = null;
            };

        }
    }

    async function toggleWpProjectMenu(e) {
        if (e) e.stopPropagation();
        const card = document.getElementById('wpDocContextBar');
        if (!card) return;
        
        
        // Check if "All Projects" is selected
        const selected = wpActiveProject();
        const showingAll = !selected;
        
        // Opening/closing the list should NOT change the current project selection
        // Only clicking a specific project item should trigger state changes
        if (showingAll) {
        } else {
        }
        
        // buildChatProjects is awaited before the card opens, so a second click
        // during that gap would otherwise queue a collapse behind the pending
        // open — the card flashed shut and then popped.
        if (Date.now() < (card._wpToggleLock || 0)) return;
        card._wpToggleLock = Date.now() + 120;
        if (card.classList.contains('wp-project-menu-open')) {
            // The expanded header is the All Projects row.  From a focused
            // project it is an actual selection, not merely a close control:
            // restore the full chat before folding the list away.
            if (!showingAll) {
                selectChatProject(WP_ALL_PROJECTS);
                return;
            }
            // Already showing all projects: the header simply closes the list.
            setWpProjectMenuOpen(false);
            return;
        }
        _chatProjects = await buildChatProjects();
        // Show project list
        setWpProjectMenuOpen(true);
    }
    window.toggleWpProjectMenu = toggleWpProjectMenu;

    // Handle icon button click specifically
    window.toggleWpProjectHeaderIcon = async (e) => {
        if (e) e.stopPropagation();
        
        const selected = wpActiveProject();
        const showingAll = !selected;
        
        
        // When All Projects is selected, clicking the icon should just expand/close the list
        if (showingAll) {
            await toggleWpProjectMenu(e);
        } else {
            // When specific project is selected, clicking the icon opens portfolio
            await openPortfolioForSelectedProject(e);
        }
    };
    
    // Top-row placement: sit on the same line as #chatNameBar (both collapsed
    // boxes are 46px, so aligning tops aligns centres), centred in the free
    // space between the name bar and the actions bar. When that gap cannot fit
    // the labelled pill, the bar drops to icon-only (.wp-bar-compact). The
    // side bars' geometry is CSS-driven, so measuring them keeps this correct
    // in every layout mode (default, four-panel, compact-four-panel).
    // predictGrow: pixels the actions bar is about to widen (+) or shrink (-)
    // by while its width transition is still flying (search expand/collapse).
    // Passing it lets the pill decide labelled-vs-icon at the FIRST frame of
    // that transition instead of after the 360ms settle pass.
    function repositionWpBar(predictGrow) {
        const bar = document.getElementById('wpDocContextBar');
        const sec = document.getElementById('chatSection');
        const nameBar = document.getElementById('chatNameBar');
        const actionsBar = document.getElementById('chatActionsBar');
        if (!bar || !sec || !nameBar || !actionsBar) return;
        if (!sec.offsetWidth) return;
        const sr = sec.getBoundingClientRect();
        const nb = nameBar.getBoundingClientRect();
        // Mid-flight name bar: decide from its predicted final right edge,
        // never the in-flight box (same first-frame rule as predictGrow).
        const nbRight = nameBar._wpPredictedWidth ? nb.left + nameBar._wpPredictedWidth : nb.right;
        const ab = actionsBar.getBoundingClientRect();
        // Mid-flight actions bar: an explicit predictGrow is relative to the
        // rect measured right now (frame 1); otherwise fall back to the
        // absolute final left edge recorded at takeoff, so ResizeObserver
        // passes during the width transition decide from the destination.
        const abLeft = predictGrow !== undefined ? ab.left - predictGrow
            : (actionsBar._wpAbLeftFinal !== undefined ? actionsBar._wpAbLeftFinal : ab.left);
        const gap = abLeft - nbRight;
        // Shape ladder, only while closed (the open list keeps whatever box it
        // opened with — the expand animation owns it): labelled in row 1 →
        // icon+chevron in row 1 → labelled dropped to a second row centred on
        // the full section width, sliding down via the CSS left/top transition.
        if (!bar.classList.contains('wp-project-menu-open')) {
            bar.classList.remove('wp-bar-compact');
            bar.classList.remove('wp-bar-second-row');
            bar.style.removeProperty('--wp-second-row-max-width');
            let secondRow = false;
            if (bar.offsetWidth + 12 > gap) {
                bar.classList.add('wp-bar-compact');
                if (bar.offsetWidth + 12 > gap) {
                    bar.classList.remove('wp-bar-compact');
                    secondRow = true;
                }
            }
            bar._wpSecondRow = secondRow;
            bar.classList.toggle('wp-bar-second-row', secondRow);
            if (secondRow) {
                // The title may truncate within the full chat panel, but the
                // card itself must still retain the same 12px right inset as
                // the actions bar above it.
                bar.style.setProperty('--wp-second-row-max-width', `${Math.max(0, sr.width - 24)}px`);
            }
        }
        if (bar._wpSecondRow) {
            // Align to the *actual* actions-bar edge, rather than the chat
            // section edge.  That is robust if its right inset ever changes.
            bar.style.top = (nb.bottom - sr.top + 8) + 'px';
            bar.style.left = (ab.right - sr.left - bar.offsetWidth / 2) + 'px';
        } else {
            bar.style.top = (nb.top - sr.top) + 'px';
            bar.style.left = ((nbRight + abLeft) / 2 - sr.left) + 'px';
        }
    }

    // setTimeout throttle instead of requestAnimationFrame: background tabs
    // and embedded webviews pause rAF, which would freeze the tracker.
    let _wpBarNeedsFilter = false;
    function scheduleWpDocContext(withFilter) {
        _wpBarNeedsFilter = _wpBarNeedsFilter || !!withFilter;
        if (_wpBarPending) return;
        _wpBarPending = setTimeout(() => {
            _wpBarPending = null;
            const needsFilter = _wpBarNeedsFilter;
            _wpBarNeedsFilter = false;
            repositionWpBar();
            if (needsFilter) applyChatProjectFilter();
        }, 60);
    }

    // Portfolio -> chat anchor jump: close the drawer, scroll the target
    // message into view and flash it. With a commentId the only valid target
    // is the comment's own comment_card message; if none exists (legacy syncs)
    // we report "nothing to locate" instead of falling back to the doc card.
    function portfolioJumpToChat(msgKey, docId = '', commentId = '', titleHint = '') {
        if (!msgKey && !docId) return;
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;

        // A filtered stream can hide the jump target: always land on the full history.
        if (_activeChatProject !== WP_ALL_PROJECTS) resetChatProjectFilter();

        // data-comment-id is a space-separated id list (top-level id + reply
        // anchorIds), so `~=` matches a card by any single comment/reply id.
        const findCommentMsg = () => commentId
            ? chatBox.querySelector(`.msg-pop[data-comment-id~="${commentId}"]`)
            : null;

        const findDocMsg = () => {
            let t = msgKey ? chatBox.querySelector(`.msg-pop[data-key="${msgKey}"]`) : null;
            if (!t && docId) {
                const card = chatBox.querySelector(`.doc-card-container[data-doc-id="${docId}"]`);
                t = card ? card.closest('.msg-pop') : null;
            }
            return t;
        };

        const drawer = document.getElementById('writingPortfolioDrawer');
        const drawerOpen = drawer && !drawer.classList.contains('hidden') && !drawer.classList.contains('translate-x-full');

        if (commentId) {
            // Locate: only the comment's own chat card counts. Legacy cards
            // that predate per-comment ids simply report "not found".
            let target = findCommentMsg();
            if (!target) {
                AppModules.Modal.alert('Nothing to locate', 'This comment has no chat message to jump to — it was synced before comments got their own chat cards.');
                return;
            }
            if (drawerOpen) closeWritingPortfolio();
            setTimeout(() => {
                target = findCommentMsg() || target;
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => UIUtils.highlight(target.firstElementChild || target), 500);
            }, drawerOpen ? 430 : 30);
            return;
        }

        // Doc-level jump (Timeline entries / card anchors): land on the source
        // doc message and flash its card.
        let target = findDocMsg();
        if (!target) {
            if (drawerOpen) closeWritingPortfolio();
            if (titleHint) {
                setTimeout(() => jumpToMessage(titleHint, titleHint, msgKey), drawerOpen ? 430 : 0);
            }
            return;
        }
        if (drawerOpen) closeWritingPortfolio();
        setTimeout(() => {
            target = findDocMsg() || target;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const card = target.querySelector('.doc-card-container');
            setTimeout(() => UIUtils.highlight(card || target), 500);
        }, drawerOpen ? 430 : 30);
    }

    // Feed scroll / DOM mutations (new messages, pagination, chat switches)
    // into the bar geometry and the project soft-filter.
    (function initWpDocContext() {
        const chatBox = document.getElementById('chatBox');
        if (chatBox) {
            chatBox.addEventListener('scroll', () => scheduleWpDocContext(false), { passive: true });
            if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(() => scheduleWpDocContext(true)).observe(chatBox, { childList: true, subtree: true });
            }
        }
        window.addEventListener('resize', () => scheduleWpDocContext(false));
        // A panel switch can hide and later reveal the chat without emitting a
        // window resize.  Observe the real layout boxes so the three-stage
        // decision is remade from current geometry when the chat comes back,
        // rather than carrying a prior second-row decision into this view.
        if (typeof ResizeObserver !== 'undefined') {
            const tracked = [
                document.getElementById('chatSection'),
                document.getElementById('chatNameBar'),
                document.getElementById('chatActionsBar')
            ].filter(Boolean);
            if (tracked.length) {
                const observer = new ResizeObserver(() => scheduleWpDocContext(false));
                tracked.forEach(el => observer.observe(el));
            }
        }
        // Chat-switch width flight for the name bar: the partner name/status
        // used to hard-cut to its new width. Write sites (openChat, live
        // presence ticks) wrap their DOM mutations here; the box is pinned to
        // its old width, the content swaps, then it glides to the measured
        // natural width on the same 350ms curve the switcher pill uses. This
        // must run in the caller's task, NOT in a ResizeObserver reacting
        // after the fact — resizing the observed element inside its own
        // callback triggered "ResizeObserver loop completed with undelivered
        // notifications". The glass map is built once for the destination box
        // (beginTrack before the flight, endTrack on landing) per
        // LiquidGlassEffect's rules.
        function animateNameBarContent(mutate) {
            const bar = document.getElementById('chatNameBar');
            if (!bar || typeof mutate !== 'function') { if (mutate) mutate(); return; }
            const ease = 'width 350ms cubic-bezier(0.22, 1, 0.36, 1)';
            const glass = bar._liquidGlass;
            const measureNatural = () => {
                const keep = bar.style.width;
                bar.style.width = 'max-content';
                const w = bar.offsetWidth;
                bar.style.width = keep;
                return w;
            };
            const startW = bar.offsetWidth;
            if (!startW) { mutate(); return; } // hidden (mobile/startup): no flight
            const flight = bar._nbFlight;
            if (flight) {
                const before = bar.textContent;
                mutate();
                // Chat switches fire this a second time ~10ms later with
                // byte-identical content (the async user fetch re-writing
                // what the cache write already set). Re-measuring during the
                // first frames forces a recalc that kills the in-flight
                // transition, so an identical rewrite just lets it continue.
                if (bar.textContent === before) return;
                // Content really did change mid-flight: measure with a
                // throwaway clone so the live transition is never retargeted
                // by forced recalcs, then glide from the current animated
                // width to the new natural width.
                const cur = bar.getBoundingClientRect().width;
                const probe = bar.cloneNode(true);
                probe.style.transition = 'none';
                probe.style.width = 'max-content';
                document.body.appendChild(probe);
                const target = probe.offsetWidth;
                probe.remove();
                flight.target = target;
                bar._wpPredictedWidth = target;
                bar.style.transition = 'none';
                bar.style.width = cur + 'px';
                bar.offsetWidth;
                bar.style.transition = ease;
                bar.style.width = target + 'px';
                clearTimeout(flight.timer);
                flight.timer = setTimeout(flight.land, 500);
                return;
            }
            bar.style.transition = 'none';
            bar.style.width = startW + 'px';
            bar.classList.add('nb-flying');
            mutate();
            const endW = measureNatural();
            if (endW === startW) {
                bar.classList.remove('nb-flying');
                bar.style.transition = '';
                bar.style.width = '';
                return;
            }
            const nb = { target: endW };
            bar._nbFlight = nb;
            bar._wpPredictedWidth = endW;
            bar.style.width = endW + 'px';
            if (glass) glass.beginTrack();
            bar.style.transition = 'none';
            bar.style.width = startW + 'px';
            bar.offsetWidth; // reflow at the old box so the glide starts there
            bar.style.transition = ease;
            bar.style.width = endW + 'px';
            nb.land = () => {
                if (bar._nbFlight !== nb) return;
                clearTimeout(nb.timer);
                bar.removeEventListener('transitionend', nb.onEnd);
                delete bar._nbFlight;
                bar.classList.remove('nb-flying');
                bar.style.transition = 'none';
                bar.style.width = '';
                delete bar._wpPredictedWidth;
                bar.offsetWidth; // settle the released box now
                if (glass) glass.endTrack();
                bar.style.transition = '';
                repositionWpBar();
            };
            nb.onEnd = (e) => {
                if (e.target === bar && e.propertyName === 'width') nb.land();
            };
            bar.addEventListener('transitionend', nb.onEnd);
            nb.timer = setTimeout(nb.land, 500);
        }
        window.animateNameBarContent = animateNameBarContent;
        // The switcher is a single glass card, so it carries one liquid-glass
        // surface (same parameters as chatInputPill) that grows with the list.
        const wpCard = document.getElementById('wpDocContextBar');
        if (wpCard && !wpCard._liquidGlass) {
            new LiquidGlassEffect(wpCard, {
                radius: 24,            // matches clip-path round 24px
                refractionWidth: 12,   // matches chatInputPill bevel width
                maxDisplacement: 8,    // matches chatInputPill refraction strength
                mouseRadius: 55,       // matches chatInputPill hover ripple
                mouseStrength: 6       // matches chatInputPill ripple strength
            });
        }
        repositionWpBar();
    })();

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
        const chipsEl = document.getElementById('portfolioExistingProjects');
        if (chipsEl) {
            const names = [...new Set(Object.values(cachedProjects).map(a => (a && a.projectName || '').trim()).filter(Boolean))];
            chipsEl.innerHTML = names.map(n => `<button type="button" onclick="window.pickExistingProject(this)" data-proj="${UIUtils.escape(n)}" class="px-2.5 py-1 rounded-lg text-[12px] font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors whitespace-nowrap">${UIUtils.escape(n)}</button>`).join('');
            chipsEl.classList.toggle('hidden', names.length === 0);
        }
        if (inputVer) {
            const parsed = parseDocVersion(rawTitle);
            inputVer.value = currentAssign?.versionLabel || parsed.versionLabel || nextDraftLabelForProject((inputProj?.value || '').toLowerCase().trim());
        }
        if (btnUngroup) {
            if (currentAssign?.projectName) {
                btnUngroup.classList.remove('hidden');
            } else {
                btnUngroup.classList.add('hidden');
            }
        }

        modal.classList.remove('hidden');
        card.classList.remove('menu-visible');
        card.classList.add('menu-hidden');
        void card.offsetHeight;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.remove('menu-hidden');
                card.classList.add('menu-visible');
                if (inputProj) inputProj.focus();
                if (card._liquidGlass) card._liquidGlass.refresh();
            });
        });
    }

    function closePortfolioProjectModal() {
        const modal = document.getElementById('portfolioProjectModal');
        const card = document.getElementById('portfolioProjectCard');
        if (!modal || !card) return;

        card.classList.remove('menu-visible');
        card.classList.add('menu-hidden');
        setTimeout(() => {
            modal.classList.add('hidden');
            _activeProjectAssignDoc = null;
        }, 230);
    }

    function setPortfolioVersionPreset(preset) {
        const inputVer = document.getElementById('portfolioInputVersionLabel');
        if (inputVer) {
            inputVer.value = preset;
            inputVer.focus();
        }
    }

    // Next free "Draft N" for a project: Draft 1, or max existing + 1.
    function nextDraftLabelForProject(projectNameLower) {
        const assign = _activeProjectAssignDoc;
        const cachedProjects = (window._writingProjectsCache && assign && window._writingProjectsCache[assign.chatId]) || {};
        if (!projectNameLower) return 'Draft 1';
        let maxDraft = 0;
        Object.values(cachedProjects).forEach(a => {
            if (a && a.projectName && a.projectName.toLowerCase().trim() === projectNameLower) {
                const m = String(a.versionLabel || '').match(/^draft\s*(\d+)$/i);
                if (m) maxDraft = Math.max(maxDraft, parseInt(m[1], 10));
            }
        });
        return `Draft ${maxDraft + 1}`;
    }

    function pickExistingProject(btn) {
        const name = btn.getAttribute('data-proj') || '';
        const inputProj = document.getElementById('portfolioInputProjectName');
        const inputVer = document.getElementById('portfolioInputVersionLabel');
        if (inputProj) inputProj.value = name;
        if (inputVer) inputVer.value = nextDraftLabelForProject(name.toLowerCase().trim());
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
            openWritingPortfolio();
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

            // 4. Re-render writing portfolio
            await openWritingPortfolio();
        } catch (err) {
            console.error('[WritingPortfolio] Error deleting document card:', err);
            AppModules.Modal.alert("Error", "Failed to delete document card. Please try again.");
        }
    }

    // ==== doc card 行为代码已搬到 writing.js；原定义保留为注释 ====
    const WB = initWritingBehavior({
        db, ref, get, AppModules,
        getCurrentUser, getActiveTargetId, getChatId,
        getLocalMessages, saveMessageLocal,
        MessageEngine,
        startDocCommentReply,
        getLastChatId: () => lastChatId
    });
    const toggleDocCommentsExpand = WB.toggleDocCommentsExpand;
    const toggleCommentCardExpand = WB.toggleCommentCardExpand;
    const filterDocComments = WB.filterDocComments;
    const toggleQuoteText = WB.toggleQuoteText;
    const syncDocCardComments = WB.syncDocCardComments;
    const openDocCommentComposer = WB.openDocCommentComposer;
    const closeDocCommentComposer = WB.closeDocCommentComposer;
    const sendDocCommentFromComposer = WB.sendDocCommentFromComposer;
    const replyToDocComment = WB.replyToDocComment;
    const closeDocCommentReply = WB.closeDocCommentReply;
    const sendDocCommentReply = WB.sendDocCommentReply;
    const deleteBotDocComment = WB.deleteBotDocComment;
    const jumpCommentCard = WB.jumpCommentCard;
    const resolveDocViewData = WB.resolveDocViewData;
    const normalizeDocSyncState = WB.normalizeDocSyncState;
    const mergeDocViewIntoCache = WB.mergeDocViewIntoCache;
    const loadSavedDocs = WB.loadSavedDocs;
    const classifyCommentAuthor = WB.classifyCommentAuthor;

    window.deletePortfolioCard = deletePortfolioCard;
    window.openWritingPortfolio = openWritingPortfolio;
    window.closeWritingPortfolio = closeWritingPortfolio;
    window.toggleWritingPortfolioExpand = toggleWritingPortfolioExpand;
    window.portfolioJumpToChat = portfolioJumpToChat;
    window.resetChatProjectFilter = resetChatProjectFilter;
    window.openPortfolioForSelectedProject = openPortfolioForSelectedProject;

    window.addEventListener('resize', wpFollowPanelGeometry);
    if (typeof ResizeObserver !== 'undefined') {
        const _wpGeomRO = new ResizeObserver(() => wpFollowPanelGeometry());
        ['sidePanel', 'chatSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) _wpGeomRO.observe(el);
        });
    }
    window.switchProjectVersion = switchProjectVersion;
    window.filterPortfolioFeedback = filterPortfolioFeedback;
    window.parseDocVersion = parseDocVersion;
    window.acceptPortfolioGroupingSuggestion = acceptPortfolioGroupingSuggestion;
    window.filterDocComments = filterDocComments;
    window.openProjectAssignModal = openProjectAssignModal;
    window.closePortfolioProjectModal = closePortfolioProjectModal;
    window.setPortfolioVersionPreset = setPortfolioVersionPreset;
    window.pickExistingProject = pickExistingProject;
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
    window.resolveDocViewData = resolveDocViewData;
    window.normalizeDocSyncState = normalizeDocSyncState;
    window.mergeDocViewIntoCache = mergeDocViewIntoCache;

    window.toggleQuoteText = toggleQuoteText;
    window.toggleAttachMenu = toggleAttachMenu;
    window.triggerPhotoUpload = triggerPhotoUpload;
    window.openGdocMenu = openGdocMenu;
    window.backToAttachMain = backToAttachMain;
    window.chooseGdocNew = chooseGdocNew;
    window.submitAttachNewDoc = submitAttachNewDoc;
    window.copyAttachBotEmail = copyAttachBotEmail;
    window.copyDocRequestLink = copyDocRequestLink;
    window.chooseGdocRequest = chooseGdocRequest;
    window.chooseGdocExisting = chooseGdocExisting;
    window.backToGdocMenu = backToGdocMenu;
    window.closeAttachMenu = closeAttachMenu;
    window.toggleDocCommentsExpand = toggleDocCommentsExpand;
    window.toggleCommentCardExpand = toggleCommentCardExpand;
    window.syncDocCardComments = syncDocCardComments;
    window.openDocCommentComposer = openDocCommentComposer;
    window.closeDocCommentComposer = closeDocCommentComposer;
    window.replyToDocComment = replyToDocComment;
    window.closeDocCommentReply = closeDocCommentReply;
    window.sendDocCommentReply = sendDocCommentReply;
    window.deleteBotDocComment = deleteBotDocComment;
    window.sendDocCommentFromComposer = sendDocCommentFromComposer;
    window.loadChatThread = loadChatThread;
    window.handleMsgCopy = handleMsgCopy;
    window.handleMsgQuote = handleMsgQuote;
    window.clearQuote = clearQuote;
    window.handleMsgForward = handleMsgForward;
    window.handleMsgReport = handleMsgReport;
    window.closeForwardPicker = closeForwardPicker;
    window.openCommentSendPicker = openCommentSendPicker;
    window.sendCommentCardTo = sendCommentCardTo;
    window.handleMsgJumpDoc = handleMsgJumpDoc;
    window.jumpCommentCard = jumpCommentCard;
    window.replyCommentCardStrip = replyCommentCardStrip;
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
