/* 5.3 Determining Intervals, transfer mode: practice from f′ only.

   The rule that defines this whole mode is that the student is never shown a
   graph of f. Two problems arrive, and each one hands over only information
   about the derivative. Problem 1 is the graph of y = f′(x) for
   f′(x) = (x + 2)(x − 1) = x² + x − 2, whose caption states in plain words that
   the picture is the derivative and not the function. Problem 2 is a sign table
   with no picture at all. Nothing in this file plots f, reconstructs f, or
   borrows any shape of f. The graph that appears is a graph of f′, and while
   Problem 1 runs it is the visible evidence.

   Both problems run through the same stage-gated practice shape as the 5.5
   transfer tab: the evidence pane (a graph for Problem 1, a table for
   Problem 2) arrives first, its practice questions arrive on the next screen,
   and the interpretation that answers them is revealed only on the screen AFTER
   the questions. Problem 1 carries upper stage bounds, so its graph, note,
   practice and result panes retire when the Problem 2 table arrives, and only
   the standing rule note and the closing AP justification persist. Every
   reveal keys off the monotone params.stage, never off an answer, so walking
   Next without choosing still moves through the mode. The
   distractors aim at the two real confusions this topic punishes: reading the
   direction the derivative curve moves instead of its sign, and naming the zeros
   of f′ as the answer instead of the intervals. */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

/* one table cell. `v` is always a function so the renderer prints the string it
   is handed instead of re-parsing it, which would turn '−' back into +NaN or an
   ASCII hyphen. */
const cell = (s, emph) => Object.assign({ v: () => s }, emph || {});

/* f′(x) = x² + x − 2 = (x + 2)(x − 1): zeros −2 and 1, f′(−3) = 4, f′(0) = −2,
   f′(2) = 4, and the curve falls for x < −1/2 while staying positive there. */
const dprime = (x) => x * x + x - 2;

/* The frame is wider than the picture on purpose: −3 and 2 are data points, and
   a window edge that lands on a tick value puts that tick label outside the
   viewBox. */
const GRAPH_WIN = [-3.2, 2.2, -3, 5];

