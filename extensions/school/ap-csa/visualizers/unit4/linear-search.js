const VALS = [4, 9, 2, 7, 5];

function arr(sel, checked, note) {
    return { kind: 'array', name: 'nums', values: VALS, sel, checked: checked || 0, note };
}

const GRID = [[3, 1], [7, 2], [5, 9]];

function g2d(visited, current, note) {
    return { kind: 'grid2d', name: 'grid', values: GRID, visited, current, note };
}

export default {
    id: 'u4-linear-search',
    meta: { unit: 4, topic: '4.14', title: 'Searching Algorithms', visualizerTitle: 'Linear Search Visualizer' },
    modes: [
        {
            label: 'Forward search',
            intro: 'Check every element until you hit it. Sorted or not, linear search does not care.',
            code: `int[] nums = {4, 9, 2, 7, 5};
int target = 7;

for (int i = 0; i < nums.length; i++)
{
    if (nums[i] == target)
        return i;
}
return -1;`,
            layout: { center: ['extra'], right: ['expression', 'memory'] },
            steps: [
                { line: 1, message: 'Target is 7. The pointer starts at index 0. Nothing about the array matters to a linear search, not even order.', mutations: [
                    { type: 'memory.create', name: 'target', dataType: 'int', value: '7' },
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: arr(0, 0, 'comparisons so far: 0') }
                ] },
                { line: 7, message: 'Is nums[0] = 4 the target? No. Move on.', mutations: [
                    { type: 'expression.reduce', text: '4 == 7', note: 'false' },
                    { type: 'extra.set', value: arr(1, 1, 'comparisons so far: 1') },
                    { type: 'memory.set', name: 'i', value: '1' }
                ] },
                { line: 7, message: 'nums[1] = 9? No. nums[2] = 2? No. The checked region grows one cell per comparison.', mutations: [
                    { type: 'expression.reduce', text: '9 == 7, 2 == 7', note: 'both false' },
                    { type: 'extra.set', value: arr(3, 3, 'comparisons so far: 3') },
                    { type: 'memory.set', name: 'i', value: '3' }
                ] },
                { line: 8, predict: { q: 'nums[3] is about to be tested against target 7. If it matches, what does the search do?', choices: ['Keep scanning to double-check the rest', 'Return 3 immediately: the remaining cells are never touched', 'Return -1, then 3 after the loop'], a: 1, why: 'Search returns AT the hit. That early exit is what makes found-early cheap and is exactly the difference from check-all loops, which must keep going.' }, message: 'nums[3] = 7? Yes. Return index 3 and STOP. Total comparisons: 4. Found early means cheap: this is why search loops return inside the if.', mutations: [
                    { type: 'expression.reduce', text: '7 == 7', note: 'true → return 3' },
                    { type: 'extra.set', value: arr(3, 4, 'FOUND at index 3 after 4 comparisons') }
                ] }
            ],
            summary: {
                idea: ['Linear search = visit, test, maybe return. It never needs the data sorted and never skips.', 'Comparison COUNT is the exam currency: position of target decides 1 (best) to n (worst).'],
                mistake: 'Assuming the loop always runs to the end: a found return leaves cells UNVISITED, so side effects (like a counter) miss them too.',
                transfer: 'Same code, target 4. How many comparisons, and which is the ONLY cell ever inspected?'
            }
        },
        {
            label: 'From the far end',
            intro: 'CED allows the walk from EITHER end of the collection.',
            code: `int[] nums = {4, 9, 2, 7, 5};
int target = 7;

for (int i = nums.length - 1; i >= 0; i--)
{
    if (nums[i] == target)
        return i;
}
return -1;`,
            layout: { center: ['extra'], right: ['expression', 'memory'] },
            steps: [
                { line: 4, message: 'Same array, same target, pointer starts at the LAST cell, i = 4.', mutations: [
                    { type: 'memory.create', name: 'target', dataType: 'int', value: '7' },
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '4' },
                    { type: 'extra.set', value: arr(4, 0, 'the checked region grows from the right') }
                ] },
                { line: 7, message: 'nums[4] = 5? No. One comparison wasted, pointer to 3.', mutations: [
                    { type: 'expression.reduce', text: '5 == 7', note: 'false' },
                    { type: 'memory.set', name: 'i', value: '3' },
                    { type: 'extra.set', value: { kind: 'array', name: 'nums', values: VALS, sel: 3, checked: 0, markers: [{ at: 4, label: 'missed' }], note: 'comparisons: 1' } }
                ] },
                { line: 7, predict: { q: 'Target 7 sits at index 3, one cell from the far end. Scanning BACKWARD, how many comparisons until the return?', choices: ['4, same as forward', '2: check index 4, then index 3', '1: backward search starts at the middle'], a: 1, why: 'The walk order changed, so the cost changed. Correctness never did: same index returned, same answer.' }, message: 'nums[3] = 7. Found in 2 comparisons instead of 4: the target happens to sit near this end. Direction changes the COST, never the correctness.', mutations: [
                    { type: 'expression.reduce', text: '7 == 7', note: 'true → return 3' },
                    { type: 'extra.set', value: { kind: 'array', name: 'nums', values: VALS, sel: 3, checked: 0, markers: [{ at: 4, label: 'missed' }], note: 'FOUND from the back after 2 comparisons' } }
                ] }
            ],
            summary: {
                idea: ['Linear search may start from EITHER end; the header for backward is i = length - 1; i >= 0; i--.', 'Ask which END the target lives near to predict the cost.'],
                mistake: 'Backward loops written with i > 0: the first element never gets compared, so a target at index 0 is reported missing.',
                transfer: 'Target 9 (index 1): which direction finds it faster, forward or backward, and with how many comparisons?'
            }
        },
        {
            label: 'Not found',
            intro: 'The only honest worst case: the target is absent, so every cell must answer.',
            code: `int[] nums = {4, 9, 2, 7, 5};
int target = 6;

for (int i = 0; i < nums.length; i++)
{
    if (nums[i] == target)
        return i;
}
return -1;   // the loop finished with no hit`,
            layout: { center: ['extra'], right: ['expression', 'memory'] },
            steps: [
                { line: 2, message: 'Target is 6, which is NOT in the array. There is no early exit available.', mutations: [
                    { type: 'memory.create', name: 'target', dataType: 'int', value: '6' },
                    { type: 'extra.set', value: arr(0, 0, 'comparisons so far: 0') }
                ] },
                { line: 7, predict: { q: 'Target 6 is NOT in the array. How many comparisons are required before the program may answer?', choices: ['About half: n / 2', 'All 5: absence can only be confirmed by a full scan', '0: the loop never runs for a missing target'], a: 1, why: 'Every cell must fail the test before -1 is justified. This is THE worst case of linear search, and the reason absence is the expensive answer.' }, message: '4, 9, 2, 7, 5: five comparisons, five misses. The checked region is the whole array.', mutations: [
                    { type: 'expression.reduce', text: 'none equals 6', note: 'five false' },
                    { type: 'extra.set', value: arr(null, 5, 'worst case: n comparisons') }
                ] },
                { line: 9, message: 'Control falls OUT of the loop and reaches return -1. A search that finds nothing must still answer something: -1 and "not found" are the exam-standard conventions.', mutations: [
                    { type: 'expression.reduce', text: 'return -1', note: 'absent, confirmed by full scan' }
                ] },
                { line: 4, message: 'Best case 1 comparison (target first), worst case n (absent or last), and on average n/2 for a present target. Counting comparisons is what "how many does it take" questions ask for.', mutations: [] }
            ],
            summary: {
                idea: ['Absent is the expensive case: -1 is only earned after every cell has said no.', 'The not-found return lives OUTSIDE the loop; deleting it makes the method fail to compile, which is how exam code quietly signals "found is guaranteed" (it is not).'],
                mistake: 'Putting return -1 INSIDE the loop: the search then quits after the first mismatch instead of scanning.',
                transfer: 'Same loop, target is the last element. How many comparisons, and does the code path differ from the absent case at all?'
            }
        },
        {
            label: '2D & ArrayList',
            intro: 'The same walk stretched over other collections: row by row for grids, get/size for lists.',
            code: `int[][] grid = {{3, 1}, {7, 2}, {5, 9}};
int target = 2;

for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)
        if (grid[r][c] == target)
            return r + "," + c;
return "-1,-1";`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 1, message: 'A 2D linear search is row-by-row: finish row 0 completely before row 1 begins. Target 2 lives at [1][1].', mutations: [
                    { type: 'extra.set', value: g2d([], [0, 0], 'comparisons so far: 0') }
                ] },
                { line: 7, predict: { q: 'Searching row by row for the 2 at [1][1]. How many cells get compared before the return?', choices: ['2: straight to it', '4: all of row 0, then 7, then the hit', '6: a 2D search always scans the whole grid first'], a: 1, why: 'Row-major walk: (0,0), (0,1), (1,0), (1,1). The return fires mid-grid, exactly like the 1D early exit.' }, message: '3? 1? no. Row 0 done, into row 1: 7? no. 2? YES. Return the PAIR (1,1) after 4 comparisons: a 2D search reports coordinates, not an index.', mutations: [
                    { type: 'expression.reduce', text: 'grid[1][1] == 2', note: 'true → return "1,1"' },
                    { type: 'extra.set', value: g2d([[0, 0], [0, 1], [1, 0]], [1, 1], 'FOUND at row 1, col 1') }
                ] },
                { line: 4, message: 'Absent target: rows x columns comparisons, all of them, then return the not-found pair. Worst case for a grid is r * c, the full rectangle.', mutations: [] },
                { line: 4, message: 'On an ArrayList the identical walk uses list.get(i) and list.size() instead of brackets and length, and equals instead of == for objects. Sorted data changes nothing here: linear search never exploits order. That is binary search, in 4.17.', mutations: [] }
            ],
            summary: {
                idea: ['One algorithm, many doors: array [ ], ArrayList get/size, 2D row-by-row. The visit-test-return skeleton never changes.', 'A 2D search answers with a COORDINATE pair and its worst case is rows x columns.'],
                mistake: 'Object lists compared with ==; and "it is sorted so search is faster": sorting means nothing to a linear walk.',
                transfer: 'Searching a 4 x 4 grid for the value in [3][0]: row-major, how many comparisons before the hit?'
            }
        }
    ]
};
