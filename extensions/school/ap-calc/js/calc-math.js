/* Tiny math expression engine for the Calculus Lab.
   Compiles strings like 'x^2', 'f(a+h)', 'sin(x)/x', '2pi r' into
   evaluators over an env of numbers + named functions. No CAS: it computes,
   it never simplifies. */

const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sec: x => 1 / Math.cos(x), csc: x => 1 / Math.sin(x), cot: x => 1 / Math.tan(x),
    ln: Math.log, log: Math.log10, log2: Math.log2,
    exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt,
    abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round
};
const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, tau: Math.PI * 2 };

function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
        const ch = src[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (/[0-9.]/.test(ch)) {
            let j = i;
            while (j < src.length && /[0-9.]/.test(src[j])) j++;
            out.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
            i = j; continue;
        }
        if (/[A-Za-zθπ_']/.test(ch)) {
            let j = i;
            while (j < src.length && /[A-Za-z0-9θπ_']/.test(src[j])) j++;
            out.push({ t: 'id', v: src.slice(i, j) });
            i = j; continue;
        }
        const two = src.slice(i, i + 2);
        if (two === '<=' || two === '>=' || two === '==' || two === '!=') { out.push({ t: two }); i += 2; continue; }
        if ('+-*/^(),<>=!|'.includes(ch)) { out.push({ t: ch }); i++; continue; }
        if (ch === '·' || ch === '×') { out.push({ t: '*' }); i++; continue; }
        if (ch === '−') { out.push({ t: '-' }); i++; continue; }
        if (ch === '²') { out.push({ t: '^' }, { t: 'num', v: 2 }); i++; continue; }
        if (ch === '³') { out.push({ t: '^' }, { t: 'num', v: 3 }); i++; continue; }
        if (ch === '√') { out.push({ t: 'id', v: 'sqrt' }); i++; continue; }
        if (ch === 'Δ') { out.push({ t: 'id', v: 'D' }); i++; continue; }
        throw new Error('bad char ' + ch);
    }
    return out;
}

function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const eat = (t) => { if (!peek() || peek().t !== t) throw new Error('expected ' + t); return tokens[pos++]; };

    function primary() {
        const tk = peek();
        if (!tk) throw new Error('unexpected end');
        if (tk.t === '(') { pos++; const e = expr(); eat(')'); return e; }
        if (tk.t === '|') { pos++; const e = expr(); eat('|'); return { type: 'call', name: 'abs', args: [e] }; }
        if (tk.t === 'num') { pos++; return { type: 'num', v: tk.v }; }
        if (tk.t === '-') { pos++; return { type: 'neg', e: postfix() }; }
        if (tk.t === '+') { pos++; return postfix(); }
        if (tk.t === '!') { pos++; return { type: 'not', e: primary() }; }
        if (tk.t === 'id') {
            pos++;
            const name = tk.v;
            if (peek() && peek().t === '(') {
                pos++;
                const args = [];
                if (peek() && peek().t !== ')') {
                    args.push(expr());
                    while (peek() && peek().t === ',') { pos++; args.push(expr()); }
                }
                eat(')');
                if (name === 'min' || name === 'max' || name === 'pow' || name === 'log') {
                    if (name === 'log' && args.length === 1) return { type: 'call', name: 'log', args };
                    return { type: 'call', name, args };
                }
                if (FUNCS[name]) return { type: 'call', name, args };
                return { type: 'fcall', name, args };
            }
            return { type: 'var', name };
        }
        throw new Error('bad token ' + tk.t);
    }
    function postfix() {
        let a = primary();
        while (peek() && peek().t === '^') { pos++; a = { type: 'pow', a, b: unaryNoNeg() }; }
        return a;
    }
    function unaryNoNeg() {
        if (peek() && peek().t === '-') { pos++; return { type: 'neg', e: unaryNoNeg() }; }
        return postfix();
    }
    function implicitNext() {
        const tk = peek();
        if (!tk) return false;
        return tk.t === 'num' || tk.t === 'id' || tk.t === '(';
    }
    function mul() {
        let a = postfix();
        while (peek() && (peek().t === '*' || peek().t === '/')) {
            const op = tokens[pos++].t;
            a = { type: 'bin', op, a, b: postfix() };
        }
        while (implicitNext()) {
            a = { type: 'bin', op: '*', a, b: postfix() };
        }
        return a;
    }
    function add() {
        let a = mul();
        while (peek() && (peek().t === '+' || peek().t === '-')) {
            const op = tokens[pos++].t;
            a = { type: 'bin', op, a, b: mul() };
        }
        return a;
    }
    function cmp() {
        let a = add();
        while (peek() && ['<', '>', '<=', '>=', '==', '!='].includes(peek().t)) {
            const op = tokens[pos++].t;
            a = { type: 'bin', op, a, b: add() };
        }
        return a;
    }
    function expr() { return cmp(); }

    const out = expr();
    if (pos < tokens.length) throw new Error('trailing ' + tokens[pos].t);
    return out;
}

const astCache = new Map();
function ast(src) {
    let a = astCache.get(src);
    if (!a) { a = parse(tokenize(src)); astCache.set(src, a); }
    return a;
}

function evalNode(n, env) {
    switch (n.type) {
        case 'num': return n.v;
        case 'var': {
            if (n.name in env) return env[n.name];
            if (n.name in CONSTS) return CONSTS[n.name];
            if (n.name === 'true') return true;
            if (n.name === 'false') return false;
            throw new Error('unknown ' + n.name);
        }
        case 'neg': return -evalNode(n.e, env);
        case 'not': return !evalNode(n.e, env);
        case 'pow': {
            const b = evalNode(n.b, env);
            const a = evalNode(n.a, env);
            if (a < 0 && !Number.isInteger(b)) {
                for (let q = 1; q <= 12; q++) {
                    const p = Math.round(b * q);
                    if (Math.abs(b - p / q) < 1e-9 && q % 2 === 1) return (p % 2 === 0 ? 1 : -1) * Math.pow(-a, b);
                }
            }
            return Math.pow(a, b);
        }
        case 'bin': {
            const a = evalNode(n.a, env), b = evalNode(n.b, env);
            switch (n.op) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': return a / b;
                case '<': return a < b;
                case '>': return a > b;
                case '<=': return a <= b;
                case '>=': return a >= b;
                case '==': return a === b;
                case '!=': return a !== b;
            }
            throw new Error('bad op');
        }
        case 'call': {
            const args = n.args.map(a => evalNode(a, env));
            if (n.name === 'pow') return Math.pow(args[0], args[1]);
            const f = FUNCS[n.name];
            return f(...args);
        }
        case 'fcall': {
            const target = env[n.name];
            if (typeof target === 'function') {
                const args = n.args.map(a => evalNode(a, env));
                return target(...args);
            }
            if (target && typeof target.evaluate === 'function') {
                const args = n.args.map(a => evalNode(a, env));
                return target.evaluate(...args);
            }
            throw new Error('unknown function ' + n.name);
        }
    }
    throw new Error('bad node ' + n.type);
}

export function evaluate(src, env) { return evalNode(ast(src), env || {}); }

export function compileFn(src, varName) {
    const a = ast(src);
    return (x, baseEnv) => evalNode(a, Object.assign({}, baseEnv || {}, { [varName || 'x']: x }));
}

export function derivative(fn, x, h) {
    const d = h || 1e-6;
    return (fn(x + d) - fn(x - d)) / (2 * d);
}

export function fmt(v, digits) {
    if (typeof v !== 'number' || Number.isNaN(v)) return 'undefined';
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '-∞';
    const d = digits === undefined ? 3 : digits;
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    let s = v.toFixed(d);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
}
