// content.js
//
// Receives request → finds iframe → sends DOM back into iframe
// makes sure the response goes directly into the iframe running sidebar.js.
const MAX_CHARS = 3000;


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leedz_request_dom") {
    const bodyText = document.body.innerText || "";
    const title = document.title || "";

    const responseData = {
      type: "leedz_dom_data",
      title,
      bodyText: bodyText.slice(0, MAX_CHARS)
    };

    sendResponse(responseData); // end back directly
    return true; // Keep message channel open
  } else {
    console.log("content.js > No match for message type.");
  }
});