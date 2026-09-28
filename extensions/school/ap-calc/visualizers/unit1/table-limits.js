/* 1.4 Table Limit Tracker - the table is a numerical zoom lens: read the
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
        note: 'This table is for f(x) = (x² + 3x − 4)/(x − 1). It has no row at x = 1 on purpose. Away from x = 1 the formula equals x + 4, which is the line drawn below. Read the trend on both sides to find the value the outputs approach.'
    }
};
const D = [0.5, 0.2, 0.1, 0.02, 0.01, 0.001];

export default {
    id: 'u1-table-limits',
    meta: { unit: 1, topic: '1.4', title: 'Estimating Limit Values from Tables', visualizerTitle: 'Table Limit Tracker' },
    intro: 'Zoom the table closer to x = 1. A single row proves nothing, because every row is only a sample. The trend on both sides decides the limit.',
    params: { kase: 'settle', depth: 2, stage: 0 },
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
            },
            {
                kind: 'numberline', title: 'The two output samples on one line',
                window: env => env.kase === 'transfer' ? [3, 7]
                    : env.kase === 'split' ? [-3, 3]
                        : env.kase === 'runaway' ? [-6, 6] : [0, 4],
                probes: env => {
                    const c = CASES[env.kase];
                    const d = D[Math.round(env.depth) - 1];
                    const cap = (v) => Math.max(-5.5, Math.min(5.5, v));
                    const L = c.f(1 - d), R = c.f(1 + d);
                    const out = [];
                    if (Number.isFinite(L)) out.push({ x: env.kase === 'runaway' ? cap(L) : L, color: 'up', label: 'left sample' });
                    if (Number.isFinite(R)) out.push({ x: env.kase === 'runaway' ? cap(R) : R, color: 'down', label: 'right sample' });
                    return out;
                }
            },
            {
                kind: 'graph', title: 'Verify on graph', height: 320,
                when: env => verifyVisible(env),
                window: env => env.kase === 'runaway' ? [-1.5, 3.5, -5, 5]
                    : env.kase === 'transfer' ? [-0.5, 2.5, 2.5, 7] : [-1.5, 3.5, -2, 4.5],
                vlines: [{ x: 1, color: 'auxInk', label: 'target x = 1' }],
                curves: (env) => env.kase === 'settle' ? [
                    { fn: 'x + 1', color: 'curveA' }
                ] : env.kase === 'transfer' ? [
                    { fn: 'x + 4', color: 'curveA', label: 'f(x), which matches x + 4 here' }
                ] : env.kase === 'split' ? [
                    { fn: '-1', from: -1.5, to: 0.999, color: 'curveA', label: 'left side −1' },
                    { fn: '1', from: 1.001, to: 3.5, color: 'curveA', label: 'right side +1' }
                ] : [
                    { fn: '1/(x-1)', from: -1.5, to: 0.999, samples: 400, color: 'curveA' },
                    { fn: '1/(x-1)', from: 1.001, to: 3.5, samples: 400, color: 'curveA' }
                ],
                points: (env) => {
                    const dep = Math.round(env.depth);
                    const d = D[dep - 1];
                    const c = CASES[env.kase];
                    const out = [];
                    /* the runaway case samples reach ±1000, far outside any
                       window; pin those dots to the frame edge so they stay
                       visible while the table still shows the real values */
                    const clamp = (v) => env.kase === 'runaway' ? Math.max(-4.6, Math.min(4.6, v)) : v;
                    if (env.kase === 'settle') out.push({ x: 1, y: 2, open: true, color: 'auxInk', label: 'no f(1) value' });
                    if (env.kase === 'transfer') out.push({ x: 1, y: 5, open: true, color: 'auxInk', label: 'no f(1) value' });
                    if (env.kase === 'split') {
                        out.push({ x: 1, y: -1, open: true, color: 'up' });
                        out.push({ x: 1, y: 1, open: true, color: 'down' });
                    }
                    out.push({ x: 1 - d, y: clamp(c.f(1 - d)), color: 'up', label: '1−' + d });
                    out.push({ x: 1 + d, y: clamp(c.f(1 + d)), color: 'down', label: '1+' + d });
                    return out;
                }
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
        { params: { kase: 'settle', depth: 1, stage: 1 }, message: 'One zoom level only: the x samples 0.5 and 1.5 sit far from x = 1. Coarse samples hint at the answer, but they cannot settle it.' },
        { params: { depth: 2, stage: 2 }, message: 'Closer rows appear. At the tightest gap the left side reads 1.8 and the right side reads 2.2, so the pattern leans toward one number.' },
        {
            params: { depth: 3, stage: 3 },
            predict: {
                q: 'At the gap of 0.1 the two samples read 1.9 and 2.1. Which value does this pattern approach?',
                choices: ['The value 2. The samples on the left and the right both tighten toward 2.', 'The value 1.9. It is the closest listed sample on the left side.', 'No value at all. A limit cannot exist while f(1) is undefined.'], a: 0,
                why: 'The samples tighten toward 2 from both sides. The missing value f(1) does not stop the limit: a limit is the value the outputs approach, not one the table lists.'
            },
            message: 'Zoom closer and closer. Every new row moves the two samples nearer to one number, and that trend is the reading.'
        },
        {
            params: { depth: 6, stage: 4 },
            message: 'At the gap of 0.001 the two samples read 1.999 and 2.001. The limit is 2, even though the table never shows the value f(1).'
        },
        {
            params: { kase: 'split', depth: 6, stage: 5 },
            predict: {
                q: 'In a new case every left row reads −1 and every right row reads +1, at any zoom. What is lim x→1 f(x)?',
                choices: ['It does not exist. The two sides settle on different values.', 'It is 0. The average of −1 and +1 is the value the limit takes.', 'It cannot be told. A table only lists samples, so it never decides a limit.'], a: 0,
                why: 'A two-sided limit needs one shared target value. Here each side is steady on its own, but the two targets disagree.'
            },
            message: 'A table can also show that a limit fails to exist, because the two sides settle on two stable but different values.'
        },
        {
            params: { kase: 'runaway', depth: 6, stage: 6 },
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
/* The verify graph is only a check, never a spoiler, so it stays hidden until
   the tour has passed that case's Predict. Each step carries stage = index + 1,
   and a step's own stage is only seen once the student advances past it, so the
   graph re-appears right after the answer is committed. transfer has no Predict
   in the tour, so its graph appears once the table is zoomed to the tightest. */
function verifyVisible(env) {
    const k = env.kase;
    if (k === 'settle') return env.stage >= 3;
    if (k === 'split') return env.stage >= 5;
    if (k === 'runaway') return env.stage >= 6;
    return Math.round(env.depth) >= D.length;
}
function trendSentence(c, d) {
    const L = c.f(1 - d), R = c.f(1 + d);
    if (!Number.isFinite(L) || !Number.isFinite(R)) return 'A sample grows without bound, so no finite value is approached.';
    if (Math.abs(L) > 10 || Math.abs(R) > 10) return 'The samples run past every fixed number, so no finite value is approached.';
    const gap = Math.abs(L - R);
    if (gap < 1e-9) return 'Both sides already agree at this zoom.';
    /* one gap alone proves nothing: the settle case differs by 1 at the
       coarse zoom yet halves it each level, so compare against the next zoom */
    const i = D.indexOf(d);
    if (i >= 0 && i + 1 < D.length) {
        const gap2 = Math.abs(c.f(1 - D[i + 1]) - c.f(1 + D[i + 1]));
        if (gap2 >= gap * 0.9) return 'The two sides disagree by ' + round4(gap) + ', and the disagreement does not shrink as the table zooms in. Expect no shared target value.';
    } else if (gap > 3 * d) {
        return 'The two sides still disagree by ' + round4(gap) + ' at the tightest zoom. Expect no shared target value.';
    }
    /* here both sides do close on one number: say which way each side travels
       as the zoom tightens, and never name the number they meet on. */
    const dn = (i >= 0 && i + 1 < D.length) ? D[i + 1] : (i > 0 ? D[i - 1] : null);
    const tighteningAhead = (i >= 0 && i + 1 < D.length);
    const verb = (side) => {
        if (dn === null) return 'hold steady';
        const at = (gap2) => side === 'L' ? c.f(1 - gap2) : c.f(1 + gap2);
        const now = at(d), nxt = at(dn);
        const delta = tighteningAhead ? (nxt - now) : (now - nxt);
        if (Math.abs(delta) < 1e-9) return 'hold steady';
        return delta > 0 ? 'rise' : 'fall';
    };
    return 'As the table zooms in, the left samples ' + verb('L') + ' and the right samples ' + verb('R') + ', and both draw toward one shared number.';
}
