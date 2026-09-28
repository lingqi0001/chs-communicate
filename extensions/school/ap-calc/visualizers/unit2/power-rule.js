/* 2.5 Power Rule Pattern Lab — four measured pairs come first and the student
   names the pattern. The general rule is gated behind the same reveal switch
   that shows the claimed curve. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const RVALS = [
    { v: '5', label: 'x⁵' }, { v: '4', label: 'x⁴' }, { v: '3', label: 'x³' },
    { v: '2', label: 'x²' }, { v: '1', label: 'x¹' }, { v: '0', label: 'x⁰' },
    { v: '-1', label: 'x⁻¹' }, { v: '-2', label: 'x⁻²' },
    { v: '0.5', label: 'x^½' }, { v: 'e', label: 'eˣ (not a power)' }
];

/* what the student reads before anything is called a rule */
const PAIRS = [
    { r: '2', f: 'x²', d: '2x' }, { r: '3', f: 'x³', d: '3x²' },
    { r: '4', f: 'x⁴', d: '4x³' }, { r: '5', f: 'x⁵', d: '5x⁴' }
];

/* Three ideas that used to share one constant are now kept apart, because a
   negative exponent and a square root each need a curve, a derivative and a
   sample set that do not live on the same interval.
   view  - the x range the graph frames,
   eps   - the draw cutoff near x = 0. A two sided case draws each branch from
           this distance out, and a one sided case starts the claimed derivative
           here. It is only a drawing limit, and it is deliberately tiny, so the
           curve runs toward the vertical axis instead of ending beside it,
   cap   - the y height the window is built to. It is kept independent of eps,
           because the value a steep branch reaches at the cutoff is huge, and
           that value must climb out of the frame rather than stretch it,
   start - the x the function curve begins on,
   samp  - the positive x range the eleven slope dots are measured on. */
const CASES = {
    '5': { view: [-1, 1] }, '4': { view: [-1, 1] }, '3': { view: [-1.5, 1.5] },
    '2': { view: [-2, 2] }, '1': { view: [-2, 2] }, '0': { view: [-2, 2] },
    '-1': { view: [-3.6, 3.6], eps: 0.02, cap: 8, samp: [1, 3] },
    '-2': { view: [-3, 3], eps: 0.02, cap: 8, samp: [1.2, 2.8] },
    '0.5': { view: [-0.4, 6], start: 0, eps: 0.02, cap: 2.5, samp: [0.5, 5.6] },
    'e': { view: [-1.8, 1.6] }
};

