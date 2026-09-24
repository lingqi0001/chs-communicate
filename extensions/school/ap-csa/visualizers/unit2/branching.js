const TREE23 = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'score = 85',
        children: [{ node: {
            id: 'cond', text: 'score >= 90 ?',
            children: [
                { label: 'true', node: { id: 't', text: 'println("A")', children: [{ node: { id: 'endT', text: 'End' } }] } },
                { label: 'false', node: { id: 'f', text: 'println("Not A")', children: [{ node: { id: 'endF', text: 'End' } }] } }
            ]
        } }]
    } }]
};

const TREE24 = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'x = 7',
        children: [{ node: {
            id: 'outer', text: 'x > 0 ?',
            children: [
                { label: 'true', node: {
                    id: 'inner', text: 'x > 10 ?',
                    children: [
                        { label: 'true', node: { id: 'big', text: '"big"', children: [{ node: { id: 'endB', text: 'End' } }] } },
                        { label: 'false', node: { id: 'med', text: '"medium"', children: [{ node: { id: 'endM', text: 'End' } }] } }
                    ]
                } },
                { label: 'false', node: { id: 'neg', text: '"negative"', children: [{ node: { id: 'endN', text: 'End' } }] } }
            ]
        } }]
    } }]
};

const TREE_IFONLY = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'score = 85',
        children: [{ node: {
            id: 'cond', text: 'score >= 90 ?',
            children: [
                { label: 'true', node: { id: 't', text: 'println("A")', children: [{ node: { id: 'endT', text: 'End' } }] } },
                { label: 'false', node: { id: 'skip', text: '(no else) nothing', children: [{ node: { id: 'endF', text: 'End' } }] } }
            ]
        } }]
    } }]
};

// 'join' appears under BOTH roads: same id lights up on either side = the rejoin point.
const TREE_NOBRACES = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'x = -5',
        children: [{ node: {
            id: 'cond', text: 'x > 0 ?',
            children: [
                { label: 'true', node: { id: 'pos', text: 'println("positive")', children: [{ node: { id: 'join', text: 'println("bye")', children: [{ node: { id: 'end', text: 'End' } }] } }] } },
                { label: 'false', node: { id: 'join', text: 'println("bye")', children: [{ node: { id: 'end', text: 'End' } }] } }
            ]
        } }]
    } }]
};

const TREE_2IFS = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'x = 5',
        children: [{ node: {
            id: 'cond1', text: 'x > 3 ?',
            children: [
                { label: 'true', node: { id: 'inc', text: 'x++', children: [
                    { node: { id: 'cond2', text: 'x == 6 ?', children: [
                        { label: 'true', node: { id: 'six', text: 'println("six")', children: [{ node: { id: 'end', text: 'End' } }] } },
                        { label: 'false', node: { id: 'end', text: 'End' } }
                    ] } }
                ] } },
                { label: 'false', node: { id: 'cond2', text: 'x == 6 ?', children: [
                    { label: 'true', node: { id: 'six', text: 'println("six")', children: [{ node: { id: 'end', text: 'End' } }] } },
                    { label: 'false', node: { id: 'end', text: 'End' } }
                ] } }
            ]
        } }]
    } }]
};

const TREE_DANGL = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'x = 7',
        children: [{ node: {
            id: 'outer', text: 'x > 0 ?',
            children: [
                { label: 'true', node: {
                    id: 'inner', text: 'x > 10 ?',
                    children: [
                        { label: 'true', node: { id: 'big', text: '"big"', children: [{ node: { id: 'eB', text: 'End' } }] } },
                        { label: 'false', node: { id: 'small', text: '"small"', children: [{ node: { id: 'eS', text: 'End' } }] } }
                    ]
                } },
                { label: 'false', node: { id: 'none', text: 'prints NOTHING', children: [{ node: { id: 'eN', text: 'End' } }] } }
            ]
        } }]
    } }]
};

const TREE3 = {
    id: 'start', text: 'Start',
    children: [{ node: {
        id: 'assign', text: 'x = 75',
        children: [{ node: {
            id: 'l1', text: 'x >= 60 ?',
            children: [
                { label: 'true', node: {
                    id: 'l2', text: 'x >= 90 ?',
                    children: [
                        { label: 'true', node: { id: 'gA', text: 'grade = "A"', children: [{ node: { id: 'eA', text: 'End' } }] } },
                        { label: 'false', node: {
                            id: 'l3', text: 'x >= 75 ?',
                            children: [
                                { label: 'true', node: { id: 'gB', text: 'grade = "B"', children: [{ node: { id: 'eB', text: 'End' } }] } },
                                { label: 'false', node: { id: 'gC', text: 'grade = "C"', children: [{ node: { id: 'eC', text: 'End' } }] } }
                            ]
                        } }
                    ]
                } },
                { label: 'false', node: { id: 'gF', text: 'grade = "F"', children: [{ node: { id: 'eF', text: 'End' } }] } }
            ]
        } }]
    } }]
};

