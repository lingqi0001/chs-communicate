/* 2.8 Product Change Lab — a rectangle whose width and height both grow. The
   gained area splits into two strips and a corner; only the strips survive
   the limit, and they become the two terms of the product rule. */

const F = (x) => x;
const G = (x) => x * x + 1;

/* one stage per Next press, all gated on env.stage:
   0-1 old rectangle fg, 2 right strip gΔf, 3 top strip fΔg, 4 corner ΔfΔg,
   5 divide every piece by Δx, 6 shrink Δx toward 0 */
const stripFocus = env => env.stage === 2 ? 'rightStrip' : env.stage === 3 ? 'topStrip' : env.stage === 4 ? 'corner' : '';

export default {
    id: 'u2-product-rule',
    meta: { unit: 2, topic: '2.8', title: 'The Product Rule', visualizerTitle: 'Product Change Lab' },
    intro: 'The rectangle shows the product f·g at the current x. Its width is f, its height is g, and its area is fg. Press Next to grow x by Δx and watch which pieces of area appear.',
    params: { stage: 0, x0: 2, dx: 0.8 },
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
        return { fAt, gAt, fEnd, gEnd, dF, dG, fgNow: fAt * gAt, dProd: fEnd * gEnd - fAt * gAt };
    },
    panes: {
        main: [
            {
                kind: 'rectarea', title: 'The product as an area', height: 320,
                f: 'fAt', fg: 'gAt', df: 'dF', dfg: 'dG',
                show: {
                    rightStrip: env => env.stage >= 2,
                    topStrip: env => env.stage >= 3,
                    corner: env => env.stage >= 4
                },
                emphasis: stripFocus,
                labels: {
                    w: env => 'f = ' + round2(env.fAt),
                    h: env => 'g = ' + round2(env.gAt),
                    dw: env => 'Δf = ' + round2(env.dF),
                    dh: env => 'Δg = ' + round2(env.dG),
                    base: env => 'fg = ' + round2(env.fgNow),
                    rightStrip: env => 'gΔf = ' + round2(env.gAt * env.dF),
                    topStrip: env => 'fΔg = ' + round2(env.fAt * env.dG),
                    corner: env => 'ΔfΔg = ' + round2(env.dF * env.dG),
                    area: () => ''
                },
                note: env => 'current area fg = ' + round2(env.fgNow)
                    + (env.stage >= 2 ? ', total gained Δ(fg) = ' + round2(env.dProd) : '')
            },
            {
                kind: 'readout', title: 'The gained area, piece by piece', when: env => env.stage >= 4,
                items: env => [
                    { label: 'right strip g·Δf', v: env.gAt * env.dF, color: 'aux' },
                    { label: 'top strip f·Δg', v: env.fAt * env.dG, color: 'up' },
                    { label: 'corner Δf·Δg', v: env.dF * env.dG, color: 'auxInk' },
                    { label: 'total gained Δ(fg)', v: env.dProd, big: true }
                ]
            },
            {
                kind: 'readout', title: 'Divide everything by Δx', when: env => env.stage >= 5,
                items: env => [
                    { label: 'strip g·Δf ÷ Δx', v: env.gAt * env.dF / env.dx, color: 'aux' },
                    { label: 'strip f·Δg ÷ Δx', v: env.fAt * env.dG / env.dx, color: 'up' },
                    { label: 'corner Δf·Δg ÷ Δx', v: env.dF * env.dG / env.dx, color: 'auxInk' },
                    { label: 'measured Δ(fg) ÷ Δx', v: env.dProd / env.dx, big: true }
                ]
            },
            {
                kind: 'practice', id: 'u2-product-terms', when: env => env.stage >= 6,
                title: 'Which factor produces each term (f = x and g = x² + 1)',
                items: [
                    {
                        q: 'The product rule for f = x and g = x² + 1 reads (fg)′ = f′g + fg′ = 1·(x² + 1) + x·(2x). In the first term 1·(x² + 1), which factor is differentiated?',
                        choices: [
                            'f = x. Its derivative is the 1 that appears in this term.',
                            'g = x² + 1. Its derivative is the x² + 1 that appears here.',
                            'Both at once. A product always differentiates both factors together.'
                        ], a: 0,
                        why: 'The first term takes the derivative of f, which is 1, and keeps g as the value x² + 1. Each term of the product rule differentiates one factor and keeps the other factor as a value.',
                        whyBy: [
                            'The first term takes the derivative of f, which is 1, and keeps g as the value x² + 1. Each term of the product rule differentiates one factor and keeps the other factor as a value.',
                            'The derivative of g, which is 2x, shows up in the second term x·(2x) instead. In this term g keeps its value.',
                            'This choice claims (fg)′ = f′g′. Every term of the product rule has one derivative and one plain factor, never two derivatives.'
                        ]
                    },
                    {
                        q: 'In the second term x·(2x), where does the factor 2x come from?',
                        choices: [
                            'From g = x² + 1, the factor being differentiated in this term.',
                            'From f = x, the factor being differentiated in this term.',
                            'From the corner piece Δf·Δg, which survives the limit.'
                        ], a: 0,
                        why: 'The derivative of x² + 1 is 2x, while f = x keeps its value. That is the fg′ term of f′g + fg′.',
                        whyBy: [
                            'The derivative of x² + 1 is 2x, while f = x keeps its value. That is the fg′ term of f′g + fg′.',
                            'f = x differentiates to the 1 in the first term 1·(x² + 1). In this second term f = x keeps its value.',
                            'The corner Δf·Δg still carries a factor of Δx, so it contributes nothing once Δx shrinks to 0.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The product rule step by step',
                lines: env => {
                    const s = [
                        { t: 'f = x, f′ = 1', color: 'auxInk' },
                        { t: 'g = x² + 1, g′ = 2x', color: 'auxInk' }
                    ];
                    if (env.stage >= 1) s.push({ t: 'area fg = ' + round2(env.fgNow), hl: true, rule: 'the old rectangle' });
                    if (env.stage >= 2) s.push({ t: 'right strip g·Δf = ' + round2(env.gAt * env.dF), color: 'aux' });
                    if (env.stage >= 3) s.push({ t: 'top strip f·Δg = ' + round2(env.fAt * env.dG), color: 'up' });
                    if (env.stage >= 4) s.push(
                        { t: 'corner Δf·Δg = ' + round2(env.dF * env.dG), color: 'auxInk' },
                        { t: 'Δ(fg) = g·Δf + f·Δg + Δf·Δg = ' + round2(env.dProd), hl: true, rule: 'exact split' });
                    if (env.stage >= 5) s.push({ t: 'Δ(fg) ÷ Δx = g·(Δf ÷ Δx) + f·(Δg ÷ Δx) + Δf·Δg ÷ Δx', rule: 'divide every piece by Δx' });
                    if (env.stage >= 6) {
                        s.push({ t: 'Δf ÷ Δx → f′ = 1, Δg ÷ Δx → g′ = 2x, corner term → 0' });
                        s.push({ t: '(fg)′ = f′g + fg′', hl: true, rule: 'the product rule' });
                        s.push({ t: 'At x = ' + round2(env.x0) + ':  1·' + round2(env.gAt) + ' + ' + round2(env.fAt) + '·' + round2(2 * env.x0) + ' = ' + round2(env.gAt + env.fAt * 2 * env.x0), color: 'up' });
                    }
                    return s;
                }
            },
            {
                kind: 'compare', title: 'Two candidates checked against the measurement',
                when: env => env.stage >= 5,
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
            params: { stage: 1, x0: 2, dx: 0.8 },
            message: env => 'Step 1 shows only the old rectangle at x = ' + round2(env.x0) + '. Its width is f = ' + round2(env.fAt) + ', its height is g = ' + round2(env.gAt) + ', and its area is the product fg = ' + round2(env.fgNow) + '.'
        },
        {
            params: { stage: 2 },
            message: 'Now x grows by Δx, so f grows by Δf. The width changed while the old height g stayed, and that adds the right strip with area gΔf.'
        },
        {
            params: { stage: 3 },
            message: 'The other factor moves too. g grows by Δg while the old width f stays, and that adds the top strip with area fΔg.'
        },
        {
            params: { stage: 4 },
            message: 'The two changes overlap in the small corner, and its area is ΔfΔg. So the exact change of the product is Δ(fg) = gΔf + fΔg + ΔfΔg. The gained readout checks the three pieces against Δ(fg).'
        },
        {
            params: { stage: 5 },
            message: 'Divide every piece by Δx. Each strip becomes a rate, and the corner keeps one factor of Δx, so the corner rate is ΔfΔg ÷ Δx. The comparison panel now checks two candidate formulas against the measured rate.'
        },
        {
            params: { stage: 6, dx: 0.3 },
            predict: {
                q: 'We will shrink Δx toward 0. Which pieces still matter for the final rate?',
                choices: [
                    'The two strips g·Δf and f·Δg. The corner Δf·Δg keeps a factor of Δx, so its limit is 0.',
                    'All three pieces stay. The corner term also keeps a value as Δx shrinks.',
                    'Only the corner piece stays. The corner is the new part of the growing product.',
                    'Neither piece stays. The rate of a product is just the product f′g′.'
                ], a: 0,
                why: 'Dividing Δf·Δg by Δx leaves one Δx in the corner term, so its limit is 0. Each strip turns into exactly one term of the rule.'
            },
            message: env => 'Δx is 0.3 now. The corner rate fell to ' + round2(env.dF * env.dG / env.dx) + ' while the two strip rates barely moved. Slide Δx to watch the corner shrink.'
        },
        {
            params: { dx: 0.1 },
            message: env => 'At Δx = 0.1 the corner rate is ' + round2(env.dF * env.dG / env.dx) + '. The measured rate Δ(fg) ÷ Δx closes in on the sum of the two strip rates.'
        },
        {
            params: { dx: 0.02 },
            message: env => 'At Δx = 0.02 the corner rate is only ' + round2(env.dF * env.dG / env.dx) + '. What survives is (fg)′ = g·f′ + f·g′, the product rule.'
        }
    ],
    summary: {
        idea: 'The product rule has two terms because either factor can change while the other contributes its current value. The corner strip still carries an extra factor of Δx, so the limit removes it and only the two strips remain.',
        mistake: 'A common mistake is writing (fg)′ = f′g′. That term multiplies two rates and uses no values, so it measures a change the geometry never produces.',
        transfer: 'Start with x² · sin x. Name the factor that is differentiated in each term. Now take f(2) = 5, g(2) = 3, f′(2) = −1 and g′(2) = 4. Say which term is negative. Then find (fg)′(2) = −1·3 + 5·4 = 17.'
    }
};

function round2(v) { return String(Math.round(v * 100) / 100); }
