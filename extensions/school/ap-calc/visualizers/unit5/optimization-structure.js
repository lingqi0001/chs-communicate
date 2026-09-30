/* 5.10 Introduction to Optimization Problems, Mode 3: Same structure, different story.
   Structure-sorting practice: three unrelated contexts that all reduce to the
   same architecture (objective + constraint + domain, then one variable). No
   graphs and no derivative work here. The point is to recognize the shared
   structure, including a minimum-objective story (the cylinder), and to name
   the mistakes that come from confusing the objective with the constraint.
*/

export const optimizationStructureMode = {
    label: 'Same structure, different story',
    intro: 'Three optimization stories that look nothing alike. Sort each one into the same two or three questions: what quantity is being optimized, and what is fixed or limited? Once they are sorted, the shared structure underneath becomes hard to miss.',
    params: { stage: 0 },
    controls: [],
    compute: (env) => {
        const st = env.stage;
        return {
            aDone: st >= 1, bDone: st >= 2, cDone: st >= 3,
            table: st >= 4, mistakes: st >= 5, relations: st >= 6
        };
    },
    panes: {
        main: [
            {
                kind: 'eq', title: 'Three optimization stories',
                lines: [
                    { t: 'A. Fencing. 40 m of fence, river on one side, enclose the largest rectangular area.' },
                    { t: 'B. Open-top box. Cut squares from an 8.5 by 11 sheet, fold up the largest box.' },
                    { t: 'C. Minimum material. A cylindrical container must hold a fixed volume, using as little material as possible.' }
                ]
            },
            {
                kind: 'table', title: 'The structure table',
                when: (env) => env.table,
                cols: ['Context', 'Optimize', 'Constraint', 'Goal'],
                rows: [
                    ['Fence', 'area', 'fixed fencing', 'maximum'],
                    ['Box', 'volume', 'fixed sheet dimensions', 'maximum'],
                    ['Container', 'surface area', 'fixed volume', 'minimum']
                ],
                note: 'Different stories, same columns. Each row asks for one quantity to optimize and names the one thing that is fixed.'
            },
            {
                kind: 'eq', title: 'One architecture under all three',
                when: (env) => env.table,
                lines: [
                    { t: 'different story', dim: true },
                    { t: '↓ same mathematical architecture' },
                    { t: 'objective + constraint + domain' },
                    { t: '↓ reduce with the constraint' },
                    { t: 'one-variable function', hl: true }
                ]
            },
            {
                kind: 'eq', title: 'How 5.5, 5.10 and 5.11 fit together',
                when: (env) => env.relations,
                lines: [
                    { t: '5.5: given a function, compare candidates for absolute extrema.' },
                    { t: '5.10: the hard part is often building that function from a context first.', hl: true },
                    { t: '5.11: use calculus to solve the resulting optimization model and interpret the result.' }
                ]
            }
        ],
        side: [
            {
                kind: 'eq', title: 'What you sorted',
                when: (env) => env.aDone,
                lines: (env) => {
                    const L = [];
                    if (env.aDone) L.push({ t: 'A Fence. OBJECTIVE: the area, to maximize. CONSTRAINT: the 40 m of fencing.' });
                    if (env.bDone) L.push({ t: 'B Box. OBJECTIVE: the volume, to maximize. CONSTRAINT: the fixed 8.5 by 11 sheet.' });
                    if (env.cDone) L.push({ t: 'C Container. OBJECTIVE: the surface area, to minimize. CONSTRAINT: the fixed volume.' });
                    return L;
                }
            },
            {
                kind: 'compare', title: 'Common mistakes',
                when: (env) => env.mistakes,
                sides: () => [
                    {
                        title: 'Wrong idea', tone: 'wrong',
                        lines: [
                            'The constraint is what we maximize.',
                            'A formula with two variables is ready to differentiate.',
                            'Every algebraic x-value is physically allowed.',
                            'The largest x gives the maximum objective.'
                        ]
                    },
                    {
                        title: 'Correct', tone: 'right',
                        lines: [
                            'The constraint limits the choices. The objective is what we optimize.',
                            'Use the constraint to rewrite the objective in one independent variable first.',
                            'The context determines the feasible domain.',
                            'Optimization compares the objective value, not the size of the input variable.'
                        ]
                    }
                ],
                verdict: 'In every story the objective is the quantity optimized and the constraint is the limit on the choices. Mixing those two is the root mistake this topic guards against.'
            },
            {
                kind: 'machine', title: 'The optimization pipeline',
                when: (env) => env.relations,
                focus: 4,
                stages: () => [
                    { box: 'Context' }, { box: 'Objective' }, { box: 'Constraint' },
                    { box: 'One-variable objective' }, { box: 'Domain' }, { box: 'Ready for calculus' }
                ]
            },
            {
                kind: 'note', title: 'Where this introduction stops',
                when: (env) => env.relations,
                text: 'None of these three stories was solved by differentiating. The goal of topic 5.10 was to build each model: objective, constraint, one-variable function, and feasible domain. Now that each model is one variable, derivative tools can locate and justify the optimum. Topic 5.11 performs that process.'
            }
        ]
    },
    steps: [
        {
            params: { stage: 1 },
            predict: {
                q: 'In the fencing story, what is the objective and what is the constraint?',
                choices: [
                    'Objective: the area, to maximize. Constraint: the 40 m of fencing.',
                    'Objective: the 40 m of fencing, to maximize. Constraint: the area.',
                    'Objective: the side x. Constraint: the river.'
                ], a: 0,
                whyBy: [
                    'The area is what we want as large as possible, and the 40 m of fencing is what limits the choices. Objective, then constraint.',
                    'This flips the two roles. The fencing is fixed at 40 m and cannot be maximized; it is the limit. The area is the quantity being optimized.',
                    'x is the free choice on the slider, not the goal, and the river is a feature of the setup, not a bound on a quantity. The goal is area and the bound is the fencing.'
                ]
            },
            message: 'Story A sorted: objective is area (maximum), constraint is the fixed fencing.'
        },
        {
            params: { stage: 2 },
            predict: {
                q: 'In the open-top box story, what is being optimized and what limits the choices?',
                choices: [
                    'Objective: the box volume, to maximize. Constraint: the fixed 8.5 by 11 sheet dimensions.',
                    'Objective: the cut size x, to maximize. Constraint: the volume.',
                    'Objective: the surface area of the sheet, to maximize. Constraint: none.'
                ], a: 0,
                whyBy: [
                    'The biggest box means the most volume, and the only thing holding the box back is that the sheet is fixed at 8.5 by 11. That fixed sheet is the constraint.',
                    'x is the choice variable, not the goal. We maximize the volume that a choice of x produces, and the sheet size is what bounds x.',
                    'The sheet area is fixed, so it is not the objective, and there is a clear limit, the sheet size. Volume is the goal.'
                ]
            },
            message: 'Story B sorted: objective is volume (maximum), constraint is the fixed sheet dimensions. Notice it rhymes with story A: one quantity to grow, one fixed thing that limits it.'
        },
        {
            params: { stage: 3 },
            predict: {
                q: 'A cylindrical container must hold a fixed volume, using as little material as possible. What is the objective?',
                choices: [
                    'Objective: the surface area of the container, to minimize. Constraint: the fixed volume.',
                    'Objective: the volume, to maximize. Constraint: the surface area.',
                    'Objective: the radius, to minimize. Constraint: none.'
                ], a: 0,
                whyBy: [
                    'Material is the surface of the can, so the objective is surface area, and this time we minimize it. The volume the can must hold is fixed, so that fixed volume is the constraint.',
                    'The volume is the fixed requirement, not the goal. We are minimizing material, which is surface area.',
                    'The radius is just one variable in the shape. The quantity to minimize is the material, which is surface area, and the fixed volume does act as a constraint.'
                ]
            },
            message: 'Story C sorted, and it is the important twist: the objective is a minimum, not a maximum. Material (surface area) is minimized while the volume is held fixed. Same architecture, opposite direction.'
        },
        {
            params: { stage: 4 },
            message: 'The structure table now holds all three rows. Fence maximizes area under fixed fencing, box maximizes volume under a fixed sheet, container minimizes surface area under a fixed volume. Same three columns, one maximum-flavored pair and one minimum-flavored pair.'
        },
        {
            params: { stage: 5 },
            message: 'The mistakes panel lines up the four confusions against the four corrections. The first one is the heart of this topic: the constraint limits the choices, and the objective is what we optimize. The fourth connects back to topic 5.5, where extrema are compared by function value, never by how large the input looks.'
        },
        {
            params: { stage: 6 },
            message: 'Different stories, one architecture. Each reduces to objective plus constraint plus domain, then a one-variable function. Topic 5.5 compares candidates on a function you already have, topic 5.10 builds that function from a context, and topic 5.11 uses calculus to solve the model and interpret it.'
        }
    ],
    summary: {
        idea: 'Optimization begins by translating a context into mathematics: identify the quantity to maximize or minimize (the objective), identify what is fixed or limited (the constraint), use the constraint to rewrite the objective as a one-variable function, and restrict it to the values that make sense (the feasible domain). The same architecture appears across very different stories, and the objective can be a minimum.',
        mistake: 'Do not confuse the objective with the constraint, and do not differentiate a two-variable formula before using the constraint to reduce the problem. Do not assume every algebraic value is allowed, and do not equate the largest input with the largest objective value.',
        transfer: 'When a new optimization story appears, ask the same questions first: What quantity is being optimized? What is fixed? Which variable represents the choices? What is the feasible domain?'
    }
};

export default optimizationStructureMode;
