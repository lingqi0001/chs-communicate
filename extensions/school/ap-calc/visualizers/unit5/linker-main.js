/* 5.9 Connecting a Function, Its First Derivative, and Its Second Derivative.
   Mode 1, the hero interaction: three stacked graphs of one family share ONE
   x-coordinate. A single draggable xProbe moves a point on all three at once
   and a vertical guide links the same x down the column.

   f(x) = x³ − 3x, f′(x) = 3x² − 3, f″(x) = 6x. The x-window is identical on all
   three panels (about −2.2 ≤ x ≤ 2.2); the y-windows are NOT, because a height
   on f′ is a slope of f and a height on f″ is a slope of f′, so each panel keeps
   its own vertical scale while the shared x column lines the features up.

   5.8 versus 5.9 boundary, kept in the copy too:
     5.8 = "Given derivative information, construct or choose a valid sketch."
     5.9 = "Given several related representations, identify the matching features
            of f, f′ and f″." This mode never asks for a sketch; it reads one x
     across three graphs.

   Reveal discipline (runtime contract): a Predict is asked from the state built
   BEFORE that step's params apply, so every conclusion label, sign band, tangent
   and feature word is gated to a stage that only the step AFTER its own question
   reaches. The graphs alone are data (a height, a dot on the axis); the meaning
   is never printed on a panel before the question that earns it. Nothing is
   gated on an answer, so Next still walks the whole lesson untouched.

   Rigor held from 5.6 and 5.4: f′ = 0 marks a critical point, and only the sign
   change of f′ classifies it as a max or a min; f″ = 0 marks a candidate, and
   only the sign change of f″ gives a concavity change and the inflection point.
   A rounded reading prints with ≈ and an exact one with = . */

const F  = (x) => Math.pow(x, 3) - 3 * x;
const FP = (x) => 3 * x * x - 3;
const FPP = (x) => 6 * x;

const XW0 = -2.2, XW1 = 2.2;          /* the one shared x-window on all three */
const FY = [-4.6, 4.6];               /* f: |f| peaks at x³−3x ≈ 4.05 on the edge */
const FPY = [-4, 12.2];               /* f′: min −3 at 0, up to ≈ 11.5 at the edge */
const FPPY = [-13.8, 13.8];           /* f″: ±13.2 at the edges */

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-12 ? '=' : '≈';
}

/* One shared vertical guide, drawn at xProbe on every visible panel. */
function guide(env) {
    return [{ x: env.xProbe, color: 'ink', dash: false }];
}

