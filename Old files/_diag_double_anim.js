// 诊断:未登录侧栏 Recent/Contacts/Class 切换时"动画走了两次"
// 用法:未登录页面(F5 硬刷新后)整份粘贴到 Console,然后去点 Recent/Contacts/Class,
// 复现"闪两次"后,把控制台全部输出复制回来。关闭探针: __dblStop()
(() => {
    const S = window.AppModules?.Sidebar;
    if (!S) { console.log('[DBL] 找不到 AppModules.Sidebar'); return; }
    const t0 = performance.now();
    const at = () => (performance.now() - t0).toFixed(0).padStart(6, ' ') + 'ms';
    window.__dblLog = [];
    const log = (...a) => { const line = ['[DBL]', at(), ...a].join(' '); console.log(line); window.__dblLog.push(line); };

    // 1) 谁在调 renderSidebar(点击 or 别处补刀),带调用栈
    if (!S.__dblWrapped) {
        const orig = S.renderSidebar.bind(S);
        S.renderSidebar = function (isTabSwitch) {
            const rafPending = S._renderRaf !== null;
            const rendering = S.isRendering();
            log(`renderSidebar(isTabSwitch=${!!isTabSwitch}) mode=${window.sidebarMode} rafPending=${rafPending} inShell=${rendering} queued=${!!S._queuedRender} pendingFlag=${!!S._pendingTabSwitch}`);
            log('   stack: ' + new Error().stack.split('\n').slice(2, 6).join(' <- ').replace(/https?:\/\/[^ )]+/g, m => m.split('/').pop()));
            return orig(isTabSwitch);
        };
        // 2) shell 真正执行了几次
        const origShell = S._renderShell.bind(S);
        S._renderShell = function (isTabSwitch) {
            log(`_renderShell ENTER isTabSwitch=${!!isTabSwitch} key=${this._renderStateKey} lastAnimKey=${this._lastTabAnimationKey} _isPopNav=${!!window._isPopNav} preview=${!!window.isChatPreview}`);
            return origShell(isTabSwitch).then(r => { log(`_renderShell DONE isTabSwitch=${!!isTabSwitch}`); return r; });
        };
        S.__dblWrapped = true;
    }

    // 3) 入场动画类被加了几次、加在谁身上
    const target = document.getElementById('sidebarList');
    const mo = new MutationObserver(ms => {
        for (const m of ms) {
            if (m.type === 'attributes' && m.target.classList?.contains('tab-fade-up')
                && (m.oldValue || '').indexOf('tab-fade-up') === -1) {
                log(`class +tab-fade-up on #sidebarSubList (mode=${window.sidebarMode})`);
            }
            if (m.type === 'childList' && m.addedNodes.length && m.target.id === 'sidebarSubList') {
                log(`#sidebarSubList replaceChildren(${m.addedNodes.length} nodes) mode=${window.sidebarMode}`);
            }
        }
    });
    if (target) mo.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

    // 4) CSS 动画真实开播事件
    const anim = e => {
        const el = e.target;
        const id = el.id ? '#' + el.id : (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : el.tagName);
        log(`animationstart ${e.animationName} on ${id} (mode=${window.sidebarMode})`);
    };
    document.addEventListener('animationstart', anim, true);

    window.__dblStop = () => {
        mo.disconnect();
        document.removeEventListener('animationstart', anim, true);
        console.log('[DBL] stopped');
    };
    log('探针已挂上。现在去点 Recent/Contacts/Class,复现闪两次后把日志贴回来。');
})();
