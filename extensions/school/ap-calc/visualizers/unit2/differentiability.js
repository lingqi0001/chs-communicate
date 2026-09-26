/* 2.4 Differentiability Inspector — differentiable implies continuous, never
   the reverse. A derivative needs one finite slope both sides agree on. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

/* Each case carries the metadata the verdict board and the trend line read,
   so a new case must state all of it or the panels start contradicting each
   other. Windows are per case because every case reaches different heights. */
const CASES = {
    smooth: {
        label: 'smooth point', c: 0, cont: true, finite: true,
        f: (x) => 0.5 * x * x + 1,
        win: [-2.3, 2.3, -0.6, 3.9],
        story: 'This is a parabola near its lowest point. The secants from both sides settle on the same finite slope. That slope is 0 here.'
    },
    corner: {
        label: 'corner of |x|', c: 0, cont: true, finite: false, leftM: -1, rightM: 1,
        f: (x) => Math.abs(x),
        win: [-2.3, 2.3, -0.6, 2.6],
        story: 'The graph has no hole and no jump, so the function is continuous. The left secants settle at −1 and the right secants settle at +1. One point cannot have two different slopes, so the derivative does not exist.'
    },
    vertical: {
        label: 'vertical tangent ∛x', c: 0, cont: true, finite: false, vertical: true,
        f: (x) => Math.cbrt(x),
        win: [-2.3, 2.3, -1.6, 1.6],
        story: 'Both sides agree that the tangent line is vertical. The slopes grow past every number as the gaps shrink. The curve stays continuous, but no finite derivative exists.'
    },
    broken: {
        label: 'hole at x = 2', c: 2, cont: false, finite: false, hole: 2, holeY: 2,
        f: (x) => x === 2 ? NaN : 0.5 * x + 1,
        win: [0, 4.5, 0.2, 3.6],
        story: 'The graph has a hole at 2, so f(2) is undefined. Without continuity at 2, the derivative does not exist there.'
    },
    piecewise: {
        label: 'piecewise at x = 1', c: 1, cont: true, finite: false, leftM: 1, rightM: 2,
        f: (x) => x <= 1 ? 0.5 * x * x : 2 * x - 1.5,
        win: [-1.5, 3.2, -0.8, 5.2],
        story: 'Two different formulas meet at x = 1. Both give the value 0.5 there, so the graph is connected. The left formula arrives with slope 1 and the right formula leaves with slope 2.'
    }
};

