/* 5.6 Mode 2, the second-derivative zero that changes nothing: f(x) = x⁴, so
   f′(x) = 4x³ and f″(x) = 12x². The tab exists to break one inference.
   f″(c) = 0 does not buy an inflection point, and the only thing that does is a
   change in concavity across c, read on both sides. Here f″ touches 0 at the
   origin without crossing it, so f is concave up on (−∞, 0) and concave up on
   (0, ∞), and x = 0 holds no inflection point.

   The teaching shape is borrowed from topic 5.3's zero-without-a-behavior-change
   case and from topic 5.4's shortcut card, and the closing card states the
   parallel on purpose: topic 5.4 says f′(c) = 0 makes c a critical point and
   nothing more, this tab says f″(c) = 0 makes c a place to check and nothing
   more. Both put the evidence on the two sides rather than on the zero.

   Boundaries of this tab. It stays inside topic 5.6, so it never asks what a
   sign of f″ says about a point being a maximum or a minimum, which is topic
   5.7. It reads concavity from the sign of f″ only.

   Reveal discipline is the runtime's: one monotone params.stage, a stage set in
   step j first paints on screen j + 1, and screen i carries steps[i].predict.
   Every question is answerable from the picture already on screen, and Next is
   never gated on an answer. Panels that belong to one sub-question retire with
   a ceiling once that sub-question is settled, so the side column never stacks.
   The shared arithmetic is copied verbatim from the build contract, because
   importing another lesson file would mean editing a live file. */

/* The graphs are framed slightly wider than the picture they draw, so no edge
   tick label is pushed outside the viewBox. f″ runs to 12 · 1.1² ≈ 14.5 and f to
   1.1⁴ ≈ 1.46 inside this x-window, and both y-windows leave slack past those
   maxima. */
const XWIN = [-1.1, 1.1];

/* The numberline insets 20px on each side and the graph does not, so its window
   is the graph window shrunk by span/28 at each end and centred on the same
   midpoint. Then the probe at x = 0 sits on one pixel in both layers, and the
   two bands stop at the chart's own edge. */
const GX = [XWIN[0] - (XWIN[1] - XWIN[0]) / 26, XWIN[1] + (XWIN[1] - XWIN[0]) / 26];
const NLWIN = XWIN;

/* Both test points sit one unit from the zero and both read 12, so the sign of
   f″ is the same on either side of x = 0 while f″(0) = 0 exactly. f itself reads
   f(−1) = 1, f(0) = 0 and f(1) = 1 across the same three x-values. */
const fQ = (x) => Math.pow(x, 4);
const fppQ = (x) => 12 * x * x;

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

const SUMMARY = {
    idea: 'On this case f(x) = x⁴ has f″(x) = 12x², so f″(0) = 0 while f″(−1) = 12 and f″(1) = 12. The second derivative is positive on both sides of its only zero, which makes f concave up on (−∞, 0) and concave up on (0, ∞), and the graph of f keeps the same upward shape through the origin. No concavity change happens at x = 0, so x = 0 is not an inflection point. f″(c) = 0 identifies a place worth checking. The change in concavity is the evidence.',
    mistake: 'Assuming that solving f″ = 0 hands you the inflection points. Here the graph of f″ falls into the origin and climbs back out, and that travel decides nothing on its own. The position of f″ relative to 0 decides, and it is above 0 on both sides of x = 0. The mirror error is to let a flat tangent, or the lowest value of f″, stand in for the comparison of the two sides.',
    transfer: 'A function q is defined for all real x with q″(x) = (x − 3)². What is the sign of q″ just left of x = 3 and just right of x = 3, and does the concavity of q change at x = 3?'
};

