/* 1.1 Instant Change Zoom Lab — average rates over shrinking intervals
   settle toward one number: the instantaneous rate. */

import { evaluate } from '../../js/calc-math.js?v=20260925-calc-15';

const HL = [3, 2, 1, 0.5, 0.1, 0.01];

export default {
    id: 'u1-instant-change',
    meta: { unit: 1, topic: '1.1', title: 'Introducing Calculus: Can Change Occur at an Instant?', visualizerTitle: 'Instant Change Zoom Lab' },
    intro: 'Points A and B on the curve determine a secant line whose slope is the average rate between the two instants. Drag point B toward point A and watch the average rates settle toward one number. That number is the instantaneous rate at t = a.',
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
                cols: ['h', 'average rate'],
                rows: (env) => HL.map(hh => {
                    const sign = hh;
                    return [String(sign), { v: (env.s(env.a + sign) - env.s(env.a)) / sign, bold: Math.abs(sign - env.h) < 1e-9 }];
                }),
                note: 'Every row uses two distinct points, so the gap h is never 0. Each row is the average rate over that gap, not the rate at one instant.'
            },
            {
                kind: 'compare', title: 'Setting h to 0 compared with keeping h small',
                when: (env) => Math.abs(env.h) < 0.05,
                sides: (env) => {
                    const dS = env.s(env.a + env.h) - env.s(env.a);
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
                            title: 'Keeping h away from 0', tone: 'right', lines: [
                                'Here h = ' + trim4(env.h) + ', and that gap is not 0.',
                                'The change Δs = ' + trim4(dS) + ' is small and not 0.',
                                'The average rate Δs / Δt = ' + trim4(dS / env.h),
                                'The table shows the trend as h approaches 0.'
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
                q: 'At t = 2 the average rates shown in the table read 7, 6, 5, 4.5, 4.1 and 4.01. Which number is the instantaneous rate at t = 2 closest to?',
                choices: ['About 4. The average rates settle toward 4 as the gap h shrinks.', 'About 0. The gap h shrinks toward 0, so the average rate shrinks with the gap.', 'No single value. An average rate over a shrinking gap never settles on one number.'],
                a: 0,
                why: 'The interval shrinks and the average rates do not shrink with it. They settle toward 4, and 4 is the instantaneous rate at t = 2.'
            },
            message: 'Keep shrinking the gap h. The average rate settles on one value even while the gap keeps shrinking.'
        },
        { params: { h: 0.01 }, message: 'Now the gap is h = 0.01 and the average rate reads 4.01. Calculus never divides by 0. Calculus looks at the number that the average rates approach.' },
        {
            params: { src: 'x*x+x', a: 1, h: 1.5 },
            predict: {
                q: 'The function is now s(t) = t² + t at the instant t = 1. Shrink the gap h by hand. Which number is the instantaneous rate at t = 1 closest to: 2, 3, or 5?',
                choices: ['Closest to 2. The rate of t² alone at t = 1 is 2, and the term t is left out.', 'Closest to 3. The average rate works out to 3 + h, so it settles on 3.', 'Closest to 5. The function value 2 and the rate 3 get added together.'], a: 1,
                why: 'The average rates over shrinking gaps settle at 3, so the instantaneous rate at t = 1 is 3. The method did not change when the function changed.'
            },
            message: 'The function changed and the method did not. Drag the gap h toward 0 and check the answer you predicted. One warning: not every point has an instantaneous rate, because the left side rate and the right side rate can differ.'
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
