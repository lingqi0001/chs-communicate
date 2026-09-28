/* 5.1 MVT Secant Finder — the Mean Value Theorem as one picture: a fixed
   endpoint secant (the whole-interval rate) and a rotating tangent at a
   draggable interior point c (the instantaneous rate). Four modes, one per
   misconception: One match, More than one, A corner, A jump. Matching-point
   markers stay hidden until the mode's Predict has been answered, because the
   theorem promises existence before anyone locates anything. Exact MVT points
   are kept exact internally (c = ±sqrt(4/3), c = -1/6); only labels round.
   Where a derivative fails to exist the readout prints DNE and no tangent is
   drawn, never NaN. */

import { fmt } from '../../js/calc-math.js?v=20260925-calc-15';

/* exact MVT points, computed not typed:
   cubic x³ − 3x on [-2, 2]: 3c² − 3 = 1 gives c² = 4/3
   corner x² + |x| on [-2, 1]: 2c − 1 = -4/3 gives c = -1/6 */
const C2 = Math.sqrt(4 / 3);
const C3 = -1 / 6;
/* inside this window around 0 the corner / jump has no derivative at all */
const EPS = 1e-4;

const SUMMARY = {
    idea: 'The Mean Value Theorem connects a rate across an entire interval to an instantaneous rate somewhere inside it. If f is continuous on [a,b] and differentiable on (a,b), at least one interior tangent must have the same slope as the endpoint secant.',
    mistake: 'The theorem guarantees existence, not location or uniqueness. If a hypothesis fails, the correct conclusion is not ‘there is no matching point.’ The correct conclusion is that the MVT gives no guarantee.',
    transfer: 'Suppose f is continuous on [1,5] and differentiable on (1,5), with f(1) = 3 and f(5) = 11. Before solving for any point c, what instantaneous rate does the Mean Value Theorem guarantee somewhere in (1,5)?'
};

/* ---------- shared pane builders ---------- */
function conditionsPane(items) {
    return { kind: 'checklist', title: 'Conditions', items };
}
/* The two hypotheses live in the Conditions checklist. The consequence is not a
   hypothesis, so it is not a checklist row: it sits in its own pane right after
   the checklist, gated to the stage after the mode's Predict so it can never
   answer that question early. */
function conclusionPane(when, holds, ivOpen) {
    return {
        kind: 'eq', title: 'What the conditions give', when,
        lines: [{
            t: holds
                ? 'Therefore: the Mean Value Theorem guarantees at least one c in ' + ivOpen + '.'
                : 'Therefore: the Mean Value Theorem gives no guarantee.',
            hl: true,
            color: holds ? 'up' : 'down'
        }]
    };
}
function smoothConditions() {
    return conditionsPane([
        { t: 'Continuous on [0, 4]', state: true },
        { t: 'Differentiable on (0, 4)', state: true }
    ]);
}
/* The two permanent side panels are Conditions and Slope comparison. A failed
   hypothesis always reads "MVT gives no guarantee", never "MVT is false". */
function slopePane(ivLabel) {
    return {
        kind: 'readout', title: 'Slope comparison',
        items: env => [
            { label: 'Average rate over ' + ivLabel, v: env.avg, big: true },
            { label: 'Instantaneous rate f′(c) at c = ' + fmt(env.c, 3), v: env.fp, big: true, color: env2 => env2.hasFp ? 'ink' : 'down' },
            { label: 'Difference f′(c) − average rate', v: env.diff, color: env2 => env2.near ? 'up' : 'ink' }
        ]
    };
}
/* Dragging only ever lands on "nearly equal". The note says so plainly; the
   exact points arrive later as explicit reveals, never as a fake equality.
   The gate names the phase in which the note may speak: modes 1 and 2 show c
   at phase 1, the corner mode shows c from phase 0. */
function nearNote(gatePhase) {
    return {
        kind: 'note', title: 'While you drag',
        when: env => env.phase === gatePhase && env.near === true,
        text: 'These slopes are nearly equal, so the tangent line and the secant line look parallel. This reading is a decimal check while you drag. The exact matching point appears when the lesson reveals it.'
    };
}
/* AP habit: CONDITIONS FIRST, then THEOREM, then CONCLUSION with numbers. */
function justifyPane(lines) {
    return { kind: 'eq', title: 'How to justify it', when: env => env.phase >= 2, lines };
}

