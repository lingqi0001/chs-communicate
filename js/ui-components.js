/**
 * ==================================================================================
 * 讓｡蝮怜錐遘ｰ�啅IComponents (UI 扈�ｻｶ蟾･蜴)
 * 逶ｮ譬�枚莉ｶ�嗚s/ui-components.js
 * 
 * 縲占ｮｾ隶｡蜩ｲ蟄ｦ縲托ｼ
 * UIComponents 譏ｯ蜈ｨ遶咏噪窶懃ｾ主ｷ･蛻窶昴ょｮ�弍荳荳ｪ郤ｯ邊ｹ逧�ｸｲ譟灘ｼ墓梼�瑚ｴ溯ｴ｣蟆�ｺ醍ｫｯ逧?JSON 
 * 謨ｰ謐ｮ霓ｬ蛹紋ｸｺ蟶ｦ譛蛾ｫ伜ｺｦ螟肴揩莠､莠帝ｻ霎托ｼ亥ｦょ崟迚��匠螻募ｼ縲∵兜逾ｨ迥ｶ諤�ｫ倅ｺｮ�臥?HTML 迚�ｮｵ縲? * 螳�夊ｿ�ｧ｣閠ｦ貂ｲ譟馴ｻ霎托ｼ檎｡ｮ菫昜ｺ��遶呵ｧ�ｧ蛾｣取ｼ逧�ｫ伜ｺｦ扈滉ｸ縲? * 
 * 縲仙�謨ｰ貂�?& 菴ｿ逕ｨ謇句�縲托ｼ
 * 
 * 1. createChatBubble(msg, key, currentUser, setupLongPressCallback) [譬ｸ蠢�ｰ疲ｳ｡蟾･蜴�
 *    - 縲占ｾ灘�縲托ｼ嗄sg (Object) - 豸域�蟇ｹ雎｡�嫐ey (String) - 豸域� ID�嫩urrentUser (Object) - 蠖灘燕逋ｻ蠖慕畑謌ｷ縲? *    - 縲占ｿ泌屓縲托ｼ唏TMLElement - 譫�螂ｽ逧?DOM 闃らせ縲? *    - 縲仙ｭ伜惠逅�罰縲托ｼ夊ｿ呎弍蜈ｨ遶呎怙螟肴揩逧�ｸｲ譟灘�謨ｰ縲ょｮ�､�炊莠�ｼ1. 豸域�蠑慕畑騾ｻ霎托ｼ?. 謨乗─豸域� (Secret) 諡ｦ謌ｪ�?. 蝗ｾ迚�ｻ?(Image Group) 逧�懷�?螻募ｼ窶晏勘逕ｻ逕滓�縲? * 
 * 2. renderNewsCard(post, type, isStaff) [蜈ｬ蜻雁今迚Ⅹ
 *    - 縲占ｾ灘�縲托ｼ嗔ost (Object)�孚ype (String)�嬖sStaff (Boolean)縲? *    - 縲占ｿ泌屓縲托ｼ唏TMLString - HTML 蟄礼ｬｦ荳ｲ縲? *    - 縲仙ｭ伜惠逅�罰縲托ｼ夂ｻ滉ｸ莠�懈｡蝗ｭ蜈ｬ蜻岩昜ｸ寂應ｿｱ荵宣Κ蜉ｨ諤≫晉噪蜊｡迚�ｷ蠑擾ｼ悟ｹｶ譬ｹ謐ｮ霄ｫ莉ｽ豕ｨ蜈･蛻髯､譚�剞縲? * 
 * 3. renderMedia(post) [蟐剃ｽ灘ｮｹ蝎ｨ]
 *    - 縲仙ｭ伜惠逅�罰縲托ｼ壼､�炊蜿大ｸ紋ｸｭ逧�ｪ剃ｽ馴｢�ｧ医ょｮ��鄂ｮ莠?`isPhotoDisabled` 蜈ｨ螻蠑蜈ｳ譽譟･�檎｡ｮ菫晏惠邂｡逅�遭遖∫畑蝗ｾ迚�慮譏ｾ遉ｺ蜊菴咲ｬｦ縲? * 
 * 4. getSuggestionVotingHtml(post, currentUser) [謚慕･ｨ邉ｻ扈歉
 *    - 縲占ｾ灘�縲托ｼ嗔ost (Object)�嫩urrentUser (Object)縲? *    - 縲仙ｭ伜惠逅�罰縲托ｼ夊ｿ呎弍荳荳ｪ窶懈怏迥ｶ諤≫晉噪貂ｲ譟灘�謨ｰ縲ょｮ�ｼ壽ｹ謐?`post.votes` 驥檎噪隶ｰ蠖包ｼ悟ｮ樊慮蛻､螳壼ｽ灘燕逕ｨ謌ｷ譏ｯ蜷ｦ轤ｹ霑�ｵ橸ｼ悟ｹｶ貂ｲ譟灘ｯｹ蠎皮噪扈ｿ濶?郤｢濶ｲ豼豢ｻ迥ｶ諤√? * 
 * 5. renderComment(c, config, currentUser, author) [隸�ｮｺ扈�ｻｶ]
 *    - 縲仙ｭ伜惠逅�罰縲托ｼ壼､�炊蟶門ｭ蝉ｸ区婿逧�黒譚｡隸�ｮｺ�梧髪謖∝諺蜷肴ｨ｡蠑丈ｸ狗噪霄ｫ莉ｽ豺ｷ豺�ｻ霎代? * ==================================================================================
 */

