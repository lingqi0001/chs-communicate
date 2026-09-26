/* 1.14 + 1.15 Asymptote Explorers — vertical: unbounded behavior at a
   finite x; horizontal: the value the graph creeps toward far out.
   The vertical explorer auto-fits its y-scale to the probes, so a probe
   crawling toward the fence stays on canvas instead of vanishing offscreen. */

const VA_CASES = {
    oneover: { label: '1/(x − 2)', c: 2, sq: false },
    squared: { label: '1/(x − 2)²', c: 2, sq: true },
    leftsq: { label: '1/(x + 1)²', c: -1, sq: true }
};

function fnum(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
function r2(v) { return Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(2); }

export const VA = {
    id: 'u1-vertical-asymptote',
    meta: { unit: 1, topic: '1.14', title: 'Connecting Infinite Limits and Vertical Asymptotes', visualizerTitle: 'Vertical Asymptote Explorer' },
    intro: 'The input approaches a finite number while the output grows without bound. The frame grows to keep that growth visible. Here infinity describes the behavior, and it is not a value.',
    params: { kase: 'oneover', xL: 0.2, xR: 3.8 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: [
                { v: 'oneover', label: '1/(x − 2)' },
                { v: 'squared', label: '1/(x − 2)²' },
                { v: 'leftsq', label: '1/(x + 1)²' }
            ]
        }
    ],
    fns: {
        f: (x, env) => env.sq ? 1 / ((x - env.fence) * (x - env.fence)) : 1 / (x - env.fence)
    },
    compute: env => {
        const k = VA_CASES[env.kase];
        const c = k.c;
        const lx = env.xL < c ? env.xL : c - 1.2;
        const rx = env.xR > c ? env.xR : c + 1.2;
        const fL = k.sq ? 1 / ((lx - c) * (lx - c)) : 1 / (lx - c);
        const fR = k.sq ? 1 / ((rx - c) * (rx - c)) : 1 / (rx - c);
        const m = Math.max(Math.abs(fL), Math.abs(fR));
        const top = Math.max(8, m * 1.1);
        const win = k.sq ? [c - 4, c + 4, -2, top] : [c - 4, c + 4, -top, top];
        return { fence: c, sq: k.sq, lx, rx, fL, fR, win };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'y = ' + VA_CASES[env.kase].label, height: 350,
                window: env => env.win,
                vlines: env => [{ x: env.fence, color: 'down', label: 'vertical asymptote x = ' + fnum(env.fence) }],
                curves: env => {
                    const g = env.sq ? 0.05 : 0.07;
                    const c = env.fence;
                    return [
                        { fn: 'f', from: c - 4, to: c - g, samples: 500, color: 'curveA' },
                        { fn: 'f', from: c + g, to: c + 4, samples: 500, color: 'curveA' }
                    ];
                },
                points: env => [
                    { x: env.lx, y: env.fL, color: 'up', label: 'left probe', drag: { key: 'xL', min: env.fence - 3.8, max: env.fence - 0.1 } },
                    { x: env.rx, y: env.fR, color: 'down', label: 'right probe', drag: { key: 'xR', min: env.fence + 0.1, max: env.fence + 3.8 } }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'One-sided behavior',
                items: env => [
                    { label: 'x → ' + fnum(env.fence) + '⁻', v: env.lx }, { label: 'f →', v: env.fL, color: 'up', big: true },
                    { label: 'x → ' + fnum(env.fence) + '⁺', v: env.rx }, { label: 'f →', v: env.fR, color: 'down', big: true }
                ]
            },
            {
                kind: 'eq', title: 'Live notation',
                lines: env => {
                    const c = fnum(env.fence);
                    return env.sq ? [
                        { t: 'lim x→' + c + '⁻  f(x) = +∞', color: 'up', hl: true },
                        { t: 'lim x→' + c + '⁺  f(x) = +∞', color: 'down', hl: true },
                        { t: 'lim x→' + c + '  f(x) = +∞', rule: 'the same on both sides' },
                        { t: 'Because the denominator is squared, the sign never changes, so both sides rise.' }
                    ] : [
                        { t: 'lim x→' + c + '⁻  f(x) = −∞', color: 'up', hl: true },
                        { t: 'lim x→' + c + '⁺  f(x) = +∞', color: 'down', hl: true },
                        { t: 'lim x→' + c + '  f(x) = DNE', rule: 'opposite infinities' },
                        { t: 'x = ' + c + ' is still a vertical asymptote, because one unbounded side is enough.' }
                    ];
                }
            },
            { kind: 'note', tone: 'warn', title: 'Not a value', text: 'Writing f(c) = ∞ at the asymptote is not a correct statement. The function is undefined there, and the ∞ only describes how the outputs grow as x approaches. Reading "= ∞" reports the behavior, and it does not assign a value.' }
        ]
    },
    steps: [
        { params: { kase: 'oneover', xL: 0.5, xR: 3.5 }, message: 'Both probes start comfortably away from the middle. Drag them toward the dashed line and watch the readouts grow in opposite directions while the frame expands to match.' },
        {
            params: { xL: 1.6, xR: 2.4 },
            predict: {
                q: 'Look at 1/(x−2). As x approaches 2, which side heads to +∞ and which to −∞?',
                choices: [
                    'The right side heads to +∞ and the left side to −∞. The factor (x−2) is positive only to the right of 2.',
                    'The left side heads to +∞ and the right side to −∞.',
                    'Both sides head to +∞, so the two-sided limit equals +∞.'
                ], a: 0,
                why: 'The numerator stays at 1, so the sign comes from (x−2). This factor is negative to the left of 2 and positive to the right. Reasoning about the sign, rather than only reading the picture, is what the exam asks for.'
            },
            message: 'Now move the probes and compare the graph with your prediction about the signs.'
        },
        {
            params: { xL: 1.98, xR: 2.02 },
            message: env => 'The probes read ' + r2(env.fL) + ' and ' + r2(env.fR) + ', and the y-scale grew to keep both points on screen. The two-sided limit does not exist, because the left side and the right side go to opposite infinities. The vertical asymptote still exists.'
        },
        {
            params: { kase: 'squared', xL: 1.6, xR: 2.4 },
            predict: {
                q: 'Now switch the function to 1/(x−2)². What changes about the two sides?',
                choices: [
                    'Both sides now rise to +∞, because squaring removes the sign change.',
                    'Nothing changes because squaring leaves the output the same.',
                    'The left side now rises while the right side falls to −∞.'
                ], a: 0,
                why: 'The asymptote stays the same, but the behavior changes. Here you may describe the two-sided behavior as +∞, because both one-sided limits agree.'
            },
            message: 'Drag both probes near 2. Squaring the denominator makes every output positive.'
        },
        {
            params: { kase: 'leftsq', xL: -2.5, xR: 0.5 },
            predict: {
                q: 'In this tool, take f(x) = 1/(x + 1)². Name the vertical asymptote and the two-sided limit before you move the probes.',
                choices: [
                    'The vertical asymptote is x = −1. Both one-sided limits are +∞, so lim x→−1 f = +∞.',
                    'The vertical asymptote is x = 1, with one side heading to −∞.',
                    'There is no asymptote, because a square stays bounded.'
                ], a: 0,
                why: 'The denominator x + 1 is 0 at x = −1, and squaring keeps it positive on both sides. Both sides rise, so the two-sided statement is +∞. The value f(−1) is still undefined, because infinity names behavior, not a value.'
            },
            message: 'The whole scene has moved 3 units to the left, but it is the same squared-denominator logic at a new asymptote. Move the probes and watch the automatic y-scale keep them on screen.'
        }
    ],
    summary: {
        idea: 'A vertical asymptote marks unbounded behavior near a finite x-value. The one-sided signs are part of the answer.',
        mistake: 'Writing f(a) = ∞ at the asymptote is the mistake. Infinity is never a function value, and it only names a direction of growth.',
        transfer: 'Work through the 1/(x + 1)² case in this order: name the asymptote, then both one-sided limits, then the two-sided statement. Finally explain why f(−1) is undefined and why ∞ is not a value.'
    }
};

