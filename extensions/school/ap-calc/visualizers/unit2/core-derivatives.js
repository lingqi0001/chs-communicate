/* 2.7 Core Derivative Function Lab — sin, cos, eˣ and ln.

   Four teaching tabs plus a check tab, and the four rules are argued
   differently, because they are not recognized the same way:
     sin  → landmark slopes. The crest and the trough read 0, so the sample
            pattern is the cosine.
     cos  → the sign flip. Sizes match sin x, signs do not, and a compare card
            derives the minus instead of asserting it.
     eˣ   → one graph, no twin. Height and measured slope are the same number,
            so f′ is drawn dashed on top of f and only one line stays visible.
     ln   → near zero the tangent is nearly vertical, far right it is flat, and
            the thinning samples are the positive branch of 1/x.

   The original function never leaves the screen, and the lower axis only ever
   holds slopes measured on the curve above it. The derivative curve is revealed
   by omission (curves: env => ready ? [c] : []) and is never previewed dashed
   before the student has answered. Each tab ends with a hidden-derivative card,
   and the check tab keeps four unlabeled originals with their samples, so the
   rule has to be read off shape plus slope evidence.

   Probe ranges are per tab: sin and cos span the whole 0..2π window and reach
   x = 0 and a little negative, eˣ spans −2.5..2 so the left tail is probeable,
   and only ln is floored at x = 0.2, because ln x has no value at or below 0.
   Slider min/max/label are constants: the control strip is not re-labelled from
   env, so each tab carries its own control instead of one shared range. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

const PI = Math.PI;
const OPTS = ['cos x', '−sin x', 'eˣ', '1/x'];
const ORDER = ['sin', 'cos', 'exp', 'ln'];

function win(x0, x1, y0, y1) { return [x0, x1, y0, y1]; }
function trim(v) { return String(Math.round(v * 100) / 100); }
function slopeOf(c, x) { return derivative(c.f, x); }

/* reason[j] is how a student would justify picking option j. refute[j] is the
   check that undoes option j, so both lists stay keyed to the same index as OPTS.
   order[j] is the display order, and the four cases do not put the answer in the
   same seat, so the cards cannot be solved by position. */
const CASES = {
    sin: {
        f: (x) => Math.sin(x), fp: (x) => Math.cos(x), name: 'sin x', answer: 0,
        order: [2, 0, 3, 1],
        win: win(-0.9, 6.7, -1.45, 1.45), slopeWin: win(-0.9, 6.7, -1.55, 1.55),
        lo: -0.9, hi: 6.7, probe: [-0.6, 6.4], pad: 0.35,
        xs: [0, PI / 2, PI, 1.5 * PI, 2 * PI],
        reason: [
            'Its heights are 1 at x = 0 and −1 at x = π, and those are two of the samples.',
            'It waves between −1 and 1, and the samples wave between −1 and 1 too.',
            'Its slopes keep growing, and these samples keep changing size.',
            'It is positive, and a slope is allowed to be positive.'
        ],
        refute: {
            1: '−sin x is 0 at x = 0, and the first sample is 1. It reads −1 at π/2, where that sample is 0.',
            2: 'eˣ is never 0 and never negative, and this list has samples of 0 and −1.',
            3: '1/x is never 0 and never negative, and this list has samples of 0 at π/2 and at 3π/2.'
        },
        why: 'The samples read 1, 0, −1, 0 and 1 at x = 0, π/2, π, 3π/2 and 2π, and cos x has exactly those heights there. The slope is 0 wherever the sine turns around.'
    },
    cos: {
        f: (x) => Math.cos(x), fp: (x) => -Math.sin(x), name: 'cos x', answer: 1,
        order: [0, 3, 1, 2],
        win: win(-0.9, 6.7, -1.45, 1.45), slopeWin: win(-0.9, 6.7, -1.55, 1.55),
        lo: -0.9, hi: 6.7, probe: [-0.6, 6.4], pad: 0.35,
        xs: [0, PI / 2, PI, 1.5 * PI, 2 * PI],
        reason: [
            'It is 1 at x = 0, and the cosine curve also starts at 1.',
            'It is −1 at x = π/2, which is the sample read at that x.',
            'It stays above 0, and several of these samples are small.',
            'It is 1 at x = π/2, and that sample has size 1.'
        ],
        refute: {
            0: 'The cosine is flat at x = 0, so its slope sample there is 0 and not 1.',
            2: 'Every reading of eˣ is positive, while the slopes of the cosine on 0 < x < π are negative.',
            3: 'The size matches sin x and the sign does not. The cosine falls through π/2, so that sample is −1, and that flip is the minus.'
        },
        why: '−sin x gives 0, −1, 0, 1 and 0 at the five sample points. The minus is there because the cosine is falling on 0 < x < π, where sin x is positive.'
    },
    exp: {
        f: (x) => Math.exp(x), fp: (x) => Math.exp(x), name: 'eˣ', answer: 2,
        order: [1, 3, 0, 2],
        win: win(-2.7, 2.2, -0.7, 8.4), slopeWin: win(-2.7, 2.2, -0.7, 8.4),
        lo: -2.7, hi: 2.2, probe: [-2.5, 2], pad: 1.2,
        xs: [-2, -1, 0, 1, 2],
        reason: [
            'Its values stay inside −1 and 1, and the samples at the left are small.',
            'It dips below 0, and a slope is allowed to be negative.',
            'The measured slopes equal the heights at all five x values marked on the graph.',
            'It shrinks as x grows, and the steepness of the tangent does change.'
        ],
        refute: {
            0: 'cos x never leaves −1 and 1, and at x = 2 the measured slope is 7.39.',
            1: '−sin x is negative on half of the window, while this curve climbs everywhere and no sample is negative.',
            3: '1/x falls toward 0 as x grows, while these slopes rise from 0.14 to 7.39.'
        },
        why: 'The height and the measured slope are the same number at x = −2, −1, 0, 1 and 2, so the slope curve has to land on the curve it came from.'
    },
    ln: {
        f: (x) => Math.log(x), fp: (x) => 1 / x, name: 'ln x', answer: 3,
        order: [3, 0, 2, 1],
        win: win(-1.5, 6.2, -2.6, 2.6), slopeWin: win(-1.5, 6.2, -0.4, 5.6),
        lo: -1.5, hi: 6.2, probe: [0.2, 6], pad: 0.7,
        xs: [0.2, 0.5, 1, 2, 4],
        reason: [
            'It comes down right after x = 0, and this list of samples comes down too.',
            'It also reaches 1, and one of these samples is exactly 1.',
            'It is positive everywhere, and every sample here is positive.',
            'It is 5 at x = 0.2 and 0.25 at x = 4, which are the two outer samples.'
        ],
        refute: {
            0: 'cos x falls all the way to −1 and then turns back up. These samples never leave the positive side and never turn.',
            1: '−sin x is negative at x = 0.2, and the sample there reads 5.',
            2: 'eˣ grows as x grows, while these samples fall from 5 to 0.25.'
        },
        why: 'The samples thin out exactly like 1/x on the positive branch. The branch of 1/x at negative x is not part of the rule, because ln x has no value there to measure.'
    }
};

