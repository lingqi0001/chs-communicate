/* 1.6 Algebraic Limit Repair — an equivalent expression can share the limit
   even when the original formula is undefined at the target. */

const FACTOR = {
    fOrig: (x) => (x === 2 ? NaN : (x * x - 4) / (x - 2)),
    fSimp: (x) => x + 2
};
const CONJ = {
    fOrig: (x) => (x === 4 ? NaN : (Math.sqrt(x + 5) - 3) / (x - 4)),
    fSimp: (x) => 1 / (Math.sqrt(x + 5) + 3)
};

export default {
    id: 'u1-algebraic-repair',
    meta: { unit: 1, topic: '1.6', title: 'Determining Limits Using Algebraic Manipulation', visualizerTitle: 'Algebraic Limit Repair' },
    intro: 'Direct substitution fails on this expression. Find another expression that agrees with it near the target. Both expressions then share one limit.',
    params: { stage: 0 },
    panes: {
        main: [
            {
                kind: 'eq', title: 'Repair sequence',
                lines: env => {
                    if (env.stage < 4) return factorLines(env.stage);
                    if (env.stage < 8) return conjLines(env.stage - 4);
                    return brokenLines(env.stage - 8);
                }
            },
            {
                kind: 'practice', id: 'u16-transfer', title: 'Transfer: lim x→3 (x² − 9)/(x − 3)',
                when: env => env.stage >= 9,
                items: [
                    {
                        q: 'Which first step should you use for lim x→3 (x² − 9)/(x − 3)?',
                        choices: [
                            'Factor the numerator as (x − 3)(x + 3).',
                            'Substitute x = 3 directly.',
                            'Multiply by the conjugate.',
                            'Split the fraction and cancel the 3s.'
                        ], a: 0,
                        whyBy: [
                            'The numerator and the denominator are both 0 at x = 3, so start by factoring. Then x² − 9 = (x − 3)(x + 3), and the shared factor (x − 3) cancels.',
                            'Substituting x = 3 gives (9 − 9)/(3 − 3) = 0/0, which decides nothing. Direct substitution is the check, and factoring is the repair.',
                            'A conjugate removes a square root. This expression has no radical, so there is nothing to rationalize.',
                            'Canceling the 3s treats terms as if they were factors. Only a common factor may cancel.'
                        ]
                    },
                    {
                        q: 'After the shared factor cancels, what value does the repaired expression approach?',
                        choices: ['6', '3', '0', 'The limit does not exist.'], a: 0,
                        whyBy: [
                            'The repaired expression is x + 3 for x ≠ 3. As x approaches 3, the expression x + 3 approaches 6.',
                            '3 is the value that x approaches, not the value the expression approaches. Near x = 3 the expression x + 3 is near 6.',
                            '0 is the numerator at x = 3 before any canceling. That zero is not the limit of the whole quotient.',
                            'The left side and the right side both approach 6, so the limit exists. The original formula is still undefined at x = 3, and that does not change the limit.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'graph', title: 'Original curve and repaired curve', height: 300,
                window: env => env.stage < 4 ? [0, 4.4, -1, 8] : env.stage < 8 ? [1.2, 6.6, -0.2, 1.2] : [-3.4, 5.4, -1.5, 7],
                curves: env => env.stage < 4 ? [
                    { fn: FACTOR.fOrig, label: 'original', color: 'curveA', samples: 300 },
                    { fn: FACTOR.fSimp, label: 'repaired: x + 2', color: 'curveB', dashed: true }
                ] : env.stage < 8 ? [
                    { fn: CONJ.fOrig, label: 'original', color: 'curveA', samples: 300 },
                    { fn: CONJ.fSimp, label: 'repaired', color: 'curveB', dashed: true }
                ] : [
                    { fn: (x) => (x * x + 2) / (x + 2), label: 'correct: (x²+2)/(x+2)', color: 'curveA', samples: 300 },
                    { fn: 'x', label: 'wrong: x', color: 'down', dashed: true }
                ],
                points: env => env.stage < 4 ? [{ x: 2, y: 4, open: true, color: 'auxInk', label: 'hole (2, 4)' }]
                    : env.stage < 8 ? [{ x: 4, y: 1 / 6, open: true, color: 'auxInk', label: 'hole' }]
                        : [{ x: 3, y: 11 / 5, color: 'up', label: 'correct 11/5 = 2.2' }, { x: 3, y: 3, open: true, color: 'down', label: 'wrong value 3' }],
                vlines: env => env.stage >= 4 && env.stage < 8 ? [{ x: 4, color: 'aux', label: 'x = 4' }]
                    : env.stage >= 8 ? [{ x: 3, color: 'auxInk', label: 'x = 3' }] : []
            },
            {
                kind: 'readout', title: 'Values near the target', when: env => env.stage < 8,
                items: env => {
                    const c = env.stage < 4 ? FACTOR : CONJ;
                    const at = env.stage < 4 ? 2 : 4;
                    const x = at + 0.013;
                    return [
                        { label: 'x', v: x },
                        { label: 'original', v: c.fOrig(x), color: 'accent' },
                        { label: 'repaired', v: c.fSimp(x), color: 'aux' },
                        { label: 'original at exactly x = ' + at, v: () => 'no value', color: 'down' }
                    ];
                }
            }
        ]
    },
    steps: [
        { params: { stage: 0 }, message: 'Case 1 uses factoring. Try direct substitution first, before any algebra trick.' },
        { params: { stage: 1 }, message: 'The numerator and the denominator are both 0 at x = 2. A shared factor is hiding there.' },
        {
            params: { stage: 2 },
            predict: {
                q: 'Direct substitution produced the form 0/0. What does the form 0/0 tell you?',
                choices: ['The form 0/0 is indeterminate, so more work is needed.', 'The form 0/0 means the limit is 0.', 'The form 0/0 means the limit does not exist.'], a: 0,
                why: 'The form 0/0 says the formula hides a shared factor. Factor x² − 4 as (x − 2)(x + 2) to expose that factor.'
            },
            message: 'The numerator and the denominator both contain the factor (x − 2). That shared factor is why direct substitution gave 0/0.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'The repaired expression equals x + 2 for every x except 2. Did the repair also give a value to the original function at x = 2?',
                choices: ['No. The repaired expression agrees with the original expression only when x is not 2.', 'Yes. Canceling the shared factor makes f(2) equal to 4.', 'Yes. Canceling the shared factor redefines f(2).'], a: 0,
                why: 'A limit only depends on nearby behavior. The repaired expression matches the original expression near x = 2. The original function is still undefined at exactly x = 2, and choosing f(2) by hand is a separate question.'
            },
            message: 'Cancel the shared factor (x − 2). Substitute x = 2 into the repaired expression x + 2. The limit is 2 + 2 = 4.'
        },
        { params: { stage: 4 }, message: 'Case 2 uses a conjugate. Direct substitution gives (√9 − 3)/(4 − 4) = 0/0 again.' },
        { params: { stage: 5 }, message: 'Multiply the numerator and the denominator by the conjugate √(x + 5) + 3. The difference of squares then clears the radical from the numerator.' },
        { params: { stage: 6 }, message: 'The numerator becomes x − 4, and that factor cancels the x − 4 in the denominator. In the graph the two curves coincide everywhere except at the hole.' },
        { params: { stage: 7 }, message: 'Substitute x = 4 into the repaired expression 1/(√(x + 5) + 3). That gives 1/(√9 + 3) = 1/6. One idea covers both cases: rewrite the expression near the target, then substitute.' },
        { params: { stage: 8 }, message: 'A common mistake is canceling terms instead of factors. Compare the two results at x = 3 in the sequence panel and in the graph.' },
        { params: { stage: 9 }, message: 'Canceling the 2s invents a new function that fails to agree with the original near x = 3. Only a common factor may be canceled, and only because x never equals the target.' }
    ],
    summary: {
        idea: 'Algebraic manipulation reveals the behavior near the target. Equivalent expressions share one limit, even when the original formula has no value at the target.',
        mistake: 'Students cancel terms instead of factors. The expression (x² + 2)/(x + 2) does not become x, because its numerator is a sum and not a product.',
        transfer: 'The transfer panel appears at the end of the lesson. For lim x→3 (x² − 9)/(x − 3), choose the first step and the value the expression approaches.'
    }
};

function factorLines(stage) {
    const L = [
        { t: 'lim x→2 (x² − 4)/(x − 2)', hl: stage === 0 }
    ];
    if (stage >= 1) L.push({ t: 'Substitute x = 2: (4 − 4)/(2 − 2) = 0/0', rule: 'indeterminate form', hl: stage === 1 });
    if (stage >= 2) L.push({ t: 'Factor: (x − 2)(x + 2) / (x − 2)', rule: 'difference of squares', hl: stage === 2 });
    if (stage >= 3) L.push({ t: 'When x ≠ 2 this equals x + 2', rule: 'cancel the shared factor', hl: stage === 3 });
    L.push({ t: 'lim = 2 + 2 = 4', hl: false, dim: stage < 3 });
    return L;
}
function conjLines(rel) {
    const L = [
        { t: 'lim x→4 (√(x+5) − 3)/(x − 4)', hl: rel === 0 }
    ];
    if (rel >= 1) L.push({ t: 'Multiply by (√(x+5) + 3)/(√(x+5) + 3)', rule: 'conjugate', hl: rel === 1 });
    if (rel >= 2) L.push({ t: 'This gives (x + 5 − 9) / [ (x−4)(√(x+5)+3) ]', rule: 'difference of squares', hl: rel === 2 });
    if (rel >= 3) L.push({ t: 'When x ≠ 4 this equals 1/(√(x+5) + 3)', rule: 'cancel x − 4', hl: rel === 3 });
    L.push({ t: 'lim = 1/6', dim: rel < 3 });
    return L;
}
function brokenLines(rel) {
    return [
        { t: 'Correct function: (x² + 2)/(x + 2)', color: 'up', hl: rel === 0 },
        { t: 'At x = 3 this gives (9 + 2)/(3 + 2) = 11/5 = 2.2', color: 'up' },
        { t: 'Wrong canceling of the 2s: x² / x = x', color: 'down', hl: rel === 1 },
        { t: 'The wrong version gives 3 at x = 3, and the two expressions disagree everywhere near x = 3.', color: 'down' }
    ];
}
