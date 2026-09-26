/* 1.12 Interval Continuity Scanner — "continuous on an interval" means no
   failure at ANY point of it. Domain restrictions draw the fences.
   The scanner (slider s) walks along x; a potential break is only marked
   on the graph and the number line AFTER the scanner has investigated it. */

const CASES = {
    rational: {
        label: '1/(x − 2)', window: [-4, 8, -3, 3],
        curves: [{ fn: '1/(x-2)', from: -4, to: 1.9, samples: 400, color: 'curveA' }, { fn: '1/(x-2)', from: 2.1, to: 8, samples: 400, color: 'curveA' }],
        blocks: [2], fenceNote: 'The function 1/(x − 2) has no value at x = 2. The outputs grow without bound there: the left side falls to −∞ and the right side rises to +∞. An interval that contains x = 2 cannot be continuous.',
        nlWindow: [-4, 8],
        f: x => 1 / (x - 2)
    },
    radical: {
        label: '√(x + 1)', window: [-3, 8, -0.5, 3.5],
        curves: [{ fn: 'sqrt(x+1)', from: -1, to: 8, color: 'curveA' }],
        blocks: [], fenceNote: 'The radical √(x + 1) is defined only for x ≥ −1. At every point of that domain the graph is unbroken. Left of x = −1 no function value exists, so continuity is not a question there.',
        nlWindow: [-3, 8], edge: -1,
        f: x => Math.sqrt(x + 1)
    },
    log: {
        label: 'ln x', window: [-1, 8, -3, 3],
        curves: [{ fn: 'ln(x)', from: 0.02, to: 8, color: 'curveA' }],
        blocks: [0], fenceNote: 'The domain of ln x is x > 0. At x = 0 the outputs fall without bound, so the graph has a vertical asymptote there. At every point of its domain ln x is continuous.',
        nlWindow: [-1, 8], edge: 0,
        f: x => Math.log(x)
    },
    piece: {
        label: 'x + 1 or x²', window: [-3, 4, -1, 5],
        curves: [{ fn: 'x+1', from: -3, to: 0.98, color: 'curveA', label: 'x + 1' }, { fn: 'x^2', from: 1.02, to: 4, color: 'curveA', label: 'x²' }],
        blocks: [1], fenceNote: 'The piecewise function has a jump at x = 1. The branch x + 1 approaches 2 from the left, and the branch x² approaches 1 from the right. The function has a value at x = 1, so this break sits inside the domain.',
        nlWindow: [-3, 4],
        f: x => x < 1 ? x + 1 : x * x
    },
    quad: {
        label: '1/(x² − 9)', window: [-4, 8, -3, 3],
        curves: [
            { fn: '1/(x^2-9)', from: -4, to: -3.06, samples: 400, color: 'curveA' },
            { fn: '1/(x^2-9)', from: -2.94, to: 2.94, samples: 400, color: 'curveA' },
            { fn: '1/(x^2-9)', from: 3.06, to: 8, samples: 400, color: 'curveA' }
        ],
        blocks: [-3, 3],
        fenceNote: 'The denominator x² − 9 factors as (x − 3)(x + 3). The function has no value at x = −3 and at x = 3, so the graph splits into three pieces. Each of the three pieces is continuous on its own.',
        nlWindow: [-4, 8],
        f: x => 1 / (x * x - 9)
    }
};

/* One live probe reading: where the scanner sits, what f says there, and a
   verdict text that never contradicts the graph. */
function scanReport(env) {
    const c = CASES[env.kase];
    const s = env.s;
    const y = env.f(s);
    const onBlock = c.blocks.some(b => Math.abs(s - b) < 0.05);
    let text;
    if (c.edge !== undefined && s < c.edge - 1e-9) text = 'Below the domain edge no function value exists.';
    else if (onBlock && Number.isFinite(y)) text = 'Jump break: the two sides approach different values.';
    else if (onBlock) text = 'Break: no value exists here and the outputs grow without bound.';
    else if (c.edge !== undefined && Math.abs(s - c.edge) < 0.05) text = 'Domain edge: continuous from the inside only.';
    else if (!Number.isFinite(y)) text = 'No value exists here, so continuity fails at this point.';
    else text = 'Continuous at this point.';
    const ok = text === 'Continuous at this point.' || text === 'Domain edge: continuous from the inside only.';
    return { y, text, ok };
}

