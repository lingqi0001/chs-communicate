/* 5.11 Solving Optimization Problems, Mode 2: Keep only feasible solutions.
   The 8.5 in by 11 in open-top box arrives exactly as topic 5.10 built it:
   V(x) = x(8.5 − 2x)(11 − 2x) on 0 ≤ x ≤ 4.25. No modeling question is asked
   again. The whole mode trains one habit: solving V′(x) = 0 can hand back
   algebraic solutions that do not belong to the physical model, and the
   feasible domain is what filters them.

   Hero visual: the number line that puts both roots of V′ against the domain.
   Stage 2 plots both solutions with no judgment, and the feasibility question
   of stage 3 is what colors the inside green and the outside red.

   Arithmetic, recomputed and kept at three decimals for the whole mode:
   V(x) = 4x³ − 39x² + 93.5x, V′(x) = 12x² − 78x + 93.5, discriminant 1596,
   roots (78 ± √1596)/24 ≈ 1.585 and ≈ 4.915, 4.915 > 4.25 is rejected
   because 8.5 − 2x ≈ −1.329 is not a length, and V(1.585) ≈ 66.148 in³ with
   base 5.329 in by 7.829 in. Rounded values always print behind ≈.

   Copy discipline: every reveal flag sits in the step carrying the question it
   answers, so the derivative, the two roots, the rejection, the comparison and
   the contextual sentence each appear only after their own Predict. The
   feasibility card and the result readout retire when the synchronized box
   figures take over at the end. */

const SW = 11;                            // sheet length, from topic 5.10
const SH = 8.5;                           // sheet width, from topic 5.10
const XHARD = SH / 2;                     // 4.25, the hard domain limit
const Vof = (x) => x * (SW - 2 * x) * (SH - 2 * x);
const SQ = Math.sqrt(1596);               // 78² − 4·12·93.5
const R1 = (78 - SQ) / 24;                // ≈ 1.585418, the feasible root
const R2 = (78 + SQ) / 24;                // ≈ 4.914582, the out-of-domain root
const VMAX = Vof(R1);                     // ≈ 66.148
const XPREV = 1;                          // neutral preview cut before the reveal

const SHEETFILL = 'color-mix(in srgb, var(--text-secondary) 10%, transparent)';
const CUT = 'color-mix(in srgb, #FF3B30 22%, transparent)';
const BASE = 'color-mix(in srgb, var(--accent) 22%, transparent)';

/* Three decimals, trailing zeros trimmed, real minus sign. Nothing rounded in
   this mode is ever printed behind a plain equals sign. */
