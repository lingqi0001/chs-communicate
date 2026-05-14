/**
 * ==================================================================================
 * 模块名称：AppUtils (全站工具箱)
 * 目标文件：js/utils.js
 * 
 * 【设计哲学】：
 * 本模块存放的是“绝对纯净”的辅助函数。它们不依赖任何业务逻辑，也不保存任何状态。
 * 它们存在的意义是解决 JS 原生 API 在文本处理、日期计算、以及 UI 视觉反馈上的不足。
 * 
 * 【函数清单 & 使用手册】：
 * 
 * 1. UIUtils.formatTime(timestamp) [模糊时间转换]
 *    - 【输入】：timestamp (Number) - 毫秒时间戳。
 *    - 【返回】：String - 如 "5m ago", "Just now"。
 *    - 【存在理由】：比原生 `Date.toString()` 更符合人类阅读习惯，常用于公告卡片的时间显示。
 * 
 * 2. UIUtils.escape(str) [XSS 防御核心]
 *    - 【输入】：str (String) - 待转义文本。
 *    - 【返回】：String - 转义后的 HTML 编码字符串。
 *    - 【存在理由】：这是一个极其高效的“奇技淫巧”。它通过创建一个内存中的 `p` 标签并设置其 `textContent`，利用浏览器自带的渲染引擎实现 100% 安全的转义，比手动正则替换更稳健。
 * 
 * 3. UIUtils.highlight(el) [交互反馈]
 *    - 【输入】：el (HTMLElement) - 目标 DOM。
 *    - 【存在理由】：为新加载的消息或刚点击的元素提供一个短暂的“呼吸灯”效果，增强用户视觉引导。
 * 
 * 4. UIUtils.linkify(text) [超链接识别]
 *    - 【输入】：text (String) - 包含 URL 的原始文本。
 *    - 【返回】：String - 带有 `<a>` 标签和 External Link 图标的 HTML 字符串。
 *    - 【存在理由】：自动将用户发送的网址转化为可点击的链接，并统一注入样式规范。
 * 
 * 5. UIUtils.formatLastSeen(timestamp) [在线状态计算]
 *    - 【输入】：timestamp (Number)。
 *    - 【返回】：String - 如 "online", "last seen 2 hours ago"。
 *    - 【存在理由】：专为联系人列表设计，定义了 2 分钟内的“活跃阈值”。
 * 
 * 6. DateUtils.getLocalDateString(offsetDays) [标准日期生成]
 *    - 【输入】：offsetDays (Number) - 偏移天数（如 -1 代表昨天）。
 *    - 【返回】：String - "YYYY-MM-DD" 格式。
 *    - 【存在理由】：全站数据库的日期节点（如 `eagle_time/2026-05-13`）都依赖此函数生成的唯一字符串作为索引。
 * ==================================================================================
 */

export const UIUtils = {
    /**
     * 将毫秒时间戳转换为人性化的模糊时间 (如: 5m ago)
     */
    formatTime: function (timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return "Just now";
        if (diff < 3600) return Math.floor(diff / 60) + "m ago";
        if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
        return date.toLocaleDateString();
    },

    /**
     * XSS 安全转义，防止 HTML 注入
     */
    escape: (str) => {
        if (!str) return "";
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    },

    /**
     * 为元素添加短暂的高亮闪烁动画
     */
    highlight: (el) => {
        if (!el) return;
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 1200);
    },

    /**
     * 自动识别文本中的链接并转换为 HTML 标签
     */
    linkify: (text) => {
        if (!text) return "";
        const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" class="text-[#007AFF] font-bold hover:underline inline-flex items-center gap-0.5 mx-1">Link <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>`;
        });
    },

    /**
     * 格式化最后上线时间
     */
    formatLastSeen: (timestamp) => {
        if (!timestamp) return "";
        const now = Date.now();
        const diff = now - timestamp;
        const mins = Math.floor(diff / 60000);

        if (mins < 2) return "online";
        if (mins < 60) return `last seen ${mins} minute${mins > 1 ? 's' : ''} ago`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        return `last seen ${days} day${days > 1 ? 's' : ''} ago`;
    }
};

export const DateUtils = {
    /**
     * 获取指定偏移天数的 ISO 日期字符串 (YYYY-MM-DD)
     */
    getLocalDateString: (offsetDays = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};
