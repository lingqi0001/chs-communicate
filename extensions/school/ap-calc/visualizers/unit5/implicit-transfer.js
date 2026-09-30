/* 5.12 Exploring Behaviors of Implicit Relations.
   Mode 3, the transfer board: x² + xy + y² = 7 analyzed with no circle giving
   the geometry away. The xy term tilts the relation, so its two local branches
   are not two familiar halves, and every conclusion has to come from the
   derivative rule itself.

   Topic 3.2 already differentiated this exact relation, so the derivative is
   handed over as given: dy/dx = −(2x + y) / (x + 2y). No screen re-derives it.
   What follows is the behavior reading the topic asks for. The horizontal
   tangents come from pairing the numerator 2x + y = 0 with the relation, the
   vertical tangents come from pairing the denominator x + 2y = 0 with the
   relation plus a check that the same point is not a 0/0 case, and the local
   reading at (1, 2) uses the sign of dy/dx for decreasing and the sign of a
   code-computed y″ for concave down. The ending card is the one comparison of
   topic 3.2 with topic 5.12, and nothing beyond it.

   Reveal discipline: one monotone params.stage, and a reveal always lives in the
   same step object as the Predict whose answer it shows. On screen i the
   narration is steps[i-1].message and the open question is steps[i].predict, so
   the stage set in step j first paints on screen j+1. Screen i therefore carries
   stage i − 1, which is the scene the question on it needs. So a coordinate
   appears only after the question that asks for it, a verification row appears
   only after the question that asks whether the check is needed, and no
   classification word appears while its own question is open. Nothing is gated
   on an answer, so Next works with every question untouched. Working cards
   retire with a ceiling once the screen that needed them has passed, and the
   board, the live readout and the finished summary stay.

   Number discipline: every printed value comes from the two formulas. Each
   tangent point carries its exact radical form plus a rounded pair printed with
   ≈, and the value of y″ at (1, 2) is produced by exact rational arithmetic in
   this file rather than typed. Where x + 2y is 0 the quotient has no value, so
   the picture draws an explicit vertical line, the copy says DNE, and no finite
   tangent is faked there. No raw not-a-number value reaches the screen. */

/* x² + xy + y² = 7 solved as a quadratic in y:
   y = (−x ± √(28 − 3x²)) / 2, real for |x| ≤ √(28/3) ≈ 3.055 */
