/* 5.9 Connecting a Function, Its First Derivative, and Its Second Derivative.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary.

   Topic boundary kept on purpose:
     5.8 = "Given derivative information, construct or choose a valid sketch."
     5.9 = "Given several related representations, identify the matching features
            of f, f′ and f″." So this topic never asks for a sketch. Its hero is
     a shared x-coordinate read across three graphs that line up in x but keep
     their own y-scales, and the new idea beyond 5.3, 5.4 and 5.6 is that a
     height on f″ is the slope of f′, one level above the f′-is-slope-of-f link.

   tab 1 runs one shared draggable x through the stacked f, f′ and f″ panels of
   f(x) = x³ − 3x, tab 2 fills a landmark board that names what each of x = −1,
   0, 1 is on every graph, and tab 3 is transfer: three unlabeled trig graphs to
   match to f, f′ and f″ from slopes, zeros and signs alone. */

import { linkerMainMode } from './linker-main.js?v=20260927-calc-61';
import { linkerLandmarksMode } from './linker-landmarks.js?v=20260927-calc-61';
import { linkerTransferMode } from './linker-transfer.js?v=20260927-calc-61';

export default {
    id: 'u5-function-derivative-linker',
    meta: {
        unit: 5, topic: '5.9',
        title: 'Connecting a Function, Its First Derivative, and Its Second Derivative',
        visualizerTitle: 'f–f′–f″ Linker'
    },
    modes: [linkerMainMode, linkerLandmarksMode, linkerTransferMode]
};
