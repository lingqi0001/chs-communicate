// =====================================================================
//  VISUAL RESEARCH CANVAS ENGINE
// =====================================================================
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
let canvasNodes = {};  // { nodeId: { type, title, desc, url, longText, imageUrl, tagColor, x, y } }
let canvasEdges = [];  // [ { from, to, relation, label } ]
let canvasFrames = []; // [ { id, title, nodeIds, x, y, w, h } ]
let dragState = null;
let connectState = null;
let selectedNodeIds = new Set();
let lastCardClickTime = 0;
let lastCardClickId = null;
let canvasToolMode = 'hand';
let canvasZoom = 1;
let handPanState = null;
let panX = 0;
let panY = 0;
let marqueeState = null;

function genId() { return 'n' + Date.now() + Math.random().toString(36).substr(2, 5); }

function addCanvasNodePrompt(type) {
    const container = document.getElementById('canvas-container');
    const cx = (-panX + (container.clientWidth - 220) / 2) / canvasZoom;
    const cy = (-panY + (container.clientHeight - 120) / 2) / canvasZoom;
    openAddDrawer(type, cx, cy);
}

function openAddDrawer(type, cx, cy) {
    const titleEl = document.getElementById('details-drawer-title');
    if (titleEl) titleEl.innerText = 'ADD NODE';
    
    let typeOptions = `
        <option value="source" ${type === 'source' ? 'selected' : ''}>Source / Literature</option>
        <option value="theme" ${type === 'theme' ? 'selected' : ''}>Theme / Topic</option>
        <option value="note" ${type === 'note' ? 'selected' : ''}>Note / Memo</option>
    `;
    
    const body = document.getElementById('details-drawer-body');
    body.innerHTML = `
        <div class="field">
            <label>Node Type</label>
            <select id="dd-type" style="width: 100%; background: var(--bg); border: 1px solid var(--border); padding: 16px; border-radius: 14px; color: var(--text); font-size: 14px; outline: none;">
                ${typeOptions}
            </select>
        </div>
        <div class="field"><label>Title</label><input id="dd-title" autocomplete="off" placeholder="e.g. Climate Change"></div>
        <div class="field" id="dd-url-field" style="display: ${type === 'source' ? 'block' : 'none'};"><label>URL</label><input id="dd-url" autocomplete="off" placeholder="https://..."></div>
        <div class="field"><label>Description</label><textarea id="dd-desc" rows="3" placeholder="Enter description..."></textarea></div>
        <div class="field"><label>Long Notes</label><textarea id="dd-long" rows="8" placeholder="Enter long notes..."></textarea></div>
        <div class="field"><label>Image URL</label><input id="dd-image" placeholder="Image URL (optional)"></div>
        <div class="field"><label>Tag Color</label><input id="dd-tag" type="color" value="#3B82F6"></div>
        <div style="display:flex; gap:10px;">
            <button class="btn-mini btn-accent" id="dd-create-btn">CREATE</button>
            <button class="btn-mini" onclick="closeDetailsDrawer()">CANCEL</button>
        </div>`;
        
    const typeSelect = document.getElementById('dd-type');
    const urlField = document.getElementById('dd-url-field');
    typeSelect.onchange = () => {
        urlField.style.display = typeSelect.value === 'source' ? 'block' : 'none';
    };

    const createBtn = document.getElementById('dd-create-btn');
    createBtn.onclick = () => {
        const nodeType = typeSelect.value;
        const title = document.getElementById('dd-title').value.trim();
        if (!title) return;
        
        const desc = document.getElementById('dd-desc').value;
        const url = nodeType === 'source' ? document.getElementById('dd-url').value : '';
        const longText = document.getElementById('dd-long').value;
        const imageUrl = document.getElementById('dd-image').value;
        const tagColor = document.getElementById('dd-tag').value;
        
        const id = genId();
        canvasNodes[id] = { type: nodeType, title, desc, url, longText, imageUrl, tagColor, x: cx, y: cy };
        saveCanvasState();
        closeDetailsDrawer();
        renderCanvasFromState();
    };
    
    document.getElementById('details-drawer')?.classList.add('open');
}

function clampCanvasPan() {
    // Lock top-left boundary: do not allow panning further into negative space.
    panX = Math.min(0, panX);
    panY = Math.min(0, panY);
}

function updateCanvasTransform() {
    clampCanvasPan();
    const content = document.getElementById('canvas-content');
    if (content) {
        content.style.transform = `translate(${panX}px, ${panY}px) scale(${canvasZoom})`;
    }
    const label = document.getElementById('canvas-zoom-label');
    if (label) label.innerText = `${Math.round(canvasZoom * 100)}%`;
    renderMiniMap();
}

