/* 2.5 Power Rule Pattern Lab — one exponent choice: watch r move out front and
   step down once, on the curve and on the slope data. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const RVALS = [
    { v: '5', label: 'x⁵' }, { v: '4', label: 'x⁴' }, { v: '3', label: 'x³' },
    { v: '2', label: 'x²' }, { v: '1', label: 'x¹' }, { v: '0', label: 'x⁰' },
    { v: '-1', label: 'x⁻¹' }, { v: '-2', label: 'x⁻²' },
    { v: '0.5', label: 'x^½' }, { v: 'e', label: 'eˣ (not a power)' }
];

/* x range used for the sample points, chosen per exponent so that the curve,
   the claimed derivative and all eleven points stay inside the drawn window */
const DOMAIN = {
    '5': [-1, 1], '4': [-1, 1], '3': [-1.5, 1.5], '2': [-2, 2], '1': [-2, 2],
    '0': [-2, 2], '-1': [0.6, 3.2], '-2': [0.9, 3.4], '0.5': [0.15, 6], 'e': [-1.8, 1.6]
};

export default {
    id: 'u2-power-rule',
    meta: { unit: 2, topic: '2.5', title: 'Applying the Power Rule', visualizerTitle: 'Power Rule Pattern Lab' },
    intro: 'The power rule makes one claim about the derivative of each function here. The green dots show the slope measured on the curve at eleven sample points. The dots either sit on the claimed curve or they miss it.',
    params: { r: '3', reveal: 1 },
    controls: [
        {
            key: 'r', label: 'exponent r', kind: 'choice', options: RVALS
        },
        {
            key: 'reveal', label: 'derivative curve', kind: 'choice',
            options: [{ v: 1, label: 'shown by the rule' }, { v: 0, label: 'hidden, use the dots' }]
        }
    ],
    fns: {
        f: (x, env) => env.r === 'e' ? Math.exp(x) : powr(x, parseFloat(env.r)),
        fpTruth: (x, env) => env.r === 'e' ? Math.exp(x) : parseFloat(env.r) * powr(x, parseFloat(env.r) - 1)
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => env.r === 'e'
                    ? 'The curve eˣ and the curve the power rule would claim'
                    : 'y = xʳ and y = r·xʳ⁻¹',
                height: 360,
                window: env => winFor(env),
                curves: env => {
                    const out = [{ fn: 'f', color: 'curveA', label: rLabel(env.r) }];
                    if (env.reveal) out.push({ fn: 'fpTruth', color: 'curveC', label: ruleLabel(env) });
                    if (env.r === 'e' && env.reveal) out.push({ fn: impostor, color: 'down', dashed: true, label: 'power rule used on eˣ' });
                    return out;
                },
                points: env => {
                    const [d0, d1] = domFor(env);
                    const measurer = (x) => derivative(fOf(env), x);
                    const pts = [];
                    for (let i = 0; i < 11; i++) {
                        const x = d0 + i * (d1 - d0) / 10;
                        const y = measurer(x);
                        if (Number.isFinite(y)) pts.push({ x, y, color: 'up', r: 3 });
                    }
                    return pts;
                }
            },
            {
                kind: 'eq', title: 'The rule applied to this exponent',
                lines: env => env.r === 'e' ? [
                    { t: 'At first glance eˣ looks like a power of x.', color: 'auxInk' },
                    { t: 'The variable x sits in the exponent, not in the base.', rule: 'diagnosis', hl: true },
                    { t: 'The power rule needs xʳ, a variable base raised to a fixed exponent.', color: 'down' },
                    { t: 'The rule for eˣ is its own rule: (eˣ)′ = eˣ, proven in topic 2.7.', color: 'up', hl: true }
                ] : [
                    { t: 'd/dx [ x^' + showR(env.r) + ' ]', hl: true },
                    { t: '= ' + showR(env.r) + ' · x^(' + showR(env.r) + ' − 1)', rule: 'The old r moves out front and the new exponent is r − 1', hl: true },
                    { t: '= ' + coefOf(env.r) + ' x^' + expoOf(env.r), color: 'up' },
                    { t: domainNote(env.r) }
                ]
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'Checking the rule on this exponent',
                items: env => parseFloat(env.r) === 0 ? [
                    { t: 'The exponent r is copied out front as the coefficient ' + showR(env.r), state: true },
                    { t: 'The exponent steps down to −1, but x⁰ = 1 is already a constant', state: 'na' },
                    { t: 'The derivative of the constant 1 is 0, which agrees with 0 · x⁻¹ = 0', state: true }
                ] : env.r === 'e' ? [
                    { t: 'Is the base a variable raised to a fixed power?', state: false },
                    { t: 'Does the power rule apply to this function?', state: false },
                    { t: 'The green curve is eˣ itself, and the power rule curve is the red dashed one', state: true }
                ] : [
                    { t: 'The old exponent becomes the coefficient ' + coefOf(env.r), state: true },
                    { t: 'The new exponent is r − 1, which is ' + expoOf(env.r), state: true },
                    { t: 'The eleven measured slope points lie on the claimed curve', state: true }
                ]
            }
        ]
    },
    steps: [
        { params: { r: '4', reveal: 0 }, message: 'The exponent is 4 and the claimed curve is hidden. The green dots show slopes measured on the curve at eleven points. Which formula fits those dots?' },
        {
            params: { r: '3' },
            predict: {
                q: 'For f = x³, what coefficient and what exponent does the power rule give for f′?',
                choices: ['The coefficient is 3 and the exponent is 2.', 'The coefficient is 3 and the exponent is 3.', 'The coefficient is 2 and the exponent is 2.', 'The coefficient is 3 and the exponent is 4.'], a: 0,
                why: 'Multiply by the old exponent 3, then lower it to 2, and the result is 3x². Both changes happen at once. Making only one of them is the usual error.'
            },
            message: 'Turn the derivative curve back on and the claimed curve lands exactly on the green dots.'
        },
        { params: { r: '5', reveal: 1 }, message: 'One more power uses the same two steps: r = 5 gives the coefficient 5 and the exponent 4. The view narrows as r grows because x⁵ and 5x⁴ rise steeply even near the origin.' },
        { params: { r: '-1', reveal: 1 }, message: 'A negative exponent follows the same two steps: x⁻¹ becomes −1·x⁻². Neither the function nor its derivative exists at x = 0, so this view keeps to x > 0. The rule never claims a point that the function does not have.' },
        { params: { r: '-2', reveal: 1 }, message: 'This is the exponent the closing question asks about: x⁻² gives the derivative −2x⁻³. This view shows x > 0, where that derivative is negative. Left of 0 the function mirrors itself and its slopes turn positive.' },
        { params: { r: '0.5', reveal: 1 }, message: 'A fractional exponent behaves the same way. The square root of x is x^(1/2), so its derivative is (1/2)x^(−1/2). Only x > 0 appears here because the square root of a negative number is not defined.' },
        {
            params: { r: 'e', reveal: 1 },
            predict: {
                q: 'Now f = eˣ. If the power rule is forced onto it, the claimed derivative is e·x^(e−1). Does that claimed curve match the measured slopes of eˣ?',
                choices: ['No. In eˣ the variable sits in the exponent, so the power rule does not apply. The derivative of eˣ is eˣ itself.', 'Yes. In eˣ the base carries an exponent, so the power rule applies. The derivative of eˣ is e·x^(e−1).', 'Unclear. The two curves here sit too close together to compare their slopes at all.'], a: 0,
                why: 'The dashed curve falls toward 0 as x nears 0, while the measured slopes of eˣ stay positive and keep rising. A rule matches a structure, not a resemblance. Identify the kind of expression before choosing a rule.'
            },
            message: 'The rule for eˣ is its own statement, (eˣ)′ = eˣ. Topic 2.7 proves that rule from the definition of the derivative.'
        }
    ],
    summary: {
        idea: 'The power rule changes the coefficient and the exponent together: multiply by the old exponent, then lower it by one. Every result stays inside the domain of the original function.',
        mistake: 'Students lower the exponent without copying it out front, or copy it out front without lowering it. The rule also does not apply to eˣ, where the variable sits in the exponent instead of in the base.',
        transfer: 'For f = x⁻², write the derivative by hand, then state its sign for x > 0 and for x < 0. The exponent r control lists x⁻². Choose it and compare the green dots with the claimed curve.'
    }
};

