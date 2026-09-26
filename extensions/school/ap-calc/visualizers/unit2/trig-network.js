/* 2.10 Trig Derivative Network — the four later trig derivatives are not new
   facts: each one is rebuilt from an identity, the quotient rule and the
   derivatives of sin and cos.
   The graph window follows the selected function: the x domain is kept inside
   the range where f and f' stay finite and readable, and the y bounds are
   sampled from both curves, so the derivative curve and its probe point can
   never fall outside the drawn viewport. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const NET = {
    tan: {
        label: 'tan x', orig: 'sin/cos', result: 'sec² x',
        f: (x) => Math.tan(x), fp: (x) => 1 / (Math.cos(x) * Math.cos(x)),
        dom: [0.3, 1.15],
        identity: 'tan x = sin x / cos x',
        stepsL: [
            { t: 'u = sin x,  v = cos x', rule: 'quotient form' },
            { t: 'u′ = cos x,  v′ = −sin x', rule: 'core rules from 2.7' },
            { t: '(u′v − uv′)/v²', rule: 'quotient rule' },
            { t: '= (cos·cos − sin·(−sin))/cos²', hl: true },
            { t: '= (cos² + sin²)/cos²', rule: 'subtracting a negative leaves a sum', hl: true },
            { t: '= 1/cos² = sec² x', rule: 'Pythagorean identity', hl: true }
        ],
        predictQ: 'After substituting, the numerator is cos² x + sin² x. What does that expression simplify to?',
        predictChoices: ['1. The Pythagorean identity turns cos² x + sin² x into 1.', '0. The two terms cancel each other in the subtraction.', 'cos² x · sin² x. The two squared terms multiply here.'],
        predictA: 0,
        predictWhy: 'sin² x + cos² x equals 1 for every value of x, so the numerator becomes 1. The derivative is then 1/cos² x, which is sec² x. The result is always positive, and this matches the graph: tan x rises between its asymptotes.',
        quizChoices: ['sec² x', '−csc² x', 'sec x · tan x'], quizA: 0,
        quizWhy: 'The numerator simplifies to 1 and the denominator is cos² x, so the derivative is 1/cos² x = sec² x.',
        domain: 'tan x is undefined where cos x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'tan x (blue) only rises, and its derivative sec² x (green) stays above 0 across the whole screen. The two curves show the same sign.'
    },
    cot: {
        label: 'cot x', orig: 'cos/sin', result: '−csc² x',
        f: (x) => 1 / Math.tan(x), fp: (x) => -1 / (Math.sin(x) * Math.sin(x)),
        dom: [0.55, 1.4],
        identity: 'cot x = cos x / sin x',
        stepsL: [
            { t: 'u = cos x,  v = sin x', rule: 'quotient form' },
            { t: 'u′ = −sin x,  v′ = cos x', rule: 'core rules from 2.7' },
            { t: '(−sin·sin − cos·cos)/sin²', hl: true },
            { t: '= −(sin² + cos²)/sin²', rule: 'both parts share one minus sign' },
            { t: '= −csc² x', hl: true }
        ],
        predictQ: 'The numerator of the derivative of cot x is −sin² x − cos² x. What sign can this derivative have?',
        predictChoices: ['Negative. The derivative stays negative wherever cot x is defined.', 'Positive. The quantity csc² x is positive, so the derivative is positive too.', 'Either sign. The quadrant that x sits in decides which sign appears.'],
        predictA: 0,
        predictWhy: 'Factoring out the minus gives −(sin² x + cos² x)/sin² x = −1/sin² x = −csc² x. Since csc² x is positive, the derivative is always negative, which is what a falling curve needs.',
        quizChoices: ['−csc² x', 'csc² x', '−csc x · cot x'], quizA: 0,
        quizWhy: 'The identity makes the numerator −1, and the denominator is sin² x, so the result is −1/sin² x = −csc² x.',
        domain: 'cot x is undefined where sin x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'cot x (blue) falls wherever it is defined, and its derivative −csc² x (green) sits below the axis for the same reason.'
    },
    sec: {
        label: 'sec x', orig: '1/cos', result: 'sec x · tan x',
        f: (x) => 1 / Math.cos(x), fp: (x) => Math.sin(x) / (Math.cos(x) * Math.cos(x)),
        dom: [0.3, 1.15],
        identity: 'sec x = 1 / cos x',
        stepsL: [
            { t: 'u = 1,  v = cos x', rule: 'the numerator is a constant' },
            { t: 'u′ = 0,  v′ = −sin x' },
            { t: '(0·cos − 1·(−sin))/cos²', hl: true },
            { t: '= sin/cos² = (1/cos)·(sin/cos)', rule: 'split one factor' },
            { t: '= sec x · tan x', hl: true }
        ],
        predictQ: 'The graph shows sec x, which equals 1 / cos x. On the visible branch, is the derivative of sec x positive or negative?',
        predictChoices: [
            'Positive. The two minus signs cancel, and this branch of sec x is rising.',
            'Negative. The derivative of cos x is −sin x, so the minus sign survives.',
            'It changes sign. The graph shows no single sign for the whole branch.'
        ],
        predictA: 0,
        predictWhy: 'The quotient rule subtracts u·v′, and v′ is −sin x, so −(−sin x) becomes +sin x. On the drawn branch x lies between 0 and π/2, so sin x is positive and sec x rises. Written as sec x · tan x, the sign still follows from the two factors.',
        quizChoices: ['sec x · tan x', '−sec x · tan x', 'sec² x'], quizA: 0,
        quizWhy: 'Only sin x / cos² x is left. Splitting one factor cos x into 1/cos x and sin x/cos x gives sec x · tan x.',
        domain: 'sec x is undefined where cos x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'The screen shows the rising side of one branch of sec x. sec x (blue) climbs and sec x · tan x (green) stays positive. Both curves grow as x moves toward π/2, where sec x is undefined.'
    },
    csc: {
        label: 'csc x', orig: '1/sin', result: '−csc x · cot x',
        f: (x) => 1 / Math.sin(x), fp: (x) => -Math.cos(x) / (Math.sin(x) * Math.sin(x)),
        dom: [0.55, 1.4],
        identity: 'csc x = 1 / sin x',
        stepsL: [
            { t: 'u = 1,  v = sin x', rule: 'the numerator is a constant' },
            { t: 'u′ = 0,  v′ = cos x' },
            { t: '(0·sin − 1·cos)/sin²', hl: true },
            { t: '= −cos/sin² = −(1/sin)·(cos/sin)' },
            { t: '= −csc x · cot x', hl: true }
        ],
        predictQ: 'The derivative of csc x keeps a minus sign, but the derivative of sec x does not. Where does this difference come from?',
        predictChoices: [
            'The difference comes from the term v′. The derivative of sin x is cos x, while the derivative of cos x is −sin x.',
            'The difference comes from the order of the definitions. The function csc x follows sec x in the list.',
            'The difference is only a memorized convention. The minus sign in the derivative of csc x has no reason behind it.'
        ],
        predictA: 0,
        predictWhy: 'In both cases u′ = 0, so the numerator is the single term −v′ over v². For csc x that term is −cos x, and for sec x it is −(−sin x), which turns positive. The signs come from the quotient rule, not from a table.',
        quizChoices: ['−csc x · cot x', 'csc x · cot x', '−csc² x'], quizA: 0,
        quizWhy: 'The numerator is −cos x over sin² x. Splitting one factor sin x into 1/sin x and cos x/sin x gives −csc x · cot x.',
        domain: 'csc x is undefined where sin x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'On this branch csc x (blue) falls toward 1, and −csc x · cot x (green) stays below the axis. The signs of the two curves agree across the whole branch.'
    }
};

function probeIn(env) {
    const dom = NET[env.kase].dom;
    return Math.min(Math.max(env.x0, dom[0]), dom[1]);
}

/* Sample both curves across the drawn domain and wrap the y bounds around
   them, so neither the derivative curve nor the probe point can land off
   screen the way a fixed window used to hide −csc² and −csc·cot. */
