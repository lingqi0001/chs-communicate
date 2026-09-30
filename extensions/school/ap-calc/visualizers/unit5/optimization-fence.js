/* 5.10 Introduction to Optimization Problems, Mode 1: Objective + constraint.
   The hero visual is a fenced rectangle with the river on one side. One x
   slider drives the whole lesson: the same slider that resizes the rectangle
   later moves a point on the area graph, so the student watches geometry and
   objective value at the same time.

   This is INTRODUCTION, model building only. At no screen does the lesson take
   a derivative or solve for the optimum. It ends with an observed value read
   off the model and a bridge to topic 5.11.

   Copy discipline (Predict one is asked before stage 1, Predict two before
   stage 2, and so on):
     - the constraint equation is not printed anywhere until its own reveal;
     - A = xy is never called a one-variable function before its reveal;
     - the substituted expression A(x) = x(40 − 2x) appears only after its
       question;
     - the interval 0 ≤ x ≤ 20 appears only after its question;
     - the maximizing point is not highlighted until the student has been asked
       where the graph looks largest.
   Every teaching card retires on a later stage instead of stacking up.
*/

const FENCE = 40;                                    // total fencing, one side is river
const yOf = (x) => FENCE - 2 * x;                    // constraint solved for y
const AOf = (x) => x * yOf(x);                        // area as a function of the one free choice
const XLO = 0, XHI = FENCE / 2;                       // physical end points of the x slider
const XMAX = FENCE / 4;                               // where the model's graph looks largest, x = 10

/* Two decimals, trailing zeros trimmed, real minus sign. An exact integer keeps
   the equals sign; a rounded value is only ever printed behind ≈. */
function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-9 ? '=' : '≈';
}
const val = (v) => rel(v) + ' ' + dsp(v);

const FILLAREA = 'color-mix(in srgb, var(--text-secondary) 12%, transparent)';

