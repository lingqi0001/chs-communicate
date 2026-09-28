/* 4.1 Rate Meaning Builder. P0 boundary: this lesson interprets a derivative
   at one instant. It deliberately holds nothing that projects a quantity
   forward in time, nothing that multiplies a rate by an input horizon, and
   nothing that compares a projected value with a later true value. Those
   ideas belong to 4.6 and must not creep back in here. Motion language
   belongs to 4.2, so no tab rides a car or names a velocity.
   The single goal: given f(a), f′(a), variable definitions and units, the
   student says what f′(a) means at that instant. Every scene is a measuring
   instrument for the current quantity (a waterline, a population meter on a
   0 to 1000 people scale, a Celsius thermometer, a production conveyor, an
   mg/L vial) plus one neutral rate marker, and every drawn element answers
   to a number on the readout.
   Direction words, colored arrows, the unit breakdown, the piece-by-piece
   decoder and the interpretation sentence appear only after the questions
   that test them have been answered, so no prediction is ever spoiled by
   the picture. Each context runs the same cognitive skeleton: value-versus-
   rate reveal, then prediction questions, at most three interactions. */

import { evaluate } from '../../js/calc-math.js?v=20260925-calc-15';

/* Each fn is written in t, which names the input quantity (minutes, years,
   items), not necessarily time. `given` is the stated rate and equals the
   true derivative of fn at anchor. `say` is the correct in-context sentence,
   revealed only at revealStage. unitStage frames where the derivative unit
   is spelled out, frameStage the sentence frame. mask (cost only) hides the
   derivative units until unitStage, because that context asks for them. */
