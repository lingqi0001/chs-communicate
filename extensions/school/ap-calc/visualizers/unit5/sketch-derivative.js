/* 5.8 Mode 2, given f, sketch f′. The graph of f is on screen with its formula
   hidden, and the whole lesson derives the derivative skeleton from f's visible
   features: the two horizontal tangents force f′ through (−1, 0) and (1, 0), the
   rising pieces force the f′ graph above the x-axis, and the falling middle
   forces it below. Then a multiple-choice board offers four candidate derivative
   graphs, and the accepted answer stays qualitative because the shape clues
   never fix the vertical scale.

   The strong probe is the heart: drag x on the graph of f, read the tangent
   slope, and watch the point (x, slope) appear in the f′ pane below on the same
   x-window. Parked at x = 0 the moving point lights up (0, −3), and at x = 2 it
   lights up (2, 9). That pairing teaches the sentence the mode exists for: the
   y-coordinate of the derivative graph IS the slope of f at the same x. The
   numerical samples are also what would let the vertical scale be pinned, and
   the distinction between shape-only evidence and number-pinned scale is said
   out loud on its own screen.

   Boundary (contract red line 6): this mode stops at f against f′. The shape of
   f′ is never read as f″ correspondence, because topic 5.9 owns that. The
   formula of f stays hidden throughout; only the derivative's exact matching
   polynomial appears, at the end, as what the probe samples agree with.

   Reveal discipline copies the 5.4 exemplar: one monotone params.stage, every
   reveal rides a step's params, the question for a screen is the next step's
   predict, Next is never gated on an answer, and a finished panel retires on a
   later stage instead of stacking. The draggable-point mechanics, the dsp/rel
   copy mechanics and the color-mix band fills are copied verbatim from
   extrema-critical-points.js and monotonicity-main.js. */

/* ---------- the hidden example ------------------------------------------- */

const FF = (x) => x * x * x - 3 * x;           /* f, never printed as a formula */
const WINX = [-2.35, 2.35];                     /* both panes share this x-window */
const HWIN = [...WINX, -4.5, 10.5];             /* the f′ pane must hold slope 9 */
const FWIN = [...WINX, -4.6, 4.6];              /* the f pane, edges off the ticks */

/* dsp and rel are the unit house copy helpers, verbatim from 5.2 / 5.3.
   dsp rounds to 2 dp, trims, and turns the ASCII minus into the real one.
   rel writes = only when the printed value is exact, ≈ otherwise. */
function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-12 ? '=' : '≈';
}

/* The slope read by the probe is a symmetric difference on f itself, so the
   number is measured from the drawn curve and not a hidden formula. The exact
   slope agrees to far better than 1e-6 on this cubic. */
const slopeAt = (x) => (FF(x + 1e-4) - FF(x - 1e-4)) / 2e-4;

/* Pre-verified probe readings (contract): slope at x = 0 is −3, and slope at
   x = 2 is 9. The lit-up markers below are those two samples. */
const UPFILL = 'color-mix(in srgb, #2FB86A 9%, transparent)';
const DOWNFILL = 'color-mix(in srgb, #FF3B30 9%, transparent)';

/* The two feature crossings on f, and the two forced zeros they imprints on f′. */
const CROSS = [
    { x: -1, y: FF(-1), xName: 'x = −1', word: 'local maximum', tag: 'peak' },
    { x: 1, y: FF(1), xName: 'x = 1', word: 'local minimum', tag: 'valley' }
];

/* The four candidate f′ sketches for the multiple-choice board. All are drawn
   on one shared window so the eye compares shapes, not scales. Each piece of
   plain text below is the flaw or the match, shown only after the Predict. */
const CANDS = [
    {
        key: 'A', fn: (x) => 3 * x * x - 3, from: -1.75, to: 1.75, right: true,
        line: 'Crosses zero at −1 and at 1, opens upward, and sits below the axis between them. Every constraint is met.'
    },
    {
        key: 'B', fn: (x) => 3 - 3 * x * x, from: -1.75, to: 1.75,
        line: 'The sign pattern is inverted: above the axis between −1 and 1 and below outside. That reads the falling middle as positive slope.'
    },
    {
        key: 'C', fn: (x) => 2 * x * x - 2 * x - 1.5, from: -1.5, to: 2.45,
        line: 'Upward-opening, but its zeros sit at −0.5 and at 1.5. The two forced points are in the wrong places.'
    },
    {
        key: 'D', fn: (x) => 3 * Math.pow(x * x - 1, 2), from: -1.55, to: 1.55,
        line: 'It touches the axis at −1 and at 1 without crossing, and stays above elsewhere. That gives positive slope between the zeros, against the falling piece.'
    }
];
const CWIN = [-2.5, 2.5, -7.4, 7.4];

