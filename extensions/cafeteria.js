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

    const MENU_SPAN_DAYS = 30;

    let cafeteriaPool = {};
    let cafeteriaMenus = {};
    let editOffset = null;
    let selectedFoodIds = new Set();
    let cafeteriaListener1 = null;
    let cafeteriaListener2 = null;

    function dateForOffset(offset) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + offset);
        return d;
    }

    function monthDay(d) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

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

    function itemNamesForOffset(offset) {
        const ids = cafeteriaMenus[getLocalDateString(offset)] || [];
        return ids.filter((id) => cafeteriaPool[id]).map((id) => cafeteriaPool[id].name);
    }

    function renderCalendar() {
        const grid = document.getElementById('cafeteriaCalendar');
        if (!grid) return;

        const firstDay = dateForOffset(0);
        const lastDay = dateForOffset(MENU_SPAN_DAYS - 1);
        const dow = firstDay.getDay(); // 0 = Sun, 6 = Sat
        // On weekends the whole current week is over: start directly at next Monday.
        const startOffset = dow === 0 ? 1 : (dow === 6 ? 2 : -((dow + 6) % 7));
        const highlightOffset = startOffset < 0 ? 0 : startOffset;

        let html = '';
        // One row per week; columns are Mon..Fri (school days only)
        for (let w = startOffset; w <= MENU_SPAN_DAYS - 1; w += 7) {
            let row = '';
            let cellCount = 0;
            for (let col = 0; col < 5; col++) {
                const offset = w + col;
                const dayDate = dateForOffset(offset);
                if (dayDate > lastDay) break;

                cellCount++;
                const isPast = offset < 0;
                const isHighlighted = offset === highlightOffset;
                const items = isPast ? [] : itemNamesForOffset(offset);

                let cellClass;
                if (isPast) {
                    cellClass = 'bg-white/40 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 opacity-40';
                } else if (isHighlighted) {
                    cellClass = 'bg-white dark:bg-[#24272D] border-2 border-[#0062CC] shadow-md';
                } else {
                    cellClass = 'bg-white dark:bg-[#24272D] border border-gray-100 dark:border-white/5';
                }

                const numClass = isHighlighted
                    ? 'bg-[#0062CC] text-white'
                    : isPast
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-black dark:text-white';

                let body;
                if (isPast) {
                    body = '';
                } else if (items.length > 0) {
                    body = `<div class="mt-2 space-y-2">${items.map((n) => `<div class="text-[17px] leading-snug font-semibold text-black dark:text-white flex items-start gap-1.5"><span class="w-2 h-2 rounded-full bg-[#007AFF] mt-[10px] flex-shrink-0"></span><span class="min-w-0">${escapeHTML(n)}</span></div>`).join('')}</div>`;
                } else {
                    body = '<div class="mt-2 text-[17px] text-gray-300 dark:text-gray-600">—</div>';
                }

                row += `
                    <div class="flex-1 min-w-0 basis-0 min-h-[56px] rounded-xl p-2.5 overflow-hidden ${cellClass}">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-[17px] font-bold ${numClass}">${dayDate.getDate()}</div>
                        ${body}
                    </div>
                `;
            }
            if (cellCount === 0) continue;
            for (let i = cellCount; i < 5; i++) {
                row += '<div class="flex-1 min-w-0 basis-0"></div>';
            }
            html += `<div class="flex gap-2 items-stretch">${row}</div>`;
        }

        grid.innerHTML = html;
    }

    function renderCafeteriaView() {
        renderCalendar();
    }

    function renderCafeteriaEditPool() {
        const listEl = document.getElementById('cafeteriaPoolList');
        if (!listEl || editOffset === null) return;

        const poolKeys = Object.keys(cafeteriaPool);
        if (poolKeys.length === 0) {
            listEl.innerHTML = '<div class="p-6 text-center text-gray-400 font-medium">Pool is empty. Add food above.</div>';
            return;
        }

        let html = '';
        poolKeys.sort((a, b) => cafeteriaPool[a].name.localeCompare(cafeteriaPool[b].name)).forEach((id) => {
            const item = cafeteriaPool[id];
            const isChecked = selectedFoodIds.has(id);

            html += `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onclick="toggleFoodSelection('${id}')">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300 dark:border-gray-600'}">
                            ${isChecked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>' : ''}
                        </div>
                        <span class="text-base font-semibold text-black dark:text-white ${isChecked ? '' : 'opacity-80'}">${escapeHTML(item.name)}</span>
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

        setModuleListener(() => {
            if (cafeteriaListener1) { cafeteriaListener1(); cafeteriaListener1 = null; }
            if (cafeteriaListener2) { cafeteriaListener2(); cafeteriaListener2 = null; }
        });

        AppModules.View.openOverlay('cafeteriaPage', {
            onOpen: () => {
                renderCafeteriaView();
                loadCafeteriaData();
            },
            zIndex: AppModules.View.CONSTANTS.Z_INDEX.MODULE,
            isExclusive: true
        });
    };

    function defaultEditOffset() {
        const dow = new Date().getDay(); // 0 = Sun, 6 = Sat
        // Same rule as the calendar highlight: weekend editing targets next Monday.
        return dow === 0 ? 1 : (dow === 6 ? 2 : 0);
    }

    function offsetOfDateStr(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return Math.round((d - dateForOffset(0)) / 86400000);
    }

    window.openCafeteriaEdit = () => {
        if (!(AppModules.User.isTeacher() || AppModules.User.isAdmin())) return;
        editOffset = defaultEditOffset();
        if (editOffset >= MENU_SPAN_DAYS) return;

        const dateInput = document.getElementById('cafeteriaEditDate');
        if (dateInput) {
            dateInput.min = getLocalDateString(0);
            dateInput.max = getLocalDateString(MENU_SPAN_DAYS - 1);
            dateInput.value = getLocalDateString(editOffset);
        }
        loadEditSelection();

        const sheet = document.getElementById('cafeteriaEditSheet');
        sheet.classList.remove('hidden');
        renderCafeteriaEditPool();
        requestAnimationFrame(() => {
            document.getElementById('cafeteriaEditBackdrop').classList.add('opacity-100');
            document.getElementById('cafeteriaEditContent').classList.remove('translate-y-full');
        });
    };

    function loadEditSelection() {
        selectedFoodIds = new Set(cafeteriaMenus[getLocalDateString(editOffset)] || []);
    }

    window.changeCafeteriaEditDate = () => {
        const dateInput = document.getElementById('cafeteriaEditDate');
        if (!dateInput || !dateInput.value) return;
        const offset = offsetOfDateStr(dateInput.value);
        if (offset < 0 || offset >= MENU_SPAN_DAYS) {
            dateInput.value = getLocalDateString(editOffset);
            return;
        }
        editOffset = offset;
        loadEditSelection();
        renderCafeteriaEditPool();
    };

    window.closeCafeteriaEdit = () => {
        document.getElementById('cafeteriaEditBackdrop').classList.remove('opacity-100');
        document.getElementById('cafeteriaEditContent').classList.add('translate-y-full');
        setTimeout(() => document.getElementById('cafeteriaEditSheet').classList.add('hidden'), 400);
        editOffset = null;
    };

    window.toggleFoodSelection = (id) => {
        if (selectedFoodIds.has(id)) {
            selectedFoodIds.delete(id);
        } else {
            selectedFoodIds.add(id);
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

        try {
            const newRef = push(ref(db, 'cafeteria/pool'));
            await set(newRef, { name: name, timestamp: serverTimestamp() });
            input.value = '';
        } catch (e) {
            console.error('Failed to add food:', e);
            AppModules.Modal.alert('Error', 'Failed to add food: ' + e.message);
        }
    };

    window.deleteFoodFromPool = async (id, event) => {
        event.stopPropagation();
        const ok = await AppModules.Modal.confirm('Delete Food', 'Are you sure you want to delete this food from the pool?', 'Delete');
        if (!ok) return;
        await set(ref(db, `cafeteria/pool/${id}`), null);

        selectedFoodIds.delete(id);
        renderCafeteriaEditPool();
    };

    window.saveCafeteriaMenu = async () => {
        if (editOffset === null) return;
        const dateStr = getLocalDateString(editOffset);

        const updates = {};
        updates[`cafeteria/menus/${dateStr}`] = Array.from(selectedFoodIds);

        try {
            await update(ref(db), updates);
            window.closeCafeteriaEdit();
        } catch (e) {
            AppModules.Modal.alert('Error', 'Failed to save menu');
        }
    };

    const CAFETERIA_AI_PROMPT = `Please convert the cafeteria menu text provided below into a JSON array based on the following rules:

Each element of the array represents ONE day and must contain exactly two keys: "date" and "items".
- "date" must be in YYYY-MM-DD format.
- "items" must be an array of the food name strings served that day.

Copy every food name exactly as written. Do not translate, rephrase, summarize, or omit any item.
Only include days that actually have a menu. Skip weekends unless a menu is listed.

Follow this exact format:

JSON
[
  { "date": "2026-09-21", "items": ["Chicken Teriyaki Bowl", "Steamed Rice", "Garden Salad"] },
  { "date": "2026-09-22", "items": ["Cheese Pizza", "French Fries", "Fruit Cup"] }
]
Here is the original menu text:
（Paste your cafeteria menu / weekly lunch schedule here）`;

    async function processCafeteriaBatchData(raw) {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            AppModules.Modal.alert('Import Error', 'Invalid JSON format.');
            return;
        }
        if (!Array.isArray(data)) {
            AppModules.Modal.alert('Error', 'Data must be an array.');
            return;
        }

        const nameToId = {};
        Object.keys(cafeteriaPool).forEach((id) => {
            const n = (cafeteriaPool[id].name || '').trim().toLowerCase();
            if (n && !nameToId[n]) nameToId[n] = id;
        });

        const updates = {};
        let dayCount = 0;
        let newItemCount = 0;
        const skipped = [];

        data.forEach((entry) => {
            const dateStr = String(entry?.date || '').trim();
            const items = Array.isArray(entry?.items) ? entry.items : [];
            const offset = offsetOfDateStr(dateStr);
            if (!dateStr || Number.isNaN(offset) || offset < 0 || offset >= MENU_SPAN_DAYS) {
                if (dateStr) skipped.push(dateStr);
                return;
            }
            const normDate = getLocalDateString(offset);
            const ids = [];
            items.forEach((rawName) => {
                const name = String(rawName || '').trim();
                if (!name) return;
                const key = name.toLowerCase();
                let id = nameToId[key];
                if (!id) {
                    const newRef = push(ref(db, 'cafeteria/pool'));
                    id = newRef.key;
                    updates[`cafeteria/pool/${id}`] = { name, timestamp: serverTimestamp() };
                    nameToId[key] = id;
                    newItemCount++;
                }
                if (!ids.includes(id)) ids.push(id);
            });
            updates[`cafeteria/menus/${normDate}`] = ids;
            dayCount++;
        });

        if (dayCount === 0) {
            AppModules.Modal.alert('Import Error', `No valid dates found. Dates must be within the next ${MENU_SPAN_DAYS} days (YYYY-MM-DD).`);
            return;
        }

        try {
            await update(ref(db), updates);
            let msg = `Imported ${dayCount} day(s)` + (newItemCount ? ` · ${newItemCount} new food(s) added to pool` : '');
            if (skipped.length) msg += `. Skipped out-of-range: ${skipped.slice(0, 3).join(', ')}${skipped.length > 3 ? '…' : ''}`;
            AppModules.Modal.alert('Success', msg);
            if (editOffset !== null) loadEditSelection();
            renderCafeteriaEditPool();
        } catch (e) {
            AppModules.Modal.alert('Error', 'Failed to import: ' + e.message);
        }
    }

    window.openCafeteriaBatchImport = async () => {
        if (!(AppModules.User.isTeacher() || AppModules.User.isAdmin())) return;

        window.copyCafeteriaPrompt = () => {
            navigator.clipboard.writeText(CAFETERIA_AI_PROMPT).then(() => {
                const btnText = document.getElementById('cafeteriaCopyPromptBtnText');
                const btnIcon = document.getElementById('cafeteriaCopyPromptBtnIcon');
                if (btnText) btnText.innerText = 'Copied!';
                if (btnIcon) btnIcon.innerHTML = '<svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    if (btnText) btnText.innerText = 'Copy Prompt';
                    if (btnIcon) btnIcon.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>';
                }, 2000);
            }).catch((err) => console.error('Failed to copy prompt: ', err));
        };

        const html = `
            <div class="space-y-4 text-left">
                <div class="p-3.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/15 flex flex-col gap-2.5">
                    <div class="flex items-center justify-between border-b border-blue-500/10 pb-2">
                        <span class="text-xs font-bold text-black dark:text-white uppercase tracking-wider">AI Prompt</span>
                        <button onclick="window.copyCafeteriaPrompt()" class="flex items-center gap-1.5 text-xs font-bold text-[#007AFF] hover:opacity-80 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg">
                            <span id="cafeteriaCopyPromptBtnIcon" class="flex items-center">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                                </svg>
                            </span>
                            <span id="cafeteriaCopyPromptBtnText">Copy Prompt</span>
                        </button>
                    </div>
                    <div class="text-[11px] text-gray-500 dark:text-gray-400 font-mono bg-white/50 dark:bg-black/30 p-2.5 rounded-xl border border-gray-200/50 dark:border-gray-800/50 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">${CAFETERIA_AI_PROMPT}</div>
                </div>
                <div class="space-y-2">
                    <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Paste your AI generated array below</p>
                    <textarea id="cafeteriaBatchJsonInput" rows="6" placeholder='[{"date": "2026-09-21", "items": ["Chicken Teriyaki Bowl", "Rice"]}]'
                        class="w-full bg-gray-100 dark:bg-black text-black dark:text-white rounded-2xl px-4 py-3 text-sm font-mono outline-none border border-gray-200 dark:border-gray-800 focus:ring-2 ring-[#007AFF]/20 transition-all"></textarea>
                </div>
            </div>
        `;

        const result = await AppModules.Modal.showCustom('AI Import (Batch Import Menu-JSON)', html, [
            { text: 'Import', value: 'import', primary: true },
            { text: 'Cancel', value: 'cancel', primary: false }
        ]);

        if (result === 'import') {
            const raw = document.getElementById('cafeteriaBatchJsonInput')?.value.trim();
            if (raw) await processCafeteriaBatchData(raw);
        }
    };
}
