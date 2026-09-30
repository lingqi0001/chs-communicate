/* 5.12 Exploring Behaviors of Implicit Relations.
   Mode 2, second derivative obtained implicitly. The circle from mode 1 carries
   the derivation because its geometry is already known, and then the relation
   x² + xy + y² = 7 shows the general shape of an implicit y″.

   Both levels stay on the board, exactly as the topic requires:
   y″ = −(1 + (y′)²) / y, which visibly uses y and y′, and the circle-specific
   simplification y″ = −25 / y³. For the second relation the reduced line
   2 + 2y′ + 2(y′)² + (x + 2y)y″ = 0 is solved into
   y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y), and the value at (1, 2) is computed by
   this file from the formula with exact fraction arithmetic, never typed.

   Concavity is read half by half: y > 0 gives y³ > 0 gives y″ < 0 on the upper
   branch, and the signs flip on the lower branch. At (±5, 0), where y = 0, the
   expression for y″ has no value, so no concavity claim is made there.

   Reveal discipline: one monotone params.stage, and a reveal lives in the same
   step object as the Predict whose answer it shows. On screen i the narration is
   steps[i-1].message and the open question is steps[i].predict, so the stage set
   in step j first paints on screen j+1. The concavity words for a half appear
   only after the question about that half has been asked, and the sign table for
   both halves waits until both questions have been asked. Nothing is gated on an
   answer, so Next works with every question untouched. Cards retire with a
   ceiling once the screen that needed them has passed. */

const R2 = 5;                                     /* x² + y² = 25 */
const WX = 6.4;                                   /* the circle window, ±6.4 */

function dsp(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-9 ? '=' : '≈';
}
const nv = (v) => rel(v) + ' ' + dsp(v);
const pt = (x, y) => '(' + dsp(x) + ', ' + dsp(y) + ')';

/* Exact rational arithmetic, so the printed y″ at (1, 2) is −42/125 by
   computation from the formula rather than by a hand-typed decimal. */
function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a || 1;
}
function red(n, d) {
    const s = d < 0 ? -1 : 1;
    const g = gcd(n, d);
    return { n: (s * n) / g, d: (s * d) / g };
}
const fAdd = (a, b) => red(a.n * b.d + b.n * a.d, a.d * b.d);
const fMul = (a, b) => red(a.n * b.n, a.d * b.d);
const fDiv = (a, b) => red(a.n * b.d, a.d * b.n);
const fVal = (f) => f.n / f.d;
const fStr = (f) => (f.d === 1 ? dsp(f.n) : (f.n < 0 ? '−' : '') + Math.abs(f.n) + '/' + f.d);

const TWO = { n: 2, d: 1 };
const NEG = { n: -1, d: 1 };

/* (1, 2) lies on x² + xy + y² = 7, since 1 + 2 + 4 = 7. */
const EP = { x: 1, y: 2 };
const E_NUM1 = fAdd(fMul(TWO, { n: EP.x, d: 1 }), { n: EP.y, d: 1 });        /* 2x + y = 4 */
const E_DEN1 = fAdd({ n: EP.x, d: 1 }, fMul(TWO, { n: EP.y, d: 1 }));        /* x + 2y = 5 */
const E_YP = fMul(NEG, fDiv(E_NUM1, E_DEN1));                                 /* y′ = −4/5 */
const E_NUM2 = fAdd(TWO, fAdd(fMul(TWO, E_YP), fMul(TWO, fMul(E_YP, E_YP)))); /* 2 + 2y′ + 2(y′)² */
const E_YDD = fMul(NEG, fDiv(E_NUM2, E_DEN1));                                /* y″ = −42/125 */

/* The circle's own y, y′ and y″ at the selected point. y = 0 is where both
   quotients have no value, so those readings are carried as null and printed as
   DNE, never as a huge or not-a-number quotient. */
const isDNE = (y) => Math.abs(y) < 1e-9;
const slopeOf = (x, y) => (isDNE(y) ? null : -x / y);
const ddFromSlope = (y, m) => (isDNE(y) || m === null ? null : -(1 + m * m) / y);
const ddFromCircle = (y) => (isDNE(y) ? null : -25 / (y * y * y));
const concWord = (dd) => (dd === null ? 'no value, so no concavity claim' : (dd < 0 ? 'concave down' : (dd > 0 ? 'concave up' : 'y″ = 0, and this circle never does that')));

