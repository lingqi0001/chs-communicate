/* 5.9 Connecting a Function, Its First Derivative, and Its Second Derivative.
   Mode 3, transfer with a fresh family. Three graphs share one x-window over
   [−π, π] and are shown only as Graph A, Graph B and Graph C, with no formulas.
   The student is told these three are one function, its first derivative and its
   second derivative, and must decide which is which from features alone: heights,
   zeros, signs, a peak. Goal is the graph correspondence, not symbolic
   differentiation. Only after the reasoning do the identities appear.

   The assignment behind the scenes: A = sin x, B = cos x, C = −sin x.

   5.8 versus 5.9 boundary: 5.9 asks "identify the matching features among f, f′,
   f″", and this tab is the pure form of that: no sketch, just a shared x read
   across three unlabeled curves.

   Reveal discipline: no curve is named f, f′ or f″ until the final reveal. During
   the questions the graphs keep only their neutral A / B / C labels. The heights
   a probe reads are data; the identity of each graph is the conclusion, and it is
   withheld until its own question has been reached. The optional sign table from
   the spec was left out because its sample signs do not match the stated family
   and this topic forbids a label that is not source-consistent. */

const PI = Math.PI;
const HALF = PI / 2;
const A  = (x) => Math.sin(x);          /* the function candidate */
const B  = (x) => Math.cos(x);          /* its first derivative */
const C  = (x) => -Math.sin(x);         /* its second derivative */

const XW0 = -3.3, XW1 = 3.3;
const YW = [-1.6, 1.6];                 /* one honest scale for the ±1 family */

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-12 ? '=' : '≈';
}

/* Reference guides at the two x-values every question leans on. */
function refs(env, labelTop) {
    const out = [
        { x: 0, color: 'auxInk', label: env.stage >= 3 ? 'x = 0' : '' },
        { x: HALF, color: 'auxInk', label: labelTop && env.stage >= 3 ? 'x = π/2' : '' }
    ];
    if (labelTop) out.push({ x: env.xProbe, color: 'ink', dash: false });
    return out;
}

