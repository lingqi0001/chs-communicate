// js/utils.js
// 存放全站通用的纯工具函数
// 拆分逻辑：Layer 10 - 文具盒 (Utilities)

/**
 * js/utils.js
 * 全局工具函数库 (Global Utility Toolbox)
 * 
 * [职责] 
 * 提供与业务无关的纯算法支持。负责文本清洗、格式转换、时间计算。
 * 该文件不依赖任何外部数据库，确保可以在任何环境下独立运行。
 * 
 * [包含函数清单]
 * 1. UIUtils.escape(text): 防 XSS 攻击，将敏感 HTML 字符转义。
 * 2. UIUtils.linkify(text): 自动识别文本中的 URL 并转换为可点击的 <a> 链接。
 * 3. UIUtils.formatLastSeen(date): 将时间戳转换为 "Just now", "5m ago" 等易读格式。
 * 4. DateUtils.getLocalDateString(offset): 获取本地日期字符串 (如 "2024-05-13")，支持天数偏移。
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
