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
        // Announcement Color UI Update
        const annColor = localStorage.getItem('annAccentColor') || 'orange';
        const customAnnLightHex = localStorage.getItem('annCustomColorLightHex') || '#F97316';
        const customAnnDarkHex = localStorage.getItem('annCustomColorDarkHex') || '#A724FF';

        if (document.getElementById('currentAnnColorLabel')) {
            document.getElementById('currentAnnColorLabel').innerText = annColor === 'custom' ? 'Custom' : (annColor.charAt(0).toUpperCase() + annColor.slice(1));
        }

        const annPreview = document.getElementById('currentAnnColorPreview');
        if (annPreview) {
            if (annColor === 'orange') {
                annPreview.style.background = '';
                annPreview.style.backgroundColor = '#F97316';
                annPreview.style.backgroundClip = '';
                annPreview.style.webkitBackgroundClip = '';
                annPreview.style.borderColor = '';
            } else if (annColor === 'blue') {
                annPreview.style.background = '';
                annPreview.style.backgroundColor = '#007AFF';
                annPreview.style.backgroundClip = '';
                annPreview.style.webkitBackgroundClip = '';
                annPreview.style.borderColor = '';
            } else if (annColor === 'green') {
                annPreview.style.background = '';
                annPreview.style.backgroundColor = '#95FF14';
                annPreview.style.backgroundClip = '';
                annPreview.style.webkitBackgroundClip = '';
                annPreview.style.borderColor = '';
            } else if (annColor === 'purple') {
                annPreview.style.background = '';
                annPreview.style.backgroundColor = '#A724FF';
                annPreview.style.backgroundClip = '';
                annPreview.style.webkitBackgroundClip = '';
                annPreview.style.borderColor = '';
            } else if (annColor === 'custom') {
                annPreview.style.background = `linear-gradient(90deg, ${customAnnLightHex} 50%, ${customAnnDarkHex} 50%)`;
                annPreview.style.backgroundColor = 'transparent';
                annPreview.style.backgroundClip = 'padding-box';
                annPreview.style.webkitBackgroundClip = 'padding-box';
                annPreview.style.borderColor = 'rgba(120, 120, 128, 0.4)';
            }
        }

        const annPickersContainer = document.getElementById('annCustomPickersContainer');
        if (annPickersContainer) {
            if (annColor === 'custom') {
                annPickersContainer.classList.remove('hidden');
            } else {
                annPickersContainer.classList.add('hidden');
            }
        }

        const annLightPreview = document.getElementById('annCustomColorLightPreview');
        if (annLightPreview) annLightPreview.style.backgroundColor = customAnnLightHex;

        const annDarkPreview = document.getElementById('annCustomColorDarkPreview');
        if (annDarkPreview) annDarkPreview.style.backgroundColor = customAnnDarkHex;

        const annLightInput = document.getElementById('annColorPickerLight');
        if (annLightInput) annLightInput.value = customAnnLightHex;

        const annDarkInput = document.getElementById('annColorPickerDark');
        if (annDarkInput) annDarkInput.value = customAnnDarkHex;


        // Messaging Color UI Update
        const msgColor = localStorage.getItem('msgAccentColor') || 'blue';
        const customMsgLightHex = localStorage.getItem('msgCustomColorLightHex') || '#007AFF';
        const customMsgDarkHex = localStorage.getItem('msgCustomColorDarkHex') || '#0A84FF';

        if (document.getElementById('currentMsgColorLabel')) {
            document.getElementById('currentMsgColorLabel').innerText = msgColor === 'custom' ? 'Custom' : (msgColor.charAt(0).toUpperCase() + msgColor.slice(1));
        }

        const msgPreview = document.getElementById('currentMsgColorPreview');
        if (msgPreview) {
            if (msgColor === 'orange') {
                msgPreview.style.background = '';
                msgPreview.style.backgroundColor = '#F97316';
                msgPreview.style.backgroundClip = '';
                msgPreview.style.webkitBackgroundClip = '';
                msgPreview.style.borderColor = '';
            } else if (msgColor === 'blue') {
                msgPreview.style.background = '';
                msgPreview.style.backgroundColor = '#007AFF';
                msgPreview.style.backgroundClip = '';
                msgPreview.style.webkitBackgroundClip = '';
                msgPreview.style.borderColor = '';
            } else if (msgColor === 'green') {
                msgPreview.style.background = '';
                msgPreview.style.backgroundColor = '#95FF14';
                msgPreview.style.backgroundClip = '';
                msgPreview.style.webkitBackgroundClip = '';
                msgPreview.style.borderColor = '';
            } else if (msgColor === 'purple') {
                msgPreview.style.background = '';
                msgPreview.style.backgroundColor = '#A724FF';
                msgPreview.style.backgroundClip = '';
                msgPreview.style.webkitBackgroundClip = '';
                msgPreview.style.borderColor = '';
            } else if (msgColor === 'custom') {
                msgPreview.style.background = `linear-gradient(90deg, ${customMsgLightHex} 50%, ${customMsgDarkHex} 50%)`;
                msgPreview.style.backgroundColor = 'transparent';
                msgPreview.style.backgroundClip = 'padding-box';
                msgPreview.style.webkitBackgroundClip = 'padding-box';
                msgPreview.style.borderColor = 'rgba(120, 120, 128, 0.4)';
            }
        }

        const msgPickersContainer = document.getElementById('msgCustomPickersContainer');
        if (msgPickersContainer) {
            if (msgColor === 'custom') {
                msgPickersContainer.classList.remove('hidden');
            } else {
                msgPickersContainer.classList.add('hidden');
            }
        }

        const msgLightPreview = document.getElementById('msgCustomColorLightPreview');
        if (msgLightPreview) msgLightPreview.style.backgroundColor = customMsgLightHex;

        const msgDarkPreview = document.getElementById('msgCustomColorDarkPreview');
        if (msgDarkPreview) msgDarkPreview.style.backgroundColor = customMsgDarkHex;

        const msgLightInput = document.getElementById('msgColorPickerLight');
        if (msgLightInput) msgLightInput.value = customMsgLightHex;

        const msgDarkInput = document.getElementById('msgColorPickerDark');
        if (msgDarkInput) msgDarkInput.value = customMsgDarkHex;


        // Your Message (chat) Color UI Update
        const chatColor = localStorage.getItem('chatAccentColor') || 'blue';
        const customChatLightHex = localStorage.getItem('chatCustomColorLightHex') || '#007AFF';
        const customChatDarkHex = localStorage.getItem('chatCustomColorDarkHex') || '#0A84FF';

        if (document.getElementById('currentChatColorLabel')) {
            document.getElementById('currentChatColorLabel').innerText = chatColor === 'custom' ? 'Custom' : (chatColor.charAt(0).toUpperCase() + chatColor.slice(1));
        }

        const chatPreview = document.getElementById('currentChatColorPreview');
        if (chatPreview) {
            if (chatColor === 'orange') {
                chatPreview.style.background = '';
                chatPreview.style.backgroundColor = '#F97316';
                chatPreview.style.backgroundClip = '';
                chatPreview.style.webkitBackgroundClip = '';
                chatPreview.style.borderColor = '';
            } else if (chatColor === 'blue') {
                chatPreview.style.background = '';
                chatPreview.style.backgroundColor = '#007AFF';
                chatPreview.style.backgroundClip = '';
                chatPreview.style.webkitBackgroundClip = '';
                chatPreview.style.borderColor = '';
            } else if (chatColor === 'green') {
                chatPreview.style.background = '';
                chatPreview.style.backgroundColor = '#95FF14';
                chatPreview.style.backgroundClip = '';
                chatPreview.style.webkitBackgroundClip = '';
                chatPreview.style.borderColor = '';
            } else if (chatColor === 'purple') {
                chatPreview.style.background = '';
                chatPreview.style.backgroundColor = '#A724FF';
                chatPreview.style.backgroundClip = '';
                chatPreview.style.webkitBackgroundClip = '';
                chatPreview.style.borderColor = '';
            } else if (chatColor === 'custom') {
                chatPreview.style.background = `linear-gradient(90deg, ${customChatLightHex} 50%, ${customChatDarkHex} 50%)`;
                chatPreview.style.backgroundColor = 'transparent';
                chatPreview.style.backgroundClip = 'padding-box';
                chatPreview.style.webkitBackgroundClip = 'padding-box';
                chatPreview.style.borderColor = 'rgba(120, 120, 128, 0.4)';
            }
        }

        const chatPickersContainer = document.getElementById('chatCustomPickersContainer');
        if (chatPickersContainer) {
            if (chatColor === 'custom') {
                chatPickersContainer.classList.remove('hidden');
            } else {
                chatPickersContainer.classList.add('hidden');
            }
        }

        const chatLightPreview = document.getElementById('chatCustomColorLightPreview');
        if (chatLightPreview) chatLightPreview.style.backgroundColor = customChatLightHex;

        const chatDarkPreview = document.getElementById('chatCustomColorDarkPreview');
        if (chatDarkPreview) chatDarkPreview.style.backgroundColor = customChatDarkHex;

        const chatLightInput = document.getElementById('chatColorPickerLight');
        if (chatLightInput) chatLightInput.value = customChatLightHex;

        const chatDarkInput = document.getElementById('chatColorPickerDark');
        if (chatDarkInput) chatDarkInput.value = customChatDarkHex;

        // Other Messages Color UI Update
        const otherMsgColor = localStorage.getItem('otherMsgAccentColor') || 'gray';
        const customOtherMsgLightHex = localStorage.getItem('otherMsgCustomColorLightHex') || '#E9E9EB';
        const customOtherMsgDarkHex = localStorage.getItem('otherMsgCustomColorDarkHex') || '#3A3A3C';

        if (document.getElementById('currentOtherMsgColorLabel')) {
            document.getElementById('currentOtherMsgColorLabel').innerText = otherMsgColor === 'custom' ? 'Custom' : (otherMsgColor.charAt(0).toUpperCase() + otherMsgColor.slice(1));
        }

        const otherMsgPreview = document.getElementById('currentOtherMsgColorPreview');
        if (otherMsgPreview) {
            if (otherMsgColor === 'gray') {
                otherMsgPreview.style.background = '';
                otherMsgPreview.style.backgroundColor = '#8E8E93';
                otherMsgPreview.style.backgroundClip = '';
                otherMsgPreview.style.webkitBackgroundClip = '';
                otherMsgPreview.style.borderColor = '';
            } else if (otherMsgColor === 'orange') {
                otherMsgPreview.style.background = '';
                otherMsgPreview.style.backgroundColor = '#F97316';
                otherMsgPreview.style.backgroundClip = '';
                otherMsgPreview.style.webkitBackgroundClip = '';
                otherMsgPreview.style.borderColor = '';
            } else if (otherMsgColor === 'blue') {
                otherMsgPreview.style.background = '';
                otherMsgPreview.style.backgroundColor = '#007AFF';
                otherMsgPreview.style.backgroundClip = '';
                otherMsgPreview.style.webkitBackgroundClip = '';
                otherMsgPreview.style.borderColor = '';
            } else if (otherMsgColor === 'green') {
                otherMsgPreview.style.background = '';
                otherMsgPreview.style.backgroundColor = '#95FF14';
                otherMsgPreview.style.backgroundClip = '';
                otherMsgPreview.style.webkitBackgroundClip = '';
                otherMsgPreview.style.borderColor = '';
            } else if (otherMsgColor === 'purple') {
                otherMsgPreview.style.background = '';
                otherMsgPreview.style.backgroundColor = '#A724FF';
                otherMsgPreview.style.backgroundClip = '';
                otherMsgPreview.style.webkitBackgroundClip = '';
                otherMsgPreview.style.borderColor = '';
            } else if (otherMsgColor === 'custom') {
                otherMsgPreview.style.background = `linear-gradient(90deg, ${customOtherMsgLightHex} 50%, ${customOtherMsgDarkHex} 50%)`;
                otherMsgPreview.style.backgroundColor = 'transparent';
                otherMsgPreview.style.backgroundClip = 'padding-box';
                otherMsgPreview.style.webkitBackgroundClip = 'padding-box';
                otherMsgPreview.style.borderColor = 'rgba(120, 120, 128, 0.4)';
            }
        }

        const otherMsgPickersContainer = document.getElementById('otherMsgCustomPickersContainer');
        if (otherMsgPickersContainer) {
            if (otherMsgColor === 'custom') {
                otherMsgPickersContainer.classList.remove('hidden');
            } else {
                otherMsgPickersContainer.classList.add('hidden');
            }
        }

        const otherMsgLightPreview = document.getElementById('otherMsgCustomColorLightPreview');
        if (otherMsgLightPreview) otherMsgLightPreview.style.backgroundColor = customOtherMsgLightHex;

        const otherMsgDarkPreview = document.getElementById('otherMsgCustomColorDarkPreview');
        if (otherMsgDarkPreview) otherMsgDarkPreview.style.backgroundColor = customOtherMsgDarkHex;

        const otherMsgLightInput = document.getElementById('otherMsgColorPickerLight');
        if (otherMsgLightInput) otherMsgLightInput.value = customOtherMsgLightHex;

        const otherMsgDarkInput = document.getElementById('otherMsgColorPickerDark');
        if (otherMsgDarkInput) otherMsgDarkInput.value = customOtherMsgDarkHex;
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

                    <div id="themeDropdownContainer">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Appearance</label>
                        <div class="bg-gray-100 dark:bg-white/10 rounded-xl">
                            <!-- Theme Row -->
                            <div class="relative border-b border-gray-200 dark:border-gray-700">
                                <div onclick="toggleDropdown('themeDropdown', event)"
                                    class="flex items-center justify-between p-3.5 cursor-pointer">
                                    <span class="font-medium text-sm">Theme</span>
                                    <div class="flex items-center text-gray-500">
                                        <span id="currentThemeLabel" class="mr-2 text-xs">System</span>
                                        <svg id="themeDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div id="themeDropdown"
                                    class="custom-dropdown hidden absolute top-[calc(100%+4px)] right-0 w-40 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                                    <button onclick="selectTheme('system', event)"
                                        class="w-full text-left px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">System</button>
                                    <button onclick="selectTheme('light', event)"
                                        class="w-full text-left px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">Light</button>
                                    <button onclick="selectTheme('dark', event)"
                                        class="w-full text-left px-4 py-3 text-sm">Dark</button>
                                </div>
                            </div>

                            <!-- Announcement Accent -->
                            <div class="relative border-b border-gray-200 dark:border-gray-700">
                                <div onclick="toggleDropdown('annColorDropdown', event)"
                                    class="flex items-center justify-between p-3.5 cursor-pointer">
                                    <span class="font-medium text-sm">Announcement</span>
                                    <div class="flex items-center text-gray-500">
                                        <span id="currentAnnColorLabel" class="mr-2 text-xs">Orange</span>
                                        <div id="currentAnnColorPreview" class="w-3.5 h-3.5 rounded-full border border-white/20 mr-2 bg-orange-500"></div>
                                        <svg id="annColorDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div id="annColorDropdown"
                                    class="custom-dropdown hidden absolute top-[calc(100%+4px)] right-0 w-48 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                                    <button onclick="selectAnnColor('orange', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Orange</span>
                                        <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                                    </button>
                                    <button onclick="selectAnnColor('blue', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Blue</span>
                                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </button>
                                    <button onclick="selectAnnColor('green', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Green</span>
                                        <div class="w-3 h-3 rounded-full bg-[#95FF14]"></div>
                                    </button>
                                    <button onclick="selectAnnColor('purple', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Purple</span>
                                        <div class="w-3 h-3 rounded-full bg-[#A724FF]"></div>
                                    </button>
                                    <button onclick="selectAnnColor('custom', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between">
                                        <span>Custom</span>
                                        <div class="flex gap-0.5 items-center">
                                            <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                                            <svg class="w-3 h-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                                        </div>
                                    </button>
                                </div>
                                <div id="annCustomPickersContainer" class="hidden px-3.5 pb-3.5 grid grid-cols-2 gap-3">
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('annColorPickerLight').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Light Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="annCustomColorLightPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="annColorPickerLight" oninput="handleAnnColorPickerLightInput(this.value, event)" onchange="handleAnnColorPickerLightChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('annColorPickerDark').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dark Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="annCustomColorDarkPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="annColorPickerDark" oninput="handleAnnColorPickerDarkInput(this.value, event)" onchange="handleAnnColorPickerDarkChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Panel Accent -->
                            <div class="relative border-b border-gray-200 dark:border-gray-700">
                                <div onclick="toggleDropdown('msgColorDropdown', event)"
                                    class="flex items-center justify-between p-3.5 cursor-pointer">
                                    <span class="font-medium text-sm">Recent List</span>
                                    <div class="flex items-center text-gray-500">
                                        <span id="currentMsgColorLabel" class="mr-2 text-xs">Blue</span>
                                        <div id="currentMsgColorPreview" class="w-3.5 h-3.5 rounded-full border border-white/20 mr-2 bg-blue-500"></div>
                                        <svg id="msgColorDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div id="msgColorDropdown"
                                    class="custom-dropdown hidden absolute top-[calc(100%+4px)] right-0 w-48 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                                    <button onclick="selectMsgColor('orange', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Orange</span>
                                        <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                                    </button>
                                    <button onclick="selectMsgColor('blue', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Blue</span>
                                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </button>
                                    <button onclick="selectMsgColor('green', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Green</span>
                                        <div class="w-3 h-3 rounded-full bg-[#95FF14]"></div>
                                    </button>
                                    <button onclick="selectMsgColor('purple', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Purple</span>
                                        <div class="w-3 h-3 rounded-full bg-[#A724FF]"></div>
                                    </button>
                                    <button onclick="selectMsgColor('custom', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between">
                                        <span>Custom</span>
                                        <div class="flex gap-0.5 items-center">
                                            <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                                            <svg class="w-3 h-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                                        </div>
                                    </button>
                                </div>
                                <div id="msgCustomPickersContainer" class="hidden px-3.5 pb-3.5 grid grid-cols-2 gap-3">
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('msgColorPickerLight').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Light Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="msgCustomColorLightPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="msgColorPickerLight" oninput="handleMsgColorPickerLightInput(this.value, event)" onchange="handleMsgColorPickerLightChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('msgColorPickerDark').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dark Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="msgCustomColorDarkPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="msgColorPickerDark" oninput="handleMsgColorPickerDarkInput(this.value, event)" onchange="handleMsgColorPickerDarkChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Messages Accent -->
                            <div class="relative border-b border-gray-200 dark:border-gray-700">
                                <div onclick="toggleDropdown('chatColorDropdown', event)"
                                    class="flex items-center justify-between p-3.5 cursor-pointer">
                                    <span class="font-medium text-sm">Your Messages</span>
                                    <div class="flex items-center text-gray-500">
                                        <span id="currentChatColorLabel" class="mr-2 text-xs">Blue</span>
                                        <div id="currentChatColorPreview" class="w-3.5 h-3.5 rounded-full border border-white/20 mr-2 bg-blue-500"></div>
                                        <svg id="chatColorDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div id="chatColorDropdown"
                                    class="custom-dropdown hidden absolute top-[calc(100%+4px)] right-0 w-48 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                                    <button onclick="selectChatColor('orange', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Orange</span>
                                        <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                                    </button>
                                    <button onclick="selectChatColor('blue', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Blue</span>
                                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </button>
                                    <button onclick="selectChatColor('green', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Green</span>
                                        <div class="w-3 h-3 rounded-full bg-[#95FF14]"></div>
                                    </button>
                                    <button onclick="selectChatColor('purple', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Purple</span>
                                        <div class="w-3 h-3 rounded-full bg-[#A724FF]"></div>
                                    </button>
                                    <button onclick="selectChatColor('custom', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between">
                                        <span>Custom</span>
                                        <div class="flex gap-0.5 items-center">
                                            <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                                            <svg class="w-3 h-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                                        </div>
                                    </button>
                                </div>
                                <div id="chatCustomPickersContainer" class="hidden px-3.5 pb-3.5 grid grid-cols-2 gap-3">
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('chatColorPickerLight').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Light Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="chatCustomColorLightPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="chatColorPickerLight" oninput="handleChatColorPickerLightInput(this.value, event)" onchange="handleChatColorPickerLightChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('chatColorPickerDark').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dark Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="chatCustomColorDarkPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="chatColorPickerDark" oninput="handleChatColorPickerDarkInput(this.value, event)" onchange="handleChatColorPickerDarkChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Other Messages Accent -->
                            <div class="relative">
                                <div onclick="toggleDropdown('otherMsgColorDropdown', event)"
                                    class="flex items-center justify-between p-3.5 cursor-pointer">
                                    <span class="font-medium text-sm">Other Messages</span>
                                    <div class="flex items-center text-gray-500">
                                        <span id="currentOtherMsgColorLabel" class="mr-2 text-xs">Gray</span>
                                        <div id="currentOtherMsgColorPreview" class="w-3.5 h-3.5 rounded-full border border-white/20 mr-2 bg-gray-400"></div>
                                        <svg id="otherMsgColorDropdownIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div id="otherMsgColorDropdown"
                                    class="custom-dropdown hidden absolute top-[calc(100%+4px)] right-0 w-48 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-[115] overflow-hidden transform origin-top-right transition-all duration-200 opacity-0 scale-95">
                                    <button onclick="selectOtherMsgColor('gray', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Gray</span>
                                        <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                                    </button>
                                    <button onclick="selectOtherMsgColor('orange', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Orange</span>
                                        <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                                    </button>
                                    <button onclick="selectOtherMsgColor('blue', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Blue</span>
                                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </button>
                                    <button onclick="selectOtherMsgColor('green', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Green</span>
                                        <div class="w-3 h-3 rounded-full bg-[#95FF14]"></div>
                                    </button>
                                    <button onclick="selectOtherMsgColor('purple', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <span>Purple</span>
                                        <div class="w-3 h-3 rounded-full bg-[#A724FF]"></div>
                                    </button>
                                    <button onclick="selectOtherMsgColor('custom', event)"
                                        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between">
                                        <span>Custom</span>
                                        <div class="flex gap-0.5 items-center">
                                            <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                                            <svg class="w-3 h-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                                        </div>
                                    </button>
                                </div>
                                <div id="otherMsgCustomPickersContainer" class="hidden px-3.5 pb-3.5 grid grid-cols-2 gap-3">
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('otherMsgColorPickerLight').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Light Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="otherMsgCustomColorLightPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="otherMsgColorPickerLight" oninput="handleOtherMsgColorPickerLightInput(this.value, event)" onchange="handleOtherMsgColorPickerLightChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                    <div class="bg-white dark:bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center relative cursor-pointer" onclick="document.getElementById('otherMsgColorPickerDark').click();">
                                        <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dark Mode</label>
                                        <div class="flex items-center gap-2">
                                            <div id="otherMsgCustomColorDarkPreview" style="width:20px;height:20px;" class="rounded-full border-2 border-gray-200 dark:border-white/20"></div>
                                            <input type="color" id="otherMsgColorPickerDark" oninput="handleOtherMsgColorPickerDarkInput(this.value, event)" onchange="handleOtherMsgColorPickerDarkChange(this.value, event)" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-3.5 bg-gray-100 dark:bg-white/10 rounded-xl">
                        <label class="font-medium">Sound Effects</label>
                        <input type="checkbox" id="soundToggle" onchange="toggleSound(this.checked)"
                            class="w-6 h-6 accent-blue-500">
                    </div>

                    <div class="relative">
                        <label class="text-xs text-gray-400 uppercase font-medium mb-2 block">Legal</label>
                        <div class="bg-gray-100 dark:bg-white/10 rounded-xl overflow-hidden">
                            <button onclick="showTos(false)"
                                class="w-full flex items-center justify-between p-3.5 border-b border-gray-200 dark:border-gray-700 active:bg-gray-200 dark:active:bg-white/20 transition-colors">
                                <span class="font-medium">Terms of Service</span>
                                <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button onclick="showChangelog()"
                                class="w-full flex items-center justify-between p-3.5 active:bg-gray-200 dark:active:bg-white/20 transition-colors">
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

window.selectAnnColor = (val, e) => {
    if (e) e.stopPropagation();
    window.applyAnnColor(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('annColorDropdown', e);
};

window.applyAnnColor = (color, customLightHex = null, customDarkHex = null) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.applyAnnColor === 'function') {
        AppModules.View.applyAnnColor(color, customLightHex, customDarkHex);
    }
};

window.handleAnnColorPickerLightInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyAnnColor('custom', val, null);
};

window.handleAnnColorPickerLightChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('annCustomColorLightHex', val);
    const darkHex = localStorage.getItem('annCustomColorDarkHex') || '#A724FF';
    window.applyAnnColor('custom', val, darkHex);
    SettingsModule.updateSettingsLabels();
};

window.handleAnnColorPickerDarkInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyAnnColor('custom', null, val);
};

window.handleAnnColorPickerDarkChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('annCustomColorDarkHex', val);
    const lightHex = localStorage.getItem('annCustomColorLightHex') || '#F97316';
    window.applyAnnColor('custom', lightHex, val);
    SettingsModule.updateSettingsLabels();
};

window.selectMsgColor = (val, e) => {
    if (e) e.stopPropagation();
    window.applyMsgColor(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('msgColorDropdown', e);
};

window.applyMsgColor = (color, customLightHex = null, customDarkHex = null) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.applyMsgColor === 'function') {
        AppModules.View.applyMsgColor(color, customLightHex, customDarkHex);
    }
};

window.handleMsgColorPickerLightInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyMsgColor('custom', val, null);
};

window.handleMsgColorPickerLightChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('msgCustomColorLightHex', val);
    const darkHex = localStorage.getItem('msgCustomColorDarkHex') || '#0A84FF';
    window.applyMsgColor('custom', val, darkHex);
    SettingsModule.updateSettingsLabels();
};

window.handleMsgColorPickerDarkInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyMsgColor('custom', null, val);
};

window.handleMsgColorPickerDarkChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('msgCustomColorDarkHex', val);
    const lightHex = localStorage.getItem('msgCustomColorLightHex') || '#007AFF';
    window.applyMsgColor('custom', lightHex, val);
    SettingsModule.updateSettingsLabels();
};

