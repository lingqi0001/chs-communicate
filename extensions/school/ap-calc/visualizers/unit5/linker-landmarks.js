/* 5.9 Connecting a Function, Its First Derivative, and Its Second Derivative.
   Mode 2, the feature-matching board. No draggable lesson here: the same family
   f = x³ − 3x, f′ = 3x² − 3, f″ = 6x is shown as three aligned reference graphs,
   and the work happens in a table whose cells start as "?" and are filled row by
   row through Predict and reveal.

   5.8 versus 5.9 boundary in the copy too: 5.9 is "identify the corresponding
   features among f, f′, f″", not "construct a sketch from derivative clues".
   This board names what lines up at x = −1, 0 and 1; it never asks the student
   to draw anything.

   Reveal discipline: the three reference graphs carry only unlabeled points at
   the key x-values (coordinates, which are data), never a feature word, so no
   feature name leaks before its question. A row of the table fills only at the
   stage reached after the Predict that earns it. */

const F  = (x) => Math.pow(x, 3) - 3 * x;
const FP = (x) => 3 * x * x - 3;
const FPP = (x) => 6 * x;

const XW0 = -2.2, XW1 = 2.2;
const KEYS = [-1, 0, 1];

/* A feature cell is "?" until its row has been revealed. */
function cell(revealed, text, color) {
    return revealed ? { v: text, color, bold: true } : { v: '?' };
}

