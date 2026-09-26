/* Throwaway dev harness (not referenced by the app): mounts every lesson
   headlessly in Node with a minimal DOM stub and exercises Next/Prev/Reset,
   controls, and predictions. Delete after Units 1-4 are verified. */

const listeners = [];
function makeNode(tag) {
    const n = {
        tagName: tag, children: [], _text: '', style: {}, dataset: {},
        classList: {
            _s: new Set(),
            add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
            toggle(c, on) { if (on === undefined) on = !this._s.has(c); on ? this._s.add(c) : this._s.delete(c); },
            contains(c) { return this._s.has(c); }
        },
        setAttribute(k, v) { n['attr_' + k] = String(v); if (k === 'class') n.className = String(v); },
        getAttribute(k) { return n['attr_' + k]; },
        appendChild(c) { n.children.push(c); c.parent = n; return c; },
        removeChild(c) { const i = n.children.indexOf(c); if (i >= 0) n.children.splice(i, 1); return c; },
        append(...cs) { cs.forEach(c => n.appendChild(c)); },
        prepend(...cs) { n.children.unshift(...cs); },
        replaceChildren() { n.children = []; },
        addEventListener(ev, fn) { (n._ev = n._ev || {})[ev] = fn; },
        removeEventListener() {},
        setPointerCapture() {},
        querySelector(sel) { return query(n, sel); },
        querySelectorAll(sel) { return queryAll(n, sel); },
        getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 400 }; },
        scrollIntoView() {},
        set innerHTML(v) { if (v === '') n.children = []; },
        get innerHTML() { return ''; },
        set textContent(v) { n._text = String(v); n.children = []; },
        get textContent() {
            return n._text + n.children.map(c => c.textContent).join('');
        }
    };
    Object.defineProperty(n, 'className', { get() { return n._cls || ''; }, set(v) { n._cls = v; } });
    return n;
}
function walk(n, fn) { n.children.forEach(c => { fn(c); walk(c, fn); }); }
function matchCls(n, cls) {
    const all = new Set([...(n.classList._s || []), ...(n.className || '').split(' ')]);
    return all.has(cls);
}
function queryAll(root, sel) {
    const out = [];
    const parts = sel.split(' ');
    function test(n) {
        for (const p of parts) {
            if (p.startsWith('.')) { if (!matchCls(n, p.slice(1))) return false; }
            else if (p.startsWith('[')) {
                const m = p.slice(1, -1).split('=');
                if (String(n[m[0]]) !== m[1].replace(/"/g, '')) return false;
            } else if (n.tagName !== p) return false;
        }
        return true;
    }
    walk(root, n => { if (test(n)) out.push(n); });
    return out;
}
function query(root, sel) { return queryAll(root, sel)[0] || null; }

global.document = {
    createElement: (t) => makeNode(t),
    createElementNS: (ns, t) => makeNode(t),
    createTextNode: (s) => { const n = makeNode('#text'); n.textContent = s; return n; },
    createDocumentFragment: () => makeNode('#frag'),
    getElementById: (id) => global.__ids[id],
    body: makeNode('body'),
    documentElement: makeNode('html')
};
global.__ids = {};
global.window = { self: null, top: null, location: { search: '', hash: '', pathname: '/' }, addEventListener() {} };
global.localStorage = { getItem: () => null, setItem() {} };
global.requestAnimationFrame = (fn) => fn();
global.CSS = { escape: (s) => s };

const fs = await import('fs');
const path = await import('path');
const { mountWorkspace } = await import('../js/calc-runtime.js');

const root = path.resolve(import.meta.dirname, '..');
const curriculumSrc = fs.readFileSync(path.join(root, 'js/curriculum.js'), 'utf8');
const windowObj = global.window;
const w = {};
new Function('window', curriculumSrc)(w);
const units = w.CALC_CURRICULUM;

let checked = 0, failed = 0;
/* lesson step sets: a flat array is one run; an object is one run per case;
   modes each carry their own run (and may themselves key runs by case). */
function setsOf(def, prefix) {
    const label = prefix || '_';
    if (Array.isArray(def.steps)) return [{ label, def, steps: def.steps, isCase: false }];
    if (def.steps && typeof def.steps === 'object') {
        return Object.keys(def.steps).map(k => {
            const e = def.steps[k];
            return { label: k, def, steps: Array.isArray(e) ? e : (e.steps || []), isCase: true };
        });
    }
    return [{ label, def, steps: [], isCase: false }];
}
function stepSets(def) {
    if (def.modes && def.modes.length) return def.modes.flatMap(m => setsOf(m, m.label));
    return setsOf(def);
}
for (const u of units) {
    for (const t of u.topics) {
        if (!t.module) continue;
        checked++;
        const label = t.id + ' ' + t.title;
        try {
            const mod = await import(path.join(root, t.module).replace(/\\/g, '/') && 'file:///' + path.join(root, t.module).replace(/\\/g, '/'));
            const def = mod.default.topics ? mod.default.topics[t.id] : mod.default;
            if (!def) throw new Error('no def for topic ' + t.id);
            /* steps belong to a case: walk every case separately, and prove a
               step never carries the lesson into another case */
            const stepKey = def.stepKey
                || ((def.controls || []).find(c => c.kind === 'choice') || {}).key || null;
            const sets = stepSets(def);
            if (!Array.isArray(def.steps) && def.steps && stepKey) {
                Object.keys(def.steps).forEach(k => {
                    const list = Array.isArray(def.steps[k]) ? def.steps[k] : (def.steps[k].steps || []);
                    list.forEach((s, i) => {
                        if (s.params && s.params[stepKey] !== undefined) {
                            throw new Error('case ' + k + ' step ' + i + ' sets ' + stepKey + ' (crosses cases)');
                        }
                    });
                });
            }
            for (const set of sets) {
                const host = makeNode('div');
                mountWorkspace(host, def);
                /* land on the right mode / case before walking, then re-query:
                   switching rebuilds the workspace */
                if (set.label !== '_') {
                    let opt = set.label;
                    if (set.isCase) {
                        const ctl = (set.def.controls || []).find(c => c.key === (set.def.stepKey
                            || ((set.def.controls || []).find(c => c.kind === 'choice') || {}).key));
                        const o = ((ctl && ctl.options) || []).find(x => (x.v !== undefined ? x.v : x) === set.label);
                        opt = o ? (o.label !== undefined ? o.label : String(o)) : null;
                    }
                    const btn = queryAll(host, '.mode-tab').find(b => b.textContent === opt);
                    if (!btn) throw new Error('no tab/button for ' + set.label);
                    btn._ev.click();
                }
                const nextBtn = queryAll(host, '.wbtn').find(b => b.textContent.includes('Next'));
                const jump = query(host, '.step-jump');
                for (let i = 0; i <= set.steps.length; i++) {
                    if (jump) { jump.value = String(i); jump._ev.blur(); }
                    const errs = queryAll(host, '.calc-pane-body')
                        .filter(b => b.textContent.includes('Render error') || b.textContent.includes('Unknown pane'));
                    if (errs.length) throw new Error(set.label + ' step ' + i + ': ' + errs[0].textContent.slice(0, 120));
                    const prompt = query(host, '.prompt-box');
                    if (prompt && prompt.style.display !== 'none') {
                        const choice = query(host, '.prompt-choice');
                        if (choice && choice._ev && choice._ev.click) choice._ev.click({ pointerId: 1 });
                    }
                    if (nextBtn && nextBtn._ev.click && !nextBtn.disabled) nextBtn._ev.click();
                }
                if (jump) { jump.value = String(set.steps.length); jump._ev.blur(); }
                const summary = query(host, '.summary-box');
                if (set.steps.length && set.def.summary && (!summary || summary.style.display === 'none')) {
                    throw new Error('summary never shown at end of ' + set.label);
                }
            }
            // exercise pane render at every step index explicitly (catches fn crashes)
            const host2 = makeNode('div');
            mountWorkspace(host2, def);
            const jump = query(host2, '.step-jump');
            const stepsN = sets[0].steps.length;
            for (let i = 0; i <= stepsN; i++) {
                jump.value = String(i);
                const commit = jump._ev && jump._ev.blur;
                if (commit) commit();
                const errs = queryAll(host2, '.calc-pane-body').filter(b => b.textContent.includes('Render error') || b.textContent.includes('Unknown pane'));
                if (errs.length) throw new Error('step ' + i + ': ' + errs[0].textContent.slice(0, 120));
            }
            // controls: fire each slider input at min/mid/max
            const sliders = queryAll(host2, '.cv-slider');
            sliders.forEach(sl => {
                const orig = sl.value;
                [sl['attr_min'], String((parseFloat(sl['attr_min']) + parseFloat(sl['attr_max'])) / 2), sl['attr_max']].forEach(v => {
                    if (!Number.isFinite(parseFloat(v))) return;
                    sl.value = v;
                    if (sl._ev && sl._ev.input) { sl._ev.input({ target: sl }); }
                    const errs = queryAll(host2, '.calc-pane-body').filter(b => b.textContent.includes('Render error'));
                    if (errs.length) throw new Error('slider ' + v + ': ' + errs[0].textContent.slice(0, 120));
                });
                sl.value = orig;
            });
            const optBtns = queryAll(host2, '.cv-ctl-opts');
            optBtns.forEach(box => {
                box.children.forEach(b => {
                    if (b._ev && b._ev.click) {
                        b._ev.click();
                        const errs = queryAll(host2, '.calc-pane-body').filter(x => x.textContent.includes('Render error'));
                        if (errs.length) throw new Error('choice click: ' + errs[0].textContent.slice(0, 120));
                    }
                });
            });
        } catch (e) {
            failed++;
            console.log('FAIL ' + label + ' :: ' + e.message);
        }
    }
}
console.log((failed ? 'LESSONS_HARNESS_FAILED ' : 'LESSONS_HARNESS_OK ') + checked + ' module topics, ' + failed + ' failed');
