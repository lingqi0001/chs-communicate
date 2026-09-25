// AP CSA curriculum map, following the College Board CED (Effective Fall 2025):
// 4 units, 53 topics. Topic titles are the information architecture; a
// visualizer is a presentation attached to a topic, so `file` stays null until
// the visualizer page actually exists under visualizers/unit-N/.
window.CSA_CURRICULUM = [
    {
        num: 1,
        name: 'Using Objects and Methods',
        topics: [
            { id: '1.1', title: 'Introduction to Algorithms, Programming, and Compilers', planned: 'Programming & Compilation Pipeline Visualizer', module: 'visualizers/unit1/code-to-execution.js' },
            { id: '1.2', title: 'Variables and Data Types', planned: 'Variable Memory Visualizer', module: 'visualizers/unit1/variables.js' },
            { id: '1.3', title: 'Expressions and Output', planned: 'Expression Step Evaluator', module: 'visualizers/unit1/expressions.js' },
            { id: '1.4', title: 'Assignment Statements and Input', planned: 'Assignment Memory Visualizer', module: 'visualizers/unit1/assignment.js' },
            { id: '1.5', title: 'Casting and Range of Variables', planned: 'Type Casting Visualizer', module: 'visualizers/unit1/casting.js' },
            { id: '1.6', title: 'Compound Assignment Operators', planned: 'Assignment Trace Visualizer', module: 'visualizers/unit1/compound-assignment.js' },
            { id: '1.7', title: 'Application Program Interface (API) and Libraries', planned: 'API Explorer', module: 'visualizers/unit1/api-explorer.js' },
            { id: '1.8', title: 'Documentation with Comments', planned: 'Comments & Contract Visualizer', module: 'visualizers/unit1/documentation.js' },
            { id: '1.9', title: 'Method Signatures', planned: 'Method Signature Explorer', module: 'visualizers/unit1/method-signatures.js' },
            { id: '1.10', title: 'Calling Class Methods', planned: 'Method Call & Stack Visualizer', module: 'visualizers/unit1/class-method-calls.js' },
            { id: '1.11', title: 'Math Class', planned: 'Math Method Playground', module: 'visualizers/unit1/math-playground.js' },
            { id: '1.12', title: 'Objects: Instances of Classes', planned: 'Class-to-Object Visualizer', module: 'visualizers/unit1/objects-and-classes.js' },
            { id: '1.13', title: 'Object Creation and Storage (Instantiation)', planned: 'Heap & Reference Visualizer', module: 'visualizers/unit1/heap-reference.js' },
            { id: '1.14', title: 'Calling Instance Methods', planned: 'Object Method Call Visualizer', module: 'visualizers/unit1/instance-methods.js' },
            { id: '1.15', title: 'String Manipulation', planned: 'String Memory & Index Visualizer', module: 'visualizers/unit1/strings.js' }
        ]
    },
    {
        num: 2,
        name: 'Selection and Iteration',
        topics: [
            { id: '2.1', title: 'Algorithms with Selection and Repetition', planned: 'Algorithm Control Flow Visualizer', module: 'visualizers/unit2/control-flow.js' },
            { id: '2.2', title: 'Boolean Expressions', planned: 'Boolean Expression Evaluator', module: 'visualizers/unit2/boolean-expressions.js' },
            { id: '2.3', title: 'if Statements', planned: 'Branch Path Visualizer', module: 'visualizers/unit2/branching.js' },
            { id: '2.4', title: 'Nested if Statements', planned: 'Decision Tree Visualizer', module: 'visualizers/unit2/branching.js' },
            { id: '2.5', title: 'Compound Boolean Expressions', planned: 'Boolean Logic & Short-Circuit Visualizer', module: 'visualizers/unit2/boolean-expressions.js' },
            { id: '2.6', title: 'Comparing Boolean Expressions', planned: 'Boolean Equivalence Visualizer', module: 'visualizers/unit2/boolean-expressions.js' },
            { id: '2.7', title: 'while Loops', planned: 'While Loop Execution Visualizer', module: 'visualizers/unit2/loops.js' },
            { id: '2.8', title: 'for Loops', planned: 'For Loop Execution Visualizer', module: 'visualizers/unit2/loops.js' },
            { id: '2.9', title: 'Implementing Selection and Iteration Algorithms', planned: 'Selection & Iteration Algorithm Trace Visualizer', module: 'visualizers/unit2/loops.js' },
            { id: '2.10', title: 'Implementing String Algorithms', planned: 'String Algorithm Trace Visualizer', module: 'visualizers/unit2/string-algorithms.js' },
            { id: '2.11', title: 'Nested Iteration', planned: 'Nested Loop Grid Visualizer', module: 'visualizers/unit2/nested-iteration.js' },
            { id: '2.12', title: 'Informal Run-Time Analysis', planned: 'Operation Counter & Growth Visualizer', module: 'visualizers/unit2/runtime-analysis.js' }
        ]
    },
    {
        num: 3,
        name: 'Class Creation',
        topics: [
            { id: '3.1', title: 'Abstraction and Program Design', planned: 'Class Blueprint & Abstraction Visualizer', module: 'visualizers/unit3/abstraction.js' },
            { id: '3.2', title: 'Impact of Program Design', planned: 'Class Design Impact Visualizer', module: 'visualizers/unit3/design-impact.js' },
            { id: '3.3', title: 'Anatomy of a Class', planned: 'Class Anatomy Visualizer', module: 'visualizers/unit3/anatomy.js' },
            { id: '3.4', title: 'Constructors', planned: 'Constructor & Object State Visualizer', module: 'visualizers/unit3/constructors.js' },
            { id: '3.5', title: 'Methods: How to Write Them', planned: 'Method Execution Visualizer', module: 'visualizers/unit3/methods.js' },
            { id: '3.6', title: 'Methods: Passing and Returning References of an Object', planned: 'Reference Passing & Aliasing Visualizer', module: 'visualizers/unit3/references.js' },
            { id: '3.7', title: 'Class Variables and Methods', planned: 'Static vs Instance Visualizer', module: 'visualizers/unit3/static-instance.js' },
            { id: '3.8', title: 'Scope and Access', planned: 'Variable Scope Visualizer', module: 'visualizers/unit3/scope.js' },
            { id: '3.9', title: 'this Keyword', planned: 'this Reference Visualizer', module: 'visualizers/unit3/this.js' }
        ]
    },
    {
        num: 4,
        name: 'Data Collections',
        topics: [
            { id: '4.1', title: 'Ethical and Social Issues Around Data Collection', planned: 'Data Ethics & Bias Explorer', module: 'visualizers/unit4/data-ethics.js' },
            { id: '4.2', title: 'Introduction to Using Data Sets', planned: 'Data Set Explorer', module: 'visualizers/unit4/datasets.js' },
            { id: '4.3', title: 'Array Creation and Access', planned: 'Array Memory Visualizer', module: 'visualizers/unit4/array-basics.js' },
            { id: '4.4', title: 'Array Traversals', planned: 'Array Traversal Visualizer', module: 'visualizers/unit4/array-traversal.js' },
            { id: '4.5', title: 'Implementing Array Algorithms', planned: 'Array Algorithm Trace Visualizer', module: 'visualizers/unit4/array-algorithms.js' },
            { id: '4.6', title: 'Using Text Files', planned: 'File Reading Visualizer', module: 'visualizers/unit4/text-files.js' },
            { id: '4.7', title: 'Wrapper Classes', planned: 'Primitive & Wrapper Visualizer', module: 'visualizers/unit4/wrappers.js' },
            { id: '4.8', title: 'ArrayList Methods', planned: 'ArrayList Operations Visualizer', module: 'visualizers/unit4/arraylist-methods.js' },
            { id: '4.9', title: 'ArrayList Traversals', planned: 'ArrayList Traversal Visualizer', module: 'visualizers/unit4/arraylist-traversal.js' },
            { id: '4.10', title: 'Implementing ArrayList Algorithms', planned: 'ArrayList Algorithm Trace Visualizer', module: 'visualizers/unit4/arraylist-algorithms.js' },
            { id: '4.11', title: '2D Array Creation and Access', planned: '2D Array Grid Visualizer', module: 'visualizers/unit4/grid2d-basics.js' },
            { id: '4.12', title: '2D Array Traversals', planned: '2D Array Traversal Visualizer', module: 'visualizers/unit4/grid2d-traversal.js' },
            { id: '4.13', title: 'Implementing 2D Array Algorithms', planned: '2D Array Algorithm Trace Visualizer', module: 'visualizers/unit4/grid2d-algorithms.js' },
            { id: '4.14', title: 'Searching Algorithms', planned: 'Search Algorithm Visualizer', module: 'visualizers/unit4/linear-search.js' },
            { id: '4.15', title: 'Sorting Algorithms', planned: 'Sorting Algorithm Visualizer', module: 'visualizers/unit4/sorting.js' },
            { id: '4.16', title: 'Recursion', planned: 'Recursion Call Stack Visualizer', module: 'visualizers/unit4/recursion.js' },
            { id: '4.17', title: 'Recursive Searching and Sorting', planned: 'Recursive Algorithm Visualizer', module: 'visualizers/unit4/recursion-search-sort.js' }
        ]
    }
];
