const t27 = {
    id: 'u2-while',
    meta: { unit: 2, topic: '2.7', title: 'while Loops', visualizerTitle: 'While Loop Execution Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: 'A while loop is check-first: the body may run many times, or never.',
    code: `int x = 1;
while (x < 5)
{
    x *= 2;
}`,
    layout: { center: ['extra'], right: ['expression', 'memory'] },
    steps: [
        { line: 1, message: 'x starts at 1. The loop below is driven entirely by the condition.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 0, cols: ['Round', 'Check x < 5', 'x after body'], history: [] } }
        ] },
        { line: 2, message: 'Round 1 check: 1 < 5 is true, so the body gets to run.', mutations: [
            { type: 'expression.reduce', text: '1 < 5', note: 'true' }
        ] },
        { line: 4, message: 'Body: x doubles to 2. Then control jumps back to the check, never to the declaration.', mutations: [
            { type: 'memory.set', name: 'x', value: '2' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 1, cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '2']] } }
        ] },
        { line: 2, message: 'Round 2 check: 2 < 5 is still true.', mutations: [
            { type: 'expression.reduce', text: '2 < 5', note: 'true' }
        ] },
        { line: 4, message: 'Body again: x becomes 4.', mutations: [
            { type: 'memory.set', name: 'x', value: '4' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 2, cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '2'], ['2', '2 < 5 → true', '4']] } }
        ] },
        { line: 2, message: 'Round 3 check: 4 < 5 is true. One more round.', mutations: [
            { type: 'expression.reduce', text: '4 < 5', note: 'true' }
        ] },
        { line: 4, message: 'Body: x becomes 8. Notice x has now passed the limit inside the body, not at the check.', mutations: [
            { type: 'memory.set', name: 'x', value: '8' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 3, cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '2'], ['2', '2 < 5 → true', '4'], ['3', '4 < 5 → true', '8']] } }
        ] },
        { line: 2, message: 'Round 4 check: 8 < 5 is false. The body does NOT run again; the loop exits here.', mutations: [
            { type: 'expression.reduce', text: '8 < 5', note: 'false → exit' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 4, note: 'condition false: loop exits', cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '2'], ['2', '2 < 5 → true', '4'], ['3', '4 < 5 → true', '8']] } }
        ], predict: { q: 'The last body run pushed x to 8. Does the body get run a fourth time?', choices: ['No: 8 < 5 is false, the loop exits', 'Yes: x already grew three times'], a: 0, why: 'After a body run, control returns to the CHECK, not to the declaration. 8 < 5 false closes the loop - 3 body runs, 4 checks.' } },
        { line: 2, message: 'History shows every round. If x had started at 9, this table would be empty: a while loop can run zero times. And if the body never changed x, the check would stay true forever: infinite loop.', mutations: [] }
    ],
    summary: {
        idea: 'while = check-first, body-maybe. Every body row in the table was earned by its own true verdict - and one final false check, with no body row, ends the loop.',
        mistake: 'Ending the trace at the last body run and missing the final failed check: checks = body runs + 1.',
        transfer: 'Start x at 3 instead of 1: how many body runs? (3 → 6 → check fails: two rounds, not three)'
    }
}, {
    label: 'Zero rounds',
    intro: 'The exam favorite: a while loop whose condition is false BEFORE the first check. The body is a room you never enter.',
    code: `int x = 9;
while (x < 5)
{
    x *= 2;
}
System.out.println(x);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'Only one thing changed from the guided trace: x starts at 9 instead of 1.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '9' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 0, cols: ['Round', 'Check x < 5', 'x after body'], history: [] } }
        ] },
        { line: 2, message: '9 < 5 is false on the FIRST check. Java evaluated the condition once and never touched the body. The history table stays permanently empty - that empty table IS the answer.', mutations: [
            { type: 'expression.reduce', text: 'x < 5', note: '9 < 5 → false, exit immediately' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 1, note: 'condition false at round 1: body ran ZERO times', cols: ['Round', 'Check x < 5', 'x after body'], history: [] } }
        ], predict: { q: 'Before any body runs: is 9 < 5 true or false?', choices: ['False - the body never exists', 'True - x will grow soon'], a: 0, why: 'A while loop asks BEFORE it acts. The first verdict is already false, so there is no first body run to wait for.' } },
        { line: 6, message: 'Prints 9: x never moved. A while loop is a maybe, not a will. When you trace one, the first question is always: true or false BEFORE round 1?', mutations: [
            { type: 'console.print', text: '9' }
        ] },
        { line: 2, message: 'Counter-case in your head: change line 1 to int x = 4 and the same loop runs once (4 < 5 true, body doubles to 8, second check fails). Start value decides everything: 9 gives 0 rounds, 4 gives 1, 1 gives 3.', mutations: [] }
    ],
    summary: {
        idea: 'A while loop can run ZERO times. The condition gates even the first body run; the history table proving it is an empty table.',
        mistake: 'Assuming the body always executes at least once - the single most common loop error on the multiple-choice.',
        transfer: 'For this loop, which start values give exactly 1 round? (any x with x < 5 but 2x >= 5: x = 2, 3, or 4)'
    }
}, {
    label: 'Never stops',
    intro: 'The infinite loop, caught by the table itself: when rounds start repeating identical rows, something is wrong.',
    code: `int x = 1;
while (x < 5)
{
    x += 0;
}
System.out.println(x);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'Looks like the guided trace - same start, same condition. Only the body changed: x += 0.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 0, cols: ['Round', 'Check x < 5', 'x after body'], history: [] } }
        ] },
        { line: 4, message: 'Round 1: 1 < 5 true, body runs, x += 0 leaves x at... 1. Suspicious.', mutations: [
            { type: 'memory.set', name: 'x', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 1, cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '1 (unchanged)']] } }
        ] },
        { line: 4, message: 'Round 2: same row. Round 3: same row. The history table has become a broken record.', mutations: [
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 3, cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '1 (unchanged)'], ['2', '1 < 5 → true', '1 (unchanged)'], ['3', '1 < 5 → true', '1 (unchanged)']] } }
        ] },
        { line: 2, message: 'DETECTOR: three identical rounds, and no variable in the body moves toward the exit. The condition cannot flip by itself - this loop will never stop. println is unreachable code.', mutations: [
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 4, note: 'INFINITE LOOP: no progress toward false. Body ran 4 times, x never changed.', cols: ['Round', 'Check x < 5', 'x after body'], history: [['1', '1 < 5 → true', '1 (unchanged)'], ['2', '1 < 5 → true', '1 (unchanged)'], ['3', '1 < 5 → true', '1 (unchanged)'], ['4', '1 < 5 → true', '1 (unchanged)']] } }
        ], predict: { q: 'Three rounds, three identical rows, x still 1. Will this loop ever reach the println?', choices: ['Never - infinite loop', 'Yes, after a few more rounds'], a: 0, why: 'A condition only flips when a variable it reads changes. Nothing in the body moves x; the check will answer true forever.' } },
        { line: 4, message: 'The fix is one digit: x += 1 (or the guided trace x *= 2). Debugging rule for every loop: name the ONE variable the condition reads, then confirm the body actually moves it toward the exit. No movement, no exit.', mutations: [] }
    ],
    summary: {
        idea: 'Repeating history rows are the infinite-loop fingerprint. Progress test: the condition variable must move TOWARD false inside the body.',
        mistake: 'Writing x += 0 (or no update at all) and assuming the loop will end on its own.',
        transfer: 'Change the body to x -= 1: infinite? (yes - x runs away from the x < 5 exit instead of toward it)'
    }
}]
};

