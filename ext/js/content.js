// js/content.js

const MAX_CHARS = 3000;
let ACTIVE = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leedz_open_sidebar") {
    ACTIVE = true;
    return true;
  }

  if (message.type === "leedz_close_sidebar") {
    ACTIVE = false;
    return true;
  }

  if (message.type === "leedz_request_dom") {
    const responseData = {
      type: "leedz_dom_data",
      title: document.title || "",
      bodyText: (document.body.innerText || "").slice(0, MAX_CHARS)
    };
    sendResponse(responseData);
    return true;
  }

  return false;
});

document.addEventListener("mouseup", () => {
  if (!ACTIVE) return;

  const selection = window.getSelection().toString().trim();
  if (!selection || selection.length < 4) return;

  chrome.runtime.sendMessage({ type: "leedz_check_active_field" }, (response) => {
    if (chrome.runtime.lastError) return;
    if (!response?.activeField) return;

    chrome.runtime.sendMessage({
      type: "leedz_update_selection",
      selection: selection
    });

    try {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const span = document.createElement("span");
        span.className = "leedz-highlighted";
        range.surroundContents(span);
      }
    } catch (e) {
      console.warn("[LeedzEx] Could not apply highlight:", e);
    }
  });
});
