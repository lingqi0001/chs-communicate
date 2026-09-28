/* 5.3 Determining Intervals on Which a Function Is Increasing or Decreasing.
   Mode 1, the main teaching mode. One hero stack read top down: the graph of
   f′ is the primary picture, the number line under it is the sign chart on the
   same x-window and the same width so the two line up vertically, and the graph
   of f arrives last as confirmation only.

   f(x) = x³/3 − x, so f′(x) = x² − 1 = (x + 1)(x − 1), zeros at x = −1 and
   x = 1 on the window −3 ≤ x ≤ 3. The signs of f′ at the test values −2, 0 and
   2 read + / − / +, and that is the whole argument.

   Copy discipline for this topic: this mode never names a peak or a valley, and
   it never uses shape-of-a-curve words. Topic 5.4 classifies the zeros of f′ and
   topic 5.6 owns the shape of a curve, so here a zero of f′ is only a boundary
   worth testing. Every reveal rides a monotone stage counter, and each stage is
   set in the step that carries the Predict whose answer it reveals, so the
   ladder never states a conclusion before its question. Cards that have done
   their job retire on a later stage instead of stacking forever. */

const FC = (x) => Math.pow(x, 3) / 3 - x;      /* f */
const DC = (x) => x * x - 1;                   /* f′ */
const XLO = -3, XHI = 3;                        /* the x-window the sign chart reads */
const WX0 = -3.15, WX1 = 3.15;                  /* the shared picture window, edges off the ticks */
const FD = Math.sqrt(5.2);                      /* |x| where f′ = 4.2, the top of the f′ plot */
const XF = 2.428;                               /* |x| where |f| = 2.34, inside its plot */

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

/* A rounded value never gets an equals sign, so the live probe readings say
   ≈ whenever the two-decimal print is not the exact value. */
function rel(v) {
    const s = dsp(v);
    return Math.abs(v - Number(s.replace('−', '-'))) < 1e-12 ? '=' : '≈';
}

const UPFILL = 'color-mix(in srgb, #2FB86A 9%, transparent)';
const DOWNFILL = 'color-mix(in srgb, #FF3B30 9%, transparent)';
const GRAYFILL = 'color-mix(in srgb, var(--text-secondary) 12%, transparent)';

/* One row of the test-value table doubles as one band of the sign chart, so the
   two pictures cannot drift apart, and every label carries its meaning in words. */
const IVS = [
    { from: XLO, to: -1, name: '(−∞, −1)', test: -2 },
    { from: -1, to: 1, name: '(−1, 1)', test: 0 },
    { from: 1, to: XHI, name: '(1, ∞)', test: 2 }
].map(iv => {
    const d = DC(iv.test);
    const pos = d > 0;
    return {
        from: iv.from, to: iv.to, name: iv.name, test: iv.test,
        dTxt: dsp(d),
        signChar: pos ? '+' : '−',
        tone: pos ? 'up' : 'down',
        signLabel: pos ? 'f′ > 0' : 'f′ < 0',
        /* the band carries the word, not the inequality: three long labels on
           one row would be pushed off the chart and onto the tick row */
        bandLabel: pos ? 'increasing' : 'decreasing'
    };
});

const DIR_BY_SIGN = { '+': 'increasing', '−': 'decreasing' };

