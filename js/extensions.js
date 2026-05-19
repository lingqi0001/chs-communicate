/**
 * ==================================================================================
 * Module Name: ExtensionModule (Third-party Plugins Delivery Engine)
 * File Path: js/extensions.js
 * ==================================================================================
 */

export const ExtensionModule = {
    callbacks: {
        renderCategory: null,
        onComplete: null
    },

    init(cbs) {
        this.callbacks = { ...this.callbacks, ...cbs };
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
                        if (this.callbacks.renderCategory) {
                            this.callbacks.renderCategory(categoryMap[folder] || folder, links.map(l => ({ name: decodeURIComponent(l), url: `extensions/${folder}/${l}` })));
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
                                const htmlFiles = files.filter(f => f.name.endsWith('.html'))
                                    .map(f => ({ name: f.name, url: f.path }));

                                if (htmlFiles.length > 0) {
                                    if (this.callbacks.renderCategory) {
                                        this.callbacks.renderCategory(categoryMap[item.name] || item.name, htmlFiles);
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

        if (container.innerHTML === '' && this.callbacks.onComplete) {
            this.callbacks.onComplete(container);
        }
    }
};

// Global mount for ESM module system compatibility
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Extension = ExtensionModule;
}
