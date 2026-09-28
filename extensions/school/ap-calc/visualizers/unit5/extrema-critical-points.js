/* 5.2 Extrema & Critical Point Explorer, built entirely from the declarative
   lesson data the runtime expects: params, controls, compute, panes, steps,
   Predict, summary. Three tabs, one graph at a time, and never a derivative
   graph, because topic 5.3 owns the derivative and behavior connection.

   Tab 1 compares a point with its shaded neighborhood and with the whole
   interval, then names critical points with short tangent segments drawn on the
   same curve. Tab 2 adds the half of the critical point definition that
   f′ = 0 cannot reach: the corner where the derivative does not exist, which is
   drawn without any tangent. Tab 3 reads the Extreme Value Theorem as a
   guarantee with two conditions, in three cases.

   Every classification mark is gated on a step param (env.reveal, env.seen) and
   on which point is under the cursor, never on a bare click, so choosing
   another point with the inspect control before a question is answered cannot
   unlock an answer early. Tab 3's steps are a map keyed by the case selector,
   so a step can never walk the lesson into another case. Exact values stay
   exact in the code; dsp only formats them for reading. */

/* ---------- the smooth example ------------------------------------------ */

const A = -2.8, B = 1.8;     /* the displayed interval [A, B] */
const NEAR = 0.45;           /* half width of the shaded neighborhood */
const IV = '[−2.8, 1.8]';

const fQ = (x) => Math.pow(x, 5) / 5 + Math.pow(x, 4) / 4 - (2 / 3) * Math.pow(x, 3);
const dQ = (x) => x * x * (x + 2) * (x - 1);

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* unlock = the reveal level at which this point may be classified.
   f(−2.8) ≈ −4.42, f(−2) ≈ 2.93, f(0) = 0, f(1) ≈ −0.22, f(1.8) ≈ 2.52,
   and f′ = x²(x + 2)(x − 1) is 0 at −2, 0 and 1 and nowhere else. */
const PTS = {
    left: {
        x: A, endpoint: true, xName: 'the left endpoint', unlock: 2,
        tag: 'left endpoint', mark: 'absolute minimum (endpoint)',
        nearby: ['An endpoint has only one side inside the interval, so the nearby comparison has almost nothing to work with here.'],
        whole: ['Every other value on ' + IV + ' sits above ' + dsp(fQ(A)) + '.', 'So this endpoint holds the absolute (global) minimum.'],
        ask: ['One side only: an endpoint is not tested the way an interior point is.', 'Hold this height up against the whole curve before you name anything.'],
        localRow: () => 'not a claim we make for an endpoint',
        absRow: () => 'yes, the absolute (global) minimum'
    },
    right: {
        x: B, endpoint: true, xName: 'the right endpoint', unlock: 2,
        tag: 'right endpoint', mark: 'endpoint, no absolute extremum',
        nearby: ['An endpoint has only one side inside the interval, so the nearby comparison has almost nothing to work with here.'],
        whole: ['Its height ' + dsp(fQ(B)) + ' is neither the highest nor the lowest value on ' + IV + '.', 'So it holds no absolute extremum.'],
        ask: ['One side only: an endpoint is not tested the way an interior point is.', 'Compare this height with every value on the interval before you name anything.'],
        localRow: () => 'not a claim we make for an endpoint',
        absRow: () => 'no, neither the highest nor the lowest'
    },
    xm2: {
        x: -2, interior: true, xName: 'x = −2', unlock: 2,
        tag: 'x = −2', mark: 'local and absolute maximum',
        dText: 'f′(−2) = 0',
        nearby: ['Inside the shaded band the curve sits below this height on both sides.', 'So this is a local (relative) maximum.'],
        whole: ['No value anywhere on ' + IV + ' is higher than ' + dsp(fQ(-2)) + '.', 'So the same point also holds the absolute (global) maximum.'],
        ask: ['Is this point the highest or the lowest of the shaded neighbors?', 'Is this height the highest or the lowest anywhere on the interval?'],
        localRow: () => 'yes, a local maximum',
        absRow: () => 'yes, the absolute maximum'
    },
    x0: {
        x: 0, interior: true, xName: 'x = 0', unlock: 4,
        tag: 'x = 0', mark: 'critical point, no extremum',
        dText: 'f′(0) = 0',
        nearby: ['Inside the band the curve is higher on the left and lower on the right: it only flattens on its way down.', 'So this point is neither a local maximum nor a local minimum.'],
        whole: ['Neither the highest nor the lowest value on ' + IV + '.', 'So it holds no absolute extremum either.'],
        ask: ['The curve flattens here. Does it turn into a high point or a low point?', 'Read the whole curve before you claim anything about this height.'],
        localRow: () => 'no',
        absRow: () => 'no'
    },
    x1: {
        x: 1, interior: true, xName: 'x = 1', unlock: 1,
        tag: 'x = 1', mark: 'local minimum',
        dText: 'f′(1) = 0',
        nearby: ['Inside the shaded band the curve sits above this height on both sides.', 'So this is a local (relative) minimum.'],
        whole: ['The left endpoint is lower, at ' + dsp(fQ(A)) + ' against ' + dsp(fQ(1)) + '.', 'So this point is not an absolute (global) minimum.'],
        ask: ['Compare this height with the curve inside the shaded band.', 'Now compare it with every value on the whole interval.'],
        localRow: () => 'yes, a local minimum',
        absRow: () => 'no, the left endpoint is lower'
    }
};

