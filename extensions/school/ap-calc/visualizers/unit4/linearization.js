/* 4.6 Linearization Microscope — the tangent is a LOCAL model. Two drags carry
   the whole topic: the microscope half-width, which merges curve and line, and
   the secant endpoint, which shows why this particular line owns the name. */

const MODES = {
    sqrt: {
        label: 'f(x) = √x at a = 4',
        f: x => Math.sqrt(x), df: x => 1 / (2 * Math.sqrt(x)),
        a: 4, x0: 4.1, q0: 6.4, window: [0, 9, 0, 3.4],
        name: '√x'
    },
    ln: {
        label: 'f(x) = ln x at a = 1',
        f: x => Math.log(x), df: x => 1 / x,
        a: 1, x0: 1.05, q0: 2.4, window: [0, 3, -1.2, 2],
        name: 'ln x',
        intro: 'f(x) = ln x, with the tangent point at a = 1. Here ln 1 = 0 and the slope is 1, so the tangent line is easy to write down.'
    },
    cube: {
        label: 'f(x) = x³ at a = 2',
        f: x => x * x * x, df: x => 3 * x * x,
        a: 2, x0: 2.2, q0: 2.9, window: [0, 3.4, -1, 27],
        name: 'x³',
        intro: 'f(x) = x³, with the tangent point at a = 2. This tab is another curve to fit with one line, so the same checks apply: match the value at a, match the slope at a, then watch how the error changes with distance.'
    }
};

function modeDef(key) {
    const m = MODES[key];
    const L = x => m.f(m.a) + m.df(m.a) * (x - m.a);
    return {
        label: m.label,
        intro: m.intro,
        params: { x: m.x0, w: 4, q: m.q0, stage: 1 },
        compute: (env) => {
            const x = Math.min(Math.max(env.x, m.window[0] + 0.05), m.window[1] - 0.05);
            const q = Math.min(Math.max(env.q, m.window[0] + 0.05), m.window[1] - 0.05);
            const fx = m.f(x), Lx = L(x);
            const slope = q === m.a ? m.df(m.a) : (m.f(q) - m.f(m.a)) / (q - m.a);
            return {
                fx, Lx, x, q,
                err: Lx - fx,
                fa: m.f(m.a), slopeT: m.df(m.a),
                secSlope: slope,
                secAt: x => m.f(m.a) + slope * (x - m.a),
                gap: Math.abs(slope - m.df(m.a))
            };
        },
        controls: [
            { key: 'x', label: 'x to estimate', min: m.window[0] + 0.1, max: m.window[1] - 0.1, step: 0.01 },
            { key: 'w', label: 'Zoom width around a', min: 0.05, max: 4, step: 0.05 }
        ],
        panes: {
            main: [
                {
                    kind: 'graph', title: env => env.stage >= 2
                        ? 'The secant line through the orange point, dragged toward the tangent point'
                        : 'Wide view: ' + m.name + ' (blue) and its tangent line at a = ' + m.a + ' (green)', height: 300,
                    window: m.window,
                    curves: (env) => {
                        const out = [
                            { fn: m.f, color: 'curveA', label: m.name },
                            { fn: L, color: 'curveC', label: 'tangent L' }
                        ];
                        if (env.stage >= 2) out.unshift({ fn: env.secAt, color: 'curveB', label: 'secant' });
                        return out;
                    },
                    points: (env) => {
                        const out = [
                            { x: m.a, y: env.fa, color: 'ink', label: '(a, f(a))' },
                            { x: env.x, fn: m.f, color: 'curveA', open: true, label: 'f(x)', drag: { key: 'x', min: m.window[0] + 0.1, max: m.window[1] - 0.1 } },
                            { x: env.x, y: env.Lx, color: 'curveC', label: 'L(x)' }
                        ];
                        if (env.stage >= 2) out.push({ x: env.q, fn: m.f, color: 'curveB', label: 'second point', drag: { key: 'q', min: m.window[0] + 0.1, max: m.window[1] - 0.1 } });
                        return out;
                    },
                    vlines: (env) => [{ x: env.x, color: 'auxInk' }],
                    segments: (env) => [
                        { x1: env.x, y1: env.fx, x2: env.x, y2: env.Lx, color: 'down', dashed: true }
                    ],
                    notes: (env) => {
                        const out = [{ x: env.x + 0.12, y: (env.fx + env.Lx) / 2, t: env => 'Error: ' + signed(env.err, 5) }];
                        if (env.stage >= 2) out.push({
                            x: m.a + (env.q - m.a) * 0.5, y: m.f(m.a) + env.secSlope * (env.q - m.a) * 0.5 - 0.06 * (m.window[3] - m.window[2]),
                            t: env => 'Secant slope ' + r4(env.secSlope) + ' · tangent slope ' + r4(env.slopeT)
                        });
                        return out;
                    }
                },
                {
                    kind: 'graph', title: env => 'Zoomed in on a ± ' + r2(env.w) + ': the curve straightens out', height: 215,
                    window: env => {
                        const w = Math.max(env.w, 0.05);
                        const yMid = m.f(m.a);
                        const yHalf = Math.max(0.004, w * Math.abs(m.df(m.a)) + 0.15 * w);
                        return [m.a - w, m.a + w, yMid - yHalf, yMid + yHalf];
                    },
                    curves: (env) => [
                        { fn: m.f, color: 'curveA', width: 3 },
                        { fn: L, color: 'curveC', width: 3 }
                    ]
                }
            ],
            side: [
                {
                    kind: 'readout', title: env => env.stage >= 2 ? 'Secant slope approaching tangent slope' : 'Actual value and linear estimate',
                    items: env => {
                        const out = [
                            { label: 'actual f(x)', v: env.fx, digits: 4, color: 'curveA', big: true },
                            { label: 'estimate L(x)', v: env.Lx, digits: 4, color: 'curveC', big: true },
                            { label: 'error L(x) − f(x)', v: env.err, digits: 4 }
                        ];
                        if (env.stage >= 2) out.push({ label: 'secant − tangent slope', v: env.gap, digits: 4, color: 'curveB', big: true });
                        return out;
                    }
                },
                {
                    kind: 'eq', title: 'The linearization',
                    lines: env => [
                        { t: 'L(x) = f(a) + f′(a)(x − a)' },
                        { t: 'L(x) = ' + r3(env.fa) + ' + ' + r3(env.slopeT) + '(x − ' + m.a + ')', hl: true },
                        { t: 'L matches the value at a:  L(a) = f(a) = ' + r3(env.fa) },
                        { t: 'L matches the slope at a: L′(a) = f′(a) = ' + r3(env.slopeT) }
                    ]
                }
            ]
        },
        steps: stepsFor(key, m),
        summary: summaries[key]
    };
}

