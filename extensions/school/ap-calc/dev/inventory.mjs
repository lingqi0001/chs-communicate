/* Print every string literal in the unit3 visualizers with file:line and word count. */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const which = process.argv[2] || 'unit3';
const DIR = path.join(ROOT, 'visualizers', which);

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort();

const strPat = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

let total = 0;
for (const f of files) {
    const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
    const out = [];
    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
        let m;
        strPat.lastIndex = 0;
        while ((m = strPat.exec(line)) !== null) {
            const body = m[0].slice(1, -1);
            if (!body.trim()) continue;
            const words = body.trim().split(/\s+/).length;
            if (words < 4) continue;
            out.push({ line: i + 1, words, s: body });
        }
    });
    total += out.length;
    console.log('===== ' + f + '  (' + out.length + ' strings with >=4 words) =====');
    out.forEach(o => console.log(o.line + ' [' + o.words + '] ' + o.s));
    console.log('');
}
console.log('TOTAL ' + total);