/* One candidate column of the compare grid: title, plain ink curve, and after
   the verdict the match-or-flaw sentence plus the colored border. */
const candSide = (i, env) => {
    const c = CANDS[i];
    const decided = env.stage >= 4;
    return {
        title: 'Candidate ' + c.key,
        tone: decided ? (c.right ? 'right' : 'wrong') : undefined,
        lines: decided ? [c.line] : [],
        graph: {
            window: CWIN, height: 220,
            curves: [{ fn: c.fn, from: c.from, to: c.to, samples: 300, color: 'ink' }]
        }
    };
};
const CAND_PRE = 'All four sketches sit on the same x window. Choose with the skeleton only: zeros at −1 and 1, above the axis outside them, below the axis between them.';

export const sketchDerivativeMode = {
    label: 'Sketch f′ from f',
    intro: 'The picture on screen is the graph of y = f(x), and the formula for f stays hidden on purpose. This curve is the only input. The job is to build the sketch of f′ from what the picture shows, choose the matching candidate from four plain sketches, and then run the probe to see each slope reading land as a point on the f′ graph below.',
    params: { stage: 0, probeX: 0.7 },
    controls: [
        { key: 'probeX', label: 'probe x', min: -2, max: 2, step: 0.02, showDigits: 2, when: (env) => env.stage >= 5 }
    ],
    fns: { f: (x) => FF(x) },
    compute: (env) => {
        const p = env.probeX;
        const raw = slopeAt(p);
        /* the symmetric difference on this cubic carries a ~1e-8 error, so a
           reading that flat is the exact 0 the graph already forces at ±1 */
        const m = Math.abs(raw) < 1e-6 ? 0 : raw;
        const at0 = Math.abs(p) < 0.03;
        const at2 = Math.abs(p - 2) < 0.03;
        const slope = at0 ? -3 : (at2 ? 9 : m);
        const pos = slope > 0.004;
        const flat = Math.abs(slope) <= 0.004;
        return {
            p: p,
            fy: FF(p),
            m: slope,
            at0: at0,
            at2: at2,
            xTxt: (at0 ? '= 0' : (at2 ? '= 2' : rel(p) + ' ' + dsp(p))),
            slopeTxt: (at0 || at2 ? '=' : rel(slope)) + ' ' + dsp(slope),
            ptTxt: '(' + dsp(at0 ? 0 : (at2 ? 2 : p)) + ', ' + dsp(slope) + ')',
            tone: flat ? 'accent' : (pos ? 'up' : 'down'),
            dirWord: flat ? 'f has a horizontal tangent here' : (pos ? 'f is increasing here' : 'f is decreasing here'),
            probing: env.stage >= 5,
            scalePinned: env.stage >= 6
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x), the formula stays hidden', height: 340,
                window: FWIN,
                curves: [{ fn: 'f', from: -2.2, to: 2.2, samples: 600, color: 'curveA' }],
                vlines: (env) => env.stage >= 1 ? CROSS.map(c => ({ x: c.x, color: 'accent', label: c.xName })) : [],
                points: (env) => {
                    const out = [];
                    if (env.stage >= 1) {
                        CROSS.forEach((c, i) => out.push({
                            x: c.x, y: c.y, r: 6, color: 'accent',
                            label: c.tag + ', ' + c.word,
                            labelDx: i === 0 ? -40 : 8, labelDy: i === 0 ? -12 : 22
                        }));
                    }
                    if (env.probing) {
                        out.push({
                            x: env.p, fn: 'f', r: 6.5, color: 'accent',
                            drag: { key: 'probeX', min: -2, max: 2 },
                            labelDy: -16,
                            label: (env) => 'probe x ' + env.xTxt + ', slope ' + env.slopeTxt
                        });
                    }
                    return out;
                },
                tangents: (env) => {
                    const out = [];
                    if (env.stage >= 1 && env.stage < 5) {
                        CROSS.forEach(c => out.push({ x: c.x, y: c.y, m: 0, reach: 0.15, color: 'accent' }));
                    }
                    if (env.probing) {
                        out.push({ x: env.p, y: env.fy, m: env.m, reach: 0.16, color: env.tone, label: (env) => 'slope ' + env.slopeTxt });
                    }
                    return out;
                },
                notes: (env) => env.stage >= 2 && env.stage <= 4 ? [
                    { x: -2.05, y: 3.3, t: 'increasing', color: 'up' },
                    { x: -0.3, y: -3.9, t: 'decreasing', color: 'down' },
                    { x: 1.75, y: 3.3, t: 'increasing', color: 'up' }
                ] : []
            },
            {
                kind: 'graph', title: 'y = f′(x), the sketch being built', height: 340,
                when: (env) => env.stage >= 1,
                window: HWIN,
                vband: (env) => env.stage >= 2 ? [
                    { from: WINX[0], to: -1, color: UPFILL },
                    { from: -1, to: 1, color: DOWNFILL },
                    { from: 1, to: WINX[1], color: UPFILL }
                ] : [],
                curves: (env) => env.stage >= 7 ? [{
                    fn: (x) => 3 * x * x - 3, from: -1.9, to: 1.9, samples: 400,
                    color: 'auxInk', dashed: true, label: 'the shape the samples fix', labelAt: 1.35
                }] : [],
                points: (env) => {
                    const out = [];
                    if (env.stage >= 1) {
                        out.push({ x: -1, y: 0, r: 5.5, color: 'accent', label: 'must pass through (−1, 0)', labelDx: -60, labelDy: -12 });
                        out.push({ x: 1, y: 0, r: 5.5, color: 'accent', label: 'must pass through (1, 0)', labelDx: -8, labelDy: -12 });
                    }
                    if (env.scalePinned) {
                        out.push({
                            x: 0, y: -3, r: env.at0 ? 7 : 5.5, color: env.at0 ? 'accent' : 'aux',
                            label: env.at0 ? 'lit up, slope at x = 0 is −3' : 'sample (0, −3)',
                            labelDx: 60, labelDy: -6
                        });
                        out.push({
                            x: 2, y: 9, r: env.at2 ? 7 : 5.5, color: env.at2 ? 'accent' : 'aux',
                            label: env.at2 ? 'lit up, slope at x = 2 is 9' : 'sample (2, 9)',
                            labelDx: -110, labelDy: -6
                        });
                    }
                    if (env.probing) {
                        out.push({
                            x: env.p, y: env.m, r: 6.5, color: env.tone,
                            labelDy: 18,
                            label: (env) => env.ptTxt
                        });
                    }
                    return out;
                },
                notes: (env) => env.stage >= 2 && env.stage <= 3 ? [
                    { x: -1.75, y: 1.9, t: 'above the axis', color: 'up' },
                    { x: -0.85, y: -2.1, t: 'below the axis', color: 'down' },
                    { x: 1.35, y: 7.3, t: 'above the axis', color: 'up' }
                ] : []
            },
            {
                kind: 'compare', title: 'Candidate f′ sketches, part 1',
                when: (env) => env.stage >= 3 && env.stage <= 6,
                sides: (env) => [candSide(0, env), candSide(1, env)],
                verdict: (env) => env.stage >= 4
                    ? 'Candidate A is the accepted shape. Candidate B inverts the above-below pattern, and its border marks why it fails.'
                    : CAND_PRE
            },
            {
                kind: 'compare', title: 'Candidate f′ sketches, part 2',
                when: (env) => env.stage >= 3 && env.stage <= 6,
                sides: (env) => [candSide(2, env), candSide(3, env)],
                verdict: (env) => env.stage >= 4
                    ? 'Candidate C fails the forced zeros, and Candidate D touches the axis where the sketch must cross it.'
                    : CAND_PRE
            }
        ],
        side: [
            {
                kind: 'eq', title: 'What the features force on f′',
                when: (env) => env.stage >= 1 && env.stage <= 6,
                lines: (env) => {
                    const out = [
                        { t: 'horizontal tangent of f at x = −1  →  f′(−1) = 0' },
                        { t: 'horizontal tangent of f at x = 1  →  f′(1) = 0' }
                    ];
                    if (env.stage >= 2) out.push(
                        { t: 'f increasing on x < −1 and on x > 1  →  f′ > 0 there', color: 'up' },
                        { t: 'f decreasing on −1 < x < 1  →  f′ < 0 there', color: 'down' }
                    );
                    if (env.stage >= 2) out.push({ t: 'Those three readings are the whole skeleton. No height of f was used.', hl: true });
                    return out;
                }
            },
            {
                kind: 'readout', title: 'The probe, one x feeding both panes',
                when: (env) => env.probing,
                items: [
                    { label: 'x', v: (env) => 'x ' + env.xTxt, big: true },
                    { label: 'tangent slope on f', v: (env) => 'slope ' + env.slopeTxt, color: (env) => env.tone },
                    { label: 'what it says about f', v: (env) => env.dirWord, color: (env) => env.tone },
                    { label: 'the point on the f′ graph', v: (env) => env.ptTxt, color: 'accent' }
                ]
            },
            {
                kind: 'eq', title: 'The sentence this pairing teaches',
                when: (env) => env.stage >= 6 && env.stage <= 6,
                lines: [
                    { t: 'y-coordinate on the graph of f′  =  slope of f at the same x', hl: true },
                    { t: 'The probe at x = 0 placed the moving point at (0, −3).' },
                    { t: 'The probe at x = 2 places it at (2, 9).' },
                    { t: 'Both panes share the x window, so a vertical line through the probe dot on f meets the moving point on f′ at the same x.' }
                ]
            },
            {
                kind: 'compare', title: 'What shape clues gave, what samples added',
                when: (env) => env.stage >= 6 && env.stage <= 6,
                sides: () => [
                    {
                        title: 'The shape clues alone settled',
                        lines: [
                            'zeros of the sketch at −1 and at 1',
                            'above the x-axis outside them',
                            'below the x-axis between them',
                            'no commitment to how tall the curve gets'
                        ]
                    },
                    {
                        title: 'The probe samples then fixed',
                        lines: [
                            'slope at x = 0 is −3',
                            'slope at x = 2 is 9',
                            'one upward curve through all four points',
                            'the vertical scale, which the shape clues never supplied'
                        ]
                    }
                ],
                verdict: 'The accepted multiple-choice answer used only the shape column. The number column refines the sketch, it does not re-argue it.'
            },
            {
                kind: 'note', title: 'Where this mode stops',
                when: (env) => env.stage >= 7,
                text: 'This mode pairs f with f′ and stops there. The dashed curve on the f′ pane is the sketch the probe samples agree with, and the formula of f was never needed to build it. What the shape of the f′ graph says about f′′, and the reverse reading, belong to the next topic in this unit, not to this screen.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Read the curve before anything is drawn below it. Where on this graph is the tangent line horizontal?',
                choices: [
                    'At x = −1 and at x = 1, because those are the turning points where the curve stops climbing and stops falling.',
                    'At x = 0, because the curve passes through the origin there and a crossing is a flat spot.',
                    'At the top edge and the bottom edge of the window, because the curve is steepest as it leaves the view.'
                ], a: 0,
                whyBy: [
                    'A turn from climbing to falling, or falling to climbing, flattens the tangent at the moment of the turn. The peak at x = −1 and the valley at x = 1 are exactly those moments.',
                    'Passing through the origin is a statement about height, not about slope. At x = 0 this curve is falling at its steepest rate near the middle, so the tangent is far from horizontal.',
                    'Steepness is the opposite of horizontal. Where the curve leaves the window it is climbing fast, and nothing there is flat.'
                ]
            },
            message: 'The two flat spots are marked now, each with a short horizontal tangent segment. A horizontal tangent means the derivative equals 0 at that x, so the sketch of f′ must contain the points (−1, 0) and (1, 0). The empty f′ pane below shows those two forced zeros, and no shape has been drawn yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The f′ sketch must pass through (−1, 0) and (1, 0). What is the evidence that forces those two points?',
                choices: [
                    'The horizontal tangents of f at x = −1 and x = 1, because f′(c) = 0 exactly where the tangent of f is horizontal.',
                    'The heights f(−1) and f(1), because the peak and the valley hand their y-values straight to the derivative.',
                    'The endpoints of the window, because the sketch has to start and stop somewhere on the axis.'
                ], a: 0,
                whyBy: [
                    'The derivative records slope, and a horizontal tangent is slope 0. Each flat spot on f is therefore a zero on f′ at the same x.',
                    'Heights belong to f. The derivative graph reads the slope of f, not the height of f, so the peak height 2 and the valley height −2 never move down into the f′ sketch as y-values.',
                    'The window edges are a choice of view, not a feature of the curve. Nothing at them forces a zero of f′.'
                ]
            },
            message: 'Evidence on the curve, conclusion on the derivative, same x. Now the second family of features: the curve climbs, then falls, then climbs again. The three colored bands on the f′ pane record what each piece forces, above the axis where f is increasing and below it where f is decreasing.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'f is increasing on x < −1 and on x > 1, and decreasing between −1 and 1. What does that force on the f′ sketch?',
                choices: [
                    'The f′ graph sits above the x-axis for x < −1 and x > 1, and below the x-axis between −1 and 1, because the sign of f′ is the direction of f.',
                    'The f′ graph sits below the x-axis for x < −1 and x > 1, and above it between −1 and 1, because increasing f means negative slope readings.',
                    'The f′ graph must hug the x-axis everywhere, because the direction of f is the same on the two outer pieces.'
                ], a: 0,
                whyBy: [
                    'On an increasing piece the tangent slope is positive, and a positive slope reading is a point above the x-axis on the derivative graph. The falling middle gives the points below it.',
                    'That flips the sign. An increasing piece of f gives f′ > 0, which is above the axis, and the decreasing middle gives f′ < 0, which is below it.',
                    'Same direction on the two outer pieces is a fact about f, not a reason for f′ to flatten. f′ flattens only at the two zeros already forced by the flat tangents.'
                ]
            },
            message: 'The skeleton is complete: zeros at −1 and 1, above the axis outside them, below it between them. Two more panels below the work hold four candidate derivative sketches, part 1 and part 2, all drawn on the same x window. The Predict question asks you to choose from the shape evidence alone.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Choose the candidate that satisfies every constraint of the skeleton. Judge on zeros and on which side of the x-axis the curve sits, nothing else.',
                choices: [
                    'Candidate A, because it opens upward, crosses zero at −1 and at 1, and sits below the x-axis between the two zeros.',
                    'Candidate B, because it crosses zero at −1 and at 1, and its middle arch rises above the axis where the original curve peaks.',
                    'Candidate C, because it opens upward and crosses the axis twice near the forced zeros, so the general shape agrees.',
                    'Candidate D, because it meets the axis exactly at −1 and at 1 and never sinks below it, which keeps the sketch tidy.'
                ], a: 0,
                whyBy: [
                    'The falling middle of f forces f′ < 0 between the zeros, the rising outer pieces force f′ > 0 outside them, and the flat tangents force the two crossings at −1 and 1. Candidate A is the only sketch that does all three.',
                    'The middle arch above the axis claims f′ > 0 between −1 and 1, but there f is decreasing, so every slope reading is negative. This candidate reads the sign pattern upside down.',
                    'Near is not there. The zeros of the sketch are the x-values of the horizontal tangents of f, so crossings at −0.5 and 1.5 contradict the two forced points.',
                    'Touching is not crossing. f changes from increasing to decreasing at −1 and from decreasing to increasing at 1, so f′ changes sign there, and a sketch that stays above the axis at those zeros cannot show a sign change.'
                ]
            },
            message: 'The green-bordered card is the accepted shape. Candidate B put the curve above the axis between the zeros, Candidate C crossed at the wrong x-values, and Candidate D touched the axis without crossing at either forced zero. Every rejection used only zeros and above-below position, and no candidate was judged on how tall it is.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'The verdict stands on shape clues alone. What is one thing those clues never settled about the f′ sketch?',
                choices: [
                    'Its vertical scale, how tall the curve gets away from the zeros, because nothing so far read a numerical slope. Slope samples from a probe could pin that down.',
                    'The x-values where the sketch crosses the axis, because a shape-only reading cannot locate zeros.',
                    'Whether the curve sits above or below the axis between −1 and 1, because shape clues speak only about tangency.'
                ], a: 0,
                whyBy: [
                    'The zeros and the sign pattern fix where the curve crosses and on which side it lives, but an upward-opening sketch through −1 and 1 could be drawn tall or short. A numerical slope sample at one more x would fix the height scale, and the probe is about to take those samples.',
                    'The zeros were located exactly: the horizontal tangents of f named x = −1 and x = 1, and the accepted sketch crosses there and nowhere else.',
                    'That placement was settled twice, first by the bands on the skeleton pane and then by the rejection of Candidate B, which got it inverted.'
                ]
            },
            message: 'The probe is live. Drag the accent point along the curve of f, or move the probe x slider, and three things move at once: the tangent line on f, the slope readout, and a point on the f′ pane below at height equal to that slope. The two panes share the x window, so the moving points stack vertically. Park the probe at x = 0 and read before you answer.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Park the probe at x = 0, by dragging the accent point or the slider. What does the tangent slope read, and which point does that place on the graph of f′?',
                choices: [
                    'The slope reads −3, so the point (0, −3) belongs on the graph of f′, directly below the probe on f.',
                    'The slope reads 0, so (0, 0) sits on the graph of f′, because x = 0 lies between the two turning points.',
                    'The slope reads −3, and the matching point is (−3, 0), because the slope of f becomes the x-coordinate on the graph of f′.'
                ], a: 0,
                whyBy: [
                    'The falling middle is at its steepest near x = 0, and the readout says −3. The derivative graph records slope as height at the same x, so the point is (0, −3), below the x-axis exactly where the band is red.',
                    'Being between two turning points does not make the curve flat there. The tangent at x = 0 is clearly tilted downward, and only at −1 and at 1 does the readout reach 0.',
                    'That swaps the coordinates. The x-coordinate stays the probe x, and the slope becomes the y-coordinate on the derivative graph.'
                ]
            },
            message: 'The point (0, −3) lights up on the f′ pane, inside the below-the-axis band, exactly where the moving probe point parked. Drag the probe to x = 2 and watch the second sample light up the same way. The sentence card states what both panes are showing, and the two-column card separates the shape evidence from what the numbers add.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'At x = 2 the probe reads slope 9, and the sample (2, 9) lights up below. How does that number meet the qualitative answer you already accepted?',
                choices: [
                    'It refines the sketch without re-arguing it, because the accepted shape was already settled by the zeros and the axis sides, and 9 together with (0, −3) fixes the one vertical scale through all four points.',
                    'It overturns the qualitative answer, because an upward-opening curve through (2, 9) cannot also cross zero at −1 and 1.',
                    'It moves where f is increasing, because a larger slope reading makes more of the original curve rise.'
                ], a: 0,
                whyBy: [
                    'The sample adds the missing column from the two-card comparison, the vertical scale. With the forced zeros and the two samples, only one upward curve remains, and the dashed sketch drawn through them matches it. The multiple-choice answer never needed this, and it still stands.',
                    'There is no conflict. An upward-opening curve can pass through (−1, 0), (1, 0) and (2, 9) at once, and the dashed curve on the pane below is exactly that picture.',
                    'The intervals on which f rises or falls are read from the sign of the slope, and one steeper sample changes no sign anywhere on f.'
                ]
            },
            message: 'The final screen retires the candidate boards and draws the accepted shape as a dashed curve on the f′ pane, through the forced zeros and both probe samples. Its matching formula is y = 3x² − 3, and that is a discovery the probe made visible, not a requirement the sketch task ever asked for. The formula of f stayed hidden the entire lesson, and the mode stops at f against f′.'
        }
    ],
    summary: {
        idea: 'A sketch of f′ is built from slope readings of f, never from its heights. A horizontal tangent of f at x = c puts the point (c, 0) on the graph of f′. Where f is increasing, the f′ graph sits above the x-axis, and where f is decreasing, it sits below. The y-coordinate of the f′ graph at x is the slope of f at the same x.',
        mistake: 'Do not confuse the height of f with the slope of f, and do not demand an exact vertical scale from clues that are only about shape. The zeros and the above-below pattern settle the qualitative sketch, and numerical slope samples are what would further pin the scale.',
        transfer: 'The graph of f has a local maximum at x = 0 and a local minimum at x = 2, and no other turning points. Sketch the possible graph of f′: name its forced zeros, and say where it must sit above or below the x-axis. Do not commit to any exact height.'
    }
};

export default sketchDerivativeMode;