const E_TOP = (x) => (-x + Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;
const E_BOT = (x) => (-x - Math.sqrt(Math.max(0, 28 - 3 * x * x))) / 2;
const X_END = Math.sqrt(28 / 3);                    /* the relation's own x span */
const SQ = Math.sqrt(7 / 3);                        /* √(7/3), shared by both pairs */
const WX = 4.5;                                     /* window half-width, keeps the ±4 tick inside */

/* Horizontal tangents: the numerator 2x + y = 0 gives y = −2x, and pairing that
   with the relation gives 3x² = 7, so x = ±√(7/3) with y = ∓2√(7/3). */
const H_UP = { x: -SQ, y: 2 * SQ, branch: 'upper branch', key: 'x = −√(7/3)', rad: '(−√(7/3), 2√(7/3))' };
const H_LO = { x: SQ, y: -2 * SQ, branch: 'lower branch', key: 'x = √(7/3)', rad: '(√(7/3), −2√(7/3))' };
/* Vertical tangents: the denominator x + 2y = 0 gives x = −2y, and the relation
   gives 3y² = 7, so y = ±√(7/3) with x = ∓2√(7/3). Both land where the two
   branches meet, since the branches join at |x| = √(28/3), so neither one is
   claimed as a tangent of a single branch. */
const V_L = { x: -2 * SQ, y: SQ, branch: 'where the two branches meet', key: 'y = √(7/3)', rad: '(−2√(7/3), √(7/3))' };
const V_R = { x: 2 * SQ, y: -SQ, branch: 'where the two branches meet', key: 'y = −√(7/3)', rad: '(2√(7/3), −√(7/3))' };
/* The point of the local reading. 1 + 2 + 4 = 7, so (1, 2) is on the relation. */
const EP = { x: 1, y: 2, rad: '(1, 2)' };

function dsp(v) {
    if (!Number.isFinite(v)) return 'no value';
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-9 ? '=' : '≈';
}
const nv = (v) => rel(v) + ' ' + dsp(v);
const pt = (x, y) => '(' + dsp(x) + ', ' + dsp(y) + ')';/* An exact radical label with its rounded pair behind it. */
const withApprox = (p) => p.rad + ' ≈ ' + pt(p.x, p.y);

/* The two parts of dy/dx, evaluated as numbers so no sign claim is asserted by
   hand. A zero denominator leaves the quotient with no value at all. */
const numr = (p) => 2 * p.x + p.y;
const denr = (p) => p.x + 2 * p.y;
const onRel = (p) => p.x * p.x + p.x * p.y + p.y * p.y;
const isZero = (v) => Math.abs(v) < 1e-9;
const slopeAt = (p) => (isZero(denr(p)) ? null : -numr(p) / denr(p));

/* Exact rational arithmetic, so the printed y″ at (1, 2) is computed from
   y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y) rather than typed as a decimal. */
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
const EP_NUM1 = fAdd(fMul(TWO, { n: EP.x, d: 1 }), { n: EP.y, d: 1 });         /* 2x + y = 4 */
const EP_DEN1 = fAdd({ n: EP.x, d: 1 }, fMul(TWO, { n: EP.y, d: 1 }));         /* x + 2y = 5 */
const EP_YPRIME = fMul(NEG, fDiv(EP_NUM1, EP_DEN1));                            /* y′ = −4/5 */
const EP_NUM2 = fAdd(TWO, fAdd(fMul(TWO, EP_YPRIME), fMul(TWO, fMul(EP_YPRIME, EP_YPRIME))));
const EP_Y2 = fMul(NEG, fDiv(EP_NUM2, EP_DEN1));                                /* y″ = −42/125 */

const SLOPE_E = fVal(EP_YPRIME);
const DD_E = fVal(EP_Y2);

/* Behavior words read from the computed signs, never written point by point. */
const decreaseWord = (m) => (m > 0 ? 'increasing' : (m < 0 ? 'decreasing' : 'horizontal tangent'));
const concaveWord = (dd) => (dd < 0 ? 'concave down' : (dd > 0 ? 'concave up' : 'y″ = 0'));

/* The five rows the mode finishes with. The four tangent rows are built from the
   two parts of dy/dx at the found points, and the slope column follows from
   whether the denominator vanishes. */
const TANGENT_POINTS = [H_UP, H_LO, V_L, V_R];
const FINAL_ROWS = () => TANGENT_POINTS.map((p) => {
    const m = slopeAt(p);
    return {
        pt: withApprox(p),
        d: m === null ? 'DNE' : (isZero(m) ? '0' : nv(m)),
        f: m === null
            ? 'x + 2y = 0 on the relation with 2x + y ' + nv(numr(p)) + ', so the relation has a vertical tangent at that point'
            : '2x + y = 0 on the relation with x + 2y ' + nv(denr(p)) + ', so a horizontal tangent on the ' + p.branch,
        color: m === null ? 'down' : 'accent'
    };
}).concat([{
    pt: '(1, 2)',
    d: fStr(EP_YPRIME) + ' ' + nv(SLOPE_E),
    f: 'y″ ' + fStr(EP_Y2) + ' ' + nv(DD_E) + ', so the branch through (1, 2) is '
        + decreaseWord(SLOPE_E) + ' and ' + concaveWord(DD_E) + ' there',
    color: 'curveC'
}]);

export const implicitTransferMode = {
    label: 'Analyze a new relation',
    intro: 'A new relation, and no circle to read the answer off: x² + xy + y² = 7. The xy term tilts it, so the two local branches are not two familiar halves and nothing about their behavior is free. Topic 3.2 already differentiated this relation, so the derivative comes as a given: dy/dx = −(2x + y) / (x + 2y). Topic 5.12 runs the whole behavior reading on it. Find the horizontal tangents from the numerator, find the vertical tangents from the denominator, and then read one local branch at one point.',
    params: { stage: 0 },
    controls: [],
    fns: {
        eTop: E_TOP,
        eBot: E_BOT,
        hLine: (x) => -2 * x,
        vLine: (x) => -x / 2
    },
    compute: (env) => {
        const s = env.stage;
        const pack = (p) => ({
            p, num: numr(p), den: denr(p), on: onRel(p), m: slopeAt(p)
        });
        return {
            showBranches: s >= 1,
            hLineOn: s >= 2 && s < 4,
            hPointsOn: (s >= 3 && s < 7) || s >= 10,
            hTangentsOn: (s >= 3 && s < 7) || s >= 10,
            relationCheckH: s >= 4 && s < 5,
            vLineOn: s >= 5 && s < 7,
            vPointsOn: (s >= 5 && s < 7) || s >= 10,
            tangentCheckV: s >= 6 && s < 7,
            ePointOn: s >= 7,
            eReadout: s >= 7 && s < 10,
            eBehavior: s >= 8 && s < 10,
            eConcave: s >= 9 && s < 10,
            finalBoard: s >= 10,
            compareCard: s >= 10,
            hPair: [pack(H_UP), pack(H_LO)],
            vPair: [pack(V_L), pack(V_R)],
            ePack: pack(EP)
        };
    },
    panes: {
        main: [
            {
                kind: 'graph',
                width: 440, height: 440,
                window: [-WX, WX, -WX, WX],
                title: (env) => {
                    if (env.stage >= 10) return 'x² + xy + y² = 7 with all five readings on one picture';
                    if (env.stage >= 9) return 'The local branch through (1, 2), read by two signs';
                    if (env.stage >= 7) return 'A third reading: what dy/dx says at the point (1, 2)';
                    if (env.stage >= 6) return 'Two points with dy/dx = 0 and two points where dy/dx has no value';
                    if (env.stage >= 5) return 'The line x + 2y = 0, and the two points it shares with the relation';
                    if (env.stage >= 4) return 'Two points of the relation with dy/dx = 0';
                    if (env.stage >= 3) return 'The line 2x + y = 0, and the two points it shares with the relation';
                    if (env.stage >= 2) return 'The line 2x + y = 0 drawn across the two branches';
                    if (env.stage >= 1) return 'x² + xy + y² = 7, a tilted relation with two local branches';
                    return 'x² + xy + y² = 7';
                },
                curves: (env) => {
                    const out = [
                        { fn: 'eTop', from: -X_END, to: X_END, samples: 600, color: 'curveA', label: env.showBranches ? 'upper branch' : '', labelAt: 1.6 },
                        { fn: 'eBot', from: -X_END, to: X_END, samples: 600, color: 'curveC', label: env.showBranches ? 'lower branch' : '', labelAt: -1.6 }
                    ];
                    if (env.hLineOn) {
                        out.push({
                            fn: 'hLine', from: -1.5, to: 1.5, samples: 40, color: 'auxInk', dashed: true,
                            label: '2x + y = 0, so y = −2x', labelAt: 1.32
                        });
                    }
                    if (env.vLineOn) {
                        out.push({
                            fn: 'vLine', from: -3.0, to: 3.0, samples: 40, color: 'auxInk', dashed: true,
                            label: 'x + 2y = 0', labelAt: -2.55
                        });
                    }
                    return out;
                },
                points: (env) => {
                    const out = [];
                    if (env.hPointsOn) {
                        out.push({
                            x: H_UP.x, y: H_UP.y, r: 6.5, color: 'accent',
                            label: H_UP.rad, labelDx: -152, labelDy: -12
                        });
                        out.push({
                            x: H_LO.x, y: H_LO.y, r: 6.5, color: 'accent',
                            label: H_LO.rad, labelDx: 14, labelDy: -12
                        });
                    }
                    if (env.vPointsOn) {
                        out.push({
                            x: V_L.x, y: V_L.y, r: 6.5, color: 'down',
                            label: V_L.rad, labelDx: -158, labelDy: -12
                        });
                        out.push({
                            x: V_R.x, y: V_R.y, r: 6.5, color: 'down',
                            label: V_R.rad, labelDx: 12, labelDy: -14
                        });
                    }
                    if (env.ePointOn) {
                        out.push({
                            x: EP.x, y: EP.y, r: 7, color: 'curveC',
                            label: env.finalBoard ? EP.rad : '(1, 2), upper branch',
                            labelDx: 12, labelDy: -12
                        });
                    }
                    return out;
                },
                tangents: (env) => {
                    const out = [];
                    const quiet = env.finalBoard ? '' : 'dy/dx = 0';
                    if (env.hTangentsOn) {
                        out.push({ x: H_UP.x, y: H_UP.y, m: 0, color: 'accent', reach: 0.17, label: quiet });
                        out.push({ x: H_LO.x, y: H_LO.y, m: 0, color: 'accent', reach: 0.17, label: quiet });
                    }
                    if (env.ePointOn) {
                        out.push({
                            x: EP.x, y: EP.y, m: SLOPE_E, color: 'curveC', reach: 0.2,
                            label: env.finalBoard ? '' : 'dy/dx ' + nv(SLOPE_E)
                        });
                    }
                    return out;
                },
                /* A vertical tangent is drawn as a real vertical line, because the
                   quotient has no finite value to build a tangent from. */
                vlines: (env) => {
                    const out = [];
                    if (env.vPointsOn) {
                        out.push({ x: V_L.x, color: 'down', label: env.stage >= 6 && env.stage < 10 ? 'dy/dx = DNE' : '' });
                        out.push({ x: V_R.x, color: 'down', label: env.stage >= 6 && env.stage < 10 ? 'dy/dx = DNE' : '' });
                    }
                    return out;
                },
                notes: (env) => {
                    if (!env.eBehavior) return [];
                    return [{
                        x: -3.5, y: 2.6, color: 'down',
                        t: 'the branch through (1, 2): ' + decreaseWord(SLOPE_E)
                            + (env.eConcave ? ' and ' + concaveWord(DD_E) : '')
                    }];
                }
            },
            {
                kind: 'table',
                title: 'The five readings on x² + xy + y² = 7',
                when: (env) => env.finalBoard,
                cols: ['Point', 'dy/dx', 'What the two formulas give'],
                rows: () => FINAL_ROWS().map((r) => [
                    { v: () => r.pt, bold: true },
                    { v: () => r.d, color: r.d === 'DNE' ? 'down' : 'accent' },
                    { v: () => r.f, color: r.color }
                ]),
                note: 'Every row was produced the same way. Solve one part of dy/dx for a line, keep only the points of that line that also satisfy x² + xy + y² = 7, then read what the quotient does there. Two rows give dy/dx = 0, two give a quotient with no value, and one row reads a point that was given rather than solved for.'
            }
        ],
        side: [
            {
                kind: 'eq',
                title: 'The work board',
                lines: (env) => {
                    const out = [
                        { t: 'x² + xy + y² = 7', rule: 'the relation, never solved for y' }
                    ];
                    if (env.stage >= 1) out.push({
                        t: 'dy/dx = −(2x + y) / (x + 2y)', hl: true, color: 'accent',
                        rule: 'topic 3.2 produced this, and 5.12 uses it'
                    });
                    if (env.stage >= 2) out.push({
                        t: 'Horizontal tangent needs 2x + y = 0 with x + 2y ≠ 0.', hl: true
                    });
                    if (env.stage >= 3) out.push({
                        t: 'y = −2x in the relation: x² − 2x² + 4x² = 3x² = 7',
                        rule: 'pair the condition with the relation'
                    });
                    if (env.stage >= 3) out.push({
                        t: 'So ' + withApprox(H_LO) + ' and ' + withApprox(H_UP), hl: true
                    });
                    if (env.stage >= 4) out.push({
                        t: '2x + y = 0 by itself is a whole line of candidates, and only two of them are points of the relation.', color: 'auxInk'
                    });
                    if (env.stage >= 5) out.push({
                        t: 'Vertical tangent needs x + 2y = 0, so x = −2y, and the relation gives 4y² − 2y² + y² = 3y² = 7',
                        rule: 'the same pairing on the other part'
                    });
                    if (env.stage >= 5) out.push({
                        t: 'So y = ±√(7/3) with x = ∓2√(7/3): ' + V_L.rad + ' and ' + V_R.rad, hl: true
                    });
                    if (env.stage >= 6) out.push({
                        t: 'Both of those are points of the relation, and 2x + y ' + nv(numr(V_L)) + ' and ' + nv(numr(V_R)) + ' there, so neither is a 0/0 case.', hl: true, color: 'down'
                    });
                    if (env.stage >= 7) out.push({
                        t: 'At (1, 2): 2x + y ' + nv(fVal(EP_NUM1)) + ' and x + 2y ' + nv(fVal(EP_DEN1)) + ', so dy/dx = ' + fStr(EP_YPRIME) + ' ' + nv(SLOPE_E),
                        rule: '1 + 2 + 4 = 7, so the point is on the relation'
                    });
                    if (env.stage >= 8) out.push({
                        t: 'y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y) = −(' + fStr(EP_NUM2) + ') / ' + fStr(EP_DEN1) + ' = ' + fStr(EP_Y2) + ' ' + nv(DD_E),
                        rule: 'computed from the implicit y″ of this relation, with y′ = ' + fStr(EP_YPRIME)
                    });
                    if (env.stage >= 9) out.push({
                        t: 'slope < 0 gives ' + decreaseWord(SLOPE_E) + ' locally, and y″ < 0 gives ' + concaveWord(DD_E) + ' locally on the branch through (1, 2).', hl: true, color: 'down'
                    });
                    return out;
                }
            },
            {
                kind: 'readout',
                title: (env) => env.eReadout ? 'Reading at the point (1, 2)' : 'Reading at the tangent points found so far',
                when: (env) => env.stage >= 3 && env.stage < 10,
                items: (env) => {
                    if (env.eReadout) {
                        const out = [
                            { label: 'Point', v: () => EP.rad, big: true, color: 'curveC' },
                            { label: 'Local branch', v: () => 'upper branch', color: 'curveC' },
                            { label: 'The other point of the relation with x = 1', v: () => pt(1, E_BOT(1)) },
                            { label: 'Numerator 2x + y', v: () => nv(env.ePack.num) },
                            { label: 'Denominator x + 2y', v: () => nv(env.ePack.den) },
                            { label: 'dy/dx', v: () => fStr(EP_YPRIME) + ' ' + nv(SLOPE_E), big: true, color: 'down' },
                            { label: 'Sign of dy/dx', v: () => (SLOPE_E > 0 ? 'positive' : 'negative'), color: 'down' }
                        ];
                        if (env.eBehavior) out.push({ label: 'Behavior of this branch at (1, 2)', v: () => decreaseWord(SLOPE_E), color: 'down', big: true });
                        if (env.eBehavior) out.push({ label: 'd²y/dx² from −(2 + 2y′ + 2(y′)²) / (x + 2y)', v: () => fStr(EP_Y2) + ' ' + nv(DD_E), color: 'down' });
                        if (env.eConcave) out.push({ label: 'Concavity of this branch at (1, 2)', v: () => concaveWord(DD_E), color: 'down', big: true });
                        return out;
                    }
                    const vertical = env.stage >= 5;
                    const pair = vertical ? env.vPair : env.hPair;
                    const checked = vertical ? env.tangentCheckV : env.relationCheckH;
                    const out = [];
                    pair.forEach((c) => {
                        out.push({ label: 'Point with ' + c.p.key, v: () => withApprox(c.p), big: true, color: vertical ? 'down' : 'accent' });
                        out.push({ label: 'On which local branch', v: () => c.p.branch });
                        out.push({ label: 'Denominator x + 2y', v: () => nv(c.den) });
                        out.push({ label: 'Numerator 2x + y', v: () => (vertical && !checked ? 'not checked yet' : nv(c.num)) });
                        out.push({
                            label: 'dy/dx',
                            v: () => (c.m === null ? 'DNE, no value' : nv(c.m)),
                            color: c.m === null ? 'down' : 'accent'
                        });
                        out.push({
                            label: 'x² + xy + y² at that point',
                            v: () => (checked ? nv(c.on) : 'not checked yet'),
                            color: 'up'
                        });
                    });
                    return out;
                }
            },
            {
                kind: 'checklist',
                title: 'Is one equation enough?',
                when: (env) => env.relationCheckH,
                items: [
                    { t: '2x + y = 0 says where the numerator of dy/dx vanishes.', state: () => true },
                    { t: 'The origin (0, 0) satisfies 2x + y = 0.', state: () => true },
                    { t: 'The origin (0, 0) lies on x² + xy + y² = 7 as well.', state: () => false },
                    { t: 'Both found points give x² + xy + y² = 7.', state: (env) => env.hPair.every(c => isZero(c.on - 7)) },
                    { t: 'Both found points have x + 2y ≠ 0, so dy/dx is 0 there rather than without a value.', state: (env) => env.hPair.every(c => !isZero(c.den)) }
                ],
                verdict: () => 'Setting the numerator to 0 supplies one equation, and the relation supplies the second. Only the pair turns a line of candidates into two points of the curve.'
            },
            {
                kind: 'checklist',
                title: 'Is a zero denominator enough for a vertical tangent?',
                when: (env) => env.tangentCheckV,
                items: [
                    { t: 'x + 2y = 0 says where the denominator of dy/dx vanishes.', state: () => true },
                    { t: 'The origin (0, 0) satisfies x + 2y = 0.', state: () => true },
                    { t: 'The origin (0, 0) lies on x² + xy + y² = 7 as well.', state: () => false },
                    { t: 'Both found points give x² + xy + y² = 7.', state: (env) => env.vPair.every(c => isZero(c.on - 7)) },
                    { t: 'At both, the numerator 2x + y is nonzero, so neither is a 0/0 case.', state: (env) => env.vPair.every(c => !isZero(c.num)) }
                ],
                verdict: () => 'A zero denominator is a candidate list. The relation filters it, and the other part of the quotient is checked before the line is called vertical.'
            },
            {
                kind: 'table',
                title: 'The reading at (1, 2)',
                when: (env) => env.eConcave,
                cols: ['Quantity', 'Value', 'Reading of the local branch through (1, 2)'],
                rows: () => ([
                    [
                        { v: () => 'dy/dx' },
                        { v: () => fStr(EP_YPRIME) + ' ' + nv(SLOPE_E), color: 'down', bold: true },
                        { v: () => decreaseWord(SLOPE_E) + ' as x increases through the point', color: 'down' }
                    ],
                    [
                        { v: () => 'd²y/dx²' },
                        { v: () => fStr(EP_Y2) + ' ' + nv(DD_E), color: 'down', bold: true },
                        { v: () => concaveWord(DD_E) + ' at the point', color: 'down' }
                    ]
                ]),
                note: 'Two signs from two formulas, and both claims name the same local branch. The slope does not make (1, 2) a maximum, and the second derivative says nothing about the other branch.'
            },
            {
                kind: 'compare',
                title: 'Topic 3.2 and topic 5.12 on the same relation',
                when: (env) => env.compareCard,
                sides: () => [
                    {
                        title: 'Topic 3.2',
                        lines: ['Find dy/dx implicitly.']
                    },
                    {
                        title: 'Topic 5.12',
                        lines: ['Use dy/dx and d²y/dx² to analyze the implicit relation.']
                    }
                ],
                verdict: 'This tab started from the derivative topic 3.2 produces, and spent every screen on what that derivative says at a point or on a branch.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The board opens with the relation and the derivative topic 3.2 produced for it, because 3.2 is the lesson that differentiated x² + xy + y² = 7 term by term and gathered the dy/dx parts. Read the formula as a rule with two named parts: 2x + y on top, x + 2y below. The coordinates of one point decide both parts, so a slope on this relation is a statement about a point. The picture shows the two local branches, and no special point has been placed yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'This relation has points where the tangent is horizontal. Which condition on dy/dx = −(2x + y) / (x + 2y) finds them?',
                choices: [
                    '2x + y = 0 while x + 2y is not 0, at a point that also satisfies x² + xy + y² = 7.',
                    'x + 2y = 0, because a tangent is horizontal where the bottom part vanishes.',
                    '2x + y = 0 taken by itself, because every solution of that equation is a point of the relation.',
                    'x² + xy + y² = 7 on its own, because the shape of the curve settles the tangent.'
                ], a: 0,
                whyBy: [
                    'A quotient is 0 when its numerator is 0 and its denominator is not, so 2x + y = 0 with x + 2y ≠ 0. The point also has to be on the relation, and that pairing is the work of the next screen.',
                    'x + 2y is the denominator. Where it is 0 the quotient has no value at all, which is the vertical reading, and the vertical case comes later on this tab.',
                    '2x + y = 0 is a whole line, and most of that line is off the relation. The origin is on the line and not on the curve, so it can carry no tangent of this relation.',
                    'The relation says which points exist, and nothing about a tangent. The derivative is what turns a point of the curve into a horizontal or a vertical tangent.'
                ]
            },
            message: 'The condition is on the work board, and the line it names is drawn across the picture: 2x + y = 0 written as y = −2x. That dashed line is a candidate list, not yet an answer. The two places it meets the relation are where the next screen puts its points, and no point is on the picture yet.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Pair y = −2x with the relation x² + xy + y² = 7. What equation in x results, and what are the points?',
                choices: [
                    '3x² = 7, so x = ±√(7/3) with y = ∓2√(7/3), giving ' + H_LO.rad + ' and ' + H_UP.rad + '.',
                    '7x² = 7, so x = ±1 with y = ∓2, giving (1, −2) and (−1, 2).',
                    '−3x² = 7, so there is no real solution and the relation has no horizontal tangent.',
                    'x² − 2x = 7, so x = 2 ± √11 with y = −2x.'
                ], a: 0,
                whyBy: [
                    'x² + x(−2x) + (−2x)² = x² − 2x² + 4x² = 3x², so 3x² = 7 and x = ±√(7/3). Then y = −2x turns each x into its own y, and the two points appear on the picture.',
                    'That counts the middle term with the wrong sign. x(−2x) is −2x², so the three terms add to 1 − 2 + 4 = 3 copies of x², not 7.',
                    'The last term is (−2x)², and a square of a real number is not negative, so it enters as +4x². The sum 1 − 2 + 4 is positive, and 3x² = 7 does have two real solutions.',
                    'That substitutes y = −2x into only one term. Every x in the relation pairs with the same y, and the whole left side is quadratic in x.'
                ]
            },
            message: 'The two points are on the picture with their tangents flat at dy/dx = 0, and the readout lists both. Their x + 2y values are ' + nv(denr(H_UP)) + ' and ' + nv(denr(H_LO)) + ', so neither quotient is dividing by zero, and the horizontal tangent reading is safe. What has not been said yet is why the relation had to enter the solve at all.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Every point of the line 2x + y = 0 makes the numerator 0. Why is setting only the numerator equal to 0 not enough to place a horizontal tangent?',
                choices: [
                    'Because a tangent belongs to a point of the relation, so the candidate must also satisfy x² + xy + y² = 7, and the denominator must not be 0 there.',
                    'Because the numerator 2x + y can be 0 at a point where the tangent is vertical instead.',
                    'Because a line has no tangent, and the relation was replaced by a line.',
                    'Because a tilted relation has no horizontal tangent anywhere.'
                ], a: 0,
                whyBy: [
                    'The derivative condition supplies candidates and the relation decides which of them are points of the curve. The denominator check keeps the quotient equal to 0 rather than leaving it without a value. The audit below runs all three rows.',
                    'The vertical tangents of this relation come from x + 2y = 0, which is a different line. Numerator 0 with denominator 0 would be a 0/0 case to analyze, and that is not a horizontal tangent either.',
                    'The line was never used as the curve. Substituting it back into the relation is exactly what recovered the two points, and the picture still draws the relation.',
                    'Tilted is not the same as turning. The top of the upper branch and the bottom of the lower branch are still flat, and the substitution found both.'
                ]
            },
            message: 'That is the pairing topic 5.12 never drops. On the circle the check was quiet, because every real solution of −x / y = 0 already lies on x² + y² = 25. Here the numerator line misses most of the plane, so the relation does real work, and the readout now reports x² + xy + y² at each found point.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Now the reading where dy/dx has no value. Which condition finds it, and what does pairing it with the relation give?',
                choices: [
                    'x + 2y = 0, so x = −2y, and the relation gives 3y² = 7, so ' + V_L.rad + ' and ' + V_R.rad + '.',
                    'x + 2y = 0, so x = −2y, and the relation gives 7y² = 3, so y = ±√(3/7).',
                    '2x + y = 0, and the relation gives 3x² = 7.',
                    'dy/dx = 0, because an undefined value is a special case of a zero one.'
                ], a: 0,
                whyBy: [
                    'The denominator is where a quotient can fail to have a value. Substituting x = −2y gives (−2y)² + (−2y)y + y² = 4y² − 2y² + y² = 3y² = 7, so y = ±√(7/3) and x = ∓2√(7/3), and the two vertical lines appear on the picture.',
                    'That inverts the fraction. 3y² = 7 divides by 3 to give y² = 7 / 3, so the 3 multiplies y² instead of sitting on the other side.',
                    'That is the horizontal-tangent pairing from the first half of this tab. A zero numerator gives the value 0, and a zero denominator gives no value.',
                    'No value and the value 0 are different readings, and topic 5.2 keeps them apart. A quotient that divides by zero does not become 0.'
                ]
            },
            message: 'The line x + 2y = 0 is drawn as x = −2y, and its two points of the relation are on the picture with a vertical line through each one. The readout gives their denominators as 0 and reports dy/dx as having no value. Two checks have still not been run on this pair, and the next question is whether the line alone was enough.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'A classmate writes: any point whose coordinates satisfy x + 2y = 0 is a point of the relation with a vertical tangent. Is that reasoning sound?',
                choices: [
                    'No. The candidate must also lie on the relation, and the numerator must not vanish at the same time, because 0/0 would need a separate analysis.',
                    'Yes. A zero denominator always gives a vertical tangent, so the extra checks are a formality.',
                    'No. The numerator 2x + y must also be 0 at that point, and that is what makes the tangent vertical.',
                    'Yes, provided x + 2y approaches 0 slowly enough for the quotient to settle.'
                ], a: 0,
                whyBy: [
                    'That is the two-part check the audit below runs. The relation filters the candidate list, and a nonzero numerator rules out the 0/0 case. Only a point surviving both gets the name.',
                    'This is the mistake the screen exists to stop. A denominator of 0 at a point of the relation still needs the numerator read, and a denominator of 0 off the relation says nothing at all.',
                    'Both parts equal to 0 at once is exactly the 0/0 situation that resists a label. At the two surviving points the numerator is ' + nv(numr(V_L)) + ' and ' + nv(numr(V_R)) + ', neither 0.',
                    'A quotient either has a value at a point or it does not, and no speed of approach rescues a zero denominator. The checks that matter are the relation and the numerator.'
                ]
            },
            message: 'Both filters pass here. The readout now reports x² + xy + y² = 7 at each of the two points, and 2x + y ' + nv(numr(V_L)) + ' and ' + nv(numr(V_R)) + ', so neither is a 0/0 case. That is why the two vertical lines on the picture are allowed to be called vertical tangents, and why the origin is not on this board at all.'
        },
        {
            params: { stage: 7 },
            predict: {
                q: 'Topic 3.2 asked for dy/dx at the point (1, 2) of this relation. Without re-differentiating, where does (1, 2) stand on the board the two parts of dy/dx give?',
                choices: [
                    '2x + y is 4 and x + 2y is 5, so dy/dx = −4/5, which is not 0 and not undefined. The point is an ordinary one on the upper branch.',
                    '2x + y is 0 at (1, 2), so the point is one of the horizontal-tangent points found earlier.',
                    'x + 2y is 0 at (1, 2), so the point carries a vertical tangent.',
                    'The point is not on the relation, so the formula has nothing to say there.'
                ], a: 0,
                whyBy: [
                    'One short check on the given derivative, and it lands nowhere special: neither part vanishes, so (1, 2) keeps a finite nonzero slope. The point and its tangent are on the picture now, and the next question reads what that slope means.',
                    '2x + y at (1, 2) is 2 + 2 = 4. The horizontal-tangent points have x = ±√(7/3), and neither is 1.',
                    'x + 2y at (1, 2) is 1 + 4 = 5. The vertical-tangent points have y = ±√(7/3), and neither is 2.',
                    'The relation holds, since 1 + 2 + 4 = 7, and the readout prints that check. A point of the relation always has a value of dy/dx unless its denominator is 0.'
                ]
            },
            message: 'The point (1, 2) goes on the upper branch with its tangent drawn at the slope the formula gives, dy/dx = ' + fStr(EP_YPRIME) + ' ' + nv(SLOPE_E) + '. The readout carries the point, its branch, the two parts and the sign of the quotient. What the sign says about the branch is the next question, and the word for it is not on the screen yet.'
        },
        {
            params: { stage: 8 },
            predict: {
                q: 'At (1, 2) the formula gives dy/dx = ' + fStr(EP_YPRIME) + ' ' + nv(SLOPE_E) + '. What local behavior does that tell us?',
                choices: [
                    'The local branch through (1, 2) is decreasing as x increases through that point.',
                    'The relation is decreasing at x = 1, and that settles both branches at once.',
                    'The point (1, 2) is a local maximum, because the derivative is negative there.',
                    'The tangent at (1, 2) is vertical, because the denominator is smaller than the numerator.'
                ], a: 0,
                whyBy: [
                    'A negative dy/dx at a point of a local branch means that branch falls as x increases through the point. That is the topic 5.3 reading carried onto a relation, and the behavior word now appears in the readout with its branch named.',
                    'One x-value carries two points of this relation, and a slope claim belongs to a point. The claim that does hold is about the branch through (1, 2), and the other branch would need its own y.',
                    'A local maximum needs the sign to change from positive to negative across the point, and topic 5.4 asks for the signs on both sides. One negative value at the point is not a sign change, and (1, 2) is not even a critical point here.',
                    'The denominator x + 2y at (1, 2) is 5, which is not 0, so the quotient has an ordinary finite value. The vertical tangents are the two points where x + 2y = 0.'
                ]
            },
            message: 'Decreasing, and the word names its branch: the local branch through (1, 2), the upper one. The second derivative of this relation, built on the Second derivative implicitly tab, is on the work board too, since one sign is not the whole reading, and its value at (1, 2) is ' + fStr(EP_Y2) + ' ' + nv(DD_E) + '. What that second number adds is the next question.'
        },
        {
            params: { stage: 9 },
            predict: {
                q: 'The Second derivative implicitly tab gives y″ = −(2 + 2y′ + 2(y′)²) / (x + 2y) for this relation, and at (1, 2) it computes to ' + fStr(EP_Y2) + ' ' + nv(DD_E) + '. What additional feature does that determine?',
                choices: [
                    'The local branch through (1, 2) is concave down there, because y″ < 0.',
                    'The local branch through (1, 2) is concave up there, because y″ < 0.',
                    'The whole relation is concave down, because one point settled it.',
                    'The branch is nearly straight there, because y″ is a small number.'
                ], a: 0,
                whyBy: [
                    'Negative y″ is concave down, the topic 5.6 reading moved onto a local branch of a relation. Together the two signs say the branch falls at (1, 2) and bends downward there.',
                    'That inverts the convention. Concave up needs y″ > 0, and this value is negative.',
                    'This relation has two local branches, and y″ was read from the y and the y′ of one point. One point gives one branch one conclusion.',
                    'Magnitude says nothing about bend. Only the sign of y″ carries a concavity claim, and this one is negative.'
                ]
            },
            message: 'Concave down on the local branch through (1, 2), and the note on the picture and the two-row table say it there. Read the pair as the final form topic 5.12 ends on: at (1, 2) the slope is negative so the branch is decreasing locally, and y″ is negative so the branch is concave down locally. Neither claim was made about the relation as a single function.'
        },
        {
            params: { stage: 10 },
            predict: {
                q: 'This tab was handed dy/dx = −(2x + y) / (x + 2y) and never differentiated the relation again. What did topic 5.12 add on top of topic 3.2?',
                choices: [
                    'The behavior reading: which points carry horizontal and vertical tangents, that a derivative value belongs to a point on one local branch, that a zero denominator needs the relation and the other part checked, and what the signs of dy/dx and y″ say at (1, 2).',
                    'Nothing, because knowing dy/dx already states the behavior of a relation.',
                    'A second form of the same derivative, rewritten as one explicit function y = f(x).',
                    'The rule that a tilted relation has no local extrema at all.'
                ], a: 0,
                whyBy: [
                    'That is the division of labor the comparison card states. Topic 3.2 produces the tool, and topic 5.12 runs it: pair each condition with the relation, read signs one branch at a time, and let y″ settle the bend.',
                    'The formula alone never said which points of the plane belong to the relation, never warned that a zero denominator can sit off the curve, and never attached a slope to a branch rather than to an x-value. All of that was work on this tab.',
                    'The relation was never solved into one explicit function. The two branch formulas on the picture exist only to say what a local branch is, and every slope came from the implicit quotient.',
                    'A tilted relation still has a highest point of its upper branch and a lowest point of its lower branch, and the two dy/dx = 0 rows are exactly those points. What the topic refuses is naming an extremum without reading the signs of the branch.'
                ]
            },
            message: 'The summary table gathers the five readings, and the working cards retire because the table and the picture now carry the finished version. Two formulas, one relation, five points, and every claim naming the point or the branch it belongs to.'
        },
        {
            params: { stage: 11 },
            message: 'Read the table back as the whole topic. The horizontal pair came from the numerator together with the relation, and the vertical pair from the denominator together with the relation plus a check against 0/0. The point (1, 2) then gave two signs and two local claims about one branch. Nothing on this board came from solving the relation for y, and nothing was said about an x-value that had no point behind it.'
        }
    ],
    summary: {
        idea: 'On x² + xy + y² = 7 with dy/dx = −(2x + y) / (x + 2y), the horizontal tangents come from pairing 2x + y = 0 with the relation, which gives 3x² = 7 and the points ' + H_LO.rad + ' and ' + H_UP.rad + ', and the vertical tangents come from pairing x + 2y = 0 with the relation, which gives 3y² = 7 and the points ' + V_L.rad + ' and ' + V_R.rad + '. At (1, 2) the same formula gives dy/dx = ' + fStr(EP_YPRIME) + ' ' + nv(SLOPE_E) + ' and the implicit second derivative gives y″ = ' + fStr(EP_Y2) + ' ' + nv(DD_E) + ', so the local branch through that point is decreasing and concave down there.',
        mistake: 'Setting one part of dy/dx to 0 and stopping. The numerator line and the denominator line are both whole lines of candidates, and the relation is what turns them into points of the curve: the origin satisfies x + 2y = 0 and is not a point of x² + xy + y² = 7 at all. A zero denominator also needs the numerator read, so a 0/0 case is not crowned a vertical tangent. And no slope, extremum or concavity claim belongs to an x-value, because one x carries two points here.',
        transfer: 'On x² + xy + y² = 7, locate the two horizontal-tangent points and the two vertical-tangent points, and name the equation that filtered each one. Then take the point (−1, −2), which lies on the relation since 1 + 2 + 4 = 7: compute dy/dx there from the given formula, decide whether the branch through that point rises or falls, and say which local branch your claim belongs to.'
    }
};

export default implicitTransferMode;
