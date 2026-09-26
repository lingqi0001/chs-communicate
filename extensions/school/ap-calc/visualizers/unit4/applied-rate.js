/* 4.3 Applied Rate Explorer — the rate is not a number in a card. It is a
   gap you make appear: solid mark = now, dashed mark = Δ later, and the gap
   divided by Δ is the derivative. */

import { evaluate } from '../../js/calc-math.js?v=20260925-calc-15';

const MODES = {
    tank: {
        label: 'Tank volume',
        src: '38 + 3.5(t-10) + 0.05(t-10)^2',
        t0: 10, tMax: 11.5, dMax: 3,
        vUnit: 'L', iUnit: 'min', what: 'water in the tank',
        intro: 'V(t) is the volume of water in a tank, in liters, and t is time in minutes. The tank is being filled, and the filling speed itself is slowly changing.',
        window: [0, 12, 0, 95]
    },
    temp: {
        label: 'Soup below freezing',
        src: '18 - 11t + t^2',
        t0: 6.5, tMax: 8, dMax: 2,
        vUnit: '°C', iUnit: 'min', what: 'temperature',
        intro: 'T(t) is the temperature of a soup in °C, and t is time in minutes. It cools below freezing, bottoms out, and then starts to warm up.',
        window: [0, 8.5, -14, 20]
    },
    pop: {
        label: 'Bird colony',
        src: '200 + 120t - 10t^2',
        t0: 5, tMax: 9, dMax: 2,
        vUnit: 'birds', iUnit: 'yr', what: 'colony',
        intro: 'P(t) is the size of a bird colony in birds, and t is time in years. Each dot on the screen stands for 10 birds.',
        window: [0, 10, 0, 640]
    }
};

function flock(val, extra) {
    const pts = [];
    const total = Math.max(0, Math.round(val / 10));
    const per = 10;
    for (let i = 0; i < total; i++) {
        pts.push({ x: 0.6 + (i % per) * 0.92, y: 20 + Math.floor(i / per) * 52, color: 'ink', r: 5 });
    }
    const n = Math.min(30, Math.abs(extra));
    for (let i = 0; i < n; i++) {
        const idx = total + i;
        pts.push({
            x: 0.6 + (idx % per) * 0.92,
            y: 20 + Math.floor(idx / per) * 52,
            color: 'aux', r: 5, open: extra > 0
        });
    }
    return pts;
}

