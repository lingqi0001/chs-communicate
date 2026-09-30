/* 5.12 Exploring Behaviors of Implicit Relations.
   Mode 1, the hero relation: x² + y² = 25 read as a relation with two local
   branches, and every claim on the screen comes from dy/dx = −x/y.

   Topic 3.2 already produced this derivative, so no line here re-derives it.
   The board opens with the finished formula and the work is behaviour: the sign
   of dy/dx on one branch, the points where it is 0, the points where it has no
   value, and what those three readings say about each local branch.

   LOCAL BRANCH is the operative phrase. The circle is not one global y = f(x),
   so a slope is never attached to an x-value alone. Screen 3 fixes x = 3 and
   shows two points with coordinates only, and screen 4 shows that those two
   points carry opposite slopes.

   Reveal discipline: one monotone params.stage, and a reveal always lives in the
   same step object as the Predict whose answer it shows. On screen i the
   narration is steps[i-1].message and the open question is steps[i].predict, so
   a stage set in step j first paints on screen j+1. Scene params (the branch
   choice and px) are set one step earlier than the question that needs them, so
   no question is asked about a picture that is not there yet, and no answer sits
   on screen while its own question is still open. Nothing is gated on an answer,
   so Next works with every question untouched. Teaching cards retire with a
   ceiling once the screen that needed them has passed. Only the derivative board,
   the live readout and the two boards at the bottom stay.

   Number discipline: every printed value is computed from dy/dx = −x/y. A value
   that is exact after rounding prints with = and a rounded one prints with ≈.
   Where y = 0 the quotient has no value, so the readout says DNE and the picture
   draws an explicit vertical line instead of a fake finite tangent. No raw
   not-a-number value reaches the screen. */

const R2 = 5;                                              /* radius of x² + y² = 25 */
const BX = 3;                                              /* the fixed x of the two-branch screen */
const BX_UP = 4;                                           /* 25 − 9 = 16 */
const BX_LO = -4;                                          /* the other point with x = 3 */

/* Three decimals with the trailing zeros trimmed and the typographic minus. */
function dsp(v) {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
/* A rounded value never gets an equals sign. */
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-9 ? '=' : '≈';
}
const nv = (v) => rel(v) + ' ' + dsp(v);
const pt = (x, y) => '(' + dsp(x) + ', ' + dsp(y) + ')';

/* y = 0 on this circle is exactly where −x/y has no value, so the slope is
   carried as a string word rather than as a huge or not-a-number quotient. */
const isDNE = (y) => Math.abs(y) < 1e-9;
const slopeAt = (x, y) => (isDNE(y) ? null : -x / y);
const signWord = (m) => (m === null ? 'does not exist' : (m > 0 ? 'positive' : (m < 0 ? 'negative' : 'zero')));
const behaviorWord = (m) => (m === null ? 'vertical tangent'
    : (m > 0 ? 'increasing' : (m < 0 ? 'decreasing' : 'horizontal tangent')));
const slopeLabel = (m) => (m === null ? 'dy/dx = DNE, vertical tangent' : 'dy/dx ' + nv(m));

const SLOPE_P = slopeAt(BX, BX_UP);        /* −3/4 on the upper branch */
const SLOPE_Q = slopeAt(BX, BX_LO);        /* +3/4 on the lower branch */

const BRANCH_SIGN = [
    { branch: 'upper branch, where y > 0', left: 'positive', leftAlso: 'increasing', right: 'negative', rightAlso: 'decreasing', change: '+ → −', verdict: 'a local maximum of the upper branch at (0, 5)', color: 'accent' },
    { branch: 'lower branch, where y < 0', left: 'negative', leftAlso: 'decreasing', right: 'positive', rightAlso: 'increasing', change: '− → +', verdict: 'a local minimum of the lower branch at (0, −5)', color: 'curveC' }
];

