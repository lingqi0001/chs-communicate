/* 5.7 Using the Second Derivative Test to Determine Extrema.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary. The test's order never flips on screen: establish
   f′(c) = 0 first, then read the sign of f″(c). When f″(c) = 0 the honest word
   is inconclusive, which is a limit on the test, not a verdict on the point.
   Concavity itself was settled in 5.6; the side-of-point reading is 5.4. */

import { secondDerivativeMainMode } from './second-derivative-main.js?v=20260927-calc-60';
import { inconclusiveMode } from './second-derivative-inconclusive.js?v=20260927-calc-60';
import { globalMode } from './second-derivative-global.js?v=20260927-calc-60';

export default {
    id: 'u5-second-derivative-test',
    meta: {
        unit: 5, topic: '5.7',
        title: 'Using the Second Derivative Test to Determine Extrema',
        visualizerTitle: 'Second Derivative Test Microscope'
    },
    /* tab 1 works f(x) = x⁴ − 2x² under a point-by-point microscope with no sign
       chart (that tool belongs to 5.4), tab 2 shows x⁴, −x⁴ and x³ handing the
       test the identical inconclusive input and three different fates, and
       tab 3 covers the CED clause the textbooks skip: one critical point of a
       continuous function on an interval carries its local conclusion globally */
    modes: [secondDerivativeMainMode, inconclusiveMode, globalMode]
};
