/* 1.5 Limit Law Builder - limit operators travel through sums, products and
   powers, but each law carries conditions on its inputs.

   No graph pane here on purpose. Two given limit VALUES do not determine what
   f and g look like, so any curve drawn for them would be invented, and reading
   a picture would imply the laws depend on a particular graph. The expression
   TREE is the hero instead, because the only real object in this topic is the
   structure of the target. The tree peels exactly one law per step until the
   leaves are the two given limits, and the assembly writes the algebra line that
   matches each peel. */

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

/* One focused node per stage: the branch this step peels, or the node where the
   peeled branches rejoin. */
const FOCUS = {
    sum: ['root', 'root', 'twoF', 'gSq', 'root'],
    quotient: ['quo', 'gDen'],
    product: ['prod', 'prod'],
    transfer: ['diff', 'diff']
};
function focusOf(env) {
    const v = view(env);
    const list = FOCUS[v];
    const i = v === 'sum' ? env.stage : env.stage - ({ quotient: 5, product: 7, transfer: 9 })[v];
    return list[i] || list[0];
}

export default {
    id: 'u1-limit-laws',
    meta: { unit: 1, topic: '1.5', title: 'Determining Limits Using Algebraic Properties of Limits', visualizerTitle: 'Limit Law Builder' },
    intro: 'You are given two limits, lim f and lim g, and a target built from them. The tree holds the target at the top and peels one limit law at a time until the two given limits sit at the bottom as leaves. The numbers on those leaves come from the two sliders, so drag either one and every node above it recomputes.',
    params: { stage: 0, fg: 3, gg: -2 },
    controls: [
        { key: 'fg', label: 'given lim f', min: -3, max: 4, step: 0.5 },
        { key: 'gg', label: 'given lim g', min: -2.5, max: 4, step: 0.5 }
    ],
    panes: {
        main: [
            {
                kind: 'tree', title: env => TARGET[view(env)],
                focus: env => focusOf(env),
                root: env => {
                    const v = view(env);
                    if (v === 'product') return buildProduct(env);
                    if (v === 'transfer') return buildTransfer(env);
                    return v === 'quotient' ? buildQuotient(env) : buildSum(env);
                }
            },
            {
                kind: 'eq', title: 'The algebra, one line per law',
                lines: env => assembly(env)
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'Conditions check', when: env => view(env) === 'quotient',
                items: env => {
                    const L = [
                        { t: 'The limit of f exists: lim f = ' + trim(env.fg) + '.', state: true },
                        { t: 'The limit of g exists: lim g = ' + trim(env.gg) + '.', state: true },
                        { t: 'The quotient law needs lim g ≠ 0', state: env.gg !== 0 }
                    ];
                    if (quoCase(env) === 'den-zero') L.push({ t: 'lim f = ' + trim(env.fg) + ' is nonzero, so the size of f / g grows without bound.', state: false });
                    if (quoCase(env) === 'both-zero') L.push({ t: 'lim f = 0 as well, so the two given values only name the form 0 / 0.', state: false });
                    return L;
                },
                verdict: env => quoCase(env) === 'allowed'
                    ? 'The quotient law applies because lim g = ' + trim(env.gg) + ' is nonzero, so lim f divided by lim g = ' + trim(env.fg / env.gg)
                    : (quoCase(env) === 'both-zero'
                        ? 'The quotient law is not allowed because lim g = 0, and lim f = 0 too. These two given values are not enough information on their own. More algebra or more information is needed.'
                        : 'The quotient law is not allowed because lim g = 0 while lim f = ' + trim(env.fg) + ' is nonzero. Inspect the one-sided signs of g and the infinite behavior they give.'),
                verdictOk: env => env.gg !== 0
            },
            {
                /* The same card for the builds with no gate, so the side column is
                   never empty and every law on screen is checked. */
                kind: 'checklist', title: 'Conditions check', when: env => view(env) !== 'quotient',
                items: env => {
                    const L = [
                        { t: 'The limit of f exists: lim f = ' + trim(env.fg) + '.', state: true },
                        { t: 'The limit of g exists: lim g = ' + trim(env.gg) + '.', state: true }
                    ];
                    if (hasLeaves(env)) L.push({ t: 'Every leaf of this tree is one of those two given limits.', state: true });
                    return L;
                },
                verdict: env => hasLaw(env)
                    ? 'Each law shown on this tree needs limits that exist. Both given limits exist, so each one passes.'
                    : '',
                verdictOk: true
            },
            {
                kind: 'practice', id: 'u15-law-choice', title: 'You choose the next valid law',
                when: env => view(env) === 'sum',
                items: () => [sumItem]
            },
            {
                kind: 'practice', id: 'u15-product-choice', title: 'You choose the next valid law',
                when: env => view(env) === 'product',
                items: env => [productItem(env)]
            },
            {
                kind: 'practice', id: 'u15-quotient-choice', title: 'You choose the next valid law',
                when: env => view(env) === 'quotient',
                items: env => [quotientItem(env)]
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
                    'The quotient law only applies when the denominator limit is nonzero. When lim g = 0 the law stops, and what you try next depends on lim f as well.',
                    'The condition the law names sits on the denominator, so lim f ≠ 0 is not it. A zero numerator changes the follow-up work, not this condition.',
                    'Nothing requires the two limits to match. Equal limits would just give a quotient of 1.'
                ]
            },
            message: 'Watch the tree change when the limit of g equals 0. Then drag the lim f slider to 0 too and read how the blocked message changes.'
        },
        {
            params: { stage: 6 },
            message: env => quoCase(env) === 'allowed'
                ? 'The limit of g reads ' + trim(env.gg) + ', so the quotient branch is allowed. Set lim g back to 0 to see the blocked case.'
                : (quoCase(env) === 'both-zero'
                    ? 'The quotient branch is blocked, and the two given values alone do not settle this limit. Both are 0, so the target sits in the form 0 / 0. More algebra or more information is needed. Topic 1.14 covers that work.'
                    : 'The quotient branch is blocked. Do not write a number here. With lim f = ' + trim(env.fg) + ' on top, the size of f / g grows without bound, and the sign of g on each side says which way. Topic 1.14 covers that reading.')
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
        mistake: 'Applying a law without checking its condition. The quotient law needs lim g ≠ 0, so a value like 3/0 is never a valid answer. When lim f = 0 as well, the two given values only name the form 0 / 0, and they carry no answer.',
        transfer: 'The last two steps use lim f = 2 and lim g = −1 on the target 3(f(x))² − 2g(x). Name the outermost law at the root before you read the total. Then drag a slider and confirm that every node is still allowed.'
    }
};

