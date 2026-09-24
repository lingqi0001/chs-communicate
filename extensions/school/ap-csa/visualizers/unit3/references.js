export default {
    id: 'u3-references',
    meta: { unit: 3, topic: '3.6', title: 'Methods: Passing and Returning References of an Object', visualizerTitle: 'Reference Passing & Aliasing Visualizer' },
    intro: 'Java passes a copy. When the value is an object, the copy is a copy of the address.',
    code: `Student a = new Student("Moss");
rename(a);
System.out.println(a.getName());
Student c = giveBack(a);
replace(a);
a = null;
System.out.println(c.getName());

// public static void rename(Student s)
// {
//     s.setName("Alex");
// }
//
// public static Student giveBack(Student s)
// {
//     return s;
// }
//
// public static void replace(Student s)
// {
//     s = new Student("Bob");
// }`,
    layout: { center: ['memory', 'heap'], right: ['stack', 'expression', 'console'] },
    steps: [
        { line: 1, message: 'One object on the heap, one arrow from a. Nothing surprising yet.', mutations: [
            { type: 'heap.create', objId: 's1', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Moss"' }] },
            { type: 'memory.create', name: 'a', dataType: 'Student', value: '', refId: 's1' }
        ] },
        { line: 2, message: 'The call copies the value of a into the parameter s. The value is a reference, so now two arrows point at the same single object.', mutations: [
            { type: 'stack.push', label: 'rename(a)', vars: [{ name: 's', value: '→ #s1' }] }
        ], predict: { q: 'rename(a) is called. While its frame lives, how many Student objects exist?', choices: ['1: s and a name the same object', '2: the method got its own copy of the object', '3: the frame holds a copy too'], a: 0, why: 'Passing copies the reference value, never the object. Two arrows now point at one heap box.' } },
        { line: 11, message: 's.setName("Alex") follows the arrow and mutates the shared object. Anything looking at object #s1 now sees Alex.', mutations: [
            { type: 'heap.set', objId: 's1', field: 'name', value: '"Alex"' }
        ] },
        { line: 3, message: 'The frame pops and s is destroyed. The object stays changed: a sees it too.', mutations: [
            { type: 'stack.pop' },
            { type: 'expression.reduce', text: 'a.getName()', note: 'follows the arrow to #s1' }
        ] },
        { line: 3, message: 'Alex. The method reached the caller\'s object without touching the caller\'s variable.', mutations: [
            { type: 'console.print', text: 'Alex' }
        ] },
        { line: 4, message: 'giveBack(a) opens the same way: one copied arrow, s pointing at object #s1. But this method will hand a value back.', mutations: [
            { type: 'stack.push', label: 'giveBack(a)', vars: [{ name: 's', value: '→ #s1' }] }
        ] },
        { line: 16, message: 'return s does not invent a new object: it hands the same reference back to the caller, where c is initialized with it. Three names, still one object. Returning an object means returning a reference.', mutations: [
            { type: 'expression.reduce', text: 'return s', note: 'a copy of the address travels back' },
            { type: 'stack.pop' },
            { type: 'memory.create', name: 'c', dataType: 'Student', value: '', refId: 's1' }
        ], predict: { q: 'giveBack returns s, and c receives it. Do a and c now point to the same object?', choices: ['Yes: the returned address is still #s1', 'No: returning builds a fresh object', 'Only while the frame is alive'], a: 0, why: 'Returning an object means returning a reference. c takes the same address, so three names share one object.' } },
        { line: 5, message: 'replace(a) starts identically: Java copies the reference, s points at #s1. Watch what happens when the method reassigns its own parameter.', mutations: [
            { type: 'stack.push', label: 'replace(a)', vars: [{ name: 's', value: '→ #s1' }] }
        ] },
        { line: 21, message: 's = new Student("Bob") builds object #s2 and re-aims only the frame\'s copy of the address. The arrow from a never moved.', mutations: [
            { type: 'heap.create', objId: 's2', className: 'Student', fields: [{ name: 'name', type: 'String', value: '"Bob"' }] },
            { type: 'stack.set', name: 's', value: '→ #s2' }
        ], predict: { q: 'Inside replace, s is re-aimed at new object #s2. After the method ends, what does a point at?', choices: ['#s1: the caller\'s arrow never moved', '#s2: the reassignment flows back out', 'null'], a: 0, why: 'The frame re-aimed its own copy of the address, and that copy dies with the frame. You can change an object through a parameter; you cannot redirect the caller\'s variable.' } },
        { line: 5, message: 'The frame pops and its s dies while pointing at #s2. Back in the caller, a still names #s1 unchanged. You can mutate an object through a copied reference; you can never redirect the caller\'s own arrow.', mutations: [
            { type: 'stack.pop' }
        ] },
        { line: 6, message: 'a = null erases a\'s address: its arrow disappears, the variable now literally holds null. Calling a.getName() from here would crash with NullPointerException. But object #s1 is alive: c still points at it.', mutations: [
            { type: 'memory.set', name: 'a', value: 'null' }
        ], predict: { q: 'a is set to null while c still points at #s1. Is the object still usable?', choices: ['Yes: c\'s arrow keeps it alive', 'No: a was its owner', 'Yes, but only inside old frames'], a: 0, why: 'An object lives while any reference can reach it. null erases one arrow and leaves every other arrow untouched.' } },
        { line: 7, message: 'The print goes through c and reaches the very same object rename changed: Alex. An object survives as long as at least one arrow names it.', mutations: [
            { type: 'expression.reduce', text: 'c.getName()', note: 'follows c to #s1' },
            { type: 'console.print', text: 'Alex' }
        ] },
        { line: 19, message: 'Carry these out of 3.6: arguments and returns copy the reference value, never the object; aliases share one box so one write shows in every reader; reassigning a parameter changes only the local copy; null is a reference pointing nowhere.', mutations: [] }
    ],
    summary: {
        idea: 'Passing and returning copy the reference value: mutating the object through a copy is seen by everyone, re-aiming a copy is seen by no one, and an object stays alive while any arrow still names it.',
        mistake: 'Believing b = a or a method call duplicates the object, believing reassigning a parameter redirects the caller\'s variable, or treating null as an empty object rather than an arrow pointing nowhere.',
        transfer: 'If replace also returned the new object, the caller could write a = replace2(a) and a truly would move. The difference: that assignment happens in the caller, not in the frame.'
    }
};