const PT_ORDER = ['left', 'xm2', 'x0', 'x1', 'right'];

const SUMMARY = {
    idea: 'Local and absolute extrema describe two different comparison ranges: nearby values versus the entire interval. Local extrema occur at critical points, where f′ = 0 or f′ does not exist, but a critical point does not automatically produce an extremum. On a continuous closed interval, the Extreme Value Theorem guarantees that absolute extrema exist.',
    mistake: 'Do not treat every horizontal tangent as a maximum or minimum, and do not read a failed EVT condition as proof that extrema do not exist. The theorem guarantees existence when its conditions hold; when they do not, the theorem is silent.',
    transfer: 'A function g is continuous on [2, 7]. Before finding any critical points or evaluating any values, what does the Extreme Value Theorem guarantee? What does it not tell you?'
};

/* ---------- tab 1: local versus global ---------------------------------- */

const localMode = {
    label: 'Local vs global',
    intro: 'One curve, and one question at a time: how low is low enough? The inspect point row under the graph chooses where the shaded neighborhood sits. The wide pale band is the whole interval ' + IV + ', and the dashed line carries this point height across all of it. Nothing is classified until you answer the Predict question.',
    params: { pt: 'x1', reveal: 0 },
    controls: [
        {
            key: 'pt', label: 'inspect point', kind: 'choice',
            options: [
                { v: 'xm2', label: 'x = −2' },
                { v: 'x0', label: 'x = 0' },
                { v: 'x1', label: 'x = 1' },
                { v: 'left', label: 'left endpoint' },
                { v: 'right', label: 'right endpoint' }
            ]
        }
    ],
    fns: { f: (x) => fQ(x) },
    compute: (env) => {
        const p = PTS[env.pt] || PTS.x1;
        return {
            p: p,
            ptx: p.x,
            pty: fQ(p.x),
            interior: !!p.interior,
            named: env.reveal >= p.unlock,
            tangent: !!p.interior && env.reveal >= 3,
            slope: p.interior ? dQ(p.x) : 0
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x), where f(x) = x^5/5 + x^4/4 − (2/3)x^3', height: 360,
                window: [-3.15, 2.15, -5, 3.5],
                vband: (env) => {
                    const out = [{ from: A, to: B, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }];
                    if (env.interior) out.push({ from: env.ptx - NEAR, to: env.ptx + NEAR, color: 'color-mix(in srgb, var(--accent) 15%, transparent)' });
                    return out;
                },
                curves: [{ fn: 'f', from: A, to: B, samples: 600, color: 'curveA' }],
                hlines: (env) => [{ y: env.pty, color: 'auxInk', label: 'height here ' + dsp(env.pty) }],
                vlines: (env) => [{ x: env.ptx, color: 'aux', label: env.p.endpoint ? 'x = ' + dsp(env.ptx) : '' }],
                points: (env) => {
                    const out = [];
                    PT_ORDER.forEach(key => {
                        const q = PTS[key];
                        const isPt = key === env.pt;
                        if (!isPt && !q.endpoint && env.reveal < q.unlock) return;
                        const named = env.reveal >= q.unlock;
                        out.push({
                            x: q.x, y: fQ(q.x),
                            r: isPt ? 6.5 : 4.5,
                            color: isPt ? 'accent' : 'ink',
                            label: isPt ? (named ? q.mark : q.tag) : (q.endpoint ? (named ? q.mark : '') : q.mark),
                            labelDx: key === 'right' ? -150 : key === 'xm2' ? -60 : 8,
                            labelDy: key === 'right' ? 20 : key === 'xm2' ? 20 : key === 'x1' ? 20 : -10
                        });
                    });
                    return out;
                },
                tangents: (env) => env.tangent
                    ? [{ x: env.ptx, y: env.pty, m: env.slope, reach: 0.17, color: 'aux', label: env.p.dText }]
                    : [],
                notes: (env) => env.interior
                    ? [{ x: env.ptx - NEAR, y: env.pty > 1.5 ? env.pty - 1.4 : env.pty + 1.15, t: 'nearby only', color: 'auxInk' }]
                    : []
            }
        ],
        side: [
            {
                kind: 'compare', title: 'Nearby vs whole interval',
                sides: (env) => {
                    const p = env.p;
                    return [
                        { title: 'Nearby values', lines: env.named ? p.nearby : p.ask },
                        {
                            title: 'The whole interval ' + IV,
                            lines: env.named ? p.whole : ['Same height, wider question: is it the lowest or the highest value anywhere on the interval?']
                        }
                    ];
                },
                verdict: (env) => env.named
                    ? 'Both comparisons are settled for ' + env.p.xName + '. They are two different questions, and one point can pass both.'
                    : 'Nothing is classified yet. The shaded band is the only comparison the nearby question is allowed to make.'
            },
            {
                kind: 'readout', title: 'Why this point is critical',
                when: (env) => env.reveal >= 3 && env.interior,
                items: (env) => {
                    const p = env.p;
                    const rows = [
                        { label: 'derivative at this point', v: () => p.dText, color: 'accent' },
                        { label: 'Critical point', v: () => 'yes, f′ = 0 here', color: 'up' }
                    ];
                    if (env.named) {
                        rows.push({ label: 'Local extremum', v: p.localRow, color: 'aux' });
                        rows.push({ label: 'Absolute extremum on this interval', v: p.absRow, color: 'aux' });
                    } else {
                        rows.push({ label: 'Local extremum', v: () => 'not decided yet' });
                    }
                    return rows;
                }
            },
            {
                kind: 'eq', title: 'The relationship to keep',
                when: (env) => env.reveal >= 4,
                lines: [
                    { t: 'Local extrema  →  occur at critical points', hl: true },
                    { t: 'A critical point  ↛  automatically an extremum', hl: true },
                    { t: 'x = 0 on this curve is the counterexample: f′(0) = 0 and the curve keeps falling through it.' },
                    { t: 'A point can hold both titles at once: x = −2 is a local maximum and the absolute maximum.' },
                    { t: 'Endpoints stay labeled endpoints, and they are not tested as critical points here.' }
                ]
            },
            {
                kind: 'note', title: 'Words this lesson uses',
                when: (env) => env.reveal >= 5,
                text: 'Local means the same thing as relative, and absolute means the same thing as global. A critical point is a point in the function domain where f′ = 0 or where f′ does not exist. Local and absolute answer two different comparison questions, so they are not rival labels: the same point can be both. Later topics will give us systematic tools for deciding what happens at critical points, and the endpoints will join that work. Here an endpoint is only ever called an endpoint.'
            }
        ]
    },
    steps: [
        {
            params: { pt: 'x1', reveal: 0 },
            message: 'Focus on x = 1. Inside the shaded neighborhood the curve sits above this point on both sides, and the graph also contains lower values farther away. The dashed line carries this height across the whole interval, so look at both halves of the Nearby vs whole interval panel.'
        },
        {
            params: { pt: 'x1', reveal: 1 },
            predict: {
                q: 'How should the point at x = 1 be classified?',
                choices: [
                    'It is a local minimum, but not an absolute minimum on the interval.',
                    'It is an absolute minimum because it is lower than the nearby points.',
                    'It is not a minimum because another point on the graph is lower.'
                ], a: 0,
                why: 'A local minimum only compares the function with nearby values. An absolute minimum compares the function with every value on the entire interval. This point passes the nearby test and fails the wider one, and both readings are true at the same time.'
            },
            message: 'That is the moment the two words split apart: local, also called relative, compares the shaded band, and absolute, also called global, compares all of ' + IV + '. Click left endpoint in the inspect point row and watch the narrow band disappear, because an endpoint has no neighborhood on both sides.'
        },
        {
            params: { pt: 'left', reveal: 2 },
            message: 'The left endpoint is lower than every other displayed value, at ' + dsp(fQ(A)) + '. That makes its function value the absolute, or global, minimum on this interval. No derivative was needed to say it, and this point is never called a critical point: it is an endpoint.'
        },
        {
            params: { pt: 'xm2', reveal: 2 },
            message: 'The point at x = −2 is higher than nearby points and also higher than every other value on this interval, so it is both a local maximum and the absolute maximum. Local and global are not mutually exclusive categories. The right endpoint shows the other pairing: an endpoint that holds neither title.'
        },
        {
            params: { pt: 'xm2', reveal: 3 },
            message: 'Only now does the derivative appear, and it appears as a short tangent segment on this one curve. At x = −2 that segment is horizontal and f′(−2) = 0. Points where f′ = 0, or where f′ does not exist, are called critical points.'
        },
        {
            params: { pt: 'x1', reveal: 3 },
            message: 'The same reading at x = 1: a horizontal tangent segment, f′(1) = 0, so the local minimum there sits at a critical point. Now click x = 0 and read the two panels before you answer the Predict question.'
        },
        {
            params: { pt: 'x0', reveal: 3 },
            predict: {
                q: 'At x = 0, the tangent is horizontal, so f′(0) = 0. Does that automatically make x = 0 a local maximum or minimum?',
                choices: [
                    'No. It is a critical point, but the curve continues through without turning into a local maximum or minimum.',
                    'Yes. Every point where f′ = 0 is a local extremum.',
                    'Yes, but only because the tangent is horizontal.'
                ], a: 0,
                why: 'Every local extremum must occur at a critical point, but the reverse is not true. A critical point is a place to investigate, not a guaranteed maximum or minimum. The shaded band says it directly: higher values on the left, lower values on the right, so the curve flattens on its way down instead of turning.'
            },
            message: 'The graph does the arguing. The band around x = 0 holds higher values on one side and lower values on the other, while f′(0) = 0 keeps its meaning unchanged. A horizontal tangent by itself never settles a maximum or minimum question.'
        },
        {
            params: { pt: 'x0', reveal: 4 },
            message: 'Two rows, two different answers: critical point yes, local extremum no. That gap is the reason topics 5.3 and 5.4 exist. Keep the relationship card in this order: local extrema occur at critical points, and a critical point is not automatically an extremum.'
        },
        {
            params: { reveal: 5 },
            message: 'Walk the curve against the panels one last time. The absolute minimum sits at the left endpoint, the absolute maximum at x = −2, a local minimum at x = 1 that is not absolute, and a critical point at x = 0 that hosts no extremum. Later topics will give us systematic tools for deciding what happens at critical points.'
        }
    ],
    summary: SUMMARY
};

