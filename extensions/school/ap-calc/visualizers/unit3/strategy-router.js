/* 3.5 Derivative Strategy Router — the skill is reading the expression before
   touching it. Every card here asks for the outermost operation and the order of
   rules, never for the full derivative. The tree is the teaching medium: a picked
   rule either lights up a real layer or it does not. */

/* The outer function's rule and the composition check are two separate questions.
   Naming the outer rule never cancels the chain rule, so an expression can use
   both. The router below asks one question at a time instead of forcing a single
   choice between Power Rule and Chain Rule. */
/* A procedure is the problem-level route (for a composite, the Chain Rule). The
   outer derivative rule is the rule for the outer function only (Power Rule or a
   known rule). They are different levels, so naming the outer rule never cancels
   the Chain Rule. compose says whether the input is more complicated than x. */
const OUTER = {
    power: 'Power Rule',
    known: 'The known-function rule (ln, sine, cosine, exponential)'
};

const EXPR = {
    xsin3: {
        text: '(x sin x)³',
        valid: ['chain'],
        outer: 'power', inner: 'x sin x', compose: true,
        layer: { chain: 'root', power: 'root', product: 'prod', known: 'lsin' },
        plan: ['chain rule on the outer cube', 'product rule on x sin x', 'known rules on x and sin x'],
        reveal: ['Outer function: the cube, so the Power Rule gives 3(x sin x)².',
            'Is the input more complicated than just x? Yes. It is the group x sin x, so the Chain Rule multiplies by sin x + x cos x.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the Power Rule.',
            'dy/dx = 3(x sin x)² · (sin x + x cos x)'],
        tree: () => ({
            id: 'root', e: '(x sin x)³', rule: 'a group cubed, so power rule then chain rule',
            children: [{
                id: 'prod', e: 'x sin x', rule: 'a product of two factors',
                children: [
                    { id: 'lx', e: 'x', rule: 'known rule for x' },
                    { id: 'lsin', e: 'sin x', rule: 'known rule for sin x' }
                ]
            }]
        })
    },
    x2e3x: {
        text: 'x² · e^(3x)',
        valid: ['product'],
        layer: { product: 'root', power: 'pow', chain: 'chain', known: 'chain' },
        plan: ['product rule on x² · e^(3x)', 'power rule on x²', 'chain rule on e^(3x)', 'constant multiple rule on 3x'],
        branches: {
            split: 'Split with the Product Rule',
            left: { label: 'LEFT FACTOR', e: 'x²', rule: 'Power Rule', value: "f′ = 2x" },
            right: { label: 'RIGHT FACTOR', e: 'e^(3x)', rule: 'Exponential Rule with the Chain Rule', value: "g′ = 3e^(3x)" },
            combine: "dy/dx = 2x · e^(3x) + 3x² · e^(3x)",
            final: 'dy/dx = e^(3x)(2x + 3x²)'
        },
        tree: () => ({
            id: 'root', e: 'x² · e^(3x)', rule: 'two factors multiplied',
            children: [
                { id: 'pow', e: 'x²', rule: 'power rule' },
                {
                    id: 'chain', e: 'e^(3x)', rule: 'chain rule with 3x inside',
                    children: [{ id: 'lin', e: '3x', rule: 'constant multiple' }]
                }
            ]
        })
    },
    ln1: {
        text: 'ln(1 + x²)',
        valid: ['chain'],
        outer: 'known', inner: '1 + x²', compose: true,
        layer: { chain: 'root', known: 'root', sum: 'sum', power: 'sq' },
        plan: ['chain rule on the outer ln', 'sum rule on 1 + x²', 'power rule on x²'],
        reveal: ['Outer function: the natural log, so its rule gives 1 over the group.',
            'Is the input more complicated than just x? Yes. It is the group 1 + x², so the Chain Rule multiplies by 2x.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the known-function rule.',
            'dy/dx = 1 / (1 + x²) · 2x',
            'dy/dx = 2x / (1 + x²)'],
        tree: () => ({
            id: 'root', e: 'ln(1 + x²)', rule: 'ln of a group, so chain rule',
            children: [{
                id: 'sum', e: '1 + x²', rule: 'a sum of two terms',
                children: [
                    { id: 'one', e: '1', rule: 'constant' },
                    { id: 'sq', e: 'x²', rule: 'power rule' }
                ]
            }]
        })
    },
    sincube: {
        text: 'sin(x³ + 2x)',
        valid: ['chain'],
        outer: 'known', inner: 'x³ + 2x', compose: true,
        layer: { chain: 'root', known: 'root', sum: 'sum', power: 'cube' },
        plan: ['chain rule on the outer sine', 'sum rule on x³ + 2x', 'power rule on x³ and constant multiple rule on 2x'],
        reveal: ['Outer function: the sine, so its rule gives cosine of the same group.',
            'Is the input more complicated than just x? Yes. It is the group x³ + 2x, so the Chain Rule multiplies by 3x² + 2.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the known-function rule.',
            'dy/dx = cos(x³ + 2x) · (3x² + 2)'],
        tree: () => ({
            id: 'root', e: 'sin(x³ + 2x)', rule: 'sine of a group, so chain rule',
            children: [{
                id: 'sum', e: 'x³ + 2x', rule: 'a sum of two terms',
                children: [
                    { id: 'cube', e: 'x³', rule: 'power rule' },
                    { id: 'twox', e: '2x', rule: 'constant multiple' }
                ]
            }]
        })
    },
    quotient: {
        text: '(x² + 1) / cos x',
        valid: ['quotient'],
        layer: { quotient: 'root', sum: 'num', power: 'sq', known: 'den' },
        plan: ['quotient rule on the fraction', 'sum rule on x² + 1', 'power rule on x²', 'known rule on cos x'],
        branches: {
            split: 'Split with the Quotient Rule',
            left: { label: 'TOP', e: 'x² + 1', rule: 'Power Rule and constant', value: "f′ = 2x" },
            right: { label: 'BOTTOM', e: 'cos x', rule: 'Known Rule for cosine', value: "g′ = −sin x" },
            combine: "dy/dx = (2x · cos x − (x² + 1) · (−sin x)) / cos²x",
            final: 'dy/dx = (2x cos x + (x² + 1) sin x) / cos²x'
        },
        tree: () => ({
            id: 'root', e: '(x² + 1) / cos x', rule: 'one expression over another',
            children: [
                {
                    id: 'num', e: 'x² + 1', rule: 'a sum in the numerator',
                    children: [
                        { id: 'sq', e: 'x²', rule: 'power rule' },
                        { id: 'one', e: '1', rule: 'constant' }
                    ]
                },
                { id: 'den', e: 'cos x', rule: 'known rule for cos x' }
            ]
        })
    },
    sqrt1: {
        text: '√(1 + x²)',
        valid: ['chain'],
        outer: 'power', inner: '1 + x²', compose: true,
        layer: { chain: 'root', power: 'sum', sum: 'sum' },
        plan: ['chain rule on the outer square root', 'sum rule on 1 + x²', 'power rule on x²'],
        reveal: ['Rewrite √(1 + x²) as (1 + x²)^(1/2).',
            'Outer function: the power ½, so the Power Rule gives ½(1 + x²)^(−1/2).',
            'Is the input more complicated than just x? Yes. It is the group 1 + x², so the Chain Rule multiplies by 2x.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the Power Rule.',
            'dy/dx = ½(1 + x²)^(−1/2) · 2x',
            'dy/dx = x / √(1 + x²)'],
        tree: () => ({
            id: 'root', e: '√(1 + x²) = (1 + x²)^(1/2)', rule: 'a group to the power ½, so power rule then chain rule',
            children: [{
                id: 'sum', e: '1 + x²', rule: 'a sum of two terms',
                children: [
                    { id: 'one', e: '1', rule: 'constant' },
                    { id: 'sq', e: 'x²', rule: 'power rule' }
                ]
            }]
        })
    },
    x5: {
        text: 'x⁵',
        compose: false,
        outer: 'power',
        reveal: ['The variable is the base, so the Power Rule brings 5x⁴ down.',
            'Is the input more complicated than just x? No. The power sits directly on x.',
            'So the procedure is just the Power Rule, and the Chain Rule adds no inner factor.',
            'dy/dx = 5x⁴'],
        tree: () => ({ id: 'root', e: 'x⁵', rule: 'a power of x, so the Power Rule fits with no inner factor' })
    },
    sinx: {
        text: 'sin x',
        compose: false,
        outer: 'known',
        reveal: ['The outer function is the sine, so its rule gives cosine.',
            'Is the input more complicated than just x? No. The sine takes x itself.',
            'So the procedure is just the rule for sine, and the Chain Rule adds no inner factor.',
            'dy/dx = cos x'],
        tree: () => ({ id: 'root', e: 'sin x', rule: 'the sine of x, so the known rule fits with no inner factor' })
    },
    ex: {
        text: 'eˣ',
        compose: false,
        outer: 'known',
        reveal: ['The outer function is the exponential, so its rule gives itself again.',
            'Is the input more complicated than just x? No. The exponent is just x.',
            'So the procedure is just the rule for the exponential, and the Chain Rule adds no inner factor.',
            'dy/dx = eˣ'],
        tree: () => ({ id: 'root', e: 'eˣ', rule: 'the exponential of x, so the known rule fits with no inner factor' })
    },
    xpow5: {
        text: '(x² + 1)⁵',
        compose: true,
        outer: 'power',
        reveal: ['Outer function: the fifth power, so the Power Rule gives 5(x² + 1)⁴.',
            'Is the input more complicated than just x? Yes. It is the group x² + 1, so the Chain Rule multiplies by 2x.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the Power Rule.',
            'dy/dx = 5(x² + 1)⁴ · 2x',
            'dy/dx = 10x(x² + 1)⁴'],
        tree: () => ({
            id: 'root', e: '(x² + 1)⁵', rule: 'a group to the power 5, so the Power Rule then the Chain Rule',
            children: [{
                id: 'sum', e: 'x² + 1', rule: 'a sum of two terms',
                children: [
                    { id: 'sq', e: 'x²', rule: 'power rule' },
                    { id: 'one', e: '1', rule: 'constant' }
                ]
            }]
        })
    },
    e3x: {
        text: 'e^(3x)',
        compose: true,
        outer: 'known',
        reveal: ['Outer function: the exponential, so its rule gives e^(3x) again.',
            'Is the input more complicated than just x? Yes. It is the term 3x, so the Chain Rule multiplies by 3.',
            'So the procedure is the Chain Rule, and the outer derivative rule is the known-function rule.',
            'dy/dx = e^(3x) · 3',
            'dy/dx = 3e^(3x)'],
        tree: () => ({
            id: 'root', e: 'e^(3x)', rule: 'exponential of 3x, so the known rule then the Chain Rule',
            children: [{ id: 'lin', e: '3x', rule: 'constant multiple' }]
        })
    }
};

