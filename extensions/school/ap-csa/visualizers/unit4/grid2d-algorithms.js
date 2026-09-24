const VALS = [[2, 4, 1], [5, 3, 7], [8, 2, 6]];

function g2d(values, visited, current, note) {
    return { kind: 'grid2d', name: 'grid', values, visited, current, note };
}

const ROW0 = [[0, 0], [0, 1], [0, 2]];
const ROW1 = ROW0.concat([[1, 0], [1, 1], [1, 2]]);
const ROW2 = ROW1.concat([[2, 0], [2, 1], [2, 2]]);
const COL0 = [[0, 0], [1, 0], [2, 0]];
const COL1 = COL0.concat([[0, 1], [1, 1], [2, 1]]);
const COL2 = COL1.concat([[0, 2], [1, 2], [2, 2]]);

export default {
    id: 'u4-grid2d-algorithms',
    meta: { unit: 4, topic: '4.13', title: 'Implementing 2D Array Algorithms', visualizerTitle: '2D Array Algorithm Visualizer' },
    modes: [
        {
            label: 'Row sums',
            intro: 'The whole trick is WHERE you declare the accumulator.',
            code: `for (int r = 0; r < grid.length; r++)
{
    int sum = 0;

    for (int c = 0; c < grid[r].length; c++)
        sum += grid[r][c];

    System.out.println(sum);
}`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 3, message: 'Row 0 begins. sum is declared inside the outer loop, so each row gets a brand-new 0. That placement IS the reset.', mutations: [
                    { type: 'memory.create', name: 'sum', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: g2d(VALS, [], [0, 0], 'per-row accumulator') }
                ] },
                { line: 6, message: 'Row 0: 2, then 2+4 = 6, then 6+1 = 7. Print 7.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '7' },
                    { type: 'console.print', text: '7' },
                    { type: 'extra.set', value: g2d(VALS, ROW0, null, 'rowSums[0] = 7') }
                ] },
                { line: 3, predict: { q: 'Row 0 just printed 7. The loop starts row 1. What is sum at the first cell of row 1?', choices: ['7: it is the same variable, still holding its value', '0: it is re-declared fresh on every outer iteration', '22: it keeps accumulating across rows'], a: 1, why: 'The DECLARATION sits inside the outer loop body, so row 1 gets a brand-new sum = 0. Where a variable is declared IS the reset.' }, message: 'Row 1: sum is re-declared as 0. The old 7 is gone with its scope.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '0' },
                    { type: 'extra.set', value: g2d(VALS, ROW0, [1, 0]) }
                ] },
                { line: 6, message: 'Row 1: 5, 8, 15. Print 15.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '15' },
                    { type: 'console.print', text: '15' },
                    { type: 'extra.set', value: g2d(VALS, ROW1, null, 'rowSums[1] = 15') }
                ] },
                { line: 6, message: 'Row 2: 8, 10, 16. Output: 7, 15, 16.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '16' },
                    { type: 'console.print', text: '16' },
                    { type: 'extra.set', value: g2d(VALS, ROW2, null, 'rowSums[2] = 16') }
                ] }
            ],
            summary: {
                idea: ['WHERE the accumulator is declared decides WHAT it sums: inside the outer loop = per row, outside both = grand total.', 'Row sums: outer loop is r and the inner sweeps grid[r] completely before moving on.'],
                mistake: 'Declaring sum once before both loops and expecting row sums: you get ONE running total instead of three answers.',
                transfer: 'The FRQ wants rowSums as an int[] instead of printed lines. Which single line changes, and where does the array assignment go?'
            }
        },
        {
            label: 'Column & whole sums',
            intro: 'Same grid, different question: swap the loops for columns, drop the reset for totals.',
            code: `// column sums: outer loop is the column
for (int c = 0; c < grid[0].length; c++)
{
    int sum = 0;
    for (int r = 0; r < grid.length; r++)
        sum += grid[r][c];
    System.out.println(sum);
}

// whole grid: declare total OUTSIDE both loops`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 2, predict: { q: 'The task is COLUMN sums. Which loop must be the outer one?', choices: ['r outer, c inner: the usual order still works', 'c outer, r inner: one stripe per outer round', 'Either order gives column sums'], a: 1, why: 'A column can only be swept by fixing c and walking r. Keeping r outer gives ROW sums no matter what the variables are named.' }, message: 'For COLUMN sums the outer loop must be c. If you keep the row-major loops and write grid[c][r] with the names swapped, a non-square grid crashes or silently sums wrong.', mutations: [
                    { type: 'memory.create', name: 'c', dataType: 'int', value: '0' },
                    { type: 'memory.create', name: 'sum', dataType: 'int', value: '0' }
                ] },
                { line: 6, message: 'Column 0 top to bottom: 2, 7, 15. Print 15.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '15' },
                    { type: 'console.print', text: '15' },
                    { type: 'extra.set', value: g2d(VALS, COL0, null, 'colSums[0] = 15') }
                ] },
                { line: 6, message: 'Column 1: 4 + 3 + 2 = 9. Column 2: 1 + 7 + 6 = 14. Output 15, 9, 14.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '14' },
                    { type: 'console.print', text: '9' },
                    { type: 'console.print', text: '14' },
                    { type: 'extra.set', value: g2d(VALS, COL2, null, 'colSums: 15, 9, 14') }
                ] },
                { line: 10, message: 'WHOLE-GRID sum: declare one total outside BOTH loops and never reset it. 7 + 15 + 16 = 38, and also 15 + 9 + 14 = 38: row sums and column sums must agree on the grand total. That agreement is your free arithmetic check.', mutations: [
                    { type: 'memory.create', name: 'total', dataType: 'int', value: '38' }
                ] }
            ],
            summary: {
                idea: ['Row totals vs column totals are the SAME code with the loop roles swapped; the grand total is the consistency check between them.', 'The 2D linear patterns all reuse 4.5 skeletons; only the access form grid[r][c] and the loop pairing change.'],
                mistake: 'Using grid.length for the inner column bound: the correct inner bound is grid[r].length, the length of THAT row.',
                transfer: 'Without running anything: for this grid, what does swapping ONLY the two loop headers (keeping grid[r][c] as written) produce for a 3 x 5 grid, and why does it crash?'
            }
        },
        {
            label: 'Find max & locate',
            intro: 'The champion pattern from 4.5, now answering WHERE as well as WHAT.',
            code: `int max = grid[0][0];
int maxR = 0, maxC = 0;

for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)
        if (grid[r][c] > max)
        {
            max = grid[r][c];
            maxR = r;
            maxC = c;
        }`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 1, message: 'Sentinel from the data again: grid[0][0] = 2. Two extra variables remember the coordinates, because the question asks for a POSITION, not just a value.', mutations: [
                    { type: 'memory.create', name: 'max', dataType: 'int', value: '2' },
                    { type: 'memory.create', name: 'maxR', dataType: 'int', value: '0' },
                    { type: 'memory.create', name: 'maxC', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: g2d(VALS, [], [0, 0]) }
                ] },
                { line: 6, predict: { q: 'grid[2][0] is 8 and beats the current champion 7. What changes in this round?', choices: ['max only', 'max, maxR AND maxC all move together: 8, row 2, column 0', 'maxR and maxC only; max updates on the next round'], a: 1, why: 'A locate-style champion updates value and address as ONE block. Forgetting a coordinate line is the classic half-credit FRQ bug.' }, message: 'Row-major sweep: 4 beats 2 (max 4 at 0,1). Then 5 beats 4 (max 5 at 1,0). Then 7 (1,2). Then 8 (2,0). The champion and its address move together on every update.', mutations: [
                    { type: 'expression.reduce', text: '8 > 7 at grid[2][0]', note: 'champion + coordinates update as one block' },
                    { type: 'memory.set', name: 'max', value: '8' },
                    { type: 'memory.set', name: 'maxR', value: '2' },
                    { type: 'memory.set', name: 'maxC', value: '0' },
                    { type: 'extra.set', value: g2d(VALS, ROW2, [2, 0]) }
                ] },
                { line: 6, message: 'Loop ends: max = 8 at row 2, column 0. With duplicates, strict > keeps the FIRST location found in row-major order, an FRQ detail graders check.', mutations: [
                    { type: 'extra.set', value: g2d(VALS, ROW2, [2, 0], 'answer: 8, located at [2][0]') }
                ] }
            ],
            summary: {
                idea: ['Locate = champion + address: every update writes the value AND its r AND its c, all three, inside the same if.', 'Sentinel from the data (grid[0][0]) still applies: never seed max with 0 for possibly-negative grids.'],
                mistake: 'Seeding maxR/maxC at meaningful-looking values and printing them when no update ever happened; they must start at the sentinel position 0, 0.',
                transfer: 'Change the task to the SMALLEST value and its position. Exactly which three edits turn this code into that one?'
            }
        },
        {
            label: 'Count, replace & diagonals',
            intro: 'Traversal plus a decision: count the cells that pass, rewrite them, or restrict which cells you touch.',
            code: `// count cells greater than 5
int n = 0;
for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)
        if (grid[r][c] > 5) n++;

// replace: grid[r][c] = 0 when below 5
// diagonal only: if (r == c)`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 1, message: 'COUNT matches over a grid: ordinary counter pattern, full row-major sweep. 7, 8, 6 pass, 5 fails the strict test. n = 3.', mutations: [
                    { type: 'memory.create', name: 'n', dataType: 'int', value: '3' },
                    { type: 'extra.set', value: g2d(VALS, ROW2, null, 'cells > 5: the 7, the 8, the 6') }
                ] },
                { line: 7, predict: { q: 'The zero-below-5 task rewrites cells. Can nested for-each (for int[] row : grid, for int v : row) do it?', choices: ['Yes: v is the cell itself', 'No: v is a copy; writing the grid needs grid[r][c] with both indexes', 'Only on square grids'], a: 1, why: 'Same rule as 1D: reading allows for-each, WRITING requires the indexed access form.' }, message: 'REPLACE cells: zeroing everything below 5 turns the grid into a new matrix. Writing needs grid[r][c] on the left side, so the indexed loops are mandatory, and the visit path stays the same even though the data changes under it.', mutations: [
                    { type: 'extra.set', value: g2d([[0, 0, 0], [5, 0, 7], [8, 0, 6]], ROW2, null, 'every cell below 5 became 0') }
                ] },
                { line: 8, message: 'DIAGONAL processing: either guard with if (r == c) inside a full sweep, or run ONE loop with grid[i][i]. Main diagonal 2 + 3 + 6 = 11. Neighbors (up/down/left/right of a cell) need bounds tests r-1 >= 0 and c+1 < grid[r].length first.', mutations: [
                    { type: 'extra.set', value: g2d(VALS, [[0, 0], [1, 1], [2, 2]], null, 'diagonal sum 2 + 3 + 6 = 11') },
                    { type: 'expression.reduce', text: 'grid[i][i]', note: 'one loop touches only the diagonal' }
                ] },
                { line: 5, message: 'FRQ reading checklist: which loop is outer decides row vs column work; where the accumulator is declared decides per-row vs whole-grid; a coordinate answer needs the row AND column remembered together; and r/c swapped in an access is the bug to hunt for first.', mutations: [] }
            ],
            summary: {
                idea: ['Count over a grid = conditional counter, exactly the 4.5 pattern with one more loop.', 'Diagonal via a guard (if r == c inside a full sweep) and diagonal via one loop (grid[i][i]) visit the SAME three cells; only the mechanism differs.'],
                mistake: 'Neighbor work without bounds tests: checking all four neighbors of [r][c] needs r-1 >= 0, r+1 < grid.length, c-1 >= 0, c+1 < grid[r].length BEFORE the access, each in that order.',
                transfer: 'Count cells that equal their row index. For this grid, which cells pass, and what does the answer become on a 4 x 4 all-ones grid?'
            }
        }
    ]
};
