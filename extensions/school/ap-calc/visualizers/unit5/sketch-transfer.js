/* 5.8 Mode 3, Mixed Sketch Challenge, tab label 'Mixed sketch challenge'.
   File: visualizers/unit5/sketch-transfer.js (agent u58-c-challenge).

   This mode teaches nothing. There is no rule card, no formula and no
   derivative algebra anywhere in it, which is the red line for Mode 3: the
   student gets verbal information in Problem 1 and a sign table in Problem 2,
   which is the graphical, numerical and analytical coverage the CED asks for in
   topic 5.8. Every student-visible string below is plain English plus interval
   notation. The only f and f′ symbols that appear are the column headers of the
   Problem 2 table, exactly as the spec writes them, and no expression of f, f′
   or f″ is ever printed.

   Problem 1. Five verbal statements: f is increasing on (−∞, −2), decreasing on
   (−2, 1), increasing on (1, ∞), concave down on (−∞, 0), concave up on (0, ∞),
   and f(0) = 1. The student derives x = −2 as a local maximum, x = 1 as a local
   minimum and x = 0 as an inflection point, then picks the one sketch among four
   candidates that obeys every statement. Heights at the turning points are NOT
   fixed by the clues, so the candidates are drawn at different heights on
   purpose and the copy says plainly that only the anchor (0, 1) is a fixed
   point.

   Problem 2. One sign table on the intervals (−4, −1), (−1, 2) and (2, 5) with
   the sign of f′ and the sign of f″. The student translates it into rise plus
   concave down, fall plus concave down, rise plus concave up, picks a plausible
   sketch, then classifies x = −1 and x = 2. The discriminating detail: x = −1 is
   a turning point but NOT an inflection point, because the sign of f″ is − on
   both sides of it. The only inflection is x = 2, where the sign of f″ goes − to
   +, and x = 2 is a turning point as well.

   How the candidate sketches are drawn. No freehand drawing is used. Each
   candidate is generated the same way, by a slope polyline, that is a list of
   stops giving the slope of the sketch at a few x-values, joined by straight
   pieces, and then accumulated exactly into heights. A stop list therefore fixes
   where the sketch turns around (a slope crossing zero) and where it is concave
   up or down (a slope line rising or falling) while leaving every height free,
   which is exactly what the clues leave free. Two devices matter. A slope line
   that is flat and positive around x = −1, used by Candidate H of Problem 2, is a
   shelf and not a turning point. Two stops at nearly the same x with different
   slopes make a kink, and a kink is only used where a sign table forces one: a
   sketch that falls on (−1, 2) and then rises on (2, 5) while bending down up to
   x = 2 has no smooth way to turn around there. The same generator builds the
   closing sketch of each problem. That code is an internal drawing device and
   never appears as a formula in the copy.

   Stage discipline. Every reveal keys off params.stage, which only steps
   advance, never off an answer, so pressing Next without choosing still walks
   the mode and every question stays optional. Each problem's clue board,
   candidate board and result panel retire once that problem is answered, so
   finished panels exit instead of stacking. */

const MINUS = '−';

/* Real minus for every displayed number, same house helper as 5.3 to 5.5. */
const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', MINUS);
};

/* One table cell or readout value. `v` is always a function so the renderer
   prints the string it is handed instead of re-parsing it. */
const cell = (s, emph) => Object.assign({ v: () => s }, emph || {});

/* ---------- Problem 1 clues, verbal only, no formulas ---------------------- */

/* The five statements and the one fixed point, straight from the spec, as table
   rows. Nothing in this list is a formula. */
const P1_ROWS = [
    { about: 'direction', says: 'f is increasing', iv: '(−∞, −2)', tone: 'up' },
    { about: 'direction', says: 'f is decreasing', iv: '(−2, 1)', tone: 'down' },
    { about: 'direction', says: 'f is increasing', iv: '(1, ∞)', tone: 'up' },
    { about: 'bend', says: 'f is concave down', iv: '(−∞, 0)', tone: 'down' },
    { about: 'bend', says: 'f is concave up', iv: '(0, ∞)', tone: 'up' },
    { about: 'fixed point', says: 'f goes through this point', iv: '(0, 1)', tone: 'accent' }
];

/* The derived features, the ones question 1 asks for. */
const P1_MAX = 'x = −2';
const P1_MIN = 'x = 1';
const P1_INFL = 'x = 0';
const P1_ANCHOR = '(0, 1)';