const KEYS = Object.keys(EXPR);
const exprOf = env => EXPR[env.kase];
/* The Outer Rule mode now mixes composites and plain inputs, so the yes/no
   question has both answers. This is the teaching order, not a compose filter. */
const COMPOSITE_KEYS = ['x5', 'xpow5', 'sinx', 'sincube', 'ex', 'e3x', 'ln1', 'sqrt1'];
const BRANCH_KEYS = KEYS.filter(k => EXPR[k].branches);
const compositeOf = env => EXPR[env.kase2];

/* Unit 3 procedure families. Each card is a derivative problem of a different
   kind. The student first names the family, then the routed procedure appears. */
const FAM = {
    composite: {
        text: 'y = (x² + 1)⁵',
        given: ['y = (x² + 1)⁵'],
        family: 'Explicit composite',
        q: 'What kind of derivative problem is y = (x² + 1)⁵?',
        choices: [
            'Explicit composite. A group x² + 1 sits inside a power, so the chain rule routes the work.',
            'Implicit relation. Two variables appear, so I differentiate both sides.',
            'Inverse procedure. A return value is given, so I read the inverse derivative from a table.',
            'Quotient. Two expressions are stacked over a fraction bar.'
        ], a: 0,
        whyBy: [
            'y is written directly as a power of a group, which is the definition of a composite. The outer power and the inner group call for the chain rule.',
            'y is already isolated on the left, so nothing is hidden inside the relation. This is not implicit.',
            'No table and no inverse sign appear, so the inverse procedure does not apply.',
            'There is no fraction in this expression, so the quotient rule does not apply.'
        ],
        route: [
            { t: 'Family: explicit composite, so the procedure is the Chain Rule', hl: true, color: 'accent' },
            { t: 'Outer derivative rule: Power Rule. The power 5 comes down  →  5(x² + 1)⁴', rule: 'power' },
            { t: 'Inner derivative: the group x² + 1 gives 2x', rule: 'chain' },
            { t: 'dy/dx = 5(x² + 1)⁴ · 2x' },
            { t: 'dy/dx = 10x(x² + 1)⁴', hl: true }
        ]
    },
    implicit: {
        text: 'x² + y² = 25',
        given: ['x² + y² = 25'],
        family: 'Implicit relation',
        q: 'What kind of derivative problem is x² + y² = 25?',
        choices: [
            'Implicit relation. x and y are tied together in one equation, so I differentiate both sides.',
            'Explicit composite. One side is a power of a group, so I use the chain rule on it alone.',
            'Quotient. Two expressions are stacked over a fraction bar.',
            'Inverse procedure. A return value is given, so I read the inverse derivative from a table.'
        ], a: 0,
        whyBy: [
            'y is not isolated from x, so y is a hidden function of x. Differentiate both sides and collect dy/dx.',
            'There is no single outer power applied to a group here. The two variables sit in one equation.',
            'Nothing is written over a fraction bar, so the quotient rule does not apply.',
            'No table and no inverse sign appear, so the inverse procedure does not apply.'
        ],
        route: [
            { t: 'Family: implicit relation, so differentiate both sides', hl: true, color: 'accent' },
            { t: 'd/dx(x²) + d/dx(y²) = d/dx(25)', rule: 'sum' },
            { t: '2x + 2y · dy/dx = 0' },
            { t: '2y · dy/dx = −2x' },
            { t: 'dy/dx = −x / y', hl: true }
        ]
    },
    inverse: {
        text: 'f(2) = 7 and f′(2) = 4. Find (f⁻¹)′(7).',
        given: ['A table gives f(2) = 7 and f′(2) = 4.', 'Find (f⁻¹)′(7).'],
        family: 'Inverse function',
        q: 'What kind of derivative problem is finding (f⁻¹)′(7) from a table?',
        choices: [
            'Inverse procedure. An inverse value is asked, so I use (f⁻¹)′(b) = 1 / f′(a).',
            'Implicit relation. Two variables appear, so I differentiate both sides.',
            'Explicit composite. A group sits inside a power, so I use the chain rule.',
            'Product. Two factors are multiplied, so I use the product rule.'
        ], a: 0,
        whyBy: [
            'The prime sits on an inverse function at a return value, which is the inverse derivative procedure.',
            'y is not hidden inside an equation here, so implicit differentiation does not apply.',
            'No group sits inside a power, so the chain rule is not the route.',
            'Nothing is multiplied as two x-dependent factors, so the product rule does not apply.'
        ],
        route: [
            { t: 'Family: inverse function, so (f⁻¹)′(b) = 1 / f′(a)', hl: true, color: 'accent' },
            { t: 'f(2) = 7, so a = 2 and b = 7' },
            { t: 'f′(2) = 4' },
            { t: '(f⁻¹)′(7) = 1 / f′(2)', rule: 'inverse' },
            { t: '(f⁻¹)′(7) = 1 / 4', hl: true }
        ]
    },
    arcsin: {
        text: 'y = arcsin(3x)',
        given: ['y = arcsin(3x)'],
        family: 'Inverse trig rule plus chain',
        q: 'What kind of derivative problem is y = arcsin(3x)?',
        choices: [
            'Inverse trig rule plus chain. The argument 3x is a function of x, so the inverse trig rule needs the chain rule.',
            'Implicit relation. Two variables appear, so I differentiate both sides.',
            'Quotient. Two expressions are stacked over a fraction bar.',
            'Explicit composite. A group sits inside a power, so I use only the power rule.'
        ], a: 0,
        whyBy: [
            'The outer rule is the arcsin rule, and the input 3x has its own derivative 3, so the chain rule is required.',
            'y is isolated on the left, so this is not implicit.',
            'No fraction bar is present in the given expression, so the quotient rule is not the entry.',
            'arcsin is not a power rule, and the input 3x still forces the chain rule.'
        ],
        route: [
            { t: 'Family: inverse trig rule, and the input 3x forces the chain rule', hl: true, color: 'accent' },
            { t: 'd/dx arcsin(u) = u′ / √(1 − u²)', rule: 'arcsin' },
            { t: 'u = 3x, so u′ = 3 and u² = 9x²' },
            { t: 'dy/dx = 3 / √(1 − 9x²)', hl: true }
        ]
    },
    product: {
        text: 'y = x² eˣ',
        given: ['y = x² eˣ'],
        family: 'Product',
        q: 'What kind of derivative problem is y = x² eˣ?',
        choices: [
            'Product. Two factors x² and eˣ are multiplied, so the product rule splits the work.',
            'Quotient. Two expressions are stacked over a fraction bar.',
            'Implicit relation. Two variables appear, so I differentiate both sides.',
            'Inverse procedure. A return value is given, so I read the inverse derivative from a table.'
        ], a: 0,
        whyBy: [
            'Both x² and eˣ depend on x and they are multiplied, which is exactly the product rule.',
            'Nothing is written over a fraction bar, so the quotient rule does not apply.',
            'y is isolated on the left, so this is not implicit.',
            'No inverse or table value appears, so the inverse procedure does not apply.'
        ],
        route: [
            { t: 'Family: product, so the product rule splits two branches', hl: true, color: 'accent' },
            { t: 'LEFT FACTOR x²  →  2x', rule: 'power' },
            { t: 'RIGHT FACTOR eˣ  →  eˣ', rule: 'known' },
            { t: 'dy/dx = 2x · eˣ + x² · eˣ' },
            { t: 'dy/dx = eˣ(2x + x²)', hl: true }
        ]
    },
    quotient: {
        text: 'y = (x² + 1) / cos x',
        given: ['y = (x² + 1) / cos x'],
        family: 'Quotient',
        q: 'What kind of derivative problem is y = (x² + 1) / cos x?',
        choices: [
            'Quotient. One expression in x sits over another, so the quotient rule splits top and bottom.',
            'Product. Two factors are multiplied, so the product rule splits the work.',
            'Implicit relation. Two variables appear, so I differentiate both sides.',
            'Inverse procedure. A return value is given, so I read the inverse derivative from a table.'
        ], a: 0,
        whyBy: [
            'The numerator x² + 1 and the denominator cos x both depend on x, and no algebra cancels the fraction, so the quotient rule is the route.',
            'The two x-dependent expressions are divided, not multiplied, so the product rule is not the entry.',
            'y is isolated on the left, so this is not implicit.',
            'No inverse or table value appears, so the inverse procedure does not apply.'
        ],
        route: [
            { t: 'Family: quotient, so the quotient rule splits top and bottom', hl: true, color: 'accent' },
            { t: 'TOP x² + 1  →  2x', rule: 'power' },
            { t: 'BOTTOM cos x  →  −sin x', rule: 'known' },
            { t: 'dy/dx = (2x · cos x − (x² + 1) · (−sin x)) / cos²x' },
            { t: 'dy/dx = (2x cos x + (x² + 1) sin x) / cos²x', hl: true }
        ]
    }
};

