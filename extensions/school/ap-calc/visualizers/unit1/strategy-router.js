/* 1.7 Limit Strategy Router - see a symptom, pick a method.
   The screen is the decision path itself, not a graph. The first fork asks what
   representation you were given. Only a formula goes on to substitution, and it
   is a diagnostic. L'Hospital deliberately absent (it is topic 4.7 material). */

/* The lit path for each problem. Node ids on the path stay bright, the rest dim. */
const ROUTES = {
    1: ['start', 'form', 'sub', 'hole', 'poly', 'factor'],
    2: ['start', 'form', 'sub', 'hole', 'rad', 'conj'],
    3: ['start', 'form', 'sub', 'nz', 'signs'],
    4: ['start', 'data', 'read'],
    5: ['start', 'form', 'sub', 'pw', 'one']
};
/* The single node that carries the accent ring: the method the route lands on. */
const FOCUS = { 1: 'factor', 2: 'conj', 3: 'signs', 4: 'read', 5: 'one' };

/* The decision map as connected nodes. Labels stay short, the boxes are narrow. */
function routerRoot(env) {
    const route = ROUTES[env.p];
    const showMap = !route;                       // start state and practice: full neutral map
    const on = id => showMap || route.indexOf(id) >= 0;
    const N = (id, e, rule, children) => ({ id, e, rule, dim: !on(id), children: children || [] });
    return N('start', 'START', 'What is given?', [
        N('data', 'Graph or table', 'No formula', [
            N('read', 'Read both sides', 'Topics 1.3 and 1.4')
        ]),
        N('form', 'Formula', 'Substitute first', [
            N('sub', 'Substitution', 'Diagnostic only', [
                N('fin', 'Finite value', 'Only if continuous', [
                    N('done', 'DONE', 'Value is the limit')
                ]),
                N('hole', '0/0', 'Read the structure', [
                    N('poly', 'Polynomial', 'Shares a factor', [
                        N('factor', 'Factor', 'Cancel, then retry')
                    ]),
                    N('rad', 'Radical', 'Hidden factor', [
                        N('conj', 'Conjugate', 'Clear the radical')
                    ]),
                    N('trg', 'Trig / bounded', 'A known form fits', [
                        N('squeeze', 'Identity / squeeze', 'Use a known limit')
                    ])
                ]),
                N('nz', 'Nonzero over 0', 'No value yet', [
                    N('signs', 'One-sided signs', 'May match or differ')
                ]),
                N('pw', 'Piecewise', 'Definition changes', [
                    N('one', 'One-sided limits', 'Compare them')
                ])
            ])
        ])
    ]);
}

/* The problem card above the router. Values checked against node:
   P1 top 9 - 6 - 3 = 0, bottom 3 - 3 = 0.  P2 sqrt(4) - 2 = 0, 4 - 4 = 0.
   P3 top 2 + 1 = 3, bottom 2 - 2 = 0.  P5 piece below 2 gives 2^2 + 1 = 5, the
   piece covering 2 gives 3(2) - 3 = 3, and the limit does not exist. */
const PROBLEMS = {
    1: {
        head: 'lim x→3 (x² − 2x − 3)/(x − 3)',
        sub: 'Substitute x = 3',
        out: 'Top 9 − 6 − 3 = 0. Bottom 3 − 3 = 0. The result is 0/0.',
        verdict: 'Both parts are polynomials, so factor out the shared factor (x − 3).'
    },
    2: {
        head: 'lim x→4 (√x − 2)/(x − 4)',
        sub: 'Substitute x = 4',
        out: 'Top √4 − 2 = 0. Bottom 4 − 4 = 0. The result is 0/0.',
        verdict: 'A radical sits on top, so multiply by the conjugate √x + 2.'
    },
    3: {
        head: 'lim x→2 (x + 1)/(x − 2)',
        sub: 'Substitute x = 2',
        out: 'Top 2 + 1 = 3. Bottom 2 − 2 = 0. The result is 3/0.',
        verdict: 'A nonzero number over 0 gives no limit value, so read the one-sided signs. Here (x − 2) changes sign, so the sides split.'
    },
    4: {
        head: 'lim x→1 f(x) read from a graph',
        sub: 'A graph gives the values near x = 1',
        out: 'There is no formula, so substitution does not apply.',
        verdict: 'Read the values just left of 1 and just right of 1.'
    },
    5: {
        head: 'lim x→2 f(x), f = x² + 1 below 2 and 3x − 3 at and above 2',
        sub: 'The piece covering x = 2 is 3x − 3',
        out: 'It gives 3(2) − 3 = 3. From the left the rule is x² + 1, and that goes to 2² + 1 = 5.',
        verdict: 'The rule changes at 2, so the value 3 there is not the limit. The one-sided limits are 5 and 3, so the limit does not exist.'
    }
};

