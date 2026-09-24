const TEXT = 'CSA rocks';

function ruler(sel) {
    return { kind: 'stringindex', text: TEXT, sel };
}

export default {
    id: 'u1-strings',
    meta: { unit: 1, topic: '1.15', title: 'String Manipulation', visualizerTitle: 'String Memory & Index Visualizer' },
    intro: 'String indexes start at 0, and substring stops before its end index.',
    code: `String word = "CSA rocks";
int len = word.length();
String sub = word.substring(0, 3);
int at = word.indexOf('r');
System.out.println(sub + " / " + at);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'A String is an ordered row of characters, each with an index. Numbering starts at 0, and the space counts as a character.', mutations: [
            { type: 'memory.create', name: 'word', dataType: 'String', value: '"CSA rocks"' },
            { type: 'extra.set', value: ruler(null) }
        ] },
        { line: 2, message: 'length() counts all characters, including the space: 9.', mutations: [{ type: 'expression.reduce', text: 'word.length()', note: 'C=0, S=1, A=2, space=3 ...' }] },
        { line: 2, message: 'len stores the returned count.', mutations: [{ type: 'expression.reduce', text: '9' }, { type: 'memory.create', name: 'len', dataType: 'int', value: '9' }] },
        { line: 3, message: 'substring(0, 3) keeps indexes 0, 1, 2 and stops before 3. The end index is the first character NOT included.', mutations: [{ type: 'extra.set', value: ruler({ from: 0, to: 3, note: 'substring(0, 3): include 0, 1, 2; index 3 is excluded.' }) }] },
        { line: 3, message: 'The result "CSA" is itself a new String object.', mutations: [{ type: 'expression.reduce', text: '"CSA"' }, { type: 'memory.create', name: 'sub', dataType: 'String', value: '"CSA"' }], predict: { q: 'What String does `word.substring(0, 3)` produce?', choices: ['"CSA"', '"CSA "', '"SA "'], a: 0, why: 'substring keeps the start index and stops before the end index. Indexes 0, 1, 2 are kept; index 3 (the space) is left out, so the result is the first three characters, "CSA".' } },
        { line: 4, message: "indexOf(r) scans left to right and reports the first match, index 4. If the character never appears, it returns -1.", mutations: [
            { type: 'extra.set', value: ruler({ from: 4, to: 5, note: "The first 'r' sits at index 4." }) },
            { type: 'expression.reduce', text: "word.indexOf('r')" }
        ] },
        { line: 4, message: 'at stores the index 4.', mutations: [{ type: 'expression.reduce', text: '4' }, { type: 'memory.create', name: 'at', dataType: 'int', value: '4' }], predict: { q: 'What value does `word.indexOf(\'r\')` return?', choices: ['4', '3', '-1'], a: 0, why: "The cells are C=0, S=1, A=2, space=3, r=4, and indexOf reports the first match. The space still occupies an index, so 'r' is at 4, not 3." } },
        { line: 5, message: 'Concatenation runs left to right, and + with a String converts the int to its text form.', mutations: [{ type: 'expression.reduce', text: 'sub + " / " + at', note: '"CSA" + " / " + "4"' }] },
        { line: 5, message: 'The final printed line.', mutations: [{ type: 'expression.reduce', text: '"CSA / 4"' }, { type: 'console.print', text: 'CSA / 4' }] }
    ],
    summary: {
        idea: 'String indexes start at 0 and length() counts every character, including spaces. substring(a, b) keeps a and stops before b, and indexOf gives the first matching position or -1.',
        mistake: 'Treating substring(0, 3) as if it includes index 3 or spans 4 characters, and confusing an index (starts at 0) with a count. Also String uses length() with parentheses while an array uses length without them.',
        transfer: 'word.substring(4, 9) returns " rocks", five characters starting at index 4. And word.indexOf(\'z\') returns -1, because there is no z to find.'
    }
};
