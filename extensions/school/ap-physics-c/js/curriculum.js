// AP Physics C: Mechanics curriculum map, following the College Board CED
// (Effective Fall 2025): 7 units, 41 topics. Topic titles are the information
// architecture; a visualizer is a presentation attached to a topic, so
// `module` stays absent until the visualizer page actually exists under
// visualizers/unit-N/ — while it is absent the topic renders in the shared
// "Not Available" planned state. Units carry their official exam weighting.
window.PHYS_CURRICULUM = [
    {
        num: 1,
        name: 'Kinematics',
        weight: '10\u201315%',
        topics: [
            { id: '1.1', title: 'Scalars and Vectors' },
            { id: '1.2', title: 'Displacement, Velocity, and Acceleration' },
            { id: '1.3', title: 'Representing Motion' },
            { id: '1.4', title: 'Reference Frames and Relative Motion' },
            { id: '1.5', title: 'Motion in Two or Three Dimensions' }
        ]
    },
    {
        num: 2,
        name: 'Force and Translational Dynamics',
        weight: '20\u201325%',
        topics: [
            { id: '2.1', title: 'Systems and Center of Mass' },
            { id: '2.2', title: 'Forces and Free-Body Diagrams' },
            { id: '2.3', title: 'Newton\u2019s Third Law' },
            { id: '2.4', title: 'Newton\u2019s First Law' },
            { id: '2.5', title: 'Newton\u2019s Second Law' },
            { id: '2.6', title: 'Gravitational Force' },
            { id: '2.7', title: 'Kinetic and Static Friction' },
            { id: '2.8', title: 'Spring Forces' },
            { id: '2.9', title: 'Resistive Forces' },
            { id: '2.10', title: 'Circular Motion' }
        ]
    },
    {
        num: 3,
        name: 'Work, Energy, and Power',
        weight: '15\u201325%',
        topics: [
            { id: '3.1', title: 'Translational Kinetic Energy' },
            { id: '3.2', title: 'Work' },
            { id: '3.3', title: 'Potential Energy' },
            { id: '3.4', title: 'Conservation of Energy' },
            { id: '3.5', title: 'Power' }
        ]
    },
    {
        num: 4,
        name: 'Linear Momentum',
        weight: '10\u201320%',
        topics: [
            { id: '4.1', title: 'Linear Momentum' },
            { id: '4.2', title: 'Change in Momentum and Impulse' },
            { id: '4.3', title: 'Conservation of Linear Momentum' },
            { id: '4.4', title: 'Elastic and Inelastic Collisions' }
        ]
    },
    {
        num: 5,
        name: 'Torque and Rotational Dynamics',
        weight: '10\u201315%',
        topics: [
            { id: '5.1', title: 'Rotational Kinematics' },
            { id: '5.2', title: 'Connecting Linear and Rotational Motion' },
            { id: '5.3', title: 'Torque' },
            { id: '5.4', title: 'Rotational Inertia' },
            { id: '5.5', title: 'Rotational Equilibrium and Newton\u2019s First Law in Rotational Form' },
            { id: '5.6', title: 'Newton\u2019s Second Law in Rotational Form' }
        ]
    },
    {
        num: 6,
        name: 'Energy and Momentum of Rotating Systems',
        weight: '10\u201315%',
        topics: [
            { id: '6.1', title: 'Rotational Kinetic Energy' },
            { id: '6.2', title: 'Torque and Work' },
            { id: '6.3', title: 'Angular Momentum and Angular Impulse' },
            { id: '6.4', title: 'Conservation of Angular Momentum' },
            { id: '6.5', title: 'Rolling' },
            { id: '6.6', title: 'Motion of Orbiting Satellites' }
        ]
    },
    {
        num: 7,
        name: 'Oscillations',
        weight: '10\u201315%',
        topics: [
            { id: '7.1', title: 'Defining Simple Harmonic Motion (SHM)' },
            { id: '7.2', title: 'Frequency and Period of SHM' },
            { id: '7.3', title: 'Representing and Analyzing SHM' },
            { id: '7.4', title: 'Energy of Simple Harmonic Oscillators' },
            { id: '7.5', title: 'Simple and Physical Pendulums' }
        ]
    }
];
