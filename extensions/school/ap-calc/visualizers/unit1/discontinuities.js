/* 1.10 Discontinuity Gallery - the FAILURE SHAPE names the type:
   removable (sides agree), jump (sides split), infinite (unbounded).
   Each break case carries ONE "change one thing" knob: move the stored dot,
   shift one branch, or alter the denominator factor. The status board and
   the story are computed live from those knobs, never hardcoded. */

const EPS = 0.001;

const TYPES = {
    removable: { label: 'removable hole', window: [0, 4.4, -1, 7], c: 2, aim: 4 },
    jump: { label: 'jump', window: [0, 4.4, -1, 7], c: 2, right: 4 },
    infinite: { label: 'vertical asymptote', window: [-1, 5, -6, 6], c: 2, vline: true },
    mystery: { label: 'unknown type', reveal: 'jump', window: [-3, 3, -3, 3], c: 0, dot: 1, holeL: -1, holeR: 1 }
};

/* The name shown on the graph and the board. revealType is a separate switch
   from kase, so a step can load a graph with the type hidden, ask the student
   to classify it, and only then print the name. An unrevealed case reads
   'unknown type', the same neutral label the mystery case has always used. */
function revealLabel(k) { return TYPES[k].reveal || TYPES[k].label; }
function shownLabel(env) { return env.revealType ? revealLabel(env.kase) : 'unknown type'; }
function repairedWord(k) { return k === 'jump' ? 'jump repaired' : 'hole filled'; }

function titleFor(env) {
    const x = TYPES[env.kase].c;
    if (boardOf(env).cont) return 'Continuous at x = ' + x + ', ' + repairedWord(env.kase);
    return shownLabel(env) + ' at x = ' + x;
}

function curvesFor(k, env) {
    if (k === 'removable') return [
        { fn: 'x + 2', from: 0, to: 4.4, color: 'curveA' }
    ];
    if (k === 'jump') {
        const s = env.shift;
        return [
            { fn: () => 1.5 + s, from: 0, to: 1.999, color: 'curveA', label: 'left' },
            { fn: '0.5x + 3', from: 2.001, to: 4.4, color: 'curveA', label: 'right' }
        ];
    }
    if (k === 'infinite') return [
        { fn: '1/((x-2)^pw)', from: -1, to: 1.93, samples: 400, color: 'curveA' },
        { fn: '1/((x-2)^pw)', from: 2.07, to: 5, samples: 400, color: 'curveA' }
    ];
    return [
        { fn: 'x + 1', from: 0.05, to: 3, color: 'curveA' },
        { fn: '-1', from: -3, to: -0.05, color: 'curveA' }
    ];
}

function pointsFor(k, env) {
    const t = TYPES[k];
    const out = [];
    if (k === 'removable') {
        out.push({ x: t.c, y: t.aim, open: true, color: 'auxInk', label: 'limit' });
        out.push({ x: t.c, y: env.kdot, color: 'ink', label: 'f(c)', drag: { key: 'kdot', min: -0.5, max: 6.5, snap: 0.1 } });
    } else if (k === 'jump') {
        out.push({ x: t.c, y: 1.5 + env.shift, open: true, color: 'up', label: 'from left' });
        out.push({ x: t.c, y: t.right, open: true, color: 'down' });
        out.push({ x: t.c, y: t.right, color: 'ink', label: 'f(c)' });
    } else if (k === 'mystery') {
        out.push({ x: t.c, y: t.holeL, open: true, color: 'up' });
        out.push({ x: t.c, y: t.holeR, open: true, color: 'down' });
        out.push({ x: t.c, y: t.dot, color: 'ink', label: 'f(c)' });
    }
    return out;
}

/* One source of truth for the board AND the story: both read these live
   facts, so no parameter move can leave the text contradicting the graph. */
function boardOf(env) {
    const k = env.kase;
    if (k === 'removable') {
        return { L: '4', R: '4', two: true, defined: true, cont: Math.abs(env.kdot - 4) < EPS };
    }
    if (k === 'jump') {
        const L = 1.5 + env.shift;
        const two = Math.abs(L - 4) < EPS;
        return { L: round1(L), R: '4', two, defined: true, cont: two };
    }
    if (k === 'infinite') {
        const odd = Math.round(env.pw) % 2 === 1;
        return { L: odd ? '−∞' : '+∞', R: '+∞', two: false, defined: false, cont: false };
    }
    return { L: '−1', R: '1', two: false, defined: true, cont: false };
}

