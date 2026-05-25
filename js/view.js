/**
 * ==================================================================================
 * 模块名称：ViewModule (视图导航与路由状态机)
 * 目标文件：js/view.js
 * 
 * 【设计哲学】：
 * ViewModule 是全站的“导演”。它不负责数据，只负责“谁该显示、谁该隐藏、动画怎么走”�? * 它建立了一套严格的 Layer Stack (层级堆栈) 机制，确保无论用户打开多少个详情页�? * 物理返回键都能按照“先进后出”的顺序逐一关闭。同时，它通过 App Bridge 协议�? * 将主程序的主题状态实时“泵”给嵌套�?Extension Iframe�? * 
 * 【成员清�?& 使用手册 (�?23 �?】：
 * 
 * 1. get/set currentPanel [兼容性桥接]
 *    - 【功能】：�?state.currentPanel 暴露到顶层�? *    - 【存在理由】：兼容旧代码中大量直接读写 AppView.currentPanel 的逻辑�? * 
 * 2. registerLayer(id, closeFn) [层级管理]
 *    - 【输入】：id (String) - UI 元素 ID；closeFn (Function) - 关闭�?UI 的回调�? *    - 【存在理由】：将新打开�?Overlay 压入堆栈，是返回键拦截的核心�? * 
 * 3. unregisterLayer(id) [层级管理]
 *    - 【输入】：id (String)�? *    - 【存在理由】：�?UI 被关闭时，从堆栈中移除，释放内存并准备解锁滚动�? * 
 * 4. popLayer() [物理退栈]
 *    - 【返回】：Boolean - 是否成功消费了返回事件�? *    - 【存在理由】：处理手机返回键或 ESC 键。取出栈顶的 closeFn 并执行�? * 
 * 5. openOverlay(id, options) [高级滑入逻辑]
 *    - 【输入】：id (String)；options (Object: {animation, zIndex, isExclusive...})�? *    - 【存在理由】：全站最核心�?UI 入口。处理复杂的 CSS 进场动画和层级自动提升�? * 
 * 6. closeOverlay(id, options) [高级退场逻辑]
 *    - 【输入】：id (String)；options (Object)�? *    - 【存在理由】：处理退场动画，并在动画完成后执行注销逻辑�? * 
 * 7. lockScroll(locked) [滚动拦截]
 *    - 【输入】：locked (Boolean)�? *    - 【存在理由】：使用 lockScrollCount 计数器解决多个弹窗重叠时的滚动穿透问题�? * 
 * 8. isMobile() [布局判定]
 *    - 【返回】：Boolean�? *    - 【存在理由】：�?850px 为界限判定是否激活移动端 UI�? * 
 * 9. init() [生命周期]
 *    - 【功能】：初始化视口、主题、侧边栏和导航监听�? * 
 * 10. initNavigation() [初始化辅助]
 *    - 【功能】：挂载全局 AppView 引用并初始化 popLayer 监听�? * 
 * 11. checkViewStatus() [全局调试]
 *    - 【存在理由】：在控制台输入此函数可查看到当前堆栈里有哪些层级没关，排查内存泄漏�? * 
 * 12. initSidebar() [侧边栏初始化]
 *    - 【功能】：从本地存储恢复侧边栏的缩进状态�? * 
 * 13. toggleSidebarPin() [侧边栏交互]
 *    - 【功能】：切换侧边栏锁定状态并同步�?LocalStorage�? * 
 * 14. showSidebar() [导航辅助]
 *    - 【功能】：在移动端一键切回“工�?消息”面板�? * 
 * 15. initViewport() [视口补丁]
 *    - 【存在理由】：解决移动�?100vh 被地址栏遮挡的顽疾，注�?CSS 变量 --vh�? * 
 * 16. initTheme() [主题初始化]
 *    - 【功能】：根据系统偏好或用户选择设置初始深浅色�? * 
 * 17. setDarkMode(isDark, storageMode) [主题控制]
 *    - 【输入】：isDark (Boolean)；storageMode (String)�? *    - 【存在理由】：修改 DOM 样式并同步到 Extension Iframe�? * 
 * 18. toggleDarkMode() [主题快捷键]
 *    - 【功能】：一键反转当前的深浅色模式�? * 
 * 19. showPage(pageId) [顶级路由]
 *    - 【输入】：pageId (String: loginPage/mainPage...)�? *    - 【存在理由】：控制全站大容器的切换（如从登录页进入主页）�? * 
 * 20. showPanel(panelId) [面板导航]
 *    - 【输入】：panelId (String: news/tools/chat)�? *    - 【存在理由】：控制主界面内三栏布局在移动端的显示顺序�? * 
 * 21. switchTab(tab) [平滑导航动画]
 *    - 【功能】：实现移动端底�?Tab 切换时的左右滑入滑出动画�? * 
 * 22. switchLeftTab(tab) [二级导航]
 *    - 【功能】：控制 News 面板内部（News/Tools/More）的平移动画�? * 
 * 23. refreshBottomNav(activeTab) [UI 同步]
 *    - 【功能】：根据当前激活的 Tab 实时重绘底栏 SVG 图标和红点�? * ==================================================================================
 */

