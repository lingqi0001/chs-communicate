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

    const activeClass = "flex-1 text-center text-xs font-bold h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all";
    const inactiveClass = "flex-1 text-center text-xs font-bold h-full flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all";

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

    function toggleNewsTab(type) {
        setCurrentNewsTab(type);
        const btnSchool = document.getElementById('btnSchoolNews');
        const btnClub = document.getElementById('btnClubNews');
        const contentSchool = document.getElementById('schoolNewsContent');
        const contentClub = document.getElementById('clubNewsContent');
        if (!btnSchool || !btnClub || !contentSchool || !contentClub) return;

        if (type === 'school') {
            btnSchool.className = activeClass;
            btnClub.className = inactiveClass;
            contentClub.classList.add('opacity-0');
            setTimeout(() => {
                contentClub.classList.add('hidden');
                contentSchool.classList.remove('hidden');
                void contentSchool.offsetWidth;
                contentSchool.classList.remove('opacity-0');
            }, 150);
        } else {
            btnClub.className = activeClass;
            btnSchool.className = inactiveClass;
            contentSchool.classList.add('opacity-0');
            setTimeout(() => {
                contentSchool.classList.add('hidden');
                contentClub.classList.remove('hidden');
                void contentClub.offsetWidth;
                contentClub.classList.remove('opacity-0');
            }, 150);
        }
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
