/* 3.1 Chain Rule Layers — one draggable object: the point on the curve. The hero
   is a linked interval map: two small windows, each drawn in its own units, where
   the rise the inner layer produces is literally the run the outer layer is given.
   That hinge is why the rates multiply. Every Δ drawn here is a REAL finite change
   (Δu = g(x + Δx) − g(x)), never a tangent prediction dressed up as one. The run
   of screens is: two local rates, Predict how they combine, the exact finite
   identity Δy/Δx = (Δy/Δu)(Δu/Δx), shrink Δx until the finite ratios become the
   rates, only then box dy/dx = (dy/du)(du/dx). Text is deliberately minimal. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const CASES = {
    power: {
        inner: '3x² + 1', outer: 'u⁴', composed: '(3x² + 1)⁴',
        duxExpr: '6x', dyuExpr: '4u³',
        factors: '4u³ · 6x', substituted: '4(3x² + 1)³ · 6x',
        g: x => 3 * x * x + 1, gp: x => 6 * x,
        h: u => Math.pow(u, 4), hp: u => 4 * Math.pow(u, 3)
    },
    sine: {
        inner: 'x²', outer: 'sin u', composed: 'sin(x²)',
        duxExpr: '2x', dyuExpr: 'cos u',
        factors: 'cos(u) · 2x', substituted: 'cos(x²) · 2x',
        g: x => x * x, gp: x => 2 * x,
        h: u => Math.sin(u), hp: u => Math.cos(u)
    },
    expo: {
        inner: 'sin x', outer: 'e^u', composed: 'e^(sin x)',
        duxExpr: 'cos x', dyuExpr: 'e^u',
        factors: 'e^u · cos x', substituted: 'e^(sin x) · cos x',
        g: x => Math.sin(x), gp: x => Math.cos(x),
        h: u => Math.exp(u), hp: u => Math.exp(u)
    }
};

const n = v => String(Math.round(v * 1000) / 1000);
const n2 = v => String(Math.round(v * 100) / 100);
const caseOf = env => CASES[env.kase];
const comp = (env, x) => { const c = caseOf(env); return c.h(c.g(x)); };

/* the composite drawn on its own axes, zoomed so the step is always visible */
function compView(env) {
    const half = Math.max(env.dd * 5, 0.12);
    const lo = env.x0 - half, hi = env.x0 + half;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i <= 12; i++) {
        const y = comp(env, lo + (hi - lo) * i / 12);
        if (Number.isFinite(y)) { mn = Math.min(mn, y); mx = Math.max(mx, y); }
    }
    const pad = Math.max((mx - mn) * 0.16, 1e-6);
    return [lo, hi, mn - pad, mx + pad];
}

const span = (band, center) => Math.max(Math.abs(band) * 4, Math.abs(center) * 1e-3 + 1e-4);

/* Two windows that share one quantity: the rise the inner layer hands over is
   the run the outer layer gets. Both rises are real finite changes, so the
   outer window draws exactly what the label says. */
/* The top multiplier walks the same arc as the prose: while the rule is not yet
   boxed it names the real finite ratio on that window (Δu/Δx, Δy/Δu), so run ×
   gain reproduces the drawn finite rise. Once the screen reaches the boxed
   derivative (stage >= 3) it switches to the instantaneous rate label du/dx,
   dy/du. A finite Δu of 0 leaves Δy/Δu as 0/0, and the window says so. */
