/* 1.8 Squeeze Theorem Sandwich — the bounds, not the middle's shape, force
   the target. The middle may oscillate wildly and still be squeezed. */

export default {
    id: 'u1-squeeze',
    meta: { unit: 1, topic: '1.8', title: 'Determining Limits Using the Squeeze Theorem', visualizerTitle: 'Squeeze Theorem Sandwich' },
    intro: 'The Squeeze Theorem concludes from two bounds near the point, not from the shape of the middle function. If a function stays between the bounds and both bounds have the same limit there, the middle function has that limit too. The inequalities only need to hold near the point, never at the point itself.',
    params: { x: 0.8, kase: 'classic' },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: [
                { v: 'classic', label: 'x²sin(1/x), bounds agree' },
                { v: 'split', label: 'x + 2, bounds disagree' }
            ]
        },
        { key: 'x', label: 'probe x', min: 0.01, max: 1.6, step: 0.005 }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: 'Upper bound, lower bound, and the middle function', height: 350,
                window: (env) => env.kase === 'classic' ? [-1.7, 1.7, -3.2, 3.2] : [-1.7, 1.7, -1.4, 5.4],
                vlines: [{ x: 0, color: 'aux', label: 'target x = 0' }],
                hlines: (env) => env.kase === 'classic'
                    ? [{ y: 0, color: 'up', label: 'target line y = 0' }]
                    : [{ y: 1, color: 'down', label: 'lower bound: limit 1' }, { y: 3, color: 'down', label: 'upper bound: limit 3' }],
                curves: (env) => env.kase === 'classic' ? [
                    { fn: 'x^2', label: 'upper: x²', color: 'curveB', dashed: true },
                    { fn: '-x^2', label: 'lower: −x²', color: 'curveB', dashed: true },
                    { fn: 'x^2*sin(1/x)', label: 'middle', color: 'curveA', samples: 1400 }
                ] : [
                    { fn: 'x + 3', label: 'upper: x + 3', color: 'curveB', dashed: true },
                    { fn: 'x + 1', label: 'lower: x + 1', color: 'curveB', dashed: true },
                    { fn: 'x + 2', label: 'middle: x + 2', color: 'curveA' }
                ],
                points: (env) => env.kase === 'classic' ? [
                    { x: env.x, fn: (x) => x * x, color: 'aux', label: 'upper', labelDy: -10 },
                    { x: env.x, fn: (x) => -x * x, color: 'aux', label: 'lower', labelDy: 18 },
                    { x: env.x, fn: (x) => x * x * Math.sin(1 / x), color: 'accent', label: 'middle' }
                ] : [
                    { x: env.x, fn: (x) => x + 3, color: 'aux', label: 'upper', labelDy: -10 },
                    { x: env.x, fn: (x) => x + 1, color: 'aux', label: 'lower', labelDy: 18 },
                    { x: env.x, fn: (x) => x + 2, color: 'accent', label: 'middle' }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Values at the probe x',
                items: (env) => env.kase === 'classic' ? [
                    { label: 'lower −x²', v: -env.x * env.x },
                    { label: 'middle x²sin(1/x)', v: env.x * env.x * Math.sin(1 / env.x), color: 'accent', big: true },
                    { label: 'upper x²', v: env.x * env.x },
                    { label: 'gap, upper minus lower', v: 2 * env.x * env.x, color: 'down' }
                ] : [
                    { label: 'lower x + 1', v: env.x + 1 },
                    { label: 'middle x + 2', v: env.x + 2, color: 'accent', big: true },
                    { label: 'upper x + 3', v: env.x + 3 },
                    { label: 'gap, upper minus lower', v: 2, color: 'down' }
                ]
            },
            {
                kind: 'eq', title: 'Does the Squeeze Theorem apply?',
                lines: env => env.kase === 'classic' ? [
                    { t: 'For every x not equal to 0, −x² ≤ x² sin(1/x) ≤ x².', hl: true },
                    { t: 'The factor |sin(1/x)| is at most 1, so the middle function stays between the bounds.', rule: 'why the middle is bounded' },
                    { t: 'lim x→0 −x² = lim x→0 x² = 0', rule: 'both bounds have limit 0' },
                    { t: 'So lim x→0 x² sin(1/x) = 0. The limit needs no value of the middle function at x = 0.', hl: true, color: 'up' }
                ] : [
                    { t: 'The lower bound approaches 1 as x approaches 0, and the upper bound approaches 3.', color: 'down' },
                    { t: 'Because those two limits differ, the Squeeze Theorem gives no conclusion.', rule: 'the bounds must agree', color: 'down' },
                    { t: 'This middle function does approach 2, and the Squeeze Theorem is not the reason.' }
                ]
            }
        ]
    },
    steps: [
        { params: { kase: 'classic', x: 1.4 }, message: 'The factor sin(1/x) has no limit at x = 0 because it keeps oscillating. The factor x² shrinks toward 0 and holds the product x² sin(1/x) between −x² and x². Slide the probe x toward 0 and watch the two bounds close in.' },
        { params: { x: 0.5 }, message: 'The probe now sits at x = 0.5. The gap between the bounds is 2x², so a smaller x means a smaller gap. The middle function stays inside that gap and cannot escape it.' },
        {
            params: { x: 0.08 },
            predict: {
                q: 'The middle function keeps oscillating near x = 0 and never visibly settles. Does that stop the middle function from having the limit 0?',
                choices: ['No. The two bounds close in and squeeze the middle function toward 0.', 'Yes. A function that keeps oscillating near the point has no limit there.', 'Only later. The limit exists once the oscillation of the middle function stops.'], a: 0,
                why: 'The inequality holds for every x near 0 except 0 itself, and both bounds have the limit 0 there. The Squeeze Theorem then forces the middle limit to 0, whatever the oscillation does. The middle function has no value at x = 0, and a limit at 0 never asks for one.'
            },
            message: 'Slide the probe x toward 0 and watch the readout. The middle value swings, while the two bounds around it keep closing together.'
        },
        {
            params: { kase: 'split' },
            predict: {
                q: 'Suppose the lower bound has limit 1 and the upper bound has limit 3. The middle function stays between them. Can the Squeeze Theorem give the middle function a limit?',
                choices: ['No. The two bounds must approach the same number before any limit follows.', 'Yes. Take the average of the two bounds, which is 2.', 'Yes. The limit is the value of the middle function at that point.'], a: 0,
                why: 'The Squeeze Theorem needs both bounds to approach the same limit. The limits 1 and 3 differ, so the theorem gives no conclusion. This middle function still approaches 2, and that has to be shown another way.'
            },
            message: 'The inequality x + 1 ≤ x + 2 ≤ x + 3 holds near 0, so one hypothesis is met. The two bounds have different limits, and that is the hypothesis that fails. A gap that never closes cannot force a limit on the middle function.'
        }
    ],
    summary: {
        idea: 'The Squeeze Theorem concludes from two bounds that share one limit near the point, not from the shape of the middle function. The inequalities only need to hold near the point, and the value of the middle function at the point is irrelevant. When the two bounds agree, the middle function has that same limit.',
        mistake: 'The usual mistake is to believe the middle function itself has to look calm or monotonic. Bounded oscillation plus two bounds with the same limit still gives a valid conclusion. Two different bound limits give no conclusion at all.',
        transfer: 'For lim x→0 x³ cos(1/x), name the two bounds before you graph anything. Do the two bounds agree at 0? Why does the extra power of x make the squeeze easier rather than harder?'
    }
};
