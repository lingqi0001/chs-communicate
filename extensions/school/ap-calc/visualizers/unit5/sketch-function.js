/* 5.8 Mode 1, Build f from derivative clues. The coordinate plane starts EMPTY
   and a skeleton of f grows layer by layer: guides at the zeros of f′, then the
   rising/falling interval bands, then flat-tangent placeholder segments on the
   guides, then the local maximum / local minimum kinds from the sign change,
   then the concavity split at x = 0 with its inflection mark, then a vertical
   shift screen (three graphs share the one f′, only one height can be right),
   then the anchor (0, 0). Only after the skeleton is complete do four candidate
   sketch boards appear, each breaking exactly one real error (B reverses every
   concavity, C swaps the local maximum and minimum, D keeps the shape but misses
   the anchor). The formula f(x) = x³ − 3x is revealed at the final stage as
   "one exact example", never before. No freehand drawing: every layer uses
   existing graph kinds (vlines, vband, segments, points, notes, numberline). */

/* ---------- the hidden function and the given clues ------------------------ */

const G = (x) => Math.pow(x, 3) - 3 * x;        /* hidden f, shown only as one exact example */
const FP = (x) => 3 * x * x - 3;                /* given f′ */
const FPP = (x) => 6 * x;                       /* given f″ */

/* Real minus sign for every displayed number. */
const m = (n) => String(n).replace('-', '−');

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* ---------- candidate sketch shapes (drawn, never named by formula) -------- */

/* B keeps the directions, the flat marks and the anchor but bends the wrong
   way in every region: rising concave up into the −1 mark, falling concave up
   to 0, falling concave down to 1, rising concave down after 1. Piecewise
   quadratics, odd across the origin, continuous everywhere, with the intended
   kinks at the two marks. */
const SKB = (x) => {
    if (x <= -1) { const t = -1 - x; return 2 - 3 * t + 0.8 * t * t; }
    if (x <= 0) { const s = x + 1; return 2 - 3 * s + s * s; }
    if (x <= 1) { return -x - x * x; }
    const u = x - 1; return -2 + 3 * u - 0.8 * u * u;
};
const SKC = (x) => -G(x);                       /* valley at −1, hill at 1 */
const SKD = (x) => G(x) + 1;                    /* right shape, crosses (0, 1) */

/* ---------- shared picture windows ----------------------------------------- */

/* main skeleton plane */
const GX0 = -2.4, GX1 = 2.4, GY0 = -3.8, GY1 = 3.8;
/* numberline window = graph window widened by span/26 per side, which is the
   contract's 27/26 map written from the other end (verified: expanding NLW
   back by its own span/26 returns [GX0, GX1] exactly) */
const NLW = GX1;
/* boards share the numberline pixel map when compared against it on one screen */
const BW = GX1 + (GX1 - GX0) / 26;
/* candidate boards and the shift panel */
const CX0 = -2.2, CX1 = 2.2, CY0 = -3.7, CY1 = 3.7;
const CFROM = -2.05, CTO = 2.05;

const UPFILL = 'color-mix(in srgb, #2FB86A 10%, transparent)';
const DOWNFILL = 'color-mix(in srgb, #FF3B30 10%, transparent)';

/* ---------- one candidate board -------------------------------------------- */

/* Each board is drawn with its three feature markers so the student can read
   the turns, the split point and the y-crossing off the sketch itself. */
