/* 2.1 Secant-to-Tangent Lab — the difference quotient made physical: an
   average rate between two points, an instantaneous rate once they merge. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

export default {
    id: 'u2-secant-tangent',
    meta: { unit: 2, topic: '2.1', title: 'Defining Average and Instantaneous Rates of Change at a Point', visualizerTitle: 'Secant-to-Tangent Lab' },
    intro: 'Two points on a curve give one average rate of change, the slope of the secant line through them. This lab writes that slope as a quotient, shrinks the gap between the two points, and reads the number the quotient settles toward.',
    params: { fSrc: 'x*x', a: 1, h: 1.2, stage: 1 },
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
                kind: 'graph',
                title: env => env.stage >= 4 ? 'The secant line turning into the tangent line' : 'Two points and the secant line',
                height: 330,
                window: env => {
                    /* The frame follows only the base point a and the chosen
                       function, never the gap h. Dragging h (the whole point of
                       the lab) then leaves the picture rock steady, so the
                       student can watch the secant rotate into the tangent
                       instead of fighting a frame that rescales every notch. */
                    const lo = env.a - 1.6;
                    const hi = env.a + 2.5;
                    let ymin = Infinity, ymax = -Infinity;
                    for (let x = lo; x <= hi; x += (hi - lo) / 60) {
                        const y = env.f(x);
                        if (Number.isFinite(y)) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
                    }
                    const fa = env.f(env.a);
                    ymin = Math.min(ymin, fa); ymax = Math.max(ymax, fa);
                    if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymax - ymin < 1) {
                        ymin = fa - 1; ymax = fa + 1;
                    }
                    const pad = (ymax - ymin) * 0.18 + 0.4;
                    return [lo, hi, ymin - pad, ymax + pad];
                },
                curves: [{ fn: 'f', color: 'curveA', label: 'f' }],
                points: (env) => [
                    { x: env.a, fn: 'f', label: '(a, f(a))', color: 'ink' },
                    { x: env.a + env.h, fn: 'f', label: env => env.stage <= 2 ? 'second point b' : 'second point', color: 'accent', drag: { key: 'h', transform: (e, raw) => raw - e.a, min: -1.4, max: 2.2 } }
                ],
                segments: (env) => {
                    const out = [];
                    if (hasGap(env)) {
                        out.push({ x1: env.a - 1, y1: secantAt(env, -1), x2: env.a + 2, y2: secantAt(env, 2), color: 'accent' });
                    }
                    /* The tangent is the conclusion of this lesson, so it stays
                       off the graph until the steps have shrunk h into it. */
                    if (env.stage >= 4) {
                        out.push({ x1: env.a - 1.1, y1: tanAt(env, -1.1), x2: env.a + 1.1, y2: tanAt(env, 1.1), color: 'curveC' });
                    }
                    return out;
                },
                triangle: (env) => Math.abs(env.h) > 0.02
                    ? { fn: 'f', x1: 'a', x2: (e) => e.a + e.h, color: 'auxInk', runLabel: 'h', riseLabel: 'f(a + h) − f(a)' }
                    : null
            },
            {
                kind: 'readout',
                title: env => env.stage >= 4 ? 'The average rate and the instantaneous rate' : 'The average rate between the two points',
                items: env => {
                    const sec = hasGap(env) ? avgRate(env, env.h) : 'needs a nonzero gap';
                    const out = [
                        { label: 'average rate from x = ' + round2(env.a) + ' to x = ' + round3(env.a + env.h), v: sec, color: 'accent', big: true }
                    ];
                    if (env.stage >= 4) {
                        const ins = derivative(env.f, env.a);
                        out.push({ label: 'instantaneous rate at x = ' + round2(env.a), v: ins, color: 'up', big: true });
                        out.push({ label: 'difference of the two rates', v: typeof sec === 'number' ? Math.abs(sec - ins) : 'not yet' });
                    }
                    return out;
                }
            }
        ],
        side: [
            {
                kind: 'eq',
                title: env => env.stage >= 2 ? 'The difference quotient, with live numbers' : 'The slope between two points, with live numbers',
                lines: eqLines
            },
            {
                /* Both one-sided gaps stay on the card at the same time, so the
                   narration can point at two numbers rather than asking the
                   student to remember the screen they just left. */
                kind: 'compare',
                title: 'The same gap taken from each side',
                when: env => env.stage >= 5,
                sides: env => [
                    {
                        title: 'from the right, h = 0.2', lines: [
                            'from x = ' + round2(env.a) + ' to x = ' + round3(env.a + 0.2),
                            'average rate = ' + round3(avgRate(env, 0.2))
                        ]
                    },
                    {
                        title: 'from the left, h = -0.2', lines: [
                            'from x = ' + round2(env.a) + ' to x = ' + round3(env.a - 0.2),
                            'average rate = ' + round3(avgRate(env, -0.2))
                        ]
                    }
                ],
                verdict: env => 'Each gap is 0.2 long, and the two land on opposite sides of x = ' + round2(env.a) + '. Both average rates sit around the instantaneous rate ' + round3(derivative(env.f, env.a)) + '.'
            },
            {
                kind: 'note', title: 'The secant line and its triangle',
                when: env => env.stage < 4,
                text: 'The blue secant line joins the two points on the curve, so its slope is rise divided by run. The triangle marks that run as h and that rise as f(a + h) − f(a). Drag the second point along the curve to change the interval. The gap h slider changes the same interval.'
            },
            {
                kind: 'note', title: 'The two lines on the graph',
                when: env => env.stage >= 4,
                text: 'The blue secant line joins two separate points, so its slope divides by a real nonzero h. The green tangent line is the position the secant line approaches as h shrinks toward 0. The same difference quotient gives both slopes, once with h kept and once in the limit.'
            }
        ]
    },
    steps: [
        {
            params: { fSrc: 'x*x', a: 1, h: 1.2, stage: 1 },
            message: env => 'Two points sit on the curve, the point (a, f(a)) and the second point at b = ' + round3(env.a + env.h) + '. The blue secant line joins them. Its slope is the average rate of change over the interval between the two points, which is rise divided by run.'
        },
        {
            params: { stage: 2 },
            message: 'The side panel now writes that same slope in symbols. The run of the triangle is the gap h, so the second point sits at a + h. Taking b = a + h turns (f(b) − f(a)) / (b − a) into (f(a + h) − f(a)) / h, which is called the difference quotient. Nothing new entered here. Only the name of the gap changed.'
        },
        {
            params: { stage: 3, h: 0.4 },
            message: env => 'The gap is h = ' + round3(env.h) + ', so the average rate from x = ' + round2(env.a) + ' to x = ' + round3(env.a + env.h) + ' reads ' + quoteNum(env) + '. Slide h smaller and watch that one readout. Each smaller gap tilts the blue secant line only a little, and the number moves a little too.'
        },
        {
            params: { h: 0.2 },
            predict: {
                q: 'The average rates approach one number as h shrinks toward 0. Which line does the secant line approach in that limit?',
                choices: ['The secant line approaches the tangent line at x = a, whose slope is f′(a).', 'The secant line approaches a horizontal line, whose slope settles at 0.', 'The secant line approaches a vertical line, whose slope grows without bound.', 'The secant line approaches no single line, because its slope keeps changing with h.'], a: 0,
                why: 'The two points move together until one point remains. The tangent line is the line through that point whose slope is the limit of the secant slopes. That limit is f′(a).'
            },
            message: env => 'With h = ' + round3(env.h) + ' the second point sits close to x = ' + round2(env.a) + ', and the average rate reads ' + quoteNum(env) + '. The gap keeps shrinking toward 0, so that number is settling onto one value. Press Next to see which line on the graph it matches.'
        },
        {
            params: { stage: 4, h: 0.1 },
            message: env => 'Here is the line the secant approaches. The green tangent line touches the curve at x = ' + round2(env.a) + ', and its slope is the instantaneous rate there, so f′(' + round2(env.a) + ') = ' + round3(derivative(env.f, env.a)) + '. The gap h = ' + round3(env.h) + ' is still a real gap, so the blue secant line and the green tangent line sit apart as two lines you can compare, and the average rate reads ' + quoteNum(env) + '. Drag the gap h slider down toward 0.005 and watch the secant close onto the tangent.'
        },
        {
            params: { fSrc: 'x*x+x', a: 2, h: 1, stage: 3 },
            message: env => 'A new curve and the same procedure. The fixed point sits at x = ' + round2(env.a) + ', the gap is h = ' + round2(env.h) + ', and the blue secant line through the two points gives the average rate ' + quoteNum(env) + '. Shrink the gap and watch that one number settle.'
        },
        {
            params: { stage: 4, h: 0.2 },
            predict: {
                q: 'Take this function by hand at a = 2. As h shrinks toward 0, what number do the average rates approach?',
                choices: ['The average rates settle at 5, which is the value of f′(2) for this function.', 'The average rates settle at 6, which is the average rate while h = 1.', 'The average rates grow without bound, because the average rate divides by h.', 'The average rates settle at no number, because each average rate depends on h.'], a: 0,
                why: 'Put f = x² + x and a = 2 into the difference quotient. The average rate becomes ((2 + h)² + (2 + h) − 6) / h, which simplifies to 5 + h. On screen h = 1 reads 6, and the next screen takes h = 0.2, which reads 5.2. As h approaches 0, 5 + h approaches 5, and that limit is f′(2). No rule for derivatives is needed here. The difference quotient itself decides the number.'
            },
            message: env => 'The green tangent line touches this curve at x = ' + round2(env.a) + ', and its slope is the instantaneous rate there, so f′(' + round2(env.a) + ') = ' + round3(derivative(env.f, env.a)) + '. The gap h = ' + round3(env.h) + ' is still a real gap, so the blue secant line and the green tangent line sit apart as two lines you can compare, and the average rate reads ' + quoteNum(env) + '. Drag the gap h slider down and watch that reading come onto 5.'
        },
        {
            params: { stage: 5, h: -0.2 },
            message: env => 'The compare card holds two gaps at once on this curve. From the right, h = 0.2 gives ' + round3(avgRate(env, 0.2)) + '. From the left, h = -0.2 gives ' + round3(avgRate(env, -0.2)) + '. Both close on the instantaneous rate ' + round3(derivative(env.f, env.a)) + ', so it does not matter which side h shrinks from. The secant drawn on the graph is the one from the left, and dragging h across 0 keeps returning the same number. Topic 2.4 takes up the case where the two sides fail to agree.'
        }
    ],
    summary: {
        idea: 'A derivative begins as the slope of a secant line through two points. Taking the limit as h approaches 0 turns that slope into an instantaneous rate. The value f′(a) is exactly the number that the secant slopes approach.',
        mistake: 'Treating the average rate and the instantaneous rate as one number. For f = x² on [1, 3] the average rate is 4, while the instantaneous rate at x = 1 is 2. The first question is about an interval and the second about a single point.',
        transfer: 'Take f = x² at a = 3. Compute the secant slope by hand with h = 1, then with h = 0.1. Then guess the value of f′(3) before you check it here.'
    }
};

