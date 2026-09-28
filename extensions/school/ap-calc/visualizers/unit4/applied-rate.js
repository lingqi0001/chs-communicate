/* 4.3 Applied Rate Explorer. Product boundary (P0): decode and interpret rate
   structure across unfamiliar contexts. No local linearization. Future-value
   work belongs to topic 4.6, motion to 4.2, and related rates with respect to
   time to 4.4 and 4.5, so nothing here moves a clock or names a moving object,
   and the only shape any tab draws is the still circle whose radius the slider
   reads. Each of the six tabs is one structure map (INPUT, then OUTPUT,
   then RATE) revealed one answered question at a time: strip the context,
   choose the derivative notation, name the units before calculating, evaluate
   the derivative because a formula is supplied, interpret the number in one
   sentence, then check what survived the story swap (Mathematical Practice 2.A).
   Values are plain JS functions, not parsed strings, so no formula risk. The
   four tabs whose rate is not constant end with a hands on phase, and every
   element of that phase shows the slope at the input the slider reads, never a
   projected value. */

/* fmtReal keeps a true minus sign in student-facing text and trims zeros. */
function fmtReal(v) { return String(Math.round(v * 10000) / 10000).replace(/-/g, '−') }

const CASES = {
    altitude: {
        label: 'Temperature vs altitude',
        input: { symbol: 'h', name: 'altitude', unit: 'm' },
        output: { symbol: 'T', name: 'temperature', unit: '°C' },
        fn: h => 20 - 0.0065 * h,
        dfn: () => -0.0065,
        anchor: 1500,
        derivSymbol: 'T′(h)',
        evalAt: 'T′(1500)',
        givenText: 'T(h) = 20 − 0.0065h',
        rateUnit: '°C/m',
        rateUnitWords: 'degrees Celsius per meter',
        context: 'Air temperature T(h), in degrees Celsius, depends on altitude h, measured in meters. On one clear day the model is T(h) = 20 − 0.0065h. Question: what does T′ measure here?',
        boundary: { title: 'No clock in this model', text: 'Altitude is a measured position, not a time. This rate compares temperature with meters of climb, and nothing here waits for a clock.' },
        calcLines: [
            { t: 'T(h) = 20 − 0.0065h' },
            { t: 'T′(h) = −0.0065', rule: 'linear model, constant rate' },
            { t: 'T′(1500) = −0.0065 °C/m', hl: true }
        ],
        interp: 'At an altitude of 1500 meters, temperature is decreasing at 0.0065 °C per additional meter of altitude.',
        q: {
            io: {
                q: 'Before any formula work: which quantity is the input, and which is the output?',
                choices: [
                    'Input: altitude h. Output: temperature T',
                    'Input: temperature T. Output: altitude h',
                    'Input: time. The balloon carrying the probe rises',
                    'Input: the number 20. Output: the number 0.0065'
                ], a: 0,
                why: 'Correct. The model takes an altitude in meters and returns a temperature in degrees Celsius, so h is the input and T is the output.',
                whyBy: [
                    'Correct. The model takes an altitude in meters and returns a temperature in degrees Celsius, so h is the input and T is the output.',
                    'Reversed. The sentence says temperature depends on altitude, so altitude is the input.',
                    'Time never enters this model, and the balloon is a story detail, not a variable of the formula.',
                    'Those are constants inside the formula. The varying quantities are altitude and temperature.'
                ]
            },
            notation: {
                q: 'Which derivative represents the rate at which temperature changes with altitude?',
                choices: ['T′(h)', 'h′(T)', 'T(h)', 'T(h) / h'], a: 0,
                why: 'T is the output and h is the input, so the rate is dT/dh, written here as T′(h).',
                whyBy: [
                    'T is the output and h is the input, so the rate is dT/dh, written here as T′(h).',
                    'h′(T) reads the other direction: altitude as a function of temperature.',
                    'T(h) is the temperature itself. A value is not a rate.',
                    'T(h)/h is a ratio of two amounts, not a derivative.'
                ]
            },
            units: {
                q: 'What units must T′(h) have?',
                choices: [
                    '°C per meter',
                    'meters per °C',
                    '°C',
                    '°C per second'
                ], a: 0,
                why: 'Derivative units are output units divided by input units: °C/m.',
                whyBy: [
                    'Derivative units are output units divided by input units: °C/m.',
                    'That is the reciprocal ratio. The output of the derivative is temperature, so °C sits on top.',
                    'That is the unit of the output alone. A rate must still divide by the input unit.',
                    'That one invents a clock. Nothing here changes with seconds, and the input is meters.'
                ]
            },
            calc: {
                q: 'The model is T(h) = 20 − 0.0065h. What is T′(1500)?',
                choices: [fmtReal(-0.0065), '10.25', '−9.75', '20'], a: 0,
                why: 'The model is linear, so T′(h) = −0.0065 at every h, including 1500.',
                whyBy: [
                    'The model is linear, so T′(h) = −0.0065 at every h, including 1500.',
                    'That is T(1500), the temperature at that altitude. It answers how warm, not how fast.',
                    'That is the whole change 0.0065 × 1500 from the ground up. The rate itself is not multiplied by the input.',
                    'That is T(0), the temperature at ground level.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'At an altitude of 1500 meters, temperature is decreasing at 0.0065 °C per additional meter of altitude.',
                    'At 1500 m, the temperature is −0.0065 °C.',
                    'For every 1500 m of altitude, the temperature drops exactly 0.0065 °C.',
                    'Temperature decreases at 0.0065 °C per second as the probe climbs.'
                ], a: 0,
                why: 'The unit °C/m binds the number to altitude, and the sign carries the direction word decreasing.',
                whyBy: [
                    'The unit °C/m binds the number to altitude, and the sign carries the direction word decreasing.',
                    'That reads the rate as a temperature. The thermometer at 1500 m reads 10.25 °C.',
                    'That flips which number rides per meter. Each single meter carries 0.0065 °C.',
                    'A per second unit belongs to a film of the balloon rising. The model holds only temperature against altitude.'
                ]
            }
        },
        mistake: 'Reading T′(1500) = −0.0065 °C/m as the temperature at 1500 m, or as a change per second. The temperature there is 10.25 °C, and the minus sign only says decreasing.',
        transfer: 'The pressure P(h) in a mine, in kilopascals, grows with depth h in meters, and P′(800) = 9. Name the input, the output and the units of the rate before you interpret it.'
    },

    circle: {
        label: 'Circle area vs radius',
        input: { symbol: 'r', name: 'radius', unit: 'cm' },
        output: { symbol: 'A', name: 'area', unit: 'cm²' },
        fn: r => Math.PI * r * r,
        dfn: r => 2 * Math.PI * r,
        anchor: 3,
        derivSymbol: 'A′(r)',
        evalAt: 'A′(3)',
        givenText: 'A(r) = πr²',
        rateUnit: 'cm²/cm',
        rateUnitWords: 'cm² per cm',
        context: 'The area A(r) of a circle, in square centimeters, depends on its radius r, in centimeters. The model is A(r) = πr², checked at a radius of 3 cm. Question: what does A′ measure here?',
        boundary: { title: 'Why this is not related rates', text: 'This rate compares area with radius. No dr/dt and no dA/dt appear anywhere, so no time and no related-rates machinery is involved.' },
        calcLines: [
            { t: 'A(r) = πr²' },
            { t: 'A′(r) = 2πr', rule: 'power rule' },
            { t: 'A′(3) = 6π cm² per cm', hl: true }
        ],
        interp: 'At a radius of 3 cm, the area changes at 6π square centimeters per additional centimeter of radius.',
        q: {
            io: {
                q: 'Which quantity is the input, and which is the output?',
                choices: [
                    'Input: area A. Output: radius r',
                    'Input: radius r. Output: area A(r)',
                    'Input: the number 3. Output: the symbol π',
                    'Input: time. The circle expands as seconds pass'
                ], a: 1,
                why: 'Correct. Pick a radius in centimeters, and the formula returns the area it produces.',
                whyBy: [
                    'Reversed. The radius is chosen first, and the area answers with it.',
                    'Correct. Pick a radius in centimeters, and the formula returns the area it produces.',
                    '3 is only where this tab asks its question, and π never varies. Neither one is the input quantity.',
                    'This model has no clock. Nothing is expanding over time.'
                ]
            },
            notation: {
                q: 'Which derivative compares area with radius?',
                choices: ['A′(r)', 'r′(A)', 'dA/dt', 'A(r) / r'], a: 0,
                why: 'A is the output and r is the input, so the rate is dA/dr, written A′(r).',
                whyBy: [
                    'A is the output and r is the input, so the rate is dA/dr, written A′(r).',
                    'r′(A) is the rate of the radius with respect to the area, the other direction.',
                    'dA/dt compares area with time. There is no clock here, so this is not a related rates question.',
                    'A(r)/r is a plain ratio of two amounts, not a derivative.'
                ]
            },
            units: {
                q: 'What units must A′(r) have?',
                choices: [
                    'cm per cm²',
                    'square centimeters per centimeter',
                    'square centimeters',
                    'square centimeters per second'
                ], a: 1,
                why: 'Correct: the output cm² over the input cm, so cm²/cm.',
                whyBy: [
                    'That is input over output. The derivative reports output per input.',
                    'Correct: the output cm² over the input cm, so cm²/cm.',
                    'The output unit alone forgets the input. That is an area, not a rate.',
                    'Seconds never appear in this model, so per second is invented.'
                ]
            },
            calc: {
                q: 'A(r) = πr². What is A′(3)?',
                choices: ['3π', '9π', '6π', '6'], a: 2,
                why: 'A′(r) = 2πr, so A′(3) = 6π.',
                whyBy: [
                    '3π comes from πr and drops the factor 2. The power rule gives 2πr.',
                    '9π is A(3), the area itself, not its rate.',
                    'A′(r) = 2πr, so A′(3) = 6π.',
                    '6 keeps the 2 but loses π, and π multiplies r² in the model.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'The area is 6π cm².',
                    'The radius changes at 6π cm per cm² of area.',
                    'The area changes at 6π cm² per second.',
                    'At a radius of 3 cm, the area changes at 6π square centimeters per additional centimeter of radius.'
                ], a: 3,
                why: 'The rate belongs to the output over the input: square centimeters of area per centimeter of radius, read at 3 cm.',
                whyBy: [
                    'That is A(3), the value. A rate is never the amount itself.',
                    'That inverts the dependency. The radius is the input, so it rides on the bottom.',
                    'A per second unit imports time, and this model never mentions time.',
                    'The rate belongs to the output over the input: square centimeters of area per centimeter of radius, read at 3 cm.'
                ]
            }
        },
        mistake: 'Writing A′(3) = 6π cm² as an area. It is 6π square centimeters of area per additional centimeter of radius, and no dr/dt was ever needed.',
        transfer: 'The volume V(r) of a sphere, in cm³, depends on its radius r in cm, and V′(2) = 16π. Name the input, the output and the units of this rate.',
        /* Stage 7. Everything in this block reads the clamped slider value, so
           nothing here can drift back to the anchor the decode steps quote. */
        explore: {
            sliderLabel: 'Radius r (cm)',
            min: 1, max: 8, step: 0.1,
            window: [0, 9, 0, 215],
            inDigits: 1, outDigits: 2, rateDigits: 2,
            axisIn: 'Radius r (cm)',
            axisOut: 'Area A (cm²)',
            scene: true,
            watch: 'The tangent stands on the point at the radius the slider reads, so its steepness is the area rate at that radius. Slide r upward and watch it steepen, because A′(r) = 2πr grows with r. The filled disk beside the graph is the area itself, so the amount and the rate both answer to the same one number.',
            drag: 'Now take the controls. Drag r and watch the circle, the point on the curve and the tangent line all move with one number.'
        }
    },

    cost: {
        label: 'Production cost',
        input: { symbol: 'q', name: 'production level', unit: 'items' },
        output: { symbol: 'C', name: 'daily cost', unit: 'dollars' },
        fn: q => 1200 + 8 * q + 0.02 * q * q,
        dfn: q => 8 + 0.04 * q,
        anchor: 100,
        derivSymbol: 'C′(q)',
        evalAt: 'C′(100)',
        givenText: 'C(q) = 1200 + 8q + 0.02q²',
        rateUnit: 'dollars/item',
        rateUnitWords: 'dollars per item',
        context: 'The daily operating cost C(q), in dollars, depends on the production level q, the number of items made that day. The model is C(q) = 1200 + 8q + 0.02q², checked at 100 items. Question: what does C′ measure here?',
        boundary: { title: 'A rate needs no clock', text: 'The input is a production level in items. A derivative never needs time, it only needs an output divided by an input.' },
        calcLines: [
            { t: 'C(q) = 1200 + 8q + 0.02q²' },
            { t: 'C′(q) = 8 + 0.04q', rule: 'the 1200 drops out' },
            { t: "C′(100) = 8 + 4 = 12 dollars per item", hl: true }
        ],
        interp: 'At a production level of 100 items, daily cost is increasing at about $12 for each additional item produced.',
        q: {
            io: {
                q: 'Which quantity is the input, and which is the output?',
                choices: [
                    'Input: production level q. Output: daily cost C',
                    'Input: daily cost. Output: production level',
                    'Input: time. The factory runs all day',
                    'Input: 1200. Output: q'
                ], a: 0,
                why: 'Correct. The factory chooses how many items to make, and the cost answers.',
                whyBy: [
                    'Correct. The factory chooses how many items to make, and the cost answers.',
                    'Reversed. Cost is what changes in response, and q is what is chosen.',
                    'The clock is not in the model. q counts items, and one day is a label on the cost, not an input.',
                    '1200 is the fixed part of the bill, a constant, not a varying quantity.'
                ]
            },
            notation: {
                q: 'Which notation gives the rate of cost with respect to production level?',
                choices: ['q′(C)', 'C′(q)', 'C(100)', 'dC/dt'], a: 1,
                why: 'Correct. C is the output and q is the input, so the rate is dC/dq, written C′(q).',
                whyBy: [
                    'That reads the production level as a function of cost. The roles are swapped.',
                    'Correct. C is the output and q is the input, so the rate is dC/dq, written C′(q).',
                    'C(100) is a cost value at one production level, not a rate.',
                    'dC/dt is the rate of cost over time, and this model has no time variable. Cost per hour is a different question.'
                ]
            },
            units: {
                q: 'What units must C′(q) have?',
                choices: [
                    'dollars',
                    'items per dollar',
                    'dollars per item',
                    'dollars per hour'
                ], a: 2,
                why: 'Correct. A derivative always carries output units over input units, so dollars per item.',
                whyBy: [
                    'The output unit by itself, with no division by the input unit.',
                    'Reversed. Cost per item, not items per dollar.',
                    'Correct. A derivative always carries output units over input units, so dollars per item.',
                    'That inserts a clock. The input is a production level in items.'
                ]
            },
            calc: {
                q: 'C(q) = 1200 + 8q + 0.02q². What is C′(100)?',
                choices: ['4', '12', '2200', '408'], a: 1,
                why: 'C′(q) = 8 + 0.04q, so C′(100) = 8 + 4 = 12.',
                whyBy: [
                    '4 is only the 0.04q piece of C′(q) = 8 + 0.04q, without the 8.',
                    'C′(q) = 8 + 0.04q, so C′(100) = 8 + 4 = 12.',
                    '2200 is C(100), the total daily bill, not the marginal rate.',
                    '408 feeds 100 into 8 + 0.04q² instead of into the derivative 8 + 0.04q.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'The total daily cost is $12.',
                    'At a production level of 100 items, daily cost is increasing at about $12 for each additional item produced.',
                    'The company earns $12 on each item.',
                    'Cost is increasing at $12 per hour.'
                ], a: 1,
                why: 'The rate is dollars of cost per additional item at that production level, and the total bill is far larger.',
                whyBy: [
                    'That is the value/rate mix-up. The total at 100 items is C(100) = 2200 dollars.',
                    'The rate is dollars of cost per additional item at that production level, and the total bill is far larger.',
                    'That confuses cost with revenue. C measures spending, not income.',
                    'Per hour imports a clock. The input here is items.'
                ]
            }
        },
        mistake: 'Confusing C′(100) = 12 dollars per item with the bill. The total daily cost is C(100) = 2200 dollars, and 12 is the marginal cost of the next item.',
        transfer: 'The profit L(x), in dollars, depends on the number x of units sold, and L′(200) = 3. Say what the 3 measures, with units.',
        /* Stage 7. Everything in this block reads the clamped slider value, so
           nothing here can drift back to the anchor the decode steps quote. */
        explore: {
            sliderLabel: 'Production level q (items)',
            min: 0, max: 300, step: 1,
            window: [0, 300, 1000, 5600],
            inDigits: 0, outDigits: 2, rateDigits: 2,
            axisIn: 'Production level q (items)',
            axisOut: 'Daily cost C (dollars)',
            watch: 'The tangent stands on the point at the production level the slider reads, so its slope is the marginal cost at that level and nowhere else. C′(q) = 8 + 0.04q grows as q grows, so the line tips further upward the more the plant makes.',
            drag: 'Now take the controls. Drag q and watch the point on the curve turn its tangent as the production level changes.'
        }
    },

    population: {
        label: 'Population vs time',
        input: { symbol: 't', name: 'years since baseline', unit: 'yr' },
        output: { symbol: 'P', name: 'population', unit: 'people' },
        fn: t => 20000 + 900 * t - 20 * t * t,
        dfn: t => 900 - 40 * t,
        anchor: 10,
        derivSymbol: 'P′(t)',
        evalAt: 'P′(10)',
        givenText: 'P(t) = 20000 + 900t − 20t²',
        rateUnit: 'people/yr',
        rateUnitWords: 'people per year',
        context: 'The population P(t), in people, depends on the time t in years since a baseline census. The model is P(t) = 20000 + 900t − 20t², checked ten years after the baseline. Question: what does P′ measure here?',
        boundary: { title: 'The one time tab', text: 'Here the input really is time. The structure map reads exactly like the altitude and cost tabs, which is the point: time is just one more input quantity.' },
        calcLines: [
            { t: 'P(t) = 20000 + 900t − 20t²' },
            { t: "P′(t) = 900 − 40t" },
            { t: "P′(10) = 900 − 400 = 500 people per year", hl: true }
        ],
        interp: 'Ten years after the baseline, the population is increasing at 500 people per year.',
        q: {
            io: {
                q: 'Which quantity is the input, and which is the output?',
                choices: [
                    'Input: population P. Output: time t',
                    'Input: 20000. Output: 900',
                    'Input: time t in years. Output: population P',
                    'Input: the rate 500. Output: the town'
                ], a: 2,
                why: 'Correct. The years are counted, and the population answers with them.',
                whyBy: [
                    'Reversed. Time is what the model reads off the calendar, and the population depends on it.',
                    'Those are constants in the formula, not changing quantities.',
                    'Correct. The years are counted, and the population answers with them.',
                    '500 is the answer this tab is building toward, and a rate is not an input.'
                ]
            },
            notation: {
                q: 'Which derivative represents the rate at which population changes with time?',
                choices: ['P′(t)', 't′(P)', 'P(10)', 'P(t) / t'], a: 0,
                why: 'P is the output and t is the input, so the rate is dP/dt, written P′(t).',
                whyBy: [
                    'P is the output and t is the input, so the rate is dP/dt, written P′(t).',
                    't′(P) measures years per person, the reciprocal of the question being asked.',
                    'P(10) is the population size at year 10, a value rather than a rate.',
                    'P(t)/t is an average of people per year since the baseline, not a rate at the single instant t = 10.'
                ]
            },
            units: {
                q: 'What units must P′(t) have?',
                choices: [
                    'people per year',
                    'years per person',
                    'people',
                    'people per decade'
                ], a: 0,
                why: 'Correct: the output people over the input years.',
                whyBy: [
                    'Correct: the output people over the input years.',
                    'Reversed ratio. Population is the output, so people go on top.',
                    'The output unit alone, missing the division by the input unit.',
                    'The input t is measured in years, so per decade silently rescales every rate in the model.'
                ]
            },
            calc: {
                q: 'P(t) = 20000 + 900t − 20t². What is P′(10)?',
                choices: ['500', '27000', '900', '1300'], a: 0,
                why: 'P′(t) = 900 − 40t, so P′(10) = 900 − 400 = 500.',
                whyBy: [
                    'P′(t) = 900 − 40t, so P′(10) = 900 − 400 = 500.',
                    '27000 is P(10), the population size at year 10.',
                    '900 is only the starting coefficient of the derivative, before paying the −40t term.',
                    '1300 adds the 400 instead of subtracting it.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'The population is 500 people.',
                    'Ten years after the baseline, the population is increasing at 500 people per year.',
                    'The population gained exactly 500 people over the first ten years.',
                    'Years pass at 500 years per person.'
                ], a: 1,
                why: 'The derivative names an instant, ten years after the baseline, and a rate in people per year.',
                whyBy: [
                    'That reads the rate as a headcount. The population at year 10 is 27000 people.',
                    'The derivative names an instant, ten years after the baseline, and a rate in people per year.',
                    'That is the instant/interval mix-up. The rate describes the pace at year 10, not a tally over ten years.',
                    'That flips output over input. Time is the input, so years ride on the bottom.'
                ]
            }
        },
        mistake: 'Reading P′(10) = 500 as a population or as ten years of growth. It is the rate at the instant ten years after the baseline, in people per year.',
        transfer: 'The heat H(w) released by a pile of wood, in joules, depends on the wood mass w in kilograms, and H′(4) = 1900. Name the input, the output and the units, then say whether the same skeleton from this tab applies.',
        /* Stage 7. The step of half a year lets the slider land on 22.5 years,
           where the rate is exactly 0 people per year. Everything here reads the
           clamped slider value, never the anchor the decode steps quote. */
        explore: {
            sliderLabel: 'Years since baseline t (yr)',
            min: 0, max: 45, step: 0.5,
            window: [0, 45, 19000, 31500],
            inDigits: 1, outDigits: 0, rateDigits: 0,
            axisIn: 'Years since baseline t (yr)',
            axisOut: 'Population P (people)',
            watch: 'Slide to t = 22.5 years, the top of the curve. There the tangent lies flat and the rate reads 0 people per year, while the population still stands at 30125 people. A flat tangent is a claim about the change at one year, never about the count.',
            drag: 'Now take the controls. Drag t through 22.5 years and watch the tangent rotate from rising to flat to falling.'
        }
    },

    dosage: {
        label: 'Medicine concentration',
        input: { symbol: 'd', name: 'dose', unit: 'mg' },
        output: { symbol: 'M', name: 'concentration', unit: 'mg/L' },
        fn: d => 10 * d / (d + 50),
        dfn: d => 500 / ((d + 50) * (d + 50)),
        anchor: 50,
        derivSymbol: 'M′(d)',
        evalAt: 'M′(50)',
        givenText: 'M(d) = 10d / (d + 50)',
        rateUnit: '(mg/L)/mg',
        rateUnitWords: '(mg/L) per mg',
        context: 'The concentration M(d) of a medicine in the blood, in mg/L, depends on the dose d, in mg. The model is M(d) = 10d / (d + 50), checked at a dose of 50 mg. Question: what does M′ measure here?',
        boundary: { title: 'Not a timing curve', text: 'This compares concentration with dose, not concentration with minutes. A dose-response rate and a flow over time are different questions.' },
        calcLines: [
            { t: 'M(d) = 10d / (d + 50)' },
            { t: "M′(d) = 500 / (d + 50)²", rule: 'quotient rule' },
            { t: "M′(50) = 500 / 100² = 0.05 (mg/L) per mg", hl: true }
        ],
        interp: 'At a dose of 50 mg, the concentration increases at 0.05 mg/L for each additional mg of dose.',
        q: {
            io: {
                q: 'Which quantity is the input, and which is the output?',
                choices: [
                    'Input: dose d. Output: concentration M',
                    'Input: concentration M. Output: dose d',
                    'Input: time after the dose. The medicine acts over hours',
                    'Input: 50. Output: 10'
                ], a: 0,
                why: 'Correct. A dose in mg goes in, and a concentration in mg/L comes out.',
                whyBy: [
                    'Correct. A dose in mg goes in, and a concentration in mg/L comes out.',
                    'Reversed. The clinician chooses the dose, and the concentration responds.',
                    'The model has no clock. It links concentration with dose only.',
                    'Both numbers are fixed details of the model, not the varying quantities.'
                ]
            },
            notation: {
                q: 'Which derivative compares concentration with dose?',
                choices: ['M′(d)', 'd′(M)', 'dM/dt', 'M(50)'], a: 0,
                why: 'M is the output and d is the input, so the rate is dM/dd, written M′(d).',
                whyBy: [
                    'M is the output and d is the input, so the rate is dM/dd, written M′(d).',
                    'd′(M) treats concentration as the input. Reversed.',
                    'dM/dt is the rate of concentration over time. The model never mentions time, and a timing curve would be a different problem.',
                    'M(50) is a concentration value, not a rate.'
                ]
            },
            units: {
                q: 'What units must M′(d) have?',
                choices: [
                    'mg per (mg/L)',
                    '(mg/L) per minute',
                    '(mg/L) per mg',
                    'mg/L'
                ], a: 2,
                why: 'Correct. Output units over input units: (mg/L)/mg.',
                whyBy: [
                    'Reversed. The output is the concentration, so it goes on top.',
                    'That adds a clock to a dose-response model. Nothing here ticks.',
                    'Correct. Output units over input units: (mg/L)/mg.',
                    'The output unit alone, missing the division by the dose.'
                ]
            },
            calc: {
                q: 'M′(d) = 500 / (d + 50)². What is M′(50)?',
                choices: ['5', '0.2', '10', '0.05'], a: 3,
                why: 'Correct. 500 / 100² = 500 / 10000 = 0.05.',
                whyBy: [
                    '5 is M(50), the concentration itself, not its rate.',
                    '0.2 comes from squaring 50 alone and forgetting the + 50 inside the parentheses.',
                    '10 is the numerator coefficient of the model, not a rate at this dose.',
                    'Correct. 500 / 100² = 500 / 10000 = 0.05.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'At a dose of 50 mg, the concentration increases at 0.05 mg/L for each additional mg of dose.',
                    'The concentration is 0.05 mg/L.',
                    'The dose grows at 0.05 mg per mg/L.',
                    'The concentration rises 0.05 mg/L every minute.'
                ], a: 0,
                why: 'The rate pairs 0.05 with the unit (mg/L)/mg at a dose of 50 mg.',
                whyBy: [
                    'The rate pairs 0.05 with the unit (mg/L)/mg at a dose of 50 mg.',
                    'That reads the rate as a concentration. The concentration at 50 mg is M(50) = 5 mg/L.',
                    'That flips output over input. Concentration is the output, so mg/L rides on top.',
                    'A per minute unit belongs to a clock the model never had.'
                ]
            }
        },
        mistake: 'Reading M′(50) = 0.05 as the concentration. The concentration at 50 mg is M(50) = 5 mg/L, and 0.05 is how fast it climbs per added mg.',
        transfer: 'The response R(c), in percent, of a plant depends on the fertilizer amount c in grams, with R′(6) = −1.4. Give the input, the output, the units and a direction word.',
        /* Stage 7. The range runs to 200 mg so the flattening is visible.
           Everything here reads the clamped slider value, never the anchor the
           decode steps quote. */
        explore: {
            sliderLabel: 'Dose d (mg)',
            min: 0, max: 200, step: 1,
            window: [0, 200, 0, 9],
            inDigits: 0, outDigits: 3, rateDigits: 3,
            axisIn: 'Dose d (mg)',
            axisOut: 'Concentration M (mg/L)',
            watch: 'Push d toward 200 mg. The concentration keeps climbing while the tangent flattens, because the rate falls off as the dose grows, and at 200 mg it reads only 0.008 (mg/L) per mg. A rising amount and a shrinking rate happen at the same time.',
            drag: 'Now take the controls. Drag d up toward 200 mg and watch the curve climb while its tangent goes flat.'
        }
    },

    cylinder: {
        label: 'Cylinder volume',
        input: { symbol: 'h', name: 'height', unit: 'cm' },
        output: { symbol: 'V', name: 'volume', unit: 'cm³' },
        fn: h => 25 * Math.PI * h,
        dfn: () => 25 * Math.PI,
        anchor: 10,
        derivSymbol: 'V′(h)',
        evalAt: 'V′(10)',
        givenText: 'V(h) = 25πh',
        rateUnit: 'cm³/cm',
        rateUnitWords: 'cm³ per cm',
        context: 'A container with fixed radius holds a volume V(h) of liquid, in cm³, when filled to a height h, in cm. The model is V(h) = 25πh, checked at a height of 10 cm. Question: what does V′ measure here?',
        boundary: { title: 'Nobody is pouring', text: 'This is dV/dh, extra volume per extra centimeter of height. A filling rate dV/dt would belong to related rates, and no time enters here.' },
        calcLines: [
            { t: 'V(h) = 25πh' },
            { t: "V′(h) = 25π", rule: 'constant for every h' },
            { t: "V′(10) = 25π cm³ per cm", hl: true }
        ],
        interp: 'For this container, each additional centimeter of height corresponds to 25π cubic centimeters of additional volume.',
        q: {
            io: {
                q: 'Which quantity is the input, and which is the output?',
                choices: [
                    'Input: volume V. Output: height h',
                    'Input: the number 25. Output: π',
                    'Input: time. The container is being filled',
                    'Input: height h. Output: volume V'
                ], a: 3,
                why: 'Correct. Choose a height in centimeters, and the model returns the volume it holds.',
                whyBy: [
                    'Reversed. The height is the measurement taken, and the volume answers with it.',
                    'Constants. Neither one varies in this model.',
                    'Nothing is pouring. The height is just a measured column, with no clock attached.',
                    'Correct. Choose a height in centimeters, and the model returns the volume it holds.'
                ]
            },
            notation: {
                q: 'Which derivative compares volume with height?',
                choices: ["h′(V)", 'V′(h)', 'dV/dt', 'V(h)'], a: 1,
                why: "Correct. V is the output and h is the input, so the rate is dV/dh, written V′(h).",
                whyBy: [
                    'h′(V) runs the comparison backwards, centimeters of height per cubic centimeter.',
                    "Correct. V is the output and h is the input, so the rate is dV/dh, written V′(h).",
                    'dV/dt is a filling rate. Nobody is pouring here, so it belongs to a later lesson, not this tab.',
                    'V(h) is the volume itself, a value rather than a rate.'
                ]
            },
            units: {
                q: 'What units must V′(h) have?',
                choices: [
                    'cubic centimeters',
                    'cubic centimeters per centimeter',
                    'centimeters per cubic centimeter',
                    'cubic centimeters per second'
                ], a: 1,
                why: 'Correct: cm³ of volume per cm of height.',
                whyBy: [
                    'The output unit alone is just a volume.',
                    'Correct: cm³ of volume per cm of height.',
                    'Reversed. Volume is the output, so it goes on top.',
                    'A per second unit turns this into a filling rate. No time appears in the model.'
                ]
            },
            calc: {
                q: 'V(h) = 25πh. What is V′(10)?',
                choices: ['0', '250π', '25π', '25'], a: 2,
                why: 'V′(h) = 25π for every h, so V′(10) = 25π.',
                whyBy: [
                    'A constant rate is not a zero rate. Zero would say an extra centimeter adds no volume.',
                    '250π is V(10), the volume standing in the container at height 10.',
                    'V′(h) = 25π for every h, so V′(10) = 25π.',
                    '25 drops the π, and π is a factor of the slope.'
                ]
            },
            interp: {
                q: 'Which interpretation is correct?',
                choices: [
                    'The volume is 25π cm³ at every height.',
                    'The height grows 25π cm for each cm³ of volume.',
                    'The volume increases 25π cm³ per second.',
                    'For this container, each additional centimeter of height corresponds to 25π cubic centimeters of additional volume.'
                ], a: 3,
                why: 'The rate is a ratio of added volume to added height, and it is the same at every height.',
                whyBy: [
                    'That reads the rate as a volume. The volume at height 10 cm is 250π cm³.',
                    'That flips output over input. Volume is the output, so cm³ rides on top.',
                    'A per second unit imports a filling clock. The container just stands there.',
                    'The rate is a ratio of added volume to added height, and it is the same at every height.'
                ]
            }
        },
        mistake: 'Calling V′ = 25π a filling rate. It is cubic centimeters per centimeter of height, and no time enters the model.',
        transfer: 'The resistance R(L) of a wire, in ohms, grows with its length L in meters, and R′(10) = 0.4. Name the two quantities and the unit of the rate.'
    }
}

