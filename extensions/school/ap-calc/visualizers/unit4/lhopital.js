/* 4.7 Indeterminate Form Resolver. L'Hospital's Rule is a theorem with an
   entry condition: the quotient must really be 0/0 or ∞/∞ at the point.
   Drag x toward the point, watch f and g collapse together, and the
   checklist reports the form. */

const ZERO = 0.06;
const HUGE = 4;

const MODES = {
    A: {
        label: 'sin x / x  ·  x → 0', kind: 'zero',
        f: x => Math.sin(x), g: x => x,
        fLabel: 'sin x', gLabel: 'x',
        fp: x => Math.cos(x), gp: x => 1,
        fpStr: 'cos x', gpStr: '1',
        c: 0, xFrom: -6.5, xTo: 6.5, yFrom: -1.4, yTo: 1.4,
        answer: 1
    },
    B: {
        label: '(x − 1) / (x² + x − 2)  ·  x → 1', kind: 'zero',
        f: x => x - 1, g: x => x * x + x - 2,
        fLabel: 'x − 1', gLabel: 'x² + x − 2',
        fp: x => 1, gp: x => 2 * x + 1,
        fpStr: '1', gpStr: '2x + 1',
        c: 1, xFrom: -1.5, xTo: 3.5, yFrom: -2.2, yTo: 3.2,
        answer: 1 / 3
    },
    C: {
        label: 'x / eˣ  ·  x → +∞', kind: 'inf',
        f: x => x, g: x => Math.exp(Math.min(x, 6)),
        fLabel: 'x', gLabel: 'eˣ',
        fp: x => 1, gp: x => Math.exp(Math.min(x, 6)),
        fpStr: '1', gpStr: 'eˣ',
        c: 9, xFrom: -0.5, xTo: 10, yFrom: -2, yTo: 12,
        answer: 0
    },
    D: {
        label: '5 / x  ·  x → 0', kind: 'zero',
        f: x => 5, g: x => x,
        fLabel: '5', gLabel: 'x',
        fp: x => 0, gp: x => 1,
        fpStr: '0', gpStr: '1',
        c: 0, xFrom: -3, xTo: 3, yFrom: -7, yTo: 7,
        answer: null
    }
};

