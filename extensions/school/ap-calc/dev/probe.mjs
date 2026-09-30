/* Label-geometry probe for the visual lab, run inside a real browser.
   Mounts a topic through the course shell, walks every tab and every screen,
   and reports text boxes that overlap, text clipped by its viewBox, graph and
   number-line layers that disagree on where an x-value lands, and attributes
   that rendered NaN or undefined.

   Usage, on http://127.0.0.1:8907/extensions/school/ap-calc/AP%20Calculus%20Visual%20Lab.html:

     const m = await import('/extensions/school/ap-calc/dev/probe.mjs');
     return await m.run(['5.1', '5.2']);

   Number-line tick labels are start-anchored while graph tick labels are centred,
   so alignment compares the number-line box's left edge to the graph box's centre.
   A number-line probe label is clamped to the top row and loses ~1px of empty
   font box, which is why the overflow threshold is 2px rather than 0. */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function run(TIDS, opts = {}) {
    const root = document.getElementById('topicBody');
    const report = [];
    for (const TID of TIDS) {
        const rows = [];
        const snapshot = (tag) => {
            const svgs = [...root.querySelectorAll('svg')];
            const layers = [];
            svgs.forEach(svg => {
                const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
                const card = svg.closest('.calc-pane');
                const pane = card ? ((card.querySelector('.card-label') || {}).textContent || '?') : 'root';
                const ts = [...svg.querySelectorAll('text')].map(t => ({ b: t.getBBox(), s: t.textContent }));
                ts.forEach(o => {
                    const b = o.b;
                    if (b.x < -2 || b.y < -2 || b.y + b.height > vb[3] + 2 || b.x + b.width > vb[2] + 2)
                        rows.push(Object.assign({ kind: 'overflow' }, tag, { pane, s: o.s, x: +b.x.toFixed(1), y: +b.y.toFixed(1), vb: vb.join(',') }));
                });
                for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
                    const a = ts[i].b, c = ts[j].b;
                    const ox = Math.min(a.x + a.width, c.x + c.width) - Math.max(a.x, c.x);
                    const oy = Math.min(a.y + a.height, c.y + c.height) - Math.max(a.y, c.y);
                    if (ox > 2 && oy > 2) rows.push(Object.assign({ kind: 'overlap' }, tag, { pane, a: ts[i].s, b: ts[j].s, ox: +ox.toFixed(1), oy: +oy.toFixed(1) }));
                }
                const r = svg.getBoundingClientRect();
                layers.push({
                    r, pane, vbW: vb[2],
                    nl: [...svg.querySelectorAll('text.cv-ticktext')],
                    gr: [...svg.querySelectorAll('g.cv-ticklabels text')].filter(t => t.getAttribute('text-anchor') === 'middle'),
                    anchor: (el, mode) => {
                        const q = el.getBoundingClientRect();
                        /* a numberline tick is start-anchored, so its LEFT edge is the
                           value's pixel; a graph tick is centred, so its CENTRE is.
                           Comparing those two is comparing true positions; using
                           centre-to-centre here reads half a glyph as misalignment */
                        return (mode === 'nl' ? q.left - r.left : ((q.left + q.right) / 2 - r.left)) / r.width * vb[2];
                    }
                });
            });
            for (const A of layers) for (const B of layers) {
                if (A === B || !A.gr.length || !B.nl.length) continue;
                if (Math.abs(A.r.left - B.r.left) > 1 || Math.abs(A.r.width - B.r.width) > 1) continue;
                const at = {};
                B.nl.forEach(t => { at[t.textContent] = B.anchor(t, 'nl'); });
                A.gr.forEach(t => {
                    if (at[t.textContent] === undefined) return;
                    const d = Math.abs(A.anchor(t, 'gr') - at[t.textContent]);
                    if (d > 1.5) rows.push(Object.assign({ kind: 'align' }, tag, { pane: A.pane, label: t.textContent, d: +d.toFixed(2) }));
                });
            }
            root.querySelectorAll('*').forEach(n => {
                if (!n.attributes) return;
                for (const at of n.attributes) if (/NaN|undefined/.test(String(at.value)))
                    rows.push(Object.assign({ kind: 'badattr' }, tag, { el: n.tagName, at: at.name, v: String(at.value).slice(0, 40) }));
            });
            if (opts.screens) rows.push(Object.assign({ kind: 'screen' }, tag, { panes: svgs.map(s => { const c = s.closest('.calc-pane'); return c ? ((c.querySelector('.card-label') || {}).textContent || '?') : 'root'; }) }));
        };
        document.querySelector('.topic[data-tid="' + TID + '"]').click();
        await sleep(1600);
        const tabs = [...root.querySelectorAll('.mode-tabs > .mode-tab')].map(t => t.textContent);
        const n = tabs.length || 1;
        let screens = 0;
        for (let ti = 0; ti < n; ti++) {
            if (tabs.length) { [...root.querySelectorAll('.mode-tabs > .mode-tab')][ti].click(); await sleep(700); }
            const jump = root.querySelector('.step-jump');
            if (!jump) continue;
            const total = (jump.parentElement.textContent.match(/\/\s*(\d+)/) || [])[1] | 0;
            for (let s = 0; s <= total; s++) {
                jump.value = String(s);
                jump.dispatchEvent(new Event('blur'));
                await sleep(60);
                snapshot({ tab: ti, tabLabel: tabs[ti] || 'single', screen: s });
                screens++;
            }
        }
        const counts = {};
        rows.forEach(r => { counts[r.kind] = (counts[r.kind] || 0) + 1; });
        delete counts.screen;
        const seen = {};
        const unique = [];
        rows.forEach(r => {
            const k = r.kind + '|' + (r.pane || '') + '|' + (r.s || r.label || (r.a + '~' + r.b)) + '|' + (r.x || r.d || r.ox);
            if (r.kind === 'screen' || seen[k]) return;
            seen[k] = 1;
            unique.push(r);
        });
        report.push({ tid: TID, tabs: tabs.length, screens, counts, unique: unique.slice(0, opts.detail === 'all' ? unique.length : (opts.detail ? 40 : 8)) });
    }
    return report;
}
