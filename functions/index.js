const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const axios = require("axios");

// We use defineSecret or an environment variable for the API key.
// The user will need to set this using:
// firebase functions:secrets:set OPENAI_API_KEY
exports.checkModeration = onCall({
    // You can restrict regions here if needed, e.g., region: "us-central1"
    cors: true, // Enable CORS if calling from a different domain
}, async (request) => {
    // request.auth contains the user's auth information
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const text = request.data.text;

// Secure Moderation Function (Firebase Cloud Function)
exports.checkModeration = functions.runWith({
    secrets: ["OPENAI_API_KEY"]
}).https.onCall(async (data, context) => {
    // 1. Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const text = data.text;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!text) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "text" argument.');
    }

    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key is not configured on the server.');
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/moderations',
            { input: text },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const results = response.data.results[0];
        const scores = results.category_scores;

        // Use a 0.5 threshold for all categories
        let isFlagged = results.flagged;
        const threshold = 0.5;

        for (const key in scores) {
            if (scores[key] > threshold) {
                isFlagged = true;
                break;
            }
        }

        return {
            flagged: isFlagged,
            categories: results.categories,
            category_scores: scores
        };

    } catch (error) {
        console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
        throw new functions.https.HttpsError('internal', 'Error calling OpenAI Moderation API.');
    }
});
