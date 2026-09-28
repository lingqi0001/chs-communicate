/* 5.4 First Derivative Test, transfer mode: classify critical points from f′ alone.

   The rule that shapes this file is that no screen draws f. Problem 1 hands the
   student a sign table of f′ and nothing else, Problem 2 hands over the graph of
   y = f′(x) = (x + 2)x²(x − 2) = x⁴ − 4x², which crosses the x-axis at −2 and 2 and
   only touches it at 0. Both problems ask the same three questions, one per
   critical point, and the answers arrive as stage reveals rather than as answer
   feedback, so pressing Next without touching a choice still walks the mode.

   Reveals are driven by one monotone stage counter, and stage equals the screen
   index, because screen i merges steps[0..i-1].params and shows steps[i-1].message.
   A flag set in step k therefore first appears on screen k+1, which is the screen
   after the one where its question was sitting.

   Every flag also carries its own upper bound, because one open-ended stretch per
   problem would leave the last screen holding both problems at once. Problem 1
   owns the early screens and leaves behind the Problem 1 result recap in the side
   column, Problem 2 owns the later screens, and the First Derivative Test rule
   card is the one pane that never leaves. Nothing was deleted for this, each
   retirement is a ceiling on a stage flag.

   Every table cell is a function returning a formatted string. The table renderer
   feeds a plain string through its expression parser, which turns the real minus
   sign − back into an ASCII hyphen. */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

/* one table cell, always as a function so the renderer prints it verbatim */
const cell = (s, emph) => Object.assign({ v: () => s }, emph || {});

const V_MAX = 'a local maximum';
const V_MIN = 'a local minimum';
const V_NONE = 'no local extremum';
const vColor = (v) => v === V_MAX ? 'accent' : v === V_MIN ? 'aux' : 'auxInk';

/* Problem 1 given data: critical points −2, 0, 3 and the four interval signs. */
const P1_IVS = [
    { iv: '(−∞, −2)', s: '+', b: 'increasing' },
    { iv: '(−2, 0)', s: '−', b: 'decreasing' },
    { iv: '(0, 3)', s: '−', b: 'decreasing' },
    { iv: '(3, ∞)', s: '+', b: 'increasing' }
];

/* the two verdict boards share one row builder, so the columns read identically
   in Problem 1 and Problem 2 and only the critical x-values differ */
const CLASS_ROWS = {
    p1: [
        { x: -2, left: '+', right: '−', change: 'increasing → decreasing', v: V_MAX },
        { x: 0, left: '−', right: '−', change: 'decreasing → decreasing', v: V_NONE },
        { x: 3, left: '−', right: '+', change: 'decreasing → increasing', v: V_MIN }
    ],
    p2: [
        { x: -2, left: '+', right: '−', change: 'increasing → decreasing', v: V_MAX },
        { x: 0, left: '−', right: '−', change: 'decreasing → decreasing', v: V_NONE },
        { x: 2, left: '−', right: '+', change: 'decreasing → increasing', v: V_MIN }
    ]
};
const CLASS_COLS = ['Critical x', 'Sign of f′ left', 'Sign of f′ right', 'Behavior change of f', 'Conclusion'];
const classRows = (key) => CLASS_ROWS[key].map(r => [
    cell('x = ' + dsp(r.x), { bold: true }),
    cell(r.left, { color: r.left === '+' ? 'up' : 'down' }),
    cell(r.right, { color: r.right === '+' ? 'up' : 'down' }),
    cell(r.change),
    cell(r.v, { color: vColor(r.v), bold: true })
]);

