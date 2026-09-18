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

exports.fetchGoogleDocComments = functions.https.onCall(async (data, context) => {
    const docUrl = data.url;
    const fileId = extractGoogleDocId(docUrl);
    if (!fileId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid Google Doc URL');
    }

    try {
        let auth;
        const keyPath = path.join(__dirname, 'service-account.json');
        try {
            auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/drive.readonly']
            });
        } catch (e) {
            auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/drive.readonly']
            });
        }

        const drive = google.drive({ version: 'v3', auth });

        // Fetch document metadata including createdTime and modifiedTime
        const fileInfo = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, createdTime, modifiedTime'
        });

        // Fetch comments list
        const res = await drive.comments.list({
            fileId: fileId,
            includeDeleted: false,
            fields: 'comments(id,author(displayName),content,createdTime,resolved,quotedFileContent(value),replies(id,author(displayName),content,createdTime))',
            pageSize: 100
        });

        const comments = res.data.comments || [];
        const docData = {
            title: fileInfo.data.name || 'Untitled Document',
            fileId: fileId,
            docUrl: docUrl,
            commentsCount: comments.length,
            comments: comments,
            createdTime: fileInfo.data.createdTime || null,
            modifiedTime: fileInfo.data.modifiedTime || null,
            lastSyncedAt: Date.now()
        };

        // If chatId is provided, update all messages with this docUrl in Realtime Database directly
        const chatId = data.chatId;
        const messageKey = data.messageKey;
        if (chatId) {
            try {
                if (messageKey) {
                    await admin.database().ref(`messages/${chatId}/${messageKey}/docData`).set(docData);
                }
                // Also find any other messages in this chat with the same doc link/docId and sync them
                const chatMsgsSnap = await admin.database().ref(`messages/${chatId}`).once('value');
                const allMsgs = chatMsgsSnap.val() || {};
                const updates = {};
                for (const [mKey, mVal] of Object.entries(allMsgs)) {
                    if (mVal && mVal.text && mVal.text.includes(fileId)) {
                        updates[`messages/${chatId}/${mKey}/docData`] = docData;
                    }
                }
                if (Object.keys(updates).length > 0) {
                    await admin.database().ref().update(updates);
                    console.log(`[GoogleDoc] Successfully synced docData to ${Object.keys(updates).length} messages in ${chatId}`);
                }
            } catch (dbErr) {
                console.warn(`[GoogleDoc] Failed to update docData in DB for ${chatId}:`, dbErr.message);
            }
        }

        return {
            success: true,
            title: docData.title,
            fileId: docData.fileId,
            docUrl: docData.docUrl,
            commentsCount: docData.commentsCount,
            comments: docData.comments,
            createdTime: docData.createdTime,
            modifiedTime: docData.modifiedTime,
            lastSyncedAt: docData.lastSyncedAt
        };
    } catch (err) {
        console.error('Failed to fetch doc comments:', err);
        const errorText = String(err.message || 'Unable to access this document');
        const accessLost = [401, 403, 404].includes(Number(err.code)) || /access|permission|forbidden|not found/i.test(errorText);

        // Keep the last successful snapshot intact when sharing permission is later removed.
        if (accessLost && data.chatId) {
            try {
                const messages = (await admin.database().ref(`messages/${data.chatId}`).once('value')).val() || {};
                const updates = {};
                for (const [messageKey, message] of Object.entries(messages)) {
                    if (message?.text && message.text.includes(fileId)) {
                        updates[`messages/${data.chatId}/${messageKey}/docData`] = {
                            ...(message.docData || { fileId, docUrl }),
                            fileId,
                            docUrl,
                            accessLost: true,
                            lastSyncError: errorText,
                            lastSyncAttemptAt: Date.now()
                        };
                    }
                }
                if (Object.keys(updates).length) await admin.database().ref().update(updates);
            } catch (stateErr) {
                console.warn('[GoogleDoc] Failed to preserve access-loss state:', stateErr.message);
            }
        }
        return {
            success: false,
            error: errorText,
            accessLost,
            fileId: fileId,
            docUrl: docUrl
        };
    }
});
