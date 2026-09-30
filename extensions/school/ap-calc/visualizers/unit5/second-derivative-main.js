/* 5.7 Using the Second Derivative Test to Determine Extrema.
   Mode 1, "Classify a critical point". The hero is a Critical Point Microscope:
   one critical point at a time, a zoomed piece of f around it with its tangent,
   and the three-line argument written next to that picture.

   f(x) = x⁴ − 2x², so f′(x) = 4x(x² − 1) with critical numbers −1, 0 and 1,
   and f″(x) = 12x² − 4. The three readings are f″(−1) = 8, f″(0) = −4 and
   f″(1) = 8, which give local min, local max, local min. Every number here is
   an exact integer, so no reading needs a rounded form.

   Deliberately absent: a sign chart for f′ or for f″. Topic 5.4 already reads
   f′ across intervals, and re-running it here would turn this lesson into a
   second copy of that one. The Second Derivative Test is a point test, so the
   only evidence on screen is f′(c), f″(c) and the shape of f right at c.

   Order discipline, the red line this mode is built around: the precondition
   f′(c) = 0 is established on screen one stage before the sign of f″(c) is
   used, and a short gate question about x = 2, where f′(2) = 24, comes before
   the flow so no student leaves with "f″ > 0 means minimum". The rule card at
   the end keeps the two conditions in that same order.

   Reveal discipline, same as the other Unit 5 modes: one monotone params.stage,
   and a reveal lives in the step object whose Predict it answers. On screen i
   the narration is steps[i-1].message and the question is steps[i].predict, so
   a stage set in step j first paints on screen j+1. Nothing is gated on an
   answer, so Next always works. Cards retire on a stage ceiling once their
   screen is over instead of stacking under the microscope. */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

const UPFILL = 'color-mix(in srgb, #2FB86A 9%, transparent)';
const DOWNFILL = 'color-mix(in srgb, #FF3B30 9%, transparent)';
const ZOOMFILL = 'color-mix(in srgb, var(--text-secondary) 12%, transparent)';

/* f and its two derivatives, as numbers on the page rather than as a picture
   of a formula. */
const FQ = (x) => Math.pow(x, 4) - 2 * Math.pow(x, 2);
const DQ = (x) => 4 * x * (x * x - 1);
const DDQ = (x) => 12 * x * x - 4;

/* The three critical points, in left to right order, each with the window the
   microscope uses for it. l2 is the stage at which that point's second line
   (the value of f″) appears, and l3 the stage at which its conclusion appears,
   so the precondition is always on screen before the curvature is used. The
   readings themselves come from f′ and f″ below, so a printed number cannot
   drift from the curve it describes. */
const PTS = [
    {
        x: -1, name: 'x = −1',
        shape: 'concave up', color: 'up', verdict: 'a local minimum', short: 'local minimum', tone: 'aux',
        l2: 8, l3: 9, zoom: [-1.45, -0.55, -1.2, 0.3]
    },
    {
        x: 0, name: 'x = 0',
        shape: 'concave down', color: 'down', verdict: 'a local maximum', short: 'local maximum', tone: 'accent',
        l2: 3, l3: 4, zoom: [-0.55, 0.55, -0.6, 0.28]
    },
    {
        x: 1, name: 'x = 1',
        shape: 'concave up', color: 'up', verdict: 'a local minimum', short: 'local minimum', tone: 'aux',
        l2: 6, l3: 7, zoom: [0.55, 1.45, -1.2, 0.3]
    }
];

PTS.forEach((p) => {
    p.fp = DQ(p.x);
    p.fpp = DDQ(p.x);
    p.fx = FQ(p.x);
    p.up = p.fpp > 0;
    p.concl = p.verdict + ' at ' + p.name;
});

/* x = 2 is not a critical point. It is the gate case: concave up there, with a
   slope of 24, so the test never gets to start. */
const GATE = {
    x: 2, name: 'x = 2',
    shape: 'concave up', color: 'up', verdict: 'no conclusion', short: 'no conclusion', tone: 'auxInk',
    concl: 'the Second Derivative Test says nothing about x = 2'
};
GATE.fp = DQ(GATE.x);
GATE.fpp = DDQ(GATE.x);
GATE.fx = FQ(GATE.x);
GATE.up = GATE.fpp > 0;

const byX = (x) => PTS.find(p => p.x === x);

/* The three-line argument as data, so the point under the microscope and the
   gate case at x = 2 are drawn by the same code in the same order. */
