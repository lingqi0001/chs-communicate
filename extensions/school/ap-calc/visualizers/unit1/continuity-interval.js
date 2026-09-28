/* 1.12 Interval Continuity Checker - an interval holds infinitely many points,
   so no list of sampled points can certify one. Standard elementary functions
   are already continuous at every point of their own domain, so the check is
   structural: name the domain pieces and the excluded points, then test the
   proposed interval against them and settle any included endpoint separately.
   The number line carries that reasoning, and the graph is a second look. */

const CASES = {
    rational: {
        label: '1/(x − 2)', window: [-4, 8, -3, 3],
        curves: [{ fn: '1/(x-2)', from: -4, to: 1.9, samples: 400, color: 'curveA' }, { fn: '1/(x-2)', from: 2.1, to: 8, samples: 400, color: 'curveA' }],
        /* the domain is the whole line except the listed points */
        excl: [2],
        fenceNote: 'The function 1/(x − 2) has no value at x = 2. The outputs grow without bound there: the left side falls to −∞ and the right side rises to +∞. An interval that contains x = 2 cannot be continuous.',
        nlWindow: [-4, 8],
        f: x => 1 / (x - 2)
    },
    radical: {
        label: '√(x + 1)', window: [-3, 8, -0.5, 3.5],
        curves: [{ fn: 'sqrt(x+1)', from: -1, to: 8, color: 'curveA' }],
        /* the domain is x ≥ −1, and the edge −1 belongs to it */
        excl: [], domFrom: -1, domEdgeIncluded: true,
        fenceNote: 'The radical √(x + 1) is defined only for x ≥ −1, and x = −1 belongs to that domain. At every point of the domain the graph is unbroken. Left of x = −1 no function value exists, so continuity is not a question there. A closed interval may end at x = −1, because a closed endpoint only needs continuity from the inside.',
        nlWindow: [-3, 8],
        f: x => Math.sqrt(x + 1)
    },
    log: {
        label: 'ln x', window: [-1, 8, -3, 3],
        curves: [{ fn: 'ln(x)', from: 0.02, to: 8, color: 'curveA' }],
        /* the domain is x > 0, and the edge 0 does NOT belong to it */
        excl: [], domFrom: 0, domEdgeIncluded: false,
        fenceNote: 'The domain of ln x is x > 0, and x = 0 is not in that domain. At x = 0 the outputs fall without bound, so the graph has a vertical asymptote there. At every point of its domain ln x is continuous, so a proposed interval must start to the right of x = 0.',
        nlWindow: [-1, 8],
        f: x => Math.log(x)
    },
    piece: {
        label: 'x + 1 or x²', window: [-3, 4, -1, 5],
        curves: [{ fn: 'x+1', from: -3, to: 0.98, color: 'curveA', label: 'x + 1' }, { fn: 'x^2', from: 1.02, to: 4, color: 'curveA', label: 'x²' }],
        /* every x has a value, and x = 1 is a jump between the two pieces */
        excl: [1],
        fenceNote: 'The piecewise function has a value at every x, and it has a jump at x = 1. The branch x + 1 approaches 2 from the left, and the branch x² approaches 1 from the right. This break sits inside the domain, so an interval that covers x = 1 fails even though both sides have values.',
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
        excl: [-3, 3],
        fenceNote: 'The denominator x² − 9 factors as (x − 3)(x + 3). The function has no value at x = −3 and at x = 3, so the domain splits into three pieces. Each of the three pieces is continuous on its own.',
        nlWindow: [-4, 8],
        f: x => 1 / (x * x - 9)
    }
};

const EPS = 1e-9;

/* Is there a function value at this single point, taking the domain edge and
   its inclusion straight from the case metadata? */
function hasValue(c, x) {
    if (c.domFrom !== undefined && x < c.domFrom - EPS) return false;
    if (c.domFrom !== undefined && Math.abs(x - c.domFrom) < EPS && !c.domEdgeIncluded) return false;
    return Number.isFinite(c.f(x));
}

/* A closed interval only asks an endpoint to behave from the side the interval
   approaches it from, so dir is +1 at the left end and −1 at the right end. */