const DOWNFILL = 'color-mix(in srgb, #FF3B30 10%, transparent)';
const UPFILL = 'color-mix(in srgb, #2FB86A 10%, transparent)';

const HALF_CARDS = [
    {
        at: 4, title: 'Upper half of the circle', band: { from: 0.06, to: WX, color: DOWNFILL, label: 'y > 0' },
        lines: [
            { t: 'upper branch: y > 0', color: 'ink' },
            { t: 'so y³ > 0, and −25 / y³ < 0', color: 'ink' },
            { t: 'y″ < 0 on the whole upper branch', color: 'down' },
            { t: 'concave down', hl: true, color: 'down' }
        ],
        note: { x: 1.4, y: 0.65, color: 'down', t: 'upper branch: concave down' }
    },
    {
        at: 5, title: 'Lower half of the circle', band: { from: -WX, to: -0.06, color: UPFILL, label: 'y < 0' },
        lines: [
            { t: 'lower branch: y < 0', color: 'ink' },
            { t: 'so y³ < 0, and −25 / y³ > 0', color: 'ink' },
            { t: 'y″ > 0 on the whole lower branch', color: 'up' },
            { t: 'concave up', hl: true, color: 'up' }
        ],
        note: { x: 1.4, y: -5.2, color: 'up', t: 'lower branch: concave up' }
    }
];

