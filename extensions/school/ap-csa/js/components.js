/* Shared visual components. Each renderer owns its DOM; lesson files never
   touch the page. renderView(name, ...) is the single entry the runtime uses. */

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

function renderMemory(container, state, touched) {
    container.appendChild(el('div', 'mh-title', 'Variables (stack)'));
    const grid = el('div', 'mem-grid');
    if (!state.variables.length) grid.appendChild(el('div', 'stack-empty', 'No variables yet.'));
    state.variables.forEach(v => {
        const box = el('div', 'mem-box' + (touched.vars.has(v.name) ? ' pulse' : ''));
        box.dataset.memName = v.name;
        box.appendChild(el('div', 'mem-name', v.name));
        box.appendChild(el('div', 'mem-type', v.type));
        const val = el('div', 'mem-val');
        if (v.refId) {
            const chip = el('span', 'ref-chip');
            chip.appendChild(el('span', 'ref-dot'));
            chip.appendChild(el('span', '', '#' + v.refId));
            val.appendChild(chip);
        } else {
            val.textContent = v.value;
        }
        box.appendChild(val);
        grid.appendChild(box);
    });
    container.appendChild(grid);
}

function renderHeap(container, state, touched, heading) {
    if (heading) container.appendChild(el('div', 'mh-title', heading));
    state.heap.forEach(h => {
        const box = el('div', 'heap-box' + (touched.heap.has(h.objId) ? ' pulse' : ''));
        box.dataset.objId = h.objId;
        const head = el('div', 'heap-head');
        head.appendChild(el('span', '', h.className));
        head.appendChild(el('span', 'heap-id', '#' + h.objId));
        box.appendChild(head);
        h.fields.forEach(f => {
            const row = el('div', 'heap-field');
            row.appendChild(el('span', 'f-name', f.name));
            row.appendChild(el('span', 'f-val', f.value));
            box.appendChild(row);
        });
        container.appendChild(box);
    });
}

function drawRefArrows(wrap) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ref-svg');
    const base = wrap.getBoundingClientRect();
    wrap.querySelectorAll('[data-mem-name]').forEach(varBox => {
        const v = varBox.__refTarget;
        if (!v) return;
        const heapBox = wrap.querySelector('[data-obj-id="' + v.refId + '"]');
        if (!heapBox) return;
        const a = varBox.querySelector('.mem-val').getBoundingClientRect();
        const b = heapBox.getBoundingClientRect();
        const x1 = a.right - base.left, y1 = a.top + a.height / 2 - base.top;
        const x2 = b.left - base.left, y2 = b.top + Math.min(18, b.height / 2) - base.top;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mid = Math.max(24, (x2 - x1) / 2);
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + mid) + ' ' + y1 + ', ' + (x2 - mid) + ' ' + y2 + ', ' + (x2 - 4) + ' ' + y2);
        svg.appendChild(path);
    });
    wrap.appendChild(svg);
}

function renderMemoryHeap(container, state, touched) {
    const wrap = el('div', 'mh-wrap');
    const left = el('div', 'mh-col');
    renderMemory(left, state, touched);
    const right = el('div', 'mh-col mh-col-heap');
    if (state.heap.length) {
        renderHeap(right, state, touched, 'Objects (heap)');
    } else {
        right.appendChild(el('div', 'mh-title', 'Objects (heap)'));
        right.appendChild(el('div', 'stack-empty', 'No objects yet.'));
    }
    wrap.appendChild(left);
    wrap.appendChild(right);
    container.appendChild(wrap);
    state.variables.forEach(v => {
        if (!v.refId) return;
        const box = left.querySelector('[data-mem-name="' + CSS.escape(v.name) + '"]');
        if (box) box.__refTarget = v;
    });
    requestAnimationFrame(() => drawRefArrows(wrap));
}

function renderExpression(container, state, touched) {
    if (!state.exprLog.length) {
        container.appendChild(el('div', 'stack-empty', 'Nothing evaluated yet.'));
        return;
    }
    const chain = el('div', 'expr-chain');
    const shown = state.exprLog.slice(-6);
    const offset = state.exprLog.length - shown.length;
    shown.forEach((e, i) => {
        if (i > 0) chain.appendChild(el('div', 'expr-arrow', '▼'));
        const isLast = i === shown.length - 1;
        const step = el('div', 'expr-step' + (isLast && touched.expr ? ' current' : ''), e.text);
        chain.appendChild(step);
        if (e.note) chain.appendChild(el('div', 'expr-note', e.note));
    });
    container.appendChild(chain);
}

function renderConsole(container, state) {
    const box = el('div', 'console-box');
    if (!state.console.length) {
        box.appendChild(el('span', 'console-caret'));
    } else {
        state.console.forEach(line => box.appendChild(el('div', 'out-line', line)));
        const last = box.lastChild;
        const caret = el('span', 'console-caret');
        caret.style.marginLeft = '2px';
        last.appendChild(caret);
    }
    container.appendChild(box);
}

function renderStack(container, state, touched) {
    const wrap = el('div', 'stack-wrap');
    if (!state.stack.length) {
        wrap.appendChild(el('div', 'stack-empty', 'Call stack empty. main() is the only frame.'));
    }
    state.stack.forEach((f, i) => {
        const frame = el('div', 'stack-frame' + (i === state.stack.length - 1 ? ' top' : ''));
        frame.appendChild(el('div', 'stack-label', f.label));
        (f.vars || []).forEach(v => {
            const row = el('div', 'stack-var');
            row.appendChild(el('span', 'sv-name', v.name));
            row.appendChild(el('span', 'sv-val', v.value));
            frame.appendChild(row);
        });
        wrap.appendChild(frame);
    });
    container.appendChild(wrap);
}