const frameLines = (p, stage, isPoint) => {
    const flat = p.fp === 0;
    const out = [];
    out.push({
        t: '1. f′(' + dsp(p.x) + ') = ' + dsp(p.fp) + (flat ? '' : ', which is not 0'),
        hl: flat
    });
    out.push({
        t: flat
            ? '→ ' + p.name + ' is a critical point, so the test can be used'
            : '→ ' + p.name + ' is not a critical point, so the test cannot be used',
        color: flat ? 'accent' : 'auxInk'
    });
    const useCurvature = !isPoint || stage >= p.l2;
    if (!useCurvature) {
        out.push({ t: '2. the sign of f″(' + dsp(p.x) + ') is not used yet', dim: true });
    } else {
        out.push({ t: '2. f″(' + dsp(p.x) + ') = ' + dsp(p.fpp) + (p.up ? ' > 0' : ' < 0'), hl: true });
        out.push({ t: '→ the graph is ' + p.shape + ' at ' + p.name, color: p.color });
    }
    const revealed = !isPoint || stage >= p.l3;
    if (!revealed) {
        out.push({ t: '3. conclusion not written yet', dim: true });
    } else {
        out.push({ t: '3. ' + p.concl, hl: true, color: p.tone });
    }
    return out;
};

export const secondDerivativeMainMode = {
    label: 'Classify a critical point',
    intro: 'One curve, three critical points, and a microscope that looks at only one of them at a time. The curve is f(x) = x⁴ − 2x², a polynomial, so it is smooth everywhere and its derivative exists at every x. Its derivative f′(x) = 4x(x² − 1) equals 0 at x = −1, at x = 0 and at x = 1, and those are the only critical points it has. Topic 5.4 classified them by reading f′ on both sides of each one. Topic 5.7 asks for a shortcut that reads only the point itself: what does the sign of f″ at a critical point say about the shape there? Nothing is concluded yet, and the first question is about what the shortcut is allowed to assume.',
    params: { stage: 0, focus: 0 },
    controls: [
        {
            key: 'focus', kind: 'choice', label: 'Critical point under the microscope',
            /* The selector belongs to the last inspection, where the student runs
               the pattern without being walked through it. The two earlier
               inspections preset the point as part of their step, so the taught
               order never depends on where the selector happens to sit. */
            when: (env) => env.stage >= 8,
            options: [
                { v: -1, label: 'x = −1' },
                { v: 0, label: 'x = 0' },
                { v: 1, label: 'x = 1' }
            ]
        }
    ],
    fns: { f: (x) => FQ(x) },
    compute: (env) => ({
        stage: env.stage,
        gp: env.stage === 1 ? GATE : null,
        p: env.stage >= 2 ? byX(env.focus) : null,
        ready: env.stage >= 2,
        allRevealed: env.stage >= 9
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'The curve, and the three places where f′ = 0',
                height: 260, width: 560, window: [-1.6, 1.6, -1.6, 1.3], gridX: 1, gridY: 1,
                /* f(±1.55) ≈ 0.97, so the curve is drawn only where it stays inside
                   the window instead of running off the top edge. */
                curves: [{ fn: 'f', from: -1.55, to: 1.55, samples: 600, color: 'curveA' }],
                /* Before a point's conclusion, its label is only its location. Once
                   the microscope has decided it, the label becomes the conclusion
                   word, so the overview reads as the three finished arguments. */
                points: (env) => PTS.map(p => ({
                    x: p.x, y: p.fx, r: 5.5,
                    color: env.stage >= p.l3 ? p.tone : 'accent',
                    label: env.stage >= p.l3 ? p.short : p.name,
                    /* a valley leaves the space under the point empty, a peak leaves
                       the space above it empty, so each label goes to its own side */
                    labelDy: p.up ? 20 : -12
                })),
                /* the shaded strip is the piece the microscope is holding, which is
                   the only link the two pictures need */
                vband: (env) => env.stage >= 2
                    ? [{ from: env.p.zoom[0], to: env.p.zoom[1], color: ZOOMFILL }]
                    : [],
                vlines: (env) => env.stage >= 2
                    ? [{ x: env.p.x, color: 'ink', label: 'under the microscope' }]
                    : []
            },
            {
                /* The gate case, on screen for one stage only. It is concave up, and
                   it is still not a candidate for the test, because the tangent is
                   nowhere near horizontal there. */
                kind: 'graph', title: 'Concave up here, and no critical point at all',
                when: (env) => env.stage === 1,
                height: 250, width: 560, window: [1.72, 2.28, 2.4, 16], gridX: 0.25, gridY: 4, ticks: false,
                curves: [{ fn: 'f', from: 1.75, to: 2.25, samples: 400, color: 'curveA' }],
                hband: () => [{ from: GATE.fx, to: 16, color: UPFILL, label: 'concave up', labelColor: 'up' }],
                tangents: () => [{ x: 2, fn: 'f', m: GATE.fp, color: 'accent', label: 'f′(2) = 24, the tangent is not horizontal' }],
                points: () => [{ x: 2, y: GATE.fx, r: 6.5, color: 'auxInk', label: 'x = 2, not a critical point', labelDy: 18 }]
            },
            {
                kind: 'graph', title: (env) => 'Microscope on ' + env.p.name + ', one piece of f',
                when: (env) => env.stage >= 2,
                height: 250, width: 560, window: (env) => env.p.zoom, gridX: 0.5, gridY: 0.5,
                curves: (env) => [{ fn: 'f', from: env.p.zoom[0], to: env.p.zoom[1], samples: 400, color: 'curveA' }],
                /* The shaded half-window is the shape the sign of f″(c) claims, and it
                   appears only after the precondition line has been on screen. */
                hband: (env) => env.stage >= env.p.l2
                    ? (env.p.up
                        ? [{ from: env.p.fx, to: env.p.zoom[3], color: UPFILL, label: 'concave up', labelColor: 'up' }]
                        : [{ from: env.p.zoom[2], to: env.p.fx, color: DOWNFILL, label: 'concave down', labelColor: 'down' }])
                    : [],
                tangents: (env) => [{
                    x: env.p.x, fn: 'f', m: 0, color: 'accent',
                    label: (env) => 'f′(' + dsp(env.p.x) + ') = 0, horizontal tangent'
                }],
                points: (env) => [{
                    x: env.p.x, y: env.p.fx, r: 6.5,
                    color: env.stage >= env.p.l3 ? env.p.tone : 'ink',
                    label: (env) => env.stage >= env.p.l3 ? env.p.short : '',
                    labelDy: env.p.up ? 20 : -16
                }]
            },
            {
                kind: 'table', title: 'Three points, three readings',
                when: (env) => env.stage >= 9,
                cols: ['Critical point', 'f′(c), checked first', 'f″(c)', 'Shape at c', 'Conclusion'],
                rows: () => PTS.map(p => [
                    { v: () => p.name, bold: true },
                    { v: () => 'f′(' + dsp(p.x) + ') = 0' },
                    { v: () => dsp(p.fpp), color: p.color, bold: true },
                    { v: () => p.shape, color: p.color },
                    { v: () => p.short, color: p.tone, bold: true }
                ]),
                note: 'Every row starts at the precondition. The f″ column is read at the point itself, and no column here reads an interval.'
            }
        ],
        side: [
            {
                kind: 'eq', title: 'What topic 5.6 already settled',
                when: (env) => env.stage < 2,
                lines: [
                    { t: 'f″ > 0 on an interval   →   concave up', color: 'up' },
                    { t: 'f″ < 0 on an interval   →   concave down', color: 'down' },
                    { t: 'That reading is the whole equipment for now.' },
                    { t: 'Nothing here says maximum or minimum yet.', hl: true }
                ]
            },
            {
                kind: 'compare', title: 'The gate, before any classification',
                when: (env) => env.stage === 1,
                sides: () => [
                    {
                        title: 'What f″ says at x = 2',
                        lines: [
                            'f″(2) = 44, which is positive.',
                            'The graph is concave up at x = 2.'
                        ]
                    },
                    {
                        title: 'What f′ says at x = 2',
                        lines: [
                            'f′(2) = 24, which is not 0.',
                            'The tangent there is not horizontal.',
                            'x = 2 is not a critical point.'
                        ]
                    }
                ],
                verdict: 'A concave up place with no flat tangent gives no extremum claim, so the Second Derivative Test is never run there.'
            },
            {
                kind: 'eq', title: 'The three lines, in this order',
                when: (env) => env.stage >= 1,
                lines: (env) => frameLines(env.gp ? GATE : env.p, env.stage, !env.gp)
            },
            {
                kind: 'readout', title: 'Microscope readings',
                when: (env) => env.stage >= 2 && env.stage < 9,
                items: (env) => {
                    const p = env.p;
                    const seen = env.stage >= p.l2;
                    const done = env.stage >= p.l3;
                    return [
                        { label: 'point', v: () => p.name, color: 'accent' },
                        { label: 'f(c)', v: () => dsp(FQ(p.x)) },
                        { label: 'f′(c) is 0', v: () => (p.fp === 0 ? 'yes' : 'no'), color: p.fp === 0 ? 'accent' : 'auxInk' },
                        { label: 'f″(c)', v: () => (seen ? dsp(p.fpp) : 'not used yet'), color: seen ? p.color : 'auxInk' },
                        { label: 'shape at c', v: () => (seen ? p.shape : 'not read yet'), color: seen ? p.color : 'auxInk' },
                        { label: 'conclusion', v: () => (done ? p.short : 'open question'), color: done ? p.tone : 'auxInk' }
                    ];
                }
            },
            {
                kind: 'machine', title: 'What a classification is built from',
                /* this card only names the parts of the argument while the
                   microscope is still working through them */
                when: (env) => env.stage >= 4 && env.stage < 9,
                focus: 2,
                stages: [
                    { box: 'f′(c) = 0, so c is a critical point' },
                    { box: 'the sign of f″(c) fixes the shape at c' },
                    { box: 'that shape names c a local maximum or a local minimum' }
                ]
            },
            {
                kind: 'eq', title: 'How an AP response states it',
                when: (env) => env.stage >= 9 && env.stage < 11,
                lines: [
                    { t: 'At x = 0: since f′(0) = 0 and f″(0) = −4 < 0, f has a local maximum at x = 0.', hl: true, color: 'accent' },
                    { t: 'At x = 1: since f′(1) = 0 and f″(1) = 8 > 0, f has a local minimum at x = 1.', hl: true, color: 'aux' },
                    { t: 'At x = −1: since f′(−1) = 0 and f″(−1) = 8 > 0, f has a local minimum at x = −1.', hl: true, color: 'aux' },
                    { t: 'Each sentence names the precondition, then the curvature, then the conclusion word.' }
                ]
            },
            {
                kind: 'eq', title: 'Second Derivative Test',
                /* the reference card the sentences point back at, so it stays */
                when: (env) => env.stage >= 10,
                lines: [
                    { t: 'f′(c) = 0  and  f″(c) > 0   →   local minimum', hl: true, color: 'aux' },
                    { t: 'f′(c) = 0  and  f″(c) < 0   →   local maximum', hl: true, color: 'accent' },
                    { t: 'The precondition comes first in both lines, and the sign alone is never read without it.' },
                    { t: 'f″(c) = 0 leaves the test inconclusive. That case is the next tab.' }
                ]
            },
            {
                kind: 'compare', title: 'Why the two conditions are written in that order',
                /* one screen, then it retires so the column under the rule card
                   never fills up with finished cards */
                when: (env) => env.stage >= 11 && env.stage < 12,
                sides: () => [
                    {
                        title: 'Reading the sign alone',
                        tone: 'wrong',
                        lines: [
                            'f″(1) = 8, which is positive.',
                            'The graph is concave up at x = 1.',
                            'Therefore x = 1 is a local minimum.'
                        ]
                    },
                    {
                        title: 'Reading both conditions',
                        tone: 'right',
                        lines: [
                            'f′(1) = 0, so x = 1 is a critical point.',
                            'f″(1) = 8, which is positive, so the graph is concave up there.',
                            'Therefore x = 1 is a local minimum.'
                        ]
                    }
                ],
                verdict: 'Both columns reach the same sentence, and only the second one earns it. Run the first argument at x = 2 and it claims a local minimum where the curve is simply climbing past.'
            },
            {
                kind: 'note', title: 'What this test is good for, and what it is not',
                when: (env) => env.stage >= 12,
                text: 'The Second Derivative Test answers one question about one point: given a flat tangent, does the curve bend up or down there. It is sometimes faster than reading f′ on both sides, but it carries stricter conditions. It needs f′(c) = 0 first, and it needs a sign for f″(c). When f″(c) = 0 the test is inconclusive, which is not the same statement as there being no extremum, and when f″(c) does not exist the test cannot classify either. Topic 5.4 reads both sides of the point and also works where f′(c) does not exist, so the two tests are companions rather than rivals.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Suppose f″(2) > 0, but f′(2) ≠ 0. Can the Second Derivative Test conclude a local minimum at x = 2?',
                choices: [
                    'No, because the test only starts once f′(c) = 0 makes c a critical point, and x = 2 is not one.',
                    'Yes, because f″(2) > 0 says the graph is concave up at x = 2, and a concave up point is a local minimum.',
                    'Yes, but only after checking that f(2) is the smallest value the function ever takes.'
                ], a: 0,
                whyBy: [
                    'The shape reading at x = 2 is correct and still gives no extremum. The test needs a flat tangent first, and here f′(2) = 24, so the curve is climbing through the point rather than turning at it.',
                    'That is the mistake this gate exists to block. Concave up describes how a piece of curve bends, and it does not make a point a minimum unless the tangent there is horizontal.',
                    'The Second Derivative Test never compares a value against all the other values of the function. That is the candidate list of topic 5.5, and the missing step here is simply f′(2) = 0.'
                ]
            },
            message: 'The gate answer is the two readings side by side at x = 2. The curve is concave up there, since f″(2) = 44, and the tangent is not horizontal, since f′(2) = 24. So x = 2 is not a critical point, and the Second Derivative Test is never run on it. The three-line card holds that case in full, and the overview still marks only the three places where f′ really equals 0. Those are the only places the test may start.'
        },
        {
            params: { stage: 2, focus: 0 },
            message: 'The microscope is now holding a short piece of the curve around x = 0, with the tangent drawn at the point. Line 1 reads f′(0) = 0, which is what makes x = 0 a critical point and puts it under the microscope at all. Line 2 is deliberately blank. The sign of f″(0) has not been used for anything yet, because the precondition is settled first.'
        },
        {
            params: { stage: 3 },
            message: 'Line 2 arrives. Since f″(0) = −4, which is negative, the shaded side of the flat tangent is the lower side and the piece is concave down at x = 0. That is exactly the reading topic 5.6 supplied, and nothing has been concluded about extrema yet. The question on screen asks what that shape forces at a point whose tangent is already horizontal.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'At x = 0 the tangent is horizontal, and the graph is concave down there. What local shape does that force?',
                choices: [
                    'A local maximum at x = 0, because a downward bending piece puts the flat point above the curve on both sides of it.',
                    'A local minimum at x = 0, because the curve bends downward into that point, and a bend downward is the shape of a valley.',
                    'No conclusion, because the sign of f″ at a single point never says anything about the point itself.'
                ], a: 0,
                whyBy: [
                    'Line 1 made the tangent flat, and line 2 made the piece bend downward. The highest point of a downward bending piece is its flat middle, which is a local maximum.',
                    'The order is reversed. A downward bend makes the flat point the top of the piece, and it is an upward bend that gives the bottom of a valley.',
                    'The test does speak about the point, and that is what makes it quick. It only needs the precondition first, and f′(0) = 0 is already on screen as line 1.'
                ]
            },
            message: 'Line 3 is a local maximum at x = 0, and f(0) = 0 is the height of that peak. Nothing in the argument consulted another critical point, and no interval was tested for the sign of f′. One flat tangent plus one curvature reading is the whole job. That is why this test is sometimes faster than the First Derivative Test, and it comes with the stricter condition already written as line 1.'
        },
        {
            params: { stage: 5, focus: 1 },
            message: 'The microscope moves to x = 1 with the same order of business. Line 1 first: f′(1) = 0, so the tangent is horizontal and x = 1 is a critical point. The band on the overview shows which piece of the curve is being held, and the verdict labels already settled at x = 0 stay put.'
        },
        {
            params: { stage: 6 },
            message: 'Line 2 for x = 1 reads f″(1) = 8, which is positive, so this flat tangent carries an upward bend and the shaded side is the upper one. The point now sits below the curve on both sides of it. The question is the same one as before with the sign reversed.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'Horizontal tangent plus concave up at x = 1. What does the Second Derivative Test give there?',
                choices: [
                    'A local minimum at x = 1, because f′(1) = 0 makes the tangent flat and f″(1) = 8 > 0 bends the curve upward around it.',
                    'A local maximum at x = 1, because f″(1) = 8 is a large positive number, and a large second derivative means a high point.',
                    'No conclusion, because the flat tangent at x = 1 might be the middle of a flattening rather than a turn.'
                ], a: 0,
                whyBy: [
                    'An upward bend holding a horizontal tangent puts the flat point below the curve on both sides of it, which is what a local minimum means there. The height is f(1) = −1.',
                    'The size of f″(1) is not the question, its sign is. A positive second derivative means concave up, and concave up at a critical point gives a minimum rather than a maximum.',
                    'That worry belongs to a point where f″(c) = 0, where the test really does come back inconclusive. f″(1) = 8 is not 0, so the curvature is decided and the point is decided with it.'
                ]
            },
            message: 'A local minimum at x = 1, with height f(1) = −1. Two of the three points are classified now, and they came out differently because the sign of f″ at a flat tangent differs at the middle point and at the point on the right. The microscope is still reading one point at a time, which is the whole method.'
        },
        {
            params: { stage: 8, focus: -1 },
            message: 'The last case is yours, and the selector above the pictures is live. The microscope has moved to x = −1, where line 1 and line 2 are already on screen in that order. Read the two lines, then answer what line 3 has to be. Moving the selector back to x = 0 or x = 1 brings either finished case back with its conclusion, so nothing is lost by looking again.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'At x = −1 the microscope shows f′(−1) = 0 and f″(−1) = 8. What is line 3?',
                choices: [
                    'A local minimum at x = −1, since the tangent is flat there and a positive f″ bends the curve upward around it.',
                    'A local maximum at x = −1, since a positive second derivative means the function value itself is positive there.',
                    'No conclusion, since the two readings f′(−1) = 0 and f″(−1) = 8 leave the test with nothing to say.'
                ], a: 0,
                whyBy: [
                    'x = −1 carries the same pair that x = 1 carried, a flat tangent plus an upward bend, so the pattern gives the same verdict. The height of that valley is f(−1) = −1.',
                    'The sign of f″ is about the shape of the curve, not about the sign of f. The value at the point is f(−1) = −1, and the shape reading there is concave up.',
                    'Nothing cancels. The two lines do different jobs, the first opens the test and the second decides it, and here both point toward a minimum.'
                ]
            },
            message: 'Line 3 is a local minimum at x = −1, and f(−1) = −1 matches the height at x = 1. The Three points, three readings card gathers the three arguments, and its first column is the precondition that opened each one. The How an AP response states it card writes the same three conclusions as full sentences, in the order the microscope used them.'
        },
        {
            params: { stage: 10 },
            message: 'The rule card is the whole test in two lines, and the order inside them is the point. f′(c) = 0 with f″(c) > 0 gives a local minimum, and f′(c) = 0 with f″(c) < 0 gives a local maximum. Read the first condition as permission to run the test, and the second condition as the answer it returns.'
        },
        {
            params: { stage: 11 },
            message: 'The card named Why the two conditions are written in that order is the mistake this lesson was built to prevent. A positive second derivative by itself says only that the curve bends upward where it is measured, and a curve can bend upward while climbing straight past a point. Only a flat tangent turns that bend into a minimum, so the precondition is never a formality.'
        },
        {
            params: { stage: 12 },
            message: 'The closing card names the case this mode does not settle. When f″(c) = 0 at a critical point, the Second Derivative Test is inconclusive, which is a different statement from saying there is no extremum. The next tab runs that case on three curves, and the tab after it turns a single critical point into an absolute conclusion on a closed interval.'
        }
    ],
    summary: {
        idea: 'The Second Derivative Test classifies one critical point at a time. Where f′(c) = 0, the sign of f″(c) gives the shape of the curve at that point. A positive reading means concave up, and the point is a local minimum. A negative reading means concave down, and the point is a local maximum. On f(x) = x⁴ − 2x² the three readings are f″(−1) = 8, f″(0) = −4 and f″(1) = 8, which give a local minimum at x = −1, a local maximum at x = 0 and a local minimum at x = 1.',
        mistake: 'Do not read the sign of f″(c) on its own. The test runs only after f′(c) = 0 has made c a critical point, and at x = 2 on this curve f″(2) = 44 is positive while f′(2) = 24, so no conclusion about an extremum follows there. When f″(c) = 0 the test is inconclusive, which is a different statement from saying that no extremum exists.',
        transfer: 'Apply the test to f(x) = x³ − 6x² + 9x, where f′(x) = 3x² − 12x + 9 and f″(x) = 6x − 12. The derivative equals 0 at x = 1 and at x = 3. Which of those two is a local maximum, which is a local minimum, and what would the test return at a critical point where f″ came out equal to 0?'
    }
};

export default secondDerivativeMainMode;