export default {
    id: 'u2-power-rule',
    meta: { unit: 2, topic: '2.5', title: 'Applying the Power Rule', visualizerTitle: 'Power Rule Pattern Lab' },
    intro: 'The table lists four powers. The derivative column holds the derivative measured on each of those curves, and the last two columns show the exponent on x before the change and after it. Read all four rows and say what changed about the exponent. The graph below measures the same way on one curve at a time, and its eleven green dots are slopes measured on that curve.',
    params: { r: '2', reveal: 0 },
    controls: [
        {
            key: 'r', label: 'exponent r', kind: 'choice', options: RVALS
        },
        {
            key: 'reveal', label: 'derivative curve', kind: 'choice',
            options: [{ v: 1, label: 'shown, check the pattern' }, { v: 0, label: 'hidden, compare the dots' }]
        }
    ],
    fns: {
        f: (x, env) => env.r === 'e' ? Math.exp(x) : powr(x, parseFloat(env.r)),
        fpTruth: (x, env) => fpOf(env)(x)
    },
    panes: {
        main: [
            {
                kind: 'table', title: 'Four powers with the derivative measured on each curve',
                cols: ['f(x)', 'derivative', 'old exponent', 'new exponent'],
                rows: env => PAIRS.map(p => {
                    const on = p.r === env.r;
                    const old = String(parseFloat(p.r)), now = String(parseFloat(p.r) - 1);
                    return [
                        { v: p.f, bold: on },
                        { v: p.d, bold: on, color: on ? 'accent' : undefined },
                        { v: old, bold: on },
                        { v: now, bold: on }
                    ];
                }),
                note: env => {
                    if (env.r === 'e') return 'These are the powers the pattern was read from. The curve eˣ on the graph is not one of them.';
                    if (!env.reveal) return 'The derivative column holds slopes measured on each curve, the same measurement the green dots use. The last two columns show the exponent on x before the change and after it. No rule is written down yet.';
                    return PAIRS.some(p => p.r === env.r)
                        ? 'The bold row is the curve drawn below. Its derivative cell is the claim the green dots agree with, and the last two columns read that change across the row.'
                        : 'The four rows above hold the whole pattern. The graph below checks ' + rLabel(env.r) + ', which sits outside those rows.';
                }
            },
            {
                kind: 'graph', title: graphTitle,
                height: 360,
                window: env => winFor(env),
                vlines: env => isNegR(env.r)
                    ? [{ x: 0, color: 'auxInk', label: 'x = 0 is the one value left out' }]
                    : [],
                curves: env => {
                    const out = [];
                    const fb = fBranches(env), fpb = fpBranches(env);
                    fb.forEach(([lo, hi], bi) => {
                        const tag = bi === fb.length - 1;
                        out.push({ fn: 'f', color: 'curveA', from: lo, to: hi, label: tag ? rLabel(env.r) : undefined });
                    });
                    if (env.r === 'e') out.push({ fn: impostor, color: 'down', dashed: true, from: 0, label: 'the power rule forced onto eˣ' });
                    if (env.reveal) fpb.forEach(([lo, hi], bi) => {
                        const tag = bi === fpb.length - 1;
                        out.push({ fn: 'fpTruth', color: 'curveC', from: lo, to: hi, label: tag ? ruleLabel(env) : undefined });
                    });
                    return out;
                },
                points: env => {
                    const measurer = (x) => derivative(fOf(env), x);
                    return sampleXs(env)
                        .map(x => ({ x: x, y: measurer(x), color: 'up', r: 3 }))
                        .filter(p => Number.isFinite(p.y));
                }
            },
            {
                kind: 'eq', title: 'The pattern written as a rule', when: env => env.reveal > 0,
                lines: env => env.r === 'e' ? [
                    { t: 'At first glance eˣ looks like a power of x.', color: 'auxInk' },
                    { t: 'In x^r the base is the variable and the exponent is a fixed number. In eˣ the base is a fixed number and the exponent is the variable.', rule: 'the discriminator', hl: true },
                    { t: 'The power rule needs a variable base raised to a fixed exponent, so it never reaches eˣ.', color: 'down' },
                    { t: 'The rule for eˣ is its own statement: (eˣ)′ = eˣ, proven in topic 2.7.', color: 'up', hl: true }
                ] : [
                    { t: 'd/dx [ x^r ] = r · x^(r − 1)', hl: true, rule: 'the power rule' },
                    ...(parseFloat(env.r) === 0 ? [
                        { t: 'r = 0 is the constant case, so simplify x⁰ to 1 first', color: 'auxInk' },
                        { t: 'd/dx [ 1 ] = 0 for every x', hl: true, color: 'up' }
                    ] : [
                        { t: 'The exponent ' + showR(env.r) + ' moves out front and drops to ' + expoOf(env.r), color: 'auxInk' },
                        { t: 'd/dx [ x^' + showR(env.r) + ' ] = ' + appliedOf(env.r), hl: true, color: 'up' }
                    ]),
                    { t: domainNote(env.r) }
                ]
            }
        ],
        side: [
            {
                kind: 'note', title: 'Read the pairs', when: env => env.reveal === 0 && env.r !== 'e',
                text: 'Each row names its own pair. The row x⁴ shows 4x³ beside it, and the row x² shows 2x. Say what happened to the exponent that stood on x. The derivative curve control at the top keeps the claimed curve off the graph, so the dots are the only evidence.'
            },
            {
                kind: 'checklist', title: 'Check the rule against the dots', when: env => env.reveal > 0,
                items: env => parseFloat(env.r) === 0 ? [
                    { t: 'Simplify first: x⁰ = 1, which is a constant function', state: true },
                    { t: 'The derivative of the constant 1 is 0 at every x, and that flat claim sits on all eleven dots', state: true },
                    { t: 'Lowering 0 to −1 and reading 0 · x⁻¹ as the derivative', state: 'na' }
                ] : env.r === 'e' ? [
                    { t: 'Is the base a variable raised to a fixed power?', state: false },
                    { t: 'Does the power rule apply to this function?', state: false },
                    { t: 'The green curve is eˣ itself, and the red dashed curve is the wrong answer the power rule would give', state: true }
                ] : [
                    { t: 'The old exponent becomes the coefficient ' + coefOf(env.r), state: true },
                    { t: 'The new exponent is r − 1, which is ' + expoOf(env.r), state: true },
                    { t: 'The eleven measured slope points lie on the claimed curve', state: true }
                ],
                verdict: env => parseFloat(env.r) === 0 ? 'Yes. The derivative is 0 at every x, including x = 0.' : undefined,
                verdictOk: true
            }
        ]
    },
    steps: [
        {
            params: { r: '3', reveal: 1 },
            predict: {
                q: 'Read the four rows of the table. What happened to the exponent that stood on x in each measured derivative?',
                choices: [
                    'It moved out front as the coefficient, and it dropped by one.',
                    'It moved out front as the coefficient, and it stayed the same.',
                    'It stayed in the exponent, and it dropped by one.',
                    'It moved out front as the coefficient, and it grew by one.'
                ], a: 0,
                why: 'Both jobs happen at once. The row x⁴ and 4x³ puts the 4 out front and leaves the exponent at 3. Doing only one of the two moves is the usual error.'
            },
            message: 'Your pattern is the power rule, and the panel under the graph now writes it for a general exponent r. The claimed curve is turned on for r = 3, and it lands on the eleven green dots. Change the exponent r to check the other rows.'
        },
        { params: { r: '5', reveal: 1 }, message: 'The same two moves give 5x⁴ beside x⁵, which is the last row of the table. The view narrows as r grows, because x⁵ and 5x⁴ rise steeply even near the origin.' },
        {
            params: { r: '1', reveal: 1 },
            message: 'x¹ is the next natural row. Bring the 1 out front and lower the exponent to x⁰ = 1, so the derivative is the constant 1. The claim is the flat line at height 1, and the eleven green dots sit on it.'
        },
        {
            params: { r: '0', reveal: 1 },
            message: 'Lower x¹ to x⁰ and the case in front of you is already a constant. Simplify x⁰ to 1 first, and the derivative of the constant 1 is 0 at every x. The claim is the flat line on the horizontal axis, and the eleven dots sit on it. Reading the pattern as 0 · x⁻¹ would leave x = 0 without a value, while the curve there has a slope of 0.'
        },
        {
            params: { r: '-1', reveal: 1 },
            message: 'A negative exponent follows the same two moves, and x⁻¹ gives −1 · x⁻². The function and its derivative both run toward the vertical axis and leave the frame through its top and bottom edges. The dashed line marks x = 0 as the one value left out of both. Each side of 0 is drawn as its own branch. The claim −1 · x⁻² sits below the axis on both branches, because x² is positive either way.'
        },
        {
            params: { r: '-2', reveal: 1 },
            message: 'This is the exponent the closing question asks about, and x⁻² gives −2 · x⁻³. On the right branch the claim sits below the axis, so those slopes are negative. On the left branch it sits above the axis, so those slopes are positive. The dots on each side agree.'
        },
        { params: { r: '0.5', reveal: 1 }, message: 'A fractional exponent behaves the same way. The square root of x is x^(1/2), so its derivative is (1/2) · x^(−1/2). The blue curve reaches x = 0 with height 0. The green claimed curve runs toward the vertical axis along the right side and leaves the frame through its top edge, because its values keep growing as x approaches 0. The function has a value at 0, but its derivative does not.' },
        {
            params: { r: 'e', reveal: 0 },
            message: 'The last choice in the exponent list is eˣ. The table above holds the four powers the pattern was read from, and eˣ is not one of its rows. The red dashed curve is what the power rule would force onto eˣ. Decide which curve the eleven green dots follow before you press Next.'
        },
        {
            params: { reveal: 1 },
            predict: {
                q: 'On the graph the blue curve is eˣ and the red dashed curve is the power rule forced onto it. Which curve do the eleven green slope dots follow?',
                choices: [
                    'The dots follow the blue eˣ curve, so the power rule does not apply. The variable sits in the exponent, and the derivative of eˣ is eˣ itself.',
                    'The dots follow the red dashed curve, so the power rule applies. The derivative of eˣ is e · x^(e − 1).',
                    'The dots follow neither curve, because they sit off both of them and match no pattern here.'
                ], a: 0,
                why: 'The red dashed curve falls toward 0 as x nears 0, while the green dots stay on the blue eˣ curve and keep rising. A rule matches a structure, not a resemblance. Check whether the variable is the base before choosing a rule.'
            },
            message: 'The green curve drawn now is eˣ itself, and the eleven dots sit on it. The rule for eˣ is its own statement, (eˣ)′ = eˣ. Topic 2.7 proves that rule from the definition of the derivative.'
        }
    ],
    summary: {
        idea: 'The pattern was measured before it was named: the old exponent moves out front as the coefficient and drops by one, so d/dx [ x^r ] = r · x^(r − 1). The derivative can exist only where the function exists, and its domain may be smaller. The square root of x has the value 0 at x = 0, but its derivative has no value there.',
        mistake: 'Students lower the exponent without copying it out front, or copy it out front without lowering it. At r = 0 the expression must be simplified to the constant 1 first, because 0 · x⁻¹ has no value at x = 0. The rule also does not apply to eˣ, where the variable sits in the exponent instead of in the base.',
        transfer: 'For f = x⁻², write the derivative by hand, then state its sign for x > 0 and for x < 0. The exponent r control lists x⁻², and both of its branches are on the graph.'
    }
};

