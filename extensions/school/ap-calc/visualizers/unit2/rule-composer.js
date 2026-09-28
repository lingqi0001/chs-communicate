/* 2.6 Derivative Rule Composer — a symbolic lesson, not a graph lesson. The
   object on screen is the expression itself: it is split into terms, each term is
   changed on its own, and the pieces are rebuilt with their signs. Every example
   here is a polynomial, so the only prior tool in use is the power rule from
   topic 2.5, and nothing borrows a derivative that topic 2.7 has not taught yet.
   The single graph kept is the constant rule, where a horizontal line really does
   carry the argument. */

/* One color per term, held from the input cell to its derivative cell. accent,
   aux, up and down are the shared tokens in calc-components.js, so the mapping
   reads on the light cards and on the dark ones. The red term is always the lone
   constant, the term with no x attached to it. */
const TERM_COLORS = ['accent', 'aux', 'up', 'down'];

/* The four term rows of the worked polynomial, then the three term rows the
   student transfers to. Each entry is one row of the board, so a rule is only
   ever read across a single row. */
const SUM_TERMS = [
    { src: '3x⁴', d: '12x³', rule: 'power rule on x⁴, and the 3 in front is carried' },
    { src: '− 5x²', d: '− 10x', rule: 'power rule, and the minus sign stays with its term' },
    { src: '+ 7x', d: '+ 7', rule: '7x¹ gives 7 · 1 · x⁰, which is the constant 7' },
    { src: '− 9', d: '+ 0', rule: 'constant rule, a term with no x contributes 0' }
];
const TRANSFER_TERMS = [
    { src: '4x⁵', d: '20x⁴', rule: 'power rule on x⁵, and the 4 in front is carried' },
    { src: '− 2x²', d: '− 4x', rule: 'power rule, and the minus sign stays with its term' },
    { src: '+ 11', d: '+ 0', rule: 'constant rule, a term with no x contributes 0' }
];

/* The constant multiple board. The first column is the same value in the same
   color on every row, which is the whole point of the phase. */
const CARRY_ROWS = [
    { c: '3', p: 'x⁴', does: 'split 3x⁴ into its constant and its power', as: '3 · x⁴' },
    { c: '3', p: '4x³', does: 'the power rule acts on x⁴ and leaves the 3 alone', as: '3 · 4x³' },
    { c: '3', p: '4x³', does: 'multiply the carried 3 by 4x³', as: '12x³' }
];

function tint(v, c) { return { v: v, color: c, bold: true }; }
function pending() { return { v: '…', color: 'auxInk' }; }

/* One row per term. The input cell and its derivative cell carry the same color,
   and a row whose derivative is not yet revealed holds a placeholder instead. */
function termRows(terms, k) {
    return terms.map((t, i) => [
        tint(t.src, TERM_COLORS[i]),
        k >= i + 1 ? tint(t.d, TERM_COLORS[i]) : pending(),
        k >= i + 1 ? t.rule : 'waiting'
    ]);
}

const BOARD_ITEMS = {
    1: env => [
        { t: 'The graph of f is a horizontal line', state: true },
        { t: 'The slope of f is 0 at every x', state: env.k >= 1 },
        { t: 'The graph of f′ is the x-axis', state: env.k >= 1 }
    ],
    2: env => [
        { t: 'The 3 in front of x⁴ is carried into the answer', state: env.k >= 1 },
        { t: 'The power rule acts on x⁴ only', state: env.k >= 1 },
        { t: 'The product 3 · 4x³ is written as 12x³', state: env.k >= 2 }
    ],
    3: env => [
        { t: 'A constant in front of a power is carried through', state: env.k >= 1 },
        { t: 'Each sign stays with the term it is written on', state: env.k >= 2 },
        { t: 'The lone constant − 9 contributes 0', state: env.k >= 4 },
        { t: 'The rows reassemble in the same order with the same signs', state: env.k >= 5 }
    ],
    4: env => [
        { t: 'The 4 in front of x⁵ is carried, giving 20x⁴', state: env.k >= 1 },
        { t: 'The − 2 in front of x² is carried, and its minus sign stays', state: env.k >= 2 },
        { t: 'The lone 11 contributes 0', state: env.k >= 3 },
        { t: 'The rows reassemble as g′ = 20x⁴ − 4x', state: env.k >= 4 }
    ]
};

