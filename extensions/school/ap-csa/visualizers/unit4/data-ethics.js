function bias(groups, note, warn) {
    return { kind: 'bias', groups, note, warn };
}

function cmp(left, right, verdict) {
    return { kind: 'compare', left, right, verdict };
}

const EVEN = [
    { g: 'Grade 9', pop: 25, sample: 25 },
    { g: 'Grade 10', pop: 25, sample: 25 },
    { g: 'Grade 11', pop: 25, sample: 40 },
    { g: 'Grade 12', pop: 25, sample: 9 }
];

const SKEW = [
    { g: 'Grade 9', pop: 25, sample: 5 },
    { g: 'Grade 10', pop: 25, sample: 10 },
    { g: 'Grade 11', pop: 25, sample: 40 },
    { g: 'Grade 12', pop: 25, sample: 45 }
];

const MISSING = [
    { g: 'Grade 9', pop: 25, sample: 0 },
    { g: 'Grade 10', pop: 25, sample: 0 },
    { g: 'Grade 11', pop: 25, sample: 50 },
    { g: 'Grade 12', pop: 25, sample: 50 }
];

export default {
    id: 'u4-data-ethics',
    meta: { unit: 4, topic: '4.1', title: 'Ethical and Social Issues Around Data Collection', visualizerTitle: 'Data Ethics & Bias Explorer' },
    intro: 'Data is not naturally objective. Who gets collected decides what the numbers will say.',
    code: `// Survey question:
//   "How many hours do CHS students study each night?"
//
// Distribution list: the AP Computer Science class roster`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 2, message: 'The school population is evenly split: each grade is about 25%. A fair estimate should hear from each group in the same proportion.', mutations: [
            { type: 'extra.set', value: bias(EVEN, 'Grey bars: the real school. Blue bars: who the survey reaches.') }
        ] },
        { line: 4, predict: { q: 'The survey list is the AP class roster, mostly juniors and seniors. Compared to the real school, what will the sample show?', choices: ['Almost no change', 'Too many 11th and 12th graders', 'Too few 11th and 12th graders'], a: 1, why: 'The roster underrepresents grades 9 and 10, so upperclassmen dominate every average computed from it.' }, message: 'But the survey only went to the AP class roster, which is mostly juniors and seniors. The sample no longer looks like the school.', mutations: [
            { type: 'extra.set', value: bias(SKEW, 'Sample does not represent the school population.', true) }
        ] },
        { line: 4, message: 'Worse case: a survey handed out only in the AP hallway. Grades 9 and 10 contribute zero data. A whole missing group cannot speak up later, no matter how the numbers are cleaned.', mutations: [
            { type: 'extra.set', value: bias(MISSING, 'Two grades never entered the dataset at all.', true) }
        ] },
        { line: 2, message: 'Same question, two datasets, two answers. The biased sample is arithmetically correct and socially misleading: the reported average describes AP upperclassmen, not CHS students.', mutations: [
            { type: 'extra.set', value: cmp(
                { title: 'AP roster sample', rows: [{ t: 'Average: 4.2 hours', hit: true }, { t: 'Upperclassmen: 85%', hit: true }, { t: 'Conclusion: "CHS students study 4.2 hours"' }] },
                { title: 'Random all-grades sample', rows: [{ t: 'Average: 2.6 hours' }, { t: 'Each grade near 25%' }, { t: 'Conclusion: "about 2.6 hours, more in 11th and 12th"' }] },
                'The collection method, not the math, changed the answer.'
            ) }
        ] },
        { line: 4, message: 'Privacy is the next axis: which fields were collected at all. Names and IDs are direct identifiers; grade, club and sleep hour together can single a person out even without a name.', mutations: [
            { type: 'extra.set', value: cmp(
                { title: 'Collected fields', rows: [{ t: 'student ID', hit: true }, { t: 'name', hit: true }, { t: 'grade level' }, { t: 'clubs and sports' }, { t: 'hours studied' }] },
                { title: 'Risk of each field', rows: [{ t: 'direct identifier', hit: true }, { t: 'direct identifier', hit: true }, { t: 'quasi-identifier' }, { t: 'quasi-identifier' }, { t: 'sensitive if combined' }] },
                'Deleting the name column is not the same as anonymous.'
            ) }
        ] },
        { line: 4, message: 'Consent scenario: students answered because they thought a teacher needed the data for study-habits help. The file was sold to a sleep-tracking app company. Same data, different purpose, new risks nobody agreed to.', mutations: [
            { type: 'extra.set', value: cmp(
                { title: 'Informed consent', rows: [{ t: 'purpose stated up front' }, { t: 'participation optional' }, { t: 'storage and sharing explained' }] },
                { title: 'Hidden collection', rows: [{ t: 'tracked in an app without asking', hit: true }, { t: 'no way to decline', hit: true }, { t: 'reused for other purposes', hit: true }] },
                'CED asks you to spot the consent problem, not solve it.'
            ) }
        ] },
        { line: 4, message: 'Tradeoff view: every dataset is a balance. More fields make the result more useful and more dangerous at the same time.', mutations: [
            { type: 'extra.set', value: cmp(
                { title: 'Utility side', rows: [{ t: 'finer groups, better decisions' }, { t: 'long history shows trends' }] },
                { title: 'Privacy and fairness side', rows: [{ t: 'more data, more exposure', hit: true }, { t: 'missing groups stay invisible', hit: true }] },
                'utility vs privacy vs fairness: name all three when the question asks.'
            ) }
        ] },
        { line: 2, message: 'Exam lens: when a scenario is given, ask who is in the data, who is missing, how it was collected, who consented, and what it gets reused for. A bias or privacy concern you can point to is the full credit.', mutations: [] }
    ],
    summary: {
        idea: ['Collecting data is a decision, not a recording: WHO gets sampled decides WHAT the numbers can say.', 'Deleting the name column is not anonymity. Grade + club + sleep-hour combined can still single one student out.'],
        mistake: 'Trusting the average of a biased sample as a conclusion about the whole school, instead of first asking who is missing.',
        transfer: 'A school lunch program surveys only students who eat in the cafeteria, then concludes "everyone likes menu C". Who is absent from that dataset, and which part of the conclusion is unsafe?'
    }
};