const t28 = {
    id: 'u2-for',
    meta: { unit: 2, topic: '2.8', title: 'for Loops', visualizerTitle: 'For Loop Execution Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: 'A for loop packs four stages into one line. The order is the whole exam question.',
    code: `for (int i = 0; i < 3; i++)
{
    System.out.print(i);
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'INIT: int i = 0 runs exactly once, before anything else.', mutations: [
            { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'INIT', iteration: 0, cols: ['Round', 'Check i < 3', 'i after update'], history: [] } }
        ] },
        { line: 1, message: 'CHECK: 0 < 3 is true, so the body runs.', mutations: [
            { type: 'expression.reduce', text: '0 < 3', note: 'true' }
        ], predict: { q: 'INIT has run once. Which stage comes next?', choices: ['CHECK the condition', 'BODY - print i', 'UPDATE i++'], a: 0, why: 'The order is INIT → CHECK → BODY → UPDATE → CHECK... The condition always speaks before the body gets a word.' } },
        { line: 3, message: 'BODY: prints 0. print (not println) keeps the cursor on the same line.', mutations: [
            { type: 'console.append', text: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 1, cols: ['Round', 'Check i < 3', 'i after update'], history: [] } }
        ] },
        { line: 1, message: 'UPDATE: i++ runs after the body, then control returns to CHECK. It never returns to INIT.', mutations: [
            { type: 'memory.set', name: 'i', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'UPDATE', iteration: 1, cols: ['Round', 'Check i < 3', 'i after update'], history: [['1', '0 < 3 → true', '1']] } }
        ] },
        { line: 1, message: 'CHECK 1 < 3 true, body prints 1, update makes i = 2.', mutations: [
            { type: 'expression.reduce', text: '1 < 3', note: 'true' },
            { type: 'console.append', text: '1' },
            { type: 'memory.set', name: 'i', value: '2' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 2, cols: ['Round', 'Check i < 3', 'i after update'], history: [['1', '0 < 3 → true', '1'], ['2', '1 < 3 → true', '2']] } }
        ] },
        { line: 1, message: 'CHECK 2 < 3 true, body prints 2, update makes i = 3.', mutations: [
            { type: 'expression.reduce', text: '2 < 3', note: 'true' },
            { type: 'console.append', text: '2' },
            { type: 'memory.set', name: 'i', value: '3' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 3, cols: ['Round', 'Check i < 3', 'i after update'], history: [['1', '0 < 3 → true', '1'], ['2', '1 < 3 → true', '2'], ['3', '2 < 3 → true', '3']] } }
        ] },
        { line: 1, message: 'CHECK one last time: 3 < 3 is false. The loop exits without running the body. The condition is always checked one more time than the body runs.', mutations: [
            { type: 'expression.reduce', text: '3 < 3', note: 'false → exit' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 4, note: 'condition false: loop exits', cols: ['Round', 'Check i < 3', 'i after update'], history: [['1', '0 < 3 → true', '1'], ['2', '1 < 3 → true', '2'], ['3', '2 < 3 → true', '3']] } }
        ], predict: { q: 'The last update made i = 3. Does the body run again?', choices: ['No - but the CHECK still gets one final look', 'Yes - i reached 3 so one more print'], a: 0, why: 'After the update, control returns to the check, not the body. 3 < 3 is false: the body is denied, and that last failed check is how the loop ends.' } },
        { line: 3, message: 'Output: 012. With i <= 3 instead of i < 3 there would be one more round and the output would be 0123. That single character is a whole iteration.', mutations: [] }
    ],
    summary: {
        idea: 'Four stages, one order: init once, then check → body → update forever. The update lands AFTER the body, BEFORE the next check.',
        mistake: 'Tracing the update before the body, or ending the trace before the final false check - the check count is always body count + 1.',
        transfer: 'Swap the update to i += 2: which i values print? (0 and 2 only - two rounds, table shrinks by half)'
    }
}, {
    label: 'One char more',
    intro: 'Run the guided trace again with <= instead of <. Two lines of code differ by one symbol; the tables will not.',
    code: `for (int i = 0; i <= 3; i++)
{
    System.out.print(i);
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'INIT i = 0, exactly like before. Open the guided tab any time to compare the two history tables side by side.', mutations: [
            { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'INIT', iteration: 0, cols: ['Round', 'Check i <= 3', 'i after update'], history: [] } }
        ] },
        { line: 1, message: 'Rounds 1-3 are identical to the < version: 0, 1, 2 print, i climbs to 3.', mutations: [
            { type: 'console.append', text: '012' },
            { type: 'memory.set', name: 'i', value: '3' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'UPDATE', iteration: 3, cols: ['Round', 'Check i <= 3', 'i after update'], history: [['1', '0 <= 3 → true', '1'], ['2', '1 <= 3 → true', '2'], ['3', '2 <= 3 → true', '3']] } }
        ] },
        { line: 1, message: 'HERE IS THE SPLIT: with <, the check 3 < 3 was false and the loop died. With <=, 3 <= 3 is TRUE, the body gets a fourth round, and 3 prints.', mutations: [
            { type: 'expression.reduce', text: 'i <= 3', note: '3 <= 3 → TRUE (a < here would exit)' },
            { type: 'console.append', text: '3' },
            { type: 'memory.set', name: 'i', value: '4' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 4, cols: ['Round', 'Check i <= 3', 'i after update'], history: [['1', '0 <= 3 → true', '1'], ['2', '1 <= 3 → true', '2'], ['3', '2 <= 3 → true', '3'], ['4', '3 <= 3 → true', '4']] } }
        ], predict: { q: 'i is 3 - the guided version died right here. The symbol now reads <=. New round?', choices: ['Yes: 3 <= 3 is true, round 4 runs', 'No: 3 is the stopping number either way'], a: 0, why: '< bounces at the boundary; <= lets the boundary value itself in. One symbol bought a whole iteration and one extra printed digit.' } },
        { line: 1, message: 'Exit only on i = 4. Final: 0123 vs 012. Counting formula to keep: i < end runs (end - start) rounds, i <= end runs one MORE. The boundary value itself is either the last visitor or the bouncer.', mutations: [
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 5, note: '4 <= 3 false: loop exits', cols: ['Round', 'Check i <= 3', 'i after update'], history: [['1', '0 <= 3 → true', '1'], ['2', '1 <= 3 → true', '2'], ['3', '2 <= 3 → true', '3'], ['4', '3 <= 3 → true', '4']] } }
        ] }
    ],
    summary: {
        idea: 'i < end runs (end - start) rounds; i <= end runs exactly one more. The difference is not cosmetic - it is a whole body execution.',
        mistake: 'Trusting the intuition "stops at 3" without checking WHICH symbol guards the boundary.',
        transfer: 'Predict then verify in the guided tab: for (i = 1; i <= 3; i++) printing i gives 123; with i < 3 it gives 12.'
    }
}, {
    label: '2-steps & backwards',
    intro: 'The update slot accepts any statement: i += 2, j--, even j *= 2. The stage order never cares.',
    code: `for (int i = 0; i < 10; i += 2)
{
    System.out.print(i + " ");
}

for (int j = 5; j > 0; j--)
{
    System.out.print(j + " ");
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'Loop A: update is i += 2. INIT once, then CHECK/BODY/UPDATE as always - only the step size changed.', mutations: [
            { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'INIT', iteration: 0, cols: ['Round', 'Check i < 10', 'i after update'], history: [] } }
        ] },
        { line: 1, message: 'Loop A finished: the counter walked 0, 2, 4, 6, 8 - FIVE rounds, not ten. By-twos halves the table. Counting rule: rounds = ceil((end - start) / step).', mutations: [
            { type: 'console.append', text: '0 2 4 6 8 ' },
            { type: 'memory.set', name: 'i', value: '10' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 6, note: '10 < 10 false: exits', cols: ['Round', 'Check i < 10', 'i after update'], history: [['1', '0 < 10 → true', '2'], ['2', '2 < 10 → true', '4'], ['3', '4 < 10 → true', '6'], ['4', '6 < 10 → true', '8'], ['5', '8 < 10 → true', '10']] } }
        ], predict: { q: 'i will walk 0, 2, 4, ... with bound i < 10. How many body runs total?', choices: ['5 rounds', '10 rounds', '11 rounds'], a: 0, why: 'Five true verdicts happen before an update pushes i to 10; the sixth check fails. Step 2 halves the rounds of the same bound.' } },
        { line: 6, message: 'Loop B: j starts HIGH and the condition points DOWN (j > 0), update is j--. Everything runs the same four stages; the timeline just goes the other way.', mutations: [
            { type: 'memory.create', name: 'j', dataType: 'int', value: '5' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'INIT', iteration: 0, cols: ['Round', 'Check j > 0', 'j after update'], history: [] } }
        ] },
        { line: 6, message: 'Loop B finished: 5 4 3 2 1, five rounds, exit when j reaches 0 (0 > 0 false). Reverse loops are not new physics - the variable just shrinks toward the false side of the condition.', mutations: [
            { type: 'console.append', text: '5 4 3 2 1 ' },
            { type: 'memory.set', name: 'j', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 6, note: '0 > 0 false: exits', cols: ['Round', 'Check j > 0', 'j after update'], history: [['1', '5 > 0 → true', '4'], ['2', '4 > 0 → true', '3'], ['3', '3 > 0 → true', '2'], ['4', '2 > 0 → true', '1'], ['5', '1 > 0 → true', '0']] } }
        ] },
        { line: 1, message: 'Exam trap to remember: a backwards loop written as for (int j = 5; j >= 0; j--) runs SIX rounds (0 still prints). >= and < again deciding the boundary visitor.', mutations: [] }
    ],
    summary: {
        idea: 'The update slot accepts ANY statement: i += 2, j--, even j *= 2. Step size and direction change the timeline, never the four-stage order.',
        mistake: 'Counting rounds from the bound (10) instead of the step (5), or panicking at a descending counter.',
        transfer: 'j = 5; j >= 0; j--: how many rounds? (six - >= lets the boundary 0 take its turn)'
    }
}, {
    label: 'Empty slots',
    intro: 'Any of the four stages can be missing from the header. Empty is not absent: the stage still happens, somewhere else.',
    code: `int i = 0;
for (; i < 3; )
{
    System.out.print(i);
    i++;
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'The header opens with a semicolon: INIT slot is EMPTY because line 1 already did the job. i = 0 exists before the loop.', mutations: [
            { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 0, note: 'INIT slot empty - done on line 1 instead', cols: ['Round', 'Check i < 3', 'i after update'], history: [] } }
        ] },
        { line: 2, message: 'Third slot is empty too: no i++ in the header. It lives INSIDE the body, line 5 - still after the body, before the next check. Layout moved, order unchanged.', mutations: [
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 1, note: 'UPDATE slot empty - the body does i++ itself', cols: ['Round', 'Check i < 3', 'i after update'], history: [] } }
        ], predict: { q: 'The header contains NO update at all. Will i ever change?', choices: ['Yes: the update hides inside the body', 'No: i freezes at 0 - infinite loop'], a: 0, why: 'An empty slot is not an empty stage. Somewhere in the code the update still happens; here it is the body\'s last line, exactly where the stage order puts it.' } },
        { line: 4, message: 'Rounds roll: 0 prints then i becomes 1, 1 prints then i becomes 2, 2 prints then i becomes 3.', mutations: [
            { type: 'console.append', text: '012' },
            { type: 'memory.set', name: 'i', value: '3' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 3, note: 'the i++ inside the body IS the UPDATE stage', cols: ['Round', 'Check i < 3', 'i after update'], history: [['1', '0 < 3 → true', '1 (by body)'], ['2', '1 < 3 → true', '2 (by body)'], ['3', '2 < 3 → true', '3 (by body)']] } }
        ] },
        { line: 2, message: 'Check 3 < 3 false, exit. With both the init and update slots empty, this for literally IS a while wearing a hat. Four stages, two spellings: what matters is WHEN each runs, not WHERE it is written.', mutations: [] }
    ],
    summary: {
        idea: 'The four stages exist whether they live in the header or the body: this for-loop is a while-loop in for-clothes.',
        mistake: 'Concluding an empty update slot means the loop never progresses - always look inside the body.',
        transfer: 'Delete line 5 (the body\'s i++) too: what happens now? (infinite - both possible homes for the update are empty)'
    }
}, {
    label: 'Same as while',
    intro: 'Two loops, one trace. Map every for slot to its while line and the mystery evaporates.',
    code: `// FOR version:
for (int i = 0; i < 3; i++)
{
    System.out.print(i);
}

// WHILE version, same trace:
int i = 0;
while (i < 3)
{
    System.out.print(i);
    i++;
}`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 8, message: 'INIT slot ↔ line 8. In the while version the initialization is a visible standalone statement - and it still runs exactly once.', mutations: [
            { type: 'memory.create', name: 'i', dataType: 'int', value: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'INIT', iteration: 0, note: 'while line 8 = for slot 1', cols: ['Round', 'Check', 'i after update'], history: [] } }
        ] },
        { line: 9, message: 'CHECK slot ↔ line 9. Both versions ask the condition BEFORE any body run - including the very first time.', mutations: [
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'CHECK', iteration: 1, note: 'while line 9 = for slot 2', cols: ['Round', 'Check', 'i after update'], history: [] } }
        ] },
        { line: 11, message: 'BODY ↔ line 11: prints 0. Same, obviously.', mutations: [
            { type: 'console.append', text: '0' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'BODY', iteration: 1, note: 'while line 11 = for slot 3', cols: ['Round', 'Check', 'i after update'], history: [] } }
        ] },
        { line: 12, message: 'UPDATE ↔ line 12 - the slot students forget. The for hides i++ at the header end; the while makes it a visible last line of the body. i becomes 1, rounds continue identically, both print 012.', mutations: [
            { type: 'memory.set', name: 'i', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['INIT', 'CHECK', 'BODY', 'UPDATE'], active: 'UPDATE', iteration: 1, note: 'while line 12 = for slot 4 (the forgotten one)', cols: ['Round', 'Check', 'i after update'], history: [['1', '0 < 3 → true', '1']] } }
        ], predict: { q: 'The while version has no update slot. Where did i++ go?', choices: ['Last line inside the body', 'Before the while keyword', 'Nowhere - this loop never updates'], a: 0, why: 'For-slot 4 maps to the body\'s final statement. In the while form the safety net is manual: delete that line and YOU own the infinite loop.' } },
        { line: 12, message: 'Translation both ways is a core FR skill: see a for, name the four parts; see a while, ask whether its update line exists at all. A while missing i++ is the infinite loop from the previous tab.', mutations: [] }
    ],
    summary: {
        idea: 'for = while + labelled slots. Translate either direction by naming INIT, CHECK, BODY, UPDATE - the order is identical in both spellings.',
        mistake: 'Porting a for into a while and forgetting the update line: the compiler will not warn you, the CPU will not thank you.',
        transfer: 'Port while (i < 3) { sum += i; i += 2; } into a for header. (for (int i = 0; i < 3; i += 2))'
    }
}]
};