function windowFor(env) {
    const n = NET[env.kase];
    const [a, b] = n.dom;
    let lo = 0, hi = 0;
    for (let i = 0; i <= 160; i++) {
        const x = a + (b - a) * i / 160;
        [n.f(x), n.fp(x)].forEach(y => {
            if (Number.isFinite(y)) {
                lo = Math.min(lo, y);
                hi = Math.max(hi, y);
            }
        });
    }
    const pad = Math.max(0.3, (hi - lo) * 0.08);
    return [a, b, lo - pad, hi + pad];
}

export default {
    id: 'u2-trig-network',
    meta: { unit: 2, topic: '2.10', title: 'Finding the Derivatives of Tangent, Cotangent, Secant, and/or Cosecant Functions', visualizerTitle: 'Trig Derivative Network' },
    intro: 'These four formulas are not new facts. Each one comes from an identity, the quotient rule, and the derivatives of sin x and cos x.',
    params: { kase: 'tan', x0: 0.6, reveal: 1 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: Object.keys(NET).map(k => ({ v: k, label: NET[k].label }))
        },
        { key: 'x0', label: 'probe x', min: 0.3, max: 1.15, step: 0.01, when: env => env.kase === 'tan' || env.kase === 'sec' },
        { key: 'x0', label: 'probe x', min: 0.55, max: 1.4, step: 0.01, when: env => env.kase === 'cot' || env.kase === 'csc' },
        {
            key: 'reveal', label: 'finished formula', kind: 'choice',
            options: [{ v: 1, label: 'shown' }, { v: 0, label: 'hidden' }]
        }
    ],
    fns: {
        f: (x, env) => NET[env.kase].f(x),
        fp: (x, env) => NET[env.kase].fp(x)
    },
    compute: (env) => {
        const n = NET[env.kase];
        const x0 = probeIn(env);
        const measured = derivative(n.f, x0);
        const claimed = n.fp(x0);
        return { x0, measured, claimed, diff: Math.abs(measured - claimed) };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => NET[env.kase].label + ' and its derivative', height: 300,
                window: env => windowFor(env),
                curves: env => {
                    const out = [{ fn: 'f', color: 'curveA', label: NET[env.kase].label }];
                    if (env.reveal) out.push({ fn: 'fp', color: 'curveC', label: 'derivative', dashed: true });
                    return out;
                },
                points: env => {
                    const out = [{ x: env.x0, fn: 'f', color: 'accent', label: 'x₀' }];
                    if (env.reveal) out.push({ x: env.x0, fn: 'fp', color: 'up' });
                    return out;
                },
                vlines: env => [{ x: env.x0, color: 'auxInk', dash: false }]
            },
            {
                kind: 'eq', title: 'Derivation line by line',
                lines: env => {
                    const n = NET[env.kase];
                    const lines = [{ t: n.identity, rule: 'start here', hl: true }].concat(n.stepsL);
                    return env.reveal ? lines : lines.slice(0, lines.length - 1);
                }
            },
            {
                kind: 'practice', id: 'u2-trig-rebuild', title: 'Rebuild the hidden formula',
                when: env => !env.reveal,
                items: env => {
                    const n = NET[env.kase];
                    return [{
                        q: n.identity + '. The final line is hidden. Which formula belongs at the end?',
                        choices: n.quizChoices, a: n.quizA,
                        why: n.quizWhy + ' Set the finished formula control back to shown to see the derivative curve.'
                    }];
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'At the probe point',
                items: env => {
                    const n = NET[env.kase];
                    const rows = [
                        { label: n.label, v: n.f(env.x0), color: 'accent' },
                        { label: 'slope measured on the curve', v: env.measured, big: true, color: 'up' }
                    ];
                    /* the formula row would name the answer the practice card asks for */
                    if (env.reveal) {
                        rows.push({ label: 'slope from ' + n.result, v: env.claimed, color: 'down' });
                        rows.push({ label: 'difference', v: env.diff, digits: 4 });
                    }
                    return rows;
                }
            },
            { kind: 'note', title: 'What the graph shows', text: env => NET[env.kase].graphNote },
            { kind: 'note', tone: 'warn', title: 'Domain restriction', text: env => NET[env.kase].domain }
        ]
    },
    steps: [
        {
            params: { kase: 'tan', x0: 0.6 },
            predict: {
                q: NET.tan.predictQ,
                choices: NET.tan.predictChoices, a: NET.tan.predictA, why: NET.tan.predictWhy
            },
            message: 'Read tan x as the quotient sin x / cos x. Apply the quotient rule, then let the Pythagorean identity finish the simplification.'
        },
        { params: { kase: 'cot' }, message: 'The derivative of cot x uses the same calculation with cos x on top. Only the final sign comes out different.' },
        {
            params: { kase: 'cot', x0: 0.9 },
            predict: {
                q: NET.cot.predictQ, choices: NET.cot.predictChoices, a: NET.cot.predictA, why: NET.cot.predictWhy
            },
            message: 'Check the derivation against the probe point. The curve of cot x falls, so the slope measured on that curve must be negative.'
        },
        { params: { kase: 'sec' }, message: 'For sec x the numerator is the constant 1, and the derivative of a constant is 0. The first term of the quotient rule therefore drops out.' },
        {
            params: { kase: 'sec', x0: 0.9 },
            predict: {
                q: NET.sec.predictQ, choices: NET.sec.predictChoices, a: NET.sec.predictA, why: NET.sec.predictWhy
            },
            message: 'The last step factors 1/cos² x into (1/cos x)·(sin x/cos x). Writing the result as sec x · tan x is the form the exam expects.'
        },
        {
            params: { kase: 'csc', x0: 1 },
            predict: {
                q: NET.csc.predictQ, choices: NET.csc.predictChoices, a: NET.csc.predictA, why: NET.csc.predictWhy
            },
            message: 'All four formulas follow one pattern. If the exam asks for a derivative you forgot, rebuild it from the identity instead of guessing.'
        }
    ],
    summary: {
        idea: [
            env => 'The derivation on this screen ends with ' + NET[env.kase].result + ', which is the derivative of ' + NET[env.kase].label + '.',
            'All four formulas come from an identity, the quotient rule, and the derivatives of sin x and cos x. None of them needs to be memorized as a separate fact.'
        ],
        mistake: 'Sec′ = tan x leaves out the factor sec x. The minus on cot′ or csc′ disappears when you skip the sign step. Write that sign step out in full.',
        transfer: 'Set the finished formula control to hidden, answer the practice question, then set it back to shown and check. Say where the minus sign in the derivative of csc x first appears, and explain why that sign cannot be removed.'
    }
};
