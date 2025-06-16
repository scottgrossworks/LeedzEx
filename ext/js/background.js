
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


