export default {
    id: 'u3-this',
    meta: { unit: 3, topic: '3.9', title: 'this Keyword', visualizerTitle: 'this Reference Visualizer' },
    intro: 'this is the object the call was made on. One method body, many possible this.',
    code: `Student a = new Student("A");
Student b = new Student("B");
a.printName();
b.printName();

// Student(String name)
// {
//     this.name = name;
// }
//
// public void printName()
// {
//     System.out.println(name);
// }

// System.out.println(a == b);   false
// Student c = a;
// System.out.println(c == a);   true`,
    layout: { center: ['memory', 'heap'], right: ['stack', 'expression', 'console'] },
    steps: [
        { line: 1, message: 'The constructor ran with this aimed at object #s1: this.name = name wrote the field of #s1, while plain name was the parameter. Same word, two homes.', mutations: [
            { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"A"' }] },
            { type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 's1' }
        ] },
        { line: 2, message: 'The second new ran the same constructor with this aimed at object #s2. The code is one copy; the object it acts on changes per call.', mutations: [
            { type: 'heap.create', objId: 's2', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"B"' }] },
            { type: 'memory.create', name: 'b', dataType: 'Student', value: '', refId: 's2' }
        ] },
        { line: 3, message: 'a.printName(): the frame opens with the hidden variable this, holding a reference to object #s1, exactly like a passed parameter.', mutations: [
            { type: 'stack.push', label: 'a.printName()', vars: [{ name: 'this', value: '→ #s1' }] }
        ] },
        { line: 3, message: 'Inside the method, plain name is short for this.name: object #s1\'s field, value A.', mutations: [
            { type: 'console.print', text: 'A' }
        ] },
        { line: 4, message: 'b.printName(): new frame, new this, aimed at object #s2. The very same line now prints B.', mutations: [
            { type: 'stack.pop' },
            { type: 'stack.push', label: 'b.printName()', vars: [{ name: 'this', value: '→ #s2' }] },
            { type: 'console.print', text: 'B' }
        ], predict: { q: 'b.printName() opens a fresh frame. Where does its this point?', choices: ['#s2: whoever receives the call becomes this', '#s1: the first object stays forever', 'The class Student itself'], a: 0, why: 'this is the hidden parameter bound to the receiver. a.printName() made #s1 the this; b.printName() makes #s2 the this. One body, many possible receivers.' } },
        { line: 4, message: 'this is not the class and not a copy of the object: it is just the address of whoever received the call. When a parameter shadows a field, this.field is the only way to say the field.', mutations: [
            { type: 'stack.pop' }
        ] },
        { line: 17, message: 'The identity check, using what you already know: == on objects compares addresses, not contents. a == b is false because the two news stamped out two separate boxes.', mutations: [
            { type: 'expression.reduce', text: 'a == b', note: 'address of #s1 vs address of #s2, false' }
        ] },
        { line: 18, message: 'c = a copies the address, so c == a is true. And during a.printName(), this == a held too: this is never a clone of the object, just the receiver\'s address written down. One address, any number of names, one object.', mutations: [
            { type: 'memory.create', name: 'c', dataType: 'Student', value: '', refId: 's1' },
            { type: 'expression.reduce', text: 'c == a, and this == a', note: 'same address, true' }
        ], predict: { q: 'After Student c = a;, is c == a? And is a == b?', choices: ['c == a is true, a == b is false', 'Both are true', 'Both are false'], a: 0, why: '== on objects compares addresses. c holds exactly a\'s address, same object; a and b came from two separate news and name two separate boxes.' } }
    ],
    summary: {
        idea: 'this is the address of the object before the dot, passed as a hidden argument. The same method body runs with a different this per call, and when names collide this.field is the only unambiguous way to say the field.',
        mistake: 'Thinking this means the class or the method code itself. Also writing name = name in a constructor, which only copies the parameter onto itself and leaves the field untouched.',
        transfer: 'Add a setName method and run a.setName("Z"): b.name still reads "B", because a and b name two objects and this inside the frame only knows about the one that received the call.'
    }
};
