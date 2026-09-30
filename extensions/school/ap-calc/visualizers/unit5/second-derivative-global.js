/* 5.7 Using the Second Derivative Test to Determine Extrema.
   Mode 3, the official one-critical-point clause. Topic 5.5 made the student
   build a candidate list and compare the values on it. This mode does the
   opposite job: one short chain of conditions about the COUNT of critical
   points, and that chain alone delivers an absolute minimum, with no candidate
   list and no value comparison anywhere in it.

   The chain is the hero, so it gets its own figure (a tree pane whose three
   boxes are the conditions and whose fourth box is what they buy together) and
   the graph stays supporting evidence. The three conditions each get their own
   screen in order, and the Second Derivative Test screen is written so that
   g′(−1) = 0 is on the screen before the sign of g″ is used, exactly as the
   topic rule requires.

   The scope line is explicit and it is one sentence: the clause says nothing
   about the absolute maximum, and on this interval the maximum sits at an
   endpoint, where g(3) = 20 is greater than g(−4) = 13. Two endpoint values and
   one comparison is all of that, and no candidate board is rebuilt. (The build
   contract prints that comparison as g(−4) = 13 > g(3) = 20 while still placing
   the maximum at x = 3. The values 13 and 20 and the location x = 3 are the
   verified ones, so the sentence here keeps them and states the comparison in
   the direction the numbers actually run.)

   Reveal discipline is the one the whole unit uses: a single monotone
   params.stage set in the same step object as the question whose answer it
   shows, Next never gated on an answer, and every finished teaching card exits
   on a ceiling gate so the side column never piles up.

   g(x) = x² + 2x + 5 on [−4, 3], with g′(x) = 2x + 2 and g″(x) = 2. The values
   are the ones the build contract verifies: g(−1) = 4, g(−4) = 13, g(3) = 20. */

/* ---------- the clause example -------------------------------------------- */

const A = -4, B = 3;                        /* the closed interval [−4, 3] */
const gQ = (x) => x * x + 2 * x + 5;        /* g(x) = x² + 2x + 5 */
const C = -1;                               /* the one critical number, inside (A, B) */
const IV = '[−4, 3]';
const G_C = gQ(C);                          /* 4, the absolute minimum value */
const G_A = gQ(A);                          /* 13 */
const G_B = gQ(B);                          /* 20, the absolute maximum value */

/* Rounds to 2 dp, trims the zeros, and writes the ASCII minus as the real one. */
function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* Both drawings share one horizontal scale. The numberline pane insets 20px on
   each side and the graph pane has no inset, so the chart window is the picture
   window widened by 1/26 of the span on each end of the chart window, which
   puts x = −1 on the same pixel in both layers. */
const NWIN = [-4.5, 3.5];
const NSPAN = NWIN[1] - NWIN[0];
const WINX = [NWIN[0] - NSPAN / 26, NWIN[1] + NSPAN / 26];

/* The two signs of g′, which is where the count of critical points comes from:
   one zero, and the sign changes there once and only once. The two bands stop at
   the ends of the closed interval, so nothing overhangs [−4, 3]. */
const SIDE = [
    { from: A, to: C, signText: 'g′ < 0', color: 'down' },
    { from: C, to: B, signText: 'g′ > 0', color: 'up' }
];

