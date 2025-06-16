// sidebar.js — LeedzEx Sidebar Control Logic (Simplified for Debugging)


// Import parser functions
import { findLinkedin, findX } from './parser.js';


// Debug check to confirm script execution
// console.log('sidebar.js executing. Checking environment...');
// console.log('Document body:', document.body ? 'Present' : 'Missing');
// console.log('Chrome API available:', typeof chrome !== 'undefined' ? 'Yes' : 'No');


const hiddenIconPath = 'icons/hidden.svg';
const visibleIconPath = 'icons/visible.svg';

const STATE = {
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
  lastSelection: "",
  domElements: {
    inputs: null,
    arrows: null
  }
};




// Enhanced logging function to output to both console and UI
function log(...args) {
  console.log(...args); // This will call the overridden version which already calls updateDebugOutput
}

// Separate function for error logging with different styling
function logError(...args) {
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


// PROBLEM
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




// Add import verification
console.log('[Sidebar] Parser functions loaded:', {
  findLinkedin: typeof findLinkedin,
  findX: typeof findX
});



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



// FIXME FIXME FIXME
// can function 1 and function 2 be consolidated?  WHich needs to be called first?
//
// Initialize when DOM is ready

// function 1
document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded fired, initializing LeedzEx sidebar...');

  updateFormFromState();

  // Set up listeners for all form inputs
  setupInputListeners();


  setupUI();
});

log('sidebar.js script loaded');


function setupUI() {

  initArrows();

  initButtons();

  // Log successful load
  log('LeedzEx sidebar UI loaded successfully');
}




