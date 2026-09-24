/* Visualizer runtime: knows the contract (code/steps/layout), the mutation
   protocol, and how to drive controls. Lessons are pure data. */

import { renderView, renderMemory, renderHeap, renderMemoryHeap, makeTouched, VIEW_LABELS } from './components.js';

function initState() {
    return { variables: [], heap: [], console: [], exprLog: [], stack: [], extras: null };
}

function applyMutation(state, m, touched) {
    switch (m.type) {
        case 'memory.create': {
            state.variables = state.variables.filter(v => v.name !== m.name);
            state.variables.push({ name: m.name, type: m.dataType, value: m.value, refId: m.refId || null });
            touched.vars.add(m.name);
            break;
        }
        case 'memory.set': {
            const v = state.variables.find(x => x.name === m.name);
            if (v) { v.value = m.value; v.refId = m.refId || null; }
            else state.variables.push({ name: m.name, type: m.dataType || '?', value: m.value, refId: m.refId || null });
            touched.vars.add(m.name);
            break;
        }
        case 'memory.remove':
            state.variables = state.variables.filter(v => v.name !== m.name);
            break;
        case 'heap.create':
            state.heap = state.heap.filter(h => h.objId !== m.objId);
            state.heap.push({ objId: m.objId, className: m.className, fields: m.fields.map(f => ({ ...f })) });
            touched.heap.add(m.objId);
            break;
        case 'heap.set': {
            const h = state.heap.find(x => x.objId === m.objId);
            if (h) {
                const f = h.fields.find(x => x.name === m.field);
                if (f) f.value = m.value; else h.fields.push({ name: m.field, value: m.value });
            }
            touched.heap.add(m.objId);
            break;
        }
        case 'console.print':
            state.console.push(String(m.text));
            touched.console = true;
            break;
        case 'console.append':
            if (state.console.length) state.console[state.console.length - 1] += String(m.text);
            else state.console.push(String(m.text));
            touched.console = true;
            break;
        case 'expression.clear':
            state.exprLog = [];
            break;
        case 'expression.reduce':
            state.exprLog.push({ text: m.text, note: m.note || null });
            touched.expr = true;
            break;
        case 'stack.push':
            state.stack.push({ label: m.label, vars: m.vars || [] });
            touched.stack = true;
            break;
        case 'stack.pop':
            state.stack.pop();
            touched.stack = true;
            break;
        case 'stack.set': {
            const f = state.stack[state.stack.length - 1];
            if (f) {
                const v = f.vars.find(x => x.name === m.name);
                if (v) v.value = m.value; else f.vars.push({ name: m.name, value: m.value });
            }
            touched.stack = true;
            break;
        }
        case 'extra.set':
            state.extras = m.value;
            break;
        default:
            break;
    }
}

function stateAfter(def, count) {
    const state = initState();
    let touched = makeTouched();
    for (let i = 0; i < count; i++) {
        touched = makeTouched();
        (def.steps[i].mutations || []).forEach(m => applyMutation(state, m, touched));
    }
    return { state, touched };
}

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_PATHS = {
    reset: ['M3 4v6h6', 'M3.51 15a9 9 0 1 0 2.13-9.36L3 10'],
    prev: ['M19 12H5', 'M12 19l-7-7 7-7'],
    next: ['M5 12h14', 'M12 5l7 7-7 7'],
    play: ['M8 5v14l11-7z'],
    pause: ['M7 4v16', 'M17 4v16']
};

function svgIcon(kind) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    ICON_PATHS[kind].forEach(d => {
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
        if (kind === 'play') p.setAttribute('fill', 'currentColor');
        svg.appendChild(p);
    });
    return svg;
}