function modeDef(key) {
    const m = MODES[key];
    const quotient = x => { const gv = m.g(x); return Math.abs(gv) < 1e-9 ? NaN : m.f(x) / gv; };
    const ratio = x => { const gv = m.gp(x); return Math.abs(gv) < 1e-9 ? NaN : m.fp(x) / gv; };
    const quotientRule = x => {
        const gv = m.g(x);
        if (Math.abs(gv) < 1e-9) return NaN;
        return (gv * m.fp(x) - m.f(x) * m.gp(x)) / (gv * gv);
    };

    return {
        label: m.label,
        params: { x: key === 'C' ? 1 : key === 'B' ? 2.6 : key === 'D' ? 2.4 : 4, gate: false },
        compute: (env) => {
            const x = Math.min(Math.max(env.x, m.xFrom), m.xTo);
            const fx = m.f(x), gx = m.g(x);
            const atPoint = Math.abs(x - m.c) < (m.kind === 'inf' ? 0.8 : 0.12);
            const numZero = Math.abs(fx) < ZERO;
            const denZero = Math.abs(gx) < ZERO;
            const numHuge = Math.abs(fx) > HUGE;
            const denHuge = Math.abs(gx) > HUGE;
            const form = m.kind === 'inf' ? (numHuge && denHuge) : (numZero && denZero);
            const entry = m.kind === 'inf' ? (numHuge && denHuge && atPoint) : (numZero && denZero && atPoint);
            return {
                x, fx, gx, atPoint, numZero, denZero, numHuge, denHuge, form, entry,
                barW: 0.34, opened: env.gate === true
            };
        },
        controls: [
            { key: 'x', label: 'x', min: m.xFrom, max: m.xTo, step: 0.01 }
        ],
        panes: {
            main: [
                {
                    kind: 'graph', title: env => m.kind === 'inf'
                        ? 'Drag x to larger values. Watch f = ' + m.fLabel + ' and g = ' + m.gLabel + '.'
                        : 'Drag x toward x = ' + m.c + '. Watch f = ' + m.fLabel + ' and g = ' + m.gLabel + '.', height: 330,
                    window: [m.xFrom, m.xTo, m.yFrom, m.yTo],
                    curves: (env) => [
                        { fn: x => m.f(x), color: 'curveA', label: 'f', width: 1.8, dashed: true },
                        { fn: x => m.g(x), color: 'curveB', label: 'g', width: 1.8, dashed: true }
                    ],
                    areas: (env) => [
                        { fn: (x, e) => e.fx, from: env.x - env.barW, to: env.x - 0.04, baseline: 0, color: 'fillA' },
                        { fn: (x, e) => e.gx, from: env.x + 0.04, to: env.x + env.barW, baseline: 0, color: 'fillB' }
                    ],
                    hlines: (env) => [{ y: 0, color: 'auxInk' }],
                    vlines: (env) => m.kind === 'inf' ? [] : [{
                        x: m.c, color: env.atPoint ? 'ink' : 'auxInk', dash: !env.atPoint,
                        label: env => env.atPoint ? 'x = ' + m.c : 'x approaches ' + m.c
                    }],
                    points: (env) => [
                        { x: env.x, y: env.fx, color: 'curveA', label: env => 'f = ' + r2(env.fx) },
                        { x: env.x, y: env.gx, color: 'curveB', label: env => 'g = ' + r2(env.gx) },
                        { x: env.x, y: 0, color: 'ink', drag: { key: 'x', min: m.xFrom, max: m.xTo } }
                    ],
                    notes: env => [
                        { x: m.xFrom + 0.2, y: m.yTo * 0.9, t: env => env.entry
                            ? (m.kind === 'inf' ? 'Both grow without bound: the form is ∞/∞.' : 'Both approach 0, so substitution gives the indeterminate form 0/0.')
                            : env.form
                                ? (m.kind === 'inf' ? 'The form is ∞/∞, but x has not reached large values.' : 'Both are near 0, but x has not reached ' + m.c + '.')
                                : (m.kind === 'inf' ? 'Not ∞/∞ yet.' : 'Not 0/0 yet.')
                        }
                    ]
                },
                {
                    kind: 'checklist', title: 'Does L’Hospital’s Rule apply?',
                    items: env => m.kind === 'inf' ? [
                        { t: 'The numerator f grows without bound', state: env.numHuge },
                        { t: 'The denominator g grows without bound', state: env.denHuge }
                    ] : [
                        { t: 'The numerator f approaches 0', state: env.numZero },
                        { t: 'The denominator g approaches 0', state: env.denZero }
                    ],
                    verdict: env => formVerdict(key, m, env),
                    verdictOk: env => env.entry && m.answer !== null
                },
                {
                    kind: 'graph', title: 'The quotient, the ratio of derivatives, and the quotient rule', height: 330,
                    when: env => env.opened,
                    window: [m.xFrom, m.xTo, m.yFrom, m.yTo],
                    curves: (env) => [
                        { fn: x => quotient(x), color: 'curveA', label: 'f/g, the limit we want' },
                        { fn: x => ratio(x), color: 'curveC', label: "f′/g′, the ratio of derivatives (L’Hospital)" },
                        { fn: x => quotientRule(x), color: 'down', label: '(f/g)′, the quotient rule', dashed: true }
                    ],
                    hlines: (env) => m.answer === null ? [] : [{ y: m.answer, color: 'auxInk', label: 'the limit is ' + r2(m.answer) }],
                    vlines: (env) => m.kind === 'inf' ? [] : [{ x: m.c, color: 'ink' }],
                    notes: env => [{ x: m.xFrom + 0.2, y: m.yTo * 0.86, t: env => m.answer === null ? 'The three curves disagree because the quotient has no limit here'
                        : (m.kind === 'inf' ? 'f′/g′ follows the quotient f/g as x grows. ' : 'f′/g′ follows the quotient f/g near x = ' + m.c + '. ')
                          + 'The quotient-rule curve is the derivative of the quotient, a different question.' }]
                },
                {
                    kind: 'eq', title: 'Applying the rule', when: env => env.opened,
                    lines: m.answer === null ? [
                        { t: 'For 5/x at 0: +∞ from the right and −∞ from the left, so the limit does not exist', hl: true },
                        { t: "f′/g′ = 0/1 = 0. The rule does not apply here, so this 0 is wrong", color: 'down' }
                    ] : [
                        { t: "f′/g′ = " + m.fpStr + ' / ' + m.gpStr },
                        { t: 'lim ' + m.label.split('  ·  ')[0] + ' = ' + r2(m.answer), hl: true, rule: 'after checking the form' }
                    ]
                }
            ]
        },
        steps: stepsFor(key, m),
        summary: summaries[key]
    };
}

