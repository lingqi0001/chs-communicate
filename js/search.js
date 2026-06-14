/**
 * ==================================================================================
 * Module: AppModules.Search (js/search.js)
 * Purpose: Decouples search logic, user name weighting, tool registries, IndexedDB
 *          message query filtering, and search history caching in local storage.
 * ==================================================================================
 */

import { get, query, ref, orderByKey, limitToFirst, limitToLast } from './core.js';
import { localDB, dbReady, saveMessageLocal } from './db.js';

const HISTORY_KEY = 'chs_search_history';
const MAX_HISTORY_LEN = 8;

function escapeForSingleQuotedJs(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

function escapeForInlineHandler(value) {
    return escapeForSingleQuotedJs(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getOtherParticipantId(chatId, currentUserId) {
    const normalizedChatId = String(chatId || '').toLowerCase();
    const normalizedCurrentUserId = String(currentUserId || '').toLowerCase();
    if (!normalizedChatId || !normalizedCurrentUserId) return null;

    const currentUserPrefix = `${normalizedCurrentUserId}_`;
    const currentUserSuffix = `_${normalizedCurrentUserId}`;

    if (normalizedChatId.startsWith(currentUserPrefix)) {
        return normalizedChatId.slice(currentUserPrefix.length) || null;
    }

    if (normalizedChatId.endsWith(currentUserSuffix)) {
        return normalizedChatId.slice(0, -currentUserSuffix.length) || null;
    }

    return null;
}

export const SearchModule = {
    ensureGlobalSearchResults() {
        if (document.getElementById('globalSearchResults')) return;
        const input = document.getElementById('globalSearchInput');
        const host = input ? input.closest('.relative') : null;
        if (!host) return;
        host.insertAdjacentHTML('beforeend', `
                    <div id="globalSearchResults"
                        class="ios-glass absolute top-full mt-1.5 left-0 right-0 rounded-2xl shadow-2xl max-h-[520px] overflow-hidden z-[120] flex flex-col transition-all duration-200 ease-out origin-top opacity-0 scale-95 pointer-events-none">
                        <!-- Search Categories Bar: Horizontal Pill Layout (iOS Style) -->
                        <div class="flex-shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar py-3 px-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                            <button onclick="setSearchCategory('messages')" id="searchCat-messages"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">Messages</button>
                            <button onclick="setSearchCategory('community')" id="searchCat-community"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">Community</button>
                            <button onclick="setSearchCategory('news')" id="searchCat-news"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">News</button>
                            <button onclick="setSearchCategory('tools')" id="searchCat-tools"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">Tools</button>
                            <button onclick="setSearchCategory('people')" id="searchCat-people"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">People</button>
                            <button onclick="setSearchCategory('club')" id="searchCat-club"
                                class="search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap">Club</button>
                        </div>
                    <div id="searchResultList" class="flex-1 overflow-y-auto divide-y divide-white/5"></div>
                    </div>
        `);
        const resultList = document.getElementById('searchResultList');
        if (resultList && typeof window.setupCustomScrollbar === 'function') {
            window.setupCustomScrollbar(resultList);
        }
    },

    /**
     * Retrieves search history from localStorage
     * @returns {string[]} history terms
     */
    getHistory() {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to load search history:", e);
            return [];
        }
    },

    /**
     * Adds a query term to the search history
     * @param {string} term 
     */
    addHistory(term) {
        if (!term || !term.trim()) return;
        const cleanTerm = term.trim();
        try {
            let history = this.getHistory();
            // Remove duplicates
            history = history.filter(h => h.toLowerCase() !== cleanTerm.toLowerCase());
            // Add to front
            history.unshift(cleanTerm);
            // Slice to limit
            if (history.length > MAX_HISTORY_LEN) {
                history = history.slice(0, MAX_HISTORY_LEN);
            }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save search history:", e);
        }
    },

    /**
     * Removes a specific item from search history
     * @param {string} term 
     */
    removeHistoryItem(term) {
        if (!term) return;
        try {
            let history = this.getHistory();
            history = history.filter(h => h.toLowerCase() !== term.toLowerCase().trim());
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to remove history item:", e);
        }
    },

    /**
     * Clears all search history
     */
    clearHistory() {
        try {
            localStorage.removeItem(HISTORY_KEY);
        } catch (e) {
            console.error("Failed to clear search history:", e);
        }
    },

    /**
     * Dimension 1: Search users (People) in local memory
     * Applies startsWith prefix weighting: matches starting with query are sorted first.
     */
    searchPeople(term, currentUser, allUsers) {
        const termLower = term.toLowerCase().trim();
        if (!termLower || !allUsers) return [];

        const matchedIds = Object.keys(allUsers).filter(id => {
            if (id === currentUser.id) return false; // Exclude self
            const u = allUsers[id];
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const idLower = id.toLowerCase();
            return name.includes(termLower) || email.includes(termLower) || idLower.includes(termLower);
        });

        // Prefix weighting algorithm
        return matchedIds.sort((a, b) => {
            const nameA = (allUsers[a].name || '').toLowerCase();
            const nameB = (allUsers[b].name || '').toLowerCase();
            const startsA = nameA.startsWith(termLower);
            const startsB = nameB.startsWith(termLower);
            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;
            return 0;
        }).slice(0, 10).map(id => {
            const u = allUsers[id];
            return {
                id,
                name: u.name || id,
                email: u.email || id,
                avatar: u.avatar || null
            };
        });
    },

    /**
     * Dimension 2: Search grade calculators and custom tools (Tools)
     */
    searchTools(term, registry) {
        const termLower = term.toLowerCase().trim();
        if (!termLower) return [];

        const fullRegistry = [
            { id: 'grade_calc', name: 'Grade Calculator', desc: 'Calculate your HCPSS final grades', type: 'module' },
            { id: 'cafeteria', name: 'Cafeteria Menu', desc: 'View today\'s menus', type: 'module' },
            { id: 'chs_info', name: 'CHS Info', desc: 'School links and resources', type: 'module' }
        ];

        if (registry) {
            Object.keys(registry).forEach(eid => {
                if (['calc_volume_3d', 'independent_research', 'selection_logic', 'grade_calc'].includes(eid)) return;
                const item = registry[eid];
                fullRegistry.push({
                    id: eid,
                    name: item.title || eid,
                    desc: item.category || 'Extension Tool',
                    type: 'extension'
                });
            });
        }

        return fullRegistry.filter(t => 
            (t.name || '').toLowerCase().includes(termLower) || 
            (t.desc || '').toLowerCase().includes(termLower)
        );
    },

    /**
     * Dimension 3: Search messages (Messages) from IndexedDB
     */
    async searchMessages(term, currentUser, localDB, sidebarClasses, cnCache, db) {
        const termLower = term.toLowerCase().trim();
        console.log('[SEARCH:MSG] ▶ searchMessages called, term:', termLower);
        if (!termLower) return { localResults: [], hasMore: false };

        let localResults = [];

        // 1. Search IndexedDB
        if (localDB) {
            try {
                console.log('[SEARCH:MSG] → Searching IndexedDB...');
                const tx = localDB.transaction("messages", "readonly");
                const store = tx.objectStore("messages");
                const allMsgs = await new Promise((resolve, reject) => {
                    const req = store.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => reject(req.error);
                });
                console.log('[SEARCH:MSG] → IndexedDB total messages:', allMsgs.length);

                const currentUserIdLower = currentUser.id.toLowerCase();

                localResults = allMsgs.filter(m => {
                    if (!m.text || !m.chatId) return false;
                    if (m.type === 'image' || m.type === 'image_group' || m.text.startsWith('data:image')) return false;
                    if (m.chatId.startsWith('group_')) {
                        const classId = m.chatId.replace('group_', '');
                        if (!sidebarClasses || !sidebarClasses[classId]) return false;
                    } else {
                        const otherParticipantId = getOtherParticipantId(m.chatId, currentUserIdLower);
                        if (!otherParticipantId) return false;
                    }
                    return m.text.toLowerCase().includes(termLower);
                }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map(m => {
                    let chatName = "Chat";
                    let jumpId = m.chatId;
                    if (m.chatId.startsWith('group_')) {
                        const classId = m.chatId.replace('group_', '');
                        chatName = (cnCache && cnCache[classId]) ? cnCache[classId] : "Class Chat";
                    } else {
                        const otherId = getOtherParticipantId(m.chatId, currentUser.id);
                        if (otherId) {
                            chatName = otherId;
                            jumpId = otherId;
                        }
                    }
                    return {
                        chatId: m.chatId,
                        chatName,
                        text: m.text,
                        timestamp: m.timestamp,
                        key: m.key || (m.compositeId ? m.compositeId.substring(m.chatId.length + 1) : ''),
                        jumpId
                    };
                });
                console.log('[SEARCH:MSG] → IndexedDB filtered results:', localResults.length);
            } catch (e) {
                console.error('[SEARCH:MSG] ✗ IndexedDB search failed:', e);
            }
        } else {
            console.log('[SEARCH:MSG] → localDB is null, skipping IndexedDB');
        }

        // 2. Prepare Firebase search state
        let hasMore = false;
        if (db) {
            try {
                const uid = currentUser.id.toLowerCase();
                console.log('[SEARCH:MSG] → Fetching user_chats for uid:', uid);
                const chatSnap = await get(ref(db, `user_chats/${uid}`));
                const chatMap = chatSnap.val() || {};
                const allChatIds = Object.keys(chatMap).filter(id => !id.includes('_gmail_') && !id.includes('_inst_'));
                console.log('[SEARCH:MSG] → Total chats:', allChatIds.length);
                
                const prevState = this._firebaseSearchState;
                const alreadySearchedAll = prevState && prevState.term === termLower && prevState.searchedIndex >= prevState.allChatIds.length;

                this._firebaseSearchState = {
                    term: termLower,
                    allChatIds,
                    searchedIndex: alreadySearchedAll ? allChatIds.length : 0,
                    resultChats: new Set(localResults.map(r => r.chatId)),
                    displayedKeys: new Set(localResults.map(r => r.key).filter(Boolean)),
                    currentUser,
                    cnCache,
                    db
                };
                hasMore = !alreadySearchedAll && allChatIds.length > 0;
            } catch (e) {
                console.error('[SEARCH:MSG] ✗ Failed to init Firebase search state:', e);
            }
        } else {
            console.log('[SEARCH:MSG] → db is null, skipping Firebase state init');
        }

        console.log('[SEARCH:MSG] ✓ Returning localResults:', localResults.length, 'hasMore:', hasMore);
        return { localResults, hasMore };
    },

    async loadMoreFirebaseMessages() {
        const state = this._firebaseSearchState;
        if (!state || state.searchedIndex >= state.allChatIds.length) {
            console.log('[SEARCH:FIRE] ▶ loadMoreFirebaseMessages: no state or all searched');
            return { results: [], hasMore: false };
        }

        const results = [];
        const { term, allChatIds, currentUser, cnCache, db } = state;
        const TARGET_CHATS = 10;

        const startIdx = state.searchedIndex;
        console.log('[SEARCH:FIRE] ▶ Searching from index', startIdx, 'of', allChatIds.length, 'target:', TARGET_CHATS, 'chats with results');

        for (let i = startIdx; i < allChatIds.length; i++) {
            const targetId = allChatIds[i];
            const chatId = targetId.startsWith('group_') ? targetId : [currentUser.id, targetId].sort().join('_');
            try {
                const msgSnap = await get(ref(db, `messages/${chatId}`));
                const msgs = msgSnap.val() || {};
                const msgCount = Object.keys(msgs).length;
                let found = 0;
                for (const key in msgs) {
                    const m = msgs[key];
                    try { await saveMessageLocal(chatId, key, m); } catch (e) {}
                    if (!m.text || m.type === 'image' || m.type === 'image_group' || m.text.startsWith('data:image')) continue;
                    if (m.text.toLowerCase().includes(term)) {
                        if (state.displayedKeys.has(key)) continue;
                        if (!state.resultChats.has(targetId)) {
                            state.resultChats.add(targetId);
                        }
                        state.displayedKeys.add(key);
                        let chatName = "Chat";
                        let jumpId = targetId;
                        if (targetId.startsWith('group_')) {
                            const classId = targetId.replace('group_', '');
                            chatName = (cnCache && cnCache[classId]) ? cnCache[classId] : "Class Chat";
                        } else {
                            chatName = targetId;
                        }
                        results.push({
                            chatId: targetId,
                            chatName,
                            text: m.text,
                            timestamp: m.timestamp || 0,
                            key,
                            jumpId
                        });
                        found++;
                    }
                }
                if (found > 0) console.log('[SEARCH:FIRE]   ✓ chat', targetId, ':', msgCount, 'msgs,', found, 'matches');
                else if (i < startIdx + 3) console.log('[SEARCH:FIRE]   - chat', targetId, ':', msgCount, 'msgs, 0 matches');
            } catch (e) {
                console.error('[SEARCH:FIRE] ✗ chat', targetId, 'failed:', e.message);
            }

            if (state.resultChats.size >= TARGET_CHATS) {
                console.log('[SEARCH:FIRE] → Reached', TARGET_CHATS, 'chats with results, stopping');
                break;
            }
        }

        state.searchedIndex = allChatIds.length;
        const allDone = state.searchedIndex >= allChatIds.length;
        const hitLimit = state.resultChats.size >= TARGET_CHATS;

        console.log('[SEARCH:FIRE] ✓ Done. total results:', results.length, 'chats with results:', state.resultChats.size, 'allDone:', allDone);
        return { results, hasMore: false };
    },

    /**
     * Dimension 4: Search announcements & community forums (News & Modules) from IndexedDB
     */
    async searchNewsAndModules(term, localDB, cat) {
        const termLower = term.toLowerCase().trim();
        if (!termLower || !localDB) return [];

        const results = { news: [], community: [] };

        const searchLocalStore = async (storeName, targetCat) => {
            if (cat !== 'all' && cat !== targetCat) return;
            try {
                const tx = localDB.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                const items = await new Promise((resolve, reject) => {
                    const req = store.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => reject(req.error);
                });

                items.forEach(item => {
                    const title = (item.title || item.name || '').toLowerCase();
                    const desc = (item.desc || item.text || '').toLowerCase();
                    if (title.includes(termLower) || desc.includes(termLower)) {
                        const typeOrModule = storeName === 'news' ? item.tabType : item.moduleName;
                        results[targetCat].push({
                            key: item.key,
                            title: item.title || item.name || 'Post',
                            desc: item.desc || item.text || '',
                            typeOrModule,
                            storeName
                        });
                    }
                });
            } catch (e) {
                console.warn(`IndexedDB store ${storeName} search failed:`, e);
            }
        };

        await Promise.all([
            searchLocalStore('news', 'news'),
            searchLocalStore('modules', 'community')
        ]);

        return results;
    },

    async searchClubEvents(term, db) {
        const termLower = String(term || '').trim().toLowerCase();
        if (!termLower || !db) return [];

        try {
            const snap = await get(ref(db, 'modules/club_events'));
            if (!snap.exists()) return [];

            const raw = snap.val() || {};
            const newsModule = window.AppModules && window.AppModules.News;
            const clubs = (newsModule && typeof newsModule.getClubsForSearch === 'function')
                ? newsModule.getClubsForSearch('')
                : [];
            const clubNameMap = new Map(clubs.map(c => [c.id, c.name]));

            const out = [];
            Object.keys(raw).forEach((clubId) => {
                const clubEvents = raw[clubId] || {};
                Object.keys(clubEvents).forEach((eventId) => {
                    const evt = clubEvents[eventId] || {};
                    const clubName = clubNameMap.get(clubId) || evt.clubName || 'Unknown Club';
                    const haystack = [
                        evt.title || '',
                        evt.desc || '',
                        evt.date || '',
                        evt.time || '',
                        evt.room || '',
                        clubName
                    ].join(' ').toLowerCase();
                    if (!haystack.includes(termLower)) return;
                    out.push({
                        id: eventId,
                        clubId,
                        title: evt.title || 'Untitled Event',
                        clubName,
                        date: evt.date || '',
                        time: evt.time || '',
                        room: evt.room || ''
                    });
                });
            });

            return out.slice(0, 25);
        } catch (e) {
            console.warn('Club events search failed:', e);
            return [];
        }
    },

    /**
     * Initializes the Search UI handlers and registers global bindings
     */
    initSearchUI(options) {
        this.ensureGlobalSearchResults();
        const { db, getCurrentUser, getSidebarClasses, getCnCache } = options;

        window.showGlobalSearchResults = () => {
            const results = document.getElementById('globalSearchResults');
            if (results) {
                results.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                results.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            }
        };

        window.hideGlobalSearchResults = () => {
            const results = document.getElementById('globalSearchResults');
            if (results) {
                results.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                results.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            }
        };

        window.clearGlobalSearch = () => {
            const input = document.getElementById('globalSearchInput');
            const results = document.getElementById('globalSearchResults');
            const resultList = document.getElementById('searchResultList');
            const clearBtn = document.getElementById('globalSearchClear');

            if (input) {
                input.value = '';
                input.blur();
            }
            window.hideGlobalSearchResults();
            if (resultList) {
                setTimeout(() => {
                    if (results && results.classList.contains('opacity-0')) {
                        resultList.innerHTML = '';
                    }
                }, 200);
            }
            if (clearBtn) clearBtn.classList.add('hidden');
        };

        // Click outside search container to close results
        if (!this._clickOutsideRegistered) {
            document.addEventListener('click', (e) => {
                const searchContainer = document.getElementById('globalSearchInput')?.parentElement?.parentElement;
                if (searchContainer && !searchContainer.contains(e.target)) {
                    window.clearGlobalSearch();
                }
            });
            this._clickOutsideRegistered = true;
        }

        window.triggerAddHistory = (term) => {
            this.addHistory(term);
        };

        window.fillGlobalSearch = (term) => {
            const input = document.getElementById('globalSearchInput');
            if (input) {
                input.value = term;
                const resultList = document.getElementById('searchResultList');
                if (resultList) {
                    resultList.innerHTML = '<div id="searchLoading" class="px-4 py-6 text-center"><div class="inline-flex items-center gap-2 text-xs text-gray-400"><svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Searching...</div></div>';
                }
                window.handleGlobalSearch({ target: input });
            }
        };

        window.deleteSearchHistoryUI = (event, term) => {
            event.stopPropagation();
            this.removeHistoryItem(term);
            const input = document.getElementById('globalSearchInput');
            if (input) {
                window.handleGlobalSearch({ target: input });
            }
        };

        window.clearSearchHistoryUI = (event) => {
            event.stopPropagation();
            this.clearHistory();
            const input = document.getElementById('globalSearchInput');
            if (input) {
                window.handleGlobalSearch({ target: input });
            }
        };

        window.loadMoreSearchResults = async () => {
            const state = this._firebaseSearchState;
            console.log('[SEARCH:MORE] ▶ loadMoreSearchResults called, state:', !!state, 'searchedIndex:', state?.searchedIndex, 'total:', state?.allChatIds?.length);
            if (!state || state.searchedIndex >= state.allChatIds.length) return;

            const moreBtn = document.getElementById('firebaseSearchMore');
            if (moreBtn) {
                moreBtn.innerHTML = '<span class="text-xs text-gray-400">Searching...</span>';
            }

            try {
                const { results, hasMore } = await this.loadMoreFirebaseMessages();
                console.log('[SEARCH:MORE] → Got results:', results.length, 'hasMore:', hasMore);

        const resultList = document.getElementById('searchResultList');
        if (resultList && typeof window.setupCustomScrollbar === 'function') {
            window.setupCustomScrollbar(resultList);
        }
                if (!resultList) { console.log('[SEARCH:MORE] ✗ resultList not found'); return; }

                const marker = document.getElementById('firebaseSearchMore');

                if (results.length > 0) {
                    const frag = document.createDocumentFragment();
                    results.forEach(m => {
                        let resolvedChatName = m.chatName;
                        if (!m.chatId.startsWith('group_')) {
                            resolvedChatName = window.ALL_USERS[m.chatName]?.name || m.chatName;
                        }
                        const escapedJumpId = escapeForInlineHandler(m.jumpId);
                        const escapedText = escapeForInlineHandler(m.text);
                        const escapedKey = escapeForInlineHandler(m.key || '');
                        const escapedTerm2 = escapeForInlineHandler(state.term);

                        const div = document.createElement('div');
                        div.className = 'px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors';
                        div.setAttribute('onclick', `switchChat('${escapedJumpId}'); triggerAddHistory('${escapedTerm2}'); setTimeout(() => jumpToMessage('${escapedText}', '${escapedTerm2}', '${escapedKey}'), 500); clearGlobalSearch();`);
                        div.innerHTML = `<div class="text-xs font-bold text-[#007AFF] mb-0.5">in ${window.escapeHTML(resolvedChatName)}</div><div class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-snug">${window.escapeHTML(m.text)}</div>`;
                        frag.appendChild(div);
                    });
                    if (marker) {
                        resultList.insertBefore(frag, marker);
                    } else {
                        resultList.appendChild(frag);
                    }
                    console.log('[SEARCH:MORE] → Inserted', results.length, 'results into DOM');
                }

                if (moreBtn) {
                    if (hasMore) {
                        moreBtn.innerHTML = '<button onclick="event.stopPropagation(); window.loadMoreSearchResults()" class="text-xs text-[#007AFF] font-semibold hover:underline">Search more in database</button>';
                    } else {
                        moreBtn.innerHTML = '<span class="text-xs text-gray-400">Search complete</span>';
                    }
                }
            } catch (e) {
                console.error('Load more search failed:', e);
                if (moreBtn) moreBtn.innerHTML = '<span class="text-xs text-gray-400">Search complete</span>';
            }
        };

        // Bind keydown event for Enter on search input to save history
        setTimeout(() => {
            const input = document.getElementById('globalSearchInput');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const term = input.value.trim();
                        if (term.length >= 2) {
                            window.triggerAddHistory(term);
                        }
                    }
                });
            }
        }, 1000);

        window.currentSearchCategory = 'all';
        window.setSearchCategory = (cat) => {
            if (window.currentSearchCategory === cat) {
                window.currentSearchCategory = 'all';
            } else {
                window.currentSearchCategory = cat;
            }

            document.querySelectorAll('.search-cat-btn').forEach(btn => {
                const btnCat = btn.id.replace('searchCat-', '');
                if (window.currentSearchCategory === 'all') {
                    btn.className = "search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 whitespace-nowrap";
                } else if (btnCat === window.currentSearchCategory) {
                    btn.className = "search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-white bg-[#007AFF] dark:bg-[#0A84FF] shadow-sm whitespace-nowrap";
                } else {
                    btn.className = "search-cat-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-white/5 opacity-40 hover:opacity-75 whitespace-nowrap";
                }
            });

            const input = document.getElementById('globalSearchInput');
            if (input) {
                window.handleGlobalSearch({ target: input });
            }
        };

        let searchTimeout;
        window.handleGlobalSearch = (e) => {
            clearTimeout(searchTimeout);
            const term = e.target.value.trim();
            console.log('[SEARCH] handleGlobalSearch triggered, term:', JSON.stringify(term), 'eventType:', e.type);
            const results = document.getElementById('globalSearchResults');
            const resultList = document.getElementById('searchResultList');
            const clearBtn = document.getElementById('globalSearchClear');
            console.log('[SEARCH] results:', !!results, 'resultList:', !!resultList, 'clearBtn:', !!clearBtn);

            if (!term) {
                if (clearBtn) clearBtn.classList.add('hidden');
                const history = this.getHistory();
                if (history && history.length > 0) {
                    let html = `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Recent Searches</span>
                        <button onclick="clearSearchHistoryUI(event)" class="text-[10px] text-red-500 hover:text-red-600 font-medium">Clear All</button>
                    </div>`;
                    history.forEach(item => {
                        const escapedHistoryItem = escapeForInlineHandler(item);
                        html += `<div onclick="event.stopPropagation(); fillGlobalSearch('${escapedHistoryItem}')" class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors group">
                            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>${window.escapeHTML(item)}</span>
                            </div>
                            <button onclick="deleteSearchHistoryUI(event, '${escapedHistoryItem}')" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>`;
                    });
                    if (resultList) resultList.innerHTML = html;
                    window.showGlobalSearchResults();
                } else {
                    window.hideGlobalSearchResults();
                    setTimeout(() => {
                        if (results && results.classList.contains('opacity-0')) {
                            if (resultList) resultList.innerHTML = '';
                        }
                    }, 200);
                }
                return;
            }

            if (clearBtn) clearBtn.classList.remove('hidden');

            if (term.length < 2) {
                window.hideGlobalSearchResults();
                setTimeout(() => {
                    if (results && results.classList.contains('opacity-0')) {
                        if (resultList) resultList.innerHTML = '';
                    }
                }, 200);
                return;
            }

            searchTimeout = setTimeout(async () => {
                console.log('[SEARCH] ▶ searchTimeout fired, term:', term);
                const cat = window.currentSearchCategory;
                const currentUser = getCurrentUser();
                const escapedTerm = escapeForInlineHandler(term);
                console.log('[SEARCH] cat:', cat, 'currentUser:', currentUser?.id, 'localDB:', !!localDB, 'db:', !!db);

                if (!resultList) return;
                resultList.innerHTML = '<div id="searchLoading" class="px-4 py-6 text-center"><div class="inline-flex items-center gap-2 text-xs text-gray-400"><svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Searching...</div></div>';
                window.showGlobalSearchResults();

                let totalResults = 0;
                const appendHtml = (newHtml) => {
                    const loader = document.getElementById('searchLoading');
                    if (loader) loader.remove();
                    resultList.insertAdjacentHTML('beforeend', newHtml);
                    totalResults++;
                };

                const searchPromises = [];

                if (cat === 'all' || cat === 'messages' || cat === 'people') {
                    searchPromises.push((async () => {
                        console.log('[SEARCH] → People search starting...');
                        try {
                            const now = Date.now();
                            if (!window._lastUserFetch || (now - window._lastUserFetch > 300000) || Object.keys(window.ALL_USERS).length < 10) {
                                console.log('[SEARCH] → Fetching user_search from Firebase...');
                                let allSnap = await get(query(ref(db, 'user_search'), orderByKey(), limitToFirst(5000)));
                                console.log('[SEARCH] → user_search exists:', allSnap.exists(), 'count:', allSnap.exists() ? Object.keys(allSnap.val() || {}).length : 0);
                                if (!allSnap.exists() || Object.keys(allSnap.val() || {}).length < 10) {
                                    console.log('[SEARCH] → Falling back to users node...');
                                    allSnap = await get(query(ref(db, 'users'), orderByKey(), limitToFirst(5000)));
                                    console.log('[SEARCH] → users exists:', allSnap.exists(), 'count:', allSnap.exists() ? Object.keys(allSnap.val() || {}).length : 0);
                                }
                                if (allSnap.exists()) {
                                    Object.assign(window.ALL_USERS, allSnap.val());
                                    window._lastUserFetch = now;
                                    console.log('[SEARCH] → ALL_USERS total:', Object.keys(window.ALL_USERS).length);
                                }
                            } else {
                                console.log('[SEARCH] → Using cached ALL_USERS:', Object.keys(window.ALL_USERS).length);
                            }

                            const peopleResults = this.searchPeople(term, currentUser, window.ALL_USERS);
                            console.log('[SEARCH] → People results:', peopleResults.length);
                            if (peopleResults.length > 0) {
                                let chunk = `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">People</div>`;
                                peopleResults.forEach(u => {
                                    let avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
                                    if (u.email === window.AppModules.Config.APP_CONSTANTS.ADMIN_EMAIL) avatar = window.CONSTANTS.SUSHI_AVATAR;
                                    const escapedId = escapeForInlineHandler(u.id);
                                    chunk += `<div onclick="switchChat('${escapedId}'); triggerAddHistory('${escapedTerm}'); clearGlobalSearch();" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <img src="${avatar}" class="w-9 h-9 rounded-full shadow-sm object-cover">
                                        <div><div class="font-semibold text-sm text-black dark:text-white">${window.escapeHTML(u.name)}</div><div class="text-xs text-gray-400">${window.escapeHTML(u.email)}</div></div>
                                    </div>`;
                                });
                                appendHtml(chunk);
                            }
                        } catch (err) { console.error('[SEARCH] ✗ People search FAILED:', err); }
                    })());
                }

                if (cat === 'all' || cat === 'tools') {
                    searchPromises.push((async () => {
                        console.log('[SEARCH] → Tools search starting...');
                        try {
                            const registry = window.AppModules && window.AppModules.Extension && window.AppModules.Extension.getRegistry ? window.AppModules.Extension.getRegistry() : {};
                            const toolsResults = this.searchTools(term, registry);
                            console.log('[SEARCH] → Tools results:', toolsResults.length);
                            if (toolsResults.length > 0) {
                                let chunk = `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tools</div>`;
                                toolsResults.forEach(t => {
                                    const escapedToolId = escapeForInlineHandler(t.id);
                                    const onClick = t.type === 'module' ? `openModule('${escapedToolId}')` : `openExtension('${escapedToolId}')`;
                                    chunk += `<div onclick="${onClick}; triggerAddHistory('${escapedTerm}'); clearGlobalSearch();" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="w-9 h-9 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                        </div>
                                        <div class="flex-1">
                                            <div class="font-semibold text-sm text-black dark:text-white">${window.escapeHTML(t.name)}</div>
                                            <div class="text-xs text-gray-400">${window.escapeHTML(t.desc)}</div>
                                        </div>
                                    </div>`;
                                });
                                appendHtml(chunk);
                            }
                        } catch (err) { console.error('[SEARCH] ✗ Tools search FAILED:', err); }
                    })());
                }

                if (cat === 'all' || cat === 'messages') {
                    searchPromises.push((async () => {
                        console.log('[SEARCH] → Messages search starting...');
                        try {
                            if (!localDB) { await dbReady; }
                            const sidebarClasses = getSidebarClasses();
                            const cnCache = getCnCache();
                            const { localResults, hasMore } = await this.searchMessages(term, currentUser, localDB, sidebarClasses, cnCache, db);
                            console.log('[SEARCH] → Messages localResults:', localResults.length, 'hasMore:', hasMore);

                            if (localResults.length > 0) {
                                let chunk = `<div data-messages-header class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Messages</div>`;
                                localResults.forEach(m => {
                                    let resolvedChatName = m.chatName;
                                    if (!m.chatId.startsWith('group_')) {
                                        resolvedChatName = window.ALL_USERS[m.chatName]?.name || m.chatName;
                                    }
                                    const escapedJumpId = escapeForInlineHandler(m.jumpId);
                                    const escapedText = escapeForInlineHandler(m.text);
                                    const escapedKey = escapeForInlineHandler(m.key || '');
                                    chunk += `<div onclick="switchChat('${escapedJumpId}'); triggerAddHistory('${escapedTerm}'); setTimeout(() => jumpToMessage('${escapedText}', '${escapedTerm}', '${escapedKey}'), 500); clearGlobalSearch();" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="text-xs font-bold text-[#007AFF] mb-0.5">in ${window.escapeHTML(resolvedChatName)}</div>
                                        <div class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-snug">${window.escapeHTML(m.text)}</div>
                                    </div>`;
                                });
                                appendHtml(chunk);
                            }

                            if (hasMore) {
                                appendHtml(`<div id="firebaseSearchMore" class="px-4 py-3 text-center">
                                    <button onclick="event.stopPropagation(); window.loadMoreSearchResults()" class="text-xs text-[#007AFF] font-semibold hover:underline">Search more in database</button>
                                </div>`);
                            }
                        } catch (err) { console.error('[SEARCH] ✗ Messages search FAILED:', err); }
                    })());
                }

                if (cat === 'all' || cat === 'news' || cat === 'community') {
                    searchPromises.push((async () => {
                        if (!localDB) { await dbReady; }
                        if (localDB) {
                            const newsResults = await this.searchNewsAndModules(term, localDB, cat);
                            let chunk = '';
                            if (newsResults.news.length > 0) {
                                chunk += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Announcements</div>`;
                                newsResults.news.forEach(item => {
                                    const escapedStoreName = escapeForInlineHandler(item.storeName);
                                    const escapedItemKey = escapeForInlineHandler(item.key);
                                    const escapedTypeOrModule = escapeForInlineHandler(item.typeOrModule);
                                    chunk += `<div onclick="handlePostJump('${escapedStoreName}', '${escapedItemKey}', '${escapedTypeOrModule}'); triggerAddHistory('${escapedTerm}');" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Announcement</div>
                                        <div class="text-[14px] font-semibold text-black dark:text-white line-clamp-1">${window.escapeHTML(item.title)}</div>
                                        <div class="text-xs text-gray-500 line-clamp-1 mt-0.5">${window.escapeHTML(item.desc)}</div>
                                    </div>`;
                                });
                            }
                            if (newsResults.community.length > 0) {
                                chunk += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Community</div>`;
                                newsResults.community.forEach(item => {
                                    const escapedStoreName = escapeForInlineHandler(item.storeName);
                                    const escapedItemKey = escapeForInlineHandler(item.key);
                                    const escapedTypeOrModule = escapeForInlineHandler(item.typeOrModule);
                                    chunk += `<div onclick="handlePostJump('${escapedStoreName}', '${escapedItemKey}', '${escapedTypeOrModule}'); triggerAddHistory('${escapedTerm}');" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Community</div>
                                        <div class="text-[14px] font-semibold text-black dark:text-white line-clamp-1">${window.escapeHTML(item.title)}</div>
                                        <div class="text-xs text-gray-500 line-clamp-1 mt-0.5">${window.escapeHTML(item.desc)}</div>
                                    </div>`;
                                });
                            }
                            if (chunk) appendHtml(chunk);
                        }
                    })());
                }

                if (cat === 'all' || cat === 'club') {
                    searchPromises.push((async () => {
                        const newsModule = window.AppModules && window.AppModules.News;
                        let chunk = '';
                        if (newsModule && typeof newsModule.getClubsForSearch === 'function') {
                            const clubResults = newsModule.getClubsForSearch(term).slice(0, 20);
                            if (clubResults.length > 0) {
                                chunk += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Club</div>`;
                                clubResults.forEach((clubItem) => {
                                    const escapedClubId = escapeForInlineHandler(clubItem.id);
                                    const locationLabel = clubItem.isJoined ? 'My Joint' : 'Discover';
                                    const badgeClass = clubItem.isJoined
                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
                                    chunk += `<div onclick="navigateToClubSearch('${escapedClubId}', '${escapedTerm}')" class="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div class="min-w-0">
                                            <div class="font-semibold text-sm text-black dark:text-white line-clamp-1">${window.escapeHTML(clubItem.name)}</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">${window.escapeHTML(clubItem.desc || clubItem.sponsor || 'Club')}</div>
                                        </div>
                                        <div class="shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${badgeClass}">${locationLabel}</div>
                                    </div>`;
                                });
                            }
                        }

                        const eventResults = await this.searchClubEvents(term, db);
                        if (eventResults.length > 0) {
                            chunk += `<div class="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Club Events</div>`;
                            eventResults.forEach((evt) => {
                                const escapedEventId = escapeForInlineHandler(evt.id);
                                const escapedClubId = escapeForInlineHandler(evt.clubId);
                                const meta = [evt.clubName, evt.date, evt.time, evt.room ? (String(evt.room).toLowerCase().startsWith('room') ? evt.room : `Room ${evt.room}`) : '']
                                    .filter(Boolean)
                                    .join(' | ');
                                chunk += `<div onclick="navigateToClubEventSearch('${escapedEventId}', '${escapedClubId}', '${escapedTerm}')" class="flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 flex items-center justify-center shrink-0">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    <div class="min-w-0">
                                        <div class="font-semibold text-sm text-black dark:text-white line-clamp-1">${window.escapeHTML(evt.title)}</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">${window.escapeHTML(meta || evt.clubName)}</div>
                                    </div>
                                </div>`;
                            });
                        }
                        if (chunk) appendHtml(chunk);
                    })());
                }

                await Promise.allSettled(searchPromises);

                const loader = document.getElementById('searchLoading');
                if (loader) loader.remove();

                if (totalResults === 0) {
                    resultList.innerHTML = '<div class="px-4 py-10 text-center text-gray-400 text-xs">No results found.</div>';
                }
                window.showGlobalSearchResults();
                console.log('[SEARCH] ✓ Search complete');
            }, 300);
        };

        window.handlePostJump = (storeName, itemId, typeOrModule) => {
            if (storeName === 'news') {
                if (window.innerWidth < 800) window.switchTab('news');
                window.switchLeftTab('news');
                const schoolContent = document.getElementById('schoolNewsContent');
                const clubContent = document.getElementById('clubNewsContent');
                const targetIsSchool = typeOrModule === 'school';
                const isAlreadyOnTargetTab = targetIsSchool
                    ? (schoolContent && !schoolContent.classList.contains('hidden'))
                    : (clubContent && !clubContent.classList.contains('hidden'));

                if (!isAlreadyOnTargetTab) {
                    window.toggleNewsTab(typeOrModule);
                }

                setTimeout(() => {
                    const containerId = typeOrModule === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
                    const container = document.getElementById(containerId);
                    if (container) {
                        const items = Array.from(container.children);
                        const target = items.find(el => el.dataset.newsKey === itemId);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            target.classList.remove('animate-in', 'fade-in', 'slide-in-from-bottom-2', 'duration-500');
                            target.classList.add('news-jump-highlight');
                            setTimeout(() => target.classList.remove('news-jump-highlight'), 1800);
                        }
                    }
                }, isAlreadyOnTargetTab ? 120 : 500);
            } else if (storeName === 'modules') {
                if (window.innerWidth < 800 && typeof window.switchTab === 'function') {
                    window.switchTab('tools');
                } else {
                    window.switchLeftTab('tools');
                }
                window.openModule(typeOrModule);
                setTimeout(() => window.openPostDetail(itemId), 400);
            }
            window.clearGlobalSearch();
        };

        window.navigateToClubSearch = (clubId, term = '') => {
            const newsModule = window.AppModules && window.AppModules.News;
            const ok = !!(newsModule && typeof newsModule.navigateToClubFromSearch === 'function' && newsModule.navigateToClubFromSearch(clubId));
            if (ok && term && String(term).trim()) {
                this.addHistory(String(term).trim());
            }
            window.clearGlobalSearch();
        };

        window.navigateToClubEventSearch = (eventId, clubId, term = '') => {
            const newsModule = window.AppModules && window.AppModules.News;
            const ok = !!(newsModule
                && typeof newsModule.navigateToClubEventFromSearch === 'function'
                && newsModule.navigateToClubEventFromSearch(eventId, clubId));
            if (ok && term && String(term).trim()) {
                this.addHistory(String(term).trim());
            }
            window.clearGlobalSearch();
        };
    }
};
export default SearchModule;

// Bind to window to integrate directly into global environment hooks
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Search = SearchModule;
}