/* Shared pedagogy for step 5, the cross-context transfer check. It reads the
   same everywhere on purpose, because what survives the story swap is the
   lesson itself (Mathematical Practice 2.A). */
const TRANSFER_Q = {
    q: 'Three rapid new stories sit in the main column: A(r) for circle area against radius, C(q) for daily cost against production level, and P(t) for population against years. Which information always survives when the story changes?',
    choices: [
        'The object the story is about, like a tank or a soup pot',
        'The value of the input at the evaluation point',
        'Input quantity, output quantity, evaluation point, the rate, and the units of output over input',
        'The fact that the output changes with time'
    ], a: 2,
    why: 'Every applied rate keeps the same slots: one input quantity, one output quantity, one evaluation point, and a rate in output units per input unit. The story and even the object can vanish.',
    whyBy: [
        'Objects belong to the story, not the math. This tab never drew one.',
        'A single number is not structure. Different stories pick different numbers.',
        'Every applied rate keeps the same slots: one input quantity, one output quantity, one evaluation point, and a rate in output units per input unit. The story and even the object can vanish.',
        'Half of these tabs have time-free inputs. A surviving structure cannot require a clock.'
    ]
}

const TRANSFER_STORIES = {
    title: 'Same skeleton, new stories',
    text: 'Three rapid contexts to test the transfer. A(r) is the area of a circle in cm² against its radius r in cm. C(q) is a daily cost in dollars against a production level q in items. P(t) is a population in people against time t in years.'
}

