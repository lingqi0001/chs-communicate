const EVAL22 = {
    kind: 'evaluator',
    vars: [{ name: 'x', value: 8, min: -10, max: 20 }, { name: 'y', value: 12, min: -10, max: 20 }],
    cases: ['x < y', 'x > y', 'x == y', 'x != y', 'x + 2 >= y', 'x * 2 <= y', '!(x < y)', 'x > 0 && x < 10', 'x > 100 || x != y'],
    opNotes: {
        '<': 'less than: true only when the left value sits below the right one.',
        '>': 'greater than: the mirror of <.',
        '<=': 'less than or equal: the boundary value counts.',
        '>=': 'greater than or equal: the boundary value counts.',
        '==': 'tests equality and yields a boolean. It never changes x.',
        '!=': 'true exactly when the two sides differ.',
        '!': 'flip: true becomes false and false becomes true.',
        '&&': 'true only if BOTH sides are true (and may skip the right side).',
        '||': 'true if EITHER side is true (and may skip the right side).'
    },
    practice: { left: 'x', right: 'y', ops: ['<', '>', '<=', '>=', '==', '!='], min: -5, max: 20 },
    typeRows: [
        { t: 'Numbers: comparisons always finish as exactly one word, TRUE or FALSE.' },
        { t: 'Booleans: boolean b = (x < y) stores the verdict. if (b == true) and if (b) do the same thing.' },
        { t: 'Order of work: arithmetic (+ - * /) runs BEFORE the comparison. x + 2 >= y computes x + 2 first.' },
        { t: 'Strings: == compares references (same object?), .equals() compares the text. Two Strings with the same letters can still be == false. Classic AP trap.' }
    ],
    errorRows: [
        { code: 'if (x = 5)', why: 'single = ASSIGNS. The if needs a boolean, so Java rejects this line at compile time.' },
        { code: 'int b = (x < y);', why: 'x < y finishes as a boolean; an int slot cannot hold TRUE. Use boolean b = ...' }
    ]
};

const t22 = {
    id: 'u2-boolean-expressions',
    meta: { unit: 2, topic: '2.2', title: 'Boolean Expressions', visualizerTitle: 'Boolean Expression Evaluator' },
    modes: [{
    label: 'Guided trace',
    intro: 'A boolean expression always ends as exactly one thing: true or false.',
    code: `int x = 8;
int y = 12;
boolean a = x < y;
boolean b = x + 2 >= y;`,
    layout: { center: ['extra'], right: ['expression', 'memory'] },
    steps: [
        { line: 1, message: 'Two int variables first. Their values will feed the comparisons.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '8' },
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'x', value: '8' }, op: '?', right: { text: 'y', value: '12' }, result: 'waiting', note: 'Pick an operator: x < y is next.' } }
        ] },
        { line: 2, message: 'y is 12. A comparison reads both sides as arithmetic expressions first.', mutations: [
            { type: 'memory.create', name: 'y', dataType: 'int', value: '12' }
        ] },
        { line: 3, message: 'x < y becomes 8 < 12. Eight is below twelve, so the comparison is true.', mutations: [
            { type: 'expression.reduce', text: 'x < y', note: '8 < 12' },
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'x', value: '8' }, op: '<', right: { text: 'y', value: '12' }, result: 'TRUE' } }
        ], predict: { q: 'x = 8, y = 12. What does the comparison 8 < 12 return?', choices: ['true', 'false'], a: 0, why: 'Both sides are read as arithmetic first (plain 8 and 12 here), then the relation decides: 8 sits below 12.' } },
        { line: 3, message: 'The comparison result is itself a value: a boolean. It can be stored.', mutations: [
            { type: 'memory.create', name: 'a', dataType: 'boolean', value: 'true' }
        ] },
        { line: 4, message: 'Arithmetic inside a comparison runs before the comparison: x + 2 becomes 10.', mutations: [
            { type: 'expression.reduce', text: 'x + 2 >= y', note: 'arithmetic first' },
            { type: 'expression.reduce', text: '10 >= 12' }
        ] },
        { line: 4, message: '10 is not at least 12, so this whole expression is false.', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'x + 2', value: '10' }, op: '>=', right: { text: 'y', value: '12' }, result: 'FALSE' } }
        ], predict: { q: 'The left side computed to 10, the right side is 12. Is 10 >= 12 true or false?', choices: ['false: 10 is below 12', 'true: >= ignores small gaps'], a: 0, why: '>= reads "at least": 10 is not at least 12. Note the arithmetic (x + 2) ran before the comparison ever spoke.' } },
        { line: 4, message: 'b stores false. Watch for the classic trap: = assigns, == compares.', mutations: [
            { type: 'memory.create', name: 'b', dataType: 'boolean', value: 'false' }
        ] }
    ],
    summary: {
        idea: 'Every boolean expression collapses to one word, true or false. Arithmetic runs first, the comparison judges, and the verdict itself is a value you can store.',
        mistake: 'Confusing = (assign a value) with == (compare two values). The exam hides this trap in nearly every FR.',
        transfer: 'Same x and y: what does x + 4 > y return? (12 > 12 is false - strict > shows no boundary mercy.)'
    }
}, {
    label: 'Hands-on evaluator',
    intro: 'Change x and y yourself: every comparison re-decides live, arithmetic first and the comparison after. Tap any operator to read its meaning, then drill with random practice.',
    code: `int x = 8;
int y = 12;
// every comparison below is re-run
// the moment you touch a value`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Slide or type new values. The middle row shows the substituted arithmetic, the chip shows the final TRUE/FALSE.', mutations: [
            { type: 'extra.set', value: EVAL22 }
        ] }
    ],
    summary: {
        idea: 'The substituted middle line is the work Java actually does: evaluate the arithmetic on each side, then compare those numbers.',
        mistake: 'Believing x + 2 >= y compares x with 2 first. + binds tighter than >=: the sum is computed, then judged.',
        transfer: 'Set values until x > 10 flips to true, then turn a >= into a > and watch a boundary row change its mind.'
    }
}]
};