/* The same clues drawn as two interval maps. Their x window equals the sketch
   windows, so the band edges name the same x-values as the candidate guides. The
   maps are not pixel rulers of the panels below them, the numberline keeps 20 px
   margins at each end and the graph keeps none, and the two figures are never
   stacked as one ruler. Numberline bands are strokes, so they take house color
   tokens rather than the mixed fills the graph band fields need. */
const MAP_WIN = [-5.5, 4.5];
const P1_DIR_BANDS = [
    { from: -5.5, to: -2, color: 'up', label: 'increasing' },
    { from: -2, to: 1, color: 'down', label: 'decreasing' },
    { from: 1, to: 4.5, color: 'up', label: 'increasing' }
];
/* markers carry no labels: a probe label claims the top row and the placeLabels
   pass then pushes the band words down onto the tick numbers */
const P1_DIR_PROBES = [
    { x: -2, color: 'accent' },
    { x: 1, color: 'aux' }
];
const P1_BEND_BANDS = [
    { from: -5.5, to: 0, color: 'down', label: 'concave down' },
    { from: 0, to: 4.5, color: 'up', label: 'concave up' }
];
const P1_BEND_PROBES = [
    { x: 0, color: 'ink' }
];

/* ---------- Problem 2 table, tabular only ---------------------------------- */

const P2_ROWS = [
    { iv: '(−4, −1)', fp: '+', fpp: '−', say: 'rising and concave down' },
    { iv: '(−1, 2)', fp: '−', fpp: '−', say: 'falling and concave down' },
    { iv: '(2, 5)', fp: '+', fpp: '+', say: 'rising and concave up' }
];

/* ---------- the sketch generator (an internal drawing device) -------------- */

/* A sketch is built from a slope polyline: stops of [x, slope], joined by
   straight pieces, read left to right, and accumulated exactly into heights, so
   the finished sketch is piecewise quadratic and has no corner except where a
   stop list puts one. Therefore:
   a slope crossing zero gives a local maximum or minimum at that x,
   a rising slope piece gives concave up, a falling slope piece gives
   concave down, and a flat slope piece gives neither.
   Two stops at nearly the same x with different slopes make a kink, and a kink is
   used only where a sign table forces one: a sketch that falls on (−1, 2) and
   then rises on (2, 5) while still bending down up to x = 2 cannot turn around
   smoothly there, which is the same reason Candidate E of Problem 2 has to kink
   at x = −1 once the second row is read as concave up.
   `lift` scales every height change, and `at` is the height of the sketch at
   anchorX, so the whole figure can be framed inside one shared window while its
   turning x-values stay exactly where the information puts them. */
function makeSketch(stops, opts) {
    const o = opts || {};
    const lift = o.lift === undefined ? 1 : o.lift;
    const anchorX = o.anchorX === undefined ? 0 : o.anchorX;
    const at = o.at === undefined ? 0 : o.at;
    const xs = stops.map(s => s[0]);
    const vs = stops.map(s => s[1]);
    const n = stops.length;
    const lo = xs[0];
    const hi = xs[n - 1];

    /* heights by exact accumulation of the slope polyline, starting at zero
       height on the far left, so the sketch is piecewise quadratic and smooth */
    function raw(x) {
        if (x <= lo) return 0;
        let acc = 0;
        for (let i = 0; i < n - 1; i++) {
            const a = xs[i];
            const b = xs[i + 1];
            if (x >= b) {
                acc += (vs[i] + vs[i + 1]) / 2 * (b - a);
                continue;
            }
            if (x > a) {
                const t = (x - a) / (b - a);
                const v = vs[i] + (vs[i + 1] - vs[i]) * t;
                acc += (vs[i] + v) / 2 * (x - a);
            }
            return acc;
        }
        return acc;
    }

    const base = raw(anchorX);
    return function (x) {
        if (x < lo || x > hi) return NaN;                  /* pen lifts, no arrow */
        return lift * (raw(x) - base) + at;
    };
}

/* ---------- Problem 1 candidate sketches ---------------------------------- */

/* Every window holds all four candidate heights, so the candidates are framed
   identically and no data point touches a window edge. x spans 10 units, y spans
   7 for Problem 1 and 6 for Problem 2. */
const P1_WIN = [-5.5, 4.5, -3.2, 3.8];
const P2_WIN = [-4.4, 5.6, -2.9, 3.1];

/* A, the upside-down reading: it falls until x = −2, rises until x = 1 and falls
   again, so its turning points are swapped, and its bend is flipped as well. It
   still runs through (0, 1), so the fixed point alone does not expose it. */
