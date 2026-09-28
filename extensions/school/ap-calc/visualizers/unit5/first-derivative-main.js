/* 5.4 Using the First Derivative Test to Determine Relative (Local) Extrema.
   Mode 1, the hero example: one derivative sign chart is the work surface, and
   the three critical points of the topic 5.2 curve are crossed one at a time.

   The curve is the one the student already met in topic 5.2 and will meet again
   in topic 5.5: f(x) = x^5/5 + x^4/4 − (2/3)x^3 with f′(x) = x²(x + 2)(x − 1),
   critical numbers −2, 0 and 1, interval signs + / − / − / +. The arithmetic is
   copied verbatim from those files so the three lessons cannot drift apart.

   Reveal discipline: one monotone params.stage, and a reveal always lives in the
   same step object as the Predict whose answer it shows. On screen i the
   narration is steps[i-1].message and the question is steps[i].predict, so a
   stage set in step j first paints on screen j+1. Nothing is gated on an answer,
   so Next works with every question untouched.

   Retirement works the same way with a ceiling instead of a floor. The First
   Derivative Test card is the one closing entry that stays once shown, because
   it is the reference the sentences point back at. The justification card, the
   shortcut comparison, the 5.3 against 5.4 comparison and the handoff to 5.5 each
   live on the single screen whose narration introduces them and then leave, so the
   four of them never pile up under the rule card. Nothing here was deleted.

   Boundary of this topic: local classification only. No f″, no concavity, no
   Second Derivative Test, no comparison of values across an interval. The single
   closing note names the topic 5.5 candidate list without claiming anything here. */

/* ---------- the shared 5.2 / 5.5 example --------------------------------- */

const A = -2.8, B = 1.8;                     /* the topic 5.2 viewing interval */
const fQ = (x) => Math.pow(x, 5) / 5 + Math.pow(x, 4) / 4 - (2 / 3) * Math.pow(x, 3);
const dQ = (x) => x * x * (x + 2) * (x - 1);  /* f′, and f′ = 0 at −2, 0 and 1 only */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

const F_M2 = dsp(fQ(-2)), F_0 = dsp(fQ(0)), F_1 = dsp(fQ(1));

/* Both graph panes use this x-window, the topic 5.2 interval, and both are 560
   wide. The sign chart is given the matching window further down, so all three
   layers stack on one shared horizontal scale. */
const WINX = [A, B];

/* One x pixel map for all three drawings. The graph pane maps x across its full
   560 width and the numberline maps x across 560 minus a 20px inset on each
   side, so the chart window is the picture window shrunk by 13/14 and centred
   on the same midpoint. Then a boundary at x = −2 lands on the same pixel in
   both layers, and the chart sits directly above the derivative graph. */
const SPAN = B - A;
const NWIN = [A + SPAN / 28, B - SPAN / 28];

/* The four intervals of the sign chart, left to right. Sign text and behavior
   text travel together, because colour never carries a meaning on its own. The
   two outer bands stop at the chart window edge, so no band overhangs the axis. */
const BANDS = [
    { from: NWIN[0], to: -2, iv: '(−∞, −2)', sign: '+', signText: 'f′ > 0', word: 'increasing', fWord: 'f increasing', color: 'up' },
    { from: -2, to: 0, iv: '(−2, 0)', sign: '−', signText: 'f′ < 0', word: 'decreasing', fWord: 'f decreasing', color: 'down' },
    { from: 0, to: 1, iv: '(0, 1)', sign: '−', signText: 'f′ < 0', word: 'decreasing', fWord: 'f decreasing', color: 'down' },
    { from: 1, to: NWIN[1], iv: '(1, ∞)', sign: '+', signText: 'f′ > 0', word: 'increasing', fWord: 'f increasing', color: 'up' }
];

/* The three crossings. at = the stage at which this verdict is on screen, so a
   verdict is never visible while its own question is still open. Colour tokens
   keep the meaning the rest of the unit gives them: accent = local maximum,
   aux = local minimum, auxInk = neither. The chart field is the short label the
   derivative graph uses once the verdict is revealed, and noteAt is the free
   corner chosen for that label so the three of them never stack. */
