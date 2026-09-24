function g2d(values, opts) {
    return { kind: 'grid2d', name: 'grid', values, ...opts };
}

const ZEROS = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
const NINE = [[0, 0, 0, 0], [0, 0, 9, 0], [0, 0, 0, 0]];

export default {
    id: 'u4-grid2d-basics',
    meta: { unit: 4, topic: '4.11', title: '2D Array Creation and Access', visualizerTitle: '2D Array Grid & Memory Visualizer' },
    intro: 'Two views of the same thing: a neat matrix on the left, an array of row-arrays on the right.',
    code: `int[][] grid = new int[3][4];
grid[1][2] = 9;
int rows = grid.length;
int cols = grid[0].length;`,
    layout: { center: ['extra'], right: ['memory', 'heap'] },
    steps: [
        { line: 1, message: 'MATRIX VIEW: new int[3][4] draws 3 rows of 4 cells, all default 0.', mutations: [
            { type: 'extra.set', value: g2d(ZEROS, { note: 'grid.length = 3 rows · grid[0].length = 4 columns' }) }
        ] },
        { line: 1, message: 'MEMORY VIEW: it is really one object holding 3 references, each pointing at its own int[4] row object. An array OF arrays. The grid variable itself only holds the outer arrow.', mutations: [
            { type: 'memory.create', name: 'grid', dataType: 'int[][]', value: 'ref → int[][] #1', refId: 'g1' },
            { type: 'heap.create', objId: 'g1', className: 'int[][] #1', fields: [
                { name: '[0]', type: 'int[]', value: '→ row object' },
                { name: '[1]', type: 'int[]', value: '→ row object' },
                { name: '[2]', type: 'int[]', value: '→ row object' }
            ] }
        ] },
        { line: 2, predict: { q: 'grid[1][2] = 9. Before the 9 lands anywhere: what does the FIRST bracket pair grid[1] pick out?', choices: ['The single cell in row 1, column 1', 'The whole row-1 array, all 4 cells', 'The column-2 array'], a: 1, why: 'First index = row, and it selects an entire inner array. The second index then picks one cell INSIDE that row.' }, message: 'grid[1] selects row 1: one whole one-dimensional array of 4 cells. First index is ALWAYS the row.', mutations: [
            { type: 'extra.set', value: g2d(ZEROS, { visited: [[1, 0], [1, 1], [1, 2], [1, 3]], note: 'step 1 of grid[1][2]: pick the row' }) }
        ] },
        { line: 2, message: 'Then [2] picks column 2 inside that row. Two-step access: follow the outer arrow, take slot 1, follow the row arrow, take cell 2. That cell becomes 9.', mutations: [
            { type: 'extra.set', value: g2d(NINE, { current: [1, 2], note: 'grid[1][2]: row 1, column 2' }) }
        ] },
        { line: 3, predict: { q: 'What question does grid.length answer for this 3-by-4 array?', choices: ['4: the number of columns', '3: the number of ROWS', '12: the number of cells'], a: 1, why: 'The outer array holds rows, so its length counts rows. Columns come from grid[r].length, one level deeper.' }, message: 'rows = grid.length is 3, the NUMBER OF ROWS. cols = grid[0].length is 4, the length of one row. The two lengths answer different questions.', mutations: [
                    { type: 'memory.create', name: 'rows', dataType: 'int', value: '3' },
                    { type: 'memory.create', name: 'cols', dataType: 'int', value: '4' }
                ] },
        { line: 1, message: 'Bounds are checked per index: grid[3] crashes the first step (valid rows 0 to 2), grid[r][4] crashes the second (valid columns 0 to 3). Swapping r and c in loop indexes is the most common 2D bug, and it only crashes when the grid is not square.', mutations: [] },
        { line: 1, message: 'Literal form: int[][] m = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}. Each inner brace is one row array, filled directly. Same object shape as above, no defaults phase.', mutations: [
            { type: 'extra.set', value: g2d([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]], { visited: [[1, 1]], note: 'm[1][1] = 6: row 1, column 1' }) }
        ] }
    ],
    summary: {
        idea: ['A 2D array is an array OF row-arrays: grid.length counts rows, grid[r].length counts columns, and access reads left to right, row then column.', 'Bounds are checked TWICE per access: the row index first, then the column index inside that row.'],
        mistake: 'Swapping the indexes, grid[c][r]: works silently on square grids, then crashes or scrambles data the moment rows and columns differ.',
        transfer: 'int[][] t = new int[5][2]: what are t.length and t[0].length, and does t[2][2] compile, run, or throw?'
    }
};
