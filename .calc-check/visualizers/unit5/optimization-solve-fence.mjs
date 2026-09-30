/* 5.11 Solving Optimization Problems, Mode 1: Solve the fencing model.
   The direct downstream of topic 5.10: the river fence arrives with its model
   already built (A(x) = x(40 − 2x) on 0 ≤ x ≤ 20), and nothing here re-teaches
   the modeling. The lesson runs the solver procedure on that exact model:
   differentiate, solve A′ = 0, build the candidate list with both endpoints,
   compare the objective values, then translate x = 10 back into the original
   quantities (10 m by 20 m, maximum area 200 m²).

   Copy discipline (a step's params and message land on the screen AFTER its
   own Predict, so every reveal flag sits in the step carrying the question it
   answers):
     - the derivative A′ = 40 − 4x appears only after its own question;
     - the critical number x = 10 appears only after its own question, and the
       graph guide is labeled interior critical number, never a maximum;
     - the candidate list 0, 10, 20 appears only after its own question;
     - the values column is comparison material and carries no ranking until
       the maximum question has been asked;
     - the absolute maximum marker, the contextual answer and the units card
       each appear only after their own question.
   The Second Derivative Test arrives late, after the closed-interval
   comparison has already justified the result, and it is kept explicitly as a
   local classification beside the absolute Candidates Test claim (topics 5.5
   and 5.7). Teaching cards retire on a later stage instead of stacking. */

const FENCE = 40;                          // total fencing, one side is the river
const yOf = (x) => FENCE - 2 * x;          // constraint solved for y
const AOf = (x) => x * yOf(x);             // one-variable objective from 5.10
const XOPT = 10;                           // the critical number, A′ = 0
const AMAX = AOf(XOPT);                    // 200, exact

const PLOT = 'color-mix(in srgb, var(--text-secondary) 12%, transparent)';
const XGEN = 8;                            // a neutral preview width, not the answer

/* Three decimals, trailing zeros trimmed, real minus sign. Every exact value
   in this mode (10, 20, 200, 0) prints as an integer behind a plain equals. */
