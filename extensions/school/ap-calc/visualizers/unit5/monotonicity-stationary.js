/* 5.3 Monotonicity sign chart, second case: the zero of f′ that changes
   nothing. Compact by design, one short case rather than a second full lesson.
   The hero stack is the graph of f′ = 3x², the number line sign chart that
   shares its x-window and width, and only at the end the graph of f = x³ as
   confirmation. The tab never names a classification at x = 0: it says that f
   keeps increasing through that zero, which is all the sign chart can deliver
   here. Classifying the critical point is Topic 5.4, and this file only points
   at it. The shared arithmetic is copied verbatim from the build contract,
   because importing another lesson file would mean editing a live file. */

/* The graphs are framed slightly wider than the picture they draw: a window edge
   that lands exactly on a tick value pushes that tick label outside the
   viewBox, and here ±2 and f′(±2) = 12 were both edge ticks. */
const WIN = [-2.2, 2.2];

/* The numberline insets 20px on each side and the graph does not, so its window
   is the graph window shrunk by span/14 and centred on the same midpoint. That
   puts a mark at x = 0 on one pixel in both layers, and the outer bands stop at
   the chart's own edge. */
const NLWIN = [WIN[0] + (WIN[1] - WIN[0]) / 28, WIN[1] - (WIN[1] - WIN[0]) / 28];

/* Both test points sit one unit from the zero and both read +3, so the sign is
   the same on either side of x = 0 while f′(0) = 0 exactly. f itself runs
   f(−1) = −1, f(0) = 0, f(1) = 1 across the same three x-values, and f′(±2) = 12
   is the top of the derivative window. */
const fQ = (x) => x * x * x;
const fpQ = (x) => 3 * x * x;

function dsp(v) {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
}

const SUMMARY = {
    idea: 'On this case f(x) = x³ has f′(x) = 3x², so f′(0) = 0 while f′(−1) = 3 and f′(1) = 3. The derivative is positive on both sides of its only zero, which makes f increasing on (−∞, 0) and increasing on (0, ∞), and the graph of f flattens at the origin without reversing direction. A zero of f′ is a boundary worth checking, not an automatic change in what f does.',
    mistake: 'Assuming that solving f′ = 0 hands you the places where f switches from rising to falling, or reading the shape of the f′ graph as if it were the behavior of f. Here the graph of f′ falls into the origin and climbs back out, and that travel decides nothing on its own. The position of f′ relative to 0 decides, and it is above 0 on both sides of x = 0.',
    transfer: 'A function p is defined for all x and p′(x) = (x − 2)². What is the sign of p′ just left of x = 2 and just right of x = 2, and what does p do as x passes through 2?'
};