export const HA = {
    id: 'u1-end-behavior',
    meta: { unit: 1, topic: '1.15', title: 'Connecting Limits at Infinity and Horizontal Asymptotes', visualizerTitle: 'End Behavior Explorer' },
    intro: 'For x → ±∞, the input does not approach a point. It travels outward, and you ask what height the graph settles toward.',
    params: { kase: 'rational', M: 3 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: [
                { v: 'rational', label: '(3x² + 1)/(x² − 4)' },
                { v: 'crosser', label: '3 + sin(x)/x  (crosses its horizontal asymptote)' },
                { v: 'tanhish', label: 'eˣ/(1+eˣ)  (different at each end)' },
                { v: 'sqrtend', label: '2x/√(x² + 1)  (opposite signs at the ends)' }
            ]
        },
        { key: 'M', label: 'how far out to travel', min: 1.5, max: 60, step: 0.5 }
    ],
    fns: {
        f: (x, env) => env.kase === 'rational' ? (3 * x * x + 1) / (x * x - 4)
            : env.kase === 'crosser' ? 3 + Math.sin(x) / x
                : env.kase === 'tanhish' ? Math.exp(x) / (1 + Math.exp(x))
                    : 2 * x / Math.sqrt(x * x + 1)
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => ({ rational: 'y = (3x²+1)/(x²−4)', crosser: 'y = 3 + sin(x)/x', tanhish: 'y = eˣ/(1+eˣ)', sqrtend: 'y = 2x/√(x²+1)' })[env.kase], height: 350,
                window: env => {
                    /* the frame must always contain both travelers at ±M */
                    const m = Math.max(env.kase === 'tanhish' ? 6 : 4, env.M * 1.05);
                    let y0 = env.kase === 'tanhish' ? -0.4 : env.kase === 'sqrtend' ? -2.8 : -1.5;
                    let y1 = env.kase === 'tanhish' ? 1.5 : env.kase === 'sqrtend' ? 2.8 : 6.5;
                    const pad = 0.1 * (y1 - y0);
                    [env.f(env.M), env.f(-env.M)].forEach(v => {
                        if (Number.isFinite(v)) {
                            y0 = Math.min(y0, v - pad);
                            y1 = Math.max(y1, v + pad);
                        }
                    });
                    return [-m, m, y0, y1];
                },
                curves: env => [{ fn: 'f', color: 'curveA', samples: Math.round(env.M) > 20 ? 1200 : 400 }],
                hlines: env => {
                    if (env.kase === 'tanhish') return [
                        { y: 1, color: 'aux', label: 'horizontal asymptote at the right end: y = 1' },
                        { y: 0, color: 'auxInk', label: 'horizontal asymptote at the left end: y = 0' }
                    ];
                    if (env.kase === 'sqrtend') return [
                        { y: 2, color: 'aux', label: 'horizontal asymptote at the right end: y = 2' },
                        { y: -2, color: 'auxInk', label: 'horizontal asymptote at the left end: y = −2' }
                    ];
                    return [{ y: 3, color: 'aux', label: 'y = 3' }];
                },
                points: env => [
                    { x: env.M, fn: 'f', color: 'down', label: 'right traveler' },
                    { x: -env.M, fn: 'f', color: 'up', label: 'left traveler' }
                ]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Live end behavior',
                items: env => [
                    { label: 'x = +', v: env.M }, { label: 'f →', v: env.f(env.M), color: 'down', big: true },
                    { label: 'x = −', v: -env.M }, { label: 'f →', v: env.f(-env.M), color: 'up', big: true }
                ]
            },
            {
                kind: 'eq', title: 'What the travel shows',
                lines: env => env.kase === 'rational' ? [
                    { t: 'lim x→+∞  f = 3', hl: true },
                    { t: 'lim x→−∞  f = 3', hl: true },
                    { t: 'Far out, the term 3x² is larger than 1, and x² is larger than −4', rule: 'dominant terms' },
                    { t: 'This graph never crosses y = 3, but the next case is different.' }
                ] : env.kase === 'crosser' ? [
                    { t: 'lim x→±∞  3 + sin(x)/x = 3', hl: true },
                    { t: 'sin(x)/x shrinks toward 0 and passes through 0 many times', rule: 'sin(x)/x shrinks to 0' },
                    { t: 'This graph crosses its horizontal asymptote, an endless number of times.' }
                ] : env.kase === 'sqrtend' ? [
                    { t: 'lim x→+∞  2x/√(x²+1) = +2', hl: true, color: 'down' },
                    { t: 'lim x→−∞  2x/√(x²+1) = −2', hl: true, color: 'up' },
                    { t: 'Far out, √(x²+1) acts like |x|, and |x| has no sign', rule: '√(x²) = |x|' },
                    { t: 'The same size at both ends but opposite signs: two horizontal asymptotes.' }
                ] : [
                    { t: 'lim x→+∞  f = 1', hl: true, color: 'down' },
                    { t: 'lim x→−∞  f = 0', hl: true, color: 'up' },
                    { t: 'Two different horizontal asymptotes, one at each end.' }
                ]
            }
        ]
    },
    steps: [
        { params: { kase: 'rational', M: 3 }, message: (env) => 'The two probe points sit at ±' + env.M + '. This rational function is even, so both sides read the same height, ' + env.f(env.M).toFixed(2) + '. That is still near the middle, so push both outward to see the trend.' },
        { params: { M: 10 }, message: (env) => 'At ±10 both heights read ' + env.f(env.M).toFixed(3) + '. The x² terms do most of the work out here.' },
        { params: { M: 50 }, message: (env) => 'At ±50 each height is ' + env.f(env.M).toFixed(4) + ', only ' + Math.abs(env.f(env.M) - 3).toFixed(4) + ' away from 3. Since lim x→±∞ f = 3, the line y = 3 is a horizontal asymptote.' },
        {
            params: { kase: 'crosser', M: 8 },
            predict: {
                q: 'This function has a horizontal asymptote at y = 3. Can a function cross its own horizontal asymptote?',
                choices: ['Yes, because a horizontal asymptote describes the far-out trend, not a wall.', 'No, because an asymptote is a forbidden boundary.'], a: 0,
                why: 'A horizontal asymptote is a limit claim at infinity. Nothing in the definition stops the graph from crossing it at finite x. The sin(x)/x term passes through 3 again and again before settling.'
            },
            message: 'Slide M outward. The two probe points move up and down around the dashed line while getting closer to it. That is crossing and approaching at the same time.'
        },
        { params: { kase: 'tanhish', M: 5 }, message: 'For this logistic function, the right end settles toward 1 and the left end toward 0. One function can have two different limits at infinity, so it has two different horizontal asymptotes. Push M outward, and both probe points stay on screen as the frame stretches.' },
        {
            params: { kase: 'sqrtend', M: 8 },
            predict: {
                q: 'In this tool, take f(x) = 2x/√(x²+1). Which pair of end limits is correct?',
                choices: ['+2 at the right end and −2 at the left end.', 'Both +2, because only the size matters.', 'Both −2.', 'Neither limit exists.'], a: 0,
                why: 'Far out, √(x²+1) behaves like |x|. So f behaves like 2x/|x|, which is +2 when x > 0 and −2 when x < 0. There are two horizontal asymptotes, equal in size but opposite in sign.'
            },
            message: 'Move M outward, and the heights settle at +2 and −2, just as predicted. The numerator 2x changes sign with x, while the square root in the denominator is always positive.'
        }
    ],
    summary: {
        idea: 'A horizontal asymptote states what the function approaches far out in the domain. It places no restriction on the behavior at finite x.',
        mistake: 'Treating a horizontal asymptote as a wall that can never be crossed. It is only a claim about the trend at infinity.',
        transfer: 'The case 2x/√(x²+1) is that exercise. Predict both end limits before you move the slider. Then explain why the ends differ in sign but not in size.'
    }
};

export default { topics: { '1.14': VA, '1.15': HA } };
