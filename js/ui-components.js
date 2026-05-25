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

        // 螟�炊蠑慕畑豸域�


        let content = '';
        let images = [];
        // 隗｣譫仙崟迚�ｻ�ｻ霎
        if (msg.type === 'image_group' || (msg.text && msg.text.trim().startsWith('['))) {
            try { images = JSON.parse(msg.text); } catch (e) { }
        } else if (msg.type === 'image' || (msg.text && msg.text.includes('data:image'))) {
            images = [msg.text];
        }

        if (msg.isExpired || msg.text === 'Image Expired') {
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
     * [蜊｡迚�ｻ�ｻｶ] renderNewsCard
     */
    renderNewsCard: function (post, type, isStaff) {
        const isSchool = type === 'school';
        
        // For Club News, use club name if available, otherwise use generic label
        let badgeText, badgeColor;
        if (isSchool) {
            badgeText = 'Announcement';
            badgeColor = 'text-[#007AFF] bg-blue-100 dark:bg-blue-500/20';
        } else {
            // For club posts, show the specific club name
            if (post.clubName) {
                badgeText = post.clubName;
            } else {
                badgeText = 'Club Update';
            }
            badgeColor = 'text-orange-500 bg-orange-100 dark:bg-orange-500/20';
        }
        
        const dateStr = UIUtils.formatTime(post.timestamp);

        return `
            <div data-news-key="${post.key}" class="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="flex items-start gap-2 mb-1">
                    <span class="text-[11px] font-bold ${badgeColor} uppercase tracking-wider px-2 py-0.5 rounded-full inline-block flex-shrink-0 max-w-[60%] break-words leading-tight">${UIUtils.escape(badgeText)}</span>
                    <div class="flex items-center gap-2 ml-auto">
                        <span class="text-xs text-gray-400 font-medium whitespace-nowrap">${dateStr}</span>
                        ${isStaff ? `<button onclick="deleteNews('${post.key}', '${type}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : ''}
                    </div>
                </div>
                <h3 class="font-bold text-base mt-1.5 mb-1.5 text-black dark:text-white leading-snug">${UIUtils.escape(post.title)}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${UIUtils.linkify(UIUtils.escape(post.desc))}</p>
                ${this.renderMedia(post)}
            </div>`;
    },

    /**
     * [蟐剃ｽ鍋ｻ�ｻｶ] renderMedia
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
     * [謚慕･ｨ扈�ｻｶ] getSuggestionVotingHtml
     * 蟾ｲ騾る�莨蜈･ currentUser 騾ｻ霎
     */
    getSuggestionVotingHtml: function (post, currentUser) {
        if (!window.MODULE_CONFIG[window.currentModule]?.hasVoting) return '';
        const votes = post.votes || {};
        const upvotes = Object.values(votes).filter(v => v === 1).length;
        const downvotes = Object.values(votes).filter(v => v === -1).length;

        // 菴ｿ逕ｨ莨蜈･逧?currentUser 謌門�螻莉｣逅�執蜿門ｽ灘燕逕ｨ謌ｷ逧�兜逾ｨ迥ｶ諤?        const user = currentUser || UserModule.current;
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
     * [蜊墓擅隸�ｮｺ扈�ｻｶ] renderComment
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
