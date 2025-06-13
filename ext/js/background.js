// background.js — Clean user gesture-safe sidebar open

let trackedTabId = null;
let trackedTitle = null;
let sidebarReady = false;

// Override console methods to send logs to sidebar
const originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  if (sidebarReady) {
    try {
      chrome.runtime.sendMessage({
        type: "leedz_log",
        args: args
      }).catch(() => {
        // Silently ignore errors
        sidebarReady = false;
      });
    } catch (e) {
      // Silently ignore errors
      sidebarReady = false;
    }
  }
};

const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  if (sidebarReady) {
    try {
      chrome.runtime.sendMessage({
        type: "leedz_error",
        args: args
      }).catch(() => {
        // Silently ignore errors
        sidebarReady = false;
      });
    } catch (e) {
      // Silently ignore errors
      sidebarReady = false;
    }
  }
};

// Only send messages to the tracked tab where we opened the sidebar
function safelyMessageTab(tabId, message) {
  // Only send messages to our tracked tab where we know content script is loaded
  if (tabId !== trackedTabId) return;
  
  // Check if tab exists before sending message
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.log(`Tab ${tabId} doesn't exist, can't send message`);
      return;
    }
    
    // Tab exists, try to send message
    chrome.tabs.sendMessage(tabId, message, () => {
      // Ignore any errors - this prevents the uncaught error in console
      if (chrome.runtime.lastError) {
        console.log(`Message to tab ${tabId} failed silently: ${chrome.runtime.lastError.message}`);
      }
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id || !tab.title) return;

  trackedTabId = tab.id;
  trackedTitle = tab.title;
  
  console.log(`Extension clicked on tab ${tab.id}: "${tab.title}"`);

  // Open sidebar in user gesture context
  chrome.sidePanel.open({ tabId: tab.id });
  console.log(`Sidebar opened for tab ${tab.id}`);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  // Just track the active tab, don't enable/disable sidebar
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    console.log(`Tab activated: ${tabId}`);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === trackedTabId) {
    console.log(`Tracked tab ${tabId} was closed`);
    trackedTabId = null;
    trackedTitle = null;
    sidebarReady = false;
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "get_tracked_title") {
    sendResponse(trackedTitle);
    return true; // Keep the message channel open for the async response
  }

  if (msg.type === "leedz_check_active_field") {
    sendResponse({ activeField: null }); // Placeholder until sidebar state is managed
    return true; // Keep the message channel open for the async response
  }
  
  // Handle sidebar ready message
  if (msg.type === "sidebar_ready") {
    sidebarReady = true;
    console.log("Sidebar is ready to receive logs");
    sendResponse({ status: "acknowledged" });
    return true;
  }

  return false; // Explicitly return false for unhandled messages
});

console.log('LeedzEx background.js loaded.');