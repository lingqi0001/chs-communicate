/* 2.10 Trig Derivative Network. The main visual is the network itself: a
   structure tree plus a five-column comparison board that fills one row at a
   time. Two rows are worked in full (tan, sec) and the two rows paired with
   them are predicted from the finished neighbor (cot, csc), so the lesson is
   one network being built rather than four parallel derivations.
   The graph is demoted to a secondary sanity check on the last screen, where
   tan and cot support a global sign claim and sec and csc only witness the
   single branch on the screen. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const ORDER = ['tan', 'cot', 'sec', 'csc'];

/* numerAt / resultAt are the stage numbers at which a board cell unlocks, so
   the transfer rows stay open until the student has predicted them. */
const NET = {
    tan: {
        label: 'tan x', rewrite: 'sin/cos',
        numer: 'cos²x + sin²x', simpl: '1/cos²x', result: '+sec²x',
        family: 'A', tone: 'up', numerAt: 2, resultAt: 2,
        identity: 'tan x = sin x / cos x',
        stepsL: [
            { t: 'u = sin x,  v = cos x', rule: 'quotient form' },
            { t: 'u′ = cos x,  v′ = −sin x', rule: 'core rules from 2.7' },
            { t: '(u′v − uv′)/v²', rule: 'quotient rule' },
            { t: '= (cos·cos − sin·(−sin))/cos²', hl: true },
            { t: '= (cos² + sin²)/cos²', rule: 'subtracting a negative leaves a sum', hl: true },
            { t: '= 1/cos² = +sec² x', rule: 'Pythagorean identity', hl: true }
        ],
        givenLines: [],
        domain: 'tan x is undefined where cos x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'tan x (blue) rises on the drawn branch and its derivative +sec² x (green) sits above the axis there. Because sec² x is positive wherever tan x is defined, every branch of tan x rises, not only this one.',
        f: (x) => Math.tan(x), fp: (x) => 1 / (Math.cos(x) * Math.cos(x)),
        dom: [0.3, 1.15]
    },
    cot: {
        label: 'cot x', rewrite: 'cos/sin',
        numer: '−sin²x − cos²x', simpl: '−1/sin²x', result: '−csc²x',
        family: 'A', tone: 'down', numerAt: 3, resultAt: 4,
        identity: 'cot x = cos x / sin x',
        stepsL: [
            { t: 'u = cos x,  v = sin x', rule: 'quotient form' },
            { t: 'u′ = −sin x,  v′ = cos x', rule: 'core rules from 2.7' },
            { t: '(−sin·sin − cos·cos)/sin²', hl: true },
            { t: '= −(sin² + cos²)/sin²', rule: 'both parts share one minus sign' },
            { t: '= −csc² x', hl: true }
        ],
        givenLines: [
            { t: 'cot x = cos x / sin x', rule: 'the swapped Rewrite cell', hl: true },
            { t: 'u = cos x,  v = sin x', rule: 'quotient form' },
            { t: 'u′ = −sin x,  v′ = cos x', rule: 'core rules from 2.7' },
            { t: '(u′v − uv′)/v² = (−sin·sin − cos·cos)/sin²', rule: 'the numerator on the board' }
        ],
        audit: [
            { t: 'u′ is −sin x and v is sin x, so the first term u′v is −sin²x.', state: true },
            { t: 'u is cos x and v′ is cos x, so the second term uv′ is cos²x.', state: true },
            { t: 'Simplify those two terms and read the sign of the fraction.', state: 'na' },
            { t: 'Fill the Simplify cell and the Derivative cell of this row.', state: 'na' }
        ],
        verdict: 'The rule subtracts the second term. Decide what the two terms add to, and the sign follows.',
        domain: 'cot x is undefined where sin x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'cot x (blue) falls on the drawn branch and its derivative −csc² x (green) sits below the axis there. Because −csc² x is negative wherever cot x is defined, every branch of cot x falls.',
        f: (x) => 1 / Math.tan(x), fp: (x) => -1 / (Math.sin(x) * Math.sin(x)),
        dom: [0.55, 1.4]
    },
    sec: {
        label: 'sec x', rewrite: '1/cos',
        numer: '+sin x', simpl: 'sin x/cos²x', result: '+sec x · tan x',
        family: 'B', tone: 'up', numerAt: 4, resultAt: 4,
        identity: 'sec x = 1 / cos x',
        stepsL: [
            { t: 'u = 1,  v = cos x', rule: 'the numerator is a constant' },
            { t: 'u′ = 0,  v′ = −sin x' },
            { t: '(0·cos − 1·(−sin))/cos²', hl: true },
            { t: '= sin/cos² = (1/cos)·(sin/cos)', rule: 'split one factor' },
            { t: '= +sec x · tan x', hl: true }
        ],
        givenLines: [],
        domain: 'sec x is undefined where cos x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'The screen shows the rising side of one branch of sec x. sec x (blue) climbs and +sec x · tan x (green) stays positive. Both curves grow as x moves toward π/2, where sec x is undefined.',
        f: (x) => 1 / Math.cos(x), fp: (x) => Math.sin(x) / (Math.cos(x) * Math.cos(x)),
        dom: [0.3, 1.15]
    },
    csc: {
        label: 'csc x', rewrite: '1/sin',
        numer: '−cos x', simpl: '−cos x/sin²x', result: '−csc x · cot x',
        family: 'B', tone: 'down', numerAt: 5, resultAt: 6,
        identity: 'csc x = 1 / sin x',
        stepsL: [
            { t: 'u = 1,  v = sin x', rule: 'the numerator is a constant' },
            { t: 'u′ = 0,  v′ = cos x' },
            { t: '(0·sin − 1·cos)/sin²', hl: true },
            { t: '= −cos/sin² = −(1/sin)·(cos/sin)' },
            { t: '= −csc x · cot x', hl: true }
        ],
        givenLines: [
            { t: 'csc x = 1 / sin x', rule: 'the reciprocal Rewrite cell', hl: true },
            { t: 'u = 1,  v = sin x', rule: 'the numerator is a constant' },
            { t: 'u′ = 0,  v′ = cos x', rule: 'core rules from 2.7' },
            { t: '(0·sin − 1·cos)/sin²', rule: 'the numerator on the board' }
        ],
        audit: [
            { t: 'u′ is 0, so the first term u′v of the numerator is 0.', state: true },
            { t: 'v is sin x, so v′ is cos x, and that derivative carries no minus of its own.', state: true },
            { t: 'Write the single term the subtraction leaves, with its sign.', state: 'na' },
            { t: 'Fill the Simplify cell and the Derivative cell of this row.', state: 'na' }
        ],
        verdict: 'Only one subtraction reaches this numerator. Decide what it leaves, and the sign follows.',
        domain: 'csc x is undefined where sin x = 0. The function and its derivative are undefined at exactly the same x values.',
        graphNote: 'On this branch csc x (blue) falls toward 1, and −csc x · cot x (green) stays below the axis. The signs of the two curves agree across the whole branch, and the board makes no claim about the other branches.',
        f: (x) => 1 / Math.sin(x), fp: (x) => -Math.cos(x) / (Math.sin(x) * Math.sin(x)),
        dom: [0.55, 1.4]
    }
};