function flowNodeEl(node, visited, active, depth, struck, showLevels) {
    depth = depth || 0;
    const wrap = el('div', 'flow-branch');
    const on = visited.has(node.id);
    const isStruck = struck && struck.has(node.id);
    const branches = !!(node.children && node.children.length > 1);
    const box = el('div', 'flow-node' + (on ? ' on' : ' dim') + (node.id === active ? ' active' : '') + (isStruck ? ' struck' : '') + (node.backTo ? ' loopback' : ''));
    if (showLevels && branches) box.appendChild(el('span', 'flow-lvl', 'L' + (depth + 1)));
    box.appendChild(document.createTextNode(node.text));
    wrap.appendChild(box);
    if (node.backTo) wrap.appendChild(el('div', 'flow-back-note', 'returns control to: ' + node.backTo));
    if (node.children && node.children.length) {
        const kids = el('div', 'flow-kids');
        node.children.forEach(ch => {
            const col = el('div', 'flow-kid');
            if (ch.label) col.appendChild(el('div', 'flow-elabel' + (visited.has(ch.node.id) ? ' on' : ''), ch.label));
            col.appendChild(flowNodeEl(ch.node, visited, active, depth + (branches ? 1 : 0), struck, showLevels));
            kids.appendChild(col);
        });
        wrap.appendChild(kids);
    }
    return wrap;
}

function boolCard(side) {
    const card = el('div', 'bool-card' + (side.state === 'skipped' ? ' skipped' : ''));
    card.appendChild(el('div', 'bool-text', side.text));
    if (side.state === 'skipped') {
        card.appendChild(el('div', 'bool-skipped', 'NOT EVALUATED'));
    } else if (side.value !== undefined && side.value !== '') {
        card.appendChild(el('div', 'bool-value', side.value));
    }
    return card;
}

// ---------- Mini Java-expression evaluator (shared by interactive widgets) ----------
function parseMini(src) {
    const tokens = src.match(/\|\||&&|<=|>=|==|!=|[A-Za-z_][A-Za-z0-9_]*|\d+|[()+\-*/!<>,-]/g);
    if (!tokens || !tokens.length) throw new Error('empty expression');
    let pos = 0;
    const peek = () => tokens[pos];
    const eat = (t) => { if (tokens[pos] !== t) throw new Error('expected ' + t); pos++; };
    function primary() {
        const tk = tokens[pos];
        if (tk === undefined) throw new Error('unexpected end');
        if (tk === '(') { pos++; const e = expr(); eat(')'); return e; }
        if (tk === '!') { pos++; return { type: 'not', e: primary() }; }
        if (tk === '-') { pos++; return { type: 'neg', e: primary() }; }
        pos++;
        if (tk === 'true' || tk === 'false') return { type: 'lit', v: tk === 'true' };
        if (/^\d+$/.test(tk)) return { type: 'lit', v: parseInt(tk, 10) };
        if ((tk === 'min' || tk === 'max' || tk === 'abs') && peek() === '(') {
            pos++; const a = expr(); let b = null;
            if (tk !== 'abs') { eat(','); b = expr(); }
            eat(')');
            return { type: 'call', name: tk, a, b };
        }
        if (/^[A-Za-z_]/.test(tk)) return { type: 'var', name: tk };
        throw new Error('bad token ' + tk);
    }
    function mul() { let a = primary(); while (peek() === '*' || peek() === '/') { const op = tokens[pos++]; a = { type: 'bin', op, a, b: primary() }; } return a; }
    function add() { let a = mul(); while (peek() === '+' || peek() === '-') { const op = tokens[pos++]; a = { type: 'bin', op, a, b: mul() }; } return a; }
    function cmp() {
        let a = add();
        while (peek() === '<' || peek() === '>' || peek() === '<=' || peek() === '>=' || peek() === '==' || peek() === '!=') {
            const op = tokens[pos++]; a = { type: 'bin', op, a, b: add() };
        }
        return a;
    }
    function and() { let a = cmp(); while (peek() === '&&') { pos++; a = { type: 'bin', op: '&&', a, b: cmp() }; } return a; }
    function expr() { let a = and(); while (peek() === '||') { pos++; a = { type: 'bin', op: '||', a, b: and() }; } return a; }
    const out = expr();
    if (pos < tokens.length) throw new Error('trailing ' + tokens[pos]);
    return out;
}

function asNum(v) { if (typeof v !== 'number') throw new Error('non-numeric operand'); return v; }
function asBool(v) { if (typeof v !== 'boolean') throw new Error('non-boolean operand'); return v; }

function evalAst(n, env) {
    switch (n.type) {
        case 'lit': return n.v;
        case 'var': if (!(n.name in env)) throw new Error('unknown ' + n.name); return env[n.name];
        case 'not': return !asBool(evalAst(n.e, env));
        case 'neg': return -asNum(evalAst(n.e, env));
        case 'call': {
            const a = asNum(evalAst(n.a, env));
            const b = n.b ? asNum(evalAst(n.b, env)) : null;
            return n.name === 'min' ? Math.min(a, b) : n.name === 'max' ? Math.max(a, b) : Math.abs(a);
        }
        case 'bin': {
            if (n.op === '&&') return asBool(evalAst(n.a, env)) ? asBool(evalAst(n.b, env)) : false;
            if (n.op === '||') return asBool(evalAst(n.a, env)) ? true : asBool(evalAst(n.b, env));
            if (n.op === '==') return evalAst(n.a, env) === evalAst(n.b, env);
            if (n.op === '!=') return evalAst(n.a, env) !== evalAst(n.b, env);
            const a = asNum(evalAst(n.a, env)), b = asNum(evalAst(n.b, env));
            if (n.op === '+') return a + b;
            if (n.op === '-') return a - b;
            if (n.op === '*') return a * b;
            if (n.op === '/') { if (b === 0) throw new Error('division by zero'); return Math.trunc(a / b); }
            if (n.op === '<') return a < b;
            if (n.op === '>') return a > b;
            if (n.op === '<=') return a <= b;
            if (n.op === '>=') return a >= b;
        }
    }
    throw new Error('bad node');
}

