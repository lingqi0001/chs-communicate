/* 3.1 Chain Rule Layers — one draggable object: the point on the curve. The hero
   is a linked interval map: two small windows, each drawn in its own units, where
   the rise the inner layer produces is literally the run the outer layer is given.
   That hinge is why the rates multiply. Text is deliberately minimal. */

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
   the run the outer layer gets. That hinge is the chain rule. */
function mapSteps(env) {
    const c = caseOf(env);
    const broken = env.broken > 0.5;
    const run2 = broken ? env.dd : env.duStep;
    return [
        {
            name: 'inner: u against x', axis: 'x', fn: 'g', color: 'curveC',
            center: env.x0, half: span(env.dd, env.x0), band: env.dd,
            bandLabel: 'run Δx = ' + n(env.dd),
            riseLabel: 'rise Δu = ' + n(env.duStep),
            hinge: broken ? ['using Δx', 'not Δu'] : ['Δu = ' + n(env.duStep), 'is the next run'],
            gain: '× ' + n2(env.dux)
        },
        {
            name: 'outer: y against u', axis: 'u', fn: 'h', color: 'curveB',
            center: env.u0, half: span(run2, env.u0), band: run2,
            bandLabel: broken ? 'run is Δx = ' + n(run2) : 'run Δu = ' + n(run2),
            riseLabel: 'rise Δy = ' + n(env.chainStep),
            gain: broken ? '× ' + n2(env.dyu) + ' only' : '× ' + n2(env.dyu)
        }
    ];
}

export default {
    id: 'u3-chain-rule',
    meta: { unit: 3, topic: '3.1', title: 'The Chain Rule', visualizerTitle: 'Chain Rule Layers' },
    intro: 'Drag the point on the curve. The inner graph changes a step in x into a step in u. The outer graph changes that step in u into a step in y.',
    params: { kase: 'power', x0: 0.8, dd: 0.005, link: 3, stage: 0, broken: 0 },
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
        comp: (x, env) => comp(env, x)
    },
    compute: (env) => {
        const c = caseOf(env);
        const u0 = c.g(env.x0);
        const dux = c.gp(env.x0), dyu = c.hp(u0);
        const duStep = dux * env.dd;
        return {
            u0, y0: c.h(u0), dux, dyu, duStep,
            product: dux * dyu,
            chainStep: env.broken > 0.5 ? dyu * env.dd : dyu * duStep,
            measStep: c.h(c.g(env.x0 + env.dd)) - c.h(u0),
            measSlope: derivative(x => c.h(c.g(x)), env.x0)
        };
    },
    panes: {
        main: [
            {
                kind: 'chain', title: env => 'The two graphs',
                steps: env => mapSteps(env),
                focus: env => env.link > 2.5 ? -1 : Math.round(env.link) - 1,
                caption: 'The inner graph shows u against x, and its rise is Δu. The outer graph shows y against u, and it uses that Δu as its run. Each graph multiplies its own run by its own rate, so the two rates multiply.'
            },
            {
                kind: 'graph', height: 220, title: 'The same step on the combined curve',
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
                tangents: env => [{
                    fn: 'comp', x: 'x0', m: 'product', color: 'curveB', reach: 0.3,
                    label: env => 'slope = ' + n(env.measSlope)
                }]
            },
            {
                kind: 'eq', title: env => 'The derivative in symbols',
                lines: env => {
                    const c = caseOf(env);
                    const L = [
                        { t: 'dy/dx = (dy/du) · (du/dx) = ' + c.factors, hl: env.stage < 1.5 },
                        { t: 'du/dx = ' + c.duxExpr + ' = ' + n(env.dux) + ',   dy/du = ' + c.dyuExpr + ' = ' + n(env.dyu), color: 'auxInk' }
                    ];
                    if (env.stage > 0.5) L.push({ t: 'u = ' + c.inner + '  →  dy/dx = ' + c.substituted, hl: true, color: 'accent' });
                    return L;
                }
            }
        ],
        side: [
            {
                kind: 'readout', title: 'The rate of the whole chain',
                items: env => [
                    { label: env.broken > 0.5 ? 'the outer rate by itself' : 'first rate times second rate', v: env.broken > 0.5 ? env.dyu : env.product, big: true, color: 'accent' },
                    { label: 'slope measured on the curve', v: env.measSlope, color: 'down' }
                ]
            },
            {
                kind: 'note', tone: 'warn', title: 'The first rate is missing',
                when: env => env.broken > 0.5,
                text: env => 'The outer graph used Δx as its run, but its run should be Δu. So the chain ends at ' + n(env.chainStep) + ' while the curve actually rises ' + n(env.measStep) + '. The missing factor is du/dx = ' + n(env.dux) + '.'
            },
            {
                kind: 'note', tone: 'warn', title: 'When the first rate is near zero',
                when: env => env.broken < 0.5 && Math.abs(env.dux) < 0.25,
                text: env => 'Here du/dx = ' + n(env.dux) + ', so the step in u is almost nothing. The chain gives only ' + n(env.chainStep) + '. The second rate ' + n(env.dyu) + ' cannot act until u changes.'
            },
            {
                kind: 'practice', id: 'u3-chain-transfer', title: 'Name the parts',
                when: env => env.kase === 'expo',
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
            params: { link: 1 },
            message: 'Drag x. The inner graph shows u against x, and the rate beside it is du/dx. Each step in x gives that many steps in u.'
        },
        {
            params: { link: 2 },
            message: 'The outer graph shows y against u. Each step in u gives that many steps in y, and this rate is written with u instead of x.'
        },
        {
            params: { link: 3, stage: 1 },
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
            message: 'The two rates act one after the other. A step in x becomes a step in u, and that step in u becomes a step in y. So the rates multiply.'
        },
        {
            params: { dd: 0.18 },
            message: 'Increase the step size. The tangent line and the curve now separate, so the predicted step no longer matches the actual step on the curve.'
        },
        {
            params: { dd: 0.005 },
            message: 'Reduce the step size again. Now the tangent line and the curve almost coincide. This is the point where dy/dx becomes an accurate instantaneous rate.'
        },
        {
            params: { kase: 'sine', x0: 1.1, dd: 0.05, stage: 0 },
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
            params: { kase: 'power', x0: 0.8, broken: 1, link: 1 },
            message: 'Now skip the inner rate. The outer graph uses Δx as its run instead of Δu. The predicted step is then short by the factor du/dx = 6x.'
        },
        {
            params: { broken: 0, link: 3, stage: 1 },
            message: 'Turn the first rate back on and the two numbers agree again. Substituting u = 3x² + 1 turns 4u³ · 6x into 4(3x² + 1)³ · 6x.'
        },
        {
            params: { kase: 'expo', x0: 1, stage: 0, link: 3 },
            message: 'Now try a different chain, x → u = sin x → y = e^u. Then answer the three questions under "Name the parts".'
        }
    ],
    summary: {
        idea: 'In a composite function, a change passes through two or more layers. The chain rule multiplies the rate of each layer along that path.',
        mistake: 'Differentiating only the outer function. For (3x² + 1)⁴ this gives 4(3x² + 1)³ and drops the factor 6x from the inner derivative.',
        transfer: 'Switch to e^(sin x) and answer the three questions under "Name the parts". Then try ln(cos x) on paper with the same three questions.'
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