const p1A = makeSketch(
    [[-5.5, -2.1], [-4, -0.6], [-2, 0], [0, 1.2], [1, 0], [4.5, -1.6]],
    { at: 1, lift: 1 }
);

/* B, the one sketch that obeys every statement: the slope line falls the whole
   way until x = 0 and rises after x = 0, crossing zero at −2 and at 1. */
const p1B = makeSketch(
    [[-5.5, 2.1], [-4, 0.6], [-2, 0], [0, -1.2], [1, 0], [4.5, 1.6]],
    { at: 1, lift: 1 }
);

/* C, a concavity slip: the direction is right, but the sketch stops bending down
   at x = −1 and bends up from there, so its inflection point is at x = −1 and it
   is already concave up at x = 0. It still runs through (0, 1). */
const p1C = makeSketch(
    [[-5.5, 2.1], [-4, 0.6], [-2, 0], [-1, -0.9], [1, 0], [4.5, 1.5]],
    { at: 1, lift: 1 }
);

/* D, the wrong height: direction and concavity both match the statements, but its
   curve crosses x = 0 at P1_D_CROSS, so it passes below the fixed point (0, 1). */
const P1_D_CROSS = -1.2;
const p1D = makeSketch(
    [[-5.5, 2.1], [-4, 0.6], [-2, 0], [0, -1.2], [1, 0], [4.5, 1.6]],
    { at: P1_D_CROSS, lift: 1 }
);

/* ---------- Problem 2 candidate sketches ---------------------------------- */

/* E, the trap: it rises on (−4, −1), falls on (−1, 2) and rises on (2, 5), so its
   turning points are right, but it bends down up to −1 and up from −1 on, which
   puts the inflection point at x = −1 and leaves none at x = 2. The corner at
   x = −1 is what a sketch has to do once the second row is read as up, because a
   slope line that is still falling cannot turn positive and then cross zero. */
const p2E = makeSketch(
    [[-4.4, 0.62], [-2.5, 0.3], [-1, 0], [-0.998, -0.5], [2, 0], [5.6, 0.9]],
    { lift: 1.8 }
);

/* F, the one plausible sketch: the slope line falls the whole way from x = −4 to
   x = 2, crossing zero at −1, then rises after x = 2, crossing zero there. So the
   bend is down on both sides of x = −1 and only turns up at x = 2. */
const p2F = makeSketch(
    [[-4.4, 0.55], [-2.5, 0.26], [-1, 0], [2, -0.5], [2.002, 0], [3.6, 0.4], [5.6, 0.9]],
    { lift: 1.8 }
);

/* G, the flipped rule: a + sign read as falling and a − sign as rising, so this
   sketch has a local minimum at x = −1 and a local maximum at x = 2. */
const p2G = makeSketch(
    [[-4.4, -0.6], [-2.5, -0.28], [-1, 0], [0.5, 0.34], [2, 0], [5.6, -0.9]],
    { lift: 1.8 }
);

/* H, the missed turning point: it keeps rising through x = −1 on a flat stretch,
   so x = −1 is a shelf and not a turning point, its only turning point is a local
   maximum at x = 2, and its bend never changes. */
const p2H = makeSketch(
    [[-4.4, 0.55], [-2.5, 0.26], [-1.5, 0.18], [-1, 0.18], [2, 0], [5.6, -0.6]],
    { lift: 1.8 }
);

/* The closing sketch of each problem is the accepted candidate. */
const p1Final = p1B;
const p2Final = p2F;

/* ---------- candidate boards ---------------------------------------------- */

const P1_TURNS = [{ x: -2, label: 'x = −2' }, { x: 1, label: 'x = 1' }];
const P2_TURNS = [{ x: -1, label: 'x = −1' }, { x: 2, label: 'x = 2' }];

/* One candidate per entry. The board order is fixed and the accepted sketch is
   not first, so the answer cannot be read off the position. `anchor` is the open
   dot at the fixed point (0, 1), drawn in every Problem 1 candidate so a sketch
   that misses it shows the miss. `cross` marks, in Candidate D only, the height
   its curve really has at x = 0, so the copy can name a number that is on screen. */
const P1_CANDS = [
    { key: 'A', fn: p1A, turns: P1_TURNS, anchor: true,
      verdict: 'Direction and bend both reversed.' },
    { key: 'B', fn: p1B, turns: P1_TURNS, anchor: true,
      verdict: 'All five statements and the fixed point hold.' },
    { key: 'C', fn: p1C, turns: P1_TURNS, anchor: true,
      verdict: 'Bend changes at x = −1, not at x = 0.' },
    { key: 'D', fn: p1D, turns: P1_TURNS, anchor: true, cross: P1_D_CROSS,
      verdict: 'Misses the fixed point (0, 1).' }
];

