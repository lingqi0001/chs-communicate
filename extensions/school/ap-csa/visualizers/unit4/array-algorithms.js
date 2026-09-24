const VALS = [4, 8, 2, 11, 7];

function arr(sel, checked, note) {
    return { kind: 'array', name: 'nums', values: VALS, sel, checked: checked || 0, note };
}

function pair(before, after, sel, note) {
    return {
        kind: 'array', name: 'before', values: before,
        second: { kind: 'array', name: 'after', values: after, sel },
        note
    };
}

export default {
    id: 'u4-array-algorithms',
    meta: { unit: 4, topic: '4.5', title: 'Implementing Array Algorithms', visualizerTitle: 'Array Algorithm Pattern Visualizer' },
    modes: [
        {
            label: 'Sum & Average',
            intro: 'The accumulator pattern: one running variable, one visit per cell.',
            code: `int[] nums = {4, 8, 2, 11, 7};

int sum = 0;
for (int i = 0; i < nums.length; i++)
    sum += nums[i];

double avg = (double) sum / nums.length;`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 3, message: 'sum starts at 0: the identity for addition, the one value that adds nothing before the first cell arrives.', mutations: [
                    { type: 'memory.create', name: 'sum', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: arr(0, 0, 'accumulator starts at 0') }
                ] },
                { line: 5, message: 'Add 4, then 8: sum walks 0 → 4 → 12.', mutations: [
                    { type: 'expression.reduce', text: '0 + 4 + 8', note: 'first two cells' },
                    { type: 'memory.set', name: 'sum', value: '12' },
                    { type: 'extra.set', value: arr(1, 2) }
                ] },
                { line: 5, message: 'Add 2, then 11, then 7: sum ends at 32. One pass, one variable, every cell exactly once.', mutations: [
                    { type: 'expression.reduce', text: '12 + 2 + 11 + 7 = 32' },
                    { type: 'memory.set', name: 'sum', value: '32' },
                    { type: 'extra.set', value: arr(null, 5, 'processed: everything') }
                ] },
                { line: 7, predict: { q: 'If the last line were just sum / nums.length with no cast, what would avg hold?', choices: ['6.4', '6.0, because int division truncates to 6 first', '32.0'], a: 1, why: 'int / int produces an int by TRUNCATING, and the conversion to double comes too late. Cast one side BEFORE dividing.' }, message: 'Average divides by LENGTH, not by the last index: 32 / 5 = 6.4. The (double) cast matters: sum / nums.length with both ints would truncate to 6.', mutations: [
                    { type: 'expression.reduce', text: '(double) 32 / 5', note: '6.4, not 6' },
                    { type: 'memory.create', name: 'avg', dataType: 'double', value: '6.4' }
                ] }
            ],
            summary: {
                idea: ['The accumulator starts at the IDENTITY of its operation: sum at 0, count at 0, product at 1, max at arr[0].', 'Average = sum / length with a cast: the divide is where int-truncation traps live.'],
                mistake: 'Dividing by length - 1, or writing (double)(sum / length): the cast must happen BEFORE the division.',
                transfer: 'Rewrite the loop to compute the PRODUCT of all elements. What is the correct initial value of the accumulator, and why is 0 wrong?'
            }
        },
        {
            label: 'Count & Check',
            intro: 'Counter: add 1 when a test passes. Check all / check any: one visit decides the answer.',
            code: `int[] nums = {4, 8, 2, 11, 7};

// COUNT matches
int count = 0;
for (int n : nums)
    if (n % 2 == 0) count++;

// CHECK all are positive
for (int n : nums)
    if (n < 0) return false;
return true;`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 4, message: 'count starts at 0 and only the if decides whether it moves. The loop and the test are two separate jobs.', mutations: [
                    { type: 'memory.create', name: 'count', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: arr(0, 0, 'count evens: test is n % 2 == 0') }
                ] },
                { line: 6, message: '4 even → 1. 8 even → 2. 2 even → 3. 11 odd, no change. 7 odd, no change. count = 3.', mutations: [
                    { type: 'memory.set', name: 'count', value: '3' },
                    { type: 'extra.set', value: arr(null, 5, 'three cells passed the test') }
                ] },
                { line: 10, message: 'CHECK ALL positive: 4, 8, 2 pass, and so on. The answer flips to false only when a violation appears, and the return exits at the FIRST violation without visiting the rest.', mutations: [
                    { type: 'extra.set', value: arr(0, 0, 'check-all: one counterexample is enough to stop') }
                ] },
                { line: 10, predict: { q: 'CHECK ANY value greater than 10. At which cell does this loop exit early?', choices: ['Cell 1, value 8', 'Cell 3, value 11', 'It cannot exit early; the whole array is scanned'], a: 1, why: 'Check-any returns at the FIRST witness: 4, 8, 2 all fail, 11 passes, done. Cell 4 is never looked at.' }, message: 'CHECK ANY greater than 10: 4 no, 8 no, 2 no, 11 YES → return true immediately. Check-all and check-any are mirror images; both may end early.', mutations: [
                    { type: 'expression.reduce', text: '11 > 10', note: 'check-any exits true at cell 3' }
                ] }
            ],
            summary: {
                idea: ['Counter = loop + conditional ++; the if decides, the loop just visits.', 'Check-ALL hunts one counterexample; check-ANY hunts one witness. Mirror conditions, both can stop early.'],
                mistake: 'Reversing the return-after-loop: check-all ends TRUE (no counterexample found), check-any ends FALSE (no witness found).',
                transfer: 'Write the test line for "any cell is even", and separately "all cells are positive". Which one uses % 2 == 0 and which uses < 0?'
            }
        },
        {
            label: 'Min & Max',
            intro: 'The running champion: keep the best seen so far, challenge it once per cell.',
            code: `int[] nums = {4, 8, 2, 11, 7};

int max = nums[0];

for (int i = 1; i < nums.length; i++)
{
    if (nums[i] > max)
        max = nums[i];
}`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 3, predict: { q: 'Suppose max were initialized to 0 and every value in nums were NEGATIVE. What would the method return?', choices: ['Still the correct maximum', '0, a value that is not even in the array', 'It crashes'], a: 1, why: 'No negative ever beats the fake champion 0. This exact trap is why the sentinel must come FROM the data: max = nums[0].' }, message: 'max starts as nums[0], not 0. A sentinel from the data itself keeps the algorithm correct even when every value is negative. (It does assume the array has at least one element: that is the boundary case the FRQ rubric expects you to notice.)', mutations: [
                    { type: 'memory.create', name: 'max', dataType: 'int', value: '4' },
                    { type: 'extra.set', value: arr(0, 1, 'processed: cell 0 (the champion)') }
                ] },
                { line: 7, message: 'Challenge 1: nums[1] is 8. 8 > 4, so the champion changes to 8.', mutations: [
                    { type: 'expression.reduce', text: '8 > 4', note: 'true' },
                    { type: 'memory.set', name: 'max', value: '8' },
                    { type: 'extra.set', value: arr(1, 2) }
                ] },
                { line: 7, message: 'Challenge 2: nums[2] is 2. 2 > 8 is false, max stays 8.', mutations: [
                    { type: 'expression.reduce', text: '2 > 8', note: 'false' },
                    { type: 'extra.set', value: arr(2, 3) }
                ] },
                { line: 7, message: 'Challenge 3: 11 > 8, true. max becomes 11. Challenge 4: 7 > 11, false. Loop ends with max = 11.', mutations: [
                    { type: 'expression.reduce', text: '11 > 8 → true', note: 'then 7 > 11 → false' },
                    { type: 'memory.set', name: 'max', value: '11' },
                    { type: 'extra.set', value: arr(4, 5, 'every cell has challenged the champion') }
                ] },
                { line: 7, message: 'Flip > to <, flip true and false answers, and the identical skeleton is minimum. Duplicates change nothing: strict > keeps the FIRST copy as champion.', mutations: [] }
            ],
            summary: {
                idea: ['Running champion: one challenger per cell, and the champion only changes on a STRICT beat.', 'Initialize from the data (arr[0]), never from a made-up constant.'],
                mistake: 'Using >= instead of >: it then reports the LAST copy of the maximum instead of the first, quietly changing tie behavior.',
                transfer: 'Same loop, but you want the index of the largest value, ties broken toward the earliest. Which comparison sign do you keep, and what extra variable do you add?'
            }
        },
        {
            label: 'Find First',
            intro: 'Search is min/max with an index answer: return the position, or -1 for absent.',
            code: `int[] nums = {4, 8, 2, 11, 7};

for (int i = 0; i < nums.length; i++)
{
    if (nums[i] > 8)
        return i;      // first match wins
}
return -1;             // never matched`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 5, message: 'Probe 4: 4 > 8 false, continue.', mutations: [
                    { type: 'expression.reduce', text: '4 > 8', note: 'false' },
                    { type: 'extra.set', value: arr(0, 1) }
                ] },
                { line: 5, predict: { q: 'Change the test to nums[i] >= 8. What would the method return now?', choices: ['3, same as before', '1, because the 8 itself now satisfies the test', '-1, because equals never triggers returns'], a: 1, why: '>= promotes the cell-1 value 8 from "fails" to "matches", and find-first returns the FIRST match. One boundary symbol, a different answer.' }, message: 'Probe 8: 8 > 8 false. Strict inequality: an exact 8 does not count. This is the most common wrong-boundary on the exam.', mutations: [
                    { type: 'expression.reduce', text: '8 > 8', note: 'false: strict' },
                    { type: 'extra.set', value: arr(1, 2) }
                ] },
                { line: 5, message: 'Probe 2: false. Probe 11: true. Return 3 right now. Cells 4 is never looked at: find-first ends at the first hit.', mutations: [
                    { type: 'expression.reduce', text: '11 > 8', note: 'true → return 3' },
                    { type: 'extra.set', value: arr(3, 4, 'FOUND first match at index 3, loop never reached cell 4') }
                ] },
                { line: 8, message: 'If the test had failed everywhere, the loop falls through to return -1. -1 is a convention, not a Java rule: FRQs define the absent answer, read it.', mutations: [] }
            ],
            summary: {
                idea: ['Find-first = the champion loop but the answer is an INDEX, and the return happens INSIDE the if.', 'Whatever comes after the loop is the "not found" path; the FRQ prompt, not Java, decides what it must be.'],
                mistake: 'Forgetting the early return and keeping scan after a match: still correct, but then "returns the LAST match" behavior surprises people.',
                transfer: 'Rewrite it to return the index of the LAST value greater than 8, no early exit. Which line do you delete and which variable replaces the return?'
            }
        },
        {
            label: 'Replace Values',
            intro: 'Reading loops answer questions. Writing loops change the array: watch which cells move.',
            code: `int[] nums = {4, 8, 2, 11, 7};

for (int i = 0; i < nums.length; i++)
{
    if (nums[i] < 8)
        nums[i] = 0;
}`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 3, message: 'Mission: every value below 8 becomes 0. The array itself is written, so a BEFORE/AFTER pair is the only honest view.', mutations: [
                    { type: 'extra.set', value: pair([4, 8, 2, 11, 7], [4, 8, 2, 11, 7], 0, 'before = after until the first write lands') }
                ] },
                { line: 6, message: 'Cell 0: 4 < 8 true, nums[0] = 0. The after row already differs while the loop is still running.', mutations: [
                    { type: 'extra.set', value: pair([4, 8, 2, 11, 7], [0, 8, 2, 11, 7], 1) }
                ] },
                { line: 6, predict: { q: 'Before the final write lands: why does after[1] still show the ORIGINAL 8 while other cells already changed?', choices: ['Because 8 < 8 is false, so that cell is never written', 'Because the loop skips index 1', 'Because writes happen all at once at the end'], a: 0, why: 'The boundary value fails the strict test. Note also the shape: BEFORE and AFTER differ cell by cell, in place, one pass.' }, message: 'Cell 1: 8 < 8 false, untouched. Cell 2: 2 < 8, zero it. Cell 3: 11 no. Cell 4: 7 yes.', mutations: [
                    { type: 'expression.reduce', text: '8 < 8? false', note: 'equal is not less' },
                    { type: 'extra.set', value: pair([4, 8, 2, 11, 7], [0, 8, 0, 11, 0], null, 'before: [4,8,2,11,7] → after: [0,8,0,11,0]') }
                ] },
                { line: 6, message: 'Write-back needs the INDEX loop: nums[i] = ... has no meaning in an enhanced for, where n is a copy. This is the practical reason 4.4 keeps both loop forms.', mutations: [] }
            ],
            summary: {
                idea: ['A modify loop writes nums[i] on the LEFT side and changes ONE array in place: before/after share indexes, changed cells are exactly the ones that passed the test.'],
                mistake: 'Thinking an enhanced for can modify the array: updating the copy variable leaves the data untouched.',
                transfer: 'Condition flipped to nums[i] <= 8: which additional cell changes, and what does the after row become?'
            }
        },
        {
            label: 'Neighbors, Shift & Transform',
            intro: 'The next step up: cells compared with other cells, or copied somewhere else.',
            code: `int[] nums = {4, 8, 2, 11, 7};
int[] out = new int[nums.length];
int rises = 0;

for (int i = 0; i < nums.length - 1; i++)
    if (nums[i] < nums[i + 1]) rises++;

for (int i = 0; i < nums.length; i++)
    out[i] = nums[i] * 2;`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 4, predict: { q: 'Why does the neighbor loop run only to nums.length - 1 (strictly less)?', choices: ['To make the loop faster', 'Because nums[i + 1] reaches one cell AHEAD; at i = length - 1 it would be out of bounds', 'The final element is never part of any pair'], a: 1, why: 'The last legal pair is (length - 2, length - 1). Neighbor loops trade one iteration for a safe +1 access.' }, message: 'COMPARE NEIGHBORS: pair each cell with the one after it. The loop stops at length - 1 because nums[i + 1] would reach one past the end. 4<8 yes, 8<2 no, 2<11 yes, 11<7 no: rises = 2.', mutations: [
                    { type: 'memory.create', name: 'rises', dataType: 'int', value: '2' },
                    { type: 'extra.set', value: arr(3, 4, 'last pair is cells 3 and 4: i never reaches 4') }
                ] },
                { line: 9, message: 'BUILD TRANSFORMED: a SECOND array receives nums[i] * 2. Original untouched, so the before/after pair is really source/result.', mutations: [
                    { type: 'extra.set', value: pair([4, 8, 2, 11, 7], [8, 16, 4, 22, 14], null, 'source stays, result is built') },
                    { type: 'expression.reduce', text: 'out[i] = nums[i] * 2', note: 'same index in both arrays' }
                ] },
                { line: 9, message: 'SHIFT: nums[i] = nums[i + 1] copies left, dropping the first value and duplicating the last, unless you set the last cell separately. Forward shift erases data as it goes; that is why removal from an array is so much trouble next to ArrayList.remove.', mutations: [
                    { type: 'extra.set', value: pair([4, 8, 2, 11, 7], [8, 2, 11, 7, 7], null, 'shift left once: 4 gone, final 7 duplicated') }
                ] },
                { line: 4, message: 'Pattern library, whole family at a glance: sum/average (accumulator), count/check (conditional counter), min/max (champion), find-first (return index), replace (write), neighbors (i and i+1), shift (copy over), transform (copy across). Same traversal skeleton, different one-line body.', mutations: [] }
            ],
            summary: {
                idea: ['Two-array work (transform) keeps source and result SEPARATE and same length; one-array work (shift) overwrites cells and destroys what was there.', 'Neighbor loops stop one early because of the +1 access, not because the last cell is unimportant.'],
                mistake: 'Shifting left with nums[i] = nums[i + 1] and then being surprised that the last cell is duplicated: the value that should leave was overwritten on the way.',
                transfer: '"Count how many times the temperature rises from one day to the next": which pattern is that, and what is the exact loop header for n days?'
            }
        }
    ]
};