/* ---------- mode 1: One match, f = x² on [0, 4] ---------- */
const oneMatch = {
    label: 'One match',
    intro: 'Start with the interval from x = 0 to x = 4. The secant line connects the two endpoint values, (0, 0) and (4, 16). Its slope is the average rate of change of f across the entire interval, and the Slope comparison panel reads that slope for you.',
    params: { c: 1, phase: 0 },
    controls: [
        { key: 'c', label: 'interior point c', min: 0.1, max: 3.9, step: 0.01, when: env => env.phase >= 1 }
    ],
    fns: {
        f: x => x * x,
        secant: x => 4 * x
    },
    compute: env => {
        const fp = 2 * env.c;
        const diff = fp - 4;
        return { avg: 4, fp, diff, hasFp: true, near: Math.abs(diff) <= 0.05 };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'f(x) = x² on [0, 4]', height: 340,
                window: [-0.4, 4.5, -1, 18],
                vband: () => [{ from: 0, to: 4, color: 'fillB' }],
                curves: () => [{ fn: 'f', color: 'curveA', label: 'f(x) = x²' }],
                segments: () => [{ x1: -0.15, y1: -0.6, x2: 4.4, y2: 17.6, color: 'accent' }],
                points: env => {
                    const out = [
                        { x: 0, y: 0, color: 'ink', label: '(0, 0)' },
                        { x: 4, y: 16, color: 'ink', label: '(4, 16)' }
                    ];
                    if (env.phase >= 1) out.push({ x: env.c, fn: 'f', color: 'accent', label: 'c', r: 6, drag: { key: 'c', min: 0.1, max: 3.9 } });
                    if (env.phase >= 2) out.push({ x: 2, fn: 'f', color: 'up', label: 'matching c = 2', r: 5 });
                    return out;
                },
                tangents: env => env.phase >= 1
                    ? [{ x: env.c, fn: 'f', m: env.fp, color: 'curveC', label: 'tangent at c', reach: 0.18 + 0.36 * Math.abs(env.c - 2) }]
                    : [],
                notes: () => [{ x: 3.3, y: 13.2, t: 'secant line' }]
            }
        ],
        side: [
            smoothConditions(),
            conclusionPane(env => env.phase >= 1, true, '(0, 4)'),
            slopePane('[0, 4]'),
            nearNote(1),
            justifyPane([
                { t: 'Since f is continuous on [0, 4]' },
                { t: 'and differentiable on (0, 4),' },
                { t: 'the Mean Value Theorem guarantees at least one c ∈ (0, 4) such that' },
                { t: 'f′(c) = (f(4) − f(0)) / (4 − 0).' },
                { t: 'Here f′(2) = 4 = (16 − 0) / (4 − 0), so c = 2 is a point that works.', hl: true, color: 'up' }
            ])
        ]
    },
    steps: [
        {
            params: { c: 1, phase: 0 },
            message: 'The secant line through the endpoints is drawn once and never moves. The Slope comparison panel reads its slope, the average rate over the whole interval, as 4. Nothing on the graph yet names an interior point.'
        },
        {
            params: { c: 1, phase: 1 },
            predict: {
                q: 'The average rate of change from x = 0 to x = 4 is 4. If the Mean Value Theorem applies, what must happen somewhere between the endpoints?',
                choices: [
                    'There is at least one interior point where the tangent slope is 4.',
                    'The function must reach a height of 4 somewhere between the endpoints.',
                    'The tangent slope must equal 4 at both endpoints.'
                ], a: 0,
                why: 'The Mean Value Theorem compares rates of change. If its conditions hold, at least one interior point c has instantaneous rate f′(c) equal to the average rate over the whole interval.'
            },
            message: 'Drag the interior point c, on the slider or by dragging the point itself on the graph. Watch the tangent line rotate while the secant line stays fixed. You are looking for the place where the tangent has the same slope as the secant. The Slope comparison panel puts numbers on the match.'
        },
        {
            params: { c: 2, phase: 2 },
            message: 'At c = 2, the tangent slope is 4, exactly the same as the secant slope. The picture shows one point that works. The theorem did something different: before we found c, the conditions already guaranteed that at least one such point had to exist.'
        },
        {
            params: {},
            message: 'Read the How to justify it panel. Conditions first, then the theorem, then the conclusion with numbers substituted. On the AP exam, never write only "By MVT, c = 2." The credit lives in naming the two hypotheses before the conclusion.'
        }
    ],
    summary: SUMMARY
};