const CROSS = [
    { x: -2, at: 2, xName: 'x = −2', change: '+ → −', behavior: 'increasing → decreasing', verdict: 'a local maximum', chart: 'local maximum', color: 'accent', y: fQ(-2), noteAt: { x: -2, y: 5.2 } },
    { x: 0, at: 3, xName: 'x = 0', change: '− → −', behavior: 'decreasing → decreasing', verdict: 'no local extremum', chart: 'no local extremum', color: 'auxInk', y: fQ(0), noteAt: { x: 0, y: -3.3 } },
    { x: 1, at: 4, xName: 'x = 1', change: '− → +', behavior: 'decreasing → increasing', verdict: 'a local minimum', chart: 'local minimum', color: 'aux', y: fQ(1), noteAt: { x: 1, y: 5.6 } }
];

/* Where each verdict note sits on the curve graph: three strips of this picture
   that the curve never enters, one per point, in row order with CROSS. */
const CURVE_PLACE = [{ x: -1.9, y: -1.5 }, { x: 0.05, y: -3 }, { x: 0.4, y: -4.3 }];

/* stage 1 inspects the crossing at −2, stage 2 the one at 0, stage 3 the one at
   1. From stage 4 all three are decided and nothing is under inspection. */
const focusIndex = (stage) => (stage >= 1 && stage <= 3 ? stage - 1 : null);
const decided = (stage, i) => stage >= CROSS[i].at;

const RULE_LINES = [
    { t: 'f′ changes + → −   f has a local maximum' },
    { t: 'f′ changes − → +   f has a local minimum' },
    { t: 'f′ keeps the same sign on both sides   f has no local extremum' }
];

