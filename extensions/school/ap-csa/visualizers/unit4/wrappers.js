function wrap(left, op, right, note) {
    return { kind: 'wrap', left, op, right, note };
}

export default {
    id: 'u4-wrappers',
    meta: { unit: 4, topic: '4.7', title: 'Wrapper Classes', visualizerTitle: 'Primitive & Wrapper Visualizer' },
    intro: 'Every primitive has an object twin. Collections only accept the twins.',
    code: `ArrayList<Integer> nums = new ArrayList<Integer>();
nums.add(5);
int x = nums.get(0);`,
    layout: { center: ['extra'], right: ['memory'] },
    steps: [
        { line: 2, message: 'add(5) looks like it stores a raw int. It does not: Java quietly autoboxes 5 into an Integer object, then stores the reference to that object.', mutations: [
            { type: 'extra.set', value: wrap({ text: 'primitive int', value: '5' }, 'autobox', { text: 'Integer object', value: 'value: 5' }, 'ArrayList stores objects, never primitives') }
        ] },
        { line: 1, message: 'That is why the declaration says ArrayList<Integer>. ArrayList<int> does not compile: int is not a class, so it cannot be a generic type.', mutations: [
            { type: 'extra.set', value: wrap({ text: 'int', value: '✗ not allowed here' }, '', { text: 'Integer', value: '✓ the object twin' }, 'Pairs: int/Integer, double/Double, boolean/Boolean, char/Character') }
        ] },
        { line: 3, message: 'get(0) returns the Integer object. Assigning it to an int triggers auto-unboxing: Java opens the wrapper and hands out 5.', mutations: [
            { type: 'extra.set', value: wrap({ text: 'Integer object', value: 'value: 5' }, 'unbox', { text: 'primitive int', value: '5' }) },
            { type: 'memory.create', name: 'x', dataType: 'int', value: '5' }
        ] },
        { line: 3, predict: { q: 'Integer x = null; then int y = x; What happens?', choices: ['y becomes 0', 'NullPointerException when Java tries to unbox the null', 'Compile error: null cannot be assigned to Integer'], a: 1, why: 'Unboxing opens the wrapper to hand out a value. A null wrapper has nothing inside: the crash happens at the unboxing line, not at the assignment.' }, message: 'The trap: an Integer can be null, an int cannot. Unboxing a null Integer throws NullPointerException. Also == on two Integers compares objects, so use equals for value checks.', mutations: [
            { type: 'extra.set', value: wrap({ text: 'Integer x', value: 'null' }, 'unbox', { text: 'int y = x', value: 'NullPointerException' }, 'null is a wrapper privilege') }
        ] },
        { line: 1, message: 'Parsing is the manual cousin of autoboxing: Integer.parseInt("42") reads the text and produces the primitive int 42. parseInt returns int; Integer.valueOf("42") returns an Integer object. Double.parseDouble handles the decimal twins.', mutations: [
            { type: 'extra.set', value: wrap({ text: 'String', value: '"42"' }, 'parseInt', { text: 'primitive int', value: '42' }) },
            { type: 'memory.create', name: 'n', dataType: 'int', value: '42' }
        ] },
        { line: 1, message: 'Memory picture to finish: an int variable is one slot holding 42 directly. An Integer variable is a slot holding an arrow to an object elsewhere. Same visible value, two different footprints, which is exactly why collections demand the object form.', mutations: [] }
    ],
    summary: {
        idea: ['Collections store REFERENCES to objects, so they need the object twin: ArrayList<Integer>, never ArrayList<int>.', 'Autoboxing/unboxing is Java doing wrap/unwrap silently at assignments, adds, and arithmetic.'],
        mistake: 'Using == to compare two Integer values: it compares identity, not number. equals is the value check.',
        transfer: 'ArrayList<Double> needs add(3.5). No wrapper was constructed anywhere in that line, yet the list holds an object. Name the two invisible steps Java performed.'
    }
};
