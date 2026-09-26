/* 4.6 Linearization Microscope — the tangent is a LOCAL model. Two drags carry
   the whole topic: the microscope half-width, which merges curve and line, and
   the secant endpoint, which shows why this particular line owns the name. */

const MODES = {
    sqrt: {
        label: 'f(x) = √x at a = 4',
        f: x => Math.sqrt(x), df: x => 1 / (2 * Math.sqrt(x)),
        a: 4, x0: 4.1, q0: 6.4, window: [0, 9, 0, 3.4],
        concave: 'down', name: '√x'
    },
    ln: {
        label: 'f(x) = ln x at a = 1',
        f: x => Math.log(x), df: x => 1 / x,
        a: 1, x0: 1.05, q0: 2.4, window: [0, 3, -1.2, 2],
        concave: 'down', name: 'ln x',
        intro: 'f(x) = ln x, with the tangent point at a = 1. Here ln 1 = 0 and the slope is 1, so the tangent line is easy to write down.'
    },
    cube: {
        label: 'f(x) = x³ at a = 2 (concave up)',
        f: x => x * x * x, df: x => 3 * x * x,
        a: 2, x0: 2.2, q0: 2.9, window: [0, 3.4, -1, 27],
        concave: 'up', name: 'x³',
        intro: 'f(x) = x³, with the tangent point at a = 2. This tab is the control case, because the curve bends upward where √x and ln x bend downward.'
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
                        { t: 'L matches the slope at a: L′(a) = f′(a) = ' + r3(env.slopeT) },
                        { t: 'The graph is concave ' + m.concave + ', so the tangent line sits ' + (m.concave === 'down' ? 'above' : 'below') + ' the curve nearby', color: 'aux' }
                    ]
                }
            ]
        },
        steps: stepsFor(key, m),
        summary: summaries[key]
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
                q: 'The graph of √x is concave down near x = 4, so its slope keeps shrinking. Is the tangent estimate at x = 4.1 above or below the true value of √4.1?',
                choices: ['Above', 'Below', 'Curvature is not enough to predict it'], a: 0,
                why: 'A concave-down curve bends down away from its tangent line. So the tangent line sits above the graph near a, and the estimate comes in high by 0.00015.'
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
        {
            params: { x: 4.1, w: 1, stage: 1 },
            message: 'Keep one limit in mind. The above or below answer only holds while the concavity stays the same between a and the value you want. √x is concave down everywhere, so it is safe here. A general function can change concavity.'
        }
    ];
    if (key === 'ln') return [
        {
            params: { x: 1.05, w: 4, stage: 1 },
            predict: {
                q: 'The graph of ln x is concave down near a = 1. Is the tangent approximation of ln(1.05) above or below the true value?',
                choices: ['Above', 'Below', 'Equal'], a: 0,
                why: 'The curvature argument is the same as for √x. L(1.05) = 0.05 while ln(1.05) ≈ 0.04879, so the estimate is high by about 0.00121. You predicted the sign of an error from concavity alone.'
            },
            message: 'Check the numbers after you answer. Now drag x toward 2. The estimate gets worse as x leaves the tangent point.'
        },
        ...whyTangent.map(s => Object.assign({}, s, { params: Object.assign({}, s.params, { x: 1.05, w: 0.3 }) }))
    ];
    return [
        {
            params: { x: 2.2, w: 4, stage: 1 },
            predict: {
                q: 'The graph of x³ is concave up for x > 0, and the tangent point is a = 2. Does the tangent line sit above or below the graph?',
                choices: ['The line sits below the graph, so the estimate is low', 'The line sits above the graph, so the estimate is high', 'The line sits on the graph at every point'], a: 0,
                why: 'A concave-up graph bends up away from its tangent line. L(2.2) = 8 + 12(0.2) = 10.4, while 2.2³ = 10.648, so the estimate is low. The answer flips when the concavity flips.'
            },
            message: 'Everything here is the same as in the other tabs except the direction of the curvature.'
        },
        ...whyTangent.map(s => Object.assign({}, s, { params: Object.assign({}, s.params, { x: 2.2, w: 0.4 }) }))
    ];
}

const summaries = {
    sqrt: {
        idea: 'A tangent line is a local model of a differentiable function. It works best near the tangent point, and concavity says whether it runs high or low.',
        mistake: 'Treating L(x) as a new exact formula for f. Near a the match is excellent. At x = 7 the same line is off by 0.104. No other line through (a, f(a)) works either, because only the tangent matches both position and slope.',
        transfer: 'Switch to the ln x tab. Predict whether the tangent approximation of ln(1.05) is above or below the true value, then reveal the answer.'
    },
    ln: {
        idea: 'The over or under answer follows the concavity, not the particular function. When the graph is concave down the tangent line is above. When the graph is concave up the tangent line is below.',
        mistake: 'Using the tangent far from a because the formula looks simple. For ln x at a = 1, L(2) reads 1 while ln 2 ≈ 0.693. Local means local.',
        transfer: 'Open the third tab, x³ at a = 2, where the graph is concave up. Predict the sign of L(2.2) − f(2.2) before you check.'
    },
    cube: {
        idea: 'Same zoom, opposite curvature. A concave-up graph stays above its tangent line, so linear estimates come in low.',
        mistake: 'Claiming that tangent estimates are always high. The √x and ln x tabs run high because those graphs are concave down. This tab runs low. Check the concavity before you say above or below.',
        transfer: 'Pick any function that is concave down near a, estimate one value, and say in one sentence whether your answer is high or low, and why.'
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