function eqLines(env) {
    const val = quoteNum(env);
    if (env.stage === 1) {
        return [
            { t: 'Call the second point b = ' + round3(env.a + env.h), color: 'accent' },
            { t: 'average rate = rise / run' },
            { t: '(f(b) − f(a)) / (b − a) = ' + val, hl: true, color: 'accent' }
        ];
    }
    if (env.stage === 2) {
        return [
            { t: '(f(b) − f(a)) / (b − a)', dim: true },
            { t: 'take b = a + h', rule: 'the run b − a is the gap h' },
            { t: '(f(a + h) − f(a)) / h = ' + val, hl: true, color: 'accent' }
        ];
    }
    if (env.stage === 3) {
        return [
            { t: 'The gap h = ' + round3(env.h), color: 'accent' },
            { t: '(f(a + h) − f(a)) / h = ' + val, hl: true, color: 'accent' },
            { t: 'as h approaches 0 the average rate approaches one number', color: 'up' }
        ];
    }
    return [
        { t: 'The gap h = ' + round3(env.h), color: 'accent' },
        { t: '(f(a + h) − f(a)) / h = ' + val, hl: true, color: 'accent' },
        { t: 'lim h→0  (f(a + h) − f(a)) / h = f′(a)', hl: true, color: 'up' },
        { t: 'f′(' + round2(env.a) + ') = ' + round3(derivative(env.f, env.a)), color: 'up' }
    ];
}

function secantAt(env, dx) {
    const m = avgRate(env, env.h);
    return env.f(env.a) + m * dx;
}
function tanAt(env, dx) {
    const m = derivative(env.f, env.a);
    return env.f(env.a) + m * dx;
}
/* One difference quotient for every reading of it. The gap arrives as an
   argument so the two sided card can ask for h and −h from the same curve. */
function avgRate(env, gap) {
    return (env.f(env.a + gap) - env.f(env.a)) / gap;
}
function quoteNum(env) {
    if (!hasGap(env)) return 'An average rate needs a nonzero gap';
    return round3(avgRate(env, env.h));
}
/* One gap test for the secant line and the quotient reading. The cutoff sits
   below the smallest nonzero gap the h slider can show, so a student who
   drags h down to 0.005 on the reveal screen still divides by a real h. */
function hasGap(env) { return Math.abs(env.h) > 0.004; }
function round3(v) { return String(Math.round(v * 1000) / 1000); }
function round2(v) { return String(Math.round(v * 100) / 100); }