/* ---------- tab 2: the corner, where f′ does not exist ------------------- */

const sharpMode = {
    label: 'A sharp minimum',
    intro: 'This is f(x) = |x| on [−2, 2], and the only interesting point is the corner at x = 0. No tangent segment is drawn there, because there is no single slope to draw. One Predict question asks about that corner, and the derivative row already tells you what f′(0) is worth.',
    params: { reveal: 0 },
    controls: [],
    fns: { f: (x) => Math.abs(x) },
    compute: (env) => ({ named: env.reveal >= 1 }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x), where f(x) = |x| on [−2, 2]', height: 340,
                window: [-2.5, 2.5, -0.7, 2.8],
                vband: () => [{ from: -2, to: 2, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }],
                curves: [
                    { fn: 'f', from: -2, to: 0, samples: 200, color: 'curveA', label: 'left arm, slope −1', labelAt: -1.75 },
                    { fn: 'f', from: 0, to: 2, samples: 200, color: 'curveA', label: 'right arm, slope 1', labelAt: 1.75 }
                ],
                points: (env) => ([
                    { x: 0, y: 0, r: 6.5, color: 'accent', label: env.named ? 'critical point, and the minimum' : 'corner at x = 0', labelDx: -40, labelDy: 24 },
                    { x: -2, y: 2, label: 'endpoint f(−2) = 2', color: 'ink' },
                    { x: 2, y: 2, label: 'endpoint f(2) = 2', color: 'ink', labelDx: -92 }
                ]),
                tangents: () => []
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Why this point is critical',
                items: (env) => {
                    const rows = [
                        { label: 'f(0)', v: 0 },
                        { label: 'f′(0)', v: () => 'DNE', color: 'down' },
                        { label: 'slope on the left of 0', v: -1, color: 'down' },
                        { label: 'slope on the right of 0', v: 1, color: 'up' }
                    ];
                    if (env.named) {
                        rows.push({ label: 'Critical point', v: () => 'yes, f′ does not exist here', color: 'accent' });
                        rows.push({ label: 'Local extremum', v: () => 'yes, a local minimum', color: 'aux' });
                        rows.push({ label: 'Absolute extremum on this interval', v: () => 'yes, the absolute minimum', color: 'aux' });
                    } else {
                        rows.push({ label: 'Critical point', v: () => 'not decided yet' });
                    }
                    return rows;
                }
            },
            {
                kind: 'note', title: 'No tangent at a corner',
                text: 'The left arm runs down with slope −1 and the right arm runs up with slope 1. Those one-sided slopes differ, −1 on the left and +1 on the right, so there is no single derivative at x = 0, and the picture draws no tangent there to pretend otherwise.'
            },
            {
                kind: 'note', title: 'The comparison that matters', when: (env) => env.reveal >= 2,
                text: 'Two critical points, two different outcomes. The corner at x = 0 here is critical because f′ fails to exist, and it does hold a minimum. The flat point at x = 0 on the smooth curve in the first tab is critical because f′ = 0, and it holds no extremum at all. Critical never means extremum by itself. It only means the derivative has something to say about the point.'
            }
        ]
    },
    steps: [
        {
            params: { reveal: 0 },
            message: 'Read the corner against the two straight arms. The height 0 at x = 0 is below every other value on [−2, 2], and the arms meet there with slopes −1 and 1. The derivative row for this point reads DNE. It is never left blank, and it never reports a number that is not there.'
        },
        {
            params: { reveal: 1 },
            predict: {
                q: 'The graph has a sharp corner at x = 0, so f′(0) does not exist. Is x = 0 still a critical point?',
                choices: [
                    'Yes. A critical point occurs where f′ = 0 or where f′ does not exist.',
                    'No. Critical points require a horizontal tangent.',
                    'No. A point without a derivative cannot be a minimum.'
                ], a: 0,
                why: 'Critical points include both places where the derivative equals 0 and places in the function domain where the derivative does not exist. The definition has two halves, and this corner is the second half of it.'
            },
            message: 'x = 0 is a critical point, and in this example it is also a local minimum and the absolute minimum on [−2, 2]. The three rows in the panel stay separate on purpose: being critical, being a local extremum, and being an absolute extremum are three different claims.'
        },
        {
            params: { reveal: 2 },
            message: 'Now set this corner beside the smooth curve from the first tab. Both points are critical, one of them is a minimum twice over, and the other is not an extremum at all. That contrast is the whole reason the critical point definition is written the way it is: it lists candidates, it does not crown them.'
        }
    ],
    summary: SUMMARY
};

