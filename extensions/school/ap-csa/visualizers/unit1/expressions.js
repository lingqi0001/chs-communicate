export default {
    id: 'u1-expressions',
    meta: { unit: 1, topic: '1.3', title: 'Expressions and Output', visualizerTitle: 'Expression Step Evaluator' },
    intro: 'Watch an expression shrink one precedence rule at a time.',
    code: `int x = 3 + 4 * 2;
System.out.println(x);`,
    layout: { center: ['expression'], right: ['memory', 'console'] },
    steps: [
        { line: 1, message: 'Java evaluates the entire right side of an assignment before it touches the left side.', mutations: [{ type: 'expression.reduce', text: '3 + 4 * 2', note: 'the whole right side' }] },
        { line: 1, message: 'Operator precedence: multiplication happens before addition, so 4 * 2 becomes 8 first.', mutations: [{ type: 'expression.reduce', text: '3 + 8', note: '4 * 2 done first' }], predict: { q: 'In 3 + 4 * 2, which operation happens first?', choices: ['4 * 2, because * binds tighter than +', '3 + 4, because we read left to right', '3 * 2, skipping around'], a: 0, why: 'Multiplication and division are done before addition and subtraction. 4 * 2 collapses to 8 first, and only then is 3 + 8 evaluated.' } },
        { line: 1, message: 'Now only one operation is left: 3 + 8 = 11. The expression is fully evaluated.', mutations: [{ type: 'expression.reduce', text: '11' }] },
        { line: 1, message: 'Only now is the value stored into the freshly declared int variable x.', mutations: [{ type: 'memory.create', name: 'x', dataType: 'int', value: '11' }] },
        { line: 2, message: 'println(x) looks up the current value of x and prints it.', mutations: [{ type: 'console.print', text: '11' }] }
    ],
    summary: {
        idea: 'The whole right-hand side is reduced to a single value before it is ever assigned, and precedence decides the order: * / before + -.',
        mistake: 'Reading strictly left to right gives 3 + 4 = 7 first and a wrong answer of 14. The * ties 4 and 2 together before + ever runs.',
        transfer: 'What about 3 + 4 * 2 % 3? The * and % share a level and go left to right: 4 * 2 = 8, then 8 % 3 = 2, then 3 + 2 = 5.'
    }
};
