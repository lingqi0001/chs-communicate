/* 5.8 Sketching Graphs of Functions and Their Derivatives.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary. This topic is construction, not observation: a blank plane
   accumulates constraints layer by layer, and a sketch is judged by satisfying
   every constraint rather than by matching one artistic curve. The finished
   formula always arrives last, and the full three-graph correspondence the
   tabs deliberately leave unspoken belongs to 5.9. */

import { buildFunctionMode } from './sketch-function.js?v=20260927-calc-60';
import { sketchDerivativeMode } from './sketch-derivative.js?v=20260927-calc-60';
import { sketchChallengeMode } from './sketch-transfer.js?v=20260927-calc-60';

export default {
    id: 'u5-graph-sketch-studio',
    meta: {
        unit: 5, topic: '5.8',
        title: 'Sketching Graphs of Functions and Their Derivatives',
        visualizerTitle: 'Graph Constraint Sketch Studio'
    },
    /* tab 1 builds the skeleton of f from f′ and f″ clues only, including the
       vertical-shift lesson that f′ never fixes height, tab 2 runs the reverse
       with a draggable probe turning slopes of f into points of f′, and tab 3
       is pure transfer: verbal and tabular clues, zero formulas, judge four
       candidate sketches */
    modes: [buildFunctionMode, sketchDerivativeMode, sketchChallengeMode]
};