function modeDef(key) {
    const m = MODES[key];
    const f = x => evaluate(m.src, { t: x });
    const slope = x => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;

    return {
        label: m.label,
        intro: m.intro,
        params: { t: m.t0, d: 1 },
        compute: (env) => {
            const t = Math.min(Math.max(env.t, 0.2), m.tMax);
            const d = Math.min(Math.max(env.d, 0), m.dMax);
            const now = f(t);
            const rate = slope(t);
            const forecast = now + rate * d;
            const truth = f(t + d);
            return { t, d, now, rate, forecast, truth, gap: rate * d, live: d > 0.01 };
        },
        controls: [
            { key: 't', label: 'Time', min: 0.2, max: m.tMax, step: 0.05 },
            { key: 'd', label: 'Increase time by', min: 0, max: m.dMax, step: 0.05, unit: ' ' + m.iUnit }
        ],
        panes: {
            main: [
                key === 'pop' ? {
                    kind: 'graph', title: env => 'Each dot is 10 birds · open dots are the forecast ' + r1(env.d) + ' yr later', height: 380,
                    window: m.window, grid: false, ticks: false,
                    points: env => flock(env.now, env.live ? Math.round((env.forecast - env.now) / 10) : 0),
                    notes: env => [
                        { x: 0.5, y: 10, t: env => 'Now: ' + r1(env.now) + ' birds · rate: ' + r1(env.rate) + ' birds/' + m.iUnit },
                        { x: 0.5, y: 2, t: env => env.live ? 'Estimated size: ' + r1(env.forecast) + ' birds' : 'Increase the time to see a forecast.' }
                    ]
                } : {
                    kind: 'graph', title: env => 'Solid line: level now · dashed line: estimated level ' + r1(env.d) + ' ' + m.iUnit + ' later',
                    height: 380, window: m.window,
                    areas: (env) => key === 'tank' ? [
                        { fn: (x, e) => e.now, from: 0.65, to: 11.35, baseline: 1, color: 'fillA' }
                    ] : [
                        { fn: (x, e) => Math.min(e.now, e.forecast), from: 1.05, to: 2.35, baseline: m.window[2], color: 'fillB' }
                    ],
                    segments: (env) => key === 'tank' ? [
                        { x1: 0.6, y1: 92, x2: 0.6, y2: 1, color: 'auxInk' },
                        { x1: 11.4, y1: 92, x2: 11.4, y2: 1, color: 'auxInk' },
                        { x1: 0.6, y1: 1, x2: 11.4, y2: 1, color: 'auxInk' },
                        { x1: 0.6, y1: env.now, x2: 11.4, y2: env.now, color: 'accent' },
                        { x1: 0.6, y1: env.forecast, x2: 11.4, y2: env.forecast, color: 'aux', dashed: env.live },
                        { x1: 10.6, y1: env.now, x2: 10.6, y2: env.forecast, color: 'down', dashed: !env.live }
                    ] : [
                        { x1: 1, y1: m.window[2] + 1, x2: 1, y2: m.window[3] - 1, color: 'auxInk' },
                        { x1: 2.4, y1: m.window[2] + 1, x2: 2.4, y2: m.window[3] - 1, color: 'auxInk' },
                        { x1: 1, y1: env.now, x2: 2.4, y2: env.now, color: 'accent' },
                        { x1: 1, y1: env.forecast, x2: 2.4, y2: env.forecast, color: 'aux', dashed: env.live },
                        { x1: 3.1, y1: env.now, x2: 3.1, y2: env.forecast, color: 'down', dashed: !env.live }
                    ],
                    hlines: (env) => key === 'temp' ? [{ y: 0, color: 'ink', label: 'Freezing point (0 °C)' }] : [],
                    points: (env) => [
                        { x: env.t, y: env.now, color: 'ink', label: env => 'Now: ' + r1(env.now) + ' ' + m.vUnit, drag: { key: 't', min: 0.2, max: m.tMax } }
                    ],
                    notes: env => env.live ? [
                        { x: key === 'tank' ? 3.2 : 3.6, y: (env.now + env.forecast) / 2, t: env => 'Predicted change: ' + r1(env.rate) + ' × ' + r1(env.d) + ' = ' + r1(env.gap) + ' ' + m.vUnit }
                    ] : [{ x: key === 'tank' ? 3.2 : 3.6, y: env.now + 5, t: 'No time step yet, so nothing is being predicted. Increase the time.' }]
                }
            ],
            side: [
                {
                    kind: 'graph', title: 'The same situation as a graph', height: 280,
                    window: key === 'pop' ? [0, m.tMax, 0, 640] : m.window,
                    curves: (env) => [{ fn: x => f(x), color: 'curveA' }],
                    hlines: key === 'temp' ? [{ y: 0, color: 'auxInk' }] : [],
                    segments: (env) => [{ x1: env.t, y1: env.now, x2: env.t + env.d, y2: env.forecast, color: 'aux', dashed: env.live }],
                    points: (env) => [
                        { x: env.t, y: env.now, color: 'ink', drag: { key: 't', min: 0.2, max: m.tMax } },
                        { x: env.t + env.d, y: env.truth, color: 'curveA', open: true, label: 'Actual value' },
                        { x: env.t + env.d, y: env.forecast, color: 'aux', label: 'Linear estimate' }
                    ],
                    notes: env => [{ x: 0.3, y: key === 'temp' ? -13 : m.window[3] * 0.85, t: env => 'Rate at t = ' + r1(env.t) + ': ' + r1(env.rate) + ' ' + m.vUnit + ' per ' + m.iUnit }]
                }
            ]
        },
        steps: stepsFor(key),
        summary: summaries[key]
    };
}

