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

    // console.log("[LeedzEx] content.js > [" + message.type + "] " + message.body);
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
          phone:         null,  // Add this line
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
/*
function toggleSidebar () {
  const pane = document.getElementById('leedz-sidebar-container');

  if (pane) {
    // If sidebar exists, close it
    requestAnimationFrame(() => {
      pane.style.transform = 'translateX(100%)';
    });
    pane.addEventListener('transitionend', () => pane.remove(), { once: true });
  } else {
    // Create a shadow DOM container for the sidebar to isolate it from the page
    const container = document.createElement('div');
    container.id = "leedz-sidebar-container";
    
    // Apply styles to ensure it's positioned properly on top of page content
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "420px",
      height: "100vh",
      zIndex: "2147483647", // Maximum z-index value
      backgroundColor: "#ffffff",
      boxShadow: "-6px 0 18px rgba(0,0,0,0.2)",
      border: "none",
      transform: "translateX(100%)",
      transition: "transform 0.4s ease"
    });
    
     // Create an iframe for the sidebar content
     const iframe = document.createElement('iframe');
     iframe.id = "leedz-sidebar";
     iframe.src = chrome.runtime.getURL("sidebar.html");
     
     // Style the iframe to fill the container
     Object.assign(iframe.style, {
       width: "100%",
       height: "100%",
       border: "none",
       backgroundColor: "#ffffff"
     });
     
     // Append the iframe directly to the container
     container.appendChild(iframe);
     
     // Append the container directly to the body
     document.body.appendChild(container);
     
     // Animate it in
     requestAnimationFrame(() => {
       container.style.transform = "translateX(0)";
     });
   }
 }
   */

 function toggleSidebar () {
  const pane = document.getElementById('leedz-sidebar-container');

  if (pane) {
    // If sidebar exists, close it
    requestAnimationFrame(() => {
      pane.style.transform = 'translateX(100%)';
    });
    pane.addEventListener('transitionend', () => pane.remove(), { once: true });
  } else {
    // Create a completely isolated iframe
    const iframe = document.createElement('iframe');
    iframe.id = "leedz-sidebar-container";
    iframe.src = chrome.runtime.getURL("sidebar.html");
    
    // Style the iframe to be positioned as a sidebar
    Object.assign(iframe.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "420px",
      height: "100vh",
      zIndex: "2147483647", // Maximum z-index value
      border: "none",
      transform: "translateX(100%)",
      transition: "transform 0.4s ease",
      boxShadow: "-6px 0 18px rgba(0,0,0,0.2)"
    });
    
    // Append directly to body
    document.body.appendChild(iframe);
    
    // Animate it in
    requestAnimationFrame(() => {
      iframe.style.transform = "translateX(0)";
    });
  }
}