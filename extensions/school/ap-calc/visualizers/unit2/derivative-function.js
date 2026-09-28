/* 2.2 Derivative Definition Builder — sweep x, plot the tangent slope as a
   height, and watch the new function f′ assemble itself point by point. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const SRC = {
    sq: { label: 'f(x) = x²', f: (x) => x * x, fp: (x) => 2 * x, win: [-2.2, 2.6, -1.2, 7], fwin: [-2.2, 2.6, -5.5, 6.5] },
    cb: { label: 'f(x) = x³', f: (x) => x * x * x, fp: (x) => 3 * x * x, win: [-2.6, 2.6, -7, 7], fwin: [-2.6, 2.6, -1.5, 15] },
    si: { label: 'f(x) = sin x', f: (x) => Math.sin(x), fp: (x) => Math.cos(x), win: [-2.4, 2.4, -1.6, 1.6], fwin: [-2.4, 2.4, -1.6, 1.6] }
};

/* The whole lesson is the samples arriving before the answer. The derivative
   curve stays off the lower graph until the sample set is complete, so the
   student has to name the shape while the dots are the only evidence. */
const REVEAL = 22;
/* The samples slider tops out at REVEAL, so a student can reach it on the sin x
   case by hand. That must not draw the cos curve or name it: topic 2.7 owns
   that identification. */
const isRevealed = (env) => env.stamps >= REVEAL && env.kase !== 'si';

