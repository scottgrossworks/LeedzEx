//
// 
// 
// 
// 




// Click the extension icon to toggle the sidebar
//
//
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'leedz_get_tab_url') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || null });
    });
    return true; // Keep the message channel open for async response
  }
});