const SURVIVES_TEXT = 'The input quantity, the output quantity, the evaluation point, the rate, the units of output over input, and a contextual direction or zero-rate meaning. The story, the object and the letters change, and the skeleton does not.'

/* The reveal for step 5: all six tabs laid over the same slots. */
const SKELETON = {
    cols: ['story', 'input', 'output', 'rate', 'units of the rate'],
    rows: [
        ['Temperature vs altitude', 'h, m', 'T(h), °C', "T′(h)", '°C per m'],
        ['Circle area', 'r, cm', 'A(r), cm²', "A′(r)", 'cm² per cm'],
        ['Production cost', 'q, items', 'C(q), dollars', "C′(q)", 'dollars per item'],
        ['Population', 't, yr', 'P(t), people', "P′(t)", 'people per yr'],
        ['Medicine', 'd, mg', 'M(d), mg/L', "M′(d)", '(mg/L) per mg'],
        ['Cylinder', 'h, cm', 'V(h), cm³', "V′(h)", 'cm³ per cm']
    ],
    note: 'Six tabs, one set of slots. Only the story and the letters changed.'
}

const INTRO_HEAD = 'Different contexts can hide the same mathematical structure. First find the input quantity and the output quantity, and do not differentiate yet. '
const INTRO_TAIL = 'Work the Temperature vs altitude tab in full, then take one tab whose story feels unfamiliar. The rest are optional transfer practice.'
const INTRO = INTRO_HEAD + 'This tab is a decoding station, not a simulation. ' + INTRO_TAIL
/* The four tabs whose rate changes end with the controls, so their opening line
   says the picture arrives at the last step instead of ruling one out. */
