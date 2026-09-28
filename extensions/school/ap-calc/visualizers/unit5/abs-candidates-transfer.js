/* 5.5 Candidates Test, transfer mode: the last step with no curve in sight.

   This mode deliberately draws nothing. Problems 1 and 2 hand over a finished
   candidate table, so their questions ask only step 4 of the procedure, the
   comparison of the candidate values, and they teach that a value and the
   location holding it are two different objects. Problem 3 hands the raw table
   of x, f(x) and the derivative instead, and that table carries more rows than
   the Candidates Test needs, so the student decides which rows belong on the
   candidate list first and compares only after that. The four-step panel stays
   on screen the whole way through, because that is the procedure the student
   applies to a table instead of to a graph. The main column retires each problem's
   panes once its teaching is done, the Problem 1 panes at stage 4 and the Problem 2
   panes at stage 7, so a screen carries only the problem it is teaching while
   Problem 3 runs to the end. The side column already windows its cards the same way.

   Each table runs through one stage-gated builder, so the columns on screen grow
   in place instead of being rebuilt. The comparison column and the candidate
   list column are gated on a monotone stage counter and grow
   only after the practice screen for that problem has been on screen, so no
   pre-question screen contains its answer, and Next without answering still
   walks the mode. Every number printed in this mode is an exact integer, so the
   equals sign is the correct one and nothing here is written as an approximation.
   Every numeric cell is a function returning a formatted
   string: the table renderer feeds plain strings through its expression parser,
   which would turn '−3' back into the number -3 and print an ASCII hyphen. */

const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

/* one cell for the board. `v` is always a function so the renderer prints the
   string it is handed instead of re-parsing it as a math expression. */
const cell = (s, emph) => Object.assign({ v: () => s }, emph || {});

const PROB1 = {
    iv: '[−3, 5]',
    rows: [
        { x: -3, y: 4, why: 'left endpoint' },
        { x: -1, y: 9, why: 'interior critical point' },
        { x: 2, y: -2, why: 'interior critical point' },
        { x: 5, y: 6, why: 'right endpoint' }
    ],
    win: [1],
    lose: [2]
};

const PROB2 = {
    iv: '[−2, 2]',
    rows: [
        { x: -2, y: 5, why: 'left endpoint' },
        { x: 0, y: 1, why: 'interior critical point' },
        { x: 2, y: 5, why: 'right endpoint' }
    ],
    win: [0, 2],
    lose: [1]
};

/* the comparison column wording, and the row emphasis, both come from the
   index lists on the problem object, so a tie writes itself correctly */
function boardRows(p, revealed) {
    return p.rows.map((r, i) => {
        const row = [cell(dsp(r.x)), cell(r.why), cell(dsp(r.y))];
        if (revealed) {
            const isWin = p.win.indexOf(i) >= 0;
            const isLose = p.lose.indexOf(i) >= 0;
            row.push(cell(
                isWin ? 'absolute maximum value' : isLose ? 'absolute minimum value' : 'not an absolute extremum',
                { color: isWin ? 'accent' : isLose ? 'aux' : 'auxInk', bold: isWin || isLose }
            ));
        }
        return row;
    });
}

const boardCols = (revealed) => revealed
    ? ['Candidate x', 'Why it is a candidate', 'f(x)', 'How it compares']
    : ['Candidate x', 'Why it is a candidate', 'f(x)'];

/* Problem 3 hands the raw table instead of a finished list. Five rows are
   printed for the closed interval [−3, 5], and the Candidates Test needs four
   of them. The row for x = 0 is the extra one: f′(0) = 2 is neither zero nor
   undefined, and x = 0 is not an endpoint, so that row never reaches the
   comparison. `keep` marks a candidate row, `top` and `low` mark the rows the
   comparison ends up naming. */
