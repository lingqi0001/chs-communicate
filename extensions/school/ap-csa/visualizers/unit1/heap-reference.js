export default {
    id: 'u1-heap-reference',
    meta: { unit: 1, topic: '1.13', title: 'Object Creation and Storage (Instantiation)', visualizerTitle: 'Heap & Reference Visualizer' },
    modes: [
        {
            label: 'Object & Reference',
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
        },
        {
            label: 'Constructor Matching',
            intro: 'Three constructors, one class: the arguments decide which one runs, and they are only ever copied in.',
            code: `Student a = new Student();
Student b = new Student("Bob");
Student c = new Student("Zed", 12);
// Student bad = new Student(12);    // no match: compile error

int age = 15;
Student s = new Student("Sue", age);
age = 99;                            // s keeps 15

// class Student
//   String name; int age;
//   Student()                { name = "Nobody"; age = 0; }
//   Student(String n)        { name = n; age = 0; }
//   Student(String n, int a) { name = n; age = a; }`,
            layout: { center: ['memory', 'heap'], right: ['stack', 'expression'] },
            steps: [
                { line: 1, message: 'new Student() with empty parentheses runs the no-argument constructor: the class chose to fill the blanks itself with Nobody and 0.', mutations: [
                    { type: 'heap.create', objId: 'a1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Nobody"' }, { name: 'age', type: 'int', value: '0' }] },
                    { type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 'a1' }
                ] },
                { line: 2, message: 'One String argument: Java selects the Student(String n) version and runs it. b gets Bob.', mutations: [
                    { type: 'heap.create', objId: 'b1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Bob"' }, { name: 'age', type: 'int', value: '0' }] },
                    { type: 'memory.create', name: 'b', dataType: 'Student', value: '', refId: 'b1' }
                ] },
                { line: 3, message: 'Two arguments now. The class declares three constructors: this is constructor overloading, and the match is made by count, types, and order.', mutations: [], predict: { q: 'Which constructor runs for `new Student("Zed", 12)`?', choices: ['Student(String n, int a): two arguments, matching types', 'Student(): it is written first', 'Student(String n): the name matches first'], a: 0, why: 'Selection never depends on order in the source, only on the argument list: String then int fits exactly one signature.' } },
                { line: 3, message: 'The winner fills both fields from its parameters.', mutations: [
                    { type: 'heap.create', objId: 'c1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Zed"' }, { name: 'age', type: 'int', value: '12' }] },
                    { type: 'memory.create', name: 'c', dataType: 'Student', value: '', refId: 'c1' }
                ] },
                { line: 4, message: 'new Student(12) matches NOTHING: no signature takes a single int. The compiler checks the argument list against every signature and refuses the line before the program ever runs.', mutations: [
                    { type: 'expression.reduce', text: 'new Student(12)', note: 'no matching signature: compile error' }
                ] },
                { line: 7, message: 'Now the copy rule. age holds 15, so the call passes the VALUE 15 into parameter a, and the object stores that copy.', mutations: [
                    { type: 'memory.create', name: 'age', dataType: 'int', value: '15' },
                    { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Sue"' }, { name: 'age', type: 'int', value: '15' }] },
                    { type: 'memory.create', name: 's', dataType: 'Student', value: '', refId: 's1' }
                ] },
                { line: 8, message: 'The constructor never saw the variable age, only its copy. Java is call by value everywhere, constructors included.', mutations: [
                    { type: 'memory.set', name: 'age', value: '99' }
                ], predict: { q: 'After age = 99, what does s.age hold?', choices: ['15: the copy was made at call time', '99: the object tracks the variable', '0'], a: 0, why: 'Arguments are copied when the call happens. The object keeps its copy forever; the caller variable is free to change without touching it.' } }
            ],
            summary: {
                idea: 'Constructors are matched by number, types, and order of the arguments, never by source order. A class may overload several. Arguments arrive as copies: call by value.',
                mistake: 'Believing the first-declared constructor runs by default, assuming the object keeps watching the argument variable, or expecting new Student(12) to "figure it out" instead of failing at compile time.',
                transfer: 'Add a fourth signature Student(int a) that sets name "Unnamed" and age a. Now new Student(12) compiles, and the object holds Unnamed/12.'
            }
        },
        {
            label: 'null Reference',
            intro: 'A reference variable may hold no address at all. null is not an empty object: it is no object.',
            code: `Student x = null;
Student y = new Student("Y");
y = null;
// x.getName();   // NullPointerException
// y.getName();   // also NullPointerException`,
            layout: { center: ['memory', 'heap'], right: ['expression'] },
            steps: [
                { line: 1, message: 'x is declared, and holds null: no arrow at all. There is no object anywhere behind the name x.', mutations: [
                    { type: 'memory.create', name: 'x', dataType: 'Student', value: 'null' }
                ] },
                { line: 2, message: 'For contrast, a normal creation: object #y1 on the heap, one arrow from y.', mutations: [
                    { type: 'heap.create', objId: 'y1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Y"' }] },
                    { type: 'memory.create', name: 'y', dataType: 'Student', value: '', refId: 'y1' }
                ] },
                { line: 3, message: 'y = null erases y\'s arrow. Object #y1 now has zero arrows pointing at it: unreachable, and Java will eventually reclaim its memory.', mutations: [
                    { type: 'memory.set', name: 'y', value: 'null' }
                ] },
                { line: 4, message: 'So what happens when code asks a null variable to do something?', mutations: [], predict: { q: 'x.getName() runs while x is null. What happens?', choices: ['NullPointerException: x points at no object', 'Returns null quietly', 'Java creates a default Student first'], a: 0, why: 'Dereferencing null crashes at run time: there is no object to ask the question of. The CED requires exactly this recognition.' } },
                { line: 5, message: 'y crashes the same way: being a declared variable guarantees nothing, only a live arrow guarantees an object. The guard is if (y != null) y.getName().', mutations: [
                    { type: 'expression.reduce', text: 'y.getName()', note: 'NullPointerException' }
                ] }
            ],
            summary: {
                idea: 'null means the reference holds no address. Methods and fields can only be reached through an object; through null they throw NullPointerException, and an object whose last arrow disappears becomes unreachable.',
                mistake: 'Drawing an arrow from a null variable, treating null as "an empty Student", or assuming declaring Student x; already created an object.',
                transfer: 'After Student p = new Student("P"); Student q = p; q = null; how many arrows reach #p\'s object? One: p still names it, and p.getName() still works.'
            }
        }
    ]
};