/* ---------- mode 2: More than one, f = x³ − 3x on [-2, 2] ---------- */
const moreThanOne = {
    label: 'More than one',
    intro: 'f(x) = x³ − 3x on [-2, 2]. The secant line through the endpoints (−2, −2) and (2, 2) has slope 1, so that is the average rate over the whole interval. The Conditions panel shows both hypotheses hold.',
    params: { c: 0, phase: 0 },
    controls: [
        { key: 'c', label: 'interior point c', min: -1.9, max: 1.9, step: 0.01, when: env => env.phase >= 1 }
    ],
    fns: {
        f: x => x * x * x - 3 * x,
        secant: x => x
    },
    compute: env => {
        const fp = 3 * env.c * env.c - 3;
        const diff = fp - 1;
        return { avg: 1, fp, diff, hasFp: true, near: Math.abs(diff) <= 0.05 };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'f(x) = x³ − 3x on [-2, 2]', height: 340,
                window: [-2.4, 2.4, -3.4, 3.4],
                vband: () => [{ from: -2, to: 2, color: 'fillB' }],
                curves: () => [{ fn: 'f', color: 'curveA', label: 'f(x) = x³ − 3x' }],
                segments: () => [{ x1: -2.25, y1: -2.25, x2: 2.25, y2: 2.25, color: 'accent' }],
                points: env => {
                    const out = [
                        { x: -2, y: -2, color: 'ink', label: '(−2, −2)' },
                        { x: 2, y: 2, color: 'ink', label: '(2, 2)' }
                    ];
                    if (env.phase >= 1) out.push({ x: env.c, fn: 'f', color: 'accent', label: 'c', r: 6, drag: { key: 'c', min: -1.9, max: 1.9 } });
                    if (env.phase >= 2) {
                        out.push({ x: -C2, fn: 'f', color: 'up', label: 'c ≈ ' + fmt(-C2, 3), r: 4 });
                        out.push({ x: C2, fn: 'f', color: 'up', label: 'c ≈ ' + fmt(C2, 3), r: 4 });
                    }
                    return out;
                },
                tangents: env => {
                    const out = [];
                    if (env.phase >= 1) out.push({ x: env.c, fn: 'f', m: env.fp, color: 'curveC', label: 'tangent at c', reach: 0.3 });
                    /* short parallel previews at both exact points, so the
                       markers carry the slope claim without two full lines */
                    if (env.phase >= 2) out.push(
                        { x: -C2, fn: 'f', m: 1, color: 'up', dashed: true, reach: 0.13 },
                        { x: C2, fn: 'f', m: 1, color: 'up', dashed: true, reach: 0.13 }
                    );
                    return out;
                },
                notes: () => [{ x: -1.95, y: -1.95, t: 'secant line' }]
            }
        ],
        side: [
            conditionsPane([
                { t: 'Continuous on [-2, 2]', state: true },
                { t: 'Differentiable on (-2, 2)', state: true }
            ]),
            conclusionPane(env => env.phase >= 1, true, '(−2, 2)'),
            slopePane('[-2, 2]'),
            nearNote(1),
            justifyPane([
                { t: 'Since f is continuous on [−2, 2]' },
                { t: 'and differentiable on (−2, 2),' },
                { t: 'the Mean Value Theorem guarantees at least one c ∈ (−2, 2) such that' },
                { t: 'f′(c) = (f(2) − f(−2)) / (2 − (−2)) = 1.' },
                { t: 'Solving 3c² − 3 = 1 gives c = ±√(4/3), which display as about -1.155 and 1.155.', hl: true, color: 'up' }
            ])
        ]
    },
    steps: [
        {
            params: { c: 0, phase: 0 },
            message: 'The secant line through the endpoints has slope 1, and the Slope comparison panel reads the average rate as 1. The Conditions panel says the Mean Value Theorem applies here. The graph does not yet show any matching point, because the first question is what the theorem promises.'
        },
        {
            params: { c: 0, phase: 1 },
            predict: {
                q: 'The MVT conditions hold on this interval. How many interior points does the theorem guarantee where the tangent slope equals the secant slope?',
                choices: [
                    'At least one. There may be more.',
                    'Exactly one.',
                    'Exactly two.'
                ], a: 0,
                why: 'The theorem guarantees existence, not uniqueness. A particular function can have one matching point, several matching points, or more.'
            },
            message: 'Drag the interior point c. The tangent rotates while the secant line stays fixed. Look for the places where the two slopes match. The Slope comparison panel will read nearly equal more than once on this curve.'
        },
        {
            params: { phase: 2 },
            message: 'This curve has two different interior points where f′(c) = 1. The MVT promised at least one. It did not promise exactly one.'
        },
        {
            params: { c: C2 },
            message: 'Read the How to justify it panel: conditions first, then the theorem, then the conclusion. The two markers were located by solving 3c² − 3 = 1. The theorem itself only promised that at least one such point exists.'
        }
    ],
    summary: SUMMARY
};