export const monotonicityMainMode = {
    label: 'Read the sign of f′',
    intro: 'The graph on screen is the graph of f′, not the graph of f. It is y = x² − 1 on the x-window −3 to 3, and the function behind it is f(x) = x³/3 − x. Nothing has been said about f yet. One thing is read off this picture first: where the graph of f′ sits above the x-axis and where it sits below it.',
    params: { stage: 0, probe: 0 },
    controls: [
        { key: 'probe', label: 'x of the shared probe', min: -2.2, max: 2.2, step: 0.05, showDigits: 2, when: (env) => env.stage >= 5 }
    ],
    fns: { f: (x) => FC(x), fp: (x) => DC(x) },
    compute: (env) => {
        const d = DC(env.probe);
        const atZero = Math.abs(d) < 0.005;
        const signChar = atZero ? '0' : (d > 0 ? '+' : '−');
        const dir = DIR_BY_SIGN[signChar];
        /* x = ±1 is the boundary itself, not a member of either open interval,
           and f has no direction to name there, so the boundary gets its own
           wording in every place that would otherwise read "f is …". */
        return {
            tested: env.stage >= 2,
            interpreted: env.stage >= 3,
            confirmed: env.stage >= 4,
            probing: env.stage >= 5,
            misread: env.stage >= 6,
            atBoundary: atZero,
            xTxt: dsp(env.probe),
            xRel: rel(env.probe) + ' ' + dsp(env.probe),
            dTxt: rel(d) + ' ' + dsp(d),
            signChar: signChar,
            signWord: atZero ? 'zero' : (d > 0 ? 'positive' : 'negative'),
            probeLabel: atZero
                ? 'f′ = 0 here, the boundary between two signs'
                : 'f′ ' + rel(d) + ' ' + dsp(d) + ', so f is ' + dir,
            fProbeLabel: atZero ? 'f has a horizontal tangent here' : 'f is ' + dir + ' here',
            behaviorLine: atZero ? 'f has a horizontal tangent here' : 'f is ' + dir,
            intervalLine: atZero ? 'x = ' + dsp(env.probe) : (env.probe < -1 ? IVS[0].name : (env.probe > 1 ? IVS[2].name : IVS[1].name)),
            tone: atZero ? 'accent' : (d > 0 ? 'up' : 'down')
        };
    },
    panes: {
        main: [
            {
                kind: 'graph', title: 'Primary picture: the graph of y = f′(x) = x² − 1',
                height: 300, window: [WX0, WX1, -1.8, 4.2], gridX: 1, gridY: 1,
                curves: [{ fn: 'fp', from: -FD, to: FD, samples: 600, color: 'curveA' }],
                hband: (env) => env.tested ? [
                    { from: 0, to: 4.2, color: UPFILL, label: 'above the x-axis, f′ > 0', labelColor: 'up' },
                    { from: -1.8, to: 0, color: DOWNFILL, label: 'below the x-axis, f′ < 0', labelColor: 'down' }
                ] : [],
                vband: (env) => env.misread ? [{ from: -2, to: -1, color: GRAYFILL }] : [],
                vlines: (env) => env.stage >= 1
                    ? [{ x: -1, color: 'accent', label: 'x = −1' }, { x: 1, color: 'accent', label: 'x = 1' }]
                    : [],
                points: (env) => {
                    const out = [];
                    if (env.stage >= 1) {
                        out.push({ x: -1, y: 0, r: 5.5, color: 'accent', label: 'a zero of f′', labelDy: -12 });
                        out.push({ x: 1, y: 0, r: 5.5, color: 'accent', label: 'a zero of f′', labelDy: -12 });
                    }
                    if (env.probing) {
                        out.push({
                            x: env.probe, fn: 'fp', r: 6.5, color: 'accent',
                            drag: { key: 'probe', min: -2.2, max: 2.2 },
                            labelDy: -14,
                            label: (env) => env.probeLabel
                        });
                    }
                    return out;
                },
                notes: (env) => env.misread
                    ? [{ x: -2.02, y: 3, t: 'f′ goes down here', color: 'auxInk' }]
                    : []
            },
            {
                kind: 'numberline', title: 'Sign chart of f′ on the same x-window and width',
                when: (env) => env.stage >= 1,
                /* the numberline insets 20px and the graph does not, so its window is
                   narrowed by span/14 to put both layers on one pixel map */
                width: 560, window: [-2.925, 2.925], step: 1,
                bands: (env) => env.tested ? IVS.map(iv => ({
                    from: iv.from, to: iv.to, color: iv.tone,
                    label: env.interpreted ? iv.bandLabel : iv.signLabel
                })) : [],
                probes: (env) => {
                    const out = [
                        { x: -1, color: 'accent', label: 'x = −1' },
                        { x: 1, color: 'accent', label: 'x = 1' }
                    ];
                    /* the drag marker rides the chart without a label: a label at
                       the probe's own column always collides with the band text,
                       and the chart is where the band text carries the lesson.
                       The probe's value is named in the readout instead. */
                    if (env.probing) out.push({ x: env.probe, color: 'ink' });
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Confirmation only: the graph of y = f(x) = x³/3 − x',
                when: (env) => env.confirmed,
                height: 300, window: [WX0, WX1, -2.35, 2.35], gridX: 1, gridY: 1,
                curves: [{ fn: 'f', from: -XF, to: XF, samples: 600, color: 'curveA' }],
                vlines: [{ x: -1, color: 'accent', label: 'x = −1' }, { x: 1, color: 'accent', label: 'x = 1' }],
                points: (env) => env.probing
                    ? [{
                        x: env.probe, fn: 'f', r: 6.5, color: 'accent', labelDy: -16,
                        drag: { key: 'probe', min: -2.2, max: 2.2 },
                        label: (env) => env.fProbeLabel
                    }]
                    : [],
                notes: (env) => env.interpreted ? [
                    { x: -2.45, y: 1.3, t: 'f rises, f′ > 0', color: 'up' },
                    { x: -1.6, y: -1.6, t: 'f falls, f′ < 0', color: 'down' },
                    { x: 1.6, y: -1.6, t: 'f rises, f′ > 0', color: 'up' }
                ] : []
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The function and its derivative',
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x³/3 − x' },
                        { t: 'f′(x) = x² − 1' },
                        { t: 'f′(x) = (x + 1)(x − 1)' }
                    ];
                    if (env.stage >= 1) out.push({ t: 'f′ = 0 at x = −1 and at x = 1, the two places where the sign of f′ can change.' });
                    if (env.tested) out.push({ t: 'Those two x-values split the line into (−∞, −1), (−1, 1) and (1, ∞). One test x inside each piece gives f′(−2) = 3, f′(0) = −1 and f′(2) = 3.' });
                    if (env.interpreted) out.push({ t: 'Sign of f′: positive, negative, positive. What that gives for f: increasing, decreasing, increasing.', hl: true });
                    return out;
                }
            },
            {
                kind: 'table', title: 'Test values, one per interval',
                when: (env) => env.tested,
                cols: ['Interval of x', 'Test x', 'f′(test x)', 'Sign of f′'],
                rows: () => IVS.map(iv => [
                    { v: () => iv.name },
                    { v: () => dsp(iv.test) },
                    { v: () => iv.dTxt },
                    { v: () => iv.signChar, color: iv.tone, bold: true }
                ]),
                note: (env) => env.interpreted
                    ? 'One sign per interval settles what f does across that whole interval, and the reading does not switch inside it.'
                    : 'This table stops at the sign of f′. It says nothing about what f does.'
            },
            {
                kind: 'readout', title: 'Shared probe on all three layers',
                when: (env) => env.probing,
                items: [
                    { label: 'x', v: (env) => env.xRel, big: true },
                    { label: 'f′(x)', v: (env) => env.dTxt, color: (env) => env.tone },
                    { label: 'sign of f′', v: (env) => env.signChar + '  ' + env.signWord, color: (env) => env.tone },
                    { label: 'therefore', v: (env) => env.behaviorLine, color: (env) => env.tone },
                    { label: (env) => env.atBoundary ? 'it is the boundary' : 'interval it lies in', v: (env) => env.intervalLine }
                ]
            },
            {
                kind: 'note', title: 'The sign of f′ versus the direction of f′',
                when: (env) => env.stage >= 1,
                text: (env) => env.misread
                    ? 'The sign of f′ determines whether f rises or falls, and a positive value of f′ is a positive slope on f. Whether f′ rises or falls is not what determines monotonicity of f. Its sign does.'
                    : 'The sign of f′ determines whether f rises or falls, and a positive value of f′ is a positive slope on f. Which way the graph of f′ itself moves is not part of this reading yet.'
            },
            {
                kind: 'eq', title: 'What the two boundaries buy you',
                /* this card has done its job once the confirmation layer is on screen */
                when: (env) => env.tested && env.stage < 4,
                lines: [
                    { t: 'f′ = x² − 1 is continuous everywhere.' },
                    { t: 'A continuous function changes sign only where it equals 0.' },
                    { t: 'So every sign change of f′ happens at x = −1 or at x = 1.' },
                    { t: 'Away from those two x-values one test x settles the sign for the whole piece.' }
                ]
            },
            {
                kind: 'machine', title: 'Chain for a positive sign of f′',
                when: (env) => env.interpreted && env.stage < 6,
                focus: 2,
                stages: [
                    { box: 'the graph of f′ is above the x-axis' },
                    { box: 'f′(x) > 0' },
                    { box: 'f is increasing' }
                ]
            },
            {
                kind: 'machine', title: 'Chain for a negative sign of f′',
                when: (env) => env.interpreted && env.stage < 6,
                focus: 2,
                stages: [
                    { box: 'the graph of f′ is below the x-axis' },
                    { box: 'f′(x) < 0' },
                    { box: 'f is decreasing' }
                ]
            },
            {
                kind: 'eq', title: 'How an AP response states it',
                when: (env) => env.confirmed,
                lines: [
                    { t: 'Since f′(x) > 0 on (−∞, −1), f is increasing on (−∞, −1).', hl: true, color: 'up' },
                    { t: 'Since f′(x) < 0 on (−1, 1), f is decreasing on (−1, 1).', hl: true, color: 'down' },
                    { t: 'Since f′(x) > 0 on (1, ∞), f is increasing on (1, ∞).', hl: true, color: 'up' },
                    { t: 'A justification names the sign of f′ and the interval it holds on. It never names the direction of the f′ graph.' }
                ]
            },
            {
                kind: 'compare', title: 'Two readings of the same f′ graph',
                when: (env) => env.misread,
                sides: () => [
                    {
                        title: 'The misreading',
                        tone: 'wrong',
                        lines: [
                            'The graph of f′ goes down here.',
                            'f′ is decreasing.',
                            'therefore f is decreasing.'
                        ]
                    },
                    {
                        title: 'Reading the sign',
                        tone: 'right',
                        lines: [
                            'The graph of f′ stays above the x-axis here.',
                            'f′ is positive.',
                            'therefore f is increasing.'
                        ]
                    }
                ],
                verdict: 'The gray band on the primary picture marks the window −2 < x < −1. The second reading is the one a free-response question gives credit for.'
            },
            {
                kind: 'eq', title: 'The chain applied to the three test values',
                when: (env) => env.misread,
                lines: [
                    { t: 'f′(−2) = 3, the sign is positive, so f is increasing on (−∞, −1).', color: 'up' },
                    { t: 'f′(0) = −1, the sign is negative, so f is decreasing on (−1, 1).', color: 'down' },
                    { t: 'f′(2) = 3, the sign is positive, so f is increasing on (1, ∞).', color: 'up' }
                ]
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The picture on screen is the graph of f′, not the graph of f. Where that graph sits above the x-axis we have f′(x) > 0. What does that tell us about f?',
                choices: [
                    'f is increasing there, because the sign of f′ is the sign of the slope of f.',
                    'f is decreasing there, because the graph of f′ sits above the x-axis.',
                    'f′ is increasing there, so f must also be increasing there.'
                ], a: 0,
                whyBy: [
                    'A positive value of f′ at x is a positive slope of f at the same x, and a positive slope makes f rise. So the reading comes from the height of this graph above or below the x-axis.',
                    'That one flips the sign. Above the x-axis means f′(x) > 0, and f′(x) > 0 means f rises there rather than falling.',
                    'That is the mix-up this lesson is built around. Where the graph of f′ sits is one reading, and which way that graph moves is another. Topic 5.4 and topic 5.6 take up those other questions.'
                ]
            },
            message: 'Two x-values are marked on the primary picture now: x = −1 and x = 1, where the graph of f′ meets the x-axis. The sign chart appears under it on the same x-window and the same width, carrying those two boundaries as marks with no reading attached. The card The sign of f′ versus the direction of f′ is the answer to the question above.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Why are the two x-values where f′ = 0 useful?',
                choices: [
                    'They split the number line into intervals on which the sign of f′ can be tested with one x each.',
                    'They are the only x-values where f itself is defined.',
                    'They are the places where the graph of f′ crosses itself.'
                ], a: 0,
                whyBy: [
                    'A sign can change only where f′ = 0 or where f′ fails to exist. Here f′ = x² − 1 is continuous everywhere, so the two zeros are the only candidates, and they cut the line into three intervals for testing.',
                    'f(x) = x³/3 − x is defined for every x, so those two x-values say nothing about the domain of f.',
                    'A graph cannot cross itself. At x = −1 and at x = 1 this graph crosses the x-axis, and that crossing is the useful fact.'
                ]
            },
            message: 'The sign chart now carries three bands between the two boundaries, and the Test values, one per interval card fills in with f′(−2) = 3, f′(0) = −1 and f′(2) = 3. The bands stop at the sign of f′, and the card What the two boundaries buy you states why a test in each piece is enough.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Use x = 0 to test the interval (−1, 1). Since f′(0) = −1, what is f doing on this interval?',
                choices: [
                    'f is decreasing on (−1, 1), because f′(x) < 0 there.',
                    'f is increasing on (−1, 1), because f′(x) < 0 there.',
                    'f does not change on (−1, 1), because one test x is not enough evidence.'
                ], a: 0,
                whyBy: [
                    'A negative value of f′ is a negative slope, and every value of f′ between −1 and 1 is negative. That one test x settles the sign for the whole interval, since a switch would need another zero of f′ inside it.',
                    'That pairs the sign with the wrong behavior. f′(x) < 0 gives a falling f, not a rising one.',
                    'One test x is enough once the boundaries are fixed. f′ changes sign only where it equals 0, and no x strictly between −1 and 1 does that.'
                ]
            },
            message: 'The two chain cards read the whole argument, the graph of f′ above the x-axis, then f′(x) > 0, then f is increasing, and the same three steps for the region below the axis. Each band of the sign chart now carries the direction word it stands for, and the card The function and its derivative closes by setting the three signs of f′ against the three directions they give for f. The primary picture shades the region above the x-axis and the region below it.'
        },
        {
            params: { stage: 4 },
            message: 'The graph of f is on screen as the confirmation layer. It is the bottom copy of the same x-window and the same width, so its marks at x = −1 and x = 1 sit under the same two boundaries on the sign chart and the same two dashed lines on the primary picture. It rises, then falls, then rises. Nothing on it was measured in order to build the sign chart, and no point on it gets a name beyond the two boundaries already in play. The card What the two boundaries buy you has finished its work and steps aside.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'The three layers are stacked and a probe x is about to be dropped on this window. Which quantity has to be read at that x to say what f is doing there?',
                choices: [
                    'The height f(x) at that x, because a higher curve means a faster increase.',
                    'The value of f′(x) at that x, because the sign of f′ is the sign of the slope of f.',
                    'The steepness of the graph of f′ at that x, because a steeper f′ graph means more increase for f.'
                ], a: 1,
                whyBy: [
                    'Height says where the curve sits, not which way it is moving. On the graph of f the point at x = −0.5 sits above the point at x = 0.5, and f falls the whole way between them.',
                    'The sign of f′(x) is what decides the direction of f, so the probe reads f′ at its own x first. A positive value gives a rising f and a negative value gives a falling f.',
                    'That is a reading of the graph of f′ rather than a reading of the sign of f′, and this test uses only the sign. The value of f′ can be large or small while staying positive.'
                ]
            },
            message: 'The probe is live, and one x drives all three layers at once: the dot on the primary picture, the marker on the sign chart, and the dot on the graph of f. The Shared probe on all three layers card reports x, then f′(x), then the sign of f′, then what follows for f. The slider above the pictures moves the same probe, which keeps it usable on a small screen.'
        },
        {
            params: { stage: 6 },
            message: 'Two readings of the same f′ graph now sit side by side, and the gray band on the primary picture marks the window −2 < x < −1 where they part company. On that window the graph of f′ goes downward. Read its height above the x-axis, then read the sign, and the direction word the test uses comes from the sign. The card The sign of f′ versus the direction of f′ now says the second half out loud, and the two chain cards step aside for it.'
        },
        {
            params: { stage: 6 },
            message: 'The card The chain applied to the three test values walks those same two steps for each test x, a sign of f′ and then a direction for f. The How an AP response states it card keeps that order in the sentence a grader looks for, since f′(x) > 0 on an interval, then f is increasing on that interval.'
        }
    ],
    summary: {
        idea: 'The sign of f′ determines the direction of f. Positive f′ means f is increasing, and negative f′ means f is decreasing. Split the domain at the x-values where f′ = 0 or f′ fails to exist, test one x inside each interval, and the sign you find there holds across that whole interval.',
        mistake: 'Do not confuse f′ being positive with f′ being increasing. Monotonicity depends on whether the graph of f′ is above or below 0, not on which way that graph is moving. A graph of f′ that climbs while it stays below the x-axis still gives a decreasing f.',
        transfer: 'Given only a graph or a sign chart of f′, split the domain at the relevant boundary values and state the intervals where f increases or decreases. On the graph of y = f′(x) = x² − 4 the zeros are x = −2 and x = 2. Which intervals make f increase, which make f decrease, and what test x would you use inside each one?'
    }
};

export default monotonicityMainMode;
