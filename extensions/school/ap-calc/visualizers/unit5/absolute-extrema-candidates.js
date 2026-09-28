/* 5.5 Using the Candidates Test to Determine Absolute (Global) Extrema.
   The shell only orders the three tabs. Each tab carries its own params,
   panes, steps and summary, and each one puts the candidate board above any
   picture of the curve. */

import { candidatesMode } from './abs-candidates-main.js?v=20260927-calc-57';
import { dneMode } from './abs-candidates-dne.js?v=20260927-calc-57';
import { transferMode } from './abs-candidates-transfer.js?v=20260927-calc-57';
import { challengeMode } from './abs-candidates-challenge.js?v=20260927-calc-57';

export default {
    id: 'u5-absolute-extrema-candidates',
    meta: {
        unit: 5, topic: '5.5',
        title: 'Using the Candidates Test to Determine Absolute (Global) Extrema',
        visualizerTitle: 'Absolute Extrema Candidate Board'
    },
    /* tab 1 works the curve topic 5.2 already inspected one point at a time,
       tab 2 proves the list is not the roots of the derivative, tab 3 compares
       finished candidate tables with no graph in sight, and tab 4 makes the
       student run all four steps on a function they have not met before */
    modes: [candidatesMode, dneMode, transferMode, challengeMode]
};
