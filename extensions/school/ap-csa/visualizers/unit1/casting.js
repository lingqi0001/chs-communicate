export default {
    id: 'u1-casting',
    meta: { unit: 1, topic: '1.5', title: 'Casting and Range of Variables', visualizerTitle: 'Casting & Numeric Range Visualizer' },
    intro: 'Casting chops toward zero, and an int that runs off the end of its range wraps around.',
    code: `double d = 9.99;
int n = (int) d;
int big = 2147483647;
big = big + 1;`,
    layout: { center: ['expression', 'extra'], right: ['memory'] },
    steps: [
        { line: 1, message: 'A double stores the full decimal value, so d holds 9.99 exactly.', mutations: [{ type: 'memory.create', name: 'd', dataType: 'double', value: '9.99' }] },
        { line: 2, message: 'Casting to int truncates toward zero. It never rounds to the nearest number.', mutations: [{ type: 'expression.reduce', text: '(int) 9.99', note: 'truncate, do not round' }] },
        { line: 2, message: 'The .99 is chopped off. n receives 9.', mutations: [{ type: 'expression.reduce', text: '9' }, { type: 'memory.create', name: 'n', dataType: 'int', value: '9' }], predict: { q: 'After `int n = (int) 9.99;`, what does n hold?', choices: ['9', '10', '9.99'], a: 0, why: 'Casting a double to int truncates toward zero. It drops the .99 rather than rounding to the nearest whole number.' } },
        { line: 3, message: 'An int is a 32-bit box with hard limits. This is the whole range it can ever hold.', mutations: [
            { type: 'memory.create', name: 'big', dataType: 'int', value: '2147483647' },
            { type: 'extra.set', value: { kind: 'range', marker: 0.5, min: '-2147483648', max: '2147483647', caption: 'The int range is fixed. Every int must fit between these two ends.' } }
        ] },
        { line: 3, message: '2147483647 is Integer.MAX_VALUE, the largest int that exists. The marker sits at the very top of the range.', mutations: [{ type: 'extra.set', value: { kind: 'range', marker: 1, min: '-2147483648', max: '2147483647', caption: 'big is exactly at the maximum. There is no room left.' } }] },
        { line: 4, message: 'Plain math says big + 1 is 2147483648, one past the largest int.', mutations: [{ type: 'expression.reduce', text: 'big + 1', note: '2147483648 does not fit' }] },
        { line: 4, message: 'Integer overflow: the value wraps around to Integer.MIN_VALUE. Java gives no error and no warning.', mutations: [
            { type: 'memory.set', name: 'big', value: '-2147483648' },
            { type: 'extra.set', value: { kind: 'range', marker: 0, min: '-2147483648', max: '2147483647', overflow: true, caption: 'Overflow! big wrapped from the top of the range to the bottom.' } }
        ], predict: { q: 'What is the int 2147483647 + 1?', choices: ['-2147483648, it wraps to the minimum', '2147483648', 'A run-time error'], a: 0, why: 'An int is a fixed 32-bit box. One step past its maximum it wraps to the minimum, and Java raises no error or warning.' } }
    ],
    summary: {
        idea: 'Casting to a narrower type truncates toward zero, never rounds. An int has a fixed range, and arithmetic that leaves the range wraps around silently.',
        mistake: 'Believing (int) 9.99 becomes 10, or that overflow crashes like in other languages. It truncates, and it wraps, quietly.',
        transfer: '(int) -9.99 is -9, because toward zero chops the fraction upward. `(int) 9.99 + 1` is 9 + 1 = 10, since the cast happens before the addition.'
    }
};
