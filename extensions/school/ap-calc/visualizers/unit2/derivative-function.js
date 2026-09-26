/* 2.2 Derivative Definition Builder — sweep x, plot the tangent slope as a
   height, and watch the new function f′ assemble itself point by point. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const SRC = {
    sq: { label: 'f(x) = x²', f: (x) => x * x, fp: (x) => 2 * x, win: [-2.2, 2.6, -1.2, 7], fwin: [-2.2, 2.6, -5.5, 6.5] },
    cb: { label: 'f(x) = x³', f: (x) => x * x * x, fp: (x) => 3 * x * x, win: [-2.6, 2.6, -7, 7], fwin: [-2.6, 2.6, -1.5, 15] },
    si: { label: 'f(x) = sin x', f: (x) => Math.sin(x), fp: (x) => Math.cos(x), win: [-2.4, 5.8, -1.6, 1.6], fwin: [-2.4, 5.8, -1.6, 1.6] }
};

export default {
    id: 'u2-derivative-function',
    meta: { unit: 2, topic: '2.2', title: 'Defining the Derivative of a Function and Using Derivative Notation', visualizerTitle: 'Derivative Definition Builder' },
    intro: 'The upper graph shows the height f(x). The lower graph shows the slope f′(x) at that same x. Move the probe on the upper graph and one point appears on the lower graph.',
    params: { kase: 'sq', x0: 1, stamps: 3 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: Object.keys(SRC).map(k => ({ v: k, label: SRC[k].label }))
        },
        { key: 'x0', label: 'probe x', min: -2, max: 2.4, step: 0.02 },
        { key: 'stamps', label: 'sampled slopes', min: 0, max: 22, step: 1 }
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
                points: env => [{ x: env.x0, fn: 'f', label: 'probe', color: 'accent', drag: { key: 'x0', min: -2, max: 2.4 } }]
            },
            {
                kind: 'graph', title: 'The graph of f′: each height is a slope', height: 220,
                window: env => SRC[env.kase].fwin,
                curves: env => [{ fn: (x) => derivative(SRC[env.kase].f, x), color: 'curveC', dashed: env.stamps < 22, label: 'f′' }],
                points: env => {
                    const pts = [];
                    const win = SRC[env.kase].win;
                    const step = (win[1] - win[0]) / 22;
                    for (let i = 0; i < env.stamps; i++) {
                        const x = win[0] + step * (i + 1);
                        pts.push({ x, y: derivative(SRC[env.kase].f, x), color: 'up', r: 3 });
                    }
                    pts.push({ x: env.x0, y: derivative(SRC[env.kase].f, env.x0), color: 'accent', label: 'f′(' + round2(env.x0) + ')', r: 5 });
                    return pts;
                },
                vlines: env => [{ x: env.x0, color: 'auxInk', dash: false }]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Two values at the probe position',
                items: env => [
                    { label: 'f(' + round2(env.x0) + ')  height of the curve at the probe', v: SRC[env.kase].f(env.x0), color: 'accent' },
                    { label: 'f′(' + round2(env.x0) + ')  slope of the curve at the probe', v: derivative(SRC[env.kase].f, env.x0), color: 'up', big: true }
                ]
            },
            {
                kind: 'eq', title: 'Derivative notation',
                lines: env => [
                    { t: 'At one point:  f′ at one x is one number', rule: kaseRule(env) },
                    { t: 'As a function:  f′(x) is a slope formula for each x', hl: true },
                    { t: 'These names all mean the derivative f′:', rule: 'y′, dy/dx, d/dx[f]' },
                    { t: env.kase === 'sq' ? 'f′(x) = 2x' : env.kase === 'cb' ? 'f′(x) = 3x²' : 'f′(x) = cos x', color: 'up', hl: env.stamps >= 22 }
                ]
            },
            {
                kind: 'note', tone: 'warn', title: 'Where the slope has no value', text: 'If the slopes from the two sides do not settle to one value, then f′ has no value at that x. The lower graph then has no point to plot there, as it does at a corner, a vertical tangent, or a hole. The domain of f′ can be smaller than the domain of f.'
            }
        ]
    },
    steps: [
        { params: { kase: 'sq', x0: -1.6, stamps: 2 }, message: 'The lower graph holds two measured slopes so far. Move the probe and raise the sampled slopes slider. The height of the curve becomes the slope below.' },
        { params: { stamps: 8 }, message: env => env.stamps + ' slopes have been measured now, and the points are starting to line up. What shape do those points form?' },
        {
            params: { stamps: 16 },
            predict: {
                q: 'For f = x², what shape do the sample points form on the lower graph? What is the height of that shape at x = 1?',
                choices: ['The points form a straight line through the origin. The line has height 2 at x = 1.', 'The points form a parabola. The parabola has the same shape as the graph of f.', 'The points form a horizontal line. That line has height 1 at every x.', 'The points form no pattern. The measured slopes never line up into a curve.'], a: 0,
                why: 'The slopes of x² follow 2x, which is a line through the origin. The slope is 0 at x = 0, where the parabola is flat, and 2 at x = 1. The derivative of a quadratic function is a linear function.'
            },
            message: 'Add the rest of the sample points. The dashed preview then settles onto the line 2x.'
        },
        { params: { stamps: 22 }, message: 'The full set of points confirms f′(x) = 2x. Each x contributes one slope, and those slopes form a function of their own.' },
        {
            params: { kase: 'cb', stamps: 4 },
            predict: {
                q: 'Now the function is f = x³. Where must f′ equal zero, and what sign does f′ have away from that x?',
                choices: ['Zero at x = 0, where the curve is flat. Away from 0 the slope is positive on both sides.', 'Zero at x = 0, where the curve is flat. Left of 0 the slope is negative and right of 0 the slope is positive.', 'Never zero, because x³ keeps rising. The slope is positive at every x.'], a: 0,
                why: 'The curve x³ rises through the origin but flattens at that one point, so f′(0) = 0. The curve rises on both sides of 0, and f′ = 3x² is positive for every other x.'
            },
            message: 'Find the flat moment with the probe: as the probe nears x = 0, the point below falls to height 0.'
        },
        { params: { kase: 'si', stamps: 22 }, message: 'The upper curve is f = sin x. The slopes are 0 at each peak and each valley, and reach 1 and −1 where the curve crosses the x axis. The points below trace out cos x, and topic 2.7 proves that derivative.' }
    ],
    summary: {
        idea: 'The derivative function f′ records the instantaneous slope of f at every x where that slope exists. The statement f′(2) = 4 names one number for one x. The formula f′(x) = 2x names the whole function that produced it.',
        mistake: 'Reading f′ as a second copy of f. The two graphs share the same x values but measure different things. The upper graph measures the height of f, and the lower graph measures the steepness of f.',
        transfer: 'For f = |x|, predict which points the lower graph can plot near 0 and which single point it cannot plot. Topic 2.4 explains the missing point at x = 0.'
    }
};

function kaseRule(env) {
    if (env.kase === 'sq') return 'For example, f′(2) = 4';
    if (env.kase === 'cb') return 'For example, f′(1) = 3';
    return 'For example, f′(0) = 1';
}
function round2(v) { return String(Math.round(v * 100) / 100); }
