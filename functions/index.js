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
    if (!text) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "text" argument.');
    }

    // Accessing the secret
    // Note: The user must deploy with --set-secrets OPENAI_API_KEY=YOUR_KEY
    // Or set it in the Firebase Console.
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        logger.error("OpenAI API key is not set. Use 'firebase functions:secrets:set OPENAI_API_KEY' and deploy.");
        // Return false (don't block) if service is misconfigured, or throw error.
        // Let's return a safe response to not break the app.
        return { flagged: false, error: "Moderation service misconfigured" };
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/moderations",
            { input: text },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
            }
        );

        const result = response.data.results[0];
        
        // Custom threshold check as requested by user (0.5)
        const THRESHOLD = 0.5;
        let customFlagged = result.flagged;
        
        const categoryScores = result.category_scores;
        for (const category in categoryScores) {
            if (categoryScores[category] > THRESHOLD) {
                customFlagged = true;
                break;
            }
        }

        return {
            flagged: customFlagged,
            categories: result.categories,
            category_scores: result.category_scores
        };
    } catch (error) {
        logger.error("OpenAI Moderation API error:", error.response ? error.response.data : error.message);
        // Fallback: don't block if API is down, or return error.
        return { flagged: false, error: "Moderation check failed" };
    }
});