function mapSteps(env) {
    const broken = env.broken > 0.5;
    const instant = env.stage >= 3;
    const run2 = broken ? env.dd : env.duReal;
    const innerGain = instant ? 'du/dx = ' + n2(env.dux) : 'finite rate × ' + n2(env.rux);
    const outerGain = broken
        ? 'dy/du = ' + n2(env.dyu) + ' only'
        : instant ? 'dy/du = ' + n2(env.dyu)
            : env.duZero ? 'Δy/Δu undefined' : 'finite rate × ' + n2(env.ryu);
    return [
        {
            name: 'inner: u against x', axis: 'x', fn: 'g', color: 'curveC',
            center: env.x0, half: span(env.dd, env.x0), band: env.dd,
            bandLabel: 'run Δx = ' + n(env.dd),
            riseLabel: 'rise Δu = ' + n(env.duReal),
            hinge: broken ? ['using Δx', 'not Δu'] : ['Δu = ' + n(env.duReal), 'is the next run'],
            gain: innerGain
        },
        {
            name: 'outer: y against u', axis: 'u', fn: 'h', color: 'curveB',
            center: env.u0, half: span(run2, env.u0), band: run2,
            bandLabel: broken ? 'run is Δx = ' + n(run2) : 'run Δu = ' + n(run2),
            riseLabel: 'rise Δy = ' + n(env.chainStep),
            gain: outerGain
        }
    ];
}

/* The transfer chain has three layers: x → x² → sin(x²) → e^(sin(x²)).
   The chain renderer already supports any number of windows: it lays them out
   side by side and draws a hinge arrow between every pair (calc-components.js
   chain(), steps.forEach with i < steps.length - 1), so a third step needs no
   new field. Each window keeps its own units and its own finite band. */
function mapSteps3(env) {
    const instant = env.stage >= 3;
    const r1 = instant ? 'du/dx = ' + n2(env.deepR1) : 'finite rate × ' + n2(env.deepR1f);
    const r2 = instant ? 'dv/du = ' + n2(env.deepR2) : 'finite rate × ' + n2(env.deepR2f);
    const r3 = instant ? 'dy/dv = ' + n2(env.deepR3) : 'finite rate × ' + n2(env.deepR3f);
    return [
        {
            name: 'first layer: u = x²', axis: 'x', fn: 'sq', color: 'curveC',
            center: env.x0, half: span(env.dd, env.x0), band: env.dd,
            bandLabel: 'run Δx = ' + n(env.dd),
            riseLabel: 'rise Δu = ' + n(env.deepDU),
            hinge: ['Δu = ' + n(env.deepDU), 'is the next run'],
            gain: r1
        },
        {
            name: 'second layer: v = sin u', axis: 'u', fn: 'sn', color: 'curveB',
            center: env.deepU0, half: span(env.deepDU, env.deepU0), band: env.deepDU,
            bandLabel: 'run Δu = ' + n(env.deepDU),
            riseLabel: 'rise Δv = ' + n(env.deepDV),
            hinge: ['Δv = ' + n(env.deepDV), 'is the next run'],
            gain: r2
        },
        {
            name: 'third layer: y = e^v', axis: 'v', fn: 'ex', color: 'accent',
            center: env.deepV0, half: span(env.deepDV, env.deepV0), band: env.deepDV,
            bandLabel: 'run Δv = ' + n(env.deepDV),
            riseLabel: 'rise Δy = ' + n(env.deepDY),
            gain: r3
        }
    ];
}