export const concavityNoChangeMode = {
    label: 'When f″ = 0 is not enough',
    intro: 'One case built to break one inference: f(x) = x⁴, so f′(x) = 4x³ and f″(x) = 12x². The tab opens on the graph of f″ alone, because the question is what f″(0) = 0 is worth as evidence about the concavity of f. Nothing is marked on that picture yet, and the graph of f waits until the sign chart for f″ has been read.',
    params: { stage: 0 },
    controls: [],
    fns: { f: (x) => fQ(x), fpp: (x) => fppQ(x) },
    compute: (env) => ({
        marked: env.stage >= 1,
        behavior: env.stage >= 2,
        fShown: env.stage >= 3,
        flow: env.stage >= 4 && env.stage < 6,
        board: env.stage >= 4 && env.stage < 6,
        written: env.stage >= 5 && env.stage < 6,
        recap: env.stage >= 6
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'Graph of f″, where f″(x) = 12x²', height: 300,
                width: 560,
                window: GX.concat([-1, 16]), gridX: 1, gridY: 5,
                curves: [
                    { fn: 'fpp', from: -1.1, to: 1.1, samples: 240, color: 'curveA', label: 'f″(x) = 12x²', labelAt: 0.72 }
                ],
                points: (env) => {
                    if (!env.marked) return [];
                    return [
                        { x: -1, y: fppQ(-1), color: 'up', label: 'f″(−1) = ' + dsp(fppQ(-1)) },
                        { x: 0, y: fppQ(0), color: 'accent', label: 'f″(0) = ' + dsp(fppQ(0)), labelDx: 10, labelDy: -14 },
                        { x: 1, y: fppQ(1), color: 'up', label: 'f″(1) = ' + dsp(fppQ(1)) }
                    ];
                },
                /* no in-graph note here: any height for a 28-character sentence
                   lands on a y-tick row in this window, so the wording lives in
                   its own side card */
                notes: () => [],
                vlines: (env) => env.marked ? [{ x: 0, color: 'accent', label: '' }] : [],
                tangents: () => []
            },
            {
                /* width 560 and the same x pair as the graph above through NLWIN,
                   so the probe sits under the vertex of the parabola. f″ is
                   positive on every x except 0, so the two bands meet at 0 and
                   the chart carries no unsigned gap. The sign text travels with
                   the concavity word, because colour never carries a meaning on
                   its own. */
                kind: 'numberline', title: 'Sign chart for f″, same x-window as the graph above',
                when: (env) => env.marked,
                window: NLWIN, width: 560, step: 1,
                bands: (env) => ([
                    { from: NLWIN[0], to: 0, color: 'up', label: env.behavior ? 'concave up' : 'f″ > 0' },
                    { from: 0, to: NLWIN[1], color: 'up', label: env.behavior ? 'concave up' : 'f″ > 0' }
                ]),
                probes: () => ([
                    { x: 0, color: 'accent', label: '0' }
                ])
            },
            {
                /* Confirmation only, and it arrives after the sign chart has been
                   read. The two tinted bands meet at x = 0 as one unbroken band,
                   which is the picture of a concavity that never changed. The
                   horizontal tangent shows the flattening that is so often
                   mistaken for a change of shape. */
                kind: 'graph', title: 'Graph of f, where f(x) = x⁴', height: 300,
                when: (env) => env.fShown,
                width: 560,
                window: GX.concat([-0.4, 2.4]), gridX: 1, gridY: 1,
                vband: () => ([
                    { from: XWIN[0], to: 0, color: 'color-mix(in srgb, #2FB86A 9%, transparent)' },
                    { from: 0, to: XWIN[1], color: 'color-mix(in srgb, #2FB86A 9%, transparent)' }
                ]),
                curves: [
                    { fn: 'f', from: -1.1, to: 1.1, samples: 320, color: 'curveA', label: 'f(x) = x⁴', labelAt: -1.02 }
                ],
                tangents: [{ fn: 'f', x: 0, color: 'accent', dashed: true }],
                vlines: () => ([{ x: 0, color: 'accent', label: 'x = 0' }]),
                points: () => ([
                    { x: -1, y: fQ(-1), color: 'ink', label: 'f(−1) = ' + dsp(fQ(-1)), labelDx: -10, labelDy: 24 },
                    { x: 0, y: 0, color: 'accent', r: 6, label: 'f(0) = 0', labelDx: 10, labelDy: -12 },
                    { x: 1, y: fQ(1), color: 'ink', label: 'f(1) = ' + dsp(fQ(1)), labelDx: -74, labelDy: 24 }
                ]),
                /* the two words sit in the free strip above both arms of the
                   quartic, one per side of the guide at x = 0 */
                notes: () => ([
                    { x: -0.95, y: 1.7, color: 'up', t: 'concave up' },
                    { x: 0.35, y: 1.7, color: 'up', t: 'concave up' },
                    { x: -0.62, y: 0.55, color: 'auxInk', t: 'concavity does not change at x = 0' }
                ])
            },
            {
                /* The evidence board for the decision flow: three rows, and the
                   concavity word is identical in the two interval rows. It
                   retires once the recap starts, so the column never stacks. */
                kind: 'table', title: 'Concavity check across x = 0',
                when: (env) => env.board,
                cols: ['Where x sits', 'Sign of f″', 'Concavity of f'],
                rows: () => ([
                    [{ v: () => '(−∞, 0)' }, { v: () => 'f″ > 0', color: 'up' }, { v: () => 'concave up', color: 'up' }],
                    [{ v: () => 'x = 0', bold: true }, { v: () => 'f″ = 0', color: 'accent', bold: true }, { v: () => 'the checked boundary', color: 'auxInk' }],
                    [{ v: () => '(0, ∞)' }, { v: () => 'f″ > 0', color: 'up' }, { v: () => 'concave up', color: 'up' }]
                ]),
                note: 'The two interval rows carry the same concavity word, and that is the whole finding. A zero of f″ sits between them, and it separates the two intervals without separating the two shapes.'
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The case on screen',
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x⁴, the function.' },
                        { t: 'f′(x) = 4x³, the first derivative.' },
                        { t: 'f″(x) = 12x², the second derivative this tab reads.', hl: true }
                    ];
                    if (env.marked) out.push({ t: 'Solving f″(x) = 0 gives x = 0, and 12x² is 0 nowhere else.' });
                    if (env.marked) out.push({ t: 'f″(−1) = 12, f″(0) = 0, f″(1) = 12.' });
                    if (env.behavior) out.push({ t: 'f″ > 0 on both sides of 0, so f is concave up on both sides.', hl: true, color: 'up' });
                    if (env.behavior) out.push({ t: 'The zero of f″ was checked, and the check came out the same on both sides.' });
                    return out;
                }
            },
            {
                kind: 'readout', title: 'Test values of f″',
                /* retires on the recap screen, whose four checks restate the same
                   readings, so the column never carries both */
                when: (env) => env.marked && env.stage < 5,
                items: (env) => ([
                    { label: 'f″(−1)', v: () => dsp(fppQ(-1)), color: 'up' },
                    { label: 'f″(0)', v: () => dsp(fppQ(0)), color: 'accent' },
                    { label: 'f″(1)', v: () => dsp(fppQ(1)), color: 'up' },
                    { label: 'Sign left of 0', v: () => 'positive', color: 'up' },
                    { label: 'Sign right of 0', v: () => 'positive', color: 'up' },
                    { label: 'f left of 0', v: () => env.behavior ? 'concave up' : 'not read yet', color: () => env.behavior ? 'up' : 'ink' },
                    { label: 'f right of 0', v: () => env.behavior ? 'concave up' : 'not read yet', color: () => env.behavior ? 'up' : 'ink' },
                    { label: 'Change of concavity at 0', v: () => env.behavior ? 'none' : 'not read yet', color: () => env.behavior ? 'auxInk' : 'ink' }
                ])
            },
            {
                kind: 'note', title: 'Touching, not crossing',
                when: (env) => env.marked && env.stage < 2,
                text: 'The parabola of f″ comes down to 0 at the origin and climbs straight back above it. Touching 0 is not crossing 0, and every x except 0 sits above the axis.'
            },
            {
                kind: 'note', title: 'What f″(0) = 0 does not do',
                /* this card only does its job while the two bands are the live
                   reading, so it retires when the decision flow arrives */
                when: (env) => env.behavior && env.stage < 4,
                text: 'The number line reads + f″ > 0, then f″ = 0, then + f″ > 0 again. That checked boundary is the whole story of this case: f″ equals 0 at x = 0 without crossing 0, so the sign either side is positive and f is concave up either side. An inflection point is a place where the concavity of f changes, and reaching zero is not the same as crossing zero.'
            },
            {
                kind: 'compare', title: 'Two ways to read f″(c) = 0',
                /* the centerpiece: it arrives with the evidence board and it
                   stays for the one screen whose sentences point back at it */
                when: (env) => env.flow,
                sides: () => [
                    {
                        title: 'Wrong', tone: 'wrong',
                        lines: [
                            'f″(c) = 0.',
                            'Therefore c is an inflection point.'
                        ]
                    },
                    {
                        title: 'Correct', tone: 'right',
                        lines: [
                            'f″(c) = 0, so c is a place worth checking.',
                            'Read the concavity on both sides of c.',
                            'Concavity changes at c, so c is an inflection point.',
                            'Concavity does not change at c, so c is not an inflection point.'
                        ]
                    }
                ],
                verdict: 'f″(c) = 0 identifies a place worth checking. The change in concavity is the evidence.'
            },
            {
                kind: 'eq', title: 'How to write the conclusion',
                when: (env) => env.written,
                lines: [
                    { t: 'Since f″ > 0 on (−∞, 0) and f″ > 0 on (0, ∞), f is concave up on both intervals.', hl: true, color: 'up' },
                    { t: 'Because the concavity does not change at x = 0, x = 0 is not an inflection point of f(x) = x⁴.', hl: true, color: 'auxInk' },
                    { t: 'The sentence names the sign of f″ on each interval, then the concavity word on each interval, then the conclusion drawn from the two words matching.' },
                    { t: 'The equation f″(0) = 0 by itself is not a justification.' }
                ]
            },
            {
                kind: 'compare', title: 'The same argument as topic 5.4',
                when: (env) => env.recap,
                sides: () => [
                    {
                        title: 'Topic 5.4 reads f′',
                        lines: [
                            'f′(c) = 0 makes c a critical point.',
                            'It does not make c a local maximum or a local minimum.',
                            'The sign change of f′ across c is the evidence.'
                        ]
                    },
                    {
                        title: 'Topic 5.6 reads f″',
                        lines: [
                            'f″(c) = 0 makes c a place to check.',
                            'It does not make c an inflection point.',
                            'The change in concavity across c is the evidence.'
                        ]
                    }
                ],
                verdict: 'One derivative level higher, the same habit. The zero says where to look, and the two sides say what happens there.'
            },
            {
                kind: 'checklist', title: 'This case in four checks',
                when: (env) => env.recap,
                items: [
                    { t: 'f″(0) = 0, so x = 0 goes on the list of places to check.', state: true },
                    { t: 'Test x = −1 gives f″ = 12, positive, so f is concave up there.', state: true },
                    { t: 'Test x = 1 gives f″ = 12, positive, so f is concave up there too.', state: true },
                    { t: 'Same concavity word on both sides, so there is no inflection point at x = 0.', state: true }
                ],
                verdict: 'The two checks agree, so f(x) = x⁴ is concave up on (−∞, 0) and concave up on (0, ∞), and x = 0 holds no inflection point.',
                verdictOk: true
            },
            {
                kind: 'note', title: 'What this tab does not decide',
                /* the closing card, and the walk ends on its own screen */
                when: (env) => env.recap,
                text: 'Topic 5.6 asks one question about a zero of f″, which is whether the concavity changes there. It never uses the sign or the value of f″ to decide whether a point is a local maximum or a local minimum, and that question belongs to topic 5.7. Here the answer stays inside 5.6: the concavity of f(x) = x⁴ does not change at x = 0, so x = 0 is not an inflection point.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The graph shown is f″(x) = 12x². Where does it equal 0, and what is its sign everywhere else?',
                choices: [
                    'It equals 0 only at x = 0, and it is positive for every other x, so the sign is the same on both sides.',
                    'It equals 0 only at x = 0, and it is negative left of 0, because the graph of f″ is falling as it approaches.',
                    'It equals 0 only at x = 0, and it is positive left of 0 but negative right of 0, because the graph is rising after the touch.'
                ], a: 0,
                whyBy: [
                    'The parabola opens upward with its vertex on the origin, so 12x² is 0 at x = 0 and positive at every other x. The sign either side of that zero is the same, and that is the fact the rest of the tab turns on.',
                    'A falling graph of f″ means the values of f″ are getting smaller, it does not mean f″ is below 0. Left of x = 0 the curve sits above the x-axis the whole way.',
                    'That is the same misreading on the other arm. Rising or falling tells you how the value of f″ travels, and above or below 0 tells you its sign. Here both arms are above 0.'
                ]
            },
            message: 'The markers and the sign chart now agree: f″(−1) = 12, f″(0) = 0 and f″(1) = 12. The graph of f″ touches the x-axis once, at the origin, and stays above it everywhere else, so x = 0 is the only boundary this second derivative offers. Both bands on the number line read f″ > 0, and no concavity of f has been named yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Topic 5.6 reads concavity from the sign of f″: f″ > 0 gives concave up and f″ < 0 gives concave down. Here f″(0) = 0 and f″ is positive on both sides. What does f do as x passes through 0?',
                choices: [
                    'f is concave up left of 0 and concave up right of 0, because the sign of f″ is positive on both sides.',
                    'f switches from concave down to concave up at x = 0, because f″(0) = 0 is where concavity changes.',
                    'f is concave down through x = 0, because f″ is at its smallest value there.'
                ], a: 0,
                whyBy: [
                    'The sign of f″ carries the concavity of f, and a positive sign on both sides gives concave up on both sides. The zero at x = 0 was checked, and the check returned the same answer twice.',
                    'That is the assumption this tab exists to break. f″ = 12x² touches 0 without crossing 0, so both sides keep the positive sign, and a boundary that keeps the sign changes nothing about the shape of f.',
                    'The smallest value of f″ is still a positive value wherever it is above 0, and there is no interval here where f″ is below 0. Being small is not being negative.'
                ]
            },
            message: 'The number line now names the concavity inside each band: concave up on the left of 0 and concave up on the right of it, with the marked boundary 0 sitting between them, where f″ = 0. Nothing changes at x = 0. The graph of f is still off the page, and the next question is what that graph can say about the point.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'The graph of f(x) = x⁴ is about to appear. The sign chart for f″ is already read, so what shape does the curve have on the two sides of x = 0?',
                choices: [
                    'It is concave up on both sides of x = 0, so the two sides carry the same shape and no inflection point sits between them.',
                    'It is concave down left of 0 and concave up right of 0, because f″(0) = 0 marks the switch.',
                    'It is concave down on both sides, because the curve flattens at x = 0.'
                ], a: 0,
                whyBy: [
                    'Concave up on each interval is what the sign chart already said, and the curve shows the same upward opening on either side of the origin. A flat bottom is still an upward opening.',
                    'That answer was decided by f″(0) = 0 alone, before the two sides were compared. Both signs of f″ are positive here, so there is no switch for the curve to show.',
                    'Flattening is a statement about the tangent at one point, and concavity is a statement about the sign of f″ on an interval. Here the tangent goes flat at x = 0 while f″ stays positive on both sides.'
                ]
            },
            message: 'The curve matches the sign chart it was read from: it is concave up on the left of 0, flat at the origin where its tangent is horizontal, and concave up again on the right. The two tinted bands meet at x = 0 as one unbroken band, and that is the picture of a concavity that never changed. The point still has f″(0) = 0, and the next screen asks what that fact is worth.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'The graph of f″, the sign chart and the graph of f now all agree, and f″(0) = 0 is on the record. What does that equation settle about x = 0?',
                choices: [
                    'It settles that x = 0 is a place to check. The change in concavity is the evidence, and the check found none, so x = 0 is not an inflection point.',
                    'It settles that x = 0 is an inflection point, because the second derivative equals 0 there.',
                    'It settles nothing at all, because a second derivative of 0 means the check cannot be carried out.'
                ], a: 0,
                whyBy: [
                    'Solving f″ = 0 puts a candidate on the page. Comparing the concavity word on the two sides is what decides it, and concave up against concave up decides against an inflection point.',
                    'This is the shortcut the tab was built to block. Every part of that argument is true here except the conclusion, and the conclusion needs a change that never happens.',
                    'The check ran and returned an answer. Reading f″ on both sides gave positive and positive, which is a result rather than a failure of the method.'
                ]
            },
            message: 'The Two ways to read f″(c) = 0 card is the argument this case turns on, and the board beside it is the evidence that card rests on: f″ > 0 on (−∞, 0), f″ = 0 at x = 0, and f″ > 0 on (0, ∞). The left column is the reasoning that fails here, and the right column is the reasoning that survives it. x = 0 is not an inflection point of f(x) = x⁴.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Which sentence should a student write to justify the answer?',
                choices: [
                    'Since f″ > 0 on (−∞, 0) and f″ > 0 on (0, ∞), f is concave up on both intervals, so there is no inflection point at x = 0.',
                    'Since f″(0) = 0, the graph of f has an inflection point at x = 0.',
                    'Since f″(x) = 12x² is smallest at x = 0, the concavity of f changes at x = 0.'
                ], a: 0,
                whyBy: [
                    'It names the sign of f″ on each interval, then the concavity word on each interval, then the conclusion drawn from the two words matching. That is the whole justification.',
                    'That sentence skips the comparison, and skipping it is the error this tab was built around. The same wording happens to reach the right conclusion on the first example of topic 5.6, where f″ = 6x does change sign at x = 0, which is why it feels safe and is not.',
                    'The smallest value belongs to the graph of f″, and it is not the check. The check compares the sign of f″ on the two sides of the point, and here those signs agree.'
                ]
            },
            message: 'The How to write the conclusion card turns the board into two sentences. The first states the sign of f″ on each interval and the concavity word for that interval, and the second states the conclusion that follows because the two words match. The core line stays in view: f″(c) = 0 identifies a place worth checking, and the change in concavity is the evidence.'
        },
        {
            params: { stage: 6 },
            message: 'The last card ties this case to topic 5.4. There, f′(c) = 0 makes c a critical point and does not make c a local extremum, and the sign change of f′ across c is the evidence. Here, f″(c) = 0 makes c a place to check and does not make c an inflection point, and the change in concavity across c is the evidence. Same shape of argument, one derivative level higher, and the four checks below restate the whole case for f(x) = x⁴.'
        }
    ],
    summary: SUMMARY
};

export default concavityNoChangeMode;
