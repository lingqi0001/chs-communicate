/* 1.9 Limit Representation Translator - one relationship, four languages:
   graph, table, notation, words. One distance h from the target drives all
   four, so every number on the page is a reading of the same act. */

export default {
    id: 'u1-representations',
    meta: { unit: 1, topic: '1.9', title: 'Connecting Multiple Representations of Limits', visualizerTitle: 'Limit Representation Translator' },
    modes: [
        {
            label: 'One Control, Four Forms',
            intro: 'One control sets the distance h from x = 2. The graph, the table, the notation, and the words state one fact in four forms, and every number in them comes from that same h.',
            params: { h: 0.8, kase: 'hole', reveal: 1 },
            controls: [
                /* The lower bound 0.1 keeps the two probes a tenth of a unit apart
                   on each side, so the table reads two distinct rows. The drawn
                   curve now reaches x = 2 itself, so a probe can never sit on a
                   slice of missing curve. */
                { key: 'h', label: 'distance h from x = 2', min: 0.1, max: 1.2, step: 0.01 },
                {
                    key: 'kase', label: 'situation', kind: 'choice',
                    options: [{ v: 'hole', label: 'hole at 2, separate dot' }, { v: 'jump', label: 'jump at 2' }]
                }
            ],
            /* Both probe positions come from h alone, so no form can drift away
               from the others and the four panels always read one x pair. */
            compute: (env) => ({ xL: 2 - env.h, xR: 2 + env.h }),
            fns: {
                f: (x, env) => env.kase === 'hole' ? (x === 2 ? 1 : x + 2) : (x < 2 ? x + 1 : x + 2)
            },
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'Graph: one probe on each side of 2', height: 320,
                        window: [0, 4.4, 0, 7],
                        /* The hole case uses one expression on both sides and leaves
                           out a single point, so it draws one continuous curve and the
                           open circle masks that point. The jump case genuinely
                           changes expression at x = 2, so its two arms stay two paths,
                           and their ends sit within a thousandth of 2. A missing point
                           is never a slice of vanished domain. */
                        curves: env => env.kase === 'hole' ? [
                            { fn: 'x+2', from: 0, to: 4.4, color: 'curveA' }
                        ] : [
                            { fn: 'x+1', from: 0, to: 1.999, color: 'curveA', label: 'left branch' },
                            { fn: 'x+2', from: 2.001, to: 4.4, color: 'curveA', label: 'right branch' }
                        ],
                        points: env => {
                            const out = [
                                { x: env.xL, fn: 'f', label: 'left probe', color: 'up', drag: { key: 'h', transform: (e, raw) => 2 - raw, min: 0.1, max: 1.2 } },
                                { x: env.xR, fn: 'f', label: 'right probe', color: 'down', drag: { key: 'h', transform: (e, raw) => raw - 2, min: 0.1, max: 1.2 } }
                            ];
                            if (env.kase === 'hole') {
                                out.push({ x: 2, y: 4, open: true, color: 'auxInk' }, { x: 2, y: 1, color: 'ink', label: 'f(2)' });
                            } else {
                                out.push({ x: 2, y: 3, open: true, color: 'auxInk' }, { x: 2, y: 4, open: true, color: 'auxInk' }, { x: 2, y: 4, color: 'ink', label: 'f(2)' });
                            }
                            return out;
                        },
                        vlines: [{ x: 2, color: 'aux', label: 'x = 2' }]
                    },
                    {
                        kind: 'table', title: 'Table: the same two readings',
                        cols: ['side', 'x', 'f(x)'],
                        rows: env => [
                            [{ v: 'left', color: 'up' }, { v: env.xL, bold: true }, { v: env.f(env.xL), bold: true }],
                            [{ v: 'right', color: 'down' }, { v: env.xR, bold: true }, { v: env.f(env.xR), bold: true }]
                        ],
                        note: 'The left row reads x = 2 − h and the right row reads x = 2 + h. These are the only two x values in play.'
                    }
                ],
                side: [
                    {
                        kind: 'eq', title: 'Notation (the same h)',
                        lines: env => {
                            const fL = env.f(env.xL), fR = env.f(env.xR);
                            const out = [
                                { t: 'x → 2⁻ at x = ' + round2(env.xL) + ', f(x) = ' + round2(fL), hl: true, color: 'up' },
                                { t: 'x → 2⁺ at x = ' + round2(env.xR) + ', f(x) = ' + round2(fR), hl: true, color: 'down' },
                                { t: 'The two readings stand ' + round2(Math.abs(fR - fL)) + ' apart', rule: 'gap between the probe heights' },
                                { t: 'lim x→2⁻ f(x) = ' + (env.kase === 'hole' ? '4' : '3'), color: 'up' },
                                { t: 'lim x→2⁺ f(x) = 4', color: 'down' }
                            ];
                            /* The last line is the verdict. A teaching step can hold it
                               back with reveal = 0, so the picture is read first and the
                               notation is written after the answer. */
                            out.push(env.reveal > 0.5
                                ? { t: 'lim x→2 f(x) = ' + (env.kase === 'hole' ? '4' : 'DNE'), rule: env.kase === 'hole' ? 'the sides agree' : 'the sides disagree' }
                                : { t: 'lim x→2 f(x) = ?', rule: 'the two one-sided lines decide it' });
                            return out;
                        }
                    },
                    {
                        kind: 'note', title: 'Words (that h in sentences)',
                        text: env => {
                            const fL = env.f(env.xL), fR = env.f(env.xR);
                            const both = 'From the left, at x = ' + round2(env.xL) + ', f(x) = ' + round2(fL) + '. From the right, at x = ' + round2(env.xR) + ', f(x) = ' + round2(fR) + '. ';
                            if (env.kase === 'hole') {
                                return both + 'As the two probes close in on 2, both heights head toward 4. The stored value f(2) = 1 does not change that trend.';
                            }
                            const read = both + 'The left height heads toward 3 and the right height heads toward 4, and the gap between them never closes.';
                            return env.reveal > 0.5
                                ? read + ' Because the two sides have no single destination, the two-sided limit does not exist.'
                                : read;
                        }
                    }
                ]
            },
            steps: [
                { params: { h: 0.8, kase: 'hole' }, message: 'The distance h is 0.8, so one probe sits at 1.2 and the other at 2.8. The four panels state one fact in four forms, and each of them reads the same pair of x values.' },
                { params: { h: 0.4 }, message: 'Shrink h to 0.4 and both probes move toward 2 together. Notice which quantities move and which one stays fixed.' },
                { params: { h: 0.1 }, message: 'Now h is 0.1, the closest these probes get. The two rows of the table sit either side of the hole, and the two probe heights stand 0.2 apart. That gap is 2h, so it shrinks every time h shrinks.' },
                /* Three steps replace one. The first applies the jump state and asks
                   nothing, so the picture is on screen before any words about it. The
                   second asks about that picture while the two-sided line is still
                   blank. The third fills the line in. */
                {
                    params: { kase: 'jump', reveal: 0 },
                    message: 'The situation now reads jump. The distance h stays at 0.1, so both probes keep their places. The left branch ends at an open circle at height 3, and the right branch begins at an open circle at height 4. A filled dot marks f(2) = 4. The notation keeps its two one-sided lines, and its last line still reads lim x→2 f(x) = ?. Read the panels, then choose what fills that blank.'
                },
                {
                    predict: {
                        q: 'The two one-sided lines on screen read 3 from the left and 4 from the right. What should the line lim x→2 f(x) = ? become?',
                        choices: [
                            'It should read DNE. The two sides aim at different numbers, so no single value works.',
                            'It should read 4, because the right branch and the filled dot both sit at height 4.',
                            'It should read 3.5, the height halfway between the two open circles.'
                        ], a: 0,
                        whyBy: [
                            'A two-sided limit needs one destination that both sides approach. The open circles sit at two different heights, so the honest notation is DNE, short for does not exist.',
                            'The limit never asks what happens at x = 2 itself. That row tells you the right-hand limit and the stored value, and it says nothing about the left side.',
                            'Nothing on the screen sits at height 3.5. That answer averages the two open circles and invents a destination neither branch heads toward.'
                        ]
                    },
                    message: 'The picture has not moved. The two open circles still sit at heights 3 and 4, and the notation still ends in lim x→2 f(x) = ?. Advance once more to write that line in.'
                },
                {
                    params: { reveal: 1 },
                    message: 'Now the notation fills that blank with lim x→2 f(x) = DNE, and the words panel says the same thing in a sentence. The graph with its two open circles, the table with its two rows, the notation, and the words all state one fact in four forms.'
                }
            ],
            summary: {
                idea: 'The representation can change without changing the underlying limit. A fluent reader moves between graph, table, notation, and words freely.',
                mistake: 'The four representations get treated as four separate topics with four separate rule lists.',
                transfer: 'Close the page. Describe the limit of (x² − 1)/(x − 1) as x approaches 1 in four forms: graph, table, notation, and words. The formula has no value at x = 1, and the limit is 2. Use one sentence for each form.'
            }
        },
        {
            label: 'Matching Challenge',
            intro: 'The table and the notation are given below. Choose the graph that matches both of them. The three candidate graphs are the answer choices, not a hint.',
            params: {},
            panes: {
                main: [
                    {
                        kind: 'table', title: 'Given information: the table and the notation',
                        cols: ['x', 'f(x)'],
                        rows: [[1.6, 3.2], [1.9, 3.8], [2, 1], [2.1, 4.2], [2.4, 4.8]],
                        hlRow: 2,
                        note: 'The notation says lim x→2 f(x) = 4 and f(2) = 1.'
                    },
                    {
                        kind: 'compare', title: 'Candidate graphs A, B, and C',
                        sides: [
                            {
                                title: 'A', graph: {
                                    width: 260, height: 200, ticks: false,
                                    window: [0.9, 2.9, 0.4, 6],
                                    curves: [
                                        { fn: '2x', from: 0.9, to: 2.9, color: 'curveA' }
                                    ],
                                    points: [
                                        { x: 2, y: 4, open: true, color: 'auxInk', label: 'hole' },
                                        { x: 2, y: 1, color: 'ink', label: 'f(2) = 1' }
                                    ]
                                }
                            },
                            {
                                title: 'B', graph: {
                                    width: 260, height: 200, ticks: false,
                                    window: [0.9, 2.9, 0.4, 6],
                                    curves: [{ fn: '2x', from: 0.9, to: 2.9, color: 'curveA' }],
                                    points: [{ x: 2, y: 4, color: 'ink', label: 'f(2) = 4' }]
                                }
                            },
                            {
                                title: 'C', graph: {
                                    width: 260, height: 200, ticks: false,
                                    window: [0.9, 2.9, 0.4, 6],
                                    curves: [
                                        { fn: '2x', from: 0.9, to: 1.999, color: 'curveA' },
                                        { fn: '2x − 1', from: 2.001, to: 2.9, color: 'curveA' }
                                    ],
                                    points: [
                                        { x: 2, y: 4, open: true, color: 'auxInk', label: 'left aim' },
                                        { x: 2, y: 3, open: true, color: 'auxInk', label: 'right aim' },
                                        { x: 2, y: 1, color: 'ink', label: 'f(2) = 1' }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        kind: 'practice', id: 'g19m', title: 'Choose the matching representation',
                        items: [
                            {
                                q: 'Which candidate graph can produce both the table above and the notation line?',
                                choices: ['Graph A matches the table and the notation.', 'Graph B matches the table and the notation.', 'Graph C matches the table and the notation.'], a: 0,
                                whyBy: [
                                    'Graph A matches. The curve approaches height 4 from both sides, and the open circle at (2, 4) removes that one point from the curve. The filled dot stores f(2) = 1, so the limit is 4 while the value at the point is 1.',
                                    'Graph B fails. Its curve reaches height 4 at x = 2, so its limit is correct, but its filled dot sits at (2, 4). That stores f(2) = 4, while the table says f(2) = 1.',
                                    'Graph C fails. Its filled dot does store f(2) = 1, but the left arm approaches 4 while the right arm approaches 3. Two different destinations mean no two-sided limit, so this graph cannot match the limit of 4.'
                                ]
                            },
                            {
                                q: 'The table gives f = 5.8, 5.98, 5.998 at x = 1.9, 1.99, 1.999, and f = 6.2, 6.02 at x = 2.1, 2.01. The table also gives f(2) = 10. What is lim x→2 f(x)?',
                                choices: ['The limit is 6, because both sides approach 6.', 'The limit is 10, because the table gives f(2) = 10.', 'The limit does not exist, because the two sides differ.'], a: 0,
                                why: 'Both sides approach 6, so the limit is 6. The value f(2) = 10 makes the function discontinuous at 2, and it does not change the limit.'
                            },
                            {
                                q: 'A verbal description says this. Approaching x = 3 from the left, the graph stays near height 7. Approaching from the right, the graph stays near height 1.',
                                choices: ['The limit is 4, because the heights 7 and 1 average out.', 'Both one-sided limits exist, but the two-sided limit does not exist.', 'The value f(3) does not exist, because the description skips it.'], a: 1,
                                why: 'The two one-sided statements can both be true, and they disagree, so the two-sided limit does not exist. The description says nothing about f(3), and a value there would not change the conclusion.'
                            },
                            {
                                q: 'The notation says lim x→a f(x) = L. What must a table of values near a show?',
                                choices: ['f(a) exists, and the row at a shows the value L.', 'The rows on both sides of a approach L, and the row at a may differ.', 'Every f value increases as x moves to the right.'], a: 1,
                                why: 'The limit only constrains the nearby behavior on both sides of a. It says nothing about the value f(a), and nothing about whether the function increases.'
                            }
                        ]
                    }
                ]
            },
            summary: {
                idea: 'Matching representations is a common exam task. It checks whether you read what a limit statement actually says.',
                mistake: 'The value f(a) pulls attention away from the trend the limit describes.',
                transfer: 'Write your own multiple-choice question where the table leads a reader to answer with f(a) instead of the limit.'
            }
        }
    ]
};

function round2(v) { return String(Math.round(v * 100) / 100); }
