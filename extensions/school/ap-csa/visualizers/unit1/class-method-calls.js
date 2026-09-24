export default {
    id: 'u1-class-method-calls',
    meta: { unit: 1, topic: '1.10', title: 'Calling Class Methods', visualizerTitle: 'Method Call & Stack Visualizer' },
    intro: 'A call pushes a frame, the frame computes, the return value pops back out.',
    code: `int len = "hello".length();
int max = Math.max(4, 9);
System.out.println(max + len);`,
    layout: { center: ['stack'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'Calling a method pushes a new frame onto the call stack. The program pauses inside that frame until it returns.', mutations: [{ type: 'stack.push', label: '"hello".length()' }] },
        { line: 1, message: 'length() counts the characters: h, e, l, l, o.', mutations: [{ type: 'expression.reduce', text: '"hello".length()', note: 'inside the frame' }] },
        { line: 1, message: 'The frame computes 5.', mutations: [{ type: 'expression.reduce', text: '5' }] },
        { line: 1, message: 'return pops the frame and the value 5 travels back to the caller, replacing the whole call.', mutations: [{ type: 'stack.pop' }] },
        { line: 1, message: 'The returned 5 is stored into the new variable len.', mutations: [{ type: 'memory.create', name: 'len', dataType: 'int', value: '5' }] },
        { line: 2, message: 'Math.max(4, 9): first, the arguments are evaluated left to right, then copied into the parameters a and b of a new frame.', mutations: [{ type: 'stack.push', label: 'Math.max(4, 9)', vars: [{ name: 'a', value: '4' }, { name: 'b', value: '9' }] }], predict: { q: 'When `Math.max(4, 9)` runs, how do the 4 and 9 get into the method?', choices: ['Copied into parameters a and b in a fresh frame', 'Shared directly with the caller', 'Nothing is passed in'], a: 0, why: 'Java evaluates the arguments left to right, then copies each into the new frame\'s parameters. Inside the frame a is 4 and b is 9, local variables that belong only to that call.' } },
        { line: 2, message: 'max compares the two parameters and keeps the larger.', mutations: [{ type: 'expression.reduce', text: 'Math.max(4, 9)', note: 'inside the frame' }] },
        { line: 2, message: '9 wins. The frame pops, and 9 is stored into max.', mutations: [{ type: 'expression.reduce', text: '9' }, { type: 'stack.pop' }, { type: 'memory.create', name: 'max', dataType: 'int', value: '9' }] },
        { line: 3, message: 'Back in the caller, each variable is replaced by its current value.', mutations: [{ type: 'expression.reduce', text: 'max + len', note: '9 + 5' }] },
        { line: 3, message: 'The sum is 14.', mutations: [{ type: 'expression.reduce', text: '14' }] },
        { line: 3, message: 'println prints the computed value.', mutations: [{ type: 'console.print', text: '14' }] }
    ],
    summary: {
        idea: 'Each call gets its own stack frame. Arguments are copied into that frame\'s parameters, the return value pops back out and replaces the call, and the frame\'s local variables vanish when it pops.',
        mistake: 'Believing a method shares or permanently keeps the caller\'s variables. Every call starts with a fresh frame and only receives copies of the arguments.',
        transfer: 'If line 2 were Math.max(4, -9), the returned max would be 4, and the final println(max + len) would print 4 + 5, which is 9.'
    }
};
