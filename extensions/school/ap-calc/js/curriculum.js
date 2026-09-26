// AP Calculus AB + BC curriculum map, following the College Board AP Calculus
// Course and Exam Description (Effective Fall 2025, with the Fall 2026 minor
// clarifications; course content unchanged). ONE master tree: 10 units,
// 111 topics. Each topic carries `courses` so the shell can filter AB vs BC:
//   - Units 1-8 are AB + BC, except the BC-only topics 6.11, 6.12, 6.13,
//     7.5, 7.9 and 8.13.
//   - Units 9 and 10 are entirely BC-only.
// `planned` + `vtype` name the future visualizer; `module` stays absent until
// a visualizer file actually exists under visualizers/unit-N/.
window.CALC_CURRICULUM = [
    {
        num: 1,
        name: 'Limits and Continuity',
        courses: ['AB', 'BC'],
        topics: [
            { id: '1.1', title: 'Introducing Calculus: Can Change Occur at an Instant?', courses: ['AB', 'BC'], planned: 'Instant Change Zoom Lab', vtype: 'interactive graph/explorer', module: 'visualizers/unit1/instant-change.js' },
            { id: '1.2', title: 'Defining Limits and Using Limit Notation', courses: ['AB', 'BC'], planned: 'Limit Target Explorer', vtype: 'interactive graph + number line', module: 'visualizers/unit1/limit-notation.js' },
            { id: '1.3', title: 'Estimating Limit Values from Graphs', courses: ['AB', 'BC'], planned: 'Graph Limit Reader', vtype: 'graph + practice interaction', module: 'visualizers/unit1/graph-limits.js' },
            { id: '1.4', title: 'Estimating Limit Values from Tables', courses: ['AB', 'BC'], planned: 'Table Limit Tracker', vtype: 'table + convergence explorer', module: 'visualizers/unit1/table-limits.js' },
            { id: '1.5', title: 'Determining Limits Using Algebraic Properties of Limits', courses: ['AB', 'BC'], planned: 'Limit Law Builder', vtype: 'symbolic manipulation / rule builder', module: 'visualizers/unit1/limit-laws.js' },
            { id: '1.6', title: 'Determining Limits Using Algebraic Manipulation', courses: ['AB', 'BC'], planned: 'Algebraic Limit Repair', vtype: 'step-by-step symbolic + graph comparison', module: 'visualizers/unit1/algebraic-repair.js' },
            { id: '1.7', title: 'Selecting Procedures for Determining Limits', courses: ['AB', 'BC'], planned: 'Limit Strategy Router', vtype: 'decision map + practice', module: 'visualizers/unit1/strategy-router.js' },
            { id: '1.8', title: 'Determining Limits Using the Squeeze Theorem', courses: ['AB', 'BC'], planned: 'Squeeze Theorem Sandwich', vtype: 'graph explorer', module: 'visualizers/unit1/squeeze.js' },
            { id: '1.9', title: 'Connecting Multiple Representations of Limits', courses: ['AB', 'BC'], planned: 'Limit Representation Translator', vtype: 'multi-representation comparison', module: 'visualizers/unit1/representations.js' },
            { id: '1.10', title: 'Exploring Types of Discontinuities', courses: ['AB', 'BC'], planned: 'Discontinuity Gallery', vtype: 'graphical comparison', module: 'visualizers/unit1/discontinuities.js' },
            { id: '1.11', title: 'Defining Continuity at a Point', courses: ['AB', 'BC'], planned: 'Continuity Checkpoint', vtype: 'theorem-condition explorer', module: 'visualizers/unit1/continuity-point.js' },
            { id: '1.12', title: 'Confirming Continuity over an Interval', courses: ['AB', 'BC'], planned: 'Interval Continuity Scanner', vtype: 'interval/graph explorer', module: 'visualizers/unit1/continuity-interval.js' },
            { id: '1.13', title: 'Removing Discontinuities', courses: ['AB', 'BC'], planned: 'Continuity Repair Lab', vtype: 'manipulation tool', module: 'visualizers/unit1/repair.js' },
            { id: '1.14', title: 'Connecting Infinite Limits and Vertical Asymptotes', courses: ['AB', 'BC'], planned: 'Vertical Asymptote Explorer', vtype: 'graph explorer', module: 'visualizers/unit1/asymptotes.js' },
            { id: '1.15', title: 'Connecting Limits at Infinity and Horizontal Asymptotes', courses: ['AB', 'BC'], planned: 'End Behavior Explorer', vtype: 'graph/zoom explorer', module: 'visualizers/unit1/asymptotes.js' },
            { id: '1.16', title: 'Working with the Intermediate Value Theorem (IVT)', courses: ['AB', 'BC'], planned: 'IVT Crossing Explorer', vtype: 'theorem-condition simulation', module: 'visualizers/unit1/ivt.js' }
        ]
    },
    {
        num: 2,
        name: 'Differentiation: Definition and Fundamental Properties',
        courses: ['AB', 'BC'],
        topics: [
            { id: '2.1', title: 'Defining Average and Instantaneous Rates of Change at a Point', courses: ['AB', 'BC'], planned: 'Secant-to-Tangent Lab', vtype: 'interactive graph/manipulation', module: 'visualizers/unit2/secant-tangent.js' },
            { id: '2.2', title: 'Defining the Derivative of a Function and Using Derivative Notation', courses: ['AB', 'BC'], planned: 'Derivative Definition Builder', vtype: 'graph + equation sequence', module: 'visualizers/unit2/derivative-function.js' },
            { id: '2.3', title: 'Estimating Derivatives of a Function at a Point', courses: ['AB', 'BC'], planned: 'Derivative Estimator', vtype: 'graph/table practice', module: 'visualizers/unit2/estimator.js' },
            { id: '2.4', title: 'Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist', courses: ['AB', 'BC'], planned: 'Differentiability Inspector', vtype: 'graphical comparison', module: 'visualizers/unit2/differentiability.js' },
            { id: '2.5', title: 'Applying the Power Rule', courses: ['AB', 'BC'], planned: 'Power Rule Pattern Lab', vtype: 'pattern explorer', module: 'visualizers/unit2/power-rule.js' },
            { id: '2.6', title: 'Derivative Rules: Constant, Sum, Difference, and Constant Multiple', courses: ['AB', 'BC'], planned: 'Derivative Rule Composer', vtype: 'symbolic manipulation', module: 'visualizers/unit2/rule-composer.js' },
            { id: '2.7', title: 'Derivatives of cos(x), sin(x), e^x, and ln(x)', courses: ['AB', 'BC'], planned: 'Core Derivative Function Lab', vtype: 'synchronized graph comparison', module: 'visualizers/unit2/core-derivatives.js' },
            { id: '2.8', title: 'The Product Rule', courses: ['AB', 'BC'], planned: 'Product Change Lab', vtype: 'geometric + symbolic explorer', module: 'visualizers/unit2/product-rule.js' },
            { id: '2.9', title: 'The Quotient Rule', courses: ['AB', 'BC'], planned: 'Ratio Change Lab', vtype: 'synchronized symbolic explorer', module: 'visualizers/unit2/quotient-rule.js' },
            { id: '2.10', title: 'Finding the Derivatives of Tangent, Cotangent, Secant, and/or Cosecant Functions', courses: ['AB', 'BC'], planned: 'Trig Derivative Network', vtype: 'concept map + graph comparison', module: 'visualizers/unit2/trig-network.js' }
        ]
    },
    {
        num: 3,
        name: 'Differentiation: Composite, Implicit, and Inverse Functions',
        courses: ['AB', 'BC'],
        topics: [
            { id: '3.1', title: 'The Chain Rule', courses: ['AB', 'BC'], planned: 'Chain Rule Layers', vtype: 'function-machine / step visualizer', module: 'visualizers/unit3/chain-rule.js' },
            { id: '3.2', title: 'Implicit Differentiation', courses: ['AB', 'BC'], planned: 'Implicit Tangent Lab', vtype: 'graph + symbolic sequence', module: 'visualizers/unit3/implicit-tangent.js' },
            { id: '3.3', title: 'Differentiating Inverse Functions', courses: ['AB', 'BC'], planned: 'Inverse Slope Mirror', vtype: 'graph/reflection explorer', module: 'visualizers/unit3/inverse-mirror.js' },
            { id: '3.4', title: 'Differentiating Inverse Trigonometric Functions', courses: ['AB', 'BC'], planned: 'Inverse Trig Derivative Explorer', vtype: 'graph + geometry + equation', module: 'visualizers/unit3/inverse-trig.js' },
            { id: '3.5', title: 'Selecting Procedures for Calculating Derivatives', courses: ['AB', 'BC'], planned: 'Derivative Strategy Router', vtype: 'expression-tree practice', module: 'visualizers/unit3/strategy-router.js' },
            { id: '3.6', title: 'Calculating Higher-Order Derivatives', courses: ['AB', 'BC'], planned: 'Derivative Layers Lab', vtype: 'synchronized f/f′/f″ graph explorer', module: 'visualizers/unit3/higher-order.js' }
        ]
    },
    {
        num: 4,
        name: 'Contextual Applications of Differentiation',
        courses: ['AB', 'BC'],
        topics: [
            { id: '4.1', title: 'Interpreting the Meaning of the Derivative in Context', courses: ['AB', 'BC'], planned: 'Rate Meaning Builder', vtype: 'context/units translator', module: 'visualizers/unit4/rate-meaning.js' },
            { id: '4.2', title: 'Straight-Line Motion: Connecting Position, Velocity, and Acceleration', courses: ['AB', 'BC'], planned: 'Derivative Motion Lab', vtype: 'timeline simulation + synchronized graphs', module: 'visualizers/unit4/motion-lab.js' },
            { id: '4.3', title: 'Rates of Change in Applied Contexts Other Than Motion', courses: ['AB', 'BC'], planned: 'Applied Rate Explorer', vtype: 'contextual simulation', module: 'visualizers/unit4/applied-rate.js' },
            { id: '4.4', title: 'Introduction to Related Rates', courses: ['AB', 'BC'], planned: 'Related Rates Dependency Map', vtype: 'diagram/concept map', module: 'visualizers/unit4/dependency-map.js' },
            { id: '4.5', title: 'Solving Related Rates Problems', courses: ['AB', 'BC'], planned: 'Related Rates Solver Lab', vtype: 'geometry simulation + step sequence', module: 'visualizers/unit4/solver-lab.js' },
            { id: '4.6', title: 'Approximating Values of a Function Using Local Linearity and Linearization', courses: ['AB', 'BC'], planned: 'Linearization Microscope', vtype: 'zoomable graph explorer', module: 'visualizers/unit4/linearization.js' },
            { id: '4.7', title: 'Using L\u2019Hospital\u2019s Rule for Determining Limits of Indeterminate Forms', courses: ['AB', 'BC'], planned: 'Indeterminate Form Resolver', vtype: 'graph + symbolic comparison', module: 'visualizers/unit4/lhopital.js' }
        ]
    },
    {
        num: 5,
        name: 'Analytical Applications of Differentiation',
        courses: ['AB', 'BC'],
        topics: [
            { id: '5.1', title: 'Using the Mean Value Theorem', courses: ['AB', 'BC'], planned: 'MVT Secant Finder', vtype: 'graph/manipulation explorer' },
            { id: '5.2', title: 'Extreme Value Theorem, Global Versus Local Extrema, and Critical Points', courses: ['AB', 'BC'], planned: 'Extrema & Critical Point Explorer', vtype: 'graphical comparison' },
            { id: '5.3', title: 'Determining Intervals on Which a Function Is Increasing or Decreasing', courses: ['AB', 'BC'], planned: 'Monotonicity Sign Chart', vtype: 'linked graph + number line' },
            { id: '5.4', title: 'Using the First Derivative Test to Determine Relative (Local) Extrema', courses: ['AB', 'BC'], planned: 'First Derivative Test Lab', vtype: 'sign-change explorer' },
            { id: '5.5', title: 'Using the Candidates Test to Determine Absolute (Global) Extrema', courses: ['AB', 'BC'], planned: 'Absolute Extrema Candidate Board', vtype: 'comparison/practice' },
            { id: '5.6', title: 'Determining Concavity of Functions over Their Domains', courses: ['AB', 'BC'], planned: 'Concavity Explorer', vtype: 'synchronized f/f\u2032/f\u2033 graph' },
            { id: '5.7', title: 'Using the Second Derivative Test to Determine Extrema', courses: ['AB', 'BC'], planned: 'Second Derivative Test Lab', vtype: 'local-shape explorer' },
            { id: '5.8', title: 'Sketching Graphs of Functions and Their Derivatives', courses: ['AB', 'BC'], planned: 'Function\u2013Derivative Sketch Studio', vtype: 'drawing/practice interaction' },
            { id: '5.9', title: 'Connecting a Function, Its First Derivative, and Its Second Derivative', courses: ['AB', 'BC'], planned: 'f\u2013f\u2032\u2013f\u2033 Linker', vtype: 'synchronized multi-graph explorer' },
            { id: '5.10', title: 'Introduction to Optimization Problems', courses: ['AB', 'BC'], planned: 'Optimization Model Builder', vtype: 'modeling/diagram tool' },
            { id: '5.11', title: 'Solving Optimization Problems', courses: ['AB', 'BC'], planned: 'Optimization Solver Lab', vtype: 'interactive optimization explorer' },
            { id: '5.12', title: 'Exploring Behaviors of Implicit Relations', courses: ['AB', 'BC'], planned: 'Implicit Relation Behavior Explorer', vtype: 'graph/tangent explorer' }
        ]
    },
    {
        num: 6,
        name: 'Integration and Accumulation of Change',
        courses: ['AB', 'BC'],
        topics: [
            { id: '6.1', title: 'Exploring Accumulations of Change', courses: ['AB', 'BC'], planned: 'Accumulation Meter', vtype: 'rate-to-total simulation' },
            { id: '6.2', title: 'Approximating Areas with Riemann Sums', courses: ['AB', 'BC'], planned: 'Riemann Sum Builder', vtype: 'interactive graph manipulation' },
            { id: '6.3', title: 'Riemann Sums, Summation Notation, and Definite Integral Notation', courses: ['AB', 'BC'], planned: 'Sigma-to-Integral Translator', vtype: 'multi-representation tool' },
            { id: '6.4', title: 'The Fundamental Theorem of Calculus and Accumulation Functions', courses: ['AB', 'BC'], planned: 'FTC Accumulation Engine', vtype: 'moving-bound graph explorer' },
            { id: '6.5', title: 'Interpreting the Behavior of Accumulation Functions Involving Area', courses: ['AB', 'BC'], planned: 'Accumulation Behavior Lab', vtype: 'synchronized graph explorer' },
            { id: '6.6', title: 'Applying Properties of Definite Integrals', courses: ['AB', 'BC'], planned: 'Integral Property Balance', vtype: 'manipulation/comparison tool' },
            { id: '6.7', title: 'The Fundamental Theorem of Calculus and Definite Integrals', courses: ['AB', 'BC'], planned: 'Net Change Evaluator', vtype: 'equation + area comparison' },
            { id: '6.8', title: 'Finding Antiderivatives and Indefinite Integrals: Basic Rules and Notation', courses: ['AB', 'BC'], planned: 'Antiderivative Family Explorer', vtype: 'graph/explorer' },
            { id: '6.9', title: 'Integrating Using Substitution', courses: ['AB', 'BC'], planned: 'u-Substitution Structure Mapper', vtype: 'expression-tree / step tool' },
            { id: '6.10', title: 'Integrating Functions Using Long Division and Completing the Square', courses: ['AB', 'BC'], planned: 'Integration Form Transformer', vtype: 'symbolic manipulation' },
            { id: '6.11', title: 'Integrating Using Integration by Parts', courses: ['BC'], planned: 'Integration by Parts Tradeoff Lab', vtype: 'symbolic process visualizer' },
            { id: '6.12', title: 'Integrating Using Linear Partial Fractions', courses: ['BC'], planned: 'Partial Fractions Decomposer', vtype: 'symbolic manipulation' },
            { id: '6.13', title: 'Evaluating Improper Integrals', courses: ['BC'], planned: 'Improper Integral Limit Lab', vtype: 'graph + growing-bound simulation' },
            { id: '6.14', title: 'Selecting Techniques for Antidifferentiation', courses: ['AB', 'BC'], planned: 'Integration Strategy Router', vtype: 'decision/practice tool' }
        ]
    },
    {
        num: 7,
        name: 'Differential Equations',
        courses: ['AB', 'BC'],
        topics: [
            { id: '7.1', title: 'Modeling Situations with Differential Equations', courses: ['AB', 'BC'], planned: 'Differential Equation Model Builder', vtype: 'context/concept map' },
            { id: '7.2', title: 'Verifying Solutions for Differential Equations', courses: ['AB', 'BC'], planned: 'Solution Verifier', vtype: 'comparison / step tool' },
            { id: '7.3', title: 'Sketching Slope Fields', courses: ['AB', 'BC'], planned: 'Slope Field Painter', vtype: 'interactive field simulation' },
            { id: '7.4', title: 'Reasoning Using Slope Fields', courses: ['AB', 'BC'], planned: 'Solution Curve Tracer', vtype: 'drawing/explorer' },
            { id: '7.5', title: 'Approximating Solutions Using Euler\u2019s Method', courses: ['BC'], planned: 'Euler Method Stepper', vtype: 'step-by-step graphical simulation' },
            { id: '7.6', title: 'Finding General Solutions Using Separation of Variables', courses: ['AB', 'BC'], planned: 'Separation of Variables Balancer', vtype: 'symbolic manipulation' },
            { id: '7.7', title: 'Finding Particular Solutions Using Initial Conditions and Separation of Variables', courses: ['AB', 'BC'], planned: 'Initial Condition Resolver', vtype: 'family-to-solution explorer' },
            { id: '7.8', title: 'Exponential Models with Differential Equations', courses: ['AB', 'BC'], planned: 'Exponential Growth\u2013Decay Lab', vtype: 'graph/simulation' },
            { id: '7.9', title: 'Logistic Models with Differential Equations', courses: ['BC'], planned: 'Logistic Growth Lab', vtype: 'graph/simulation' }
        ]
    },
    {
        num: 8,
        name: 'Applications of Integration',
        courses: ['AB', 'BC'],
        topics: [
            { id: '8.1', title: 'Finding the Average Value of a Function on an Interval', courses: ['AB', 'BC'], planned: 'Average Value Level Finder', vtype: 'graph/area explorer' },
            { id: '8.2', title: 'Connecting Position, Velocity, and Acceleration of Functions Using Integrals', courses: ['AB', 'BC'], planned: 'Motion Accumulation Lab', vtype: 'motion + graph simulation' },
            { id: '8.3', title: 'Using Accumulation Functions and Definite Integrals in Applied Contexts', courses: ['AB', 'BC'], planned: 'Net Change Context Lab', vtype: 'graph/table/context explorer' },
            { id: '8.4', title: 'Finding the Area Between Curves Expressed as Functions of x', courses: ['AB', 'BC'], planned: 'Vertical Slice Area Builder', vtype: 'geometry/graph manipulation' },
            { id: '8.5', title: 'Finding the Area Between Curves Expressed as Functions of y', courses: ['AB', 'BC'], planned: 'Horizontal Slice Area Builder', vtype: 'geometry/graph manipulation' },
            { id: '8.6', title: 'Finding the Area Between Curves That Intersect at More Than Two Points', courses: ['AB', 'BC'], planned: 'Region Splitter', vtype: 'graph/interval manipulation' },
            { id: '8.7', title: 'Volumes with Cross Sections: Squares and Rectangles', courses: ['AB', 'BC'], planned: 'Cross-Section Solid Studio', vtype: '3D geometry manipulation' },
            { id: '8.8', title: 'Volumes with Cross Sections: Triangles and Semicircles', courses: ['AB', 'BC'], planned: 'Cross-Section Shape Studio', vtype: '3D geometry explorer' },
            { id: '8.9', title: 'Volume with Disc Method: Revolving Around the x- or y-Axis', courses: ['AB', 'BC'], planned: 'Disc Revolution Lab', vtype: '3D rotation simulation' },
            { id: '8.10', title: 'Volume with Disc Method: Revolving Around Other Axes', courses: ['AB', 'BC'], planned: 'Shifted-Axis Disc Lab', vtype: '3D manipulation' },
            { id: '8.11', title: 'Volume with Washer Method: Revolving Around the x- or y-Axis', courses: ['AB', 'BC'], planned: 'Washer Revolution Lab', vtype: '3D rotation simulation' },
            { id: '8.12', title: 'Volume with Washer Method: Revolving Around Other Axes', courses: ['AB', 'BC'], planned: 'Shifted-Axis Washer Lab', vtype: '3D manipulation' },
            { id: '8.13', title: 'The Arc Length of a Smooth, Planar Curve and Distance Traveled', courses: ['BC'], planned: 'Arc Length & Distance Lab', vtype: 'curve-tracing explorer' }
        ]
    },
    {
        num: 9,
        name: 'Parametric Equations, Polar Coordinates, and Vector-Valued Functions',
        courses: ['BC'],
        topics: [
            { id: '9.1', title: 'Defining and Differentiating Parametric Equations', courses: ['BC'], planned: 'Parametric Motion & Slope Lab', vtype: 'path/time explorer' },
            { id: '9.2', title: 'Second Derivatives of Parametric Equations', courses: ['BC'], planned: 'Parametric Concavity Lab', vtype: 'synchronized graph/expression explorer' },
            { id: '9.3', title: 'Finding Arc Lengths of Curves Given by Parametric Equations', courses: ['BC'], planned: 'Parametric Arc-Length Tracer', vtype: 'motion/length simulation' },
            { id: '9.4', title: 'Defining and Differentiating Vector-Valued Functions', courses: ['BC'], planned: 'Vector-Valued Motion Lab', vtype: 'vector simulation' },
            { id: '9.5', title: 'Integrating Vector-Valued Functions', courses: ['BC'], planned: 'Vector Integration Builder', vtype: 'component-wise accumulation' },
            { id: '9.6', title: 'Solving Motion Problems Using Parametric and Vector-Valued Functions', courses: ['BC'], planned: '2D Motion Analyzer', vtype: 'full motion simulation' },
            { id: '9.7', title: 'Defining Polar Coordinates and Differentiating in Polar Form', courses: ['BC'], planned: 'Polar Coordinate & Tangent Lab', vtype: 'polar explorer' },
            { id: '9.8', title: 'Find the Area of a Polar Region or the Area Bounded by a Single Polar Curve', courses: ['BC'], planned: 'Polar Area Sweep', vtype: 'sector-accumulation simulation' },
            { id: '9.9', title: 'Finding the Area of the Region Bounded by Two Polar Curves', courses: ['BC'], planned: 'Polar Overlap Region Explorer', vtype: 'polar-region manipulation' }
        ]
    },
    {
        num: 10,
        name: 'Infinite Sequences and Series',
        courses: ['BC'],
        topics: [
            { id: '10.1', title: 'Defining Convergent and Divergent Infinite Series', courses: ['BC'], planned: 'Infinite Series Partial-Sum Lab', vtype: 'numerical/graph explorer' },
            { id: '10.2', title: 'Working with Geometric Series', courses: ['BC'], planned: 'Geometric Series Zoom', vtype: 'convergence explorer' },
            { id: '10.3', title: 'The nth Term Test for Divergence', courses: ['BC'], planned: 'nth-Term Divergence Gate', vtype: 'comparison/concept tool' },
            { id: '10.4', title: 'Integral Test for Convergence', courses: ['BC'], planned: 'Integral Test Staircase', vtype: 'graph/area comparison' },
            { id: '10.5', title: 'Harmonic Series and p-Series', courses: ['BC'], planned: 'Benchmark Series Gallery', vtype: 'comparison explorer' },
            { id: '10.6', title: 'Comparison Tests for Convergence', courses: ['BC'], planned: 'Comparison Test Matcher', vtype: 'inequality/comparison visualizer' },
            { id: '10.7', title: 'Alternating Series Test for Convergence', courses: ['BC'], planned: 'Alternating Series Oscillation Lab', vtype: 'partial-sum explorer' },
            { id: '10.8', title: 'Ratio Test for Convergence', courses: ['BC'], planned: 'Ratio Test Growth Meter', vtype: 'numerical/expression explorer' },
            { id: '10.9', title: 'Determining Absolute or Conditional Convergence', courses: ['BC'], planned: 'Absolute vs Conditional Split View', vtype: 'comparison tool' },
            { id: '10.10', title: 'Alternating Series Error Bound', courses: ['BC'], planned: 'Alternating Series Error Bound Lab', vtype: 'error/bracketing explorer' },
            { id: '10.11', title: 'Finding Taylor Polynomial Approximations of Functions', courses: ['BC'], planned: 'Taylor Polynomial Approximation Lab', vtype: 'degree-slider graph explorer' },
            { id: '10.12', title: 'Lagrange Error Bound', courses: ['BC'], planned: 'Lagrange Error Envelope', vtype: 'error-bound explorer' },
            { id: '10.13', title: 'Radius and Interval of Convergence of Power Series', courses: ['BC'], planned: 'Power Series Convergence Radius Explorer', vtype: 'number-line + series explorer' },
            { id: '10.14', title: 'Finding Taylor or Maclaurin Series for a Function', courses: ['BC'], planned: 'Taylor\u2013Maclaurin Series Builder', vtype: 'coefficient-generation tool' },
            { id: '10.15', title: 'Representing Functions as Power Series', courses: ['BC'], planned: 'Power Series Representation Workshop', vtype: 'symbolic manipulation / transfer tool' }
        ]
    }
];
