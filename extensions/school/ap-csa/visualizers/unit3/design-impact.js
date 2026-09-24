function cmp(lhit, rhit, verdict) {
    return {
        kind: 'compare',
        left: { title: 'Design A: one do-it-all class', rows: [
            { t: 'StudentUI: stores GPA', hit: lhit },
            { t: 'StudentUI: calculates GPA', hit: lhit },
            { t: 'StudentUI: prints student', hit: lhit },
            { t: 'StudentUI: renames student', hit: lhit },
            { t: 'StudentUI: validates grades', hit: lhit }
        ] },
        right: { title: 'Design B: split responsibilities', rows: [
            { t: 'Student: name, grades', hit: false },
            { t: 'Student: calculateGPA()', hit: rhit },
            { t: 'StudentUI: displayStudent()', hit: false }
        ] },
        verdict
    };
}

function row(t) { return { t: t.startsWith('*') ? t.slice(1) : t, hit: t.startsWith('*') }; }

function pair(ltitle, lrows, rtitle, rrows, verdict) {
    return {
        kind: 'compare',
        left: { title: ltitle, rows: lrows.map(row) },
        right: { title: rtitle, rows: rrows.map(row) },
        verdict
    };
}

export default {
    id: 'u3-design-impact',
    meta: { unit: 3, topic: '3.2', title: 'Impact of Program Design', visualizerTitle: 'Class Design Impact Visualizer' },
    intro: 'Both designs run. The question is which one survives the next requirement change.',
    code: `// Design A: StudentUI does everything
//   stores GPA, calculates GPA, prints,
//   renames, validates...

// Design B: each class owns its job
//   Student: name, grades, calculateGPA()
//   StudentUI: displayStudent()`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Two working designs for the same app. Design A piles every responsibility into one class. Design B gives the data and its math to Student, and leaves only display to StudentUI.', mutations: [
            { type: 'extra.set', value: cmp(false, false) }
        ] },
        { line: 6, message: 'New requirement: the GPA calculation must now drop the lowest grade. Watch what that change costs in each design.', mutations: [] },
        { line: 1, message: 'In Design A the GPA logic is copied across several places that all store or touch GPA: the change lands in multiple spots, and missing one creates a bug.', mutations: [
            { type: 'extra.set', value: cmp(true, false, 'Design A: change ripples through several places') }
        ], predict: { q: 'The GPA rule changes. Design A spreads storing and computing GPA across five jobs in one class. How many spots need editing?', choices: ['Several: every copy of the logic must be chased', 'Exactly one', 'None, the class hides it'], a: 0, why: 'Duplicated logic multiplies the cost of every future change, and one missed copy becomes a bug.' } },
        { line: 6, message: 'In Design B the calculation lives in exactly one method: Student.calculateGPA(). One edit, done.', mutations: [
            { type: 'extra.set', value: cmp(true, true, 'Design A: many places. Design B: one method.') }
        ] },
        { line: 6, message: 'Duplication is also coupling. When Report, UI, and GradeBook each carry their own copy of the GPA math, all three classes are secretly tied to one rule: change the rule, chase three files.', mutations: [
            { type: 'extra.set', value: pair('Copy-paste GPA math', ['*Report.java sorts and drops', '*UI.java sorts and drops', '*GradeBook.java sorts and drops'], 'One method, many callers', ['Student.calculateGPA()','called by Report','called by UI','called by GradeBook'], 'Shared code means shared fragility; a shared method means one owner.') }
        ] },
        { line: 6, message: 'Refactoring is the repair: extract the duplicated steps into a method one class owns. The three callers shrink to one line each.', mutations: [
            { type: 'extra.set', value: pair('Before: duplicated', ['Report: sort, drop, average', 'UI: sort, drop, average', 'GradeBook: sort, drop, average'], 'After: extracted', ['GradeRule.dropLowest(grades)','Report calls it once','UI calls it once','GradeBook calls it once'], 'Same behavior, one place to change.') }
        ] },
        { line: 1, message: 'Encapsulation decides who is allowed to break things. Public fields let any class write garbage into a Student; private fields force everyone through a validating method.', mutations: [
            { type: 'extra.set', value: pair('A: public double gpa;', ['*any class reads it directly', '*any class writes a wrong value', '*changing storage breaks all readers'], 'B: private + getGPA()', ['only setGPA() validates', 'callers depend on the method, not storage', 'storage can change safely'], 'private is a wall: it shrinks the blast radius of every future change.') }
        ], predict: { q: 'gpa is public and twelve classes read it directly. The author now wants to store it as a percent. What happens?', choices: ['All twelve readers may break', 'Nothing: the field is invisible from outside', 'The compiler rewrites the readers'], a: 0, why: 'A public field makes outside code depend on how data is stored. A private field behind a method lets the storage change while the contract holds.' } },
        { line: 6, message: 'Code that runs is not the same as code that is easy to keep. Responsibilities, no duplication, and private data behind methods are what make change cheap.', mutations: [
            { type: 'extra.set', value: cmp(true, true, 'Good design: one place to change, everything else unaffected') }
        ] }
    ],
    summary: {
        idea: 'Design quality is measured by the cost of change: one responsibility per class, logic kept in one place, data private behind methods. Running code is the floor, not the goal.',
        mistake: 'Believing "it works, so it is good." Copy-pasted logic ties three classes to one rule, and a public field ties even more code to one storage decision.',
        transfer: 'A new requirement says GPA becomes weighted. In Design B only Student.calculateGPA() is edited; in Design A every copy of the math must be hunted down first.'
    }
};