import { UIUtils } from './utils.js';
import { UserModule } from './user.js';

export const UIComponents = {
    /**
     * [豸域豌疲ｳ｡扈ｻｶ] createMsgElement
     * 逕滓閨雁､ｩ逡碁擇荳ｭ逧黒譚｡豸域
     */
    createChatBubble: function (msg, key, currentUser, setupLongPressCallback, showSenderName = true) {
        // 逻辑判定：使用 UserModule 统一判定管理权限
        const isAdmin = UserModule.isAdmin ? UserModule.isAdmin() : false;
        if (msg.isSecret && !isAdmin) return null;

        if (msg && typeof msg === 'object') {
            msg.key = key;
        }

        const isMe = msg.senderId === currentUser.id;
        const div = document.createElement('div');
        div.dataset.key = key;
        div.setAttribute('data-sender-id', String(msg.senderId || ''));
        const rawTs = msg?.timestamp;
        let tsMs = null;
        if (typeof rawTs === 'number' && Number.isFinite(rawTs)) {
            tsMs = rawTs > 1e12 ? rawTs : rawTs * 1000;
        } else if (rawTs instanceof Date) {
            tsMs = rawTs.getTime();
        } else if (rawTs && typeof rawTs === 'object') {
            if (typeof rawTs.toMillis === 'function') {
                tsMs = rawTs.toMillis();
            } else if (typeof rawTs.seconds === 'number') {
                tsMs = rawTs.seconds * 1000;
            }
        }
        if (typeof tsMs === 'number' && Number.isFinite(tsMs)) {
            div.setAttribute('data-timestamp-ms', String(Math.floor(tsMs)));
        }
        if (msg.text) {
            div.setAttribute('data-raw-text', msg.text);
        }
        div.className = `msg-pop flex flex-col mb-4 w-full ${isMe ? 'items-end' : 'items-start'}`;

        // 螟炊蠑慕畑豸域


        let content = '';
        let images = [];
        // 隗｣譫仙崟迚ｻ ｻ霎 
        if (msg.type === 'image_group' || (msg.text && msg.text.trim().startsWith('['))) {
            try { images = JSON.parse(msg.text); } catch (e) { }
        } else if (msg.type === 'image' || (msg.text && msg.text.includes('data:image'))) {
            images = [msg.text];
        }

        if (msg.type === 'comment_card' && msg.commentCard) {
            content = UIComponents.renderCommentCardMsg(msg, key, isMe);
        } else if (msg.isExpired || msg.text === 'Image Expired') {
            content = `<div class="relative w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/5 shadow-inner">
                        <svg class="w-8 h-8 mb-2 opacity-40 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <span class="text-[10px] font-bold tracking-wide uppercase opacity-60">Image Expired</span>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="text-[8px] opacity-40">Quota Exceeded</span>
                            <button onclick="event.stopPropagation(); AppModules.Modal.alert('Storage Limit Details', 'To guarantee stable performance and optimize server storage, every user is limited to a maximum of 15 active images across their chat history. Once this quota is exceeded, older photos are automatically expired and marked as unavailable to free up server space.')" class="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[7px] text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer" title="Storage Quota Info">?</button>
                        </div>
                       </div>`;
        } else if (images.length > 0) {
            if (window.isPhotoDisabled) {
                content = `<div class="px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-400 text-xs italic flex items-center gap-2 border border-gray-200 dark:border-white/10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled</div>`;
            } else {
                const enc = encodeURIComponent(JSON.stringify(images));
                if (images.length === 1) {
                    content = `<div class="relative w-36 h-48 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                                <img src="${UIUtils.escape(images[0])}" 
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
                                    <img src="${UIUtils.escape(images[i])}" 
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
        } else if (msg.text && msg.text.includes('docs.google.com/document/d/')) {
            // Render Clean Google Doc Writing Card (No emojis, minimal light blue design)
            content = UIComponents.renderDocCard(msg, key, isMe);
        } else {
            const bS = isMe ? 'chat-accent-bg bg-[#007AFF] text-white rounded-3xl rounded-br-sm' : 'other-accent-bg bg-[#E9E9EB] dark:bg-gray-700 text-black dark:text-white rounded-3xl rounded-bl-sm';
            content = `<div class="px-[18px] py-2 text-base leading-[1.4] max-w-[75%] inline-block break-words whitespace-pre-wrap shadow-sm ${bS}">${UIUtils.linkify(UIUtils.escape(msg.text), isMe)}</div>`;
        }


        const wrapper = document.createElement('div');
        wrapper.innerHTML = content;
        const msgEl = wrapper.firstElementChild;

        // 扈大ｮ夐柄謖我ｺ倶ｻｶ
        if (setupLongPressCallback) setupLongPressCallback(msgEl, msg);

        const shouldRenderSenderName = !isMe && showSenderName;
        div.appendChild(shouldRenderSenderName ? (Object.assign(document.createElement('span'), { className: 'text-xs text-gray-400 mb-0.5 ml-3', innerText: msg.senderName || "Unknown" })) : document.createTextNode(''));
        div.appendChild(msgEl);

        if (msg.quote) {
            const qDiv = document.createElement('div');
            // Style with flat corner at top-right for isMe, top-left for !isMe
            const cornerClass = isMe 
                ? 'rounded-tl-xl rounded-bl-xl rounded-br-xl rounded-tr-none' 
                : 'rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-none';
            
            qDiv.className = `text-[11px] mt-0.5 px-2.5 py-1 max-w-[78%] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 shadow-sm ${cornerClass} text-left truncate whitespace-nowrap`;
            const replyIcon = `<svg class="w-3 h-3 inline-block mr-1 -mt-0.5 opacity-60" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>`;
            const clickAttr = msg.quote.messageId ? `onclick="window.jumpToMessage('', '', '${msg.quote.messageId}')" class="cursor-pointer hover:opacity-80 transition-opacity"` : 'class="select-none"';
            qDiv.innerHTML = `<div ${clickAttr} class="truncate whitespace-nowrap w-full">${replyIcon}<span class="font-bold text-gray-600 dark:text-gray-300">${UIUtils.escape(msg.quote.senderName)}:</span> <span class="opacity-90">${UIUtils.escape((msg.quote.text || '').replace(/\r?\n/g, ' '))}</span></div>`;
            div.appendChild(qDiv);
        }

        return div;
    },

    /**
     * [蜊｡迚ｻｻｶ] renderNewsCard
     */
    renderNewsCard: function (post, type, isStaff) {
        const isSchool = type === 'school';
        
        // For Club News, use club name if available, otherwise use generic label
        let badgeText;
        if (isSchool) {
            badgeText = 'Announcement';
        } else {
            // For club posts, show the specific club name
            if (post.clubName) {
                badgeText = post.clubName;
            } else {
                badgeText = 'Club Update';
            }
        }
        const badgeColor = 'text-[#007AFF] dark:text-[#0A84FF]';
        
        const dateStr = UIUtils.formatTime(post.timestamp);

        return `
            <div data-news-key="${post.key}" class="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 transition-all duration-300 hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[11px] font-bold ${badgeColor} uppercase tracking-wider inline-block flex-shrink-0 max-w-[60%] break-words leading-none">${UIUtils.escape(badgeText)}</span>
                    <div class="flex items-center gap-2 ml-auto">
                        <span class="text-xs text-gray-400 font-medium whitespace-nowrap leading-none">${dateStr}</span>
                        ${isStaff ? `<button onclick="deleteNews('${post.key}', '${type}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : ''}
                    </div>
                </div>
                <h3 class="font-bold text-base mt-1.5 mb-1.5 text-black dark:text-white leading-snug">${UIUtils.escape(post.title)}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${UIUtils.linkify(UIUtils.escape(post.desc))}</p>
                ${this.renderMedia(post)}
            </div>`;
    },

    /**
     * [蟐剃ｽ鍋ｻｻｶ] renderMedia
     */
    renderMedia: function (post) {
        if (!post.image) return '';
        if (window.isPhotoDisabled) {
            return `<div class="mt-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled by Admin</div>`;
        }

        const enc = encodeURIComponent(JSON.stringify([post.image]));
        return `
            <div class="relative w-full">
                <img src="${UIUtils.escape(post.image)}" class="w-full h-auto rounded-xl mt-3 cursor-pointer object-cover max-h-[300px] border border-gray-100 dark:border-white/5" 
                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                     onclick="openGallery('${enc}')">
                <div class="hidden mt-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2 border border-dashed border-gray-200 dark:border-white/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Photo no longer available
                </div>
            </div>`;
    },

    /**
     * [謚慕･ｨ扈ｻｶ] getSuggestionVotingHtml
     * 蟾ｲ騾る莨 蜈･ currentUser 騾ｻ霎 
     */
    getSuggestionVotingHtml: function (post, currentUser) {
        if (!window.MODULE_CONFIG[window.currentModule]?.hasVoting) return '';
        const votes = post.votes || {};
        const upvotes = Object.values(votes).filter(v => v === 1).length;
        const downvotes = Object.values(votes).filter(v => v === -1).length;

        // 菴ｿ逕ｨ莨 蜈･逧?currentUser 謌門螻 莉｣逅執蜿門ｽ灘燕逕ｨ謌ｷ逧兜逾ｨ迥ｶ諤?        const user = currentUser || UserModule.current;
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
     * [蜊墓擅隸ｮｺ扈ｻｶ] renderComment
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
    },

    /**
     * [Doc Sync State Helpers] 统一解析后端 writing_doc_state 状态机输出，
     * 前端只展示，不自行推断 access lost。
     */
    docLiveComments: function (comments) {
        return (comments || []).filter(c => c && !c.deleted && c.status !== 'deleted_on_google');
    },

    // Service-account courier email; comments it posts carry a
    // "Created by <platform user>: <text>" prefix that we strip for display.
    BOT_DOCS_EMAIL: 'chscommunication@appspot.gserviceaccount.com',

    docCommentDisplay: function (c) {
        const email = String(c?.author?.emailAddress || '').toLowerCase();
        const name = String(c?.author?.displayName || '');
        const content = c?.content || '';
        const isBot = email === UIComponents.BOT_DOCS_EMAIL
            || email.endsWith('.gserviceaccount.com')
            || name.toLowerCase().endsWith('.gserviceaccount.com');
        if (isBot) {
            const m = content.match(/^Created by ([^:\n]{1,80}):\s?([\s\S]*)$/);
            if (m) return { author: m[1].trim() || name, content: m[2], viaBot: true };
            return { author: 'Bot', content, viaBot: true };
        }
        return { author: name, content, viaBot: false };
    },

    docBadgeLabel: function (docData) {
        const live = UIComponents.docLiveComments(docData?.comments);
        const count = live.length;
        let label;
        if (count > 0) {
            label = count === 1 ? '1 comment' : `${count} comments`;
        } else {
            label = 'Google Doc';
        }
        const suffixMap = {
            access_lost: ' · Access lost',
            access_lost_or_file_unavailable: ' · Access lost',
            file_unavailable: ' · Unavailable',
            comments_access_lost: ' · Comment access lost',
            comments_unavailable: ' · Comments unavailable',
            comments_unavailable_or_empty: ' · Comments unavailable',
            auth_required: ' · Reconnect Google',
            sync_failed_retryable: ' · Sync delayed'
        };
        const status = docData?.syncStatus;
        if (status && suffixMap[status]) label += suffixMap[status];
        return label;
    },

    renderDocStatusNoticeHtml: function (docData, key) {
        if (!docData) return '';
        const status = docData.syncStatus || (docData.accessLost ? 'access_lost' : '');
        if (!status || status === 'synced') return '';

        const syncedAt = docData.lastSuccessfulSyncAt || docData.lastSyncedAt || null;
        const lastSyncedText = syncedAt
            ? new Date(syncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            : 'an earlier date';
        const liveCount = typeof docData.lastKnownCommentCount === 'number'
            ? docData.lastKnownCommentCount
            : UIComponents.docLiveComments(docData.comments).length;
        const snapshotClause = liveCount > 0
            ? ` Showing saved snapshot: ${liveCount} comment${liveCount === 1 ? '' : 's'}.`
            : '';

        const noticeMap = {
            access_lost: { t: 'Access lost', b: `Last synced ${lastSyncedText}.${snapshotClause} Reconnect access to retrieve newer comments.` },
            access_lost_or_file_unavailable: { t: 'Access lost or file unavailable', b: `Last synced ${lastSyncedText}.${snapshotClause} Reconnect access or check whether the file still exists.` },
            file_unavailable: { t: 'File unavailable', b: `We could not access this Google Doc.` },
            comments_access_lost: { t: 'Comment access lost', b: `The document is still accessible, but comments are no longer readable by CHSchat.${snapshotClause} Grant the bot Commenter access to retrieve newer comments.` },
            comments_unavailable: { t: 'Comments unavailable', b: `Last synced ${lastSyncedText}.${snapshotClause} Showing saved snapshot.` },
            comments_unavailable_or_empty: { t: 'No comments available from Google', b: liveCount > 0 ? `Previously synced ${liveCount} comment${liveCount === 1 ? '' : 's'} on ${lastSyncedText}. Showing saved snapshot.` : `Last synced ${lastSyncedText}.` },
            auth_required: { t: 'Google connection expired', b: `Last synced ${lastSyncedText}.${snapshotClause} Reconnect Google to retrieve newer comments.` },
            sync_failed_retryable: { t: 'Sync delayed', b: `Last synced ${lastSyncedText}.${snapshotClause} We'll try again shortly.` }
        };
        const cfg = noticeMap[status];
        if (!cfg) return '';

        const isSoft = status === 'sync_failed_retryable';
        const tone = isSoft
            ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/20 text-amber-800 dark:text-amber-200';
        const subTone = isSoft
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-amber-700/80 dark:text-amber-200/75';
        return `<div id="docStatusNotice-${key}" class="mx-3.5 mb-3 px-3 py-2 rounded-xl border ${tone} text-[11px] leading-relaxed"><span class="font-bold">${cfg.t}</span><span class="${subTone}"> · ${UIUtils.escape(cfg.b)}</span></div>`;
    },

    /**
     * [Google Doc Comments HTML Builder] 统一的评论列表渲染引擎（保证首次渲染和点击 Sync 后的 UI 100% 绝对一致）
     */
    renderDocCommentsHtml: function (key, comments, count, openCount, resolvedCount, docId, docUrl, docData) {
        const list = comments || [];
        if (list.length === 0) {
            const status = docData?.syncStatus;
            const emptyText = (status === 'no_comments_yet' || status === 'synced')
                ? 'No comments yet. This document has no feedback recorded.'
                : 'No comments found. Click sync to load latest comments.';
            return `
                <div class="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                    ${emptyText}
                </div>
            `;
        }

        const liveList = UIComponents.docLiveComments(list);
        const liveOpen = liveList.filter(c => !c.resolved).length;
        const liveResolved = liveList.length - liveOpen;
        const liveDeleted = list.length - liveList.length;

        // Per-comment payloads so each row's Send button can ship just that comment
        window._docCommentPayloads = window._docCommentPayloads || {};
        window._docCommentPayloads[key] = {
            docId,
            docUrl,
            docTitle: docData?.title || 'Google Document',
            comments: list
        };

        const filterBarHtml = `
            <div class="doc-filter-bar flex items-center gap-2 mb-3">
                <button type="button" onclick="window.filterDocComments('${key}', 'all', event)" id="filterBtn-${key}-all" class="px-3 py-1 rounded-lg text-[12px] font-semibold bg-[#007AFF] text-white shadow-sm transition-all">All (${list.length})</button>
                <button type="button" onclick="window.filterDocComments('${key}', 'open', event)" id="filterBtn-${key}-open" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">Open (${liveOpen})</button>
                <button type="button" onclick="window.filterDocComments('${key}', 'resolved', event)" id="filterBtn-${key}-resolved" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">Resolved (${liveResolved})</button>
                ${liveDeleted > 0 ? `<button type="button" onclick="window.filterDocComments('${key}', 'deleted', event)" id="filterBtn-${key}-deleted" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">Deleted (${liveDeleted})</button>` : ''}
            </div>
        `;

        const itemsHtml = list.map((c, i) => {
            const quoteVal = c.quotedFileContent?.value || '';
            let quoteHtml = '';
            if (quoteVal) {
                const quoteId = `quoteBox-${key}-${i}`;
                const isLong = quoteVal.length > 60;
                quoteHtml = `
                    <div class="mb-2 pl-3 border-l-2 border-[#007AFF]/40 dark:border-[#0A84FF]/50 text-left py-0.5">
                        <div id="${quoteId}" class="text-[13px] text-black dark:text-white leading-relaxed italic ${isLong ? 'line-clamp-2' : ''}">“${UIUtils.escape(quoteVal)}”</div>
                        ${isLong ? `<button type="button" onclick="window.toggleQuoteText('${quoteId}', this, event)" class="mt-0.5 text-[11px] text-[#007AFF] dark:text-[#0A84FF] hover:underline font-medium transition-colors">Expand</button>` : ''}
                    </div>
                `;
            }

            const isDeleted = !!(c.deleted || c.status === 'deleted_on_google');
            const isMissing = c.status === 'missing_from_latest_sync' && !isDeleted;
            const disp = UIComponents.docCommentDisplay(c);
            const author = disp.author || 'Reviewer';

            let statusTag = '';
            if (isDeleted) {
                statusTag = '<span class="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Deleted in Google Docs</span>';
            } else if (isMissing) {
                statusTag = `<span class="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium" title="Google has not returned this comment in the last ${c.missingCount || 1} full sync${(c.missingCount || 1) === 1 ? '' : 's'}">Not in latest sync</span>`;
            } else if (c.resolved) {
                statusTag = '<span class="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Resolved</span>';
            }
            
            // Deep-link to comment in Google Docs
            const commentId = c.id || '';
            const commentDirectUrl = (docId && commentId) 
                ? `https://docs.google.com/document/d/${docId}/edit?disco=${encodeURIComponent(commentId)}`
                : (docUrl || '#');

            let repliesHtml = '';
            // Google inserts empty-content replies when someone resolves or
            // reopens a comment; those are noise here (status is already tagged).
            const visibleReplies = (c.replies || []).filter(r => r && String((UIComponents.docCommentDisplay(r).content) || '').trim());
            if (visibleReplies.length > 0) {
                repliesHtml = visibleReplies.map(r => {
                    const rDisp = UIComponents.docCommentDisplay(r);
                    return `
                    <div class="mt-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 text-[13px]">
                        <span class="font-semibold text-black dark:text-white">${UIUtils.escape(rDisp.author || 'User')}:</span>
                        <span class="text-black dark:text-white ml-1">${UIUtils.escape(rDisp.content || '')}</span>
                    </div>
                `;
                }).join('');
            }

            const rowOpacity = (isDeleted || isMissing) ? ' opacity-60' : '';
            const actionIconClass = isDeleted
                ? 'w-7 h-7 rounded-full flex items-center justify-center text-gray-400 dark:text-white/25 pointer-events-none'
                : 'w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors';
            const replyBtnHtml = (commentId && !isDeleted) ? `
                            <button type="button" onclick="window.replyToDocComment('${key}', ${i}, event)" class="${actionIconClass}" title="Reply to this comment in Google Doc">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </button>` : '';
            // Inline reply box rendered directly under this comment row.
            const replyBoxHtml = (commentId && !isDeleted) ? `
                    <div id="docReplyBox-${key}-${i}" class="hidden mt-2.5 text-left">
                        <textarea id="docReplyText-${key}-${i}" rows="3" maxlength="3000" placeholder="Write your reply…" class="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 text-[13px] text-black dark:text-white outline-none transition-colors resize-none leading-relaxed"></textarea>
                        <div class="flex items-center justify-between gap-2 mt-1.5">
                            <span class="text-[10px] text-black dark:text-white leading-tight">Delivered by the CHSchat bot, signed “Created by you”.</span>
                            <div class="flex items-center gap-1.5 flex-shrink-0">
                                <button type="button" onclick="window.closeDocCommentReply('${key}', ${i}, event)" class="px-3 py-1.5 rounded-xl text-[12px] text-black dark:text-white hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 transition-colors">Cancel</button>
                                <button type="button" id="docReplySend-${key}-${i}" onclick="window.sendDocCommentReply('${key}', ${i}, event)" class="px-3.5 py-1.5 rounded-xl text-[12px] bg-[#007AFF] text-white hover:bg-[#0062CC] active:scale-95 transition-all shadow-sm">Post</button>
                            </div>
                        </div>
                    </div>
            ` : '';
            const dispContent = UIComponents.docCommentDisplay(c).content;
            const contentHtml = isDeleted
                ? (dispContent
                    ? `<div class="text-[12px] text-gray-400 dark:text-gray-500 italic mb-0.5">Previously synced content:</div><div class="text-[14px] italic text-gray-500 dark:text-gray-400 leading-relaxed line-through decoration-gray-300 dark:decoration-white/20">${UIUtils.escape(dispContent)}</div>`
                    : `<div class="text-[13px] italic text-gray-400 dark:text-gray-500">Comment deleted in Google Docs (no snapshot content was saved for it).</div>`)
                : `<div class="text-[14px] text-gray-800 dark:text-white leading-relaxed">${UIUtils.escape(dispContent || '')}</div>`;

            return `
                <div class="comment-item-row py-3 border-b border-gray-100 dark:border-white/[0.04] last:border-b-0 text-left transition-opacity duration-150${rowOpacity}" data-card-key="${key}" data-resolved="${(c.resolved && !isDeleted && !isMissing) ? 'true' : 'false'}" data-comment-deleted="${isDeleted ? 'true' : 'false'}">
                    ${quoteHtml}
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[14px] font-semibold text-black dark:text-white">${UIUtils.escape(author)}</span>
                        <div class="flex items-center gap-2">
                            ${statusTag}
                            ${replyBtnHtml}
                            <button type="button" onclick="window.openCommentSendPicker('${key}', ${i}, event)" class="${actionIconClass}" title="Send this comment">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            <a href="${UIUtils.escape(commentDirectUrl)}" target="_blank" rel="noopener noreferrer" class="${actionIconClass}" title="Jump to this comment in Google Doc">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                    ${contentHtml}
                    ${repliesHtml}
                    ${replyBoxHtml}
                </div>
            `;
        }).join('');

        return `
            ${filterBarHtml}
            <div id="commentListContainer-${key}">
                ${itemsHtml}
            </div>
            <div id="commentEmpty-${key}" class="hidden py-4 text-center text-xs text-gray-400 dark:text-gray-500"></div>
        `;
    },

    /**
     * [Writing Doc Card] Google Docs 批注卡片（极简浅蓝、无 Emoji、纯线条 SVG、支持展开与同步）
     */
    renderDocCard: function (msg, key, isMe) {
        const text = msg.text || '';
        const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)[^\s]*/);
        const docId = msg.docData?.fileId || (match ? match[1] : '');
        const docUrl = msg.docData?.docUrl || (match ? match[0] : (docId ? `https://docs.google.com/document/d/${docId}/edit` : ''));

        // 取出已保存的评论缓存：writing_doc_state 驱动的会话缓存优先，
        // message.docData 只作 lightweight fallback（谁同步得更近谁赢）
        const docData = (window.resolveDocViewData && docId)
            ? window.resolveDocViewData(docId, msg.docData)
            : (msg.docData || (docId && window._docCache?.[docId]) || null);

        const docTitle = docData?.title || 'Google Document';
        const comments = docData?.comments || [];
        const liveComments = UIComponents.docLiveComments(comments);
        const count = liveComments.length || docData?.commentsCount || 0;

        // Open vs Resolved count breakdown (deleted snapshot comments excluded)
        let openCount = 0;
        let resolvedCount = 0;
        liveComments.forEach(c => {
            if (c.resolved) resolvedCount++;
            else openCount++;
        });

        // Dynamic badge label highlighting open feedback + sync status
        const badgeLabel = UIComponents.docBadgeLabel(docData);
        const createdTime = docData?.createdTime;
        const createdDateStr = createdTime ? new Date(createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        const createdDateTag = createdDateStr ? `<span id="docDate-${key}" class="inline-flex items-center text-[10px] text-gray-400 dark:text-white font-medium leading-tight">Created ${createdDateStr}</span>` : `<span id="docDate-${key}" class="hidden inline-flex items-center text-[10px] text-gray-400 dark:text-white font-medium leading-tight"></span>`;

        // Two-level access/sync status notice (access lost / comment access lost / snapshot…)
        const statusNoticeHtml = UIComponents.renderDocStatusNoticeHtml(docData, key);

        // 构建评论列表 HTML (统一复用 UIComponents.renderDocCommentsHtml)
        const commentsListHtml = UIComponents.renderDocCommentsHtml(key, comments, count, openCount, resolvedCount, docId, docUrl, docData);

        // Whole-doc note composer (hidden until the header bubble button is tapped).
        // Per-comment replies live inline under their own comment rows instead.
        const composerHtml = docId ? `
            <div id="docComposer-${key}" class="hidden border-t border-gray-100 dark:border-white/5 bg-gradient-to-b from-white to-gray-50/50 dark:from-[#1C1C1E] dark:to-white/[0.02] px-3.5 py-3 text-left">
                <textarea id="docComposerText-${key}" rows="3" maxlength="3000" placeholder="Write a note on the whole doc…" class="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 text-[13px] text-black dark:text-white outline-none transition-colors resize-none leading-relaxed"></textarea>
                <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-[10px] text-black dark:text-white leading-tight">Delivered by the CHSchat bot, signed “Created by you”.</span>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        <button type="button" onclick="window.closeDocCommentComposer('${key}', event)" class="px-3 py-1.5 rounded-xl text-[12px] text-black dark:text-white hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 transition-colors">Cancel</button>
                        <button type="button" id="docComposerSend-${key}" onclick="window.sendDocCommentFromComposer('${key}', event)" class="px-3.5 py-1.5 rounded-xl text-[12px] bg-[#007AFF] text-white hover:bg-[#0062CC] active:scale-95 transition-all shadow-sm">Post</button>
                    </div>
                </div>
            </div>
        ` : '';



        return `
            <div data-doc-id="${docId}" data-doc-url="${UIUtils.escape(docUrl)}" data-open-count="${openCount}" data-total-comments="${count}" class="doc-card-container w-full bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden text-left my-1">
                <!-- Card Header -->
                <div class="p-3.5 flex items-center justify-between gap-3 bg-gradient-to-b from-white to-gray-50/50 dark:from-[#1C1C1E] dark:to-white/[0.02]">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <!-- Minimal Document SVG Icon with Soft Blue Circle -->
                        <div class="w-9 h-9 rounded-full bg-[#007AFF]/15 dark:bg-[#0A84FF]/25 text-gray-700 dark:text-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h4 id="docTitle-${key}" class="text-[15px] font-semibold text-black dark:text-white truncate leading-snug" title="${UIUtils.escape(docTitle)}">${UIUtils.escape(docTitle)}</h4>
                            <div class="flex items-center gap-2 mt-0.5">
                                <!-- Light Blue Pill Badge -->
                                <span id="docBadge-${key}" class="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 text-black dark:text-white dark:bg-[#0A84FF]/20 leading-tight">
                                    ${badgeLabel}
                                </span>
                                ${createdDateTag}
                            </div>
                        </div>
                    </div>

                    <!-- Action Icons -->
                    <div class="flex items-center gap-1">
                        <!-- Sync Comments Action Button -->
                        <button onclick="window.syncDocCardComments('${key}', '${docUrl}', event, '${msg.chatId || ''}')" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Sync comments">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>

                        <!-- Post Comment Composer Toggle (right of Sync) -->
                        <button onclick="window.openDocCommentComposer('${key}', event)" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Post a comment to this doc">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                <line x1="12" y1="8" x2="12" y2="14"></line>
                                <line x1="9" y1="11" x2="15" y2="11"></line>
                            </svg>
                        </button>

                        <!-- Open Google Doc External Link -->
                        <a href="${UIUtils.escape(docUrl)}" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Open Google Doc">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>

                        <!-- Toggle Comments Collapse -->
                        <button onclick="window.toggleDocCommentsExpand('${key}', event)" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Toggle comments list">
                            <svg id="docArrow-${key}" class="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                ${statusNoticeHtml}
                ${composerHtml}

                <!-- Expandable Comments Drawer Area with Smooth Accordion -->
                <div id="docDrawer-${key}" class="doc-drawer-accordion hidden bg-gray-50/50 dark:bg-black/20">
                    <div class="min-h-0 overflow-hidden border-t border-gray-100 dark:border-white/5">
                        <div class="px-3.5 pt-3.5 pb-1.5">
                            <div id="docList-${key}">
                                ${commentsListHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * [Comment Card Message] 单条 Google Doc 评论被转发后在聊天中生成的评论卡片
     */
    renderCommentCardMsg: function (msg, key, isMe) {
        const card = msg.commentCard || {};
        // Registry so this card can be forwarded on to another person
        window._commentCardMsgPayloads = window._commentCardMsgPayloads || {};
        window._commentCardMsgPayloads[key] = card;
        const c = card.comment || {};
        const docTitle = card.docTitle || 'Google Document';
        const quoteVal = c.quotedFileContent?.value || '';
        const cDisp = UIComponents.docCommentDisplay(c);
        const author = cDisp.author || 'Reviewer';
        const isDeleted = !!(c.deleted || c.status === 'deleted_on_google');
        const createdTime = c.createdTime;
        const createdDateStr = createdTime ? new Date(createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        const commentDirectUrl = (card.docId && c.id)
            ? `https://docs.google.com/document/d/${card.docId}/edit?disco=${encodeURIComponent(c.id)}`
            : (card.docUrl || '#');

        let quoteHtml = '';
        if (quoteVal) {
            quoteHtml = `
                <div class="mb-2 pl-3 border-l-2 border-[#007AFF]/40 dark:border-[#0A84FF]/50 text-left py-0.5">
                    <div class="text-[13px] text-black dark:text-white leading-relaxed italic">“${UIUtils.escape(quoteVal)}”</div>
                </div>
            `;
        }

        let statusTag = '';
        if (isDeleted) {
            statusTag = '<span class="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Deleted in Google Docs</span>';
        } else if (c.resolved) {
            statusTag = '<span class="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded font-medium">Resolved</span>';
        }

        let repliesHtml = '';
        // Skip Google's empty resolve/reopen event replies (see renderDocCommentsHtml).
        const visibleReplies = (c.replies || []).filter(r => r && String((UIComponents.docCommentDisplay(r).content) || '').trim());
        if (visibleReplies.length > 0) {
            repliesHtml = visibleReplies.map(r => {
                const rDisp = UIComponents.docCommentDisplay(r);
                return `
                <div class="mt-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 text-[13px]">
                    <span class="font-semibold text-black dark:text-white">${UIUtils.escape(rDisp.author || 'User')}:</span>
                    <span class="text-black dark:text-white ml-1">${UIUtils.escape(rDisp.content || '')}</span>
                </div>
            `;
            }).join('');
        }

        const contentHtml = isDeleted
            ? (cDisp.content
                ? `<div class="text-[12px] text-gray-400 dark:text-gray-500 italic mb-0.5">Previously synced content:</div><div class="text-[14px] italic text-gray-500 dark:text-gray-400 leading-relaxed line-through decoration-gray-300 dark:decoration-white/20">${UIUtils.escape(cDisp.content)}</div>`
                : `<div class="text-[13px] italic text-gray-400 dark:text-gray-500">Comment deleted in Google Docs (no snapshot content was saved for it).</div>`)
            : `<div class="text-[14px] text-gray-800 dark:text-white leading-relaxed">${UIUtils.escape(cDisp.content || '')}</div>`;

        return `
            <div class="w-full max-w-[420px] bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden text-left my-1">
                <!-- Card Header: source doc reference -->
                <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-white to-gray-50/50 dark:from-[#1C1C1E] dark:to-white/[0.02]">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-[#007AFF]/15 dark:bg-[#0A84FF]/25 text-gray-700 dark:text-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[10px] font-bold uppercase tracking-wide text-[#007AFF] dark:text-[#0A84FF] leading-tight">Google Doc Comment</div>
                            <div class="text-[13px] font-semibold text-black dark:text-white truncate leading-snug" title="${UIUtils.escape(docTitle)}">${UIUtils.escape(docTitle)}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onclick="window.forwardCommentCardMsg('${key}', event)" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Send this comment">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                        <a href="${UIUtils.escape(commentDirectUrl)}" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/25 flex items-center justify-center text-black dark:text-white transition-colors" title="Jump to this comment in Google Doc">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </div>
                </div>
                <div class="px-3.5 py-3">
                    ${quoteHtml}
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[14px] font-semibold text-black dark:text-white">${UIUtils.escape(author)}</span>
                        <div class="flex items-center gap-2">
                            ${statusTag}
                            ${createdDateStr ? `<span class="text-[11px] text-gray-400 whitespace-nowrap">${createdDateStr}</span>` : ''}
                        </div>
                    </div>
                    ${contentHtml}
                    ${repliesHtml}
                </div>
            </div>
        `;
    }
};

