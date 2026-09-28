/* 3.2 Implicit Tangent Lab — an implicit equation ties x and y together along a
   curve, so differentiating a y-term must account for the way y moves with x.
   The draggable point stays on the relation, and the tangent shows the slope
   that the implicit derivative predicts. A relation is not one global function:
   the same x value can carry two points on two branches, each with its own
   slope, and the formula also names the points where no finite slope exists. */

const n = v => String(Math.round(v * 1000) / 1000);
const slopeText = m => Number.isFinite(m) ? 'dy/dx = ' + n(m) : 'vertical tangent';
/* a signed number written with the typographic minus, so copy never mixes it
   with the hyphen that String() produces */
const sn = v => (v < 0 ? '−' : '+') + n(Math.abs(v));

/* circle x² + y² = 25 */
const R = 5;
/* ellipse x² + xy + y² = 7: solve as a quadratic in y
   y = (−x ± √(28 − 3x²)) / 2, real for |x| ≤ √(28/3) ≈ 3.055 */
const eY = x => (-x + Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;
const eYlo = x => (-x - Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;
/* the vertical line x = bX meets the circle twice: the local branch picture */
const bX = 3;
const bUp = Math.sqrt(R * R - bX * bX);   /* 4 */
const bLo = -bUp;                         /* −4 */
const bName = env => env.ebranch === 'lower' ? 'lower' : 'upper';

function state(env) {
    if (env.kase === 'circle') {
        const rad = env.theta * Math.PI / 180;
        const x = R * Math.cos(rad);
        let y = R * Math.sin(rad);
        /* sin(180°) is 1e-16, not 0. Left alone that hands the label a slope of
           8e15 at the very point that has no finite slope, so the y = 0 read is
           taken with a tolerance. */
        if (Math.abs(y) < 1e-9) { y = 0; return { x, y, m: x >= 0 ? -Infinity : Infinity }; }
        return { x, y, m: -x / y };
    }
    const x = env.ex, y = env.ebranch === 'lower' ? eYlo(x) : eY(x);
    return { x, y, m: -(2 * x + y) / (x + 2 * y) };
}

/* The differentiation is colour-coded all the way through: terms that carry only
   x (green) versus terms that carry y, and therefore dy/dx (orange).
   Gating is monotonic in stage: below stage 2 the pane stays a moving point
   story (x changes, y changes too) so that the first predict is not answered on
   screen. The d/dx lines appear only on the screen that explains the answer. */
function derivLines(env) {
    const s = state(env);
    const L = [];
    L.push({
        t: env.kase === 'circle' ? 'x² + y² = 25' : 'x² + xy + y² = 7',
        rule: 'the relation that ties x and y'
    });
    if (env.stage < 2) {
        L.push({ t: 'x changes', color: 'curveC' });
        L.push({ t: 'y changes too', color: 'curveB' });
        L.push({ t: 'Drag point P and both numbers move together', rule: 'what the graph shows' });
    }
    if (env.kase === 'circle') {
        if (env.stage > 1) {
            L.push({ t: 'd/dx(x²) = 2x', color: 'curveC' });
            L.push({ t: 'd/dx(y²) = 2y · dy/dx', color: 'curveB' });
            L.push({ t: '2x + 2y · dy/dx = 0', hl: true, rule: 'differentiate both sides' });
        }
        if (env.stage > 2) L.push({ t: 'dy/dx = −x / y', hl: true, color: 'accent' });
        if (env.stage > 3) {
            L.push({
                t: Number.isFinite(s.m)
                    ? 'At (' + n(s.x) + ', ' + n(s.y) + '):  dy/dx = ' + n(s.m)
                    : 'At (' + n(s.x) + ', ' + n(s.y) + '):  −x / y divides by zero, so dy/dx has no value. The tangent is vertical.',
                color: 'auxInk'
            });
            L.push({ t: 'Check: x² + y² = ' + n(s.x * s.x + s.y * s.y), color: 'auxInk' });
        }
        return L;
    }
    if (env.stage > 1) {
        L.push({ t: 'd/dx(x²) = 2x', color: 'curveC' });
        L.push({ t: 'd/dx(xy) = y + x · dy/dx', color: 'curveB', rule: 'product rule' });
        L.push({ t: 'd/dx(y²) = 2y · dy/dx', color: 'curveB' });
        L.push({ t: '2x + y + x · dy/dx + 2y · dy/dx = 0', hl: true });
    }
    if (env.stage > 2) L.push({ t: 'dy/dx = −(2x + y) / (x + 2y)', hl: true, color: 'accent' });
    if (env.stage > 3) {
        L.push({ t: 'At (' + n(s.x) + ', ' + n(s.y) + '):  dy/dx = ' + n(s.m), color: 'auxInk' });
        L.push({
            t: 'P follows the ' + bName(env) + ' branch. Check: x² + xy + y² = '
                + n(s.x * s.x + s.x * s.y + s.y * s.y),
            color: 'auxInk'
        });
    }
    return L;
}

export default {
    id: 'u3-implicit-tangent',
    meta: { unit: 3, topic: '3.2', title: 'Implicit Differentiation', visualizerTitle: 'Implicit Tangent Lab' },
    intro: 'This equation does not say y equals something in x. When you drag point P, the value of y moves with it. So y is tied to x along the curve, and that tie decides what happens the moment you differentiate.',
    params: { kase: 'circle', theta: 45, ex: 1.2, ebranch: 'upper', stage: 0, broken: 0, local: 0 },
    controls: [
        {
            key: 'kase', label: 'relation', kind: 'choice',
            options: [
                { v: 'circle', label: 'x² + y² = 25' },
                { v: 'ellipse', label: 'x² + xy + y² = 7' }
            ]
        },
        { key: 'theta', label: 'point angle', unit: '°', min: 0, max: 360, step: 1, showDigits: 0, when: env => env.kase === 'circle' },
        { key: 'ex', label: 'point x', min: -2.8, max: 2.8, step: 0.01, when: env => env.kase === 'ellipse' },
        {
            key: 'ebranch', label: 'branch point P follows', kind: 'choice',
            options: [
                { v: 'upper', label: 'upper branch' },
                { v: 'lower', label: 'lower branch' }
            ],
            when: env => env.kase === 'ellipse'
        }
    ],
    fns: {
        cTop: x => Math.sqrt(Math.max(0, 25 - x * x)),
        cBot: x => -Math.sqrt(Math.max(0, 25 - x * x)),
        eTop: eY,
        eBot: eYlo
    },
    compute: env => state(env),
    panes: {
        main: [
            {
                kind: 'graph', width: 430, height: 430,
                title: env => env.kase === 'ellipse'
                    ? 'Both branches are drawn, and P follows the ' + bName(env) + ' branch'
                    : (env.local > 0.5
                        ? 'One x value, two points on the circle'
                        : 'The curve, with the tangent at point P'),
                window: env => env.kase === 'circle' ? [-6.4, 6.4, -6.4, 6.4] : [-4.4, 4.4, -4.4, 4.4],
                curves: env => env.kase === 'circle'
                    ? [{ fn: 'cTop', color: 'curveA' }, { fn: 'cBot', color: 'curveA' }]
                    : (env.ebranch === 'lower'
                        ? [{ fn: 'eTop', color: 'auxInk' }, { fn: 'eBot', color: 'curveA', emphasis: true }]
                        : [{ fn: 'eTop', color: 'curveA', emphasis: true }, { fn: 'eBot', color: 'auxInk' }]
                    ),
                vlines: env => env.local > 0.5 && env.kase === 'circle'
                    ? [{ x: bX, label: 'x = ' + bX, color: 'auxInk' }]
                    : [],
                points: env => {
                    /* On the local branch screen the draggable point P, its radius and
                       its tangent all leave the stage, so the only highlighted points
                       are the two where the fixed line x = 3 meets the circle. */
                    if (env.kase === 'circle' && env.local > 0.5) {
                        return [
                            {
                                x: bX, y: bUp, color: 'curveC', r: 5, labelDy: -12,
                                label: '(' + bX + ', ' + n(bUp) + '), upper branch'
                            },
                            {
                                x: bX, y: bLo, color: 'curveB', r: 5, labelDy: 22,
                                label: '(' + bX + ', ' + sn(bLo) + '), lower branch'
                            }
                        ];
                    }
                    return [{
                        x: env.x, y: env.y, drag: env.kase === 'circle'
                            ? {
                                key: 'theta',
                                transform: (e2, val) => {
                                    const a = Math.acos(Math.max(-1, Math.min(1, val / R))) * 180 / Math.PI;
                                    return e2.y >= 0 ? a : 360 - a;
                                }
                            }
                            : { key: 'ex', min: -2.8, max: 2.8 },
                        color: 'accent', r: 6,
                        label: 'P = (' + n(env.x) + ', ' + n(env.y) + ')'
                            + (env.kase === 'ellipse' ? ', ' + bName(env) + ' branch' : '')
                    }];
                },
                segments: env => env.kase === 'circle' && env.local <= 0.5
                    ? [{ x1: 0, y1: 0, x2: env.x, y2: env.y, color: 'auxInk', dashed: true }]
                    : [],
                tangents: env => {
                    /* P's own tangent is hidden on the local branch screen, and the two
                       x = 3 tangents only appear at local = 2. So the first of those
                       screens leaves two bare points and asks the prediction. */
                    const inBranch = env.kase === 'circle' && env.local > 0.5;
                    const T = inBranch ? [] : [{ x: env.x, y: env.y, m: env.m, color: 'down', label: slopeText(env.m) }];
                    if (env.kase === 'circle' && env.local > 1.5) {
                        T.push({
                            x: bX, y: bUp, m: -bX / bUp, color: 'curveC', reach: 0.2,
                            label: 'slope = ' + sn(-bX / bUp)
                        });
                        T.push({
                            x: bX, y: bLo, m: -bX / bLo, color: 'curveB', reach: 0.2,
                            label: 'slope = ' + sn(-bX / bLo)
                        });
                    }
                    return T;
                }
            },
            {
                kind: 'eq',
                title: env => env.stage > 1
                    ? 'Green terms come from x, orange terms contain y'
                    : 'Green is x, orange is y',
                lines: env => derivLines(env)
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Values at point P',
                when: env => !(env.kase === 'circle' && env.local > 0.5),
                items: env => {
                    const rows = [
                        { label: 'x', v: env.x, color: 'curveC' },
                        { label: 'y', v: env.y, color: 'curveB' },
                        { label: 'dy/dx', v: Number.isFinite(env.m) ? env.m : 'vertical', big: true, color: 'down' }
                    ];
                    if (env.kase === 'circle') rows.push({ label: 'x² + y², which must equal 25', v: env.x * env.x + env.y * env.y, color: 'auxInk' });
                    if (env.kase === 'ellipse') rows.push({ label: 'branch P follows', v: bName(env), color: 'auxInk' });
                    return rows;
                }
            },
            {
                kind: 'table', title: 'y changes whenever x moves',
                when: env => env.kase === 'circle',
                rows: env => {
                    const samples = [0, 45, 90, 135, 180, 225, 270, 315];
                    const rows = samples.map(a => {
                        const r = a * Math.PI / 180;
                        return { a, x: R * Math.cos(r), y: R * Math.sin(r) };
                    });
                    /* the point angle runs a whole turn, so the distance to a sample is
                       measured around the circle. A plain difference would mark the 315°
                       row when the point sits at 360°, which is really the same spot as 0°. */
                    const dist = a => { const d = Math.abs(a - env.theta); return Math.min(d, 360 - d); };
                    const cur = rows.reduce((best, r) => dist(r.a) < dist(best.a) ? r : best, rows[0]);
                    return rows.map(r => [
                        r.a + '°',
                        { v: Math.round(r.x * 100) / 100, color: 'curveC' },
                        { v: Math.round(r.y * 100) / 100, color: 'curveB' },
                        r === cur ? { v: 'here', color: 'accent' } : ''
                    ]);
                },
                note: 'Every row satisfies x² + y² = 25. When the point moves, both x and y change. So y cannot be treated as a constant.'
            },
            {
                kind: 'compare', title: 'Treating y as a constant',
                when: env => env.broken > 0.5 && env.kase === 'circle',
                sides: [
                    {
                        title: 'y held constant like a number', tone: 'wrong',
                        lines: ['d/dx(y²) = 0', 'then 2x = 0', 'Only true where x = 0, and no slope anywhere else']
                    },
                    {
                        title: 'y changing along with x', tone: 'right',
                        lines: [
                            'd/dx(y²) = 2y · dy/dx',
                            'then dy/dx = −x / y',
                            'The formula gives the finite tangent slope wherever y is not zero, and it names the vertical tangents where y = 0'
                        ]
                    }
                ],
                verdict: 'Treating y as a constant removes the whole curve. Look at the table: each row pairs one x value with one y value, and the marked row moves as point P moves.'
            },
            {
                kind: 'compare', title: 'One x value, two branches',
                when: env => env.local > 1.5 && env.kase === 'circle',
                sides: [
                    {
                        title: 'Upper branch at (3, 4)',
                        lines: [
                            'x = 3 and y = 4',
                            'dy/dx = −3 / 4 = ' + sn(-bX / bUp),
                            'The tangent falls here.'
                        ]
                    },
                    {
                        title: 'Lower branch at (3, −4)',
                        lines: [
                            'x = 3 and y = −4',
                            'dy/dx = −3 / −4 = ' + sn(-bX / bLo),
                            'The tangent rises here.'
                        ]
                    }
                ],
                verdict: 'Both points satisfy x² + y² = 25, and the same formula hands them opposite slopes. So dy/dx depends on the branch the point sits on, and the relation never has to be solved as one global function y = f(x).'
            },
            {
                kind: 'note',
                when: env => env.kase === 'ellipse',
                text: env => 'The relation draws two branches, and point P follows the ' + bName(env)
                    + ' branch. Use the branch control to move P to the other one. The formula dy/dx = −(2x + y) / (x + 2y) is the same on both branches, because it was never solved for y.'
            },
            {
                kind: 'practice', id: 'u3-implicit-transfer', title: 'The same method on a new curve',
                when: env => env.kase === 'ellipse',
                items: [
                    {
                        q: 'Differentiate x² + xy + y² = 7 with respect to x. Which differentiated terms contain dy/dx?',
                        choices: [
                            'The terms xy and y². Both contain y, and y changes with x.',
                            'Only the y² term. The term xy adds no dy/dx.',
                            'None of them. dy/dx appears only after you solve.'
                        ], a: 0,
                        whyBy: [
                            'Along the curve y is a function of x. So d/dx(y²) = 2y · dy/dx, and the product rule on xy gives y + x · dy/dx.',
                            'The term xy multiplies two quantities that both depend on x, so the product rule puts dy/dx into one of its two parts.',
                            'Solving does gather the dy/dx terms together. But each dy/dx factor appears while differentiating, not afterward.'
                        ]
                    },
                    {
                        q: 'On the curve x² + xy + y² = 7, what is dy/dx at the point (1, 2)?',
                        choices: [
                            'It is −4/5.',
                            'It is −1/2. This comes from differentiating only the two squared terms.',
                            'It is 4/5. The minus sign was dropped.'
                        ], a: 0,
                        whyBy: [
                            '−(2 · 1 + 2) / (1 + 2 · 2) = −4/5, so the tangent slopes downward at that point.',
                            'That answer ignores the term xy. The product rule gives y + x · dy/dx for that term.',
                            'The minus sign comes from moving the terms without dy/dx to the other side, so it stays in the answer.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'This curve is not written as y equals something. It is a condition the two coordinates must satisfy, so point P can only move along the curve.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The term y² contains y, not x. Differentiate it with respect to x. What do you get?',
                choices: [
                    'It is 2y. That is the power rule on y squared.',
                    'It is 2y · dy/dx. The value of y changes with x along the curve.',
                    'It is 2x. The derivative is taken with respect to x.'
                ], a: 1,
                whyBy: [
                    'That is the power rule with the wrong variable. Along the curve y changes when x changes, so y² needs the chain rule.',
                    'Along the curve y changes when x changes, so y² needs the chain rule. The power rule gives 2y, and the dependence of y on x gives dy/dx.',
                    'That is the derivative of x², not of y². Each term is differentiated on its own, and the results are added.'
                ]
            },
            message: 'The value of y changes with x, so d/dx(y²) = 2y · dy/dx. Differentiating both sides gives 2x + 2y · dy/dx = 0.'
        },
        {
            params: { stage: 3 },
            message: 'Now solve for dy/dx. The result −x/y is the slope of the circle at point P. Green terms came from x, and orange terms came from y.'
        },
        {
            params: { stage: 4, theta: 90 },
            predict: {
                q: 'Move point P to the top of the circle, where x = 0 and y = 5. What does the tangent line look like there?',
                choices: [
                    'It is horizontal. The formula −x/y gives 0 at that point.',
                    'It is vertical. The formula −x/y divides by zero at that point.',
                    'It is steep. A circle is never flat at the top.'
                ], a: 0,
                whyBy: [
                    'Here dy/dx = −x/y = 0/5 = 0, so the tangent is horizontal. A horizontal tangent means the curve is neither rising nor falling at that point.',
                    'Vertical tangents on this circle appear where y = 0, at the points (±5, 0). At those points the denominator of −x/y is 0.',
                    'The formula gives exactly 0 there. Set the point angle to 90° and read the label on the tangent line.'
                ]
            },
            message: 'At (0, 5) the derivative is 0 and the tangent is horizontal. The formula −x/y gives this directly, so there is nothing to memorize.'
        },
        {
            params: { theta: 0 },
            message: 'Now move to (5, 0). The formula gives −5/0, which has no finite value, so the tangent is vertical. A vertical tangent is a real feature of the curve. It is the case where dy/dx is not a number.'
        },
        {
            params: { theta: 135 },
            message: 'In the second quadrant x is negative and y is positive, so −x/y is positive. The sign of the slope follows from the quadrant.'
        },
        {
            params: { local: 1, theta: 90 },
            message: 'Now fix x = 3. The vertical line x = 3 crosses the circle twice, at (3, 4) and at (3, −4). Both points satisfy x² + y² = 25, so both belong to the same relation.'
        },
        {
            params: { local: 2 },
            predict: {
                q: 'The upper point (3, 4) gets dy/dx = −3 / 4 from the formula −x / y. What does the same formula give at the lower point (3, −4)?',
                choices: [
                    'It is +3/4. Here −x / y becomes −3 / −4, and the two minus signs cancel.',
                    'It is −3/4. The slope only depends on x, and both points share x = 3.',
                    'It has no value. The lower half of a circle has no tangent line.'
                ], a: 0,
                whyBy: [
                    '−3 / −4 = ' + sn(-bX / bLo) + ', the mirror image of ' + sn(-bX / bUp) + ' on the upper branch. The tangent rises there.',
                    'The formula reads y as well as x. At the lower point y is −4, and that denominator flips the sign.',
                    'A slope exists here because y is not 0. The slopes that have no value sit at (±5, 0), where y = 0.'
                ]
            },
            message: 'At (3, −4) the formula gives ' + sn(-bX / bLo) + ', while (3, 4) gives ' + sn(-bX / bUp) + '. One x value carries two slopes, so dy/dx is read on the branch the point actually sits on. The relation never has to be solved as one global function.'
        },
        {
            params: { broken: 1, local: 0, theta: 45 },
            message: 'The wrong version treats y as a constant. It leaves 2x = 0, which is true only where x = 0. There is no slope anywhere else on the curve.'
        },
        {
            params: { broken: 0, kase: 'ellipse', stage: 1 },
            message: 'The circle is the easy case. Now try x² + xy + y² = 7 with the same method. The term xy also needs the product rule. Answer the two questions under "The same method on a new curve".'
        },
        {
            params: { stage: 2 },
            message: 'Differentiate term by term. The green term x² gives 2x, the product xy gives y + x · dy/dx, and y² gives 2y · dy/dx again.'
        },
        {
            params: { stage: 4 },
            message: 'Every term containing y produces a dy/dx, and those terms are collected on one side. The result is dy/dx = −(2x + y)/(x + 2y). Drag point P and the tangent follows this formula, and the branch control moves P between the two halves.'
        }
    ],
    summary: {
        idea: 'An implicit equation still describes y changing with x. Every term containing y is differentiated through that dependence, and that is where dy/dx comes from. The relation is not one global function, so the slope is read on the branch the point sits on.',
        mistake: 'Treating y as a constant, which gives d/dx(y²) as 2y or as 0. The chain rule is what turns the dependence on x into dy/dx. Also expect no finite slope where the denominator vanishes, because those are the vertical tangents.',
        transfer: 'On x² + xy + y² = 7, say which differentiated terms contain dy/dx before doing any algebra. Then find the slope at (1, 2), and check that the lower branch gives its own slope.'
    }
};
