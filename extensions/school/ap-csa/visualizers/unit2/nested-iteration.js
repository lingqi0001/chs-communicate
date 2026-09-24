function grid(visited, current, note) {
    return { kind: 'grid', rows: 3, cols: 4, rowLabel: 'r', colLabel: 'c', visited, current, note };
}

const row0 = [[0, 0], [0, 1], [0, 2], [0, 3]];
const row1 = row0.concat([[1, 0], [1, 1], [1, 2], [1, 3]]);
const row2 = row1.concat([[2, 0], [2, 1], [2, 2], [2, 3]]);

export default {
    id: 'u2-nested-iteration',
    meta: { unit: 2, topic: '2.11', title: 'Nested Iteration', visualizerTitle: 'Nested Loop Grid Visualizer' },
    modes: [{
    label: 'Rectangle',
    intro: 'The outer loop owns the rows. The inner loop repaints one whole row, then starts over.',
    code: `for (int r = 0; r < 3; r++)
{
    for (int c = 0; c < 4; c++)
    {
        System.out.print("*");
    }
    System.out.println();
}`,
    layout: { center: ['extra'], right: ['memory', 'console'] },
    steps: [
        { line: 1, message: 'r = 0 opens the first row. The inner loop has not started yet.', mutations: [
            { type: 'memory.create', name: 'r', dataType: 'int', value: '0' },
            { type: 'extra.set', value: grid([], [0, 0]) }
        ] },
        { line: 3, message: 'c is declared fresh at 0 for THIS row. That restart is the key behavior of nesting.', mutations: [
            { type: 'memory.create', name: 'c', dataType: 'int', value: '0' }
        ] },
        { line: 5, message: 'Row 0: the inner loop runs all four cells c = 0, 1, 2, 3, printing a star each time. When c reaches 4, only the inner loop ends.', mutations: [
            { type: 'extra.set', value: grid(row0, null) },
            { type: 'console.print', text: '****' }
        ] },
        { line: 1, message: 'r becomes 1, and the inner loop is re-entered: c is created again at 0. Row 1 fills exactly like row 0.', mutations: [
            { type: 'memory.set', name: 'r', value: '1' },
            { type: 'memory.set', name: 'c', value: '0' },
            { type: 'extra.set', value: grid(row1, null) },
            { type: 'console.print', text: '****' }
        ], predict: { q: 'Row 0 finished with c = 4. When the next row opens, where does c start?', choices: ['0 again - the inner loop is re-declared', '4 - it continues from where it stopped', '1 - one step past'], a: 0, why: 'The inner INIT runs once PER OUTER ROUND: c is literally born again at 0. "The inner loop always restarts" is the sentence the FR expects.' } },
        { line: 1, message: 'r = 2: third and final row, c again restarts from 0.', mutations: [
            { type: 'memory.set', name: 'r', value: '2' },
            { type: 'memory.set', name: 'c', value: '0' },
            { type: 'extra.set', value: grid(row2, null) },
            { type: 'console.print', text: '****' }
        ] },
        { line: 1, message: 'r becomes 3, the outer check 3 < 3 fails, everything ends. Total body runs: 3 rows x 4 columns = 12 stars.', mutations: [
            { type: 'memory.set', name: 'r', value: '3' },
            { type: 'extra.set', value: grid(row2, null, 'Body ran 12 times: outer count x inner count.') }
        ] },
        { line: 3, message: 'Change the inner limit to c <= r and the rectangle becomes a triangle: row 0 prints 1 star, row 2 prints 3, total 1 + 2 + 3 = 6, not n x n. Triangular loops are the favorite AP exam twist.', mutations: [] }
    ],
    summary: {
        idea: 'Outer owns the rows, inner paints each row completely and RESTARTS at 0: total body runs = rows x cells-per-row = 3 x 4 = 12, in strict left-to-right, top-to-bottom order.',
        mistake: 'Believing the inner variable remembers where the last row left off. It does not - it is re-created every row.',
        transfer: 'Swap the inner bound to c <= r: what is the total now? (1 + 2 + 3 = 6 - the Triangle tab runs it cell by cell)'
    }
}, {
    label: 'Triangle, per cell',
    intro: 'The promised triangle, lit ONE body-run at a time: every check mark below is one full pass through the inner loop body.',
    code: `for (int r = 0; r < 3; r++)
{
    for (int c = 0; c <= r; c++)
    {
        System.out.print("*");
    }
    System.out.println();
}`,
    layout: { center: ['extra'], right: ['memory', 'console'] },
    steps: [
        { line: 1, message: 'r = 0. The inner bound is no longer a number - it is the EXPRESSION c <= r, evaluated fresh every round with the current r.', mutations: [
            { type: 'memory.create', name: 'r', dataType: 'int', value: '0' },
            { type: 'memory.create', name: 'c', dataType: 'int', value: '0' },
            { type: 'extra.set', value: grid([], [0, 0]) }
        ] },
        { line: 5, message: 'Body run 1: cell (0,0) lights, one star. Next c = 1 fails 1 <= 0: row 0 is DONE after a single cell.', mutations: [
            { type: 'console.append', text: '*' },
            { type: 'extra.set', value: grid([[0, 0]], null, 'row 0: inner ran 1 time') }
        ] },
        { line: 7, message: 'println() ends the line. r becomes 1 and c is REBORN at 0 - the restart that defines nesting.', mutations: [
            { type: 'console.print', text: '' },
            { type: 'memory.set', name: 'r', value: '1' },
            { type: 'memory.set', name: 'c', value: '0' },
            { type: 'extra.set', value: grid([[0, 0]], [1, 0]) }
        ] },
        { line: 5, message: 'Body run 2: cell (1,0). The bound now allows c = 0 AND c = 1.', mutations: [
            { type: 'console.append', text: '*' },
            { type: 'memory.set', name: 'c', value: '1' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0]], [1, 1]) }
        ] },
        { line: 5, message: 'Body run 3: cell (1,1). Then 2 <= 1 fails: row 1 gets exactly two cells.', mutations: [
            { type: 'console.append', text: '*' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0], [1, 1]], null, 'row 1: inner ran 2 times') }
        ] },
        { line: 7, message: 'r = 2, c restarts at 0 one more time. Row 2 will be the longest: c <= 2 lets three cells through.', mutations: [
            { type: 'console.print', text: '' },
            { type: 'memory.set', name: 'r', value: '2' },
            { type: 'memory.set', name: 'c', value: '0' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0], [1, 1]], [2, 0]) }
        ] },
        { line: 5, message: 'Body runs 4 and 5: cells (2,0), (2,1).', mutations: [
            { type: 'console.append', text: '**' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0], [1, 1], [2, 0], [2, 1]], [2, 2]) }
        ] },
        { line: 5, message: 'Body run 6: cell (2,2), the last one. Total marks: 1 + 2 + 3.', mutations: [
            { type: 'console.append', text: '*' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]], null) }
        ] },
        { line: 1, message: 'r = 3 fails the outer check: finished. FORMULA COMPARISON: rectangle theory said 3 x 3 = 9; the table visited 6. Row lengths 1+2+3 match n(n+1)/2 = 6. Actual = 6, theory (triangle) = 6, theory (square) = 9: when the inner bound depends on the outer variable, SUM THE ROWS, never multiply.', mutations: [
            { type: 'console.print', text: '' },
            { type: 'extra.set', value: grid([[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]], null, 'body ran 6 times: 1 + 2 + 3 = n(n+1)/2, not 3 x 3 = 9') }
        ], predict: { q: 'One more row just got painted. Is the running total heading to 6 stars or 9?', choices: ['6 - rows of 1 + 2 + 3', '9 - it is a 3 x 3 grid'], a: 0, why: 'The bound c <= r lets row r paint r + 1 cells: 1 + 2 + 3 = 6. The 3 x 3 product only works when every row is full.' } }
    ],
    summary: {
        idea: 'When the inner bound reads the outer variable, count by SUMMING row lengths (triangle: n(n+1)/2). Visits: (0,0) | (1,0) (1,1) | (2,0) (2,1) (2,2) - six, not nine.',
        mistake: 'Reflexively multiplying rows x columns even though the rows have different lengths.',
        transfer: 'Change the bound to c < r: row 0 paints nothing, total = 0 + 1 + 2 = 3. One symbol, half a triangle gone.'
    }
}, {
    label: 'Bound is an expression',
    intro: 'c < r + 2: the inner limit re-computes each row. Any bound formula buys you any shape - and one addition table.',
    code: `for (int r = 0; r < 3; r++)
{
    for (int c = 0; c < r + 2; c++)
    {
        System.out.print("*");
    }
    System.out.println();
}`,
    layout: { center: ['extra'], right: ['memory', 'console'] },
    steps: [
        { line: 1, message: 'Row 0: the bound evaluates 0 + 2 = 2. Two cells, not three, not four - whatever the formula says.', mutations: [
            { type: 'memory.create', name: 'r', dataType: 'int', value: '0' },
            { type: 'memory.create', name: 'c', dataType: 'int', value: '0' },
            { type: 'extra.set', value: grid([[0, 0], [0, 1]], null, 'row 0: bound = r + 2 = 2 cells') },
            { type: 'console.print', text: '**' }
        ] },
        { line: 1, message: 'Row 1: bound grows to 1 + 2 = 3. c still restarts at 0 every row; only the CEILING moved.', mutations: [
            { type: 'memory.set', name: 'r', value: '1' },
            { type: 'memory.set', name: 'c', value: '0' },
            { type: 'extra.set', value: grid([[0, 0], [0, 1], [1, 0], [1, 1], [1, 2]], null, 'row 1: bound = 3 cells') },
            { type: 'console.print', text: '***' }
        ], predict: { q: 'Row 0 painted 2 cells with bound r + 2. Now r = 1: how many cells will this row paint?', choices: ['3 - the formula re-runs with r = 1', '2 - the bound was set at row 0', '4 - always one more'], a: 0, why: 'The inner bound is a LIVE expression: re-evaluated at the start of every row with the current r. 1 + 2 = 3.' } },
        { line: 1, message: 'Row 2: bound 4. The picture is a leaning staircase: 2, 3, 4 cells.', mutations: [
            { type: 'memory.set', name: 'r', value: '2' },
            { type: 'extra.set', value: grid([[0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3]], null, 'row 2: bound = 4 cells') },
            { type: 'console.print', text: '****' }
        ] },
        { line: 1, message: 'Total: 2 + 3 + 4 = 9 body runs. Compare with the full rectangle 3 x 4 = 12: the formula shaved one cell per row index. Exam method for ANY variable bound: write the per-row lengths from the formula, then add. Multiplying only works when every row is identical.', mutations: [
            { type: 'extra.set', value: grid([[0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3]], null, 'body ran 9 times: 2 + 3 + 4, not 3 x 4 = 12') }
        ] }
    ],
    summary: {
        idea: 'A bound formula makes the shape whatever the formula graphs: rows of 2, 3, 4 here - total 9. Exam method for ANY variable bound: write each row length from the formula, then ADD them.',
        mistake: 'Freezing the bound at row 0\'s value, or multiplying rows x max-cells when the rows differ.',
        transfer: 'Bound r % 2 + 1: row lengths? (r=0: 1, r=1: 2, r=2: 1 - a 1/2/1 zigzag, total 4. The formula never lies; read it per row.)'
    }
}]
};