/* ---------- tab 3: the Extreme Value Theorem, three cases ---------------- */

const LINE = (x) => x;
const PARAB = (x) => x * x - 2 * x;

const EVT = {
    closed: {
        title: 'f(x) = x² − 2x on the closed interval [−1, 3]',
        win: [-1.8, 3.8, -1.9, 3.9],
        a: -1, b: 3,
        curves: [{ fn: PARAB, from: -1, to: 3 }],
        states: [true, true, true],
        verdict: 'EVT guarantees both.',
        ok: true,
        detail: [
            'The interval [−1, 3] is closed: both endpoints are filled dots, so x = −1 and x = 3 are included.',
            'f(x) = x² − 2x is a polynomial, so it is continuous at every point of the interval.',
            'Both conditions hold, so the theorem is entitled to promise its conclusion.'
        ],
        promise: [
            'At least one absolute maximum value exists somewhere in [−1, 3].',
            'At least one absolute minimum value exists somewhere in [−1, 3].',
            'No location, no count, and no method for finding either one.'
        ],
        ends: [
            { x: -1, y: 3, label: 'endpoint', dx: 8, dy: 20 },
            { x: 3, y: 3, label: 'endpoint', dx: -70, dy: 20 }
        ],
        marks: [
            { x: 1, y: -1, label: 'absolute minimum −1', dx: -30, dy: 24 },
            { x: -1, y: 3, label: 'absolute maximum 3 at the left endpoint', dx: 8, dy: 20 },
            { x: 3, y: 3, label: 'absolute maximum 3 at the right endpoint', dx: -175, dy: 20 }
        ],
        found: [
            'The minimum is −1, at x = 1, where the curve bottoms out.',
            'The maximum is 3, and it happens twice, at both endpoints.',
            'Both answers came from looking at this graph.'
        ]
    },
    open: {
        title: 'f(x) = x on the half open interval [0, 1)',
        win: [-0.4, 1.7, -0.35, 1.6],
        a: 0, b: 1,
        curves: [{ fn: LINE, from: 0, to: 1 }],
        states: [false, true, false],
        verdict: 'EVT gives no guarantee.',
        ok: false,
        detail: [
            'The interval [0, 1) is not closed: x = 1 is left out, so the open circle at (1, 1) stores no value.',
            'The line y = x is continuous at every point the interval reaches, so that row passes.',
            'One condition fails, and the theorem stops making promises.'
        ],
        promise: [
            'Nothing at all. The interval is not closed, so the theorem makes no promise.',
            'Whatever this graph has, it has on its own, not because of EVT.'
        ],
        ends: [
            { x: 0, y: 0, label: 'included endpoint', dx: 10, dy: 22 },
            { x: 1, y: 1, open: true, label: 'not included', dx: -92, dy: -10 }
        ],
        marks: [
            { x: 0, y: 0, label: 'absolute minimum 0 at the included endpoint', dx: 10, dy: 22 }
        ],
        found: [
            'The absolute minimum is 0, attained at x = 0.',
            'No absolute maximum exists: the heights climb toward 1 and never land on it.',
            'The open circle is exactly the value this interval lost.'
        ]
    },
    broken: {
        title: 'f(x) = x for x ≠ 0, with f(0) = 2, on [−1, 1]',
        win: [-1.7, 1.7, -1.6, 2.7],
        a: -1, b: 1,
        curves: [{ fn: LINE, from: -1, to: 0 }, { fn: LINE, from: 0, to: 1 }],
        states: [true, false, false],
        verdict: 'EVT gives no guarantee.',
        ok: false,
        detail: [
            'The interval [−1, 1] is closed, so the first row passes.',
            'The graph breaks at x = 0: the open circle sits at (0, 0) and the stored value is the filled dot at (0, 2).',
            'Continuity fails on the interval, so the theorem makes no promise here.'
        ],
        promise: [
            'Nothing at all. The function is not continuous on the interval, so the theorem makes no promise.',
            'The two extrema below were found by looking, not by guarantee.'
        ],
        ends: [
            { x: 0, y: 0, open: true, label: 'gap on the line', dx: 10, dy: 20 },
            { x: 0, y: 2, label: 'f(0) = 2', dx: 10, dy: -8 },
            { x: -1, y: -1, label: 'endpoint', dx: 10, dy: 20 },
            { x: 1, y: 1, label: 'endpoint', dx: -70, dy: 18 }
        ],
        marks: [
            { x: 0, y: 2, label: 'absolute maximum 2 at x = 0', dx: 10, dy: -8 },
            { x: -1, y: -1, label: 'absolute minimum −1 at the left endpoint', dx: 10, dy: 20 }
        ],
        found: [
            'The absolute maximum is 2, at x = 0, the one stored value.',
            'The absolute minimum is −1, at the left endpoint.',
            'A discontinuous function still handed both extrema to us.'
        ]
    }
};