function formVerdict(key, m, env) {
    if (key === 'D') return 'Doesn’t apply. f stays at 5 while g approaches 0, so the quotient is never 0/0.';
    if (env.entry) return 'L’Hospital’s Rule applies. ' + (m.kind === 'inf' ? 'As x grows, f and g both grow without bound: the form is ∞/∞.' : 'At x = ' + m.c + ', f and g both approach 0: the form is 0/0.');
    if (m.kind === 'inf') {
        if (env.form) return 'Both grow without bound, so this is an ∞/∞ form. But x has not reached large values yet.';
        return env.numHuge || env.denHuge ? 'Not ∞/∞ yet. Only one of f and g is unbounded so far.' : 'Not ∞/∞ yet. Neither f nor g has grown without bound.';
    }
    if (env.numZero && env.denZero) return 'Both approach 0, so this is a 0/0 indeterminate form. But x has not reached ' + m.c + '.';
    return 'Not 0/0 yet. At least one of the two values is still away from 0.';
}

function stepsFor(key, m) {
    if (key === 'D') return [
        {
            params: { x: 2.4, gate: false },
            message: 'Drag x toward 0. Watch f and g. One of them will not shrink.'
        },
        {
            params: { x: 0.06, gate: false },
            predict: {
                q: 'Substitution gives 5/0. Should L’Hospital’s Rule be applied to this limit?',
                choices: ['No. The form is not 0/0 or ∞/∞.', 'Yes. The quotient 5/x is a fraction.', 'Yes. It works only from the right side of 0.'], a: 0,
                why: 'Substitution gives 5/0. f stays at 5 instead of approaching 0, so the form is not indeterminate and the rule does not apply. The limit itself does not exist: 5/x approaches +∞ from the right and −∞ from the left.'
            },
            message: 'Keep going and see what differentiating without checking would have produced.'
        },
        {
            params: { x: 0.06, gate: true },
            message: 'There it is. Differentiating without checking gives 0, and 0 is wrong. Being a fraction is not a reason to use the rule.'
        }
    ];
    const drag = {
        params: { gate: false },
        message: key === 'C'
            ? 'Drag x to the right. Watch f = x and g = eˣ grow without bound, and read the checklist as you go.'
            : 'Drag x toward ' + m.c + '. Watch f and g: the rule applies only when both approach 0 as x approaches ' + m.c + '.'
    };
    const commit = {
        params: { gate: false },
        message: m.kind === 'inf'
            ? 'f and g both run off the top of the window together. Read the checklist, then answer.'
            : 'f and g both approach 0 as x approaches ' + m.c + '. Read the checklist, then answer.'
    };
    const open = { params: { gate: true }, message: '' };

    if (key === 'A') {
        commit.predict = {
            q: 'As x approaches 0, both sin x and x approach 0. Does that mean the limit is 0?',
            choices: ['No. 0/0 is indeterminate, so we need another method.', 'Yes. If both parts approach 0, the quotient must also approach 0.', 'No. 0/0 means the limit does not exist.'], a: 0,
            why: '0/0 does not tell us the value of the limit. It tells us the quotient is indeterminate, so this is a situation where L’Hospital’s Rule may apply. Two quotients can both read 0/0 at a point and still have different limits, so we need another method.'
        };
        open.predict = {
            q: 'We have a 0/0 indeterminate form. What should we examine next?',
            choices: ["f′(x) / g′(x), the two derivatives taken separately", 'the quotient-rule derivative of f(x)/g(x)', 'f′(x) · g′(x), the product of the two derivatives'], a: 0,
            why: "L’Hospital’s Rule tells us to take the limit of f′(x)/g′(x). It does not ask us to differentiate the quotient using the quotient rule. On the graph, f′/g′ = cos x follows the quotient f/g near x = 0 and settles on 1. The quotient-rule curve is the derivative of the quotient, a different question."
        };
        open.message = 'lim sin x / x = lim cos x / 1 = 1, which is what the picture has been showing all along.';
    }
    if (key === 'B') {
        commit.predict = {
            q: 'The derivatives here are f′ = 1 and g′ = 2x + 1. After one pass the new quotient is 1/(2x + 1). Is it still indeterminate at x = 1?',
            choices: ['No. At x = 1, f′ = 1 and g′ = 3, so the fraction reads 1/3. That is an ordinary value.', 'Yes. Run the rule a second time to be safe', 'Yes. First factor the denominator again'], a: 0,
            why: 'The rule may be applied again only when the new quotient is still indeterminate after substitution. Here 1/(2·1+1) = 1/3 is ordinary arithmetic. Checking the form a second time is what stops you from differentiating again.'
        };
        open.message = 'Check the form, apply the rule, then check the form again. The last step used no theorem at all.';
    }
    if (key === 'C') {
        commit.predict = {
            q: 'As x grows, both f = x and g = eˣ grow without bound. Does L’Hospital’s Rule accept the form ∞/∞?',
            choices: ['Yes. The rule accepts 0/0 and ∞/∞', 'No. Only the form 0/0 qualifies', 'Yes. It works only when the point is 0'], a: 0,
            why: 'The form ∞/∞ does qualify. The rule turns x/eˣ into 1/eˣ, which approaches 0, so the original limit is 0. Two quantities growing without bound is exactly the situation L’Hospital’s Rule is built for.'
        };
        open.message = 'lim x/eˣ = lim 1/eˣ = 0. The exponential grows faster than x, and the rule turns that comparison into a number.';
    }
    return [drag, commit, open];
}