export function mountWorkspace(host, def) {
    host.innerHTML = '';

    if (def.modes && def.modes.length) {
        const wrap = el('div', 'mode-wrap');
        const tabs = el('div', 'mode-tabs');
        const body = el('div', 'mode-body');
        wrap.append(tabs, body);
        host.append(wrap);
        let current = -1;
        function select(i) {
            current = i;
            Array.from(tabs.children).forEach((t, j) => t.classList.toggle('active', j === i));
            mountWorkspace(body, def.modes[i]);
        }
        def.modes.forEach((mode, i) => {
            const t = el('button', 'mode-tab', mode.label);
            t.addEventListener('click', () => { if (i !== current) select(i); });
            tabs.appendChild(t);
        });
        select(0);
        return;
    }

    const work = el('div', 'lab-work');
    const codeCol = el('div', 'work-col');
    const centerCol = el('div', 'work-col');
    const rightCol = el('div', 'work-col work-col-right');
    work.append(codeCol, centerCol, rightCol);

    // Code column (always present)
    const codeCard = el('div', 'work-card');
    codeCard.appendChild(el('div', 'card-label', 'Java Code'));
    const lines = el('div', 'code-lines');
    const codeRows = def.code.split('\n').map(l => l.replace(/\s+$/, '')).filter((l, i, a) => !(l === '' && (i === 0 || i === a.length - 1)));
    const lineEls = codeRows.map((text, i) => {
        const row = el('div', 'code-line');
        row.appendChild(el('span', 'ln', String(i + 1)));
        row.appendChild(el('span', '', text));
        lines.appendChild(row);
        return row;
    });
    codeCard.appendChild(lines);
    codeCol.appendChild(codeCard);

    const layout = def.layout || { center: ['memory'], right: ['console'] };

    function buildViewCol(col, names) {
        col.innerHTML = '';
        names.forEach(name => {
            const card = el('div', 'work-card');
            card.appendChild(el('div', 'card-label', VIEW_LABELS[name] || name));
            const body = el('div');
            card.appendChild(body);
            col.appendChild(card);
            card.__view = name;
            card.__body = body;
        });
    }
    buildViewCol(centerCol, layout.center || []);
    buildViewCol(rightCol, layout.right || []);

    function refreshViews(state, touched) {
        [centerCol, rightCol].forEach(col => {
            Array.from(col.children).forEach(card => {
                card.__body.innerHTML = '';
                renderView(card.__view, card.__body, state, touched);
            });
        });
        // Memory + heap in the same column share one card so arrows can span both.
        [centerCol, rightCol].forEach(col => {
            const memCard = Array.from(col.children).find(c => c.__view === 'memory');
            const heapCard = Array.from(col.children).find(c => c.__view === 'heap');
            if (memCard && heapCard) {
                memCard.querySelector('.card-label').textContent = VIEW_LABELS.heap;
                heapCard.style.display = 'none';
                renderMemoryHeap(memCard.__body, state, touched);
            } else if (memCard) {
                renderMemory(memCard.__body, state, touched);
            } else if (heapCard) {
                renderHeap(heapCard.__body, state, touched, null);
            }
        });
    }

    // remember each column's view names
    centerCol.__names = layout.center || [];
    rightCol.__names = layout.right || [];
    if (!rightCol.__names.length) {
        rightCol.remove();
        work.style.gridTemplateColumns = 'minmax(280px, 1fr) minmax(320px, 1.5fr)';
    }

    // Controls
    const controls = el('div', 'work-controls');
    const btnReset = el('button', 'wbtn', 'Reset');
    const btnPrev = el('button', 'wbtn', 'Previous');
    const btnStep = el('button', 'wbtn primary', 'Next');
    const btnAuto = el('button', 'wbtn', 'Auto Run');
    btnReset.prepend(svgIcon('reset'));
    btnPrev.prepend(svgIcon('prev'));
    btnStep.prepend(svgIcon('next'));
    const total = def.steps.length;
    const progress = el('span', 'w-progress');
    progress.append(el('span', '', 'Step '));
    const progInput = el('input', 'step-jump');
    progInput.type = 'text';
    progInput.inputMode = 'numeric';
    progInput.value = '0';
    progInput.title = 'Type a step number and press Enter';
    const progTotal = el('span', '', '/ ' + total);
    progress.append(progInput, progTotal);
    controls.append(btnReset, btnPrev, btnStep, btnAuto, progress);
    const msg = el('div', 'work-msg');
    const promptBox = buildPromptBox();
    const summaryBox = buildSummaryBox();
    const answers = new Map();
    const dock = makeDock(def, total, answers, (t) => {
        stopAuto();
        idx = Math.max(0, Math.min(total, t));
        render();
    });

    function commitJump() {
        const n = parseInt(progInput.value, 10);
        if (Number.isFinite(n)) {
            stopAuto();
            idx = Math.max(0, Math.min(total, n));
            render();
        } else {
            progInput.value = String(idx);
        }
    }
    progInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { commitJump(); progInput.blur(); }
    });
    progInput.addEventListener('blur', commitJump);

    let idx = 0;
    let timer = null;

    function setAutoLabel(running) {
        btnAuto.textContent = running ? 'Pause' : 'Auto Run';
        btnAuto.prepend(svgIcon(running ? 'pause' : 'play'));
    }
    setAutoLabel(false);

    function stopAuto() {
        if (timer) { clearInterval(timer); timer = null; }
        setAutoLabel(false);
    }

    function render() {
        const { state, touched } = stateAfter(def, idx);
        const step = idx > 0 ? def.steps[idx - 1] : null;
        lineEls.forEach((row, i) => row.classList.toggle('active', step ? i === step.line - 1 : false));
        refreshViews(state, touched);
        if (document.activeElement !== progInput) progInput.value = String(idx);
        progTotal.textContent = '/ ' + total;
        msg.classList.toggle('empty', !step);
        msg.textContent = step ? step.message : (def.intro || 'Press Next to run the code one move at a time.');
        btnPrev.disabled = idx === 0;
        btnStep.disabled = idx >= total;
        if (idx >= total) stopAuto();
        renderPromptInto(promptBox, idx, def, total, answers, render);
        renderSummaryInto(summaryBox, idx, total, def);
        if (dock) dock.__update(idx);
    }

    btnReset.addEventListener('click', () => { stopAuto(); idx = 0; answers.clear(); render(); });
    btnPrev.addEventListener('click', () => { stopAuto(); idx = Math.max(0, idx - 1); render(); });
    btnStep.addEventListener('click', () => { stopAuto(); idx = Math.min(total, idx + 1); render(); });
    btnAuto.addEventListener('click', () => {
        if (timer) { stopAuto(); return; }
        if (idx >= total) idx = 0;
        setAutoLabel(true);
        render();
        timer = setInterval(() => {
            idx = Math.min(total, idx + 1);
            render();
            if (idx >= total) stopAuto();
        }, 1400);
    });

    // Controls live under the code so console/heap growth never moves them.
    codeCol.append(controls, promptBox, msg, summaryBox);
    host.append(work);
    if (dock) host.appendChild(dock);
    render();
}

