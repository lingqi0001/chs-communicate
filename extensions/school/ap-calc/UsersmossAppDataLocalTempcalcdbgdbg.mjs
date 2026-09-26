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


const { RENDERERS } = await import('file:///C:/Users/moss/Desktop/CHSchat/extensions/school/ap-calc/js/calc-components.js?v=20260925-calc-15');
const { mountWorkspace } = await import('file:///C:/Users/moss/Desktop/CHSchat/extensions/school/ap-calc/js/calc-runtime.js?v=20260925-calc-15');
for (const k of Object.keys(RENDERERS)) {
  const orig = RENDERERS[k];
  RENDERERS[k] = (spec, env, host, ctx) => {
    try { orig(spec, env, host, ctx); }
    catch (e) { console.log('THROW in', k, JSON.stringify(typeof spec.title === 'function' ? spec.title(env) : spec.title), '| kase=', env.kase, typeof env.kase, '| x0=', env.x0, '|', e.stack.split(String.fromCharCode(10)).slice(0,3).join(' >> ')); throw e; }
  };
}
const walkAll = (n, fn) => { n.children.forEach(c => { fn(c); walkAll(c, fn); }); };
const find = (host, cls) => { const out = []; walkAll(host, n => { if ((n.className || '').split(' ').includes(cls)) out.push(n); }); return out; };
for (const f of ['core-derivatives', 'product-rule', 'quotient-rule', 'trig-network']) {
  const def = (await import('file:///C:/Users/moss/Desktop/CHSchat/extensions/school/ap-calc/visualizers/unit2/' + f + '.js')).default;
  const host = makeNode('div');
  mountWorkspace(host, def);
  const errs = () => find(host, 'calc-pane-body').filter(b => b.textContent.includes('Render error'));
  const jump = find(host, 'step-jump')[0];
  const n = (def.steps || []).length;
  for (let i = 0; i <= n; i++) { jump.value = String(i); jump._ev.blur(); if (errs().length) console.log(f, 'step', i, errs()[0].textContent.slice(0, 120)); }
  find(host, 'cv-slider').forEach(sl => {
    [sl.attr_min, String((parseFloat(sl.attr_min) + parseFloat(sl.attr_max)) / 2), sl.attr_max].forEach(v => {
      sl.value = v; sl._ev.input({ target: sl });
      if (errs().length) console.log(f, 'slider', v, errs()[0].textContent.slice(0, 120));
    });
  });
  find(host, 'cv-ctl-opts').forEach(box => box.children.forEach(b => {
    b._ev.click();
    if (errs().length) console.log(f, 'choice', b.textContent, errs()[0].textContent.slice(0, 120));
  }));
  console.log('checked', f);
}
