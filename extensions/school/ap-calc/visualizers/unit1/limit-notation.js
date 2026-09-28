/* 1.2 Limit Target Explorer - a limit is nearby behavior, f(a) is the
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
    intro: 'Drag the two probes toward x = 2 and read the live notation. A probe line reports one sample at one x. A limit line states where that side is heading.',
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
                        /* arms span the full frame so the draggable probes
                           always sit on drawn curve, never on blank space */
                        { fn: '-1 + 1.1(2 − x)', from: 0, to: 2, color: 'curveA' },
                        { fn: '-1 + 1.0(x − 2)', from: 2, to: 4.6, color: 'curveA' }
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
                    const all = notationLines(env, env.shown);
                    return all.map((l, i) => i === all.length - 1 ? Object.assign({}, l, { hl: true }) : l);
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
                message: 'Line 1 is the left probe, a sample at one x at a time. Line 2 is the left-sided limit, and it reads 4. Neither line asks what happens at x = 2.'
            },
            {
                params: { shown: 2, xR: 3.3 },
                message: 'Lines 3 and 4 do the same from the other direction. The probe line samples one x, and the limit line reads 4.'
            },
            {
                params: { shown: 3 },
                message: 'Line 5 is the verdict. Both one-sided limit lines aim at 4, so the two-sided limit exists and equals 4. The tag on that line gives the reason: the sides agree.'
            },
            {
                params: { shown: 4, k: 7 },
                predict: {
                    q: 'Both sides head toward 4, but the filled dot sits at 7. What is the limit now?',
                    choices: ['The limit stays 4.', 'The limit becomes 7.', 'The limit does not exist.'], a: 0,
                    why: 'The limit reads only the nearby heights. Changing the value at x = 2 changes nothing near x = 2.'
                },
                message: 'Line 6 states a different kind of fact: the value stored at the point. Drag the f(2) slider and watch that value move while lines 2, 4 and 5 stay at 4.'
            },
            {
                params: { k: 4 },
                message: 'When the value at the point equals the limit, lines 5 and 6 agree. That case is continuity at a point, covered in topic 1.11.'
            }
        ],
        novalue: [
            {
                params: { shown: 1, xL: 0.7 },
                message: 'Line 1 samples the left side, one x at a time, and its height climbs toward 4. Line 2 is the left-sided limit, and it reads 4, the same as in the hole case.'
            },
            {
                params: { shown: 2, xR: 3.3 },
                message: 'Line 3 samples the right side, and line 4 is the right-sided limit. That limit settles on 4 too.'
            },
            {
                params: { shown: 3 },
                message: 'Line 5 is the verdict: the two limit lines share one aim, so the two-sided limit is 4. The two limit lines alone are enough to reach that verdict.'
            },
            {
                params: { shown: 4 },
                predict: {
                    q: 'Line 6 now says f(2) is not defined, because only an open circle sits on the line x = 2. What is the limit now?',
                    choices: ['The limit stays 4.', 'The limit stops existing.', 'The limit cannot exist without f(2).'], a: 0,
                    why: 'A limit reads the nearby heights. Nothing is stored at x = 2 here, yet the two limit lines still share one destination. Nearby behavior does not need a value at the target.'
                },
                message: 'This is the case the definition allows: no value at all at x = 2. Drag both probes toward 2 and watch line 5 keep its result while line 6 says f(2) is not defined.'
            },
            {
                params: {},
                message: 'Switch back to the hole case: the value exists there, but it sits at the wrong height. Both graphs have limit 4, because both limit lines aim at 4. A jump, not a hole, is what removes a two-sided limit.'
            }
        ],
        jump: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'Line 1 samples the left branch at one x. As that sample nears 2 the branch heights settle on 2, and line 2 records that fact as the left-sided limit.'
            },
            {
                params: { shown: 2, xR: 3.2 },
                message: 'Line 3 samples the right branch, and line 4 is the right-sided limit. From the right the heights settle on 5 instead of 2.'
            },
            {
                params: { shown: 3 },
                predict: {
                    q: 'The left side aims at 2, and the right side aims at 5. What is the two-sided limit?',
                    choices: ['The limit does not exist.', 'The limit is 3.5, the average of 2 and 5.', 'The limit is 5, the height of the filled dot.'], a: 0,
                    why: 'A two-sided limit needs one shared target value. Averaging two different targets does not produce a limit.'
                },
                message: 'Line 5 fails, and the tag gives the reason: the sides disagree. The notation writes DNE, short for does not exist. Lines 2 and 4 still stand, so each one-sided limit still exists on its own.'
            },
            {
                params: { shown: 4 },
                message: 'Line 6 still reports the value f(2) = 5. A filled dot cannot fix the disagreement between the two limit lines.'
            }
        ],
        plain: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'Line 1 samples the left side at one x. Line 2 is the left-sided limit, and the left side heads for 4. The curve has no gap here.'
            },
            {
                params: { shown: 2, xR: 2.8 },
                message: 'Line 3 samples the right side at one x. Line 4 is the right-sided limit, and it heads for the same 4.'
            },
            {
                params: { shown: 3 },
                message: 'Line 5: the two limit lines agree, so the limit is 4. This is the ordinary case that direct substitution assumes without checking.'
            },
            {
                params: { shown: 4 },
                message: 'Line 6: the value stored at the point is also 4. Here the limit equals f(2), which is exactly what continuity at a point means.'
            }
        ],
        transfer: [
            {
                params: { shown: 1, xL: 1.2 },
                message: 'This graph has no labels except two markers. Line 1 samples the left arm at one x, and line 2 is the left-sided limit. Both arms sink as x nears 2.'
            },
            {
                params: { shown: 2, xR: 2.8 },
                message: 'Line 3 samples the right arm, and line 4 is the right-sided limit. Both arms fall to the same low height, and the open circle sits at that height.'
            },
            {
                params: { shown: 3 },
                predict: {
                    q: 'The open circle sits at height −1, and the filled dot sits at height 3. Which value is lim x→2 f(x)?',
                    choices: ['The limit is −1, because both arms approach −1.', 'The limit is 3, because the filled dot gives the value at the point.', 'The limit does not exist, because the curve has a hole at x = 2.'], a: 0,
                    why: 'The limit is the height both arms approach, and the open circle marks that shared height. The filled dot answers the other question, the value f(2).'
                },
                message: 'Line 5 is the verdict: the sides agree at −1, so the limit is −1. The curve has no point at that height, and a limit does not need one.'
            },
            {
                params: { shown: 4 },
                message: 'Line 6 reports the stored value f(2) = 3, which is not the limit. Answer the two questions under "Check yourself on one graph" before you reread these six lines.'
            }
        ]
    },
    summary: {
        idea: 'A limit describes nearby behavior. The value f(a) describes the point itself. The two can agree, disagree, or exist without each other.',
        mistake: 'The filled dot gets read as the limit. Watch how both arms approach, then read the value at the point separately.',
        transfer: 'Set case to unlabeled graph. The open circle sits at height −1, and the filled dot sits at height 3. Answer the two questions under "Check yourself on one graph", then read the six notation lines to check yourself.'
    }
};

