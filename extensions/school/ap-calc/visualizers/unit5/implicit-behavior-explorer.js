/* 5.12 Exploring Behaviors of Implicit Relations. The shell only orders the
   three tabs. Each tab carries its own params, panes, steps and summary. This is
   the last official topic of unit 5, and it is the reading the unit has been
   building toward: critical points from 5.2, increasing and decreasing from 5.3,
   the First Derivative Test from 5.4, local extrema from 5.7 and concavity from
   5.6, all of it now pointed at a relation that is never solved into one y = f(x).

   tab 1 works the hero relation x² + y² = 25 branch by branch, and every slope
   claim names a point, with the two points at x = 3 carrying opposite slopes and
   the four special points ending on one critical-point board; tab 2 differentiates
   that relation a second time, keeps y and y′ inside y″, reads the two halves of
   the circle apart by the sign of y³, and hands off to the second relation; tab 3
   analyzes x² + xy + y² = 7 from a given derivative, pairing each part of dy/dx
   with the relation to place the horizontal and vertical tangents before reading
   one local branch at (1, 2).

   Topic 3.2 is not repeated here. It produced the derivatives, and all three tabs
   start from them. */

import { circleBehaviorMode } from './implicit-circle-behavior.js?v=20260927-calc-62';
import { secondDerivativeMode } from './implicit-second-derivative.js?v=20260927-calc-62';
import { implicitTransferMode } from './implicit-transfer.js?v=20260927-calc-62';

export default {
    id: 'u5-implicit-behavior',
    meta: {
        unit: 5, topic: '5.12',
        title: 'Exploring Behaviors of Implicit Relations',
        visualizerTitle: 'Implicit Relation Behavior Explorer'
    },
    modes: [circleBehaviorMode, secondDerivativeMode, implicitTransferMode]
};
