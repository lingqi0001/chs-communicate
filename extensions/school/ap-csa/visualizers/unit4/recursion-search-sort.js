const WORDS = ['A', 'B', 'C'];
const VALS = [1, 3, 5, 8, 12, 17, 21];

function wordArr(opts) {
    return { kind: 'array', name: 'a', values: WORDS, ...opts };
}

function bsearch(opts) {
    return { kind: 'array', name: 'vals', values: VALS, ...opts };
}

const MERGE_TREE = {
    id: 'n0', text: '[8, 3, 6, 1]',
    children: [
        { node: { id: 'n1', text: '[8, 3]', children: [
            { node: { id: 'n3', text: '[8]' } },
            { node: { id: 'n4', text: '[3]' } }
        ] } },
        { node: { id: 'n2', text: '[6, 1]', children: [
            { node: { id: 'n5', text: '[6]' } },
            { node: { id: 'n6', text: '[1]' } }
        ] } }
    ]
};

function tree(visited, active, note) {
    return { kind: 'flow', root: MERGE_TREE, visited, active, note };
}

export default {
    id: 'u4-recursion-search-sort',
    meta: { unit: 4, topic: '4.17', title: 'Recursive Searching and Sorting', visualizerTitle: 'Recursive Algorithms Visualizer' },
    modes: [
        {
            label: 'Recursive Traversal',
            intro: 'A recursive method can walk a whole collection with no loop at all. The index parameter is the counter, the call stack is the loop.',
            code: `// printReverse: recurse first, print on the way back
void printReverse(String[] a, int i)
{
    if (i == a.length) return;
    printReverse(a, i + 1);
    System.out.println(a[i]);
}`,
            layout: { center: ['extra'], right: ['stack', 'console'] },
            steps: [
                { line: 4, message: 'ENTER printReverse(a, 0). Base case check: i == a.length means 0 == 3, false. The frame is pushed with its own copy of i.', mutations: [
                    { type: 'stack.push', label: 'printReverse(a, 0)', vars: [{ name: 'i', value: '0' }] },
                    { type: 'extra.set', value: wordArr({ sel: 0, markers: [{ at: 0, label: 'i = 0' }], note: 'each frame carries its own i: recursion replaces the loop counter' }) }
                ] },
                { line: 5, message: 'Before frame 0 can print, it calls printReverse(a, 1) and pauses at line 5. Its println is waiting, not forgotten.', mutations: [
                    { type: 'stack.push', label: 'printReverse(a, 1)', vars: [{ name: 'i', value: '1' }] },
                    { type: 'extra.set', value: wordArr({ sel: 1, markers: [{ at: 0, label: 'waiting' }, { at: 1, label: 'i = 1' }] }) }
                ] },
                { line: 5, message: 'Frame 1 does the same: calls printReverse(a, 2) and pauses. The stack is three frames deep, indexes 0, 1, 2 each stored in their own frame.', mutations: [
                    { type: 'stack.push', label: 'printReverse(a, 2)', vars: [{ name: 'i', value: '2' }] },
                    { type: 'extra.set', value: wordArr({ sel: 2, markers: [{ at: 0, label: 'waiting' }, { at: 1, label: 'waiting' }, { at: 2, label: 'i = 2' }] }) }
                ] },
                { line: 4, message: 'Frame 2 calls printReverse(a, 3). NOW i == a.length is true: base case. This frame returns immediately without printing anything. Without it, the calls would never stop.', mutations: [
                    { type: 'stack.push', label: 'printReverse(a, 3)', vars: [{ name: 'i', value: '3' }] },
                    { type: 'expression.reduce', text: '3 == 3 → TRUE', note: 'base case hit' }
                ] },
                { line: 6, predict: { q: 'The base-case frame just returned. Frames 0 to 2 are parked mid-call, each with a println waiting AFTER the recursive call. The first printed letter will be...', choices: ['A, the first cell', 'C: the DEEPEST waiting print fires first, on the way back up', 'Nothing more prints'], a: 1, why: 'print-after-call means output happens during unwinding: last frame in, first print out. Order is the reverse of the calls.' }, message: 'UNWIND. Frame 3 pops. Control returns to frame 2, resuming right after its recursive call, at the waiting println on line 6.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'extra.set', value: wordArr({ sel: 2, markers: [{ at: 0, label: 'waiting' }, { at: 1, label: 'waiting' }, { at: 2, label: 'print now' }] }) }
                ] },
                { line: 6, message: 'Frame 2 prints a[2], the letter C, then returns. Notice output starts from the LAST index even though calls started from the first.', mutations: [
                    { type: 'console.print', text: 'C' },
                    { type: 'stack.pop' },
                    { type: 'extra.set', value: wordArr({ markers: [{ at: 0, label: 'waiting' }, { at: 1, label: 'waiting' }, { at: 2, label: 'printed' }] }) }
                ] },
                { line: 6, message: 'Frame 1 resumes, prints a[1], and pops. The unwinding prints each waiting println in reverse call order.', mutations: [
                    { type: 'console.print', text: 'B' },
                    { type: 'stack.pop' },
                    { type: 'extra.set', value: wordArr({ markers: [{ at: 0, label: 'waiting' }, { at: 1, label: 'printed' }, { at: 2, label: 'printed' }] }) }
                ] },
                { line: 6, message: 'Frame 0 finally prints a[0] and pops. Console shows C, B, A: the array printed backwards with no loop anywhere.', mutations: [
                    { type: 'console.print', text: 'A' },
                    { type: 'stack.pop' },
                    { type: 'extra.set', value: wordArr({ markers: [{ at: 0, label: 'printed' }, { at: 1, label: 'printed' }, { at: 2, label: 'printed' }], note: 'output order is the reverse of call order' }) }
                ] },
                { line: 5, message: 'Move println BEFORE the recursive call and the same frames print A, B, C: forward. On the exam, one question: does the print happen on the way down (call order) or on the way back (reverse)?', mutations: [
                    { type: 'expression.reduce', text: 'print before call → forward', note: 'print after call → reverse' }
                ] }
            ],
            summary: {
                idea: ['The index PARAMETER is the loop counter, the CALL STACK is the loop: recursion traverses with no for anywhere.', 'Position of the action relative to the recursive call decides output order: before = same as calls, after = reversed.'],
                mistake: 'Assuming prints happen when frames are CREATED. A println after the call waits for everything below it to finish first.',
                transfer: 'Same method but println moved above the recursive call, and the base case unchanged. Predict the exact output before mentally running it.'
            }
        },
        {
            label: 'Binary Search',
            intro: 'Binary search requires the collection to already be sorted. Each comparison throws away half of what is left.',
            code: `// BINARY SEARCH (sorted array required)
int mid = (low + high) / 2;
if (vals[mid] == target) return mid;
else if (vals[mid] < target)
    return binarySearch(mid + 1, high, target);
else
    return binarySearch(low, mid - 1, target);`,
            layout: { center: ['extra'], right: ['stack', 'expression'] },
            steps: [
                { line: 2, message: 'low = 0, high = 6, so mid = (0 + 6) / 2 = 3, value 8. Target is 17. First probe lands in the middle.', mutations: [
                    { type: 'extra.set', value: bsearch({ sel: 3, markers: [{ at: 0, label: 'low' }, { at: 3, label: 'mid' }, { at: 6, label: 'high' }], note: 'target 17: first probe at the middle' }) },
                    { type: 'stack.push', label: 'binarySearch(0, 6)', vars: [{ name: 'mid', value: '3 → 8' }] }
                ] },
                { line: 4, predict: { q: 'mid holds 8 and the target is 17. Which part of the array is now provably useless?', choices: ['Indexes 0 through 3: everything at or left of mid', 'Indexes 4 through 6: everything right of mid', 'Nothing: half cannot be thrown away without more checks'], a: 0, why: 'Sorted order is what makes the discard LEGAL: 17 greater than 8 means it cannot hide left of mid. One comparison, four cells eliminated.' }, message: '8 < 17, so the target can only be to the right. Indexes 0 to 3 are thrown away in one comparison. A linear search would still need six more checks.', mutations: [
                    { type: 'expression.reduce', text: '8 < 17', note: 'discard the left half' },
                    { type: 'extra.set', value: bsearch({ checked: 4, markers: [{ at: 4, label: 'low' }, { at: 5, label: 'mid' }, { at: 6, label: 'high' }], note: 'half the array gone after 1 comparison' }) }
                ] },
                { line: 2, message: 'New range 4 to 6: mid = 5, value 17. Equal: return 5. Two comparisons total, and each one halved the work.', mutations: [
                    { type: 'stack.push', label: 'binarySearch(4, 6)', vars: [{ name: 'mid', value: '5 → 17' }] },
                    { type: 'extra.set', value: bsearch({ checked: 4, sel: 5, markers: [{ at: 6, label: 'high' }], note: 'FOUND at index 5 after 2 comparisons' }) }
                ] },
                { line: 3, message: 'Each frame tested one middle and returned an index or a smaller range. Halving means about log2(n) comparisons: 7 cells in 2 probes, 1000 cells in about 10. Sorted order is the price of admission.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'stack.pop' }
                ] }
            ],
            summary: {
                idea: ['Each recursion keeps ONE comparison but rewrites [low, high] to half its size: the eliminated half is never looked at again.', 'mid = (low + high) / 2 rounds DOWN: even ranges lean their probe left.'],
                mistake: 'Running binary search on unsorted data: the discard rule is a PROOF about order, and without order it eliminates the answer itself.',
                transfer: 'Same array, target 12. Give the three probes (mid index, mid value, keep-left or keep-right) before running it.'
            }
        },
        {
            label: 'Merge Sort',
            intro: 'Merge sort splits the array all the way down to single elements, then merges sorted pieces back up.',
            code: `// MERGE SORT: split, then merge sorted halves
void mergeSort(int[] a)
{
    if (a.length < 2) return;   // base case
    mergeSort(left);
    mergeSort(right);
    merge(left, right);         // two pointers
}`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 4, message: 'SPLIT PHASE. Recursion cuts the array in half until every piece has one element. A single element is already sorted: that is the base case.', mutations: [
                    { type: 'extra.set', value: tree(['n0'], 'n0', 'split until pieces have one element') }
                ] },
                { line: 4, predict: { q: 'The split keeps cutting. Where does it STOP, and why is that the right place?', choices: ['When pieces have 2 elements: pairs are easy to order', 'When every piece has ONE element: a single value is already sorted by definition', 'When both halves happen to be sorted'], a: 1, why: 'One element is the base case precisely because it needs no comparison. From there, only merging is left.' }, message: 'Fully split: four one-element arrays. Nothing has been reordered yet, only divided.', mutations: [
                    { type: 'extra.set', value: tree(['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6'], 'n6') }
                ] },
                { line: 7, message: 'MERGE PHASE: [8] + [3] compare once, output [3, 8]. [6] + [1] becomes [1, 6]. Each merge walks two sorted pieces with two pointers, always taking the smaller head.', mutations: [
                    { type: 'expression.reduce', text: '[8]+[3] → [3,8]', note: '3 < 8' },
                    { type: 'extra.set', value: tree(['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6'], 'n1', 'merge sorted pairs back together') }
                ] },
                { line: 7, message: 'Final merge: [3,8] + [1,6] → 1, 3, 6, 8. Every element moved through log levels, n elements per level: reliable n log n work, no lucky or unlucky input.', mutations: [
                    { type: 'expression.reduce', text: '[3,8]+[1,6] → [1,3,6,8]' },
                    { type: 'extra.set', value: tree(['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6'], 'n0', 'merged: [1, 3, 6, 8]') }
                ] }
            ],
            summary: {
                idea: ['Two DISTINCT phases: recursion SPLITS to one-element base cases, then MERGES sorted pairs, always taking the smaller head.', 'The tree remembers the split order; the merge climbs it back up. Given a mid-run state, the level of the pieces tells you how far along you are.'],
                mistake: 'Expecting merge sort to reorder DURING the split. Nothing moves until the first merge.',
                transfer: 'The trace shows pieces [1, 3] and [6, 8] about to merge. Which two heads are compared first, and which four-way merge state comes one step later?'
            }
        }
    ]
};