const P2_CANDS = [
    { key: 'E', fn: p2E, turns: P2_TURNS, anchor: false,
      verdict: 'Bend change placed at x = −1.' },
    { key: 'F', fn: p2F, turns: P2_TURNS, anchor: false,
      verdict: 'All three rows of the table hold.' },
    { key: 'G', fn: p2G, turns: P2_TURNS, anchor: false,
      verdict: 'Reads + as falling and − as rising.' },
    { key: 'H', fn: p2H, turns: P2_TURNS, anchor: false,
      verdict: 'Rises through x = −1, so no turning point there.' }
];

/* One candidate panel: the sketch, the two boundary guides, and for Problem 1 the
   open dot at the fixed point. Before the answer the panel carries no comment
   line, and the accepted candidate is drawn in the house green. */
function candPanel(c, win, tone) {
    const points = [];
    if (c.anchor) points.push({
        x: 0, y: 1, r: 5.5, open: true, color: 'accent',
        label: P1_ANCHOR, labelDx: 9, labelDy: -9
    });
    if (c.cross !== undefined) points.push({
        x: 0, y: c.cross, r: 4.5, color: 'aux',
        label: '(0, ' + dsp(c.cross) + ')', labelDx: 9, labelDy: 16
    });
    return {
        title: 'Candidate ' + c.key,
        tone: tone,
        lines: tone ? [c.verdict] : [],
        graph: {
            ticks: false,
            gridX: 1,
            gridY: 1,
            width: 330,
            height: 200,
            window: win,
            curves: [{ fn: c.fn, color: tone === 'right' ? 'up' : 'curveA', width: 2.4 }],
            vlines: c.turns.map(t => ({ x: t.x, color: 'auxInk', label: t.label })),
            points: points
        }
    };
}

/* The closing sketch of a problem, drawn once, with its turning x-values and the
   fixed point marked. */
function finalGraph(fn, win, marks, anchor) {
    return {
        kind: 'graph',
        ticks: false,
        gridX: 1,
        gridY: 1,
        width: 560,
        height: 260,
        window: win,
        curves: [{ fn: fn, color: 'curveA', width: 3 }],
        vlines: marks.map(m => ({ x: m.x, color: m.color || 'auxInk', label: m.label })),
        points: anchor ? [{
            x: 0, y: 1, r: 6, open: true, color: 'accent',
            label: P1_ANCHOR, labelDx: 10, labelDy: -10
        }] : []
    };
}

/* ---------- the mode ------------------------------------------------------- */

