/* 2.7 Core Derivative Function Lab — sin, cos, eˣ and ln: each claimed rule is
   checked against slope stamps measured numerically on the curve itself.
   The probe is clamped inside the drawn x range of the active case, so the
   probe point can never sit outside the viewport, and the exp window is tall
   enough to hold eˣ at the far end of that range. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const MODES = {
    sin: {
        f: (x) => Math.sin(x), fp: (x) => Math.cos(x),
        win: [-0.6, 6.9, -1.6, 1.6], fpWin: [-0.6, 6.9, -1.6, 1.6],
        probe: [0.15, 6.2],
        claim: 'd/dx sin x = cos x', rule: 'cos x',
        story: 'At the crest of sin the slope flattens exactly where cos passes through 0, and sin rises fastest at 0 where cos(0) = 1.'
    },
    cos: {
        f: (x) => Math.cos(x), fp: (x) => -Math.sin(x),
        win: [-0.6, 6.9, -1.6, 1.6], fpWin: [-0.6, 6.9, -1.6, 1.6],
        probe: [0.15, 6.2],
        claim: 'd/dx cos x = −sin x', rule: '−sin x',
        story: 'cos starts descending right away from its crest at 0, so its slope is 0 there and negative just after. That is the signature of −sin x, not of sin x.'
    },
    exp: {
        f: (x) => Math.exp(x), fp: (x) => Math.exp(x),
        win: [-3, 2.2, -0.5, 9.5], fpWin: [-3, 2.2, -0.5, 9.5],
        probe: [0.15, 2.1],
        claim: 'd/dx eˣ = eˣ', rule: 'eˣ',
        story: 'The height and the slope are the same number at every x, so both graphs show the same curve.'
    },
    ln: {
        f: (x) => Math.log(x), fp: (x) => 1 / x,
        win: [0.05, 7, -2.5, 2.5], fpWin: [0.05, 7, 0, 6],
        probe: [0.25, 6.8],
        claim: 'd/dx ln x = 1/x   (x > 0)', rule: '1/x',
        story: 'ln is steepest close to 0, where 1/x is largest, and it flattens as 1/x falls toward 0. The slopes only exist for x > 0.'
    }
};

const NAMES = ['sin', 'cos', 'exp', 'ln'];
const DOT_N = 14;

function probeIn(env) {
    const p = MODES[env.kase].probe;
    return Math.min(Math.max(env.x0, p[0]), p[1]);
}

/* stamps of the measured slope, kept inside the drawn window so nothing
   renders off screen */
function slopeDots(env) {
    const m = MODES[env.kase];
    const [wx0, wx1, wy0, wy1] = m.fpWin;
    const lo = Math.max(m.probe[0] - 0.1, wx0 + 0.05);
    const hi = Math.min(m.probe[1] + 0.1, wx1 - 0.05);
    const out = [];
    for (let i = 0; i <= DOT_N; i++) {
        const x = lo + (hi - lo) * i / DOT_N;
        const y = derivative(m.f, x);
        if (Number.isFinite(y) && y >= wy0 && y <= wy1) out.push({ x, y, color: 'up', r: 3 });
    }
    return out;
}

