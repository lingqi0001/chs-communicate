/* 2.9 Ratio Change Lab — a quotient changes for two reasons at once, with
   opposite signs. Every quantity the rule needs has a live reading, and the
   numerator can be held fixed so the sign prediction can be measured. */

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

export default {
    id: 'u2-quotient-rule',
    meta: { unit: 2, topic: '2.9', title: 'The Quotient Rule', visualizerTitle: 'Ratio Change Lab' },
    intro: 'A ratio changes for two reasons at once: the numerator changes, and the denominator changes. The quotient rule adds those two effects, and they enter with opposite signs.',
    params: { x0: 2, gk: 'lin', freezeF: 0 },
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
        return {
            f, fp, gv, gp, numTerm, denTerm,
            ratio: f / gv,
            trueRate: (numTerm - denTerm) / (gv * gv)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                title: env => 'The ratio y = f/g' + (fixed(env) ? ', with f held fixed,' : '') + ' and its tangent line at the dragged x',
                height: 300,
                window: [0.2, 4.6, -1, 8],
                curves: env => [{ fn: ratioFn(env), color: 'curveA', label: 'f/g' }],
                points: env => [{ x: env.x0, y: env.ratio, color: 'accent', label: 'x = ' + round2(env.x0) }],
                segments: env => [{
                    x1: env.x0 - 1, y1: env.ratio - env.trueRate,
                    x2: env.x0 + 1, y2: env.ratio + env.trueRate,
                    color: 'up'
                }]
            },
            {
                kind: 'readout', title: 'Values and rates at the dragged x',
                items: env => [
                    { label: 'numerator f', v: env.f, color: 'accent' },
                    { label: 'rate of f at that x, f′', v: env.fp, color: 'up' },
                    { label: 'denominator g', v: env.gv, color: 'accent' },
                    { label: 'rate of g at that x, g′', v: env.gp, color: 'down' },
                    { label: 'ratio f/g', v: env.ratio },
                    { label: 'rate of the ratio f/g', v: env.trueRate, big: true, color: 'up' }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The formula and the sign of each term',
                lines: env => [
                    { t: '(f/g)′ = (f′g − fg′) / g²', hl: true },
                    { t: 'f′g = ' + round2(env.numTerm), color: 'up', rule: env.fp > 0 ? 'A rising numerator pushes the ratio up' : 'A fixed numerator pushes nothing' },
                    { t: '− f g′ = ' + round2(-env.denTerm), color: 'down', rule: 'A rising denominator pulls the ratio down' },
                    { t: 'over g² = ' + round2(env.gv * env.gv), rule: 'One factor divides both terms' },
                    { t: env.trueRate > 0 ? 'The numerator term is larger here, so the ratio is rising.' : 'The denominator term is larger here, so the ratio is falling.', color: 'auxInk' }
                ]
            },
            {
                kind: 'compare', title: 'The order of the two terms matters',
                sides: () => [
                    { title: 'Wrong order: fg′ − f′g', lines: ['That difference is the negative of the true rate.', 'The minus sign carries meaning, so the two terms cannot swap places.'], tone: 'wrong' },
                    { title: 'Correct order: f′g − fg′', lines: ['The term built from the rate of f comes first.', 'The term built from the rate of g is the one subtracted.'], tone: 'right' }
                ]
            },
            { kind: 'note', tone: 'warn', title: 'Where the ratio is defined', text: 'The denominator g(x) must not be 0. Where g is 0, neither the ratio nor the derivative of the ratio exists.' }
        ]
    },
    steps: [
        {
            params: { gk: 'slow', x0: 2, freezeF: 0 },
            message: 'The denominator is the constant g = 5, so only the numerator changes here. The quotient rule should reduce to a rule you already know.'
        },
        {
            params: {},
            predict: {
                q: 'The denominator g is constant, so g′ = 0. What does (f/g)′ reduce to?',
                choices: ['It reduces to f′/g, which is the constant multiple rule applied to (1/g)·f.', 'It reduces to f/g′, the ratio of the two separate derivatives.', 'It reduces to 0, because a constant denominator makes the ratio constant.'], a: 0,
                why: 'With g′ = 0 the second term disappears, and one factor of g cancels against g², leaving f′g/g² = f′/g. A rule for quotients has to agree with the simpler rules it contains.'
            },
            message: 'The rate of g is 0, so the denominator contributes nothing to the rate of f/g.'
        },
        {
            params: { gk: 'lin' },
            predict: {
                q: 'Both parts now change: f rises and g rises. If f were held fixed while g kept growing, would the ratio f/g rise or fall?',
                choices: ['Fall. A fixed amount split into more groups gives each group less.', 'Rise. Growth in the denominator is still growth.', 'Unchanged. The denominator affects the size of the ratio, not its direction.'], a: 0,
                why: 'That is what the −f·g′ term records: the change of the denominator enters the rate with a minus sign. The next step holds f fixed so you can measure the effect instead of imagining it.'
            },
            message: 'At x = 2 the numerator term f′g is 8 and the denominator term fg′ is 5. The rate of f/g is positive there, and the readout shows it as 0.75.'
        },
        {
            params: { freezeF: 1 },
            message: 'The numerator f is held fixed while g = x keeps growing. The rate of the ratio is negative and its tangent tilts down, which is the answer you predicted one step ago.'
        },
        {
            params: { freezeF: 0, x0: 3.6 },
            message: env => 'The numerator grows again at x = 3.6, and f′ reads ' + round2(env.fp) + ' while g′ reads ' + round2(env.gp) + '. Under "The formula and the sign of each term", compare the two terms and slide x until they balance.'
        },
        {
            params: { gk: 'fast', x0: 2 },
            message: 'With g = x² + 2 both terms grow as x grows, so the balance shifts again. Before using the rule, check whether f/g simplifies algebraically. When it does simplify, differentiating the simpler form is less work.'
        }
    ],
    summary: {
        idea: 'A quotient changes for two reasons at once, and the two effects enter the rule with opposite signs. Dividing by g² rescales the difference, so a small denominator magnifies the rate of the ratio.',
        mistake: 'The first error is writing (f/g)′ = f′/g′: the quotient rule is not the ratio of the two derivatives. The second error is swapping the two terms, and a third is using the rule where g is 0. A quick check is to hold g constant, because a rule for quotients must reduce to f′/g there.',
        transfer: 'Take f = x² + 1 and g = x at x = 2, where f′ = 4 and g′ = 1. Say each term with its sign before you compute the rate of f/g. Set the denominator to g = x and the current x to 2, then check the value 0.75.'
    }
};

function round2(v) { return String(Math.round(v * 100) / 100); }
