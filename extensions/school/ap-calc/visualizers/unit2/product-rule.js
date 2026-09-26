/* 2.8 Product Change Lab — a rectangle whose width and height both grow. The
   gained area splits into two strips and a corner; only the strips survive
   the limit, and they become the two terms of the product rule. */

const F = (x) => x;
const G = (x) => x * x + 1;

export default {
    id: 'u2-product-rule',
    meta: { unit: 2, topic: '2.8', title: 'The Product Rule', visualizerTitle: 'Product Change Lab' },
    intro: 'In this figure the width and the height of a rectangle grow together. Divide the gained area by Δx, then shrink Δx toward 0. Two of the three pieces remain in that limit.',
    params: { x0: 2, dx: 0.5 },
    controls: [
        { key: 'x0', label: 'current x', min: 0, max: 3.5, step: 0.05 },
        { key: 'dx', label: 'Δx', min: 0.02, max: 0.8, step: 0.005 }
    ],
    fns: {
        f: (x) => F(x),
        g: (x) => G(x)
    },
    compute: (env) => {
        /* forward difference: the rectangle is drawn at x and grows to x + Δx,
           so both side lengths stay non-negative all the way down to x = 0 */
        const fAt = F(env.x0), gAt = G(env.x0);
        const fEnd = F(env.x0 + env.dx), gEnd = G(env.x0 + env.dx);
        const dF = fEnd - fAt, dG = gEnd - gAt;
        return { fAt, gAt, fEnd, gEnd, dF, dG, dProd: fEnd * gEnd - fAt * gAt };
    },
    panes: {
        main: [
            {
                kind: 'rectarea', title: 'Area gained when both factors grow', height: 320,
                f: 'fAt', fg: 'gAt', df: 'dF', dfg: 'dG',
                labels: {
                    w: env => 'f = ' + round2(env.fAt),
                    h: env => 'g = ' + round2(env.gAt),
                    dw: env => 'Δf',
                    dh: env => 'Δg',
                    area: env => 'fg = ' + round2(env.dProd) + ' gained'
                },
                note: env => 'both strips plus the corner = ' + round3(env.fAt * env.dG + env.gAt * env.dF + env.dF * env.dG)
                    + ', true change of fg = ' + round3(env.dProd)
            },
            {
                kind: 'readout', title: 'Divide everything by Δx',
                items: env => [
                    { label: 'strip g·Δf ÷ Δx', v: env.gAt * env.dF / env.dx, color: 'accent' },
                    { label: 'strip f·Δg ÷ Δx', v: env.fAt * env.dG / env.dx, color: 'up' },
                    { label: 'corner Δf·Δg ÷ Δx', v: env.dF * env.dG / env.dx, color: 'down' },
                    { label: 'measured Δ(fg) ÷ Δx', v: env.dProd / env.dx, big: true }
                ]
            },
            {
                kind: 'practice', id: 'u2-product-terms', title: 'Which factor produces each term in the product rule (f = x² · sin x)',
                items: [
                    {
                        q: 'One term of the product rule for x² · sin x is 2x · sin x. Which factor is differentiated to give the 2x?',
                        choices: [
                            'x². The term differentiates x² and keeps sin x as its value.',
                            'sin x. The term differentiates sin x and keeps x² as its value.',
                            'Both at once. The term differentiates x² and sin x together.'
                        ], a: 0,
                        why: 'The derivative of x² is 2x, and sin x enters this term unchanged. Each term of the product rule differentiates one factor and keeps the other factor as a value.',
                        whyBy: [
                            'The derivative of x² is 2x, and sin x enters this term unchanged. Each term of the product rule differentiates one factor and keeps the other factor as a value.',
                            'sin x differentiates to cos x, and the other term x² · cos x uses that cos x. In this term sin x keeps its value instead of being differentiated.',
                            'This choice claims (fg)′ = f′g′. Every term of the product rule has one derivative and one plain factor, never two derivatives.'
                        ]
                    },
                    {
                        q: 'The other term is x² · cos x. Where does the cos x come from?',
                        choices: [
                            'From sin x, which is the factor being differentiated in this term.',
                            'From x², which is the factor being differentiated in this term.',
                            'From the corner piece, which survives the limit.'
                        ], a: 0,
                        why: 'The derivative of sin x is cos x, while x² keeps its value. That is the second term of f′g + fg′.',
                        whyBy: [
                            'The derivative of sin x is cos x, while x² keeps its value. That is the second term of f′g + fg′.',
                            'The derivative of x² is 2x, and that derivative produced the first term 2x · sin x instead.',
                            'The corner Δf·Δg still contains a factor of Δx, so it contributes nothing once Δx shrinks to 0.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The product rule step by step',
                lines: env => [
                    { t: 'f = x, f′ = 1', color: 'auxInk' },
                    { t: 'g = x² + 1, g′ = 2x', color: 'auxInk' },
                    { t: 'Δ(fg) = f·Δg + g·Δf + Δf·Δg', hl: true, rule: 'exact split' },
                    { t: 'Divide by Δx, then let Δx shrink to 0', rule: 'the limit step' },
                    { t: 'g·f′  +  f·g′  +  [Δf·Δg ÷ Δx → 0]', color: 'up' },
                    { t: '(fg)′ = f′g + fg′', hl: true },
                    { t: 'At x = ' + round2(env.x0) + ':  1·' + round2(env.gAt) + ' + ' + round2(env.fAt) + '·' + round2(2 * env.x0) + ' = ' + round2(env.gAt + env.fAt * 2 * env.x0), color: 'up' }
                ]
            },
            {
                kind: 'compare', title: 'Two candidates checked against the measurement',
                sides: env => {
                    const trueRate = env.dProd / env.dx;
                    const right = 1 * env.gAt + env.fAt * 2 * env.x0;
                    const wrong = 1 * (2 * env.x0);
                    return [
                        { title: 'f′g′ (only the rates)', lines: [
                            'f′g′ = ' + round2(wrong),
                            'Distance from the measured rate = ' + round2(Math.abs(wrong - trueRate))
                        ], tone: 'wrong' },
                        { title: 'f′g + fg′ (one rate, one value per term)', lines: [
                            'f′g + fg′ = ' + round2(right),
                            'Distance from the measured rate = ' + round2(Math.abs(right - trueRate))
                        ], tone: 'right' }
                    ];
                },
                verdict: env => {
                    const trueRate = env.dProd / env.dx;
                    const right = 1 * env.gAt + env.fAt * 2 * env.x0;
                    return Math.abs(right - trueRate) < 0.35
                        ? 'With Δx this small, the two-term formula agrees with the measured rate.'
                        : 'The corner still matters while Δx is wide. Shrink Δx and the comparison settles.';
                }
            }
        ]
    },
    steps: [
        {
            params: { x0: 2, dx: 0.8 },
            message: 'Start with a wide Δx, so the corner is large enough to see in the figure. A wide Δx also inflates the measured rate, so read the corner row.'
        },
        {
            params: { dx: 0.3 },
            message: 'Δx is smaller now. The two strip rows hardly move per unit Δx, while the corner row shrinks as Δx shrinks.'
        },
        {
            params: { dx: 0.1 },
            predict: {
                q: 'As Δx shrinks toward 0, which pieces still matter for the final rate?',
                choices: [
                    'The two strips g·f′ and f·g′. The corner keeps a factor Δx, so its limit is 0.',
                    'All three pieces stay. The corner term also keeps a value as Δx shrinks.',
                    'Only the corner piece stays. The corner is the new part of the growing product.',
                    'Neither piece stays. The rate of a product is just the product f′g′.'
                ], a: 0,
                why: 'Dividing Δf·Δg by Δx leaves one Δx in the corner term, so its limit is 0. Each strip turns into exactly one term of the rule.'
            },
            message: 'Slide Δx down. The corner row heads for 0 while the measured rate approaches the sum of the two strip rows.'
        },
        {
            params: { dx: 0.02 },
            message: env => 'The corner row is now down to ' + round2(env.dF * env.dG / env.dx) + '. The two-term formula agrees with the measured rate, while the product of the two derivatives does not.'
        },
        {
            params: { x0: 0 },
            predict: {
                q: 'Imagine f stops changing while g keeps growing, so f′ = 0 and g′ is not zero. What should (fg)′ reduce to?',
                choices: [
                    'f·g′ only. The term g·f′ uses f′, so it vanishes when f′ is 0.',
                    'g·f′ only. The term f·g′ uses f′, so it vanishes when f′ is 0.',
                    '0. The steady factor f holds the whole product still at every x.',
                    'f′g′. A product rate is always the product of the two separate rates.'
                ], a: 0,
                why: 'With f′ = 0 the first term is 0 and the corner is already gone in the limit, so only f·g′ remains. Which factor is changing decides which term survives, so the two terms are not interchangeable.'
            },
            message: 'This lab cannot make f constant, but x = 0 shows the mirror case. The factor f = x has value 0 there, while its rate stays 1. Then (fg)′ = 1·g + 0·g′ = g = 1, so a product can change even when one factor is 0.'
        }
    ],
    summary: {
        idea: 'The product rule has two terms because either factor can change while the other contributes its current value. The corner is a second-order piece, and the limit removes it.',
        mistake: 'A common mistake is writing (fg)′ = f′g′. That term multiplies two rates and uses no values, so it measures a change the geometry never produces.',
        transfer: 'Start with x² · sin x. Name the factor that is differentiated in each term. Now take f(2) = 5, g(2) = 3, f′(2) = −1 and g′(2) = 4. Say which term is negative. Then find (fg)′(2) = −1·3 + 5·4 = 17.'
    }
};

function round2(v) { return String(Math.round(v * 100) / 100); }
function round3(v) { return String(Math.round(v * 1000) / 1000); }
