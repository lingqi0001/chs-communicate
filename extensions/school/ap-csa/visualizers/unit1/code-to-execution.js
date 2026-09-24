export default {
    id: 'u1-code-to-execution',
    meta: { unit: 1, topic: '1.1', title: 'Introduction to Algorithms, Programming, and Compilers', visualizerTitle: 'Code to Execution Visualizer' },
    intro: 'Follow a Java program from the text you type to the output on screen.',
    code: `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hi, AP CSA!");
    }
}`,
    layout: { center: ['extra'], right: ['console'] },
    steps: [
        {
            line: 1,
            message: 'You write source code in a .java file. It is plain text for humans, not instructions a CPU can run yet.',
            mutations: [{ type: 'extra.set', value: { kind: 'pipeline', stage: 0, labels: ['Source Code', 'Compiler (javac)', 'Bytecode (.class)', 'JVM', 'Output'], subs: ['.java file you write', 'checks syntax, translates', 'platform-independent', 'loads and runs it', 'what the user sees'] } }]
        },
        {
            line: 1,
            message: 'javac, the compiler, checks the syntax and translates the whole file at once into bytecode.',
            mutations: [{ type: 'extra.set', value: { kind: 'pipeline', stage: 1, labels: ['Source Code', 'Compiler (javac)', 'Bytecode (.class)', 'JVM', 'Output'], subs: ['.java file you write', 'checks syntax, translates', 'platform-independent', 'loads and runs it', 'what the user sees'] } }]
        },
        {
            line: 1,
            message: 'The result lives in Hello.class. One compiled bytecode file runs on any machine that has a JVM.',
            mutations: [{ type: 'extra.set', value: { kind: 'pipeline', stage: 2, labels: ['Source Code', 'Compiler (javac)', 'Bytecode (.class)', 'JVM', 'Output'], subs: ['.java file you write', 'checks syntax, translates', 'platform-independent', 'loads and runs it', 'what the user sees'] } }]
        },
        {
            line: 3,
            message: 'The JVM loads the bytecode and executes it step by step, translating it into real CPU instructions.',
            mutations: [{ type: 'extra.set', value: { kind: 'pipeline', stage: 3, labels: ['Source Code', 'Compiler (javac)', 'Bytecode (.class)', 'JVM', 'Output'], subs: ['.java file you write', 'checks syntax, translates', 'platform-independent', 'loads and runs it', 'what the user sees'] } }]
        },
        {
            line: 3,
            message: 'println sends text to the console. The journey source to output is complete.',
            mutations: [
                { type: 'console.print', text: 'Hi, AP CSA!' },
                { type: 'extra.set', value: { kind: 'pipeline', stage: 4, labels: ['Source Code', 'Compiler (javac)', 'Bytecode (.class)', 'JVM', 'Output'], subs: ['.java file you write', 'checks syntax, translates', 'platform-independent', 'loads and runs it', 'what the user sees'] } }
            ]
        }
    ],
    summary: {
        idea: 'Source (.java) is compiled once by javac into platform-independent bytecode (.class). The JVM then loads that bytecode and executes it line by line to produce output.',
        mistake: 'Thinking javac runs your program. Compiling and running are two separate steps, and the .class file is bytecode for the JVM, not machine code a CPU runs directly.',
        transfer: 'The same .class runs on any machine with a JVM, because the JVM, not the file, adapts the bytecode to each platform.'
    }
};
