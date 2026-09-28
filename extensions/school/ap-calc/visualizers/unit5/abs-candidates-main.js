/* 5.5 Using the Candidates Test to Determine Absolute (Global) Extrema.
   One mode, one hero visual: the candidate board. Topic 5.2 inspected the end-
   points and the interior critical numbers of this same curve one point at a
   time. Here the student builds that list for this problem first, and one
   procedure then compares the function values on it.

   The board is a table pane and it sits above the graph, which stays secondary
   evidence. Until the value comparison screens arrive the curve is faded and
   carries no candidate dots, so the picture cannot be read instead of the board.
   Columns and callouts grow with a monotone stage counter, and each stage is set
   in the same step that asks the question whose answer it reveals, so the board
   never shows an answer before its Predict. Predict one builds the list, predict
   two names the quantity compared, predict three finds the greatest value and
   predict four finds the least, so the student does both sides. After the
   comparison each teaching entry lives on one screen and retires on the next, and
   only the procedure stays. The arithmetic is the 5.2 arithmetic verbatim:
   f(x) = x^5/5 + x^4/4 − (2/3)x^3 on [−2.8, 1.8], with f′(x) = x²(x + 2)(x − 1). */

/* ---------- the reused 5.2 example --------------------------------------- */

const A = -2.8, B = 1.8;                                  /* the closed interval [A, B] */
const fQ = (x) => Math.pow(x, 5) / 5 + Math.pow(x, 4) / 4 - (2 / 3) * Math.pow(x, 3);
const dQ = (x) => x * x * (x + 2) * (x - 1);              /* f′, and f′ = 0 at −2, 0 and 1 */
const IV = '[−2.8, 1.8]';

/* Three decimals with the trailing zeros trimmed and the real minus sign. A
   value that came out of a rounded computation is only ever shown behind ≈. */