const VERDICTS = {
    p1: [
        { t: 'x = −2: the sign of f′ goes from + on (−∞, −2) to − on (−2, 0), so f turns from increasing to decreasing and x = −2 carries ' + V_MAX + '.', c: 'accent' },
        { t: 'x = 0: the sign of f′ is − on (−2, 0) and − on (0, 3), so there is no sign change and x = 0 carries ' + V_NONE + '.', c: 'auxInk' },
        { t: 'x = 3: the sign of f′ goes from − on (0, 3) to + on (3, ∞), so f turns from decreasing to increasing and x = 3 carries ' + V_MIN + '.', c: 'aux' }
    ],
    p2: [
        { t: 'x = −2: the graph of f′ is above the x-axis left of −2 and below it right of −2, so + → − and x = −2 carries ' + V_MAX + '.', c: 'accent' },
        { t: 'x = 0: the graph of f′ touches the x-axis at 0 and drops back without crossing, so − → − and x = 0 carries ' + V_NONE + '.', c: 'auxInk' },
        { t: 'x = 2: the graph of f′ is below the x-axis left of 2 and above it right of 2, so − → + and x = 2 carries ' + V_MIN + '.', c: 'aux' }
    ]
};
const verdictLines = (list, flags) => list.filter((v, i) => flags[i]).map(v => ({ t: v.t, color: v.c }));

/* The frame is roomier than the picture: a window edge that lands exactly on a
   tick value pushes that tick label outside the viewBox, and the top tick would
   also land on the row where the vertical guides are named. */
const WIN = [-3.3, 3.3, -6.8, 7.6];
const RT2 = Math.SQRT2;
/* the arms of x⁴ − 4x² reach y = 6 at x = ±sqrt(2 + sqrt(10)), so the drawn curve
   leaves the window there and the crossings at ±2 stay well inside it */
const EXIT = Math.sqrt(2 + Math.sqrt(10));

