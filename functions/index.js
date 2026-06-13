const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

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
            // Direct chat (e.g., alice_bob)
            const parts = chatId.split('_');
            const otherUser = parts.find(p => p !== senderId);
            if (otherUser) {
                recipients.push(otherUser);
            }
            console.log(`Direct chat detected. Recipient: ${otherUser}`);
        }

        console.log(`Resolved recipients: ${JSON.stringify(recipients)}`);

        if (recipients.length === 0) {
            console.log('No recipients found to send notifications to.');
            return null;
        }

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