export default {
    id: 'u2-core-derivatives',
    meta: { unit: 2, topic: '2.7', title: 'Derivatives of cos(x), sin(x), e^x, and ln(x)', visualizerTitle: 'Core Derivative Function Lab' },
    intro: 'Four rules, each checked by eye. One probe reads the same x on the height graph and on the slope graph.',
    params: { kase: 'sin', x0: 1, named: 1 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: [
                { v: 'sin', label: 'sin x' }, { v: 'cos', label: 'cos x' },
                { v: 'exp', label: 'eˣ' }, { v: 'ln', label: 'ln x' }
            ]
        },
        {
            key: 'named', label: 'labels and the rule', kind: 'choice',
            options: [
                { v: 1, label: 'shown' },
                { v: 0, label: 'hidden' }
            ]
        },
        { key: 'x0', label: 'probe x', min: 0.15, max: 6.2, step: 0.01 }
    ],
    fns: {
        f: (x, env) => MODES[env.kase].f(x),
        fp: (x, env) => derivative(MODES[env.kase].f, x)
    },
    compute: (env) => ({ x0: probeIn(env) }),
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'Height graph: y = ' + envName(env.kase), height: 220,
                when: env => env.named > 0.5,
                window: env => MODES[env.kase].win,
                curves: env => [{ fn: 'f', color: 'curveA' }],
                points: env => [{ x: env.x0, fn: 'f', color: 'accent', label: 'x = ' + round2(env.x0) }],
                segments: env => [{
                    x1: env.x0 - 0.7, y1: MODES[env.kase].f(env.x0) - 0.7 * MODES[env.kase].fp(env.x0),
                    x2: env.x0 + 0.7, y2: MODES[env.kase].f(env.x0) + 0.7 * MODES[env.kase].fp(env.x0),
                    color: 'up'
                }]
            },
            {
                kind: 'graph',
                title: env => env.named > 0.5
                    ? 'Slope graph: y = ' + MODES[env.kase].rule
                    : 'The same curve with its name hidden',
                height: 220,
                window: env => MODES[env.kase].fpWin,
                curves: env => [{
                    fn: MODES[env.kase].fp, color: 'curveC',
                    label: env.named > 0.5 ? MODES[env.kase].rule : null
                }],
                points: env => {
                    const dots = slopeDots(env);
                    dots.push({
                        x: env.x0, y: MODES[env.kase].fp(env.x0), color: 'accent',
                        label: env.named > 0.5 ? 'slope = ' + round2(MODES[env.kase].fp(env.x0)) : null
                    });
                    return dots;
                }
            },
            {
                kind: 'practice', id: 'u2-core-name-it', title: 'Which function is this the derivative of?',
                when: env => env.named < 0.5,
                items: env => [
                    {
                        q: 'The curve drawn below is the derivative of one of the four functions in this lab, and it has no label. Which function is it the derivative of?',
                        choices: ['sin x', 'cos x', 'eˣ', 'ln x'],
                        a: NAMES.indexOf(env.kase),
                        why: 'The drawn curve is the derivative of ' + envName(env.kase) + ': ' + MODES[env.kase].story,
                        whyBy: NAMES.map(k => (env) => {
                            const shown = env.kase === k
                                ? 'Correct. The drawn curve is the derivative of ' + envName(k) + ': ' + MODES[k].story
                                : 'Not ' + envName(k) + '. Its derivative is ' + MODES[k].rule + ', so compare that shape with the drawn curve.';
                            return shown;
                        })
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'One probe, two readings',
                items: env => {
                    const m = MODES[env.kase];
                    const named = env.named > 0.5;
                    return [
                        { label: named ? envName(env.kase) + ' value' : 'function value', v: m.f(env.x0), color: 'accent' },
                        { label: 'slope measured on the curve', v: derivative(m.f, env.x0), big: true, color: 'up' },
                        { label: named ? 'slope the rule predicts' : 'slope read from the drawn curve', v: m.fp(env.x0), color: 'down' }
                    ];
                }
            },
            {
                kind: 'eq', title: 'The rule being checked',
                when: env => env.named > 0.5,
                lines: env => [
                    { t: MODES[env.kase].claim, hl: true },
                    { t: MODES[env.kase].story, color: 'auxInk' }
                ]
            },
            {
                kind: 'note', tone: 'warn', title: 'The minus sign on cos',
                when: env => env.named > 0.5,
                text: 'The rule the exam relies on is d/dx cos x = −sin x, with the minus. Move the probe a little past 0. The height falls, and the slope reads negative.'
            }
        ]
    },
    steps: [
        {
            params: { kase: 'sin', x0: 1, named: 1 },
            message: 'The height graph of sin x is on top, and its slope curve is drawn below in green. The dots measure the slope directly. Move the probe and read both graphs at the same x.'
        },
        {
            params: { x0: 1.5708 },
            message: 'At x = π/2 = 1.57 sin is at its crest: the height is 1 and the measured slope is about 0. The upper tangent is flat while the lower curve crosses zero, so height and slope answer different questions.'
        },
        {
            params: { kase: 'cos', x0: 1.5708 },
            predict: {
                q: 'At x = π/2 the cosine curve is at 0 and falling steeply. Is its derivative there positive, zero, or negative?',
                choices: [
                    'Negative. It is −sin(π/2), which is −1.',
                    'Zero. The function value is 0 there, so the slope must be 0 too.',
                    'Positive. A curve that passes through 0 must be growing.'
                ], a: 0,
                why: 'Value and slope are separate questions. cos is descending through π/2, so its slope is negative, and the lower curve reads about −1 there.'
            },
            message: 'The probe now sits at π/2 = 1.57 on the cos curve. The green slope reads about −1 there, so the minus sign is visible on the screen instead of something to memorize.'
        },
        {
            params: { kase: 'exp', x0: 0.15 },
            predict: {
                q: 'For eˣ the rule says the slope equals the height at every x. If you move the probe to x = 2, what does the slope read?',
                choices: [
                    'About 7.39. That is the same number as the height.',
                    'Still 1. The slope of eˣ never changes.',
                    'The slope is 2. It follows the new value of x.'
                ], a: 0,
                why: 'Both graphs are the same curve eˣ, so the slope equals the height at every x. At x = 0 both read 1, which is why the tangent there has slope 1.'
            },
            message: 'Slide the probe across and compare the two readout rows: for eˣ they are the same number at every x.'
        },
        {
            params: { kase: 'ln', x0: 0.4 },
            message: 'The function ln x exists only to the right of 0. Close to 0 the ln x curve is very steep, and 1/x is large. Further right, ln x flattens and 1/x falls toward 0.'
        },
        {
            params: { x0: 4 },
            message: 'At x = 4 the slope reads 0.25, which is 1/4. The measured slope and the rule agree. Note that 1/x exists for every nonzero x, even though ln x itself exists only for x > 0.'
        },
        {
            params: { named: 0 },
            message: 'The labels and the rule are hidden now. In the practice card, name the function whose derivative is drawn. Then show the labels again and check your answer.'
        }
    ],
    summary: {
        idea: 'sin gives cos, cos gives −sin, eˣ gives itself, and ln x gives 1/x. Each rule shows up as an agreement you can see: the shape of the function and the size of its slopes match.',
        mistake: 'Students drop the minus sign on cos, or write 1/ln x for the derivative of ln x. In that rule the numerator is the constant 1 and the denominator is x.',
        transfer: 'Set the labels to hidden and name the function whose derivative curve you see. Then show the labels again and check. Repeat until each derivative shape is familiar without a label.'
    }
};

function envName(k) { return { sin: 'sin x', cos: 'cos x', exp: 'eˣ', ln: 'ln x' }[k]; }
function round2(v) { return String(Math.round(v * 100) / 100); }