function branch(kase, right) {
    if (kase === 'jump') return right ? (x) => x + 3 : (x) => x;
    if (kase === T) return (x) => (x <= 2 ? -1 + 1.1 * (2 - x) : -1 + 1 * (x - 2));
    return 'x+2';
}
function notationLines(env, stage) {
    /* A probe sits at one x, so its line reports a SAMPLE. The limit lines are
       separate facts: each names where one side is HEADING, with an equals
       sign and the settled limit value, never the height of a moving probe. */
    const shown = Math.max(1, Math.min(4, Math.round(stage)));
    const side = (right) => {
        const x = right ? env.xR : env.xL;
        const y = sideVal(env.kase, x, right);
        return { t: (right ? 'right probe' : 'left probe') + ': x = ' + trim(x) + ', f(x) = ' + trim(y), color: right ? 'down' : 'up', rule: 'a sample at this x' };
    };
    const oneSided = (right) => ({
        t: 'lim x→2' + (right ? '⁺  ' : '⁻  ') + 'f(x) = ' + trim(aim(env.kase, right)),
        color: right ? 'down' : 'up',
        rule: 'one-sided limit'
    });
    const lines = [];
    if (shown >= 1) lines.push(side(false), oneSided(false));
    if (shown >= 2) lines.push(side(true), oneSided(true));
    if (shown >= 3) {
        const agree = Math.abs(aim(env.kase, false) - aim(env.kase, true)) < 1e-9;
        lines.push(agree
            ? { t: 'lim x→2  f(x) = ' + trim(aim(env.kase, false)), rule: 'sides agree' }
            : { t: 'lim x→2  f(x) = DNE', rule: 'sides disagree' });
    }
    if (shown >= 4) {
        lines.push({ t: env.kase === 'novalue' ? 'f(2) is not defined' : 'f(2) = ' + at(env.kase, env.k), rule: 'value at the point' });
    }
    return lines;
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
