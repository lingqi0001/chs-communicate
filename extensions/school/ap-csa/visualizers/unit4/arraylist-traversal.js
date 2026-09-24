function lst(values, opts) {
    return { kind: 'list', name: 'list', values, ...opts };
}

export default {
    id: 'u4-arraylist-traversal',
    meta: { unit: 4, topic: '4.9', title: 'ArrayList Traversals', visualizerTitle: 'ArrayList Traversal & Mutation Visualizer' },
    modes: [
        {
            label: 'Forward removal',
            intro: 'Removing while walking forward is the classic trap. The list shrinks under the loop.',
            code: `// list starts as [A, A, B]
for (int i = 0; i < list.size(); i++)
{
    if (list.get(i).equals("A"))
        list.remove(i);
}`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 2, message: 'i = 0, size() = 3. The condition re-reads size() every round, which is exactly the problem.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
                    { type: 'extra.set', value: lst(['A', 'A', 'B'], { sel: 0 }) }
                ] },
                { line: 5, message: 'get(0) is A: match, so remove(0). The second A slides left into index 0, B into index 1. size is now 2.', mutations: [
                    { type: 'expression.reduce', text: 'list.get(0).equals("A")', note: 'true → remove(0)' },
                    { type: 'extra.set', value: lst(['A', 'B'], { sel: 0, note: 'everything after the hole shifted left by one' }) }
                ] },
                { line: 2, predict: { q: 'list is now [A, B] and the just-removed slot pushed the second A into index 0. The loop runs i++. Which element does get(i) test next?', choices: ['The second A, freshly at index 0', 'B: the A at index 0 is skipped entirely', 'The loop ends because size changed'], a: 1, why: 'i moves 0 → 1 while the DATA slid left. Index 0 now holds an element that was never asked about. This mismatch is the whole skip trap.' }, message: 'ELEMENT SKIPPED: i++ makes i = 1, which now points at B. The A sitting at index 0 was never asked about. Removal moved a fresh element into the index being left behind.', mutations: [
                    { type: 'memory.set', name: 'i', value: '1' },
                    { type: 'extra.set', value: lst(['A', 'B'], { sel: 1, note: 'the second A hides behind i: skipped' }) },
                    { type: 'expression.reduce', text: 'list.get(1).equals("A")', note: 'B: false' }
                ] },
                { line: 2, message: 'i becomes 2, size() is 2, the loop ends. Result: [A, B]. One A survived. This exact code is a favorite exam wrong-answer.', mutations: [
                    { type: 'memory.set', name: 'i', value: '2' },
                    { type: 'extra.set', value: lst(['A', 'B'], { note: 'final list [A, B]: the forward loop removed only one match' }) }
                ] },
                { line: 3, message: 'Fix by not advancing when you remove (else i++), which keeps the current index pointed at the shifted-in element. Same trap, no skip.', mutations: [] },
                { line: 4, message: 'The enhanced for loop cannot do ANY structural change: remove or add inside for (String s : list) throws ConcurrentModificationException. Reading values with for-each is fine; changing the list while walking it is not.', mutations: [] }
            ],
            summary: {
                idea: ['Forward traversal + remove = the shifted-in element at the CURRENT index is skipped, because i++ still advances.', 'size() is re-read every round: the loop can end early or late depending on removals.'],
                mistake: 'Believing [A, A, B] loses both A\'s. The run ends with [A, B]: exactly one removal happened, which is the answer choice students miss.',
                transfer: 'Same loop but with the fix "only i++ when nothing was removed". Trace [A, A, B] again: what does the final list become?'
            }
        },
        {
            label: 'Reverse removal',
            intro: 'Walk from the back and every shift happens behind the pointer, where you have already been.',
            code: `// list starts as [A, A, B]
for (int i = list.size() - 1; i >= 0; i--)
{
    if (list.get(i).equals("A"))
        list.remove(i);
}`,
            layout: { center: ['extra'], right: ['memory', 'expression'] },
            steps: [
                { line: 2, message: 'i starts at size() - 1 = 2. The pointer and the shifting direction now point the same way, which is the whole trick.', mutations: [
                    { type: 'memory.create', name: 'i', dataType: 'int', value: '2' },
                    { type: 'extra.set', value: lst(['A', 'A', 'B'], { sel: 2, note: 'walking right to left' }) }
                ] },
                { line: 4, message: 'get(2) is B: no match, i-- to 1.', mutations: [
                    { type: 'memory.set', name: 'i', value: '1' },
                    { type: 'extra.set', value: lst(['A', 'A', 'B'], { sel: 1 }) }
                ] },
                { line: 5, predict: { q: 'remove(1) will slide B from index 2 into index 1. i now counts DOWN toward 0. Does any element escape being tested?', choices: ['Yes, B gets skipped', 'No: shifted elements land on indexes ALREADY visited; the pointer moves away from them', 'Cannot tell without running the code'], a: 1, why: 'That is the geometric reason reverse removal is safe: shifts always happen behind the walking pointer.' }, message: 'get(1) is A: remove(1). Only indexes AFTER 1 shift, and index 2 was already checked. Nothing moves into the pointer path.', mutations: [
                    { type: 'expression.reduce', text: 'list.get(1).equals("A")', note: 'true → remove(1)' },
                    { type: 'extra.set', value: lst(['A', 'B'], { sel: 1 }) },
                    { type: 'memory.set', name: 'i', value: '0' }
                ] },
                { line: 5, message: 'get(0) is A again, and THIS time nobody hid behind a shift: remove(0). Final list [B]. Both matches gone in one pass.', mutations: [
                    { type: 'expression.reduce', text: 'list.get(0).equals("A")', note: 'true → remove(0)' },
                    { type: 'extra.set', value: lst(['B'], { note: 'reverse traversal: no skips, no special i++ rule' }) },
                    { type: 'memory.set', name: 'i', value: '-1' }
                ] },
                { line: 2, message: 'i = -1 fails i >= 0 and the loop closes. Exam signature to memorize: forward + remove can skip, reverse + remove never skips, for-each + structural change crashes. Size shrinking behind you is harmless.', mutations: [] }
            ],
            summary: {
                idea: ['Removal shifts everything AFTER the hole. Walk backwards and those cells are already visited, so nothing can hide.', 'The safe pairings: for-each only READS; indexed-forward can edit but must respect the shift; indexed-reverse edits freely.'],
                mistake: 'Caching int n = list.size() before a removal loop: the stale n then overruns or undershoots the live list.',
                transfer: '[A, B, A, A] with reverse removal of every A: list the (i, element, action) row for each step, then give the final list.'
            }
        }
    ]
};
