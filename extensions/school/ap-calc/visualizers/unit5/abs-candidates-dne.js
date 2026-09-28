/* 5.5 Candidates Test, second case: the critical point where the derivative
   does not exist. Compact by design. The hero is the Candidate board, and the
   graph of g(x) = |x| + 0.2x on [−2, 1] sits below it as confirmation only.
   Nothing is listed before the first Predict, no tangent is drawn at the corner
   (the left and right slopes differ, so there is no single derivative at x = 0),
   and both comparisons are settled by function values, never by slopes. The
   shared math is copied verbatim from the build contract, because importing
   another lesson file would mean editing a live file. */

const IV = '[−2, 1]';

const gQ = (x) => Math.abs(x) + 0.2 * x;

/* g(−2) = 1.6, g(0) = 0 and g(1) = 1.2 are exact, so each keeps the plain
   equals sign and none needs an approximately marker. dsp3 prints a value with
   three decimals and the zeros at the end trimmed, which renders those exact
   figures unchanged, and it carries the real minus sign into the board cells. */
function dsp3(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* Three candidates, and each keeps its own reason. An endpoint is never called
   a critical point: x = −2 and x = 1 are on the board because the interval is
   closed, and x = 0 is on the board because g′ does not exist there while g(0)
   is defined. g′ = −0.8 on the left arm and 1.2 on the right arm, so g′ is
   never 0 anywhere. Values: g(−2) = 1.6, g(0) = 0, g(1) = 1.2. */
const CANDS = [
    { x: -2, reason: 'left endpoint' },
    { x: 0, reason: 'critical point, g′ does not exist' },
    { x: 1, reason: 'right endpoint' }
];

const SUMMARY = {
    idea: 'The candidate list for the Candidates Test is not the list of places where the derivative equals 0. It is both endpoints plus every interior critical point, and a critical point includes a place where the derivative does not exist as long as the function is defined there. On ' + IV + ' for g(x) = |x| + 0.2x the three candidates are x = −2, x = 0 and x = 1, and the comparisons give the absolute maximum value 1.6 at the left endpoint and the absolute minimum value 0 at the corner.',
    mistake: 'Setting g′ = 0 and listing only its roots. Here g′ is −0.8 on one arm and 1.2 on the other, so that equation has no solution at all, and the corner at x = 0 would be missing from the board even though it holds the absolute minimum. Do not call an endpoint a critical point either. Both kinds belong, for different reasons.',
    transfer: 'A function h is defined on [−3, 4], and its graph has a corner at x = 1 where h′ does not exist. Does x = 1 belong on the candidate list for that interval, and which two more x-values must the list carry before any value is compared?'
};

/* Comparison column wording. The maximum row opens once the maximum has been
   asked about, and the minimum and remaining rows once the minimum has been
   asked about. A row still waiting on the comparison reads not decided yet, so
   no screen states the result before the Next that reveals it. */
function compareCell(c, env) {
    if (c.x === -2) {
        return env.maxWon ? { v: 'absolute maximum value', color: 'accent', bold: true } : { v: 'not decided yet' };
    }
    if (c.x === 0) {
        return env.minWon ? { v: 'absolute minimum value', color: 'aux', bold: true } : { v: 'not decided yet' };
    }
    return env.minWon ? { v: 'not an absolute extremum', color: 'auxInk' } : { v: 'not decided yet' };
}

export const dneMode = {
    label: 'Where f′ does not exist',
    intro: 'This is g(x) = |x| + 0.2x on ' + IV + ', two straight arms that meet at one interior point. Nothing is listed yet, because the first question is which x-values deserve a place on the list at all. The graph is the smaller picture here, and the numbers do the deciding.',
    params: { stage: 0 },
    controls: [],
    fns: { g: (x) => gQ(x) },
    compute: (env) => ({ listed: env.stage >= 1, valued: env.stage >= 2, maxWon: env.stage >= 3, minWon: env.stage >= 4 }),
    panes: {
        main: [
            {
                /* dsp3 output travels inside a function so the table prints the
                   real minus sign, because a bare numeric string is read back
                   through the math parser and reprinted with an ASCII hyphen */
                kind: 'table', title: 'Candidate board',
                when: (env) => env.stage >= 1,
                cols: (env) => {
                    const out = ['Candidate x', 'Why it is a candidate'];
                    if (env.valued) out.push('g(x)');
                    if (env.maxWon) out.push('How it compares');
                    return out;
                },
                rows: (env) => CANDS.map((c) => {
                    const row = [{ v: () => dsp3(c.x) }, c.reason];
                    if (env.valued) row.push({ v: () => dsp3(gQ(c.x)) });
                    if (env.maxWon) row.push(compareCell(c, env));
                    return row;
                })
            },
            {
                kind: 'graph', title: 'y = g(x), where g(x) = |x| + 0.2x on [−2, 1]', height: 230,
                window: [-2.6, 1.6, -1.2, 2.4],
                vband: () => [{ from: -2, to: 1, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }],
                curves: [
                    { fn: 'g', from: -2, to: 0, samples: 200, color: 'curveA', label: (env) => env.listed ? 'left arm, slope −0.8' : '', labelAt: -1.7 },
                    { fn: 'g', from: 0, to: 1, samples: 200, color: 'curveA', label: (env) => env.listed ? 'right arm, slope 1.2' : '', labelAt: 0.85 }
                ],
                points: (env) => {
                    if (!env.listed) return [];
                    return [
                        /* point labels are kept short and left of the tick columns:
                           the x tick row sits at the bottom of this small graph, and
                           the board carries the full comparison wording */
                        { x: -2, y: gQ(-2), r: env.maxWon ? 6.5 : 5, color: env.maxWon ? 'accent' : 'ink', label: env.maxWon ? 'absolute maximum 1.6' : 'x = −2', labelDx: 6, labelDy: -14 },
                        { x: 0, y: 0, r: env.minWon ? 6.5 : 5, color: env.minWon ? 'aux' : 'accent', label: env.minWon ? 'absolute minimum 0' : 'corner at x = 0', labelDx: -140, labelDy: 36 },
                        { x: 1, y: gQ(1), r: 5, color: 'ink', label: 'x = 1', labelDx: -34, labelDy: 36 }
                    ];
                },
                /* no tangent at the corner, exactly the drawing choice 5.2 makes */
                tangents: () => []
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The function in this case',
                lines: (env) => {
                    const out = [
                        { t: 'g(x) = |x| + 0.2x on ' + IV, hl: true },
                        { t: 'Two straight arms that meet at x = 0.' }
                    ];
                    if (env.maxWon) out.push({ t: 'The candidate list is not the list of places where g′ = 0.', hl: true });
                    if (env.stage >= 5) out.push({ t: 'g′ = 0 or g′ does not exist, and both endpoints with them.' });
                    return out;
                }
            },
            {
                kind: 'readout', title: 'The derivative around the corner',
                when: (env) => env.listed,
                items: (env) => ([
                    { label: 'g′ left of 0', v: () => '−0.8' },
                    { label: 'g′ right of 0', v: () => '1.2' },
                    { label: 'g′(0)', v: () => 'does not exist', color: 'down' },
                    { label: 'g(0)', v: () => dsp3(gQ(0)) },
                    { label: 'Critical point', v: () => 'yes, g′ does not exist here', color: 'accent' },
                    { label: 'Absolute extremum here', v: () => env.minWon ? 'yes, the absolute minimum' : 'not decided yet', color: () => env.minWon ? 'aux' : 'ink' }
                ])
            },
            {
                kind: 'note', title: 'No tangent at the corner',
                when: (env) => env.listed,
                text: 'The left-hand slope is −0.8 and the right-hand slope is 1.2. Those two slopes are different, so there is no single derivative at x = 0, and this graph draws no tangent line there. That is why g′(0) is reported as does not exist instead of left blank.'
            },
            {
                kind: 'note', title: 'This corner against the smooth curve',
                when: (env) => env.minWon,
                text: 'On the smooth curve in the other tab, x = 0 is a critical point because f′(0) = 0, and it keeps its board row even though it holds no extremum at all. Here x = 0 is a critical point because g′ does not exist, and it holds the absolute minimum. One kind of row, two different halves of the definition.'
            },
            {
                kind: 'compare', title: 'Value against location',
                when: (env) => env.minWon,
                sides: [
                    { title: 'Absolute maximum', lines: ['Value 1.6', 'Location x = −2', 'Why it was on the board: left endpoint'] },
                    { title: 'Absolute minimum', lines: ['Value 0', 'Location x = 0', 'Why it was on the board: critical point, g′ does not exist'] }
                ],
                verdict: 'The value is the number and the location is the x-value, and a complete answer names both. The top value here belongs to an endpoint.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Which x-values deserve a place on the candidate list for the absolute extrema of g on ' + IV + '?',
                choices: [
                    'Only x = −2 and x = 1, since g has no derivative at any interior point of ' + IV + '.',
                    'x = −2, x = 0 and x = 1, since both endpoints belong and x = 0 is a critical point where g′ does not exist.',
                    'Only the interior points where g′ = 0, so this interval has no interior candidate to list.'
                ], a: 1,
                whyBy: [
                    'The arms do have derivatives at every point except the corner. g′ is −0.8 on the left arm and 1.2 on the right arm, so the interior is not derivative free, and the corner at x = 0 still belongs on the list.',
                    'A closed interval puts both endpoints on the list no matter what the derivative does there, and a critical point is a place where the derivative equals 0 or fails to exist. g is defined at x = 0, so that corner is a candidate.',
                    'That is the misconception this graph exists to break. Solving g′ = 0 here returns nothing at all, because the slopes are −0.8 and 1.2 and never 0, and a list built that way would leave out the corner that holds the lowest value.'
                ]
            },
            message: 'Three rows now sit on the Candidate board. The endpoints x = −2 and x = 1 are there because the interval is closed, and x = 0 is there because it is a critical point where g′ does not exist while g is defined there. That last clause is the whole point of this case, and the derivative never has to equal 0 to earn a place on the list.'
        },
        {
            params: { stage: 2 },
            message: 'The g(x) column now holds a number for every candidate. These three values are exact, so g(−2) = 1.6, g(0) = 0 and g(1) = 1.2 each keep the plain equals sign, no approximately marker. The Candidates Test compares these function values and nothing else, not the slopes of the two arms. Answer the question before the board labels the result.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Which candidate gives the absolute maximum value of g on ' + IV + '?',
                choices: [
                    'The left endpoint x = −2, since g(−2) = 1.6 is the largest of the three candidate values.',
                    'The corner x = 0, since g′ does not exist there, and a point where the derivative fails to exist is automatically an absolute extremum.',
                    'The right endpoint x = 1, since the right arm climbs all the way to it and the last point of a climb is the highest.'
                ], a: 0,
                whyBy: [
                    'Comparing the three values settles it, and 1.6 stands above 0 and 1.2. The candidate with the greatest function value here is an endpoint, so no derivative put it there, the closed interval did.',
                    'It is true that x = 0 is a candidate worth checking, because g is defined where g′ fails. But that only earns it a row on the board, it never decides which value is the largest, and only the comparison of values does that.',
                    'The right arm does rise all the way to g(1) = 1.2, but the left endpoint stands higher at 1.6. Rising at the end of the interval says nothing about which candidate value is the largest.'
                ]
            },
            message: 'The comparison column now names the candidate with the greatest function value, and it is an endpoint. The absolute maximum value is 1.6, and it occurs at x = −2. Two rows are still marked not decided yet, so the least value stays open.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Which candidate gives the absolute minimum value of g on ' + IV + '?',
                choices: [
                    'The left endpoint x = −2, since −2 is the smallest x-value on the board, so its value must be the least.',
                    'The right endpoint x = 1, since an endpoint always carries the least value on a closed interval.',
                    'The corner x = 0, since g(0) = 0 is below both endpoint values, 1.6 and 1.2.'
                ], a: 2,
                whyBy: [
                    'That mixes up the location with the value. The Candidates Test compares function values, and g(−2) = 1.6 is the greatest of the three, so the smallest x sits at the top of the comparison, not the bottom.',
                    'Endpoints belong on the board, but they do not automatically carry the least value. Here the absolute minimum sits at the interior corner x = 0, below both endpoints.',
                    'Comparing the three values settles it, and 0 stands below 1.6 and 1.2. The corner holds the minimum precisely because g is defined at the point where g′ does not exist.'
                ]
            },
            message: 'Now the other end of the board is named. The absolute minimum value is 0, and it occurs at x = 0, the corner where g′ does not exist. A list built by solving g′ = 0 would have held no interior point at all, and it would have missed the minimum sitting at that corner.'
        },
        {
            params: { stage: 5 },
            message: 'Carry both halves of the definition into every Candidates Test problem. Critical numbers are the places where the derivative equals 0 together with the places where it does not exist, provided the function is defined there, and the endpoints join the list regardless of what the derivative does. Once the list is complete, only the function values decide.'
        }
    ],
    summary: SUMMARY
};

export default dneMode;