function trim(v) { return String(Math.round(v * 100) / 100); }

/* The one predicate every quotient string reads. The quotient law only names the
   denominator as its condition, but what a student does next also depends on the
   numerator, so the blocked state splits on both sliders. */
function quoCase(env) {
    if (env.gg !== 0) return 'allowed';
    return env.fg === 0 ? 'both-zero' : 'den-zero';
}

/* A leaf is on screen once a branch has been peeled down to a given limit, and a
   law chip is on screen once the first split has happened. Both gate the wording
   of the conditions card, so that card only names what you can actually see. */
function hasLeaves(env) {
    const v = view(env);
    return v === 'product' || (v === 'sum' ? env.stage >= 2 : env.stage >= 10);
}
function hasLaw(env) {
    return view(env) === 'sum' ? env.stage >= 1 : true;
}

/* A leaf is one of the two given limits. Its number is live, so the whole tree
   above it moves the moment a slider moves. */
function givenLeaf(id, name, v) {
    return { id, e: 'lim ' + name, v, rule: 'a given limit' };
}

/* The algebra under the tree. One line per law already peeled, and the line
   names that law. The numeric line for a branch waits for the stage after the
   step that asks about it, so the answer comes after the question. */
function assembly(env) {
    const v = view(env);
    const s = env.stage;
    const L = [
        { t: 'Given: lim f = ' + trim(env.fg), color: 'up' },
        { t: 'Given: lim g = ' + trim(env.gg), color: 'down' }
    ];
    if (v === 'sum') {
        if (s >= 1) L.push({ t: 'lim [ 2f + g² ] = lim 2f + lim g²', rule: 'sum law', hl: s === 1 });
        if (s >= 2) L.push({ t: 'lim 2f = 2 · lim f = ' + trim(2 * env.fg), rule: 'constant multiple', hl: s === 2 });
        if (s >= 3) L.push({ t: 'lim g² = (lim g)² = ' + trim(env.gg * env.gg), rule: 'power law', hl: s === 3 });
        if (s >= 4) L.push({ t: 'total = ' + trim(2 * env.fg) + ' + ' + trim(env.gg * env.gg) + ' = ' + trim(2 * env.fg + env.gg * env.gg), rule: 'reassemble', hl: true });
        return L;
    }
    if (v === 'quotient') {
        if (env.gg === 0) {
            L.push({ t: 'The quotient law needs lim g ≠ 0. This condition fails, so the division line cannot be written yet.', rule: 'check the condition', color: 'down', hl: s < 6 });
            L.push(quoCase(env) === 'both-zero'
                ? { t: 'Both given values are 0, so the target sits in the indeterminate form 0 / 0. More algebra or more information is needed.', rule: 'not enough information', hl: s >= 6 }
                : { t: 'lim f = ' + trim(env.fg) + ' is nonzero, so the size of f / g grows without bound. The sign of g on each side says which way it goes.', rule: 'one-sided signs', color: 'down', hl: s >= 6 });
        } else {
            L.push({ t: 'lim [ f / g ] = lim f / lim g', rule: 'quotient law', hl: s === 5 });
            if (s >= 6) L.push({ t: '= ' + trim(env.fg) + ' / (' + trim(env.gg) + ') = ' + trim(env.fg / env.gg), rule: 'lim g is nonzero', hl: true });
        }
        return L;
    }
    if (v === 'product') {
        L.push({ t: 'lim [ f · g ] = lim f · lim g', rule: 'product law', hl: s === 7 });
        if (s >= 8) L.push({ t: '= ' + trim(env.fg) + ' · (' + trim(env.gg) + ') = ' + trim(env.fg * env.gg), rule: 'both limits exist', hl: true });
        return L;
    }
    if (s >= 9) L.push({ t: 'lim [ 3f² − 2g ] = lim 3f² − lim 2g', rule: 'difference law', hl: s === 9 });
    if (s >= 10) {
        L.push({ t: 'lim 3f² = 3 · (lim f)² = ' + trim(3 * env.fg * env.fg), rule: 'constant multiple, then power law' });
        L.push({ t: 'lim 2g = 2 · lim g = ' + trim(2 * env.gg), rule: 'constant multiple' });
        L.push({ t: 'total = ' + trim(3 * env.fg * env.fg) + ' − (' + trim(2 * env.gg) + ') = ' + trim(3 * env.fg * env.fg - 2 * env.gg), rule: 'reassemble', hl: true });
    }
    return L;
}

