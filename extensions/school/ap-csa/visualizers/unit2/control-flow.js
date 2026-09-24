const ROOT = {
    id: 'start', text: 'Start',
    children: [{
        node: {
            id: 'assign', text: 'x = 3',
            children: [{
                node: {
                    id: 'cond', text: 'x > 2 ?',
                    children: [
                        { label: 'true', node: { id: 'inc', text: 'x++', children: [{ node: { id: 'printT', text: 'println(x)', children: [{ node: { id: 'endT', text: 'End' } }] } }] } },
                        { label: 'false', node: { id: 'skip', text: 'skip block', children: [{ node: { id: 'printF', text: 'println(x)', children: [{ node: { id: 'endF', text: 'End' } }] } }] } }
                    ]
                }
            }]
        }
    }]
};

const TREE_LOOP = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'init', text: 'x = 0',
        children: [{ node: {
            id: 'cond', text: 'x < 3 ?',
            children: [
                { label: 'true', node: { id: 'body', text: 'x++', backTo: 'x < 3 ?', children: [{ node: { id: 'recheck', text: 'check again' } }] } },
                { label: 'false', node: { id: 'print', text: 'println(x)', children: [{ node: { id: 'end', text: 'End' } }] } }
            ]
        } }]
    } }]
};

function flow(visited, active, struck) {
    return { kind: 'flow', root: ROOT, visited, active, struck: struck || undefined };
}

function flowLoop(visited, active) {
    return { kind: 'flow', root: TREE_LOOP, visited, active };
}