const INTRO_CONTROLS = INTRO_HEAD + 'This tab is a decoding station for the first six steps, and the last step hands over the controls. ' + INTRO_TAIL

const GOAL_TEXT = 'Goal: identify what changes, what it changes with respect to, the derivative notation and the units, then interpret the rate in context.'

/* One shared idea line closes every tab, because the lesson is the structure. */
const IDEA = 'Every applied rate sits on one structure: an input quantity, an output quantity, an evaluation point, and a rate in output units per input unit. Recognizing that skeleton inside an unfamiliar story is the whole skill, and no future value was ever needed.'

function machineStages(c) {
    return env => {
        const s = [
            { box: c.input.symbol, in: c.input.name, out: c.input.unit },
            { box: c.output.symbol + '(' + c.input.symbol + ')', in: c.output.name, out: c.output.unit }
        ]
        if (env.stage >= 2) {
            s.push(env.stage >= 3
                ? { box: c.derivSymbol, in: 'rate of ' + c.output.name + ' over ' + c.input.name, out: c.rateUnitWords }
                : { box: c.derivSymbol })
        }
        return s
    }
}

/* ---------- stage 7, the hands on phase ----------
   Only the four tabs whose rate changes carry an explore block, because a
   constant rate has nothing to drag. One rule holds every element together:
   each pane, label, point and reading is built from env.xNow, the clamped
   slider value, and from the three strings derived beside it. The decode panes
   in stages 1 to 6 keep the fixed anchor, so they cannot move. The tangent is
   the lesson, and it only ever states the slope at the input on the slider. */
