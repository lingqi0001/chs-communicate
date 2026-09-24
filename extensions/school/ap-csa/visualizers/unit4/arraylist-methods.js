function lst(values, opts) {
    return { kind: 'list', name: 'list', values, ...opts };
}

export default {
    id: 'u4-arraylist-methods',
    meta: { unit: 4, topic: '4.8', title: 'ArrayList Methods', visualizerTitle: 'ArrayList Operations Visualizer' },
    intro: 'Five methods, one rule: inserting or removing renumbers everything after it.',
    code: `ArrayList<String> list = new ArrayList<String>();
list.add("A");
list.add("B");
list.add("C");
list.add(1, "X");
list.set(0, "Z");
String g = list.get(1);
list.remove(2);
list.add("Q");
String gone = list.remove(0);
// list.get(5) would crash`,
    layout: { center: ['extra'], right: ['memory'] },
    steps: [
        { line: 1, message: 'The list exists with size() = 0. The box is there, the cells are not: an ArrayList grows on demand.', mutations: [
            { type: 'extra.set', value: lst([], { note: 'size() = 0' }) }
        ] },
        { line: 2, message: 'add("A") appends at the end. Without an index, add always means append.', mutations: [
            { type: 'extra.set', value: lst(['A'], { sel: 0 }) }
        ] },
        { line: 3, message: 'add("B") appends again.', mutations: [
            { type: 'extra.set', value: lst(['A', 'B'], { sel: 1 }) }
        ] },
        { line: 4, message: 'add("C"): now size is 3, indexes 0, 1, 2.', mutations: [
            { type: 'extra.set', value: lst(['A', 'B', 'C'], { sel: 2 }) }
        ] },
        { line: 5, predict: { q: 'The list is [A, B, C]. After add(1, "X"), which element sits at index 3?', choices: ['B', 'C', 'Nothing: index 3 does not exist yet'], a: 1, why: 'Everything from index 1 onward slides right by ONE, and size grows to 4. B moves 1→2, C moves 2→3. Values keep their order; their numbers change.' }, message: 'add(1, "X") inserts at index 1. Watch the shift: B and C slide right, their values unchanged but their indexes both plus one.', mutations: [
            { type: 'extra.set', value: lst(['A', 'X', 'B', 'C'], { sel: 1, note: 'insert pushes everything from index 1 onward to the right' }) }
        ] },
        { line: 6, message: 'set(0, "Z") replaces the cell at 0. Size stays 4: set never moves anything.', mutations: [
            { type: 'extra.set', value: lst(['Z', 'X', 'B', 'C'], { sel: 0, note: 'set = replace in place' }) }
        ] },
        { line: 7, message: 'get(1) reads X without touching the list.', mutations: [
            { type: 'memory.create', name: 'g', dataType: 'String', value: '"X"' },
            { type: 'extra.set', value: lst(['Z', 'X', 'B', 'C'], { sel: 1, note: 'get = read only' }) }
        ] },
        { line: 8, message: 'remove(2) takes out B, then C slides left into index 2. Size drops to 3. Every index after the hole is now one smaller.', mutations: [
            { type: 'extra.set', value: lst(['Z', 'X', 'C'], { sel: 2, note: 'remove shifts everything after it left by one' }) }
        ] },
        { line: 9, message: 'add("Q") appends at the end without an index, growing size back to 4. add never reorders existing elements.', mutations: [
            { type: 'extra.set', value: lst(['Z', 'X', 'C', 'Q'], { sel: 3 }) }
        ] },
        { line: 10, message: 'remove also HANDS BACK what it deleted: gone receives "Z". The remaining cells shift left one more time; size is 3.', mutations: [
            { type: 'memory.create', name: 'gone', dataType: 'String', value: '"Z"' },
            { type: 'extra.set', value: lst(['X', 'C', 'Q'], { sel: 0, note: 'the removed element is the return value' }) }
        ] },
        { line: 11, predict: { q: 'Current size() is 3. What does list.get(3) do?', choices: ['Returns the last element', 'Throws IndexOutOfBoundsException', 'Returns null'], a: 1, why: 'Legal indexes are 0 to size() - 1. Only add(index, ...) accepts index == size(), where it means append. That one-cell grace is add exclusive.' }, message: 'Index rules to keep: get/set/remove accept 0 to size() - 1 only; list.get(5) on a size-3 list throws IndexOutOfBoundsException, just like arrays. add is the exception: add(index, ...) allows index == size(), which means append. size() is a method with parentheses; array length is a field without them.', mutations: [] }
    ],
    summary: {
        idea: ['add and remove RENUMBER everything after the change; get and set never move anything.', 'Every method call you trace also has a return: remove hands back the removed element, size() hands back the count.'],
        mistake: 'Reusing an old index after a remove: the shifted-in element now lives at the hole index, and a stale variable reads the wrong cell.',
        transfer: 'Starting from [A, B, C], run add("Q"), then remove(0), then set(1, "Z"). What is the final list, and what did remove(0) return?'
    }
};
