const VALS = [4, 8, 2, 7];

function arr(sel, checked, note) {
    return { kind: 'array', name: 'nums', values: VALS, sel, checked: checked || 0, note };
}

function visit(i, out) {
    return [
        { type: 'memory.set', name: 'i', dataType: 'int', value: String(i) },
        { type: 'extra.set', value: arr(i, i) },
        { type: 'console.print', text: String(out) }
    ];
}

export default {
    id: 'u4-array-traversal',
    meta: { unit: 4, topic: '4.4', title: 'Array Traversals', visualizerTitle: 'Array Traversal Visualizer' },
    modes: [
        {
            label: 'Indexed for',
            intro: 'The loop variable is an index. The array cell it points at is the value. Keep them separate.',
            code: `int[] nums = {4, 8, 2, 7};

for (int i = 0; i < nums.length; i++)
{
    System.out.println(nums[i]);
}`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 1, message: 'The literal syntax fills the cells directly: length is 4, so the valid indexes are 0 to 3.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: arr(0, 0, 'i = 0, so the pointer sits on nums[0]') }
                ] },
                { line: 5, message: 'Round 1: i is 0, the loop prints nums[0], which is 4. The console shows 4.', mutations: visit(0, 4) },
                { line: 5, message: 'Round 2: i = 1, print nums[1] = 8. Notice i itself is never 8; it is the mailbox number, not the letter.', mutations: visit(1, 8) },
                { line: 5, message: 'Round 3: i = 2, print 2.', mutations: visit(2, 2) },
                { line: 5, message: 'Round 4: i = 3, print 7. Every cell has now been visited exactly once. The console is the iteration history.', mutations: visit(3, 7) },
                { line: 3, predict: { q: 'What if the condition were written i <= nums.length instead of i < nums.length?', choices: ['One extra round printing 0', 'Crash at nums[4], out of bounds', 'No difference at all'], a: 1, why: 'When i reaches 4 the condition now passes, but there is no cell 4. The < is exactly what makes the loop stop BEFORE the illegal access.' }, message: 'i becomes 4. The check 4 < nums.length fails, the loop exits. Writing <= instead would try nums[4] and crash: the classic off-by-one.', mutations: [
                    { type: 'memory.set', name: 'i', dataType: 'int', value: '4' },
                    { type: 'extra.set', value: arr(null, 4, '4 < 4 is false: exit before touching nums[4]') }
                ] }
            ],
            summary: {
                idea: ['i is the mailbox NUMBER; nums[i] is the LETTER inside it. The loop condition i < length is the guard that stops before the illegal cell.', 'Every round: check condition, run body, update i. The final failed check is part of the loop, not wasted.'],
                mistake: 'Printing i when the question wants the VALUE nums[i], or using <= length and calling the crash "random".',
                transfer: 'Change the loop to print only the last TWO elements. What are the initial value and the condition of i?'
            }
        },
        {
            label: 'Enhanced for',
            intro: 'for (int n : nums) hands you each value with no index at all.',
            code: `int[] nums = {4, 8, 2, 7};

for (int n : nums)
{
    System.out.println(n);
}`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 3, message: 'The enhanced for creates one variable, n. There is NO i, no length check written by you, no way to ask "which cell is this".', mutations: [
                    { type: 'memory.create', name: 'n', dataType: 'int', value: '4' },
                    { type: 'extra.set', value: arr(0, 0, 'no index variable exists in this loop') }
                ] },
                { line: 5, message: 'Round 1 prints n, which is 4. The pointer advanced without you counting.', mutations: [
                    { type: 'console.print', text: '4' },
                    { type: 'memory.set', name: 'n', value: '8' },
                    { type: 'extra.set', value: arr(1, 1) }
                ] },
                { line: 5, message: 'Round 2: n = 8, print 8.', mutations: [
                    { type: 'console.print', text: '8' },
                    { type: 'memory.set', name: 'n', value: '2' },
                    { type: 'extra.set', value: arr(2, 2) }
                ] },
                { line: 5, message: 'Rounds 3 and 4: n = 2, then n = 7. Output matches the indexed loop exactly.', mutations: [
                    { type: 'console.print', text: '2' },
                    { type: 'console.print', text: '7' },
                    { type: 'memory.set', name: 'n', value: '7' },
                    { type: 'extra.set', value: arr(null, 4, 'every value handed over, left to right') }
                ] },
                { line: 3, predict: { q: 'Could this enhanced for loop CHANGE the values inside nums?', choices: ['Yes: n is the element itself', 'No: n is a copy of each value; writing n changes nothing in the array', 'Only the first element can be changed'], a: 1, why: 'for-each hands you a fresh copy of each value, with no index to write back through. Changing the collection needs the indexed loop.' }, message: 'When you only READ values, enhanced for is cleaner. When you need positions, order, neighbors, or to WRITE back (nums[i] = ...), you must use the indexed loop. Changing n changes only the copy, never the array.', mutations: [] }
            ],
            summary: {
                idea: 'Enhanced for gives you the VALUE but never the POSITION: perfect for reading, impossible for writing or index work.',
                mistake: 'Writing n = 0 inside for (int n : nums) and believing the array was zeroed.',
                transfer: 'Task: double every element of nums. Which of the two loop forms can do it, and why can the other not?'
            }
        },
        {
            label: 'Reverse & partial',
            intro: 'Traversal direction and start/stop points are loop choices, not array rules.',
            code: `for (int i = nums.length - 1; i >= 0; i--)
    System.out.println(nums[i]);

// partial: for (int i = 1; i < 3; i++)`,
            layout: { center: ['extra'], right: ['memory', 'console'] },
            steps: [
                { line: 1, message: 'REVERSE: start the pointer at the last cell, i = nums.length - 1 = 3, and count DOWN to 0.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '3' },
                    { type: 'extra.set', value: arr(3, 0, 'same array, walking right to left') }
                ] },
                { line: 2, message: 'Print 7, then i-- lands on 2.', mutations: [
                    { type: 'console.print', text: '7' },
                    { type: 'memory.set', name: 'i', value: '2' },
                    { type: 'extra.set', value: arr(2, 0, 'checked region grows from the right') }
                ] },
                { line: 2, message: 'Print 2, then i = 1.', mutations: [
                    { type: 'console.print', text: '2' },
                    { type: 'memory.set', name: 'i', value: '1' },
                    { type: 'extra.set', value: arr(1, 0) }
                ] },
                { line: 2, message: 'Print 8, then 4. Output is 7 2 8 4, exactly the reverse. Watch the condition: i >= 0, not i > 0, or nums[0] never gets visited.', mutations: [
                    { type: 'console.print', text: '8' },
                    { type: 'console.print', text: '4' },
                    { type: 'memory.set', name: 'i', value: '-1' },
                    { type: 'extra.set', value: arr(null, 4, 'i = -1 fails i >= 0: loop ends, no crash') }
                ] },
                { line: 4, predict: { q: 'Partial window: the loop header is for (int i = 1; i < 3; i++). Which cells get printed?', choices: ['4 8 2', '8 2', '8 2 7'], a: 1, why: 'Start at index 1, stop BEFORE index 3: exactly cells 1 and 2. Traversal is not all-or-nothing; the header picks the window.' }, message: 'PARTIAL: starting at 1 and stopping before 3 covers only cells 1 and 2, printing 8 then 2. Traversal is not all-or-nothing: the init and the condition pick the window.', mutations: [
                    { type: 'memory.set', name: 'i', value: '1' },
                    { type: 'extra.set', value: arr(1, 0, 'window: i = 1, 2 only') },
                    { type: 'console.print', text: '8' },
                    { type: 'console.print', text: '2' }
                ] },
                { line: 4, message: 'Skipping the first or last cell is how off-by-one bugs are born: i < length misses nothing, i <= length crashes, i < length - 1 skips the last, i starts at 1 skips the first. Read all four loop parts before predicting output.', mutations: [] }
            ],
            summary: {
                idea: ['Direction, start and stop are LOOP choices, not array rules. Reverse = init at length - 1, condition i >= 0, update i--.', 'i >= 0 vs i > 0 is the difference between printing nums[0] and silently losing it.'],
                mistake: 'Reverse loops written with i > 0, or partial windows that forget the condition stops BEFORE the value written.',
                transfer: 'For an array of length n: to compare every NEIGHBOR pair (i, i+1), where must the loop stop, and why?'
            }
        }
    ]
};
