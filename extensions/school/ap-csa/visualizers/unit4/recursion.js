const CALL_TREE = {
    id: 't0', text: 'mystery(4)',
    children: [
        { node: { id: 't1', text: 'mystery(3)', children: [
            { node: { id: 't2', text: 'mystery(2)', children: [
                { node: { id: 't3', text: 'mystery(1) BASE' } }
            ] } }
        ] } }
    ]
};

function tree(visited, active, note) {
    return { kind: 'flow', root: CALL_TREE, visited, active, note };
}

export default {
    id: 'u4-recursion',
    meta: { unit: 4, topic: '4.16', title: 'Recursion', visualizerTitle: 'Recursion Call Stack Visualizer' },
    modes: [
        {
            label: 'Call stack',
            intro: 'A method calling itself is just a method waiting. The stack keeps every copy separate.',
            code: `public static int mystery(int n)
{
    if (n == 1)
        return 1;

    return n + mystery(n - 1);
}

// caller runs: mystery(4)`,
            layout: { center: ['stack'], right: ['expression'] },
            steps: [
                { line: 6, message: 'DESCENDING. mystery(4) opens its own frame with its own n = 4. It reaches the recursive call and pauses there.', mutations: [
                    { type: 'stack.push', label: 'mystery(4)', vars: [{ name: 'n', value: '4' }] },
                    { type: 'expression.reduce', text: '4 + mystery(3)', note: 'waiting on the inner call' }
                ] },
                { line: 6, message: 'mystery(3): a new frame, a new n. The 4 upstairs is not gone, it is parked. Parameter timeline: n = 4, 3, 2, 1, one per frame.', mutations: [
                    { type: 'stack.push', label: 'mystery(3)', vars: [{ name: 'n', value: '3' }] }
                ] },
                { line: 6, message: 'mystery(2) pushes.', mutations: [
                    { type: 'stack.push', label: 'mystery(2)', vars: [{ name: 'n', value: '2' }] }
                ] },
                { line: 4, message: 'mystery(1) pushes. Its n is 1, so the if hits the BASE CASE: return 1 with no further calls. No base case, or one the arguments never reach, means infinite recursion and a StackOverflowError crash.', mutations: [
                    { type: 'stack.push', label: 'mystery(1) BASE', vars: [{ name: 'n', value: '1' }] }
                ] },
                { line: 4, predict: { q: 'Four frames deep. The base case fires. Which frame returns FIRST, and with what value?', choices: ['mystery(4), it started everything', 'mystery(1), returning 1: the DEEPEST frame answers first', 'All four return together'], a: 1, why: 'Descent goes down, answers come up, and only the innermost paused call can finish. The frames above it are still parked mid-expression.' }, message: 'UNWINDING begins, a separate phase from the descent. mystery(1) pops and hands 1 to the frame below.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'expression.clear' },
                    { type: 'expression.reduce', text: 'mystery(1) → 1' }
                ] },
                { line: 6, message: 'mystery(2) resumes at its paused line: 2 + 1 = 3. Pop, return 3. Each frame finishes only the half-expression it left waiting.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'expression.reduce', text: 'mystery(2) → 2 + 1 = 3' }
                ] },
                { line: 6, message: 'mystery(3): 3 + 3 = 6. Pop.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'expression.reduce', text: 'mystery(3) → 3 + 3 = 6' }
                ] },
                { line: 6, message: 'mystery(4): 4 + 6 = 10. The caller receives 10.', mutations: [
                    { type: 'stack.pop' },
                    { type: 'expression.reduce', text: 'mystery(4) → 4 + 6 = 10' }
                ] },
                { line: 6, message: 'Recursion is another repetition: mystery(4) adds exactly what a for loop 1..4 would add. You are asked to TRACE calls like this, not to write them: work happens on the way down, answers arrive on the way up.', mutations: [] }
            ],
            summary: {
                idea: ['Every call gets its OWN frame with its own n; nothing is shared except the waiting expressions.', 'Two phases, always: descend until the base case, then unwind. The LAST call made is the FIRST value returned.'],
                mistake: 'Reading 4 + mystery(3) as "4 + 3": the argument is not the answer. mystery(3) is an UNFINISHED expression worth 6 here.',
                transfer: 'Same method, call mystery(5), without drawing anything: list the return chain 1 → ? → ? → ? → ? from memory.'
            }
        },
        {
            label: 'Call tree',
            intro: 'The same run drawn as calls-under-calls instead of frames-under-frames.',
            code: `mystery(4)
  └─ mystery(3)
       └─ mystery(2)
            └─ mystery(1)  // base

// a method that calls ITSELF TWICE
// branches the tree sideways`,
            layout: { center: ['extra'], right: ['expression'] },
            steps: [
                { line: 1, message: 'mystery(4) is the root. Every call it makes hangs BELOW it as a child.', mutations: [
                    { type: 'extra.set', value: tree(['t0'], 't0', 'descent: each new call opens a child') }
                ] },
                { line: 2, message: 'mystery(3) is a child of mystery(4). This chain is one call deep per level, so the tree is a straight line, exactly mirroring the stack picture.', mutations: [
                    { type: 'extra.set', value: tree(['t0', 't1'], 't1') }
                ] },
                { line: 4, message: 'Full descent: 4 → 3 → 2 → 1. The leaf is the base case: the only node that answers without a child.', mutations: [
                    { type: 'extra.set', value: tree(['t0', 't1', 't2', 't3'], 't3', 'base case is a leaf') }
                ] },
                { line: 4, message: 'Returns climb back up the same path: 1, then 3, then 6, then 10. A call tree read top-down is descent; bottom-up is unwinding.', mutations: [
                    { type: 'expression.reduce', text: '1 → 3 → 6 → 10', note: 'answers travel to the root' },
                    { type: 'extra.set', value: tree(['t0', 't1', 't2', 't3'], 't0', 'unwind: answers move up the tree') }
                ] },
                { line: 6, predict: { q: 'Now imagine a method whose body calls ITSELF TWICE before returning. What does the picture become?', choices: ['A deeper straight line, same as here', 'One node growing TWO children: the tree widens and calls multiply', 'The tree collapses to a single node'], a: 1, why: 'Two self-calls per frame fork every leaf into two branches. Counting NODES then equals counting calls, which is exactly the exam question shape.' }, message: 'Why the tree matters: when a method calls itself TWICE (like a certain exam Fibonacci), one node grows TWO children and the picture widens into a real tree. Counting nodes then equals counting calls, and duplicated sub-answers become visible at a glance.', mutations: [] }
            ],
            summary: {
                idea: ['Stack view and tree view describe ONE run: descent grows down/right, unwinding answers climb back up/left.', 'The leaf of the tree is the base case: the only call that answers without asking another.'],
                mistake: 'Reading the tree like a loop timeline: siblings are SEPARATE calls that each fully run their own descend-and-unwind.',
                transfer: 'f(3) calls f(2) twice and f(0) returns 1. Sketch the tree and count its nodes: how many f(2) calls actually run?'
            }
        }
    ]
};