function powr(x, r) {
    if (x < 0 && !Number.isInteger(r)) return NaN;
    return Math.pow(x, r);
}
function impostor(x) { return Math.E * powr(x, Math.E - 1); }
function caseOf(env) { return CASES[env.r] || { view: [-2, 2] }; }
function isNegR(r) { const v = parseFloat(r); return Number.isFinite(v) && v < 0; }
/* the branches the function curve is drawn over. A two sided case cuts the
   drawing at eps on each side of x = 0, which is small enough that the curve
   leaves the frame before the cutoff, while a square root starts at x = 0 where
   its own domain begins */
function fBranches(env) {
    const c = caseOf(env);
    if (isNegR(env.r)) return [[c.view[0], -c.eps], [c.eps, c.view[1]]];
    return [[c.start === undefined ? c.view[0] : c.start, c.view[1]]];
}
/* the branches the claimed derivative is drawn over. A two sided case uses the
   same cutoff as the function, and a square root uses it to run toward x = 0
   from the right even though the function itself starts at 0 */
function fpBranches(env) {
    const c = caseOf(env);
    if (isNegR(env.r)) return [[c.view[0], -c.eps], [c.eps, c.view[1]]];
    if (c.eps !== undefined) return [[c.eps, c.view[1]]];
    return [[c.view[0], c.view[1]]];
}
function linspace(a, b, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1));
    return out;
}
/* eleven slope dots, measured on a range kept away from x = 0 so an extreme
   slope never wrecks the frame. A two sided case puts six on the right branch
   and five on its mirror, so no dot ever sits on the excluded value x = 0 */
