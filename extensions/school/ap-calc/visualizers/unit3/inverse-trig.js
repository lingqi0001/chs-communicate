/* 3.4 Inverse Trig Derivative Explorer. Each formula is built, not handed over.
   Four phases run one centre visual at a time: the inverse relationship, the
   implicit differentiation of it, the reference triangle or identity that
   converts the leftover trig quantity back into x, and finally the graph that
   agrees with the answer. The triangle is drawn from |x|, so its labels say
   |x|, and the range of each inverse function is what picks the positive root. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const n = v => String(Math.round(v * 1000) / 1000);
const root1 = x => Math.sqrt(Math.max(0, 1 - x * x));

/* Per case, the triangle is drawn from the magnitude mag = |x| (for arctan the
   legs are 1 and mag), so every *_Side field below must name a magnitude, never
   a bare x. The *_Domain strings belong to the final rule card, and derivCheck
   recomputes each closed-form slope from the inverse function itself at the test
   points in CHECK_PTS, which gates the card that claims all three agree. */
const CASES = {
    asin: {
        inverse: 'arcsin x', angle: 'y', rewritten: 'sin y = x',
        base: (x) => Math.sin(x), baseFrom: -1.5708, baseTo: 1.5708, baseLabel: 'sin x, restricted',
        inv: x => Math.asin(x), dy: x => 1 / root1(x),
        diffLine: 'cos y · dy/dx = 1', solveLine: 'dy/dx = 1 / cos y',
        leftover: 'cos y',
        xLines: [
            { t: 'cos y = +√(1 − x²)', rule: 'sin²y + cos²y = 1, and cos y ≥ 0 on [−π/2, π/2]' }
        ],
        final: 'd/dx arcsin x = 1 / √(1 − x²)',
        rangeSide: '[−π/2, π/2]',
        signSentence: 'arcsin x has range [−π/2, π/2], and cosine is nonnegative across that whole interval, so cos y takes the positive root √(1 − x²).',
        adj: mag => root1(mag), opp: mag => mag,
        adjSide: '√(1 − x²)', oppSide: '|x|', hypSide: '1',
        fnDomain: '[−1, 1]', derivDomain: '(−1, 1)',
        derivDomainWhy: '1 / √(1 − x²) is finite for −1 < x < 1',
        domainNote: 'At x = 1 and at x = −1 the denominator √(1 − x²) equals 0, so 1 / √(1 − x²) has no finite value there.',
        domainLink: 'A function can be defined at a point where its derivative is not. Lesson 2.4 met that gap at corners, vertical tangents and endpoints.',
        derivCheck: x => Math.abs(1 / root1(x) - derivative(Math.asin, x, 1e-5)) < 1e-6
    },
    acos: {
        inverse: 'arccos x', angle: 'y', rewritten: 'cos y = x',
        base: (x) => Math.cos(x), baseFrom: 0, baseTo: 3.1416, baseLabel: 'cos x, restricted',
        inv: x => Math.acos(x), dy: x => -1 / root1(x),
        diffLine: '−sin y · dy/dx = 1', solveLine: 'dy/dx = −1 / sin y',
        leftover: 'sin y',
        xLines: [
            { t: 'sin y = +√(1 − x²)', rule: 'sin²y + cos²y = 1, and sin y ≥ 0 on [0, π]' }
        ],
        final: 'd/dx arccos x = −1 / √(1 − x²)',
        rangeSide: '[0, π]',
        signSentence: 'arccos x has range [0, π], and sine is nonnegative across that whole interval, so sin y takes the positive root √(1 − x²).',
        adj: mag => mag, opp: mag => root1(mag),
        adjSide: '|x|', oppSide: '√(1 − x²)', hypSide: '1',
        fnDomain: '[−1, 1]', derivDomain: '(−1, 1)',
        derivDomainWhy: '−1 / √(1 − x²) is finite for −1 < x < 1',
        domainNote: 'At x = 1 and at x = −1 the denominator √(1 − x²) equals 0, so −1 / √(1 − x²) has no finite value there.',
        domainLink: 'arccos is defined at both endpoints and its derivative is not, which is the same gap lesson 2.4 found at corners, vertical tangents and endpoints.',
        derivCheck: x => Math.abs(-1 / root1(x) - derivative(Math.acos, x, 1e-5)) < 1e-6
    },
    atan: {
        inverse: 'arctan x', angle: 'y', rewritten: 'tan y = x',
        base: (x) => Math.tan(x), baseFrom: -1.4, baseTo: 1.4, baseLabel: 'tan x, restricted',
        inv: x => Math.atan(x), dy: x => 1 / (1 + x * x),
        diffLine: 'sec²y · dy/dx = 1', solveLine: 'dy/dx = 1 / sec²y',
        leftover: 'sec²y',
        xLines: [
            { t: 'sec y = +√(1 + x²)', rule: 'cos y > 0 on (−π/2, π/2)' },
            { t: 'sec²y = 1 + tan²y = 1 + x²', rule: 'Pythagorean identity sec²y = 1 + tan²y' }
        ],
        final: 'd/dx arctan x = 1 / (1 + x²)',
        rangeSide: '(−π/2, π/2)',
        signSentence: 'arctan x has range (−π/2, π/2), and cosine is positive across that whole interval, so sec y = +√(1 + x²). The identity squares that ratio, so sec²y = 1 + x² never asks a sign question.',
        adj: () => 1, opp: mag => mag,
        adjSide: '1', oppSide: '|x|', hypSide: '√(1 + x²)',
        fnDomain: 'all real numbers', derivDomain: 'all real numbers',
        derivDomainWhy: '1 / (1 + x²) is finite for every real x',
        domainNote: 'The denominator 1 + x² is at least 1 for every real x, so 1 / (1 + x²) has a finite value everywhere.',
        domainLink: 'Here the two domains match, and lesson 2.4 is the case where they do not match.',
        derivCheck: x => Math.abs(1 / (1 + x * x) - derivative(Math.atan, x, 1e-5)) < 1e-6
    }
};

