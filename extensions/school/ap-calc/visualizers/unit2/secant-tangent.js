/* 2.1 Secant-to-Tangent Lab — the difference quotient made physical: an
   average rate between two points, an instantaneous rate once they merge. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

export default {
    id: 'u2-secant-tangent',
    meta: { unit: 2, topic: '2.1', title: 'Defining Average and Instantaneous Rates of Change at a Point', visualizerTitle: 'Secant-to-Tangent Lab' },
    intro: 'While h is a nonzero number, the difference quotient gives the average rate of change between two points. As h approaches 0, the same quotient gives the instantaneous rate of change at one point.',
    params: { fSrc: 'x*x', a: 1, h: 1.2 },
    fns: {
        f: (x, env) => env.fSrc === 'x*x+x' ? x * x + x : x * x
    },
    controls: [
        {
            key: 'fSrc', label: 'function', kind: 'choice',
            options: [{ v: 'x*x', label: 'f(x) = x²' }, { v: 'x*x+x', label: 'f(x) = x² + x' }]
        },
        { key: 'a', label: 'fixed point a', min: 0.3, max: 2.6, step: 0.05 },
        { key: 'h', label: 'gap h', min: -1.4, max: 2.2, step: 0.005 }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: 'The secant line turning into the tangent line', height: 330,
                window: env => {
                    const xb = env.a + env.h;
                    return [-0.8, Math.max(4.2, xb + 0.6), -0.6, Math.max(12, env.f(xb) + 1, env.f(env.a) + 1)];
                },
                curves: [{ fn: 'f', color: 'curveA', label: 'f' }],
                points: (env) => [
                    { x: env.a, fn: 'f', label: '(a, f(a))', color: 'ink' },
                    { x: env.a + env.h, fn: 'f', label: 'second point', color: 'accent', drag: { key: 'h', transform: (e, raw) => raw - e.a, min: -1.4, max: 2.2 } }
                ],
                segments: (env) => {
                    const out = [];
                    if (Math.abs(env.h) > 0.02) {
                        out.push({ x1: env.a - 1, y1: secantAt(env, -1), x2: env.a + 2, y2: secantAt(env, 2), color: 'accent' });
                    }
                    out.push({ x1: env.a - 1.1, y1: tanAt(env, -1.1), x2: env.a + 1.1, y2: tanAt(env, 1.1), color: 'curveC', dashed: Math.abs(env.h) > 0.06 });
                    return out;
                },
                triangle: (env) => Math.abs(env.h) > 0.02 ? { fn: 'f', x1: 'a', x2: (e) => e.a + e.h, color: 'auxInk' } : null
            },
            {
                kind: 'readout', title: 'The average rate and the instantaneous rate',
                items: env => {
                    const sec = Math.abs(env.h) > 0.008 ? (env.f(env.a + env.h) - env.f(env.a)) / env.h : 'needs a nonzero gap';
                    const ins = derivative(env.f, env.a);
                    return [
                        { label: 'average rate on [' + round2(env.a) + ', ' + round2(env.a + env.h) + ']', v: sec, color: 'accent', big: true },
                        { label: 'instantaneous rate at x = ' + round2(env.a), v: ins, color: 'up', big: true },
                        { label: 'difference of the two rates', v: typeof sec === 'number' ? Math.abs(sec - ins) : 'not yet' }
                    ];
                }
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The difference quotient, with live numbers',
                lines: env => [
                    { t: 'f(a+h) − f(a)', color: 'accent' },
                    { t: '─────────────   h = ' + round3(env.h), color: 'accent', hl: true },
                    { t: '      h', color: 'accent' },
                    { t: '= ' + quoteNum(env), rule: 'an average rate' },
                    { t: 'lim h→0  [f(a+h) − f(a)]/h = f′(a)', hl: Math.abs(env.h) < 0.06, color: 'up' },
                    { t: 'f′(' + round2(env.a) + ') = ' + round3(derivative(env.f, env.a)), color: 'up', dim: Math.abs(env.h) > 0.06 }
                ]
            },
            {
                kind: 'note', title: 'The two lines on the graph', text: 'The blue secant line joins two separate points, so its slope divides by a real nonzero h. The green tangent line is the position the secant line approaches as h shrinks toward 0. The same difference quotient gives both slopes, once with h kept and once in the limit.'
            }
        ]
    },
    steps: [
        {
            params: { fSrc: 'x*x', a: 1, h: 1.2 },
            message: env => 'The secant line runs from x = ' + round2(env.a) + ' to x = ' + round2(env.a + env.h) + ', so its slope is the average rate over that interval. Drag the second point along the curve to change the interval. The gap h slider changes the same interval.'
        },
        {
            params: { h: 0.4 },
            predict: {
                q: 'The average rates approach one number as h shrinks toward 0. Which line does the secant line approach in that limit?',
                choices: ['The secant line approaches the tangent line at x = a, whose slope is f′(a).', 'The secant line approaches a horizontal line, whose slope settles at 0.', 'The secant line approaches a vertical line, whose slope grows without bound.', 'The secant line approaches no single line, because its slope keeps changing with h.'], a: 0,
                why: 'The two points move together until one point remains. The tangent line is the line through that point whose slope is the limit of the secant slopes. That limit is f′(a).'
            },
            message: 'The point away from x = 1 is the one you drag. Halving the gap h tilts the blue secant line only a little, and its slope settles toward 2. That number is the slope of the green tangent line at x = 1.'
        },
        {
            params: { h: 0.05 },
            message: env => 'The average rate and the instantaneous rate now differ by only ' + round3(Math.abs((env.f(env.a + env.h) - env.f(env.a)) / env.h - derivative(env.f, env.a))) + '. Drag the second point toward x = 1 and watch the difference fall toward 0.'
        },
        {
            params: { h: 0.005 },
            message: env => 'The gap is now h = ' + round3(env.h) + ', small but never zero, so the average rate still divides by a real h. The limit supplies the final value: for f = x² that value is f′(' + round2(env.a) + ') = ' + round3(derivative(env.f, env.a)) + '.'
        },
        {
            params: { fSrc: 'x*x+x', a: 2, h: 1 },
            predict: {
                q: 'Now the function is f = x² + x at a = 2. As h shrinks toward 0, what number do the average rates approach?',
                choices: ['The average rates settle at 5, which is the value of f′(2) for this function.', 'The average rates settle at 4, which is the value from the rule 2x alone.', 'The average rates settle at 6, which is the average rate while h = 1.', 'The average rates settle at no number, because each average rate depends on h.'], a: 0,
                why: 'For f = x² + x the derivative function is f′(x) = 2x + 1, and f′(2) = 5. As h shrinks toward 0, each average rate approaches that number.'
            },
            message: env => 'The function is new but the procedure is the same. With h = ' + round2(env.h) + ' the average rate reads ' + round3((env.f(env.a + env.h) - env.f(env.a)) / env.h) + '. Each smaller gap moves the average rate toward f′(2) = 5.'
        }
    ],
    summary: {
        idea: 'A derivative begins as the slope of a secant line through two points. Taking the limit as h approaches 0 turns that slope into an instantaneous rate. The value f′(a) is exactly the number that the secant slopes approach.',
        mistake: 'Treating the average rate and the instantaneous rate as one number. For f = x² on [1, 3] the average rate is 4, while the instantaneous rate at x = 1 is 2. The first question is about an interval and the second about a single point.',
        transfer: 'Take f = x² at a = 3. Compute the secant slope by hand with h = 1, then with h = 0.1. Then guess the value of f′(3) before you check it here.'
    }
};

function secantAt(env, dx) {
    const m = (env.f(env.a + env.h) - env.f(env.a)) / env.h;
    return env.f(env.a) + m * dx;
}
function tanAt(env, dx) {
    const m = derivative(env.f, env.a);
    return env.f(env.a) + m * dx;
}
function quoteNum(env) {
    if (Math.abs(env.h) < 0.008) return 'An average rate needs a nonzero gap';
    return round3((env.f(env.a + env.h) - env.f(env.a)) / env.h);
}
function round3(v) { return String(Math.round(v * 1000) / 1000); }
function round2(v) { return String(Math.round(v * 100) / 100); }