export const monotonicityStationaryMode = {
    label: 'A zero without a behavior change',
    intro: 'One short case: f(x) = x³ with f′(x) = 3x². The tab opens on the derivative alone, because the question is what a single zero of f′ does to the behavior of f. Nothing is labeled on that picture yet, and the graph of f waits until last.',
    params: { stage: 0 },
    controls: [],
    fns: { f: (x) => fQ(x), fp: (x) => fpQ(x) },
    compute: (env) => ({
        marked: env.stage >= 1,
        behavior: env.stage >= 2,
        fShown: env.stage >= 3,
        graded: env.stage >= 4,
        recap: env.stage >= 5
    }),
    panes: {
        main: [
            {
                kind: 'graph', title: 'Graph of f′, where f′(x) = 3x²', height: 300,
                width: 560,
                window: () => WIN.concat([-1, 13]), gridX: 1, gridY: 3,
                curves: [
                    { fn: 'fp', from: -2, to: 2, samples: 240, color: 'curveA', label: 'f′(x) = 3x²', labelAt: 0.75 }
                ],
                points: (env) => {
                    if (!env.marked) return [];
                    return [
                        { x: -1, y: fpQ(-1), color: 'up', label: 'f′(−1) = ' + dsp(fpQ(-1)) },
                        { x: 0, y: fpQ(0), color: 'accent', label: 'f′(0) = ' + dsp(fpQ(0)), labelDx: 10, labelDy: -14 },
                        { x: 1, y: fpQ(1), color: 'up', label: 'f′(1) = ' + dsp(fpQ(1)) }
                    ];
                },
                tangents: () => []
            },
            {
                /* width 560 and the same x pair WIN as the graph above, so the
                   boundary probe lands under the vertex of the parabola. f′ is
                   positive on every x except 0, so the two bands meet at 0 and
                   the chart carries no unsigned gap. The probe and its
                   f′ = 0 label are the only marks at that point, and the sign
                   text rides in the band labels, never in the colour alone */
                kind: 'numberline', title: 'Sign chart on the number line, same x-window as the graph above',
                when: (env) => env.marked,
                /* both layers share one pixel map through NLWIN, defined above */
                window: NLWIN, width: 560, step: 1,
                bands: (env) => ([
                    { from: NLWIN[0], to: 0, color: 'up', label: env.behavior ? '+ f′ > 0, increasing' : '+ f′ > 0' },
                    { from: 0, to: NLWIN[1], color: 'up', label: env.behavior ? '+ f′ > 0, increasing' : '+ f′ > 0' }
                ]),
                probes: () => ([
                    { x: 0, color: 'accent', label: 'f′ = 0' }
                ])
            },
            {
                kind: 'graph', title: 'Graph of f, where f(x) = x³', height: 300,
                when: (env) => env.fShown,
                window: () => WIN.concat([-9, 9]), gridX: 1, gridY: 4,
                curves: [
                    { fn: 'f', from: -2, to: 2, samples: 240, color: 'curveA', label: 'f(x) = x³', labelAt: -1.7 }
                ],
                tangents: [{ fn: 'f', x: 0, color: 'accent', dashed: true }],
                /* the tangent wording rides in the empty upper left, because a
                   label at the line itself lands on the x tick row */
                notes: [{ x: -1.55, y: 4.6, t: 'tangent at x = 0 is horizontal', color: 'accent' }],
                points: [
                    /* the two arm labels are pushed off the x tick row, which
                       runs just under the axis on this window */
                    { x: -1, y: fQ(-1), color: 'ink', label: 'f(−1) = ' + dsp(fQ(-1)), labelDx: -8, labelDy: 26 },
                    { x: 0, y: 0, color: 'accent', r: 6 },
                    { x: 1, y: fQ(1), color: 'ink', label: 'f(1) = ' + dsp(fQ(1)) }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'The case on screen',
                lines: (env) => {
                    const out = [
                        { t: 'f(x) = x³, the function.' },
                        { t: 'f′(x) = 3x², the derivative this tab reads.', hl: true }
                    ];
                    if (env.marked) out.push({ t: 'f′(−1) = 3, f′(0) = 0, f′(1) = 3.' });
                    if (env.behavior) out.push({ t: 'f′ > 0 on both sides of 0, so f is increasing on both sides.', hl: true });
                    if (env.graded) out.push({ t: 'Since f′(x) > 0 on (−∞, 0), f is increasing there, and since f′(x) > 0 on (0, ∞), f is increasing there too.' });
                    return out;
                }
            },
            {
                kind: 'readout', title: 'Test values of f′',
                when: (env) => env.marked,
                items: (env) => ([
                    { label: 'f′(−1)', v: () => dsp(fpQ(-1)), color: 'up' },
                    { label: 'f′(0)', v: () => dsp(fpQ(0)), color: 'accent' },
                    { label: 'f′(1)', v: () => dsp(fpQ(1)), color: 'up' },
                    { label: 'Sign left of 0', v: () => 'positive', color: 'up' },
                    { label: 'Sign right of 0', v: () => 'positive', color: 'up' },
                    { label: 'f left of 0', v: () => env.behavior ? 'increasing' : 'not read yet', color: () => env.behavior ? 'up' : 'ink' },
                    { label: 'f right of 0', v: () => env.behavior ? 'increasing' : 'not read yet', color: () => env.behavior ? 'up' : 'ink' }
                ])
            },
            {
                kind: 'note', title: 'What a zero of f′ does not do',
                when: (env) => env.behavior,
                text: 'The number line reads + f′ > 0, then f′ = 0, then + f′ > 0 again. That checked boundary is the whole story of this case: f′ equals 0 at x = 0 without crossing 0, so the sign either side is positive and f is increasing either side. A zero of the derivative is a boundary worth testing, and a test that comes out the same twice changes nothing about the direction of f.'
            },
            {
                kind: 'compare', title: 'Sign of f′ against shape of f′',
                when: (env) => env.graded,
                sides: [
                    { title: 'What decides f', lines: ['The position of f′ relative to 0.', 'Above 0 left of x = 0, above 0 right of it.', 'So f increases on both intervals.'] },
                    { title: 'What does not decide f', lines: ['The travel of the curve of f′.', 'It falls into the origin and climbs out of it.', 'That says nothing about where f rises.'] }
                ],
                verdict: 'Read where f′ sits against zero, not which way the graph of f′ is moving. Positive sign gives increasing behavior, on both sides here.'
            },
            {
                kind: 'note', title: 'Where this case goes next',
                when: (env) => env.graded,
                text: 'Topic 5.4 will use whether the sign changes to classify the critical point. This tab stops at the reading it can support: the sign of f′ does not change at x = 0, and f keeps increasing through it.'
            },
            {
                kind: 'checklist', title: 'This case in four checks',
                when: (env) => env.recap,
                items: [
                    { t: 'f′(0) = 0, so x = 0 is a boundary to test.', state: true },
                    { t: 'Test x = −1 gives f′ = 3, positive.', state: true },
                    { t: 'Test x = 1 gives f′ = 3, positive.', state: true },
                    { t: 'Same sign on both sides, so same behavior on both sides.', state: true }
                ],
                verdict: 'The tests agree, so f is increasing on (−∞, 0) and increasing on (0, ∞).',
                verdictOk: true
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'The graph shown is f′(x) = 3x². Where does it equal 0, and what is its sign everywhere else?',
                choices: [
                    'It equals 0 only at x = 0, and it is positive for every other x, so the sign is the same on both sides.',
                    'It equals 0 at x = 0 and it is negative left of 0, because the curve of f′ is falling as it approaches.',
                    'It equals 0 at x = 0 and it is positive left of 0 but negative right of 0, because the curve is rising after the touch.'
                ], a: 0,
                whyBy: [
                    'The parabola opens upward with its vertex on the origin, so 3x² is 0 at x = 0 and positive at every other x. The sign either side of that zero is the same, and that is the fact the next question turns on.',
                    'A falling graph of f′ means f′ is getting smaller, it does not mean f′ is below 0. Left of x = 0 the curve sits above the x-axis the whole way.',
                    'That is the same misreading with the other arm. Rising or falling tells you how the value of f′ travels, and above or below 0 tells you its sign. Here both arms are above 0.'
                ]
            },
            message: 'The markers and the sign chart now agree: f′(−1) = 3, f′(0) = 0, f′(1) = 3. The graph of f′ touches the x-axis once, at the origin, and stays above it everywhere else, so x = 0 is the only boundary this derivative offers. Both bands on the number line read + f′ > 0, and no behavior of f has been named yet.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'The derivative equals 0 at x = 0, but it is positive on both sides. What happens to f as x passes through 0?',
                choices: [
                    'f keeps increasing through x = 0, because the sign of f′ is positive on both sides of it.',
                    'f switches from increasing to decreasing at x = 0, because a zero of f′ always reverses what f does.',
                    'f falls and then rises at x = 0, because the graph of f′ falls and then rises and f follows that shape.'
                ], a: 0,
                whyBy: [
                    'The sign of f′ carries the behavior of f, and a positive sign on both sides gives increasing on both sides. The zero at x = 0 was checked and the check came out the same twice.',
                    'A zero of f′ is a boundary worth testing, not a guaranteed reversal. Here f′ = 3x² touches 0 without crossing it, so both sides keep the positive sign and the direction of f never changes.',
                    'That reads the shape of the f′ graph as if it were the behavior of f. The derivative curve falling only means the values of f′ are shrinking, and f follows the sign of f′, which is positive either side of x = 0.'
                ]
            },
            message: 'The number line now names the behavior inside each band: + f′ > 0, increasing on the left of 0 and + f′ > 0, increasing on the right of it, with f′ = 0 sitting between as the checked boundary. Nothing reverses at x = 0. The graph of f is still off the page, and the next question is what it can say about that one point.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'The graph of f(x) = x³ is about to appear. f′(0) = 0 is a slope read at x = 0, so what does the curve of f do there?',
                choices: [
                    'Its tangent at x = 0 is horizontal, and the curve keeps climbing through that point.',
                    'Its tangent at x = 0 is horizontal, and the curve stops there and heads back down.',
                    'Its tangent at x = 0 is vertical, because a derivative of 0 describes an upright line.'
                ], a: 0,
                whyBy: [
                    'A slope of 0 is a flat tangent, and a flat tangent is a momentary slowing rather than a reversal. The positive sign of f′ on both sides still holds, so the climb continues.',
                    'That expects a zero of f′ to force a turnaround. The curve does flatten at x = 0, and then it goes on upward, because f′ stays positive either side of the touch.',
                    'A derivative of 0 is a horizontal line, not an upright one. An undefined derivative is where a graph can stand upright, and f′(0) = 0 is a perfectly defined value.'
                ]
            },
            message: 'The cubic matches the sign chart it was read from: it rises, flattens at the origin where the tangent is horizontal, and rises again on the other side. The flattening is the only thing the zero of f′ buys here, and the two rising arms are the picture confirming f′ > 0 either side of it.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'What does this one case teach about a zero of f′?',
                choices: [
                    'It is a boundary worth checking, and it does not by itself change what f does.',
                    'It is the place where f must end one behavior and start the opposite one.',
                    'It can be skipped, because only the graph of f itself shows what f does.'
                ], a: 0,
                whyBy: [
                    'x = 0 is the only zero of f′ = 3x², the test was run on both sides of it, and both sides read positive. The boundary earned its place on the number line and changed nothing else.',
                    'That is the assumption this case exists to break. The signs on either side have to actually differ for the behavior of f to differ, and here they do not.',
                    'The sign chart settled this before the cubic appeared, and the cubic only confirmed it. The zeros of f′ are exactly where you look first, and looking is not the same as concluding.'
                ]
            },
            message: 'The written justification and the two readings are open now. Since f′(x) > 0 on (−∞, 0) and since f′(x) > 0 on (0, ∞), f is increasing on each of those intervals, and the zero at x = 0 splits the domain without splitting the behavior. Topic 5.4 will use whether the sign changes to classify the critical point.'
        },
        {
            params: { stage: 5 },
            message: 'Keep the two halves of this in the same note. A zero of f′ where the sign differs across it ends one behavior and starts another, and a zero where the sign repeats, as here, leaves the behavior alone. Only the test on either side tells those two apart, so run it every time you find a zero.'
        }
    ],
    summary: SUMMARY
};

export default monotonicityStationaryMode;