/* Concavity is lesson 5.6 in this course, so it never carries a required step
   here. It appears once per tab, in the optional preview at the end of the flow. */
function previewStep(params) {
    return {
        params,
        message: 'Optional preview. On some tabs the estimate landed a little high, and on others a little low. Unit 5 explains that in a systematic way using concavity. Treat this as a preview of that lesson, not something to master today.'
    };
}

function stepsFor(key, m) {
    const whyTangent = [
        {
            params: { stage: 2 },
            message: 'Every second point on the curve gives a different secant line through (a, f(a)). Which of those secant lines is the linearization? Drag the orange endpoint along the curve toward the tangent point. The difference in the panel below falls as you drag.'
        },
        {
            params: { stage: 2, q: m.a + (m.q0 - m.a) * 0.12 },
            predict: {
                q: 'Drag the orange endpoint onto a, so the secant line has no run left. Which line does the secant line become?',
                choices: ['It becomes the tangent line. Its slope becomes f′(a).', 'It becomes a horizontal line. The secant stops rising.', 'It becomes no line. A secant with no run is undefined.'], a: 0,
                why: 'f′(a) is defined as the limit of (f(q) − f(a)) / (q − a) as q approaches a. So the secant line does not disappear. It settles onto one line, and that line is the linearization L. Only L matches both the value and the slope at a.'
            },
                message: 'The panel shows the secant slope minus the tangent slope. That difference heads to 0 as the second point closes in on a.'
        }
    ];
    if (key === 'sqrt') return [
        {
            params: { x: 4.1, w: 4, stage: 1 },
            message: 'Estimate √4.1 without a calculator. Take a = 4, where f and f′ are easy to compute. Then L(4.1) = 2 + 0.25(0.1) = 2.025. The panel reports the remaining error, about 0.00015.'
        },
        {
            params: { x: 4.1, w: 0.4, stage: 1 },
            predict: {
                q: 'The next step narrows the zoom window from a ± 4 down to a ± 0.4 around a = 4. What do the curve and the tangent line do as that window shrinks?',
                choices: ['They merge into almost one stroke.', 'They pull farther apart.', 'The line disappears and only the curve is left.'], a: 0,
                why: 'A differentiable curve straightens out when you look closely enough, and the tangent line is that straight piece of it. Narrow the window and the two become hard to tell apart.'
            },
            message: 'The zoom is now a ± 0.4. The curve and the line are almost the same stroke. That is why the estimate works at all.'
        },
        {
            params: { x: 4.1, w: 0.06, stage: 1 },
            message: 'At a zoom of 0.06 the curve and the line are indistinguishable. This is local linearity. Any differentiable curve straightens out when you look closely enough.'
        },
        ...whyTangent,
        {
            params: { x: 7, w: 4, stage: 1 },
            predict: {
                q: 'The value to estimate moves from x = 4.1 to x = 7, far from the tangent point. Does the linear estimate get better or worse?',
                choices: ['Worse. The curve has had more room to bend away from the line.', 'Better. A farther point is easier to reach.', 'The error stays exactly the same.'], a: 0,
                why: 'L matches the value and the slope only at a, and the mismatch grows roughly with the square of the distance. At x = 7 the error is 2.75 − 2.6458 ≈ 0.104, about 700 times the error at x = 4.1.'
            },
            message: 'Read the error value. The distance from the tangent point sets the size of the error. That is all the word “local” means.'
        },
        previewStep({ x: 4.1, w: 1, stage: 1 })
    ];
    if (key === 'ln') return [
        {
            params: { x: 1.05, w: 4, stage: 1 },
            predict: {
                q: 'The panel shows L(1.05) = 0.05 against ln(1.05) ≈ 0.04879, a gap of about 0.00121. Now drag x away from a = 1 toward 2. What happens to the size of that gap?',
                choices: ['It grows.', 'It shrinks toward 0.', 'It stays about 0.001.'], a: 0,
                why: 'L matches the value and the slope only at a = 1. Away from a the line no longer has to follow the curve, so the gap widens. The panel reads the error as a signed number, so watch its size. At x = 2 the gap is about 0.307, roughly 250 times the gap at x = 1.05.'
            },
            message: 'Read the error at x = 1.05 while you are there. Then drag x toward 2. The estimate gets worse as x leaves the tangent point.'
        },
        ...whyTangent.map(s => Object.assign({}, s, { params: Object.assign({}, s.params, { x: 1.05, w: 0.3 }) })),
        previewStep({ x: 1.05, w: 0.3, stage: 1 })
    ];
    return [
        {
            params: { x: 2.2, w: 4, stage: 1 },
            predict: {
                q: 'The panel reads L(2.2) = 10.4 against 2.2³ = 10.648, so the error is about −0.248. Now drag x away from a = 2, out toward 3. What happens to the size of that error?',
                choices: ['It grows.', 'It shrinks toward 0.', 'It stays near 0.248.'], a: 0,
                why: 'L matches the value and the slope only at a = 2. Away from a the line no longer has to follow the curve, so the size of the gap widens. The panel prints a signed number, so read its size rather than its direction. Drag x back to 2.01 and the gap all but disappears.'
            },
            message: 'Check the error right beside a = 2, then check it a little way off. The distance from the tangent point is what sets how far you can trust this line.'
        },
        ...whyTangent.map(s => Object.assign({}, s, { params: Object.assign({}, s.params, { x: 2.2, w: 0.4 }) })),
        previewStep({ x: 2.2, w: 0.4, stage: 1 })
    ];
}

