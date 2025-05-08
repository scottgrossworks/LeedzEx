// content.js
//
// Receives request → finds iframe → sends DOM back into iframe
// makes sure the response goes directly into the iframe running sidebar.js.
const MAX_CHARS = 3000;

let ACTIVE = false;




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "leedz_open_sidebar") {
    ACTIVE = true;
    console.log("[LeedzEx] Extension activated.");
    return true;
  }

  if (message.type === "leedz_close_sidebar") {
    ACTIVE = false;
    console.log("[LeedzEx] Extension closed.");
    return true;
  }


  if (message.type === "leedz_request_dom") {
    const bodyText = document.body.innerText || "";
    const title = document.title || "";

    const responseData = {
      type: "leedz_dom_data",
      title,
      bodyText: bodyText.slice(0, MAX_CHARS)
    };

    sendResponse(responseData); // end back directly
    return true; 

  } else {
    console.error("[LeedzEx] content.js > Message received unknown type: ", message.type);
    return true;
  }
  // should never reach here
  return false;
});


//This creates a parallel system where:
//
//Sidebar selections are handled directly by sidebar.js
//Main page selections are:
//Captured by content.js
//Highlighted in the main page
//Sent to sidebar via messaging
//Processed by the existing message listener in sidebar.js

document.addEventListener('mouseup', function(event) {

  // is the Extension open?
  if (! ACTIVE) {
      // console.log('[LeedzEx] Ignoring mouseup, extension not active');
      return;
  }

  // Don't process if we're in the sidebar iframe
  if (window !== window.top) {
      console.log('[LeedzEx] Ignoring mouseup in iframe');
      return;
  }

  console.log('[LeedzEx] Valid mouseup detected');

  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text) {
      console.log('[LeedzEx] Selected text:', text);
      
      try {
          // Highlight the selection
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.style.backgroundColor = '#90EE90';
          span.className = 'leedz-highlight';
          range.surroundContents(span);
          
          // Send to sidebar
          chrome.runtime.sendMessage({
              type: 'leedz_update_selection',
              selection: text
          }, response => {
              if (chrome.runtime.lastError) {
                  console.error('[LeedzEx] Send error:', chrome.runtime.lastError);
              } else {
                  console.log('[LeedzEx] Selection sent to sidebar');
              }
          });
      } catch (e) {
          console.error('[LeedzEx] Error processing selection:', e);
      }
  }
});