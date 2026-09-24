const SIG = {
    kind: 'signature',
    parts: [
        { key: 'modifiers', text: 'public static' },
        { key: 'returnType', text: 'double' },
        { key: 'name', text: 'average' },
        { key: 'params', text: '(int a, int b)' },
        { key: 'body', text: '{ return ...; }' }
    ]
};

function focus(key, desc) {
    return { ...SIG, focus: key, desc };
}

export default {
    id: 'u1-method-signatures',
    meta: { unit: 1, topic: '1.9', title: 'Method Signatures', visualizerTitle: 'Method Signature Explorer' },
    intro: 'A signature is a contract: who can call, what goes in, what comes back.',
    code: `public static double average(int a, int b)
{
    return (a + b) / 2.0;
}`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 1, message: 'Every method header starts with modifiers. public means any class can call it; static means it is called on the class itself, not on an object.', mutations: [{ type: 'extra.set', value: focus('modifiers', 'public: who may call it. static: called on the class, no object needed.') }] },
        { line: 1, message: 'The return type promises exactly one value back to the caller. A method that returns nothing says void instead.', mutations: [{ type: 'extra.set', value: focus('returnType', 'double: the single value handed back. At most one return value, ever.') }] },
        { line: 1, message: 'The name says what the method does. Call sites reach the method through this word.', mutations: [{ type: 'extra.set', value: focus('name', 'average: the method name, used when calling.') }] },
        { line: 1, message: 'The parameter list declares local variables that the caller fills in. Here two ints arrive as a and b, in order.', mutations: [{ type: 'extra.set', value: focus('params', '(int a, int b): arguments are copied into these, left to right.') }] },
        { line: 3, message: 'The body runs at call time, and return hands one value back to wherever the call happened.', mutations: [{ type: 'extra.set', value: focus('body', 'The body executes; return exits with one value.') }, { type: 'expression.reduce', text: '(a + b) / 2.0', note: 'suppose the caller passed a=1, b=2' }] },
        { line: 3, message: 'Arguments fill the parameters: 1 + 2 = 3.', mutations: [{ type: 'expression.reduce', text: '3 / 2.0' }] },
        { line: 3, message: 'An int divided by a double is promoted to double arithmetic, so the answer is not the truncated 1.', mutations: [{ type: 'expression.reduce', text: '1.5', note: 'average(1, 2) returns 1.5' }], predict: { q: 'What does average(1, 2) return?', choices: ['1.5', '1', '3'], a: 0, why: 'The divisor 2.0 is a double, so (a + b) / 2.0 uses double division: 3 / 2.0 = 1.5, with no truncation.' } }
    ],
    summary: {
        idea: 'A signature is a contract: modifiers (public / static), a return type (exactly one value, or void), the name, and parameters (local variables the caller fills with arguments). The body runs and return hands back one value.',
        mistake: 'Mixing up parameters and arguments. The parameters are int a, int b in the header; the arguments are the actual values, 1 and 2, you pass at the call site.',
        transfer: 'If the body were return (a + b) / 2; with an int 2, average(1, 2) would return 1, because 3 / 2 is integer division. The .0 is exactly what makes it 1.5.'
    }
};