const caseOf = env => CASES[env.kase];

/* Fixed graph windows, literal so that the geometry, the drag limits and the
   slider limits can never disagree with the formula cards. */
const VIEW = {
    asin: { mirror: [-1.9, 1.9, -1.9, 1.9], drag: [-0.99, 0.99], winX: [-1.04, 1.04], winF: [-1.62, 1.62], winD: [0, 6] },
    acos: { mirror: [-1.9, 3.5, -1.9, 3.5], drag: [-0.99, 0.99], winX: [-1.04, 1.04], winF: [-0.3, 3.5], winD: [-6, 0] },
    atan: { mirror: [-2.4, 2.4, -2.4, 2.4], drag: [-3.8, 3.8], winX: [-4, 4], winF: [-1.7, 1.7], winD: [0, 1.2] }
};
const viewOf = env => VIEW[env.kase];
const phase = p => env => Math.round(env.phase) === p;
const phaseFrom = p => env => Math.round(env.phase) >= p;
/* The arctan transfer reveal stays on the Phase 3 index, so the reference
   triangle and the plain arctan x cards would otherwise reappear beside a
   message about arctan(3x). On that one screen every case-specific visual
   retires and only the symbolic bridge stays. transfer is never a control, so
   this fires on exactly the final screen and on nothing earlier. */
const bridgeScreen = env => env.transfer > 0.5 && Math.round(env.phase) === 3;

/* The legs are drawn at right angles, so the figure is a reference triangle:
   for a negative x the angle y itself is not acute, and the picture carries the
   magnitudes of its ratios. Every leg below is a positive magnitude taken from
   |x|, and the labels in triNotes say exactly that, so no side is ever drawn at
   one length and named at another. The whole sketch is scaled by one factor k,
   which keeps the two legs in their true ratio for every x in the slider range
   and keeps the figure inside the fixed window. */
const TRI_BUDGET_ADJ = 1.75, TRI_BUDGET_OPP = 1.8, TRI_BASE = 1.4;