const FAM_KEYS = ['composite', 'implicit', 'inverse', 'arcsin', 'product', 'quotient'];

/* Same tree, revealed one layer at a time. The Layers refresher is short here,
   because section 3.1 already teaches the chain rule in depth. */
function zoomTree(env) {
    const st = Math.round(env.stage);
    const leaves = [
        { id: 'lx', e: 'x', rule: 'known rule for x' },
        { id: 'lsin', e: 'sin x', rule: 'known rule for sin x' }
    ];
    const prod = { id: 'prod', e: 'x sin x', rule: 'a product of two factors', dim: st < 1, children: st >= 1 ? leaves : undefined };
    return {
        id: 'root', e: '(x sin x)³', rule: st >= 1 ? 'a group cubed, so power rule then chain rule' : 'What is the outermost operation?',
        dim: st >= 1, children: st >= 1 ? [prod] : undefined
    };
}

function branchOf(env) {
    return EXPR[env.kase3];
}

function branchLines(c) {
    const b = c.branches;
    return [
        { t: '1. ' + b.split, hl: true, color: 'accent' },
        { t: b.left.label + '  ' + b.left.e, rule: b.left.rule },
        { t: b.left.value },
        { t: b.right.label + '  ' + b.right.e, rule: b.right.rule },
        { t: b.right.value },
        { t: 'Combine the two branches' },
        { t: b.combine },
        { t: b.final, hl: true }
    ];
}

