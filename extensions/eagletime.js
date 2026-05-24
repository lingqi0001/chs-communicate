export function initEagleTimeFeature(ctx) {
    const {
        db,
        ref,
        onValue,
        update,
        set,
        push,
        serverTimestamp,
        fetchUser,
        escapeHTML,
        AppModules,
        getCurrentUser,
        getCurrentModule,
        setCurrentModule,
        getAllUsers,
        getAdminEmail
    } = ctx;

    const safeEscape = (value) => escapeHTML ? escapeHTML(value) : String(value ?? '');

    function renderEagleTime() {
        const container = document.getElementById('eagleTimeContent');
        const studentPassContainer = document.getElementById('studentPassContainer');

        onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
            const sessions = snapshot.val() || {};
            const sessionList = Object.keys(sessions).map(id => ({ id, ...sessions[id] }));
            const currentUser = getCurrentUser();

            let joinedSession = null;
            sessionList.forEach((s) => {
                if (currentUser && s.students && s.students[currentUser.id]) joinedSession = s;
            });

            if (joinedSession) {
                container.classList.add('hidden');
                studentPassContainer.classList.remove('hidden');
                renderStudentPass(joinedSession);
            } else {
                container.classList.remove('hidden');
                studentPassContainer.classList.add('hidden');
                renderSessionList(sessionList);
            }
        });
    }

    async function renderSessionList(sessions) {
        const container = document.getElementById('sessionListContainer');
        if (sessions.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 mt-20">No Eagle Time sessions available.</div>';
            return;
        }

        let cols = 1;
        const w = window.innerWidth;
        if (w >= 1536) cols = 4;
        else if (w >= 1280) cols = 3;
        else if (w >= 768) cols = 2;

        const columns = Array.from({ length: cols }, () => []);
        sessions.forEach((s, i) => columns[i % cols].push(s));

        const html = await Promise.all(columns.map(async (colSessions) => {
            if (colSessions.length === 0) return '';
            const cards = await Promise.all(colSessions.map(async (s) => {
                const studentCount = Object.keys(s.students || {}).length;
                const teacher = await fetchUser(s.teacherId);
                const teacherName = teacher?.name || 'Unknown Teacher';
                const currentUser = getCurrentUser();

                const studentsHtml = await Promise.all(Object.keys(s.students || {}).map(async (uid) => {
                    const u = await fetchUser(uid);
                    return `<div class="text-[13px] text-gray-600 dark:text-gray-400 flex justify-between gap-2"><span>${safeEscape(u?.name || uid)}</span></div>`;
                }));

                return `
                    <div class="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                        <div class="flex justify-between items-start">
                            <div class="min-w-0">
                                <h4 class="font-bold text-base text-black dark:text-white truncate">${safeEscape(s.title)}</h4>
                                <p class="text-sm text-gray-500 truncate">${safeEscape(teacherName)} Room ${safeEscape(s.room)}</p>
                            </div>
                            <span class="bg-blue-100 dark:bg-blue-500/20 text-[#007AFF] text-xs font-bold px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                                ${studentCount} Joined
                            </span>
                        </div>
                        <button onclick="joinEagleSession('${s.id}')"
                            class="w-full bg-[#007AFF] text-white py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                            Join Session
                        </button>
                        ${(AppModules.User.isAdmin() || (currentUser && currentUser.id === s.teacherId)) ? `
                            <div class="pt-2 border-t border-gray-100 dark:border-white/5">
                                <p class="text-xs font-bold text-gray-400 uppercase mb-2">Roster</p>
                                <div class="space-y-1 max-h-32 overflow-y-auto">
                                    ${studentsHtml.join('') || '<p class="text-xs text-gray-400 italic">No students.</p>'}
                                </div>
                                <button onclick="deleteEagleSession('${s.id}')" class="mt-3 text-red-500 text-sm font-bold">Delete Session</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }));
            return `<div class="flex-1 flex flex-col gap-4 min-w-0">${cards.join('')}</div>`;
        }));

        const finalHtml = `<div class="flex flex-wrap md:flex-nowrap gap-4 items-start w-full mx-auto max-w-[1200px]">${html.join('')}</div>`;
        container.innerHTML = finalHtml;
    }

    async function renderStudentPass(session) {
        const container = document.getElementById('studentPassContainer');
        const teacher = await fetchUser(session.teacherId);
        const currentUser = getCurrentUser();
        container.innerHTML = `
            <div class="w-full max-w-[400px] mx-auto">
                <div class="pass-gradient p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden space-y-6">
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mb-1">Digital Hall Pass</p>
                            <h2 class="text-3xl font-black tracking-tight leading-tight">EAGLE TIME</h2>
                        </div>
                    </div>
                    <div class="space-y-4 pt-4 border-t border-white/20 relative z-10">
                        <div class="flex justify-between">
                            <div>
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Student</p>
                                <p class="font-bold text-lg">${safeEscape(currentUser?.name || '')}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Room</p>
                                <p class="font-bold text-lg">${safeEscape(session.room)}</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Course / Enrichment</p>
                            <p class="font-bold text-lg">${safeEscape(session.title)}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Teacher</p>
                            <p class="font-bold text-lg">${safeEscape(teacher?.name || 'Unknown')}</p>
                        </div>
                    </div>
                    <div class="ticket-cutout my-2 border-t-2 border-dashed border-white/30 relative z-10"></div>
                    <div class="pt-2 text-center relative z-10">
                        <div class="inline-block bg-white text-[#007AFF] px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase shadow-lg">
                            Active Pass
                        </div>
                        <p class="mt-4 text-[11px] opacity-70 font-medium">Valid for enrichment period only</p>
                    </div>
                    <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div class="absolute -top-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                </div>
                <button onclick="leaveEagleSession('${session.id}')"
                    class="w-full mt-6 bg-white dark:bg-[#1C1C1E] text-red-500 py-3 rounded-2xl font-bold text-base shadow-sm active:scale-95 transition-transform border border-red-100 dark:border-red-900/30">
                    Cancel Registration
                </button>
            </div>
        `;
    }

    window.openEagleTime = () => {
        setCurrentModule('eagle_time');
        const btn = document.getElementById('eagleAddBtn');
        if (btn) btn.classList.toggle('hidden', !(AppModules.User.isTeacher() || AppModules.User.isAdmin()));
        AppModules.View.openOverlay('eagleTimePage', { onOpen: renderEagleTime, zIndex: AppModules.View.CONSTANTS.Z_INDEX.EAGLE_TIME, isExclusive: true });
    };

    window.closeEagleTime = () => {
        AppModules.View.closeOverlay('eagleTimePage', {
            onClose: () => {
                setCurrentModule(null);
            }
        });
    };

    window.joinEagleSession = async (sessionId) => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        try {
            await update(ref(db, `eagle_time/sessions/${sessionId}/students`), { [currentUser.id]: true });
            AppModules.Modal.alert("Success", "Successfully joined Eagle Time session!");
        } catch (e) {
            AppModules.Modal.alert("Error", "Failed to join: " + e.message);
        }
    };

    window.leaveEagleSession = async (sessionId) => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        if (!await AppModules.Modal.confirm("Cancel Registration", "Are you sure you want to cancel your registration?", "Leave")) return;
        try {
            await set(ref(db, `eagle_time/sessions/${sessionId}/students/${currentUser.id}`), null);
        } catch (e) {
            AppModules.Modal.alert("Error", "Failed to leave: " + e.message);
        }
    };

    window.openCreateEagleForm = async () => {
        const form = document.getElementById('eagleCreateForm');
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const select = document.getElementById('eagleTeacherSelect');
        select.innerHTML = '<option value="">Select Teacher</option>';
        const allUsers = getAllUsers() || {};
        for (const uid in allUsers) {
            const u = allUsers[uid];
            if (u.email && (u.email.endsWith('@hcpss.org') || u.email === getAdminEmail())) {
                const opt = document.createElement('option');
                opt.value = uid;
                opt.innerText = u.name;
                select.appendChild(opt);
            }
        }
    };

    window.submitEagleSession = async () => {
        const title = document.getElementById('eagleTitleInput').value.trim();
        const room = document.getElementById('eagleRoomInput').value.trim();
        const teacherId = document.getElementById('eagleTeacherSelect').value;

        if (!title || !room || !teacherId) return AppModules.Modal.alert("Required", "Please fill all fields");

        try {
            const newRef = push(ref(db, 'eagle_time/sessions'));
            await set(newRef, { title, room, teacherId, timestamp: serverTimestamp(), students: {} });
            document.getElementById('eagleCreateForm').classList.add('hidden');
            document.getElementById('eagleTitleInput').value = '';
            document.getElementById('eagleRoomInput').value = '';
            AppModules.Modal.alert("Success", "Session created successfully!");
        } catch (e) {
            AppModules.Modal.alert("Error", "Failed to create: " + e.message);
        }
    };

    window.deleteEagleSession = async (id) => {
        if (!await AppModules.Modal.confirm("Delete Session", "Delete this session and all its registrations?", "Delete")) return;
        await set(ref(db, `eagle_time/sessions/${id}`), null);
    };

    window.addEventListener('resize', () => {
        if (getCurrentModule() === 'eagle_time') {
            const eaglePage = document.getElementById('eagleTimePage');
            if (eaglePage && !eaglePage.classList.contains('hidden')) {
                onValue(ref(db, 'eagle_time/sessions'), (snapshot) => {
                    const sessions = snapshot.val() || {};
                    renderSessionList(Object.keys(sessions).map(id => ({ id, ...sessions[id] })));
                }, { onlyOnce: true });
            }
        }
    });
}
