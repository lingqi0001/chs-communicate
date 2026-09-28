/* 2.9 Ratio Change Lab — a quotient changes for two reasons at once, and the
   two effects enter with opposite signs. The hero is the two-effect ledger:
   one card per contribution, one number line for the sum and net, one readout
   for live values. freezeF moves from an edge switch into the main walk
   because it is what makes the minus sign measurable. The old ratio graph
   with its tangent survives only as a verification view. */

const F = (x) => x * x + 1;
const FP = (x) => 2 * x;

const GS = {
    lin: { label: 'g = x  (g′ = 1)', g: (x) => x, gp: () => 1 },
    slow: { label: 'g = 5  (constant)', g: () => 5, gp: () => 0 },
    fast: { label: 'g = x² + 2  (g′ = 2x)', g: (x) => x * x + 2, gp: (x) => 2 * x }
};

function fixed(env) { return env.freezeF > 0.5; }
function fOf(env) { return fixed(env) ? () => F(env.x0) : F; }
function fpOf(env) { return fixed(env) ? () => 0 : FP; }
function ratioFn(env) {
    const f = fOf(env), g = GS[env.gk].g;
    return (x) => f(x) / g(x);
}
function band(from, to, color, label) {
    return { from, to, color, label };
}

export default {
    id: 'u2-quotient-rule',
    meta: { unit: 2, topic: '2.9', title: 'The Quotient Rule', visualizerTitle: 'Ratio Change Lab' },
    intro: 'A ratio changes for two reasons at once: the numerator moves, and the denominator moves. Read each reason off its own card, add the two effects on one number line, and the formula is the record of that sum.',
    params: { x0: 2, gk: 'lin', freezeF: 0, stage: 0 },
    controls: [
        {
            key: 'gk', label: 'denominator', kind: 'choice',
            options: Object.keys(GS).map(k => ({ v: k, label: GS[k].label }))
        },
        {
            key: 'freezeF', label: 'numerator f', kind: 'choice',
            options: [
                { v: 0, label: 'f = x² + 1 (grows)' },
                { v: 1, label: 'f = f(x₀) (held fixed)' }
            ]
        },
        { key: 'x0', label: 'current x', min: 0.6, max: 4, step: 0.05 }
    ],
    compute: (env) => {
        const g = GS[env.gk];
        const f = F(env.x0);
        const fp = fpOf(env)(env.x0);
        const gv = g.g(env.x0);
        const gp = g.gp(env.x0);
        const numTerm = fp * gv;
        const denTerm = f * gp;
        const g2 = gv * gv;
        return {
            f, fp, gv, gp, numTerm, denTerm, g2,
            ratio: f / gv,
            numEffect: numTerm / g2,
            denEffect: -denTerm / g2,
            netRate: (numTerm - denTerm) / g2
        };
    },
    panes: {
        main: [
            {
                kind: 'compare',
                title: env => 'The two effects on the rate of f/g, at x = ' + round2(env.x0),
                sides: env => [
                    {
                        title: 'Numerator effect  + f′g ÷ g²',
                        lines: [
                            'f′ = ' + round2(env.fp) + ', the rate of the numerator at the dragged x',
                            'f′g ÷ g² = ' + round2(env.numTerm) + ' ÷ ' + round2(env.g2) + ' = ' + round2(env.numEffect),
                            env.fp > 0
                                ? 'A rising numerator pushes the ratio upward, so this effect is positive.'
                                : 'The numerator is held fixed, so this effect contributes nothing.'
                        ]
                    },
                    {
                        title: 'Denominator effect  − fg′ ÷ g²',
                        lines: [
                            'g′ = ' + round2(env.gp) + ', the rate of the denominator at the dragged x',
                            '− fg′ ÷ g² = ' + round2(-env.denTerm) + ' ÷ ' + round2(env.g2) + ' = ' + round2(env.denEffect),
                            env.gp > 0
                                ? 'A growing denominator pulls the ratio the other way, so this effect is negative.'
                                : 'The denominator is not growing, so this effect stays at zero.'
                        ]
                    }
                ],
                verdict: env => 'NET EFFECT = ' + round2(env.numEffect) + ' + (' + round2(env.denEffect) + ') = ' + round2(env.netRate) + '. ' + (
                    env.netRate > 0 ? 'The numerator effect is larger, so the ratio is rising.'
                        : env.netRate < 0 ? 'The denominator effect is larger, so the ratio is falling.'
                            : 'The two effects balance, so the ratio is instantaneously steady.'
                )
            },
            {
                kind: 'numberline',
                title: 'Both effects and the net rate on one line, in units of the rate of f/g',
                window: env => {
                    const span = Math.max(Math.abs(env.numEffect), Math.abs(env.denEffect), Math.abs(env.netRate), 0.5);
                    return [-1.25 * span, 1.25 * span];
                },
                bands: env => {
                    const out = [];
                    if (env.numEffect > 0) out.push(band(0, env.numEffect, 'up', 'numerator effect'));
                    if (env.denEffect < 0) out.push(band(0, env.denEffect, 'down', 'denominator effect'));
                    return out;
                },
                probes: env => {
                    const out = [];
                    if (env.numEffect !== 0) out.push({ x: env.numEffect, color: 'up', label: 'numerator effect alone' });
                    if (env.denEffect !== 0) out.push({ x: env.denEffect, color: 'down', label: 'denominator effect alone' });
                    out.push({ x: env.netRate, color: 'accent', label: 'NET = ' + round2(env.netRate) });
                    return out;
                }
            },
            {
                kind: 'eq',
                title: 'The ledger, in words first and symbols second',
                lines: env => {
                    if (env.stage >= 5) return [
                        { t: '(f/g)′ = (f′g − fg′) ÷ g²', hl: true },
                        { t: 'One ledger in one line: (' + round2(env.numTerm) + ' − ' + round2(env.denTerm) + ') ÷ ' + round2(env.g2) + ' = ' + round2(env.netRate), color: env.netRate >= 0 ? 'up' : 'down' },
                        { t: 'Both effects share the divisor g², so one fraction holds the whole sum.', color: 'auxInk', rule: 'no extra machinery behind g²' }
                    ];
                    if (env.stage >= 2) return [
                        { t: 'numerator effect = f′g ÷ g² = ' + round2(env.numEffect), color: 'up' },
                        { t: 'denominator effect = − fg′ ÷ g² = ' + round2(env.denEffect), color: 'down' },
                        { t: 'NET = ' + round2(env.numEffect) + ' + (' + round2(env.denEffect) + ') = ' + round2(env.netRate), hl: true },
                        env.fp === 0
                            ? { t: 'Frozen numerator: the net rate is the lone term − fg′ ÷ g².', color: 'down', rule: 'this is where the minus sign lives' }
                            : { t: 'The effects pull in opposite directions, and the larger one decides the sign of the net.', color: 'auxInk' }
                    ];
                    if (env.stage >= 1) return [
                        env.gp === 0
                            ? { t: 'denominator effect = 0, because g′ = 0', color: 'auxInk', rule: 'the constant case' }
                            : { t: 'denominator effect = − fg′ ÷ g² = ' + round2(env.denEffect), color: 'down' },
                        { t: 'numerator effect = f′ ÷ g = ' + round2(env.numEffect), color: 'up', rule: 'one g cancels out of f′g ÷ g²' },
                        { t: 'NET = ' + round2(env.netRate), hl: true }
                    ];
                    return [
                        { t: 'rate of f/g = numerator effect + denominator effect', hl: true, rule: 'the plan for this lab' }
                    ];
                }
            },
            {
                kind: 'readout',
                title: 'Live values at the dragged x',
                items: env => [
                    { label: 'numerator f', v: env.f, color: 'accent' },
                    { label: 'rate of f at that x, f′', v: env.fp, color: 'up' },
                    { label: 'denominator g', v: env.gv, color: 'accent' },
                    { label: 'rate of g at that x, g′', v: env.gp, color: 'down' },
                    { label: 'ratio f/g', v: env.ratio },
                    { label: 'rate of the ratio f/g', v: env.netRate, big: true, color: env.netRate >= 0 ? 'up' : 'down' }
                ]
            },
            {
                kind: 'graph',
                title: env => 'Verification view: the tangent of f/g ' + (
                    env.netRate > 0 ? 'rises, because the numerator effect is larger here.'
                        : env.netRate < 0 ? 'falls, because the denominator effect is larger here.'
                            : 'is flat, because the two effects balance here.'
                ),
                when: env => env.stage >= 2,
                height: 300,
                window: [0.2, 4.6, -1, 8],
                curves: env => [{ fn: ratioFn(env), color: 'curveA', label: 'f/g' }],
                points: env => [{ x: env.x0, y: env.ratio, color: 'accent', label: 'x = ' + round2(env.x0) }],
                segments: env => [{
                    x1: env.x0 - 1, y1: env.ratio - env.netRate,
                    x2: env.x0 + 1, y2: env.ratio + env.netRate,
                    color: env.netRate >= 0 ? 'up' : 'down'
                }]
            }
        ],
        side: [
            {
                kind: 'compare', title: 'The order of the two terms matters',
                sides: () => [
                    { title: 'Wrong order: fg′ − f′g', lines: ['That difference is the negative of the true rate.', 'The minus sign carries meaning, so the two terms cannot swap places.'], tone: 'wrong' },
                    { title: 'Correct order: f′g − fg′', lines: ['The term built from the rate of f comes first.', 'The term built from the rate of g is the one subtracted.'], tone: 'right' }
                ]
            },
            { kind: 'note', tone: 'warn', title: 'Where the ratio is defined', text: 'The denominator g(x) must not be 0. Where g is 0, neither the ratio nor the derivative of the ratio exists. Every reading in this lab is taken where g is not 0.' }
        ]
    },
    steps: [
        {
            params: { gk: 'slow', x0: 2, freezeF: 0, stage: 1 },
            message: 'Case 1 holds the denominator at the constant g = 5, so g′ = 0. Read the two effect cards and the ledger: the denominator effect is 0, and the net rate must agree with a rule you already know.'
        },
        {
            params: { gk: 'lin', stage: 2 },
            predict: {
                q: 'On this screen the denominator g = 5 is constant, so g′ = 0. What does the net effect reduce to?',
                choices: [
                    'f′ ÷ g. The denominator effect is 0, so the net rate is just the numerator effect.',
                    'f ÷ g′. The surviving effect divides by the rate of the denominator.',
                    '0. A constant denominator freezes the whole ratio.'
                ], a: 0,
                why: 'With g′ = 0 only the numerator effect survives, and one factor of g cancels out of f′g ÷ g², which leaves f′ ÷ g. A rule for quotients has to agree with the simpler rules it contains.'
            },
            message: 'Case 2 starts with both effects live: g = x grows at g′ = 1, so the denominator card is negative for the first time. Slide the current x and watch the two bands trade size.'
        },
        {
            params: { freezeF: 1, stage: 3 },
            predict: {
                q: 'The next step holds the numerator f fixed while g = x keeps growing. Which way does the net rate of f/g point, and why?',
                choices: [
                    'Negative. The numerator effect dies at f′ = 0, and only the denominator pull is left.',
                    'Positive. A fixed numerator keeps the top of the fraction growing in value.',
                    'Zero. The two effects always cancel once one of them vanishes.'
                ], a: 0,
                why: 'The surviving effect is − fg′ ÷ g², and it is negative whenever g grows. That single term is the minus sign of the rule, and the next screen freezes f so the cards can measure it.'
            },
            message: 'Case 2 measured: the numerator is frozen at f = f(x₀), f′ reads 0 on the left card, and the numerator effect is gone. The band below 0 is the whole story, the big rate in the readout is negative, and the tangent in the verification view tilts down. This is where the minus sign of the rule comes from.'
        },
        {
            params: { freezeF: 0, x0: 1.1, stage: 4 },
            message: env => 'Case 3: the numerator runs again at x = 1.1, where f′ reads ' + round2(env.fp) + ' and g′ reads ' + round2(env.gp) + '. The ledger names both effects and shares the divisor g² = ' + round2(env.g2) + ' between them. Slide the current x until the NET probe crosses 0: the two effects balance near x = 1.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Two effects are live on the cards, and both are scaled by the same divisor g². Which single line should the ledger close into?',
                choices: [
                    '(f/g)′ = (f′g − fg′) ÷ g². The minus sign keeps the denominator effect apart from the numerator effect.',
                    '(f/g)′ = f′ ÷ g′. Each effect has its own derivative, so the rule divides one by the other.',
                    '(f/g)′ = (f′g + fg′) ÷ g². Both effects pull the same way, so the ledger adds their terms.'
                ], a: 0,
                why: 'The cards already add the effects with signs: f′g ÷ g² plus − fg′ ÷ g². Writing that sum over the shared divisor gives f′g − fg′ on top. A plus would erase the minus sign measured in Case 2, and f′ ÷ g′ never appears in the ledger.'
            },
            message: 'The ledger closes into one line: (f/g)′ = (f′g − fg′) ÷ g². The numerator effect keeps the first term, and the denominator effect is the term being subtracted.'
        },
        {
            params: { gk: 'fast', x0: 2, stage: 6 },
            predict: {
                q: 'The next screen sets g = x² + 2 at x = 2, where f = 5, f′ = 4, g = 6, and g′ = 4. What does the ledger predict for the net effect, and for the tangent in the verification view?',
                choices: [
                    'Net effect +0.11. The numerator effect 24 ÷ 36 is larger than the denominator effect −20 ÷ 36, so the tangent tilts up.',
                    'Net effect −0.11. The minus sign of the denominator effect dominates the sum, so the tangent tilts down.',
                    'Net effect +1. The rule divides the two rates, 4 ÷ 4 = 1, so the tangent tilts up.'
                ], a: 0,
                why: 'The effects sum with signs: 24 ÷ 36 + (−20 ÷ 36) = 4 ÷ 36, which is positive. The sign of the net effect is the slope of the tangent, so the verification view has to rise there. The ratio f′ ÷ g′ belongs to no ledger line.'
            },
            message: 'Case 4: with g = x² + 2 both effects grow as x grows, so the balance shifts again, and the shortcut f′ ÷ g′ is checked against the ledger in the question. The order comparison in the side panel keeps one more trap: swapping the terms flips the sign. The cards, the number line, and the verification tangent must agree on the sign at every dragged x. Before using the rule on paper, check whether f/g simplifies algebraically. When it does simplify, differentiating the simpler form is less work.'
        }
    ],
    summary: {
        idea: 'A quotient changes for two reasons at once. The numerator effect f′g ÷ g² and the denominator effect − fg′ ÷ g² enter the net rate with opposite signs, and their sum is the rate of the ratio. Dividing by g² rescales that sum, so a small denominator magnifies the rate of f/g.',
        mistake: 'The first error is writing (f/g)′ = f′/g′: the quotient rule is not the ratio of the two derivatives. The second error is swapping the two terms, which flips the sign of the net effect. A third error is using the rule where g is 0. A quick check is to hold g constant, because the ledger must reduce to f′ ÷ g there.',
        transfer: 'Take f = x² + 1 and g = x at x = 2, where f′ = 4 and g′ = 1. Say the numerator effect and the denominator effect with their signs before you combine them. Set the denominator to g = x and the current x to 2, then check that the ledger, the NET probe, and the verification tangent all read +0.75 and tilt up.'
    }
};

function round2(v) { return String(Math.round(v * 100) / 100); }
