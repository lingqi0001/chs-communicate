/* 5.11 Solving Optimization Problems, Mode 3: Interpret the optimum.
   The official emphasis of topic 5.11 is interpretation, so this mode hands
   over finished calculus outputs and trains the last arrow of the procedure:
   what does the mathematics mean in the original context? No new derivative
   is computed and no full algebra problem is rebuilt. Three short problems
   (the fence from mode 1, the box from mode 2, and a cost model that is a
   minimum, so optimization is never confused with maximization only), then a
   mistake audit and a local-versus-absolute check, then the reusable
   justification ladder and the 5.10 versus 5.11 boundary.

   All four-option multiple choice runs through step predict objects, because
   the compare renderer only draws two columns. Conclusions accumulate on one
   card instead of stacking one card per problem, and each problem card retires
   when its conclusion line lands. Every rounded number prints behind ≈, every
   input variable stays separate from its objective value, and units are
   attached to each quantity. */

const dsp3 = (v) => {
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};

/* the box numbers, same three decimals as mode 2 */
const X1 = dsp3((78 - Math.sqrt(1596)) / 24);   // '1.585'
const V1 = '66.148';

export const optimizationInterpretationMode = {
    label: 'Interpret the optimum',
    intro: 'The algebra in topic 5.11 always ends with numbers, and the question an AP free-response actually asks is what those numbers mean. This mode hands you finished optimization outputs and asks nothing but interpretation. One sentence decides whether a reader learns the optimal input, the extreme value and the units, or only a bare critical number.',
    params: { stage: 0 },
    controls: [],
    panes: {
        main: [
            {
                kind: 'eq', title: 'Problem A, the fence on [0, 20]',
                when: (env) => env.stage >= 1 && env.stage < 3,
                lines: [
                    { t: 'FINISHED CALCULUS OUTPUT, no work shown.' },
                    { t: 'The interior critical number is x = 10, and the constraint gives y = 40 − 2(10) = 20.' },
                    { t: 'The comparison on [0, 20] gave A(0) = 0, A(10) = 200 and A(20) = 0.', hl: true },
                    { t: 'Question: which sentence is the complete optimization conclusion?' }
                ]
            },
            {
                kind: 'eq', title: 'Problem B, the box on [0, 4.25]',
                when: (env) => env.stage >= 2 && env.stage < 4,
                lines: [
                    { t: 'FINISHED CALCULUS OUTPUT, no work shown.' },
                    { t: 'The feasible solution of V′(x) = 0 is x ≈ ' + X1 + '.' },
                    { t: 'The candidate comparison gave V ≈ ' + V1 + ' in³ there.', hl: true },
                    { t: 'The two numbers ' + X1 + ' and ' + V1 + ' mean different things. Which is which?' }
                ]
            },
            {
                kind: 'eq', title: 'Problem C, a cost model, minimized',
                when: (env) => env.stage >= 3 && env.stage < 5,
                lines: [
                    { t: 'FINISHED CALCULUS OUTPUT, no work shown.' },
                    { t: 'C(w) is a modeled cost in dollars, on a feasible domain of width w in meters.' },
                    { t: 'The absolute minimum on the feasible domain occurs at w = 6, with C(6) = 420.', hl: true },
                    { t: 'Question: what does this sentence state about the situation?' }
                ]
            },
            {
                kind: 'checklist', title: 'Justification ladder, a complete optimization solution',
                when: (env) => env.stage >= 4,
                items: [
                    { t: 'What variable value is optimal?', state: 'pass' },
                    { t: 'What quantity is actually maximized or minimized?', state: 'pass' },
                    { t: 'What is that extreme value?', state: 'pass' },
                    { t: 'What are the units of each number?', state: 'pass' },
                    { t: 'Does the value belong to the feasible context?', state: 'pass' },
                    { t: 'Why is it absolute rather than merely local?', state: 'pass' }
                ],
                verdictOk: true,
                verdict: 'Six questions, six ticks. An optimization answer that leaves any of them unchecked is a number, not a solution.'
            },
            {
                kind: 'machine', title: 'Where interpretation sits in the procedure',
                when: (env) => env.stage >= 6,
                focus: () => 6,
                stages: () => [
                    { box: 'Model ready' }, { box: 'Differentiate' }, { box: 'Interior critical numbers' },
                    { box: 'Feasible candidates' }, { box: 'Endpoints' }, { box: 'Compare and justify' },
                    { box: 'Answer in context' }
                ]
            }
        ],
        side: [
            {
                kind: 'compare', title: 'Topic 5.10 built, topic 5.11 solves',
                when: (env) => env.stage >= 1 && env.stage < 2,
                sides: () => [
                    {
                        title: 'Topic 5.10, modeling',
                        lines: [
                            'Story becomes an objective.',
                            'A constraint removes one variable.',
                            'A feasible domain closes the interval.'
                        ]
                    },
                    {
                        title: 'Topic 5.11, solving',
                        lines: [
                            'A derivative finds interior candidates.',
                            'Feasibility filters, endpoints are added.',
                            'A comparison justifies, context restates.'
                        ]
                    }
                ],
                verdict: 'Nothing in this mode rebuilds a model. Every problem arrives solved, and the work is reading the result back into the situation.'
            },
            {
                kind: 'eq', title: 'Conclusions so far',
                when: (env) => env.stage >= 2,
                lines: (env) => {
                    const L = [];
                    if (env.stage >= 2) L.push({ t: 'A. The region has maximum area 200 m² when the two perpendicular sides are 10 m each and the side parallel to the river is 20 m.', color: 'accent' });
                    if (env.stage >= 3) L.push({ t: 'B. The cut size ≈ ' + X1 + ' in is the optimizing input and the box height. V ≈ ' + V1 + ' in³ is the objective value, the maximum volume.', color: 'accent' });
                    if (env.stage >= 4) L.push({ t: 'C. Choosing w = 6 m produces the least modeled cost, $420. A minimum is as much an optimum as a maximum.', color: 'accent' });
                    if (env.stage >= 5) L.push({ t: 'Read every line against the justification ladder. Each quantity keeps its own kind and its own unit.' });
                    return L;
                }
            },
            {
                kind: 'compare', title: 'Four ways the answer goes wrong',
                when: (env) => env.stage >= 5 && env.stage < 7,
                sides: () => [
                    {
                        title: 'Stops at the algebra',
                        lines: [
                            'V′(x) = 0, therefore x is the answer.',
                            'x ≈ ' + X1 + ', therefore the maximum volume is ' + X1 + '.',
                            'Use every algebraic root of the derivative.',
                            'The graph appears to peak there, so the answer is proved.'
                        ]
                    },
                    {
                        title: 'Finishes the optimization',
                        lines: [
                            'V′(x) = 0 gives a possible interior candidate, then check feasibility, compare candidates and interpret.',
                            'x ≈ ' + X1 + ' in is the optimizing input, and V(' + X1 + ') ≈ ' + V1 + ' in³ is the maximum objective value.',
                            'Only roots inside the feasible domain belong to the contextual model.',
                            'The graph can support intuition, and the derivative and candidate argument supplies the mathematical justification.'
                        ]
                    }
                ],
                verdict: 'Each left sentence stops at one number. Each right sentence carries the input, the value, the units and the reason, in the words of the original problem.'
            },
            {
                kind: 'note', title: 'Absolute needs evidence',
                when: (env) => env.stage >= 6,
                text: 'A critical point is where a derivative goes flat or stops existing, and nothing else. Local classification comes from sign tests in topics 5.4 and 5.7. Absoluteness comes from the Candidates Test on a closed interval, topic 5.5. Problem C wrote absolute minimum without showing that comparison, and on a free response the evidence belongs in the answer.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            message: 'Three finished calculus outputs arrive on the boards: the fence result from mode 1, the box result from mode 2, and a cost model you have never seen. None of them needs another derivative. Your work is the last arrow of the procedure, reading each result back into its situation.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'Problem A, the fence. Which is the complete optimization conclusion?',
                choices: [
                    'The rectangular region has maximum area 200 m² when the two perpendicular sides are 10 m each and the side parallel to the river is 20 m.',
                    'The maximum is 10.',
                    'The maximum area is 10 m².',
                    'The dimensions are 200 m by 10 m.'
                ], a: 0,
                whyBy: [
                    'The input, both dimensions and the extreme value are all named, each with the right kind of unit. x = 10 m is a perpendicular side, the constraint gives y = 20 m along the river, and A(10) = 200 m² is the area between them.',
                    'A bare 10 is the critical number, an input with no unit, no dimensions and no extreme value. Nothing here would let a reader reconstruct the region.',
                    'This pastes the input onto the objective. The maximum area is 200 m², and 10 m² is neither a number in the output nor an area the fence can enclose at x = 10.',
                    'That swaps the maximum area 200 into a length. The dimensions are 10 m by 20 m, and 200 m is the area value 200 m² with the wrong unit attached.'
                ]
            },
            message: 'Conclusion A is on the Conclusions so far card. The complete sentence told the reader the shape, both dimensions, the extreme value and the units, and it spent no words on differentiation.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'Problem B, the box. The output gives x ≈ ' + X1 + ' and V ≈ ' + V1 + ' in³. What do these two numbers mean?',
                choices: [
                    '' + X1 + ' is the cut size in inches, which becomes the box height, and ' + V1 + ' is the maximum volume in cubic inches.',
                    '' + X1 + ' is the maximum volume in inches, and ' + V1 + ' is the height in cubic inches.',
                    'Both numbers are volumes in cubic inches, measured two ways.',
                    '' + X1 + ' is the height in inches, and ' + V1 + ' is the surface area in square inches.'
                ], a: 0,
                whyBy: [
                    'x is the choice the model made, an input length in inches, and folding sets the height equal to it. V is the objective, and a volume is measured in cubic inches. One number is the input, the other is the value the input produced.',
                    'This trades the two roles and their units. A volume cannot be ' + X1 + ' inches, and a height cannot be cubic inches.',
                    'The two numbers are different kinds of quantities. x is a length chosen by the model, and V is the volume that choice produced.',
                    '' + X1 + ' as the height is right, but V is the volume, not the surface area, and its unit is cubic inches.'
                ]
            },
            message: 'Conclusion B is on the card. The variable versus objective-value distinction is the single most common scoring issue in an optimization free-response, and the units expose it instantly.'
        },
        {
            params: { stage: 4 },
            predict: {
                q: 'Problem C, the cost model. The absolute minimum of C on the feasible domain occurs at w = 6 with C(6) = 420. What does this mean?',
                choices: [
                    'Choosing w = 6 produces the minimum modeled cost, $420.',
                    'Choosing w = 6 produces the maximum modeled cost, $420.',
                    'The cost grows without bound, so $420 is only a local dip.',
                    'w = 6 is the minimum cost in dollars.'
                ], a: 0,
                whyBy: [
                    'An absolute minimum on the feasible domain means no other allowed choice of w costs less. The input is w = 6 and the objective value is C(6) = $420, so $420 is the least cost the model can produce.',
                    'The output says minimum, not maximum. Optimization problems ask for both, and the direction is set by the story, not by the word optimum.',
                    'The output claims the absolute minimum on the feasible domain, which is a completed comparison over the candidate list, not a local observation. Nothing on the board suggests unbounded growth.',
                    'That attaches the objective value to the input. w = 6 is the width chosen, and $420 is the cost it produces.'
                ]
            },
            message: 'Conclusion C is on the card, and the justification ladder is on screen with it. Minima are optimizing problems too, and the sentence shape is the same: the optimal input, the quantity optimized, the extreme value, and the units of each.'
        },
        {
            params: { stage: 5 },
            predict: {
                q: 'Mistake check. A student writes: solving V′(x) = 0 gives x ≈ ' + X1 + ', so the maximum volume is ' + X1 + '. Reading the justification ladder, which rungs were skipped?',
                choices: [
                    'The value rung, because V(' + X1 + ') ≈ ' + V1 + ' in³ is the maximum volume and ' + X1 + ' is only the input. The units rung too, since inches and cubic inches were merged.',
                    'Only the units rung. The number ' + X1 + ' really is the maximum volume, and it just needs the right unit attached.',
                    'None. Solving V′(x) = 0 for a feasible x finishes the problem.',
                    'The feasibility rung. x ≈ ' + X1 + ' is not a feasible cut size.'
                ], a: 0,
                whyBy: [
                    'The input and the objective value are two different numbers, and the student reported the input as if it were the value. Checking the units exposes it at once: a volume is never measured in inches.',
                    'The number itself is wrong, not just its label. The maximum volume is V(' + X1 + ') ≈ ' + V1 + ' in³, and ' + X1 + ' in is the cut size.',
                    'A feasible critical number is a candidate. Without evaluating the objective and comparing candidates, the maximum value has not been found, only a place to look.',
                    'x ≈ ' + X1 + ' lies inside 0 ≤ x ≤ 4.25, so feasibility passed. The failure is in the next rungs, stating the value and its units.'
                ]
            },
            message: 'The four ways the answer goes wrong panel is on screen now. Each left sentence stops at one number, and each right sentence carries the input, the value, the units and the reason. The units expose the merged-quantity mistake at once: a volume is never measured in inches.'
        },
        {
            params: { stage: 6 },
            predict: {
                q: 'Problem C claims an absolute minimum at w = 6. Which evidence supports an absolute claim rather than a local one?',
                choices: [
                    'C was compared at every candidate of the closed feasible domain, endpoints and interior critical numbers included, and w = 6 gave the least value.',
                    'C′(6) = 0, so w = 6 is a critical number.',
                    'C″(6) > 0, so the graph is concave up at w = 6.',
                    'The plotted curve looks lowest near w = 6.'
                ], a: 0,
                whyBy: [
                    'Absoluteness over a domain comes from the Candidates Test comparison on that domain, topic 5.5. The least candidate value is the absolute minimum value.',
                    'A critical number is a candidate. The equation C′(6) = 0 cannot see endpoints, and an absolute extremum on a closed domain can sit at one.',
                    'The Second Derivative Test classifies the point as a local minimum. It does not compare the whole feasible domain, and it does not rule out a lower endpoint value.',
                    'A picture can support intuition, and a short list of plotted samples can miss a lower point elsewhere. The mathematical justification is the candidate comparison.'
                ]
            },
            message: 'Read the two claims apart. Sign tests from topics 5.4 and 5.7 classify a critical point locally, and only the closed-domain candidate comparison from topic 5.5 earns the word absolute. The Absolute needs evidence card keeps that split in view, and the line for Problem C on the Conclusions so far card shows the finished sentence.'
        },
        {
            params: { stage: 7 },
            message: 'The procedure ends where this whole mode lives, at answer in context. Carry the ladder into any optimization problem: filter the candidates, compare the values, then write the input, the quantity, the extreme value and the units back into the story.'
        }
    ],
    summary: {
        idea: 'Solving an optimization problem is not finished at f′(x) = 0. Critical numbers are candidates, the feasible domain filters them, the closed-interval comparison decides which candidate holds the absolute extremum, and the answer is the translation of that result into the quantities and units of the original situation, whether the story asked for a maximum or a minimum.',
        mistake: 'The critical number is usually the optimizing input, not the extreme value itself, and a sentence like the maximum volume is 1.585 has merged an inches quantity with a cubic-inches quantity. A derivative root outside the feasible domain is not a physical solution, and a local test is not an absolute comparison.',
        transfer: 'Take any finished optimization output and answer four questions before you write: which number is the input, which is the objective value, what are the units of each, and what evidence made the result absolute on the feasible domain?'
    }
};

export default optimizationInterpretationMode;
