/* 1.9 Limit Representation Translator — one relationship, four languages:
   graph, table, notation, words. One probe drives all of them. */

export default {
    id: 'u1-representations',
    meta: { unit: 1, topic: '1.9', title: 'Connecting Multiple Representations of Limits', visualizerTitle: 'Limit Representation Translator' },
    modes: [
        {
            label: 'One Probe, Four Forms',
            intro: 'Move the single probe on the x-axis. The graph, the table, the notation, and the words state one fact in four forms.',
            params: { x: 1.2, kase: 'hole' },
            controls: [
                { key: 'x', label: 'probe x', min: 0.3, max: 3.7, step: 0.01 },
                {
                    key: 'kase', label: 'situation', kind: 'choice',
                    options: [{ v: 'hole', label: 'hole at 2, separate dot' }, { v: 'jump', label: 'jump at 2' }]
                }
            ],
            fns: {
                f: (x, env) => env.kase === 'hole' ? (x === 2 ? 1 : x + 2) : (x < 2 ? x + 1 : x + 2)
            },
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'Graph', height: 320,
                        window: [0, 4.4, 0, 7],
                        curves: env => env.kase === 'hole' ? [
                            { fn: 'x+2', from: 0, to: 1.92, color: 'curveA' },
                            { fn: 'x+2', from: 2.08, to: 4.4, color: 'curveA' }
                        ] : [
                            { fn: 'x+1', from: 0, to: 1.95, color: 'curveA', label: 'left branch' },
                            { fn: 'x+2', from: 2.05, to: 4.4, color: 'curveA', label: 'right branch' }
                        ],
                        points: env => {
                            const out = [
                                { x: env.x, fn: 'f', label: 'probe', color: 'accent', drag: { key: 'x', min: 0.3, max: 4.1 } }
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
                        kind: 'table', title: 'Table (values near the probe)',
                        cols: ['x', 'f(x)'],
                        rows: env => [-0.3, -0.1, 0, 0.1, 0.3].map(d => {
                            const xv = env.x + d;
                            return [{ v: xv, bold: d === 0 }, { v: env.f(xv) }];
                        })
                    }
                ],
                side: [
                    {
                        kind: 'eq', title: 'Notation (live)',
                        lines: env => [
                            { t: 'f(' + round2(env.x) + ') = ' + round2(env.f(env.x)), hl: true },
                            { t: 'lim x→2⁻ f(x) = ' + (env.kase === 'hole' ? '4' : '3'), color: 'up' },
                            { t: 'lim x→2⁺ f(x) = ' + (env.kase === 'hole' ? '4' : '4'), color: 'down' },
                            { t: 'lim x→2 f(x) = ' + (env.kase === 'hole' ? '4' : 'DNE'), rule: env.kase === 'hole' ? 'the sides agree' : 'the sides disagree' }
                        ]
                    },
                    {
                        kind: 'note', title: 'Words (the same fact)',
                        text: env => env.kase === 'hole'
                            ? 'As x approaches 2 from either side, f(x) heads toward 4. The stored value f(2) = 1 does not change that trend.'
                            : 'From the left, the heights head toward 3. From the right, the heights head toward 4. Because the two sides have no single destination, the two-sided limit does not exist.'
                    }
                ]
            },
            steps: [
                { params: { x: 1.2, kase: 'hole' }, message: 'Place the probe to the left of 2. The four panels state one fact in four forms.' },
                { params: { x: 1.95 }, message: 'Move the probe toward 2. Notice which quantity changes and which one stays fixed.' },
                { params: { x: 2.05 }, message: 'Cross to the right of 2. The middle row of the table now sits past the hole, and the limit statement has not changed.' },
                {
                    params: { kase: 'jump' },
                    predict: {
                        q: 'Switch to the jump case. Now the four panels describe a function whose two-sided limit does not exist. Which panel is wrong?',
                        choices: ['Neither panel. The two-sided limit does not exist here.', 'The table panel. It needs more rows of values.', 'The graph panel. It needs a closer zoom at x = 2.'], a: 0,
                        why: 'Every panel shows the left side heading toward 3 and the right side heading toward 4. The notation line writes that disagreement as DNE, and the words panel says the same thing.'
                    },
                    message: 'The probe stays in place, and the situation changes. The words panel states in sentences what the other panels show.'
                }
            ],
            summary: {
                idea: 'The representation can change without changing the underlying limit. A fluent reader moves between graph, table, notation, and words freely.',
                mistake: 'The four representations get treated as four separate topics with four separate rule lists.',
                transfer: 'Close the page. Describe the limit of (x² − 1)/(x − 1) as x approaches 0 in four forms: graph, table, notation, and words. Use one sentence for each form.'
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
                                    window: [0.9, 2.9, 0.4, 5.4],
                                    curves: [
                                        { fn: '2x', from: 0.9, to: 1.93, color: 'curveA' },
                                        { fn: '2x', from: 2.07, to: 2.6, color: 'curveA' }
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
                                    window: [0.9, 2.9, 0.4, 5.4],
                                    curves: [{ fn: '2x', from: 0.9, to: 2.6, color: 'curveA' }],
                                    points: [{ x: 2, y: 4, color: 'ink', label: 'f(2) = 4' }]
                                }
                            },
                            {
                                title: 'C', graph: {
                                    width: 260, height: 200, ticks: false,
                                    window: [0.9, 2.9, 0.4, 5.4],
                                    curves: [
                                        { fn: '2x', from: 0.9, to: 1.95, color: 'curveA' },
                                        { fn: '2x − 1', from: 2.05, to: 2.6, color: 'curveA' }
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
                                    'Graph A matches. Both arms approach height 4, and the open circle at (2, 4) removes that point from the curve. The filled dot stores f(2) = 1, so the limit is 4 while the value at the point is 1.',
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
