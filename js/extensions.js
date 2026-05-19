/**
 * ==================================================================================
 * Module Name: ExtensionModule (Third-party Plugins Delivery Engine)
 * File Path: js/extensions.js
 * ==================================================================================
 */

const ALIAS_MAP = {
    'calc_volume_3d': 'bc_volume_3d_present',
    'independent_research': 'ir_navigator',
    'selection_logic': 'selection_logic_visualizer',
    'grade_calc': 'grade_calculator'
};

export const ExtensionModule = {
    callbacks: {
        renderCategory: null,
        onComplete: null
    },
    
    // Global registry for scanned/available extensions
    registry: {
        'grade_calculator': {
            eid: 'grade_calculator',
            url: 'extensions/grade_calculator.html',
            title: 'Grade Calculator',
            category: 'Learning Tools'
        }
    },

    init(cbs) {
        this.callbacks = { ...this.callbacks, ...cbs };
    },

    getRegistry() {
        return this.registry;
    },

    getRegistryItem(eid) {
        const targetEid = ALIAS_MAP[eid] || eid;
        return this.registry[targetEid] || null;
    },

    /**
     * Scan Extensions automatically from local directory or fall back to GitHub Repository contents
     */
    async syncExtensions() {
        const container = document.getElementById('dynamicExtensionsList');
        if (!container) return;
        container.innerHTML = ''; // Clears loader indicator

        const categoryMap = { 'school': 'Learning Tools', 'staff': 'Staff Tools' };

        // Helper to scan local relative paths (development)
        const syncFolderLocal = async (folder) => {
            try {
                const resp = await fetch(`/extensions/${folder}/`);
                if (resp.ok) {
                    const text = await resp.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'))
                        .map(a => a.getAttribute('href'))
                        .filter(href => href && href.endsWith('.html') && !href.startsWith('/'));
                    if (links.length > 0) {
                        const filesList = links.map(l => {
                            const rawName = decodeURIComponent(l).replace('.html', '');
                            const eid = rawName.toLowerCase().replace(/\s+/g, '_');
                            const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            const url = `extensions/${folder}/${l}`;
                            
                            this.registry[eid] = {
                                eid,
                                url,
                                title: displayName,
                                category: categoryMap[folder] || folder
                            };
                            return { name: decodeURIComponent(l), url };
                        });
                        
                        if (this.callbacks.renderCategory) {
                            this.callbacks.renderCategory(categoryMap[folder] || folder, filesList);
                        }
                        return true;
                    }
                }
            } catch (e) { }
            return false;
        };

        // Fallback to query GitHub API for hosted plugins (production)
        const syncViaGitHub = async () => {
            try {
                const ghResp = await fetch('https://api.github.com/repos/lingqi0001/chs-communicate/contents/extensions');
                if (ghResp.ok) {
                    const items = await ghResp.json();
                    for (const item of items) {
                        if (item.type === 'dir') {
                            const subResp = await fetch(item.url);
                            if (subResp.ok) {
                                const files = await subResp.json();
                                const htmlFiles = files.filter(f => f.name.endsWith('.html'));

                                if (htmlFiles.length > 0) {
                                    const filesList = htmlFiles.map(f => {
                                        const rawName = f.name.replace('.html', '');
                                        const eid = rawName.toLowerCase().replace(/\s+/g, '_');
                                        const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                        const url = f.path;

                                        this.registry[eid] = {
                                            eid,
                                            url,
                                            title: displayName,
                                            category: categoryMap[item.name] || item.name
                                        };
                                        return { name: f.name, url: f.path };
                                    });

                                    if (this.callbacks.renderCategory) {
                                        this.callbacks.renderCategory(categoryMap[item.name] || item.name, filesList);
                                    }
                                }
                            }
                        }
                    }
                    return true;
                }
            } catch (e) {
                console.error("ExtensionModule: GitHub Extension Fetch Failed:", e);
            }
            return false;
        };

        let foundLocal = false;
        for (const cat of Object.keys(categoryMap)) {
            if (await syncFolderLocal(cat)) foundLocal = true;
        }

        if (!foundLocal) {
            await syncViaGitHub();
        }

        // Also add aliases to registry for easier lookup
        Object.keys(ALIAS_MAP).forEach(alias => {
            const canonical = ALIAS_MAP[alias];
            if (this.registry[canonical]) {
                this.registry[alias] = this.registry[canonical];
            }
        });

        if (container.innerHTML === '' && this.callbacks.onComplete) {
            this.callbacks.onComplete(container);
        }
    }
};

// Global mount for ESM module system compatibility
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Extension = ExtensionModule;
    window.ExtensionRegistry = ExtensionModule.registry;
}
