// highlight.js
// Shared DOM highlighter + validator
import {

  LINKEDIN_REGEX,
  X_REGEX
} from "./parser.js"; // import from centralized regex source


const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;



const MATCH_ALL = /^.+$/;

// Validators by field
const VALIDATORS = {
  name: MATCH_ALL,
  phone: PHONE_REGEX,
  email: EMAIL_REGEX,
  linkedin: LINKEDIN_REGEX,
  on_x: X_REGEX,
  location: MATCH_ALL,
  notes: MATCH_ALL
};

function normalizePhone(text) {
  const digits = text.replace(/\D/g, "");
  return digits.length === 10 ? digits : text;
}

export function processHighlight(text, field) {
  const validator = VALIDATORS[field];
  const input = document.getElementById(field);
  if (!input) return;

  let cleanText = text;

  // Normalize phone number before validation
  if (field === "phone") {
    cleanText = normalizePhone(text);
  }

  const isValid = validator && validator.test(cleanText);

  if (isValid) {
    input.value = cleanText;
    input.classList.remove("invalid");
    input.classList.add("leedz-highlighted");
    setTimeout(() => input.classList.remove("leedz-highlighted"), 1200);
    console.log(`[Highlight] Inserted into ${field}:`, cleanText);

    // Apply visual highlight to DOM
    try {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.className = "leedz-highlighted";
        range.surroundContents(span);
        selection.removeAllRanges();
      }
    } catch (e) {
      console.warn("[Highlight] Could not apply span highlight:", e);
    }
  } else {
    input.classList.add("invalid");
    console.warn(`[Highlight] Invalid input for ${field}:`, cleanText);
  }
}

export function clearHighlightErrors() {
  document.querySelectorAll("input.invalid").forEach(el => {
    el.classList.remove("invalid");
  });
}
