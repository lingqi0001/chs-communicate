const TEXT = 'CSA rocks';

function ruler(sel) {
    return { kind: 'stringindex', text: TEXT, sel };
}

export default {
    id: 'u1-strings',
    meta: { unit: 1, topic: '1.15', title: 'String Manipulation', visualizerTitle: 'String Memory & Index Visualizer' },
    intro: 'String indexes start at 0, substring stops before its end index, and the Quick Reference methods all live here.',
    code: `String word = "CSA rocks";
int len = word.length();
String sub = word.substring(0, 3);
int at = word.indexOf("r");
String tail = word.substring(4);
boolean same = word.equals("CSA rocks");
int diff = word.compareTo("CSA");
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
        { line: 4, message: 'indexOf("r") scans left to right and reports the first match, index 4. If the character never appears, it returns -1.', mutations: [
            { type: 'extra.set', value: ruler({ from: 4, to: 5, note: "The first 'r' sits at index 4." }) },
            { type: 'expression.reduce', text: 'word.indexOf("r")' }
        ] },
        { line: 4, message: 'at stores the index 4.', mutations: [{ type: 'expression.reduce', text: '4' }, { type: 'memory.create', name: 'at', dataType: 'int', value: '4' }], predict: { q: 'What value does `word.indexOf("r")` return?', choices: ['4', '3', '-1'], a: 0, why: "The cells are C=0, S=1, A=2, space=3, r=4, and indexOf reports the first match. The space still occupies an index, so 'r' is at 4, not 3." } },
        { line: 5, message: 'substring with ONE argument runs from that index to the end: indexes 4 through 8, "rocks". Both forms are on the AP Quick Reference.', mutations: [
            { type: 'extra.set', value: ruler({ from: 4, to: 9, note: 'substring(4): index 4 to the last character.' }) },
            { type: 'expression.reduce', text: 'word.substring(4)' },
            { type: 'memory.create', name: 'tail', dataType: 'String', value: '"rocks"' }
        ] },
        { line: 6, message: 'equals compares the CHARACTERS, not the arrows. Two String variables can hold the same letters and still be different objects; equals asks about content, == asks about identity.', mutations: [
            { type: 'expression.reduce', text: 'word.equals("CSA rocks")' },
            { type: 'memory.create', name: 'same', dataType: 'boolean', value: 'true' }
        ], predict: { q: 'You want to test whether two Strings contain the same characters. Use:', choices: ['.equals(other)', '==', '.compareTo(other) > 0'], a: 0, why: '== asks "same object?", equals asks "same letters?". compareTo also answers equality, but with 0, not true, so equals is the direct test.' } },
        { line: 7, message: 'compareTo answers "which comes first in dictionary order": it returns the difference of the first mismatched characters, or the length difference when one string is a prefix. word vs "CSA": "CSA" is a prefix and word is 5 characters longer, so the result is 5. Equal strings give 0.', mutations: [
            { type: 'expression.reduce', text: 'word.compareTo("CSA")', note: 'prefix case: length difference' },
            { type: 'memory.create', name: 'diff', dataType: 'int', value: '5' }
        ] },
        { line: 8, message: 'Concatenation runs left to right, and + with a String converts the int to its text form.', mutations: [{ type: 'expression.reduce', text: 'sub + " / " + at', note: '"CSA" + " / " + "4"' }] },
        { line: 8, message: 'The final printed line.', mutations: [{ type: 'expression.reduce', text: '"CSA / 4"' }, { type: 'console.print', text: 'CSA / 4' }] }
    ],
    summary: {
        idea: 'The AP Quick Reference String toolkit: length(), substring(from, to) and substring(from), indexOf (first match or -1), equals for content, compareTo for dictionary order. Indexes start at 0 and every character, spaces included, occupies one index.',
        mistake: 'Treating substring(0, 3) as including index 3, using == to compare String content instead of equals, and confusing an index (starts at 0) with a count. String uses length() with parentheses; an array uses length without them.',
        transfer: 'word.substring(4, 9) returns "rocks", the characters at indexes 4 through 8. To keep the leading space you need word.substring(3, 9), which returns " rocks". And word.indexOf("z") returns -1, because there is no z to find.'
    }
};
