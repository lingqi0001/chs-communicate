/* Calculus lesson runtime. Lessons are pure data: params + controls +
   declarative panes + optional conceptual steps. Every step is a param
   snapshot, so replay to any index is deterministic. */

import { evaluate, compileFn, fmt } from './calc-math.js?v=20260925-calc-15';
import { RENDERERS, COLORS } from './calc-components.js?v=20260925-calc-19';

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
    svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    ICON_PATHS[kind].forEach(d => {
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
        if (kind === 'play') p.setAttribute('fill', 'currentColor');
        svg.appendChild(p);
    });
    return svg;
}

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
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
            mountWorkspace(body, Object.assign({}, def.modes[i], { meta: def.meta }));
        }
        def.modes.forEach((mode, i) => {
            const t = el('button', 'mode-tab', mode.label);
            t.addEventListener('click', () => { if (i !== current) select(i); });
            tabs.appendChild(t);
        });
        select(0);
        /* the tab labels are math too, and this row is outside the inner mount's
           host, so it needs its own pass */
        typesetMath(tabs);
        return;
    }

    const answers = new Map();
    const userEdits = {};
    const sliderBindings = new Map();

    /* Steps belong to a case. def.steps may be a flat array (one lesson-wide
       run, the old shape) or a map keyed by the selector value. When it is a
       map, the selector is def.stepKey or the first choice control, and the
       active list is read from params + user edits only, so a step can never
       walk the lesson into another case. */
    const stepKey = def.stepKey
        || ((def.controls || []).find(c => c.kind === 'choice') || {}).key
        || null;
    const stepsAreMap = !Array.isArray(def.steps) && def.steps && typeof def.steps === 'object';
    function caseValue() {
        if (!stepsAreMap || !stepKey) return '_';
        const fromUser = userEdits[stepKey];
        if (fromUser !== undefined) return String(fromUser);
        return String((def.params || {})[stepKey]);
    }
    function caseEntry(cval) {
        if (!stepsAreMap) return def.steps || [];
        return (def.steps && def.steps[cval]) || [];
    }
    function stepsFor(cval) {
        const e = caseEntry(cval);
        return Array.isArray(e) ? e : (e.steps || []);
    }
    function summaryFor() {
        const e = caseEntry(boundCase);
        if (!Array.isArray(e) && e.summary) return e.summary;
        return def.summary || null;
    }
    let boundCase = caseValue();
    let steps = stepsFor(boundCase);
    let total = steps.length;
    function answerKey(kind, i) { return kind + ':' + boundCase + ':' + i; }
    /* A lesson with no intro has nothing to say in state 0, so the walk starts
       at step 1. When step 1 carries a prediction, state 0 is the only place it
       can be asked, so the walk has to start there. */
    function startIdx() {
        return (!def.intro && total > 0 && !(steps[0] && steps[0].predict)) ? 1 : 0;
    }
    function syncCase() {
        const c = caseValue();
        if (c === boundCase) return false;
        boundCase = c;
        steps = stepsFor(c);
        total = steps.length;
        idx = startIdx();
        return true;
    }

    const work = el('div', 'calc-work' + ((def.panes && def.panes.side && def.panes.side.length) ? ' has-side' : ''));
    const mainCol = el('div', 'calc-main');
    const sideCol = el('div', 'calc-side');
    const rail = el('div', 'calc-rail');
    work.append(mainCol);
    if (def.panes && def.panes.side && def.panes.side.length) work.append(sideCol);
    work.append(rail);

    // Rail: step buttons + the step's own narration, then prediction, then summary.
    const controlsBox = el('div', 'calc-controls');
    const stepControls = el('div', 'work-controls');
    const btnReset = el('button', 'wbtn', 'Reset');
    const btnPrev = el('button', 'wbtn', 'Previous');
    const btnStep = el('button', 'wbtn primary', 'Next');
    const btnAuto = el('button', 'wbtn', 'Auto Run');
    btnReset.prepend(svgIcon('reset'));
    btnPrev.prepend(svgIcon('prev'));
    btnStep.prepend(svgIcon('next'));
    const progress = el('span', 'w-progress');
    progress.append(el('span', '', 'Step '));
    const progInput = el('input', 'step-jump');
    progInput.type = 'text'; progInput.inputMode = 'numeric'; progInput.value = '0';
    progInput.title = 'Type a step number and press Enter';
    const progTotal = el('span', '', '/ ' + total);
    progress.append(progInput, progTotal);
    if (total) stepControls.append(btnReset, btnPrev, btnStep, btnAuto, progress);
    else stepControls.appendChild(btnReset);
    controlsBox.appendChild(stepControls);

    const paramBox = el('div', 'calc-params');
    /* the controls that move the picture live with the picture: the strip sits on
       top of the main column, and it is never detached, because taking the
       <input> out of the document mid-drag is what kills native slider gestures */
    mainCol.appendChild(paramBox);

    const promptBox = el('div', 'prompt-box');
    promptBox.style.display = 'none';
    const msg = el('div', 'work-msg');
    const summaryBox = el('div', 'summary-box');
    summaryBox.style.display = 'none';

    rail.append(controlsBox, msg, promptBox);
    if (def.panes && def.panes.afterRail) {
        const after = el('div', 'calc-after');
        rail.appendChild(after);
    }
    rail.appendChild(summaryBox);

    function makePaneEl(pane) {
        const card = el('div', 'work-card calc-pane');
        if (pane.title) card.appendChild(el('div', 'card-label', typeof pane.title === 'function' ? '' : pane.title));
        const body = el('div', 'calc-pane-body');
        card.appendChild(body);
        return { card, body, pane };
    }

    let idx = startIdx();
    let timer = null;

    /* moving across a step that presets a key hands that key back to the
       lesson; keys no step touches keep whatever the user dragged them to */
    function setIdx(to) {
        const next = Math.max(startIdx(), Math.min(total, to));
        if (next === idx) return;
        const a = Math.min(idx, next), b = Math.max(idx, next);
        for (let i = a; i < b; i++) {
            Object.keys(steps[i].params || {}).forEach(k => { delete userEdits[k]; });
        }
        idx = next;
    }

    function envNow() {
        const env = Object.assign({}, def.params);
        for (let i = 0; i < idx; i++) {
            const p = Object.assign({}, steps[i].params || {});
            /* a step can never move the lesson to another case */
            if (stepsAreMap) delete p[stepKey];
            Object.assign(env, p);
        }
        Object.assign(env, userEdits);
        if (def.fns) {
            Object.keys(def.fns).forEach(name => {
                const src = def.fns[name];
                if (typeof src === 'function') env[name] = (x) => src(x, env);
                else {
                    const compiled = compileFn(src, 'x');
                    env[name] = (x) => compiled(x, env);
                }
            });
        }
        if (def.compute) Object.assign(env, def.compute(env));
        return env;
    }

    const ctx = {
        setParam(key, value) { userEdits[key] = value; },
        render() { render(); },
        dragFrame(key, value) {
            /* panes re-read envNow(), so compiled fns and compute land on the
               value being dragged instead of a stale snapshot */
            userEdits[key] = value;
            renderPanesInto(mainCol, (def.panes && def.panes.main) || []);
            if (sideCol.parentNode) renderPanesInto(sideCol, (def.panes && def.panes.side) || []);
            typesetMath(mainCol);
            if (sideCol.parentNode) typesetMath(sideCol);
            const b = sliderBindings.get(key);
            if (b && b.input !== document.activeElement) {
                b.input.value = value;
                b.valSpan.textContent = fmt(value, b.c.showDigits === undefined ? 2 : b.c.showDigits) + (b.c.unit || '');
            }
        },
        answer(k) { return answers.get(answerKey(k, '')); },
        setAnswer(k, v) { answers.set(answerKey(k, ''), v); },
        fmt
    };

    function renderPanesInto(stackEl, list) {
        if (stackEl === mainCol) {
            /* clear the cards only, never the param strip sitting above them */
            Array.from(stackEl.children).forEach(c => { if (c !== paramBox) stackEl.removeChild(c); });
        } else {
            stackEl.innerHTML = '';
        }
        const env = envNow();
        list.forEach(pane => {
            if (pane.when && !truthy(pane.when, env)) return;
            const { card, body } = makePaneEl(pane);
            stackEl.appendChild(card);
            const renderer = RENDERERS[pane.kind];
            if (!renderer) { body.textContent = 'Unknown pane: ' + pane.kind; return; }
            try {
                renderer(pane, env, body, ctx);
            } catch (err) {
                body.textContent = 'Render error: ' + err.message;
            }
            if (pane.title && typeof pane.title === 'function') {
                card.querySelector('.card-label').textContent = pane.title(env);
            }
        });
    }

    function truthy(when, env) {
        return typeof when === 'function' ? Boolean(when(env)) : evaluate(String(when), env);
    }

    function renderControls() {
        paramBox.innerHTML = '';
        const env = envNow();
        (def.controls || []).forEach(c => {
            if (c.when && !truthy(c.when, env)) return;
            const row = el('div', 'cv-ctl' + (c.kind === 'choice' ? ' choice' : ''));
            if (c.kind === 'choice') {
                const head = el('div', 'cv-ctl-label', c.label ? String(c.label) : '');
                row.appendChild(head);
                const opts = el('div', 'cv-ctl-opts');
                c.options.forEach(op => {
                    const val = op.v !== undefined ? op.v : op;
                    const label = op.label !== undefined ? op.label : String(op);
                    const b = el('button', 'mode-tab' + (env[c.key] === val ? ' active' : ''), label);
                    b.addEventListener('click', () => { ctx.setParam(c.key, val); render(); });
                    opts.appendChild(b);
                });
                row.appendChild(opts);
            } else {
                const head = el('div', 'cv-ctl-label');
                head.appendChild(document.createTextNode(c.label ? String(c.label) + ' = ' : ''));
                const valSpan = el('span', 'cv-ctl-val', fmt(env[c.key], c.showDigits === undefined ? 2 : c.showDigits) + (c.unit || ''));
                head.appendChild(valSpan);
                row.appendChild(head);
                if (!c.fixed) {
                    const input = el('input', 'cv-slider');
                    input.type = 'range';
                    input.min = c.min; input.max = c.max; input.step = c.step || (c.max - c.min) / 200;
                    input.value = env[c.key];
                    input.addEventListener('input', () => {
                        /* light redraw: a full render() rebuilds this very input
                           and kills the native drag after one notch */
                        ctx.dragFrame(c.key, parseFloat(input.value));
                        valSpan.textContent = fmt(parseFloat(input.value), c.showDigits === undefined ? 2 : c.showDigits) + (c.unit || '');
                    });
                    input.addEventListener('change', () => { render(); });
                    row.appendChild(input);
                    sliderBindings.set(c.key, { input, valSpan, c });
                }
            }
            paramBox.appendChild(row);
        });
    }

    function renderPrompt() {
        promptBox.innerHTML = '';
        const p = idx < total ? (steps[idx].predict || null) : null;
        promptBox.style.display = p ? '' : 'none';
        if (!p) return;
        const env = envNow();
        promptBox.appendChild(el('div', 'prompt-q', 'Predict · ' + (typeof p.q === 'function' ? p.q(env) : p.q)));
        const chosen = answers.get(answerKey('predict', idx));
        const row = el('div', 'prompt-choices');
        p.choices.forEach((c, ci) => {
            const b = el('button', 'prompt-choice', typeof c === 'string' ? c : c);
            if (chosen !== undefined) {
                if (ci === p.a) b.classList.add('right');
                if (ci === chosen && chosen !== p.a) b.classList.add('wrong');
            }
            b.addEventListener('click', () => { answers.set(answerKey('predict', idx), ci); render(); });
            row.appendChild(b);
        });
        promptBox.appendChild(row);
        if (chosen !== undefined) {
            const why = p.whyBy ? p.whyBy[chosen] : (chosen === p.a ? p.why : 'Not this one. ' + p.why);
            promptBox.appendChild(el('div', 'prompt-why' + (chosen === p.a ? ' ok' : ' no'), why));
            promptBox.appendChild(el('div', 'prompt-hint', 'Tap the other options to read why each is right or wrong.'));
        }
    }

    let dock = null;
    function buildDock() {
        if (dock && dock.parentNode) dock.parentNode.removeChild(dock);
        dock = makeDock(steps, total, summaryFor(), answers, answerKey, (t) => { stopAuto(); setIdx(t); render(); });
        if (!dock) return;
        /* a lesson with tabs has a free row above the workspace: the tabs sit on
           the left and the jump row rides at the right end of that same row */
        const siblings = host.parentElement ? Array.from(host.parentElement.children) : [];
        const tabs = siblings.find(c => c.className === 'mode-tabs');
        if (tabs) {
            /* every tab click runs a fresh inner mount, and that closure cannot see
               the dock the previous mount left in this row, so clear the row first */
            tabs.querySelectorAll('.dock').forEach(n => tabs.removeChild(n));
            tabs.appendChild(dock);
        }
        else host.prepend(dock);
    }

    function renderSummary() {
        summaryBox.innerHTML = '';
        const show = total === 0 || idx >= total;
        const s = show ? summaryFor() : null;
        summaryBox.style.display = s ? '' : 'none';
        if (!s) return;
        const env = envNow();
        summaryBox.appendChild(el('div', 'card-label', 'Key idea'));
        (Array.isArray(s.idea) ? s.idea : [s.idea]).forEach(line =>
            summaryBox.appendChild(el('div', 'sum-line', typeof line === 'function' ? line(env) : line)));
        if (s.mistake) {
            summaryBox.appendChild(el('div', 'sum-sub', 'Common mistake'));
            summaryBox.appendChild(el('div', 'sum-line', s.mistake));
        }
        if (s.transfer) {
            summaryBox.appendChild(el('div', 'sum-sub', 'Try to transfer'));
            summaryBox.appendChild(el('div', 'sum-line', s.transfer));
        }
    }

    function commitJump() {
        const n = parseInt(progInput.value, 10);
        if (Number.isFinite(n)) { stopAuto(); setIdx(n); render(); }
        else progInput.value = String(idx);
    }
    progInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commitJump(); progInput.blur(); } });
    progInput.addEventListener('blur', commitJump);

    function setAutoLabel(running) {
        btnAuto.textContent = running ? 'Pause' : 'Auto Run';
        btnAuto.prepend(svgIcon(running ? 'pause' : 'play'));
    }
    function stopAuto() {
        if (timer) { clearInterval(timer); timer = null; }
        setAutoLabel(false);
    }

    function render() {
        if (syncCase()) buildDock();
        renderPanesInto(mainCol, (def.panes && def.panes.main) || []);
        if (sideCol.parentNode) renderPanesInto(sideCol, (def.panes && def.panes.side) || []);
        renderControls();
        const env = envNow();
        const step = idx > 0 ? steps[idx - 1] : null;
        msg.textContent = step ? (typeof step.message === 'function' ? step.message(env) : step.message)
            : (def.intro ? (typeof def.intro === 'function' ? def.intro(env) : def.intro) : 'Use the controls to explore.');
        msg.classList.toggle('empty', !step && idx === 0);
        if (total) {
            if (document.activeElement !== progInput) progInput.value = String(idx);
            progTotal.textContent = '/ ' + total;
            btnPrev.disabled = idx <= startIdx();
            btnStep.disabled = idx >= total;
        }
        renderPrompt();
        renderSummary();
        typesetMath(host);
        if (dock) dock.__update(idx);
    }

    btnReset.addEventListener('click', () => { mountWorkspace(host, def); });
    btnPrev.addEventListener('click', () => { stopAuto(); setIdx(idx - 1); render(); });
    btnStep.addEventListener('click', () => { stopAuto(); setIdx(idx + 1); render(); });
    btnAuto.addEventListener('click', () => {
        if (timer) { stopAuto(); return; }
        if (idx >= total) setIdx(0);
        setAutoLabel(true);
        timer = setInterval(() => {
            if (idx < total && steps[idx].predict && !answers.has(answerKey('predict', idx))) {
                render();
                stopAuto();
                return;
            }
            setIdx(idx + 1);
            render();
            if (idx >= total) stopAuto();
        }, 2200);
        render();
    });

    host.append(work);
    buildDock();
    render();
}

