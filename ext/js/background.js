// background.js — Clean user gesture-safe sidebar open

let trackedTabId = null;
let trackedTitle = null;

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id || !tab.title) return;

  trackedTabId = tab.id;
  trackedTitle = tab.title;

  // Everything inside the user gesture context
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: "sidebar.html",
    enabled: true
  }, () => {
    chrome.sidePanel.open({ tabId: tab.id });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["js/content.js"]
    }, () => {
      chrome.tabs.sendMessage(tab.id, { type: "leedz_open_sidebar" });
    });
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (tabId === trackedTabId) {
    chrome.sidePanel.setOptions({ tabId, path: "sidebar.html", enabled: true });
    // Do not call sidePanel.open() here — outside gesture context
  } else {
    chrome.sidePanel.setOptions({ tabId, enabled: false });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === trackedTabId) {
    trackedTabId = null;
    trackedTitle = null;
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "get_tracked_title") {
    sendResponse(trackedTitle);
    return; // Done
  }

  if (msg.type === "leedz_request_dom") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse(null);
        return;
      }

      chrome.tabs.sendMessage(tabId, { type: "leedz_request_dom" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse(null); // still resolve channel
        } else {
          sendResponse(response);
        }
      });
    });
    return true; // Keep channel open
  }

  if (msg.type === "leedz_selection") {
    chrome.runtime.sendMessage({
      type: "leedz_update_selection",
      selection: msg.selection
    });
  }
});
