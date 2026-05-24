/**
 * ==================================================================================
 * Module: SettingsModule (js/settings.js)
 * Purpose: Handles preferences settings UI initialization, sound update, theme
 *          change, and changelog/donation UI control.
 * ==================================================================================
 */

export const SettingsModule = {
    initSettingsUI() {
        this.ensureSettingsModal();
        const SETTINGS = window.SETTINGS || {};
        const SOUNDS = window.SOUNDS || [];
        const AppModules = window.AppModules || {};

        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = SETTINGS.soundEnabled;
        }
        this.updateSettingsLabels();
        
        const soundDropdown = document.getElementById('soundDropdown');
        if (soundDropdown) {
            soundDropdown.innerHTML = '';
            SOUNDS.forEach((s, index) => {
                const btn = document.createElement('button');
                btn.className = `w-full text-left px-4 py-3 text-[15px] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${index !== SOUNDS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`;
                btn.innerText = s.name;
                btn.onclick = (e) => window.selectSound(s.url, e);
                soundDropdown.appendChild(btn);
            });
        }

        if (AppModules.User && typeof AppModules.User.isAdmin === 'function' && AppModules.User.isAdmin()) {
            document.getElementById('adminPanel')?.classList.remove('hidden');
        }
    },

    updateSettingsLabels() {
        const SETTINGS = window.SETTINGS || {};
        const SOUNDS = window.SOUNDS || [];
        if (document.getElementById('currentSoundLabel')) {
            document.getElementById('currentSoundLabel').innerText = SOUNDS.find(s => s.url === SETTINGS.soundUrl)?.name || 'Note';
        }
        const theme = localStorage.getItem('theme') || 'system';
        if (document.getElementById('currentThemeLabel')) {
            document.getElementById('currentThemeLabel').innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
        }
    },

    ensureSettingsModal() {
        if (document.getElementById('settingsModal')) return;
        document.body.insertAdjacentHTML('beforeend', `
    <div id="settingsModal" onclick="if(event.target === this) toggleSettings()"
        class="hidden fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
        <div class="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-2xl shadow-2xl slide-up overflow-visible">
            <div
                class="p-4 border-b border-gray-200/60 dark:border-gray-800 flex justify-between items-center rounded-t-2xl bg-white dark:bg-[#1C1C1E]">
                <h3 id="settingsModalTitle" class="font-bold text-lg">Settings</h3>
                <button onclick="toggleSettings()" class="text-[#007AFF] font-medium text-base">Done</button>
            </div>
            <div class="p-6 space-y-6 bg-white dark:bg-[#1C1C1E] rounded-b-2xl max-h-[70vh] overflow-y-auto">

                <div id="settingsView" class="space-y-6">
                    <div class="relative">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Profile</label>
                        <div class="bg-gray-100 dark:bg-white/10 rounded-xl overflow-hidden">
                            <div class="flex items-center px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
                                <input type="text" id="firstNameInput" placeholder="First Name"
                                    class="w-full bg-transparent outline-none text-base py-1 text-black dark:text-white">
                            </div>
                            <div class="flex items-center px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
                                <input type="text" id="lastNameInput" placeholder="Last Name"
                                    class="w-full bg-transparent outline-none text-base py-1 text-black dark:text-white">
                            </div>
                            <button onclick="saveProfileName(event)"
                                class="w-full text-[#007AFF] font-medium py-3 text-base active:bg-gray-200 dark:active:bg-white/20 transition-colors">
                                Update Name
                            </button>
                        </div>
                    </div>

                    <div class="relative" id="themeDropdownContainer">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Appearance</label>
                        <div onclick="toggleDropdown('themeDropdown', event)"
                            class="flex items-center justify-between p-3.5 bg-gray-100 dark:bg-white/10 rounded-xl cursor-pointer">
                            <span class="font-medium">Theme</span>
                            <div class="flex items-center text-gray-500">
                                <span id="currentThemeLabel" class="mr-2">System</span>
                                <svg id="themeDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <div id="themeDropdown"
                            class="custom-dropdown hidden absolute top-[calc(100%+8px)] right-0 w-40 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                            <button onclick="selectTheme('system', event)"
                                class="w-full text-left px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">System</button>
                            <button onclick="selectTheme('light', event)"
                                class="w-full text-left px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">Light</button>
                            <button onclick="selectTheme('dark', event)"
                                class="w-full text-left px-4 py-3 text-sm">Dark</button>
                        </div>
                    </div>

                    <div class="relative">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Legal</label>
                        <button onclick="showTos(false)"
                            class="w-full flex items-center justify-between p-3.5 bg-gray-100 dark:bg-white/10 rounded-xl active:bg-gray-200 dark:active:bg-white/20 transition-colors">
                            <span class="font-medium">Terms of Service</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div class="flex items-center justify-between p-3.5 bg-gray-100 dark:bg-white/10 rounded-xl">
                        <label class="font-medium">Sound Effects</label>
                        <input type="checkbox" id="soundToggle" onchange="toggleSound(this.checked)"
                            class="w-6 h-6 accent-blue-500">
                    </div>

                    <div class="relative">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Software</label>
                        <button onclick="showChangelog()"
                            class="w-full flex items-center justify-between p-3.5 bg-gray-100 dark:bg-white/10 rounded-xl active:bg-gray-200 dark:active:bg-white/20 transition-colors">
                            <div class="text-left">
                                <div class="font-medium">Engineering Log</div>
                                <div class="text-xs text-gray-500">Version 5.0.0 (Latest)</div>
                            </div>
                            <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div class="pt-2 space-y-2">
                        <button onclick="handleSignOut()"
                            class="w-full bg-red-50 dark:bg-red-500/10 text-red-500 py-3 rounded-xl font-semibold text-base hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                            Sign Out
                        </button>
                        <button onclick="clearAllLocalData()"
                            class="w-full text-gray-400 text-xs font-medium py-2 hover:text-red-500 transition-colors">
                            Trouble? Clear Local Cache
                        </button>
                    </div>

                    <div class="pt-4 pb-2 text-center">
                        <span id="appVersionLabel"
                            class="text-[10px] text-gray-400 dark:text-gray-600 font-mono tracking-widest uppercase"></span>
                    </div>

                    <div id="adminPanel"
                        class="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 hidden space-y-4">
                        <h3 class="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Admin Security</h3>
                        <button onclick="openAdminConsole()"
                            class="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all mb-4">
                            Open Database Console (Advanced)
                        </button>

                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 mt-6">Management Tools
                        </h3>
                        <button onclick="adminPurgeImages()"
                            class="w-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 py-4 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98]">
                            Purge Private Image Storage
                        </button>

                        <div
                            class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/20">
                            <div class="flex-1 pr-4">
                                <label class="font-bold text-red-600 dark:text-red-400 text-sm">Disable All
                                    Photos</label>
                                <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">Hide/Block
                                    all images to save data & bandwidth</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="globalPhotoToggle"
                                    onchange="toggleGlobalPhotos(this.checked)" class="sr-only peer">
                                <div
                                    class="w-11 h-6 bg-gray-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500">
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div id="changelogView"
                    class="hidden space-y-6 pb-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    <!-- Content injected from content.js -->
                </div>

                <div id="donationView" class="hidden space-y-5">
                    <div class="text-center space-y-2">
                        <div
                            class="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <svg class="w-8 h-8 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm px-4">Support CHSchat development. Your
                            contributions help keep the project running!</p>
                    </div>
                    <div id="donationButtons" class="space-y-3">
                        <button onclick="openDonationQR('paypal', './resources/donate/paypal-qr.jpg')"
                            class="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-white/10 rounded-2xl active:scale-95 transition-transform">
                            <span class="font-bold">PayPal</span>
                            <span
                                class="w-6 h-6 rounded-full bg-[#003087] text-white font-black text-sm flex items-center justify-center">P</span>
                        </button>
                        <button onclick="openDonationQR('wechat', './resources/donate/wechat-qr.png')"
                            class="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-white/10 rounded-2xl active:scale-95 transition-transform">
                            <span class="font-bold">WeChat Pay</span>
                            <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M8.6 13.5c.3 0 .6-.1.8-.3.2-.2.3-.5.3-.8s-.1-.6-.3-.8c-.2-.2-.5-.3-.8-.3s-.6.1-.8.3c-.2.2-.3.5-.3.8s.1.6.3.8c.2.2.5.3.8.3zm6.8 0c.3 0 .6-.1.8-.3.2-.2.3-.5.3-.8s-.1-.6-.3-.8c-.2-.2-.5-.3-.8-.3s-.6.1-.8.3c-.2.2-.3.5-.3.8s.1.6.3.8c.2.2.5.3.8.3zM12 2C6.5 2 2 5.8 2 10.5c0 2.6 1.4 4.9 3.6 6.4L5 19.3c-.1.3.1.6.4.5l3.2-1.6c1.1.3 2.2.5 3.4.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2zm6.6 13.9c1.6-1.1 2.6-2.8 2.6-4.6 0-3.8-3.6-6.9-8-6.9s-8 3.1-8 6.9c0 1.9 1 3.6 2.6 4.7l-.4 2c0 .2.1.3.3.3l2.2-1.1c.9.2 1.8.3 2.7.3s1.9-.1 2.8-.3l2.1 1.1c.2.1.4-.1.3-.3l-.4-2.1z" />
                            </svg>
                        </button>
                        <button onclick="openDonationQR('alipay', './resources/donate/alipay-qr.jpg')"
                            class="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-white/10 rounded-2xl active:scale-95 transition-transform">
                            <span class="font-bold">Alipay</span>
                            <span
                                class="w-6 h-6 rounded-full bg-[#1677FF] text-white font-black text-sm flex items-center justify-center">A</span>
                        </button>
                    </div>
                    <div id="donationQRContainer" class="hidden space-y-4">
                        <button onclick="closeDonationQR()"
                            class="text-[#007AFF] text-sm font-medium flex items-center gap-1">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <div class="bg-white rounded-2xl p-4 flex items-center justify-center">
                            <img id="donationQRImg" src="" class="max-w-full max-h-[50vh] rounded-xl object-contain" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
        `);
    }
};