function samplePts(c) {
    return c.xs.map(x => ({ x, y: slopeOf(c, x), r: 5, color: 'up', label: 'slope ' + trim(slopeOf(c, x)) }));
}

function practiceItem(key, unlabeled) {
    const c = CASES[key];
    const seat = c.order.indexOf(c.answer);
    return {
        q: unlabeled
            ? 'The curve above is one of the four in this lab, and it carries no name here. The lower axis lists the slopes measured on it, and the slope curve is not drawn. Which function is f′(x)?'
            : 'The upper graph is f(x) = ' + c.name + ', and the lower axis still lists its measured slope samples. The slope curve itself is hidden. Which function is f′(x)?',
        choices: c.order.map(j => OPTS[j] + '. ' + c.reason[j]),
        a: seat,
        why: c.why,
        whyBy: c.order.map(j => j === c.answer ? 'Correct. ' + c.why : 'Not ' + OPTS[j] + '. ' + c.refute[j])
    };
}

/* the check tab picks a case by index, and a control can hand back anything, so
   every read of which goes through here */
function mixIndex(env) {
    return Math.min(ORDER.length - 1, Math.max(0, Math.floor(Number(env.which) || 0)));
}
function mixCase(env) { return CASES[ORDER[mixIndex(env)]]; }

/* ---------- tab 1: sin, read the turns ---------- */
function sinMode() {
    const c = CASES.sin;
    return {
        label: 'sin x',
        intro: 'The upper axis is f(x) = sin x. The lower axis is empty, because it only ever holds a slope that has been measured on the curve above it.',
        params: { x0: 0, stage: 0, practice: 0 },
        fns: { f: (x) => Math.sin(x), fp: (x) => Math.cos(x) },
        controls: [{ key: 'x0', label: 'probe x', min: -0.6, max: 6.4, step: 0.02 }],
        panes: {
            main: [
                {
                    kind: 'graph', height: 200,
                    title: env => 'Height graph, y = sin x',
                    window: c.win,
                    curves: env => [{ fn: 'f', color: 'curveA', label: 'sin x' }],
                    points: env => env.stage >= 1
                        ? [{ x: env.x0, fn: 'f', color: 'accent', label: 'x = ' + trim(env.x0), drag: { key: 'x0', min: c.probe[0], max: c.probe[1] } }]
                        : [],
                    tangents: env => env.stage >= 1 ? [{ x: env.x0, fn: 'f', color: 'accent', reach: 0.3, label: 'slope' }] : [],
                    vlines: env => env.stage >= 2 ? c.xs.map(x => ({ x, color: 'auxInk' })) : []
                },
                {
                    kind: 'graph', height: 200,
                    title: env => env.stage >= 3 ? 'Slope graph, y = cos x' : 'Slope readings, a height here is a slope up there',
                    window: c.slopeWin,
                    curves: env => env.stage >= 3 && env.practice < 0.5
                        ? [{ fn: 'fp', color: 'curveC', dashed: true, label: 'cos x', labelAt: 4.6 }]
                        : [],
                    points: env => {
                        const pts = [];
                        if (env.stage >= 1) pts.push({ x: env.x0, y: slopeOf(c, env.x0), color: 'accent', label: 'slope ' + trim(slopeOf(c, env.x0)) });
                        if (env.stage >= 2) samplePts(c).forEach(p => pts.push(p));
                        return pts;
                    }
                },
                {
                    kind: 'practice', id: 'core-p-sin', title: 'Name the derivative from the evidence',
                    when: env => env.practice > 0.5,
                    items: env => [practiceItem('sin')]
                }
            ],
            side: [
                {
                    kind: 'readout', title: 'One probe, one reading',
                    when: env => env.stage >= 1,
                    items: env => [
                        { label: 'x', v: env.x0, color: 'accent' },
                        { label: 'height sin x', v: c.f(env.x0) },
                        { label: 'slope measured here', v: slopeOf(c, env.x0), big: true, color: 'up' }
                    ]
                },
                {
                    kind: 'eq', title: 'The rule this tab built',
                    when: env => env.stage >= 3 && env.practice < 0.5,
                    lines: env => [
                        { t: 'd/dx sin x = cos x', hl: true },
                        { t: 'The slope is 0 exactly where the sine turns around.', color: 'auxInk' }
                    ]
                },
                {
                    kind: 'note', tone: 'warn',
                    when: env => env.practice > 0.5,
                    text: 'The slope curve is gone. Read the crest and the trough of the sine, then use the sample list to argue the rule back.'
                }            ]
        },
        steps: [
            {
                params: { stage: 1, x0: 0 },
                message: 'The probe is at x = 0, where the sine climbs fastest. Its tangent leans upward, and the one height below reads slope 1.'
            },
            {
                params: { stage: 2, x0: 1 },
                message: 'Five x values are marked on both axes now. The crest at π/2 and the trough at 3π/2 read slope 0, and the steepest part of the fall at π reads −1. The probe sits between samples so you can add a reading of your own.'
            },
            {
                params: { stage: 3 },
                predict: {
                    q: 'A curve through the five samples has heights 1, 0, −1, 0 and 1. Which function is it?',
                    choices: [
                        'sin x. It also waves between 1 and −1 across this window.',
                        'cos x. It is 1 at x = 0, 0 at π/2 and −1 at π, matching the samples.',
                        '−cos x. It waves between the same two sizes as the samples do.'
                    ],
                    a: 1,
                    whyBy: [
                        'sin x is 0 at x = 0, and the first sample is 1. It reads 1 at π/2, where the sample is 0.',
                        'Correct. cos x is 1 at x = 0, 0 at π/2, −1 at π, 0 at 3π/2 and 1 at 2π, which is the sample list one by one.',
                        '−cos x is −1 at x = 0, so its signs run the wrong way. Flipping cos x is what −sin x looks like.'
                    ],
                    why: 'sin x starts at 0 and the samples start at 1, and −cos x starts at −1. Only cos x passes through all five readings.'
                },
                message: 'The samples are joined by one curve now, and it is cos x. Height on the lower axis is slope on the upper one.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'The named curve is hidden again, and the sine stays on screen with its samples. Rebuild the rule from the crest and the trough.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'For sin x the landmark to trust is the turn. A crest or a trough always gives a slope of 0, and that is where cos x crosses the axis.'
            }
        ],
        summary: {
            idea: 'The derivative of sin x is cos x. The slope is 0 at the crest and the trough, it is +1 where the sine climbs through x = 0, and it is −1 where the sine falls through π.',
            mistake: 'Students read the height at x = 0 and answer 0. The sine is 0 there but it is climbing, and a climbing curve has a positive slope.',
            transfer: 'Cover the rule and find the two turning points of the sine. Two zeros of slope already fix the phase of cos x.'
        }
    };
}

