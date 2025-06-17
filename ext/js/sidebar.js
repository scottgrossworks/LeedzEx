// sidebar.js — LeedzEx Sidebar Control Logic (Simplified for Debugging)


import { saveData, findData } from './http_utils.js';

import { LinkedInParser } from './linkedin_parser.js';
import { XParser } from './x_parser.js';




// Debug check to confirm script execution
// console.log('sidebar.js executing. Checking environment...');
// console.log('Document body:', document.body ? 'Present' : 'Missing');
// console.log('Chrome API available:', typeof chrome !== 'undefined' ? 'Yes' : 'No');


export const STATE = {
  id: null,
  name: null,
  title: null,
  org: null,
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




// Function to update form inputs from STATE
export function updateFormFromState() {
  document.getElementById('name').value = STATE.name || '';
  document.getElementById('org').value = STATE.org || '';
  document.getElementById('title').value = STATE.title || '';
  document.getElementById('location').value = STATE.lists.location[0] || '';
  document.getElementById('phone').value = STATE.lists.phone[0] || '';
  document.getElementById('email').value = STATE.lists.email[0] || '';
  document.getElementById('linkedin').value = STATE.linkedin || '';
  document.getElementById('on_x').value = STATE.on_x || '';
  document.getElementById('notes').value = STATE.notes || '';
}




// DOM CONTENT LOADED
//
//
document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded fired, initializing LeedzEx sidebar...');

  initializeDOMCache();

  setupEventListeners();

  setupInputListeners();

  setupUI();

});

log('sidebar.js script loaded');


function setupUI() {

  // Then initialize UI components that depend on the cache
  initArrows();
  initButtons();

  // Log successful load
  log('LeedzEx sidebar UI loaded successfully');
}



// FIXME FIXME FIMXME -- what does this do?  Is it necessary??
//
// Function to set up input listeners for form fields
// This will synchronize input values with STATE.lists
function setupInputListeners() {
  const fields = ['name', 'org', 'title', 'location', 'phone', 'email', 'linkedin', 'on_x', 'notes'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.addEventListener('input', e => {
        const value = e.target.value;
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

  // Setup save button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      log('Save button clicked');
      saveData();
    });
  } else {
    log('Error: Save button not found');
  }

  // Setup find button
  const findBtn = document.getElementById('findBtn');
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      log('Find button clicked');
      findData();
    });
  } else {
    log('Error: Find button not found');
  }
  
  // Setup clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      log('Clear button clicked');
      clearForm();
    });
  } else {
    log('Error: Clear button not found');
  }

  
}


// Function to clear all form fields and reset state
function clearForm() {
  log('Clearing all form fields');
  
  // Clear all input fields
  document.getElementById('name').value = '';
  document.getElementById('org').value = '';
  document.getElementById('title').value = '';
  document.getElementById('location').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('email').value = '';
  document.getElementById('linkedin').value = '';
  
  // Clear the STATE

  STATE.id = null;
  STATE.name = null;
  STATE.title = null;
  STATE.org = null;
  
  STATE.lists.email = [];
  STATE.lists.location = [];
  STATE.lists.phone = [];

  STATE.linkedin = null;
  STATE.on_x = null;

  STATE.outreachCount = 0;
  STATE.createdAt = null;
  STATE.lastContact = null;
  STATE.notes = null;

  STATE.activeField = null;

  STATE.lastSelection = null;

  log('Form cleared successfully');
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

    log('DOM cache initialized successfully');
    return true;
}

// Unified input value updater
// 
function updateInputWithArrayValue(inputId, array, index = 0) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (array && array.length > 0) {
        input.value = array[index % array.length];
        array[0] = input.value; // Ensure the first element is always the displayed value

        const arrow = input.parentElement?.querySelector('.input-arrow');
        if (arrow) {
            arrow.style.opacity = (array.length > 1) ? '0.4' : '0';
        }
    }
}

// Setup event listeners
function setupEventListeners() {


  // FIXME FIXME FIXME is this code necessary to cycle through the lists?
//  lists: {
//    email: [],
//    phone: [],
//    location: []
//  },
// when a user clicks the arrow icon in each field the corr array should cycle
// and the new value[0] should be displayed in the UI.  The icon should rotate when pressed.
// if the array.length < 2 the icon should not be visible
//


    // Arrow click handler with rotation
    STATE.domElements.arrows.forEach(arrow => {
        let currentIndex = 0;
        const input = arrow.closest('.input-wrapper')?.querySelector('input');
        if (!input) return;

        arrow.addEventListener('click', () => {

            if (arrow.style.opacity === '0') return;
            
            const array = STATE.lists[input.id];
            if (array && array.length > 1) {
                currentIndex = (currentIndex + 1) % array.length;
                updateInputWithArrayValue(input.id, array, currentIndex);
                
                // rotate the arrow
                const newRotation = ((parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360);
                arrow.setAttribute('data-rotation', newRotation);
                arrow.style.transform = `rotate(${newRotation}deg)`;
            }
        });
    });

}


chrome.runtime.sendMessage({ type: 'leedz_get_tab_url' }, (response) => {
    if (response && response.url) {
        detectAndPreload(response.url);
    } else {
        log('Cannot auto-detect page data');
    }
  });


// 1. try a DB get based on some detectable value
// 2. parse the page
//
async function detectAndPreload(realPageUrl) {
    log('Starting auto-detection process...');

    const linkedinParser = new LinkedInParser();

    // Pass the real URL to isRelevantPage
    if (linkedinParser.isRelevantPage(realPageUrl)) {
        log('LinkedIn page detected, preloading data...');
        STATE.linkedin = linkedinParser.getValue('profile', realPageUrl);

        // Try to find existing record
        log('Linkedin being searched:', STATE.linkedin);
        const existingRecord = await findData({ linkedin: STATE.linkedin });

        if (! existingRecord) {
           
            log('No matching records found.');
            // FIXME FIXME FIXME -- additional parsing using LinkedInParser ? 
        }






    } else {
      log("No portal page auto-detected")
    }
}

