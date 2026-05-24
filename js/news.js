import { UIComponents } from './ui-components.js?v=20260522-1';

export function createNewsModule(deps) {
    const {
        db,
        ref,
        push,
        set,
        remove,
        getCurrentUser,
        getCurrentNewsTab,
        setCurrentNewsTab,
        isAdmin,
        confirm,
        alert,
        showCustom,
        globalDataSync
    } = deps;

    let isNavExpanded = false;
    let currentPrimaryTab = 'school';
    let currentSubTab = 'joint';

    function renderCard(post, tabType) {
        if (!post) return '';
        return UIComponents.renderNewsCard(post, tabType, isAdmin());
    }

    function renderNewsContentFromData(posts, containerId, tabType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const arr = Array.isArray(posts) ? posts : [];
        const sortedPosts = arr
            .filter(Boolean)
            .map(p => {
                const id = p.id || p.key || (p.compositeId ? String(p.compositeId).replace(`${tabType}_`, '') : null);
                return { ...p, id, key: p.key || id };
            })
            .filter(p => p.key)
            .sort((a, b) => {
                const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                if (pinDelta !== 0) return pinDelta;
                return (b.timestamp || 0) - (a.timestamp || 0);
            });

        if (sortedPosts.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-10 font-semibold">No announcements yet.</div>';
            return;
        }

        container.innerHTML = sortedPosts.map(post => renderCard(post, tabType)).join('');
    }

    async function deleteNews(id, tabType) {
        if (!isAdmin()) return;
        const ok = await confirm('Delete Announcement', 'Are you sure you want to delete this announcement?', 'Delete');
        if (!ok) return;
        try {
            await remove(ref(db, `news/${tabType}/${id}`));
            alert('Deleted', 'Announcement deleted successfully.');
        } catch (e) {
            alert('Error', `Failed to delete: ${e.message}`);
        }
    }

    function setAddAnnouncementVisibility(type) {
        const addBtn = document.getElementById('addAnnouncementBtn');
        if (!addBtn) return;

        if (type !== 'school' && type !== 'club') {
            addBtn.classList.add('hidden');
            return;
        }

        if (window.AppModules && window.AppModules.User && (window.AppModules.User.isTeacher() || window.AppModules.User.isAdmin())) {
            addBtn.classList.remove('hidden');
        } else {
            addBtn.classList.add('hidden');
        }
    }

    function updatePrimaryTabUI() {
        const btnSchool = document.getElementById('btnSchoolNews');
        const btnClub = document.getElementById('btnClubNews');
        if (!btnSchool || !btnClub) return;

        const activePrimaryClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-black dark:text-white bg-white dark:bg-[#2C2C2E] shadow-sm";
        const inactivePrimaryClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300";

        if (currentPrimaryTab === 'school') {
            btnSchool.className = activePrimaryClass;
            btnClub.className = inactivePrimaryClass;
        } else {
            btnSchool.className = inactivePrimaryClass;
            btnClub.className = activePrimaryClass;
        }
    }

    function updateSubTabUI(selectedSubTab) {
        const tabs = ['joint', 'discover', 'events'];
        tabs.forEach((id) => {
            const btn = document.getElementById(`subTab_${id}`);
            if (!btn) return;
            if (id === selectedSubTab) {
                btn.className = "flex-1 h-full bg-white text-black dark:bg-[#2C2C2E] dark:text-white rounded-lg text-center transition-colors whitespace-nowrap shadow-sm";
            } else {
                btn.className = "flex-1 h-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-center transition-colors whitespace-nowrap";
            }
        });
    }

    function expandDiscoverNav() {
        const schoolBtn = document.getElementById('btnSchoolNews');
        const clubBtn = document.getElementById('btnClubNews');
        const schoolText = document.getElementById('textSchoolFull');
        const clubText = document.getElementById('textClubFull');
        const schoolIcon = document.getElementById('iconSchoolNews');
        const clubIcon = document.getElementById('iconClubNews');
        const discoverBlock = document.getElementById('discoverPillBlock');
        const iconWrapper = document.getElementById('discoverIconWrapper');
        const subTabs = document.getElementById('subClubTabs');

        if (!schoolBtn || !clubBtn || !schoolText || !clubText || !discoverBlock || !iconWrapper || !subTabs) return;

        const inactiveClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300";
        schoolBtn.className = inactiveClass;
        clubBtn.className = inactiveClass;

        schoolText.style.maxWidth = '0px';
        schoolText.style.opacity = '0';
        schoolText.style.marginLeft = '0px';
        clubText.style.maxWidth = '0px';
        clubText.style.opacity = '0';
        clubText.style.marginLeft = '0px';

        if (schoolIcon) {
            schoolIcon.style.maxWidth = '16px';
            schoolIcon.style.opacity = '1';
        }
        if (clubIcon) {
            clubIcon.style.maxWidth = '16px';
            clubIcon.style.opacity = '1';
        }

        schoolBtn.style.maxWidth = '28px';
        clubBtn.style.maxWidth = '28px';

        discoverBlock.style.width = 'calc(100% - 72px)';
        iconWrapper.style.opacity = '0';
        iconWrapper.style.transform = 'scale(0.5)';
        subTabs.classList.remove('opacity-0', 'pointer-events-none');
        subTabs.classList.add('opacity-100');
        isNavExpanded = true;
    }

    function collapseDiscoverNav() {
        const schoolBtn = document.getElementById('btnSchoolNews');
        const clubBtn = document.getElementById('btnClubNews');
        const schoolText = document.getElementById('textSchoolFull');
        const clubText = document.getElementById('textClubFull');
        const schoolIcon = document.getElementById('iconSchoolNews');
        const clubIcon = document.getElementById('iconClubNews');
        const discoverBlock = document.getElementById('discoverPillBlock');
        const iconWrapper = document.getElementById('discoverIconWrapper');
        const subTabs = document.getElementById('subClubTabs');

        if (!schoolBtn || !clubBtn || !schoolText || !clubText || !discoverBlock || !iconWrapper || !subTabs) return;

        schoolText.style.maxWidth = '80px';
        schoolText.style.opacity = '1';
        schoolText.style.marginLeft = '0px';
        clubText.style.maxWidth = '80px';
        clubText.style.opacity = '1';
        clubText.style.marginLeft = '0px';

        if (schoolIcon) {
            schoolIcon.style.maxWidth = '0px';
            schoolIcon.style.opacity = '0';
        }
        if (clubIcon) {
            clubIcon.style.maxWidth = '0px';
            clubIcon.style.opacity = '0';
        }

        schoolBtn.style.maxWidth = '50%';
        clubBtn.style.maxWidth = '50%';

        discoverBlock.style.width = '32px';
        iconWrapper.style.opacity = '1';
        iconWrapper.style.transform = 'scale(1)';
        subTabs.classList.add('opacity-0', 'pointer-events-none');
        subTabs.classList.remove('opacity-100');
        isNavExpanded = false;
    }

    function showNewsContent(type) {
        const contentSchool = document.getElementById('schoolNewsContent');
        const contentClub = document.getElementById('clubNewsContent');
        const contentClubsList = document.getElementById('clubsListContent');
        if (!contentSchool || !contentClub || !contentClubsList) return;

        const all = [contentSchool, contentClub, contentClubsList];
        all.forEach((el) => {
            if (!el.classList.contains('hidden')) {
                el.classList.add('opacity-0');
            }
        });

        setTimeout(() => {
            all.forEach((el) => el.classList.add('hidden'));
            let target = contentSchool;
            if (type === 'club') target = contentClub;
            if (type === 'clubs' || type === 'joint' || type === 'discover' || type === 'events') target = contentClubsList;
            target.classList.remove('hidden');
            void target.offsetWidth;
            target.classList.remove('opacity-0');
        }, 150);
    }

    function selectPrimaryTab(tabType, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        currentPrimaryTab = tabType;
        setCurrentNewsTab(tabType);

        if (isNavExpanded) {
            collapseDiscoverNav();
        }
        updatePrimaryTabUI();
        setAddAnnouncementVisibility(tabType);
        showNewsContent(tabType);
    }

    function selectSubTab(tabId, e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        currentSubTab = tabId;
        setCurrentNewsTab('clubs');
        updateSubTabUI(tabId);
        setAddAnnouncementVisibility('clubs');
        showNewsContent(tabId);
    }

    function toggleNewsTab(type, e) {
        if (type === 'school' || type === 'club') {
            selectPrimaryTab(type, e);
            return;
        }

        if (type === 'clubs') {
            setCurrentNewsTab('clubs');
            if (!isNavExpanded) {
                expandDiscoverNav();
            }
            selectSubTab('joint', null);
            return;
        }

        if (type === 'joint' || type === 'discover' || type === 'events') {
            if (!isNavExpanded) {
                expandDiscoverNav();
            }
            selectSubTab(type, e);
        }
    }

    // Ensure first paint is collapsed and primary state is school.
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            currentPrimaryTab = getCurrentNewsTab() === 'club' ? 'club' : 'school';
            updatePrimaryTabUI();
            collapseDiscoverNav();
            updateSubTabUI(currentSubTab);
            setAddAnnouncementVisibility(currentPrimaryTab);
        }, 0);
    }

    async function processBatchData(raw) {
        if (!isAdmin()) return;
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            alert('Import Error', 'Invalid JSON format.');
            return;
        }

        if (!Array.isArray(data)) {
            alert('Error', 'Data must be an array.');
            return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Error', 'Current user not found.');
            return;
        }

        try {
            const promises = data.map(item => {
                const type = (item?.type === 'club' || item?.type === 'club_news') ? 'club' : 'school';
                return set(push(ref(db, `news/${type}`)), {
                    title: item?.title || 'Untitled',
                    desc: item?.desc || '',
                    image: null,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    timestamp: Date.now(),
                    type
                });
            });
            await Promise.all(promises);
            alert('Success', `Successfully published ${data.length} items.`);
            if (typeof globalDataSync === 'function') globalDataSync();
        } catch (e) {
            alert('Error', `Failed to publish: ${e.message}`);
        }
    }

    async function openBatchImport() {
        const html = `
            <div class="space-y-4 text-left">
                <p class="text-sm text-gray-500 leading-relaxed">Paste your AI-generated JSON array below. It should include <b>title</b>, <b>desc</b>, and <b>type</b> (school or club).</p>
                <textarea id="batchJsonInput" rows="10" placeholder='[{"title": "Morning Meeting", "desc": "Join us...", "type": "school"}]'
                    class="w-full bg-gray-100 dark:bg-black text-black dark:text-white rounded-2xl px-4 py-3 text-sm font-mono outline-none border border-gray-200 dark:border-gray-800 focus:ring-2 ring-[#007AFF]/20 transition-all"></textarea>
            </div>
        `;
        const result = await showCustom('Batch Import', html, [
            { text: 'Import & Publish', value: 'import', primary: true },
            { text: 'Cancel', value: 'cancel', primary: false }
        ]);

        if (result === 'import') {
            const raw = document.getElementById('batchJsonInput')?.value.trim();
            if (raw) await processBatchData(raw);
        }
    }

    async function renderLocalNews(getLocalNews) {
        const newsTabs = ['school', 'club'];
        newsTabs.forEach((tab) => {
            const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="py-10 flex flex-col items-center gap-2 text-gray-400">
                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                        <span class="text-xs font-medium">Loading announcements...</span>
                    </div>
                `;
            }
        });
        await Promise.all(newsTabs.map(async (tab) => {
            const posts = await getLocalNews(tab);
            const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
            renderNewsContentFromData(posts, containerId, tab);
        }));
    }

    return {
        renderCard,
        renderNewsContentFromData,
        renderLocalNews,
        deleteNews,
        toggleNewsTab,
        openBatchImport,
        processBatchData,
        getCurrentNewsTab
    };
}
