/**
 * CHS App Bridge SDK v1.1 (Passive Mode)
 * 
 * 极简版 SDK：仅提供主题状态查询，不进行实时干预。
 * 给予 Extension 插件 100% 的自主权，主程序仅在初始化时提供建议。
 */

window.AppBridge = {
    /**
     * 【核心函数】查询当前系统（主程序）是否处于深色模式
     * 开发者应在 window.onload 时调用此函数来初始化插件主题。
     * @returns {boolean}
     */
    isDark: function() {
        try {
            // 核心改进：直接观察父窗口（主程序）的 HTML 标签是否有 dark 类名
            // 这种方式比访问 AppModules 快得多，且在加载早期就可用
            if (window.parent && window.parent.document && window.parent.document.documentElement) {
                return window.parent.document.documentElement.classList.contains('dark');
            }
        } catch(e) {
            // 如果存在跨域限制，回退到系统偏好
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    },

    /**
     * --- 交互模块 (Interaction Module) ---
     * 允许插件触发主程序的原生弹窗 (Alert/Confirm/Prompt)
     */
    alert: async function(title, body, btnText) {
        if (window.parent && window.parent.AppModules && window.parent.AppModules.Modal) {
            return await window.parent.AppModules.Modal.alert(title, body, btnText);
        }
        return window.alert(body); // 回退到浏览器原生
    },

    confirm: async function(title, body, confirmText, cancelText) {
        if (window.parent && window.parent.AppModules && window.parent.AppModules.Modal) {
            return await window.parent.AppModules.Modal.confirm(title, body, confirmText, cancelText);
        }
        return window.confirm(body);
    },

    prompt: async function(title, body, placeholder, defaultValue) {
        if (window.parent && window.parent.AppModules && window.parent.AppModules.Modal) {
            return await window.parent.AppModules.Modal.prompt(title, body, placeholder, defaultValue);
        }
        return window.prompt(body, defaultValue);
    }
};
