/* 2.4 Differentiability Inspector — differentiable implies continuous, never
   the reverse. A derivative needs one finite slope both sides agree on. */

import { derivative } from '../../js/calc-math.js?v=20260925-calc-15';

/* Each case carries the metadata the verdict board, the closing table and the
   trend line read, so a new case must state all of it or the panels start
   contradicting each other. The four board rows are the continuity test, the
   two one-sided finiteness tests and the matching test, and a case that fails
   continuity marks the other three as not applicable. Windows are per case
   because every case reaches different heights. The hole case keeps two
   functions: f, which has no value at the hole, and line, the finished
   straight line the graph draws while the open circle masks it. */
const CASES = {
    smooth: {
        label: 'smooth point', note: 'parabola at its lowest point', c: 0, cont: true, leftFinite: true, rightFinite: true, slopesEqual: true,
        f: (x) => 0.5 * x * x + 1,
        win: [-2.3, 2.3, -0.6, 3.9],
        story: 'This is a parabola near its lowest point. The secants from both sides settle on the same finite slope. That slope is 0 here.'
    },
    corner: {
        label: 'corner of |x|', note: 'the absolute value at 0', c: 0, cont: true, leftFinite: true, rightFinite: true, slopesEqual: false, leftM: -1, rightM: 1,
        f: (x) => Math.abs(x),
        win: [-2.3, 2.3, -0.6, 2.6],
        story: 'The graph has no hole and no jump, so the function is continuous. The left secants settle at −1 and the right secants settle at +1. One point cannot have two different slopes, so the derivative does not exist.'
    },
    vertical: {
        label: 'vertical tangent ∛x', note: 'the cube root at 0', c: 0, cont: true, leftFinite: false, rightFinite: false, slopesEqual: 'na', vertical: true,
        f: (x) => Math.cbrt(x),
        win: [-2.3, 2.3, -1.6, 1.6],
        story: 'Both sides agree that the tangent line is vertical. The slopes grow past every number as the gaps shrink. The curve stays continuous, but no finite derivative exists.'
    },
    broken: {
        label: 'hole at x = 2', note: 'a line missing one point', c: 2, cont: false, hole: 2,
        f: (x) => x === 2 ? NaN : 0.5 * x + 1,
        line: (x) => 0.5 * x + 1,
        win: [0, 4.5, 0.2, 3.6],
        story: 'The graph has a hole at 2, so f(2) is undefined. Without continuity at 2, the derivative does not exist there.'
    },
    piecewise: {
        label: 'piecewise at x = 1', note: 'two formulas meeting at 1', c: 1, cont: true, leftFinite: true, rightFinite: true, slopesEqual: false, leftM: 1, rightM: 2,
        f: (x) => x <= 1 ? 0.5 * x * x : 2 * x - 1.5,
        win: [-1.5, 3.2, -0.8, 5.2],
        story: 'Two different formulas meet at x = 1. Both give the value 0.5 there, so the graph is connected. The left formula arrives with slope 1 and the right formula leaves with slope 2.'
    },
    cusp: {
        label: 'cusp at x = 0', note: 'a sharp point from above', c: 0, cont: true, leftFinite: false, rightFinite: false, slopesEqual: 'na', cusp: true,
        f: (x) => Math.pow(Math.abs(x), 2 / 3),
        win: [-2.3, 2.3, -0.6, 2.6],
        story: 'The graph comes to a sharp point from above, and it has no hole. The left slopes fall past every negative number while the right slopes rise past every positive number. The sides are unbounded and they point opposite ways, so no finite derivative exists.'
    }
};

/* The board, the closing table and the pane gates all read this one block, so a
   case can never be marked one way in one pane and another way elsewhere. The
   dash glyph means not applicable and nothing else. It reaches the table through
   a cell function, and the checklist renderer produces its own dash the same
   way, so a row that has nothing to check is the only row that shows one. A test
   whose answer is not revealed yet is never marked at all, which is why the
   diagnose screen asks the four tests as open questions. */
const PHASE = { observe: 1, diagnose: 2, verdict: 3, closing: 4 };
const MARK = { yes: '✓', no: '✗', na: '—' };

function testsFor(c) {
    const na = !c.cont;
    return [
        { t: 'Is f continuous at c?', state: c.cont },
        { t: 'Do the left secant slopes approach a finite number?', state: na ? 'na' : !!c.leftFinite },
        { t: 'Do the right secant slopes approach a finite number?', state: na ? 'na' : !!c.rightFinite },
        { t: 'Are those two finite numbers equal?', state: na ? 'na' : c.slopesEqual }
    ];
}
function markOf(state) {
    if (state === 'na') return MARK.na;
    return state === true || state === 'pass' ? MARK.yes : MARK.no;
}
function markCell(state, on) {
    const color = state === 'na' ? 'auxInk' : markOf(state) === MARK.yes ? 'up' : 'down';
    return { v: () => markOf(state), color, bold: on };
}

