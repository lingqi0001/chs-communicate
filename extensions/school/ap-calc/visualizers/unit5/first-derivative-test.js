/* 5.4 Using the First Derivative Test to Determine Relative (Local) Extrema.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary. Topic 5.3 read the sign on an interval; here the question is
   what happens when one critical point is crossed from left to right, and the
   classifications stay local on purpose — absolute extrema are Topic 5.5. */

import { firstDerivativeMainMode } from './first-derivative-main.js?v=20260927-calc-57';
import { firstDerivativeDneMode } from './first-derivative-dne.js?v=20260927-calc-57';
import { firstDerivativeTransferMode } from './first-derivative-transfer.js?v=20260927-calc-57';

export default {
    id: 'u5-first-derivative-test',
    meta: {
        unit: 5, topic: '5.4',
        title: 'Using the First Derivative Test to Determine Relative (Local) Extrema',
        visualizerTitle: 'First Derivative Test Lab'
    },
    modes: [firstDerivativeMainMode, firstDerivativeDneMode, firstDerivativeTransferMode]
};
