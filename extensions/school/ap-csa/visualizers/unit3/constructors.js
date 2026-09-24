export default {
    id: 'u3-constructors',
    meta: { unit: 3, topic: '3.4', title: 'Constructors', visualizerTitle: 'Constructor & Object State Visualizer' },
    intro: 'What actually happens when Java runs new: allocate, bind parameters, fill the fields, hand back the reference.',
    code: `Student s = new Student("Moss", 11);
Student t = new Student("Alex");

// class Student
//   String name;
//   int grade;
//
//   Student(String n, int g)
//   {
//       name = n;
//       grade = g;
//   }
//
//   Student(String n)
//   {
//       name = n;
//       grade = 12;
//   }`,
    layout: { center: ['memory', 'heap'], right: ['stack', 'expression'] },
    steps: [
        { line: 1, message: 'new Student("Moss", 11) starts with allocation: Java builds a brand-new Student object on the heap, every field at its default value.', mutations: [
            { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'grade', type: 'int', value: '0' }] }
        ] },
        { line: 1, message: 'The variable s is declared on the stack, but it does not point anywhere yet: the constructor still has work to do.', mutations: [
            { type: 'memory.create', name: 's', dataType: 'Student', value: '?' }
        ] },
        { line: 8, message: 'Java picks the constructor whose parameter list matches the arguments and runs it as a stack frame. n and g are temporary local variables.', mutations: [
            { type: 'stack.push', label: 'Student("Moss", 11)', vars: [{ name: 'n', value: '"Moss"' }, { name: 'g', value: '11' }] }
        ] },
        { line: 10, message: 'name = n copies the parameter into the new object field. Left side: the object. Right side: the frame.', mutations: [
            { type: 'heap.set', objId: 's1', field: 'name', value: '"Moss"' }
        ] },
        { line: 11, message: 'grade = g fills the second field the same way. Object state is now 11.', mutations: [
            { type: 'heap.set', objId: 's1', field: 'grade', value: '11' },
            { type: 'expression.reduce', text: 'name = "Moss", grade = 11', note: 'object built' }
        ] },
        { line: 1, message: 'The constructor returns no value, it has no return type: what comes back is the reference to the finished object, and s receives it.', mutations: [
            { type: 'stack.pop' },
            { type: 'memory.set', name: 's', dataType: 'Student', value: '', refId: 's1' }
        ] },
        { line: 2, message: 'Now a second new, this time with one argument. First: a fresh object #s2 with defaults, and t declared but not pointing anywhere yet. A brand-new object every time, never a reuse.', mutations: [
            { type: 'heap.create', objId: 's2', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'grade', type: 'int', value: '0' }] },
            { type: 'memory.create', name: 't', dataType: 'Student', value: '?' }
        ] },
        { line: 14, message: 'One String argument does not fit the two-parameter constructor, so Java selects the one-parameter version on line 14. Two constructors in one class: this is overloading, matched by argument list.', mutations: [
            { type: 'stack.push', label: 'Student("Alex")', vars: [{ name: 'n', value: '"Alex"' }] }
        ], predict: { q: 'new Student("Alex") passes one argument. Which constructor runs?', choices: ['Student(String n): the parameter list must match the arguments', 'Student(String n, int g): it is written first', 'Neither: t keeps the defaults'], a: 0, why: 'Java selects the constructor whose parameter list matches the argument list. One String fits only the one-parameter version. That selection is overloading.' } },
        { line: 16, message: 'The chosen body fills the fields: name gets the argument.', mutations: [
            { type: 'heap.set', objId: 's2', field: 'name', value: '"Alex"' }
        ] },
        { line: 17, message: 'grade = 12 is not a passed argument: it is the value this constructor decided to give. Defaults chosen by the author, not by Java, live here.', mutations: [
            { type: 'heap.set', objId: 's2', field: 'grade', value: '12' },
            { type: 'expression.reduce', text: 'name = "Alex", grade = 12', note: 'second object built' }
        ], predict: { q: 'Nobody passed a grade. What does t.grade hold once this constructor finishes?', choices: ['12: the chosen constructor wrote it', '0: the field keeps its default', 'null'], a: 0, why: 'A constructor decides the starting state, including fixed values its own body supplies. grade = 12 comes from that constructor, not from an argument.' } },
        { line: 2, message: 'The frame pops, t receives the reference to object #s2. Notice the two frames held different parameter lists, ran different bodies, and made two completely separate objects.', mutations: [
            { type: 'stack.pop' },
            { type: 'memory.set', name: 't', dataType: 'Student', value: '', refId: 's2' }
        ], predict: { q: 'The frame pops now. What happens to n, and what happens to "Alex"?', choices: ['n dies with the frame; "Alex" lives on inside object #s2', 'n stays alive next to t', 'n becomes the field itself'], a: 0, why: 'Parameters are temporary residents of the frame; instance variables live in the object. Construction copied the value from the temporary home into the permanent one.' } },
        { line: 8, message: 'Keep the split: parameters are temporary residents of a frame and die with it; instance variables live in the object and survive every call. Each new picks a constructor and stamps out a fresh object.', mutations: [] }
    ],
    summary: {
        idea: 'new runs four phases: allocate an object with default fields, pick the constructor whose parameters match the arguments, run the body to fill the fields, then hand the reference to the variable. Fields persist in the object; parameters die in the frame.',
        mistake: 'Thinking a constructor is a method that returns the object: it has no return type, and the reference comes from new itself. Also thinking constructor parameters stay in the object afterward: they do not.',
        transfer: 'Run new Student("Kim", 10): the two-parameter constructor matches instead, grade becomes 10 rather than 12, and a third separate object appears on the heap.'
    }
};
