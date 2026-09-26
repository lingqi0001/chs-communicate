/* 2.3 Derivative Estimator — no formula in sight: squeeze a slope out of a
   picture or out of a table of nearby values. Local is what counts. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const HIDDEN = (x) => 0.4 * Math.pow(x - 4.5, 3) - 1.5 * (x - 4.5) + 3;
const HIDDEN2 = (x) => 6 / x + 0.8 * x;
const DATASETS = [
    { label: 'table 1', f: HIDDEN },
    { label: 'table 2 (new data)', f: HIDDEN2 }
];
/* one shared x grid, two different hidden functions, spacing deliberately uneven */
const XS = [3.0, 3.8, 4.2, 4.6, 5.0, 5.3, 5.9, 7.0];
const dataFn = (env) => (DATASETS[env.data] || DATASETS[0]).f;
const XWIN = [1.5, 6.5];

export default {
    id: 'u2-estimator',
    meta: { unit: 2, topic: '2.3', title: 'Estimating Derivatives of a Function at a Point', visualizerTitle: 'Derivative Estimator' },
    modes: [
        {
            label: 'Estimate from a graph',
            intro: 'The formula for this function is hidden. Rotate your guide line until it matches the curve at the target point. Then read the slope as the rise over the run on the triangle.',
            params: { a: 4, m: 0, reveal: 0 },
            controls: [
                { key: 'a', label: 'target x', min: 2, max: 6, step: 0.05 },
                { key: 'm', label: 'slope of your guide line', min: -6, max: 6, step: 0.05 },
                {
                    key: 'reveal', label: 'grading', kind: 'choice',
                    options: [{ v: 0, label: 'estimate only' }, { v: 1, label: 'show true slope' }]
                }
            ],
            fns: { f: (x) => HIDDEN(x) },
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'y = f(x), formula withheld', height: 360,
                        window: [1.5, 6.5, -4, 6.5],
                        curves: [{ fn: 'f', color: 'curveA' }],
                        segments: env => [{
                            x1: env.a - 2.2, y1: HIDDEN(env.a) - 2.2 * env.m,
                            x2: env.a + 2.2, y2: HIDDEN(env.a) + 2.2 * env.m,
                            color: 'accent'
                        }],
                        points: env => [{ x: env.a, y: HIDDEN(env.a), label: 'target (' + round2(env.a) + ', ' + round2(HIDDEN(env.a)) + ')', color: 'ink' }],
                        triangle: env => {
                            const [xa, xb] = triSpan(env);
                            return {
                                fn: (x) => HIDDEN(env.a) + env.m * (x - env.a),
                                x1: xa, x2: xb, color: 'auxInk',
                                runLabel: 'run = ' + round2(xb - xa),
                                riseLabel: 'rise = ' + round2(env.m * (xb - xa))
                            };
                        }
                    }
                ],
                side: [
                    {
                        kind: 'readout', title: 'Your report',
                        items: env => {
                            const trueSlope = derivative(HIDDEN, env.a);
                            const [xa, xb] = triSpan(env);
                            const run = xb - xa, rise = env.m * run;
                            return [
                                { label: 'your estimate f′(' + round2(env.a) + ')', v: env.m, color: 'accent', big: true },
                                { label: 'rise over run on the triangle', v: () => round2(rise) + ' / ' + round2(run), color: 'auxInk' },
                                { label: 'true value f′(' + round2(env.a) + ')', v: env.reveal ? trueSlope : 'hidden', color: 'up', big: !!env.reveal },
                                { label: 'your error', v: env.reveal ? Math.abs(env.m - trueSlope) : 'hidden' }
                            ];
                        }
                    },
                    {
                        kind: 'note', title: 'What a good tangent match looks like',
                        text: 'A good match means your line passes through the target point and runs in the same direction as the curve there. Your line may cross the curve again somewhere else, because only the direction at the target point sets the slope. So read the slope from the rise and run on your own line.'
                    }
                ]
            },
            steps: [
                {
                    params: { a: 4, m: 0, reveal: 0 },
                    message: env => 'The target point sits at x = ' + round2(env.a) + '. Start with your line flat, then move m up and down until the line runs along the curve at that point.'
                },
                {
                    params: {},
                    predict: {
                        q: 'Look only at the shape of the curve near the target. Is f′(4) positive, negative, or about zero?',
                        choices: ['Negative. The curve falls there as x increases, so its tangent slope is negative.', 'Positive. The curve sits above the x-axis there, so its tangent slope is positive.', 'Zero. The target point is marked with a dot, so its tangent slope is zero.', 'Unknown. The formula is hidden, so no slope can be read from the graph.'], a: 0,
                        why: 'The height of the graph gives f, and the direction of the graph gives f′. The curve falls as it passes the target point, so f is decreasing and f′ is negative. The sign needs no arithmetic.'
                    },
                    message: 'Decide the sign first and the size second. That order is what makes a graphical estimate fast.'
                },
                {
                    params: { m: -1.2, reveal: 1 },
                    message: env => 'This step sets your line to the true slope f′(' + round2(env.a) + ') = ' + round2(derivative(HIDDEN, env.a)) + ', so your error reads ' + round2(Math.abs(env.m - derivative(HIDDEN, env.a))) + '. Move m away and back to feel how precisely the line must align.'
                },
                {
                    params: { a: 5.5, m: 0, reveal: 0 },
                    message: 'The target slider now lets you ask about any x. Set the target to x = 5.5, and then to x = 3. Line up the tangent by eye before you turn grading on, and decide which of the two slopes is larger.'
                }
            ],
            summary: {
                idea: 'A graphical estimate has two steps. First match your line to the curve at the target point. Then read the slope as rise over run on the triangle.',
                mistake: 'You report f(a), the height of the target point, when the question asks for f′(a). Height and slope are two different measurements of the same point.',
                transfer: 'In the graph estimate, set the target to x = 3 and then to x = 5.5. Estimate each slope by eye, name which one is larger, then turn grading on and check.'
            }
        },
        {
            label: 'Estimate from a table',
            intro: 'You have a table of data and no formula. The value of f′ at the target row must come from nearby rows, so choose the two rows you trust.',
            params: { data: 0, target: 4, left: 3, right: 5, reveal: 0 },
            controls: [
                {
                    key: 'data', label: 'data set', kind: 'choice',
                    options: DATASETS.map((d, i) => ({ v: i, label: d.label }))
                },
                {
                    key: 'target', label: 'estimate f′ at this row', kind: 'choice',
                    options: XS.map((x, i) => ({ v: i, label: 'x = ' + x }))
                },
                {
                    key: 'left', label: 'left row of your pair', kind: 'choice',
                    options: XS.map((x, i) => ({ v: i, label: 'x = ' + x }))
                },
                {
                    key: 'right', label: 'right row of your pair', kind: 'choice',
                    options: XS.map((x, i) => ({ v: i, label: 'x = ' + x }))
                },
                {
                    key: 'reveal', label: 'grading', kind: 'choice',
                    options: [{ v: 0, label: 'estimate only' }, { v: 1, label: 'show true slope' }]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'table', title: 'Sampled data (the spacing is not uniform)', digits: 3,
                        cols: ['x', 'f(x)', 'your role'],
                        rows: env => {
                            const fn = dataFn(env);
                            return XS.map((x, i) => [
                                { v: x, bold: i === env.left || i === env.right || i === env.target },
                                { v: fn(x), bold: i === env.left || i === env.right || i === env.target },
                                { v: rowMark(env, i) }
                            ]);
                        }
                    }
                ],
                side: [
                    {
                        kind: 'readout', title: 'Your secant estimate',
                        items: env => {
                            const fn = dataFn(env);
                            const tx = XS[env.target];
                            const a = XS[env.left], b = XS[env.right];
                            const m = env.left === env.right ? 'needs two different rows' : (fn(b) - fn(a)) / (b - a);
                            const trueSlope = derivative(fn, tx);
                            return [
                                { label: 'target', v: 'f′(' + tx + ')' },
                                { label: 'your pair', v: a + ' → ' + b },
                                { label: 'secant slope as your estimate', v: m, color: 'accent', big: true },
                                { label: 'true f′(' + tx + ')', v: env.reveal ? trueSlope : 'hidden', color: 'up' },
                                { label: 'your error', v: env.reveal && typeof m === 'number' ? Math.abs(m - trueSlope) : 'hidden' }
                            ];
                        }
                    },
                    {
                        kind: 'note', title: 'Why the closest pair is best',
                        text: 'A secant slope through two rows equals the average rate of change between those rows. When a short interval straddles the target, that average rate sits close to the instantaneous rate at the target. Rows far away smooth out the curve, so they describe a different neighborhood and hide the local behavior.'
                    }
                ]
            },
            steps: [
                {
                    params: { data: 0, target: 4, left: 3, right: 5, reveal: 0 },
                    message: 'The target row is x = 5.0. Any two different rows give a secant slope, so your task is to choose which two rows to use.'
                },
                {
                    params: {},
                    predict: {
                        q: 'The target row is x = 5.0. Which pair of rows gives the most trustworthy estimate of f′(5.0)?',
                        choices: ['x = 4.6 and x = 5.3. These are the closest rows on each side of the target.', 'x = 3.0 and x = 7.0. This widest span uses the most of the data.', 'x = 3.8 and x = 5.0. The value f(5.0) anchors the estimate for the target.', 'x = 3.0 and x = 3.8. These are the rows farthest below the target.'], a: 0,
                        why: 'A derivative is a local slope. The rows closest to the target give the shortest secants. A pair that straddles the target averages the two sides, so its slope lands nearest the tangent slope. The row at x = 5.0 only supplies a height, and a wide pair measures a different neighborhood.'
                    },
                    message: 'Set the left row to x = 4.6 and the right row to x = 5.3, then turn grading on. This pair gives the smallest error of the choices.'
                },
                {
                    params: { left: 2, right: 6, reveal: 1 },
                    message: env => 'Now widen the pair to x = 3.8 and x = 5.9. The estimate reads ' + round2(secant(env)) + ' against a true value of ' + round2(derivative(dataFn(env), XS[env.target])) + '. It is still local, but it uses a far longer interval than the straddling pair.'
                },
                {
                    params: { data: 1, target: 4, left: 3, right: 5, reveal: 1 },
                    message: env => 'Table 2 now uses a different hidden function, and the target row is still x = 5.0. Your pair x = 4.6 and x = 5.3 reports ' + round2(secant(env)) + ' while the true value is ' + round2(derivative(dataFn(env), XS[env.target])) + '.'
                },
                {
                    params: { target: 2 },
                    message: env => 'Move the target to the row x = ' + XS[env.target] + '. Then choose a pair of rows that straddles it, here x = ' + neighbors(env.target)[0] + ' with x = ' + neighbors(env.target)[1] + '. The true value of f′(' + XS[env.target] + ') is ' + round2(derivative(dataFn(env), XS[env.target])) + '.'
                }
            ],
            summary: {
                idea: 'An estimate from a table uses the most local information available. Take the closest rows, and prefer one row on each side of the target row.',
                mistake: 'A far apart pair looks better because it uses more data, but it is wrong. A wider secant averages away the local behavior that f′ should report.',
                transfer: 'Switch to table 2 and set the target row to x = 4.2. Name the pair you would use, predict the sign of the slope, then compute it and read your error.'
            }
        }
    ]
};

function rowMark(env, i) {
    if (i === env.target) return 'target';
    if (i === env.left) return 'left end of pair';
    if (i === env.right) return 'right end of pair';
    return '';
}
function secant(env) {
    const fn = dataFn(env);
    const a = XS[env.left], b = XS[env.right];
    return (fn(b) - fn(a)) / (b - a);
}
/* the two rows that sit just left and just right of the target row */
function neighbors(target) {
    const lo = Math.max(0, target - 1);
    const hi = Math.min(XS.length - 1, target + 1);
    return [XS[lo], XS[hi]];
}
/* A slope triangle of any size proves the same slope, so the run shrinks when
   the line is steep: that keeps the rise inside the drawn window and readable */
function triSpan(env) {
    const run = Math.max(0.3, Math.min(1, 2 / Math.max(Math.abs(env.m), 1e-9)));
    return env.a + run <= XWIN[1] - 0.2 ? [env.a, env.a + run] : [env.a - run, env.a];
}
function round2(v) { return String(Math.round(v * 100) / 100); }