const summaries = {
    sqrt: {
        idea: 'A tangent line is a local model of a differentiable function. It matches the value and the slope only at a, and zooming in far enough shows why the line works at all.',
        mistake: 'Treating L(x) as a new exact formula for f. Near a the match is excellent. At x = 7 the same line is off by 0.104. No other line through (a, f(a)) works either, because only the tangent matches both position and slope.',
        transfer: 'Switch to the ln x tab. Read the error at x = 1.05, then drag x out to 1.8 and read it again. Say how the two distances compare.'
    },
    ln: {
        idea: 'The size of the error follows the distance from a, not the particular function. Close to a the curve and the line are one stroke, and far from a the same line misses by a lot.',
        mistake: 'Using the tangent far from a because the formula looks simple. For ln x at a = 1, L(2) reads 1 while ln 2 ≈ 0.693. Local means local.',
        transfer: 'Open the third tab, x³ at a = 2. Read the error at x = 2.05 and again at x = 3, then compare the two numbers before you look at anything else.'
    },
    cube: {
        idea: 'The same recipe on a new curve: L matches the value and the slope at a = 2, and the error you read in the panel grows with the distance from a.',
        mistake: 'Trusting a tidy formula just because it is a line. Here L(2.2) = 10.4 while 2.2³ = 10.648, so the estimate is already off by about 0.25 a short step from a. Move farther and the gap keeps widening.',
        transfer: 'Pick any function and any a. Estimate one value very near a and one a good way off, then compare the two errors you read.'
    }
};

export default {
    id: 'u4-linearization',
    meta: { unit: 4, topic: '4.6', title: 'Approximating Values of a Function Using Local Linearity and Linearization', visualizerTitle: 'Linearization Microscope' },
    modes: [modeDef('sqrt'), modeDef('ln'), modeDef('cube')]
};

function r2(v) { return String(Math.round(v * 100) / 100); }
function r3(v) { return String(Math.round(v * 1000) / 1000); }
function r4(v) { return Number.isFinite(v) ? String(Math.round(v * 10000) / 10000) : '—'; }
function signed(v, d) { const p = Math.pow(10, d); return (v >= 0 ? '+' : '') + Math.round(v * p) / p; }
