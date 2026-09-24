function cls(count, note) {
    return { kind: 'classmem', className: 'Student', statics: [{ name: 'static int count', value: count }], note };
}

export default {
    id: 'u3-static-instance',
    meta: { unit: 3, topic: '3.7', title: 'Class Variables and Methods', visualizerTitle: 'Static vs Instance Visualizer' },
    intro: 'static lives once per class. Everything else lives once per object.',
    code: `public class Student
{
    private static int count = 0;
    private String name;

    public Student(String n)
    {
        name = n;
        count++;
    }
}

Student a = new Student("A");
Student b = new Student("B");`,
    layout: { center: ['extra', 'memory', 'heap'], right: [] },
    steps: [
        { line: 3, message: 'count is marked static: it is stored once, attached to the class itself, not inside any object. name has no static: every object carries its own.', mutations: [
            { type: 'extra.set', value: cls(0, 'One shared counter, waiting for its first object.') }
        ] },
        { line: 13, message: 'new Student("A"): object #1 gets name A, and the constructor runs count++ on the class variable. 0 becomes 1.', mutations: [
            { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"A"' }] },
            { type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 's1' },
            { type: 'extra.set', value: cls(1) }
        ], predict: { q: 'After the first new, where does count live and what does it hold?', choices: ['In one class-level box, holding 1', 'Inside object #1, holding 1', 'In both places, kept in sync'], a: 0, why: 'static marks ownership: count hangs on the class and every object just ticks it. Drawing it inside the object is the wrong model.' } },
        { line: 14, message: 'new Student("B"): object #2 has its own name B, but the counter is the same single variable. 1 becomes 2.', mutations: [
            { type: 'heap.create', objId: 's2', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"B"' }] },
            { type: 'memory.create', name: 'b', dataType: 'Student', value: '', refId: 's2' },
            { type: 'extra.set', value: cls(2, 'Both objects share one count. Neither object owns it.') }
        ], predict: { q: 'A second Student is now created. How many copies of count exist?', choices: ['Still one, now holding 2', 'Two, one per student', 'Zero until someone reads it'], a: 0, why: 'Objects never duplicate static variables. Every constructor run ticks the same single box.' } },
        { line: 9, message: 'a.count and b.count (if allowed) are the same variable: 2. But a.name is A while b.name is B. Predicting counter problems is that simple: static = one box total.', mutations: [] },
        { line: 3, message: 'Calling rules match the storage rules: instance methods need an object (obj.method()), static methods are called on the class (ClassName.method()). A static method has no this, so it cannot touch name.', mutations: [] }
    ],
    summary: {
        idea: 'static = one copy held by the class; instance = a separate copy inside every object. The constructor counter is the classic static pattern, and a static method called via ClassName. has no this, so it cannot touch instance fields.',
        mistake: 'Drawing count inside each object, showing count=1 twice instead of one shared box holding 2. Also believing a static method silently runs on some instance.',
        transfer: 'Create two more Students, then read the counter: 4. Two more objects, still one counter. Reading a.count through an object reference is legal but reaches the same class box.'
    }
};
