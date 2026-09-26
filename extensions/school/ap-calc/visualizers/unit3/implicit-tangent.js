/* 3.2 Implicit Tangent Lab — an implicit equation ties x and y together along a
   curve, so differentiating a y-term must account for the way y moves with x.
   The draggable point stays on the relation, and the tangent shows the slope
   that the implicit derivative predicts. */

const n = v => String(Math.round(v * 1000) / 1000);
const slopeText = m => Number.isFinite(m) ? 'dy/dx = ' + n(m) : 'vertical tangent';

/* circle x² + y² = 25 */
const R = 5;
/* ellipse x² + xy + y² = 7: solve as a quadratic in y
   y = (−x ± √(28 − 3x²)) / 2, real for |x| ≤ √(28/3) ≈ 3.055 */
const eY = x => (-x + Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;
const eYlo = x => (-x - Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;

function state(env) {
    if (env.kase === 'circle') {
        const rad = env.theta * Math.PI / 180;
        const x = R * Math.cos(rad), y = R * Math.sin(rad);
        return { x, y, m: -x / y };
    }
    const x = env.ex, y = eY(x);
    return { x, y, m: -(2 * x + y) / (x + 2 * y) };
}

/* The differentiation is colour-coded all the way through: terms that carry only
   x (green) versus terms that carry y, and therefore dy/dx (orange). */
function derivLines(env) {
    const s = state(env);
    const L = [];
    if (env.kase === 'circle') {
        L.push({ t: 'x² + y² = 25', rule: 'the equation' });
        if (env.stage > 0.5) {
            L.push({ t: 'd/dx(x²) = 2x', color: 'curveC' });
            L.push({ t: 'd/dx(y²) = 2y · dy/dx', color: 'curveB' });
            L.push({ t: '2x + 2y · dy/dx = 0', hl: true, rule: 'differentiate both sides' });
        }
        if (env.stage > 1.5) L.push({ t: 'dy/dx = −x / y', hl: true, color: 'accent' });
        if (env.stage > 2.5) {
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
    L.push({ t: 'x² + xy + y² = 7', rule: 'the equation' });
    if (env.stage > 0.5) {
        L.push({ t: 'd/dx(x²) = 2x', color: 'curveC' });
        L.push({ t: 'd/dx(xy) = y + x · dy/dx', color: 'curveB', rule: 'product rule' });
        L.push({ t: 'd/dx(y²) = 2y · dy/dx', color: 'curveB' });
        L.push({ t: '2x + y + x · dy/dx + 2y · dy/dx = 0', hl: true });
    }
    if (env.stage > 1.5) L.push({ t: 'dy/dx = −(2x + y) / (x + 2y)', hl: true, color: 'accent' });
    if (env.stage > 2.5) L.push({ t: 'At (' + n(s.x) + ', ' + n(s.y) + '):  dy/dx = ' + n(s.m), color: 'auxInk' });
    return L;
}

export default {
    id: 'u3-implicit-tangent',
    meta: { unit: 3, topic: '3.2', title: 'Implicit Differentiation', visualizerTitle: 'Implicit Tangent Lab' },
    intro: 'This equation does not say y equals something in x. When you drag point P, the value of y moves with it. Because y changes when x changes, the derivative must contain dy/dx.',
    params: { kase: 'circle', theta: 45, ex: 1.2, stage: 0, broken: 0 },
    controls: [
        {
            key: 'kase', label: 'relation', kind: 'choice',
            options: [
                { v: 'circle', label: 'x² + y² = 25' },
                { v: 'ellipse', label: 'x² + xy + y² = 7' }
            ]
        },
        { key: 'theta', label: 'point angle', unit: '°', min: 0, max: 360, step: 1, showDigits: 0, when: env => env.kase === 'circle' },
        { key: 'ex', label: 'point x', min: -2.8, max: 2.8, step: 0.01, when: env => env.kase === 'ellipse' }
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
                kind: 'graph', width: 430, height: 430, title: env => 'The curve, with the tangent at point P',
                window: env => env.kase === 'circle' ? [-6.4, 6.4, -6.4, 6.4] : [-4.4, 4.4, -4.4, 4.4],
                curves: env => env.kase === 'circle'
                    ? [{ fn: 'cTop', color: 'curveA' }, { fn: 'cBot', color: 'curveA' }]
                    : [{ fn: 'eTop', color: 'curveA' }, { fn: 'eBot', color: 'curveA' }],
                points: env => [{
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
                }],
                segments: env => env.kase === 'circle'
                    ? [{ x1: 0, y1: 0, x2: env.x, y2: env.y, color: 'auxInk', dashed: true }]
                    : [],
                tangents: env => [{ x: env.x, y: env.y, m: env.m, color: 'down', label: slopeText(env.m) }]
            },
            { kind: 'eq', title: 'Green terms come from x, orange terms contain y', lines: env => derivLines(env) }
        ],
        side: [
            {
                kind: 'readout', title: 'Values at point P',
                items: env => [
                    { label: 'x', v: env.x, color: 'curveC' },
                    { label: 'y', v: env.y, color: 'curveB' },
                    { label: 'dy/dx', v: Number.isFinite(env.m) ? env.m : 'vertical', big: true, color: 'down' },
                    { label: 'x² + y² (circle only)', v: env.kase === 'circle' ? env.x * env.x + env.y * env.y : 'n/a', color: 'auxInk' }
                ]
            },
            {
                kind: 'table', title: 'y changes whenever x moves',
                when: env => env.kase === 'circle',
                rows: env => {
                    const rows = [0, 30, 60, 90, 135, 180].map(a => {
                        const r = a * Math.PI / 180;
                        return { a, x: R * Math.cos(r), y: R * Math.sin(r) };
                    });
                    const cur = rows.reduce((best, r) => Math.abs(r.a - env.theta) < Math.abs(best.a - env.theta) ? r : best, rows[0]);
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
                when: env => env.broken > 0.5,
                sides: [
                    {
                        title: 'y held constant like a number', tone: 'wrong',
                        lines: ['d/dx(y²) = 0', 'then 2x = 0', 'Only true where x = 0, and no slope anywhere else']
                    },
                    {
                        title: 'y changing along with x', tone: 'right',
                        lines: ['d/dx(y²) = 2y · dy/dx', 'then dy/dx = −x / y', 'A slope at every point of the circle']
                    }
                ],
                verdict: 'Treating y as a constant removes the whole curve. Look at the table: each row pairs one x value with one y value, and the marked row moves as point P moves.'
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
            params: { broken: 1, theta: 45 },
            message: 'The wrong version treats y as a constant. It leaves 2x = 0, which is true only where x = 0. There is no slope anywhere else on the curve.'
        },
        {
            params: { broken: 0, kase: 'ellipse', stage: 1 },
            message: 'The circle is the easy case. Now try x² + xy + y² = 7 with the same method. The term xy also needs the product rule. Answer the two questions under "The same method on a new curve".'
        },
        {
            params: { stage: 3 },
            message: 'Every term containing y produces a dy/dx, and those terms are collected on one side. The result is dy/dx = −(2x + y)/(x + 2y). Drag point P and the tangent follows this formula.'
        }
    ],
    summary: {
        idea: 'An implicit equation still describes y changing with x. Every term containing y is differentiated through that dependence, and that is where dy/dx comes from.',
        mistake: 'Treating y as a constant, which gives d/dx(y²) as 2y or as 0. The chain rule is what turns the dependence on x into dy/dx.',
        transfer: 'On x² + xy + y² = 7, say which differentiated terms contain dy/dx before doing any algebra. Then find the slope at (1, 2).'
    }
};