/* sum: the root splits first, then each branch peels one law on its own step. */
function buildSum(env) {
    const s = env.stage;
    const twoF = {
        id: 'twoF', e: 'lim 2f', dim: s < 2,
        rule: s >= 2 ? 'constant multiple' : undefined,
        v: s >= 2 ? 2 * env.fg : undefined,
        children: s >= 2 ? [givenLeaf('fLeft', 'f', env.fg)] : undefined
    };
    const gSq = {
        id: 'gSq', e: 'lim g²', dim: s < 3,
        rule: s >= 3 ? 'power law' : undefined,
        v: s >= 3 ? env.gg * env.gg : undefined,
        children: s >= 3 ? [givenLeaf('gRight', 'g', env.gg)] : undefined
    };
    return {
        id: 'root', e: 'lim [ 2f + g² ]',
        rule: s >= 1 ? 'sum law' : undefined,
        v: s >= 4 ? 2 * env.fg + env.gg * env.gg : undefined,
        children: s >= 1 ? [twoF, gSq] : undefined
    };
}

/* quotient: the same node is the gate. With lim g = 0 the label says blocked and
   the division never resolves, and dragging lim g off 0 rewrites the labels. The
   blocked label also names the numerator, because 0 / 0 is a different case. */
function buildQuotient(env) {
    const c = quoCase(env);
    const blocked = c !== 'allowed';
    return {
        id: 'quo', e: 'lim [ f / g ]',
        rule: c === 'both-zero' ? 'blocked, the given values form 0 / 0'
            : c === 'den-zero' ? 'quotient law blocked, lim g = 0'
            : 'quotient law, allowed',
        v: blocked ? 'blocked' : (env.stage >= 6 ? env.fg / env.gg : undefined),
        children: [
            givenLeaf('fNum', 'f', env.fg),
            {
                id: 'gDen', e: 'lim g', v: env.gg,
                rule: blocked ? 'the law needs lim g ≠ 0' : 'nonzero, so the law applies'
            }
        ]
    };
}

