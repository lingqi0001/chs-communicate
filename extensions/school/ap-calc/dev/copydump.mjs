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

/* Copy dump: prints every rendered string per topic/mode/step so a proofreader
   can read the UI text in context. Run: node dev/copydump.mjs [filter] */
function dumpSet(label, def, set) {
    const lines = [];
    const host = makeNode('div');
    mountWorkspace(host, def);
    if (set.label !== '_') {
        let opt = set.label;
        if (set.isCase) {
            const ctl = (set.def.controls || []).find(c => c.key === (set.def.stepKey
                || ((set.def.controls || []).find(c => c.kind === 'choice') || {}).key));
            const o = ((ctl && ctl.options) || []).find(x => (x.v !== undefined ? x.v : x) === set.label);
            opt = o ? (o.label !== undefined ? o.label : String(o)) : null;
        }
        const btn = queryAll(host, '.mode-tab').find(b => b.textContent === opt);
        if (btn) btn._ev.click();
    }
    const texts = () => {
        const out = [];
        const grab = n => {
            const cls = n.className || '';
            if (/cv-ro-label|cv-ro-val|cv-ro-unit|cv-note|cv-label|cv-ticktext|cv-ctl-label|wbtn|cv-chingelabel|cv-cgain|prompt-|summary|work-msg|cv-pane-title|text/.test(cls) && n._text) out.push(cls + ' | ' + n._text);
            n.children.forEach(grab);
        };
        grab(host);
        return out;
    };
    const jump = query(host, '.step-jump');
    const n = set.steps.length;
    for (let i = 0; i <= n; i++) {
        if (jump) { jump.value = String(i); if (jump._ev.blur) jump._ev.blur(); }
        lines.push('--- step ' + i + ' ---');
        lines.push(...texts());
        const prompt = query(host, '.prompt-box');
        if (prompt && prompt.style.display !== 'none') {
            const ch = query(host, '.prompt-choice');
            if (ch && ch._ev && ch._ev.click) { ch._ev.click({ pointerId: 1 }); lines.push('--- after answer ---'); lines.push(...texts()); }
        }
    }
    const seen = new Set();
    return lines.filter(l => { const k = l; if (!l.startsWith('---') ) { if (seen.has(k)) return false; seen.add(k); } return true; }).join('\n');
}

const filter = process.argv[2] || '';
for (const u of units) {
    for (const t of u.topics) {
        if (!t.module) continue;
        if (filter && !(t.id + ' ' + t.title + ' ' + t.module).includes(filter)) continue;
        const mod = await import(new URL('../' + t.module, import.meta.url).href);
        const def = mod.default.topics ? mod.default.topics[t.id] : mod.default;
        if (!def) continue;
        console.log('\n############### ' + t.id + ' ' + t.title + '  [' + t.module + ']');
        if (def.meta && def.meta.visualizerTitle) console.log('TITLE | ' + def.meta.visualizerTitle);
        if (def.intro) console.log('INTRO | ' + (typeof def.intro === 'function' ? def.intro({}) : def.intro));
        for (const set of stepSets(def)) console.log(dumpSet(t.id, def, set));
        const s = def.summary || {};
        ['idea', 'mistake', 'transfer'].forEach(k => { if (s[k]) console.log('SUMMARY.' + k + ' | ' + s[k]); });
        (def.modes || []).forEach(m => { const ms = m.summary || {}; ['idea', 'mistake', 'transfer'].forEach(k => { if (ms[k]) console.log('MODE[' + m.label + '].SUMMARY.' + k + ' | ' + ms[k]); }); });
    }
}
