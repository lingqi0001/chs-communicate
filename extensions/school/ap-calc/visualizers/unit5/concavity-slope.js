/* 5.6 Determining Concavity of Functions over Their Domains.
   Mode 1, the teaching mode: concavity is stated as a fact about changing
   tangent slopes, never as a cup that smiles or frowns.

   f(x) = x³ + x, so f′(x) = 3x² + 1 is positive for every x and f is always
   increasing, while f″(x) = 6x is negative left of 0 and positive right of 0.
   The same function therefore runs increasing with concavity flipping at
   (0, 0), which is what separates the two vocabularies. x³ + x is used instead
   of x³ because f′(0) = 1, so the inflection point carries no horizontal
   tangent and the flat tangent is never silently part of the definition.

   Layer order follows the argument, not the picture. The graph of f′ is the
   primary picture and it is the only thing on screen at stage 0, the slope
   samples at −2, −1, 0 and then at 0, 1, 2 are the evidence, f″ = 6x and its
   sign chart arrive after the slope trend is settled because they are the
   shortcut for repeating that check, and the graph of f is confirmation on the
   last screens only. No layer of f is drawn before the concavity claim it
   confirms has been made from derivatives.

   Reveal discipline: one monotone params.stage, and a reveal always lives in
   the same step object as the Predict whose answer it shows, so a stage set in
   step j first paints on screen j+1 and no question is ever shadowed by its own
   answer. On screen i the narration is steps[i-1].message and the open question
   is steps[i].predict. Nothing is gated on an answer, so Next works with every
   question untouched. Cards retire with a ceiling rather than a floor once the
   screen that needed them has passed.

   Boundary of this topic: slope trend, concavity and the inflection point. No
   Second Derivative Test and no classification of local extrema, which is
   topic 5.7. The three slope samples per side are the printed values 13, 4 and
   1, while the shared probe recomputes them, so a rounded reading always prints
   with ≈ and an exact one prints with =. */

const FQ = (x) => Math.pow(x, 3) + x;           /* f */
const DQ = (x) => 3 * x * x + 1;                /* f′, and it never equals 0 */
const DDQ = (x) => 6 * x;                       /* f″ */

const XLO = -2.4, XHI = 2.4;                     /* the x span every layer shows */
const SPAN = XHI - XLO;
const NWIN = [XLO, XHI];                          /* the sign chart keeps the teaching span */
const WX0 = XLO - SPAN / 26;                       /* the graph widens by span/26 per side, */
const WX1 = XHI + SPAN / 26;                       /* which puts both tick rows on one map */
const DMAX = 13.8;                               /* below the sample 13's level plus slack,
                                                    so no tick row sits at label height 14 */
const FD = Math.sqrt((DMAX - 1) / 3);            /* |x| where f′ reaches DMAX */
const XEND = 1.6;                                /* the f plot stops here, |f| = 4.096 */
const FMAX = 4.2;                                /* so no curve is clipped at the edges */

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* A rounded value never gets an equals sign, so the live probe readings say
   ≈ whenever the two-decimal print is not the exact value. */
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-12 ? '=' : '≈';
}

const UPFILL = 'color-mix(in srgb, #2FB86A 9%, transparent)';
const DOWNFILL = 'color-mix(in srgb, #FF3B30 9%, transparent)';

/* The three left samples run 13 → 4 → 1 and the three right samples run the
   same numbers upward. They are printed values, so the = is exact. */
const LSP = [
    { x: -2, txt: 'f′(−2) = 13' },
    { x: -1, txt: 'f′(−1) = 4' },
    { x: 0, txt: 'f′(0) = 1' }
];
const RSP = [
    { x: 0, txt: 'f′(0) = 1' },
    { x: 1, txt: 'f′(1) = 4' },
    { x: 2, txt: 'f′(2) = 13' }
];

/* One band per half. The band text is the sign of f″ first and the concavity
   word it forces once that word has been concluded, and each half of the chart
   is wide enough to hold both on one line. */
