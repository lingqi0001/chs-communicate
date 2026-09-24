const VALS = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];

function g2d(visited, current, note) {
    return { kind: 'grid2d', name: 'grid', values: VALS, visited, current, note };
}

const R0 = [[0, 0], [0, 1], [0, 2]];
const R1 = R0.concat([[1, 0], [1, 1], [1, 2]]);
const R2 = R1.concat([[2, 0], [2, 1], [2, 2]]);

const C0 = [[0, 0], [1, 0], [2, 0]];
const C1 = C0.concat([[0, 1], [1, 1], [2, 1]]);
const C2 = C1.concat([[0, 2], [1, 2], [2, 2]]);

const DIAG = [[0, 0], [1, 1], [2, 2]];

export default {
    id: 'u4-grid2d-traversal',
    meta: { unit: 4, topic: '4.12', title: '2D Array Traversals', visualizerTitle: '2D Array Traversal Visualizer' },
    modes: [
        {
            label: 'Row-major',
            intro: 'Nested loops eat the grid row by row. The outer loop is the row, the inner is the column.',
            code: `for (int r = 0; r < grid.length; r++)
{
    for (int c = 0; c < grid[r].length; c++)
    {
        System.out.print(grid[r][c]);
    }
}`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 1, message: 'r = 0: the outer loop chooses row 0. The inner loop is about to run the whole row.', mutations: [
                    { type: 'memory.create', name: 'r', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: g2d([], [0, 0]) }
                ] },
                { line: 5, predict: { q: 'Before the inner loop runs: which cells are visited first, and how many times does the inner loop execute in TOTAL?', choices: ['Down the first column; 3 total', 'Across row 0 first; 3 rows x 3 cols = 9 total', 'Diagonal; 3 total'], a: 1, why: 'The OUTER loop fixes the row; the inner loop sweeps it completely. Nine body runs, three batches of three.' }, message: 'Row 0: c walks 0, 1, 2, printing 1 2 3. Every cell of row 0 is visited before the row ends. The visit path so far is one full line.', mutations: [
                    { type: 'memory.create', name: 'c', dataType: 'int', value: '2' },
                    { type: 'console.append', text: '123' },
                    { type: 'extra.set', value: g2d(R0, null, 'row 0 done') }
                ] },
                { line: 1, message: 'r = 1: c RESTARTS at 0. The inner loop runs in full for every single outer iteration. Row 1 prints 4 5 6.', mutations: [
                    { type: 'memory.set', name: 'r', value: '1' },
                    { type: 'memory.set', name: 'c', value: '2' },
                    { type: 'console.append', text: '456' },
                    { type: 'extra.set', value: g2d(R1, null, 'row 1 done') }
                ] },
                { line: 1, message: 'r = 2: last row, prints 7 8 9. Output 123456789, one long line because print never added a newline. Total body executions: rows x cols = 9.', mutations: [
                    { type: 'memory.set', name: 'r', value: '2' },
                    { type: 'memory.set', name: 'c', value: '2' },
                    { type: 'console.append', text: '789' },
                    { type: 'extra.set', value: g2d(R2, null, 'row-major order: every row, left to right, top to bottom') }
                ] },
                { line: 3, message: 'The nested enhanced for, for (int[] row : grid) then for (int v : row), walks the exact same cells in the exact same order with no r or c at all. Order of visiting is decided by which loop is outer, not by naming.', mutations: [] }
            ],
            summary: {
                idea: ['Outer loop = which line you stand on, inner loop = walk the whole line. Total visits = rows x cols.', 'The inner loop RESTARTS from its init on every outer iteration: that is what "completely" means.'],
                mistake: 'Reading output "123456789" as row-major only because the numbers ascend: on a different grid the same order can look shuffled. Match the PATH, not the values.',
                transfer: 'Print a newline after each inner loop finishes. What is the exact visible output for this grid, line by line?'
            }
        },
        {
            label: 'Column-major',
            intro: 'Swap the two loops and the same grid is read one column at a time.',
            code: `for (int c = 0; c < grid[0].length; c++)
{
    for (int r = 0; r < grid.length; r++)
    {
        System.out.print(grid[r][c]);
    }
}`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 1, message: 'Now the OUTER loop is the column. c = 0 fixes one vertical stripe, and the inner loop runs DOWN it.', mutations: [
                    { type: 'memory.create', name: 'c', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: g2d([], [0, 0], 'outer = column this time') }
                ] },
                { line: 5, predict: { q: 'The outer loop now fixes c = 0. Which cells does the inner loop sweep?', choices: ['(0,0), (0,1), (0,2): the top row', '(0,0), (1,0), (2,0): the LEFT column, top to bottom', 'All nine cells in one go'], a: 1, why: 'Same grid, different stripe: swapping which variable is outer changes the visit path to vertical. The values seen are identical, the ORDER is not.' }, message: 'Down column 0: grid[0][0]=1, grid[1][0]=4, grid[2][0]=7. Prints 1 4 7.', mutations: [
                    { type: 'memory.create', name: 'r', dataType: 'int', value: '2' },
                    { type: 'console.append', text: '147' },
                    { type: 'extra.set', value: g2d(C0, null, 'column 0 done') }
                ] },
                { line: 1, message: 'c = 1: r restarts at the top. Column 1 prints 2 5 8.', mutations: [
                    { type: 'memory.set', name: 'c', value: '1' },
                    { type: 'memory.set', name: 'r', value: '2' },
                    { type: 'console.append', text: '258' },
                    { type: 'extra.set', value: g2d(C1, null, 'column 1 done') }
                ] },
                { line: 1, message: 'c = 2: prints 3 6 9. Output is 147258369: same nine cells as row-major, completely different order. The exam loves asking which output matches which loop order.', mutations: [
                    { type: 'memory.set', name: 'c', value: '2' },
                    { type: 'console.append', text: '369' },
                    { type: 'extra.set', value: g2d(C2, null, 'column-major: down each stripe, stripes left to right') }
                ] }
            ],
            summary: {
                idea: ['Which loop is OUTER decides the stripe direction. Column-major = outer c, inner r, and the access still spells grid[r][c].', 'Same cell count either way (rows x cols): only the visiting ORDER differs.'],
                mistake: 'Writing grid[c][r] "because c is outer now": on a square grid it silently visits the wrong cells; on a rectangle it crashes.',
                transfer: 'A 2 x 5 grid traversed column-major prints 5 stripes. How many cells per stripe, and how many stripes total?'
            }
        },
        {
            label: 'Diagonal & partial',
            intro: 'You do not have to visit the whole rectangle: conditions and loop bounds carve the path.',
            code: `// main diagonal: row index equals column index
for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)
        if (r == c)
            System.out.print(grid[r][c]);

// triangle: for (int c = 0; c <= r; c++)`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 1, message: 'DIAGONAL: the full 9-cell walk still happens, but the if keeps only r == c. Cells (0,0), (1,1), (2,2) print 1 5 9.', mutations: [
                    { type: 'extra.set', value: g2d(DIAG, null, 'main diagonal: 1 5 9') }
                ] },
                { line: 5, message: 'The other diagonal on a square grid is c == grid.length - 1 - r: cells (0,2), (1,1), (2,0) give 3 5 7.', mutations: [
                    { type: 'extra.set', value: g2d([[0, 2], [1, 1], [2, 0]], null, 'anti-diagonal') }
                ] },
                { line: 5, predict: { q: 'Inner loop bound is c <= r. When r = 2 (the last outer round), how many cells does the inner loop visit?', choices: ['1', '2', '3: c takes 0, 1, 2'], a: 2, why: 'The inner bound GROWS with r: row 0 ran 1 cell, row 1 ran 2, row 2 runs 3. A triangle is 1 + 2 + 3, not 3 x 3.' }, message: 'TRIANGLE: make the inner bound depend on the outer one, c <= r. Row 0 runs 1 cell, row 2 runs 3. Cells (0,0),(1,0),(1,1),(2,0),(2,1),(2,2): prints 1 4 5 7 8 9. Total is 1+2+3, not 3x3.', mutations: [
                    { type: 'extra.set', value: g2d([[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]], null, 'lower triangle: six visits out of nine, output 1 4 5 7 8 9') }
                ] },
                { line: 5, message: 'Reading a partial traversal backwards is an exam skill: given the OUTPUT, decide which cells produced it, then which bound or condition excluded the rest.', mutations: [] }
            ],
            summary: {
                idea: ['A guard like if (r == c) filters a FULL sweep; a moving bound like c <= r shrinks the sweep itself. Both visit a subset, by different mechanisms.', 'n-by-n triangle total = n(n+1)/2, and the FRQ version asks you to notice WHICH loop changed.'],
                mistake: 'Confusing the diagonal guard r == c with the anti-diagonal r + c == n - 1: they select mirror-image paths.',
                transfer: 'Change the bound to c < r (strict). Which cell of each row disappears, and what is the new printed sequence?'
            }
        }
    ]
};