const FAMILIES = {
    A: { e: 'sin and cos', rule: 'Family A · a function over a function' },
    B: { e: '1 over sin or cos', rule: 'Family B · the reciprocal' }
};

function probeIn(env) {
    const dom = NET[env.kase].dom;
    return Math.min(Math.max(env.x0, dom[0]), dom[1]);
}

/* Sample both curves across the drawn domain and wrap the y bounds around
   them, so neither the derivative curve nor the probe point can land off
   screen the way a fixed window used to hide −csc² and −csc·cot. */
function windowFor(env) {
    const n = NET[env.kase];
    const [a, b] = n.dom;
    let lo = 0, hi = 0;
    for (let i = 0; i <= 160; i++) {
        const x = a + (b - a) * i / 160;
        [n.f(x), n.fp(x)].forEach(y => {
            if (Number.isFinite(y)) {
                lo = Math.min(lo, y);
                hi = Math.max(hi, y);
            }
        });
    }
    const pad = Math.max(0.3, (hi - lo) * 0.08);
    return [a, b, lo - pad, hi + pad];
}

/* The structure half of the network. Leaves stay short so the three levels fit
   the pane, and a leaf only shows its result once that row is finished. */
function networkTree(env) {
    const here = NET[env.kase].family;
    const working = env.view === 'derive' || env.view === 'transfer';
    const leaf = k => {
        const n = NET[k];
        const done = env.stage >= n.resultAt;
        return {
            id: k, e: n.label, rule: n.rewrite,
            v: done ? n.result : '?',
            dim: working && n.family !== here
        };
    };
    return {
        id: 'root', e: '(u′v − uv′) / v²', rule: 'one quotient rule, four rows',
        children: [
            { id: 'A', e: FAMILIES.A.e, rule: FAMILIES.A.rule, children: [leaf('tan'), leaf('cot')] },
            { id: 'B', e: FAMILIES.B.e, rule: FAMILIES.B.rule, children: [leaf('sec'), leaf('csc')] }
        ]
    };
}