/* ---------- tab 2: cos, where the minus comes from ---------- */
function cosMode() {
    const c = CASES.cos;
    return {
        label: 'cos x',
        intro: 'The upper axis is f(x) = cos x. This tab is not about the shape of the samples, it is about their signs, because that is where the minus comes from.',
        params: { x0: 0.4, stage: 0, practice: 0 },
        fns: { f: (x) => Math.cos(x), fp: (x) => -Math.sin(x) },
        controls: [{ key: 'x0', label: 'probe x', min: -0.6, max: 6.4, step: 0.02 }],
        panes: {
            main: [
                {
                    kind: 'graph', height: 200,
                    title: env => 'Height graph, y = cos x',
                    window: c.win,
                    curves: env => [{ fn: 'f', color: 'curveA', label: 'cos x' }],
                    points: env => env.stage >= 1
                        ? [{ x: env.x0, fn: 'f', color: 'accent', label: 'x = ' + trim(env.x0), drag: { key: 'x0', min: c.probe[0], max: c.probe[1] } }]
                        : [],
                    tangents: env => env.stage >= 1 ? [{ x: env.x0, fn: 'f', color: 'accent', reach: 0.3, label: 'slope' }] : [],
                    vlines: env => env.stage >= 2 ? c.xs.map(x => ({ x, color: 'auxInk' })) : []
                },
                {
                    kind: 'graph', height: 200,
                    title: env => env.stage >= 4 ? 'Slope graph, y = −sin x' : 'Slope readings, look at their signs',
                    window: c.slopeWin,
                    curves: env => env.stage >= 4 && env.practice < 0.5
                        ? [{ fn: 'fp', color: 'curveC', dashed: true, label: '−sin x', labelAt: 4.6 }]
                        : [],
                    points: env => {
                        const pts = [];
                        if (env.stage >= 1) pts.push({ x: env.x0, y: slopeOf(c, env.x0), color: 'accent', label: 'slope ' + trim(slopeOf(c, env.x0)) });
                        if (env.stage >= 2) samplePts(c).forEach(p => pts.push(p));
                        return pts;
                    },
                    hlines: env => env.stage >= 3 ? [{ y: 0, color: 'down', dash: false, label: 'zero slope' }] : []
                },
                {
                    kind: 'compare', title: 'Why the minus has to be there',
                    when: env => env.stage >= 3 && env.stage < 4 && env.practice < 0.5,
                    sides: env => [
                        {
                            title: 'What these slopes do',
                            tone: 'wrong',
                            lines: [
                                'On 0 < x < π the cosine falls.',
                                'Its sample reads −1 at π/2.',
                                'So the slope curve is below the axis there.'
                            ]
                        },
                        {
                            title: 'What sin x does',
                            tone: 'right',
                            lines: [
                                'On the same interval sin x is positive.',
                                'It reaches +1 at π/2.',
                                'So sin x alone has the wrong sign.'
                            ]
                        }
                    ],
                    verdict: env => 'Same sizes and opposite signs. Turning sin x over the axis is the only move that fits, and that turn is the minus.'
                },
                {
                    kind: 'practice', id: 'core-p-cos', title: 'Name the derivative from the evidence',
                    when: env => env.practice > 0.5,
                    items: env => [practiceItem('cos')]
                }
            ],
            side: [
                {
                    kind: 'readout', title: 'One probe, one reading',
                    when: env => env.stage >= 1,
                    items: env => [
                        { label: 'x', v: env.x0, color: 'accent' },
                        { label: 'height cos x', v: c.f(env.x0) },
                        { label: 'slope measured here', v: slopeOf(c, env.x0), big: true, color: slopeOf(c, env.x0) < 0 ? 'down' : 'up' }
                    ]
                },
                {
                    kind: 'eq', title: 'The rule this tab built',
                    when: env => env.stage >= 4 && env.practice < 0.5,
                    lines: env => [
                        { t: 'd/dx cos x = −sin x', hl: true },
                        { t: 'The cosine falls wherever sin x is positive, so its slope is the negative of sin x.', color: 'auxInk' }
                    ]
                },
                {
                    kind: 'note', tone: 'warn',
                    when: env => env.practice > 0.5,
                    text: 'Check one sign before you answer. The cosine is falling at x = 1, so its slope there cannot be positive.'
                }
            ]
        },
        steps: [
            {
                params: { stage: 1, x0: 0.4 },
                message: 'The probe sits just past x = 0, where the cosine has left its crest and is falling. The reading below is negative, and the height above is still positive.'
            },
            {
                params: { stage: 2, x0: 1 },
                message: 'Three of the five samples read 0, and the other two read −1 and +1. Those sizes look familiar, so read the signs before you name anything.'
            },
            {
                params: { stage: 3 },
                predict: {
                    q: 'The sample at x = π/2 reads −1, and sin(π/2) is +1. Which function can be the slope curve?',
                    choices: [
                        'cos x. It starts at its maximum, and the cosine curve does too.',
                        'sin x. It reaches 1 at π/2, and that sample has size 1.',
                        '−sin x. It is −1 at π/2, and it is 0 at x = 0 where the cosine is flat.'
                    ],
                    a: 2,
                    whyBy: [
                        'cos x is 1 at x = 0. The cosine itself is flat there, so its slope sample is 0.',
                        'The size is right and the sign is wrong. The cosine falls through π/2, so its slope there is −1.',
                        'Correct. −sin x is 0, −1, 0 and 1 at x = 0, π/2, π and 3π/2, which is the sample list in order.'
                    ],
                    why: 'The sizes match sin x everywhere, and the signs match nowhere on 0 < x < π. The slope curve has to be sin x turned over the axis.'
                },
                message: 'Two columns of signs side by side. Nothing about the sizes was wrong, so the only repair left is the flip.'
            },
            {
                params: { stage: 4 },
                message: 'The samples are joined by one curve now, and it is sin x turned upside down, which is y = −sin x.'
            },
            {
                params: { stage: 4, practice: 1 },
                message: 'The named curve is hidden again, the cosine stays on screen, and its samples stay below it.'
            },
            {
                params: { stage: 4, practice: 1 },
                message: 'This minus is the most common loss in the unit. Where the cosine falls, the slope has to be negative.'
            }
        ],
        summary: {
            idea: 'The derivative of cos x is −sin x. The sizes of the slopes are the values of sin x, and the sign is turned over, because the cosine falls exactly where sin x is positive.',
            mistake: 'Students write sin x, keep the size and lose the minus. Test one point: at x = π/2 the cosine falls steeply, so its slope is −1.',
            transfer: 'Pick any interval where the curve is falling. If your candidate is positive on that interval, the sign is wrong.'
        }
    };
}

