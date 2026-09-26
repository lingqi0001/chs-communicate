/* 2.6 Derivative Rule Composer — differentiation works term by term: split the
   expression, differentiate each piece, rebuild it with the same glue. */

const TERMS_A = [
    { src: '3x⁴', d: '12x³', rule: 'power rule: the exponent 4 comes down, then the exponent drops to 3' },
    { src: '− 5x²', d: '− 10x', rule: 'power rule, and the minus sign stays with the term' },
    { src: '+ 7x', d: '+ 7', rule: 'power rule: 7x¹ becomes 7·1·x⁰, which is 7' },
    { src: '− 9', d: '+ 0', rule: 'a lone constant contributes nothing to f′', zero: true }
];
const TERMS_B = [
    { src: '4 sin x', d: '4 cos x', rule: 'constant multiple rule: the 4 is carried through' },
    { src: '− 2/x', d: '+ 2/x²', rule: 'read −2/x as −2x⁻¹, so the power rule gives (−2)(−1)x⁻²' },
    { src: '+ 11', d: '+ 0', rule: 'a lone constant contributes nothing to f′', zero: true }
];
const TERMS_C = [
    { src: '7', d: '0', rule: 'the whole function is a single constant', zero: true }
];
const TERMS_D = [
    { src: '(1/3)x³', d: 'x²', rule: 'power rule: the exponent 3 multiplies the coefficient 1/3' },
    { src: '− 2x²', d: '− 4x', rule: 'power rule, and the minus sign stays with the term' },
    { src: '+ 9x', d: '+ 9', rule: 'power rule: 9x¹ becomes 9·1·x⁰, which is 9' },
    { src: '− 5', d: '+ 0', rule: 'a lone constant contributes nothing to f′', zero: true }
];

/* Each example owns its rows, its assembled derivative, its x domain and its
   checklist wording, so a new example cannot break another one. The y window is
   read off the two curves, so nothing can be drawn outside the view. */
const EXAMPLES = {
    A: {
        label: '3x⁴ − 5x² + 7x − 9', terms: TERMS_A, fpLine: '12x³ − 10x + 7', dom: [-1.4, 1.4],
        f: (x) => 3 * Math.pow(x, 4) - 5 * x * x + 7 * x - 9,
        d: (x) => 12 * Math.pow(x, 3) - 10 * x + 7,
        board: (env) => [
            { t: 'The constants 3, −5 and 7 multiply a power of x, so each is carried through', state: env.stage >= 3 },
            { t: 'The lone constant −9 contributes 0', state: env.stage >= 4 },
            { t: 'The plus and minus signs between the terms are copied unchanged', state: env.stage >= 4 }
        ]
    },
    B: {
        label: '4 sin x − 2/x + 11', terms: TERMS_B, fpLine: '4 cos x + 2/x²', dom: [0.3, 5],
        f: (x) => 4 * Math.sin(x) - 2 / x + 11,
        d: (x) => 4 * Math.cos(x) + 2 / (x * x),
        board: (env) => [
            { t: 'The constant 4 multiplies sin x, so the result is 4 cos x', state: env.stage >= 1 },
            { t: 'The lone constant +11 contributes 0', state: env.stage >= 3 },
            { t: 'The signs are copied, and (−2)(−1) gives a positive coefficient', state: env.stage >= 2 }
        ]
    },
    C: {
        label: '7 (a constant function)', terms: TERMS_C, fpLine: '0', dom: [-3, 3],
        f: () => 7,
        d: () => 0,
        board: (env) => [
            { t: 'No term contains x, so the power rule has nothing to act on', state: true },
            { t: 'The whole function is one constant, and a constant never changes', state: true },
            { t: 'The value of f′ is 0 at every x, and the graph of f′ is the x-axis', state: env.stage >= 1 }
        ]
    },
    D: {
        label: '(1/3)x³ − 2x² + 9x − 5', terms: TERMS_D, fpLine: 'x² − 4x + 9', dom: [-1.3, 2.6],
        f: (x) => x * x * x / 3 - 2 * x * x + 9 * x - 5,
        d: (x) => x * x - 4 * x + 9,
        board: (env) => [
            { t: 'The constants 1/3, −2 and 9 multiply a power of x, so each is carried through', state: env.stage >= 3 },
            { t: 'The lone constant −5 contributes 0', state: env.stage >= 4 },
            { t: 'The plus and minus signs are copied into f′', state: env.stage >= 4 }
        ]
    }
};
Object.keys(EXAMPLES).forEach(k => {
    const ex = EXAMPLES[k];
    const [d0, d1] = ex.dom;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 120; i++) {
        const x = d0 + (d1 - d0) * i / 120;
        [ex.f(x), ex.d(x)].forEach(y => {
            if (!Number.isFinite(y)) return;
            if (y < lo) lo = y;
            if (y > hi) hi = y;
        });
    }
    const pad = (hi - lo) * 0.07;
    ex.win = [d0, d1, lo - pad, hi + pad];
});

