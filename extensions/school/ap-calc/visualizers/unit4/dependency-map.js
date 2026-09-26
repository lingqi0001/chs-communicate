/* 4.4 Related Rates Dependency Map — the band the edge sweeps IS the real ΔA.
   Cut it open and straighten it and it is a trapezoid: the rectangle inside it
   is what the rate equation predicts (2πr·Δr), the thin triangle is what it
   cannot see (π(Δr)²), and that triangle dies faster than the band does. */

function geo(env) {
    const r = Math.max(env.r, 0.05);
    const dr = env.drdt * env.dt;
    const rg = Math.max(0.02, r + dr);
    const a = Math.min(r, rg), b = Math.max(r, rg);
    const w = b - a;
    /* unrolled band: outer edge on the ground, both edges starting at x = 0 */
    const Cs = 2 * Math.PI * a;       /* inner (shorter) circumference */
    const Cb = 2 * Math.PI * b;       /* outer (longer) circumference */
    const Cp = 2 * Math.PI * r;       /* what dA/dt · Δt measures with */
    const slant = x => w - (x - Cs) / (2 * Math.PI);
    const top = x => (x <= Cs ? w : Math.max(0, slant(x)));
    return { r, rg, dr, w, a, b, Cs, Cb, Cp, grow: rg >= r, slant, top };
}

