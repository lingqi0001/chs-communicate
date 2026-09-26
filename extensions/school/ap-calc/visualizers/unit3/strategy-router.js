/* 3.5 Derivative Strategy Router — the skill is reading the expression before
   touching it. Every card here asks for the outermost operation and the order of
   rules, never for the full derivative. The tree is the teaching medium: a picked
   rule either lights up a real layer or it does not. */

const RULE = {
    sum: 'sum or difference',
    product: 'product',
    quotient: 'quotient',
    chain: 'chain',
    power: 'power',
    known: 'known function'
};

const EXPR = {
    xsin3: {
        text: '(x sin x)³',
        valid: ['chain', 'power'],
        layer: { chain: 'root', power: 'root', product: 'prod', known: 'lsin' },
        plan: ['chain rule on the outer cube', 'product rule on x sin x', 'known rules on x and sin x'],
        tree: () => ({
            id: 'root', e: '(x sin x)³', rule: 'a product cubed, so chain rule',
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
        layer: { chain: 'root', known: 'root', sum: 'sum', power: 'sq' },
        plan: ['chain rule on the outer ln', 'sum rule on 1 + x²', 'power rule on x²'],
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
        layer: { chain: 'root', known: 'root', sum: 'sum', power: 'cube' },
        plan: ['chain rule on the outer sine', 'sum rule on x³ + 2x', 'power rule on x³ and constant multiple rule on 2x'],
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
        valid: ['chain', 'power'],
        layer: { chain: 'root', power: 'sum', sum: 'sum' },
        plan: ['chain rule on the outer square root', 'sum rule on 1 + x²', 'power rule on x²'],
        tree: () => ({
            id: 'root', e: '√(1 + x²) = (1 + x²)^(1/2)', rule: 'a group to the power ½, so chain rule',
            children: [{
                id: 'sum', e: '1 + x²', rule: 'a sum of two terms',
                children: [
                    { id: 'one', e: '1', rule: 'constant' },
                    { id: 'sq', e: 'x²', rule: 'power rule' }
                ]
            }]
        })
    }
};

const KEYS = Object.keys(EXPR);
const exprOf = env => EXPR[env.kase];

function layerOf(env) {
    const c = exprOf(env);
    return c.layer[env.pick];
}

/* Same tree, revealed one layer at a time so the reading direction is visible. */
function zoomTree(env) {
    const st = Math.round(env.stage);
    const leaves = [
        { id: 'lx', e: 'x', rule: 'known rule for x', dim: st < 4 },
        { id: 'lsin', e: 'sin x', rule: 'known rule for sin x', dim: st < 4 }
    ];
    const prod = { id: 'prod', e: 'x sin x', rule: 'a product of two factors', dim: st < 2, children: st >= 3 ? leaves : undefined };
    return {
        id: 'root', e: '(x sin x)³', rule: st >= 1 ? 'a product cubed, so chain rule' : 'What is the outermost operation?',
        dim: st >= 2, children: st >= 1 ? [prod] : undefined
    };
}

const ZOOM_FOCUS = [null, 'root', 'prod', 'prod', 'lsin', null];

const FIRST_RULE_ITEMS = [
    {
        q: 'Which rule do you apply first to (x sin x)³?',
        choices: [
            'The chain rule applies first. The product x sin x sits inside the outer cube.',
            'The product rule applies first. The factors x and sin x are multiplied.',
            'The power rule applies first. The exponent 3 sits on the whole group x sin x, not on x alone.',
            'No rule applies first. The cube of a product equals the product of the cubes.'
        ], a: 0,
        whyBy: [
            'The cube is the outer operation, so the chain rule goes first. The chain rule contributes the factor 3(x sin x)². The inside x sin x is handled next.',
            'The product rule does apply, but the product x sin x sits inside the cube. The product rule arrives as the second move, not the first move.',
            'This expression has no x³ term. The exponent sits on the whole group x sin x.',
            'Cubing the product lets you rewrite it as x³ sin³ x. That rewrite is legal. The rewrite gives a different plan, not a missing rule.'
        ]
    },
    {
        q: 'Which rule do you apply first to x² · e^(3x)?',
        choices: [
            'The product rule applies first. The factors x² and e^(3x) are multiplied.',
            'The chain rule applies first. The factor 3x sits inside the exponential.',
            'The power rule applies first. The factor x² is one of the two multiplied factors.',
            'The quotient rule applies first. The factor e^(3x) can look like a fraction over 1.'
        ], a: 0,
        whyBy: [
            'Read the expression from the outside. The last operation is the multiplication of x² and e^(3x). The product rule is the rule for that multiplication.',
            'The chain inside e^(3x) is real, but it lives in the second factor. That chain appears after the product rule splits the expression.',
            'The power rule applies to the x² branch only. The product rule reaches that x² branch first.',
            'Dividing by 1 changes nothing, so this expression is not a quotient. The expression x² · e^(3x) is a product of two factors. The product rule applies.'
        ]
    },
    {
        q: 'Which rule do you apply first to ln(1 + x²)?',
        choices: [
            'The chain rule applies first. The function ln is applied to the whole group 1 + x².',
            'The sum rule applies first. The addition 1 + x² is part of the expression.',
            'The power rule applies first. The term x² is part of the expression.',
            'No rule applies first. The expression ln(1 + x²) has nothing to differentiate.'
        ], a: 0,
        whyBy: [
            'The outer operation is ln applied to a group. The chain rule contributes the factor 1 over that group. The group then contributes its own derivative.',
            'The sum 1 + x² is inside the ln. The sum rule arrives as the inner factor of the chain rule.',
            'The power x² is one level below the sum. The power rule is reached last.',
            'The expression ln(1 + x²) is ln applied to a group that contains x. That is the case the chain rule exists for.'
        ]
    },
    {
        q: 'Which rule do you apply first to sin(x³ + 2x)?',
        choices: [
            'The chain rule applies first. The sine is applied to the group x³ + 2x.',
            'The sum rule applies first. The terms x³ and 2x are added together.',
            'The power rule applies first. The term x³ is the first term written.',
            'The product rule applies first. The factor 2 is multiplied by x.'
        ], a: 0,
        whyBy: [
            'The outer operation is sine applied to a group. The chain rule contributes the factor cosine of that same group. The group x³ + 2x is handled next.',
            'The sum x³ + 2x is inside the sine. The chain rule reaches that sum second.',
            'The power x³ is one level below the sum. The chain rule and the sum rule both arrive before the power rule.',
            'The term 2x is a constant multiple of x. It is not a product of two factors that both contain x, so the product rule never appears in this plan.'
        ]
    },
    {
        q: 'Which rule do you apply first to (x² + 1) / cos x?',
        choices: [
            'The quotient rule applies first. One expression in x sits over another expression.',
            'The chain rule applies first. The function cos x is a known function.',
            'The sum rule applies first. The terms x² and 1 are added in the numerator.',
            'The power rule applies first. The term x² is the first term written.'
        ], a: 0,
        whyBy: [
            'The last operation is the division, so the quotient rule gives the first move. The numerator and the denominator are handled after that division.',
            'The function cos x is the denominator. Its own derivative appears inside the quotient rule, not before the quotient rule.',
            'The sum x² + 1 is the numerator, which is one layer below the division.',
            'The term x² is one layer below the numerator sum. The reading order is quotient, then sum, then power.'
        ]
    },
    {
        q: 'Which rule do you apply first to √(1 + x²)?',
        choices: [
            'The chain rule applies first. The square root is the power ½ applied to 1 + x².',
            'The sum rule applies first. The addition 1 + x² is part of the expression.',
            'The power rule applies first. The term x² is raised to a power.',
            'No rule applies first. A square root is not a power of anything.'
        ], a: 0,
        whyBy: [
            'Rewrite the root as the exponent ½. The base of that power is the group 1 + x². The rule for a power of a group is the chain rule.',
            'The sum 1 + x² is inside the root. The sum rule becomes the inner factor of the chain rule.',
            'The power x² is two levels deep. The chain rule comes first, then the sum rule, then the power rule.',
            'A root is a power with exponent ½. Treating the root as a special case hides the chain rule.'
        ]
    }
];

export default {
    id: 'u3-derivative-strategy',
    meta: { unit: 3, topic: '3.5', title: 'Selecting Procedures for Calculating Derivatives', visualizerTitle: 'Derivative Strategy Router' },
    modes: [
        {
            label: 'Zoom the Layers',
            intro: 'Read an expression from the outside in. Name the outermost operation first, then move one layer inside. The expression here is (x sin x)³.',
            params: { stage: 0 },
            controls: [
                {
                    key: 'stage', label: 'zoom level', kind: 'choice',
                    options: [
                        { v: 0, label: 'expression only' },
                        { v: 1, label: 'outer layer' },
                        { v: 2, label: 'inside the cube' },
                        { v: 3, label: 'open the product' },
                        { v: 4, label: 'all layers' }
                    ]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'tree', title: env => 'Zoom level ' + Math.round(env.stage) + ' of 4: ' + EXPR.xsin3.text,
                        root: env => zoomTree(env),
                        focus: env => ZOOM_FOCUS[Math.round(env.stage)]
                    },
                    {
                        kind: 'eq', title: 'The rule each layer gives',
                        lines: env => {
                            const st = Math.round(env.stage);
                            const L = [{ t: 'y = (x sin x)³' }];
                            if (st >= 1) L.push({ t: 'the outer cube  →  the chain rule', hl: true, rule: 'first' });
                            if (st >= 2) L.push({ t: 'the inside x · sin x  →  the product rule', hl: true, rule: 'second' });
                            if (st >= 3) L.push({ t: 'the two factors x and sin x  →  the known rules', rule: 'third' });
                            if (st >= 4) {
                                L.push({ t: 'dy/dx = 3(x sin x)² · d/dx(x sin x)', color: 'auxInk' });
                                L.push({ t: 'dy/dx = 3(x sin x)² · (sin x + x cos x)', hl: true });
                            }
                            return L;
                        }
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'The reading order',
                        text: env => Math.round(env.stage) >= 4
                            ? 'The expression has three layers, so the derivative takes three moves. The product rule applies here, but the product rule applies second. The product rule does not become the first move just because x sin x is easy to see.'
                            : 'At each zoom level, ask what was done last to build the expression. The last operation is the first one to differentiate. The rule for that last operation brings the inside along as a factor.'
                    }
                ]
            },
            steps: [
                {
                    params: { stage: 1 },
                    message: 'The cube is the last operation applied to x sin x, so the cube is differentiated first. The rule for a power applied to a group is the chain rule.'
                },
                {
                    params: { stage: 2 },
                    predict: {
                        q: 'Which rule do you apply first to y = (x sin x)³?',
                        choices: [
                            'The chain rule applies first. The product x sin x sits inside the outer cube.',
                            'The product rule applies first. The factors x and sin x are multiplied.',
                            'The power rule applies first. The exponent 3 sits on the whole group x sin x, not on x alone.'
                        ], a: 0,
                        whyBy: [
                            'The outermost operation is the cube of a group, so the chain rule starts. The product inside is the second move.',
                            'The multiplication x sin x is real, but it sits inside the cube. The product rule is reached after the outer power comes down.',
                            'This expression has no x³ term. The exponent sits on the group x sin x, and that group is why the outer rule is a chain rule.'
                        ]
                    },
                    message: 'The group inside the cube is x sin x, and that group is a product. The chain rule has used its move. Now the product rule works inside.'
                },
                {
                    params: { stage: 3 },
                    message: 'The product splits into two branches, x and sin x. Each branch has its own rule. The two branches combine only through the product rule above them.'
                },
                {
                    params: { stage: 4 },
                    message: 'The cube gives the factor 3(x sin x)². The product gives the factor sin x + x cos x. The structure of the expression chose this order, so there was nothing to guess.'
                }
            ],
            summary: {
                idea: 'Derivative rules follow expression structure. Identify the outer operation first, then move inward.',
                mistake: 'Students choose the rule for the first symbol they notice. The product x sin x is easy to see, so they reach for the product rule. That choice skips the outer cube.',
                transfer: 'Read (x² + 1)⁵ and sin(x) · x² the same way. Say which expression needs the chain rule first, and which expression starts with the product rule.'
            }
        },
        {
            label: 'Pick the First Rule',
            intro: 'Pick the rule you would apply first. A correct choice names a real layer of the expression. You only make the choice, so no derivative is calculated.',
            params: { kase: 'xsin3', pick: 'chain' },
            controls: [
                {
                    key: 'kase', label: 'expression', kind: 'choice',
                    options: KEYS.map(k => ({ v: k, label: EXPR[k].text }))
                },
                {
                    key: 'pick', label: 'rule to apply first', kind: 'choice',
                    options: Object.keys(RULE).map(k => ({ v: k, label: RULE[k] }))
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'tree', title: env => 'Structure of ' + exprOf(env).text,
                        root: env => exprOf(env).tree(),
                        focus: env => layerOf(env) || null
                    },
                    {
                        kind: 'eq', title: 'The rule plan for this expression',
                        lines: env => exprOf(env).plan.map((p, i) => ({
                            t: (i + 1) + '. ' + p,
                            hl: i === 0,
                            color: i === 0 ? 'accent' : 'auxInk'
                        }))
                    },
                    {
                        kind: 'practice', id: 'u3-strategy-first-rule', title: 'Choose the first rule for each expression',
                        items: FIRST_RULE_ITEMS
                    }
                ],
                side: [
                    {
                        kind: 'checklist', title: 'Check the rule you chose',
                        items: env => {
                            const c = exprOf(env);
                            return [
                                { t: 'The ' + RULE[env.pick] + ' rule applies somewhere inside ' + c.text, state: !!c.layer[env.pick] },
                                { t: 'The chosen rule is the outermost rule for this expression', state: c.valid.indexOf(env.pick) >= 0 }
                            ];
                        },
                        verdict: env => {
                            const c = exprOf(env);
                            return c.valid.indexOf(env.pick) >= 0
                                ? 'The rule you picked is the correct first move. The plan is ' + c.plan.join(', then ') + '.'
                                : 'The rule you picked is not the first move. The outer operation is the ' + RULE[c.valid[0]] + ' rule. The plan is ' + c.plan.join(', then ') + '.';
                        },
                        verdictOk: env => exprOf(env).valid.indexOf(env.pick) >= 0
                    },
                    {
                        kind: 'note', title: 'How to read any expression',
                        text: 'Build the expression in words, starting from x. The last operation you name is the first rule. Every earlier operation becomes an inner layer.'
                    }
                ]
            },
            steps: [
                {
                    params: { kase: 'xsin3', pick: 'chain' },
                    message: 'The highlighted layer is the layer your choice names. Try a rule with no layer here, such as the quotient rule. The first check fails for that choice.'
                },
                {
                    params: { kase: 'x2e3x' },
                    predict: {
                        q: 'Which rule do you apply first to x² · e^(3x)?',
                        choices: [
                            'The product rule applies first. The factors x² and e^(3x) are both functions of x.',
                            'The chain rule applies first. The factor 3x sits inside the exponential.',
                            'The power rule applies first. The factor x² is written first when you read.'
                        ], a: 0,
                        whyBy: [
                            'The last operation is the multiplication of the two factors. The product rule splits the work into two branches, and each branch uses its own rule.',
                            'The chain rule inside e^(3x) is real, but it lives in the second factor. That chain rule is the third move, not the first move.',
                            'The power rule applies to the x² branch. The product rule reaches that x² branch first.'
                        ]
                    },
                    message: 'Pick the product rule, and both checks pass. Pick the chain rule, and the second check fails. The chain layer exists in x² · e^(3x), but that chain layer is not the outermost layer.'
                },
                {
                    params: { kase: 'quotient' },
                    message: 'For (x² + 1) / cos x the division is the last operation, so the quotient rule gives the first move. The sum in the numerator waits until the second move.'
                },
                {
                    params: { kase: 'sqrt1', pick: 'power' },
                    message: 'A square root is the power ½ applied to a group. Rewriting √(1 + x²) as (1 + x²)^(1/2) exposes the structure. The chain rule handles the outer power, and the group 1 + x² is the inner function.'
                }
            ],
            summary: {
                idea: 'Decide the order of the rules before you calculate anything. The building order of the expression is the whole answer.',
                mistake: 'Students name a rule that exists somewhere inside the expression but is not outer. They then differentiate as if that rule were the outer rule.',
                transfer: 'Cover the tree and say the rule order for e^(x² sin x). Then check that answer in the Plans and Choices mode.'
            }
        },
        {
            label: 'Plans and Choices',
            intro: 'The structure of an expression usually fixes the rule order. Sometimes the first step is a real choice between two routes. This mode lists each plan, then looks at the expressions with more than one route.',
            params: { reveal: 0 },
            controls: [
                {
                    key: 'reveal', label: 'rule plans', kind: 'choice',
                    options: [
                        { v: 0, label: 'hide the plans' },
                        { v: 1, label: 'show the plans' }
                    ]
                }
            ],
            panes: {
                main: [
                    {
                        kind: 'table', title: 'The rule order for each expression',
                        cols: ['expression', 'outer layer', 'rule order'],
                        rows: env => KEYS.map(k => {
                            const c = EXPR[k];
                            return [
                                c.text,
                                { v: RULE[c.valid[0]], color: 'accent' },
                                env.reveal > 0.5 ? { v: c.plan.join(' → '), color: 'auxInk' } : 'hidden'
                            ];
                        })
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
                        kind: 'practice', id: 'u3-strategy-transfer', title: 'Practice: the rule order for e^(x² sin x)',
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
                            }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'note', title: 'The more direct route, not the only route',
                        text: 'Rewriting an expression with algebra can change which rules apply. The product x(x + 1) and the sum x² + x have the same derivative. So one route can be more direct without the other route being wrong.'
                    },
                    {
                        kind: 'note', tone: 'warn', title: 'A plan that is wrong from the start',
                        text: 'Use the quotient rule when the denominator contains x. When the denominator is a constant, a constant multiple is faster, so (x² + 1)/3 is better read as (1/3)(x² + 1). Choosing the form of an expression is part of choosing the rule.'
                    }
                ]
            },
            steps: [
                {
                    params: { reveal: 0 },
                    message: 'The rule order column is hidden. Say each rule order out loud from the expression alone, starting with the outermost operation. Then show the column and compare your answers.'
                },
                {
                    params: { reveal: 1 },
                    message: 'Every plan in the table starts with the outer layer, and each arrow moves one level deeper. The building order of the expression writes the list, so there is nothing to memorize.'
                },
                {
                    params: {},
                    message: 'The x(x + 1) card is the one case with a real choice. Both routes give the derivative 2x + 1. Choose the route that needs fewer rules, not the route the chapter listed first.'
                }
            ],
            summary: {
                idea: 'Choosing a procedure means reading the structure. Name the outer operation, then list the layers in order, and the rule order follows.',
                mistake: 'Students treat the first symbol they notice as the first rule. They also insist that only one route can be correct when algebra offers two routes.',
                transfer: 'Look at ln(x² + 1) / e^x. List the rule order before you differentiate. Then compare your list with the table in this mode.'
            }
        }
    ]
};
