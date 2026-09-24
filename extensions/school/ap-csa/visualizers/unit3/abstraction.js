function abs(items, model, note) {
    return { kind: 'abstraction', items, model, note };
}

const ALL = [
    { t: 'name' },
    { t: 'GPA' },
    { t: 'favorite color', keep: false },
    { t: 'shoe size', keep: false },
    { t: 'home Wi-Fi password', keep: false }
];

const PICK = [{ t: 'name', keep: true }, { t: 'GPA', keep: true }, { t: 'favorite color', keep: false }, { t: 'shoe size', keep: false }, { t: 'home Wi-Fi password', keep: false }];

export default {
    id: 'u3-abstraction',
    meta: { unit: 3, topic: '3.1', title: 'Abstraction and Program Design', visualizerTitle: 'Class Blueprint & Abstraction Visualizer' },
    intro: 'A real student has thousands of facts. A class keeps only the ones the program needs.',
    code: `public class Student
{
    private String name;
    private double gpa;

    public String getName()
    {
        return name;
    }
}

Student a = new Student();
Student b = new Student();`,
    layout: { center: ['extra'], right: ['memory', 'heap'] },
    steps: [
        { line: 1, message: 'The requirement: keep track of each student name and GPA. Every fact about a real student is a candidate, marked ? until the requirement decides.', mutations: [
            { type: 'extra.set', value: abs(ALL.map(a => ({ ...a })), [], 'Requirement: track names and GPAs.') }
        ] },
        { line: 3, message: 'name and GPA are exactly what the program asks for, so they become instance variables: the state of each object. The rest is noise for this program.', mutations: [
            { type: 'extra.set', value: abs(PICK, [], 'Instance variables = the state the requirement needs.') }
        ], predict: { q: 'Requirement: track each student\'s name and GPA. Which candidates become instance variables?', choices: ['name and GPA only', 'name, GPA, favorite color, shoe size', 'shoe size and Wi-Fi password'], a: 0, why: 'Instance variables keep exactly the state the requirement asks for. Every other fact about the real person is noise this program should not carry.' } },
        { line: 3, message: 'How much detail is right? Too little, and the required report is impossible. Too much, and the class carries facts no method ever uses.', mutations: [
            { type: 'extra.set', value: { kind: 'pipeline', stage: 1, labels: ['Too little', 'Just right', 'Too much'], subs: ['only name: no GPA report possible', 'name + gpa: matches the requirement', '12 facts incl. shoe size: pure noise'], caption: 'Abstraction level: keep what the program answers need, nothing else.' } }
        ] },
        { line: 6, message: 'What the object can do becomes methods. Reading the stored name back out is the getName behavior. The class owns storing and guarding the data; printing and validating are other classes\' jobs.', mutations: [
            { type: 'extra.set', value: abs(PICK, ['String name', 'double gpa', 'getName(): String'], 'state = variables, behavior = methods.') }
        ] },
        { line: 12, message: 'The blueprint now builds houses. new Student() creates object #a1 on the heap with default state, and a holds the reference to it.', mutations: [
            { type: 'heap.create', objId: 'a1', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'gpa', type: 'double', value: '0.0' }] },
            { type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 'a1' }
        ] },
        { line: 13, message: 'A second new from the same class makes a second, fully separate object. One class, as many objects as you need, each with its own name and gpa.', mutations: [
            { type: 'heap.create', objId: 'b1', className: 'Student', fields: [{ name: 'name', type: 'String', value: 'null' }, { name: 'gpa', type: 'double', value: '0.0' }] },
            { type: 'memory.create', name: 'b', dataType: 'Student', value: '', refId: 'b1' }
        ], predict: { q: 'A second new Student() just ran. How many Student objects are on the heap now?', choices: ['2: each new stamps out a fresh object', '1: b reuses a\'s object', '0 until fields are filled'], a: 0, why: 'Every new creates a separate object from the blueprint. a and b now name two different boxes with their own state.' } },
        { line: 3, message: 'Abstraction is choosing, not collecting. private on the variables hides the data so outside code must go through the methods.', mutations: [] }
    ],
    summary: {
        idea: 'A class is an abstraction of a real concept: instance variables = the state the requirement needs, methods = the behavior, and one class stamps out as many separate objects as the program asks for.',
        mistake: 'Confusing class with object: declaring the class creates zero objects. Collecting every fact about a real student is the opposite of abstraction.',
        transfer: 'If the same program must also track attendance, a boolean attended field joins name and gpa. The class grows only when the requirement does.'
    }
};
