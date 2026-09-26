/* 1.13 Continuity Repair Lab — a parameter can heal a break ONLY when the
   destination already exists. One dot, or one branch slope, or nothing. */

export default {
    id: 'u1-repair',
    meta: { unit: 1, topic: '1.13', title: 'Removing Discontinuities', visualizerTitle: 'Continuity Repair Lab' },
    modes: [
        {
            label: 'One dot (k at the hole)',
            intro: 'Here f(x) = (x² − 4)/(x − 2) when x ≠ 2, and f(2) = k. Use the slider to move the point (2, k). Place that point where the two branches meet.',
            params: { k: 1 },
            controls: [{ key: 'k', label: 'k = f(2)', min: -1, max: 9, step: 0.05 }],
            fns: { f: (x) => x === 2 ? NaN : x + 2 },
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'y = f(x)', height: 330,
                        window: [-1, 6, -1, 9],
                        curves: [{ fn: 'f', from: -1, to: 1.94, color: 'curveA' }, { fn: 'f', from: 2.06, to: 6, color: 'curveA' }],
                        points: env => [
                            { x: 2, y: 4, open: true, color: 'auxInk', label: 'target: 4' },
                            { x: 2, y: env.k, color: 'accent', label: 'f(2) = k', drag: { key: 'k', min: -1, max: 9 } }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'checklist', title: 'Repair board',
                        items: env => [
                            { t: '① f(2) is defined (= ' + round2(env.k) + ')', state: true },
                            { t: '② the limit at 2 exists (= 4)', state: true },
                            { t: '③ the limit at 2 equals f(2)', state: Math.abs(env.k - 4) < 0.026 }
                        ],
                        verdict: env => Math.abs(env.k - 4) < 0.026 ? 'Repaired. f(2) equals the limit, so f is continuous at 2.' : 'Condition 3 still fails, so f is not continuous at 2.',
                        verdictOk: env => Math.abs(env.k - 4) < 0.026
                    },
                    { kind: 'note', title: 'Why does the limit equal 4?', text: 'Every input near 2, except 2 itself, gives the value x + 2, and x + 2 approaches 4. The number 4 is not invented. It is the limit that the two branches already have.' }
                ]
            },
            steps: [
                {
                    params: { k: 1 },
                    predict: {
                        q: 'Before moving the slider, which value of k makes the function continuous at 2?',
                        choices: ['Use k = 4, because f(2) must equal the limit at 2.', 'Use k = 0, because the formula has no value at 2.', 'Use k = 2, because 2 is the x-value of the hole.', 'Use no value of k, because a hole breaks continuity.'], a: 0,
                        why: 'Continuity needs condition 3, so the point f(2) must equal the limit. Near x = 2 the formula equals x + 2, so the limit is 4 and k must be 4 too.'
                    },
                    message: 'Drag the point or use the slider. Watch the repair board change as k passes 4.'
                },
                { params: { k: 4 }, message: 'All three rows are green now. The hole was never a break in either branch. Only the point value at x = 2 was wrong.' }
            ],
            summary: {
                idea: 'A single point repairs continuity only when the limit around that point already exists. The point must be set equal to that limit.',
                mistake: 'Students believe that any discontinuity can be healed by moving one point.',
                transfer: 'Take f(x) = (x² − 3x + 2)/(x − 2) when x ≠ 2, with f(2) = m. Find m without graphing. Then name the factor that created the hole.'
            }
        },
        {
            label: 'One slope (piecewise k)',
            intro: 'Here f = kx + 1 for x < 2, and f = x² − 1 for x ≥ 2. Tilt the left branch with k until the two branches meet.',
            params: { k: -0.5 },
            controls: [{ key: 'k', label: 'k (left slope)', min: -2, max: 3, step: 0.05 }],
            fns: {
                left: (x, env) => env.k * x + 1,
                right: (x) => x * x - 1
            },
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'y = f(x), two branches', height: 330,
                        window: [-1, 4.5, -3.4, 8],
                        curves: [{ fn: 'left', from: -1, to: 2, color: 'curveA', label: 'kx + 1' }, { fn: 'right', from: 2, to: 4.5, color: 'curveB', label: 'x² − 1' }],
                        points: env => [
                            { x: 2, y: round3(env.k * 2 + 1), open: true, color: 'up', label: 'left end' },
                            { x: 2, y: 3, color: 'ink', label: 'f(2) = 3 from x² − 1' }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'eq', title: 'The equation you are solving',
                        lines: env => [
                            { t: 'Left branch end:  k·2 + 1 = ' + round3(env.k * 2 + 1), color: 'up' },
                            { t: 'Right branch value:  2² − 1 = 3', color: 'down' },
                            { t: 'Repair means 2k + 1 = 3, so k = 1', hl: Math.abs(env.k - 1) < 0.026 }
                        ]
                    },
                    {
                        kind: 'checklist', title: 'Repair board',
                        items: env => [
                            { t: '① f(2) exists (= 3)', state: true },
                            { t: '② both branches agree at x = 2 (' + round3(env.k * 2 + 1) + ' vs 3)', state: Math.abs(env.k * 2 + 1 - 3) < 0.026 },
                            { t: '③ the limit equals f(2)', state: Math.abs(env.k * 2 + 1 - 3) < 0.026 }
                        ],
                        verdict: env => Math.abs(env.k * 2 + 1 - 3) < 0.026 ? 'Repaired. The left branch meets f(2) = 3, so f is continuous at 2.' : 'Condition 2 still fails, so f is not continuous at 2.',
                        verdictOk: env => Math.abs(env.k * 2 + 1 - 3) < 0.026
                    }
                ]
            },
            steps: [
                {
                    params: { k: -0.5 },
                    predict: {
                        q: 'Predict k before you slide. Which value of k makes the two branches meet at x = 2?',
                        choices: ['Use k = 1, because then 2k + 1 equals 3.', 'Use k = 3, because the right branch already gives 3.', 'Use k = 0.5, because then 2k + 1 equals 2.', 'Use k = −1, because then the left branch tilts down.'], a: 0,
                        why: 'Set the limit from the left equal to f(2), which the right branch supplies. That gives 2k + 1 = 3, so k = 1. This is the standard parameter problem for continuity.'
                    },
                    message: 'Slide k. The open circle marks where the left branch ends at x = 2. Move that circle onto the solid dot.'
                },
                { params: { k: 1 }, message: 'Now the branches meet. You proved three things: the limit at 2 exists, f(2) exists, and the two values are equal. That is a complete continuity justification for a parameter problem.' }
            ],
            summary: {
                idea: 'A piecewise parameter problem asks you to make the two branches meet. Set the limit from the left equal to the value of f at the shared x.',
                mistake: 'Students substitute x = 2 into only the right branch. The end of the left branch is the part under repair, so it needs the same attention.',
                transfer: 'Take f = kx + 1 when x < 2 and f = 3x − k when x ≥ 2. Solve for k. Then state the three continuity conditions in words.'
            }
        },
        {
            label: 'Unrepairable jump',
            intro: 'The controls look the same here, and the outcome will not be. The left branch approaches 2 and the right branch approaches 5. Move the point (2, k) wherever you like.',
            params: { k: 3.5 },
            controls: [{ key: 'k', label: 'k = f(2)', min: -1, max: 8, step: 0.05 }],
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'y = f(x), a jump at 2', height: 330,
                        window: [-1, 6, -1, 8],
                        curves: [{ fn: '0.5x + 1', from: -1, to: 1.94, color: 'curveA', label: 'Left branch goes to 2' }, { fn: 'x + 3', from: 2.06, to: 6, color: 'curveA', label: 'Right branch goes to 5' }],
                        points: env => [
                            { x: 2, y: 2, open: true, color: 'up' },
                            { x: 2, y: 5, open: true, color: 'down' },
                            { x: 2, y: env.k, color: 'accent', label: 'k', drag: { key: 'k', min: -1, max: 8 } }
                        ]
                    }
                ],
                side: [
                    {
                        kind: 'checklist', title: 'Repair board',
                        items: env => [
                            { t: '① f(2) is defined', state: true },
                            { t: '② the limit at 2 exists: the branches give 2 and 5', state: false },
                            { t: '③ the limit equals f(2), and here there is no limit', state: false }
                        ],
                        verdict: () => 'No value of k fixes this jump, because condition 2 fails.',
                        verdictOk: 0
                    },
                    { kind: 'note', tone: 'warn', title: 'Why one point cannot help', text: 'A jump fails at condition 2, before the point value matters. The point (2, k) controls conditions 1 and 3 only, so no single point can join two different branch limits.' }
                ]
            },
            steps: [
                {
                    params: { k: 3.5 },
                    predict: {
                        q: 'Before you drag the point: for which value of k does this function become continuous at 2?',
                        choices: ['Use no value of k, because a jump is not a one-point problem.', 'Use k = 3.5, the average of the two branch limits 2 and 5.', 'Use k = 5, to match the branch on the right of 2.', 'Use k = 2, to match the branch on the left of 2.'], a: 0,
                        why: 'Continuity requires the limit at 2 to exist first. The two branches approach 2 and 5, so no limit exists for any value of k to equal.'
                    },
                    message: 'Try it anyway. Drag k across its full range from −1 to 8. The repair board never turns green, because no value of k works.'
                }
            ],
            summary: {
                idea: 'One point repairs a break exactly when the break is removable, which means the limit exists. A jump break and an infinite break are not removable. Sorting breaks by the condition that failed is the key skill in this part of Unit 1.',
                mistake: 'Students reach for a value of k on every broken graph. The parameter k can fix the point value and the equality, but k cannot make two branches agree.',
                transfer: 'Look at (x² − 4)/(x − 2) at x = 2, and at 4/(x − 2) at x = 2. Third, look at x + 1 for x < 1 and x + 3 for x ≥ 1 at x = 1. Which of the three breaks are repairable, and by what?'
            }
        }
    ]
};

function round2(v) { return String(Math.round(v * 100) / 100); }
function round3(v) { return String(Math.round(v * 1000) / 1000); }
