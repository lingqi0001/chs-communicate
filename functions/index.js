const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.database.ref('/messages/{chatId}/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.val();
        if (!message) return null;

        const chatId = context.params.chatId;
        const senderId = message.senderId;
        const senderName = message.senderName || 'New Message';
        const text = message.text || '';
        const msgType = message.type || 'text';

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
        }

        if (recipients.length === 0) return null;

        // Send to each recipient's registered FCM tokens
        const sendPromises = recipients.map(async (uid) => {
            const tokensSnap = await admin.database().ref(`users/${uid}/fcm_tokens`).once('value');
            const tokensData = tokensSnap.val();
            if (!tokensData) return;

            const tokens = Object.keys(tokensData);
            if (tokens.length === 0) return;

            const payload = {
                notification: {
                    title: senderName,
                    body: notificationBody,
                },
                data: {
                    chatId: chatId,
                    senderId: senderId,
                }
            };

            // Send to tokens
            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokens,
                notification: payload.notification,
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

            // Clean up invalid tokens
            const tokensToRemove = [];
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const error = res.error;
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
            }
        });

        await Promise.all(sendPromises);
        return null;
    });