export default {
    id: 'u1-continuity-interval',
    meta: { unit: 1, topic: '1.12', title: 'Confirming Continuity over an Interval', visualizerTitle: 'Interval Continuity Scanner' },
    intro: 'To claim continuity on an interval, walk the scanner along x and read the function value at each point. The scanner marks a break only after it reaches that break. The report names the first point where continuity fails, or certifies the whole interval.',
    params: { kase: 'rational', p: -2, q: 1, s: -2 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        },
        { key: 'p', label: 'interval left end', min: -4, max: 7, step: 0.1 },
        { key: 'q', label: 'interval right end', min: -3, max: 8, step: 0.1 },
        { key: 's', label: 'scanner position', min: -4, max: 8, step: 0.1 }
    ],
    fns: {
        f: (x, env) => CASES[env.kase].f(x)
    },
    compute: env => {
        const c = CASES[env.kase];
        const rep = scanReport(env);
        const w = c.window.slice();
        if (Number.isFinite(rep.y)) {
            const pad = 0.15 * (w[3] - w[2]);
            w[2] = Math.min(w[2], rep.y - pad);
            w[3] = Math.max(w[3], rep.y + pad);
        }
        w[0] = Math.min(w[0], env.s - 0.5);
        w[1] = Math.max(w[1], env.s + 0.5);
        return { scanY: rep.y, scanText: rep.text, scanOk: rep.ok, win: w };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'y = ' + CASES[env.kase].label, height: 330,
                window: env => env.win,
                curves: env => CASES[env.kase].curves,
                vband: env => [{ from: Math.min(env.p, env.q), to: Math.max(env.p, env.q), color: 'fillA' }],
                vlines: env => CASES[env.kase].blocks.filter(b => env.s >= b - 0.001).map(b => ({ x: b, color: 'down', label: 'break scanned' })),
                points: env => Number.isFinite(env.scanY)
                    ? [{ x: env.s, y: env.scanY, color: 'accent', label: 'scanner', r: 6 }]
                    : []
            },
            {
                kind: 'numberline', title: 'Domain, proposed interval, and scanner',
                window: env => {
                    const w = CASES[env.kase].nlWindow.slice();
                    w[0] = Math.min(w[0], env.s);
                    w[1] = Math.max(w[1], env.s);
                    return w;
                },
                bands: env => {
                    const c = CASES[env.kase];
                    const out = [];
                    if (c.edge !== undefined) out.push({ from: c.edge + 0.001, to: c.nlWindow[1], color: 'auxInk', label: 'domain' });
                    out.push({ from: Math.min(env.p, env.q), to: Math.max(env.p, env.q), color: 'accent', label: 'proposal' });
                    return out;
                },
                probes: env => [{ x: env.s, color: 'accent', label: 'scanner' }]
                    .concat(CASES[env.kase].blocks.filter(b => env.s >= b - 0.001).map(b => ({ x: b, color: 'down', label: 'break' })))
                    .concat(CASES[env.kase].edge !== undefined ? [{ x: CASES[env.kase].edge, color: 'aux', label: 'domain edge' }] : [])
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Scanner reading',
                items: env => [
                    { label: 'at x =', v: env.s, digits: 1 },
                    {
                        label: 'value of f(x)',
                        v: Number.isFinite(env.scanY) ? env.scanY : 'no function here',
                        color: env => (Number.isFinite(env.scanY) ? 'ink' : 'down')
                    },
                    {
                        label: 'scanner report',
                        v: env.scanText,
                        color: env => (env.scanOk ? 'up' : 'down')
                    }
                ]
            },
            {
                kind: 'checklist', title: 'Scan report',
                items: env => {
                    const c = CASES[env.kase];
                    const [lo, hi] = [Math.min(env.p, env.q), Math.max(env.p, env.q)];
                    const inside = c.blocks.filter(b => b > lo && b < hi);
                    const outOfDomain = c.edge !== undefined && lo < c.edge;
                    return [
                        { t: 'The proposal is [' + round1(lo) + ', ' + round1(hi) + ']', state: 'na' },
                        { t: inside.length ? 'The first continuity failure sits at x = ' + inside[0] : 'No break lies inside the proposed interval', state: inside.length ? 'fail' : 'pass' },
                        { t: outOfDomain ? 'The left end leaves the domain at x = ' + round1(c.edge) + '.' : 'The interval lies inside the domain throughout', state: outOfDomain ? 'fail' : 'pass' }
                    ];
                },
                verdict: env => {
                    const c = CASES[env.kase];
                    const [lo, hi] = [Math.min(env.p, env.q), Math.max(env.p, env.q)];
                    const inside = c.blocks.filter(b => b > lo && b < hi);
                    const outOfDomain = c.edge !== undefined && lo < c.edge;
                    return inside.length || outOfDomain ? 'Not continuous on this interval.' : 'Continuous at every point inside the interval.';
                },
                verdictOk: env => {
                    const c = CASES[env.kase];
                    const [lo, hi] = [Math.min(env.p, env.q), Math.max(env.p, env.q)];
                    return c.blocks.filter(b => b > lo && b < hi).length === 0 && !(c.edge !== undefined && lo < c.edge);
                }
            },
            { kind: 'note', title: 'Why these breaks exist', text: env => CASES[env.kase].fenceNote }
        ]
    },
    steps: [
        {
            params: { kase: 'rational', p: -3, q: 1, s: 0 },
            message: 'The proposal [−3, 1] stops just before the break at x = 2. Scan it and the report certifies continuity. The function 1/(x − 2) is a rational function, and a rational function is continuous wherever it is defined.'
        },
        {
            params: { p: -1, q: 5, s: 2 },
            predict: {
                q: 'The proposal now runs from −1 to 5, so it covers x = 2. Can one continuous interval reach across x = 2?',
                choices: ['No. The domain has no value at x = 2, so continuity fails at that point inside the interval.', 'Yes. A rational function is continuous wherever it is defined, and this function is defined on both sides.', 'Yes. The interval stays continuous once you skip the gap at x = 2 and keep both ends.'], a: 0,
                why: 'Continuity on an interval is a claim about every single point in it. The interval [−1, 5] contains x = 2, where 1/(x − 2) has no value. Continuity fails at that point, so the interval claim fails too.'
            },
            message: 'Move the right end past x = 2 and watch the scan report change. The scanner now sits on the break, and only now does the graph mark that break.'
        },
        { params: { p: 3, q: 7, s: 5 }, message: 'Start again on the safe side with the proposal [3, 7], and the report certifies it. The phrase "continuous on its domain" means continuous on each separate piece of that domain.' },
        {
            params: { kase: 'radical', p: -2, q: 3, s: -2 },
            predict: {
                q: 'The function √(x + 1) has no value left of x = −1, and the proposal starts at −2. What is wrong with the interval [−2, 3]?',
                choices: ['Nothing can be tested left of x = −1, because √(x + 1) has no value there.', 'The graph has a vertical asymptote at x = −1, so the interval fails at that one point.', 'The interval [−2, 3] is correct, because √(x + 1) has no break anywhere on the line.'], a: 0,
                why: 'Continuity can only be discussed where the function has a value. The proposed interval must lie inside the domain before any break is checked.'
            },
            message: 'The scanner sits left of the domain edge, and its reading says no function value exists there. Move the left end to exactly x = −1 and think about that endpoint. On a closed interval the course only asks for continuity from the inside at an endpoint.'
        },
        { params: { p: -1, q: 3, s: -1 }, message: 'Now the interval starts at the domain edge and runs right, so the report certifies it. The scanner reading at x = −1 states the reason plainly: continuous from the inside only. That is exactly what a closed interval endpoint needs.' },
        { params: { kase: 'log', p: 0.5, q: 6, s: 2 }, message: 'For ln x the domain edge is x = 0, and the graph has a vertical asymptote there. A proposal must start strictly inside the domain, so any left end greater than 0 is safe. Scan left toward x = 0 to reach that asymptote.' },
        { params: { kase: 'piece', p: -2, q: 3, s: 1 }, message: 'This piecewise function has a value at every point of its domain. The scanner at x = 1 still reports a break, because the two branches approach different heights. A missing value and a jump are two different failures.' },
        {
            params: { kase: 'quad', p: -4, q: 8, s: -4 },
            predict: {
                q: 'Now transfer inside the tool. For f = 1/(x² − 9), move the scanner right until every break has been marked. On how many separate pieces is this function continuous?',
                choices: ['Three pieces. The pieces are left of x = −3, between x = −3 and x = 3, and right of x = 3.', 'Two pieces. Only the far left side and the far right side of x = 3 count.', 'One piece. The function is rational, so it is continuous on the whole number line.'], a: 0,
                why: 'The denominator x² − 9 equals (x − 3)(x + 3). The function has no value at x = −3 and x = 3, so its domain is three separate pieces. Each open piece is continuous, because a rational function is continuous wherever it is defined.'
            },
            message: 'Move the scanner to the right until both breaks have been scanned. Certify one maximal piece at a time, with both ends inside that piece. The three proposals are [−4, −3.1], [−2.9, 2.9], and [3.1, 8].'
        }
    ],
    summary: {
        idea: 'Continuous on an interval means continuous at every single point of that interval. Standard elementary functions are continuous wherever they are defined. The domain sets the boundaries, and a jump or an asymptote breaks the interval where it occurs.',
        mistake: 'Students read the words polynomial or rational as continuous on the whole number line. A rational function is continuous only on its own domain, and that domain can split into several separate pieces.',
        transfer: 'Open the 1/(x² − 9) case in the function picker and scan until both breaks show on the graph. Then mark the maximal intervals of continuity with the two interval sliders, and name which continuity condition fails at each break.'
    }
};

function round1(v) { return String(Math.round(v * 10) / 10); }