export const linkerTransferMode = {
    label: 'Match the derivative family',
    intro: 'Three graphs on one shared x-window over [−π, π], labelled only Graph A, Graph B and Graph C. No formulas are given. These three are one function, its first derivative and its second derivative. Use the features, not the shapes, to decide which is which. The shared x sits at 0.',
    params: { stage: 0, xProbe: 0 },
    controls: [
        { key: 'xProbe', label: 'shared x', min: XW0, max: XW1, step: 0.05, showDigits: 2 }
    ],
    fns: {
        a: (x) => A(x),
        b: (x) => B(x),
        c: (x) => C(x)
    },
    compute: (env) => ({
        ident: env.stage >= 3,
        aTxt: rel(A(env.xProbe)) + ' ' + dsp(A(env.xProbe)),
        bTxt: rel(B(env.xProbe)) + ' ' + dsp(B(env.xProbe)),
        cTxt: rel(C(env.xProbe)) + ' ' + dsp(C(env.xProbe))
    }),
    panes: {
        main: [
            {
                kind: 'note', title: 'Same rule as before',
                text: 'The three panels share x-coordinates, not necessarily y-scales. A vertical guide marks the shared x on every graph.'
            },
            {
                kind: 'graph',
                title: (env) => env.ident ? 'Graph A is f(x) = sin x' : 'Graph A',
                height: 220, window: [XW0, XW1, YW[0], YW[1]], gridX: 1, gridY: 1,
                vlines: (env) => refs(env, true),
                curves: [{ fn: 'a', from: XW0, to: XW1, samples: 600, color: 'curveA' }],
                points: (env) => [
                    { x: env.xProbe, fn: 'a', r: 6, color: 'accent', labelDy: -12, drag: { key: 'xProbe', min: XW0, max: XW1 }, label: (e) => e.aTxt },
                    { x: 0, y: 0, r: 4, color: 'ink' },
                    { x: HALF, y: A(HALF), r: 4, color: 'ink' }
                ]
            },
            {
                kind: 'graph',
                title: (env) => env.ident ? 'Graph B is f′(x) = cos x' : 'Graph B',
                height: 220, window: [XW0, XW1, YW[0], YW[1]], gridX: 1, gridY: 1,
                vlines: (env) => refs(env, false),
                curves: [{ fn: 'b', from: XW0, to: XW1, samples: 600, color: 'curveB' }],
                points: (env) => [
                    { x: env.xProbe, fn: 'b', r: 6, color: 'accent', labelDy: -12, drag: { key: 'xProbe', min: XW0, max: XW1 }, label: (e) => e.bTxt },
                    { x: 0, y: B(0), r: 4, color: 'ink' },
                    { x: HALF, y: B(HALF), r: 4, color: 'ink' }
                ]
            },
            {
                kind: 'graph',
                title: (env) => env.ident ? 'Graph C is f″(x) = −sin x' : 'Graph C',
                height: 220, window: [XW0, XW1, YW[0], YW[1]], gridX: 1, gridY: 1,
                vlines: (env) => refs(env, false),
                curves: [{ fn: 'c', from: XW0, to: XW1, samples: 600, color: 'curveC' }],
                points: (env) => [
                    { x: env.xProbe, fn: 'c', r: 6, color: 'accent', labelDy: -12, drag: { key: 'xProbe', min: XW0, max: XW1 }, label: (e) => e.cTxt },
                    { x: 0, y: 0, r: 4, color: 'ink' },
                    { x: HALF, y: C(HALF), r: 4, color: 'ink' }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The chain that identifies them',
                when: (env) => env.ident,
                lines: [
                    { t: 'f = sin x  (Graph A)', hl: true, color: 'curveA' },
                    { t: 'f′ = cos x  (Graph B)', hl: true, color: 'curveB' },
                    { t: 'f″ = −sin x  (Graph C)', hl: true, color: 'curveC' },
                    { t: 'A rose through 0, so its slope at 0 was positive, which is the positive height on B. A peaked at π/2, so its slope there was 0, which is the zero on B. The slope of B was the third curve C.' }
                ]
            },
            {
                kind: 'eq', title: 'How the reasoning went',
                when: (env) => env.ident,
                lines: [
                    { t: '1. Test f′: wherever A is rising, the graph chosen as f′ must be positive; wherever A peaks, that graph must cross 0.' },
                    { t: '2. Test f″: it is the slope of f′, so where the f′ graph peaks, the f″ graph must pass through 0.' },
                    { t: '3. Never match by shape alone. A and C are mirror images, so only the slope tests separate f from f″.' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1, xProbe: HALF },
            predict: {
                q: 'Suppose Graph A is f. At x = 0 the curve of A crosses the x-axis while rising, so its slope there is positive. The graph of f′ must have a positive height at x = 0. Which graph has a positive value at x = 0?',
                choices: [
                    'Graph B, which is at its top value there.',
                    'Graph A, because it is rising at that x.',
                    'Graph C, which also passes through 0 there.'
                ], a: 0,
                whyBy: [
                    'At x = 0 only B sits above the axis (its value is 1). A and C are both at 0 there, so B is the only graph whose height is a positive slope of A at that x.',
                    'A is the candidate f, not its own derivative. Being rising is the reason we want a positive f′, and that positive value is on B.',
                    'C is 0 at x = 0, and 0 is not positive, so it cannot be the positive slope A needs there.'
                ]
            },
            message: 'With A rising through 0, its slope is positive, and the only positive height at x = 0 is on B. So B is the graph of f′. The shared x now moves to π/2 for the next check.'
        },
        {
            params: { stage: 2, xProbe: 0 },
            predict: {
                q: 'Graph A has a peak at x = π/2, so if A is f then f′(π/2) = 0. The graph we are calling f′ must be at zero there. Which graph has value 0 at x = π/2?',
                choices: [
                    'Graph B, which crosses the axis at π/2.',
                    'Graph A, because A peaks at π/2.',
                    'Graph C, because C is shaped like A.'
                ], a: 0,
                whyBy: [
                    'At π/2 the value of B is 0. A peak of f forces f′ to be 0 at that same x, and only B does that.',
                    'A is the function; its peak is the reason we want f′ = 0, not f′ itself. A is at its top value 1 at π/2, not 0.',
                    'Shape is not a test. C also equals −1 at π/2, so it is not at zero there, and matching by a similar silhouette is the habit this tab rejects.'
                ]
            },
            message: 'B crosses zero exactly where A peaks, which confirms B as f′ from a second, independent feature. Now use the third relation: f″ is the slope of f′. The shared x returns to 0.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'f″ is the slope of the f′ graph, which is B. At x = 0 B sits at its peak, so f″(0) = 0. At x = π/2 B is falling, so f″ is negative there. Which graph has value 0 at x = 0 and a negative value at x = π/2?',
                choices: [
                    'Graph C.',
                    'Graph A.',
                    'Graph B.'
                ], a: 0,
                whyBy: [
                    'C is 0 at x = 0 and −1 at x = π/2, negative, matching the slope of B at both x-values. So C is f″.',
                    'A is 0 at x = 0 but +1 at x = π/2, the wrong sign for the falling slope of B there. A is f, not f″.',
                    'B is +1 at x = 0, so it is not even at 0 there. B is already assigned as f′.'
                ]
            },
            message: 'The three are now matched: f = sin x, f′ = cos x, f″ = −sin x, and the identities appear under each graph title. Every step came from a slope, a zero or a sign read down one shared x-column, not from the look of the curve.'
        }
    ],
    summary: {
        idea: 'f′ is read from the slope of f and f″ from the slope of f′, so the matching features among three graphs are found by testing slopes, zeros and signs at the same x. On this family f = sin x, f′ = cos x and f″ = −sin x, and the rising-through-zero and peak points of A line up with the positive height and the zero of B, which in turn give the third graph.',
        mistake: 'Do not identify the graphs by shape. f = sin x and f″ = −sin x are mirror images, so only the slope tests separate them: where f rises the f′ height is positive, and where f′ peaks the f″ value is 0. Matching silhouettes gets f and f″ backwards.',
        transfer: 'Given any three unlabeled graphs claimed to be f, f′ and f″, test them at a shared x: read the sign of each height against the direction of its parent graph, and check that a peak on one lines up with a zero on the next.'
    }
};

export default linkerTransferMode;