function evalMini(src, env) { return asBool(evalAst(parseMini(src), env)); }

function substituteMini(src, env) {
    return src.replace(/[A-Za-z_][A-Za-z0-9_]*/g, w => (w in env) ? String(env[w]) : w);
}

// Interactive widgets keep their own DOM + state across step re-renders:
// the lesson hands the same spec object every step, WeakMap caches the node.
const widgetCache = new WeakMap();

function interactive(x, container, build) {
    let node = widgetCache.get(x);
    if (!node) {
        node = el('div', 'widget');
        build(node);
        widgetCache.set(x, node);
    }
    container.appendChild(node);
}

function fmtVal(v) { return v === true ? 'TRUE' : v === false ? 'FALSE' : String(v); }

function opTokens(src, notes, noteEl) {
    const frag = document.createDocumentFragment();
    src.split(/(\s+|[<>=!+\-*/&|()]+)/).forEach(part => {
        if (!part) return;
        if (/^[<>=!+\-*/]+$/.test(part) || part === '&&' || part === '||' || part === '!') {
            const chip = el('span', 'ig-op', part);
            if (notes && notes[part]) chip.addEventListener('click', () => { noteEl.textContent = part + ' · ' + notes[part]; });
            frag.appendChild(chip);
        } else {
            frag.appendChild(el('span', 'ig-tok', part));
        }
    });
    return frag;
}

function renderEvaluator(x, host) {
    const env = {};
    x.vars.forEach(v => { env[v.name] = v.value; });
    const noteEl = el('div', 'ig-opnote', 'Tap any operator to read what it means.');
    const refreshers = [];

    const varRow = el('div', 'ig-varrow');
    const inputs = {};
    x.vars.forEach(v => {
        const cell = el('div', 'ig-var');
        cell.appendChild(el('span', 'ig-vname', v.name + ' ='));
        const num = el('input', 'ig-vnum');
        num.type = 'number'; num.min = v.min; num.max = v.max; num.value = v.value;
        const rng = el('input', 'ig-vrng');
        rng.type = 'range'; rng.min = v.min; rng.max = v.max; rng.value = v.value;
        const apply = (raw) => {
            let n = parseInt(raw, 10);
            if (!Number.isFinite(n)) return;
            n = Math.max(v.min, Math.min(v.max, n));
            env[v.name] = n; num.value = n; rng.value = n;
            refreshers.forEach(f => f());
        };
        num.addEventListener('input', e => apply(e.target.value));
        rng.addEventListener('input', e => apply(e.target.value));
        cell.append(num, rng);
        varRow.appendChild(cell);
        inputs[v.name] = apply;
    });
    host.appendChild(varRow);

    const caseList = el('div', 'ig-cases');
    x.cases.forEach(src => {
        const row = el('div', 'ig-case');
        const exprEl = el('span', 'ig-expr');
        exprEl.appendChild(opTokens(src, x.opNotes, noteEl));
        const subEl = el('span', 'ig-sub');
        const resEl = el('span', 'chip ig-res');
        const refresh = () => {
            try {
                const v = evalMini(src, env);
                subEl.textContent = substituteMini(src, env) + ' →';
                resEl.textContent = fmtVal(v);
                resEl.className = 'chip ig-res ' + (v ? 't' : 'f');
            } catch (e) {
                subEl.textContent = '';
                resEl.textContent = 'CRASH';
                resEl.className = 'chip ig-res crash';
            }
        };
        refreshers.push(refresh);
        row.append(exprEl, subEl, resEl);
        caseList.appendChild(row);
    });
    host.appendChild(caseList);
    host.appendChild(noteEl);

    if (x.practice) {
        const p = x.practice;
        const pr = el('div', 'ig-practice');
        pr.appendChild(el('div', 'mh-title', 'Random practice · decide TRUE or FALSE before revealing'));
        const exprEl = el('span', 'ig-expr ig-prac-expr');
        const btnRow = el('div', 'prompt-choices');
        const why = el('div', 'ig-why');
        let cur = null, answered = false;
        const draw = () => {
            const op = p.ops[Math.floor(Math.random() * p.ops.length)];
            cur = { left: p.left, op, right: p.right, a: Math.floor(Math.random() * (p.max - p.min + 1)) + p.min, b: Math.floor(Math.random() * (p.max - p.min + 1)) + p.min };
            answered = false; why.textContent = '';
            exprEl.textContent = cur.left + ' = ' + cur.a + ', ' + cur.right + ' = ' + cur.b;
            choices.forEach(b => b.classList.remove('right', 'wrong'));
        };
        const answer = (guess, btn) => {
            if (answered) return;
            answered = true;
            const real = evalMini(cur.a + ' ' + cur.op + ' ' + cur.b, {});
            btn.classList.add(guess === real ? 'right' : 'wrong');
            choices[real ? 0 : 1].classList.add('right');
            why.textContent = cur.a + ' ' + cur.op + ' ' + cur.b + ' is ' + fmtVal(real) + '. ' + ((x.opNotes && x.opNotes[cur.op]) || '');
        };
        const choices = ['true', 'false'].map(label => {
            const b = el('button', 'prompt-choice', label.toUpperCase());
            b.addEventListener('click', () => answer(label === 'true', b));
            btnRow.appendChild(b);
            return b;
        });
        const again = el('button', 'wbtn', 'New practice');
        again.addEventListener('click', draw);
        pr.append(exprEl, btnRow, why, again);
        host.appendChild(pr);
        draw();
    }

    (x.typeRows || []).forEach(r => host.appendChild(el('div', 'ig-info', r.t)));
    (x.errorRows || []).forEach(r => {
        const row = el('div', 'ig-info err');
        row.appendChild(el('span', 'ig-code', r.code));
        row.appendChild(el('span', '', ' ' + r.why));
        host.appendChild(row);
    });
}