/* ---------- tab 3: eˣ, one graph ---------- */
function expMode() {
    const c = CASES.exp;
    return {
        label: 'eˣ',
        intro: 'The upper axis is f(x) = eˣ, and this tab needs only one graph. If the slope equals the height at every x, the slope curve has to land on the curve it came from.',
        params: { x0: 0, stage: 0, practice: 0 },
        fns: { f: (x) => Math.exp(x), fp: (x) => Math.exp(x) },
        controls: [{ key: 'x0', label: 'probe x', min: -2.5, max: 2, step: 0.05 }],
        panes: {
            main: [
                {
                    kind: 'graph', height: 300,
                    title: env => env.stage >= 3 ? 'One graph, f and f′ drawn together, y = eˣ' : 'Height graph, y = eˣ',
                    window: c.win,
                    curves: env => {
                        const list = [{ fn: 'f', color: 'curveA', label: 'eˣ' }];
                        if (env.stage >= 3 && env.practice < 0.5) list.push({ fn: 'fp', color: 'curveC', dashed: true, width: 2.5, label: 'f′(x)', labelAt: -1.4 });
                        return list;
                    },
                    points: env => env.stage >= 1
                        ? [{ x: env.x0, fn: 'f', color: 'accent', label: 'x = ' + trim(env.x0), drag: { key: 'x0', min: c.probe[0], max: c.probe[1] } }]
                        : [{ x: 0, fn: 'f', color: 'auxInk', r: 4, label: '(0, 1)' }],
                    tangents: env => env.stage >= 1 ? [{ x: env.x0, fn: 'f', color: 'accent', reach: 0.3, label: 'slope' }] : [],
                    notes: env => env.stage >= 3 && env.practice < 0.5
                        ? [{ x: -2.5, y: 7.7, t: 'One line is all the overlay leaves', color: 'up' }]
                        : [],
                    vlines: env => env.stage >= 2 ? c.xs.map(x => ({ x, color: 'auxInk', label: 'x = ' + trim(x) })) : []
                },
                {
                    kind: 'table', title: 'Height and measured slope at the same x values',
                    when: env => env.stage >= 2,
                    digits: 2,
                    cols: ['x', 'height eˣ', 'slope measured here', 'the two numbers'],
                    rows: env => c.xs.map(x => [
                        x,
                        c.f(x),
                        slopeOf(c, x),
                        { v: Math.abs(c.f(x) - slopeOf(c, x)) < 0.01 ? 'equal' : 'different', bold: true, color: 'up' }
                    ]),
                    note: env => env.practice > 0.5
                        ? 'The dashed copy of f′ is hidden now, so this list of numbers is the evidence.'
                        : 'The slopes are measured on the curve, not copied from a rule.'
                },
                {
                    kind: 'practice', id: 'core-p-exp', title: 'Name the derivative from the evidence',
                    when: env => env.practice > 0.5,
                    items: env => [practiceItem('exp')]
                }
            ],
            side: [
                {
                    kind: 'readout', title: 'Height against slope',
                    when: env => env.stage >= 1,
                    items: env => [
                        { label: 'x', v: env.x0, color: 'accent' },
                        { label: 'height eˣ', v: c.f(env.x0), big: true },
                        { label: 'slope measured here', v: slopeOf(c, env.x0), big: true, color: 'up' }
                    ]
                },
                {
                    kind: 'eq', title: 'The rule this tab built',
                    when: env => env.stage >= 3 && env.practice < 0.5,
                    lines: env => [
                        { t: 'd/dx eˣ = eˣ', hl: true },
                        { t: 'The slope curve sits on the curve it came from.', color: 'auxInk' }
                    ]
                },
                {
                    kind: 'note', tone: 'warn',
                    when: env => env.stage >= 3 && env.practice < 0.5,
                    text: 'In eˣ the variable sits in the exponent, so this curve is not a power of x. Its slope is read from its own height.'
                }
            ]
        },
        steps: [
            {
                params: { stage: 1, x0: 0 },
                message: 'The probe is at x = 0, where the height is 1 and the measured slope is 1 as well. Drag the dot and watch the two numbers move together.'
            },
            {
                params: { stage: 2, x0: -2 },
                message: 'Five x values are marked on the graph and listed below it, and the slider reaches as far left as x = −2.5. Out here the curve is nearly flat and the slope is nearly 0, and the two agree.'
            },
            {
                params: { stage: 3 },
                predict: {
                    q: 'The height column and the slope column match at every row. What should appear when the slope curve is drawn on this graph?',
                    choices: [
                        'Two separate curves. A derivative always sits somewhere different from its function.',
                        'One visible curve. A slope curve equal to the heights lands on the graph it came from.',
                        'A flat line at height 1. The slope of an exponential never changes.'
                    ],
                    a: 1,
                    whyBy: [
                        'That is what happens for sin x and cos x. Here the two columns are equal, so the two drawings coincide.',
                        'Correct. Equal numbers at every x mean the same set of points, so the dashed drawing covers the solid one.',
                        'The slope at x = 0 is 1 and the slope at x = 2 is 7.39. The tangent gets steeper as x grows.'
                    ],
                    why: 'The slope equals the height at every x in the window, so the two drawings land on each other.'
                },
                message: 'The dashed f′ is drawn on the same axes as f, and there is no gap left to look for.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'The dashed copy is hidden again and the table stays. Name the derivative from the numbers.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'For eˣ the evidence is arithmetic. The height column and the slope column are the same column, so one graph is enough for this case.'
            }
        ],
        summary: {
            idea: 'The derivative of eˣ is eˣ. The measured slope equals the height at every x, including the negative side, so the slope curve coincides with the original curve instead of sitting next to it.',
            mistake: 'Students reach for the rule that brings an exponent down. That rule needs a constant exponent over a base of x, and here the variable is the exponent.',
            transfer: 'Read the height at one x, then read the tangent slope at that same x. If they match everywhere you test, the function is its own derivative.'
        }
    };
}