function roundTo(v, d) { return Math.round(v * Math.pow(10, d)) / Math.pow(10, d) }
function fmtAt(v, d) { return fmtReal(roundTo(v, d)) }

/* The single reading of the slider. valueText, rateText and dirText are the
   only number texts the exploration prints, so the picture and the readout can
   never show two versions of the same rate. */
function exploreState(c, env) {
    const e = c.explore
    const raw = Number(env.x)
    /* a guard for a missing param only, never a reading of the anchor */
    const x = roundTo(Number.isFinite(raw) ? Math.max(e.min, Math.min(e.max, raw)) : e.min, e.inDigits)
    const v = c.fn(x)
    const r = c.dfn(x)
    /* the rate counts as zero exactly when the printed digits round it away */
    const isZero = Math.abs(r) < 0.5 * Math.pow(10, -e.rateDigits)
    return {
        xNow: x,
        fNow: v,
        dNow: r,
        xText: fmtAt(x, e.inDigits),
        valueText: fmtAt(v, e.outDigits),
        rateText: fmtAt(isZero ? 0 : r, e.rateDigits),
        dirText: isZero ? 'not changing at this input' : (r > 0 ? 'increasing' : 'decreasing'),
        dirColor: isZero ? 'ink' : (r > 0 ? 'up' : 'down')
    }
}