function renderSwap(x, host) {
    let opIndex = x.start || 0;
    const env = {};
    (x.vars || []).forEach(v => { env[v.name] = v.value; });
    const varBox = el('div', 'ig-varrow');
    (x.vars || []).forEach(v => {
        const cell = el('div', 'ig-var');
        cell.appendChild(el('span', 'ig-vname', v.name + ' ='));
        const num = el('input', 'ig-vnum');
        num.type = 'number'; num.value = v.value;
        num.addEventListener('input', e => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) { env[v.name] = n; draw(); }
        });
        cell.appendChild(num);
        varBox.appendChild(cell);
    });
    const body = el('div');
    host.append(varBox, body);
    function draw() {
        body.innerHTML = '';
        const op = x.ops[opIndex];
        let lv, rv = null, rState;
        try { lv = evalMini(x.left, env); } catch (e) { lv = 'CRASH'; }
        const decidesAlone = (op === '&&' && lv === false) || (op === '||' && lv === true);
        if (decidesAlone) {
            rState = 'skipped';
        } else {
            try { rv = evalMini(x.right, env); rState = 'run'; } catch (e) { rv = 'CRASH'; rState = 'crash'; }
        }
        const row = el('div', 'bool-row');
        row.appendChild(boolCard({ text: x.left, value: fmtVal(lv) }));
        const gate = el('button', 'bool-gate ig-swapbtn', op);
        gate.title = 'Tap to swap && / ||';
        gate.addEventListener('click', () => { opIndex = (opIndex + 1) % x.ops.length; draw(); });
        row.appendChild(gate);
        row.appendChild(boolCard(rState === 'skipped' ? { text: x.right, state: 'skipped' } : { text: x.right, value: rv === 'CRASH' ? 'would crash' : fmtVal(rv) }));
        body.appendChild(row);
        const res = el('div', 'bool-res');
        res.appendChild(el('span', 'chip', 'result'));
        let out, note;
        if (lv === 'CRASH') { out = 'CRASH'; note = x.left + ' crashes on its own: short-circuit cannot rescue the LEFT side.'; }
        else if (rState === 'skipped') { out = fmtVal(op === '&&' ? false : true); note = 'Left side already decides the ' + op + ', so ' + x.right + ' is NOT evaluated.'; }
        else if (rState === 'crash') { out = 'CRASH'; note = 'Left side did not decide it, so Java MUST evaluate the right side and it crashes.'; }
        else { out = fmtVal(op === '&&' ? (lv && rv) : (lv || rv)); note = 'Both sides ran: no short-circuit this time.'; }
        res.appendChild(el('span', 'bool-result-val', out));
        body.append(res, el('div', 'str-note', note));
        if (x.negNote) {
            const neg = (out === 'TRUE') ? 'FALSE' : out === 'FALSE' ? 'TRUE' : '?';
            body.appendChild(el('div', 'str-note', '!' + op + ' demo: !(' + op + ' result) = ' + neg + '. Precedence: ! first, then &&, then ||.'));
        }
    }
    draw();
}

function renderTruthgen(x, host) {
    const n = x.vars.length;
    const combos = [];
    for (let m = 0; m < (1 << n); m++) {
        const e = {};
        x.vars.forEach((v, i) => { e[v] = Boolean((m >> (n - 1 - i)) & 1); });
        combos.push(e);
    }
    const cols = x.exprs.length;
    let firstDiff = -1;
    const cells = combos.map(e => x.exprs.map(src => {
        try { return evalMini(src, e); } catch (err) { return null; }
    }));
    cells.forEach((row, ri) => { if (row.slice(1).some(v => v !== row[0]) && firstDiff < 0) firstDiff = ri; });
    const table = el('table', 'math-table');
    const head = el('tr');
    x.vars.forEach(v => head.appendChild(el('th', '', v)));
    x.exprs.forEach(src => head.appendChild(el('th', '', src)));
    table.appendChild(head);
    cells.forEach((row, ri) => {
        const tr = el('tr', ri === firstDiff ? 'ig-diff' : '');
        x.vars.forEach((v, i) => tr.appendChild(el('td', 'call', Boolean((ri >> (n - 1 - i)) & 1) ? 'T' : 'F')));
        row.forEach(v => tr.appendChild(el('td', 'res', v === null ? 'CRASH' : v ? 'true' : 'false')));
        table.appendChild(tr);
    });
    host.appendChild(table);
    const equiv = firstDiff < 0;
    const verdict = el('div', 'truth-verdict ' + (equiv ? 'ok' : 'no'));
    verdict.textContent = equiv
        ? 'Equivalent: ' + x.exprs.length + ' columns agree on all ' + combos.length + ' combinations.'
        : 'NOT equivalent: the highlighted row is a counterexample where they disagree.';
    host.appendChild(verdict);
    if (x.note) host.appendChild(el('div', 'str-note', x.note));
}

function renderGrowthlab(x, host) {
    const row = el('div', 'ig-varrow');
    const cell = el('div', 'ig-var');
    cell.appendChild(el('span', 'ig-vname', x.label + ' ='));
    const num = el('input', 'ig-vnum');
    num.type = 'number'; num.min = x.min; num.max = x.max; num.value = x.value;
    const rng = el('input', 'ig-vrng');
    rng.type = 'range'; rng.min = x.min; rng.max = x.max; rng.value = x.value;
    const bars = el('div', 'ig-growth');
    const apply = (raw) => {
        let v = parseInt(raw, 10);
        if (!Number.isFinite(v)) return;
        v = Math.max(x.min, Math.min(x.max, v));
        num.value = v; rng.value = v;
        bars.innerHTML = '';
        const env = { n: v };
        const vals = x.series.map(s => { try { return evalAst(parseMini(s.fn), env); } catch (e) { return 0; } });
        const max = Math.max(1, ...vals);
        x.series.forEach((s, i) => {
            const r = el('div', 'gl-row');
            r.appendChild(el('span', 'gl-name', s.name));
            const val = el('span', 'gl-val', String(vals[i]) + ' ops');
            const track = el('div', 'gl-track');
            const fill = el('div', 'gl-fill');
            fill.style.width = Math.max(3, Math.round((vals[i] / max) * 100)) + '%';
            track.appendChild(fill);
            r.append(val, track);
            bars.appendChild(r);
        });
    };
    num.addEventListener('input', e => apply(e.target.value));
    rng.addEventListener('input', e => apply(e.target.value));
    cell.append(num, rng);
    row.appendChild(cell);
    host.append(row, bars);
    if (x.note) host.appendChild(el('div', 'str-note', x.note));
    apply(x.value);
}

