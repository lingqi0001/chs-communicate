/**
 * CHS Communicate - Liquid Glass Effect Utility
 * Implementation of a high-performance, interactive liquid glass bevel refraction
 * using SVG feDisplacementMap and HTML5 Canvas.
 */

// Math helpers
function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

function smoothStep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Analytical SDF of a rounded rectangle
function getPixelSDF(x, y, w, h, r) {
  const cx = x - w / 2;
  const cy = y - h / 2;
  const dx = w / 2 - r;
  const dy = h / 2 - r;
  
  const qx = Math.abs(cx) - dx;
  const qy = Math.abs(cy) - dy;
  
  return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

// Analytical Gradient of the rounded rectangle SDF
function getSDFGradient(x, y, w, h, r) {
  const cx = x - w / 2;
  const cy = y - h / 2;
  const dx = w / 2 - r;
  const dy = h / 2 - r;
  
  const qx = Math.abs(cx) - dx;
  const qy = Math.abs(cy) - dy;
  
  const signX = cx >= 0 ? 1 : -1;
  const signY = cy >= 0 ? 1 : -1;
  
  if (qx > 0 && qy > 0) {
    const len = length(qx, qy);
    return {
      x: (qx / (len || 1)) * signX,
      y: (qy / (len || 1)) * signY
    };
  } else if (qx > qy) {
    return { x: signX, y: 0 };
  } else {
    return { x: 0, y: signY };
  }
}

export class LiquidGlassEffect {
  constructor(element, options = {}) {
    if (!element) throw new Error("LiquidGlassEffect: Element is required.");
    this.element = element;
    
    // Core parameters
    this.options = {
      dpi: 0.5,                  // lower DPI for maximum rendering performance
      radius: options.radius || 24, // corner radius of the rounded rect (pixels)
      refractionWidth: options.refractionWidth || 16, // width of the bevel (pixels)
      maxDisplacement: options.maxDisplacement || 10, // bevel refraction strength (pixels)
      mouseRadius: options.mouseRadius || 60,         // hover ripple size (pixels)
      mouseStrength: options.mouseStrength || 8,      // hover ripple push force (pixels)
      interactive: options.interactive !== false,     // enable mouse interactive bulge
      frostBlur: options.frostBlur !== undefined ? options.frostBlur : 4.5, // standard deviation for frosted glass center (heavy blur)
      edgeBlur: options.edgeBlur !== undefined ? options.edgeBlur : 1.5, // standard deviation for beveled edge refraction (light blur)
      fragment: options.fragment || null,             // optional custom fragment callback
      animate: options.animate || false,              // run continuous loop for animations
      ...options
    };
    
    this.id = 'lg-filter-' + Math.random().toString(36).substr(2, 9);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 0;
    this.height = 0;
    this.mouse = { x: -999, y: -999, active: false };
    
    this.svgElement = null;
    this.feImage = null;
    this.feDisplacementMap = null;
    
    this.animationFrameId = null;
    this.resizeObserver = null;
    
    this.init();
  }
  
  init() {
    // Browser/feature detection for SVG filter inside backdrop-filter support.
    // Safari, Firefox, and iOS browsers do not support referencing SVG filters in backdrop-filter.
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    this.isFallback = isSafari || isFirefox || isIOS;
    
    if (this.isFallback) {
      // Create background element to prevent child text/icons from getting blurred by the filter
      this.bgElement = document.createElement('div');
      this.bgElement.className = 'liquid-glass-bg';
      this.bgElement.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: inherit; pointer-events: none; z-index: -1;';
      
      // Ensure target element has relative positioning so bg element is relative to it
      if (window.getComputedStyle(this.element).position === 'static') {
        this.element.style.position = 'relative';
      }
      this.element.insertBefore(this.bgElement, this.element.firstChild);
      this.element.classList.add('liquid-glass-fallback');
    }

    // 1. Create SVG Filter element and append to body
    this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgElement.setAttribute('id', `${this.id}_svg`);
    this.svgElement.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: -9999; width: 0; height: 0;';
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `${this.id}_filter`);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    
    this.feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage');
    this.feImage.setAttribute('id', `${this.id}_map`);
    this.feImage.setAttribute('result', `${this.id}_map`);
    
    // 1. Heavy blur for the center frosted area
    const blurHeavy = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blurHeavy.setAttribute('in', 'SourceGraphic');
    blurHeavy.setAttribute('stdDeviation', (this.options.frostBlur).toString());
    blurHeavy.setAttribute('result', 'blurredHeavy');
    
    // 2. Displace the background first to create the sharp refraction shapes
    this.feDisplacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    this.feDisplacementMap.setAttribute('in', 'SourceGraphic');
    this.feDisplacementMap.setAttribute('in2', `${this.id}_map`);
    this.feDisplacementMap.setAttribute('xChannelSelector', 'R');
    this.feDisplacementMap.setAttribute('yChannelSelector', 'G');
    this.feDisplacementMap.setAttribute('result', 'displaced');
    
    // 3. Light blur on the displaced refraction to blend it into the frosted glass body
    const blurLight = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blurLight.setAttribute('in', 'displaced');
    blurLight.setAttribute('stdDeviation', (this.options.edgeBlur).toString());
    blurLight.setAttribute('result', 'blurredLight');
    
    // 4. Extract the mask from the displacement map's Blue channel
    const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    matrix.setAttribute('in', `${this.id}_map`);
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0');
    matrix.setAttribute('result', 'mask');
    
    // 5. Apply the mask to the heavy blur
    const comp1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    comp1.setAttribute('in', 'blurredHeavy');
    comp1.setAttribute('in2', 'mask');
    comp1.setAttribute('operator', 'in');
    comp1.setAttribute('result', 'maskedHeavy');
    
    // 6. Layer the masked heavy blur over the lightly blurred refraction
    const comp2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    comp2.setAttribute('in', 'maskedHeavy');
    comp2.setAttribute('in2', 'blurredLight');
    comp2.setAttribute('operator', 'over');
    
    filter.appendChild(this.feImage);
    filter.appendChild(blurHeavy);
    filter.appendChild(this.feDisplacementMap);
    filter.appendChild(blurLight);
    filter.appendChild(matrix);
    filter.appendChild(comp1);
    filter.appendChild(comp2);
    
    defs.appendChild(filter);
    this.svgElement.appendChild(defs);
    document.body.appendChild(this.svgElement);
    
    // 2. Apply styling to the target element (or bg element for fallback)
    this.element.classList.add('liquid-glass-active');
    
    if (this.isFallback) {
      const backdropFilterVal = `blur(20px) saturate(190%) contrast(100%) brightness(1.05)`;
      this.bgElement.style.setProperty('backdrop-filter', backdropFilterVal, 'important');
      this.bgElement.style.setProperty('-webkit-backdrop-filter', backdropFilterVal, 'important');
      
      const elementFilterVal = `url(#${this.id}_filter)`;
      this.bgElement.style.setProperty('filter', elementFilterVal, 'important');
      this.bgElement.style.setProperty('-webkit-filter', elementFilterVal, 'important');
    } else {
      const filterVal = `url(#${this.id}_filter) blur(0.25px) contrast(1.15) var(--lg-brightness, brightness(1.04)) saturate(1.1)`;
      this.element.style.setProperty('backdrop-filter', filterVal, 'important');
      this.element.style.setProperty('-webkit-backdrop-filter', filterVal, 'important');
    }
    
    // 3. Listen for size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.element);
    
    // 4. Setup interaction
    if (this.options.interactive) {
      this.setupInteraction();
    }
    
    this.handleResize();
    
    // 5. Start animation loop if time-dependent shader or continuous updates needed
    if (this.options.fragment || this.options.animate) {
      this.startAnimation();
    }
  }
  
  setupInteraction() {
    this.element.addEventListener('mousemove', (e) => {
      const rect = this.element.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) / rect.width;
      this.mouse.y = (e.clientY - rect.top) / rect.height;
      this.mouse.active = true;
      this.queueUpdate();
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.queueUpdate();
    });
  }
  
  handleResize() {
    const rect = this.element.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    
    if (w === this.width && h === this.height) return;
    
    this.width = w;
    this.height = h;
    
    // Set SVG filter bounds to cover the element
    const filter = this.svgElement.querySelector('filter');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', w.toString());
    filter.setAttribute('height', h.toString());
    
    this.feImage.setAttribute('width', w.toString());
    this.feImage.setAttribute('height', h.toString());
    
    // Resize canvas
    this.canvas.width = Math.ceil(w * this.options.dpi);
    this.canvas.height = Math.ceil(h * this.options.dpi);
    
    this.queueUpdate();
  }
  
  queueUpdate() {
    if (this.options.fragment || this.options.animate) return;
    if (this.animationFrameId) return;
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.updateDisplacementMap();
    });
  }
  
  startAnimation() {
    const loop = () => {
      this.updateDisplacementMap();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
  
  updateDisplacementMap() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    if (cw === 0 || ch === 0) return;
    
    const dpi = this.options.dpi;
    const w = this.width;
    const h = this.height;
    const r = this.options.radius;
    const refractionWidth = this.options.refractionWidth;
    const maxDisplacement = this.options.maxDisplacement;
    
    // Scaling options to canvas space
    const r_scaled = r * dpi;
    const refraction_scaled = refractionWidth * dpi;
    const max_displacement_scaled = maxDisplacement * dpi;
    
    const imgData = this.ctx.createImageData(cw, ch);
    const data = imgData.data;
    
    // Mouse coords in canvas pixels
    const mx = this.mouse.active ? this.mouse.x * cw : -9999;
    const my = this.mouse.active ? this.mouse.y * ch : -9999;
    const mRadiusScaled = this.options.mouseRadius * dpi;
    const mStrengthScaled = this.options.mouseStrength * dpi;
    
    let maxScale = 0.001; // Avoid divide by zero
    
    // We will save temporary raw offsets and blur mask values
    const rawX = new Float32Array(cw * ch);
    const rawY = new Float32Array(cw * ch);
    const rawB = new Float32Array(cw * ch);
    
    // Pass 1: Compute displacement fields and find max absolute displacement
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const idx = y * cw + x;
        
        // Compute SDF and bevel strength for layout and blur masking
        const sdf = getPixelSDF(x, y, cw, ch, r_scaled);
        const absSdf = Math.abs(sdf);
        
        const t = 1.0 - Math.min(1.0, absSdf / (refraction_scaled || 1));
        const bevelStrength = smoothStep(0, 1, t);
        
        let dx = 0;
        let dy = 0;
        
        if (this.options.fragment) {
          const uv = { x: x / cw, y: y / ch };
          const mouse = this.mouse.active ? { x: mx / cw, y: my / ch } : null;
          const pos = this.options.fragment(uv, mouse);
          dx = pos.x * cw - x;
          dy = pos.y * ch - y;
        } else {
          // 1. Bevel refraction along SDF gradient
          const grad = getSDFGradient(x, y, cw, ch, r_scaled);
          dx = -grad.x * bevelStrength * max_displacement_scaled;
          dy = -grad.y * bevelStrength * max_displacement_scaled;
          
          // 2. Interactive mouse wave bulge
          if (this.mouse.active) {
            const mdx = x - mx;
            const mdy = y - my;
            const mdist = length(mdx, mdy);
            
            if (mdist < mRadiusScaled) {
              const mt = 1.0 - mdist / (mRadiusScaled || 1);
              const mouseBulge = smoothStep(0, 1, mt) * mStrengthScaled;
              const mlen = mdist > 0.1 ? mdist : 1;
              dx += (mdx / mlen) * mouseBulge;
              dy += (mdy / mlen) * mouseBulge;
            }
          }
        }
        
        rawX[idx] = dx;
        rawY[idx] = dy;
        
        // Compute normalized distance from boundary to center for smooth blur transition
        let blurFactor = 0;
        if (sdf <= 0) {
          const maxTransitionWidth = Math.min(cw, ch) / 2;
          const transitionWidth = Math.min(maxTransitionWidth, refraction_scaled * 3.0);
          const dist = Math.abs(sdf);
          const t = Math.min(1.0, dist / (transitionWidth || 1));
          blurFactor = smoothStep(0, 1, t);
        }
        rawB[idx] = blurFactor;
        
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx > maxScale) maxScale = absDx;
        if (absDy > maxScale) maxScale = absDy;
      }
    }
    
    // Pass 2: Normalize displacement to [0, 255] (with 128 as zero offset) and write channels
    for (let i = 0; i < cw * ch; i++) {
      const dx = rawX[i];
      const dy = rawY[i];
      const blurFactor = rawB[i];
      
      // Map to 0-255: offset/maxScale is [-1, 1], so scale to [0, 1] then * 255
      const rVal = Math.round((dx / maxScale * 0.5 + 0.5) * 255);
      const gVal = Math.round((dy / maxScale * 0.5 + 0.5) * 255);
      const bVal = Math.round(blurFactor * 255);
      
      const idx = i * 4;
      data[idx] = rVal;
      data[idx + 1] = gVal;
      data[idx + 2] = bVal;
      data[idx + 3] = 255;
    }
    
    this.ctx.putImageData(imgData, 0, 0);
    
    // Update SVG properties
    this.feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.canvas.toDataURL());
    this.feDisplacementMap.setAttribute('scale', (maxScale / dpi).toString());
  }
  
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.svgElement && this.svgElement.parentNode) {
      this.svgElement.parentNode.removeChild(this.svgElement);
    }
    if (this.bgElement && this.bgElement.parentNode) {
      this.bgElement.parentNode.removeChild(this.bgElement);
    }
    this.element.classList.remove('liquid-glass-active');
    this.element.classList.remove('liquid-glass-fallback');
    this.element.style.backdropFilter = '';
    this.element.style.webkitBackdropFilter = '';
    this.element.style.filter = '';
    this.element.style.webkitFilter = '';
  }
}