function dsp3(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
const near = (v) => '≈ ' + dsp3(v);
/* f(0) = 0 and f(−2) = 44/15 and f(1) = −13/60 are exact, so an exact value
   keeps the plain equals sign and only a rounded one carries ≈. */
const valStr = (v) => (Number.isInteger(v) ? dsp3(v) : near(v));

/* The candidate list. Row order is board order, left endpoint first. An end-
   point is never called a critical point, and a critical point stays a critical
   point even when it holds no extremum. `exact` is the closed-form value where
   the fraction is simple enough to print. The greatest value sits in row 1 and
   the least value in row 0, and both rows are derived from the values, never
   typed. */
const CANDS = [
    { x: A, why: 'left endpoint', kindName: 'endpoint' },
    { x: -2, why: 'critical point, f′ = 0', kindName: 'critical point', exact: '44/15' },
    { x: 0, why: 'critical point, f′ = 0', kindName: 'critical point', exact: '0' },
    { x: 1, why: 'critical point, f′ = 0', kindName: 'critical point', exact: '−13/60' },
    { x: B, why: 'right endpoint', kindName: 'endpoint' }
];

/* One candidate paired with its value, which is the shape an AP response wants:
   'f(−2) = 44/15 ≈ 2.933' and 'f(−2.8) ≈ −4.42'. */
const fLine = (c) => {
    const v = fQ(c.x);
    if (c.exact === undefined) return 'f(' + dsp3(c.x) + ') ' + near(v);
    return 'f(' + dsp3(c.x) + ') = ' + c.exact + (Number.isInteger(v) ? '' : ' ' + near(v));
};

const VALS = CANDS.map(c => fQ(c.x));
const I_MAX = VALS.indexOf(Math.max.apply(null, VALS));
const I_MIN = VALS.indexOf(Math.min.apply(null, VALS));
const V_MAX = valStr(VALS[I_MAX]);
const V_MIN = valStr(VALS[I_MIN]);
const X_MAX = dsp3(CANDS[I_MAX].x);
const X_MIN = dsp3(CANDS[I_MIN].x);
/* The value with its location attached, used wherever prose quotes a result. */
const AT_MAX = fLine(CANDS[I_MAX]);
const AT_MIN = fLine(CANDS[I_MIN]);

/* How it compares column. Before stage 3 it is not on the board at all. At
   stage 3 only the maximum is named, because the minimum is still the open
   question of the next Predict. */
function compareCell(i, stage) {
    if (stage < 3) return '';
    if (i === I_MAX) return 'absolute maximum value';
    if (stage < 4) return 'not decided yet';
    if (i === I_MIN) return 'absolute minimum value';
    return 'not an absolute extremum';
}

const STEPS_TEXT = [
    '1. Find the critical numbers inside (a, b).',
    '2. Add the endpoints a and b to that list.',
    '3. Evaluate f at every candidate.',
    '4. Compare the function values.'
];

export const candidatesMode = {
    label: 'The candidates test',
    intro: 'The same curve and the same interval ' + IV + ' as topic 5.2. Back then each interesting point of this curve was inspected on its own, with its own question about its own neighborhood. Now those points become one list, and one procedure reads that whole list at once. The candidate board is the work surface, and the graph under it is supporting evidence only. Nothing is decided yet, and no name is on the board until you have built the list yourself.',
    params: { stage: 0 },
    controls: [],
    fns: { f: (x) => fQ(x) },
    compute: (env) => ({ settled: env.stage >= 4 }),
    panes: {
        main: [
            {
                kind: 'table', title: 'Candidate board',
                when: (env) => env.stage >= 1,
                cols: (env) => {
                    const out = ['Candidate x', 'Why it is a candidate'];
                    if (env.stage >= 2) out.push('f(x), approx.');
                    if (env.stage >= 3) out.push('How it compares');
                    return out;
                },
                rows: (env) => CANDS.map((c, i) => {
                    const row = [
                        { v: () => 'x = ' + dsp3(c.x) },
                        { v: () => c.why }
                    ];
                    if (env.stage >= 2) {
                        const topRow = env.stage >= 3 && i === I_MAX;
                        const lowRow = env.stage >= 4 && i === I_MIN;
                        row.push({
                            v: () => valStr(fQ(c.x)),
                            color: topRow ? 'accent' : (lowRow ? 'aux' : 'ink'),
                            bold: topRow || lowRow
                        });
                    }
                    if (env.stage >= 3) {
                        const named = compareCell(i, env.stage);
                        row.push({
                            v: () => named,
                            color: i === I_MAX ? 'accent' : (i === I_MIN && env.stage >= 4 ? 'aux' : 'auxInk'),
                            bold: named === 'absolute maximum value' || named === 'absolute minimum value'
                        });
                    }
                    return row;
                }),
                note: (env) => env.settled
                    ? 'Both absolute extrema are settled, and each row keeps its own reason for being on this list.'
                    : (env.stage >= 2
                        ? 'The f(x), approx. column is the only material the comparison uses. No derivative value is on this board.'
                        : 'Every candidate is here with its reason. No function value has been written yet.')
            },
            {
                kind: 'graph', title: 'y = f(x), where f(x) = x^5/5 + x^4/4 − (2/3)x^3', height: 300,
                window: [-3.15, 2.15, -5, 3.5],
                vband: () => [{ from: A, to: B, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }],
                /* The curve is faded until the comparison screens arrive, so the
                   picture never answers a question the board has to work through. */
                curves: (env) => [{
                    fn: 'f', from: A, to: B, samples: 600,
                    color: env.stage >= 3 ? 'curveA' : 'color-mix(in srgb, var(--text-secondary) 40%, transparent)'
                }],
                vlines: () => [
                    { x: A, color: 'auxInk', label: 'a = ' + dsp3(A) },
                    { x: B, color: 'auxInk', label: 'b = ' + dsp3(B) }
                ],
                hlines: (env) => {
                    const out = [];
                    /* hline labels are end-anchored at the right edge, so they are
                       kept short enough to stop left of the y-axis tick column */
                    if (env.stage >= 3) out.push({ y: VALS[I_MAX], color: 'accent', label: 'absolute max ' + V_MAX });
                    if (env.stage >= 4) out.push({ y: VALS[I_MIN], color: 'aux', label: 'absolute min ' + V_MIN });
                    return out;
                },
                points: (env) => {
                    /* No dots at all while the board has no values, plain dots the
                       moment the values appear, and emphasis only on the two
                       screens that answer the comparison predicts. */
                    if (env.stage < 2) return [];
                    return CANDS.map((c, i) => {
                        const topHere = env.stage >= 3 && i === I_MAX;
                        const lowHere = env.stage >= 4 && i === I_MIN;
                        return {
                            x: c.x, y: fQ(c.x),
                            r: topHere || lowHere ? 6.5 : 4.5,
                            color: topHere ? 'accent' : (lowHere ? 'aux' : 'auxInk'),
                            label: topHere ? 'x = ' + X_MAX : (lowHere ? 'x = ' + X_MIN : ''),
                            labelDx: i === I_MAX ? -40 : 8,
                            labelDy: 20
                        };
                    });
                }
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The function, its derivative and the interval',
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x^5/5 + x^4/4 − (2/3)x^3' },
                        { t: 'f′(x) = x²(x + 2)(x − 1)' },
                        { t: 'The closed interval is ' + IV + ', so a = ' + dsp3(A) + ' and b = ' + dsp3(B) + '.' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'The interior critical numbers are the x-values where f′ = 0 inside (−2.8, 1.8), and the endpoints come from a and b. Both kinds belong, and they belong for different reasons.' });
                    if (env.stage >= 2) out.push({ t: 'f′ measures steepness, and steepness is not on the board. The flat candidate x = 0 and the steep left endpoint x = ' + dsp3(A) + ', where f′ ' + near(dQ(A)) + ', are two rows of one comparison.' });
                    return out;
                }
            },
            {
                kind: 'readout', title: 'Absolute extremum on ' + IV,
                when: (env) => env.stage >= 3,
                items: (env) => {
                    const out = [
                        { label: 'absolute maximum value', v: () => V_MAX, color: 'accent' },
                        { label: 'the candidate x that takes it, an interior critical point', v: () => X_MAX }
                    ];
                    if (env.stage >= 4) {
                        out.push({ label: 'absolute minimum value', v: () => V_MIN, color: 'aux' });
                        out.push({ label: 'the candidate x that takes it, the left endpoint', v: () => X_MIN });
                    } else {
                        out.push({ label: 'absolute minimum value', v: () => 'not decided yet' });
                    }
                    return out;
                }
            },
            {
                kind: 'eq', title: 'Candidates Test procedure',
                /* the one teaching entry that stays on screen from here to the end */
                when: (env) => env.stage >= 5,
                lines: STEPS_TEXT.map((t, i) => ({ t: t, hl: i === STEPS_TEXT.length - 1 })).concat([
                    { t: 'On this lesson: a = ' + dsp3(A) + ', b = ' + dsp3(B) + ', five candidates, five function values, and the last step names one greatest value and one least value.' }
                ])
            },
            {
                kind: 'note', title: 'A candidate does not have to be an extremum',
                when: (env) => env.stage >= 6 && env.stage < 7,
                text: 'The Candidates Test includes every critical point, not only the critical points that pass the First Derivative Test. Once the candidate list is built, the function values decide the absolute extrema. The row for x = 0 is the example on this board: f′(0) = 0, so it belongs on the list, and it holds neither a local extremum nor an absolute extremum.'
            },
            {
                kind: 'eq', title: 'How to write the answer',
                when: (env) => env.stage >= 7 && env.stage < 8,
                lines: [
                    { t: 'On the closed interval ' + IV + ', the candidates are the two endpoints and the interior critical numbers.' },
                    { t: 'Evaluating f at each candidate pairs one value with one location.' }
                ].concat(CANDS.map(c => ({ t: fLine(c) }))).concat([
                    { t: 'The greatest candidate value is ' + AT_MAX + ', taken at the interior critical point x = ' + X_MAX + ', and that is the absolute maximum value on ' + IV + '.', hl: true, color: 'accent' },
                    { t: 'The least candidate value is ' + AT_MIN + ', taken at the left endpoint x = ' + X_MIN + ', and that is the absolute minimum value on ' + IV + '.', hl: true, color: 'aux' },
                    { t: 'The location is an x-value. The extreme value is f(x). Say which one the question asked for.' }
                ])
            },
            {
                kind: 'compare', title: 'EVT against the Candidates Test',
                when: (env) => env.stage >= 8 && env.stage < 9,
                sides: () => [
                    {
                        title: 'Extreme Value Theorem',
                        lines: [
                            'Answers one question: are absolute extrema guaranteed to exist?',
                            'It needs f continuous on a closed interval [a, b].',
                            'Its conclusion is existence only, with no location and no method.'
                        ]
                    },
                    {
                        title: 'Candidates Test',
                        lines: [
                            'Answers one question: which candidate holds the greatest or the least value?',
                            'It lists the endpoints and the interior critical points.',
                            'It settles that question by comparing the f(x), approx. column on the candidate board.'
                        ]
                    }
                ],
                verdict: 'One is the guarantee that the two extrema exist, the other is the comparison that says which candidate takes each of them.'
            },
            {
                kind: 'note', title: 'If the continuity condition fails', tone: 'warn',
                when: (env) => env.stage >= 8 && env.stage < 9,
                text: 'The Extreme Value Theorem needs f continuous on the closed interval. When that condition fails, comparing the candidate values alone no longer guarantees that one of the candidates is an absolute maximum or an absolute minimum. A function that is not continuous can approach a higher value without ever taking it, and it can fail to come down to a low one either. Additional information about the behavior of the function is needed before any claim about a greatest or a least value.'
            },
            {
                kind: 'eq', title: 'From 5.2 to 5.5, four separate questions',
                when: (env) => env.stage >= 9 && env.stage < 10,
                lines: [
                    { t: '5.2 asks what a critical point is, and what local versus absolute means.' },
                    { t: '5.3 asks what the sign of f′ says about increasing and decreasing.' },
                    { t: '5.4 asks whether f′ changes sign at a critical point, giving a local maximum, a local minimum or neither.' },
                    { t: '5.5 asks which endpoints and critical points hold the greatest or the least f-value.', hl: true },
                    { t: 'Four questions, four tools. This comparison does not replace the sign test, and the sign test does not find absolute extrema by itself.' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 0 },
            message: 'The interval is on the graph as a = ' + dsp3(A) + ' and b = ' + dsp3(B) + ', and the derivative line already reads f′(x) = x²(x + 2)(x − 1). The candidate board is still empty on purpose. For this problem, work out which x-values belong on the list before any value is written down.'
        },
        {
            params: { stage: 1 },
            predict: {
                q: 'For f′(x) = x²(x + 2)(x − 1) on ' + IV + ', which is the complete candidate list?',
                choices: [
                    'The complete list is {−2, 0, 1}, because these are the three x-values where f′(x) = x²(x + 2)(x − 1) equals zero.',
                    'The complete list is {−2.8, −2, 0, 1, 1.8}, because the two endpoints of the interval join every interior critical number.',
                    'The complete list is {−2.8, −2, 1, 1.8}, because the endpoints and the critical points that turn the curve over belong, and a flat critical point does not.'
                ], a: 1,
                whyBy: [
                    'That list keeps the interior critical numbers and loses both endpoints. The endpoints x = ' + dsp3(A) + ' and x = ' + dsp3(B) + ' are their own kind of candidate, because an absolute extremum can be taken at the place where the interval stops.',
                    'That is the complete list. f′ = 0 at x = −2, x = 0 and x = 1, and all three lie inside (−2.8, 1.8), so they are the interior critical numbers. Adding the endpoints a = ' + dsp3(A) + ' and b = ' + dsp3(B) + ' gives five candidates, held for two different reasons.',
                    'That list loses one kind of candidate on the inside. x = 0 solves f′(x) = 0, so it is an interior critical number and it stays on the list even though the curve does not turn over there. Only local extrema are kept out.'
                ]
            },
            message: 'The candidate board now holds five rows, and each row carries its own reason for being there. The two endpoints are candidates because the interval stops at them. The three interior critical numbers are candidates because f′ = 0 there, and each of them lies inside (−2.8, 1.8). No function value is on the board yet, and the graph below is still a faded curve with the two endpoints marked.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The candidate list is complete. Which quantity does the Candidates Test compare to decide the absolute extrema?',
                choices: [
                    'It compares the function values f(x) at the candidates. The greatest value in that column is the absolute maximum and the least is the absolute minimum.',
                    'It compares the derivative values f′(x) at the candidates. The largest slope tells you which candidate holds the extreme value.',
                    'It compares the x-coordinates of the candidates. The candidate with the largest x-value gives the largest function value.'
                ], a: 0,
                whyBy: [
                    'The test turns one question about every point of the curve into a short comparison of a few numbers, and those numbers are f(x) values. That is why the f(x), approx. column is what the board needs next.',
                    'Slopes belong to topics 5.3 and 5.4, where they classify a critical point. A steep candidate is not the candidate with the greatest value, and the board never asks for a derivative value.',
                    'The x-coordinate is a location, and locations are not ranked by size. The largest x on this interval is the right endpoint x = ' + dsp3(B) + ', and its function value is not the greatest one.'
                ]
            },
            message: 'The f(x), approx. column is now filled, each value beside its own candidate: ' + CANDS.map(fLine).join(', ') + '. Those five numbers are the whole comparison material, and the five dots on the graph carry no ranking. Nothing about steepness enters the board.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Which candidate gives the absolute maximum on ' + IV + '?',
                choices: [
                    'The candidate x = ' + X_MAX + ' gives the absolute maximum. Its value ' + AT_MAX + ' is greater than the value at every other candidate.',
                    'The candidate x = ' + dsp3(B) + ' gives the absolute maximum. The curve is still climbing as it reaches the right end of the interval, so that endpoint holds the greatest value.',
                    'The candidate x = ' + dsp3(A) + ' gives the absolute maximum. It is the first row on the candidate board, so it starts the comparison and keeps the top title.'
                ], a: 0,
                whyBy: [
                    'The f(x), approx. column is compared as it stands, and ' + AT_MAX + ' is its greatest entry, taken at the interior critical point x = ' + X_MAX + '. The exact value there is the fraction 44/15.',
                    'The right endpoint belongs on the list because it is an endpoint, not because the curve is climbing there. Its value f(' + dsp3(B) + ') ' + near(fQ(B)) + ' sits below ' + V_MAX + ', so that climb does not give the greatest value.',
                    'Row order is only a reading order. It carries no comparison, and standing first on the candidate list says nothing about which value is the greatest one.'
                ]
            },
            message: 'The How it compares column now names that candidate. The candidate x = ' + X_MAX + ' holds the greatest value on the board, so the absolute maximum value on ' + IV + ' is ' + AT_MAX + '. The emphasized dot, the horizontal line and the readout all carry the same location. The remaining rows stay unnamed for one more question.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Which candidate gives the absolute minimum on ' + IV + '?',
                choices: [
                    'The candidate x = ' + dsp3(A) + ' gives the absolute minimum. Its value ' + AT_MIN + ' is less than the value at every other candidate on the board.',
                    'The candidate x = 1 gives the absolute minimum. Its value f(1) = −13/60 is negative, and a negative function value is the least kind of value a candidate can hold.',
                    'The candidate x = 0 gives the absolute minimum. It is the critical point where f′ = 0 twice over, so the curve reaches its lowest value there.'
                ], a: 0,
                whyBy: [
                    'The same column decides this side too, and f(' + dsp3(A) + ') ' + near(fQ(A)) + ' is its least entry. That candidate is the left endpoint of ' + IV + '.',
                    'A sign is not a ranking. f(1) = −13/60 ' + near(fQ(1)) + ' is a negative value, and one other candidate value is negative and lower, so the least entry belongs elsewhere.',
                    'A repeated root in f′ tells you what happens to the sign of f′ near x = 0, and topic 5.4 settled that: f′ keeps its sign there, so x = 0 holds no local extremum. Flatness is not lowness, and f(0) = 0 is not the least entry on the board.'
                ]
            },
            message: 'The least entry in the f(x), approx. column is f(' + dsp3(A) + ') ' + near(fQ(A)) + ', so the absolute minimum value on ' + IV + ' is taken at x = ' + X_MIN + '. Notice that this candidate is an endpoint. Endpoints stay in the comparison even though they are not interior critical points. One title sits at an interior critical point and the other sits where the interval stops, and both came from comparing function values.'
        },
        {
            params: { stage: 5 },
            message: 'The Candidates Test procedure is the whole method, short enough to copy onto paper. Steps one and two built the list you answered with, step three filled the f(x), approx. column, and step four filled the How it compares column. No step asks you to look for the highest point on the picture.'
        },
        {
            params: { stage: 6 },
            message: 'Read the row for x = 0 against that procedure. It is a candidate because f′(0) = 0, and it stayed on the list even though topic 5.2 showed that this point is neither a local maximum nor a local minimum. Its comparison cell reads not an absolute extremum. Being on the candidate list and holding an extremum are two different things.'
        },
        {
            params: { stage: 7 },
            message: 'How to write the answer states the result in the form an AP response expects, and it keeps the two kinds of number apart. The location is an x-value, and the extreme value is f(x). A question about the maximum value wants ' + AT_MAX + ', and a question about where it occurs wants x = ' + X_MAX + '.'
        },
        {
            params: { stage: 8 },
            message: 'EVT against the Candidates Test splits the two jobs that topic 5.2 introduced together. The Extreme Value Theorem answers whether the absolute extrema are guaranteed to exist. The Candidates Test answers which candidate actually holds the greatest and the least value. If the continuity condition fails, the comparison of candidate values alone settles neither claim, and that is the tighter version of the warning topic 5.2 introduced.'
        },
        {
            params: { stage: 9 },
            message: 'From 5.2 to 5.5 keeps four topics as four different questions, so this procedure does not swallow the earlier tools. Read it top to bottom before topic 5.6, and keep the list building step and the sign changing step separate in your notes.'
        }
    ],
    summary: {
        idea: 'On a closed interval an absolute extremum can occur only at an endpoint or at an interior critical point. The Candidates Test builds that complete list, evaluates f at every candidate, and compares the function values. The greatest value is the absolute maximum and the least value is the absolute minimum.',
        mistake: 'Do not compare only the local extrema, and do not drop an endpoint or a critical point where the derivative fails to exist. Being on the candidate list does not mean holding an extremum, and x = 0 on this board is the proof. Do not report an x-value when the question asks for the extreme value, and do not ask the Extreme Value Theorem to locate anything. It guarantees existence only, and when its continuity condition fails, a comparison of the candidate values alone is not enough to guarantee that one of the candidates is an absolute maximum or an absolute minimum.',
        transfer: 'Build the complete candidate list first, and evaluate and compare only after the list is finished. A function f is continuous on [0, 4] with interior critical numbers at x = 1 and x = 3, and f(0) = 2, f(1) = 5, f(3) = −1, f(4) = 4. Which candidate holds the absolute maximum value, which holds the absolute minimum value, and how would you state each answer as a value and a location?'
    }
};

export default candidatesMode;
