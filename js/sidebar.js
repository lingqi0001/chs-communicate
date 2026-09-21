/**
 * ==================================================================================
 * Module Name: SidebarModule (Sidebar Facade Shell)
 * File Path: js/sidebar.js
 *
 * Purpose:
 * - Provide a stable AppModules.Sidebar entrypoint before full sidebar extraction.
 * - Keep current runtime behavior unchanged by delegating to existing window functions.
 * ==================================================================================
 */

export const SidebarModule = {
    _initialized: false,
    _legacyRawRender: null,
    _renderRaf: null,
    _pendingTabSwitch: false,
    _isRenderingGetter: null,
    _isRenderingFlag: false,
    _queuedRender: false,
    _refreshTimer: null,
    _subListLoadingTimer: null,
    _barLevel: null,
    _fly: null,
    _pendingFly: null,
    _returnFly: null,
    _rowHandoffId: null,
    _runtime: {},

    state: {
        mode: 'recent',
        currentClassId: null
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        if (!window.sidebarMode) window.sidebarMode = 'recent';
        // Keep local mirror in sync with legacy globals.
        this.state.mode = window.sidebarMode || this.state.mode;
        this.state.currentClassId = window.currentClassId || null;
    },

    configureRuntime(runtime = {}) {
        this._runtime = { ...this._runtime, ...runtime };
    },

    // Firebase get() stays pending forever when the device is offline with no
    // cached copy, which used to pin _isRenderingFlag and freeze Level 1 ↔
    // Level 2 navigation (Back button dead). Every sidebar read races this.
    _offlineTimeoutMs() {
        return navigator.onLine === false ? 1500 : 6000;
    },

    _fetch(query) {
        return Promise.race([
            this._runtime.get(query),
            new Promise((_, reject) => setTimeout(() => reject(new Error('network-timeout')), this._offlineTimeoutMs()))
        ]);
    },

    _fetchUser(userId) {
        return Promise.race([
            window.fetchUser(userId),
            new Promise(resolve => setTimeout(() => resolve(null), this._offlineTimeoutMs()))
        ]);
    },

    _loadingHtml(label) {
        return `
            <div class="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                <div class="sidebar-spinner"></div>
                <span class="text-xs font-medium">${label}</span>
            </div>
        `;
    },

    _errorHtml(label) {
        return `
            <div class="p-8 text-center text-red-500 text-xs space-y-3">
                <div>${label}</div>
                <button onclick="AppModules.Sidebar.renderSidebar()" class="text-red-500 font-bold hover:underline cursor-pointer">Retry</button>
            </div>
        `;
    },

    attachLegacyRender(rawRenderFn, opts = {}) {
        this._legacyRawRender = (typeof rawRenderFn === 'function') ? rawRenderFn : null;
        this._isRenderingGetter = (typeof opts.isRenderingGetter === 'function') ? opts.isRenderingGetter : null;
    },

    isRendering() {
        if (this._isRenderingGetter) return !!this._isRenderingGetter();
        return !!this._isRenderingFlag;
    },

    switchSidebarTab(mode, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (window.sidebarMode === mode) {
            if (mode === 'class' && window.currentClassId) {
                this._startReturnFly();
                window.currentClassId = null;
                window._isPopNav = true;
                this.renderSidebar(true);
            }
            return;
        }
        this._killFly();
        this._pendingFly = null;
        this._returnFly = null;
        window.sidebarMode = mode;
        window.currentClassId = null;
        this.renderSidebar(true);
    },

    renderSidebar(isTabSwitch = false) {
        if (isTabSwitch) this._pendingTabSwitch = true;
        if (this._renderRaf !== null) return undefined;
        this._renderRaf = requestAnimationFrame(() => {
            this._renderShell(this._pendingTabSwitch);
            this._renderRaf = null;
            this._pendingTabSwitch = false;
        });
        return undefined;
    },

    handleSidebarSearch(event) {
        const term = event?.target?.value?.toLowerCase?.().trim?.() || '';
        let matchCount = 0;
        // The chrome layer is a #sidebarList > div too, but it is furniture,
        // not a result row — hiding it would hide the floating bar.
        document.querySelectorAll('#sidebarList > div:not(#sidebarChrome)').forEach(item => {
            const nameEl = item.querySelector('span');
            if (!nameEl) return;
            const name = nameEl.innerText.toLowerCase();
            const visible = name.includes(term);
            item.style.display = visible ? 'flex' : 'none';
            if (visible) matchCount++;
        });

        const existingHint = document.getElementById('sidebarSearchHint');
        if (term && matchCount === 0) {
            if (!existingHint) {
                const hint = document.createElement('div');
                hint.id = 'sidebarSearchHint';
                hint.className = 'p-4 text-center text-gray-400 text-[13px]';
                hint.innerHTML = `No recent chats match "${term}".<br>Use <b>Global Search</b> (top bar) to find anyone in school.`;
                document.getElementById('sidebarList')?.appendChild(hint);
            }
        } else if (existingHint) {
            existingHint.remove();
        }
    },

    startAutoRefresh() {
        if (this._refreshTimer) return;
        this._refreshTimer = setInterval(() => {
            if (!this.isRendering()) this.renderSidebar();
            const activeTargetId = this._runtime.getActiveTargetId ? this._runtime.getActiveTargetId() : null;
            if (activeTargetId && !activeTargetId.startsWith('group_')) {
                const allUsers = this._runtime.getAllUsers ? this._runtime.getAllUsers() : window.ALL_USERS;
                const user = allUsers?.[activeTargetId];
                if (user && user.lastSeen) {
                    const statusEl = document.getElementById('chatStatus');
                    const formatLastSeen = this._runtime.formatLastSeen || window.formatLastSeen;
                    if (statusEl && typeof formatLastSeen === 'function') {
                        const statusText = formatLastSeen(user.lastSeen);
                        const writeStatus = () => {
                            statusEl.innerText = statusText;
                            if (statusText === 'online') {
                                statusEl.classList.add('text-[#007AFF]');
                                statusEl.classList.remove('text-gray-400');
                            } else {
                                statusEl.classList.remove('text-[#007AFF]');
                                statusEl.classList.add('text-gray-400');
                            }
                        };
                        // Glide the name bar to its new width instead of
                        // hard-cutting when the presence text changes.
                        if (typeof window.animateNameBarContent === 'function') {
                            window.animateNameBarContent(writeStatus);
                        } else {
                            writeStatus();
                        }
                    }
                }
            }
        }, 60000);
    },

    renderGuestSidebar(container) {
        if (!container) return;
        container.innerHTML = `
            <div id="guestSignInCard" class="flex-1 w-full flex flex-col justify-center items-center px-4 py-8 text-center select-none overflow-y-auto min-h-[360px] transition-all duration-300">
                <div class="w-16 h-16 bg-[#E3F2FD] dark:bg-[#1e293b] rounded-[22px] rounded-bl-none flex items-center justify-center shadow-md mb-4 relative overflow-hidden">
                    <svg class="w-11 h-11 drop-shadow-sm" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                        <polygon fill="white"
                            points="12.6,121.7 75.6,96.1 74.1,90.8 127.5,79.2 130.2,76.3 140.4,75.3 164.3,75.7 192.3,81.8 212.9,81.8 215.1,87.3 246.7,95.8 251.7,112.8 245.5,125.3 235.5,130.4 233.5,128.5 233.9,112.7 218.4,114.3 204.7,120.5 206.6,125.3 220.7,152.5 208.3,152.5 178.9,137.5 170.9,136.1 156.2,141.7 147,152.1 148,168.7 88.4,174.1 35.2,145.8 33.3,138.1" />
                        <path fill="#ED2129"
                            d="M243.8,97.1c-14.5-6.1-17.4-4.7-32.5-4.8c-2.4,1.8-2.4,3.2-4.8,4.2l-6.6,3.1c-2.5,6.3-5,19.9-15.5,24.5 l-10.9,5.1c11.2,10.6,32.1,25.6,45.4,21.2l-4.1-8.2l-11.3-16.5l0.9-0.8l-3.1,3.4c0.7,2,0.4,2.4,1.2,3.5l11.4,14.2 c-10.4,0.4-20-7.2-28.3-15.1c1.9-3.5,4.6-6.3,9.2-9.3l3.8-2.5c10.7-7,31.6-13.2,37.6-4l1.5,2.3c1.8,2.8-0.2,8.5-2.9,10.6l1,1.5 l6.8-4.5C251.2,119.4,249.7,106.5,243.8,97.1L243.8,97.1z M76.6,92.4l0.5,0.8l15.6,0.2l-13.4,4.8c-6.2-0.8-47.9,18.3-57.7,24.8 c8.3,4.6,16.1,10.5,25.4,10.6c21.9-14.4,41.5-20,61.5-27.3l8-1.5l-15.6,6.4c-12.3,0.2-45.5,26.5-58.6,35.1 c4.8,4.6,21.4,8.2,27.7,9.1l18-15.5l3.3-1.7c16.7-11,30.4-10.8,44-15.8l10.5-1l-14.5,4.8l-29.2,11.6l-1.2,1.7 c-12.6,8.2-15.3,15.9-22.6,23.5c4,5.1,27.6,9.5,34,7.1c-0.8-8.4,5.4-17.6,14.8-23.8l6.1-4c13.2-8.7,25.5-10.2,36.9-10l-5.3-3.1 l-5.6-1.6c7.3-2.6,11.8-0.3,21.8-6.9l4.6-3c3.7-2.4,5.5-5.5,6.4-8.5l-10.4,5.9l-0.5-0.9l8.4-5.5l-0.9-8.1c-3.8-1.1-1.3,1.9-4.1,3.8 l-0.8,0.5c-2.5,1.6-1-0.3-4.8,1l-2.6-2.7l-0.2-1.9l2.1-1.5l-3-1.3c-0.4,1.3-1.5,4.3-0.6,5.8c1.5,2.3,4.5,2.5,6.5,3.3l1.8,0.9 l1.5-0.9l2.3-1.5c-0.6,2-0.3,2.4-2.8,4c-3.8,2.5-10.3,1-13.6-0.9c-2.8-1.3-6.7-4.5-10-5.6c-3.4-1.2-8.9-0.3-11.4-2.2l10.4-2.3 c-4.6-6.7-10.8-2.9-15.6-7.2l-16.1,2c5-3.3,16.9-3.8,22.6-4.4c9.4-1.1,14,1.5,21.3,1.6l-4.6-3.4c4.8-0.1,10.4,5.6,18.3,7.2 c4.5,1,14.9,0.3,19.9-4.1l6.2-5.4l-0.8-1.3c-16.9,6.2-55.7-15.2-80.2-6.2l0.5,0.8l2.5,0.5l3.8,1.2l-3.3-0.4L76.6,92.4L76.6,92.4z M213.5,100.6l-2.3,1.5c-3.3,2.2-3.1,0.3-7.1,2.5c0.5-1.7,1.1-4,3.1-5.3C208.5,98.4,212.2,99.4,213.5,100.6L213.5,100.6z M160,136.7c-3.7-0.5-8.4,1.1-12.6,3.9l-7.6,5c-6,3.9-12,11.6-12.1,16.6l-0.1,1.1l15.4,1.8l0.1-0.9 C135.9,152.7,148.3,144.4,160,136.7L160,136.7z M185,101.9l-1-1.5l-1.5,1l1,1.5L185,101.9L185,101.9z M162.5,74.2 c7.9,0.1,19.7,3.1,27.9,4.8c7,1.5,26.3,0.8,28.6,1.7l-2,5c1.9,1.8,28.5,4.1,31.9,9.2l1.5,2.3c7,10.6,4.4,24.3-5.8,31l-0.8,0.5 c-4.3,2.8-9,2.7-12.6,3.9l-1-1.5c3-2.3,4.2-6.9,2.1-10.1c-3.7-5.6-16.4-3.4-21.7,0.1c-1.8,1.2-2.9,5.5-2.1,6.8 c3.6,5.5,7,8.6,9.8,13.2c3.4,5.7,2.5,9.9,4.4,13.4c-9.1,3.3-35.4-6.1-42.8-15.5c-5.8,2.1-11.3-2.4-22,4.6l-0.8,0.5 c-4.5,2.9-7.6,10-4.4,14.8l2.5,3.8c1.5,2.3,5.8,4.9,3.2,6.6c-13.5,8.8-28,2.6-33.1,4.3l1.5,4.4c-7.2,4.6-12.6,2.4-19.5,3.1 c-7.7-0.2-45.7-7-49.8-13l5.5-4.9c-9-3.8-33.9-7.3-42.2-14.6l11.4-7.5l-31.4-18l0.5-1.3l48.8-18.7l22.4-6.8L59.8,94l-0.1-1.3 l59.6-13.1l-3.9-2.9l-0.1-0.9L162.5,74.2L162.5,74.2z" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-black dark:text-white tracking-tight mb-1.5">
                    Sign in to CHShub
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 whitespace-nowrap leading-relaxed">
                    Connect With Your Class, Clubs<br>Develop your skills in real time
                </p>

                <div class="w-full space-y-2.5 max-w-[260px]">
                    <button onclick="loginWithMicrosoft()"
                        class="w-full bg-white dark:bg-[#2C2C2E] text-black dark:text-white border border-gray-200/80 dark:border-white/10 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer">
                        <img src="/resources/hcpss.png" alt="HCPSS" class="w-5 h-5 shrink-0 rounded-full object-contain" />
                        <div class="text-left flex flex-col">
                            <span class="leading-tight text-[13px]">Sign in With HCPSS</span>
                            <span class="text-[10px] text-gray-400 font-normal leading-tight">Microsoft accounts</span>
                        </div>
                    </button>

                    <button onclick="loginWithGoogle()"
                        class="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <!-- Blue section -> medium dark grey -->
                            <path fill="#6B7280" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <!-- Green section -> dark grey -->
                            <path fill="#4B5563" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <!-- Yellow section -> light silver grey -->
                            <path fill="#D1D5DB" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <!-- Red section -> medium grey -->
                            <path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span class="text-[11px] font-normal">Administrator Sign in</span>
                    </button>
                </div>

                <div class="mt-6 flex flex-col items-center gap-1.5">
                    <button onclick="handleTroubleRefresh()" class="text-[11px] text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer">
                        Having trouble? Refresh
                    </button>
                </div>
            </div>
        `;
    },

    async _renderShell(isTabSwitch = false) {
        // A click (e.g. Back) that lands mid-render must not be swallowed —
        // queue it and replay once the current render releases the flag.
        if (this.isRendering()) {
            this._queuedRender = true;
            return;
        }
        const rt = this._runtime;
        const container = document.getElementById('sidebarList');
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container) return;
        if (!currentUser || !window.isLoggedIn) {
            this.renderGuestSidebar(container);
            return;
        }

        this._isRenderingFlag = true;
        try {
            // Ensure containers exist. The floating bar + fade live in their own
            // chrome layer above both levels: it is the one piece of furniture
            // that survives a Level 1 ↔ Level 2 switch, so it can morph
            // (centre ⇄ left) instead of being torn down with either panel.
            if (!container.querySelector('#sidebarLevel1Container')) {
                container.innerHTML = `
                    <div id="sidebarLevel1Container" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1C1C1E] relative z-10"></div>
                    <div id="sidebarLevel2Container" class="hidden"></div>
                    <div id="sidebarChrome" class="sidebar-chrome"></div>
                `;
            }
            const level1Container = container.querySelector('#sidebarLevel1Container');
            const level2Container = container.querySelector('#sidebarLevel2Container');
            const chrome = container.querySelector('#sidebarChrome');
            this._ensureChrome(chrome);

            // Establish stacking context on Level 1 so Level 2 (z-index 20) naturally overlays Level 1 scrollbar (z-index 50)
            if (level1Container) {
                level1Container.classList.add('z-10');
            }

            const animType = localStorage.getItem('transitionAnimation') || 'fadeSlide';

            // If we are in Level 2 mode
            const isLevel2 = (window.sidebarMode === 'class' && window.currentClassId) || (window.sidebarMode === 'recent_joined');

            if (isLevel2) {
                // Scroll Level 1 to top immediately so its scrollbar is pre-positioned at top when returning
                const subList1 = level1Container?.querySelector('#sidebarSubList');
                if (subList1) {
                    subList1._isProgrammaticScroll = true;
                    subList1.scrollTop = 0;
                    requestAnimationFrame(() => {
                        subList1._isProgrammaticScroll = false;
                    });
                }
                // First ensure Level 1 is populated (so it is visible underneath)
                if (!level1Container.querySelector('#sidebarSubList')) {
                    const origMode = window.sidebarMode;
                    window.sidebarMode = 'recent';
                    await this._renderLevel1(level1Container, false, animType);
                    window.sidebarMode = origMode;
                }

                // The shared bar becomes the sub-panel header: back + title, left-aligned.
                this._setBarLevel(2, this._level2Title());
                // Overlay-only: the row name flies its own mini-capsule into
                // the title slot while the bar morphs underneath, untouched.
                this._startEntryFly();
                this._returnFly = null;

                // A slide-out still in flight would otherwise hand its
                // animationend to the old listener and wipe this panel.
                if (level2Container._popEnd) {
                    level2Container.removeEventListener('animationend', level2Container._popEnd);
                    level2Container._popEnd = null;
                }

                // Show Level 2 container and start animation immediately
                this._killGerminate(); // a rewind still running must not clip this panel
                level2Container.classList.remove('hidden', 'sidebar-full-slide-out', 'sidebar-full-slide-in', 'sidebar-push');
                this._rowsToStagger = false;
                if (!isTabSwitch) {
                    const seed = this._entrySeed;
                    this._entrySeed = null;
                    // A seed means the click came from a row, so the germination
                    // outranks the stored transition style — and it needs Level 1
                    // live underneath, because the growing window reveals it.
                    if (this._germinate(level2Container, seed, 'in')) {
                        this._rowsToStagger = true;
                        level1Container.classList.remove('hidden');
                    } else if (animType === 'micro') {
                        level2Container.classList.add('sidebar-push');
                        level1Container.classList.add('hidden'); // Hide level 1 in micro mode to keep clean look
                    } else {
                        level1Container.classList.remove('hidden'); // Ensure level 1 is visible underneath
                        level2Container.classList.add('sidebar-full-slide-in');
                    }
                }
                void level2Container.offsetWidth; // reflow

                // Fire-and-forget: the panel is already up with its skeleton,
                // so the data render must NOT be awaited here. Awaiting it let
                // a pending offline fetch pin _isRenderingFlag and deaden the
                // Back button and every tab switch until the timeout fired.
                if (window.sidebarMode === 'class' && window.currentClassId) {
                    this.renderClassLevel2(level2Container, isTabSwitch);
                } else if (window.sidebarMode === 'recent_joined') {
                    this.renderRecentlyJoinedLevel2(level2Container, isTabSwitch);
                }
                const subList2 = level2Container.querySelector('#sidebarSubList');
                if (subList2 && window.setupCustomScrollbar) {
                    window.setupCustomScrollbar(subList2);
                }
                return;
            }

            // If we are in Level 1 mode
            level1Container.classList.remove('hidden');
            this._pendingFly = null;
            this._entrySeed = null;

            // Leaving Level 2 is a Level change in its own right: the bar flies
            // back to centre, and the panel must slide out to match the slide-in
            // (never rely on _isPopNav alone — it is consumed by whichever
            // render happens first, which is why the exit used to land flat).
            const wasLevel2 = this._barLevel === 2;
            this._setBarLevel(1);

            // Fire the return flight NOW — before any await. Riding after
            // _renderLevel1 meant a data round-trip could strand the pill for
            // over a second. The rows are still the pre-render ones and the
            // scroll is untouched, so the landing geometry is already right.
            const returnFired = !!this._returnFly;
            if (returnFired) this._spawnReturnFly();

            // Handle slide out of Level 2
            if (level2Container && !level2Container.classList.contains('hidden')) {
                const detach = () => {
                    level2Container.classList.add('hidden');
                    level2Container.classList.remove('sidebar-full-slide-out');
                    level2Container.style.clipPath = '';
                    level2Container.style.opacity = '';
                    level2Container.innerHTML = '';
                    delete level2Container.dataset.view;
                    if (level2Container._popEnd) {
                        level2Container.removeEventListener('animationend', level2Container._popEnd);
                        level2Container._popEnd = null;
                    }
                };
                // Exact rewind first, whatever the stored transition style is:
                // the panel shrinks back into the row the name is flying home
                // to, so the exit literally traces the entry.
                const seed = returnFired ? this._returnSeed : null;
                this._returnSeed = null;
                if (this._germinate(level2Container, seed, 'out', detach)) {
                    // the rewind calls detach itself when the sheet is gone
                } else if (animType !== 'micro' && (window._isPopNav || wasLevel2)) {
                    level2Container.classList.remove('sidebar-full-slide-in');
                    void level2Container.offsetWidth; // restart from the resting box
                    level2Container.classList.add('sidebar-full-slide-out');
                    const handleAnimEnd = (e) => {
                        if (e && e.target !== level2Container) return; // child animations bubble
                        detach();
                    };
                    level2Container._popEnd = handleAnimEnd;
                    level2Container.addEventListener('animationend', handleAnimEnd);
                } else {
                    detach();
                }
            }

            await this._renderLevel1(level1Container, isTabSwitch, animType);

            const subList1 = level1Container.querySelector('#sidebarSubList');
            if (isTabSwitch && subList1 && !returnFired) {
                // A return flight owns the Level 1 scroll: no top-reset, the
                // landing row was centred by _rowTextRect instead — iOS pops
                // back to where you were, never to the top.
                subList1._isProgrammaticScroll = true;
                subList1.scrollTop = 0;
                requestAnimationFrame(() => {
                    subList1._isProgrammaticScroll = false;
                });
            }

            if (subList1 && window.setupCustomScrollbar) {
                window.setupCustomScrollbar(subList1);
            }

        } catch (err) {
            console.error('renderSidebar error:', err);
            if (typeof this._legacyRawRender === 'function') {
                await this._legacyRawRender(isTabSwitch);
            }
        } finally {
            this._isRenderingFlag = false;
            if (this._queuedRender) {
                this._queuedRender = false;
                this.renderSidebar();
            }
        }
    },

    async _renderLevel1(level1Container, isTabSwitch, animType) {
        if (!level1Container.querySelector('#sidebarSubList')) {
            level1Container.innerHTML = `
                <div id="sidebarSubList" class="flex-1 overflow-y-auto pb-28 lg:pb-4"></div>
            `;
        }

        // The switcher now lives in the shared chrome bar, so a Level 1 render
        // only re-syncs its active segment and the indicator pill.
        this._syncTabState();

        const subList = level1Container.querySelector('#sidebarSubList');
        if (isTabSwitch || window._isPopNav) {
            subList?.classList.remove('sidebar-pop', 'sidebar-push', 'tab-fade-up', 'sidebar-full-slide-pop', 'sidebar-full-slide-in');
        }

        // When returning from Level 2, Level 1 was already populated underneath; preserve it to eliminate flickering
        if (window._isPopNav && subList && subList.children.length > 0) {
            window._isPopNav = false;
            if (window.AppModules && window.AppModules.Notify) window.AppModules.Notify.updateUI();
            return;
        }

        // Same rule as Level 2: schedule the data render, never await it —
        // the render paints its own loading state and updates when data lands.
        if (window.sidebarMode === 'class') this.renderClassLevel1(subList);
        else this.renderUserSidebarItems(subList);

        if (isTabSwitch || window._isPopNav) {
            void subList.offsetWidth;
            requestAnimationFrame(() => {
                if (animType === 'micro') {
                    subList.classList.add('sidebar-pop');
                } else {
                    if (window._isPopNav) {
                        // In fadeSlide, Level 1 stays stationary when popping, so we do not animate it
                    } else {
                        subList.classList.add('tab-fade-up');
                    }
                }
                window._isPopNav = false;
            });
        }

        if (window.AppModules && window.AppModules.Notify) window.AppModules.Notify.updateUI();
    },

    /**
     * Shared floating-bar layer: one glass capsule that carries either the
     * Level 1 switcher (centred) or the Level 2 back + title (left), plus a
     * second right-aligned capsule for the sub-panel's actions.
     */
    _ensureChrome(chrome) {
        if (!chrome || chrome._built) return undefined;
        chrome._built = true;
        chrome.innerHTML = `
            <div class="sidebar-tabs-fade"></div>
            <div class="sidebar-tabs" id="sidebarTabsBar">
                <div class="sidebar-tabs-group" data-tabs-group="switcher">
                    <span class="sidebar-tab-pill"></span>
                    <button data-sidebar-mode="recent" class="sidebar-tab relative h-full min-w-0 px-4 rounded-full flex items-center justify-center font-bold uppercase tracking-widest text-black dark:text-white ${window.sidebarMode === 'recent' ? 'sidebar-tab-active' : ''}">
                        <span class="relative z-10">Recent</span>
                    </button>
                    <button data-sidebar-mode="all" class="sidebar-tab relative h-full min-w-0 px-4 rounded-full flex items-center justify-center font-bold uppercase tracking-widest text-black dark:text-white ${window.sidebarMode === 'all' ? 'sidebar-tab-active' : ''}">
                        <span class="relative z-10">Contacts</span>
                    </button>
                    <button data-sidebar-mode="class" class="sidebar-tab relative h-full min-w-0 px-4 rounded-full flex items-center justify-center font-bold uppercase tracking-widest text-black dark:text-white ${window.sidebarMode === 'class' ? 'sidebar-tab-active' : ''}">
                        <span class="relative z-10">Class</span>
                    </button>
                </div>
                <div class="sidebar-tabs-group sidebar-tabs-group-back" data-tabs-group="back" hidden>
                    <button data-sidebar-back="1" title="Back" class="sidebar-back-disc flex-shrink-0">
                        <svg class="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                    </button>
                    <span class="sidebar-tabs-title" id="sidebarLevel2Title"></span>
                </div>
            </div>
            <div class="sidebar-tabs sidebar-tabs-actions" id="sidebarTabsActions" hidden></div>
        `;

        const bar = chrome.querySelector('#sidebarTabsBar');
        this._applyBarGlass(bar);

        chrome.querySelectorAll('#sidebarTabsBar [data-sidebar-mode]').forEach(btn => {
            btn.onclick = event => this.switchSidebarTab(btn.dataset.sidebarMode, event);
        });
        chrome.querySelector('[data-sidebar-back]').onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            this.handleSidebarBack();
        };

        // Resting geometry is px the JS computes from the panel width, so any
        // panel resize must re-place it — with no flight, or the capsule would
        // bounce once per resize step. Observing the panel (not the bar) also
        // covers a 0-width first measure when the sidebar is hidden at build
        // time, and cannot loop: the bar is absolutely positioned, so placing
        // it never changes the panel's box.
        const place = () => {
            if (!bar.isConnected) return;
            this._layoutBar(false);
            this._syncTabState(false);
        };
        const panel = chrome.parentElement;
        if (panel && window.ResizeObserver) {
            new ResizeObserver(place).observe(panel);
        }
        window.addEventListener('resize', place);
        return undefined;
    },

    _applyBarGlass(el) {
        if (!el || el._liquidGlass) return;
        import('./liquid-glass.js?v=20260920-iosglass-fb-v5').then(({ LiquidGlassEffect }) => {
            if (!el.isConnected || el._liquidGlass) return;
            new LiquidGlassEffect(el, {
                radius: 23,            // matches the 46px-tall capsule, same as the chat bars
                refractionWidth: 10,   // slightly tighter bevel than chatInputPill for a small bar
                maxDisplacement: 6,
                mouseRadius: 60,
                mouseStrength: 5
            });
        }).catch(() => {});
    },

    handleSidebarBack() {
        this._startReturnFly();
        if (window.sidebarMode === 'recent_joined') window.sidebarMode = 'recent';
        else window.currentClassId = null;
        window._isPopNav = true;
        this.renderSidebar(true);
    },

    /* Class row ⇄ capsule title fusion flight. A detached mini-capsule carries
     * the class name from the tapped row into the bar's title slot (and back).
     * During an entry flight the real title goes visibility-hidden (layout
     * untouched, the bar's own morph untouched) so exactly one copy of the
     * word is ever in motion; it is revealed the frame the pill starts
     * dissolving — same word, same pixels, reads as a handoff. */
    _reducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    _killFly() {
        const f = this._fly;
        if (!f) return undefined;
        this._fly = null;
        if (f.raf) cancelAnimationFrame(f.raf);
        try { f.anims.forEach(a => a.cancel()); } catch (e) {}
        if (f.el && f.el.isConnected) f.el.remove();
        if (f.reveal) { try { f.reveal(); } catch (e) {} }
        return undefined;
    },

    _armFlyFromRow(item, c, ev) {
        if (this._reducedMotion()) return undefined;
        // Takeoff rect is captured now, at click time: the entry render will
        // scroll Level 1 back to the top one frame later and move the row.
        const nameEl = item.querySelector('[data-fly-name]');
        let rect = null;
        if (nameEl) {
            const range = document.createRange();
            range.selectNodeContents(nameEl);
            const nr = range.getBoundingClientRect();
            if (nr.width && nr.height) rect = { left: nr.left, top: nr.top, width: nr.width, height: nr.height };
        }
        // Where inside the row the pointer landed — kept row-relative so the
        // rewind finds the same spot even after the list has scrolled.
        const rr = item.getBoundingClientRect();
        const hasPoint = ev && Number.isFinite(ev.clientX) && (ev.clientX !== 0 || ev.clientY !== 0);
        this._germPoint = hasPoint ? { dx: ev.clientX - rr.left, dy: ev.clientY - rr.top } : null;
        const seed = this._germSeedFromRow(item, this._germPoint);
        this._trackRow(c.id, item);
        this._pendingFly = { id: c.id, name: c.name || '', echo: c.echo || c.name || '', rect, seed };
        return undefined;
    },

    // Landing/takeoff geometry is read from the DOM at spawn time, never
    // cached: entering Level 2 scrolls Level 1 back to the top, so a rect
    // captured at click time would drift by the scroll delta.
    _rowTextRect(classId, ensureVisible) {
        const list = document.querySelector('#sidebarLevel1Container #sidebarSubList');
        const row = this._rowEl(classId);
        const nameEl = row && row.querySelector('[data-fly-name]');
        if (!list || !nameEl) return null;
        const range = document.createRange();
        range.selectNodeContents(nameEl);
        let nr = range.getBoundingClientRect();
        if (!nr.width || !nr.height) return null;
        let lr = list.getBoundingClientRect();
        if (ensureVisible && (nr.bottom < lr.top || nr.top > lr.bottom)) {
            list._isProgrammaticScroll = true;
            list.scrollTop += (nr.top - lr.top) - (lr.height - nr.height) / 2;
            requestAnimationFrame(() => { list._isProgrammaticScroll = false; });
            nr = range.getBoundingClientRect();
            lr = list.getBoundingClientRect();
        }
        if (nr.bottom < lr.top || nr.top > lr.bottom) return null; // off-fold: no credible landing spot
        return { left: nr.left, top: nr.top, width: nr.width, height: nr.height };
    },

    _rowNameEl(classId) {
        const row = this._rowEl(classId);
        return (row && row.querySelector('[data-fly-name]')) || null;
    },

    // The hand-off lives in state, not on the node: a Level-1 re-render can
    // replace the row mid-flight (the async class fetch rebuilds every row),
    // and a visibility written on the old node would die with it — that is
    // why only the FIRST return after a reload showed doubled text.
    _setRowHandoff(id) {
        this._rowHandoffId = id;
        const el = this._rowNameEl(id);
        if (el) el.style.visibility = 'hidden';
    },

    _clearRowHandoff() {
        const id = this._rowHandoffId;
        this._rowHandoffId = null;
        const el = this._rowNameEl(id);
        if (el) el.style.visibility = '';
    },

    _startEntryFly() {
        const pending = this._pendingFly;
        this._pendingFly = null;
        if (!pending || this._reducedMotion()) return undefined;
        const isJoined = pending.id === 'recent_joined';
        if (!isJoined && pending.id !== window.currentClassId) return undefined;
        if (isJoined && window.sidebarMode !== 'recent_joined') return undefined;
        const bar = document.querySelector('#sidebarChrome #sidebarTabsBar');
        const titleEl = document.querySelector('#sidebarChrome #sidebarLevel2Title');
        const fromRect = pending.rect || this._rowTextRect(pending.id);
        if (!bar || !titleEl || !fromRect || !bar.offsetParent) return undefined;
        // Kill any live flight BEFORE hiding: its reveal must not undo ours.
        this._killFly();
        // One click, two results: the name flies up while the panel body grows
        // out of the same row. The seed only arms when the flight actually
        // launches, so the two never diverge into a pill with a slide panel.
        this._entrySeed = pending.seed || null;
        titleEl.classList.add('title-handoff');
        // The row leaves its own word behind for the pill to carry — one copy
        // in flight, never a doubled one lifting off.
        this._setRowHandoff(pending.id);
        // Predicted final geometry at frame 1: the bar's inline left/width
        // already hold the spring targets while it is in flight.
        let ox = 0, oy = 0;
        for (let el = titleEl; el && el !== bar; el = el.offsetParent) { ox += el.offsetLeft; oy += el.offsetTop; }
        const cr = bar.offsetParent.getBoundingClientRect();
        const toRect = {
            left: cr.left + (parseFloat(bar.style.left) || bar.offsetLeft) + ox,
            top: cr.top + (parseFloat(bar.style.top) || bar.offsetTop) + oy,
            width: titleEl.offsetWidth,
            height: titleEl.offsetHeight
        };
        this._spawnFlyPill(pending.name, fromRect, toRect, {
            morph: true, startScale: 1.25, endScale: 1, echoText: pending.echo,
            anchor: () => {
                const r = titleEl.getBoundingClientRect();
                return r.width ? r : null;
            },
            onDock: () => {
                titleEl.classList.remove('title-handoff');
                this._clearRowHandoff();
            }
        });
        return undefined;
    },

    _startReturnFly() {
        const isJoined = window.sidebarMode === 'recent_joined';
        const isClass = window.sidebarMode === 'class' && window.currentClassId;
        if ((!isJoined && !isClass) || this._barLevel !== 2 || this._reducedMotion()) return undefined;
        const titleEl = document.querySelector('#sidebarChrome #sidebarLevel2Title');
        if (!titleEl || !titleEl.offsetWidth || !titleEl.innerText) return undefined;
        const tr = titleEl.getBoundingClientRect();
        // Armed at click, fired by the back render before its first await.
        // The name must come from cnCache, NOT titleEl.innerText: innerText
        // returns the CSS-uppercased rendering, and an all-caps echo lands
        // visibly bigger/wider than the mixed-case row text it is joining.
        this._returnFly = isJoined
            ? { id: 'recent_joined', name: 'New Members', echo: 'Recently Joined' }
            : { id: window.currentClassId, name: window.cnCache[window.currentClassId] || titleEl.innerText };
        this._returnFly.fromRect = { left: tr.left, top: tr.top, width: tr.width, height: tr.height };
        return undefined;
    },

    _spawnReturnFly() {
        const rf = this._returnFly;
        this._returnFly = null;
        if (!rf) return undefined;
        const toRect = this._rowTextRect(rf.id, true);
        if (!toRect) return undefined;
        // Measured after that call: _rowTextRect may have centred the landing
        // row, and the panel has to shrink onto where the row now really is.
        this._returnSeed = this._germSeedFromRow(this._rowEl(rf.id), this._germPoint);
        // The landing row keeps its slot but surrenders its word until the
        // pill docks — otherwise the uppercase in-flight copy and the
        // mixed-case row text read as two overlapping labels.
        this._setRowHandoff(rf.id);
        this._spawnFlyPill(rf.name, rf.fromRect, toRect, {
            morph: false, startScale: 1, endScale: 1, echoText: rf.echo,
            anchor: () => this._rowTextRect(rf.id),
            onDock: () => this._clearRowHandoff()
        });
        return undefined;
    },

    _spawnFlyPill(name, fromRect, toRect, opts = {}) {
        this._killFly();
        const startScale = opts.startScale || 1;
        const endScale = opts.endScale || 1;
        const pill = document.createElement('div');
        pill.className = 'sidebar-fly-pill';
        const shell = document.createElement('span');
        shell.className = 'sidebar-fly-shell';
        pill.appendChild(shell);
        const label = document.createElement('span');
        label.className = 'sidebar-fly-title';
        label.textContent = name;
        const echo = document.createElement('span');
        echo.className = 'sidebar-fly-echo';
        echo.textContent = opts.echoText || name;
        pill.appendChild(label);
        pill.appendChild(echo);
        if (opts.morph) {
            label.style.opacity = '0';
        } else {
            echo.style.opacity = '0';
        }
        document.body.appendChild(pill);
        // Dock centered on the title text box, so the last frames show one
        // word (the overlay) sitting exactly on the other (the real title).
        const cx = toRect.left + toRect.width / 2;
        const cy = toRect.top + toRect.height / 2;
        pill.style.left = (cx - pill.offsetWidth / 2) + 'px';
        pill.style.top = (cy - pill.offsetHeight / 2) + 'px';
        const sx = (fromRect.left + fromRect.width / 2) - cx;
        const sy = (fromRect.top + fromRect.height / 2) - cy;
        // TEMP DIAGNOSTIC (v20): first-flight drift probe — remove after triage.
        console.log('[flyPill]', opts.morph ? 'enter' : 'return', JSON.stringify({
            from: [Math.round(fromRect.left), Math.round(fromRect.width)],
            to: [Math.round(toRect.left), Math.round(toRect.width)],
            t: performance.now() | 0
        }));
        // The path is rAF-driven, not a baked WAAPI endpoint: entering a
        // class changes the chat's content height, the page scrollbar can
        // appear/disappear mid-flight and shift the whole panel ~15px, which
        // made any launch-time prediction stale on arrival. Every frame
        // re-reads the live anchor, so the pill tracks its real target.
        const dur = 480;
        const easeOut = t => 1 - Math.pow(1 - t, 4);
        pill.style.transform = `translate(${sx}px, ${sy}px) scale(${startScale})`;
        const fade = pill.animate([
            { opacity: opts.morph ? 0 : 1 },
            { opacity: 1, offset: 0.16 },
            { opacity: 1 }
        ], { duration: dur, easing: 'linear', fill: 'forwards' });
        const anims = [fade];
        // The glass shell is its own layer so it can melt into the bar before
        // the pill docks: entering, it shrinks and clears over the last 40%
        // (an oversized shell resting on the bar's edge read as a sticker);
        // returning, it condenses back out of the title text.
        const shellKeys = opts.morph
            ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1)', offset: 0.55 }, { opacity: 0, transform: 'scale(0.78)' }]
            : [{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1)', offset: 0.72 }, { opacity: 0, transform: 'scale(0.9)' }];
        anims.push(shell.animate(shellKeys, { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }));
        if (opts.morph) {
            anims.push(label.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1 }], { duration: 480, easing: 'ease-out', fill: 'forwards' }));
            anims.push(echo.animate([{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], { duration: 480, easing: 'ease-out', fill: 'forwards' }));
        } else {
            // Landing on the row: convert title type back into list type. The
            // pill itself never scales up (that read as an oversized capsule);
            // the row-style twin grows from the title's 13px into its real
            // 16px while the uppercase copy fades out, so the word arrives at
            // exactly the size of the text it joins.
            anims.push(label.animate([{ opacity: 1 }, { opacity: 1, offset: 0.62 }, { opacity: 0, offset: 0.9 }, { opacity: 0 }], { duration: 480, easing: 'ease-out', fill: 'forwards' }));
            anims.push(echo.animate([
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.81)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.81)', offset: 0.62 },
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
            ], { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }));
        }
        const f = { el: pill, anims, raf: 0, reveal: opts.onDock || null };
        this._fly = f;
        const dissolve = () => {
            // The guard timer must never restart a fade already running:
            // that snapped the pill back to full opacity mid-dissolve.
            if (this._fly !== f || f.dissolving) return;
            f.dissolving = true;
            // Hand the word back BEFORE the fade starts: the real title sits
            // on the same pixels, so only the shell appears to melt away.
            if (f.reveal) { try { f.reveal(); } catch (e) {} }
            const out = pill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' });
            f.anims.push(out);
            out.finished.then(() => {
                if (this._fly === f) { this._fly = null; pill.remove(); }
            }).catch(() => {});
        };
        const t0 = performance.now();
        // The anchor is a live rect, and reading one every frame forces a
        // layout pass while the sheet is being clipped and the bar is
        // transitioning — that is what dropped the flight to a few visible
        // steps. Re-measure on a beat and coast between reads; the last frame
        // always reads fresh so the dock stays pixel-exact.
        let a = toRect, aAt = 0;
        const tick = (now) => {
            if (this._fly !== f || f.dissolving) return;
            const p = Math.min(1, (now - t0) / dur);
            const ex = easeOut(p);
            const ey = easeOut(Math.min(1, p * 0.92)); // y lags x: gentle arc
            if (opts.anchor && (p >= 1 || now - aAt > 32)) {
                const r = opts.anchor();
                if (r) { a = r; aAt = now; }
            }
            const ax = a.left + a.width / 2 - cx;
            const ay = a.top + a.height / 2 - cy;
            const s = startScale + (endScale - startScale) * ex;
            pill.style.transform = `translate(${sx + (ax - sx) * ex}px, ${sy + (ay - sy) * ey}px) scale(${s})`;
            if (p < 1) { f.raf = requestAnimationFrame(tick); return; }
            dissolve();
        };
        f.raf = requestAnimationFrame(tick);
        return undefined;
    },

    /* Level 1 ⇄ Level 2 germination: the tapped row is the seed the sub-panel
     * is drawn open from (and collapses back into), so the exit path literally
     * is the entry path. Clipping the panel is safe — its own background is
     * solid, and the glass capsule lives in the sibling #sidebarChrome layer. */
    _GERM_MS: 700,

    _rowEl(classId) {
        // Prefer the row the flight actually lifted off from: the id lookup
        // would land on the first row carrying that id, which is not the one
        // the user tapped whenever the list repeats an entry.
        const tracked = this._rowRefs && this._rowRefs[classId];
        if (tracked && tracked.isConnected) return tracked;
        return document.querySelector('#sidebarLevel1Container #sidebarSubList [data-class-id="' + classId + '"]');
    },

    _trackRow(classId, el) {
        if (!this._rowRefs) this._rowRefs = {};
        this._rowRefs[classId] = el;
    },

    // The seed is a squarish window punched at the spot the pointer landed,
    // so the sheet opens outward in all four directions from the click. Insets
    // are panel-local and captured in the click frame: Level 1 scrolls to its
    // own top one frame after entry, which would otherwise teleport the seed.
    // The point is kept row-relative (dx, dy inside the row) so the rewind
    // folds back into the same spot even after the list has scrolled.
    _germSeedFromRow(rowEl, point) {
        const frame = document.getElementById('sidebarList');
        // TEMP DIAGNOSTIC (v23): why the germination declines — remove after triage.
        const bail = why => { console.log('[germinate] no seed:', why); return null; };
        if (!rowEl) return bail('no row element');
        if (!frame) return bail('no #sidebarList');
        const r = rowEl.getBoundingClientRect();
        const f = frame.getBoundingClientRect();
        if (!r.width || !r.height) return bail('row box ' + JSON.stringify([r.width, r.height]));
        if (!f.height) return bail('frame height 0');
        if (r.bottom < f.top || r.top > f.bottom) return bail('row off-fold');
        const S = Math.min(92, Math.max(56, Math.round(r.height)));
        const cx = r.left + (point ? Math.min(Math.max(point.dx, 0), r.width) : r.width / 2);
        const cy = r.top + (point ? Math.min(Math.max(point.dy, 0), r.height) : r.height / 2);
        // Keep the whole seed inside the panel: an edge that starts already at
        // the panel border cannot grow, and the pull reads as one-sided.
        const mx = Math.min(S / 2, f.width / 2) + 6;
        const my = Math.min(S / 2, f.height / 2) + 6;
        const px = Math.min(Math.max(cx - f.left, mx), Math.max(mx, f.width - mx));
        const py = Math.min(Math.max(cy - f.top, my), Math.max(my, f.height - my));
        const seed = {
            top: Math.round(py - S / 2),
            right: Math.round(f.width - px - S / 2),
            bottom: Math.round(f.height - py - S / 2),
            left: Math.round(px - S / 2),
            size: S
        };
        console.log('[germinate] seed', JSON.stringify(seed));
        return seed;
    },

    _killGerminate() {
        const g = this._germ;
        if (g) this._landGerminate(g);
        return undefined;
    },

    _landGerminate(rec) {
        // fill:forwards would keep the last inset() clipping the panel (and the
        // emptied body invisible) long after the flight, so the effects are
        // dropped rather than overwritten — and a killed rewind must leave the
        // panel clean for whatever render takes it over next.
        if (this._germ === rec) this._germ = null;
        rec.anims.forEach(a => { try { a.cancel(); } catch (e) {} });
        rec.panel.style.clipPath = '';
        rec.panel.style.opacity = '';
        rec.panel.style.willChange = '';
        if (rec.body) rec.body.style.opacity = '';
    },

    _germinate(panel, seed, dir, onDone) {
        // TEMP DIAGNOSTIC (v23): remove after triage.
        if (!panel || !seed) { console.log('[germinate] skipped', dir, !panel ? 'no panel' : 'no seed'); return null; }
        if (this._reducedMotion()) { console.log('[germinate] skipped: reduced motion'); return null; }
        if (!panel.animate) { console.log('[germinate] skipped: no WAAPI'); return null; }
        if (dir === 'in' && !seed.top && !seed.bottom && !seed.left && !seed.right) { console.log('[germinate] skipped: seed is the whole panel'); return null; }
        this._killGerminate();
        const box = (s, r) => `inset(${s.top}px ${s.right}px ${s.bottom}px ${s.left}px round ${r}px)`;
        const R = Math.min(30, Math.max(14, Math.round(seed.size * 0.34)));
        const closed = box(seed, R);
        // The corners ride the moving edge: the radius stays at full size for
        // the whole opening, and only squares off once the sheet is full — a
        // radius that shrinks while the box grows reads as "the row went
        // square, then the panel snapped open" instead of a paper pull.
        const open = { top: 0, right: 0, bottom: 0, left: 0 };
        // The corners ride the moving edge almost to the end: the sheet grows
        // with a full radius on a curve that starts unhurried, and only once it
        // has reached all four borders do the corners melt out. A front-loaded
        // curve reads as "still on the row, then already gone square".
        const keys = dir === 'in'
            ? [
                { clipPath: closed, easing: 'cubic-bezier(0.34, 0.02, 0.14, 1)' },
                { clipPath: box(open, R), offset: 0.74, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                { clipPath: box(open, 0) }
            ]
            : [
                { clipPath: box(open, 0), opacity: 1, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                { clipPath: box(open, R), offset: 0.26, opacity: 1, easing: 'cubic-bezier(0.5, 0.02, 0.7, 0.6)' },
                { clipPath: closed, offset: 0.86, opacity: 1 },
                { clipPath: closed, opacity: 0 }
            ];
        const anims = [panel.animate(keys, { duration: this._GERM_MS, easing: 'linear', fill: 'forwards' })];
        // clip-path only rides the compositor if the sheet has its own layer.
        panel.style.willChange = 'clip-path';
        // Rewinding must not leave a slice of member rows cut in half inside
        // the collapsing band: the content clears first, then an empty sheet
        // folds back into the row it came from.
        const body = dir === 'out' ? panel.firstElementChild : null;
        if (body) {
            anims.push(body.animate([
                { opacity: 1 },
                { opacity: 1, offset: 0.1 },
                { opacity: 0 }
            ], { duration: this._GERM_MS * 0.6, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }));
        }
        const rec = { panel, body, anims, dir };
        this._germ = rec;
        // TEMP DIAGNOSTIC (v23): remove after triage.
        console.log('[germinate] run', dir, closed);
        requestAnimationFrame(() => {
            try { console.log('[germinate] live clip', getComputedStyle(panel).clipPath); } catch (e) {}
        });
        anims[0].finished.then(() => {
            this._landGerminate(rec);
            if (onDone) onDone();
        }).catch(() => {});
        return rec;
    },

    // iOS list finish: once the panel has opened past its half-way mark the
    // rows lift into place, one notch behind the next.
    _staggerRows(list) {
        if (!list || this._reducedMotion() || !list.children.length) return undefined;
        void list.offsetWidth;
        Array.from(list.children).forEach((el, i) => {
            el.classList.remove('sidebar-row-in');
            el.style.animationDelay = '';
            el.classList.add('sidebar-row-in');
            el.style.animationDelay = (90 + Math.min(i, 11) * 16) + 'ms';
        });
        return undefined;
    },

    _syncTabState(animatePill = true) {
        const group = document.querySelector('#sidebarChrome [data-tabs-group="switcher"]');
        if (!group) return undefined;
        ['recent', 'all', 'class'].forEach(mode => {
            const btn = group.querySelector(`[data-sidebar-mode="${mode}"]`);
            if (btn) btn.classList.toggle('sidebar-tab-active', window.sidebarMode === mode);
        });
        // One shared indicator pill: snap on first build, spring-glide on switches.
        this._syncTabPill(group, animatePill);
        if (window.ResizeObserver && !group._tabPillRO) {
            // Covers a 0-width first measure (sidebar hidden at build time):
            // the pill lands with no flight as soon as the bar has a size.
            group._tabPillRO = new ResizeObserver(() => this._syncTabPill(group, false));
            group._tabPillRO.observe(group);
        }
        return undefined;
    },

    _level2Title() {
        if (window.sidebarMode === 'recent_joined') return 'New Members';
        return window.cnCache[window.currentClassId] || 'Class';
    },

    // Swap the bar's content between the switcher and the back+title group,
    // then fly the capsule to the geometry that fits the new content.
    _setBarLevel(level, title = null) {
        const chrome = document.getElementById('sidebarChrome');
        const bar = chrome?.querySelector('#sidebarTabsBar');
        if (!bar) return undefined;
        const groups = {
            1: bar.querySelector('[data-tabs-group="switcher"]'),
            2: bar.querySelector('[data-tabs-group="back"]')
        };
        const first = this._barLevel === null;
        const changed = this._barLevel !== level;
        if (level === 2 && title !== null) {
            const titleEl = bar.querySelector('#sidebarLevel2Title');
            if (titleEl) titleEl.innerText = title;
        }
        Object.entries(groups).forEach(([l, el]) => {
            if (el) el.hidden = String(l) !== String(level);
        });
        if (changed && level === 1) this._renderBarActions(null);
        if (changed && !first && groups[level]) {
            groups[level].classList.remove('sidebar-group-in');
            void groups[level].offsetWidth;
            groups[level].classList.add('sidebar-group-in');
        }
        this._barLevel = level;
        this._layoutBar(changed && !first);
        return undefined;
    },

    // The class name arrives after the bar has already flown to its cached
    // text; re-measuring rides the same spring so the capsule grows into place
    // instead of hard-cutting.
    _setBarTitle(title) {
        const titleEl = document.querySelector('#sidebarChrome #sidebarLevel2Title');
        if (!titleEl || this._barLevel !== 2) return undefined; // a late fetch must not resize the Level 1 bar
        const grew = titleEl.innerText !== title;
        titleEl.innerText = title;
        this._layoutBar(grew);
        return undefined;
    },

    _layoutBar(animate = true) {
        const listEl = document.getElementById('sidebarList');
        const bar = document.querySelector('#sidebarChrome #sidebarTabsBar');
        if (!listEl || !bar) return undefined;
        const panelW = listEl.clientWidth;
        if (!panelW) return undefined; // panel hidden: the next render places it

        const curW = bar.offsetWidth;
        const curLeft = bar.offsetLeft;
        // Measure the destination on a throwaway clone: touching the live box
        // (width: max-content) inside a running transition retargets it and
        // kills the flight, which is exactly what happens when the class name
        // arrives mid-glide.
        const probe = bar.cloneNode(true);
        probe.id = '';
        probe.style.transition = 'none';
        probe.style.position = 'absolute';
        probe.style.left = '-9999px';
        probe.style.width = 'max-content';
        probe.style.maxWidth = 'none';
        // Inline refraction styles travel with the clone; drop them so the
        // measure never rasterises a filter over an off-screen box.
        probe.style.backdropFilter = 'none';
        probe.style.webkitBackdropFilter = 'none';
        probe.style.filter = 'none';
        document.body.appendChild(probe);
        const natural = probe.offsetWidth;
        probe.remove();

        const targetW = Math.min(natural, panelW - 24);
        const targetLeft = this._barLevel === 2 ? 12 : Math.round((panelW - targetW) / 2);
        const glass = bar._liquidGlass;
        const settle = () => {
            if (bar._barTracking) {
                bar._barTracking = false;
                if (glass) glass.endTrack();
            }
        };
        if (Math.abs(targetW - curW) < 0.5 && Math.abs(targetLeft - curLeft) < 0.5 && !bar._barFlight) {
            return undefined; // already resting here
        }
        if (!animate || !curW) {
            // First landing (and resize): land the box, never fly it in from 0.
            const live = bar._barFlight;
            if (live) {
                bar._barFlight = null;
                clearTimeout(live.timer);
            }
            settle();
            bar.classList.add('sidebar-bar-snap');
            bar.style.left = targetLeft + 'px';
            bar.style.width = targetW + 'px';
            void bar.offsetWidth;
            bar.classList.remove('sidebar-bar-snap');
            return undefined;
        }
        // Fly: build the glass map once for the destination box, pin back to
        // the old one, then let the CSS spring carry left + width (see
        // .sidebar-tabs in style.css — same curves the tab pill rides).
        bar.classList.add('sidebar-bar-snap');
        bar.style.left = targetLeft + 'px';
        bar.style.width = targetW + 'px';
        void bar.offsetWidth; // the map is built against the destination box
        if (glass && !bar._barTracking) {
            bar._barTracking = true;
            glass.beginTrack();
        }
        bar.style.left = curLeft + 'px';
        bar.style.width = curW + 'px';
        void bar.offsetWidth; // reflow at the old box so the glide starts there
        bar.classList.remove('sidebar-bar-snap');
        void bar.offsetWidth;
        bar.style.left = targetLeft + 'px';
        bar.style.width = targetW + 'px';
        const prev = bar._barFlight;
        if (prev) clearTimeout(prev.timer);
        const flight = {};
        flight.timer = setTimeout(() => {
            if (bar._barFlight !== flight) return;
            bar._barFlight = null;
            settle();
        }, 560);
        bar._barFlight = flight;
        return undefined;
    },

    // Right-aligned action capsule (Class Level 2: delete + edit for the
    // teacher/admin). It slides in from off-panel rather than fading, since
    // opacity would kill the capsule's liquid-glass surface.
    _renderBarActions(content) {
        const actions = document.querySelector('#sidebarChrome #sidebarTabsActions');
        if (!actions) return undefined;
        if (!content) {
            actions.classList.remove('sidebar-bar-in');
            if (actions._hideTimer) clearTimeout(actions._hideTimer);
            actions._hideTimer = setTimeout(() => {
                if (!actions.classList.contains('sidebar-bar-in')) {
                    actions.hidden = true;
                    actions.innerHTML = '';
                    delete actions.dataset.key;
                }
            }, 460);
            return undefined;
        }
        // A class fetch can land after the user already popped back; the
        // actions capsule only belongs to a Level 2 panel.
        if (this._barLevel !== 2) return undefined;
        if (actions._hideTimer) clearTimeout(actions._hideTimer);
        if (actions.dataset.key !== content.key) {
            actions.innerHTML = content.html;
            actions.dataset.key = content.key;
        }
        actions.hidden = false;
        void actions.offsetWidth;
        actions.classList.add('sidebar-bar-in');
        // Built only once the capsule has a real box: a hidden (0×0) glass
        // surface maps nothing.
        this._applyBarGlass(actions);
        return undefined;
    },

    _syncTabPill(tabsEl, animate = true) {
        if (!tabsEl) return;
        const pill = tabsEl.querySelector('.sidebar-tab-pill');
        const active = tabsEl.querySelector('.sidebar-tab-active');
        if (!pill || !active) return;
        if (!active.offsetWidth || !active.offsetHeight) return; // unmeasurable (hidden): RO/next render retries
        if (pill.style.opacity !== '1') animate = false; // never fly in from 0 on its first landing
        const place = () => {
            pill.style.left = active.offsetLeft + 'px';
            pill.style.top = active.offsetTop + 'px';
            pill.style.width = active.offsetWidth + 'px';
            pill.style.height = active.offsetHeight + 'px';
            pill.style.opacity = '1';
        };
        if (!animate) {
            pill.classList.add('sidebar-pill-snap');
            place();
            void pill.offsetWidth;
            pill.classList.remove('sidebar-pill-snap');
        } else {
            place();
        }
    },

    renderClassLevel2(container, isTabSwitch = false) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            const classId = window.currentClassId;
            // Consumed here (not in the shell) so the stagger still runs on
            // the real rows whenever the data lands.
            const stagger = this._rowsToStagger;
            this._rowsToStagger = false;
            try {
                const view = 'class:' + classId;
                // The back + title row is the shared floating bar now, so this
                // panel carries only the list (offset under the bar's band).
                if (container.dataset.view !== view || !container.querySelector('#sidebarSubList')) {
                    container.dataset.view = view;
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E]">
                            <div id="sidebarSubList" class="flex-1 overflow-y-auto pb-28 lg:pb-4">
                                <div class="p-4 space-y-4 animate-pulse">
                                    <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4 mb-6"></div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4 mt-8 mb-6"></div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                </div>
                                ${this._loadingHtml('Loading...')}
                            </div>
                        </div>
                    `;
                }

                const snap = await this._fetch(rt.ref(rt.db, `classes/${classId}`));
                // The user may have left (Back / tab switch) while this hung
                // offline — writing into the shared panel/bar afterwards would
                // clobber whatever they navigated to, so drop the stale render.
                if (window.sidebarMode !== 'class' || window.currentClassId !== classId) return;
                const c = snap.val();
                if (!c) { window.currentClassId = null; this.renderSidebar(); return; }

                window.cnCache[window.currentClassId] = c.name;
                this._setBarTitle(c.name);

                const canManage = window.AppModules.User.isAdmin() || c.teacherId === currentUser.id;
                this._renderBarActions(canManage ? {
                    key: view,
                    html: `
                        <button onclick="handleDeleteClass('${window.currentClassId}')" class="sidebar-action-disc text-black dark:text-white active:scale-90" title="Delete Class">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <button onclick="AppModules.Sidebar.openStudentSelector('${window.currentClassId}')" class="sidebar-action-label text-black dark:text-white">Edit</button>
                    `
                } : null);

                const subList = container.querySelector('#sidebarSubList');
                const teacher = await this._fetchUser(c.teacherId);
                const students = c.students ? Object.keys(c.students) : [];

                const activeTargetId = rt.getActiveTargetId ? rt.getActiveTargetId() : null;
                const teacherActive = activeTargetId === c.teacherId;
                const groupActive = activeTargetId === `group_${window.currentClassId}`;

                let extensionHtml = '';
                if (c.extensions) {
                    const activeExts = Object.keys(c.extensions).filter(eid => c.extensions[eid] === true);
                    if (activeExts.length > 0) {
                        let innerHtml = '';
                        activeExts.forEach(eid => {
                            const regItem = window.AppModules && window.AppModules.Extension && window.AppModules.Extension.getRegistryItem ? window.AppModules.Extension.getRegistryItem(eid) : null;
                            if (regItem) {
                                innerHtml += `
                                    <div onclick="openExtension('${eid}')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-black dark:text-white bg-[#007AFF]/10 dark:bg-[#0A84FF]/10">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="font-bold text-sm text-black dark:text-white">${window.escapeHTML(regItem.title)}</div>
                                            <div class="text-[10px] text-gray-400 uppercase tracking-tight">${window.escapeHTML(regItem.category || 'Extension Tool')}</div>
                                        </div>
                                    </div>
                                `;
                            }
                        });
                        if (innerHtml) {
                            extensionHtml = `<div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Extensions</div>` + innerHtml;
                        }
                    }
                }

                let html = `
                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Teacher</div>
                    <div id="item-${c.teacherId}" onclick="window.switchChat('${c.teacherId}')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 ${teacherActive ? 'active-chat-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}">
                        <div>
                            <div class="font-bold text-base text-black dark:text-white">${window.escapeHTML(teacher?.name || 'Teacher')}</div>
                            <div class="text-xs text-[#007AFF] font-bold">Class Teacher</div>
                        </div>
                    </div>
                    ${extensionHtml}
                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Group Chat</div>
                    <div id="item-group_${window.currentClassId}" onclick="window.switchChat('group_${window.currentClassId}')" class="p-3 px-5 cursor-pointer flex items-center gap-4 transition-all border-b border-gray-100 dark:border-gray-800 group ${groupActive ? 'active-chat-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}">
                        <div class="w-10 h-10 bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 rounded-full flex items-center justify-center p-2 relative">
                            ${(rt.eagleIcon || '')}
                            <span id="dot-group_${window.currentClassId}" class="absolute top-0 right-0 w-2.5 h-2.5 bg-[#007AFF] border-2 border-white dark:border-[#1C1C1E] rounded-full ${window.AppModules.Notify.unreadSet.has('group_' + window.currentClassId) ? '' : 'hidden'}"></span>
                        </div>
                        <div class="flex-1">
                            <div class="font-bold text-base text-black dark:text-white">${window.escapeHTML(c.name)}</div>
                            <div class="text-xs text-gray-400">By ${window.escapeHTML(teacher?.name || 'Teacher')}</div>
                        </div>
                    </div>
                    <div class="p-2.5 px-5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50/20 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 select-none">Students (${students.length})</div>
                `;

                const studentData = await Promise.all(students.map(async uid => {
                    const data = await this._fetchUser(uid);
                    return data ? { ...data, id: uid } : null;
                }));
                const canEdit = (window.AppModules.User.isAdmin() || c.teacherId === currentUser.id);

                html += studentData.map(u => {
                    if (!u) return '';
                    const isActive = activeTargetId === u.id;
                    let badge = '';
                    const isAdminUser = u.role === 'admin' || u.email === window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL;
                    const isTeacherUser = u.role === 'teacher' || (u.email && u.email.endsWith('@hcpss.org'));
                    if (isAdminUser) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                    else if (isTeacherUser) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';
                    return `
                        <div id="item-${u.id}" class="flex items-center transition-all border-b border-gray-100 dark:border-gray-800 group relative ${isActive ? 'active-chat-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}">
                            <div onclick="window.switchChat('${u.id}')" class="flex flex-1 items-center gap-4 cursor-pointer p-3 px-5">
                                <div class="flex flex-col overflow-hidden">
                                    <div class="font-bold text-sm text-black dark:text-white flex items-center">
                                        ${window.escapeHTML(u.name)} ${u.id === currentUser.id ? '<span class="text-[10px] text-gray-400 font-normal ml-1">(You)</span>' : ''}
                                    </div>
                                    <div class="text-xs text-gray-400 truncate flex items-baseline">${window.escapeHTML(u.email || u.id)}${badge}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 pr-5">
                                <span id="dot-${u.id}" class="w-2.5 h-2.5 bg-[#007AFF] rounded-full ${window.AppModules.Notify.isUnread(u.id) ? '' : 'hidden'}"></span>
                            </div>
                            ${canEdit && u.id !== c.teacherId ? `
                                <button onclick="removeStudentFromClass('${window.currentClassId}', '${u.id}', '${window.escapeHTML(u.name)}')" class="opacity-0 group-hover:opacity-100 p-2 mr-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from class">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('');

                if (window.sidebarMode !== 'class' || window.currentClassId !== classId) return;
                subList.innerHTML = html;
                if (stagger) this._staggerRows(subList);
            } catch (e) {
                console.error(e);
                if (window.sidebarMode !== 'class' || window.currentClassId !== classId) return;
                container.dataset.view = '';
                const failList = container.querySelector('#sidebarSubList');
                if (failList) failList.innerHTML = this._errorHtml('Failed to load class.');
            }
        })();
    },

    renderClassLevel1(container) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            // The Level 1 list DOM is reused across tabs and the Recently
            // Joined entry also carries data-class-id, so "already showing
            // classes" must come from the paint marker, not from rows alone.
            const hadRows = container.dataset.listMode === 'class' && !!container.querySelector('[data-class-id]');
            const loadingTimer = hadRows ? null : setTimeout(() => {
                if (window.sidebarMode === 'class') container.innerHTML = this._loadingHtml('Loading classes...');
            }, 100);
            try {
                const snap = await this._fetch(rt.ref(rt.db, 'classes'));
                if (window.sidebarMode !== 'class') return;
                const allClasses = snap.val() || {};
                const myClasses = Object.keys(allClasses)
                    .map(id => ({ id, ...allClasses[id] }))
                    .filter(c => c.teacherId === currentUser.id || (c.students && c.students[currentUser.id]));

                const wrapper = document.createElement('div');

                if ((window.AppModules.User.isTeacher() || window.AppModules.User.isAdmin())) {
                    const createBtn = document.createElement('div');
                    createBtn.className = 'p-4 px-6 cursor-pointer flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all group';
                    createBtn.onclick = () => window.addNewClass();
                    createBtn.innerHTML = `
                        <div class="w-10 h-10 bg-[#007AFF]/10 rounded-xl flex items-center justify-center text-[#007AFF]">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        </div>
                        <div>
                            <div class="font-bold text-base text-[#007AFF]">Create New Class</div>
                            <div class="text-xs text-gray-400 mt-0.5">Set up a new roster and group chat</div>
                        </div>
                    `;
                    wrapper.appendChild(createBtn);
                }

                if (myClasses.length === 0) {
                    const noClass = document.createElement('div');
                    noClass.className = 'p-10 text-center text-gray-400 text-sm font-medium';
                    noClass.innerText = 'You are not enrolled in any classes yet.';
                    wrapper.appendChild(noClass);
                } else {
                    myClasses.forEach(c => {
                        window.cnCache[c.id] = c.name;
                        const escName = window.escapeHTML(c.name);
                        const item = document.createElement('div');
                        item.className = 'p-4 px-6 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all group';
                        item.dataset.classId = c.id;
                        item.onclick = event => {
                            this._armFlyFromRow(item, c, event);
                            window.currentClassId = c.id;
                            AppModules.Sidebar.renderSidebar();
                            if (window.innerWidth >= 800) window.switchChat('group_' + c.id);
                        };
                        item.innerHTML = `
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 rounded-xl flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                                </div>
                                <div>
                                    <div data-fly-name${this._rowHandoffId === c.id ? ' style="visibility: hidden"' : ''} class="font-bold text-base text-black dark:text-white leading-tight">${escName}</div>
                                    <div class="text-xs text-gray-400 mt-0.5">Click to view members</div>
                                </div>
                            </div>
                        `;
                        wrapper.appendChild(item);
                    });
                }

                container.replaceChildren(wrapper);
                window._isPopNav = false;
            } catch (err) {
                console.error('renderClassLevel1 error:', err);
                if (window.sidebarMode !== 'class') return;
                container.innerHTML = this._errorHtml('Failed to load classes.');
            } finally {
                if (loadingTimer) clearTimeout(loadingTimer);
            }
        })();
    },

    renderRecentlyJoinedLevel2(container, isTabSwitch = false) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            const stagger = this._rowsToStagger;
            this._rowsToStagger = false;
            try {
                if (container.dataset.view !== 'recent' || !container.querySelector('#sidebarSubList')) {
                    container.dataset.view = 'recent';
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E]">
                            <div id="sidebarSubList" class="flex-1 overflow-y-auto pb-28 lg:pb-4">
                                <div class="p-4 space-y-4 animate-pulse">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                            <div class="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                </div>
                                ${this._loadingHtml('Loading...')}
                            </div>
                        </div>
                    `;
                }

                // Back + 'New Members' live in the shared bar; this panel has no actions.
                this._renderBarActions(null);

                const subList = container.querySelector('#sidebarSubList');
                const recentSnap = await this._fetch(rt.query(rt.ref(rt.db, 'users'), rt.orderByKey(), rt.limitToLast(20)));
                if (window.sidebarMode !== 'recent_joined') return;
                if (recentSnap.exists()) {
                    subList.innerHTML = '';
                    const users = recentSnap.val();
                    const sortedIds = Object.keys(users).reverse();

                    sortedIds.forEach(id => {
                        if (id === currentUser.id) return;
                        const u = users[id];
                        if (!window.ALL_USERS[id]) window.ALL_USERS[id] = u;

                        let badge = '';
                        const isAdminUser = u.role === 'admin' || u.email === window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL;
                        const isTeacherUser = u.role === 'teacher' || (u.email && u.email.endsWith('@hcpss.org'));

                        if (isAdminUser) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                        else if (isTeacherUser) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';

                        const div = document.createElement('div');
                        div.className = 'p-3 pl-5 cursor-pointer flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group';
                        div.onclick = () => window.switchChat(id);
                        div.innerHTML = `
                            <div class="flex flex-col overflow-hidden">
                                <span class="font-bold text-sm text-black dark:text-white truncate flex items-center">${window.escapeHTML(u.name || id)}</span>
                                <span class="text-xs text-gray-400 truncate flex items-baseline">${window.escapeHTML(u.email || id)}${badge}</span>
                            </div>
                        `;
                        subList.appendChild(div);
                    });
                    if (stagger) this._staggerRows(subList);
                }
            } catch (err) {
                console.error('renderRecentlyJoinedLevel2 error:', err);
                if (window.sidebarMode !== 'recent_joined') return;
                container.dataset.view = '';
                const failList = container.querySelector('#sidebarSubList');
                const msg = this._errorHtml('Failed to load new members.');
                if (failList) failList.innerHTML = msg;
                else container.innerHTML = msg;
            }
        })();
    },

    renderUserSidebarItems(subList) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!subList || !rt.db || !currentUser) return undefined;

        return (async () => {
            // recent_joined pre-fills Level 1 as 'recent' and restores the
            // real mode before this render finishes, so compare a derived
            // mode; also bail out of painting if the user switched tabs.
            const currentListMode = () => window.sidebarMode === 'recent_joined' ? 'recent' : window.sidebarMode;
            const listMode = currentListMode();
            const hadListItems = !!subList.querySelector('div[id^="item-"]');
            const canShowDelayedLoading = !hadListItems;
            let loadingShown = false;
            if (this._subListLoadingTimer) {
                clearTimeout(this._subListLoadingTimer);
                this._subListLoadingTimer = null;
            }
            if (canShowDelayedLoading) {
                this._subListLoadingTimer = setTimeout(() => {
                    if (currentListMode() !== listMode) return;
                    loadingShown = true;
                    subList.innerHTML = `
                        <div class="h-full flex items-center justify-center">
                            <div class="flex flex-col items-center gap-2 text-gray-400">
                                <div class="sidebar-spinner"></div>
                                <span class="text-xs font-medium">Loading chats...</span>
                            </div>
                        </div>
                    `;
                }, 100);
            }
            try {
                const chatSnap = await this._fetch(rt.ref(rt.db, `user_chats/${currentUser.id.toLowerCase()}`));
                const chatMap = chatSnap.val() || {};
                let chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

                if (Object.keys(chatMap).length === 0) {
                    try {
                        const recentSnap = await this._fetch(rt.query(rt.ref(rt.db, 'users'), rt.orderByKey(), rt.limitToLast(20)));
                        if (recentSnap.exists()) {
                            const recents = recentSnap.val();
                            Object.keys(recents).forEach(rid => {
                                if (rid !== currentUser.id && !chatIds.includes(rid)) {
                                    chatIds.push(rid);
                                    if (!window.ALL_USERS[rid]) window.ALL_USERS[rid] = recents[rid];
                                }
                            });
                        }
                    } catch (e) { }
                }

                const validIds = [];
                await Promise.all(chatIds.map(async id => {
                    if (id.startsWith('group_')) {
                        validIds.push(id);
                        return;
                    }
                    if (rt.isExtensionTargetId && rt.isExtensionTargetId(id)) {
                        validIds.push(id);
                        return;
                    }
                    let u = window.ALL_USERS[id];
                    if (!u) u = await this._fetchUser(id);
                    if (u && u.name) validIds.push(id);
                }));

                let sortedIds = [];
                if (listMode === 'recent') {
                    sortedIds = validIds.sort((a, b) => (chatMap[b] || 0) - (chatMap[a] || 0)).slice(0, 50);
                } else {
                    sortedIds = validIds.sort((a, b) => {
                        if (a.startsWith('group_') && !b.startsWith('group_')) return -1;
                        if (!a.startsWith('group_') && b.startsWith('group_')) return 1;
                        const nameA = (a.startsWith('group_') ? 'Group' : (window.ALL_USERS[a]?.name || a)).toLowerCase();
                        const nameB = (b.startsWith('group_') ? 'Group' : (window.ALL_USERS[b]?.name || b)).toLowerCase();
                        return nameA.localeCompare(nameB);
                    }).slice(0, 50);
                }

                const fragment = document.createDocumentFragment();

            if (listMode === 'recent') {
                const entry = document.createElement('div');
                entry.className = 'p-4 px-6 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group hover:bg-black/5 dark:hover:bg-white/5';
                entry.dataset.classId = 'recent_joined';
                entry.onclick = event => {
                    this._armFlyFromRow(entry, { id: 'recent_joined', name: 'New Members', echo: 'Recently Joined' }, event);
                    window.sidebarMode = 'recent_joined';
                    AppModules.Sidebar.renderSidebar();
                };
                entry.innerHTML = `
                    <div class="flex items-center gap-4 flex-1 overflow-hidden">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-black dark:text-white bg-[#007AFF]/10 dark:bg-[#0A84FF]/10">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <div class="flex flex-col overflow-hidden">
                            <span data-fly-name${this._rowHandoffId === 'recent_joined' ? ' style="visibility: hidden"' : ''} class="font-bold text-base text-black dark:text-white leading-tight truncate">Recently Joined</span>
                            <span class="text-xs text-gray-400 mt-0.5 truncate">Meet new community members</span>
                        </div>
                    </div>
                `;
                fragment.appendChild(entry);
            }

                const activeTargetId = rt.getActiveTargetId ? rt.getActiveTargetId() : null;
                for (const id of sortedIds) {
                if (id.toLowerCase() === currentUser.id.toLowerCase()) continue;
                if (!id.startsWith('group_') && (id.includes('_gmail_') || id.includes('_inst_'))) continue;

                let displayName = id;
                let displayEmail = id;
                let avatarHtml = '';
                let badge = '';

                if (id.startsWith('group_')) {
                    const classId = id.replace('group_', '');
                    const isDisbanded = window.isSyncDone && !(AppModules.Sync.existingClassIds && AppModules.Sync.existingClassIds[classId]);
                    const isParticipant = window.sidebarClasses[classId];

                    displayName = window.cnCache[classId] || 'Class Group Chat';

                    if (isDisbanded) displayEmail = 'Class disbanded';
                    else if (window.isSyncDone && !isParticipant) displayEmail = 'You have been removed from this chat';
                    else displayEmail = window.ctCache[classId] || 'Multi-person conversation';

                    const bgClass = isDisbanded || (window.isSyncDone && !isParticipant) ? 'bg-gray-100 dark:bg-white/10' : 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/10';
                    const iconToUse = isDisbanded || (window.isSyncDone && !isParticipant) ? (rt.eagleIconBw || '') : (rt.eagleIcon || '');
                    avatarHtml = `<div class="w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center p-2">${iconToUse}</div>`;
                } else {
                    const user = window.ALL_USERS[id];
                    if (rt.isExtensionTargetId && rt.isExtensionTargetId(id)) {
                        const extName = (rt.extensionIdFromTarget ? rt.extensionIdFromTarget(id) : id).replace(/_/g, ' ');
                        displayName = user?.name || extName.replace(/\b\w/g, c => c.toUpperCase());
                        displayEmail = 'Notification from Extension Tool';
                        avatarHtml = `
                            <div class="w-10 h-10 rounded-full flex items-center justify-center p-2 text-black dark:text-white bg-[#007AFF]/10 dark:bg-[#0A84FF]/10">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                </svg>
                            </div>
                        `;
                    } else {
                        displayName = user?.name || id;
                        displayEmail = user?.email || id;
                    }
 
                    const isAdminUser = user ? (user.role === 'admin' || user.email === window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL) : false;
                    const isTeacherUser = user ? (user.role === 'teacher' || (user.email && user.email.endsWith('@hcpss.org'))) : false;
 
                    if (user && isAdminUser) badge = ' <span class="text-[10px] text-red-500 font-black ml-1 uppercase">Admin</span>';
                    else if (user && isTeacherUser) badge = ' <span class="text-[10px] text-[#007AFF] font-black ml-1 uppercase">Teacher</span>';
                }
 
                const isActive = activeTargetId === id;
                const div = document.createElement('div');
                div.id = `item-${id}`;
                const isGroup = id.startsWith('group_');
                div.className = isGroup
                    ? `p-4 px-6 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group ${isActive ? 'active-chat-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}`
                    : `p-3 pl-5 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group ${isActive ? 'active-chat-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}`;
                div.style.paddingRight = '60px';
                
                let touchTimeout = null;
                let isLongPress = false;

                div.addEventListener('touchstart', () => {
                    isLongPress = false;
                    touchTimeout = setTimeout(() => {
                        isLongPress = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        if (window.deleteChatRecord) {
                            window.deleteChatRecord(id);
                        }
                    }, 700);
                }, { passive: true });

                div.addEventListener('touchend', () => {
                    if (touchTimeout) {
                        clearTimeout(touchTimeout);
                        touchTimeout = null;
                    }
                });

                div.addEventListener('touchmove', () => {
                    if (touchTimeout) {
                        clearTimeout(touchTimeout);
                        touchTimeout = null;
                    }
                }, { passive: true });

                div.onclick = () => {
                    if (isLongPress) {
                        isLongPress = false;
                        return;
                    }
                    if (rt.isExtensionTargetId && rt.isExtensionTargetId(id)) {
                        window.openExtensionNotificationTarget(id);
                    } else {
                        window.switchChat(id);
                    }
                };
 
                const gapClass = isGroup ? 'gap-4' : 'gap-3';
                const titleTextSize = isGroup ? 'text-base leading-tight' : 'text-sm';
                const subtitleMargin = isGroup ? 'mt-0.5' : '';
 
                div.innerHTML = `
                    <div class="flex items-center ${gapClass} flex-1 overflow-hidden">
                        ${avatarHtml}
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-bold ${titleTextSize} text-black dark:text-white truncate flex items-center">${window.escapeHTML(displayName)}</span>
                            <span class="text-xs text-gray-400 ${subtitleMargin} truncate flex items-baseline">${window.escapeHTML(displayEmail)}${badge}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="dot-${id}" class="w-2 h-2 bg-[#007AFF] rounded-full ${window.AppModules.Notify.isUnread(id) ? '' : 'hidden'}"></span>
                        <button onclick="event.stopPropagation(); deleteChatRecord('${id}')" class="opacity-0 group-hover:opacity-60 p-2 text-gray-400 hover:text-red-500 transition-all cursor-pointer pointer-events-none group-hover:pointer-events-auto" title="Remove Chat">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                `;
                    fragment.appendChild(div);
                }
                if (this._subListLoadingTimer) {
                    clearTimeout(this._subListLoadingTimer);
                    this._subListLoadingTimer = null;
                }
                if (currentListMode() !== listMode) return;
                subList.innerHTML = '';
                subList.appendChild(fragment);
            } catch (err) {
                if (this._subListLoadingTimer) {
                    clearTimeout(this._subListLoadingTimer);
                    this._subListLoadingTimer = null;
                }
                console.error('renderUserSidebarItems error:', err);
                if (currentListMode() !== listMode) return;
                if (!hadListItems || loadingShown) {
                    subList.innerHTML = '<div class="h-full min-h-[120px] flex items-center justify-center text-gray-400 text-sm">Unable to load chats</div>';
                }
            }
        })();
    },

    openStudentSelector(classId) {
        const rt = this._runtime;
        if (!rt.db) return undefined;
        return (async () => {
            let _modalTimer = null;
            const classSnap = await rt.get(rt.ref(rt.db, `classes/${classId}`));
            if (!classSnap.exists()) return;
            const classData = classSnap.val();
            const currentStudents = classData.students || {};

            const usersSnap = await rt.get(rt.ref(rt.db, 'users'));
            const allUsers = usersSnap.val() || {};
            const userList = Object.keys(allUsers)
                .filter(uid => uid !== classData.teacherId)
                .map(uid => ({ id: uid, ...allUsers[uid] }))
                .sort((a, b) => a.name.localeCompare(b.name));

            let selectedIds = new Set(Object.keys(currentStudents));

            const registry = window.AppModules && window.AppModules.Extension && window.AppModules.Extension.getRegistry ? window.AppModules.Extension.getRegistry() : {};
            const registryKeys = Object.keys(registry);

            const LEGACY_ALIASES = ['calc_volume_3d', 'independent_research', 'selection_logic', 'grade_calc'];
            const ALIAS_MAP = {
                calc_volume_3d: 'bc_volume_3d_present',
                independent_research: 'ir_navigator',
                selection_logic: 'selection_logic_visualizer',
                grade_calc: 'grade_calculator'
            };

            let extensionsState = {};
            registryKeys.forEach(eid => {
                if (LEGACY_ALIASES.includes(eid)) return;
                let isSelected = false;
                if (classData.extensions) {
                    if (classData.extensions[eid] !== undefined) {
                        isSelected = !!classData.extensions[eid];
                    } else {
                        const alias = Object.keys(ALIAS_MAP).find(k => ALIAS_MAP[k] === eid);
                        if (alias && classData.extensions[alias] !== undefined) isSelected = !!classData.extensions[alias];
                    }
                }
                extensionsState[eid] = isSelected;
            });

            const renderSelectorList = (filter = '') => {
                const filtered = userList.filter(u =>
                    u.name.toLowerCase().includes(filter.toLowerCase()) ||
                    (u.email || '').toLowerCase().includes(filter.toLowerCase())
                );
                return filtered.map(u => `
                    <div class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div class="flex flex-col overflow-hidden mr-4">
                            <span class="font-bold text-sm text-black dark:text-white truncate">${window.escapeHTML(u.name)}</span>
                            <span class="text-xs text-gray-400 truncate">${window.escapeHTML(u.email || u.id)}</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" ${selectedIds.has(u.id) ? 'checked' : ''} onchange="toggleStudentSelection('${u.id}', this.checked)">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#007AFF]"></div>
                        </label>
                    </div>
                `).join('');
            };

            window.toggleStudentSelection = (uid, isChecked) => {
                if (isChecked) selectedIds.add(uid);
                else selectedIds.delete(uid);
            };

            window.toggleExtensionSelection = (eid, isChecked) => {
                extensionsState[eid] = !!isChecked;
            };

            const renderExtensionsList = (filter = '') => {
                const termLower = filter.toLowerCase().trim();
                const filteredKeys = registryKeys.filter(eid => {
                    if (LEGACY_ALIASES.includes(eid)) return false;
                    const item = registry[eid];
                    if (!item) return false;
                    return item.title.toLowerCase().includes(termLower) || (item.category || '').toLowerCase().includes(termLower);
                });
                if (filteredKeys.length === 0) return '<div class="p-4 text-center text-xs text-gray-400">No extensions found</div>';

                return filteredKeys.map(eid => {
                    const regItem = registry[eid];
                    const isSelected = extensionsState[eid];
                    return `
                        <div class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: rgba(0, 122, 255, 0.10) !important; color: #007AFF !important;">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span class="font-bold text-sm text-black dark:text-white">${window.escapeHTML(regItem.title)}</span>
                                    <span class="text-[10px] text-gray-400 uppercase tracking-tight">${window.escapeHTML(regItem.category || 'Extension Tool')}</span>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" ${isSelected ? 'checked' : ''} onchange="toggleExtensionSelection('${eid}', this.checked)">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#007AFF]"></div>
                            </label>
                        </div>
                    `;
                }).join('');
            };

            const { modal, title: tEl, body: bEl, confirm: confirmBtn, cancel: cancelBtn } = window.AppModules.Modal._getEls();
            tEl.innerText = 'Edit Class';
            bEl.innerHTML = `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Class Name</label>
                        <input type="text" id="editClassName" value="${window.escapeHTML(classData.name)}" placeholder="Enter class name..." class="w-full mt-1 p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Manage Extensions</label>
                        <div class="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-black/20 flex flex-col mt-1">
                            <div class="p-2 border-b border-gray-100 dark:border-gray-800">
                                <input type="text" id="extensionSearch" placeholder="Search extensions..." class="w-full p-2.5 px-3.5 bg-gray-100/70 dark:bg-black/50 text-sm rounded-xl border border-gray-200/50 dark:border-gray-800/80 outline-none focus:border-[#007AFF] transition-all">
                            </div>
                            <div id="extensionList" class="max-h-[25vh] overflow-y-auto custom-scrollbar">${renderExtensionsList()}</div>
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Manage Students</label>
                        <div class="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-black/20 flex flex-col mt-1">
                            <div class="p-2 border-b border-gray-100 dark:border-gray-800">
                                <input type="text" id="selectorSearch" placeholder="Search by name or email..." class="w-full p-2.5 px-3.5 bg-gray-100/70 dark:bg-black/50 text-sm rounded-xl border border-gray-200/50 dark:border-gray-800/80 outline-none focus:border-[#007AFF] transition-all">
                            </div>
                            <div id="selectorList" class="max-h-[25vh] overflow-y-auto custom-scrollbar">${renderSelectorList()}</div>
                        </div>
                    </div>
                </div>
            `;

            cancelBtn.classList.remove('hidden');
            cancelBtn.innerText = 'Cancel';
            confirmBtn.innerText = 'Save Changes';

            const nameInput = bEl.querySelector('#editClassName');
            const searchInput = bEl.querySelector('#selectorSearch');
            const listContainer = bEl.querySelector('#selectorList');
            searchInput.oninput = (e) => { listContainer.innerHTML = renderSelectorList(e.target.value); };

            const extSearchInput = bEl.querySelector('#extensionSearch');
            const extListContainer = bEl.querySelector('#extensionList');
            extSearchInput.oninput = (e) => { extListContainer.innerHTML = renderExtensionsList(e.target.value); };

            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);

            return new Promise(resolve => {
                const cleanup = () => {
                    confirmBtn.onclick = null;
                    cancelBtn.onclick = null;
                    delete window.toggleStudentSelection;
                    delete window.toggleExtensionSelection;
                };

                confirmBtn.onclick = async () => {
                    const newName = nameInput.value.trim();
                    if (!newName) { window.AppModules.Modal.alert('Required', 'Please enter a class name.'); return; }
                    modal.classList.add('opacity-0');
                    _modalTimer = setTimeout(() => {
                        modal.classList.add('hidden');
                        _modalTimer = null;
                    }, 300);

                    const newStudents = {};
                    selectedIds.forEach(id => { newStudents[id] = true; });

                    try {
                        await rt.update(rt.ref(rt.db, `classes/${classId}`), {
                            name: newName,
                            students: newStudents,
                            extensions: extensionsState
                        });
                        this.renderSidebar();
                    } catch (e) {
                        window.AppModules.Modal.alert('Error', 'Failed to update class: ' + e.message);
                    }
                    cleanup();
                    resolve(true);
                };

                cancelBtn.onclick = () => {
                    modal.classList.add('opacity-0');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                    cleanup();
                    resolve(false);
                };
            });
        })();
    },

    _delegate(name, args) {
        const fn = window[name];
        if (typeof fn === 'function' && fn !== this[name]) return fn(...args);
        return undefined;
    }
};

