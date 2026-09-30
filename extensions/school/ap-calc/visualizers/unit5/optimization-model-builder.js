/* 5.10 Introduction to Optimization Problems.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary. This topic is INTRODUCTION: model building only. The
   lesson stops at a one-variable objective function on a feasible domain and a
   value read off the graph, never differentiating or solving. The formal solve
   belongs to topic 5.11.

   tab 1 builds the objective + constraint model on a river-backed fence, tab 2
   transfers the same pipeline to an open-top box where one choice pulls height
   up and base down at once, and tab 3 is pure structure sorting across three
   different stories, including a minimum, so the shared architecture is what
   sticks. */

import { optimizationFenceMode } from './optimization-fence.js?v=20260927-calc-62';
import { optimizationBoxMode } from './optimization-box.js?v=20260927-calc-62';
import { optimizationStructureMode } from './optimization-structure.js?v=20260927-calc-62';

export default {
    id: 'u5-optimization-model-builder',
    meta: {
        unit: 5, topic: '5.10',
        title: 'Introduction to Optimization Problems',
        visualizerTitle: 'Optimization Model Builder'
    },
    modes: [optimizationFenceMode, optimizationBoxMode, optimizationStructureMode]
};