function storyOf(env) {
    const b = boardOf(env);
    if (env.kase === 'removable') {
        return b.cont
            ? 'Both branches approach 4, and the dot for f(c) now sits exactly at that height. Changing one value removed the break, so this type is called removable.'
            : 'Both branches approach 4, but the dot for f(c) sits at ' + round1(env.kdot) + '. Only the value of f(c) is wrong here. Move the dot and watch which rows on the status board change.';
    }
    if (env.kase === 'jump') {
        if (b.cont) {
            return 'The left branch now meets the right branch at the same height 4, so both sides settle at 4 and the break at x = 2 is gone. Moving a whole branch can merge two heights, while moving one dot never can.';
        }
        return 'The left side settles at ' + round1(1.5 + env.shift) + ' and the right side settles at 4. No change of one value can merge two different heights. Slide the left branch until both sides settle at the same height.';
    }
    if (env.kase === 'infinite') {
        const p = Math.round(env.pw);
        return p % 2 === 1
            ? 'For 1/(x−2)^' + p + ' the factor (x − 2) changes sign at 2, so the left side grows toward −∞ and the right side grows toward +∞. An odd power keeps that sign change, and neither side settles on a finite number.'
            : 'For 1/(x−2)^' + p + ' the even power erases the sign of (x − 2), so both sides grow toward +∞. The vertical asymptote stays in the same place, and only the direction of growth changes. Topic 1.14 writes that shared growth as +∞, and it is still not a finite number.';
    }
    return 'The left side settles at −1, and the right side starts at 1 and climbs from there. The two sides settle at different finite heights, which is the jump shape.';
}

