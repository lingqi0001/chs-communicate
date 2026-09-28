/* 5.3 Determining Intervals on Which a Function Is Increasing or Decreasing.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary, and each one keeps the sign of f′ as the thing being read:
   tab 1 builds the sign chart, tab 2 shows a zero that changes nothing, and tab 3
   asks for the intervals with no graph of f in sight. */

import { monotonicityMainMode } from './monotonicity-main.js?v=20260927-calc-57';
import { monotonicityStationaryMode } from './monotonicity-stationary.js?v=20260927-calc-57';
import { monotonicityTransferMode } from './monotonicity-transfer.js?v=20260927-calc-57';

export default {
    id: 'u5-monotonicity-sign-chart',
    meta: {
        unit: 5, topic: '5.3',
        title: 'Determining Intervals on Which a Function Is Increasing or Decreasing',
        visualizerTitle: 'Monotonicity Sign Chart'
    },
    modes: [monotonicityMainMode, monotonicityStationaryMode, monotonicityTransferMode]
};