function fromInside(c, pt, dir) {
    const inside = c.f(pt + dir * 1e-6);
    return Number.isFinite(inside) && Math.abs(inside - c.f(pt)) < 1e-2;
}

function isSpecial(c, x) {
    if (c.domFrom !== undefined && Math.abs(x - c.domFrom) < EPS) return true;
    return (c.excl || []).some(b => Math.abs(x - b) < EPS);
}

/* The three structural tests. Each row names something on the number line: the
   domain band, an excluded point marker, a domain edge marker, or one of the
   two arrows that mark the ends of the proposal. */
function classify(c, lo, hi) {
    const edge = c.domFrom;
    const atEdge = x => edge !== undefined && Math.abs(x - edge) < EPS;

    let domOk = true, domText;
    if (edge === undefined) {
        domText = 'The domain is the whole number line here, so the proposal lies inside the domain.';
    } else if (lo > edge + EPS || (atEdge(lo) && c.domEdgeIncluded)) {
        domText = 'The whole proposal lies inside the domain, which starts at x = ' + round1(edge) + '.';
    } else {
        domOk = false;
        domText = 'The proposal leaves the domain at its left end x = ' + round1(lo) + ', because the domain starts at x = ' + round1(edge) + '.';
    }

    /* only a break strictly between the ends can be crossed, and an end that
       touches a break is settled by test 3 */
    const crossed = (c.excl || []).filter(b => b > lo + EPS && b < hi - EPS);
    const breakOk = crossed.length === 0;
    const breakText = breakOk
        ? 'No excluded point and no piece break lies strictly inside the proposal.'
        : 'The proposal crosses the break at x = ' + round1(crossed[0]) + ', so it reaches across two pieces.';

    const endFail = [];
    const endNote = [];
    const pointEnds = hi - lo < EPS ? [{ pt: lo, dir: 1 }] : [{ pt: lo, dir: 1 }, { pt: hi, dir: -1 }];
    pointEnds.forEach(e => {
        const name = 'x = ' + round1(e.pt);
        if (!hasValue(c, e.pt)) { endFail.push(name + ' has no function value'); return; }
        if (hi - lo > EPS && !fromInside(c, e.pt, e.dir)) { endFail.push(name + ' has a value, but the branch inside the proposal does not continue through it'); return; }
        if (isSpecial(c, e.pt)) {
            endNote.push(atEdge(e.pt)
                ? name + ' belongs to the domain, and the proposal is continuous there from the inside'
                : name + ' keeps the value the inside branch carries');
        }
    });
    const endOk = endFail.length === 0;
    let endText;
    if (!endOk) endText = 'An endpoint fails: ' + endFail.join(', ') + '.';
    else if (endNote.length) endText = 'Each end has a value, and an end on the boundary needs only the inside side. ' + endNote[0] + '.';
    else endText = 'Each end has a function value, and it continues from inside the proposal.';

    const ok = domOk && breakOk && endOk;
    const span = '[' + round1(lo) + ', ' + round1(hi) + ']';
    return {
        ok,
        text: ok
            ? 'Continuous on ' + span + '. The proposal lies in one piece of the domain, and each end carries the value the inside of the interval gives it.'
            : 'Not continuous on ' + span + '. Read the failing row for the reason.',
        rows: [
            { t: '1. Inside the domain: ' + domText, state: domOk ? 'pass' : 'fail' },
            { t: '2. No break crossed: ' + breakText, state: breakOk ? 'pass' : 'fail' },
            { t: '3. Endpoints from the inside: ' + endText, state: endOk ? 'pass' : 'fail' }
        ]
    };
}

/* The domain drawn as the pieces it really has. An excluded point opens a
   small gap on both sides of itself, and an excluded domain edge opens the
   start of the band, so √(x + 1) and ln x look different. */
