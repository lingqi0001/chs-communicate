/**
 * ==================================================================================
 * Module: GalleryModule (Premium Full-Screen Touch Gallery)
 * Target File: js/gallery.js
 * 
 * [Design Principles]:
 * 1. Zero Jitter & Seamless Preloading: Pre-caches surrounding image assets to 
 *    eliminate loading bars during swipe interactions.
 * 2. Premium Touch Interactions: Full swipe gesture engine with dead-zone protection,
 *    velocity scaling, and smooth spring-damping transitions.
 * 3. Architectural Compatibility: Bridges legacy window globals into modular structures.
 * ==================================================================================
 */

export const GalleryModule = {
    state: {
        images: [],
        currentIndex: 0,
        touchStartX: 0,
        touchStartY: 0,
        isSwiping: false,
        preloadedUrls: new Set(),
        scale: 1,
        rotate: 0
    },

    // Elements cache
    get els() {
        return {
            modal: document.getElementById('galleryModal'),
            img: document.getElementById('mainGalleryImg'),
            prevBtn: document.getElementById('galleryPrevBtn'),
            nextBtn: document.getElementById('galleryNextBtn'),
            zoomInBtn: document.getElementById('galleryZoomInBtn'),
            zoomOutBtn: document.getElementById('galleryZoomOutBtn'),
            rotateBtn: document.getElementById('galleryRotateBtn'),
            saveBtn: document.getElementById('gallerySaveBtn'),
            doneBtn: document.getElementById('galleryDoneBtn')
        };
    },

    /**
     * Initializes gestures and listeners
     */
    init() {
        const { modal, img, prevBtn, nextBtn, zoomInBtn, zoomOutBtn, rotateBtn, saveBtn, doneBtn } = this.els;
        if (!modal || !img) return;

        // 1. Gesture Events
        img.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
        img.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        img.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });

        // 2. Keyboard Events
        window.addEventListener('keydown', (e) => {
            if (modal.classList.contains('hidden')) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
            }
            if (e.key === 'Escape') this.close();
        });

        // 3. Dynamic Click Listeners
        // Click backdrop to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('flex-1')) {
                this.close();
            }
        });

        // Bind Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.download();
            });
        }

        // Bind Done button
        if (doneBtn) {
            doneBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        // Bind Prev button
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
        }

        // Bind Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }

        // Bind Zoom In button
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.zoomIn();
            });
        }

        // Bind Zoom Out button
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.zoomOut();
            });
        }

        // Bind Rotate button
        if (rotateBtn) {
            rotateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotate();
            });
        }

        // 4. Prevent dragging defaults on desktop
        img.addEventListener('dragstart', (e) => e.preventDefault());

        // 5. Intercept pinch-to-zoom on desktop touchpad/wheel
        modal.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // Prevent browser default zoom page
                
                const { img } = this.els;
                if (img) img.style.transition = 'none';
                
                const zoomFactor = 0.03; // Smooth zoom step per tick
                if (e.deltaY < 0) {
                    // Zoom In
                    this.state.scale = Math.min(4, (this.state.scale || 1) + zoomFactor);
                } else {
                    // Zoom Out
                    this.state.scale = Math.max(0.5, (this.state.scale || 1) - zoomFactor);
                }
                
                this._applyTransform();
            }
        }, { passive: false });
    },

    /**
     * Opens the gallery with images and starts preloading
     */
    open(encodedImages, startIdx = 0) {
        try {
            this.state.images = JSON.parse(decodeURIComponent(encodedImages));
        } catch (e) {
            console.error("Failed to parse gallery images:", e);
            this.state.images = [];
        }
        
        this.state.currentIndex = startIdx;
        
        const { modal, img } = this.els;
        if (!modal) return;

        // Visual animation prep
        img.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        modal.classList.remove('hidden');
        modal.style.opacity = '0';

        // Unlock scroll locks if ViewModule is mounted
        if (window.AppModules?.View?.lockScroll) {
            window.AppModules.View.lockScroll(true);
        }

        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s cubic-bezier(0.1, 0.76, 0.55, 0.94)';
            modal.style.opacity = '1';
            this._updateUI(true); // animate image opening
        }, 10);

        this._preloadAdjacent();
    },

    /**
     * Closes the gallery overlay
     */
    close() {
        const { modal, img } = this.els;
        if (!modal) return;

        modal.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        img.style.opacity = '0';
        this.state.scale = 1;
        this.state.rotate = 0;
        this.state.preloadedUrls.clear();

        if (window.AppModules?.View?.lockScroll) {
            window.AppModules.View.lockScroll(false);
        }

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    },

    /**
     * Triggers original-ratio asset download
     */
    download() {
        const url = this.state.images[this.state.currentIndex];
        if (!url) return;

        // Custom high-fidelity feedback toast
        if (window.showToast) window.showToast("Saving image...");

        const link = document.createElement('a');
        link.href = url;
        link.download = `CHS_Gallery_${Date.now()}.jpg`;
        document.body.appendChild(link);
        requestAnimationFrame(() => {
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
        });
    },

    prev() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this._updateUI(false, 'left');
            this._preloadAdjacent();
        }
    },

    next() {
        if (this.state.currentIndex < this.state.images.length - 1) {
            this.state.currentIndex++;
            this._updateUI(false, 'right');
            this._preloadAdjacent();
        }
    },

    /**
     * Dynamic UI Syncing & Interactive Transitions
     */
    _updateUI(isFirstOpen = false, direction = null) {
        const { img, prevBtn, nextBtn } = this.els;
        if (!img) return;

        const currentUrl = this.state.images[this.state.currentIndex];

        const applyAsset = () => {
            img.src = currentUrl;
            img.style.opacity = '1';
            this.state.scale = 1;
            this.state.rotate = 0;
            this._applyTransform();
        };

        if (isFirstOpen) {
            setTimeout(applyAsset, 100);
        } else {
            // High fidelity transition: slide-fade out, then pop back in
            img.style.transition = 'all 0.15s ease-out';
            img.style.opacity = '0';
            if (direction === 'right') {
                img.style.transform = 'translateX(-20px) scale(0.98)';
            } else if (direction === 'left') {
                img.style.transform = 'translateX(20px) scale(0.98)';
            }

            setTimeout(() => {
                img.style.transition = 'none';
                if (direction === 'right') {
                    img.style.transform = 'translateX(20px) scale(0.98)';
                } else if (direction === 'left') {
                    img.style.transform = 'translateX(-20px) scale(0.98)';
                }
                
                // Set source
                img.src = currentUrl;
                this.state.scale = 1;
                this.state.rotate = 0;
                
                requestAnimationFrame(() => {
                    img.style.transition = 'all 0.25s cubic-bezier(0.1, 0.76, 0.55, 0.94)';
                    img.style.opacity = '1';
                    this._applyTransform();
                });
            }, 150);
        }

        // Toggle Prev/Next visibility dynamically
        if (this.state.images.length <= 1) {
            prevBtn?.classList.add('hidden');
            nextBtn?.classList.add('hidden');
        } else {
            prevBtn?.classList.toggle('hidden', this.state.currentIndex === 0);
            nextBtn?.classList.toggle('hidden', this.state.currentIndex === this.state.images.length - 1);
        }
    },

    /**
     * Preloads adjacent images for zero-delay visual caching
     */
    _preloadAdjacent() {
        const indexes = [this.state.currentIndex - 1, this.state.currentIndex + 1];
        indexes.forEach(idx => {
            if (idx >= 0 && idx < this.state.images.length) {
                const url = this.state.images[idx];
                if (url && !this.state.preloadedUrls.has(url)) {
                    this.state.preloadedUrls.add(url);
                    const cacheImg = new Image();
                    cacheImg.src = url;
                }
            }
        });
    },

    zoomIn() {
        console.log("Gallery: zoomIn clicked. Current scale:", this.state.scale);
        const { img } = this.els;
        if (img) img.style.transition = 'transform 0.2s cubic-bezier(0.1, 0.76, 0.55, 0.94)';
        const step = 0.25;
        const maxScale = 4;
        this.state.scale = Math.min(maxScale, (this.state.scale || 1) + step);
        console.log("Gallery: new scale:", this.state.scale);
        this._applyTransform();
    },

    zoomOut() {
        console.log("Gallery: zoomOut clicked. Current scale:", this.state.scale);
        const { img } = this.els;
        if (img) img.style.transition = 'transform 0.2s cubic-bezier(0.1, 0.76, 0.55, 0.94)';
        const step = 0.25;
        const minScale = 0.5;
        this.state.scale = Math.max(minScale, (this.state.scale || 1) - step);
        console.log("Gallery: new scale:", this.state.scale);
        this._applyTransform();
    },

    rotate() {
        console.log("Gallery: rotate clicked. Current rotate:", this.state.rotate);
        const { img } = this.els;
        if (img) img.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.76, 0.55, 0.94)';
        this.state.rotate = ((this.state.rotate || 0) + 90) % 360;
        console.log("Gallery: new rotate:", this.state.rotate);
        this._applyTransform();
    },

    _applyTransform(translateX = 0) {
        const { img } = this.els;
        if (!img) return;
        const scale = this.state.scale !== undefined ? this.state.scale : 1;
        const rotate = this.state.rotate !== undefined ? this.state.rotate : 0;
        console.log("Gallery: applying transform. scale:", scale, "rotate:", rotate, "translateX:", translateX);
        img.style.transform = `translateX(${translateX}px) rotate(${rotate}deg) scale(${scale})`;
    },

    /**
     * Touch Event Tracking Logic (Gestures)
     */
    _onTouchStart(e) {
        if (e.touches.length === 2) {
            // Initiate two-finger pinch zoom
            this.state.isPinching = true;
            this.state.isSwiping = false;
            this.state.pinchStartDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            this.state.pinchStartScale = this.state.scale || 1;
            
            const { img } = this.els;
            if (img) img.style.transition = 'none';
            return;
        }

        if (e.touches.length !== 1) return;
        this.state.touchStartX = e.touches[0].clientX;
        this.state.touchStartY = e.touches[0].clientY;
        this.state.isSwiping = true;
        this.state.isPinching = false;

        // Reset transition styles for instant drag response
        const { img } = this.els;
        if (img) img.style.transition = 'none';
    },

    _onTouchMove(e) {
        if (this.state.isPinching && e.touches.length === 2) {
            e.preventDefault();
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (this.state.pinchStartDistance > 0) {
                const factor = currentDist / this.state.pinchStartDistance;
                const minScale = 0.5;
                const maxScale = 4;
                this.state.scale = Math.max(minScale, Math.min(maxScale, this.state.pinchStartScale * factor));
                this._applyTransform();
            }
            return;
        }

        if (!this.state.isSwiping || e.touches.length !== 1) return;

        const deltaX = e.touches[0].clientX - this.state.touchStartX;
        const deltaY = e.touches[0].clientY - this.state.touchStartY;

        // Horizontal swipe priority check (avoid scrolling conflicts)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault(); // Prevent standard pull-to-refresh
            this._applyTransform(deltaX * 0.7);
        }
    },

    _onTouchEnd(e) {
        if (this.state.isPinching) {
            if (e.touches.length === 0) {
                this.state.isPinching = false;
            }
            return;
        }

        if (!this.state.isSwiping) return;
        this.state.isSwiping = false;

        const { img } = this.els;
        if (!img) return;

        const touch = e.changedTouches?.[0];
        if (!touch) return;
        const touchEndX = touch.clientX;
        const deltaX = touchEndX - this.state.touchStartX;
        const swipeThreshold = 60; // minimum distance to trigger image shift

        img.style.transition = 'all 0.2s ease-out';

        if (deltaX < -swipeThreshold) {
            // Swiped Left -> Load Next Image
            if (this.state.currentIndex < this.state.images.length - 1) {
                this.next();
            } else {
                // Spring back animation if last
                this._applyTransform(0);
            }
        } else if (deltaX > swipeThreshold) {
            // Swiped Right -> Load Prev Image
            if (this.state.currentIndex > 0) {
                this.prev();
            } else {
                // Spring back animation if first
                this._applyTransform(0);
            }
        } else {
            // Swipe was too shallow; spring back
            this._applyTransform(0);
        }
    }
};