window.selectOtherMsgColor = (val, e) => {
    if (e) e.stopPropagation();
    window.applyOtherMsgColor(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('otherMsgColorDropdown', e);
};

window.applyOtherMsgColor = (color, customLightHex = null, customDarkHex = null) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.applyOtherMsgColor === 'function') {
        AppModules.View.applyOtherMsgColor(color, customLightHex, customDarkHex);
    }
};

window.handleOtherMsgColorPickerLightInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyOtherMsgColor('custom', val, null);
};

window.handleOtherMsgColorPickerLightChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('otherMsgCustomColorLightHex', val);
    const darkHex = localStorage.getItem('otherMsgCustomColorDarkHex') || '#3A3A3C';
    window.applyOtherMsgColor('custom', val, darkHex);
    SettingsModule.updateSettingsLabels();
};

window.handleOtherMsgColorPickerDarkInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyOtherMsgColor('custom', null, val);
};

window.handleOtherMsgColorPickerDarkChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('otherMsgCustomColorDarkHex', val);
    const lightHex = localStorage.getItem('otherMsgCustomColorLightHex') || '#E9E9EB';
    window.applyOtherMsgColor('custom', lightHex, val);
    SettingsModule.updateSettingsLabels();
};

window.selectChatColor = (val, e) => {
    if (e) e.stopPropagation();
    window.applyChatColor(val);
    SettingsModule.updateSettingsLabels();
    window.toggleDropdown('chatColorDropdown', e);
};