const RAW3 = {
    iv: '[−3, 5]',
    rows: [
        { x: -3, y: 4, d: 'endpoint', on: 'Yes, left endpoint',
          cmp: 'not an absolute extremum', keep: true },
        { x: -1, y: 9, d: '0', on: 'Yes, critical point, f′ = 0',
          cmp: 'absolute maximum value', keep: true, top: true },
        { x: 0, y: 3, d: '2', on: 'No, f′(0) = 2',
          cmp: 'row not compared', keep: false },
        { x: 2, y: -2, d: 'DNE', on: 'Yes, critical point, f′ does not exist',
          cmp: 'absolute minimum value', keep: true, low: true },
        { x: 5, y: 6, d: 'endpoint', on: 'Yes, right endpoint',
          cmp: 'not an absolute extremum', keep: true }
    ]
};

/* the raw table grows two columns in place, so the same five rows and the same
   x / f(x) / f′(x) columns stay on screen the whole time */
const rawCols = (env) => {
    const cols = ['x', 'f(x)', 'f′(x)'];
    if (env.ident3) cols.push('On the candidate list');
    if (env.cmp3) cols.push('How it compares');
    return cols;
};

const rawRows = (env) => RAW3.rows.map((r) => {
    const row = [cell(dsp(r.x)), cell(dsp(r.y)), cell(r.d)];
    if (env.ident3) {
        row.push(cell(r.on, { color: r.keep ? 'accent' : 'auxInk', bold: r.keep }));
    }
    if (env.cmp3) {
        row.push(cell(r.cmp, {
            color: r.top ? 'accent' : r.low ? 'aux' : 'auxInk',
            bold: !!(r.top || r.low)
        }));
    }
    return row;
});