function stepsFor(key) {
    if (key === 'tank') return [
        {
            params: { t: 6, d: 0 },
            message: 'Only the current level of water is drawn, so nothing is predicted yet. Press Next to look two minutes ahead.'
        },
        {
            params: { t: 6, d: 2 },
            predict: {
                q: 'The dashed level comes from the rate alone. Is that dashed estimate high or low compared with the level the tank really reaches?',
                choices: ['Below. The rate itself keeps growing during the step.', 'Above. A linear estimate always overshoots.', 'Exactly equal. The rate is known at this instant.'], a: 0,
                why: 'Around t = 6 the rate is itself increasing, so the real level ends up a little above the estimate. Shrink the time step and the two come together. The derivative is the value that the change divided by the time step approaches.'
            },
            message: 'The solid line answers how much water there is, and the gap answers how fast it is changing. Divide the gap by the time step to get the rate back. Set the step to 1 minute and the gap is the rate itself.'
        },
        {
            params: { t: 10, d: 1 },
            predict: {
                q: 'At t = 10 the rate reads 3.5 L/min. Does that mean the tank holds 3.5 liters?',
                choices: ['No. The solid level says how full the tank is, and the gap says how fast it changes', 'Yes. The slope and the level are the same reading'], a: 0,
                why: 'No. The tank holds 38 L. The rate 3.5 L/min says the level climbs about 3.5 L over the next minute. Amount and rate are two different readings, and their signs can even disagree.'
            },
            message: 'Slide the time back and forth and watch the height and the gap answer two different questions.'
        }
    ];
    if (key === 'temp') return [
        {
            params: { t: 3, d: 0 },
            message: 'The temperature sits at −6 °C, below the freezing line, and it is still falling. Press Next for a case where a rule of thumb goes wrong.'
        },
        {
            params: { t: 6.5, d: 1 },
            predict: {
                q: 'The temperature is below the 0 °C line, and the estimate for one minute later is above it. Does a positive derivative mean a positive temperature?',
                choices: ['No. Here T = −11.25 °C while T′ is positive', 'Yes. A rising temperature must be above zero'], a: 0,
                why: 'No. The value says the soup is under freezing, and the rate says it is warming up. Warming is not the same as being warm. Drag the time past the low point at t = 5.5 and the two signs go their separate ways.'
            },
            message: 'Drag the time from 2 to 8 minutes. The temperature falls, levels off, then climbs back. It stays below zero most of the way.'
        }
    ];
    return [
        {
            params: { t: 6, d: 0 },
            message: 'Every dot is 10 birds, and the colony is at its largest. Press Next to look one year ahead.'
        },
        {
            params: { t: 6, d: 1 },
            predict: {
                q: 'At t = 6 the rate is 0 birds per year. Is the colony collapsing?',
                choices: ['No. The count is at its maximum of 560 birds and only stops changing for a moment', 'Yes. A rate of zero means there are no birds'], a: 0,
                why: 'No. The forecast adds no birds and removes none, and this is the largest the colony ever gets. A rate near zero only means the size is barely changing at that instant, and it says nothing about how large the colony is.'
            },
            message: 'Move the time a little to either side of 6. Extra open dots appear when the colony is growing, and they disappear when it is shrinking. The switch between the two is the peak.'
        },
        {
            params: { t: 3, d: 1 },
            message: 'Early on the gap is wide while the colony is still small. A large rate and a small quantity are not a contradiction. They answer two different questions.'
        }
    ];
}

const summaries = {
    tank: {
        idea: 'Every applied rate has the same structure. It is the change in output per unit of input at one instant. Here that is the gap you open with the time slider.',
        mistake: 'Reading V′(10) = 3.5 L/min as 3.5 liters of water. The tank holds 38 L. The rate means the estimate gains about 3.5 L over the next minute.',
        transfer: 'B(t) is a battery charge in percent, t in hours, with B′(2) = −7 percent per hour. Say which reading on this screen corresponds to −7 and which is the charge that is left.'
    },
    temp: {
        idea: 'The sign of a quantity and the sign of its rate answer two different questions about the same object.',
        mistake: 'Reading T′ > 0 as “above zero.” At t = 6.5 the soup is −11.25 °C and its temperature is rising.',
        transfer: 'A bank balance D(t) in dollars has D′(4) = −$35 per day. Is the account overdrawn, and what do you actually know about day 4?'
    },
    pop: {
        idea: 'A rate near zero means the quantity is barely changing at that instant, whatever its size.',
        mistake: 'Reading P′(6) = 0 as the end of the colony. It is the peak at 560 birds, where the size stops changing for a moment.',
        transfer: 'A water level is H(90) = 140 cm with H′(90) = 0.01 cm/min. Describe the scene in one sentence, and say which reading is the height and which is the gap.'
    }
};

export default {
    id: 'u4-applied-rate',
    meta: { unit: 4, topic: '4.3', title: 'Rates of Change in Applied Contexts Other Than Motion', visualizerTitle: 'Applied Rate Explorer' },
    modes: [modeDef('tank'), modeDef('temp'), modeDef('pop')]
};

function r1(v) { return String(Math.round(v * 10) / 10); }
