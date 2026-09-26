/* 4.2 Derivative Motion Lab — Refactored per 4.2 redesign.
   Core principle: one instant at a time. The timeline, dot spacing, and three
   stacked graphs are all views of the same state. Velocity and acceleration are
   drawn as arrows on the particle; spacing on the trail shows speeding/slowing.
   No rules to memorize — the math lives in what students can manipulate.
*/

import { RENDERERS } from '../../js/calc-components.js?v=20260925-calc-19';

RENDERERS.playbar = function (spec, env, host, ctx) {
    const row = document.createElement('div');
    row.className = 'cv-timeline-bar';
    
    // Play button
    const btn = document.createElement('button');
    btn.className = 'wbtn cv-play-btn';
    btn.textContent = 'Play';
    const clock = document.createElement('span');
    clock.className = 'cv-ro-val cv-time-display';
    clock.textContent = 't = ' + r2(env.tt) + ' s';
    
    // Time slider container
    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'cv-slider-wrap';
    
    // Landmark markers (clickable jumps)
    const landmarks = document.createElement('div');
    landmarks.className = 'cv-landmarks';
    const landMarks = [
        { pos: 1, label: '1', desc: 'turnaround' },
        { pos: 2, label: '2', desc: 'a = 0' },
        { pos: 3, label: '3', desc: 'turnaround' }
    ];
    landMarks.forEach(m => {
        const mark = document.createElement('button');
        mark.className = 'cv-landmark';
        mark.textContent = m.label;
        mark.title = m.desc;
        mark.addEventListener('click', () => {
            ctx.setParam('preset', 'none');
            ctx.setParam('t', m.pos);
            clock.textContent = 't = ' + r2(m.pos) + ' s';
            if (host.__u4timer) {
                clearInterval(host.__u4timer);
                host.__u4timer = null;
                btn.textContent = 'Play';
            }
        });
        landmarks.appendChild(mark);
    });
    
    // Gap indicator
    const gapInfo = document.createElement('span');
    gapInfo.className = 'cv-gap-info';
    gapInfo.textContent = 'Δt = ' + r2(env.trail.D) + ' s';
    
    row.append(btn, clock, sliderWrap, landmarks, gapInfo);
    host.appendChild(row);
    
    let cur = env.tt;
    const stop = () => { 
        if (host.__u4timer) { 
            clearInterval(host.__u4timer); 
            host.__u4timer = null; 
            btn.textContent = 'Play'; 
        } 
    };
    
    btn.addEventListener('click', () => {
        if (host.__u4timer) { 
            stop(); 
            return; 
        }
        ctx.setParam('preset', 'none');
        btn.textContent = 'Pause';
        host.__u4timer = setInterval(() => {
            if (!host.isConnected || !ctx.dragFrame) { 
                stop(); 
                return; 
            }
            cur = cur + 0.03 > 4 ? 0 : cur + 0.03;
            ctx.dragFrame('t', cur);
            clock.textContent = 't = ' + r2(cur) + ' s';
        }, 45);
    });
};