const SWAP25 = { kind: 'swap', vars: [{ name: 'x', value: 0 }, { name: 'y', value: 5 }], left: 'x != 0', right: '10 / x > y', ops: ['&&', '||'], negNote: true };
const TG25A = { kind: 'truthgen', vars: ['A', 'B'], exprs: ['A && B', 'A || B'], note: 'Every A/B combination tested automatically. A single disagreeing row is enough to prove these two shapes are NOT the same operator.' };
const TG25B = { kind: 'truthgen', vars: ['A', 'B'], exprs: ['!(A && B)', '!A || !B'] };
const TG25C = { kind: 'truthgen', vars: ['A', 'B'], exprs: ['!(A || B)', '!A && !B'] };
const TG25D = { kind: 'truthgen', vars: ['A', 'B'], exprs: ['!(A && B)', '!A && !B'], note: 'The tempting wrong answer: negating the parts but keeping && is a different expression. The connective must flip too.' };

const t25 = {
    id: 'u2-compound-boolean',
    meta: { unit: 2, topic: '2.5', title: 'Compound Boolean Expressions', visualizerTitle: 'Boolean Logic & Short-Circuit Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: '&& and || may never touch their right side. Short-circuiting is Java protecting its own evaluation order.',
    code: `int x = 0;
boolean safe = x != 0 && 10 / x > 2;
int y = 5;
boolean big = y > 100 || x != 0;`,
    layout: { center: ['extra'], right: ['expression', 'memory'] },
    steps: [
        { line: 1, message: 'x is 0. Keep that in mind: dividing by it would crash the program.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '0' }
        ] },
        { line: 2, message: '&& evaluates the LEFT side first. x != 0 is 0 != 0, which is false.', mutations: [
            { type: 'expression.reduce', text: 'x != 0 && 10 / x > 2' },
            { type: 'expression.reduce', text: 'false && ...', note: 'left side done' }
        ] },
        { line: 2, message: 'A false left side already decides an &&. The right side is never evaluated, so the division by zero never happens.', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'x != 0', value: 'FALSE' }, op: '&&', right: { text: '10 / x > 2', state: 'skipped' }, result: 'FALSE', note: 'Short-circuit: the right side is skipped, crash avoided.' } }
        ], predict: { q: 'The left side 0 != 0 just returned false. Will Java go on to compute 10 / x?', choices: ['No: false && anything is already decided', 'Yes: both sides are always evaluated'], a: 0, why: 'An && with a false left side never asks the right - here that refusal is what prevents a division-by-zero crash.' } },
        { line: 2, message: 'safe stores false. Short-circuit is not just an exam rule, it controls whether code runs at all.', mutations: [
            { type: 'memory.create', name: 'safe', dataType: 'boolean', value: 'false' }
        ] },
        { line: 4, message: 'For ||, a TRUE left side would short-circuit. Here y > 100 is false, so Java must ask the right side too.', mutations: [
            { type: 'memory.create', name: 'y', dataType: 'int', value: '5' },
            { type: 'expression.reduce', text: 'y > 100 || x != 0' },
            { type: 'expression.reduce', text: 'false || ...', note: 'left is false, right still needed' }
        ], predict: { q: 'The left side y > 100 came back false. Does the right side get evaluated now?', choices: ['Yes: false || ? is still an open question', 'No: || always skips the right side'], a: 0, why: '|| skips only when the LEFT side is true. A false left means the right side must speak for the pair.' } },
        { line: 4, message: 'The right side runs: 0 != 0 is false. false || false is false.', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'y > 100', value: 'FALSE' }, op: '||', right: { text: 'x != 0', value: 'FALSE' }, result: 'FALSE' } },
            { type: 'memory.create', name: 'big', dataType: 'boolean', value: 'false' }
        ] },
        { line: 4, message: 'The third operator, !, simply flips: !(x != 0) with x = 0 is !false, which is true. Precedence: ! first, then &&, then ||.', mutations: [
            { type: 'expression.clear' },
            { type: 'expression.reduce', text: '!(x != 0)' },
            { type: 'expression.reduce', text: '!false' },
            { type: 'expression.reduce', text: 'true' }
        ] }
    ],
    summary: {
        idea: '&& and || read the LEFT side first; one side can decide the whole verdict, and then the other side is not evaluated at all.',
        mistake: 'Assuming every subexpression runs. Side effects (and crashes) of a skipped side simply never happen.',
        transfer: 'Make the left side true instead: does 10 / x get evaluated in x != 0 && 10 / x > 2 now? (yes - and with x = 2 it is 5 > 2, true)'
    }
}, {
    label: 'Swap the operator',
    intro: 'Tap the middle gate to swap && / ||. Watch which side Java refuses to evaluate, and which crash it avoids.',
    code: `int x = 0;
int y = 5;
boolean r = x != 0 && 10 / x > y;
// tap the gate between the cards`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 3, message: 'Start with x = 0 and the gate on &&. The left side is false, so the division is never computed and no crash happens.', mutations: [
            { type: 'extra.set', value: SWAP25 }
        ] },
        { line: 3, message: 'Now tap the gate to ||. A false left side no longer decides anything: Java MUST run 10 / x, and with x = 0 the whole expression crashes. Same code, one operator swapped, opposite outcome.', mutations: [] }
    ],
    summary: {
        idea: 'Short-circuit is an evaluation ORDER rule: it decides WHICH subexpressions Java even looks at, not just the final value.',
        mistake: 'Thinking || protects the right side the way && does. A false left under || DEMANDS the right side.',
        transfer: 'Slide x to 2 with the gate on &&: does the right side run now? (yes - 2 != 0 is true, so 10 / 2 > 5 must be checked)'
    }
}, {
    label: 'Truth table lab',
    intro: 'A compound expression is fully described by its truth table. Generated automatically: every combination of A and B, no skipping.',
    code: `// A and B are boolean variables.
// The table tries all 4 combinations
// and compares whole columns.`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'First suspects: is && just the same as ||? The highlighted row says no.', mutations: [
            { type: 'extra.set', value: TG25A }
        ] },
        { line: 1, message: 'De Morgan candidate one: !(A && B) versus !A || !B. Every row agrees, so the negation of "both" is "not this OR not that".', mutations: [
            { type: 'extra.set', value: TG25B }
        ], predict: { q: 'Before the table fills: will !(A && B) and !A || !B agree on all four rows?', choices: ['Agree - they are equivalent', 'Split - they differ somewhere'], a: 0, why: 'This is De Morgan exactly as the rule says: the parts get negated AND the connective flips from && to ||.' } },
        { line: 1, message: 'Candidate two: !(A || B) versus !A && !B. Also equivalent: the negation of "at least one" is "neither".', mutations: [
            { type: 'extra.set', value: TG25C }
        ] },
        { line: 1, message: 'The classic wrong answer keeps && and forgets to flip the connective. One counterexample row kills it.', mutations: [
            { type: 'extra.set', value: TG25D }
        ], predict: { q: 'Shortcut candidate: !(A && B) versus !A && !B - keep the &&, only negate the parts. Survive the table?', choices: ['No - a counterexample row will split them', 'Yes - negating the parts is enough'], a: 0, why: 'Try A true, B false: !(A && B) = true but !A && !B = false. De Morgan flips BOTH the parts and the connective.' } }
    ],
    summary: {
        idea: 'Equivalence means identical columns on EVERY combination. De Morgan: !(A && B) = !A || !B and !(A || B) = !A && !B - the connective always flips.',
        mistake: 'Negating the parts but keeping the connective - the tab you just watched fail.',
        transfer: 'Write out !(A || B) by the rule, then verify it here: !A && !B, all rows green.'
    }
}, {
    label: 'Side effects',
    intro: 'Short-circuit is not only about values: a skipped side never runs its code. This scenario counts console lines.',
    code: `static boolean check(int n)
{
    System.out.println("check ran");
    return n > 5;
}

boolean a = false && check(9);
boolean b = true || check(9);
boolean c = true && check(9);`,
    layout: { center: ['extra'], right: ['memory', 'console'] },
    steps: [
        { line: 7, message: 'check() prints a line when it runs. Three calls are written below. Line 7: false && check(9). The && is already decided by the false left side.', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'false', value: 'FALSE' }, op: '&&', right: { text: 'check(9)', state: 'skipped' }, result: 'FALSE', note: 'Left side decides the &&: check(9) is never called, so nothing prints.' } }
        ] },
        { line: 7, message: 'a stores false. Console so far: empty, even though the code literally contains three calls.', mutations: [
            { type: 'memory.create', name: 'a', dataType: 'boolean', value: 'false' }
        ] },
        { line: 8, message: 'Line 8: true || check(9). A TRUE left side short-circuits ||. b stores true, still no print.', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'true', value: 'TRUE' }, op: '||', right: { text: 'check(9)', state: 'skipped' }, result: 'TRUE', note: 'Left side decides the ||: the method never runs.' } },
            { type: 'memory.create', name: 'b', dataType: 'boolean', value: 'true' }
        ] },
        { line: 9, message: 'Line 9: true && check(9). No decision yet, Java MUST ask the right side. The method runs, the console gets a line, and c stores true (9 > 5).', mutations: [
            { type: 'extra.set', value: { kind: 'bool', left: { text: 'true', value: 'TRUE' }, op: '&&', right: { text: 'check(9)', value: 'TRUE' }, result: 'TRUE', note: 'Neither side could decide alone, so both run.' } },
            { type: 'console.print', text: 'check ran' },
            { type: 'memory.create', name: 'c', dataType: 'boolean', value: 'true' }
        ], predict: { q: 'Third call: true && check(9). Does check run this time, or does the console stay quiet?', choices: ['Runs - a true left does NOT decide an &&', 'Skipped - the left side already spoke'], a: 0, why: '&& needs a FALSE to short-circuit; true leaves the verdict open. The answer genuinely lives in check(9), so it runs - and its side effect fires.' } },
        { line: 9, message: 'Final console: exactly ONE line from three written calls. On the exam this is the whole question: short-circuit controls whether code runs at all, not just what value comes back.', mutations: [] }
    ],
    summary: {
        idea: 'Short-circuit controls WHETHER code runs: three method calls written, one console line printed. The skipped calls never happened.',
        mistake: 'Counting three console lines because three calls appear in the source. The console records only evaluated code.',
        transfer: 'Change line 8 to false || check(9): how many lines print now? (two - a false left under || demands the right side)'
    }
}]
};

