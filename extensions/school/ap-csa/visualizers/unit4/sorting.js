function arr(values, opts) {
    return { kind: 'array', name: 'a', values, ...opts };
}

export default {
    id: 'u4-sorting',
    meta: { unit: 4, topic: '4.15', title: 'Sorting Algorithms', visualizerTitle: 'Selection & Insertion Sort Visualizer' },
    modes: [
        {
            label: 'Selection Sort',
            intro: 'Selection sort grows the sorted zone one slot at a time: scan the rest for the smallest, swap it into place.',
            code: `// SELECTION SORT: find the min, swap it into place
for (int i = 0; i < a.length - 1; i++)
{
    int min = i;
    for (int j = i + 1; j < a.length; j++)
        if (a[j] < a[min]) min = j;
    swap(a, i, min);   // a[0..i] is final now
}`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 2, message: 'Pass 1. The divider is at index 0: everything left of it is final. Scan the rest for the smallest value.', mutations: [
                    { type: 'extra.set', value: arr([8, 3, 6, 1, 5], { sorted: 0, markers: [{ at: 0, label: 'slot' }, { at: 0, label: 'min' }], note: 'left of the divider: locked forever' }) }
                ] },
                { line: 6, message: 'The scan: 3 < 8, min moves to 1. Then 6 no, then 1 < 3, min moves to 3. Then 5 no. Smallest is 1 at index 3.', mutations: [
                    { type: 'extra.set', value: arr([8, 3, 6, 1, 5], { sorted: 0, checked: 5, markers: [{ at: 0, label: 'slot' }, { at: 3, label: 'min' }] }) }
                ] },
                { line: 7, predict: { q: 'The scan found 1 at index 3 while slot 0 holds 8. What does this pass do about it?', choices: ['Swap exactly ONE pair: 1 and 8 trade places, and index 0 is locked forever', 'Slide 1 left past 8, shifting everything between', 'Swap several adjacent pairs until 1 reaches the front'], a: 0, why: 'Selection sort spends exactly one swap per pass to lock one final position. Middle states with elements jumping around are NOT selection sort.' }, message: 'One swap per pass: 1 and 8 trade places. Index 0 is locked. The sorted zone grows by exactly one.', mutations: [
                    { type: 'expression.reduce', text: 'swap(0, 3)', note: 'one swap ends the pass' },
                    { type: 'extra.set', value: arr([1, 3, 6, 8, 5], { sorted: 1 }) }
                ] },
                { line: 7, message: 'Pass 2 scans 3, 6, 8, 5: the min is 3, already in slot 1, so the swap is a no-op. Passes 3 and 4 repeat: final order 1, 3, 5, 6, 8. Signature: exactly one swap per pass.', mutations: [
                    { type: 'extra.set', value: arr([1, 3, 5, 6, 8], { sorted: 5, note: 'selection sort: N-1 passes, one swap each' }) }
                ] }
            ],
            summary: {
                idea: ['Every pass does two things and only two: SCAN the unsorted zone for the min, then SWAP it into the next slot. Left of the divider is final and never touched again.', 'After k passes, exactly k positions are locked. That invariant is the exam handle on "which pass is this?"'],
                mistake: 'Re-scanning the sorted zone, or swapping during the scan: the min candidate only moves once, at the end of the pass.',
                transfer: 'Mid-run the array reads [1, 3, 8, 6, 5]. Which pass just finished, and what will the very next swap exchange?'
            }
        },
        {
            label: 'Insertion Sort',
            intro: 'Insertion sort keeps the left zone sorted the whole time: pick up the next value, shift bigger elements right, drop it into the hole.',
            code: `// INSERTION SORT: take the next value, shift it in
for (int i = 1; i < a.length; i++)
{
    int key = a[i];
    int j = i - 1;
    while (j >= 0 && a[j] > key)
    {
        a[j + 1] = a[j];   // shift right
        j--;
    }
    a[j + 1] = key;        // drop into the hole
}`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 4, message: 'The left zone [2, 5, 8] stays sorted. The next value from the right, 3, is picked up as the key.', mutations: [
                    { type: 'extra.set', value: arr([2, 5, 8, 3, 7], { sorted: 3, markers: [{ at: 3, label: 'key' }], note: 'left zone: always sorted' }) }
                ] },
                { line: 8, predict: { q: 'key is 3 and the scan moves left through 8 and 5. What operation moves those bigger values?', choices: ['Swaps: 3 trades places with each bigger element one by one', 'Shifts: each bigger element copies ONE cell right, leaving a hole for the key', 'Deletion: 8 and 5 fall out of the sorted zone'], a: 1, why: 'Insertion sort never swaps. Bigger elements slide right by assignment; the key drops into the final hole. That is the fingerprint.' }, message: 'Compare leftward: 8 > 3, shift 8 right. 5 > 3, shift 5 right. 2 > 3 false, stop. Shifting, never swapping.', mutations: [
                    { type: 'expression.reduce', text: '8 > 3, 5 > 3, 2 > 3?', note: 'shift, shift, stop' },
                    { type: 'extra.set', value: arr([2, 5, 8, 8, 7], { sorted: 2, markers: [{ at: 1, label: 'hole' }, { at: 3, label: 'key' }] }) }
                ] },
                { line: 10, message: 'Drop 3 into the hole: [2, 3, 5, 8, 7]. The sorted zone grew by one without a single swap.', mutations: [
                    { type: 'extra.set', value: arr([2, 3, 5, 8, 7], { sorted: 4, markers: [{ at: 4, label: 'key' }] }) }
                ] },
                { line: 10, message: 'Last key 7: shift the 8, insert. Final [2, 3, 5, 7, 8]. Signature: shifts, not swaps. If the trace shows elements sliding right, it is insertion sort.', mutations: [
                    { type: 'extra.set', value: arr([2, 3, 5, 7, 8], { sorted: 5, note: 'both algorithms end sorted, but their middle steps look completely different' }) }
                ] }
            ],
            summary: {
                idea: ['The LEFT zone stays sorted at all times; each pass lifts one key out of the right zone and re-inserts it by shifting.', 'Stop condition is double: shift while j >= 0 AND a[j] > key. Either guard failing ends the shift; equal values stop it too.'],
                mistake: 'Overwriting the key: a[j + 1] = a[j] shifts values, so the key must be saved in a variable BEFORE the first shift.',
                transfer: 'Mid-run the array reads [2, 3, 5, 8, 7]. Is this insertion or selection sort, and what is the next single move?'
            }
        }
    ]
};