// Shared educational components: prediction prompt (before a step runs)
// and a final summary (once every step has run). Lessons supply data only.
function buildPromptBox() {
    const box = el('div', 'prompt-box');
    box.style.display = 'none';
    return box;
}

function buildSummaryBox() {
    const box = el('div', 'summary-box');
    box.style.display = 'none';
    return box;
}

function renderPromptInto(box, idx, def, total, answers, onChange) {
    box.innerHTML = '';
    const p = idx < total ? (def.steps[idx].predict || null) : null;
    box.style.display = p ? '' : 'none';
    if (!p) return;
    box.appendChild(el('div', 'prompt-q', 'Predict · ' + p.q));
    const chosen = answers.get(idx);
    const row = el('div', 'prompt-choices');
    p.choices.forEach((c, ci) => {
        const b = el('button', 'prompt-choice', c);
        if (chosen !== undefined) {
            if (ci === p.a) b.classList.add('right');
            if (ci === chosen && chosen !== p.a) b.classList.add('wrong');
        }
        b.addEventListener('click', () => { answers.set(idx, ci); onChange(); });
        row.appendChild(b);
    });
    box.appendChild(row);
    if (chosen !== undefined) {
        const w = p.whyBy ? p.whyBy[chosen]
            : (chosen === p.a ? p.why : 'Not this one. ' + p.why);
        box.appendChild(el('div', 'prompt-why' + (chosen === p.a ? ' ok' : ' no'), w));
    }
    if (chosen !== undefined) {
        box.appendChild(el('div', 'prompt-hint', 'Tap the other options to read why each is right or wrong.'));
    }
}

// Floating jump dock: Question N lands right before that prediction step,
// Key Idea lands on the final step where the summary shows.
function makeDock(def, total, answers, onJump) {
    const items = [];
    let n = 0;
    def.steps.forEach((s, i) => { if (s.predict) items.push({ idx: i, label: 'Question ' + (++n) }); });
    if (def.summary) items.push({ idx: total, label: 'Key Idea' });
    if (!items.length) return null;
    const box = el('div', 'dock');
    const btns = items.map(it => {
        const b = el('button', 'dockbtn', it.label);
        b.addEventListener('click', () => onJump(it.idx));
        box.appendChild(b);
        return b;
    });
    box.__update = (idx) => {
        items.forEach((it, i) => {
            btns[i].classList.toggle('now', idx === it.idx);
            btns[i].classList.toggle('answered', it.idx < total && answers.has(it.idx));
        });
    };
    return box;
}

function renderSummaryInto(box, idx, total, def) {
    box.innerHTML = '';
    const s = idx >= total ? (def.summary || null) : null;
    box.style.display = s ? '' : 'none';
    if (!s) return;
    box.appendChild(el('div', 'card-label', 'Key idea'));
    (Array.isArray(s.idea) ? s.idea : [s.idea]).forEach(line => box.appendChild(el('div', 'sum-line', line)));
    if (s.mistake) {
        box.appendChild(el('div', 'sum-sub', 'Common mistake'));
        box.appendChild(el('div', 'sum-line', s.mistake));
    }
    if (s.transfer) {
        box.appendChild(el('div', 'sum-sub', 'Try to transfer'));
        box.appendChild(el('div', 'sum-line', s.transfer));
    }
}
