/* 1.8 Squeeze Theorem Sandwich - the bounds, not the middle's shape, force
   the target. The middle may oscillate wildly and still be squeezed. Two
   probes at x = -h and x = +h close in on 0 together, and the shaded corridor
   between the bounds is the object that narrows to zero width. */

export default {
    id: 'u1-squeeze',
    meta: { unit: 1, topic: '1.8', title: 'Determining Limits Using the Squeeze Theorem', visualizerTitle: 'Squeeze Theorem Sandwich' },
    intro: 'The Squeeze Theorem concludes from two bounds near the point, not from the shape of the middle function. If a function stays between the bounds and both bounds have the same limit there, the middle function has that limit too. The inequalities only need to hold near the point, never at the point itself. The two sliders do different jobs. The distance h moves the probes, and the view half-width narrows the frame around x = 0 so you can inspect the corridor close up.',
    params: { h: 0.8, z: 1.7, kase: 'classic', verdict: 0 },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: [
                { v: 'classic', label: 'x²sin(1/x), bounds agree' },
                { v: 'split', label: 'x + 2, bounds disagree' }
            ]
        },
        { key: 'h', label: 'distance h from x = 0', min: 0.01, max: 1.6, step: 0.005 },
        /* The floor is 0.15, not lower: the axis formatter prints two decimals,
           and below that the y tick labels start repeating each other. */
        { key: 'z', label: 'view half-width around x = 0', min: 0.15, max: 1.7, step: 0.01 }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: 'The corridor between the bounds, with the middle function inside it', height: 350,
                window: (env) => env.kase === 'classic'
                    ? [-env.z, env.z, -1.35 * env.z * env.z, 1.35 * env.z * env.z]
                    : [-env.z, env.z, 2 - Math.max(1.2, 2 * env.z), 2 + Math.max(1.2, 2 * env.z)],
                vlines: (env) => [
                    { x: 0, color: 'aux', label: 'target x = 0' },
                    { x: -env.h, color: 'auxInk', label: 'probe x = −' + r2(env.h) },
                    { x: env.h, color: 'auxInk', label: 'probe x = ' + r2(env.h) }
                ],
                hlines: (env) => env.kase === 'classic'
                    ? [
                        { y: 0, color: 'up', label: 'target line y = 0' },
                        { y: env.h * env.h, color: 'auxInk', label: 'upper bound at both probes' },
                        { y: -env.h * env.h, color: 'auxInk', label: 'lower bound at both probes' }
                    ]
                    : [
                        { y: 1, color: 'down', label: 'lower bound: limit 1' },
                        { y: 3, color: 'down', label: 'upper bound: limit 3' }
                    ],
                /* The corridor is the live object: the space the middle function
                   is allowed to occupy. It spans the whole visible window, not
                   just the probe span, so zooming in keeps the funnel on screen. */
                areas: (env) => env.kase === 'classic'
                    ? [{ fn: (x) => -x * x, topFn: (x) => x * x, from: -env.z, to: env.z, samples: 160, color: 'fillB' }]
                    : [{ fn: (x) => x + 1, topFn: (x) => x + 3, from: -env.z, to: env.z, samples: 60, color: 'fillB' }],
                /* Label anchors ride the view width so they stay on screen when
                   the window narrows around the target. */
                curves: (env) => env.kase === 'classic' ? [
                    { fn: 'x^2', label: 'upper: x²', labelAt: 0.85 * env.z, color: 'curveB', dashed: true },
                    { fn: '-x^2', label: 'lower: −x²', labelAt: -0.85 * env.z, color: 'curveB', dashed: true },
                    { fn: 'x^2*sin(1/x)', label: 'middle', labelAt: 0.48 * env.z, color: 'curveA', samples: 2000 }
                ] : [
                    { fn: 'x + 3', label: 'upper: x + 3', labelAt: 0.85 * env.z, color: 'curveB', dashed: true },
                    { fn: 'x + 1', label: 'lower: x + 1', labelAt: -0.85 * env.z, color: 'curveB', dashed: true },
                    { fn: 'x + 2', label: 'middle: x + 2', labelAt: -0.41 * env.z, color: 'curveA' }
                ],
                points: (env) => {
                    const h = env.h;
                    /* Both handles write the same key, so either probe drags the
                       pair and the two sides always close in together. */
                    const grab = { key: 'h', transform: (e, raw) => Math.abs(raw), min: 0.01, max: 1.6 };
                    if (env.kase === 'classic') {
                        const up = (x) => x * x, low = (x) => -x * x, mid = (x) => x * x * Math.sin(1 / x);
                        return [
                            { x: -h, fn: up, color: 'aux' },
                            { x: -h, fn: low, color: 'aux' },
                            { x: -h, fn: mid, color: 'accent', label: 'middle at x = −h', drag: grab },
                            { x: h, fn: up, color: 'aux' },
                            { x: h, fn: low, color: 'aux' },
                            { x: h, fn: mid, color: 'accent', label: 'middle at x = +h', drag: grab }
                        ];
                    }
                    const up2 = (x) => x + 3, low2 = (x) => x + 1, mid2 = (x) => x + 2;
                    return [
                        { x: -h, fn: up2, color: 'aux' },
                        { x: -h, fn: low2, color: 'aux' },
                        { x: -h, fn: mid2, color: 'accent', label: 'middle at x = −h', drag: grab },
                        { x: h, fn: up2, color: 'aux' },
                        { x: h, fn: low2, color: 'aux' },
                        { x: h, fn: mid2, color: 'accent', label: 'middle at x = +h', drag: grab }
                    ];
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Values at the two probes',
                items: (env) => env.kase === 'classic' ? [
                    { label: 'upper x² at each probe', v: env.h * env.h, digits: 4 },
                    { label: 'middle at x = −h', v: -env.h * env.h * Math.sin(1 / env.h), color: 'accent', big: true, digits: 4 },
                    { label: 'middle at x = +h', v: env.h * env.h * Math.sin(1 / env.h), color: 'accent', big: true, digits: 4 },
                    { label: 'lower −x² at each probe', v: -env.h * env.h, digits: 4 },
                    { label: 'corridor width at each probe', v: 2 * env.h * env.h, digits: 4, color: 'down' },
                    ...viewRows(env)
                ] : [
                    { label: 'upper x + 3 at x = −h', v: 3 - env.h },
                    { label: 'middle x + 2 at x = −h', v: 2 - env.h, color: 'accent', big: true },
                    { label: 'lower x + 1 at x = −h', v: 1 - env.h },
                    { label: 'upper x + 3 at x = +h', v: 3 + env.h },
                    { label: 'middle x + 2 at x = +h', v: 2 + env.h, color: 'accent', big: true },
                    { label: 'lower x + 1 at x = +h', v: 1 + env.h },
                    { label: 'corridor width at each probe', v: 2, color: 'down' },
                    ...viewRows(env)
                ]
            },
            {
                kind: 'eq', title: 'Does the Squeeze Theorem apply?',
                lines: env => env.kase === 'classic' ? [
                    { t: 'For every x not equal to 0, −x² ≤ x² sin(1/x) ≤ x².', hl: true },
                    { t: 'The factor |sin(1/x)| is at most 1, so the middle function stays between the bounds.', rule: 'why the middle is bounded' },
                    { t: 'lim x→0 −x² = lim x→0 x² = 0', rule: 'both bounds have limit 0' },
                    ...(env.verdict > 0.5 ? [{ t: 'So lim x→0 x² sin(1/x) = 0. The limit needs no value of the middle function at x = 0.', hl: true, color: 'up' }] : [])
                ] : [
                    { t: 'The lower bound approaches 1 as x approaches 0, and the upper bound approaches 3.', color: 'down' },
                    { t: 'Because those two limits differ, the Squeeze Theorem gives no conclusion.', rule: 'the bounds must agree', color: 'down' },
                    { t: 'This middle function does approach 2, and the Squeeze Theorem is not the reason.' }
                ]
            }
        ]
    },
    steps: [
        { params: { kase: 'classic', h: 1.4, z: 1.7 }, message: 'The factor sin(1/x) has no limit at x = 0 because it keeps oscillating. The factor x² shrinks toward 0 and holds the product x² sin(1/x) between −x² and x². Slide the distance h toward 0 so both probes close in on the target line x = 0 together.' },
        { params: { h: 0.5, z: 0.6 }, message: 'Each probe now sits 0.5 from 0, and the view has narrowed to keep that neighbourhood on screen. At the probes the shaded corridor is 2h² wide, and every place between the probes is narrower than that. The middle function stays inside the corridor at both probes, and it cannot escape.' },
        {
            params: { h: 0.08, z: 0.16, verdict: 1 },
            predict: {
                q: 'The middle function keeps oscillating near x = 0 and never visibly settles. Does that stop the middle function from having the limit 0?',
                choices: ['No. The two bounds close in and squeeze the middle function toward 0.', 'Yes. A function that keeps oscillating near the point has no limit there.', 'Only later. The limit exists once the oscillation of the middle function stops.'], a: 0,
                why: 'The inequality holds for every x near 0 except 0 itself, and both bounds have the limit 0 there. The Squeeze Theorem then forces the middle limit to 0, whatever the oscillation does. The middle function has no value at x = 0, and a limit at 0 never asks for one.'
            },
            message: 'The view now spans only 0.16 around 0, so the middle function visibly swings instead of looking flat. Slide the distance h toward 0 and watch the readout. Both middle values keep swinging, while the shaded corridor around them closes to zero width on the target line y = 0. Narrow the view further and the swinging gets busier, never calmer, and the middle function still never leaves the corridor.'
        },
        {
            params: { kase: 'split', h: 0.9, z: 1.7 },
            predict: {
                q: 'Suppose the lower bound has limit 1 and the upper bound has limit 3. The middle function stays between them. Can the Squeeze Theorem give the middle function a limit?',
                choices: ['No. The two bounds must approach the same number before any limit follows.', 'Yes. Take the average of the two bounds, which is 2.', 'Yes. The limit is the value of the middle function at that point.'], a: 0,
                why: 'The Squeeze Theorem needs both bounds to approach the same limit. The limits 1 and 3 differ, so the theorem gives no conclusion. This middle function still approaches 2, and that has to be shown another way.'
            },
            message: 'The inequality x + 1 ≤ x + 2 ≤ x + 3 holds near 0, so the first condition is met. The two bounds have different limits, and that is the condition that fails. Slide the distance h toward 0 and the shaded corridor keeps its full width of 2, so it never closes. A corridor that never closes cannot force a limit on the middle function.'
        }
    ],
    summary: {
        idea: 'The Squeeze Theorem concludes from two bounds that share one limit near the point, not from the shape of the middle function. The inequalities only need to hold near the point, and the value of the middle function at the point is irrelevant. When the two bounds agree, the middle function has that same limit.',
        mistake: 'The usual mistake is to believe the middle function itself has to look calm or monotonic. Bounded oscillation plus two bounds with the same limit still gives a valid conclusion. Two different bound limits give no conclusion at all.',
        transfer: 'For lim x→0 x³ cos(1/x), name the two bounds before you graph anything. Do the two bounds agree at 0? Why does the extra power of x make the squeeze easier rather than harder?'
    }
};

function r2(v) { return String(Math.round(v * 100) / 100); }

/* The view is its own control, so say plainly when the probes have been
   zoomed past instead of letting them silently vanish off the frame. */
function viewRows(env) {
    const rows = [{ label: 'view half-width', v: env.z, digits: 2 }];
    if (env.h > env.z) rows.push({ label: 'probes at x = ±' + r2(env.h), v: 'outside this view, widen it to see them', color: 'down' });
    return rows;
}
