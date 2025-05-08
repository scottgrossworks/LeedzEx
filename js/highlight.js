// highlight.js
// Shared Leedz DOM text highlighter + validator

const REDACTED_TXT = '**********';
const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;
const MATCH_ALL = /^.+$/;

const VALIDATORS = {
  phone: PHONE_REGEX,
  email: EMAIL_REGEX,
  name: MATCH_ALL,
  date: MATCH_ALL,
  time: MATCH_ALL,
  location: MATCH_ALL,
  notes: MATCH_ALL
};

export function processHighlight(text, field) {
  const validator = VALIDATORS[field];
  const input = document.getElementById(field);
  const isValid = validator && validator.test(text);

  if (!input) return;

  if (isValid) {
    input.value = text;
    input.classList.remove("invalid");
    input.classList.add("leedz-highlighted");
    setTimeout(() => input.classList.remove("leedz-highlighted"), 1200);
    console.log(`[Highlight] Inserted into ${field}:`, text);

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
    console.warn(`[Highlight] Invalid input for ${field}:`, text);
  }
}

export function clearHighlightErrors() {
  document.querySelectorAll("input.invalid").forEach(el => {
    el.classList.remove("invalid");
  });
}
