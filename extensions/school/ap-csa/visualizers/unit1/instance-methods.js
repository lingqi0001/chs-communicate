export default {
    id: 'u1-instance-methods',
    meta: { unit: 1, topic: '1.14', title: 'Calling Instance Methods', visualizerTitle: 'Object Method Call Visualizer' },
    intro: 'An instance method call carries a hidden argument: this, the object the call was made on.',
    code: `Student s = new Student();
s.age = 15;
s.setAge(17);
System.out.println(s.age);`,
    layout: { center: ['extra', 'memory', 'heap'], right: ['stack', 'expression', 'console'] },
    steps: [
        { line: 1, message: 'The blueprint now includes a method. Every Student gets setAge, but the method always acts on whichever object called it.', mutations: [{ type: 'extra.set', value: { kind: 'blueprint', className: 'Student', fields: [{ name: 'age', type: 'int' }, { name: 'setAge(int newAge)', type: 'void' }] } }] },
        { line: 1, message: 'new Student() builds object #1 with age 0, and s stores a reference pointing at it.', mutations: [
            { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'age', type: 'int', value: '0' }] },
            { type: 'memory.create', name: 's', dataType: 'Student', value: '', refId: 's1' }
        ] },
        { line: 2, message: 's.age = 15 writes the field directly through the reference.', mutations: [{ type: 'heap.set', objId: 's1', field: 'age', value: '15' }] },
        { line: 3, message: 's.setAge(17) pushes a frame holding the parameter newAge = 17 and the hidden this, which points back at object #1.', mutations: [{ type: 'stack.push', label: 's.setAge(17)', vars: [{ name: 'newAge', value: '17' }, { name: 'this', value: '→ #1' }] }] },
        { line: 3, message: 'Inside the method, age = newAge updates the age field of THIS object, the one this points at.', mutations: [{ type: 'heap.set', objId: 's1', field: 'age', value: '17' }], predict: { q: 'The call is `s.setAge(17)`. Which object\'s age changes?', choices: ['The object s points to (#1), because this is #1', 'The first Student ever created', 'Every Student object'], a: 0, why: 'An instance method carries a hidden reference, this, bound to the object before the dot. Only that object\'s field is updated.' } },
        { line: 3, message: 'setAge is void: it returns no value. The frame simply pops off.', mutations: [{ type: 'stack.pop' }] },
        { line: 4, message: 'The print reads s.age from object #1, which is now 17.', mutations: [{ type: 'expression.reduce', text: 's.age', note: 'reads 17 from #1' }] },
        { line: 4, message: 'The field change made inside the method is still there. Objects keep their state between calls.', mutations: [{ type: 'console.print', text: '17' }] }
    ],
    summary: {
        idea: 'An instance method runs on the specific object it was called on, called this. It can read and change that object\'s fields, and the new state stays after the call returns.',
        mistake: 'Confusing instance methods with static/class methods. Math.max(...) is called on the class with no object, but s.setAge(...) must be called on an object, because it needs a this to act on.',
        transfer: 'Add `Student t = new Student();` then `t.setAge(20);`. s.age is still 17, because t.setAge used a different this and changed t\'s object, not s\'s.'
    }
};