function buildProduct(env) {
    const s = env.stage;
    return {
        id: 'prod', e: 'lim [ f · g ]',
        rule: s >= 8 ? 'product law, both limits exist' : 'product law',
        v: s >= 8 ? env.fg * env.gg : undefined,
        children: [
            givenLeaf('pf', 'f', env.fg),
            givenLeaf('pg', 'g', env.gg)
        ]
    };
}

/* transfer: the difference splits at the root, and step 10 peels both branches
   down to the leaves at once. */
function buildTransfer(env) {
    const open = env.stage >= 10;
    return {
        id: 'diff', e: 'lim [ 3f² − 2g ]', rule: 'difference law',
        v: open ? 3 * env.fg * env.fg - 2 * env.gg : undefined,
        children: [
            {
                id: 't3', e: 'lim 3f²', dim: !open,
                rule: open ? 'constant multiple' : undefined,
                v: open ? 3 * env.fg * env.fg : undefined,
                children: open ? [{
                    id: 't3p', e: 'lim f²', rule: 'power law', v: env.fg * env.fg,
                    children: [givenLeaf('fTop', 'f', env.fg)]
                }] : undefined
            },
            {
                id: 't2', e: 'lim 2g', dim: !open,
                rule: open ? 'constant multiple' : undefined,
                v: open ? 2 * env.gg : undefined,
                children: open ? [givenLeaf('gTop', 'g', env.gg)] : undefined
            }
        ]
    };
}

/* One practice card per build, so a question never names a tree that is not on
   screen. All three items kept word for word, with separate ids so stored
   answers cannot land on the wrong card. */
const sumItem = {
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
};
function productItem(env) {
    return {
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
    };
}
function quotientItem(env) {
    const c = quoCase(env);
    return {
        q: 'The target is lim [ f / g ] with lim f = ' + trim(env.fg) + ' and lim g = ' + trim(env.gg) + '. Which law can you use now?',
        choices: [
            c === 'allowed'
                ? 'The quotient law applies. ' + trim(env.fg) + ' / (' + trim(env.gg) + ') = ' + trim(env.fg / env.gg)
                : c === 'both-zero'
                ? 'The quotient law is blocked. It needs lim g ≠ 0, and both given values are 0 here.'
                : 'The quotient law is blocked. It needs lim g ≠ 0.',
            'The power law applies. It moves the limit into a power of g.',
            'No law applies. A limit never passes through a quotient.'
        ], a: 0,
        whyBy: [
            c === 'allowed'
                ? 'It applies because lim g = ' + trim(env.gg) + ' is nonzero. Set the slider to 0 to see the verdict change.'
                : c === 'both-zero'
                ? 'The condition lim g ≠ 0 fails, and lim f = 0 too. These two values only name the form 0 / 0, so they are not enough information. More algebra or more information is needed.'
                : 'The condition lim g ≠ 0 fails while lim f = ' + trim(env.fg) + ' stays nonzero, so the quotient grows without bound. Inspect the one-sided signs to say which way. Drag the lim g slider away from 0 and the quotient law becomes available again.',
            'The power law needs an exponent on the whole expression. The denominator is g, not a power of g.',
            'That is too strong. The quotient law is a genuine rule, and it only needs lim g ≠ 0.'
        ]
    };
}
