const COLS = [{ name: 'Name', type: 'String' }, { name: 'Grade', type: 'int' }, { name: 'GPA', type: 'double' }];

function ds(rows, note, cols) {
    return { kind: 'dataset', cols: cols || COLS, rows, note };
}

const FULL = [['Moss', 11, 3.8], ['Alex', 10, 3.5], ['Jamie', 12, 3.9]];

export default {
    id: 'u4-datasets',
    meta: { unit: 4, topic: '4.2', title: 'Introduction to Using Data Sets', visualizerTitle: 'Dataset Structure Explorer' },
    intro: 'A dataset is rows of records and columns of fields. Java needs a structure to pour it into.',
    code: `String[] names = {"Moss", "Alex", "Jamie"};
int[] grades = {11, 10, 12};
double[] gpas = {3.8, 3.5, 3.9};`,
    layout: { center: ['extra'], right: [] },
    steps: [
        { line: 1, message: 'Three students, three fields each. Each row is one record: one student observed. Each column is one field: one property, with one data type shared down the column.', mutations: [
            { type: 'extra.set', value: ds(FULL, 'row = record, column = field, column header carries the type') }
        ] },
        { line: 1, message: 'The parallel arrays above hold this dataset: names[0], grades[0] and gpas[0] all describe Moss. Position is the only thing tying them together, so they must stay the same length and the same order.', mutations: [] },
        { line: 3, predict: { q: 'Jamie has NO GPA value. A program averages the GPA column as written. What can happen?', choices: ['It still gets 3.73', 'It crashes or quietly treats the gap as 0, polluting the average', 'Java automatically skips Jamie and gives the right 2-student average'], a: 1, why: 'An empty cell has no valid number in it. Nothing auto-cleans: deciding how to handle missing data happens BEFORE any summary statistic.' }, message: 'Real files are not clean. Jamie did not report a GPA: the cell is empty. Any average computed over the column silently ignores, crashes, or treats it as 0. Handling missing values comes before any summary.', mutations: [
            { type: 'extra.set', value: ds([['Moss', 11, 3.8], ['Alex', 10, 3.5], ['Jamie', 12, 'missing']], 'one gap: count stays 3, but the GPA average cannot be taken blindly', ) }
        ] },
        { line: 2, message: 'Filtering means keeping rows that pass a test. The program asks for juniors and up, so only two records survive: the Grade column drove the selection.', mutations: [
            { type: 'extra.set', value: ds([['Moss', 11, 3.8], ['Jamie', 12, 3.9]], 'filter: grade >= 11 keeps 2 of 3 rows') }
        ] },
        { line: 3, message: 'Summary statistics are traversals over a column of the filtered set: count = 2, GPA min = 3.8, max = 3.9, average = 3.85. Every one of those is a Unit 2 loop over one array.', mutations: [
            { type: 'extra.set', value: ds([['Moss', 11, 3.8], ['Jamie', 12, 3.9]], 'count 2 · GPA min 3.8 · max 3.9 · avg 3.85') }
        ] },
        { line: 1, message: 'Selecting relevant fields: this program only reports GPA. The Name column is not needed, and keeping it is a privacy cost with no benefit. Pour only the needed column into the collection.', mutations: [
            { type: 'extra.set', value: ds([[3.8], [3.5], [3.9]], 'only the field the program uses; names left out on purpose', [{ name: 'GPA', type: 'double' }]) }
        ] },
        { line: 1, message: 'Two collection choices for the same dataset. Parallel arrays: one array per column, good for column math. One Student object per record: name, grade and gpa travel together, so a field can never drift out of sync with its row.', mutations: [] }
    ],
    summary: {
        idea: ['row = one record, column = one field with ONE shared type. Parallel arrays bind records by position, so they must stay the same length and order.', 'count / min / max / average are all just Unit 2 loops over one column.'],
        mistake: 'Deleting one row from only ONE of the parallel arrays: every other column now describes a different student.',
        transfer: 'New question: which student has the LOWEST GPA? Which column do you loop over, and what does your champion variable have to remember besides the value?'
    }
};