function dsp3(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

export const optimizationSolveFenceMode = {
    label: 'Solve the fencing model',
    intro: 'Topic 5.10 already built this model. The river forms one side of the rectangle, the constraint is 2x + y = 40, the objective is A(x) = x(40 − 2x) = 40x − 2x², and the feasible domain is 0 ≤ x ≤ 20. Now solve it. The solver board fills one procedure row at a time, and the graph earns a marker only when the math has earned it.',
    params: { stage: 0 },
    controls: [],
    panes: {
        main: [
            {
                kind: 'table', title: 'Candidate board',
                when: (env) => env.stage >= 3,
                cols: (env) => {
                    const out = ['Candidate x', 'Why it is a candidate', 'A(x), m²'];
                    if (env.stage >= 4) out.push('How it compares');
                    return out;
                },
                rows: (env) => {
                    const rows = [
                        { x: 0, why: 'endpoint', val: 'A(0) = 0', top: false },
                        { x: 10, why: 'A′(x) = 0', val: 'A(10) = 200', top: true },
                        { x: 20, why: 'endpoint', val: 'A(20) = 0', top: false }
                    ];
                    return rows.map(r => {
                        const row = [
                            { v: () => 'x = ' + r.x },
                            { v: () => r.why },
                            { v: () => r.val, color: r.top && env.stage >= 4 ? 'accent' : 'ink', bold: r.top && env.stage >= 4 }
                        ];
                        if (env.stage >= 4) {
                            row.push({
                                v: () => r.top ? 'absolute maximum value' : 'not the absolute maximum',
                                color: r.top ? 'accent' : 'auxInk', bold: r.top
                            });
                        }
                        return row;
                    });
                },
                note: 'Endpoints stay in the comparison even though both describe a degenerate rectangle with area 0. Their values are the boundary checks the Candidates Test requires on a closed interval.'
            },
            {
                kind: 'graph', title: 'The objective A(x) = 40x − 2x² on [0, 20]', height: 300,
                window: [0, 21, 0, 240], gridX: 5, gridY: 50,
                curves: [{ fn: (x) => AOf(x), from: 0, to: 20, samples: 600, color: 'curveA', label: 'A(x)' }],
                vlines: (env) => {
                    if (env.stage < 2) return [];
                    return [{ x: XOPT, color: 'auxInk', label: 'interior critical number' }];
                },
                hlines: (env) => env.stage >= 4
                    ? [{ y: AMAX, color: 'accent', label: 'max ' + dsp3(AMAX) + ' m²' }]
                    : [],
                points: (env) => {
                    if (env.stage < 3) return [];
                    if (env.stage < 4) {
                        return [
                            { x: 0, y: 0, r: 4.5, color: 'auxInk' },
                            { x: XOPT, y: AMAX, r: 4.5, color: 'auxInk' },
                            { x: 20, y: 0, r: 4.5, color: 'auxInk' }
                        ];
                    }
                    return [
                        { x: 0, y: 0, r: 4.5, color: 'auxInk' },
                        { x: 20, y: 0, r: 4.5, color: 'auxInk' },
                        { x: XOPT, y: AMAX, r: 7, color: 'accent', label: 'A(10) = 200 m²', labelDx: 10, labelDy: 6 }
                    ];
                }
            },
            {
                kind: 'graph', title: (env) => env.stage >= 5
                    ? 'The finished region, read back through the constraint'
                    : 'The fenced region from topic 5.10',
                height: 240, window: [0, 42, 0, 22], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.stage >= 5 ? XOPT : XGEN;
                    return [{ from: 0, to: yOf(x), fn: () => 0, topFn: () => x,
                        color: env.stage >= 5 ? 'fillA' : PLOT }];
                },
                segments: (env) => {
                    const x = env.stage >= 5 ? XOPT : XGEN;
                    const y = yOf(x);
                    const fence = env.stage >= 5 ? 'accent' : 'ink';
                    return [
                        { x1: 0, y1: 0, x2: y, y2: 0, color: fence, width: env.stage >= 5 ? 4 : 2.5 },
                        { x1: 0, y1: 0, x2: 0, y2: x, color: fence, width: env.stage >= 5 ? 4 : 2.5 },
                        { x1: y, y1: 0, x2: y, y2: x, color: fence, width: env.stage >= 5 ? 4 : 2.5 },
                        { x1: 0, y1: x, x2: y, y2: x, color: 'auxInk', width: 3, dashed: true }
                    ];
                },
                notes: (env) => {
                    if (env.stage < 5) {
                        const y = yOf(XGEN);
                        return [
                            { x: 0.7, y: XGEN / 2, t: 'x', color: 'accent' },
                            { x: y / 2, y: 0.6, t: 'y = 40 − 2x', color: 'accent' },
                            { x: y * 0.5, y: XGEN + 0.9, t: 'river, no fence needed', color: 'auxInk' }
                        ];
                    }
                    return [
                        { x: 0.7, y: XOPT / 2, t: 'x = 10 m', color: 'accent' },
                        { x: 10, y: 0.6, t: 'y = 20 m', color: 'accent' },
                        { x: 10, y: 6, t: 'maximum area 200 m²', color: 'accent' },
                        { x: 10, y: XOPT + 0.9, t: 'river side', color: 'auxInk' }
                    ];
                }
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Solver board',
                lines: (env) => {
                    const L = [
                        { t: 'MODEL from topic 5.10. 2x + y = 40, so A(x) = x(40 − 2x) = 40x − 2x² on 0 ≤ x ≤ 20.' }
                    ];
                    if (env.stage >= 1) L.push({ t: '1. DERIVATIVE. A′(x) = 40 − 4x.', hl: env.stage < 2 });
                    if (env.stage >= 2) L.push({ t: '2. CRITICAL NUMBER. A′(x) = 0 gives x = 10 inside (0, 20).', hl: env.stage === 2 });
                    if (env.stage >= 3) L.push({ t: '3. CANDIDATES. Interior critical number plus endpoints: 0, 10, 20.' });
                    if (env.stage >= 3) L.push({ t: '4. OBJECTIVE VALUES. A(0) = 0, A(10) = 200, A(20) = 0.', hl: env.stage === 3 });
                    if (env.stage >= 4) L.push({ t: '5. CONCLUSION. The absolute maximum value is 200 m², taken at the input x = 10 m.', hl: env.stage === 4, color: 'accent' });
                    if (env.stage >= 5) L.push({ t: 'ANSWER IN CONTEXT. The maximizing dimensions are 10 m by 20 m, and the maximum enclosed area is 200 m².', hl: true, color: 'accent' });
                    if (env.stage >= 7) L.push({ t: 'The optimizing input x = 10 m is a length. The objective value A = 200 m² is an area. They are different quantities, and both belong in the answer.' });
                    return L;
                }
            },
            {
                kind: 'note', title: 'Why the endpoints stay on the list',
                when: (env) => env.stage >= 3 && env.stage < 4,
                text: 'Both endpoints describe a degenerate rectangle, and that is exactly why they are compared. A closed-interval check is not finished until every candidate, endpoint or not, carries an objective value. Topic 5.5 built this list the same way.'
            },
            {
                kind: 'readout', title: 'Absolute maximum on [0, 20]',
                when: (env) => env.stage >= 4 && env.stage < 6,
                items: (env) => [
                    { label: 'objective value, area A', v: () => '200', unit: ' m²', color: 'accent' },
                    { label: 'input variable, side x', v: () => '10', unit: ' m' }
                ]
            },
            {
                kind: 'eq', title: 'Units of every number in the answer',
                when: (env) => env.stage >= 5 && env.stage < 7,
                lines: [
                    { t: 'x is a length, measured in meters.' },
                    { t: 'y is a length, measured in meters.' },
                    { t: 'A is an area, measured in square meters.' },
                    { t: 'Maximum area = 10 m is a dimension and unit error, twice over.', dim: true, color: 'down' }
                ]
            },
            {
                kind: 'eq', title: 'A second-derivative side note',
                when: (env) => env.stage >= 6 && env.stage < 7,
                lines: [
                    { t: 'A″(x) = −4, so A″(10) = −4 < 0.' },
                    { t: 'The Second Derivative Test from topic 5.7 classifies the critical point at x = 10 as a local maximum, because the objective is concave down there.' },
                    { t: 'This parabola opens down everywhere, so its local picture and its global picture happen to agree here.' }
                ]
            },
            {
                kind: 'compare', title: 'Two different claims about x = 10',
                when: (env) => env.stage >= 6 && env.stage < 7,
                sides: () => [
                    {
                        title: 'Second Derivative Test',
                        lines: [
                            'Reads A″(10) = −4 < 0.',
                            'Classifies the critical point as a local maximum.',
                            'Local wording about one point.'
                        ]
                    },
                    {
                        title: 'Candidates Test on [0, 20]',
                        lines: [
                            'Evaluates A at 0, 10 and 20.',
                            'Names 200 m² as the absolute maximum value.',
                            'Absolute wording about the whole domain.'
                        ]
                    }
                ],
                verdict: 'A′(10) = 0 with A″(10) < 0 describes the point. The closed-interval comparison describes the domain, and only that comparison made the result absolute.'
            },
            {
                kind: 'machine', title: 'The 5.11 procedure',
                when: (env) => env.stage >= 7,
                focus: () => 6,
                stages: () => [
                    { box: 'Model ready' }, { box: 'Differentiate' }, { box: 'Interior critical numbers' },
                    { box: 'Feasible candidates' }, { box: 'Endpoints' }, { box: 'Compare and justify' },
                    { box: 'Answer in context' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Which derivative should be used to locate interior candidates for the maximum of A(x) = 40x − 2x²?',
                choices: [
                    'A′(x) = 40 − 4x',
                    'A′(x) = 40 − 2x',
                    'A′(x) = 40x − 4'
                ], a: 0,
                whyBy: [
                    'Power rule, term by term: the derivative of 40x is 40, and the derivative of −2x² is −4x. So A′(x) = 40 − 4x, and interior candidates are the x-values where it equals zero.',
                    'This keeps the 2 from −2x² but forgets that differentiating x² brings down a factor of 2 as well. The derivative of −2x² is −4x, so the slope drops twice as fast as this line claims.',
                    'This differentiates as though the x stayed behind. The derivative of 40x is the constant 40, and the derivative of −2x² is the constant-free-in-x term −4x, so neither piece of 40x − 4 is a derivative of either term.'
                ]
            },
            message: 'The derivative row of the solver board is filled: A′(x) = 40 − 4x. Solving A′ = 0 is the next step, and no maximum label goes on the graph yet. A derivative alone locates nothing.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Solving A′(x) = 0 locates the interior candidate. Which x-value solves 40 − 4x = 0?',
                choices: [
                    'x = 10',
                    'x = 20',
                    'x = 40'
                ], a: 0,
                whyBy: [
                    '40 − 4x = 0 gives 4x = 40, so x = 10, and 10 lies inside the open interval (0, 20). That is the interior critical number.',
                    'x = 20 is the right end of the feasible domain, where y = 40 − 2x becomes 0. It solves the domain boundary, not A′ = 0, since A′(20) = −40.',
                    'This value drops the factor 4 from the equation. Check it: 40 − 4·40 is −120, nowhere near zero, and x = 40 lies outside 0 ≤ x ≤ 20 altogether.'
                ]
            },
            message: 'The critical number x = 10 is on the board, and the graph now carries a vertical guide with exactly one label: interior critical number. A critical number is a candidate, not the completed optimization conclusion. Topic 5.5 made that distinction, and it still rules here.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'The objective lives on the closed interval [0, 20]. Which x-values must be compared to determine the absolute maximum on this closed interval?',
                choices: [
                    '0, 10 and 20, the interior critical number together with both endpoints.',
                    '10 only, because the absolute maximum sits at the critical number.',
                    '0 and 20 only, because endpoints carry the domain boundary.'
                ], a: 0,
                whyBy: [
                    'The Candidates Test from topic 5.5: on a closed interval an absolute extremum is taken only at an endpoint or at an interior critical number, and every one of those must be evaluated. That is the list 0, 10, 20.',
                    'A critical number is a candidate, not a verdict. On a closed interval an endpoint is allowed to hold the largest value, so comparing 10 alone skips required rows of the list.',
                    'That list drops the interior critical number, the one row that turns out to hold the maximum here. Endpoints alone only prove what the boundary values are.'
                ]
            },
            message: 'The candidate board now holds x = 0, x = 10 and x = 20, each with its reason, and the A(x) column is filled: A(0) = 0, A(10) = 200, A(20) = 0. The endpoints are not skipped just because they describe degenerate rectangles. Their objective values are exactly the boundary checks the closed-interval comparison needs.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Which candidate gives the absolute maximum area?',
                choices: [
                    'x = 10, because A(10) = 200 is greater than A(0) = 0 and A(20) = 0.',
                    'x = 20, because it is the largest candidate on the list.',
                    'x = 0 or x = 20, because absolute extrema are guaranteed at endpoints.'
                ], a: 0,
                whyBy: [
                    'The comparison runs down the A(x) column, and 200 is its greatest entry. The absolute maximum value is A(10) = 200 m², taken at the interior critical number.',
                    'The size of a candidate says where it sits on the interval, not what the objective reaches there. A(20) = 0, the least possible area here.',
                    'Endpoints are candidates and they are compared, but nothing guarantees the absolute extremum occurs at an endpoint. Here both endpoint values are 0, and the greatest value sits inside.'
                ]
            },
            message: 'The comparison column now names the result, and only now the graph marks its top: the absolute maximum value is 200 m², occurring when the input is x = 10 m. The problem is not finished. x is only one of the original quantities, and the region figure shows a second dimension waiting on the other side, y = 40 − 2x.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'The calculus gave x = 10. What should the final contextual answer say?',
                choices: [
                    'The maximizing dimensions are 10 m by 20 m, and the maximum enclosed area is 200 m².',
                    'x = 10.',
                    'The maximum is 10 m.',
                    'The maximum area is 200 m.'
                ], a: 0,
                whyBy: [
                    'The constraint gives y = 40 − 2(10) = 20, so the fenced region measures 10 m by 20 m, and the objective value there is 200 m². Input, dimensions, value and units, all in one sentence.',
                    'A bare x = 10 is the critical number. It names an input and leaves out the second dimension, the extreme value and every unit.',
                    'This attaches a length to the word maximum. 10 m is the optimizing input x, and the maximum area is 200 m². Input variable and objective value are different quantities.',
                    'The number 200 is right and the unit is wrong. An area is measured in square meters, and 200 m is a length. The dimensions are still missing too.'
                ]
            },
            message: 'Back through the constraint: at x = 10, y = 40 − 2(10) = 20. The rectangle answer is 10 m by 20 m with maximum area 200 m², the finished region figure shows that rectangle, and the solver board now carries the answer in full context.'
        },
        {
            params: { stage: 6 },
            message: 'A side note from topic 5.7, after the result is already justified. A″(x) = −4 < 0 classifies the critical point at x = 10 as a local maximum. That is a second opinion about one point. The closed-interval Candidates Test is what made the result absolute, and the two claims stay in their own columns.'
        },
        {
            params: { stage: 7 },
            message: 'The full procedure, once: a ready model, differentiate, interior critical numbers, keep feasible candidates, add the endpoints the closed interval requires, compare and justify, then translate the mathematical result back into the original quantities. The last arrow is where most lost points live.'
        }
    ],
    summary: {
        idea: 'Solving an optimization problem means more than solving f′(x) = 0. Critical numbers are candidates. Keep only the values inside the feasible domain, include the endpoints the closed interval requires, compare the objective on that list, and translate the result back into the quantities and units of the original problem.',
        mistake: 'The critical number is usually the optimizing input, not the maximum value itself. Reporting x = 10 as the answer, or writing 10 m as the maximum area, loses the translation step. A derivative root outside the feasible domain is not a physical solution.',
        transfer: 'For any solved optimization problem, name the optimizing input, the extreme objective value, the units of both, and the evidence that makes the result an absolute optimum rather than a local one. Which of those four would an answer of only x = 10 leave out?'
    }
};

export default optimizationSolveFenceMode;