const PATTERN_LABELS = {
    counter: 'Counter', sum: 'Accumulator (sum)', max: 'Find maximum', min: 'Find minimum',
    matches: 'Count matches', evensum: 'Conditional sum (evens)', first: 'Find first match',
    all: 'Check all', any: 'Check any'
};

function tracePattern(kind, data, target) {
    const rows = [];
    let tracker, init = '', stopAt = -1;
    const colCheck = kind === 'max' ? 'v > max ?' : kind === 'min' ? 'v < min ?' :
        kind === 'counter' || kind === 'first' || kind === 'all' || kind === 'any' ? 'v > ' + target + ' ?' :
        kind === 'matches' ? 'v == ' + target + ' ?' : kind === 'evensum' ? 'v % 2 == 0 ?' : '';
    if (kind === 'max') { tracker = data[0]; init = 'max = ' + data[0]; }
    else if (kind === 'min') { tracker = data[0]; init = 'min = ' + data[0]; }
    else if (kind === 'all') tracker = true;
    else if (kind === 'any') tracker = false;
    else if (kind === 'first') tracker = -1;
    else tracker = 0;
    for (let i = (kind === 'max' || kind === 'min') ? 1 : 0; i < data.length; i++) {
        const v = data[i];
        const test = kind === 'matches' ? v === target : kind === 'evensum' ? v % 2 === 0 :
            kind === 'counter' || kind === 'first' ? v > target : kind === 'all' || kind === 'any' ? v > target :
            kind === 'max' ? v > tracker : v < tracker;
        if (kind === 'max') { if (test) tracker = v; }
        else if (kind === 'min') { if (test) tracker = v; }
        else if (kind === 'counter') { if (test) tracker++; }
        else if (kind === 'matches') { if (test) tracker++; }
        else if (kind === 'evensum') { if (test) tracker += v; }
        else if (kind === 'first') { if (test) { tracker = i; stopAt = i; } }
        else if (kind === 'all') { if (!test) { tracker = false; stopAt = i; } }
        else if (kind === 'any') { if (test) { tracker = true; stopAt = i; } }
        else if (kind === 'sum') tracker += v;
        rows.push([String(i), String(v), colCheck ? (test ? 'true' : 'false') : '', (kind === 'sum' || kind === 'max' || kind === 'min') && !test ? tracker + ' (no change)' : String(tracker)]);
        if (stopAt >= 0) break;
    }
    return { init, rows, final: String(tracker), stopAt, cols: ['i', 'v', colCheck || 'action', (kind === 'max' ? 'max after' : kind === 'min' ? 'min after': kind === 'first' ? 'found after' : kind === 'all' || kind === 'any' ? 'result after' : 'tracker after')] };
}

function renderPatternlab(x, host) {
    let data = (x.data || []).slice();
    let target = x.target !== undefined ? x.target : 5;
    const top = el('div', 'ig-varrow');
    const dataCell = el('div', 'ig-var wide');
    dataCell.appendChild(el('span', 'ig-vname', 'data'));
    const dataIn = el('input', 'ig-vtext');
    dataIn.value = data.join(', ');
    top.appendChild(dataCell);
    dataCell.appendChild(dataIn);
    if (x.usesTarget) {
        const tCell = el('div', 'ig-var');
        tCell.appendChild(el('span', 'ig-vname', (x.targetName || 'target') + ' ='));
        const tNum = el('input', 'ig-vnum');
        tNum.type = 'number'; tNum.value = target;
        tCell.appendChild(tNum);
        top.appendChild(tCell);
        tNum.addEventListener('input', () => { const n = parseInt(tNum.value, 10); if (Number.isFinite(n)) { target = n; draw(); } });
    }
    const label = el('div', 'chip', PATTERN_LABELS[x.pattern] || x.pattern);
    const stage = el('div');
    host.append(top, label, stage);
    function draw() {
        stage.innerHTML = '';
        const parsed = dataIn.value.split(/[, ]+/).map(s => parseInt(s, 10)).filter(Number.isFinite);
        if (!parsed.length) return;
        data = parsed;
        const t = tracePattern(x.pattern, data, target);
        const row = el('div', 'arr-row');
        data.forEach((v, i) => {
            const cell = el('div', 'arr-cell' + (i === t.stopAt ? ' oob' : ''));
            cell.appendChild(el('div', 'arr-idx', String(i)));
            cell.appendChild(el('div', 'arr-val', String(v)));
            row.appendChild(cell);
        });
        const wrap = el('div', 'arr-wrap');
        wrap.appendChild(el('div', 'arr-head')).appendChild(el('span', 'arr-name', x.arrayName || 'nums'));
        const chip = el('span', 'chip', 'length = ' + data.length);
        wrap.querySelector('.arr-head').appendChild(chip);
        wrap.appendChild(row);
        stage.appendChild(wrap);
        if (t.init) stage.appendChild(el('div', 'str-note', 'Start: ' + t.init));
        const table = el('table', 'math-table');
        const head = el('tr');
        t.cols.forEach(c => head.appendChild(el('th', '', c)));
        table.appendChild(head);
        t.rows.forEach(r => {
            const tr = el('tr');
            r.forEach((c, ci) => tr.appendChild(el('td', ci === 3 ? 'res' : 'call', c)));
            table.appendChild(tr);
        });
        stage.appendChild(table);
        const res = el('div', 'bool-res');
        res.appendChild(el('span', 'chip', 'final'));
        res.appendChild(el('span', 'bool-result-val', t.final));
        stage.appendChild(res);
        if (t.stopAt >= 0) stage.appendChild(el('div', 'str-note', 'Loop stopped early at index ' + t.stopAt + ': the rest of the data is never visited.'));
        if (x.explain) stage.appendChild(el('div', 'str-note', x.explain));
    }
    dataIn.addEventListener('input', draw);
    draw();
}

