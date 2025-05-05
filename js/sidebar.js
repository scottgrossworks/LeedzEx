// sidebar.js

// Wait until the sidebar iframe itself is fully loaded
window.addEventListener("DOMContentLoaded", () => {
    console.log("[LeedzEx] Sidebar loaded.");
  
    // Ask the parent page (via content script) for DOM content
    window.parent.postMessage("leedz_request_dom", "*");
  
    // Listen for DOM content response from the content script
    window.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "leedz_dom_data") return;
  
      const { title, bodyText } = event.data;
  
      console.log("[LeedzEx] Page Title:", title);
      console.log("[LeedzEx] Page Body Sample:", bodyText);
  
      // Populate the notes field if it exists
      const notesField = document.querySelector("textarea");
      if (notesField && bodyText) {
        notesField.value = `Page title: ${title}\n\nPreview:\n${bodyText}`;
      }
    });
  });
  