const PARTS = [
    { key: 'access', text: 'public' },
    { key: 'returnType', text: 'int' },
    { key: 'name', text: 'add' },
    { key: 'params', text: '(int a, int b)' },
    { key: 'body', text: '{ ... return ...; }' }
];

function sig(focus, desc) {
    return { kind: 'signature', parts: PARTS, focus, desc };
}

export default {
    id: 'u3-methods',
    meta: { unit: 3, topic: '3.5', title: 'Methods: How to Write Them', visualizerTitle: 'Method Builder & Execution Visualizer' },
    intro: 'A method is a machine: typed inputs go in, one typed value comes out. First build the machine, then run it.',
    code: `int x = add(3, 5);

public int add(int a, int b)
{
    int sum = a + b;
    return sum;
}

// public int badAdd(int a, int b)
// {
//     System.out.println(a + b);
// }`,
    layout: { center: ['extra', 'stack'], right: ['expression', 'memory'] },
    steps: [
        { line: 3, message: 'Writing starts with the header. Access first: public says any class may call this method.', mutations: [
            { type: 'extra.set', value: sig('access', 'public: who is allowed to call.') }
        ] },
        { line: 3, message: 'int is a promise: this call will hand back exactly one int. Say void instead and the machine produces nothing you can use as a value.', mutations: [
            { type: 'extra.set', value: sig('returnType', 'int: the single promised output.') }
        ] },
        { line: 3, message: 'The name is what callers type. It should say the job: add, not doIt.', mutations: [
            { type: 'extra.set', value: sig('name', 'add: the verb the caller reaches.') }
        ] },
        { line: 3, message: 'Parameters are typed input slots, matched by position: in add(3, 5), a receives 3, b receives 5.', mutations: [
            { type: 'extra.set', value: sig('params', '(int a, int b): inputs copied in left to right.') }
        ] },
        { line: 4, message: 'The body turns inputs into the answer. Header built: read it as a contract, inputs in, one output out.', mutations: [
            { type: 'extra.set', value: sig('body', 'The body is the work between contract terms.') }
        ] },
        { line: 1, message: 'Now run the machine. The call add(3, 5) evaluates its arguments left to right, then a new frame opens holding the parameters.', mutations: [
            { type: 'expression.reduce', text: 'add(3, 5)', note: 'caller waits for the result' },
            { type: 'stack.push', label: 'add(3, 5)', vars: [{ name: 'a', value: '3' }, { name: 'b', value: '5' }] }
        ], predict: { q: 'add(3, 5) opens its frame. What arrives inside it?', choices: ['Copies of the arguments, by position: a=3, b=5', 'A live link to the caller\'s variables', 'Nothing: the method reads the arguments directly'], a: 0, why: 'Arguments are evaluated left to right and copied into the new frame\'s parameters. The frame owns its own locals from the start.' } },
        { line: 5, message: 'Inside the frame, a and b are ordinary local variables. sum is born here and will die here.', mutations: [
            { type: 'expression.reduce', text: 'int sum = a + b', note: '3 + 5 = 8' }
        ] },
        { line: 6, message: 'return does two jobs at once: it picks the value to hand back and it ends the method immediately. Nothing after return runs.', mutations: [
            { type: 'expression.reduce', text: 'return 8' }
        ], predict: { q: 'return ends the method at once. What does the caller\'s expression add(3, 5) become?', choices: ['The value it returned: 8', 'The printed text on screen', 'Still add(3, 5), waiting for x'], a: 0, why: 'return hands one value back and the whole call is replaced by that value, which then flows into x. Nothing after return runs.' } },
        { line: 6, message: 'The frame pops. The return value 8 replaces the whole call expression in the caller.', mutations: [
            { type: 'stack.pop' },
            { type: 'expression.reduce', text: '8' }
        ] },
        { line: 1, message: 'x receives 8. The return type int promised an int, and the method delivered one: types must match on both ends of the signature.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '8' }
        ] },
        { line: 9, message: 'The most common compile error when writing methods: badAdd promises int but its body only prints. Printing is not returning.', mutations: [
            { type: 'extra.set', value: {
                kind: 'compare',
                left: { title: 'add(): honors the promise', rows: [{ t: 'int sum = a + b;', hit: false }, { t: 'return sum;', hit: false }] },
                right: { title: 'badAdd(): breaks it', rows: [{ t: 'System.out.println(a + b);', hit: false }, { t: 'no return, int promised', hit: true }, { t: 'compile error: missing return statement', hit: true }] },
                verdict: 'Every path through a non-void method must end at a return.'
            } }
        ] },
        { line: 3, message: 'A void method is the same machine with no output slot: you cannot use a void call as a value. Call it as its own statement.', mutations: [] }
    ],
    summary: {
        idea: 'A method is a machine with a contract: the header declares typed inputs and one output type, each call opens its own frame, locals live and die inside that frame, and return replaces the call with the value.',
        mistake: 'Using a void call as a value, or believing printing can replace returning in a non-void method: printing writes to the console, returning hands a value to the caller.',
        transfer: 'Call add(add(1, 2), 3): the inner frame finishes first and returns 3 into the outer call, so x becomes 6.'
    }
};