export const globalMode = {
    label: 'One critical point on an interval',
    intro: 'Topic 5.5 decided an absolute extremum by listing candidates and comparing their values. Topic 5.7 carries a second route, and it is the only one in this topic that ends in a conclusion about an absolute extremum. The whole input is a count. On ' + IV + ' the function g(x) = x² + 2x + 5 has exactly one critical point, and that point turns out to be a local minimum. This mode puts the three conditions of that argument on the screen as their own chain, one condition at a time, and then it states out loud which half of the answer the chain does not decide. Nothing is settled yet.',
    params: { stage: 0 },
    controls: [],
    fns: { g: (x) => gQ(x) },
    compute: (env) => ({
        found: env.stage >= 1,
        local: env.stage >= 2,
        absMin: env.stage >= 3,
        absMax: env.stage >= 5
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = g(x) = x² + 2x + 5 on ' + IV, height: 300,
                window: [...WINX, 1.5, 22.5],
                vband: () => [{
                    from: A, to: B,
                    color: 'color-mix(in srgb, var(--text-secondary) 10%, transparent)'
                }],
                curves: [{ fn: 'g', from: A, to: B, samples: 600, color: 'curveA' }],
                /* The two guides carry the interval ends from the first screen.
                   The third guide is the critical point, and it loses its own
                   label as soon as the point below it is named, so the picture
                   never carries the same x-value twice. */
                vlines: (env) => {
                    const out = [
                        { x: A, color: 'auxInk', label: 'x = −4' },
                        { x: B, color: 'auxInk', label: 'x = 3' }
                    ];
                    if (env.found) out.push({ x: C, color: 'accent', label: env.absMin ? '' : 'x = ' + dsp(C) });
                    return out;
                },
                hlines: (env) => {
                    /* One line only, and it is the one the clause produced. The
                       maximum is a single endpoint value rather than a level the
                       whole interval is measured against, so it stays on its dot
                       and in the readout. A label near y = 0 would sit on the x
                       tick row, and y = 4 is clear of it. */
                    return env.absMin
                        ? [{ y: G_C, color: 'aux', label: 'absolute minimum value ' + dsp(G_C) }]
                        : [];
                },
                points: (env) => {
                    const out = [];
                    if (env.found) {
                        out.push({
                            x: C, y: G_C, r: env.local ? 6.5 : 4.5,
                            color: env.local ? 'aux' : 'auxInk',
                            label: env.absMin ? 'x = ' + dsp(C) : (env.local ? 'local minimum' : 'g′ = 0 here'),
                            labelDx: 10, labelDy: 18
                        });
                    }
                    /* The endpoints arrive with the maximum question only, and
                       they arrive as two values in one sentence rather than as a
                       candidate list. */
                    if (env.absMax) {
                        out.push({ x: A, y: G_A, r: 5, color: 'auxInk', label: 'g(−4) = ' + dsp(G_A), labelDx: 8, labelDy: -10 });
                        out.push({ x: B, y: G_B, r: 6.5, color: 'accent', label: 'g(3) = ' + dsp(G_B), labelDx: -84, labelDy: -12 });
                    }
                    return out;
                }
            },
            {
                kind: 'numberline', title: 'Sign chart for g′(x) = 2x + 2 on ' + IV, width: 560,
                when: (env) => env.found && env.stage < 5,
                window: NWIN, step: 1,
                bands: () => SIDE.map(s => ({ from: s.from, to: s.to, color: s.color, label: s.signText })),
                probes: () => [{ x: C, color: 'accent' }]
            },
            {
                kind: 'tree', title: env => (env.stage >= 4
                    ? 'The clause as one figure, and the absolute maximum is not among its boxes'
                    : 'The clause as one figure, read from the top box down'),
                when: (env) => env.stage >= 3,
                focus: env => (env.stage === 3 || env.stage === 6 ? 'concl' : null),
                root: (env) => ({
                    id: 'hyp', e: 'three conditions on ' + IV,
                    rule: 'each one was checked on its own screen',
                    children: [
                        { id: 'cont', e: 'g continuous on ' + IV, rule: 'condition 1', v: () => 'holds' },
                        { id: 'one', e: 'one critical point inside', rule: 'condition 2', v: () => 'x = ' + dsp(C) },
                        {
                            id: 'loc', e: 'that point is a local minimum', rule: 'condition 3',
                            v: () => 'g″ = 2 > 0',
                            children: [{
                                id: 'concl', e: 'it is the absolute minimum', rule: 'the clause',
                                v: () => 'x = ' + dsp(C) + ', value ' + dsp(G_C)
                            }]
                        }
                    ]
                })
            }
        ],
        side: [
            {
                kind: 'eq', title: 'g, its derivatives and the interval',
                lines: (env) => {
                    const out = [
                        { t: 'g(x) = x² + 2x + 5' },
                        { t: 'g′(x) = 2x + 2', hl: true },
                        { t: 'g″(x) = 2' },
                        { t: 'The interval is the closed interval ' + IV + ', so a = −4 and b = 3.' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'Condition 1 is a fact about the kind of function this is. g is a polynomial, so g is continuous for every x, and that includes all of ' + IV + '.' });
                    if (env.stage >= 3) out.push({ t: 'Conditions 2 and 3 came from the two screens just before this one: the only critical point of g in (−4, 3) is x = ' + dsp(C) + ', and that point is a local minimum with value ' + dsp(G_C) + '.' });
                    if (env.stage >= 8) out.push({ t: 'This clause is the one place in topic 5.7 whose conclusion is about an absolute extremum, and it decides only one side of that question.', hl: true });
                    return out;
                }
            },
            {
                kind: 'eq', title: 'Condition 2, the count of critical points',
                when: (env) => env.stage >= 1 && env.stage < 3,
                lines: [
                    { t: 'A critical point of g is an interior x-value where g′ = 0 or g′ does not exist.' },
                    { t: 'g′(x) = 2x + 2 is a polynomial, so it exists everywhere, and only the zero of g′ matters here.' },
                    { t: '2x + 2 = 0  gives  x = −1', hl: true },
                    { t: 'The number −1 lies inside (−4, 3), so x = −1 is the one critical point of g on this interval.' },
                    { t: 'The endpoints x = −4 and x = 3 are not critical points. They are the places where the interval stops, and the sign chart shows one boundary only.' }
                ]
            },
            {
                kind: 'eq', title: 'Condition 3, the local type of that point',
                when: (env) => env.stage >= 2 && env.stage < 3,
                lines: [
                    { t: 'Step one is the precondition of the Second Derivative Test.', hl: true },
                    { t: 'g′(−1) = 2(−1) + 2 = 0', hl: true },
                    { t: 'Only now is the sign of g″ used.' },
                    { t: 'g″(x) = 2 for every x, so g″(−1) = 2 > 0', hl: true },
                    { t: 'A positive second derivative at a critical point means concave up there, so g has a local minimum at x = −1.' },
                    { t: 'g(−1) = (−1)² + 2(−1) + 5 = ' + dsp(G_C) }
                ]
            },
            {
                kind: 'readout', title: 'What the clause settles on ' + IV,
                when: (env) => env.stage >= 3,
                items: (env) => [
                    {
                        label: 'local minimum at the one critical point',
                        v: () => 'x = ' + dsp(C) + ', value ' + dsp(G_C), color: 'aux'
                    },
                    {
                        label: 'absolute minimum on ' + IV,
                        v: () => env.absMin ? 'x = ' + dsp(C) + ', value ' + dsp(G_C) : 'not concluded yet',
                        color: env.absMin ? 'aux' : 'auxInk'
                    },
                    {
                        label: 'absolute maximum on ' + IV,
                        v: () => env.stage < 4 ? 'not asked yet' : (env.absMax ? 'x = ' + dsp(B) + ', value ' + dsp(G_B) : 'the clause does not decide it'),
                        color: env.absMax ? 'accent' : 'auxInk'
                    },
                    {
                        label: 'candidate values compared to get here',
                        v: () => env.absMin ? 'none' : 'none yet'
                    }
                ]
            },
            {
                kind: 'note', title: 'What the clause does not decide', tone: 'warn',
                when: (env) => env.stage >= 4 && env.stage < 5,
                text: 'The clause names the extremum at the single critical point and nothing else, so it says nothing about the absolute maximum on ' + IV + ', and that maximum has to be located among the endpoints, where g(3) = 20 is greater than g(−4) = 13. One critical point never settles both absolute extrema at once.'
            },
            {
                kind: 'note', title: 'Why the chain is enough for the minimum',
                when: (env) => env.stage >= 6 && env.stage < 7,
                text: 'g″(x) = 2 is positive for every x, so g is concave up on the whole interval and the curve has one valley bottom rather than several turns. g falls into x = −1 and climbs out of it, which is what the two bands of the sign chart showed, so every other value on ' + IV + ' sits above g(−1) = ' + dsp(G_C) + '. That is the shape the clause is written for, and it is also why the highest value on the interval had to be at one of the two ends.'
            },
            {
                kind: 'eq', title: 'How to write the conclusion',
                when: (env) => env.stage >= 7 && env.stage < 8,
                lines: [
                    { t: 'g is continuous on ' + IV + ' and has exactly one critical point there, x = −1.', hl: true },
                    { t: 'g′(−1) = 0 and g″(−1) = 2 > 0, so x = −1 is a local minimum.', hl: true },
                    { t: 'Therefore g has the absolute minimum value ' + dsp(G_C) + ' at x = −1 on ' + IV + '.', hl: true, color: 'aux' },
                    { t: 'The three conditions are stated before the word therefore, and the value is reported with the location it occurs at.' },
                    { t: 'A separate sentence is still needed for the absolute maximum, and it points at an endpoint rather than at a critical point.' }
                ]
            },
            {
                kind: 'compare', title: 'This clause and the topic 5.5 procedure',
                when: (env) => env.stage >= 8,
                sides: () => [
                    {
                        title: 'The one-critical-point clause',
                        lines: [
                            'Input: continuity, the count of critical points, and the local type of that one point.',
                            'Output: one absolute extremum, of the same kind as the local one.',
                            'Silence: the other absolute extremum, which is usually at an endpoint.'
                        ]
                    },
                    {
                        title: 'The Candidates Test of topic 5.5',
                        lines: [
                            'Input: a list of every endpoint and every interior critical point.',
                            'Output: both absolute extrema, from one comparison of the values on that list.',
                            'Cost: evaluate g at every candidate first.'
                        ]
                    }
                ],
                verdict: 'The clause is a shortcut for one side of the answer when the count of critical points is one, and the value comparison is the tool that still has to name the maximum. Neither one replaces the other.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'For g(x) = x² + 2x + 5 on ' + IV + ', how many critical points does g have inside the interval, and which one is it?',
                choices: [
                    'Exactly one, x = −1, because a critical point needs g′(x) = 2x + 2 to equal zero, and that equation has the single solution x = −1.',
                    'Three, x = −4, x = −1 and x = 3, because the interior point where g′ = 0 and both endpoints of the interval are all critical points.',
                    'None, because g′(x) = 2x + 2 is a polynomial, and a derivative that is a polynomial never has a critical point where it is defined.'
                ], a: 0,
                whyBy: [
                    'The zero of g′ is x = −1, and −4 < −1 < 3 puts it inside the open interval, so the count the clause needs is exactly one. The guide on the graph and the single boundary on the sign chart both sit on that number.',
                    'The count keeps x = −1 but adds the ends of the interval. A critical point is an interior x-value where g′ = 0 or g′ fails to exist, and x = −4 and x = 3 are endpoints of ' + IV + ' rather than critical points.',
                    'Being a polynomial is what makes g′ exist at every x, so the only source of critical points is g′ = 0. That one equation gives x = −1, which is inside the interval.'
                ]
            },
            message: 'The one critical point is on the screen twice over, as the middle guide on the graph of g and as the only boundary on the sign chart for g′(x) = 2x + 2. The g′ < 0 band covers (−4, −1) and the g′ > 0 band covers (−1, 3), so this interval holds no room for a second boundary. Condition 1 was already true of the function itself, since a polynomial is continuous on all of ' + IV + ', and condition 2 is now on the table as well. The next question is what kind of point x = −1 is.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'g′(−1) = 0 has been established, and g″(x) = 2 for every x. What does the Second Derivative Test give at x = −1?',
                choices: [
                    'A local minimum, because g′(−1) = 0 and g″(−1) = 2 is positive, so g is concave up at that critical point.',
                    'A local maximum, because g″(−1) = 2 is positive, and a positive second derivative means the curve is at the top of a peak.',
                    'Nothing, because the Second Derivative Test is inconclusive whenever g″ is a nonzero constant.'
                ], a: 0,
                whyBy: [
                    'The precondition came first, so the sign of g″ is allowed to be read. Positive g″ means concave up, and a critical point at the bottom of a concave up curve is a local minimum, here with value g(−1) = ' + dsp(G_C) + '.',
                    'The sign is read the wrong way. Concave up is a valley rather than a peak, so a positive second derivative at a critical point gives a local minimum. A local maximum would need g″(−1) < 0.',
                    'Inconclusive is the name for the case g″(−1) = 0, and 2 is not zero. The test applies here, and it returns a local minimum.'
                ]
            },
            message: 'Condition 3 is in place, and it came through the Second Derivative Test in the only order that test allows, with g′(−1) = 0 first and then g″(−1) = 2 > 0 and only then the words local minimum. The dot on the graph has taken the color this unit uses for a minimum, and its value is g(−1) = ' + dsp(G_C) + '. Three conditions are on the screen now, and the next question is what they buy together.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'g has exactly one critical point in ' + IV + ' and that point is a local minimum. Must the endpoints still be checked for the absolute minimum, and must they be checked for the absolute maximum?',
                choices: [
                    'No for the minimum, because the one-critical-point conclusion already makes x = −1 the absolute minimum on ' + IV + ', and yes for the maximum, because that conclusion says nothing about it.',
                    'Yes for both, because an absolute extremum on a closed interval can only be settled by evaluating g at every endpoint and every critical point and comparing the results.',
                    'No for both, because the single critical point settles the whole question of absolute extrema on the interval.'
                ], a: 0,
                whyBy: [
                    'The clause carries one local verdict across to the absolute side, so the minimum needs no endpoint arithmetic at all. Its statement stops there, and the absolute maximum is still open.',
                    'That is the topic 5.5 procedure. It would reach the same minimum, and it is still the tool for the maximum, but the minimum does not need it once the three conditions hold, so this answer is right about the method and wrong about the need.',
                    'That is the misreading the clause invites. The conclusion inherits the kind of the local verdict, so one critical point gives one absolute extremum and leaves the other one undecided.'
                ]
            },
            message: 'The clause is now one figure, and it is not a second copy of the candidates work. Read from the top box down: three conditions that were each checked on their own screen, and the box below them is what they give together, namely the absolute minimum value ' + dsp(G_C) + ' at x = −1. No endpoint value was computed to reach that box, and no candidate list was built. The horizontal line at ' + dsp(G_C) + ' touches the curve at that one point and stays under every other point of it on ' + IV + ', which is the picture of the same claim.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'The clause has been applied. What does it say about the absolute maximum of g on ' + IV + '?',
                choices: [
                    'Nothing. The clause names only the extremum at the single critical point, so the absolute maximum still has to be located among the endpoints of the interval.',
                    'That the absolute maximum is also at x = −1, since x = −1 is the only critical point and an extremum has to occur somewhere.',
                    'That no absolute maximum exists on ' + IV + ', since one concave up curve cannot have both an absolute minimum and an absolute maximum.'
                ], a: 0,
                whyBy: [
                    'Silence is part of the statement of the clause. The maximum is a real value on this closed interval, and it is the endpoint values rather than the count of critical points that identify it.',
                    'x = −1 is the low point of the curve, and the clause only ever carried the local minimum across to the absolute side. The value ' + dsp(G_C) + ' is the absolute minimum and never a maximum.',
                    'Both absolute extrema do exist here, because g is continuous on a closed interval. The clause settles one of them, and a comparison settles the other.'
                ]
            },
            message: 'This is the boundary line of the mode, and it is the misreading the clause invites. Nothing on the screen so far decides the absolute maximum on ' + IV + '. Continuity on a closed interval guarantees that such a value exists, and the count of critical points is not what names it, so the readout keeps that row open instead of filling it with the only number already on the table.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'So where is the absolute maximum of g on ' + IV + '?',
                choices: [
                    'At the right endpoint x = 3, since g(3) = ' + dsp(G_B) + ' is greater than g(−4) = ' + dsp(G_A) + ', and an absolute maximum on a closed interval can sit where the interval stops.',
                    'At the left endpoint x = −4, since g is falling as it reaches that end, and a falling curve holds the larger value.',
                    'At x = −1, since the absolute maximum and the absolute minimum of a concave up curve occur at its single critical point.'
                ], a: 0,
                whyBy: [
                    'Two endpoint values and one comparison is the whole argument, and it is not a candidate board. g(3) = ' + dsp(G_B) + ' beats g(−4) = ' + dsp(G_A) + ', and no interior point outruns the higher end.',
                    'The left endpoint does belong in the comparison and it loses, since g(−4) = ' + dsp(G_A) + ' is below g(3) = ' + dsp(G_B) + '. Steepness is not a ranking of values.',
                    'One point cannot hold both titles while ' + dsp(G_C) + ' is below ' + dsp(G_B) + '. x = −1 holds the absolute minimum, which is exactly what the clause gave.'
                ]
            },
            message: 'One sentence, and it is all of the endpoint work this mode needs. The absolute maximum on ' + IV + ' is ' + dsp(G_B) + ', taken at the endpoint x = ' + dsp(B) + ', since g(3) = ' + dsp(G_B) + ' is greater than g(−4) = ' + dsp(G_A) + '. Both dots are on the graph now and only one of them is a critical point. The chain reached the minimum without touching either endpoint, and the maximum came from the ends of the interval, which is why the clause is stated with its silence attached.'
        },
        {
            params: { stage: 6 },
            message: 'Why the chain is enough is the geometric reason behind the clause, and it is worth one screen. g″(x) = 2 is positive at every x, so g is concave up on the whole interval and the curve has one valley bottom rather than several turns. It falls into x = −1 and climbs out of it, so every other value on ' + IV + ' sits above g(−1) = ' + dsp(G_C) + '. The same shape is also why the highest value on the interval had to be at one of the two ends.'
        },
        {
            params: { stage: 7 },
            message: 'How to write the conclusion is the AP shape of the argument, and it keeps the two tools apart in prose. Each of the three conditions gets its own sentence, the word therefore comes after all of them, and the answer names the value ' + dsp(G_C) + ' and the location x = −1 as two different things. The last line is the part students drop, because a second sentence is still owed for the absolute maximum and it points at an endpoint rather than at a critical point.'
        },
        {
            params: { stage: 8 },
            message: 'The last card keeps the two procedures apart, because they blend easily into one recipe. The clause reads a count of critical points and returns one absolute extremum, and the Candidates Test of topic 5.5 reads a list of values and returns both. On this problem the clause gave the minimum out of three conditions, where topic 5.5 would have evaluated g at every candidate first, so the clause is a shortcut in this one case rather than a better method. The summary screen holds the statement of the rule and the two traps.'
        }
    ],
    summary: {
        idea: 'If g is continuous on a closed interval, has exactly one critical point inside that interval, and that critical point is a local minimum, then it is also the absolute minimum value of g on the interval. The same reasoning with a local maximum in place of a local minimum gives the absolute maximum instead. On ' + IV + ' the function g(x) = x² + 2x + 5 has g′(x) = 2x + 2, so x = −1 is its only critical point, and g″ = 2 > 0 makes that point a local minimum, so g(−1) = ' + dsp(G_C) + ' is the absolute minimum value.',
        mistake: 'Do not let one critical point settle both absolute extrema. The clause decides the single kind it was handed, and on ' + IV + ' the absolute maximum stayed at an endpoint, where g(3) = ' + dsp(G_B) + ' is greater than g(−4) = ' + dsp(G_A) + '. The clause is also unavailable when the interval holds more than one critical point or when continuity fails, and its condition 3 never states the sign of g″ before g′(−1) = 0 has been established.',
        transfer: 'A function h is continuous on [0, 6], has exactly one critical point there at x = 2, and h″(2) = 6 > 0 with h(2) = −5. What does the one-critical-point clause give about h on [0, 6], what does it leave open, and what extra information would close that second question?'
    }
};

export default globalMode;