function problemTitle(env) {
    if (env.p === 4) return 'Problem 4  ·  read the data';
    if (env.p === 5) return 'Problem 5  ·  a piecewise rule';
    return env.p >= 1 && env.p <= 3 ? 'Problem ' + env.p + '  ·  substitute once' : '';
}
function problemLines(env) {
    const pr = PROBLEMS[env.p];
    if (!pr) return [];
    return [
        { t: pr.head },
        { t: pr.sub },
        { t: pr.out, hl: true, color: 'accent' },
        { t: pr.verdict, rule: 'route' }
    ];
}
const OUTCOME = { 1: '0/0', 2: '0/0', 3: '3/0' };
const METHOD = { 1: 'factor', 2: 'conjugate', 3: 'one-sided signs', 4: 'read both sides', 5: 'one-sided limits' };
function checkItems(env) {
    const p = env.p;
    const first = p === 4 ? 'No formula, so substitution does not apply'
        : p === 5 ? 'The formula changes its rule at the target' : 'Direct substitution tried first';
    const second = p === 4 ? 'The data gives values near the target'
        : p === 5 ? 'The piece at 2 returns 3, and the two sides return 5 and 3'
        : 'The substitution returns ' + OUTCOME[p];
    return [
        { state: true, t: first },
        { state: true, t: second },
        { state: true, t: 'The route lights up: ' + METHOD[p] }
    ];
}
function checkVerdict(env) { return PROBLEMS[env.p] ? PROBLEMS[env.p].verdict : ''; }

