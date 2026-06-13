/**
 * ==================================================================================
 * Module: AppModules.Core (js/core.js)
 * Purpose: Handles application lifecycle initialization, Firebase services startup, 
 *          global property proxy configuration, and auth status observing.
 * ==================================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

export const CoreModule = {
    services: {
        app: null,
        db: null,
        storage: null,
        auth: null
    },

    /**
     * Initializes the AppModules namespace on window, initializes Firebase, 
     * registers legacy compatibility bridges, and clears legacy Service Workers.
     */
    init: function(config, modules) {
        // 1. Define window.AppModules
        window.AppModules = {
            ...modules,
            Core: this
        };

        // 2. Initialize Firebase
        const app = initializeApp(config.firebaseConfig);
        const db = getDatabase(app);
        const storage = getStorage(app);
        const auth = getAuth(app);
        
        // Instantiate Auth providers
        const googleProvider = new GoogleAuthProvider();
        const microsoftProvider = new OAuthProvider('microsoft.com');

        this.services = { app, db, storage, auth, googleProvider, microsoftProvider, signInWithPopup, signInWithRedirect };

        // Export globals/aliases for debugging & legacy integration
        window.firebaseApp = app;
        window.firebaseDb = db;
        window.firebaseStorage = storage;
        window.firebaseAuth = auth;
        window.fRef = ref; window.fSet = set; window.fUpdate = update; window.fPush = push; window.fGet = get; window.fOnValue = onValue;
        window.sRef = sRef; window.sUpload = uploadString; window.sGetUrl = getDownloadURL;
        window.firebaseOnAuth = onAuthStateChanged;

        // 3. Setup Core State Proxy (currentUser)
        Object.defineProperty(window, 'currentUser', {
            get: () => window.AppModules.User.current,
            set: (val) => { window.AppModules.User.current = val; },
            configurable: true
        });

        // 4. Register compatibility bridges
        window.updateGlobalUnreadStatus = () => window.AppModules.Notify.updateUI();
        window.requestNotificationPermission = () => window.AppModules.Notify.requestPermission();
        window.initGlobalNotificationMonitor = () => window.AppModules.Notify.initMonitor();
        window.handleSignOut = async () => {
            try {
                const uid = auth.currentUser ? auth.currentUser.email.split('@')[0].replace(/\./g, '_').toLowerCase() : null;
                const deviceId = localStorage.getItem('deviceId');
                if (uid && deviceId) {
                    const deviceSnap = await get(ref(db, `users/${uid}/devices/${deviceId}`));
                    const device = deviceSnap.val();
                    const updates = {};
                    updates[`users/${uid}/devices/${deviceId}`] = null;
                    if (device && device.fcmToken) {
                        updates[`users/${uid}/fcm_tokens/${device.fcmToken}`] = null;
                    }
                    await update(ref(db), updates);
                }
            } catch (e) {
                console.error('[Core] Error clearing device on sign out:', e);
            }
            signOut(auth).then(() => location.reload());
        };

        // 5. Inject DB Cloud References
        window.AppModules.DB.initCloudRefs({ db, auth, storage });

        // 6. Handle Redirect Results
        getRedirectResult(auth).then((result) => {
            if (result) console.log('App: Sign-in redirect result handled.', result.user.email);
        }).catch((error) => {
            console.error('App: Sign-in redirect error:', error);
            if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
                window.AppModules.Modal.alert("Connection Error", "Connection error during login. Please try again.");
            } else if (error.code !== 'auth/no-auth-event') {
                window.AppModules.Modal.alert("Login Error", error.message);
            }
        });

        // 7. Register Service Worker for FCM
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(registration => {
                    window.fcmRegistration = registration;
                    console.log('App: Service Worker registered successfully:', registration.scope);
                })
                .catch(err => {
                    console.error('App: Service Worker registration failed:', err);
                });
        }

        return this.services;
    },

    /**
     * Initializes background messaging services if supported
     */
    initMessaging: function(APP_START_TIME, SETTINGS, ALL_USERS, globalListeners) {
        const { app, db } = this.services;
        isSupported().then(supported => {
            if (supported) {
                try {
                    window.AppModules.Notify.engine = getMessaging(app);
                    console.log('App: Firebase Messaging initialized.');
                    window.AppModules.Notify.init({
                        db: db,
                        currentUser: window.currentUser,
                        allUsers: ALL_USERS,
                        settings: SETTINGS,
                        globalListeners: globalListeners,
                        appStartTime: APP_START_TIME
                    });
                    window.AppModules.Notify.initMonitor();
                } catch (e) {
                    console.error('App: Messaging initialization failed:', e);
                }
            }
        });
    },

    /**
     * Watches for Authentication state changes
     */
    watchAuth: function(onUserAuthenticated, onNoUserFound) {
        onAuthStateChanged(this.services.auth, async (user) => {
            console.log('App: Auth state changed. User:', user ? user.email : 'null');
            try {
                if (user) {
                    await onUserAuthenticated(user);
                } else {
                    onNoUserFound();
                }
            } catch (err) {
                console.error('App: Critical error during initialization:', err);
                if (window.showError) window.showError(err);
                if (window.hideLoading) window.hideLoading();
            }
        });
    }
};

// Re-export Firebase Database and Storage API functions for index.html use
export { ref, push, set, get, update, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey, startAfter, startAt, endAt, limitToFirst } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
export { ref as sRef, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
