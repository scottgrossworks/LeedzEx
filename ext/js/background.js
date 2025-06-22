//
// 
// 
// 
// 


// Click the extension icon to toggle the sidebar
//
//
chrome.action.onClicked.addListener((tab) => {
  try {
    chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" }, response => {

      const lastError = chrome.runtime.lastError;
      // Silently handle connection errors
      if (lastError) {
        console.log("Connection error handled:", lastError.message);
      }
    });
  } catch (e) {
    console.log("Error handled:", e.message);
  }
});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  //
  // Get the current tab URL
  //
  if (message.type === 'leedz_get_tab_url') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || null, tabId: tabs[0]?.id || null });
    });
    return true; // Keep the message channel open for async response
  }


});