function triangleSketch(env) {
    const c = caseOf(env), v = viewOf(env);
    const mag = Math.min(Math.abs(env.x0), v.drag[1]);
    const legAdj = c.adj(mag), legOpp = c.opp(mag);
    const k = Math.min(TRI_BASE, TRI_BUDGET_ADJ / Math.max(legAdj, 1e-9), TRI_BUDGET_OPP / Math.max(legOpp, 1e-9));
    const adj = legAdj * k, opp = legOpp * k;
    const ox = 0.3;
    const C = { x: ox, y: 0 }, A = { x: ox + adj, y: 0 }, B = { x: A.x, y: opp };
    /* the right-angle tick and the angle chord shrink with the shorter leg, so a
       nearly flat triangle still gets decorations that fit inside it */
    const small = Math.min(adj, opp);
    const r = Math.min(0.14, small * 0.45), rad = Math.min(0.3, small * 0.5);
    const segs = [
        { x1: C.x, y1: C.y, x2: A.x, y2: A.y, color: 'curveC' },
        { x1: A.x, y1: A.y, x2: B.x, y2: B.y, color: 'curveB' },
        { x1: B.x, y1: B.y, x2: C.x, y2: C.y, color: 'auxInk' }
    ];
    if (small > 0.02) {
        segs.push({ x1: A.x - r, y1: A.y, x2: A.x - r, y2: A.y + r, color: 'auxInk' });
        segs.push({ x1: A.x - r, y1: A.y + r, x2: A.x, y2: A.y + r, color: 'auxInk' });
        const theta = Math.atan2(opp, adj);
        for (let i = 0; i < 5; i++) {
            const t0 = theta * (i / 5), t1 = theta * ((i + 1) / 5);
            segs.push({
                x1: C.x + rad * Math.cos(t0), y1: C.y + rad * Math.sin(t0),
                x2: C.x + rad * Math.cos(t1), y2: C.y + rad * Math.sin(t1),
                color: 'accent'
            });
        }
    }
    return { segs, C, A, B };
}

function triNotes(env) {
    const c = caseOf(env);
    const t = triangleSketch(env);
    return [
        { x: (t.C.x + t.A.x) / 2, y: 0.02, t: 'adjacent: ' + c.adjSide, color: 'curveC' },
        { x: t.A.x + 0.05, y: (t.A.y + t.B.y) / 2, t: 'opposite: ' + c.oppSide, color: 'curveB' },
        { x: (t.C.x + t.B.x) / 2 - 0.1, y: (t.C.y + t.B.y) / 2 + 0.1, t: 'hypotenuse: ' + c.hypSide, color: 'auxInk' },
        { x: t.C.x + 0.16, y: 0.26, t: 'reference angle for ' + c.angle, color: 'accent' }
    ];
}

/* The last xLines entry is the conversion step, so the recap card and the
   Phase 3 card can never quote different versions of it. */
const convertOf = c => c.xLines[c.xLines.length - 1].t;
const finalRhs = c => c.final.split('= ')[1];
/* Test points for the numerical recheck of every closed-form slope, kept inside
   each function's own domain. The two cards that quote all three formulas are
   gated on allDerived(), so they cannot claim agreement before all three hold. */
const CHECK_PTS = { asin: [0.4, -0.4, 0.9], acos: [0.4, -0.4, 0.9], atan: [0.4, -0.4, 3.8] };
const allDerived = () => Object.keys(CASES).every(k => CHECK_PTS[k].every(CASES[k].derivCheck));

/* The Phase 3 chain. The triangle line states magnitudes, the identity lines
   state what the range of the inverse function decides, and the final line
   closes the gap back to x. */
function deriveLines(env) {
    const c = caseOf(env);
    return [
        { t: c.rewritten + ', with ' + c.angle + ' on ' + c.rangeSide, rule: 'inverse meaning' },
        { t: 'Reference triangle sides: opposite ' + c.oppSide + ', adjacent ' + c.adjSide + ', hypotenuse ' + c.hypSide, color: 'auxInk', rule: 'side lengths are magnitudes' }
    ].concat(c.xLines, [{ t: c.final, hl: true, color: 'accent' }]);
}

