export default {
    id: 'u1-heap-reference',
    meta: { unit: 1, topic: '1.13', title: 'Object Creation and Storage (Instantiation)', visualizerTitle: 'Heap & Reference Visualizer' },
    intro: 'Assigning an object copies the address, never the object. This one idea powers half of the exam.',
    code: `Student s1 = new Student();
Student s2 = s1;
s2.name = "Alex";
System.out.println(s1.name);`,
    layout: { center: ['memory', 'heap'], right: ['expression', 'console'] },
    steps: [
        { line: 1, message: 'new Student() creates an object on the heap. Its name field starts as null.', mutations: [{ type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }] }] },
        { line: 1, message: 's1 holds a reference pointing at object #1. The variable lives on the stack; the object lives on the heap.', mutations: [{ type: 'memory.create', name: 's1', dataType: 'Student', value: '', refId: 's1' }] },
        { line: 2, message: 'Student s2 = s1 copies the reference, not the object. Both arrows now aim at the same single box on the heap.', mutations: [{ type: 'memory.create', name: 's2', dataType: 'Student', value: '', refId: 's1' }], predict: { q: 'After `Student s2 = s1;`, how many Student objects exist on the heap?', choices: ['One, s2 copies the reference', 'Two, a fresh independent copy', 'Zero'], a: 0, why: 'Assigning one object variable to another copies only the address. s2 now points at the same single object; no second object is created.' } },
        { line: 3, message: 'Writing through s2 changes the shared object. There is no second copy to keep in sync.', mutations: [{ type: 'heap.set', objId: 's1', field: 'name', value: '"Alex"' }] },
        { line: 4, message: 'Reading through s1 reaches that same object, so it sees the value s2 wrote.', mutations: [{ type: 'expression.reduce', text: 's1.name', note: 'follow the arrow' }], predict: { q: 'Line 3 wrote through s2. What does `s1.name` read back?', choices: ['"Alex", the same object', 'null, s1 was never assigned', 'It does not compile'], a: 0, why: 'There is only one object. A change made through s2 shows up when you read through s1, because both references name that one object.' } },
        { line: 4, message: 'Alex. Aliasing: two names, one object.', mutations: [{ type: 'expression.reduce', text: '"Alex"' }, { type: 'console.print', text: 'Alex' }] }
    ],
    summary: {
        idea: 'An object variable holds a reference, an address, not the object itself. Assigning object to object copies the reference, so two variables can share one object. That shared view is aliasing.',
        mistake: 'Believing `Student s2 = s1` builds a second, separate Student, or that the whole object is stored inside s1. It copies the address only.',
        transfer: 'If line 3 instead read `s2 = new Student()`, then a later write through s2 would leave s1.name null, because the two references would point at different objects.'
    }
};