function renderCanvasFromState() {
    const container = document.getElementById('canvas-container');
    const contentEl = document.getElementById('canvas-content');
    const svg = document.getElementById('canvas-svg');
    
    if (container && !container.dataset.minimapBound) {
        container.addEventListener('contextmenu', (e) => {
            // Only suppress the browser menu on empty canvas background.
            if (e.target.closest('.canvas-node') || e.target.closest('.canvas-frame') || e.target.closest('.node-socket')) return;
            e.preventDefault();
        });

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.canvas-node') || e.target.closest('.canvas-frame') || e.target.closest('.node-socket')) return;
            
            // Right mouse button: temporary "other mode" without switching modes.
            // - In select mode: right-drag pans (temporary hand)
            // - In hand mode: right-drag box-selects (temporary select)
            if (e.button === 2) {
                if (canvasToolMode === 'hand') {
                    const rect = container.getBoundingClientRect();
                    const startX = (e.clientX - rect.left - panX) / canvasZoom;
                    const startY = (e.clientY - rect.top - panY) / canvasZoom;
                    
                    marqueeState = {
                        startX,
                        startY,
                        screenStartX: e.clientX,
                        screenStartY: e.clientY
                    };
                    
                    let box = document.getElementById('selection-box');
                    if (!box) {
                        box = document.createElement('div');
                        box.id = 'selection-box';
                        box.className = 'selection-box';
                        container.appendChild(box);
                    }
                    box.style.left = `${e.clientX - rect.left}px`;
                    box.style.top = `${e.clientY - rect.top}px`;
                    box.style.width = '0px';
                    box.style.height = '0px';
                    box.style.display = 'block';
                    e.preventDefault();
                    return;
                }

                handPanState = { startX: e.clientX, startY: e.clientY, panX: panX, panY: panY };
                container.style.cursor = 'grabbing';
                e.preventDefault();
                return;
            }

            if (canvasToolMode === 'hand') {
                handPanState = { startX: e.clientX, startY: e.clientY, panX: panX, panY: panY };
                container.style.cursor = 'grabbing';
                e.preventDefault();
            } else if (canvasToolMode === 'select') {
                const rect = container.getBoundingClientRect();
                const startX = (e.clientX - rect.left - panX) / canvasZoom;
                const startY = (e.clientY - rect.top - panY) / canvasZoom;
                
                marqueeState = {
                    startX,
                    startY,
                    screenStartX: e.clientX,
                    screenStartY: e.clientY
                };
                
                let box = document.getElementById('selection-box');
                if (!box) {
                    box = document.createElement('div');
                    box.id = 'selection-box';
                    box.className = 'selection-box';
                    container.appendChild(box);
                }
                box.style.left = `${e.clientX - rect.left}px`;
                box.style.top = `${e.clientY - rect.top}px`;
                box.style.width = '0px';
                box.style.height = '0px';
                box.style.display = 'block';
            }
        });

        container.addEventListener('dblclick', (e) => {
            if (e.target !== container && e.target !== svg && e.target.id !== 'canvas-content') return;
            const rect = container.getBoundingClientRect();
            const clickX = (e.clientX - rect.left - panX) / canvasZoom;
            const clickY = (e.clientY - rect.top - panY) / canvasZoom;
            openAddDrawer('note', clickX, clickY);
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const canvasX = (mouseX - panX) / canvasZoom;
            const canvasY = (mouseY - panY) / canvasZoom;
            
            // Trackpads (Chromebooks/Mac) emit many small wheel events; use an exponential mapping
            // so zoom speed is smooth and consistent across devices.
            const zoomIntensity = 0.002; // smaller = slower zoom
            const scale = Math.exp(-e.deltaY * zoomIntensity);
            canvasZoom = Math.max(0.25, Math.min(2, canvasZoom * scale));
            
            panX = mouseX - canvasX * canvasZoom;
            panY = mouseY - canvasY * canvasZoom;
            
            updateCanvasTransform();
        }, { passive: false });

        container.dataset.minimapBound = '1';
    }

    contentEl.querySelectorAll('.canvas-node').forEach(n => n.remove());
    contentEl.querySelectorAll('.canvas-frame').forEach(n => n.remove());
    svg.innerHTML = '';

    const keyword = (document.getElementById('canvas-search')?.value || '').trim().toLowerCase();

    canvasFrames.forEach(frame => {
        const frameEl = document.createElement('div');
        frameEl.className = 'canvas-frame';
        frameEl.id = 'cframe-' + frame.id;
        frameEl.style.left = frame.x + 'px';
        frameEl.style.top = frame.y + 'px';
        frameEl.style.width = frame.w + 'px';
        frameEl.style.height = frame.h + 'px';
        frameEl.innerHTML = `
            <div class="canvas-frame-title">${frame.title}</div>
            <button class="frame-del-btn" onclick="deleteCanvasFrame('${frame.id}')"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
            <div class="frame-resize-handle"></div>
        `;

        frameEl.addEventListener('mousedown', (e) => {
            if (e.target.closest('.frame-del-btn')) return;
            e.stopPropagation();

            if (e.target.classList.contains('frame-resize-handle')) {
                dragState = {
                    type: 'resize',
                    id: frame.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    startW: frame.w,
                    startH: frame.h
                };
            } else {
                refreshFrameMemberships();
                const latestFrame = canvasFrames.find(f => f.id === frame.id) || frame;
                const nodeIds = latestFrame.nodeIds || [];
                dragState = {
                    type: 'frame',
                    id: frame.id,
                    nodeIds: nodeIds,
                    startX: e.clientX,
                    startY: e.clientY,
                    startFrameX: frame.x,
                    startFrameY: frame.y,
                    originals: nodeIds.reduce((acc, nid) => {
                        if (canvasNodes[nid]) {
                            acc[nid] = { x: canvasNodes[nid].x, y: canvasNodes[nid].y };
                        }
                        return acc;
                    }, {})
                };
            }
            e.preventDefault();
        });

        contentEl.appendChild(frameEl);
    });

    Object.entries(canvasNodes).forEach(([id, node]) => {
        const el = document.createElement('div');
        el.className = `canvas-node ${node.type}-node`;
        el.id = 'cnode-' + id;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        
        if (node.tagColor) {
            el.style.borderColor = node.tagColor;
            el.style.boxShadow = `0 0 20px ${node.tagColor}40`;
        } else {
            el.style.borderColor = '';
            el.style.boxShadow = '';
        }

        const hit = !keyword || `${node.title} ${node.desc || ''} ${node.longText || ''} ${node.url || ''}`.toLowerCase().includes(keyword);
        if (!hit) el.classList.add('dimmed');

        if (selectedNodeIds.has(id)) el.classList.add('selected');

        const typeLabel = node.type === 'theme' ? 'THEME' : node.type === 'source' ? 'SOURCE' : 'NOTE';
        let domain = '';
        if (node.url) {
            try { domain = new URL(node.url.startsWith('http') ? node.url : 'https://' + node.url).hostname; } catch(e) { domain = node.url; }
        }

        el.innerHTML = `
            <button class="node-del-btn" style="right:28px" onclick="editCanvasNode('${id}')" title="Edit Card"><i data-lucide="pencil" style="width:11px; height:11px;"></i></button>
            <button class="node-del-btn danger-btn" onclick="deleteCanvasNode('${id}')" title="Delete Card"><i data-lucide="trash-2" style="width:11px; height:11px;"></i></button>
            <div style="font-size:9px; font-weight:900; color:var(--muted); text-transform:uppercase;">${typeLabel}</div>
            <div class="canvas-node-title">${escH(node.title)}</div>
            ${node.desc ? `<div class="canvas-node-desc">${escH(node.desc)}</div>` : ''}
            ${node.longText ? `<div class="canvas-node-desc" style="opacity:0.9; max-height:34px; overflow:hidden;">${escH(node.longText)}</div>` : ''}
            ${node.imageUrl ? `<div style="font-size:10px; color:var(--muted);">IMG: ${node.imageUrl}</div>` : ''}
            ${domain ? `<div style="font-size:10px; color:#3B82F6; cursor:pointer;" onclick="window.open('${formatUrl(node.url)}','_blank')">LINK ${domain}</div>` : ''}
            <div class="node-socket left-socket" data-id="${id}" title="Drop connection here"></div>
            <div class="node-socket" data-id="${id}" title="Drag to connect"></div>
            <div class="node-socket top-socket" data-id="${id}" title="Connect from top"></div>
            <div class="node-socket bottom-socket" data-id="${id}" title="Connect from bottom"></div>
        `;

        el.addEventListener('mousedown', (e) => {
            if (e.target.closest('.node-socket') || e.target.closest('.node-del-btn')) return;
            e.stopPropagation();

            const now = Date.now();
            if (lastCardClickId === id && now - lastCardClickTime < 300) {
                editCanvasNode(id);
                return;
            }
            lastCardClickTime = now;
            lastCardClickId = id;

            if (e.shiftKey) {
                if (selectedNodeIds.has(id)) selectedNodeIds.delete(id);
                else selectedNodeIds.add(id);
            } else {
                if (!selectedNodeIds.has(id)) {
                    selectedNodeIds = new Set([id]);
                }
            }
            
            const nodeIds = [...selectedNodeIds];
            dragState = {
                type: 'node',
                id,
                nodeIds,
                startX: e.clientX,
                startY: e.clientY,
                originals: nodeIds.reduce((acc, nid) => {
                    acc[nid] = { x: canvasNodes[nid].x, y: canvasNodes[nid].y };
                    return acc;
                }, {})
            };
            renderCanvasFromState();
        });

        contentEl.appendChild(el);
    });

    canvasEdges.forEach(edge => {
        drawEdge(svg, edge);
    });

    contentEl.querySelectorAll('.node-socket').forEach(socket => {
        socket.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            connectState = {
                fromId: socket.dataset.id,
                fromSocket: getSocketDirection(socket)
            };
        });
    });

    updateCanvasTransform();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getSocketDirection(socket) {
    if (socket.classList.contains('left-socket')) return 'LEFT';
    if (socket.classList.contains('top-socket')) return 'TOP';
    if (socket.classList.contains('bottom-socket')) return 'BOTTOM';
    return 'RIGHT';
}

