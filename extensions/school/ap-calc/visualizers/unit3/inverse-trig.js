/* 3.4 Inverse Trig Derivative Explorer — each formula is built, not handed over.
   Four phases run one centre visual at a time: the inverse relationship, the
   implicit differentiation of it, the triangle that converts the leftover trig
   quantity back into x, and finally the graph that agrees with the answer. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const n = v => String(Math.round(v * 1000) / 1000);
const root1 = x => Math.sqrt(Math.max(0, 1 - x * x));

const CASES = {
    asin: {
        inverse: 'arcsin x', angle: 'y', rewritten: 'sin y = x',
        base: (x) => Math.sin(x), baseFrom: -1.5708, baseTo: 1.5708, baseLabel: 'sin x, restricted',
        inv: x => Math.asin(x), dy: x => 1 / root1(x),
        diffLine: 'cos y · dy/dx = 1', solveLine: 'dy/dx = 1 / cos y',
        convert: 'cos y = √(1 − x²)', final: 'd/dx arcsin x = 1 / √(1 − x²)',
        adj: x => root1(x), adjLabel: 'adj: √(1 − x²)', opp: x => x, oppLabel: 'opp: x', hypLabel: 'hyp: 1',
        mirror: [-1.9, 1.9, -1.9, 1.9], drag: [-0.99, 0.99],
        winX: [-1.04, 1.04], winF: [-1.62, 1.62], winD: [0, 6]
    },
    acos: {
        inverse: 'arccos x', angle: 'y', rewritten: 'cos y = x',
        base: (x) => Math.cos(x), baseFrom: 0, baseTo: 3.1416, baseLabel: 'cos x, restricted',
        inv: x => Math.acos(x), dy: x => -1 / root1(x),
        diffLine: '−sin y · dy/dx = 1', solveLine: 'dy/dx = −1 / sin y',
        convert: 'sin y = √(1 − x²)', final: 'd/dx arccos x = −1 / √(1 − x²)',
        adj: x => x, adjLabel: 'adj: x', opp: x => root1(x), oppLabel: 'opp: √(1 − x²)', hypLabel: 'hyp: 1',
        mirror: [-1.9, 3.5, -1.9, 3.5], drag: [-0.99, 0.99],
        winX: [-1.04, 1.04], winF: [-0.3, 3.5], winD: [-6, 0]
    },
    atan: {
        inverse: 'arctan x', angle: 'y', rewritten: 'tan y = x',
        base: (x) => Math.tan(x), baseFrom: -1.4, baseTo: 1.4, baseLabel: 'tan x, restricted',
        inv: x => Math.atan(x), dy: x => 1 / (1 + x * x),
        diffLine: 'sec²y · dy/dx = 1', solveLine: 'dy/dx = 1 / sec²y',
        convert: 'sec²y = 1 + tan²y = 1 + x²', final: 'd/dx arctan x = 1 / (1 + x²)',
        adj: x => 1, adjLabel: 'adj: 1', opp: x => x, oppLabel: 'opp: x', hypLabel: 'hyp: √(1 + x²)',
        mirror: [-2.4, 2.4, -2.4, 2.4], drag: [-3.8, 3.8],
        winX: [-4, 4], winF: [-1.7, 1.7], winD: [0, 1.2]
    }
};

const caseOf = env => CASES[env.kase];
const phase = p => env => Math.round(env.phase) === p;

/* Magnitudes are drawn, so the triangle never flips inside-out on a negative x.
   The algebra labels stay symbolic: the picture is about which side is which. */