const HALVES = [
    { from: NWIN[0], to: 0, iv: '(−∞, 0)', signText: 'f″ < 0', sign: '−', word: 'concave down', dWord: 'f′ decreasing', color: 'down' },
    { from: 0, to: NWIN[1], iv: '(0, ∞)', signText: 'f″ > 0', sign: '+', word: 'concave up', dWord: 'f′ increasing', color: 'up' }
];

export const concavitySlopeMode = {
    label: 'Slope trend and concavity',
    intro: 'The only picture on screen is the graph of y = f′(x) = 3x² + 1, the derivative of f(x) = x³ + x. Nothing has been claimed about where f bends, and the graph of f stays off this screen until the bending has been argued from derivatives. One fact is read off the picture first, on the half where x < 0. As x moves right along that half the graph runs downward, and every height on it is one tangent slope of f.',
    params: { stage: 0, probe: -1.6 },
    controls: [
        { key: 'probe', label: 'x of the shared probe', min: -1.6, max: 1.6, step: 0.05, showDigits: 2, when: (env) => env.stage >= 8 }
    ],
    fns: { f: (x) => FQ(x), fp: (x) => DQ(x), fpp: (x) => DDQ(x) },
    compute: (env) => {
        const s = env.stage;
        const p = env.probe;
        const d = DQ(p);
        const dd = DDQ(p);
        const atZero = Math.abs(p) < 0.005;
        return {
            slopeSamples: s >= 1,
            rightSamples: s >= 2,
            trend1: s >= 1 && s <= 2,
            trend2: s === 2,
            leftDone: s >= 2,
            rightDone: s >= 3,
            bothCard: s === 3,
            shortcut: s === 4,
            marked: s >= 6,
            ddTable: s >= 5 && s <= 7,
            words: s >= 5,
            chainUp: s >= 5 && s <= 7,
            chainDown: s >= 5 && s <= 6,
            fConfirm: s >= 7,
            inflect: s >= 7,
            flat: s === 8,
            probed: s >= 8,
            summaryCard: s >= 9,
            xRel: rel(p) + ' ' + dsp(p),
            dTxt: rel(d) + ' ' + dsp(d),
            ddTxt: rel(dd) + ' ' + dsp(dd),
            signWord: atZero ? 'zero' : (dd > 0 ? 'positive' : 'negative'),
            trendWord: atZero ? 'the boundary between the two halves' : (p < 0 ? 'f′ decreasing' : 'f′ increasing'),
            concWord: atZero ? 'f″ = 0 here, the one place the sign of f″ changes' : (p < 0 ? 'concave down' : 'concave up'),
            probeLabel: atZero
                ? 'the smallest value f′ takes'
                : (p < 0 ? 'concave down' : 'concave up'),
            tone: atZero ? 'auxInk' : (p < 0 ? 'down' : 'up')
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'Primary picture: the graph of y = f′(x) = 3x² + 1',
                height: 320, window: [WX0, WX1, -1.2, DMAX], gridX: 1, gridY: 2,
                hlines: (env) => env.stage === 1
                    ? [{ y: 13, color: 'auxInk', label: 'f′ = 13' }, { y: 4, color: 'auxInk', label: 'f′ = 4' }]
                    : [],
                vband: (env) => {
                    const out = [];
                    if (env.leftDone) out.push({ from: WX0, to: 0, color: DOWNFILL });
                    if (env.rightDone) out.push({ from: 0, to: WX1, color: UPFILL });
                    return out;
                },
                vlines: (env) => {
                    const out = [];
                    if (env.slopeSamples) out.push({ x: -2, color: 'auxInk' }, { x: -1, color: 'auxInk' });
                    if (env.rightSamples) out.push({ x: 1, color: 'auxInk' }, { x: 2, color: 'auxInk' });
                    if (env.leftDone) out.push({ x: 0, color: 'accent', label: 'x = 0' });
                    if (env.probed) out.push({ x: env.probe, color: 'ink', dash: false });
                    return out;
                },
                curves: (env) => {
                    /* the arm being read gets an overlay drawn after the base curve,
                       in the band colour it earns once its conclusion is on screen */
                    const out = [{ fn: 'fp', from: WX0, to: WX1, samples: 700, color: 'curveA' }];
                    if (env.trend1) out.push({ fn: 'fp', from: -FD, to: 0, samples: 400, color: 'auxInk', dashed: true });
                    if (env.trend2) out.push({ fn: 'fp', from: 0, to: FD, samples: 400, color: 'auxInk', dashed: true });
                    if (env.leftDone) out.push({ fn: 'fp', from: -FD, to: 0, samples: 400, color: 'down', width: 3 });
                    if (env.rightDone) out.push({ fn: 'fp', from: 0, to: FD, samples: 400, color: 'up', width: 3 });
                    return out;
                },
                points: (env) => {
                    const out = [];
                    if (env.slopeSamples) LSP.forEach(m => out.push({
                        x: m.x, fn: 'fp', r: 6, color: 'accent', labelDx: 8, labelDy: m.x === 0 ? 16 : -9,
                        label: env.trend1 || env.stage <= 5 ? (m.x === 0 ? 'f′(0) = 1' : m.txt) : ''
                    }));
                    if (env.rightSamples) RSP.slice(1).forEach(m => out.push({
                        x: m.x, fn: 'fp', r: 6, color: 'accent', labelDx: 8, labelDy: -9,
                        label: env.trend2 ? m.txt : ''
                    }));
                    if (env.probed) out.push({
                        x: env.probe, fn: 'fp', r: 6.5, color: 'accent', labelDy: -14,
                        drag: { key: 'probe', min: -1.6, max: 1.6 },
                        label: (env) => env.probeLabel
                    });
                    return out;
                },
                notes: (env) => {
                    const out = [];
                    if (env.leftDone) out.push({ x: -1.55, y: 9.2, t: 'f′ decreasing', color: 'down' });
                    if (env.rightDone) out.push({ x: 0.7, y: 9.6, t: 'f′ increasing', color: 'up' });
                    return out;
                }
            },
            {
                kind: 'numberline', title: 'Sign chart of f″(x) = 6x, on the same x-window and width',
                when: (env) => env.stage >= 5,
                /* the numberline insets 20px and the graph does not, so its window is
                   narrowed to put both layers on one pixel map */
                width: 560, window: NWIN, step: 1,
                bands: (env) => HALVES.map(h => ({
                    from: h.from, to: h.to, color: h.color,
                    /* the sign alone first, then the concavity word it forces, and
                       each half is wide enough to hold both on one line */
                    label: env.marked ? (h.signText + ', ' + h.word) : h.signText
                })),
                probes: (env) => {
                    const out = [{ x: 0, color: 'accent', label: env.marked ? 'x = 0' : '' }];
                    /* the drag marker rides the chart with no label: a label at the
                       probe's own column always collides with the band text, and the
                       chart is where the band text carries the lesson. The probe value
                       is named in the readout instead. */
                    if (env.probed) out.push({ x: env.probe, color: 'ink' });
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Confirmation only: the graph of y = f(x) = x³ + x',
                when: (env) => env.fConfirm,
                height: 320, window: [WX0, WX1, -FMAX, FMAX], gridX: 1, gridY: 2,
                vband: (env) => [
                    { from: WX0, to: 0, color: DOWNFILL },
                    { from: 0, to: WX1, color: UPFILL }
                ],
                vlines: (env) => {
                    const out = [{ x: 0, color: 'accent', label: 'the concavity changes at x = 0' }];
                    if (env.probed) out.push({ x: env.probe, color: 'ink', dash: false });
                    return out;
                },
                curves: [{ fn: 'f', from: -XEND, to: XEND, samples: 700, color: 'curveA' }],
                points: (env) => {
                    const out = [{ x: 0, y: 0, r: 7, color: 'accent', label: 'inflection point (0, 0)', labelDx: 40, labelDy: -14 }];
                    if (env.probed) out.push({
                        x: env.probe, fn: 'f', r: 6.5, color: 'accent', labelDy: 20,
                        drag: { key: 'probe', min: -1.6, max: 1.6 },
                        label: (env) => env.concWord
                    });
                    return out;
                },
                tangents: (env) => env.flat
                    ? [{ x: 0, fn: 'f', m: 1, color: 'accent', reach: 0.16, label: 'slope 1 here, so the tangent is not horizontal' }]
                    : [],
                notes: () => [
                    { x: -1.35, y: 3.4, t: 'concave down', color: 'down' },
                    { x: 0.3, y: 3.4, t: 'concave up', color: 'up' }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'What is on screen',
                /* the reading device card, and it steps aside once both halves have
                   their own trend labels on the picture */
                when: (env) => env.stage < 3,
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x³ + x' },
                        { t: 'f′(x) = 3x² + 1' },
                        { t: 'One height on this graph is one tangent slope of f at the same x. A height above the x-axis is a positive slope, so f rises there.' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'A height below 0 would be a negative slope and f would fall there. This graph never goes below 0, because 3x² + 1 is at least 1.', hl: true });
                    return out;
                }
            },
            {
                kind: 'machine', title: 'The slopes left of 0, read in order as x moves right',
                when: (env) => env.trend1,
                focus: 2,
                stages: LSP.map(m => ({ box: m.txt }))
            },
            {
                kind: 'machine', title: 'The same three values, read the other way on the right of 0',
                when: (env) => env.trend2,
                focus: 2,
                stages: RSP.map(m => ({ box: m.txt }))
            },
            {
                kind: 'compare', title: 'Positive slopes and shrinking slopes',
                /* the screen this mode was built around, and it retires once the
                   right half has been read the same way */
                when: (env) => env.leftDone && env.stage <= 4,
                sides: () => [
                    {
                        title: 'The sign of f′, which is answered first',
                        lines: [
                            'f′(−2) = 13, f′(−1) = 4, f′(0) = 1.',
                            'All three are positive.',
                            'So f is increasing on x < 0.'
                        ]
                    },
                    {
                        title: 'The trend of f′, which is the new reading',
                        lines: [
                            'The same three values run 13, then 4, then 1.',
                            'The slope shrinks as x moves right.',
                            'So f is concave down there while still rising.'
                        ]
                    }
                ],
                verdict: 'Two different questions about one list of numbers. The sign of f′ answers whether f rises or falls, and the trend of f′ answers how the curve bends. A positive slope is not the same thing as concave up, because these three slopes are positive and shrinking.'
            },
            {
                kind: 'eq', title: 'Both halves named from the slope trend',
                when: (env) => env.bothCard,
                lines: [
                    { t: 'Left of 0: f′ > 0 and shrinking, so f is increasing and concave down.', color: 'down', hl: true },
                    { t: 'Right of 0: f′ > 0 and growing, so f is increasing and concave up.', color: 'up', hl: true },
                    { t: 'One function, increasing the whole way, and concave down on one half of it.' }
                ]
            },
            {
                kind: 'eq', title: 'f″(x) = 6x, the derivative of f′',
                when: (env) => env.shortcut,
                lines: [
                    { t: 'f(x) = x³ + x' },
                    { t: 'f′(x) = 3x² + 1', hl: true },
                    { t: 'f″(x) = 6x', hl: true },
                    { t: 'The sign of f″ is the trend of f′. Where f″ is negative the graph of f′ falls, and where f″ is positive the graph of f′ rises.' },
                    { t: 'f″ is negative for x < 0 and positive for x > 0, so x = 0 is the one place worth checking.' }
                ]
            },
            {
                kind: 'table', title: 'The reading that replaces the repeated check',
                when: (env) => env.ddTable,
                cols: ['Interval of x', 'Sign of f″', 'Trend of f′', 'Concavity of f'],
                rows: (env) => HALVES.map(h => {
                    const out = [
                        { v: () => h.iv },
                        { v: () => h.sign, color: h.color, bold: true }
                    ];
                    if (env.chainUp) out.push({ v: () => h.dWord, color: h.color });
                    if (env.words) out.push({ v: () => h.word, color: h.color, bold: true });
                    return out;
                }),
                note: 'The last column is the shape of f. Every entry in it was derived from the sign in the column to its left, and no drawn picture of f was measured to get it.'
            },
            {
                kind: 'machine', title: 'The chain on the left half',
                when: (env) => env.chainDown,
                focus: 2,
                stages: [
                    { box: 'f″(x) < 0' },
                    { box: 'f′ is decreasing' },
                    { box: 'f is concave down' }
                ]
            },
            {
                kind: 'machine', title: 'The chain on the right half',
                when: (env) => env.chainUp,
                focus: 2,
                stages: [
                    { box: 'f″(x) > 0' },
                    { box: 'f′ is increasing' },
                    { box: 'f is concave up' }
                ]
            },
            {
                kind: 'eq', title: 'What makes (0, 0) an inflection point',
                when: (env) => env.inflect && env.stage <= 9,
                lines: [
                    { t: 'Left of 0: f″ < 0, so f is concave down.', color: 'down' },
                    { t: 'Right of 0: f″ > 0, so f is concave up.', color: 'up' },
                    { t: 'The concavity changes at x = 0, and f(0) = 0, so (0, 0) is an inflection point.', hl: true },
                    { t: 'f″(0) = 0 identifies a place worth checking. The change in concavity is the evidence.' }
                ]
            },
            {
                kind: 'note', title: 'A flat tangent is not part of the definition',
                when: (env) => env.flat,
                text: 'The tangent drawn at (0, 0) has slope f′(0) = 1, so it leans upward and is not horizontal. A point where the concavity changes does not have to sit on a flat spot of the curve, and this inflection point does not.'
            },
            {
                kind: 'readout', title: 'Shared probe on all three layers',
                when: (env) => env.probed,
                items: [
                    { label: 'x', v: (env) => env.xRel, big: true },
                    { label: 'f′(x), the slope of f', v: (env) => env.dTxt, color: (env) => env.tone },
                    { label: 'sign of the slope', v: () => 'positive, so f is increasing' },
                    { label: 'trend of f′', v: (env) => env.trendWord, color: (env) => env.tone },
                    { label: 'f″(x)', v: (env) => env.ddTxt, color: (env) => env.tone },
                    { label: 'sign of f″', v: (env) => env.signWord, color: (env) => env.tone },
                    { label: 'concavity of f', v: (env) => env.concWord, color: (env) => env.tone }
                ]
            },
            {
                kind: 'eq', title: 'How to write it down',
                /* the closing card, one screen of its own, and the chains have
                   already stepped aside for it */
                when: (env) => env.summaryCard,
                lines: [
                    { t: 'Since f″(x) < 0 on (−∞, 0), f is concave down on (−∞, 0).', hl: true, color: 'down' },
                    { t: 'Since f″(x) > 0 on (0, ∞), f is concave up on (0, ∞).', hl: true, color: 'up' },
                    { t: 'Since the concavity changes at x = 0 and f(0) = 0, (0, 0) is an inflection point.', hl: true },
                    { t: 'Each sentence names the sign of f″ and the interval it holds on, or the change on both sides of the point. The equation f″(c) = 0 by itself is not a justification.' },
                    { t: 'The same discipline as topic 5.4, one level up. There, f′(c) = 0 marked a critical point and the signs on both sides decided it. Here, f″(c) = 0 marks a candidate and the signs of f″ on both sides decide the concavity change.' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'A height on this graph is the tangent slope of f at the same x. On the half where x < 0 the graph runs downward as x moves right. What is happening to the tangent slopes of f there?',
                choices: [
                    'They are becoming smaller, because each of those heights is the slope of f at the same x.',
                    'They are becoming larger, because the graph is still above the x-axis on that half.',
                    'They stay the same, because the same formula f′(x) = 3x² + 1 holds at every x.'
                ], a: 0,
                whyBy: [
                    'A height on this picture is a slope of f at that x, so heights falling means slopes falling. Left of 0 the tangent to f gets flatter as x moves right.',
                    'That reads the direction of this graph as its sign. Sitting above the x-axis says the value is positive, and running downward says the value is shrinking. Both are true at once, and they answer two different questions.',
                    'One formula can hold everywhere and still return different values. This one returns 13 at x = −2 and 4 at x = −1, and a slope that changes value from one x to the next is what a falling graph of f′ looks like.'
                ]
            },
            message: 'Three points are marked on the descending arm, and the values are printed with them: f′(−2) = 13, f′(−1) = 4, f′(0) = 1. Each one is the slope of the tangent to f at that x, so the slopes on this half shrink from 13 to 4 to 1 as x moves right. The dashed overlay thickens the part of the graph under reading, and the trend card prints the same three values in order.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The function is still increasing there, because all three of these slopes are positive. But the slopes are getting smaller. Which concavity describes that?',
                choices: [
                    'Concave down, because the slopes shrink from 13 to 4 to 1, and shrinking tangent slopes are what concave down means.',
                    'Concave up, because all three slopes are positive and a positive slope bends a curve upward.',
                    'Neither yet, because the graph of f has not been drawn on screen.'
                ], a: 0,
                whyBy: [
                    'Concavity is read from how the slopes change, not from whether they are positive. Shrinking slopes bend a rising curve over, which is concave down.',
                    'That is the mix-up this screen exists to break. The sign of these values says f rises, and the trend of the same values says how the curve bends. Positive and shrinking together is increasing and concave down.',
                    'The shape has already been settled from derivatives, which is the point of the topic. The graph of f arrives at the end as confirmation only, because reading a shape off a drawn curve is the habit this method replaces.'
                ]
            },
            message: 'Concave down on the left half, and the red column marks that half on the derivative graph. The same three values now appear on the right half in the other order, f′(0) = 1, f′(1) = 4, f′(2) = 13, so the two halves can be read against each other. The card Positive slopes and shrinking slopes keeps the two readings apart.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'On the right half the slopes run 1, then 4, then 13. What does that trend say about the shape of f there?',
                choices: [
                    'f is concave up there, because the tangent slopes grow as x moves right.',
                    'f is concave down there, because the slopes are still positive.',
                    'Nothing except that f is increasing, because f′ never changes sign.'
                ], a: 0,
                whyBy: [
                    'Growing slopes are the whole content of concave up. These grow from 1 to 4 to 13, so the curve steepens as it rises.',
                    'Positive is the sign, and the sign of f′ gives increase. Concave down needs shrinking slopes, and these grow.',
                    'A sign that never changes fixes the direction of f and says nothing about the bend. The trend of f′ is a second reading of the same values, and that reading is what gives concavity.'
                ]
            },
            message: 'The right half is concave up, the green column marks it, and the two halves now carry the same reading in opposite directions, increasing and concave down on the left, increasing and concave up on the right. Both trend cards retire because the picture states the two directions on its own, the point at x = 0 keeps its label f′(0) = 1, the card beside the graph explains why no height can fall below 1, and the Both halves card names the pair.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Re-reading the trend of f′ works every time, and there is a faster test. The derivative of f′ is written f″, and here f″(x) = 6x. What sign does f″ have on the left half, where x < 0?',
                choices: [
                    'Negative, because 6x is negative whenever x is negative, and a negative f″ means f′ is decreasing there.',
                    'Positive, because 6x grows as x moves right through the left half.',
                    'Zero at x = −1, because the slope there is 4, which is neither large nor small.'
                ], a: 0,
                whyBy: [
                    'f″ is the rate of change of f′. Six times a negative x is negative, so every value on the left half sits below 0, and f″ < 0 is the same fact as f′ decreasing.',
                    'That compares the trend of f″ with its sign. On this half 6x does grow as x moves right, and it stays negative the whole way, so the sign never flips before x = 0.',
                    'That pairs a value of f′ with a sign of f″, which are two different quantities. f′(−1) = 4 says nothing about f″(−1) = −6.'
                ]
            },
            message: 'f″(x) = 6x is on screen with the one line that makes it useful, which is that the sign of f″ is the trend of f′. The card also names x = 0 as the single place worth checking, because that is the only x where 6x passes through 0. The graph of f is still off the screen.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'f″(x) = 6x is negative for every x < 0 and positive for every x > 0. Which half of the domain is concave down, and which is concave up?',
                choices: [
                    'Concave down on (−∞, 0) where f″ < 0, and concave up on (0, ∞) where f″ > 0.',
                    'Concave up on (−∞, 0) where f″ < 0, and concave down on (0, ∞) where f″ > 0.',
                    'Concave down on both halves, because f′ stays positive everywhere.'
                ], a: 0,
                whyBy: [
                    'f″ < 0 means f′ is decreasing, and decreasing slopes give concave down. f″ > 0 means f′ is increasing, and increasing slopes give concave up. The two chains on the right print that order.',
                    'That pairs each sign with the opposite shape. A negative f″ is a decreasing f′, which is shrinking slopes, which is concave down.',
                    'The sign of f′ fixes the direction of f, not its bend. Both halves here have positive f′, and they bend in opposite ways.'
                ]
            },
            message: 'The sign chart of f″(x) = 6x is drawn on the same x-window and the same width as the derivative graph above it, so the two bands line up with the two columns. The table prints the whole reading in one row per half: the sign of f″, the trend of f′ it forces, and the concavity that follows. Neither band label nor column claims anything about x = 0 yet.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Read the two bands of the sign chart against each other. Where does the concavity of f change?',
                choices: [
                    'At x = 0, the one place where f″ changes sign from negative to positive.',
                    'Nowhere, because f is increasing across the whole domain.',
                    'At x = −1 and at x = 1, because those are where the equal slopes 4 and 4 sit.'
                ], a: 0,
                whyBy: [
                    'A change of concavity needs the sign of f″ to switch, and 6x switches only at x = 0. The bands read f″ < 0 then f″ > 0, with 0 between them.',
                    'Those are two separate questions, and this example keeps them apart on purpose. f increases everywhere because f′ is positive everywhere, and the concavity still flips at x = 0.',
                    'Those two x-values are where the slope samples happen to sit, and the sign of f″ is negative on both sides of −1 and positive on both sides of 1. No change is available at either one.'
                ]
            },
            message: 'Each band of the chart now carries the concavity word its sign forces, and a mark sits at x = 0 because f″(0) = 0. That is the only x where the sign of f″ is neither negative nor positive, and the open question is what that single fact is worth.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'The mark at x = 0 comes from f″(0) = 0. What does that equation prove about x = 0 by itself?',
                choices: [
                    'Nothing by itself. It marks x = 0 as worth checking, and the sign of f″ on the two sides is the evidence.',
                    'It proves x = 0 is an inflection point, because a zero of f″ is the definition of one.',
                    'It proves f has no inflection point, because f″ vanishes at only one x.'
                ], a: 0,
                whyBy: [
                    'A zero of f″ is a candidate. Concavity is a claim about both sides of a point, so the evidence is the sign of f″ left of it and right of it, and here that reads negative then positive.',
                    'That is the inference this topic refuses to draw. For f(x) = x⁴ the value f″(0) = 0 holds with concave up on both sides and no inflection point at all, so a zero of f″ cannot be the definition.',
                    'Counting the zeros of f″ is not a test. Here there is one zero and the sign of f″ changes across it, so an inflection point does sit at x = 0.'
                ]
            },
            message: 'The graph of f arrives last, as the confirmation layer, and it agrees with what the derivatives already said: the curve bends downward left of 0 and upward right of 0. Since f(0) = 0, the point where the concavity changes is (0, 0), and that change is why it is an inflection point. Nothing on this curve was measured to build the chart above it.'
        },
        {
            params: { stage: 8 },
            predict: {
                q: 'The slope at the inflection point is f′(0) = 1. What does that prove about inflection points?',
                choices: [
                    'An inflection point needs no horizontal tangent. The slope here is 1, and the concavity changes anyway.',
                    'An inflection point needs f′ = 0, so this point stays a candidate until the tangent flattens.',
                    'Some point near an inflection point must have a horizontal tangent, so f has one nearby.'
                ], a: 0,
                whyBy: [
                    'Only the concavity has to change. f′(0) = 1 is a rising tangent sitting exactly at the inflection point, which is why this example uses x³ + x rather than x³, whose flat tangent at 0 would smuggle in an extra condition.',
                    'That adds a condition the definition does not contain, and it would throw away a real inflection point on this curve.',
                    'Nothing nearby has to be flat. f′(x) = 3x² + 1 is never 0, so this f has no horizontal tangent anywhere, and the inflection point is still there.'
                ]
            },
            message: 'The tangent drawn at (0, 0) leans upward because its slope is 1, and the card beside it says a flat tangent is not part of the definition. A shared probe is now live on all three layers, and it moves from x = −1.6 to x = 1.6 on the slider or by dragging either dot.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'A reader should accept one of these three sentences as a justification. Which one?',
                choices: [
                    'Since f″(x) < 0 on (−∞, 0), f is concave down on (−∞, 0).',
                    'Since f′(x) > 0 everywhere, f is concave up everywhere.',
                    'Since f″(0) = 0, f has an inflection point at x = 0.'
                ], a: 0,
                whyBy: [
                    'It names a sign of f″, the interval it holds on, and the concavity that follows. That is one link of the chain written as one sentence.',
                    'That uses the sign of f′, which decides rising or falling, to decide a bend. On this curve f′ is positive everywhere while the concavity flips at 0, so the sentence gets this very function wrong.',
                    'It skips the change on both sides, which is the evidence. The claim happens to be true here, and the sentence that proves it names the sign of f″ left of 0 and right of 0.'
                ]
            },
            message: 'The closing card writes all three conclusions in that order, and the chains have stepped aside. It also states the parallel with topic 5.4, which is the same discipline one level up: f′(c) = 0 marks a critical point worth testing, and f″(c) = 0 marks a candidate worth testing. Topic 5.6 stops at the concavity change.'
        }
    ],
    summary: {
        idea: 'Concavity is a statement about changing tangent slopes. Where f″(x) < 0 the derivative f′ is decreasing and f is concave down, and where f″(x) > 0 the derivative f′ is increasing and f is concave up. On f(x) = x³ + x the slopes are positive everywhere, so f rises the whole way while its bend flips at (0, 0), and that flip is what makes the point an inflection point.',
        mistake: 'Two shortcuts go wrong here. Reading concavity from the sign of f′ gives a rising curve that must be concave up, and this f rises across a half where it is concave down. Concluding an inflection point from f″(c) = 0 also goes wrong, because f(x) = x⁴ has f″(0) = 0 with concave up on both sides of 0 and no inflection point there. A change in concavity is the evidence, and an inflection point never requires a horizontal tangent.',
        transfer: 'For f(x) = x³ − 3x the derivative is f′(x) = 3x² − 3 and the second derivative is f″(x) = 6x. Which intervals is f concave down on, which is it concave up on, where is the inflection point, and is the tangent there horizontal?'
    }
};

export default concavitySlopeMode;
