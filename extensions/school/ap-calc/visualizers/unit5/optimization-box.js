/* 5.10 Introduction to Optimization Problems, Mode 2: Open-top box.
   A standard 8.5 in by 11 in sheet. Cut a square of side x from each corner and
   fold up the four flaps into an open-top box. Two synced diagrams carry the
   one central idea of this problem: a bigger x raises the box but shrinks both
   base dimensions at the same time. Model building only, never V′ = 0.

   Predict discipline: the volume formula is not printed before the objective
   question is answered; the base expressions 8.5 − 2x and 11 − 2x and the
   substituted V(x) appear only after their step; the interval 0 ≤ x ≤ 4.25 is
   not shown before the domain question.
*/

const SW = 11;          // sheet length (horizontal)
const SH = 8.5;         // sheet width (vertical)
const XHARD = SH / 2;   // the smaller dimension controls: 8.5 − 2x ≥ 0, so x ≤ 4.25
const Vof = (x) => x * (SW - 2 * x) * (SH - 2 * x);

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-9 ? '=' : '≈';
}
const val = (v) => rel(v) + ' ' + dsp(v);

const SHEETFILL = 'color-mix(in srgb, var(--text-secondary) 10%, transparent)';
const CUT = 'color-mix(in srgb, #FF3B30 22%, transparent)';
const BASE = 'color-mix(in srgb, var(--accent) 22%, transparent)';

