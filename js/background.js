//
// toggleSidebar() allow repeated clicks to show/hide the sidebar.
//

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleSidebar
  });
});

function toggleSidebar() {
  const existingSidebar = document.getElementById("leedz-sidebar");
  if (existingSidebar) {
    existingSidebar.remove(); // If it exists, remove it (toggle off)
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("sidebar.html");
    iframe.id = "leedz-sidebar";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.right = "0";
    iframe.style.width = "420px";
    iframe.style.height = "100vh";
    iframe.style.zIndex = "999999";
    iframe.style.border = "none";
    iframe.style.boxShadow = "0 0 12px rgba(0,0,0,0.35)";
    document.body.appendChild(iframe); // Otherwise, inject it (toggle on)
  }
}