export const linkerMainMode = {
    label: 'One x, three readings',
    intro: 'Two graphs are on screen: f(x) = x³ − 3x on top and its first derivative f′(x) = 3x² − 3 below. They sit on the same x-window, so a vertical line at one x cuts through both at the same horizontal place. The shared marker rests at x = −1.5. Read only the height of the f′ marker for now, and answer what that one number says about f at the same x.',
    params: { stage: 0, xProbe: -1.5 },
    controls: [
        { key: 'xProbe', label: 'shared x', min: XW0, max: XW1, step: 0.05, showDigits: 2 }
    ],
    fns: { f: (x) => F(x), fp: (x) => FP(x), fpp: (x) => FPP(x) },
    compute: (env) => {
        const s = env.stage;
        const p = env.xProbe;
        const fv = F(p), dp = FP(p), dd = FPP(p);
        const dirZero = Math.abs(dp) < 0.02;
        const ddZero = Math.abs(dd) < 0.02;
        return {
            /* stage-gated reveals, each set only by the step after its question */
            showA: s >= 1,                       /* height → slope → direction chain */
            showFpp: s >= 3,                     /* the third graph arrives */
            minus1Marks: s >= 2,                 /* tangent + local max at x = −1 */
            plus1Marks: s >= 3,                  /* local min at x = 1 */
            showB: s >= 4,                       /* f″ → slope of f′ → concavity chain */
            zeroMarks: s >= 5,                   /* inflection trio at x = 0 */
            xTxt: rel(p) + ' ' + dsp(p),
            fTxt: rel(fv) + ' ' + dsp(fv),
            fpTxt: rel(dp) + ' ' + dsp(dp),
            fppTxt: rel(dd) + ' ' + dsp(dd),
            dirWord: dirZero
                ? 'a height of 0 on f′'
                : (dp > 0 ? 'f is increasing here' : 'f is decreasing here'),
            concWord: ddZero
                ? 'f″ is 0 at this x'
                : (dd > 0 ? 'f is concave up here' : 'f is concave down here'),
            dirTone: dirZero ? 'auxInk' : (dp > 0 ? 'up' : 'down'),
            concTone: ddZero ? 'auxInk' : (dd > 0 ? 'up' : 'down')
        };
    },
    panes: {
        main: [
            {
                kind: 'note', title: 'How to read the three panels',
                text: 'The graphs share x-coordinates, not y-scales. A vertical guide links the same x across all three panels.'
            },
            {
                kind: 'graph', title: 'Graph 1: f(x) = x³ − 3x',
                height: 300, window: [XW0, XW1, FY[0], FY[1]], gridX: 1, gridY: 2,
                vlines: guide,
                curves: [{ fn: 'f', from: XW0, to: XW1, samples: 600, color: 'curveA' }],
                points: (env) => {
                    const out = [{
                        x: env.xProbe, fn: 'f', r: 6.5, color: 'accent', labelDy: -14,
                        drag: { key: 'xProbe', min: XW0, max: XW1 },
                        label: (e) => 'f ' + e.fTxt
                    }];
                    if (env.minus1Marks) out.push({ x: -1, y: 2, r: 6, color: 'up', labelDx: 8, labelDy: -10, label: 'local maximum (−1, 2)' });
                    if (env.plus1Marks) out.push({ x: 1, y: -2, r: 6, color: 'down', labelDx: 8, labelDy: 16, label: 'local minimum (1, −2)' });
                    if (env.zeroMarks) out.push({ x: 0, y: 0, r: 6.5, color: 'accent', labelDx: 10, labelDy: -12, label: 'inflection point (0, 0)' });
                    return out;
                },
                tangents: (env) => env.minus1Marks
                    ? [{ x: -1, fn: 'f', m: 0, color: 'accent', reach: 0.16, label: 'horizontal tangent at x = −1' }]
                    : [],
                notes: (env) => {
                    const out = [];
                    if (env.zeroMarks) {
                        out.push({ x: -1.3, y: 3.4, t: 'concave down', color: 'down' });
                        out.push({ x: 0.4, y: -3.6, t: 'concave up', color: 'up' });
                    }
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Graph 2: f′(x) = 3x² − 3, the slope of f',
                height: 300, window: [XW0, XW1, FPY[0], FPY[1]], gridX: 1, gridY: 3,
                vlines: guide,
                curves: [{ fn: 'fp', from: XW0, to: XW1, samples: 600, color: 'curveB' }],
                points: (env) => {
                    const out = [{
                        x: env.xProbe, fn: 'fp', r: 6.5, color: 'accent', labelDy: -14,
                        drag: { key: 'xProbe', min: XW0, max: XW1 },
                        label: (e) => 'f′ ' + e.fpTxt
                    }];
                    if (env.minus1Marks) out.push({ x: -1, fn: 'fp', r: 6, color: 'ink', labelDx: 8, labelDy: 16, label: 'f′(−1) = 0' });
                    if (env.plus1Marks) out.push({ x: 1, fn: 'fp', r: 6, color: 'ink', labelDx: 8, labelDy: 16, label: 'f′(1) = 0' });
                    if (env.zeroMarks) out.push({ x: 0, fn: 'fp', r: 6.5, color: 'accent', labelDx: 8, labelDy: 16, label: 'local minimum of f′ (0, −3)' });
                    return out;
                },
                notes: (env) => {
                    const out = [];
                    if (env.minus1Marks) { out.push({ x: -1.9, y: 3.2, t: 'f′ > 0', color: 'up' }); out.push({ x: -0.6, y: 1.2, t: 'f′ < 0', color: 'down' }); }
                    if (env.plus1Marks) { out.push({ x: 0.35, y: 1.2, t: 'f′ < 0', color: 'down' }); out.push({ x: 1.5, y: 3.2, t: 'f′ > 0', color: 'up' }); }
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Graph 3: f″(x) = 6x, the slope of f′',
                when: (env) => env.showFpp,
                height: 300, window: [XW0, XW1, FPPY[0], FPPY[1]], gridX: 1, gridY: 6,
                vlines: guide,
                curves: [{ fn: 'fpp', from: XW0, to: XW1, samples: 400, color: 'curveC' }],
                points: (env) => {
                    const out = [{
                        x: env.xProbe, fn: 'fpp', r: 6.5, color: 'accent', labelDx: 8, labelDy: -8,
                        drag: { key: 'xProbe', min: XW0, max: XW1 },
                        label: (e) => 'f″ ' + e.fppTxt
                    }];
                    if (env.zeroMarks) out.push({ x: 0, fn: 'fpp', r: 6, color: 'ink', labelDx: 8, labelDy: -10, label: 'f″(0) = 0' });
                    return out;
                },
                vband: (env) => {
                    if (!env.zeroMarks) return [];
                    return [
                        { from: XW0, to: 0, color: 'color-mix(in srgb, #FF3B30 10%, transparent)' },
                        { from: 0, to: XW1, color: 'color-mix(in srgb, #2FB86A 10%, transparent)' }
                    ];
                },
                notes: (env) => env.zeroMarks
                    ? [{ x: -1.7, y: -8, t: 'f″ < 0', color: 'down' }, { x: 0.7, y: 7, t: 'f″ > 0', color: 'up' }]
                    : []
            }
        ],
        side: [
            {
                kind: 'readout', title: 'The shared x, read on f and f′',
                when: (env) => env.showA,
                items: [
                    { label: 'same x', v: (e) => e.xTxt, big: true },
                    { label: 'f(x), the height of f', v: (e) => e.fTxt },
                    { label: 'f′(x), the height of f′', v: (e) => e.fpTxt, color: (e) => e.dirTone },
                    { label: 'that height is the slope of f', v: (e) => e.dirWord, color: (e) => e.dirTone }
                ]
            },
            {
                kind: 'machine', title: 'What one height on f′ means',
                when: (env) => env.showA && env.stage <= 2,
                focus: 3,
                stages: [
                    { box: 'height of f′' },
                    { box: 'value of f′(x)' },
                    { box: 'slope of f at x' },
                    { box: 'direction of f at x' }
                ]
            },
            {
                kind: 'readout', title: 'The shared x, read on f″',
                when: (env) => env.showB,
                items: [
                    { label: 'f″(x), the height of f″', v: (e) => e.fppTxt, color: (e) => e.concTone },
                    { label: 'that height is the slope of f′', v: (e) => (Math.abs(FPP(e.xProbe)) < 0.02 ? 'f′ has zero slope here' : (FPP(e.xProbe) > 0 ? 'f′ is increasing here' : 'f′ is decreasing here')), color: (e) => e.concTone },
                    { label: 'so for f', v: (e) => e.concWord, color: (e) => e.concTone }
                ]
            },
            {
                kind: 'machine', title: 'What one height on f″ means',
                when: (env) => env.showB && env.stage <= 4,
                focus: 3,
                stages: [
                    { box: 'height of f″' },
                    { box: 'slope of f′' },
                    { box: 'f′ rising or falling' },
                    { box: 'concavity of f' }
                ]
            },
            {
                kind: 'eq', title: 'The three graphs down one x-column, at x = 0',
                when: (env) => env.zeroMarks,
                lines: [
                    { t: 'f: concave down on the left, concave up on the right, so the point at x = 0 is an inflection point.', hl: true },
                    { t: 'f′: decreasing on the left, increasing on the right, so f′ has a local minimum at x = 0.', color: 'accent' },
                    { t: 'f″: negative on the left, positive on the right, so f″ crosses 0 at x = 0.', hl: true },
                    { t: 'A sign change of f″ gives a change in concavity of f. In this smooth example the same x-value is also where f′ changes from decreasing to increasing.' }
                ]
            },
            {
                kind: 'note', title: 'Two statements this lesson refuses to make', tone: 'warn',
                when: (env) => env.zeroMarks,
                text: 'Not every zero of f″ is an inflection point, and not every critical point of f′ automatically produces an inflection point of f. The evidence is always the sign change on both sides, never the single equation f″ = 0 or f′ = 0 by itself.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1, xProbe: -1 },
            predict: {
                q: 'The f′ marker at x = −1.5 sits above the x-axis. What does that height tell us about the graph of f at the same x?',
                choices: [
                    'f′(x) > 0 there, so the tangent slope of f is positive and f is increasing at that x.',
                    'f′(x) > 0 there, so f itself is above the x-axis and positive at that x.',
                    'The height only locates f′; it carries no information about f.'
                ], a: 0,
                whyBy: [
                    'A height on the f′ graph is exactly one tangent slope of f at the same x. Above the axis means a positive slope, so f is rising there.',
                    'That mixes the sign of f′ with the sign of f. The height answers whether f rises or falls, not whether f is positive.',
                    'That denies the link the whole topic is built on. Here f′(−1.5) = 3.75, and that single number is the slope of f at x = −1.5.'
                ]
            },
            message: 'The height of f′ is the value of f′, the value of f′ is the slope of f, and the sign of that slope is the direction of f. The chain card on the right writes that order. Now the shared x moves to x = −1, where the f′ marker lands right on the x-axis.'
        },
        {
            params: { stage: 2, xProbe: 1 },
            predict: {
                q: 'At x = −1 the f′ marker is on the x-axis, so f′(−1) = 0. What feature must appear on the graph of f at x = −1?',
                choices: [
                    'A horizontal tangent, and with it a critical point of f.',
                    'An inflection point, because f′ passes through zero there.',
                    'A vertical tangent, because f′ is neither positive nor negative.'
                ], a: 0,
                whyBy: [
                    'f′(−1) = 0 says the slope of f at x = −1 is 0, and a slope of 0 is a horizontal tangent. That point is a critical point of f.',
                    'A zero of f′ is not an inflection. An inflection of f is read from a sign change of f″, not from f′ = 0.',
                    'A vertical tangent needs the slope to blow up. A slope of exactly 0 is the flattest a tangent gets, so it is horizontal, not vertical.'
                ]
            },
            message: 'A horizontal tangent is drawn on f at x = −1, and the marker there is a critical point. Reading f′ on both sides: f′ > 0 to the left and f′ < 0 to the right, so f runs up then down. That sign change in f′, not f′ = 0 alone, is what makes (−1, 2) a local maximum. The shared x now jumps to x = 1 for a quick transfer.'
        },
        {
            params: { stage: 3, xProbe: -0.5 },
            predict: {
                q: 'At x = 1 the graph of f′ runs from negative to positive, and f runs from decreasing to increasing. What feature occurs on f at x = 1?',
                choices: [
                    'A local minimum, because f′ changes from negative to positive there.',
                    'A local maximum, because f′ passes through 0 there.',
                    'An inflection point, because the slope is smallest there.'
                ], a: 0,
                whyBy: [
                    'f′ < 0 then f′ > 0 means f falls then rises, which is exactly a local minimum. This mirrors the x = −1 case with the sign order flipped.',
                    'f′ = 0 alone only marks a critical point. Here the change runs negative to positive, which gives a minimum, not a maximum.',
                    'The slope f′ being 0 is not the slope being smallest in the concavity sense; f′ is a parabola whose minimum sits at x = 0, not x = 1.'
                ]
            },
            message: 'The local minimum at (1, −2) is marked, with f′ < 0 on one side and f′ > 0 on the other. That was the same reading as x = −1, one step, no new lesson. Now the third graph is added: f″(x) = 6x. The shared x moves back to an ordinary point, x = −0.5.'
        },
        {
            params: { stage: 4, xProbe: 0 },
            predict: {
                q: 'The new graph is f″(x) = 6x. At a general x, what does the height of the f″ graph tell us?',
                choices: [
                    'It is the slope of the f′ graph at the same x.',
                    'It is the value of f′ at the same x.',
                    'It is the value of f at the same x.'
                ], a: 0,
                whyBy: [
                    'f″ is the derivative of f′, so a height on f″ is the slope of f′, exactly the way a height on f′ was the slope of f.',
                    'That is the height of the f′ graph itself, not of f″. The two graphs are different curves.',
                    'That is the height of the f graph. f″ sits two steps away from f: it is the slope of f′.'
                ]
            },
            message: 'The chain is built one level up: the height of f″ is the slope of f′, the slope of f′ decides whether f′ rises or falls, and the trend of f′ is the concavity of f. The shared x now moves to x = 0, where all three graphs have something to say at once.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Down the shared column at x = 0: on f the point is not a max or a min, on f′ there is a low point, and on f″ the curve crosses zero from negative to positive. Which feature of f lines up with that sign change of f″?',
                choices: [
                    'An inflection point, because f″ changes sign so f changes concavity.',
                    'A local maximum of f.',
                    'A local minimum of f.'
                ], a: 0,
                whyBy: [
                    'f″ < 0 then f″ > 0 means f is concave down then concave up. A change of concavity at a point of f is an inflection point.',
                    'f has no extremum at x = 0. The slope there is f′(0) = −3, which is not 0, so there is no critical point to be a maximum.',
                    'Same reason: f′(0) = −3 is not 0, so x = 0 is not a critical point of f at all. What changes at x = 0 is the concavity, not the direction.'
                ]
            },
            message: 'All three panels now read down one x = 0 column: f flips concave down to concave up, f′ flips decreasing to increasing at its own minimum, and f″ crosses 0. Only the sign change of f″ proves the inflection of f; the equation f″(0) = 0 on its own marks a place worth checking, nothing more.'
        }
    ],
    summary: {
        idea: 'f′ records the slope of f, and f″ records the slope of f′. Because all three graphs share the same x-coordinate, one vertical column reads a matching set of features across the family: a height on f′ is a slope of f, a height on f″ is a slope of f′, and the signs of f′ and f″ give the direction and the concavity of f at the same x.',
        mistake: 'Do not confuse a zero of f′ with a zero of f″. Zeros of f′ mark horizontal tangents and critical points of f, and a sign change of f′ classifies them as a max or a min. A sign change of f″ marks an inflection point of f. Neither conclusion follows from a single equation f′ = 0 or f″ = 0 by itself.',
        transfer: 'For f(x) = x³ − 3x, name the feature that each of x = −1, x = 0 and x = 1 produces on f, on f′ and on f″. Say which sign change, not which zero, is the evidence in each case.'
    }
};

export default linkerMainMode;