window.setupCustomScrollbar = function(element) {
    if (!element) return;
    const parent = element.parentElement;
    if (!parent) return;

    let scrollbarTrack = parent.querySelector('.custom-scrollbar-track');
    if (!scrollbarTrack) {
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        scrollbarTrack = document.createElement('div');
        scrollbarTrack.className = 'custom-scrollbar-track absolute right-0 w-1 pointer-events-auto z-50';
        scrollbarTrack.innerHTML = '<div class="custom-scrollbar-thumb bg-[#787880]/10 dark:bg-white/5 rounded-full w-[4px] absolute right-[0px] opacity-0 transition-all duration-300 ease-out cursor-default pointer-events-auto" style="height: 0px; top: 0px;"></div>';
        parent.appendChild(scrollbarTrack);
    }

    const thumb = scrollbarTrack.querySelector('.custom-scrollbar-thumb');

    const update = (disableTransition = false) => {
        const clientHeight = element.clientHeight;
        const scrollHeight = element.scrollHeight;
        const scrollTop = element.scrollTop;

        // Position track to match element's offsetTop and clientHeight
        scrollbarTrack.style.top = `${element.offsetTop}px`;
        scrollbarTrack.style.height = `${clientHeight}px`;

        if (scrollHeight <= clientHeight) {
            thumb.style.height = '0px';
            thumb.style.opacity = '0';
            return;
        }

        const thumbHeight = Math.max(15, (clientHeight / scrollHeight) * clientHeight);
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - thumbHeight;
        const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

        if (disableTransition) {
            thumb.style.transition = 'none';
        } else {
            thumb.style.transition = 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out';
        }

        thumb.style.height = `${thumbHeight}px`;
        thumb.style.top = `${thumbTop}px`;
        thumb.style.opacity = '1';

        if (disableTransition) {
            void thumb.offsetHeight;
        }
    };

    // Make thumb draggable to allow mouse drag scrolling
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    thumb.onmousedown = function(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        scrollbarTrack.classList.add('is-dragging');
        thumb.classList.add('is-dragging');
        startY = e.clientY;
        startScrollTop = element.scrollTop;

        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent) => {
            if (!isDragging) return;
            const deltaY = moveEvent.clientY - startY;
            const clientHeight = element.clientHeight;
            const scrollHeight = element.scrollHeight;
            const thumbHeight = Math.max(15, (clientHeight / scrollHeight) * clientHeight);

            const maxScrollTop = scrollHeight - clientHeight;
            const maxThumbTop = clientHeight - thumbHeight;

            if (maxThumbTop > 0) {
                const scrollDelta = (deltaY / maxThumbTop) * maxScrollTop;
                element.scrollTop = startScrollTop + scrollDelta;
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            scrollbarTrack.classList.remove('is-dragging');
            thumb.classList.remove('is-dragging');
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    element.removeEventListener('scroll', element._customScrollHandler);
    element._customScrollHandler = () => {
        if (element._isProgrammaticScroll) {
            update(false);
        } else {
            update(true);
        }
    };
    element.addEventListener('scroll', element._customScrollHandler);

    if (element._customObserver) {
        element._customObserver.disconnect();
    }
    element._customObserver = new MutationObserver(() => {
        update(false);
    });
    element._customObserver.observe(element, { childList: true, subtree: true, characterData: true });

    if (window.ResizeObserver) {
        if (element._customResizeObserver) {
            element._customResizeObserver.disconnect();
        }
        element._customResizeObserver = new ResizeObserver(() => {
            update(false);
        });
        element._customResizeObserver.observe(element);
    }

    update(false);
};