export const firstDerivativeMainMode = {
    label: 'Three critical points',
    intro: 'The same smooth curve as topic 5.2, and the same three critical numbers x = −2, x = 0 and x = 1. Topic 5.2 named them, topic 5.3 read the sign of f′ on each interval between them, and topic 5.4 asks a narrower question one crossing at a time: when x passes through a critical point from the interval on its left into the interval on its right, what happens there? The sign chart for f′ is the work surface, and the curve of f stays out of the picture until all three crossings have been classified from the signs.',
    params: { stage: 0 },
    controls: [],
    fns: { f: (x) => fQ(x), d: (x) => dQ(x) },
    compute: (env) => {
        const fi = focusIndex(env.stage);
        return {
            fi: fi,
            focus: fi === null ? null : CROSS[fi],
            left: fi === null ? null : BANDS[fi],
            right: fi === null ? null : BANDS[fi + 1],
            allDecided: env.stage >= 4
        };
    },
    panes: {
        main: [
            {
                kind: 'numberline', title: 'Sign chart for f′', width: 560,
                when: (env) => env.stage >= 1,
                window: NWIN, step: 1,
                /* The two bands beside the crossing under inspection keep their
                   sign text, and the other two drop their text so the eye reads
                   one pair. The four boundaries are marked in accent, and the
                   tick row names them. */
                bands: (env) => BANDS.map((b, i) => {
                    const live = env.fi === null || i === env.fi || i === env.fi + 1;
                    return { from: b.from, to: b.to, color: b.color, label: live ? b.signText : '' };
                }),
                probes: () => CROSS.map(c => ({ x: c.x, color: 'accent' }))
            },
            {
                kind: 'graph', title: 'y = f′(x), the derivative graph', height: 250,
                window: [...WINX, -3.5, 7.2],
                vband: (env) => env.fi === null ? [] : [{
                    from: BANDS[env.fi].from, to: BANDS[env.fi + 1].to,
                    color: 'color-mix(in srgb, var(--text-secondary) 14%, transparent)'
                }],
                curves: [{ fn: 'd', from: A, to: B, samples: 600, color: 'ink' }],
                /* While a boundary is still unclassified its guide carries the
                   x-name. Once its verdict is revealed the verdict text takes
                   over, placed in a free corner of the same graph so the three
                   labels never collide. */
                vlines: (env) => CROSS.map((c, i) => ({
                    x: c.x, color: 'accent', label: decided(env.stage, i) ? '' : c.xName
                })),
                notes: (env) => CROSS.map((c, i) => ({
                    x: c.noteAt.x, y: c.noteAt.y, color: c.color,
                    t: decided(env.stage, i) ? c.xName + ', ' + c.chart : ''
                }))
            },
            {
                kind: 'table', title: 'Classification board',
                when: (env) => env.stage >= 5,
                cols: ['Critical x', 'Sign of f′ left', 'Sign of f′ right', 'Behavior change', 'Conclusion'],
                rows: (env) => CROSS.map((c, i) => {
                    const l = BANDS[i], r = BANDS[i + 1];
                    return [
                        { v: () => c.xName, bold: true },
                        { v: () => l.signText, color: l.color },
                        { v: () => r.signText, color: r.color },
                        { v: () => c.behavior },
                        { v: () => c.verdict, color: c.color, bold: true }
                    ];
                }),
                note: 'Each row reads one crossing. The two sign columns come from the sign chart for f′, and the conclusion column is what the First Derivative Test returns from those two signs.'
            },
            {
                kind: 'graph', title: 'y = f(x), the curve from topic 5.2', height: 300,
                when: (env) => env.stage >= 5,
                window: [...WINX, -5, 3.5],
                curves: [{ fn: 'f', from: A, to: B, samples: 600, color: 'curveA' }],
                /* The three guides carry the x-names in the top row, and each
                   verdict rides in a note placed in a strip of this graph that
                   the curve never enters, so no label crosses the picture. */
                vlines: () => CROSS.map(c => ({ x: c.x, color: 'accent', label: c.xName })),
                points: () => CROSS.map(c => ({ x: c.x, y: c.y, r: 6.5, color: c.color, label: '' })),
                notes: () => CROSS.map((c, i) => ({
                    x: CURVE_PLACE[i].x, y: CURVE_PLACE[i].y, color: c.color,
                    t: c.xName + ', ' + c.chart
                }))
            }
        ],
        side: [
            {
                kind: 'table', title: 'Interval signs and behavior of f',
                when: (env) => env.stage >= 1,
                cols: ['Interval', 'Sign of f′', 'Behavior of f'],
                rows: () => BANDS.map(b => ([
                    { v: () => b.iv },
                    { v: () => b.signText, color: b.color },
                    { v: () => b.fWord, color: b.color }
                ])),
                note: 'This table is the topic 5.3 reading of the chart. Every row states what f does on one interval, and no row classifies a point.'
            },
            {
                kind: 'eq', title: 'f and f′ on this curve',
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x^5/5 + x^4/4 − (2/3)x^3' },
                        { t: 'f′(x) = x²(x + 2)(x − 1)', hl: true },
                        { t: 'Topic 5.2 found the critical numbers here: x = −2, x = 0 and x = 1.' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'The three factors give f′ = 0 at those numbers and nowhere else, so the sign of f′ can only change at −2, at 0 or at 1.' });
                    if (env.stage >= 1) out.push({ t: 'The graph of f′ below the sign chart is the same information drawn as a curve: above the x-axis where f′ > 0, below it where f′ < 0.' });
                    return out;
                }
            },
            {
                kind: 'eq', title: 'What topic 5.3 already settled',
                lines: (env) => {
                    const out = [
                        { t: 'f′ > 0 on an interval  →  f is increasing there', color: 'up' },
                        { t: 'f′ < 0 on an interval  →  f is decreasing there', color: 'down' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'That reading is already finished on this chart. Topic 5.4 uses it as a given and looks at one crossing instead of one interval.' });
                    return out;
                }
            },
            {
                kind: 'readout', title: (env) => env.allDecided ? 'All three crossings' : 'The crossing under inspection',
                when: (env) => env.stage >= 1,
                items: (env) => {
                    if (env.allDecided) {
                        return CROSS.map((c, i) => ({
                            label: 'First Derivative Test at ' + c.xName,
                            v: () => decided(env.stage, i) ? c.verdict : 'not decided yet',
                            color: c.color
                        }));
                    }
                    const c = env.focus, l = env.left, r = env.right;
                    const i = env.fi;
                    const out = [
                        { label: 'critical point', v: () => c.xName, color: 'accent' },
                        { label: 'sign of f′ on the left', v: () => l.signText, color: l.color },
                        { label: 'behavior of f on the left', v: () => l.word, color: l.color },
                        { label: 'sign of f′ on the right', v: () => r.signText, color: r.color },
                        { label: 'behavior of f on the right', v: () => r.word, color: r.color },
                        { label: 'sign change across ' + c.xName, v: () => c.change },
                        {
                            label: 'First Derivative Test at ' + c.xName,
                            v: () => decided(env.stage, i) ? c.verdict : 'not decided yet',
                            color: decided(env.stage, i) ? c.color : 'auxInk'
                        }
                    ];
                    return out;
                }
            },
            {
                kind: 'note', title: 'A horizontal tangent is not a verdict',
                /* This card only does its job while x = 0 is the live question,
                   so it retires once the board and the rule card are on screen. */
                when: (env) => env.stage >= 3 && env.stage <= 5,
                text: 'A horizontal tangent makes x = 0 a critical point. It does not make x = 0 a maximum or a minimum. The pair of signs on either side is what decides, and here both sides read f′ < 0, so f keeps falling through the point.'
            },
            {
                kind: 'readout', title: 'Heights at the three points',
                when: (env) => env.stage >= 5,
                items: () => [
                    { label: 'f(−2), at the local maximum', v: () => '≈ ' + F_M2, color: 'accent' },
                    { label: 'f(0), where there is no local extremum', v: () => F_0, color: 'auxInk' },
                    { label: 'f(1), at the local minimum', v: () => '≈ ' + F_1, color: 'aux' }
                ]
            },
            {
                kind: 'eq', title: 'First Derivative Test',
                /* the one side card that stays once it arrives, because the practice
                   questions and the justification sentences point at its three lines */
                when: (env) => env.stage >= 6,
                lines: (env) => RULE_LINES.map(l => ({ t: l.t })).concat([
                    { t: 'The test compares the sign of f′ immediately to the left and immediately to the right of a critical point.', hl: true },
                    { t: 'It needs two signs and one point, and nothing else. The value of f is not part of the test.' }
                ])
            },
            {
                kind: 'eq', title: 'How to write the justification',
                /* one screen each from here on, the way topic 5.5 windows its
                   teaching entries, so the column never carries all four at once */
                when: (env) => env.stage >= 7 && env.stage < 8,
                lines: [
                    { t: 'At x = −2: since f′ changes from positive to negative at x = −2, f has a relative (local) maximum at x = −2.', hl: true, color: 'accent' },
                    { t: 'At x = 1: since f′ changes from negative to positive at x = 1, f has a relative (local) minimum at x = 1.', hl: true, color: 'aux' },
                    { t: 'At x = 0: since f′ does not change sign at x = 0, f has no relative extremum there.', hl: true, color: 'auxInk' },
                    { t: 'Each sentence names the sign change as the evidence and the x-value as the location. The equation f′(c) = 0 by itself is not a justification.' }
                ]
            },
            {
                kind: 'compare', title: 'The shortcut that costs marks',
                when: (env) => env.stage >= 8 && env.stage < 9,
                sides: () => [
                    {
                        title: 'Wrong', tone: 'wrong',
                        lines: [
                            'f′(0) = 0.',
                            'Therefore x = 0 is an extremum.'
                        ]
                    },
                    {
                        title: 'Right', tone: 'right',
                        lines: [
                            'f′(0) = 0 makes x = 0 a critical point.',
                            'Then inspect the signs on both sides.',
                            '− → −, so there is no local extremum.'
                        ]
                    }
                ],
                verdict: 'A critical point tells you where to inspect. The First Derivative Test tells you what happens there.'
            },
            {
                kind: 'compare', title: 'Topic 5.3 and topic 5.4',
                when: (env) => env.stage >= 9 && env.stage < 10,
                sides: () => [
                    {
                        title: 'Topic 5.3 asks about an interval',
                        lines: [
                            'Question: what is f doing on this interval?',
                            'Evidence: the sign of f′ on that interval.',
                            'Answer words: increasing or decreasing.'
                        ]
                    },
                    {
                        title: 'Topic 5.4 asks about one crossing',
                        lines: [
                            'Question: what happens when x passes through this critical point?',
                            'Evidence: the sign of f′ on the left and on the right.',
                            'Answer words: a local maximum, a local minimum or no local extremum.'
                        ]
                    }
                ],
                verdict: 'Same chart, two different questions. The interval reading is the input to the crossing reading, not a second copy of it.'
            },
            {
                kind: 'note', title: 'Where x = 0 goes in topic 5.5',
                /* the closing card of the mode, and the walk ends on its own screen */
                when: (env) => env.stage >= 10 && env.stage < 11,
                text: 'Topic 5.4 classifies local behavior at a critical point, and by that test x = 0 is a point with no extremum. Topic 5.5 runs a different procedure on a closed interval: the endpoints and every interior critical number go onto a candidate list, and the function values on that list are compared. The number x = 0 goes onto that list whether or not it passed the First Derivative Test. Failing a local classification here does not take a critical point out of the work of the next topic.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The sign chart for f′ is on the screen now: four intervals, three boundaries, and one sign written on every interval. Topic 5.3 told us what each interval means, and the Interval signs and behavior of f table already says it. Topic 5.4 asks a different question, which is what happens when we cross one critical point from the interval on its left into the interval on its right. The two bands beside x = −2 are the pair under inspection, and they are the only two carrying sign text. Nothing is classified yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'As x passes through −2, f changes from increasing to decreasing. What does that make x = −2?',
                choices: [
                    'It makes x = −2 a local maximum. The sign of f′ goes from positive to negative there, so f climbs up to that point and falls away from it.',
                    'It makes x = −2 a local minimum. The derivative turns around at that point, and any turn around a critical point gives the low point of a valley.',
                    'It settles nothing new. Topic 5.2 already called x = −2 a critical point, and that name is the whole answer about the point.'
                ], a: 0,
                whyBy: [
                    'Positive on the left means the values were rising as x approached −2, and negative on the right means they fall away after it. The point between a rise and a fall is above its neighbors, which is the local maximum.',
                    'A valley needs the opposite order, negative on the left and positive on the right, so that f falls into the point and climbs out of it. Here f climbs into −2 and falls out of it.',
                    'Critical point is where the search starts, not what the test returns. Topic 5.2 named the three places to inspect, and the sign change on either side of one of them is the new evidence in topic 5.4.'
                ]
            },
            message: 'Positive to negative is the crossing that turns a climb into a fall, so f has a local maximum at x = −2. The sign change carried that conclusion, and the equation f′(−2) = 0 only put −2 on the list to inspect. The inspection moves to the next crossing at x = 0, and the two bands beside it are the pair under inspection now.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'f′(0) = 0, and f′ is negative on both sides of 0. What does the First Derivative Test conclude at x = 0?',
                choices: [
                    'It concludes that there is no local extremum at x = 0. The sign of f′ does not change across 0, so f keeps decreasing straight through the point.',
                    'It concludes that x = 0 is an extremum, because f′(0) = 0 and a critical point where the derivative equals zero is a maximum or a minimum.',
                    'It concludes nothing at all, because the two intervals carry the same sign and the test only works when the signs differ.'
                ], a: 0,
                whyBy: [
                    'The test reads the sign on the left and the sign on the right and compares them. Same sign on both sides is one of its three answers, and it says no local extremum occurs there.',
                    'This is the shortcut the test exists to block. f′(0) = 0 makes x = 0 a critical point, and a critical point is a place to inspect rather than a verdict. Here the inspection returns negative on the left and negative on the right.',
                    'The test does apply, and a shared sign is a conclusion instead of a dead end. On this curve f flattens at x = 0 and then continues downward, which is exactly what − → − predicts.'
                ]
            },
            message: 'Same sign on both sides, so the test returns no local extremum at x = 0. A horizontal tangent still makes x = 0 a critical point, exactly as topic 5.2 said, and that is all it makes. The last crossing is at x = 1, and the pair under inspection reads f′ < 0 on the left and f′ > 0 on the right.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'At x = 1 the sign of f′ goes from negative to positive, so f changes from decreasing to increasing. How should x = 1 be classified?',
                choices: [
                    'As a local minimum. f falls into x = 1 and climbs out of it, so the values near that point sit above the value at it.',
                    'As a local maximum. The sign of f′ changes at x = 1, and any sign change at a critical point gives the high point of a peak.',
                    'As no local extremum. x = 1 is one more zero of f′, so it ends where x = 0 ended.'
                ], a: 0,
                whyBy: [
                    'Negative on the left means f was falling as x approached 1, and positive on the right means f rises after it. The point between a fall and a climb is below its neighbors, which is the local minimum.',
                    'A sign change does decide the case, but the order matters. Positive to negative gives a local maximum, and here the order is negative to positive.',
                    'Both are zeros of f′, and they come out differently. At x = 0 the sign was the same on both sides, while at x = 1 the sign of f′ switches from negative to positive.'
                ]
            },
            message: 'Negative to positive is the valley crossing, so f has a local minimum at x = 1. All three crossings are now decided from the sign chart alone, and the four interval signs never changed. Every verdict came from one left side and one right side, and only one of the three points failed to turn.'
        },
        {
            params: { stage: 5 },
            message: 'The Classification board gathers the three verdicts, and y = f(x), the curve from topic 5.2 appears as confirmation now that the work is done. Read the curve against the sign chart above it: f climbs to x = −2, flattens straight through x = 0 on its way down, and turns back up at x = 1. The three heights are f(−2) ≈ ' + F_M2 + ', f(0) = ' + F_0 + ' and f(1) ≈ ' + F_1 + ', and this topic only says how each point behaves against its own neighbors.'
        },
        {
            params: { stage: 6 },
            message: 'The First Derivative Test card is the whole rule in three lines plus one condition. It compares the sign of f′ immediately to the left and immediately to the right of a critical point, and it has exactly three outcomes. This is where topic 5.4 stops being a second sign-chart lesson: the interval reading is finished, and the crossing reading is what returns a name for a point.'
        },
        {
            params: { stage: 7 },
            message: 'The How to write the justification card states each verdict the way a reader expects it. Every sentence names the sign change first, then the x-value, then the conclusion word. The sentence for x = 0 is the one students leave out, and it is the sentence that proves the test was used rather than guessed.'
        },
        {
            params: { stage: 8 },
            message: 'The shortcut that costs marks is the two-line argument this example was built to catch. f′(0) = 0 is true, and it is still not the evidence. Topic 5.2 handed over the critical point, and the pair of signs on either side of it is what topic 5.4 adds before any conclusion is written.'
        },
        {
            params: { stage: 9 },
            message: 'The topic 5.3 and topic 5.4 card keeps the two questions apart on purpose. One asks what f does on an interval and answers with a behavior. The other asks what happens at one critical point and answers with a local maximum, a local minimum or no local extremum. Same sign chart, one reading feeding the other.'
        },
        {
            params: { stage: 10 },
            message: 'The closing note is the only forward reference in this mode. The point x = 0 has no local extremum by the First Derivative Test, and it still belongs on the candidate list that topic 5.5 builds. A local classification and a candidate list are two different jobs, and a point can fail the first while sitting on the second.'
        }
    ],
    summary: {
        idea: 'The First Derivative Test classifies a critical point by comparing the sign of f′ immediately before it with the sign of f′ immediately after it. Positive to negative gives a local maximum, negative to positive gives a local minimum, and the same sign on both sides gives no local extremum. The critical point is not the answer, and the sign change across it is the evidence.',
        mistake: 'Do not conclude an extremum from f′(c) = 0. That equation, like a derivative that fails to exist, only marks c as a place to inspect. On this curve f′(0) = 0 with f′ negative on both sides, so x = 0 is a critical point holding no local extremum. Nothing in the First Derivative Test compares values across an interval, so it never settles which point gives the largest or the smallest value.',
        transfer: 'Read a sign chart of f′ alone and classify. A function f has f′(x) = x²(x + 3)(x − 2), with critical numbers at x = −3, x = 0 and x = 2. On which intervals is f increasing, and what does the First Derivative Test give at each of the three critical numbers?'
    }
};

export default firstDerivativeMainMode;