/* ---------- mode 3: A corner, f = x² + |x| on [-2, 1] ---------- */
const corner = {
    label: 'A corner',
    intro: 'f(x) = x² + |x| on [-2, 1]. The graph is continuous everywhere, but it has a sharp corner at x = 0, so f′(0) does not exist. The secant line through the endpoints (−2, 6) and (1, 2) has slope (2 − 6) / (1 − (−2)), which the Slope comparison panel reads as -1.333.',
    params: { c: -1.5, phase: 0 },
    controls: [
        { key: 'c', label: 'interior point c', min: -1.9, max: 0.9, step: 0.05 }
    ],
    fns: {
        f: x => x * x + Math.abs(x),
        secant: x => 6 + (-4 / 3) * (x + 2)
    },
    compute: env => {
        const isDne = Math.abs(env.c) < EPS;
        /* exact one-sided derivatives: 2x − 1 left of 0, 2x + 1 right of 0 */
        const fp = isDne ? 'DNE' : (env.c < 0 ? 2 * env.c - 1 : 2 * env.c + 1);
        const diff = isDne ? 'DNE' : fp + 4 / 3;
        return { avg: -4 / 3, fp, diff, hasFp: !isDne, near: !isDne && Math.abs(diff) <= 0.05 };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'f(x) = x² + |x| on [-2, 1]', height: 340,
                window: [-2.5, 1.5, -1, 7],
                vband: () => [{ from: -2, to: 1, color: 'fillB' }],
                curves: () => [{ fn: 'f', color: 'curveA', label: 'f(x) = x² + |x|' }],
                segments: () => [{ x1: -2.3, y1: 6.4, x2: 1.3, y2: 1.6, color: 'accent' }],
                points: env => {
                    const out = [
                        { x: -2, y: 6, color: 'ink', label: '(−2, 6)' },
                        { x: 1, y: 2, color: 'ink', label: '(1, 2)' },
                        { x: 0, y: 0, color: 'down', label: 'corner at x = 0', r: 5 },
                        { x: env.c, fn: 'f', color: 'accent', label: 'c', r: 6, drag: { key: 'c', min: -1.9, max: 0.9 } }
                    ];
                    if (env.phase >= 1) out.push({ x: C3, fn: 'f', color: 'up', label: 'match at c = −1/6', r: 5 });
                    return out;
                },
                /* a corner gets no fake tangent: when f′(c) = DNE,
                   no tangent line is drawn at all */
                tangents: env => env.hasFp
                    ? [{ x: env.c, fn: 'f', m: env.fp, color: 'curveC', label: 'tangent at c', reach: 0.3 }]
                    : [],
                vlines: env => env.hasFp ? [] : [{ x: 0, color: 'down', label: 'f′(c) = DNE' }],
                notes: () => [{ x: -0.6, y: () => 6 + (-4 / 3) * (-0.6 + 2), t: 'secant line' }]
            }
        ],
        side: [
            conditionsPane([
                { t: 'Continuous on [-2, 1]', state: true },
                { t: 'Differentiable on (-2, 1)', state: false }
            ]),
            conclusionPane(env => env.phase >= 1, false, null),
            slopePane('[-2, 1]'),
            nearNote(0)
        ]
    },
    steps: [
        {
            params: { c: -1.5 },
            message: 'Look at the Conditions panel. Continuity holds on [-2, 1], but differentiability fails at x = 0, so the MVT gives no guarantee for this interval. Drag the interior point c and watch the tangent rotate. When c sits at 0, the Slope comparison panel reads f′(c) = DNE and no tangent line is drawn, because a corner has no single tangent.'
        },
        {
            params: { phase: 1, c: C3 },
            predict: {
                q: 'The function has a corner at x = 0, so it is not differentiable everywhere inside the interval. What can we conclude from the Mean Value Theorem?',
                choices: [
                    'The MVT gives no guarantee on this interval.',
                    'There cannot be any point where the tangent slope matches the average rate.',
                    'The MVT still guarantees a matching point because the function is continuous.'
                ], a: 0,
                why: 'Both hypotheses are required. If differentiability fails anywhere inside the interval, the MVT cannot be used. That does not mean a matching point is impossible; it only means the theorem no longer guarantees one.'
            },
            message: 'In this example, a matching tangent still exists. That does not rescue the theorem. The point is that the hypotheses were not strong enough to guarantee the result before we looked. The tangent at c = −1/6 is parallel to the secant line, and both the tangent and the secant drop 4 units for every 3 units of run. The Slope comparison panel reads the difference as 0, because left of the corner f′(x) = 2x − 1 and 2(−1/6) − 1 = −4/3. The theorem itself never certified this point.'
        }
    ],
    summary: SUMMARY
};

