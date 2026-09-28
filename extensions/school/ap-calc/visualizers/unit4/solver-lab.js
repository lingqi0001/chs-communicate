/* 4.5 Related Rates Problem Solver. P0 boundary: this lesson walks complete
   word problems through one shared six-stage pipeline, Understand, Model,
   Differentiate, Substitute, Solve, Interpret. It deliberately carries no
   finite time step, no linear estimate, no approximation error term and no
   forward projection of a quantity, all of which belong to 4.6.
   Rules that keep the teaching honest:
   1. An arrow length encodes one rate magnitude and nothing else, never a
      quantity multiplied by a rate.
   2. An unknown rate is a fixed placeholder arrow with a question mark until
      the Solve stage. Only after Solve may a length carry the magnitude.
   3. During the walkthrough the asked instant is locked. The slider appears
      only in the final Explore stage, after Interpret.
   4. Color semantics shared with 4.4: quantity = ink, known rate = accent,
      unknown rate = gray with ?, direction = the up and down tokens once the
      rate is solved or given, constant = auxInk.
   The three problems below are only data. buildMode turns any case into the
   same tabbed mode on the same pipeline, so students see one workflow rather
   than three geometry demos. */

const K_LADDER = 1.1;   /* graph units drawn per ft/s in the ladder scene */
const K_SHADOW = 0.45;  /* graph units drawn per ft/s in the shadow scene */
const K_BALLOON = 1.6;  /* graph units drawn per cm/s in the balloon scene */
const MAXLEN = 3.4;     /* arrow length cap, in graph units */
const FIX = 1.0;        /* placeholder arrow length for an unsolved rate */
const CX = 5.5;         /* balloon circle center, graph units */

/* All three problems run the same workflow, so they share one key idea. */
const SHARED_SUMMARY = {
    idea: 'Every related rates problem runs the same six moves. Sort the facts, model one relation that is always true, differentiate it with respect to t while the quantities are still variables, substitute the single instant the question names, solve for the target rate, then say the answer in context with its units and its direction.',
    mistake: 'Plugging the instant numbers in before differentiating. A frozen equation like 36 + 64 = 100 is a true statement with no rates left in it.',
    transfer: 'The unit of the answer follows the quantity being differentiated, cm/s for a radius rate and cm³/s for a volume rate. The sign of a solved rate carries its direction, so a negative number is not a mistake.'
};

