// sidebar.js — LeedzEx Sidebar Control Logic
//
// Handles:
// - DOM parsing on load
// - Manual query via Find button
// - Save button logic
// - Visibility toggling
// - Input highlighting and selector behavior
// - Footer status logging



import {
  extractMatches,
  pruneShortLines,
  EMAIL_REGEX,
  PHONE_REGEX,
  LINKEDIN_REGEX,
  X_REGEX
} from "./parser.js";

import { processHighlight } from "./highlight.js";
import { findExistingMark, submitMark } from "./http_utils.js";

const hiddenIconPath = 'icons/hidden.svg';
const visibleIconPath = 'icons/visible.svg';

const STATE = {
  id: null,
  name: null,
  title: null,
  org: null,
  lists: {
    email: [],
    phone: [],
    location: []
  },
  linkedin: null,
  on_x: null,
  outreachCount: 0,
  createdAt: null,
  lastContact: null,
  notes: null,
  activeField: null,
  lastSelection: "",
  domElements: {
    inputs: null,
    arrows: null
  }
};

function populateFromMark(mark) {
  if (!mark) return;
  for (let key in mark) {
    const input = document.getElementById(key);
    if (input) input.value = mark[key];
  }
}

function updateInputWithArrayValue(inputId, array, index = 0) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (array && array.length > 0) {
    input.value = array[index % array.length];
    const arrow = input.parentElement?.querySelector('.input-arrow');
    if (arrow) {
      arrow.style.opacity = (array.length > 1) ? '0.4' : '0';
    }
  }
}

function parseAndPopulateFields(bodyText) {
  const pruned = pruneShortLines(bodyText, 5);
  STATE.lists.email = extractMatches(pruned, EMAIL_REGEX, 'email');
  STATE.lists.phone = extractMatches(pruned, PHONE_REGEX, 'phone');
  STATE.lists.location = extractMatches(pruned, /[A-Z][a-z]+(?:,? [A-Z]{2})?/, 'location');

  updateInputWithArrayValue('email', STATE.lists.email);
  updateInputWithArrayValue('phone', STATE.lists.phone);
  updateInputWithArrayValue('location', STATE.lists.location);
}

function setupVisibilityToggles() {
  const fields = ['email', 'phone', 'location', 'linkedin', 'on_x', 'notes'];
  fields.forEach(field => {
    const icon = document.getElementById(`vis-${field}`);
    if (!icon) return;

    icon.setAttribute('isHidden', 'false');
    icon.innerHTML = `<img src="${visibleIconPath}" width="16"/>`;

    icon.onclick = () => {
      const hidden = icon.getAttribute('isHidden') === 'true';
      icon.setAttribute('isHidden', hidden ? 'false' : 'true');
      icon.innerHTML = `<img src="${hidden ? visibleIconPath : hiddenIconPath}" width="16"/>`;
    };
  });
}

function isVisible(fieldId) {
  const visIcon = document.getElementById(`vis-${fieldId}`);
  return visIcon?.getAttribute('isHidden') !== 'true';
}

function saveButton() {
  const mark = {};
  ["name", "email", "phone", "title", "org", "location", "linkedin", "on_x", "notes"].forEach(field => {
    if (isVisible(field)) {
      mark[field] = document.getElementById(field)?.value || "";
    }
  });

  mark.createdAt = new Date().toISOString();
  mark.lastContact = new Date().toISOString();
  mark.outreachCount = 0;

  submitMark(mark)
    .then(data => console.log("Saved successfully"))
    .catch(err => console.log("Error: " + err.message));
}

function findButton() {
  const name = document.getElementById('name')?.value;
  const email = document.getElementById('email')?.value;
  const phone = document.getElementById('phone')?.value;

  findExistingMark({ name, email, phone })
    .then(mark => {
      if (!mark) {
        console.log("No match found");
      } else {
        console.log("Match found");
        populateFromMark(mark);
      }
    })
    .catch(err => console.log("Query failed: " + err.message));
}

function setupSidebarSelectionHandler() {
  const inputs = document.querySelectorAll('.sidebar-input');
  inputs.forEach(input => {
    input.addEventListener("click", () => {
      STATE.activeField = input.id;
      if (STATE.lastSelection && !input.value) {
        processHighlight(STATE.lastSelection, input.id);
        STATE.lastSelection = "";
      }
    });
  });
}

function setupArrowHandlers() {
  document.querySelectorAll('.input-arrow').forEach(arrow => {
    let currentIndex = 0;
    const input = arrow.closest('.input-wrapper')?.querySelector('input');
    if (!input) return;

    arrow.addEventListener('click', () => {
      const list = STATE.lists[input.id];
      if (!list || list.length <= 1) return;

      currentIndex = (currentIndex + 1) % list.length;
      updateInputWithArrayValue(input.id, list, currentIndex);
      const rotation = ((parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360);
      arrow.setAttribute('data-rotation', rotation);
      arrow.style.transform = `rotate(${rotation}deg)`;
    });
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "leedz_update_selection") {
    if (STATE.activeField) {
      processHighlight(msg.selection, STATE.activeField);
    } else {
      STATE.lastSelection = msg.selection;
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  document.body.style.cursor = 'wait';

  setupVisibilityToggles();
  setupSidebarSelectionHandler();
  setupArrowHandlers();

  chrome.runtime.sendMessage({ type: "leedz_request_dom" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("DOM request failed: " + chrome.runtime.lastError.message);
      document.body.style.cursor = 'default';
      return;
    }

    if (response?.bodyText) {
      parseAndPopulateFields(response.bodyText);
    }

    document.body.style.cursor = 'default';
  });

  document.getElementById("saveBtn")?.addEventListener("click", saveButton);
  document.getElementById("findBtn")?.addEventListener("click", findButton);
});

(function patchConsoleLogForFooter() {
  const logDiv = document.getElementById("debug-output");
  if (!logDiv) {
    console.warn("debug-output footer not found");
    return;
  }

  const originalLog = console.log;
  console.log = function (...args) {
    originalLog.apply(console, args);

    const line = args.map(a => {
      try {
        return typeof a === "object" ? JSON.stringify(a) : String(a);
      } catch {
        return "[unserializable]";
      }
    }).join(" ");

    const entry = document.createElement("div");
    entry.textContent = line;
    entry.style.color = "#eee";
    entry.style.fontFamily = "monospace";
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
  };
})();