/* The plan stays hidden until the student has set both answers. The dim lines
   echo the student's own choices, so nothing leaks the correct routing. */
function compositePane(env) {
    const c = compositeOf(env);
    if (env.stage >= 1) {
        return c.reveal.map((t, i) => ({ t, hl: i === c.reveal.length - 1, color: i === 0 ? 'accent' : 'auxInk' }));
    }
    return [
        { t: 'Outer derivative rule you chose: ' + OUTER[env.outer], dim: true },
        { t: 'Is the input more complicated than just x? ' + env.inner, dim: true }
    ];
}

function branchPane(env) {
    const c = branchOf(env);
    if (env.stage >= 1) return branchLines(c);
    return [{ t: '1. ' + c.branches.split, dim: true }, { t: 'Split the expression, then work on each branch.', dim: true }];
}

export default {
    id: 'u3-derivative-strategy',
    meta: { unit: 3, topic: '3.5', title: 'Selecting Procedures for Calculating Derivatives', visualizerTitle: 'Derivative Strategy Router' },
    modes: [
        {
            label: 'Zoom the Layers',
            intro: 'Read (x sin x)³ from the outside in, one layer at a time. This refresher is kept short on purpose, because the mixed classification mode below is the real work of 3.5.',
            params: { stage: 0 },
            controls: [
                {
                    key: 'stage', label: 'zoom level', kind: 'choice',
                    options: [
                        { v: 0, label: 'outer only' },
                        { v: 1, label: 'show the plan' }
                    ]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'tree', title: () => 'Zoom the Layers: ' + EXPR.xsin3.text,
                        root: env => zoomTree(env),
                        focus: env => Math.round(env.stage) >= 1 ? 'root' : null
                    },
                    {
                        kind: 'eq', title: 'Procedure and outer derivative rule',
                        lines: env => Math.round(env.stage) >= 1
                            ? EXPR.xsin3.reveal.map((t, i) => ({ t, hl: i === EXPR.xsin3.reveal.length - 1, color: i === 0 ? 'accent' : 'auxInk' }))
                            : [{ t: 'Name the outer derivative rule and judge the input in the next step first.', dim: true }]
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'Keep it brief',
                        text: 'Section 3.1 teaches the chain rule in depth. Here one quick look at the layers is enough, and the time goes to routing every kind of Unit 3 derivative problem.'
                    }
                ]
            },
            steps: [
                {
                    params: { stage: 1 },
                    predict: {
                        q: 'Which rules apply to y = (x sin x)³?',
                        choices: [
                            'The Power Rule and the Chain Rule. The outer derivative rule is the Power Rule, and the input x sin x is more complicated than just x.',
                            'The Product Rule only. The factors x and sin x are multiplied.',
                            'The Power Rule only. The 3 comes down and an x³ term appears.'
                        ], a: 0,
                        whyBy: [
                            'The cube is the outer operation, so the outer derivative rule is the Power Rule, giving 3(x sin x)². The group x sin x is more complicated than just x, so the Chain Rule joins as the procedure and multiplies by its derivative.',
                            'The product x sin x is real, but it is the inner function, reached after the outer power comes down. The product rule is a later move, not the only rule.',
                            'There is no x³ term in this expression. The exponent sits on the whole group x sin x.'
                        ]
                    },
                    message: 'The outer derivative rule is the Power Rule, and the input x sin x is more complicated than just x, so the Chain Rule joins as the procedure. Section 3.1 covers the full layer walk, so 3.5 moves on to routing every problem type.'
                }
            ],
            summary: {
                idea: 'Read the outer operation first, then move inward. The structure of the expression fixes the rule order.',
                mistake: 'Students reach for the rule for the first symbol they notice and skip the outer layer.',
                transfer: 'Name the procedure and the outer derivative rule for (x² + 1)⁵ and for sin(x³ + 2x).'
            }
        },
        {
            label: 'Classify the Problem',
            intro: 'Unit 3 mixes several kinds of derivative problem. Before any rule runs, name the family: explicit composite, implicit relation, inverse function, inverse trig, product, or quotient. Then reveal the routed procedure.',
            params: { fam: 'composite', stage: 0 },
            controls: [
                {
                    key: 'fam', label: 'problem', kind: 'choice',
                    options: FAM_KEYS.map(k => ({ v: k, label: FAM[k].text }))
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'eq', title: 'The problem',
                        lines: env => FAM[env.fam].given.map(t => ({ t }))
                    },
                    {
                        kind: 'eq', title: 'The routed procedure',
                        lines: env => env.stage >= 1
                            ? FAM[env.fam].route
                            : [{ t: 'Name the family in the next step, then reveal the procedure.', dim: true }]
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'How to classify',
                        text: 'Ask three questions in order. Is y already isolated on one side? Do two x-dependent parts multiply or divide? Is an inverse or a return value involved? The answers pick the family, and the family picks the rule.'
                    },
                    {
                        kind: 'note', title: 'Implicit and inverse are in scope',
                        text: 'This router now covers the derivative procedures learned through Topic 3.5. An equation that ties x and y together calls for implicit differentiation. A prime on an inverse function calls for the inverse procedure. An arcsin with an expression inside calls for the inverse trig rule plus the chain rule.'
                    }
                ]
            },
            steps: [
                { params: { stage: 1 }, predict: FAM.composite, message: 'Explicit composite. y is written directly as a power of a group, so the chain rule routes the work. The outer power comes down, and the inner 2x multiplies along.' },
                { params: { fam: 'implicit', stage: 0 }, message: 'Next problem. Decide which family it belongs to, then reveal the routed procedure.' },
                { params: { stage: 1 }, predict: FAM.implicit, message: 'Implicit relation. y is hidden inside the equation with x, so differentiate both sides. A dy/dx term appears when the y part is differentiated, and solving collects it.' },
                { params: { fam: 'inverse', stage: 0 }, message: 'Next problem. Decide which family it belongs to, then reveal the routed procedure.' },
                { params: { stage: 1 }, predict: FAM.inverse, message: 'Inverse procedure. The prime sits on an inverse function at a return value, so (f⁻¹)′(7) = 1 / f′(2) = 1 / 4.' },
                { params: { fam: 'arcsin', stage: 0 }, message: 'Next problem. Decide which family it belongs to, then reveal the routed procedure.' },
                { params: { stage: 1 }, predict: FAM.arcsin, message: 'Inverse trig rule plus chain. The arcsin rule gives 3 over √(1 − 9x²), because the input 3x contributes its own derivative 3.' },
                { params: { fam: 'product', stage: 0 }, message: 'Next problem. Decide which family it belongs to, then reveal the routed procedure.' },
                { params: { stage: 1 }, predict: FAM.product, message: 'Product. Two x-dependent factors multiply, so the product rule splits them. The Power Rule and the exponential rule finish the two branches.' },
                { params: { fam: 'quotient', stage: 0 }, message: 'Next problem. Decide which family it belongs to, then reveal the routed procedure.' },
                { params: { stage: 1 }, predict: FAM.quotient, message: 'Quotient. The numerator and the denominator both depend on x, and no algebra cancels the fraction, so the quotient rule splits top and bottom.' }
            ],
            summary: {
                idea: 'Name the problem family first, then choose the rule. Classification is the step that ties implicit, inverse, and inverse trig to the rules from 2.5 and 3.1.',
                mistake: 'Students reach for a rule from the first symbol they see, and miss that y is hidden inside an equation or that a prime sits on an inverse function.',
                transfer: 'Sort each new problem into one family before differentiating, then check the routed procedure against your own answer.'
            }
        },
        {
            label: 'Outer Rule and Composition',
            intro: 'Two questions route every expression here. First, what is the derivative rule for the outer function? Second, is the input more complicated than just x? When the input is just x, the outer rule finishes the job and the Chain Rule adds no factor. When the input is more complicated, the Chain Rule joins on top of the outer rule.',
            params: { kase2: 'x5', inner: 'no', outer: 'power', stage: 0 },
            controls: [
                {
                    key: 'kase2', label: 'expression', kind: 'choice',
                    options: COMPOSITE_KEYS.map(k => ({ v: k, label: EXPR[k].text }))
                },
                {
                    key: 'outer', label: 'outer derivative rule', kind: 'choice',
                    options: Object.keys(OUTER).map(k => ({ v: k, label: OUTER[k] }))
                },
                {
                    key: 'inner', label: 'is the input more complicated than just x', kind: 'choice',
                    options: [ { v: 'no', label: 'no' }, { v: 'yes', label: 'yes' } ]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'tree', title: env => 'Structure of ' + compositeOf(env).text,
                        root: env => compositeOf(env).tree(),
                        focus: () => null
                    },
                    {
                        kind: 'eq', title: 'Procedure and outer derivative rule',
                        lines: env => compositePane(env)
                    }
                ],
                side: [
                    {
                        kind: 'checklist', title: 'Check the two questions', when: env => env.stage >= 1,
                        items: env => {
                            const c = compositeOf(env);
                            const want = c.compose ? 'yes' : 'no';
                            return [
                                { t: 'Outer derivative rule: ' + OUTER[c.outer], state: env.outer === c.outer },
                                { t: c.compose ? 'The input is more complicated than x, so the Chain Rule joins' : 'The input is just x, so the Chain Rule adds no factor', state: env.inner === want }
                            ];
                        },
                        verdict: env => {
                            const c = compositeOf(env);
                            const want = c.compose ? 'yes' : 'no';
                            return env.outer === c.outer && env.inner === want
                                ? 'Correct. The outer derivative rule is ' + OUTER[c.outer] + '. ' + (c.compose ? 'The input is more complicated than x, so the procedure is the Chain Rule on top of that outer rule.' : 'The input is just x, so no Chain Rule factor appears.')
                                : 'Adjust one answer. The outer derivative rule is ' + OUTER[c.outer] + ', and the correct reply to the input question is ' + want + '.';
                        },
                        verdictOk: env => {
                            const c = compositeOf(env);
                            const want = c.compose ? 'yes' : 'no';
                            return env.outer === c.outer && env.inner === want;
                        }
                    },
                    {
                        kind: 'note', title: 'Two questions, not one',
                        text: 'Naming the outer derivative rule does not cancel the Chain Rule. The Chain Rule joins only when the input is more complicated than just x. For sin x and eˣ the input is just x, so no extra factor appears. For √(1 + x²) and (x² + 1)⁵ the Power Rule is the correct outer rule, and the Chain Rule is required on top of it.'
                    }
                ]
            },
            steps: [
                { params: { stage: 1 }, message: 'For x⁵ the variable is the base, so the Power Rule gives 5x⁴. The input is just x, so the Chain Rule adds no factor.' },
                { params: { kase2: 'xpow5', outer: 'power', inner: 'yes', stage: 0 }, message: 'Switch to (x² + 1)⁵. The base is the group x² + 1, not plain x. Name the outer derivative rule, then judge the input.' },
                { params: { stage: 1 }, message: 'The outer derivative rule for (x² + 1)⁵ is the Power Rule. The input x² + 1 is more complicated than x, so the Chain Rule multiplies by 2x. The procedure is the Chain Rule, and the result is 10x(x² + 1)⁴.' },
                { params: { kase2: 'sinx', outer: 'known', inner: 'no', stage: 0 }, message: 'Switch to sin x. Name the outer derivative rule, then judge the input.' },
                { params: { stage: 1 }, message: 'The sine rule gives cos x. The input is just x, so there is no inner factor and the Chain Rule never joins.' },
                { params: { kase2: 'sincube', outer: 'known', inner: 'yes', stage: 0 }, message: 'Switch to sin(x³ + 2x). Same outer rule as sin x, but now look at the input.' },
                { params: { stage: 1 }, message: 'The sine rule gives cosine of the group, and the input x³ + 2x is more complicated than x, so the Chain Rule multiplies by 3x² + 2. Same outer rule as sin x, and here the Chain Rule joins.' },
                { params: { kase2: 'ex', outer: 'known', inner: 'no', stage: 0 }, message: 'Switch to eˣ. Name the outer derivative rule, then judge the input.' },
                { params: { stage: 1 }, message: 'The exponential rule gives eˣ. The input is just x, so the Chain Rule adds no factor.' },
                { params: { kase2: 'e3x', outer: 'known', inner: 'yes', stage: 0 }, message: 'Switch to e^(3x). The outer rule looks the same, so the input is what decides.' },
                { params: { stage: 1 }, message: 'The exponential rule gives e^(3x), and the input 3x is more complicated than x, so the Chain Rule multiplies by 3. The answer is 3e^(3x).' },
                { params: { kase2: 'ln1', outer: 'known', inner: 'yes', stage: 0 }, message: 'Switch to ln(1 + x²). Name the outer derivative rule, then judge the input.' },
                { params: { stage: 1 }, message: 'The ln rule gives 1 over the group, and the input 1 + x² is more complicated than x, so the Chain Rule multiplies by 2x. Both rules apply.' },
                { params: { kase2: 'sqrt1', outer: 'power', inner: 'yes', stage: 0 }, message: 'Now the square root. This is the case a single-choice router used to get wrong.' },
                { params: { stage: 1 }, message: 'The Power Rule is correct here, and it is not wrong to choose it. Because the input 1 + x² is more complicated than x, the Chain Rule also applies. The answer is Power Rule plus Chain Rule.' }
            ],
            summary: {
                idea: 'A composite is routed by two facts, not one choice. The outer function has an outer derivative rule, and the input may be more complicated than just x. When both hold, the Chain Rule joins the outer rule.',
                mistake: 'Students believe that choosing the Power Rule means the Chain Rule is cancelled. They then drop the inner derivative and stop too early.',
                transfer: 'For sin(x³ + 2x), for (x² + 1)⁵, and for eˣ, state the outer derivative rule and judge the input before differentiating, then multiply by the inner derivative only when the input is more complicated than x.'
            }
        },
        {
            label: 'Branch the Rule Order',
            intro: 'A product or a quotient does not have one rule after another. It splits into branches that finish in parallel. Read each branch on its own.',
            params: { kase3: 'x2e3x', stage: 0 },
            controls: [
                {
                    key: 'kase3', label: 'expression', kind: 'choice',
                    options: BRANCH_KEYS.map(k => ({ v: k, label: EXPR[k].text }))
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'tree', title: env => 'Structure of ' + branchOf(env).text,
                        root: env => branchOf(env).tree(),
                        focus: () => null
                    },
                    {
                        kind: 'eq', title: 'The branch tasks',
                        lines: env => branchPane(env)
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'Two branches, not one path',
                        text: 'After the split, the two branches are differentiated in parallel. Each branch keeps its own rule. There is no line where one branch must finish before the other branch starts.'
                    }
                ]
            },
            steps: [
                { params: { stage: 1 }, message: 'The Product Rule splits two branches. The LEFT FACTOR x² uses the Power Rule. The RIGHT FACTOR e^(3x) uses the exponential rule with the Chain Rule. The two branches finish in parallel, and the combine line adds them.' },
                { params: { kase3: 'quotient', stage: 0 }, message: 'Switch to the quotient. Split with the Quotient Rule, then read each branch on its own.' },
                { params: { stage: 1 }, message: 'The Quotient Rule splits the fraction. The TOP x² + 1 gives 2x, and the BOTTOM cos x gives −sin x. Each branch finishes on its own, then the combine line applies the Quotient Rule.' }
            ],
            summary: {
                idea: 'A product or quotient splits into branches. Split first, then differentiate each branch with its own rule, and combine at the end.',
                mistake: 'Students write one long arrow chain, as if one branch had to finish before the other branch could start. The branches are parallel, not sequential.',
                transfer: 'Draw the branches for x² · e^(3x) and for (x² + 1) / cos x before you calculate anything.'
            }
        },
        {
            label: 'Plans and Choices',
            intro: 'The structure of a problem usually fixes the procedure you run, such as the Chain Rule or the Product Rule. Every composite also has a separate outer derivative rule, which the last mode matched up. Sometimes the very first move is algebra, a simplify or rewrite before any rule runs. This mode lists each procedure, then shows when rewriting beats a rule.',
            params: { reveal: 0 },
            controls: [
                {
                    key: 'reveal', label: 'show the procedure column', kind: 'choice',
                    options: [
                        { v: 0, label: 'hide the column' },
                        { v: 1, label: 'show the column' }
                    ]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'table', title: 'The procedure for each problem family',
                        cols: ['problem', 'family', 'procedure'],
                        rows: env => FAM_KEYS.map(k => {
                            const procedure = {
                                composite: 'Chain Rule',
                                implicit: 'Differentiate both sides',
                                inverse: '(f⁻¹)′(b) = 1 / f′(a)',
                                arcsin: 'Inverse trig rule and Chain Rule',
                                product: 'Product Rule',
                                quotient: 'Quotient Rule'
                            }[k];
                            return [FAM[k].text, FAM[k].family, env.reveal > 0.5 ? procedure : 'not shown yet'];
                        })
                    },
                    {
                        kind: 'eq', title: 'Step 1. Can I simplify or rewrite first?',
                        lines: [
                            { t: 'x² / x = x, so the Power Rule finishes it. No Quotient Rule.' },
                            { t: '(x² + 1) / x = x + x⁻¹, so the Sum Rule finishes it. No Quotient Rule.' },
                            { t: 'Rewrite when it is shorter, then read which structure remains.', hl: true, color: 'accent' }
                        ]
                    },
                    {
                        kind: 'eq', title: 'Step 2. Which derivative structure remains?',
                        lines: [
                            { t: 'A product of two x-dependent factors  →  Product Rule' },
                            { t: 'If no useful algebraic rewrite simplifies the fraction  →  Quotient Rule' },
                            { t: 'A group inside an outer function  →  Chain Rule' }
                        ]
                    },
                    {
                        kind: 'compare', title: 'Two routes for the expression x(x + 1)',
                        sides: [
                            {
                                title: 'Product rule on x(x + 1) as written', tone: 'right',
                                lines: ['f = x, g = x + 1', "f′ = 1, g′ = 1", "product rule: 1·(x + 1) + x·1", 'result 2x + 1']
                            },
                            {
                                title: 'Expand first, then the power rule', tone: 'right',
                                lines: ['x(x + 1) = x² + x', 'power rule on x²', 'known rule on x', 'result 2x + 1']
                            }
                        ],
                        verdict: 'Both routes are correct, and the expansion route is shorter. So expanding x(x + 1) first is the more direct choice here. That does not make the product rule route wrong.'
                    },
                    {
                        kind: 'practice', id: 'u3-strategy-transfer', title: 'Practice: read the structure first',
                        items: [
                            {
                                q: 'What is the outermost operation of e^(x² sin x)?',
                                choices: [
                                    'The exponential is applied to the whole group x² sin x. So the chain rule comes first.',
                                    'The product x² sin x sits inside the exponent. So the product rule comes first.',
                                    'The power x² sits inside that product. So the power rule comes first.'
                                ], a: 0,
                                whyBy: [
                                    'The exponent x² sin x is built first, and the exponential is applied last, so the exponential is differentiated first. The chain rule passes the exponent to the product rule.',
                                    'The product x² sin x sits inside the exponent. The chain rule reaches that product second.',
                                    'The power x² sits inside the product, and the product sits inside the exponent. The power rule is three layers down.'
                                ]
                            },
                            {
                                q: 'Which order of rules differentiates e^(x² sin x) completely?',
                                choices: [
                                    'The chain rule starts. Then the product rule works on the exponent x² sin x. The power rule and the rule for sin x finish the work.',
                                    'The product rule starts. Then the chain rule works on the exponent x² sin x. The known rules for x and sin x finish the work.',
                                    'The chain rule starts. Then the sum rule works on the exponent x² sin x. The quotient rule finishes the work.'
                                ], a: 0,
                                whyBy: [
                                    'The derivative of e^u is e^u · u′. Here the exponent u = x² sin x is a product. The product rule gives u′ = x² · cos x + 2x · sin x, so every layer is used.',
                                    'The product x² sin x is inside the exponent, so the product is not the outer layer. The product rule cannot apply before the chain rule.',
                                    'The expression e^(x² sin x) has no quotient anywhere. Its top level is an exponential, and the sum appears only when the product rule is applied.'
                                ]
                            },
                            {
                                q: 'You need the derivative of (x² + 1) / 3. Which first step saves work?',
                                choices: [
                                    'Rewrite it as (1/3)(x² + 1). The denominator has no x, so the sum rule finishes the job and the quotient rule is never needed.',
                                    'Apply the quotient rule. Any expression written as a fraction calls for the quotient rule.',
                                    'Apply the product rule to x² + 1 and 3. The 3 is a second factor.'
                                ], a: 0,
                                whyBy: [
                                    'Dividing by the constant 3 is the same as multiplying by 1/3. Then the derivative is (1/3) · 2x = 2x/3, and no quotient rule appears.',
                                    'The denominator is the constant 3, so the rewrite is shorter and safer. The Quotient Rule is only needed when a real quotient of two x-dependent expressions remains.',
                                    'The 3 is a constant multiple, not a factor that changes with x. Differentiating it alone would give 0 and wreck the expression.'
                                ]
                            },
                            {
                                q: 'Which rules differentiate 4x⁵ − 3x + 7?',
                                choices: [
                                    'The Constant Multiple Rule, the Sum Rule, and the Power Rule. The answer is 20x⁴ − 3, and no Chain Rule, Product Rule, or Quotient Rule is needed.',
                                    'The Product Rule. The number 4 and the term x⁵ are multiplied.',
                                    'The Chain Rule. The exponent 5 hides an inner function.'
                                ], a: 0,
                                whyBy: [
                                    'Each term is a constant times a power of x. The Power Rule brings down each exponent, so the derivative is 20x⁴ − 3 with no advanced rule.',
                                    'The 4 is a constant coefficient on x⁵, not a second factor that depends on x. A constant times a function uses the Constant Multiple Rule, not the Product Rule.',
                                    'In x⁵ the input is just x, so there is no inner function and the Chain Rule adds no factor.'
                                ]
                            },
                            {
                                q: 'Which rules differentiate eˣ + sin x?',
                                choices: [
                                    'The Sum Rule with the two known rules. The answer is eˣ + cos x, and no Chain Rule factor appears.',
                                    'The Chain Rule. Each term hides an inner function behind the outer one.',
                                    'The Product Rule. The terms eˣ and sin x are multiplied together.'
                                ], a: 0,
                                whyBy: [
                                    'The terms are added, and the input to each known function is just x. The derivative is eˣ + cos x, so no Chain Rule factor appears.',
                                    'The input to eˣ and to sin x is only x, so neither term has an inner function for the Chain Rule to multiply.',
                                    'The two terms are joined by a plus sign, not multiplied, so the Product Rule does not apply.'
                                ]
                            }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'Algebra can change the route',
                        text: 'Rewriting an expression with algebra can change which rules apply. The product x(x + 1) and the sum x² + x have the same derivative, so one route can be more direct without the other route being wrong.'
                    },
                    {
                        kind: 'note', title: 'When the Quotient Rule earns its place',
                        text: 'If useful algebra does not simplify the expression first, a quotient of two x-dependent expressions can be differentiated directly with the Quotient Rule. That is the case for (x² + 1) / cos x, where nothing cancels. A denominator containing x is not, on its own, a reason to reach for the rule.'
                    }
                ]
            },
            steps: [
                {
                    params: { reveal: 0 },
                    message: 'The procedure column is hidden. Say each procedure out loud from the problem alone, starting with the structure, then show the column to check.'
                },
                {
                    params: { reveal: 1 },
                    message: 'Every procedure starts by reading the problem type. For a fraction, the very first move is to ask whether algebra already removes it.'
                },
                {
                    params: {},
                    message: 'The x(x + 1) card is the case where rewrite first wins. Both routes give the derivative 2x + 1. Choose the route that needs fewer rules, not the route the chapter listed first. Some problems need no advanced rule at all. Then answer the five questions under "Practice: read the structure first".'
                }
            ],
            summary: {
                idea: 'Choosing a procedure means reading the problem type first, then checking whether algebra simplifies the expression before any derivative rule runs.',
                mistake: 'Students apply the Quotient Rule whenever they see a fraction, even when the denominator divides every term in the numerator.',
                transfer: 'Decide which of x² / x, (x² + 1) / x, and (x² + 1) / cos x actually need the Quotient Rule.'
            }
        }
    ]
};