export default {
    id: 'u2-differentiability',
    meta: { unit: 2, topic: '2.4', title: 'Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist', visualizerTitle: 'Differentiability Inspector' },
    intro: 'Shrink the secant gap on each side and read the two slopes that appear. Every case runs on the same three screens: the two readings first, then the four questions to weigh, then the board filled in.',
    params: { kase: 'smooth', hL: 1.4, hR: 1.4, phase: PHASE.observe },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        },
        { key: 'hL', label: 'left secant gap', min: 0.05, max: 2, step: 0.01 },
        { key: 'hR', label: 'right secant gap', min: 0.05, max: 2, step: 0.01 }
    ],
    fns: { f: (x, env) => CASES[env.kase].f(x) },
    panes: {
        main: [
            {
                kind: 'graph', title: env => CASES[env.kase].label, height: 350,
                window: env => CASES[env.kase].win,
                curves: env => {
                    const c = CASES[env.kase];
                    /* The hole case draws its finished line straight through and
                       lets the open circle mask the one missing point, so the
                       picture reads as one line with one point removed. */
                    return [{ fn: c.line || 'f', color: 'curveA', samples: 600 }];
                },
                points: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    const drawn = (x) => (c.line || c.f)(x);
                    return [
                        { x: c.c - env.hL, y: fx(c.c - env.hL), color: 'up', label: 'L' },
                        { x: c.c + env.hR, y: fx(c.c + env.hR), color: 'down', label: 'R' },
                        { x: c.c, y: fx(c.c), color: 'ink', label: 'c' },
                        ...(c.hole === undefined ? [] : [{ x: c.hole, y: drawn(c.hole), open: true, color: 'down', label: 'hole' }])
                    ].filter(p => Number.isFinite(p.y));
                },
                segments: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    const y0 = fx(c.c);
                    const out = [];
                    if (Number.isFinite(y0)) {
                        if (Number.isFinite(fx(c.c - env.hL))) out.push({ x1: c.c - env.hL, y1: fx(c.c - env.hL), x2: c.c, y2: y0, color: 'up' });
                        if (Number.isFinite(fx(c.c + env.hR))) out.push({ x1: c.c, y1: y0, x2: c.c + env.hR, y2: fx(c.c + env.hR), color: 'down' });
                    }
                    return out;
                }
            },
            {
                kind: 'table', title: 'Classification of the six cases',
                when: env => env.phase >= PHASE.closing,
                cols: ['Case', 'Continuous at c', 'Left slopes finite', 'Right slopes finite', 'Two numbers equal', 'f′(c) exists'],
                rows: env => Object.keys(CASES).map(k => {
                    const c = CASES[k];
                    const on = k === env.kase;
                    const exists = hasFiniteSlope(c);
                    const cells = testsFor(c).map(row => markCell(row.state, on));
                    cells.push({ v: () => markOf(exists), color: exists ? 'up' : 'down', bold: on });
                    return [{ v: c.note, bold: on }, ...cells];
                }),
                note: 'The row in bold is the case you are on. A dash means that test has nothing to check for that row, so it is neither a pass nor a failure.'
            }
        ],
        side: [
            {
                kind: 'readout', title: 'Secant slopes from each side',
                items: env => {
                    const c = CASES[env.kase];
                    const fx = (x) => c.f(x);
                    const mL = (fx(c.c) - fx(c.c - env.hL)) / env.hL;
                    const mR = (fx(c.c + env.hR) - fx(c.c)) / env.hR;
                    return [
                        { label: 'left secant slope', v: Number.isFinite(mL) ? mL : 'no value to compare', color: 'up' },
                        { label: 'right secant slope', v: Number.isFinite(mR) ? mR : 'no value to compare', color: 'down' },
                        { label: 'Trend as the gaps shrink', v: trendNote(c), color: 'accent' }
                    ];
                }
            },
            {
                kind: 'eq', title: 'Four questions to weigh',
                /* The diagnose screen holds the four tests as open questions with
                   a leading question mark, because the checklist cannot show a
                   pending row. The wording comes from testsFor, so the questions
                   here and the marks on the board are the same four tests. */
                when: env => env.phase === PHASE.diagnose,
                lines: env => testsFor(CASES[env.kase]).map(row => ({ t: '? ' + row.t }))
            },
            {
                kind: 'checklist', title: 'Verdict board',
                /* The board only ever carries real marks, so it arrives with the
                   verdict screen instead of showing dashes first. The observe
                   screen shows the graph and the two slope readings only, and
                   Next walks the whole case even with no answer. */
                when: env => env.phase >= PHASE.verdict,
                items: env => testsFor(CASES[env.kase]),
                verdict: env => verdictFor(CASES[env.kase]),
                verdictOk: env => hasFiniteSlope(CASES[env.kase])
            },
            {
                kind: 'note', title: 'What is happening here', text: env => CASES[env.kase].story,
                when: env => env.phase >= PHASE.verdict
            }
        ]
    },
    /* A step's params land on the NEXT screen, and so does its message, while
       its predict is asked on the screen before them. So each predict below sits
       on the step that leaves its own case, which keeps every question on the
       observe screen of the case it asks about. Inside a case the phase counter
       walks observe to diagnose to verdict, and Next alone carries it through
       every phase whether or not the question is answered. */
    steps: [
        { params: { kase: 'smooth', hL: 1.4, hR: 1.4, phase: PHASE.observe }, message: 'Start on this point. Shrink both gaps one at a time and watch the two slope readings move. Compare the left number with the right number at each gap size. f′(c) exists exactly when the left and right secant slopes approach the same finite number.' },
        { params: { phase: PHASE.diagnose }, message: 'Four questions appear for this point. Read each one against the left number and the right number and decide for yourself.' },
        { params: { phase: PHASE.verdict }, message: 'The board fills in and all four rows pass, so f′(c) exists here. The parabola has slope 0 at its lowest point.' },
        { params: { kase: 'corner', phase: PHASE.observe }, message: 'Shrink both gaps and compare the two readings. What number does each side approach? Watch whether the two numbers move together or move apart.' },
        {
            params: { phase: PHASE.diagnose },
            predict: {
                q: 'This graph is continuous at 0, because the pieces meet with no hole and no jump. Does continuity at 0 guarantee that f′(0) exists?',
                choices: ['No. Continuity only means the graph meets, and the two sides must also agree on one finite slope.', 'Yes. Every function that is continuous at a point is differentiable there.', 'Yes. The point clearly lies on the graph, so the derivative exists there.'], a: 0,
                why: 'The left secants stay at −1 and the right secants stay at +1 at every zoom. Each side settles on a finite number, but not on the same one, so the derivative fails the requirement that both sides reach one finite number.'
            },
            message: 'The same four questions appear here. Hold each one against the two readings before you press Next.'
        },
        { params: { phase: PHASE.verdict }, message: 'Rows two and three pass and the last row fails. Each side reaches a finite number, and those two numbers differ, so f′(c) does not exist here.' },
        { params: { kase: 'vertical', phase: PHASE.observe }, message: 'Shrink both gaps and watch how large each reading gets. Does either number settle on a value you could write down?' },
        {
            params: { phase: PHASE.diagnose },
            predict: {
                q: 'This graph is continuous at 0, and both sides agree that the tangent line is vertical. May we report that f′(0) = ∞?',
                choices: ['No. A derivative must be a finite number, so ∞ here reports a vertical tangent.', 'Yes. Infinity is an acceptable value, because it matches the steep slope.', 'Yes. Both sides agree on the direction, so the derivative exists there.'], a: 0,
                why: 'Agreement about direction is not agreement about a number. The slopes grow past every bound, so f′(0) does not exist, and the correct description is a vertical tangent line at 0. This is the opposite failure from the corner, where each side had a finite number but the numbers differed.'
            },
            message: 'The four questions appear again. Weigh the size of each reading before you answer the second and the third one.'
        },
        { params: { phase: PHASE.verdict }, message: 'The two directions agree, but the sizes are unbounded, so rows two and three fail. The last row shows a dash because there are no finite numbers to compare.' },
        { params: { kase: 'broken', phase: PHASE.observe }, message: 'Look at the open circle on the line and see where it sits. Then shrink both gaps and read what each slope reading shows at that point.' },
        { params: { phase: PHASE.diagnose }, message: 'The four questions appear. The first one asks for the value of f at c.' },
        { params: { phase: PHASE.verdict }, message: 'The hole fails the first row of the verdict board, and the three rows below it show a dash because there is nothing to compare. Without continuity there is no derivative to discuss. A differentiable function is always continuous, but a continuous function need not be differentiable.' },
        { params: { kase: 'piecewise', hL: 0.6, hR: 0.6, phase: PHASE.observe }, message: 'This graph is drawn from two formulas that meet at x = 1. Shrink both gaps and note what each reading approaches. Then compare those two numbers.' },
        {
            params: { phase: PHASE.diagnose },
            predict: {
                q: 'Here f uses two formulas that meet at x = 1. Is this graph continuous at x = 1, and is it differentiable there?',
                choices: ['Continuous, because both formulas give 0.5 at x = 1. Not differentiable, because the side slopes are 1 and 2.', 'Neither, because the two formulas do not meet at x = 1, and a broken graph has no slope.', 'Both, because the graph has no gap and no sharp point where the two formulas meet.', 'Differentiable but not continuous, because the side slopes are 1 and 2 and never match.'], a: 0,
                why: 'Check continuity first. Both pieces give 0.5 at x = 1, so the pieces meet. Then check the slopes. The left formula gives slope x, which is 1 at x = 1, and the right formula gives slope 2. The two side slopes disagree, so f′(1) does not exist.'
            },
            message: 'The four questions appear. Test the first one from the two formula values, then test the last one from the two readings.'
        },
        { params: { phase: PHASE.verdict }, message: 'The first three rows pass and the last row fails, which is the same failure as the corner. Two formulas can meet at a point and still disagree about the slope there.' },
        { params: { kase: 'cusp', phase: PHASE.observe }, message: 'Shrink both gaps and watch which way each reading heads as the gap closes. Do the two numbers run off the same way or in different ways?' },
        {
            params: { phase: PHASE.diagnose },
            predict: {
                q: 'Here the left slopes run off past every negative number and the right slopes run off past every positive number. Does f′(0) exist?',
                choices: ['No. A derivative is one finite number that both sides reach, and neither side reaches a number here.', 'Yes. The two sides mirror each other, so their slopes cancel out to 0.', 'Yes. The graph has no hole at 0, so a continuous graph must be differentiable there.'], a: 0,
                why: 'Rows two and three fail because neither side stays bounded, and the last row shows a dash because no finite numbers exist to compare. This sharp point is a cusp, and it fails where the corner passed.'
            },
            message: 'The four questions appear. Compare the direction each reading takes before you answer the second and the third one.'
        },
        { params: { phase: PHASE.verdict }, message: 'The left slopes fall past every negative number and the right slopes rise past every positive number, so rows two and three fail and the last row shows a dash because no finite numbers exist to compare. This sharp point is a cusp. Compare this board with the corner board to see a different failure, and with the vertical tangent board to see the same marks on a different shape.' },
        {
            params: { phase: PHASE.closing },
            message: 'The table marks all six cases with the same four tests and the final answer. The board splits the failures into three patterns. The hole fails the first test, so the three tests below it have nothing to check. The corner and the piecewise case each reach two finite numbers that disagree, so their rows are identical. The vertical tangent and the cusp each fail the two finiteness tests, so their rows are identical too. Inside that last pattern the shape of the graph is what tells them apart, because the unbounded slopes run off in the same direction for the vertical tangent and in opposite directions for the cusp. The board is the classification skeleton, and the picture carries the subtype.'
        }
    ],
    summary: {
        idea: 'Differentiability is stricter than continuity. The derivative f′(c) exists when the left and right secant slopes approach the same finite number. A smooth point passes all four rows, while the other five cases fail in three patterns on the board, and the shape of the graph tells a vertical tangent from a cusp.',
        mistake: 'A graph with no hole can still have no derivative. For f = |x| at 0 the one-sided slopes are the different finite numbers −1 and +1. For f = ∛x both sides run off without bound, and agreeing that the tangent is vertical still leaves no finite derivative.',
        transfer: 'Take f = 0.5x² for x ≤ 1 and f = 2x − 1.5 for x > 1. First ask whether the function is continuous at 1, then ask whether the two side slopes approach the same finite number. Pick the piecewise case in the case selector to let the tool check your answers.'
    }
};