export default {
    id: 'u2-rule-composer',
    meta: { unit: 2, topic: '2.6', title: 'Derivative Rules: Constant, Sum, Difference, and Constant Multiple', visualizerTitle: 'Derivative Rule Composer' },
    intro: 'This lesson never leaves polynomials, so the only rule you need before it is the power rule. Watch one expression being split into terms, changed term by term, and rebuilt with the same signs. In the boards that follow, a term and its derivative share one color, and the lone constant is the term drawn in red.',
    params: { ph: 1, k: 0 },
    controls: [],
    fns: {
        fconst: () => 7,
        fpconst: () => 0
    },
    panes: {
        main: [
            {
                kind: 'eq', title: 'The constant rule', when: env => env.ph === 1,
                lines: env => env.k >= 1 ? [
                    { t: 'f(x) = 7', rule: 'given' },
                    { t: 'slope at every x = 0', color: 'auxInk' },
                    { t: 'd/dx [ 7 ] = 0', hl: true, rule: 'constant rule' },
                    { t: 'The graph of f′ is the x-axis, because f′ has the value 0 at every x.', color: 'auxInk' }
                ] : [
                    { t: 'f(x) = 7', hl: true, rule: 'given' },
                    { t: 'No term here contains x, so no term is a power of x.', color: 'auxInk' },
                    { t: 'd/dx [ 7 ] = ?', rule: 'to find' }
                ]
            },
            {
                kind: 'graph', title: 'A constant function and its derivative', height: 250,
                when: env => env.ph === 1,
                window: [-3, 3, -1.5, 9.5],
                curves: env => {
                    const out = [{ fn: 'fconst', color: 'curveA', label: 'f(x) = 7', labelAt: -1.6 }];
                    if (env.k >= 1) out.push({ fn: 'fpconst', color: 'curveC', label: 'f′ = 0, the x-axis', labelAt: 1.1, dashed: true });
                    return out;
                },
                tangents: env => env.k >= 1 ? [
                    { fn: 'fconst', x: -1.8, m: 0, color: 'up', label: 'slope 0', reach: 0.1 },
                    { fn: 'fconst', x: 1.8, m: 0, color: 'up', label: 'slope 0', reach: 0.1 }
                ] : []
            },
            {
                kind: 'table', title: 'The constant 3 is carried, not differentiated',
                when: env => env.ph === 2,
                cols: ['the constant', 'the power of x', 'what this row does', 'read it as'],
                rows: env => CARRY_ROWS.slice(0, env.k + 1).map((r, i) => [
                    tint(r.c, 'accent'),
                    tint(r.p, 'aux'),
                    r.does,
                    i === 2 ? tint(r.as, 'ink') : r.as
                ]),
                note: env => env.k === 0
                    ? 'Row one changes nothing. It only names the two factors of 3x⁴, and the 3 already has its own column.'
                    : env.k === 1
                        ? 'The power rule is applied to x⁴ alone. The cell holding the 3 keeps the same color and the same value, and that is what carried means.'
                        : 'The carried 3 multiplied by 4x³ gives 12x³. The constant never disappeared, and it was never differentiated.'
            },
            {
                kind: 'eq', title: 'The rule the board just used',
                when: env => env.ph === 2 && env.k >= 2,
                lines: [
                    { t: 'd/dx [ c · f ] = c · f′', hl: true, rule: 'constant multiple rule' },
                    { t: 'c = 3 and f = x⁴, so d/dx [ 3x⁴ ] = 3 · 4x³ = 12x³' }
                ]
            },
            {
                kind: 'eq', title: 'The function on the board',
                when: env => env.ph === 3,
                lines: env => env.k >= 5 ? [
                    { t: 'f = 3x⁴ − 5x² + 7x − 9', rule: 'four terms' },
                    { t: 'f′ = 12x³ − 10x + 7', hl: true, rule: 'same order, same signs' },
                    { t: 'The row for − 9 gave 0, so no constant term is written into f′.', color: 'auxInk' }
                ] : [
                    { t: 'f = 3x⁴ − 5x² + 7x − 9', hl: env.k === 0, rule: 'four terms' }
                ]
            },
            {
                kind: 'table', title: 'One row per term, one color per term',
                when: env => env.ph === 3,
                cols: ['term of f', 'term of f′', 'the rule on this row'],
                rows: env => termRows(SUM_TERMS, env.k),
                note: env => env.k === 0
                    ? 'The left column holds the four terms of f in the order f writes them, and every derivative cell is blank.'
                    : env.k < 4
                        ? 'A row is finished once its derivative cell matches the color of its input cell. The remaining rows are still blank.'
                        : 'All four rows are finished. Each sign on the left was copied onto the right, and the red row gave 0.'
            },
            {
                kind: 'eq', title: 'A fresh expression',
                when: env => env.ph === 4,
                lines: env => env.k >= 4 ? [
                    { t: 'g(x) = 4x⁵ − 2x² + 11', rule: 'three terms' },
                    { t: 'g′ = 20x⁴ − 4x', hl: true, rule: 'same order, same signs' }
                ] : [
                    { t: 'g(x) = 4x⁵ − 2x² + 11', hl: env.k === 0, rule: 'three terms' },
                    { t: 'The board below holds one row per term of g, and every derivative cell is blank.', color: 'auxInk' }
                ]
            },
            {
                kind: 'table', title: 'Your board for g',
                when: env => env.ph === 4,
                cols: ['term of g', 'term of g′', 'the rule on this row'],
                rows: env => termRows(TRANSFER_TERMS, env.k),
                note: env => env.k === 0
                    ? 'The derivative column of this board is blank. Read the three input cells, decide the answer, then check one row at a time.'
                    : env.k < 3
                        ? 'Each row you have filled is one term of g handled on its own.'
                        : 'Three rows, three separate uses of the rules, and only the lone constant is gone.'
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'What carries into the derivative',
                items: env => BOARD_ITEMS[env.ph](env),
                verdict: env => env.ph === 4 && env.k >= 4
                    ? 'Every term of g was handled on its own, and only the lone 11 disappeared.'
                    : undefined,
                verdictOk: true
            },
            {
                kind: 'note', title: 'Reading the colors', when: env => env.ph >= 2,
                text: env => env.ph === 2
                    ? 'The constant 3 keeps one color from the split on the first row to the product on the last row. That fixed color is the carried constant.'
                    : 'Each row holds one term and its derivative in the same color, so a term never changes identity on the way down. The red term is the lone constant, the only term with no x in it.'
            },
            {
                kind: 'note', title: 'The three rules used here',
                text: 'Constant rule: d/dx[c] = 0. Constant multiple rule: d/dx[c · f] = c · f′. Sum and difference rule: d/dx[f ± g] = f′ ± g′. These three rules plus the power rule handle any polynomial one term at a time.'
            }
        ]
    },
    steps: [
        {
            params: { ph: 1, k: 1 },
            predict: {
                q: 'The function on the graph is the single constant f(x) = 7, and no term of it contains x. What is f′?',
                choices: [
                    '0 at every x. The graph of f is a horizontal line, and a horizontal line has slope 0 everywhere.',
                    '7 at every x. A constant copies down into the answer the way a coefficient does.',
                    '1 at every x. A constant differentiates to the number 1.',
                    'No derivative exists. The formula of f has no x to differentiate.'
                ], a: 0,
                why: 'The constant rule gives d/dx[7] = 0, and the flat line on the graph says the same thing. The answer 7 copies a lone constant down as if it were a carried coefficient, which is the mix up this whole lesson turns on. A horizontal line has a slope at every x, so the last choice has nothing to stand on.'
            },
            message: 'Both lines are on the graph now. The short marks on f are flat, so its slope is 0 at every x, and the dashed line of f′ lies down the x-axis.'
        },
        { params: { ph: 2, k: 0 }, message: 'One term with a constant in front comes next: 3x⁴, written on the board as the two factors 3 and x⁴. Row one only names those factors. Nothing has been differentiated yet.' },
        {
            params: { ph: 2, k: 1 },
            predict: {
                q: 'The board splits 3x⁴ into the constant 3 and the power x⁴. Which expression is d/dx[3x⁴]?',
                choices: [
                    '12x³. The 3 is carried through, and the power rule turns x⁴ into 4x³.',
                    '4x³. The power rule rewrites x⁴, and the 3 in front is dropped.',
                    '3x³. The 3 is carried, and the exponent drops from 4 to 3.',
                    '12x⁴. The 3 and the 4 multiply, and the exponent stays at 4.'
                ], a: 0,
                why: 'The power rule turns x⁴ into 4x³, and the carried 3 multiplies that to 12x³. The choice 4x³ drops the carried constant. The choice 3x³ lowers the exponent without multiplying by 4. The choice 12x⁴ multiplies correctly but never lowers the exponent.'
            },
            message: 'Row two differentiates x⁴ into 4x³, and the cell holding the 3 keeps the same color and the same value. The constant is carried, so it is not differentiated at all.'
        },
        { params: { ph: 2, k: 2 }, message: 'Row three multiplies the carried 3 by 4x³ and reads 12x³. The rule written under the board names that move, and it is the reason a coefficient behaves nothing like a lone constant.' },
        { params: { ph: 3, k: 0 }, message: 'Now the whole polynomial is on the board: f = 3x⁴ − 5x² + 7x − 9. It splits into four rows, and each row will hold one term of f beside the derivative that term produces.' },
        { params: { ph: 3, k: 1 }, message: 'The first row turns 3x⁴ into 12x³. The exponent 4 comes down as a multiplier and the power drops to x³, so 3 · 4x³ gives 12x³.' },
        { params: { ph: 3, k: 2 }, message: 'The second row keeps the minus sign with its own term, so − 5x² gives − 10x. A sign inside a sum belongs to the term it is written with.' },
        { params: { ph: 3, k: 3 }, message: 'The row for + 7x gives + 7, because 7x¹ becomes 7 · 1 · x⁰. The 7 in front is carried exactly the way the 3 in 3x⁴ was carried.' },
        {
            params: { ph: 3, k: 4 },
            predict: {
                q: 'The last row of the board is the term − 9, written in red because no x is attached to it. What does this term contribute to f′?',
                choices: [
                    '0. A constant never changes as x changes.',
                    '− 9. A constant copies down into the answer with its sign.',
                    '− 1. The power rule steps the exponent down by one.'
                ], a: 0,
                why: 'The constant rule gives d/dx[c] = 0. A constant is only carried while it multiplies a term that changes, and − 9 multiplies nothing. The answer − 1 invents an exponent that is not written on that row.'
            },
            message: 'The red row gives + 0. It is the only row on the board with no x in it, and it is the row students most often copy straight into the answer.'
        },
        { params: { ph: 3, k: 5 }, message: 'Reassembled, f′ = 12x³ − 10x + 7. The order of the rows and the signs between them are copied from f without one change, and the 0 row leaves nothing behind.' },
        { params: { ph: 4, k: 0 }, message: 'Your turn. The expression g(x) = 4x⁵ − 2x² + 11 is new, and its board below shows the three terms with nothing differentiated yet. Answer the question first, then press Next and check one row at a time.' },
        {
            params: { ph: 4, k: 1 },
            predict: {
                q: 'The three input cells on your board are 4x⁵, − 2x² and + 11, and every derivative cell is blank. Which expression is g′?',
                choices: [
                    '20x⁴ − 4x. The 4 and the − 2 are carried, and the lone 11 becomes 0.',
                    '20x⁴ − 4x + 11. The 11 is written as a term of g, so it copies into g′.',
                    '20x⁴ − 2x. The 4 is carried and multiplied, while the − 2 keeps its place.',
                    '4x⁴ − 4x. The exponent drops on every term, and no coefficient changes.'
                ], a: 0,
                why: 'Each row is one term handled on its own. 4x⁵ gives 4 · 5x⁴, which is 20x⁴, and − 2x² gives − 2 · 2x, which is − 4x, while 11 gives 0. Keeping the 11 treats a lone constant as a carried coefficient. The choice 20x⁴ − 2x forgets the exponent 2 in that product, and 4x⁴ − 4x forgets the exponent 5 in its own row.'
            },
            message: 'The first row carries the 4 and applies the power rule to x⁵, so 4x⁵ gives 20x⁴ in the color that row started with.'
        },
        { params: { ph: 4, k: 2 }, message: 'The second row carries the − 2 together with its minus sign, so − 2x² gives − 4x. That is the same move the row for − 5x² made.' },
        { params: { ph: 4, k: 3 }, message: 'The row for + 11 gives + 0. It is the red row of this board, the one term with no x attached to it.' },
        { params: { ph: 4, k: 4 }, message: 'Assembled, g′ = 20x⁴ − 4x. Three rows, three separate uses of the rules, and the signs copied from g unchanged.' }
    ],
    summary: {
        idea: [
            'Differentiation acts on each term of a sum or a difference on its own, so a polynomial is never differentiated all at once.',
            'A constant that multiplies a term is carried through it, and a constant standing alone becomes 0.',
            'The plus and minus signs of the original expression reappear in the same places in the derivative.'
        ],
        mistake: 'The usual slip drops the 4 from 4x⁵ and answers 5x⁴. The other keeps the lone 11 inside the answer. A constant survives differentiation only while it multiplies a term that changes.',
        transfer: 'Take f = (1/3)x³ − 2x² + 9x − 5 on paper. Say which constants are carried through and which one becomes 0, then write one row per term and assemble f′ = x² − 4x + 9.'
    }
};