function exploreControl(c) {
    const e = c.explore
    return {
        key: 'x', label: e.sliderLabel, showDigits: e.inDigits,
        min: e.min, max: e.max, step: e.step,
        when: env => env.stage >= 7
    }
}

function amountText(c, env) { return c.output.symbol + '(' + env.xText + ') = ' + env.valueText + ' ' + c.output.unit }
function rateText(c, env) { return c.output.symbol + '′(' + env.xText + ') = ' + env.rateText + ' ' + c.rateUnitWords }

function exploreGraph(c) {
    const e = c.explore
    const [x0, x1, y0, y1] = e.window
    return {
        kind: 'graph',
        title: env => c.output.name + ' against ' + c.input.name + ', with the tangent at ' + c.input.symbol + ' = ' + env.xText,
        when: env => env.stage >= 7,
        height: 320,
        window: e.window,
        curves: () => [{ fn: c.fn, from: e.min, to: e.max, color: 'curveA', label: c.output.symbol + '(' + c.input.symbol + ')' }],
        /* the tangent slope is env.dNow, the derivative at the slider value, so
           the line rotates as the student drags and the graph slope stays the
           real world rate printed under it */
        tangents: env => [{
            x: env.xNow, y: env.fNow, m: env.dNow, reach: 0.3,
            color: env.dirColor, label: rateText(c, env)
        }],
        points: env => [{ x: env.xNow, y: env.fNow, color: 'accent', label: amountText(c, env) }],
        vlines: env => [{ x: env.xNow, color: 'auxInk', label: c.input.symbol + ' = ' + env.xText + ' ' + c.input.unit }],
        notes: [
            { x: x0 + (x1 - x0) * 0.02, y: y1 - (y1 - y0) * 0.05, t: e.axisOut, color: 'auxInk' },
            { x: x1 - (x1 - x0) * 0.34, y: y0 + (y1 - y0) * 0.05, t: e.axisIn, color: 'auxInk' }
        ]
    }
}