export const monotonicityTransferMode = {
    label: 'Practice from f′ only',
    intro: 'This mode is the practice end of Topic 5.3, and it has a hard rule: no graph of f ever appears here. You are handed only information about the derivative and asked what f does. Problem 1 gives the graph and formula of y = f′(x). Problem 2 gives a sign table of f′ and no picture at all. Answer the questions under each piece of evidence, and let the sign of f′, never the direction the derivative curve moves, decide your answer.',
    params: { stage: 0 },
    controls: [],
    fns: { dprime },
    compute: (env) => ({
        prob1: env.stage >= 1,
        prob1ask: env.stage >= 2,
        r1: env.stage >= 3,
        prob2: env.stage >= 4,
        prob2ask: env.stage >= 5,
        r2: env.stage >= 6
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'Problem 1: the graph of y = f′(x), where f′(x) = (x + 2)(x − 1)',
                when: (env) => env.prob1 && !env.prob2,
                window: GRAPH_WIN,
                curves: [{ fn: (x) => dprime(x), color: 'curveA', label: 'y = f′(x)' }],
                points: (env) => {
                    const p = [
                        { x: -3, y: 4, color: 'accent', label: 'f′(−3) = ' + dsp(4), labelDy: -10 },
                        { x: 0, y: -2, color: 'accent', label: 'f′(0) = ' + dsp(-2), labelDx: -80 },
                        { x: 2, y: 4, color: 'accent', label: 'f′(2) = ' + dsp(4), labelDy: -10 }
                    ];
                    return p;
                },
                vlines: (env) => env.r1
                    ? [{ x: -2, color: 'accent', label: 'x = −2' }, { x: 1, color: 'accent', label: 'x = 1' }]
                    : [],
                vband: (env) => env.r1
                    ? [{ from: -2, to: 1, color: 'color-mix(in srgb, #FF3B30 9%, transparent)' }, { from: -3, to: -2, color: 'color-mix(in srgb, #2FB86A 9%, transparent)' }, { from: 1, to: 2, color: 'color-mix(in srgb, #2FB86A 9%, transparent)' }]
                    : []
            },
            {
                kind: 'note', title: 'Problem 1: what this picture is',
                when: (env) => env.prob1 && !env.prob2,
                text: 'The graph shown is y = f′(x), where f′(x) = (x + 2)(x − 1). It is the derivative, and not the function f. There is no graph of f here and none is drawn anywhere in this mode. Read the graph and its formula against the x-axis: the curve sits above the x-axis where f′(x) > 0, and below the x-axis where f′(x) < 0. The two places it crosses the axis, x = −2 and x = 1, are where f′ = 0, so they are boundaries between the intervals you are asked to name.'
            },
            {
                kind: 'practice', id: 'u53-transfer-p1', title: 'Problem 1 practice',
                when: (env) => env.prob1ask && !env.prob2,
                items: [
                    {
                        q: 'Using only the graph and formula of y = f′(x), on which single interval is f decreasing?',
                        choices: [
                            'f is decreasing on (−2, 1), because on that interval the graph of f′ lies below the x-axis, so f′(x) < 0 there.',
                            'f is decreasing wherever the curve of f′ is falling, which is everything left of its lowest point.',
                            'f is decreasing at x = −2 and x = 1, the two x-values where the graph of f′ equals 0.'
                        ], a: 0,
                        whyBy: [
                            'The sign of f′ decides. Between −2 and 1 the whole curve sits under the x-axis, so f′ is negative there, and a negative derivative means f decreases. The answer is the open interval (−2, 1).',
                            'This reads the direction the derivative curve moves instead of its sign. Left of x = −1/2 the curve is falling, yet on (−∞, −2) it is still above the axis, so f′ is positive and f increases. Falling f′ is not decreasing f.',
                            'x = −2 and x = 1 are only the boundaries where f′ = 0. A single point carries no interval, so it cannot be where f decreases. The decreasing happens strictly between them.'
                        ]
                    },
                    {
                        q: 'Using only the graph and formula of y = f′(x), on which intervals is f increasing? Give the answer in AP interval notation.',
                        choices: [
                            'f is increasing on (−∞, −2) ∪ (1, ∞), because f′(x) > 0 on both of those intervals and the curve sits above the x-axis there.',
                            'f is increasing wherever the curve of f′ is rising, which is everything right of its lowest point.',
                            'f is increasing at the marked points x = −3 and x = 2, where the graph of f′ reads 4.'
                        ], a: 0,
                        whyBy: [
                            'The curve is above the x-axis for x < −2 and again for x > 1, so f′ is positive on both pieces, and f increases on each. AP notation joins them with the union symbol: (−∞, −2) ∪ (1, ∞).',
                            'Again this tracks the slope of the derivative curve rather than its sign. Right of x = −1/2 the curve rises, but on (−1/2, 1) it is still below the axis, so f′ is negative and f decreases there. Rising f′ is not increasing f.',
                            'x = −3 and x = 2 are sample points where f′ = 4, and they only confirm the sign near them. Increasing is a property of an interval, so two isolated points are not the answer, and the interval reaching left from −2 is left out.'
                        ]
                    }
                ]
            },
            {
                kind: 'table', title: 'Problem 2: the sign table of f′',
                when: (env) => env.prob2,
                cols: (env) => env.r2
                    ? ['Interval', 'Sign of f′', 'What f does on the interval']
                    : ['Interval', 'Sign of f′'],
                rows: (env) => {
                    const base = [
                        [cell('(−5, −1)'), cell('+')],
                        [cell('(−1, 3)'), cell('−')],
                        [cell('(3, 7)'), cell('+')]
                    ];
                    if (!env.r2) return base;
                    const extra = [
                        cell('f is increasing', { color: 'up', bold: true }),
                        cell('f is decreasing', { color: 'down', bold: true }),
                        cell('f is increasing', { color: 'up', bold: true })
                    ];
                    return base.map((r, i) => r.concat([extra[i]]));
                },
                note: 'The Sign of f′ column carries the whole meaning. A + on a row means f is increasing across that interval, and a − means f is decreasing across it. The Interval column only lists where, and it is the sign alone that decides which. No graph of f is given here, and none is needed.'
            },
            {
                kind: 'practice', id: 'u53-transfer-p2', title: 'Problem 2 practice',
                when: (env) => env.prob2ask,
                items: [
                    {
                        q: 'Reading the sign table of f′, on which single interval is f decreasing?',
                        choices: [
                            'f is decreasing on (−1, 3), because that is the row whose Sign of f′ entry is −.',
                            'f is decreasing on (−5, −1) and (3, 7), because those rows carry the + signs.',
                            'f is decreasing at x = −1 and x = 3, the two boundaries listed between the rows.'
                        ], a: 0,
                        whyBy: [
                            'In the Sign of f′ column only the row (−1, 3) shows −, and a negative derivative means f decreases. So the decreasing interval is (−1, 3).',
                            'This flips the sign rule and reads + as decreasing. The + rows are exactly where f′ > 0, so f increases there, not decreases.',
                            '−1 and 3 are the endpoints written between rows. They mark where the sign changes, but a boundary point is not an interval, and the − sign sits between them on the (−1, 3) row.'
                        ]
                    },
                    {
                        q: 'Reading the sign table of f′, on which intervals is f increasing? Give the answer in AP interval notation.',
                        choices: [
                            'f is increasing on (−5, −1) ∪ (3, 7), because the Sign of f′ column shows + on both of those rows.',
                            'f is increasing on (−1, 3), because that row sits in the middle of the table.',
                            'f is increasing at x = −5, x = −1, x = 3 and x = 7, the four numbers the table is built from.'
                        ], a: 0,
                        whyBy: [
                            'Two rows carry + in the Sign of f′ column, the intervals (−5, −1) and (3, 7). Where f′ is positive, f increases, and AP notation joins the two with a union: (−5, −1) ∪ (3, 7).',
                            'The (−1, 3) row carries −, not +, so f decreases there. Position in the table has no meaning, only the sign in the Sign of f′ column does.',
                            'Those four numbers are the endpoints that split the rows. Increasing is decided by a + sign on an interval, and none of these single points is an interval, so they are not the answer.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'note', title: 'How to read f′, not f',
                when: (env) => env.prob1,
                text: 'Both problems ask one thing: what does f do. The answer never comes from the slope of the derivative curve. It comes only from whether f′ is above zero or below zero. Where the graph or table says f′ > 0, f increases. Where it says f′ < 0, f decreases. Where f′ = 0, you have found a boundary, not yet a behavior.'
            },
            {
                kind: 'readout', title: 'Problem 1 result',
                when: (env) => env.r1 && !env.prob2,
                items: [
                    { label: 'f increasing on', v: () => '(−∞, −2) ∪ (1, ∞)', color: 'up' },
                    { label: 'because f′ > 0 there', v: () => 'curve above the x-axis' },
                    { label: 'f decreasing on', v: () => '(−2, 1)', color: 'down' },
                    { label: 'because f′ < 0 there', v: () => 'curve below the x-axis' }
                ]
            },
            {
                kind: 'readout', title: 'Problem 2 result',
                when: (env) => env.r2,
                items: [
                    { label: 'f increasing on', v: () => '(−5, −1) ∪ (3, 7)', color: 'up' },
                    { label: 'f decreasing on', v: () => '(−1, 3)', color: 'down' }
                ]
            },
            {
                kind: 'eq', title: 'AP justification to write',
                when: (env) => env.r2,
                lines: [
                    { t: 'Since f′(x) > 0 on (a, b), f is increasing on (a, b).' },
                    { t: 'Since f′(x) < 0 on (b, c), f is decreasing on (b, c).' },
                    { t: 'The reason is always the sign of f′. Writing "f′ is increasing, therefore f is increasing" is never correct.', hl: true }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'Problem 1 shows the graph of y = f′(x) for f′(x) = (x + 2)(x − 1). The caption in the Problem 1 note panel says it plainly: this picture is the derivative, not the function, and no graph of f exists in this mode. The marked points read f′(−3) = 4, f′(0) = −2 and f′(2) = 4, and the curve crosses the x-axis at x = −2 and x = 1. Notice where it sits above the axis and where it sits below.'
        },
        {
            params: { stage: 2 },
            message: 'Two questions now sit under the graph in the Problem 1 practice panel. They ask first where f decreases and then where f increases, in AP interval notation. Use only the sign of f′, never the direction the curve moves, and leave the answers blank if you want to keep walking with Next.'
        },
        {
            params: { stage: 3 },
            message: 'The Problem 1 result panel and the shaded strips on the graph now show the interpretation. The curve is above the x-axis on (−∞, −2) and on (1, ∞), where f′ > 0 and f increases, and below the axis on (−2, 1), where f′ < 0 and f decreases. The zeros −2 and 1 are the vlines, and they are boundaries between those behaviors, not the behaviors themselves.'
        },
        {
            params: { stage: 4 },
            message: 'Problem 2 drops the picture entirely. The Problem 2 sign table of f′ lists three intervals with one sign each: + on (−5, −1), − on (−1, 3), and + on (3, 7). As the note under the table says, the Sign of f′ column is the one that carries the meaning, because the sign alone decides what f does.'
        },
        {
            params: { stage: 5 },
            message: 'Two more questions now sit under the table in the Problem 2 practice panel. Say where f decreases and where it increases, in AP interval notation. Nothing is highlighted yet, and the third column of the table stays empty until the next screen.'
        },
        {
            params: { stage: 6 },
            message: 'The table gains its What f does column, the Problem 2 result panel fills in, and the AP justification card closes the mode. Each + row became increasing and each − row became decreasing. Read the justification lines back against the Problem 2 table and its practice answers, and carry the warning with you: f′ being positive is the reason, f′ being increasing never is.'
        }
    ],
    summary: {
        idea: 'The sign of f′ determines the direction of f. A positive derivative, whether it comes from a graph of f′ sitting above the x-axis or from a + in a sign table, means f is increasing on that interval, and a negative derivative means f is decreasing. You are never given f here: you read only f′ and state what f does.',
        mistake: 'Two slips keep showing up. Reading the direction of the derivative curve instead of its sign, so you claim f decreases wherever f′ is falling, which is wrong on (−∞, −2) where f′ falls yet stays positive. And answering with the zeros of f′ rather than the intervals, naming x = −2 and x = 1 as if a boundary point were a stretch where f does something. Split at the boundaries, then let the sign pick the behavior.',
        transfer: 'Given only a graph or a sign table of f′, split the domain at the values where f′ = 0 or fails to keep a sign, test the sign of f′ on each piece, and write the intervals where f increases or decreases in AP notation. Back every line with the phrase "since f′(x) > 0 on (a, b), f is increasing on (a, b)" and its negative twin.'
    }
};

export default monotonicityTransferMode;
