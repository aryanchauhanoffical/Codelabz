import * as actions from "../actions/actionTypes";

/**
 * Redux state shape for AI suggestions:
 *
 * {
 *   loading: boolean,
 *   error: string | null,
 *   suggestions: Array<{
 *     id: string,
 *     type: "title" | "content" | "code" | "formatting",
 *     suggestion: string,
 *     explanation: string
 *   }>,
 *   accepted_ids: string[],
 *   rejected_ids: string[],
 *   suggestion_session_id: string | null,
 *   tutorial_id: string | null,
 *   step_id: string | null
 * }
 */
const initialState = {
  loading: false,
  error: null,
  suggestions: [],
  accepted_ids: [],
  rejected_ids: [],
  suggestion_session_id: null,
  tutorial_id: null,
  step_id: null
};

const aiReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case actions.AI_SUGGESTIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        // Clear previous session's suggestions when a new request starts
        suggestions: [],
        accepted_ids: [],
        rejected_ids: [],
        suggestion_session_id: null
      };

    case actions.AI_SUGGESTIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        suggestions: payload.suggestions,
        suggestion_session_id: payload.suggestion_session_id,
        tutorial_id: payload.tutorial_id,
        step_id: payload.step_id
      };

    case actions.AI_SUGGESTIONS_FAIL:
      return {
        ...state,
        loading: false,
        error: payload
      };

    case actions.AI_SUGGESTION_ACCEPT:
      return {
        ...state,
        accepted_ids: [...state.accepted_ids, payload],
        // Remove the accepted suggestion from the visible list
        suggestions: state.suggestions.filter(s => s.id !== payload)
      };

    case actions.AI_SUGGESTION_REJECT:
      return {
        ...state,
        rejected_ids: [...state.rejected_ids, payload],
        // Remove the rejected suggestion from the visible list
        suggestions: state.suggestions.filter(s => s.id !== payload)
      };

    case actions.AI_SUGGESTIONS_CLEAR:
      return initialState;

    default:
      return state;
  }
};

export default aiReducer;
