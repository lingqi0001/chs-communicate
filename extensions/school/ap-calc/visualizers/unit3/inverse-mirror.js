/* 3.3 Inverse Slope Mirror — f and f⁻¹ are the same picture read in two
   directions, so reflecting across y=x swaps rise and run and the two finite
   tangent slopes come out reciprocals wherever the starting slope is not zero.
   The graph mode shows why with slope triangles first and only then states the
   rule. A short Chain Rule bridge turns the mirror into a proof, and the table
   mode is the form the exam asks for.
   Stages are one monotonic gate: stage 1 shows the triangles, stage 2 reveals
   the reciprocal rule, stages 3 to 6 derive it from the Chain Rule. */

const n = v => String(Math.round(v * 1000) / 1000);
const slopeText = m => Number.isFinite(m) ? n(m) : 'vertical';
const invText = m => Number.isFinite(m) ? n(m) : 'no finite value';
const isDecreasing = env => env.panel === 3;
const fnF = x => x * x * x;
const fnFp = x => 3 * x * x;
const fnG = x => -x * x * x;
const fnGp = x => -3 * x * x;
const fCubic = (x, env) => isDecreasing(env) ? fnG(x) : fnF(x);
const fInverse = (x, env) => isDecreasing(env) ? -Math.cbrt(x) : Math.cbrt(x);

/* Table Mode data: strictly increasing values with a positive derivative in
   every row, so the function is invertible, yet no closed formula is given.
   The exam point is that you only read the matching row. */
const TROWS = [
    { x: 1, fx: -2, dpx: 4 },
    { x: 2, fx: 3, dpx: 7 },
    { x: 4, fx: 8, dpx: 5 },
    { x: 6, fx: 13, dpx: 2 }
];

function graphState(env) {
    const dec = isDecreasing(env);
    const a = env.a;
    const b = dec ? fnG(a) : fnF(a);
    const m = dec ? fnGp(a) : fnFp(a);
    return { b, slope: m, invSlope: 1 / m };
}

/* The slope triangle the spec asks for before the rule: run 1 on f, rise 1 on
   f⁻¹, so the reciprocal shows up as a swapped triangle, not a stated number.
   Drawn only for the increasing example, where run and rise stay positive. */
function triLegs(env) {
    const { a, b, slope } = env;
    const lo = Math.min(a - 1, b, a, b - slope);
    const hi = Math.max(a, b, a - 1, b - slope);
    if (lo < -2.6 || hi > 2.6) return [];
    const run = s => [{ x1: a - 1, y1: b, x2: a, y2: b, color: s, dashed: true },
        { x1: a - 1, y1: b, x2: a - 1, y2: b - slope, color: s, dashed: true }];
    const inv = s => [{ x1: b, y1: a, x2: b - slope, y2: a, color: s, dashed: true },
        { x1: b - slope, y1: a, x2: b - slope, y2: a - 1, color: s, dashed: true }];
    return [...run('curveA'), ...inv('curveB')];
}
function triNotes(env) {
    const { a, b, slope } = env;
    const lo = Math.min(a - 1, b, a, b - slope);
    const hi = Math.max(a, b, a - 1, b - slope);
    if (lo < -2.6 || hi > 2.6) return [];
    return [
        { x: a - 0.5, y: b + 0.1, t: 'run = 1', color: 'auxInk' },
        { x: a - 0.95, y: b - slope / 2, t: 'rise = ' + slopeText(slope), color: 'curveA' },
        { x: (b + b - slope) / 2, y: a - 0.02, t: 'run = ' + slopeText(slope), color: 'auxInk' },
        { x: b - slope + 0.05, y: a - 0.5, t: 'rise = 1', color: 'curveB' }
    ];
}

