/**
 * ==================================================================================
 * 模块名称：UIComponents (UI 组件工厂)
 * 目标文件：js/ui-components.js
 * 
 * 【设计哲学】：
 * UIComponents 是全站的“美工刀”。它是一个纯粹的渲染引擎，负责将云端�?JSON 
 * 数据转化为带有高度复杂交互逻辑（如图片堆叠展开、投票状态高亮）�?HTML 片段�? * 它通过解耦渲染逻辑，确保了全站视觉风格的高度统一�? * 
 * 【函数清�?& 使用手册】：
 * 
 * 1. createChatBubble(msg, key, currentUser, setupLongPressCallback) [核心气泡工厂]
 *    - 【输入】：msg (Object) - 消息对象；key (String) - 消息 ID；currentUser (Object) - 当前登录用户�? *    - 【返回】：HTMLElement - 构造好�?DOM 节点�? *    - 【存在理由】：这是全站最复杂的渲染函数。它处理了：1. 消息引用逻辑�?. 敏感消息 (Secret) 拦截�?. 图片�?(Image Group) 的“堆�?展开”动画生成�? * 
 * 2. renderNewsCard(post, type, isStaff) [公告卡片]
 *    - 【输入】：post (Object)；type (String)；isStaff (Boolean)�? *    - 【返回】：HTMLString - HTML 字符串�? *    - 【存在理由】：统一了“校园公告”与“俱乐部动态”的卡片样式，并根据身份注入删除权限�? * 
 * 3. renderMedia(post) [媒体容器]
 *    - 【存在理由】：处理发帖中的媒体预览。它内置�?`isPhotoDisabled` 全局开关检查，确保在管理员禁用图片时显示占位符�? * 
 * 4. getSuggestionVotingHtml(post, currentUser) [投票系统]
 *    - 【输入】：post (Object)；currentUser (Object)�? *    - 【存在理由】：这是一个“有状态”的渲染函数。它会根�?`post.votes` 里的记录，实时判定当前用户是否点过赞，并渲染对应的绿�?红色激活状态�? * 
 * 5. renderComment(c, config, currentUser, author) [评论组件]
 *    - 【存在理由】：处理帖子下方的单条评论，支持匿名模式下的身份混淆逻辑�? * ==================================================================================
 */

import { UIUtils } from './utils.js';
import { UserModule } from './user.js';