function flow(tree, visited, active, struck, showLevels) {
    return { kind: 'flow', root: tree, visited, active, struck: struck || undefined, showLevels: showLevels || undefined };
}

const t23 = {
    id: 'u2-branching',
    meta: { unit: 2, topic: '2.3', title: 'if Statements', visualizerTitle: 'Branch Path Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: 'An if-else picks exactly one road. The road not picked changes nothing.',
    code: `int score = 85;
if (score >= 90)
{
    System.out.println("A");
}
else
{
    System.out.println("Not A");
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'score starts at 85.', mutations: [
            { type: 'memory.create', name: 'score', dataType: 'int', value: '85' },
            { type: 'extra.set', value: flow(TREE23, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: 'The condition asks: is 85 at least 90?', mutations: [
            { type: 'expression.reduce', text: 'score >= 90', note: '85 >= 90' },
            { type: 'extra.set', value: flow(TREE23, ['start', 'assign', 'cond'], 'cond') }
        ] },
        { line: 2, message: '85 >= 90 is false. The flow turns to the else road, and the "A" block is skipped without ever running.', mutations: [
            { type: 'expression.reduce', text: 'FALSE' },
            { type: 'extra.set', value: flow(TREE23, ['start', 'assign', 'cond', 'f'], 'f') }
        ], predict: { q: 'The verdict on 85 >= 90 decides the road. Which block is about to run?', choices: ['the else block', 'the if block', 'both blocks'], a: 0, why: 'An if-else executes EXACTLY one road: the false verdict walks around the if block and straight into the else.' } },
        { line: 8, message: 'Only the else block prints. An if-else runs exactly one of its two branches, never both, and here never the first.', mutations: [
            { type: 'console.print', text: 'Not A' },
            { type: 'extra.set', value: flow(TREE23, ['start', 'assign', 'cond', 'f', 'endF'], 'endF') }
        ] },
        { line: 4, message: 'Two independent ifs (no else) are different: each one is asked separately, so zero, one or both blocks can run. Braces decide what belongs to the branch.', mutations: [] }
    ],
    summary: {
        idea: 'One condition, one verdict, exactly one block. The skipped block changes nothing - no variable moves, nothing prints.',
        mistake: 'Believing both blocks can run, or that the skipped if block still touched score.',
        transfer: 'Set score = 90: which road now? (90 >= 90 is true - "A" prints. The boundary IS the exam question.)'
    }
}, {
    label: 'if without else',
    intro: 'Remove the else and the count changes: an if runs its block 0 or 1 times, never 2.',
    code: `int score = 85;
if (score >= 90)
{
    System.out.println("A");
}
// program just continues here`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'score = 85 again, same condition as the guided trace.', mutations: [
            { type: 'memory.create', name: 'score', dataType: 'int', value: '85' },
            { type: 'extra.set', value: flow(TREE_IFONLY, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: '85 >= 90 is false. Last time the flow moved to an else block. This time there is no else: the true road is struck out entirely.', mutations: [
            { type: 'expression.reduce', text: 'score >= 90', note: '85 >= 90 → false' },
            { type: 'extra.set', value: flow(TREE_IFONLY, ['start', 'assign', 'cond'], 'cond', ['t', 'endT']) }
        ] },
        { line: 6, message: 'The false road does nothing and the program continues below the if. Console stays empty: an if without else executes its block ZERO times.', mutations: [
            { type: 'extra.set', value: flow(TREE_IFONLY, ['start', 'assign', 'cond', 'skip', 'endF'], 'endF', ['t', 'endT']) }
        ], predict: { q: 'The condition is false - and there is no else at all. How many lines will this program print?', choices: ['Zero', 'One: the skipped "A" still prints', 'Two'], a: 0, why: 'Without an else the false road is an empty skip: control just continues below the if. Nothing inside ever ran.' } },
        { line: 2, message: 'Flip score to 95 mentally: then the ONE block runs and the skip road is struck instead. if-only: 0 or 1. if-else: exactly 1 of 2. Know which skeleton you are reading.', mutations: [] }
    ],
    summary: {
        idea: 'if-only runs its block 0 or 1 times; if-else runs exactly 1 of 2. Which skeleton is on the page decides the possible counts.',
        mistake: 'Applying if-else habits to an if-only and predicting output that never prints.',
        transfer: 'score = 90 in this same code: how many lines? (exactly one - the if block, and the skip road goes dark)'
    }
}, {
    label: 'Missing braces',
    intro: 'Without braces an if owns exactly ONE statement. Everything else is outside the branch, no matter how it is indented.',
    code: `int x = -5;
if (x > 0)
    System.out.println("positive");
System.out.println("bye");`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'x = -5. Only one statement follows the if, so only println("positive") belongs to the branch.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '-5' },
            { type: 'extra.set', value: flow(TREE_NOBRACES, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: '-5 > 0 is false. println("positive") is struck out. Look where the tree re-joins: println("bye") sits BELOW the branch, shared by both roads.', mutations: [
            { type: 'expression.reduce', text: 'x > 0', note: '-5 > 0 → false' },
            { type: 'extra.set', value: flow(TREE_NOBRACES, ['start', 'assign', 'cond'], 'cond', ['pos']) }
        ] },
        { line: 4, message: 'bye prints. The indentation in the source makes it look glued to the if; the tree knows better. Console gets exactly one line.', mutations: [
            { type: 'console.print', text: 'bye' },
            { type: 'extra.set', value: flow(TREE_NOBRACES, ['start', 'assign', 'cond', 'join', 'end'], 'end', ['pos']) }
        ], predict: { q: 'The if is false and owns only the first statement. What will the console show when this program ends?', choices: ['just: bye', 'just: positive', 'positive, then bye'], a: 0, why: 'println("positive") is struck out with the false condition; println("bye") was never inside the if, so it runs unconditionally.' } },
        { line: 2, message: 'Now set x = 5 in your head: positive AND bye both print, because only positive was inside the if. Two statements need braces or the second escapes. Braces are the law, indentation is a hint for humans.', mutations: [] }
    ],
    summary: {
        idea: 'Braces decide block membership: without them the if owns exactly ONE statement, and every line after it is unconditional.',
        mistake: 'Reading indentation as control flow - the indented bye is NOT inside the if.',
        transfer: 'Add braces around BOTH printlns: now a false condition skips two lines. One character changes the whole meaning.'
    }
}, {
    label: 'Two independent ifs',
    intro: 'Two ifs without else are two separate questions. Zero, one, or both blocks may run.',
    code: `int x = 5;
if (x > 3)
{
    x++;
}
if (x == 6)
{
    System.out.println("six");
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'x = 5. Two conditions sit in a row, and neither one owns the other.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '5' },
            { type: 'extra.set', value: flow(TREE_2IFS, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: 'Question 1: 5 > 3 is true, so x++ runs and x becomes 6.', mutations: [
            { type: 'expression.reduce', text: 'x > 3', note: '5 > 3 → true' },
            { type: 'extra.set', value: flow(TREE_2IFS, ['start', 'assign', 'cond1', 'inc'], 'inc') },
            { type: 'memory.set', name: 'x', value: '6' }
        ] },
        { line: 6, message: 'Question 2 is asked RIGHT AFTER, independently: x == 6. The second if is not guarded by the first - both roads lead into it.', mutations: [
            { type: 'expression.reduce', text: 'x == 6', note: '6 == 6 → true' },
            { type: 'extra.set', value: flow(TREE_2IFS, ['start', 'assign', 'cond1', 'inc', 'cond2'], 'cond2') }
        ], predict: { q: 'The first block already ran and changed x to 6. Does Java even ask the second if?', choices: ['Yes - two independent questions', 'No - one if already executed'], a: 0, why: 'There is no else chaining them: each if is its own fork in the road, and the first answer does not silence the second.' } },
        { line: 8, message: 'Both blocks ran. An if-else chain could never do that: it picks one road. This program prints six because TWO independent questions both answered true.', mutations: [
            { type: 'console.print', text: 'six' },
            { type: 'extra.set', value: flow(TREE_2IFS, ['start', 'assign', 'cond1', 'inc', 'cond2', 'six', 'end'], 'end') }
        ] },
        { line: 2, message: 'Make it an if / else-if and x++ would block the second test. Same-looking code, different counting rules: read the skeleton, not the indentation.', mutations: [] }
    ],
    summary: {
        idea: 'if + if asks two questions and may run 0, 1, or 2 blocks. if + else-if asks at most two and runs at most one. The skeleton decides, not the look.',
        mistake: 'Reading stacked independent ifs as an if-else chain.',
        transfer: 'Turn line 6 into else if: with x = 5 the second test is never asked, so nothing prints. One word, a different program.'
    }
}]
};

const t24 = {
    id: 'u2-nested-branching',
    meta: { unit: 2, topic: '2.4', title: 'Nested if Statements', visualizerTitle: 'Decision Tree Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: 'A nested if is a branch inside a branch. The inner question is only asked if you arrive at it.',
    code: `int x = 7;
if (x > 0)
{
    if (x > 10)
        System.out.println("big");
    else
        System.out.println("medium");
}
else
{
    System.out.println("negative");
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'x is 7. The decision tree has three possible leaves: big, medium, negative.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '7' },
            { type: 'extra.set', value: flow(TREE24, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: 'First question: is x positive? 7 > 0 is true, so we descend into the left subtree.', mutations: [
            { type: 'expression.reduce', text: 'x > 0', note: '7 > 0 → true' },
            { type: 'extra.set', value: flow(TREE24, ['start', 'assign', 'outer'], 'outer') }
        ] },
        { line: 4, message: 'Only now does the inner condition even exist for the program. x > 10 is asked: 7 > 10 is false.', mutations: [
            { type: 'expression.reduce', text: 'x > 10', note: '7 > 10 → false' },
            { type: 'extra.set', value: flow(TREE24, ['start', 'assign', 'outer', 'inner'], 'inner') }
        ] },
        { line: 7, message: 'The inner false road prints medium. The outer else and the inner true branch never ran.', mutations: [
            { type: 'extra.set', value: flow(TREE24, ['start', 'assign', 'outer', 'inner', 'med'], 'med') },
            { type: 'console.print', text: 'medium' }
        ], predict: { q: 'Verdict so far: outer true, inner false. Which leaf is at the end of this path?', choices: ['"big"', '"medium"', '"negative"'], a: 1, why: 'true then false walks to the inner else leaf. The outer "negative" road belongs to a branch we never entered.' } },
        { line: 6, message: 'An else always matches the nearest unmatched if. The else here belongs to the inner x > 10, not to x > 0. Indentation is a hint for humans; braces are the law for Java.', mutations: [
            { type: 'extra.set', value: flow(TREE24, ['start', 'assign', 'outer', 'inner', 'med', 'endM'], 'endM') }
        ] }
    ],
    summary: {
        idea: 'Nested ifs are a tree: one execution walks exactly one root-to-leaf path, and an inner question is only asked if you arrive at it.',
        mistake: 'Answering the inner condition before the outer one, or thinking "negative" can pair with "big".',
        transfer: 'x = -5: which leaf? (negative - and note the inner x > 10 is NEVER evaluated on that road)'
    }
}, {
    label: 'Dangling else',
    intro: 'The classic trap, no braces anywhere: which if does this else belong to? The tree answers.',
    code: `int x = 7;
if (x > 0)
    if (x > 10)
        System.out.println("big");
else
    System.out.println("small");`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'x = 7. The else is indented under the OUTER if, begging you to attach it to x > 0. Do not trust the picture.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '7' },
            { type: 'extra.set', value: flow(TREE_DANGL, ['start', 'assign'], 'assign') }
        ] },
        { line: 2, message: '7 > 0 is true, we descend. Now the inner question x > 10 is the one still unanswered.', mutations: [
            { type: 'expression.reduce', text: 'x > 0', note: '7 > 0 → true' },
            { type: 'extra.set', value: flow(TREE_DANGL, ['start', 'assign', 'outer'], 'outer') }
        ] },
        { line: 4, message: '7 > 10 is false, and the else that visually hides at column 0 grabs the NEAREST unmatched if: the inner one. small prints.', mutations: [
            { type: 'expression.reduce', text: 'x > 10', note: '7 > 10 → false' },
            { type: 'extra.set', value: flow(TREE_DANGL, ['start', 'assign', 'outer', 'inner', 'small'], 'small') },
            { type: 'console.print', text: 'small' }
        ] },
        { line: 2, message: 'Proof it belongs to the inner if: make x = -5. Then x > 0 is false and the program prints NOTHING - the else was already taken by the inner if, the outer one has none.', mutations: [
            { type: 'memory.set', name: 'x', value: '-5' },
            { type: 'expression.clear' },
            { type: 'expression.reduce', text: 'x > 0', note: '-5 > 0 → false' },
            { type: 'extra.set', value: flow(TREE_DANGL, ['start', 'assign', 'outer', 'none', 'eN'], 'eN', ['inner', 'big', 'small']) }
        ], predict: { q: 'Same tree, new input x = -5. The lone else prints small... or does it?', choices: ['Nothing prints at all', 'small', 'big'], a: 0, why: 'The outer if-false road has no else of its own - the only else was claimed by the inner if. When the outer condition fails, the whole nested pair (else included) is skipped.' } },
        { line: 3, message: 'Fix: braces spell intent. if (x > 0) { if ... else ... } leaves no doubt. AP answer: an else matches the closest unmatched if above it.', mutations: [] }
    ],
    summary: {
        idea: 'An else binds to the NEAREST unmatched if above it. Braces - not indentation - draw the ownership map.',
        mistake: 'Matching the else to the outer if because the source lines up that way.',
        transfer: 'Give the outer if braces WITHOUT an else inside: now which if owns the else? (still the inner one - proximity beats pairing-by-eye)'
    }
}, {
    label: 'Three levels deep',
    intro: 'Same skeleton, deeper: level chips show how far down the tree you are, and every leaf writes a different value.',
    code: `int x = 75;
String grade = "";
if (x >= 60)
{
    if (x >= 90)
        grade = "A";
    else if (x >= 75)
        grade = "B";
    else
        grade = "C";
}
else
    grade = "F";`,
    layout: { center: ['extra'], right: ['expression', 'memory'] },
    steps: [
        { line: 1, message: 'x = 75, grade empty. This tree has three branch levels and four possible leaves.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '75' },
            { type: 'memory.create', name: 'grade', dataType: 'String', value: '""' },
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign'], 'assign', null, true) }
        ] },
        { line: 3, message: 'Level 1 asks x >= 60: true, descend. L1 chip marks the node we are standing on.', mutations: [
            { type: 'expression.reduce', text: 'x >= 60', note: '75 >= 60 → true' },
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign', 'l1'], 'l1', null, true) }
        ] },
        { line: 5, message: 'Level 2 asks x >= 90: false. The A leaf is struck out before it can touch grade.', mutations: [
            { type: 'expression.reduce', text: 'x >= 90', note: '75 >= 90 → false' },
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign', 'l1', 'l2'], 'l2', ['gA', 'eA'], true) }
        ] },
        { line: 7, message: 'Level 3 (an else-if is just an if inside an else): 75 >= 75 is true. Deeper means more questions, but each execution still takes exactly one road per level.', mutations: [
            { type: 'expression.reduce', text: 'x >= 75', note: '75 >= 75 → true' },
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign', 'l1', 'l2', 'l3'], 'l3', ['gA', 'eA', 'gC', 'eC', 'gF', 'eF'], true) }
        ] },
        { line: 7, message: 'The leaf MUTATES a variable: grade becomes "B". Nested decisions are a machine for picking exactly one assignment out of four.', mutations: [
            { type: 'memory.set', name: 'grade', value: '"B"' },
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign', 'l1', 'l2', 'l3', 'gB'], 'gB', ['gA', 'eA', 'gC', 'eC', 'gF', 'eF'], true) }
        ], predict: { q: 'Verdicts so far: >=60 true, >=90 false, >=75 true. Which of the four assignments runs?', choices: ['grade = "A"', 'grade = "B"', 'grade = "C"', 'grade = "F"'], a: 1, why: 'L1 true, L2 false, L3 true lands on the B leaf. Only ONE leaf writes grade; the other three stay struck out.' } },
        { line: 3, message: 'End of the path. To read any decision tree backwards: start at the lit leaf and stack the answers - true, false, true. That is a full trace in three words. Add levels the same way; the exam caps out around four.', mutations: [
            { type: 'extra.set', value: flow(TREE3, ['start', 'assign', 'l1', 'l2', 'l3', 'gB', 'eB'], 'eB', ['gA', 'eA', 'gC', 'eC', 'gF', 'eF'], true) }
        ] }
    ],
    summary: {
        idea: 'Every level is one question. The execution path is an answer string - true, false, true - and the leaf it reaches is the single variable change the run performs.',
        mistake: 'Thinking several leaves can assign grade in one execution, or that L2 is asked when L1 already failed.',
        transfer: 'x = 55: walk the chips. L1 false goes straight to F, so the >=90 and >=75 questions are never asked. One question, one assignment.'
    }
}]
};

export default { topics: { '2.3': t23, '2.4': t24 } };
