/**
 * ==================================================================================
 * Module: AppModules.Auth (js/auth.js)
 * Purpose: Handles Google/Microsoft login flow, Terms of Service agreement checks,
 *          and new user profile creation.
 * ==================================================================================
 */
import { ref, update, push, get, serverTimestamp } from './core.js';

let db = null;
let auth = null;
let googleProvider = null;
let microsoftProvider = null;
let signInWithPopup = null;
let signInWithRedirect = null;
let isAppInitialized = false;

let callbacks = {
    onEnterApp: () => {},
    onShowTos: (mandatory) => {},
    onHideLoading: () => {}
};

export const AuthModule = {
    /**
     * Initializes Auth Module with Firebase services and lifecycle callbacks
     */
    init(services, cbs) {
        db = services.db;
        auth = services.auth;
        googleProvider = services.googleProvider;
        microsoftProvider = services.microsoftProvider;
        signInWithPopup = services.signInWithPopup;
        signInWithRedirect = services.signInWithRedirect;
        callbacks = { ...callbacks, ...cbs };
    },

    /**
     * Google OAuth login handler
     */
    async loginWithGoogle() {
        const btns = document.querySelectorAll('#loginPage button');
        const hint = document.getElementById('loginHint');
        const originalHint = hint.innerText;
        btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

        hint.innerText = "Please check the Google popup window...";
        hint.classList.replace('text-gray-400', 'text-[#007AFF]');

        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Auth Error:", error);
            if (error.code === 'auth/popup-blocked') {
                hint.innerText = "Popup blocked. Redirecting...";
                await signInWithRedirect(auth, googleProvider);
            } else if (error.code !== 'auth/popup-closed-by-user') {
                window.AppModules.Modal.alert("Login Failed", "Google Sign-In failed: " + error.message);
                btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                hint.innerText = originalHint;
                hint.classList.replace('text-[#007AFF]', 'text-gray-400');
            } else {
                btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                hint.innerText = originalHint;
                hint.classList.replace('text-[#007AFF]', 'text-gray-400');
            }
        }
    },

    /**
     * Microsoft OAuth login handler
     */
    async loginWithMicrosoft() {
        const btns = document.querySelectorAll('#loginPage button');
        const hint = document.getElementById('loginHint');
        const originalHint = hint.innerText;
        btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
        hint.innerText = "Please check the Microsoft popup window...";
        hint.classList.replace('text-gray-400', 'text-[#007AFF]');

        try {
            await signInWithPopup(auth, microsoftProvider);
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                window.AppModules.Modal.alert("Error", "Microsoft Sign-In failed: " + error.message);
            }
            btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
            hint.innerText = originalHint;
            hint.classList.replace('text-[#007AFF]', 'text-gray-400');
        }
    },

    /**
     * User registration state check, routes new users to ToS/Profile and old users to App
     */
    async setupUser(user) {
        if (isAppInitialized) return;
        isAppInitialized = true;
        console.log('App: Entering setupUser for', user.email);

        const profile = await window.AppModules.User.init(user);
        window.ALL_USERS[profile.id] = profile;

        console.log('App: Fetching global data...');
        let dataFetchResult;
        try {
            dataFetchResult = await Promise.all([
                get(ref(db, `user_private/${user.uid}`))
            ]);
        } catch (err) {
            console.error('App: Global data fetch failed:', err);
            dataFetchResult = [null];
        }
        const [privateSnap] = dataFetchResult;

        const userData = privateSnap?.val() || {};
        const isAlwaysNewUser = user && user.email && user.email.toLowerCase().includes('moss932888');
        window._isNewUserFlag = userData.isNew || isAlwaysNewUser;

        if (isAlwaysNewUser) {
            window.currentUser.hasAcceptedTerms = false;
        }

        if (userData.isNew && !isAlwaysNewUser) {
            update(ref(db, `user_private/${user.uid}`), { isNew: null }).catch(e => console.warn('Flag clear fail:', e));
        }

        console.log('App: setupUser finalizing. hasAcceptedTerms:', window.currentUser.hasAcceptedTerms);

        if (window.currentUser.hasAcceptedTerms) {
            console.log('App: User accepted ToS. Entering App...');
            callbacks.onEnterApp();
        } else {
            console.log('App: User must accept ToS.');
            AuthModule.showTos(true);
            callbacks.onHideLoading();
        }
    },

    /**
     * View toggle: Display ToS Modal
     */
    showTos(mandatory = false) {
        const tosPage = document.getElementById('tosPage');
        const tosCloseBtn = document.getElementById('tosCloseBtn');
        const tosAcceptSection = document.getElementById('tosAcceptSection');

        tosPage.classList.remove('hidden');
        if (mandatory) {
            tosCloseBtn.classList.add('hidden');
            tosAcceptSection.classList.remove('hidden');
        } else {
            tosCloseBtn.classList.remove('hidden');
            tosAcceptSection.classList.add('hidden');
        }
    },

    /**
     * View toggle: Close ToS Modal
     */
    closeTos() {
        document.getElementById('tosPage').classList.add('hidden');
    },

    /**
     * Action callback when user accepts the Terms of Service
     */
    async acceptTerms() {
        if (!window.currentUser) return;
        const userRef = ref(db, `users/${window.currentUser.id}`);

        await update(userRef, { hasAcceptedTerms: true });
        window.currentUser.hasAcceptedTerms = true;

        const isAlwaysNewUser = window.currentUser.email && window.currentUser.email.toLowerCase().includes('moss932888');

        if (window.currentUser._isNewUser || isAlwaysNewUser) {
            document.getElementById('tosPage').classList.add('hidden');
            document.getElementById('nameSetupPage').classList.remove('hidden');

            if (window.currentUser.name) {
                const parts = window.currentUser.name.split(' ');
                const first = parts[0] || '';
                const last = parts.slice(1).join(' ') || '';
                document.getElementById('setupFirstName').value = first.charAt(0).toUpperCase() + first.slice(1);
                document.getElementById('setupLastName').value = last.charAt(0).toUpperCase() + last.slice(1);
            }
            return;
        }

        callbacks.onEnterApp();
    },

    /**
     * Validates input name parameters, sets user profiles, and triggers auto greet messages
     */
    async saveInitialProfile() {
        const rawFirst = document.getElementById('setupFirstName').value.trim();
        const rawLast = document.getElementById('setupLastName').value.trim();
        const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
        const last = rawLast.charAt(0).toUpperCase() + rawLast.slice(1);
        const newName = [first, last].filter(Boolean).join(' ');

        if (!newName || !first || !last) {
            return window.AppModules.Modal.alert("Name Required", "Please enter both your first and last name to continue.");
        }

        if (rawFirst.length > 20 || rawLast.length > 20) {
            return window.AppModules.Modal.alert("Invalid Name", "First name and last name must not exceed 20 characters each.");
        }

        const btn = document.getElementById('setupSubmitBtn');
        btn.disabled = true;
        btn.innerText = "Setting up...";

        try {
            await update(ref(db, `users/${window.currentUser.id}`), { name: newName });
            window.currentUser.name = newName;

            try {
                const adminId = 'moss104088';
                const getChatId = (id1, id2) => [id1.toLowerCase(), id2.toLowerCase()].sort().join('_');
                const chatId = getChatId(window.currentUser.id, adminId);
                const msg = {
                    senderId: window.currentUser.id,
                    senderName: window.currentUser.name,
                    text: "[Auto Sent By System] I'm a new user",
                    type: 'text',
                    timestamp: serverTimestamp()
                };
                await push(ref(db, `messages/${chatId}`), msg);
                await update(ref(db, `user_chats/${window.currentUser.id.toLowerCase()}`), { [adminId]: serverTimestamp() });
                await update(ref(db, `user_chats/${adminId}`), { [window.currentUser.id.toLowerCase()]: serverTimestamp() });
            } catch (e) {
                console.warn('New user notification failed:', e);
            }

            delete window.currentUser._isNewUser;
            document.getElementById('nameSetupPage').classList.add('hidden');
            callbacks.onEnterApp();
        } catch (err) {
            btn.disabled = false;
            btn.innerText = "Start Chatting";
            window.AppModules.Modal.alert("Error", "Failed to save profile: " + err.message);
        }
    }
};

// Expose standard hooks on window to bypass inline HTML event handlers
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Auth = AuthModule;
    window.loginWithGoogle = AuthModule.loginWithGoogle;
    window.loginWithMicrosoft = AuthModule.loginWithMicrosoft;
    window.showTos = AuthModule.showTos;
    window.closeTos = AuthModule.closeTos;
    window.acceptTerms = AuthModule.acceptTerms;
    window.saveInitialProfile = AuthModule.saveInitialProfile;
}
