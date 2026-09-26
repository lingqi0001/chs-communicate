/* 1.4 Table Limit Tracker — the table is a numerical zoom lens: read the
   trend from both sides, never a single row. */

const CASES = {
    settle: {
        label: 'both sides settle', a: 1,
        f: (x) => (x * x - 1) / (x - 1),
        note: 'The limit does not need the value f(1), so no row shows x = 1. Each row is a sample, not the answer.'
    },
    split: {
        label: 'the sides split apart', a: 1,
        f: (x) => (x - 1) / Math.abs(x - 1),
        note: 'This function is f(x) = (x−1)/|x−1|. Every left row reads −1 and every right row reads +1, at any zoom.'
    },
    runaway: {
        label: 'unbounded on both sides', a: 1,
        f: (x) => 1 / (x - 1),
        note: 'The left side heads to −∞ while the right side heads to +∞. The sides grow without bound in opposite directions, so the limit does not exist.'
    },
    /* TRANSFER: a brand new function whose table has no x = 1 row on purpose,
       so the reading must come from the trend on both sides. */
    transfer: {
        label: 'no f(a) row, new table', a: 1,
        f: (x) => (x * x + 3 * x - 4) / (x - 1),
        note: 'This new function has no row for x = 1 in the table. Read the trend from both sides to find the value the outputs approach.'
    }
};
const D = [0.5, 0.2, 0.1, 0.02, 0.01, 0.001];

