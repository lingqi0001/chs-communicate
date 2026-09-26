/* 1.7 Limit Strategy Router — diagnose the expression before calculating.
   The prediction IS the strategy choice. L'Hospital deliberately absent
   (it is topic 4.7 material). */

const MAP_LINES = [
    { t: 'Step 1. Always try direct substitution first.' },
    { t: 'Substitution returns a finite number. That number is the limit, and polynomials and radicals behave this way inside their domain.' },
    { t: 'Substitution returns 0/0. This form gives no limit value, so read the structure of the expression and choose a method.' },
    { t: 'Two polynomials: factor the numerator and the denominator, then cancel the shared factor.' },
    { t: 'A radical: multiply by the conjugate to expose the shared factor.' },
    { t: 'A trig term squeezed by a factor that goes to 0: use the Squeeze Theorem.' },
    { t: 'A nonzero number over 0 is not a limit value. Check the two one-sided limits and their signs.' },
    { t: 'A graph or a table is given: read the values near the target from both sides (topics 1.3 and 1.4).' }
];

export default {
    id: 'u1-strategy-router',
    meta: { unit: 1, topic: '1.7', title: 'Selecting Procedures for Determining Limits', visualizerTitle: 'Limit Strategy Router' },
    modes: [
        {
            label: 'Decision Map',
            intro: 'Every limit problem starts the same way: substitute the target value. Then let the result tell you which method to use.',
            params: {},
            panes: {
                main: [
                    {
                        kind: 'graph', title: 'Four cases drawn at x = 3', height: 300,
                        window: [-1.2, 6.2, -2.5, 7],
                        vlines: [{ x: 3, color: 'auxInk', label: 'x = 3' }],
                        curves: [
                            { fn: '3 - 0.25(x-3)^2', from: -1.2, to: 2.9, color: 'curveA', dashed: true, label: 'factor case: 3' },
                            { fn: '3 - 0.25(x-3)^2', from: 3.1, color: 'curveA', dashed: true },
                            { fn: 'x + 1', from: 3.1, color: 'curveB', label: 'conjugate case' },
                            { fn: '2x - 2', from: -1.2, to: 2.94, color: 'curveC', label: 'left side gives 4' },
                            { fn: 'x + 2.2', from: 3.06, color: 'curveC', label: 'right side gives 5.2' }
                        ],
                        points: [
                            { x: 3, y: 3, open: true, color: 'curveA', label: 'hole at 3' },
                            { x: 3, y: 4, open: true, color: 'curveC' },
                            { x: 3, y: 5.2, open: true, color: 'curveC' }
                        ]
                    },
                    { kind: 'eq', title: 'How to choose a method', lines: MAP_LINES }
                ],
                side: [
                    {
                        kind: 'note', title: 'Scope note',
                        text: 'L’Hospital’s Rule is not a Unit 1 tool. The College Board teaches it in topic 4.7. In Unit 1, use substitution, algebra, the limit laws, and one-sided reading.'
                    }
                ]
            },
            steps: [
                { message: 'Read the map from the top. Direct substitution always comes first, because it answers most limits on its own.' },
                { message: 'The middle lines match a structure to a method. A shared factor calls for factoring, and a radical calls for the conjugate.' },
                { message: 'The last lines cover data instead of symbols. When a graph or a table is given, read the values near the target from both sides.' }
            ],
            summary: {
                idea: 'Limit work starts with classification. The structure of the expression tells you which method fits.',
                mistake: 'One favorite method gets applied to every problem. Factoring does not help a radical, and a conjugate does not help a trig term that oscillates.',
                transfer: 'Take the limit of (1 − cos x)/x as x approaches 0. Which line of the map applies? Rewrite with the half-angle identity, and the fraction becomes an ordinary 0/0 case.'
            }
        },
        {
            label: 'Guided Practice',
            intro: 'For each limit, choose only the first move. Computing comes later. Deciding which method to use is the skill you are practicing.',
            params: {},
            panes: {
                main: [
                    {
                        kind: 'practice', id: 'g17', title: 'Choose the first strategy',
                        items: [
                            {
                                q: 'You want lim x→3 (x² − 2x − 3)/(x − 3), and direct substitution gives 0/0. Which move comes first?',
                                choices: ['Substitute again', 'Factor the numerator', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                                why: 'Direct substitution gives 0/0, and the numerator and the denominator are both polynomials. They share the factor (x − 3), so factoring and canceling come first.'
                            },
                            {
                                q: 'You want lim x→4 (√x − 2)/(x − 4), and direct substitution gives 0/0 with a radical on top. Which move comes first?',
                                choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Read the one-sided signs'], a: 2,
                                why: 'The 0/0 comes from the radical √x − 2 in the numerator. Multiplying by the conjugate √x + 2 clears the radical and exposes the shared factor (x − 4).'
                            },
                            {
                                q: 'You want lim x→2 (x + 1)/(x − 2). Direct substitution gives 3/0. Which move comes first?',
                                choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Analyze the two one-sided limits'], a: 3,
                                why: 'A nonzero number over 0 is not a limit value and not a 0/0 case. The factor (x − 2) changes sign at 2, so the two sides go to different infinities.'
                            },
                            {
                                q: 'You want lim x→0 x² · sin(1/x). The factor sin(1/x) oscillates, so algebra cannot settle the limit. Which move comes first?',
                                choices: ['Substitute again', 'Factor', 'Apply the Squeeze Theorem', 'Multiply by the conjugate'], a: 2,
                                why: 'The factor sin(1/x) oscillates, but it stays between −1 and 1. Multiplying by x² places the whole expression between −x² and x², and both bounds go to 0. The Squeeze Theorem applies.'
                            },
                            {
                                q: 'You want lim x→5 (2x + 1)/(x − 1). What should you do first?',
                                choices: ['Substitute directly', 'Factor', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 0,
                                why: 'Direct substitution gives 11/4, a finite number, and 5 is inside the domain. A rational function is continuous wherever it is defined, so the substitution value is the limit.'
                            }
                        ]
                    }
                ]
            },
            summary: {
                idea: 'Substitute first, then let the result decide which method to use.',
                mistake: 'A 0/0 result gets read as an answer, or as a limit that does not exist. A 0/0 form only says the substitution was not enough, so the work continues.',
                transfer: 'Take the limit of (x³ − 1)/(x² − 1) as x approaches 1. Which line of the map applies, and which factor is shared by the numerator and the denominator?'
            }
        },
        {
            label: 'Fresh Problems',
            intro: 'Three new problems. Say the method out loud before you look at the choices.',
            params: {},
            panes: {
                main: [
                    {
                        kind: 'practice', id: 'g17t', title: 'Name the method, do not calculate',
                        items: [
                            {
                                q: 'You want lim x→0 sin(3x)/x, and direct substitution gives 0/0 with a trig term. Which move comes first?',
                                choices: ['Substitute again', 'Rewrite toward (sin u)/u, which approaches 1', 'Multiply by the conjugate', 'Factor the expression'], a: 1,
                                why: 'Rewrite sin(3x)/x as 3 · (sin 3x)/(3x). As x approaches 0, the factor (sin 3x)/(3x) approaches 1, so the limit is 3. Topic 1.8 proves that fact with the Squeeze Theorem.'
                            },
                            {
                                q: 'You want lim x→−2 (x² + 5x + 6)/(x + 2), and substitution gives 0/0 with polynomials. Which move comes first?',
                                choices: ['Substitute again', 'Factor', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                                why: 'The numerator factors as (x + 2)(x + 3), so it shares the factor (x + 2) with the denominator. Cancel that factor, then substitute.'
                            },
                            {
                                q: 'A table of values gives x just above 1 for lim x→1⁺ ln x/(x − 1). Which move comes first?',
                                choices: ['Substitute to get the answer', 'Read the trend of the values near 1', 'Multiply by the conjugate', 'Apply the Squeeze Theorem'], a: 1,
                                why: 'The data is a table, so read the trend of the numbers. This limit is one-sided at x = 1, so use the values just above 1. Topic 1.4 teaches that reading.'
                            }
                        ]
                    }
                ]
            },
            summary: {
                idea: 'Naming the method before calculating works on every limit, including limits you have never seen.',
                mistake: 'A problem that looks new stops the work. New problems reuse the same few cases.',
                transfer: 'Now compute the three limits you just classified. Use the algebra methods from topic 1.6. What value does each method produce?'
            }
        }
    ]
};
