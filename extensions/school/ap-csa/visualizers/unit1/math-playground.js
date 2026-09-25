const ROWS = [
    { call: 'Math.abs(-7)', result: '7', note: 'distance from zero, never negative' },
    { call: 'Math.pow(2, 5)', result: '32.0', note: '2 to the 5th power; pow returns a double' },
    { call: 'Math.sqrt(81)', result: '9.0', note: 'the non-negative root; also a double' },
    { call: 'Math.round(3.6)', result: '4', note: 'Extra: not on the current CED list; rounds to nearest, returns a long' },
    { call: 'Math.random()', result: '0.0 ? < 1.0', note: 'required: any double from 0.0 up to, but not including, 1.0' }
];

function table(upTo) {
    return { kind: 'math', rows: ROWS.slice(0, upTo) };
}

export default {
    id: 'u1-math-playground',
    meta: { unit: 1, topic: '1.11', title: 'Math Class', visualizerTitle: 'Math Method Playground' },
    intro: 'The required four: abs, pow, sqrt, random. round rides along marked Extra. Watch the return types.',
    code: `System.out.println(Math.abs(-7));
System.out.println(Math.pow(2, 5));
System.out.println(Math.sqrt(81));
System.out.println(Math.round(3.6));   // Extra
double r = Math.random();              // 0.0 <= r < 1.0
int die = (int)(Math.random() * 6) + 1; // always 1..6`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'abs() answers one question: how far is this number from zero? Distance has no sign, so abs(-7) is 7, an int like its argument.', mutations: [{ type: 'extra.set', value: table(1) }, { type: 'console.print', text: '7' }] },
        { line: 2, message: 'pow(2, 5) is 2 to the 5th power. Careful: pow always returns a double, so the exam answer prints as 32.0.', mutations: [{ type: 'extra.set', value: table(2) }, { type: 'console.print', text: '32.0' }], predict: { q: 'What exactly does `Math.pow(2, 5)` print?', choices: ['32.0', '32', '10'], a: 0, why: 'pow always returns a double, so the value carries a decimal point, 32.0, even though the result is a whole number.' } },
        { line: 3, message: 'sqrt(81) gives the non-negative square root, and it is also a double: 9.0.', mutations: [{ type: 'extra.set', value: table(3) }, { type: 'console.print', text: '9.0' }] },
        { line: 4, message: 'round(3.6) rounds to the nearest whole number and returns a long. But note: round is NOT on the current CED Math list. It is Extra here; the exam sticks to abs, pow, sqrt, random.', mutations: [{ type: 'extra.set', value: table(4) }, { type: 'console.print', text: '4' }] },
        { line: 5, message: 'random() is the required one: it returns a double somewhere in [0.0, 1.0), including 0.0 and excluding 1.0. Nobody, not even the visualizer, can promise the exact value: that is the point.', mutations: [
            { type: 'extra.set', value: table(5) },
            { type: 'expression.reduce', text: 'Math.random()', note: '0.0 <= r < 1.0, exact value unknowable' },
            { type: 'memory.create', name: 'r', dataType: 'double', value: '[0.0, 1.0)' }
        ] },
        { line: 6, message: 'The exam pattern for a random whole-number range: multiply to scale, cast to truncate, add to shift. r * 6 lands in [0, 6), (int) chops it to 0..5, +1 moves it to 1..6. A fair die.', mutations: [
            { type: 'expression.reduce', text: '(int)(Math.random() * 6) + 1', note: 'scale, truncate, shift' },
            { type: 'memory.create', name: 'die', dataType: 'int', value: '1..6' }
        ], predict: { q: 'What whole numbers can die ever hold?', choices: ['1 through 6', '0 through 6', '0 through 5'], a: 0, why: 'random gives [0,1), times 6 gives [0,6), the cast truncates to 0..5, and +1 shifts the answer to 1..6. Forgetting the +1, or casting after adding, are the classic off-by-one traps.' } }
    ],
    summary: {
        idea: 'The CED Math set is abs, pow, sqrt, random. pow and sqrt return a double, abs keeps its argument type, and random gives a double in [0.0, 1.0). For a range: multiply, cast, add.',
        mistake: 'Assuming Math.pow(2, 5) is the int 32, expecting 7 / 2 to be 3.5 (two ints truncate to 3), or thinking random can return exactly 1.0. It never does.',
        transfer: 'To pick a card number 0..51 the one-line recipe is (int)(Math.random() * 52). Shift it to 1..52 by adding 1. round is Extra: the current exam does not require it.'
    }
};