export const firstDerivativeTransferMode = {
    label: 'Classify from f′ only',
    intro: 'No screen in this mode shows the graph of f. Problem 1 gives a sign table of f′, Problem 2 gives the graph of y = f′(x), and every answer has to come out of the signs of f′ on the two sides of a critical point. The First Derivative Test rule card stays in the side column the whole way, so the work here is reading and classifying, not redrawing anything.',
    params: { stage: 0 },
    controls: [],
    fns: {
        dfr: (x) => (x + 2) * x * x * (x - 2)
    },
    compute: (env) => ({
        /* Problem 1 owns screens 1 to 6. Its classification board holds the whole
           result on screen 6, and after that only the small result recap in the
           side column survives. */
        table1: env.stage >= 1 && env.stage <= 6,
        ask1: env.stage >= 2 && env.stage <= 6,
        whatasks: env.stage >= 1 && env.stage <= 6,
        verdicts1: env.stage >= 3 && env.stage <= 5,
        r1: env.stage >= 3,
        r2: env.stage >= 4,
        r3: env.stage >= 5,
        board1: env.stage >= 6 && env.stage <= 6,
        result1: env.stage >= 6,
        /* Problem 2 owns screens 7 to 14. Its graph stays to the end, because the
           last two questions are about the marks drawn on it, and its reading aids
           retire on screen 12 once the classification board and the sign bands
           carry the same reading. */
        g2: env.stage >= 7,
        p2read: env.stage >= 7 && env.stage <= 11,
        ask2: env.stage >= 8 && env.stage <= 12,
        verdicts2: env.stage >= 9 && env.stage <= 11,
        r4: env.stage >= 9,
        r5: env.stage >= 10,
        touch: env.stage >= 10 && env.stage <= 11,
        r6: env.stage >= 11,
        board2: env.stage >= 12,
        ask3: env.stage >= 13,
        r7: env.stage >= 14
    }),
    panes: {
        main: [
            {
                kind: 'table', title: 'Problem 1 sign table of f′',
                when: (env) => env.table1,
                cols: ['Interval of x', 'Sign of f′', 'What f does there'],
                rows: () => P1_IVS.map(r => [
                    cell(r.iv),
                    cell(r.s, { color: r.s === '+' ? 'up' : 'down', bold: true }),
                    cell(r.b)
                ]),
                note: 'This table is the whole of Problem 1. The critical points of f are x = −2, x = 0 and x = 3, and they are the places where these four intervals meet. Nothing here is read from a picture of f.'
            },
            {
                kind: 'practice', id: 'u54-fdt-p1', title: 'Problem 1 practice',
                when: (env) => env.ask1,
                items: [
                    {
                        q: 'In the Problem 1 sign table of f′, how should the critical point x = −2 be classified?',
                        choices: [
                            'x = −2 carries ' + V_MAX + ', because f′ is positive on (−∞, −2) and negative on (−2, 0), so f turns from increasing to decreasing at that point.',
                            'x = −2 carries ' + V_MIN + ', because f′ is positive on (−∞, −2) and negative on (−2, 0), and a derivative stepping down through zero lands on the bottom of a turn.',
                            'x = −2 carries ' + V_NONE + ', because the Problem 1 sign table of f′ says nothing about f itself, so no behavior of f can be decided from it.'
                        ], a: 0,
                        whyBy: [
                            'The two sides of x = −2 carry different signs, and + on the left with − on the right is the first line of the First Derivative Test rule card. That line names a local maximum.',
                            'The signs you read are correct, and the line of the rule card you used is the wrong one. Positive to negative is the maximum line, and a minimum needs negative to positive.',
                            'A sign table of f′ is information about f, because topic 5.3 already gave the dictionary from the sign of f′ to the behavior of f. The middle column of the Problem 1 sign table of f′ is written in words about f, and the test turns a change of that behavior into a classification.'
                        ]
                    },
                    {
                        q: 'In the Problem 1 sign table of f′, how should the critical point x = 0 be classified?',
                        choices: [
                            'x = 0 carries ' + V_MIN + ', because f′(0) = 0 and both intervals beside x = 0 are intervals where f′ is negative.',
                            'x = 0 carries ' + V_NONE + ', because f′ is negative on (−2, 0) and negative on (0, 3), so f is decreasing on both sides and its behavior never changes there.',
                            'x = 0 carries ' + V_MAX + ', because x = 0 is listed as a critical point, and a critical point between two decreasing intervals sits at the top of the second one.'
                        ], a: 1,
                        whyBy: [
                            'f′(0) = 0 is what puts x = 0 on the list of critical points, and it is not a classification. The two sides agree, so there is nothing for the test to compare and no extremum appears.',
                            'Both sides carry the sign −, and the same sign on both sides is the third line of the First Derivative Test rule card. That line says no local extremum occurs, and it is the one this point needs.',
                            'Being listed as a critical point earns a place to inspect and nothing more. The behavior on both sides is decreasing, so there is no top here and no bottom either.'
                        ]
                    },
                    {
                        q: 'In the Problem 1 sign table of f′, how should the critical point x = 3 be classified?',
                        choices: [
                            'x = 3 carries ' + V_NONE + ', because the interval (3, ∞) has no right end, so there is nothing beside x = 3 to compare with (0, 3).',
                            'x = 3 carries ' + V_MAX + ', because f′ changes from negative on (0, 3) to positive on (3, ∞), and a derivative leaving zero upward opens a top.',
                            'x = 3 carries ' + V_MIN + ', because f′ is negative on (0, 3) and positive on (3, ∞), so f turns from decreasing to increasing at that point.'
                        ], a: 2,
                        whyBy: [
                            'An interval that runs on forever is still a side of the point, and its sign is printed in the second row column of the Problem 1 sign table of f′. The test compares the two sides of x = 3, and both are given.',
                            'The signs you read are right, and the direction is attached to the wrong line of the rule card. Negative to positive is the minimum line, so a maximum cannot be the conclusion here.',
                            'The left side is − and the right side is +, which is the second line of the First Derivative Test rule card. Decreasing then increasing around one point is what a local minimum means.'
                        ]
                    }
                ]
            },
            {
                kind: 'eq', title: 'Problem 1 verdicts',
                when: (env) => env.verdicts1,
                lines: (env) => verdictLines(VERDICTS.p1, [env.r1, env.r2, env.r3])
            },
            {
                kind: 'table', title: 'Problem 1 classification table',
                when: (env) => env.board1,
                cols: CLASS_COLS,
                rows: () => classRows('p1'),
                note: 'The Problem 1 classification table writes the three verdicts in the same five columns: the critical x-value, the sign of f′ on its left, the sign of f′ on its right, the change of behavior those two signs force on f, and the conclusion. Only the rows whose sign columns differ carry a local extremum, and here two of the three rows do.'
            },
            {
                kind: 'graph', title: 'Problem 2 graph of y = f′(x)',
                when: (env) => env.g2,
                window: WIN,
                gridX: 1, gridY: 2,
                curves: [
                    { fn: 'dfr', color: 'accent', samples: 600, label: 'y = f′(x)', labelAt: -1.15 }
                ],
                vlines: () => [
                    { x: -2, color: 'accent', label: 'x = −2' },
                    { x: 0, color: 'accent', label: 'x = 0' },
                    { x: 2, color: 'accent', label: 'x = 2' }
                ],
                points: () => [
                    { x: -2, y: 0, color: 'accent' },
                    { x: 0, y: 0, color: 'accent' },
                    { x: 2, y: 0, color: 'accent' },
                    { x: -RT2, y: -4, color: 'ink', r: 4, label: 'f′ = −4', labelDy: 20, labelDx: -30 },
                    { x: RT2, y: -4, color: 'ink', r: 4, label: 'f′ = −4', labelDy: 20, labelDx: -30 }
                ]
            },
            {
                kind: 'readout', title: 'Problem 2 facts to read',
                when: (env) => env.p2read,
                items: [
                    { label: 'Curve drawn', v: () => 'y = f′(x) = x⁴ − 4x²', color: 'accent' },
                    { label: 'f′ at x = −2', v: () => dsp(0) },
                    { label: 'f′ at x = 0', v: () => dsp(0) },
                    { label: 'f′ at x = 2', v: () => dsp(0) },
                    { label: 'Least value of f′ shown', v: () => dsp(-4) },
                    { label: 'Where f′ is least', v: () => 'x ≈ ' + dsp(-RT2) + ' and x ≈ ' + dsp(RT2) },
                    { label: 'Curve leaves the window', v: () => 'near x ≈ ' + dsp(-EXIT) + ' and x ≈ ' + dsp(EXIT) }
                ]
            },
            {
                kind: 'note', title: 'How to read the Problem 2 graph',
                when: (env) => env.p2read,
                text: 'The curve in the Problem 2 graph of y = f′(x) is the derivative, and it is the only curve in this mode. Wherever that curve sits above the x-axis, f′ is positive and f increases. Wherever it sits below the x-axis, f′ is negative and f decreases. Every place the curve meets the x-axis is a critical point of f, and the classification comes from which side of the axis the curve is on as it passes. The two marks at f′ = −4 are features of the derivative graph, so treat them as heights of f′ and nothing else.'
            },
            {
                kind: 'practice', id: 'u54-fdt-p2', title: 'Problem 2 practice',
                when: (env) => env.ask2,
                items: [
                    {
                        q: 'In the Problem 2 graph of y = f′(x), how should the critical point x = −2 be classified?',
                        choices: [
                            'x = −2 carries ' + V_MIN + ', because the curve y = f′(x) is falling as it passes through the axis at x = −2 on its way down to −4.',
                            'x = −2 carries ' + V_NONE + ', because f′(−2) = 0 and that point is not a high or low point of the derivative graph, so nothing changes there.',
                            'x = −2 carries ' + V_MAX + ', because the graph of f′ is above the x-axis to the left of −2 and below it to the right, so f′ goes from positive to negative and f goes from increasing to decreasing.'
                        ], a: 2,
                        whyBy: [
                            'The height of the f′ curve and the direction it is travelling are facts about f′, and a falling curve through the axis is exactly the + → − case. Positive on the left and negative on the right is the maximum line of the rule card.',
                            'A zero of f′ is enough to make x = −2 a critical point, and it is not enough to stop the test. Read which side of the axis the curve is on either side of −2, and the signs differ, so the point does classify.',
                            'Left of −2 the curve is above the axis, so f′ is positive there, and right of −2 it is below the axis, so f′ is negative. That is + → −, which the First Derivative Test rule card reads as a local maximum.'
                        ]
                    },
                    {
                        q: 'In the Problem 2 graph of y = f′(x), how should the critical point x = 0 be classified?',
                        choices: [
                            'x = 0 carries ' + V_NONE + ', because the graph of f′ touches the x-axis at 0 and returns below it without crossing, so f′ is negative on both sides and f keeps decreasing.',
                            'x = 0 carries ' + V_MAX + ', because f′(0) = 0 and the curve sits on the axis there, and any point where the derivative graph meets the axis turns the function over.',
                            'x = 0 carries ' + V_MIN + ', because the curve y = f′(x) climbs back toward the axis as x approaches 0 from the left, and a derivative heading upward marks the bottom of a fall.'
                        ], a: 0,
                        whyBy: [
                            'A touch is not a crossing. On both sides of 0 the curve is below the x-axis, so both signs are −, and the same sign on both sides is the no local extremum line of the rule card.',
                            'Meeting the axis is only what makes x = 0 a critical point. The test then asks for the two signs, and here they are both negative, so there is no turn to name.',
                            'Climbing toward the axis is a change in the value of f′, not a change in its sign, and the test reads signs. f′ stays negative right up to 0 and negative again after it.'
                        ]
                    },
                    {
                        q: 'In the Problem 2 graph of y = f′(x), how should the critical point x = 2 be classified?',
                        choices: [
                            'x = 2 carries ' + V_NONE + ', because the curve y = f′(x) is rising steeply at x = 2, and a steep stretch of the derivative graph is a slope fact and not a crossing.',
                            'x = 2 carries ' + V_MIN + ', because the graph of f′ is below the x-axis just left of 2 and above it just right of 2, so f′ goes from negative to positive and f goes from decreasing to increasing.',
                            'x = 2 carries ' + V_MAX + ', because f′ changes from negative on the left of 2 to positive on the right of 2, and a derivative leaving zero upward opens a top.'
                        ], a: 1,
                        whyBy: [
                            'Steepness tells you how fast f′ itself is changing, and the test does not ask that question. At x = 2 the curve does cross the axis, so the two sides carry different signs and the point classifies.',
                            'Left of 2 the curve is under the axis, so f′ is negative, and right of 2 it is over the axis, so f′ is positive. That is − → +, which the First Derivative Test rule card reads as a local minimum.',
                            'The signs you read are correct and the conclusion attached to them belongs to the other line. Negative to positive is the minimum line, so the answer is a local minimum and not a local maximum.'
                        ]
                    }
                ]
            },
            {
                kind: 'eq', title: 'Problem 2 verdicts',
                when: (env) => env.verdicts2,
                lines: (env) => verdictLines(VERDICTS.p2, [env.r4, env.r5, env.r6])
            },
            {
                kind: 'note', title: 'What the touch at x = 0 means', tone: 'warn',
                when: (env) => env.touch,
                text: 'At x = 0 the curve y = f′(x) reaches the x-axis and turns back, so it never passes to the other side. The sign of f′ on the left of 0 and the sign of f′ on the right of 0 are the same sign, and a critical point is classified by a difference between those two signs. That is why x = 0 keeps no local extremum here even though f′(0) = 0. Compare it with x = −2 and x = 2, where the curve crosses the axis and the sign changes on the way through.'
            },
            {
                kind: 'table', title: 'Problem 2 classification table',
                when: (env) => env.board2,
                cols: CLASS_COLS,
                rows: () => classRows('p2'),
                note: 'The Problem 2 classification table fills the same five columns Problem 1 filled, and the three conclusions come out the same way. The x-values differ only in the last row, where Problem 1 had x = 3 and Problem 2 has x = 2.'
            },
            {
                kind: 'numberline', title: 'Problem 2 sign reading',
                when: (env) => env.board2,
                width: 560,
                /* the numberline insets 20px and the graph does not, so this window is
                   narrowed by span/14 to put both layers on one pixel map */
                window: [-3.0643, 3.0643],
                step: 1,
                bands: [
                    { from: -3, to: -2, color: 'up', label: 'f′ > 0' },
                    { from: -2, to: 0, color: 'down', label: 'f′ < 0' },
                    { from: 0, to: 2, color: 'down', label: 'f′ < 0' },
                    { from: 2, to: 3, color: 'up', label: 'f′ > 0' }
                ],
                probes: [
                    { x: -2, label: 'x = −2', color: 'accent' },
                    { x: 0, label: 'x = 0', color: 'accent' },
                    { x: 2, label: 'x = 2', color: 'accent' }
                ]
            },
            {
                kind: 'practice', id: 'u54-fdt-p2b', title: 'Problem 2 second look',
                when: (env) => env.ask3,
                items: [
                    {
                        q: 'The Problem 2 graph of y = f′(x) marks its two lowest points, where f′ = −4 at x ≈ −1.41 and at x ≈ 1.41. Do those two points carry a local extremum of f?',
                        choices: [
                            'Yes, x ≈ 1.41 carries ' + V_MIN + ', because that is where the derivative graph is at its lowest, and the bottom of the derivative sits at the bottom of the function.',
                            'No, neither point carries a local extremum of f, because f′ is not 0 there, so x ≈ −1.41 and x ≈ 1.41 are not critical points of f at all.',
                            'Yes, x ≈ −1.41 carries ' + V_MAX + ', because the derivative graph turns upward there, and a turn in the drawn picture is a turn in the function.'
                        ], a: 1,
                        whyBy: [
                            'A low point of the graph of f′ is a statement about the size of f′, and here that size is −4 rather than 0. A critical point of f needs f′ to be 0 or to fail to exist, so this location never reaches the list of points to classify.',
                            'The test compares signs across a critical point, and a critical point of this differentiable curve is a place where f′ = 0. Where f′ = −4 the sign is negative on both sides, so there is nothing to compare and no point to classify.',
                            'The turn you name belongs to f′, and the value of f′ at that turn is −4. A derivative that is negative on both sides of a location says f is decreasing through it, and that is no extremum.'
                        ]
                    }
                ]
            },
            {
                kind: 'compare', title: 'A zero of f′ against a sign change',
                when: (env) => env.r7,
                sides: [
                    {
                        title: 'The shortcut', tone: 'wrong',
                        lines: [
                            'f′(c) = 0, therefore x = c is a local extremum.',
                            'The lowest point of the graph of f′ is a local extremum of f.',
                            'A critical point in the middle of two intervals with the same sign still gets a conclusion.'
                        ]
                    },
                    {
                        title: 'The test', tone: 'right',
                        lines: [
                            'f′(c) = 0 makes x = c a point to inspect.',
                            'Then read the sign of f′ immediately left and immediately right.',
                            '+ → − gives a local maximum, − → + gives a local minimum, same sign gives no local extremum.'
                        ]
                    }
                ],
                verdict: 'A critical point tells you where to inspect, and the two signs tell you what happens there. The least value of f′ names a place on the derivative graph, not a place on f.'
            }
        ],
        side: [
            {
                kind: 'eq', title: 'First Derivative Test rule card',
                lines: [
                    { t: 'f′ > 0 means f is increasing.' },
                    { t: 'f′ < 0 means f is decreasing.' },
                    { t: '+ → −   ' + V_MAX, color: 'accent', hl: true },
                    { t: '− → +   ' + V_MIN, color: 'aux', hl: true },
                    { t: 'same sign on both sides   ' + V_NONE, color: 'auxInk', hl: true },
                    { t: 'The test compares the sign of f′ immediately to the left and immediately to the right of a critical point.' }
                ]
            },
            {
                kind: 'note', title: 'No graph of f here',
                text: 'This mode gives information about f′ and asks for classifications of critical points of f. Problem 1 works from a sign table of f′, and Problem 2 works from the graph of y = f′(x). Neither one is a picture of f, and no screen in this mode becomes one.'
            },
            {
                kind: 'note', title: 'What each problem asks',
                when: (env) => env.whatasks,
                text: 'Topic 5.3 asked what f does on an interval, and the answer was increasing or decreasing. Both problems here ask the topic 5.4 question instead, which is what happens at one critical point as x passes through it, and the answer is a local maximum, a local minimum, or no local extremum. Read the First Derivative Test rule card for the three lines, and use the sign columns or the position of the curve to decide which line a point falls under.'
            },
            {
                kind: 'readout', title: 'Problem 1 result',
                /* the one piece of Problem 1 that stays: three lines of verdicts,
                   so Problem 2 never shares its screens with Problem 1's tables */
                when: (env) => env.result1,
                items: [
                    { label: 'x = −2', v: () => V_MAX, color: 'accent' },
                    { label: 'x = 0', v: () => V_NONE, color: 'auxInk' },
                    { label: 'x = 3', v: () => V_MIN, color: 'aux' }
                ]
            },
            {
                kind: 'readout', title: 'Problem 2 result',
                when: (env) => env.board2,
                items: [
                    { label: 'x = −2', v: () => V_MAX, color: 'accent' },
                    { label: 'x = 0', v: () => V_NONE, color: 'auxInk' },
                    { label: 'x = 2', v: () => V_MIN, color: 'aux' }
                ]
            },
            {
                kind: 'note', title: 'Why the two problems agree',
                when: (env) => env.r7,
                text: 'Problem 1 and Problem 2 give the same shape of information in two different formats. A sign table of f′ states the sign on each interval in words, and the graph of y = f′(x) states it as a position above or below the x-axis. Both list three critical points, two of them crossings and one of them a touch, so both end with a local maximum, no local extremum, and a local minimum in that order. The formats differ, and the test applied to them does not.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The Problem 1 sign table of f′ is all this problem gives. Its four rows name the sign of f′ on each interval, and its middle column translates those signs into the behavior of f from topic 5.3. The critical points to classify are x = −2, x = 0 and x = 3, the three boundaries where consecutive rows meet, and the test asks whether the signs actually change across each one. Read the First Derivative Test rule card in the side column before answering.'
        },
        {
            params: { stage: 2 },
            message: 'Three questions now sit in the Problem 1 practice panel, one for each critical point. For every one of them, look at the sign column on the left of that point and on the right of that point, then say which line of the First Derivative Test rule card you are using. Nothing in the table is classified yet.'
        },
        {
            params: { stage: 3 },
            message: 'The first line of the Problem 1 verdicts panel is about x = −2. The sign of f′ is + on (−∞, −2) and − on (−2, 0), so f increases up to −2 and decreases after it. A change from + to − is the maximum line of the First Derivative Test rule card, and x = −2 carries a local maximum.'
        },
        {
            params: { stage: 4 },
            message: 'Now the point that the shortcut gets wrong. f′(0) = 0 puts x = 0 on the list of critical points, and the sign table stops there: the sign is − on (−2, 0) and − on (0, 3). Same sign on both sides means f decreases before x = 0 and decreases after it, so x = 0 carries no local extremum. A zero of f′ is a place to inspect, never a conclusion.'
        },
        {
            params: { stage: 5 },
            message: 'The last row of the Problem 1 verdicts panel reads − on (0, 3) and + on (3, ∞). That is the minimum line of the First Derivative Test rule card, so x = 3 carries a local minimum. Note that (3, ∞) has no right end, and it still works as a side of x = 3, because the test only wants the sign next to the point.'
        },
        {
            params: { stage: 6 },
            message: 'The Problem 1 classification table replaces the verdict list with the full board: the critical x, the sign of f′ left of it, the sign of f′ right of it, the behavior change those signs force, and the conclusion. Only the two rows whose sign columns differ carry an extremum, and the row with matching signs carries no local extremum. This board is all of Problem 1 in one place, and from the next screen its three conclusions survive only in the Problem 1 result recap in the side column.'
        },
        {
            params: { stage: 7 },
            message: 'Problem 1 is finished, and the Problem 1 result recap in the side column is all of it that stays. Problem 2 works from a picture instead of a table, and the picture is still not f. The Problem 2 graph of y = f′(x) draws the derivative f′(x) = (x + 2)x²(x − 2), which equals x⁴ − 4x². It meets the x-axis at x = −2, at x = 0 and at x = 2, and those three points are the critical points to classify. Use the How to read the Problem 2 graph note to convert height above or below the axis into a sign.'
        },
        {
            params: { stage: 8 },
            message: 'Answer the three questions in the Problem 2 practice panel. For each critical point, find where the curve is on the left of it and where it is on the right, say whether that is above or below the x-axis, and only then name the line of the rule card. Do not redraw f in your head as a shape, because nothing here lets you recover its heights.'
        },
        {
            params: { stage: 9 },
            message: 'The first line of the Problem 2 verdicts panel takes x = −2. The curve is above the x-axis on the left of −2 and below it on the right, so f′ goes from + to −, f goes from increasing to decreasing, and x = −2 carries a local maximum. The Problem 1 result recap in the side column shows the same verdict at −2, which Problem 1 read off its sign columns and Problem 2 reads off height.'
        },
        {
            params: { stage: 10 },
            message: 'The second line is the one that needs the touch. At x = 0 the curve reaches the x-axis and falls back, so it stays below the axis on both sides, the sign of f′ is − on both sides, and x = 0 carries no local extremum. The What the touch at x = 0 means note says why a point on the axis can still classify as nothing.'
        },
        {
            params: { stage: 11 },
            message: 'The third line takes x = 2, where the curve crosses upward. Below the axis on the left means −, above it on the right means +, so f′ goes from − to +, f goes from decreasing to increasing, and x = 2 carries a local minimum. All three points of Problem 2 are now classified from the derivative graph alone.'
        },
        {
            params: { stage: 12 },
            message: 'The Problem 2 classification table lines the three verdicts up in the same five columns Problem 1 used, and the Problem 1 result recap in the side column keeps those three answers beside it for the comparison. The Problem 2 sign reading number line writes the four signs of this picture as bands over the same x-values as the graph, and the two middle bands carry the same sign. The Problem 2 facts to read panel and the How to read the Problem 2 graph note have done their job and left, because the table and the bands now say the same thing in shorter form.'
        },
        {
            params: { stage: 13 },
            message: 'One more question about the same picture, and it targets the shortcut that reads a low point of the derivative graph as a low point of the function. The Problem 2 second look panel asks about the two marks at f′ = −4. Decide first whether those locations are even critical points of f.'
        },
        {
            params: { stage: 14 },
            message: 'The two marks at f′ = −4 are heights of the derivative, and f′ is not 0 there, so neither location is a critical point of f and neither one is eligible for a classification. The A zero of f′ against a sign change card at the foot of the page sets the shortcut beside the test. Both problems in this mode reached their conclusions from signs alone, which is the whole transfer.'
        }
    ],
    summary: {
        idea: 'The First Derivative Test classifies a critical point by comparing the sign of f′ immediately before it with the sign of f′ immediately after it. Positive to negative gives a local maximum, negative to positive gives a local minimum, and the same sign on both sides gives no local extremum. The point itself is never the evidence, the sign change across it is, and both problems here decided three points from signs alone, one from a sign table and one from the graph of y = f′(x).',
        mistake: 'f′(c) = 0 only identifies a critical point, it does not prove a maximum or a minimum, which is what x = 0 in both problems shows. Two related slips read the wrong thing off a picture: treating any meeting of the derivative graph with the x-axis as a turn of f, and treating the highest or lowest point of the derivative graph as an extremum of f. That last one names a location where f′ is not even 0.',
        transfer: 'Given only a graph of y = f′(x) or only a sign table of f′, mark every x where f′ is 0, read the sign of f′ just left and just right of each one, and classify. A crossing of the x-axis changes the sign and gives an extremum, a touch of the axis keeps the sign and gives none.'
    }
};

export default firstDerivativeTransferMode;