export default {
    id: 'u1-strategy-router',
    meta: { unit: 1, topic: '1.7', title: 'Selecting Procedures for Determining Limits', visualizerTitle: 'Limit Strategy Router' },

    intro: 'First ask what you were given. A graph or a table asks for the behavior on the sides the question names. A formula lets you substitute the target value, and that is a diagnostic. What it returns lights up one route on the router. Answer each predict, then press Next and watch the path glow.',

    params: { p: 0 },

    panes: {
        main: [
            {
                kind: 'eq', title: problemTitle, when: env => env.p >= 1 && env.p <= 5,
                lines: problemLines
            },
            {
                kind: 'tree', title: 'Decision router',
                root: routerRoot,
                focus: env => FOCUS[env.p]
            },
            {
                kind: 'checklist', title: 'What the router just read',
                when: env => env.p >= 1 && env.p <= 5,
                items: checkItems,
                verdict: checkVerdict,
                verdictOk: true
            },
            {
                kind: 'practice', id: 'g17', title: 'Choose the first strategy',
                when: env => env.p >= 6,
                items: [
                    {
                        q: 'You want lim x→3 (x² − 2x − 3)/(x − 3), and direct substitution gives 0/0. Which move comes first?',
                        choices: ['Substitute again', 'Factor the numerator', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                        why: 'Direct substitution gives 0/0, and the numerator and the denominator are both polynomials. They share the factor (x − 3), so factoring and canceling come first.'
                    },
                    {
                        q: 'You want lim x→4 (√x − 2)/(x − 4), and direct substitution gives 0/0 with a radical on top. Which move comes first?',
                        choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Read the one-sided signs'], a: 2,
                        why: 'The 0/0 comes from the radical √x − 2 in the numerator. Multiplying by the conjugate √x + 2 clears the radical and exposes the shared factor (x − 4).'
                    },
                    {
                        q: 'You want lim x→2 (x + 1)/(x − 2). Direct substitution gives 3/0. Which move comes first?',
                        choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Analyze the two one-sided limits'], a: 3,
                        why: 'A nonzero number over 0 is not a limit value and not a 0/0 case. The factor (x − 2) changes sign at 2, so the two sides go to different infinities.'
                    },
                    {
                        q: 'You want lim x→0 x² · sin(1/x). The factor sin(1/x) oscillates, so algebra cannot settle the limit. Which move comes first?',
                        choices: ['Substitute again', 'Factor', 'Apply the Squeeze Theorem', 'Multiply by the conjugate'], a: 2,
                        why: 'The factor sin(1/x) oscillates, but it stays between −1 and 1. Multiplying by x² places the whole expression between −x² and x², and both bounds go to 0. The Squeeze Theorem applies.'
                    },
                    {
                        q: 'You want lim x→5 (2x + 1)/(x − 1). What should you do first?',
                        choices: ['Substitute directly', 'Factor', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 0,
                        why: 'Direct substitution gives 11/4, a finite number, and 5 is inside the domain. A rational function is continuous wherever it is defined, so the substitution value is the limit.'
                    },
                    {
                        q: 'A function is f(x) = x² + 1 below x = 2 and f(x) = 3x − 3 at and above x = 2. You want lim x→2 f(x), and the piece covering 2 gives the finite value 3. Which move comes first?',
                        choices: ['Conclude that the limit is 3', 'Factor the expression', 'Compare the two one-sided limits', 'Multiply by the conjugate'], a: 2,
                        why: 'The rule changes at x = 2, so the value 3 there settles nothing. The left side follows x² + 1 and heads to 5, and the right side follows 3x − 3 and heads to 3, so the two-sided limit does not exist.'
                    }
                ]
            },
            {
                kind: 'note', when: env => env.p >= 6,
                text: 'One more to classify: the limit of (x³ − 1)/(x² − 1) as x approaches 1. Direct substitution gives 0/0 on two polynomials. Which node lights up, and which factor is shared by the top and the bottom?'
            },
            {
                kind: 'practice', id: 'g17t', title: 'Name the method, do not calculate',
                when: env => env.p >= 7,
                items: [
                    {
                        q: 'You want lim x→0 sin(3x)/x, and direct substitution gives 0/0 with a trig term. Which move comes first?',
                        choices: ['Substitute again', 'Rewrite toward (sin u)/u, which approaches 1', 'Multiply by the conjugate', 'Factor the expression'], a: 1,
                        why: 'Rewrite sin(3x)/x as 3 · (sin 3x)/(3x). As x approaches 0, the factor (sin 3x)/(3x) approaches 1, so the limit is 3. Topic 1.8 proves that fact with the Squeeze Theorem.'
                    },
                    {
                        q: 'You want lim x→−2 (x² + 5x + 6)/(x + 2), and substitution gives 0/0 with polynomials. Which move comes first?',
                        choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                        why: 'The numerator factors as (x + 2)(x + 3), so it shares the factor (x + 2) with the denominator. Cancel that factor, then substitute.'
                    },
                    {
                        q: 'A table of values gives x just above 1 for lim x→1⁺ ln x/(x − 1). Which move comes first?',
                        choices: ['Substitute to get the answer', 'Read the trend of the values near 1', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                        why: 'The data is a table, so read the trend of the numbers. This limit is one-sided at x = 1, so use the values just above 1. Topic 1.4 teaches that reading.'
                    }
                ]
            },
            {
                kind: 'note', when: env => env.p >= 7,
                text: 'Now compute the three limits you just classified. Use the algebra methods from topic 1.6 and the one-sided reading from topic 1.14. What value does each route produce?'
            }
        ],
        side: [
            {
                kind: 'note', title: 'Scope note', tone: 'warn',
                text: 'L’Hospital’s Rule is not a Unit 1 tool. The College Board teaches it in topic 4.7. In Unit 1, use substitution, algebra, the limit laws, and one-sided reading.'
            }
        ]
    },

    steps: [
        {
            predict: {
                q: 'Problem 1. Substitute x = 3 into lim x→3 (x² − 2x − 3)/(x − 3). What does the substitution return?',
                choices: ['A finite number', '0/0', 'A nonzero number over 0', 'The limit is already found'], a: 1,
                why: 'The top gives 9 − 6 − 3 = 0 and the bottom gives 3 − 3 = 0, so the substitution returns 0/0. That form carries no limit value, so the work continues.'
            },
            params: { p: 1 },
            message: 'Direct substitution returns 0/0. Both the top and the bottom are polynomials, so the router lights the factoring path.'
        },
        {
            predict: {
                q: 'Problem 2. Substitute x = 4 into lim x→4 (√x − 2)/(x − 4). What does the substitution return?',
                choices: ['A finite number', '0/0', 'A nonzero number over 0', 'Nothing, there is no graph'], a: 1,
                why: 'The top gives √4 − 2 = 0 and the bottom gives 4 − 4 = 0, so it returns 0/0 again. This time a radical sits on top.'
            },
            params: { p: 2 },
            message: 'Substitution returns 0/0, but a radical on top hides the shared factor, so the router lights the conjugate path instead.'
        },
        {
            predict: {
                q: 'Problem 3. Substitute x = 2 into lim x→2 (x + 1)/(x − 2). What does the substitution return?',
                choices: ['A finite number', '0/0', 'A nonzero number over 0', 'The two-sided limit is 3'], a: 2,
                why: 'The top gives 2 + 1 = 3 and the bottom gives 2 − 2 = 0, so it returns 3/0. A nonzero number over 0 is not a limit value, so read what each side does.'
            },
            params: { p: 3 },
            message: 'Substitution returns 3/0. The factor (x − 2) changes sign at 2, so the router lights the one-sided signs path. Square that factor and both sides run to the same infinity instead.'
        },
        {
            predict: {
                q: 'Problem 4. This limit is given as a graph with values near the target, not as a formula. What is the first move?',
                choices: ['Substitute the target value', 'Read the values on both sides', 'Factor and cancel', 'Multiply by the conjugate'], a: 1,
                why: 'There is no formula to substitute. When a graph or a table is given, the router stays on that branch, and you read the values near the target from both sides.'
            },
            params: { p: 4 },
            message: 'No formula means no substitution. The router stays on the graph and table branch, so read the values just left and just right of the target.'
        },
        {
            predict: {
                q: 'Problem 5. f(x) is x² + 1 below x = 2 and 3x − 3 at and above x = 2. The piece covering 2 gives 3(2) − 3 = 3, a finite value. What does that tell you?',
                choices: ['The limit is 3', 'The limit is 5', 'Only the value at 2, so both sides still need checking', 'No piecewise function has a limit'], a: 2,
                why: 'The value at 2 comes from the piece that covers it, and that value is 3. A limit never reads the point value, and this rule changes at 2, so the one-sided limits decide. The left side heads to 2² + 1 = 5 and the right side heads to 3, so the two-sided limit does not exist.'
            },
            params: { p: 5 },
            message: 'A finite value from the piece at 2 does not close the job once the rule changes there. The router lights the one-sided limits path, and 5 and 3 do not match.'
        },
        {
            params: { p: 6 },
            message: 'Now you choose. Under the router, name only the first move for each limit. Deciding which route to take is the skill you are practicing.'
        },
        {
            params: { p: 7 },
            message: 'Fresh problems. Say the method out loud before you look at the choices, then name the route here.'
        }
    ],

    summary: {
        idea: [
            'See what you were given first. A graph or a table asks for the behavior on the sides the question names, and there is nothing to substitute.',
            'A formula lets you substitute the target value, and that is a diagnostic. A finite result ends the search only for a kind of expression already known continuous at the target, such as a polynomial, or a rational function defined there.',
            'The other results keep the work going. 0/0 points to the structure, so factor, rationalize, or reach for a known limit. A nonzero number over 0 points to the one-sided signs, and there the sides may match or may differ. A rule that changes at the target points to the one-sided limits.'
        ],
        mistake: 'A 0/0 result gets read as an answer, or as a limit that does not exist. A 0/0 form only says the substitution was not enough, so the work continues by reading the structure. The matching trap sits in a piecewise rule, where a finite substitution result is the value at the point and not the limit.',
        transfer: 'Take the limit of (1 − cos x)/x as x approaches 0. Direct substitution gives 0/0, and no polynomial factoring applies to a trig term. Which node lights up? Rewrite 1 − cos x as 2 sin²(x/2), simplify the fraction, and the limit is 0.'
    }
};
