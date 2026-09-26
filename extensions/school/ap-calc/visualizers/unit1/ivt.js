/* 1.16 IVT Crossing Explorer — a continuous curve cannot skip heights.
   Existence guaranteed; location and uniqueness NOT. The interval [a, b]
   is under student control, and the y-frame auto-fits the endpoint heights
   so f(a) and f(b) can never be drawn offscreen. */

const FUNCS = {
    cubic: { label: 'continuous cubic x³−2x', f: (x) => x * x * x - 2 * x, cont: true },
    broken: { label: 'discontinuous jump', f: (x) => x < 0.4 ? x - 1.5 : x + 0.5, cont: false },
    wavy: { label: 'continuous 2.2sin(2.2x)', f: (x) => 2.2 * Math.sin(2.2 * x), cont: true }
};

/* slider ranges keep the broken case's leap (x = 0.4) inside every interval */
const X0 = -1.7, X1 = 2.4;

export default {
    id: 'u1-ivt',
    meta: { unit: 1, topic: '1.16', title: 'Working with the Intermediate Value Theorem (IVT)', visualizerTitle: 'IVT Crossing Explorer' },
    intro: 'The IVT says a function continuous on the closed interval [a, b] cannot skip heights between f(a) and f(b). If the target height d lies between those two heights, at least one crossing exists. The theorem promises no location and no count, so drag a, b and d and check the hypotheses.',
    params: { kase: 'cubic', d: 0, a: -1.5, b: 2.2 },
    controls: [
        {
            key: 'kase', label: 'curve', kind: 'choice',
            options: Object.keys(FUNCS).map(k => ({ v: k, label: FUNCS[k].label }))
        },
        { key: 'a', label: 'left endpoint a', min: -1.6, max: 0.2, step: 0.05 },
        { key: 'b', label: 'right endpoint b', min: 1.0, max: 2.3, step: 0.05 },
        { key: 'd', label: 'target height d', min: -2.6, max: 2.6, step: 0.05 }
    ],
    fns: {
        f: (x, env) => FUNCS[env.kase].f(x)
    },
    compute: env => {
        const c = FUNCS[env.kase];
        const fa = c.f(env.a), fb = c.f(env.b);
        const between = (env.d - fa) * (env.d - fb) <= 0;
        const cross = crossings(c, env.d, env.a, env.b);
        let lo = Math.min(fa, fb, env.d), hi = Math.max(fa, fb, env.d);
        for (let i = 0; i <= 200; i++) {
            const y = c.f(env.a + (env.b - env.a) * i / 200);
            if (Number.isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
        }
        const pad = 0.12 * Math.max(1, hi - lo);
        return { fa, fb, between, cross, win: [X0, X1, lo - pad, hi + pad] };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'Graph of y = f(x) on [a, b]', height: 340,
                window: env => env.win,
                curves: env => FUNCS[env.kase].cont
                    ? [{ fn: 'f', color: 'curveA', samples: 600 }]
                    : [
                        { fn: 'f', from: X0, to: 0.35, samples: 300, color: 'curveA' },
                        { fn: 'f', from: 0.45, to: X1, samples: 300, color: 'curveA' }
                    ],
                hlines: env => [{ y: env.d, color: 'accent', label: 'target y = d' }],
                points: env => {
                    const c = FUNCS[env.kase];
                    const out = [
                        { x: env.a, y: env.fa, color: 'ink', label: 'f(a)' },
                        { x: env.b, y: env.fb, color: 'ink', label: 'f(b)' }
                    ];
                    if (!c.cont) { out.push({ x: 0.4, y: c.f(0.39), open: true, color: 'down' }); out.push({ x: 0.4, y: c.f(0.41), color: 'down', label: 'the jump' }); }
                    env.cross.forEach((x, i) => out.push({ x, y: env.d, color: 'up', label: i === 0 ? 'crossing' : '', r: 4 }));
                    return out;
                },
                vband: env => [{ from: env.a, to: env.b, color: 'fillB' }]
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'IVT hypotheses',
                items: env => {
                    const c = FUNCS[env.kase];
                    return [
                        { t: 'Is f continuous on the closed interval [a, b]?', state: c.cont },
                        { t: 'Does d lie between f(a) = ' + round2(env.fa) + ' and f(b) = ' + round2(env.fb) + '?', state: env.between },
                        { t: 'Conclusion: at least one c in [a, b] has f(c) = d', state: c.cont && env.between }
                    ];
                },
                verdict: env => {
                    const c = FUNCS[env.kase];
                    if (!c.cont) return 'No guarantee. The function is not continuous on the closed interval [a, b].';
                    if (!env.between) return 'No guarantee. The target height d lies outside the heights f(a) and f(b).';
                    return 'Guaranteed. At least one c in [a, b] has f(c) = d, and the theorem says nothing about where or how many.';
                },
                verdictOk: env => FUNCS[env.kase].cont && env.between
            },
            {
                kind: 'readout', title: 'Endpoint heights and crossings',
                items: env => {
                    const c = FUNCS[env.kase];
                    return [
                        { label: 'height f(a) at x = ' + round2(env.a), v: env.fa }, { label: 'height f(b) at x = ' + round2(env.b), v: env.fb },
                        { label: 'target height d', v: env.d, color: 'accent' },
                        { label: 'crossings shown', v: env.cross.length, color: 'up' }
                    ];
                }
            }
        ]
    },
    steps: [
        {
            params: { kase: 'cubic', d: 0, a: -1.5, b: 2.2 },
            message: env => 'This cubic is continuous everywhere, with f(a) = ' + round2(env.fa) + ' and f(b) = ' + round2(env.fb) + '. The shaded band marks the interval [a, b]. Drag a and b to move the ends of that interval.'
        },
        {
            params: { d: 0, a: -1.5, b: 2.2 },
            predict: {
                q: env => 'The readings are f(a) = ' + round2(env.fa) + ' and f(b) = ' + round2(env.fb) + '. The function is continuous on the closed interval [a, b]. Does the IVT guarantee at least one root here?',
                choices: ['Yes. The height 0 lies between the two endpoint heights, and a continuous function cannot skip that height.', 'No. A root also needs the slope of the function to change sign.', 'Only sometimes. The guarantee holds only when the function is increasing on [a, b].'], a: 0,
                why: 'A function that is continuous on [a, b] takes every height between f(a) and f(b). The height 0 lies between these two endpoint heights, so at least one c in [a, b] has f(c) = 0. That is a guarantee of existence, not a calculation of the root.'
            },
            message: 'A green dot marks where the curve meets the target height d. The dot is read off the sampled curve, so its position is only an approximation, and the IVT itself gives no location. Drag d to try other heights and drag a and b to change the interval.'
        },
        { params: { d: -2.5, a: -1.5, b: 2.2 }, message: 'Move the target height d below f(a), so d lies outside the two endpoint heights. The hypotheses panel fails a check, so the IVT no longer applies. The crossings count reads 0, and that is allowed: when a hypothesis fails the theorem simply says nothing.' },
        { params: { d: 0, a: -1.5, b: 2.2 }, message: 'The target height d is back between f(a) and f(b), so the conclusion is guaranteed again. The IVT promises at least one c and gives neither the location nor the count. This cubic shows three green crossing dots for the same target height.' },
        {
            params: { kase: 'broken', a: -1.5, b: 2.2 },
            predict: {
                q: 'The next curve jumps over the height 0 between the two endpoints, so it is not continuous there. The endpoints still straddle 0. Does the IVT guarantee a crossing for that curve?',
                choices: ['No. The function is not continuous on the closed interval [a, b], so the IVT never applies.', 'Yes. The endpoints still straddle 0, so a crossing is guaranteed.', 'Yes, but only sometimes. A small enough jump still passes through the height 0.'], a: 0,
                why: 'Both hypotheses are needed, and continuity is one of them. A function with a jump can skip the target height, so the straddle of the two endpoints proves nothing on its own.'
            },
            message: 'The endpoints straddle 0, yet the curve jumps over 0 and no crossing appears. Without continuity the IVT gives no conclusion, so this curve is a counterexample. The jump at x = 0.4 stays inside every interval here, since a never passes 0.2 and b never passes 1.0.'
        },
        {
            params: { kase: 'wavy', d: 0, a: -1.5, b: 2.2 },
            predict: {
                q: 'Suppose a function is continuous on [a, b] and the target height d lies between f(a) and f(b). How many solutions does the IVT promise?',
                choices: ['At least one, and possibly more. The IVT does not fix the count.', 'Exactly one. A continuous function reaches the target height just once.', 'Three. The count comes from the crossing dots that appear on the graph.'], a: 0,
                why: 'Counting solutions is not what the IVT does. The wavy curve here shows three crossings, and the theorem still certifies only that at least one exists. A claim of exactly one needs monotonicity as well, which is a separate argument.'
            },
            message: 'Slide b to the left and watch the crossing count fall while the guarantee still holds. The justification reads: f is continuous on [a, b], and d lies between f(a) and f(b). The IVT then gives at least one c with f(c) = d, and that is all it gives.'
        }
    ],
    summary: {
        idea: 'The IVT is an existence theorem. Continuity on the closed interval [a, b], plus a target height d between f(a) and f(b), guarantees at least one crossing. It guarantees neither the location of that crossing nor how many there are.',
        mistake: 'The usual mistake is to use the IVT to claim exactly one solution, or to name where the solution sits. The IVT only guarantees existence, and it applies only when continuity holds on the whole closed interval [a, b].',
        transfer: 'Suppose f is continuous on the closed interval [2, 5], with f(2) = −3 and f(5) = 7. What can you conclude about the equation f(x) = 1? What can you not conclude without more information?'
    }
};

function crossings(c, d, a, b) {
    const out = [];
    const n = 600;
    let prev = c.f(a) - d;
    for (let i = 1; i <= n; i++) {
        const x = a + (b - a) * i / n;
        const v = c.f(x) - d;
        if (Number.isFinite(prev) && Number.isFinite(v) && prev * v <= 0 && (prev !== 0 || i > 1)) {
            const xp = x - (b - a) / n;
            if (!c.cont && xp <= 0.4 && x >= 0.4) { prev = v; continue; }
            out.push(x - v / ((v - prev) / ((b - a) / n)) * ((b - a) / n));
        }
        prev = v;
    }
    /* a root landing exactly on a sample split the sign test across two
       consecutive intervals; keep one dot per root */
    const uniq = out.filter((x, i) => i === 0 || Math.abs(x - out[i - 1]) > (b - a) / n);
    return uniq.slice(0, 6);
}
function round2(v) { return String(Math.round(v * 100) / 100); }
