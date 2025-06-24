// sidebar.js — LeedzEx Sidebar Control Logic (Simplified for Debugging)


import { saveData, findData, populateFromRecord } from './http_utils.js';



// Debug check to confirm script execution
// console.log('sidebar.js executing. Checking environment...');
// console.log('Document body:', document.body ? 'Present' : 'Missing');
// console.log('Chrome API available:', typeof chrome !== 'undefined' ? 'Yes' : 'No');


export const STATE = {
  id: null,
  name: null,
  title: null,
  org: null,
  www: null,
  lists: {
    email: [],
    phone: [],
    location: []
  },
  linkedin: null,
  on_x: null,
  outreachCount: 0,
  createdAt: null,
  lastContact: null,
  notes: null,
  hasReplied: false,
  activeField: null,
  lastSelection: null,

  domElements: {
      inputs: null,
      arrows: null
  },


};




// Enhanced logging function to output to both console and UI
export function log(...args) {
  console.log(...args); // This will call the overridden version which already calls updateDebugOutput
}

// Separate function for error logging with different styling
export function logError(...args) {
  console.error(...args); // This will call the overridden version which already calls updateDebugOutput
}



// Helper function to update the debug output element
function updateDebugOutput(...args) {
  const isError = args.length > 0 && args[args.length - 1] === true;
  if (isError) {
    args.pop(); // Remove the error flag
  }
  
  try {
    const debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
      const now = new Date().toLocaleTimeString();
      const message = args.map(a => {
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch (e) {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
      
      const style = isError ? 'color: #ff5555;' : '';
      debugOutput.innerHTML += `<div style="${style}">[${now}] ${message}</div>`;
      debugOutput.scrollTop = debugOutput.scrollHeight;
    }
  } catch (e) {
    console.error('UI log failed', e);
  }
}






// Override console methods to display logs in the footer
const originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  updateDebugOutput(...args);
};

const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  updateDebugOutput(...args, true);
};




// Listen for log messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leedz_log") {
    console.log("Received log from background:", message.args);
    updateDebugOutput(...(message.args || ["No message"]));
    sendResponse({received: true});
    return true;
  }
  if (message.type === "leedz_error") {
    console.error("Received error from background:", message.args);
    updateDebugOutput(...(message.args || ["No error message"]), true);
    sendResponse({received: true});
    return true;
  }
  return false;
});










/*
// DOM CONTENT LOADED
//
//
*/
document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded fired, initializing LeedzEx sidebar...');

  initializeDOMCache();

  setupInputListeners();

  setupUI();

  reloadParsers();

});  // CLOSED the DOMContentLoaded listener

log('sidebar.js script loaded');




/*
// include ALL of the portal-specific checks
// i.e. LinkedIn, X, etc
*/
async function reloadParsers() {
  try {
    const isLinkedin = await checkForLinkedin();
    if (!isLinkedin) {
      // Try other parsers or handle no matches
      log('No matching parsers found');
    }
  } catch (error) {
    logError('Error in reloadParsers:', error);
  }
}



/*
// is this a linkedin page?
// query the url to find out
*/
function checkForLinkedin() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'leedz_get_tab_url' }, async ({ url, tabId }) => {
      if (!url || !tabId) {
        log('Cannot auto-detect page data');
        resolve(false);
        return;
      }
      
      try {
        // Check if LinkedInParser exists
        if (! window.LinkedInParser) {
          log('LinkedInParser not available');
          resolve(false);
          return;
        }
        
        const isLinkedin = window.LinkedInParser.isLinkedinProfileUrl(url);
        if (!isLinkedin) {
          log('Not a LinkedIn profile page');
          resolve(false);
        } else {
          log('LinkedIn profile page detected');
          await parseLinkedin(url, tabId);
          resolve(true);
        }
      } catch (error) {
        logError('Error checking LinkedIn:', error);
        resolve(false);
      }
    });
  });
}


/*
It queries the database for an existing record matching the LinkedIn URL
It populates the form with any existing data
It requests the content script to parse the LinkedIn page for additional data
*/
async function parseLinkedin( url, tabId ) {

    // 1. Query DB by LinkedIn URL  
    const linkedinProfile = url.replace(/^https?:\/\/(www\.)?/, '');
    const existingRecord = await findData({ linkedin: linkedinProfile });

    // 2. If found, use it to populate the form
    if (existingRecord) {
      log('Found existing record for: ' + linkedinProfile);
      populateFromRecord(existingRecord);
    }

    // 3. Send message to content script to parse LinkedIn page
    // log('Requesting LinkedIn page parsing from content script');
    // 
    chrome.tabs.sendMessage(tabId, { type: 'leedz_parse_linkedin' }, (resp) => {
      if (resp?.ok) {
        // log('Received parsed LinkedIn data');
        // Merge data from parser with existing STATE
        mergePageData( resp.data );
  
      } else {
        logError('Failed to parse LinkedIn page:', resp?.error || 'Unknown error');
      }
    });
}




