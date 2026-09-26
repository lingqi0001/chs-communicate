/* 1.11 Continuity Checkpoint — continuity at a point is a THREE-part AND.
   Every part inspectable, none green by default. */

export default {
    id: 'u1-continuity-point',
    meta: { unit: 1, topic: '1.11', title: 'Defining Continuity at a Point', visualizerTitle: 'Continuity Checkpoint' },
    intro: 'Continuity at a point needs three conditions, and all three must hold. Set the left-hand limit, the right-hand limit, and the value of f(2), then test each condition on its own.',
    params: { L: 3, R: 3, k: 5, defined: 1 },
    controls: [
        { key: 'L', label: 'left-hand limit', min: 0, max: 6, step: 0.1 },
        { key: 'R', label: 'right-hand limit', min: 0, max: 6, step: 0.1 },
        { key: 'k', label: 'value of f(2)', min: 0, max: 6, step: 0.1, when: env => env.defined > 0.5 },
        {
            key: 'defined', label: 'f(2) exists?', kind: 'choice',
            options: [{ v: 1, label: 'yes' }, { v: 0, label: 'no, undefined' }]
        }
    ],
    fns: {
        f: (x, env) => x < 2 ? env.L - 0.8 * (2 - x) : env.R + 0.8 * (x - 2)
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x) at the checkpoint x = 2', height: 340,
                window: [-0.2, 4.2, -0.5, 7],
                curves: [{ fn: 'f', color: 'curveA', label: 'f' }],
                vlines: [{ x: 2, color: 'aux', label: 'x = 2' }],
                points: env => {
                    const out = [];
                    if (Math.abs(env.L - env.R) > 1e-9) {
                        out.push({ x: 2, y: env.L, open: true, color: 'up', label: 'from left' });
                        out.push({ x: 2, y: env.R, open: true, color: 'down', label: 'from right' });
                    } else {
                        out.push({ x: 2, y: env.L, open: true, color: 'auxInk', label: 'both sides' });
                    }
                    if (env.defined > 0.5) out.push({ x: 2, y: env.k, color: 'ink', label: 'f(2)', drag: { key: 'k', min: 0, max: 6 } });
                    return out;
                }
            },
            {
                kind: 'eq', title: 'The three conditions in order',
                lines: [
                    { t: '① f(2) is defined' },
                    { t: '② lim x→2 f(x) exists' },
                    { t: '③ lim x→2 f(x) = f(2)' },
                    { t: 'Continuity at x = 2 needs conditions ①, ②, and ③ all at once', rule: 'all three', hl: true }
                ]
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'Condition board',
                items: env => {
                    const lim = Math.abs(env.L - env.R) < 1e-9 ? env.L : null;
                    return [
                        { t: '① The value f(2) exists' + (env.defined > 0.5 ? ' (= ' + round1(env.k) + ')' : ''), state: env.defined > 0.5 },
                        { t: '② The limit lim x→2 f(x) exists' + (lim !== null ? ' (= ' + round1(lim) + ')' : ', the two sides differ'), state: lim !== null },
                        { t: '③ The limit equals the value f(2)', state: lim !== null && env.defined > 0.5 && Math.abs(lim - env.k) < 1e-9 }
                    ];
                },
                verdict: env => {
                    const lim = Math.abs(env.L - env.R) < 1e-9 ? env.L : null;
                    return verdictWord(lim, env);
                },
                verdictOk: env => {
                    const lim = Math.abs(env.L - env.R) < 1e-9 ? env.L : null;
                    return lim !== null && env.defined > 0.5 && Math.abs(lim - env.k) < 1e-9;
                }
            }
        ]
    },
    steps: [
        {
            params: { L: 3, R: 3, k: 5, defined: 1 },
            predict: {
                q: 'Both sides approach 3, and f(2) = 5. Which of the three continuity conditions fails?',
                choices: ['Condition 3 fails. The limit exists and f(2) exists, but the limit 3 is not equal to f(2) = 5.', 'Condition 2 fails. The limit does not exist, because the two sides approach different numbers.', 'Condition 1 fails. The value f(2) does not exist, because f(2) exists? is set to no, undefined.', 'None of the three conditions fails. The function is continuous at x = 2.'], a: 0,
                why: 'Condition 1 passes because the filled dot exists, and condition 2 passes because both sides approach 3. Only condition 3 fails, because the limit 3 is not equal to f(2) = 5. Naming the condition that breaks is the skill the exam checks.'
            },
            message: 'The dot for f(2) sits at the wrong height. Conditions 1 and 2 pass, so condition 3 is the one to repair.'
        },
        { params: { k: 3 }, message: 'Drag the point f(2) down to 3 and watch the condition board turn green row by row. Each green row names one condition you cite when you justify continuity at a point.' },
        {
            params: { L: 1.5 },
            predict: {
                q: 'Now the two sides split. The left side approaches 1.5 and the right side approaches 3, and f(2) = 3 still exists. Is the filled dot alone enough for continuity?',
                choices: ['No. Condition 2 fails, because the two-sided limit does not exist.', 'Yes. The filled dot gives the value f(2), and that dot sits on the right branch.', 'Yes. One side already matches f(2), so the point counts as continuous.'], a: 0,
                why: 'A filled dot only guarantees condition 1. Continuity also needs the two-sided limit to exist. A point whose limit does not exist can never be continuous.'
            },
            message: 'The dot sits neatly at the start of the right branch, yet the function is still not continuous. Read the condition board instead of judging by how the graph looks.'
        },
        {
            params: { L: 3, defined: 0 },
            predict: {
                q: 'Both sides agree at 3, so the limit exists, but f(2) has no value. Is the function continuous at x = 2?',
                choices: ['No. Condition 1 fails because f(2) has no value, and this hole is a removable discontinuity.', 'Yes. The limit exists at x = 2, and the limit on its own is enough for continuity.', 'The question has no answer, because a function with no value at one point has no limit there.'], a: 0,
                why: 'Continuity is stricter than having a limit: the value f(2) must exist, and it must equal that limit. This hole is the removable kind studied in topic 1.10.'
            },
            message: 'The hole at x = 2 is visible, and the limit there still exists. Condition 2 passes while condition 1 fails.'
        }
    ],
    summary: {
        idea: 'Continuity at a point needs three claims at the same time: the value exists, the limit exists, and the two are equal. When you justify continuity, cite the three conditions in that order.',
        mistake: 'Students read a filled dot as proof of continuity. The filled dot proves condition 1 only, and the limit may still fail.',
        transfer: 'Set the left-hand limit and the right-hand limit controls to 4, and set f(2) to undefined. Which controls do you change next to get three green rows on the condition board? What value must f(2) take for condition 3 to pass?'
    }
};

function round1(v) { return String(Math.round(v * 10) / 10); }
function verdictWord(lim, env) {
    if (lim === null) return 'Discontinuous: the limit does not exist.';
    if (env.defined < 0.5) return 'Discontinuous: the value f(2) does not exist.';
    if (Math.abs(lim - env.k) > 1e-9) return 'Discontinuous: the limit is not equal to f(2).';
    return 'Continuous: conditions 1, 2, and 3 all hold.';
}
