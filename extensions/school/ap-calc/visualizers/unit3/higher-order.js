/* 3.6 Derivative Layers Lab — each derivative becomes the quantity
   differentiated next. Three or four graphs share one vertical probe, so the
   height of a lower row is always the slope of the row above it at the same x.
   The ladder on the right keeps the symbolic form of every layer. */

const n = v => String(Math.round(v * 1000) / 1000);
const spow = (x, p) => (x < 0 ? -Math.pow(-x, p) : Math.pow(x, p));

const CASES = {
    cubic: {
        varName: 'x', xWin: [-2.2, 2.2],
        win: [[-4.8, 4.8], [-3.6, 12], [-14, 14], [-1, 14]],
        d: [
            x => x * x * x - 3 * x,
            x => 3 * x * x - 3,
            x => 6 * x,
            () => 6,
            () => 0
        ],
        names: ['f = x³ − 3x', 'f′ = 3x² − 3', 'f″ = 6x', 'f‴ = 6', 'f⁗ = 0'],
        order: ['f', 'f′', 'f″', 'f‴', 'f⁗']
    },
    sine: {
        varName: 'x', xWin: [-6.4, 6.4],
        win: [[-1.5, 1.5], [-1.5, 1.5], [-1.5, 1.5], [-1.5, 1.5]],
        d: [Math.sin, Math.cos, x => -Math.sin(x), x => -Math.cos(x), Math.sin],
        names: ['f = sin x', 'f′ = cos x', 'f″ = −sin x', 'f‴ = −cos x', 'f⁗ = sin x'],
        order: ['f', 'f′', 'f″', 'f‴', 'f⁗']
    },
    edge: {
        varName: 'x', xWin: [-2.2, 2.2],
        win: [[-4.2, 4.2], [-0.8, 3.4], [-9, 9]],
        d: [
            x => spow(x, 5 / 3),
            x => (5 / 3) * Math.pow(Math.abs(x), 2 / 3),
            x => x === 0 ? Infinity : (10 / 9) * (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), -1 / 3)
        ],
        names: ['f = x^(5/3)', 'f′ = (5/3)x^(2/3)', 'f″ = (10/9) / x^(1/3)'],
        order: ['f', 'f′', 'f″']
    },
    motion: {
        varName: 't', xWin: [0, 2.2],
        win: [[-4.8, 4.8], [-3.6, 12], [-1, 14], [-1, 14]],
        d: [
            t => t * t * t - 3 * t,
            t => 3 * t * t - 3,
            t => 6 * t,
            () => 6,
            () => 0
        ],
        names: ['s(t) = t³ − 3t', 'v(t) = s′ = 3t² − 3', 'a(t) = s″ = 6t', 's‴ = 6'],
        order: ['s', 'v = s′', 'a = s″', 's‴']
    }
};

const caseOf = env => CASES[env.kase];
const ROW_NAMES = ['f', 'f′', 'f″', 'f‴'];
/* the short name of a row, so the motion case labels its rows v and a instead of f′ and f″ */
const shortRow = (env, i) => (caseOf(env).order[i] || ROW_NAMES[i]).split(' ')[0];

/* Rows of graphs. Row i draws the i-th derivative, and its tangent slope is the
   value of row i + 1 at the same x. That identity is the whole topic. */
function layerPane(i) {
    return {
        kind: 'graph', height: 186,
        title: env => (i === 0
            ? caseOf(env).names[0] + ', with its tangent'
            : shortRow(env, i) + ', which is the slope of ' + shortRow(env, i - 1)),
        when: env => env.depth > i + 0.5 && i < caseOf(env).d.length,
        window: env => {
            const xw = caseOf(env).xWin, yw = caseOf(env).win[i];
            return [xw[0], xw[1], yw[0], yw[1]];
        },
        curves: env => [{
            fn: 'row' + i,
            color: i === 0 ? 'curveA' : i === 1 ? 'curveC' : 'curveB',
            label: env => caseOf(env).names[i]
        }],
        vlines: env => [{ x: 'xq', color: 'auxInk' }],
        points: i === 0
            ? env => [{
                x: 'xq', fn: 'row0', color: 'accent', r: 6,
                drag: { key: 'x0', min: caseOf(env).xWin[0], max: caseOf(env).xWin[1] },
                label: env => caseOf(env).varName + ' = ' + n(env.xq)
            }]
            : env => [{ x: 'xq', fn: 'row' + i, color: 'accent', r: 5, label: env => shortRow(env, i) + ' = ' + valText(env['v' + i]) }],
        tangents: env => env.depth > i + 0.5 && env['s' + i] !== undefined
            ? [{ fn: 'row' + i, x: 'xq', m: 's' + i, color: 'down', reach: 0.26, label: i === 0 ? env => 'slope = ' + valText(env.s0) : undefined }]
            : []
    };
}

