/* 5.5 Using the Candidates Test, Full procedure challenge.
   Tab 4. One fresh problem the student solves end to end: h(x) = x^3 − 3x on the
   closed interval [−2, 3]. Nothing is pre-filled. The board grows only as each
   question is answered: first the candidate list (after the first Predict), then
   the h(x) values (after the second), then the comparison and the confirmation
   graph (after the third). The derivative, the critical numbers and every value
   stay hidden until the question whose answer they carry has been asked, so no
   pane, readout, eq line or message states an answer before its Predict. All
   values here are exact integers, so no approximate notation is used. The
   persistent four-step procedure card holds the method while it is executed. */

/* ---------- the fixed case, all integers --------------------------------- */

const HI = -2;                                              /* left endpoint  */
const HB = 3;                                               /* right endpoint */
const HN = (x) => Math.pow(x, 3) - 3 * x;                   /* h(x) = x^3 − 3x */
const HD = (x) => 3 * x * x - 3;                            /* h′(x) = 3x^2 − 3 */
const IV = '[−2, 3]';

/* Real minus sign for every displayed number. */
const m = (n) => String(n).replace('-', '−');

/* Candidate list in board order, left endpoint first. An endpoint is never
   called a critical point. Interior critical numbers are x = −1 and x = 1
   (h′ = 0). Values: h(−2) = −2, h(−1) = 2, h(1) = −2, h(3) = 18, so the
   maximum 18 sits at the right endpoint and the minimum −2 is taken twice. */
const CANDS = [
    { x: HI, why: 'left endpoint', val: HN(HI) },
    { x: -1, why: 'critical point, h′ = 0', val: HN(-1) },
    { x: 1, why: 'critical point, h′ = 0', val: HN(1) },
    { x: HB, why: 'right endpoint', val: HN(HB) }
];

const VALS = CANDS.map(c => c.val);
const V_MAX = Math.max.apply(null, VALS);                   /* 18 */
const V_MIN = Math.min.apply(null, VALS);                   /* −2 */
const I_MAX = VALS.indexOf(V_MAX);                           /* index 3, x = 3   */
const MIN_ROWS = VALS.map((v, i) => v === V_MIN ? i : -1).filter(i => i >= 0); /* 0 and 2 */
const MIN_LABEL = MIN_ROWS.map(i => 'x = ' + m(CANDS[i].x)).join(' and ');     /* 'x = −2 and x = 1' */

/* How it compares column. Absent before stage 3. The minimum is named on both
   of its rows so the double attainment is on the board itself. */
function compareCell(i, stage) {
    if (stage < 3) return '';
    if (i === I_MAX) return 'absolute maximum value';
    if (i === MIN_ROWS[0] || i === MIN_ROWS[1]) return 'absolute minimum value';
    return 'not an absolute extremum';
}

const STEPS_TEXT = [
    '1. Find the critical numbers of h inside (' + m(HI) + ', ' + m(HB) + ').',
    '2. Add the endpoints ' + m(HI) + ' and ' + m(HB) + ' to that list.',
    '3. Evaluate h at every candidate.',
    '4. Compare the function values.'
];

/* Highlight the step the student is executing, driven only by the monotone stage. */
function hlFor(stage, i) {
    if (stage < 1) return false;
    if (i === 0) return stage >= 1 && stage < 3;
    if (i === 1) return stage >= 1 && stage < 3;
    if (i === 2) return stage >= 2 && stage < 3;
    if (i === 3) return stage >= 3;
    return false;
}

