const REGIONS = [
    { key: 'line', label: 'Line comment', from: 1, to: 1 },
    { key: 'javadoc', label: 'Javadoc', from: 2, to: 5 },
    { key: 'pre', label: 'Precondition', from: 3, to: 3 },
    { key: 'post', label: 'Postcondition', from: 4, to: 4 },
    { key: 'code', label: 'The code', from: 6, to: 9 },
    { key: 'block', label: 'Block comment', from: 10, to: 12 }
];

function anat(active, desc) {
    return { kind: 'anatomy', regions: REGIONS, active, desc };
}

export default {
    id: 'u1-documentation',
    meta: { unit: 1, topic: '1.8', title: 'Documentation with Comments', visualizerTitle: 'Comments & Contract Visualizer' },
    intro: 'Comments are for two readers: the human, and the documentation tool. The compiler reads none of it.',
    code: `// Computes the area of a square with positive side n.
/**
 * Precondition: n > 0
 * Postcondition: returns n * n
 */
public static int square(int n)
{
    return n * n;   // the documented promise
}
/* Block comments can span
   several lines. The compiler
   skips all of it. */`,
    layout: { center: ['extra'], right: ['expression'] },
    steps: [
        { line: 1, message: 'Double slash makes the rest of the line invisible to javac. Humans see it, the compiler does not: comments change nothing about execution.', mutations: [
            { type: 'extra.set', value: anat('line', '// runs from the slashes to the end of the line.') }
        ] },
        { line: 10, message: 'Slash-star covers as many lines as needed, ending at star-slash. Both forms are simply skipped: delete every comment and the program still runs identically.', mutations: [
            { type: 'extra.set', value: anat('block', '/* ... */ hides whole regions of text.') }
        ] },
        { line: 2, message: 'The double-star form is special: /** */ is a Javadoc comment. Documentation tools read it and generate the class\'s web page, the same API document from 1.7.', mutations: [
            { type: 'extra.set', value: anat('javadoc', '/** */ : not just a comment, a publishable contract.') }
        ] },
        { line: 3, message: 'Precondition: what the CALLER promises before the call. Here n must be positive. Break it and the method promises nothing back.', mutations: [
            { type: 'extra.set', value: anat('pre', 'Precondition binds the caller.') }
        ], predict: { q: 'A caller runs square(-3). Can the method be expected to behave as specified?', choices: ['No: the precondition is violated, nothing is promised', 'Yes: minus three squared is still 9', 'It must throw an error'], a: 0, why: 'The contract only covers calls that satisfy the precondition. With n = -3 the method may work, may fail, or may do anything: the specification is silent. AP reads it exactly this way.' } },
        { line: 4, message: 'Postcondition: what the METHOD promises once it returns, given the precondition held. Here: the returned value is n * n.', mutations: [
            { type: 'extra.set', value: anat('post', 'Postcondition binds the method.') }
        ], predict: { q: 'square(4) is called and the precondition holds. What is guaranteed?', choices: ['The returned value is 16', '16 is printed to the screen', 'The caller\'s argument becomes 16'], a: 0, why: 'returns n * n is the promise: the value goes back to the caller as the call\'s value. Printing is not returning, and arguments are copied in, never written back.' } },
        { line: 6, message: 'The code itself is the part comments must NOT repeat. return n * n; // returns n * n is noise; // area of a square, assumes n > 0 is documentation.', mutations: [
            { type: 'extra.set', value: anat('code', 'Comment the why and the contract, never the what.') }
        ] }
    ],
    summary: {
        idea: 'Three comment forms: // for one line, /* */ for blocks, /** */ for Javadoc; the compiler ignores all of them. Preconditions bind the caller, postconditions bind the method, and Javadoc publishes the pair as the API document.',
        mistake: 'Treating a broken precondition as "the method should still work," or writing comments that restate the code line by line instead of stating purpose and promises.',
        transfer: 'A spec card says: setAverage, Precondition: list is not empty. Calling it on an empty list has no promised result; the safe caller checks isEmpty() first, exactly like checking n > 0 before square.'
    }
};