export const ViewModule = {
    // 1. 统一常量定义
    CONSTANTS: {
        ANIMATION_DURATION: 380, // 统一动画时长
        Z_INDEX: {
            MODULE: 100,        // 基础模块 (lostFound, marketplace, etc.)
            SETTINGS: 110,      // 设置中心
            SEARCH: 120,        // 搜索建议
            EAGLE_TIME: 150,    // Eagle Time 专属
            ADMIN: 160,         // 管理后台 / 扩展
            LOGIN: 190,         // 登录入口
            NAME_SETUP: 192,    // 姓名设置
            COMPATIBILITY: 195, // 兼容性提示
            LOADING: 200,       // 加载 / 服务条款 / 底部抽屉
            SHEET: 200,         // 底部抽屉 (含 LOADING)
            OVERLAY: 150,       // 默认保底层级
            CONTEXT_MENU: 250,  // 消息长按菜单
            PICKER: 260,        // 转发选择
            FORM: 500,          // 发帖表单 (postPage)
            DETAIL: 510,        // 帖子详情 (最高业务层)
            GALLERY: 3000,      // 图片浏览器
            IMPORT: 4001,       // 批量导入
            CRITICAL: 10000     // 崩溃错误
        }
    },

        // 内部状态
        state: {
        currentPage: 'login',
        currentTab: 'news',
        currentPanel: 'news',
        isSidebarOpen: true,
        isDarkMode: false,
        scrollLockCount: 0,
        isAnimating: false,
        layerStack: [] // { id, closeFn }
    },

    // 兼容性属性桥?(Legacy Property Bridges)
    get currentPanel() { return this.state.currentPanel; },
    set currentPanel(v) { this.state.currentPanel = v; },

    /**
     * [层级管理] registerLayer / unregisterLayer / popLayer
     * 管理所有弹窗、详情页的生命周期，支持物理返回键关?     */
    registerLayer: function (id, closeFn, options = {}) {
        // 1. 检查是否重复注册，如果是，则先移除旧的（以便将其移到最顶层?        
        const index = this.state.layerStack.findIndex(l => l.id === id);
        if (index > -1) {
            this.state.layerStack.splice(index, 1);
        }

        // 2. 压入堆栈（确保当前层级在最顶层?        
        this.state.layerStack.push({ id, closeFn });
        this.lockScroll(true);

        // 核心修复：压入一个历史记录状态，拦截物理返回?        
        if (!options.isBackAction) {
            history.pushState({ layerId: id }, "");
        }

        console.log(`%c[Layer] Registered: ${id}`, 'color: #34C759; font-weight: bold;');
    },

    unregisterLayer: function (id, options = {}) {
        const index = this.state.layerStack.findIndex(l => l.id === id);
        if (index > -1) {
            this.state.layerStack.splice(index, 1);
            this.lockScroll(false);

            // 如果不是因为按下返回键导致的注销，则需要手动清理掉刚才压入的历史记录
            if (!options.isBackAction) {
                if (history.state && history.state.layerId === id) {
                    window._isProgrammaticBack = true;
                    history.back();
                }
            }
            console.log(`[Layer] Unregistered: ${id}`);
        }
    },

    popLayer: function () {
        if (this.state.layerStack.length > 0) {
            const top = this.state.layerStack[this.state.layerStack.length - 1];
            // 执行该层的关闭逻辑，并告知它是来自“返回动作?            
            top.closeFn({ isBackAction: true });
            return true;
        }
        return false;
    },

    /**
     * [覆盖层管理] openOverlay
     * 统一控制详情页、详情面板的打开、动画与层级注册
     * @param {string} id - 元素 ID
     * @param {Object} options - { onOpen, onClose, animation, zIndex, isFullscreen }
     */
    openOverlay: function (id, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;

        const {
            animation = 'slide-in',
            zIndex = this.CONSTANTS.Z_INDEX.OVERLAY,
            onOpen = null,
            onClose = null,
            isFullscreen = true,
            isExclusive = false
        } = options;

        // 1. 识别需要后续清理的后台层级 (排他模式)
        let pendingCleanup = [];
        if (isExclusive) {
            pendingCleanup = [...this.state.layerStack].filter(l => l.id !== id);
        }

        // 2. 更新内容与层?(动态提?z-index 确保滑入时在最顶层)
        if (onOpen) onOpen();

        const topZ = this.state.layerStack.reduce((max, l) => {
            const sel = document.getElementById(l.id);
            const val = sel ? parseInt(sel.style.zIndex || 0) : 0;
            return Math.max(max, val);
        }, 0);

        // 确保新层级比背景任何层都高，但至少满足预?zIndex
        el.style.zIndex = String(Math.max(zIndex, topZ + 1));

        // 3. 执行滑入动画
        const isHidden = el.classList.contains('hidden');
        if (isHidden) {
            if (animation === 'slide-in') el.classList.add('translate-x-full');
            if (animation === 'slide-up') el.classList.add('translate-y-full');

            el.classList.remove('hidden');
            // 触发回流并开始平滑过?            
            void el.offsetWidth;

            setTimeout(() => {
                el.classList.remove('translate-x-full', 'translate-y-full', 'opacity-0');
            }, 50);
        } else {
            // 如果已经在显示了（比如同一?container 切换工具），就不走滑入，直接确保显示
            el.classList.remove('hidden', 'translate-x-full', 'translate-y-full', 'opacity-0');
        }

        if (isFullscreen) document.body.classList.add('is-fullscreen');

        // 4. 注册层级
        this.registerLayer(id, (navOpts = {}) => {
            this.closeOverlay(id, { ...options, ...navOpts });
        }, options);

        // 核心优化：针?Extension Iframe 的“首次握手”同?        
        const iframe = el.querySelector('iframe') || (id === 'extensionOverlay' ? document.getElementById('extensionIframe') : null);
        if (iframe) {
            const syncTheme = () => {
                iframe.contentWindow.postMessage({ type: 'THEME_UPDATE', isDarkMode: this.state.isDarkMode }, '*');
            };
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                syncTheme();
            } else {
                iframe.onload = syncTheme;
            }
        }

        // 5. 核心：动画完成后，再真正关闭之前的层级并杀掉进?        
        if (pendingCleanup.length > 0) {
            setTimeout(() => {
                pendingCleanup.forEach(layer => {
                    // 再次确认新层级依然在栈顶
                    if (this.state.layerStack.some(l => l.id === id)) {
                        this.closeOverlay(layer.id, { animation: 'none', isFullscreen: false });
                    }
                });
            }, this.CONSTANTS.ANIMATION_DURATION + 50);
        }
    },

    /**
     * [覆盖层管理] closeOverlay
     * 统一控制详情页的关闭、动画与层级注销
     */
    closeOverlay: function (id, options = {}) {
        const el = document.getElementById(id);
        if (!el || el.classList.contains('hidden')) return;

        const {
            animation = 'slide-in',
            onClose = null,
            isFullscreen = true
        } = options;

        if (animation === 'none') {
            el.classList.add('hidden');
            el.style.zIndex = '';
            el.classList.remove('translate-x-full', 'translate-y-full', 'opacity-0');
            if (isFullscreen) document.body.classList.remove('is-fullscreen');
            this.unregisterLayer(id);
            if (onClose) onClose();
            return;
        }

        // 触发退出动?        
        if (animation === 'slide-in') el.classList.add('translate-x-full');
        if (animation === 'slide-up') el.classList.add('translate-y-full');

        if (isFullscreen) document.body.classList.remove('is-fullscreen');
        this.unregisterLayer(id, options);

        setTimeout(() => {
            el.classList.add('hidden');
            el.style.zIndex = '';
            el.classList.remove('translate-x-full', 'translate-y-full', 'opacity-0');
            if (onClose) onClose();
        }, this.CONSTANTS.ANIMATION_DURATION);
    },

    /**
     * [滚动管理] lockScroll
     * 锁定/解锁背景滚动，防止移动端滚动穿?     */
    lockScroll: function (locked) {
        if (locked) {
            this.state.scrollLockCount++;
            document.body.classList.add('no-scroll');
        } else {
            this.state.scrollLockCount = Math.max(0, this.state.scrollLockCount - 1);
            if (this.state.scrollLockCount === 0) {
                document.body.classList.remove('no-scroll');
            }
        }
    },

    /**
     * [辅助函数] isMobile
     * 判断当前是否处于移动端布局 (<= 850px)
     */
    isMobile: function () {
        return window.innerWidth <= 850;
    },

    /**
     * [初始化] init
     * 启动视口补丁、主题和侧边栏状?     */
    init: function () {
        this.initViewport();
        this.initTheme();
        this.initSidebar();
        this.initNavigation(); // 启动返回键拦?        
        console.log('ViewModule: Initialized.');
    },

    initNavigation: function () {
        // 兼容性桥?        window.AppView = this;
        window.popLayer = () => this.popLayer();

        if (this._navInitialized) return;
        this._navInitialized = true;

        // 核心监听：拦截浏览器的前进后退信号
        window.addEventListener('popstate', (event) => {
            if (window._isProgrammaticBack) {
                window._isProgrammaticBack = false;
                return;
            }
            // 如果堆栈里有东西，说明用户按返回键是想关闭详情页
            if (this.state.layerStack.length > 0) {
                // 我们手动执行退栈逻辑
                this.popLayer();
            }
        });

        // 暴露全局调试工具
        window.checkViewStatus = () => {
            console.table(this.state.layerStack);
            return {
                stack: this.state.layerStack,
                lockCount: this.state.scrollLockCount,
                currentPage: this.state.currentPage,
                historyState: history.state
            };
        };

        console.log('ViewModule: Navigation Protection Disabled (Hash Removed).');
    },

    /**
     * [侧边栏管理] initSidebar & toggleSidebarPin
     */
    initSidebar: function () {
        const pinned = localStorage.getItem('sidebarPinned');
        if (pinned === 'false') {
            document.body.classList.add('sidebar-collapsed');
            this.state.isSidebarOpen = false;
        } else {
            document.body.classList.remove('sidebar-collapsed');
            this.state.isSidebarOpen = true;
        }
    },

    toggleSidebarPin: function () {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        this.state.isSidebarOpen = !isCollapsed;
        localStorage.setItem('sidebarPinned', isCollapsed ? 'false' : 'true');

        // 侧边栏切换时，触�?resize 以便聊天窗口滚动对齐
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    },

    /**
     * [面板导航] showSidebar
     * 切换到侧边栏面板（联系人列表�?     */
    showSidebar: function () {
        // activeTargetId 的清理仍由业务层处理，这里只�?UI
        this.showPanel('tools');

        if (this.isMobile()) {
            this.refreshBottomNav('messages'); // 侧边栏对应的�?messages 标签
        }

        // 搜索清理逻辑 (如果全局可用)
        if (window.clearSearch) window.clearSearch();
    },

    /**
     * [视口管理] initViewport
     * 解决 100vh 在移动端被工具栏遮挡的问题，以及拦截橡皮筋效�?     */
    initViewport: function () {
        const fixVH = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        window.addEventListener('resize', fixVH);
        fixVH();

        // 拦截 iOS 橡皮筋黑边效�?        
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
    },

    /**
     * [主题管理] initTheme & toggleDarkMode
     */
    initTheme: function () {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // 逻辑：如果选过 dark 或者（选了 system 且系统是 dark）或者（没选过且系统是 dark�?        
        const shouldBeDark = savedTheme === 'dark' ||
            ((savedTheme === 'system' || !savedTheme) && systemPrefersDark);

        this.setDarkMode(shouldBeDark, false);
    },

    setDarkMode: function (isDark, storageMode = null) {
        // storageMode 可以�?'dark', 'light', 'system' �?null
        this.state.isDarkMode = isDark;
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        if (storageMode) {
            localStorage.setItem('theme', storageMode);
        } else if (storageMode === null && arguments.length === 1) {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        // 广播：当主程序全局主题改变时，同步给页面上所有正在运行的插件
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'THEME_UPDATE', isDarkMode: isDark }, '*');
            }
        });
    },

    toggleDarkMode: function () {
        this.setDarkMode(!this.state.isDarkMode);
    },

    /**
     * [页面导航] showPage
     * 控制登录页、主页、服务条款页的切�?     * @param {string} pageId - 'loginPage', 'mainPage', 'tosPage'
     */
    showPage: function (pageId) {
        const pages = ['loginPage', 'mainPage', 'tosPage', 'nameSetupPage'];

        pages.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (id === pageId) {
                el.classList.remove('hidden');
                // 如果进入主页，强制触发一次视口刷�?                
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
     * [面板管理] showPanel (�?AppView.showPanel)
     * 控制主界面内部三个主要区域的显隐
     */
    showPanel: function (panelId) {
        const newsSec = document.getElementById('newsSection');
        const sidePanel = document.getElementById('sidePanel');
        const chatSec = document.getElementById('chatSection');
        const bottomNav = document.getElementById('bottomNavContainer') || document.getElementById('bottomNav');
        const gradientShim = document.querySelector('.bottom-gradient-shim');

        if (!newsSec || !sidePanel || !chatSec) return;

        this.state.currentPanel = panelId;
        const isMobile = window.innerWidth <= 850;

        // Toggle mobile bottom gradient overlay
        if (gradientShim) {
            if (isMobile && panelId !== 'chat') {
                gradientShim.classList.remove('hidden');
            } else {
                gradientShim.classList.add('hidden');
            }
        }

        // Desktop Layout: All flex
        if (!isMobile) {
            newsSec.classList.replace('hidden', 'flex');
            sidePanel.classList.replace('hidden', 'flex');
            chatSec.classList.replace('hidden', 'flex');
            if (bottomNav) bottomNav.classList.add('hidden');
            return;
        }

        // Mobile Layout: Single panel transition with slide animations
        const isCurrentlyOnChat = !chatSec.classList.contains('hidden') && !chatSec.classList.contains('slide-out-right');
        const isTransitioningFromChat = isCurrentlyOnChat && panelId !== 'chat';

        if (isTransitioningFromChat) {
            if (panelId === 'news') {
                newsSec.classList.replace('hidden', 'flex');
                if (bottomNav) bottomNav.classList.remove('hidden');
            } else if (panelId === 'tools' || panelId === 'messages') {
                sidePanel.classList.replace('hidden', 'flex');
                if (bottomNav) bottomNav.classList.remove('hidden');
            }
            chatSec.classList.add('slide-out-right');
            setTimeout(() => {
                if (this.state.currentPanel !== 'chat') {
                    chatSec.classList.replace('flex', 'hidden');
                }
                chatSec.classList.remove('slide-out-right');
            }, 320);
            return;
        }

        const isTransitioningToChat = panelId === 'chat' && !isCurrentlyOnChat;
        if (isTransitioningToChat) {
            const prevPanel = !sidePanel.classList.contains('hidden') ? sidePanel : (!newsSec.classList.contains('hidden') ? newsSec : null);
            
            [newsSec, sidePanel, chatSec].forEach(p => {
                if (p !== prevPanel && p !== chatSec) {
                    p.classList.add('hidden');
                    p.classList.remove('flex', 'slide-in-left', 'slide-in-right');
                }
            });

            chatSec.classList.remove('hidden');
            chatSec.classList.add('flex', 'slide-in-right');
            if (bottomNav) bottomNav.classList.add('hidden');
            if (gradientShim) gradientShim.classList.add('hidden');

            setTimeout(() => {
                if (this.state.currentPanel === 'chat') {
                    if (prevPanel) prevPanel.classList.replace('flex', 'hidden');
                }
                chatSec.classList.remove('slide-in-right');
            }, 320);
            return;
        }

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
            if (bottomNav) bottomNav.classList.add('hidden');
        }
    },

        switchTab: function (tab) {
        if (window.innerWidth >= 1024) return;
        if (this.state.isAnimating) return;

        const newsEl = document.getElementById('newsSection');
        const msgEl = document.getElementById('sidePanel');
        const chatSec = document.getElementById('chatSection');

        if (!newsEl || !msgEl) return;

        const isCurrentlyOnNews = !newsEl.classList.contains('hidden');
        let currentTab = 'messages';
        if (isCurrentlyOnNews) {
            const activeEl = document.querySelector('.head-tab-active');
            currentTab = activeEl ? activeEl.id.replace('headTab', '').toLowerCase() : 'news';
        }

        // normalizedTab removed
        // normalizedTab fallback removed

        if (currentTab === tab) return;

        const isSwitchingWithinNews = (tab === 'news' || tab === 'tools') && (currentTab === 'news' || currentTab === 'tools');
        if (isSwitchingWithinNews) {
            this.switchLeftTab(tab);
            this.refreshBottomNav(tab);
            return;
        }

        this.state.isAnimating = true;
        this.refreshBottomNav(tab);

        // 如果切到 News 面板，同时触发内部的二级标签切换
        if (tab === 'news' || tab === 'tools') {
            this.switchLeftTab(tab);
        }

        if (chatSec) {
            chatSec.classList.add('hidden');
            chatSec.classList.remove('flex');
        }

        const isForward = (tab === 'messages');
        const currentEl = isCurrentlyOnNews ? newsEl : msgEl;
        const targetEl = isCurrentlyOnNews ? msgEl : newsEl;

        // 动画准备
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
            [currentEl, targetEl].forEach(el => {
                el.style.cssText = '';
                el.classList.remove('flex', 'hidden');
            });
            targetEl.classList.add('flex');
            currentEl.classList.add('hidden');
            this.state.isAnimating = false;
        }, 320); // 略微缩短锁定时间，提高响应速度
    },

    /**
     * [左侧标签切换] switchLeftTab (桌面�?新闻区二级切�?
     */
    switchLeftTab: function (tab) {
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
                el.className = "text-2xl font-bold tracking-tight text-black dark:text-white tab-transition leading-none head-tab-active scale-110 origin-bottom";
            } else {
                el.className = "text-2xl font-bold tracking-tight text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 tab-transition leading-none scale-100 origin-bottom mb-0.5";
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

        // 处理新闻子标签显�?       
        const subTabs = document.getElementById('newsSubTabsWrapper');
        const addBtn = document.getElementById('addAnnouncementBtn');
        if (subTabs) {
            if (tab === 'news') {
                subTabs.style.height = '36px'; subTabs.style.opacity = '1'; subTabs.style.marginTop = '0.75rem';
                if (typeof window.toggleNewsTab === 'function') {
                    const rawNewsTab = (window.AppModules && window.AppModules.News && typeof window.AppModules.News.getCurrentNewsTab === 'function')
                        ? (window.AppModules.News.getCurrentNewsTab() || 'school')
                        : 'school';
                    const validTabs = new Set(['school', 'club', 'clubs', 'joint', 'discover', 'events']);
                    const currentNewsTab = validTabs.has(rawNewsTab) ? rawNewsTab : 'school';
                    // Wait one frame so the Hub panel is visible before restoring sub-tab/content state.
                    requestAnimationFrame(() => window.toggleNewsTab(currentNewsTab));
                } else if (addBtn && window.isAppStaff && window.isAppStaff()) {
                    addBtn.classList.remove('hidden');
                }
            } else {
                subTabs.style.height = '0'; subTabs.style.opacity = '0'; subTabs.style.marginTop = '0';
                if (addBtn) addBtn.classList.add('hidden');
            }
        }

        // 修正：内部切换不应触�?showPanel，否则会把容器自身隐藏掉
        // 只有当明确需要切换到独立的消息面板时（桌面端逻辑）才处理
        if (window.innerWidth >= 1024) {
            if (tab === 'more') this.showPanel('messages');
            else this.showPanel('news');
        }
    },

    /**
     * [底栏状态刷新] refreshBottomNav
     */
    refreshBottomNav: function (activeTab) {
        const newsBtn = document.getElementById('tabBtn-news');
        const toolsBtn = document.getElementById('tabBtn-tools');
        const msgBtn = document.getElementById('tabBtn-messages');
        const activePill = document.getElementById('bottomNavActivePill');
        const icons = {
            newsActive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="currentColor" viewBox="0 0 24 24" style="color: #007AFF;"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>`,
            newsInactive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="currentColor" viewBox="0 0 24 24" style="color: #9CA3AF;"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>`,
            toolsActive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #007AFF;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            toolsInactive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #9CA3AF;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            msgActive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="currentColor" viewBox="0 0 24 24" style="color: #007AFF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`,
            msgInactive: `<svg class="w-5 h-5 transition-[color,fill,stroke] duration-150" fill="currentColor" viewBox="0 0 24 24" style="color: #9CA3AF;"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>`
        };

        if (activePill) {
            if (activeTab === 'news') {
                activePill.style.transform = 'translateX(0)';
            } else if (activeTab === 'tools') {
                activePill.style.transform = 'translateX(calc(100% + 6px))';
            } else {
                activePill.style.transform = 'translateX(calc(200% + 12px))';
            }
        }

        if (newsBtn) {
            const active = (activeTab === 'news');
            newsBtn.className = `relative z-10 flex flex-col items-center justify-center flex-1 h-[56px] rounded-full transition-[color,fill,stroke] duration-150 ${active ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-gray-500 dark:text-gray-400'}`;
            newsBtn.innerHTML = `<div class="relative inline-flex mb-1">${active ? icons.newsActive : icons.newsInactive}</div><span class="text-[10px] font-bold tracking-wide" style="color: ${active ? '#007AFF' : '#9CA3AF'}">Hub</span>`;
        }
        if (toolsBtn) {
            const active = (activeTab === 'tools');
            toolsBtn.className = `relative z-10 flex flex-col items-center justify-center flex-1 h-[56px] rounded-full transition-[color,fill,stroke] duration-150 ${active ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-gray-500 dark:text-gray-400'}`;
            toolsBtn.innerHTML = `<div class="relative inline-flex mb-1">${active ? icons.toolsActive : icons.toolsInactive}</div><span class="text-[10px] font-bold tracking-wide" style="color: ${active ? '#007AFF' : '#9CA3AF'}">Tool</span>`;
        }
        if (msgBtn) {
            const active = (activeTab === 'messages');
            msgBtn.className = `relative z-10 flex flex-col items-center justify-center flex-1 h-[56px] rounded-full transition-[color,fill,stroke] duration-150 ${active ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-gray-500 dark:text-gray-400'}`;
            msgBtn.innerHTML = `<div class="relative inline-flex mb-1">${active ? icons.msgActive : icons.msgInactive}<div id="mainUnreadDot" class="hidden absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-[#007AFF] rounded-full border-2 border-white dark:border-[#1C1C1E]"></div></div><span class="text-[10px] font-bold tracking-wide" style="color: ${active ? '#007AFF' : '#9CA3AF'}">Messages</span>`;
        }
    },

    /**
     * Apply dark/light/system theme
     */
    applyTheme: function (mode) {
        if (mode === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDarkMode(isDark, 'system');
        } else {
            this.setDarkMode(mode === 'dark', mode);
        }
        if (typeof window.updateSettingsLabels === 'function') {
            window.updateSettingsLabels();
        }
    },

    /**
     * Toggle settings modal visibility
     */
    toggleSettings: function (view = 'settings', currentUser = null) {
        const modal = document.getElementById('settingsModal');
        const sv = document.getElementById('settingsView');
        const dv = document.getElementById('donationView');
        const title = document.getElementById('settingsModalTitle');
        if (!modal || !sv || !dv || !title) return;

        if (modal.classList.contains('hidden')) {
            if (view === 'settings') {
                sv.classList.remove('hidden');
                dv.classList.add('hidden');
                title.innerText = "Settings";
                if (currentUser && currentUser.name) {
                    const parts = currentUser.name.split(' ');
                    const firstNameEl = document.getElementById('firstNameInput');
                    const lastNameEl = document.getElementById('lastNameInput');
                    if (firstNameEl) firstNameEl.value = parts[0] || '';
                    if (lastNameEl) lastNameEl.value = parts.slice(1).join(' ') || '';
                }
            } else {
                sv.classList.add('hidden');
                dv.classList.remove('hidden');
                title.innerText = "Support Development";
                // Reset QR view to show buttons
                const qrContainer = document.getElementById('donationQRContainer');
                const donationButtons = document.getElementById('donationButtons');
                if (qrContainer) qrContainer.classList.add('hidden');
                if (donationButtons) donationButtons.classList.remove('hidden');
            }
            modal.classList.remove('hidden', 'fade-out');
            modal.classList.add('fade-in');
        } else {
            modal.classList.add('fade-out');
            setTimeout(() => modal.classList.add('hidden'), 250);
        }
    },

    /**
     * Open Donation QR code view
     */
    openDonationQR: function (method, fallbackUrl, donations = {}) {
        const qrContainer = document.getElementById('donationQRContainer');
        const qrImg = document.getElementById('donationQRImg');
        const donationButtons = document.getElementById('donationButtons');
        if (!qrContainer || !qrImg) return;

        qrImg.src = '';
        qrImg.onerror = () => {
            qrImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f9f9fb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23999"%3EQR Code Coming Soon%3C/text%3E%3C/svg%3E';
        };

        qrImg.src = donations[method] || fallbackUrl;
        qrContainer.classList.remove('hidden');
        if (donationButtons) donationButtons.classList.add('hidden');
    },

    /**
     * Close Donation QR view
     */
    closeDonationQR: function () {
        const qrContainer = document.getElementById('donationQRContainer');
        const donationButtons = document.getElementById('donationButtons');
        if (qrContainer) qrContainer.classList.add('hidden');
        if (donationButtons) donationButtons.classList.remove('hidden');
    },

    /**
     * Toggle custom dropdown visibility
     */
    toggleDropdown: function (id, e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const isHidden = dropdown.classList.contains('hidden');

        document.querySelectorAll('.custom-dropdown').forEach(el => {
            if (el.id !== id) {
                el.classList.add('opacity-0', 'scale-95');
                setTimeout(() => { if (el.classList.contains('opacity-0')) el.classList.add('hidden'); }, 200);
            }
        });

        if (isHidden) {
            dropdown.classList.remove('hidden');
            requestAnimationFrame(() => dropdown.classList.remove('opacity-0', 'scale-95'));
        } else {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => { if (dropdown.classList.contains('opacity-0')) dropdown.classList.add('hidden'); }, 200);
        }
    },

    /**
     * Sidebar navigation going back
     */
    goBackToClassList: function () {
        window.currentClassId = null;
        window._isPopNav = true;
        if (AppModules.Sidebar && typeof AppModules.Sidebar.renderSidebar === 'function') {
            AppModules.Sidebar.renderSidebar(true);
        }
    },

    goBackToRecent: function () {
        window.sidebarMode = 'recent';
        window._isPopNav = true;
        if (AppModules.Sidebar && typeof AppModules.Sidebar.renderSidebar === 'function') {
            AppModules.Sidebar.renderSidebar(true);
        }
    }
};
