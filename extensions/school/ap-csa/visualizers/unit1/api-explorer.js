export default {
    id: 'u1-api-explorer',
    meta: { unit: 1, topic: '1.7', title: 'Application Program Interface (API) and Libraries', visualizerTitle: 'API Explorer' },
    intro: 'You already program for classes you never wrote. The API is the contract that makes that possible.',
    code: `import java.util.Scanner;

Scanner kb = new Scanner(System.in);
String line = kb.nextLine();
int n = line.length();
String head = line.substring(0, 3);`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 3, message: 'Scanner is not YOUR class: it is library code, published with a list of what it can do. That list is its API. You never read the source; you read the spec.', mutations: [
            { type: 'extra.set', value: { kind: 'blueprint', className: 'Scanner (library class)', fields: [{ name: 'nextLine()', type: 'String' }, { name: 'nextInt()', type: 'int' }, { name: 'hasNext()', type: 'boolean' }] } }
        ] },
        { line: 1, message: 'Classes live in packages. java.lang (String, Math, System) is automatic; anything else must be imported by name so the compiler knows where to look.', mutations: [
            { type: 'extra.set', value: {
                kind: 'compare',
                left: { title: 'java.lang: automatic', rows: [{ t: 'String, Math, System', hit: false }, { t: 'no import line needed', hit: false }] },
                right: { title: 'java.util: import first', rows: [{ t: 'Scanner, ArrayList', hit: false }, { t: 'import java.util.Scanner;', hit: false }, { t: 'using it without the import: compile error', hit: true }] },
                verdict: 'The package tells the compiler where the class lives.'
            } }
        ] },
        { line: 4, message: 'An API document lists method signatures: return type, name, parameter types, in order. Reading signatures IS the skill; the body is somebody else\'s problem.', mutations: [
            { type: 'extra.set', value: { kind: 'math', rows: [
                { call: 'nextLine()', result: 'String', note: 'reads the rest of one input line' },
                { call: 'nextInt()', result: 'int', note: 'reads one whole number' },
                { call: 'length()', result: 'int', note: 'String: how many characters' },
                { call: 'substring(int from, int to)', result: 'String', note: 'from inclusive, to exclusive' }
            ] } }
        ] },
        { line: 6, message: 'Break a signature into parts the way 1.9 taught: return type String, name substring, parameters (int from, int to). The parameter list says what you may pass, in which order, of which types.', mutations: [
            { type: 'extra.set', value: { kind: 'signature', focus: 'params', parts: [
                { key: 'returnType', text: 'String' },
                { key: 'name', text: 'substring' },
                { key: 'params', text: '(int from, int to)' },
                { key: 'body', text: '{ library code }' }
            ], desc: 'Two ints in, one String out. Order matters: substring(3, 0) compiles and returns the empty string.' } }
        ] },
        { line: 3, message: 'The CED asks you to read a class description and split it in two: attributes (what it knows, its variables) vs behaviors (what it does, its methods).', mutations: [
            { type: 'extra.set', value: { kind: 'blueprint', className: 'Student (from a spec card)', fields: [{ name: 'name, gpa', type: 'attributes' }, { name: 'getName(), setGPA()', type: 'behaviors' }, { name: 'isHonors()', type: 'behavior' }] } }
        ] },
        { line: 5, message: 'Which method answers which question: indexOf searches and reports a position, substring extracts characters, length counts them.', mutations: [], predict: { q: 'You need the index where "the" first appears in a String. Which API method?', choices: ['indexOf("the")', 'substring("the")', 'length()'], a: 0, why: 'indexOf reports the first position of a search string, or -1. substring needs indexes, not text, and length just counts.' } },
        { line: 4, message: 'Methods also document what they accept. nextInt() demands integer text: feed it the word abc and the library throws InputMismatchException. The spec told you so.', mutations: [
            { type: 'expression.reduce', text: 'kb.nextInt()   // input says "abc"', note: 'InputMismatchException' }
        ], predict: { q: 'The next input text is "abc". What does kb.nextInt() do?', choices: ['Throws InputMismatchException', 'Returns 0', 'Reads "abc" as a String'], a: 0, why: 'nextInt promises an int and only an int. Wrong-shaped input is the documented failure, not a silent fallback.' } },
        { line: 6, message: 'APIs compose: every call is an expression with a return value, so the result of one call can be the receiver of the next. kb.nextLine().trim() is two library contracts chained.', mutations: [
            { type: 'expression.reduce', text: 'line.substring(0, 3)', note: 'a String in hand, call String methods on it' }
        ] }
    ],
    summary: {
        idea: 'An API is a published contract: package, class, and method signatures (return type, name, parameters in order). You program against the spec, never the implementation, and java.lang is the only automatic package.',
        mistake: 'Passing arguments in the wrong type or order because the name seemed right, expecting nextInt to survive non-numeric text, and assuming every class needs an import (String does not).',
        transfer: 'The AP exam prints Javadoc-style excerpts for unfamiliar classes. Drill: read a two-line spec card for a made-up class and answer only: what goes in, what comes out, what does it promise.'
    }
};
