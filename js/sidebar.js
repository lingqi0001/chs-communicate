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
    _refreshTimer: null,
    _subListLoadingTimer: null,
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
                window.currentClassId = null;
                window._isPopNav = true;
                this.renderSidebar(true);
            }
            return;
        }
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
        document.querySelectorAll('#sidebarList > div').forEach(item => {
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
                        statusEl.innerText = statusText;
                        if (statusText === 'online') {
                            statusEl.classList.add('text-[#007AFF]');
                            statusEl.classList.remove('text-gray-400');
                        } else {
                            statusEl.classList.remove('text-[#007AFF]');
                            statusEl.classList.add('text-gray-400');
                        }
                    }
                }
            }
        }, 60000);
    },

    async _renderShell(isTabSwitch = false) {
        if (this.isRendering()) return;
        const rt = this._runtime;
        const container = document.getElementById('sidebarList');
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !currentUser) return;

        this._isRenderingFlag = true;
        try {
            if (window.sidebarMode === 'class' && window.currentClassId) {
                await this.renderClassLevel2(container, isTabSwitch);
                return;
            }

            if (window.sidebarMode === 'recent_joined') {
                await this.renderRecentlyJoinedLevel2(container, isTabSwitch);
                return;
            }

            if (!container.querySelector('.sidebar-tabs')) {
                container.innerHTML = `
                    <div class="sidebar-tabs flex items-center border-b border-gray-100 dark:border-white/5 h-11 flex-shrink-0">
                        <button data-sidebar-mode="recent" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors relative ${window.sidebarMode === 'recent' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}">
                            Recent
                            <span id="recentTabDot" class="absolute top-2.5 right-4 w-1.5 h-1.5 bg-[#007AFF] rounded-full hidden"></span>
                        </button>
                        <div class="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <button data-sidebar-mode="all" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors ${window.sidebarMode === 'all' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}">Contacts</button>
                        <div class="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <button data-sidebar-mode="class" class="flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors relative ${window.sidebarMode === 'class' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}">
                            Class
                        </button>
                    </div>
                    <div id="sidebarSubList" class="flex-1 overflow-y-auto pb-28 lg:pb-4"></div>
                `;
            } else {
                const btns = container.querySelectorAll('.sidebar-tabs button');
                btns[0].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors relative ${window.sidebarMode === 'recent' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}`;
                btns[1].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors ${window.sidebarMode === 'all' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}`;
                btns[2].className = `flex-1 text-[10px] font-bold uppercase tracking-widest h-full text-center transition-colors relative ${window.sidebarMode === 'class' ? 'text-[#007AFF]' : 'text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}`;
            }
            const tabButtons = container.querySelectorAll('.sidebar-tabs [data-sidebar-mode]');
            tabButtons.forEach(btn => {
                btn.onclick = event => this.switchSidebarTab(btn.dataset.sidebarMode, event);
            });
            const subList = document.getElementById('sidebarSubList');
            if (isTabSwitch || window._isPopNav) subList?.classList.remove('sidebar-pop', 'sidebar-push');

            if (window.sidebarMode === 'class') await this.renderClassLevel1(subList);
            else await this.renderUserSidebarItems(subList);

            if (isTabSwitch || window._isPopNav) {
                void subList.offsetWidth;
                requestAnimationFrame(() => {
                    subList.classList.add('sidebar-pop');
                    window._isPopNav = false;
                });
            }

            if (window.AppModules && window.AppModules.Notify) window.AppModules.Notify.updateUI();
        } catch (err) {
            console.error('renderSidebar error:', err);
            if (typeof this._legacyRawRender === 'function') {
                await this._legacyRawRender(isTabSwitch);
            }
        } finally {
            this._isRenderingFlag = false;
        }
    },

    renderClassLevel2(container, isTabSwitch = false) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            try {
                const checkTitleEl = document.getElementById('sidebarLevel2Title');
                const isAlreadyInLevel2 = checkTitleEl && checkTitleEl.innerText === (window.cnCache[window.currentClassId] || 'Class');

                if (!isAlreadyInLevel2) {
                    const cachedName = window.cnCache[window.currentClassId] || 'Class';
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E] ${isTabSwitch ? '' : 'sidebar-push'}">
                            <div class="flex items-center px-4 h-11 border-b border-gray-100 dark:border-white/5 relative">
                                <button data-sidebar-back="class" class="text-[#007AFF] flex items-center text-sm font-bold z-10">
                                    <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                    Back
                                </button>
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div id="sidebarLevel2Title" class="font-bold text-sm text-black dark:text-white uppercase tracking-widest truncate max-w-[150px] text-center">${window.escapeHTML(cachedName)}</div>
                                </div>
                                <div class="flex-1"></div>
                            </div>
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
                            </div>
                        </div>
                    `;
                }

                const classBackBtn = container.querySelector('button[data-sidebar-back="class"]');
                if (classBackBtn) {
                    classBackBtn.onclick = (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        window.currentClassId = null;
                        window._isPopNav = true;
                        AppModules.Sidebar.renderSidebar(true);
                    };
                }

                const snap = await rt.get(rt.ref(rt.db, `classes/${window.currentClassId}`));
                const c = snap.val();
                if (!c) { window.currentClassId = null; AppModules.Sidebar.renderSidebar(); return; }

                const titleEl = document.getElementById('sidebarLevel2Title');
                if (titleEl) titleEl.innerText = c.name;

                if (window.AppModules.User.isAdmin() || c.teacherId === currentUser.id) {
                    const header = container.querySelector('.relative');
                    if (header && !header.querySelector('.admin-actions')) {
                        const actionDiv = document.createElement('div');
                        actionDiv.className = 'flex items-center gap-3 z-10 admin-actions';
                        actionDiv.innerHTML = `
                            <button onclick="handleDeleteClass('${window.currentClassId}')" class="text-red-500 hover:text-red-600 active:scale-90 transition-all p-1" title="Delete Class">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button onclick="AppModules.Sidebar.openStudentSelector('${window.currentClassId}')" class="text-[#007AFF] text-xs font-bold uppercase tracking-widest">Edit</button>
                        `;
                        header.appendChild(actionDiv);
                    }
                }

                const subList = document.getElementById('sidebarSubList');
                const teacher = await window.fetchUser(c.teacherId);
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
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: rgba(0, 122, 255, 0.10) !important; color: #007AFF !important;">
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
                        <div class="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center p-2 relative">
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
                    const data = await window.fetchUser(uid);
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
                                    <div class="text-xs text-gray-400 truncate flex items-center">${window.escapeHTML(u.email || u.id)}${badge}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 pr-5">
                                <span id="dot-${u.id}" class="w-2.5 h-2.5 bg-[#007AFF] rounded-full ${window.AppModules.Notify.unreadSet.has(u.id) ? '' : 'hidden'}"></span>
                            </div>
                            ${canEdit && u.id !== c.teacherId ? `
                                <button onclick="removeStudentFromClass('${window.currentClassId}', '${u.id}', '${window.escapeHTML(u.name)}')" class="opacity-0 group-hover:opacity-100 p-2 mr-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from class">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('');

                subList.innerHTML = html;
            } catch (e) {
                console.error(e);
            }
        })();
    },

    renderClassLevel1(container) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            try {
                const snap = await rt.get(rt.ref(rt.db, 'classes'));
                const allClasses = snap.val() || {};
                const myClasses = Object.keys(allClasses)
                    .map(id => ({ id, ...allClasses[id] }))
                    .filter(c => c.teacherId === currentUser.id || (c.students && c.students[currentUser.id]));

                container.innerHTML = '';
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
                        item.onclick = () => {
                            window.currentClassId = c.id;
                            AppModules.Sidebar.renderSidebar();
                            if (window.innerWidth >= 1024) window.switchChat('group_' + c.id);
                        };
                        item.innerHTML = `
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 rounded-xl flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                                </div>
                                <div>
                                    <div class="font-bold text-base text-black dark:text-white leading-tight">${escName}</div>
                                    <div class="text-xs text-gray-400 mt-0.5">Click to view members</div>
                                </div>
                            </div>
                        `;
                        wrapper.appendChild(item);
                    });
                }

                container.appendChild(wrapper);
                window._isPopNav = false;
            } catch (err) {
                console.error('renderClassLevel1 error:', err);
                container.innerHTML = '<div class="p-10 text-center text-red-500 text-xs">Failed to load classes.</div>';
            }
        })();
    },

    renderRecentlyJoinedLevel2(container, isTabSwitch = false) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!container || !rt.db || !currentUser) return undefined;
        return (async () => {
            try {
                const existingSubList = document.getElementById('sidebarSubList');
                const isAlreadyInRecentJoined = existingSubList && container.querySelector('.uppercase.tracking-widest')?.innerText.toUpperCase() === 'NEW MEMBERS';

                if (!isAlreadyInRecentJoined) {
                    container.innerHTML = `
                        <div class="flex flex-col h-full bg-white dark:bg-[#1C1C1E] ${isTabSwitch ? '' : 'sidebar-push'}">
                            <div class="flex items-center px-4 h-11 border-b border-gray-100 dark:border-white/5 relative">
                                <button data-sidebar-back="recent" class="text-[#007AFF] flex items-center text-sm font-bold z-10">
                                    <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                    Back
                                </button>
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div class="font-bold text-sm text-black dark:text-white uppercase tracking-widest text-center">New Members</div>
                                </div>
                            </div>
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
                            </div>
                        </div>
                    `;
                }

                const recentBackBtn = container.querySelector('button[data-sidebar-back="recent"]');
                if (recentBackBtn) {
                    recentBackBtn.onclick = (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        window.sidebarMode = 'recent';
                        window._isPopNav = true;
                        AppModules.Sidebar.renderSidebar(true);
                    };
                }

                const subList = document.getElementById('sidebarSubList');
                const recentSnap = await rt.get(rt.query(rt.ref(rt.db, 'users'), rt.orderByKey(), rt.limitToLast(20)));
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
                                <span class="text-xs text-gray-400 truncate flex items-center">${window.escapeHTML(u.email || id)}${badge}</span>
                            </div>
                        `;
                        subList.appendChild(div);
                    });
                }
            } catch (err) {
                console.error('renderRecentlyJoinedLevel2 error:', err);
                container.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">Failed to load new members.</div>';
            }
        })();
    },

    renderUserSidebarItems(subList) {
        const rt = this._runtime;
        const currentUser = rt.getCurrentUser ? rt.getCurrentUser() : null;
        if (!subList || !rt.db || !currentUser) return undefined;

        return (async () => {
            const hadListItems = !!subList.querySelector('div[id^="item-"]');
            const canShowDelayedLoading = !hadListItems;
            let loadingShown = false;
            if (this._subListLoadingTimer) {
                clearTimeout(this._subListLoadingTimer);
                this._subListLoadingTimer = null;
            }
            if (canShowDelayedLoading) {
                this._subListLoadingTimer = setTimeout(() => {
                    loadingShown = true;
                    subList.innerHTML = `
                        <div class="h-full flex items-center justify-center">
                            <div class="flex flex-col items-center gap-2 text-gray-400">
                                <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                                <span class="text-xs font-medium">Loading chats...</span>
                            </div>
                        </div>
                    `;
                }, 100);
            }
            try {
                const chatSnap = await rt.get(rt.ref(rt.db, `user_chats/${currentUser.id.toLowerCase()}`));
                const chatMap = chatSnap.val() || {};
                let chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

                if (Object.keys(chatMap).length === 0) {
                    try {
                        const recentSnap = await rt.get(rt.query(rt.ref(rt.db, 'users'), rt.orderByKey(), rt.limitToLast(20)));
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
                    if (!u) u = await window.fetchUser(id);
                    if (u && u.name) validIds.push(id);
                }));

                let sortedIds = [];
                if (window.sidebarMode === 'recent') {
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

            if (window.sidebarMode === 'recent') {
                const entry = document.createElement('div');
                entry.className = 'p-4 px-6 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors group hover:bg-black/5 dark:hover:bg-white/5';
                entry.onclick = () => { window.sidebarMode = 'recent_joined'; AppModules.Sidebar.renderSidebar(); };
                entry.innerHTML = `
                    <div class="flex items-center gap-4 flex-1 overflow-hidden">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] bg-[#007AFF]/10 dark:bg-[#0A84FF]/10">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-bold text-base text-black dark:text-white leading-tight truncate">Recently Joined</span>
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
                            <div class="w-10 h-10 rounded-full flex items-center justify-center p-2 text-[#007AFF] dark:text-[#0A84FF] bg-[#007AFF]/10 dark:bg-[#0A84FF]/10">
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
                div.onclick = () => (rt.isExtensionTargetId && rt.isExtensionTargetId(id)) ? window.openExtensionNotificationTarget(id) : window.switchChat(id);
 
                const gapClass = isGroup ? 'gap-4' : 'gap-3';
                const titleTextSize = isGroup ? 'text-base leading-tight' : 'text-sm';
                const subtitleMargin = isGroup ? 'mt-0.5' : '';
 
                div.innerHTML = `
                    <div class="flex items-center ${gapClass} flex-1 overflow-hidden">
                        ${avatarHtml}
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-bold ${titleTextSize} text-black dark:text-white truncate flex items-center">${window.escapeHTML(displayName)}</span>
                            <span class="text-xs text-gray-400 ${subtitleMargin} truncate flex items-center">${window.escapeHTML(displayEmail)}${badge}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="dot-${id}" class="w-2 h-2 bg-[#007AFF] rounded-full ${window.AppModules.Notify.unreadSet.has(id) ? '' : 'hidden'}"></span>
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
                subList.innerHTML = '';
                subList.appendChild(fragment);
            } catch (err) {
                if (this._subListLoadingTimer) {
                    clearTimeout(this._subListLoadingTimer);
                    this._subListLoadingTimer = null;
                }
                console.error('renderUserSidebarItems error:', err);
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