export default {
    id: 'u2-control-flow',
    meta: { unit: 2, topic: '2.1', title: 'Algorithms with Selection and Repetition', visualizerTitle: 'Algorithm Control Flow Visualizer' },
    modes: [{
    label: 'Selection path',
    intro: 'Watch the program walk its path through the control flow tree, one node at a time.',
    code: `int x = 3;
if (x > 2)
{
    x++;
}
System.out.println(x);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'Java runs top to bottom. Each statement executes once, in order.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '3' },
            { type: 'extra.set', value: flow(['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: 'Now the condition is evaluated. Conditions decide which path the flow takes next.', mutations: [
            { type: 'expression.reduce', text: 'x > 2', note: 'the if condition' },
            { type: 'extra.set', value: flow(['start', 'assign', 'cond'], 'cond') }
        ] },
        { line: 2, message: '3 > 2 is true, so the flow turns left onto the true branch.', mutations: [
            { type: 'expression.reduce', text: 'TRUE' }
        ], predict: { q: 'x is 3. The condition 3 > 2 just came back true. Which road lights?', choices: ['left road: the x++ block runs', 'right road: the skip block runs'], a: 0, why: 'A true condition hands control to the true road. The false road is skipped whole - and skipped code changes nothing.' } },
        { line: 4, message: 'The false branch on the right is skipped entirely. Code written below does not mean code that runs.', mutations: [
            { type: 'extra.set', value: flow(['start', 'assign', 'cond', 'inc'], 'inc') }
        ] },
        { line: 4, message: 'x++ runs inside the branch: x goes from 3 to 4.', mutations: [
            { type: 'memory.set', name: 'x', value: '4' }
        ] },
        { line: 6, message: 'Both branches rejoin after the if. The println below runs no matter which path was taken.', mutations: [
            { type: 'extra.set', value: flow(['start', 'assign', 'cond', 'inc', 'printT'], 'printT') },
            { type: 'console.print', text: '4' }
        ], predict: { q: 'Both roads meet at the println below the if. What number is about to print?', choices: ['3: x never moved', '4: the x++ from the taken road ran'], a: 1, why: 'Only the true branch touched x. Statements BELOW the if run no matter which road was taken.' } },
        { line: 6, message: 'End of the path. Notice the false branch never lit up. Tracing the path, not memorizing syntax, is how you predict any program.', mutations: [
            { type: 'extra.set', value: flow(['start', 'assign', 'cond', 'inc', 'printT', 'endT'], 'endT') }
        ] }
    ],
    summary: {
        idea: 'Code written below is not code that runs. The path decides: a condition is evaluated, returns true or false, and that single verdict picks exactly one road.',
        mistake: 'Reading the program top-to-bottom and marking every line as executed. The false road changed nothing - no variable, no print.',
        transfer: 'Change line 1 to int x = 1: which road lights now, does x move, and what prints?'
    }
}, {
    label: 'Repetition path',
    intro: 'The third control structure: a loop is a node the path visits over and over, running UPWARD back to the condition.',
    code: `int x = 0;
while (x < 3)
{
    x++;
}
System.out.println(x);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'x = 0. The tree looks like the selection one - until you notice the body carries a return edge.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '0' },
            { type: 'extra.set', value: flowLoop(['start', 'init'], 'init') }
        ] },
        { line: 2, message: 'Check 1: 0 < 3 is true, so we descend into the body.', mutations: [
            { type: 'expression.reduce', text: 'x < 3', note: '0 < 3 → true' },
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond'], 'cond') }
        ] },
        { line: 4, message: 'Body: x becomes 1. One visit so far.', mutations: [
            { type: 'memory.set', name: 'x', value: '1' },
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body'], 'body') }
        ] },
        { line: 4, message: 'Here is the difference from the selection tree: the body does NOT fall through to the println below. Control JUMPS BACK to the condition. Loops point upward.', mutations: [
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck'], 'recheck') }
        ] },
        { line: 2, message: 'Check 2: the same cond node lights up a second time. 1 < 3, true again, down into the body.', mutations: [
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck', 'cond2'], 'cond') },
            { type: 'expression.reduce', text: 'x < 3', note: '1 < 3 → true' }
        ], predict: { q: 'Control just jumped back UP to the condition, and x is 1. Does the body get another run?', choices: ['Yes: 1 < 3 is still true', 'No: the body already ran once'], a: 0, why: 'The condition is re-checked with fresh values every round. While it answers true, the body keeps its turns.' } },
        { line: 4, message: 'Round 2 body: x becomes 2, jump back. Visiting the same node many times IS the loop - there is no special repeat arrow, only the path.', mutations: [
            { type: 'memory.set', name: 'x', value: '2' },
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck', 'cond2', 'body2'], 'body') }
        ] },
        { line: 2, message: 'Check 3: 2 < 3 true. x becomes 3, jump back one more time.', mutations: [
            { type: 'memory.set', name: 'x', value: '3' },
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck', 'cond2', 'body2', 'cond3'], 'cond') },
            { type: 'expression.reduce', text: 'x < 3', note: '3 < 3 → FALSE' }
        ] },
        { line: 6, message: 'Check 4: false. The exit road finally lights, and every round-2/3 copy of the body stays lit behind it. Note the count: 4 checks, 3 body runs - a loop is always tested once more than it runs.', mutations: [
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck', 'cond2', 'body2', 'cond3', 'print'], 'print') },
            { type: 'console.print', text: '3' }
        ], predict: { q: 'x is 3 now. One more pass through the body?', choices: ['No: 3 < 3 is false, the exit road lights', 'Yes: loops always run one body beyond the bound'], a: 0, why: 'After the update that made x = 3, Java checks 3 < 3; false ends the loop. Checks = body runs + 1: here 4 checks, 3 runs.' } },
        { line: 6, message: 'Three shapes, one habit: sequence walks down, selection picks a road, repetition walks back UP. Every program in this course is only ever these three, stacked. Read any code by asking: which node am I on, which road, does anything jump back?', mutations: [
            { type: 'extra.set', value: flowLoop(['start', 'init', 'cond', 'body', 'recheck', 'cond2', 'body2', 'cond3', 'print', 'end'], 'end') }
        ] }
    ],
    summary: {
        idea: 'A loop is an upward edge: the body ends, control returns to the SAME condition node, and the fresh verdict decides continue or exit.',
        mistake: 'Ending the mental trace at the last body run. The final FALSE check is part of the loop and is where the count comes from.',
        transfer: 'Change the bound to x < 1: how many body runs happen? (zero - the very first check fails)'
    }
}]
};
