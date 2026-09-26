/* Shared calculus visual components. Everything is SVG or plain DOM driven by
   a declarative spec + a params env (numbers, strings, and compiled fns).
   Lesson files stay data; they never touch the page. */

import { evaluate, compileFn, derivative, fmt } from './calc-math.js?v=20260925-calc-15';

const SVG_NS = 'http://www.w3.org/2000/svg';

const COLORS = {
    ink: 'var(--text)',
    accent: 'var(--accent)',
    aux: '#FF9F0A',
    auxInk: 'var(--text-secondary)',
    up: '#2FB86A',
    down: '#FF3B30',
    curveA: 'var(--accent)',
    curveB: '#FF9F0A',
    curveC: '#2FB86A',
    fillA: 'color-mix(in srgb, var(--accent) 22%, transparent)',
    fillB: 'color-mix(in srgb, #FF9F0A 26%, transparent)'
};
export { COLORS };

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}
function sv(tag, attrs) {
    const n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
}
function resolve(v, env) {
    if (typeof v === 'function') return v(env);
    return v;
}
function num(v, env) {
    if (typeof v === 'function') return v(env);
    if (typeof v === 'string') {
        try { return evaluate(v, env); } catch (e) { return v; }
    }
    return v;
}
function colorExpr(c) { return COLORS[c] || c || COLORS.ink; }

/* Shallow copy, never mutate: writing the evaluated value back onto the
   lesson spec froze every dynamic pane after its first render, which is why
   graphs and step lists looked static. */
function dyn(g, env, fields) {
    if (!g) return g;
    const out = Object.assign({}, g);
    fields.forEach(k => { if (typeof out[k] === 'function') out[k] = out[k](env); });
    return out;
}

