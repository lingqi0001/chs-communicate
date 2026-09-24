export default {
    id: 'u1-variables',
    meta: { unit: 1, topic: '1.2', title: 'Variables and Data Types', visualizerTitle: 'Variable Memory Visualizer' },
    intro: 'Each variable is a labeled box that holds exactly one value at a time.',
    code: `int x = 7;
double price = 2.5;
boolean done = false;
char grade = 'A';
x = 9;`,
    layout: { center: ['memory'], right: [] },
    steps: [
        { line: 1, message: 'int x = 7; declares an integer variable named x and stores 7 inside it.', mutations: [{ type: 'memory.create', name: 'x', dataType: 'int', value: '7' }] },
        { line: 2, message: 'A double holds decimal numbers, so price gets its own box with 2.5.', mutations: [{ type: 'memory.create', name: 'price', dataType: 'double', value: '2.5' }] },
        { line: 3, message: 'A boolean can only ever hold true or false, never a number.', mutations: [{ type: 'memory.create', name: 'done', dataType: 'boolean', value: 'false' }] },
        { line: 4, message: 'A char holds exactly one character, written in single quotes.', mutations: [{ type: 'memory.create', name: 'grade', dataType: 'char', value: "'A'" }] },
        { line: 5, message: 'Assignment replaces the old value. x now holds 9, and 7 is gone. This is why they are called variables.', mutations: [{ type: 'memory.set', name: 'x', value: '9' }], predict: { q: 'After `x = 9;`, what is inside the box x?', choices: ['9, and the old 7 is gone', 'Both 7 and 9, side by side', '16'], a: 0, why: 'A variable holds one value at a time. Assignment replaces the contents, so 9 overwrites 7.' } }
    ],
    summary: {
        idea: 'A variable is a labeled box with a type that holds exactly one value at a time. Assignment (=) stores a new value and discards the old one.',
        mistake: '`x = 9` is not a permanent math equality. It means "store 9 into the box named x right now", and any previous value is erased.',
        transfer: 'What would `x = x + 1` do next? It reads 9, adds 1, and stores 10, because the right side is always fully computed before the left box is written.'
    }
};
