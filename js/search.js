/**
 * ==================================================================================
 * Module: AppModules.Search (js/search.js)
 * Purpose: Decouples search logic, user name weighting, tool registries, IndexedDB
 *          message query filtering, and search history caching in local storage.
 * ==================================================================================
 */

const HISTORY_KEY = 'chs_search_history';
const MAX_HISTORY_LEN = 8;

export const SearchModule = {
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
    async searchMessages(term, currentUser, localDB, sidebarClasses, cnCache) {
        const termLower = term.toLowerCase().trim();
        if (!termLower || !localDB) return [];

        try {
            const tx = localDB.transaction("messages", "readonly");
            const store = tx.objectStore("messages");
            const allMsgs = await new Promise((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });

            const currentUserIdLower = currentUser.id.toLowerCase();

            return allMsgs.filter(m => {
                if (!m.text || !m.chatId) return false;
                // Exclude base64 image strings
                if (m.type === 'image' || m.type === 'image_group' || m.text.startsWith('data:image')) return false;

                // Group/Private permission gating
                if (m.chatId.startsWith('group_')) {
                    const classId = m.chatId.replace('group_', '');
                    if (!sidebarClasses || !sidebarClasses[classId]) return false;
                } else {
                    const participants = m.chatId.toLowerCase().split('_');
                    if (!participants.includes(currentUserIdLower)) return false;
                }
                return m.text.toLowerCase().includes(termLower);
            }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15).map(m => {
                let chatName = "Chat";
                let jumpId = m.chatId;
                if (m.chatId.startsWith('group_')) {
                    const classId = m.chatId.replace('group_', '');
                    chatName = (cnCache && cnCache[classId]) ? cnCache[classId] : "Class Chat";
                } else {
                    const parts = m.chatId.split('_');
                    if (parts.length >= 2) {
                        const otherId = parts[0] === currentUser.id ? parts[1] : parts[0];
                        chatName = otherId; // Resolved in UI using ALL_USERS mapping
                        jumpId = otherId;
                    }
                }
                return {
                    chatId: m.chatId,
                    chatName,
                    text: m.text,
                    timestamp: m.timestamp,
                    jumpId
                };
            });
        } catch (e) {
            console.warn("IndexedDB messages search failed:", e);
            return [];
        }
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
    }
};

// Bind to window to integrate directly into global environment hooks
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Search = SearchModule;
}