const CRIT_BOARD = [
    { p: '(0, 5)', d: '0', f: 'horizontal tangent, and a local maximum of the upper branch', color: 'accent' },
    { p: '(0, −5)', d: '0', f: 'horizontal tangent, and a local minimum of the lower branch', color: 'curveC' },
    { p: '(−5, 0)', d: 'DNE', f: 'vertical tangent, a critical location to investigate', color: 'auxInk' },
    { p: '(5, 0)', d: 'DNE', f: 'vertical tangent, a critical location to investigate', color: 'auxInk' }
];

export const circleBehaviorMode = {
    label: 'One relation, two branches',
    intro: 'One equation, one closed curve, and no line of it solved for y: x² + y² = 25. Topic 3.2 turned this relation into dy/dx = −x/y by differentiating both sides, and that formula stays on the board for the whole lesson. Topic 5.12 asks the question that comes after it. What does dy/dx tell us about how the relation behaves, and at which points? Pick a branch and move x, and the point P, its slope and its sign all follow from the same quotient.',
    params: { stage: 0, branch: 'upper', px: -3 },
    controls: [
        {
            key: 'branch', label: 'local branch for P', kind: 'choice',
            options: [{ v: 'upper', label: 'upper branch' }, { v: 'lower', label: 'lower branch' }],
            when: (env) => env.stage < 9
        },
        {
            key: 'px', label: 'x of P', min: -5, max: 5, step: 0.05, showDigits: 2,
            when: (env) => env.stage < 9
        }
    ],
    fns: {
        cTop: (x) => Math.sqrt(Math.max(0, R2 * R2 - x * x)),
        cBot: (x) => -Math.sqrt(Math.max(0, R2 * R2 - x * x))
    },
    compute: (env) => {
        const x = Math.max(-R2, Math.min(R2, env.px));
        const mag = Math.sqrt(Math.max(0, R2 * R2 - x * x));
        const y = env.branch === 'lower' ? -mag : mag;
        const m = slopeAt(x, y);
        return {
            px: x,
            py: y,
            branchName: env.branch === 'lower' ? 'lower' : 'upper',
            slope: m,
            hasSlope: m !== null,
            signWord: signWord(m),
            behavior: behaviorWord(m),
            slopeStr: m === null ? 'DNE' : nv(m)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                width: 440, height: 440,
                window: [-6.4, 6.4, -6.4, 6.4],
                title: (env) => {
                    if (env.stage === 3) return 'One vertical line x = 3, two points of the relation';
                    if (env.stage === 4) return 'The same x = 3, two different slopes';
                    if (env.stage >= 8) return 'The relation, its two branches, and the four special points';
                    return 'x² + y² = 25, with P on the ' + env.branchName + ' branch';
                },
                curves: (env) => [
                    { fn: 'cTop', from: -R2, to: R2, samples: 600, color: 'curveA', label: env.stage >= 1 ? 'upper branch' : '', labelAt: -3.9 },
                    { fn: 'cBot', from: -R2, to: R2, samples: 600, color: 'curveC', label: env.stage >= 1 ? 'lower branch' : '', labelAt: 3.9 }
                ],
                vlines: (env) => {
                    const out = [];
                    if (env.stage === 3 || env.stage === 4) out.push({ x: BX, color: 'auxInk', label: 'x = 3' });
                    if (env.stage >= 8) {
                        out.push({ x: R2, color: 'auxInk', label: 'x = 5' });
                        out.push({ x: -R2, color: 'auxInk', label: 'x = −5' });
                    }
                    return out;
                },
                points: (env) => {
                    const out = [{
                        x: (e) => e.px, y: (e) => e.py, r: 6.5, color: 'accent',
                        drag: { key: 'px', min: -R2, max: R2, snap: 0.05 },
                        label: (e) => 'P = ' + pt(e.px, e.py) + ', ' + e.branchName + ' branch',
                        labelDx: 10, labelDy: -15
                    }];
                    if (env.stage === 3 || env.stage === 4) {
                        out.push({
                            x: BX, y: BX_LO, r: 6, color: 'curveC',
                            label: '(3, −4), lower branch', labelDx: 10, labelDy: 20
                        });
                    }
                    if (env.stage >= 5 && env.stage < 9) {
                        const named = env.stage >= 7;
                        out.push({
                            x: 0, y: R2, r: 6.5, color: 'accent',
                            label: named ? '(0, 5), upper max' : '(0, 5), dy/dx = 0',
                            labelDx: -217, labelDy: -10
                        });
                        out.push({
                            x: 0, y: -R2, r: 6.5, color: 'curveC',
                            label: named ? '(0, −5), lower min' : '(0, −5), dy/dx = 0',
                            labelDx: -217, labelDy: 28
                        });
                    }
                    if (env.stage >= 8) {
                        /* The side points are the DNE ones. Their graph label names the
                           reading and the line, kept short so it sits inside its own
                           tick band, and the full sentence is carried by the equation
                           board and the point readout. */
                        out.push({ x: -R2, y: 0, r: 6.5, color: 'down', label: '(−5, 0), DNE, vertical', labelDx: 12, labelDy: 34 });
                        out.push({ x: R2, y: 0, r: 6.5, color: 'down', label: '(5, 0), DNE, vertical', labelDx: 12, labelDy: -46 });
                    }
                    return out;
                },
                segments: (env) => {
                    /* A straight dotted line through the point and its mirror image is
                       the circle's own radius, and it is a real chord of the relation,
                       so the tangent length reads as a true segment of the picture. */
                    if (env.stage >= 2 && env.stage < 3 && env.hasSlope) {
                        const m = env.slope;
                        return [{
                            x1: env.px - 2, y1: env.py - 2 * m,
                            x2: env.px + 2, y2: env.py + 2 * m,
                            color: 'accent', dashed: true
                        }];
                    }
                    return [];
                },
                tangents: (env) => {
                    const out = [];
                    const free = env.stage >= 1 && env.stage < 3;
                    const pair = env.stage === 4;
                    if (free && env.hasSlope) {
                        out.push({ x: env.px, y: env.py, m: env.slope, color: 'accent', reach: 0.14, label: (e) => slopeLabel(e.slope) });
                    }
                    if (env.stage >= 5 && env.stage < 9) {
                        const txt = env.stage >= 7 ? '' : 'dy/dx = 0';
                        out.push({ x: 0, y: R2, m: 0, color: 'accent', reach: 0.22, label: txt });
                        out.push({ x: 0, y: -R2, m: 0, color: 'curveC', reach: 0.22, label: txt });
                    }
                    if (pair) {
                        out.push({ x: BX, y: BX_UP, m: SLOPE_P, color: 'accent', reach: 0.2, label: 'slope ' + nv(SLOPE_P) });
                        out.push({ x: BX, y: BX_LO, m: SLOPE_Q, color: 'curveC', reach: 0.2, label: 'slope ' + nv(SLOPE_Q) });
                    }
                    return out;
                },
                notes: (env) => {
                    const out = [];
                    if (env.stage === 2) out.push({ x: -4.9, y: 5.4, color: 'up', t: 'upper branch: increasing here' });
                    if (env.stage >= 8 && env.stage < 9) {
                        out.push({ x: -5.9, y: 0.2, color: 'down', t: 'vertical tangent, no finite dy/dx' });
                    }
                    return out;
                }
            },
            {
                kind: 'table',
                title: 'Sign of dy/dx = −x/y on each side of x = 0',
                when: (env) => env.stage >= 6,
                cols: (env) => env.stage >= 7
                    ? ['Local branch', 'dy/dx just left of x = 0', 'dy/dx just right of x = 0', 'Sign change', 'What the signs give']
                    : ['Local branch', 'dy/dx just left of x = 0', 'dy/dx just right of x = 0'],
                rows: (env) => BRANCH_SIGN.map((b) => {
                    const row = [
                        { v: () => b.branch, bold: true },
                        { v: () => b.left + ', ' + b.leftAlso, color: b.left === 'positive' ? 'up' : 'down' },
                        { v: () => b.right + ', ' + b.rightAlso, color: b.right === 'positive' ? 'up' : 'down' }
                    ];
                    if (env.stage >= 7) {
                        row.push({ v: () => b.change });
                        row.push({ v: () => b.verdict, color: b.color, bold: true });
                    }
                    return row;
                }),
                note: (env) => env.stage >= 7
                    ? 'One branch, one left sign, one right sign, one conclusion. The same two points on the two branches answer with two different words, so the conclusion always names its branch.'
                    : 'Both columns read from dy/dx = −x/y with y kept on one branch. The signs are the evidence, and no point has been classified yet.'
            },
            {
                kind: 'table',
                title: 'Critical-point board for x² + y² = 25',
                when: (env) => env.stage >= 9,
                cols: ['Point', 'dy/dx', 'What it is on the relation'],
                rows: () => CRIT_BOARD.map((r) => [
                    { v: () => r.p, bold: true },
                    { v: () => r.d, color: r.d === 'DNE' ? 'down' : 'accent' },
                    { v: () => r.f, color: r.color }
                ]),
                note: 'Two halves of one definition. dy/dx = 0 gives the first two rows, and dy/dx not existing gives the last two. Being on this board means being worth investigating, and only the first two rows carry an extremum.'
            }
        ],
        side: [
            {
                kind: 'eq',
                title: 'The derivative this lesson starts with',
                lines: (env) => {
                    const out = [
                        { t: 'x² + y² = 25', rule: 'the relation, never solved for y' },
                        { t: 'dy/dx = −x / y', hl: true, color: 'accent', rule: 'topic 3.2, taken as ready' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'A slope on this relation belongs to a point (x, y), because the quotient reads y as well as x.' });
                    if (env.stage >= 2) out.push({ t: 'At P = ' + pt(-3, 4) + ' on the upper branch: dy/dx ' + nv(0.75) + ', so the sign is positive and the upper branch rises there.', hl: true, color: 'up' });
                    if (env.stage === 3 || env.stage === 4) out.push({ t: 'The two points at x = 3 both satisfy x² + y² = 25, so both belong to the relation and both feed the same formula different numbers.' });
                    if (env.stage >= 5 && env.stage < 7) out.push({ t: 'dy/dx = 0 needs the numerator to be 0 while the denominator is not, so x = 0 with y ≠ 0. The relation then gives y = ±5, and the two points are ' + pt(0, 5) + ' and ' + pt(0, -5) + '.', hl: true, color: 'accent' });
                    if (env.stage >= 8) out.push({ t: 'At (' + dsp(R2) + ', 0) and (' + dsp(-R2) + ', 0) the denominator y is 0, so dy/dx has no value there. The relation has vertical tangents at both.', hl: true, color: 'down' });
                    return out;
                }
            },
            {
                kind: 'readout',
                title: (env) => 'Reading at P on the ' + env.branchName + ' branch',
                items: (env) => {
                    const out = [
                        { label: 'Point', v: () => pt(env.px, env.py), big: true, color: 'accent' },
                        { label: 'Local branch', v: () => env.branchName + ' branch' },
                        { label: 'dy/dx', v: () => env.slopeStr, big: true, color: env.hasSlope ? 'ink' : 'down' },
                        { label: 'Sign of dy/dx', v: () => env.signWord, color: env.slope > 0 ? 'up' : (env.slope < 0 ? 'down' : 'auxInk') }
                    ];
                    if (env.stage >= 2) out.push({
                        label: 'Behavior of this branch at P',
                        v: () => env.behavior,
                        color: env.slope > 0 ? 'up' : (env.slope < 0 ? 'down' : 'accent')
                    });
                    return out;
                }
            },
            {
                kind: 'note',
                title: 'What branch means here',
                when: (env) => env.stage >= 3 && env.stage < 6,
                text: 'The circle is a relation. For −5 < x < 5 it has two local branches, an upper one with y = +√(25 − x²) and a lower one with y = −√(25 − x²). Those two formulas are here only to say what a branch is. Every slope on this lesson still comes from the implicit derivative dy/dx = −x/y, and no branch formula is differentiated.'
            },
            {
                kind: 'compare',
                title: 'The same x, two local branches',
                when: (env) => env.stage === 4,
                sides: () => [
                    {
                        title: 'Upper branch at (3, 4)',
                        lines: [
                            'dy/dx = −3 / 4 ' + nv(SLOPE_P),
                            'The tangent falls there.',
                            'Behavior of this branch at that point: decreasing.'
                        ]
                    },
                    {
                        title: 'Lower branch at (3, −4)',
                        lines: [
                            'dy/dx = −3 / (−4) ' + nv(SLOPE_Q),
                            'The tangent rises there.',
                            'Behavior of this branch at that point: increasing.'
                        ]
                    }
                ],
                verdict: 'One quotient, two y-values, two opposite slopes. Slopes belong to points (x, y) on a local branch, and an implicit relation has no single slope at an x-value.'
            },
            {
                kind: 'note',
                title: 'The short version of the First Derivative Test, on one branch',
                when: (env) => env.stage === 6,
                text: 'Two signs and one point are the whole evidence, exactly as topic 5.4 built it. Here the derivative is read on one local branch at a time, so the pair of signs always comes with the name of the branch it belongs to. Topic 5.2 called a point critical when the derivative is 0 or does not exist, and both halves of that definition are live on a relation.'
            },
            {
                kind: 'note',
                title: 'The side points carry a vertical tangent, not an extremum',
                when: (env) => env.stage >= 8 && env.stage < 9,
                text: 'These are points on the relation where the derivative with respect to x is not finite, so the relation has vertical tangents there. Each one is a critical location to investigate, and it is neither a maximum nor a minimum of y: points of the relation arbitrarily close to (5, 0) have y above 0 and points of the relation arbitrarily close to it have y below 0.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The board opens with the finished derivative, because topic 3.2 is the lesson that produced it. Read dy/dx = −x/y as a rule about points: it takes the two coordinates of one point of the relation and returns the slope of the tangent there. P sits at (' + dsp(-3) + ', ' + dsp(4) + ') on the upper branch, so the substitution is dy/dx = −(−3) / 4, and the tangent through P is drawn on the picture.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'At (' + dsp(-3) + ', ' + dsp(4) + ') on the upper branch, dy/dx = −(−3) / 4 ' + nv(0.75) + ' is positive. What does that positive derivative tell us about the upper branch near this point?',
                choices: [
                    'As x increases locally on the upper branch, y increases. The upper branch is increasing at that point.',
                    'The whole relation is increasing at x = −3, so the lower branch is rising there too.',
                    'Nothing yet, because a slope of ' + dsp(0.75) + ' only says the tangent is somewhat steep.',
                    'y is decreasing, because the formula dy/dx = −x/y begins with a minus sign.'
                ], a: 0,
                whyBy: [
                    'That is the topic 5.3 reading moved onto one local branch. Positive dy/dx means the y-values of that branch climb as x climbs, and the claim is about the upper branch at that point.',
                    'Check the other branch before believing it. At (−3, −4) the same formula gives −(−3) / (−4) ' + nv(-0.75) + ', so the lower branch is decreasing while the upper branch is increasing at the same x.',
                    'Steepness is one reading, and it is not the new one. The sign is what carries behavior: positive means rising on this branch, negative means falling.',
                    'The leading minus belongs to the formula, and the value it returns here is positive. Evaluate at the point before you name a sign.'
                ]
            },
            message: 'Positive means the branch rises. The upper branch is increasing at (' + dsp(-3) + ', ' + dsp(4) + '), and the label on the graph says upper branch because the claim belongs to that branch and not to the circle. The same x on the lower branch has a negative derivative, so the relation as a whole is neither rising nor falling there.'
        },
        {
            params: { stage: 3, px: BX, branch: 'upper' },
            message: 'Now stop moving x and fix it at ' + dsp(BX) + '. The vertical line x = 3 meets the circle twice, at (' + dsp(BX) + ', ' + dsp(BX_UP) + ') on the upper branch and at (' + dsp(BX) + ', ' + dsp(BX_LO) + ') on the lower branch, and both pairs satisfy x² + y² = 25. Two points, and no slope has been written on either one yet.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Does the phrase the slope at x = 3 name one unique value for the whole relation?',
                choices: [
                    'No. The relation has two points with x = 3, and their local branches carry different slopes.',
                    'Yes. dy/dx = −x/y is a formula built from x, so one x-value must give one slope.',
                    'Yes, but only for the upper branch, because the lower branch has no tangent line.',
                    'It depends on x alone once the relation is solved as one function y = f(x).'
                ], a: 0,
                whyBy: [
                    'Two points, two substitutions, two answers. The formula reads y as well as x, so a slope on a relation belongs to a point (x, y) on a local branch.',
                    'The formula reads −x / y, and y is not a function of x alone on this relation. At x = 3 the same quotient takes y = 4 and y = −4 to opposite signs.',
                    'The lower branch has a tangent there. Its slope is ' + dsp(SLOPE_Q) + ', and it is exactly the mirror of the upper branch slope ' + dsp(SLOPE_P) + '.',
                    'This relation has no single-valued y = f(x) to solve into, and the lesson never needs one. The two branches are analyzed point by point.'
                ]
            },
            message: 'The two tangents are on the picture now, and they fall and rise in opposite directions: slope ' + dsp(SLOPE_P) + ' on the upper branch at (' + dsp(BX) + ', ' + dsp(BX_UP) + ') and slope ' + dsp(SLOPE_Q) + ' on the lower branch at (' + dsp(BX) + ', ' + dsp(BX_LO) + '). This is why an implicit relation is read point by point or branch by branch, and never by x-value alone.'
        },
        {
            params: { stage: 5, px: 3, branch: 'upper' },
            predict: {
                q: 'Which points of x² + y² = 25 have a horizontal tangent?',
                choices: [
                    '(0, 5) and (0, −5), because dy/dx = 0 needs x = 0 with y ≠ 0, and the relation gives y = ±5.',
                    '(5, 0) and (−5, 0), because those are where the relation is widest.',
                    '(3, 4) and (3, −4), because x = 3 is the line we just fixed.',
                    'No point of the relation has a horizontal tangent, because a circle is not a function.'
                ], a: 0,
                whyBy: [
                    'A fraction is 0 when its numerator is 0 and its denominator is not. Here that is x = 0 with y ≠ 0, and x² + y² = 25 then gives y = ±5, so both points qualify.',
                    'At those two points y = 0, so the denominator is 0 and dy/dx has no value. No value is not the same value as 0, and those two points carry vertical tangents instead.',
                    'Those are the two points of the previous screen, and their slopes are ' + dsp(SLOPE_P) + ' and ' + dsp(SLOPE_Q) + '. Neither is 0.',
                    'A circle is not one global function, and it still has local branches with tangents. Horizontal tangents are found from the derivative and the relation together, which is exactly the work of this topic.'
                ]
            },
            message: 'Both horizontal tangents are drawn: dy/dx = 0 at (' + dsp(0) + ', ' + dsp(R2) + ') on the upper branch and at (' + dsp(0) + ', ' + dsp(-R2) + ') on the lower branch. The solve is one line, and the relation does the rest of it: x = 0 with y ≠ 0, then x² + y² = 25 gives y = ±5. No point is called a maximum or a minimum yet.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Just left of x = 0 and just right of x = 0, what does dy/dx = −x/y do on the upper branch?',
                choices: [
                    'It is positive just left of x = 0 and negative just right of it, because y stays positive on that branch and −x changes sign.',
                    'It is negative just left of x = 0 and positive just right of it.',
                    'It keeps the same sign on both sides, so the upper branch never turns at x = 0.',
                    'It does not exist on either side, because a circle has no derivative at x = 0.'
                ], a: 0,
                whyBy: [
                    'Left of 0 the numerator −x is positive with y positive, and right of 0 it is negative with the same positive y. That sign pair is the evidence the next question asks for, and the sign board lists it on the next screen.',
                    'That is the lower branch reading, where y is negative. On the lower branch the order really is − then +, and that is why the two branches will not come to the same conclusion.',
                    'Both sides of x = 0 on the upper branch are on the same side of the top of the circle, and the numerator −x changes sign exactly at x = 0.',
                    'The denominator y is ±5 at those points, so the quotient has a perfectly ordinary value. The derivative fails to exist only where y = 0, at (' + dsp(-R2) + ', 0) and (' + dsp(R2) + ', 0).'
                ]
            },
            message: 'The sign board is on the screen with both branches listed: the upper branch runs positive then negative across x = 0, and the lower branch runs negative then positive. That is the whole evidence set. The conclusion has to come from a sign change, so say which is which before any name is attached to either point.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'Using only those sign pairs, what do the signs give at the two points?',
                choices: [
                    'The upper branch has a local maximum at (0, 5), and the lower branch has a local minimum at (0, −5).',
                    'The upper branch has a local minimum at (0, 5), and the lower branch has a local maximum at (0, −5).',
                    'Both points are local maxima, because dy/dx = 0 at both of them.',
                    'Neither point is an extremum, because a circle is not a single function y = f(x).'
                ], a: 0,
                whyBy: [
                    'The upper branch climbs into x = 0 and falls away from it, so its values near (0, 5) sit below 5 and the point is a local maximum of that branch. The lower branch falls in and climbs out, so (0, −5) is a local minimum of that branch.',
                    'That inverts both readings. A local minimum needs the sign order − then +, and on the upper branch the order is + then −.',
                    'This is the mistake topic 5.4 was built to stop. dy/dx = 0 marks a critical point, and the sign pair on either side is what classifies it. Two points with the same derivative value can still classify differently, and here they do.',
                    'Being a relation rather than one global function is exactly why the answer is stated branch by branch. Each local branch is a function of x near its own point, and the First Derivative Test reads that branch.'
                ]
            },
            message: 'Two conclusions, and each one carries the name of its branch: a local maximum of the upper branch at (0, 5), and a local minimum of the lower branch at (0, −5). The sign board now shows the sign change and the result of reading it, and the graph labels each top point as the max or min of its own branch. Neither claim says anything about the other branch.'
        },
        {
            params: { stage: 8, px: 3, branch: 'upper' },
            predict: {
                q: 'At (' + dsp(-R2) + ', 0) and (' + dsp(R2) + ', 0) the denominator y of dy/dx = −x/y is 0, so the derivative has no value. What does that give on the relation?',
                choices: [
                    'Points where the derivative with respect to x is not finite, and the relation has vertical tangents there.',
                    'A local maximum at each of them, because a vertical tangent always sits at the top of a curve.',
                    'A horizontal tangent at each of them, because the numerator is also a number.',
                    'Nothing to investigate, because a point with no derivative cannot be a critical point.'
                ], a: 0,
                whyBy: [
                    'That is the honest reading. The slope grows without settling as P approaches either point along its branch, so no finite tangent exists and the tangent line is the vertical line x = 5 or x = −5, drawn on the picture as a real line.',
                    'Vertical is not top. Look at the neighborhood on the relation: points of the circle arbitrarily close to (5, 0) have y above 0 and other points of the circle have y below 0, so the point holds neither a maximum nor a minimum of y.',
                    'A zero denominator is not a zero derivative. dy/dx = 0 required a zero numerator with a nonzero denominator, which is the previous pair of points at (0, ±5).',
                    'Topic 5.2 defines a critical point as a place where the derivative is 0 or does not exist. The second half of that definition is what put these two points on the board.'
                ]
            },
            message: 'The two vertical tangents are drawn as the lines x = 5 and x = −5, and at (5, 0) and (−5, 0) the readout and the equation board both carry dy/dx = DNE. No finite tangent segment appears at either point, because there is no finite slope to draw. The readout says DNE rather than printing a quotient of a number over zero.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'Both points (' + dsp(-R2) + ', 0) and (' + dsp(R2) + ', 0) are critical locations where dy/dx does not exist. Do either of them hold a local maximum or a local minimum of y?',
                choices: [
                    'No. Points of the relation close to (5, 0) have y above 0 and points close to it have y below 0, so the point holds neither, and it stays a critical location with a vertical tangent.',
                    'Yes. Both are local minima of y, because the circle never goes below them at that side.',
                    'Yes. A point where the derivative does not exist is always a local extremum.',
                    'Yes, but only on the lower branch, because that branch reaches y = 0 there.'
                ], a: 0,
                whyBy: [
                    'Correct, and it is the careful reading. Vertical tangents at the sides of a closed relation put y-values on both sides of 0 in every neighborhood, so neither extremum claim survives, and the rows on the board stay labeled as critical locations.',
                    'The relation does go below 0 near x = 5, on the lower branch, and it also goes above 0 near there on the upper branch. One point cannot be both a minimum and a maximum, and it is neither.',
                    'This is the mistake the whole board is built to block. A derivative that fails to exist marks a point worth investigating, and topic 5.2 said plainly that a critical point does not automatically produce an extremum.',
                    'The lower branch through (5, 0) has no open x-interval around 5 to be a function on, so a local extremum of y is not even the right question for that branch at that point. What the point has is a vertical tangent.'
                ]
            },
            message: 'The critical-point board gathers all four rows: two with dy/dx = 0 and one extremum each, and two with dy/dx = DNE and no extremum at all. The branch control and the x control are retired now, because the four rows are point facts and there is nothing left to sweep.'
        },
        {
            params: { stage: 10 },
            message: 'Read the board back as the question this topic asks. Nothing on it came from solving the circle for y. Every row came from one quotient dy/dx = −x/y, from its value at a point, from its sign on one local branch, and from the points where it has no value at all. Topic 5.12 is the behavior reading, and topic 3.2 is the tool that made it possible.'
        }
    ],
    summary: {
        idea: 'On the relation x² + y² = 25 the derivative dy/dx = −x/y belongs to a point (x, y) on a local branch, never to an x-value alone. Its sign says increasing or decreasing for that branch, its zeros at (0, 5) and (0, −5) mark the horizontal tangents that a left-and-right sign pair classifies as a local maximum on the upper branch and a local minimum on the lower branch, and its undefined values at (−5, 0) and (5, 0) mark vertical tangents that stay critical locations to investigate.',
        mistake: 'Do not assign one slope or one behavior to an x-value: the relation has two points at x = 3, with slope ' + nv(SLOPE_P) + ' on the upper branch and slope ' + nv(SLOPE_Q) + ' on the lower branch. Do not conclude an extremum from dy/dx = 0 before reading the signs on both sides of the point, and do not crown the points where dy/dx does not exist either. The side points of this circle have vertical tangents and hold no local extremum of y.',
        transfer: 'On x² + y² = 25, name every point with a horizontal tangent and every point with a vertical tangent, and say which local branch each claim belongs to. Then predict what dy/dx = −x/y does just left and just right of x = 0 on the lower branch before you look back at the sign board.'
    }
};

export default circleBehaviorMode;