export default {
    id: 'u2-derivative-function',
    meta: { unit: 2, topic: '2.2', title: 'Defining the Derivative of a Function and Using Derivative Notation', visualizerTitle: 'Derivative Definition Builder' },
    intro: 'The upper graph shows the height f(x). The lower graph shows the slope of that curve at the same x. Move the probe on the upper graph to place one bright point below, and raise the slope samples slider to place more points at fixed x positions.',
    params: { kase: 'sq', x0: 1, stamps: 3 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: Object.keys(SRC).map(k => ({ v: k, label: SRC[k].label }))
        },
        { key: 'x0', label: 'probe x', min: -2, max: 2.4, step: 0.02 },
        { key: 'stamps', label: 'slope samples', min: 0, max: 22, step: 1 }
    ],
    fns: {
        f: (x, env) => SRC[env.kase].f(x)
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => SRC[env.kase].label + ' and the tangent line at the probe', height: 250,
                window: env => SRC[env.kase].win,
                curves: [{ fn: 'f', color: 'curveA' }],
                segments: env => [{
                    x1: env.x0 - 0.9, y1: SRC[env.kase].f(env.x0) - 0.9 * derivative(SRC[env.kase].f, env.x0),
                    x2: env.x0 + 0.9, y2: SRC[env.kase].f(env.x0) + 0.9 * derivative(SRC[env.kase].f, env.x0),
                    color: 'accent'
                }],
                points: env => [{ x: env.x0, fn: 'f', label: 'input x = ' + round2(env.x0), color: 'accent', drag: { key: 'x0', min: -2, max: 2.4 } }]
            },
            {
                kind: 'graph',
                title: env => isRevealed(env) ? 'The graph of f′: each height is a slope' : 'Each height is the slope of the curve above at that x',
                height: 220,
                window: env => SRC[env.kase].fwin,
                curves: env => (isRevealed(env) ? [{ fn: (x) => derivative(SRC[env.kase].f, x), color: 'curveC', label: 'f′' }] : []),
                points: env => {
                    const pts = [];
                    const win = SRC[env.kase].win;
                    const step = (win[1] - win[0]) / 22;
                    for (let i = 0; i < env.stamps; i++) {
                        const x = win[0] + step * (i + 1);
                        pts.push({ x, y: derivative(SRC[env.kase].f, x), color: 'up', r: 3 });
                    }
                    pts.push({ x: env.x0, y: derivative(SRC[env.kase].f, env.x0), color: 'accent', label: 'output slope = ' + round2(derivative(SRC[env.kase].f, env.x0)), r: 5 });
                    return pts;
                },
                vlines: env => [{ x: env.x0, color: 'auxInk', dash: false }]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The definition, with the target point free',
                lines: [
                    { t: 'Topic 2.1 aimed at one fixed point a.', dim: true, rule: 'one number' },
                    { t: 'f′(a) = lim h→0  (f(a + h) − f(a)) / h', dim: true },
                    { t: 'Here the target point is allowed to move, so a becomes x.', hl: true },
                    { t: 'f′(x) = lim h→0  (f(x + h) − f(x)) / h', hl: true, color: 'up', rule: 'whenever that limit exists' },
                    { t: 'One x goes in, one slope comes out.', rule: 'that output is the height below' }
                ]
            },
            {
                kind: 'readout', title: 'Two values at the probe position',
                items: env => [
                    { label: 'f(' + round2(env.x0) + ')  height of the curve at the probe', v: SRC[env.kase].f(env.x0), color: 'accent' },
                    { label: 'f′(' + round2(env.x0) + ')  slope of the curve at the probe', v: derivative(SRC[env.kase].f, env.x0), color: 'up', big: true }
                ]
            },
            {
                kind: 'eq', title: 'Derivative notation: function vs value',
                lines: notationLines
            },
            {
                kind: 'note', tone: 'warn', title: 'Where the slope has no value', text: 'For f′(x) to exist, the slopes from both sides must approach the same finite number. Where that fails, the lower graph has no point to plot there, as it does at a corner, a vertical tangent, a cusp, or a hole. A corner gives two different finite slopes. A vertical tangent and a cusp give slopes that grow past every number. A hole is not even continuous. The domain of f′ can be smaller than the domain of f.'
            }
        ]
    },
    steps: [
        {
            params: { kase: 'sq', x0: -1.6, stamps: 2 },
            message: 'Topic 2.1 ended with one number for one fixed point a. The side panel now writes the same limit with the target point free, and that is the definition of f′. Two slope samples sit on the lower graph. Drag the probe on the upper graph, then raise the slope samples slider.'
        },
        {
            params: { stamps: 8 },
            message: env => 'The program placed these ' + env.stamps + ' samples at fixed x positions, so they are not a record of where you dragged. Each sample height is the slope of the upper curve at its own x. The bright point is the only sample that follows your probe.'
        },
        {
            params: { stamps: 12 },
            predict: {
                q: 'For f = x², every point on the lower graph is a measured slope. What shape do those slope samples form? What is the height of that shape at x = 1?',
                choices: ['The samples form a straight line through the origin. The line has height 2 at x = 1.', 'The samples form a parabola. The parabola has the same shape as the graph of f.', 'The samples form a horizontal line. That line has height 1 at every x.', 'The samples form no pattern. The measured slopes never line up into a curve.'], a: 0,
                why: 'The slopes of x² follow 2x, which is a line through the origin. The slope is 0 at x = 0, where the parabola is flat, and 2 at x = 1. The derivative of a quadratic function is a linear function.'
            },
            message: env => env.stamps >= REVEAL
                ? 'The sample set is complete, so the curve is drawn too. Judge the shape from the samples themselves before you press Next.'
                : env.stamps + ' samples sit below, and no curve is drawn through them. Answer from the samples alone, then press Next.'
        },
        {
            params: { stamps: 22 },
            message: 'The last samples are in place, and the curve they were forming is drawn: f′(x) = 2x. Each x contributes one slope, and those slopes form a function of their own. The side panel now names that rule in every notation.'
        },
        {
            params: { kase: 'cb', x0: -1.6, stamps: 16 },
            message: 'The case is now f = x³, with 16 samples already placed below. They are still the only evidence, because no curve is drawn through them.'
        },
        {
            params: {},
            predict: {
                q: 'The lower graph holds the measured slopes of x³. Where must f′ equal zero, and what sign does f′ have away from that x?',
                choices: ['Zero at x = 0, where the curve is flat. Away from 0 the slope is positive on both sides.', 'Zero at x = 0, where the curve is flat. Left of 0 the slope is negative and right of 0 the slope is positive.', 'Never zero, because x³ keeps rising. The slope is positive at every x.'], a: 0,
                why: 'The curve x³ rises through the origin but flattens at that one point, so f′(0) = 0. The curve rises on both sides of 0, and f′ = 3x² is positive for every other x.'
            },
            message: 'Slide the probe across x = 0 and watch the bright point below fall to height 0. One sample sits exactly at x = 0 with height 0, because the curve above is flat there.'
        },
        {
            params: { stamps: 22 },
            message: 'With every sample placed, the curve is drawn. It touches height 0 at x = 0 and stays above 0 on both sides, which is the picture of f′(x) = 3x². The flat moment of the curve above is the only x where the slope reads 0.'
        },
        {
            params: { kase: 'si', x0: 0, stamps: 15 },
            message: 'The upper curve is f = sin x, and the probe sits where the curve crosses the x axis, so the slope there reads 1. The samples near the peak and near the valley sit close to height 0, where the curve is flat for a moment. The slope data forms a familiar wave shape, and topic 2.7 identifies and proves that function. The samples below stay on their own, so read this as a picture for now.'
        }
    ],
    summary: {
        idea: 'The derivative function f′ records the instantaneous slope of f at every x where that slope exists. The statement f′(2) = 4 names one number for one x. The formula f′(x) = 2x names the whole function that produced it.',
        mistake: 'Reading f′ as a second copy of f. The two graphs share the same x values but measure different things. The upper graph measures the height of f, and the lower graph measures the steepness of f.',
        transfer: 'Sketch f = |x| and its slope by hand. Right of 0 every slope is +1, and left of 0 every slope is −1. At x = 0 the graph has a corner, so f′ has no value there and the slope graph has a gap. Topic 2.4 shows that corner case on screen.'
    }
};