//
// Merge data: Only update fields that are empty in the current STATE
//
function mergePageData(parsedData) {
      
        if (!STATE.name && parsedData.name) STATE.name = parsedData.name;
        if (!STATE.org && parsedData.org) STATE.org = parsedData.org;
        if (!STATE.title && parsedData.title) STATE.title = parsedData.title;
        if (!STATE.linkedin && parsedData.linkedin) STATE.linkedin = parsedData.linkedin;
        if (!STATE.on_x && parsedData.on_x) STATE.on_x = parsedData.on_x; 
        if (!STATE.www && parsedData.www) STATE.www = parsedData.www;

        if (!STATE.lists.location.includes(parsedData.location))
           STATE.lists.location.push(parsedData.location);      
  
        if (!STATE.lists.email.includes(parsedData.email))
          STATE.lists.email.push(parsedData.email);      

        if (parsedData.phone && !STATE.lists.phone.includes(parsedData.phone))
          STATE.lists.phone.push(parsedData.phone);      

        if (!STATE.linkedin && parsedData.linkedin) STATE.linkedin = parsedData.linkedin;
        
        // Update the form with merged data
        updateFormFromState();
}




//
//
//
//
function setupUI() {

  // Then initialize UI components that depend on the cache
  initArrows();
  initButtons();

  // Log successful load
  log('LeedzEx sidebar UI loaded successfully');
}



// Function to set up input listeners for form fields
// This will synchronize input values with STATE.lists
function setupInputListeners() {
  const fields = ['name', 'org', 'title', 'www', 'location', 'phone', 'email', 'linkedin', 'on_x', 'notes'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.addEventListener('input', e => {
        const value = e.target.value;
        
        // Special handling for phone field
        if (field === 'phone') {
          // Basic phone validation - allow only digits, spaces, dashes, parentheses, and plus sign
          const isValidPhone = /^[0-9\s\-\(\)\+]*$/.test(value);
          if (!isValidPhone && value !== '') {
            // Visual indicator for invalid input
            input.classList.add('invalid-input');
            return; // Don't update STATE with invalid phone
          } else {
            input.classList.remove('invalid-input');
          }
        }
        
        if (STATE.lists[field]) {
          STATE.lists[field][0] = value; // Synchronize the first element
        } else {
          STATE[field] = value; // For non-array fields
        }
      });
    }
  });
}


// Initialize arrows to cycle through field values in STATE.lists
function initArrows() {
  const fields = ['email', 'phone', 'location'];
  
  fields.forEach(field => {
    // Get input element
    const input = document.getElementById(field);
    if (!input) {
      logError(`Missing input element for field: ${field}`);
      return;
    }

    // Get the arrow element that's a sibling of the input
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) {
      logError(`Missing wrapper for field: ${field}`);
      return;
    }
    const arrow = wrapper.querySelector('.input-arrow');
    if (!arrow) {
      logError(`Missing arrow for field: ${field}`);
      return;
    }

    // Initialize the field's array if it doesn't exist
    if (!STATE.lists[field]) {
      STATE.lists[field] = [];
    }

    // Track current index for this field
    let currentIndex = 0;

    function updateArrowVisibility() {
      const hasMultipleValues = STATE.lists[field].length > 1;
      arrow.style.display = hasMultipleValues ? 'inline-block' : 'none';
      arrow.style.opacity = hasMultipleValues ? '0.4' : '0';
    }

    function updateInputValue() {
      // Always show the current index value, defaulting to empty string
      input.value = STATE.lists[field][currentIndex] || '';
      
      // Update the canonical value (array[0])
      if (STATE.lists[field].length > 0) {
        STATE.lists[field][0] = input.value;
      }
    }

    // Initialize visibility and value
    updateArrowVisibility();
    updateInputValue();

    // Handle arrow clicks
    arrow.onclick = () => {
      if (STATE.lists[field].length > 1) {
        // Cycle to next value
        currentIndex = (currentIndex + 1) % STATE.lists[field].length;
        
        // Rotate arrow icon
        const newRotation = ((parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360);
        arrow.style.transform = `rotate(${newRotation}deg)`;
        arrow.setAttribute('data-rotation', newRotation);
        
        // Update input and canonical value
        updateInputValue();
        log(`Cycled ${field} to value: ${input.value} (${currentIndex + 1}/${STATE.lists[field].length})`);
      }
    };

    // Handle manual input
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (STATE.lists[field].length === 0) {
        STATE.lists[field].push(value);
      } else {
        STATE.lists[field][currentIndex] = value;
        STATE.lists[field][0] = value; // Update canonical value
      }
    });
  });
}