const CASES = {
    /* ---------------- Case 1: the 10 ft ladder ---------------- */
    ladder: {
        label: 'Ladder against a wall',
        params: { x: 6, dxdt: 2, stage: 0 },
        lock: { x: 6, dxdt: 2 },
        lockFrom: 4,
        compareStage: 5,
        height: 560,
        window: [-1.4, 11.8, -1.5, 11.4],
        title: (env) => env.stage >= 7
            ? 'Explore, the ladder at x = ' + r2(env.x) + ' ft'
            : 'The ladder at the asked instant',
        compute: (env) => {
            const x = clamp(env.x, 0.4, 9.6);
            const y = Math.sqrt(Math.max(0, 100 - x * x));
            const dxdt = clamp(env.dxdt, -3, 3);
            const dydt = y > 0.05 ? -x * dxdt / y : 0;
            const solved = env.stage >= 5;
            return {
                x, y, dxdt, dydt, solved,
                dxLen: rateLen(Math.abs(dxdt), K_LADDER, 11.3 - x),
                dyLen: solved ? rateLen(Math.abs(dydt), K_LADDER, y - 0.3) : FIX
            };
        },
        scene: {
            vband: () => [{ from: -0.45, to: 0, color: 'auxInk' }],
            curves: (env) => [
                { fn: () => 0, from: -0.45, to: 11.4, color: 'auxInk' },
                { fn: (X, e) => e.y * (1 - X / e.x), from: 0, to: env.x, color: 'auxInk', width: 3.5 }
            ],
            segments: (env) => {
                const s = [];
                if (env.stage >= 2) {
                    s.push({ x1: 0, y1: 0.14, x2: env.x, y2: 0.14, color: 'ink' });
                    s.push({ x1: env.x, y1: 0.55, x2: env.x + env.dxLen, y2: 0.55, color: 'accent', arrow: 'end', dashed: true });
                    s.push({ x1: 0.75, y1: env.y, x2: 0.75, y2: env.y - env.dyLen, color: env.solved ? 'down' : 'auxInk', arrow: 'end', dashed: true });
                }
                return s;
            },
            points: (env) => [
                {
                    x: env.x, y: 0, color: 'ink',
                    label: (e) => e.stage >= 2 ? 'x = ' + r2(e.x) + ' ft' : '',
                    drag: env.stage >= 7 ? { key: 'x', min: 0.4, max: 9.6 } : undefined
                },
                {
                    x: 0.08, y: env.y, color: 'ink',
                    label: (e) => e.stage >= 2 ? (e.stage >= 4 ? 'y = ' + r2(e.y) + ' ft' : 'y = ?') : ''
                }
            ],
            notes: (env) => {
                const n = [
                    { x: -1.3, y: 10.9, t: 'wall', color: 'auxInk' },
                    { x: 9.8, y: -0.65, t: 'floor', color: 'auxInk' }
                ];
                if (env.stage >= 2) {
                    n.push({ x: env.x / 2 + 0.45, y: env.y / 2 + 0.5, t: '10 ft · constant', color: 'auxInk' });
                    n.push({ x: env.x + env.dxLen + 0.15, y: 1.2, t: 'dx/dt = 2 ft/s', color: 'accent' });
                    n.push(env.solved
                        ? { x: 1, y: env.y - env.dyLen, t: 'dy/dt = ' + neg(env.dydt) + ' ft/s', color: 'down' }
                        : { x: 1, y: env.y - FIX + 0.4, t: 'dy/dt = ?', color: 'auxInk' });
                }
                return n;
            }
        },
        facts: (env) => [
            { label: 'Constant', v: () => '10 ft ladder, its length never changes', color: 'auxInk' },
            { label: 'Given rate', v: () => 'dx/dt = 2 ft/s away from the wall', color: 'accent' },
            {
                label: 'Instant value', color: 'ink',
                v: () => env.stage >= 7 ? 'x = ' + r2(env.x) + ' ft'
                    : env.stage >= 4 ? 'x = 6 ft, y = 8 ft' : 'x = 6 ft'
            },
            {
                label: 'Target rate', color: (e) => e.stage >= 5 ? 'down' : 'auxInk',
                v: () => env.stage >= 5 ? 'dy/dt = ' + neg(env.dydt) + ' ft/s, downward' : 'dy/dt = ?'
            }
        ],
        eq: (env) => {
            const out = [];
            if (env.stage >= 2) out.push({ t: 'x² + y² = 10²', rule: 'one relation between two changing quantities' });
            else out.push({ t: 'find one relation between x and y', dim: true, rule: 'the Model step' });
            if (env.stage >= 3) out.push({ t: '2x·dx/dt + 2y·dy/dt = 0', hl: env.stage === 3, rule: 'differentiate both sides with respect to t' });
            else out.push({ t: 'differentiate both sides with respect to t', dim: true, rule: 'the Differentiate step' });
            if (env.stage >= 4 && env.stage < 7) {
                out.push({ t: 'x = 6 ft and y = √(100 − 36) = 8 ft', rule: 'the one instant the question names' });
                out.push({ t: '2(6)(2) + 2(8)·dy/dt = 0', hl: env.stage === 4, rule: 'substitute the instant' });
            }
            if (env.stage >= 5 && env.stage < 7) out.push({ t: '24 + 16·dy/dt = 0, so dy/dt = −1.5 ft/s', hl: true, rule: 'solve for the target rate' });
            if (env.stage >= 7) {
                out.push({ t: 'x = ' + r2(env.x) + ' ft and y = ' + r2(env.y) + ' ft', rule: 'the instant you dragged to' });
                out.push({ t: '2·' + r2(env.x) + '·2 + 2·' + r2(env.y) + '·dy/dt = 0', rule: 'substitute it' });
                out.push({ t: 'dy/dt = ' + neg(env.dydt) + ' ft/s', hl: true, rule: 'the same solve replayed, the sign never flips' });
            }
            return out;
        },
        compare: {
            sides: [
                {
                    title: 'Wrong · substitute 6 and 8 first', tone: 'wrong',
                    lines: [
                        '6² + 8² = 10²',
                        '36 + 64 = 100',
                        'differentiate both sides, 0 = 0',
                        'true, and silent about every rate'
                    ]
                },
                {
                    title: 'Right · differentiate first, then substitute', tone: 'right',
                    lines: [
                        'x² + y² = 100',
                        '2x·dx/dt + 2y·dy/dt = 0',
                        'x = 6, y = 8, dx/dt = 2',
                        '2(6)(2) + 2(8)·dy/dt = 0',
                        'dy/dt = −1.5 ft/s'
                    ]
                }
            ],
            verdict: 'A frozen equation is a true statement with no rates left in it. Differentiate while x and y are still variables, then put the single instant in.'
        },
        interpret: (env) => env.stage >= 7
            ? 'When the bottom of the ladder is ' + r2(env.x) + ' ft from the wall, the top of the ladder is moving downward at ' + r2(Math.abs(env.dydt)) + ' ft/s.'
            : 'When the bottom of the ladder is 6 ft from the wall, the top of the ladder is moving downward at 1.5 ft/s.',
        explore: { key: 'x', label: 'Bottom distance x', min: 0.4, max: 9.6, step: 0.05, unit: ' ft' },
        stages: [
            {
                name: 'Understand',
                text: 'A 10 ft ladder leans against a wall, and the bottom slides away from the wall at 2 ft/s. The question asks how fast the top is sliding when the bottom is 6 ft from the wall. The facts panel on the side splits the sentence into what never changes, what changes at a known rate, what belongs to one instant only, and which rate we are hunting. Nothing about the top is known yet, so we write dy/dt = ?.'
            },
            {
                name: 'Model',
                text: 'The wall, the floor and the ladder form a right triangle, so x² + y² = 10² holds at every instant the ladder leans there. The given rate gets an arrow along the floor whose length is its speed. The top gets a fixed gray arrow labeled dy/dt = ?, because its size is exactly what no one has worked out yet. The picture stays parked at x = 6 until the answer is on the board.'
            },
            {
                name: 'Differentiate',
                text: 'Differentiate both sides with respect to t. The constant side goes to zero, and each square keeps its own rate, so 2x·dx/dt + 2y·dy/dt = 0. This relation between the two arrows is true at every instant, long before we choose one.',
                predict: {
                    q: 'The relation x² + y² = 100 holds at every instant, and x changes with time. What is d/dt of x²?',
                    choices: [
                        '2x·dx/dt, because the power rule gives 2x and the Chain Rule attaches dx/dt',
                        '2x, because that is the power rule and nothing else is needed',
                        '2·dx/dt, because the exponent drops down and the x cancels away'
                    ],
                    a: 0,
                    whyBy: [
                        'The power rule hands down 2x, and x itself moves with time, so the Chain Rule brings dx/dt along. This is the same ride 4.4 practiced on r².',
                        'That is d/dx of x², not d/dt. The quantity depends on t, so a factor of dx/dt has to ride with the derivative.',
                        'The exponent comes down as a 2 and one x stays behind, so the x is part of the answer. The dx/dt companion is the half you got right.'
                    ]
                }
            },
            {
                name: 'Substitute',
                text: 'Now bring in the single instant the question names. x = 6 forces y = √(100 − 36) = 8, and dx/dt = 2 is given, so the rate relation reads 2(6)(2) + 2(8)·dy/dt = 0. The instant is locked on the picture, so nothing can slide while we finish.',
                predict: {
                    q: 'Before any more algebra, should dy/dt come out positive or negative?',
                    choices: [
                        'Negative, the top slides down while the bottom slides out',
                        'Positive, the top slides up because the bottom is racing away',
                        'Zero, the ladder keeps its length so the top holds its height'
                    ],
                    a: 0,
                    whyBy: [
                        'The ladder does not stretch, so sideways progress at the floor pays for itself with lost height. A shrinking y means a negative rate.',
                        'The sign of dx/dt describes x, not y. The top still descends however fast the bottom runs, so dy/dt is negative.',
                        'The constant length is exactly what forces the height down as x grows. A fixed ladder cannot keep the top at one height while the bottom leaves.'
                    ]
                }
            },
            {
                name: 'Solve',
                text: '24 + 16·dy/dt = 0 gives dy/dt = −1.5 ft/s. The gray placeholder arrow is replaced by a downward arrow whose length now carries the speed, because nothing is unknown anymore. The panel below replays the two orders side by side. Differentiating first is the one that survives.',
                predict: {
                    q: 'Why can\'t we plug in 6 and 8 before differentiating?',
                    choices: [
                        'Both sides become constants, so the derivative is 0 = 0 and the rates are gone',
                        'It works just as well, the order only changes the arithmetic',
                        'The Pythagorean theorem stops being true once numbers replace x and y'
                    ],
                    a: 0,
                    whyBy: [
                        'Rates live in the variables. Frozen at 36 + 64 = 100, both sides differentiate to zero and nothing is left to solve.',
                        'The order is the whole method. Substituting first erases both rates from the statement, and no arithmetic afterward recovers them.',
                        'The theorem stays perfectly true at the instant. The loss is that a true statement about fixed numbers carries no rates at all.'
                    ]
                }
            },
            {
                name: 'Interpret',
                text: 'Read the answer in words. When the bottom of the ladder is 6 ft from the wall, the top of the ladder is moving downward at 1.5 ft/s. The minus sign carries the direction, so the sentence and the number say the same thing.'
            },
            {
                name: 'Explore',
                text: 'The lock is off now. Drag x on the picture or use its slider. The ladder moves, y follows from x² + y² = 100, and the top speed updates live. The sign never flips, the magnitude is what changes. As the bottom nears 10 ft, the top falls faster and faster.'
            }
        ]
    },

    /* ---------------- Case 2: the spherical balloon, teaching focus is units ---------------- */
    balloon: {
        label: 'Expanding balloon',
        params: { r: 3, drdt: 0.5, stage: 0 },
        lock: { r: 3, drdt: 0.5 },
        lockFrom: 4,
        height: 560,
        window: [-1, 12, -6.5, 6.5],
        title: (env) => env.stage >= 7
            ? 'Cross-section of the balloon, r = ' + r2(env.r) + ' cm'
            : 'Cross-section of the spherical balloon at the asked instant',
        compute: (env) => {
            const r = clamp(env.r, 0.6, 5);
            const drdt = clamp(env.drdt, 0, 2);
            const V = (4 / 3) * Math.PI * r * r * r;
            const dVdt = 4 * Math.PI * r * r * drdt;
            return {
                r, drdt, V, dVdt,
                solved: env.stage >= 5,
                rim: rateLen(drdt, K_BALLOON, 11.4 - r)
            };
        },
        scene: {
            curves: (env) => {
                const top = (X, e) => Math.sqrt(Math.max(0, e.r * e.r - (X - CX) * (X - CX)));
                const bot = (X, e) => -Math.sqrt(Math.max(0, e.r * e.r - (X - CX) * (X - CX)));
                return [
                    { fn: top, from: CX - env.r, to: CX + env.r, color: 'ink', width: 2.5 },
                    { fn: bot, from: CX - env.r, to: CX + env.r, color: 'ink', width: 2.5 }
                ];
            },
            areas: (env) => [{
                fn: (X, e) => -Math.sqrt(Math.max(0, e.r * e.r - (X - CX) * (X - CX))),
                topFn: (X, e) => Math.sqrt(Math.max(0, e.r * e.r - (X - CX) * (X - CX))),
                from: CX - env.r, to: CX + env.r, color: 'fillA'
            }],
            segments: (env) => {
                const s = [{ x1: CX, y1: 0, x2: CX + env.r, y2: 0, color: 'ink' }];
                if (env.stage >= 2 && env.rim > 0.05) {
                    s.push({ x1: CX + env.r + 0.2, y1: 0, x2: CX + env.r + 0.2 + env.rim, y2: 0, color: 'accent', arrow: 'end', dashed: true });
                }
                return s;
            },
            points: (env) => [
                { x: CX, y: 0, color: 'auxInk', r: 3 },
                {
                    x: CX + env.r, y: 0, color: 'ink',
                    label: (e) => e.stage >= 2 ? 'r = ' + r2(e.r) + ' cm' : '',
                    drag: env.stage >= 7 ? { key: 'r', min: 0.6, max: 5 } : undefined
                }
            ],
            notes: (env) => {
                const n = [];
                if (env.stage >= 2) {
                    n.push({ x: CX + env.r + env.rim + 0.35, y: 0.5, t: 'dr/dt = 0.5 cm/s', color: 'accent' });
                    if (env.stage >= 7) n.push({ x: CX - 1.4, y: env.r + 0.55, t: 'dV/dt ≈ ' + r2(env.dVdt) + ' cm³/s', color: 'up' });
                    else if (env.stage >= 5) n.push({ x: CX - 1.4, y: env.r + 0.55, t: 'dV/dt = 18π ≈ 56.5 cm³/s', color: 'up' });
                    else n.push({ x: CX - 0.6, y: env.r + 0.55, t: 'dV/dt = ?', color: 'auxInk' });
                }
                if (env.stage >= 4) n.push({ x: CX - 1.1, y: -env.r - 0.4, t: 'V ≈ ' + r2(env.V) + ' cm³', color: 'ink' });
                return n;
            }
        },
        facts: (env) => [
            { label: 'Constant', v: () => 'the sphere shape, V = (4/3)πr³', color: 'auxInk' },
            { label: 'Given rate', v: () => 'dr/dt = 0.5 cm/s outward', color: 'accent' },
            { label: 'Instant value', v: () => env.stage >= 7 ? 'r = ' + r2(env.r) + ' cm' : 'r = 3 cm', color: 'ink' },
            {
                label: 'Target rate', color: (e) => e.stage >= 5 ? 'up' : 'auxInk',
                v: () => env.stage >= 7 ? 'dV/dt ≈ ' + r2(env.dVdt) + ' cm³/s'
                    : env.stage >= 5 ? 'dV/dt = 18π ≈ 56.5 cm³/s' : 'dV/dt = ?'
            }
        ],
        eq: (env) => {
            const out = [];
            if (env.stage >= 2) out.push({ t: 'V = (4/3)πr³', rule: 'volume of a sphere, always true' });
            else out.push({ t: 'find the relation that never changes', dim: true, rule: 'the Model step' });
            if (env.stage >= 3) out.push({ t: 'dV/dt = 4πr²·dr/dt', hl: env.stage === 3, rule: 'power rule plus Chain Rule' });
            else out.push({ t: 'differentiate with respect to t', dim: true, rule: 'the Differentiate step' });
            if (env.stage >= 4 && env.stage < 7) out.push({ t: 'dV/dt = 4π·3²·0.5', hl: env.stage === 4, rule: 'the instant r = 3 cm' });
            if (env.stage >= 5 && env.stage < 7) out.push({ t: 'dV/dt = 18π ≈ 56.5 cm³/s', hl: true, rule: 'solve, and keep the cubic unit' });
            if (env.stage >= 7) out.push({ t: 'dV/dt = 4π·' + r2(env.r) + '²·0.5 ≈ ' + r2(env.dVdt) + ' cm³/s', hl: true, rule: 'the same solve at the dragged radius' });
            return out;
        },
        interpret: (env) => env.stage >= 7
            ? 'When the radius is ' + r2(env.r) + ' cm, the volume is increasing at about ' + r2(env.dVdt) + ' cm³/s.'
            : 'When the radius is 3 cm, the balloon\'s volume is increasing at 18π cubic centimeters per second, about 56.5 cm³/s.',
        explore: { key: 'r', label: 'Radius r', min: 0.6, max: 5, step: 0.05, unit: ' cm' },
        stages: [
            {
                name: 'Understand',
                text: 'A spherical balloon is expanding so that its radius increases at 0.5 cm/s. The question asks how fast the volume is increasing when the radius is 3 cm. The sphere shape never changes, 0.5 cm/s is the known rate, r = 3 cm is a single instant, and the target dV/dt stays a question mark until we solve. Watch where this problem will make us think hard, which is the units.'
            },
            {
                name: 'Model',
                text: 'The two quantities answer to one always-true relation, V = (4/3)πr³. The picture is the balloon at the asked instant, a circle standing in for the sphere, with a short outward arrow for the growing radius. A volume has no length to point along, so dV/dt lives in the facts panel as a question mark rather than as another arrow.'
            },
            {
                name: 'Differentiate',
                text: 'Take d/dt of both sides. The power rule turns r³ into 3r², the 3 folds into the fraction, and the Chain Rule attaches dr/dt, so dV/dt = 4πr²·dr/dt.',
                predict: {
                    q: 'V is measured in cubic centimeters and r in centimeters, and the given rate dr/dt carries cm/s. What unit must the answer for dV/dt carry?',
                    choices: [
                        'cm³/s, because the answer counts volume added each second',
                        'cm/s, because every rate in the problem copies the given one',
                        'cm²/s, because a balloon is drawn as a circle'
                    ],
                    a: 0,
                    whyBy: [
                        'The unit follows the quantity being differentiated. V is cubic centimeters, so its rate per second is cm³/s.',
                        'That is the unit of dr/dt, the given rate. The target counts volume, and volume is measured in cubic centimeters.',
                        'A drawing is not a unit. The quantity changing each second is the volume of the balloon, which is cubic.'
                    ]
                }
            },
            {
                name: 'Substitute',
                text: 'The instant is r = 3 cm and the known rate is dr/dt = 0.5 cm/s, so dV/dt = 4π·3²·0.5. The radius stays locked at 3 until the answer is settled.'
            },
            {
                name: 'Solve',
                text: '4π·9·0.5 = 18π, so dV/dt = 18π cm³/s, about 56.5 cm³/s. Compare units once more. The given rate entered as cm/s and the answer left as cm³/s, because the target quantity is a volume.'
            },
            {
                name: 'Interpret',
                text: 'When the radius is 3 cm, the balloon\'s volume is increasing at 18π cubic centimeters per second. The direction is growing, so the rate is positive, and the unit is cubic because the thing counted each second is a volume.'
            },
            {
                name: 'Explore',
                text: 'The lock is off now. Drag r and the balloon grows. The same 0.5 cm/s of radius trades for 4πr²·0.5 of volume each second, so the bigger the balloon already is, the faster its volume climbs.'
            }
        ]
    },

    /* ---------------- Case 3: streetlight and shadow ---------------- */
    shadow: {
        label: 'Streetlight and shadow',
        params: { x: 9, dxdt: 4, stage: 0 },
        height: 520,
        window: [-1.6, 21, -2.6, 17.6],
        title: (env) => env.stage >= 2
            ? 'The shadow, drawn to scale'
            : 'The streetlight, the person, the light ray',
        compute: (env) => {
            const x = clamp(env.x, 2, 12);
            const s = 2 * x / 3;
            const tip = x + s;
            const dxdt = clamp(env.dxdt, -3, 6);
            const dsdt = 2 * dxdt / 3;
            const tipRate = dxdt + dsdt;
            const solved = env.stage >= 5;
            return {
                x, s, tip, dxdt, dsdt, tipRate, solved,
                walkLen: rateLen(Math.abs(dxdt), K_SHADOW, 20 - x),
                sLen: solved ? rateLen(Math.abs(dsdt), K_SHADOW, 20 - tip) : FIX,
                tipLen: rateLen(Math.abs(tipRate), K_SHADOW, 20 - tip)
            };
        },
        scene: {
            curves: () => [
                { fn: () => 0, from: -1.2, to: 20.4, color: 'auxInk' }
            ],
            areas: (env) => env.stage >= 1
                ? [{ fn: () => 0, topFn: () => 0.34, from: env.x, to: env.tip, color: 'fillA' }]
                : [],
            segments: (env) => {
                const s = [
                    { x1: 0, y1: 0, x2: 0, y2: 15, color: 'ink' },
                    { x1: env.x, y1: 0, x2: env.x, y2: 6, color: 'ink' }
                ];
                if (env.stage >= 1) {
                    s.push({ x1: 0, y1: 15, x2: env.tip, y2: 0, color: 'aux', dashed: true });
                }
                if (env.stage >= 2) {
                    s.push({ x1: env.x, y1: 0.85, x2: env.x + env.walkLen, y2: 0.85, color: 'accent', arrow: 'end', dashed: true });
                    s.push({ x1: env.tip, y1: 1.45, x2: env.tip + env.sLen, y2: 1.45, color: env.solved ? 'up' : 'auxInk', arrow: 'end', dashed: true });
                }
                if (env.stage >= 6) {
                    s.push({ x1: env.tip, y1: 2.15, x2: env.tip + env.tipLen, y2: 2.15, color: 'accent', arrow: 'end', dashed: true });
                }
                return s;
            },
            points: (env) => {
                const p = [
                    { x: env.x, y: 0, color: 'ink', labelDy: -10, label: (e) => e.stage >= 2 ? 'x = ' + r2(e.x) + ' ft' : '' },
                    { x: env.x, y: 6, color: 'ink', r: 3 }
                ];
                if (env.stage >= 1) p.push({ x: env.tip, y: 0, r: 4, color: env.solved ? 'up' : 'auxInk' });
                return p;
            },
            notes: (env) => {
                const n = [
                    { x: 0.6, y: 15.2, t: '15 ft · constant', color: 'auxInk' },
                    { x: env.x + 0.55, y: 6.4, t: '6 ft · constant', color: 'auxInk' }
                ];
                if (env.stage >= 2) {
                    n.push({ x: (env.x + env.tip) / 2 - 0.7, y: 0.95, t: 's = ' + r2(env.s) + ' ft', color: 'ink' });
                    n.push({ x: env.x + env.walkLen + 0.2, y: 1.3, t: 'dx/dt = 4 ft/s', color: 'accent' });
                    n.push(env.solved
                        ? { x: env.tip + env.sLen + 0.25, y: 1.9, t: 'ds/dt = 8/3 ≈ 2.67 ft/s', color: 'up' }
                        : { x: env.tip + FIX + 0.25, y: 1.9, t: 'ds/dt = ?', color: 'auxInk' });
                }
                if (env.stage >= 6) n.push({ x: env.tip + env.tipLen + 0.25, y: 2.6, t: 'tip speed = 20/3 ≈ 6.67 ft/s', color: 'accent' });
                return n;
            }
        },
        facts: (env) => [
            { label: 'Constant', v: () => 'lamp 15 ft and person 6 ft', color: 'auxInk' },
            { label: 'Given rate', v: () => 'dx/dt = 4 ft/s away from the lamp', color: 'accent' },
            { label: 'Instant value', v: () => 'none is named, every instant works', color: 'ink' },
            {
                label: 'Target rate', color: (e) => e.stage >= 5 ? 'up' : 'auxInk',
                v: () => env.stage >= 5 ? 'ds/dt = 8/3 ≈ 2.67 ft/s lengthening' : 'ds/dt = ?'
            }
        ],
        eq: (env) => {
            const out = [];
            if (env.stage >= 2) {
                out.push({ t: '15 / (x + s) = 6 / s', rule: 'similar triangles share the light ray' });
                out.push({ t: '9s = 6x', hl: env.stage === 2, rule: 'cross-multiply and collect s' });
            } else {
                out.push({ t: 'write one relation between x and s', dim: true, rule: 'the Model step' });
            }
            if (env.stage >= 3) out.push({ t: '9·ds/dt = 6·dx/dt', hl: env.stage === 3, rule: 'differentiate, both sides stay first power' });
            if (env.stage >= 4) out.push({ t: '9·ds/dt = 6·4', hl: env.stage === 4, rule: 'the given walking rate' });
            if (env.stage >= 5) out.push({ t: 'ds/dt = 24 / 9 = 8 / 3 ≈ 2.67 ft/s', hl: env.stage === 5, rule: 'solve for the shadow rate' });
            if (env.stage >= 6) out.push({ t: 'd(x + s)/dt = 4 + 8 / 3 = 20 / 3 ≈ 6.67 ft/s', rule: 'the challenge, the tip of the shadow' });
            return out;
        },
        interpret: () => 'The shadow\'s length grows at 8/3 ft/s, about 2.67 ft/s, at every instant. The tip of the shadow sits at x + s from the pole, so it moves at 4 + 8/3 = 20/3 ft/s, about 6.67 ft/s, and that speed never changes.',
        stages: [
            {
                name: 'Understand',
                text: 'A 15 ft streetlight casts the shadow of a 6 ft person who walks straight away from the pole at 4 ft/s. The question asks how fast the shadow\'s length s is growing. The two heights never change, 4 ft/s is the known rate, no instant is named, and ds/dt is the target question mark. Notice that this problem hands us no x = 6 style moment, and the facts panel flags it.'
            },
            {
                name: 'Model',
                text: 'The ray from the lamp top grazes the head and lands at the tip, which cuts two similar triangles. The tall one has height 15 and base x + s, the small one height 6 and base s. Matching height to base gives 15 / (x + s) = 6 / s, and cross-multiplying cleans it to 9s = 6x. The band on the ground between the feet and the tip is the shadow itself.',
                predict: {
                    q: 'The ray from the lamp top grazes the head and lands at the tip, cutting two similar triangles. Which equation links the shadow length s to the walking distance x?',
                    choices: [
                        '15 / (x + s) = 6 / s, because the tall triangle reaches all the way to the tip',
                        '15 / x = 6 / s, because the tall triangle ends at the person',
                        '15 / s = 6 / (x + s), because each height pairs with the other triangle\'s base'
                    ],
                    a: 0,
                    whyBy: [
                        'The tall triangle has height 15 and base x + s from pole to tip. The small one has height 6 and base s. Matching height over base gives 15 / (x + s) = 6 / s.',
                        'The base of the tall triangle runs from the pole to the shadow tip, which is x + s. Stopping at the feet cuts it short.',
                        'Similar triangles compare a height with its own base, not the other triangle\'s. Crossed pairings make a false equation.'
                    ]
                }
            },
            {
                name: 'Differentiate',
                text: 'Differentiate 9s = 6x with respect to t, which gives 9·ds/dt = 6·dx/dt. Both sides stay first power in their quantities, so this derivative is one line, and the rates ride along exactly as 4.4 predicted.'
            },
            {
                name: 'Substitute',
                text: 'The only number the problem hands us is the walking rate, so 9·ds/dt = 6·4 = 24. No x value is needed here, because the relation between the rates contains no x at all.'
            },
            {
                name: 'Solve',
                text: 'ds/dt = 24 / 9 = 8 / 3, so the shadow lengthens at 8/3 ft/s, about 2.67 ft/s. The gray question-mark arrow at the tip becomes a green arrow with a real length, and the answer holds at every position of the person.'
            },
            {
                name: 'Interpret',
                text: 'The shadow\'s length grows at 8/3 ft/s no matter where the person walks. Now the challenge the problem did not ask. The tip of the shadow sits at x + s from the pole, so it moves at 4 + 8/3 = 20/3 ft/s, about 6.67 ft/s. The tip outruns the walker, and both speeds stay steady.'
            }
        ]
    }
};