// Expose functions globally to support inline HTML event handlers
window.updateSound = (url) => {
    const SETTINGS = window.SETTINGS || {};
    const AppModules = window.AppModules || {};
    SETTINGS.soundUrl = url;
    localStorage.setItem('soundUrl', url);
    
    if (AppModules.Notify) {
        AppModules.Notify.setSound(url);
        if (AppModules.Notify.audio) AppModules.Notify.audio.play();
    }
};

window.toggleSound = (enabled) => {
    const SETTINGS = window.SETTINGS || {};
    SETTINGS.soundEnabled = enabled;
    localStorage.setItem('soundEnabled', enabled);
};

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

window.selectSound = (val, e) => {
    if (e) e.stopPropagation();
    window.updateSound(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('soundDropdown');
};

window.selectTheme = (val, e) => {
    if (e) e.stopPropagation();
    window.applyTheme(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('themeDropdown', e);
};

// Wrapper bindings around AppModules.View
window.applyTheme = (mode) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.applyTheme === 'function') {
        AppModules.View.applyTheme(mode);
    }
};

window.toggleSettings = (view = 'settings') => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.toggleSettings === 'function') {
        AppModules.View.toggleSettings(view, window.currentUser);
    }
};

window.toggleDonation = () => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.toggleSettings === 'function') {
        AppModules.View.toggleSettings('donation', window.currentUser);
    }
};

window.openDonationQR = (method, fallbackUrl) => {
    const AppModules = window.AppModules || {};
    const DONATIONS = window.DONATIONS || {};
    if (AppModules.View && typeof AppModules.View.openDonationQR === 'function') {
        AppModules.View.openDonationQR(method, fallbackUrl, DONATIONS);
    }
};

window.closeDonationQR = () => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.closeDonationQR === 'function') {
        AppModules.View.closeDonationQR();
    }
};

window.toggleDropdown = (id, e) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.toggleDropdown === 'function') {
        AppModules.View.toggleDropdown(id, e);
    }
};

// Expose settings helper functions to window for backward compatibility or direct calls
window.initSettingsUI = () => SettingsModule.initSettingsUI();
window.updateSettingsLabels = () => SettingsModule.updateSettingsLabels();