export default {
    id: 'u4-dependency-map',
    meta: { unit: 4, topic: '4.4', title: 'Introduction to Related Rates', visualizerTitle: 'Related Rates Dependency Map' },
    intro: 'A circle grows at dr/dt. Drag the edge of the circle, the rate dr/dt, and the time step Δt. The shaded band between the two circles is the area actually gained. The orange wedge is the part the rate equation misses, and it shrinks faster than the band does.',
    params: { r: 2.5, drdt: 1, dt: 0.6, focus: 1 },
    compute: (env) => {
        const g = geo(env);
        return Object.assign({}, g, {
            A: Math.PI * g.r * g.r,
            A_next: Math.PI * g.rg * g.rg,
            dA_real: Math.PI * g.rg * g.rg - Math.PI * g.r * g.r,
            predict: 2 * Math.PI * g.r * g.dr,
            leftover: Math.PI * g.w * g.w,
            dAdt: 2 * Math.PI * g.r * env.drdt
        });
    },
    controls: [
        { key: 'r', label: 'Radius r', min: 0.5, max: 5, step: 0.05, unit: ' cm' },
        { key: 'drdt', label: 'Rate of change of radius dr/dt', min: -2, max: 2, step: 0.05, unit: ' cm/s' },
        { key: 'dt', label: 'Time step Δt', min: 0, max: 1.5, step: 0.02, unit: ' s' }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'The circle now, and the circle ' + r2(env.dt) + ' s later', height: 350,
                window: [-5.6, 5.6, -5.6, 5.6], grid: false, ticks: false,
                curves: (env) => [
                    { fn: x => Math.sqrt(Math.max(0, env.rg * env.rg - x * x)), color: 'aux', dashed: true },
                    { fn: x => -Math.sqrt(Math.max(0, env.rg * env.rg - x * x)), color: 'aux', dashed: true },
                    { fn: x => Math.sqrt(Math.max(0, env.r * env.r - x * x)), color: 'curveA', label: env => 'r = ' + r2(env.r) },
                    { fn: x => -Math.sqrt(Math.max(0, env.r * env.r - x * x)), color: 'curveA' }
                ],
                /* the swept band, drawn where it actually is */
                areas: (env) => {
                    if (env.w < 0.004) return [];
                    const q = (x) => Math.sqrt(Math.max(0, env.b * env.b - x * x));
                    const p = (x) => Math.sqrt(Math.max(0, env.a * env.a - x * x));
                    return [
                        { fn: p, topFn: q, from: -env.a, to: env.a, color: 'fillA' },
                        { fn: x => -p(x), topFn: x => -q(x), from: -env.a, to: env.a, color: 'fillA' },
                        { fn: x => -q(x), topFn: q, from: env.a, to: env.b, color: 'fillA' },
                        { fn: x => -q(x), topFn: q, from: -env.b, to: -env.a, color: 'fillA' }
                    ];
                },
                segments: (env) => [
                    { x1: 0, y1: 0, x2: env.r, y2: 0, color: 'ink' },
                    { x1: env.r, y1: 0, x2: env.rg, y2: 0, color: 'aux', dashed: true }
                ],
                points: (env) => [
                    { x: 0, y: 0, color: 'auxInk', r: 3 },
                    { x: env.r, y: 0, color: 'ink', label: 'drag to change r', drag: { key: 'r', min: 0.5, max: 5, transform: (e, raw) => Math.abs(raw) } }
                ],
                notes: (env) => [
                    { x: env.rg * 0.72, y: env.rg * 0.72, t: env => env.w < 0.004 ? '' : (env.grow ? 'Area gained: ' : 'Area lost: ') + r1(Math.abs(env.dA_real)) + ' cm²' }
                ]
            },
            {
                kind: 'graph', title: 'The same band, cut open and laid flat', height: 260,
                window: (env) => [-0.5, Math.max(env.Cp, env.Cb) * 1.1 + 1, -0.06 * Math.max(env.w, 0.35), Math.max(0.35, Math.min(3.2, env.w * 1.7))],
                grid: false, ticks: false,
                curves: (env) => [
                    { fn: env.top, from: env.Cs, to: env.Cb, color: 'curveA', label: env => env.w < 0.004 ? '' : 'outer edge, 2π(r+Δr)' },
                    { fn: x => 0, from: -0.4, to: Math.max(env.Cp, env.Cb) * 1.05, color: 'auxInk' }
                ],
                areas: (env) => {
                    if (env.w < 0.004) return [];
                    const band = { fn: x => 0, topFn: env.top, from: 0, to: env.Cb, color: 'fillA' };
                    const odd = env.grow
                        ? { fn: x => 0, topFn: env.slant, from: env.Cs, to: env.Cb, color: 'fillB' }
                        : { fn: env.slant, topFn: x => env.w, from: env.Cs, to: env.Cb, color: 'fillB' };
                    return [band, odd];
                },
                segments: (env) => [
                    { x1: 0, y1: env.w, x2: env.Cs, y2: env.w, color: 'curveA' },
                    { x1: env.Cp, y1: 0, x2: env.Cp, y2: env.w, color: 'auxInk', dashed: true },
                    { x1: 0, y1: env.w, x2: env.Cp, y2: env.w, color: 'auxInk', dashed: true }
                ],
                notes: (env) => [
                    { x: 0.3, y: env.w * 0.55, t: env => 'Linear estimate 2πr · Δr = ' + r1(Math.abs(env.predict)) + ' cm²' },
                    { x: env.Cs + 0.4, y: env.grow ? env.w * 0.25 : env.w * 0.8, t: env => env.w < 0.004 ? '' : 'Missed by π(Δr)² = ' + r2(env.leftover) + ' cm²' },
                    { x: 0.3, y: -0.02 * Math.max(env.w, 0.35), t: env => 'Distance around the edge (cm) · band width Δr = ' + r2(Math.abs(env.dr)) + ' cm' }
                ]
            },
            {
                kind: 'machine', title: 'Dependency chain: each rate carries the one before it',
                stages: env => [
                    { box: 't', in: 'seconds', rate: '1 s/s' },
                    { box: 'r', in: r2(env.r) + ' cm', rate: 'dr/dt = ' + r2(env.drdt) },
                    { box: 'A = πr²', in: r1(env.A) + ' cm²', rate: 'dA/dt = ' + r1(env.dAdt) }
                ],
                focus: env => env.focus
            }
        ],
        side: [
            {
                kind: 'eq', title: 'From values to rates',
                lines: env => [
                    { t: 'A = πr²   →   dA/dt = 2πr · dr/dt', rule: 'the same relationship, in rates' },
                    { t: 'Actual change ΔA = ' + r1(env.dA_real) + ' cm² · linear estimate 2πr·Δr = ' + r1(env.predict) + ' cm²', hl: env.w > 0.004 },
                    { t: Math.abs(env.drdt) < 0.03 ? 'dr/dt = 0 → dA/dt = 0, however large the circle' : 'The π(Δr)² wedge is ' + r2(env.leftover) + ' cm², which is ' + r1(env.predict ? 100 * env.leftover / Math.abs(env.predict) : 0) + '% of the estimate', color: 'aux' }
                ]
            },
            {
                kind: 'practice', id: 'factor', title: 'The chain rule factor',
                items: env => [
                    {
                        q: 'Differentiate r² with respect to time. What does d/dt [ r² ] equal?',
                        choices: ['2r · dr/dt', '2r', '2r · dt/dr'], a: 0,
                        why: 'Because r is a function of t, the power step gives 2r and the chain rule multiplies by dr/dt. Right now 2r = ' + r2(2 * env.r) + ', while dA/dt = π · ' + r2(2 * env.r) + ' · ' + r2(env.drdt) + ' = ' + r1(env.dAdt) + '.'
                    }
                ]
            },
            {
                kind: 'compare', title: 'Same radial rate, two circles',
                sides: [
                    {
                        title: 'r = 1, dr/dt = 2',
                        graph: {
                            height: 165, window: [-2.4, 2.4, -2.4, 2.4], grid: false, ticks: false,
                            curves: [{ fn: x => Math.sqrt(Math.max(0, 1 - x * x)), color: 'curveA' }, { fn: x => -Math.sqrt(Math.max(0, 1 - x * x)), color: 'curveA' }],
                            segments: [{ x1: 0, y1: 0, x2: 1, y2: 0, color: 'ink' }],
                            notes: [{ x: -2.2, y: 2.1, t: 'dA/dt = 4π ≈ 12.6 cm²/s' }]
                        }
                    },
                    {
                        title: 'r = 5, dr/dt = 2',
                        graph: {
                            height: 165, window: [-2.4, 2.4, -2.4, 2.4], grid: false, ticks: false,
                            curves: [{ fn: x => Math.sqrt(Math.max(0, 2.89 - x * x)), color: 'curveA' }, { fn: x => -Math.sqrt(Math.max(0, 2.89 - x * x)), color: 'curveA' }],
                            segments: [{ x1: 0, y1: 0, x2: 1.7, y2: 0, color: 'ink' }],
                            notes: [{ x: -2.2, y: 2.1, t: 'r = 5 (drawn smaller), dA/dt = 20π ≈ 62.8 cm²/s' }]
                        }
                    }
                ],
                verdict: 'Both edges move outward at 2 cm/s, but the larger circle gains about five times as much area, because its edge is five times longer: dA/dt = 2πr · dr/dt.'
            }
        ]
    },
    steps: [
        {
            params: { focus: 1, r: 2.5, drdt: 1, dt: 0.6 },
            message: 'Drag the edge of the circle. Nothing pushes on the area directly: the area follows r through A = πr², so the only rate that starts the chain is dr/dt.'
        },
        {
            params: { dt: 0 },
            message: 'With a time step of 0 there is no band and nothing to measure. Press Next to let time move forward.'
        },
        {
            params: { dt: 0.6 },
            message: env => 'The band is the area the circle really gains: ' + r1(Math.abs(env.dA_real)) + ' cm². The dashed rectangle is what the rate equation predicts: 2πr · Δr = ' + r1(Math.abs(env.predict)) + ' cm². The orange wedge is the difference between them.'
        },
        {
            params: { dt: 0.15 },
            message: env => 'Now shrink the time step. Halving it halves the band but leaves only a quarter of the wedge. At Δt = ' + r2(env.dt) + ' s the wedge is ' + r1(100 * env.leftover / (env.predict || 1)) + '% of the estimate, and as the step goes to 0 only 2πr · dr/dt is left.'
        },
        {
            params: { focus: 2, drdt: 1.5, dt: 0.6 },
            predict: {
                q: 'Circle A has r = 1, circle B has r = 5. Both grow at dr/dt = 2 cm/s. Which circle’s area is increasing faster?',
                choices: ['Circle B. Its edge is five times longer.', 'Circle A. The smaller circle gains area faster.', 'They gain area at the same rate. dr/dt is equal.'], a: 0,
                why: 'dA/dt = 2πr · dr/dt. With the same rate dr/dt, the radius decides: the same edge motion sweeps about five times more area where the edge is five times longer.'
            },
            message: 'Compare the two circles in the panel below. The step Δr is the same, the edge is five times longer, and the area grows five times faster.'
        },
        {
            params: { focus: 1, r: 4, drdt: 0, dt: 1 },
            predict: {
                q: 'The radius is large at r = 4, but dr/dt = 0 at this instant. What is dA/dt?',
                choices: ['0 cm²/s. No radial rate means no area rate.', 'Large. The radius r = 4 is large.', 'πr² = 16π cm²'], a: 0,
                why: 'Each rate carries the one before it, so dA/dt = 2π(4)(0) = 0. The area stays at 16π ≈ 50.3 cm² and does not change at that instant.'
            },
            message: 'With dr/dt = 0 the band has no width at any time step. A large quantity with a zero rate is simply large.'
        },
        {
            params: { focus: 1, drdt: -1, dt: 0.6 },
            message: env => 'Now let the circle shrink. The band is the area lost, and the wedge moves to the other side of the dashed line. The estimate of ' + r1(Math.abs(env.predict)) + ' cm² is larger than the ' + r1(Math.abs(env.dA_real)) + ' cm² really lost, again by exactly π(Δr)².'
        },
        {
            params: { focus: 2, r: 2.5, drdt: 1, dt: 0.6 },
            predict: {
                q: 'Now use a growing sphere with volume V = (4/3)πr³. After you differentiate r³ with respect to time, which factor must appear next to 3r²?',
                choices: ['dr/dt', 'dt/dr', 'No extra factor'], a: 0,
                why: 'dV/dt = 4πr² · dr/dt. The power step gives 3r², and because r depends on t the factor dr/dt comes along with it.'
            },
            message: 'A sphere is one step up from a circle. The chain is still t → r → V, and the question is still which rate comes along.'
        }
    ],
    summary: {
        idea: 'Related rates come from a relationship among quantities that change with the same variable. Differentiating that relationship turns a statement about values into a statement about rates, and each rate carries the one before it.',
        mistake: 'Writing d/dt[r²] = 2r. The equation A = πr² links values, and because r itself depends on t the derivative must include the factor dr/dt. The opposite mistake is treating 2πr·Δr as the real change. That product is only the linear estimate, and it falls short by π(Δr)² for any nonzero step.',
        transfer: 'Take a sphere with V = (4/3)πr³. Name the chain t → r → V, then say which rate must appear after differentiating. Do not solve anything.'
    }
};

function r1(v) { return String(Math.round(v * 10) / 10); }
function r2(v) { return String(Math.round(v * 100) / 100); }