/* ---------- math typography ----------
   One pass over the rendered lesson turns `A / B` into a stacked fraction and
   `lim x→a` into lim with its subscript, so lesson copy stays plain text. A
   slash stays inline when both sides are letters (dy/dt, L/min) or both are
   numbers (0/0, 1/3). SVG is skipped: graph labels are measured geometry. */

const MATH_OP = /[A-Za-z0-9²³ˣ′]/;
/* Only a named function may join the operand across a space. Without this the
   scan eats the prose around it: "gives 0/0" would become a fraction. */
const MATH_FN = /^(sin|cos|tan|sec|csc|cot|ln|log|exp|arcsin|arccos|arctan)$/;
/* Both sides looking like a unit or a Leibniz rate (cm²/s, dy/dt) or a bare
   number pair (0/0, 1/3) stays on the line. */
const MATH_INLINE = [/^[A-Za-z]{1,4}(²|³)?$/, /^[0-9]{1,3}$/];

function mathWordBack(s, j) {
    let end = j + 1;
    while (j >= 0 && MATH_OP.test(s[j])) j--;
    let start = j + 1;
    if (j >= 1 && s[j] === ' ') {
        let k = j - 1;
        while (k >= 0 && MATH_OP.test(s[k])) k--;
        if (MATH_FN.test(s.slice(k + 1, j))) start = k + 1;
    }
    return { start, text: s.slice(start, end) };
}
function mathWordFwd(s, j) {
    let i = j;
    while (i < s.length && MATH_OP.test(s[i])) i++;
    let end = i;
    if (s[i] === ' ') {
        let k = i + 1;
        while (k < s.length && MATH_OP.test(s[k])) k++;
        if (MATH_FN.test(s.slice(i + 1, k))) end = k;
    }
    return { end, text: s.slice(j, end) };
}
function mathGroupBack(s, closeAt) {
    let depth = 0;
    for (let j = closeAt; j >= 0; j--) {
        if (s[j] === ')') depth++;
        else if (s[j] === '(' && --depth === 0) return j;
    }
    return -1;
}
function mathGroupFwd(s, openAt) {
    let depth = 0;
    for (let j = openAt; j < s.length; j++) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')' && --depth === 0) return j;
    }
    return -1;
}
function mathFractionAt(s, slash) {
    let a = slash - 1, b = slash + 1;
    if (s[a] === ' ') a--;
    if (s[b] === ' ') b++;
    let num, den;
    if (s[a] === ')') { const st = mathGroupBack(s, a); if (st < 0) return null; num = { start: st, text: s.slice(st, a + 1) }; }
    else num = mathWordBack(s, a);
    if (s[b] === '(') { const en = mathGroupFwd(s, b); if (en < 0) return null; den = { end: en + 1, text: s.slice(b, en + 1) }; }
    else den = mathWordFwd(s, b);
    if (!num.text || !den.text) return null;
    if (MATH_INLINE.some(re => re.test(num.text) && re.test(den.text))) return null;
    return { start: num.start, end: den.end, num: num.text, den: den.text };
}
function mathSpan(cls, text) {
    const n = document.createElement('span');
    n.className = cls;
    n.textContent = text;
    return n;
}
function mathFracNode(num, den) {
    const f = document.createElement('span');
    f.className = 'mfrac';
    f.append(mathSpan('mnum', num), mathSpan('mden', den));
    return f;
}
function mathLimNode(sub) {
    const w = document.createElement('span');
    w.className = 'mlim';
    w.append(mathSpan('mlim-word', 'lim'), mathSpan('msub', sub));
    return w;
}
function mathPieces(s) {
    const out = [];
    let seg = 0, i = 0, hit = false;
    const text = (from, to) => { if (to > from) out.push(s.slice(from, to)); };
    while (i < s.length) {
        if (s[i] === '/') {
            const f = mathFractionAt(s, i);
            if (f) { hit = true; text(seg, f.start); out.push(mathFracNode(f.num, f.den)); i = seg = f.end; continue; }
        }
        if (s.startsWith('lim ', i)) {
            const m = /^lim ([a-zA-Z])→(\S+)/.exec(s.slice(i));
            if (m) { hit = true; text(seg, i); out.push(mathLimNode(m[1] + '→' + m[2])); i = seg = i + m[0].length; continue; }
        }
        i++;
    }
    if (!hit) return null;
    text(seg, s.length);
    return out;
}
function typesetMath(root) {
    if (!root || typeof document.createTreeWalker !== 'function') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            const v = n.nodeValue || '';
            if (v.indexOf('/') < 0 && v.indexOf('lim ') < 0) return NodeFilter.FILTER_REJECT;
            const p = n.parentElement;
            if (!p || p.closest('svg') || p.closest('.cv-ro-unit, .cv-ctl-val, .mnum, .mden')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    hits.forEach(node => {
        const pieces = mathPieces(node.nodeValue);
        if (!pieces) return;
        const frag = document.createDocumentFragment();
        pieces.forEach(p => frag.appendChild(typeof p === 'string' ? document.createTextNode(p) : p));
        node.parentNode.replaceChild(frag, node);
    });
}

function makeDock(steps, total, summary, answers, answerKey, onJump) {
    const items = [];
    let n = 0;
    steps.forEach((s, i) => { if (s.predict) items.push({ idx: i, label: 'Question ' + (++n) }); });
    if (summary && total) items.push({ idx: total, label: 'Key Idea' });
    if (!items.length) return null;
    const box = el('div', 'dock');
    const bar = el('div', 'dock-bar');
    box.appendChild(bar);
    const btns = items.map(it => {
        const b = el('button', 'dockbtn', it.label);
        b.addEventListener('click', () => onJump(it.idx));
        bar.appendChild(b);
        return b;
    });
    box.__update = (idx) => {
        items.forEach((it, i) => {
            btns[i].classList.toggle('now', idx === it.idx);
            btns[i].classList.toggle('answered', it.idx < total && answers.has(answerKey('predict', it.idx)));
        });
    };
    return box;
}
