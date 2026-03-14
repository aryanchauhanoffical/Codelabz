/**
 * validations.ts
 *
 * Pure validation utilities used across sign-up, profile edit, and org
 * creation forms.  Every function returns a boolean (true = valid) and
 * updates React state via the provided setter callbacks.
 *
 * Migrated from validations.jsx — no runtime behaviour was changed.
 */

import validator from "validator";

// ── Shared setter types ──────────────────────────────────────────────────────
// These match the dispatch signature of React.useState setters so callers
// can pass `setFoo` directly without any adapter.

/** A setter that receives a boolean flag (e.g. `setHasError`). */
type SetBoolean = (value: boolean) => void;

/** A setter that receives a string message (e.g. `setErrorMessage`). */
type SetString = (value: string) => void;

// ── Curried thunk types (authActions pattern) ────────────────────────────────
// `checkUserHandleExists` follows the Redux-thunk-extra-argument pattern:
//   (handle) => (firebase) => Promise<boolean>
// The firebase instance shape is opaque to this module — it is owned by
// authActions.js — so `unknown` is used as the most honest safe type here.

/** Curried async check: returns true if the handle is already taken. */
type CheckUserHandleExistsFn = (
  handle: string
) => (firebase: unknown) => Promise<boolean>;

// ── Exported validators ──────────────────────────────────────────────────────

/**
 * Validates a human-readable name (display name, first name, etc.).
 *
 * Rules:
 * - Must not be empty
 * - Must only contain letters and spaces, starting with a letter
 *
 * @returns `true` if the name is valid; `false` after setting error state.
 */
export const validateName = (
  name: string,
  setNameValidateError: SetBoolean,
  setNameValidateErrorMessage: SetString,
  emptyMsg: string,
  realNameMsg: string
): boolean => {
  if (validator.isEmpty(name)) {
    setNameValidateError(true);
    setNameValidateErrorMessage(emptyMsg);
    return false;
  } else if (!name.match(/^[a-zA-Z][a-zA-Z\s]*$/)) {
    setNameValidateError(true);
    setNameValidateErrorMessage(realNameMsg);
    return false;
  } else {
    setNameValidateError(false);
    setNameValidateErrorMessage("");
    return true;
  }
};

/**
 * Validates a user handle (username), including an async uniqueness check.
 *
 * Rules:
 * - Must not be empty
 * - Must be alphanumeric and lowercase only
 * - Must be at least 6 characters long
 * - Must not already be taken in Firebase
 *
 * @returns `Promise<true>` if valid; `Promise<false>` after setting error state.
 */
export const validateHandle = async (
  checkUserHandleExists: CheckUserHandleExistsFn,
  firebase: unknown,
  handle: string,
  setHandleValidateError: SetBoolean,
  setHandleValidateErrorMessage: SetString,
  emptyMsg: string,
  lowercaseMsg: string,
  lengthMsg: string,
  takenMsg: string
): Promise<boolean> => {
  const handleExists = await checkUserHandleExists(handle)(firebase);

  if (validator.isEmpty(handle)) {
    setHandleValidateError(true);
    setHandleValidateErrorMessage(emptyMsg);
    return false;
  } else if (
    !validator.isAlphanumeric(handle) ||
    !validator.isLowercase(handle)
  ) {
    setHandleValidateError(true);
    setHandleValidateErrorMessage(lowercaseMsg);
    return false;
  } else if (handle.length < 6) {
    setHandleValidateError(true);
    setHandleValidateErrorMessage(lengthMsg);
    return false;
  } else if (handleExists) {
    setHandleValidateError(true);
    setHandleValidateErrorMessage(takenMsg);
    return false;
  } else {
    setHandleValidateError(false);
    setHandleValidateErrorMessage("");
    return true;
  }
};

/**
 * Validates that a country selection has been made.
 *
 * @returns `true` if a non-empty country value is present.
 */
export const validateCountry = (
  country: string,
  setCountryValidateError: SetBoolean
): boolean => {
  if (validator.isEmpty(country)) {
    setCountryValidateError(true);
    return false;
  } else {
    setCountryValidateError(false);
    return true;
  }
};

/**
 * Validates an organisation website URL.
 *
 * Rules:
 * - Must not be empty
 * - Must be a syntactically valid URL
 * - Must include an explicit `https://` or `http://` protocol
 *
 * @returns `true` if the URL is valid.
 */
export const validateOrgWebsite = (
  orgWebsite: string,
  setOrgWebsiteValidateError: SetBoolean,
  setOrgWebsiteValidateErrorMessage: SetString
): boolean => {
  if (validator.isEmpty(orgWebsite)) {
    setOrgWebsiteValidateError(true);
    setOrgWebsiteValidateErrorMessage("Please enter a website");
    return false;
  } else if (!validator.isURL(orgWebsite)) {
    setOrgWebsiteValidateError(true);
    setOrgWebsiteValidateErrorMessage("Please provide a valid URL");
    return false;
  } else if (
    !(orgWebsite.includes("https://") || orgWebsite.includes("http://"))
  ) {
    setOrgWebsiteValidateError(true);
    setOrgWebsiteValidateErrorMessage(
      "URL must contain the protocol (https:// or http://)"
    );
    return false;
  } else {
    setOrgWebsiteValidateError(false);
    setOrgWebsiteValidateErrorMessage("");
    return true;
  }
};

/**
 * Generic non-empty string validator, reusable for any required text field
 * (e.g. organisation name, tutorial title).
 *
 * @returns `true` if the string is non-empty.
 */
export const validateIsEmpty = (
  string: string,
  setStringValidateError: SetBoolean,
  setStringValidateErrorMessage: SetString,
  emptyMsg: string
): boolean => {
  if (validator.isEmpty(string)) {
    setStringValidateError(true);
    setStringValidateErrorMessage(emptyMsg);
    return false;
  } else {
    setStringValidateError(false);
    setStringValidateErrorMessage("");
    return true;
  }
};