function dsp3(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
const near = (v) => '≈ ' + dsp3(v);

const X1 = dsp3(R1);                      // '1.585'
const X2 = dsp3(R2);                      // '4.915'
const WSTR = dsp3(SH - 2 * R1);           // '5.329'
const LSTR = dsp3(SW - 2 * R1);           // '7.829'
const VSTR = dsp3(VMAX);                  // '66.148'
const NEG = dsp3(SH - 2 * R2);            // '−1.329'

export const optimizationSolveBoxMode = {
    label: 'Keep only feasible solutions',
    intro: 'Topic 5.10 already built this model: cut a square of side x from each corner of an 8.5 in by 11 in sheet, fold up the flaps, and the open-top box has volume V(x) = x(8.5 − 2x)(11 − 2x) on the feasible domain 0 ≤ x ≤ 4.25. Now solve it. The trap in this problem is not the algebra. Solving V′(x) = 0 will hand back two solutions, and only one of them is a box.',
    params: { stage: 0 },
    controls: [],
    panes: {
        main: [
            {
                kind: 'numberline', title: 'Every solution of V′(x) = 0, against the feasible domain',
                when: (env) => env.stage >= 2 && env.stage < 6,
                window: [-0.5, 5.5], step: 1,
                bands: (env) => env.stage >= 3
                    ? [
                        { from: 0, to: XHARD, color: 'accent', label: 'feasible domain' },
                        { from: XHARD, to: 5.5, color: 'down', label: 'no physical box' }
                    ]
                    : [],
                probes: (env) => env.stage >= 3
                    ? [{ x: R1, color: 'up' }, { x: R2, color: 'down' }]
                    : [{ x: R1, color: 'ink' }, { x: R2, color: 'ink' }]
            },
            {
                kind: 'table', title: 'Feasible candidate board',
                when: (env) => env.stage >= 4,
                cols: (env) => {
                    const out = ['Candidate x', 'Why it is a candidate', 'V(x), in³'];
                    if (env.stage >= 5) out.push('How it compares');
                    return out;
                },
                rows: (env) => {
                    const rows = [
                        { name: 'x = 0', why: 'endpoint', val: 'V(0) = 0', top: false },
                        { name: 'x ≈ ' + X1, why: 'V′(x) = 0, feasible', val: 'V(' + X1 + ') ≈ ' + VSTR, top: true },
                        { name: 'x = 4.25', why: 'endpoint', val: 'V(4.25) = 0', top: false }
                    ];
                    return rows.map(r => {
                        const row = [
                            { v: () => r.name },
                            { v: () => r.why },
                            { v: () => r.val, color: r.top && env.stage >= 5 ? 'accent' : 'ink', bold: r.top && env.stage >= 5 }
                        ];
                        if (env.stage >= 5) {
                            row.push({
                                v: () => r.top ? 'absolute maximum volume' : 'not the absolute maximum',
                                color: r.top ? 'accent' : 'auxInk', bold: r.top
                            });
                        }
                        return row;
                    });
                },
                note: 'The list holds the feasible critical number and the two endpoints of [0, 4.25]. The other solution of V′(x) = 0, x ≈ 4.915, never reaches this table. It was filtered out before the comparison, and the reason is on the board.'
            },
            {
                kind: 'graph', title: 'The volume model on its feasible domain, 0 ≤ x ≤ 4.25', height: 300,
                window: [0, 4.5, 0, 72], gridX: 1, gridY: 20,
                curves: [{ fn: (x) => Vof(x), from: 0, to: XHARD, samples: 600, color: 'curveA', label: 'V(x)', labelAt: 3.4 }],
                vlines: () => [{ x: XHARD, color: 'auxInk', label: 'x = 4.25' }],
                hlines: (env) => env.stage >= 5
                    ? [{ y: VMAX, color: 'accent', label: 'max ≈ ' + VSTR + ' in³' }]
                    : [],
                points: (env) => {
                    if (env.stage < 4) return [];
                    if (env.stage < 5) {
                        return [
                            { x: 0, y: 0, r: 4.5, color: 'auxInk' },
                            { x: XHARD, y: 0, r: 4.5, color: 'auxInk' },
                            { x: R1, y: VMAX, r: 4.5, color: 'auxInk' }
                        ];
                    }
                    return [
                        { x: 0, y: 0, r: 4.5, color: 'auxInk' },
                        { x: XHARD, y: 0, r: 4.5, color: 'auxInk' },
                        { x: R1, y: VMAX, r: 7, color: 'accent', label: '≈ ' + VSTR + ' in³', labelDx: 10, labelDy: 6 }
                    ];
                }
            },
            {
                kind: 'graph', title: (env) => env.stage >= 6
                    ? 'The sheet, corners cut at the optimizing size'
                    : 'The sheet, four corners cut at a trial size',
                height: 300, window: [0, 11.6, 0, 9.4], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.stage >= 6 ? R1 : XPREV;
                    const rects = [{ from: 0, to: SW, fn: () => 0, topFn: () => SH, color: SHEETFILL }];
                    rects.push({ from: x, to: SW - x, fn: () => x, topFn: () => SH - x, color: BASE });
                    rects.push({ from: 0, to: x, fn: () => 0, topFn: () => x, color: CUT });
                    rects.push({ from: SW - x, to: SW, fn: () => 0, topFn: () => x, color: CUT });
                    rects.push({ from: 0, to: x, fn: () => SH - x, topFn: () => SH, color: CUT });
                    rects.push({ from: SW - x, to: SW, fn: () => SH - x, topFn: () => SH, color: CUT });
                    return rects;
                },
                notes: (env) => {
                    const done = env.stage >= 6;
                    const x = done ? R1 : XPREV;
                    const out = [
                        { x: SW / 2, y: 0.3, t: '11 in', color: 'auxInk' },
                        { x: 0.3, y: SH / 2, t: '8.5 in', color: 'auxInk' },
                        { x: x / 2, y: x / 2, t: 'x', color: 'down' }
                    ];
                    if (done) out.push({ x: SW / 2, y: SH / 2, t: 'base ≈ ' + WSTR + ' in by ' + LSTR + ' in', color: 'accent' });
                    return out;
                }
            },
            {
                kind: 'graph', title: (env) => env.stage >= 6
                    ? 'The folded box, at the maximizing cut size'
                    : 'The folded box, side view at a trial size',
                height: 210, window: [0, 11.6, 0, 5.2], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.stage >= 6 ? R1 : XPREV;
                    return [{ from: x, to: SW - x, fn: () => 0, topFn: () => x, color: BASE }];
                },
                segments: (env) => {
                    const x = env.stage >= 6 ? R1 : XPREV;
                    return [
                        { x1: x, y1: 0, x2: SW - x, y2: 0, color: 'accent', width: 3 },
                        { x1: x, y1: 0, x2: x, y2: x, color: 'accent', width: 3 },
                        { x1: SW - x, y1: 0, x2: SW - x, y2: x, color: 'accent', width: 3 },
                        { x1: x, y1: x, x2: SW - x, y2: x, color: 'auxInk', width: 1.5, dashed: true }
                    ];
                },
                notes: (env) => {
                    const done = env.stage >= 6;
                    const x = done ? R1 : XPREV;
                    return [
                        { x: x / 2 + 0.15, y: x / 2, t: done ? 'height ≈ ' + X1 + ' in' : 'height x', color: 'accent' },
                        { x: SW / 2, y: 0.28, t: done ? 'base length 11 − 2x ≈ ' + LSTR + ' in' : 'base length 11 − 2x', color: 'auxInk' }
                    ];
                }
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Solver board',
                lines: (env) => {
                    const L = [
                        { t: 'MODEL from topic 5.10. V(x) = x(8.5 − 2x)(11 − 2x) on 0 ≤ x ≤ 4.25.' }
                    ];
                    if (env.stage >= 1) {
                        L.push({ t: 'EXPANDED, for differentiating. V(x) = 4x³ − 39x² + 93.5x.', dim: true });
                        L.push({ t: '1. DERIVATIVE. V′(x) = 12x² − 78x + 93.5.', hl: env.stage < 2 });
                        L.push({ t: 'Same equation note: 2V′(x) = 24x² − 156x + 187 has exactly the same solutions.', dim: true });
                    }
                    if (env.stage >= 2) L.push({ t: '2. CRITICAL EQUATION. V′(x) = 0 is a quadratic with two algebraic solutions: x ≈ ' + X1 + ' and x ≈ ' + X2 + '.', hl: env.stage === 2 });
                    if (env.stage >= 3) L.push({ t: '3. FEASIBILITY FILTER. ' + X1 + ' lies inside [0, 4.25]. ' + X2 + ' does not, so the physical model keeps one solution and rejects the other.', hl: env.stage === 3, color: 'accent' });
                    if (env.stage >= 4) L.push({ t: '4. CANDIDATES AND VALUES. Feasible critical number plus endpoints: 0, ' + X1 + ', 4.25. V(0) = 0, V(' + X1 + ') ≈ ' + VSTR + ', V(4.25) = 0.', hl: env.stage === 4 });
                    if (env.stage >= 5) L.push({ t: '5. CONCLUSION. The absolute maximum volume ≈ ' + VSTR + ' in³ is taken at the cut x ≈ ' + X1 + ' in.', hl: env.stage === 5, color: 'accent' });
                    if (env.stage >= 6) L.push({ t: 'ANSWER IN CONTEXT. Cut squares of about ' + X1 + ' in from each corner. The box measures about ' + LSTR + ' in by ' + WSTR + ' in by ' + X1 + ' in, and its maximum volume is about ' + VSTR + ' in³.', hl: true, color: 'accent' });
                    return L;
                }
            },
            {
                kind: 'note', title: 'The rejected root, explained',
                when: (env) => env.stage >= 3 && env.stage < 6,
                text: 'x ≈ ' + X2 + ' is a valid algebraic solution of V′(x) = 0, and it is not feasible in the physical model. At that cut size the base width 8.5 − 2x would be about ' + NEG + ' in, and a negative length describes no box. The feasible domain stopped being physical at x = 4.25, where the same width reaches exactly 0.'
            },
            {
                kind: 'readout', title: 'Absolute maximum on [0, 4.25]',
                when: (env) => env.stage >= 5 && env.stage < 6,
                items: (env) => [
                    { label: 'objective value, volume V', v: () => near(VMAX), unit: ' in³', color: 'accent' },
                    { label: 'input variable, cut x', v: () => near(R1), unit: ' in' }
                ]
            },
            {
                kind: 'readout', title: 'The box the math describes',
                when: (env) => env.stage >= 6,
                items: (env) => [
                    { label: 'cut size, also the box height', v: () => near(R1), unit: ' in' },
                    { label: 'base width 8.5 − 2x', v: () => near(SH - 2 * R1), unit: ' in' },
                    { label: 'base length 11 − 2x', v: () => near(SW - 2 * R1), unit: ' in' },
                    { label: 'maximum volume, the objective value', v: () => near(VMAX), unit: ' in³', color: 'accent' }
                ]
            },
            {
                kind: 'machine', title: 'The 5.11 procedure',
                when: (env) => env.stage >= 7,
                focus: () => 6,
                stages: () => [
                    { box: 'Model ready' }, { box: 'Differentiate' }, { box: 'Solve V′ = 0' },
                    { box: 'Keep feasible roots' }, { box: 'Endpoints' }, { box: 'Compare and justify' },
                    { box: 'Answer in context' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The model expands to V(x) = 4x³ − 39x² + 93.5x. Which derivative should locate the interior candidates?',
                choices: [
                    'V′(x) = 12x² − 78x + 93.5',
                    'V′(x) = 12x² − 78x + 93.5x',
                    'V′(x) = 4x² − 39x + 93.5'
                ], a: 0,
                whyBy: [
                    'Power rule, term by term: 4x³ gives 12x², −39x² gives −78x, and 93.5x gives the constant 93.5. So V′(x) = 12x² − 78x + 93.5.',
                    'The linear term 93.5x differentiates to the constant 93.5. Keeping the x copied the original term instead of taking its derivative.',
                    'This lowers each power but never multiplies by the old exponent. The derivative of 4x³ is 12x², not 4x², and −39x² becomes −78x, not −39x.'
                ]
            },
            message: 'The derivative row is filled: V′(x) = 12x² − 78x + 93.5. The dim line beside it notes that 24x² − 156x + 187, the doubled form, has exactly the same solutions. One primary form does the work.'
        },
        {
            params: { stage: 2 },
            message: 'V′(x) = 0 is a quadratic, and the quadratic formula hands back two algebraic solutions: x ≈ ' + X1 + ' and x ≈ ' + X2 + '. The number line above plots both of them against the feasible domain. No judgment has been made yet about which one means anything for the box.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Should both derivative solutions become candidates in this physical optimization problem?',
                choices: [
                    'No. Only solutions inside the feasible domain 0 ≤ x ≤ 4.25 belong to the physical model.',
                    'Yes. Both values solve V′(x) = 0 exactly, and every solution of V′(x) = 0 is a candidate.',
                    'No. The larger solution is an extraneous root, and extraneous roots are always dropped.'
                ], a: 0,
                whyBy: [
                    'A candidate for the contextual model must be a cut size the sheet allows. ' + X1 + ' lies inside [0, 4.25]. ' + X2 + ' lies past the hard limit, where the 8.5 − 2x base width is already negative.',
                    'Solving V′ = 0 is algebra, and the candidate list is feasible algebra. Being a true solution of the derivative equation earns a check against the domain, not a place in the comparison.',
                    'Extraneous is the wrong word here, and using it without the domain reason hides the actual point. x ≈ ' + X2 + ' is a perfectly valid algebraic solution of V′(x) = 0, and it fails the physical model, because 8.5 − 2x ≈ ' + NEG + ' is not a length.'
                ]
            },
            message: 'The filter is applied on screen: the green band is the feasible domain, the red band past x = 4.25 describes no box, and the two probes turn green and red to match. x ≈ ' + X2 + ' is rejected, not because the arithmetic was wrong, but because it lies outside 0 ≤ x ≤ 4.25.'
        },
        {
            params: { stage: 4 },
            message: 'Only feasible values reach the candidate list, and the closed domain adds its endpoints: x = 0, x ≈ ' + X1 + ' and x = 4.25. The volume column is filled: V(0) = 0, V(' + X1 + ') ≈ ' + VSTR + ' and V(4.25) = 0. Nothing is ranked yet.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Which feasible candidate maximizes the volume?',
                choices: [
                    'x ≈ ' + X1 + ', where V ≈ ' + VSTR + ' in³.',
                    'x ≈ ' + X2 + ', because V′(' + X2 + ') = 0.',
                    'x = 4.25, because it is the largest feasible cut size.'
                ], a: 0,
                whyBy: [
                    'Among the feasible candidates the values are 0, ≈ ' + VSTR + ' and 0, and the interior critical number holds the greatest of them. That is the absolute maximum volume on [0, 4.25].',
                    'That solution was rejected at the feasibility step. It solves V′ = 0 and it describes no box, because the base width there is about ' + NEG + ' in. A value outside the domain never enters the comparison.',
                    'Being the largest allowed input says nothing about the objective value. V(4.25) = 0, the degenerate end where the base width has collapsed to nothing.'
                ]
            },
            message: 'The comparison column names the result, and the graph marks its top: the absolute maximum volume is about ' + VSTR + ' in³, taken at the cut x ≈ ' + X1 + ' in. One number is the input and the other is the objective value, and the answer is not finished until both are back in inches.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'The calculus gave x ≈ ' + X1 + ' and V ≈ ' + VSTR + ' in³. What does the finished answer say about the physical box?',
                choices: [
                    'Cut squares of about ' + X1 + ' in from each corner. The resulting box is about ' + LSTR + ' in by ' + WSTR + ' in by ' + X1 + ' in, with a maximum volume of about ' + VSTR + ' in³.',
                    'The maximum volume is ' + X1 + ' in³.',
                    'Cut squares of about ' + VSTR + ' in from each corner.',
                    'x ≈ ' + X1 + '.'
                ], a: 0,
                whyBy: [
                    'Every number returns to its own quantity with its own unit. The cut and the resulting height are x ≈ ' + X1 + ' in, the base edges are 8.5 − 2x ≈ ' + WSTR + ' in and 11 − 2x ≈ ' + LSTR + ' in, and the objective value is the volume, about ' + VSTR + ' in³.',
                    'That pastes the input value onto the objective, with the wrong unit on top. ' + X1 + ' in is the cut size, and the maximum volume is about ' + VSTR + ' in³.',
                    'That is the volume, a cubic-inch quantity, pasted onto a cut length in inches. It also exceeds the sheet: cutting ' + VSTR + ' in from an 8.5 in side leaves nothing to fold.',
                    'A bare critical number. It is the optimizing input and nothing more, with no base dimensions, no maximum volume and no units sentence.'
                ]
            },
            message: 'The cut and fold figures now snap to the optimizing size, and the same number reads in five places at once: the corner squares on the sheet, the height and base edges of the folded box, the marked point on the volume curve, the highlighted row of the feasible candidate board, and the readout. Watching the mathematical solution turn back into a physical object is the point of the whole procedure.'
        },
        {
            params: { stage: 7 },
            message: 'The full procedure, once: a ready model, differentiate, solve the critical equation, keep only the feasible solutions, add the endpoints, compare and justify, then answer in context. Topic 5.11 keeps the two derivative solutions in separate lanes: the algebra accepted both, and only the physical model decides which one is an answer.'
        }
    ],
    summary: {
        idea: 'Solving an optimization problem means more than solving f′(x) = 0. Critical numbers are candidates. Keep only the values inside the feasible domain, add the endpoints the closed interval requires, compare the objective on that list, and translate the result back into the quantities and units of the original problem. In this box only one of the two derivative roots is a physical cut size.',
        mistake: 'The critical number is the optimizing input, not the maximum value itself, and reporting ≈ ' + X1 + ' as a volume confuses the two. A derivative root outside the feasible domain, here x ≈ ' + X2 + ' with its negative base width, is not a physical solution, and dismissing it as extraneous without the domain reason hides why the domain has the final say.',
        transfer: 'When V′(x) = 0 returns more solutions than the domain can hold, filter first and compare second. For any solved optimization problem, name the optimizing input, the extreme objective value, the units of both, and the evidence that makes the result an absolute optimum.'
    }
};

export default optimizationSolveBoxMode;
