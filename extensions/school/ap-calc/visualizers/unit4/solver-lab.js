/* 4.5 Related Rates Solver Lab — visual-first ladder: all quantities live on the diagram, 
   rates are real arrows (not bars), and the equation panel just does the arithmetic 
   on what you see. Stage flow: 
   1 → ladder + labels, 2 → x/y arrows, 3 → differentiated equation, 4 → plug in numbers, 
   5 → wrong vs right workflow, 6 → interpretation sentence on the diagram. */

const K = 0.12;      /* scale for dx/dt and dy/dt arrow lengths */

export default {
    id: 'u4-solver-lab',
    meta: { unit: 4, topic: '4.5', title: 'Solving Related Rates Problems', visualizerTitle: 'Related Rates Solver Lab' },
    intro: 'A 10 ft ladder leans against a wall. Drag the bottom to read x, y off the diagram. Press Next as the six steps add things directly to the picture.',
    params: { x: 6, dxdt: 2, stage: 1 },
    compute: (env) => {
        const x = Math.min(Math.max(env.x, 0.4), 9.6);
        const y = Math.sqrt(Math.max(0, 100 - x * x));
        const dydt = y > 0.05 ? -x * env.dxdt / y : NaN;
        return { L: 10, y, dydt, xlen: x * env.dxdt * K, ylen: y * dydt * K };
    },
    controls: [
        { key: 'x', label: 'Bottom distance x', min: 0.4, max: 9.6, step: 0.05, unit: ' ft' },
        { key: 'dxdt', label: 'Rate dx/dt', min: 0.5, max: 3, step: 0.1, unit: ' ft/s' }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: env => 'The ladder at x = ' + r2(env.x) + ' ft', height: 560,
                window: [-2, 12, -1, 12], grid: false,
                segments: (env) => {
                    const s = [
                        /* floor */
                        { x1: -0.2, y1: 0, x2: 11.2, y2: 0, color: 'auxInk', width: 3 },
                        /* wall */
                        { x1: 0, y1: -0.2, x2: 0, y2: 11.2, color: 'auxInk', width: 3 },
                        /* ladder itself */
                        { x1: env.x, y1: 0, x2: 0, y2: env.y, color: 'curveA', width: 6 }
                    ];
                    if (env.stage >= 2) {
                        /* dx/dt arrow on floor: starts at x, points right when positive */
                        const dxLen = env.dxdt > 0 ? Math.min(3.2, env.xlen) : 0;
                        const negLen = env.dxdt < 0 ? Math.min(3.2, -env.xlen) : 0;
                        s.push({ x1: env.x + dxLen, y1: 0, x2: env.x, y2: 0, color: 'up', arrow: 'end', dash: true });
                        s.push({ x1: env.x - negLen, y1: 0, x2: env.x, y2: 0, color: 'down', arrow: 'end', dash: true });
                        /* dy/dt arrow on wall: starts at y, points down when negative */
                        const dyNeg = env.dydt < 0;
                        const dyLenAbs = Math.abs(env.ylen);
                        const dyLen = dyNeg ? Math.min(3.2, dyLenAbs) : 0;
                        const posLen = !dyNeg ? Math.min(3.2, dyLenAbs) : 0;
                        if (posLen > 0) s.push({ x1: 0, y1: env.y - posLen, x2: 0, y2: env.y, color: 'up', arrow: 'end', dash: true });
                        else s.push({ x1: 0, y1: env.y + dyLen, x2: 0, y2: env.y, color: 'down', arrow: 'end', dash: true });
                    }
                    /* L constant mark */
                    if (env.stage >= 1) {
                        const cx = env.x / 2, cy = env.y / 2;
                        s.push({ x1: cx - 0.7, y1: cy - 0.7, x2: cx - 0.3, y2: cy - 0.7, color: 'auxInk' });
                        s.push({ x1: cx - 0.3, y1: cy - 0.7, x2: cx - 0.3, y2: cy - 0.3, color: 'auxInk' });
                        s.push({ x1: cx - 0.3, y1: cy - 0.3, x2: cx - 0.7, y2: cy - 0.3, color: 'auxInk' });
                    }
                    return s;
                },
                points: (env) => [
                    { x: env.x, y: 0, color: 'ink', label: env => 'x = ' + r2(env.x) + ' ft', drag: { key: 'x', min: 0.4, max: 9.6 } },
                    { x: 0, y: env.y, color: 'accent', label: env => env.stage >= 1 ? 'y = ' + r2(env.y) + ' ft' : '' },
                    { x: 0, y: 0, color: 'auxInk', r: 2, label: env => env.stage >= 1 ? 'wall' : '' }
                ],
                notes: (env) => [
                    { x: env.x / 2 + 0.5, y: env.y / 2 - 0.8, t: env => 'L = 10 ft, dL/dt = 0' },
                    { x: 1.2, y: env.stage >= 6 ? env.y * 0.7 : -1, t: env => env.stage >= 6 ? 'Answer: the top slides down at ' + r2(-env.dydt) + ' ft/s' : '' }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The equations, in order',
                lines: env => [
                    { t: 'x² + y² = 100', rule: 'relates x and y' },
                    { t: '2x·dx/dt + 2y·dy/dt = 0', hl: env.stage >= 3, rule: env.stage >= 3 ? 'differentiate first' : 'appears at step 3' },
                    { t: env.stage >= 4 ? r2(env.x) + '·' + r2(env.dxdt) + ' + (' + r2(env.y) + ')·dy/dt = 0' : '2x·dx/dt + 2y·dy/dt = 0', hl: env.stage >= 4 },
                    { t: env.stage >= 4 ? 'dy/dt = ' + r2(env.dydt) + ' ft/s' : 'dy/dt = ?', hl: env.stage >= 4 && env.stage < 5 }
                ]
            },
            {
                kind: 'compare', title: 'Freeze first, or differentiate first',
                when: env => env.stage >= 5,
                sides: [
                    {
                        title: 'Wrong · substitute first, then differentiate', tone: 'wrong',
                        lines: ['6² + 8² = 10²', '36 + 64 = 100', 'd/dt of that: 0 = 0', 'No rates left']
                    },
                    {
                        title: 'Right · differentiate first, then substitute', tone: 'right',
                        lines: ['2x·dx/dt + 2y·dy/dt = 0', 'x = 6, y = 8, dx/dt = 2', '12(2) + 16·dy/dt = 0', 'dy/dt = −1.5 ft/s']
                    }
                ],
                verdict: 'Substituting the numbers too early leaves a true statement that says nothing about motion. Differentiate while x and y are still variables, then put the numbers in.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'STEP 1: name what changes with time: x and y. The ladder length L = 10 is fixed, so dL/dt = 0. The little notch on the ladder marks that it never stretches.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The bottom slides out at dx/dt = 2 ft/s. Which way does the top move, and what sign should dy/dt have?',
                choices: ['The top slides down, so dy/dt < 0', 'The top slides up, so dy/dt > 0', 'The top stays put, so dy/dt = 0'], a: 0,
                why: 'The ladder does not stretch, so as x grows, y = √(100 − x²) shrinks. Keep this prediction: the algebra has to agree with it.'
            },
            message: 'Two dashed arrows show the physics now: the orange one grows as the bottom moves right, the red one points down because the top must fall.'
        },
        {
            params: { stage: 3 },
            message: 'STEP 3: differentiate x² + y² = 100 to get 2x·dx/dt + 2y·dy/dt = 0. This equation is what makes the two rates match each other at every instant.'
        },
        {
            params: { stage: 4, x: 6, dxdt: 2 },
            message: 'STEP 4–5: plug in x = 6, y = 8, dx/dt = 2. The equation panel computes 12(2) + 16·dy/dt = 0, so dy/dt = −1.5 ft/s. Try dragging x—watch the signs flip automatically.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Another student substitutes first and writes 36 + 64 = 100, then differentiates. What is wrong with that step?',
                choices: ['A constant differentiates to 0, so the rates disappear', 'Nothing is wrong', 'Only the sign comes out wrong'], a: 0,
                why: 'x and y carry their rate information only while they are variables. Frozen at 6 and 8, the derivative is 0 = 0.'
            },
            message: 'Compare workflows: substitute-first kills the rates before differentiation ever sees them.'
        },
        {
            params: { stage: 6, x: 6, dxdt: 2 },
            message: 'STEP 6: interpret the answer. The value −1.5 ft/s reads as “the top slides down at 1.5 ft/s.” The minus sign gives direction—here, downward.'
        }
    ],
    summary: {
        idea: 'Differentiate the relationship while the quantities are still variables, then substitute the instant. A constant contributes nothing, and every changing variable brings its own rate.',
        mistake: 'Plugging numbers in first. Also avoid reporting “negative, therefore wrong”: the minus sign gives direction—here, downward.',
        transfer: 'Take the same ladder at x = 8. Predict whether |dy/dt| is bigger or smaller than at x = 6, then check with the diagram.'
    }
};

function r2(v) { return String(Math.round(v * 100) / 100); }