function exploreReadout(c) {
    const sym = c.input.symbol
    return {
        kind: 'readout',
        title: env => 'Reading the rate at ' + sym + ' = ' + env.xText + ' ' + c.input.unit,
        when: env => env.stage >= 7,
        /* each v is a function so the printed text is the exact string the
           graph labels carry, minus sign included */
        items: env => [
            { label: c.output.symbol + '(' + sym + ')', v: () => env.valueText, unit: c.output.unit, big: true },
            { label: c.output.symbol + '′(' + sym + ')', v: () => env.rateText, unit: c.rateUnitWords, big: true, color: env.dirColor },
            { label: 'At this input the ' + c.output.name + ' is', v: () => env.dirText, color: env.dirColor }
        ]
    }
}

function exploreNote(c) {
    return { kind: 'note', title: 'What to watch', when: env => env.stage >= 7, text: c.explore.watch }
}

/* The circle tab also draws its own shape. A square viewBox over a square
   window keeps the drawn outline round, and the outline is the two halves of
   one existing primitive, a curve of y over x, so the renderer stays untouched. */
function exploreScene(c) {
    const top = r => x => Math.sqrt(Math.max(0, r * r - x * x))
    const bottom = r => x => -Math.sqrt(Math.max(0, r * r - x * x))
    const k = Math.SQRT1_2
    return {
        kind: 'graph',
        title: 'The circle at the current radius',
        when: env => env.stage >= 7,
        width: 340, height: 340,
        window: [-9, 9, -9, 9],
        grid: false, ticks: false,
        areas: env => [{ fn: bottom(env.xNow), topFn: top(env.xNow), from: -env.xNow, to: env.xNow, color: 'fillA' }],
        curves: env => [
            { fn: top(env.xNow), from: -env.xNow, to: env.xNow, color: 'curveA', width: 2.6 },
            { fn: bottom(env.xNow), from: -env.xNow, to: env.xNow, color: 'curveA', width: 2.6 }
        ],
        segments: env => [{ x1: 0, y1: 0, x2: env.xNow * k, y2: env.xNow * k, color: 'aux' }],
        points: env => [
            { x: 0, y: 0, r: 4, color: 'ink', label: 'center' },
            { x: env.xNow * k, y: env.xNow * k, color: 'aux', label: 'r = ' + env.xText + ' ' + c.input.unit }
        ],
        notes: env => [{ x: -8.5, y: -8.1, t: 'disk = ' + env.valueText + ' ' + c.output.unit, color: 'auxInk' }]
    }
}

