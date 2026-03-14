import * as actions from "./actionTypes";
import { setCurrentStepContent, updateStepTitle } from "./tutorialsActions";

// ── Request suggestions ───────────────────────────────────────────────────────

/**
 * Calls the Cloud Function `generateTutorialSuggestions` which sends the
 * current step to Gemini 1.5 Flash and returns structured suggestions.
 *
 * @param {object} payload
 *   tutorialTitle  - The tutorial's main title
 *   stepTitle      - Current step's title
 *   stepContent    - Current step's HTML content
 *   tutorial_id    - Firestore tutorial document ID
 *   step_id        - Firestore step document ID
 */
export const requestAiSuggestions =
  payload => async (firebase, _firestore, dispatch) => {
    dispatch({ type: actions.AI_SUGGESTIONS_REQUEST });
    try {
      const generateSuggestions = firebase
        .functions()
        .httpsCallable("generateTutorialSuggestions");

      const result = await generateSuggestions(payload);
      const { suggestions, suggestion_session_id } = result.data;

      dispatch({
        type: actions.AI_SUGGESTIONS_SUCCESS,
        payload: {
          suggestions,
          suggestion_session_id,
          tutorial_id: payload.tutorial_id,
          step_id: payload.step_id
        }
      });
    } catch (e) {
      dispatch({
        type: actions.AI_SUGGESTIONS_FAIL,
        payload: e.message || "Failed to get AI suggestions."
      });
    }
  };

// ── Accept a suggestion ───────────────────────────────────────────────────────

/**
 * Accepts a suggestion:
 *  - "title"      → calls updateStepTitle with the suggested text
 *  - "content" | "code" | "formatting" → appends suggestion HTML to the
 *    current step content via setCurrentStepContent
 *
 * Also records the accept event to Firestore via recordSuggestionResult.
 */
export const acceptAiSuggestion =
  (suggestion, currentContent, owner, tutorial_id, step_id, suggestion_session_id) =>
  async (firebase, firestore, dispatch) => {
    dispatch({
      type: actions.AI_SUGGESTION_ACCEPT,
      payload: suggestion.id
    });

    try {
      if (suggestion.type === "title") {
        await updateStepTitle(
          owner,
          tutorial_id,
          step_id,
          suggestion.suggestion
        )(firebase, firestore, dispatch);
      } else {
        // Append the suggestion HTML below existing content
        const updated = (currentContent || "") + "\n" + suggestion.suggestion;
        await setCurrentStepContent(
          tutorial_id,
          step_id,
          updated
        )(firestore, dispatch);
      }

      // Record in Firestore (best-effort — don't block UX on failure)
      if (suggestion_session_id) {
        const recordResult = firebase
          .functions()
          .httpsCallable("recordSuggestionResult");
        recordResult({
          suggestion_session_id,
          suggestion_id: suggestion.id,
          action: "accept"
        }).catch(err => console.warn("recordSuggestionResult failed:", err));
      }
    } catch (e) {
      console.error("Failed to apply accepted suggestion:", e.message);
    }
  };

// ── Reject a suggestion ───────────────────────────────────────────────────────

/**
 * Marks a suggestion as rejected in Redux state and records it in Firestore.
 */
export const rejectAiSuggestion =
  (suggestion_id, suggestion_session_id) =>
  async (firebase, _firestore, dispatch) => {
    dispatch({
      type: actions.AI_SUGGESTION_REJECT,
      payload: suggestion_id
    });

    if (suggestion_session_id) {
      const recordResult = firebase
        .functions()
        .httpsCallable("recordSuggestionResult");
      recordResult({
        suggestion_session_id,
        suggestion_id,
        action: "reject"
      }).catch(err => console.warn("recordSuggestionResult failed:", err));
    }
  };

// ── Clear suggestions ─────────────────────────────────────────────────────────

export const clearAiSuggestions = () => dispatch =>
  dispatch({ type: actions.AI_SUGGESTIONS_CLEAR });
