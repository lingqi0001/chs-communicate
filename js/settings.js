/**
 * ==================================================================================
 * Module: SettingsModule (js/settings.js)
 * Purpose: Handles preferences settings UI initialization, sound update, theme
 *          change, and changelog/donation UI control.
 * ==================================================================================
 */

export const SettingsModule = {
    initSettingsUI() {
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