const TG26S = { kind: 'truthgen', vars: ['A', 'B'], exprs: ['!(A || B)', '!A && !B'], note: 'The rule used below, verified across every A/B combination.' };

const t26 = {
    id: 'u2-boolean-equivalence',
    meta: { unit: 2, topic: '2.6', title: 'Comparing Boolean Expressions', visualizerTitle: 'Boolean Equivalence Visualizer' },
    modes: [{
    label: 'Guided trace',
    intro: 'Two expressions are equivalent when no input can ever separate them.',
    code: `// Test !(x > 5) against x <= 5
// with x = 3, x = 5 and x = 6
boolean same1 = !(3 > 5) == (3 <= 5);
boolean same2 = !(5 > 5) == (5 <= 5);
boolean same3 = !(6 > 5) == (6 <= 5);`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 2, message: 'Try x = 3. Left: !(3 > 5) = !false = true. Right: 3 <= 5 = true. This row agrees.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x <= 5'], rows: [[3, 'true', 'true']] } }
        ] },
        { line: 2, message: 'The boundary x = 5 is where students guess wrong. !(5 > 5) = !false = true, and 5 <= 5 = true. Still agrees.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x <= 5'], rows: [[3, 'true', 'true'], [5, 'true', 'true']] } }
        ], predict: { q: 'Boundary test x = 5: will !(5 > 5) and 5 <= 5 agree, or is this where they split?', choices: ['Agree - both come out true', 'Split - the negation flips'], a: 0, why: '5 > 5 is false, negated to true; and 5 <= 5 is true. The boundary agreeing is exactly what separates <= from <.' } },
        { line: 2, message: 'x = 6: !(6 > 5) = !true = false, and 6 <= 5 = false. Third agreement.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x <= 5'], rows: [[3, 'true', 'true'], [5, 'true', 'true'], [6, 'false', 'false']] } }
        ] },
        { line: 2, message: 'Every test row matches, so !(x > 5) and x <= 5 are equivalent. Negating a comparison flips the operator and keeps the boundary: > becomes <=.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x <= 5'], rows: [[3, 'true', 'true'], [5, 'true', 'true'], [6, 'false', 'false']], verdict: 'Equivalent: every input gives the same result' } }
        ] },
        { line: 2, message: 'The same trick on compound expressions is De Morgan: !(A && B) is the same as !A || !B, and !(A || B) is the same as !A && !B. The operator flips too, not just the parts.', mutations: [
            { type: 'expression.reduce', text: '!(A && B)', note: 'De Morgan' },
            { type: 'expression.reduce', text: '!A || !B' }
        ] }
    ],
    summary: {
        idea: 'Equivalence must survive the boundary value. Negating a comparison flips the operator (> to <=) and KEEPS the boundary number.',
        mistake: 'Guessing that !(x > 5) is x < 5 - the boundary x = 5 splits that pair.',
        transfer: 'Same drill for !(x >= 3): the answer keeps the 3 (x < 3 drops it). Predict, then test x = 3 to feel the flip.'
    }
}, {
    label: 'Find a counterexample',
    intro: 'Agreement is hard, disagreement is easy: ONE input that splits the columns proves non-equivalence. Go hunt for it.',
    code: `// Tempting shortcut for !(x > 5):
// is it just x < 5 ?
boolean s1 = !(3 > 5) == (3 < 5);
boolean s2 = !(5 > 5) == (5 < 5);
boolean s3 = !(6 > 5) == (6 < 5);`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 3, message: 'x = 3: !(3 > 5) = true, 3 < 5 = true. Row agrees. Three agreeing rows proved nothing yet - keep testing.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x < 5'], rows: [[3, 'true', 'true']] } }
        ] },
        { line: 4, message: 'x = 5, the boundary: !(5 > 5) = !false = true, but 5 < 5 = FALSE. The columns split. Found it: this row IS the counterexample.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x < 5'], rows: [[3, 'true', 'true'], [5, 'true', 'false']] } },
            { type: 'expression.reduce', text: '!(5 > 5) == (5 < 5)', note: 'true == false' },
            { type: 'expression.reduce', text: 'false', note: 'one split row is all the proof needed' }
        ], predict: { q: 'The candidate was x < 5 for !(x > 5). x = 5 is the boundary. Does the candidate survive this row?', choices: ['No: !(5>5) is true but 5<5 is false - split', 'Yes: they still agree'], a: 0, why: 'The strict < throws away the boundary the negation keeps. One split row proves non-equivalence; a hundred agreement rows could not disprove it.' } },
        { line: 5, message: 'x = 6 agrees again (false/false), but too late. Verdict: NOT equivalent. The correct negation of x > 5 keeps the boundary: x <= 5.', mutations: [
            { type: 'extra.set', value: { kind: 'truth', cols: ['x', '!(x > 5)', 'x < 5'], rows: [[3, 'true', 'true'], [5, 'true', 'false'], [6, 'false', 'false']], verdict: 'NOT equivalent: the x = 5 row is a counterexample' } }
        ] },
        { line: 1, message: 'How to test fast: pick the boundary value first (here 5), then one value on each side. If the boundary agrees, you have strong evidence; if it splits, you have your counterexample.', mutations: [] }
    ],
    summary: {
        idea: 'Agreement is universal, disagreement is a single witness: ONE counterexample row ends the equivalence claim.',
        mistake: 'Testing only friendly values (3 and 6 here), getting two nods, and declaring equivalent.',
        transfer: 'Hunt a counterexample for !(x > 5) versus x <= 5: try 3, 5, 6. Find a split? (none - that pair truly is equivalent)'
    }
}, {
    label: 'Simplify step by step',
    intro: 'Equivalence rules are also a rewrite machine: push the ! inward until nothing is negated left.',
    code: `// Simplify, in two moves:
//   !(x > 5 || x < 2)
boolean ok = x <= 5 && x >= 2;`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 2, message: 'Start. The ! wraps a whole || expression, so the first move must be De Morgan: negate both parts and FLIP the connective.', mutations: [
            { type: 'expression.clear' },
            { type: 'expression.reduce', text: '!(x > 5 || x < 2)', note: 'start' }
        ] },
        { line: 2, message: 'De Morgan applied: || becomes &&, and each comparison gets its own !.', mutations: [
            { type: 'expression.reduce', text: '!(x > 5) && !(x < 2)', note: 'step 1: De Morgan, connective flips' }
        ], predict: { q: 'Pushing the ! inward across (x > 5 || x < 2): what happens to the ||?', choices: ['It flips to &&', 'It stays || - only the parts change'], a: 0, why: 'De Morgan negates both parts AND flips the connective. Keeping || is the most-tested mistake in equivalence FRs.' } },
        { line: 2, message: 'Move two: absorb each ! into its comparison. > becomes <=, < becomes >=. The boundaries stay glued to their side.', mutations: [
            { type: 'expression.reduce', text: 'x <= 5 && x >= 2', note: 'step 2: !(a > b) = a <= b' }
        ] },
        { line: 3, message: 'Done: !(x > 5 || x < 2) is exactly the code on line 3. Verify the rewrite rule itself with the generated table: !(A || B) versus !A && !B.', mutations: [
            { type: 'extra.set', value: TG26S }
        ] },
        { line: 3, message: 'Reading the result: x <= 5 && x >= 2 is the interval 2 <= x <= 5. A compound negation, simplified, is often just a range. That is how the exam hides easy answers in hard-looking lines.', mutations: [] }
    ],
    summary: {
        idea: 'A negated compound simplifies in two moves: flip each comparison (> to <=) and flip the connective (|| to &&). The result is usually a plain interval.',
        mistake: 'Flipping the comparisons but keeping || - or flipping the connective but keeping >.',
        transfer: 'Simplify !(x < 2 || x > 8) on paper: 2 <= x && x <= 8. Then re-run the two-column check here to verify.'
    }
}]
};

export default { topics: { '2.2': t22, '2.5': t25, '2.6': t26 } };
