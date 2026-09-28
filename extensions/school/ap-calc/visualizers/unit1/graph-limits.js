/* 1.3 Graph Limit Reader - trace toward x=a from both sides; the point
   value is secondary. Modes: finite, hole, jump, unbounded, oscillating. */

const CASES = {
    finite: {
        label: 'ordinary finite limit', a: 2, window: [0, 4.6, -0.5, 5],
        curves: [{ fn: '3 - 0.4*(x-2)^2', label: 'f(x)', color: 'curveA' }],
        dot: true,
        estL: (env) => 3 - 0.4 * (env.xL - 2) ** 2,
        estR: (env) => 3 - 0.4 * (env.xR - 2) ** 2
    },
    hole: {
        label: 'hole, dot elsewhere', a: 2, window: [0, 4.6, -0.5, 7],
        /* One continuous curve. The open circle at (2, 4) masks the single
           missing point, so no gap is drawn. */
        curves: [
            { fn: 'x + 2', label: 'f(x)', color: 'curveA' }
        ],
        extraPoints: [{ x: 2, y: 4, open: true, color: 'auxInk', label: 'hole' }, { x: 2, y: 1, label: 'f(2)', color: 'ink' }],
        estL: (env) => env.xL + 2, estR: (env) => env.xR + 2
    },
    jump: {
        label: 'jump', a: 2, window: [0, 3.3, -1.4, 6.4], xRmax: 3.1,
        /* Two different expressions. The renderer emits two paths, so we keep
           the two curves and only shrink the visual gap to sub-pixel. */
        curves: [
            { fn: 'x - 1', from: 0, to: 1.999, color: 'curveA', label: 'left' },
            { fn: '2x', from: 2.001, to: 3.1, color: 'curveA', label: 'right' }
        ],
        extraPoints: [{ x: 2, y: 1, open: true, color: 'auxInk' }, { x: 2, y: 4, open: true, color: 'auxInk' }, { x: 2, y: 4, label: 'f(2)', color: 'ink' }],
        estL: (env) => env.xL - 1, estR: (env) => 2 * env.xR
    },
    unbounded: {
        label: 'unbounded', a: 0, window: [-2.5, 2.5, -1, 10], capY: 9.6,
        curves: [{ fn: '1/x^2 + 0', label: 'f(x) = 1/x²', labelAt: 2.15, color: 'curveA' }],
        extraPoints: [],
        estL: (env) => 1 / env.xL ** 2, estR: (env) => 1 / env.xR ** 2
    },
    osc: {
        label: 'oscillating (no limit)', a: 0, window: [-1, 1, -1.8, 1.8],
        curves: [{ fn: 'sin(1/x)', samples: 2400, label: 'f(x) = sin(1/x)', labelAt: 0.85, color: 'curveA' }],
        extraPoints: [],
        estL: (env) => Math.sin(1 / env.xL), estR: (env) => Math.sin(1 / env.xR)
    },
    /* TRANSFER: a fresh graph and deliberately NO draggable probes, so the
       reading has to happen in the student's head. estL/estR stay defined so
       the trace readout cannot crash if it is already switched on. */
    transfer: {
        label: 'estimate with no probes', a: 1, window: [0, 2.6, 0, 4.8], noProbes: true,
        /* Two different expressions meet at the open circle. Separate paths
           cannot be joined by the renderer, so keep the two curves and shrink
           the notch to sub-pixel width. The open circle masks the meeting point. */
        curves: [
            { fn: '1.5 + 0.5x', from: 0, to: 0.999, color: 'curveA' },
            { fn: '3 − x', from: 1.001, to: 2.6, color: 'curveA' }
        ],
        extraPoints: [
            { x: 1, y: 2, open: true, color: 'auxInk', label: 'open circle' },
            { x: 1, y: 4, color: 'ink', label: 'f(1)' }
        ],
        estL: (env) => 1.5 + 0.5 * env.xL, estR: (env) => 3 - env.xR
    }
};