function modeDef(key) {
    const c = CASES[key]
    const explores = Boolean(c.explore)
    return {
        label: c.label,
        intro: explores ? INTRO_CONTROLS : INTRO,
        /* x is the exploration input, and it opens on the case anchor so the
           first look at stage 7 reads the same numbers the decode steps named */
        params: explores ? { stage: 0, x: c.anchor } : { stage: 0 },
        controls: explores ? [exploreControl(c)] : [],
        /* value and rate stay at the fixed anchor for the audit trail, while the
           explore block below reads the slider and nothing else */
        compute: env => {
            const audit = {
                value: fmtReal(c.fn(c.anchor)),
                rate: fmtReal(c.dfn(c.anchor))
            }
            return explores ? Object.assign(audit, exploreState(c, env)) : audit
        },
        panes: {
            main: [
                { kind: 'note', title: 'Context', text: c.context },
                {
                    kind: 'machine', title: 'Rate structure map',
                    when: env => env.stage >= 1,
                    stages: machineStages(c),
                    focus: env => env.stage >= 2 ? 2 : 1
                },
                { kind: 'note', title: c.boundary.title, when: env => env.stage >= 2, text: c.boundary.text },
                {
                    kind: 'eq', title: 'Calculate the rate',
                    when: env => env.stage >= 3,
                    lines: env => env.stage >= 4 ? c.calcLines : [
                        { t: c.givenText },
                        { t: 'Question: what is ' + c.evalAt + '?', dim: true }
                    ]
                },
                { kind: 'note', title: 'Interpretation', when: env => env.stage >= 5, text: c.interp },
                { kind: 'note', title: TRANSFER_STORIES.title, when: env => env.stage >= 5, text: TRANSFER_STORIES.text },
                { kind: 'table', title: 'Six contexts, one skeleton', when: env => env.stage >= 6, ...SKELETON },
                { kind: 'note', title: 'What always survives', when: env => env.stage >= 6, text: SURVIVES_TEXT },
                ...(explores ? [exploreGraph(c), exploreReadout(c), exploreNote(c)] : [])
            ],
            side: [
                { kind: 'note', title: 'Learning goal', when: env => env.stage === 0, text: GOAL_TEXT },
                {
                    kind: 'note', title: 'How the map reads', when: env => env.stage >= 1,
                    text: env => env.stage >= 3
                        ? 'The map reads left to right. INPUT is the quantity chosen, OUTPUT is the quantity that answers, and RATE carries the derivative notation with output units divided by input units.'
                        : 'The map reads left to right. INPUT is the quantity chosen, and OUTPUT is the quantity that answers.'
                },
                ...(explores && c.explore.scene ? [exploreScene(c)] : [])
            ]
        },
        steps: stepsForCase(c),
        summary: { idea: IDEA, mistake: c.mistake, transfer: c.transfer }
    }
}

function stepsForCase(c) {
    const io = c.input.name + ' in ' + c.input.unit + ' goes in, and ' + c.output.name + ' in ' + c.output.unit + ' comes out'
    return [
        {
            params: { stage: 1 }, predict: c.q.io,
            message: 'The map now names both quantities. ' + io + '.'
        },
        {
            params: { stage: 2 }, predict: c.q.notation,
            message: 'The RATE box opened with the notation ' + c.derivSymbol + '. The units are still missing, and naming them comes first.'
        },
        {
            params: { stage: 3 }, predict: c.q.units,
            message: 'The units line filled in: ' + c.rateUnitWords + '. Output unit over input unit, no clock required. The calculation question is next.'
        },
        {
            params: { stage: 4 }, predict: c.q.calc,
            message: 'The calculation pane now shows the derivative and its value at ' + c.evalAt + '. The next question asks for the sentence.'
        },
        {
            params: { stage: 5 }, predict: c.q.interp,
            message: 'The interpretation sentence is on screen. Read its parts: the input value, the direction, the size, and output units per input unit. Then check what survived.'
        },
        {
            params: { stage: 6 }, predict: TRANSFER_Q,
            message: 'The table shows all six tabs on the same skeleton, and the Key Idea closes the lesson.'
        },
        /* The hands on step has no prediction, because at stage 6 nothing of
           this phase is on screen to spoil a question. Its params also set the
           slider back to the anchor, so entering the phase starts from the
           numbers the decode steps just named. */
        ...(c.explore ? [{ params: { stage: 7, x: c.anchor }, message: c.explore.drag }] : [])
    ]
}

export default {
    id: 'u4-applied-rate',
    meta: { unit: 4, topic: '4.3', title: 'Rates of Change in Applied Contexts Other Than Motion', visualizerTitle: 'Applied Rate Explorer' },
    modes: ['altitude', 'circle', 'cost', 'population', 'dosage', 'cylinder'].map(modeDef)
}
