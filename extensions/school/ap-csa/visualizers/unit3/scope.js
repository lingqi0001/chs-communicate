function scope(active, ifVars, note, error) {
    return {
        kind: 'scope',
        active,
        error,
        boxes: {
            name: 'method',
            vars: [{ t: 'int p (parameter)' }, { t: 'int x = 5' }],
            children: [{ name: 'if', vars: ifVars }]
        },
        note
    };
}

function shadow() {
    return {
        kind: 'scope',
        active: 'method (inside test)',
        boxes: [
            { name: 'instance: the object', vars: [{ t: 'private int x = 10  (field)' }] },
            { name: 'method (inside test)', vars: [{ t: 'int x = 5  (local, hides the field)' }] }
        ],
        note: 'Two x live at the same time. Inside test(), a plain x is the local 5; the field is still 10 and is reached only as this.x. Same name, different boxes.'
    };
}

export default {
    id: 'u3-scope',
    meta: { unit: 3, topic: '3.8', title: 'Scope and Access', visualizerTitle: 'Variable Scope & Access Visualizer' },
    intro: 'Every pair of braces is a box. Variables are born inside a box and die when control leaves it.',
    code: `public void test(int p)
{
    int x = 5;
    if (x > 0)
    {
        int y = 10;
        System.out.println(y);
    }
    System.out.println(y);
}

// class Calc {
//     private int x = 10;          // the field
//     void test() { int x = 5; }   // a local that hides it
// }
// a.x = 3;   // outside the class: compile error, x is private`,
    layout: { center: ['extra'], right: ['memory', 'console'] },
    steps: [
        { line: 1, message: 'The method box opens with its parameters: p arrives with the call, lives at the top level of the box, and dies when test returns.', mutations: [
            { type: 'extra.set', value: scope('method', [], 'p is a parameter: scope = this method box.') }
        ] },
        { line: 3, message: 'x is declared in the method box. It is visible from its declaration down to the closing brace of that box.', mutations: [
            { type: 'memory.create', name: 'x', dataType: 'int', value: '5' },
            { type: 'extra.set', value: scope('method', [], 'x lives in the method scope.') }
        ] },
        { line: 6, message: 'The if opens an inner box. y is born inside it, one level deeper.', mutations: [
            { type: 'memory.create', name: 'y', dataType: 'int', value: '10' },
            { type: 'extra.set', value: scope('if', [{ t: 'int y = 10' }], 'Inner boxes can see outward: y can read x and p.') }
        ] },
        { line: 7, message: 'println(y) is inside the if box, so y is legal here.', mutations: [
            { type: 'console.print', text: '10' }
        ] },
        { line: 8, message: 'The if closes. y is destroyed the moment control leaves its box. x and p survive: still inside the method box.', mutations: [
            { type: 'memory.remove', name: 'y' },
            { type: 'extra.set', value: scope('method', [{ t: 'int y = 10', dead: true }], 'y is dead outside its braces.') }
        ] },
        { line: 9, message: 'This line never compiles. System.out.println(y) asks for y from the method box, where y was never visible. Scope errors are caught at compile time, not runtime.', mutations: [
            { type: 'extra.set', value: scope('method', [{ t: 'int y = 10', dead: true }], 'ERROR: y is out of scope here.', 'if') }
        ], predict: { q: 'The if box closed at line 8. Can line 9 read y?', choices: ['No: y died with its box, this is a compile error', 'Yes: everything in the method sees everything', 'Only while the console is empty'], a: 0, why: 'A variable is visible from its declaration down to its box\'s closing brace. y\'s box closed, so line 9 asks for a name that no longer exists.' } },
        { line: 14, message: 'Now the shadowing case from the class below: the field x = 10 and a local x = 5 exist at once, in different boxes. Java searches from the inside out: local, then parameter, then instance.', mutations: [
            { type: 'extra.set', value: shadow() }
        ], predict: { q: 'Inside test(), the code reads a plain x. Which value arrives?', choices: ['5: the local x hides the field x', '10: the field always wins', 'Both: Java averages the two'], a: 0, why: 'Java searches from the inside out: local, then parameter, then instance. The field is still alive at 10; reaching it takes this.x.' } },
        { line: 16, message: 'Access is scope seen from the door: private means the name is invisible outside the class file. a.x does not compile, even though the field is alive inside its object.', mutations: [
            { type: 'extra.set', value: {
                kind: 'compare',
                left: { title: 'Inside the class', rows: [{ t: 'x = 10; legal, same box', hit: false }, { t: 'methods reach fields directly', hit: false }] },
                right: { title: 'Outside code', rows: [{ t: 'a.x = 3;', hit: true }, { t: 'compile error: x has private access', hit: true }] },
                verdict: 'Scope says where a name is visible. private says who may see it.'
            } }
        ], predict: { q: 'Code outside Calc wants to run a.x = 3;. Allowed?', choices: ['No: x is private to the class', 'Yes: fields are public by default', 'Only inside the same method'], a: 0, why: 'private decides who: only code inside the class touches the field. Scope decides where: whether the name is visible at this point. Both axes must pass.' } },
        { line: 3, message: 'One line to keep: a variable belongs to the braces it was declared in, parameters to the method, fields to the object, and every name is looked up from the inside out.', mutations: [] }
    ],
    summary: {
        idea: 'Braces rule lifetime: a variable is born at its declaration and dies when its box closes. Parameters belong to the method box, fields to the object, and same-named locals hide fields from the inside out. private locks the door from outside the class.',
        mistake: 'Believing anything declared in a method survives the whole method: the if\'s y dies at the if\'s closing brace. Also believing two same-named x variables are the same storage.',
        transfer: 'Declare x once at the method level and try to declare it again in the same box: compile error, duplicate declaration. Declare it in a deeper box instead and it lives again as a second, hiding variable.'
    }
};
