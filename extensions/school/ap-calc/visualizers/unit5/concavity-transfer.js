/* 5.6 Determining concavity, transfer mode: read concavity from the derivatives.

   The rule that shapes this file is that no screen draws f. Problem 1 hands over
   the graph of y = f′(x) = −(x − 2)² + 4 and nothing else, Problem 2 hands over a
   sign table of f″ and nothing else. Concavity is therefore reached two different
   ways, which is the point of the mode: Problem 1 practices the f′ behavior route
   (f′ climbing means f concave up, f′ falling means f concave down), and Problem 2
   practices the f″ sign route. Neither route is a picture of f, and no pane, note,
   readout, eq line or step message reconstructs one.

   Both problems run the same stage-gated practice shape as the 5.3 and 5.4
   transfer tabs: the evidence arrives first, its practice questions arrive on the
   next screen, and the interpretation that answers them is revealed only on the
   screen after the questions. One monotone params.stage drives every reveal, so
   walking Next without touching a choice still moves through the mode, and every
   Problem 1 pane carries an upper stage bound so it retires when Problem 2 takes
   the page. Only the rule card and the no-graph-of-f note persist the whole way.

   The distractors aim at the two confusions this topic punishes: reading the
   sign of f′ (or the crossings of its graph) as if it decided concavity, and
   treating f″(c) = 0 as the definition of an inflection point instead of the
   change in concavity across c. */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

/* one table cell. `v` is always a function so the renderer prints the string it
   is handed instead of re-parsing it, which would turn '−' back into an ASCII
   hyphen or NaN. */
const cell = (s, emph) => Object.assign({ v: () => s }, emph || {});

/* Problem 1 evidence: f′(x) = −(x − 2)² + 4, a downward-opening parabola with its
   vertex at (2, 4). It climbs for x < 2 and falls for x > 2, and it equals 0 at
   x = 0 and x = 4. The climbs and falls are the object of this problem, and the
   two zeros belong to the increasing/decreasing question instead. */
const FP = (x) => -((x - 2) * (x - 2)) + 4;

/* two short direction arrows that hug the branches, as chords between exact
   values of f′: f′(0.6) = f′(3.4) = 2.04 and f′(1.4) = f′(2.6) = 3.64 */
const SEG_UP = { x1: 0.6, y1: 2.04, x2: 1.4, y2: 3.64 };
const SEG_DOWN = { x1: 2.6, y1: 3.64, x2: 3.4, y2: 2.04 };

/* The frame is roomier than the picture on purpose: −1 and 5 are inside the
   window as tick values, and a window edge that lands on a tick pushes that tick
   label outside the viewBox. The parabola arms leave through the bottom edge. */
const GRAPH_WIN = [-1.35, 5.35, -4.8, 5.6];

/* Problem 2 evidence: the sign table of f″. */
const P2_IVS = [
    { iv: '(−∞, −3)', s: '+', c: 'f is concave up' },
    { iv: '(−3, 1)', s: '−', c: 'f is concave down' },
    { iv: '(1, ∞)', s: '+', c: 'f is concave up' }
];

/* the verdict lines are built from fixed text and shown one screen at a time, so
   a pane can grow without ever stating an answer before its question */
const P1_READ = [
    { flag: 'up1', t: 'f′ is increasing on (−∞, 2), so f is concave up on (−∞, 2).', c: 'up' },
    { flag: 'down1', t: 'f′ is decreasing on (2, ∞), so f is concave down on (2, ∞).', c: 'down' },
    { flag: 'inf1', t: 'The concavity changes at x = 2, so x = 2 is an inflection point of f.', c: 'accent', hl: true }
];
const P2_READ = [
    { flag: 'r2a', t: 'f″ > 0 on (−∞, −3), so f′ is increasing there and f is concave up.', c: 'up' },
    { flag: 'r2b', t: 'f″ < 0 on (−3, 1), so f′ is decreasing there and f is concave down.', c: 'down' },
    { flag: 'r2c', t: 'f″ > 0 on (1, ∞), so f′ is increasing there and f is concave up.', c: 'up' }
];
const P2_INFLECT = [
    { flag: 'i2a', t: 'At x = −3 the sign of f″ changes from + to −, so the concavity changes and x = −3 is an inflection point.', c: 'accent' },
    { flag: 'i2b', t: 'At x = 1 the sign of f″ changes from − to +, so the concavity changes and x = 1 is an inflection point.', c: 'accent', hl: true }
];
const readLines = (list, env) => list.filter(l => env[l.flag]).map(l => ({ t: l.t, color: l.c, hl: l.hl }));