export default {
    id: 'u2-differentiability',
    meta: { unit: 2, topic: '2.4', title: 'Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist', visualizerTitle: 'Differentiability Inspector' },
    intro: 'Shrink the secant gap on each side and read the two slopes that appear. The verdict board shows which test each case passes and which test it fails.',
    params: { kase: 'smooth', hL: 1.4, hR: 1.4 },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        },
        { key: 'hL', label: 'left secant gap', min: 0.05, max: 2, step: 0.01 },
        { key: 'hR', label: 'right secant gap', min: 0.05, max: 2, step: 0.01 }
    ],
    fns: { f: (x, env) => CASES[env.kase].f(x) },
    panes: {
        main: [
            {
                kind: 'graph', title: env => CASES[env.kase].label, height: 350,
                window: env => CASES[env.kase].win,
                curves: env => {
                    const c = CASES[env.kase];
                    if (c.hole === undefined) return [{ fn: 'f', color: 'curveA', samples: 600 }];
                    const [x0, x1] = c.win;
                    return [
                        { fn: 'f', from: x0, to: c.hole - 0.1, color: 'curveA' },
                        { fn: 'f', from: c.hole + 0.1, to: x1, color: 'curveA' }
                    ];
                },
                points: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    return [
                        { x: c.c - env.hL, y: fx(c.c - env.hL), color: 'up', label: 'L' },
                        { x: c.c + env.hR, y: fx(c.c + env.hR), color: 'down', label: 'R' },
                        { x: c.c, y: fx(c.c), color: 'ink', label: 'c' },
                        ...(c.hole === undefined ? [] : [{ x: c.hole, y: c.holeY, open: true, color: 'down', label: 'hole' }])
                    ];
                },
                segments: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    const y0 = fx(c.c);
                    const out = [];
                    if (Number.isFinite(y0)) {
                        if (Number.isFinite(fx(c.c - env.hL))) out.push({ x1: c.c - env.hL, y1: fx(c.c - env.hL), x2: c.c, y2: y0, color: 'up' });
                        if (Number.isFinite(fx(c.c + env.hR))) out.push({ x1: c.c, y1: y0, x2: c.c + env.hR, y2: fx(c.c + env.hR), color: 'down' });
                    }
                    return out;
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Secant slopes from each side',
                items: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    const mL = (fx(c.c) - fx(c.c - env.hL)) / env.hL;
                    const mR = (fx(c.c + env.hR) - fx(c.c)) / env.hR;
                    return [
                        { label: 'left secant slope', v: Number.isFinite(mL) ? mL : 'no value to compare', color: 'up' },
                        { label: 'right secant slope', v: Number.isFinite(mR) ? mR : 'no value to compare', color: 'down' },
                        { label: 'Trend as the gaps shrink', v: trendNote(c), color: 'accent' }
                    ];
                }
            },
            {
                kind: 'checklist', title: 'Verdict board',
                items: env => {
                    const c = CASES[env.kase];
                    const oneSided = c.cont && (c.finite || c.vertical || c.leftM !== undefined);
                    return [
                        { t: 'Continuous at c, so both sides reach the same point', state: c.cont },
                        { t: 'The left secant slopes settle to one value', state: oneSided },
                        { t: 'The right secant slopes settle to one value', state: oneSided },
                        { t: 'Both sides settle to the same finite number', state: !!c.finite }
                    ];
                },
                verdict: env => CASES[env.kase].finite ? 'Yes. The derivative f′(c) exists.' : verdictFor(CASES[env.kase]),
                verdictOk: env => !!CASES[env.kase].finite
            },
            { kind: 'note', title: 'What is happening here', text: env => CASES[env.kase].story }
        ]
    },
    steps: [
        { params: { kase: 'smooth', hL: 1.4, hR: 1.4 }, message: 'This is a clean point to begin with. Shrink both gaps and watch the two slope readings move toward the same number. f′ exists exactly when those two readings agree.' },
        {
            params: { kase: 'corner' },
            predict: {
                q: 'The function is continuous at 0, because the pieces meet with no hole and no jump. Does continuity at 0 guarantee that f′(0) exists?',
                choices: ['No. Continuity only means the graph meets, and the two sides must also agree on one slope.', 'Yes. Every function that is continuous at a point is differentiable there.', 'Yes. The point clearly lies on the graph, so the derivative exists there.'], a: 0,
                why: 'The left secants stay at −1 and the right secants stay at +1 at every zoom. Each side settles, but not on the same number, so the derivative fails the requirement that both sides agree.'
            },
            message: 'Shrink both gaps and compare the two readings. They converge, but to different numbers. That difference between the two slopes is the corner.'
        },
        {
            params: { kase: 'vertical' },
            predict: {
                q: 'This graph is continuous at 0, and both sides agree that the tangent line is vertical. May we report that f′(0) = ∞?',
                choices: ['No. A derivative must be a finite number, so ∞ here reports a vertical tangent.', 'Yes. Infinity is an acceptable value, because it matches the steep slope.', 'Yes. Both sides agree on the direction, so the derivative exists there.'], a: 0,
                why: 'Agreement about direction is not agreement about a number. The slopes grow past every bound, so f′(0) does not exist, and the correct description is a vertical tangent line at 0. This is the opposite failure from the corner, where each side had a finite number but the numbers differed.'
            },
            message: 'As the gaps shrink, both readings grow to huge values of the same sign. The two directions agree, but the sizes are unbounded.'
        },
        { params: { kase: 'broken' }, message: 'The hole fails the first row of the verdict board. Without continuity there is no derivative to discuss. A differentiable function is always continuous, but a continuous function need not be differentiable.' },
        {
            params: { kase: 'piecewise', hL: 0.6, hR: 0.6 },
            predict: {
                q: 'Here f uses two formulas that meet at x = 1. Is this graph continuous at x = 1, and is it differentiable there?',
                choices: ['Continuous, because both formulas give 0.5 at x = 1. Not differentiable, because the side slopes are 1 and 2.', 'Neither, because the two formulas do not meet at x = 1, and a broken graph has no slope.', 'Both, because the graph has no gap and no sharp point where the two formulas meet.', 'Differentiable but not continuous, because the side slopes are 1 and 2 and never match.'], a: 0,
                why: 'Check continuity first. Both pieces give 0.5 at x = 1, so the pieces meet. Then check the slopes. The left formula gives slope x, which is 1 at x = 1, and the right formula gives slope 2. The two side slopes disagree, so f′(1) does not exist.'
            },
            message: 'Shrink both gaps and the two readings stop at 1 and at 2. This graph forms a corner from two formulas instead of an absolute value.'
        }
    ],
    summary: {
        idea: 'Differentiability is stricter than continuity. The secant slopes from both sides must settle on one finite number. A smooth point passes, while a corner, a vertical tangent, and a hole each fail for a different reason.',
        mistake: 'A graph with no hole can still have no derivative. For f = |x| at 0 the one-sided slopes are −1 and +1, so no derivative exists there.',
        transfer: 'Take f = 0.5x² for x ≤ 1 and f = 2x − 1.5 for x > 1. First ask whether the function is continuous at 1, then ask whether the two side slopes agree. Pick the last case in the case selector to let the tool check your answers.'
    }
};

function trendNote(c) {
    if (!c.cont) return 'the graph is broken at c, so the slopes cannot trend';
    if (c.finite) return 'both sides settle on one finite slope, so f′(c) = ' + round2(derivative(c.f, c.c)) + ' here';
    if (c.vertical) return 'both slopes grow without bound, so the tangent is vertical';
    return 'the sides settle apart, ' + plain(c.leftM) + ' from the left against ' + plain(c.rightM) + ' from the right';
}
function verdictFor(c) {
    if (!c.cont) return 'No. The function is not continuous.';
    if (c.vertical) return 'No finite derivative. The tangent is vertical.';
    return 'No. The two sides settle on different slopes.';
}
function plain(v) { return v === undefined ? 'no value' : String(v).replace('-', '−'); }
function round2(v) { return String(Math.round(v * 100) / 100); }