export const optimizationBoxMode = {
    label: 'Open-top box',
    intro: 'An 8.5 inch by 11 inch sheet. Cut a square of side x from each of the four corners and fold up the flaps to make an open-top box. Drag x and watch the corners grow while the base shrinks. Build the model first.',
    params: { stage: 0, x: 1 },
    controls: [
        { key: 'x', label: 'corner square side x', min: 0, max: XHARD, step: 0.05, showDigits: 2, unit: ' in' }
    ],
    compute: (env) => {
        const st = env.stage, x = env.x;
        const baseW = SH - 2 * x, baseL = SW - 2 * x, V = Vof(x);
        return {
            idea1: st >= 1, obj: st >= 2, dims: st >= 3, dom: st >= 4,
            graph: st >= 5, between: st >= 6, bridge: st >= 7,
            xTxt: dsp(x), hTxt: dsp(x), wTxt: dsp(baseW), lTxt: dsp(baseL),
            vTxt: val(V)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'Top-down sheet, four corners cut out',
                height: 300, window: [0, 11.6, 0, 9.4], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.x;
                    const rects = [
                        { from: 0, to: SW, fn: () => 0, topFn: () => SH, color: SHEETFILL }
                    ];
                    if (x > 0.001) {
                        /* the base region that stays (not cut), then the four corner squares */
                        rects.push({ from: x, to: SW - x, fn: () => x, topFn: () => SH - x, color: BASE });
                        rects.push({ from: 0, to: x, fn: () => 0, topFn: () => x, color: CUT });
                        rects.push({ from: SW - x, to: SW, fn: () => 0, topFn: () => x, color: CUT });
                        rects.push({ from: 0, to: x, fn: () => SH - x, topFn: () => SH, color: CUT });
                        rects.push({ from: SW - x, to: SW, fn: () => SH - x, topFn: () => SH, color: CUT });
                    }
                    return rects;
                },
                notes: (env) => {
                    const x = env.x;
                    const out = [
                        { x: SW / 2, y: 0.3, t: '11 in', color: 'auxInk' },
                        { x: 0.3, y: SH / 2, t: '8.5 in', color: 'auxInk' }
                    ];
                    if (x > 0.001) out.push({ x: x / 2, y: x / 2, t: 'x', color: 'down' });
                    if (env.dims && SH - 2 * x > 0.6) out.push({ x: SW / 2, y: SH / 2, t: 'base 8.5 − 2x by 11 − 2x', color: 'accent' });
                    return out;
                }
            },
            {
                kind: 'graph', title: 'The box folded up, side view',
                height: 210, window: [0, 11.6, 0, 5.2], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.x;
                    if (x < 0.001) return [];
                    return [{ from: x, to: SW - x, fn: () => 0, topFn: () => x, color: BASE }];
                },
                segments: (env) => {
                    const x = env.x;
                    if (x < 0.001) return [
                        { x1: 0, y1: 0, x2: SW, y2: 0, color: 'ink', width: 2.5 }
                    ];
                    return [
                        { x1: x, y1: 0, x2: SW - x, y2: 0, color: 'accent', width: 3 },
                        { x1: x, y1: 0, x2: x, y2: x, color: 'accent', width: 3 },
                        { x1: SW - x, y1: 0, x2: SW - x, y2: x, color: 'accent', width: 3 },
                        { x1: x, y1: x, x2: SW - x, y2: x, color: 'auxInk', width: 1.5, dashed: true }
                    ];
                },
                notes: (env) => {
                    const x = env.x;
                    const out = [];
                    if (x > 0.001) {
                        out.push({ x: x / 2 + 0.15, y: x / 2, t: 'height x', color: 'accent' });
                        out.push({ x: SW / 2, y: 0.28, t: env.dims ? 'base length 11 − 2x' : 'the base', color: 'auxInk' });
                        if (env.obj) out.push({ x: SW / 2, y: x + 0.3, t: 'open top', color: 'auxInk' });
                    }
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Volume as a one-variable function, V(x) = x(8.5 − 2x)(11 − 2x)',
                when: (env) => env.graph,
                height: 300, window: [0, 4.4, 0, 72], gridX: 1, gridY: 20,
                curves: [{ fn: (x) => Vof(x), from: 0, to: XHARD, samples: 600, color: 'curveA' }],
                points: (env) => [{
                    x: env.x, y: Vof(env.x), r: 5.5, color: 'accent',
                    label: 'V ' + val(Vof(env.x)), labelDx: 8, labelDy: 10
                }]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'What the model knows',
                items: (env) => {
                    const it = [{ label: 'x, the cut side', v: () => env.xTxt, unit: ' in' }];
                    if (env.dims) {
                        it.push({ label: 'height', v: () => env.hTxt, unit: ' in' });
                        it.push({ label: 'base width 8.5 − 2x', v: () => env.wTxt, unit: ' in' });
                        it.push({ label: 'base length 11 − 2x', v: () => env.lTxt, unit: ' in' });
                    }
                    if (env.obj) it.push({ label: 'volume V', v: () => env.vTxt, unit: ' in³', color: 'accent' });
                    return it;
                }
            },
            {
                kind: 'note', title: 'One change pulls two ways',
                when: (env) => env.idea1 && !env.obj,
                text: 'A larger x folds the flaps higher, so the box gets taller. But that same larger x also removes more from each base edge, so both base dimensions shrink. One choice helps one part of the volume and hurts two others.'
            },
            {
                kind: 'eq', title: 'The model so far',
                when: (env) => env.obj,
                lines: (env) => {
                    const L = [];
                    if (env.obj) L.push({ t: 'OBJECTIVE: maximize the volume of the open-top box. V = (length)(width)(height).' });
                    if (env.dims) L.push({ t: 'height = x, base width = 8.5 − 2x, base length = 11 − 2x.' });
                    if (env.dims) L.push({ t: 'ONE-VARIABLE VOLUME FUNCTION: V(x) = x(8.5 − 2x)(11 − 2x).', hl: true });
                    if (env.dom) L.push({ t: 'FEASIBLE DOMAIN: the sheet is 8.5 by 11, and 8.5 − 2x ≥ 0, so 0 ≤ x ≤ 4.25.' });
                    if (env.between) L.push({ t: 'V(0) = 0 and V(4.25) = 0, and the volume is positive between them, so the largest volume sits inside the domain.' });
                    return L;
                }
            },
            {
                kind: 'eq', title: 'The key modeling step',
                when: (env) => env.dims && !env.dom,
                lines: [
                    { t: 'V = (length)(width)(height)' },
                    { t: 'height = x, width = 8.5 − 2x, length = 11 − 2x', dim: true },
                    { t: '↓ multiply the three' },
                    { t: 'V(x) = x(8.5 − 2x)(11 − 2x)', hl: true }
                ]
            },
            {
                kind: 'note', title: 'Where this introduction stops',
                when: (env) => env.bridge,
                text: 'The model V(x) = x(8.5 − 2x)(11 − 2x) on 0 ≤ x ≤ 4.25 is built, and its graph shows a clear largest point inside the domain. We have not differentiated anything. Now that the model is one variable, derivative tools can locate and justify the optimum. Topic 5.11 performs that process.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Increasing x makes the box taller. Does that automatically increase its volume?',
                choices: [
                    'No, because increasing x also shrinks both base dimensions.',
                    'Yes, a taller box always holds more.',
                    'Only when the base is left unchanged.'
                ], a: 0,
                whyBy: [
                    'The cut removes x from both ends of each edge, so a larger x raises the height but shortens both base dimensions at the same time. Volume depends on all three, so a taller box does not automatically mean more volume.',
                    'A taller box can be skinnier. Drag x near 4.25 and the base collapses even though the height is at its largest.',
                    'The base is never left unchanged here. Every cut that sets the height also takes that much off each base edge, which is exactly the tradeoff.'
                ]
            },
            message: 'One change pulls two ways. Raising the flaps helps the height but hurts both base edges. This tug of war is why the model has to be built and studied, not guessed.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Which quantity are we maximizing?',
                choices: [
                    'The volume of the box.',
                    'The surface area of the original sheet.',
                    'The height x.'
                ], a: 0,
                whyBy: [
                    'The question asks for the biggest box, and the size of a box is its volume. So volume is the objective, V = (length)(width)(height).',
                    'The sheet is fixed at 8.5 by 11, so its area is a given, not something to maximize.',
                    'x is the choice variable on the slider, not the goal. We are maximizing the volume that a choice of x produces.'
                ]
            },
            message: 'The objective is volume. V = (length)(width)(height). Now the three dimensions have to be written in terms of the single choice x.'
        },
        {
            params: { stage: 3 },
            message: 'The fold sets each dimension from x. Height = x. Each base edge loses a square of side x on both ends, so the base width is 8.5 − 2x and the base length is 11 − 2x. The objective function is V(x) = x(8.5 − 2x)(11 − 2x), a one-variable formula. Nothing is differentiated here.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'How large can x become before the box stops being physically possible?',
                choices: [
                    'x = 4.25, because the 8.5 inch side leaves 8.5 − 2x = 0.',
                    'x = 5.5, because the 11 inch side gives 11 − 2x = 0.',
                    'x can keep growing with no limit.'
                ], a: 0,
                whyBy: [
                    'The cuts come off both ends of each side, so 2x must fit on every side. The 8.5 inch side is the tighter one: 8.5 − 2x ≥ 0 means x ≤ 4.25. That is the hard stop.',
                    'The 11 inch side does allow x up to 5.5, but the box already failed earlier, when the 8.5 inch base edge vanished at x = 4.25. The smaller dimension controls.',
                    'x is bounded by geometry. Past x = 4.25 the 8.5 − 2x base edge would be negative, which is not a length.'
                ]
            },
            message: 'The feasible domain is 0 ≤ x ≤ 4.25. Drag x to 4.25 and the box visibly collapses flat, because the 8.5 − 2x base width becomes 0. Positive volume lives inside, for 0 < x < 4.25.'
        },
        {
            params: { stage: 5 },
            message: 'Now the volume graph appears, and the same x slider that sizes the corners moves a point along it. Small x gives a wide, flat base. Mid-size x is balanced and holds more. Large x is tall but starves the base. The tradeoff you felt in the diagram is now visible as a curve.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Why must the largest volume sit somewhere between the two degenerate endpoints?',
                choices: [
                    'The volume is 0 at both ends and positive for many interior cut sizes.',
                    'The largest x always gives the largest volume.',
                    'The endpoints are where the volume peaks.'
                ], a: 0,
                whyBy: [
                    'At x = 0 there is no height, and at x = 4.25 there is no base, so V = 0 at both. Since V is positive for interior x, the biggest value has to sit between them.',
                    'Largest x gives zero volume here, since the base collapses. The objective value, not the size of the input, is what we compare.',
                    'The endpoints give zero volume. They mark where the box stops existing, not where it is biggest.'
                ]
            },
            message: 'The two endpoints both give volume 0, and interior cuts give a positive volume, so the model tells us the largest volume lies inside the domain. This is a reading of the model, not a formal proof.'
        },
        {
            params: { stage: 7 },
            message: 'The box model is complete: context, objective, one-variable volume function, and feasible domain. Now that the model is one variable, derivative tools can locate and justify the optimum. Topic 5.11 performs that process.'
        }
    ],
    summary: {
        idea: 'Optimization begins by translating a context into mathematics: identify the quantity to maximize or minimize (here, volume), write it as a function of one choice using the geometry, and restrict that function to values that make physical sense (here, 0 ≤ x ≤ 4.25).',
        mistake: 'Do not confuse the objective with the constraint, and do not differentiate a formula before it is reduced to one independent variable. In a box problem, remember that one variable drives two effects at once: it raises the height and shrinks the base.',
        transfer: 'The same questions travel to any story: What quantity is being optimized? What is fixed? Which variable represents the choices? What is the feasible domain?'
    }
};

export default optimizationBoxMode;