/* ---------- mode 4: A jump, piecewise x / x + 1 on [-1, 1] ---------- */
const jump = {
    label: 'A jump',
    intro: 'f(x) = x on the left branch and f(x) = x + 1 on the right branch, over [-1, 1]. The graph jumps at x = 0: the open circle marks where the left branch stops, and the filled point marks where the right branch starts. The secant line through the endpoints has slope (2 − (−1)) / (1 − (−1)), which is 1.5.',
    params: { c: 0.5, phase: 0 },
    controls: [
        { key: 'c', label: 'interior point c', min: -0.9, max: 0.9, step: 0.01 }
    ],
    fns: {
        f: x => x < 0 ? x : x + 1,
        secant: x => 1.5 * x + 0.5
    },
    compute: env => {
        /* the branches each have slope 1; at the jump f is not even
           continuous, so f′(c) = DNE there and the difference has no value */
        const isDne = Math.abs(env.c) < EPS;
        return { avg: 1.5, fp: isDne ? 'DNE' : 1, diff: isDne ? 'DNE' : -0.5, hasFp: !isDne, near: false };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'A piecewise function with a jump on [-1, 1]', height: 320,
                window: [-1.4, 1.4, -1.8, 2.8],
                vband: () => [{ from: -1, to: 1, color: 'fillB' }],
                curves: () => [
                    { fn: x => x, from: -1, to: -0.004, color: 'curveA' },
                    { fn: x => x + 1, from: 0, to: 1, color: 'curveA' }
                ],
                segments: () => [{ x1: -1.15, y1: -1.225, x2: 1.15, y2: 2.225, color: 'accent' }],
                points: env => ([
                    { x: -1, y: -1, color: 'ink', label: '(−1, −1)' },
                    { x: 1, y: 2, color: 'ink', label: '(1, 2)' },
                    { x: 0, y: 0, open: true, color: 'down', label: 'left branch stops here' },
                    { x: 0, y: 1, color: 'down', label: 'right branch starts here' },
                    { x: env.c, fn: 'f', color: 'accent', label: 'c', r: 6, drag: { key: 'c', min: -0.9, max: 0.9 } }
                ]),
                tangents: env => env.hasFp
                    ? [{ x: env.c, fn: 'f', m: env.fp, color: 'curveC', label: 'tangent at c', reach: 0.25 }]
                    : [],
                vlines: env => env.hasFp ? [] : [{ x: 0, color: 'down', label: 'f′(c) = DNE' }],
                notes: () => [{ x: -1.05, y: 1.5 * -1.05 + 0.5, t: 'secant line' }]
            }
        ],
        side: [
            conditionsPane([
                { t: 'Continuous on [-1, 1]', state: false },
                { t: 'Differentiable on (-1, 1)', state: false }
            ]),
            conclusionPane(env => env.phase >= 1, false, null),
            slopePane('[-1, 1]')
        ]
    },
    steps: [
        {
            params: { c: 0.5 },
            message: 'Each smooth piece of this graph is a line with slope 1, so wherever the derivative exists it reads 1, while the secant slope across [-1, 1] is 1.5. Drag the interior point c across the jump and watch the Slope comparison panel. The two numbers never meet. The filled point at (0, 1) is where the right branch starts, and the open circle at (0, 0) is where the left branch stops.'
        },
        {
            predict: {
                q: 'The secant slope across the interval is 1.5, but the graph jumps at x = 0. Does the Mean Value Theorem guarantee a tangent with slope 1.5?',
                choices: [
                    'No. The continuity condition fails.',
                    'Yes. Every secant line must have a parallel tangent.',
                    'Yes, because the function has derivatives on both sides of the jump.'
                ], a: 0,
                why: 'The theorem requires one continuous function across the entire closed interval. A jump breaks that condition, so the MVT gives no guarantee.'
            },
            params: { phase: 1 },
            message: 'The smooth pieces each have slope 1, so this example actually has no tangent with slope 1.5. Compare this with the A corner mode: when a hypothesis fails, sometimes the conclusion happens anyway and sometimes it does not. The theorem simply stops guaranteeing it.'
        }
    ],
    summary: SUMMARY
};

export default {
    id: 'u5-mvt-secant-finder',
    meta: { unit: 5, topic: '5.1', title: 'Using the Mean Value Theorem', visualizerTitle: 'MVT Secant Finder' },
    modes: [oneMatch, moreThanOne, corner, jump]
};