export const UIComponents = {
    /**
     * [消息气泡组件] createMsgElement
     * 生成聊天界面中的单条消息
     */
    createChatBubble: function (msg, key, currentUser, setupLongPressCallback) {
        // 逻辑适配：使�?UserModule 统一判定管理员权�?        const isAdmin = UserModule.isAdmin();
        if (msg.isSecret && !isAdmin) return null;
        
        const isMe = msg.senderId === currentUser.id;
        const div = document.createElement('div');
        div.dataset.key = key;
        div.className = `msg-pop flex flex-col mb-1.5 w-full ${isMe ? 'items-end' : 'items-start'}`;

        // 处理引用消息
        if (msg.quote) {
            const qDiv = document.createElement('div');
            qDiv.className = `text-xs opacity-50 mb-0.5 px-3 py-1 border-l-2 border-gray-400 max-w-[70%] truncate ${isMe ? 'mr-1 text-right' : 'ml-1 text-left'}`;
            qDiv.innerHTML = `<span class="font-bold">${UIUtils.escape(msg.quote.senderName)}:</span> ${UIUtils.escape(msg.quote.text)}`;
            div.appendChild(qDiv);
        }

        let content = '';
        let images = [];
        // 解析图片组逻辑
        if (msg.type === 'image_group' || (msg.text && msg.text.trim().startsWith('['))) {
            try { images = JSON.parse(msg.text); } catch (e) { }
        } else if (msg.type === 'image' || (msg.text && msg.text.includes('data:image'))) {
            images = [msg.text];
        }

        if (images.length > 0) {
            if (window.isPhotoDisabled) {
                content = `<div class="px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-400 text-xs italic flex items-center gap-2 border border-gray-200 dark:border-white/10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled</div>`;
            } else {
                const enc = encodeURIComponent(JSON.stringify(images));
                if (images.length === 1) {
                    content = `<div class="relative w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                                <img src="${images[0]}" 
                                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" 
                                     onclick="openGallery('${enc}', 0)" 
                                     class="w-full h-full object-cover cursor-pointer ${msg.isExpired ? 'opacity-20 grayscale' : ''}">
                                <div class="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                    <svg class="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span class="text-[9px] font-medium leading-tight">Photo<br>Unavailable</span>
                                </div>
                               </div>`;
                } else {
                    let sH = '';
                    for (let i = images.length - 1; i >= 0; i--) {
                        let tX = isMe ? (i * 12) : -(i * 12);
                        sH += `<div id="img-${key}-${i}" class="absolute left-0 w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl shadow-md transition-all duration-300 ${isMe ? 'origin-left' : 'origin-right'} cursor-pointer overflow-hidden border border-gray-200 dark:border-white/5"
                                    style="top:0px; z-index:${30 - i}; transform:translateX(${tX}px) scale(${1 - (i * 0.05)}); opacity:${i > 3 ? 0 : 1};"
                                    onclick="openGallery('${enc}', ${i})">
                                    <img src="${images[i]}" 
                                         onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                                         class="w-full h-full object-cover ${msg.isExpired ? 'opacity-20 grayscale' : ''}">
                                    <div class="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                        <svg class="w-5 h-5 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        <span class="text-[8px] font-medium">Unavailable</span>
                                    </div>
                               </div>`;
                    }
                    content = `<div id="stack-${key}" class="relative w-36 h-48 ${isMe ? 'ml-24 mr-8' : 'mr-24 ml-8'} mb-2 mt-1 transition-all duration-300">
                                <button id="btn-${key}" onclick="toggleStack('${key}', ${images.length}, ${isMe})" class="absolute ${isMe ? '-left-24' : '-right-24'} top-20 bg-[#E9E9EB] dark:bg-gray-700 text-black dark:text-white text-xs px-3.5 py-1.5 rounded-full z-40 font-medium shadow-sm">Expand ${images.length}</button>
                                ${sH}
                               </div>`;
                }
            }
        } else {
            const bS = isMe ? 'bg-[#007AFF] text-white rounded-3xl rounded-br-sm' : 'bg-[#E9E9EB] dark:bg-gray-700 text-black dark:text-white rounded-3xl rounded-bl-sm';
            content = `<div class="px-3.5 py-2 text-base leading-[1.4] max-w-[75%] inline-block break-words whitespace-pre-wrap shadow-sm ${bS}">${UIUtils.linkify(UIUtils.escape(msg.text))}</div>`;
        }

        const wrapper = document.createElement('div');
        wrapper.innerHTML = content;
        const msgEl = wrapper.firstElementChild;
        
        // 绑定长按事件
        if (setupLongPressCallback) setupLongPressCallback(msgEl, msg);

        div.appendChild(!isMe ? (Object.assign(document.createElement('span'), { className: 'text-xs text-gray-400 mb-0.5 ml-3', innerText: msg.senderName || "Unknown" })) : document.createTextNode(''));
        div.appendChild(msgEl);
        return div;
    },

    /**
     * [卡片组件] renderNewsCard
     */
    renderNewsCard: function (post, type, isStaff) {
        const isSchool = type === 'school';
        const badge = {
            text: isSchool ? 'Announcement' : 'Club Update',
            color: isSchool ? 'text-[#007AFF] bg-blue-100 dark:bg-blue-500/20' : 'text-orange-500 bg-orange-100 dark:bg-orange-500/20'
        };
        const dateStr = UIUtils.formatTime(post.timestamp);

        return `
            <div data-news-key="${post.key}" class="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="flex justify-between items-start">
                    <span class="text-[11px] font-bold ${badge.color} uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">${badge.text}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400 font-medium">${dateStr}</span>
                        ${isStaff ? `<button onclick="deleteNews('${post.key}', '${type}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : ''}
                    </div>
                </div>
                <h3 class="font-bold text-base mt-1.5 mb-1.5 text-black dark:text-white leading-snug">${UIUtils.escape(post.title)}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${UIUtils.linkify(UIUtils.escape(post.desc))}</p>
                ${this.renderMedia(post)}
            </div>`;
    },

    /**
     * [媒体组件] renderMedia
     */
    renderMedia: function (post) {
        if (!post.image) return '';
        if (window.isPhotoDisabled) {
            return `<div class="mt-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled by Admin</div>`;
        }

        const enc = encodeURIComponent(JSON.stringify([post.image]));
        return `
            <div class="relative w-full">
                <img src="${post.image}" class="w-full h-auto rounded-xl mt-3 cursor-pointer object-cover max-h-[300px] border border-gray-100 dark:border-gray-800" 
                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                     onclick="openGallery('${enc}')">
                <div class="hidden mt-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2 border border-dashed border-gray-200 dark:border-gray-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Photo no longer available
                </div>
            </div>`;
    },

    /**
     * [投票组件] getSuggestionVotingHtml
     * 已适配传入 currentUser 逻辑
     */
    getSuggestionVotingHtml: function (post, currentUser) {
        if (!window.MODULE_CONFIG[window.currentModule]?.hasVoting) return '';
        const votes = post.votes || {};
        const upvotes = Object.values(votes).filter(v => v === 1).length;
        const downvotes = Object.values(votes).filter(v => v === -1).length;
        
        // 使用传入�?currentUser 或全局代理获取当前用户的投票状�?        const user = currentUser || UserModule.current;
        const myVote = user ? votes[user.id] : 0;

        return `
            <div class="flex items-center gap-4 mt-4 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                <button onclick="votePost('${post.id}', 1)" class="flex items-center gap-1.5 ${myVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}">
                    <svg class="w-6 h-6 ${myVote === 1 ? 'fill-current' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 15l7-7 7 7"/></svg>
                    <span class="font-bold text-sm">${upvotes}</span>
                </button>
                <button onclick="votePost('${post.id}', -1)" class="flex items-center gap-1.5 ${myVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}">
                    <svg class="w-6 h-6 ${myVote === -1 ? 'fill-current' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
                    <span class="font-bold text-sm">${downvotes}</span>
                </button>
            </div>`;
    },

    /**
     * [单条评论组件] renderComment
     */
    renderComment: function (c, config, currentUser, author) {
        const cAuthorName = config.anonymous ? 'Anonymous' : (c.authorName || 'Unknown');
        const cAuthorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anon&background=random' : (author?.avatar || 'https://ui-avatars.com/api/?name=' + cAuthorName);
        const timeStr = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="flex gap-4">
                <img src="${cAuthorAvatar}" class="w-10 h-10 rounded-full mt-1">
                <div class="flex-1 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-sm text-black dark:text-white">${UIUtils.escape(cAuthorName)}</span>
                        <span class="text-gray-400 text-xs">${timeStr}</span>
                    </div>
                    <div class="text-base text-gray-700 dark:text-gray-300">${UIUtils.linkify(UIUtils.escape(c.text))}</div>
                </div>
            </div>`;
    }
};