function notationLines(env) {
    const v = kaseNumbers(env);
    const out = [
        { t: 'If y = f(x):', color: 'ink' },
        { t: 'f′(x) = y′ = dy/dx', hl: true, color: 'up' },
        { t: '= d/dx [f(x)]', hl: true, color: 'up', rule: 'four names, one function' },
        { t: 'Each of these names the derivative function of f.', color: 'ink' }
    ];
    /* The rule is the conclusion of the sample work, so it waits for the curve.
       The sin x case never states its rule here, even at a full sample set. */
    if (isRevealed(env)) {
        out.push({ t: 'Here that function is f′(x) = ' + v.rhs, rule: v.note });
    } else if (env.kase === 'si') {
        out.push({ t: 'These samples trace a wave, and no rule for it is stated here.', rule: 'topic 2.7 names it and proves it' });
    } else {
        out.push({ t: 'The slope samples below are how f′(x) gets built.', rule: 'no rule stated yet' });
    }
    out.push(
        { t: 'At one input these same symbols name one number:', color: 'ink' },
        { t: 'f′(' + v.at + ') = ' + v.val },
        { t: 'y′ at x = ' + v.at + ' = ' + v.val },
        { t: 'dy/dx at x = ' + v.at + ' = ' + v.val },
        { t: 'd/dx [f(x)] at x = ' + v.at + ' = ' + v.val, rule: 'one number' }
    );
    return out;
}
function kaseNumbers(env) {
    if (env.kase === 'cb') return { at: '1', val: '3', rhs: '3x²', note: 'a rule, not one number' };
    if (env.kase === 'si') return { at: '0', val: '1', rhs: 'cos x', note: 'the wave topic 2.7 identifies and proves' };
    return { at: '2', val: '4', rhs: '2x', note: 'a rule, not one number' };
}
function round2(v) { return String(Math.round(v * 100) / 100); }