export const transferMode = {
    label: 'Practice without a graph',
    intro: 'Nothing in this mode has a curve, and the three problems grow the way the procedure is practiced. The Problem 1 candidate table and the Problem 2 candidate table hand you a finished candidate list, so their questions ask only step 4, the comparison, and they keep a value apart from the location that carries it. The Problem 3 raw table hands you x, f(x) and f′(x) for more rows than the Candidates Test needs, so its first question asks you to decide which rows belong on the list before anything is compared. The Candidates Test in four steps panel stays on screen the whole way. Read a table, then answer the questions below it.',
    params: { stage: 0 },
    controls: [],
    fns: {},
    compute: (env) => ({
        cmp1: env.stage >= 3,
        cmp2: env.stage >= 6,
        raw3: env.stage >= 7,
        ask3list: env.stage >= 8,
        ident3: env.stage >= 9,
        ask3cmp: env.stage >= 10,
        cmp3: env.stage >= 11
    }),
    panes: {
        main: [
            {
                kind: 'table', title: 'Problem 1 candidate table',
                when: (env) => env.stage >= 1 && env.stage < 4,
                cols: (env) => boardCols(env.cmp1),
                rows: (env) => boardRows(PROB1, env.cmp1),
                note: 'Every row of the Problem 1 candidate table is one candidate on the closed interval ' + PROB1.iv + '. The interval is closed, so both endpoints are on the list, and these four rows are all the candidates there.'
            },
            {
                kind: 'practice', id: 'u55-transfer-p1', title: 'Problem 1 practice',
                when: (env) => env.stage >= 2 && env.stage < 4,
                items: [
                    {
                        q: 'Which sentence gives the absolute maximum value of f on the closed interval ' + PROB1.iv + ' and says where that value occurs?',
                        choices: [
                            'The absolute maximum value is 9, and it occurs at x = −1. The number 9 comes from the f(x) column, and x = −1 is the candidate listed in the same row.',
                            'The absolute maximum occurs at x = −1. That row carries the greatest value in the table.',
                            'The absolute maximum value is 6, and it occurs at x = 5. The right endpoint is the largest candidate on the list.'
                        ], a: 0,
                        whyBy: [
                            'The comparison runs down the f(x) column, and 9 is its greatest entry. The location is the candidate in the same row of the Candidate x column, so the value and the location are two different numbers in one sentence.',
                            'x = −1 is a location from the Candidate x column, and it is the part the question calls where. The absolute maximum value itself is 9 from the f(x) column, and this sentence leaves that out.',
                            'This choice compares the Candidate x column instead of the f(x) column. Being the largest location on the list says nothing about carrying the greatest value, so the value 6 at x = 5 is not the absolute maximum value.'
                        ]
                    },
                    {
                        q: 'Which sentence gives the absolute minimum value of f on the closed interval ' + PROB1.iv + ' and says where that value occurs?',
                        choices: [
                            'The absolute minimum value is −2, and it occurs at x = 2. The number −2 comes from the f(x) column, and x = 2 is the candidate listed in the same row.',
                            'The absolute minimum occurs at x = 2. That row carries the least value in the table.',
                            'The absolute minimum value is 4, and it occurs at x = −3. The left endpoint gives the smallest value.'
                        ], a: 0,
                        whyBy: [
                            'The f(x) column holds 4, 9, −2 and 6, and −2 is its least entry. The Candidate x column then supplies the location, which is x = 2.',
                            'x = 2 is a location from the Candidate x column, and it answers where. The absolute minimum value is −2 from the f(x) column, and this sentence leaves that out.',
                            'The left endpoint is a candidate, and comparing it is part of the work, but its value 4 is not the least entry in the f(x) column. Being an endpoint only earns a row on the list.'
                        ]
                    }
                ]
            },
            {
                kind: 'table', title: 'Problem 2 candidate table',
                when: (env) => env.stage >= 4 && env.stage < 7,
                cols: (env) => boardCols(env.cmp2),
                rows: (env) => boardRows(PROB2, env.cmp2),
                note: 'Every row of the Problem 2 candidate table is one candidate on the closed interval ' + PROB2.iv + '. These three rows are all the candidates there, and the same reading applies as in the Problem 1 candidate table.'
            },
            {
                kind: 'practice', id: 'u55-transfer-p2', title: 'Problem 2 practice',
                when: (env) => env.stage >= 5 && env.stage < 7,
                items: [
                    {
                        q: 'Which sentence gives the absolute minimum value of f on the closed interval ' + PROB2.iv + ' and says where that value occurs?',
                        choices: [
                            'The absolute minimum value is 1, and it occurs at x = 0. The number 1 comes from the f(x) column, and x = 0 is the candidate listed in the same row.',
                            'The absolute minimum is at x = 0. That row carries the least value in the table.',
                            'The absolute minimum value is 5, and it occurs at both x = −2 and x = 2. Those two rows agree, so they must be the least.',
                        ], a: 0,
                        whyBy: [
                            'The least entry in the f(x) column is 1, and the Candidate x column of that row reads x = 0. A complete sentence gives the value first and then the location.',
                            'x = 0 is a location from the Candidate x column, and it answers where. The absolute minimum value is 1 from the f(x) column, and this sentence leaves that out.',
                            'The value 5 is the greatest entry of the f(x) column, so those two rows hold the absolute maximum value, and this question asked for the least. Rows agreeing with each other is only worth naming once the comparison says which end of the column they sit at.'
                        ]
                    },
                    {
                        q: 'Which sentence gives the absolute maximum value of f on the closed interval ' + PROB2.iv + ' and says where that value occurs?',
                        choices: [
                            'The absolute maximum value is 5, and it occurs at both x = −2 and x = 2. The f(x) column lists 5 in each of those two rows.',
                            'The absolute maximum value is 5, and it occurs only at x = −2. The first row that carries that value decides the answer.',
                            'The absolute maximum is at x = −2 and at x = 2. Two locations share it, so no single number is the maximum value.'
                        ], a: 0,
                        whyBy: [
                            'The greatest entry in the f(x) column is 5, and it appears twice, so the same absolute maximum value is attained at two candidates. The f(x) column gives the value and the Candidate x column gives both locations.',
                            'The value is right and the location list is short. Every row is compared, and the row reading x = 2 carries 5 as well, so the maximum happens twice on this interval.',
                            'Both locations are right and the value is missing. The absolute maximum value is 5 from the f(x) column, and x = −2 and x = 2 from the Candidate x column are where it occurs.'
                        ]
                    }
                ]
            },
            {
                kind: 'table', title: 'Problem 3 raw table',
                when: (env) => env.raw3,
                cols: (env) => rawCols(env),
                rows: (env) => rawRows(env),
                note: 'The Problem 3 raw table prints five rows of data for f on the closed interval ' + RAW3.iv + ', and the Candidates Test needs fewer than that. Each row gives an x-value, the value of f there and the value of f′ there. Only a row at an endpoint or at an interior critical point belongs on the candidate list, so decide which rows those are before any value gets compared.'
            },
            {
                kind: 'practice', id: 'u55-transfer-p3a', title: 'Problem 3 candidate list',
                when: (env) => env.ask3list,
                items: [
                    {
                        q: 'Reading the Problem 3 raw table on the closed interval ' + RAW3.iv + ', which rows belong on the candidate list for the Candidates Test?',
                        choices: [
                            'The candidate list is x = −3, x = −1, x = 2 and x = 5. The first and the last are the endpoints, f′(−1) = 0, and f′(2) does not exist.',
                            'Every row of the Problem 3 raw table is a candidate, so the list is x = −3, x = −1, x = 0, x = 2 and x = 5. The table prints five rows, and the test compares all five.',
                            'The candidate list is x = −1 and x = 2, because those are the interior rows where f′ equals 0 or fails to exist. An endpoint is not a critical point, so both endpoints stay off the list.'
                        ], a: 0,
                        whyBy: [
                            'The list takes both endpoints of the closed interval ' + RAW3.iv + ' together with every interior critical point. x = −3 and x = 5 are the endpoints, f′(−1) = 0 makes x = −1 a critical point, and f′(2) does not exist makes x = 2 a critical point too, so those four rows are the complete list.',
                            'The table prints five rows and the candidate list takes four of them. The row for x = 0 must never enter the comparison, because f′(0) = 2 is neither zero nor undefined, and x = 0 lies inside the interval instead of at an end of it.',
                            'Endpoints belong on the candidate list even though neither of them is a critical point, so this list is missing the rows x = −3 and x = 5. On a closed interval an absolute extremum can be taken at an endpoint, and a list without them cannot find that value.'
                        ]
                    }
                ]
            },
            {
                kind: 'practice', id: 'u55-transfer-p3b', title: 'Problem 3 comparison',
                when: (env) => env.ask3cmp,
                items: [
                    {
                        q: 'Comparing only the candidate rows of the Problem 3 raw table on the closed interval ' + RAW3.iv + ', which sentence gives the absolute maximum value and the absolute minimum value, each with the x-value where it occurs?',
                        choices: [
                            'The absolute maximum value is 9, and it occurs at x = −1. The absolute minimum value is −2, and it occurs at x = 2.',
                            'The absolute maximum value is 9, and it occurs at x = −1. The absolute minimum value is 3, and it occurs at x = 0.',
                            'The absolute maximum value is 6, and it occurs at x = 5. The absolute minimum value is 4, and it occurs at x = −3.'
                        ], a: 0,
                        whyBy: [
                            'The candidate values are 4, 9, −2 and 6, and the comparison runs down the f(x) column of those four rows. The greatest entry is 9, in the row whose x column reads −1, and the least entry is −2, in the row whose x column reads 2.',
                            'The maximum half is right, and the minimum half comes from a row that is not a candidate. The row for x = 0 must never enter this comparison, because f′(0) = 2 is neither zero nor undefined and x = 0 is not an endpoint, so the value 3 is never ranked.',
                            'This pair reads the two endpoint rows instead of the whole candidate list. The endpoints are candidates, and their values 4 and 6 are neither the greatest nor the least entry of the f(x) column among the four candidates.'
                        ]
                    }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'Candidates Test in four steps',
                lines: [
                    { t: '1. Find the critical numbers in (a, b).' },
                    { t: '2. Add the endpoints a and b.' },
                    { t: '3. Evaluate f at every candidate.' },
                    { t: '4. Compare the values.' },
                    { t: 'Problems 1 and 2 hand you a list that steps 1, 2 and 3 already built, so their questions ask step 4. Problem 3 makes you build the list yourself before any comparison.', hl: true }
                ]
            },
            {
                kind: 'note', title: 'What this mode hands you',
                when: (env) => env.stage >= 1 && env.stage < 7,
                text: 'There is no curve anywhere in this mode, so nothing is read off a picture and no derivative is taken here. Problems 1 and 2 each arrive with their candidate list already built, and the whole job is the comparison in step 4 of the Candidates Test in four steps panel. Keep the Candidate x column and the f(x) column apart while you write: one holds locations, the other holds values.'
            },
            {
                kind: 'note', title: 'Problem 3 builds the list itself',
                when: (env) => env.raw3 && !env.cmp3,
                text: 'Problem 3 hands the data before it hands a list. The Problem 3 raw table gives x, f(x) and f′(x) for five rows on the closed interval ' + RAW3.iv + ', and steps 1, 2 and 3 of the Candidates Test in four steps panel are now your own work. A row earns its place on the candidate list by sitting at an endpoint or at an interior critical point, and no row earns a place just because the table prints it.'
            },
            {
                kind: 'readout', title: 'Problem 2 result',
                when: (env) => env.cmp2 && env.stage < 7,
                items: [
                    { label: 'Absolute maximum value', v: () => dsp(5), color: 'accent' },
                    { label: 'Occurs at x', v: () => dsp(-2) + ' and ' + dsp(2) },
                    { label: 'Absolute minimum value', v: () => dsp(1), color: 'aux' },
                    { label: 'Occurs at x', v: () => dsp(0) }
                ]
            },
            {
                kind: 'note', title: 'Same value, two x-values',
                when: (env) => env.cmp2 && env.stage < 7,
                text: 'A function may attain the same absolute maximum or minimum value at more than one x-value. The comparison does not stop at the first row that reaches the greatest entry of the f(x) column, so every candidate carrying that value belongs in the answer. The Problem 2 candidate table and the Problem 2 result panel show that case, and the sentence you write simply lists both locations.'
            },
            {
                kind: 'readout', title: 'Problem 3 result',
                when: (env) => env.cmp3,
                items: [
                    { label: 'Absolute maximum value', v: () => dsp(9), color: 'accent' },
                    { label: 'Occurs at x', v: () => dsp(-1) },
                    { label: 'Absolute minimum value', v: () => dsp(-2), color: 'aux' },
                    { label: 'Occurs at x', v: () => dsp(2) },
                    { label: 'Row kept out of the comparison', v: () => 'x = 0', color: 'auxInk' }
                ]
            },
            {
                kind: 'note', title: 'The row that stays out',
                when: (env) => env.cmp3,
                text: 'The value 3 at x = 0 is a perfectly ordinary function value, and it never takes part in the comparison in Problem 3, because that row is neither an endpoint nor a critical point. Reading a table for the Candidates Test means deciding which rows qualify first and ranking only those values afterwards. Problems 1 and 2 skipped that decision, because their candidate lists arrived already built.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'The Problem 1 candidate table is the whole candidate list for the closed interval ' + PROB1.iv + '. Its four rows are finished candidates, which means steps 1, 2 and 3 of the Candidates Test in four steps panel have already been done for you. Read the Candidate x column and the f(x) column before you answer anything.'
        },
        {
            params: { stage: 2 },
            message: 'Work through both questions in the Problem 1 practice panel. The comparison itself happens in the f(x) column, and the Candidate x column supplies the location for whichever value you name. Nothing in the Problem 1 candidate table is highlighted yet.'
        },
        {
            params: { stage: 3 },
            message: 'The How it compares column has filled in beside the f(x) column of the Problem 1 candidate table. One row carries the greatest entry and one carries the least entry, and the other two rows are still candidates that simply hold neither of those two values. That is the whole method: a candidate is a place to look, never a claim.'
        },
        {
            params: { stage: 4 },
            message: 'The Problem 2 candidate table is a new list on the closed interval ' + PROB2.iv + ', and its three rows are all the candidates there. Work it exactly like the first problem, and keep the Candidate x column and the f(x) column apart when you write an answer.'
        },
        {
            params: { stage: 5 },
            message: 'Answer both questions in the Problem 2 practice panel. The procedure does not change, and no slope, tangent or curve is needed anywhere in this mode.'
        },
        {
            params: { stage: 6 },
            message: 'Read the How it compares column and the Problem 2 result panel against the Problem 2 candidate table. The same entry of the f(x) column can be the greatest value at more than one row of the Candidate x column, and then the answer names every one of those locations.'
        },
        {
            params: { stage: 7 },
            message: 'Problem 3 changes what you are handed. The Problem 3 raw table prints five rows of x, f(x) and f′(x) for the closed interval ' + RAW3.iv + ', and it has more rows than the Candidates Test needs. Steps 1, 2 and 3 of the Candidates Test in four steps panel are now your work, so decide which rows qualify as candidates before you compare any value.'
        },
        {
            params: { stage: 8 },
            message: 'Answer the question in the Problem 3 candidate list panel. It asks only which rows of the Problem 3 raw table belong on the candidate list, and it is the question the comparison depends on. Nothing in that table is marked yet.'
        },
        {
            params: { stage: 9 },
            message: 'A column titled On the candidate list has filled in beside the f′(x) column. Four rows qualify, the two endpoints and the two interior critical points, and the row for x = 0 does not, because f′(0) = 2 is neither zero nor undefined. The candidate values are the four entries 4, 9, −2 and 6 in the f(x) column.'
        },
        {
            params: { stage: 10 },
            message: 'The Problem 3 comparison panel now asks for the absolute maximum value and the absolute minimum value, each with the x-value where it occurs. Rank only the four rows marked Yes in the new column, and leave the remaining row out of the comparison.'
        },
        {
            params: { stage: 11 },
            message: 'Read the How it compares column and the Problem 3 result panel against the Problem 3 raw table. Among the four candidate rows the greatest value is 9, taken at x = −1, and the least is −2, taken at x = 2. The value 3 at x = 0 never entered that comparison, because its row is neither an endpoint nor a critical point.'
        }
    ],
    summary: {
        idea: 'Absolute extrema on a closed interval come out of one comparison. The candidate list is the interior critical points together with both endpoints, the function is evaluated at every one of them, and the values decide: the greatest candidate value is the absolute maximum value and the least is the absolute minimum value. A complete answer states the value and the location as two separate things, and the same value may occur at more than one location.',
        mistake: 'Three slips break this test. Comparing only the local extrema can drop the endpoint that carries the greatest value. Forgetting to add the endpoints leaves the list incomplete before the comparison starts. Forgetting a critical point where the derivative does not exist drops a candidate that is not found by solving f′ = 0. A row that is not a candidate, such as a row whose derivative is an ordinary nonzero number, must stay out of the comparison entirely. Any candidate missing from the list can leave the absolute maximum value or the absolute minimum value undecided.',
        transfer: 'Take f(x) = x³ − 3x on the closed interval [−2, 3]. Build your own table with the same columns as the Problem 1 candidate table, a Candidate x column, a Why it is a candidate column and an f(x) column, then compare the values and state the absolute maximum value and the absolute minimum value with the location of each. Check whether either one of them happens at more than one x-value.'
    }
};

export default transferMode;
