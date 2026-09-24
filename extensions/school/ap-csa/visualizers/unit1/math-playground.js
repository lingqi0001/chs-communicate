const ROWS = [
    { call: 'Math.abs(-7)', result: '7', note: 'distance from zero, never negative' },
    { call: 'Math.pow(2, 5)', result: '32.0', note: '2 to the 5th power; pow returns a double' },
    { call: 'Math.sqrt(81)', result: '9.0', note: 'the non-negative root; also a double' },
    { call: 'Math.round(3.6)', result: '4', note: 'rounds to nearest; round returns a long' }
];

function table(upTo) {
    return { kind: 'math', rows: ROWS.slice(0, upTo) };
}

export default {
    id: 'u1-math-playground',
    meta: { unit: 1, topic: '1.11', title: 'Math Class', visualizerTitle: 'Math Method Playground' },
    intro: 'Four exam favorites, one call at a time. Watch the return types.',
    code: `System.out.println(Math.abs(-7));
System.out.println(Math.pow(2, 5));
System.out.println(Math.sqrt(81));
System.out.println(Math.round(3.6));`,
    layout: { center: ['extra'], right: ['console'] },
    steps: [
        { line: 1, message: 'abs() answers one question: how far is this number from zero? Distance has no sign, so abs(-7) is 7, an int like its argument.', mutations: [{ type: 'extra.set', value: table(1) }, { type: 'console.print', text: '7' }] },
        { line: 2, message: 'pow(2, 5) is 2 to the 5th power. Careful: pow always returns a double, so the exam answer prints as 32.0.', mutations: [{ type: 'extra.set', value: table(2) }, { type: 'console.print', text: '32.0' }], predict: { q: 'What exactly does `Math.pow(2, 5)` print?', choices: ['32.0', '32', '10'], a: 0, why: 'pow always returns a double, so the value carries a decimal point, 32.0, even though the result is a whole number.' } },
        { line: 3, message: 'sqrt(81) gives the non-negative square root, and it is also a double: 9.0.', mutations: [{ type: 'extra.set', value: table(3) }, { type: 'console.print', text: '9.0' }] },
        { line: 4, message: 'round(3.6) rounds to the nearest whole number and returns a long, so it prints as 4 with no decimal point.', mutations: [{ type: 'extra.set', value: table(4) }, { type: 'console.print', text: '4' }] }
    ],
    summary: {
        idea: 'Math methods have fixed return types. pow and sqrt return a double, round returns a long, and abs keeps the type of its argument. Watch for the .0 on the exam.',
        mistake: 'Assuming Math.pow(2, 5) is the int 32, or expecting 7 / 2 to be 3.5. Two ints divide with truncation, giving 3.',
        transfer: 'Math.sqrt(81) is 9.0, but (int) Math.sqrt(81) is 9. Math.round(2.5) rounds half up and returns the long 3.'
    }
};