export default {
    id: 'u2-rule-composer',
    meta: { unit: 2, topic: '2.6', title: 'Derivative Rules: Constant, Sum, Difference, and Constant Multiple', visualizerTitle: 'Derivative Rule Composer' },
    intro: 'Each term of f is differentiated on its own. A constant in front of a term is carried through. A constant standing alone becomes 0.',
    params: { stage: 0, ex: 'A' },
    controls: [
        {
            key: 'ex', label: 'example', kind: 'choice',
            options: ['A', 'B', 'C', 'D'].map(k => ({ v: k, label: EXAMPLES[k].label }))
        }
    ],
    fns: {
        f: (x, env) => EXAMPLES[env.ex].f(x),
        fp: (x, env) => EXAMPLES[env.ex].d(x)
    },
    panes: {
        main: [
            {
                kind: 'eq', title: 'Term by term',
                lines: env => {
                    const terms = EXAMPLES[env.ex].terms;
                    const shown = Math.min(terms.length, env.stage + 1);
                    const L = [{ t: 'f = ' + terms.map(t => t.src).join(' '), hl: env.stage === 0, rule: 'given' }];
                    terms.slice(0, shown).forEach((t, i) => {
                        L.push({
                            t: t.src + '   →   ' + (i + 1 <= env.stage ? t.d : '…'),
                            rule: i + 1 <= env.stage ? t.rule : 'waiting',
                            hl: i + 1 === env.stage,
                            color: t.zero && i + 1 <= env.stage ? 'down' : undefined
                        });
                    });
                    if (env.stage >= terms.length) {
                        L.push({ t: 'f′ = ' + EXAMPLES[env.ex].fpLine, hl: true, rule: 'reassembled with the same signs' });
                    }
                    return L;
                }
            },
            {
                kind: 'graph', height: 280,
                title: env => 'The function f is blue, and the derivative f′ is green' + (env.ex === 'B' ? ' for x greater than 0' : ''),
                window: env => EXAMPLES[env.ex].win,
                when: env => env.stage >= EXAMPLES[env.ex].terms.length,
                curves: [
                    { fn: 'f', color: 'curveA', label: 'f' },
                    { fn: 'fp', color: 'curveC', label: 'f′', dashed: true }
                ]
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'What carries into f′',
                items: env => EXAMPLES[env.ex].board(env)
            },
            {
                kind: 'note', title: 'The three rules used here',
                text: 'Sum and difference rule: d/dx[f ± g] = f′ ± g′. Constant multiple rule: d/dx[c·f] = c·f′. Constant rule: d/dx[c] = 0, and these three rules handle any polynomial one term at a time.'
            }
        ]
    },
    steps: [
        { params: { stage: 0, ex: 'A' }, message: 'Read f from left to right as four independent pieces joined by + and −. Each step differentiates one piece and writes the result in its own row.' },
        { params: { stage: 1 }, message: 'First term: 3x⁴ becomes 12x³. The exponent 4 comes down as the multiplier, and the new exponent is 3. The 3 in front is unchanged.' },
        { params: { stage: 2 }, message: 'The term −5x² keeps its minus sign in the answer −10x. A sign inside a sum stays with its own term.' },
        { params: { stage: 3 }, message: 'The term 7x is 7x¹, so the power rule gives 7·1·x⁰ = 7. The result 7 is the constant slope of the line 7x.' },
        {
            params: { stage: 4 },
            predict: {
                q: 'The last term of f is −9. What does this term contribute to f′?',
                choices: ['0. A constant never changes as x changes.', '−9. A constant copies down into the answer.', '−1. The power rule steps the exponent down.'], a: 0,
                why: 'The constant rule gives d/dx[c] = 0. The answer −9 comes from using the constant multiple rule where the constant rule belongs. A constant only survives while it multiplies something that changes.'
            },
            message: 'The row for −9 now shows +0. The assembled f′ appears under the rows, and both graphs are drawn.'
        },
        { params: { stage: 5 }, message: 'So f′ = 12x³ − 10x + 7. In the graph, f is flat exactly where f′ crosses zero, near x = −1.16. Each term was handled on its own, and the signs between the terms were copied.' },
        { params: { stage: 0, ex: 'B' }, message: 'A new example and the same three rules: 4 sin x − 2/x + 11. The useful rewrite is −2/x as −2x⁻¹, which makes the power rule apply.' },
        {
            params: { stage: 3, ex: 'B' },
            predict: {
                q: 'In this example, what happens to the 4 in front of sin x?',
                choices: ['It stays. The term 4 sin x differentiates to 4 cos x.', 'It disappears. The 4 goes to 0, just like the lone 11.', 'It changes. The 4 turns into 4/x in the answer.'], a: 0,
                why: 'The constant multiple rule keeps a constant that multiplies a changing term, so the 4 stays. The 11 contributes nothing because it stands alone. What a constant multiplies decides what happens to that constant.'
            },
            message: 'Reassembled, f′ = 4 cos x + 2/x². The two negative factors in (−2)(−1)x⁻² combine into a positive. That sign step is the one worth checking twice.'
        },
        {
            params: { stage: 0, ex: 'C' },
            predict: {
                q: 'The function is the single constant 7, and no term contains x. What is f′?',
                choices: ['0 at every x. The graph of f is a horizontal line with slope 0.', '7 at every x. A constant copies down into the answer.', '1 at every x. A constant differentiates to the number 1.', 'The derivative does not exist. The formula of f has no x to differentiate.'], a: 0,
                why: 'The constant rule gives d/dx[7] = 0. The definition of the derivative agrees. Over any interval every average rate of change is 0, and the limit of 0 is 0.'
            },
            message: 'The table has one row here: 7 becomes 0. This is the constant rule with nothing else left to do.'
        },
        { params: { stage: 1, ex: 'C' }, message: 'With that row finished, f′ = 0 appears and the graph is drawn. The curve of f is a horizontal line, and the green curve f′ lies flat on the x-axis.' },
        {
            params: { stage: 0, ex: 'D' },
            predict: {
                q: 'The next polynomial is (1/3)x³ − 2x² + 9x − 5. Which expression is the derivative of this polynomial?',
                choices: ['x² − 4x + 9', 'x² − 4x + 4', 'x² − 2x + 9', '(1/3)x² − 4x + 9'], a: 0,
                why: 'Term by term: (1/3)x³ gives x², −2x² gives −4x, 9x gives 9, and −5 gives 0. The choice x² − 4x + 4 keeps the −5, and the choice x² − 2x + 9 differentiates −2x² as −2x. The choice (1/3)x² − 4x + 9 leaves the factor 1/3 in front.'
            },
            message: 'Commit to an answer first. Then step through the table and check each row against one term of that answer.'
        },
        { params: { stage: 4, ex: 'D' }, message: 'The derivative is f′ = x² − 4x + 9. This quadratic reaches its smallest value 5 at x = 2, so f′ never reaches 0. That is why the curve of f rises across the whole window with no flat point.' }
    ],
    summary: {
        idea: 'Differentiation acts on each term of a sum or a difference separately. A constant that multiplies a term stays, and a lone constant becomes 0. The plus and minus signs of f reappear in the same places in f′.',
        mistake: 'A common error drops the 4 from 4 sin x, and another keeps the −9 inside the answer. A constant survives differentiation only while it multiplies a term that changes.',
        transfer: 'Example D is f = (1/3)x³ − 2x² + 9x − 5. Say which constants are carried through to f′ and which constant becomes 0. Then step through the rows and read the assembled f′.'
    }
};