export const sketchChallengeMode = {
    label: 'Mixed sketch challenge',
    intro: 'Two challenges, no teaching and no formulas. Problem 1 hands over five sentences about f and one fixed point. Problem 2 hands over one sign table with the sign of f′ and the sign of f″. You do the translation, then you pick the sketch that fits. Nothing locks Next, so you can walk the whole mode without choosing, and each panel leaves the screen once its question is answered.',
    params: { stage: 0 },
    controls: [],
    fns: {},
    compute: (env) => ({
        p1clues: env.stage <= 1,
        p1map: env.stage === 1,
        p1concl: env.stage === 1 || env.stage === 2,
        p1cands: env.stage === 1 || env.stage === 2,
        p1ask: env.stage === 1,
        p1marked: env.stage === 2,
        p1final: env.stage === 2,
        p2table: env.stage === 3 || env.stage === 4,
        p2say: env.stage === 4,
        p2cands: env.stage === 4 || env.stage === 5,
        p2ask: env.stage === 4,
        p2marked: env.stage === 5,
        p2final: env.stage === 5 || env.stage === 6,
        p2class: env.stage === 6,
        closed: env.stage >= 7
    }),
    panes: {
        main: [
            {
                kind: 'table', title: 'Problem 1, the information you get',
                when: (env) => env.p1clues,
                cols: ['About', 'What the statement says', 'Interval'],
                rows: () => P1_ROWS.map(r => [
                    cell(r.about),
                    cell(r.says, { color: r.tone, bold: r.about === 'fixed point' }),
                    cell(r.iv, { color: r.tone, bold: r.about === 'fixed point' })
                ]),
                note: 'Five sentences about what f does, and one sentence that fixes a single point. No formula appears anywhere in this mode.'
            },
            {
                kind: 'numberline', title: 'Problem 1, where f rises and falls',
                when: (env) => env.p1map,
                window: MAP_WIN,
                bands: () => P1_DIR_BANDS,
                probes: () => P1_DIR_PROBES
            },
            {
                kind: 'numberline', title: 'Problem 1, how f bends',
                when: (env) => env.p1map,
                window: MAP_WIN,
                bands: () => P1_BEND_BANDS,
                probes: () => P1_BEND_PROBES
            },
            {
                kind: 'compare', title: 'Problem 1, four candidate sketches',
                when: (env) => env.p1cands,
                sides: (env) => P1_CANDS.map(c => candPanel(c, P1_WIN, env.p1marked ? (c.key === 'B' ? 'right' : 'wrong') : '')),
                verdict: (env) => env.p1marked
                    ? 'Candidate B is the only sketch that obeys every statement.'
                    : 'Judge only the direction, the bend and the open dot at (0, 1).'
            },
            {
                kind: 'practice', id: 'u58-m3-p1sketch', title: 'Problem 1, pick your sketch',
                when: (env) => env.p1ask,
                items: [
                    {
                        q: 'Which candidate sketch is consistent with all five statements and the fixed point?',
                        choices: [
                            'Candidate A. It turns around at x = −2 and again at x = 1, which are the two x-values the statements name.',
                            'Candidate B. It rises on (−∞, −2), falls on (−2, 1) and rises on (1, ∞), it bends down left of x = 0 and up right of x = 0, and it runs through the open dot.',
                            'Candidate C. Its direction matches the three direction statements, and it changes its bend once, which is all the bend statements ask for.',
                            'Candidate D. It turns around at x = −2 and at x = 1 and it bends down then up at x = 0, so the five statements are all present.'
                        ], a: 1,
                        whyBy: [
                            'Not this one. Candidate A falls until x = −2 and rises until x = 1, which turns the first two statements upside down, and its bend is flipped along with them. It does run through the open dot, so the dot alone will not clear it.',
                            'Candidate B rises, then falls, then rises with the turns at x = −2 and x = 1, bends down left of x = 0 and up right of x = 0, and passes through the marked point (0, 1). Every statement holds at once.',
                            'Not this one. Candidate C does change its bend exactly once, but the change happens at x = −1, so at x = 0 it is already bending up while the statements say concave down there.',
                            'Not this one. Candidate D matches the direction and the bend, and it still fails the fixed point: it runs through (0, −1.2) instead of the marked point (0, 1).'
                        ]
                    }
                ]
            },
            {
                kind: 'graph', title: 'Problem 1, one valid sketch',
                when: (env) => env.p1final,
                ...finalGraph(p1Final, P1_WIN, [
                    { x: -2, label: 'x = −2' },
                    { x: 0, label: 'x = 0', color: 'ink' },
                    { x: 1, label: 'x = 1' }
                ], true)
            },
            {
                kind: 'table', title: 'Problem 2, the sign table',
                when: (env) => env.p2table,
                cols: (env) => env.p2say
                    ? ['Interval', 'Sign of f′', 'Sign of f″', 'What the row says about f']
                    : ['Interval', 'Sign of f′', 'Sign of f″'],
                rows: (env) => P2_ROWS.map(r => {
                    const row = [
                        cell(r.iv),
                        cell(r.fp, { color: r.fp === '+' ? 'up' : 'down', bold: true }),
                        cell(r.fpp, { color: r.fpp === '+' ? 'up' : 'down', bold: true })
                    ];
                    if (env.p2say) row.push(cell(r.say, { bold: true }));
                    return row;
                }),
                note: 'This table is the whole problem. It gives one sign of f′ and one sign of f″ for each interval, and nothing else.'
            },
            {
                kind: 'compare', title: 'Problem 2, four candidate sketches',
                when: (env) => env.p2cands,
                sides: (env) => P2_CANDS.map(c => candPanel(c, P2_WIN, env.p2marked ? (c.key === 'F' ? 'right' : 'wrong') : '')),
                verdict: (env) => env.p2marked
                    ? 'Candidate F is the plausible sketch for all three rows.'
                    : 'Judge only where each sketch rises, falls, bends down and bends up.'
            },
            {
                kind: 'practice', id: 'u58-m3-p2sketch', title: 'Problem 2, pick your sketch',
                when: (env) => env.p2ask,
                items: [
                    {
                        q: 'Which candidate sketch is a plausible graph of f for the whole table?',
                        choices: [
                            'Candidate E. Its three pieces rise, fall and rise, so its turning points land at x = −1 and at x = 2.',
                            'Candidate F. It rises on (−4, −1), falls on (−1, 2) and rises on (2, 5), and it keeps bending down through x = −1 and only bends up after x = 2.',
                            'Candidate G. The signs change at −1 and at 2, so the sketch has to turn around at both of them.',
                            'Candidate H. It rises all the way to x = 2 and then falls, so its turning point sits where the third row begins.'
                        ], a: 1,
                        whyBy: [
                            'Close, and this is the trap. Candidate E does rise, fall and rise with turning points at −1 and 2, but it stops bending down at x = −1 and bends up from there, which reads the second row as concave up and invents an inflection point at −1 that the table does not have.',
                            'Candidate F is the plausible sketch: rising with the bend down on (−4, −1), falling with the bend down on (−1, 2), rising with the bend up on (2, 5). Its turning points are a local maximum at x = −1 and a local minimum at x = 2, and its only bend change is at x = 2.',
                            'Not this one. Candidate G falls on the rows whose sign of f′ is + and rises on the row whose sign of f′ is −, which reads the direction column backwards.',
                            'Not this one. Candidate H keeps rising through x = −1 on a flat stretch, so x = −1 is not a turning point at all and the second row of the table is not honored.'
                        ]
                    }
                ]
            },
            {
                kind: 'graph', title: 'Problem 2, one plausible sketch',
                when: (env) => env.p2final,
                ...finalGraph(p2Final, P2_WIN, [
                    { x: -1, label: 'x = −1' },
                    { x: 2, label: 'x = 2', color: 'ink' }
                ], false)
            }
        ],
        side: [
            {
                kind: 'note', title: 'How to work in this mode',
                when: (env) => !env.closed,
                text: 'Nothing here teaches a rule, and no formula appears anywhere. Translate the information into what f does, then test each sketch against your own translation, one piece at a time. Choosing is never required to move on, so answer if you want the check and press Next if you only want to read.'
            },
            {
                kind: 'readout', title: 'Problem 1, what the clues force',
                when: (env) => env.p1concl,
                items: [
                    { label: 'local maximum at', v: () => P1_MAX, color: 'accent' },
                    { label: 'local minimum at', v: () => P1_MIN, color: 'aux' },
                    { label: 'inflection point', v: () => 'at ' + P1_INFL },
                    { label: 'fixed point', v: () => P1_ANCHOR, color: 'accent' }
                ]
            },
            {
                kind: 'note', title: 'What the clues do not fix',
                when: (env) => env.p1cands,
                text: 'The statements fix where f turns around and where it changes its bend, and they fix exactly one point, (0, 1). They do not fix how high the local maximum at x = −2 is or how low the local minimum at x = 1 is, so the four candidates are drawn at different heights on purpose. Do not judge a candidate on the height of its peak or its valley, only on direction, on bend, and on whether it runs through the open dot.'
            },
            {
                kind: 'note', title: 'One valid sketch, not the only one',
                when: (env) => env.p1final,
                text: 'This is the accepted reading of the clues, drawn once. Sliding the peak at x = −2 higher or the valley at x = 1 lower, as long as the turns stay at those x-values and the curve still passes through (0, 1), gives another valid sketch of the same five statements.'
            },
            {
                kind: 'note', title: 'This table fixes no height',
                when: (env) => env.p2cands,
                text: 'The table names signs only, so no point of f is fixed here, not even the height of the local maximum at x = −1 or the local minimum at x = 2. Judge the candidates on which intervals they rise and fall, on which intervals they bend down and bend up, and on where their turning points sit.'
            },
            {
                kind: 'eq', title: 'Problem 2, how the two x-values classify',
                when: (env) => env.p2class,
                lines: [
                    { t: 'At x = −1 the sign of f′ goes from + to −, so f has a local maximum there.', hl: true, color: 'accent' },
                    { t: 'At x = −1 the sign of f″ is − on both sides, so the bend does not change and x = −1 is not an inflection point.', color: 'down' },
                    { t: 'At x = 2 the sign of f′ goes from − to +, so f has a local minimum there.', color: 'aux' },
                    { t: 'At x = 2 the sign of f″ goes from − to +, so x = 2 is the inflection point as well.', hl: true },
                    { t: 'So this f has one inflection point, at x = 2, and the turning point at x = −1 is not one.' }
                ]
            },
            {
                kind: 'note', title: 'Both problems are done',
                when: (env) => env.closed,
                text: 'Every panel that carried the clues, the maps, the candidate boards and the results has left the screen. What is worth keeping is the order of work: turn the words or the signs into a list of behaviors, hold that list against each sketch one piece at a time, and at every x-value ask separately whether the direction changed, whether the bend changed, or both.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'Read only the Problem 1 statements. What do they force at x = −2, at x = 1 and at x = 0?',
                choices: [
                    'A local minimum at x = −2, a local maximum at x = 1, and an inflection point at x = 0. The decreasing statement starts at x = −2.',
                    'A local maximum at x = −2, a local minimum at x = 1, and an inflection point at x = 0. f changes from increasing to decreasing at x = −2, from decreasing to increasing at x = 1, and from concave down to concave up at x = 0.',
                    'A local maximum at x = −2 and a local minimum at x = 1, and the inflection point is at x = 1. The bend changes where the direction changes.'
                ], a: 1,
                whyBy: [
                    'The order of the statements decides this one the other way. f is increasing right up to x = −2 and decreasing just after it, so x = −2 is a local maximum, and the change from decreasing to increasing at x = 1 makes the local minimum there.',
                    'A change from increasing to decreasing makes a local maximum, a change from decreasing to increasing makes a local minimum, and a change of bend makes an inflection point. The statements put all three at x = −2, x = 1 and x = 0.',
                    'Both bend statements name x = 0, so the inflection point is x = 0. On both sides of x = 1 f is concave up, so nothing changes there, and a turning point is only an inflection point when the bend changes with it.'
                ]
            },
            message: 'Problem 1 now shows two maps of the same clues. The rising and falling map puts increasing, decreasing and increasing on the three intervals, so the turns land at x = −2 and at x = 1. The bend map puts concave down and concave up on either side of x = 0. The open dot at (0, 1) is the only fixed point. The four candidate sketches sit below the maps, and the question under them asks which one obeys all of it.'
        },
        {
            params: { stage: 2 },
            message: 'The Problem 1 board has marked itself, and the pick panel is gone. Candidate B is the sketch that obeys every statement. Candidate A reverses the direction and the bend with it, Candidate C moves the bend change to x = −1, and Candidate D matches the behavior but misses the open dot at (0, 1). The closing picture is one valid sketch of these clues rather than the only one, because the clues never say how high the peak at x = −2 sits or how low the valley at x = 1 sits.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Look back at the four marked Problem 1 sketches. Which one gets the direction right, gets the bend right, and still cannot be the answer?',
                choices: [
                    'Candidate A. Its turning points sit at the two x-values named in the statements.',
                    'Candidate B. Its bend changes at x = 0, which is where the two bend statements meet.',
                    'Candidate C. Its bend changes once, and the statements ask for one change of bend.',
                    'Candidate D. It rises, falls and rises in the right intervals and bends down then up at x = 0, but it runs through (0, −1.2) instead of the marked point.'
                ], a: 3,
                whyBy: [
                    'Candidate A fails much earlier than its height. It falls until x = −2 and rises until x = 1, so the first two statements are reversed, and its bend is flipped as well.',
                    'Candidate B is the accepted sketch. Its bend change at x = 0 is exactly what the two bend statements ask for, so nothing about it fails.',
                    'Candidate C does change its bend once, and that is the problem: the change happens at x = −1, so it is already concave up at x = 0 where the statements say concave down.',
                    'Candidate D is the height failure. Direction and bend both hold, and the only statement it breaks is the fixed point, because it passes through (0, −1.2) and not through (0, 1). This is also the one clue about heights the statements do fix.'
                ]
            },
            message: 'Problem 1 has left the screen with all of its panels. Problem 2 is one table: the intervals (−4, −1), (−1, 2) and (2, 5), with the sign of f′ in one column and the sign of f″ in the other. Say each row in words before any sketch appears.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Translate the three rows into words about f. What does f do on (−4, −1), on (−1, 2) and on (2, 5)?',
                choices: [
                    'Rising and concave up on (−4, −1), falling and concave up on (−1, 2), rising and concave down on (2, 5).',
                    'Rising and concave down on (−4, −1), falling and concave down on (−1, 2), rising and concave up on (2, 5).',
                    'Rising and concave down on (−4, −1), falling and concave up on (−1, 2), rising and concave up on (2, 5).'
                ], a: 1,
                whyBy: [
                    'Both sign columns are read backwards here. The sign of f′ gives the direction, so a + row is rising, and the sign of f″ gives the bend, so a − row is concave down.',
                    'The sign of f′ gives direction and the sign of f″ gives bend. Row by row that is rising with the bend down, falling with the bend down, and rising with the bend up. The bend stays down across x = −1, so nothing changes there.',
                    'This reading puts a bend change at x = −1, and it is the trap in this problem. The sign of f″ is − on the first row and − on the second row, so the bend does not change at x = −1, and the only change is at x = 2.'
                ]
            },
            message: 'The table has gained its fourth column, rising and concave down, falling and concave down, rising and concave up. Four candidate sketches sit below it, and the pick panel asks which one is plausible. The guides mark x = −1 and x = 2 in every candidate, and no height at all is fixed by this table.'
        },
        {
            params: { stage: 5 },
            message: 'The Problem 2 board has marked itself and its pick panel is gone, and the sign table has retired along with it. Candidate F is the plausible sketch: rising and concave down, then falling and concave down, then rising and concave up. Candidate E is the trap, because it puts the bend change at x = −1, Candidate G reads the direction column backwards, and Candidate H never turns around at x = −1. The closing sketch is drawn below the board.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Classify x = −1 and x = 2 from the two sign columns. Is either of them an inflection point?',
                choices: [
                    'x = −1 is a local maximum and x = 2 is a local minimum, and neither is an inflection point.',
                    'x = −1 is a local minimum and x = 2 is a local maximum, and the inflection point is x = −1.',
                    'x = −1 is a local maximum and not an inflection point, because the sign of f″ is − on both sides of it, and x = 2 is a local minimum and the inflection point, because the sign of f″ goes from − to + there.'
                ], a: 2,
                whyBy: [
                    'The first half is right and the second half is not. At x = 2 the sign of f″ changes from − to +, so x = 2 does carry the inflection point, at the same time as it carries the local minimum.',
                    'Both turning points are placed the wrong way. The sign of f′ goes from + to − at x = −1, which makes a local maximum, and from − to + at x = 2, which makes a local minimum. And the bend change is at x = 2, not at x = −1.',
                    'Both columns get read at both x-values. At x = −1 the sign of f′ changes while the sign of f″ does not, so it is a local maximum and not an inflection point. At x = 2 both signs change, so it is a local minimum and the inflection point at the same time.'
                ]
            },
            message: 'The Problem 2 candidate board has left the screen and the classification card is open. At x = −1 the sign of f′ changes and the sign of f″ does not, so x = −1 is a local maximum and not an inflection point. At x = 2 both signs change, so x = 2 is a local minimum and the only inflection point of this f.'
        },
        {
            params: { stage: 7 },
            message: 'The classification card and the closing sketch have left too, so the screen is clear and only the closing note stays. The skill in both problems was the same translation, in words for Problem 1 and from signs for Problem 2, and the discriminating detail was the turning point at x = −1, which bends the same way on both sides and therefore is not an inflection point.'
        },
        {
            params: { stage: 7 },
            message: 'Both challenges are finished. Problem 1 read: a local maximum at x = −2, a local minimum at x = 1, an inflection point at x = 0, and one fixed point at (0, 1) while the two turning heights stayed free. Problem 2 read: rising and concave down, falling and concave down, rising and concave up, with a local maximum at x = −1 that is not an inflection point and a local minimum at x = 2 that is the inflection point.'
        }
    ],
    summary: {
        idea: 'Both problems asked for one move in two languages. The five sentences of Problem 1 say where f rises and falls and where it bends, and those clues force a local maximum at x = −2, a local minimum at x = 1 and an inflection point at x = 0, with (0, 1) as the only fixed point. The three rows of Problem 2 say the same thing in signs, and read row by row they give rising and concave down, then falling and concave down, then rising and concave up.',
        mistake: 'The trap in Problem 2 was x = −1. It is a turning point, and the sign of f″ is − on both sides of it, so it is not an inflection point, while x = 2 carries the local minimum and the only inflection point together. The other slip is judging a sketch on heights, and the clues fix only one height in Problem 1 and none in Problem 2, so the peaks and valleys of the candidates were drawn free on purpose.',
        transfer: 'Take any verbal description or sign table and write three lines before you look at a sketch: where f rises and falls, where it bends down and up, and which points are fixed. Then check each sketch against those lines one at a time, and at every x-value where a sign changes ask separately whether the direction changed, whether the bend changed, or both.'
    }
};

export default sketchChallengeMode;