const CTX = {
    tank: {
        name: 'W', tab: 'Water tank', fn: '52 - 2t - 0.04t^2', anchor: 5, given: -2.4,
        qsym: 't', money: false,
        outAbbr: 'gal', sliderIn: 'min',
        inWord: ['minute', 'minutes'], outWord: ['gallon', 'gallons'],
        noun: 'water in the tank', short: 'water level',
        axisIn: 'Time (min)', axisOut: 'Water in the tank (gal)',
        graphTitle: 'Height is the amount, slope is the rate',
        window: [0, 12, 0, 55],
        /* container height maps 1 to 1 onto the curve window, so the water
           level in the scene and the curve height always read the same */
        scene: { window: [0, 12, 0, 6], sBase: 0.5, sTop: 5.7, vFull: 52, vFloor: 0.5 },
        sceneTitle: 'The tank right now',
        story: 'W(t) is the volume of water in the tank, in gallons, and t is time in minutes. W′(5) = −2.4 gallons per minute.',
        say: 'At 5 minutes, the volume of water in the tank is decreasing at 2.4 gallons per minute.',
        revealStage: 3, unitStage: 3, frameStage: 4, mask: false
    },
    pop: {
        name: 'P', tab: 'Population', fn: '500 + 60t + 10t^2', anchor: 3, given: 120,
        qsym: 't', money: false,
        outAbbr: 'people', sliderIn: 'yr',
        inWord: ['year', 'years'], outWord: ['person', 'people'],
        noun: 'population', short: 'population',
        axisIn: 'Time (years)', axisOut: 'Population (people)',
        graphTitle: 'Height is the amount, slope is the rate',
        window: [0, 6, 0, 1300],
        /* the meter runs on its own 0 to 1000 people scale through the same
           linear map the tank uses, so the filled height is the amount
           exactly: 0 people sits at sBase, 1000 people at sTop */
        scene: { window: [0, 12, 0, 8.5], sBase: 0.6, sTop: 7.6, vFull: 1000, tubeL: 1.5, tubeR: 4.5, colL: 1.56, colR: 4.44 },
        sceneTitle: 'The town right now, on a 0 to 1000 people scale',
        story: 'P(t) is the population of a town, in people, and t is time in years. P′(3) = 120 people per year.',
        say: 'At year 3, the population is increasing at 120 people per year.',
        revealStage: 2, unitStage: 2, frameStage: 2, mask: false
    },
    temp: {
        name: 'T', tab: 'Temperature', fn: '3 - 0.8t', anchor: 6, given: -0.8,
        qsym: 't', money: false,
        outAbbr: '°C', sliderIn: 'h',
        inWord: ['hour', 'hours'], outWord: ['degree', 'degrees'],
        noun: 'temperature', short: 'temperature',
        axisIn: 'Time (hours)', axisOut: 'Temperature (°C)',
        graphTitle: 'Height is the reading, slope is the rate',
        zeroLine: 'Freezing point (0 °C)',
        window: [0, 10, -6, 6],
        /* the thermometer tube carries the curve window's own Celsius scale,
           so the top of the column and the point on the curve always sit at
           the same height */
        scene: { window: [0, 12, -6, 6], tubeL: 5.0, tubeR: 6.3, colL: 5.2, colR: 6.1, bottom: -5.4 },
        sceneTitle: 'The reading right now, on a Celsius scale',
        story: 'T(t) is the temperature of a soup, in degrees Celsius, and t is time in hours. T′(6) = −0.8 °C per hour.',
        say: 'At 6 hours, the soup is below 0 °C and its temperature is decreasing at 0.8 °C per hour.',
        revealStage: 2, unitStage: 2, frameStage: 2, mask: false
    },
    cost: {
        name: 'C', tab: 'Cost', fn: '500 + 0.1t^2 + 0.002t^3', anchor: 30, given: 11.4,
        qsym: 'q', money: true,
        outAbbr: '$', sliderIn: 'items',
        inWord: ['item', 'items'], outWord: ['dollar', 'dollars'],
        noun: 'daily cost', short: 'cost',
        axisIn: 'Number of items', axisOut: 'Cost ($)',
        graphTitle: 'Height is the bill, slope is the rate',
        window: [0, 50, 0, 1050],
        scene: { window: [0, 12, 0, 6.5], lot: 5, per: 6 },
        sceneTitle: 'One day of production right now',
        story: 'C(q) is the daily cost of producing q items, in dollars, and q is a number of items, not time. C′(30) = 11.40.',
        say: 'At a production level of 30 items, daily cost is increasing at $11.40 per additional item.',
        revealStage: 3, unitStage: 2, frameStage: 3, mask: true
    },
    med: {
        name: 'C', tab: 'Medicine', fn: '14 - 2t - 0.0375t^2', anchor: 4, given: -2.3,
        qsym: 't', money: false,
        outAbbr: 'mg/L', sliderIn: 'h',
        inWord: ['hour', 'hours'], outWord: ['milligram per liter', 'milligrams per liter'],
        noun: 'medicine concentration', short: 'concentration',
        axisIn: 'Time (hours)', axisOut: 'Concentration (mg/L)',
        graphTitle: 'Height is the concentration, slope is the rate',
        window: [0, 10, 0, 15],
        /* the vial shares the curve window's mg/L scale, so the liquid line
           and the curve point read at the same height */
        scene: { window: [0, 12, 0, 15], tubeL: 5.0, tubeR: 6.3, colL: 5.2, colR: 6.1 },
        sceneTitle: 'The blood vial right now, on an mg/L scale',
        story: 'C(t) is the concentration of a medicine in the blood, in mg/L, and t is time in hours. C′(4) = −2.3 mg/L per hour.',
        say: 'At 4 hours, the concentration is 5.4 mg/L, still well above zero, and it is decreasing at 2.3 mg/L per hour.',
        revealStage: 2, unitStage: 2, frameStage: 3, mask: false
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
    /* the size always prints positive, because the sentence that goes with it
       supplies the direction as the word increasing or decreasing */
    const amount = c.money ? money(Math.abs(v), true) : trim(Math.abs(v)) + ' ' + c.outWord[1];
    return amount + ' per ' + c.inWord[0];
}
/* Short form for picture labels: −2.4 gal/min, 120 people/yr. The input unit
   comes from the context, never from a hard-coded minute. */
function rateShort(c, v) {
    const sign = v < 0 ? '−' : '';
    const size = Math.abs(v);
    return c.money
        ? sign + '$' + size.toFixed(2) + '/' + c.inWord[0]
        : sign + trim(size) + ' ' + c.outAbbr + '/' + c.sliderIn;
}
/* The cost question asks for the units themselves, so until unitStage the
   scene and the readout show the bare number and nothing else. */
function markRateShort(c, env, v) {
    return c.mask && env.stage < c.unitStage ? trim(v) : rateShort(c, v);
}
function dirWord(c) { return c.given > 0 ? 'increasing' : 'decreasing'; }
function dirColor(c) { return c.given > 0 ? 'up' : 'down'; }
/* the decoder table waits for the last question stage of the context, and
   its input phrase adapts to contexts whose input is not time */
function decoderStage(c) { return Math.max(c.revealStage, c.unitStage, c.frameStage); }
function atPhrase(c) {
    return c.qsym === 't'
        ? trim(c.anchor) + ' ' + c.inWord[1]
        : 'a production level of ' + trim(c.anchor) + ' ' + c.inWord[1];
}
function rateUnitShort(c) { return c.outAbbr + '/' + c.sliderIn; }

function modeDef(key) {
    const c = CTX[key];
    const f = x => evaluate(c.fn, { t: x });
    const s = c.scene;
    /* one mapping helper per scene: a monotone linear function of the
       quantity, so a higher amount is always a higher element and the
       picture can never contradict the number beside it */
    const level = v => s.sBase === undefined ? 0 : s.sBase + (v / s.vFull) * (s.sTop - s.sBase);
    const colTop = v => Math.max(s.window[2] + 0.15, Math.min(s.window[3] - 0.15, v));
    const curveLabel = c.short.charAt(0).toUpperCase() + c.short.slice(1) + ' ' + c.name + '(' + c.qsym + ')';
    const rateFact = env => c.name + '′(' + trim(c.anchor) + ') = ' + markRateShort(c, env, c.given);
    return {
        label: c.tab,
        intro: 'Two numbers describe this situation, and they answer different questions. One tells how much there is. The other tells how fast it is changing right now. Your job on this page is to read the second one out loud in plain English.',
        params: { stage: 0 },
        compute: () => {
            const h = 1e-5;
            const val = f(c.anchor);
            return {
                val,
                yNow: val,
                slopeNow: (f(c.anchor + h) - f(c.anchor - h)) / (2 * h),
                wNow: level(val),
                colNow: colTop(val),
                /* the cost scene draws the INPUT (items) as boxes, one box per
                   lot items, and the amount (dollars) on the label */
                boxes: s.lot ? Math.round(c.anchor / s.lot) : 0,
                /* the med vial shares the column helper: its window is the
                   mg/L scale itself */
                colMed: colTop(val)
            };
        },
        /* no controls: every mode is a fixed statement at its anchor. A slider
           over the input would drift the readout and the scene away from the
           derivative the questions quote. */
        panes: {
            main: [
                /* the context sentence, word by word. No direction is implied
                   here, only the stated facts and the units of the variables. */
                {
                    kind: 'note', title: 'Context',
                    when: env => env.stage >= 1,
                    text: () => c.story
                },
                /* the scene: the current state drawn, nothing more. Solid
                   elements are the amount now, one neutral marker states the
                   rate, and the direction appears only at revealStage. */
                {
                    kind: 'graph', title: c.sceneTitle, height: 300,
                    window: s.window, grid: false, ticks: false,
                    segments: (env) => {
                        if (key === 'tank') {
                            /* the tank, its drain stub, the current waterline.
                               The drain stub is physical, the direction arrow
                               beside it is a claim and waits for revealStage */
                            const g = [
                                { x1: 1.5, y1: s.sTop, x2: 1.5, y2: s.sBase, color: 'ink' },
                                { x1: 7.5, y1: s.sTop, x2: 7.5, y2: s.sBase, color: 'ink' },
                                { x1: 1.5, y1: s.sBase, x2: 7.5, y2: s.sBase, color: 'ink' },
                                { x1: 7.5, y1: 1.1, x2: 8.5, y2: 1.1, color: 'ink' },
                                { x1: 1.5, y1: env.wNow, x2: 7.5, y2: env.wNow, color: 'accent' }
                            ];
                            if (env.stage >= c.revealStage) {
                                g.push({ x1: 8.3, y1: 1.0, x2: 8.3, y2: 0.15, color: 'down', arrow: 'end' });
                            }
                            return g;
                        }
                        if (key === 'pop') {
                            /* the meter: two walls, a closed bottom, the filled
                               line at the current amount and a people scale on
                               the right wall. The direction arrow is a claim,
                               so it waits for revealStage */
                            const g = [
                                { x1: s.tubeL, y1: s.sTop, x2: s.tubeL, y2: s.sBase, color: 'ink' },
                                { x1: s.tubeR, y1: s.sTop, x2: s.tubeR, y2: s.sBase, color: 'ink' },
                                { x1: s.tubeL, y1: s.sBase, x2: s.tubeR, y2: s.sBase, color: 'ink' },
                                { x1: s.tubeR, y1: env.wNow, x2: s.tubeL, y2: env.wNow, color: 'accent' }
                            ];
                            for (let v = 0; v <= s.vFull; v += 100) {
                                const y = level(v);
                                g.push({ x1: s.tubeR, y1: y, x2: s.tubeR + (v % 200 === 0 ? 0.5 : 0.26), y2: y, color: 'auxInk' });
                            }
                            if (env.stage >= c.revealStage) {
                                g.push(c.given > 0
                                    ? { x1: 11.15, y1: 3.7, x2: 11.15, y2: 5.7, color: 'up', arrow: 'end' }
                                    : { x1: 11.15, y1: 5.7, x2: 11.15, y2: 3.7, color: 'down', arrow: 'end' });
                            }
                            return g;
                        }
                        if (key === 'temp') {
                            /* the same measuring-vessel language as the vial:
                               two walls, a closed bottom, a Celsius scale.
                               The column hangs below the freezing line from
                               the start, because the value is not hidden,
                               only the direction of change is */
                            const g = [
                                { x1: s.tubeL, y1: s.bottom, x2: s.tubeL, y2: s.window[3] - 0.3, color: 'ink' },
                                { x1: s.tubeR, y1: s.bottom, x2: s.tubeR, y2: s.window[3] - 0.3, color: 'ink' },
                                { x1: s.tubeL, y1: s.bottom, x2: s.tubeR, y2: s.bottom, color: 'ink' },
                                { x1: 0.2, y1: 0, x2: 11.8, y2: 0, color: 'auxInk', dashed: true }
                            ];
                            for (const tick of [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]) {
                                g.push({ x1: s.tubeR, y1: tick, x2: s.tubeR + (tick % 5 === 0 ? 0.5 : 0.28), y2: tick, color: 'auxInk' });
                            }
                            if (env.stage >= c.revealStage) {
                                g.push(c.given > 0
                                    ? { x1: 7.15, y1: env.colNow, x2: 7.15, y2: env.colNow + 1.0, color: 'up', arrow: 'end' }
                                    : { x1: 7.15, y1: env.colNow, x2: 7.15, y2: env.colNow - 1.0, color: 'down', arrow: 'end' });
                            }
                            return g;
                        }
                        if (key === 'cost') {
                            /* just the conveyor belt. The numbers sit as plain
                               labels above it */
                            const g = [
                                { x1: 0.2, y1: 0.85, x2: 11.8, y2: 0.85, color: 'ink' },
                                { x1: 0.45, y1: 0.45, x2: 0.45, y2: 0.85, color: 'auxInk' },
                                { x1: 1.3, y1: 0.45, x2: 1.3, y2: 0.85, color: 'auxInk' }
                            ];
                            if (env.stage >= c.revealStage) {
                                g.push(c.given > 0
                                    ? { x1: 10.9, y1: 2.4, x2: 10.9, y2: 4.4, color: 'up', arrow: 'end' }
                                    : { x1: 10.9, y1: 4.4, x2: 10.9, y2: 2.4, color: 'down', arrow: 'end' });
                            }
                            return g;
                        }
                        /* med: a blood vial on the same mg/L scale as the
                           curve. The liquid line is the concentration now,
                           the arrow beside it is the rate and waits for
                           revealStage */
                        const g = [
                            { x1: s.tubeL, y1: 0.35, x2: s.tubeL, y2: s.window[3] - 0.3, color: 'ink' },
                            { x1: s.tubeR, y1: 0.35, x2: s.tubeR, y2: s.window[3] - 0.3, color: 'ink' },
                            { x1: s.tubeL, y1: 0.35, x2: s.tubeR, y2: 0.35, color: 'ink' },
                            { x1: 0.2, y1: 0, x2: 11.8, y2: 0, color: 'auxInk', dashed: true }
                        ];
                        for (const tick of [5, 10]) {
                            g.push({ x1: s.tubeR, y1: tick, x2: s.tubeR + 0.5, y2: tick, color: 'auxInk' });
                        }
                        if (env.stage >= c.revealStage) {
                            g.push({ x1: 7.3, y1: env.colMed, x2: 7.3, y2: env.colMed - 1.4, color: 'down', arrow: 'end' });
                        }
                        return g;
                    },
                    /* areas does the filled bodies: the water, the population
                       in the meter, the mercury column, the item boxes on the
                       belt */
                    areas: (env) => {
                        if (key === 'tank') {
                            return [{ fn: (x, e) => e.wNow, from: 1.52, to: 7.48, baseline: s.sBase, color: 'fillA' }];
                        }
                        if (key === 'pop') {
                            return [{ fn: (x, e) => e.wNow, from: s.colL, to: s.colR, baseline: s.sBase, color: 'fillA' }];
                        }
                        if (key === 'temp') {
                            return [{
                                fn: () => Math.max(0, env.colNow),
                                topFn: () => Math.min(0, env.colNow),
                                from: s.colL, to: s.colR, baseline: 0, color: 'fillA'
                            }];
                        }
                        if (key === 'cost') {
                            return Array.from({ length: env.boxes }, (_, i) => {
                                const k = Math.floor(i / s.per), j = i % s.per;
                                const x1 = 0.55 + j * 0.75 + k * 0.2;
                                return { fn: () => 1.6 + k * 0.6, from: x1, to: x1 + 0.6, baseline: 1.15 + k * 0.6, color: 'fillB' };
                            });
                        }
                        if (key === 'med') {
                            return [{ fn: (x, e) => e.colMed, from: s.colL, to: s.colR, baseline: 0.35, color: 'fillA' }];
                        }
                        return [];
                    },
                    notes: (env) => {
                        const n = [];
                        if (key === 'tank') {
                            n.push({ x: 1.7, y: env.wNow + 0.18, t: () => c.name + '(' + c.anchor + ') = ' + amt(c, env.val), color: 'ink' });
                            if (env.stage >= 1) n.push({ x: 8.55, y: 0.6, t: () => c.name + '′(' + c.anchor + ') = ' + trim(c.given) + ' ' + c.outAbbr + '/' + c.sliderIn, color: 'auxInk' });
                            if (env.stage >= c.revealStage) n.push({ x: 8.55, y: 1.35, t: () => dirWord(c) + ' ' + rate(c, c.given), color: dirColor(c) });
                        } else if (key === 'pop') {
                            for (const v of [0, 200, 400, 600, 800, 1000]) {
                                n.push({ x: s.tubeR + 0.6, y: level(v) - 0.15, t: v === s.vFull ? v + ' ' + c.outAbbr : trim(v), color: 'auxInk' });
                            }
                            n.push({ x: s.tubeR + 1.6, y: env.wNow - 0.45, t: () => c.name + '(' + c.anchor + ') = ' + amt(c, env.val), color: 'ink' });
                            if (env.stage >= 1) n.push({ x: s.tubeR + 1.6, y: 4.0, t: () => rateShort(c, c.given), color: 'auxInk' });
                            if (env.stage >= c.revealStage) n.push({ x: s.tubeR + 1.6, y: 2.9, t: () => dirWord(c) + ' ' + rate(c, c.given), color: dirColor(c) });
                        } else if (key === 'temp') {
                            n.push({ x: 0.25, y: 0.15, t: 'freezing (0 °C)', color: 'auxInk' });
                            for (const tick of [-5, 5]) n.push({ x: 6.75, y: tick - 0.18, t: tick + ' °C', color: 'auxInk' });
                            n.push({ x: 3.9, y: env.colNow, t: () => c.name + '(' + c.anchor + ') = ' + amt(c, env.val) });
                            if (env.stage >= 1) n.push({ x: 7.9, y: env.colNow - 0.9, t: () => rateShort(c, c.given), color: 'auxInk' });
                            if (env.stage >= c.revealStage) n.push({ x: 7.9, y: env.colNow + 0.15, t: () => dirWord(c) + ' ' + rate(c, c.given), color: dirColor(c) });
                        } else if (key === 'cost') {
                            n.push({ x: 0.55, y: 3.25, t: () => 'one box = ' + s.lot + ' items' });
                            n.push({ x: 0.55, y: 5.55, t: () => c.name + '(' + c.anchor + ') = ' + amt(c, env.val), color: 'ink' });
                            if (env.stage >= 1) n.push({ x: 0.55, y: 4.85, t: () => c.name + '′(' + c.anchor + ') = ' + markRateShort(c, env, c.given), color: 'auxInk' });
                            if (env.stage >= c.revealStage) n.push({ x: 0.55, y: 4.15, t: () => dirWord(c) + ' ' + rate(c, c.given), color: dirColor(c) });
                        } else {
                            n.push({ x: 3.6, y: env.colMed, t: () => c.name + '(' + c.anchor + ') = ' + amt(c, env.val) });
                            for (const tick of [5, 10]) n.push({ x: 6.95, y: tick - 0.25, t: tick + ' mg/L', color: 'auxInk' });
                            n.push({ x: 0.25, y: 0.15, t: 'zero concentration', color: 'auxInk' });
                            if (env.stage >= 1) n.push({ x: 8.1, y: env.colMed - 1.9, t: () => rateShort(c, c.given), color: 'auxInk' });
                            if (env.stage >= c.revealStage) n.push({ x: 8.1, y: env.colMed + 0.15, t: () => dirWord(c) + ' ' + rate(c, c.given), color: dirColor(c) });
                        }
                        return n;
                    }
                },
                {
                    kind: 'readout', title: 'Two different facts',
                    items: (env) => {
                        /* money has to travel as text, because fmt strips the
                           last zero off $11.40 and cannot prefix a dollar
                           sign. The rate keeps the ink color until
                           revealStage, so the arrow color cannot pre-answer
                           the direction question. */
                        const amount = c.money ? money(f(c.anchor)) : f(c.anchor);
                        const rateV = c.money ? money(c.given, true) : c.given;
                        return [
                            { label: c.name + '(' + c.anchor + ')', v: amount, unit: c.money ? '' : c.outAbbr, big: true },
                            {
                                label: c.name + '′(' + c.anchor + ')', v: rateV,
                                unit: env2 => c.mask && env2.stage < c.unitStage
                                    ? ''
                                    : (c.money ? 'per ' + c.inWord[0] : c.outWord[1] + ' per ' + c.inWord[0]),
                                big: true,
                                color: env2 => env2.stage >= c.revealStage ? dirColor(c) : 'ink'
                            }
                        ];
                    }
                },
                {
                    kind: 'equation', title: 'Where the derivative unit comes from',
                    when: env => env.stage >= c.unitStage,
                    lines: [
                        { t: 'output unit = ' + (c.money ? 'dollars' : c.outWord[1]) },
                        { t: 'input unit = ' + c.inWord[1] },
                        { t: 'derivative unit = ' + (c.money ? 'dollars per ' + c.inWord[0] : c.outWord[1] + ' per ' + c.inWord[0]), hl: true }
                    ]
                },
                /* the decoder reads the whole statement piece by piece. It is
                   gated on the LATEST question stage of this context, so no
                   piece of it sits on screen while a question still wants an
                   answer. */
                {
                    kind: 'table', title: 'Read the derivative, piece by piece',
                    when: env => env.stage >= decoderStage(c),
                    cols: ['this part', 'it is'],
                    rows: [
                        [c.name + ' alone', 'the output quantity: ' + c.noun],
                        ['the ′ mark', 'instantaneous rate of change'],
                        ['the (' + c.anchor + ')', 'at ' + atPhrase(c)],
                        [c.given < 0 ? 'the − sign' : 'the + sign', c.given < 0 ? 'decreasing at that input' : 'increasing at that input'],
                        ['the ' + trim(Math.abs(c.given)), 'the size of the rate'],
                        ['the ' + rateUnitShort(c), 'output unit per input unit']
                    ]
                },
                {
                    kind: 'note', title: 'Interpretation',
                    when: env => env.stage >= c.revealStage,
                    text: () => c.say
                },
                {
                    kind: 'note', title: 'Say it in one sentence',
                    when: env => env.stage >= c.frameStage,
                    text: 'At [input value] [input units], the [output quantity] is [increasing, decreasing, or not changing instantaneously] at [size] [output units] per [input unit]. Use the frame only as a check. On the AP exam your sentence should still read naturally.'
                }
            ],
            side: [
                /* the function graph as secondary evidence: height is the
                   amount, slope is the rate, at the one stated input. It
                   arrives one step after the scene and the two facts, and it
                   never carries a projected value. */
                {
                    kind: 'graph', title: c.graphTitle, height: 340,
                    when: env => env.stage >= 1,
                    window: c.window,
                    curves: () => [{ fn: f, color: 'curveA', label: curveLabel }],
                    hlines: (env) => [
                        /* the soup context declares its own reference line, so
                           it has to be drawn */
                        ...(c.zeroLine ? [{ y: 0, color: 'auxInk', dash: false, label: c.zeroLine }] : [])
                    ],
                    tangents: (env) => [
                        {
                            x: c.anchor, y: env.yNow, m: env.slopeNow, color: 'auxInk', reach: 0.24,
                            label: env => c.name + '′(' + trim(c.anchor) + ') = ' + markRateShort(c, env, env.slopeNow)
                        }
                    ],
                    points: (env) => [
                        { x: c.anchor, y: env.yNow, color: 'accent', label: () => c.name + '(' + trim(c.anchor) + ') = ' + amt(c, env.yNow) }
                    ],
                    vlines: () => [{ x: c.anchor, color: 'auxInk', label: '' }],
                    notes: (env) => [
                        { x: c.window[0] + 0.2, y: c.window[3] * 0.93, t: c.axisOut },
                        { x: c.window[1] * 0.9, y: c.window[2] + (c.window[3] - c.window[2]) * 0.05, t: c.axisIn }
                    ]
                },
                {
                    kind: 'note', title: 'What the picture shows',
                    text: SCENE_NOTE[key]
                }
            ]
        },
        steps: stepsFor(key),
        summary: summaryFor(key)
    };
}

/* One legend per scene, naming each drawn element with the words it stands
   for. Every legend states only the current state. */
const SCENE_NOTE = {
    tank: 'The tank is drawn to scale, so the solid waterline is the amount: it sits at W(5) = 41 gal. The label at the drain states the rate, W′(5) = −2.4 gal/min. Nothing in this scene claims where the water goes later.',
    pop: 'The meter is drawn on a scale from 0 to 1000 people, so its filled height is the amount: the line sits at P(3) = 770 people, just below the 800 mark. The label states the rate, 120 people per year, and the arrow appears only once you have read the rate yourself.',
    temp: 'The thermometer carries the Celsius scale itself, so the column top reads T(6) = −1.8 °C, below the dashed freezing line. The label beside it states the rate, −0.8 °C per hour. The value and the rate each carry their own sign.',
    cost: 'Each box on the conveyor stands for 5 items, and the boxes add up to q = 30. The label above the belt carries the two facts apart: C(30) = $644 is the amount, and C′(30) = 11.40 is the rate whose units you will name yourself.',
    med: 'The vial is drawn on the mg/L scale, so the liquid line is the concentration right now: C(4) = 5.4 mg/L, a positive amount. The label at the arrow states the rate, C′(4) = −2.3 mg/L per hour. Above zero and falling at the same time.'
};

/* Every mode walks the same cognitive skeleton: a value-versus-rate reveal,
   then prediction questions whose distractors each carry a named
   misconception, then the interpretation and the sentence frame. The runtime
   shows steps[idx].predict before steps[idx].params land, so a step that
   asks a question keeps the scene neutral, and the following stage reveals
   the answer state. */
const READ_OUT = {
    tank: 'Here W(5) = 41 gal is the amount of water at 5 minutes, and W′(5) = −2.4 gal/min is the rate at that same instant.',
    pop: 'Here P(3) = 770 people is the amount at year 3, and P′(3) = 120 people per year is the rate at that same instant.',
    temp: 'Here T(6) = −1.8 °C is the reading at 6 hours, and T′(6) = −0.8 °C per hour is the rate at that same instant. One says how cold, the other says how fast.',
    cost: 'Here C(30) = $644 is the amount at a production level of 30 items, and C′(30) = 11.40 is the rate at that same level. The input is items, not time.',
    med: 'Here C(4) = 5.4 mg/L is the concentration at 4 hours, and C′(4) = −2.3 mg/L per hour is the rate at that same instant. The medicine is still in the blood, and the level is falling.'
};
const HEAD = 'Two numbers can describe the same situation but answer different questions. A function value tells the amount or state. A derivative tells how that quantity is changing at one instant. ';

function stepsFor(key) {
    const c = CTX[key];
    if (key === 'tank') return [
        { params: { stage: 1 }, message: HEAD + READ_OUT.tank },
        {
            params: { stage: 2 },
            predict: {
                q: 'W′(5) = −2.4 gallons per minute. Which quantity is changing?',
                choices: [
                    'The volume of water in the tank',
                    'Time',
                    'The number 5',
                    'Gallons per minute'
                ], a: 0,
                whyBy: [
                    'Correct. W is the volume, so W′ describes how the volume changes. Time is the input with respect to which that change is measured.',
                    'Time is the independent variable. W′ tells how W changes as time changes.',
                    'The 5 identifies the instant: five minutes. It is not the quantity whose rate is being measured.',
                    'Gallons per minute is the unit of the rate, not the quantity itself.'
                ]
            },
            message: 'W is the volume function, so W′ describes how the volume of water changes as time passes. The 5 marks the instant, and gallons per minute are the units of that rate.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'At t = 5 minutes, W′(5) = −2.4 gallons per minute. Which sentence is mathematically correct?',
                choices: [
                    'At 5 minutes, the tank contains −2.4 gallons.',
                    'At 5 minutes, the volume is decreasing at 2.4 gallons per minute.',
                    'During the first 5 minutes, the tank lost 2.4 gallons.',
                    'At 5 minutes, time is decreasing by 2.4 minutes per gallon.'
                ], a: 1,
                whyBy: [
                    'W′(5) is a rate, not an amount. The tank holds W(5) = 41 gallons, and a negative rate does not mean a negative amount of water.',
                    'The derivative describes an instantaneous rate. The negative sign gives the direction, so say decreasing at 2.4 gallons per minute, with the positive size.',
                    'That reads an instantaneous rate as a change over an interval. The loss during the first 5 minutes compares W(0) with W(5), and −2.4 gal/min describes only the instant t = 5.',
                    'The units run the wrong way. Gallons per minute, not minutes per gallon, because W is the output and t is the input.'
                ]
            },
            message: 'Say the direction as a word and keep the size positive. The scene now shows the arrow, and the unit line beside it shows where gallons per minute comes from.'
        },
        {
            params: { stage: 4 },
            message: 'The frame below rebuilds the sentence from the parts: input value and unit, output quantity, direction, size, output unit per input unit. Take it to the other tabs and use it as a check, not a script.'
        }
    ];
    if (key === 'pop') return [
        { params: { stage: 1 }, message: HEAD + READ_OUT.pop },
        {
            params: { stage: 2 },
            predict: {
                q: 'P(t) is a town’s population in people, with t in years, and P′(3) = 120 people per year. Which statement is correct?',
                choices: [
                    'At year 3, the population is increasing at 120 people per year.',
                    'The population of the town is 120 people.',
                    'The population grew by exactly 120 people during the first 3 years.',
                    'Time is increasing at 120 years per person.'
                ], a: 0,
                whyBy: [
                    'Correct. P′(3) is the rate at the instant t = 3, and a positive rate says the population is climbing at that moment.',
                    'That reads the rate as the amount. The population is P(3) = 770 people, and 120 is the rate, in people per year.',
                    'That reads an instantaneous rate as a change over an interval. The change during the first 3 years is P(3) − P(0), a different number.',
                    'The units are inverted. The rate is people per year, and time is the input, not the quantity being tracked.'
                ]
            },
            message: 'P′(3) is the rate at the instant t = 3. It is neither the population nor the growth over an interval. The arrow in the scene now shows what the positive sign means: the population is increasing at 120 people per year.'
        }
    ];
    if (key === 'temp') return [
        { params: { stage: 1 }, message: HEAD + READ_OUT.temp },
        {
            params: { stage: 2 },
            predict: {
                q: 'At t = 6 hours the soup has T(6) = −1.8 °C and T′(6) = −0.8 °C per hour. Which statement is correct?',
                choices: [
                    'At 6 hours the soup is below 0 °C and its temperature is decreasing at 0.8 °C per hour.',
                    'The temperature is increasing because −1.8 °C is below zero.',
                    'The soup is frozen solid, so T′(6) = 0.',
                    'The soup has cooled by 0.8 °C during the first 6 hours.'
                ], a: 0,
                whyBy: [
                    'Correct. The value says where the reading stands, and the rate says how the reading moves at that instant. Each carries its own sign.',
                    'The sign of the value says where the quantity sits. The sign of the rate says which way it moves. A temperature below zero can still be falling.',
                    'A reading below zero is not a stopped reading. The column is still sliding down at 0.8 degrees each hour.',
                    'That reads the instantaneous rate as an interval change. The reading has moved from 3 °C to −1.8 °C in 6 hours, and −0.8 °C per hour describes only the instant t = 6.'
                ]
            },
            message: 'The value and the rate each have their own sign. The column hangs below the freezing line because T(6) is negative, and the arrow points down because T′(6) is negative. Two different facts, two different jobs.'
        }
    ];
    if (key === 'cost') return [
        { params: { stage: 1 }, message: HEAD + READ_OUT.cost },
        {
            params: { stage: 2 },
            predict: {
                q: 'C(q) is the daily cost in dollars of producing q items, and C′(30) = 11.40. What are the correct units of C′(30)?',
                choices: [
                    'dollars per item',
                    'items per dollar',
                    'dollars',
                    'dollars per minute'
                ], a: 0,
                whyBy: [
                    'Correct. A derivative always has output units divided by input units. Here that is dollars per item, and no time is involved.',
                    'That flips the ratio. Cost is the output and items are the input.',
                    'That is the unit of C, the amount. The rate needs a per.',
                    'There is no time variable in this context. The input is a number of items.'
                ]
            },
            message: 'Derivative units are output units per input unit. The input here is items, so the rate reads $11.40 per item. Time is not required.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'C′(30) = 11.40 dollars per item. Which statement is correct?',
                choices: [
                    'At a production level of 30 items, daily cost is increasing at $11.40 per additional item.',
                    'The total daily cost is $11.40.',
                    'Production increases at $11.40 per minute.',
                    'One dollar buys 11.40 items.'
                ], a: 0,
                whyBy: [
                    'Correct. C(30) = $644 is the amount, and the positive rate adds $11.40 for each additional item at that production level.',
                    'That reads the rate as the amount. The total daily cost is C(30) = $644.',
                    'The input is items, not minutes. Nothing here tracks time.',
                    'That inverts the units. Dollars per item, not items per dollar.'
                ]
            },
            message: 'Even with an input that is not time, the sentence keeps the same parts: the input value, the quantity, the direction, the size, dollars per item. A student who cannot switch because q is not minutes has memorized a water tank instead of a derivative.'
        }
    ];
    /* med carries the final contextual transfer plus the zero-derivative
       check from the spec, asked in a fresh context the scene never drew. */
    return [
        { params: { stage: 1 }, message: HEAD + READ_OUT.med },
        {
            params: { stage: 2 },
            predict: {
                q: 'C(t) is a medicine concentration in mg/L, t is time in hours, and C′(4) = −2.3 mg/L per hour. Which statement is correct?',
                choices: [
                    'At 4 hours the concentration is decreasing, and there is still medicine in the blood.',
                    'At 4 hours the concentration is negative, so the medicine is gone.',
                    'The concentration fell by exactly 2.3 mg/L during the first 4 hours.',
                    'Time is running backwards at 2.3 hours per mg/L.'
                ], a: 0,
                whyBy: [
                    'Correct. The value C(4) = 5.4 mg/L is positive, so the medicine is there, and the negative rate only says the level is falling at that instant.',
                    'That confuses the sign of the rate with the sign of the value. A falling concentration is still a positive amount of medicine.',
                    'That reads an instantaneous rate as an interval change. The drop over the first 4 hours compares C(0) = 14 with C(4) = 5.4.',
                    'The units run the wrong way. Milligrams per liter is the output and hours are the input.'
                ]
            },
            message: 'Above zero and falling at the same time. The value answers how much, the rate answers which way and how fast, and the two signs never talk to each other.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Last check in a new context. B(t) is a bacteria count in thousands, t is time in hours, and B′(4) = 0. Which statement is correct?',
                choices: [
                    'At t = 4 hours the bacteria population is not changing instantaneously.',
                    'There are zero bacteria at t = 4 hours.',
                    'The population never changes again after t = 4 hours.',
                    'B(t) is constant for every value of t.'
                ], a: 0,
                whyBy: [
                    'Correct. A derivative of 0 means the quantity is not changing at that one instant. B′(4) = 0 does not tell us what B(4) is, and it does not tell us what happens after t = 4.',
                    'That reads the rate as the amount. A rate of 0 says the count is steady at that instant, and it says nothing at all about how many bacteria there are.',
                    'A rate at one instant says nothing about later hours. B′(4) = 0 speaks only about t = 4, and the statement gives no rate at any later time.',
                    'One zero of the derivative does not make the function constant. The given statement names a single instant, not a rate of 0 for every t.'
                ]
            },
            message: 'Zero rate is its own third case: not increasing, not decreasing, not changing at that instant. It never says the quantity is zero, and it never says the quantity stays put forever.'
        }
    ];
}

