/**
 * aiSuggestions.js
 *
 * Firebase Cloud Function — AI Tutorial Suggestion Generator
 *
 * Called by the frontend via firebase.functions().httpsCallable("generateTutorialSuggestions")
 *
 * Required environment variable (set via Firebase Functions config or .env):
 *   GEMINI_API_KEY=<your Gemini API key from https://aistudio.google.com>
 *
 * Setup:
 *   firebase functions:config:set gemini.api_key="YOUR_KEY"
 *   OR add GEMINI_API_KEY to your functions/.env file
 */

const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../auth");

// ── Prompt builder ────────────────────────────────────────────────────────────

const buildPrompt = (tutorialTitle, stepTitle, stepContent) => `
You are an expert coding tutorial writing assistant.
Analyze the tutorial step below and return ONLY a valid JSON object — no markdown fences, no extra text.

Tutorial: "${tutorialTitle}"
Step Title: "${stepTitle}"
Step Content (HTML): "${stepContent}"

Return exactly this JSON structure with 4 suggestions:
{
  "suggestions": [
    {
      "id": "1",
      "type": "title",
      "suggestion": "an improved step title",
      "explanation": "one sentence explaining the improvement"
    },
    {
      "id": "2",
      "type": "content",
      "suggestion": "<p>improved explanation in HTML</p>",
      "explanation": "one sentence explaining what was improved"
    },
    {
      "id": "3",
      "type": "code",
      "suggestion": "<pre><code>// relevant code example</code></pre>",
      "explanation": "one sentence describing what the code demonstrates"
    },
    {
      "id": "4",
      "type": "formatting",
      "suggestion": "<ul><li>Formatting tip one</li><li>Formatting tip two</li></ul>",
      "explanation": "one sentence explaining the formatting improvement"
    }
  ]
}

Rules:
- type "title": plain text only, no HTML tags
- type "content", "code", "formatting": valid HTML using only <p> <pre> <code> <ul> <ol> <li> <strong> <em> <br> tags
- suggestions must be directly relevant to the step's actual topic
- return ONLY the JSON object, nothing else
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip any markdown code fences that Gemini may wrap around JSON output
const extractJson = text => {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return stripped;
};

// ── Handler ───────────────────────────────────────────────────────────────────

exports.generateTutorialSuggestionsHandler = async (data, context) => {
  // 1. Auth guard — must be a signed-in user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to use AI suggestions."
    );
  }

  const { tutorialTitle, stepTitle, stepContent, tutorial_id, step_id } = data;

  // 2. Input validation
  if (!stepContent || typeof stepContent !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "stepContent is required."
    );
  }
  if (!tutorial_id || !step_id) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "tutorial_id and step_id are required."
    );
  }

  // 3. Gemini API key — set via Firebase Functions config or .env
  const apiKey =
    (functions.config().gemini && functions.config().gemini.api_key) ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "GEMINI_API_KEY is not configured. Set it with: firebase functions:config:set gemini.api_key=YOUR_KEY"
    );
  }

  // 4. Call Gemini 1.5 Flash
  let suggestions;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        // Enforce JSON-only output
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    const prompt = buildPrompt(
      tutorialTitle || "Untitled Tutorial",
      stepTitle || "Untitled Step",
      // Strip HTML tags for the prompt context (keep raw text readable)
      stepContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    );

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const jsonText = extractJson(rawText);
    const parsed = JSON.parse(jsonText);

    suggestions = parsed.suggestions;

    if (!Array.isArray(suggestions)) {
      throw new Error("Gemini returned unexpected response shape.");
    }
  } catch (e) {
    console.error("Gemini API error:", e.message);
    throw new functions.https.HttpsError(
      "internal",
      `AI service error: ${e.message}`
    );
  }

  // 5. Persist the suggestion session to Firestore so the user can
  //    later review what they accepted / rejected.
  try {
    const docRef = db.collection("ai_suggestions").doc();
    const suggestion_session_id = docRef.id;

    await docRef.set({
      suggestion_session_id,
      tutorial_id,
      step_id,
      uid: context.auth.uid,
      suggestions,
      accepted_ids: [],
      rejected_ids: [],
      createdAt: require("firebase-admin").firestore.FieldValue.serverTimestamp()
    });

    return { suggestions, suggestion_session_id };
  } catch (e) {
    console.error("Firestore write error:", e.message);
    // Return suggestions anyway — don't fail the UX over a DB write error
    return { suggestions, suggestion_session_id: null };
  }
};

// ── Accept / Reject recording ─────────────────────────────────────────────────

exports.recordSuggestionResultHandler = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in."
    );
  }

  const { suggestion_session_id, suggestion_id, action } = data;

  if (!suggestion_session_id || !suggestion_id || !["accept", "reject"].includes(action)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "suggestion_session_id, suggestion_id and action (accept|reject) are required."
    );
  }

  const admin = require("firebase-admin");
  const field = action === "accept" ? "accepted_ids" : "rejected_ids";

  await db
    .collection("ai_suggestions")
    .doc(suggestion_session_id)
    .update({
      [field]: admin.firestore.FieldValue.arrayUnion(suggestion_id)
    });

  return { ok: true };
};