export const concavityTransferMode = {
    label: 'Read concavity from the derivatives',
    intro: 'This is the practice end of Topic 5.6, and it has a hard rule: no graph of f ever appears here. Problem 1 gives only the graph of y = f′(x), and its questions are about which way that derivative curve moves. Problem 2 gives only a sign table of f″, and its questions ask you to name the concavity on each interval and then decide whether the two boundaries are inflection points. Two routes, one fact: concavity is how f′ behaves. Answer each set of questions before the reveal screen, and leave a choice untouched if you just want to walk through with Next.',
    params: { stage: 0 },
    controls: [],
    fns: { dprime: FP },
    compute: (env) => ({
        /* Problem 1 owns screens 1 to 6. Every one of its panes carries an upper
           bound, so the whole problem clears off the page when the Problem 2
           table arrives on screen 7. */
        g1: env.stage >= 1 && env.stage <= 6,
        up1: env.stage >= 3 && env.stage <= 6,
        down1: env.stage >= 4 && env.stage <= 6,
        inf1: env.stage >= 5 && env.stage <= 6,
        read1: env.stage >= 3 && env.stage <= 5,
        ask1: env.stage >= 2 && env.stage <= 5,
        zeroMark: env.stage === 6,
        r1: env.stage >= 5 && env.stage <= 8,
        whatasks: env.stage >= 1 && env.stage <= 7,
        /* Problem 2 owns screens 7 to 12. Its table and sign chart stay to the
           end, because the closing panels read back against them. */
        table2: env.stage >= 7,
        n2: env.stage >= 7 && env.stage <= 8,
        ask2a: env.stage >= 8 && env.stage <= 9,
        concCol: env.stage >= 9,
        r2a: env.stage >= 9 && env.stage <= 10,
        r2b: env.stage >= 9 && env.stage <= 10,
        r2c: env.stage >= 9 && env.stage <= 10,
        read2: env.stage >= 9 && env.stage <= 10,
        chart2: env.stage >= 9,
        r2: env.stage >= 9 && env.stage <= 10,
        ask2b: env.stage >= 10 && env.stage <= 11,
        inf2: env.stage >= 11,
        i2a: env.stage >= 11,
        i2b: env.stage >= 12,
        close: env.stage >= 12,
        both: env.stage >= 12
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'Problem 1: the graph of y = f′(x), where f′(x) = −(x − 2)² + 4',
                when: (env) => env.g1,
                window: GRAPH_WIN,
                gridX: 1, gridY: 2,
                curves: [{ fn: (x) => FP(x), color: 'curveA', label: 'y = f′(x)', labelAt: 4.55 }],
                points: (env) => {
                    const p = [
                        { x: 2, y: 4, color: 'accent', label: 'f′(2) = ' + dsp(4), labelDy: -12, labelDx: -34 },
                        { x: 1, y: 3, color: 'ink', r: 4, label: 'f′(1) = ' + dsp(3), labelDx: -74 },
                        { x: 3, y: 3, color: 'ink', r: 4, label: 'f′(3) = ' + dsp(3), labelDx: 10 }
                    ];
                    if (env.zeroMark) {
                        p.push({ x: 0, y: 0, color: 'auxInk', r: 4, label: 'f′ = 0', labelDx: -62, labelDy: -16 });
                        p.push({ x: 4, y: 0, color: 'auxInk', r: 4, label: 'f′ = 0', labelDx: 12, labelDy: -16 });
                    }
                    return p;
                },
                segments: (env) => {
                    const s = [];
                    if (env.up1) s.push({ x1: SEG_UP.x1, y1: SEG_UP.y1, x2: SEG_UP.x2, y2: SEG_UP.y2, color: 'up', arrow: 'end' });
                    if (env.down1) s.push({ x1: SEG_DOWN.x1, y1: SEG_DOWN.y1, x2: SEG_DOWN.x2, y2: SEG_DOWN.y2, color: 'down', arrow: 'end' });
                    return s;
                },
                vband: (env) => {
                    const b = [];
                    if (env.up1) b.push({ from: -1.35, to: 2, color: 'color-mix(in srgb, #2FB86A 9%, transparent)' });
                    if (env.down1) b.push({ from: 2, to: 5.35, color: 'color-mix(in srgb, #FF3B30 9%, transparent)' });
                    return b;
                },
                vlines: (env) => {
                    const v = [];
                    if (env.inf1) v.push({ x: 2, color: 'accent', label: 'x = 2' });
                    if (env.zeroMark) {
                        v.push({ x: 0, color: 'auxInk', label: 'x = 0' });
                        v.push({ x: 4, color: 'auxInk', label: 'x = 4' });
                    }
                    return v;
                }
            },
            {
                kind: 'note', title: 'Problem 1: what this picture is',
                when: (env) => env.g1 && env.stage <= 2,
                text: 'The curve drawn here is y = f′(x), the derivative, and it is the only curve in this mode. There is no graph of f, and none is drawn anywhere in this file. The questions do not ask where this curve sits relative to the x-axis. They ask which way it moves as x runs from left to right: the branch that climbs is the branch where f′ is increasing, and the branch that falls is the branch where f′ is decreasing. The marked point (2, 4) is where the climbing stops and the falling starts.'
            },
            {
                kind: 'practice', id: 'u56-transfer-p1', title: 'Problem 1 practice',
                when: (env) => env.ask1,
                items: [
                    {
                        q: 'Reading only the graph of y = f′(x), on which single interval is f concave up?',
                        choices: [
                            'f is concave up on (−∞, 2), because the graph of f′ climbs as x runs toward 2, so f′ is increasing on that whole interval.',
                            'f is concave up on (0, 4), because the graph of f′ lies above the x-axis there, so f′ is positive on that interval.',
                            'f is concave up on (−∞, 0) and (4, ∞), because the graph of f′ lies below the x-axis there, so a negative derivative opens the curve upward.'
                        ], a: 0,
                        whyBy: [
                            'Concavity comes from what f′ does, not from where f′ sits. Left of x = 2 every step to the right takes the curve higher, so f′ is increasing, and an increasing f′ is exactly what concave up means. The interval has no left end, so it is (−∞, 2).',
                            'That reads the sign of f′ and answers a different question. f′ > 0 on (0, 4) says f is increasing there, which is the topic 5.3 reading. On the same stretch the derivative graph climbs up to x = 2 and then falls, so no single concavity covers (0, 4).',
                            'A negative f′ says f is decreasing, and it says nothing about which way f bends. The two pieces you named sit left of x = 2 and right of x = 2, so they carry opposite concavities, and the bend you are after happens on (−∞, 2) where f′ climbs.'
                        ]
                    },
                    {
                        q: 'Reading only the graph of y = f′(x), on which single interval is f concave down?',
                        choices: [
                            'f is concave down on (0, 4), because the graph of f′ is above the x-axis there and is on its way back down.',
                            'f is concave down on (2, ∞), because the graph of f′ falls for every x greater than 2, so f′ is decreasing on that whole interval.',
                            'f is concave down wherever f itself is decreasing, because a function that is going down has to bend down.'
                        ], a: 1,
                        whyBy: [
                            'Right of x = 2 each step to the right takes the curve lower, so f′ is decreasing, and a decreasing f′ is what concave down means. The interval has no right end, so the answer is (2, ∞).',
                            'Above the x-axis is a sign fact about f′, and it makes f increasing rather than bending. On (0, 4) the derivative graph first climbs and then falls, so the stretch you want is the falling one, which starts at x = 2.',
                            'That mixes up two different readings. Whether f runs up or down comes from the sign of f′, and which way f bends comes from the direction of f′. On (0, 2) the function f is increasing while f′ is still climbing, and both of those hold at once.'
                        ]
                    },
                    {
                        q: 'The graph of y = f′(x) turns from climbing to falling at x = 2, where f′(2) = 4. What does that turn say about f?',
                        choices: [
                            'x = 2 is a local maximum of f, because the derivative graph reaches its greatest height there.',
                            'Nothing changes for f at x = 2, because f′(2) = 4 is not 0, so the graph of f′ does not cross the x-axis there.',
                            'x = 2 is an inflection point of f, because f′ switches from increasing to decreasing there, so the concavity of f switches from concave up to concave down.'
                        ], a: 2,
                        whyBy: [
                            'A local maximum of f needs a critical point of f, and a critical point is where f′ = 0 or f′ fails to exist. Here f′(2) = 4, so x = 2 is not a critical point at all. The height of the derivative graph is a fact about f′.',
                            'Crossing the axis is what the increasing/decreasing question asks about. Concavity asks about the direction of f′, and at x = 2 that direction changes, so something real does happen to f there.',
                            'An inflection point is defined by a change in concavity. f′ climbs on (−∞, 2) and falls on (2, ∞), so f is concave up on one side and concave down on the other, and x = 2 is where that switch happens.'
                        ]
                    }
                ]
            },
            {
                kind: 'eq', title: 'Problem 1 reading',
                when: (env) => env.read1,
                lines: (env) => readLines(P1_READ, env)
            },
            {
                kind: 'note', title: 'Problem 1: what the zeros of f′ do not decide', tone: 'warn',
                when: (env) => env.zeroMark,
                text: 'The graph of f′ meets the x-axis at x = 0 and at x = 4, and those are the places where f′ = 0. They split the domain into the stretches where f increases from the stretch where f decreases, which is the topic 5.3 question. The concavity answers in this problem were (−∞, 2) and (2, ∞), split at the turn of the derivative graph instead of at its crossings. Keep the two readings apart: the sign of f′ says which way f runs, and the direction of f′ says which way f bends.'
            },
            {
                kind: 'compare', title: 'Two ways to read one graph of f′',
                when: (env) => env.zeroMark,
                sides: [
                    {
                        title: 'The shortcut', tone: 'wrong',
                        lines: [
                            'f′ is positive, so f is concave up.',
                            'f′ = 0, so the concavity changes.',
                            'The highest point of the graph of f′ is a maximum of f.'
                        ]
                    },
                    {
                        title: 'What concavity asks', tone: 'right',
                        lines: [
                            'f′ is increasing on an interval, so f is concave up there.',
                            'f′ is decreasing on an interval, so f is concave down there.',
                            'f′ turns around, and that turn is where the concavity of f changes.'
                        ]
                    }
                ],
                verdict: 'On the Problem 1 graph the turn at x = 2 carried the concavity answer, and the crossings at x = 0 and x = 4 belong to the increasing and decreasing question.'
            },
            {
                kind: 'table', title: 'Problem 2: the sign table of f″',
                when: (env) => env.table2,
                cols: (env) => env.concCol
                    ? ['Interval of x', 'Sign of f″', 'Concavity of f on the interval']
                    : ['Interval of x', 'Sign of f″'],
                rows: (env) => {
                    const base = P2_IVS.map(r => [
                        cell(r.iv),
                        cell(r.s, { color: r.s === '+' ? 'up' : 'down', bold: true })
                    ]);
                    if (!env.concCol) return base;
                    return base.map((row, i) => row.concat([
                        cell(P2_IVS[i].c, { color: P2_IVS[i].s === '+' ? 'up' : 'down', bold: true })
                    ]));
                },
                note: (env) => env.concCol
                    ? 'The third column came straight out of the signs: a + row is concave up and a − row is concave down. The two numbers written between the rows are the places where the sign changes, and the next set of questions asks what that change makes them.'
                    : 'This table is the whole of Problem 2. It lists three intervals and one sign of f″ for each, and the boundaries between the rows are x = −3 and x = 1. Nothing here is read from a picture of f, and no picture of f exists in this mode.'
            },
            {
                kind: 'note', title: 'Problem 2: what this table is',
                when: (env) => env.n2,
                text: 'The Sign of f″ column is the column with the meaning, because f″ is the rate at which f′ changes. A + on a row means f′ is increasing across that interval, and increasing f′ is what concave up means. A − means f′ is decreasing, which is what concave down means. The sign is never read as the sign of f, and a row carrying + does not make f increase.'
            },
            {
                kind: 'practice', id: 'u56-transfer-p2a', title: 'Problem 2 practice: the concavity column',
                when: (env) => env.ask2a,
                items: [
                    {
                        q: 'Reading the sign table of f″, which list gives the concavity of f on the three intervals in the order they are written?',
                        choices: [
                            'Concave up on (−∞, −3), concave down on (−3, 1), concave up on (1, ∞), because the Sign of f″ column reads +, −, +.',
                            'Concave down on (−∞, −3), concave up on (−3, 1), concave down on (1, ∞), because a + sign of f″ means the curve of f bends downward.',
                            'Concave up on all three intervals, because f″ keeps the same sign at both ends of the table, so the bending never really changes.'
                        ], a: 0,
                        whyBy: [
                            'A + row says f″ > 0, so f′ is increasing there, so f is concave up. A − row says f″ < 0, so f′ is decreasing, so f is concave down. Reading the three rows in order gives up, down, up.',
                            'That flips the sign rule. Positive f″ means increasing f′, which is concave up, not concave down. The middle row alone carries the − sign, so it is the only concave down stretch.',
                            'The sign of the end rows does not decide the middle row, and the table changes sign twice. Concavity follows each row on its own, so the answer is up, down, up rather than one label for the whole domain.'
                        ]
                    },
                    {
                        q: 'On the Problem 2 table, what does the + sign on the row (−∞, −3) say about f′ and about f?',
                        choices: [
                            'f′ is increasing on (−∞, −3) and f is concave up there, because f″ is the rate at which f′ changes.',
                            'f′ is positive on (−∞, −3) and f is increasing there, because a + sign in a derivative table always means the derivative is positive.',
                            'f is concave down on (−∞, −3), because a + sign written on the left of a table means the curve opens to the left.'
                        ], a: 0,
                        whyBy: [
                            'The table lists signs of f″, and f″ > 0 means f′ is rising. A rising f′ is the definition of concave up for f, so the same + carries both statements.',
                            'The sign belongs to f″, not to f′. A function can rise while its rate of change falls, so f″ > 0 says nothing about whether f′ itself is positive, and the increasing or decreasing claim is not yours to make here.',
                            'Position in the table carries no meaning, only the sign does. A + row of f″ is a concave up row of f.'
                        ]
                    }
                ]
            },
            {
                kind: 'eq', title: 'Problem 2 concavity reading',
                when: (env) => env.read2,
                lines: (env) => readLines(P2_READ, env)
            },
            {
                kind: 'numberline', title: 'Problem 2: the same three signs as bands',
                when: (env) => env.chart2,
                width: 560,
                window: [-5.2, 3.2],
                step: 1,
                bands: [
                    { from: -5, to: -3, color: 'up', label: 'concave up' },
                    { from: -3, to: 1, color: 'down', label: 'concave down' },
                    { from: 1, to: 3, color: 'up', label: 'concave up' }
                ],
                /* boundary markers carry no labels: their row makes placeLabels
                   push the band words down onto the tick numbers */
                probes: [
                    { x: -3, color: 'accent' },
                    { x: 1, color: 'accent' }
                ]
            },
            {
                kind: 'practice', id: 'u56-transfer-p2b', title: 'Problem 2 practice: the two boundaries',
                when: (env) => env.ask2b,
                items: [
                    {
                        q: 'The sign of f″ changes at x = −3. How should x = −3 be classified for f?',
                        choices: [
                            'x = −3 is an inflection point of f, because f″ is + on (−∞, −3) and − on (−3, 1), so f goes from concave up to concave down there.',
                            'x = −3 is not an inflection point, because the table writes no sign on the point itself, and only a listed zero of f″ can mark a change.',
                            'x = −3 is a local maximum of f, because the sign of f″ steps down from + to − as x passes through −3.'
                        ], a: 0,
                        whyBy: [
                            'The concavity of f on the two sides differs, and a change in concavity is the whole test for an inflection point. The bands on the sign chart show it as one green stretch and one red stretch meeting at x = −3.',
                            'The table gives signs on intervals, and the change across a boundary is exactly what those intervals are there to show. A sign written on a single point would carry no interval and could not change.',
                            'A step down in f″ is a change in how f bends, not a turn in which way f runs. Classifying a maximum or a minimum needs the behavior of f′ across a critical point, and this table says nothing about the sign of f′.'
                        ]
                    },
                    {
                        q: 'The same table changes sign again at x = 1, from − on (−3, 1) to + on (1, ∞). Decide whether x = 1 is an inflection point of f, and give the reason.',
                        choices: [
                            'x = 1 is not an inflection point, because concave up appears on both outer rows, so nothing new happens after x = −3.',
                            'x = 1 is an inflection point only if the table also shows f″(1) = 0, and no value on the point is listed.',
                            'x = 1 is an inflection point of f, because the concavity changes there from concave down to concave up, and that change is the evidence.'
                        ], a: 2,
                        whyBy: [
                            'Both boundaries decide on their own. Left of x = 1 the f″ sign is −, so f is concave down, and right of it the sign is +, so f is concave up, and a change of that kind makes x = 1 an inflection point.',
                            'The first claim is backwards, because the outer rows are separated by a middle row with the other sign, so the bending really does change twice.',
                            'f″(1) = 0 is the usual way such a place turns up, and it is not what makes the point an inflection point. The change in concavity across x = 1 is the evidence, and the table gives it.'
                        ]
                    }
                ]
            },
            {
                kind: 'eq', title: 'Problem 2 inflection verdicts',
                when: (env) => env.inf2,
                lines: (env) => readLines(P2_INFLECT, env)
            },
            {
                kind: 'eq', title: 'AP justification to write',
                when: (env) => env.close,
                lines: [
                    { t: 'Since f′ is increasing on (a, b), f is concave up on (a, b).' },
                    { t: 'Since f′ is decreasing on (b, c), f is concave down on (b, c).' },
                    { t: 'Since f″(x) > 0 on an interval, f′ is increasing there, so f is concave up.' },
                    { t: 'Since the concavity changes at x = c, x = c is an inflection point of f.', hl: true },
                    { t: 'Never write "f″(c) = 0, therefore x = c is an inflection point." The change in concavity is the evidence.', hl: true }
                ]
            },
            {
                kind: 'note', title: 'Two routes into one answer',
                when: (env) => env.close,
                text: 'Problem 1 gave the graph of f′, so the concavity came from the direction that curve moved, and the answer switched where the curve turned around at x = 2. Problem 2 gave a sign table of f″, so the concavity came from the sign on each row, and it switched at both boundaries x = −3 and x = 1. Those are the same fact seen from two sides, since f″ is the rate at which f′ changes. Neither route needed a picture of f, and no picture of f appeared anywhere in this mode.'
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Concavity rule card',
                lines: [
                    { t: 'f′ increasing on (a, b)   →   f is concave up on (a, b).', color: 'up', hl: true },
                    { t: 'f′ decreasing on (a, b)   →   f is concave down on (a, b).', color: 'down', hl: true },
                    { t: 'f″ > 0 on (a, b) means f′ is increasing there, so f is concave up.' },
                    { t: 'f″ < 0 on (a, b) means f′ is decreasing there, so f is concave down.' },
                    { t: 'An inflection point is where the concavity of f changes.', color: 'accent', hl: true },
                    { t: 'f″(c) = 0 identifies a place worth checking. The change in concavity is the evidence.' }
                ]
            },
            {
                kind: 'note', title: 'No graph of f here',
                text: 'Both problems ask about the concavity of f, and neither one shows f. Problem 1 works from the graph of y = f′(x), and Problem 2 works from a sign table of f″. Nothing in this mode lets you recover the height of f, so read the derivative information and state the bending.'
            },
            {
                kind: 'note', title: 'What each problem asks',
                when: (env) => env.whatasks,
                text: 'Topic 5.3 asked what f does on an interval, and the answer was increasing or decreasing. Both problems here ask the topic 5.6 question instead, which is which way f bends, and the answer is concave up, concave down, or a change of concavity at an inflection point. The rule card in this column carries both routes into that answer, one through the direction of f′ and one through the sign of f″.'
            },
            {
                kind: 'readout', title: 'Problem 1 result',
                when: (env) => env.r1,
                items: [
                    { label: 'f concave up on', v: () => '(−∞, 2)', color: 'up' },
                    { label: 'because f′ is', v: () => 'increasing there' },
                    { label: 'f concave down on', v: () => '(2, ∞)', color: 'down' },
                    { label: 'because f′ is', v: () => 'decreasing there' },
                    { label: 'inflection point', v: () => 'x = 2', color: 'accent' }
                ]
            },
            {
                kind: 'readout', title: 'Problem 2 concavity result',
                when: (env) => env.r2,
                items: [
                    { label: '(−∞, −3)', v: () => 'concave up', color: 'up' },
                    { label: '(−3, 1)', v: () => 'concave down', color: 'down' },
                    { label: '(1, ∞)', v: () => 'concave up', color: 'up' }
                ]
            },
            {
                kind: 'readout', title: 'Both problems',
                when: (env) => env.both,
                items: [
                    { label: 'Problem 1 concave up', v: () => '(−∞, 2)', color: 'up' },
                    { label: 'Problem 1 concave down', v: () => '(2, ∞)', color: 'down' },
                    { label: 'Problem 1 inflection point', v: () => 'x = 2', color: 'accent' },
                    { label: 'Problem 2 concavity order', v: () => 'up, down, up' },
                    { label: 'Problem 2 inflection points', v: () => 'x = −3 and x = 1', color: 'accent' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'Problem 1 shows the graph of y = f′(x) for f′(x) = −(x − 2)² + 4. This curve is the derivative, and it is the only curve in this mode. The marked points read f′(1) = 3, f′(2) = 4 and f′(3) = 3, and they show a curve that climbs, turns over at (2, 4), and then falls. The Concavity rule card in the side column gives the two routes you are allowed to use, and the route this problem needs is the direction of f′.'
        },
        {
            params: { stage: 2 },
            message: 'Three questions now sit in the Problem 1 practice panel. They ask on which interval f is concave up, on which interval f is concave down, and what the turn at x = 2 says about f. Decide the direction of the curve on each side of x = 2 before you choose, and leave the answers untouched if you want to keep walking with Next.'
        },
        {
            params: { stage: 3 },
            message: 'The first line of the Problem 1 reading panel is about the left branch, and a green arrow now rides that branch. Every step to the right of it takes the curve of f′ higher, so f′ is increasing on (−∞, 2), and that is exactly what it means for f to be concave up there. The left half of the graph is now shaded to match the conclusion.'
        },
        {
            params: { stage: 4 },
            message: 'The second line takes the right branch, and a red arrow now rides it. Right of x = 2 the curve of f′ falls without stopping, so f′ is decreasing on (2, ∞) and f is concave down there. Read the two lines against the rule card, and notice that neither answer came from where the curve sat relative to the x-axis.'
        },
        {
            params: { stage: 5 },
            message: 'The third line is the one the turn gives you. f′ climbs up to x = 2 and falls after it, so the concavity of f is up on one side and down on the other, and a change in concavity makes x = 2 an inflection point. The vline at x = 2 marks that switch on the graph, and the Problem 1 result recap has appeared in the side column.'
        },
        {
            params: { stage: 6 },
            message: 'Two closing panels for Problem 1, and they target the slip this graph invites. The curve does meet the x-axis at x = 0 and at x = 4, and those two places are where f′ = 0, so they split increasing f from decreasing f. That is the topic 5.3 question, and the concavity answers here were split at x = 2 instead. The Two ways to read one graph of f′ card sets the shortcut beside the reading you just used.'
        },
        {
            params: { stage: 7 },
            message: 'Problem 1 and its panels have cleared off the page, and only its result recap survives in the side column for one more screen. Problem 2 hands over no picture at all. The Problem 2 sign table of f″ lists three intervals, (−∞, −3) with +, (−3, 1) with −, and (1, ∞) with +, and the boundaries between the rows are x = −3 and x = 1. The Problem 2 note tells you how to convert a sign of f″ into a bending of f.'
        },
        {
            params: { stage: 8 },
            message: 'Two questions now sit in the Problem 2 practice panel about the concavity column. The first asks for the three concavities in the order the rows are written, and the second asks what a single + row says about f′ and about f. The third column of the table stays empty until the next screen.'
        },
        {
            params: { stage: 9 },
            message: 'The table has gained its Concavity of f column, the Problem 2 concavity reading panel shows the three derivations, and the sign chart below turns the same three rows into bands. A + row means f′ is increasing and so f is concave up, and a − row means f′ is decreasing and so f is concave down, which gives up, down, up. The boundaries x = −3 and x = 1 are marked on the bands, and nothing has yet been concluded about them.'
        },
        {
            params: { stage: 10 },
            message: 'The first Problem 2 practice panel has retired, and the concavity column, its reading panel and the side recap stay on the page for this one screen before clearing. The second Problem 2 practice panel now asks the harder question about the two boundaries. For each of x = −3 and x = 1, look at the signs on both sides of it in the table and on the bands, and decide whether the concavity changes there.'
        },
        {
            params: { stage: 11 },
            message: 'The first inflection verdict is about x = −3. The sign of f″ is + on (−∞, −3) and − on (−3, 1), so f is concave up on one side and concave down on the other. That is a change in concavity, so x = −3 is an inflection point of f, and the bands on the sign chart change color exactly there.'
        },
        {
            params: { stage: 12 },
            message: 'The second verdict takes x = 1, where the sign runs − on (−3, 1) and + on (1, ∞), so the concavity changes again and x = 1 is also an inflection point. The table gave both answers through sign changes, and the AP justification card now shows the sentence shapes to write, including the one never to write. Read the Two routes into one answer note last, because it is the whole point of this mode: f′ behavior and f″ signs are the same fact about bending.'
        }
    ],
    summary: {
        idea: 'Concavity is a statement about how f′ behaves. Where f′ is increasing, f is concave up, and where f′ is decreasing, f is concave down, which is the route Problem 1 used on the graph of y = f′(x) and reached its switch at x = 2. The equivalent route through f″ reads a positive sign as increasing f′ and a negative sign as decreasing f′, which is how Problem 2 filled its concavity column and then found inflection points at x = −3 and x = 1. An inflection point is a change in concavity, and a change in concavity needs two intervals, one on each side.',
        mistake: 'The sign of f′ is not concavity, and the zeros of f′ are not inflection points. On the Problem 1 graph f′ is positive on (0, 4) yet f is concave up only as far as x = 2 and concave down after it, because the crossings decide which way f runs and the turn decides which way f bends. On the Problem 2 side, f″(c) = 0 identifies a place worth checking, and the change in concavity across that place is the evidence, so a table where the sign stays + on both sides would carry no inflection point at all.',
        transfer: 'Given the graph of y = f′(x) with no formula, mark where that curve turns around, and the intervals between the turns are the concavity intervals of f, with climbing giving concave up and falling giving concave down. Given a sign table of f″, read each row as a behavior of f′, translate it into a concavity, and call a boundary an inflection point only when the sign differs on its two sides. Write the reason as a sentence about f′ or f″ on an interval, never as a point.'
    }
};

export default concavityTransferMode;