window.applyChatColor = (color, customLightHex = null, customDarkHex = null) => {
    const AppModules = window.AppModules || {};
    if (AppModules.View && typeof AppModules.View.applyChatColor === 'function') {
        AppModules.View.applyChatColor(color, customLightHex, customDarkHex);
    }
};

window.handleChatColorPickerLightInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyChatColor('custom', val, null);
};

window.handleChatColorPickerLightChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('chatCustomColorLightHex', val);
    const darkHex = localStorage.getItem('chatCustomColorDarkHex') || '#0A84FF';
    window.applyChatColor('custom', val, darkHex);
    SettingsModule.updateSettingsLabels();
};

window.handleChatColorPickerDarkInput = (val, e) => {
    if (e) e.stopPropagation();
    window.applyChatColor('custom', null, val);
};

window.handleChatColorPickerDarkChange = (val, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('chatCustomColorDarkHex', val);
    const lightHex = localStorage.getItem('chatCustomColorLightHex') || '#007AFF';
    window.applyChatColor('custom', lightHex, val);
    SettingsModule.updateSettingsLabels();
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

window.openPortfolio = async () => {
    const Modal = window.AppModules?.Modal;
    const confirmed = Modal
        ? await Modal.confirm(
            "Author Portfolio",
            "You are about to visit the portfolio of chschat.xyz author, Centennial High Junior Lingqi Mo. Continue?",
            "Visit",
            "Cancel"
          )
        : window.confirm("Visit the author portfolio site?");
    if (confirmed) window.open("https://lingqi-mo-portfolio.vercel.app/", "_blank");
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