function candPane(letter, fnName, revealTitle) {
    const pts = letter === 'D'
        ? [
            { x: -1, y: 3, r: 3.5, color: 'auxInk' },
            { x: 0, y: 1, r: 3.5, color: 'ink', label: '(0, 1)', labelDx: -46, labelDy: -9 },
            { x: 1, y: -1, r: 3.5, color: 'auxInk' }
        ]
        : [
            { x: -1, y: 2, r: 3.5, color: 'auxInk' },
            { x: 0, y: 0, r: 3.5, color: 'ink', label: '(0, 0)', labelDx: -46, labelDy: 15 },
            { x: 1, y: -2, r: 3.5, color: 'auxInk' }
        ];
    return {
        kind: 'graph',
        title: (env) => env.exact ? revealTitle : 'Candidate sketch ' + letter,
        when: (env) => env.judging,
        height: 240, window: [-BW, BW, CY0, CY1], gridX: 1, gridY: 1,
        curves: (env) => [{
            fn: fnName, from: CFROM, to: CTO, samples: 600,
            color: (env.exact && letter === 'A') ? 'curveA' : 'ink',
            emphasis: Boolean(env.exact && letter === 'A')
        }],
        points: () => pts
    };
}

export const buildFunctionMode = {
    label: 'Build f from derivative clues',
    intro: 'The plane on screen is empty on purpose. All you are given are two clue lines, f′(x) = 3x² − 3 and f″(x) = 6x, and this mode keeps the formula of f itself hidden until the very end, so nothing can be copied off an answer graph. Instead the blank plane grows a skeleton of f one constraint at a time: the boundaries where f′ equals 0, the intervals where f rises or falls, the flat tangents, the bending read from f″, and one anchor value that fixes the height. When the skeleton is finished, four candidate sketches appear and you judge them against the constraint list.',
    params: { stage: 0 },
    controls: [],
    fns: {
        ex: (x) => G(x),
        skA: (x) => G(x),
        skB: (x) => SKB(x),
        skC: (x) => SKC(x),
        skD: (x) => SKD(x),
        shUp: (x) => G(x) + 2,
        shMid: (x) => G(x),
        shDown: (x) => G(x) - 2
    },
    compute: (env) => {
        const s = env.stage;
        return {
            guides: s >= 1,
            bands: s >= 2,
            flats: s >= 3,
            named: s >= 4,
            concave: s >= 5,
            shifting: s >= 6,
            anchored: s >= 7,
            judging: s >= 8,
            exact: s >= 9,
            settled: s >= 9
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                title: (env) => env.exact ? 'The finished skeleton with one exact example on it' : 'The blank plane, one constraint per layer',
                height: 330, window: [-BW, BW, GY0, GY1], gridX: 1, gridY: 1,
                vband: (env) => env.bands ? [
                    { from: GX0, to: -1, color: UPFILL },
                    { from: -1, to: 1, color: DOWNFILL },
                    { from: 1, to: GX1, color: UPFILL }
                ] : [],
                vlines: (env) => {
                    const out = [];
                    if (env.guides) {
                        out.push({ x: -1, color: 'auxInk', label: 'x = −1' });
                        out.push({ x: 1, color: 'auxInk', label: 'x = 1' });
                    }
                    if (env.concave) out.push({ x: 0, color: 'auxInk', label: 'x = 0' });
                    return out;
                },
                segments: (env) => (env.flats && !env.exact) ? [
                    { x1: -1.45, y1: 1.65, x2: -0.55, y2: 1.65, color: 'accent', dashed: true },
                    { x1: 0.55, y1: -2.35, x2: 1.45, y2: -2.35, color: 'aux', dashed: true }
                ] : [],
                curves: (env) => env.exact ? [
                    { fn: 'ex', from: CFROM, to: CTO, samples: 600, color: 'curveA', label: 'f(x) = x³ − 3x', labelAt: 1.35 }
                ] : [],
                points: (env) => {
                    const out = [];
                    if (env.anchored) {
                        out.push({
                            x: 0, y: 0, r: 6.5, color: 'accent',
                            label: env.exact ? 'inflection point (0, 0)' : 'anchor f(0) = 0',
                            labelDx: 40, labelDy: -14
                        });
                    }
                    if (env.exact) {
                        out.push({ x: -1, y: 2, r: 5.5, color: 'accent', label: 'local maximum (−1, 2)', labelDx: -40, labelDy: -10 });
                        out.push({ x: 1, y: -2, r: 5.5, color: 'aux', label: 'local minimum (1, −2)', labelDx: -22, labelDy: 22 });
                    }
                    return out;
                },
                notes: (env) => {
                    const out = [];
                    if (env.bands) {
                        out.push({ x: -1.95, y: 2.4, t: 'increasing', color: 'up' });
                        out.push({ x: 0.2, y: 2.4, t: 'decreasing', color: 'down' });
                        out.push({ x: 1.52, y: 2.4, t: 'increasing', color: 'up' });
                    }
                    if (env.named && !env.exact) {
                        out.push({ x: -1.38, y: 1.78, t: 'local maximum', color: 'accent' });
                        out.push({ x: 0.62, y: -2.22, t: 'local minimum', color: 'aux' });
                    }
                    return out;
                }
            },
            {
                kind: 'numberline', title: 'Concavity chart from the sign of f″',
                when: (env) => env.concave,
                width: 560, window: [-NLW, NLW], step: 1,
                bands: () => [
                    { from: -NLW, to: 0, color: 'down' },
                    { from: 0, to: NLW, color: 'up' }
                ],
                probes: () => [
                    { x: -1, color: 'auxInk' },
                    { x: 1, color: 'auxInk' },
                    { x: 0, color: 'accent' }
                ]
            },
            candPane('A', 'skA', 'Candidate sketch A, every constraint holds'),
            candPane('B', 'skB', 'Candidate sketch B, concavities all reversed'),
            candPane('C', 'skC', 'Candidate sketch C, local maximum and local minimum swapped'),
            candPane('D', 'skD', 'Candidate sketch D, the anchor (0, 0) is missed')
        ],
        side: [
            {
                kind: 'eq', title: 'The two given clues',
                lines: (env) => {
                    const out = [
                        { t: 'f′(x) = 3x² − 3', hl: env.stage >= 1 && env.stage <= 3 },
                        { t: 'f″(x) = 6x', hl: env.stage >= 5 && env.stage <= 6 }
                    ];
                    if (env.anchored) out.push({ t: 'Anchor: f(0) = 0.', hl: !env.exact });
                    else out.push({ t: 'One anchor value of f arrives before the candidate sketches.' });
                    if (!env.exact) out.push({ t: 'The formula of f itself stays hidden until the end.', color: 'auxInk' });
                    return out;
                }
            },
            {
                kind: 'eq', title: 'Where f′ equals 0',
                when: (env) => env.guides && env.stage < 3,
                lines: () => [
                    { t: '3x² − 3 = 3(x + 1)(x − 1).' },
                    { t: 'So f′(x) = 0 at x = −1 and at x = 1.', hl: true },
                    { t: 'Those are the only boundaries where the direction of f can change.' }
                ]
            },
            {
                kind: 'table', title: 'One test value per interval',
                when: (env) => env.bands && env.stage < 8,
                cols: ['Interval of x', 'Test x', 'f′(test x)', 'Sign of f′', 'What f does'],
                rows: () => [
                    [
                        { v: () => '(−∞, −1)' },
                        { v: () => m(-2) },
                        { v: () => dsp(FP(-2)) },
                        { v: () => '+', color: 'up', bold: true },
                        { v: () => 'increasing', color: 'up' }
                    ],
                    [
                        { v: () => '(−1, 1)' },
                        { v: () => '0' },
                        { v: () => dsp(FP(0)) },
                        { v: () => '−', color: 'down', bold: true },
                        { v: () => 'decreasing', color: 'down' }
                    ],
                    [
                        { v: () => '(1, ∞)' },
                        { v: () => '2' },
                        { v: () => dsp(FP(2)) },
                        { v: () => '+', color: 'up', bold: true },
                        { v: () => 'increasing', color: 'up' }
                    ]
                ],
                note: 'A positive f′ is a rising f, a negative f′ is a falling f. One test x settles the whole interval because f′ can only change sign at its zeros.'
            },
            {
                kind: 'eq', title: 'From sign changes to turning kinds',
                when: (env) => env.named && env.stage < 6,
                lines: () => [
                    { t: 'At x = −1 the sign of f′ runs from + to −. f rises, then falls: a local maximum.', color: 'accent' },
                    { t: 'At x = 1 the sign of f′ runs from − to +. f falls, then rises: a local minimum.', color: 'aux' }
                ]
            },
            {
                kind: 'eq', title: 'What f″ gives',
                when: (env) => env.concave && env.stage < 7,
                lines: () => [
                    { t: 'f″(x) = 6x is negative for x < 0, so f is concave down there.', color: 'down' },
                    { t: 'f″(x) = 6x is positive for x > 0, so f is concave up there.', color: 'up' },
                    { t: 'The concavity flips at x = 0, so x = 0 carries an inflection point.', hl: true }
                ]
            },
            {
                kind: 'graph',
                title: (env) => env.anchored ? 'Same f′, three heights, only one meets the dot' : 'Same f′, three vertical positions',
                when: (env) => env.shifting && env.stage < 8,
                height: 250, window: [-BW, BW, CY0, CY1], gridX: 1, gridY: 1,
                curves: () => [
                    { fn: 'shDown', from: -1.9, to: 1.9, samples: 600, color: 'aux', label: 'shifted down 2', labelAt: -1.55 },
                    { fn: 'shMid', from: -1.9, to: 1.9, samples: 600, color: 'accent', label: 'middle position', labelAt: -1.55 },
                    { fn: 'shUp', from: -1.9, to: 1.9, samples: 600, color: 'auxInk', label: 'shifted up 2', labelAt: -0.55 }
                ],
                points: (env) => env.anchored ? [
                    { x: 0, y: 0, r: 6.5, color: 'ink', open: true, label: 'the anchor (0, 0)', labelDx: 30, labelDy: -14 }
                ] : [],
                notes: () => [
                    { x: -2.05, y: -3.2, t: 'all three rise, fall, rise alike', color: 'auxInk' }
                ]
            },
            {
                kind: 'note', title: 'Why f′ cannot fix the height',
                when: (env) => env.anchored && env.stage < 9,
                text: 'A vertical shift changes every function value and no slope, so it leaves f′ untouched. The whole graph of f′ can fix the rising, the falling, the flat tangents and the bending, and still say nothing about how high the curve sits. That is why the single fact f(0) = 0 earns its own clue line, it picks one position out of all the shifts.'
            },
            {
                kind: 'checklist', title: 'Constraint check, sketch by sketch',
                when: (env) => env.judging,
                items: (env) => [
                    { t: env.exact ? 'Sketch A, bands, flat marks, turning kinds, concavities and the anchor all hold' : 'Sketch A, checked against the constraint list', state: () => (env.exact ? true : 'na') },
                    { t: env.exact ? 'Sketch B, directions kept but every concavity reversed' : 'Sketch B, checked against the constraint list', state: () => (env.exact ? false : 'na') },
                    { t: env.exact ? 'Sketch C, local minimum at x = −1 and local maximum at x = 1, swapped' : 'Sketch C, checked against the constraint list', state: () => (env.exact ? false : 'na') },
                    { t: env.exact ? 'Sketch D, shape kept but the graph crosses (0, 1), not the anchor' : 'Sketch D, checked against the constraint list', state: () => (env.exact ? false : 'na') }
                ],
                verdict: (env) => env.exact ? 'Sketch A is the only board that satisfies every constraint.' : '',
                verdictOk: () => true
            },
            {
                kind: 'eq', title: 'One exact example',
                when: (env) => env.exact,
                lines: () => [
                    { t: 'f(x) = x³ − 3x', hl: true, color: 'accent' },
                    { t: 'Its derivative is the given 3x² − 3, its second derivative is the given 6x.' },
                    { t: 'And f(0) = 0, so it meets the anchor.' },
                    { t: 'It is one curve your skeleton already forced, in one exact position.' }
                ]
            },
            {
                kind: 'note', title: 'How a qualitative sketch is judged',
                when: (env) => env.exact,
                text: 'The derivative clues determine key behavior. A qualitative sketch is judged by satisfying every constraint, not by matching one exact artistic curve. Sketch A won because it kept the rising and falling bands, the flat tangents at x = −1 and x = 1, the local maximum and minimum kinds, the concave down to concave up split at the inflection, and the anchor (0, 0). It never needed the formula.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The only information on screen is f′(x) = 3x² − 3. Where does f′(x) = 0?',
                choices: [
                    'At x = −1 and at x = 1, because 3x² − 3 factors as 3(x + 1)(x − 1).',
                    'At x = 0 only, because 3 · 0² − 3 is the easiest value to read off.',
                    'At x = 3 and at x = −3, because the coefficient 3 in 3x² − 3 points at them.'
                ], a: 0,
                whyBy: [
                    'Set the factor form to zero: x + 1 = 0 or x − 1 = 0, so the zeros are x = −1 and x = 1. Those are the only x-values where f′ equals 0, so they are the only boundaries the skeleton needs.',
                    'f′(0) = −3, which is not zero, so x = 0 is not a zero of f′. It will matter later for concavity, not here.',
                    'The 3 in 3x² − 3 is a coefficient, not a zero. Solving 3x² − 3 = 0 gives x² = 1, so the two zeros are x = −1 and x = 1.'
                ]
            },
            message: 'Two dashed guides, x = −1 and x = 1, now cross the empty plane and nothing else is drawn. They mark where f′ equals 0, the only places the direction of f can change.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Test values give f′(−2) = 9, f′(0) = −3 and f′(2) = 9. What do these three signs say about f?',
                choices: [
                    'f increases on (−∞, −1), decreases on (−1, 1) and increases on (1, ∞), because the sign of f′ is the sign of the slope of f.',
                    'f decreases on (−∞, −1) and on (−1, 1) and increases on (1, ∞), because the two outer test values are equal.',
                    'f increases on all three intervals, because f′ is built from a square and a square is never negative.'
                ], a: 0,
                whyBy: [
                    'f′(−2) = 9 is positive, f′(0) = −3 is negative, and f′(2) = 9 is positive again. Each sign holds across its whole interval because f′ equals 0 only at the two boundaries, and the sign of f′ is the direction of f.',
                    'f′(−2) = 9 is positive, so f rises on the far left. Equal outer test values say nothing about reversing a sign that is plainly positive.',
                    'The − 3 matters: f′(0) = −3 is negative, so between the guides f falls. A square inside a formula does not make the whole expression positive.'
                ]
            },
            message: 'Three interval bands now shade the plane, rising, falling, rising, and the test value table on the right shows the arithmetic behind each band. This is the first layer of shape, and it came only from the sign of f′.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'A short flat mark is about to appear at x = −1 and another at x = 1. Why exactly those two places?',
                choices: [
                    'Because f′(−1) = 0 and f′(1) = 0, and f′(x) is the slope of f at x, so the tangent of f is flat there and nowhere else.',
                    'Because f(−1) = 0 and f(1) = 0, so the marks sit where f meets the x-axis.',
                    'Because those are the places where f″ changes sign.'
                ], a: 0,
                whyBy: [
                    'f′ is the slope function of f. It equals 0 exactly at x = −1 and x = 1, so a horizontal tangent belongs at those two x-values and at no other. Where the flat marks sit in height is a separate question the clues have not answered yet.',
                    'Nothing on screen fixes f(−1) or f(1), we do not even know f yet. The flat marks come from the derivative being zero, which says nothing about function values.',
                    'f″(x) = 6x changes sign at x = 0, not at −1 or 1. That clue belongs to the next layer.'
                ]
            },
            message: 'Two short dashed segments now lie across the guides. They are placeholders for horizontal tangents: the clues fix where f′ equals 0 but not how high the curve sits there, so the height of each mark on its line carries no information yet.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'At x = −1 the sign of f′ runs from + to −. At x = 1 it runs from − to +. Classify the two flat marks.',
                choices: [
                    'x = −1 is a local maximum and x = 1 is a local minimum, because f changes from rising to falling at −1 and from falling to rising at 1.',
                    'x = −1 is a local minimum and x = 1 is a local maximum.',
                    'Neither mark is a local extremum, because f′ equals 0 at both and a flat tangent rules out a peak.'
                ], a: 0,
                whyBy: [
                    'Rising then falling makes a turning point the top of a hill, and falling then rising makes it the bottom of a valley. The sign pattern + to − at x = −1 gives a local maximum, and − to + at x = 1 gives a local minimum.',
                    'That reverses the two readings. A sign change of + to − is a hilltop, and − to + is a valley bottom.',
                    'f′ = 0 is exactly the signature of the candidates, not a disqualifier. A local maximum has a flat tangent, and the sign change turns each candidate into a real conclusion.'
                ]
            },
            message: 'The two marks now carry their kinds: local maximum on the guide x = −1, local minimum on the guide x = 1. The skeleton has its turning structure, still with no formula for f.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Now use the second clue, f″(x) = 6x. What does its sign give?',
                choices: [
                    'f is concave down for x < 0 and concave up for x > 0, and the flip at x = 0 is an inflection point.',
                    'f is concave up for x < 0 and concave down for x > 0, and the flip at x = 0 is an inflection point.',
                    'There is no concavity information anywhere, because f″(0) = 0.'
                ], a: 0,
                whyBy: [
                    'For a negative x, 6x is negative, and a negative f″ means concave down. For a positive x, 6x is positive, and a positive f″ means concave up. The sign of f″ flips as x crosses 0, and that change of concavity is what makes x = 0 an inflection point.',
                    'The two signs are reversed. At x = −1, f″(−1) = −6, so the graph bends downward on the left half, not upward.',
                    'f″(0) = 0 marks the boundary worth checking, and the check finds the concavity changing there. On each open side the sign of f″ is constant, so the concavity reads perfectly well.'
                ]
            },
            message: 'The guide x = 0 arrives on the plane and the concavity chart under it splits there: the red band left, the green band right, with the flip at x = 0 marked as the inflection. The card "What f″ gives" on the right spells the two bands out in words.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Before the anchor arrives, answer one question: if you knew the entire graph of f′, would you know the exact vertical position of f?',
                choices: [
                    'No. Shifting the graph of f up or down leaves every slope unchanged, so one f′ matches infinitely many vertical positions.',
                    'Yes. The graph of f′ determines the graph of f completely.',
                    'Only if f′ is a parabola does the graph of f′ pin f down.'
                ], a: 0,
                whyBy: [
                    'A vertical shift changes every function value and no slope, and the slope is all f′ records. A function, that function shifted up 2, and that function shifted down 2 share one derivative, because the derivative of a constant is 0.',
                    'Then no anchor would ever be needed. A shifted copy has the same slopes at every x, so f′ cannot tell the copies apart.',
                    'The shift argument works for every function and every f′. The shape of f′ changes nothing about it.'
                ]
            },
            message: 'A new panel shows three vertically shifted graphs, one moved down 2, one in the middle, one moved up 2. All three rise, fall, rise with the same flat tangents and the same bending, so all three agree with every layer drawn so far. Only their heights differ, and the skeleton has no way to choose.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'The clue list now adds the anchor f(0) = 0. Which of the three shifted graphs survives?',
                choices: [
                    'The middle one, it is the only graph that passes through the point (0, 0).',
                    'The upper one, because a taller curve is the safer bet.',
                    'The lower one, because it dips furthest and the local minimum matters more.'
                ], a: 0,
                whyBy: [
                    'At x = 0 the upper copy sits 2 units above the middle one and the lower copy sits 2 units below it. The middle graph is the only one whose height at x = 0 is 0. This reads the shifts off the panel, no formula of f has been named.',
                    'At x = 0 the upper graph sits at height 2. The anchor demands the point (0, 0), so it is out.',
                    'At x = 0 the lower graph sits at height −2, which also misses the anchor. A deep local minimum is not what f(0) = 0 asks for.'
                ]
            },
            message: 'An open dot lands at (0, 0) on the shift panel and the anchor point lands on the skeleton, where only the middle graph meets it. The skeleton is complete: boundaries, directions, flat tangents, turning kinds, concavity split with its inflection, and one fixed point.'
        },
        {
            params: { stage: 8 },
            message: 'Four candidate boards now sit under the skeleton, each one a plausible student sketch. Read each board against every layer you collected before you choose. The constraint check card holds its pen until you answer, and the formula of f still has not appeared.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'Which sketch satisfies every constraint?',
                choices: [
                    'Sketch A. It rises, falls, rises with flat marks at −1 and 1, bends down left of 0 and up right of 0, and passes through (0, 0).',
                    'Sketch B. Its rising and falling is right, but it bends upward left of 0 and downward right of 0.',
                    'Sketch C. It puts the local minimum at x = −1 and the local maximum at x = 1.',
                    'Sketch D. Its whole shape is right, but at x = 0 it crosses 1 unit above the anchor.'
                ], a: 0,
                whyBy: [
                    'Check every layer against A: it rises, falls, then rises, it is flat at x = −1 and at x = 1, its local maximum sits at −1 and its local minimum at 1, it is concave down left of 0 and concave up right of 0, and it runs through (0, 0). A passes the whole list.',
                    'B kept the directions and the turning points but reversed every concavity. Left of 0 it bends upward, contradicting f″(x) < 0 there, and right of 0 it bends downward, contradicting f″(x) > 0.',
                    'C swapped the two kinds, a valley at x = −1 and a hill at x = 1, which contradicts the sign change of f′. It also falls on (−∞, −1) where the skeleton says rise.',
                    'D satisfies every shape constraint and then misses the anchor. Its y-crossing is 1, not 0, so it is a shifted copy of a valid shape.'
                ]
            },
            message: 'Sketch A is the answer. The overlay on the skeleton draws one exact example, f(x) = x³ − 3x, and the check card grades all four boards: B reverses the concavities, C swaps the local maximum and minimum, D keeps every shape layer and misses (0, 0). The example agrees with your skeleton everywhere, and it is the skeleton, not the example, that judged the sketches.'
        }
    ],
    summary: {
        idea: 'A qualitative sketch of f is assembled from constraints, not from an artistic hand. The zeros of f′ give the boundaries, the sign of f′ gives the rising and falling, the sign change gives the local maximum and local minimum, the sign of f″ gives concave down and concave up with the inflection between them, and exactly one anchor value fixes the vertical position. Together those layers determine the behavior of f without ever naming its formula.',
        mistake: 'Do not let the vertical position of f be decided by f′ alone, every vertical shift shares the same derivative, and only an anchor such as f(0) = 0 picks one. A sketch can keep the rising and falling and still fail on reversed concavities, swap the local maximum and minimum, or miss the anchor while bending perfectly. Judge a sketch against the whole constraint list.',
        transfer: 'Keep the same clues, f′(x) = 3x² − 3 and f″(x) = 6x, but move the anchor to f(0) = 1. Every layer of the skeleton stays where it was, only the fixed point changes, so the one valid sketch shifts up 1 unit and the example becomes k(x) = x³ − 3x + 1. Redraw the constraint list on paper with that single change and name what stays and what moves.'
    }
};

export default buildFunctionMode;
