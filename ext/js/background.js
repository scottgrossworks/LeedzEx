
//
// 
// 
// 
// 



// Override console methods to send logs to sidebar
const originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog.apply(console, args);

};

const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);

};


// Click the extension icon to toggle the sidebar
//
//
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
});