const PL_COUNTER = { kind: 'patternlab', pattern: 'counter', usesTarget: true, targetName: 'target', arrayName: 'nums', data: [7, 2, 9, 4, 6], target: 5, explain: 'Signature: tracker starts at 0, and if + count++ inside. Edit the data: rows where the test says false show the tracker frozen.' };
const PL_MAX = { kind: 'patternlab', pattern: 'max', usesTarget: false, arrayName: 'nums', data: [7, 2, 9, 4, 6], explain: 'Signature: seed with the FIRST element, then if (v > max) max = v. The tracker only ever grows.' };
const PL_MIN = { kind: 'patternlab', pattern: 'min', usesTarget: false, arrayName: 'nums', data: [7, 2, 9, 4, 6], explain: 'The mirror: if (v < min) min = v. Same skeleton, arrow flipped.' };
const PL_MATCHES = { kind: 'patternlab', pattern: 'matches', usesTarget: true, targetName: 'goal', arrayName: 'nums', data: [3, 7, 3, 3, 9], target: 3, explain: 'Counter with an equality test: how many cells hold exactly the goal. This is the loop version of the banana count from 2.10.' };
const PL_EVENSUM = { kind: 'patternlab', pattern: 'evensum', usesTarget: false, arrayName: 'nums', data: [4, 7, 2, 9, 6, 1], explain: 'Accumulator with a filter: only values passing the % 2 test are added. Selection decides WHICH pieces join the sum.' };
const PL_FIRST = { kind: 'patternlab', pattern: 'first', usesTarget: true, targetName: 'target', arrayName: 'nums', data: [7, 2, 9, 4, 6], target: 5, explain: 'Stop at the first match: the loop quits the moment found changes. Note the visited rows stop early - later cells are never read.' };
const PL_ALL = { kind: 'patternlab', pattern: 'all', usesTarget: true, targetName: 'floor', arrayName: 'nums', data: [7, 8, 9, 4, 6], target: 5, explain: 'Check all: start TRUE-ish (all = true) and one violation flips it and quits. The honest answer for [7, 8, 9, 4, 6] is false, found at index 3.' };
const PL_ANY = { kind: 'patternlab', pattern: 'any', usesTarget: true, targetName: 'target', arrayName: 'nums', data: [2, 4, 1, 9, 0], target: 5, explain: 'Check any: the dual of all - start false, one success flips it and quits. Same loop, opposite seed and opposite test.' };

