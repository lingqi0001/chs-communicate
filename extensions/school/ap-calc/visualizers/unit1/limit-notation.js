/* 1.2 Limit Target Explorer — a limit is nearby behavior, f(a) is the
   point value; the two can disagree or exist without each other. */

const T = 'transfer';

/* Each case picks its own window so the point it is teaching (the stored dot,
   the shared aim) always sits well inside the drawing. */
const WINDOWS = {
    hole: [0, 4.6, -2, 10.5],
    jump: [0, 4.6, -2, 10.5],
    plain: [0, 4.6, -2, 10.5],
    novalue: [0, 4.6, -2, 10.5],
    transfer: [0, 4.6, -3.6, 4.6]
};

export default {
    id: 'u1-limit-notation',
    meta: { unit: 1, topic: '1.2', title: 'Defining Limits and Using Limit Notation', visualizerTitle: 'Limit Target Explorer' },
    intro: 'Drag the two probes toward x = 2 and read the live notation. The limit asks where the outputs are heading.',
    params: { kase: 'hole', k: 7, xL: 0.7, xR: 3.3, shown: 1 },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: [
                { v: 'hole', label: 'hole and a separate dot' },
                { v: 'novalue', label: 'no value at x = 2' },
                { v: 'jump', label: 'jump at 2' },
                { v: 'plain', label: 'continuous at 2' },
                { v: T, label: 'unlabeled graph' }
            ]
        },
        { key: 'k', label: 'actual value f(2)', min: -1, max: 9, step: 0.1, when: (env) => env.kase === 'hole' }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: 'y = f(x)', height: 340,
                window: (env) => WINDOWS[env.kase] || WINDOWS.hole,
                vlines: [{ x: 2, color: 'aux', label: 'x = 2' }],
                curves: (env) => {
                    if (env.kase === 'jump') return [
                        { fn: 'x', from: 0, to: 2, label: 'left branch', color: 'curveA' },
                        { fn: 'x+3', from: 2, to: 4.6, label: 'right branch', color: 'curveA' }
                    ];
                    if (env.kase === T) return [
                        { fn: '-1 + 1.1(2 − x)', from: 0.6, to: 2, color: 'curveA' },
                        { fn: '-1 + 1.0(x − 2)', from: 2, to: 3.8, color: 'curveA' }
                    ];
                    return [{ fn: 'x+2', label: 'curve near x = 2', color: 'curveA' }];
                },
                points: (env) => {
                    const p = [
                        { x: env.xL, fn: branch(env.kase), label: 'L', color: 'up', drag: { key: 'xL', min: 0.15, max: 2 } },
                        { x: env.xR, fn: branch(env.kase, true), label: 'R', color: 'down', drag: { key: 'xR', min: 2, max: 4.45 } }
                    ];
                    if (env.kase === 'hole') { p.push({ x: 2, y: 4, open: true, label: 'hole (2, 4)', color: 'auxInk', labelDx: -78, labelDy: -10 }); p.push({ x: 2, y: env.k, label: 'f(2)', color: 'ink', labelDx: 8, labelDy: 16 }); }
                    if (env.kase === 'novalue') { p.push({ x: 2, y: 4, open: true, label: 'no point stored here', color: 'auxInk', labelDx: -110, labelDy: -12 }); }
                    if (env.kase === 'jump') { p.push({ x: 2, y: 2, open: true, color: 'auxInk' }); p.push({ x: 2, y: 5, label: 'f(2)', color: 'ink' }); }
                    if (env.kase === 'plain') { p.push({ x: 2, y: 4, label: 'f(2) = 4', color: 'ink' }); }
                    if (env.kase === T) {
                        p.push({ x: 2, y: -1, open: true, label: 'open circle', color: 'auxInk', labelDx: 10, labelDy: 20 });
                        p.push({ x: 2, y: 3, label: 'filled dot', color: 'ink', labelDx: 10, labelDy: -8 });
                    }
                    return p;
                }
            },
            {
                kind: 'practice', id: 'u12-transfer', title: 'Check yourself on one graph',
                when: (env) => env.kase === T,
                items: [
                    {
                        q: 'What is lim x→2 f(x)?',
                        choices: ['The limit is −1.', 'The limit is 3.', 'The limit does not exist.'], a: 0,
                        whyBy: [
                            'Both arms approach height −1 as x moves toward 2 from either side. The sides agree, so the limit is −1.',
                            '3 is the height of the filled dot, which is the value f(2). The limit does not ask for that value.',
                            'The two arms converge on the same height. A hole removes the value at the point, not the limit.'
                        ]
                    },
                    {
                        q: 'What is f(2)?',
                        choices: ['f(2) is −1.', 'f(2) is 3.', 'f(2) is undefined.'], a: 1,
                        whyBy: [
                            'The height −1 is where both arms are heading, marked by the open circle. An open circle stores no value.',
                            'The filled dot at (2, 3) is the value the graph stores at x = 2.',
                            'A filled dot sits on the line x = 2, so f(2) exists. The height of that dot is the value.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Live notation',
                lines: (env) => {
                    const all = notationLines(env);
                    const n = Math.round(env.shown);
                    return all.slice(0, n).map((l, i) => i === n - 1 ? Object.assign({}, l, { hl: true }) : l);
                }
            },
            {
                kind: 'readout', title: 'Probe readouts',
                items: [
                    { label: 'x left', v: 'xL' }, { label: 'f(x left)', v: (env) => sideVal(env.kase, env.xL), color: 'up' },
                    { label: 'x right', v: 'xR' }, { label: 'f(x right)', v: (env) => sideVal(env.kase, env.xR, true), color: 'down' }
                ]
            }
        ]
    },
    steps: {
        hole: [
            {
                params: { shown: 1, xL: 0.7 },
                message: 'Line 1 is the left side. The left probe moves toward x = 2, and its height settles on 4. This line never asks what happens at x = 2.'
            },
            {
                params: { shown: 2, xR: 3.3 },
                message: 'Line 2 is the right side. It asks the same question from the other direction, and this height also settles on 4.'
            },
            {
                params: { shown: 3 },
                message: 'Line 3 is the verdict. Both sides aim at one number, so the two-sided limit exists and equals 4. The tag on that line gives the reason: the sides agree.'
            },
            {
                params: { shown: 4, k: 7 },
                predict: {
                    q: 'Both sides head toward 4, but the filled dot sits at 7. What is the limit now?',
                    choices: ['The limit stays 4.', 'The limit becomes 7.', 'The limit does not exist.'], a: 0,
                    why: 'The limit reads only the nearby heights. Changing the value at x = 2 changes nothing near x = 2.'
                },
                message: 'Line 4 states a different kind of fact: the value stored at the point. Drag the f(2) slider and watch that value change.'
            },
            {
                params: { k: 4 },
                message: 'When the value at the point equals the limit, lines 3 and 4 agree. That case is continuity at a point, covered in topic 1.11.'
            }
        ],
        novalue: [
            {
                params: { shown: 1, xL: 0.7 },
                message: 'Line 1 traces the left side. The height climbs toward 4, the same as in the hole case.'
            },
            {
                params: { shown: 2, xR: 3.3 },
                message: 'Line 2 traces the right side, and that height settles on 4 too.'
            },
            {
                params: { shown: 3 },
                message: 'Line 3 is the verdict: the sides share one aim, so the two-sided limit is 4. The two traces alone are enough to reach that verdict.'
            },
            {
                params: { shown: 4 },
                predict: {
                    q: 'Line 4 now says f(2) is not defined, because only an open circle sits on the line x = 2. What is the limit now?',
                    choices: ['The limit stays 4.', 'The limit stops existing.', 'The limit cannot exist without f(2).'], a: 0,
                    why: 'A limit reads the nearby heights. Nothing is stored at x = 2 here, yet the two traces still share one destination. Nearby behavior does not need a value at the target.'
                },
                message: 'This is the case the definition allows: no value at all at x = 2. Drag both probes toward 2 and watch line 3 keep its result while line 4 says f(2) is not defined.'
            },
            {
                params: {},
                message: 'Switch back to the hole case: the value exists there, but it sits at the wrong height. Both graphs have limit 4, because both traces aim at 4. A jump, not a hole, is what removes a two-sided limit.'
            }
        ],
        jump: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'Line 1 reads the left branch. As x approaches 2 from the left, the heights settle on 2.'
            },
            {
                params: { shown: 2, xR: 3.2 },
                message: 'Line 2 reads the right branch. From the right, the heights settle on 5 instead of 2.'
            },
            {
                params: { shown: 3 },
                predict: {
                    q: 'The left side aims at 2, and the right side aims at 5. What is the two-sided limit?',
                    choices: ['The limit does not exist.', 'The limit is 3.5, the average of 2 and 5.', 'The limit is 5, the height of the filled dot.'], a: 0,
                    why: 'A two-sided limit needs one shared target value. Averaging two different targets does not produce a limit.'
                },
                message: 'Line 3 fails, and the tag gives the reason: the sides disagree. Each one-sided limit still exists on its own.'
            },
            {
                params: { shown: 4 },
                message: 'Line 4 still reports the value f(2) = 5. A filled dot cannot fix the disagreement between the two sides.'
            }
        ],
        plain: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'Line 1: the left side heads for 4, and the curve has no gap here.'
            },
            {
                params: { shown: 2, xR: 2.8 },
                message: 'Line 2: the right side heads for the same 4.'
            },
            {
                params: { shown: 3 },
                message: 'Line 3: the sides agree, so the limit is 4. This is the ordinary case that direct substitution assumes without checking.'
            },
            {
                params: { shown: 4 },
                message: 'Line 4: the value stored at the point is also 4. Here the limit equals f(2), which is exactly what continuity at a point means.'
            }
        ],
        transfer: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'This graph has no labels except two markers. Line 1 traces the left arm toward x = 2, and its height keeps falling.'
            },
            {
                params: { shown: 2, xR: 2.8 },
                message: 'Line 2 traces the right arm. Both arms sink toward the same low height, and the open circle sits at that height.'
            },
            {
                params: { shown: 3 },
                predict: {
                    q: 'The open circle sits at height −1, and the filled dot sits at height 3. Which value is lim x→2 f(x)?',
                    choices: ['The limit is −1, because both arms approach −1.', 'The limit is 3, because the filled dot gives the value at the point.', 'The limit does not exist, because the curve has a hole at x = 2.'], a: 0,
                    why: 'The limit is the height both arms approach, and the open circle marks that shared height. The filled dot answers the other question, the value f(2).'
                },
                message: 'Line 3 is the verdict: the sides agree at −1, so the limit is −1. The curve has no point at that height, and a limit does not need one.'
            },
            {
                params: { shown: 4 },
                message: 'Line 4 reports the stored value f(2) = 3, which is not the limit. Answer the two questions under "Check yourself on one graph" before you reread these four lines.'
            }
        ]
    },
    summary: {
        idea: 'A limit describes nearby behavior. The value f(a) describes the point itself. The two can agree, disagree, or exist without each other.',
        mistake: 'The filled dot gets read as the limit. Watch how both arms approach, then read the value at the point separately.',
        transfer: 'Set case to unlabeled graph. The open circle sits at height −1, and the filled dot sits at height 3. Answer the two questions under "Check yourself on one graph", then read the four notation lines to check yourself.'
    }
};

