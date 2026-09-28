/* 1.1 Instant Change Zoom Lab - average rates over shrinking intervals
   settle toward one number: the instantaneous rate. */

import { evaluate } from '../../js/calc-math.js?v=20260925-calc-15';

const HMAG = [1, 0.5, 0.1, 0.01];

export default {
    id: 'u1-instant-change',
    meta: { unit: 1, topic: '1.1', title: 'Introducing Calculus: Can Change Occur at an Instant?', visualizerTitle: 'Instant Change Zoom Lab' },
    intro: 'Points A and B on the curve determine a secant line whose slope is the average rate between the two instants. Drag point B toward point A from either side and watch both columns of average rates settle toward one number. That number is the instantaneous rate at t = a.',
    params: { a: 2, h: 2, src: 'x*x' },
    fns: {
        s: (x, env) => evaluate(env.src, { x })
    },
    controls: [
        { key: 'a', label: 'target instant a', min: 0.5, max: 3.5, step: 0.05 },
        { key: 'h', label: 'gap h', min: -1.8, max: 2.5, step: 0.005 }
    ],
    panes: {
        main: [
            {
                kind: 'graph',
                title: env => 'Position function s(t) = ' + (env.src === 'x*x' ? 't²' : 't² + t'),
                /* framed around the target instant: the slider box can push B to
                   t = 6 or below t = 0, and a marked point off the viewBox is a
                   point the student cannot even grab again */
                window: (env) => {
                    const lo = env.a - 2, hi = env.a + 2.6;
                    let minY = Infinity, maxY = -Infinity;
                    for (let i = 0; i <= 48; i++) {
                        const y = env.s(lo + (hi - lo) * i / 48);
                        if (!Number.isFinite(y)) continue;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                    const pad = Math.max(0.5, (maxY - minY) * 0.07);
                    return [lo, hi, minY - pad, maxY + pad];
                },
                curves: [{ fn: (x, env) => env.s(x), label: 's(t)', color: 'ink' }],
                points: [
                    { fn: 's', x: 'a', label: 'A', color: 'ink' },
                    { fn: 's', x: (env) => env.a + env.h, label: 'B', color: 'accent', drag: { key: 'h', transform: (env, raw) => raw - env.a, min: -1.8, max: 2.5 } }
                ],
                segments: [{
                    x1: 'a', y1: (env) => env.s(env.a),
                    x2: (env) => env.a + env.h, y2: (env) => env.s(env.a + env.h),
                    extend: 0.5, color: 'accent'
                }],
                height: 330
            },
            {
                kind: 'readout',
                items: [
                    { label: 'h', v: 'h' },
                    { label: 'change Δs', v: 's(a+h)-s(a)' },
                    { label: 'average rate Δs/Δt', v: (env) => Math.abs(env.h) < 0.008 ? 'gap too small' : (env.s(env.a + env.h) - env.s(env.a)) / env.h, color: 'accent', big: true }
                ]
            }
        ],
        side: [
            {
                kind: 'table', title: env => 'Average rates at t = ' + trim(env.a),
                cols: ['gap |h|', 'B before A (h < 0)', 'B after A (h > 0)'],
                rows: (env) => HMAG.map(mag => {
                    const rate = (hh) => (env.s(env.a + hh) - env.s(env.a)) / hh;
                    return [String(mag),
                        { v: rate(-mag), bold: Math.abs(env.h + mag) < 1e-9 },
                        { v: rate(mag), bold: Math.abs(env.h - mag) < 1e-9 }];
                }),
                note: 'Every entry uses two distinct points, so the gap h is never 0. The left column places B before A with h < 0, and the right column places B after A with h > 0. Each entry is an average rate over its own gap, not the rate at one instant. Both columns close in on the same number as the gap shrinks.'
            },
            {
                kind: 'compare', title: 'Setting h to 0 compared with keeping h small',
                when: (env) => Math.abs(env.h) < 0.05,
                sides: (env) => {
                    const dS = env.s(env.a + env.h) - env.s(env.a);
                    /* the slider can land on exactly h = 0, where the ratio has
                       no value, so the text must not print a NaN rate */
                    const rate = env.h === 0 ? NaN : dS / env.h;
                    return [
                        {
                            title: 'Setting h to 0', tone: 'wrong', lines: [
                                'Point B lands exactly on point A.',
                                'Both Δs and Δt become 0.',
                                'The ratio Δs / Δt is 0/0, undefined.',
                                'Two merged points give no secant line and no average rate.'
                            ]
                        },
                        {
                            title: 'Keeping h away from 0', tone: 'right', lines: Number.isFinite(rate) ? [
                                'Here h = ' + trim4(env.h) + ', and that gap is not 0.',
                                'The change Δs = ' + trim4(dS) + ' is small and not 0.',
                                'The average rate Δs / Δt = ' + trim4(rate),
                                'The table shows the trend as h approaches 0.'
                            ] : [
                                'Right now h is 0, so this side is empty too.',
                                'Nudge h to any nonzero value and the average rate comes back.',
                                'The table rows are all computed with nonzero gaps.',
                                'The trend of those rows as h approaches 0 is the answer.'
                            ]
                        }
                    ];
                },
                verdict: 'A gap of 0 leaves no two points, so no average rate exists there. Each table row gives an average rate over a real gap. Those average rates approach one number as h approaches 0, and that number is the instantaneous rate at t = a.'
            }
        ]
    },
    steps: [
        { params: { h: 2 }, message: 'Point B sits far from point A. This secant line gives only the average rate over a wide interval of time.' },
        { params: { h: 1 }, message: 'Point B moves closer to point A. The same formula now gives the average rate over a shorter interval, and that average rate is different.' },
        {
            params: { h: 0.3 },
            predict: {
                q: 'At t = 2 the table shows 3, 3.5, 3.9 and 3.99 in the h < 0 column, and 5, 4.5, 4.1 and 4.01 in the h > 0 column. Which number is the instantaneous rate at t = 2 closest to?',
                choices: ['About 4. Both columns settle toward 4 as the gap h shrinks.', 'About 0. The gap h shrinks toward 0, so the average rate shrinks with the gap.', 'No single value. Average rates over shrinking gaps from the two sides never settle on one number.'],
                a: 0,
                why: 'The gap shrinks toward 0 from both the negative and the positive side. The average rates do not shrink with the gap. Both columns close in on 4, and 4 is the instantaneous rate at t = 2.'
            },
            message: 'The gap is now h = 0.3, and the readout shows the average rate 4.3. Both table columns already point toward one number. Press Next to shrink the gap again.'
        },
        { params: { h: 0.01 }, message: 'The gap is now small. The h > 0 column reads 4.01 and the h < 0 column reads 3.99, so B closing in on A from either side points to the same number. Calculus never divides by 0. Calculus looks at the number that both columns approach.' },
        {
            params: { src: 'x*x+x', a: 1, h: 1.5 },
            message: 'The graph now shows s(t) = t² + t, and the target instant is t = 1. The gap is h = 1.5, so point B sits after point A. The table lists the average rates at t = 1.'
        },
        {
            predict: {
                q: 'The table on screen lists the average rates at t = 1. The h < 0 column reads 2, 2.5, 2.9 and 2.99, and the h > 0 column reads 4, 3.5, 3.1 and 3.01. Shrink the gap h by hand and watch those rows. Which number is the instantaneous rate at t = 1 closest to: 2, 3, or 5?',
                choices: ['Closest to 2. That is the rate of t² alone at t = 1, and it leaves out the term t.', 'Closest to 3. For s(t) = t² + t each average rate works out to 3 + h, so both columns settle on 3.', 'Closest to 5. This adds the function value 2 and the rate 3 together.'], a: 1,
                why: 'The average rates over shrinking gaps settle at 3, so the instantaneous rate at t = 1 is 3. The method did not change when the function changed.'
            },
            message: 'The function changed and the method did not. Both columns close in on one number as the gap shrinks. One warning: not every point has an instantaneous rate, because approaching from the left and approaching from the right can settle on different numbers.'
        }
    ],
    summary: {
        idea: 'The instantaneous rate at t = a is the value that the average rates approach as the gap h shrinks. The gap moves toward 0 and is never set to 0. An average rate over a small gap is only an approximation of that instantaneous rate.',
        mistake: 'The usual mistake is to set the gap h to 0 and call the result the instantaneous rate. In every average rate the gap Δt is not 0, it only approaches 0.',
        transfer: 'Try s(t) = t² − t at the instant t = 2. Predict the number that the average rates approach before you slide the gap h.'
    }
};

function trim(v) { return String(Math.round(v * 100) / 100); }
function trim4(v) { return String(Math.round(v * 10000) / 10000); }