export default {
    id: 'u1-graph-limits',
    meta: { unit: 1, topic: '1.3', title: 'Estimating Limit Values from Graphs', visualizerTitle: 'Graph Limit Reader' },
    intro: 'Trace the graph toward x = a from both sides before you look at the point value. Estimate the limit first. The number readout is switched off at the start, so trust your eyes, then press Next to turn it on.',
    params: { kase: 'finite', xL: 0.2, xR: 3.8, reveal: 0, hide: 0 },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        }
    ],
    /* A probe position carried over from another case can sit outside this
       case's frame, and an off-viewBox marker is invisible: keep both probes
       inside the span the case actually draws. */
    compute: (env) => {
        const c = CASES[env.kase];
        if (!c || c.noProbes) return {};
        const span = probeSpan(c);
        return {
            xL: Math.max(span[0][0], Math.min(span[0][1], env.xL)),
            xR: Math.max(span[1][0], Math.min(span[1][1], env.xR))
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x)', height: 360,
                window: (env) => CASES[env.kase].window,
                vlines: (env) => { const c = CASES[env.kase]; return [{ x: c.a, color: 'aux', label: 'target x = ' + c.a }]; },
                curves: (env) => CASES[env.kase].curves,
                points: (env) => {
                    const c = CASES[env.kase];
                    const out = [];
                    if (!c.noProbes) {
                        const span = probeSpan(c);
                        /* an unbounded case drives the probes past the top of the
                           frame; pin the dots to the canvas edge so students can
                           still grab them, the readout keeps the true values */
                        const py = v => c.capY !== undefined ? Math.min(v, c.capY) : v;
                        out.push({ x: env.xL, y: py(c.estL(env)), label: 'L', color: 'up', drag: { key: 'xL', min: span[0][0], max: span[0][1] } });
                        out.push({ x: env.xR, y: py(c.estR(env)), label: 'R', color: 'down', drag: { key: 'xR', min: span[1][0], max: span[1][1] } });
                    }
                    if (!env.hide) (c.extraPoints || []).forEach(p => out.push(p));
                    return out;
                }
            },
            {
                kind: 'practice', id: 'u13-transfer', title: 'Practice: three limits with no probes',
                when: (env) => env.kase === 'transfer',
                items: [
                    {
                        q: 'As x approaches 1 from the left, what height does the graph of f approach?',
                        choices: ['4', '2', '1.5'], a: 1,
                        whyBy: [
                            '4 is the height of the filled dot on the line x = 1. That dot is the value f(1), not the limit from the left.',
                            '2 is the height the left branch approaches as x moves toward 1 from below.',
                            '1.5 is the height where the left branch starts at x = 0. A starting height is not a limit.'
                        ]
                    },
                    {
                        q: 'As x approaches 1 from the right, what height does the graph of f approach?',
                        choices: ['0.4', '4', '2'], a: 2,
                        whyBy: [
                            '0.4 is the height of the right branch at the far edge of the window, x = 2.6. That edge is not the target.',
                            '4 is the value f(1), marked by the filled dot. The right branch does not approach that value.',
                            'Follow the right branch toward x = 1 from the right side. Its height settles on 2.'
                        ]
                    },
                    {
                        q: 'Now combine the two sides. What is lim x→1 f(x)?',
                        choices: ['The limit exists and equals 2, because both sides settle on 2.', 'The limit does not exist, because the open circle removes the point.', 'The limit does not exist, because the two sides settle on different heights.'], a: 0,
                        whyBy: [
                            'The left branch and the right branch both settle on 2, so the two-sided limit is 2. The open circle removes the value f(1) on the line x = 1, not the shared height.',
                            'An open circle makes the point discontinuous, but the limit survives the missing point. Both branches still approach 2.',
                            'The two branches agree here. Both branches approach 2, so the two-sided limit exists.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Trace readout of both branches',
                when: (env) => env.reveal > 0.5 && !CASES[env.kase].noProbes,
                items: (env) => {
                    const c = CASES[env.kase];
                    return [
                        { label: 'x → a⁻', v: env.xL }, { label: 'f →', v: c.estL(env), color: 'up' },
                        { label: 'x → a⁺', v: env.xR }, { label: 'f →', v: c.estR(env), color: 'down' }
                    ];
                }
            },
            {
                kind: 'eq', title: 'How to read a graph limit',
                lines: [
                    { t: '1. Begin at one side of the target, not at the dot.' },
                    { t: '2. Ask what height each branch of the graph approaches.' },
                    { t: '3. The two-sided limit exists only when both sides approach one height.' },
                    { t: 'A graph gives an estimate, unless the graph states exact values.', color: 'auxInk' }
                ]
            }
        ]
    },
    steps: [
        { params: { kase: 'finite', reveal: 0 }, message: 'Drag the probe L and the probe R toward the target line. Do that from both sides before any numbers appear on screen.' },
        {
            params: { reveal: 1 },
            message: 'The readout agrees with the graph. Both branches approach height 3, so the limit is 3.'
        },
        {
            params: { kase: 'hole', reveal: 0, hide: 0 },
            message: 'This is the removable case. The branches meet at the hole (2, 4), and the point f(2) = 1 sits below. Trace both sides, because the point value is not part of either branch.'
        },
        {
            params: { hide: 1 },
            message: 'The hole and the point on the line x = 2 are now hidden. The single curve still runs through x = 2 with no marker on it.'
        },
        {
            params: {},
            predict: {
                q: 'Every marker on the line x = 2 is hidden. There is no hole and no defined point. What happens to your estimate of lim x→2 f(x)?',
                choices: ['The estimate stays 4, because the two branches still approach 4.', 'The estimate becomes 1, the height of the hidden point.', 'The estimate disappears along with the hidden markers.'], a: 0,
                why: 'A limit depends on the branches, not on the markers. With both markers hidden the traced heights are unchanged, and both sides still converge on 4.'
            },
            message: 'The markers are gone and the estimate did not move. A limit is nearby behavior, not a point value.'
        },
        {
            params: { kase: 'jump', reveal: 0, hide: 0 },
            message: 'This is the jump case. Trace the left branch and the right branch, then answer the question below.'
        },
        {
            params: {},
            predict: {
                q: 'On screen the left branch approaches 1 and the right branch approaches 4. What do you expect for the two-sided limit at x = 2?',
                choices: ['The limit does not exist, because the two sides approach different numbers.', 'The limit is 4, because the filled dot at (2, 4) sits there.', 'The limit is 2.5, the average of the two sides.'], a: 0,
                why: 'A two-sided limit needs one number that both sides approach. Here the sides approach different numbers, so the two-sided limit does not exist, whatever f(2) says.'
            },
            message: 'The two branches settle on different heights, so the two-sided limit at x = 2 does not exist.'
        },
        { params: { reveal: 1 }, message: 'The readout agrees. Each one-sided limit exists on its own. Only the two-sided limit fails.' },
        {
            params: { kase: 'unbounded', reveal: 1, xL: -0.35, xR: 0.35 },
            message: 'Both branches rise past the top of the frame as x approaches 0. The two sides do not settle on any finite height, and both grow toward positive infinity. Topic 1.14 is where the infinite limit notation is introduced.'
        },
        {
            params: { kase: 'osc', reveal: 1, xL: -0.05, xR: 0.05 },
            message: 'The graph of sin(1/x) keeps swinging as x approaches 0. Neither side settles on a finite height, so the two-sided limit does not exist.'
        },
        {
            params: { kase: 'transfer', reveal: 0, hide: 0 },
            message: 'This graph has no draggable probes. Read the limit from the left, then from the right. Then answer the three questions under "Practice: three limits with no probes".'
        }
    ],
    summary: {
        idea: 'To estimate a limit from a graph, follow both branches of the function toward the target. The point value at the target is a separate question.',
        mistake: 'Students read the filled dot, the y-intercept, or the nearest labeled point. Those are point values, and a limit needs the behavior near the target.',
        transfer: 'Choose the case named estimate with no probes, and answer its three questions without a trace. Then sketch f(x) = (x² − 1)/(x − 1) and predict lim x→1 f(x) by tracing the graph only.'
    }
};

function probeSpan(c) {
    if (c.a === 0) return [[-0.9, -0.03], [0.03, 0.9]];
    return [
        [c.window[0] + 0.1, c.a],
        [c.a, c.xRmax !== undefined ? c.xRmax : c.window[1] - 0.1]
    ];
}
