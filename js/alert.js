/**
 * CHS-Communicate Modal System Module
 * Handles Alert, Confirm, and Prompt dialogs with a unified premium UI.
 */

// Private Helper: Escape HTML to prevent XSS in prompts/body
const _escape = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Private UI Template: The HTML structure for the custom modal
const MODAL_HTML = `
    <div id="customModal"
        class="hidden fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 backdrop-blur-md px-10 transition-all duration-300 opacity-0">
        <div class="bg-white/80 dark:bg-gray-900/80 w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl scale-90 transition-all duration-300 border border-white/20">
            <div class="p-5 text-center">
                <div id="modalTitle" class="text-base font-bold text-black dark:text-white mb-1.5 leading-tight">Title</div>
                <div id="modalBody" class="text-sm text-black/70 dark:text-white/60 leading-snug">Body</div>
            </div>
            <div class="flex border-t border-gray-200 dark:border-white/10 h-12">
                <button id="modalCancel" class="flex-1 text-base text-[#007AFF] font-normal border-r border-gray-200 dark:border-white/10 active:bg-gray-200/50 dark:active:bg-white/5 transition-colors">Cancel</button>
                <button id="modalAlt" class="hidden flex-1 text-base text-[#007AFF] font-normal border-r border-gray-200 dark:border-white/10 active:bg-gray-200/50 dark:active:bg-white/5 transition-colors">No</button>
                <button id="modalConfirm" class="flex-1 text-base text-[#007AFF] font-bold active:bg-gray-200/50 dark:active:bg-white/5 transition-colors">Continue</button>
            </div>
        </div>
    </div>
`;

export const ModalModule = {
    _timer: null,

    // Ensure the modal exists in DOM before accessing it
    _inject() {
        if (!document.getElementById('customModal')) {
            document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
        }
    },

    // Get DOM elements with scoped selectors for safety
    _getEls() {
        this._inject(); // Dynamic injection on first call
        const modal = document.getElementById('customModal');
        return {
            modal,
            inner: modal.querySelector('div'),
            title: modal.querySelector('#modalTitle'),
            body: modal.querySelector('#modalBody'),
            cancel: modal.querySelector('#modalCancel'),
            alt: modal.querySelector('#modalAlt'),
            confirm: modal.querySelector('#modalConfirm')
        };
    },

    // Close with animation
    _close(val, resolve) {
        const els = this._getEls();
        if (!els) return resolve(val);

        const { modal, inner, cancel, alt, confirm } = els;
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        inner.classList.remove('scale-100');
        inner.classList.add('scale-90');

        this._timer = setTimeout(() => {
            modal.classList.add('hidden');
            cancel.onclick = null;
            alt.onclick = null;
            confirm.onclick = null;
            this._timer = null;
            
            // 卸载层级
            if (window.AppModules && window.AppModules.View) {
                window.AppModules.View.unregisterLayer('customModal');
                
                // 如果不是由 popstate 触发的关闭（即点击按钮关闭），则需要同步回退历史记录
                if (!window._isPopStateClosing) {
                    history.back();
                }
            }
            
            resolve(val);
        }, 300);
    },

    // Open with animation
    _open() {
        const els = this._getEls();
        if (!els) return;

        const { modal, inner } = els;
        if (this._timer) { 
            clearTimeout(this._timer); 
            this._timer = null; 
        }

        modal.classList.remove('hidden');
        
        // 注册到 View 模块层级管理
        if (window.AppModules && window.AppModules.View) {
            window.AppModules.View.registerLayer('customModal', () => {
                // 这个回调会在按下返回键时被 View.popLayer 调用
                window._isPopStateClosing = true;
                this._close(null, () => {}); 
                setTimeout(() => { window._isPopStateClosing = false; }, 400);
            });
        }

        setTimeout(() => {
            modal.classList.add('opacity-100');
            modal.classList.remove('opacity-0');
            inner.classList.add('scale-100');
            inner.classList.remove('scale-90');
        }, 10);
    },

    // --- Public API ---

    /**
     * Show a simple alert dialog
     * @param {string} title 
     * @param {string} body 
     * @param {string} btnText 
     */
    alert(title, body, btnText = "OK") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(true);

            els.title.innerText = title;
            els.body.innerHTML = body; // Supports HTML for formatting
            els.confirm.innerText = btnText;
            els.cancel.classList.add('hidden');
            els.alt.classList.add('hidden');
            els.confirm.onclick = () => this._close(true, resolve);
            this._open();
        });
    },

    /**
     * Show a confirmation dialog (Yes/No)
     * @param {string} title 
     * @param {string} body 
     * @param {string} confirmText 
     */
    confirm(title, body, confirmText = "Continue") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(false);

            els.title.innerText = title;
            els.body.innerHTML = body;
            els.confirm.innerText = confirmText;
            els.cancel.classList.remove('hidden');
            els.alt.classList.add('hidden');
            els.cancel.onclick = () => this._close(false, resolve);
            els.confirm.onclick = () => this._close(true, resolve);
            this._open();
        });
    },

    /**
     * Show a prompt dialog for user input
     * @param {string} title 
     * @param {string} body 
     * @param {string} defaultValue 
     */
    prompt(title, body, defaultValue = "") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(null);

            els.title.innerText = title;
            els.body.innerHTML = `${body}<br/><input type="text" id="modalInput" class="w-full mt-4 p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all" value="${_escape(defaultValue)}">`;
            
            els.cancel.classList.remove('hidden');
            els.alt.classList.add('hidden');
            els.cancel.innerText = "Cancel";
            els.confirm.innerText = "Save";

            els.cancel.onclick = () => this._close(null, resolve);
            els.confirm.onclick = () => {
                const val = document.getElementById('modalInput').value;
                this._close(val, resolve);
            };

            this._open();
            setTimeout(() => {
                const input = document.getElementById('modalInput');
                if (input) input.focus();
            }, 50);
        });
    }
};
