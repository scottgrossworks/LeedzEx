// content.js

// This script is injected into the page and listens for a message from sidebar.js.
// It responds with a trimmed version of the page title and body text.

window.addEventListener("message", (event) => {
    if (event.source !== window) return; // Only accept messages from same page
  
    if (event.data === "leedz_request_dom") {
      const bodyText = document.body.innerText || "";
      const title = document.title || "";
  
      const response = {
        type: "leedz_dom_data",
        title: title,
        bodyText: bodyText.slice(0, 1000) // Trimmed for performance
      };
  
      window.postMessage(response, "*");
    }
  });
  