/* 4.1 Rate Meaning Builder. One derivative value is a sentence with five
   parts. The sentence is drawn rather than tabulated. The solid line is the amount
   now, the dashed line is where the stated rate predicts the quantity will be
   after Δ, and the drop between them is exactly rate × Δ. Five contexts share
   one skeleton, so each tab owns its own units and its own slider range. */

import { evaluate } from '../../js/calc-math.js?v=20260925-calc-15';

/* Each fn is written in t, which names the input quantity (minutes, years,
   items), not necessarily time. `given` is the stated rate and equals the true
   derivative of fn at anchor, so the drawn drop is never a fudge. */
const CTX = {
    tank: {
        name: 'W', tab: 'Water tank', fn: '52 - 2t - 0.04t^2', anchor: 5, given: -2.4,
        tMin: 0.5, tMax: 9.5, dMax: 3, d: 1,
        qsym: 't', money: false,
        outAbbr: 'gal', sliderIn: 'min',
        inWord: ['minute', 'minutes'], outWord: ['gallon', 'gallons'],
        noun: 'water in the tank', short: 'water level',
        axisIn: 'Time (min)', axisOut: 'Water in the tank (gal)',
        graphTitle: 'Water level and local rate at t = 5',
        increaseLabel: 'Change in time', currentLabel: 'Base time',
        window: [0, 12, 0, 55], wallL: 0.35, wallR: 11.65,
        story: 'Water in the tank, in gallons, and t is time in minutes. The tank is leaking, and W′(5) = −2.4 gallons per minute.'
    },
    pop: {
        name: 'P', tab: 'Population', fn: '500 + 60t + 10t^2', anchor: 3, given: 120,
        tMin: 0.5, tMax: 6, dMax: 2.5, d: 1,
        qsym: 't', money: false,
        outAbbr: 'people', sliderIn: 'yr',
        inWord: ['year', 'years'], outWord: ['person', 'people'],
        noun: 'population', short: 'population',
        axisIn: 'Time (years)', axisOut: 'Population (people)',
        graphTitle: 'Population and local rate at t = 3',
        increaseLabel: 'Increase the time by', currentLabel: 'Current time',
        window: [0, 6, 0, 1300],
        story: 'P(t) is the population of a town, in people, and t is time in years. P′(3) = 120 people per year.'
    },
    temp: {
        name: 'T', tab: 'Temperature', fn: '4 - 0.8t', anchor: 6, given: -0.8,
        tMin: 0.5, tMax: 9.5, dMax: 3, d: 1,
        qsym: 't', money: false,
        outAbbr: '°C', sliderIn: 'h',
        inWord: ['hour', 'hours'], outWord: ['degree', 'degrees'],
        noun: 'temperature', short: 'temperature',
        axisIn: 'Time (hours)', axisOut: 'Temperature (°C)',
        graphTitle: 'Temperature and local rate at t = 6',
        increaseLabel: 'Increase the time by', currentLabel: 'Current time',
        zeroLine: 'Freezing point (0 °C)', window: [0, 10, -6, 6],
        story: 'T(t) is the temperature of a soup, in degrees Celsius, and t is time in hours. T′(6) = −0.8 °C per hour.'
    },
    cost: {
        name: 'C', tab: 'Cost', fn: '500 + 0.1t^2 + 0.002t^3', anchor: 30, given: 11.4,
        tMin: 2, tMax: 48, dMax: 12, d: 5,
        qsym: 'q', money: true,
        outAbbr: '$', sliderIn: 'items',
        inWord: ['item', 'items'], outWord: ['dollar', 'dollars'],
        noun: 'daily cost', short: 'cost',
        axisIn: 'Number of items', axisOut: 'Cost ($)',
        graphTitle: 'Cost and local rate at q = 30',
        increaseLabel: 'Increase production by', currentLabel: 'Current production',
        window: [0, 50, 0, 1050],
        story: 'C(q) is the daily cost of producing q items, in dollars. C′(30) = $11.40 per item. The input here is a number of items, not time.'
    },
    dist: {
        name: 'd', tab: 'Distance', fn: '10t - t^2/4', anchor: 2, given: 9,
        tMin: 0.5, tMax: 9.5, dMax: 4, d: 1,
        qsym: 't', money: false,
        outAbbr: 'm', sliderIn: 's',
        inWord: ['second', 'seconds'], outWord: ['meter', 'meters'],
        noun: 'distance traveled', short: 'distance',
        axisIn: 'Time (seconds)', axisOut: 'Distance (m)',
        graphTitle: 'Distance and local rate at t = 2',
        increaseLabel: 'Increase the time by', currentLabel: 'Current time',
        window: [0, 10, 0, 80],
        story: 'd(t) is the distance traveled, in meters, and t is time in seconds. d′(2) = 9 meters per second, which a physics class calls the velocity.'
    }
};