const summaries = {
    A: {
        idea: 'L’Hospital’s Rule only applies after you check the form. Verify 0/0 or ∞/∞ first, then look at the ratio of the derivatives, not the derivative of the ratio.',
        mistake: 'Seeing a fraction and differentiating top and bottom. The limit of 5/x at 0 never qualifies: that limit does not exist, and f′/g′ = 0/1 would give 0.',
        transfer: 'Say yes or no, and give a reason, for each of two limits. The first is (x² − 1)/(x − 1) as x approaches 1. The second is (x² + 1)/(x − 1) as x approaches 1.'
    },
    B: {
        idea: 'Check the form again after one application. If the new quotient is still indeterminate, the rule may be applied once more. If it gives a number, just substitute.',
        mistake: 'Applying the rule a second time out of habit. At x = 1, 1/(2x+1) is ordinary arithmetic, and differentiating again would be wrong.',
        transfer: 'Say in one sentence why the second pass needs no theorem.'
    },
    C: {
        idea: 'The form ∞/∞ is the second indeterminate form the rule accepts. eˣ grows faster than x, and the rule makes that precise. x/eˣ becomes 1/eˣ, which approaches 0.',
        mistake: 'Reading ∞/∞ as 1. Two quantities can both grow without bound and still have any limit at all. x/eˣ is ∞/∞ and its limit is 0.',
        transfer: 'Do not compute. Does the limit of x²/eˣ as x approaches ∞ qualify for the rule? If it does, what does the rule turn it into?'
    },
    D: {
        idea: 'In this topic the most valuable answer is sometimes “do not use the rule.” L’Hospital’s Rule applies only to quotients in the form 0/0 or ∞/∞.',
        mistake: 'Applying the rule to any fraction. At 0 the graph of 5/x has a vertical asymptote, the rule gives 0, and 0 is a false statement about a limit that does not exist.',
        transfer: 'Look at each limit and name its form. The three are (x² − 1)/(x − 1) at x = 1, then 5/x at x = 0, then x/eˣ as x approaches ∞. Which of them qualify for the rule?'
    }
};

export default {
    id: 'u4-lhopital',
    meta: { unit: 4, topic: '4.7', title: 'Using L’Hospital’s Rule for Determining Limits of Indeterminate Forms', visualizerTitle: 'Indeterminate Form Resolver' },
    modes: [modeDef('A'), modeDef('B'), modeDef('C'), modeDef('D')]
};

function r2(v) { return String(Math.round(v * 100) / 100); }