function domainMarks(c) {
    const a = c.nlWindow[0], b = c.nlWindow[1];
    const inset = (b - a) * 0.012;
    const start = c.domFrom !== undefined ? c.domFrom + (c.domEdgeIncluded ? 0 : inset) : a;
    const cuts = (c.excl || []).filter(x => x > start && x < b).sort((m, n) => m - n);
    const bounds = [start].concat(cuts).concat([b]);
    const out = [];
    for (let i = 0; i + 1 < bounds.length; i++) {
        const from = i === 0 ? bounds[0] : bounds[i] + inset;
        const to = i + 2 === bounds.length ? bounds[i + 1] : bounds[i + 1] - inset;
        out.push({ from, to, color: 'auxInk', label: i === 0 ? 'domain' : '' });
    }
    return out;
}

function gapMarks(c) {
    const out = (c.excl || []).map(b => ({
        x: b, color: 'down',
        label: Number.isFinite(c.f(b)) ? 'break at x = ' + round1(b) : 'no value at x = ' + round1(b)
    }));
    if (c.domFrom !== undefined) {
        out.push({
            x: c.domFrom, color: c.domEdgeIncluded ? 'aux' : 'down',
            label: (c.domEdgeIncluded ? 'domain edge at x = ' : 'no value at x = ') + round1(c.domFrom)
        });
    }
    return out;
}