function normalizeDirection(dir, fallback) {
    if (!dir) return fallback;
    const s = String(dir).toUpperCase();
    if (s.includes('LEFT')) return 'LEFT';
    if (s.includes('RIGHT')) return 'RIGHT';
    if (s.includes('TOP')) return 'TOP';
    if (s.includes('BOTTOM')) return 'BOTTOM';
    return fallback;
}

function getSocketCoordinates(nodeEl, direction) {
    const w = nodeEl.offsetWidth;
    const h = nodeEl.offsetHeight;
    const left = nodeEl.offsetLeft;
    const top = nodeEl.offsetTop;
    if (direction === 'LEFT') {
        return { x: left, y: top + h / 2 };
    } else if (direction === 'TOP') {
        return { x: left + w / 2, y: top };
    } else if (direction === 'BOTTOM') {
        return { x: left + w / 2, y: top + h };
    } else { // RIGHT
        return { x: left + w, y: top + h / 2 };
    }
}

function getEstimatedEndDirection(p0, mx, my) {
    const dx = mx - p0.x;
    const dy = my - p0.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx >= 0 ? 'LEFT' : 'RIGHT';
    } else {
        return dy >= 0 ? 'TOP' : 'BOTTOM';
    }
}

function getBezierControlPoints(p0, startDirection, p3, endDirection) {
    const directions = {
        'TOP': { x: 0, y: -1 },
        'BOTTOM': { x: 0, y: 1 },
        'LEFT': { x: -1, y: 0 },
        'RIGHT': { x: 1, y: 0 }
    };

    const d1 = directions[startDirection] || { x: 1, y: 0 };
    const d2 = directions[endDirection] || { x: -1, y: 0 };

    const dx = p3.x - p0.x;
    const dy = p3.y - p0.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let p1x = p0.x, p1y = p0.y;
    let p2x = p3.x, p2y = p3.y;

    if (d1.y === 0 && d2.y === 0) {
        // 【水平插槽互连】
        let isWrapAround = false;
        let needsAvoidance = false;

        // 精准判断是否真的需要“反向绕路”
        if (d1.x === 1 && d2.x === -1) {
            isWrapAround = dx < 40; // 只有当目标节点真的跑到左边（或者几乎贴脸）时，才算绕路
            needsAvoidance = isWrapAround;
        } else if (d1.x === -1 && d2.x === 1) {
            isWrapAround = dx > -40;
            needsAvoidance = isWrapAround;
        } else if (d1.x === d2.x) {
            isWrapAround = true;
            needsAvoidance = false; // 同侧相连自然会形成C型，不需要强制避让
        } else {
            isWrapAround = true;
        }

        if (isWrapAround) {
            const cpDist = Math.max(120, absDx * 0.5);
            p1x += d1.x * cpDist;
            p2x += d2.x * cpDist;

            if (needsAvoidance && absDy < 150) {
                // 修复核心：要形成包抄的U型，控制点必须往【同一个】方向推，而不是一上一下形成S型
                let drop = (dy >= 0 ? 1 : -1) * 80;
                if (dy === 0) drop = 80;
                p1y += drop;
                p2y += drop;
            }
        } else {
            // 【正常顺向连接】
            const cpDist = Math.max(80, absDx * 0.5);
            p1x += d1.x * cpDist;
            p2x += d2.x * cpDist;
        }

    } else if (d1.x === 0 && d2.x === 0) {
        // 【垂直插槽互连】（逻辑同上，方向互换）
        let isWrapAround = false;
        let needsAvoidance = false;

        if (d1.y === 1 && d2.y === -1) {
            isWrapAround = dy < 40;
            needsAvoidance = isWrapAround;
        } else if (d1.y === -1 && d2.y === 1) {
            isWrapAround = dy > -40;
            needsAvoidance = isWrapAround;
        } else if (d1.y === d2.y) {
            isWrapAround = true;
            needsAvoidance = false;
        } else {
            isWrapAround = true;
        }

        if (isWrapAround) {
            const cpDist = Math.max(120, absDy * 0.5);
            p1y += d1.y * cpDist;
            p2y += d2.y * cpDist;

            if (needsAvoidance && absDx < 260) {
                let drop = (dx >= 0 ? 1 : -1) * 120; // 卡片较宽，避让距离要大一点
                if (dx === 0) drop = 120;
                p1x += drop;
                p2x += drop;
            }
        } else {
            const cpDist = Math.max(80, absDy * 0.5);
            p1y += d1.y * cpDist;
            p2y += d2.y * cpDist;
        }
    } else {
        // 【混合插槽（如左连上）】：自然垂直正交，直接拉伸即可
        const cpDist1 = Math.max(80, absDx * 0.5, absDy * 0.5);
        const cpDist2 = Math.max(80, absDx * 0.5, absDy * 0.5);
        p1x += d1.x * cpDist1;
        p1y += d1.y * cpDist1;
        p2x += d2.x * cpDist2;
        p2y += d2.y * cpDist2;
    }

    return { p1: { x: p1x, y: p1y }, p2: { x: p2x, y: p2y } };
}

function calculateSmoothPath(startPoint, startDirection, endPoint, endDirection) {
    const { p1, p2 } = getBezierControlPoints(startPoint, startDirection, endPoint, endDirection);
    return `M ${startPoint.x} ${startPoint.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${endPoint.x} ${endPoint.y}`;
}

function getBezierMidpoint(p0, startDirection, p3, endDirection) {
    const { p1, p2 } = getBezierControlPoints(p0, startDirection, p3, endDirection);
    return {
        x: 0.125 * p0.x + 0.375 * p1.x + 0.375 * p2.x + 0.125 * p3.x,
        y: 0.125 * p0.y + 0.375 * p1.y + 0.375 * p2.y + 0.125 * p3.y
    };
}

function ensureEdgeMarkers(svg) {
    if (svg.querySelector('defs')) return;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<marker id="arrow-one" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#F59E0B"></path></marker><marker id="arrow-bi" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#22D3EE"></path></marker>`;
    svg.appendChild(defs);
}

