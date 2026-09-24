export default {
    id: 'u1-objects-and-classes',
    meta: { unit: 1, topic: '1.12', title: 'Objects: Instances of Classes', visualizerTitle: 'Class-to-Object Visualizer' },
    intro: 'The class is the blueprint. The objects are the houses built from it, each with its own copy of every field.',
    code: `class Student {
    String name;
    int age;
}
Student a = new Student();
Student b = new Student();
a.name = "Moss";
a.age = 17;`,
    layout: { center: ['extra', 'memory', 'heap'], right: [] },
    steps: [
        { line: 1, message: 'A class lists what every object of that type will hold. Declaring the class creates zero objects; it is only the blueprint.', mutations: [{ type: 'extra.set', value: { kind: 'blueprint', className: 'Student', fields: [{ name: 'name', type: 'String' }, { name: 'age', type: 'int' }] } }] },
        { line: 5, message: 'new Student() builds object #1 out on the heap, with default field values: null for the String, 0 for the int.', mutations: [{ type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'age', type: 'int', value: '0' }] }] },
        { line: 5, message: 'The variable a does not hold the object itself. It holds a reference, an address that points at object #1.', mutations: [{ type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 's1' }] },
        { line: 6, message: 'A second new call builds a second, completely separate object. Two calls, two boxes.', mutations: [{ type: 'heap.create', objId: 's2', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'age', type: 'int', value: '0' }] }] },
        { line: 6, message: 'b holds a reference to object #2. a and b are not the same student.', mutations: [{ type: 'memory.create', name: 'b', dataType: 'Student', value: '', refId: 's2' }] },
        { line: 7, message: 'a.name = "Moss" writes through a into object #1 only. Object #2 is untouched.', mutations: [{ type: 'heap.set', objId: 's1', field: 'name', value: '"Moss"' }] },
        { line: 8, message: 'a.age = 17 updates the same object. Notice b.age is still 0: instances made from one class never share field values.', mutations: [{ type: 'heap.set', objId: 's1', field: 'age', value: '17' }], predict: { q: 'After `a.age = 17`, what is b.age?', choices: ['Still 0, each object keeps its own fields', 'Also 17, since they share a class', 'It does not exist'], a: 0, why: 'Two new Student() calls created two separate objects. Writing through a changes only object #1; b points at object #2, which still holds its default 0.' } }
    ],
    summary: {
        idea: 'A class is a blueprint. Each new builds a separate object on the heap with its own copy of every field, and a variable holds a reference pointing at that object.',
        mistake: 'Thinking field values are shared between objects because they come from the same class. Instance fields belong to each object; only static members are shared.',
        transfer: 'Then run `Student c = a;`. c now points at object #1, so c.age reads 17, because c is an alias of a, not a third student.'
    }
};