export const linkerLandmarksMode = {
    label: 'Landmarks across three graphs',
    intro: 'The same family in three panels that share one x-window: f(x) = x³ − 3x, f′(x) = 3x² − 3, f″(x) = 6x. Only points sit on the curves at x = −1, 0 and 1, and they carry no names yet. The board below lists those three x-values and asks what feature each one is on each graph. Fill the row for x = −1 first.',
    params: { stage: 0 },
    controls: [],
    fns: { f: (x) => F(x), fp: (x) => FP(x), fpp: (x) => FPP(x) },
    compute: (env) => ({
        rowM1: env.stage >= 1,
        rowM0: env.stage >= 2,
        rowP1: env.stage >= 3,
        cards: env.stage >= 4,
        misconception: env.stage >= 4
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'f(x) = x³ − 3x',
                height: 220, window: [XW0, XW1, -4.6, 4.6], gridX: 1, gridY: 2,
                vlines: () => KEYS.map((k, i) => ({ x: k, color: 'auxInk', label: i === 1 ? 'x = 0' : (k < 0 ? 'x = −1' : 'x = 1') })),
                curves: [{ fn: 'f', from: XW0, to: XW1, samples: 600, color: 'curveA' }],
                points: () => KEYS.map((k, i) => ({ x: k, y: F(k), r: 5.5, color: 'accent', label: '', labelDy: i === 2 ? 16 : -10 }))
            },
            {
                kind: 'graph', title: 'f′(x) = 3x² − 3',
                height: 220, window: [XW0, XW1, -4, 12.2], gridX: 1, gridY: 3,
                vlines: () => KEYS.map((k) => ({ x: k, color: 'auxInk' })),
                curves: [{ fn: 'fp', from: XW0, to: XW1, samples: 600, color: 'curveB' }],
                points: () => KEYS.map((k, i) => ({ x: k, y: FP(k), r: 5.5, color: 'accent', label: '', labelDy: i === 1 ? 16 : -10 }))
            },
            {
                kind: 'graph', title: 'f″(x) = 6x',
                height: 200, window: [XW0, XW1, -13.8, 13.8], gridX: 1, gridY: 6,
                vlines: () => KEYS.map((k) => ({ x: k, color: 'auxInk' })),
                curves: [{ fn: 'fpp', from: XW0, to: XW1, samples: 400, color: 'curveC' }],
                points: () => KEYS.map((k, i) => ({ x: k, y: FPP(k), r: 5.5, color: 'accent', label: '', labelDy: i === 0 ? -12 : (i === 1 ? 16 : -12) }))
            },
            {
                kind: 'table', title: 'Landmark board: what each x-value is on each graph',
                cols: ['x', 'Feature on f', 'Feature on f′', 'Feature on f″'],
                rows: (env) => [
                    [
                        { v: '−1', bold: true },
                        cell(env.rowM1, 'local maximum, horizontal tangent', 'up'),
                        cell(env.rowM1, 'zero, changes + to −', 'accent'),
                        cell(env.rowM1, 'negative (f″ = −6)', 'down')
                    ],
                    [
                        { v: '0', bold: true },
                        cell(env.rowM0, 'inflection point', 'accent'),
                        cell(env.rowM0, 'local minimum', 'down'),
                        cell(env.rowM0, 'zero, changes − to +', 'up')
                    ],
                    [
                        { v: '1', bold: true },
                        cell(env.rowP1, 'local minimum, horizontal tangent', 'down'),
                        cell(env.rowP1, 'zero, changes − to +', 'accent'),
                        cell(env.rowP1, 'positive (f″ = 6)', 'up')
                    ]
                ],
                note: 'A "?" is a cell not yet earned. Each filled cell was read from the shared x-value, and each feature word is tied to the graph that carries it.'
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Four relationship cards',
                when: (env) => env.cards,
                lines: [
                    { t: '1. A zero of f′ together with a sign change of f′ gives a local extremum of f.', hl: true },
                    { t: '2. The sign of f′ gives whether f is increasing or decreasing.', hl: true },
                    { t: '3. The sign of f″ gives the concavity of f.', hl: true },
                    { t: '4. A sign change of f″ gives an inflection point of f.' }
                ]
            },
            {
                kind: 'compare', title: 'Extrema of f are not zeros of f″',
                when: (env) => env.misconception,
                sides: () => [
                    {
                        title: 'Wrong',
                        tone: 'wrong',
                        lines: [
                            'f has a local maximum, so f″ must be 0 there.',
                            'f′ has a local minimum, so f has a local minimum.'
                        ]
                    },
                    {
                        title: 'Correct',
                        tone: 'right',
                        lines: [
                            'A local maximum of f sits where f′ = 0 when f is differentiable there, and the sign change of f′ classifies it. At x = −1 here, f″(−1) = −6, not 0.',
                            'An extremum of f′ says how the slopes of f are changing. The minimum of f′ at x = 0 lines up with the inflection point of f, not with an extremum of f.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Fill the x = −1 row. On f there is a peak and the tangent is flat. What is the matching set of features at x = −1?',
                choices: [
                    'f: local maximum with a horizontal tangent. f′: zero, changing from + to −. f″: negative.',
                    'f: inflection point. f′: zero. f″: also zero.',
                    'f: local minimum. f′: zero, changing from − to +. f″: positive.'
                ], a: 0,
                whyBy: [
                    'The peak of f needs f′ = 0 with f′ running + to −, which is what classifies it as a maximum. f″(−1) = −6 is just negative there; it does not create the maximum, it only agrees that f is concave down at the peak.',
                    'An inflection of f is read from a sign change of f″, and f″(−1) = −6 has the same sign on both sides, so nothing inflects at x = −1.',
                    'That is the x = 1 story, not x = −1. Here the peak runs + to −, the opposite sign order from a minimum.'
                ]
            },
            message: 'The x = −1 row is filled. Notice f″ is simply negative there: it did not cause the local maximum, and it is not 0. The classification came from the sign change of f′. Next, the middle row at x = 0.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'At x = 0 the f″ curve crosses zero from negative to positive, and f′ has its low point. What is the matching set at x = 0?',
                choices: [
                    'f: inflection point. f′: a local minimum. f″: zero, changing from − to +.',
                    'f: local minimum. f′: zero. f″: a local maximum.',
                    'f: horizontal tangent. f′: inflection point. f″: zero, not changing sign.'
                ], a: 0,
                whyBy: [
                    'f″ changes sign at 0, so the concavity of f changes and x = 0 is an inflection point of f. The same x is where f′ stops decreasing and starts increasing, its own minimum, and f″ is exactly the slope of f′, so f″(0) = 0.',
                    'f has no extremum at x = 0: the slope there is f′(0) = −3, not 0, so there is no critical point to classify as a minimum.',
                    'There is no horizontal tangent at x = 0 because f′(0) = −3. The flat tangent and the sign change live on the f″ graph, whose zero does change sign.'
                ]
            },
            message: 'The x = 0 row is filled, and it is the one row students mix up most. The inflection of f, the minimum of f′, and the zero of f″ are the same x read on three different graphs. Now the last row, x = 1.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'At x = 1 there is a valley on f. What is the matching set of features there?',
                choices: [
                    'f: local minimum with a horizontal tangent. f′: zero, changing from − to +. f″: positive.',
                    'f: local maximum. f′: zero, changing from + to −. f″: negative.',
                    'f: inflection point. f′: its minimum. f″: zero.'
                ], a: 0,
                whyBy: [
                    'The valley means f′ = 0 with f′ running − to +, which is the classification of a minimum. f″(1) = 6 is positive, agreeing that f is concave up at the valley.',
                    'That is the x = −1 story. Here the sign order is − to +, the opposite, so it is a minimum, not a maximum.',
                    'Those are the x = 0 features. At x = 1 the f″ curve is at +6, positive and not crossing zero.'
                ]
            },
            message: 'The board is complete. All three rows are filled from one shared x-column read on three graphs. The four relationship cards on the right now collect the rules those rows used.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Read the two columns of the board at x = −1. Which claim about that local maximum is actually true?',
                choices: [
                    'A local maximum of f sits where f′ = 0 with a sign change of f′. It does not require f″ = 0; here f″(−1) = −6.',
                    'A local maximum of f requires f″ = 0 at that x.',
                    'A local maximum of f requires f′ to have a local minimum there.'
                ], a: 0,
                whyBy: [
                    'The maximum is fixed by f′ = 0 plus the + to − sign change of f′. f″(−1) = −6 only records that f is concave down at the peak, and it is not 0.',
                    'The board shows f″ = −6 at x = −1. A maximum of f and a zero of f″ are different events; students often merge them.',
                    'The minimum of f′ is at x = 0, and that aligns with the inflection of f, not with either extremum of f.'
                ]
            },
            message: 'The misconception panel stays on screen with the four cards: the four rules are exactly the links the board used, and the wrong column names the two confusions they are built to break. This is the correspondence topic, not a sketching task.'
        }
    ],
    summary: {
        idea: 'Down one shared x-column, the same x-value shows up as a feature on f, on f′ and on f″ at once. A zero of f′ with a sign change gives an extremum of f; a sign of f′ gives the direction of f; a sign of f″ gives the concavity of f; a sign change of f″ gives an inflection of f.',
        mistake: 'Do not confuse a zero of f′ with a zero of f″. At the local maximum x = −1 the value f″(−1) = −6, not 0, so a maximum of f never forces f″ = 0. And the minimum of f′ at x = 0 lines up with the inflection of f, not with an extremum of f.',
        transfer: 'On the board, every feature in a row was placed from the graph one row above it: an extremum of f′ is a zero of f″, and an extremum of f is a zero of f′. Apply the same one-level-up reading to any family of three aligned graphs.'
    }
};

export default linkerLandmarksMode;