export default {
    id: 'u3-inverse-mirror',
    meta: { unit: 3, topic: '3.3', title: 'Differentiating Inverse Functions', visualizerTitle: 'Inverse Slope Mirror' },
    modes: [
        {
            label: 'Mirror Graph',
            intro: 'Drag P along f. The matching point Q sits on f⁻¹. It is the mirror image of P across y = x. The two tangents are reflections of each other.',
            params: { a: 0.9, panel: 0, stage: 0 },
            controls: [
                { key: 'a', label: 'x-coordinate of P', min: -1.3, max: 1.3, step: 0.01 },
                {
                    key: 'panel', label: 'example', kind: 'choice',
                    options: [
                        { v: 0, label: 'none' },
                        { v: 1, label: 'the input mistake' },
                        { v: 2, label: 'negative reciprocal' },
                        { v: 3, label: 'a decreasing function' }
                    ]
                }
            ],
            fns: { fCubic: fCubic, fInverse: fInverse, identity: x => x },
            compute: graphState,
            panes: {
                main: [
                    {
                        kind: 'graph', width: 460, height: 460, title: 'f and f⁻¹ with equal scales on both axes',
                        window: [-2.7, 2.3, -2.7, 2.3],
                        curves: [
                            { fn: 'fCubic', color: 'curveA', label: 'f', from: -1.3, to: 1.3 },
                            { fn: 'fInverse', color: 'curveB', label: 'f⁻¹' },
                            { fn: 'identity', color: 'auxInk', dashed: true, label: 'y = x' }
                        ],
                        points: env => [
                            { x: env.a, fn: 'fCubic', color: 'accent', r: 6, drag: { key: 'a', min: -1.3, max: 1.3 }, label: 'P = (' + n(env.a) + ', ' + n(env.b) + ')' },
                            { x: env.b, y: env.a, color: 'curveB', r: 5, open: true, label: 'Q = (' + n(env.b) + ', ' + n(env.a) + ')' }
                        ],
                        segments: env => {
                            const out = [{ x1: env.a, y1: env.b, x2: env.b, y2: env.a, color: 'auxInk', dashed: true }];
                            if (env.stage === 1 && !isDecreasing(env)) out.push(...triLegs(env));
                            return out;
                        },
                        tangents: env => [
                            { fn: 'fCubic', x: env.a, m: env.slope, color: 'curveA', reach: 0.26, label: env => 'slope = ' + slopeText(env.slope) },
                            { fn: 'fInverse', x: env.b, y: env.a, m: env.invSlope, color: 'curveB', reach: 0.26, label: env => env.stage >= 2 ? 'slope = ' + slopeText(env.invSlope) : '' }
                        ],
                        notes: env => env.stage === 1 && !isDecreasing(env) ? triNotes(env) : []
                    },
                    {
                        kind: 'eq', title: 'Reading the mirror',
                        lines: env => {
                            const L = [];
                            if (env.stage < 2) {
                                L.push({ t: 'f(a) = b means f⁻¹(b) = a', rule: 'inverse' });
                                L.push({ t: 'Reflect the slope triangle across y = x. The rise and the run trade places.', dim: true });
                                if (env.stage === 1) {
                                    L.push({ t: 'On f: run 1 and rise ' + slopeText(env.slope) + '.', dim: true });
                                    L.push({ t: 'On f⁻¹: run ' + slopeText(env.slope) + ' and rise 1.', dim: true });
                                }
                                L.push({ t: 'Answer the prediction first. The rule appears on the next screen.', dim: true });
                            } else {
                                L.push({ t: 'f(a) = b means f⁻¹(b) = a', rule: 'inverse' });
                                L.push({ t: "If f(a) = b and f′(a) ≠ 0, then (f⁻¹)′(b) = 1 / f′(a)", hl: true, color: 'accent' });
                                L.push({ t: 'The rule needs a nonzero starting slope. Where f′(a) = 0 it says nothing.', dim: true });
                                L.push({ t: 'a = ' + n(env.a) + ',  b = f(a) = ' + n(env.b) });
                                if (Number.isFinite(env.invSlope)) {
                                    L.push({ t: "f'(a) = " + slopeText(env.slope) + ',  so  (f⁻¹)\'(b) = ' + slopeText(env.invSlope), hl: true });
                                } else {
                                    L.push({ t: "f'(a) = 0, so the condition fails and (f⁻¹)′(b) has no finite value", hl: true, color: 'down' });
                                }
                                if (env.stage >= 3) L.push({ t: 'Where the rule comes from', rule: 'Chain Rule' });
                                if (env.stage >= 3) L.push({ t: 'f( f⁻¹(x) ) = x' });
                                if (env.stage >= 4) L.push({ t: "f'( f⁻¹(x) ) · (f⁻¹)′(x) = 1" });
                                if (env.stage >= 5) L.push({ t: "(f⁻¹)′(x) = 1 / f'( f⁻¹(x) )", hl: true });
                                if (env.stage >= 5) L.push({ t: 'The last step divides by f′, so it needs f′( f⁻¹(x) ) ≠ 0.', dim: true });
                                if (env.stage >= 6) L.push({ t: 'When f(a) = b and f′(a) ≠ 0, this reads (f⁻¹)′(b) = 1 / f′(a)' });
                            }
                            return L;
                        }
                    }
                ],
                side: [
                    {
                        kind: 'readout', title: 'The two slopes at matching points',
                        items: env => [
                            { label: 'P on f', v: '(' + n(env.a) + ', ' + n(env.b) + ')', color: 'accent' },
                            { label: "f'(a)", v: env.slope, color: 'curveA' },
                            { label: 'Q on f⁻¹', v: '(' + n(env.b) + ', ' + n(env.a) + ')', color: 'curveB' },
                            { label: "(f⁻¹)'(b)", v: env.stage >= 2 ? (Number.isFinite(env.invSlope) ? env.invSlope : 'no finite value, vertical') : 'read the swapped triangle', big: true, color: 'down' }
                        ]
                    },
                    {
                        kind: 'compare', title: 'Which input goes into f′',
                        when: env => env.panel === 1,
                        sides: env => [
                            {
                                title: 'Wrong: put the new input into f′', tone: 'wrong',
                                lines: ["1 / f'(" + n(env.b) + ')', "= 1 / " + n(fnFp(env.b)), '= ' + invText(1 / fnFp(env.b))]
                            },
                            {
                                title: 'Right: solve f(a) = b first', tone: 'right',
                                lines: ['f(a) = ' + n(env.b) + ' gives a = ' + n(env.a), "1 / f'(" + n(env.a) + ')', '= ' + slopeText(env.invSlope)]
                            }
                        ],
                        verdict: env => 'The two answers are different. The wrong input gives ' + invText(1 / fnFp(env.b)) + ' where the right input gives ' + slopeText(env.invSlope) + '.'
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
                        verdict: 'Reflecting a curve is not rotating a line. Tangent slopes of inverse functions are reciprocals at corresponding points, when both slopes are finite. They are never negative reciprocals.'
                    },
                    {
                        kind: 'compare', title: 'An increasing function and a decreasing one',
                        when: env => env.panel === 3,
                        sides: env => {
                            const col = (title, m) => {
                                const den = m < 0 ? '(' + n(m) + ')' : n(m);
                                return {
                                    title, tone: 'right',
                                    lines: [
                                        'At x = ' + n(env.a) + ' the slope is ' + slopeText(m) + '.',
                                        m !== 0
                                            ? 'The inverse slope is 1 / ' + den + ' = ' + n(1 / m) + '.'
                                            : 'The slope is 0, so there is no finite inverse slope. The mirror tangent is vertical.',
                                        m < 0 ? 'Negative stays negative.' : m > 0 ? 'Positive stays positive.' : 'Zero has no reciprocal to compare.'
                                    ]
                                };
                            };
                            return [col('Increasing f(x) = x³', fnFp(env.a)), col('Decreasing f(x) = −x³', fnGp(env.a))];
                        },
                        verdict: env => 'A reciprocal keeps the sign of the number it came from. The tangent to the inverse function is never steeper in the opposite direction. The decreasing column is what the graph shows right now, at x = ' + n(env.a) + '. Drag P and it moves with the point.'
                    },
                    {
                        kind: 'note', title: 'Drag P',
                        when: env => env.panel !== 3,
                        text: 'P stays on f. Q stays on f⁻¹ with its coordinates swapped. Move P and read both slopes. Wherever f′(a) is not 0, the two finite tangent slopes are reciprocals of each other. If f′(a) = 0, the inverse can have a vertical tangent there and no finite derivative.'
                    }
                ]
            },
            steps: [
                {
                    params: { a: 1.1, stage: 1 },
                    message: 'The tangent on f climbs 3.63 for every 1 it runs. Reflect the whole picture across y = x. The slope triangle flips, so its rise and run trade places. Read the two triangles and answer the question before the rule appears.'
                },
                {
                    params: { stage: 2 },
                    predict: {
                        q: 'At a = 1.1 the tangent on f rises 3.63 units for every 1 unit it runs. Reflect the whole picture across y = x. What is the slope of the tangent on f⁻¹?',
                        choices: [
                            'It runs 3.63 units for every 1 unit it rises. The slope is 1/3.63.',
                            'It keeps slope 3.63. Reflecting does not change a line.',
                            'It becomes slope −3.63. A mirror reverses the sign.'
                        ], a: 0,
                        whyBy: [
                            'Reflection swaps horizontal and vertical change, so rise/run becomes run/rise. The slope of the tangent on f⁻¹ is ' + n(1 / fnFp(1.1)) + '.',
                            'The mirror moves the steepness to the other axis. A line that is steep in x becomes shallow once the axes are swapped.',
                            'A mirror image keeps the same direction of increase. An increasing function and its inverse both increase, so the sign cannot flip. Flipping the sign is what a perpendicular line does.'
                        ]
                    },
                    message: 'The tangent on f⁻¹ runs 3.63 for every 1 it rises, so its slope is 1/3.63, about 0.275. Reflecting sent 3.63 to its reciprocal. At matching points the two finite tangent slopes are reciprocals, and the rule (f⁻¹)′(b) = 1 / f′(a) states exactly this for a starting slope that is not 0.'
                },
                {
                    params: { stage: 3 },
                    message: 'The mirror is a good picture, but the rule also has a short symbolic proof. Start from what an inverse means: f( f⁻¹(x) ) = x. The outer f undoes the inner f⁻¹ for every x.'
                },
                {
                    params: { stage: 4 },
                    message: 'Differentiate both sides with the Chain Rule. The outer derivative f′ is evaluated at the inner function f⁻¹(x), then multiplied by the derivative of the inside. The derivative of the constant x on the right is 1.'
                },
                {
                    params: { stage: 5 },
                    message: 'Solve that product for (f⁻¹)′(x). It is 1 divided by f′( f⁻¹(x) ). The division only makes sense when f′( f⁻¹(x) ) is not 0, so the rule carries that condition with it. It is exactly the Chain Rule from section 3.1 doing the work.'
                },
                {
                    params: { stage: 6 },
                    message: 'Now name the point. If f(a) = b and f′(a) is not 0, the rule reads (f⁻¹)′(b) = 1 / f′(a). The input a is the number that produced b, which is why the wrong input gives the wrong answer.'
                },
                {
                    params: { a: 0 },
                    message: 'Move P to the origin. Here f′(0) = 0, so the condition fails and the rule gives nothing. The tangent on f is flat and its mirror is the vertical line x = 0. A vertical line has no slope, so (f⁻¹)′(0) does not exist.'
                },
                {
                    params: { a: 1.1, panel: 1 },
                    message: 'The common mistake is to put the new input b directly into f′. Here that reads f′(1.331) and gives 0.188, while solving f(a) = b first gives f′(1.1) = 3.63 and 0.275. The two numbers differ, so the order matters on the exam.'
                },
                {
                    params: { panel: 2 },
                    message: 'Do not mix up the tangent to the inverse function with a perpendicular tangent. Reflecting swaps rise and run. Rotating by 90° swaps them and flips the sign. Only the reflection applies to f⁻¹.'
                },
                {
                    params: { panel: 3, a: 1 },
                    message: 'Now take a decreasing invertible function, f(x) = −x³. At x = 1 the slope is −3, and the inverse slope is 1 / (−3), about −0.333. The sign stays negative, so the tangent to the inverse function is never the negative reciprocal. The decreasing column follows P, so its two numbers are the tangents on the graph right now.'
                },
                {
                    params: { a: 0.5 },
                    message: 'Still on this decreasing curve, the slope is −0.75 and the inverse slope is about −1.333. The reciprocal kept the negative sign, and the decreasing column moved with P to show exactly those two numbers. Switch back to the increasing example to compare.'
                },
                {
                    params: { panel: 0, a: 1.1 },
                    message: 'Back on the mirror. Drag P slowly through the origin and watch both slopes. One grows without bound exactly when the other becomes 0, and the origin is the one place the rule cannot be used.'
                }
            ],
            summary: {
                idea: 'Inverse functions swap inputs and outputs. So their tangent slopes swap rise and run, and at matching points the two finite slopes are reciprocals. The rule needs f′(a) ≠ 0, because a zero starting slope has no reciprocal.',
                mistake: "Students write 1 / f'(b) instead of 1 / f'(a). The derivative of f must be read at the x that produced b, and that x comes from solving f(a) = b. Students also use the rule where f′(a) = 0. There the reciprocal has no finite value, and the inverse has a vertical tangent.",
                transfer: 'Switch to AP Table Mode and find (f⁻¹)′(8). Name the row you are using before you take the reciprocal.'
            }
        },
        {
            label: 'AP Table Mode',
            intro: 'The exam usually gives a table and no formula. You cannot compute anything from a rule. Find the row where f(x) equals the target, read f′ in that same row, then take the reciprocal.',
            params: { target: 8, revealed: 0 },
            controls: [
                {
                    key: 'target', label: 'target', kind: 'choice',
                    options: [
                        { v: -2, label: '(f⁻¹)′(−2)' },
                        { v: 3, label: '(f⁻¹)′(3)' },
                        { v: 8, label: '(f⁻¹)′(8)' },
                        { v: 13, label: '(f⁻¹)′(13)' }
                    ]
                },
                {
                    key: 'revealed', label: 'the answer', kind: 'choice',
                    options: [
                        { v: 0, label: 'hide the answer' },
                        { v: 1, label: 'show the answer' }
                    ]
                }
            ],
            compute: env => {
                const row = TROWS.find(r => Math.abs(r.fx - env.target) < 1e-9) || TROWS[2];
                return { rowX: row.x, rowFp: row.dpx, answer: 1 / row.dpx, rowIdx: TROWS.indexOf(row) };
            },
            panes: {
                main: [
                    {
                        kind: 'table', title: 'Selected values of an invertible function f (no formula given)',
                        cols: ['x', 'f(x)', "f′(x)"],
                        rows: env => TROWS.map((r, i) => [
                            n(r.x),
                            n(r.fx),
                            n(r.dpx),
                            env.revealed > 0.5 && i === env.rowIdx ? { v: 'read f′ here', color: 'accent', bold: true } : ''
                        ]),
                        note: 'There is no formula to differentiate. The row you want is the one whose f(x) equals the target, and the x in that row is where you read f′.'
                    },
                    {
                        kind: 'eq', title: 'Find the row, then take the reciprocal',
                        lines: env => {
                            if (env.revealed > 0.5) {
                                return [
                                    { t: "target: b = " + n(env.target) },
                                    { t: 'f(a) = ' + n(env.target) + '  →  a = ' + n(env.rowX), color: 'accent' },
                                    { t: "f'(" + n(env.rowX) + ') = ' + n(env.rowFp) },
                                    { t: "(f⁻¹)'(" + n(env.target) + ') = 1 / ' + n(env.rowFp) + ' = ' + n(env.answer), hl: true }
                                ];
                            }
                            return [
                                { t: 'f(a) = ' + n(env.target) },
                                { t: 'a = ?' },
                                { t: "then (f⁻¹)'(b) = 1 / f'(a), where f(a) = b and f′(a) ≠ 0", dim: true }
                            ];
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
                        kind: 'practice', id: 'u3-inverse-table', title: 'Answer first, then check',
                        items: [
                            {
                                q: 'The table lists f(x) and f′(x) with no formula. The row x = 4 shows f(4) = 8 and f′(4) = 5. What is (f⁻¹)′(8)?',
                                choices: [
                                    'It is 1/5. The row whose output is 8 is x = 4, and its f′ is 5.',
                                    'It is 1/7, from the row above it.',
                                    'It is 5, read straight off the f′ column.'
                                ], a: 0,
                                whyBy: [
                                    'The inverse sends 8 back to 4, so its slope there is the reciprocal of the slope of f at 4.',
                                    '7 is f′ at x = 2. The row for 8 is the one where f(x) = 8, which is x = 4.',
                                    'That is the slope of f at 4, not of f⁻¹ at 8. Mirroring puts it in the denominator.'
                                ]
                            },
                            {
                                q: 'Find (f⁻¹)′(3).',
                                choices: [
                                    'It is 1/7, because the row with f(x) = 3 has f′ = 7.',
                                    'It is 1/3, because the target 3 ends up in the denominator.',
                                    'It is 3, because that is the value of f in the row you need.'
                                ], a: 0,
                                whyBy: [
                                    'Scanning the f(x) column for 3 lands on x = 2, and f′(2) = 7, so the reciprocal is 1/7.',
                                    '3 is an output of f. It selects the row, and it never becomes the denominator.',
                                    'That is f at the matching input. The inverse slope is the reciprocal of f′ at that input.'
                                ]
                            },
                            {
                                q: 'The question asks about 8. Why is 1 / f′(8) the wrong expression?',
                                choices: [
                                    'Because f′ takes an input from the domain of f, and 8 is an output of f.',
                                    'Because 8 is too large for the table.',
                                    'Because f′ is never used for inverse derivatives.'
                                ], a: 0,
                                whyBy: [
                                    'The matching x comes from f(a) = 8, which gives a = 4. That is where f′ is read.',
                                    'Size is not the problem. 8 is a legal number, it is just an output rather than the matching input.',
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
                        q: 'The table gives no formula. The row x = 4 shows f(4) = 8 and f′(4) = 5. What is (f⁻¹)′(8)?',
                        choices: [
                            'The answer is 1/5.',
                            'The answer is 1/4.',
                            'The answer is 1/8.'
                        ], a: 0,
                        whyBy: [
                            'The inverse sends 8 back to 4. The slope of f at 4 is 5, so the matching slope on f⁻¹ is its reciprocal, 1/5.',
                            '4 is the input of f in that row, not a slope. It never ends up in a denominator by itself.',
                            '8 is the output of f. It tells you which row to use, not how steep the curve is.'
                        ]
                    },
                    message: 'Two things matter. You need the row whose f(x) equals the target, and you need the reciprocal of f′ in that row. Work the three practice questions first, then set the answer control to show the answer.'
                },
                {
                    params: { revealed: 1 },
                    message: 'The row where f(x) = 8 is x = 4. Its f′ is 5, so (f⁻¹)′(8) = 1/5. The table never needed a formula for f, and the rule is the same one shown in Mirror Graph mode.'
                },
                {
                    params: { target: 3, revealed: 0 },
                    message: 'Now find (f⁻¹)′(3) with no hints. Scan the f(x) column until a row outputs 3, read f′ in that row, and take the reciprocal. Say the row number out loud before you write the fraction.'
                },
                {
                    params: { revealed: 1 },
                    message: 'The row whose f(x) is 3 is the row x = 2, and its f′ is 7, so (f⁻¹)′(3) = 1/7. The target 3 never goes into f′ by itself.'
                },
                {
                    params: { target: 13, revealed: 0 },
                    message: 'Now find (f⁻¹)′(13). Same procedure, and the target can sit anywhere in the table. The row stays hidden until you show the answer.'
                },
                {
                    params: { revealed: 1 },
                    message: 'The row whose f(x) is 13 is x = 6, where f′(6) = 2, so (f⁻¹)′(13) = 1/2. Every target on this table is one row lookup plus one reciprocal.'
                }
            ],
            summary: {
                idea: "In table form the rule is still (f⁻¹)'(b) = 1 / f'(a) where f(a) = b and f′(a) ≠ 0. The row you need is the one whose f(x) equals the target, and there is no formula to reach for.",
                mistake: "Students put the target directly into f′. That reads the slope of f at the wrong point and gives a different number.",
                transfer: 'Try (f⁻¹)′(−2) with the same table. The matching row is x = 1, where f′(1) = 4, so the answer is 1/4. Name the row and name f′ there before you write the reciprocal.'
            }
        }
    ]
};
