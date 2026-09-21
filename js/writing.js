/**
 * ==================================================================================
 * WritingDocCard — Google Doc 卡片独立模块（从 ui-components.js 抽出）
 * 只包含 doc card 本身及其内部内容的渲染/数据函数；
 * Writing Portfolio 面板排版、聊天消息分发等仍留在 chat.js / ui-components.js。
 *
 * 包含: docLiveComments / BOT_DOCS_EMAIL / docCommentDisplay / docBadgeLabel /
 *       renderDocStatusNoticeHtml / renderDocCommentsHtml / renderDocCard
 *
 * 注意: ui-components.js 会把本模块 Object.assign 回 UIComponents，
 *       所以 chat.js / search.js 里的 UIComponents.renderDocCard(...) 等旧调用不受影响。
 * ==================================================================================
 */

import { UIUtils } from './utils.js';

export const WritingDocCard = {

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
        const isBot = email === WritingDocCard.BOT_DOCS_EMAIL
            || email.endsWith('.gserviceaccount.com')
            || name.toLowerCase().endsWith('.gserviceaccount.com');
        if (isBot) {
            const m = content.match(/^Created by ([^:\n]{1,80}):\s?([\s\S]*)$/);
            if (m) return { author: m[1].trim() || name, content: m[2], viaBot: true };
            return { author: 'Bot', content, viaBot: true };
        }
        return { author: name, content, viaBot: false };
    },

    // Replies sent from the chat input can carry up to three photos; on
    // Google they are plain text "With a photo: <url>" / "With photos:
    // <url> <url>", here we render them as images.
    splitPhoto: function (content) {
        const raw = String(content || '');
        const m = raw.match(/\s*With (?:a photo|photos):\s*((?:https?:\/\/\S+)(?:\s+https?:\/\/\S+)*)/);
        if (!m) return { text: raw, photoUrls: [] };
        return { text: raw.replace(m[0], '').trim(), photoUrls: m[1].trim().split(/\s+/).filter(Boolean) };
    },

    docBadgeLabel: function (docData) {
        const live = WritingDocCard.docLiveComments(docData?.comments);
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
            : WritingDocCard.docLiveComments(docData.comments).length;
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
            ? 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300'
            : 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-black dark:text-white';
        const subTone = isSoft
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-black dark:text-white';
        return `<div id="docStatusNotice-${key}" class="mx-3.5 mb-3 px-3 py-2 rounded-xl ${tone} text-[11px] leading-relaxed"><span class="font-bold">${cfg.t}</span><span class="${subTone}"> · ${UIUtils.escape(cfg.b)}</span></div>`;
    },

    /**
     * [Google Doc Comments HTML Builder] 统一的评论列表渲染引擎（保证首次渲染和点击 Sync 后的 UI 100% 绝对一致）
     */
    renderDocCommentsHtml: function (key, comments, count, openCount, resolvedCount, docId, docUrl, docData, opts) {
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

        const liveList = WritingDocCard.docLiveComments(list);
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

        const filterBarHtml = (opts && opts.hideFilter) ? '' : `
            <div class="doc-filter-bar flex items-center gap-2 mb-3">
                <button type="button" onclick="window.filterDocComments('${key}', 'all', event)" id="filterBtn-${key}-all" class="px-3 py-1 rounded-lg text-[12px] font-semibold bg-[#007AFF] text-white shadow-sm transition-all">All (${list.length})</button>
                <button type="button" onclick="window.filterDocComments('${key}', 'open', event)" id="filterBtn-${key}-open" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white accent-hover-soft transition-all">Open (${liveOpen})</button>
                <button type="button" onclick="window.filterDocComments('${key}', 'resolved', event)" id="filterBtn-${key}-resolved" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white accent-hover-soft transition-all">Resolved (${liveResolved})</button>
                ${liveDeleted > 0 ? `<button type="button" onclick="window.filterDocComments('${key}', 'deleted', event)" id="filterBtn-${key}-deleted" class="px-3 py-1 rounded-lg text-[12px] font-semibold text-black dark:text-white accent-hover-soft transition-all">Deleted (${liveDeleted})</button>` : ''}
            </div>
        `;

        const itemsHtml = list.map((c, i) => {
            const quoteVal = c.quotedFileContent?.value || '';
            let quoteHtml = '';
            if (quoteVal) {
                const quoteId = `quoteBox-${key}-${i}`;
                const isLong = quoteVal.length > 60;
                quoteHtml = `
                    <div id="${quoteId}" class="text-[13px] text-black dark:text-white leading-relaxed italic ${isLong ? 'line-clamp-2' : ''}">“${UIUtils.escape(quoteVal)}”</div>
                    ${isLong ? `<button type="button" onclick="window.toggleQuoteText('${quoteId}', this, event)" class="mt-0.5 text-[11px] text-[#007AFF] dark:text-[#0A84FF] hover:underline font-medium transition-colors">Expand</button>` : ''}
                `;
            }

            const isDeleted = !!(c.deleted || c.status === 'deleted_on_google');
            const isMissing = c.status === 'missing_from_latest_sync' && !isDeleted;
            const disp = WritingDocCard.docCommentDisplay(c);
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

            // Per-comment anchor that jumps to the chat message carrying this
            // comment (comment_card), expanding this card's drawer as fallback.
            // Portfolio cards (key = `portfolio-<msgKey>`) and chat cards share
            // the identical row UI, so Locate renders in both.
            const anchorMsgKey = typeof key === 'string' && key.startsWith('portfolio-')
                ? key.slice('portfolio-'.length)
                : key;

            let repliesHtml = '';
            // Google inserts empty-content replies when someone resolves or
            // reopens a comment; those are noise here (status is already tagged).
            const visibleReplies = (c.replies || []).filter(r => r && String((WritingDocCard.docCommentDisplay(r).content) || '').trim());
            if (visibleReplies.length > 0) {
                repliesHtml = visibleReplies.map(r => {
                    const rDisp = WritingDocCard.docCommentDisplay(r);
                    const rPhoto = WritingDocCard.splitPhoto(rDisp.content);
                    const rPhotoHtml = rPhoto.photoUrls.length ? `
                        <div class="flex flex-wrap gap-1.5 mt-1.5">${rPhoto.photoUrls.map((u, pi) => `
                            <img src="${UIUtils.escape(u)}" loading="lazy" alt="Attached photo" onclick="openGallery('${encodeURIComponent(JSON.stringify(rPhoto.photoUrls))}', ${pi})" class="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer">`).join('')}
                        </div>` : '';
                    // The old gray rail in front of each reply is now a Locate
                    // button. It matches the reply's own Google id (r.id): each
                    // reply's chat card carries that id in commentCard.anchorIds.
                    const rLocateHtml = r.id ? `
                        <button type="button" onclick="window.portfolioJumpToChat('${anchorMsgKey}', '${docId || ''}', '${UIUtils.escape(r.id)}', '${UIUtils.escape(docData?.title || '')}')" class="w-6 h-6 -ml-1 flex-shrink-0 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Locate this comment in chat">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="6"></circle>
                                <line x1="12" y1="2.5" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="21.5"></line><line x1="2.5" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="21.5" y2="12"></line>
                            </svg>
                        </button>` : '<span class="w-6 flex-shrink-0"></span>';
                    return `
                    <div class="mt-2 flex items-start gap-1.5 text-[13px]">
                        ${rLocateHtml}
                        <div class="min-w-0">
                            <span class="font-semibold text-black dark:text-white">${UIUtils.escape(rDisp.author || 'User')}:</span>
                            <span class="text-black dark:text-white ml-1">${UIUtils.escape(rPhoto.text || '')}</span>
                            ${rPhotoHtml}
                        </div>
                    </div>
                `;
                }).join('');
            }

            const rowOpacity = (isDeleted || isMissing) ? ' opacity-60' : '';
            const actionIconClass = isDeleted
                ? 'w-7 h-7 rounded-full flex items-center justify-center text-gray-400 dark:text-white/25 pointer-events-none'
                : 'w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors';
            const replyBtnHtml = (commentId && !isDeleted) ? `
                            <button type="button" onclick="window.replyToDocComment('${key}', ${i}, event)" class="${actionIconClass}" title="Reply to this comment in Google Doc">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </button>` : '';
            // Only the bot's own top-level comments get a delete icon; human
            // comments and bot replies have no API delete path. Comment-card
            // threads hide it too — the doc card row is the single delete entry.
            const deleteBtnHtml = (disp.viaBot && commentId && !isDeleted && !(opts && opts.hideDelete)) ? `
                            <button type="button" onclick="window.deleteBotDocComment('${key}', ${i}, event)" class="${actionIconClass}" title="Delete this bot-posted comment from Google Doc">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>` : '';
            const locateBtnHtml = commentId ? `
                            <button type="button" onclick="window.portfolioJumpToChat('${anchorMsgKey}', '${docId || ''}', '${UIUtils.escape(c.id || '')}', '${UIUtils.escape(docData?.title || '')}')" class="${actionIconClass}" title="Locate this comment in chat">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <line x1="12" y1="2.5" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="21.5"></line><line x1="2.5" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="21.5" y2="12"></line>
                                </svg>
                            </button>` : '';
            // Inline reply box rendered directly under this comment row.
            const replyBoxHtml = (commentId && !isDeleted) ? `
                    <div id="docReplyBox-${key}-${i}" class="hidden mt-2.5 text-left">
                        <textarea id="docReplyText-${key}-${i}" rows="3" maxlength="3000" placeholder="Write your reply…" class="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 text-[13px] text-black dark:text-white outline-none transition-colors resize-none leading-relaxed"></textarea>
                        <div class="flex items-center justify-between gap-2 mt-1.5">
                            <span class="text-[10px] text-black dark:text-white leading-tight">Delivered by the CHSchat bot, signed “Created by you”.</span>
                            <div class="flex items-center gap-1.5 flex-shrink-0">
                                <button type="button" onclick="window.closeDocCommentReply('${key}', ${i}, event)" class="px-3 py-1.5 rounded-xl text-[12px] text-black dark:text-white accent-hover-soft transition-colors">Cancel</button>
                                <button type="button" id="docReplySend-${key}-${i}" onclick="window.sendDocCommentReply('${key}', ${i}, event)" class="px-3.5 py-1.5 rounded-xl text-[12px] bg-[#007AFF] text-white hover:bg-[#0062CC] active:scale-95 transition-all shadow-sm">Post</button>
                            </div>
                        </div>
                    </div>
            ` : '';
            const photoSplit = WritingDocCard.splitPhoto(WritingDocCard.docCommentDisplay(c).content);
            const contentHtml = isDeleted
                ? (photoSplit.text
                    ? `<div class="text-[12px] text-gray-400 dark:text-gray-500 italic mb-0.5">Previously synced content:</div><div class="text-[14px] italic text-gray-500 dark:text-gray-400 leading-relaxed line-through decoration-gray-300 dark:decoration-white/20">${UIUtils.escape(photoSplit.text)}</div>`
                    : `<div class="text-[13px] italic text-gray-400 dark:text-gray-500">Comment deleted in Google Docs (no snapshot content was saved for it).</div>`)
                : `<div class="text-[14px] font-semibold text-gray-800 dark:text-white leading-relaxed"><span>Main Comment: </span>${UIUtils.escape(photoSplit.text || '')}</div>`;
            const photoHtml = photoSplit.photoUrls.length ? `
                    <div class="flex flex-wrap gap-1.5 mt-2">${photoSplit.photoUrls.map((u, pi) => `
                        <img src="${UIUtils.escape(u)}" loading="lazy" alt="Attached photo" onclick="openGallery('${encodeURIComponent(JSON.stringify(photoSplit.photoUrls))}', ${pi})" class="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer">`).join('')}
                    </div>` : '';

            return `
                <div class="comment-item-row py-3 border-b border-gray-200 dark:border-white/10 last:border-b-0 text-left transition-opacity duration-150${rowOpacity}" data-card-key="${key}" data-comment-id="${UIUtils.escape(c.id || '')}" data-resolved="${(c.resolved && !isDeleted && !isMissing) ? 'true' : 'false'}" data-comment-deleted="${isDeleted ? 'true' : 'false'}">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[14px] font-semibold text-black dark:text-white">${UIUtils.escape(author)} created a comment</span>
                        <div class="flex items-center gap-2">
                            ${statusTag}
                            ${replyBtnHtml}
                            <button type="button" onclick="window.openCommentSendPicker('${key}', ${i}, event)" class="${actionIconClass}" title="Send this comment">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            ${deleteBtnHtml}
                            ${locateBtnHtml}
                            <a href="${UIUtils.escape(commentDirectUrl)}" target="_blank" rel="noopener noreferrer" class="${actionIconClass}" title="Jump to this comment in Google Doc">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <!-- One continuous blue rail: quote text flows into the main comment body -->
                    <div class="mb-2 pl-3 border-l-2 accent-quote-rail text-left py-0.5">
                        ${quoteHtml}
                        ${contentHtml}
                    </div>
                    ${photoHtml}
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
        const liveComments = WritingDocCard.docLiveComments(comments);
        const count = liveComments.length || docData?.commentsCount || 0;

        // Open vs Resolved count breakdown (deleted snapshot comments excluded)
        let openCount = 0;
        let resolvedCount = 0;
        liveComments.forEach(c => {
            if (c.resolved) resolvedCount++;
            else openCount++;
        });

        // Dynamic badge label highlighting open feedback + sync status
        const badgeLabel = WritingDocCard.docBadgeLabel(docData);
        const createdTime = docData?.createdTime;
        const createdDateStr = createdTime ? new Date(createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        const createdDateTag = createdDateStr ? `<span id="docDate-${key}" class="inline-flex items-center text-[10px] text-gray-400 dark:text-white font-medium leading-tight">Created ${createdDateStr}</span>` : `<span id="docDate-${key}" class="hidden inline-flex items-center text-[10px] text-gray-400 dark:text-white font-medium leading-tight"></span>`;

        // Two-level access/sync status notice (access lost / comment access lost / snapshot…)
        const statusNoticeHtml = WritingDocCard.renderDocStatusNoticeHtml(docData, key);

        // 构建评论列表 HTML (统一复用 WritingDocCard.renderDocCommentsHtml)
        const commentsListHtml = WritingDocCard.renderDocCommentsHtml(key, comments, count, openCount, resolvedCount, docId, docUrl, docData);

        // Whole-doc note composer (hidden until the header bubble button is tapped).
        // Per-comment replies live inline under their own comment rows instead.
        const composerHtml = docId ? `
            <div id="docComposer-${key}" class="hidden border-t border-gray-100 dark:border-white/5 bg-gradient-to-b from-white to-gray-50/50 dark:from-[#1C1C1E] dark:to-white/[0.02] px-3.5 py-3 text-left">
                <textarea id="docComposerText-${key}" rows="3" maxlength="3000" placeholder="Write a note on the whole doc…" class="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 text-[13px] text-black dark:text-white outline-none transition-colors resize-none leading-relaxed"></textarea>
                <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-[10px] text-black dark:text-white leading-tight">Delivered by the CHSchat bot, signed “Created by you”.</span>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        <button type="button" onclick="window.closeDocCommentComposer('${key}', event)" class="px-3 py-1.5 rounded-xl text-[12px] text-black dark:text-white accent-hover-soft transition-colors">Cancel</button>
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
                        <div class="w-9 h-9 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-black dark:text-white flex items-center justify-center flex-shrink-0">
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
                        <button onclick="window.syncDocCardComments('${key}', '${docUrl}', event, '${msg.chatId || ''}')" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Sync comments">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>

                        <!-- Post Comment Composer Toggle (right of Sync) -->
                        <button onclick="window.openDocCommentComposer('${key}', event)" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Post a comment to this doc">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                <line x1="12" y1="8" x2="12" y2="14"></line>
                                <line x1="9" y1="11" x2="15" y2="11"></line>
                            </svg>
                        </button>

                        <!-- Open Google Doc External Link -->
                        <a href="${UIUtils.escape(docUrl)}" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Open Google Doc">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>

                        <!-- Toggle Comments Collapse -->
                        <button onclick="window.toggleDocCommentsExpand('${key}', event)" class="w-7 h-7 rounded-full accent-hover-soft flex items-center justify-center text-black dark:text-white transition-colors" title="Toggle comments list">
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
    }
};

// ============================================================
// [Doc Card Behavior Layer] 从 chat.js 剥离的 doc card 行为代码
// （展开/筛选/同步/发评论/回复/评论卡跳转/文档状态缓存）。
// 由 initChatEngine 在启动时注入依赖调用一次。
// ============================================================
export function initWritingBehavior(deps) {
    const {
        db, ref, get, AppModules,
        getCurrentUser, getActiveTargetId, getChatId,
        getLocalMessages, saveMessageLocal,
        MessageEngine, getLastChatId,
        startDocCommentReply
    } = deps;

    function jumpCommentCard(el) {
        const originKey = el.getAttribute('data-origin-key') || '';
        const commentId = el.getAttribute('data-comment-id') || '';
        if (originKey) {
            window.openWritingPortfolio(originKey, commentId);
            return;
        }
        const docUrl = el.getAttribute('data-doc-url') || '';
        if (docUrl) window.open(docUrl, '_blank', 'noopener');
    }

    async function loadSavedDocs() {
        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        if (!currentUser || !activeTargetId) return { ok: false, docs: [] };
        const chatId = activeTargetId.startsWith('group_') ? activeTargetId : getChatId(currentUser.id, activeTargetId);
        try {
            const snap = await get(ref(db, `writing_doc_state/${chatId}`));
            if (!snap.exists()) return { ok: true, docs: [] };
            const docs = Object.entries(snap.val() || {}).map(([fid, st]) => {
                const view = normalizeDocSyncState(st) || {};
                const count = view.lastKnownCommentCount || 0;
                return {
                    docUrl: view.docUrl || `https://docs.google.com/document/d/${fid}/edit`,
                    title: view.title || 'Google Document',
                    sub: `${count} comment${count === 1 ? '' : 's'}`,
                    ts: docViewTimestamp(view)
                };
            }).sort((a, b) => b.ts - a.ts);
            return { ok: true, docs };
        } catch (e) {
            console.warn('[GoogleDoc] Failed to load saved doc states:', e);
            return { ok: false, docs: [] };
        }
    }

    function toggleDocCommentsExpand(key, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // First try finding within the clicked card container (to handle duplicate cards or modal drawer cleanly)
        const btn = e && e.currentTarget ? e.currentTarget : null;
        const container = btn ? btn.closest('.doc-card-container') : null;
        
        const drawer = (container ? container.querySelector('[id^="docDrawer-"]') : null) || document.getElementById(`docDrawer-${key}`);
        const arrow = (container ? container.querySelector('[id^="docArrow-"]') : null) || document.getElementById(`docArrow-${key}`);
        if (!drawer) return;

        const isExpanded = drawer.classList.contains('expanded');
        if (!isExpanded) {
            drawer.classList.remove('hidden');
            void drawer.offsetHeight; // Force reflow so grid-template-rows transition triggers from 0fr
            drawer.classList.add('expanded');
            if (arrow) arrow.style.transform = 'rotate(180deg)';

            // Auto-sync: Check if document has never been synced or last sync was > 3 minutes ago
            try {
                const docId = container ? container.getAttribute('data-doc-id') : null;
                const docUrl = container ? container.getAttribute('data-doc-url') : null;
                if (docId && docUrl) {
                    const cached = window._docCache?.[docId];
                    const lastSynced = cached?.lastSyncedAt || 0;
                    const now = Date.now();
                    const THREE_MINUTES = 3 * 60 * 1000;
                    // Backoff: transient Google failures (429/5xx) retry at most every 15 min
                    const RETRY_BACKOFF = 15 * 60 * 1000;
                    const inBackoff = cached?.syncStatus === 'sync_failed_retryable'
                        && (now - (cached.lastSyncAttemptAt || cached.lastSyncedAt || 0)) < RETRY_BACKOFF;
                    if (!inBackoff && now - lastSynced > THREE_MINUTES) {
                        // Trigger background silent sync
                        syncDocCardComments(key, docUrl, null, null, true);
                    }
                }
            } catch (syncErr) {
                console.warn('[DocAutoSync] Error checking auto-sync freshness:', syncErr);
            }
        } else {
            drawer.classList.remove('expanded');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                if (!drawer.classList.contains('expanded')) {
                    drawer.classList.add('hidden');
                }
            }, 350);
        }
    }

    function buildCommentCardThreadHtml(key) {
        const card = (window._commentCards || {})[key] || null;
        if (!card) return '';
        const c = card.comment || {};
        let thread = c;
        let docData = null;
        if (card.docId && window.resolveDocViewData) {
            docData = window.resolveDocViewData(card.docId, null);
            const live = docData && Array.isArray(docData.comments)
                ? docData.comments.find(x => x && x.id && c.id && x.id === c.id)
                : null;
            if (live) thread = live;
        }
        const ccKey = `cc-${key}`;
        const viewData = docData || { title: card.docTitle || 'Google Document', comments: [thread] };
        return WritingDocCard.renderDocCommentsHtml(ccKey, [thread], 1, thread.resolved ? 0 : 1, thread.resolved ? 1 : 0, card.docId || '', card.docUrl || '', viewData, { hideFilter: true, hideDelete: true });
    }

    function toggleCommentCardExpand(key, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const drawer = document.getElementById(`ccDrawer-${key}`);
        const arrow = document.getElementById(`ccArrow-${key}`);
        const list = document.getElementById(`ccList-${key}`);
        if (!drawer || !list) return;

        if (drawer.classList.contains('expanded')) {
            drawer.classList.remove('expanded');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                if (!drawer.classList.contains('expanded')) {
                    drawer.classList.add('hidden');
                }
            }, 350);
            return;
        }
        if (!list.children.length) {
            list.innerHTML = buildCommentCardThreadHtml(key);
        }
        drawer.classList.remove('hidden');
        void drawer.offsetHeight; // Force reflow so grid-template-rows transition triggers from 0fr
        drawer.classList.add('expanded');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }

    function filterDocComments(key, filterType, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const btn = e && e.currentTarget ? e.currentTarget : null;
        const container = btn ? btn.closest('.doc-card-container') : (document.getElementById(`docDrawer-${key}`)?.closest('.doc-card-container') || document);

        const btnAll = container.querySelector(`#filterBtn-${key}-all`);
        const btnOpen = container.querySelector(`#filterBtn-${key}-open`);
        const btnResolved = container.querySelector(`#filterBtn-${key}-resolved`);
        const btnDeleted = container.querySelector(`#filterBtn-${key}-deleted`);

        const activeClasses = ['bg-[#007AFF]', 'text-white', 'shadow-sm'];
        const inactiveClasses = ['text-black', 'dark:text-white', 'accent-hover-soft'];

        [btnAll, btnOpen, btnResolved, btnDeleted].forEach(b => {
            if (b) {
                b.classList.remove(...activeClasses);
                b.classList.add(...inactiveClasses);
            }
        });

        const targetBtn = filterType === 'open' ? btnOpen : (filterType === 'resolved' ? btnResolved : (filterType === 'deleted' ? btnDeleted : btnAll));
        if (targetBtn) {
            targetBtn.classList.remove(...inactiveClasses);
            targetBtn.classList.add(...activeClasses);
        }

        const rows = container.querySelectorAll(`.comment-item-row[data-card-key="${key}"]`);
        let visibleCount = 0;
        rows.forEach(row => {
            const isResolved = row.getAttribute('data-resolved') === 'true';
            const isDeleted = row.getAttribute('data-comment-deleted') === 'true';
            let show = true;
            if (filterType === 'open' && (isResolved || isDeleted)) show = false;
            if (filterType === 'resolved' && (!isResolved || isDeleted)) show = false;
            if (filterType === 'deleted' && !isDeleted) show = false;

            if (show) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });

        const emptyEl = container.querySelector(`#commentEmpty-${key}`);
        if (emptyEl) {
            if (visibleCount === 0) {
                emptyEl.classList.remove('hidden');
                emptyEl.innerText = filterType === 'open' ? '🎉 All comments have been resolved!' : (filterType === 'resolved' ? 'No resolved comments yet.' : (filterType === 'deleted' ? 'No deleted comments.' : 'No comments found.'));
            } else {
                emptyEl.classList.add('hidden');
            }
        }
    }

    async function syncDocCardComments(key, docUrl, e, explicitChatId = null, isSilent = false, autoExpandDrawer = true) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const badge = document.getElementById(`docBadge-${key}`);

        const prevBadgeText = badge ? badge.innerText : '';
        if (!isSilent && badge) badge.innerText = "Syncing...";

        const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const docId = match ? match[1] : null;

        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        const computedChatId = explicitChatId || getLastChatId() || (activeTargetId ? (activeTargetId.startsWith('group_') ? activeTargetId : getChatId(currentUser.id, activeTargetId)) : null);

        try {
            if (!docId) throw new Error("Invalid document ID");

            let resData = null;
            const knownTitle = (window._docCache?.[docId]?.title && window._docCache[docId].title !== 'Google Document')
                ? window._docCache[docId].title
                : (document.getElementById(`docTitle-${key}`)?.innerText || null);
            const payload = {
                url: docUrl,
                chatId: computedChatId,
                messageKey: key,
                knownTitle: (knownTitle && knownTitle !== 'Google Document') ? knownTitle : null
            };

            if (window.httpsCallable && window.firebaseFunctions) {
                const fetchFn = window.httpsCallable(window.firebaseFunctions, 'fetchGoogleDocComments');
                const res = await fetchFn(payload);
                resData = res.data;
            } else if (window.firebase && window.firebase.functions) {
                const fetchFn = window.firebase.functions().httpsCallable('fetchGoogleDocComments');
                const res = await fetchFn(payload);
                resData = res.data;
            }

            if (!resData || !resData.syncStatus) {
                // Transport-level failure: keep snapshot and previous badge untouched, record retryable failure.
                if (docId && window._docCache && window._docCache[docId]) {
                    window._docCache[docId] = { ...window._docCache[docId], syncStatus: 'sync_failed_retryable', lastSyncAttemptAt: Date.now() };
                }
                if (!isSilent) {
                    if (badge && prevBadgeText) badge.innerText = prevBadgeText;
                    AppModules.Modal.alert("Sync Notice", `We could not reach the comment sync service. Your last saved comments are still shown.`);
                }
                return;
            }

            const syncStatus = resData.syncStatus;

            // Merge into global memory cache (backend already merged the snapshot;
            // comments here can only grow or carry status flags, never silently shrink)
            window._docCache = window._docCache || {};
            window._docCache[docId] = { ...(window._docCache[docId] || {}), ...resData, lastSyncAttemptAt: Date.now() };

            const comments = resData.comments || [];
            const liveComments = WritingDocCard.docLiveComments(comments);
            let openCount = 0;
            liveComments.forEach(c => { if (!c.resolved) openCount++; });
            const resolvedCount = liveComments.length - openCount;
            const badgeText = WritingDocCard.docBadgeLabel(resData);

            // Update every doc card on screen sharing this docId
            const docCards = document.querySelectorAll(`[data-doc-id="${docId}"]`);
            docCards.forEach(cardEl => {
                cardEl.setAttribute('data-open-count', openCount);
                cardEl.setAttribute('data-total-comments', liveComments.length);

                const cardBadge = cardEl.querySelector('[id^="docBadge-"]');
                const cardTitle = cardEl.querySelector('[id^="docTitle-"]');
                const cardList = cardEl.querySelector('[id^="docList-"]');
                const cardDrawer = cardEl.querySelector('[id^="docDrawer-"]');
                const cardArrow = cardEl.querySelector('[id^="docArrow-"]');

                const cardDate = cardEl.querySelector('[id^="docDate-"]');
                if (cardDate && resData.createdTime) {
                    const cStr = new Date(resData.createdTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    cardDate.innerText = `Created ${cStr}`;
                    cardDate.classList.remove('hidden');
                }

                if (cardBadge) cardBadge.innerText = badgeText;
                if (cardTitle && resData.title) {
                    const curTitle = cardTitle.innerText;
                    if (!(resData.title === 'Google Document' && curTitle && curTitle !== 'Google Document')) {
                        cardTitle.innerText = resData.title;
                        cardTitle.title = resData.title;
                    }
                }

                // Swap the two-level status notice bar for this card
                const cardKey = cardList ? cardList.id.replace('docList-', '') : key;
                const existingNotice = cardEl.querySelector('[id^="docStatusNotice-"]');
                const noticeHtml = WritingDocCard.renderDocStatusNoticeHtml(resData, cardKey);
                if (existingNotice) {
                    if (noticeHtml) existingNotice.outerHTML = noticeHtml;
                    else existingNotice.remove();
                } else if (noticeHtml && cardDrawer) {
                    cardDrawer.insertAdjacentHTML('beforebegin', noticeHtml);
                }

                if (cardList) {
                    cardList.innerHTML = WritingDocCard.renderDocCommentsHtml(cardKey, comments, liveComments.length, openCount, resolvedCount, docId, docUrl, resData);

                    // For the clicked card specifically, automatically open drawer to show results
                    if (autoExpandDrawer && cardDrawer && cardList.id === `docList-${key}` && (!cardDrawer.classList.contains('expanded') || cardDrawer.classList.contains('hidden'))) {
                        cardDrawer.classList.remove('hidden');
                        void cardDrawer.offsetHeight;
                        cardDrawer.classList.add('expanded');
                        if (cardArrow) cardArrow.style.transform = 'rotate(180deg)';
                    }
                }
            });

            // Update any portfolio date labels on screen matching this docId
            if (resData.createdTime) {
                const formattedDate = new Date(resData.createdTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const pfDateEls = document.querySelectorAll(`[id="portfolio-date-${docId}"]`);
                pfDateEls.forEach(el => {
                    el.innerText = `Created: ${formattedDate}`;
                });
            }

            // Persist merged state to local IndexedDB copies (client-side guard:
            // an empty response never replaces comments we already have locally)
            if (computedChatId) {
                try {
                    const persistData = { ...resData, lastSyncAttemptAt: Date.now() };
                    delete persistData.success;
                    delete persistData.error;
                    const localMessages = await getLocalMessages(computedChatId);
                    for (const targetMsg of localMessages) {
                        if (targetMsg && targetMsg.text && targetMsg.text.includes(docId)) {
                            const prevLocal = targetMsg.docData || {};
                            const nextDocData = mergeDocViews(prevLocal, persistData);
                            if (comments.length === 0 && (prevLocal.comments || []).length > 0) {
                                nextDocData.comments = prevLocal.comments;
                            }
                            targetMsg.docData = nextDocData;
                            await saveMessageLocal(computedChatId, targetMsg.key, targetMsg);
                        }
                    }
                } catch (dbSaveErr) {
                    console.warn('[DocSync] Failed to save updated docData to local DB:', dbSaveErr);
                }
            }

            // Friendly, human status line for manual syncs on non-ok outcomes
            if (!isSilent) {
                const actionStatuses = ['access_lost', 'access_lost_or_file_unavailable', 'file_unavailable', 'comments_access_lost', 'comments_unavailable', 'comments_unavailable_or_empty', 'auth_required', 'sync_failed_retryable'];
                if (actionStatuses.includes(syncStatus)) {
                    const plainNotice = WritingDocCard.renderDocStatusNoticeHtml(resData, 'modal')
                        .replace(/<div[^>]*>/, '<div>').replace(/<\/div>/, '</div>');
                    let extra = '';
                    if (syncStatus === 'file_unavailable' || syncStatus === 'comments_access_lost' || syncStatus === 'access_lost_or_file_unavailable') {
                        const botEmail = "chscommunication@appspot.gserviceaccount.com";
                        extra = `
                            <div class="mt-3 text-left text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed space-y-2.5">
                                <div>To restore live sync, set doc sharing to <b>"Anyone with the link can comment"</b>, or add the bot as a <b>Commenter</b>:</div>
                                <div class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                    <span class="text-[11px] font-mono select-all break-all text-black dark:text-white flex-1">${botEmail}</span>
                                    <button type="button" onclick="navigator.clipboard.writeText('${botEmail}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500);" class="px-2.5 py-1 text-xs font-semibold bg-[#007AFF] text-white rounded-lg active:scale-95 transition-all flex-shrink-0">Copy</button>
                                </div>
                            </div>
                        `;
                    }
                    if (resData.lastSyncErrorMessage) {
                        extra += `<div class="mt-3 text-left text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all leading-relaxed">Technical detail: ${UIUtils.escape(String(resData.lastSyncErrorMessage).slice(0, 300))}</div>`;
                    }
                    AppModules.Modal.alert("Sync status", `${plainNotice}${extra}`);
                }
            }
        } catch (err) {
            console.error("Sync comments error:", err);
            // Transport/callable failure is always retryable — never wipe data, never blame the doc.
            if (docId && window._docCache && window._docCache[docId]) {
                window._docCache[docId] = { ...window._docCache[docId], syncStatus: 'sync_failed_retryable', lastSyncAttemptAt: Date.now() };
            }
            if (!isSilent) {
                if (badge && prevBadgeText) badge.innerText = prevBadgeText;
                AppModules.Modal.alert("Sync Notice", `We couldn't reach Google Docs right now. This is a temporary sync issue — your last saved comments are untouched.`);
            } else if (badge && prevBadgeText) {
                badge.innerText = prevBadgeText;
            }
        }
    }

    async function submitDocCommentPost(key, docUrl, commentId, content, sendBtn) {
        const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            AppModules.Modal.alert("Comment not posted", "This card is not linked to a valid Google Doc URL.");
            return false;
        }

        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        const chatId = getLastChatId() || (activeTargetId
            ? (activeTargetId.startsWith('group_') ? activeTargetId : getChatId(currentUser.id, activeTargetId))
            : null);

        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerText = 'Posting...';
            sendBtn.classList.add('opacity-60', 'pointer-events-none');
        }
        const restoreBtn = () => {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerText = 'Post';
                sendBtn.classList.remove('opacity-60', 'pointer-events-none');
            }
        };

        try {
            const payload = {
                url: docUrl,
                chatId: chatId,
                messageKey: key,
                commentId: commentId,
                content: content,
                userName: (currentUser && (currentUser.name || currentUser.id)) || 'Anonymous'
            };
            let resData = null;
            if (window.httpsCallable && window.firebaseFunctions) {
                const postFn = window.httpsCallable(window.firebaseFunctions, 'postGoogleDocComment');
                resData = (await postFn(payload)).data;
            } else if (window.firebase && window.firebase.functions) {
                const postFn = window.firebase.functions().httpsCallable('postGoogleDocComment');
                resData = (await postFn(payload)).data;
            }

            if (!resData || !resData.success) {
                restoreBtn();
                const failKind = (resData && resData.failKind) || 'unknown';
                const detail = (resData && resData.error)
                    ? `<div class="mt-3 text-left text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all leading-relaxed">Technical detail: ${UIUtils.escape(String(resData.error).slice(0, 300))}</div>`
                    : '';
                if (failKind === 'permission' || failKind === 'not_found') {
                    const bodyHtml = `
                        <div class="text-left leading-relaxed space-y-2.5">
                            <div>${failKind === 'permission'
                                ? 'The bot is not allowed to comment on this document. Open the doc and share it with the bot as <b>Commenter</b> (or set link sharing to <b>"Anyone with the link can comment"</b>), then post again.'
                                : 'Google cannot find this document for the bot. It may have been deleted, moved, or not shared with the bot yet. Open the doc to check its sharing settings, then post again.'}</div>
                            <div class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                <span class="text-[11px] font-mono select-all break-all text-black dark:text-white flex-1">${WritingDocCard.BOT_DOCS_EMAIL}</span>
                                <button type="button" onclick="navigator.clipboard.writeText('${WritingDocCard.BOT_DOCS_EMAIL}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500);" class="px-2.5 py-1 text-xs font-semibold bg-[#007AFF] text-white rounded-lg active:scale-95 transition-all flex-shrink-0">Copy</button>
                            </div>
                            ${detail}
                        </div>
                    `;
                    const goDoc = await AppModules.Modal.confirm("Comment not posted", bodyHtml, "Open Doc", "OK");
                    if (goDoc) window.open(docUrl, '_blank', 'noopener');
                } else if (failKind === 'bad_request') {
                    await AppModules.Modal.alert("Comment not posted", `Google rejected this comment — the target comment may have been deleted on Google Docs. Sync the card first, then post again.${detail}`);
                } else if (failKind === 'auth') {
                    await AppModules.Modal.alert("Comment not posted", "The bot's Google credentials are not configured on the server yet. Please contact the administrator.");
                } else {
                    const statusTag = (resData && resData.httpStatus) ? ` (HTTP ${resData.httpStatus}, kind: ${failKind})` : ` (kind: ${failKind || 'unknown'})`;
                    await AppModules.Modal.alert("Comment not posted", `We couldn't reach Google Docs right now. Your text is still in the box — please try again in a moment.${statusTag}${detail}`);
                }
                return false;
            }

            // Posted: pull the bot's comment back through the normal snapshot sync.
            restoreBtn();
            await syncDocCardComments(key, docUrl, null, chatId, true);
            return resData;
        } catch (err) {
            console.error('Post comment error:', err);
            restoreBtn();
            const fbErr = err && err.message ? String(err.message) : '';
            if (fbErr.includes('permission-denied') || fbErr.includes('Error 7')) {
                await AppModules.Modal.alert("Comment not posted", "Sign-in is required to post comments. Please sign in again and retry.");
            } else {
                const errDetail = fbErr ? `<div class="mt-3 text-left text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all leading-relaxed">Technical detail: ${UIUtils.escape(fbErr.slice(0, 300))}</div>` : '';
                await AppModules.Modal.alert("Comment not posted", `We couldn't reach the comment posting service right now. Your text is still in the box — please try again shortly.${errDetail}`);
            }
            return false;
        }
    }

    async function autoForwardCommentCardToChat(key, docUrl, parentComment, content, postedCommentId = null) {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser || !content) return;
            const pdata = (window._docCommentPayloads || {})[key] || {};
            const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            const docId = pdata.docId || (match ? match[1] : null);
            const docTitle = pdata.docTitle
                || document.getElementById(`docTitle-${key}`)?.innerText
                || 'Google Document';
            const comment = {
                id: parentComment ? (parentComment.id || null) : (postedCommentId || null),
                author: { displayName: currentUser.name || currentUser.id },
                content: content,
                quotedFileContent: parentComment ? parentComment.quotedFileContent : null,
                createdTime: new Date().toISOString()
            };
            // comment.id must stay the top-level id (replies post against the
            // thread), so the reply's own Google id rides in anchorIds — the
            // per-reply Locate matches on it.
            const anchorIds = (parentComment && postedCommentId) ? [postedCommentId] : [];
            await MessageEngine.commit({
                text: `Comment on "${docTitle}"`,
                type: 'comment_card',
                commentCard: { docId, docUrl, docTitle, originMsgKey: key, anchorIds, comment }
            });
        } catch (e) {
            console.warn('[CommentCard] Could not auto-forward the posted comment:', e);
        }
    }

    function openDocCommentComposer(key, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const composer = document.getElementById(`docComposer-${key}`);
        if (!composer) return;
        const wasHidden = composer.classList.contains('hidden');
        composer.classList.toggle('hidden');
        if (wasHidden) {
            const ta = document.getElementById(`docComposerText-${key}`);
            if (ta) setTimeout(() => ta.focus(), 60);
        }
    }

    function closeDocCommentComposer(key, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const composer = document.getElementById(`docComposer-${key}`);
        if (composer) composer.classList.add('hidden');
    }

    async function sendDocCommentFromComposer(key, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const composer = document.getElementById(`docComposer-${key}`);
        const container = composer ? composer.closest('.doc-card-container') : null;
        const docUrl = container ? (container.getAttribute('data-doc-url') || '') : '';
        const textEl = document.getElementById(`docComposerText-${key}`);
        const sendBtn = document.getElementById(`docComposerSend-${key}`);
        const content = (textEl ? textEl.value : '').trim();

        if (!content) {
            return AppModules.Modal.alert("Empty comment", "Type your comment before posting.");
        }

        const posted = await submitDocCommentPost(key, docUrl, null, content, sendBtn);
        if (posted) {
            if (textEl) textEl.value = '';
            composer.classList.add('hidden');
            await autoForwardCommentCardToChat(key, docUrl, null, content, posted.postedCommentId);
        }
    }

    function replyToDocComment(key, idx, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        // New path: hand the reply over to the chat input (quote strip).
        const payloadData = (window._docCommentPayloads || {})[key];
        const c = payloadData && payloadData.comments ? payloadData.comments[idx] : null;
        if (startDocCommentReply && c && c.id) {
            startDocCommentReply({
                docId: payloadData.docId,
                docUrl: payloadData.docUrl,
                docTitle: payloadData.docTitle,
                originMsgKey: key,
                comment: c
            });
            return;
        }
        if (!c) {
            console.warn('[DocComment] comment payload missing for', key, idx, '— stale card render, sync the card.');
            return;
        }
        // Old inline reply box (fallback until the chat-input flow is verified)
        const box = document.getElementById(`docReplyBox-${key}-${idx}`);
        if (!box) {
            console.warn('[DocComment] reply box missing for', key, idx, '— stale card render, sync the card.');
            return;
        }
        const wasHidden = box.classList.contains('hidden');
        box.classList.toggle('hidden');
        if (wasHidden) {
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const ta = document.getElementById(`docReplyText-${key}-${idx}`);
            if (ta) setTimeout(() => ta.focus(), 120);
        }
    }

    function closeDocCommentReply(key, idx, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const box = document.getElementById(`docReplyBox-${key}-${idx}`);
        if (box) box.classList.add('hidden');
    }

    async function sendDocCommentReply(key, idx, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const box = document.getElementById(`docReplyBox-${key}-${idx}`);
        if (!box) return;
        const container = box.closest('.doc-card-container');
        const docUrl = container ? (container.getAttribute('data-doc-url') || '') : '';
        const payloadData = (window._docCommentPayloads || {})[key];
        const c = payloadData && payloadData.comments ? payloadData.comments[idx] : null;
        const textEl = document.getElementById(`docReplyText-${key}-${idx}`);
        const sendBtn = document.getElementById(`docReplySend-${key}-${idx}`);
        const content = (textEl ? textEl.value : '').trim();

        if (!c || !c.id) {
            return AppModules.Modal.alert("Reply not posted", "This comment is no longer available. Sync the card and try again.");
        }
        if (!content) {
            return AppModules.Modal.alert("Empty reply", "Type your reply before posting.");
        }

        const posted = await submitDocCommentPost(key, docUrl, c.id, content, sendBtn);
        if (posted) {
            if (textEl) textEl.value = '';
            box.classList.add('hidden');
            await autoForwardCommentCardToChat(key, docUrl, c, content, (posted && posted.postedCommentId) || null);
        }
    }

    async function deleteBotDocComment(key, idx, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        // Capture the button synchronously — e.currentTarget is gone after await.
        const btn = (e && e.currentTarget) ? e.currentTarget : null;
        const payloadData = (window._docCommentPayloads || {})[key];
        const c = payloadData && payloadData.comments ? payloadData.comments[idx] : null;
        if (!c || !c.id) {
            return AppModules.Modal.alert("Comment not deleted", "This comment is no longer available. Sync the card and try again.");
        }
        if (!WritingDocCard.docCommentDisplay(c).viaBot) {
            return AppModules.Modal.alert("Comment not deleted", "Only comments posted by the CHSchat bot can be deleted here.");
        }
        const docUrl = payloadData.docUrl || '';
        if (!docUrl) {
            return AppModules.Modal.alert("Comment not deleted", "This card is not linked to a valid Google Doc URL.");
        }

        const go = await AppModules.Modal.confirm(
            "Delete bot comment",
            "This deletes the bot's comment from the Google Doc itself. It cannot be undone, and threads that already have replies cannot be deleted.",
            "Delete", "Cancel"
        );
        if (!go) return;

        // Trash icon becomes a spinner for the whole delete round trip.
        const restoreBtn = () => {
            if (!btn) return;
            btn.disabled = false;
            btn.classList.remove('pointer-events-none');
            const spin = btn.querySelector('.js-del-spin');
            if (spin) spin.remove();
            const icon = btn.querySelector('svg');
            if (icon) icon.classList.remove('hidden');
        };
        if (btn) {
            btn.disabled = true;
            btn.classList.add('pointer-events-none');
            const icon = btn.querySelector('svg');
            if (icon) icon.classList.add('hidden');
            const spin = document.createElement('div');
            spin.className = 'js-del-spin animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent';
            btn.appendChild(spin);
        }

        const currentUser = getCurrentUser();
        const activeTargetId = getActiveTargetId();
        const chatId = getLastChatId() || (activeTargetId
            ? (activeTargetId.startsWith('group_') ? activeTargetId : getChatId(currentUser.id, activeTargetId))
            : null);

        try {
            const payload = { url: docUrl, chatId: chatId, commentId: c.id };
            let resData = null;
            if (window.httpsCallable && window.firebaseFunctions) {
                const delFn = window.httpsCallable(window.firebaseFunctions, 'deleteGoogleDocComment');
                resData = (await delFn(payload)).data;
            } else if (window.firebase && window.firebase.functions) {
                const delFn = window.firebase.functions().httpsCallable('deleteGoogleDocComment');
                resData = (await delFn(payload)).data;
            }

            if (!resData || !resData.success) {
                const failKind = (resData && resData.failKind) || 'unknown';
                const detail = (resData && resData.error)
                    ? `<div class="mt-3 text-left text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all leading-relaxed">Technical detail: ${UIUtils.escape(String(resData.error).slice(0, 300))}</div>`
                    : '';
                if (failKind === 'has_replies') {
                    await AppModules.Modal.alert("Comment not deleted", `Someone has already replied to this comment in Google Docs, and Google does not allow deleting a thread with replies. You can resolve it in the doc instead.${detail}`);
                } else if (failKind === 'not_found') {
                    await AppModules.Modal.alert("Comment not deleted", `Google cannot find this comment — it may have been deleted already. Sync the card to refresh.${detail}`);
                } else if (failKind === 'permission') {
                    await AppModules.Modal.alert("Comment not deleted", `The bot could not remove this comment (it may not be the bot's own comment, or doc access changed). Sync the card and try again.${detail}`);
                } else if (failKind === 'auth') {
                    await AppModules.Modal.alert("Comment not deleted", "The bot's Google credentials are not configured on the server yet. Please contact the administrator.");
                } else {
                    const statusTag = (resData && resData.httpStatus) ? ` (HTTP ${resData.httpStatus}, kind: ${failKind})` : '';
                    await AppModules.Modal.alert("Comment not deleted", `We couldn't reach Google Docs right now. Please try again in a moment.${statusTag}${detail}`);
                }
                return;
            }

            // Deleted: pull the tombstone back through the normal snapshot sync.
            await syncDocCardComments(key, docUrl, null, chatId, true);
        } catch (err) {
            console.error('Delete comment error:', err);
            const fbErr = err && err.message ? String(err.message) : '';
            if (fbErr.includes('permission-denied') || fbErr.includes('Error 7')) {
                await AppModules.Modal.alert("Comment not deleted", "Sign-in is required to delete comments. Please sign in again and retry.");
            } else {
                const errDetail = fbErr ? `<div class="mt-3 text-left text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all leading-relaxed">Technical detail: ${UIUtils.escape(fbErr.slice(0, 300))}</div>` : '';
                await AppModules.Modal.alert("Comment not deleted", `We couldn't reach the comment service right now. Please try again shortly.${errDetail}`);
            }
        } finally {
            restoreBtn();
        }
    }

    function toggleQuoteText(quoteId, btn, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const box = document.getElementById(quoteId);
        if (!box) return;
        const isClamped = box.classList.contains('line-clamp-2');
        if (isClamped) {
            box.classList.remove('line-clamp-2');
            if (btn) btn.innerText = "Collapse";
        } else {
            box.classList.add('line-clamp-2');
            if (btn) btn.innerText = "Expand";
        }
    }

    function normalizeDocSyncState(state) {
        if (!state) return null;
        const comments = state.snapshotComments || [];
        const liveCount = typeof state.lastKnownCommentCount === 'number'
            ? state.lastKnownCommentCount : comments.length;
        return {
            fileId: state.fileId,
            docUrl: state.docUrl,
            title: state.title || 'Google Document',
            webViewLink: state.webViewLink || state.docUrl,
            createdTime: state.createdTime || null,
            modifiedTime: state.modifiedTime || null,
            comments: comments,
            commentsCount: liveCount,
            lastKnownCommentCount: liveCount,
            lastSyncedAt: state.lastSyncAttemptAt || null,
            lastSyncAttemptAt: state.lastSyncAttemptAt || null,
            lastSuccessfulSyncAt: state.lastSuccessfulSyncAt || null,
            syncStatus: state.lastSyncStatus || null,
            fileAccessStatus: state.fileAccessStatus || null,
            commentAccessStatus: state.commentAccessStatus || null,
            accessLostAt: state.accessLostAt || null,
            commentsAccessLostAt: state.commentsAccessLostAt || null,
            warnings: state.warnings || [],
            accessLost: ['access_lost', 'access_lost_or_file_unavailable'].includes(state.fileAccessStatus),
            _stateTs: Math.max(Number(state.lastSyncAttemptAt) || 0, Number(state.lastSuccessfulSyncAt) || 0)
        };
    }

    function docViewTimestamp(view) {
        return Number(view?.lastSyncAttemptAt || view?.lastSyncedAt || view?._stateTs) || 0;
    }

    function mergeDocViews(base, winner) {
        const out = { ...(base || {}), ...(winner || {}) };
        const isPlaceholder = t => !t || t === 'Google Document';
        if (isPlaceholder(out.title)) {
            out.title = (base && !isPlaceholder(base.title) && base.title)
                || (winner && !isPlaceholder(winner.title) && winner.title)
                || out.title;
        }
        return out;
    }

    function mergeDocViewIntoCache(docId, incoming) {
        if (!docId || !incoming) return incoming;
        window._docCache = window._docCache || {};
        const cur = window._docCache[docId];
        if (!cur || docViewTimestamp(incoming) >= docViewTimestamp(cur)) {
            window._docCache[docId] = mergeDocViews(cur, incoming);
        }
        return window._docCache[docId];
    }

    function resolveDocViewData(docId, msgDocData) {
        const cached = (docId && window._docCache?.[docId]) || null;
        if (!cached) return msgDocData || null;
        if (!msgDocData) return cached;
        if (docViewTimestamp(cached) >= docViewTimestamp(msgDocData)) {
            return mergeDocViews(msgDocData, cached);
        }
        return mergeDocViews(cached, msgDocData);
    }

    function classifyCommentAuthor(authorName, authorEmail, currentUserId, currentUser) {
        const normName = (authorName || '').trim().toLowerCase();
        const normEmail = (authorEmail || '').trim().toLowerCase();

        // A bot-delivered comment belongs to whoever the "Created by" line names
        // (docCommentDisplay has already unwrapped the prefix into authorName).
        if (normEmail.endsWith('.gserviceaccount.com')) {
            const meNames = [currentUserId, currentUser && currentUser.name].filter(Boolean)
                .map(s => String(s).toLowerCase());
            if (normName && meNames.some(n => normName === n || normName.includes(n) || n.includes(normName))) {
                return { role: 'student', label: 'Author' };
            }
            if (/^(mr|ms|mrs|dr)\.?\s/i.test(normName) || normName.includes('teacher') || normName.includes('instructor')) {
                return { role: 'teacher', label: 'Teacher' };
            }
            return { role: 'peer', label: 'Peer Reviewer' };
        }

        if (normEmail.endsWith('@hcpss.org') || /^(mr|ms|mrs|dr)\.?\s/i.test(normName) || normName.includes('teacher') || normName.includes('instructor')) {
            return { role: 'teacher', label: 'Teacher' };
        }
        if (currentUserId && (normEmail.includes(currentUserId.toLowerCase()) || normName.includes(currentUserId.toLowerCase()))) {
            return { role: 'student', label: 'Author' };
        }
        if (normEmail.endsWith('@inst.hcpss.org')) {
            return { role: 'peer', label: 'Peer Reviewer' };
        }
        return { role: 'teacher', label: 'Teacher' };
    }

    return {
        toggleDocCommentsExpand,
        buildCommentCardThreadHtml,
        toggleCommentCardExpand,
        filterDocComments,
        syncDocCardComments,
        submitDocCommentPost,
        autoForwardCommentCardToChat,
        openDocCommentComposer,
        closeDocCommentComposer,
        sendDocCommentFromComposer,
        replyToDocComment,
        closeDocCommentReply,
        sendDocCommentReply,
        deleteBotDocComment,
        toggleQuoteText,
        normalizeDocSyncState,
        docViewTimestamp,
        mergeDocViews,
        mergeDocViewIntoCache,
        resolveDocViewData,
        loadSavedDocs,
        classifyCommentAuthor,
        jumpCommentCard
    };
}