function branch(kase, right) {
    if (kase === 'jump') return right ? (x) => x + 3 : (x) => x;
    if (kase === T) return (x) => (x <= 2 ? -1 + 1.1 * (2 - x) : -1 + 1 * (x - 2));
    return 'x+2';
}
function notationLines(env) {
    /* the two ≈ lines are live probe heights; the verdict compares where each
       side is HEADING, not the two heights themselves */
    const fL = sideVal(env.kase, env.xL), fR = sideVal(env.kase, env.xR, true);
    const tL = aim(env.kase, false), tR = aim(env.kase, true);
    const agree = Math.abs(tL - tR) < 1e-9;
    return [
        { t: 'lim x→2⁻  f(x) ≈ ' + fL.toFixed(2), color: 'up' },
        { t: 'lim x→2⁺  f(x) ≈ ' + fR.toFixed(2), color: 'down' },
        agree
            ? { t: 'lim x→2  f(x) = ' + trim(tL), rule: 'sides agree' }
            : { t: 'lim x→2  f(x) = DNE', rule: 'sides disagree', color: 'down' },
        { t: env.kase === 'novalue' ? 'f(2) is not defined' : 'f(2) = ' + at(env.kase, env.k), rule: 'value at the point' }
    ];
}
function aim(kase, right) {
    if (kase === 'jump') return right ? 5 : 2;
    if (kase === T) return -1;
    return 4;
}
function trim(v) { return String(Math.round(v * 100) / 100); }
function sideVal(kase, x, right) {
    if (kase === 'jump') return right ? x + 3 : x;
    if (kase === T) return x <= 2 ? -1 + 1.1 * (2 - x) : -1 + 1 * (x - 2);
    return x + 2;
}
function at(kase, k) {
    if (kase === 'hole') return String(Math.round(k * 10) / 10);
    if (kase === 'jump') return '5';
    if (kase === T) return '3';
    return '4';
}