function renderExtra(container, state) {
    const x = state.extras;
    if (!x) { container.appendChild(el('div', 'stack-empty', 'Nothing to show yet.')); return; }
    if (x.kind === 'pipeline') {
        const row = el('div', 'pipe-row');
        x.labels.forEach((label, i) => {
            if (i > 0) row.appendChild(el('span', 'pipe-sep', '→'));
            const st = el('div', 'pipe-stage' + (i === x.stage ? ' active' : (i < x.stage ? ' done' : '')));
            st.appendChild(el('div', 'ps-name', (i < x.stage ? '✓ ' : '') + label));
            if (x.subs && x.subs[i]) st.appendChild(el('div', 'ps-sub', x.subs[i]));
            row.appendChild(st);
        });
        container.appendChild(row);
        if (x.caption) container.appendChild(el('div', 'range-caption', x.caption));
    } else if (x.kind === 'input') {
        const row = el('div', 'input-row');
        x.stream.forEach(s => {
            row.appendChild(el('span', 'input-bubble', '⌨ ' + s.text));
            row.appendChild(el('span', 'input-arrow', '→'));
            row.appendChild(el('span', 'input-target', s.target));
        });
        container.appendChild(row);
        if (x.note) container.appendChild(el('div', 'input-note', x.note));
    } else if (x.kind === 'range') {
        const track = el('div', 'range-track');
        const marker = el('div', 'range-marker' + (x.overflow ? ' overflow' : ''));
        marker.style.left = Math.round(Math.max(0, Math.min(1, x.marker)) * 100) + '%';
        track.appendChild(marker);
        container.appendChild(track);
        const ends = el('div', 'range-ends');
        ends.appendChild(el('span', '', x.min));
        ends.appendChild(el('span', '', x.max));
        container.appendChild(ends);
        if (x.caption) container.appendChild(el('div', 'range-caption' + (x.overflow ? ' overflow' : ''), x.caption));
    } else if (x.kind === 'signature') {
        const row = el('div', 'sig-row');
        x.parts.forEach(p => {
            row.appendChild(el('span', 'sig-part' + (p.key === x.focus ? ' on' : ''), p.text));
        });
        container.appendChild(row);
        if (x.desc) container.appendChild(el('div', 'sig-desc', x.desc));
    } else if (x.kind === 'math') {
        const table = el('table', 'math-table');
        const head = el('tr');
        ['Call', 'Result', 'Why'].forEach(h => head.appendChild(el('th', '', h)));
        table.appendChild(head);
        x.rows.forEach(r => {
            const tr = el('tr');
            tr.appendChild(el('td', 'call', r.call));
            tr.appendChild(el('td', 'res', r.result));
            tr.appendChild(el('td', 'note', r.note));
            table.appendChild(tr);
        });
        container.appendChild(table);
    } else if (x.kind === 'blueprint') {
        const bp = el('div', 'blueprint');
        bp.appendChild(el('div', 'bp-head', 'class ' + x.className));
        x.fields.forEach(f => {
            const row = el('div', 'bp-row');
            row.appendChild(el('span', '', f.name));
            row.appendChild(el('span', 'bp-type', f.type));
            bp.appendChild(row);
        });
        container.appendChild(bp);
    } else if (x.kind === 'stringindex') {
        const grid = el('div', 'str-grid');
        Array.from(x.text).forEach((ch, i) => {
            const inr = x.sel && i >= x.sel.from && i < x.sel.to;
            const cell = el('div', 'str-cell' + (inr ? ' inrange' : ''));
            cell.appendChild(el('div', 'str-char', ch === ' ' ? '␣' : ch));
            cell.appendChild(el('div', 'str-idx', String(i)));
            grid.appendChild(cell);
        });
        container.appendChild(grid);
        if (x.sel && x.sel.note) container.appendChild(el('div', 'str-note', x.sel.note));
    } else if (x.kind === 'flow') {
        const visited = new Set(x.visited || []);
        const struck = new Set(x.struck || []);
        container.appendChild(flowNodeEl(x.root, visited, x.active, 0, struck, !!x.showLevels));
    } else if (x.kind === 'loop') {
        const row = el('div', 'loop-stages');
        x.stages.forEach((s, i) => {
            if (i > 0) row.appendChild(el('span', 'pipe-sep', '→'));
            row.appendChild(el('div', 'loop-stage' + (s === x.active ? ' on' : ''), s));
        });
        row.appendChild(el('span', 'pipe-sep', '↺'));
        row.appendChild(el('div', 'loop-stage back' + (x.active === x.stages[1] ? ' on' : ''), x.stages[0] === 'INIT' ? 'CHECK' : x.stages[0]));
        container.appendChild(row);
        const meta = el('div', 'loop-meta');
        meta.appendChild(el('span', '', 'Round ' + (x.iteration || 0)));
        if (x.note) meta.appendChild(el('span', 'loop-note-text', x.note));
        container.appendChild(meta);
        if (x.history && x.history.length) {
            const table = el('table', 'math-table');
            const head = el('tr');
            (x.cols || ['Round', 'Check', 'After']).forEach(h => head.appendChild(el('th', '', h)));
            table.appendChild(head);
            x.history.forEach(r => {
                const tr = el('tr');
                r.forEach(c => tr.appendChild(el('td', 'call', String(c))));
                table.appendChild(tr);
            });
            container.appendChild(table);
        }
    } else if (x.kind === 'bool') {
        const row = el('div', 'bool-row');
        row.appendChild(boolCard(x.left));
        row.appendChild(el('div', 'bool-gate', x.op));
        row.appendChild(boolCard(x.right));
        container.appendChild(row);
        const res = el('div', 'bool-res');
        res.appendChild(el('span', 'chip', 'result'));
        res.appendChild(el('span', 'bool-result-val', x.result));
        container.appendChild(res);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'truth') {
        const table = el('table', 'math-table');
        const head = el('tr');
        x.cols.forEach(c => head.appendChild(el('th', '', c)));
        table.appendChild(head);
        x.rows.forEach(r => {
            const tr = el('tr');
            r.forEach((c, i) => tr.appendChild(el('td', i === 0 ? 'call' : 'res', String(c))));
            table.appendChild(tr);
        });
        container.appendChild(table);
        if (x.verdict) container.appendChild(el('div', 'truth-verdict', x.verdict));
    } else if (x.kind === 'grid') {
        const visited = new Set((x.visited || []).map(v => v[0] + ',' + v[1]));
        const cur = x.current ? x.current[0] + ',' + x.current[1] : null;
        const table = el('table', 'grid-table');
        const headRow = el('tr');
        headRow.appendChild(el('th', '', x.rowLabel || 'r'));
        for (let c = 0; c < x.cols; c++) headRow.appendChild(el('th', '', String(c)));
        table.appendChild(headRow);
        for (let r = 0; r < x.rows; r++) {
            const tr = el('tr');
            tr.appendChild(el('th', '', String(r)));
            for (let c = 0; c < x.cols; c++) {
                const key = r + ',' + c;
                const cls = 'grid-cell' + (visited.has(key) ? ' visited' : '') + (key === cur ? ' current' : '');
                const td = el('td', cls, visited.has(key) ? '✓' : '');
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        container.appendChild(table);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'growth') {
        const table = el('table', 'math-table');
        const head = el('tr');
        x.cols.forEach(c => head.appendChild(el('th', '', c)));
        table.appendChild(head);
        const max = Math.max(1, ...x.rows.map(r => Math.max(r[1], r[2])));
        x.rows.forEach(r => {
            const tr = el('tr');
            tr.appendChild(el('td', 'call', String(r[0])));
            [r[1], r[2]].forEach(v => {
                const td = el('td', 'res');
                const bar = el('div', 'growth-bar');
                bar.style.width = Math.max(4, Math.round((v / max) * 100)) + '%';
                const lab = el('span', 'growth-val', String(v));
                td.appendChild(lab);
                td.appendChild(bar);
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        container.appendChild(table);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'abstraction') {
        const row = el('div', 'abs-row');
        const left = el('div', 'abs-col');
        left.appendChild(el('div', 'mh-title', 'Real student'));
        x.items.forEach(it => {
            const cls = it.keep === true ? ' keep' : (it.keep === false ? ' drop' : ' pending');
            left.appendChild(el('div', 'abs-item' + cls, (it.keep === true ? '✓ ' : it.keep === false ? '✗ ' : '? ') + it.t));
        });
        row.appendChild(left);
        row.appendChild(el('div', 'abs-mid', 'abstraction →'));
        const right = el('div', 'abs-col');
        right.appendChild(el('div', 'mh-title', 'Program model'));
        const bp = el('div', 'blueprint');
        bp.appendChild(el('div', 'bp-head', 'class Student'));
        x.model.forEach(m => {
            const r = el('div', 'bp-row');
            r.appendChild(el('span', '', m));
            bp.appendChild(r);
        });
        right.appendChild(bp);
        row.appendChild(right);
        container.appendChild(row);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'compare') {
        const grid = el('div', 'cmp-grid');
        [x.left, x.right].forEach(side => {
            const col = el('div', 'cmp-col');
            col.appendChild(el('div', 'mh-title', side.title));
            side.rows.forEach(r => col.appendChild(el('div', 'cmp-row' + (r.hit ? ' hit' : ''), r.hit ? '⚠ ' + r.t : r.t)));
            grid.appendChild(col);
        });
        container.appendChild(grid);
        if (x.verdict) container.appendChild(el('div', 'truth-verdict', x.verdict));
    } else if (x.kind === 'anatomy') {
        const row = el('div', 'anat-row');
        x.regions.forEach(r => {
            row.appendChild(el('div', 'anat-chip' + (r.key === x.active ? ' on' : ''), r.label + ' · lines ' + r.from + '-' + r.to));
        });
        container.appendChild(row);
        if (x.desc) container.appendChild(el('div', 'sig-desc', x.desc));
    } else if (x.kind === 'classmem') {
        const bp = el('div', 'blueprint');
        bp.appendChild(el('div', 'bp-head', 'CLASS ' + x.className + ' (shared memory)'));
        x.statics.forEach(s => {
            const r = el('div', 'bp-row');
            r.appendChild(el('span', '', s.name));
            r.appendChild(el('span', 'bp-type', String(s.value)));
            bp.appendChild(r);
        });
        container.appendChild(bp);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'array' || x.kind === 'list') {
        container.appendChild(arrRowEl(x));
        if (x.second) {
            container.appendChild(el('div', 'mh-title', ' '));
            container.appendChild(arrRowEl(x.second));
        }
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'grid2d') {
        const visited = new Set((x.visited || []).map(v => v[0] + ',' + v[1]));
        const cur = x.current ? x.current[0] + ',' + x.current[1] : null;
        const table = el('table', 'grid-table');
        const headRow = el('tr');
        headRow.appendChild(el('th', '', x.name || 'r'));
        for (let c = 0; c < x.values[0].length; c++) headRow.appendChild(el('th', '', String(c)));
        table.appendChild(headRow);
        x.values.forEach((rowVals, r) => {
            const tr = el('tr');
            tr.appendChild(el('th', '', String(r)));
            rowVals.forEach((v, c) => {
                const key = r + ',' + c;
                const cls = 'grid-cell' + (visited.has(key) ? ' visited' : '') + (key === cur ? ' current' : '');
                const td = el('td', cls, String(v));
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        container.appendChild(table);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'bias') {
        container.appendChild(el('div', 'bias-legend', 'grey: real population   ·   blue: collected sample'));
        x.groups.forEach(g => {
            const row = el('div', 'bias-row');
            row.appendChild(el('div', 'bias-label', g.g));
            const t1 = el('div', 'bias-track');
            const f1 = el('div', 'bias-fill');
            f1.style.width = g.pop + '%';
            t1.appendChild(f1);
            const t2 = el('div', 'bias-track');
            const f2 = el('div', 'bias-fill sample');
            f2.style.width = g.sample + '%';
            t2.appendChild(f2);
            row.append(t1, t2);
            container.appendChild(row);
        });
        if (x.note) container.appendChild(el('div', 'range-caption' + (x.warn ? ' overflow' : ''), x.note));
    } else if (x.kind === 'dataset') {
        const table = el('table', 'math-table');
        const head = el('tr');
        x.cols.forEach(c => {
            const th = el('th');
            th.appendChild(document.createTextNode(c.name + ' '));
            const chip = el('span', 'chip', c.type);
            th.appendChild(chip);
            head.appendChild(th);
        });
        table.appendChild(head);
        x.rows.forEach(r => {
            const tr = el('tr');
            r.forEach(c => tr.appendChild(el('td', 'call', String(c))));
            table.appendChild(tr);
        });
        container.appendChild(table);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'file') {
        x.lines.forEach((l, i) => {
            const row = el('div', 'file-line' + (i === x.cursor ? ' cur' : ''));
            row.appendChild(el('span', '', l));
            if (i === x.cursor) row.appendChild(el('span', 'file-cur-label', '← Scanner reads here'));
            container.appendChild(row);
        });
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'wrap') {
        const row = el('div', 'bool-row');
        row.appendChild(boolCard(x.left));
        row.appendChild(el('div', 'bool-gate', x.op));
        row.appendChild(boolCard(x.right));
        container.appendChild(row);
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'scope') {
        (Array.isArray(x.boxes) ? x.boxes : [x.boxes]).forEach(b => container.appendChild(scopeBoxEl(b, x.active, x.error)));
        if (x.note) container.appendChild(el('div', 'str-note', x.note));
    } else if (x.kind === 'evaluator') {
        interactive(x, container, node => renderEvaluator(x, node));
    } else if (x.kind === 'swap') {
        interactive(x, container, node => renderSwap(x, node));
    } else if (x.kind === 'truthgen') {
        interactive(x, container, node => renderTruthgen(x, node));
    } else if (x.kind === 'growthlab') {
        interactive(x, container, node => renderGrowthlab(x, node));
    } else if (x.kind === 'patternlab') {
        interactive(x, container, node => renderPatternlab(x, node));
    }
}

function arrRowEl(x) {
    const wrap = el('div', 'arr-wrap');
    const head = el('div', 'arr-head');
    head.appendChild(el('span', 'arr-name', x.name));
    head.appendChild(el('span', 'chip', (x.kind === 'list' ? 'size() = ' : 'length = ') + x.values.length));
    wrap.appendChild(head);
    const row = el('div', 'arr-row');
    x.values.forEach((v, i) => {
        const cls = 'arr-cell'
            + (i < (x.sorted || 0) ? ' sorted' : '')
            + (i >= (x.sorted || 0) && i < (x.checked || 0) ? ' checked' : '')
            + (x.sel === i ? ' sel' : '')
            + (x.oob === i ? ' oob' : '');
        const cell = el('div', cls);
        cell.appendChild(el('div', 'arr-idx', String(i)));
        cell.appendChild(el('div', 'arr-val', String(v)));
        row.appendChild(cell);
    });
    wrap.appendChild(row);
    if (x.markers && x.markers.length) {
        const mrow = el('div', 'arr-row');
        x.values.forEach((_, i) => {
            const slot = el('div', 'arr-cell blank');
            const mk = x.markers.find(q => q.at === i);
            slot.textContent = mk ? mk.label : '';
            if (mk) slot.classList.add('mark');
            mrow.appendChild(slot);
        });
        wrap.appendChild(mrow);
    }
    return wrap;
}

function scopeBoxEl(box, active, error) {
    const wrap = el('div', 'scope-box' + (box.name === active ? ' active' : '') + (error && box.name === error ? ' err' : ''));
    wrap.appendChild(el('div', 'scope-name', box.name + ' scope'));
    (box.vars || []).forEach(v => wrap.appendChild(el('div', 'scope-var' + (v.dead ? ' dead' : ''), v.t)));
    (box.children || []).forEach(ch => wrap.appendChild(scopeBoxEl(ch, active, error)));
    return wrap;
}

export function makeTouched() {
    return { vars: new Set(), heap: new Set(), console: false, stack: false, expr: false };
}

export function renderView(name, card, state, touched) {
    if (name === 'memory' || name === 'heap') return; // handled together by the runtime
    if (name === 'expression') return renderExpression(card, state, touched);
    if (name === 'console') return renderConsole(card, state, touched);
    if (name === 'stack') return renderStack(card, state, touched);
    if (name === 'extra') return renderExtra(card, state, touched);
}

export const VIEW_LABELS = {
    memory: 'Memory',
    heap: 'Memory & Heap',
    expression: 'Evaluation',
    console: 'Console Output',
    stack: 'Call Stack',
    extra: 'View'
};

export { renderMemory, renderHeap, renderMemoryHeap };
