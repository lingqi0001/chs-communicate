/**
 * ==================================================================================
 * Module: window.Drafts (js/drafts.js)
 * ==================================================================================
 * Unsent composer text belongs to the conversation it was written for. The composer
 * is one shared textarea, so without this a draft typed in chat A is still on screen
 * while reading chat B, and a reload throws it away.
 *
 * Only text and the plain quote strip are kept. Attached images are sent straight
 * from the file picker (js/utils.js handleUploadEvent), so there is no pending image
 * to carry, and the Google Doc comment-reply mode stays cleared on switch because it
 * also owns the placeholder and the portfolio lift.
 */

const DRAFTS_KEY = 'chs_drafts';
const MAX_DRAFTS = 30;
const MAX_CHARS = 4000;
const QUOTE_TEXT_CHARS = 200;

function readAll() {
    try {
        const raw = localStorage.getItem(DRAFTS_KEY);
        const data = raw ? JSON.parse(raw) : null;
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

function writeAll(drafts) {
    try {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (e) {
        console.warn('[Drafts] Write failed:', e.message);
    }
}

export const DraftsModule = {
    /**
     * Empty drafts are deleted rather than stored, so the map only ever holds
     * conversations the user actually walked away from mid-sentence.
     */
    save(chatId, { text = '', quote = null } = {}) {
        if (!chatId) return;
        const body = String(text || '').slice(0, MAX_CHARS);
        const drafts = readAll();
        delete drafts[chatId];

        if (!body && !quote) {
            writeAll(drafts);
            return;
        }

        drafts[chatId] = { text: body, quote: quote ? this._shrinkQuote(quote) : null };

        const ids = Object.keys(drafts);
        if (ids.length > MAX_DRAFTS) {
            ids.slice(0, ids.length - MAX_DRAFTS).forEach(oldest => delete drafts[oldest]);
        }
        writeAll(drafts);
    },

    peek(chatId) {
        if (!chatId) return null;
        const draft = readAll()[chatId];
        return draft && (draft.text || draft.quote) ? draft : null;
    },

    clear(chatId) {
        if (!chatId) return;
        const drafts = readAll();
        if (!drafts[chatId]) return;
        delete drafts[chatId];
        writeAll(drafts);
    },

    clearAll() {
        try { localStorage.removeItem(DRAFTS_KEY); } catch (e) { }
    },

    _shrinkQuote(quote) {
        return {
            senderName: quote.senderName || '',
            text: String(quote.text || '').slice(0, QUOTE_TEXT_CHARS),
            messageId: quote.messageId || null
        };
    }
};

window.Drafts = DraftsModule;