function trianglePanes(env) {
    const c = caseOf(env);
    const cap = env.kase === 'atan' ? 1.3 : 1;
    const mag = Math.min(Math.max(Math.abs(env.x0), 0.2), cap);
    const s = 1.3, ox = 0.3;
    const adj = Math.max(c.adj(mag) * s, 0.25), opp = c.opp(mag) * s;
    const C = { x: ox, y: 0 }, A = { x: ox + adj, y: 0 }, B = { x: A.x, y: opp };
    const r = 0.14;
    const segs = [
        { x1: C.x, y1: C.y, x2: A.x, y2: A.y, color: 'curveC' },
        { x1: A.x, y1: A.y, x2: B.x, y2: B.y, color: 'curveB' },
        { x1: B.x, y1: B.y, x2: C.x, y2: C.y, color: 'auxInk' }
    ];
    /* right-angle tick at A, then a chord arc for the angle at A, swept from the
       direction of C to the direction of B */
    segs.push({ x1: A.x - r, y1: A.y, x2: A.x - r, y2: A.y + r, color: 'auxInk' });
    segs.push({ x1: A.x - r, y1: A.y + r, x2: A.x, y2: A.y + r, color: 'auxInk' });
    const a0 = Math.PI, a1 = Math.PI / 2, rad = 0.32;
    for (let i = 0; i < 5; i++) {
        const t0 = a0 + (a1 - a0) * (i / 5), t1 = a0 + (a1 - a0) * ((i + 1) / 5);
        segs.push({
            x1: A.x + rad * Math.cos(t0), y1: A.y + rad * Math.sin(t0),
            x2: A.x + rad * Math.cos(t1), y2: A.y + rad * Math.sin(t1),
            color: 'accent'
        });
    }
    return {
        segs, C, A, B,
        notes: [
            { x: (C.x + A.x) / 2, y: 0.02, t: c.adjLabel, color: 'curveC' },
            { x: A.x + 0.05, y: (A.y + B.y) / 2, t: c.oppLabel, color: 'curveB' },
            { x: (C.x + B.x) / 2 - 0.1, y: (C.y + B.y) / 2 + 0.1, t: c.hypLabel, color: 'auxInk' },
            { x: A.x - 0.5, y: 0.34, t: 'angle = ' + c.angle, color: 'accent' }
        ]
    };
}

