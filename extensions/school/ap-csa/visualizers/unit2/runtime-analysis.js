function growth(rows, note) {
    return { kind: 'growth', cols: ['n', 'A: one loop', 'B: nested loops'], rows, note };
}

const GLAB = { kind: 'growthlab', label: 'n', min: 1, max: 60, value: 20, series: [
    { name: 'A: one loop', fn: 'n' },
    { name: 'B: nested loops', fn: 'n * n' },
    { name: 'C: no loop', fn: '1' }
], note: 'C is the third shape the exam pairs with the other two: CONSTANT work. Slide n from 5 to 60 and watch it refuse to move while A crawls and B rockets. Doubling n: C stays, C stays, A doubles, B times-four.' };

export default {
    id: 'u2-runtime-analysis',
    meta: { unit: 2, topic: '2.12', title: 'Informal Run-Time Analysis', visualizerTitle: 'Operation Counter & Growth Visualizer' },
    modes: [{
    label: 'Guided counts',
    intro: 'Do not count seconds. Count how the work grows when the input doubles.',
    code: `// A: one loop
for (int i = 0; i < n; i++)
    count++;

// B: two nested loops
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        count++;`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 2, message: 'Run both algorithms with n = 5. A performs 5 key operations. B runs its inner loop 5 times, each with 5 operations: 25.', mutations: [
            { type: 'extra.set', value: growth([[5, 5, 25]]) }
        ] },
        { line: 6, message: 'Double the input to n = 10. A doubles to 10. B does not double, it quadruples: 10 x 10 = 100.', mutations: [
            { type: 'extra.set', value: growth([[5, 5, 25], [10, 10, 100]]) }
        ], predict: { q: 'n doubled from 5 to 10. A went 5 → 10. B sat at 25: what does it become?', choices: ['100 - it quadruples', '50 - it doubles too'], a: 0, why: 'n x n with a doubled n is (2n)(2n) = 4n x n: squaring multiplies the doubling. "Nested loop + double input = four times the work" is the exact FR sentence.' } },
        { line: 6, message: 'n = 20: A is 20, B is 400. Watch the bars, not the numbers: B’s bar races away.', mutations: [
            { type: 'extra.set', value: growth([[5, 5, 25], [10, 10, 100], [20, 20, 400]]) }
        ] },
        { line: 6, message: 'A grows linearly: work is proportional to n. B grows quadratically: work is proportional to n squared. Double n and A doubles while B becomes four times heavier.', mutations: [
            { type: 'extra.set', value: growth([[5, 5, 25], [10, 10, 100], [20, 20, 400]], 'AP CSA asks exactly this question: what happens to the run time when the input size doubles?') }
        ] },
        { line: 2, message: 'You never need the exact operation count Java performs. Count the statements inside the loops and compare growth shapes: constant, linear, quadratic.', mutations: [] }
    ],
    summary: {
        idea: 'Compare GROWTH, not seconds: double the input and linear work doubles, quadratic work quadruples, constant work shrugs. Key row: n = 20 gives A 20, B 400.',
        mistake: 'Reasoning "two loops is twice as slow as one" - nested multiplies, it does not add.',
        transfer: 'A loop i < n with inner j < i: which family? (still quadratic - a triangle of n x n, same shape, half the cells)'
    }
}, {
    label: 'Your own n',
    intro: 'The guided table had three frozen n values. Here YOU move n - any value from 1 to 60 - and the bars answer instantly.',
    code: `// A: for (int i = 0; i < n; i++)
//        count++;
// B: for (int i = 0; i < n; i++)
//        for (int j = 0; j < n; j++)
//            count++;
// C: count++;`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Drag the slider. Ops counts update live above each bar.', mutations: [
            { type: 'extra.set', value: GLAB }
        ] },
        { line: 3, message: 'A test you can run with the slider: park n at 10 and double it to 20, twice. C: unchanged. A: 10 → 20 → 40, it doubled each time - LINEAR. B: 100 → 400 → 1600, it quadrupled each time - QUADRATIC. That double-the-input sentence is the exact wording of the FRMC question.', mutations: [] },
        { line: 6, message: 'C is the third shape exam tables love: a statement outside every loop runs the SAME number of times no matter what n does. Constant, linear, quadratic: name the shape, never the seconds.', mutations: [] }
    ],
    summary: {
        idea: 'One dial, three curves: C frozen, A proportional to n, B exploding as n x n. The shapes - not any single count - are the answer to "describe the run time."',
        mistake: 'Reading B\'s bar height as milliseconds. This measures how WORK grows, not how long your laptop takes.',
        transfer: 'Park n at 40 (B = 1600), then slide back to 20: B falls to a QUARTER (400), not half. Halving n quarters n x n.'
    }
}, {
    label: 'Early exit',
    intro: 'What if the loop can quit mid-way? The count depends on WHERE the answer hides, but the worst-case shape survives.',
    code: `// search for 9 in an array of n values
int i = 0;
while (i < nums.length && nums[i] != 9)
{
    i++;
}
// found (or not) when the loop stops`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 3, message: 'Best case: 9 sits at index 0. First check, loop quits after ONE comparison - even for n = 100. Early exit shrinks the count dramatically.', mutations: [
            { type: 'extra.set', value: { kind: 'growth', cols: ['n', '9 at the front', '9 missing'], rows: [[5, 1, 5], [20, 1, 20], [100, 1, 100]], note: 'Best case is ONE comparison at any size; the worst-case column still grows exactly with n.' } }
        ] },
        { line: 3, message: 'Worst case: 9 is absent, and the scan reads every cell: n comparisons at any n. Right column still grows exactly with the input - still LINEAR. An early exit changes how much work a SINGLE run may do; it does not change the shape of the growth curve in the worst case.', mutations: [
            { type: 'expression.reduce', text: 'worst case ~ n', note: 'same shape as algorithm A' }
        ], predict: { q: 'n = 100 but 9 hides at index 0. How many comparisons does the scan actually make?', choices: ['1 - the loop quits at once', '100 - a search is a search'], a: 0, why: 'i < n && nums[i] != 9 answers false on round one already, and the loop is over. Luck is real but it is not a growth shape.' } },
        { line: 1, message: 'AP phrasing to own: "In the worst case, which is an example of a linear search?" Doubling n doubles the worst-case comparisons - the loop bound, not the luck, decides the growth category. Nested loops with an early exit are still quadratic in the worst case.', mutations: [] }
    ],
    summary: {
        idea: 'Early exit shrinks how much work ONE lucky run does; it never changes the worst-case SHAPE. A searchable loop that can quit is still linear; nested, still quadratic.',
        mistake: 'Quoting best-case luck (1 comparison!) as the growth category. The exam asks worst case unless it says otherwise.',
        transfer: 'If 9 sits dead center in a 100-array: comparisons about 50 - same linear family, half the constant. Constant off, shape on.'
    }
}]
};