/* ---------- tab 4: ln, steep then flat ---------- */
function lnMode() {
    const c = CASES.ln;
    return {
        label: 'ln x',
        intro: 'The upper axis is f(x) = ln x. Nothing is drawn at or left of x = 0, because ln x has no value there, and the probe cannot be put there either.',
        params: { x0: 1, stage: 0, practice: 0 },
        fns: { f: (x) => Math.log(x), fp: (x) => 1 / x },
        controls: [{ key: 'x0', label: 'probe x, only x above 0 exists', min: 0.2, max: 6, step: 0.02 }],
        panes: {
            main: [
                {
                    kind: 'graph', height: 200,
                    title: env => 'Height graph, y = ln x',
                    window: c.win,
                    curves: env => [{ fn: 'f', color: 'curveA', label: 'ln x', from: 0.02 }],
                    points: env => env.stage >= 1
                        ? [{ x: env.x0, fn: 'f', color: 'accent', label: 'x = ' + trim(env.x0), drag: { key: 'x0', min: c.probe[0], max: c.probe[1] } }]
                        : [],
                    tangents: env => env.stage >= 1 ? [{ x: env.x0, fn: 'f', color: 'accent', reach: 0.3, label: 'slope' }] : [],
                    vband: env => [{ from: c.win[0], to: 0, color: 'fillB' }],
                    vlines: env => [{ x: 0, color: 'down', dash: false, label: 'x = 0' }],
                    notes: env => [{ x: -1.4, y: 0.6, t: 'No curve on this side, ln x is undefined at and below x = 0', color: 'auxInk' }]
                },
                {
                    kind: 'graph', height: 200,
                    title: env => env.stage >= 3 ? 'Slope graph, the positive branch of y = 1/x' : 'Slope readings, all of them above the axis',
                    window: c.slopeWin,
                    curves: env => env.stage >= 3 && env.practice < 0.5
                        ? [{ fn: 'fp', color: 'curveC', dashed: true, from: 0.17, to: c.hi, label: '1/x', labelAt: 4.6 }]
                        : [],
                    points: env => {
                        const pts = [];
                        if (env.stage >= 1) pts.push({ x: env.x0, y: slopeOf(c, env.x0), color: 'accent', label: 'slope ' + trim(slopeOf(c, env.x0)) });
                        if (env.stage >= 2) samplePts(c).forEach(p => pts.push(p));
                        return pts;
                    },
                    notes: env => env.stage >= 3 && env.practice < 0.5
                        ? [{ x: 0.25, y: 5.15, t: 'The drawing stops at x = 0, and so does the rule', color: 'down' }]
                        : []
                },
                {
                    kind: 'practice', id: 'core-p-ln', title: 'Name the derivative from the evidence',
                    when: env => env.practice > 0.5,
                    items: env => [practiceItem('ln')]
                }
            ],
            side: [
                {
                    kind: 'readout', title: 'One probe, one reading',
                    when: env => env.stage >= 1,
                    items: env => [
                        { label: 'x', v: env.x0, color: 'accent' },
                        { label: 'height ln x', v: c.f(env.x0) },
                        { label: 'slope measured here', v: slopeOf(c, env.x0), big: true, color: 'up' }
                    ]
                },
                {
                    kind: 'eq', title: 'The rule this tab built',
                    when: env => env.stage >= 3 && env.practice < 0.5,
                    lines: env => [
                        { t: 'd/dx ln x = 1/x   (x > 0)', hl: true },
                        { t: 'The condition travels with the formula.', color: 'auxInk' }
                    ]
                },
                {
                    kind: 'note', tone: 'warn',
                    when: env => env.stage >= 3 && env.practice < 0.5,
                    text: 'The expression 1/x also has values when x is negative. Those values are not derivatives of ln x, because ln x itself is not defined there.'
                },
                {
                    kind: 'note', tone: 'warn',
                    when: env => env.practice > 0.5,
                    text: 'This curve has no value at or left of x = 0, so the rule you name has to stop at x = 0 as well.'
                }
            ]
        },
        steps: [
            {
                params: { stage: 1, x0: 1 },
                message: 'The probe is at x = 1, where the height is 0 and the measured slope is 1. The curve crosses the axis there and keeps climbing.'
            },
            {
                params: { stage: 2, x0: 0.3 },
                message: 'Near x = 0 the tangent is almost vertical, and the reading there is 3.33. Five slope samples are now marked on the lower axis.'
            },
            {
                params: { stage: 2, x0: 3 },
                message: 'At x = 3 the curve is nearly flat, and the same probe reads 0.33. Steep at the left, flat at the right, and never once downward.'
            },
            {
                params: { stage: 3 },
                predict: {
                    q: 'The samples run 5, 2, 1, 0.5 and 0.25, and they sink toward the axis without reaching it. Which function passes through them?',
                    choices: [
                        'cos x. It also moves downward, and it stays inside a narrow band.',
                        'ln x. It is the curve on the upper axis, so it might be its own slope.',
                        '1/x. It is 5 at x = 0.2 and 0.25 at x = 4, which are the two outer samples.'
                    ],
                    a: 2,
                    whyBy: [
                        'cos x goes negative and comes back to 0, and no sample here does either of those.',
                        'ln x is 0 at x = 1, and the sample at x = 1 is 1. A curve that flattens as it climbs cannot be its own slope.',
                        'Correct. 1/x reads 5, 2, 1, 0.5 and 0.25 at x = 0.2, 0.5, 1, 2 and 4, which is the sample list in order.'
                    ],
                    why: 'Every sample is positive and the list keeps shrinking without reaching 0, which is the shape of 1/x on the positive branch.'
                },
                message: 'The joined samples are the positive branch of 1/x, and the drawing stops at x = 0.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'The slope curve is hidden again and the samples stay below the logarithm. Name the rule and say where it is allowed to exist.'
            },
            {
                params: { stage: 3, practice: 1 },
                message: 'The condition x > 0 belongs to this formula, because it is a statement about where ln x exists at all.'
            }
        ],
        summary: {
            idea: 'The derivative of ln x is 1/x for x > 0. The curve is steep near x = 0, where 1/x is large, and it flattens as x grows, where 1/x falls toward 0.',
            mistake: 'Students write 1 over ln x, or carry 1/x onto negative x. The denominator is x, and the negative branch of 1/x is not a derivative of ln x, because ln x is not defined there.',
            transfer: 'Test the two outer samples first. A slope of 5 at x = 0.2 and 0.25 at x = 4 fixes 1/x and rules out anything that grows.'
        }
    };
}