// Particle trail renderer with velocity/acceleration arrows
RENDERERS.particleTrail = function (spec, env, host, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cv-trail-container';
    
    const title = document.createElement('h3');
    title.className = 'cv-section-title';
    title.textContent = 'Particle trail';
    wrap.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'cv-subtitle';
    subtitle.textContent = 'One dot every ' + r2(env.trail.D) + ' s';
    wrap.appendChild(subtitle);
    
    // Main visualization area
    const viz = document.createElement('div');
    viz.className = 'cv-trail-viz';
    
    // Origin marker
    const origin = document.createElement('div');
    origin.className = 'cv-origin';
    origin.textContent = 'origin';
    viz.appendChild(origin);
    
    // Trail dots with velocity/acceleration arrows
    const dots = document.createElement('div');
    dots.className = 'cv-dots';
    
    env.trail.pts.forEach((p, i) => {
        const isNow = i === 0;
        const dot = document.createElement('div');
        dot.className = 'cv-dot' + (isNow ? ' cv-now' : '');
        
        // Position dot
        const dotCircle = document.createElement('div');
        dotCircle.className = 'cv-dot-circle';
        dotCircle.style.left = (p.s * 100 + '%').replace(/(\d+\.\d+).*$/, '$1');
        if (isNow) {
            dotCircle.textContent = '●';
            dotCircle.style.fontSize = '20px';
        }
        dot.appendChild(dotCircle);
        
        // Velocity arrow
        const vArrow = Math.abs(p.v) > 0.1 ? p.v : 0;
        if (Math.abs(vArrow) > 0.1) {
            const arrow = document.createElement('div');
            arrow.className = 'cv-arrow cv-v-arrow';
            arrow.style.width = Math.min(Math.abs(vArrow) * 30, 80) + 'px';
            arrow.style.justifyContent = vArrow < 0 ? 'flex-start' : 'flex-end';
            arrow.innerHTML = '<span style="font-size:12px;line-height:1">←</span>';
            if (vArrow > 0) arrow.style.flexDirection = 'row-reverse';
            else arrow.style.flexDirection = 'row';
            dot.appendChild(arrow);
        }
        
        // Acceleration arrow (below v arrow)
        const aArrow = Math.abs(p.a) > 0.1 ? p.a : 0;
        if (Math.abs(aArrow) > 0.1 && i === 0) {
            const arrow = document.createElement('div');
            arrow.className = 'cv-arrow cv-a-arrow';
            arrow.style.width = Math.min(Math.abs(aArrow) * 40, 80) + 'px';
            arrow.innerHTML = '<span style="font-size:12px;line-height:1">←</span>';
            if (aArrow > 0) {
                arrow.style.flexDirection = 'row-reverse';
            } else {
                arrow.style.flexDirection = 'row';
            }
            dot.appendChild(arrow);
        }
        
        // Now label for current dot
        if (isNow) {
            const nowLabel = document.createElement('div');
            nowLabel.className = 'cv-now-label';
            nowLabel.textContent = 'Now';
            dot.appendChild(nowLabel);
        }
        
        dots.appendChild(dot);
    });
    
    viz.appendChild(dots);
    
    // Status summary
    const status = document.createElement('div');
    status.className = 'cv-status-summary';
    const vt = env.vt;
    const at = env.at;
    const movingLeft = vt < -0.05;
    const speedingUp = (vt > 0 && at > 0) || (vt < 0 && at < 0);
    status.textContent = movingLeft ? 'Moving left' : 'Moving right';
    if (speedingUp) {
        const span = document.createElement('span');
        span.className = 'cv-speed-indicator up';
        span.textContent = '· gaps widening';
        status.appendChild(span);
    } else if (!env.rest && Math.abs(at) > 0.05) {
        const span = document.createElement('span');
        span.className = 'cv-speed-indicator down';
        span.textContent = '· gaps narrowing';
        status.appendChild(span);
    }
    viz.appendChild(status);
    
    // Quick readout (v and a values)
    const readout = document.createElement('div');
    readout.className = 'cv-quick-readout';
    const vVal = r2(vt);
    const aVal = r2(at);
    readout.innerHTML = `
        <div class="cv-v-metric"><span class="cv-v-label">v</span><span class="cv-v-value">${vVal}</span></div>
        <div class="cv-a-metric"><span class="cv-a-label">a</span><span class="cv-a-value">${aVal}</span></div>
    `;
    viz.appendChild(readout);
    
    wrap.appendChild(viz);
    host.appendChild(wrap);
};

