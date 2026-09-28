/* 5.4 First Derivative Test, second case: the critical point where the
   derivative does not exist. The sign chart is the hero and the first screen,
   the V shaped graph of g(x) = |x| stays hidden until the classification has
   been reasoned from the two signs, and it draws no tangent at the corner
   because the one-sided slopes differ there, exactly the reading 5.2 makes. The
   optional second case (h(x) = −|x|) is a Practice question, not a second
   picture, since the mode's whole point is that the sign chart is enough. */

export const firstDerivativeDneMode = {
    label: 'When f′ does not exist',
    intro: 'The first screen here is the sign chart of g′ and nothing else, because g(x) = |x| is the case where the derivative has no value at the point being tested. The two arms give g′ = −1 on the left and g′ = +1 on the right, and g′(0) itself is worth nothing at all. The question this mode answers is whether the First Derivative Test still works at such a point, and the graph of the V stays out of it until the signs have settled the matter.',
    params: { stage: 0 },
    controls: [],
    fns: { g: (x) => Math.abs(x) },
    compute: (env) => ({
        conclusion: env.stage >= 1,
        showGraph: env.stage >= 2,
        practicing: env.stage >= 3,
        secondSolved: env.stage >= 4,
        handoff: env.stage >= 5
    }),
    panes: {
        main: [
            {
                /* Same x-range and same width as the graph below it, so the
                   probe at x = 0 and the corner of the V stand on one column */
                kind: 'numberline', title: 'Sign chart of g′, where g(x) = |x|',
                /* the numberline insets 20px and the graph does not, so its window is
                   narrowed by span/14 to put both layers on one pixel map */
                width: 560, window: [-2.3214, 2.3214], step: 1,
                bands: [
                    { from: -2.5, to: 0, color: 'down', label: 'g′ = −1' },
                    { from: 0, to: 2.5, color: 'up', label: 'g′ = +1' }
                ],
                probes: [{ x: 0, color: 'accent', label: 'g′ does not exist' }]
            },
            {
                kind: 'eq', title: 'Reading the sign chart',
                lines: (env) => {
                    const out = [
                        { t: 'Left of 0: g′ = −1, so g is decreasing.' },
                        { t: 'Right of 0: g′ = +1, so g is increasing.' },
                        { t: 'At 0: g′ does not exist, and that makes x = 0 a critical point.' }
                    ];
                    if (env.conclusion) out.push({ t: 'Across 0 the signs of g′ go − → +.', hl: true });
                    return out;
                }
            },
            {
                kind: 'graph', title: 'y = g(x), where g(x) = |x|', height: 240,
                when: (env) => env.showGraph,
                window: [-2.5, 2.5, -0.45, 2.7],
                curves: [
                    { fn: 'g', from: -2.5, to: 0, samples: 200, color: 'curveA', label: 'slope −1', labelAt: -1.9 },
                    { fn: 'g', from: 0, to: 2.5, samples: 200, color: 'curveA', label: 'slope +1', labelAt: 1.9 }
                ],
                points: () => ([
                    /* the minimum conclusion is aux orange, matching 5.4 mode 1 and 5.5 */
                    { x: 0, y: 0, r: 6.5, color: 'aux', label: 'local minimum at x = 0', labelDx: 40, labelDy: -14 }
                ]),
                vlines: () => ([{ x: 0, color: 'auxInk', label: '' }]),
                /* no tangent at the corner, exactly the drawing choice 5.2 makes */
                tangents: () => []
            },
            {
                kind: 'practice', id: 'u54-dne-practice', title: 'Second case, signs only',
                when: (env) => env.practicing,
                items: [
                    {
                        q: 'h(x) = −|x|, so h′ = +1 for every x < 0 and h′ = −1 for every x > 0, while h′(0) does not exist. What does the First Derivative Test give at x = 0?',
                        choices: [
                            'A local maximum, since the sign of h′ goes + → − and h turns from increasing to decreasing at the corner.',
                            'No local extremum, since the test only applies once h′(0) = 0 has been checked.',
                            'A local minimum, since the graph of h has a sharp corner at x = 0 and a corner always bottoms out.'
                        ], a: 0,
                        whyBy: [
                            'This is the reading of g with both signs flipped. h climbs into the corner on slope +1 and leaves it on slope −1, so the corner stands above the values beside it, and that is a local maximum. No value of h′(0) entered the argument.',
                            'That condition is not part of the test. The critical point here came from a missing derivative, the two signs beside it do change, and the test reads those signs and gives a local maximum.',
                            'A corner is only a reason to look. Which side runs higher is settled by the signs of h′, and they go + → − here, so this corner is a local maximum instead of a local minimum.'
                        ]
                    },
                    {
                        q: 'A function r is defined at x = 3, r′(3) does not exist, and r′ = −1 on both sides of 3. What does the First Derivative Test conclude at x = 3?',
                        choices: [
                            'A local minimum, since a negative derivative on both sides means the graph sinks into the corner and stops there.',
                            'A local maximum, since r′(3) does not exist and every point without a derivative is a turning point.',
                            'No local extremum, since the sign of r′ does not change across x = 3 and r is decreasing on both sides.'
                        ], a: 2,
                        whyBy: [
                            'Falling into a corner and then falling out of it leaves the point just after the corner lower, so the corner is the bottom of nothing. The two signs match, and matching signs give no local extremum.',
                            'A missing derivative makes x = 3 a place to inspect and nothing more. The test still needs a sign change, and r′ stays negative on both sides.',
                            'Signs − → − mean r keeps decreasing straight through the corner, so no local extremum occurs there even though r′(3) does not exist. The test still applies here, and its answer is that nothing turns.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Signs beside x = 0',
                items: (env) => ([
                    { label: 'g′ left of 0', v: () => '−1', color: 'down' },
                    { label: 'g′ right of 0', v: () => '+1', color: 'up' },
                    { label: 'g′(0)', v: () => 'does not exist' },
                    { label: 'g left of 0', v: () => 'decreasing', color: 'down' },
                    { label: 'g right of 0', v: () => 'increasing', color: 'up' },
                    { label: 'Sign of g′ across 0', v: () => '− → +' },
                    { label: 'First Derivative Test', v: () => env.conclusion ? 'applies, read from the two signs' : 'not decided yet' },
                    { label: 'x = 0 is', v: () => env.conclusion ? 'a local minimum' : 'not decided yet', color: () => env.conclusion ? 'aux' : 'ink' }
                ])
            },
            {
                kind: 'note', title: 'What the test reads',
                when: (env) => env.conclusion,
                text: 'The First Derivative Test compares the sign of f′ immediately to the left and the right of a critical point. It asks nothing about the derivative at the point itself, so a critical point reached through f′ = 0 and a critical point reached because f′ does not exist are read the same way. A sign going + → − gives a local maximum, − → + gives a local minimum, and a sign that does not change gives no local extremum.'
            },
            {
                kind: 'note', title: 'No tangent at the corner',
                when: (env) => env.showGraph,
                text: 'The left arm of y = |x| runs down with slope −1 and the right arm runs up with slope +1. The two one-sided slopes differ, so g′(0) has no value, and this graph draws no tangent at x = 0 to pretend otherwise. That missing slope is precisely why x = 0 is a critical point here.'
            },
            {
                kind: 'readout', title: 'The second case, h(x) = −|x|',
                when: (env) => env.secondSolved,
                items: () => ([
                    { label: 'h′ left of 0', v: () => '+1', color: 'up' },
                    { label: 'h′ right of 0', v: () => '−1', color: 'down' },
                    { label: 'h′(0)', v: () => 'does not exist' },
                    { label: 'Sign of h′ across 0', v: () => '+ → −' },
                    { label: 'x = 0 is', v: () => 'a local maximum', color: 'accent' }
                ])
            },
            {
                kind: 'note', title: 'How to write the answer',
                when: (env) => env.secondSolved,
                text: 'A reader wants the sign change stated first. For g: since g′ changes from negative to positive at x = 0, g has a relative (local) minimum at x = 0. For h: since h′ changes from positive to negative at x = 0, h has a relative (local) maximum at x = 0. Neither sentence reports a derivative value at the point, because the test never needs one.'
            },
            {
                kind: 'note', title: 'What this hands to 5.5',
                when: (env) => env.handoff,
                text: 'Topic 5.4 settles local behavior one point at a time. Topic 5.5 runs a different procedure on a closed interval, where both endpoints and every interior critical point become candidates whether or not they pass the First Derivative Test. The corner at x = 0 would sit on that board on the strength of the missing derivative alone, and that reason holds even on a day the test finds nothing there.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The derivative does not exist at x = 0. Can the First Derivative Test still classify the point?',
                choices: [
                    'No. The test needs g′(0) = 0 first, and a point whose derivative has no value never clears that step.',
                    'Yes. The sign of g′ changes from negative to positive, so g turns from decreasing to increasing and x = 0 is a local minimum.',
                    'No. A point with no derivative cannot be an extremum, because no tangent line exists there.'
                ], a: 1,
                whyBy: [
                    'That step is not in the test. The First Derivative Test compares the signs of f′ on the intervals beside a critical point, and a critical point includes the places where the derivative does not exist. Those signs are −1 and +1 here, so the reading gives a local minimum at x = 0.',
                    'The two intervals beside x = 0 are the whole evidence. g′ negative on the left means g falls into the corner, g′ positive on the right means g climbs out of it, and that pairing is a local minimum. No value of g′(0) was used anywhere in the argument.',
                    'A missing tangent line rules out writing a slope at the corner, and it rules out nothing else. The test reads the derivative on either side of the point instead of at it, so this corner still gets classified, and it is a local minimum.'
                ]
            },
            message: 'The sign chart now carries the verdict. Across x = 0 the sign of g′ goes − → +, so g falls into the corner and climbs back out, and x = 0 is a local minimum. That reading never touched g′(0), and it is exactly what the Sign chart of g′ was built to support.'
        },
        {
            params: { stage: 2 },
            message: 'Only now does y = |x| appear, and it is the V the sign chart promised, with its corner at the origin. No tangent is drawn at x = 0, because the left arm carries slope −1 and the right arm carries slope +1, and two different one-sided slopes leave no single derivative there. Topic 5.2 made that same drawing choice for this corner, and the picture only confirms a classification the signs had already settled.'
        },
        {
            params: { stage: 3 },
            message: 'The second case needs no picture at all. The Second case, signs only card below asks about h(x) = −|x|, whose two arms carry slopes +1 and −1, and about a corner whose derivative keeps the same sign on both sides. Decide both from the signs beside the point, the way the Sign chart of g′ above was read, then check your wording against the answers the card reveals.'
        },
        {
            params: { stage: 4 },
            message: 'The Sign of h′ across 0 row now reads + → −, so h rises into its corner and falls out of it, and x = 0 is a local maximum there. The second item keeps the same sign on both sides, which means no local extremum at all. A corner is a place to inspect, never a verdict by itself.'
        },
        {
            params: { stage: 5 },
            message: 'Take one sentence from this mode into Topic 5.5. Here the First Derivative Test classified local behavior at a corner, and 5.5 asks a different question about a closed interval, where both endpoints and every interior critical point become candidates whether or not the test says anything about them. This x = 0 earns its place on that board because g′ does not exist there.'
        }
    ],
    summary: {
        idea: 'The First Derivative Test compares the sign of f′ on the two intervals immediately beside a critical point, and that comparison works whether the derivative is 0 there or has no value at all. For g(x) = |x| the derivative is −1 left of 0 and +1 right of 0 while g′(0) does not exist, and the sign change − → + makes x = 0 a local minimum.',
        mistake: 'Waiting for f′(c) = 0 before believing the test can run. A point in the domain where the derivative does not exist is already a critical point, and the signs beside it settle the classification. The mirror mistake is just as costly, crowning every corner: when the sign stays the same on both sides of a corner, that point holds no local extremum.',
        transfer: 'A function k is defined at x = 2, k′(2) does not exist, and k′ = +1 on (1, 2) while k′ = −1 on (2, 3). Name the classification at x = 2 and the one sign fact it rests on. Topic 5.5 then asks a different question about k on [1, 3], and x = 2 belongs on that candidate list even before its sign fact is read.'
    }
};

export default firstDerivativeDneMode;