/* English word order for money: $701, not 701 $. */
function trim(v) { return String(Math.round(v * 100) / 100).replace('-', '−'); }
function money(v, two) {
    const a = Math.abs(v);
    const body = (two || a % 1 !== 0) ? a.toFixed(2) : String(a);
    return (v < 0 ? '−$' : '$') + body;
}
function amt(c, v) { return c.money ? money(v) : trim(v) + ' ' + c.outAbbr; }
function rate(c, v) {
    const amount = c.money ? money(v, true) : trim(Math.abs(v)) + ' ' + c.outWord[1];
    return (c.money ? amount : amount.replace('-', '−')) + ' per ' + c.inWord[0];
}
function rateShort(c, v) {
    return c.money ? (v < 0 ? '−$' + money(Math.abs(v), true).substring(2) : '$' + money(v, true).substring(1)) + '/' + c.inWord[0] : trim(Math.abs(v)) + ' ' + c.outAbbr + '/min';
}
function inCount(c, n) { return trim(n) + ' ' + (Math.abs(n - 1) < 1e-9 ? c.inWord[0] : c.inWord[1]); }

function modeDef(key) {
    const c = CTX[key];
    const f = x => evaluate(c.fn, { t: x });
    const curveLabel = c.noun.charAt(0).toUpperCase() + c.noun.slice(1) + ' ' + c.name + '(' + c.qsym + ')';
    return {
        label: c.tab,
        params: { t: c.anchor, d: c.d },
        compute: (env) => {
            const h = 1e-5;
            const clamp = Math.min(Math.max(env.t, c.tMin), c.tMax);
            const dd = Math.min(Math.max(env.d, 0), c.dMax);
            const val = f(c.anchor);
            return {
                tc: clamp, dd, val, rate: c.given,
                yNow: f(clamp),
                slopeNow: (f(clamp + h) - f(clamp - h)) / (2 * h),
                ahead: c.anchor + dd,
                ghost: val + c.given * dd
            };
        },
        controls: [
            { key: 'd', label: c.increaseLabel, labelSep: ': ', min: 0, max: c.dMax, step: 0.05, unit: ' ' + c.sliderIn },
            { key: 't', label: c.currentLabel, labelSep: ': ', min: c.tMin, max: c.tMax, step: 0.05, unit: ' ' + c.sliderIn, fixed: key === 'tank' }
        ],
        panes: {
            main: [
                {
                    kind: 'graph', title: c.graphTitle, height: 340,
                    window: c.window,
                    curves: () => [{ fn: f, color: 'curveA', label: curveLabel }],
                    hlines: (env) => [
                        { y: env.val, color: 'ink', dash: false },
                        { y: env.ghost, color: 'accent', label: env => 'Linear estimate at ' + c.qsym + ' = ' + trim(env.ahead) + ': ' + amt(c, env.ghost) }
                    ],
                    vlines: (env) => [{
                        x: env.ahead, color: 'accent',
                        label: ''
                    }],
                    tangents: (env) => [
                        { x: env.tc, y: env.yNow, m: env.slopeNow, color: 'auxInk', reach: 0.24, label: env => "W′(" + c.anchor + ") = " + (c.given > 0 ? '' : '−') + rateShort(c, Math.abs(c.given)) }
                    ],
                    segments: () => key === 'tank' ? [
                        { x1: c.wallL, y1: c.window[3], x2: c.wallL, y2: 0.5, color: 'auxInk' },
                        { x1: c.wallR, y1: c.window[3], x2: c.wallR, y2: 0.5, color: 'auxInk' },
                        { x1: c.wallL, y1: 0.5, x2: c.wallR, y2: 0.5, color: 'auxInk' }
                    ] : [],
                    points: (env) => [
                        { x: c.anchor, y: env.val, color: 'accent', label: () => 'W(' + c.anchor + ') = ' + trim(env.val) }
                    ],
                    notes: (env) => [
                        { x: env.ahead, y: (env.val + env.ghost) / 2, t: env => 'Predicted change: ' + amt(c, env.ghost - env.val) },
                        { x: c.window[0] + 0.2, y: c.window[3] * 0.93, t: c.axisOut },
                        { x: c.window[1] * 0.9, y: c.window[2] + (c.window[3] - c.window[2]) * 0.05, t: c.axisIn },
                        { x: (c.anchor + env.ahead) / 2, y: Math.max(env.val, env.ghost) + 3, t: "W′(" + c.anchor + ") = " + rateShort(c, c.given) }
                    ]
                },
                {
                    kind: 'readout', title: 'Value and rate of change',
                    items: () => [
                        { label: "W(" + c.anchor + ")", v: trim(f(c.anchor)) + ' gal', big: true },
                        { label: "W′(" + c.anchor + ")", v: (c.given > 0 ? '' : '−') + trim(Math.abs(c.given)) + ' gal/min', big: true, color: c.given > 0 ? 'up' : 'down' }
                    ]
                }
            ],
            side: [
                {
                    kind: 'practice', id: 'build-' + key,
                    title: 'Interpret the derivative',
                    items: () => [
                        {
                            q: 'Fill in the blank. “At ' + inCount(c, c.anchor) + ', the ' + c.short + ' is ____ at ' + rate(c, c.given) + '.”',
                            choices: ['increasing', 'decreasing'], a: c.given > 0 ? 0 : 1,
                            why: (c.given > 0
                                ? 'The derivative is positive, so the ' + c.short + ' is growing. Say “increasing at” and keep the number positive.'
                                : 'The derivative is negative, so the ' + c.short + ' is going down. Say “decreasing at” and give the positive size. “Increasing at ' + trim(c.given) + '” is not what the AP exam asks for.')
                        },
                        {
                            q: 'Which quantity is the rate of change?',
                            choices: [rate(c, c.given), amt(c, f(c.anchor)), inCount(c, c.anchor)],
                            a: 0,
                            why: 'The rate of change is ' + rate(c, c.given) + '. ' + amt(c, f(c.anchor)) + ' is the amount of ' + c.short + ', and ' + inCount(c, c.anchor) + ' is the input value. A rate is ' + c.outWord[1] + ' per ' + c.inWord[0] + ', never the other way around.'
                        }
                    ]
                }
            ]
        },
        steps: stepsFor(key, c)
    };
}

