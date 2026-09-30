/* per-screen walk for 5.11 optimization solver (runtime merge rules):
   screen idx shows env = params + steps[0..idx-1].params, narrates
   steps[idx-1].message, and asks steps[idx].predict. Prints every visible
   string so answers can be checked against the reveal order, and flags
   em-dashes, semicolons, NaN/undefined leaks and non-color tokens. */

const def = (await import('./visualizers/unit5/optimization-solver-lab.mjs')).default;
const COLORS = new Set(['curveA', 'curveC', 'accent', 'up', 'down', 'ink', 'auxInk', 'fillA']);
const bad = [];
const scan = (s, where) => {
    if (s == null) return;
    if (typeof s === 'number') { if (!Number.isFinite(s)) bad.push(where + ' = ' + s); return; }
    const v = String(s);
    if (/—|–/.test(v)) bad.push(where + ' ENDASH: ' + v);
    if (/;/.test(v)) bad.push(where + ' SEMI: ' + v);
    if (/NaN|undefined|Infinity/.test(v)) bad.push(where + ' LEAK: ' + v);
};
const R = (x, env) => typeof x === 'function' ? x(env) : x;

for (const m of def.modes) {
    const steps = m.steps || [];
    console.log('\n================ MODE: ' + m.label + ' (' + steps.length + ' steps)');
    for (let idx = 0; idx <= steps.length; idx++) {
        const env = Object.assign({}, m.params);
        for (let i = 0; i < idx; i++) Object.assign(env, steps[i].params || {});
        const say = idx > 0 ? steps[idx - 1].message : m.intro;
        const pr = idx < steps.length ? steps[idx].predict : null;
        console.log('\n--- screen ' + idx + ' stage=' + env.stage);
        console.log('  SAY : ' + R(say, env));
        if (pr) console.log('  ASK : ' + R(pr.q, env));
        scan(say && R(say, env), 'say');
        if (pr) { pr.choices.forEach((c, i) => { scan(R(c, env), 'choice' + i); if (pr.whyBy) scan(R(pr.whyBy[i], env), 'whyBy' + i); }); }
        const vis = [];
        for (const col of ['main', 'side']) {
            for (const p of ((m.panes || {})[col] || [])) {
                if (p.when && !p.when(env)) continue;
                const title = R(p.title, env);
                vis.push(col + ':' + p.kind + '<' + (title || '') + '>');
                scan(title, 'title');
                if (p.lines) R(p.lines, env).forEach((l, i) => { scan(R(l.t, env), 'line' + i); if (l.color && !COLORS.has(l.color)) bad.push('bad eq color ' + l.color); });
                if (p.cols) R(p.cols, env).forEach(c => scan(c, 'col'));
                if (p.rows) R(p.rows, env).forEach((r, i) => r.forEach(c => scan(typeof c === 'object' ? R(c.v, env) : c, 'row' + i)));
                if (p.note) scan(R(p.note, env), 'tablenote');
                if (p.items) R(p.items, env).forEach((it, i) => { scan(R(it.label, env), 'ro-label' + i); scan(R(it.v, env) ?? (it.v && R(it.v())), 'ro-v' + i); scan(R(it.unit, env), 'ro-unit' + i); if (it.color && !COLORS.has(it.color)) bad.push('bad ro color ' + it.color); });
                if (p.text) scan(R(p.text, env), 'note-text');
                if (p.verdict) scan(R(p.verdict, env), 'verdict');
                if (p.sides) R(p.sides, env).forEach((sd, i) => { scan(R(sd.title, env), 'sdtitle' + i); (sd.lines || []).forEach(l => scan(R(l, env), 'sdline')); });
                if (p.stages) R(p.stages, env).forEach(s => scan(R(s.box, env), 'mbox'));
                (R(p.curves, env) || []).forEach(c => { if (c.color && !COLORS.has(c.color)) bad.push('bad curve color ' + c.color); scan(R(c.label, env), 'curveLabel'); });
                (R(p.vlines, env) || []).forEach(v => { scan(R(v.label, env), 'vline'); if (!Number.isFinite(v.x)) bad.push('vline x ' + v.x); });
                (R(p.hlines, env) || []).forEach(v => { scan(R(v.label, env), 'hline'); if (!Number.isFinite(v.y)) bad.push('hline y ' + v.y); });
                (R(p.points, env) || []).forEach(pt => { scan(R(pt.label, env), 'point'); if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) bad.push('point NaN ' + pt.x + ',' + pt.y); });
                (R(p.notes, env) || []).forEach(nt => { scan(R(nt.t, env), 'note-glyph'); if (nt.color && !COLORS.has(nt.color)) bad.push('bad note color ' + nt.color); });
                (R(p.segments, env) || []).forEach(s => ['x1', 'y1', 'x2', 'y2'].forEach(k => { if (!Number.isFinite(s[k]) || s[k] < 0) bad.push('seg ' + k + '=' + s[k]); }));
                (R(p.areas, env) || []).forEach(a => ['from', 'to'].forEach(k => { const val = R(a[k], env); if (!Number.isFinite(val)) bad.push('area ' + k + '=' + val); }));
                if (p.bands) R(p.bands, env).forEach(b => { scan(R(b.label, env), 'nlband'); if (b.color && !COLORS.has(b.color)) bad.push('bad band color ' + b.color); });
                if (p.probes) R(p.probes, env).forEach(pb => { if (!Number.isFinite(R(pb.x, env))) bad.push('probe x'); if (pb.label) bad.push('probe has label'); });
                if (p.window) { const w = R(p.window, env); if (w.some(v => !Number.isFinite(v))) bad.push('window NaN'); }
            }
        }
        console.log('  SEE : ' + vis.join(' | '));
    }
    if (m.summary) for (const [k, v] of Object.entries(m.summary)) { (Array.isArray(v) ? v : [v]).forEach(s => scan(s, 'summary.' + k)); }
}
console.log('\n' + (bad.length ? 'ISSUES:\n' + [...new Set(bad)].join('\n') : 'CLEAN: no em-dash/semicolon/NaN/undefined/bad-color/bad-geometry in any reachable screen'));