function valText(v) {
    if (v === undefined) return 'not defined here';
    if (!Number.isFinite(v)) return 'no value';
    return n(v);
}

function ladderRows(env) {
    const c = caseOf(env);
    let max = Math.round(env.depth) + 1;
    /* the sine cycle holds its fifth row back until the prediction is answered */
    if (env.kase === 'sine' && env.cycle < 0.5) max = Math.min(max, 4);
    return c.names.slice(0, Math.min(max, c.d.length));
}

export default {
    id: 'u3-higher-order',
    meta: { unit: 3, topic: '3.6', title: 'Calculating Higher-Order Derivatives', visualizerTitle: 'Derivative Layers Lab' },
    intro: 'Differentiate, then differentiate the answer. Each row below is the slope of the row above it. Both are read at the same x.',
    params: { kase: 'cubic', x0: 1.4, depth: 1, cycle: 0, squared: 0 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: [
                { v: 'cubic', label: 'x³ − 3x' },
                { v: 'sine', label: 'sin x' },
                { v: 'edge', label: 'x^(5/3)' },
                { v: 'motion', label: 's(t) = t³ − 3t' }
            ]
        },
        { key: 'x0', label: 'x', min: -2.2, max: 2.2, step: 0.01, when: env => env.kase === 'cubic' || env.kase === 'edge' },
        { key: 'x0', label: 'x', min: -6.4, max: 6.4, step: 0.02, when: env => env.kase === 'sine' },
        { key: 'x0', label: 't', min: 0, max: 2.2, step: 0.01, when: env => env.kase === 'motion' }
    ],
    fns: {
        row0: (x, env) => caseOf(env).d[0](x),
        row1: (x, env) => caseOf(env).d[1](x),
        row2: (x, env) => caseOf(env).d[2](x),
        row3: (x, env) => caseOf(env).d[3](x)
    },
    compute: env => {
        const c = caseOf(env);
        const xq = Math.max(Math.min(env.x0, c.xWin[1]), c.xWin[0]);
        const out = { xq: xq };
        c.d.forEach((fn, i) => { out['v' + i] = fn(xq); });
        for (let i = 0; i + 1 < c.d.length; i++) out['s' + i] = out['v' + (i + 1)];
        return out;
    },
    panes: {
        main: [
            {
                kind: 'machine', title: env => 'The ladder: each row is the derivative of the row above',
                stages: env => {
                    const c = caseOf(env);
                    return ladderRows(env).map((nm, i) => ({
                        box: c.order[i],
                        out: c.order[i] + ' = ' + valText(env['v' + i])
                    }));
                },
                focus: env => Math.round(env.depth)
            },
            layerPane(0), layerPane(1), layerPane(2), layerPane(3)
        ],
        side: [
            {
                kind: 'readout', title: 'All rows at one x',
                items: env => {
                    const c = caseOf(env);
                    const word = !Number.isFinite(env.v2) ? 'no value at this x'
                        : env.v2 > 0 ? c.order[0] + ' bends upward. Its slope is rising.'
                            : env.v2 < 0 ? c.order[0] + ' bends downward. Its slope is falling.'
                                : 'The slope is neither rising nor falling here.';
                    return [
                        { label: c.order[0] + ' value', v: env.v0, color: 'curveA' },
                        { label: 'slope of ' + c.order[0], v: env.v1, big: true, color: 'curveC' },
                        { label: 'slope of ' + c.order[1], v: env.v2, big: true, color: 'curveB' },
                        { label: 'what ' + c.order[2] + ' says about ' + c.order[0], v: env.depth > 2.5 ? word : c.order[2] + ' is hidden. Raise the ladder first.', color: 'auxInk' }
                    ];
                }
            },
            {
                kind: 'compare', title: 'f″ is not (f′)²',
                when: env => env.squared > 0.5,
                sides: env => [
                    {
                        title: 'Differentiate twice', tone: 'right',
                        lines: [CASES[env.kase].names[1] || '', CASES[env.kase].names[2] || '', 'At ' + CASES[env.kase].varName + ' = ' + n(env.xq) + ':  ' + valText(env.v2)]
                    },
                    {
                        title: 'Square the first derivative', tone: 'wrong',
                        lines: [CASES[env.kase].names[1] || '', '(f′)² = (3x² − 3)²', 'At ' + CASES[env.kase].varName + ' = ' + n(env.xq) + ':  ' + valText(env.v1 * env.v1)]
                    }
                ],
                verdict: env => 'The notation f″ means a second differentiation, and (f′)² means a square. They match only by accident.'
            },
            {
                kind: 'note', tone: 'warn', title: 'A layer can fail to exist',
                when: env => env.kase === 'edge',
                text: 'f = x^(5/3) exists at 0 and has f′(0) = 0. But f″ = (10/9) / x^(1/3) has no value there. A function can be defined at a point where a higher derivative is not. That is a fact about the function, not a calculation error.'
            },
            {
                kind: 'practice', id: 'u3-higher-motion', title: 'Names in a motion problem',
                when: env => env.kase === 'motion',
                items: [
                    {
                        q: 'If s(t) is the position of an object, what is s′(t)?',
                        choices: [
                            'It is velocity. This is the rate at which position changes with time.',
                            'It is acceleration. That name belongs to the second derivative.',
                            'It is jerk. Every derivative past the first one has that name.'
                        ], a: 0,
                        whyBy: [
                            'One derivative of position is velocity. It is the rate at which position changes.',
                            'Acceleration is the second derivative s″, not the first.',
                            'Jerk is the third derivative, and the exam does not require that name.'
                        ]
                    },
                    {
                        q: 'In the same motion setting, what is s″(t)?',
                        choices: [
                            'It is acceleration. It is the rate at which velocity changes.',
                            'It is velocity. It is the rate at which position changes.',
                            'It is position again. It is the top row of the ladder.'
                        ], a: 0,
                        whyBy: [
                            'Differentiating velocity gives acceleration, which is s″. Row three of the ladder is the line a = 6t.',
                            'Velocity is s′, one row above.',
                            'Position is s, the row at the top of the ladder.'
                        ]
                    },
                    {
                        q: 'In the same motion setting, what is s‴(t)?',
                        choices: [
                            'It is the rate at which acceleration changes. The name jerk is extra, not exam vocabulary.',
                            'It is always 0. A third derivative of any function is 0.',
                            'It is the derivative of acceleration with respect to position.'
                        ], a: 0,
                        whyBy: [
                            'Each further derivative is the rate of change of the derivative before it. The label jerk is real, but AP Calculus does not require it.',
                            'It is 6 here because the position happened to be a cubic. A quartic would leave a non-constant third derivative.',
                            'Every derivative here is taken with respect to t, the same variable the graphs use.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { kase: 'cubic', depth: 1, x0: 1.4, cycle: 0, squared: 0 },
            message: 'One curve and its tangent. Drag the point and watch the slope change. That slope, as a function of x, is the next row of the ladder.'
        },
        {
            params: { depth: 2 },
            message: env => 'Row two is f′ = 3x² − 3, drawn on its own axes. The green height at x = ' + n(env.xq) + ' equals the tangent slope on row one. That is what f′ means.'
        },
        {
            params: { depth: 3 },
            predict: {
                q: 'f′ = 3x² − 3 is a quadratic. What shape should f″ have?',
                choices: [
                    'It is linear. Differentiating brings the power down by one. So 3x² becomes 6x.',
                    'It is quadratic. The shape of the derivative never changes.',
                    'It is constant. A second derivative is always a number.'
                ], a: 0,
                whyBy: [
                    'The power rule turns 3x² into 6x and removes the −3. So the second derivative is a line. The third derivative is a constant, and the fourth is 0.',
                    'Each differentiation lowers the degree of a polynomial by one. Only sin and cos keep their shape.',
                    'That happens one row later here. The line f″ = 6x still changes with x, and the constant f‴ = 6 does not.'
                ]
            },
            message: 'f″ = 6x is a line. Its height is the slope of f′ at the same x. Where f′ is rising, f″ is positive.'
        },
        {
            params: { depth: 4 },
            message: 'Row four is f‴ = 6, a flat line. The slope of the line 6x is the same everywhere. One more differentiation would give 0. That is where a polynomial ladder stops.'
        },
        {
            params: { x0: 2 },
            message: env => 'Stop at x = 2. f′ is increasing, f″ = ' + valText(env.v2) + ' is positive, and the top curve bends upward. All three graphs describe the same behavior.'
        },
        {
            params: { x0: -1.5 },
            message: env => 'Now x = −1.5. f″ = ' + valText(env.v2) + ' is negative. So the slope of f is decreasing, and the top curve bends downward. Unit 5 uses this connection for its concavity test.'
        },
        {
            params: { squared: 1, x0: 2 },
            message: 'f″ means differentiate f′ again, not square it. At x = 2 the two values are far apart, and only one of them is a derivative.'
        },
        {
            params: { squared: 0, kase: 'sine', depth: 2, x0: 1 },
            message: 'A polynomial ladder runs out of degrees and ends at 0. The sine ladder does not. Row two is cos x, and its heights still match the tangent slopes of sin x.'
        },
        {
            params: { depth: 3 },
            message: 'Row three is −sin x, the slope of cos x. It is the original function with the opposite sign, which never happens in a polynomial ladder.'
        },
        {
            params: { depth: 4 },
            message: 'Row four is −cos x, which is the slope of −sin x. Nothing heads toward 0 here.'
        },
        {
            params: { cycle: 1 },
            predict: {
                q: 'The ladder reads sin x, cos x, −sin x, −cos x. What is the next row?',
                choices: [
                    'It is sin x again. The cycle of four closes and starts over.',
                    'It is −sin x. The sign keeps flipping.',
                    'It is 0. Every ladder of derivatives ends at 0.'
                ], a: 0,
                whyBy: [
                    'The derivative of −cos x is sin x. So the fifth row is the first row again. Differentiating 40 more times also lands on sin x.',
                    'The signs flip on a two-step cycle, not at every step. Going from sin to cos keeps the sign. Going from cos to −sin changes it.',
                    'Only polynomials end at 0. sin x can be differentiated forever without reaching 0.'
                ]
            },
            message: 'The function sin x never runs out. A function can have derivatives of every order. Unit 10 uses this fact for Taylor series.'
        },
        {
            params: { kase: 'edge', depth: 3, cycle: 0, x0: 0 },
            message: 'Move to x = 0 on this one. f is defined there, and so is f′ with f′(0) = 0. The row f″ has no value there. A higher derivative can fail to exist where the function itself behaves well.'
        },
        {
            params: { kase: 'motion', depth: 3, x0: 1.2 },
            message: 'The same ladder now has physics names, position, velocity and acceleration. Answer the naming questions under "Names in a motion problem". Then press Next for the third derivative.'
        },
        {
            params: { depth: 4 },
            message: 's‴ is the rate at which acceleration changes. For this cubic it is the constant 6. The name jerk is extra context, not exam vocabulary. The exam requires velocity and acceleration, which are s′ and s″.'
        }
    ],
    summary: {
        idea: 'Higher-order derivatives are repeated rates of change. Each derivative becomes the quantity differentiated at the next level.',
        mistake: 'Reading f″ as (f′)². It is a second differentiation, and the two give different numbers at almost every x.',
        transfer: 'Take s(t) = t⁴ − 2t². Name s′ and s″ in a motion setting. Then find how many layers you can differentiate before the ladder reaches 0.'
    }
};