function drawEdge(svg, edge) {
    const fromEl = document.getElementById('cnode-' + edge.from);
    const toEl = document.getElementById('cnode-' + edge.to);
    if (!fromEl || !toEl) return;

    const startDir = normalizeDirection(edge.fromSocket, 'RIGHT');
    const endDir = normalizeDirection(edge.toSocket, 'LEFT');
    const p0 = getSocketCoordinates(fromEl, startDir);
    const p3 = getSocketCoordinates(toEl, endDir);

    ensureEdgeMarkers(svg);
    const d = calculateSmoothPath(p0, startDir, p3, endDir);
    const handleDeleteEdge = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = await AppBridge.confirm('Delete Connection', 'Delete this connection?');
        if (!ok) return;
        canvasEdges = canvasEdges.filter(ed => !(ed.from === edge.from && ed.to === edge.to && (ed.label || '') === (edge.label || '') && (ed.relation || 'oneway') === (edge.relation || 'oneway')));
        saveCanvasState();
        renderCanvasFromState();
    };

    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', d);
    hitPath.setAttribute('class', 'canvas-line-hit');
    hitPath.addEventListener('click', handleDeleteEdge);
    svg.appendChild(hitPath);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', `canvas-line ${edge.relation === 'bidirectional' ? 'bidirectional' : ''}`);
    
    if (fromEl.classList.contains('dimmed') || toEl.classList.contains('dimmed')) {
        path.classList.add('dimmed');
    }

    path.setAttribute('marker-end', `url(#${edge.relation === 'bidirectional' ? 'arrow-bi' : 'arrow-one'})`);
    if (edge.relation === 'bidirectional') path.setAttribute('marker-start', 'url(#arrow-bi)');
    path.addEventListener('click', handleDeleteEdge);
    svg.appendChild(path);

    if (edge.label) {
        const mid = getBezierMidpoint(p0, startDir, p3, endDir);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${mid.x}`);
        text.setAttribute('y', `${mid.y - 8}`);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'canvas-edge-label');
        text.textContent = edge.label;
        svg.appendChild(text);
    }
}

document.addEventListener('mousemove', (e) => {
    const container = document.getElementById('canvas-container');
    if (dragState) {
        const dx = (e.clientX - dragState.startX) / canvasZoom;
        const dy = (e.clientY - dragState.startY) / canvasZoom;

        if (dragState.type === 'resize') {
            const frame = canvasFrames.find(f => f.id === dragState.id);
            if (frame) {
                frame.w = Math.max(100, dragState.startW + dx);
                frame.h = Math.max(100, dragState.startH + dy);
                const frameEl = document.getElementById('cframe-' + frame.id);
                if (frameEl) {
                    frameEl.style.width = frame.w + 'px';
                    frameEl.style.height = frame.h + 'px';
                }
            }
        } else if (dragState.type === 'frame') {
            const frame = canvasFrames.find(f => f.id === dragState.id);
            if (frame) {
                frame.x = Math.max(0, dragState.startFrameX + dx);
                frame.y = Math.max(0, dragState.startFrameY + dy);
                const frameEl = document.getElementById('cframe-' + frame.id);
                if (frameEl) {
                    frameEl.style.left = frame.x + 'px';
                    frameEl.style.top = frame.y + 'px';
                }
            }
            (dragState.nodeIds || []).forEach(nid => {
                const base = dragState.originals?.[nid];
                if (base) {
                    canvasNodes[nid].x = Math.max(0, base.x + dx);
                    canvasNodes[nid].y = Math.max(0, base.y + dy);
                    const el = document.getElementById('cnode-' + nid);
                    if (el) { el.style.left = canvasNodes[nid].x + 'px'; el.style.top = canvasNodes[nid].y + 'px'; }
                }
            });
        } else {
            (dragState.nodeIds || [dragState.id]).forEach(nid => {
                const base = dragState.originals?.[nid] || { x: canvasNodes[nid].x, y: canvasNodes[nid].y };
                canvasNodes[nid].x = Math.max(0, base.x + dx);
                canvasNodes[nid].y = Math.max(0, base.y + dy);
                const el = document.getElementById('cnode-' + nid);
                if (el) { el.style.left = canvasNodes[nid].x + 'px'; el.style.top = canvasNodes[nid].y + 'px'; }
            });
        }

        const svg = document.getElementById('canvas-svg');
        svg.innerHTML = '';
        canvasEdges.forEach(edge => drawEdge(svg, edge));
    }
    
    if (handPanState) {
        panX = handPanState.panX + (e.clientX - handPanState.startX);
        panY = handPanState.panY + (e.clientY - handPanState.startY);
        updateCanvasTransform();
    }

    if (marqueeState) {
        const rect = container.getBoundingClientRect();
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(marqueeState.screenStartX, currentX) - rect.left;
        const top = Math.min(marqueeState.screenStartY, currentY) - rect.top;
        const width = Math.abs(marqueeState.screenStartX - currentX);
        const height = Math.abs(marqueeState.screenStartY - currentY);
        
        const box = document.getElementById('selection-box');
        if (box) {
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
            box.style.width = `${width}px`;
            box.style.height = `${height}px`;
        }
    }

    if (connectState) {
        const fromEl = document.getElementById('cnode-' + connectState.fromId);
        if (fromEl) {
            const fromSocket = normalizeDirection(connectState.fromSocket, 'RIGHT');
            const p0 = getSocketCoordinates(fromEl, fromSocket);
            
            const rect = container.getBoundingClientRect();
            const mx = (e.clientX - rect.left - panX) / canvasZoom;
            const my = (e.clientY - rect.top - panY) / canvasZoom;
            
            const svg = document.getElementById('canvas-svg');
            const oldTemp = document.getElementById('temp-connect-line');
            if (oldTemp) oldTemp.remove();
            
            const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
            const targetSocket = hoveredEl ? hoveredEl.closest('.node-socket') : null;
            
            let endPt = { x: mx, y: my };
            let endDir;
            if (targetSocket) {
                endDir = normalizeDirection(getSocketDirection(targetSocket), 'LEFT');
                const targetNodeId = targetSocket.dataset.id;
                const targetNodeEl = document.getElementById('cnode-' + targetNodeId);
                if (targetNodeEl) {
                    endPt = getSocketCoordinates(targetNodeEl, endDir);
                }
            } else {
                endDir = getEstimatedEndDirection(p0, mx, my);
            }
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('id', 'temp-connect-line');
            path.setAttribute('d', calculateSmoothPath(p0, fromSocket, endPt, endDir));
            path.setAttribute('class', 'canvas-line');
            path.setAttribute('style', 'stroke: var(--accent); stroke-dasharray: 4 4; pointer-events: none;');
            svg.appendChild(path);
        }
    }
});

document.addEventListener('mouseup', async (e) => {
    const container = document.getElementById('canvas-container');
    if (dragState) {
        refreshFrameMemberships();
        saveCanvasState();
        dragState = null;
    }
    if (handPanState) {
        handPanState = null;
        if (container) container.style.cursor = (canvasToolMode === 'hand') ? 'grab' : 'default';
    }
    if (marqueeState) {
        const rect = container.getBoundingClientRect();
        const endX = (e.clientX - rect.left - panX) / canvasZoom;
        const endY = (e.clientY - rect.top - panY) / canvasZoom;
        
        const x1 = Math.min(marqueeState.startX, endX);
        const y1 = Math.min(marqueeState.startY, endY);
        const x2 = Math.max(marqueeState.startX, endX);
        const y2 = Math.max(marqueeState.startY, endY);
        
        selectedNodeIds = new Set();
        Object.entries(canvasNodes).forEach(([id, node]) => {
            const nodeX = node.x;
            const nodeY = node.y;
            const nodeW = 200;
            const nodeH = 100;
            const overlaps = (nodeX < x2 && nodeX + nodeW > x1 && nodeY < y2 && nodeY + nodeH > y1);
            if (overlaps) {
                selectedNodeIds.add(id);
            }
        });
        
        const box = document.getElementById('selection-box');
        if (box) box.style.display = 'none';
        
        marqueeState = null;
        renderCanvasFromState();
    }
    if (connectState) {
        const oldTemp = document.getElementById('temp-connect-line');
        if (oldTemp) oldTemp.remove();
        const fromId = connectState.fromId;
        const fromSocket = normalizeDirection(connectState.fromSocket, 'RIGHT');
        connectState = null;
        const target = e.target.closest('.node-socket');
        if (target) {
            const toId = target.dataset.id;
            const toSocket = normalizeDirection(getSocketDirection(target), 'LEFT');
            if (fromId !== toId) {
                const existingEdge = canvasEdges.find(ed => ed.from === fromId && ed.to === toId);
                if (existingEdge) {
                    existingEdge.fromSocket = fromSocket;
                    existingEdge.toSocket = toSocket;
                    saveCanvasState();
                    renderCanvasFromState();
                } else {
                    const relPrompt = await AppBridge.prompt(
                        'Connection Type',
                        'Enter any connection text. Example: oneway / bidirectional / supports / evidence / causes.',
                        'oneway',
                        'oneway'
                    );
                    if (relPrompt === null) return;
                    const inputText = (relPrompt || '').trim();
                    if (!inputText) return;
                    const low = inputText.toLowerCase();
                    const relation = (low.includes('bi') || low.includes('both') || low.includes('two-way')) ? 'bidirectional' : 'oneway';
                    const label = inputText;
                    canvasEdges.push({ from: fromId, to: toId, fromSocket, toSocket, relation, label });
                    saveCanvasState();
                    renderCanvasFromState();
                    autoCheckMilestoneFromConnection(fromId, toId);
                }
            }
        }
    }
});

async function deleteCanvasNode(id) {
    const ok = await AppBridge.confirm('Delete Node', 'Are you sure you want to delete this node and all its connections?');
    if (!ok) return;
    delete canvasNodes[id];
    canvasEdges = canvasEdges.filter(e => e.from !== id && e.to !== id);
    canvasFrames.forEach(f => f.nodeIds = (f.nodeIds || []).filter(nid => nid !== id));
    saveCanvasState();
    renderCanvasFromState();
}

function editCanvasNode(id) {
    openDetailsDrawer(id);
}

function setCanvasToolMode(mode) {
    canvasToolMode = mode;
    document.getElementById('canvas-tool-select')?.classList.toggle('btn-accent', mode === 'select');
    document.getElementById('canvas-tool-hand')?.classList.toggle('btn-accent', mode === 'hand');
    const container = document.getElementById('canvas-container');
    if (container) container.style.cursor = mode === 'hand' ? 'grab' : 'default';
}

function adjustCanvasZoom(step) {
    canvasZoom = Math.max(0.25, Math.min(2, canvasZoom + (step / 100)));
    updateCanvasTransform();
}

function resetCanvasZoom() {
    canvasZoom = 1;
    panX = 0;
    panY = 0;
    updateCanvasTransform();
}

function applyCanvasSearch() {
    const keyword = (document.getElementById('canvas-search')?.value || '').trim().toLowerCase();
    Object.entries(canvasNodes).forEach(([id, n]) => {
        const el = document.getElementById('cnode-' + id);
        if (!el) return;
        const hit = !keyword || `${n.title} ${n.desc || ''} ${n.longText || ''} ${n.url || ''}`.toLowerCase().includes(keyword);
        el.classList.toggle('dimmed', !hit);
    });
    // Update edges too
    const svg = document.getElementById('canvas-svg');
    if (svg) {
        svg.innerHTML = '';
        canvasEdges.forEach(edge => drawEdge(svg, edge));
    }
}

function refreshFrameMemberships() {
    canvasFrames.forEach(frame => {
        frame.nodeIds = Object.entries(canvasNodes)
            .filter(([_, n]) => {
                const nw = 240, nh = 120;
                return n.x >= frame.x && n.y >= frame.y && (n.x + nw) <= (frame.x + frame.w) && (n.y + nh) <= (frame.y + frame.h);
            })
            .map(([id]) => id);
    });
}

async function createFrameFromSelection() {
    let nodeIds = [];
    let title = 'Research Group';
    let x, y, w, h;

    if (selectedNodeIds.size > 0) {
        nodeIds = [...selectedNodeIds].filter(id => canvasNodes[id]);
    }

    if (nodeIds.length > 0) {
        const prompted = await AppBridge.prompt('Create Frame', 'Enter frame name:', 'Research Group', 'Research Group');
        if (prompted === null) return;
        title = (prompted || '').trim() || 'Research Group';
        const minX = Math.min(...nodeIds.map(id => canvasNodes[id].x));
        const minY = Math.min(...nodeIds.map(id => canvasNodes[id].y));
        const maxX = Math.max(...nodeIds.map(id => canvasNodes[id].x + 240));
        const maxY = Math.max(...nodeIds.map(id => canvasNodes[id].y + 120));
        x = minX - 20;
        y = minY - 20;
        w = maxX - minX + 40;
        h = maxY - minY + 40;
    } else {
        const prompted = await AppBridge.prompt('Create Frame', 'Enter frame name:', 'Empty Group', 'Empty Group');
        if (prompted === null) return;
        title = (prompted || '').trim() || 'Empty Group';
        const container = document.getElementById('canvas-container');
        x = (-panX + (container.clientWidth - 400) / 2) / canvasZoom;
        y = (-panY + (container.clientHeight - 300) / 2) / canvasZoom;
        w = 400;
        h = 300;
    }
    
    canvasFrames.push({ id: genId(), title, nodeIds, x, y, w, h });
    saveCanvasState();
    renderCanvasFromState();
}

async function deleteCanvasFrame(id) {
    const ok = await AppBridge.confirm('Delete Frame', 'Are you sure you want to delete this frame? Nodes inside will not be deleted.');
    if (!ok) return;
    canvasFrames = canvasFrames.filter(f => f.id !== id);
    saveCanvasState();
    renderCanvasFromState();
}

function renderMiniMap() {
    const map = document.getElementById('canvas-mini-map');
    const container = document.getElementById('canvas-container');
    if (!map || !container) return;
    map.innerHTML = '';
    const nodes = Object.values(canvasNodes);
    if (!nodes.length) return;
    
    const minX = Math.min(0, ...nodes.map(n => n.x));
    const minY = Math.min(0, ...nodes.map(n => n.y));
    const maxX = Math.max(container.clientWidth, ...nodes.map(n => n.x + 240));
    const maxY = Math.max(container.clientHeight, ...nodes.map(n => n.y + 120));
    const width = maxX - minX;
    const height = maxY - minY;
    
    const sx = map.clientWidth / width;
    const sy = map.clientHeight / height;
    
    nodes.forEach(n => {
        const dot = document.createElement('div');
        dot.className = 'canvas-mini-node';
        dot.style.left = `${(n.x - minX) * sx}px`;
        dot.style.top = `${(n.y - minY) * sy}px`;
        dot.style.width = `${Math.max(3, 15 * sx)}px`;
        dot.style.height = `${Math.max(3, 10 * sy)}px`;
        if (n.type === 'theme') dot.style.background = 'var(--accent)';
        else if (n.type === 'source') dot.style.background = '#3B82F6';
        else dot.style.background = 'var(--muted)';
        map.appendChild(dot);
    });
    
    const view = document.createElement('div');
    view.className = 'canvas-mini-view';
    const vx = (-panX / canvasZoom - minX) * sx;
    const vy = (-panY / canvasZoom - minY) * sy;
    const vw = (container.clientWidth / canvasZoom) * sx;
    const vh = (container.clientHeight / canvasZoom) * sy;
    
    view.style.left = `${vx}px`;
    view.style.top = `${vy}px`;
    view.style.width = `${vw}px`;
    view.style.height = `${vh}px`;
    map.appendChild(view);
}

function openDetailsDrawer(nodeId) {
    const node = canvasNodes[nodeId];
    if (!node) return;
    const body = document.getElementById('details-drawer-body');
    body.innerHTML = `
        <div style="font-size:11px; color:var(--muted); margin-bottom:10px;">Scroll down for Long Notes and Image URL fields.</div>
        <div class="field"><label>Title</label><input id="dd-title" value="${(node.title || '').replace(/"/g, '&quot;')}"></div>
        <div class="field"><label>Description</label><textarea id="dd-desc" rows="3">${node.desc || ''}</textarea></div>
        <div class="field"><label>Long Notes</label><textarea id="dd-long" rows="8">${node.longText || ''}</textarea></div>
        <div class="field"><label>Image URL</label><input id="dd-image" value="${(node.imageUrl || '').replace(/"/g, '&quot;')}"></div>
        ${node.type === 'source' ? `<div class="field"><label>URL</label><input id="dd-url" value="${(node.url || '').replace(/"/g, '&quot;')}"></div>` : ''}
        <div class="field"><label>Tag Color</label><input id="dd-tag" type="color" value="${node.tagColor || '#3B82F6'}"></div>
        <div style="display:flex; gap:10px;">
            <button class="btn-mini btn-accent" onclick="saveDetailsDrawer('${nodeId}')">SAVE</button>
        </div>`;
    document.getElementById('details-drawer')?.classList.add('open');
}

function closeDetailsDrawer() { document.getElementById('details-drawer')?.classList.remove('open'); }

function saveDetailsDrawer(nodeId) {
    const node = canvasNodes[nodeId];
    if (!node) return;
    node.title = document.getElementById('dd-title')?.value.trim() || node.title;
    node.desc = document.getElementById('dd-desc')?.value || '';
    node.longText = document.getElementById('dd-long')?.value || '';
    node.imageUrl = document.getElementById('dd-image')?.value || '';
    node.tagColor = document.getElementById('dd-tag')?.value || '';
    if (node.type === 'source') node.url = document.getElementById('dd-url')?.value || '';
    saveCanvasState();
    closeDetailsDrawer();
    renderCanvasFromState();
}

function autoCheckMilestoneFromConnection(sourceId, themeId) {
    try {
        const b = getBridge(); if (!b) return;
        const progressForStage = myProgress[currentIdx] || {};
        const uncheckedIdx = currentTasks.findIndex((t, i) => !progressForStage[i]);
        if (uncheckedIdx >= 0) {
            b.fUpdate(b.fRef(b.firebaseDb, `user_image_index/ir_v7/progress/${currentUser.id}/${currentIdx}`), { [uncheckedIdx]: true });
            
            // Safe calculation of total checked tasks across all stages
            let total = 0;
            Object.values(myProgress || {}).forEach(stageProgress => {
                if (stageProgress && typeof stageProgress === 'object') {
                    total += Object.values(stageProgress).filter(x => x).length;
                }
            });
            total += 1; // Count the one we just checked
            
            b.fUpdate(b.fRef(b.firebaseDb, `user_image_index/ir_v7/meta/${currentUser.id}`), { 
                name: currentUser.name, 
                email: currentUser.email || '', 
                percent: Math.round((total / 50) * 100), 
                stage: currentIdx 
            });
        }
    } catch (e) {
        console.error("Error auto-checking milestone:", e);
    }
}

function saveCanvasState() {
    const b = getBridge(); if (!b) return;
    b.fSet(b.fRef(b.firebaseDb, `user_image_index/ir_v7/canvas/${currentUser.id}`), { nodes: canvasNodes, edges: canvasEdges, frames: canvasFrames }).catch(e => console.error('Canvas save failed:', e));
}

function loadCanvasState() {
    const b = getBridge(); if (!b) return;
    b.fOnValue(b.fRef(b.firebaseDb, `user_image_index/ir_v7/canvas/${currentUser.id}`), snap => {
        const data = snap.val();
        if (data) {
            canvasNodes = data.nodes || {};
            canvasEdges = data.edges || [];
            canvasFrames = data.frames || [];
        } else {
            canvasNodes = {};
            canvasEdges = [];
            canvasFrames = [];
        }
        if (currentTool === 'canvas') renderCanvasFromState();
    });
}

// =====================================================================
//  NODE DETAIL PANEL - STAR RATINGS & STICKY FEEDBACK
// =====================================================================
let nodeComments = {}; // { nodeId: { rating, notes: [{color, text, author, replies:[{text,author}]}] } }
let currentNodeDetailId = null;

function openNodeDetail(nodeId) {
    currentNodeDetailId = nodeId;
    const node = canvasNodes[nodeId]; if (!node) return;
    const wrap = document.getElementById('modal-wrap'), body = document.getElementById('modal-body'), sub = document.getElementById('modal-submit');
    wrap.style.display = 'flex';
    document.getElementById('modal-title').innerText = node.title;
    sub.style.display = 'none'; // No submit button for detail view

    const feedback = nodeComments[nodeId] || { rating: 0, notes: [] };
    const starHtml = [1,2,3,4,5].map(s => {
        if (isAdmin) {
            return `<span class="star-icon ${s <= (feedback.rating||0) ? 'active' : ''}" onclick="setNodeRating('${nodeId}', ${s})" style="font-size:22px; cursor:pointer;">★</span>`;
        } else {
            return `<span class="star-icon ${s <= (feedback.rating||0) ? 'active' : ''}" style="font-size:22px; cursor:default; pointer-events:none;">★</span>`;
        }
    }).join('');

    let notesHtml = '';
    (feedback.notes || []).forEach((note, ni) => {
        let repliesHtml = '';
        (note.replies || []).forEach(r => {
            repliesHtml += `<div class="sticky-reply"><b>${r.author}:</b> ${r.text}</div>`;
        });
        notesHtml += `
            <div class="sticky-note ${note.color || 'yellow'}">
                <div class="sticky-note-header"><span>${note.author || 'Teacher'}</span><span>${note.time || ''}</span></div>
                <div class="sticky-note-text">${note.text}</div>
                <div class="sticky-note-replies">
                    ${repliesHtml}
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <input id="reply-${ni}" style="flex:1; background:rgba(255,255,255,0.6); border:1px solid rgba(0,0,0,0.15); padding:6px 10px; border-radius:8px; font-size:11px; color:#000;" placeholder="Reply...">
                        <button onclick="addReply('${nodeId}', ${ni})" style="background:#1c1917; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-size:10px; font-weight:800; cursor:pointer;">SEND</button>
                    </div>
                </div>
            </div>`;
    });

    body.innerHTML = `
        <div style="margin-bottom:16px;">
            <div style="font-size:10px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:6px;">${node.type} Node</div>
            ${node.desc ? `<p style="color:var(--muted); font-size:13px;">${node.desc}</p>` : ''}
            ${node.url ? `<a href="${formatUrl(node.url)}" target="_blank" style="color:#3B82F6; font-size:12px;">🔗 ${node.url}</a>` : ''}
        </div>
        <div style="border-top:1px solid var(--border); padding-top:16px;">
            <div style="font-size:10px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:8px;">Quality Rating</div>
            <div class="rating-stars">${starHtml}</div>
        </div>
        <div style="border-top:1px solid var(--border); padding-top:16px; margin-top:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:10px; font-weight:800; color:var(--muted); text-transform:uppercase;">Feedback Notes</div>
                ${isAdmin ? `
                <div style="display:flex; gap:6px;">
                    <button onclick="showInlineNodeNoteCreator('yellow')" style="width:18px;height:18px;border-radius:50%;background:#FEF08A;border:2px solid rgba(0,0,0,0.1);cursor:pointer;" title="Yellow"></button>
                    <button onclick="showInlineNodeNoteCreator('pink')" style="width:18px;height:18px;border-radius:50%;background:#FBCFE8;border:2px solid rgba(0,0,0,0.1);cursor:pointer;" title="Pink"></button>
                    <button onclick="showInlineNodeNoteCreator('green')" style="width:18px;height:18px;border-radius:50%;background:#BBF7D0;border:2px solid rgba(0,0,0,0.1);cursor:pointer;" title="Green"></button>
                    <button onclick="showInlineNodeNoteCreator('blue')" style="width:18px;height:18px;border-radius:50%;background:#BFDBFE;border:2px solid rgba(0,0,0,0.1);cursor:pointer;" title="Blue"></button>
                </div>` : ''}
            </div>
            
            <div id="inline-node-note-creator" style="display:none; flex-direction:column; gap:10px; padding:16px; border-radius:12px; margin-bottom:16px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: background 0.3s;">
                <textarea id="inline-node-note-text" style="width:100%; min-height:80px; background:transparent; border:none; resize:vertical; font-size:13px; color:#1c1917; font-family:inherit; outline:none;" placeholder="Enter feedback note here..."></textarea>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button onclick="hideInlineNodeNoteCreator()" style="background:transparent; border:none; color:var(--muted); font-size:12px; font-weight:800; cursor:pointer; padding:6px 12px;">Cancel</button>
                    <button id="inline-node-note-save-btn" style="background:#1c1917; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; padding:6px 16px;">Save Note</button>
                </div>
            </div>

            <div class="sticky-notes-container">${notesHtml || '<div style="color:var(--muted); font-size:12px;">No feedback yet.</div>'}</div>
        </div>
    `;
}

function setNodeRating(nodeId, rating) {
    if (!nodeComments[nodeId]) nodeComments[nodeId] = { rating: 0, notes: [] };
    nodeComments[nodeId].rating = rating;
    saveComments(nodeId);
    openNodeDetail(nodeId); // Re-render
    pushNotification(nodeId, `Your source "${canvasNodes[nodeId]?.title}" was rated ${rating}★`);
}

async function addStickyNote(nodeId, color) {
    const text = await AppBridge.prompt('Add Feedback Note', 'Enter your feedback note:', '', '');
    if (!text) return;
    if (!nodeComments[nodeId]) nodeComments[nodeId] = { rating: 0, notes: [] };
    nodeComments[nodeId].notes.push({
        color, text,
        author: currentUser.name || 'Teacher',
        time: new Date().toLocaleString(),
        replies: []
    });
    saveComments(nodeId);
    openNodeDetail(nodeId);
    pushNotification(nodeId, `New feedback on "${canvasNodes[nodeId]?.title}": "${text.substring(0, 40)}..."`);
}

function addReply(nodeId, noteIdx) {
    const input = document.getElementById('reply-' + noteIdx);
    if (!input || !input.value.trim()) return;
    const replyText = input.value.trim();
    if (!nodeComments[nodeId]) nodeComments[nodeId] = {notes: []};
    if (!nodeComments[nodeId].notes[noteIdx].replies) {
        nodeComments[nodeId].notes[noteIdx].replies = [];
    }
    nodeComments[nodeId].notes[noteIdx].replies.push({
        text: replyText,
        author: currentUser.name || 'Student'
    });
    input.value = '';
    saveComments(nodeId);
    openNodeDetail(nodeId);
    
    if (isAdmin) {
        pushNotification(nodeId, `Teacher replied to node feedback: "${replyText.substring(0, 40)}..."`);
    } else {
        findTeacherUidAndNotify(nodeId, `Student ${currentUser.name || 'Student'} replied: "${replyText.substring(0, 40)}..."`, null);
    }
}

function saveComments(nodeId) {
    const b = getBridge(); if (!b) return;
    b.fSet(b.fRef(b.firebaseDb, `user_image_index/ir_v7/comments/${currentUser.id}/${nodeId}`), nodeComments[nodeId]);
}

function loadComments() {
    const b = getBridge(); if (!b) return;
    b.fOnValue(b.fRef(b.firebaseDb, `user_image_index/ir_v7/comments/${currentUser.id}`), snap => {
        nodeComments = snap.val() || {};
    });
}

function showInlineNodeNoteCreator(color) {
    const creator = document.getElementById('inline-node-note-creator');
    const txt = document.getElementById('inline-node-note-text');
    const saveBtn = document.getElementById('inline-node-note-save-btn');
    if (!creator || !txt || !saveBtn) return;
    
    const colorMap = {
        yellow: '#FEF08A',
        pink: '#FBCFE8',
        green: '#BBF7D0',
        blue: '#BFDBFE'
    };
    creator.style.background = colorMap[color] || '#FEF08A';
    creator.style.display = 'flex';
    txt.value = '';
    txt.focus();
    
    saveBtn.onclick = () => {
        const text = txt.value.trim();
        if (!text) return;
        
        if (!nodeComments[currentNodeDetailId]) nodeComments[currentNodeDetailId] = { rating: 0, notes: [] };
        nodeComments[currentNodeDetailId].notes.push({
            color, text,
            author: currentUser.name || 'Teacher',
            time: new Date().toLocaleString(),
            replies: []
        });
        saveComments(currentNodeDetailId);
        
        // Push notification to student (this is student's canvas node feedback)
        pushNotification(currentNodeDetailId, `New feedback on "${canvasNodes[currentNodeDetailId]?.title}": "${text.substring(0, 40)}..."`);
        
        creator.style.display = 'none';
        openNodeDetail(currentNodeDetailId);
    };
}

function hideInlineNodeNoteCreator() {
    const creator = document.getElementById('inline-node-note-creator');
    if (creator) creator.style.display = 'none';
}

function findTeacherUidAndNotify(nodeId, text, stageFbKey) {
    const b = getBridge(); if (!b) return;
    b.fOnValue(b.fRef(b.firebaseDb, 'user_image_index/ir_v7/meta'), snap => {
        const users = snap.val() || {};
        let teacherUid = null;
        Object.entries(users).forEach(([uid, data]) => {
            if (data && data.email === 'moss104088@gmail.com') {
                teacherUid = uid;
            }
        });
        if (!teacherUid) {
            teacherUid = 'teacher';
        }
        const notif = { id: genId(), nodeId, text, time: Date.now(), read: false, stageFbKey };
        b.fOnValue(b.fRef(b.firebaseDb, `user_image_index/ir_v7/notifications/${teacherUid}`), snapNotif => {
            const recipientNotifs = snapNotif.val() || [];
            recipientNotifs.push(notif);
            b.fSet(b.fRef(b.firebaseDb, `user_image_index/ir_v7/notifications/${teacherUid}`), recipientNotifs);
        }, { onlyOnce: true });
    }, { onlyOnce: true });
}

// =====================================================================
//  PDF REPORT EXPORTER
// =====================================================================
function exportPDFReport() {
    // Build a print-friendly overlay
    const sources = Object.values(canvasNodes).filter(n => n.type === 'source');
    const themes = Object.values(canvasNodes).filter(n => n.type === 'theme');
    const notes = Object.values(canvasNodes).filter(n => n.type === 'note');

    let reportHtml = `
        <div id="print-report" style="padding:40px; font-family:Georgia,serif; color:#000; background:#fff; position:fixed; inset:0; z-index:9999; overflow:auto;">
            <h1 style="font-size:28px; margin-bottom:4px; font-family:'Inter',sans-serif;">Independent Research Report</h1>
            <p style="color:#666; font-size:14px; margin-bottom:30px;">${currentUser.name} ${currentUser.email} ${new Date().toLocaleDateString()}</p>
            <hr style="border:none; border-top:2px solid #000; margin-bottom:30px;">

            <h2 style="font-size:18px; font-family:'Inter',sans-serif; margin-bottom:16px;">Research Themes (${themes.length})</h2>
            ${themes.length ? themes.map(t => `<div style="margin-bottom:10px; padding:10px 16px; background:#f9f9f9; border-left:4px solid #F59E0B; border-radius:6px;"><b>${t.title}</b>${t.desc ? '<br><span style="color:#666; font-size:13px;">' + t.desc + '</span>' : ''}</div>`).join('') : '<p style="color:#999;">No themes added.</p>'}

            <h2 style="font-size:18px; font-family:'Inter',sans-serif; margin:30px 0 16px;">Bibliography / Sources (${sources.length})</h2>
            <ol style="padding-left:20px;">
            ${sources.map(s => `<li style="margin-bottom:8px;"><b>${s.title}</b>${s.url ? ' <a href="' + formatUrl(s.url) + '">' + s.url + '</a>' : ''}${s.desc ? '<br><i style="color:#666;">' + s.desc + '</i>' : ''}</li>`).join('')}
            </ol>
            ${sources.length === 0 ? '<p style="color:#999;">No sources added.</p>' : ''}

            <h2 style="font-size:18px; font-family:'Inter',sans-serif; margin:30px 0 16px;">Research Notes (${notes.length})</h2>
            ${notes.map(n => `<div style="margin-bottom:10px; padding:10px 16px; background:#f0f0f0; border-radius:6px;"><b>${n.title}</b>${n.desc ? '<br><span style="color:#555;">' + n.desc + '</span>' : ''}</div>`).join('')}
            ${notes.length === 0 ? '<p style="color:#999;">No notes added.</p>' : ''}

            <h2 style="font-size:18px; font-family:'Inter',sans-serif; margin:30px 0 16px;">Milestones Progress</h2>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
            ${STAGES.map((s, si) => {
                const tasks = currentTasks;
                return `<tr style="border-bottom:1px solid #ddd;"><td style="padding:10px; font-weight:700; color:#B45309;">${s.name}</td><td style="padding:10px;">Stage ${si}</td></tr>`;
            }).join('')}
            </table>

            <div style="margin-top:40px; text-align:center;">
                <button onclick="document.getElementById('print-report').remove()" style="padding:12px 28px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer; margin-right:12px;">CLOSE</button>
                <button onclick="window.print()" style="padding:12px 28px; background:#F59E0B; color:#000; border:none; border-radius:10px; font-weight:800; cursor:pointer;">PRINT / SAVE PDF</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', reportHtml);
}