const t29 = {
    id: 'u2-algorithm-trace',
    meta: { unit: 2, topic: '2.9', title: 'Implementing Selection and Iteration Algorithms', visualizerTitle: 'Selection & Iteration Algorithm Trace Visualizer' },
    modes: [{
    label: 'Accumulator trace',
    intro: 'The accumulator pattern: start flat, add one piece per round.',
    code: `int sum = 0;
int i = 1;
while (i <= 4)
{
    sum += i;
    i++;
}
System.out.println(sum);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'sum is the accumulator: it always starts at 0 (or the identity of the operation). i is the loop control variable.', mutations: [
            { type: 'memory.create', name: 'sum', dataType: 'int', value: '0' },
            { type: 'memory.create', name: 'i', dataType: 'int', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 0, cols: ['Round', 'Check i <= 4', 'sum after'], history: [] } }
        ] },
        { line: 3, message: 'Round 1: 1 <= 4 true. Body adds i to sum: 0 + 1 = 1.', mutations: [
            { type: 'memory.set', name: 'sum', value: '1' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 1, cols: ['Round', 'Check i <= 4', 'sum after'], history: [['1', '1 <= 4 → true', '1']] } }
        ] },
        { line: 3, message: 'Round 2: i = 2, sum grows to 3.', mutations: [
            { type: 'memory.set', name: 'i', value: '2' },
            { type: 'memory.set', name: 'sum', value: '3' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 2, cols: ['Round', 'Check i <= 4', 'sum after'], history: [['1', '1 <= 4 → true', '1'], ['2', '2 <= 4 → true', '3']] } }
        ] },
        { line: 3, message: 'Round 3: i = 3, sum becomes 6.', mutations: [
            { type: 'memory.set', name: 'i', value: '3' },
            { type: 'memory.set', name: 'sum', value: '6' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 3, cols: ['Round', 'Check i <= 4', 'sum after'], history: [['1', '1 <= 4 → true', '1'], ['2', '2 <= 4 → true', '3'], ['3', '3 <= 4 → true', '6']] } }
        ] },
        { line: 3, message: 'Round 4: i = 4, sum becomes 10. The timeline 0 → 1 → 3 → 6 → 10 is the signature of this pattern.', mutations: [
            { type: 'memory.set', name: 'i', value: '4' },
            { type: 'memory.set', name: 'sum', value: '10' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'BODY', iteration: 4, cols: ['Round', 'Check i <= 4', 'sum after'], history: [['1', '1 <= 4 → true', '1'], ['2', '2 <= 4 → true', '3'], ['3', '3 <= 4 → true', '6'], ['4', '4 <= 4 → true', '10']] } }
        ] },
        { line: 3, message: 'Check i = 5: 5 <= 4 is false. Exit, print 10.', mutations: [
            { type: 'memory.set', name: 'i', value: '5' },
            { type: 'console.print', text: '10' },
            { type: 'extra.set', value: { kind: 'loop', stages: ['CHECK', 'BODY'], active: 'CHECK', iteration: 5, note: 'condition false: loop exits', cols: ['Round', 'Check i <= 4', 'sum after'], history: [['1', '1 <= 4 → true', '1'], ['2', '2 <= 4 → true', '3'], ['3', '3 <= 4 → true', '6'], ['4', '4 <= 4 → true', '10']] } }
        ], predict: { q: 'The last round added 4 and bumped i to 5. Does the body run again?', choices: ['No: 5 <= 4 is false', 'Yes: sum has only reached 10'], a: 0, why: 'The exit decision reads the CONDITION, not the accumulator. sum being "unfinished" is irrelevant - i decides.' } },
        { line: 5, message: 'Swap the body and the same skeleton becomes every other Unit 2 algorithm: count matches with if + count++, find a maximum with if (value > max) max = value, sum only evens with a condition inside. Recognize the skeleton, then read the body.', mutations: [] }
    ],
    summary: {
        idea: 'Accumulator signature: a tracker starts at 0 and folds in one piece per round - here the timeline 0 → 1 → 3 → 6 → 10. Iterations: 4. Final i: 5, rejected by 5 <= 4.',
        mistake: 'Forgetting the i++ line and locking the loop, or expecting sum itself to decide when to stop.',
        transfer: 'Change the bound to i <= 3: the loop drops the last piece and sum lands on 6. The bound is the volume knob.'
    }
}, {
    label: 'Counter',
    intro: 'How many cells pass a test? Tracker starts at 0. Edit the numbers or the target: the round table rebuilds live.',
    code: `int count = 0;
for (int i = 0; i < nums.length; i++)
{
    if (nums[i] > 5)
        count++;
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Every round shows the check and whether the tracker moved. The count grows ONLY on true rows.', mutations: [
            { type: 'extra.set', value: PL_COUNTER }
        ] },
        { line: 4, message: 'This skeleton answers every "how many" question: swap the test and it counts evens, negatives, A grades. Recognize: start-0 + loop + if + ++.', mutations: [], predict: { q: 'Default data [7, 2, 9, 4, 6], target 5: in how many rounds will the table show the tracker FROZEN?', choices: ['2 rounds (the misses: 2 and 4)', '3 rounds', '0 rounds'], a: 0, why: 'count grows only on true rows: 7, 9, 6 pass (3 increments), 2 and 4 miss (2 frozen rows). Count and misses always add up to the cells read.' } },
    ],
    summary: {
        idea: 'Roles: count is the counter (0 until proven), i is the loop-control variable, the if is the bouncer. Selection gates the increment; iteration supplies the candidates.',
        mistake: 'Incrementing count on every round instead of only true rounds - watch the frozen rows.',
        transfer: 'Swap the test to == target: the same machine now counts exact matches instead of above-target ones.'
    }
}, {
    label: 'Find maximum',
    intro: 'The champion pattern: seed with the first element, every later cell tries to dethrone it.',
    code: `int max = nums[0];
for (int i = 1; i < nums.length; i++)
{
    if (nums[i] > max)
        max = nums[i];
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Notice the loop starts at i = 1: element 0 already holds the seed. Edit the data and watch the tracker jump only on new champions.', mutations: [
            { type: 'extra.set', value: PL_MAX }
        ] },
        { line: 4, message: 'The tracker is monotonic: it only grows. Same skeleton with < finds the minimum - that is the whole pattern family.', mutations: [] }
    ],
    summary: {
        idea: 'Champion pattern: seed FROM the data (nums[0]), start the loop at 1, and dethrone-or-keep each cell. The tracker only ever grows.',
        mistake: 'Seeding max with 0 - see the Find-the-bug tab for how that lies on negative data.',
        transfer: 'Make it report the POSITION of the max instead of the value: the tracker changes from max to maxIndex, and the assignment writes i.'
    }
}, {
    label: 'Find minimum',
    intro: 'Mirror of maximum. One character (< instead of >) flips the champion into the last-place holder.',
    code: `int min = nums[0];
for (int i = 1; i < nums.length; i++)
{
    if (nums[i] < min)
        min = nums[i];
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Seed with nums[0], same as max. The explain note under the table reminds you which way the arrow points.', mutations: [
            { type: 'extra.set', value: PL_MIN }
        ] },
        { line: 4, message: 'FR trap corner: max and min seeded with 0 instead of nums[0] break on all-negative data - try that exact bug in the Find-the-bug tab.', mutations: [] }
    ],
    summary: {
        idea: 'The max mirror: < instead of >, same nums[0] seed, same loop start at 1. Pattern families are one arrow apart.',
        mistake: 'Seeding min with 0 (or Integer.MAX_VALUE without thinking) and trusting it on mixed-sign data.',
        transfer: 'Ask for index-of-min instead of min: which value does the tracker write - v or i?'
    }
}, {
    label: 'Count matches',
    intro: 'Counter with an equality test: count the cells holding EXACTLY the goal.',
    code: `int count = 0;
for (int i = 0; i < nums.length; i++)
{
    if (nums[i] == 3)
        count++;
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Same skeleton as Counter, one word changed: > becomes ==. The data [3, 7, 3, 3, 9] should give 3. Edit it and trust the table.', mutations: [
            { type: 'extra.set', value: PL_MATCHES }
        ] },
        { line: 4, message: 'String version: if (words[i].equals(goal)) count++ - the exam loves swapping == for equals and .length().', mutations: [] }
    ],
    summary: {
        idea: 'Equality-gated counter: loop over every cell, if (v == goal) count++. This is the banana count from 2.10 promoted to arrays.',
        mistake: 'With String data, using == instead of .equals() - reference vs text, the 2.2 warning returns.',
        transfer: 'Change == to >: the question flips from "how many exact matches" to "how many above goal".'
    }
}, {
    label: 'Conditional sum',
    intro: 'Accumulator plus a doorman: only filtered values join the sum.',
    code: `int sum = 0;
for (int i = 0; i < nums.length; i++)
{
    if (nums[i] % 2 == 0)
        sum += nums[i];
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Compare with the guided accumulator tab: there EVERY round added; here the if decides WHO gets added. 4 + 2 + 6 = 12.', mutations: [
            { type: 'extra.set', value: PL_EVENSUM }
        ] },
        { line: 4, message: 'Selection inside iteration is the power combo: change the test to nums[i] > 0 and you sum only positives, to v % 3 == 0 for multiples of three. Skeleton fixed, question open.', mutations: [] }
    ],
    summary: {
        idea: 'Accumulator behind a doorman: the % 2 test decides WHO joins the sum. 4 + 2 + 6 = 12 for the default data.',
        mistake: 'Adding every cell (accumulator without the gate) or gating but forgetting +=.',
        transfer: 'Flip the test to v % 2 == 1: the sum turns into the odds: 7 + 9 + 1 = 17.'
    }
}, {
    label: 'First match',
    intro: 'Linear search, baby version: remember the index where the condition FIRST held, then stop asking.',
    code: `int found = -1;
for (int i = 0; i < nums.length && found == -1; i++)
{
    if (nums[i] > 5)
        found = i;
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Seed is -1, the honest "not there yet" value. The first row that passes stamps its index into found and the loop quits - later cells are never read.', mutations: [
            { type: 'extra.set', value: PL_FIRST }
        ] },
        { line: 2, message: 'Why -1 and not 0: 0 is a real index. A sentinel must be a value the data itself can never produce. If the scan ends at -1, the answer is: not found.', mutations: [], predict: { q: 'Data [7, 2, 9, 4, 6], target 5: does this loop ever read index 1?', choices: ['No: 7 matches at index 0 and the guard quits', 'Yes: searches always scan everything'], a: 0, why: 'The loop condition carries && found == -1: the first stamp ends the scan. Early exit is the whole point of the pattern.' } },
    ],
    summary: {
        idea: 'First-match signature: sentinel seed (-1), a quit-guard in the loop condition, and the tracker writes the INDEX. Later cells are never read.',
        mistake: 'Seeding the sentinel with 0 - indistinguishable from "found at index 0".',
        transfer: 'Set the target to 99 in the widget: the table visits every cell and found must stay -1. That is what "not found" looks like.'
    }
}, {
    label: 'Check all',
    intro: 'Universal claim: true until PROVEN false. One counterexample ends the whole investigation.',
    code: `boolean allPass = true;
for (int i = 0; i < nums.length && allPass; i++)
{
    if (nums[i] <= 5)
        allPass = false;
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Data [7, 8, 9, 4, 6]: three clean rounds, then 4 breaks the claim at index 3 and the table stops. Answer: false.', mutations: [
            { type: 'extra.set', value: PL_ALL }
        ] },
        { line: 3, message: 'The test is the NEGATED claim (<= floor, not > floor): you disprove "all" with one witness. This is De Morgan wearing work clothes.', mutations: [], predict: { q: 'Data [7, 8, 9, 4, 6], floor 5: does the loop reach index 4?', choices: ['No: 4 breaks the claim at index 3 and the guard quits', 'Yes: proving "all" needs every cell'], a: 0, why: 'A true claim WOULD read every cell - but this one dies at the first witness against it, and the scan stops early.' } },
    ],
    summary: {
        idea: 'Check-all signature: flag starts true, the TEST is the negated claim, the guard quits at the first violation. One witness disproves a universal.',
        mistake: 'Testing the claim itself (> floor) instead of its negation - then the flag never flips.',
        transfer: 'Replace the data with [6, 7, 8]: now no violation exists, the guard never trips, and all stays true after every cell is read.'
    }
}, {
    label: 'Check any',
    intro: 'Existential claim: false until PROVEN true. The twin of Check all with both seeds flipped.',
    code: `boolean anyPass = false;
for (int i = 0; i < nums.length && !anyPass; i++)
{
    if (nums[i] > 5)
        anyPass = true;
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Data [2, 4, 1, 9, 0]: four rounds of failure, then 9 proves existence at index 3, loop quits with true.', mutations: [
            { type: 'extra.set', value: PL_ANY }
        ] },
        { line: 2, message: 'Put the pair side by side: all starts true and dies early; any starts false and wins early. The loop condition always guards the OPPOSITE of the seed. That is every sentinel/flag question on the FR.', mutations: [], predict: { q: 'Data [2, 4, 1, 9, 0], target 5: how many cells does this loop read?', choices: ['4 - it wins at index 3 and quits', '5 - it must finish the array', '1 - it quits immediately'], a: 0, why: 'any starts false and stands guard with !anyPass: the first success (9 > 5 at index 3) flips the flag and the guard stops the scan before index 4.' } },
    ],
    summary: {
        idea: 'Check-any is check-all mirrored: seed false, win early, guard reads the opposite of the seed. Sentinel/flag questions are always about seed + guard.',
        mistake: 'Guarding with the flag itself (while anyPass) - the loop would run only while already true.',
        transfer: 'Set the data so nothing beats 5: the loop reads every cell and any stays false. That is "no match" done honest.'
    }
}, {
    label: 'Find the bug',
    intro: 'A max algorithm that returns a number not even in the data. Trace it, catch the crime, then fix it.',
    code: `// BUG lives on line 1
int max = 0;
for (int i = 0; i < nums.length; i++)
{
    if (nums[i] > max)
        max = nums[i];
}
// nums = [-3, -7, -2]`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 3, message: 'Data is ALL NEGATIVE: [-3, -7, -2]. Round by round, the tracker refuses to move. Final answer: 0. But 0 is not in the list!', mutations: [
            { type: 'extra.set', value: { kind: 'math', rows: [
                { call: 'start', result: 'max = 0', note: '0 never appears in the data' },
                { call: 'i = 0: -3 > 0 ?', result: 'false', note: 'tracker untouched' },
                { call: 'i = 1: -7 > 0 ?', result: 'false', note: 'still nothing' },
                { call: 'i = 2: -2 > 0 ?', result: 'false', note: 'the REAL max never gets to win' },
                { call: 'end', result: 'println(0)', note: 'confidently wrong' }
            ] }, predict: { q: 'nums = [-3, -7, -2] and max is seeded with 0. What will this code print?', choices: ['0 - the seed wins by default', '-2 - the true maximum', '-7 - the smallest'], a: 0, why: 'No negative number can beat the seeded 0, so every comparison fails - and the "maximum" is a value that never appeared in the data.' } }
        ] },
        { line: 1, message: 'The bug: seeding with a magic 0 smuggles in a contestant that the data cannot beat. The seed must come FROM the data - or be a value guaranteed to lose to everything (Integer.MIN_VALUE).', mutations: [] },
        { line: 1, message: 'Fix applied: max = nums[0], loop from 1. Same negative data now returns the true champion, -2. Poke other data into it, including all-positive and single-element lists.', mutations: [
            { type: 'extra.set', value: { kind: 'patternlab', pattern: 'max', usesTarget: false, arrayName: 'nums', data: [-3, -7, -2], explain: 'FIXED: seed = nums[0]. First element enters the ring as champion, and every real comparison follows. Final: -2, an element that EXISTS.' } }
        ] }
    ],
    summary: {
        idea: 'A tracker seed is a CLAIM about the data: max = 0 claims "nothing here beats zero" - false the moment every element is negative. Seed with the data itself.',
        mistake: 'Magic-number seeds (0 for max, 0 for min) - they look harmless and lie on all-negative or all-positive inputs.',
        transfer: 'Integer.MIN_VALUE as seed is always correct for max, but nums[0] survives the "empty array?" conversation better on the FR.'
    }
}]
};

export default { topics: { '2.7': t27, '2.8': t28, '2.9': t29 } };
