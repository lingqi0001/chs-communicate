const REGIONS = [
    { key: 'header', label: 'Class header', from: 1, to: 2 },
    { key: 'fields', label: 'Instance variables', from: 3, to: 4 },
    { key: 'staticField', label: 'Static variable', from: 5, to: 5 },
    { key: 'ctor', label: 'Constructor', from: 7, to: 11 },
    { key: 'staticMethod', label: 'Static method', from: 13, to: 16 },
    { key: 'method', label: 'Method', from: 18, to: 21 }
];

function anat(active, desc) {
    return { kind: 'anatomy', regions: REGIONS, active, desc };
}

const BLUEPRINT = { kind: 'blueprint', className: 'Student', fields: [{ name: 'name', type: 'String' }, { name: 'grade', type: 'int' }] };

export default {
    id: 'u3-class-anatomy',
    meta: { unit: 3, topic: '3.3', title: 'Anatomy of a Class', visualizerTitle: 'Class Anatomy Visualizer' },
    intro: 'Every class file has the same zones. Learn to spot them at a glance.',
    code: `public class Student
{
    private String name;
    private int grade;
    private static int schoolCount = 0;

    public Student(String n, int g)
    {
        name = n;
        grade = g;
    }

    public static int getSchoolCount()
    {
        return schoolCount;
    }

    public String getName()
    {
        return name;
    }
}`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'The class header: public class plus a name that matches the file. It declares a new type, it does not create any object yet.', mutations: [
            { type: 'extra.set', value: anat('header', 'public class Student : declares the type itself.') }
        ] },
        { line: 3, message: 'Instance variables sit directly inside the class braces. Every object gets its own private copy of these. private means only this class touches them directly.', mutations: [
            { type: 'extra.set', value: anat('fields', 'Two instance variables: name and grade. One set per object.') }
        ] },
        { line: 3, message: 'Read the class as a blueprint: same fields, listed once, stamped into every object the class will ever build.', mutations: [
            { type: 'extra.set', value: BLUEPRINT }
        ] },
        { line: 5, message: 'schoolCount carries the word static: it belongs to the class itself, one variable total, shared by every object. It is not part of any blueprint copy.', mutations: [
            { type: 'extra.set', value: anat('staticField', 'private static int schoolCount : one box for the whole class.') }
        ] },
        { line: 7, message: 'The constructor looks like a method but has no return type and is named exactly like the class. It runs once per new, setting the starting state.', mutations: [
            { type: 'extra.set', value: anat('ctor', 'public Student(String n, int g) : no return type, same name as the class.') }
        ], predict: { q: 'What marks line 7 as a constructor instead of a method?', choices: ['Same name as the class, and no return type', 'It appears before the other methods', 'It has parameters'], a: 0, why: 'A constructor matches the class name and carries no return type; it runs automatically during new. Order and parameters do not identify it.' } },
        { line: 13, message: 'getSchoolCount is a static method: called on the class as Student.getSchoolCount(), with no object in front of the dot. With no this inside, it may only touch statics.', mutations: [
            { type: 'extra.set', value: anat('staticMethod', 'static: belongs to the class, cannot see name or grade.') }
        ], predict: { q: 'Inside getSchoolCount(), can the code read name directly?', choices: ['No: a static method has no this, and name needs an object', 'Yes: everything in the class sees everything', 'Only if name were public'], a: 0, why: 'Static members belong to the class. With no current object inside a static method, only static data is reachable; instance fields need a receiver.' } },
        { line: 18, message: 'Regular methods define behavior. This one has a return type (String), a name, an empty parameter list, and a body ending in return.', mutations: [
            { type: 'extra.set', value: anat('method', 'public String getName() : access, return type, name, parameters, body.') }
        ] },
        { line: 7, message: 'The exam distinction: constructor = no return type, runs via new, builds state. Method = has a return type (or void), runs via a call, does work. Instance members live per object, static members live once per class.', mutations: [] }
    ],
    summary: {
        idea: 'Every class file has the same zones: header, instance variables (one set per object), static variables (one copy for the class), constructor (runs on new), methods (run on call). The zone tells you who owns the data and what triggers the code.',
        mistake: 'Reading a constructor as a normal method that returns the object, or drawing a static variable inside every object. Static lives once on the class; instance lives once per object.',
        transfer: 'Add a static int tardies = 0. Calling Student.getSchoolCount() before any Student exists still works, because the class exists before any object does.'
    }
};