export default {
    id: 'u3-inverse-trig',
    meta: { unit: 3, topic: '3.4', title: 'Differentiating Inverse Trigonometric Functions', visualizerTitle: 'Inverse Trig Derivative Explorer' },
    intro: 'Write the inverse function as a trig equation. Differentiate both sides implicitly, then use a right triangle or an identity to finish.',
    params: { kase: 'asin', phase: 1, x0: 0.5, mistake: 0, transfer: 0 },
    controls: [
        {
            key: 'kase', label: 'inverse function', kind: 'choice',
            options: [
                { v: 'asin', label: 'arcsin x' },
                { v: 'acos', label: 'arccos x' },
                { v: 'atan', label: 'arctan x' }
            ]
        },
        {
            key: 'phase', label: 'phase', kind: 'choice',
            options: [
                { v: 1, label: '1: the inverse relationship' },
                { v: 2, label: '2: differentiate both sides' },
                { v: 3, label: '3: triangle back to x' },
                { v: 4, label: '4: check the graphs' }
            ]
        },
        { key: 'x0', label: 'x', min: -0.98, max: 0.98, step: 0.01, when: env => phaseTest(env, 4) && env.kase !== 'atan' },
        { key: 'x0', label: 'x', min: -3.8, max: 3.8, step: 0.02, when: env => phaseTest(env, 4) && env.kase === 'atan' }
    ],
    fns: {
        baseCurve: (x, env) => caseOf(env).base(x),
        invCurve: (x, env) => caseOf(env).inv(x),
        slopeCurve: (x, env) => caseOf(env).dy(x),
        identity: x => x,
        cscCurve: x => 1 / Math.sin(x)
    },
    compute: env => {
        const c = caseOf(env);
        const x = Math.max(Math.min(env.x0, c.winX[1] - 0.06), c.winX[0] + 0.06);
        return { xq: x, fx: c.inv(x), dx: c.dy(x) };
    },
    panes: {
        main: [
            {
                kind: 'graph', width: 460, height: 460, title: env => 'Phase 1: y = ' + caseOf(env).inverse + ' means ' + caseOf(env).rewritten,
                when: phase(1),
                window: env => caseOf(env).mirror,
                curves: env => {
                    const c = caseOf(env);
                    return [
                        { fn: 'baseCurve', from: c.baseFrom, to: c.baseTo, dashed: true, color: 'curveB', label: c.baseLabel },
                        { fn: 'invCurve', color: 'curveA', label: c.inverse },
                        { fn: 'identity', dashed: true, color: 'auxInk', label: 'y = x' }
                    ];
                }
            },
            {
                kind: 'eq', title: 'Phase 2: differentiate both sides of the trig equation',
                when: phase(2),
                lines: env => {
                    const c = caseOf(env);
                    return [
                        { t: 'y = ' + c.inverse, rule: 'starting equation' },
                        { t: c.rewritten, rule: 'inverse meaning' },
                        { t: 'Differentiate both sides with respect to x:', color: 'auxInk' },
                        { t: c.diffLine, hl: true, rule: 'chain rule on y' },
                        { t: c.solveLine, hl: true }
                    ];
                }
            },
            {
                kind: 'graph', height: 300, title: env => 'Phase 3: the right triangle for ' + caseOf(env).rewritten,
                when: phase(3),
                window: [-0.4, 2.6, -0.5, 2.3],
                segments: env => trianglePanes(env).segs,
                notes: env => trianglePanes(env).notes
            },
            {
                kind: 'eq', title: 'Phase 3: the trig quantity rewritten in x',
                when: phase(3),
                lines: env => {
                    const c = caseOf(env);
                    const triLine = env.kase === 'atan'
                        ? 'From the triangle, ' + c.adjLabel.replace('adj: ', 'adjacent = ') + ' and ' + c.oppLabel.replace('opp: ', 'opposite = ') + '. The hypotenuse is √(1 + x²), so sec y = √(1 + x²).'
                        : 'From the triangle, ' + c.oppLabel.replace('opp: ', 'opposite = ') + '. For arcsin and arccos the hypotenuse is 1.';
                    return [
                        { t: c.rewritten + ', and ' + c.angle + ' is on the range of ' + c.inverse },
                        { t: triLine, color: 'auxInk' },
                        { t: c.convert, rule: 'Pythagorean identity' },
                        { t: c.final, hl: true, color: 'accent' }
                    ];
                }
            },
            {
                kind: 'graph', height: 200, title: env => 'Phase 4: the curve and its tangent line',
                when: phase(4),
                window: env => [caseOf(env).winX[0], caseOf(env).winX[1], caseOf(env).winF[0], caseOf(env).winF[1]],
                curves: env => [{ fn: 'invCurve', color: 'curveA', label: caseOf(env).inverse }],
                points: env => [{ x: 'xq', fn: 'invCurve', color: 'accent', r: 6, drag: { key: 'x0', min: caseOf(env).drag[0], max: caseOf(env).drag[1] }, label: 'x = ' + n(env.xq) }],
                tangents: env => [{ fn: 'invCurve', x: 'xq', m: 'dx', color: 'down', reach: 0.3 }]
            },
            {
                kind: 'graph', height: 200, title: env => 'Phase 4: the derivative from the tangent slope',
                when: phase(4),
                window: env => [caseOf(env).winX[0], caseOf(env).winX[1], caseOf(env).winD[0], caseOf(env).winD[1]],
                curves: env => [{ fn: 'slopeCurve', color: 'curveC', label: caseOf(env).final.split('= ')[1] }],
                points: env => [{ x: 'xq', y: 'dx', color: 'accent', r: 5, label: 'slope = ' + n(env.dx) }],
                vlines: env => [{ x: 'xq', color: 'auxInk', label: '' }]
            },
            {
                kind: 'eq', title: 'The full derivation in four lines',
                when: phase(4),
                lines: env => {
                    const c = caseOf(env);
                    return [
                        { t: c.rewritten },
                        { t: c.diffLine },
                        { t: c.convert },
                        { t: c.final, hl: true, color: 'accent' }
                    ];
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Angle and slope at one value of x',
                when: phase(4),
                items: env => [
                    { label: 'x', v: env.xq, color: 'curveC' },
                    { label: caseOf(env).inverse + ' (radians)', v: env.fx, color: 'accent' },
                    { label: 'in degrees', v: env.fx * 180 / Math.PI, unit: '°', color: 'auxInk' },
                    { label: 'dy/dx', v: env.dx, big: true, color: 'down' }
                ]
            },
            {
                kind: 'note', title: 'Why the chain rule appears here',
                when: phase(2),
                text: env => 'The angle y is not a constant. When x moves, the angle y moves too. So differentiating sin y needs the chain rule, the same step used on implicit curves in lesson 3.2.'
            },
            {
                kind: 'note', title: 'Reading the right triangle',
                when: phase(3),
                text: env => 'Look at the angle ' + caseOf(env).angle + '. The equation ' + caseOf(env).rewritten + ' fixes the opposite side and the adjacent side. For arcsin and arccos the hypotenuse is 1, since only ratios of sides matter to sine and cosine. For arctan the legs are 1 and x, so the hypotenuse is √(1 + x²).'
            },
            {
                kind: 'note', tone: 'warn', title: 'Why the arccos derivative stays negative',
                when: env => caseOf(env).kase === 'acos' && phaseTest(env, 2),
                text: 'The derivative of cos y is −sin y · dy/dx, so the minus sign is already in the equation. arccos is a decreasing function. The derivative of a decreasing function stays negative.'
            },
            {
                kind: 'compare', title: 'Two meanings of the exponent −1',
                when: env => env.mistake > 0.5,
                sides: [
                    {
                        title: 'sin⁻¹(x) means arcsin', tone: 'right',
                        graph: { height: 150, window: [-1.1, 1.1, -1.7, 1.7], curves: [{ fn: 'invCurve', color: 'curveA', label: 'arcsin x' }] },
                        lines: ['The inverse function of sine', 'The output is an angle in radians', 'The domain is −1 ≤ x ≤ 1']
                    },
                    {
                        title: '1 / sin(x) means csc(x)', tone: 'wrong',
                        graph: { height: 150, window: [-1.6, 1.6, -4, 4], curves: [{ fn: 'cscCurve', color: 'curveB', label: 'csc x' }] },
                        lines: ['The reciprocal of sine, not an inverse', 'A vertical asymptote at x = 0', 'Undefined at x = 0, ±π']
                    }
                ],
                verdict: 'The −1 in sin⁻¹ x names the inverse function. A −1 on the value, as in (sin x)⁻¹, would name the reciprocal. The exam tests the inverse function.'
            },
            {
                kind: 'practice', id: 'u3-invtrig-transfer', title: 'Practice: d/dx arctan(3x)',
                when: env => env.transfer > 0.5,
                items: [
                    {
                        q: 'The input of arctan is 3x instead of x. Which rule must combine with the inverse-trig derivative?',
                        choices: [
                            'The chain rule applies. The input of arctan is 3x, so the function has an inner layer and an outer layer.',
                            'The quotient rule applies. The arctan formula is written as a fraction.',
                            'No extra rule applies. The arctan formula already covers the input 3x.'
                        ], a: 0,
                        whyBy: [
                            'The function arctan(3x) has two layers: first u = 3x, then arctan(u). The inner layer contributes the factor du/dx.',
                            'The answer is written as a fraction, but no quotient of two functions is being differentiated. A fraction in the formula does not call for the quotient rule.',
                            'The arctan formula gives the rate with respect to the input of arctan. When the input is 3x, the chain rule also multiplies by the rate of change of 3x.'
                        ]
                    },
                    {
                        q: 'Set u = 3x. Which expression equals d/dx arctan(3x)?',
                        choices: [
                            'The answer is 3 / (1 + 9x²). The outer factor is 1 / (1 + u²) and du/dx = 3.',
                            'The answer is 1 / (1 + 9x²). This choice uses the outer factor but leaves out du/dx = 3.',
                            'The answer is 3 / (1 + 3x²). This choice includes du/dx = 3 but squares u as 3x².'
                        ], a: 0,
                        whyBy: [
                            'Substitute u = 3x into 1 / (1 + u²) and you get 1 / (1 + 9x²). Because du/dx = 3, the chain rule multiplies by 3, giving 3 / (1 + 9x²).',
                            'The expression 1 / (1 + 9x²) is the outer factor alone. The chain rule requires the inner rate 3 in the numerator.',
                            'Squaring u = 3x gives 9x², not 3x². Write u² as (3x)² to keep the square on the whole input.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { kase: 'asin', phase: 1, x0: 0.5, mistake: 0, transfer: 0 },
            message: 'The equation y = arcsin x is a restatement of sin y = x. The value y is an angle, restricted to the part of the sine curve that never repeats a value.'
        },
        {
            params: { phase: 2 },
            message: 'Look at the line sin y = x. The left side needs the chain rule, because the angle y changes as x changes. That is where dy/dx comes from.'
        },
        {
            params: { phase: 3, x0: 0.6 },
            message: 'The expression dy/dx = 1/cos y is still written in terms of y, but the answer must be in terms of x. Draw a right triangle with hypotenuse 1 and angle y. The opposite side is x, so the adjacent side is √(1 − x²).'
        },
        {
            params: { phase: 4 },
            predict: {
                q: 'Slide x toward 1. The arcsin curve keeps rising, and it becomes steeper and steeper. What happens to the derivative?',
                choices: [
                    'The derivative grows without bound. The denominator √(1 − x²) approaches 0, and the slope equals 1 over √(1 − x²).',
                    'The derivative approaches 0. A curve that flattens near x = 1 has a slope approaching 0.',
                    'The derivative settles at 1. The angle y approaches π/2, so the slope settles at 1.'
                ], a: 0,
                whyBy: [
                    'The denominator √(1 − x²) shrinks toward 0, so the reciprocal 1 / √(1 − x²) grows without bound. The derivative graph climbs for the same reason the arcsin curve becomes vertical.',
                    'The arcsin curve becomes more vertical near x = 1, not flatter. A flattening curve would give a slope heading toward 0. That contradicts both graphs.',
                    'The angle y approaches π/2, but an angle value is not a slope. Near x = 1 a tiny step in x produces a large step in the angle y, so the slope does not settle at 1.'
                ]
            },
            message: 'Both graphs use the same x value. The slope of the tangent line on the curve equals the height of its derivative graph at that x. When the two values match, the derivative formula is confirmed.'
        },
        {
            params: { x0: 0.96 },
            message: 'At x = 0.96 the slope is already about 3.6. As x approaches 1, the tangent line becomes vertical and its slope grows without bound. At the same x value the derivative graph grows without bound.'
        },
        {
            params: { kase: 'acos', phase: 1, x0: 0.5 },
            message: 'The same steps work for arccos. The equation y = arccos x means cos y = x. The angle y runs from 0 to π.'
        },
        {
            params: { phase: 2 },
            predict: {
                q: 'The function arccos x decreases as x increases over the whole domain −1 < x < 1. What sign must the derivative of arccos x have?',
                choices: [
                    'The derivative is negative everywhere on −1 < x < 1, because a decreasing function has a negative derivative.',
                    'The derivative is positive everywhere on −1 < x < 1, because the square root in the formula is positive.',
                    'The derivative changes sign at the x value where the arccos curve crosses 0.'
                ], a: 0,
                whyBy: [
                    'A decreasing function has a negative derivative everywhere on its domain. The algebra agrees. The derivative of cos y is −sin y, so the minus sign is already in the equation.',
                    'The square root √(1 − x²) is positive, but the fraction −1 / √(1 − x²) has a minus in front. Because arccos x decreases, its derivative must be negative.',
                    'The arccos curve decreases across the whole domain −1 < x < 1, so the derivative never changes sign. The derivative is never 0 either, because arccos x has no turning points.'
                ]
            },
            message: 'Solve −sin y · dy/dx = 1 for dy/dx and you get dy/dx = −1/sin y. The minus sign came from the derivative of cos y. The negative sign agrees with the decreasing arccos curve.'
        },
        {
            params: { phase: 3 },
            message: 'For arccos the labels on the triangle change. The adjacent side is now x, and the opposite side is √(1 − x²). So sin y = √(1 − x²), and the derivative is −1/√(1 − x²). This is the negative of the arcsin derivative.'
        },
        {
            params: { phase: 4, x0: 0 },
            message: 'Look at the lower graph. The derivative of arccos is negative everywhere. Its size grows without bound at both endpoints x = −1 and x = 1. Those are exactly the points where the arccos curve becomes vertical.'
        },
        {
            params: { mistake: 1, phase: 4 },
            message: 'One more notation check: sin⁻¹ x is the inverse function arcsin, an angle between −π/2 and π/2. The reciprocal 1/sin x is csc x, a different function with a vertical asymptote at x = 0. The exponent −1 belongs to the function name, not to the value.'
        },
        {
            params: { kase: 'atan', mistake: 0, phase: 1, x0: 0.8 },
            message: 'The arctan case needs no square root. Differentiating tan y = x gives sec²y · dy/dx = 1. The identity sec²y = 1 + tan²y then gives dy/dx = 1 / (1 + x²).'
        },
        {
            params: { phase: 2 },
            message: 'This time an identity does the work on the Phase 3 line, instead of a triangle. The goal is the same as before: rewrite the remaining trig quantity as an expression in x.'
        },
        {
            params: { phase: 4, x0: 2 },
            message: 'The arctan curve never becomes vertical, because 1 + x² never approaches 0. The derivative of arctan stays positive, and the derivative approaches 0 as the arctan curve flattens toward ±π/2.'
        },
        {
            params: { transfer: 1 },
            message: 'Now the input is 3x instead of x. Answer the two questions under "Practice: d/dx arctan(3x)" before you write anything down.'
        },
        {
            params: { phase: 3 },
            message: 'For arctan(3x) the outer factor is 1/(1 + u²) with u = 3x, and the inner rate du/dx contributes the factor 3. So d/dx arctan(3x) = 3/(1 + 9x²). Every inverse-trig derivative takes this shape once the input is anything other than x.'
        }
    ],
    summary: {
        idea: 'Each inverse trig derivative comes from differentiating the inverse relationship, then rewriting the remaining trig quantity in terms of x.',
        mistake: 'Students read sin⁻¹ x as 1/sin x, which is csc x, a different function with a different domain. Students also copy the positive sign from arcsin onto arccos, but arccos is decreasing and its derivative is negative.',
        transfer: 'Work through d/dx arcsin(2x) with the same four steps. Write the inverse relationship as a trig equation and differentiate both sides. Then rewrite the leftover trig quantity in x, and multiply by the inner rate 2.'
    }
};

function phaseTest(env, p) { return Math.round(env.phase) === p; }