function sampleXs(env) {
    const c = caseOf(env);
    if (isNegR(env.r)) return linspace(c.samp[0], c.samp[1], 6).concat(linspace(-c.samp[1], -c.samp[0], 5));
    if (c.samp) return linspace(c.samp[0], c.samp[1], 11);
    return linspace(c.view[0], c.view[1], 11);
}
function fOf(env) {
    return env.r === 'e' ? Math.exp : (x) => powr(x, parseFloat(env.r));
}
function fpOf(env) {
    if (env.r === 'e') return Math.exp;
    const r = parseFloat(env.r);
    if (r === 0) return () => 0;
    return (x) => r * powr(x, r - 1);
}
/* the y window is read off the drawn curves, branch by branch, with every value
   clamped to the case cap first. The cap is fixed rather than taken from the
   draw cutoff, so a branch that reaches 50 or 2500 at eps still only lifts the
   window to the cap height, and the curve runs off the top or bottom of the
   frame instead of stretching it */
function winFor(env) {
    const c = caseOf(env);
    const f = fOf(env), fp = fpOf(env);
    const cap = c.cap === undefined ? 1000 : c.cap;
    let lo = Infinity, hi = -Infinity;
    const feed = (y) => {
        if (!Number.isFinite(y)) return;
        const m = Math.max(-cap, Math.min(cap, y));
        if (m < lo) lo = m;
        if (m > hi) hi = m;
    };
    const scan = (br, fn) => br.forEach(([a, b]) => {
        for (let i = 0; i <= 80; i++) feed(fn(a + (b - a) * i / 80));
    });
    scan(fBranches(env), f);
    scan(fpBranches(env), fp);
    if (env.r === 'e') scan([[c.view[0], c.view[1]]], impostor);
    const x0 = c.view[0], x1 = c.view[1];
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [x0, x1, -1, 1];
    if (hi - lo < 1) {
        const mid = (hi + lo) / 2;
        lo = mid - 0.5; hi = mid + 0.5;
    }
    const pad = (hi - lo) * 0.14;
    return [x0, x1, lo - pad, hi + pad];
}
function graphTitle(env) {
    if (env.r === 'e') return env.reveal
        ? 'The curve eˣ, its true derivative, the curve the power rule forces, and the measured slopes'
        : 'The curve eˣ, the curve the power rule would force onto it, and the eleven slopes measured on the curve';
    return env.reveal
        ? 'y = xʳ, the claimed derivative, and the slopes measured on the curve'
        : 'y = xʳ and the eleven slopes measured on the curve';
}
function rLabel(r) {
    const e = RVALS.find(o => o.v === r);
    return e ? e.label.replace(' (not a power)', '') : 'x^' + r;
}
function show(v) { return String(v).replace('-', '−'); }
function showR(r) { return r === '0.5' ? '1/2' : r === 'e' ? 'e' : show(r); }
function coefOf(r) { return showR(r); }
function expoOf(r) {
    if (r === '0.5') return '−1/2';
    if (r === 'e') return 'e−1';
    return show(parseFloat(r) - 1);
}
/* a fraction in an exponent needs parentheses, or x^1/2 reads as (x^1)/2 */
function paren(v) { return String(v).indexOf('/') > 0 ? '(' + v + ')' : String(v); }
/* the tidy form the table already prints, so 2x never reads back as 2 · x^1 */
function appliedOf(r) {
    const c = coefOf(r), e = expoOf(r);
    if (e === '1') return (c === '1' ? '' : c) + 'x';
    if (e === '0') return c;
    return c + ' · x^' + paren(e);
}
function ruleLabel(env) {
    if (env.r === 'e') return 'true derivative: eˣ';
    if (parseFloat(env.r) === 0) return 'claim: 0 for every x';
    return 'claim: ' + appliedOf(env.r);
}
function domainNote(r) {
    const v = parseFloat(r);
    if (v < 0) return 'Both branches are drawn, and x = 0 is the one value left out of the domain of the function and of its derivative.';
    if (v === 0) return 'The constant x⁰ = 1 has slope 0 at every x, so the claim is the flat line on the horizontal axis.';
    if (v === 1) return 'x^0 = 1, so the derivative of x is the constant 1, and its graph is a horizontal line at height 1.';
    if (v === 0.5) return 'The square root of x has the value 0 at x = 0, but its derivative has no value at x = 0.';
    return 'The rule holds on the whole domain of x^r.';
}
