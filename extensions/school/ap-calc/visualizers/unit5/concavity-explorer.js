/* 5.6 Determining Concavity of Functions over Their Domains.
   The shell only orders the three tabs. Each tab carries its own params, panes,
   steps and summary. The chain this topic teaches is
   f″ sign → trend of f′ → concavity of f, and the door stays locked on the
   evidence side: f″(c) = 0 is only a place worth checking, the change in
   concavity is the proof. Classifying a point as a max or min is topic 5.7,
   and the full f / f′ / f″ correspondence network is topic 5.9. */

import { concavitySlopeMode } from './concavity-slope.js?v=20260927-calc-60';
import { concavityNoChangeMode } from './concavity-no-change.js?v=20260927-calc-60';
import { concavityTransferMode } from './concavity-transfer.js?v=20260927-calc-60';

export default {
    id: 'u5-concavity-explorer',
    meta: {
        unit: 5, topic: '5.6',
        title: 'Determining Concavity of Functions over Their Domains',
        visualizerTitle: 'Concavity and Slope Trend Explorer'
    },
    /* tab 1 builds concavity from the trend of f′ on f(x) = x³ + x, which stays
       increasing the whole time so slope sign and bend sign visibly separate,
       tab 2 breaks the shortcut f″ = 0 ⇒ inflection on x⁴, and tab 3 judges
       concavity from an f′ graph and an f″ table with no graph of f in sight */
    modes: [concavitySlopeMode, concavityNoChangeMode, concavityTransferMode]
};