const ROWQ = [
    'Is the interval closed [a, b]?',
    'Is f continuous everywhere on that interval?',
    'Does EVT guarantee both absolute extrema?'
];

const evtMode = {
    label: 'The EVT guarantee',
    intro: 'Three graphs, one piece of logic. The EVT conditions panel asks the same three questions on every case, and its last line says whether the theorem is entitled to promise anything. The dots that name actual maxima and minima stay off the graph until the Predict question is answered, because the theorem never locates anything. No derivatives appear anywhere in this tab.',
    params: { kase: 'closed', seen: 0 },
    controls: [
        {
            key: 'kase', label: 'EVT case', kind: 'choice',
            options: [
                { v: 'closed', label: 'Continuous closed interval' },
                { v: 'open', label: 'Missing endpoint' },
                { v: 'broken', label: 'Discontinuous but extrema exist' }
            ]
        }
    ],
    compute: (env) => ({ c: EVT[env.kase] || EVT.closed }),
    panes: {
        main: [
            {
                kind: 'graph', title: env => env.c.title, height: 340,
                window: env => env.c.win,
                vband: env => [{ from: env.c.a, to: env.c.b, color: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)' }],
                curves: env => env.c.curves.map(piece => ({ fn: piece.fn, from: piece.from, to: piece.to, samples: 200, color: 'curveA' })),
                points: env => {
                    const marks = env.seen >= 1 ? env.c.marks : [];
                    const out = env.c.ends
                        .filter(e => !marks.some(m => m.x === e.x && m.y === e.y))
                        .map(e => ({
                            x: e.x, y: e.y, open: !!e.open,
                            color: e.open ? 'down' : 'ink',
                            label: e.label, labelDx: e.dx || 8, labelDy: e.dy || -10
                        }));
                    marks.forEach(m => out.push({
                        x: m.x, y: m.y, r: 6, color: 'accent',
                        label: m.label, labelDx: m.dx || 8, labelDy: m.dy || -10
                    }));
                    return out;
                }
            }
        ],
        side: [
            {
                kind: 'checklist', title: 'EVT conditions',
                items: env => ROWQ.map((t, i) => ({ t: t, state: env.c.states[i] })),
                /* the marks and the closing line both come from the case object,
                   so no row can read one way here and another way below it */
                verdict: env => env.c.verdict,
                verdictOk: env => env.c.ok
            },
            {
                kind: 'eq', title: 'Reading the two conditions',
                lines: env => env.c.detail.map(t => ({ t: t }))
            },
            {
                kind: 'compare', title: 'Promise against picture', when: env => env.seen >= 1,
                sides: env => ([
                    { title: 'Guaranteed by EVT', lines: env.c.promise },
                    { title: 'Located by inspecting this example', lines: env.c.found }
                ])
            },
            {
                kind: 'note', title: 'What the theorem owns', when: env => env.seen >= 2,
                text: env => env.kase === 'closed'
                    ? 'The EVT guarantees existence, and nothing else. It does not name locations, and it does not promise one maximum and one minimum: this graph has its minimum once and its maximum twice, at the two endpoints. A function that holds the same value everywhere would also satisfy the theorem, and the theorem would still be true.'
                    : 'The EVT gives no guarantee here, and that is the whole sentence. It is not a claim that extrema fail to exist, and it is not a claim that open intervals never have extrema. Some of them do. The panel simply reports that the theorem has no standing in this case.'
            }
        ]
    },
    /* one step list per case, keyed by the case selector, so the questions stay
       on their own graph and a step can never move the lesson to another case */
    steps: {
        closed: [
            {
                params: { seen: 0 },
                message: 'Both endpoints are filled dots, so x = −1 and x = 3 belong to the interval, and the curve has no break anywhere on it. The first two rows of the EVT conditions panel are satisfied. Answer the Predict question before the graph marks anything, because the marks would be the answer.'
            },
            {
                params: { seen: 1 },
                predict: {
                    q: 'Before locating either extreme value, what does the Extreme Value Theorem already guarantee?',
                    choices: [
                        'The function has at least one absolute minimum and at least one absolute maximum on the interval.',
                        'The function has exactly one maximum and exactly one minimum.',
                        'The maximum and minimum must occur where f′ = 0.'
                    ], a: 0,
                    why: 'The EVT guarantees existence on a continuous closed interval. It does not guarantee uniqueness, and it does not identify locations. The third answer borrows a tool from later topics, and this theorem never says it.'
                },
                message: 'The dots now name what this particular graph actually has, and the two columns keep the jobs apart. The left column is what the conditions bought before we looked at anything. The right column is what looking at this picture added.'
            },
            {
                params: { seen: 2 },
                message: 'Count the marks: the minimum happens once and the maximum happens twice. That is exactly the at least one of each the theorem promised. The endpoints keep their own name here, and sorting candidates into a short list is the work of a later topic, not of this theorem.'
            }
        ],
        open: [
            {
                params: { seen: 0 },
                message: 'The filled dot at (0, 0) is included, and the open circle at (1, 1) is not: the interval [0, 1) stops just before x = 1. The line itself is continuous wherever the interval reaches, so only the first condition row fails.'
            },
            {
                params: { seen: 1 },
                predict: {
                    q: 'The values get closer and closer to 1, but the point at x = 1 is not included. Does this function have an absolute maximum on [0, 1)?',
                    choices: [
                        'No. The function approaches 1 but never attains it.',
                        'Yes. The maximum is 1 because the graph approaches it.',
                        'Yes. Every bounded function has a maximum.'
                    ], a: 0,
                    why: 'An absolute maximum must be a value the function actually reaches. Taking the top value out of the interval leaves the heights with no largest member, which is exactly why the closed interval condition exists.'
                },
                message: 'The EVT does not apply here, and this example actually loses its maximum. The absolute minimum survives, because its endpoint is included. One open circle is the whole story of this case.'
            },
            {
                params: { seen: 2 },
                message: 'Do not turn this into a rule about open intervals. A graph with a peak inside an open interval still has an absolute maximum there. The correct sentence is the one on the panel: EVT gives no guarantee, which is silence about the outcome rather than a verdict against it.'
            }
        ],
        broken: [
            {
                params: { seen: 0 },
                message: 'This is the line y = x with one value moved: f(0) = 2, so the open circle sits at (0, 0) and the filled dot at (0, 2). The interval [−1, 1] is closed, so the first condition row passes, and the break at x = 0 fails the second.'
            },
            {
                params: { seen: 1 },
                predict: {
                    q: 'The function is not continuous, so the EVT does not apply. Does that mean the function cannot have an absolute maximum or minimum?',
                    choices: [
                        'No. The theorem gives no guarantee, but extrema may still exist.',
                        'Yes. Without continuity, absolute extrema are impossible.',
                        'It can have a maximum or a minimum, but never both.'
                    ], a: 0,
                    why: 'A failed hypothesis removes the guarantee. It does not make the conclusion false, and the theorem never claims it does.'
                },
                message: 'The dots mark what this example really has: the absolute maximum 2 at x = 0, and the absolute minimum −1 at the left endpoint. Both exist, and the theorem promised neither of them.'
            },
            {
                params: { seen: 2 },
                message: 'This mirrors the corner case in topic 5.1, and the two together are the habit to carry. Conditions satisfied means the conclusion is guaranteed. Conditions not satisfied means the theorem is silent, and silence is never a promise that the opposite holds. EVT guarantees both, or EVT gives no guarantee, and those are the only two endings this panel gives.'
            }
        ]
    },
    summary: SUMMARY
};

export default {
    id: 'u5-extrema-critical',
    meta: {
        unit: 5, topic: '5.2',
        title: 'Extreme Value Theorem, Global Versus Local Extrema, and Critical Points',
        visualizerTitle: 'Extrema & Critical Point Explorer'
    },
    /* the three tabs each carry their own params, controls, compute, panes,
       steps and the shared 5.2 summary, which is what the runtime reads once a
       tab is mounted */
    summary: SUMMARY,
    modes: [localMode, sharpMode, evtMode]
};
