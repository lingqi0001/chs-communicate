/* 5.7 Second Derivative Test, Mode 2: an inconclusive result is not "no
   extremum". The first screen hands the test only f′(0) = 0 and f″(0) = 0 and
   asks what it concludes, and the answer is inconclusive, never no extremum.
   Only after that answer settles do the three small graphs appear: x⁴, −x⁴ and
   x³ all feed the test the identical input, yet they turn out to be a local
   minimum, a local maximum, and no local extremum. That split is the whole
   misconception undone in one picture. A compare card then sets the Second
   Derivative Test beside the First Derivative Test (5.4) with the honest tone,
   sometimes faster but with stricter conditions, and one note line covers the
   case where f″(c) does not exist so no fourth figure is needed. The shared
   arithmetic is copied verbatim from the build contract because importing
   another lesson file would mean editing a live file. */

/* The three curves and their fixed window. Each graph is framed a little wider
   than the shape it draws so no tick label rides the viewBox edge, and each
   keeps its own empty quadrant free for the shared test-input note. */
const TRIO = {
    win: [-1.35, 1.35],
};

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

const f1Q = (x) => Math.pow(x, 4);
const f2Q = (x) => -Math.pow(x, 4);
const f3Q = (x) => x * x * x;

export const inconclusiveMode = {
    label: 'When the test is inconclusive',
    intro: 'One input, f′(0) = 0 and f″(0) = 0, is handed to the Second Derivative Test on the first screen, and the only correct report is inconclusive. The graph stays hidden until that answer lands, because three functions share this exact input and end up a local minimum, a local maximum, and no local extremum. A compare card then sets this test beside the First Derivative Test, and one note covers the case where f″(c) does not exist either.',
    params: { stage: 0 },
    controls: [],
    fns: {
        f1: (x) => f1Q(x),
        f2: (x) => f2Q(x),
        f3: (x) => f3Q(x),
    },
    compute: (env) => ({
        concluded: env.stage >= 1,
        showTrio: env.stage >= 2,
        compareOpen: env.stage >= 3,
        noteDne: env.stage >= 4,
        recap: env.stage >= 5,
    }),
    panes: {
        main: [
            {
                kind: 'eq', title: 'The test input at x = 0',
                when: (env) => !env.showTrio,
                lines: (env) => {
                    const out = [
                        { t: 'f′(0) = 0, so x = 0 is a critical point.' },
                        { t: 'f″(0) = 0, the value the test reads.', hl: true },
                    ];
                    if (env.concluded) out.push({ t: 'Second Derivative Test: inconclusive.', hl: true, color: 'accent' });
                    return out;
                },
            },
            {
                kind: 'graph', title: 'f(x) = x⁴, the first graph', height: 200,
                width: 300, when: (env) => env.showTrio,
                window: [TRIO.win[0], TRIO.win[1], -0.4, 2.7], gridX: 1, gridY: 1,
                curves: [
                    { fn: 'f1', from: -1.3, to: 1.3, samples: 200, color: 'curveA', label: 'x⁴', labelAt: 0.6 },
                ],
                points: () => ([
                    { x: 0, y: 0, r: 6, color: 'aux', label: 'local minimum', labelDx: 10, labelDy: 20 },
                ]),
                notes: () => ([
                    { x: -0.2, y: 2.2, t: 'f′(0) = 0, f″(0) = 0', color: 'auxInk' },
                ]),
                tangents: () => [],
            },
            {
                kind: 'graph', title: 'f(x) = −x⁴, the second graph', height: 200,
                width: 300, when: (env) => env.showTrio,
                window: [TRIO.win[0], TRIO.win[1], -2.7, 0.4], gridX: 1, gridY: 1,
                curves: [
                    { fn: 'f2', from: -1.3, to: 1.3, samples: 200, color: 'curveA', label: '−x⁴', labelAt: -0.95 },
                ],
                points: () => ([
                    { x: 0, y: 0, r: 6, color: 'accent', label: 'local maximum', labelDx: -110, labelDy: -16 },
                ]),
                notes: () => ([
                    { x: 0.25, y: -1.9, t: 'f′(0) = 0, f″(0) = 0', color: 'auxInk' },
                ]),
                tangents: () => [],
            },
            {
                kind: 'graph', title: 'f(x) = x³, the third graph', height: 200,
                width: 300, when: (env) => env.showTrio,
                window: [TRIO.win[0], TRIO.win[1], -2.6, 2.6], gridX: 1, gridY: 1,
                curves: [
                    { fn: 'f3', from: -1.3, to: 1.3, samples: 200, color: 'curveA', label: 'x³', labelAt: 0.55 },
                ],
                points: () => ([
                    { x: 0, y: 0, r: 6, color: 'ink', label: 'no local extremum', labelDx: -58, labelDy: 20 },
                ]),
                /* this 300x200 pane has every free height occupied by its own
                   y-tick column, so the input line lives only in the
                   "One input, three outcomes" card beside the trio */
                notes: () => [],
                tangents: () => [],
            },
        ],
        side: [
            {
                kind: 'readout', title: 'Test result at x = 0',
                when: (env) => env.concluded && !env.recap,
                items: (env) => ([
                    { label: 'f′(0)', v: () => dsp(0) },
                    { label: 'f″(0)', v: () => dsp(0), color: 'accent' },
                    { label: 'Sign to read at f″(0)', v: () => 'none' },
                    { label: 'Second Derivative Test', v: () => env.concluded ? 'inconclusive' : 'not run yet', color: () => env.concluded ? 'accent' : 'ink' },
                ]),
            },
            {
                kind: 'eq', title: 'One input, three outcomes',
                when: (env) => env.showTrio,
                lines: () => ([
                    { t: 'f(x) = x⁴ has f′(0) = 0 and f″(0) = 0, outcome local minimum.' },
                    { t: 'f(x) = −x⁴ has f′(0) = 0 and f″(0) = 0, outcome local maximum.' },
                    { t: 'f(x) = x³ has f′(0) = 0 and f″(0) = 0, outcome no local extremum.' },
                    { t: 'Same test input on all three, three different real outcomes.', hl: true },
                ]),
            },
            {
                kind: 'compare', title: 'Second Derivative Test beside First Derivative Test',
                when: (env) => env.compareOpen,
                sides: [
                    {
                        title: 'First Derivative Test', lines: [
                            'Reads f′ just left of c and just right of c.',
                            'Works when f′(c) = 0.',
                            'Also works when f′(c) does not exist.',
                            'Slower, since it checks the sign on both sides.',
                        ],
                    },
                    {
                        title: 'Second Derivative Test', lines: [
                            'Reads only f″(c) at the point itself.',
                            'Needs f′(c) = 0 before it can start.',
                            'Comes back inconclusive when f″(c) = 0.',
                            'Decides in one step when f″(c) is nonzero.',
                        ],
                    },
                ],
                verdict: 'The Second Derivative Test is sometimes faster, but it has stricter conditions.',
            },
            {
                kind: 'note', title: 'When f″(c) does not exist', tone: 'warn',
                when: (env) => env.noteDne,
                text: 'One more limit, worth a line and no new graph. If f″(c) does not exist, the Second Derivative Test cannot classify the point either. There is no value at c for the test to read, so it has nothing to work with. That case differs from f″(c) = 0, where a value exists but carries no sign, yet both leave the second test silent. The First Derivative Test, which reads f′ on both sides, is the way forward.',
            },
            {
                kind: 'checklist', title: 'This mode in four checks',
                when: (env) => env.recap,
                items: [
                    { t: 'f″(0) = 0 gives the test no sign to read.', state: true },
                    { t: 'The test reports inconclusive, never no extremum.', state: true },
                    { t: 'x⁴, −x⁴ and x³ share the input but not the outcome.', state: true },
                    { t: 'A missing f″(c) also stops the test from classifying.', state: true },
                ],
                verdict: 'Inconclusive is a limit on the test, not a verdict on the point.',
                verdictOk: true,
            },
        ],
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The Second Derivative Test is run at a critical point with f′(0) = 0, and it reads f″(0) = 0. What does the test conclude?',
                choices: [
                    'Inconclusive, because a second derivative of 0 gives the test no sign to read, so it names neither a local maximum nor a local minimum.',
                    'No extremum, because f″(0) = 0 proves the point cannot be a local maximum or a local minimum.',
                    'A local minimum, because f″(0) = 0 is the flat-bottom case where the curve levels off at its lowest point.',
                ], a: 0,
                whyBy: [
                    'The test classifies only from the sign of f″(c). Positive gives a local minimum, negative gives a local maximum, and 0 hands it nothing to read, so the honest report is inconclusive. That word measures the test, not the point.',
                    'This is the mistake this screen exists to break. Inconclusive means the test could not decide, and it does not claim the point has no extremum. The very next screen shows three functions with this same input, and they do not agree on the outcome.',
                    'A flat second derivative is not a floor. With f″(0) = 0 the test has no sign, so a local minimum is not supported, and one of the three functions coming next has this exact input with no minimum anywhere near it.',
                ],
            },
            message: 'The conclusion row now reads inconclusive, and that is a statement about the test rather than about the point. f″(0) = 0 leaves the Second Derivative Test with no sign, so it can name neither a local maximum nor a local minimum here. Keep the word inconclusive and refuse the phrase no extremum, because the point may still be a minimum, a maximum, or neither. Three functions that hand the test this identical input appear next.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The three functions f(x) = x⁴, f(x) = −x⁴ and f(x) = x³ all have f′(0) = 0 and f″(0) = 0. Once their graphs appear, will they share one outcome at x = 0?',
                choices: [
                    'No, all three leave the test inconclusive, yet their real outcomes differ, and that is exactly why an inconclusive test is not a verdict.',
                    'Yes, an identical test input forces all three to have the same real outcome at x = 0.',
                    'Yes, the test is inconclusive for all three, so none of them has a local extremum at x = 0.',
                ], a: 0,
                whyBy: [
                    'The shared input only guarantees the test behaves the same way, and it does so by refusing to decide on each one. The actual outcome comes from the function around the point, and here the three come apart into a minimum, a maximum, and neither.',
                    'The test input fixes what the test says, which is nothing, and it fixes nothing about the graph. Two functions can share f′(0) = 0 and f″(0) = 0 and still turn one way or the other beside it.',
                    'That is inconclusive read as no extremum again. Ahead you will see x⁴ really does hold a local minimum and −x⁴ really does hold a local maximum, both with f″(0) = 0, so an inconclusive test plainly does not forbid extrema.',
                ],
            },
            message: 'Same input, three outcomes. f(x) = x⁴ bottoms out at x = 0 and holds a local minimum, f(x) = −x⁴ tops out and holds a local maximum, and f(x) = x³ flattens at the origin and passes straight through with no local extremum. Each one reported f′(0) = 0 and f″(0) = 0, so the Second Derivative Test was inconclusive on all three, and the real behavior still came apart. Inconclusive describes the reach of the test, never the fate of the point.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'A classmate says the Second Derivative Test is a better tool than the First Derivative Test. Which reply is accurate?',
                choices: [
                    'It is not better, it is sometimes faster but with stricter conditions, since the First Derivative Test reads f′ on both sides and still works when f′(c) does not exist.',
                    'It is better, because reading one number f″(c) always beats checking signs on two sides of the point.',
                    'It is worse, because the Second Derivative Test can never classify a critical point on its own.',
                ], a: 0,
                whyBy: [
                    'The second test needs only the single value f″(c), so when it decides it decides fast. The catch is that it requires f′(c) = 0 first and it can come back inconclusive, while the First Derivative Test reads f′ on both sides and also covers points where f′(c) does not exist. Faster under stricter conditions, and nothing more.',
                    'Fewer steps is not the same as better. The one-number shortcut is powerless exactly when f″(c) = 0 or f″(c) fails to exist, and the sign-based First Derivative Test still decides in both of those cases.',
                    'That swings too far the other way. When f′(c) = 0 and f″(c) is nonzero, the Second Derivative Test classifies the point in a single line, so it is a real tool with clear limits, not a broken one.',
                ],
            },
            message: 'The compare card lays the two tests side by side. The First Derivative Test reads f′ just left and just right of c, and it works whether f′(c) = 0 or f′(c) does not exist. The Second Derivative Test reads only f″(c) at the point, needs f′(c) = 0 before it can start, and can end inconclusive. The fair summary is sometimes faster, but with stricter conditions, and never better.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'At a critical point c the value f′(c) = 0 holds, but f″(c) does not exist. Can the Second Derivative Test classify c?',
                choices: [
                    'No, the test needs a value f″(c) to read, and with no value there it cannot classify, so the First Derivative Test is the way forward.',
                    'Yes, a missing f″(c) counts as f″(c) = 0, so the test simply reports inconclusive.',
                    'Yes, when f″(c) does not exist the point automatically is not a local extremum.',
                ], a: 0,
                whyBy: [
                    'The test reads the sign of f″(c), and a second derivative that does not exist has no sign and no value. With nothing to read it stays silent, so the fallback is the First Derivative Test or a sign check around c.',
                    'A nonexistent value is not the number 0. Treating it as f″(c) = 0 invents a value the function never gave, and the honest statement is that the second test cannot run here at all.',
                    'This is the same mistake in a new costume. A test that fails to classify says nothing about whether an extremum exists, and a point with f″(c) undefined can still be a local minimum, a local maximum, or neither.',
                ],
            },
            message: 'The note adds one dead end with no new figure. If f″(c) does not exist, the Second Derivative Test cannot classify either, because there is no value at c for it to read. That differs from f″(c) = 0, where a value is present but carries no sign, yet both leave the second test unable to decide. The First Derivative Test still reads the signs on both sides and remains the fallback.'
        },
        {
            params: { stage: 5 },
            message: 'Carry one sentence from this mode. The Second Derivative Test is a quick check that sometimes gives up, and when it reports inconclusive that is the test reaching its limit while the point waits to be read from the First Derivative Test or the graph. Never translate inconclusive into no extremum.'
        },
    ],
    summary: {
        idea: 'When the Second Derivative Test runs at a critical point c and reads f″(c) = 0, the test is inconclusive, and that word describes the test rather than the point. The three functions x⁴, −x⁴ and x³ all report f′(0) = 0 and f″(0) = 0, so the test is inconclusive on every one of them, yet their real outcomes are a local minimum, a local maximum, and no local extremum. Inconclusive never means no extremum.',
        mistake: 'Turning an inconclusive result into a claim that the point has no extremum. A zero second derivative only says the test has no sign to read, and the point stays a candidate whose behavior is settled by the First Derivative Test or the graph. The mirror mistake is calling the second test better, when it is only sometimes faster with stricter conditions, and it cannot run at all when f″(c) does not exist.',
        transfer: 'The Second Derivative Test is applied at a critical point c and returns f″(c) = 0. Write the single correct word about the test, then name the two facts about c you would need before deciding whether c holds a local maximum, a local minimum, or no local extremum.'
    },
};

export default inconclusiveMode;