export default {
    id: 'u1-table-limits',
    meta: { unit: 1, topic: '1.4', title: 'Estimating Limit Values from Tables', visualizerTitle: 'Table Limit Tracker' },
    intro: 'Zoom the table closer to x = 1. A single row proves nothing, because every row is only a sample. The trend on both sides decides the limit.',
    params: { kase: 'settle', depth: 2 },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            options: Object.keys(CASES).map(k => ({ v: k, label: CASES[k].label }))
        },
        { key: 'depth', label: 'how many zoom levels', min: 1, max: 6, step: 1 }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: 'The same limit on the graph', height: 320,
                window: env => env.kase === 'runaway' ? [-1.5, 3.5, -5, 5]
                    : env.kase === 'transfer' ? [-0.5, 2.5, 2.5, 7] : [-1.5, 3.5, -2, 4.5],
                vlines: [{ x: 1, color: 'auxInk', label: 'target x = 1' }],
                curves: (env) => env.kase === 'settle' ? [
                    { fn: 'x + 1', color: 'curveA' }
                ] : env.kase === 'transfer' ? [
                    { fn: 'x + 4', color: 'curveA', label: 'same as x + 4' }
                ] : env.kase === 'split' ? [
                    { fn: '-1', from: -1.5, to: 0.97, color: 'curveA', label: 'left side −1' },
                    { fn: '1', from: 1.03, to: 3.5, color: 'curveA', label: 'right side +1' }
                ] : [
                    { fn: '1/(x-1)', from: -1.5, to: 0.97, samples: 400, color: 'curveA' },
                    { fn: '1/(x-1)', from: 1.03, to: 3.5, samples: 400, color: 'curveA' }
                ],
                points: (env) => {
                    const dep = Math.round(env.depth);
                    const d = D[dep - 1];
                    const c = CASES[env.kase];
                    const out = [];
                    if (env.kase === 'settle') out.push({ x: 1, y: 2, open: true, color: 'auxInk', label: 'no f(1) value' });
                    if (env.kase === 'transfer') out.push({ x: 1, y: 5, open: true, color: 'auxInk', label: 'no f(1) value' });
                    if (env.kase === 'split') {
                        out.push({ x: 1, y: -1, open: true, color: 'up' });
                        out.push({ x: 1, y: 1, open: true, color: 'down' });
                    }
                    out.push({ x: 1 - d, y: c.f(1 - d), color: 'up', label: '1−' + d });
                    out.push({ x: 1 + d, y: c.f(1 + d), color: 'down', label: '1+' + d });
                    return out;
                }
            },
            {
                kind: 'table', title: 'Two-sided table approaching x = 1',
                digits: 4,
                cols: ['gap', 'x → 1⁻', 'f(x)', 'x → 1⁺', 'f(x)'],
                rows: (env) => {
                    const c = CASES[env.kase];
                    const shown = D.slice(0, Math.round(env.depth));
                    return shown.map((d, i) => [
                        { v: '±' + d },
                        { v: 1 - d }, { v: c.f(1 - d), color: 'up' },
                        { v: 1 + d }, { v: c.f(1 + d), color: 'down' }
                    ]);
                },
                note: (env) => CASES[env.kase].note
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Trend check',
                lines: (env) => {
                    const c = CASES[env.kase];
                    const d = D[Math.round(env.depth) - 1];
                    return [
                        { t: 'Tightest left row: x = 1 − ' + d, color: 'up' },
                        { t: '  f(x) at that row: ' + round4(c.f(1 - d)), color: 'up' },
                        { t: 'Tightest right row: x = 1 + ' + d, color: 'down' },
                        { t: '  f(x) at that row: ' + round4(c.f(1 + d)), color: 'down' },
                        { t: trendSentence(c, d) }
                    ];
                }
            }
        ]
    },
    steps: [
        { params: { kase: 'settle', depth: 1 }, message: 'One zoom level only: the x samples 0.5 and 1.5 sit far from x = 1. Coarse samples hint at the answer, but they cannot settle it.' },
        { params: { depth: 2 }, message: 'Closer rows appear. At the tightest gap the left side reads 1.8 and the right side reads 2.2, so the pattern leans toward one number.' },
        {
            params: { depth: 3 },
            predict: {
                q: 'At the gap of 0.1 the two samples read 1.9 and 2.1. Which value does this pattern approach?',
                choices: ['The value 2. The samples on the left and the right both tighten toward 2.', 'The value 1.9. It is the closest listed sample on the left side.', 'No value at all. A limit cannot exist while f(1) is undefined.'], a: 0,
                why: 'The samples tighten toward 2 from both sides. The missing value f(1) does not stop the limit: a limit is the value the outputs approach, not one the table lists.'
            },
            message: 'Zoom closer and closer. Every new row moves the two samples nearer to one number, and that trend is the reading.'
        },
        {
            params: { depth: 6 },
            message: 'At the gap of 0.001 the two samples read 1.999 and 2.001. The limit is 2, even though the table never shows the value f(1).'
        },
        {
            params: { kase: 'split', depth: 6 },
            predict: {
                q: 'In a new case every left row reads −1 and every right row reads +1, at any zoom. What is lim x→1 f(x)?',
                choices: ['It does not exist. The two sides settle on different values.', 'It is 0. The average of −1 and +1 is the value the limit takes.', 'It cannot be told. A table only lists samples, so it never decides a limit.'], a: 0,
                why: 'A two-sided limit needs one shared target value. Here each side is steady on its own, but the two targets disagree.'
            },
            message: 'A table can also show that a limit fails to exist, because the two sides settle on two stable but different values.'
        },
        {
            params: { kase: 'runaway', depth: 6 },
            message: 'The two sides grow without bound in opposite directions, so neither side settles on a finite value. The limit does not exist at x = 1. Topic 1.14 meets this opposite-sign behavior again with asymptotes.'
        }
    ],
    summary: {
        idea: 'Read the trend from both sides of the table. A limit is the value the outputs approach, not a value that must appear in any row.',
        mistake: 'Students treat the closest listed value as the limit. Each row is only a sample, and the endless zoom toward the target is what fixes the limit.',
        transfer: 'Set the case named no f(a) row, new table, where the table leaves out x = 1 on purpose. Say which rows of that table matter, and say what value the two sides approach, before doing any algebra.'
    }
};

function round4(v) { return Number.isFinite(v) ? String(Math.round(v * 10000) / 10000) : '±∞'; }
function trendSentence(c, d) {
    const L = c.f(1 - d), R = c.f(1 + d);
    if (!Number.isFinite(L) || !Number.isFinite(R)) return 'A sample grows without bound, so no finite value is approached.';
    if (Math.abs(L - R) < 1e-9) return 'Both sides already agree at this zoom.';
    if (Math.abs(L - R) > 0.5) return 'The two sides disagree strongly, so expect no shared target value.';
    return 'The two samples tighten toward about ' + round4((L + R) / 2) + '.';
}
