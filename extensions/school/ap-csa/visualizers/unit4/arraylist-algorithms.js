const NUMS = [-2, 4, -1, 7];

function pair(resultValues, sel, note) {
    return {
        kind: 'list',
        name: 'nums',
        values: NUMS,
        sel,
        note,
        second: { kind: 'list', name: 'result', values: resultValues }
    };
}

function solo(sel, note) {
    return { kind: 'list', name: 'nums', values: NUMS, sel, note };
}

export default {
    id: 'u4-arraylist-algorithms',
    meta: { unit: 4, topic: '4.10', title: 'Implementing ArrayList Algorithms', visualizerTitle: 'ArrayList Algorithm Pattern Visualizer' },
    modes: [
        {
            label: 'Filter (build second)',
            intro: 'The filter pattern: read from one collection, build a second one.',
            code: `// Keep only the positive numbers
ArrayList<Integer> result = new ArrayList<Integer>();

for (int n : nums)
{
    if (n > 0)
        result.add(n);
}`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 1, message: 'nums holds [-2, 4, -1, 7]. result starts empty. The enhanced for hands over one value at a time, no index needed: nothing here changes size while it is being read, so for-each is safe.', mutations: [
                    { type: 'extra.set', value: pair([], 0, 'result: empty') }
                ] },
                { line: 6, message: 'n is -2. -2 > 0 is false: nothing is added.', mutations: [
                    { type: 'expression.reduce', text: '-2 > 0', note: 'false, skip' },
                    { type: 'extra.set', value: pair([], 0) }
                ] },
                { line: 7, message: 'n is 4. Positive: result.add(4) appends to the second list.', mutations: [
                    { type: 'expression.reduce', text: '4 > 0', note: 'true, add' },
                    { type: 'extra.set', value: pair([4], 1) }
                ] },
                { line: 6, message: 'n is -1. False, skipped.', mutations: [
                    { type: 'expression.reduce', text: '-1 > 0', note: 'false, skip' },
                    { type: 'extra.set', value: pair([4], 2) }
                ] },
                { line: 7, predict: { q: 'This is the last element. After the add, what does result hold?', choices: ['[4]', '[4, 7]', '[-2, 4, -1, 7]'], a: 1, why: 'Only the positives were ever added, in the order they appeared: filter preserves relative order.' }, message: 'n is 7. Added. result is [4, 7].', mutations: [
                    { type: 'expression.reduce', text: '7 > 0', note: 'true, add' },
                    { type: 'extra.set', value: pair([4, 7], 3, 'final result: [4, 7]') }
                ] },
                { line: 3, message: 'TRANSFORM is the same skeleton with an unconditional add(n * 2) giving [−4, 8, −2, 14]. Filter chooses rows, transform rewrites values: both leave the source untouched and build a SECOND list.', mutations: [] }
            ],
            summary: {
                idea: ['Build-a-second-list patterns read ONE collection and write a DIFFERENT one: the source is guaranteed safe, and for-each is legal because nothing structural changes under the loop.', 'Filter = conditional add; transform = unconditional add of a changed copy.'],
                mistake: 'Trying to filter a list IN PLACE with for-each: the moment you add/remove you leave the safe zone.',
                transfer: 'Same loop, test changed to n < 0, and add(n, not n). What is the final result for nums = [-2, 4, -1, 7]?'
            }
        },
        {
            label: 'Remove matches',
            intro: 'Editing the SAME list while walking it: the size changes under the loop.',
            code: `// Remove every negative, the safe way
for (int i = nums.size() - 1; i >= 0; i--)
{
    if (nums.get(i) < 0)
        nums.remove(i);
}`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 1, message: 'Goal: delete -2 and -1, keep 4 and 7. Reverse walk, because 4.9 proved forward + remove skips elements.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '3' },
                    { type: 'extra.set', value: solo(3, 'size() = 4, start at the back') }
                ] },
                { line: 4, predict: { q: 'remove(2) is about to run. Which cell slides left, and does the loop still check it?', choices: ['7 slides to index 2 and will be re-checked', '7 slides to index 2, but that index is BEHIND the pointer now: already checked, nothing lost', 'Nothing slides: removing from the middle is forbidden'], a: 1, why: 'Reverse walk: every shift lands where the pointer has already been. This is why the mode chose i--.' }, message: 'get(3) is 7, not negative. get(2) is -1: remove(2). List becomes [-2, 4, 7]; the shift touches only index 3, already behind i.', mutations: [
                    { type: 'expression.reduce', text: '-1 < 0', note: 'true → remove(2)' },
                    { type: 'extra.set', value: { kind: 'list', name: 'nums', values: [-2, 4, 7], sel: 1, note: 'size() live-update: now 3' } },
                    { type: 'memory.set', name: 'i', value: '1' }
                ] },
                { line: 4, message: 'get(1) is 4, keep. get(0) is -2: remove(0). Final list [4, 7], both negatives gone, zero skips.', mutations: [
                    { type: 'expression.reduce', text: '-2 < 0', note: 'true → remove(0)' },
                    { type: 'extra.set', value: { kind: 'list', name: 'nums', values: [4, 7], note: 'one pass, all matches removed' } },
                    { type: 'memory.set', name: 'i', value: '-1' }
                ] },
                { line: 4, message: 'Dynamic size is the ArrayList-specific hazard: a cached int n = nums.size() before the loop goes stale the moment you remove. Re-read size() in the condition, or walk backwards.', mutations: [] }
            ],
            summary: {
                idea: ['Editing the SAME list while traversing: reverse indexed loop is the always-safe choice.', 'The question verb decides the tool: REMOVE this list, BUILD another list, or just READ.'],
                mistake: 'Forward indexed removal: every remove(i) pushes a new element into index i, and i++ steps right over it.',
                transfer: 'Remove all evens instead of all negatives from [-2, 4, -1, 7], reverse walk: write the list state after each removal.'
            }
        },
        {
            label: 'Search',
            intro: 'ArrayList linear search: same walk as 4.14, with get() and size().',
            code: `// find the position of target, or -1
for (int i = 0; i < nums.size(); i++)
{
    if (nums.get(i).equals(target))
        return i;
}
return -1;`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 1, message: 'target is -1. Indexed loop this time: search must RETURN a position, and for-each does not have one.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: solo(0, 'target: -1') }
                ] },
                { line: 4, predict: { q: 'This search compares Integers. What goes wrong if the if uses == instead of equals?', choices: ['Nothing; == works for any type', '== compares object IDENTITY, so two Integers with the same value can read as different', 'It will not compile'], a: 1, why: 'The list stores separate Integer OBJECTS. 4.7 warned about exactly this: values need equals, arrows need ==.' }, message: 'get(0) = -2, get(1) = 4, get(2) = -1: match. Return 2. Comparisons: 3.', mutations: [
                    { type: 'expression.reduce', text: 'nums.get(2).equals(-1)', note: 'true → return 2' },
                    { type: 'extra.set', value: solo(2, 'FOUND at index 2') },
                    { type: 'memory.set', name: 'i', value: '2' }
                ] },
                { line: 4, message: 'Use equals, not ==, for Integer targets: == compares object identity and can fail even for equal numbers inside the usual range. This is 4.7 coming back to bite lazy code.', mutations: [] },
                { line: 7, message: 'No match anywhere: fall through to return -1. Worst case touches all size() elements, best case one.', mutations: [] }
            ],
            summary: {
                idea: ['ArrayList search = array search with get(i)/size(): identical walk, different door handles.', 'Objects: equals for value, == for identity. Strings and Integers in collections almost always want equals.'],
                mistake: 'Using for-each for a search that must return a POSITION: the index simply does not exist inside that loop.',
                transfer: 'Rewrite this search for a String ArrayList looking for "apple": what two syntax changes does it need beyond the target?'
            }
        },
        {
            label: 'Count, Sum & Min/Max',
            intro: 'The Unit 2 accumulators, ported to ArrayList: nothing about the pattern changes.',
            code: `int positives = 0;
int sum = 0;
int max = nums.get(0);

for (int n : nums)
{
    if (n > 0) positives++;
    sum += n;
    if (n > max) max = n;
}`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 1, message: 'Three running variables, one pass. positives = 0, sum = 0, and max from get(0): the sentinel rule from 4.5 is unchanged.', mutations: [
                    { type: 'memory.create', name: 'positives', dataType: 'int', value: '0' },
                    { type: 'memory.create', name: 'sum', dataType: 'int', value: '0' },
                    { type: 'memory.create', name: 'max', dataType: 'int', value: '-2' },
                    { type: 'extra.set', value: solo(0) }
                ] },
                { line: 6, message: 'n = -2: not positive, sum stays -2 after adding it, max stays -2. One visit, three bodies, all independent.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '-2' },
                    { type: 'extra.set', value: solo(0) }
                ] },
                { line: 6, message: 'n = 4: positives 1, sum 2, max becomes 4.', mutations: [
                    { type: 'memory.set', name: 'positives', value: '1' },
                    { type: 'memory.set', name: 'sum', value: '2' },
                    { type: 'memory.set', name: 'max', value: '4' },
                    { type: 'extra.set', value: solo(1) }
                ] },
                { line: 6, message: 'n = -1: positives stays 1, sum 1, max stays 4.', mutations: [
                    { type: 'memory.set', name: 'sum', value: '1' },
                    { type: 'extra.set', value: solo(2) }
                ] },
                { line: 6, predict: { q: 'Last element incoming. What will the three variables read when the loop ends?', choices: ['positives 2, sum 8, max 7', 'positives 3, sum 8, max 4', 'positives 2, sum 11, max 7'], a: 0, why: 'Only 4 and 7 are positive (2); -2 + 4 - 1 + 7 = 8; the champion 7 never falls. Three independent bodies, one pass.' }, message: 'n = 7: positives 2, sum 8, max 7. Average would be sum / size() = 8 / 4 = 2.0. Reading only, so enhanced for is the right tool.', mutations: [
                    { type: 'memory.set', name: 'positives', value: '2' },
                    { type: 'memory.set', name: 'sum', value: '8' },
                    { type: 'memory.set', name: 'max', value: '7' },
                    { type: 'extra.set', value: solo(null, 'positives 2 · sum 8 · max 7') }
                ] }
            ],
            summary: {
                idea: ['Accumulators do not care what collection they sit in: the Unit 2 patterns port directly to ArrayList via for-each.', 'One pass can update several INDEPENDENT running variables; each body answers its own question.'],
                mistake: 'max seeded at 0 instead of get(0): same trap as 4.5, different collection.',
                transfer: 'Add a fourth body counting negatives. For [-2, 4, -1, 7], what do positives and negatives read at the end, and why must they be separate tests, not an else?'
            }
        },
        {
            label: 'Adjacent & Insert',
            intro: 'Neighbors and ordered insertion: the two jobs that always need indexes.',
            code: `// count rises: pairs where value grows
for (int i = 0; i < nums.size() - 1; i++)
    if (nums.get(i) < nums.get(i + 1)) rises++;

// insert keeping ascending order
int pos = 0;
while (pos < nums.size() && nums.get(pos) < value)
    pos++;
nums.add(pos, value);`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 2, message: 'ADJACENT: pairs (-2,4) rise, (4,-1) no, (-1,7) rise. rises = 2. The bound size() - 1 exists because get(i + 1) reaches one ahead: at i = size() - 1 that would crash.', mutations: [
                    { type: 'memory.create', name: 'rises', dataType: 'int', value: '2' },
                    { type: 'extra.set', value: solo(2, 'last legal pair is indexes 2 and 3') }
                ] },
                { line: 8, predict: { q: 'Inserting value 3 into [-2, 4, -1, 7] while preserving ascending order up to the first violation. Where does pos stop, and is that even a sorted list?', choices: ['pos = 1; add(1, 3) puts 3 between -2 and 4', 'pos = 0; 3 belongs before everything', 'pos = 4; always append'], a: 0, why: 'The while stops at the first value NOT less than 3, which is 4 at index 1. (Note the exam version of this loop assumes the list IS sorted; this mixed list exposes that the scan only works as intended on sorted data.)' }, message: 'INSERT CONDITIONALLY: new value 3 slides into ascending order. Walk pos forward while get(pos) < 3: -2 yes, 4 no. pos = 1.', mutations: [
                    { type: 'memory.create', name: 'pos', dataType: 'int', value: '1' },
                    { type: 'expression.reduce', text: 'get(1) = 4, not < 3', note: 'stop at pos 1' }
                ] },
                { line: 9, message: 'add(1, 3): nums was [-2, 4, -1, 7], the result is [-2, 3, 4, -1, 7]. add(index, ...) shifts everything from pos onward right by one, the same renumbering as 4.8.', mutations: [
                    { type: 'extra.set', value: { kind: 'list', name: 'nums', values: [-2, 3, 4, -1, 7], sel: 1, note: 'indexed add grew size() to 5' } }
                ] },
                { line: 9, message: 'Pattern map for the whole topic: count/sum/average/min/max/search all READ (for-each fine). Filter/transform BUILD a second list. Remove/insert EDIT this list (indexed, watch size()). Recognize the verb in the question and the loop writes itself.', mutations: [] }
            ],
            summary: {
                idea: ['Adjacent-pair loops bound at size() - 1: the +1 access needs room ahead.', 'Order-preserving insert = scan to the first element that is NOT less, then add(pos, value). The renumbering is add\'s job, not yours.'],
                mistake: 'Forgetting the pos < size() guard in the while: on a value larger than everything, get(pos) runs past the end.',
                transfer: 'Insert 9 into the same list with this loop: where does pos end, and what does the final list look like?'
            }
        }
    ]
};
