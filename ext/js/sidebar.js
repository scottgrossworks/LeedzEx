// sidebar.js — LeedzEx Sidebar Control Logic (Simplified for Debugging)

// Temporarily comment out imports to avoid potential errors from missing modules

import {
  extractMatches,
  pruneShortLines,
  EMAIL_REGEX,
  PHONE_REGEX,
  LINKEDIN_REGEX,
  X_REGEX
} from "./parser.js";

import { processHighlight } from "./highlight.js";
import { findExistingMark, submitMark } from "./http_utils.js";


// Debug check to confirm script execution
console.log('sidebar.js executing. Checking environment...');
console.log('Document body:', document.body ? 'Present' : 'Missing');
console.log('Chrome API available:', typeof chrome !== 'undefined' ? 'Yes' : 'No');

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
  console.log(...args);
  updateDebugOutput(...args);
}

// Separate function for error logging with different styling
function logError(...args) {
  console.error(...args);
  updateDebugOutput(...args, true);
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

// Minimal DOM setup to ensure UI loads

function setupUI() {
  log('Setting up LeedzEx sidebar UI...');
  
  // Tell background script that sidebar is ready to receive logs
  chrome.runtime.sendMessage({ type: "sidebar_ready" }, (response) => {
    log("Notified background script that sidebar is ready");
  });
  
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



  // Log successful load
  log('LeedzEx sidebar UI loaded successfully');
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
  const name = document.getElementById('name')?.value || '';
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
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    if (data && data.length > 0) {
      log('Record found:', data[0]);
      // Fill form fields with the first matching record
      const mark = data[0];
      document.getElementById('name').value = mark.name || '';
      document.getElementById('org').value = mark.org || '';
      document.getElementById('title').value = mark.title || '';
      document.getElementById('location').value = mark.location || '';
      document.getElementById('phone').value = mark.phone || '';
      document.getElementById('email').value = mark.email || '';
      document.getElementById('linkedin').value = mark.linkedin || '';
    } else {
      log('No matching record found.');
    }
  })
  .catch(error => {
    log('Error searching for data:', error.message);
  });
}

// Basic save functionality to test API connection
function saveData() {
  const data = {
    name: document.getElementById('name')?.value || '',
    org: document.getElementById('org')?.value || '',
    title: document.getElementById('title')?.value || '',
    location: document.getElementById('location')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    email: document.getElementById('email')?.value || '',
    linkedin: document.getElementById('linkedin')?.value || ''
  };

  log('Sending data to backend:', JSON.stringify(data, null, 2));

  fetch('http://localhost:3000/marks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded fired, initializing LeedzEx sidebar...');
  setupUI();
});

log('sidebar.js script loaded');