// ---------------- GraphView ----------------
// spec: { window:[x0,x1,y0,y1], grid, curves:[], points:[], secant, tangent,
//         area, vlines, hlines, hband, vband, labels, probe }
export function graph(spec, env, host, ctx) {
    const g = dyn(resolve(spec, env), env, ['curves', 'points', 'segments', 'tangents', 'vlines', 'hlines', 'areas', 'notes', 'hband', 'vband', 'window', 'height', 'triangle']);
    const W = g.width || 560, H = g.height || 340;
    const [x0, x1, y0, y1] = g.window;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cv-graph' });
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.touchAction = 'none';

    const px = x => (x - x0) / (x1 - x0) * W;
    const py = y => H - (y - y0) / (y1 - y0) * H;
    const inv = { x: p => x0 + p / W * (x1 - x0), y: p => y0 + (H - p) / H * (y1 - y0) };

    const defs = sv('defs');
    const clip = sv('clipPath', { id: 'clip-' + Math.random().toString(36).slice(2) });
    clip.appendChild(sv('rect', { x: 0, y: 0, width: W, height: H }));
    defs.appendChild(clip);
    /* Arrow markers for line/segment arrows */
    defs.appendChild(sv('marker', { id: 'arrow-head', markerWidth: 8, markerHeight: 6, refX: 7, refY: 3, fill: 'var(--text-secondary)', orient: 'auto' }, sv('path', { d: 'M0,0 L8,3 L0,6 Z' })));
    svg.appendChild(defs);
    const clipId = 'url(#' + clip.getAttribute('id') + ')';

    if (g.grid !== false) {
        const gg = sv('g', { class: 'cv-grid' });
        const gx = g.gridX || niceStep(x1 - x0), gy = g.gridY || niceStep(y1 - y0);
        for (let x = Math.ceil(x0 / gx) * gx; x <= x1; x += gx) gg.appendChild(sv('line', { x1: px(x), y1: 0, x2: px(x), y2: H }));
        for (let y = Math.ceil(y0 / gy) * gy; y <= y1; y += gy) gg.appendChild(sv('line', { x1: 0, y1: py(y), x2: W, y2: py(y) }));
        svg.appendChild(gg);
    }
    const axes = sv('g', { class: 'cv-axes' });
    if (y0 < 0 && y1 > 0) axes.appendChild(sv('line', { x1: 0, y1: py(0), x2: W, y2: py(0) }));
    if (x0 < 0 && x1 > 0) axes.appendChild(sv('line', { x1: px(0), y1: 0, x2: px(0), y2: H }));
    svg.appendChild(axes);

    if (g.ticks !== false) {
        const tg = sv('g', { class: 'cv-ticklabels' });
        const gx = g.gridX || niceStep(x1 - x0), gy = g.gridY || niceStep(y1 - y0);
        for (let x = Math.ceil(x0 / gx) * gx; x <= x1; x += gx) {
            if (Math.abs(x) < 1e-9) continue;
            const t = sv('text', { x: px(x), y: clampAxis(py(0) + 14, 12, H - 4), 'text-anchor': 'middle' });
            t.textContent = fmtTick(x);
            tg.appendChild(t);
        }
        for (let y = Math.ceil(y0 / gy) * gy; y <= y1; y += gy) {
            if (Math.abs(y) < 1e-9) continue;
            const t = sv('text', { x: clampAxis(px(0) + 6, 6, W - 30), y: py(y) + 4, 'text-anchor': 'start' });
            t.textContent = fmtTick(y);
            tg.appendChild(t);
        }
        svg.appendChild(tg);
    }

    const body = sv('g', { 'clip-path': clipId });
    svg.appendChild(body);

    /* Every label is queued, then placed once with collision avoidance:
       emitting them straight away let points drawn later land on top of
       earlier text, which is what made busy graphs unreadable. */
    const labels = [];
    const addLabel = (x, y, str, color, anchor, prio) => {
        const s = str === undefined || str === null ? '' : String(str);
        if (s) labels.push({ x, y, s, color, anchor: anchor || 'start', prio: prio === undefined ? 3 : prio });
    };

    if (g.hband) g.hband.forEach(b => {
        const a = num(b.from, env), bnd = num(b.to, env);
        body.appendChild(sv('rect', { x: 0, y: Math.min(py(a), py(bnd)), width: W, height: Math.abs(py(a) - py(bnd)), fill: colorExpr(b.color || 'fillA'), class: 'cv-band' }));
        if (b.label) addLabel(24, (py(a) + py(bnd)) / 2, b.label, b.labelColor || 'auxInk', 'start', 5);
    });
    if (g.vband) g.vband.forEach(b => {
        const a = num(b.from, env), bnd = num(b.to, env);
        body.appendChild(sv('rect', { x: Math.min(px(a), px(bnd)), y: 0, width: Math.abs(px(a) - px(bnd)), height: H, fill: colorExpr(b.color || 'fillA'), class: 'cv-band' }));
    });

    (g.vlines || []).forEach(v => {
        const x = num(v.x, env);
        if (!Number.isFinite(x)) return;
        body.appendChild(sv('line', { x1: px(x), y1: 0, x2: px(x), y2: H, class: 'cv-vline', stroke: colorExpr(v.color || 'auxInk'), 'stroke-dasharray': v.dash === false ? '' : '6 5' }));
        if (v.label) addLabel(px(x) + 5, 14, resolve(v.label, env), v.color || 'auxInk', 'start', 4);
    });
    (g.hlines || []).forEach(v => {
        const y = num(v.y, env);
        if (!Number.isFinite(y)) return;
        body.appendChild(sv('line', { x1: 0, y1: py(y), x2: W, y2: py(y), class: 'cv-vline', stroke: colorExpr(v.color || 'auxInk'), 'stroke-dasharray': v.dash === false ? '' : '6 5' }));
        if (v.label) addLabel(W - 8, py(y) - 5, resolve(v.label, env), v.color || 'auxInk', 'end', 4);
    });

    (g.areas || []).forEach(a => {
        const fn = fnOf(a.fn, env);
        const lo = num(a.from, env), hi = num(a.to, env);
        const base = a.baseline === undefined ? 0 : num(a.baseline, env);
        const topFn = a.topFn ? fnOf(a.topFn, env) : null;
        const n = a.samples || 140;
        const path = [];
        for (let i = 0; i <= n; i++) {
            const x = lo + (hi - lo) * i / n;
            const yTop = topFn ? topFn(x) : fn(x);
            path.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(yTop).toFixed(1)}`);
        }
        for (let i = n; i >= 0; i--) {
            const x = lo + (hi - lo) * i / n;
            const yBot = topFn ? fn(x) : base;
            path.push(`L${px(x).toFixed(1)},${py(yBot).toFixed(1)}`);
        }
        body.appendChild(sv('path', { d: path.join(' ') + ' Z', fill: colorExpr(a.color || 'fillA'), stroke: 'none', class: 'cv-area' }));
    });

    (g.curves || []).forEach(c => {
        const fn = fnOf(c.fn, env);
        const lo = c.from !== undefined ? num(c.from, env) : x0;
        const hi = c.to !== undefined ? num(c.to, env) : x1;
        const n = c.samples || Math.max(140, Math.round(W * 0.6));
        let d = '', pen = false, prevY = null;
        for (let i = 0; i <= n; i++) {
            const x = lo + (hi - lo) * i / n;
            let y = fn(x);
            if (typeof y !== 'number' || Number.isNaN(y) || !Number.isFinite(y)) { pen = false; prevY = null; continue; }
            if (prevY !== null && Math.abs(y - prevY) > (y1 - y0) * 3) pen = false;
            const X = px(x).toFixed(1), Y = clampNum(py(y), -2000, 2000).toFixed(1);
            d += (pen ? 'L' : 'M') + X + ',' + Y + ' ';
            pen = true; prevY = y;
        }
        const p = sv('path', { d, fill: 'none', class: 'cv-curve' + (c.emphasis ? ' emphasis' : ''), stroke: colorExpr(c.color || 'curveA') });
        if (c.dashed) p.setAttribute('stroke-dasharray', '7 5');
        if (c.width) p.setAttribute('stroke-width', c.width);
        body.appendChild(p);
        if (c.label) {
            const lx = c.labelAt !== undefined ? num(c.labelAt, env) : (lo + hi) / 2;
            const ly = fn(lx);
            if (Number.isFinite(ly)) addLabel(px(lx) + 6, py(ly) - 6, resolve(c.label, env), c.color || 'curveA', 'start', 2);
        }
    });

    (g.segments || []).forEach(s => {
        const xA = num(s.x1, env), yA = num(s.y1, env), xB = num(s.x2, env), yB = num(s.y2, env);
        if (![xA, yA, xB, yB].every(Number.isFinite)) return;
        const line = sv('line', { x1: px(xA), y1: py(yA), x2: px(xB), y2: py(yB), stroke: colorExpr(s.color || 'accent'), class: 'cv-seg' });
        if (s.dashed) line.setAttribute('stroke-dasharray', '6 5');
        if (s.extend) {
            const dx = xB - xA, dy = yB - yA;
            const k = s.extend;
            line.setAttribute('x1', px(xA - dx * k)); line.setAttribute('y1', py(yA - dy * k));
            line.setAttribute('x2', px(xB + dx * k)); line.setAttribute('y2', py(yB + dy * k));
        }
        /* Arrowheads on end/both */
        if (s.arrow === 'end') line.setAttribute('marker-end', 'url(#arrow-head)');
        else if (s.arrow === 'start') line.setAttribute('marker-start', 'url(#arrow-head)');
        else if (s.arrow === 'both') { line.setAttribute('marker-start', 'url(#arrow-head)'); line.setAttribute('marker-end', 'url(#arrow-head)'); }
        body.appendChild(line);
    });

    /* TangentLine: a slope read at one point. The slope is the teaching object
       here, so an infinite slope is drawn as a vertical line instead of
       collapsing, which is exactly what a circle does at (r, 0). */
    (g.tangents || []).forEach(t => {
        const tx = num(t.x, env);
        const ty = t.y !== undefined ? num(t.y, env) : (t.fn !== undefined ? fnOf(t.fn, env)(tx) : NaN);
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
        const m = t.m !== undefined ? num(t.m, env) : derivative(fnOf(t.fn, env), tx);
        const kx = W / (x1 - x0), ky = H / (y1 - y0);
        let vx, vy;
        if (Number.isFinite(m)) { vx = kx; vy = -m * ky; }
        else { vx = 0; vy = -1; }
        const norm = Math.hypot(vx, vy) || 1;
        const reach = (t.reach === undefined ? 0.34 : num(t.reach, env)) * Math.min(W, H);
        vx = vx / norm * reach; vy = vy / norm * reach;
        const sx = px(tx), sy = py(ty);
        const line = sv('line', { x1: sx - vx, y1: sy - vy, x2: sx + vx, y2: sy + vy, class: 'cv-seg', stroke: colorExpr(t.color || 'accent') });
        if (t.dashed) line.setAttribute('stroke-dasharray', '7 5');
        body.appendChild(line);
        if (t.label) addLabel(sx + vx + 4, sy + vy - 5, resolve(t.label, env), t.color || 'accent', 'start', 1);
    });

    if (g.triangle) {
        const t = g.triangle;
        const fn = fnOf(t.fn, env);
        const xa = num(t.x1, env), xb = num(t.x2, env);
        const run = xb - xa, rise = fn(xb) - fn(xa);
        const pts = `${px(xa)},${py(fn(xa))} ${px(xb)},${py(fn(xa))} ${px(xb)},${py(fn(xb))}`;
        body.appendChild(sv('polygon', { points: pts, class: 'cv-tri', stroke: colorExpr(t.color || 'auxInk'), fill: 'color-mix(in srgb, var(--text-secondary) 10%, transparent)' }));
        addLabel((px(xa) + px(xb)) / 2, py(fn(xa)) + (rise >= 0 ? 16 : -8), resolve(t.runLabel || ('Δx = ' + fmt(run)), env), 'auxInk', 'middle', 2);
        addLabel(px(xb) + 6, (py(fn(xa)) + py(fn(xb))) / 2, resolve(t.riseLabel || ('Δy = ' + fmt(rise)), env), t.color || 'accent', 'start', 2);
    }

    (g.points || []).forEach(p => {
        const x = num(p.x, env);
        let y = p.y !== undefined ? num(p.y, env) : (p.fn !== undefined ? fnOf(p.fn, env)(x) : NaN);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const c = sv('circle', { cx: px(x), cy: py(y), r: p.r || 5, class: 'cv-point' + (p.open ? ' open' : '') + (p.drag ? ' draggable' : ''), stroke: colorExpr(p.color || 'ink'), fill: p.open ? 'var(--card-bg)' : colorExpr(p.color || 'ink') });
        svg.appendChild(c);
        if (p.label) addLabel(px(x) + (p.labelDx || 8), py(y) + (p.labelDy || -8), resolve(p.label, env), p.labelColor || p.color || 'ink', 'start', 0);
        if (p.drag && host) attachDrag(c, p, env, svg, ctx, W, inv.x);
    });

    (g.notes || []).forEach(n => {
        addLabel(num(n.x, env) !== undefined ? px(num(n.x, env)) : 10, py(num(n.y, env)) - 8, resolve(n.t, env), n.color || 'auxInk', 'start', 1);
    });

    placeLabels(labels, W, H).forEach(L => {
        emitLabel(svg, L);
    });

    host.appendChild(svg);
    return svg;
}

const LABEL_FS = 14;
const LABEL_SMALL = 11;
/* the halo stroke grows every glyph box, so the layout keeps a pad around
   each label or the measured boxes still touch */
const LABEL_PAD = 4;
function labelWidth(s, fs) { return s.length * fs * 0.64; }
function emitLabel(svg, L) {
    const t = svgText(L.tx, L.ty, L.s, 'cv-label', L.color);
    if (L.fs && L.fs !== LABEL_FS) t.style.fontSize = L.fs + 'px';
    svg.appendChild(t);
}
function placeLabels(labels, W, H) {
    const taken = [];
    labels.slice().sort((a, b) => a.prio - b.prio).forEach(L => {
        let fs = LABEL_FS;
        const fits = () => labelWidth(L.s, fs) <= W - 8;
        if (!fits()) fs = LABEL_SMALL;
        const rowH = fs + 4;
        const w = Math.min(labelWidth(L.s, fs), W - 6);
        let x = L.anchor === 'end' ? L.x - w : L.anchor === 'middle' ? L.x - w / 2 : L.x;
        x = Math.max(3, Math.min(W - w - 3, x));
        const clash = (bx, by, bw) => taken.some(t =>
            bx - LABEL_PAD < t.x + t.w + LABEL_PAD && bx + bw + LABEL_PAD > t.x - LABEL_PAD &&
            by - LABEL_PAD < t.y + t.h + LABEL_PAD && by + rowH + LABEL_PAD > t.y - LABEL_PAD);
        const base = L.y - fs * 0.78;
        let y = base;
        if (clash(x, base, w)) {
            /* escape vertically first, then diagonally: a label whose whole
               column is crowded still has to land somewhere readable */
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
            outer: for (let step = 1; step <= 16; step++) {
                for (const d of dirs) {
                    const cy2 = base + d[0] * step * (rowH + LABEL_PAD);
                    const cx2 = x + d[1] * step * Math.max(16, w * 0.3);
                    if (cx2 < 3 || cx2 + w > W - 3) continue;
                    if (cy2 < 2 || cy2 + rowH > H - 2) continue;
                    if (!clash(cx2, cy2, w)) { x = cx2; y = cy2; break outer; }
                }
            }
        }
        const cy = Math.max(2, Math.min(H - rowH - 2, y));
        taken.push({ x, y: cy, w, h: rowH });
        L.tx = x;
        L.ty = cy + fs * 0.78;
        L.fs = fs;
    });
    return labels;
}

/* Drag listeners live on window, not on the dot: the light redraw replaces
   the circle (and its svg) mid-gesture, so the gesture must find the LIVE
   graph again on every move instead of measuring the detached node, which
   used to leave the value stuck after the first move. */
function attachDrag(circle, p, env, svg, ctx, W, invX) {
    circle.style.touchAction = 'none';
    circle.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        const slot = Array.prototype.indexOf.call(
            document.querySelectorAll('svg.cv-graph'), svg);
        let active = true, lastAt = 0;
        const liveSvg = () => {
            if (svg.isConnected) return svg;
            const all = document.querySelectorAll('svg.cv-graph');
            return all[slot < 0 ? all.length - 1 : slot] || svg;
        };
        const apply = mv => {
            lastAt = performance.now();
            const rect = liveSvg().getBoundingClientRect();
            if (!rect.width) return;
            let val = invX((mv.clientX - rect.left) / rect.width * W);
            if (p.drag.transform) val = p.drag.transform(env, val);
            const lo = p.drag.min !== undefined ? num(p.drag.min, env) : -Infinity;
            const hi = p.drag.max !== undefined ? num(p.drag.max, env) : Infinity;
            val = Math.max(lo, Math.min(hi, val));
            if (p.drag.snap) val = Math.round(val / p.drag.snap) * p.drag.snap;
            if (ctx.dragFrame) ctx.dragFrame(p.drag.key, val, env);
            else ctx.setParam(p.drag.key, val);
        };
        const onMove = mv => {
            if (!active) return;
            /* ~8ms floor keeps redraws at interactive rate without
               waiting on a frame callback (background tabs pause rAF) */
            if (performance.now() - lastAt >= 8) apply(mv);
        };
        const finish = () => {
            if (!active) return;
            active = false;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', finish);
            ctx.render();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);
    });
}

function svgText(x, y, str, cls, color) {
    const t = sv('text', { x, y, class: cls });
    t.textContent = str;
    if (color) t.style.fill = colorExpr(color);
    return t;
}
function fnOf(spec, env) {
    if (typeof spec === 'function') return x => spec(x, env);
    if (typeof spec === 'string') {
        if (typeof env[spec] === 'function') return x => env[spec](x, env);
        const f = compileFn(spec, 'x');
        return x => f(x, env);
    }
    throw new Error('bad fn');
}
function niceStep(range) {
    const raw = range / 8;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / pow;
    return (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * pow;
}
function fmtTick(v) { return Math.abs(v) < 1e-9 ? '0' : fmt(v, 2); }
function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }
function clampAxis(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---------------- NumberLineView ----------------
export function numberline(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["probes","bands","window"]);
    const W = g.width || 560, H = 90;
    const [x0, x1] = g.window;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cv-graph' });
    svg.style.width = '100%';
    const px = x => 20 + (x - x0) / (x1 - x0) * (W - 40);
    const mid = H / 2;
    const labels = [];
    const addLabel = (x, y, str, color, anchor, prio) => {
        const s = str === undefined || str === null ? '' : String(str);
        if (s) labels.push({ x, y, s, color, anchor: anchor || 'start', prio: prio === undefined ? 3 : prio });
    };
    svg.appendChild(sv('line', { x1: 10, y1: mid, x2: W - 10, y2: mid, class: 'cv-axis-h' }));
    const step = g.step || niceStep(x1 - x0);
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) {
        svg.appendChild(sv('line', { x1: px(x), y1: mid - 5, x2: px(x), y2: mid + 5, class: 'cv-axis-h' }));
        const t = svgText(px(x), mid + 22, fmtTick(x), 'cv-ticktext');
        svg.appendChild(t);
    }
    (g.bands || []).forEach(b => {
        svg.appendChild(sv('line', { x1: px(num(b.from, env)), y1: mid, x2: px(num(b.to, env)), y2: mid, stroke: colorExpr(b.color || 'accent'), 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.85 }));
        if (b.label) addLabel((px(num(b.from, env)) + px(num(b.to, env))) / 2, mid - 12, resolve(b.label, env), b.color || 'accent', 'middle', 2);
    });
    (g.probes || []).forEach(p => {
        const x = num(p.x, env);
        if (!Number.isFinite(x)) return;
        svg.appendChild(sv('path', { d: `M ${px(x)},${mid - 26} l 6,-10 h -12 Z`, fill: colorExpr(p.color || 'ink') }));
        if (p.label) addLabel(px(x), mid - 40, resolve(p.label, env), p.color || 'ink', 'middle', 0);
    });
    placeLabels(labels, W, H).forEach(L => {
        emitLabel(svg, L);
    });
    host.appendChild(svg);
}

// ---------------- TableView ----------------
export function table(spec, env, host) {
    const g = resolve(spec, env);
    const wrap = el('div', 'cv-tablewrap');
    const t = el('table', 'math-table cv-table');
    const head = el('tr');
    (resolve(g.cols, env) || []).forEach(c => head.appendChild(el('th', '', resolve(c, env))));
    t.appendChild(head);
    (resolve(g.rows, env) || []).forEach((r, ri) => {
        const tr = el('tr', g.hlRow === ri ? 'cv-hl' : '');
        r.forEach(cell => {
            const v = typeof cell === 'object' && cell !== null ? num(cell.v, env) : num(cell, env);
            const td = el('td', 'res');
            if (typeof cell === 'object' && cell.color) td.style.color = colorExpr(cell.color);
            if (typeof cell === 'object' && cell.bold) td.style.fontWeight = '700';
            td.textContent = typeof v === 'number' ? fmt(v, g.digits || 3) : String(v);
            tr.appendChild(td);
        });
        t.appendChild(tr);
    });
    wrap.appendChild(t);
    if (g.note) wrap.appendChild(el('div', 'str-note', resolve(g.note, env)));
    host.appendChild(wrap);
}

// ---------------- EquationView / EquationStepView ----------------
export function equation(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["lines"]);
    const box = el('div', 'cv-eq');
    (g.lines || []).forEach(ln => {
        const line = el('div', 'cv-eqline' + (ln.hl ? ' hl' : '') + (ln.dim ? ' dim' : ''), resolve(ln.t, env));
        if (ln.color) line.style.color = colorExpr(ln.color);
        if (ln.rule) line.appendChild(el('span', 'cv-eqrule', resolve(ln.rule, env)));
        box.appendChild(line);
    });
    host.appendChild(box);
}

// ---------------- Readout ----------------
export function readout(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["items"]);
    const row = el('div', 'cv-readout');
    (g.items || []).forEach(it => {
        const cell = el('div', 'cv-ro' + (it.big ? ' big' : ''));
        cell.appendChild(el('span', 'cv-ro-label', resolve(it.label, env)));
        const v = num(it.v, env);
        const valEl = el('span', 'cv-ro-val', typeof v === 'number' ? fmt(v, it.digits || 3) : String(v));
        if (it.color) {
            const c = typeof it.color === 'function' ? it.color(env, v) : it.color;
            valEl.style.color = colorExpr(c);
        }
        cell.appendChild(valEl);
        if (it.unit) cell.appendChild(el('span', 'cv-ro-unit', resolve(it.unit, env)));
        row.appendChild(cell);
    });
    host.appendChild(row);
}

// ---------------- ConditionChecklist ----------------
export function checklist(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["items","verdict"]);
    const box = el('div', 'cv-check');
    (g.items || []).forEach(it => {
        const state = num(it.state, env);
        const cls = state === true || state === 'pass' ? 'pass' : state === 'na' ? 'na' : 'fail';
        const row = el('div', 'cv-checkrow ' + cls);
        row.appendChild(el('span', 'cv-checkmark', cls === 'pass' ? '✓' : cls === 'na' ? '—' : '✗'));
        row.appendChild(el('span', 'cv-checktext', resolve(it.t, env)));
        box.appendChild(row);
    });
    if (g.verdict) {
        const v = el('div', 'truth-verdict ' + (num(g.verdictOk, env) ? 'ok' : 'no'), resolve(g.verdict, env));
        box.appendChild(v);
    }
    host.appendChild(box);
}

// ---------------- FunctionMachine ----------------
export function machine(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["stages"]);
    const row = el('div', 'cv-machine');
    (g.stages || []).forEach((s, i) => {
        if (i > 0) row.appendChild(el('span', 'pipe-sep', '→'));
        const st = el('div', 'cv-mstage' + (num(g.focus, env) === i ? ' active' : ''));
        st.appendChild(el('div', 'cv-mbox', resolve(s.box, env)));
        if (s.in !== undefined) st.appendChild(el('div', 'cv-mval', resolve(s.in, env)));
        if (s.out !== undefined) st.appendChild(el('div', 'cv-mval out', resolve(s.out, env)));
        if (s.rate) st.appendChild(el('div', 'cv-mrate', resolve(s.rate, env)));
        row.appendChild(st);
    });
    host.appendChild(row);
}

// ---------------- ExpressionTree ----------------
export function tree(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["root","focus"]);
    const focus = g.focus !== undefined ? num(g.focus, env) : null;
    function node(n, depth) {
        const wrap = el('div', 'cv-tnode-wrap');
        const box = el('div', 'cv-tnode' + (focus === n.id ? ' focus' : '') + (n.dim ? ' dim' : ''));
        box.appendChild(el('div', 'cv-texpr', resolve(n.e, env)));
        if (n.rule) box.appendChild(el('div', 'cv-trule', resolve(n.rule, env)));
        if (n.v !== undefined) {
            const v = num(n.v, env);
            box.appendChild(el('div', 'cv-tval', typeof v === 'number' ? fmt(v) : String(v)));
        }
        wrap.appendChild(box);
        if (n.children && n.children.length) {
            const kids = el('div', 'cv-tkids');
            n.children.forEach(c => kids.appendChild(node(c, depth + 1)));
            wrap.appendChild(kids);
        }
        return wrap;
    }
    host.appendChild(node(g.root, 0));
}

// ---------------- Geometry: rectangle area model (product rule) ----------------
export function rectarea(spec, env, host) {
    const g = dyn(resolve(spec, env), env, ["labels","note"]);
    const W = g.width || 420, H = g.height || 340;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cv-graph' });
    svg.style.width = '100%';
    const f = num(g.f, env), fg = num(g.fg, env), df = num(g.df, env), dfg = num(g.dfg, env);
    const scale = Math.min((W - 90) / Math.max(f + df, 0.001), (H - 90) / Math.max(fg + dfg, 0.001));
    const ox = 50, oy = H - 50;
    const rw = f * scale, rh = fg * scale, dw = df * scale, dh = dfg * scale;
    const r = (x, y, w, h, fill, stroke) => {
        const rect = sv('rect', { x, y: y - h, width: Math.max(w, 1), height: Math.max(h, 1), fill, stroke, 'stroke-width': 1.5 });
        svg.appendChild(rect);
    };
    r(ox, oy, rw, rh, 'color-mix(in srgb, var(--accent) 20%, transparent)', COLORS.accent);
    r(ox + rw, oy, dw, rh, 'color-mix(in srgb, #FF9F0A 30%, transparent)', COLORS.aux);
    r(ox, oy + rh, rw, dh, 'color-mix(in srgb, #2FB86A 26%, transparent)', COLORS.up);
    r(ox + rw, oy + rh, dw, dh, 'color-mix(in srgb, var(--text-secondary) 18%, transparent)', COLORS.auxInk);
    const labels = [];
    const lab = (x, y, t, anchor, color) => labels.push({ x, y, s: String(t), color, anchor: anchor || 'middle', prio: 1 });
    lab(ox + rw / 2, oy + 20, resolve(g.labels && g.labels.w, env) || 'f(x)', 'middle', 'accent');
    lab(ox - 8, oy - rh / 2, resolve(g.labels && g.labels.h, env) || 'g(x)', 'end', 'aux');
    lab(ox + rw + dw / 2, oy + 20, resolve(g.labels && g.labels.dw, env) || 'f′Δx', 'middle', 'up');
    lab(ox - 8, oy + rh + dh / 2, resolve(g.labels && g.labels.dh, env) || 'g′Δx', 'end', 'aux');
    lab(ox + rw / 2, oy - rh - 8, resolve(g.labels && g.labels.area, env) || 'f·g', 'middle', 'ink');
    if (g.note) labels.push({ x: ox, y: 24, s: String(resolve(g.note, env)), color: 'auxInk', anchor: 'start', prio: 2 });
    placeLabels(labels, W, H).forEach(L => {
        emitLabel(svg, L);
    });
    host.appendChild(svg);
}

// ---------------- ComparisonView ----------------
export function compare(spec, env, host, ctx) {
    const g = dyn(resolve(spec, env), env, ["sides","verdict"]);
    const grid = el('div', 'cv-compare');
    g.sides.forEach(side => {
        const col = el('div', 'cv-cmp-col' + (side.tone === 'wrong' ? ' wrong' : side.tone === 'right' ? ' right' : ''));
        col.appendChild(el('div', 'cv-cmp-title', resolve(side.title, env)));
        (side.lines || []).forEach(l => col.appendChild(el('div', 'cv-cmp-line', resolve(l, env))));
        if (side.graph) {
            const holder = el('div');
            col.appendChild(holder);
            graph(side.graph, env, holder, ctx);
        }
        grid.appendChild(col);
    });
    if (g.verdict) grid.appendChild(el('div', 'truth-verdict', resolve(g.verdict, env)));
    host.appendChild(grid);
}

// ---------------- Practice (decision / classify) ----------------
export function practice(spec, env, host, ctx) {
    const g = dyn(resolve(spec, env), env, ["items"]);
    const box = el('div', 'cv-practice');
    box.appendChild(el('div', 'mh-title', resolve(g.title || 'Practice', env)));
    (g.items || []).forEach((it, ii) => {
        const row = el('div', 'cv-pitem');
        row.appendChild(el('div', 'cv-pq', resolve(it.q, env)));
        const chosen = ctx.answer('practice:' + (g.id || 'default') + ':' + ii);
        const opts = el('div', 'prompt-choices');
        it.choices.forEach((c, ci) => {
            const b = el('button', 'prompt-choice', resolve(c, env));
            if (chosen !== undefined) {
                if (ci === it.a) b.classList.add('right');
                if (ci === chosen && chosen !== it.a) b.classList.add('wrong');
            }
            b.addEventListener('click', () => { ctx.setAnswer('practice:' + (g.id || 'default') + ':' + ii, ci); ctx.render(); });
            opts.appendChild(b);
        });
        row.appendChild(opts);
        if (chosen !== undefined) {
            const why = it.whyBy ? resolve(it.whyBy[chosen], env) : (chosen === it.a ? resolve(it.why, env) : 'Not this one. ' + resolve(it.why, env));
            row.appendChild(el('div', 'prompt-why' + (chosen === it.a ? ' ok' : ' no'), why));
        }
        box.appendChild(row);
    });
    host.appendChild(box);
}

// ---------------- Rate chain (linked interval map) ----------------
// spec: { steps:[{ name, axis, fn, center, half, band, bandLabel, riseLabel, gain, hinge:[a,b], color }],
//         focus, caption }
/* Each step is its own little window in its own units, so no two bars pretend to
   be comparable. The teaching object is the hinge: a step's rise is drawn in the
   same colour as the next step's run, which is what "multiply the rates" means. */
export function chain(spec, env, host, ctx) {
    const g = dyn(resolve(spec, env), env, ['steps', 'caption', 'focus']);
    const focus = g.focus === undefined ? null : num(g.focus, env);
    const steps = (g.steps || []).map(s => ({
        name: resolve(s.name, env), axis: resolve(s.axis, env), fn: s.fn,
        center: num(s.center, env), half: Math.abs(num(s.half, env)) || 1e-6,
        band: num(s.band, env), bandLabel: resolve(s.bandLabel, env),
        riseLabel: resolve(s.riseLabel, env), gain: s.gain === undefined ? '' : resolve(s.gain, env),
        hinge: Array.isArray(s.hinge) ? s.hinge.map(t => resolve(t, env)) : null,
        color: s.color || 'accent'
    }));
    const W = g.width || 660, H = g.height || 252, gap = 92;
    const pw = (W - gap * (steps.length - 1)) / Math.max(steps.length, 1);
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cv-graph' });
    svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.display = 'block';
    /* top leaves room for the name and gain labels above the frame; 40 keeps a
       14px ascender inside the viewBox, which otherwise clips at the top edge */
    const base = H - 30, top = 40;

    steps.forEach((s, i) => {
        const ox = i * (pw + gap);
        const fn = fnOf(s.fn, env);
        const lo = s.center - s.half, hi = s.center + s.half;
        let mn = Infinity, mx = -Infinity;
        for (let k = 0; k <= 24; k++) {
            const y = fn(lo + (hi - lo) * k / 24);
            if (Number.isFinite(y)) { mn = Math.min(mn, y); mx = Math.max(mx, y); }
        }
        if (!Number.isFinite(mn)) { mn = 0; mx = 1; }
        if (mx - mn < 1e-9) { mn -= 0.5; mx += 0.5; }
        const padY = (mx - mn) * 0.16;
        mn -= padY; mx += padY;
        const px = v => ox + Math.max(0, Math.min(pw, (v - lo) / (hi - lo) * pw));
        const py = v => base - (v - mn) / (mx - mn) * (base - top);

        const panel = sv('g', { class: 'cv-cpanel' + (focus === i ? ' focus' : '') });
        panel.appendChild(sv('rect', { x: ox, y: top - 18, width: pw, height: base - top + 24, rx: 8, class: 'cv-cframe' }));
        const x0 = s.center, x1 = s.center + s.band;
        const y0 = fn(x0), y1 = fn(x1);
        /* the band: the run this layer receives */
        panel.appendChild(sv('rect', {
            x: Math.min(px(x0), px(x1)), y: top - 14,
            width: Math.max(2, Math.abs(px(x1) - px(x0))), height: base - top + 18,
            fill: colorExpr(s.color), opacity: 0.13
        }));
        /* the curve */
        let d = '';
        for (let k = 0; k <= 40; k++) {
            const x = lo + (hi - lo) * k / 40, y = fn(x);
            d += (k === 0 ? 'M' : 'L') + px(x).toFixed(1) + ',' + (Number.isFinite(y) ? clampNum(py(y), -1e3, 1e3).toFixed(1) : '0') + ' ';
        }
        panel.appendChild(sv('path', { d, class: 'cv-curve', stroke: colorExpr('curveA') }));
        /* the rise this layer hands to the next */
        if (Number.isFinite(y0) && Number.isFinite(y1)) {
            panel.appendChild(sv('line', { x1: px(x0), y1: py(y0), x2: px(x1), y2: py(y1), class: 'cv-seg', stroke: colorExpr(s.color) }));
            panel.appendChild(sv('line', { x1: px(x0), y1: py(y0), x2: px(x0), y2: py(y1), stroke: colorExpr(s.color), 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
            panel.appendChild(sv('circle', { cx: px(x0), cy: py(y0), r: 4, fill: colorExpr(s.color) }));
        }
        const t1 = sv('text', { x: ox, y: top - 24, class: 'cv-label', fill: colorExpr('ink') });
        t1.textContent = s.name;
        panel.appendChild(t1);
        const t2 = sv('text', { x: ox, y: base + 16, class: 'cv-ticktext' });
        t2.textContent = s.bandLabel;
        panel.appendChild(t2);
        const t3 = sv('text', { x: ox + pw, y: base + 16, class: 'cv-ticktext', 'text-anchor': 'end' });
        t3.textContent = s.riseLabel;
        panel.appendChild(t3);
        if (s.gain) {
            const t4 = sv('text', { x: ox + pw, y: top - 24, class: 'cv-cgain', 'text-anchor': 'end' });
            t4.textContent = s.gain;
            panel.appendChild(t4);
        }
        svg.appendChild(panel);

        /* the hinge: this layer's rise is the next layer's run */
        if (i < steps.length - 1) {
            const nx = (i + 1) * (pw + gap);
            const ay = (top + base) / 2;
            svg.appendChild(sv('path', {
                d: `M ${ox + pw + 4},${ay} L ${nx - 10},${ay}`, class: 'cv-chinge',
                'marker-end': ''
            }));
            svg.appendChild(sv('path', { d: `M ${nx - 16},${ay - 5} L ${nx - 8},${ay} L ${nx - 16},${ay + 5}`, class: 'cv-chinge' }));
            const ht = sv('text', { x: (ox + pw + nx) / 2, y: ay - 9, class: 'cv-chingelabel', 'text-anchor': 'middle' });
            ht.textContent = s.hinge ? s.hinge[0] : s.riseLabel;
            svg.appendChild(ht);
            const ht2 = sv('text', { x: (ox + pw + nx) / 2, y: ay + 17, class: 'cv-chingelabel', 'text-anchor': 'middle' });
            ht2.textContent = s.hinge ? (s.hinge[1] || '') : 'becomes the run';
            svg.appendChild(ht2);
        }
    });
    host.appendChild(svg);
    if (g.caption) host.appendChild(el('div', 'cv-ccaption', resolve(g.caption, env)));
}

export const RENDERERS = {
    graph, numberline, table, equation, eq: equation, readout, checklist, machine, chain, tree, rectarea, compare, practice,
    note: (spec, env, host) => {
        const g = dyn(resolve(spec, env), env, ['text']);
        const box = el('div', 'cv-note' + (g.tone === 'warn' ? ' warn' : ''), resolve(g.text, env));
        host.appendChild(box);
    },
    playbar: (spec, env, host, ctx) => {
        // This will be overridden by lesson-specific implementation
        const row = el('div', 'cv-readout');
        row.textContent = 'Play control';
        host.appendChild(row);
    },
    particleTrail: (spec, env, host, ctx) => {
        const wrap = el('div', 'cv-trail-container');
        
        const title = el('h3', 'cv-section-title', 'Particle trail');
        wrap.appendChild(title);
        
        const subtitle = el('p', 'cv-subtitle', 'One dot every ' + r2(env.trail?.D || 0.18) + ' s');
        wrap.appendChild(subtitle);
        
        const viz = el('div', 'cv-trail-viz');
        
        const origin = el('div', 'cv-origin', 'origin');
        viz.appendChild(origin);
        
        const dots = el('div', 'cv-dots');
        
        (env.trail?.pts || []).forEach((p, i) => {
            const isNow = i === 0;
            const dot = el('div', 'cv-dot' + (isNow ? ' cv-now' : ''));
            
            const dotCircle = el('div', 'cv-dot-circle');
            if (isNow) {
                dotCircle.textContent = '●';
                dotCircle.style.fontSize = '20px';
            } else {
                dotCircle.textContent = '•';
            }
            dot.appendChild(dotCircle);
            
            const vt = Math.abs(p.v) > 0.1 ? p.v : 0;
            if (Math.abs(vt) > 0.1) {
                const arrow = el('div', 'cv-arrow cv-v-arrow');
                arrow.style.width = Math.min(Math.abs(vt) * 30, 80) + 'px';
                arrow.innerHTML = '<span style="font-size:12px;line-height:1">←</span>';
                if (vt > 0) arrow.style.flexDirection = 'row-reverse';
                else arrow.style.flexDirection = 'row';
                dot.appendChild(arrow);
            }
            
            const at = Math.abs(p.a) > 0.1 && i === 0 ? p.a : 0;
            if (Math.abs(at) > 0.1 && i === 0) {
                const arrow = el('div', 'cv-arrow cv-a-arrow');
                arrow.style.width = Math.min(Math.abs(at) * 40, 80) + 'px';
                arrow.innerHTML = '<span style="font-size:12px;line-height:1">←</span>';
                if (at > 0) {
                    arrow.style.flexDirection = 'row-reverse';
                } else {
                    arrow.style.flexDirection = 'row';
                }
                dot.appendChild(arrow);
            }
            
            if (isNow) {
                const nowLabel = el('div', 'cv-now-label', 'Now');
                dot.appendChild(nowLabel);
            }
            
            dots.appendChild(dot);
        });
        
        viz.appendChild(dots);
        
        const status = el('div', 'cv-status-summary');
        const vt = env.vt || 0;
        const at = env.at || 0;
        const movingLeft = vt < -0.05;
        const speedingUp = (vt > 0 && at > 0) || (vt < 0 && at < 0);
        status.textContent = movingLeft ? 'Moving left' : 'Moving right';
        if (speedingUp) {
            const span = el('span', 'cv-speed-indicator up', '· gaps widening');
            status.appendChild(span);
        } else if (!env.rest && Math.abs(at) > 0.05) {
            const span = el('span', 'cv-speed-indicator down', '· gaps narrowing');
            status.appendChild(span);
        }
        viz.appendChild(status);
        
        const readout = el('div', 'cv-quick-readout');
        const vVal = r2(vt);
        const aVal = r2(at);
        readout.innerHTML = `
            <div class="cv-v-metric"><span class="cv-v-label">v</span><span class="cv-v-value">${vVal}</span></div>
            <div class="cv-a-metric"><span class="cv-a-label">a</span><span class="cv-a-value">${aVal}</span></div>
        `;
        viz.appendChild(readout);
        
        wrap.appendChild(viz);
        host.appendChild(wrap);
    },
    predictionBox: (spec, env, host, ctx) => {
        const box = el('div', 'prediction-box');
        const q = el('div', 'pred-q', env.steps?.[env.stage]?.predict?.q || 'Click to answer');
        box.appendChild(q);
        
        const choices = el('div', 'prompt-choices');
        (env.steps?.[env.stage]?.predict?.choices || []).forEach((c, i) => {
            const b = el('button', 'prompt-choice', resolve(c, env));
            b.addEventListener('click', () => { 
                ctx.setAnswer('predict:' + env.stage, i); 
                ctx.render(); 
            });
            choices.appendChild(b);
        });
        box.appendChild(choices);
        
        host.appendChild(box);
    }
};

function r2(v) { return String(Math.round(v * 100) / 100); }