export default {
    id: 'u3-chain-rule',
    meta: { unit: 3, topic: '3.1', title: 'The Chain Rule', visualizerTitle: 'Chain Rule Layers' },
    intro: 'Drag the point on the curve. The inner graph turns a step in x into a real step in u. The outer graph turns that step in u into a step in y.',
    params: { kase: 'power', x0: 0.8, dd: 0.05, link: 1, stage: 0, broken: 0, deep: 0 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: [
                { v: 'power', label: '(3x² + 1)⁴' },
                { v: 'sine', label: 'sin(x²)' },
                { v: 'expo', label: 'e^(sin x)' }
            ]
        },
        {
            key: 'link', label: 'show', kind: 'choice',
            options: [
                { v: 1, label: 'inner graph' },
                { v: 2, label: 'outer graph' },
                { v: 3, label: 'both graphs' }
            ]
        },
        { key: 'x0', label: 'x', min: -1.6, max: 1.8, step: 0.01 },
        { key: 'dd', label: 'Δx step size', min: 0.005, max: 0.25, step: 0.005, showDigits: 3 }
    ],
    fns: {
        g: (x, env) => caseOf(env).g(x),
        gp: (x, env) => caseOf(env).gp(x),
        h: (u, env) => caseOf(env).h(u),
        hp: (u, env) => caseOf(env).hp(u),
        comp: (x, env) => comp(env, x),
        sq: x => x * x,
        sn: u => Math.sin(u),
        ex: v => Math.exp(v)
    },
    compute: (env) => {
        const c = caseOf(env);
        const broken = env.broken > 0.5;
        const u0 = c.g(env.x0);
        const y0 = c.h(u0);
        const dux = c.gp(env.x0), dyu = c.hp(u0);
        /* real finite changes, not tangent predictions */
        const duReal = c.g(env.x0 + env.dd) - u0;
        const measStep = c.h(u0 + duReal) - y0;
        const chainStep = (broken ? c.h(u0 + env.dd) : c.h(u0 + duReal)) - y0;
        /* a dragged x can make Δu exactly 0 (x = −Δx/2 in a symmetric inner
           layer). Then Δy/Δu is 0/0, which is undefined, not the derivative. We
           report it as NaN and every window/readout names the undefined state. */
        const duZero = Math.abs(duReal) < 1e-12;
        const ryu = duZero ? NaN : measStep / duReal;
        /* three-layer transfer: x → x² → sin(x²) → e^(sin(x²)) */
        const x = env.x0, dd = env.dd;
        const deepU0 = x * x;
        const deepDU = (x + dd) * (x + dd) - deepU0;
        const deepV0 = Math.sin(deepU0);
        const deepDV = Math.sin(deepU0 + deepDU) - deepV0;
        const deepY0 = Math.exp(deepV0);
        const deepDY = Math.exp(deepV0 + deepDV) - deepY0;
        const deepR1 = 2 * x, deepR2 = Math.cos(deepU0), deepR3 = Math.exp(deepV0);
        /* finite ratios for the three windows, guarded so a zero step in the
           chain never prints a stray number where a derivative is expected */
        const deepR1f = deepDU / dd;
        const deepR2f = Math.abs(deepDU) < 1e-12 ? deepR2 : deepDV / deepDU;
        const deepR3f = Math.abs(deepDV) < 1e-12 ? deepR3 : deepDY / deepDV;
        return {
            u0, y0, dux, dyu, duReal, chainStep, measStep, duZero,
            rux: duReal / dd, ryu, ryx: measStep / dd,
            product: dux * dyu,
            measSlope: derivative(x2 => c.h(c.g(x2)), env.x0),
            deepU0, deepDU, deepV0, deepDV, deepY0, deepDY,
            deepR1, deepR2, deepR3, deepR1f, deepR2f, deepR3f,
            deepYp: Math.exp(Math.sin(x * x)) * Math.cos(x * x) * 2 * x
        };
    },
    panes: {
        main: [
            {
                kind: 'chain',
                title: env => env.deep > 0.5 ? 'Three layers: x → x² → sin(x²) → e^(sin(x²))' : 'The two graphs',
                steps: env => env.deep > 0.5 ? mapSteps3(env) : mapSteps(env),
                focus: env => env.deep > 0.5 ? -1 : (env.link > 2.5 ? -1 : Math.round(env.link) - 1),
                caption: env => {
                    if (env.deep > 0.5) return 'Each window draws one layer in its own units. The rise one layer produces becomes the run the next layer receives, so every local rate along the path rides in the final product.';
                    if (env.stage >= 3) return 'The inner graph turns a step in x into a step in u, and the outer graph turns that step into a step in y. For an infinitesimal change, each local derivative says how that layer scales the change it receives, so the two derivatives multiply. For a visible finite step, a layer secant ratio and its derivative need not match exactly.';
                    return 'The inner graph turns a step in x into a real step in u, and its rise is Δu = g(x + Δx) − g(x). The outer graph receives that same Δu as its run. Read both rates on the windows and answer the question first.';
                }
            },
            {
                kind: 'graph', height: 220, when: env => env.deep < 0.5,
                title: 'The same step on the combined curve',
                window: env => compView(env),
                curves: env => [{ fn: 'comp', color: 'curveA', label: env => 'y = ' + caseOf(env).composed }],
                points: env => [{
                    x: 'x0', fn: 'comp', color: 'accent', r: 6,
                    drag: { key: 'x0', min: -1.6, max: 1.8 },
                    label: env => 'x = ' + n(env.x0)
                }],
                triangle: env => ({
                    fn: 'comp', x1: 'x0', x2: 'x0 + dd', color: 'down',
                    runLabel: env => 'Δx = ' + n(env.dd),
                    riseLabel: env => 'Δy = ' + n(env.measStep)
                }),
                /* the product tangent is the answer, so it only appears after
                   the Predict has been asked and the rule has been boxed */
                tangents: env => (env.stage >= 3 && env.broken < 0.5) ? [{
                    fn: 'comp', x: 'x0', m: 'product', color: 'curveB', reach: 0.3,
                    label: env => 'slope = ' + n(env.measSlope)
                }] : []
            },
            {
                kind: 'eq',
                title: env => env.deep > 0.5 ? 'Three layers in symbols'
                    : env.stage >= 3 ? 'The derivative in symbols'
                        : env.stage >= 1 ? 'Finite ratios on this step'
                            : 'The two local rates',
                lines: env => {
                    const c = caseOf(env);
                    if (env.deep > 0.5) {
                        return [
                            { t: 'x → u = x² → v = sin(x²) → y = e^v', color: 'auxInk' },
                            { t: 'du/dx = 2x = ' + n(env.deepR1) + ',   dv/du = cos(u) = ' + n(env.deepR2) + ',   dy/dv = e^v = ' + n(env.deepR3), color: 'auxInk' },
                            { t: 'dy/dx = (dy/dv) · (dv/du) · (du/dx) = e^(sin(x²)) · cos(x²) · 2x', hl: true, color: 'accent' },
                            { t: 'at x = ' + n(env.x0) + ':   dy/dx = ' + n(env.deepYp), color: 'auxInk' }
                        ];
                    }
                    if (env.stage >= 3) {
                        const L = [
                            { t: 'dy/dx = (dy/du) · (du/dx) = ' + c.factors, hl: true, color: 'accent' },
                            { t: 'du/dx = ' + c.duxExpr + ' = ' + n(env.dux) + ',   dy/du = ' + c.dyuExpr + ' = ' + n(env.dyu), color: 'auxInk' }
                        ];
                        if (env.stage >= 3.5) L.push({ t: 'u = ' + c.inner + '  →  dy/dx = ' + c.substituted });
                        return L;
                    }
                    const L = [
                        { t: 'du/dx = ' + c.duxExpr + ' = ' + n(env.dux), color: 'auxInk' },
                        { t: 'dy/du = ' + c.dyuExpr + ' = ' + n(env.dyu), color: 'auxInk' },
                        { t: 'Δu = g(x + Δx) − g(x) = ' + n(env.duReal) + ',   Δy = h(u + Δu) − h(u) = ' + n(env.measStep) }
                    ];
                    if (env.stage >= 1) {
                        if (env.duZero) {
                            L.push({ t: 'Δu/Δx = ' + n(env.rux) + ',   Δy/Δu = undefined for this finite step,   Δy/Δx = ' + n(env.ryx), color: 'auxInk' });
                            L.push({ t: 'The factorization Δy/Δx = (Δy/Δu) · (Δu/Δx) needs Δu ≠ 0', hl: true });
                        } else {
                            L.push({ t: 'Δu/Δx = ' + n(env.rux) + ',   Δy/Δu = ' + n(env.ryu) + ',   Δy/Δx = ' + n(env.ryx), color: 'auxInk' });
                            L.push({ t: 'Δy/Δx = (Δy/Δu) · (Δu/Δx)', hl: true });
                        }
                    }
                    return L;
                }
            }
        ],
        side: [
            {
                kind: 'readout',
                when: env => env.deep < 0.5,
                title: env => env.broken > 0.5 ? 'The chain with the inner step skipped'
                    : env.stage >= 3 ? 'The rate of the whole chain'
                        : env.stage >= 1 ? 'Finite ratios along the chain'
                            : 'Real steps through the chain',
                items: env => {
                    if (env.broken > 0.5) {
                        return [
                            { label: 'outer layer fed Δx by mistake', v: env.chainStep, big: true, color: 'down' },
                            { label: 'real rise Δy through the chain', v: env.measStep, color: 'accent' }
                        ];
                    }
                    if (env.stage >= 3) {
                        return [
                            { label: 'first rate times second rate', v: env.product, big: true, color: 'accent' },
                            { label: 'slope measured on the curve', v: env.measSlope, color: 'down' }
                        ];
                    }
                    if (env.stage >= 1) {
                        return [
                            { label: 'Δu/Δx', v: env.rux },
                            { label: 'Δy/Δu', v: env.duZero ? 'undefined for this finite step' : env.ryu },
                            { label: 'Δy/Δx', v: env.ryx, big: true, color: 'down' }
                        ];
                    }
                    return [
                        { label: 'step handed to the outer layer Δu', v: env.duReal },
                        { label: 'real rise Δy', v: env.measStep },
                        { label: 'inner rate du/dx', v: env.dux },
                        { label: 'outer rate dy/du', v: env.dyu }
                    ];
                }
            },
            {
                kind: 'note', tone: 'warn', title: 'The first rate is missing',
                when: env => env.broken > 0.5 && env.deep < 0.5,
                text: env => 'The outer graph received Δx = ' + n(env.dd) + ' as its run, but its run should be the real Δu = ' + n(env.duReal) + '. So the chain ends at ' + n(env.chainStep) + ' while the curve actually rises ' + n(env.measStep) + '. The missing factor is Δu/Δx, which is du/dx = ' + n(env.dux) + ' when Δx is small.'
            },
            {
                kind: 'note', tone: 'warn', title: 'When the first rate is near zero',
                when: env => env.broken < 0.5 && env.deep < 0.5 && env.duZero !== true && Math.abs(env.dux) < 0.25,
                text: env => 'Here du/dx = ' + n(env.dux) + ', so the real step in u is only Δu = ' + n(env.duReal) + '. The chain rises only ' + n(env.measStep) + '. The second rate ' + n(env.dyu) + ' cannot act until u changes.'
            },
            {
                kind: 'note', tone: 'warn', title: 'This finite step has Δu = 0',
                when: env => env.duZero === true && env.broken < 0.5 && env.deep < 0.5,
                text: env => 'The step lands on Δu = ' + n(env.duReal) + ', so the outer ratio Δy/Δu has zero on the bottom and is undefined for this finite step. The factorization of finite ratios needs Δu ≠ 0. Move x or the step size a little and the ratio comes back. The derivative dy/du = ' + n(env.dyu) + ' comes from the limiting rates, not by dividing 0 by 0.'
            },
            {
                kind: 'note', title: 'Three layers on one path',
                when: env => env.deep > 0.5,
                text: env => 'Two layers was only the simplest case. Here x passes through x², then sine, then the exponential. The windows chain their real steps together, so the product carries one factor from every layer: dy/dx = e^v · cos(u) · 2x = e^(sin(x²)) · cos(x²) · 2x. At x = ' + n(env.x0) + ' this is ' + n(env.deepYp) + '.'
            },
            {
                kind: 'practice', id: 'u3-chain-transfer', title: 'Name the parts',
                when: env => env.kase === 'expo' && env.deep < 0.5,
                items: [
                    {
                        q: 'In y = e^(sin x), which part is the outer function?',
                        choices: [
                            'e^u. The exponential is applied last, so it is the outer function.',
                            'sin x. It is the part that contains x.',
                            'x. The variable is the outer function.'
                        ], a: 0,
                        whyBy: [
                            'You build sin x first and then put it into the exponential. The exponential is the last step, so it is the outer function.',
                            'sin x is built straight from x, so it is the inner function. The outer function is the last step.',
                            'x is the input to the whole expression. It is not one of the two functions.'
                        ]
                    },
                    {
                        q: 'In y = e^(sin x), which part is the inner function?',
                        choices: [
                            'sin x. It is the expression made directly from x.',
                            'e^u. It is written last in the formula.',
                            'Neither one. This function has only one layer.'
                        ], a: 0,
                        whyBy: [
                            'x goes into sine first, so u = sin x is the quantity that x changes directly.',
                            'e^u is the outer function. The inner function is the expression that feeds it.',
                            'There are two layers here, sin x and then the exponential.'
                        ]
                    },
                    {
                        q: 'Which factors appear in dy/dx for y = e^(sin x)?',
                        choices: [
                            'e^u and cos x. Each function gives one factor.',
                            'e^u only. The outer rule gives the whole derivative.',
                            'cos x only. The inner rule gives the whole derivative.'
                        ], a: 0,
                        whyBy: [
                            'The outer rate is dy/du = e^u and the inner rate is du/dx = cos x, so dy/dx = e^u · cos x.',
                            'That is the outer factor by itself. The rate from x to sin x is still missing.',
                            'That is the inner factor by itself. The exponential still has to be differentiated as the outer function.'
                        ]
                    }
                ]
            }
        ]
    },
    steps: [
        {
            params: { link: 2 },
            message: 'The outer graph shows y against u. It receives the real Δu as its run and answers with the real rise Δy. This rate is written with u instead of x.'
        },
        {
            params: { link: 3 },
            message: 'Both windows are open now. One small change in x passes through the first layer and then through the second layer. The numbers on this screen only describe the two separate layers. Answer the question below before you move on.'
        },
        {
            params: { stage: 1 },
            predict: {
                q: 'Suppose u increases 3 units for every 1 unit that x increases. Suppose y increases 4 units for every 1 unit that u increases. About how much does y increase when x increases by 1 unit?',
                choices: [
                    'About 12 units. The two rates multiply.',
                    'About 7 units. The two rates add.',
                    'About 4 units. Only the second rate counts.'
                ], a: 0,
                whyBy: [
                    'One unit of x makes 3 units of u, and each of those units of u makes 4 units of y. So one unit of x makes 3 · 4 = 12 units of y.',
                    'The two rates do not act side by side. The second rate works on the change in u that the first rate already produced.',
                    'The second rate is only half of the answer. It changes a step in u into a step in y, but x still has to produce that step in u.'
                ]
            },
            message: 'The rates multiply. Look at the real finite changes: Δu/Δx is one ordinary fraction and Δy/Δu is another, and the Δu cancels. So Δy/Δx = (Δy/Δu) · (Δu/Δx) holds exactly for every step where Δu and Δx are both nonzero.'
        },
        {
            params: { dd: 0.005 },
            message: 'Shrink Δx. Now Δu/Δx sits almost on top of du/dx, and Δy/Δu sits almost on top of dy/du. The exact identity for finite ratios is becoming a statement about instantaneous rates.'
        },
        {
            params: { stage: 3 },
            message: 'Let Δx shrink toward 0 and the finite ratios become the derivatives, so dy/dx = (dy/du) · (du/dx). The boxed rule is the chain rule, and the tangent on the combined curve now carries that product. Drag x to watch the two rates and the product move together.'
        },
        {
            params: { dd: 0.18 },
            message: 'Widen the step again. The tangent line and the curve pull apart, so one finite step no longer matches the derivative prediction. The boxed formula still holds, because it speaks about the limit, not about this Δx.'
        },
        {
            params: { kase: 'sine', x0: 1.1, dd: 0.05, stage: 0 },
            message: 'Start over on a new chain, y = sin(x²). The windows show both local rates, and no combination is written anywhere yet. Answer the question on this screen before the rule comes back.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Take y = sin(x²). Differentiating the outer function gives cos(x²). Is that the whole derivative?',
                choices: [
                    'No. The factor from u = x² is still missing.',
                    'Yes. The outer derivative is the whole answer.',
                    'Yes. cos is the derivative of sin.'
                ], a: 0,
                whyBy: [
                    'cos(u) gives the change in sin(u) caused by a change in u. But u = x² also changes as x changes, so its rate 2x belongs in the product.',
                    'Differentiating the outer function gives one factor, not the whole derivative. The inner rate is still missing.',
                    'That rule covers the outer function only. Here sine receives x² instead of x, so a second factor is needed.'
                ]
            },
            message: 'This chain is x → u = x² → y = sin u. Both rates must appear in the product, so dy/dx = cos(x²) · 2x.'
        },
        {
            params: { x0: 0 },
            message: 'Move to x = 0. The first rate du/dx = 2x is 0, so the product is 0. The second rate cos(0) = 1 is unchanged, but it is multiplied by 0.'
        },
        {
            params: { kase: 'power', x0: 0.8, dd: 0.05, broken: 1, link: 1 },
            message: 'Now cut the inner layer out. The outer graph receives Δx as its run instead of the real Δu, so the chain lands far below the rise of the curve. The note lists the two numbers and names the missing factor.'
        },
        {
            params: { broken: 0, link: 3, stage: 3.5 },
            message: 'Turn the first rate back on and the two numbers agree again. Substituting u = 3x² + 1 turns 4u³ · 6x into 4(3x² + 1)³ · 6x.'
        },
        {
            params: { kase: 'expo', x0: 1, dd: 0.005, link: 3 },
            message: 'Now try a different chain, x → u = sin x → y = e^u. Then answer the three questions under "Name the parts".'
        },
        {
            params: { deep: 1 },
            message: 'Finally, three layers on one path: x → u = x² → v = sin(x²) → y = e^(sin(x²)). Each window hands its real rise to the next window as its run, so the product carries one factor from every layer: dy/dx = e^(sin(x²)) · cos(x²) · 2x.'
        }
    ],
    summary: {
        idea: 'In a composite function, a change passes through two or more layers. Each layer multiplies the step it receives by its own local rate, so the chain rule is the product of every local rate along the path.',
        mistake: 'Differentiating only the outer function. For (3x² + 1)⁴ this gives 4(3x² + 1)³ and drops the factor 6x from the inner derivative.',
        transfer: 'The last screen chains three layers, x → x² → sin(x²) → e^(sin(x²)), with local rates 2x, cos(u) and e^v. Read off dy/dx = e^(sin(x²)) · cos(x²) · 2x, then try ln(cos x) on paper with the same layer questions.'
    }
};

/* ---------------------------------------------------------------------------
   v1 layout, kept until the chain-strip version is confirmed working for you.
   It was: machine card (three boxes with live rates) as the dominant element,
   then two 190px layer graphs with independent auto-scaled windows, then a
   4-line equation card, with a 4-row readout, a broken-link compare and a
   stalled-link note in the side column. Replace by moving this back into
   panes.main / panes.side and restoring the 12-step run.
   main: [ { kind:'machine', stages: x → u → y with rate on each stage },
           { kind:'graph', title:'inner link: u against x', window: localView(g, x0, 1.1), tangents:[m = gp(x0)] },
           { kind:'graph', title:'outer link: y against u', window: localView(h, u0, span), tangents:[m = hp(u0)] },
           { kind:'eq', lines: chainLines(env) by stage 0-4 } ]
   side: [ { kind:'readout', 4 rows: du/dx, dy/du, product, measured slope },
           { kind:'compare', wrong 4u³ vs right 4u³ · 6x, when broken },
           { kind:'note', warn, when |du/dx| < 0.25 },
           { kind:'practice', the same three naming questions } ]
   --------------------------------------------------------------------------- */
