/* 5.11 Solving Optimization Problems. The shell only orders the three tabs.
   Each tab carries its own params, panes, steps and summary. This topic is the
   formal solver downstream of topic 5.10: both worked models arrive exactly as
   5.10 built them, and no modeling is re-taught.

   tab 1 runs the full procedure on the river fence, A(x) = x(40 − 2x) on
   [0, 20], from derivative to the contextual sentence 10 m by 20 m with
   maximum area 200 m²; tab 2 works the 8.5 by 11 open-top box and lives on one
   habit: V′(x) = 0 returns x ≈ 1.585 and x ≈ 4.915, and the feasible domain
   0 ≤ x ≤ 4.25 keeps one and rejects the other; tab 3 trains the official
   emphasis of 5.11, reading finished optimization outputs back into their
   contexts, including a minimum, the mistake audit and the justification
   ladder. */

import { optimizationSolveFenceMode } from './optimization-solve-fence.js?v=20260927-calc-62';
import { optimizationSolveBoxMode } from './optimization-solve-box.js?v=20260927-calc-62';
import { optimizationInterpretationMode } from './optimization-interpretation.js?v=20260927-calc-62';

export default {
    id: 'u5-optimization-solver',
    meta: {
        unit: 5, topic: '5.11',
        title: 'Solving Optimization Problems',
        visualizerTitle: 'Optimization Solver Lab'
    },
    modes: [optimizationSolveFenceMode, optimizationSolveBoxMode, optimizationInterpretationMode]
};