const IDEA = 'A derivative tells how fast one quantity changes with respect to another, at a single instant. Its units are output units per input unit, and its sign gives the direction of the change, not the size of the quantity.';
const TRANSFER = 'A balloon has volume V(t) in liters, with t in seconds, V(4) = 2.5 and V′(4) = −0.3. In one sentence each, say what these two statements mean, with the right units.';
const MISTAKE = {
    tank: 'Reading f′(a) as the amount. W′(5) = −2.4 does not mean the tank holds −2.4 gallons, and it is not the loss during the first 5 minutes. It is the rate at the instant t = 5.',
    pop: 'Reading f′(a) as the amount or as an interval change. P′(3) = 120 does not mean the town has 120 people, and it is not the growth over the first 3 years. It is the rate at the instant t = 3.',
    temp: 'Confusing the sign of the value with the sign of the rate. T(6) = −0.8 °C says where the reading stands. T′(6) = −0.8 °C per hour says the reading is falling at that instant. The two signs answer different questions.',
    cost: 'Reading C′(30) = 11.40 as the total cost, or importing minutes into a context whose input is items. The rate is dollars per item at a production level of 30.',
    med: 'Reading a negative rate as a negative amount. C′(4) = −2.3 mg/L per hour says the level is falling at that instant, while C(4) = 5.4 mg/L says the medicine is still very much in the blood.'
};

function summaryFor(key) {
    return { idea: IDEA, mistake: MISTAKE[key], transfer: TRANSFER };
}

export default {
    id: 'u4-rate-meaning',
    meta: { unit: 4, topic: '4.1', title: 'Interpreting the Meaning of the Derivative in Context', visualizerTitle: 'Rate Meaning Builder' },
    modes: ['tank', 'pop', 'temp', 'cost', 'med'].map(modeDef),
    summary: { idea: IDEA, mistake: MISTAKE.pop, transfer: TRANSFER }
};
