/**
 * ==================================================================================
 * 模块名称：ModalModule (全站弹窗交互中心)
 * 目标文件：js/modal.js
 * 
 * 【设计哲学】：
 * 本模块存在的唯一目的是彻底取缔浏览器自带�?`alert()`, `confirm()`, `prompt()`�? * 原生弹窗会阻�?JS 线程，且 UI 极其丑陋。本模块通过 Promise 异步方案�? * 实现了非阻塞、可定制、符合“黑金”视觉规范的高级对话框�? * 
 * 【函数清�?& 使用手册】：
 * 
 * 1. _escape(str) [私有辅助]
 *    - 【输入】：str (String) - 原始字符串�? *    - 【返回】：String - 转义后的安全 HTML 字符串�? *    - 【存在理由】：当你�?Prompt 中显示用户之前的输入作为默认值时，如果不转义，可能会被注入恶意脚�?(XSS)�? * 
 * 2. _inject() [内部初始化]
 *    - 【输入】：无�? *    - 【返回】：无�? *    - 【存在理由】：为了保持首屏加载性能，弹窗的 HTML 并没有硬编码�?index.html 里，而是等到你第一次调�?alert() 时，由该函数动态“插”进网页底部�? * 
 * 3. _getEls() [内部辅助]
 *    - 【输入】：无�? *    - 【返回】：Object - 包含 modal, title, body, cancel, confirm 等所有按钮的 DOM 引用�? *    - 【存在理由】：它是所有弹窗操作的“物料库”，确保每次操作�?DOM 已经存在且能被正确选中�? * 
 * 4. _open() [私有动画]
 *    - 【输入】：无�? *    - 【返回】：无�? *    - 【存在理由】：负责处理 CSS 进场动画（缩放与透明度），同时调�?ViewModule.lockScroll 锁定背景，防止用户在弹窗弹出时还能滚动网页�? * 
 * 5. _close(val, resolve) [私有闭环]
 *    - 【输入】：val (Any) - 传递给 resolve 的结果；resolve (Function) - Promise 的完成回调�? *    - 【返回】：无�? *    - 【存在理由】：它是异步交互的核心。它负责执行退场动画、隐�?DOM、解锁滚动，并最终告诉调用者：“用户已经选好了，结果�?val”�? * 
 * 6. alert(title, body, btnText) [公开 API]
 *    - 【输入】：title (String) - 标题；body (String) - 正文；btnText (String) - 按钮文字�? *    - 【返回】：Promise(Boolean) - 永远 resolve �?true�? *    - 【用法】：await AppModules.Modal.alert("提示", "操作成功");
 * 
 * 7. confirm(title, body, confirmText) [公开 API]
 *    - 【输入】：title (String) - 标题；body (String) - 正文；confirmText (String) - 确认按钮文字�? *    - 【返回】：Promise(Boolean) - 用户点“确定”返�?true，点“取消”返�?false�? *    - 【用法】：if (await AppModules.Modal.confirm("警告", "确定删除吗？")) { ... }
 * 
 * 8. prompt(title, body, defaultValue) [公开 API]
 *    - 【输入】：title (String) - 标题；body (String) - 正文；defaultValue (String) - 输入框默认值�? *    - 【返回】：Promise(String | null) - 返回用户输入的字符串，点取消返回 null�? *    - 【存在理由】：它会在弹窗正文动态插入一个输入框，是收集用户临时输入的最高效方式�? * ==================================================================================
 */

