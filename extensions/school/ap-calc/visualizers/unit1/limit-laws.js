/* 1.5 Limit Law Builder — limit operators travel through sums, products and
   powers, but each law carries conditions on its inputs. */

/* Which build is on screen. The guided steps walk this in order:
   sum (0-4), blocked quotient (5-6), product (7-8), transfer (9-10). */
function view(env) {
    if (env.stage >= 9) return 'transfer';
    if (env.stage >= 7) return 'product';
    return env.stage < 5 ? 'sum' : 'quotient';
}
const TARGET = {
    sum: 'lim x→a [ 2f(x) + (g(x))² ]',
    quotient: 'lim x→a [ f(x) / g(x) ]',
    product: 'lim x→a [ f(x) · g(x) ]',
    transfer: 'lim x→a [ 3(f(x))² − 2g(x) ]'
};
const FOCUS = { sum: [null, 'root', 'twoF', 'gSq', 'root'] };

export default {
    id: 'u1-limit-laws',
    meta: { unit: 1, topic: '1.5', title: 'Determining Limits Using Algebraic Properties of Limits', visualizerTitle: 'Limit Law Builder' },
    intro: 'Break a complicated limit into smaller limits. Each branch of the tree uses one limit law. Each leaf shows a given value you can drag.',
    params: { stage: 0, fg: 3, gg: -2 },
    controls: [
        { key: 'fg', label: 'given lim f', min: -3, max: 4, step: 0.5 },
        { key: 'gg', label: 'given lim g', min: -2.5, max: 4, step: 0.5, when: (env) => view(env) !== 'quotient' }
    ],
    fns: {
        fCurve: (x, env) => env.fg + 0.25 * (x - 2) ** 2,
        gLeft: (x, env) => env.gg - 0.6 * (2 - x),
        gLine: (x) => x - 2,
        blockedQuot: 'fg/(x-2)'
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'The graph behind this target limit: ' + TARGET[view(env)], height: 320,
                window: env => view(env) === 'quotient' ? [-0.5, 4.5, -7, 7] : [-0.5, 4.5, -4.5, 6.5],
                vlines: [{ x: 2, color: 'auxInk', label: 'x → a' }],
                hlines: env => view(env) === 'quotient'
                    ? [{ y: 'fg', color: 'up', label: 'lim f = ' + trim(env.fg) }]
                    : [
                        { y: 'fg', color: 'up', label: 'lim f = ' + trim(env.fg) },
                        { y: 'gg', color: 'down', label: 'lim g = ' + trim(env.gg) }
                    ],
                curves: env => view(env) === 'quotient' ? [
                    { fn: 'fCurve', to: 1.9, color: 'curveA', label: 'f' },
                    { fn: 'fCurve', from: 2.1, color: 'curveA' },
                    { fn: 'gLine', color: 'curveB', label: 'g equals 0 at a' },
                    { fn: 'blockedQuot', from: -0.5, to: 1.93, samples: 400, color: 'down', dashed: true, label: 'f / g' },
                    { fn: 'blockedQuot', from: 2.07, samples: 400, color: 'down', dashed: true }
                ] : [
                    { fn: 'fCurve', color: 'curveA', label: 'f' },
                    { fn: 'gLeft', color: 'curveB', label: 'g' }
                ],
                points: env => view(env) === 'quotient'
                    ? [{ x: 2, y: 'fg', open: true, color: 'up' }]
                    : [
                        { x: 2, y: 'fg', open: true, color: 'up', label: 'limit of f' },
                        { x: 2, y: 'gg', open: true, color: 'down', label: 'limit of g' }
                    ]
            },
            {
                kind: 'tree', title: env => TARGET[view(env)],
                focus: (env) => {
                    const v = view(env);
                    if (v === 'product') return ['prod', 'pg'][env.stage - 7] || 'prod';
                    if (v === 'transfer') return ['diff', 't2'][env.stage - 9] || 'diff';
                    const list = FOCUS.sum;
                    return v === 'quotient' ? ['quo', 'g2'][env.stage - 5] || 'quo' : (list[env.stage] || null);
                },
                root: env => {
                    const v = view(env);
                    if (v === 'product') return buildProduct(env);
                    if (v === 'transfer') return buildTransfer(env);
                    return v === 'quotient' ? buildQuotient(env) : buildBuild(env);
                }
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Assembly',
                lines: (env) => assembly(env)
            },
            {
                kind: 'checklist', title: 'Conditions check', when: env => view(env) === 'quotient',
                items: env => [
                    { t: 'The limit of f exists: lim f = ' + trim(env.fg) + '.', state: true },
                    { t: 'The limit of g exists: lim g = ' + trim(env.gg) + '.', state: true },
                    { t: 'The quotient law needs lim g ≠ 0', state: env.gg !== 0 }
                ],
                verdict: env => env.gg === 0
                    ? 'The quotient law is not allowed because lim g = 0. Read the one-sided signs instead.'
                    : 'The quotient law applies because lim g = ' + trim(env.gg) + ' is nonzero, so lim f divided by lim g = ' + trim(env.fg / env.gg),
                verdictOk: env => env.gg !== 0
            },
            {
                kind: 'practice', id: 'u15-law-choice', title: 'You choose the next valid law',
                items: (env) => [
                    {
                        q: 'The target limit is lim [ 2f + g² ]. Which law is the correct first step?',
                        choices: [
                            'The sum law. Split the target into lim 2f and lim g².',
                            'The power law. Move the limit inside the square.',
                            'The constant multiple law. Move the factor 2 outside lim f.'
                        ], a: 0,
                        whyBy: [
                            'The sum is the outermost operation, so the sum law applies first. The other two laws apply later, inside their own branches.',
                            'The power law is genuine, but it is not the first step. It applies only to the g² branch, which becomes a separate limit after the sum law splits it off.',
                            'The constant multiple law is also genuine, but it comes later. It applies to the 2f branch after the sum law splits that branch off.'
                        ]
                    },
                    {
                        q: 'The top node of the tree is now a product: lim [ f · g ]. Which law applies?',
                        choices: [
                            'The product law. lim [ f · g ] = lim f · lim g = ' + trim(env.fg * env.gg) + '.',
                            'The difference law. It would compute lim f − lim g.',
                            'No law applies. A limit cannot pass through a product.'
                        ], a: 0,
                        whyBy: [
                            'The product law applies because both limits exist: ' + trim(env.fg) + ' · (' + trim(env.gg) + ') = ' + trim(env.fg * env.gg) + '.',
                            'The top node multiplies, so the difference law would evaluate a different expression.',
                            'The product law is the rule for a product. It only requires that both component limits exist.'
                        ]
                    },
                    {
                        q: 'The target is lim [ f / g ] with lim f = ' + trim(env.fg) + ' and lim g = ' + trim(env.gg) + '. Which law can you use now?',
                        choices: [
                            env.gg === 0
                                ? 'The quotient law is blocked. It needs lim g ≠ 0.'
                                : 'The quotient law applies. ' + trim(env.fg) + ' / (' + trim(env.gg) + ') = ' + trim(env.fg / env.gg),
                            'The power law applies. It moves the limit into a power of g.',
                            'No law applies. A limit never passes through a quotient.'
                        ], a: 0,
                        whyBy: [
                            env.gg === 0
                                ? 'The condition lim g ≠ 0 fails when lim g = 0. Drag the lim g slider away from 0 and the quotient law becomes available again.'
                                : 'It applies because lim g = ' + trim(env.gg) + ' is nonzero. Set the slider to 0 to see the verdict change.',
                            'The power law needs an exponent on the whole expression. The denominator is g, not a power of g.',
                            'That is too strong. The quotient law is a genuine rule, and it only needs lim g ≠ 0.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 0, fg: 3, gg: -2 },
            message: env => 'We are given lim f = ' + trim(env.fg) + ' and lim g = ' + trim(env.gg) + '. The target combines these two limits. Which law do we start with?'
        },
        { params: { stage: 1 }, message: 'The sum is the outermost operation, so the sum law splits the limit into two limits. Handle the structure first, then do the arithmetic.' },
        { params: { stage: 2 }, message: env => 'The left branch is 2 times f. A constant factor comes out unchanged: 2 · ' + trim(env.fg) + ' = ' + trim(2 * env.fg) + '.' },
        { params: { stage: 3 }, message: env => 'The right branch is g squared. The power law moves the limit inside the square: (' + trim(env.gg) + ')² = ' + trim(env.gg * env.gg) + '.' },
        { params: { stage: 4 }, message: env => 'Reassemble the parts: ' + trim(2 * env.fg) + ' + ' + trim(env.gg * env.gg) + ' = ' + trim(2 * env.fg + env.gg * env.gg) + '. Each step used a valid law, not a guess.' },
        {
            params: { stage: 5, gg: 0 },
            predict: {
                q: 'The target becomes lim f / g. Which condition must the quotient law check before you may divide?',
                choices: ['lim g ≠ 0', 'lim f ≠ 0', 'both limits must be equal'], a: 0,
                whyBy: [
                    'The quotient law only applies when the denominator limit is nonzero. A denominator heading to 0 calls for one-sided sign analysis, not a law.',
                    'The numerator is never the problem. Zero over a nonzero limit is still a valid quotient.',
                    'Nothing requires the two limits to match. Equal limits would just give a quotient of 1.'
                ]
            },
            message: 'Watch the tree change when the limit of g equals 0.'
        },
        {
            params: { stage: 6 },
            message: env => env.gg === 0
                ? 'The quotient branch is blocked. Do not conclude that the limit is ±∞ here. The sign of g on each side decides that, and topic 1.14 covers it.'
                : 'The limit of g reads ' + trim(env.gg) + ', so the quotient branch is allowed. Set lim g back to 0 to see the blocked case.'
        },
        {
            params: { stage: 7, fg: 3, gg: -2 },
            predict: {
                q: 'New target: lim [ f · g ]. Which law applies, and is it allowed right now?',
                choices: [
                    'The product law, and it is allowed because both limits exist',
                    'The sum law, because a product can be rewritten as a sum',
                    'The quotient law, because a product is a fraction with denominator 1',
                    'No law applies, because limits never pass through a product'
                ], a: 0,
                whyBy: [
                    'The product law says lim [ f · g ] = lim f · lim g. Its only condition is that both limits exist. Both limits exist here, so the law applies.',
                    'Addition and multiplication are different outer operations, and each has its own law. Rewriting a product as a sum changes the expression.',
                    'A product is not a quotient. The quotient law also needs a nonzero denominator limit, which this target does not require.',
                    'The product law is one you use often when differentiating products. Limits do pass through a product.'
                ]
            },
            message: 'You already used the product law inside the power law: g² is g times g, two equal factors. Now the product appears on its own.'
        },
        { params: { stage: 8 }, message: env => 'Read the two limits, then multiply: ' + trim(env.fg) + ' · (' + trim(env.gg) + ') = ' + trim(env.fg * env.gg) + '. Drag a slider and the product follows, because the product law works for any given limits.' },
        {
            params: { stage: 9, fg: 2, gg: -1 },
            message: env => 'In this last example the given values are lim f = ' + trim(env.fg) + ' and lim g = ' + trim(env.gg) + '. The target is 3(f(x))² − 2g(x), and a difference sits at the root. Name the outermost law before you compute anything.'
        },
        {
            params: { stage: 10 },
            message: env => 'Each node is valid: 3 · ' + trim(env.fg) + '² = ' + trim(3 * env.fg * env.fg) + ', and 2 · (' + trim(env.gg) + ') = ' + trim(2 * env.gg) + ', so the difference is ' + trim(3 * env.fg * env.fg - 2 * env.gg) + '. Drag a slider and the whole tree recomputes.'
        }
    ],
    summary: {
        idea: 'Limit laws let you evaluate a complicated limit by combining simpler limits. They work only when each component limit exists and each law’s conditions hold.',
        mistake: 'Applying a law without checking its condition. The quotient law needs lim g ≠ 0, so a value like 3/0 is never a valid answer.',
        transfer: 'The last two steps use lim f = 2 and lim g = −1 on the target 3(f(x))² − 2g(x). Name the outermost law before you read the total. Then drag a slider and confirm that every node is still allowed.'
    }
};

function trim(v) { return String(Math.round(v * 100) / 100); }

function assembly(env) {
    const v = view(env);
    const given = [
        { t: 'Given: lim f = ' + trim(env.fg), color: 'up' },
        { t: 'Given: lim g = ' + trim(env.gg), color: 'down' }
    ];
    if (v === 'product') return given.concat([
        { t: 'lim [ f · g ] = lim f · lim g', rule: 'product law', hl: env.stage === 7 },
        { t: '= ' + trim(env.fg) + ' · (' + trim(env.gg) + ') = ' + trim(env.fg * env.gg), rule: 'both limits exist', hl: env.stage === 8 }
    ]);
    if (v === 'transfer') return given.concat([
        { t: 'lim [ 3f² − 2g ] = lim 3f² − lim 2g', rule: 'difference law', hl: env.stage === 9 },
        { t: 'lim 3f² = 3 · (lim f)² = ' + trim(3 * env.fg * env.fg), rule: 'constant multiple, then power law' },
        { t: 'lim 2g = 2 · lim g = ' + trim(2 * env.gg), rule: 'constant multiple' },
        { t: 'total = ' + trim(3 * env.fg * env.fg) + ' − (' + trim(2 * env.gg) + ') = ' + trim(3 * env.fg * env.fg - 2 * env.gg), rule: 'reassemble', hl: env.stage === 10 }
    ]);
    if (v === 'quotient') return given.concat([
        { t: 'Now try f / g with lim g = ' + trim(env.gg), color: env.gg === 0 ? 'down' : 'auxInk' },
        env.gg === 0
            ? { t: 'The quotient law needs lim g ≠ 0. This condition fails, so stop and read the one-sided signs instead.', color: 'down', hl: true }
            : { t: 'lim f / g = ' + trim(env.fg / env.gg), rule: 'quotient law', hl: true }
    ]);
    const L = given.slice();
    if (env.stage >= 1) L.push({ t: 'lim [2f + g²] = lim(2f) + lim(g²)', rule: 'sum law', hl: env.stage === 1 });
    if (env.stage >= 2) L.push({ t: 'lim(2f) = 2 · lim f = ' + trim(2 * env.fg), rule: 'constant multiple', hl: env.stage === 2 });
    if (env.stage >= 3) L.push({ t: 'lim(g²) = (lim g)² = ' + trim(env.gg * env.gg), rule: 'power law', hl: env.stage === 3 });
    if (env.stage >= 4) L.push({ t: 'total = ' + trim(2 * env.fg + env.gg * env.gg), hl: true, rule: 'reassemble' });
    return L;
}

function buildBuild(env) {
    return {
        id: 'root', e: 'lim [ 2f + g² ]', rule: 'sum law',
        children: [
            {
                id: 'twoF', e: 'lim 2f', rule: 'constant multiple', v: 2 * env.fg,
                children: [{ id: 'f', e: 'lim f', v: env.fg }]
            },
            {
                id: 'gSq', e: 'lim g²', rule: 'power law', v: env.gg * env.gg,
                children: [{ id: 'g', e: 'lim g', v: env.gg }]
            }
        ]
    };
}
function buildQuotient(env) {
    const blocked = env.gg === 0;
    return {
        id: 'quo', e: 'lim f / g', rule: blocked ? 'quotient law: blocked' : 'quotient law', v: blocked ? 'not allowed' : env.fg / env.gg,
        children: [
            { id: 'f2', e: 'lim f', v: env.fg },
            { id: 'g2', e: 'lim g', v: env.gg, rule: blocked ? 'must be ≠ 0' : 'nonzero: allowed' }
        ]
    };
}
function buildProduct(env) {
    return {
        id: 'prod', e: 'lim [ f · g ]', rule: 'product law', v: env.fg * env.gg,
        children: [
            { id: 'pf', e: 'lim f', v: env.fg },
            { id: 'pg', e: 'lim g', v: env.gg, rule: 'exists: allowed' }
        ]
    };
}
function buildTransfer(env) {
    return {
        id: 'diff', e: 'lim [ 3f² − 2g ]', rule: 'difference law', v: 3 * env.fg * env.fg - 2 * env.gg,
        children: [
            {
                id: 't3', e: 'lim 3f²', rule: 'constant multiple', v: 3 * env.fg * env.fg,
                children: [
                    { id: 't3p', e: 'lim f²', rule: 'power law', v: env.fg * env.fg,
                        children: [{ id: 'tf', e: 'lim f', v: env.fg }] }
                ]
            },
            {
                id: 't2', e: 'lim 2g', rule: 'constant multiple', v: 2 * env.gg,
                children: [{ id: 'tg', e: 'lim g', v: env.gg }]
            }
        ]
    };
}
