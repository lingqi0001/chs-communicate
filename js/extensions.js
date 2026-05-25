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

let _currentExtensionUrl = '';
let _isPanelExtensionOpen = false;

const getDesktopLeftOffset = () => {
    if (window.innerWidth < 1024 || document.body.classList.contains('sidebar-collapsed')) return 0;

    const newsSection = document.getElementById('newsSection');
    if (newsSection) {
        const rect = newsSection.getBoundingClientRect();
        if (Number.isFinite(rect.width) && rect.width > 0) return Math.round(rect.width);
    }

    const appContainer = document.querySelector('.app-container');
    const widthScope = appContainer || document.documentElement;
    const widthValue = getComputedStyle(widthScope).getPropertyValue('--news-panel-width').trim();
    const parsed = Number.parseFloat(widthValue);
    return Number.isFinite(parsed) ? parsed : 320;
};

const syncExtensionPanelOffset = () => {
    const extPage = document.getElementById('extensionPage');
    if (!extPage) return;

    if (!_isPanelExtensionOpen) {
        extPage.style.left = '';
        return;
    }

    const offset = getDesktopLeftOffset();
    extPage.style.left = offset > 0 ? `${offset}px` : '';
};

const bindExtensionPanelOffsetSync = () => {
    window.removeEventListener('resize', syncExtensionPanelOffset);
    window.removeEventListener('news-panel-width-change', syncExtensionPanelOffset);
    window.addEventListener('resize', syncExtensionPanelOffset);
    window.addEventListener('news-panel-width-change', syncExtensionPanelOffset);
};

export const openExtension = (eid, customUrl = null, customTitle = null) => {
    const titleEl = document.getElementById('extensionTitle');
    const iframe = document.getElementById('extensionIframe');
    const loader = document.getElementById('extensionLoading');

    let url = 'about:blank';
    let title = 'Tool';

    // Resolve dynamically from registry
    const regItem = ExtensionModule.getRegistryItem(eid);

    if (customUrl) {
        url = customUrl;
        title = customTitle || eid;
    } else if (regItem) {
        url = regItem.url;
        title = regItem.title;
    } else if (eid === 'calc_volume_3d') {
        url = 'extensions/BC volume 3D present.html';
        title = '3D Volume Visualizer';
    } else if (eid === 'independent_research') {
        url = 'extensions/school/ir-navigator/IR Navigator.html';
        title = 'Independent Research Hub';
    } else if (eid === 'grade_calculator') {
        url = 'extensions/grade_calculator.html';
        title = 'Grade Calculator';
    }

    _currentExtensionUrl = url;
    if (titleEl) titleEl.innerText = title;
    if (loader) loader.classList.remove('hidden');
    if (iframe) iframe.src = url + '?v=' + Date.now();

    if (iframe) {
        iframe.onload = () => {
            if (loader) loader.classList.add('hidden');
            
            if (iframe.contentWindow) {
                const ViewModule = window.ViewModule || window.AppModules?.View;
                const isDarkMode = ViewModule?.state?.isDarkMode || false;
                iframe.contentWindow.postMessage({
                    type: 'THEME_UPDATE',
                    isDarkMode: isDarkMode
                }, '*');

                // Read pending message from bridge if available
                const Bridge = window.AppModules?.Bridge;
                if (Bridge && Bridge.getPendingMessage) {
                    const pendingMsg = Bridge.getPendingMessage();
                    if (pendingMsg) {
                        iframe.contentWindow.postMessage(pendingMsg, '*');
                        Bridge.clearPendingMessage();
                    }
                }
            }
        };
    }

    // Apply Panel vs Fullscreen logic based on extension type
    const isPanel = ['grade_calculator', 'eagle_time', 'cafeteria', 'social_engine'].includes(eid);
    const extPage = document.getElementById('extensionPage');

    if (extPage) {
        if (isPanel) {
            _isPanelExtensionOpen = true;
            extPage.classList.add('desktop-dynamic-left');
            extPage.classList.remove('z-[160]');
            extPage.classList.add('z-[95]');
            document.body.classList.remove('is-fullscreen');
            bindExtensionPanelOffsetSync();
            syncExtensionPanelOffset();
        } else {
            _isPanelExtensionOpen = false;
            extPage.classList.remove('desktop-dynamic-left');
            extPage.classList.add('z-[160]');
            extPage.classList.remove('z-[95]');
            extPage.style.left = '';
            document.body.classList.add('is-fullscreen');
        }
    }

    const ViewModule = window.ViewModule || window.AppModules?.View;
    if (ViewModule && ViewModule.openOverlay) {
        ViewModule.openOverlay('extensionPage', { zIndex: ViewModule.CONSTANTS?.Z_INDEX?.ADMIN || 160, isExclusive: true });
    }
};

export const closeExtension = () => {
    _isPanelExtensionOpen = false;
    window.removeEventListener('resize', syncExtensionPanelOffset);
    window.removeEventListener('news-panel-width-change', syncExtensionPanelOffset);
    const ViewModule = window.ViewModule || window.AppModules?.View;
    if (ViewModule && ViewModule.closeOverlay) {
        ViewModule.closeOverlay('extensionPage', {
            onClose: () => {
                const extPage = document.getElementById('extensionPage');
                const iframe = document.getElementById('extensionIframe');
                if (extPage) extPage.style.left = '';
                if (iframe) iframe.src = 'about:blank';
                _currentExtensionUrl = '';
            }
        });
    }
};

export const reloadExtension = () => {
    const iframe = document.getElementById('extensionIframe');
    const loader = document.getElementById('extensionLoading');
    if (loader) loader.classList.remove('hidden');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.location.reload();
    }
};

export const openExtensionExternally = () => {
    if (_currentExtensionUrl && _currentExtensionUrl !== 'about:blank') {
        window.open(_currentExtensionUrl, '_blank');
    }
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

    openExtension(eid, customUrl = null, customTitle = null) {
        return openExtension(eid, customUrl, customTitle);
    },

    closeExtension() {
        return closeExtension();
    },

    reloadExtension() {
        return reloadExtension();
    },

    openExtensionExternally() {
        return openExtensionExternally();
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
                return { rendered: true, hasRealLocalFiles: filesList.length > 0 };
            }
            return { rendered: false, hasRealLocalFiles: false };
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
            const result = await syncFolderLocal(cat);
            if (result.hasRealLocalFiles) foundLocal = true;
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
    window.openExtension = openExtension;
    window.closeExtension = closeExtension;
    window.reloadExtension = reloadExtension;
    window.openExtensionExternally = openExtensionExternally;
}