function powr(x, r) {
    if (x < 0 && !Number.isInteger(r)) return NaN;
    return Math.pow(x, r);
}
function impostor(x) { return Math.E * powr(x, Math.E - 1); }
function domFor(env) { return DOMAIN[env.r] || [-2, 2]; }
function fOf(env) {
    return env.r === 'e' ? Math.exp : (x) => powr(x, parseFloat(env.r));
}
function fpOf(env) {
    return env.r === 'e' ? Math.exp : (x) => parseFloat(env.r) * powr(x, parseFloat(env.r) - 1);
}
/* the y window is read off the drawn functions, so nothing can land outside it */
function winFor(env) {
    const [d0, d1] = domFor(env);
    const f = fOf(env), fp = fpOf(env), extra = env.r === 'e' ? impostor : null;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 80; i++) {
        const x = d0 + (d1 - d0) * i / 80;
        [f(x), fp(x), extra ? extra(x) : NaN].forEach(y => {
            if (!Number.isFinite(y)) return;
            if (y < lo) lo = y;
            if (y > hi) hi = y;
        });
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [d0, d1, -1, 1];
    if (hi - lo < 1) {
        const mid = (hi + lo) / 2;
        lo = mid - 0.5; hi = mid + 0.5;
    }
    const pad = (hi - lo) * 0.14;
    return [d0, d1, lo - pad, hi + pad];
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
function ruleLabel(env) {
    if (env.r === 'e') return 'true derivative: eˣ';
    return 'claim: ' + coefOf(env.r) + 'x^' + expoOf(env.r);
}
function domainNote(r) {
    const v = parseFloat(r);
    if (v < 0) return 'Domain: x ≠ 0, and the rule holds on each side of 0.';
    if (v === 0.5) return 'Domain: x ≥ 0 for the function, x > 0 for its derivative.';
    return 'The rule holds on the whole domain of x^r.';
}