export default {
    id: 'u4-motion-lab',
    meta: { unit: 4, topic: '4.2', title: 'Straight-Line Motion: Connecting Position, Velocity, and Acceleration', visualizerTitle: 'Derivative Motion Lab' },
    intro: 'A particle moves along a straight line with position s(t) = t³ − 6t² + 9t feet, for 0 ≤ t ≤ 4 seconds.',
    params: { t: 0.4, d: 0.18, preset: 'none', stage: 1 },
    fns: {
        s: (t) => t * t * t - 6 * t * t + 9 * t,
        v: (t) => 3 * t * t - 12 * t + 9,
        a: (t) => 6 * t - 12
    },
    compute: (env) => {
        const t = env.preset === 'v0' ? 1 : env.preset === 'a0' ? 2 : env.preset === 'dir' ? 3 : env.t;
        const sub = Object.assign({}, env, { tt: t });
        const tr = trail(sub);
        const st = env.s(t), vt = env.v(t), at = env.a(t);
        const g = tr.gaps;
        let pattern = 'Drag the time slider or press Play.';
        if (g.length >= 2) {
            const ratio = g[0].len / (g[1].len || 1e-9);
            pattern = ratio > 1.04 ? 'gaps widening → speeding up'
                : ratio < 0.96 ? 'gaps narrowing → slowing down'
                    : 'steady speed';
        }
        return {
            tt: t, st, vt, at, speed: Math.abs(vt),
            trail: tr, pattern,
            rest: Math.abs(vt) < 0.05
        };
    },
    controls: [
        { key: 't', label: '', min: 0, max: 4, step: 0.02, unit: '' }
    ],
    panes: {
        main: [
            { kind: 'playbar' },
            {
                kind: 'particleTrail', title: null, height: 200
            },
            {
                kind: 'graph', title: 'Position s(t)', height: 120,
                window: [-0.15, 4.15, -0.7, 4.9], gridY: 1,
                curves: [{ fn: 's', color: 'curveA', label: 's(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 's = 0' }],
                vlines: [{ x: env => env.tt, color: 'ink', label: null }],
                points: (env) => [
                    { x: env.tt, fn: 's', color: 'accent', label: null, drag: { key: 't', min: 0, max: 4, snap: 0.02 } }
                ]
            },
            {
                kind: 'graph', title: 'Velocity v(t) = s′(t)', height: 100,
                window: [-0.15, 4.15, -4.5, 10], gridY: 2,
                curves: [{ fn: 'v', color: 'curveB', label: 'v(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 'v = 0' }],
                vlines: (env) => [{ x: env.tt, color: 'ink' }],
                points: (env) => [{ x: env.tt, fn: 'v', color: 'accent' }]
            },
            {
                kind: 'graph', title: 'Acceleration a(t) = v′(t)', height: 100,
                window: [-0.15, 4.15, -13, 13], gridY: 5,
                curves: [{ fn: 'a', color: 'curveC', label: 'a(t)' }],
                hlines: [{ y: 0, color: 'auxInk', label: 'a = 0' }],
                vlines: (env) => [{ x: env.tt, color: 'ink' }],
                points: (env) => [{ x: env.tt, fn: 'a', color: 'accent' }]
            }
        ],
        side: [
            {
                kind: 'readout', title: 'At this instant',
                items: env => [
                    { label: 'velocity v(t)', v: env.vt, unit: 'ft/s', big: true },
                    { label: 'acceleration a(t)', v: env.at, unit: 'ft/s²', big: true }
                ]
            },
            {
                kind: 'prediction-box', when: env => env.stage >= 2 && env.t >= 2.3 && env.t <= 2.5
            }
        ]
    },
    steps: [
        {
            params: { stage: 1, preset: 'none', t: 0.4, d: 0.18 },
            message: 'Drag the blue dot on any graph, or press Play. The top shows where the particle has been — one dot every ' + r2(0.18) + ' seconds.'
        },
        {
            params: { t: 2.4, d: 0.22, stage: 2 },
            predict: {
                q: 'The readout shows v < 0 and a > 0. What will happen to the spacing between the next few dots?',
                choices: ['Gaps will get wider', 'Gaps will get smaller', 'Gaps will stay the same'], a: 1,
                why: 'v < 0 means moving left, but a > 0 pushes velocity back toward zero (slowing it down). The gaps narrow as the particle slows.'
            },
            message: 'Answer first. Then watch: v and a have opposite signs, so the particle is slowing down while moving left.'
        },
        {
            params: { t: 1.5, stage: 2 },
            predict: {
                q: 'The particle is at s = 3.375 ft (right of origin) with v = −2.25 ft/s. Which way is it moving?',
                choices: ['Left', 'Right', 'Stopped'], a: 0,
                why: 'Direction comes from v, not s. Negative velocity means moving left, even though the position is positive.'
            },
            message: 'Position tells you where. Velocity tells you which way. These are different questions.'
        },
        {
            params: { preset: 'v0', stage: 2 },
            predict: {
                q: 'At t = 1 the velocity is v = 0. Is the particle at the origin (s = 0)?',
                choices: ['No. v = 0 doesn\'t mean s = 0', 'Yes. v = 0 always means origin', 'No. v = 0 also means a = 0'], a: 0,
                why: 'v = 0 means the particle is stopped for an instant, not that it is at position zero. Here s(1) = 4 ft.'
            },
            message: 'At rest moments the dots pile up because the flashes keep coming while the particle barely moves.'
        },
        {
            params: { preset: 'a0', stage: 2 },
            predict: {
                q: 'At t = 2 the acceleration is exactly 0 while v(2) = −3 ft/s. Is the particle stopped?',
                choices: ['No. Moving left at 3 ft/s with steady speed', 'Yes. a = 0 means stopped', 'Yes. a = 0 implies v = 0'], a: 0,
                why: 'Zero acceleration means velocity is not changing. The particle keeps moving left at 3 ft/s with equal gaps before and after.'
            },
            message: 'Equal gaps mean constant velocity (a = 0). The particle is still moving — just not speeding up or slowing down.'
        },
        {
            params: { preset: 'dir', stage: 2, d: 0.3 },
            predict: {
                q: 'At t = 3 the velocity is v = 0 again. Is this also a turnaround like t = 1?',
                choices: ['Yes. v changes sign around t = 3', 'No. v stays negative', 'Cannot tell from signs'], a: 0,
                why: 'At t = 3, v changes from negative (before) to positive (after). That is a turnaround — the particle reverses direction.'
            },
            message: 'Both t = 1 and t = 3 are turnaround points. At each, v = 0 but the particle is not at the origin.'
        },
        {
            params: { preset: 'none', t: 3.6, stage: 2, d: 0.18 },
            message: 'After the turn, both v and a are positive. The particle moves right and speeds up — the gaps widen again.'
        }
    ],
    summary: {
        idea: [
            'Position says where. Velocity gives direction and rate of change. Speed is |v|. Acceleration says how v is changing.',
            'Same signs for v and a → speeding up. Opposite signs → slowing down. Position never decides direction; a = 0 does not mean stopped.'
        ],
        mistake: 'Positive acceleration always means speeding up. With v < 0 and a > 0, the particle moves left while a pulls v toward zero — slowing down. Watch the gaps narrow.',
        transfer: 'Given v > 0, a < 0 and v < 0, a > 0: for each case, state direction, whether speeding/slowing, and describe the trail gap pattern.'
    }
};

function trail(env) {
    const D = Math.max(env.d, 0.03);
    const pts = [];
    const DOTS = 9;
    for (let k = 0; k < DOTS; k++) {
        const tk = env.tt - k * D;
        if (tk < -1e-9) break;
        pts.push({ 
            t: tk, 
            s: env.s(tk), 
            v: env.v(tk),
            a: env.a(tk)
        });
    }
    const gaps = [];
    for (let i = 0; i + 1 < pts.length; i++) {
        gaps.push({
            from: pts[i + 1].s, to: pts[i].s,
            len: Math.abs(pts[i].s - pts[i + 1].s),
            faster: Math.abs(pts[i].v) > Math.abs(pts[i + 1].v) + 1e-6
        });
    }
    return { D, pts, gaps };
}

function r2(v) { return String(Math.round(v * 100) / 100); }
