// content.js
//
// toggle the sidebar panel

let ACTIVE = false;





//
// 
//
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {


  if (message.action === "toggleSidebar") {
    toggleSidebar();
  } else {

    console.log("[LeedzEx] content.js > [" + message.type + "] " + message.body);
  }
});



console.log('LeedzEx content.js loaded');







// respond to sidebar requests
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== 'leedz_parse_linkedin') return;   // ignore others

  (async () => {
    try {
      const p = new window.LinkedInParser();
      await p.waitUntilReady();          // <h1> now visible in page DOM
     
      // ────────────────────────────────────────────────
      // send back the SAME field names populateFromRecord expects
      // ────────────────────────────────────────────────
      reply({
        ok: true,
        data: {
          id:            null, // new record
          name:          p.getValue('name'),
          org:           p.getValue('org'),
          title:         p.getValue('title'),
          location:      p.getValue('location'),
          www:           null,
          outreachCount: 0,
          lastContact:   null,
          notes:         null,
          linkedin:      p.getValue('profile'),
          on_x:          null
        }


      });
    } catch (e) {
      reply({ ok:false, error: e.message });
    }
  })();

  return true; // keep port open for async reply
});



//
// send leedz_open_sidebar message and 
// leedz_close_sidebar message to content.html
//
function toggleSidebar () {
  const pane = document.getElementById('leedz-sidebar');

  if (pane) {
    requestAnimationFrame(() => {
      pane.style.transform = 'translateX(100%)';
    });
    pane.addEventListener('transitionend', () => pane.remove(), { once: true });

    /*
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "leedz_close_sidebar" });
    });
    */


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
      transition: "transform 0.4s ease",
      boxShadow: "-6px 0 18px rgba(0,0,0,0.2)",
    });

    document.body.appendChild(iframe);

    /*
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "leedz_open_sidebar" });
    });
    */

    requestAnimationFrame(() => {
      iframe.style.transform = "translateX(0)";
    });
  }
}