function trendNote(c) {
    if (!c.cont) return 'the graph is broken at c, so the slopes cannot trend';
    if (hasFiniteSlope(c)) return 'both sides settle on one finite slope, so f′(c) = ' + round2(derivative(c.f, c.c)) + ' here';
    if (c.vertical) return 'both slopes grow without bound, so the tangent is vertical';
    if (c.cusp) return 'the left slope grows past every negative number and the right slope past every positive number';
    return 'the sides settle apart, ' + plain(c.leftM) + ' from the left against ' + plain(c.rightM) + ' from the right';
}
function hasFiniteSlope(c) {
    return !!c.cont && !!c.leftFinite && !!c.rightFinite && c.slopesEqual === true;
}
function verdictFor(c) {
    if (hasFiniteSlope(c)) return 'Yes. The derivative f′(c) exists.';
    if (!c.cont) return 'No. The function is not continuous.';
    if (c.vertical) return 'No finite derivative. The tangent is vertical.';
    if (c.cusp) return 'No finite derivative. Neither side is bounded, and the sides point opposite ways.';
    return 'No. The two sides settle on different finite numbers.';
}
function plain(v) { return v === undefined ? 'no value' : String(v).replace('-', '−'); }
function round2(v) { return String(Math.round(v * 100) / 100); }
