/**
 * js/view.js
 * 视图导航模块 1.0 (View & Navigation Module)
 * [职责] 管理视口补丁、页面切换、主题控制、侧边栏及导航状态。
 */

export const ViewModule = {
    // 内部状态
    state: {
        currentPage: 'login',
        currentTab: 'news',
        currentPanel: 'news', // 同步原本 AppView 的面板状态
        isSidebarOpen: true,
        isDarkMode: false
    },

    // 兼容性属性桥接 (Legacy Property Bridges)
    get currentPanel() { return this.state.currentPanel; },
    set currentPanel(v) { this.state.currentPanel = v; },

    /**
     * [辅助函数] isMobile
     * 判断当前是否处于移动端布局 (<= 850px)
     */
    isMobile: function() {
        return window.innerWidth <= 850;
    },

    /**
     * [初始化] init
     * 启动视口补丁、主题和侧边栏状态
     */
    init: function() {
        this.initViewport();
        this.initTheme();
        this.initSidebar();
        console.log('ViewModule: Initialized.');
    },

    /**
     * [侧边栏管理] initSidebar & toggleSidebarPin
     */
    initSidebar: function() {
        const pinned = localStorage.getItem('sidebarPinned');
        if (pinned === 'false') {
            document.body.classList.add('sidebar-collapsed');
            this.state.isSidebarOpen = false;
        } else {
            document.body.classList.remove('sidebar-collapsed');
            this.state.isSidebarOpen = true;
        }
    },

    toggleSidebarPin: function() {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        this.state.isSidebarOpen = !isCollapsed;
        localStorage.setItem('sidebarPinned', isCollapsed ? 'false' : 'true');
        
        // 侧边栏切换时，触发 resize 以便聊天窗口滚动对齐
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    },

    /**
     * [面板导航] showSidebar
     * 切换到侧边栏面板（联系人列表）
     */
    showSidebar: function() {
        // activeTargetId 的清理仍由业务层处理，这里只管 UI
        this.showPanel('tools');

        if (this.isMobile()) {
            this.refreshBottomNav('messages'); // 侧边栏对应的是 messages 标签
        }
        
        // 搜索清理逻辑 (如果全局可用)
        if (window.clearSearch) window.clearSearch();
    },

    /**
     * [视口管理] initViewport
     * 解决 100vh 在移动端被工具栏遮挡的问题，以及拦截橡皮筋效果
     */
    initViewport: function() {
        const fixVH = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        window.addEventListener('resize', fixVH);
        fixVH();

        // 拦截 iOS 橡皮筋黑边效果
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
    },

    /**
     * [主题管理] initTheme & toggleDarkMode
     */
    initTheme: function() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 逻辑：如果选过 dark 或者（选了 system 且系统是 dark）或者（没选过且系统是 dark）
        const shouldBeDark = savedTheme === 'dark' || 
                           ((savedTheme === 'system' || !savedTheme) && systemPrefersDark);
        
        this.setDarkMode(shouldBeDark, false); 
    },

    setDarkMode: function(isDark, storageMode = null) {
        // storageMode 可以是 'dark', 'light', 'system' 或 null
        this.state.isDarkMode = isDark;
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        if (storageMode) {
            localStorage.setItem('theme', storageMode);
        } else if (storageMode === null && arguments.length === 1) {
            // 如果没传第二个参数，则默认根据 isDark 存 dark/light
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
    },

    toggleDarkMode: function() {
        this.setDarkMode(!this.state.isDarkMode);
    },

    /**
     * [页面导航] showPage
     * 控制登录页、主页、服务条款页的切换
     * @param {string} pageId - 'loginPage', 'mainPage', 'tosPage'
     */
    showPage: function(pageId) {
        const pages = ['loginPage', 'mainPage', 'tosPage', 'nameSetupPage'];
        
        pages.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            if (id === pageId) {
                el.classList.remove('hidden');
                // 如果进入主页，强制触发一次视口刷新
                if (id === 'mainPage') {
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                }
            } else {
                el.classList.add('hidden');
            }
        });
        
        this.state.currentPage = pageId.replace('Page', '');
        console.log(`ViewModule: Switched to page ${this.state.currentPage}`);
    },

    /**
     * [面板管理] showPanel (原 AppView.showPanel)
     * 控制主界面内部三个主要区域的显隐
     */
    showPanel: function(panelId) {
        const newsSec = document.getElementById('newsSection');
        const sidePanel = document.getElementById('sidePanel');
        const chatSec = document.getElementById('chatSection');
        const bottomNav = document.getElementById('bottomNav');

        if (!newsSec || !sidePanel || !chatSec) return;

        this.state.currentPanel = panelId;
        const isMobile = window.innerWidth <= 850;

        // 桌面端布局：全显
        if (!isMobile) {
            newsSec.classList.replace('hidden', 'flex');
            sidePanel.classList.replace('hidden', 'flex');
            chatSec.classList.replace('hidden', 'flex');
            if (bottomNav) bottomNav.classList.add('hidden');
            return;
        }

        // 移动端布局：单面板切换
        [newsSec, sidePanel, chatSec].forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('flex', 'slide-in-left', 'slide-in-right');
        });

        if (panelId === 'news') {
            newsSec.classList.replace('hidden', 'flex');
            if (bottomNav) bottomNav.classList.remove('hidden');
        } else if (panelId === 'tools' || panelId === 'messages') {
            sidePanel.classList.replace('hidden', 'flex');
            if (bottomNav) bottomNav.classList.remove('hidden');
        } else if (panelId === 'chat') {
            chatSec.classList.replace('hidden', 'flex');
            if (bottomNav) bottomNav.classList.add('hidden'); // 聊天时隐藏底栏
        }
    },

    /**
     * [标签页切换] switchTab (移动端底栏)
     */
    switchTab: function(tab) {
        if (window.innerWidth >= 1024) return;

        const newsEl = document.getElementById('newsSection');
        const msgEl = document.getElementById('sidePanel');
        const chatSec = document.getElementById('chatSection');

        const isCurrentlyOnNews = !newsEl.classList.contains('hidden');
        const currentTab = isCurrentlyOnNews ? 'news' : 'messages';

        let normalizedTab = tab;
        if (tab === 'more' || tab === 'tools') normalizedTab = 'news';

        if (currentTab === normalizedTab) {
            if (tab === 'news' || tab === 'more' || tab === 'tools') this.switchLeftTab(tab);
            return;
        }

        // 更新底栏 UI
        this.refreshBottomNav(normalizedTab);
        if (normalizedTab === 'news' || normalizedTab === 'more' || normalizedTab === 'tools') this.switchLeftTab(normalizedTab);

        chatSec.classList.add('hidden');
        chatSec.classList.remove('flex');

        // 动画逻辑
        const isForward = (normalizedTab === 'messages');
        const currentEl = isCurrentlyOnNews ? newsEl : msgEl;
        const targetEl = isCurrentlyOnNews ? msgEl : newsEl;

        currentEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; transform:translateX(0); transition:none; display:flex;`;
        targetEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; z-index:11; transform:translateX(${isForward ? '100%' : '-100%'}); transition:none; display:flex;`;
        targetEl.classList.remove('hidden');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const ease = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                currentEl.style.transition = ease;
                targetEl.style.transition = ease;
                currentEl.style.transform = `translateX(${isForward ? '-100%' : '100%'})`;
                targetEl.style.transform = 'translateX(0)';
            });
        });

        setTimeout(() => {
            [currentEl, targetEl].forEach(el => { el.style.cssText = ''; el.classList.remove('flex'); });
            targetEl.classList.add('flex');
            currentEl.classList.add('hidden');
        }, 350);
    },

    /**
     * [左侧标签切换] switchLeftTab (桌面端/新闻区二级切换)
     */
    switchLeftTab: function(tab) {
        const tabs = ['news', 'tools', 'more'];
        const labels = { 'news': 'headTabNews', 'tools': 'headTabTools', 'more': 'headTabMore' };
        const contents = {
            'news': document.getElementById('newsMainContent'),
            'tools': document.getElementById('toolsMainContent'),
            'more': document.getElementById('moreMainContent')
        };

        const activeEl = document.querySelector('.head-tab-active');
        const currentTab = activeEl ? activeEl.id.replace('headTab', '').toLowerCase() : 'news';
        const targetIndex = tabs.indexOf(tab);

        if (currentTab === tab) return;

        // 更新标题样式
        tabs.forEach(t => {
            const el = document.getElementById(labels[t]);
            if (!el) return;
            if (t === tab) {
                el.className = "text-3xl font-bold tracking-tight text-black dark:text-white transition-all leading-none head-tab-active";
            } else {
                el.className = "text-2xl font-bold tracking-tight text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all leading-none mb-0.5";
            }
        });

        // 内容平移动画
        tabs.forEach((t, idx) => {
            const content = contents[t];
            if (!content) return;
            if (t === tab) {
                content.style.opacity = '1';
                content.style.transform = 'translateX(0)';
                content.style.pointerEvents = 'auto';
                content.style.zIndex = '10';
            } else {
                const offset = (idx < targetIndex) ? '-40px' : '40px';
                content.style.opacity = '0';
                content.style.transform = `translateX(${offset})`;
                content.style.pointerEvents = 'none';
                content.style.zIndex = '0';
            }
        });

        // 处理新闻子标签显隐
        const subTabs = document.getElementById('newsSubTabsWrapper');
        const addBtn = document.getElementById('addAnnouncementBtn');
        if (subTabs) {
            if (tab === 'news') {
                subTabs.style.height = '32px'; subTabs.style.opacity = '1'; subTabs.style.marginTop = '0.75rem';
                if (addBtn && window.isAppStaff && window.isAppStaff()) addBtn.classList.remove('hidden');
            } else {
                subTabs.style.height = '0'; subTabs.style.opacity = '0'; subTabs.style.marginTop = '0';
                if (addBtn) addBtn.classList.add('hidden');
            }
        }

        if (tab !== 'more') this.showPanel(tab === 'news' ? 'news' : 'tools');
        else this.showPanel('messages');
    },

    /**
     * [底栏状态刷新] refreshBottomNav
     */
    refreshBottomNav: function(activeTab) {
        const newsBtn = document.getElementById('tabBtn-news');
        const msgBtn = document.getElementById('tabBtn-messages');
        const icons = {
            newsActive: `<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #007AFF;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 7H20" /></svg>`,
            newsInactive: `<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #9CA3AF;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 7H20" /></svg>`,
            msgActive: `<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24" style="color: #007AFF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`,
            msgInactive: `<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24" style="color: #9CA3AF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`
        };

        if (newsBtn) {
            const active = (activeTab === 'news');
            newsBtn.innerHTML = (active ? icons.newsActive : icons.newsInactive) + `<span class="text-xs font-medium" style="color: ${active ? '#007AFF' : '#9CA3AF'}">News</span>`;
        }
        if (msgBtn) {
            const active = (activeTab === 'messages');
            msgBtn.innerHTML = `<div class="relative">${active ? icons.msgActive : icons.msgInactive}<div id="mainUnreadDot" class="hidden absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#007AFF] rounded-full border-2 border-white dark:border-[#1C1C1E]"></div></div><span class="text-xs font-medium" style="color: ${active ? '#007AFF' : '#9CA3AF'}">Messages</span>`;
        }
    }
};