const UNKNOWN = { v: '?', color: 'auxInk' };

/* The comparison board: the five columns of the derivation, one row per
   function, colored by sign family and unlocked cell by cell. */
function boardRows(env) {
    return ORDER.map(k => {
        const n = NET[k];
        const focused = env.kase === k && (env.view === 'derive' || env.view === 'transfer');
        const numerOpen = env.view !== 'hide' && env.stage >= n.numerAt;
        const resultOpen = env.view !== 'hide' && env.stage >= n.resultAt;
        return [
            { v: n.label, color: n.tone, bold: true },
            { v: n.rewrite, bold: focused },
            numerOpen ? { v: n.numer, color: n.tone, bold: focused } : UNKNOWN,
            resultOpen ? { v: n.simpl, color: n.tone, bold: focused } : UNKNOWN,
            resultOpen ? { v: n.result, color: n.tone, bold: true } : UNKNOWN
        ];
    });
}

function filledCount(env) {
    return ORDER.filter(k => env.view !== 'hide' && env.stage >= NET[k].resultAt).length;
}

function boardNote(env) {
    if (env.view === 'hide') {
        return 'A question mark is a cell to rebuild. The Rewrite cell is still the whole starting point.';
    }
    if (env.view === 'transfer') {
        return 'Green rows keep a positive result and red rows keep one minus. The open cells in the highlighted row sit on a branch that already has a finished neighbor.';
    }
    return 'Green rows are the positive family and red rows are the minus family. Each row writes the same four moves: rewrite, quotient-rule numerator, simplify, derivative.';
}

function boardTitle(env) {
    if (env.view === 'hide') return 'The board with the results hidden';
    return 'Comparison board · ' + filledCount(env) + ' of 4 derivatives filled';
}

function derivationLines(env) {
    const n = NET[env.kase];
    if (env.view === 'transfer') {
        return n.givenLines.concat([{ t: 'The last two cells of this row are still open.', dim: true, rule: 'predict them' }]);
    }
    return [{ t: n.identity, rule: 'the Rewrite cell', hl: true }].concat(n.stepsL);
}

function auditItems(env) {
    return NET[env.kase].audit;
}

function boardGuide(env) {
    if (env.view === 'hide') {
        return 'The Rewrite cell is an identity, and it is enough to start from. Combine it with (sin x)′ = cos x and (cos x)′ = −sin x inside the quotient rule, and the Derivative cell follows on its own.';
    }
    if (env.view === 'transfer') {
        return 'One minus in this row is all it takes to flip the result. Fill the open cells and the sign audit on the right checks your reasoning.';
    }
    if (env.stage < 6) {
        return 'The colors split the four rows into a positive family and a minus family. The tree splits the same four rows by the shape of the Rewrite cell. Watch which function sits in the denominator while each row fills in.';
    }
    return 'The same four rows sort two ways. Shape puts tan x with cot x and sec x with csc x. Sign puts tan x with sec x and cot x with csc x. The question beside the board asks which of these two sortings decides the sign.';
}

const PRACTICE = ORDER.map(k => {
    const n = NET[k];
    const items = {
        tan: ['+sec²x. The numerator cos²x + sin²x is 1, and the denominator is cos²x.',
            '−csc²x. This is the result of the cot x row, which divides by sin x.',
            '+sec x · tan x. This is the result of the sec x row, whose numerator is +sin x.'],
        cot: ['−csc²x. The numerator is −1 after the Pythagorean identity, and the denominator is sin²x.',
            '+sec²x. This is the result of the tan x row, which divides by cos x.',
            '−csc x · cot x. This is the result of the csc x row, whose numerator is −cos x.'],
        sec: ['+sec x · tan x. Only +sin x survives in the numerator, and sin x/cos²x splits into the two factors.',
            '+sec²x. This is the result of the tan x row, whose numerator keeps both squared terms.',
            '−sec x · tan x. The minus would have to come from v′, and here the subtraction turns −sin x positive.'],
        csc: ['−csc x · cot x. The numerator is −cos x, and −cos x/sin²x splits into the two factors with the minus in front.',
            '−csc²x. This is the result of the cot x row, whose numerator keeps two squared terms.',
            '+csc x · cot x. The positive form belongs to a row that divides by cos x, and this row divides by sin x.']
    };
    return {
        q: n.identity + '. Fill the Derivative cell of this row.',
        choices: items[k], a: 0,
        why: 'Rewrite ' + n.label + ' as ' + n.rewrite + ', run the quotient rule with (sin x)′ = cos x and (cos x)′ = −sin x, and the numerator of this row is ' + n.numer + '. That leaves ' + n.simpl + ', which is ' + n.result + '.'
    };
});

