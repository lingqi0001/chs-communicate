/**
 * Offline indicators. Detection lives in SyncModule.initConnectionStatus
 * (.info/connected); this module only paints the three floating surfaces:
 * the sidebar pill under the Recent/Contacts/Class capsule, the chat pill
 * under the header bars, and the red card above pinned School News.
 */
/**
 * Firebase get() never rejects while the device is offline: it stays pending
 * forever, which used to pin boot inside User.init and leave the app blank
 * behind the loading screen. Callers race reads against this instead.
 *
 * The online budget (4s) sits well under the 10s boot watchdog; the offline
 * budget (1.5s) mirrors SidebarModule's. A timeout must never be read as "no
 * data" by callers, only as "cloud unavailable" - treating it as a missing
 * record would let an offline boot overwrite a real profile.
 */
/**
 * True when a cloud read cannot possibly answer: the browser says there is no
 * link, or the RTDB socket is already known to be down.
 */
export function cloudUnreachable() {
    return navigator.onLine === false || window.isOffline === true;
}

export function withNetworkTimeout(promise, { offlineMs = 1500, onlineMs = 4000 } = {}) {
    // Known unreachable: answer now instead of paying the budget once per
    // read. Boot used to spend 1.5s x 6 serially on reads that could never
    // answer, which read as a 9 second startup.
    if (cloudUnreachable()) {
        Promise.resolve(promise).catch(() => { });
        return Promise.reject(new Error('offline-timeout'));
    }
    const ms = navigator.onLine === false ? offlineMs : onlineMs;
    let timer;
    const budget = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('offline-timeout')), ms);
    });
    return Promise.race([promise, budget]).finally(() => clearTimeout(timer));
}

export function isOfflineTimeout(err) {
    const msg = (err && err.message) || String(err || '');
    return msg.includes('offline-timeout') || msg.includes('network-timeout');
}

window.withNetworkTimeout = withNetworkTimeout;
window.isOfflineTimeout = isOfflineTimeout;
window.cloudUnreachable = cloudUnreachable;

/**
 * Boot stopwatch. Every offline path is supposed to be instant, so when a
 * screen still feels slow this is what says where the seconds went.
 */
export function bootMark(label) {
    console.log(`[Boot] ${label} @ ${Math.round(performance.now())}ms`);
}

window.bootMark = bootMark;

export const ConnectionModule = {
    _built: false,
    _forcedOffline: null,

    OFFLINE_TEXT: 'You are currently Offline',

    init() {
        if (this._built) return;
        this._built = true;
        document.addEventListener('connection:status', (e) => {
            if (typeof e.detail?.offline === 'boolean') this._forcedOffline = e.detail.offline;
            this.sync();
        });
        // The splash is still on screen when an offline boot finishes, so the
        // banners would spend their 400ms entrance behind it and just appear
        // parked. Wait for the splash to clear, then animate in.
        document.addEventListener('app:loading-hidden', () => this.sync());
        this.sync();
    },

    isOffline() {
        return this._forcedOffline === true || window.AppModules?.Sync?.isOffline?.() === true;
    },

    _splashVisible() {
        const lp = document.getElementById('loadingPage');
        return !!lp && !lp.classList.contains('hidden');
    },

    sync() {
        const offline = this.isOffline();
        if (offline && this._splashVisible()) return;
        this._renderSidebarPill(offline);
        this._renderChatPill(offline);
        this._renderNewsCard(offline);
    },

    _pillHTML() {
        return '<span class="conn-offline-dot"></span><span>' + this.OFFLINE_TEXT + '</span>';
    },

    _renderSidebarPill(offline) {
        const chrome = document.querySelector('.sidebar-chrome');
        if (!chrome) return;
        let pill = chrome.querySelector('.conn-offline-pill');
        if (offline && !pill) {
            pill = document.createElement('div');
            pill.className = 'conn-offline-pill conn-offline-sidebar';
            pill.innerHTML = this._pillHTML();
            chrome.appendChild(pill);
        }
        if (pill) this._close(pill, offline);
    },

    _renderChatPill(offline) {
        const section = document.getElementById('chatSection');
        if (!section) return;
        let pill = document.getElementById('chatOfflinePill');
        if (offline && !pill) {
            pill = document.createElement('div');
            pill.id = 'chatOfflinePill';
            pill.className = 'conn-offline-pill conn-offline-chat';
            pill.innerHTML = this._pillHTML();
            section.appendChild(pill);
            this._trackChatPillPosition(pill);
        }
        if (pill) this._close(pill, offline);
    },

    // The header row is repositioned by JS (wp bar), so a static top would
    // drift: mirror the bar's real bottom edge instead.
    _trackChatPillPosition(pill) {
        const place = () => {
            const bar = document.getElementById('wpDocContextBar');
            const section = document.getElementById('chatSection');
            if (!bar || !section || !bar.isConnected) return;
            if (!bar.offsetWidth && !bar.offsetHeight) return;
            const top = bar.getBoundingClientRect().bottom - section.getBoundingClientRect().top + 10;
            pill.style.top = `${Math.round(top)}px`;
        };
        place();
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(place);
            const bar = document.getElementById('wpDocContextBar');
            if (bar) ro.observe(bar);
            ro.observe(document.documentElement);
        }
        window.addEventListener('resize', place);
    },

    _renderNewsCard(offline) {
        const container = document.getElementById('schoolNewsContent');
        if (!container) return;
        let card = document.getElementById('offlineNewsCard');
        if (offline && !card) {
            card = document.createElement('div');
            card.id = 'offlineNewsCard';
            card.className = 'conn-offline-newscard';
            card.innerHTML = `
                <div class="flex items-center gap-2 mb-1">
                    <span class="conn-offline-dot"></span>
                    <h3 class="font-bold text-base leading-snug">Offline</h3>
                </div>
                <p class="text-[15px] font-bold text-black dark:text-white leading-relaxed mt-1">
                    You are currently Offline. Showing announcements saved on this device.
                </p>`;
            container.insertBefore(card, container.firstChild);
        } else if (offline && card && card.parentElement !== container) {
            container.insertBefore(card, container.firstChild);
        }
        if (card) this._close(card, offline);
    },

    // Slide out, then remove; re-opening must replay the slide-in, so the
    // closing class is always cleared when the pill comes back.
    _close(el, keep) {
        if (keep) {
            el.classList.remove('conn-offline-closing');
            return;
        }
        if (el.classList.contains('conn-offline-closing')) return;
        el.classList.add('conn-offline-closing');
        setTimeout(() => el.remove(), 420);
    }
};