function updateFormFromState() {
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

function setupInputListeners() {
  document.getElementById('name').addEventListener('input', e => STATE.name = e.target.value);
  document.getElementById('org').addEventListener('input', e => STATE.org = e.target.value);
  document.getElementById('title').addEventListener('input', e => STATE.title = e.target.value);
  document.getElementById('location').addEventListener('input', e => STATE.lists.location[0] = e.target.value);
  document.getElementById('phone').addEventListener('input', e => STATE.lists.phone[0] = e.target.value);
  document.getElementById('email').addEventListener('input', e => STATE.lists.email[0] = e.target.value);
  document.getElementById('linkedin').addEventListener('input', e => STATE.linkedin = e.target.value);
  document.getElementById('on_x').addEventListener('input', e => STATE.on_x = e.target.value);
  document.getElementById('notes').addEventListener('input', e => STATE.notes = e.target.value);
}


// arrows to cycle through lists in STATE
//
function initArrows() {
  const fields = ['email', 'phone', 'location'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    const arrow = document.getElementById(`${field}-arrow`);
    let index = 0;

    function updateArrowVisibility() {
      arrow.style.display = (STATE.lists[field].length > 1) ? 'inline-block' : 'none';
    }

    function updateInputFromState() {
      input.value = STATE.lists[field][index] || '';
    }

    if (arrow && input) {
      updateArrowVisibility();
      arrow.onclick = () => {
        if (STATE.lists[field].length > 1) {
          index = (index + 1) % STATE.lists[field].length;
          arrow.style.transform = `rotate(${(parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360}deg)`;
          arrow.setAttribute('data-rotation', ((parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360));
          updateInputFromState();
          STATE.lists[field][0] = STATE.lists[field][index]; // Ensure first element is canonical
        }
      };
    }
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

// Basic save functionality to test API connection
function saveData() {

  const data = {
    // Normalize name for storage using our standardized format
    name: normalizeName(STATE.name),
    
    org: STATE.org,
    title: STATE.title,
    location: STATE.lists.location[0],
    phone: STATE.lists.phone[0],
    email: STATE.lists.email[0],
    linkedin: STATE.linkedin,
    on_x: STATE.on_x
  };

  log('Sending data to backend:', JSON.stringify(data, null, 2));


  fetch('http://localhost:3000/marks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( data )
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(result => {
    log('Data saved successfully:', result);
  })
  .catch(error => {
    log('Error saving data:', error.message);
  });
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
  
  // Reset any state variables if needed
  // If you have a STATE object, you would reset it here
  
  log('Form cleared successfully');
}

// Helper function to normalize a name for storage/searching
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\s/g, '#');  // Replace spaces with #
}

// Helper function to denormalize a name for display
function denormalizeName(normalizedName) {
  if (!normalizedName) return '';
  
  // Replace # with spaces
  const nameWithSpaces = normalizedName.replace(/#/g, ' ');
  
  // Capitalize first letter of each word
  return nameWithSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Find button functionality
// 1. recover form data
// 2. look for unique fields --- name, email, linkedin, phone
// 3. SEARCH DB (curl http://localhost/marks?email=foo@bar.com)
// 4. Return matching mark (if any) and fill-in form fields
function findData() {
  log('Searching for existing record...');
  
  // Recover form data
  const email = document.getElementById('email')?.value || '';
  
  // Normalize name for searching using our standardized format
  const displayName = document.getElementById('name')?.value || '';
  const name = normalizeName(displayName);
  
  const phone = document.getElementById('phone')?.value || '';
  const linkedin = document.getElementById('linkedin')?.value || '';
  
  // Build query string based on available unique fields (prioritize email)
  let queryString = '';
  if (email) {
    queryString = `email=${encodeURIComponent(email)}`;
  } else if (name) {
    queryString = `name=${encodeURIComponent(name)}`;
  } else if (phone) {
    queryString = `phone=${encodeURIComponent(phone)}`;
  } else if (linkedin) {
    queryString = `linkedin=${encodeURIComponent(linkedin)}`;
  } else {
    log('Error: No unique fields (email, name, phone, or LinkedIn) to search with.');
    return;
  }
  
  const url = `http://localhost:3000/marks?${queryString}`;
  log('Searching with URL:', url);
  
  // Make GET request to backend
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data && data.length > 0) {
      log('Record found:', data[0]);
      // Fill form fields with the first matching record
      const mark = data[0];
      
      // Denormalize the name for display (convert from storage format to human-readable)
      document.getElementById('name').value = denormalizeName(mark.name) || '';
      
      document.getElementById('org').value = mark.org || '';
      document.getElementById('title').value = mark.title || '';
      document.getElementById('location').value = mark.location || '';
      document.getElementById('phone').value = mark.phone || '';
      document.getElementById('email').value = mark.email || '';
      document.getElementById('linkedin').value = mark.linkedin || '';
    } else {
      log('No matching records found.');
    }
  })
  .catch(error => {
    log('Error finding data:', error.message);
  });
}





function loadSVGIcon(path, container) {
  fetch(path)
    .then(res => res.text())
    .then(svg => {
      container.innerHTML = svg;
    });
}





// FIXME FIXME FIXME
// Initialize DOM cache after load
function initializeDOMCache() {
  // FIXME FIXME FIXME
    STATE.domElements.inputs = document.querySelectorAll('.sidebar-input');
    STATE.domElements.arrows = document.querySelectorAll('.input-arrow');
}

// Unified input value updater
// FIXME FIXME FIXME
function updateInputWithArrayValue(inputId, array, index = 0) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (array && array.length > 0) {
        input.value = array[index % array.length];
        const arrow = input.parentElement?.querySelector('.input-arrow');
        if (arrow) {
            arrow.style.opacity = (array.length > 1) ? '0.4' : '0';
        }
    }
}



// Setup event listeners
function setupEventListeners() {

    // FIXME FIXME FIXME
    // Arrow click handler with rotation
    STATE.domElements.arrows.forEach(arrow => {
        let currentIndex = 0;
        const input = arrow.closest('.input-wrapper')?.querySelector('input');
        if (!input) return;

        arrow.addEventListener('click', () => {

            if (arrow.style.opacity === '0') return;
            
            // FIXME FIXME FIXME
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

    // detects selections within the sidebar
    // document.addEventListener("mouseup", () => {
    //    const selection = window.getSelection().toString().trim();
    //    if (selection) {
    //        handleTextSelection(selection, 'page');
    //    }
    // });
}


