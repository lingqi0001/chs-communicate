
        import { CoreModule, ref, push, set, get, update, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey, startAfter, startAt, endAt, limitToFirst, sRef, uploadString, getDownloadURL, deleteObject } from './js/core.js';

        
        import { firebaseConfig, APP_CONSTANTS, LIMITS, SYSTEM_USERS } from './js/config.js';
        import { NotifyModule } from './js/notify_v2.js';
        import { ModalModule } from './js/modal.js';
        import { DBModule, initCloudRefs, localDB, dbReady, initLocalDB, saveMessageLocal, getLocalMessages, saveModulePostLocal, getLocalNews, getLastKey, getLocalModulePosts } from './js/db.js';
        import { UserModule } from './js/user.js';
        import { ViewModule } from './js/view.js';
        import { UIComponents } from './js/ui-components.js';
        import { UIUtils, DateUtils, ImageUtils } from './js/utils.js';
        import { CHANGELOG_CONTENT, TOS_CONTENT } from './js/content.js';
        import { GalleryModule } from './js/gallery.js';
        import { SyncModule } from './js/sync.js';
        import { SidebarModule } from './js/sidebar.js';
        import { ExtensionModule } from './js/extensions.js';
        import { AuthModule } from './js/auth.js';
        import { SecurityModule } from './js/security.js';
        import { SearchModule } from './js/search.js';
        import { createNewsModule } from './js/news.js?v=20260524-3';

        
        console.log('App: Version 2026-05-02-2115 (Latest)');

        
        const { db, auth, storage, googleProvider, microsoftProvider, signInWithPopup, signInWithRedirect } = CoreModule.init({ firebaseConfig }, {
            Notify: NotifyModule,
            Modal: ModalModule,
            DB: DBModule,
            User: UserModule,
            View: ViewModule,
            Gallery: GalleryModule,
            UI: UIComponents,
            Sync: SyncModule,
            Sidebar: SidebarModule,
            Extension: ExtensionModule,
            Security: SecurityModule,
            Search: SearchModule,
            Utils: { ...UIUtils, ...DateUtils, Image: ImageUtils },
            Config: { firebaseConfig, APP_CONSTANTS, LIMITS, SYSTEM_USERS }
        });

        AppModules.News = createNewsModule({
            db,
            ref,
            push,
            set,
            remove: DBModule.remove.bind(DBModule),
            getCurrentUser: () => currentUser,
            getCurrentNewsTab: () => currentNewsTab,
            setCurrentNewsTab: (tab) => { currentNewsTab = tab; },
            isAdmin: () => AppModules.User.isAdmin(),
            confirm: (...args) => AppModules.Modal.confirm(...args),
            alert: (...args) => AppModules.Modal.alert(...args),
            showCustom: (...args) => AppModules.Modal.showCustom(...args),
            escapeHTML: UIUtils.escape,
            formatDetailedTime: null,
            globalDataSync: () => {
                if (typeof window.globalDataSync === 'function') {
                    window.globalDataSync();
                } else if (AppModules.Sync && typeof AppModules.Sync.globalDataSync === 'function') {
                    AppModules.Sync.globalDataSync(db);
                }
            }
        });

        // Compatibility bridge: keep legacy callers working after modular sync refactor.
        window.globalDataSync = () => {
            if (AppModules.Sync && typeof AppModules.Sync.globalDataSync === 'function') {
                AppModules.Sync.globalDataSync(db);
            }
        };

        window.deleteNews = (id, tabType) => AppModules.News.deleteNews(id, tabType);

        
        const cv = document.getElementById('changelogView');
        if (cv) cv.innerHTML = CHANGELOG_CONTENT;
        const tv = document.getElementById('tosContentArea');
        if (tv) tv.innerHTML = TOS_CONTENT;

        
        const av = document.getElementById('appVersionLabel');
        if (av) av.innerText = `Build: 20260516-2380`;

        
        AppModules.View.init();
        AppModules.Gallery.init();
        if (AppModules.Sidebar && AppModules.Sidebar.init) AppModules.Sidebar.init();

        
        initCloudRefs({ db, auth, storage });

        




        
        window.CONSTANTS = APP_CONSTANTS;

        
        window['UIUtils'] = UIUtils;
        window.escapeHTML = UIUtils.escape;
        window.linkify = UIUtils.linkify;
        window.formatLastSeen = UIUtils.formatLastSeen;
        window.getLocalDateString = DateUtils.getLocalDateString;

        
        window.UserModule = UserModule;
        window.fetchUser = (id) => AppModules.Security.fetchUser(id);

        
        let ALL_USERS = { ...SYSTEM_USERS };
        window.ALL_USERS = ALL_USERS;
        let DONATIONS = {};
        let activeTargetId = null;
        let stopCurrentChatListener = null;
        let _pendingExtensionBridgeMessage = null;
        const _extensionNotifyState = {};
        const _extensionNotifyRouteMap = {};
        const _extensionUnreadCount = {};
        let _irNotificationBridgeUnsub = null;
        const isExtensionTargetId = (id) => {
            const s = String(id || '').toLowerCase();
            return s.startsWith('extension_') || s.startsWith('ext_');
        };
        const extensionIdFromTarget = (id) => {
            const s = String(id || '').toLowerCase();
            if (s.startsWith('extension_')) return s.slice('extension_'.length);
            if (s.startsWith('ext_')) return s.slice('ext_'.length);
            return s;
        };
        const globalListeners = new Set();
        const SAFETY_BOT_ID = APP_CONSTANTS.SAFETY_BOT_ID;
        const ADVICE_BOT_ID = APP_CONSTANTS.ADVICE_BOT_ID;
        const APP_START_TIME = Date.now();

        window.isPhotoDisabled = false;
        window.isSidebarAnimating = false;
        let currentNewsTab = 'school';
        window.currentClassId = null;

        Object.defineProperty(window, 'isSyncDone', {
            get: () => AppModules.Sync.isSyncDone,
            set: (val) => { AppModules.Sync.isSyncDone = val; },
            configurable: true
        });

        Object.defineProperty(window, 'cnCache', {
            get: () => AppModules.Sync.cnCache,
            set: (val) => { AppModules.Sync.cnCache = val; },
            configurable: true
        });

        Object.defineProperty(window, 'ctCache', {
            get: () => AppModules.Sync.ctCache,
            set: (val) => { AppModules.Sync.ctCache = val; },
            configurable: true
        });

        Object.defineProperty(window, 'sidebarClasses', {
            get: () => AppModules.Sync.sidebarClasses,
            set: (val) => { AppModules.Sync.sidebarClasses = val; },
            configurable: true
        });

        
        let currentModule = null;
        let currentModuleSort = 'latest';
        let modulePosts = [];

        Object.defineProperty(window, 'currentModule', {
            get: () => currentModule,
            set: (val) => { currentModule = val; },
            configurable: true
        });

        Object.defineProperty(window, 'currentModuleSort', {
            get: () => currentModuleSort,
            set: (val) => { currentModuleSort = val; },
            configurable: true
        });

        Object.defineProperty(window, 'modulePosts', {
            get: () => modulePosts,
            set: (val) => { modulePosts = val; },
            configurable: true
        });

        const EAGLE_ICON = APP_CONSTANTS.EAGLE_ICON;
        const EAGLE_ICON_BW = APP_CONSTANTS.EAGLE_ICON_BW;


        





        















        function renderExtensionsCategory(title, files) {
            const container = document.getElementById('dynamicExtensionsList');
            if (!container) return; 

            
            const header = document.createElement('div');
            header.className = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-6 px-1";
            header.innerText = title;
            container.appendChild(header);

            files.forEach(file => {
                
                const rawName = file.name.replace('.html', '');
                const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                
                const card = document.createElement('div');
                
                card.onclick = () => openExtension(rawName, file.url, displayName);
                
                card.className = "p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition group";

                



                let iconColor = "text-[#007AFF]"; 
                let iconBg = "bg-blue-100 dark:bg-blue-500/20";

                if (rawName.toLowerCase().includes('logic')) {
                    iconColor = "text-green-500"; 
                    iconBg = "bg-green-100 dark:bg-green-500/20";
                } else if (rawName.toLowerCase().includes('ir') || rawName.toLowerCase().includes('navigator')) {
                    iconColor = "text-cyan-500"; 
                    iconBg = "bg-cyan-100 dark:bg-cyan-500/20";
                } else if (title.toLowerCase().includes('staff')) {
                    iconColor = "text-purple-500"; 
                    iconBg = "bg-purple-100 dark:bg-purple-500/20";
                }

                
                card.innerHTML = `
                    <div class="w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-base text-black dark:text-white">${displayName}</h3>
                        <p class="text-xs text-gray-500">Extension Tool</p>
                    </div>
                `;
                container.appendChild(card);
            });
        }






        
        
        const SETTINGS = {
            soundEnabled: localStorage.getItem('soundEnabled') !== 'false', 
            soundUrl: localStorage.getItem('soundUrl') || "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" 
        };
        window.SETTINGS = SETTINGS;

        
        CoreModule.initMessaging(APP_START_TIME, SETTINGS, ALL_USERS, globalListeners);

        const SOUNDS = [
            { name: "Note", url: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" },
            { name: "Pop", url: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" },
            { name: "Blop", url: "https://assets.mixkit.co/active_storage/sfx/2351/2351-preview.mp3" },
            { name: "Chime", url: "https://assets.mixkit.co/active_storage/sfx/2347/2347-preview.mp3" },
            { name: "Bell", url: "https://assets.mixkit.co/active_storage/sfx/2341/2341-preview.mp3" }
        ];

        
        const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');

        
        console.log('App: Initializing SecurityModule...');
        SecurityModule.init(db);

        
        console.log('App: Initializing AuthModule...');
        AuthModule.init(
            { db, auth, googleProvider, microsoftProvider, signInWithPopup, signInWithRedirect },
            {
                onEnterApp: () => enterApp(),
                onShowTos: (mandatory) => showTos(mandatory),
                onHideLoading: () => hideLoading()
            }
        );

        





        console.log('App: Setting up onAuthStateChanged...');
        CoreModule.watchAuth(
            (user) => AuthModule.setupUser(user),
            () => {
                console.log('App: No user found. Showing login page.');
                document.getElementById('loginPage')?.classList.remove('hidden');
                document.getElementById('mainPage')?.classList.add('hidden');
                hideLoading();
            }
        );

        



        window.enterApp = async () => {
            
            try {
                const settingsSnap = await get(ref(db, 'settings'));
                const settingsData = settingsSnap?.val() || {};
                SETTINGS.soundEnabled = settingsData.soundEnabled !== undefined ? settingsData.soundEnabled : true;
                SETTINGS.soundUrl = settingsData.soundUrl || SETTINGS.soundUrl;

                const soundToggle = document.getElementById('soundToggle');
                if (soundToggle) soundToggle.checked = SETTINGS.soundEnabled;

                
                if (AppModules.Notify && SETTINGS.soundUrl) {
                    AppModules.Notify.setSound(SETTINGS.soundUrl);
                }
            } catch (err) {
                console.error('App: Settings fetch failed:', err);
            }

            onValue(ref(db, 'settings'), (snap) => {
                const s = snap.val() || {};
                window.isPhotoDisabled = s.isPhotoDisabled || false;
                const toggle = document.getElementById('globalPhotoToggle');
                if (toggle) toggle.checked = window.isPhotoDisabled;

                const isNewOrTest = (currentUser && currentUser.email && currentUser.email.toLowerCase().includes('moss932888')) || (currentUser && currentUser._isNewUser);
                if (!window._settingsInit && !isNewOrTest) {
                    window._settingsInit = true;
                    if (window.isPhotoDisabled) {
                        const statusTitle = "Photos Temporarily Disabled";
                        const statusMsg = "Image sharing is currently disabled to ensure platform stability during high traffic. You can still send text messages.";
                        AppModules.Modal.alert(statusTitle, statusMsg);
                    }
                }

                const cameraBtn = document.getElementById('chatCameraBtn');
                if (cameraBtn) cameraBtn.style.display = window.isPhotoDisabled ? 'none' : 'block';

                const photoStateChanged = window._prevPhotoDisabled !== undefined && window._prevPhotoDisabled !== window.isPhotoDisabled;
                window._prevPhotoDisabled = window.isPhotoDisabled;

                if (photoStateChanged && activeTargetId) {
                    console.log('App: Photo settings changed, skipping reload.');
                }
                if (currentModule) renderModuleList();

                if (AppModules.News && typeof AppModules.News.renderLocalNews === 'function') {
                    AppModules.News.renderLocalNews(getLocalNews).catch(e => console.warn('Sync news error:', e));
                }
            });

            
            if (AppModules.User.isAdmin()) {
                document.getElementById('adminPanel')?.classList.remove('hidden');
            } else {
                document.getElementById('adminPanel')?.classList.add('hidden');
            }

            AppModules.View.showPage('mainPage');
            AppModules.Search.initSearchUI({
                db,
                getCurrentUser: () => currentUser,
                getSidebarClasses: () => window.sidebarClasses,
                getCnCache: () => window.cnCache
            });
            if (AppModules.Sidebar && AppModules.Sidebar.configureRuntime) {
                AppModules.Sidebar.configureRuntime({
                    db,
                    get,
                    update,
                    query,
                    ref,
                    orderByKey,
                    limitToLast,
                    getCurrentUser: () => currentUser,
                    getActiveTargetId: () => activeTargetId,
                    getAllUsers: () => ALL_USERS,
                    formatLastSeen,
                    eagleIcon: EAGLE_ICON,
                    eagleIconBw: EAGLE_ICON_BW,
                    isExtensionTargetId,
                    extensionIdFromTarget
                });
            }
            AppModules.Security.initSecurityObserver(); 
            initChatListObserver();     
            initSettingsUI();           
            AppModules.Security.updateNewsAccess();     
            AppModules.View.showSidebar(); 
            AppModules.Notify.initMonitor();       
            AppModules.Notify.requestPermission(); 

            
            AppModules.Sync.init({
                renderNews: (...args) => AppModules.News.renderNewsContentFromData(...args),
                renderSidebar: () => AppModules.Sidebar.renderSidebar(),
                onNewChatDiscovered: (chatId) => {
                    if (window.AppModules && window.AppModules.Notify) {
                        window.AppModules.Notify._startChatListener(chatId);
                        window.AppModules.Notify.initMonitor();
                    }
                }
            });

            
            AppModules.Extension.init({
                renderCategory: renderExtensionsCategory,
                onComplete: (container) => {
                    container.innerHTML = `<div class="text-xs text-gray-400 text-center py-6 italic">No extensions found in /extensions/ folders.</div>`;
                }
            });

            
            AppModules.Sync.globalDataSync(db);
            
            AppModules.Extension.syncExtensions();
            
            AppModules.Sync.initPresence(db, currentUser);
            
            AppModules.Sync.startGroupSync(db, currentUser);

            if (window.AppModules.Auth) {
                window.AppModules.Auth.closeTos();
            } else {
                closeTos();
            }
            hideLoading();              
        };
        



        





        

        



        

        


        function initChatListObserver() {
            console.log('App: initChatListObserver starting...');
            console.log('App: Setting up user_chats listener...');
            onValue(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), (snapshot) => {
                const chatMap = snapshot.val() || {};

                




                const chatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));

                console.log(`App: Found ${chatIds.length} valid recent chats.`);

                
                chatIds.forEach(id => {
                    window.fetchUser(id).then(() => AppModules.Sidebar.renderSidebar()).catch(e => console.warn(e));
                });

                AppModules.Sidebar.renderSidebar(); 
                initGlobalNotificationMonitor(); 
                initIRNavigatorNotificationBridge();

                




                if (window.innerWidth >= 1024 && !activeTargetId) {
                    const sorted = chatIds.sort((a, b) => (chatMap[b] || 0) - (chatMap[a] || 0));
                    // Do not auto-open extension notification entries on reload.
                    const firstUserId = sorted.find(id => !isExtensionTargetId(id));
                    if (firstUserId) {
                        console.log('App: Desktop mode, switching to first valid chat:', firstUserId);
                        window.switchChat?.(firstUserId);
                    }
                }
            });
        }

        window.saveProfileName = async (e) => {
            const rawFirst = document.getElementById('firstNameInput').value.trim();
            const rawLast = document.getElementById('lastNameInput').value.trim();
            const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
            const last = rawLast.charAt(0).toUpperCase() + rawLast.slice(1);
            const newName = [first, last].filter(Boolean).join(' ');

            if (!newName) return AppModules.Modal.alert("Name Required", "Please enter a valid name");

            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = "Updating...";
            btn.disabled = true;

            try {
                await update(ref(db, `users/${currentUser.id}`), { name: newName });
                currentUser.name = newName;
                btn.innerText = "Saved!";
                setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
            } catch (error) {
                AppModules.Modal.alert("Error", "Failed to update name: " + error.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };



        window.jumpToMessage = (text, searchQuery, msgKey) => {
            const chatBox = document.getElementById('chatBox');
            const messages = Array.from(chatBox.querySelectorAll('.msg-pop'));

            // Try to find by unique database key first (most accurate and robust)
            let target = null;
            if (msgKey) {
                target = messages.find(m => m.dataset.key === msgKey);
            }
            // Fallback to finding by content (both data-raw-text attribute and visible innerText)
            if (!target) {
                target = messages.find(m => {
                    const raw = m.getAttribute('data-raw-text') || '';
                    return raw.includes(text) || m.innerText.includes(text);
                });
            }

            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Apply simple highlight to the main bubble or image after scroll
                const bubble = target.querySelector('.bg-\\[\\#007AFF\\], .bg-\\[\\#E9E9EB\\], .dark\\:bg-gray-700, img');
                if (bubble) {
                    setTimeout(() => window.UIUtils.highlight(bubble), 600);
                }
            } else {
                // Fallback to internal search if not found in current loaded view
                const input = document.getElementById('chatSearchInput');
                if (input) {
                    input.value = searchQuery || text;
                    input.dispatchEvent(new Event('input'));
                }
            }

            // If searchQuery is passed, populate the local search box and show local search results
            if (searchQuery) {
                const input = document.getElementById('chatSearchInput');
                if (input) {
                    input.value = searchQuery;
                    input.dispatchEvent(new Event('input'));
                }
            }
        };

        window.clearSearch = () => {
            const input = document.getElementById('chatSearchInput');
            if (input) input.value = '';
            const btn = document.getElementById('clearSearchBtn');
            if (btn) btn.classList.add('hidden');
            const resultsBox = document.getElementById('searchResults');
            if (resultsBox) { resultsBox.classList.add('hidden'); resultsBox.innerHTML = ''; }
        };

        window.handleSearch = (e, scope) => {
            const term = e.target.value.toLowerCase().trim();
            if (scope === 'sidebar') {
                if (AppModules.Sidebar && typeof AppModules.Sidebar.handleSidebarSearch === 'function') {
                    AppModules.Sidebar.handleSidebarSearch(e);
                }
            } else if (scope === 'chat') {
                const resultsBox = document.getElementById('searchResults');
                const clearBtn = document.getElementById('clearSearchBtn');
                if (!term) { resultsBox.classList.add('hidden'); clearBtn.classList.add('hidden'); return; }
                clearBtn.classList.remove('hidden');
                resultsBox.innerHTML = '';
                let hasResults = false;
                document.querySelectorAll('#chatBox .msg-pop').forEach(msg => {
                    const textDiv = msg.querySelector('div[class*="px-"]');
                    if (!textDiv) return;
                    const raw = msg.getAttribute('data-raw-text') || '';
                    if (raw.toLowerCase().includes(term) || textDiv.innerText.toLowerCase().includes(term)) {
                        hasResults = true;
                        const item = document.createElement('div');
                        item.className = "p-3 pl-5 pr-10 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-white/5 transition-all group hover:bg-gray-50 dark:hover:bg-white/5";

                        const snippetText = raw || textDiv.innerText;
                        const escapedSnippet = escapeHTML(snippetText);
                        const escapedTerm = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                        item.innerHTML = `<div class="text-[14px] line-clamp-2 text-black dark:text-white">${escapedSnippet.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<span class="text-[#007AFF] font-bold">$1</span>')}</div>`;

                        item.onclick = () => {
                            msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            window.UIUtils.highlight(textDiv);
                        };
                        resultsBox.appendChild(item);
                    }
                });
                if (!hasResults) resultsBox.innerHTML = '<div class="p-4 text-[14px] text-gray-500 text-center font-medium">No Results Found</div>';
                resultsBox.classList.remove('hidden');
            }
        };

        function initSettingsUI() {
            document.getElementById('soundToggle').checked = SETTINGS.soundEnabled;
            updateSettingsLabels();
            const soundDropdown = document.getElementById('soundDropdown');
            if (soundDropdown) {
                soundDropdown.innerHTML = '';
                SOUNDS.forEach((s, index) => {
                    const btn = document.createElement('button');
                    btn.className = `w-full text-left px-4 py-3 text-[15px] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${index !== SOUNDS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`;
                    btn.innerText = s.name;
                    btn.onclick = (e) => selectSound(s.url, e);
                    soundDropdown.appendChild(btn);
                });
            }

            if (AppModules.User.isAdmin()) {
                document.getElementById('adminPanel')?.classList.remove('hidden');
            }
        }

        function updateSettingsLabels() {
            if (document.getElementById('currentSoundLabel')) {
                document.getElementById('currentSoundLabel').innerText = SOUNDS.find(s => s.url === SETTINGS.soundUrl)?.name || 'Note';
            }
            const theme = localStorage.getItem('theme') || 'system';
            if (document.getElementById('currentThemeLabel')) {
                document.getElementById('currentThemeLabel').innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
            }
        }

        window.updateSound = (url) => {
            SETTINGS.soundUrl = url;
            localStorage.setItem('soundUrl', url);
            
            if (AppModules.Notify) {
                AppModules.Notify.setSound(url);
                
                if (AppModules.Notify.audio) AppModules.Notify.audio.play();
            }
        };
        window.toggleSound = (enabled) => { SETTINGS.soundEnabled = enabled; localStorage.setItem('soundEnabled', enabled); };
        window.showChangelog = () => {
            document.getElementById('settingsView').classList.add('hidden');
            document.getElementById('changelogView').classList.remove('hidden');
            document.getElementById('settingsModalTitle').innerText = "Engineering Log";
            const backBtn = document.createElement('button');
            backBtn.id = 'changelogBackBtn';
            backBtn.innerText = "Back";
            backBtn.className = "text-[#007AFF] font-medium text-[17px]";
            backBtn.onclick = () => {
                document.getElementById('changelogView').classList.add('hidden');
                document.getElementById('settingsView').classList.remove('hidden');
                document.getElementById('settingsModalTitle').innerText = "Settings";
                backBtn.remove();
            };
            const header = document.querySelector('#settingsModal .rounded-t-2xl');
            const doneBtn = header.querySelector('button');
            doneBtn.classList.add('hidden');
            header.insertBefore(backBtn, doneBtn);
            window._restoreSettingsHeader = () => {
                backBtn.remove();
                doneBtn.classList.remove('hidden');
                document.getElementById('settingsModalTitle').innerText = "Settings";
            };
        };



        
        window.AppView = AppModules.View;
                window.switchLeftTab = (tab) => AppModules.View.switchLeftTab(tab);
        window.applyTheme = (mode) => AppModules.View.applyTheme(mode);
        window.toggleSettings = (view = 'settings') => AppModules.View.toggleSettings(view, currentUser);
        window.toggleDonation = () => AppModules.View.toggleSettings('donation', currentUser);
        window.openDonationQR = (method, fallbackUrl) => AppModules.View.openDonationQR(method, fallbackUrl, DONATIONS);
        window.closeDonationQR = () => AppModules.View.closeDonationQR();
        window.toggleDropdown = (id, e) => AppModules.View.toggleDropdown(id, e);
        window.goBackToClassList = () => AppModules.View.goBackToClassList();
        window.goBackToRecent = () => AppModules.View.goBackToRecent();
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && activeTargetId) {
                AppModules.Notify.markAsRead(activeTargetId);
            }
        });

        if (AppModules.Sidebar && AppModules.Sidebar.startAutoRefresh) {
            AppModules.Sidebar.startAutoRefresh();
        }
        window.removeStudentFromClass = async (classId, studentId, studentName) => {
            const confirmed = await AppModules.Modal.confirm("Remove Student", `Are you sure you want to remove <b>${studentName}</b> from this class?`, "Remove");
            if (confirmed) {
                try {
                    await set(ref(db, `classes/${classId}/students/${studentId}`), null);
                    // Reverted: Do NOT delete user_chats entry so student can still view history
                    AppModules.Sidebar.renderSidebar();
                } catch (e) {
                    AppModules.Modal.alert("Error", "Failed to remove student: " + e.message);
                }
            }
        };

        window.handleDeleteClass = async (classId) => {
            const confirm1 = await AppModules.Modal.confirm(
                "Delete Class",
                "Are you sure you want to delete this class? This will permanently remove the roster and the group chat for all members.",
                "Delete Class"
            );
            if (!confirm1) return;

            // Small delay for smooth modal transition
            await new Promise(r => setTimeout(r, 150));

            const confirm2 = await AppModules.Modal.confirm(
                "Final Confirmation",
                "This action cannot be undone. Are you absolutely certain you want to proceed with the deletion?",
                "Yes, Delete Permanently"
            );
            if (!confirm2) return;

            try {
                await set(ref(db, `classes/${classId}`), null);

                window.currentClassId = null;
                window._isPopNav = true; // Use pop animation for going back
                AppModules.Sidebar.renderSidebar();

                // Clear chat if it was the current one
                if (activeTargetId === `group_${classId}`) {
                    activeTargetId = null;
                    if (window.switchChat) {
                        // Switch to a neutral state or clear chatbox
                        document.getElementById('chatBox').innerHTML = '<div class="h-full flex items-center justify-center text-gray-400 text-sm">Class deleted</div>';
                        document.getElementById('chatTitle').innerText = 'Chat Deleted';
                    }
                }

                // Removed showCustomAlert to prevent modal sticking issues
            } catch (e) {
                console.error('Delete Class Error:', e);
                AppModules.Modal.alert("Error", "Failed to delete class: " + e.message);
            }
        };

        
        window.toggleSidebarPin = () => AppModules.View.toggleSidebarPin();

        window.switchChat = async (targetId) => {
            if (!targetId || targetId === currentUser.id || targetId === activeTargetId) return;
            if (isExtensionTargetId(targetId)) {
                await openExtensionNotificationTarget(targetId);
                return;
            }

            activeTargetId = targetId;

            // Handle UI for disbanded classes
            const msgInput = document.getElementById('u-msg');
            const sendBtn = msgInput.nextElementSibling;
            const cameraBtn = document.getElementById('chatCameraBtn');
            let isDisbanded = false;
            let isRemoved = false;

            if (targetId.startsWith('group_')) {
                const classId = targetId.replace('group_', '');
                isDisbanded = isSyncDone && !cnCache[classId];
                isRemoved = isSyncDone && !sidebarClasses[classId];
            }

            if (targetId === 'safety_bot') {
                msgInput.disabled = true;
                msgInput.placeholder = "System notifications only. Messaging is disabled.";
                if (sendBtn) {
                    sendBtn.style.opacity = '0';
                    sendBtn.style.pointerEvents = 'none';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '0';
                    cameraBtn.style.pointerEvents = 'none';
                }
            } else if (isDisbanded || isRemoved) {
                msgInput.disabled = true;
                msgInput.placeholder = isDisbanded ? "This class has been disbanded. Messaging is disabled." : "You have been removed from this chat. Messaging is disabled.";
                if (sendBtn) {
                    sendBtn.style.opacity = '0';
                    sendBtn.style.pointerEvents = 'none';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '0';
                    cameraBtn.style.pointerEvents = 'none';
                }
            } else {
                msgInput.disabled = false;
                msgInput.placeholder = window.innerWidth < 640
                    ? "Type a message..."
                    : "Type a message...Use Shift+Enter to change lines";
                if (sendBtn) {
                    sendBtn.style.opacity = '1';
                    sendBtn.style.pointerEvents = 'auto';
                    sendBtn.style.display = 'flex';
                }
                if (cameraBtn) {
                    cameraBtn.style.opacity = '1';
                    cameraBtn.style.pointerEvents = 'auto';
                    cameraBtn.style.display = window.isPhotoDisabled ? 'none' : 'block';
                }
            }
            AppModules.Notify.markAsRead(targetId);

            const titleEl = document.getElementById('chatTitle');
            const statusEl = document.getElementById('chatStatus');
            let chatId = '';

            if (targetId.startsWith('group_')) {
                chatId = targetId;
                const classId = targetId.replace('group_', '');
                titleEl.innerText = cnCache[classId] || "Class Group Chat";
                statusEl.innerText = ctCache[classId] || "Group Chat";

                if (!cnCache[classId] || !ctCache[classId]) {
                    get(ref(db, `classes/${classId}`)).then(async snap => {
                        if (snap.exists()) {
                            const cData = snap.val();
                            cnCache[classId] = cData.name;
                            if (activeTargetId === targetId) titleEl.innerText = cData.name;

                            // Fetch teacher name
                            if (cData.teacherId) {
                                const teacher = await fetchUser(cData.teacherId);
                                ctCache[classId] = teacher?.name || "Teacher";
                                if (activeTargetId === targetId) statusEl.innerText = teacher?.name || "Teacher";
                            }
                            AppModules.Sidebar.renderSidebar();
                        }
                    });
                }
            } else {
                chatId = getChatId(currentUser.id, targetId);
                // Set initial title (fallback to ID)
                const u = ALL_USERS[targetId];
                if (isExtensionTargetId(targetId)) {
                    const extName = extensionIdFromTarget(targetId).replace(/_/g, ' ');
                    titleEl.innerText = u?.name || extName.replace(/\b\w/g, c => c.toUpperCase());
                } else {
                    titleEl.innerText = u?.name || targetId;
                }

                const statusText = isExtensionTargetId(targetId)
                    ? "Extension Tool"
                    : (u?.lastSeen ? formatLastSeen(u.lastSeen) : (u?.email || ""));
                statusEl.innerText = statusText;
                if (statusText === "online") {
                    statusEl.classList.add('text-[#007AFF]');
                    statusEl.classList.remove('text-gray-400');
                } else {
                    statusEl.classList.remove('text-[#007AFF]');
                    statusEl.classList.add('text-gray-400');
                }

                // Re-fetch user to ensure we get the latest name if it was just an ID
                fetchUser(targetId).then(user => {
                    if (user && activeTargetId === targetId) {
                        if (user.name) titleEl.innerText = user.name;
                        if (user.lastSeen) {
                            const updatedText = formatLastSeen(user.lastSeen);
                            statusEl.innerText = updatedText;
                            if (updatedText === "online") {
                                statusEl.classList.add('text-[#007AFF]');
                                statusEl.classList.remove('text-gray-400');
                            } else {
                                statusEl.classList.remove('text-[#007AFF]');
                                statusEl.classList.add('text-gray-400');
                            }
                        }
                    }
                });
            }

            // Unified View Transition
            window.AppView.showPanel('chat');

            const chatSec = document.getElementById('chatSection');
            if (window.AppView.isMobile() && chatSec) {
                chatSec.classList.add('slide-in-right');
                setTimeout(() => chatSec.classList.remove('slide-in-right'), 400);
            }

            
            // const chatBox = document.getElementById('chatBox');
            // chatBox.classList.remove('slide-up');
            // void chatBox.offsetWidth;
            // chatBox.classList.add('slide-up');

            console.log(`DEBUG [Switch]: 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵割槮缁炬儳缍婇弻鐔兼⒒鐎靛壊妲紒鐐劤缂嶅﹪寮婚悢鍏尖拻閻庨潧澹婂Σ顔剧磼閻愵剙鍔ょ紓宥咃躬瀵鎮㈤崗灏栨嫽闁诲酣娼ф竟濠偽ｉ鍓х＜闁诡垎鍐ｆ寖闂佺娅曢幑鍥灳閺冨牆绀冩い蹇庣娴滈箖鏌ㄥ┑鍡欏嚬缂併劌銈搁弻鐔兼儌閸濄儳袦闂佸搫鐭夌紞渚€銆佸鈧幃娆撳箹椤撶噥妫ч梻鍌欑窔濞佳兾涘▎鎴炴殰闁圭儤顨愮紞鏍ㄧ節闂堟侗鍎愰柡鍛叀閺屾稑鈽夐崡鐐差潻濡炪們鍎查懝楣冨煘閹寸偛绠犻梺绋匡攻椤ㄥ棝骞堥妸鈺傚€婚柦妯侯槺閿涙稑鈹戦悙鏉戠亶闁瑰磭鍋ゅ畷鍫曨敆娴ｉ晲缂撶紓鍌欑椤戝棛鈧瑳鍥ㄥ€垫い鎺戝閳锋垿鏌ｉ悢鍛婄凡闁抽攱姊荤槐鎺楊敋閸涱厾浠搁悗瑙勬礃閸ㄥ潡鐛崶顒佸亱闁割偁鍨归獮宥囩磽閸屾艾鈧兘鎮為敃鍌涙櫔缂傚倷鐒﹂妵鍡涘炊閵娧冨笚闁荤喐绮嶇划鎾崇暦濠婂牊鏅濋柛灞炬皑閻撴垿姊洪崨濠傚Е闁绘挸鐗嗛…鍥冀瑜夐弨浠嬫煟濡櫣鏋冨瑙勵焽閻ヮ亪骞嗚閹垿鏌熸笟鍨閾伙綁鏌涘┑鍡楊伂闁糕晝鍋涢—鍐Χ閸愩劉鍋撻幇鏉跨；闁瑰墽绮埛鎺楁煕鐏炲墽鎳嗛柛蹇撴湰閵囧嫰顢橀悙闈涒叡闂佺懓绠嶉崹浠嬬嵁鐎ｎ喗鏅滈柦妯侯槹閻ゅ嫬鈹戞幊閸娧呭緤娴犲鐤い鎰堕檮閸嬪倿鏌嶉妷锕€澧柣鏂挎閹綊宕崟鈺佷缓闂佽法鍠撴慨鐢稿磻閸曨偀鏀介柛灞惧嚬濡叉椽鏌涘▎蹇旑棦婵﹥妞藉畷銊︾節閸愵煈妲遍梻浣告啞閹碱偆绮婚幋锝囦罕闂備礁鎲￠崝锕傚窗濡ゅ懎纾归柣銏犳啞閸嬧剝绻涢崱妤冪妞ゅ浚浜為惀顏堟倷椤掍礁鈧劙鏌＄仦鍓р姇闁诡垱妫冮弫鎰板幢濡崵妲楀┑掳鍊楁慨鐑藉磻閻愬搫绀夐柡宥庡亝瀹曞弶绻濋棃娑卞剰缂佲偓閸愵喗鐓忓┑鐐戝啯鍣界€规挷绶氬缁樻媴缁涘娈梺鍛婂灩閺咁偆妲愰悙鍝勫耿婵☆垳鈷堝ú绋库攽閻樼粯娑фい鎴濇瀹曟劙宕奸弴鐐殿啇闂佸湱鈷堥崢鐣屾濮樿京纾奸悹鍥у级椤ャ垽鏌″畝瀣М妤犵偛娲畷妤呭传閵壯勬櫒闂傚倷绶氶埀顒傚仜閼活垱鏅堕鐐寸厱闁靛鍎虫禒銏ゆ煟閿濆洤鍘撮柟顔惧厴楠炲﹥绻濋崘鈹夸虎濡炪們鍨哄Λ鍐ㄧ暦閹烘嚦鏃堝焵椤掍胶顩插Δ锝呭暞閻撴洟鏌熼懜顒€濡芥繛鍛川缁辨帡鍩﹂埀顒勫磻閹剧粯鈷掑ù锝勮閻掗箖鏌￠崼顐㈠闁告帗甯掗濂稿川椤忓懐浜栧┑掳鍊х徊浠嬪疮椤栫偛鐓曢柟瀵稿Х绾捐棄霉閿濆牆浜楅柟杈剧畱閻撴洟鏌熼悜姗嗘畷闁绘挸鍟伴埀顒傛嚀鐎氼厽绔熼崱妯绘珷闁挎棃鏁崑鎾斥枔閸喗鐝梺绋款儏閿曘倝鎮惧畡閭︽建闁逞屽墴閵嗕礁鈻庨幘鏉戜患闁诲繒鍋犲Λ鍕繆閸ヮ剚鈷掗柛灞剧懅椤︼箑顭块悷甯含鐎规洘鍨垮畷銊╊敍濞戞ê绨ラ梻浣侯焾閻ジ宕曢幇鏉挎瀬闁糕剝绋掗悡蹇涚叓閸パ屽剰闁逞屽墯濞茬喖骞冮崸妤婃晪闁逞屽墴瀵鎮㈤崗灏栨嫽闁诲海鏁搁…鍫熶繆娴犲鈷戦柟鎯板Г閺侀亶鎮介銈囩瘈鐎殿喛顕ч埥澶婎潩椤愶絽濯伴梻浣侯攰椤宕濋弴鈶哄鈹戠€ｎ偀鎷洪梻渚囧亞閸嬫盯鎳熼娑欐珷濞寸厧鐡ㄩ悡鏇㈢叓閸ャ劍顥栭柤鐗堝椤ㄣ儵鎮欑拠褍浼愰柧缁樼墵閺屾稑鈽夐崡鐐茬濡炪倧瀵岄崢鐣屾崲濞戞瑦缍囬柛鎾楀嫬浠规俊鐐€ら崢濂告偋閹捐绠栨俊顖濆吹缁♀偓闂佺琚崐鏍偓闈涚焸濮婃椽妫冨☉姘暫濠碘槅鍋呯粙鎺楀疾閸洘鐒肩€广儱妫涢崢閬嶆煟鎼搭垳绉甸柛瀣閹便劌顓兼径瀣幈闂佸疇顫夐崕铏閻愵兛绻嗛柣鎰典簻閳ь剚鐗滈弫顕€骞掑Δ浣规珖闂佹寧娲栭崐褰掑磻閳哄懏鐓熼柕蹇嬪焺閺嗩垶鏌涚€ｎ偅灏甸柟鍙夋尦瀹曠喖顢楅崒銈喰氶梻鍌欒兌缁垶鎮ч弴銏犖ч柟闂寸杩濇繛杈剧秬閸婁粙寮崼婵嗙獩濡炪倖鎸炬慨瀛樻叏閿旀垝绻嗛柣鎰典簻閳ь剚鐗滈弫顕€骞掑Δ鈧壕褰掓煙闂傚韫堝璺侯煬濞尖晠鏌ら崫銉︽毄闁告﹢浜堕幃宄邦煥閸愵喖寮伴梺闈涙閸熸潙鐣烽崡鐐╂婵炲棗绻嬬花鐢告⒒婵犲骸浜滄繛璇у缁瑩骞掑Δ浣镐簵闂佸搫娲ㄩ崰鍡樼濠婂牊鐓欓柡澶婄仢椤ｆ娊鏌熼鍨汗缂佽鲸甯￠幃鈺佺暦閸パ€鎷￠梻渚€鈧偛鑻晶浼存煙閾忣偅宕屾鐐差樀閺佸秹宕熼鈧惔濠囨⒑閸撴彃浜栭柛搴ㄤ憾閹锋垿鎮㈤崗鑲╁弳濠电娀娼уΛ顓炍熼崼銉︾厸濞达絽鎲￠崰姗€鏌″畝瀣М妤犵偛娲幃褔宕奸悢鍏兼殬濠碉紕鍋戦崐褏寰婇幆褜娓婚柦妯侯樈濞兼牕鈹戦悩瀹犲闁绘劕锕﹂幉绋款煥閸忓墽鍠栭崺鈧い鎺戝閳锋垿鏌涘┑鍡楊伀闁绘帟娉曠槐鎾愁吋閸曨厾鐛㈤梺缁樹緱閸犳牠锝炲鍫濈劦妞ゆ帒瀚粻鍦喐閻楀牆淇柡浣稿暣閺屻劌鈹戦崱妯烘畻濠碘槅鍋嗛崗妯侯潖婵犳艾纾兼繛鍡樺焾濡差喖鈹戦悩顐壕闂備緡鍓欑粔鎾偪閻愵兙浜滈柟鏉垮閹偐绱掗悩鑽ょ暫闁哄苯绉烽¨渚€鏌涢幘璺烘灈鐎殿喖顭烽崹鎯х暦閸ャ劍鐣烽梺璇插嚱缂嶅棝宕滃☉婧惧徍婵犲痉鏉库偓妤佹叏閻戣棄纾婚柣鎰€€閳ь剨绠撳畷鍫曨敆閳ь剛绮婚弻銉︾厱闁哄洢鍔岄獮妤呮煕鐎ｎ偓鑰块柡灞界Ч閸┾剝鎷呴崨濠冾啀闂備線鈧偛鑻崢鎼佹煕濡も偓閸熷潡锝炶箛鏇犵＜婵☆垵顕ч鎾绘⒑閸涘﹦鈽夐柨鏇樺劦瀹曟洟骞樼紒妯锋嫼闂佸憡绻傜€氼喗鏅堕柆宥嗙厱闁规儳顕妴鎺楁煕閹烘挸绗掗柍璇查叄楠炴ê鐣烽崶璺烘倛闂傚倷鐒︾€笛呮崲閸屾娲晲閸ヮ亜小闂佺粯鍨兼慨銈夊煕閹烘鐓曢悘鐐插⒔閹冲懏銇勯敂鑲╃暤闁哄瞼鍠撻幏鐘侯槾缂佲檧鍋撻柣搴ゎ潐濞叉鎹㈤崼銉у祦閻庯綆鍠楅弲婵嬫煃瑜滈崜娑氬垝閸喎绶為柟閭﹀幖閳ь剙鐖奸弻锝夊箛椤撶偟绁烽梺鎶芥敱濡啴寮婚敐鍛斀闁糕剝鐟ラ悡鐔兼⒑鐠団€虫灍妞ゃ劌锕顐﹀箛椤撶喎鍔呴梺鏂ユ櫅閸熺増绂嶉崼鏇熲拻濞达絼璀﹂悞楣冩煥閺囶亞鐣电€殿噮鍋呯换婵嗩潩椤掑倻鏆柣搴ｆ嚀鐎氼厽绔熺€ｎ喖鍑犻幖娣妿閸欐捇鏌涢妷锝呭闁诡垰瀚湁闁绘宕甸悾鐑樻叏婵犲懏顏犵紒顔界懃閳诲酣骞嗚婢瑰鈹戦悩鍨毄闁稿鍔欏畷鎴﹀箻缂佹ǚ鎷洪梺鍛婄箓鐎氼厼锕㈤幍顔剧＜閻庯綆鍋勫ù顔筋殽閻愬弶顥㈢€殿噮鍣ｅ畷濂告偄閸涘﹦褰搁梻鍌欒兌绾爼宕滃┑濠冩噷闂備椒绱梽鍕箲閸ヮ剙钃熼柨婵嗘閸庣喖鏌曡箛濠冩珔闁哄懘浜跺娲传閵夈儛锝夋煟濡ゅ啫鈻堥柛銊╃畺閺佸啴鍩€椤掑嫭鍋╅柨鐔哄У閻掍粙鏌ㄩ弴妤€浜惧┑鐐茬墑閸旀垵顫忓ú顏勬嵍妞ゆ挴鍓濋妤呮⒑閸濄儱校闁绘濞€閺佹劙鎮欓崫鍕獩闁诲孩绋掗…鍥储閽樺鏀芥い鏂款潟娴犳粓鏌涚€ｎ偅灏扮紒缁樼⊕閹峰懘宕橀崣澶嬫倷闂佺粯甯掗悘姘跺Φ閸曨垰绠抽柟瀛樼妇閸嬫捇宕ㄦ繝鍕垫祫闂備緡鍓欑粔鐢告偂濞嗘劑浜滈柡鍐ㄥ€哥敮鑸典繆閼碱剛甯涢柕鍥у椤㈡ê顭ㄩ崘顭戞綆闁诲氦顫夊ú婊堝窗閺嶎厹鈧礁顫滈埀顒勫箖閳哄懏顥堟繛鎴烆焽閻熴垽姊婚崒姘偓椋庣矆娓氣偓楠炲鏁撻悩顔瑰亾閸愨晛绶為悗锝冨妺缁捇姊洪崨濠勭細闁稿孩褰冮悾鐑藉矗婢跺瞼顔曢梺鐟邦嚟閸庢垶绗熷☉銏＄厱闁绘棃鏀遍崳娲煏閸パ冾伃鐎殿噮鍣ｅ畷鎯邦槻闁诡垳鍋ゅ娲川婵犲倻浠寸紓鍌氱Т閿曘倝锝炶箛娑欐優闁革富鍘鹃敍婊冣攽閳藉棗鐏ユい鏇嗗洤姹叉俊銈呮噺閳锋垿鏌涘┑鍕姎閺嶏繝姊虹紒姗嗘畼濠殿喗鎸抽、姘舵晲閸℃瑧鐦堝┑顔斤供閸撴瑥鐣甸崱娑欌拺缂備焦蓱椤ュ牊銇勯妷锔藉暗缂侇噯缍侀幃娆徝圭€ｎ偅鏉搁梻浣哥枃濡嫬螞濡ゅ懏鍊堕柨婵嗩槹閻撴洟骞栫€涙鈽夐柍褜鍓氱换鍫ョ嵁閸愵煈娼ㄩ柍褜鍓欓悾鐑藉础閻愨晜鐎婚梺鐟邦嚟婵妲愰崘娴嬫斀闁绘劘鍩栬ぐ褏绱撳鍕槮妞ゎ厼娲╅ˇ鍐睬庨崶褝韬柟鐓庣秺瀹曠兘顢橀悪鍛簥濠碉紕鍋戦崐鏍ь潖婵犳艾鐤炬い鎰剁畱缁犵娀鏌涢妷銏℃澒闁稿鎸搁埢鎾诲垂椤旂晫浜俊鐐€ら崢楣冨礂濮椻偓閻涱噣宕橀纰辨綂闂侀潧鐗嗛幊鎰八囪濮婅櫣绱掑Ο璇茬缂備降鍔岄妶鎼佸箖閼恒儳绡€婵﹩鍘搁幏缁樼箾鏉堝墽鍒伴柟璇х節楠炲棝宕奸悢缈犵盎闂佹寧鏌ㄩ悘婵嗙暤閸℃ǜ浜滈柕蹇ョ磿婢ь亪鏌嶇拠鏌ュ弰妤犵偛娲、妤佸緞婵犲喚鍟岄梻鍌氬€风粈渚€骞夐敓鐘茬闊洦绋戦悿鐐節闂堟稓澧曞┑顕呭墴閺屽秷顧侀柛鎾寸〒濡叉劙骞掑Δ鈧粈鍫㈡喐瀹ュ鈧倹绺介崨濠勫弳濠殿喗锕╅崜锕傛偄閸℃瑦鍠愰幖娣妽閸嬪倿鏌ㄩ悢鍝勑㈤柦鍐枛閺岋綁寮崒妤佸珱闂佽桨绀侀敃顏堝蓟閿濆绠荤€规洖娲ら崫娲⒑缁嬫鍎愰柟閫涚窔婵＄敻骞囬弶璺唺闂佺懓顕慨鐑藉级娴犲鈷掑〒姘ｅ亾婵炰匠鍡楊杺闂備礁鎼幊蹇涙儎椤栫偛绠栭柣鎰惈閸ㄥ倹銇勯幇顔夹＄紒銊ヮ煼濮婃椽宕烽鐐插闂佹悶鍔庨弫濠氥€侀弮鍫晜闁割偆鍠撻崢浠嬫⒑鐟欏嫬鍔ょ€规洦鍓熷畷婵嗩煥閸涱垳锛滅紓鍌欑劍椤洤煤鐎涙﹩娈介柣鎰▕閸庢棃鏌熼鐭亞鍙呴柣鐘辩劍婵炲﹪宕戝Δ鈧—鍐Χ閸愩劎浠惧┑鈽嗗亜閸熸潙鐣峰ú顏呮櫢闁绘灏欓敍婊堟⒑闂堟稓澧曟俊顐弮瀹曨垰顓兼径瀣ф嫽婵炶揪缍€濞咃絿鏁☉銏＄厱闁哄啠鍋撻柨鏇樺灲閻涱噣骞樺ú缁樻櫆闂佸壊鍋嗛崰搴♀枔瀹€鍕拺闁革富鍙庨悞楣冩倵濞戞帗娅婄€规洩缍€缁犳盯骞橀娑欐澑闂備胶绮摫鐟滄澘鍟粋宥夋倷閻戞鍘介梺鐟板⒔閹虫挻绂嶈ぐ鎺撶厓鐟滄粓宕滃┑瀣剁稏濠㈣泛鈯曢崫鍕庣喖宕楅崗鍏碱唶闂備礁婀遍崕銈夈€冮崨瀛樺亗婵犻潧顑呯粻瑙勭箾閿濆骸澧┑陇鍋愮槐鎺楁偑閸涱垳蓱缂備胶绮换鍫澪涢崘銊㈡婵炲棙鐟х粈濠囨⒒娴ｇ瓔鍤欓悗娑掓櫊楠炴劙宕樺顔界稁缂傚倷鐒﹁摫濠殿垰顕槐鎺戔槈濮楀棗鍓板┑鐐茬墱閸樺ジ鍩為幋锔藉€风€瑰壊鍠栧▓鍫曟⒑缁嬭法绠查柨鏇樺灲閻涱噣宕橀钘夆偓濠氭煢濡警妲烘い鏂挎嚇濮婃椽鎳為妷鍐句邯钘濇い鏍ㄧ矌閻滅粯绻涢幋鐑囦緵婵炴挸顭烽弻鏇㈠醇濠靛浂妫ゆ繝鈷€灞藉缂佽鲸甯￠、娆愮附缁嬪灝鍙婇柣搴ゎ潐濞插繘宕规禒瀣ㄢ偓浣糕槈閵忊€斥偓椋庣磼椤旀娼愰悗姘虫閳规垿鎮欓懜闈涙锭缂備浇灏崑鎰板箯閸愵喗鏅濋柛灞炬皑閸濇绻涚€电甯堕柣掳鍔戦幃鈥斥枎閹邦喚顔曢梺鐓庛偢椤ゅ倿宕ú顏呪拺妞ゆ挆鍐画闂侀€涚┒閸斿秶鎹㈠┑鍥ㄥ闁惧繐婀遍崢顖炴煟鎼淬値娼愭繛鍙夌矒瀹曚即寮介婧惧亾娴ｇ硶妲堟慨妤€妫欓崓鐢告⒑鐟欏嫬绲绘い鎴濇喘閻涱噣濮€閵堝棌鎷婚梺绋挎湰閻熝呯玻閺冣偓缁绘稒鎷呴崘鍙夊闁稿顑夐弻娑㈠焺閸愵厽宸㈤梺鎼炲劘閸斿矂顢氶柆宥嗗€垫繛鎴烆仾椤忓懐顩叉俊銈傚亾闁宠鍨块幃娆撳级閹寸姳鎴烽梻浣规偠閸斿秴顪冩禒瀣畺闁跨喓濮寸粈鍐┿亜韫囨挻鍣归柡瀣灥閳规垿鎮╃拠褍浼愰梺缁橆殔濡稓鍒掗崼銉ラ唶闁靛濡囬崢浠嬫⒑閸濆嫬鏆欓柣妤佺矊铻為柟杈鹃檮閻撴盯鏌涢埥鍡楀箻闁伙絿鏁婚弻鈥崇暆閳ь剟宕伴弽褜娼栭柤濮愬€愰崑鎾绘濞戞﹩妫屽┑鈥虫▕閸犳氨妲愰幒鏃傜＜闁靛繒濮寸粻浼存⒑缁嬫鍎愰柟绋垮⒔濡叉劙骞樼拠鑼紲濠电偛妫欓崹鑲╃玻濡ゅ懏鈷戦柟鑲╁仜婵¤棄顭块悷鐗堫棦鐎? ${chatId}`);
            loadChatThread(chatId);

            // Update sidebar active state manually to avoid flash
            document.querySelectorAll('#sidebarSubList div[id^="item-"]').forEach(div => {
                const divId = div.id.replace('item-', '');
                if (divId === targetId) {
                    div.classList.add('active-chat-item');
                    div.classList.remove('hover:bg-gray-50/5', 'hover:bg-gray-50/50', 'dark:hover:bg-white/5');
                } else {
                    div.classList.remove('active-chat-item');
                    div.classList.add(divId.startsWith('group_') ? 'hover:bg-gray-50/50' : 'hover:bg-gray-50/5', 'dark:hover:bg-white/5');
                }
            });
        };

        window.deleteChatRecord = async (targetId) => {
            if (!await AppModules.Modal.confirm("Remove Chat", "Remove this chat from your list? Messages will not be deleted.", "Remove")) return;

            const originalTarget = targetId.trim();
            const lowerTarget = originalTarget.toLowerCase();
            const originalUser = currentUser.id.trim();
            const lowerUser = originalUser.toLowerCase();

            try {
                // 1. Delete from current user's chat list (try multiple casings to be sure)
                const paths = [
                    `user_chats/${originalUser}/${originalTarget}`,
                    `user_chats/${lowerUser}/${lowerTarget}`,
                    `user_chats/${lowerUser}/${originalTarget}`,
                    `user_chats/${originalUser}/${lowerTarget}`
                ];

                await Promise.all(paths.map(path => set(ref(db, path), null)));

                // 2. Hide from UI immediately
                document.getElementById(`item-${targetId}`)?.remove();

                // 3. Refresh sidebar to confirm
                setTimeout(() => AppModules.Sidebar.renderSidebar(), 500);
            } catch (err) {
                console.error("Delete chat failed:", err);
            }
        };

        window.showSidebar = () => {
            window.activeTargetId = null;
            AppModules.View.showSidebar();
        };

        window.refreshBottomNav = (tab) => AppModules.View.refreshBottomNav(tab);
        window.switchTab = (tab) => AppModules.View.switchTab(tab);







        let chatLoadingLock = null;
        let lastLoadTime = 0;
        let loadedMsgKeys = new Set();

        let lastChatId = null;
        async function loadChatThread(chatId) {
            
            const now = Date.now();
            if (chatLoadingLock === chatId && (now - lastLoadTime < 1500)) return;

            chatLoadingLock = chatId;
            lastLoadTime = now;

            const chatBox = document.getElementById('chatBox');

            
            if (lastChatId !== chatId) {
                
                chatBox.style.opacity = '1';
                chatBox.innerHTML = `
                    <div class="h-full min-h-[200px] flex items-center justify-center">
                        <div class="flex flex-col items-center gap-2 text-gray-400">
                            <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                            <span class="text-xs font-medium">Loading messages...</span>
                        </div>
                    </div>
                `;
                loadedMsgKeys.clear();
                lastChatId = chatId;
            }

            if (stopCurrentChatListener) stopCurrentChatListener();

            
            const localMsgs = await getLocalMessages(chatId);
            const displayMsgs = localMsgs.slice(-50);
            let lastKey = localMsgs.length > 0 ? localMsgs[localMsgs.length - 1].key : null;

            
            const initialFrag = document.createDocumentFragment();
            displayMsgs.forEach(m => {
                if (m.key) {
                    loadedMsgKeys.add(m.key);
                    const msgEl = UIComponents.createChatBubble(m, m.key, currentUser, setupLongPress);
                    if (msgEl) initialFrag.appendChild(msgEl);
                }
            });
            chatBox.appendChild(initialFrag);

            
            let isSyncing = true;
            let syncBuffer = [];
            let q = lastKey ? query(ref(db, `messages/${chatId}`), orderByKey(), startAfter(lastKey)) : query(ref(db, `messages/${chatId}`), orderByKey(), limitToLast(50));

            console.log(`DEBUG [Thread]: 婵犵數濮烽弫鍛婃叏閻戣棄鏋侀柛娑橈攻閸欏繘鏌ｉ幋锝嗩棄闁哄绶氶弻娑樷槈濮楀牊鏁鹃梺鍛婄懃缁绘﹢寮婚敐澶婄闁挎繂妫Λ鍕⒑閸濆嫷鍎庣紒鑸靛哺瀵鈽夊Ο閿嬵潔濠殿喗顨呴悧濠囧极妤ｅ啯鈷戦柛娑橈功閹冲啰绱掔紒姗堣€跨€殿喖顭烽弫鎰緞婵犲孩缍傞梻浣虹帛閿氭俊顖氾工铻炵€光偓閸曨兘鎷洪柡澶屽仦婢瑰棝藝閿曞倹鐓ラ柡鍥ュ妺闁垳鈧鍠栭…鐑藉垂妤ｅ啫绠涘ù锝呮啞閸婎垶姊虹涵鍛汗閻炴稏鍎甸崺鈧い鎺嗗亾缁剧虎鍙冮、娆撳箛椤斿墽锛濋梺绋挎湰閻熝囧礉瀹ュ鐓曢柡鍐ｅ亾闁绘濞€婵℃挳宕橀鐓庤€垮┑鈽嗗灠閻ㄧ兘寮ㄩ搹顐ょ瘈闁汇垽娼у瓭濠电偛鐪伴崐鏇灻洪崸妤佲拻濞达絽鎲￠崯鐐层€掑顓ф疁鐎规洏鍨介幐濠冨緞閸℃浜栭梻浣告惈鐞氼偊宕曢弻銉ョ９闁汇垹鎲￠崑鈩冪箾閸℃绠版い蹇ｄ簽缁辨帡鍩€椤掑嫬绀冩い鏃傛櫕閸樹粙姊洪悷鎵虎閻庢凹鍠氬褔鍩€椤掑嫭鍊垫繛鍫濈仢閺嬫稒銇勯鐘插幋妤犵偛鍟存慨鈧柕鍫濇噽椤ρ囨⒑閸忚偐銈撮柡鍛⊕閹便劌煤椤忓應鎷绘繛杈剧悼閹虫捇顢氬鍕闁圭粯甯炴晥閻庤娲橀崹鍧楃嵁濡偐纾兼俊顖滃帶楠炴劙姊虹拠鎻掑毐缂傚秴妫濆畷鎴﹀幢濞戞銉╂煙閻戞ɑ鈷掔痪鎯с偢瀵爼宕煎☉妯侯瀳濠电偞鎯岄崳锝夊蓟閿濆绠奸柛鎰╁妼閳峰螖閻橀潧浠﹂柟鐟版喘閻涱噣骞掑Δ鈧獮銏′繆閻愭潙鍔ゆい銉︾缁绘繈鎮介棃娑掓瀰濠电偘鍖犻崶鑸垫櫈闂佸憡绋戦悺銊р偓姘嚇閺岋綁寮崹顔藉€梺缁樻尪閸庣敻寮婚敓鐘茬倞妞ゎ厽鍨堕悾鑸电箾鐎涙鐭掔紒鐘崇墵瀵槒顦抽悗鐢靛帶閳诲酣骞嬪┑鍡欏帓闂傚倷绶氬褍螞濞嗘垶鏆滈柟鐑橆殣缂嶆牗绻濋棃娑卞剱闁稿鍊块獮鏍ㄦ綇閸撗冾嚤闂佹眹鍨荤划顖涚┍婵犲洦鍊锋い蹇撳閸嬫捇寮撮悤浣诡啍缂備礁顑堥鍐测槈濡攱鏂€闂佺硶妾ч弲婊呯礊鎼粹檧鏀介柣鎰级閳绘洖霉濠婂嫮绠炵€规洜鏁诲畷姗€顢欓悾灞藉笚闂佸搫顦遍崑鐐寸珶閸℃瑦瀚诲ù鐓庣摠閻撴盯鏌涢埦鈧弲娑橆嚕椤曗偓閺屸€崇暆鐎ｎ剛蓱闂佽鍨卞Λ鍐极閹版澘鐐婇柕濞垮劜閻ｉ亶姊婚崒娆戝妽闁诡喖鐖煎畷鏇灻洪鍛偓鑸电箾閹存瑥鐏柡鍛箞閺屾稓浠﹂崜褋鈧帡鏌涘鈧禍璺侯潖濞差亜浼犻柛鏇ㄥ墮閸嬪秹姊洪崨濠冪叆闁活厼鍊搁锝夊箹娴ｈ倽褍顭跨捄渚剳闁告ü绮欏娲濞戞艾顣洪梺绋匡工閹诧紕绮嬪鍡愬亝闁告劏鏂侀幏濠氭⒑缁嬫寧婀伴柣鐔濆泚鍥晜閻ｅ瞼鐦堥梺閫炲苯澧撮柡灞芥椤撳ジ宕ㄩ銈囧耿闂傚倷娴囬～澶婄暦濮椻偓椤㈡俺顦寸紒顔款嚙椤繈鎳滈棃娑掑亾閸洘鐓熼柟閭﹀灡绾箖鏌嶇拠鑼缂佺粯鐩獮瀣倷閸愨晞澹橀崡閬嶆煕椤愮姴鍔滈柣鎾崇箻閻擃偊宕惰閺€缁樸亜鎼粹剝顥㈤柡宀€鍠栭幃鍧楊敍濞戝彉鍝楃紓鍌欐祰妞存悂骞戦崶褏鏆﹂柟鐑樺灍閺嬪酣鏌熺€涙绠撴い顒€顦靛缁樻媴閻熼偊鍤嬪┑顔角滈崝搴∥ｉ幇鏉跨闁瑰疇娅曞褰掑箯閸涙潙宸濆┑鐘叉噽濡俱劑姊婚崒娆戭槮闁圭⒈鍋嗛幃顕€顢曢敃鈧粈澶愭煙鐎涙绠ラ柛銈嗘礋閺屸剝寰勭€ｎ亝顔曢梺缁樻⒒閸樠勫閻樼粯鐓曢柡鍥ュ妼閳ь剨缍侀獮瀣晜鐟欙絾瀚藉┑鐐舵彧缁插潡宕曢妶澶婂惞闁逞屽墰缁辨挻鎷呴崫鍕戙垻绱掓径灞惧殌闁伙綁顥撳☉鐢稿川椤愨剝鐫忛梻浣告贡閸庛倝宕硅ぐ鎺戝偍闁圭虎鍠楅埛鎴︽煟閻旂厧浜伴柛銈囧枎閳规垿顢氶崨顓炵睄閻庤娲橀崹鍧楃嵁濡偐纾兼俊顖滅帛閻濇娊姊虹涵鍛汗閻炴稏鍎甸崺鈧い鎺戝暙閽勫ジ鏌涢埡浣瑰櫤缂佺粯绻勯崰濠偽熷ú缁樼秹闂備胶顭堥鍛偓姘緲閻ｇ兘顢涢悜鍡樻櫇闂佹寧娲嶉崑鎾绘煟閹捐揪鑰块柡宀€鍠愬蹇斻偅閸愨晩鈧秹姊虹粙鍖″姛闁稿繑锕㈠濠氬焺閸愩劎绐為柣搴秵娴滅偞绂掗崗鑲╃閻庣數顭堟牎闂佸湱顭堥崯鍧楋綖韫囨拋娲敂閸曨亞鐐婇梻渚€娼чˇ顓㈠磿閺屻儲鍊靛Δ锝呭暞閻撶喖骞栨潏鍓ф偧闁硅櫕顨婇弻娑㈠Ψ閹存繃鍣介柡澶夌矙濮婄粯绗熼埀顒€顭囪閳ワ箓宕奸妷銉э紵濡炪倖鏌ㄥΣ鍫ユ晲婢跺﹪鍞堕梺缁樻煥婢у海绮诲顒夋富闁靛牆妫涙晶閬嶆煕鐎ｎ剙浠辩€殿噮鍋婇弻鍡楊吋閸℃瑥骞愰梻浣侯焾閺堫剟銆冮崨顔绢洸濡わ絽鍟埛鎺楁煕鐏炴崘澹橀柍褜鍓涢崗姗€骞婂Δ鍛唶闁哄洨鍋熼敍娑㈡⒑闂堟单鍫ュ疾濞戞艾顥氶柛褎顨嗛埛鎴炪亜閹哄棗浜剧紓浣割槹閹告娊骞冮崸妤婃晪闁逞屽墴楠炲啳銇愰幒鎴犵暢闂佸湱鍎ら崹鐢糕€栫€ｎ亖鏀介柍钘夋娴滀粙鏌涢妸锕€鈻曟鐐差樀楠炴牗鎷呴崫銉ф綁闂備礁澹婇崑鍛崲閸℃稑绠洪柡鍥ュ灪閳锋垹绱撴担鑲℃垿鍩涢幒妤佺厓鐎瑰嫭澹嗘晶锔锯偓娈垮櫘閸嬪懐鎹㈠┑瀣倞闁靛ě鍐ㄧ闂傚倷娴囬～澶愬磿瀹曞洤顥氭い鎾跺仧閺嗗棝鏌熼梻瀵稿妽闁绘挻娲熼幃妤呮晲鎼粹€茬凹閻庤娲栭惉濂稿焵椤掑喚娼愭繛鍙夌墱缁辩偞绻濋崶銉㈠亾娴ｅ壊娼╅悹鍝勬惈缁愭稑顪冮妶鍡樺暗闁革絻鍎靛畷銉モ枎閹邦喚鐦堥梺姹囧灲濞佳冩毄闂備浇妗ㄧ粈渚€骞夐敓鐘茬疄闁靛ň鏅滈崑銊╂⒒閸喓鈯曢柣搴㈠▕閹鐛崹顔煎濡炪倧瀵岄崹鍫曞箖閹稿簺鍋呴柛鎰ㄦ櫇閸樼數绱撻崒娆戝妽闁挎艾菐閸ヨ泛鐏﹂柡宀嬬秮瀵剟骞愭惔顔斤紗闂備浇顕栭崰鏍礊婵犲洤绠圭憸鐗堝笚閸嬶繝鏌熷▓鍨灍妞ゆ挸顭峰缁樻媴閸涘﹤鏆堝┑顔硷工椤嘲鐣锋导鏉戝唨妞ゆ挾鍋犻幗鏇炩攽閻愭潙鐏︽い顓炲€块幃銏ゆ惞閸︻叏绱叉繝纰樻閸ㄧ敻濡撮埀顒勬煕鐎ｎ偅宕屾鐐叉喘椤㈡﹢鎮㈠畡棰佺礋婵犵數濮烽弫鍛婃叏閹绢喖绠犻煫鍥ㄤ緱閺佸倿鏌ｅΟ鍏兼毄缁炬儳鍚嬮妵鍕籍閸屾稒鐝梺鐟板暱濞诧箓銆冮妷鈺傚€烽柡澶嬪灥椤秹姊虹拠鈥崇仭婵☆偄鍟幈銊╁焵椤掑嫭鐓冮柕澶涚畱婢ь垰霉閻撳孩顥炵紒缁樼箞閹粙妫冨ù璁圭稻閵囧嫰寮埀顒勬偋閻樿尙鏆﹂柡澶庮嚦閺冨牆绀嬫い鎰╁€楅埥澶愭⒒閸屾艾鈧绮堟笟鈧獮澶愭晸閻樿尪鎽曢梺闈浤涢崨顖滃帬闂備礁鎲￠幐椋庣矆娓氣偓瀹曠懓鈹戠€ｎ偄鈧敻鏌ㄥ┑鍡涱€楅柡瀣〒缁辨帡鎮╅悜妯煎涧婵烇絽娲ら敃顏呬繆閸洖纾兼慨姗嗗亜椤ユ氨绱撻崒姘偓鐑芥嚄閼稿灚鍙忓瀣閸ㄦ繃銇勯弽顐粶濡楀懘姊洪崨濠冨闁搞劍澹嗛悮鎯ь吋婢跺鍘遍梺闈涱槶閸庢煡藟閻愮儤鍋ㄦい鏍ュ€楃弧鈧梺?Firebase 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵割槮缁炬儳缍婇弻鐔兼⒒鐎靛壊妲紒鐐劤缂嶅﹪寮婚悢鍏尖拻閻庨潧澹婂Σ顔剧磼閻愵剙鍔ゆ繝鈧柆宥呯劦妞ゆ帒鍊归崵鈧柣搴㈠嚬閸欏啫鐣峰畷鍥ь棜閻庯絻鍔嬪Ч妤呮⒑閸︻厼鍔嬮柛銊ョ秺瀹曟劙鎮欓悜妯轰画濠电姴锕ら崯鎵不閼姐倐鍋撳▓鍨灍濠电偛锕顐﹀礃椤旇偐锛滃┑鐐村灦閼归箖鐛崼鐔剁箚闁绘劦浜滈埀顑惧€濆畷銏＄鐎ｎ亜鐎梺鍓茬厛閸嬪棝銆呴崣澶岀瘈闂傚牊渚楅崕鎰版煟閹惧瓨绀冪紒缁樼洴瀹曞崬螖閸愵亶鍞虹紓鍌欒兌婵灚绻涙繝鍥ц摕鐎广儱鐗滃銊╂⒑閸涘﹥灏扮紒璇茬墦閺佹劙鎮欓弶鎴犵獮婵犵數鍋炵敮妤€顪冮挊澶樺殨濞寸姴顑傞埀顒佺墵閸╁嫰宕橀埞澶歌檸闂備浇妗ㄧ粈渚€宕愰崸妤€绠板┑鐘插暙缁剁偛鈹戦悩鎻掝仹缂併劌鐡ㄧ换婵嬫偨闂堟稐绮跺銈嗘处閸欏啫鐣烽姀锝庢▌闂佽鍠楀鑺ヤ繆閹间礁鐓涢柛灞剧煯缁ㄧ敻姊绘笟鈧褔藝椤愶箑鐤炬繝濠傜墛閸嬪倹绻涢幋娆忕仾闁绘挻娲熼弻鏇熷緞閸繄浠惧┑鐐叉噹閹冲酣婀侀梺缁樏壕顓㈡儗閹烘鐓涢悘鐐垫櫕鍟稿銇卞倻绐旈柡灞剧洴楠炴﹢寮堕幋婵囨嚈婵°倗濮烽崑娑㈠疮閺夋垹鏆﹂柟鐑樺焾濞尖晠寮堕崼娑樺妞ゆ梹娲熼弻锝夋偄閸濄儳鐓傛繝鈷€鍕垫畼闁轰緡鍣ｉ獮鎺楀棘濞嗙偓顥″┑鐘绘涧閸婃悂骞夐敓鐘冲亗闁绘柨鍚嬮悡娆撴⒑椤撱劎鐣卞褍顭烽弻娑㈠Χ閸パ勭亪闂佸搫鏈粙鎴︼綖濠婂牆鐒垫い鎺嗗亾妞ゎ厼娲╅ˇ褰掓煕閳哄啫浠辨鐐差儔閺佸倿鎸婃径鍡椾壕闁绘垼濮ら悡鐘电棯閺夊灝鑸瑰褜鍠楅妵鍕晲閸℃ǜ浠㈠┑顔硷龚濞咃綁骞忛悩缁樺殤妞ゆ帒鍋嗛崬鍦磽閸屾瑦绁版い鏇嗗洦鍋嬮柛鈩冧緱閺佸鏌ㄥ┑鍡╂Ц缂佺姷鎳撻湁闁挎繂娲﹂崵鈧繛瀛樼矋缁挸顫忛搹瑙勫厹闁告侗鍘哄Ч妤呮⒑缁嬫鍎愭い顓炴喘閹? messages/${chatId}`);

            stopCurrentChatListener = onChildAdded(q, (snap) => {
                const msg = snap.val();
                console.log(`DEBUG [Thread]: 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵割槮缁炬儳缍婇弻鐔兼⒒鐎靛壊妲紒鐐劤缂嶅﹪寮婚悢鍏尖拻閻庨潧澹婂Σ顔剧磼閻愵剙鍔ょ紓宥咃躬瀵鎮㈤崗灏栨嫽闁诲酣娼ф竟濠偽ｉ鍓х＜闁绘劦鍓欓崝銈囩磽瀹ュ拑韬€殿喖顭烽弫鎰緞婵犲嫷鍚呴梻浣瑰缁诲倿骞夊☉銏犵缂備焦顭囬崢閬嶆⒑闂堟稓澧曢柟鍐查叄椤㈡棃顢橀姀锛勫幐闁诲繒鍋涙晶钘壝虹€涙ǜ浜滈柕蹇婂墲缁€瀣煛娴ｇ懓濮嶇€规洖宕埢搴∥熼幁宥嗘皑缁辨捇宕掑▎鎺戝帯闂佺顑嗛幑鍥х暦閺囥垹绀冪€瑰壊鍠氶崝鐑芥⒑鐠恒劌鏋斿┑顔芥尦閹锋垿鎮㈤崗鑲╁弳濠电娀娼уΛ顓炍ｉ崨濞夸簻妞ゆ劑鍨洪崵鍥煛鐏炵偓绀夌紒鐘崇⊕缁绘繈宕橀埡鍐ㄧ悼闂傚倷绀侀幉鈥愁潖瑜版帒绠栭柛灞惧嚬濞兼牠鏌涘┑鍡楃彅鐟滄柨鐣烽幆閭︽Х闂佺顑嗛幐姝岀亙闂佸憡渚楅崢楣冩晬濞戙垺鈷戦悷娆忓缁€鍐煕閳哄倻澧柣锝囧厴瀹曪絾寰勫畝鈧惁鍫ユ⒒閸屾氨澧涚紒瀣笒椤斿繐鈹戦崼銏紲闂佹娊鏁崑鎾绘煕鐎ｎ偅宕屾慨濠勭帛閹峰懏绗熼婊冨Ъ闂備礁鎼悧婊堝礈濞戙垹绀嗛柟鐑樺灩閺嗗棝鏌涢弴妤佹澒闁稿鎹囧畷鎺懶掗鐔搞仢妞ゃ垺妫冨畷銊╊敂閸涱収浼栭梻鍌氬€烽懗鍫曘€佹繝鍥х；闁圭増婢樼壕缁樼箾閹寸偟鎳佺紒璇叉閳规垿宕掑顓炴殘闂佺粯鎸诲ú鏍煘閹达附鍋愰柟缁樺坊閸嬫捁銇愰幒鎴狅紱闂侀潧锛忛埀顒勫磻閹炬枼鏋旈柛顭戝枟閻忓牆顪冮妶搴″箻闁稿繑锚椤曪綁顢曢敃鈧粻娑欍亜閹捐泛浠х紒鎰仦缁绘繈鎮介棃娴躲垽鎮楀☉鎺撴珖缂佽京鍋ゅ畷鎺楁倷缁瀚藉┑鐐存尰閸╁啴宕戦幘瀵哥濞达絽鍟块幊蹇撶暦閺屻儲鐓曢柍鈺佸暟閳藉鏌ｉ妶鍥т壕缂佺粯绻堝Λ鍐ㄢ槈閸楃偛澹堢紓鍌欒閸嬫挸顭块懜闈涘闁绘挻娲樼换婵嬫濞戞﹩浠奸梺鍛婃煟閸婃鎯€椤忓牆绠查柟閭﹀弾濡嫰姊婚崶褜妯€闁哄被鍔岄埞鎴﹀幢濡儤顏￠梻浣筋嚃閸ㄤ即鎮ч幘鎰佸殨濞寸姴顑嗛弲鎼佹煟濡粯鐏遍柟閿嬫そ濮婅櫣绱掑Ο璇茬濠电偞鎸抽ˉ鎾跺垝閺冨牊鎯為柛锔诲幘閿涙粓姊虹紒妯忣亞澹曢鐔告珷闁汇垹鎲￠悡鏇㈡煏婵炵偓娅囬柣锝嗘そ閺屸剝鎷呯粙鎸庢閻庤娲樼敮鎺楋綖濠靛鍤嬮柛顭戝亝閻ｈ埖绻濋悽闈浶㈤柣銉ヮ樀瀵埖鎯旈幘鍏呭闂佽鍎虫晶搴ㄦ儗閸℃褰掓晲閸モ斂鈧﹪鏌＄€ｎ偅鈷愮紒缁樼箞濡啫鈽夐崡鐐插闂備焦濞婇弨杈╂暜閿熺姴钃熸繛鎴炵煯濞岊亪鏌ｉ幇闈涘婵炲牄鍊栫换婵嬪煕閳ь剟宕熼婧惧亾閹烘梻纾奸弶鍫涘妼缁椦囨煃瑜滈崜銊х礊閸℃稑纾婚柛鏇ㄥ灡閸婂爼鏌熺紒銏犳灍闁绘挶鍎茬换婵嬫濞戞艾顣烘繛瀵稿У缁捇寮婚敐澶嬫櫜闁糕剝鐟ч悿鍕⒑缁洘鏉归柛瀣尭椤啴濡堕崱妤冪懆闂佺锕ょ紞濠囨晲閻愬搫鍗抽柕蹇ョ磿閸樼敻姊虹拠鈥崇€婚柛娑卞枟閸犳牕鈹戦悩鎰佸晱闁搞劑浜堕獮鎰板箮閽樺鎽曢梺缁樻濞咃絿澹曢崗闂寸箚妞ゆ牗绻冮鐘绘煟閻旂濮堢紒缁樼箞婵偓闁挎繂瀛╃紞鍫濃攽閻愯泛鐨洪柛鐘查叄閿濈偠绠涢弴鐘碉紲濠碘槅鍨甸褔顢撻幘缁樷拺闁诡垎鍛唶缂備胶濮寸粔褰掑春閳ь剚銇勯幒鍡椾壕闂佹寧娲︽禍顏勵嚕鐠囨祴妲堥柕蹇曞Х椤旀帡鏌ｆ惔銊︽锭闁硅姤绮撻幃楣冩嚃閳哄啰锛濇繛鎾磋壘濞层倝寮搁悢鍏肩厽闁绘柨寮跺▍濠囨煟濞戝崬娅嶆鐐村浮楠炲﹪鎼归锝傛嫻闂佺懓鍢查幊妯侯潖瑜版帒绠涙い鏃囧Г椤斿倿姊婚崒姘偓鎼佸磹閻戣姤鍤勯柛鎾茬閸ㄦ繃銇勯弽顭戝殼婵炴垯鍨圭粈鍐┿亜閺冨洤浜归柡灞熷洦鈷戦柤娴嬫杹閹凤繝鏌涢幘纾嬪闁伙絿鍏樺濠氬Ψ閿旀儳骞堥梻浣规灱閺呮盯宕导鏉戠厐闁哄洢鍨洪悡鐔兼煙閹咃紞缂佺姴顭烽弻锛勪沪閸撗勫垱濡炪們鍨哄ú鐔煎极閹版澘鐐婇柍鍝勫暞濞堝ジ姊婚崒娆戠獢闁逞屽墰閸嬫盯鎳熼娑欐珷妞ゆ洍鍋撻柡宀€鍠撻幏鐘侯槾缁炬崘娉曠槐鎺楊敊绾板崬鍓板銈嗘尭閵堢鐣烽柆宥呯疀妞ゆ垼娉曢崙褰掓⒒閸屾瑧顦﹂柟璇х節瀹曟繆绠涘☉妯活棟婵炴挻鍩冮崑鎾搭殽閻愯尙绠婚柟鐓庣秺瀹曠兘顢橀悪鍛棷闂傚倷鑳堕…鍫ュ嫉椤掑嫭鍋＄憸鏂跨暦濠靛棭鍚嬪璺侯儑閸欏棝姊洪崫鍕妞ゃ劌妫楅埢宥夊川鐎涙鍘撶紓鍌欑劍钃辩€规洖鐬奸埀顒侇問閸ｎ噣宕抽敐鍛殾濠靛倸鎲￠崑鍕煕濠靛棗顏╂慨瑙勭叀濮婂宕掑▎鎴М闂佸湱鈷堥崑鍕弲闂侀潧绻堥崐鏇犵矆婢舵劖鍊甸柨婵嗛閺嬬喖鏌ｉ幒鏇炐撻柕鍥у瀵粙濡搁妶鍥╃畳婵犵數鍋涢悧鍛垝濞嗘挸钃熼柨婵嗩槸缁犳稒銇勯幘璺轰户缂佷胶鍏樺娲传閸曨剨绱ㄧ紓鍌氱С缁舵艾顕ｆ繝姘労闁告劏鏅涢鎾绘煟閻斿摜鎳冮悗姘煎墰婢规洟骞庨懞銉㈡嫼闁荤姴娲犻埀顒冩珪閻忊偓闂備礁鎼幊鎰箾閳ь剚顨ラ悙璇ц含闁诡喒鏅涚叅缂備焦蓱濞呭矂姊绘笟鈧埀顒傚仜閼活垱鏅堕鐐寸厵濞撴艾鐏濇慨鍌炴煛娴ｇ鈧潡鐛€ｎ喖绠抽柡鍐ㄥ€婚弳浼存⒒閸屾瑨鍏岀紒顕呭灦瀹曟繈鏁傞悾宀婃锤濠电姴锕ら悧鍡涙倿閸偁浜滈柟鍝勭Х閸忓苯顭胯娴滄繈濡甸崟顖氭閻犳亽鍔庨澶岀磽娴ｈ櫣甯涚紒璇插€块敐鐐测攽鐎ｅ灚鏅㈤梺绋跨焿婵″洭鐛姀銈嗏拻闁稿本鐟ㄩ崗宀勬煙閾忣偅灏伴柡鍛埣閹墽浠﹂挊澶屼喊婵＄偑鍊栭悧婊堝磻閻愬搫纾婚柛宀€鍋為悡鏇㈡煙娴煎瓨娑ч柡瀣枛閺屾稓鈧急鍐ㄢ拤缂備胶绮惄顖氱暦閸楃倣鏃堝礃椤忓秴鏁瑰┑锛勫亼閸婃洜鎹㈤崱娑樼柧闁绘顕ч拑鐔兼煥濠靛棛澧㈤柣銈傚亾闂備礁鎼崯鐘诲磻閹剧粯鍊堕煫鍥ュ劤閻ｇ敻鏌＄仦绯曞亾瀹曞洦娈曢梺閫炲苯澧寸€规洑鍗冲浠嬵敇濠ф儳浜惧ù锝囩《閺嬪酣鏌熼悙顒佺稇濞寸姴銈搁弻锝堢疀閺囩偘娌梺绋块閸熷潡鍩㈠鍜佹僵闁煎摜鏁搁崢浠嬫煙閸忚偐鏆橀柛鈺佸瀹曨垵绠涘☉娆戝幈闂佺粯锚绾绢厽鏅堕悽鍛婄厵妞ゆ柨鎼崝婊呯磼鏉炴壆鐭欑€规洦鍋婃俊鐑藉Ψ瑜嬮崑濠囨⒒娴ｇ瓔鍤欓柛鎴犳櫕缁辩偤宕卞☉妯肩崶濠德板€曢幊搴ｅ婵犳碍鐓欓柣妤€鐗婄欢鑼磼閻欐瑥娲﹂悡鏇熴亜閹板墎鎮奸柍钘夘槸閳规垿鍨鹃懠顒傜厯闂佸搫鑻粔鍓佹閹烘嚦鐔兼嚒閵堝孩效濠电姵顔栭崰鏍晝閵堝鈧箑鐣￠幍顔芥闂佸湱鍎ら崺鍫濐焽閳哄倶浜滈柟杈剧稻椤ュ霉濠婂牏鐣洪柡宀嬬秮楠炲鏁愰崨鍛崌閺屾盯濡堕崨顓т純闂佸搫鏈惄顖炵嵁濮椻偓閹崇娀顢楁径瀣撴粓姊绘担瑙勫仩闁告柨绉堕幑銏ゅ礃椤斿槈锕傛煕閺囥劌鐏犻柛鎰ㄥ亾婵＄偑鍊栭崝锕€顭块埀顒勬煛婢舵ê寮慨濠冩そ閺屽懘鎮欓懠璺侯伃婵犫拃灞芥珝闁哄本鐩幃銏ゅ川婵犲嫮鈻忛梻浣风串缁插潡宕楀Ο璁崇箚婵繂鐭堝Σ鐑芥⒑缁嬫鍎愰柟鍛婃倐閸┿儲寰勬繛鐐€洪梺鎯ф禋閸嬪嫰鎮橀妷鈺傜厓閻犲洩灏欐晥閻庤娲栭悥濂搞€佸Δ浣瑰闁告瑥顦褰掓⒒閸屾艾鈧悂宕愰幖浣瑰亱濠电姴娲ょ粈鍐煠婵劕鈧牠锝為弴銏＄叆闁绘柨鎼牎闂佺粯鎸搁崯浼村箟缁嬫鐓ラ柛顐ｇ箘椤︻參姊虹紒妯活棃妞ゃ儲鎹囧鎶芥晝閸屾稓鍘甸柡澶婄墕婢т粙鎮炬潏鈺冪＜闁绘ê鎼崥鍦磼鏉堛劍灏伴柟宄版嚇閹倿姊归幇顔跨箲濠电姷顣藉Σ鍛村磻閸曨垰鐤い鎰剁畱閻撴﹢鏌熸潏楣冩闁稿﹦鍏橀弻鈩冨緞鐎ｎ亞浠兼繛瀵稿У閹倸顫忛搹鍦＜婵妫欓悾宄扳攽閻愭彃绾фい顓炴川閸掓帞鈧綆鍠栫粻铏繆閵堝拑鏀婚柡鍜佷邯濮婃椽鏌呴悙鑼跺濠⒀冪摠椤ㄣ儵鎮欓幓鎺撴闁剧粯鐗犻弻娑㈠箛閵婏附鐝旈梺鍝勵儏閸婂灝顫忓ú顏勫窛濠电姴鍟ˇ鈺呮⒑閸涘﹥灏伴柣鈺婂灦瀵偄顓奸崪浣瑰缓闂侀€炲苯澧い顐㈢箰鐓ゆい蹇撳缁愭稒绻濋悽闈浶㈤柛鐔跺嵆瀹曪綁宕卞☉娆屾嫽婵炶揪绲块…鍫㈣姳閼姐倗纾界€广儱瀚ˇ锕傛煟閿濆懎妲婚悡銈嗐亜韫囨挸顏柛鏃撶畱椤啴濡堕崱妤冪憪闂傚倸瀚粔鐢电矉瀹ュ拋鐓ラ柛顐ゅ枔閸樼敻姊洪崨濠勭畵閻庢凹鍠栭弳鈺呮⒒娴ｄ警鐒剧紒缁樺姍閹矂宕掗悙鑼舵憰閻庡箍鍎遍ˇ浠嬪极瀹ュ棛绠鹃柟瀵稿仧閹冲懏銇勯敂鍨祮婵﹪缂氶妵鎰板箳閹惧瓨娈搁梻浣规偠閸斿繐鈻斿☉鈶┾偓锕傚炊椤忓棛鏉稿┑鐐村灦椤倿鍩￠崘鈺佹瀾闂婎偄娲︽笟妤呭极婵犲洦鐓涢柛銉ｅ劚閻忣亪鏌嶉柨瀣伌闁哄本绋戦埥澶婎潨閸噥鏆紓鍌欑閻栧吋绂嶉崼鏇炶摕婵炴垯鍨洪崑鎰偓瑙勬礀濞村倿寮抽敓鐘斥拺闁告繂瀚崳褰掓煟閺嵮佸仮妤犵偛鍟粋鎺斺偓锝庝簻缁愭稒绻濋悽闈浶㈤悗姘煎墴閻涱噣骞囬悧鍫㈠幗闁硅偐琛ラ埀顒€鍟挎潏鍛存⒑缁嬫鍎愰柟鐟版喘楠炲啫螖閸涱喗娅滈柟鑲╄ˉ閳ь剚鍓氬楣冩⒑閽樺鏆ｅù婊嗘硾椤繒绱掑Ο璇差€撶紓浣圭☉椤戝懎鈻撻幇鐗堚拺闁硅偐鍋涙俊鑲┾偓瑙勬处閸撴繈鎮樼€ｎ喗鈷戦柛娑橈工婵偓闂佸搫鎳忕划鎾崇暦閿濆牏鐤€婵炴垶鐟ч崢鎾绘偡濠婂嫮鐭掔€规洘绮岄～婵堟崉娴ｆ洩绠撻弻娑㈠即閵娿儳浼囬梺杞扮閸燁垶濡甸崟顖氱疀闁宠桨鑳舵禒鐓幬旈悩闈涗粶妞ゆ垵顦～蹇涙惞閸︻厾鐓撳┑鐐叉閸庢娊宕滈柆宥嗏拺闁革富鍘介崵鈧┑鐐叉▕閸欏啴骞冩导鎼晪闁逞屽墴閻涱噣骞掑Δ鈧粻鐘绘煣韫囷絽浜濋柍閿嬪姍閺岀喎鐣￠悧鍫濇畻閻庤娲﹂崑濠傜暦閻旂⒈鏁冮柕鍫濇处濠㈡牠姊婚崒姘偓鎼佸磹閹间礁纾瑰瀣椤愯姤鎱ㄥ鍡楀⒒闁绘帞鏅幉鎼佸籍閸繄浼嬮梺鎸庢礀閸婃悂鏌嬮崶顒佺厪濠㈣泛鐗嗛崝銈夋煥濞戞瑧鎳冮柍瑙勫灦楠炲﹪鏌涙繝鍐╃妤犵偛锕ㄧ粻娑樷槈濡》绱? ${snap.key}, 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵割槮缁炬儳缍婇弻鐔兼⒒鐎靛壊妲紒鐐劤缂嶅﹪寮婚悢鍏尖拻閻庨潧澹婂Σ顔剧磼閻愵剙鍔ょ紓宥咃躬瀵鎮㈤崗灏栨嫽闁诲酣娼ф竟濠偽ｉ鍓х＜闁诡垎鍐ｆ寖闂佺娅曢幑鍥灳閺冨牆绀冩い蹇庣娴滈箖鏌ㄥ┑鍡欏嚬缂併劌銈搁弻鐔兼儌閸濄儳袦闂佸搫鐭夌紞渚€銆佸鈧幃娆撳箹椤撶噥妫ч梻鍌欑窔濞佳兾涘▎鎴炴殰闁圭儤顨愮紞鏍ㄧ節闂堟侗鍎愰柡鍛叀閺屾稑鈽夐崡鐐差潻濡炪們鍎查懝楣冨煘閹寸偛绠犻梺绋匡攻椤ㄥ棝骞堥妸鈺傚€婚柦妯侯槺閿涙盯姊虹紒妯哄闁稿簺鍊濆畷鎴犫偓锝庡枟閻撶喐淇婇婵嗗惞婵犫偓娴犲鐓冪憸婊堝礂濞戞碍顐芥慨姗嗗墻閸ゆ洟鏌℃径瀣劸婵炲皷鏅犲鍫曞醇濮橆厽娈ㄩ梺闈涚箞閸婃牠鍩涢幒鎳ㄥ綊鏁愰崼顐ｇ秷闂佺顑囨繛鈧柡灞剧⊕閹棃濮€鎺虫禒銏ゆ倵鐟欏嫭绀冪紒顔芥崌瀵偊宕橀鑲╋紲濠殿喗锕╅崢楣冨焵椤掑澧存慨濠冩そ楠炴牠鎮欓幓鎺懶ら梻浣告啞閹歌鐣濋幖浣哥畺闂勫洨绮诲☉妯锋婵﹩鍓欑徊濂告⒒娴ｈ鍋犻柛搴灦瀹曟繂顓奸崶鈺冪劶闂侀€炲苯澧撮柡灞剧洴閹垽宕ㄦ繝鍌楀亾閹邦厽鍙忓┑鐘插暞閵囨繃顨ラ悙鏉戝闁诡垱妫冮弫鎰板礃閿濆懍澹曢梺鍦劋椤ㄥ棝鎮￠弴銏＄厽婵☆垵娅ｉ敍宥咁熆瑜滄禍婵嬪Φ閸曨垼鏁冮柕蹇嬪灮椤斿洭鏌ｉ幘鍗炩偓鏍Φ閸曨喚鐤€闁圭偓娼欏▍锝呪攽閻愯尙澧涢柛鏃€鐟ラ～蹇撁洪鍕槰闂佸憡鐟ラˇ宕囨兜閳ь剟姊绘担渚劸妞ゆ垵妫濋獮鎰偅閸愩劎鍔﹀銈嗗笂閼冲爼銆傞弻銉︾厽闁冲搫锕ら悘鐘炽亜椤愩垻绠伴悡銈嗐亜韫囨挸顏╃紒鎰⊕缁绘繈鎮介棃娴躲垽鏌涢悤浣镐喊婵☆偄瀚濂稿炊閳哄喛绱冲┑鐐舵彧缁插潡鎮洪弮鍫濆惞婵炲棙鎸婚悡鏇㈡煟閺傛寧鍟為悘蹇ョ畵閺? ${msg?.senderId}`);
                if (!loadedMsgKeys.has(snap.key)) {
                    loadedMsgKeys.add(snap.key);
                    if (isSyncing) {
                        syncBuffer.push({ msg, key: snap.key });
                    } else {
                        appendMsg(msg, snap.key, chatId, true);
                        
                        const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 600;
                        if (isAtBottom || msg.senderId === currentUser.id) {
                            chatBox.scrollTop = chatBox.scrollHeight;
                        }
                    }
                }
            }, (error) => {
                console.error(`DEBUG [Thread]: 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵割槮缁炬儳缍婇弻鐔兼⒒鐎靛壊妲紒鐐劤缂嶅﹪寮婚悢鍏尖拻閻庨潧澹婂Σ顔剧磼閻愵剙鍔ょ紓宥咃躬瀵鎮㈤崗灏栨嫽闁诲酣娼ф竟濠偽ｉ鍓х＜闁绘劦鍓欓崝銈囩磽瀹ュ拑韬€殿喖顭烽弫鎰緞婵犲嫷鍚呴梻浣瑰缁诲倿骞夊☉銏犵缂備焦顭囬崢閬嶆⒑闂堟稓澧曢柟鍐查叄椤㈡棃顢橀姀锛勫幐闁诲繒鍋涙晶钘壝虹€涙ǜ浜滈柕蹇婂墲缁€瀣煛娴ｇ懓濮嶇€规洖宕埢搴∥熼幁宥嗗哺濮婂宕掑▎鎺戝帯濡炪値鍘奸悧蹇涘箖椤曗偓椤㈡洟鏁冮埀顒傜矆婢舵劕绠规繛锝庡墮婵¤偐绱掗悩闈涙灁缂佽鲸甯為埀顒婄秵閸嬫帡宕曢妷鈺傜厱婵﹩鍓﹂崕蹇斻亜椤撯剝纭堕柟鐟板缁楃喖顢涘顒€顥嶆繝鐢靛仜椤曨厽鎱ㄩ幘顔嘉х紒瀣儥濞兼牠鏌ц箛鎾磋础缁炬儳鍚嬫穱濠囶敍濠靛浂浠╂繛瀵稿Т閵堢顫忓ú顏呭€婚柍杞扮閳峰鈹戦埥鍡椾簻闁哥噥鍋婇、姘舵晲婢舵ɑ鏅濋梺鎸庢磵閸嬫挻顨ラ悙顏勭仾缂佺粯鐩獮瀣倷閸偄娅橀梻浣告啞閿曘垺绂嶇捄渚綎婵炲樊浜滄导鐘绘煕閺囥劌澧柛瀣Ч濮婃椽宕ㄦ繝鍐弳闂佸搫鐗滈崜鐔奉嚕閺屻儱閱囬柡鍥ュ妽閺咁剙鈹戦悙鏉戠仸婵ǜ鍔戦、娆撳即閵忊檧鎷洪梺鍛婄☉閿曪絿娆㈤柆宥嗙厱婵☆垰婀遍惌娆戔偓瑙勬礃濠㈡鐏掔紓鍌欑劍閿氱€殿喗瀵х换婵嬫偨闂堟刀銏ゆ煕閻曚礁鐏﹀┑锟犳涧閳规垿宕堕敂鍓х暰婵＄偑鍊栭崝鎴﹀垂瑜版帒姹叉繛鍡樻尰閻撳啴鏌﹀Ο渚▓婵℃彃鎲￠妵鍕敃閿濆洨鐤勫銈冨灪椤ㄥ棗顕ラ崟顓涘亾閿濆骸浜炴俊鍙夌墪閳规垿鎮╁▓鎸庢缂備浇椴稿ú鐔风暦閹达箑绠ｉ柨鏇楀亾缁炬儳婀遍幉姝岀疀濞戞鍔﹀銈嗗笒鐎氼厼鈽夎閺岋綁顢橀悙娴嬪亾閹间焦鍋╅柣銈庡灛娴滃綊鏌熼悜妯诲暗闁告柨鐖奸幃妤呯嵁閸喖濮庨梺鍝ュ枔婵炩偓鐎规洘鍨块獮妯尖偓娑櫭鎾绘⒑闂堚晛鐦滈柛姗€绠栭幆渚€宕奸妷锔规嫼缂備礁顑嗙€笛冿耿閻楀牄浜滈柕濞垮劜椤ャ垻鈧鍣崜鐔煎春閳ь剚銇勯幒鎴濐仾闁抽攱甯掗湁闁挎繂鐗婇鐘绘偨椤栨稓娲撮柡灞诲姂瀵潙螖娴ｅ湱褰嬮柣搴ゎ潐濞叉垿宕￠崘宸殨濞寸姴顑愰弫鍥煟閺傝法娈遍柛瀣崌瀹曞ジ寮撮悢鍙夊婵＄偑鍊栧濠氬磻閹惧墎纾煎璺烘湰閺嗩剟鏌熼鍡欑瘈鐎殿喗鎸虫慨鈧柨娑樺鐢姊绘担鍛婂暈缂佽鍊婚埀顒佸嚬閸撶喖宕洪埀顒併亜閹烘垵鈧崵鏁☉銏＄厸闁告侗鍘鹃崺锝夋煙椤旂偓娅曢柛鐘诧工铻ｉ弶鐐存緲椤ユ岸姊洪懡銈呮瀾闁荤喆鍎抽埀顒佸嚬閸樺墽鍒掗崼銉ョ妞ゅ繐妫涢敍婊堟煟閻樺弶绌块悘蹇旂懄閺呭爼寮撮悢缈犵盎闂佸搫娴傛禍鐐电矙閼姐倗纾奸柛灞剧☉缁椦囨煃瑜滈崜銊у緤娴犲鍊舵慨妯挎硾閻ら箖鏌ㄥ┑鍡╂Ч闁抽攱鍨圭槐鎾存媴婵埈浜濋幈銊﹀緞鐎ｃ劋绨婚梺鎸庣箓妤犳悂寮搁妶鍡曠箚闁告瑥顦慨宥夋煙椤旇崵鐭欑€规洏鍔嶇换娑㈡倷椤掆偓椤忓綊姊婚崒娆愮グ鐎规洜鏁诲畷浼村箛椤掑鍞靛┑顔姐仜閸嬫挻顨ラ悙鎻掓殻妤犵偛顑夐弫鍌炴偩鐏炶棄绠洪梻鍌欑劍鐎笛呮崲閸屾粏濮冲┑鍌氭啞閻掕姤銇勯弽銊ヮ棜闁稿鎸鹃幉鎾礋椤掑偆妲扮紓鍌欐祰椤曆囧磹閸фぜ鈧礁顫滈埀顒€鐣峰Δ鍛亗閹艰揪绲块悰顕€姊虹拠鎻掑毐缂傚秴妫欑粋宥呪枎閹达絽小闂佸壊鐓堥崑鍡欏姬閳ь剟姊哄Ч鍥х伈婵炰匠鍕浄婵犲﹤瀚换鍡樸亜閹板墎鎮奸柟鍐叉处椤ㄣ儵鎮欓弶鎴濐潔缂備胶绮换鍌烇綖濠靛鏁嗛柛宀嬪娑撴煡姊婚崒娆戭槮濠㈢懓锕幃锟犲醇閵夈儳锛涢梺绯曞墲閻熝勭▔瀹ュ憘鏃堟晲閸涱厽娈查梺缁樻尰閻熲晠骞冨Δ鍛仺婵炲牐娉曢崝鍛婄箾鐎电顫掗柛銉ｅ妿閸樼敻姊洪幆褎绂嬮柛瀣閹便劌顓兼径瀣幐閻庡厜鍋撻悗锝庡墰琚︽俊銈囧Х閸嬬偟鏁垾鎰佸殨妞ゆ洍鍋撻柛鈹惧亾濡炪倖宸婚崑鎾绘煃鐠囪尙效鐎殿喗鎸抽幃鈺呮偨绾板搴婇梻浣告惈椤︻垶鎮ч崟顖氱閻忕偟鐓ぐ鎺濇晪闁逞屽墴瀵鎮㈢喊杈ㄦ櫓闁荤喐鐟ョ€氼參鎮甸弮鍫熲拺濞村吋鐟ч幃濂告煕韫囨枂顏堟偩閻戣棄绠氶梺顓ㄩ檮鍟搁梻鍌欒兌椤㈠﹤銆掕ぐ鎺戠闁告劕妯婂鏍磽娴ｈ偂鎴炲垔閹绢喗鐓曟繛鎴烇公閺€濠氭煕鎼淬垺宕屾慨濠冩そ瀹曨偊宕熼鐐╂嫛闂備礁鎲￠幐鑽ょ矙閹捐绀嗛柟鐑樺灍閺嬪酣鏌熼幆褏锛嶆い鏂匡工閳规垶骞婇柛濠冨姍瀹曟垿骞橀崜浣猴紲闂佺粯锚閸熷潡宕ú顏呯厸鐎光偓鐎ｎ剛鐦堥悗瑙勬礃閿曘垺淇婂宀婃Щ濡炪倧绲介幖顐︹€旈崘顔嘉ч幖绮光偓鑼泿闂備胶顢婂▍鏇㈡晝閵忕媭鍤曢悹鍥ф▕閸氬顭跨捄渚剰闁谎冨缁绘繈濮€閿濆棛銆愬銈嗗灦閸旀洝鐏嬮梺鐐藉劜閸撴艾銆掓繝姘厪闁割偅绻傞弳娆撴煕閺冣偓瀹€鎼佸蓟閿濆憘鏃€鎷呴悷鎵暡婵＄偑鍊ら崑鍕崲閹烘梹顫曢柟鐑樺殾閻旂儤瀚氱€瑰壊鍠掗崑鎾诲箻缂佹ǚ鎷洪梺鍛婄☉閿曪箓鍩ユ径鎰叆闁哄洦锚閸旓妇鈧娲樺ú鐔肩嵁濡偐纾兼俊顖炴敱鐎氬ジ姊绘担鍛婂暈缂佽鍊婚埀顒佸嚬閸犳寮查崼鏇熺劶鐎广儱妫涢崢閬嶆⒑鐟欏嫬绀冩繛澶嬬洴瀵鈽夊▎妯活啍闂佺粯鍔曞鍫曀夐姀鈶╁亾鐟欏嫭绀堥柛鐘崇墵閵嗕礁鈽夐姀鈩冩珳闂佺硶鍓濊摫闁绘繍鍋婂濠氬磼濞嗘帒鍘＄紓渚囧櫘閸ㄨ泛鐣峰┑瀣嵆闁绘垵妫楀▓銊╂⒑閸撴彃浜濇繛鍙夛耿瀹曟劙宕归鐘辩盎闂佸湱鍎ら崹鐢割敂椤忓牊鐓冮梺鍨儏閻忔挳鏌＄仦鍓ф创闁轰礁鍊婚幏鐘诲箵閹烘棏鍟囧┑锛勫亼閸娧呭緤娴犲瑙﹂悗锝庡墯瀹曞弶绻濋棃娑卞剰妞ゎ偄鎳橀弻宥夋寠婢跺妫ら梺鍛婃椤ユ挾妲愰幘瀵哥懝闁搞儜鍕邯闂備胶绮〃鍡涘箰閹间焦鍋╃€瑰嫰鍋婂銊╂煃瑜滈崜鐔煎Υ娴ｇ硶鏋庨柟鐐綑娴犲ジ鏌ｈ箛鏇炰哗婵☆偄瀚穱濠囧炊閵娧呯槇闂佹眹鍨藉褍鏆╅梻浣芥〃閻掞箓骞冮崒姘辨殾闁瑰瓨绺惧Σ鍫ユ煏韫囧ň鍋撻弬銉ヤ壕闁煎摜鏁哥弧鈧梻鍌氱墛娓氭宕曡箛鏇犵＜闁逞屽墯瀵板嫰骞囬鐘插箥缂傚倸鍊烽梽宥夊垂瑜版帒鍑犻柣鏂垮悑閻撶喖鏌熼幑鎰【闁哄绋掗〃銉╂倷鐎电顫у┑鐐靛帶缁绘ê鐣峰鍡╂Ь闂佹寧绋撻崰鏍ь潖濞差亜鎹舵い鎾跺枑閻濐亝绻濆▓鍨珝妞ゃ儲鎸稿嵄闁圭増婢樼粻鎶芥煛閸愩劌鈧鏁嶅鍐ｆ斀闁宠棄妫楅悘銉╂煕鐎ｎ偄濮嶉柟顔兼健瀹曠喖顢涘☉鎺撳闂佽崵濮村ú鐘诲焵椤掑啯鐝柣蹇撴缁辨挻绗熼崶褎鐏嶉梺鑽ゅ枂閸庢挳鎮樼€ｎ喗鈷戦柛娑橈工婵倿鏌涢弬娆炬Ц閸楅亶鏌涢銈呮瀺缂佽妫濋弻鏇㈠醇濠靛棭浼€濡炪倧璁ｇ粻鎾诲蓟閿濆绠婚悗娑欘焽椤︽澘鈹戦纭峰伐妞ゎ厼鍢查悾鐑藉箳閹存梹鐎婚梺瑙勬儗閸樺€熲叺闂傚倸鍊烽懗鍫曘€佹繝鍥舵晪婵犲﹤鎳忓畷鍙夌節闂堟侗鍎忛柣蹇斿▕閺屻劑寮撮悙娴嬪亾閹间胶宓侀柕蹇ョ磿缁犻箖鏌熺€电鍓遍柣鎺嶇矙閺屾稒绻濋崟顐℃濠殿喖锕ュ钘壩涢崘銊㈡閺夊牃鏅涙慨濂告⒒娴ｄ警鐒鹃悗娑掓櫆缁旂喖宕卞▎鎰垫綗闂佸搫鍟悧鍡涘础閹惰姤鐓忛煫鍥э攻椤庡棝鏌熸搴ｅ笡缂佺粯绋掑蹇涘礈瑜嶉崺宀勬⒑绾拋鍤嬬紒杈ㄦ礋楠炲繗銇愰幒鎾存闂佺粯锚绾绢參宕㈤柆宥嗙厽閹兼惌鍨崇粔鐢告煕鐎ｎ亝鍣归柣锝呭槻閻ｆ繈鍩€椤掑嫬鐒垫い鎺戝枤濞兼劖绻涢崣澶樼劷闁告帗甯掗悾婵嬪礋閸撲胶鈼ゆ繝鐢靛█濞佳囶敄閹版澘鏋侀柛鈩冾殢閻斿棝鎮瑰ú顏嗙窗閻庢碍婢橀埞鎴︻敊閼恒儯浠㈠┑顔硷功缁垶骞忛崨鏉戝窛濠电姴鍟崜鐢电磽閸屾瑧顦︽い鎴濆濞嗐垹顫濈捄铏圭暫濠殿喗銇涢崑鎾搭殽閻愬弶鍠樻い銏＄☉铻ｉ悷娆忓濞兼牠姊婚崒娆戭槮婵犫偓闁秴纾块柕鍫濐槸缁犱即鏌涘☉姗堝姛妞も晞灏欓幉鎼佹偋閸繄鐟查梺绋匡功閺佸寮婚敐澶嬪亜闁告稑锕﹂崙鈥愁渻閵堝啫鍔氱紒缁橈耿瀵鈽夐姀鈥充汗閻庤娲栧ú銈夊煕瀹€鍕€甸悷娆忓缁€鍐磼椤旇姤宕岄柣娑卞枛椤撳吋寰勫Ο缁樻珦闂備礁鎲￠幐鍡楊吋閸ヮ剚锛楁繝鐢靛Х閺佹悂宕戦悩璇茬妞ゅ繐妫楃欢銈吤归悩宸剰缂佺姾顫夐妵鍕箛閸撲焦鍋ф繝鈷€宥囩？缂佽鲸鎹囧畷鎺戭潩椤戣棄浜惧瀣捣閻棗銆掑锝呬壕濡炪們鍨洪悧鐘茬暦閸楃偐鏋庨柟閭﹀幗椤斿洭姊绘担瑙勭伇闁哄懏鐩畷顖炲煛閸愨晛搴婇梺绯曞墲缁嬫帡鎮￠悢鍏肩厪闊洤顑呴悞娲煟閹烘垵鈷旂紒杈ㄥ浮閸┾偓妞ゆ帒鍊甸崑鎾绘晲鎼粹€茬按婵炲瓨绮嶇划鎾诲蓟閳ユ剚鍚嬮柛鎰╁妼椤懏绻濋姀锝庢綈闁挎洏鍨藉璇测槈閵忊€斥偓閿嬨亜韫囨挸顏╂い顐㈡搐閳规垿顢欑涵宄颁紣闂佸湱鈷堥崑鍛村疾閵夆晜鈷戦柟鑲╁仜閸斺偓闂佸憡渚楅崜娑氬閸ф鈷掗柛灞剧懄缁佺増淇婂鐓庡闁诡喚鍋ら弫鍐磼濞戞ü妲愰梻浣告惈濞层垽宕归崷顓犱笉闁绘垶菧娴滄粓鏌熼弶璺ㄥ煟婵＄虎鍣ｉ弻宥夋煥鐎ｎ亝璇為梺鍝勬湰缁嬫挻绂掗敃鍌氱鐟滃酣宕抽鐘电＝濞达綁顥撻崝宥嗙節閵忊槄鑰块柛鈺冨仱楠炲鏁傜紒妯绘珦闂備礁鎲＄换鍌溾偓姘€鍥х；闁圭偓鏋奸弨浠嬫煕閳╁啰鎳勬繛鍫ョ畺閹嘲顭ㄩ崨顓ф毉闁汇埄鍨遍〃濠傜暦閹达箑惟闁冲搫鍊婚崢鍛婄節閵忥絾纭鹃柨鏇樺劦钘熸繝濠傚缁犲墽鈧懓澹婇崰鏍嵁閺嶎厽鎳氶柣鎰劋閻撴洟鏌熼幍铏珔濠碉繝鏀辨穱濠囧箵閹烘柨鈪甸悗娈垮枛閻栫厧鐣烽悡搴樻婵☆垯璀﹂悗椋庣磽?[${chatId}]:`, error.message);
                if (error.message.includes('permission_denied')) {
                    AppModules.Modal.alert("Permission Error", "You do not have permission to view messages in this chat.");
                }
            });

            
            setTimeout(() => {
                isSyncing = false;
                if (syncBuffer.length > 0) {
                    const batchFrag = document.createDocumentFragment();
                    syncBuffer.forEach(item => {
                        const div = UIComponents.createChatBubble(item.msg, item.key, currentUser, setupLongPress);
                        if (div) batchFrag.appendChild(div);
                        saveMessageLocal(chatId, item.key, item.msg);
                    });
                    chatBox.appendChild(batchFrag);
                }

                
                requestAnimationFrame(() => {
                    chatBox.scrollTop = chatBox.scrollHeight;
                    chatBox.style.opacity = '1';
                    
                    setTimeout(() => {
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }, 50);
                });

                syncBuffer = [];
                chatLoadingLock = null;
            }, 60);
        }

        
        window.openGallery = (encodedImages, startIdx = 0) => AppModules.Gallery.open(encodedImages, startIdx);

        window.toggleStack = (key, count, isMe) => {
            const container = document.getElementById(`stack-${key}`);
            const btn = document.getElementById(`btn-${key}`);
            const isExpanded = container.classList.contains('is-expanded');
            if (isExpanded) {
                container.classList.remove('is-expanded');
                container.style.height = '192px';
                btn.innerText = `Expand ${count}`;
                for (let i = 0; i < count; i++) {
                    const img = document.getElementById(`img-${key}-${i}`);
                    if (!img) continue;
                    let translateX = isMe ? (i * 12) : -(i * 12);
                    img.style.transform = `translateX(${translateX}px) scale(${1 - (i * 0.05)})`;
                    img.style.top = '0px';
                    img.style.opacity = i > 3 ? 0 : 1;
                }
            } else {
                container.classList.add('is-expanded');
                container.style.height = `${(192 * count) + (12 * (count - 1))}px`;
                btn.innerText = `Collapse`;
                for (let i = 0; i < count; i++) {
                    const img = document.getElementById(`img-${key}-${i}`);
                    if (!img) continue;
                    img.style.transform = `translateX(0px) scale(1)`;
                    img.style.top = `${i * (192 + 12)}px`;
                    img.style.opacity = 1;
                }
            }
        };






        

        let currentQuote = null;
        let selectedMsgData = null;
        let longPressTimer = null;

        window.handleMsgCopy = () => {
            if (!selectedMsgData) return;
            navigator.clipboard.writeText(selectedMsgData.text);
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
        };

        window.handleMsgQuote = () => {
            if (!selectedMsgData) return;
            currentQuote = { senderName: selectedMsgData.senderName, text: selectedMsgData.text };
            document.getElementById('quoteUser').innerText = currentQuote.senderName;
            document.getElementById('quoteText').innerText = currentQuote.text;
            document.getElementById('quoteArea').classList.remove('hidden');
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
            document.getElementById('u-msg').focus();
        };

        window.clearQuote = () => { currentQuote = null; document.getElementById('quoteArea').classList.add('hidden'); };

        function isSafetyBotTarget(targetId) {
            return (targetId || '').toLowerCase() === SAFETY_BOT_ID;
        }

        async function blockIfRestrictedDirectTarget(targetId) {
            if (!isSafetyBotTarget(targetId)) return false;
            await AppModules.Modal.alert("Restricted", "Safety Bot is receive-only. Users cannot send or forward messages to it.");
            return true;
        }

        window.handleMsgForward = () => {
            if (!selectedMsgData) return;
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            if (menu._hideListener) {
                document.removeEventListener('mousedown', menu._hideListener);
                document.removeEventListener('touchstart', menu._hideListener);
            }
            const list = document.getElementById('forwardUserList');
            list.innerHTML = '';
            Object.keys(ALL_USERS).forEach(id => {
                if (id === currentUser.id) return;
                if (isSafetyBotTarget(id)) return;
                const u = ALL_USERS[id];
                const div = document.createElement('div');
                div.className = "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer rounded-xl transition-colors";
                div.onclick = () => forwardTo(id);
                div.innerHTML = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" class="w-9 h-9 rounded-full shadow-sm">
                    <div><div class="font-semibold text-sm text-black dark:text-white">${escapeHTML(u.name)}</div><div class="text-xs text-gray-400">${escapeHTML(u.email)}</div></div>`;
                list.appendChild(div);
            });
            document.getElementById('forwardPicker').classList.remove('hidden');
        };

        window.closeForwardPicker = () => document.getElementById('forwardPicker').classList.add('hidden');

        async function forwardTo(targetId) {
            if (await blockIfRestrictedDirectTarget(targetId)) return;
            const chatId = getChatId(currentUser.id, targetId);
            const forwardText = `[Forwarded from ${escapeHTML(selectedMsgData.senderName)}]: ${escapeHTML(selectedMsgData.text)}`;

            // 1. Send the message
            await push(ref(db, `messages/${chatId}`), { senderId: currentUser.id, senderName: currentUser.name, text: forwardText, type: 'text', timestamp: serverTimestamp() });

            // 2. Critical Fix: Update interaction record for both users so chat appears in sidebars
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

                    // 1. Position it invisibly first to prevent sliding transition
                    menu.style.transition = 'none';
                    menu.style.opacity = '0';
                    menu.classList.remove('hidden');

                    const menuHeight = menu.offsetHeight || 200;
                    const menuWidth = menu.offsetWidth || 180;

                    // Hide report and reply buttons if message is from safety_bot
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

                    // 2. Force reflow and restore animations
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
                    setTimeout(() => { document.addEventListener('mousedown', hide); document.addEventListener('touchstart', hide); }, 50);
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


        function appendMsg(msg, key, chatId = null, saveToLocal = true) {
            
            if (activeTargetId && (chatId === activeTargetId || chatId === getChatId(currentUser.id, activeTargetId))) {
                AppModules.Notify.markAsRead(activeTargetId);
            }

            const div = UIComponents.createChatBubble(msg, key, currentUser, setupLongPress);
            if (!div) return;
            const chatBox = document.getElementById('chatBox');
            chatBox.appendChild(div);

            if (saveToLocal && chatId) saveMessageLocal(chatId, key, msg);
        }

        /* --- STEP 6-9: UNIFIED MESSAGE ENGINE --- */
        window.MessageEngine = {
            // Internal: Core commit logic for both types
            commit: async function (msgData) {
                const targetId = activeTargetId;
                if (!targetId || !msgData) return;
                if (await blockIfRestrictedDirectTarget(targetId)) return null;

                const isGroup = targetId.startsWith('group_');
                const chatId = isGroup ? targetId : getChatId(currentUser.id, targetId);
                const msgObj = {
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: serverTimestamp(),
                    ...msgData
                };

                // 1. Push Message
                const newMsgRef = push(ref(db, `messages/${chatId}`));
                await set(newMsgRef, msgObj);

                // 2. Update Recent Lists & Metadata
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

                console.log(`MessageEngine: Committed to ${chatId}`);
                return newMsgRef.key;
            },

            // High-level: Send Text
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
                if (currentQuote) { msgData.quote = currentQuote; clearQuote(); }

                await this.commit(msgData);
                if (!customVal) {
                    input.value = '';
                    input.style.height = 'auto'; // Reset height for textarea
                }
            },

            // High-level: Send Images
            sendImages: async function (base64s) {
                if (!base64s || !base64s.length) return;
                const imageUrls = await Promise.all(base64s.map(b => uploadImageToStorage(b, 'chats')));
                const msgKey = await this.commit({
                    text: JSON.stringify(imageUrls),
                    type: 'image_group'
                });

                // Add to user image index for regular users to enforce storage quota
                if (msgKey && currentUser && !AppModules.User.isAdmin()) {
                    const uidLower = currentUser.uid.toLowerCase();
                    const targetId = activeTargetId;
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

        window.sendMsg = async (type = 'text', customVal = null) => {
            if (!AppModules.Security.checkRateLimit('msg', true)) return;

            // Block disbanded
            if (activeTargetId && activeTargetId.startsWith('group_')) {
                if (!cnCache[activeTargetId.replace('group_', '')]) {
                    AppModules.Modal.alert("Disbanded", "Cannot message a disbanded class.");
                    return;
                }
            }

            AppModules.Security.recordRateLimit('msg');
            await window.MessageEngine.sendText(customVal);
        };

        window.handleImg = (e) => AppModules.Utils.Image.handleUploadEvent(e);

        // Advanced Textarea Logic: Auto-resize, Shortcuts, and Limits
        (function setupChatInput() {
            const input = document.getElementById('u-msg');
            if (!input) return;

            let hasAlertedLimit = false;

            const adjustHeight = () => {
                if (!input.value) {
                    input.style.height = '';
                    return;
                }
                input.style.height = 'auto';
                const computedMaxHeight = parseInt(window.getComputedStyle(input).maxHeight);
                const newHeight = Math.min(input.scrollHeight, computedMaxHeight || 128);
                input.style.height = newHeight + 'px';
            };

            const updatePlaceholder = () => {
                if (window.innerWidth < 640) {
                    input.placeholder = "Type a message...";
                } else {
                    input.placeholder = "Type a message...Use Shift+Enter to change lines";
                }
            };

            input.addEventListener('input', () => {
                adjustHeight();

                // Character limit alert (8000 chars)
                if (input.value.length > 8000) {
                    if (!hasAlertedLimit) {
                        AppModules.Modal.alert("Limit Exceeded", "You have reached the 8000 character limit.");
                        hasAlertedLimit = true;
                    }
                } else {
                    hasAlertedLimit = false;
                }
            });

            // Shortcuts: Enter to Send, Shift+Enter to Newline
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    window.sendMsg();
                }
            });

            // Reset height & placeholder after window resize (debounced to prevent feedback loop)
            let resizeTimeout;
            window.addEventListener('resize', () => {
                updatePlaceholder();
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(adjustHeight, 50);
            });

            // Initial setup
            updatePlaceholder();
            setTimeout(adjustHeight, 100);
        })();



        window.adminPurgeImages = async () => {
            if (!AppModules.User.isAdmin()) return;
            const confirmed = await AppModules.Modal.confirm(
                "PRIVATE PHOTO PURGE",
                "WARNING: This will PHYSICALLY DELETE all images from PRIVATE CHATS (non-group) for all users. Group chats and public posts will NOT be affected. Proceed?",
                "Yes, Shred Private Photos"
            );
            if (!confirmed) return;

            const helperDeleteStorage = async (url) => {
                if (!url || typeof url !== 'string' || !url.includes('firebasestorage')) return;
                try {
                    const fileRef = sRef(storage, url);
                    await deleteObject(fileRef);
                } catch (e) { }
            };

            try {
                AppModules.Modal.alert("Purge Started", "Shredding private chat files...");
                let dbCount = 0;
                let storageCount = 0;

                // 1. Scan Messages (ONLY non-group chats)
                const msgsSnap = await get(ref(db, 'messages'));
                const allMsgs = msgsSnap.val() || {};
                for (const chatId in allMsgs) {
                    // Skip Group Chats!
                    if (chatId.startsWith('group_')) continue;

                    for (const msgKey in allMsgs[chatId]) {
                        const m = allMsgs[chatId][msgKey];
                        if (m.image || m.type === 'image_group') {
                            if (m.image) { await helperDeleteStorage(m.image); storageCount++; }
                            if (m.type === 'image_group' && m.text) {
                                try {
                                    const urls = JSON.parse(m.text);
                                    for (const u of urls) { await helperDeleteStorage(u); storageCount++; }
                                } catch (e) { }
                            }
                            await update(ref(db, `messages/${chatId}/${msgKey}`), { text: "Image Expired", type: "text", isExpired: true, image: null });
                            dbCount++;
                        }
                    }
                }

                // 2. Clear Quota Indices
                await set(ref(db, 'user_image_index'), null);

                await AppModules.Modal.alert("Purge Complete", `Deleted ${storageCount} private files and cleaned ${dbCount} entries. Group chats and news remain untouched.`);
            } catch (err) {
                await AppModules.Modal.alert("Error", "Purge failed: " + err.message);
            }
        };

        /* --- FIREBASE STORAGE MIGRATION HELPER --- */
        window.uploadImageToStorage = async function (base64Data, folder = 'uploads') {
            return await AppModules.Utils.Image.uploadToStorage(
                base64Data,
                (path) => sRef(storage, path),
                uploadString,
                getDownloadURL,
                auth,
                folder
            );
        };

        window.toggleGlobalPhotos = async (enabled) => {
            if (!AppModules.User.isAdmin()) return;
            try {
                await update(ref(db, 'settings'), { isPhotoDisabled: enabled });
            } catch (err) {
                AppModules.Modal.alert("Error", "Failed to update setting: " + err.message);
            }
        };
        window.selectSound = (val, e) => { if (e) e.stopPropagation(); updateSound(val); updateSettingsLabels(); toggleDropdown('soundDropdown'); };
        window.selectTheme = (val, e) => { if (e) e.stopPropagation(); applyTheme(val); updateSettingsLabels(); toggleDropdown('themeDropdown', e); };

        window.toggleNewsTab = (type) => AppModules.News.toggleNewsTab(type);





































































        // Extension Management Logic
        let _currentExtensionUrl = '';
        window.openExtension = (eid, customUrl = null, customTitle = null) => {
            const titleEl = document.getElementById('extensionTitle');
            const iframe = document.getElementById('extensionIframe');
            const loader = document.getElementById('extensionLoading');

            let url = 'about:blank';
            let title = 'Tool';

            // Resolve dynamically from registry
            const regItem = window.AppModules && window.AppModules.Extension && window.AppModules.Extension.getRegistryItem ? window.AppModules.Extension.getRegistryItem(eid) : null;

            if (customUrl) {
                url = customUrl;
                title = customTitle || eid;
            } else if (regItem) {
                url = regItem.url;
                title = regItem.title;
            } else if (eid === 'calc_volume_3d') {
                url = 'extensions/BC volume 3D present.html';
                title = '3D Volume Visualizer';
            } else if (eid === 'independent_research') {
                url = 'extensions/school/ir-navigator/IR Navigator.html';
                title = 'Independent Research Hub';
            } else if (eid === 'grade_calculator') {
                url = 'extensions/grade_calculator.html';
                title = 'Grade Calculator';
            }

            _currentExtensionUrl = url;
            titleEl.innerText = title;
            loader.classList.remove('hidden');
            iframe.src = url + '?v=' + Date.now();

            iframe.onload = () => {
                loader.classList.add('hidden');
                
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'THEME_UPDATE',
                        isDarkMode: ViewModule.state.isDarkMode
                    }, '*');
                    if (_pendingExtensionBridgeMessage) {
                        iframe.contentWindow.postMessage(_pendingExtensionBridgeMessage, '*');
                        _pendingExtensionBridgeMessage = null;
                    }
                }
            };

            // Apply Panel vs Fullscreen logic based on extension type
            const isPanel = ['grade_calculator', 'eagle_time', 'cafeteria', 'social_engine'].includes(eid);
            const extPage = document.getElementById('extensionPage');

            if (isPanel) {
                extPage.classList.add('lg:left-80');
                extPage.classList.remove('z-[160]');
                extPage.classList.add('z-[95]');
                document.body.classList.remove('is-fullscreen');
            } else {
                extPage.classList.remove('lg:left-80');
                extPage.classList.add('z-[160]');
                extPage.classList.remove('z-[95]');
                document.body.classList.add('is-fullscreen');
            }

            AppModules.View.openOverlay('extensionPage', { zIndex: AppModules.View.CONSTANTS.Z_INDEX.ADMIN, isExclusive: true });
        };

        window.openExtensionNotificationTarget = async (targetId) => {
            const normalized = String(targetId || '').toLowerCase();
            if (!isExtensionTargetId(normalized)) return;

            const extensionId = extensionIdFromTarget(normalized);
            const canonicalTarget = `ext_${extensionId}`;
            const regItem = window.AppModules?.Extension?.getRegistryItem?.(extensionId);
            const readableName = extensionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const displayTitle = regItem?.title || readableName;

            const ok = await AppModules.Modal.confirm(
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
            openExtension(extensionId, regItem?.url || null, displayTitle);
        };

        function initIRNavigatorNotificationBridge() {
            try {
                if (!currentUser || !currentUser.id) return;
                if (_irNotificationBridgeUnsub) {
                    _irNotificationBridgeUnsub();
                    _irNotificationBridgeUnsub = null;
                }
                const uid = currentUser.id.toLowerCase();
                const notifRef = ref(db, `user_image_index/ir_v7/notifications/${uid}`);
                _irNotificationBridgeUnsub = onValue(notifRef, (snap) => {
                    const list = Array.isArray(snap.val()) ? snap.val() : [];
                    const unread = list.filter(n => !n.read).length;
                    const latest = list.length > 0
                        ? [...list].sort((a, b) => (b.time || 0) - (a.time || 0))[0]
                        : null;

                    handleExtensionNotify({
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
        }

        // ==========================================
        // APP BRIDGE PROTOCOL
        // Provides safe access to main app functions for extensions
        // ==========================================
        async function handleExtensionNotify(payload) {
            try {
                const extensionId = String(payload?.extensionId || '').trim();
                if (!extensionId) return;

                const targetId = `ext_${extensionId.toLowerCase()}`;
                const text = String(payload?.body || payload?.title || 'Extension notification');
                const unreadCount = Number(payload?.unreadCount || 0);
                const route = String(payload?.route || 'notification');
                const uid = currentUser.id.toLowerCase();
                const prevUnread = Number(_extensionUnreadCount[targetId] || 0);
                _extensionUnreadCount[targetId] = unreadCount;

                _extensionNotifyRouteMap[targetId] = route;

                // Ensure we can display a friendly name immediately
                if (!ALL_USERS[targetId]) {
                    ALL_USERS[targetId] = {
                        name: String(payload?.title || 'Extension'),
                        email: String(payload?.extensionId || 'extension'),
                        role: 'system_extension',
                        lastSeen: Date.now()
                    };
                }

                // If unread is cleared, only clear dot; do not bump recency/order.
                if (unreadCount <= 0) {
                    await update(ref(db, `user_notifications/${uid}`), { [targetId]: false, [`extension_${extensionId.toLowerCase()}`]: false });
                    AppModules.Notify.markAsRead(targetId);
                    AppModules.Sidebar.renderSidebar();
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
                if (unreadCount > prevUnread && window.AppModules && window.AppModules.Notify && window.AppModules.Notify.triggerAlert) {
                    window.AppModules.Notify.triggerAlert(targetId, { text, senderId: targetId });
                }

                AppModules.Sidebar.renderSidebar();
            } catch (err) {
                console.error('Extension notify handling failed:', err);
            }
        }

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                switch (event.data.type) {
                    case 'GET_USER':
                        if (event.source) event.source.postMessage({ type: 'USER_RESPONSE', user: currentUser, isAdmin: AppModules.User.isAdmin(), isStaff: (AppModules.User.isTeacher() || AppModules.User.isAdmin()) }, '*');
                        break;
                    case 'GET_THEME':
                        if (event.source) event.source.postMessage({ type: 'THEME_UPDATE', isDarkMode: ViewModule.state.isDarkMode }, '*');
                        break;
                    case 'SHOW_TOAST':
                        showToast(event.data.message);
                        break;
                    case 'OPEN_GALLERY':
                        openGallery(event.data.images, event.data.index || 0);
                        break;
                    case 'EXTENSION_NOTIFY':
                        handleExtensionNotify(event.data.payload || {});
                        break;
                    case 'CLOSE_EXTENSION':
                        closeExtension();
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

        window.closeExtension = () => {
            AppModules.View.closeOverlay('extensionPage', {
                onClose: () => {
                    document.getElementById('extensionIframe').src = 'about:blank';
                    _currentExtensionUrl = '';
                }
            });
        };

        window.reloadExtension = () => {
            const iframe = document.getElementById('extensionIframe');
            const loader = document.getElementById('extensionLoading');
            loader.classList.remove('hidden');
            iframe.contentWindow.location.reload();
        };

        window.openExtensionExternally = () => {
            if (_currentExtensionUrl && _currentExtensionUrl !== 'about:blank') {
                window.open(_currentExtensionUrl, '_blank');
            }
        };
        // ===== End Overlay Navigation Engine =====

        // ===== Module Registry =====
        const MODULE_CONFIG = {
            lost_and_found: { title: 'Lost and Found',  postBtn: 'Post',    anonymous: false, hasComments: true  },
            marketplace:    { title: 'Marketplace',     postBtn: 'List',    anonymous: false, hasComments: true  },
            peer_tutoring:  { title: 'Peer Tutoring',   postBtn: 'Post',    anonymous: false, hasComments: true  },
            suggestions:    { title: 'Suggestions',     postBtn: 'Suggest', anonymous: true,  hasComments: false },
            info:           { title: 'CHS Info',        postBtn: 'Post',    anonymous: false, hasComments: true  },
            cafeteria:      { title: 'Cafeteria Menu',  postBtn: null,      anonymous: false, hasComments: false },
        };

        const MODULE_PAGE_MAP = {
            lost_and_found: 'lostFoundPage',
            marketplace:    'marketplacePage',
            peer_tutoring:  'tutoringPage',
            suggestions:    'suggestionsPage',
            info:           'infoPage',
            cafeteria:      'cafeteriaPage',
        };
        // ===== End Module Registry =====

        window.openModule = (moduleName) => {
            currentModule = moduleName;
            currentModuleSort = 'latest';
            const config = MODULE_CONFIG[moduleName];
            const pageId = MODULE_PAGE_MAP[moduleName];

            if (pageId === 'extensionPage') {
                window.openExtension(moduleName);
                return;
            }

            const page = document.getElementById(pageId);
            if (page) {
                const titleEl = page.querySelector('.module-title');
                const addBtn = page.querySelector('.module-add-btn');
                if (titleEl) titleEl.innerText = config.title;
                if (addBtn) {
                    if (config.postBtn) {
                        addBtn.innerText = config.postBtn;
                        addBtn.classList.remove('hidden');
                    } else {
                        addBtn.classList.add('hidden');
                    }
                }
            }

            AppModules.View.openOverlay(pageId, { onOpen: () => setModuleSort('latest'), zIndex: AppModules.View.CONSTANTS.Z_INDEX.MODULE, isExclusive: true });
        };

        window.closeModule = () => {
            const pageId = MODULE_PAGE_MAP[currentModule];
            AppModules.View.closeOverlay(pageId, {
                onClose: () => {
                    if (moduleListener) { moduleListener(); moduleListener = null; }
                    currentModule = null;
                }
            });
        };

        window.setModuleSort = (sort) => {
            currentModuleSort = sort;
            const pageId = MODULE_PAGE_MAP[currentModule];
            const page = document.getElementById(pageId);
            if (page) {
                const latestBtn = page.querySelector('.sort-latest-btn');
                const hotBtn = page.querySelector('.sort-hot-btn');
                if (latestBtn) latestBtn.className = sort === 'latest' ? 'sort-latest-btn text-sm font-semibold text-black dark:text-white transition-colors' : 'sort-latest-btn text-sm font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors';
                if (hotBtn) hotBtn.className = sort === 'hot' ? 'sort-hot-btn text-sm font-semibold text-black dark:text-white transition-colors' : 'sort-hot-btn text-sm font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors';
            }
            loadModuleData();
        };


        async function loadModuleData() {
            const moduleName = currentModule;
            const pageId = MODULE_PAGE_MAP[moduleName];
            const listEl = document.querySelector(`#${pageId} .module-list`);
            if (listEl) listEl.innerHTML = '<div class="text-center text-gray-400 mt-10">Loading...</div>';

            // 1. Initial Load from Cache (for instant UI)
            const cached = await getLocalModulePosts(moduleName);
            if (cached.length > 0 && currentModule === moduleName) {
                modulePosts = cached.map(m => ({ id: m.key, ...m }));
                await Promise.all(modulePosts.map(p => fetchUser(p.authorId)));
                renderModuleList();
            }

            // 2. Attach Real-time Listener (for updates like likes/votes/comments)
            if (moduleListener) moduleListener();
            moduleListener = onValue(ref(db, `modules/${moduleName}`), async (snap) => {
                if (currentModule !== moduleName) return;
                const data = snap.val() || {};
                const posts = Object.keys(data).map(key => ({ id: key, ...data[key] }));

                // Save to local cache for next time
                for (const p of posts) {
                    await saveModulePostLocal(moduleName, p.id, p);
                }

                modulePosts = posts;
                await Promise.all(modulePosts.map(p => fetchUser(p.authorId)));
                renderModuleList();

                // If detail page is open for one of these, it handles its own onValue listener
            });
        }

        function getSuggestionVotingHtml(post) {
            if (currentModule !== 'suggestions') return '';
            const supportVotes = post.supportVotes || {};
            const notSupportVotes = post.notSupportVotes || {};
            const supportCount = Object.keys(supportVotes).length;
            const notSupportCount = Object.keys(notSupportVotes).length;
            const totalVotes = supportCount + notSupportCount;
            const supportPercent = totalVotes > 0 ? Math.round((supportCount / totalVotes) * 100) : 0;
            const notSupportPercent = totalVotes > 0 ? Math.round((notSupportCount / totalVotes) * 100) : 0;
            const userVote = auth.currentUser ? (supportVotes[auth.currentUser.uid] ? 'support' : (notSupportVotes[auth.currentUser.uid] ? 'not_support' : null)) : null;

            let barHtml = '';
            if (totalVotes === 0) {
                barHtml = '<div class="h-full flex-1 bg-gray-200 dark:bg-white/10"></div>';
            } else {
                let slantHtml = '';
                if (notSupportPercent > 0 && supportPercent > 0) {
                    slantHtml = '<div class="h-[150%] w-[3px] bg-white dark:bg-[#1C1C1E] transform skew-x-[-20deg] z-10 -mx-[1.5px]"></div>';
                }
                barHtml = '<div class="h-full bg-red-500 transition-all duration-700 ease-out" style="width: ' + notSupportPercent + '%;"></div>' +
                    slantHtml +
                    '<div class="h-full bg-blue-500 transition-all duration-700 ease-out flex-1"></div>';
            }

            return `
                <div class="mt-4 border border-gray-100 dark:border-white/5 rounded-2xl p-2 bg-gray-50/50 dark:bg-white/5 shadow-sm">
                    <div class="flex justify-between items-center px-2 py-1 mb-2">
                        <button onclick="voteSuggestion('${post.id}', 'not_support'); event.stopPropagation();"
                                class="flex flex-col items-start active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'not_support' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-red-100 text-red-500 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <span class="font-bold text-sm ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}">Not Support</span>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-400'} ml-7">${notSupportPercent}% (${notSupportCount})</div>
                        </button>

                        <button onclick="voteSuggestion('${post.id}', 'support'); event.stopPropagation();"
                                class="flex flex-col items-end active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5 justify-end w-full">
                                <span class="font-bold text-sm ${userVote === 'support' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}">Support</span>
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'support' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-blue-100 text-blue-500 dark:bg-blue-500/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'support' ? 'text-blue-500' : 'text-gray-400'} mr-7">${supportPercent}% (${supportCount})</div>
                        </button>
                    </div>

                    <div class="h-2 w-full bg-gray-200 dark:bg-black/50 rounded-full overflow-hidden flex items-center shadow-inner">
                        ${barHtml}
                    </div>
                </div>
            `;
        }

        window.voteSuggestion = async (postId, voteType) => {
            if (!auth.currentUser) return;
            const uid = auth.currentUser.uid;
            const supportRef = ref(db, `modules/suggestions/${postId}/supportVotes/${uid}`);
            const notSupportRef = ref(db, `modules/suggestions/${postId}/notSupportVotes/${uid}`);

            const post = modulePosts.find(p => p.id === postId) || (currentPostId === postId ? (await get(ref(db, `modules/suggestions/${postId}`))).val() : null);
            if (!post) return;

            const currentVote = (post.supportVotes && post.supportVotes[uid]) ? 'support'
                : (post.notSupportVotes && post.notSupportVotes[uid]) ? 'not_support' : null;

            try {
                if (voteType === 'support') {
                    if (currentVote === 'support') {
                        await set(supportRef, null);
                    } else {
                        await set(supportRef, true);
                        if (currentVote === 'not_support') await set(notSupportRef, null);
                    }
                } else {
                    if (currentVote === 'not_support') {
                        await set(notSupportRef, null);
                    } else {
                        await set(notSupportRef, true);
                        if (currentVote === 'support') await set(supportRef, null);
                    }
                }
            } catch (err) {
                AppModules.Modal.alert("Error", "Failed to vote: " + err.message);
                console.error(err);
            }
        };

        function renderModuleList() {
            const pageId = MODULE_PAGE_MAP[currentModule];
            const listEl = document.querySelector(`#${pageId} .module-list`);
            if (!listEl) return;
            listEl.innerHTML = '';

            if (modulePosts.length === 0) {
                listEl.innerHTML = '<div class="flex flex-col items-center justify-center mt-20 text-gray-400"><svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg><p class="text-sm font-medium">No posts yet</p></div>';
                return;
            }

            if (currentModuleSort === 'latest') {
                modulePosts.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                modulePosts.sort((a, b) => (Object.keys(b.likes || {}).length) - (Object.keys(a.likes || {}).length));
            }

            if (!window._masonryResizeListener) {
                let lastCols = 0;
                window._masonryResizeListener = () => {
                    if (!currentModule) return;
                    let c = 1;
                    const w = window.innerWidth;
                    if (w >= 1536) c = 5;
                    else if (w >= 1280) c = 4;
                    else if (w >= 1024) c = 3;
                    else if (w >= 640) c = 2;
                    if (c !== lastCols) {
                        lastCols = c;
                        renderModuleList();
                    }
                };
                window.addEventListener('resize', window._masonryResizeListener);
            }

            let cols = 1;
            const w = window.innerWidth;
            if (w >= 1536) cols = 5;
            else if (w >= 1280) cols = 4;
            else if (w >= 1024) cols = 3;
            else if (w >= 640) cols = 2;

            if (window._masonryResizeListener) {
                // Ensure lastCols is initialized
                window._masonryResizeListener.lastCols = cols;
            }

            const columns = Array.from({ length: cols }, () => []);
            modulePosts.forEach((post, i) => columns[i % cols].push(post));

            const mappedPostsHtml = columns.map(colPosts => {
                if (colPosts.length === 0) return '';
                return `<div class="flex-1 flex flex-col gap-4 max-w-[320px]">` + colPosts.map(post => {
                    const config = MODULE_CONFIG[currentModule];
                    const likesCount = Object.keys(post.likes || {}).length;
                    const isLiked = post.likes && auth.currentUser && post.likes[auth.currentUser.uid];

                    const authorName = config.anonymous ? 'Anonymous User' : (post.authorName || 'Unknown');
                    const authorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anonymous&background=random' : (ALL_USERS[post.authorId]?.avatar || 'https://ui-avatars.com/api/?name=' + authorName + '&background=random');

                    let interactions = `<div class="flex items-center gap-5 mt-3">
                        <button onclick="toggleLike('${post.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} transition-colors group">
                            <svg class="w-6 h-6 ${isLiked ? 'fill-current scale-110' : 'fill-none group-active:scale-90'} transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            <span class="text-sm font-medium">${likesCount}</span>
                        </button>`;

                    if (config.hasComments) {
                        const commentsCount = Object.keys(post.comments || {}).length;
                        interactions += `<button onclick="openPostDetail('${post.id}')" class="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group">
                            <div class="relative">
                                <svg class="w-6 h-6 fill-none group-active:scale-90 transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                <div id="mainUnreadDot" class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black hidden"></div>
                            </div>
                            <span class="text-sm font-medium">${commentsCount}</span>
                        </button>`;
                    }

                    interactions += `<button onclick="reportPost('${post.id}')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group active:scale-95" title="Report Post"><svg class="w-6 h-6 fill-none transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></button>`;

                    interactions += `<div class="flex-1"></div>`;

                    if (!config.anonymous && post.authorId !== currentUser.id) {
                        interactions += `<button onclick="window.startModuleChat('${post.authorId}')" class="bg-[#007AFF] text-white px-4 py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-transform shadow-md shadow-blue-500/20 ml-3">Chat</button>`;
                    }

                    interactions += `</div>`;

                    let adminDeleteBtn = '';
                    if (AppModules.User.isAdmin() || AppModules.User.isTeacher()) {
                        adminDeleteBtn = `<button onclick="deletePost('${post.id}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-transform p-1 ml-2" title="Delete Post"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
                    }

                    return `
                        <div class="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/5 transition-colors w-full">
                            <div class="flex items-start mb-3">
                                <img src="${authorAvatar}" class="w-10 h-10 rounded-full object-cover shadow-sm mr-3">
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-sm leading-tight text-black dark:text-white truncate">${escapeHTML(authorName)}</div>
                                    <div class="text-xs text-gray-500 font-medium mt-0.5">${new Date(post.timestamp).toLocaleString()}</div>
                                </div>
                                ${adminDeleteBtn}
                            </div>
                            <div class="font-bold text-lg mb-2 text-black dark:text-white leading-snug cursor-pointer" ${config.hasComments ? `onclick="openPostDetail('${post.id}')"` : ''}>${escapeHTML(post.title)}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${linkify(escapeHTML(post.desc))}</div>
                            ${(post.image && !window.isPhotoDisabled) ? `
                            <div class="relative w-full">
                                <img src="${post.image}" class="w-full aspect-square object-cover rounded-2xl mt-3 cursor-pointer border border-gray-100 dark:border-white/5"
                                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                                     onclick="openGallery('${encodeURIComponent(JSON.stringify([post.image]))}')">
                                <div class="hidden mt-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 text-xs italic flex items-center gap-2 border border-dashed border-gray-200 dark:border-gray-800">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    Photo no longer available
                                </div>
                            </div>` : ''}
                            ${(post.image && window.isPhotoDisabled) ? `<div class="mt-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2 border border-gray-100 dark:border-white/5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled</div>` : ''}
                            ${getSuggestionVotingHtml(post)}
                            ${interactions}
                        </div>
                    `;
                }).join('') + `</div>`;
            }).join('');

            listEl.innerHTML = `<div class="flex gap-4 items-start justify-center w-full mx-auto max-w-[1600px]">${mappedPostsHtml}</div>`;
        }

        window.deletePost = async (postId) => {
            if (!await AppModules.Modal.confirm("Delete Post", "Are you sure you want to delete this post?", "Delete")) return;
            try {
                await set(ref(db, `modules/${currentModule}/${postId}`), null);
            } catch (e) {
                AppModules.Modal.alert("Error", "Failed to delete post.");
            }
        };

        window.handleMsgReport = async () => {
            if (!selectedMsgData) return;
            const menu = document.getElementById('messageContextMenu');
            menu.classList.add('hidden');
            const confirmReport = await AppModules.Modal.confirm("Report Content", "Report this message for harassment or inappropriate content?", "Report");
            if (confirmReport) {
                AppModules.Security.reportMessage(selectedMsgData);
            }
        };



        window.startModuleChat = (authorId) => {
            closeModule();
            setTimeout(() => {
                const isMobile = window.innerWidth < 1024;
                if (isMobile) {
                    const messagesBtn = document.getElementById('tabBtn-messages');
                    if (messagesBtn) messagesBtn.click();
                }
                window.switchChat?.(authorId);
            }, 350);
        };

        let currentPostBase64 = null;

        window.handlePostImageSelect = async (e) => {
            if (!AppModules.Security.checkPhotoUploadAllowed()) {
                e.target.value = '';
                return;
            }
            const file = e.target.files[0];
            if (!file) return;

            try {
                currentPostBase64 = await AppModules.Utils.Image.compress(file, 800, 0.8);
                document.getElementById('postImagePreview').src = currentPostBase64;
                document.getElementById('postImagePreview').classList.remove('hidden');
                document.getElementById('postImageClearBtn').classList.remove('hidden');
                document.getElementById('postImagePlaceholder').classList.add('hidden');
            } catch (err) {
                console.error("Failed to compress post image:", err);
                AppModules.Modal.alert("Error", "Failed to load or compress image.");
            }
        };

        window.clearPostImage = (e) => {
            if (e) e.stopPropagation();
            currentPostBase64 = null;
            document.getElementById('postFileInput').value = '';
            document.getElementById('postImagePreview').classList.add('hidden');
            document.getElementById('postImageClearBtn').classList.add('hidden');
            document.getElementById('postImagePlaceholder').classList.remove('hidden');
        };

        let isPostingNews = false;
        let isRequestingExtension = false;

        window.openNewsPostForm = () => {
            console.log('App: Opening News Post Form');
            isPostingNews = true;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            window.clearPostImage();
            document.getElementById('postPageTitle').innerText = 'New Announcement';

            const batchBtn = document.getElementById('batchImportBtn');
            if (batchBtn) {
                batchBtn.classList.toggle('hidden', !AppModules.User.isAdmin());
            }

            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.style.display = window.isPhotoDisabled ? 'none' : 'flex';

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            });
        };

        window.openPostForm = () => {
            console.log('App: Opening Module Post Form. Module:', currentModule);
            isPostingNews = false;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            window.clearPostImage();
            const postBtnLabel = (currentModule && MODULE_CONFIG[currentModule]) ? MODULE_CONFIG[currentModule].postBtn : 'Post';
            document.getElementById('postPageTitle').innerText = 'New ' + (postBtnLabel || 'Post');
            document.getElementById('batchImportBtn')?.classList.add('hidden');

            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.style.display = window.isPhotoDisabled ? 'none' : 'flex';

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            });
        };

        window.openExtensionRequest = () => {
            isPostingNews = false;
            isRequestingExtension = true;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            document.getElementById('postInputTitle').placeholder = "What's the tool's name?";
            document.getElementById('postInputDesc').placeholder = "Explain how it helps you or what features it should have...";
            document.getElementById('postPageTitle').innerText = 'Tool Suggestion';
            document.getElementById('batchImportBtn')?.classList.add('hidden');

            // Hide image area for requests
            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.classList.add('hidden');

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            }, 10);
        };

        window.closePostForm = () => {
            document.getElementById('postPageBackdrop').classList.remove('opacity-100');
            document.getElementById('postPageContent').classList.add('translate-y-full');
            setTimeout(() => {
                document.getElementById('postPage').classList.add('hidden');
                isPostingNews = false;
                isRequestingExtension = false;
                // Reset placeholders
                document.getElementById('postInputTitle').placeholder = "Subject";
                document.getElementById('postInputDesc').placeholder = "What's on your mind?";
                const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
                if (imgArea) imgArea.classList.remove('hidden');
            }, 400);
        };

        window.openBatchImport = async () => AppModules.News.openBatchImport();

        window.submitPost = async () => {
            if (!AppModules.Security.checkRateLimit('post', false)) return;

            const title = document.getElementById('postInputTitle').value.trim();
            const desc = document.getElementById('postInputDesc').value.trim();
            if (!title || !desc) { AppModules.Modal.alert("Required", "Title and description are required."); return; }

            if (title.length > 200 || desc.length > 1000) {
                AppModules.Modal.alert("Content Too Long", "Titles are limited to 200 characters and descriptions to 1000 characters.");
                return;
            }

            if (currentPostBase64 && window.isPhotoDisabled) {
                AppModules.Modal.alert("Restricted", "Photo uploads are currently disabled by the administrator.");
                window.clearPostImage();
                return;
            }

            const config = (currentModule && MODULE_CONFIG[currentModule]) ? MODULE_CONFIG[currentModule] : {};
            const isAnonymous = config.anonymous || false;
            AppModules.Security.recordRateLimit('post');

            if (isRequestingExtension) {
                const adminId = AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');
                const requestText = `[EXTENSION REQUEST]\nTool Name: ${title}\nDescription: ${desc}\nSubmitted by: ${currentUser.name} (${currentUser.id})`;

                const adminChatId = getChatId(ADVICE_BOT_ID, adminId);
                push(ref(db, `messages/${adminChatId}`), {
                    senderId: ADVICE_BOT_ID,
                    senderName: 'Advice Bot',
                    text: requestText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [ADVICE_BOT_ID]: serverTimestamp() });

                const userChatId = getChatId(ADVICE_BOT_ID, currentUser.id);
                const confirmText = `[SUBMISSION SUCCESSFUL]\nThank you for your suggestion! "Advice Bot" has delivered your request for "${title}" to the Admin team for review.`;
                push(ref(db, `messages/${userChatId}`), {
                    senderId: ADVICE_BOT_ID,
                    senderName: 'Advice Bot',
                    text: confirmText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${currentUser.id.toLowerCase()}`), { [ADVICE_BOT_ID]: serverTimestamp() });

                AppModules.Modal.alert("Success", "Your suggestion has been sent to Admin. Thank you!");
                closePostForm();
                return;
            }

            const publishContent = async () => {
                let finalImageUrl = null;
                if (currentPostBase64) {
                    // Show a temporary hint in the alert/form if possible
                    finalImageUrl = await uploadImageToStorage(currentPostBase64, isPostingNews ? 'announcements' : 'modules');
                }

                const dbRefStr = isPostingNews ? `news/${currentNewsTab}` : `modules/${currentModule}`;
                set(push(ref(db, dbRefStr)), {
                    title, desc,
                    image: finalImageUrl,
                    authorId: isAnonymous ? 'anonymous' : currentUser.id,
                    authorName: isAnonymous ? 'Anonymous' : currentUser.name,
                    timestamp: Date.now(),
                    likes: {}
                }).then(() => {
                    AppModules.Modal.alert("Success", "Published successfully!");
                    closePostForm();
                    if (isPostingNews && typeof window.globalDataSync === 'function') window.globalDataSync();
                }).catch(err => {
                    AppModules.Security.recordRateLimit('post', 0);
                    AppModules.Modal.alert("Error", "Failed to post: " + err.message);
                });
            };

            publishContent();
        };

        window.toggleLike = async (postId) => {
            if (!auth.currentUser) return;
            const uid = auth.currentUser.uid;
            const postRef = ref(db, `modules/${currentModule}/${postId}/likes/${uid}`);
            const post = modulePosts.find(p => p.id === postId);
            try {
                if (post && post.likes && post.likes[uid]) {
                    await set(postRef, null);
                } else {
                    await set(postRef, true);
                }
            } catch (err) { console.error(err); }
        };

        let currentPostId = null;
        let postDetailListener = null;

        window.openPostDetail = (postId) => {
            currentPostId = postId;
            const page = document.getElementById('detailPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => page.classList.remove('translate-x-full'));

            
            if (window.AppModules && window.AppModules.View) {
                window.AppModules.View.registerLayer('detailPage', () => {
                    window._isPopStateClosing = true;
                    window.closeDetail();
                    setTimeout(() => { window._isPopStateClosing = false; }, 420);
                });
            }

            const config = MODULE_CONFIG[currentModule];
            document.getElementById('commentInputArea').classList.toggle('hidden', !config.hasComments);

            if (postDetailListener) postDetailListener();
            postDetailListener = onValue(ref(db, `modules/${currentModule}/${postId}`), (snap) => {
                const post = snap.val();
                if (post) renderPostDetail(postId, post);
            });
        };

        window.closeDetail = () => {
            const page = document.getElementById('detailPage');
            page.classList.add('translate-x-full');

            
            if (window.AppModules && window.AppModules.View) {
                window.AppModules.View.unregisterLayer('detailPage');
                if (!window._isPopStateClosing) {
                    history.back();
                }
            }

            setTimeout(() => page.classList.add('hidden'), 380);
            if (postDetailListener) { postDetailListener(); postDetailListener = null; }
            currentPostId = null;
        };

        async function renderPostDetail(postId, post) {
            const contentEl = document.getElementById('detailContent');
            const config = MODULE_CONFIG[currentModule];
            const likesCount = Object.keys(post.likes || {}).length;
            const isLiked = post.likes && auth.currentUser && post.likes[auth.currentUser.uid];

            const authorName = config.anonymous ? 'Anonymous' : (post.authorName || 'Unknown');
            const author = !config.anonymous ? await fetchUser(post.authorId) : null;
            const authorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anon&background=random' : (author?.avatar || 'https://ui-avatars.com/api/?name=' + authorName);

            let html = `
                <div class="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                    <div class="flex items-center gap-4 mb-5">
                        <img src="${authorAvatar}" class="w-14 h-14 rounded-full object-cover">
                        <div>
                            <div class="font-bold text-lg text-black dark:text-white">${authorName}</div>
                            <div class="text-sm text-gray-400 font-medium">${new Date(post.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="font-extrabold text-2xl mb-3 text-black dark:text-white">${escapeHTML(post.title)}</div>
                    <div class="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${linkify(escapeHTML(post.desc))}</div>
                    ${(post.image && !window.isPhotoDisabled) ? `
                    <div class="relative w-full">
                        <img src="${post.image}" class="w-full rounded-2xl mt-5 border border-gray-100 dark:border-white/5 cursor-pointer"
                             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                             onclick="openGallery('${encodeURIComponent(JSON.stringify([post.image]))}')">
                        <div class="hidden mt-5 px-5 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-500 text-sm italic flex items-center gap-3 border border-dashed border-gray-200 dark:border-gray-800">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Photo no longer available
                        </div>
                    </div>` : ''}
                    ${(post.image && window.isPhotoDisabled) ? `<div class="mt-5 px-5 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 text-sm italic flex items-center gap-3 border border-gray-100 dark:border-white/5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Blocked by Administrator</div>` : ''}
                    <div class="flex items-center gap-5 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
                        <button onclick="toggleLike('${postId}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}">
                            <svg class="w-7 h-7 ${isLiked ? 'fill-current' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            <span class="text-base font-medium">${likesCount}</span>
                        </button>
                        <button onclick="reportPost('${postId}')" class="text-gray-400 hover:text-gray-600"><svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></button>
                    </div>
                </div>`;

            if (config.hasComments) {
                const comments = post.comments || {};
                const sorted = Object.keys(comments).map(k => ({ id: k, ...comments[k] })).sort((a, b) => a.timestamp - b.timestamp);
                html += `<div class="mt-8 font-bold text-xl mb-5 px-2 text-black dark:text-white">Comments (${sorted.length})</div>`;
                if (sorted.length === 0) {
                    html += `<div class="text-center text-gray-400 text-sm mt-5">No comments yet.</div>`;
                } else {
                    html += `<div class="space-y-4">`;
                    for (const c of sorted) {
                        const cAuthor = !config.anonymous ? await fetchUser(c.authorId) : null;
                        html += UIComponents.renderComment(c, config, currentUser, cAuthor);
                    }
                    html += `</div>`;
                }
            }
            contentEl.innerHTML = html;
        }



        window.submitComment = () => {
            if (!AppModules.Security.checkRateLimit('comment', true)) return;
            const input = document.getElementById('commentInput');
            const text = input.value.trim();
            if (!text || !currentPostId) return;

            const config = MODULE_CONFIG[currentModule] || {};
            const isAnonymous = config.anonymous || false;
            AppModules.Security.recordRateLimit('comment');
            set(push(ref(db, `modules/${currentModule}/${currentPostId}/comments`)), {
                text,
                authorId: isAnonymous ? 'anonymous' : currentUser.id,
                authorName: isAnonymous ? 'Anonymous' : currentUser.name,
                timestamp: Date.now()
            }).then(() => { input.value = ''; }).catch(e => AppModules.Modal.alert("Error", e.message));
        };

        window.openEagleTime = () => {
            currentModule = 'eagle_time';
            const btn = document.getElementById('eagleAddBtn');
            if (btn) btn.classList.toggle('hidden', !(AppModules.User.isTeacher() || AppModules.User.isAdmin()));
            AppModules.View.openOverlay('eagleTimePage', { onOpen: renderEagleTime, zIndex: AppModules.View.CONSTANTS.Z_INDEX.EAGLE_TIME, isExclusive: true });
        };

        window.closeEagleTime = () => {
            AppModules.View.closeOverlay('eagleTimePage', {
                onClose: () => {
                    currentModule = null;
                }
            });
        };

        function renderEagleTime() {
            const container = document.getElementById('eagleTimeContent');
            const studentPassContainer = document.getElementById('studentPassContainer');

            onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
                const sessions = snapshot.val() || {};
                const sessionList = Object.keys(sessions).map(id => ({ id, ...sessions[id] }));

                // Check if user is already in a session
                let joinedSession = null;
                sessionList.forEach(s => {
                    if (s.students && s.students[currentUser.id]) joinedSession = s;
                });

                if (joinedSession) {
                    container.classList.add('hidden');
                    studentPassContainer.classList.remove('hidden');
                    renderStudentPass(joinedSession);
                } else {
                    container.classList.remove('hidden');
                    studentPassContainer.classList.add('hidden');
                    renderSessionList(sessionList);
                }
            });
        }

        async function renderSessionList(sessions) {
            const container = document.getElementById('sessionListContainer');
            if (sessions.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 mt-20">No Eagle Time sessions available.</div>';
                return;
            }

            let cols = 1;
            const w = window.innerWidth;
            if (w >= 1536) cols = 4;
            else if (w >= 1280) cols = 3;
            else if (w >= 768) cols = 2;

            const columns = Array.from({ length: cols }, () => []);
            sessions.forEach((s, i) => columns[i % cols].push(s));

            const html = await Promise.all(columns.map(async colSessions => {
                if (colSessions.length === 0) return '';
                const cards = await Promise.all(colSessions.map(async s => {
                    const studentCount = Object.keys(s.students || {}).length;
                    const teacher = await fetchUser(s.teacherId);
                    const teacherName = teacher?.name || 'Unknown Teacher';

                    const studentsHtml = await Promise.all(Object.keys(s.students || {}).map(async uid => {
                        const u = await fetchUser(uid);
                        return `<div class="text-[13px] text-gray-600 dark:text-gray-400 flex justify-between gap-2"><span>${escapeHTML(u?.name || uid)}</span></div>`;
                    }));

                    return `
                        <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                            <div class="flex justify-between items-start">
                                <div class="min-w-0">
                                    <h4 class="font-bold text-base text-black dark:text-white truncate">${escapeHTML(s.title)}</h4>
                                    <p class="text-sm text-gray-500 truncate">${escapeHTML(teacherName)} 闂?Room ${escapeHTML(s.room)}</p>
                                </div>
                                <span class="bg-blue-100 dark:bg-blue-500/20 text-[#007AFF] text-xs font-bold px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                                    ${studentCount} Joined
                                </span>
                            </div>
                            <button onclick="joinEagleSession('${s.id}')"
                                class="w-full bg-[#007AFF] text-white py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                                Join Session
                            </button>
                            ${(AppModules.User.isAdmin() || currentUser.id === s.teacherId) ? `
                                <div class="pt-2 border-t border-gray-100 dark:border-white/5">
                                    <p class="text-xs font-bold text-gray-400 uppercase mb-2">Roster</p>
                                    <div class="space-y-1 max-h-32 overflow-y-auto">
                                        ${studentsHtml.join('') || '<p class="text-xs text-gray-400 italic">No students.</p>'}
                                    </div>
                                    <button onclick="deleteEagleSession('${s.id}')" class="mt-3 text-red-500 text-sm font-bold">Delete Session</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }));
                return `<div class="flex-1 flex flex-col gap-4 min-w-0">${cards.join('')}</div>`;
            }));

            const finalHtml = `<div class="flex flex-wrap md:flex-nowrap gap-4 items-start w-full mx-auto max-w-[1200px]">${html.join('')}</div>`;
            container.innerHTML = finalHtml;
        }

        // Add resize listener for Eagle Time grid
        window.addEventListener('resize', () => {
            if (currentModule === 'eagle_time') {
                // Debounce or just re-render if active
                const eaglePage = document.getElementById('eagleTimePage');
                if (eaglePage && !eaglePage.classList.contains('hidden')) {
                    // Re-render list to adjust columns
                    onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
                        const sessions = snapshot.val() || {};
                        renderSessionList(Object.keys(sessions).map(id => ({ id, ...sessions[id] })));
                    }, { onlyOnce: true });
                }
            }
        });

        async function renderStudentPass(session) {
            const container = document.getElementById('studentPassContainer');
            const teacher = await fetchUser(session.teacherId);
            container.innerHTML = `
                <div class="w-full max-w-[400px] mx-auto">
                    <div class="pass-gradient p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden space-y-6">
                        <div class="flex justify-between items-start relative z-10">
                            <div>
                                <p class="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mb-1">Digital Hall Pass</p>
                                <h2 class="text-3xl font-black tracking-tight leading-tight">EAGLE TIME</h2>
                            </div>
                        </div>

                        <div class="space-y-4 pt-4 border-t border-white/20 relative z-10">
                            <div class="flex justify-between">
                                <div>
                                    <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Student</p>
                                    <p class="font-bold text-lg">${escapeHTML(currentUser.name)}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Room</p>
                                    <p class="font-bold text-lg">${escapeHTML(session.room)}</p>
                                </div>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Course / Enrichment</p>
                                <p class="font-bold text-lg">${escapeHTML(session.title)}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Teacher</p>
                                <p class="font-bold text-lg">${escapeHTML(teacher?.name || 'Unknown')}</p>
                            </div>
                        </div>

                        <div class="ticket-cutout my-2 border-t-2 border-dashed border-white/30 relative z-10"></div>

                        <div class="pt-2 text-center relative z-10">
                             <div class="inline-block bg-white text-[#007AFF] px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase shadow-lg">
                                Active Pass
                             </div>
                             <p class="mt-4 text-[11px] opacity-70 font-medium">Valid for enrichment period only</p>
                        </div>

                        <!-- Abstract Background Decorations -->
                        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div class="absolute -top-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                    </div>

                    <button onclick="leaveEagleSession('${session.id}')"
                        class="w-full mt-6 bg-white dark:bg-[#1C1C1E] text-red-500 py-3 rounded-2xl font-bold text-base shadow-sm active:scale-95 transition-transform border border-red-100 dark:border-red-900/30">
                        Cancel Registration
                    </button>
                </div>
            `;
        }

        window.joinEagleSession = async (sessionId) => {
            try {
                await update(ref(db, `eagle_time/sessions/${sessionId}/students`), { [currentUser.id]: true });
                AppModules.Modal.alert("Success", "Successfully joined Eagle Time session!");
            } catch (e) { AppModules.Modal.alert("Error", "Failed to join: " + e.message); }
        };

        window.leaveEagleSession = async (sessionId) => {
            if (!await AppModules.Modal.confirm("Cancel Registration", "Are you sure you want to cancel your registration?", "Leave")) return;
            try {
                await set(ref(db, `eagle_time/sessions/${sessionId}/students/${currentUser.id}`), null);
            } catch (e) { AppModules.Modal.alert("Error", "Failed to leave: " + e.message); }
        };

        window.openCreateEagleForm = async () => {
            const form = document.getElementById('eagleCreateForm');
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Populate teacher select - This still requires some way to find teachers
            // For now, we use the cached users (those we have chats with)
            const select = document.getElementById('eagleTeacherSelect');
            select.innerHTML = '<option value="">Select Teacher</option>';
            for (const uid in ALL_USERS) {
                const u = ALL_USERS[uid];
                if (u.email && (u.email.endsWith('@hcpss.org') || u.email === AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL)) {
                    const opt = document.createElement('option');
                    opt.value = uid;
                    opt.innerText = u.name;
                    select.appendChild(opt);
                }
            }
        };

        window.submitEagleSession = async () => {
            const title = document.getElementById('eagleTitleInput').value.trim();
            const room = document.getElementById('eagleRoomInput').value.trim();
            const teacherId = document.getElementById('eagleTeacherSelect').value;

            if (!title || !room || !teacherId) return AppModules.Modal.alert("Required", "Please fill all fields");

            try {
                const newRef = push(ref(db, 'eagle_time/sessions'));
                await set(newRef, { title, room, teacherId, timestamp: serverTimestamp(), students: {} });
                document.getElementById('eagleCreateForm').classList.add('hidden');
                document.getElementById('eagleTitleInput').value = '';
                document.getElementById('eagleRoomInput').value = '';
                AppModules.Modal.alert("Success", "Session created successfully!");
            } catch (e) { AppModules.Modal.alert("Error", "Failed to create: " + e.message); }
        };

        window.deleteEagleSession = async (id) => {
            if (!await AppModules.Modal.confirm("Delete Session", "Delete this session and all its registrations?", "Delete")) return;
            await set(ref(db, `eagle_time/sessions/${id}`), null);
        };
        // Grade Calculator Logic
        let lastIsMobile = window.innerWidth < 1024;
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth < 1024;
            if (isMobile !== lastIsMobile) {
                lastIsMobile = isMobile;
                const newsSec = document.getElementById('newsSection');
                const sidePanel = document.getElementById('sidePanel');
                const chatSec = document.getElementById('chatSection');
                const bottomNav = document.getElementById('bottomNav');

                // Clear any lingering animation states
                [newsSec, sidePanel, chatSec].forEach(el => {
                    if (el) {
                        el.style.animation = '';
                        el.style.zIndex = '';
                        el.classList.remove('absolute', 'h-full', 'top-0', 'left-0', 'slide-in-left', 'slide-in-right');
                    }
                });
                window.isTabAnimating = false;

                if (!isMobile) {
                    // Switch to Desktop: Use AppView to show all panels
                    window.AppView.showPanel('news'); // In Desktop, showPanel ensures all are flex
                } else {
                    // Switch to Mobile: determine which panel to show based on activeTargetId or currentPanel
                    const panelToRestore = activeTargetId ? 'chat' : (window.AppView.currentPanel || 'news');
                    window.AppView.showPanel(panelToRestore);
                }
            }
        });

        // Cafeteria Menu Logic
        let cafeteriaPool = {};
        let cafeteriaMenus = {};
        let currentCafeteriaTab = 'today';
        let selectedFoods = { today: new Set(), tomorrow: new Set() };
        let cafeteriaListener1 = null;
        let cafeteriaListener2 = null;
        let moduleListener = null;



        window.openCafeteria = () => {
            currentModule = 'cafeteria';
            const btn = document.getElementById('cafeteriaEditBtn');
            if (btn) {
                btn.classList.toggle('hidden', !(AppModules.User.isTeacher() || AppModules.User.isAdmin()));
            }

            document.getElementById('cafeteriaTodayDate').innerText = getLocalDateString(0);
            document.getElementById('cafeteriaTomorrowDate').innerText = getLocalDateString(1);

            moduleListener = () => {
                if (cafeteriaListener1) { cafeteriaListener1(); cafeteriaListener1 = null; }
                if (cafeteriaListener2) { cafeteriaListener2(); cafeteriaListener2 = null; }
            };

            AppModules.View.openOverlay('cafeteriaPage', { onOpen: loadCafeteriaData, zIndex: AppModules.View.CONSTANTS.Z_INDEX.MODULE, isExclusive: true });
        };

        function loadCafeteriaData() {
            if (cafeteriaListener1) cafeteriaListener1();
            if (cafeteriaListener2) cafeteriaListener2();

            cafeteriaListener1 = onValue(ref(db, 'cafeteria/pool'), (snap) => {
                cafeteriaPool = snap.val() || {};
                renderCafeteriaView();
                renderCafeteriaEditPool();
            });

            cafeteriaListener2 = onValue(ref(db, 'cafeteria/menus'), (snap) => {
                cafeteriaMenus = snap.val() || {};
                renderCafeteriaView();
            });
        }

        function renderCafeteriaView() {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            const todayIds = cafeteriaMenus[todayStr] || [];
            const tomorrowIds = cafeteriaMenus[tomorrowStr] || [];

            const todayList = document.getElementById('cafeteriaTodayList');
            const tomorrowList = document.getElementById('cafeteriaTomorrowList');

            const renderItems = (ids, container) => {
                if (!ids || ids.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-400 py-4 font-medium">No menu published yet.</div>';
                    return;
                }
                let html = '';
                ids.forEach(id => {
                    if (cafeteriaPool[id]) {
                        html += `
                            <div class="flex items-center gap-3 py-1">
                                <div class="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                                <span class="text-base font-bold text-black dark:text-white">${escapeHTML(cafeteriaPool[id].name)}</span>
                            </div>
                        `;
                    }
                });
                container.innerHTML = html || '<div class="text-center text-gray-400 py-4 font-medium">Items no longer available.</div>';
            };

            if (todayList) renderItems(todayIds, todayList);
            if (tomorrowList) renderItems(tomorrowIds, tomorrowList);
        }

        window.openCafeteriaEdit = () => {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            selectedFoods.today = new Set(cafeteriaMenus[todayStr] || []);
            selectedFoods.tomorrow = new Set(cafeteriaMenus[tomorrowStr] || []);

            switchCafeteriaTab('today');

            const sheet = document.getElementById('cafeteriaEditSheet');
            sheet.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('cafeteriaEditBackdrop').classList.add('opacity-100');
                document.getElementById('cafeteriaEditContent').classList.remove('translate-y-full');
            });
        };

        window.closeCafeteriaEdit = () => {
            document.getElementById('cafeteriaEditBackdrop').classList.remove('opacity-100');
            document.getElementById('cafeteriaEditContent').classList.add('translate-y-full');
            setTimeout(() => document.getElementById('cafeteriaEditSheet').classList.add('hidden'), 400);
        };

        window.switchCafeteriaTab = (tab) => {
            currentCafeteriaTab = tab;

            const btnToday = document.getElementById('cafeteriaTabToday');
            const btnTomorrow = document.getElementById('cafeteriaTabTomorrow');
            if (tab === 'today') {
                btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
                btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
            } else {
                btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
                btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
            }

            renderCafeteriaEditPool();
        };

        function renderCafeteriaEditPool() {
            const listEl = document.getElementById('cafeteriaPoolList');
            if (!listEl) return;

            const poolKeys = Object.keys(cafeteriaPool);
            if (poolKeys.length === 0) {
                listEl.innerHTML = '<div class="p-6 text-center text-gray-400 font-medium">Pool is empty. Add food above.</div>';
                return;
            }

            const currentSet = selectedFoods[currentCafeteriaTab];

            let html = '';
            poolKeys.sort((a, b) => cafeteriaPool[a].name.localeCompare(cafeteriaPool[b].name)).forEach(id => {
                const item = cafeteriaPool[id];
                const isChecked = currentSet.has(id);

                html += `
                    <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onclick="toggleFoodSelection('${id}')">
                        <div class="flex items-center gap-4 flex-1">
                            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300 dark:border-gray-600'}">
                                ${isChecked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>' : ''}
                            </div>
                            <span class="text-base font-semibold text-black dark:text-white ${isChecked ? '' : 'opacity-80'}">${item.name}</span>
                        </div>
                        <button onclick="deleteFoodFromPool('${id}', event)" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;
            });

            listEl.innerHTML = html;
        }

        window.toggleFoodSelection = (id) => {
            const currentSet = selectedFoods[currentCafeteriaTab];
            if (currentSet.has(id)) {
                currentSet.delete(id);
            } else {
                currentSet.add(id);
            }
            renderCafeteriaEditPool();
        };

        window.addFoodToPool = async () => {
            const input = document.getElementById('newFoodInput');
            const name = input.value.trim();
            if (!name) return;

            const isDuplicate = Object.values(cafeteriaPool).some(item => item.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                AppModules.Modal.alert("Notice", "This food is already in the pool!");
                return;
            }

            const newRef = push(ref(db, 'cafeteria/pool'));
            await set(newRef, { name: name, timestamp: serverTimestamp() });
            input.value = '';
        };

        window.deleteFoodFromPool = async (id, event) => {
            event.stopPropagation();
            const ok = await AppModules.Modal.confirm("Delete Food", "Are you sure you want to delete this food from the pool?", "Delete");
            if (!ok) return;
            await set(ref(db, `cafeteria/pool/${id}`), null);

            selectedFoods.today.delete(id);
            selectedFoods.tomorrow.delete(id);
            renderCafeteriaEditPool();
        };

        window.clearAllLocalData = async () => {
            if (!await AppModules.Modal.confirm("Reset App", "This will wipe all locally cached messages and reload. Continue?", "Reset")) return;
            try {
                if (localDB) localDB.close();
                // Short delay to ensure connection is closed
                setTimeout(() => {
                    indexedDB.deleteDatabase("CHSChatCache");
                    location.reload();
                }, 100);
            } catch (e) {
                location.reload();
            }
        };

        window.saveCafeteriaMenu = async () => {
            const todayStr = getLocalDateString(0);
            const tomorrowStr = getLocalDateString(1);

            const updates = {};
            updates[`cafeteria/menus/${todayStr}`] = Array.from(selectedFoods.today);
            updates[`cafeteria/menus/${tomorrowStr}`] = Array.from(selectedFoods.tomorrow);

            try {
                await update(ref(db), updates);
                closeCafeteriaEdit();
            } catch (e) {
                AppModules.Modal.alert("Error", "Failed to save menu");
            }
        };

        let adminAllUsers = {};
        window.openAdminConsole = async () => {
            if (!AppModules.User.isAdmin()) return;
            AppModules.View.openOverlay('adminConsolePage', { zIndex: AppModules.View.CONSTANTS.Z_INDEX.ADMIN, isExclusive: true });
            const listEl = document.getElementById('adminUserList');
            listEl.innerHTML = '<div class="text-center text-gray-400 mt-20 animate-pulse">Fetching all users...</div>';
            try {
                const snap = await get(ref(db, 'users'));
                adminAllUsers = snap.val() || {};
                renderAdminUserList(adminAllUsers);
            } catch (err) {
                listEl.innerHTML = `<div class="text-center text-red-500 mt-20 p-4 font-bold">Error: ${err.message}</div>`;
            }
        };

        window.closeAdminConsole = () => {
            AppModules.View.closeOverlay('adminConsolePage', {
                onClose: () => {
                    document.getElementById('adminUserSearch').value = '';
                    document.getElementById('scanStatus').classList.add('hidden');
                }
            });
        };

        window.filterAdminUsers = () => {
            const term = document.getElementById('adminUserSearch').value.toLowerCase().trim();
            if (!term) { renderAdminUserList(adminAllUsers); return; }
            const filtered = {};
            Object.keys(adminAllUsers).forEach(id => {
                const u = adminAllUsers[id];
                const match = (u.name || '').toLowerCase().includes(term) ||
                    (u.email || '').toLowerCase().includes(term) ||
                    id.toLowerCase().includes(term);
                if (match) filtered[id] = u;
            });
            renderAdminUserList(filtered);
        };

        window.scanUserIssues = () => {
            const status = document.getElementById('scanStatus');
            status.classList.remove('hidden');
            status.innerText = "Analyzing accounts for integrity issues...";

            const emailMap = {};
            const problematic = {};

            Object.keys(adminAllUsers).forEach(id => {
                const u = adminAllUsers[id];
                const email = (u.email || '').toLowerCase().trim();
                const issues = [];

                // 1. Ghost ID Check (Legacy formats)
                if (id.includes('_gmail_') || id.includes('_inst_')) {
                    issues.push("Ghost ID");
                }

                // 2. Missing or invalid email
                if (!email) {
                    issues.push("Missing Email");
                } else if (!email.includes('@') || email.length < 5) {
                    issues.push("Invalid Email");
                }

                // 3. Empty Name
                if (!(u.name || '').trim()) {
                    issues.push("Empty Name");
                }

                // 4. Role Consistency Check
                if (email) {
                    const domain = email.split('@')[1];
                    if (domain === 'hcpss.org' && u.role !== 'teacher' && u.role !== 'admin') issues.push("Role Conflict (Staff)");
                    if (domain === 'inst.hcpss.org' && u.role !== 'student') issues.push("Role Conflict (Student)");
                }

                if (issues.length > 0) {
                    problematic[id] = { ...u, scanIssues: issues };
                }

                // Track emails for duplicate detection
                if (email) {
                    if (!emailMap[email]) emailMap[email] = [];
                    emailMap[email].push(id);
                }
            });

            // 5. Duplicate emails detection
            Object.keys(emailMap).forEach(email => {
                if (emailMap[email].length > 1) {
                    emailMap[email].forEach(id => {
                        if (!problematic[id]) problematic[id] = { ...adminAllUsers[id], scanIssues: [] };
                        if (!problematic[id].scanIssues.includes("Duplicate Email")) {
                            problematic[id].scanIssues.push("Duplicate Email");
                        }
                    });
                }
            });

            renderAdminUserList(problematic, true);
            status.innerText = `Scan Complete: Found ${Object.keys(problematic).length} accounts with potential issues.`;
            document.getElementById('adminShowAllBtn').classList.remove('hidden');
        };

        window.resetAdminList = () => {
            document.getElementById('adminUserSearch').value = '';
            document.getElementById('scanStatus').classList.add('hidden');
            document.getElementById('adminShowAllBtn').classList.add('hidden');
            renderAdminUserList(adminAllUsers);
        };

        function renderAdminUserList(users, isScanResult = false) {
            const container = document.getElementById('adminUserList');
            const ids = Object.keys(users);
            if (ids.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 mt-20">No users found.</div>';
                return;
            }

            container.innerHTML = ids.map(id => {
                const u = users[id];
                const issues = u.scanIssues || [];
                const issuesHtml = issues.map(issue =>
                    `<span class="bg-red-500/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">${issue}</span>`
                ).join(' ');

                return `
                    <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div class="flex justify-between items-start gap-4">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 flex-wrap mb-1">
                                    <span class="font-bold text-black dark:text-white truncate">${escapeHTML(u.name || 'No Name')}</span>
                                    <span class="bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">${u.role || 'user'}</span>
                                    ${issuesHtml}
                                </div>
                                <div class="text-xs text-gray-400 truncate font-medium">${escapeHTML(u.email || 'NO EMAIL')}</div>
                                <div class="text-[10px] text-gray-500 font-mono mt-1 opacity-50 select-all">ID: ${id}</div>
                            </div>
                            <button onclick="confirmDeleteUser('${id}')"
                                class="bg-red-50 dark:bg-red-500/10 text-red-500 p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        window.confirmDeleteUser = async (userId) => {
            const u = adminAllUsers[userId] || { name: userId };

            const firstOk = await AppModules.Modal.confirm(
                "Destroy User Account?",
                `This will PERMANENTLY delete <b>${escapeHTML(u.name || userId)}</b> and all associated chat logs. Irreversible action.`,
                "DELETE ACCOUNT"
            );
            if (!firstOk) return;

            const secondOk = await AppModules.Modal.confirm(
                "FINAL WARNING",
                `Are you absolutely sure? You are about to wipe all data for ${escapeHTML(u.name || userId)}.`,
                "YES, WIPE EVERYTHING"
            );
            if (secondOk) {
                deleteUserFully(userId);
            }
        };

        window.deleteUserFully = async (userId) => {
            const listEl = document.getElementById('adminUserList');
            const status = document.getElementById('scanStatus');
            status.classList.remove('hidden');
            status.innerText = `Purging ${userId} from system...`;

            try {
                // 1. Delete user record
                await set(ref(db, `users/${userId}`), null);
                await set(ref(db, `user_private/${userId}`), null); // If exists

                // 2. Delete user chats index
                const userChatsRef = ref(db, `user_chats/${userId.toLowerCase()}`);
                const chatsSnap = await get(userChatsRef);
                const chats = chatsSnap.val() || {};

                // 3. Cascade delete: iterate all people this user chatted with
                const otherUserIds = Object.keys(chats);
                for (const otherId of otherUserIds) {
                    // Remove current user from other person's list
                    await set(ref(db, `user_chats/${otherId.toLowerCase()}/${userId.toLowerCase()}`), null);
                    // Delete the message thread
                    const chatId = getChatId(userId, otherId);
                    await set(ref(db, `messages/${chatId}`), null);
                }

                // Delete the user's own chat index
                await set(userChatsRef, null);

                // Success
                delete adminAllUsers[userId];
                renderAdminUserList(adminAllUsers);
                status.innerText = `User ${userId} successfully purged from database.`;
                setTimeout(() => status.classList.add('hidden'), 3000);
            } catch (err) {
                AppModules.Modal.alert("Error", "Purge failed: " + err.message);
                status.innerText = "Error during purge sequence.";
            }
        };

        // Class Management Functions
        window.openClassEdit = async (classId) => {
            const snap = await get(ref(db, `classes/${classId}`));
            const c = snap.val();
            if (!c) return;

            // 1. Edit Name
            const newName = await AppModules.Modal.prompt("Edit Class Name", "Enter the new name for this class:", c.name);
            if (newName === null) return;
            if (newName.trim() && newName.trim() !== c.name) {
                await update(ref(db, `classes/${classId}`), { name: newName.trim() });
            }

            // 2. Manage Roster
            const rosterAction = await AppModules.Modal.confirm("Manage Roster", "Would you like to add a new student by email?", "Add Student");
            if (rosterAction) {
                const email = await AppModules.Modal.prompt("Add Student", "Enter the student's HCPSS email address:");
                if (email) {
                    const usersSnap = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(email.toLowerCase().trim())));
                    if (!usersSnap.exists()) {
                        await AppModules.Modal.alert("Error", "No registered user found with that email.");
                    } else {
                        const uid = Object.keys(usersSnap.val())[0];
                        await update(ref(db, `classes/${classId}/students`), { [uid]: true });
                        await AppModules.Modal.alert("Success", "Student added to the class roster.");
                    }
                }
            }

            const extAction = await AppModules.Modal.confirm("Manage Extensions", "Which extension would you like to manage?", "IR Hub", "3D Volume");
            if (extAction !== null) {
                const eid = extAction ? 'independent_research' : 'calc_volume_3d';
                const name = extAction ? 'IR Navigator' : '3D Volume Visualizer';
                const isEnabled = c.extensions && c.extensions[eid];
                const toggle = await AppModules.Modal.confirm(
                    name,
                    `${name} is currently <b>${isEnabled ? 'ENABLED' : 'DISABLED'}</b>. Would you like to ${isEnabled ? 'REMOVE' : 'ACTIVATE'} it?`,
                    isEnabled ? "DEACTIVATE" : "ACTIVATE"
                );
                if (toggle) {
                    await update(ref(db, `classes/${classId}/extensions`), { [eid]: !isEnabled });
                    await AppModules.Modal.alert("Success", `Extension updated successfully.`);
                }
            }

            AppModules.Sidebar.renderSidebar();
        };

        window.addNewClass = async () => {
            const name = await AppModules.Modal.prompt("Create New Class", "Enter the name for the new class:");
            if (!name || !name.trim()) return;

            try {
                const newRef = push(ref(db, 'classes'));
                await set(newRef, {
                    name: name.trim(),
                    teacherId: currentUser.id,
                    timestamp: serverTimestamp(),
                    lastActivity: serverTimestamp(),
                    students: {}
                });
                AppModules.Sidebar.renderSidebar();
                AppModules.Modal.alert("Success", "Class created successfully.");
            } catch (e) {
                AppModules.Modal.alert("Error", "Failed to create class: " + e.message);
            }
        };



        // Initialize user interaction records for groups
        
    