// Initialize buttons and their event listeners
//
function initButtons() {

  // Setup hasReplied button
  const hasRepliedBtn = document.getElementById('hasRepliedBtn');
  if (hasRepliedBtn) {
    hasRepliedBtn.addEventListener('click', () => {
      //log('Has Replied button clicked');
      hasReplied();
    });
  } else {
    log('Error: Has Replied button not found');
  }


  initOutreachButton();

  // Setup save button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // log('Save button clicked');
      saveData();
    });
  } else {
    log('Error: Save button not found');
  }

  // Setup find button
  const findBtn = document.getElementById('findBtn');
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      //log('Find button clicked');
      findData();
    });
  } else {
    log('Error: Find button not found');
  }
  
  // Setup clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // log('Clear button clicked');
      clearForm();
    });
  } else {
    log('Error: Clear button not found');
  }

  // Setup reload button
  const reloadBtn = document.getElementById('reloadBtn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      // log('Reload button clicked');
      clearForm();
      reloadParsers();
    });
  } else {
    log('Error: Reload button not found');
  }

}









// Function to update form inputs from STATE
export function updateFormFromState() {
  document.getElementById('name').value = STATE.name || '';
  document.getElementById('org').value = STATE.org || '';
  document.getElementById('www').value = STATE.www || '';
  document.getElementById('title').value = STATE.title || '';
  document.getElementById('location').value = STATE.lists.location[0] || '';
  document.getElementById('phone').value = STATE.lists.phone[0] || '';
  document.getElementById('email').value = STATE.lists.email[0] || '';
  document.getElementById('linkedin').value = STATE.linkedin || '';
  document.getElementById('on_x').value = STATE.on_x || '';
  document.getElementById('notes').value = STATE.notes || '';
  
    
    // Update hasReplied button if it exists
    const hasRepliedBtn = document.getElementById('hasRepliedBtn');
    if (hasRepliedBtn) {
      if (STATE.hasReplied) {
        hasRepliedBtn.classList.add('hasReplied');
      } else {
        hasRepliedBtn.classList.remove('hasReplied');
      }
    }
  }

























// Function to clear all form fields and reset state
function clearForm() {
  // log('Clearing all form fields');
  
  // Clear all input fields
  document.getElementById('name').value = '';
  document.getElementById('org').value = '';
  document.getElementById('title').value = '';
  document.getElementById('on_x').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('www').value = '';
  document.getElementById('location').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('email').value = '';
  document.getElementById('linkedin').value = '';

  // Clear the hasReplied button
  const hasReplied = document.getElementById('hasRepliedBtn');
  if (hasReplied) hasReplied.classList.remove('hasReplied');

  // Clear the outreach count
  const outreachBtn = document.getElementById('outreachBtn');
  const countSpan = outreachBtn.querySelector('.outreach-count');
  countSpan.textContent = '0';


  // Clear the STATE

  STATE.id = null;
  STATE.name = null;
  STATE.title = null;
  STATE.org = null;
  STATE.www = null;
  
  STATE.lists.email = [];
  STATE.lists.location = [];
  STATE.lists.phone = [];

  STATE.linkedin = null;
  STATE.on_x = null;

  STATE.outreachCount = 0;
  STATE.hasReplied = false;
  STATE.createdAt = null;
  STATE.lastContact = null;
  STATE.notes = null;

  STATE.activeField = null;

  STATE.lastSelection = null;

  // log('Form cleared successfully');
}


// Initialize DOM cache for inputs and arrows
function initializeDOMCache() {

    // Ensure STATE.domElements exists
    if (! STATE.domElements) {
      STATE.domElements = {};
    }

    // Cache all input elements
    const inputs = document.querySelectorAll('.sidebar-input');
    if (!inputs) {
        logError('Failed to find sidebar inputs');
        return false;
    }
    STATE.domElements.inputs = inputs;

    // Cache arrow elements
    const arrows = document.querySelectorAll('.input-arrow');
    if (!arrows) {
        logError('Failed to find input arrows');
        return false;
    }
    STATE.domElements.arrows = arrows;

    // log('DOM cache initialized successfully');
    return true;
}





function initOutreachButton() {
  // Set up outreach button
  const outreachBtn = document.getElementById('outreachBtn');
  if (outreachBtn) {
    const countSpan = outreachBtn.querySelector('.outreach-count');
    if (countSpan) countSpan.textContent = '0';
    
    outreachBtn.addEventListener('click', () => {

      STATE.outreachCount++;
      countSpan.textContent = STATE.outreachCount;
      STATE.lastContact = new Date().toISOString();
      saveData();
    });
  }
}

// indicate that the user being viewed has replied to outreach
//
function hasReplied() {
  STATE.hasReplied = true;

  const hasRepliedBtn = document.getElementById('hasRepliedBtn');

  if (hasRepliedBtn) {
      if (STATE.hasReplied) {
          hasRepliedBtn.classList.add('hasReplied');
      } else {
          hasRepliedBtn.classList.remove('hasReplied');
      }
  }
  saveData();
}
