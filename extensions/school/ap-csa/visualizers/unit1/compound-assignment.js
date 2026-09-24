export default {
    id: 'u1-compound-assignment',
    meta: { unit: 1, topic: '1.6', title: 'Compound Assignment Operators', visualizerTitle: 'Assignment Trace Visualizer' },
    intro: 'Every compound operator is just shorthand. Expand it and the mystery disappears.',
    code: `int x = 5;
x += 3;
x *= 2;
x--;`,
    layout: { center: ['expression'], right: ['memory'] },
    steps: [
        { line: 1, message: 'x starts as an int holding 5.', mutations: [{ type: 'memory.create', name: 'x', dataType: 'int', value: '5' }] },
        { line: 2, message: 'x += 3 expands to x = x + 3. Java always reads the current value of x first.', mutations: [{ type: 'expression.reduce', text: 'x = x + 3', note: 'expanded form of +=' }] },
        { line: 2, message: 'With x holding 5, the right side is 5 + 3.', mutations: [{ type: 'expression.reduce', text: 'x = 5 + 3' }] },
        { line: 2, message: 'The sum 8 is written back into x.', mutations: [{ type: 'expression.reduce', text: 'x = 8' }, { type: 'memory.set', name: 'x', value: '8' }], predict: { q: 'With x holding 5, what does `x += 3` leave in x?', choices: ['8', '3', '13'], a: 0, why: 'x += 3 is exactly x = x + 3. It reads the current 5, adds 3, and writes 8 back. It does not replace x with 3.' } },
        { line: 3, message: '*= works the same way: x = x * 2 using the current value.', mutations: [{ type: 'expression.reduce', text: 'x = x * 2', note: 'expanded form of *=' }] },
        { line: 3, message: '8 * 2 = 16, and x is replaced again.', mutations: [{ type: 'expression.reduce', text: 'x = 16' }, { type: 'memory.set', name: 'x', value: '16' }] },
        { line: 4, message: 'x-- is shorthand for x = x - 1. It subtracts exactly one.', mutations: [{ type: 'expression.reduce', text: 'x = x - 1', note: 'expanded form of --' }] },
        { line: 4, message: 'x ends at 15.', mutations: [{ type: 'expression.reduce', text: 'x = 15' }, { type: 'memory.set', name: 'x', value: '15' }] }
    ],
    summary: {
        idea: 'Every compound operator and ++/-- is shorthand for x = x (op) value. Java reads the current value, computes, then writes the result back.',
        mistake: 'Thinking x += 3 sets x to 3. It adds 3 to whatever x already held. Likewise x-- subtracts exactly one, it is not a general decrement by any amount.',
        transfer: 'If line 3 were `x -= 2` instead of `x *= 2`, then x would become 6 after line 3, and the final x-- would leave 5.'
    }
};
