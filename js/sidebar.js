document.querySelectorAll('.input-arrow').forEach(arrow => {
  arrow.setAttribute('data-rotation', '0');
  arrow.addEventListener('click', () => {
    const currentRotation = parseInt(arrow.getAttribute('data-rotation')) || 0;
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

    if (response && response.type === "leedz_dom_data") {
      const { title, bodyText } = response;
      console.log("[LeedzEx] Page Title:", title);
      console.log("[LeedzEx] Page Body Sample:", bodyText);
      const notesField = document.getElementById("notes");
      if (notesField) {
        notesField.value = `Page title: ${title}\n\nSample:\n${bodyText}`;
      }
    }
  });
});