export default {
    id: 'u3-inverse-trig',
    meta: { unit: 3, topic: '3.4', title: 'Differentiating Inverse Trigonometric Functions', visualizerTitle: 'Inverse Trig Derivative Explorer' },
    intro: 'Write the inverse function as a trig equation. Differentiate both sides implicitly, then use a reference triangle or an identity to finish.',
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
                { v: 3, label: '3: reference triangle back to x' },
                { v: 4, label: '4: check the graphs' }
            ]
        },
        { key: 'x0', label: 'x', min: -0.98, max: 0.98, step: 0.01, when: env => phaseFrom(3)(env) && env.kase !== 'atan' && !bridgeScreen(env) },
        { key: 'x0', label: 'x', min: -3.8, max: 3.8, step: 0.02, when: env => phaseFrom(3)(env) && env.kase === 'atan' && !bridgeScreen(env) }
    ],
    fns: {
        baseCurve: (x, env) => caseOf(env).base(x),
        invCurve: (x, env) => caseOf(env).inv(x),
        slopeCurve: (x, env) => caseOf(env).dy(x),
        identity: x => x,
        cscCurve: x => 1 / Math.sin(x)
    },
    compute: env => {
        const c = caseOf(env), v = viewOf(env);
        const x = Math.max(Math.min(env.x0, v.winX[1] - 0.06), v.winX[0] + 0.06);
        return { xq: x, fx: c.inv(x), dx: c.dy(x) };
    },
    panes: {
        main: [
            {
                kind: 'graph', width: 460, height: 460, title: env => 'Phase 1: y = ' + caseOf(env).inverse + ' means ' + caseOf(env).rewritten,
                when: phase(1),
                window: env => viewOf(env).mirror,
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
                kind: 'graph', height: 300, window: [-0.4, 2.6, -0.5, 2.3],
                title: 'Reference triangle for the trig ratio',
                when: env => phase(3)(env) && !bridgeScreen(env),
                segments: env => triangleSketch(env).segs,
                notes: env => triNotes(env)
            },
            {
                kind: 'eq', title: 'Phase 3: the trig quantity rewritten in x',
                when: env => phase(3)(env) && !bridgeScreen(env),
                lines: env => deriveLines(env)
            },
            {
                /* The arctan(3x) reveal. No triangle is redrawing arctan x here,
                   so the card carries the whole step in symbols: the inner input,
                   the arctan rule, the inner rate, then the chain rule product. */
                kind: 'eq', title: 'Symbolic bridge from arctan u to arctan(3x)',
                when: bridgeScreen,
                lines: () => [
                    { t: 'u = 3x', rule: 'the inner input' },
                    { t: 'd/du arctan(u) = 1 / (1 + u²)', rule: 'the arctan derivative' },
                    { t: 'du/dx = 3', rule: 'the inner rate' },
                    { t: 'd/dx arctan(3x) = 1 / (1 + (3x)²) · 3' },
                    { t: 'd/dx arctan(3x) = 3 / (1 + 9x²)', hl: true, color: 'accent' }
                ]
            },
            {
                kind: 'graph', height: 200, title: env => 'Phase 4: the curve and its tangent line',
                when: phase(4),
                window: env => { const v = viewOf(env); return [v.winX[0], v.winX[1], v.winF[0], v.winF[1]]; },
                curves: env => [{ fn: 'invCurve', color: 'curveA', label: caseOf(env).inverse }],
                points: env => [{ x: 'xq', fn: 'invCurve', color: 'accent', r: 6, drag: { key: 'x0', min: viewOf(env).drag[0], max: viewOf(env).drag[1] }, label: 'x = ' + n(env.xq) }],
                tangents: env => [{ fn: 'invCurve', x: 'xq', m: 'dx', color: 'down', reach: 0.3 }]
            },
            {
                kind: 'graph', height: 200, title: env => 'Phase 4: the derivative from the tangent slope',
                when: phase(4),
                window: env => { const v = viewOf(env); return [v.winX[0], v.winX[1], v.winD[0], v.winD[1]]; },
                curves: env => [{ fn: 'slopeCurve', color: 'curveC', label: finalRhs(caseOf(env)) }],
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
                        { t: convertOf(c) },
                        { t: c.final, hl: true, color: 'accent' }
                    ];
                }
            },
            {
                /* A short bridge back to lesson 3.3. The same derivative also
                   falls out of the inverse function rule (f⁻¹)′ = 1 / f′, so the
                   two lessons are not isolated. This card stays on the arcsin
                   Phase 4 screens and never on the notation check screen. */
                kind: 'eq', title: 'The same result from the lesson 3.3 rule',
                when: env => env.kase === 'asin' && phase(4)(env) && env.mistake < 0.5,
                lines: () => [
                    { t: '(arcsin x)′ = 1 / cos y', rule: 'lesson 3.3 inverse rule, with y = arcsin x' },
                    { t: 'cos y = √(1 − x²)', rule: 'the Phase 3 reference triangle' },
                    { t: '(arcsin x)′ = 1 / √(1 − x²)', hl: true, color: 'accent' }
                ]
            },
            {
                /* The rule card. A function can be defined further than its
                   derivative can be evaluated, which is the lesson 2.4 gap. */
                kind: 'eq', title: 'Domain of the function and domain of the derivative',
                when: phase(4),
                lines: env => {
                    const c = caseOf(env);
                    const lines = [
                        { t: 'domain of ' + c.inverse + ': ' + c.fnDomain, rule: 'the function' },
                        { t: 'domain of d/dx ' + c.inverse + ': ' + c.derivDomain, rule: c.derivDomainWhy, hl: true },
                        { t: c.domainNote, color: 'auxInk' },
                        { t: c.domainLink, color: 'auxInk' }
                    ];
                    /* That claim covers all three formulas, so it is printed only
                       while every formula matches a numerical slope at its own
                       test points. */
                    if (allDerived()) {
                        lines.push({ t: 'The three formulas agree with the numerical slopes at their test points.', color: 'auxInk' });
                    }
                    return lines;
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
                text: env => {
                    const c = caseOf(env);
                    return 'The angle y is not a constant. When x moves, the angle y moves too. So differentiating ' + c.rewritten
                        + ' needs the chain rule on the left side, the same step used on implicit curves in lesson 3.2. After solving, the leftover quantity '
                        + c.leftover + ' still talks about the angle, and Phase 3 turns it into x.';
                }
            },
            {
                kind: 'note', title: 'Magnitudes from the triangle, sign from the range',
                when: env => phase(3)(env) && !bridgeScreen(env),
                text: env => 'The triangle gives magnitudes. The allowed range of the inverse function determines the sign. '
                    + caseOf(env).signSentence
                    + ' When x is negative, the angle y is not the acute angle drawn here, so the figure is a reference triangle, and its side lengths stay correct.'
            },
            {
                kind: 'note', tone: 'warn', title: 'Why the arccos derivative stays negative',
                when: env => caseOf(env).kase === 'acos' && phaseTest(env, 2),
                text: 'The derivative of cos y is −sin y · dy/dx, so the minus sign is already in the equation. A differentiable decreasing function has derivative ≤ 0 where the derivative exists. For arccos the algebra gives the strict case. The angle y lives in (0, π), where sin y is positive, so dy/dx = −1 / sin y = −1 / √(1 − x²) stays below 0 at every point of (−1, 1).'
            },
            {
                kind: 'compare', title: 'Two meanings of the exponent −1',
                when: env => env.mistake > 0.5 && env.kase === 'asin',
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
            message: 'The line dy/dx = 1 / cos y still talks about the angle y, and the answer must talk about x. The reference triangle has hypotenuse 1, opposite side |x| and adjacent side √(1 − x²). The absolute value keeps every side a positive length when x is negative. Arcsin keeps y inside [−π/2, π/2], and cos y ≥ 0 there, so cos y = +√(1 − x²).'
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
            message: 'At x = 0.96 the slope is already about 3.6. As x approaches 1, the tangent line becomes vertical and its slope grows without bound. At the same x value the derivative graph grows without bound. The last card lists the two domains. arcsin x is defined on [−1, 1], and its derivative 1 / √(1 − x²) is finite only on (−1, 1).'
        },
        {
            params: { kase: 'acos', phase: 1, x0: 0.5 },
            message: 'The same steps work for arccos. The equation y = arccos x means cos y = x. The angle y runs from 0 to π.'
        },
        {
            params: { phase: 2 },
            predict: {
                q: 'The graph of arccos is decreasing, so its derivative cannot be positive. After differentiating cos y = x, what sign does the algebra force on (−1, 1)?',
                choices: [
                    'The derivative is negative on (−1, 1). Differentiating gives dy/dx = −1 / sin y, and sin y is positive on (0, π).',
                    'The derivative is positive on (−1, 1). The final formula has a square root, and a square root is positive.',
                    'The derivative is zero on (−1, 1). A decreasing graph can be flat, so its slope can rest at 0.'
                ], a: 0,
                whyBy: [
                    'The minus sign comes from differentiating cos y. On (0, π) sine is positive, so −1 / sin y = −1 / √(1 − x²) is strictly negative for every x in (−1, 1).',
                    'The square root √(1 − x²) is positive, but the formula carries a minus in front. So −1 / √(1 − x²) is negative, not positive.',
                    'A differentiable decreasing function has derivative ≤ 0, so a value of 0 is allowed in general. For arccos the algebra forces −1 / sin y with sin y positive, so the derivative is strictly negative and never 0.'
                ]
            },
            message: 'Solve −sin y · dy/dx = 1 for dy/dx and you get dy/dx = −1/sin y. The minus sign came from the derivative of cos y. The negative sign agrees with the decreasing arccos curve.'
        },
        {
            params: { phase: 3 },
            message: 'For arccos the labels on the triangle swap places. The adjacent side is |x|, and the opposite side is √(1 − x²). Arccos keeps y inside [0, π], and sin y ≥ 0 there, so sin y = +√(1 − x²). The derivative is therefore −1 / √(1 − x²), the negative of the arcsin derivative.'
        },
        {
            params: { phase: 4, x0: 0 },
            message: 'Look at the lower graph. The derivative of arccos is negative everywhere. Its size grows without bound at both endpoints x = −1 and x = 1. Those are exactly the points where the arccos curve becomes vertical. The card below lists the two domains: arccos x is defined on [−1, 1], and its derivative is finite only on (−1, 1).'
        },
        {
            params: { kase: 'asin', mistake: 1, phase: 4, x0: 0.5 },
            message: 'One more notation check: sin⁻¹ x is the inverse function arcsin, an angle between −π/2 and π/2. The reciprocal 1/sin x is csc x, a different function with a vertical asymptote at x = 0. The exponent −1 belongs to the function name, not to the value. The two domains on the last card are the other difference that matters. arcsin x has a value at x = 1, and its derivative does not. Lesson 2.4 met that gap before.'
        },
        {
            params: { kase: 'atan', mistake: 0, phase: 1, x0: 0.8 },
            message: 'Now the arctan case. The equation y = arctan x means tan y = x, and the angle y stays inside (−π/2, π/2). The setup is the same as the first two cases, and the graph shows the same mirror image across y = x.'
        },
        {
            params: { phase: 2 },
            message: 'Differentiate both sides of tan y = x. The derivative of tan y is sec²y, and y changes as x changes, so the chain rule gives sec²y · dy/dx = 1. Solving leaves dy/dx = 1 / sec²y, and the leftover quantity sec²y still talks about the angle.'
        },
        {
            params: { phase: 3 },
            message: 'The reference triangle for tan y = x has adjacent side 1 and opposite side |x|, so the hypotenuse is √(1 + x²). The Pythagorean identity then turns the leftover quantity into sec²y = 1 + tan²y = 1 + x². Substituting gives dy/dx = 1 / (1 + x²), and no square root was needed.'
        },
        {
            params: { phase: 4, x0: 2 },
            message: 'The arctan curve never becomes vertical, because 1 + x² never approaches 0. The derivative of arctan stays positive, and the derivative approaches 0 as the arctan curve flattens toward ±π/2. The card below lists both domains as all real numbers, because 1 + x² is at least 1 for every real x. Here the function and its derivative agree on where they exist.'
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
        idea: 'Each inverse trig derivative comes from differentiating the inverse relationship, then rewriting the remaining trig quantity in terms of x. The reference triangle supplies the magnitudes |x|, √(1 − x²) and 1, and the range of the inverse function decides the sign, which is why √(1 − x²) is taken as the positive root for arcsin and arccos.',
        mistake: 'Students read sin⁻¹ x as 1/sin x, which is csc x, a different function with a different domain. Students also copy the positive sign from arcsin onto arccos, but arccos is decreasing and its derivative is negative. A third slip is to assume the two domains match: arcsin x and arccos x are defined on [−1, 1], while their derivatives are finite only on (−1, 1). The arctan formulas are the case where both domains are all real numbers.',
        transfer: 'Work through d/dx arcsin(2x) with the same four steps. Write the inverse relationship as a trig equation and differentiate both sides. Then rewrite the leftover trig quantity in x, and multiply by the inner rate 2. Finish by naming both domains for your answer.'
    }
};

function phaseTest(env, p) { return Math.round(env.phase) === p; }
