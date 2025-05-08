chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleSidebar
  });
});

function toggleSidebar () {
  const pane = document.getElementById('leedz-sidebar');

  if (pane) {
    requestAnimationFrame(() => {
      pane.style.transform = 'translateX(100%)';
    });
    pane.addEventListener('transitionend', () => pane.remove(), { once: true });

    // send message to content.html -- stop HIGHLIGHTER
    chrome.runtime.sendMessage({ type: "leedz_close_sidebar" });


  } else {
    const iframe = document.createElement('iframe');
    iframe.id = "leedz-sidebar";
    iframe.src = chrome.runtime.getURL("sidebar.html");

    Object.assign(iframe.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "420px",
      height: "100vh",
      border: "none",
      zIndex: "999999",
      transform: "translateX(100%)",
      transition: "transform 0.4s ease"
    });

    document.body.appendChild(iframe);

    // send message to content.html -- ready to start HIGHLIGHTER
    chrome.runtime.sendMessage({ type: "leedz_open_sidebar" });
 

    requestAnimationFrame(() => {
      iframe.style.transform = "translateX(0)";
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leedz_request_dom") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { type: "leedz_request_dom" }, sendResponse);
    });
    return true; // Keep message channel open for async response
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leedz_selection") {
      // Forward selection to sidebar
      chrome.runtime.sendMessage({
          type: "leedz_update_selection",
          selection: message.selection
      });
  }
});