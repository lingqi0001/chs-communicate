/* 4.2 Motion Tracker. One instant at a time: the trail, the flash spacing, and
   the three stacked graphs are all views of the same state. Dots sit at their
   true positions on a feet axis, so the gap width itself carries the lesson
   (wide gap = fast, piling up = slow). All rendering goes through the shared
   playbar/particleTrail renderers in calc-components.js via the specs below. */

export default {
    id: 'u4-motion-lab',
    meta: { unit: 4, topic: '4.2', title: 'Straight-Line Motion: Connecting Position, Velocity, and Acceleration', visualizerTitle: 'Motion Tracker' },
    intro: 'A particle moves along a straight line with position s(t) = t³ − 6t² + 9t feet, for 0 ≤ t ≤ 4 seconds. Drag the time slider or move the highlighted dot on any graph. The trail replays where the particle has been, and the three graphs share the same instant.',
    params: { t: 0.4, d: 0.18, stage: 1 },
    fns: {
        s: (t) => t * t * t - 6 * t * t + 9 * t,
        v: (t) => 3 * t * t - 12 * t + 9,
        a: (t) => 6 * t - 12
    },
    compute: (env) => {
        const t = env.t;
        const tr = trail(Object.assign({}, env, { tt: t }));
        const st = env.s(t), vt = env.v(t), at = env.a(t);
        return {
            tt: t, st, vt, at, speed: Math.abs(vt),
            trail: tr,
            rest: Math.abs(vt) < 0.05
        };
    },
    controls: [
        { key: 't', label: 'Time', min: 0, max: 4, step: 0.02, unit: ' s' },
        { key: 'd', label: 'Trail flash spacing', min: 0.05, max: 0.4, step: 0.01, unit: ' s' }
    ],
    panes: {
        main: [
            { kind: 'particleTrail', sMin: -1, sMax: 5 },
            {
                kind: 'graph', title: 'Position s(t)', height: 120,
                window: [-0.15, 4.15, -0.7, 4.9], gridY: 1,
                curves: [{ fn: 's', color: 'curveA', label: 's(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 's = 0' }],
                vlines: [{ x: env => env.tt, color: 'ink', label: null }],
                points: (env) => [
                    { x: env.tt, fn: 's', color: 'accent', label: null, drag: { key: 't', min: 0, max: 4, snap: 0.02 } }
                ]
            },
            {
                kind: 'graph', title: 'Velocity v(t) = s′(t)', height: 100,
                window: [-0.15, 4.15, -4.5, 10], gridY: 2,
                curves: [{ fn: 'v', color: 'curveB', label: 'v(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 'v = 0' }],
                vlines: (env) => [{ x: env.tt, color: 'ink' }],
                points: (env) => [{ x: env.tt, fn: 'v', color: 'accent' }]
            },
            {
                kind: 'graph', title: 'Acceleration a(t) = v′(t)', height: 100,
                window: [-0.15, 4.15, -13, 13], gridY: 5,
                curves: [{ fn: 'a', color: 'curveC', label: 'a(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 'a = 0' }],
                vlines: (env) => [{ x: env.tt, color: 'ink' }],
                points: (env) => [{ x: env.tt, fn: 'a', color: 'accent' }]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'At this instant',
                items: env => [
                    { label: 'velocity v(t)', v: env.vt, unit: 'ft/s', big: true },
                    { label: 'acceleration a(t)', v: env.at, unit: 'ft/s²', big: true },
                    { label: 'speed |v|', v: env.speed, unit: 'ft/s' }
                ]
            },
            {
                kind: 'note',
                text: env => env.rest
                    ? 'v = 0 right now: the particle is stopped for this instant. The trail dots pile up here.'
                    : ((env.vt > 0 ? 'v > 0, moving right. ' : 'v < 0, moving left. ')
                        + (Math.abs(env.at) < 0.05
                            ? 'a = 0 at this instant, so right now the speed is neither increasing nor decreasing.'
                            : ((env.vt > 0) === (env.at > 0)
                                ? 'v and a share a sign, so it is speeding up and the gaps widen.'
                                : 'v and a have opposite signs, so it is slowing down and the gaps narrow.')))
            }
        ]
    },
    steps: [
        {
            params: { stage: 1, t: 0.4, d: 0.18 },
            message: 'Drag the highlighted dot on any graph, or move the Time slider. The trail at the top replays where the particle has been: one flash every 0.18 s, so wide gaps mean it was moving fast.'
        },
        {
            params: { t: 2.4, d: 0.22, stage: 2 },
            predict: {
                q: 'The readout shows v < 0 and a > 0. If the particle keeps moving this way, what happens to the gaps between new trail flashes?',
                choices: ['Gaps will get wider', 'Gaps will get smaller', 'Gaps will stay the same'], a: 1,
                why: 'v < 0 means moving left, but a > 0 pushes velocity back toward zero (slowing it down). The gaps narrow as the particle slows.'
            },
            message: 'Answer first. Then watch: v and a have opposite signs, so the particle is slowing down while moving left.'
        },
        {
            params: { t: 1.5, stage: 2 },
            predict: {
                q: 'The particle is at s = 3.375 ft (right of origin) with v = −2.25 ft/s. Which way is it moving?',
                choices: ['Left', 'Right', 'Stopped'], a: 0,
                why: 'Direction comes from v, not s. Negative velocity means moving left, even though the position is positive.'
            },
            message: 'Position tells you where. Velocity tells you which way. These are different questions.'
        },
        {
            params: { t: 1, stage: 2 },
            predict: {
                q: 'At t = 1 the velocity is v = 0. Is the particle at the origin (s = 0)?',
                choices: ['No. v = 0 doesn\'t mean s = 0', 'Yes. v = 0 always means origin', 'No. v = 0 also means a = 0'], a: 0,
                why: 'v = 0 means the particle is stopped for an instant, not that it is at position zero. Here s(1) = 4 ft.'
            },
            message: 'At rest moments the dots pile up because the flashes keep coming while the particle barely moves.'
        },
        {
            params: { t: 2, stage: 2 },
            predict: {
                q: 'At t = 2 the acceleration is exactly 0 while v(2) = −3 ft/s. Is the particle stopped?',
                choices: ['No. v = −3 ft/s, and a = 0 lasts only for this instant', 'Yes. a = 0 means stopped', 'Yes. a = 0 implies v = 0'], a: 0,
                why: 'The particle moves left at 3 ft/s, so it is not stopped. Just before t = 2 the gaps widen, just after t = 2 they narrow, and at t = 2 the acceleration is 0 for one instant. That instant is where the speed reaches its maximum, and an acceleration of 0 at one instant does not mean constant velocity over an interval.'
            },
            message: 'Watch the spacing around t = 2. Just before it the gaps widen while v and a are both negative, just after it the gaps narrow while v stays negative and a turns positive. At t = 2 the acceleration is 0 for one instant, and that is where the speed peaks at 3 ft/s. One instant of a = 0 is not constant velocity over an interval.'
        },
        {
            params: { t: 3, stage: 2, d: 0.3 },
            predict: {
                q: 'At t = 3 the velocity is v = 0 again. Is this also a turnaround like t = 1?',
                choices: ['Yes. v changes sign around t = 3', 'No. v stays negative', 'Cannot tell from signs'], a: 0,
                why: 'At t = 3, v changes from negative (before) to positive (after). That is a turnaround: the particle reverses direction.'
            },
            message: 'Both t = 1 and t = 3 are turnaround points. At each, v = 0 but the particle is not at the origin.'
        },
        {
            params: { t: 3.6, stage: 2, d: 0.18 },
            message: 'After the turn, both v and a are positive. The particle moves right and speeds up. The gaps widen again.'
        }
    ],
    summary: {
        idea: [
            'Position says where. Velocity gives direction and rate of change. Speed is |v|. Acceleration says how v is changing.',
            'Same signs for v and a means speeding up. Opposite signs means slowing down. Position never decides direction, and a = 0 does not mean stopped.'
        ],
        mistake: 'Positive acceleration always means speeding up. With v < 0 and a > 0, the particle moves left while a pulls v toward zero, so it is slowing down. Watch the gaps narrow.',
        transfer: 'Given v > 0, a < 0 and v < 0, a > 0: for each case, state direction, whether speeding or slowing, and describe the trail gap pattern.'
    }
};

function trail(env) {
    const D = Math.max(env.d, 0.03);
    const pts = [];
    const DOTS = 9;
    for (let k = 0; k < DOTS; k++) {
        const tk = env.tt - k * D;
        if (tk < -1e-9) break;
        pts.push({ t: tk, s: env.s(tk), v: env.v(tk), a: env.a(tk) });
    }
    return { D, pts };
}
