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
        const senderName = message.senderName || 'New Message';
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

exports.fetchGoogleDocComments = functions.runWith({ secrets: ['GOOGLE_SA_JSON'] }).https.onCall(async (data, context) => {
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
    const prevLiveCount = prevState && prevState.lastKnownCommentCount !== undefined
        ? Number(prevState.lastKnownCommentCount)
        : countLiveComments(prevSnapshot);
    const hasSnapshot = !!(prevState && prevState.lastSuccessfulSyncAt);

    const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
    let auth = null;
    // Preferred path: the whole service-account JSON injected via Secret Manager.
    // firebase deploy strips files matched by .gitignore (incl. *service-account*.json)
    // from the upload, so the keyFile fallback silently breaks on fresh deploys.
    if (process.env.GOOGLE_SA_JSON) {
        try {
            const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
            if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
            // Same code path as the proven-working keyFile flow, just in-memory.
            // (A raw google.auth.JWT client was observed sending requests Drive
            // rejects as "unregistered callers" — do not use it here.)
            auth = new google.auth.GoogleAuth({ credentials: sa, scopes: DRIVE_SCOPES });
        } catch (e) {
            console.warn('[GoogleDoc] GOOGLE_SA_JSON parse failed, falling back to keyFile:', e.message);
            auth = null;
        }
    }
    if (!auth) {
        const keyPath = path.join(__dirname, 'service-account.json');
        try {
            auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: DRIVE_SCOPES
            });
        } catch (e) {
            auth = new google.auth.GoogleAuth({
                scopes: DRIVE_SCOPES
            });
        }
    }
    const drive = google.drive({ version: 'v3', auth });

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

    // Lightweight, merge-safe display copy pushed onto each linked message.
    const docData = {
        fileId: fileId,
        docUrl: docUrl,
        title: nextState.title,
        webViewLink: nextState.webViewLink,
        createdTime: nextState.createdTime,
        modifiedTime: nextState.modifiedTime,
        commentsCount: lastKnownCommentCount,
        comments: snapshotComments,
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

    if (chatId) {
        try {
            const linkedKeys = new Set(Object.keys((nextState.linkedMessageKeys) || {}));
            if (messageKey) linkedKeys.add(messageKey);
            const chatMsgsSnap = await db.ref(`messages/${chatId}`).once('value');
            const allMsgs = chatMsgsSnap.val() || {};
            const updates = {};
            for (const [mKey, mVal] of Object.entries(allMsgs)) {
                if (mVal && mVal.text && mVal.text.includes(fileId)) {
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
                    updates[`messages/${chatId}/${mKey}/docData`] = merged;
                    linkedKeys.add(mKey);
                }
            }
            if (Object.keys(updates).length > 0) {
                await db.ref().update(updates);
                console.log(`[GoogleDoc] Synced merged docData to ${Object.keys(updates).length} messages in ${chatId} (${syncStatus})`);
            }
            if (stateRef && linkedKeys.size) {
                const lmk = {};
                linkedKeys.forEach(k => { lmk[k] = true; });
                await stateRef.child('linkedMessageKeys').set(lmk);
            }
        } catch (dbErr) {
            console.warn(`[GoogleDoc] Failed to update docData in DB for ${chatId}:`, dbErr.message);
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
        resultStatus: syncStatus
    });

    const isSyncedResult = syncStatus === 'synced' || syncStatus === 'no_comments_yet';
    return {
        success: isSyncedResult,
        error: isSyncedResult ? null : (nextState.lastSyncErrorMessage || syncStatus),
        ...docData
    };
});