export default {
    id: 'u1-discontinuities',
    meta: { unit: 1, topic: '1.10', title: 'Exploring Types of Discontinuities', visualizerTitle: 'Discontinuity Gallery' },
    intro: 'A graph can break at a point in three ways. What names the type is how the behavior near the point fails. Each case gives you one control, so change one thing and read the status board.',
    params: { kase: 'removable', kdot: 5, shift: 0, pw: 1, revealType: true },
    controls: [
        {
            key: 'kase', label: 'case', kind: 'choice',
            /* The selector lists the real type names, so it is hidden while a
               classification question is open (revealType false). This reuses the
               same env-driven `when` gate the sliders use, so no name leaks. */
            when: env => env.revealType !== false,
            options: Object.keys(TYPES).map(k => ({ v: k, label: TYPES[k].label }))
        },
        { key: 'kdot', label: 'the dot f(c)', min: -0.5, max: 6.5, step: 0.1, when: env => env.kase === 'removable' },
        { key: 'shift', label: 'left branch shift', min: -2, max: 5, step: 0.1, when: env => env.kase === 'jump' },
        { key: 'pw', label: 'power p in (x − 2)^p', min: 1, max: 3, step: 1, when: env => env.kase === 'infinite' }
    ],
    panes: {
        main: [
            {
                kind: 'graph', title: titleFor, height: 340,
                window: env => TYPES[env.kase].window,
                curves: env => curvesFor(env.kase, env),
                vlines: env => TYPES[env.kase].vline ? [{ x: TYPES[env.kase].c, color: 'aux', label: 'asymptote' }] : [{ x: TYPES[env.kase].c, color: 'auxInk', dash: false }],
                points: env => pointsFor(env.kase, env)
            },
            { kind: 'note', title: 'What this case shows', text: env => storyOf(env) }
        ],
        side: [
            {
                kind: 'checklist', title: 'Status board',
                /* Every row that prints a limit says whether that value is a number,
                   so the infinite case cannot be read as a limit that exists. */
                items: env => {
                    const facts = boardOf(env);
                    return [
                        { t: 'lim x→c⁻ f = ' + facts.L + finiteTail(facts.L), state: facts.L !== 'none' },
                        { t: 'lim x→c⁺ f = ' + facts.R + finiteTail(facts.R), state: facts.R !== 'none' },
                        { t: 'A finite two-sided limit exists', state: facts.two },
                        { t: 'The value f(c) exists', state: facts.defined },
                        { t: 'The finite two-sided limit equals f(c), so f is continuous at c', state: facts.cont }
                    ];
                },
                verdict: env => {
                    const b = boardOf(env);
                    if (b.cont) return 'Now continuous at c: the finite limit equals f(c).';
                    if (!env.revealType) return 'Not continuous at c. Name the type of break from the rows above.';
                    return cap(revealLabel(env.kase)) + ' break. Not continuous at c.';
                },
                verdictOk: env => boardOf(env).cont ? 1 : 0
            }
        ]
    },
    steps: [
        {
            params: { kase: 'removable', kdot: 5, revealType: true },
            message: 'Start with the easiest break to read: a misplaced dot for f(c). The curve itself is intact, and only the value of f(c) is wrong. The slider and the draggable dot each change exactly one thing.'
        },
        {
            params: { kase: 'jump', shift: 0, revealType: true },
            message: 'Now the curve itself splits into two different heights. The single control here shifts the whole left branch. Notice which row of the status board changes first.'
        },
        {
            params: { kase: 'infinite', pw: 1, revealType: false },
            message: 'A break sits at x = 2. The type name is hidden here, and the case selector is out of the way. Read the shape of the graph and the status board before you name it.'
        },
        {
            predict: {
                q: 'What type of break sits at x = 2 here, and what evidence names that type?',
                choices: [
                    'Infinite discontinuity. Both branches grow without bound, so neither one-sided limit is finite.',
                    'Jump discontinuity. The left branch and the right branch do not meet at x = 2.',
                    'Removable discontinuity. The two branches aim at one height, and only the dot is wrong.'
                ], a: 0,
                why: 'Naming the type means describing the shape of the failure. Here the outputs leave every bounded window, so the behavior is asymptotic, and no finite two-sided limit exists. Topic 1.14 records that same failure as an infinite limit, which names growth rather than a number. This is the infinite type the course requires.'
            },
            message: 'You have committed an answer. The two one-sided rows on the status board hold the evidence. The next step names this type of break.'
        },
        {
            params: { revealType: true },
            message: env => {
                const p = Math.round(env.pw);
                const lead = 'This is a vertical asymptote, the infinite type. ';
                return p % 2 === 1
                    ? lead + 'For 1/(x−2)^' + p + ' the left side grows toward −∞ and the right side grows toward +∞. Neither one-sided limit is a finite number.'
                    : lead + 'For 1/(x−2)^' + p + ' the even power erases the sign, so both sides grow toward +∞. The two sides agree on infinity, so no finite two-sided limit exists.';
            }
        },
        {
            params: { kase: 'mystery', revealType: false },
            message: 'A different break sits at x = 0. The type name is hidden again. Read the status board first, then name the type from the evidence.'
        },
        {
            predict: {
                q: 'Which type of break sits at x = 0, and what evidence names that type?',
                choices: [
                    'Jump. The two sides settle at the different finite heights −1 and 1.',
                    'Removable. The dot at (0, 1) is misplaced, and the two sides aim at one height.',
                    'Infinite. The right branch is a line that grows without bound, so it has an asymptote.'
                ], a: 0,
                why: 'The filled dot sits on the right branch, so the dot is not the problem. The break is the split between two finite heights, which is a jump. A line that grows without bound far away does not create an asymptote at x = 0.'
            },
            message: 'You have committed an answer. The next step reveals the type name for this graph.'
        },
        {
            params: { revealType: true },
            message: 'This is a jump. The left side settles at −1 and the right side settles at 1, so the two sides land on different finite heights. Moving the single dot cannot merge them.'
        }
    ],
    summary: {
        idea: 'A removable break has two equal finite one-sided limits, while f(c) is missing or unequal. A jump break has two different finite one-sided limits. An infinite break has unbounded sides, so it has no finite two-sided limit. The shape of the failure names the type.',
        mistake: 'Students often treat every discontinuity as a hole. Only the removable type can be fixed by moving one dot.',
        transfer: 'Sketch f(x) = (x² − x)/x near x = 0, where f(0) has no value. Which type of break sits at x = 0? What is the value of lim x→0 f(x)?'
    }
};

function round1(v) { return String(Math.round(v * 10) / 10); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
/* An infinity printed on the board is a description of growth, so the row says
   that out loud instead of letting a tick read as a finite limit. */
function finiteTail(v) { return String(v).includes('∞') ? ', which is not a finite number' : ''; }
