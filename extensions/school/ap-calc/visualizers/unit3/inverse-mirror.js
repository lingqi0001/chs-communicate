/* 3.3 Inverse Slope Mirror — f and f⁻¹ are the same picture read in two
   directions, so reflecting across y=x swaps rise and run and the two tangent
   slopes come out reciprocals. The graph mode shows why; the table mode is the
   form the exam asks for. Both use the same function f(x) = x³. */

const n = v => String(Math.round(v * 1000) / 1000);
const slopeText = m => Number.isFinite(m) ? n(m) : 'vertical';
const f = x => x * x * x;
const fp = x => 3 * x * x;
/* rows of the same cubic, sampled: the table is the mirror read at whole x */
const ROWS = [0.5, 1, 1.5, 2, 2.5, 3].map(x => ({ x, fx: f(x), dpx: fp(x) }));

function graphState(env) {
    const b = f(env.a);
    const m = fp(env.a);
    return { b, slope: m, invSlope: 1 / m };
}

export default {
    id: 'u3-inverse-mirror',
    meta: { unit: 3, topic: '3.3', title: 'Differentiating Inverse Functions', visualizerTitle: 'Inverse Slope Mirror' },
    modes: [
        {
            label: 'Mirror Graph',
            intro: 'Drag P along f. The matching point Q sits on f⁻¹. It is the mirror image of P across y = x. The two tangents are reflections of each other.',
            params: { a: 0.9, panel: 0 },
            controls: [
                { key: 'a', label: 'x-coordinate of P', min: -1.25, max: 1.25, step: 0.01 },
                {
                    key: 'panel', label: 'extra example', kind: 'choice',
                    options: [
                        { v: 0, label: 'none' },
                        { v: 1, label: 'the input mistake' },
                        { v: 2, label: 'negative reciprocal' }
                    ]
                }
            ],
            fns: { fCubic: f, fInverse: x => Math.cbrt(x), identity: x => x },
            compute: graphState,
            panes: {
                main: [
                    {
                        kind: 'graph', width: 460, height: 460, title: 'f and f⁻¹ with equal scales on both axes',
                        window: [-1.75, 1.75, -1.75, 1.75],
                        curves: [
                            { fn: 'fCubic', color: 'curveA', label: 'f', from: -1.22, to: 1.22 },
                            { fn: 'fInverse', color: 'curveB', label: 'f⁻¹' },
                            { fn: 'identity', color: 'auxInk', dashed: true, label: 'y = x' }
                        ],
                        points: env => [
                            { x: env.a, fn: 'fCubic', color: 'accent', r: 6, drag: { key: 'a', min: -1.25, max: 1.25 }, label: 'P = (' + n(env.a) + ', ' + n(env.b) + ')' },
                            { x: env.b, y: env.a, color: 'curveB', r: 5, open: true, label: 'Q = (' + n(env.b) + ', ' + n(env.a) + ')' }
                        ],
                        segments: env => [{ x1: env.a, y1: env.b, x2: env.b, y2: env.a, color: 'auxInk', dashed: true }],
                        tangents: env => [
                            { fn: 'fCubic', x: env.a, m: env.slope, color: 'curveA', reach: 0.26, label: env => 'slope = ' + slopeText(env.slope) },
                            { fn: 'fInverse', x: env.b, y: env.a, m: env.invSlope, color: 'curveB', reach: 0.26, label: env => 'slope = ' + slopeText(env.invSlope) }
                        ]
                    },
                    {
                        kind: 'eq', title: 'The rule at the matching point',
                        lines: env => [
                            { t: 'f(a) = b   means   f⁻¹(b) = a', rule: 'inverse' },
                            { t: "(f⁻¹)'(b) = 1 / f'(a)", hl: true, color: 'accent' },
                            { t: 'a = ' + n(env.a) + ',  b = f(a) = ' + n(env.b) },
                            { t: "f'(a) = " + slopeText(env.slope) + ',  so  (f⁻¹)\'(b) = ' + slopeText(env.invSlope), hl: true }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'readout', title: 'The two slopes at matching points',
                        items: env => [
                            { label: 'P on f', v: '(' + n(env.a) + ', ' + n(env.b) + ')', color: 'accent' },
                            { label: "f'(a)", v: env.slope, color: 'curveA' },
                            { label: 'Q on f⁻¹', v: '(' + n(env.b) + ', ' + n(env.a) + ')', color: 'curveB' },
                            { label: "(f⁻¹)'(b)", v: Number.isFinite(env.invSlope) ? env.invSlope : 'no finite value, vertical', big: true, color: 'down' }
                        ]
                    },
                    {
                        kind: 'compare', title: 'Which input goes into f′',
                        when: env => env.panel === 1,
                        sides: env => [
                            {
                                title: 'Wrong: put the new input into f′', tone: 'wrong',
                                lines: ["1 / f'(" + n(env.b) + ')', "= 1 / " + n(fp(env.b)), '= ' + n(1 / fp(env.b))]
                            },
                            {
                                title: 'Right: solve f(a) = b first', tone: 'right',
                                lines: ['f(a) = ' + n(env.b) + ' gives a = ' + n(env.a), "1 / f'(" + n(env.a) + ')', '= ' + slopeText(env.invSlope)]
                            }
                        ],
                        verdict: env => 'The two answers are different. The wrong input gives ' + n(1 / fp(env.b)) + ' instead of ' + slopeText(env.invSlope) + '.'
                    },
                    {
                        kind: 'compare', title: 'Two different operations on a slope',
                        when: env => env.panel === 2,
                        sides: env => [
                            {
                                title: 'Mirror across y = x (inverse function)', tone: 'right',
                                lines: ['The rise and the run swap.', 'A slope m becomes 1/m.', 'The sign stays the same.', 'Here: ' + slopeText(env.slope) + ' → ' + slopeText(env.invSlope)]
                            },
                            {
                                title: 'Turn the line 90° (perpendicular)', tone: 'wrong',
                                lines: ['The rise and run swap, and the direction flips.', 'A slope m becomes −1/m.', 'The sign changes.', 'An inverse function does not do this.']
                            }
                        ],
                        verdict: 'Reflecting a curve is not rotating a line. Inverse tangents are reciprocals, not negative reciprocals.'
                    },
                    {
                        kind: 'note', title: 'Drag P',
                        text: 'P stays on f. Q stays on f⁻¹ with its coordinates swapped. Move P and read both slopes. One is always the reciprocal of the other.'
                    }
                ]
            },
            steps: [
                {
                    params: { a: 0.6 },
                    message: 'P is on the curve labeled f. Q is on the curve labeled f⁻¹, at the same two numbers in the other order. The line y = x cuts the dashed segment between them in half.'
                },
                {
                    params: { a: 1.1 },
                    predict: {
                        q: 'At a = 1.1 the tangent on f rises 3.63 units for every 1 unit it runs. Reflect the whole picture across y = x. What is the slope of the tangent on f⁻¹?',
                        choices: [
                            'It runs 3.63 units for every 1 unit it rises. The slope is 1/3.63.',
                            'It keeps slope 3.63. Reflecting does not change a line.',
                            'It becomes slope −3.63. A mirror reverses the sign.'
                        ], a: 0,
                        whyBy: [
                            'Reflection swaps horizontal and vertical change, so rise/run becomes run/rise. The slope of the tangent on f⁻¹ is ' + n(1 / fp(1.1)) + '.',
                            'The mirror moves the steepness to the other axis. A line that is steep in x becomes shallow once the axes are swapped.',
                            'A mirror image keeps the same direction of increase. An increasing function and its inverse both increase, so the sign cannot flip. Flipping the sign is what a perpendicular line does.'
                        ]
                    },
                    message: 'At matching points the two tangent slopes are reciprocals. The rule (f⁻¹)′(b) = 1 / f′(a) states exactly this.'
                },
                {
                    params: { a: 0 },
                    message: 'Move P to the origin. Here f′(0) = 0, so the tangent on f is flat and its mirror is the vertical line x = 0. A vertical line has no slope, so (f⁻¹)′(0) does not exist.'
                },
                {
                    params: { a: 1.1, panel: 1 },
                    message: 'The common mistake is to put the new input b directly into f′. That reads f′ at the wrong point and gives a different number. Solve f(a) = b first, then take the reciprocal.'
                },
                {
                    params: { panel: 2 },
                    message: 'Do not mix up an inverse tangent with a perpendicular tangent. Reflecting swaps rise and run. Rotating by 90° swaps them and flips the sign. Only the reflection applies to f⁻¹.'
                },
                {
                    params: { panel: 0, a: 0.9 },
                    message: 'Back to the mirror. Drag P slowly through the origin and watch both slopes. One grows without bound exactly when the other becomes 0.'
                }
            ],
            summary: {
                idea: 'Inverse functions swap inputs and outputs. So their tangent slopes swap rise and run, and the slopes at matching points are reciprocals.',
                mistake: "Students write 1 / f'(b) instead of 1 / f'(a). The derivative of f must be read at the x that produced b. That x comes from solving f(a) = b.",
                transfer: 'Switch to AP Table Mode and find (f⁻¹)′(27). Name the row you are using before you take the reciprocal.'
            }
        },
        {
            label: 'AP Table Mode',
            intro: 'The exam often gives a table instead of a formula. The steps do not change. Find the row where f(x) equals the target. Then take the reciprocal of f′ in that row.',
            params: { target: 8, revealed: 0 },
            controls: [
                {
                    key: 'target', label: 'target', kind: 'choice',
                    options: [
                        { v: 1, label: '(f⁻¹)′(1)' },
                        { v: 8, label: '(f⁻¹)′(8)' },
                        { v: 27, label: '(f⁻¹)′(27)' }
                    ]
                },
                {
                    key: 'revealed', label: 'answer', kind: 'choice',
                    options: [
                        { v: 0, label: 'hidden' },
                        { v: 1, label: 'shown' }
                    ]
                }
            ],
            compute: env => {
                const row = ROWS.find(r => Math.abs(r.fx - env.target) < 1e-9) || ROWS[3];
                return { rowX: row.x, rowFp: row.dpx, answer: 1 / row.dpx, rowIdx: ROWS.indexOf(row) };
            },
            panes: {
                main: [
                    {
                        kind: 'table', title: 'Values of f(x) = x³, the same function as in Mirror Graph',
                        cols: ['x', 'f(x)', "f′(x)"],
                        rows: env => ROWS.map((r, i) => [
                            n(r.x),
                            n(r.fx),
                            n(r.dpx),
                            env.revealed > 0.5 && i === env.rowIdx ? { v: 'this row: f(' + n(r.x) + ') = ' + n(r.fx), color: 'accent', bold: true } : ''
                        ]),
                        note: 'The row you want is the one whose f(x) equals the target. The x in that row is the point where you read f′.'
                    },
                    {
                        kind: 'eq', title: 'The same rule as the graph',
                        lines: env => {
                            const L = [
                                { t: "target: b = " + n(env.target) },
                                { t: 'solve f(a) = b  →  a = ' + n(env.rowX), color: env.revealed > 0.5 ? 'accent' : 'auxInk' }
                            ];
                            if (env.revealed > 0.5) {
                                L.push({ t: "f'(" + n(env.rowX) + ') = ' + n(env.rowFp) });
                                L.push({ t: "(f⁻¹)'(" + n(env.target) + ') = 1 / ' + n(env.rowFp) + ' = ' + n(env.answer), hl: true });
                            } else {
                                L.push({ t: "then (f⁻¹)'(b) = 1 / f'(a), where f(a) = b", color: 'auxInk' });
                            }
                            return L;
                        }
                    }
                ],
                side: [
                    {
                        kind: 'readout', title: 'Check your row',
                        items: env => [
                            { label: 'f(x) in the target row', v: env.target, color: 'accent' },
                            { label: 'x of that row', v: env.revealed > 0.5 ? env.rowX : 'hidden', color: 'curveC' },
                            { label: 'f′ at that x', v: env.revealed > 0.5 ? env.rowFp : 'hidden', color: 'curveB' },
                            { label: "(f⁻¹)'(" + n(env.target) + ')', v: env.revealed > 0.5 ? env.answer : 'hidden', big: true, color: 'down' }
                        ]
                    },
                    {
                        kind: 'practice', id: 'u3-inverse-table', title: 'Answer before you reveal',
                        items: env => [
                            {
                                q: 'The table lists f(x) = x³ and f′(x). For the row x = 2, what is (f⁻¹)′(8)?',
                                choices: [
                                    'It is 1/12. The row that outputs 8 is x = 2, and its f′ is 12.',
                                    'It is 1/24, from one row further along the table.',
                                    'It is 12, read straight off the table.'
                                ], a: 0,
                                whyBy: [
                                    'The inverse takes 8 back to 2. So its slope there is the reciprocal of the slope of f at 2.',
                                    '24 is f′ at a different x. Taking the reciprocal of the wrong row is a common way to lose this point on the exam.',
                                    'That is the slope of f at 2, not of f⁻¹ at 8. Mirroring puts it in the denominator.'
                                ]
                            },
                            {
                                q: 'The question asks about 8. Why is 1 / f′(8) still the wrong expression?',
                                choices: [
                                    'Because f′ takes an input from the domain of f. The value 8 is an output.',
                                    'Because 8 is too large for the table.',
                                    'Because f′ is never used for inverse derivatives.'
                                ], a: 0,
                                whyBy: [
                                    'f(2) = 8, so the inverse input 8 corresponds to x = 2 on f. That is where f′ is read.',
                                    'Size is not the problem. 8 is a legal input for f′, it is just the wrong point here.',
                                    'The rule does use f′. It is evaluated at a, the input that produces the target.'
                                ]
                            }
                        ]
                    }
                ]
            },
            steps: [
                {
                    params: { target: 8, revealed: 0 },
                    predict: {
                        q: 'The table says f(2) = 8 and f′(2) = 12. What should (f⁻¹)′(8) be?',
                        choices: [
                            'The answer is 1/12.',
                            'The answer is 1/2.',
                            'The answer is 1/8.'
                        ], a: 0,
                        whyBy: [
                            'The inverse takes 8 back to 2. The slope of f at 2 is 12, so the matching slope on f⁻¹ is its reciprocal, 1/12.',
                            '2 is the input of f, not a slope. It never ends up in a denominator by itself.',
                            '8 is the output of f. It tells you which row to use, not how steep the curve is.'
                        ]
                    },
                    message: 'This question tests two things. You need the row that matches the target, and you need the reciprocal. Work the two practice questions first, then set answer to shown.'
                },
                {
                    params: { revealed: 1 },
                    message: 'The row with f(x) = 8 is x = 2. Its f′ is 12, so (f⁻¹)′(8) = 1/12. The table does not change the rule shown in Mirror Graph mode.'
                },
                {
                    params: { target: 1 },
                    message: 'Move to (f⁻¹)′(1). The matching row is x = 1, and its f′ is 3. So the answer is 1/3. Switch to Mirror Graph mode and this is the point where the two curves cross y = x.'
                },
                {
                    params: { target: 27 },
                    message: 'Now find (f⁻¹)′(27). Solve f(a) = 27 first. That gives a = 3, where f′(3) = 27. So the answer is 1/27. Name the row before you write the fraction.'
                }
            ],
            summary: {
                idea: "In table form the rule is still (f⁻¹)'(b) = 1 / f'(a) where f(a) = b. The row you need is the one whose f(x) equals the target.",
                mistake: "Students put the target directly into f′. That reads the slope of f at the wrong point and gives a different number.",
                transfer: 'Try (f⁻¹)′(3.375) with the same table. Name the row and name f′ there. Only then write the reciprocal.'
            }
        }
    ]
};
