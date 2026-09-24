const TEXT = 'banana';

function ruler(sel) {
    return { kind: 'stringindex', text: TEXT, sel };
}

function round(i, ch, hit, count, histNote) {
    const steps = [
        { type: 'memory.set', name: 'i', value: String(i) },
        { type: 'extra.set', value: ruler({ from: i, to: i + 1, note: 'i = ' + i + ', charAt(i) = ' + ch }) },
        { type: 'expression.clear' },
        { type: 'expression.reduce', text: "s.charAt(" + i + ") == 'a'", note: "'" + ch + "' == 'a' → " + hit }
    ];
    if (hit === 'true') steps.push({ type: 'memory.set', name: 'count', value: String(count) });
    return steps;
}

export default {
    id: 'u2-string-algorithms',
    meta: { unit: 2, topic: '2.10', title: 'Implementing String Algorithms', visualizerTitle: 'String Algorithm Trace Visualizer' },
    modes: [{
    label: 'Count a char',
    intro: 'The count-a-character algorithm: loop by index, test each cell, maybe count it.',
    code: `String s = "banana";
int count = 0;
for (int i = 0; i < s.length(); i++)
{
    if (s.charAt(i) == 'a')
        count++;
}
System.out.println(count);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'A String is a row of indexed cells, 0 through length() - 1. The ruler below is the string.', mutations: [
            { type: 'memory.create', name: 's', dataType: 'String', value: '"banana"' },
            { type: 'extra.set', value: ruler(null) }
        ] },
        { line: 2, message: 'count is the accumulator for "how many matches". It starts at 0.', mutations: [
            { type: 'memory.create', name: 'count', dataType: 'int', value: '0' }
        ] },
        { line: 3, message: 'i = 0: charAt(0) is b. b is not a, count stays 0. length() is 6, so the loop owns indexes 0 to 5.', mutations: round(0, 'b', 'false', 0) },
        { line: 5, message: "i = 1: charAt(1) is 'a'. Match, count goes 0 → 1.", mutations: round(1, 'a', 'true', 1) },
        { line: 3, message: 'i = 2: n is not a. Miss.', mutations: round(2, 'n', 'false', 1) },
        { line: 5, message: 'i = 3: another a. count 1 → 2.', mutations: round(3, 'a', 'true', 2) },
        { line: 3, message: 'i = 4: n, miss.', mutations: round(4, 'n', 'false', 2) },
        { line: 5, message: 'i = 5: the last cell is an a. count 2 → 3.', mutations: round(5, 'a', 'true', 3) },
        { line: 3, message: 'i becomes 6. The check 6 < 6 fails and the loop ends. The moment i equals length(), stop: index 6 does not exist, and s.charAt(6) would crash with StringIndexOutOfBounds.', mutations: [
            { type: 'memory.set', name: 'i', value: '6' },
            { type: 'expression.clear' },
            { type: 'expression.reduce', text: 'i < s.length()', note: '6 < 6 → false, loop exits' }
        ], predict: { q: 'i has climbed to 6. Is s.charAt(6) about to be called?', choices: ['No: the check 6 < 6 fails first', 'Yes: i exists so the cell must too'], a: 0, why: 'The guard runs before the body. length() is a COUNT - the last legal cell is length() - 1 = 5. Index 6 is outside the ruler.' } },
        { line: 8, message: 'Result: 3 a’s in banana. The same loop shape with != instead of == counts everything but a character; building a new String inside the loop reverses it.', mutations: [
            { type: 'console.print', text: '3' }
        ] }
    ],
    summary: {
        idea: 'length() is a count, the highest legal index is length() - 1, and the guard i < length() keeps every charAt inside the ruler. Cells read: 6, matches: 3.',
        mistake: 'Off-by-one: writing i <= s.length() or charAt(s.length()) - one symbol from a crash.',
        transfer: 'Swap == to !=: the same loop counts everything that is NOT a. Same skeleton, opposite answer (3 vs 3 here - check why both are 3).'
    }
}, {
    label: 'Substring window',
    intro: 'substring(from, to) highlights a WINDOW: from is inside, to is the stop line outside. The ruler shows exactly which cells join.',
    code: `String s = "banana";
// s.substring(0, 2) -> ?
// s.substring(1, 3) -> ?
// s.substring(2, 4) -> ?
// s.substring(4, 6) -> ?`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 2, message: 'substring(0, 2): cells 0 and 1 light up, cell 2 is the border it stops BEFORE. Result "ba". Length = to - from = 2.', mutations: [
            { type: 'extra.set', value: ruler({ from: 0, to: 2, note: 'substring(0, 2) = "ba"' }) },
            { type: 'expression.reduce', text: 's.substring(0, 2)', note: 'cells [0, 2)' }
        ] },
        { line: 3, message: 'The same 2-cell window slid one step right: substring(1, 3) = "an". Sliding a fixed-size window is exactly what indexOf does inside.', mutations: [
            { type: 'extra.set', value: ruler({ from: 1, to: 3, note: 'substring(1, 3) = "an"' }) }
        ], predict: { q: 'substring(1, 3): from is inside, to is the stop line. Which two letters come out?', choices: ['"an" (cells 1 and 2)', '"na" (cells 2 and 3)', '"ban" (all three)'], a: 0, why: 'Cells 1..2 - the to value names a border the window stops BEFORE. Length is always to - from.' } },
        { line: 4, message: 'substring(2, 4) = "na". Notice from moved AND to moved: both endpoints ride together, the window never changes size mid-slide.', mutations: [
            { type: 'extra.set', value: ruler({ from: 2, to: 4, note: 'substring(2, 4) = "na"' }) }
        ] },
        { line: 5, message: 'substring(4, 6) = "a": to = 6 = length() is LEGAL, because to is exclusive - it is the border after the last cell, not a cell itself.', mutations: [
            { type: 'extra.set', value: ruler({ from: 4, to: 6, note: 'substring(4, 6) = "a" - to may touch length()' }) }
        ] },
        { line: 2, message: 'The two boundaries to memorize: substring(2, 2) = "" (empty, legal - window of zero width); substring(4, 8) CRASHES (to beyond the border). from <= to <= length(), or Java says no.', mutations: [] }
    ],
    summary: {
        idea: 'substring(from, to) = cells from..to-1. The stop line is exclusive, so to may equal length() but never pass it, and piece length is to - from.',
        mistake: 'Counting to as a member: substring(1, 3) is two letters, not three.',
        transfer: 'Which call returns just the final "a"? (substring(5, 6) - and substring(2, 2) returns the empty string, a legal zero-width window.)'
    }
}, {
    label: 'indexOf search',
    intro: 'indexOf(part) slides a part.length()-wide window left to right and returns the FIRST from that matches - or -1 when the shelves run out.',
    code: `String word = "banana";
// word.indexOf("nan") -> ?
// windows of length 3:
// "ban" "ana" "nan" "ana"
String at = word.indexOf("nan");`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 1, message: 'A 3-cell window parks at from = 0: the letters read "ban".', mutations: [
            { type: 'extra.set', value: ruler({ from: 0, to: 3, note: 'window at index 0' }) }
        ] },
        { line: 1, message: 'Compare: is "nan" == "ban"? No. The window shifts right one cell. This is a loop with an if inside - selection driving iteration.', mutations: [
            { type: 'extra.set', value: ruler({ from: 1, to: 4, note: 'window at index 1' }) },
            { type: 'expression.reduce', text: '"ban".equals("nan")', note: 'false, slide right' }
        ] },
        { line: 1, message: 'from = 1 reads "ana": still no. Slide.', mutations: [
            { type: 'extra.set', value: ruler({ from: 2, to: 5, note: 'window at index 2' }) },
            { type: 'expression.reduce', text: '"ana".equals("nan")', note: 'false, slide right' }
        ] },
        { line: 5, message: 'from = 2 reads "nan" - MATCH. indexOf stamps the window’s LEFT edge as the answer: at = 2. Not the middle, not the right edge: the start.', mutations: [
            { type: 'extra.set', value: ruler({ from: 2, to: 5, note: 'MATCH at index 2' }) },
            { type: 'expression.reduce', text: '"nan".equals("nan")', note: 'true -> return 2' }
        ], predict: { q: 'The third window reads "nan" and matches. What NUMBER does indexOf hand back?', choices: ['2 - the window start', '4 - the window end', '0 - matches count from zero'], a: 0, why: 'The answer is where the pattern BEGINS, the window\'s from. indexOf("nan") = 2 because cell 2 holds the n that starts the match.' } },
        { line: 1, message: 'Search "mon" instead: every window misses, and indexOf answers -1. A miss is NOT an error and NOT 0: it is the sentinel value. Code that skips the check == -1 dies inside the next charAt.', mutations: [] }
    ],
    summary: {
        idea: 'indexOf is a sliding-window loop in disguise: compare, miss, slide; return the START on hit, -1 when the shelves run out.',
        mistake: 'Treating -1 as a usable index: charAt(result) after a failed indexOf throws StringIndexOutOfBounds.',
        transfer: 'What is "banana".indexOf("na")? (0 - the very first window already matches.) And indexOf("mon")? (-1 - always test before using.)'
    }
}, {
    label: 'Build + backwards',
    intro: 'Reverse traversal: start at the LAST cell and walk down to 0, feeding each char into a growing new String. One loop, two spec features.',
    code: `String s = "banana";
String rev = "";

for (int i = s.length() - 1; i >= 0; i--)
{
    rev = rev + s.charAt(i);
}
System.out.println(rev);`,
    layout: { center: ['extra'], right: ['expression', 'memory', 'console'] },
    steps: [
        { line: 1, message: 'The ruler again, but this loop’s INIT is i = length() - 1 = 5: the pointer starts at the RIGHT edge.', mutations: [
            { type: 'memory.create', name: 's', dataType: 'String', value: '"banana"' },
            { type: 'memory.create', name: 'rev', dataType: 'String', value: '""' },
            { type: 'extra.set', value: ruler({ from: 5, to: 6, note: 'i = 5, the last legal index' }) }
        ] },
        { line: 6, message: 'Round 1: rev = "" + a. The + operator builds a BRAND NEW String each round - the old rev is unchanged, a longer copy replaces it. That is why Strings are called immutable.', mutations: [
            { type: 'memory.set', name: 'rev', value: '"a"' },
            { type: 'extra.set', value: { kind: 'array', name: 'rev', values: ['a'] } }
        ] },
        { line: 6, message: 'i = 4 gives n: rev = "an". The pointer slides LEFT each round - the traversal direction reversed, the skeleton identical.', mutations: [
            { type: 'memory.set', name: 'rev', value: '"an"' },
            { type: 'extra.set', value: { kind: 'array', name: 'rev', values: ['a', 'n'] } }
        ] },
        { line: 6, message: 'i = 3, 2: rev grows "ana", then "anan". Each round adds exactly one char at the END of the new String, reading from the START of the remaining old one.', mutations: [
            { type: 'memory.set', name: 'rev', value: '"anan"' },
            { type: 'extra.set', value: { kind: 'array', name: 'rev', values: ['a', 'n', 'a', 'n'] } }
        ] },
        { line: 6, message: 'i = 1, then i = 0: "anana", then "ananab". The window shows the pointer arriving at cell 0 - the cell a > 0 condition would have STOLEN from you.', mutations: [
            { type: 'memory.set', name: 'rev', value: '"ananab"' },
            { type: 'extra.set', value: { kind: 'array', name: 'rev', values: ['a', 'n', 'a', 'n', 'a', 'b'] } }
        ] },
        { line: 4, message: 'Next round: i becomes -1, the check -1 >= 0 fails, exit. Reverse-loop rule: the STOP is >= 0, never > 0 - index 0 is a real cell. Console output:', mutations: [
            { type: 'console.print', text: 'ananab' },
            { type: 'extra.set', value: ruler({ from: -1, to: 0, note: 'i = -1: no such cell, loop already exited' }) }
        ], predict: { q: 'Cell 0 just joined the copy and i-- made i = -1. Does the body run once more?', choices: ['No: -1 >= 0 is false, loop exits', 'Yes: charAt(-1) to finish up'], a: 0, why: 'The guard fires before the body, and -1 fails >= 0. The loop was DESIGNED to end right after index 0 got its turn.' } },
        { line: 4, message: 'The same build-loop with i = 0 forward produces the ORIGINAL string back - nothing special. Direction of the pointer + where you APPEND is the entire trick. Traversal direction is a dial, not a new machine.', mutations: [] }
    ],
    summary: {
        idea: 'Reverse traversal is the same accumulator machine with the pointer dial flipped: start length() - 1, stop at >= 0, append per round. The original String never changed - each + built a NEW one (immutability).',
        mistake: 'Writing > 0 as the stop and silently losing the first character; or believing rev = rev + ... mutates the old value.',
        transfer: 'Flip the append to rev = s.charAt(i) + rev with a FORWARD loop: the reverse still appears - front-insert beats back-insert direction.'
    }
}]
};
