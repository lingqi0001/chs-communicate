/* P0 boundary for 4.4 Related Rates Mechanism Lab.
   This lesson shows how quantities connect through one always-true relationship,
   and why differentiating every changing quantity with respect to the same time t
   drags along a factor like dr/dt. That Chain Rule step is the bridge back to Unit 3.
   It NEVER projects a quantity forward. The old finite-radius ring with its
   unrolled band, its leftover term, and the shrink-time linear estimate were all
   4.6 material, so they are removed here. No finite difference, no forward circle,
   no estimate against a true change, and no error language appear in this file. */

export default {
    id: 'u4-dependency-map',
    meta: { unit: 4, topic: '4.4', title: 'Introduction to Related Rates', visualizerTitle: 'Related Rates Mechanism Lab' },
    modes: [circleMode(), rectangleMode()]
};

/* ---------------- Mode 1: circle area, one radius drives the area ---------------- */
function circleMode() {
    return {
        label: 'Circle',
        intro: 'A circle grows because its radius r changes over time. This one lesson asks a single question. How do the rates connect? Press Next to bring the radius and its rate onto the picture.',
        params: { stage: 0, r: 3, drdt: 2 },
        compute: (env) => {
            const r = clamp(env.r, 1, 5);
            const drdt = Number(env.drdt);
            return { r, drdt, A: Math.PI * r * r, dAdr: 2 * Math.PI * r, dAdt: 2 * Math.PI * r * drdt };
        },
        controls: [
            { key: 'r', label: 'Radius r', min: 1, max: 5, step: 0.5, unit: ' cm', when: (env) => env.stage >= 1 },
            { key: 'drdt', label: 'Radius rate dr/dt', kind: 'choice', when: (env) => env.stage >= 1, options: [
                { v: -1, label: '−1 cm/s' }, { v: 0, label: '0' }, { v: 2, label: '+2 cm/s' }
            ] }
        ],
        panes: {
            main: [
                {
                    kind: 'graph', title: (env) => 'The circle at r = ' + r2(env.r) + ' cm', height: 360, width: 360,
                    window: [-6, 6, -6, 6], grid: false, ticks: false,
                    areas: (env) => [{
                        fn: (x) => -Math.sqrt(Math.max(0, env.r * env.r - x * x)),
                        topFn: (x) => Math.sqrt(Math.max(0, env.r * env.r - x * x)),
                        from: -env.r, to: env.r, color: 'fillA'
                    }],
                    curves: (env) => {
                        const top = (x) => Math.sqrt(Math.max(0, env.r * env.r - x * x));
                        const bot = (x) => -Math.sqrt(Math.max(0, env.r * env.r - x * x));
                        const c = [{ fn: top, color: 'ink' }, { fn: bot, color: 'ink' }];
                        if (env.stage >= 2) {
                            c.push({ fn: top, color: 'accent', width: 3.5, emphasis: true });
                            c.push({ fn: bot, color: 'accent', width: 3.5, emphasis: true });
                        }
                        return c;
                    },
                    segments: (env) => {
                        const s = [{ x1: 0, y1: 0, x2: env.r, y2: 0, color: 'ink' }];
                        if (env.stage >= 1 && Math.abs(env.drdt) > 0.001) {
                            s.push({ x1: env.r, y1: 0, x2: env.r + 0.6 * env.drdt, y2: 0, color: env.drdt > 0 ? 'up' : 'down', arrow: 'end' });
                        }
                        return s;
                    },
                    points: (env) => [
                        { x: 0, y: 0, color: 'auxInk', r: 3 },
                        { x: env.r, y: 0, color: 'ink', drag: { key: 'r', min: 1, max: 5, transform: (e, raw) => Math.abs(raw) } }
                    ],
                    notes: (env) => {
                        const n = [{ x: env.r / 2 - 0.3, y: 0.3, t: 'r = ' + r2(env.r) + ' cm', color: 'ink' }];
                        if (env.stage >= 1) {
                            if (Math.abs(env.drdt) > 0.001) {
                                n.push({ x: env.r + 0.15, y: -0.5, t: 'dr/dt = ' + (env.drdt > 0 ? '+' : '') + r2(env.drdt) + ' cm/s', color: 'accent' });
                            } else {
                                n.push({ x: env.r - 0.2, y: -0.5, t: 'radius not changing', color: 'auxInk' });
                            }
                        }
                        if (env.stage >= 2) {
                            n.push({ x: -5.5, y: -5.4, t: 'edge length dA/dr = 2πr = ' + r1(env.dAdr) + ' cm', color: 'accent' });
                        }
                        return n;
                    }
                }
            ],
            side: [
                {
                    kind: 'machine', title: 'Dependency chain, what drives what',
                    stages: (env) => {
                        const st = [{ box: 't', in: 'time passes' }];
                        st.push({ box: 'radius r', in: 'r = ' + r2(env.r) + ' cm', rate: env.stage >= 1 ? 'dr/dt = ' + r2(env.drdt) + ' cm/s' : undefined });
                        st.push({ box: 'area A = πr²', in: r1(env.A) + ' cm²', rate: env.stage >= 2 ? 'dA/dr = 2πr' : undefined });
                        return st;
                    },
                    focus: (env) => (env.stage >= 2 ? 2 : env.stage >= 1 ? 1 : 0)
                },
                {
                    kind: 'eq', title: 'Always true relationship',
                    lines: (env) => {
                        const out = [{ t: 'A = πr²', rule: 'This relationship is always true.' }];
                        if (env.stage >= 2) {
                            out.push({ t: 'd/dt [A] = d/dt [πr²]', rule: 'Differentiate both sides with respect to t.' });
                            out.push({ t: 'dA/dt = 2πr · dr/dt', hl: true, rule: 'The Chain Rule brings the dr/dt factor along.' });
                        } else {
                            out.push({ t: 'answer the question to differentiate', dim: true, rule: 'a later step' });
                        }
                        if (env.stage >= 3) {
                            out.push({ t: 'dA/dt = 2π(' + r2(env.r) + ')(' + r2(env.drdt) + ') = ' + piForm(env.dAdt) + ' ≈ ' + r1(env.dAdt) + ' cm²/s', hl: true, rule: 'Substitute the facts for this instant.' });
                        }
                        return out;
                    }
                },
                {
                    kind: 'readout', title: 'True at this instant', when: (env) => env.stage >= 2,
                    items: (env) => [
                        { label: 'r', v: (e) => e.r, unit: ' cm' },
                        { label: 'dr/dt', v: (e) => e.drdt, unit: ' cm/s' },
                        { label: 'dA/dt', v: (e) => e.dAdt, unit: ' cm²/s', color: 'accent' }
                    ]
                },
                {
                    kind: 'graph', title: 'Same dr/dt, two circles, one scale', when: (env) => env.stage >= 4, height: 360, width: 560,
                    window: [-6.4, 6.4, -4.2, 4.2], grid: false, ticks: false,
                    areas: () => [
                        { fn: (x) => -Math.sqrt(Math.max(0, 4 - (x + 3.7) * (x + 3.7))), topFn: (x) => Math.sqrt(Math.max(0, 4 - (x + 3.7) * (x + 3.7))), from: -5.7, to: -1.7, color: 'fillA' },
                        { fn: (x) => -Math.sqrt(Math.max(0, 16 - (x - 2.5) * (x - 2.5))), topFn: (x) => Math.sqrt(Math.max(0, 16 - (x - 2.5) * (x - 2.5))), from: -1.5, to: 6.5, color: 'fillB' }
                    ],
                    curves: () => [
                        { fn: (x) => Math.sqrt(Math.max(0, 4 - (x + 3.7) * (x + 3.7))), color: 'ink' },
                        { fn: (x) => -Math.sqrt(Math.max(0, 4 - (x + 3.7) * (x + 3.7))), color: 'ink' },
                        { fn: (x) => Math.sqrt(Math.max(0, 16 - (x - 2.5) * (x - 2.5))), color: 'accent', width: 3 },
                        { fn: (x) => -Math.sqrt(Math.max(0, 16 - (x - 2.5) * (x - 2.5))), color: 'accent', width: 3 }
                    ],
                    segments: () => [
                        { x1: -3.7, y1: 0, x2: -3.7 + 0.6, y2: 0, color: 'up', arrow: 'end' },
                        { x1: 2.5, y1: 0, x2: 2.5 + 0.6, y2: 0, color: 'up', arrow: 'end' }
                    ],
                    notes: () => [
                        { x: -5.6, y: 3.6, t: 'r = 2, dr/dt = 1, dA/dt = 4π', color: 'ink' },
                        { x: -0.8, y: 3.6, t: 'r = 4, dr/dt = 1, dA/dt = 8π', color: 'ink' }
                    ]
                },
                {
                    kind: 'practice', id: 'circle-transfer', title: 'Transfer, a cube instead of a circle',
                    when: (env) => env.stage >= 4,
                    items: () => [cubeTransferItem()]
                }
            ]
        },
        steps: [
            {
                params: { stage: 1 },
                message: 'Drag the point on the edge to change r, then pick dr/dt with the pills. The radius is the only length that changes here, so it sits in the middle of the chain and the area follows it.'
            },
            {
                params: { stage: 2 },
                predict: {
                    q: 'If r = r(t), what is d/dt(r²)?',
                    choices: ['2r', '2r · dr/dt', '2 · dr/dt', 'r²'], a: 1,
                    whyBy: [
                        'The power rule does give 2r, but r is not a constant here. It changes with time, so the step is not finished yet.',
                        'The power rule gives 2r, and because r = r(t) the Chain Rule multiplies by dr/dt, so d/dt(r²) = 2r · dr/dt.',
                        'You kept the dr/dt factor, which is right, but the power rule also lowers r² to 2r. That r is missing.',
                        'That is just r² again. Differentiating has to change the expression, and here it gives 2r · dr/dt.'
                    ]
                },
                message: 'The highlighted edge is the key. Its length is 2πr, which is dA/dr, the instantaneous area change per centimeter of radius at this radius. Multiply by how fast the radius moves and you get dA/dt = 2πr · dr/dt.'
            },
            {
                params: { stage: 3, r: 3, drdt: 2 },
                message: 'At this instant r = 3 cm and dr/dt = 2 cm/s, so dA/dt = 2π(3)(2) = 12π ≈ 37.7 cm²/s. The relationship A = πr² stays true the whole time while these numbers hold only right now.'
            },
            {
                params: { stage: 4, r: 3, drdt: 2 },
                predict: {
                    q: 'Two circles both have dr/dt = 1 cm/s. One has r = 2, the other has r = 4. Which has the larger dA/dt?',
                    choices: ['The r = 4 circle, because its edge is longer', 'The r = 2 circle, because it is smaller', 'They are equal, because dr/dt is the same'], a: 0,
                    why: 'dA/dt = 2πr · dr/dt. With the same dr/dt, the bigger radius has the longer edge, so it sweeps more area each second, 8π against 4π.'
                },
                message: 'Both circles on the right are drawn at one scale, and both edges move outward at 1 cm/s. The bigger circle has the longer edge, so it gains area faster, 8π compared to 4π.'
            },
            {
                params: { stage: 4, r: 3, drdt: 0 },
                message: 'Set dr/dt = 0 and the area stops changing, dA/dt = 0, no matter how large the circle already is. The rate is what drives the answer, not the size.'
            }
        ],
        summary: {
            idea: 'Values that change together form a chain. Time drives the radius, the radius drives the area, and differentiating with respect to the same t carries each rate into the next link.',
            mistake: 'Writing d/dt(r²) = 2r and dropping the dr/dt factor. The area can only change while the radius is changing.',
            transfer: 'A cube follows the same chain, since its volume is a function of one changing edge.'
        }
    };
}