/* One builder, one pipeline. Every case becomes the same tabbed mode: the
   stage param climbs 1 step per card, the asked instant is re-preset on every
   step from Substitute onward so a stray drag can never move it, and the
   interpretation sentence rides in its own big readout from Interpret on. */
function buildMode(c) {
    const steps = c.stages.map((s, i) => {
        const params = { stage: i + 1 };
        if (c.lock && i + 1 >= c.lockFrom) Object.assign(params, c.lock);
        const step = { params, message: s.name + '. ' + s.text };
        if (s.predict) step.predict = s.predict;
        return step;
    });
    const side = [
        { kind: 'readout', title: 'The facts, sorted', items: c.facts },
        { kind: 'eq', title: 'The equations, in order', lines: c.eq }
    ];
    if (c.compare) {
        side.push({
            kind: 'compare', title: 'Freeze first, or differentiate first',
            when: (env) => env.stage >= c.compareStage,
            sides: c.compare.sides, verdict: c.compare.verdict
        });
    }
    side.push({
        kind: 'readout', title: 'In context',
        when: (env) => env.stage >= 6,
        items: (env) => [{ big: true, label: 'Say it in words', v: () => c.interpret(env), color: 'ink' }]
    });
    const controls = c.explore
        ? [Object.assign({}, c.explore, { when: (env) => env.stage >= 7 })]
        : [];
    const mainPane = Object.assign({
        kind: 'graph', title: (env) => c.title(env), height: c.height, window: c.window,
        grid: false, ticks: false
    }, c.scene);
    return {
        label: c.label,
        params: c.params,
        compute: c.compute,
        controls,
        panes: { main: [mainPane], side },
        steps,
        summary: SHARED_SUMMARY
    };
}

export default {
    id: 'u4-solver-lab',
    meta: { unit: 4, topic: '4.5', title: 'Solving Related Rates Problems', visualizerTitle: 'Related Rates Problem Solver' },
    modes: [buildMode(CASES.ladder), buildMode(CASES.balloon), buildMode(CASES.shadow)]
};

/* ---------- helpers ---------- */
/* Arrow length answers to one number: the absolute rate. Quantities like x
   and y never multiply into it, and an unsolved unknown uses FIX instead. */
function rateLen(absRate, k, room) { return Math.max(0, Math.min(MAXLEN, absRate * k, room)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function r2(v) { return String(Math.round(v * 100) / 100); }
function neg(v) { return String(Math.round(v * 100) / 100).replace('-', '−'); }