/* ---------- tab 5: four unlabeled originals ---------- */
function mixedMode() {
    return {
        label: 'Mixed check',
        intro: 'Four curves, none of them named here. Each one comes with the slopes measured on it, and the derivative curve is never drawn on this tab. The upper axis is f, and the lower axis is its slope.',
        params: { which: 0 },
        fns: {
            f: (x, env) => mixCase(env).f(x),
            fp: (x, env) => mixCase(env).fp(x)
        },
        controls: [{
            key: 'which', label: 'curve', kind: 'choice',
            options: [
                { v: 0, label: 'Curve 1' }, { v: 1, label: 'Curve 2' },
                { v: 2, label: 'Curve 3' }, { v: 3, label: 'Curve 4' }
            ]
        }],
        panes: {
            main: [
                {
                    kind: 'graph', height: 190,
                    title: env => 'Unlabeled curve f(x), question ' + (mixIndex(env) + 1) + ' of 4',
                    window: env => mixCase(env).win,
                    curves: env => [{ fn: 'f', color: 'curveA', label: 'f' }],
                    points: env => {
                        const c = mixCase(env);
                        return c.xs.map(x => ({ x, fn: 'f', color: 'auxInk', r: 3, label: 'f at this x is ' + trim(c.f(x)) }));
                    },
                    vlines: env => mixIndex(env) === 3 ? [{ x: 0, color: 'down', dash: false, label: 'x = 0' }] : []
                },
                {
                    kind: 'graph', height: 190,
                    title: env => 'Slopes measured on the curve above',
                    window: env => {
                        const c = mixCase(env);
                        const ys = c.xs.map(x => slopeOf(c, x));
                        return win(c.lo, c.hi,
                            Math.min(-1.55, Math.min.apply(null, ys) - c.pad),
                            Math.max(1.55, Math.max.apply(null, ys) + c.pad));
                    },
                    curves: env => [],
                    points: env => samplePts(mixCase(env)),
                    vlines: env => mixCase(env).xs.map(x => ({ x, color: 'auxInk' }))
                },
                {
                    kind: 'practice', id: 'core-m-0', title: 'Question 1',
                    when: env => mixIndex(env) === 0, items: env => [practiceItem('sin', true)]
                },
                {
                    kind: 'practice', id: 'core-m-1', title: 'Question 2',
                    when: env => mixIndex(env) === 1, items: env => [practiceItem('cos', true)]
                },
                {
                    kind: 'practice', id: 'core-m-2', title: 'Question 3',
                    when: env => mixIndex(env) === 2, items: env => [practiceItem('exp', true)]
                },
                {
                    kind: 'practice', id: 'core-m-3', title: 'Question 4',
                    when: env => mixIndex(env) === 3, items: env => [practiceItem('ln', true)]
                }
            ],
            side: [
                {
                    kind: 'note',
                    text: 'Read the shape first. Ask where this curve is flat, where it is rising and where it is falling, then check those three answers against the sample heights below.'
                },
                {
                    kind: 'note',
                    when: env => mixIndex(env) === 3,
                    text: 'One of these four curves has no value at or left of x = 0. Its rule carries that condition, so the answer has to say where it applies.'
                }
            ]
        },
        steps: [
            { params: { which: 1 }, message: 'Curve 2 falls across the left half of its window, so none of its samples can be positive there.' },
            { params: { which: 2 }, message: 'Curve 3 climbs faster as x grows, and its samples climb with it. The rule for this one is the exception of the unit.' },
            { params: { which: 3 }, message: 'Curve 4 has no drawn value at or left of x = 0, and its samples only shrink toward the axis.' },
            { params: { which: 3 }, message: 'Four unlabeled curves and four different giveaways. That is the whole set of rules for this topic.' }
        ],
        summary: {
            idea: 'sin gives cos, cos gives −sin, eˣ gives itself, and ln x gives 1/x on the positive branch only. Each rule shows up as an agreement between a shape and a list of slopes.',
            mistake: 'Losing the minus on cos x, and reading 1/x as a rule that covers negative x. The first is a sign check, and the second is a domain check.',
            transfer: 'Move the curve selector and name the derivative from one landmark sample before you read the rest of the list.'
        }
    };
}

export default {
    id: 'u2-core-derivatives',
    meta: { unit: 2, topic: '2.7', title: 'Derivatives of cos(x), sin(x), e^x, and ln(x)', visualizerTitle: 'Core Derivative Function Lab' },
    modes: [sinMode(), cosMode(), expMode(), lnMode(), mixedMode()]
};