export default {
    id: 'u2-trig-network',
    meta: { unit: 2, topic: '2.10', title: 'Finding the Derivatives of Tangent, Cotangent, Secant, and/or Cosecant Functions', visualizerTitle: 'Trig Derivative Network' },
    intro: 'These four formulas are one network, not four facts. Each row starts from an identity, runs the quotient rule, and ends with a sign that comes from the derivative of sin x or cos x.',
    params: { view: 'network', kase: 'tan', stage: 1, x0: 0.6 },
    controls: [
        {
            key: 'kase', label: 'row in focus', kind: 'choice',
            when: env => (env.view === 'network' && env.stage >= 6) || env.view === 'graph',
            options: ORDER.map(k => ({ v: k, label: NET[k].label }))
        },
        { key: 'x0', label: 'probe x', min: 0.3, max: 1.15, step: 0.01, when: env => env.view === 'graph' && (env.kase === 'tan' || env.kase === 'sec') },
        { key: 'x0', label: 'probe x', min: 0.55, max: 1.4, step: 0.01, when: env => env.view === 'graph' && (env.kase === 'cot' || env.kase === 'csc') }
    ],
    fns: {
        f: (x, env) => NET[env.kase].f(x),
        fp: (x, env) => NET[env.kase].fp(x)
    },
    compute: (env) => {
        const n = NET[env.kase];
        const x0 = probeIn(env);
        const measured = derivative(n.f, x0);
        const claimed = n.fp(x0);
        return { x0, measured, claimed, diff: Math.abs(measured - claimed) };
    },
    panes: {
        main: [
            {
                kind: 'tree', title: env => env.stage >= 6 ? 'The finished network' : 'One quotient rule, two branches',
                when: env => env.view === 'network' && (env.stage === 1 || env.stage >= 6),
                root: env => networkTree(env),
                focus: env => env.kase
            },
            {
                kind: 'table', title: env => boardTitle(env),
                when: env => env.view !== 'graph',
                cols: ['Function', 'Rewrite', 'Quotient-rule numerator', 'Simplify', 'Derivative'],
                rows: env => boardRows(env),
                note: env => boardNote(env)
            },
            {
                kind: 'eq', title: env => env.view === 'transfer'
                    ? 'Given lines for ' + NET[env.kase].label + ', then your turn'
                    : env.view === 'network'
                        ? 'Full derivation of the row in focus: ' + NET[env.kase].label
                        : 'Row by row: the derivation of ' + NET[env.kase].label,
                when: env => env.view === 'derive' || env.view === 'transfer' || (env.view === 'network' && env.stage >= 6),
                lines: env => derivationLines(env)
            },
            {
                kind: 'graph', title: env => 'Sanity check on one branch of ' + NET[env.kase].label, height: 300,
                when: env => env.view === 'graph',
                window: env => windowFor(env),
                curves: env => [
                    { fn: 'f', color: 'curveA', label: NET[env.kase].label },
                    { fn: 'fp', color: 'curveC', label: 'derivative', dashed: true }
                ],
                points: env => [
                    { x: env.x0, fn: 'f', color: 'accent', label: 'x₀' },
                    { x: env.x0, fn: 'fp', color: 'up' }
                ],
                vlines: env => [{ x: env.x0, color: 'auxInk', dash: false }]
            },
            {
                kind: 'practice', id: 'u2-trig-rebuild', title: 'Rebuild all four formulas from the identity',
                when: env => env.view === 'hide',
                items: PRACTICE
            }
        ],
        side: [
            {
                kind: 'readout', title: 'At the probe point',
                when: env => env.view === 'graph',
                items: env => {
                    const n = NET[env.kase];
                    return [
                        { label: n.label, v: n.f(env.x0), color: 'accent' },
                        { label: 'slope measured on the curve', v: env.measured, big: true, color: 'up' },
                        { label: 'slope from ' + n.result, v: env.claimed, color: 'down' },
                        { label: 'difference', v: env.diff, digits: 4 }
                    ];
                }
            },
            {
                kind: 'checklist', title: 'Sign audit for this row',
                when: env => env.view === 'transfer',
                items: env => auditItems(env),
                verdict: env => NET[env.kase].verdict,
                verdictOk: true
            },
            {
                kind: 'note', title: 'How to read the board', text: env => boardGuide(env),
                when: env => env.view === 'network' || env.view === 'hide'
            },
            {
                kind: 'note', title: 'What the drawn branch shows', text: env => NET[env.kase].graphNote,
                when: env => env.view === 'graph'
            },
            {
                kind: 'note', tone: 'warn', title: 'Domain restriction', text: env => NET[env.kase].domain,
                when: env => env.view === 'graph'
            }
        ]
    },
    steps: [
        {
            params: { view: 'derive', kase: 'tan', stage: 2 },
            predict: {
                q: 'The tree splits the four functions into two branches. Which two functions hang on the branch whose Rewrite cell divides 1 by a function?',
                choices: [
                    'sec x and csc x. Their Rewrite cells are 1/cos and 1/sin, so the numerator of the quotient is the constant 1.',
                    'tan x and cot x. Their Rewrite cells are sin/cos and cos/sin, so one function stands over the other.',
                    'tan x and sec x. Both Rewrite cells put cos x in the denominator, so the two rows share a sign.'
                ],
                a: 0,
                why: 'The reciprocal branch holds sec x and csc x, because their Rewrite cells are 1/cos and 1/sin. The other branch holds tan x and cot x, where one function of x stands over the other. The pair tan x and sec x does share the denominator cos x, but that pairing is about sign and it cuts across both branches.'
            },
            message: 'The walk opens with one full derivation. Read the Rewrite cell of the tan x row as sin x over cos x, then let the quotient rule run to the bottom of the row.'
        },
        {
            params: { view: 'transfer', kase: 'cot', stage: 3 },
            predict: {
                q: 'After substituting, the numerator of the tan x row is cos²x + sin²x. What does that expression simplify to?',
                choices: [
                    '1. The Pythagorean identity turns cos²x + sin²x into 1.',
                    '0. The two terms cancel each other inside the numerator.',
                    'cos²x · sin²x. The two squared terms multiply here.'
                ],
                a: 0,
                why: 'sin²x + cos²x equals 1 for every value of x, so the numerator becomes 1 and the fraction is 1/cos²x, which the board writes as +sec²x. The numerator adds two positive squares, so it cannot cancel to 0, and the identity combines them by addition rather than multiplication.'
            },
            message: 'cot x sits on the same branch of the tree, with the order of the Rewrite cell swapped. Its numerator is filled on the board and the last two cells are still open.'
        },
        {
            params: { view: 'derive', kase: 'sec', stage: 4 },
            predict: {
                q: 'The numerator of the cot x row is −sin²x − cos²x. What sign does the whole fraction carry, and what does it become?',
                choices: [
                    'Negative. Factoring out the minus gives −(sin²x + cos²x), which is −1, and −1/sin²x is −csc²x.',
                    'Positive. The two squares add to 1, so the fraction matches the +sec²x result of the tan x row.',
                    'Either sign. The quadrant that x sits in decides which sign appears.'
                ],
                a: 0,
                why: 'Both terms of the numerator carry the same minus, so the numerator is −1 while the denominator sin²x stays positive. The quotient is −1/sin²x, which is −csc²x, and it stays negative wherever cot x is defined. The difference from the tan x row is the order of sin x and cos x, because that order decides whether the rule subtracts a positive term or a negative one.'
            },
            message: 'Now the reciprocal branch. For sec x the numerator of the quotient is the constant 1, so the first term of the quotient rule is 0 and only the second term is left.'
        },
        {
            params: { view: 'transfer', kase: 'csc', stage: 5 },
            predict: {
                q: 'The quotient rule gives 0·cos x − 1·(−sin x) for the numerator of the sec x row. What is left?',
                choices: [
                    '+sin x. The rule subtracts 1·(−sin x), and subtracting a negative leaves a positive.',
                    '−sin x. The derivative of cos x is −sin x, so that minus stays at the front.',
                    '0. The numerator of the quotient is the constant 1, so its derivative ends the calculation.'
                ],
                a: 0,
                why: 'The term u′v is 0 because u is the constant 1, so the numerator is the single term −uv′, which is +sin x here. The fraction becomes sin x/cos²x, and splitting one factor cos x gives the board entry +sec x · tan x. The sec x row and the tan x row both divide by cos x, and both results come out positive.'
            },
            message: 'csc x pairs with sec x the way cot x pairs with tan x. The numerator of the csc x row is visible on the board, and its result is still open.'
        },
        {
            params: { view: 'network', kase: 'tan', stage: 6 },
            predict: {
                q: 'The derivative of csc x keeps a minus sign, but the derivative of sec x does not. Where does that difference come from?',
                choices: [
                    'From the term v′. The derivative of sin x is cos x, while the derivative of cos x is −sin x.',
                    'From the order of the rows on the board. The csc x row comes last, so it takes the leftover sign.',
                    'From nothing. The minus on csc x is a memorized convention with no calculation behind it.'
                ],
                a: 0,
                why: 'On both rows u is the constant 1, so u′v is 0 and the numerator is the single term −v′. For csc x that term is −cos x, and for sec x it is −(−sin x), which turns positive. The sign follows from which function sits in the denominator, exactly as it does on the two rows that divide by sin x or cos x.'
            },
            message: 'The board is complete. The tree sorts the four rows by the shape of the Rewrite cell, and the colors sort the same four rows by the sign of the result.'
        },
        {
            params: { view: 'graph', kase: 'tan', x0: 0.9 },
            predict: {
                q: 'Which fact explains why the cot x row and the csc x row both end with a minus sign?',
                choices: [
                    'Both Rewrite cells divide by sin x, and the derivative of sin x is cos x, which carries no minus of its own.',
                    'Both Rewrite cells divide by cos x, and the derivative of cos x is −sin x.',
                    'Both results contain a squared cofunction, and a squared quantity is never negative.'
                ],
                a: 0,
                why: 'Dividing by sin x means v′ is cos x, so the quotient rule subtracts a positive term and the numerator keeps exactly one minus. The rows that divide by cos x subtract a negative term instead, and that double negative produces the positive results +sec²x and +sec x · tan x. Squares sit in the denominator, so they control the size of the fraction rather than the sign of the numerator.'
            },
            message: 'The graph is a check on the board rather than the main picture. Choose a function and compare what the drawn branch does with the sign written on its row.'
        },
        {
            params: { view: 'hide' },
            predict: {
                q: 'The graph screen shows one branch of the chosen function. For which functions does the sign on that branch also hold on every other branch?',
                choices: [
                    'tan x and cot x. The results +sec²x and −csc²x keep their sign wherever the function is defined.',
                    'sec x and csc x. Their curves sit above the axis on the drawn branch, so the derivative keeps one sign everywhere.',
                    'All four functions. A derivative curve drawn on one branch always repeats the same sign on the next branch.'
                ],
                a: 0,
                why: 'For tan x the result is +sec²x and for cot x it is −csc²x, and a squared cofunction never changes sign, so every branch rises or falls. The results +sec x · tan x and −csc x · cot x contain tan x and cot x, and those two cofunctions do change sign from branch to branch, so those graphs only witness the branch on the screen.'
            },
            message: 'The Derivative column is blank again. Rebuild each formula from its Rewrite cell before you read the summary.'
        },
        {
            message: 'When a formula slips away during the exam, write the identity, run the quotient rule, and let the sign of v′ decide the front of the answer.'
        }
    ],
    summary: {
        idea: [
            'Every row on the board comes from one identity, the quotient rule, and the derivatives of sin x and cos x, so none of the four formulas is a separate fact to memorize.',
            'tan x and sec x divide by cos x, so the rule subtracts the negative term −sin x and both results stay positive. cot x and csc x divide by sin x, so the rule subtracts the positive term cos x and one minus survives to the answer.'
        ],
        mistake: 'Writing sec x · tan x as tan x drops the factor sec x. Dropping the minus on cot x or csc x comes from skipping the sign step in the numerator. Write that step out in full, because it is the only place the sign is decided.',
        transfer: 'Blank the Derivative column and rebuild all four formulas from the Rewrite cells. Then say where the minus in the derivative of csc x first appears and explain why no second minus ever arrives to cancel it.'
    }
}
