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
        },
        'ir_navigator': {
            eid: 'ir_navigator',
            url: 'extensions/school/ir-navigator/IR Navigator.html',
            title: 'IR Navigator',
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
            const filesList = [];
            const scannedPaths = new Set();
            const categoryName = categoryMap[folder] || folder;
            
            const scan = async (relativeDir) => {
                if (scannedPaths.has(relativeDir)) return;
                scannedPaths.add(relativeDir);
                
                try {
                    const resp = await fetch(`extensions/${relativeDir}/`);
                    if (resp.ok) {
                        const text = await resp.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        const links = Array.from(doc.querySelectorAll('a'))
                            .map(a => a.getAttribute('href'))
                            .filter(href => href);
                        
                        for (const l of links) {
                            let absolutePath;
                            try {
                                const base = new URL(`extensions/${relativeDir}/`, window.location.href);
                                absolutePath = new URL(l, base).pathname;
                            } catch (e) {
                                continue;
                            }
                            
                            const prefix = new URL(`extensions/${relativeDir}/`, window.location.href).pathname;
                            if (!absolutePath.startsWith(prefix) || absolutePath === prefix) {
                                continue;
                            }
                            
                            const rest = absolutePath.slice(prefix.length);
                            const decodedRest = decodeURIComponent(rest);
                            const isDir = l.endsWith('/') || decodedRest.endsWith('/') || !decodedRest.includes('.');
                            
                            if (isDir) {
                                const subName = decodedRest.endsWith('/') ? decodedRest.slice(0, -1) : decodedRest;
                                if (subName && subName !== '.' && subName !== '..') {
                                    await scan(`${relativeDir}/${subName}`);
                                }
                            } else if (decodedRest.endsWith('.html')) {
                                const rawName = decodedRest.replace('.html', '');
                                const eid = rawName.toLowerCase().replace(/\s+/g, '_');
                                const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                const url = `extensions/${relativeDir}/${decodedRest}`;
                                
                                this.registry[eid] = {
                                    eid,
                                    url,
                                    title: displayName,
                                    category: categoryName
                                };
                                filesList.push({ name: decodedRest, url });
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to local scan subfolder ${relativeDir}:`, e);
                }
            };

            await scan(folder);
            
            // Merge registry-backed fallback entries for this folder/category.
            // This keeps nested tools visible even when directory-index recursion is blocked.
            const fallbackFiles = Object.values(this.registry)
                .filter(item =>
                    item &&
                    item.category === categoryName &&
                    typeof item.url === 'string' &&
                    item.url.startsWith(`extensions/${folder}/`) &&
                    item.url.endsWith('.html')
                )
                .map(item => {
                    const fileName = decodeURIComponent(item.url.split('/').pop() || '');
                    return { name: fileName, url: item.url };
                });

            const dedup = new Map();
            [...filesList, ...fallbackFiles].forEach(file => {
                if (!file || !file.url) return;
                const key = decodeURIComponent(file.url).toLowerCase();
                if (!dedup.has(key)) dedup.set(key, file);
            });
            const mergedFiles = Array.from(dedup.values());

            if (mergedFiles.length > 0) {
                if (this.callbacks.renderCategory) {
                    this.callbacks.renderCategory(categoryName, mergedFiles);
                }
                return true;
            }
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
                            const filesList = [];
                            
                            const scanGitHubDir = async (dirUrl) => {
                                const subResp = await fetch(dirUrl);
                                if (subResp.ok) {
                                    const files = await subResp.json();
                                    for (const f of files) {
                                        if (f.type === 'dir') {
                                            await scanGitHubDir(f.url);
                                        } else if (f.type === 'file' && f.name.endsWith('.html')) {
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
                                            filesList.push({ name: f.name, url: f.path });
                                        }
                                    }
                                }
                            };

                            await scanGitHubDir(item.url);

                            if (filesList.length > 0) {
                                if (this.callbacks.renderCategory) {
                                    this.callbacks.renderCategory(categoryMap[item.name] || item.name, filesList);
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