export const challengeMode = {
    label: 'Full procedure challenge',
    intro: 'Now it is your turn, with no board filled in for you. The function is h(x) = x^3 − 3x and the closed interval is ' + IV + '. Run the Candidates Test procedure yourself, step by step. Start from the function and the interval only, and answer each question to reveal the piece it unlocks. The graph appears last, only to confirm the comparison you already made.',
    params: { stage: 0 },
    controls: [],
    fns: { h: (x) => HN(x) },
    compute: (env) => ({ settled: env.stage >= 3 }),
    panes: {
        main: [
            {
                kind: 'table', title: 'Candidate board',
                when: (env) => env.stage >= 1,
                cols: (env) => {
                    const out = ['Candidate x', 'Why it is a candidate'];
                    if (env.stage >= 2) out.push('h(x)');
                    if (env.stage >= 3) out.push('How it compares');
                    return out;
                },
                rows: (env) => CANDS.map((c, i) => {
                    const row = [
                        { v: () => 'x = ' + m(c.x) },
                        { v: () => c.why }
                    ];
                    if (env.stage >= 2) {
                        const isMax = env.stage >= 3 && i === I_MAX;
                        const isMin = env.stage >= 3 && (i === MIN_ROWS[0] || i === MIN_ROWS[1]);
                        row.push({
                            v: () => m(c.val),
                            color: isMax ? 'accent' : (isMin ? 'aux' : 'ink'),
                            bold: isMax || isMin
                        });
                    }
                    if (env.stage >= 3) {
                        const named = compareCell(i, env.stage);
                        row.push({
                            v: () => named,
                            color: named === 'absolute maximum value' ? 'accent' : (named === 'absolute minimum value' ? 'aux' : 'auxInk'),
                            bold: named === 'absolute maximum value' || named === 'absolute minimum value'
                        });
                    }
                    return row;
                }),
                note: (env) => env.stage >= 3
                    ? 'The h(x) column decided this, and the minimum appears on two rows at once.'
                    : (env.stage >= 2
                        ? 'Every candidate now carries a value, and none is ranked yet.'
                        : 'Four candidates with their reasons. No value has been written down.')
            },
            {
                kind: 'graph', title: 'y = h(x), where h(x) = x^3 − 3x', height: 260,
                when: (env) => env.stage >= 3,
                window: [-2.7, 3.7, -4, 21.5],
                vband: () => [{ from: HI, to: HB, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }],
                curves: [{ fn: 'h', from: HI, to: HB, samples: 600, color: 'curveA' }],
                vlines: () => [
                    { x: HI, color: 'auxInk', label: 'x = ' + m(HI) },
                    { x: HB, color: 'auxInk', label: 'x = ' + m(HB) }
                ],
                hlines: () => [
                    { y: V_MAX, color: 'accent', label: 'absolute max ' + m(V_MAX) },
                    /* the minimum line carries no label: at y = −2 its label row
                       would sit on the x-axis tick row, and the two points that
                       reach it are already labelled */
                    { y: V_MIN, color: 'aux' }
                ],
                points: () => CANDS.map((c, i) => {
                    const isMax = i === I_MAX;
                    const isMin = (i === MIN_ROWS[0] || i === MIN_ROWS[1]);
                    return {
                        x: c.x, y: c.val,
                        r: isMax || isMin ? 6.5 : 4.5,
                        color: isMax ? 'accent' : (isMin ? 'aux' : 'ink'),
                        label: isMax ? 'max here' : (isMin ? 'min here' : ''),
                        labelDx: isMax ? -46 : 8,
                        labelDy: isMax ? -8 : 20
                    };
                })
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Candidates Test procedure',
                lines: (env) => STEPS_TEXT.map((t, i) => ({ t: t, hl: hlFor(env.stage, i) }))
            },
            {
                kind: 'eq', title: 'The function and the interval',
                lines: (env) => {
                    const out = [
                        { t: 'h(x) = x^3 − 3x' },
                        { t: 'The closed interval is ' + IV + ', so a = ' + m(HI) + ' and b = ' + m(HB) + '.' }
                    ];
                    if (env.stage >= 1) {
                        out.push({ t: 'h′(x) = 3x^2 − 3.', hl: true });
                        out.push({ t: 'Setting h′(x) = 0 gives the interior critical numbers x = −1 and x = 1.' });
                    }
                    return out;
                }
            },
            {
                kind: 'readout', title: 'Absolute extrema on ' + IV,
                when: (env) => env.stage >= 3,
                items: () => [
                    { label: 'absolute maximum value', v: () => m(V_MAX), color: 'accent' },
                    { label: 'occurs at x, an endpoint', v: () => 'x = ' + m(HB) },
                    { label: 'absolute minimum value', v: () => m(V_MIN), color: 'aux' },
                    { label: 'occurs at x, two candidates', v: () => MIN_LABEL }
                ]
            },
            {
                kind: 'note', title: 'The same minimum height occurs twice',
                when: (env) => env.stage >= 3,
                text: 'One value can be an absolute extremum at more than one location. Here the least candidate value is ' + m(V_MIN) + ', and the board reaches it on two rows, at ' + MIN_LABEL + '. Report both x-values. Do not claim the endpoint x = ' + m(HI) + ' is only a starting point, it is a full candidate whose value ties the interior critical number.'
            },
            {
                kind: 'note', title: 'The graph only confirms your arithmetic',
                when: (env) => env.stage >= 3,
                text: 'This picture appeared after the comparison, never before it. It shows the right endpoint standing highest, holding the absolute maximum value ' + m(V_MAX) + ', and it shows the curve bottoming out at the same height ' + m(V_MIN) + ' at two x-values. The graph agrees with the board, it did not decide the board.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'For h(x) = x^3 − 3x on ' + IV + ', which is the complete candidate list for absolute extrema?',
                choices: [
                    'The list is ' + m(HI) + ', −1, 1 and ' + m(HB) + '. Solve 3x^2 − 3 = 0 to get the interior critical numbers x = −1 and x = 1, then add the endpoints x = −2 and x = 3.',
                    'The list is −1 and 1. These are the interior critical numbers where the derivative equals zero.',
                    'The list is ' + m(HI) + ', −1, 0, 1 and ' + m(HB) + '. The extra candidate x = 0 sits between the two interior critical numbers, so it belongs on the list.'
                ], a: 0,
                whyBy: [
                    'A candidate is an interior critical number or an endpoint. The interior critical numbers of h come from h′(x) = 3x^2 − 3 = 0, giving x = −1 and x = 1, and the two endpoints ' + m(HI) + ' and ' + m(HB) + ' join them. That is the complete list of four.',
                    'That list forgot both endpoints. On a closed interval an absolute extremum can occur at an endpoint, so x = −2 and x = 3 must be candidates too. An interior critical number is only part of the list.',
                    'The value x = 0 is neither an endpoint nor a critical number, since h′(0) = −3 is not zero. Sitting between two candidates is not a reason to be a candidate, so this list adds a row that the procedure never fills.'
                ]
            },
            message: 'The Candidate board now lists the four candidates, and the line h′(x) = 3x^2 − 3 is on the right. The two interior critical numbers came from that derivative, and the endpoints came from the interval. No h(x) value is written yet, so nothing has been compared.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The candidate list is complete. Which table holds the correct value of h at every candidate?',
                choices: [
                    'The values are h(−2) = −2, h(−1) = 2, h(1) = −2 and h(3) = 18.',
                    'The values are h(−2) = 2, h(−1) = −2, h(1) = 2 and h(3) = −18, since a cube keeps the sign of its input.',
                    'The values are h(−1) = 2 and h(1) = −2 and h(3) = 18, and the left endpoint x = −2 is dropped because the curve is already turning nearby.'
                ], a: 0,
                whyBy: [
                    'Substitute each candidate. h(−2) = (−2)^3 − 3(−2) = −8 + 6 = −2, h(−1) = (−1)^3 − 3(−1) = −1 + 3 = 2, h(1) = 1 − 3 = −2, and h(3) = 27 − 9 = 18. Those four numbers are the whole comparison.',
                    'Every sign is flipped. The cube of a negative stays negative, so (−2)^3 is −8, not 8, and h(−2) is −2, not 2. Work one line at a time and keep the minus signs attached to their numbers.',
                    'That table drops a candidate. The left endpoint x = −2 is a full candidate, so its value h(−2) = −2 belongs on the board even though the curve turns nearby. Dropping it removes the point that ties the minimum.'
                ]
            },
            message: 'The h(x) column is now filled for all four candidates. These four numbers are the only comparison material. Nothing is ranked yet, and the next question asks you to read the greatest value and the least value from that column.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Compare the function values. State the absolute maximum and the absolute minimum of h on ' + IV + ', each as a value and its location.',
                choices: [
                    'The absolute maximum value is 18 at x = 3, and the absolute minimum value is −2 at both x = −2 and x = 1.',
                    'The absolute maximum value is 18 at x = 3, and the absolute minimum value is −2 at x = 1. The endpoint x = −2 is only a starting point.',
                    'The absolute maximum value is 2 at x = −1, and the absolute minimum value is −2 at x = 1.'
                ], a: 0,
                whyBy: [
                    'The greatest value in the column is 18, taken at the right endpoint x = 3. The least value is −2, and it appears on two rows, at x = −2 and at x = 1, so the minimum is reached twice. Report the value with every location that holds it.',
                    'The endpoint x = −2 is a candidate, and h(−2) = −2 equals the least value. Because it ties x = 1, it must be named too. An endpoint is never only a starting point, its value joins the comparison.',
                    'The number 2 at x = −1 is a local peak, but 18 at x = 3 is greater, so the maximum is not 2. The absolute maximum is the greatest value across the whole candidate list, and here an endpoint beats the interior peak.'
                ]
            },
            message: 'The How it compares column now names both results. The greatest value ' + m(V_MAX) + ' is taken at the right endpoint x = ' + m(HB) + ', so an endpoint holds the absolute maximum. The least value ' + m(V_MIN) + ' appears on two rows, at ' + MIN_LABEL + ', so the same minimum height is reached twice. The confirmation graph has now appeared below the board.'
        },
        {
            params: { stage: 3 },
            message: 'You ran the whole procedure yourself. Step one found the interior critical numbers x = −1 and x = 1 from h′ = 0, step two added the endpoints x = −2 and x = 3, step three filled the h(x) column, and step four compared the values. Tab 1 runs these same four steps on a different function and leaves its board filled, so read your result back against that pattern.'
        }
    ],
    summary: {
        idea: 'The four steps are one procedure with no shortcuts. Find the interior critical numbers from h′ = 0 or h′ failing to exist, add both endpoints, evaluate h at every candidate, then compare those values. The greatest value is the absolute maximum and the least is the absolute minimum, and an endpoint can hold either title.',
        mistake: 'Do not drop an endpoint from the candidate list, and do not add an x that is neither an endpoint nor a critical number. Do not report a local peak as the absolute maximum before checking the endpoints, and do not hide a second location that ties the least value. Keep the value apart from its location when you write the answer.',
        transfer: 'This challenge left the board empty until you filled it. Tab 1 runs the same four steps on a different function, so compare your own board with that completed one, one row per candidate. Then try a new case on paper: k(t) = t^3 − 3t on [0, 3]. Both endpoints belong on the candidate list, one interior critical number comes from k′(t) = 3t^2 − 3, and the comparison of those three values decides which value and location each title lands on.'
    }
};

export default challengeMode;
