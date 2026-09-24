function arr(values, opts) {
    return { kind: 'array', name: 'nums', values, ...opts };
}

function side(values, name, note) {
    return { kind: 'array', name, values, note };
}

function heapArr(values) {
    return {
        type: 'heap.create', objId: 'a1', className: 'int[] #1',
        fields: values.map((v, i) => ({ name: '[' + i + ']', type: 'int', value: String(v) }))
    };
}

export default {
    id: 'u4-array-basics',
    meta: { unit: 4, topic: '4.3', title: 'Array Creation and Access', visualizerTitle: 'Array Memory Visualizer' },
    intro: 'An array is one object on the heap. The variable only holds the address.',
    code: `int[] nums = new int[4];
nums[2] = 7;
int x = nums[2];
int bad = nums[4];`,
    layout: { center: ['extra'], right: ['memory', 'heap'] },
    steps: [
        { line: 1, message: 'new int[4] creates an array OBJECT on the heap: four cells, every int cell pre-filled with its default 0. The variable nums stores only a reference, drawn as the arrow to int[] #1.', mutations: [
            { type: 'memory.create', name: 'nums', dataType: 'int[]', value: 'ref → int[] #1', refId: 'a1' },
            { type: 'heap.create', objId: 'a1', className: 'int[] #1', fields: [0, 1, 2, 3].map(i => ({ name: '[' + i + ']', type: 'int', value: '0' })) },
            { type: 'extra.set', value: arr([0, 0, 0, 0], { note: 'default values: int 0 · boolean false · object slots null' }) }
        ] },
        { line: 2, message: 'nums[2] = 7 writes into exactly one cell. Indexes count from 0, so the four valid indexes are 0, 1, 2, 3. The heap object is the same object, one field changed.', mutations: [
            heapArr([0, 0, 7, 0]),
            { type: 'extra.set', value: arr([0, 0, 7, 0], { sel: 2 }) }
        ] },
        { line: 3, message: 'Reading nums[2] follows the arrow, picks cell 2, produces 7, and the new variable x stores the plain value. x never changes even if nums[2] does.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '7' }
        ] },
        { line: 4, predict: { q: 'nums has length 4. Reading nums[4] gives what?', choices: ['0: out-of-range reads return defaults', 'null', 'ArrayIndexOutOfBoundsException at run time'], a: 2, why: 'Valid indexes are 0 to length - 1. There is no silent default past the end: the program crashes on that line.' }, message: 'nums[4] is out of bounds. length is 4, but the last valid index is length - 1 = 3. Java throws ArrayIndexOutOfBoundsException at runtime.', mutations: [
            { type: 'extra.set', value: arr([0, 0, 7, 0], { oob: 4, note: 'index 4 does not exist: valid range is 0 to length - 1' }) }
        ] },
        { line: 1, message: 'Set nums aside and look at syntax alternatives. Shorter spelling: int[] a = {1, 2, 3, 4}. Same kind of object, only the cells are filled from the literal instead of left at defaults.', mutations: [
            { type: 'extra.set', value: side([1, 2, 3, 4], 'a', 'new int[4] starts 0,0,0,0 · the {..} literal starts with your values') }
        ] },
        { line: 1, message: 'Another alternative, different element type: String[] names = new String[3] gives three null slots. Object arrays hold references, not the objects themselves. Reading a null slot is legal; calling a method on it is not.', mutations: [
            { type: 'extra.set', value: side([null, null, null], 'names', 'object slots default to null, not to an empty string') }
        ] },
        { line: 2, predict: { q: 'other = nums copies only the reference so far. Now other[0] = 5 is written. What does nums[0] read?', choices: ['0: the two variables have their own cells', '5: both arrows point at the SAME array object', 'Compile error'], a: 1, why: 'Assigning an array variable copies the arrow, never the cells. Two names, one object, one set of values.' }, message: 'Two variables can reference the same object. int[] other = nums copies the arrow, not the cells. Write other[0] = 5 and nums[0] reads 5, because it is one array.', mutations: [
            { type: 'memory.create', name: 'other', dataType: 'int[]', value: 'ref → int[] #1', refId: 'a1' },
            heapArr([5, 0, 7, 0]),
            { type: 'extra.set', value: arr([5, 0, 7, 0], { sel: 0, note: 'nums and other: two arrows, one array' }) }
        ] },
        { line: 1, message: 'One more rule to keep: an array size is fixed at creation. It never grows, and other = nums never links the variables themselves. When a collection must change size, Java uses the ArrayList from topic 4.8.', mutations: [] }
    ],
    summary: {
        idea: ['An array VARIABLE holds a reference; the array itself is an OBJECT on the heap with a fixed length.', 'Defaults by type: int cells 0, boolean cells false, object cells null.'],
        mistake: 'Treating length as the last valid index. nums[nums.length] always crashes; the edge is nums.length - 1.',
        transfer: 'String[] s = new String[2]; after System.out.println(s[0] + s[1]), what prints? (Think: what is the default in an object slot, and what does + do to it.)'
    }
};
