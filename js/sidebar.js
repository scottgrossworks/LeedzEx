
//
// Sidebar script for LeedzEx extension
// This script runs in the context of the sidebar page and interacts with the background script
// to fetch the DOM of the current tab and display it in the sidebar.
//

import { extractAndRedact, pruneShortLines } from "./parser.js";


const EMAIL_ARRAY = [];
const PHONE_ARRAY = [];




function updateInputWithArrayValue(inputId, array, index = 0) {
  const input = document.getElementById(inputId);
  if (array && array.length > 0) {
    input.value = array[index % array.length];
  }
}



// Set up click handlers for arrows after data is loaded
document.querySelectorAll('.input-arrow').forEach(arrow => {
  const wrapper = arrow.closest('.input-wrapper');
  const input = wrapper.querySelector('input');
  const arrayToUse = input.id === 'phone' ? PHONE_ARRAY : EMAIL_ARRAY;
  let currentIndex = 0;

  arrow.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % arrayToUse.length;
    updateInputWithArrayValue(input.id, arrayToUse, currentIndex);
    
    // Handle rotation
    const currentRotation = parseInt(arrow.getAttribute('data-rotation') || 0);
    const newRotation = currentRotation + 90;
    arrow.setAttribute('data-rotation', newRotation);
    arrow.style.transform = `rotate(${newRotation}deg)`;
  });
});








window.addEventListener("DOMContentLoaded", () => {
  console.log("[LeedzEx] Sidebar loaded.");

  // Ask background script to fetch DOM via content script
  chrome.runtime.sendMessage({ type: "leedz_request_dom" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[LeedzEx] Send error:", chrome.runtime.lastError.message);
      return;
    }

    // console.log("[LeedzEx] Received response:", response);

    // from content.js
    if (response && response.type === "leedz_dom_data") {
      const { title, bodyText } = response;
      console.log("[LeedzEx] Page Title:", title);

      // send bodyText to parser
      const pruned = pruneShortLines(bodyText, 5);

      const blob = extractAndRedact(pruned, EMAIL_ARRAY, PHONE_ARRAY);

      //console.log("[LeedzEx] Extracted Emails:", EMAIL_ARRAY);
      //console.log("[LeedzEx] Extracted Phones:", PHONE_ARRAY);
      //console.log("[LeedzEx] Redacted Blob:", blob);

      // Initialize inputs with first values from arrays
      updateInputWithArrayValue('email', EMAIL_ARRAY);
      updateInputWithArrayValue('phone', PHONE_ARRAY);
      console.log("[LeedzEx] Sidebar updated with extracted data");

    } else {
      console.error("[LeedzEx] Unexpected response:", response);
    }
  });
});