// =====================================================================
//  EXPOSE BINDINGS FOR INTERFACE
// =====================================================================
Object.defineProperty(window, 'canvasNodes', {
    get: () => canvasNodes,
    set: (v) => { canvasNodes = v; }
});
Object.defineProperty(window, 'canvasEdges', {
    get: () => canvasEdges,
    set: (v) => { canvasEdges = v; }
});
Object.defineProperty(window, 'canvasFrames', {
    get: () => canvasFrames,
    set: (v) => { canvasFrames = v; }
});
Object.defineProperty(window, 'canvasToolMode', {
    get: () => canvasToolMode,
    set: (v) => { canvasToolMode = v; }
});
Object.defineProperty(window, 'currentNodeDetailId', {
    get: () => currentNodeDetailId,
    set: (v) => { currentNodeDetailId = v; }
});
Object.defineProperty(window, 'nodeComments', {
    get: () => nodeComments,
    set: (v) => { nodeComments = v; }
});

window.addCanvasNodePrompt = addCanvasNodePrompt;
window.renderCanvasFromState = renderCanvasFromState;
window.deleteCanvasNode = deleteCanvasNode;
window.editCanvasNode = editCanvasNode;
window.setCanvasToolMode = setCanvasToolMode;
window.adjustCanvasZoom = adjustCanvasZoom;
window.resetCanvasZoom = resetCanvasZoom;
window.applyCanvasSearch = applyCanvasSearch;
window.createFrameFromSelection = createFrameFromSelection;
window.deleteCanvasFrame = deleteCanvasFrame;
window.renderMiniMap = renderMiniMap;
window.openDetailsDrawer = openDetailsDrawer;
window.closeDetailsDrawer = closeDetailsDrawer;
window.saveDetailsDrawer = saveDetailsDrawer;
window.loadCanvasState = loadCanvasState;
window.openNodeDetail = openNodeDetail;
window.setNodeRating = setNodeRating;
window.addStickyNote = addStickyNote;
window.addReply = addReply;
window.loadComments = loadComments;
window.showInlineNodeNoteCreator = showInlineNodeNoteCreator;
window.hideInlineNodeNoteCreator = hideInlineNodeNoteCreator;
window.findTeacherUidAndNotify = findTeacherUidAndNotify;
window.exportPDFReport = exportPDFReport;