export const optimizationFenceMode = {
    label: 'Objective + constraint',
    intro: 'A farmer has 40 meters of fencing to enclose a rectangular region beside a river. The river forms one side, so fencing is needed on only three sides. Drag the x slider and watch the rectangle respond. This first pass is only about building a model of the situation, not about solving for an answer yet.',
    params: { stage: 0, x: 8 },
    controls: [
        { key: 'x', label: 'fenced side x', min: XLO, max: XHI, step: 0.25, showDigits: 2, unit: ' m' }
    ],
    compute: (env) => {
        const st = env.stage, x = env.x, y = yOf(x), a = AOf(x);
        return {
            obj: st >= 1, con: st >= 2, twoVars: st >= 3 && st < 4, oneVar: st >= 4,
            dom: st >= 5, graph: st >= 6, maxSeen: st >= 7, bridge: st >= 8,
            xTxt: dsp(x), yTxt: dsp(y), aTxt: val(a), yFull: dsp(y), xFull: dsp(x),
            aFull: dsp(Math.round(a * 100) / 100)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                title: (env) => env.con
                    ? 'The fenced region, three fenced sides plus the river side'
                    : 'The fenced region, with the river on one side',
                height: 300, window: [0, 42, 0, 22], grid: false, ticks: false,
                areas: (env) => {
                    const x = env.x, y = yOf(x);
                    return [{ from: 0, to: y, fn: () => 0, topFn: () => x,
                        color: env.obj ? 'fillA' : FILLAREA }];
                },
                segments: (env) => {
                    const x = env.x, y = yOf(x);
                    const fenceColor = env.con ? 'accent' : 'ink';
                    return [
                        { x1: 0, y1: 0, x2: y, y2: 0, color: fenceColor, width: env.con ? 4 : 2.5 },
                        { x1: 0, y1: 0, x2: 0, y2: x, color: fenceColor, width: env.con ? 4 : 2.5 },
                        { x1: y, y1: 0, x2: y, y2: x, color: fenceColor, width: env.con ? 4 : 2.5 },
                        { x1: 0, y1: x, x2: y, y2: x, color: 'curveB', width: 3, dashed: true }
                    ];
                },
                notes: (env) => {
                    const x = env.x, y = yOf(x);
                    return [
                        { x: 0.7, y: x / 2, t: 'x', color: 'accent' },
                        { x: y / 2, y: 0.6, t: 'y', color: 'accent' },
                        { x: y * 0.5, y: x + 0.9, t: 'river, no fence needed', color: 'curveB' }
                    ];
                }
            },
            {
                kind: 'numberline', title: 'Values of x that make a physical rectangle',
                when: (env) => env.dom,
                window: [0, 20], step: 5,
                bands: (env) => [{ from: XLO, to: XHI, color: 'accent', label: '0 ≤ x ≤ 20' }],
                probes: (env) => [{ x: env.x, color: 'ink', label: 'x = ' + dsp(env.x) }]
            },
            {
                kind: 'graph', title: 'Area as a one-variable function, A(x) = x(40 − 2x)',
                when: (env) => env.graph,
                height: 300, window: [0, 21, 0, 212], gridX: 5, gridY: 50,
                curves: [{ fn: (x) => AOf(x), from: XLO, to: XHI, samples: 600, color: 'curveA' }],
                vlines: (env) => env.maxSeen
                    ? [{ x: XMAX, color: 'aux', label: 'x = 10' }]
                    : [],
                points: (env) => {
                    const p = [{ x: env.x, y: AOf(env.x), r: 5.5, color: 'accent',
                        label: 'A ' + val(AOf(env.x)), labelDx: 8, labelDy: 10 }];
                    if (env.maxSeen) {
                        p.push({ x: XMAX, y: AOf(XMAX), r: 7.5, color: 'aux',
                            label: 'highest point', labelDx: -14, labelDy: -14 });
                    }
                    return p;
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'What the model knows',
                items: (env) => {
                    const it = [
                        { label: 'x', v: () => env.xTxt, unit: ' m' },
                        { label: 'y', v: () => env.yTxt, unit: ' m' }
                    ];
                    if (env.obj) it.push({ label: 'area A = xy', v: () => env.aTxt, unit: ' m²', color: 'accent' });
                    if (env.con) it.push({ label: 'fence used, 2x + y', v: () => dsp(FENCE), unit: ' m' });
                    if (env.maxSeen) it.push({ label: 'greatest area on the graph', v: () => dsp(AOf(XMAX)), unit: ' m²', color: 'aux' });
                    return it;
                }
            },
            {
                kind: 'eq', title: 'The model so far',
                when: (env) => env.stage >= 1,
                lines: (env) => {
                    const L = [];
                    if (env.obj) L.push({ t: 'OBJECTIVE: maximize the area of the region. A = xy.' });
                    if (env.con) L.push({ t: 'CONSTRAINT: the fencing is limited to 40 m, and the river needs no fence. 2x + y = 40.' });
                    if (env.twoVars) L.push({ t: 'A = xy still holds both variables, so it is not yet a one-variable function.', dim: true });
                    if (env.oneVar) L.push({ t: 'Use the constraint to remove y: y = 40 − 2x.', hl: true });
                    if (env.oneVar) L.push({ t: 'ONE-VARIABLE OBJECTIVE FUNCTION: A(x) = x(40 − 2x).', hl: true });
                    if (env.dom) L.push({ t: 'FEASIBLE DOMAIN: x and y are lengths, so 0 ≤ x ≤ 20.' });
                    return L;
                }
            },
            {
                kind: 'eq', title: 'The key modeling step',
                when: (env) => env.stage >= 4 && env.stage < 5,
                lines: [
                    { t: 'A = xy' },
                    { t: 'with the constraint y = 40 − 2x', dim: true },
                    { t: '↓ substitute 40 − 2x for y' },
                    { t: 'A(x) = x(40 − 2x)', hl: true }
                ]
            },
            {
                kind: 'note', title: 'The endpoints of the model',
                when: (env) => env.dom && !env.bridge,
                text: 'A rectangle with positive area uses 0 < x < 20. The endpoints are useful model boundaries: at x = 0 there is no fenced side, and at x = 20 the constraint forces y = 40 − 2(20) = 0. Either way the area becomes 0.'
            },
            {
                kind: 'machine', title: 'The optimization pipeline',
                when: (env) => env.maxSeen,
                focus: (env) => env.bridge ? 5 : 4,
                stages: () => [
                    { box: 'Context' }, { box: 'Objective' }, { box: 'Constraint' },
                    { box: 'One-variable objective' }, { box: 'Domain' }, { box: 'Derivative / extrema method' }
                ]
            },
            {
                kind: 'note', title: 'Where this introduction stops',
                when: (env) => env.bridge,
                text: 'Reading the model and the graph, the greatest area seems to occur near x = 10, which gives y = 20 and area A = 200. That value is observed from the model and the graph, not proved with calculus. Now that the model is one variable, derivative tools can locate and justify the optimum. Topic 5.11 performs that process.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'What quantity is the problem trying to make as large as possible?',
                choices: [
                    'The area of the enclosed region.',
                    'The total amount of fencing used.',
                    'The width x.'
                ], a: 0,
                whyBy: [
                    'The region is what grows or shrinks as x changes. Making it as large as possible means making its area xy as large as possible, so the area is the quantity to optimize.',
                    'The fencing is not being maximized. It is fixed at 40 m and cannot grow, which is why it acts as a limit rather than as the goal.',
                    'x is one input we are free to choose, and it is the slider you are dragging. The goal is the area that those choices produce.'
                ]
            },
            message: 'The area is the objective. The model now names it and the readout shows area = xy. Drag x and watch the area value respond as the rectangle changes shape. A = xy is not solved yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Which equation describes the limited resource, the 40 meters of fencing?',
                choices: [
                    '2x + y = 40',
                    'xy = 40',
                    '2x + 2y = 40'
                ], a: 0,
                whyBy: [
                    'Three sides need fence: the two sides of length x and the one side of length y. Their total is 2x + y, and that total equals the 40 m available. So the constraint is 2x + y = 40.',
                    'xy = 40 would mean the area is fixed at 40. It is the fencing, not the area, that is limited, so the fixed quantity belongs on the perimeter terms.',
                    '2x + 2y = 40 is the full perimeter of a rectangle. The river supplies one of the long sides, so that side needs no fence and drops out.'
                ]
            },
            message: 'The three fenced edges are highlighted and 2x + y = 40 is the constraint. It sits in its own panel, beside but separate from the objective. Notice how tightly the two are linked: any change you make to x forces y to follow, because the fencing is fixed.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Why can we not yet treat A = xy as a one-variable calculus function?',
                choices: [
                    'It still contains both x and y, two variables at once.',
                    'Because x can be too large.',
                    'Because the area can be negative.'
                ], a: 0,
                whyBy: [
                    'A one-variable function needs exactly one input. A = xy has two, and they are tied together by the constraint. That tie is what lets us remove one variable next.',
                    'The size of x is not the obstacle. A one-variable formula is a one-variable formula no matter what values x runs through.',
                    'The area is never negative here, since both x and y are lengths. That is not the reason the formula is not yet single-variable.'
                ]
            },
            message: 'A = xy carries two variables, so it is not ready. The next move is to use the constraint to rewrite the objective with only one variable left.'
        },
        {
            params: { stage: 4 },
            message: 'The constraint gives y = 40 − 2x. Substitute that into A = xy and the model becomes the one-variable objective function A(x) = x(40 − 2x). This is the central modeling step: the problem went from a two-variable formula to a single function we can hand to calculus.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Which x-values make a physical rectangle possible?',
                choices: [
                    '0 ≤ x ≤ 20',
                    '0 ≤ x ≤ 40',
                    'any real number x'
                ], a: 0,
                whyBy: [
                    'x is a length, so x ≥ 0. The other side y = 40 − 2x must also be a length, so 40 − 2x ≥ 0, which means x ≤ 20. Together: 0 ≤ x ≤ 20.',
                    'x can reach 20, not 40. At x = 20 the constraint gives y = 0, and any x beyond that would force a negative y, which is not a length.',
                    'The context bounds x. A formula alone accepts any real number, but this x is a physical side, so only 0 ≤ x ≤ 20 makes sense.'
                ]
            },
            message: 'The feasible domain is 0 ≤ x ≤ 20. Drag the slider to either end and the rectangle collapses to a line, showing why the domain stops there. A rectangle with positive area lives strictly inside, for 0 < x < 20.'
        },
        {
            params: { stage: 6 },
            message: 'Now the model is drawn: the same x slider that resizes the rectangle moves a point along the graph of A(x). Try x = 4, a long thin region with modest area; x = 10, a much larger area; x = 18, narrow again. You can feel the area grow, reach a high point, and fall, all without differentiating anything.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'Looking at the model and the objective graph, near which x-value does the greatest area seem to occur?',
                choices: [
                    'Near x = 10',
                    'Near x = 4',
                    'Near x = 18'
                ], a: 0,
                whyBy: [
                    'The high point of the curve sits near x = 10. There the constraint gives y = 40 − 2(10) = 20, and the area is 10 · 20 = 200. This is what the graph shows, not yet a proof.',
                    'At x = 4 the region is long and narrow, and A(4) = 4(40 − 8) = 128. The graph is climbing toward a higher value, so 4 is not where the peak appears.',
                    'At x = 18 the region is narrow again, and A(18) = 18(40 − 36) = 72. That is well below the visible high point near x = 10.'
                ]
            },
            message: 'The graph suggests the greatest area occurs near x = 10, where y = 20 and A = 200. We read that off the model and the picture, and it is labeled as an observation rather than a result proved by calculus.'
        },
        {
            params: { stage: 8 },
            message: 'The pipeline is complete: a context became an objective and a constraint, then a one-variable objective function on a feasible domain, and now it is ready for calculus. Now that the model is one variable, derivative tools can locate and justify the optimum. Topic 5.11 performs that process.'
        }
    ],
    summary: {
        idea: 'Optimization begins by translating a context into mathematics. Identify the quantity to maximize or minimize (the objective), identify what is fixed or limited (the constraint), use the constraint to rewrite the objective as a one-variable function, and restrict that function to the values that make physical sense (the feasible domain).',
        mistake: 'Do not confuse the objective with the constraint, and do not try to differentiate a two-variable formula before using the constraint to reduce the problem to one independent variable.',
        transfer: 'When a new optimization story appears, ask the same questions first: What quantity is being optimized? What is fixed? Which variable represents the choices? What is the feasible domain?'
    }
};

export default optimizationFenceMode;
