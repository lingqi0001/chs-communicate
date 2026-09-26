/* dev probe (not referenced by the app): walk Next on one lesson and print, for
   each index, the step params, the visible message and the visible pane titles.
   Usage: node dev/stepcheck.mjs unit3/inverse-trig.js */
import { readFileSync } from 'fs';
import path from 'path';

const src = readFileSync(path.resolve(import.meta.dirname, 'copydump.mjs'), 'utf8')
    .split('const fs = await import')[0]
    + '\nexport { makeNode, queryAll, query };\n';
const stub = await import('data:text/javascript,' + encodeURIComponent(src));
const { makeNode, queryAll, query } = stub;

const { mountWorkspace } = await import('../js/calc-runtime.js');
const target = process.argv[2] || 'unit3/inverse-trig.js';
const def = (await import('../visualizers/' + target)).default;

const host = makeNode('div');
mountWorkspace(host, def);

const click = sel => {
    const b = queryAll(host, sel).find(x => String(x.textContent).trim() === 'Next')
        || query(host, sel);
    if (b && b._ev && b._ev.click) { b._ev.click(); return true; }
    return false;
};
const texts = () => {
    const out = [];
    const grab = n => {
        const cls = n.className || '';
        if (/cv-pane-title|work-msg|cv-msg|prompt-q/.test(cls) && n._text) out.push(String(n._text).trim());
        (n.children || []).forEach(grab);
    };
    grab(host);
    return out;
};

const steps = def.steps || [];
const msgAt = i => String((steps[i] && steps[i].message) || '').slice(0, 46);
console.log('== ' + target + ' == idx 0 | step0.params ' + JSON.stringify((steps[0] || {}).params)
    + '\n   rendered: ' + texts().slice(0, 4).join(' || '));
for (let i = 0; i < steps.length; i++) {
    if (!click('.wbtn')) break;
    console.log('idx ' + (i + 1) + ' | steps[' + i + '].params ' + JSON.stringify(steps[i].params)
        + ' | steps[' + (i + 1) + '].msg "' + msgAt(i + 1) + '"'
        + '\n   rendered: ' + texts().slice(0, 4).join(' || '));
}
