const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

const AUTO_JOIN_CLASS_ID = '-OrpDpIaMod9eL6Sk4xf';

exports.autoJoinGroupOnRegister = functions.database.ref('/users/{userId}')
    .onCreate(async (snapshot, context) => {
        const userId = context.params.userId;
        console.log(`[AutoJoin] New user created: ${userId}`);
        try {
            await admin.database().ref(`classes/${AUTO_JOIN_CLASS_ID}/students/${userId}`).set(true);
            console.log(`[AutoJoin] Added ${userId} to class ${AUTO_JOIN_CLASS_ID}`);
        } catch (e) {
            console.error('[AutoJoin] Failed:', e);
        }
        return null;
    });

exports.sendNotification = functions.database.ref('/messages/{chatId}/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.val();
        if (!message) {
            console.log('No message data found, skipping.');
            return null;
        }

        const chatId = context.params.chatId;
        const senderId = message.senderId;
        // notifyName lets bot-delivered notices (e.g. Google Doc activity)
        // push under the real author while the chat bubble shows CHSBot.
        const senderName = message.notifyName || message.senderName || 'New Message';
        const text = message.text || '';
        const msgType = message.type || 'text';

        console.log(`Triggered sendNotification. ChatId: ${chatId}, SenderId: ${senderId}, SenderName: ${senderName}`);

        // Format notification body based on type
        let notificationBody = text;
        if (msgType === 'image_group') {
            try {
                const urls = JSON.parse(text);
                notificationBody = `[Image] sent ${urls.length} images`;
            } catch (e) {
                notificationBody = '[Image]';
            }
        }

        // Determine recipient IDs
        let recipients = [];

        if (chatId.startsWith('group_')) {
            const classId = chatId.replace('group_', '');
            console.log(`Group chat detected. Class ID: ${classId}`);
            // Get class group members (students + teacher)
            const classSnap = await admin.database().ref(`classes/${classId}`).once('value');
            const classData = classSnap.val() || {};
            
            const students = classData.students || {};
            const teacherId = classData.teacherId;

            // Collect all student IDs
            Object.keys(students).forEach(sid => {
                if (sid !== senderId) {
                    recipients.push(sid);
                }
            });

            // Add teacher ID if not the sender
            if (teacherId && teacherId !== senderId) {
                recipients.push(teacherId);
            }
        } else {
            // IDs can contain underscores, so chatId cannot be safely split.
            // New client messages carry the exact recipient ID explicitly.
            const recipientId = String(message.recipientId || '').toLowerCase();
            if (recipientId && recipientId !== String(senderId || '').toLowerCase()) {
                recipients.push(recipientId);
            } else {
                // Compatibility for an already-open, older client that has
                // not yet started sending recipientId. Compare canonical IDs
                // against user records rather than splitting on underscores.
                const senderKey = String(senderId || '').toLowerCase();
                const usersSnap = await admin.database().ref('users').once('value');
                const users = usersSnap.val() || {};
                const fallbackRecipient = Object.keys(users).find(uid => {
                    const otherKey = String(uid).toLowerCase();
                    return otherKey !== senderKey && [senderKey, otherKey].sort().join('_') === chatId;
                });
                if (fallbackRecipient) recipients.push(fallbackRecipient);
            }
            console.log(`Direct chat detected. Recipient: ${recipients[0] || 'not found'}`);
        }

        console.log(`Resolved recipients: ${JSON.stringify(recipients)}`);

        if (recipients.length === 0) {
            console.log('No recipients found to send notifications to.');
            return null;
        }

        // Write to user_notifications so the client-side listener picks it up
        const notifUpdates = {};
        recipients.forEach(uid => {
            notifUpdates[`user_notifications/${uid}/${chatId}`] = true;
        });
        await admin.database().ref().update(notifUpdates);
        console.log(`Wrote user_notifications for ${recipients.length} recipients.`);

        // Send to each recipient's registered FCM tokens
        const sendPromises = recipients.map(async (uid) => {
            const tokensSnap = await admin.database().ref(`users/${uid}/fcm_tokens`).once('value');
            const tokensData = tokensSnap.val();
            if (!tokensData) {
                console.log(`No tokens registered for user: ${uid}`);
                return;
            }

            const tokens = Object.keys(tokensData);
            console.log(`Found ${tokens.length} tokens for user: ${uid}`);
            if (tokens.length === 0) return;

            const payload = {
                data: {
                    title: senderName,
                    body: notificationBody,
                    chatId: chatId,
                    senderId: senderId,
                    url: 'https://chschat.xyz/'
                }
            };

            try {
                // Send to tokens
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: tokens,
                    data: payload.data,
                    android: {
                        notification: {
                            sound: 'default'
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default'
                            }
                        }
                    }
                });

                console.log(`FCM Multicast complete for ${uid}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

                // Clean up invalid tokens
                const tokensToRemove = [];
                response.responses.forEach((res, idx) => {
                    if (!res.success) {
                        const error = res.error;
                        console.log(`FCM failure details for token index ${idx}:`, error.message);
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(
                                admin.database().ref(`users/${uid}/fcm_tokens/${tokens[idx]}`).remove()
                            );
                        }
                    }
                });

                if (tokensToRemove.length > 0) {
                    await Promise.all(tokensToRemove);
                    console.log(`Cleaned up ${tokensToRemove.length} invalid tokens for ${uid}`);
                }
            } catch (err) {
                console.error(`Error sending multicast to user ${uid}:`, err);
            }
        });

        await Promise.all(sendPromises);
        console.log('Finished processing all notifications.');
        return null;
    });

// ==========================================
// Google Doc Comments Extraction & Sync
// ==========================================
const { google } = require('googleapis');
const path = require('path');

function extractGoogleDocId(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

const FILE_GET_FIELDS = 'id,name,mimeType,webViewLink,createdTime,modifiedTime,trashed,shared,'
    + 'capabilities(canEdit,canComment,canReadRevisions,canDownload),'
    + 'owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress)';

const COMMENTS_LIST_FIELDS = 'nextPageToken,comments(id,createdTime,modifiedTime,resolved,deleted,content,htmlContent,'
    + 'quotedFileContent(value),author(displayName,photoLink,emailAddress),'
    + 'replies(id,createdTime,modifiedTime,deleted,content,author(displayName,photoLink,emailAddress)))';

function classifyGoogleError(err) {
    const status = Number((err && err.response && err.response.status) || (err && err.code) || 0) || 0;
    const gerr = err && err.response && err.response.data && err.response.data.error;
    const reason = (gerr && gerr.errors && gerr.errors[0] && gerr.errors[0].reason)
        || (gerr && gerr.code)
        || ((err && typeof err.code === 'string') ? err.code : '');
    const message = (gerr && gerr.message) || String((err && err.message) || 'Unable to access this document');
    return { status, reason, message };
}

function looksLikeCredentialFailure(info) {
    if (!info || info.status) return false;
    const m = String(info.message || '').toLowerCase();
    return m.includes('could not load') || m.includes('service-account') || m.includes('enoent')
        || m.includes('private_key') || m.includes('invalid_grant') || m.includes('unauthorized_client')
        || m.includes('api key not valid') || m.includes('unauthenticated');
}

function countLiveComments(list) {
    return (list || []).filter(c => c && c.status !== 'deleted_on_google' && !c.deleted).length;
}

// Merges a freshly fetched (complete, includeDeleted=true) comment list into the
// stored snapshot. A comment is only ever marked deleted/missing — its snapshot
// content is never destroyed by a sync result.
function mergeSnapshotComments(prevComments, fetched) {
    const prevById = new Map((prevComments || []).filter(c => c && c.id).map(c => [c.id, c]));
    const now = Date.now();
    const merged = [];
    const seenIds = new Set();

    (fetched || []).forEach(raw => {
        if (!raw || !raw.id) return;
        seenIds.add(raw.id);
        const prev = prevById.get(raw.id) || null;
        const isDeleted = !!raw.deleted;
        merged.push({
            id: raw.id,
            createdTime: raw.createdTime || (prev && prev.createdTime) || null,
            modifiedTime: raw.modifiedTime || null,
            resolved: !!raw.resolved,
            deleted: isDeleted,
            // Deleted comments come back without content; keep our snapshot copy.
            content: isDeleted ? ((prev && prev.content) || '') : (raw.content || ''),
            quotedFileContent: raw.quotedFileContent
                ? raw.quotedFileContent
                : ((prev && prev.quotedFileContent) || null),
            author: raw.author || (prev && prev.author) || null,
            replies: (raw.replies && raw.replies.length) ? raw.replies : ((prev && prev.replies) || []),
            status: isDeleted ? 'deleted_on_google' : (raw.resolved ? 'resolved' : 'active'),
            firstSeenAt: (prev && prev.firstSeenAt) || raw.createdTime || now,
            lastSeenAt: now,
            firstMissingAt: null,
            missingCount: 0
        });
    });

    (prevComments || []).forEach(prev => {
        if (!prev || !prev.id || seenIds.has(prev.id)) return;
        merged.push({
            ...prev,
            status: 'missing_from_latest_sync',
            missingCount: (prev.missingCount || 0) + 1,
            firstMissingAt: prev.firstMissingAt || now
        });
    });

    return merged;
}

const PLACEHOLDER_DOC_TITLE = 'Google Document';

// Identity used for chat notices about Google-side activity. senderName is
// always the real Google author display name; CHSBot is only the fallback.
const GDOC_BOT_SENDER_ID = 'gdoc_bot';
const GDOC_BOT_DISPLAY = 'CHSBot';

function isBotCommentAuthor(c) {
    const email = String(c && c.author && c.author.emailAddress || '').toLowerCase();
    const name = String(c && c.author && c.author.displayName || '').toLowerCase();
    return email.endsWith('.gserviceaccount.com')
        || name.endsWith('.gserviceaccount.com')
        || String(c && c.content || '').startsWith(BOT_DISPLAY_PREFIX);
}

// Flatten a snapshot into comment + reply items, skipping tombstones and
// rows that Google stopped returning.
function collectThreadItems(comments) {
    const items = [];
    (comments || []).forEach(c => {
        if (!c || !c.id) return;
        if (c.deleted || c.status === 'deleted_on_google' || c.status === 'missing_from_latest_sync') return;
        items.push({ id: c.id, parentId: null, author: c.author || {}, content: c.content || '' });
        (c.replies || []).forEach(r => {
            if (!r || !r.id || r.deleted) return;
            items.push({ id: r.id, parentId: c.id, author: r.author || {}, content: r.content || '' });
        });
    });
    return items;
}
function firstRealTitle() {
    for (const t of Array.prototype.slice.call(arguments)) {
        if (t && t !== PLACEHOLDER_DOC_TITLE) return t;
    }
    return null;
}

async function appendSyncLog(fileId, entry) {
    try {
        const logRef = admin.database().ref(`writing_sync_log/${fileId}`);
        await logRef.push(entry);
        const kids = await logRef.once('value');
        const val = kids.val();
        if (val) {
            const keys = Object.keys(val);
            if (keys.length > 25) {
                const removals = {};
                keys.slice(0, keys.length - 25).forEach(k => { removals[k] = null; });
                await logRef.update(removals);
            }
        }
    } catch (e) {
        console.warn('[GoogleDoc] sync log write failed:', e.message);
    }
}

// Preferred path: the whole service-account JSON injected via Secret Manager.
// firebase deploy strips files matched by .gitignore (incl. *service-account*.json)
// from the upload, so the keyFile fallback silently breaks on fresh deploys.
function getDriveReadonlyClient() {
    const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
    let auth = null;
    if (process.env.GOOGLE_SA_JSON) {
        try {
            const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
            if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
            // Same code path as the proven-working keyFile flow, just in-memory.
            // (A raw google.auth.JWT client was observed sending requests Drive
            // rejects as "unregistered callers" — do not use it here.)
            auth = new google.auth.GoogleAuth({ credentials: sa, scopes });
        } catch (e) {
            console.warn('[GoogleDoc] GOOGLE_SA_JSON parse failed, falling back to keyFile:', e.message);
            auth = null;
        }
    }
    if (!auth) {
        try {
            auth = new google.auth.GoogleAuth({
                keyFile: path.join(__dirname, 'service-account.json'),
                scopes
            });
        } catch (e) {
            auth = new google.auth.GoogleAuth({ scopes });
        }
    }
    return google.drive({ version: 'v3', auth });
}

function getBotEmail() {
    try {
        const email = JSON.parse(process.env.GOOGLE_SA_JSON).client_email;
        if (email) return email;
    } catch (e) {}
    return 'chscommunication@appspot.gserviceaccount.com';
}

// ==========================================
// Bot Comment Posting (via / on Google Docs)
// The service account is only a courier: the real author is embedded as a
// "Created by <platform user>: <text>" prefix so the client can attribute it.
// ==========================================
const BOT_DISPLAY_PREFIX = 'Created by ';

async function getBotWriteAuth() {
    const scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents.readonly'
    ];
    if (process.env.GOOGLE_SA_JSON) {
        const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
        if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
        return new google.auth.GoogleAuth({ credentials: sa, scopes });
    }
    return new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'service-account.json'),
        scopes
    });
}

exports.postGoogleDocComment = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data, context) => {
    const startedAt = Date.now();
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign-in required to post comments.');
    }

    const docUrl = data.url;
    const fileId = extractGoogleDocId(docUrl);
    if (!fileId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid document URL');
    }
    const chatId = data.chatId || null;
    const messageKey = data.messageKey || null;
    const commentId = (typeof data.commentId === 'string' && /^[A-Za-z0-9_-]{8,}$/.test(data.commentId))
        ? data.commentId : null;

    const rawText = String(data.content || '').replace(/\r\n/g, '\n').trim();
    if (!rawText) {
        throw new functions.https.HttpsError('invalid-argument', 'Comment text is empty.');
    }
    if (rawText.length > 3000) {
        throw new functions.https.HttpsError('invalid-argument', 'Comment text is too long (3000 character limit).');
    }
    const userName = String(data.userName || '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Anonymous';
    const postedText = `${BOT_DISPLAY_PREFIX}${userName}: ${rawText}`;

    let failKind = 'unknown';
    let errInfo = null;
    let postedId = null;
    try {
        const auth = await getBotWriteAuth();
        const drive = google.drive({ version: 'v3', auth });

        // Google Docs renders floating (unanchored) API comments as
        // "Original content deleted", so doc-wide notes anchor to the first
        // non-empty paragraph of the document body instead.
        let rangeAnchor = null;
        if (!commentId) {
            try {
                const docs = google.docs({ version: 'v3', auth });
                const dres = await docs.documents.get({
                    documentId: fileId,
                    fields: 'body/content(startIndex,endIndex,paragraph(elements(textRun(content))))'
                });
                const segs = (dres.data.body && dres.data.body.content) || [];
                for (const seg of segs) {
                    const els = (seg.paragraph && seg.paragraph.elements) || [];
                    const text = els.map(e => (e.textRun && e.textRun.content) || '').join('');
                    if (text.trim()) {
                        rangeAnchor = { startIndex: seg.startIndex, endIndex: seg.endIndex };
                        break;
                    }
                }
            } catch (anchorErr) {
                console.warn('[GoogleDoc] first-paragraph anchor lookup failed, posting unanchored:', anchorErr.message);
            }
        }

        const requestBody = { content: postedText };
        if (rangeAnchor) requestBody.rangeAnchor = rangeAnchor;

        let res;
        if (commentId) {
            res = await drive.replies.create({
                fileId,
                commentId,
                supportsAllDrives: true,
                fields: 'id,content,createdTime',
                requestBody: { content: postedText }
            });
        } else {
            res = await drive.comments.create({
                fileId,
                supportsAllDrives: true,
                fields: 'id,content,createdTime',
                requestBody
            });
        }
        postedId = (res.data && res.data.id) || null;
    } catch (err) {
        errInfo = classifyGoogleError(err);
        console.warn(`[GoogleDoc] comment post failed (${errInfo.status} ${errInfo.reason}): ${errInfo.message}`);
        if (looksLikeCredentialFailure(errInfo) || errInfo.status === 401) failKind = 'auth';
        else if (errInfo.status === 403) failKind = 'permission';
        else if (errInfo.status === 404) failKind = 'not_found';
        else if (errInfo.status === 400) failKind = 'bad_request';
        else if (errInfo.status === 429 || errInfo.status >= 500) failKind = 'retryable';
    }

    const success = !!postedId && !errInfo;
    appendSyncLog(fileId, {
        startedAt: startedAt,
        finishedAt: Date.now(),
        chatId: chatId || '',
        messageKey: messageKey || '',
        kind: 'post_comment',
        mode: commentId ? 'reply' : 'doc_wide',
        targetCommentId: commentId || '',
        postedCommentId: postedId || '',
        httpCode: errInfo ? errInfo.status : 200,
        googleReason: errInfo ? errInfo.reason : '',
        googleError: errInfo ? errInfo.message : '',
        resultStatus: success ? 'posted' : failKind
    });

    return {
        success: success,
        postedCommentId: postedId,
        postedAt: success ? Date.now() : null,
        failKind: success ? null : failKind,
        httpStatus: errInfo ? errInfo.status : null,
        error: errInfo ? errInfo.message : null
    };
});

// Only the bot's own top-level comments can be deleted: Google refuses to
// delete a thread that has replies and offers no API for deleting replies.
exports.deleteGoogleDocComment = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data, context) => {
    const startedAt = Date.now();
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign-in required to delete comments.');
    }

    const fileId = extractGoogleDocId(data.url);
    if (!fileId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid document URL');
    }
    const commentId = (typeof data.commentId === 'string' && /^[A-Za-z0-9_-]{8,}$/.test(data.commentId))
        ? data.commentId : null;
    if (!commentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid comment ID.');
    }
    const chatId = data.chatId || null;

    let failKind = 'unknown';
    let errInfo = null;
    try {
        const auth = await getBotWriteAuth();
        const drive = google.drive({ version: 'v3', auth });
        await drive.comments.delete({ fileId, commentId, supportsAllDrives: true });
    } catch (err) {
        errInfo = classifyGoogleError(err);
        console.warn(`[GoogleDoc] comment delete failed (${errInfo.status} ${errInfo.reason}): ${errInfo.message}`);
        if (looksLikeCredentialFailure(errInfo) || errInfo.status === 401) failKind = 'auth';
        else if ((errInfo.status === 400 || errInfo.status === 403) && /repl/i.test(errInfo.message)) failKind = 'has_replies';
        else if (errInfo.status === 403) failKind = 'permission';
        else if (errInfo.status === 404) failKind = 'not_found';
        else if (errInfo.status === 429 || errInfo.status >= 500) failKind = 'retryable';
        else failKind = 'bad_request';
    }

    const success = !errInfo;
    appendSyncLog(fileId, {
        startedAt: startedAt,
        finishedAt: Date.now(),
        chatId: chatId || '',
        kind: 'delete_comment',
        targetCommentId: commentId,
        httpCode: errInfo ? errInfo.status : 200,
        googleReason: errInfo ? errInfo.reason : '',
        googleError: errInfo ? errInfo.message : '',
        resultStatus: success ? 'deleted' : failKind
    });

    return {
        success: success,
        deletedCommentId: success ? commentId : null,
        failKind: success ? null : failKind,
        httpStatus: errInfo ? errInfo.status : null,
        error: errInfo ? errInfo.message : null
    };
});

// Shared by the fetchGoogleDocComments callable and the public doc-request
// submission flow, which must sync a doc without a chat message driving it.
async function runGoogleDocSync(data) {
    const startedAt = Date.now();
    const docUrl = data.url;
    const fileId = extractGoogleDocId(docUrl);
    if (!fileId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid Google Doc URL');
    }
    const chatId = data.chatId || null;
    const messageKey = data.messageKey || null;
    const knownTitle = (data.knownTitle && data.knownTitle !== PLACEHOLDER_DOC_TITLE) ? data.knownTitle : null;
    const db = admin.database();

    // ---- Source of truth: per chat+file snapshot state ----
    const stateRef = chatId ? db.ref(`writing_doc_state/${chatId}/${fileId}`) : null;
    let prevState = null;
    if (stateRef) {
        try {
            prevState = (await stateRef.once('value')).val() || null;
        } catch (e) {
            console.warn('[GoogleDoc] Failed to load previous doc state:', e.message);
        }
    }
    const prevSnapshot = (prevState && prevState.snapshotComments) || [];
    // The snapshot itself is the announce ledger: every id already recorded
    // in the last good sync has been (or deliberately was not) announced.
    const prevIds = new Set();
    prevSnapshot.forEach(pc => {
        if (!pc || !pc.id) return;
        prevIds.add(pc.id);
        (pc.replies || []).forEach(r => { if (r && r.id) prevIds.add(r.id); });
    });
    const prevLiveCount = prevState && prevState.lastKnownCommentCount !== undefined
        ? Number(prevState.lastKnownCommentCount)
        : countLiveComments(prevSnapshot);
    const hasSnapshot = !!(prevState && prevState.lastSuccessfulSyncAt);

    const drive = getDriveReadonlyClient();

    // ---- LEVEL 1: can the bot still read the file at all? ----
    let fileInfo = null;
    let fileErrInfo = null;
    try {
        const res = await drive.files.get({
            fileId: fileId,
            supportsAllDrives: true,
            fields: FILE_GET_FIELDS
        });
        fileInfo = res.data || null;
    } catch (err) {
        fileErrInfo = classifyGoogleError(err);
        console.warn(`[GoogleDoc] files.get failed (${fileErrInfo.status} ${fileErrInfo.reason}): ${fileErrInfo.message}`);
    }

    let fileAccessStatus;
    if (fileInfo) {
        fileAccessStatus = 'ok';
    } else if (fileErrInfo && (fileErrInfo.status === 401 || looksLikeCredentialFailure(fileErrInfo))) {
        // Bot credentials missing/broken on the deployed function — NOT the doc's fault.
        fileAccessStatus = 'auth_required';
    } else if (fileErrInfo && fileErrInfo.status === 403) {
        fileAccessStatus = 'access_lost';
    } else if (fileErrInfo && (fileErrInfo.status === 429 || fileErrInfo.status >= 500)) {
        fileAccessStatus = 'sync_failed_retryable';
    } else if (fileErrInfo && fileErrInfo.status === 404) {
        // Google hides "no read access" and "nonexistent" behind the same 404 —
        // never claim the file was deleted.
        fileAccessStatus = hasSnapshot ? 'access_lost_or_file_unavailable' : 'file_unavailable';
    } else {
        // 400 (our own bad request / malformed id), network, anything unrecognized:
        // blame ourselves, never the doc, and keep the snapshot.
        fileAccessStatus = 'sync_failed_retryable';
    }

    // ---- LEVEL 2: comment read access (only attempted when the file itself is readable) ----
    let fetchedComments = null;
    let commentsErrInfo = null;
    let pagesFetched = 0;
    if (fileAccessStatus === 'ok') {
        try {
            const all = [];
            let pageToken = undefined;
            do {
                const res = await drive.comments.list({
                    fileId: fileId,
                    pageToken: pageToken,
                    includeDeleted: true,
                    pageSize: 100,
                    supportsAllDrives: true,
                    fields: COMMENTS_LIST_FIELDS
                });
                all.push(...((res.data && res.data.comments) || []));
                pagesFetched += 1;
                pageToken = res.data && res.data.nextPageToken;
            } while (pageToken && pagesFetched < 10);
            fetchedComments = all;
        } catch (err) {
            commentsErrInfo = classifyGoogleError(err);
            console.warn(`[GoogleDoc] comments.list failed (${commentsErrInfo.status} ${commentsErrInfo.reason}): ${commentsErrInfo.message}`);
        }
    }

    let commentAccessStatus;
    if (fileAccessStatus !== 'ok') {
        commentAccessStatus = 'not_attempted';
    } else if (fetchedComments !== null) {
        commentAccessStatus = 'ok';
    } else if (commentsErrInfo && commentsErrInfo.status === 401) {
        commentAccessStatus = 'auth_required';
    } else if (commentsErrInfo && commentsErrInfo.status === 403) {
        commentAccessStatus = 'comments_access_lost';
    } else if (commentsErrInfo && (commentsErrInfo.status === 429 || commentsErrInfo.status >= 500)) {
        commentAccessStatus = 'sync_failed_retryable';
    } else {
        commentAccessStatus = 'comments_unavailable';
    }

    // ---- State machine resolution ----
    let snapshotComments = prevSnapshot;
    let lastSuccessfulSyncAt = (prevState && prevState.lastSuccessfulSyncAt) || null;
    let accessLostAt = (prevState && prevState.accessLostAt) || null;
    let commentsAccessLostAt = (prevState && prevState.commentsAccessLostAt) || null;
    const warnings = [];
    let syncStatus;

    if (fileAccessStatus === 'auth_required' || fileAccessStatus === 'sync_failed_retryable') {
        syncStatus = fileAccessStatus;
    } else if (fileAccessStatus === 'access_lost' || fileAccessStatus === 'access_lost_or_file_unavailable' || fileAccessStatus === 'file_unavailable') {
        syncStatus = fileAccessStatus;
        if (fileAccessStatus !== 'file_unavailable') accessLostAt = accessLostAt || startedAt;
    } else if (commentAccessStatus === 'auth_required' || commentAccessStatus === 'sync_failed_retryable') {
        syncStatus = commentAccessStatus;
    } else if (commentAccessStatus === 'comments_access_lost' || commentAccessStatus === 'comments_unavailable') {
        syncStatus = commentAccessStatus;
        commentsAccessLostAt = commentsAccessLostAt || startedAt;
    } else {
        // Both levels succeeded: this is a complete, verified comment read.
        if (fileInfo.trashed) {
            warnings.push('The document is in Google Drive trash.');
        }
        if (fetchedComments.length === 0 && prevLiveCount > 0) {
            // Previously had comments, now Google returns nothing at all (even
            // tombstones). Suspect viewer-level masking, not a real wipe.
            syncStatus = 'comments_unavailable_or_empty';
            commentsAccessLostAt = commentsAccessLostAt || startedAt;
        } else {
            snapshotComments = mergeSnapshotComments(prevSnapshot, fetchedComments);
            lastSuccessfulSyncAt = startedAt;
            syncStatus = countLiveComments(snapshotComments) === 0 ? 'no_comments_yet' : 'synced';
        }
    }

    const lastKnownCommentCount = countLiveComments(snapshotComments);

    const nextState = {
        fileId: fileId,
        docUrl: docUrl,
        title: (fileInfo && fileInfo.name) || firstRealTitle(prevState && prevState.title, knownTitle) || PLACEHOLDER_DOC_TITLE,
        webViewLink: (fileInfo && fileInfo.webViewLink) || (prevState && prevState.webViewLink) || docUrl,
        createdTime: (fileInfo && fileInfo.createdTime) || (prevState && prevState.createdTime) || null,
        modifiedTime: (fileInfo && fileInfo.modifiedTime) || (prevState && prevState.modifiedTime) || null,
        trashed: !!(fileInfo && fileInfo.trashed),
        capabilities: (fileInfo && fileInfo.capabilities) || (prevState && prevState.capabilities) || null,
        owners: (fileInfo && fileInfo.owners) || (prevState && prevState.owners) || null,
        lastSyncAttemptAt: startedAt,
        lastSyncStatus: syncStatus,
        fileAccessStatus: fileAccessStatus,
        commentAccessStatus: commentAccessStatus,
        lastSyncErrorCode: String((fileErrInfo && fileErrInfo.status) || (commentsErrInfo && commentsErrInfo.status) || ''),
        lastSyncErrorReason: (fileErrInfo && fileErrInfo.reason) || (commentsErrInfo && commentsErrInfo.reason) || '',
        lastSyncErrorMessage: (fileErrInfo && fileErrInfo.message) || (commentsErrInfo && commentsErrInfo.message) || '',
        accessLostAt: accessLostAt,
        commentsAccessLostAt: commentsAccessLostAt,
        lastSuccessfulSyncAt: lastSuccessfulSyncAt,
        lastKnownCommentCount: lastKnownCommentCount,
        snapshotCommentCount: snapshotComments.length,
        snapshotUpdatedAt: syncStatus === 'synced' || syncStatus === 'no_comments_yet' ? startedAt : ((prevState && prevState.snapshotUpdatedAt) || null),
        snapshotComments: snapshotComments
    };
    if (messageKey) {
        nextState.linkedMessageKeys = { ...(prevState && prevState.linkedMessageKeys), [messageKey]: true };
    }
    if (warnings.length) {
        nextState.warnings = warnings;
    }

    // ---- Persist snapshot state ----
    if (stateRef) {
        try {
            await stateRef.set(nextState);
        } catch (e) {
            console.warn('[GoogleDoc] Failed to persist writing_doc_state:', e.message);
        }
    }

    // Slim timer ledger: syncGoogleDocsTimer queues off writing_sync_index
    // instead of downloading every doc's full snapshotComments each round.
    const writeSyncIndex = async (msgKeyHint) => {
        if (!stateRef) return;
        try {
            await db.ref(`writing_sync_index/${chatId}/${fileId}`).set({
                docUrl: docUrl,
                title: nextState.title,
                lastSyncStatus: syncStatus,
                lastSyncAttemptAt: startedAt,
                lastSuccessfulSyncAt: lastSuccessfulSyncAt,
                messageKey: msgKeyHint || null
            });
        } catch (e) {
            console.warn('[GoogleDoc] Failed to persist writing_sync_index:', e.message);
        }
    };
    await writeSyncIndex(messageKey || Object.keys((prevState && prevState.linkedMessageKeys) || {})[0] || null);

    // Lightweight, merge-safe display copy pushed onto each linked message.
    const docData = {
        fileId: fileId,
        docUrl: docUrl,
        title: nextState.title,
        webViewLink: nextState.webViewLink,
        createdTime: nextState.createdTime,
        modifiedTime: nextState.modifiedTime,
        commentsCount: lastKnownCommentCount,
        lastSyncedAt: startedAt,
        lastSuccessfulSyncAt: lastSuccessfulSyncAt,
        lastKnownCommentCount: lastKnownCommentCount,
        syncStatus: syncStatus,
        fileAccessStatus: fileAccessStatus,
        commentAccessStatus: commentAccessStatus,
        accessLostAt: accessLostAt,
        commentsAccessLostAt: commentsAccessLostAt,
        lastSyncErrorReason: nextState.lastSyncErrorReason,
        lastSyncErrorMessage: nextState.lastSyncErrorMessage,
        warnings: warnings,
        // Legacy flag kept so older renderers still show the amber notice.
        accessLost: fileAccessStatus === 'access_lost' || fileAccessStatus === 'access_lost_or_file_unavailable'
    };

    const cardInfo = {};
    const senderIdSet = new Set();
    let docCardKey = null;
    let docCardSender = { id: '', name: '' };
    let fullScanDone = false;
    const linkedKeys = new Set(Object.keys((nextState.linkedMessageKeys) || {}));
    if (messageKey) linkedKeys.add(messageKey);

    const absorbMessage = (mKey, mVal) => {
        if (mVal && mVal.senderId) senderIdSet.add(String(mVal.senderId).toLowerCase());
        if (mVal && mVal.type === 'comment_card' && mVal.commentCard && mVal.commentCard.comment && mVal.commentCard.comment.id) {
            cardInfo[String(mVal.commentCard.comment.id)] = {
                msgKey: mKey,
                senderId: String(mVal.senderId || '').toLowerCase(),
                senderName: mVal.senderName || '',
                text: mVal.text || ''
            };
        }
        return !!(mVal && mVal.text && mVal.text.includes(fileId));
    };
    const buildDocDataUpdate = (mVal) => {
        const merged = { ...docData };
        // When the file layer failed we could not verify metadata —
        // never downgrade what a previous good sync already stored.
        if (fileAccessStatus !== 'ok' && mVal.docData) {
            const prevDoc = mVal.docData;
            if (merged.title === PLACEHOLDER_DOC_TITLE) merged.title = firstRealTitle(prevDoc.title) || merged.title;
            if (!merged.webViewLink && prevDoc.webViewLink) merged.webViewLink = prevDoc.webViewLink;
            if (!merged.docUrl && prevDoc.docUrl) merged.docUrl = prevDoc.docUrl;
            if (!merged.createdTime && prevDoc.createdTime) merged.createdTime = prevDoc.createdTime;
            if (!merged.modifiedTime && prevDoc.modifiedTime) merged.modifiedTime = prevDoc.modifiedTime;
        }
        return merged;
    };
    const runFullScan = async () => {
        const chatMsgsSnap = await db.ref(`messages/${chatId}`).once('value');
        const allMsgs = chatMsgsSnap.val() || {};
        const updates = {};
        for (const [mKey, mVal] of Object.entries(allMsgs)) {
            if (absorbMessage(mKey, mVal)) {
                if (!docCardKey) {
                    docCardKey = mKey;
                    docCardSender = { id: String(mVal.senderId || '').toLowerCase(), name: mVal.senderName || '' };
                }
                updates[`messages/${chatId}/${mKey}/docData`] = buildDocDataUpdate(mVal);
                linkedKeys.add(mKey);
            }
        }
        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            console.log(`[GoogleDoc] Synced merged docData to ${Object.keys(updates).length} messages in ${chatId} (${syncStatus})`);
        }
        fullScanDone = true;
    };

    if (chatId) {
        try {
            if (linkedKeys.size === 0) {
                // Legacy docs predate the persisted link ledger — scan once to bootstrap it.
                await runFullScan();
            } else {
                const keys = [...linkedKeys];
                const snaps = await Promise.all(keys.map(k =>
                    db.ref(`messages/${chatId}/${k}`).once('value').catch(() => null)));
                const updates = {};
                snaps.forEach((snap, i) => {
                    const mVal = snap && snap.exists() ? snap.val() : null;
                    if (!mVal) { linkedKeys.delete(keys[i]); return; }
                    absorbMessage(keys[i], mVal);
                    if (!docCardKey && mVal.text && mVal.text.includes(fileId)) {
                        docCardKey = keys[i];
                        docCardSender = { id: String(mVal.senderId || '').toLowerCase(), name: mVal.senderName || '' };
                    }
                    updates[`messages/${chatId}/${keys[i]}/docData`] = buildDocDataUpdate(mVal);
                });
                if (Object.keys(updates).length > 0) {
                    await db.ref().update(updates);
                    console.log(`[GoogleDoc] Synced merged docData to ${Object.keys(updates).length} linked messages in ${chatId} (${syncStatus})`);
                }
            }
            if (stateRef && linkedKeys.size) {
                const lmk = {};
                linkedKeys.forEach(k => { lmk[k] = true; });
                await stateRef.child('linkedMessageKeys').set(lmk);
                await writeSyncIndex(Object.keys(lmk)[0] || null);
            }
        } catch (dbErr) {
            console.warn(`[GoogleDoc] Failed to update docData in DB for ${chatId}:`, dbErr.message);
        }
    }

    // ---- Google-side activity push -------------------------------------
    // Comments/replies authored directly in Google Docs (never through the
    // bot) become chat notices: replies quote the original comment_card and
    // show under the real Google author's name; brand-new threads arrive as
    // comment_cards. First sync per doc only sets the baseline.
    let notifySent = 0;
    if (chatId && hasSnapshot) {
        try {
            const newItems = collectThreadItems(snapshotComments).filter(it => !prevIds.has(it.id));
            const fresh = newItems.filter(it => String(it.content || '').trim() && !isBotCommentAuthor(it));
            console.log(`[GoogleDoc] Notice diff ${fileId} in ${chatId}: new=${newItems.length} fresh=${fresh.length} prevIds=${prevIds.size}`);
            if (fresh.length) {
                if (!fullScanDone) {
                    // Attribution needs every comment_card and every sender in the
                    // chat: pay for a full scan only when Google produced real new
                    // activity, never on a quiet refresh round.
                    try { await runFullScan(); } catch (scanErr) {
                        console.warn(`[GoogleDoc] Attribution scan failed for ${chatId}:`, scanErr.message);
                    }
                }
                const isGroup = chatId.startsWith('group_');
                const title = nextState.title || PLACEHOLDER_DOC_TITLE;
                const directIds = [...senderIdSet].filter(s => s && s !== GDOC_BOT_SENDER_ID);
                let partner = '';
                if (!isGroup && directIds.length >= 2) {
                    partner = directIds[1];
                } else if (!isGroup && directIds.length === 1) {
                    const users = (await db.ref('users').once('value')).val() || {};
                    partner = Object.keys(users).map(String).find(uid => {
                        const k = uid.toLowerCase();
                        return k !== directIds[0] && [directIds[0], k].sort().join('_') === chatId;
                    }) || '';
                }
                const byParent = new Map();
                fresh.forEach(it => {
                    const pid = it.parentId || ('top:' + it.id);
                    if (!byParent.has(pid)) byParent.set(pid, []);
                    byParent.get(pid).push(it);
                });
                const msgUpdates = {};
                const cardThreadsSent = new Set();
                // Notices ride the existing comment_card format: bubble = the new
                // reply, expand = live thread, tap = jump into the portfolio.
                // anchorIds carries the reply ids this notice stands for, so a
                // per-reply "Locate in chat" can match this exact card (comment.id
                // must stay the top-level id: replies post against the thread).
                const pushCardMessage = (aName, topId, threadSrc, bodyText, recipientId, anchorIds) => {
                    const ref = db.ref(`messages/${chatId}`).push();
                    msgUpdates[`messages/${chatId}/${ref.key}`] = {
                        senderId: GDOC_BOT_SENDER_ID,
                        // Bubble header stays CHSBot; the Google author name
                        // lives in the card strip (comment.author.displayName).
                        senderName: GDOC_BOT_DISPLAY,
                        // Push notifications are titled with the real author.
                        notifyName: aName,
                        ...(isGroup || !recipientId ? {} : { recipientId }),
                        text: `Comment on "${title}"`,
                        type: 'comment_card',
                        commentCard: {
                            docId: fileId,
                            docUrl: docUrl,
                            docTitle: title,
                            originMsgKey: docCardKey,
                            anchorIds: (anchorIds || []).filter(Boolean),
                            comment: {
                                id: topId,
                                author: { displayName: aName },
                                content: bodyText,
                                quotedFileContent: (threadSrc && threadSrc.quotedFileContent) || null,
                                createdTime: new Date().toISOString()
                            }
                        },
                        timestamp: admin.database.ServerValue.TIMESTAMP
                    };
                    notifySent++;
                };
                for (const [pid, items] of byParent.entries()) {
                    const isReply = !!items[0].parentId;
                    if (isReply) {
                        const thread = snapshotComments.find(x => x && x.id === pid) || null;
                        const card = cardInfo[pid];
                        const byAuthor = new Map();
                        items.forEach(it => {
                            const aName = String(it.author.displayName || GDOC_BOT_DISPLAY).trim() || GDOC_BOT_DISPLAY;
                            if (!byAuthor.has(aName)) byAuthor.set(aName, []);
                            byAuthor.get(aName).push(String(it.content).trim());
                        });
                        for (const [aName, texts] of byAuthor.entries()) {
                            // The card always lands in the chat; only the push
                            // is rerouted so nobody gets pinged about their own
                            // Google-side reply.
                            const selfReply = card && aName.toLowerCase() === String(card.senderName || '').toLowerCase();
                            const recipient = selfReply
                                ? (partner || '')
                                : (card ? card.senderId : (docCardSender.id || partner || ''));
                            pushCardMessage(aName, pid, thread, texts.join('\n'), recipient, items.map(it => it.id));
                        }
                    } else {
                        const topId = items[0].id;
                        if (cardThreadsSent.has(topId)) continue;
                        cardThreadsSent.add(topId);
                        const src = snapshotComments.find(x => x && x.id === topId) || items[0];
                        const aName = String((src.author && src.author.displayName) || GDOC_BOT_DISPLAY).trim() || GDOC_BOT_DISPLAY;
                        let recipient = docCardSender.id || '';
                        if (aName.toLowerCase() === String(docCardSender.name || '').toLowerCase() && partner) {
                            recipient = partner;
                        }
                        pushCardMessage(aName, topId, src, String(src.content || items[0].content || '').trim(), recipient, [topId]);
                    }
                }
                if (notifySent) {
                    const stamp = Date.now();
                    if (isGroup) {
                        msgUpdates[`classes/${chatId.replace('group_', '')}/lastActivity`] = stamp;
                        directIds.forEach(uid => { msgUpdates[`user_chats/${uid}/${chatId}`] = stamp; });
                    } else {
                        const peers = directIds.slice(0, 2);
                        if (peers.length === 2) {
                            msgUpdates[`user_chats/${peers[0]}/${peers[1]}`] = stamp;
                            msgUpdates[`user_chats/${peers[1]}/${peers[0]}`] = stamp;
                        } else if (peers.length === 1 && partner) {
                            msgUpdates[`user_chats/${peers[0]}/${partner}`] = stamp;
                            msgUpdates[`user_chats/${partner}/${peers[0]}`] = stamp;
                        }
                    }
                    await db.ref().update(msgUpdates);
                    console.log(`[GoogleDoc] Pushed ${notifySent} Google-side notice(s) to ${chatId} for ${fileId}`);
                }
            }
        } catch (notifyErr) {
            console.warn(`[GoogleDoc] Notice pass failed for ${chatId}/${fileId}:`, notifyErr.message);
        }
    }

    appendSyncLog(fileId, {
        startedAt: startedAt,
        finishedAt: Date.now(),
        chatId: chatId || '',
        messageKey: messageKey || '',
        fileGetStatus: fileInfo ? 'ok' : String((fileErrInfo && fileErrInfo.status) || 'error'),
        commentsListStatus: fetchedComments !== null ? 'ok' : String((commentsErrInfo && commentsErrInfo.status) || (fileAccessStatus !== 'ok' ? 'skipped' : 'error')),
        httpCode: (fileErrInfo && fileErrInfo.status) || (commentsErrInfo && commentsErrInfo.status) || 200,
        googleReason: (fileErrInfo && fileErrInfo.reason) || (commentsErrInfo && commentsErrInfo.reason) || '',
        googleError: (fileErrInfo && fileErrInfo.message) || (commentsErrInfo && commentsErrInfo.message) || '',
        commentsReturnedCount: fetchedComments ? fetchedComments.length : -1,
        pagesFetched: pagesFetched,
        newNotices: notifySent,
        resultStatus: syncStatus
    });

    const isSyncedResult = syncStatus === 'synced' || syncStatus === 'no_comments_yet';
    // The response keeps the full comment snapshot: the client refreshes its
    // open doc cards from it. Only the per-message display copy is slim.
    return {
        success: isSyncedResult,
        error: isSyncedResult ? null : (nextState.lastSyncErrorMessage || syncStatus),
        ...docData,
        comments: snapshotComments
    };
}

exports.fetchGoogleDocComments = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data, context) => {
    return runGoogleDocSync(data);
});

const { onSchedule } = require('firebase-functions/v2/scheduler');

// Every 15 minutes: refresh active doc snapshots so Google-side comments and
// replies get pushed into their chats even while nobody has the chat open.
exports.syncGoogleDocsTimer = onSchedule({
    schedule: 'every 15 minutes',
    timeZone: 'America/New_York',
    timeoutSeconds: 540,
    memoryMb: 256,
    secrets: ['GOOGLE_SA_JSON']
}, async () => {
    const db = admin.database();
    let ledger = (await db.ref('writing_sync_index').once('value')).val() || {};
    if (!Object.keys(ledger).length) {
        // First round after deploy: rebuild the ledger from the full state
        // once, then no later round ever touches snapshotComments again.
        const states = (await db.ref('writing_doc_state').once('value')).val() || {};
        const built = {};
        Object.entries(states).forEach(([chatId, files]) => {
            Object.entries(files || {}).forEach(([fileId, st]) => {
                if (!st) return;
                if (!built[chatId]) built[chatId] = {};
                built[chatId][fileId] = {
                    docUrl: st.docUrl || null,
                    title: st.title || null,
                    lastSyncStatus: st.lastSyncStatus || null,
                    lastSyncAttemptAt: st.lastSyncAttemptAt || null,
                    lastSuccessfulSyncAt: st.lastSuccessfulSyncAt || null,
                    messageKey: Object.keys(st.linkedMessageKeys || {})[0] || null
                };
            });
        });
        if (Object.keys(built).length) {
            await db.ref('writing_sync_index').update(built);
            ledger = built;
        }
    }
    const now = Date.now();
    const FRESH_MS = 13 * 60 * 1000;
    const SKIP = ['access_lost', 'access_lost_or_file_unavailable', 'file_unavailable', 'comments_access_lost'];
    const queue = [];
    Object.entries(ledger).forEach(([chatId, files]) => {
        Object.entries(files || {}).forEach(([fileId, st]) => {
            if (!st || !st.docUrl || SKIP.includes(st.lastSyncStatus)) return;
            const last = Math.max(Number(st.lastSyncAttemptAt) || 0, Number(st.lastSuccessfulSyncAt) || 0);
            if (now - last < FRESH_MS) return;
            queue.push({
                chatId, fileId,
                docUrl: st.docUrl,
                knownTitle: (st.title && st.title !== PLACEHOLDER_DOC_TITLE) ? st.title : null,
                messageKey: st.messageKey || null,
                last
            });
        });
    });
    queue.sort((a, b) => a.last - b.last);
    const batch = queue.slice(0, 25);
    let ok = 0, failed = 0;
    for (const item of batch) {
        try {
            await runGoogleDocSync({ url: item.docUrl, chatId: item.chatId, messageKey: item.messageKey, knownTitle: item.knownTitle });
            ok++;
        } catch (e) {
            failed++;
            console.warn(`[GoogleDoc][Timer] ${item.chatId}/${item.fileId} failed: ${e && e.message}`);
        }
    }
    console.log(`[GoogleDoc][Timer] queued=${queue.length} ran=${batch.length} ok=${ok} fail=${failed}`);
});

// ==========================================
// DOC REQUESTS
// A signed-in user mints a single-use link; whoever holds it can drop a Google
// Doc into that user's writing portfolio without ever signing in. The link is
// the only credential, so it is random, one-shot, and checked for a real
// comment-level grant before anything is written.
// ==========================================
const REQUEST_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
const REQUEST_MAX_TRIES = 10;
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';

function authIdentityIds(auth) {
    const token = (auth && auth.token) || {};
    const uid = String(token.uid || '');
    const fromEmail = String(token.email || '')
        .replace('@gmail.com', '')
        .replace('@hcpss.org', '')
        .replace('@inst.hcpss.org', '')
        .replace('.', '_');
    return [uid, fromEmail].filter(Boolean);
}

async function groupHasUser(chatId, userId) {
    const classId = chatId.replace('group_', '');
    const snap = await admin.database().ref(`classes/${classId}`).once('value');
    const cls = snap.val() || {};
    const students = cls.students || {};
    const teacherId = String(cls.teacherId || '').toLowerCase();
    const id = String(userId || '').toLowerCase();
    return teacherId === id || !!students[id] || !!students[userId];
}

exports.createDocRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in to request a document.');
    }
    const payload = data || {};
    const chatId = String(payload.chatId || '');
    const requesterId = String(payload.requesterId || '').trim();
    const requesterName = String(payload.requesterName || '').trim().slice(0, 80);
    const recipientId = String(payload.recipientId || '').trim();
    if (!chatId || !requesterId || !requesterName) {
        throw new functions.https.HttpsError('invalid-argument', 'A chat, an id and a display name are required.');
    }

    // The link writes into messages/<chatId> as the requester, so prove both
    // halves of that claim: the caller owns requesterId, and requesterId is in chatId.
    const ownsIdentity = authIdentityIds(context.auth)
        .some(id => id.toLowerCase() === requesterId.toLowerCase());
    const isGroup = chatId.startsWith('group_');
    const inChat = isGroup
        ? await groupHasUser(chatId, requesterId)
        : chatId.toLowerCase().includes(requesterId.toLowerCase());
    if (!ownsIdentity || !inChat) {
        throw new functions.https.HttpsError('permission-denied', 'You can only request documents into your own chats.');
    }

    const requestRef = admin.database().ref('writing_doc_requests').push();
    await requestRef.set({
        chatId,
        requesterId,
        requesterName,
        recipientId: isGroup ? '' : recipientId,
        createdAt: Date.now(),
        expiresAt: Date.now() + REQUEST_LIFE_MS,
        attempts: 0,
        status: 'open'
    });

    return { requestId: requestRef.key };
});

async function readOpenRequest(requestId) {
    // The key is the only credential the link carries, so it has to be a plain
    // RTDB push key: dots and slashes would let it walk to another path.
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(requestId)) {
        return { error: 'This request link is not valid.' };
    }
    const requestRef = admin.database().ref(`writing_doc_requests/${requestId}`);
    const req = (await requestRef.once('value')).val();
    if (!req || !req.chatId) return { error: 'This request link is not valid.' };
    if (req.status !== 'open') return { error: 'This request link has already been used.' };
    if (req.expiresAt && Date.now() > req.expiresAt) return { error: 'This request link has expired.' };
    if (Number(req.attempts || 0) >= REQUEST_MAX_TRIES) {
        return { error: 'Too many attempts on this link. Please ask for a new one.' };
    }
    return { requestRef, req };
}

exports.readDocRequest = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data) => {
    const { req, error } = await readOpenRequest(String((data && data.requestId) || ''));
    if (error) throw new functions.https.HttpsError('not-found', error);
    return { requesterName: req.requesterName, botEmail: getBotEmail() };
});

exports.submitDocRequest = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data) => {
    const payload = data || {};
    const { requestRef, req, error } = await readOpenRequest(String(payload.requestId || ''));
    if (error) {
        return { ok: false, reason: 'invalid_request', message: error };
    }

    const docUrl = String(payload.url || '').trim();
    const fileId = extractGoogleDocId(docUrl);
    if (!fileId || !docUrl.includes('docs.google.com/document/d/')) {
        return { ok: false, reason: 'bad_url', message: 'Use a Google Doc link that looks like https://docs.google.com/document/d/...' };
    }

    // Every verification costs a Drive call against the link's single credential.
    await requestRef.child('attempts').set(Number(req.attempts || 0) + 1);

    const drive = getDriveReadonlyClient();
    let fileInfo = null;
    let accessError = null;
    try {
        const res = await drive.files.get({
            fileId,
            supportsAllDrives: true,
            fields: FILE_GET_FIELDS
        });
        fileInfo = res.data || null;
    } catch (err) {
        accessError = classifyGoogleError(err);
        console.warn(`[DocRequest] files.get failed (${accessError.status} ${accessError.reason})`);
    }

    if (!fileInfo) {
        // Never blame the uploader's sharing settings for our own broken
        // credentials or a Google-side hiccup.
        const status = (accessError && accessError.status) || 0;
        if (!accessError || status === 401 || status === 429 || status >= 500 || looksLikeCredentialFailure(accessError)) {
            return { ok: false, reason: 'retry', message: 'We could not check this document right now. Please try again in a moment.' };
        }
        return {
            ok: false,
            reason: 'no_access',
            message: `We cannot open this document yet. Please set access to "Anyone with the link can comment", or share it with ${getBotEmail()} as a Commenter, then try again.`
        };
    }
    if (fileInfo.mimeType && fileInfo.mimeType !== GOOGLE_DOC_MIME) {
        return { ok: false, reason: 'not_a_doc', message: 'That link is not a Google Doc.' };
    }

    // The portfolio needs to read and post comment threads, so a view-only
    // grant is not enough even though files.get succeeded.
    const caps = fileInfo.capabilities || {};
    const commentVerified = caps.canComment === true || caps.canEdit === true;
    const capsUnknown = caps.canComment === undefined && caps.canEdit === undefined;
    if (!commentVerified && !capsUnknown) {
        return {
            ok: false,
            reason: 'needs_comment',
            message: `We can open "${fileInfo.name || 'this document'}", but only at a viewer level. Change the access to "Anyone with the link can comment" and submit again.`
        };
    }

    const db = admin.database();
    const chatId = req.chatId;
    const isGroup = chatId.startsWith('group_');
    const msgRef = db.ref(`messages/${chatId}`).push();
    const messageKey = msgRef.key;

    await msgRef.set({
        senderId: req.requesterId,
        senderName: req.requesterName,
        ...(isGroup || !req.recipientId ? {} : { recipientId: String(req.recipientId).toLowerCase() }),
        timestamp: Date.now(),
        text: docUrl,
        type: 'text'
    });

    // Spend the link as soon as the message exists: a later failure must not
    // leave it open for a second upload into the same portfolio.
    await requestRef.update({
        status: 'submitted',
        usedAt: Date.now(),
        fileId,
        docUrl
    });

    const sync = await runGoogleDocSync({ url: docUrl, chatId, messageKey });

    // Surface the conversation the way a client-sent message would.
    const stamp = Date.now();
    const me = String(req.requesterId || '').toLowerCase();
    const other = String(req.recipientId || '').toLowerCase();
    const touches = isGroup
        ? {
            [`classes/${chatId.replace('group_', '')}/lastActivity`]: stamp,
            [`user_chats/${me}/${chatId}`]: stamp
        }
        : (other ? { [`user_chats/${me}/${other}`]: stamp, [`user_chats/${other}/${me}`]: stamp } : {});
    if (Object.keys(touches).length) {
        await db.ref().update(touches);
    }

    const title = sync.title || fileInfo.name || 'Google Document';
    await requestRef.child('docTitle').set(title);
    return { ok: true, title };
});

// ==========================================
// CLASS JOIN LINK
// Every class carries a forced "Class Join Link" extension: a permanent,
// public page (/join.html?class=<id>) where a student types their school
// email + name and submits a Google Doc. A correctly-formatted @inst.hcpss.org
// identity and a comment-level Doc grant are the only requirements, so a
// student can join a class before ever signing in. The Admin SDK performs
// every write, so no new security rules are needed.
// ==========================================
const CLASS_ID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const STUDENT_EMAIL_RE = /^[a-z0-9][a-z0-9._-]{0,60}@inst\.hcpss\.org$/;

function titleCaseName(part) {
    const clean = String(part || '').trim().replace(/\s+/g, ' ').replace(/[<>&]/g, '').slice(0, 20);
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
}

async function loadJoinableClass(classId) {
    if (!CLASS_ID_RE.test(classId)) return null;
    const snap = await admin.database().ref(`classes/${classId}`).once('value');
    const cls = snap.val();
    if (!cls || typeof cls.name !== 'string' || !cls.name.trim()) return null;
    return cls;
}

exports.readClassJoin = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data) => {
    const cls = await loadJoinableClass(String((data && data.classId) || ''));
    if (!cls) {
        throw new functions.https.HttpsError('not-found', 'This class link is not valid.');
    }
    let teacherName = '';
    if (cls.teacherId) {
        const teacherSnap = await admin.database().ref(`users/${cls.teacherId}/name`).once('value');
        teacherName = String(teacherSnap.val() || '');
    }
    return { className: cls.name, teacherName, botEmail: getBotEmail() };
});

exports.submitClassJoin = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data) => {
    const payload = data || {};
    const classId = String(payload.classId || '');
    const cls = await loadJoinableClass(classId);
    if (!cls) {
        return { ok: false, reason: 'invalid_class', message: 'This class link is not valid. Please ask your teacher for a fresh link.' };
    }

    const email = String(payload.email || '').trim().toLowerCase();
    if (!STUDENT_EMAIL_RE.test(email)) {
        return { ok: false, reason: 'bad_email', message: 'Please use your school email address ending with @inst.hcpss.org.' };
    }
    const first = titleCaseName(payload.firstName);
    const last = titleCaseName(payload.lastName);
    if (!first || !last) {
        return { ok: false, reason: 'bad_name', message: 'Enter both your first and last name.' };
    }
    const fullName = `${first} ${last}`;

    const docUrl = String(payload.url || '').trim();
    const fileId = extractGoogleDocId(docUrl);
    if (!fileId || !docUrl.includes('docs.google.com/document/d/')) {
        return { ok: false, reason: 'bad_url', message: 'Use a Google Doc link that looks like https://docs.google.com/document/d/...' };
    }

    // Same document gate as the doc-request link: the portfolio needs a real
    // comment-level grant before anything is written.
    const drive = getDriveReadonlyClient();
    let fileInfo = null;
    let accessError = null;
    try {
        const res = await drive.files.get({ fileId, supportsAllDrives: true, fields: FILE_GET_FIELDS });
        fileInfo = res.data || null;
    } catch (err) {
        accessError = classifyGoogleError(err);
        console.warn(`[ClassJoin] files.get failed (${accessError.status} ${accessError.reason})`);
    }

    if (!fileInfo) {
        const status = (accessError && accessError.status) || 0;
        if (!accessError || status === 401 || status === 429 || status >= 500 || looksLikeCredentialFailure(accessError)) {
            return { ok: false, reason: 'retry', message: 'We could not check this document right now. Please try again in a moment.' };
        }
        return {
            ok: false,
            reason: 'no_access',
            message: `We cannot open this document yet. Please share it with ${getBotEmail()} as a Commenter, or set access to "Anyone with the link can comment", then try again.`
        };
    }
    if (fileInfo.mimeType && fileInfo.mimeType !== GOOGLE_DOC_MIME) {
        return { ok: false, reason: 'not_a_doc', message: 'That link is not a Google Doc.' };
    }
    const caps = fileInfo.capabilities || {};
    const commentVerified = caps.canComment === true || caps.canEdit === true;
    const capsUnknown = caps.canComment === undefined && caps.canEdit === undefined;
    if (!commentVerified && !capsUnknown) {
        return {
            ok: false,
            reason: 'needs_comment',
            message: `We can open "${fileInfo.name || 'this document'}", but only at a viewer level. Share it with ${getBotEmail()} as a Commenter, or change the access to "Anyone with the link can comment", and submit again.`
        };
    }

    const db = admin.database();
    const idPrefix = email.split('@')[0].replace(/\./g, '_');
    const teacherId = String(cls.teacherId || '').toLowerCase();
    if (!teacherId) {
        return { ok: false, reason: 'invalid_class', message: 'This class link is not valid. Please ask your teacher for a fresh link.' };
    }
    // The document is delivered to the teacher privately, using the exact
    // direct-chat id the client would derive: [idA, idB].sort().join('_').
    const chatId = [idPrefix, teacherId].sort().join('_');

    // Pre-create (or reuse) the account keyed by email. If the student later
    // signs in with Microsoft, user.js resolves the same idPrefix from the
    // email and the account becomes theirs.
    const userRef = db.ref(`users/${idPrefix}`);
    const existingUser = (await userRef.once('value')).val();
    if (!existingUser) {
        // firebase-admin v12 only exposes TIMESTAMP via the namespace
        // (admin.database.ServerValue); the Database instance has no such getter.
        const ts = admin.database.ServerValue.TIMESTAMP;
        await userRef.set({
            name: fullName,
            role: 'student',
            email: email,
            lastSeen: ts,
            registeredAt: ts,
            hasAcceptedTerms: false,
            joinedVia: 'class_link'
        });
        await db.ref(`user_search/${idPrefix}`).set({ name: fullName, email: email, avatar: null });
    }

    // The document belongs to the student, so it lands in the teacher chat
    // under their identity exactly like a message they had sent themselves.
    const msgRef = db.ref(`messages/${chatId}`).push();
    const messageKey = msgRef.key;
    const senderName = (existingUser && existingUser.name) || fullName;
    await msgRef.set({
        senderId: idPrefix,
        senderName: senderName,
        recipientId: teacherId,
        timestamp: Date.now(),
        text: docUrl,
        type: 'text'
    });

    // Joining the class roster is independent of where the doc is sent.
    await db.ref(`classes/${classId}/students/${idPrefix}`).set(true);
    const stamp = Date.now();
    // user_chats child keys are the peer's bare uid; the combined chatId only belongs to messages/.
    const touches = {
        [`classes/${classId}/lastActivity`]: stamp,
        [`user_chats/${idPrefix}/${teacherId}`]: stamp,
        [`user_chats/${teacherId}/${idPrefix}`]: stamp
    };
    await db.ref().update(touches);

    const sync = await runGoogleDocSync({ url: docUrl, chatId, messageKey });
    return {
        ok: true,
        title: sync.title || fileInfo.name || 'Google Document',
        existingAccount: !!existingUser
    };
});

// ==========================================
// Email announcement ingestion. The Apps Script bot forwards parsed
// announcement items here with a shared secret; every write goes through
// the Admin SDK, so client rules stay untouched. news_import_log keyed by
// emailKey (gmailMessageId_index) makes re-posts idempotent server-side.
// ==========================================
exports.importAnnouncements = functions.runWith({ secrets: ['ANNOUNCE_IMPORT_TOKEN'] }).https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, reason: 'use_post' });
        return;
    }
    const expected = String(process.env.ANNOUNCE_IMPORT_TOKEN || '').trim();
    const body = req.body || {};
    if (!expected || String(body.token || '').trim() !== expected) {
        console.warn('[ImportAnnouncements] rejected: bad token');
        res.status(401).json({ ok: false, reason: 'bad_token' });
        return;
    }
    const items = Array.isArray(body.items) ? body.items.slice(0, 60) : [];
    if (items.length === 0) {
        res.status(400).json({ ok: false, reason: 'no_items' });
        return;
    }

    const db = admin.database();
    const stripCtl = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, '').slice(0, max);
    const safeKey = (k) => String(k == null ? '' : k).replace(/[.#$\[\]\/]/g, '_').slice(0, 120);

    const logSnap = await db.ref('news_import_log').once('value');
    const log = logSnap.val() || {};

    const updates = {};
    const results = [];
    for (const raw of items) {
        const emailKey = safeKey(raw && raw.emailKey);
        const type = (raw && raw.type === 'club') ? 'club' : 'school';
        if (!emailKey) { results.push({ emailKey: '', status: 'bad_key' }); continue; }
        if (log[emailKey]) { results.push({ emailKey, status: 'duplicate' }); continue; }
        const title = stripCtl(raw.title, 200);
        const desc = stripCtl(raw.desc, 2000);
        if (!title) { results.push({ emailKey, status: 'no_title' }); continue; }
        const ts = Number(raw.timestamp);
        const timestamp = (Number.isFinite(ts) && ts > 0 && ts < 4102444800000) ? ts : Date.now();
        const newRef = db.ref(`news/${type}`).push();
        updates[`news/${type}/${newRef.key}`] = {
            title: title,
            desc: desc,
            image: null,
            authorId: 'email-bot',
            authorName: stripCtl(raw.author, 80) || 'CHS Announcements',
            timestamp: timestamp,
            type: type,
            source: 'email-bot',
            emailKey: emailKey
        };
        updates[`news_import_log/${emailKey}`] = { ref: newRef.key, tab: type, at: admin.database.ServerValue.TIMESTAMP };
        results.push({ emailKey, status: 'published', id: newRef.key });
    }

    if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
    }
    const published = results.filter(r => r.status === 'published').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    console.log(`[ImportAnnouncements] published=${published} duplicates=${duplicates} rejected=${results.length - published - duplicates}`);
    res.json({ ok: true, published: published, duplicates: duplicates, results: results });
});
