export function initCafeteriaFeature(deps) {
    const {
        db,
        ref,
        push,
        set,
        update,
        onValue,
        serverTimestamp,
        escapeHTML,
        getLocalDateString,
        AppModules,
        getCurrentModule,
        setCurrentModule,
        getModuleListener,
        setModuleListener
    } = deps;

    let cafeteriaPool = {};
    let cafeteriaMenus = {};
    let currentCafeteriaTab = 'today';
    let selectedFoods = { today: new Set(), tomorrow: new Set() };
    let cafeteriaListener1 = null;
    let cafeteriaListener2 = null;

    function loadCafeteriaData() {
        if (cafeteriaListener1) cafeteriaListener1();
        if (cafeteriaListener2) cafeteriaListener2();

        cafeteriaListener1 = onValue(ref(db, 'cafeteria/pool'), (snap) => {
            cafeteriaPool = snap.val() || {};
            renderCafeteriaView();
            renderCafeteriaEditPool();
        });

        cafeteriaListener2 = onValue(ref(db, 'cafeteria/menus'), (snap) => {
            cafeteriaMenus = snap.val() || {};
            renderCafeteriaView();
        });
    }

    function renderCafeteriaView() {
        const todayStr = getLocalDateString(0);
        const tomorrowStr = getLocalDateString(1);

        const todayIds = cafeteriaMenus[todayStr] || [];
        const tomorrowIds = cafeteriaMenus[tomorrowStr] || [];

        const todayList = document.getElementById('cafeteriaTodayList');
        const tomorrowList = document.getElementById('cafeteriaTomorrowList');

        const renderItems = (ids, container) => {
            if (!ids || ids.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-4 font-medium">No menu published yet.</div>';
                return;
            }
            let html = '';
            ids.forEach((id) => {
                if (cafeteriaPool[id]) {
                    html += `
                        <div class="flex items-center gap-3 py-1">
                            <div class="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                            <span class="text-base font-bold text-black dark:text-white">${escapeHTML(cafeteriaPool[id].name)}</span>
                        </div>
                    `;
                }
            });
            container.innerHTML = html || '<div class="text-center text-gray-400 py-4 font-medium">Items no longer available.</div>';
        };

        if (todayList) renderItems(todayIds, todayList);
        if (tomorrowList) renderItems(tomorrowIds, tomorrowList);
    }

    function renderCafeteriaEditPool() {
        const listEl = document.getElementById('cafeteriaPoolList');
        if (!listEl) return;

        const poolKeys = Object.keys(cafeteriaPool);
        if (poolKeys.length === 0) {
            listEl.innerHTML = '<div class="p-6 text-center text-gray-400 font-medium">Pool is empty. Add food above.</div>';
            return;
        }

        const currentSet = selectedFoods[currentCafeteriaTab];
        let html = '';

        poolKeys.sort((a, b) => cafeteriaPool[a].name.localeCompare(cafeteriaPool[b].name)).forEach((id) => {
            const item = cafeteriaPool[id];
            const isChecked = currentSet.has(id);

            html += `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onclick="toggleFoodSelection('${id}')">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300 dark:border-gray-600'}">
                            ${isChecked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>' : ''}
                        </div>
                        <span class="text-base font-semibold text-black dark:text-white ${isChecked ? '' : 'opacity-80'}">${item.name}</span>
                    </div>
                    <button onclick="deleteFoodFromPool('${id}', event)" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }

    window.openCafeteria = () => {
        setCurrentModule('cafeteria');
        const btn = document.getElementById('cafeteriaEditBtn');
        if (btn) {
            btn.classList.toggle('hidden', !(AppModules.User.isTeacher() || AppModules.User.isAdmin()));
        }

        document.getElementById('cafeteriaTodayDate').innerText = getLocalDateString(0);
        document.getElementById('cafeteriaTomorrowDate').innerText = getLocalDateString(1);

        setModuleListener(() => {
            if (cafeteriaListener1) { cafeteriaListener1(); cafeteriaListener1 = null; }
            if (cafeteriaListener2) { cafeteriaListener2(); cafeteriaListener2 = null; }
        });

        AppModules.View.openOverlay('cafeteriaPage', {
            onOpen: loadCafeteriaData,
            zIndex: AppModules.View.CONSTANTS.Z_INDEX.MODULE,
            isExclusive: true
        });
    };

    window.openCafeteriaEdit = () => {
        const todayStr = getLocalDateString(0);
        const tomorrowStr = getLocalDateString(1);

        selectedFoods.today = new Set(cafeteriaMenus[todayStr] || []);
        selectedFoods.tomorrow = new Set(cafeteriaMenus[tomorrowStr] || []);

        window.switchCafeteriaTab('today');

        const sheet = document.getElementById('cafeteriaEditSheet');
        sheet.classList.remove('hidden');
        requestAnimationFrame(() => {
            document.getElementById('cafeteriaEditBackdrop').classList.add('opacity-100');
            document.getElementById('cafeteriaEditContent').classList.remove('translate-y-full');
        });
    };

    window.closeCafeteriaEdit = () => {
        document.getElementById('cafeteriaEditBackdrop').classList.remove('opacity-100');
        document.getElementById('cafeteriaEditContent').classList.add('translate-y-full');
        setTimeout(() => document.getElementById('cafeteriaEditSheet').classList.add('hidden'), 400);
    };

    window.switchCafeteriaTab = (tab) => {
        currentCafeteriaTab = tab;

        const btnToday = document.getElementById('cafeteriaTabToday');
        const btnTomorrow = document.getElementById('cafeteriaTabTomorrow');
        if (tab === 'today') {
            btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
            btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
        } else {
            btnTomorrow.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] rounded-lg shadow-sm text-black dark:text-white transition-all';
            btnToday.className = 'flex-1 text-center text-sm font-medium h-full flex items-center justify-center text-gray-500 rounded-lg transition-all';
        }

        renderCafeteriaEditPool();
    };

    window.toggleFoodSelection = (id) => {
        const currentSet = selectedFoods[currentCafeteriaTab];
        if (currentSet.has(id)) {
            currentSet.delete(id);
        } else {
            currentSet.add(id);
        }
        renderCafeteriaEditPool();
    };

    window.addFoodToPool = async () => {
        const input = document.getElementById('newFoodInput');
        const name = input.value.trim();
        if (!name) return;

        const isDuplicate = Object.values(cafeteriaPool).some((item) => item.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            AppModules.Modal.alert('Notice', 'This food is already in the pool!');
            return;
        }

        const newRef = push(ref(db, 'cafeteria/pool'));
        await set(newRef, { name: name, timestamp: serverTimestamp() });
        input.value = '';
    };

    window.deleteFoodFromPool = async (id, event) => {
        event.stopPropagation();
        const ok = await AppModules.Modal.confirm('Delete Food', 'Are you sure you want to delete this food from the pool?', 'Delete');
        if (!ok) return;
        await set(ref(db, `cafeteria/pool/${id}`), null);

        selectedFoods.today.delete(id);
        selectedFoods.tomorrow.delete(id);
        renderCafeteriaEditPool();
    };

    window.saveCafeteriaMenu = async () => {
        const todayStr = getLocalDateString(0);
        const tomorrowStr = getLocalDateString(1);

        const updates = {};
        updates[`cafeteria/menus/${todayStr}`] = Array.from(selectedFoods.today);
        updates[`cafeteria/menus/${tomorrowStr}`] = Array.from(selectedFoods.tomorrow);

        try {
            await update(ref(db), updates);
            window.closeCafeteriaEdit();
        } catch (e) {
            AppModules.Modal.alert('Error', 'Failed to save menu');
        }
    };
}