function stepsFor(key) {
    const c = CTX[key];
    const val5 = key === 'tank' ? 41 : 
                 key === 'pop' ? 770 :
                 key === 'temp' ? -0.8 :
                 key === 'cost' ? 604 :
                 19;
    
    const out = [
        {
            params: { t: c.anchor, d: c.d },
            message: c.story + ' At ' + c.anchor + ', the ' + c.noun + ' is ' + c.name + '(' + c.anchor + ') = ' + trim(val5) + '. The rate is ' + c.name + '′(' + c.anchor + ') = ' + trim(c.given) + ' per ' + c.inWord[0] + '. So one unit later, the linear estimate predicts ' + trim(val5) + ' + ' + trim(c.given * 1) + ' = ' + trim(val5 + c.given * 1) + '.'
        }
    ];
    if (key === 'pop') out.push({
        params: { t: 3, d: 1 },
        predict: {
            q: 'P(t) is a town’s population in people, with t in years, and P′(3) = 120. Which statement is correct?',
            choices: [
                'The population is increasing at 120 people per year at t = 3',
                'The population is 120 people',
                'The population grew by 120 people during the first 3 years'
            ], a: 0,
            why: 'P′(3) is the rate at the instant t = 3. It is not the population, which is P(3) = 770 people, and it is not a change over an interval, which would be P(3) − P(0).'
        },
        message: 'Read the amount off the curve and the rate off the slope of the tangent line. They are two different answers about the same point.'
    });
    if (key === 'tank') out.push({
        params: { t: 5, d: 1 },
        predict: {
            q: 'A student says, “At 5 minutes, the water level is increasing at −2.4 gallons per minute.” What is wrong with that statement?',
            choices: ['Nothing is wrong. The number already carries the sign.', 'The statement should say decreasing at 2.4 gallons per minute.', 'The units should be minutes per gallon.'], a: 1,
            why: 'A negative derivative means the quantity is going down. Report it as “decreasing at 2.4 gallons per minute,” with the positive size and units of output per input.'
        },
        message: 'The solid line shows the current amount. The dashed line shows where that rate predicts the quantity will be after Δt units. Over 1 unit the predicted change is W′(' + c.anchor + ') × 1 = ' + trim(c.given * 1) + '.'
    });
    if (key === 'temp') out.push({
        params: { t: 6, d: 1 },
        predict: {
            q: 'At t = 6 hours the soup has T(6) = −0.8 °C and T′(6) = −0.8 °C per hour. Which statement about the soup is correct?',
            choices: ['It is below freezing and still cooling', 'It is at 0 °C and warming up', 'The two signs contradict each other'], a: 0,
            why: 'The value says where it stands, −0.8 °C, just under freezing. The rate says where it is heading, another 0.8 °C lower each hour. A quantity and its rate each have their own sign.'
        },
        message: 'Set the increase slider to 3 hours and watch the dashed line drop past the 0 °C line. The estimate is 2.4 °C lower, and here it is exact, because this temperature is a linear function.'
    });
    if (key === 'cost') out.push({
        params: { t: 30, d: 10 },
        predict: {
            q: 'If production increases from 30 to 40 items, about how much should the cost increase?',
            choices: ['About $114', 'Exactly $114', 'The total cost becomes $11.40'], a: 0,
            why: 'About $114. C′(30) = $11.40 per item means that near q = 30 each extra item adds about $11.40, so 10 more items give a linear estimate of 10 × 11.40 = $114. The real increase is larger, because the cost curve bends upward here.'
        },
        message: 'The input is items instead of minutes, and nothing about the sentence changed. Drag the dot toward q = 45 and watch the rate of change climb, which is why the dashed line runs below the curve.'
    });
    if (key === 'dist') out.push({
        params: { t: 2, d: 1 },
        predict: {
            q: 'd(t) is distance in meters and t is time in seconds. In physics language, what is d′(2) = 9 m/s?',
            choices: ['The velocity at t = 2 s', 'The average velocity from 0 to 2 s', 'The distance traveled by t = 2 s'], a: 0,
            why: 'The rate of change of position with respect to time is velocity. The distance by then is d(2) = 19 m, and the average velocity over the first 2 seconds is a different number, 9.5 m/s.'
        },
        message: 'The same derivative has two vocabularies. Say it as a rate, then say it as a velocity. The dashed line does not change.'
    });
    return out;
}

export default {
    id: 'u4-rate-meaning',
    meta: { unit: 4, topic: '4.1', title: 'Interpreting the Meaning of the Derivative in Context', visualizerTitle: 'Rate Meaning Builder' },
    modes: ['tank', 'pop', 'temp', 'cost', 'dist'].map(modeDef),
    summary: {
        idea: 'A derivative tells how fast one quantity changes with respect to another, at a single instant. Its units are output units per input unit, and its sign gives the direction rather than the size.',
        mistake: 'Reading f′(a) as the quantity itself. P′(3) = 120 does not mean the town has 120 people, and it is not the growth over the first 3 years. It is the rate at the instant t = 3. Over a change of Δ in the input it estimates a change of about f′(a)·Δ.',
        transfer: 'A balloon has volume V(t) liters, with t in seconds, and V′(4) = −0.3 L/s. Write the interpretation as one sentence, then estimate the volume at t = 6 if that rate held.'
    }
};