export const secondDerivativeMode = {
    label: 'Second derivative implicitly',
    intro: 'The circle is still x² + y² = 25, and dy/dx = −x/y is still the only slope rule in use. Mode 1 read the first derivative for increasing, decreasing and tangents. Now differentiate one more time, and the second derivative arrives in a form no explicit function ever forces on you: it uses y, and it uses dy/dx. Pick a branch and an x, and the board evaluates all three quantities at that point.',
    params: { stage: 0, branch: 'upper', px: -3 },
    controls: [
        {
            key: 'branch', label: 'local branch for P', kind: 'choice',
            options: [{ v: 'upper', label: 'upper branch' }, { v: 'lower', label: 'lower branch' }],
            when: (env) => env.stage < 6
        },
        {
            key: 'px', label: 'x of P', min: -5, max: 5, step: 0.05, showDigits: 2,
            when: (env) => env.stage < 6
        }
    ],
    fns: {
        cTop: (x) => Math.sqrt(Math.max(0, R2 * R2 - x * x)),
        cBot: (x) => -Math.sqrt(Math.max(0, R2 * R2 - x * x)),
        eTop: (x) => (-x + Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2,
        eBot: (x) => (-x - Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2
    },
    compute: (env) => {
        const x = Math.max(-R2, Math.min(R2, env.px));
        const mag = Math.sqrt(Math.max(0, R2 * R2 - x * x));
        const y = env.branch === 'lower' ? -mag : mag;
        const m = slopeOf(x, y);
        const dd = ddFromSlope(y, m);
        return {
            px: x, py: y,
            branchName: env.branch === 'lower' ? 'lower' : 'upper',
            slope: m,
            hasSlope: m !== null,
            dd: dd,
            ddCircle: ddFromCircle(y),
            ddStr: dd === null ? 'DNE' : nv(dd),
            conc: concWord(dd)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                width: 440, height: 440,
                window: [-WX, WX, -WX, WX],
                when: (env) => env.stage < 6,
                title: (env) => env.stage >= 4
                    ? 'x² + y² = 25, read half by half for y″'
                    : 'x² + y² = 25, with P on the ' + env.branchName + ' branch',
                hband: (env) => HALF_CARDS.filter(c => env.stage >= c.at).map(c => c.band),
                curves: () => [
                    { fn: 'cTop', from: -R2, to: R2, samples: 600, color: 'curveA', label: 'upper branch', labelAt: -3.9 },
                    { fn: 'cBot', from: -R2, to: R2, samples: 600, color: 'curveC', label: 'lower branch', labelAt: 3.9 }
                ],
                points: (env) => {
                    const out = [{
                        x: (e) => e.px, y: (e) => e.py, r: 6.5, color: 'accent',
                        drag: { key: 'px', min: -R2, max: R2, snap: 0.05 },
                        label: (e) => 'P = ' + pt(e.px, e.py), labelDx: 10, labelDy: -10
                    }];
                    if (env.stage >= 6) {
                        out.push({ x: R2, y: 0, r: 6, color: 'down', label: 'y = 0 here', labelDx: 8, labelDy: -12 });
                        out.push({ x: -R2, y: 0, r: 6, color: 'down', label: 'y = 0 here', labelDx: -92, labelDy: -12 });
                    }
                    return out;
                },
                tangents: (env) => (env.stage >= 1 && env.hasSlope
                    ? [{ x: env.px, y: env.py, m: env.slope, color: 'accent', reach: 0.14, label: (e) => (e.hasSlope ? 'dy/dx ' + nv(e.slope) : 'dy/dx = DNE') }]
                    : []),
                notes: (env) => HALF_CARDS.filter(c => env.stage >= c.at).map(c => c.note)
            },
            {
                kind: 'table',
                title: 'Sign of y, sign of y³, sign of y″ = −25 / y³',
                when: (env) => env.stage >= 5 && env.stage < 7,
                cols: ['Local branch', 'Sign of y', 'Sign of y³', 'Sign of y″', 'Concavity of that branch'],
                rows: () => [
                    [
                        { v: () => 'upper branch', bold: true },
                        { v: () => 'y > 0', color: 'ink' },
                        { v: () => 'y³ > 0' },
                        { v: () => 'y″ < 0', color: 'down', bold: true },
                        { v: () => 'concave down', color: 'down' }
                    ],
                    [
                        { v: () => 'lower branch', bold: true },
                        { v: () => 'y < 0', color: 'ink' },
                        { v: () => 'y³ < 0' },
                        { v: () => 'y″ > 0', color: 'up', bold: true },
                        { v: () => 'concave up', color: 'up' }
                    ]
                ],
                note: (env) => env.stage >= 6
                    ? 'Neither row reaches (' + dsp(-R2) + ', 0) or (' + dsp(R2) + ', 0). Those two points have y = 0, and −25 / y³ has no value there, so no concavity claim covers them.'
                    : 'Each row is the sign of one quotient on one half of the relation. The two rows are conclusions about two different local branches, and they are not the same conclusion.'
            },
            {
                kind: 'graph',
                width: 440, height: 440,
                window: [-4.5, 4.5, -4.5, 4.5],
                when: (env) => env.stage >= 6,
                title: (env) => env.stage >= 8
                    ? 'x² + xy + y² = 7, with the local branch through (1, 2)'
                    : 'x² + xy + y² = 7, a second relation with two local branches',
                curves: () => [
                    { fn: 'eTop', from: -Math.sqrt(28 / 3), to: Math.sqrt(28 / 3), samples: 600, color: 'curveA', label: 'upper branch', labelAt: -2.2 },
                    { fn: 'eBot', from: -Math.sqrt(28 / 3), to: Math.sqrt(28 / 3), samples: 600, color: 'curveC', label: 'lower branch', labelAt: 2.2 }
                ],
                points: (env) => (env.stage >= 8
                    ? [{ x: EP.x, y: EP.y, r: 6.5, color: 'accent', label: '(1, 2), upper branch', labelDx: 10, labelDy: -14 }]
                    : []),
                tangents: (env) => (env.stage >= 8
                    ? [{ x: EP.x, y: EP.y, m: fVal(E_YP), color: 'accent', reach: 0.24, label: 'dy/dx ' + nv(fVal(E_YP)) }]
                    : []),
                notes: (env) => (env.stage >= 9
                    ? [{ x: -3.2, y: 1.2, color: 'down', t: 'concave down on this local branch' }]
                    : [])
            },
            {
                kind: 'eq',
                title: 'y″ at (1, 2), computed from the formula',
                when: (env) => env.stage >= 8,
                lines: (env) => {
                    const out = [
                        { t: '2x + y ' + nv(fVal(E_NUM1)) + ', and x + 2y ' + nv(fVal(E_DEN1)), rule: 'x² + xy + y² = ' + nv(1 + 2 + 4) + ', so the point is on the relation' },
                        { t: 'y′ = −(2x + y) / (x + 2y) = ' + fStr(E_YP), hl: true },
                        { t: '2 + 2y′ + 2(y′)² = ' + fStr(E_NUM2) + ' = ' + nv(fVal(E_NUM2)) },
                        { t: 'y″ = −(' + fStr(E_NUM2) + ') / ' + fStr(E_DEN1) + ' = ' + fStr(E_YDD) + ' = ' + nv(fVal(E_YDD)), hl: true, color: 'accent' }
                    ];
                    if (env.stage >= 9) out.push({ t: 'y″ < 0 at (1, 2), so the local branch through that point is concave down there.', hl: true, color: 'down' });
                    return out;
                }
            }
        ],
        side: [
            {
                kind: 'eq',
                title: 'Differentiate 2x + 2y·y′ = 0 once more',
                when: (env) => env.stage < 6,
                lines: (env) => {
                    const out = [
                        { t: 'x² + y² = 25', rule: 'the relation' },
                        { t: '2x + 2y·y′ = 0', rule: 'the first implicit derivative, from topic 3.2' },
                        { t: 'dy/dx = −x / y', hl: true, color: 'accent' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'Now differentiate 2x + 2y·y′ = 0 with respect to x again. The product 2y·y′ needs the product rule, and y′ differentiates to y″.' });
                    if (env.stage >= 2) {
                        out.push({ t: 'd/dx(2y·y′) = 2y′·y′ + 2y·y″ = 2[(y′)² + y·y″]', rule: 'product rule' });
                        out.push({ t: '2 + 2[(y′)² + y·y″] = 0', hl: true });
                        out.push({ t: '1 + (y′)² + y·y″ = 0' });
                        out.push({ t: 'y″ = −(1 + (y′)²) / y', hl: true, color: 'accent', rule: 'an implicit second derivative' });
                    }
                    if (env.stage >= 3) {
                        out.push({ t: 'On the circle 1 + (y′)² = 1 + x²/y² = (x² + y²) / y² = 25 / y², so y″ = −25 / y³.', hl: true, color: 'curveC', rule: 'the circle-specific form' });
                    }
                    return out;
                }
            },
            {
                kind: 'readout',
                title: (env) => 'y, y′ and y″ at P on the ' + env.branchName + ' branch',
                when: (env) => env.stage < 6,
                items: (env) => {
                    const out = [
                        { label: 'Point', v: () => pt(env.px, env.py), big: true, color: 'accent' },
                        { label: 'dy/dx', v: () => (env.slope === null ? 'DNE' : nv(env.slope)) },
                        { label: 'Sign of dy/dx', v: () => (env.slope === null ? 'does not exist' : (env.slope > 0 ? 'positive' : 'negative')), color: env.slope > 0 ? 'up' : (env.slope < 0 ? 'down' : 'auxInk') }
                    ];
                    if (env.stage >= 3) {
                        out.push({ label: 'd²y / dx² from −(1 + (y′)²) / y', v: () => env.ddStr, big: true, color: env.dd === null ? 'down' : (env.dd < 0 ? 'down' : 'up') });
                        out.push({ label: 'd²y / dx² from −25 / y³', v: () => (env.ddCircle === null ? 'DNE' : nv(env.ddCircle)), color: 'auxInk' });
                    }
                    if (env.stage >= 4) out.push({ label: 'Concavity of this branch at P', v: () => env.conc, color: env.dd === null ? 'auxInk' : (env.dd < 0 ? 'down' : 'up'), big: true });
                    return out;
                }
            },
            {
                kind: 'note',
                title: 'A formula in y and y′ is normal here, not unfinished work',
                when: (env) => env.stage >= 3 && env.stage < 5,
                text: 'An implicit second derivative does not have to simplify to a function of x alone. The expression for y″ uses y, and it uses y′, because both were inside the relation that was differentiated. To read a number from it, evaluate the point first: take y at that point and dy/dx at that point, then substitute.'
            },
            {
                kind: 'note',
                title: 'Where y is 0, y″ never arrives',
                when: (env) => env.stage === 6,
                text: 'At (' + dsp(-R2) + ', 0) and (' + dsp(R2) + ', 0) the denominator y of −(1 + (y′)²) / y is 0, and the circle form −25 / y³ divides by the same zero. Neither expression has a value there, so neither sign can be read, and no concavity claim is made at those two points. Mode 1 already met them as the vertical tangents, and the second derivative stops at exactly the same place.'
            },
            {
                kind: 'eq',
                title: HALF_CARDS[0].title,
                when: (env) => env.stage >= 4 && env.stage < 6,
                lines: HALF_CARDS[0].lines
            },
            {
                kind: 'eq',
                title: HALF_CARDS[1].title,
                when: (env) => env.stage >= 5 && env.stage < 6,
                lines: HALF_CARDS[1].lines
            },
            {
                kind: 'eq',
                title: 'The second relation, x² + xy + y² = 7',
                when: (env) => env.stage >= 6,
                lines: (env) => {
                    const out = [
                        { t: 'x² + xy + y² = 7', rule: 'a relation with two local branches' },
                        { t: '2x + y + x·y′ + 2y·y′ = 0', rule: 'first derivative, topic 3.2' },
                        { t: 'dy/dx = −(2x + y) / (x + 2y)', hl: true, color: 'accent' }
                    ];
                    if (env.stage >= 7) {
                        out.push({ t: 'Differentiate 2x + y + (x + 2y)·y′ = 0 once more.', rule: 'product rule on the last factor' });
                        out.push({ t: '2 + 2y′ + 2(y′)² + (x + 2y)·y″ = 0', hl: true });
                    }
                    if (env.stage >= 8) {
                        out.push({ t: 'y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y)', hl: true, color: 'accent', rule: 'x, y and y′ all appear' });
                        out.push({ t: 'The numerator uses y′, so y″ at a point needs y′ at that point first.', color: 'auxInk' });
                    }
                    return out;
                }
            },
            {
                kind: 'compare',
                title: 'What an implicit y″ is allowed to look like',
                when: (env) => env.stage >= 10,
                sides: () => [
                    {
                        title: 'Belief to drop', tone: 'wrong',
                        lines: [
                            'y″ must end up written only in x.',
                            'A formula still carrying y or y′ is unfinished algebra.',
                            'So one should keep substituting until only x is left.'
                        ]
                    },
                    {
                        title: 'What the relation actually gives', tone: 'right',
                        lines: [
                            'y″ may involve x, y and dy/dx at once.',
                            'y″ = −(1 + (y′)²) / y is complete as written.',
                            'A point supplies the three numbers, and the sign answers the question.'
                        ]
                    }
                ],
                verdict: 'The circle did simplify to −25 / y³ because 1 + x²/y² collapses there. The second relation does not simplify that way, and it does not have to. y″ belongs to a point, and a point hands over x, y and y′ together.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The recap line is dy/dx = −x/y, and the tangent at P is on the picture. P sits at (' + dsp(-3) + ', ' + dsp(4) + ') on the upper branch, so dy/dx ' + nv(0.75) + '. Topic 3.2 stopped after producing the first derivative. The step now is to differentiate the equation 2x + 2y·y′ = 0 a second time, which is where y″ enters.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Differentiate 2x + 2y·y′ = 0 with respect to x once more. Which equation results?',
                choices: [
                    '2 + 2[(y′)² + y·y″] = 0.',
                    '2 + 2y·y″ = 0, because the derivative of y′ is y″ and the other factor is constant.',
                    '2x + 2[(y′)² + y·y″] = 0, because the 2x term stays.',
                    '2 + 2(y′)² = 0, because y·y″ differentiates back to 0.'
                ], a: 0,
                whyBy: [
                    'd/dx(2x) gives 2, and 2y·y′ is a product of two things that both change with x: the derivative of 2y is 2y′, and the derivative of y′ is y″. So d/dx(2y·y′) = 2(y′)² + 2y·y″, and the equation is 2 + 2[(y′)² + y·y″] = 0.',
                    'That keeps the derivative of y′ but drops the derivative of the other factor 2y, which is 2y′. The product rule gives both parts, and the (y′)² term is what makes an implicit y″ look different from an explicit one.',
                    'd/dx(2x) is 2, not 2x. Once differentiated, that term is the constant 2 in the new equation.',
                    'y·y″ is the second half of the product rule, and it does not vanish. Dropping it is exactly the mistake the topic 3.2 lesson warns about, treating y as a constant.'
                ]
            },
            message: 'Solving that equation for y″ gives the box on the board: y″ = −(1 + (y′)²) / y. Read what is inside it. The right-hand side carries y, and it carries y′, which is itself −x/y. An implicit second derivative has no obligation to be a formula in x alone, and this one is finished as written.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'y″ = −(1 + (y′)²) / y uses y and y′. What has to happen before this formula returns a number at a point of the circle?',
                choices: [
                    'Evaluate that point: take its y and its dy/dx = −x/y, then substitute both into the formula.',
                    'Rewrite the formula until only x is left, because a derivative can only be evaluated at an x-value.',
                    'Nothing, because y″ is a property of the whole relation and not of a point.',
                    'Set the numerator 1 + (y′)² equal to 0 first, since that is the critical-point condition.'
                ], a: 0,
                whyBy: [
                    'Take the point first: dy/dx ' + nv(0.75) + ' there, so y″ = −(1 + (y′)²) / y = −(25 / 16) / 4 = −25 / 64 ' + nv(-25 / 64) + ', and the circle form −25 / y³ with y = 4 gives the same number. Every quantity in the formula comes from the same point.',
                    'The formula does simplify on this particular circle to −25 / y³, and that still uses y. A derivative value on a relation belongs to a point (x, y), so a point is exactly what the formula needs.',
                    'Mode 1 already settled that: the two points at x = 3 have opposite slopes, so a derivative value is a point fact on this relation.',
                    '1 + (y′)² is never 0 for real y′, so that condition has no solutions here. The critical-point condition belongs to dy/dx, which is the numerator x that vanishes at x = 0.'
                ]
            },
            message: 'Both evaluations are on the board now, and they agree: the general form −(1 + (y′)²) / y and the circle form −25 / y³ give the same number at P, because 1 + x²/y² collapses to (x² + y²)/y² = 25/y² on this relation. Drag the branch control or x and the two rows keep agreeing, since they are the same expression in two costumes.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'On the upper half of the circle y > 0. What does y″ = −25 / y³ say about the whole upper branch?',
                choices: [
                    'y³ > 0 there, so −25 / y³ < 0, and the upper branch is concave down everywhere it is defined.',
                    'y³ > 0 there, so −25 / y³ > 0, and the upper branch is concave up everywhere it is defined.',
                    'The sign of y″ on the upper branch depends on x, because the numerator came from 1 + (y′)².',
                    'Nothing, because concavity needs a formula in x alone.'
                ], a: 0,
                whyBy: [
                    'A positive y³ over a positive 25 with the leading minus gives a negative y″ for every point of the upper branch, and negative y″ is concave down. The x that entered 1 + (y′)² disappeared when the circle simplified the expression, so no x can flip the sign on this half.',
                    'That forgets the leading minus sign, which survives into −25 / y³. Topic 5.6 reads y″ < 0 as concave down, and that is the word for this half.',
                    'The simplified form on the circle is −25 / y³, and it carries no x at all. On the upper half the sign is fixed by the sign of y, which is why one sentence covers the whole branch.',
                    'Concavity is read from the sign of y″ at a point, and mode 2 evaluated y″ at a point without ever producing a formula in x alone.'
                ]
            },
            message: 'The chain is on the board: y > 0, then y³ > 0, then y″ < 0, then concave down. The upper half of the picture is banded and labeled with that conclusion, and P anywhere on that branch reads concave down in the readout. This is topic 5.6 moved onto a local branch of a relation.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Do the same reading on the lower half, where y < 0. What does y″ = −25 / y³ give there?',
                choices: [
                    'y³ < 0, so −25 / y³ > 0, and the lower branch is concave up everywhere it is defined.',
                    'y³ < 0, so −25 / y³ < 0, and the lower branch is concave down everywhere it is defined.',
                    'The lower branch has no y″, because y is negative.',
                    'The lower branch matches the upper branch, because one equation defines both.'
                ], a: 0,
                whyBy: [
                    'A negative y³ flips the fraction, and the leading minus flips it back, so y″ > 0 on that half: concave up. The two halves of the relation really do bend the other way from each other, and the sign of y is what says so.',
                    'That misses the double flip. −25 divided by a negative y³ is positive, and positive y″ is concave up.',
                    'The quotient has a value wherever y ≠ 0, and on the lower branch y is negative rather than zero. It has no value only at the two points where y = 0.',
                    'One equation, two branches, and the derivative reads y rather than the equation. Mode 1 showed the same split with opposite slopes at x = 3, and here it shows up in the bend.'
                ]
            },
            message: 'Both halves are concluded, and the sign table lists them together: y > 0 gives y″ < 0 and concave down on the upper branch, y < 0 gives y″ > 0 and concave up on the lower branch. Nothing was decided by looking at the picture and guessing. Each row is the sign of one quotient.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'The two points (' + dsp(-R2) + ', 0) and (' + dsp(R2) + ', 0) lie on the circle. What does the formula y″ = −25 / y³ say about them?',
                choices: [
                    'Nothing, because y = 0 there makes the expression undefined, so no concavity claim is made at those points.',
                    'y″ = −25 / 0, so y″ is a very large negative number and the circle is extremely concave down there.',
                    'y″ = 0 at both, because the numerator has no x in it.',
                    'The two points switch the circle from concave down to concave up, so they are inflection points.'
                ], a: 0,
                whyBy: [
                    'Correct. Division by zero produces no value, so the formula returns no sign, and a sign is the only thing that can state a concavity. Mode 1 already read these two points as vertical tangents from dy/dx, and that reading stops at exactly the same place.',
                    'That treats an undefined quotient as a number. There is no value of y″ at those points to rank against other values, so the honest reading is that the formula says nothing there.',
                    'A fraction is 0 when its numerator is 0 and its denominator is not. Here the numerator is the constant −25 and the denominator is 0, which is the opposite situation.',
                    'An inflection point needs a change of concavity on both sides, and on each side of (5, 0) the relation sits in a different half, one concave down and the other concave up. Neither point is a place where one branch changes its bend, and y″ has no value there at all.'
                ]
            },
            message: 'The side points stay undefined for y″, and the picture marks them with y = 0 rather than with a bend word. That closes the circle. Now a second relation, x² + xy + y² = 7, shows why the unsimplified form of y″ is the general case rather than a detour.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'The first derivative of x² + xy + y² = 7 is 2x + y + (x + 2y)·y′ = 0. Differentiate that equation once more. Which line results?',
                choices: [
                    '2 + 2y′ + 2(y′)² + (x + 2y)·y″ = 0.',
                    '2 + (y′)² + (x + 2y)·y″ = 0.',
                    '2 + 2y′ + (x + 2y)·y″ = 0.',
                    '2 + 2y′ + 2(y′)² + x·y″ = 0.'
                ], a: 0,
                whyBy: [
                    'd/dx(2x) = 2, d/dx(y) = y′, and the product (x + 2y)·y′ differentiates to (1 + 2y′)·y′ + (x + 2y)·y″. Adding gives 2 + y′ + y′ + 2(y′)² + (x + 2y)·y″, which is the line on the board.',
                    'That drops the cross terms from the product rule. d/dx(y) already contributes one y′, and 2y·y′ contributes another y′ plus the 2(y′)².',
                    'That keeps the two y′ terms and loses the 2(y′)² coming from 2y·y′, which is the (y′)² the product rule hands over.',
                    'That forgets to differentiate the factor (x + 2y), whose derivative 1 + 2y′ is where the extra y′ terms come from. Only part of the product survives in it.'
                ]
            },
            message: 'One term of that line still carries y′ rather than only x and y, and that is the normal shape of an implicit second derivative. The relation has not been solved for y, so nothing has to make y′ disappear.'
        },
        {
            params: { stage: 8 },
            predict: {
                q: 'Solve 2 + 2y′ + 2(y′)² + (x + 2y)·y″ = 0 for y″.',
                choices: [
                    'y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y).',
                    'y″ = (2 + 2y′ + 2(y′)²) / (x + 2y).',
                    'y″ = −(2 + 2y′ + 2(y′)²)·(x + 2y).',
                    'y″ = −(2 + 2(y′)²) / (x + 2y).'
                ], a: 0,
                whyBy: [
                    'Move the y′ terms to the other side and divide by x + 2y. The minus sign belongs to the whole numerator, and y′ stays inside it.',
                    'The y′ terms move across the equals sign, so the sign flips. Dropping the minus is the most common slip in this step.',
                    'x + 2y is a factor multiplying y″, so isolating y″ divides by it rather than multiplying.',
                    'That drops the 2y′ term coming from d/dx(y). Three terms are in the numerator, not two.'
                ]
            },
            message: 'The formula is on the board, and the card under it evaluates it at (1, 2) by computation. The point is on the relation, since 1 + 2 + 4 = 7, so y′ ' + nv(fVal(E_YP)) + ' and then the numerator 2 + 2y′ + 2(y′)² is ' + fStr(E_NUM2) + '. Divided by x + 2y = ' + fStr(E_DEN1) + ', y″ = ' + fStr(E_YDD) + ' = ' + nv(fVal(E_YDD)) + '. Every one of those numbers came out of the formula.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'At (1, 2) the computation gives y″ = ' + fStr(E_YDD) + '. What does that say about the relation there?',
                choices: [
                    'y″ < 0, so the local branch through (1, 2) is concave down at that point.',
                    'y″ < 0, so the local branch through (1, 2) is concave up at that point.',
                    'y″ is a small number, so the branch is nearly straight there.',
                    'The whole relation is concave down, because one point decided it.'
                ], a: 0,
                whyBy: [
                    'Negative second derivative is concave down, which is the topic 5.6 reading moved onto a local branch of a relation. The claim belongs to the branch through (1, 2) at that point.',
                    'That inverts the topic 5.6 convention. Concave up needs y″ > 0.',
                    'Magnitude says nothing about bend. Only the sign of y″ carries the concavity claim, and this one is negative.',
                    'This relation has two local branches, and mode 1 showed how differently the two halves of a relation behave at the same x. One point gives one branch one conclusion at one point.'
                ]
            },
            message: 'Concave down on the local branch through (1, 2), and the note on the graph says exactly that. Compare the two relations: the circle simplified all the way to −25 / y³, and this one keeps y′ inside its y″. Both readings were done the same way, by evaluating at a point and reading the sign.'
        },
        {
            params: { stage: 10 },
            predict: {
                q: 'A classmate rewrites y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y) and stops, complaining that the answer is not finished because y′ is still in it. Is that a real defect?',
                choices: [
                    'No. An implicit y″ may involve x, y and dy/dx, and a point supplies all three numbers.',
                    'Yes. A second derivative must be a formula in x alone, so the work is not done.',
                    'Yes, but only on the circle, where y″ does simplify to −25 / y³.',
                    'No, because y′ can always be replaced by 0 at a critical point.'
                ], a: 0,
                whyBy: [
                    'That is the official shape of the topic. Substituting the value of dy/dx is optional, and reading the sign at a point works either way.',
                    'That belief has no support in the CED or in this lesson. y″ came out of differentiating a relation, and the relation never promised an x-only formula.',
                    'The circle is the lucky case where 1 + x²/y² collapses to 25/y². A simplification existing in one example does not make the unsimplified form wrong in another.',
                    'y′ is 0 only at a horizontal tangent, and (1, 2) is not such a point: y′ ' + nv(fVal(E_YP)) + ' there. A general point keeps its own nonzero slope.'
                ]
            },
            message: 'The comparison card states the belief to drop and the reading to keep. Both relations in this lesson were analyzed with y″ formulas that use y, and one of them still uses y′. That is the method working, not the method failing.'
        },
        {
            params: { stage: 11 },
            message: 'Read the two y″ formulas one last time as one procedure. Differentiate the implicit equation again, solve for y″, evaluate at the point (x, y) including that point y′, and read the sign. Concavity then belongs to the local branch through that point, exactly as increasing and decreasing did in mode 1.'
        }
    ],
    summary: {
        idea: 'Differentiating an implicit relation a second time gives a y″ that may involve x, y and dy/dx at once. On x² + y² = 25 the route is 2 + 2[(y′)² + y·y″] = 0, then y″ = −(1 + (y′)²) / y, and on the circle that collapses to y″ = −25 / y³. Because the sign of y³ decides the sign of y″, the upper branch is concave down and the lower branch is concave up wherever y ≠ 0. On x² + xy + y² = 7 the formula keeps y′ inside it, and evaluating at (1, 2) gives y′ = ' + fStr(E_YP) + ' and y″ = ' + fStr(E_YDD) + ' = ' + nv(fVal(E_YDD)) + ', which is concave down on the local branch through that point.',
        mistake: 'Do not demand that y″ be a formula in x alone, and do not treat −25 / y³ at y = 0 as a number. At the two side points of the circle the second derivative has no value, so no concavity claim reaches them. Concavity is a claim about one local branch at one point, not about the relation as a single function.',
        transfer: 'For x² + xy + y² = 7 the line 2 + 2y′ + 2(y′)² + (x + 2y)y″ = 0 holds. The point (−1, −2) is on the relation, since 1 + 2 + 4 = 7. Find dy/dx there, then substitute it into that line to get y″, state the sign of each, and say which local branch your concavity claim belongs to.'
    }
};

export default secondDerivativeMode;