// Private Helper: Escape HTML to prevent XSS in prompts/body
// [Architectural Note]: This is implemented locally to keep ModalModule Zero-Dependency.
// It ensures the module remains portable and independent of global utility functions.
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
    _failsafeTimer: null,
    _currentLayerId: null,

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
        if (!els) {
            if (resolve) resolve(val);
            return;
        }

        const { modal, inner, cancel, alt, confirm } = els;

        // 强制解锁滚动 (Failsafe)
        if (window.AppModules && window.AppModules.View) {
            window.AppModules.View.lockScroll(false);
            if (window.AppModules.View.unregisterLayer && this._currentLayerId) {
                window.AppModules.View.unregisterLayer(this._currentLayerId);
                this._currentLayerId = null;
            }
        }

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        inner.classList.remove('scale-100');
        inner.classList.add('scale-90');

        // Restore default modal width
        inner.style.maxWidth = '';

        // 清除旧定时器
        if (this._timer) clearTimeout(this._timer);
        if (this._failsafeTimer) clearTimeout(this._failsafeTimer);

        this._timer = setTimeout(() => {
            modal.classList.add('hidden');
            // 清理事件监听，防止内存泄漏和逻辑重叠
            cancel.onclick = null;
            alt.onclick = null;
            confirm.onclick = null;
            this._timer = null;

            if (resolve) resolve(val);
        }, 300);

        // 终极保底：如果 500ms 后还未 resolve (可能由于 Tab 切换导致动画回调丢失)，强制执行
        this._failsafeTimer = setTimeout(() => {
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                this._failsafeTimer = null;
                if (resolve) resolve(val);
            }
        }, 500);
    },

    // Open with animation
    _open(layerId = 'customModal') {
        const els = this._getEls();
        if (!els) return;

        const { modal, inner } = els;
        
        // 清除旧定时器
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._failsafeTimer) {
            clearTimeout(this._failsafeTimer);
            this._failsafeTimer = null;
        }

        this._currentLayerId = layerId;

        // 注册到视图管理栈 (用于物理返回键监听)
        if (window.AppModules && window.AppModules.View) {
            window.AppModules.View.lockScroll(true);
            if (window.AppModules.View.registerLayer) {
                window.AppModules.View.registerLayer(layerId, () => {
                    // 如果用户按了返回键，模拟点击取消
                    const cancelBtn = document.getElementById('modalCancel');
                    if (cancelBtn) cancelBtn.click();
                });
            }
        }

        modal.classList.remove('hidden');

        // Force a browser reflow/repaint to ensure the starting animation state (scale-90, opacity-0) is registered
        void modal.offsetHeight;

        modal.classList.add('opacity-100');
        modal.classList.remove('opacity-0');
        inner.classList.add('scale-100');
        inner.classList.remove('scale-90');
    },

    // --- Public API ---

    /**
     * Show a simple alert dialog
     */
    alert(title, body, btnText = "OK") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(true);

            els.title.innerText = title;
            els.body.innerHTML = body;
            els.confirm.innerText = btnText;
            els.confirm.className = "flex-1 text-base text-[#007AFF] font-bold active:bg-gray-200/50 dark:active:bg-white/5 transition-colors";

            els.cancel.classList.add('hidden');
            els.alt.classList.add('hidden');

            els.confirm.onclick = () => this._close(true, resolve);
            this._open('alert');
        });
    },

    /**
     * Show a confirmation dialog (Yes/No)
     */
    confirm(title, body, confirmText = "Continue", cancelText = "Cancel") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(false);

            els.title.innerText = title;
            els.body.innerHTML = body;
            els.confirm.innerText = confirmText;
            els.cancel.innerText = cancelText;

            els.cancel.classList.remove('hidden');
            els.alt.classList.add('hidden');
            els.confirm.className = "flex-1 text-base text-[#007AFF] font-bold active:bg-gray-200/50 dark:active:bg-white/5 transition-colors";

            els.cancel.onclick = () => this._close(false, resolve);
            els.confirm.onclick = () => this._close(true, resolve);
            this._open('confirm');
        });
    },

    /**
     * Show a prompt dialog for user input
     */
    prompt(title, body, defaultValue = "") {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(null);

            els.title.innerText = title;
            els.body.innerHTML = `<div class="mb-2">${body}</div><input type="text" id="modalInput" class="w-full p-3 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:border-[#007AFF] transition-all" value="${_escape(defaultValue)}">`;

            els.cancel.classList.remove('hidden');
            els.alt.classList.add('hidden');
            els.cancel.innerText = "Cancel";
            els.confirm.innerText = "Save";
            els.confirm.className = "flex-1 text-base text-[#007AFF] font-bold active:bg-gray-200/50 dark:active:bg-white/5 transition-colors";

            els.cancel.onclick = () => this._close(null, resolve);
            els.confirm.onclick = () => {
                const val = document.getElementById('modalInput').value;
                this._close(val, resolve);
            };

            this._open('prompt');
            setTimeout(() => {
                const input = document.getElementById('modalInput');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        });
    },

    /**
     * [New] Show custom HTML content with flexible buttons
     */
    showCustom(title, html, buttons = [{ text: 'OK', value: true, primary: true }]) {
        return new Promise(resolve => {
            const els = this._getEls();
            if (!els) return resolve(null);

            els.title.innerText = title;
            els.body.innerHTML = html;

            // Dynamically adjust width for complex/import custom dialogs
            if (title.includes('AI Import') || html.includes('AI Prompt Template') || html.includes('batchJsonInput')) {
                els.inner.style.maxWidth = '420px';
            } else {
                els.inner.style.maxWidth = '';
            }

            // 隐藏所有默认按钮，由代码动态控制显示
            els.cancel.classList.add('hidden');
            els.alt.classList.add('hidden');
            els.confirm.classList.add('hidden');

            // 这里的逻辑比较特殊：如果有 3 个按钮，我们需要特殊的布局
            // 目前支持最多 2 个按钮的快速映射，或者 1 个
            if (buttons.length >= 1) {
                els.confirm.classList.remove('hidden');
                els.confirm.innerText = buttons[0].text;
                els.confirm.className = `flex-1 text-base text-[#007AFF] ${buttons[0].primary ? 'font-bold' : 'font-normal'} active:bg-gray-200/50 dark:active:bg-white/5 transition-colors`;
                els.confirm.onclick = () => this._close(buttons[0].value, resolve);
            }

            if (buttons.length >= 2) {
                els.cancel.classList.remove('hidden');
                els.cancel.innerText = buttons[1].text;
                els.cancel.className = `flex-1 text-base text-[#007AFF] ${buttons[1].primary ? 'font-bold' : 'font-normal'} border-r border-gray-200 dark:border-white/10 active:bg-gray-200/50 dark:active:bg-white/5 transition-colors`;
                els.cancel.onclick = () => this._close(buttons[1].value, resolve);
            }

            this._open('custom');
        });
    }
};
