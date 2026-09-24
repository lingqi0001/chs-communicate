export default {
    id: 'u1-assignment',
    meta: { unit: 1, topic: '1.4', title: 'Assignment Statements and Input', visualizerTitle: 'Assignment & Input Visualizer' },
    intro: 'Assignment always runs in one direction: evaluate the right, then write the left.',
    code: `int age = 16;
age = age + 2;
System.out.print("Enter score: ");
int score = kb.nextInt();`,
    layout: { center: ['memory'], right: ['expression', 'extra', 'console'] },
    steps: [
        { line: 1, message: 'Every declaration evaluates the right side first, then stores the result in the variable on the left.', mutations: [{ type: 'memory.create', name: 'age', dataType: 'int', value: '16' }] },
        { line: 2, message: 'On the right side, age is just a read. It contributes its current value, 16.', mutations: [{ type: 'expression.reduce', text: 'age + 2', note: 'reads the OLD value' }], predict: { q: 'In `age = age + 2`, what value does the right side use for age?', choices: ['16, the current value', '18, because it updates first', 'Both at once'], a: 0, why: 'The right side is finished before anything is written. On that side age is only read, contributing its old value 16. The write happens only afterward, to the left.' } },
        { line: 2, message: '16 + 2 = 18. The expression on the right is finished.', mutations: [{ type: 'expression.reduce', text: '18' }] },
        { line: 2, message: 'Now the write happens: 18 replaces 16 inside age. The variable on the left never appears on its own right side by accident.', mutations: [{ type: 'memory.set', name: 'age', value: '18' }] },
        { line: 3, message: 'print (without ln) leaves the cursor on the same line while the program waits for input.', mutations: [{ type: 'console.print', text: 'Enter score: ' }] },
        { line: 4, message: 'kb.nextInt() pauses the program until the user types a whole number and presses Enter.', mutations: [{ type: 'extra.set', value: { kind: 'input', stream: [{ text: '92', target: 'score' }], note: 'The keyboard typed 92. nextInt() reads it as an int.' } }] },
        { line: 4, message: 'The typed input acts as the right side value, so 92 is stored into the new variable score.', mutations: [{ type: 'memory.create', name: 'score', dataType: 'int', value: '92' }], predict: { q: 'Where does the value stored in score come from?', choices: ['Whatever the user typed, here 92', 'It is always 0 by default', 'A copy of age'], a: 0, why: 'kb.nextInt() is the right side. Its value arrives from the keyboard at run time, so score takes on exactly what was typed, 92.' } }
    ],
    summary: {
        idea: 'Assignment runs one way: fully evaluate the right side (reading current values), then store that single result into the variable on the left. Input is just a right-side value that arrives at run time.',
        mistake: '`age = age + 2` is not two-way and does not make age keep growing. Writing `age + 2 = age` would not even compile, because the left side must be a single variable.',
        transfer: 'If line 2 were `age = age * 2`, age would become 32, not 18. The rule is identical; only the operator changes.'
    }
};
