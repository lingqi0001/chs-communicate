const LINES = ['85', '91', '77', '93'];

function file(lines, cursor, note) {
    return { kind: 'file', lines, cursor, note };
}

function lst(values, note) {
    return { kind: 'list', name: 'list', values, note };
}

function readStep(cursor, value) {
    return [
        { type: 'extra.set', value: file(LINES, cursor) },
        { type: 'memory.create', name: 'score', dataType: 'int', value: value },
        { type: 'extra.set', value: lst(LINES.slice(0, cursor + 1).map(Number)) }
    ];
}

export default {
    id: 'u4-text-files',
    meta: { unit: 4, topic: '4.6', title: 'Using Text Files', visualizerTitle: 'File Input Pipeline Visualizer' },
    intro: 'A file is data outside the program. A Scanner turns its text into values, one pull at a time.',
    code: `Scanner file = new Scanner(new File("scores.txt"));

while (file.hasNextInt())
{
    int score = file.nextInt();
    list.add(score);
}`,
    layout: { center: ['extra'], right: ['memory'] },
    steps: [
        { line: 3, message: 'scores.txt holds four lines of text. The cursor sits at the first token. hasNextInt() peeks: yes, 85 is a whole number.', mutations: [
            { type: 'extra.set', value: file(LINES, 0, 'The file is still text: the characters "8", "5", not the number 85.') }
        ] },
        { line: 5, message: 'nextInt() pulls 85, parsing the text into an int. The score variable receives it and the list grows to [85].', mutations: readStep(0, '85') },
        { line: 5, message: 'Next pull: 91. The cursor advances automatically; each nextInt() takes one token and leaves the rest.', mutations: readStep(1, '91') },
        { line: 5, message: 'Pull 77.', mutations: readStep(2, '77') },
        { line: 5, message: 'Pull 93. The list is now [85, 91, 77, 93] and the cursor has consumed everything.', mutations: readStep(3, '93') },
        { line: 3, predict: { q: 'The cursor is past the last token. The loop runs one more time: what does hasNextInt() do?', choices: ['Returns false, the while exits cleanly, no crash', 'Throws because there is nothing left to read', 'Reads 0 as the default'], a: 0, why: 'The check-then-read shape is the whole safety of file loops: the peek never consumes, so the loop ends exactly at EOF.' }, message: 'hasNextInt() is now false: end of file. The while loop exits cleanly. That check-first shape is why file loops do not crash on short files.', mutations: [
            { type: 'extra.set', value: file(LINES, -1, 'End of file: hasNextInt() returns false, loop stops.') }
        ] },
        { line: 5, message: 'Watch the type change: text on disk, int in the program. next() would have kept it as a String; nextDouble() would parse 85 into 85.0. Mismatched types throw InputMismatchException.', mutations: [] },
        { line: 5, message: 'Tokens, not lines, are what nextInt() eats. Same four numbers on ONE line split by spaces: each nextInt() takes the next token and the cursor can sit in the middle of a line. nextLine() would instead grab the whole remainder as one String.', mutations: [
            { type: 'extra.set', value: file(['85 91 77 93'], 0, 'four tokens, one line: tokenization splits on spaces and newlines alike') }
        ] },
        { line: 5, predict: { q: 'Line 2 of the file now says ABC instead of 91. The loop is mid-file. What happens when nextInt() reaches ABC?', choices: ['It skips the word and reads 77 next', 'Returns 0 for the bad line', 'Throws InputMismatchException: the loop dies with the list half-full'], a: 2, why: 'nextInt insists on an int token. One unparsable value ends the program unless hasNextInt() guards it or you read text and parse deliberately.' }, message: 'Bad data demo: one stray word in the file. nextInt() reaches ABC, cannot parse it, and throws InputMismatchException. The loop stops dead with the list half-full. Real programs check hasNextInt() or read text and parse deliberately.', mutations: [
            { type: 'extra.set', value: file(['85', 'ABC', '77', '93'], 1, 'cursor stops on a value that will not parse') }
        ] }
    ],
    summary: {
        idea: ['On disk everything is TEXT; the parse (85 → int) happens inside nextInt(). Tokens are split by spaces AND newlines: one line can hold four tokens, one number can span reads.', 'hasNextX() before nextX() is the standard guard: peek, then consume.'],
        mistake: 'Assuming nextInt() reads a LINE, or that bad data is skipped silently. It throws, mid-loop, with partial state.',
        transfer: 'The file holds 85.0 on one line and the loop calls nextInt() with a hasNextInt() guard. What does the guard return at that token, and does the already-read part of the list survive?'
    }
};