export default {
    id: 'u1-continuity-interval',
    meta: { unit: 1, topic: '1.12', title: 'Confirming Continuity over an Interval', visualizerTitle: 'Interval Continuity Scanner' },
    intro: 'An interval holds infinitely many points, so checking a list of points proves nothing. Standard elementary functions are already continuous at every point of their own domain, which makes the work structural. Read the domain band, the excluded points and the domain edge on the number line, then set the two ends of the proposal and test it against them.',
    params: { kase: 'rational', p: -2, q: 1 },
    controls: [
        {
            key: 'kase', label: 'function', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        },
        { key: 'p', label: 'interval left end', min: -4, max: 7, step: 0.1 },
        { key: 'q', label: 'interval right end', min: -3, max: 8, step: 0.1 }
    ],
    fns: {
        f: (x, env) => CASES[env.kase].f(x)
    },
    compute: env => {
        const c = CASES[env.kase];
        const lo = Math.min(env.p, env.q), hi = Math.max(env.p, env.q);
        return { lo, hi, chk: classify(c, lo, hi), marks: domainMarks(c).concat([{ from: lo, to: hi, color: 'accent', label: 'proposal' }]), gaps: gapMarks(c) };
    },
    panes: {
        main: [
            {
                kind: 'numberline', title: 'Domain, breaks, and your proposal',
                window: env => {
                    const w = CASES[env.kase].nlWindow.slice();
                    w[0] = Math.min(w[0], env.lo);
                    w[1] = Math.max(w[1], env.hi);
                    return w;
                },
                bands: env => env.marks,
                probes: env => [{ x: env.lo, color: 'accent', label: 'left end' }, { x: env.hi, color: 'accent', label: 'right end' }]
            },
            {
                kind: 'checklist', title: env => 'Tests for [' + round1(env.lo) + ', ' + round1(env.hi) + ']',
                items: env => env.chk.rows,
                verdict: env => env.chk.text,
                verdictOk: env => env.chk.ok
            },
            {
                kind: 'graph', title: env => 'y = ' + CASES[env.kase].label + ', second look', height: 320,
                window: env => CASES[env.kase].window,
                curves: env => CASES[env.kase].curves,
                vband: env => [{ from: env.lo, to: env.hi, color: 'fillA' }],
                vlines: env => env.gaps.map(m => ({ x: m.x, color: m.color, label: m.label }))
            },
            { kind: 'note', title: 'Why these breaks exist', text: env => CASES[env.kase].fenceNote },
            {
                kind: 'eq', title: 'Maximal intervals of continuity', when: env => env.kase === 'quad',
                lines: () => [
                    { t: 'The domain of 1/(x² − 9) splits at x = −3 and at x = 3.' },
                    { t: 'Maximal intervals of continuity: (−∞, −3), (−3, 3), (3, ∞).', color: 'up' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { kase: 'rational', p: -3, q: 1 },
            message: 'The domain band shows where this function has values, and the red marker at x = 2 shows the one point it lacks. Your proposal is the band underneath, and the tests read the two bands against each other. The proposal [−3, 1] stops before x = 2, so all three tests pass.'
        },
        {
            params: { p: -1, q: 5 },
            predict: {
                q: 'The proposal now runs from −1 to 5, so it covers x = 2. Can one continuous interval reach across x = 2?',
                choices: ['No. The domain has no value at x = 2, so continuity fails at that point inside the interval.', 'Yes. A rational function is continuous wherever it is defined, and this function is defined on both sides.', 'Yes. The interval stays continuous once you skip the gap at x = 2 and keep both ends.'], a: 0,
                why: 'Continuity on an interval is a claim about every single point in it. The interval [−1, 5] contains x = 2, where 1/(x − 2) has no value. Continuity fails at that point, so the interval claim fails too.'
            },
            message: 'The two arrows sit at the ends of the proposal, so you can see the band swallow the marker at x = 2. Test 2 fails, because that break now lies strictly inside the interval.'
        },
        {
            params: { p: 2, q: 5 },
            predict: {
                q: 'The proposal [2, 5] starts exactly on the break at x = 2, so no break lies strictly inside it. Does this interval pass the three tests?',
                choices: ['No. Test 3 fails, because an endpoint must have a function value and f(2) has none.', 'Yes. Test 2 finds no break strictly inside, so the interval is continuous.', 'Yes. Dropping the left endpoint leaves a continuous interval behind it.'], a: 0,
                why: 'Continuity on a closed interval covers its endpoints too, and 1/(x − 2) has no value at x = 2. A proposal that starts on an excluded point fails even when every point strictly inside it is continuous.'
            },
            message: 'Test 2 now reports no break strictly inside the proposal, so only the endpoint test can catch this. The left end x = 2 has no function value, and the verdict stays red.'
        },
        {
            params: { p: 3, q: 7 },
            predict: {
                q: 'The proposal [3, 7] lies to the right of the break at x = 2, and the proposal [−3, 1] lies to the left of it. What do those two intervals have in common?',
                choices: ['Each one lies inside a single piece of the domain, so each is an interval of continuity.', 'Each one contains the break at x = 2, so each one fails continuity.', 'Each one is an interval of continuity, because a rational function is continuous on the whole number line.'], a: 0,
                why: 'A rational function is continuous at every point of its own domain, and this domain splits at x = 2. An interval that stays inside one piece inherits that continuity, and an interval that reaches across the split does not.'
            },
            message: 'The proposal [3, 7] passes all three tests. The phrase "continuous on its domain" means continuous on each separate piece of that domain.'
        },
        {
            params: { kase: 'radical', p: -2, q: 3 },
            predict: {
                q: 'The function √(x + 1) has no value left of x = −1, and the proposal starts at −2. What is wrong with the interval [−2, 3]?',
                choices: ['Nothing can be tested left of x = −1, because √(x + 1) has no value there.', 'The graph has a vertical asymptote at x = −1, so the interval fails at that one point.', 'The interval [−2, 3] is correct, because √(x + 1) has no break anywhere on the line.'], a: 0,
                why: 'Continuity can only be discussed where the function has a value. The proposed interval must lie inside the domain before any break is checked.'
            },
            message: 'The domain band starts at x = −1, so the left end of the proposal sits off the band and test 1 fails. Set the left end to exactly −1 and look at what test 3 says then.'
        },
        {
            params: { p: -1, q: 4 },
            predict: {
                q: 'The proposal now starts at x = −1, which is the edge of the domain, and f(−1) = 0 exists. What does test 3 need at that endpoint?',
                choices: ['Only continuity from the inside of the interval, because a closed endpoint has just one side to approach from.', 'A full two sided limit at x = −1, because an endpoint is an ordinary interior point.', 'Nothing, because an endpoint never belongs to the interval.'], a: 0,
                why: 'The endpoint x = −1 belongs to the domain, and the function is continuous there when you approach from the right, which is the only direction the interval offers. That is exactly what a closed interval endpoint asks for.'
            },
            message: 'All three tests pass, and test 3 names the reason: the endpoint has a value and the proposal runs inward from it. The marker at x = −1 is the domain edge, and the proposal touching it is allowed.'
        },
        {
            params: { kase: 'log', p: 0.5, q: 6 },
            predict: {
                q: 'For ln x the domain is x > 0, so x = 0 has no value. Try [0.5, 6] first, then drag the left end onto 0. Which proposal survives all three tests?',
                choices: ['[0.5, 6] passes, and [0, 6] fails, because the left end of [0, 6] has no function value.', 'Both pass, because x = 0 is only an edge and edges do not need a value.', '[0, 6] passes and [0.5, 6] fails, because [0.5, 6] starts at a point the graph skips.'], a: 0,
                why: 'The domain of ln x excludes x = 0, so a proposal that starts at 0 names an endpoint with no function value. A proposal that starts at 0.5 lies inside the domain throughout, and both of its ends have values.'
            },
            message: 'The domain band for ln x starts just right of 0, and 0 itself is not on the band, so touching 0 fails. The same edge position is allowed for √(x + 1), because that edge belongs to its domain.'
        },
        {
            params: { kase: 'piece', p: -2, q: 3 },
            predict: {
                q: 'This piecewise function has a value at every x, including x = 1. What does the marker at x = 1 mean for the proposal [−2, 3]?',
                choices: ['It is a jump break inside the domain, so the proposal crosses it and fails.', 'It is a domain edge, so the proposal only needs to stay right of it.', 'It means nothing, because every point has a value.'], a: 0,
                why: 'A missing value and a jump are two different failures. Here f(1) exists, but the branch x + 1 approaches 2 while the branch x² approaches 1, so continuity fails at x = 1 and the proposal that covers x = 1 fails with it.'
            },
            message: 'Drag the left end onto 1, so the proposal is [1, 3]. Test 2 stays silent there, because no break lies strictly inside the proposal, and test 3 finds that the branch x squared carries the value f(1), so the proposal passes. Now set the ends to −2 and 1. That proposal fails test 3, because the branch inside it is x + 1, which approaches 2 while f(1) is 1.'
        },
        {
            params: { kase: 'quad', p: -4, q: 8 },
            predict: {
                q: 'For f = 1/(x² − 9) the markers sit at x = −3 and x = 3. On how many separate pieces is this function continuous, and how many maximal intervals of continuity does the number line show?',
                choices: ['Three pieces, so three maximal intervals of continuity: left of −3, between −3 and 3, and right of 3.', 'Two pieces, because only the far left and the far right sides count.', 'One piece, because the function is rational and rational functions are continuous everywhere.'], a: 0,
                why: 'The denominator x² − 9 equals (x − 3)(x + 3). The function has no value at x = −3 and x = 3, so its domain is three separate pieces. Each open piece is continuous, because a rational function is continuous wherever it is defined.'
            },
            message: 'Confirm one maximal piece at a time by testing a closed subinterval that sits inside it. The three test intervals are [−4, −3.1], [−2.9, 2.9], and [3.1, 7]. Each one lies strictly inside a different maximal piece, and each is only a sample, not the maximal piece itself. Push an end onto −3 or onto 3 instead, and test 3 fails, because that endpoint has no function value at all.'
        }
    ],
    summary: {
        idea: 'Continuous on an interval means continuous at every single point of that interval, and an interval has infinitely many points, so no list of checked points can settle it. Standard elementary functions are continuous at every point of their own domain. Confirming an interval is therefore structural: keep the proposal inside one piece of the domain, let no excluded point or piece break lie in it, and treat an included endpoint on its own, where only continuity from the inside is asked for.',
        mistake: 'Students read the words polynomial or rational as continuous on the whole number line. A rational function is continuous only on its own domain, and that domain can split into several separate pieces.',
        transfer: 'Open the 1/(x² − 9) case in the function picker and read the three maximal intervals of continuity off the number line. Then test a closed subinterval inside each of the three maximal intervals with the interval sliders, and name which of the three tests fails for the proposal [−4, 8].'
    }
};

function round1(v) { return String(Math.round(v * 10) / 10); }