/* ---------------- Mode 2: rectangle area, two rates combine through the product rule ---------------- */
function rectangleMode() {
    return {
        label: 'Rectangle',
        intro: 'A rectangle gets longer while it gets narrower. Both lengths change with time, so this case shows that related rates still obeys the other derivative rules. Press Next to bring the two rates onto the figure.',
        params: { stage: 0, L: 5, W: 3, dLdt: 2, dWdt: -0.5 },
        compute: (env) => {
            const L = Number(env.L), W = Number(env.W), dLdt = Number(env.dLdt), dWdt = Number(env.dWdt);
            return { L, W, dLdt, dWdt, A: L * W, fromLength: W * dLdt, fromWidth: L * dWdt, dAdt: W * dLdt + L * dWdt };
        },
        controls: [],
        panes: {
            main: [
                {
                    kind: 'graph', title: (env) => 'The rectangle, ' + r2(env.L) + ' m by ' + r2(env.W) + ' m', height: 320, width: 560,
                    window: [-0.6, 6.8, -0.6, 3.8], grid: false, ticks: false,
                    areas: (env) => [{
                        fn: () => 0, topFn: () => env.W, from: 0, to: env.L, color: 'fillA'
                    }],
                    curves: () => [],
                    segments: (env) => {
                        const L = env.L, W = env.W;
                        const s = [
                            { x1: 0, y1: 0, x2: L, y2: 0, color: 'ink' },
                            { x1: L, y1: 0, x2: L, y2: W, color: 'ink' },
                            { x1: L, y1: W, x2: 0, y2: W, color: 'ink' },
                            { x1: 0, y1: W, x2: 0, y2: 0, color: 'ink' }
                        ];
                        if (env.stage >= 2 && Math.abs(env.dLdt) > 0.001) {
                            s.push({ x1: L, y1: W / 2, x2: L + 0.5 * env.dLdt, y2: W / 2, color: env.dLdt > 0 ? 'up' : 'down', arrow: 'end' });
                        }
                        if (env.stage >= 2 && Math.abs(env.dWdt) > 0.001) {
                            s.push({ x1: L / 2, y1: W, x2: L / 2, y2: W + 1.2 * env.dWdt, color: env.dWdt > 0 ? 'up' : 'down', arrow: 'end' });
                        }
                        return s;
                    },
                    notes: (env) => {
                        const L = env.L, W = env.W;
                        const n = [
                            { x: L / 2 - 0.4, y: 0, t: 'L = ' + r2(L) + ' m', color: 'ink' },
                            { x: 0, y: W / 2, t: 'W = ' + r2(W) + ' m', color: 'ink' }
                        ];
                        if (env.stage >= 1) {
                            n.push({ x: L + 0.25, y: W / 2, t: 'dL/dt = +' + r2(env.dLdt) + ' m/s', color: 'accent' });
                            n.push({ x: L / 2 + 0.15, y: W + 0.25, t: 'dW/dt = −0.5 m/s', color: 'accent' });
                        }
                        if (env.stage >= 3) {
                            n.push({ x: L / 2 - 0.5, y: W + 0.32, t: 'length side adds ' + r1(env.fromLength) + ' m²/s', color: 'up' });
                            n.push({ x: L + 0.25, y: W / 2 - 0.4, t: 'width side takes ' + r1(env.fromWidth) + ' m²/s', color: 'down' });
                        }
                        return n;
                    }
                }
            ],
            side: [
                {
                    kind: 'machine', title: 'Dependency chain, two drivers',
                    stages: (env) => {
                        const st = [{ box: 't', in: 'time passes' }];
                        st.push({ box: 'L and W', in: r2(env.L) + ' m, ' + r2(env.W) + ' m', rate: env.stage >= 2 ? 'dL/dt = ' + r2(env.dLdt) + ', dW/dt = ' + r2(env.dWdt) : undefined });
                        st.push({ box: 'area A = LW', in: r1(env.A) + ' m²', rate: env.stage >= 2 ? 'product rule' : undefined });
                        return st;
                    },
                    focus: (env) => (env.stage >= 2 ? 2 : env.stage >= 1 ? 1 : 0)
                },
                {
                    kind: 'eq', title: 'Always true relationship',
                    lines: (env) => {
                        const out = [{ t: 'A = L W', rule: 'This relationship is always true.' }];
                        if (env.stage >= 2) {
                            out.push({ t: 'dA/dt = W · dL/dt + L · dW/dt', hl: true, rule: 'The product rule adds one term for each changing length.' });
                        } else {
                            out.push({ t: 'answer the question to differentiate', dim: true, rule: 'a later step' });
                        }
                        if (env.stage >= 3) {
                            out.push({ t: '= ' + r2(env.W) + '(' + r2(env.dLdt) + ') + ' + r2(env.L) + '(' + r2(env.dWdt) + ')', rule: 'Substitute the numbers for this instant.' });
                            out.push({ t: '= ' + r1(env.fromLength) + ' + (' + r1(env.fromWidth) + ') = ' + r1(env.dAdt) + ' m²/s', hl: true, rule: 'One side adds area while the other takes it away.' });
                        }
                        return out;
                    }
                },
                {
                    kind: 'readout', title: 'True at this instant', when: (env) => env.stage >= 3,
                    items: (env) => [
                        { label: 'from length', v: (e) => e.fromLength, unit: ' m²/s', color: 'up' },
                        { label: 'from width', v: (e) => e.fromWidth, unit: ' m²/s', color: 'down' },
                        { label: 'dA/dt', v: (e) => e.dAdt, unit: ' m²/s' }
                    ]
                },
                { kind: 'note', when: (env) => env.stage >= 3, text: 'One side shrinking does not mean the area shrinks. The lengthening side adds 6 m²/s and the narrowing side takes 2.5 m²/s, so the net is 3.5 m²/s.' },
                {
                    kind: 'practice', id: 'rect-transfer', title: 'Transfer, a cube instead of a rectangle',
                    when: (env) => env.stage >= 3,
                    items: () => [cubeTransferItem()]
                }
            ]
        },
        steps: [
            {
                params: { stage: 1 },
                message: 'The length is 5 m and the width is 3 m. The arrows show that the length grows at 2 m/s while the width shrinks at 0.5 m/s. Press Next to ask what the area rate is.'
            },
            {
                params: { stage: 2 },
                predict: {
                    q: 'Both L and W change with time. What is dA/dt?',
                    choices: ['dA/dt = (dL/dt)(dW/dt)', 'dA/dt = W · dL/dt', 'dA/dt = W · dL/dt + L · dW/dt', 'dA/dt = L · dW/dt'], a: 2,
                    whyBy: [
                        'That multiplies the two rates together. The area does not change by a product of the two rates, it changes by a sum.',
                        'That is the length term, but it forgets the width. Both lengths change, so both contribute.',
                        'The product rule adds one term for each changing length, so dA/dt = W · dL/dt + L · dW/dt.',
                        'That is the width term alone. It drops the length contribution, so half the change is missing.'
                    ]
                },
                message: 'A = LW is a product of two changing lengths, so the product rule applies. Each length brings its own term, giving dA/dt = W · dL/dt + L · dW/dt.'
            },
            {
                params: { stage: 3 },
                message: 'The lengthening side adds W · dL/dt = 3 · 2 = 6 m²/s. The narrowing side takes L · dW/dt = 5 · (−0.5) = −2.5 m²/s. The net is 3.5 m²/s, so the area grows even though the width shrinks.'
            }
        ],
        summary: {
            idea: 'When two lengths change at once, related rates still uses the product rule. Each changing length adds its own term to dA/dt.',
            mistake: 'Assuming one shrinking dimension means the area shrinks. A faster growing dimension can more than offset it.',
            transfer: 'Now you have seen a power relationship and a product relationship. A real problem mixes geometry with these same rules.'
        }
    };
}

/* one transfer question, shared by both modes as a practice pane */
function cubeTransferItem() {
    return {
        q: 'A cube has an edge s that changes over time, and its volume is V = s³. Which rate equation follows?',
        choices: ['dV/dt = 3s² · ds/dt', 'dV/dt = 3s²', 'dV/dt = 3s · ds/dt', 'dV/dt = s³ · ds/dt'], a: 0,
        whyBy: [
            'The power rule lowers s³ to 3s², and because s = s(t) the Chain Rule multiplies by ds/dt.',
            'You differentiated the s³ part but never touched the time. The rate ds/dt has to ride along.',
            'That used the wrong power. The derivative of s³ keeps an s², so the factor is 3s², not 3s.',
            'That kept s³ and only attached ds/dt. Differentiating has to change the power, so the factor is 3s².'
        ]
    };
}

/* ---------------- small formatting helpers ---------------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function r1(v) { return String(Math.round(v * 10) / 10).replace('-', '−'); }
function r2(v) { return String(Math.round(v * 100) / 100).replace('-', '−'); }
function piForm(v) { return r1(v / Math.PI) + 'π'; }
