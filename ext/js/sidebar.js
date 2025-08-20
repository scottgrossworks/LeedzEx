// sidebar.js — LeedzEx Sidebar Control Logic (Simplified for Debugging)

import { STATE, copyFromRecord, mergePageData } from './state.js';
import { saveData, findData } from './http_utils.js';



// Debug check to confirm script execution
// console.log('sidebar.js executing. Checking environment...');
// console.log('Document body:', document.body ? 'Present' : 'Missing');
// console.log('Chrome API available:', typeof chrome !== 'undefined' ? 'Yes' : 'No');







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







/**
 * 
 * @param {*} record 
 */
function refresh(record) {
  copyFromRecord(record);
  updateOutreachCount();
  updateFormFromState();
}






/*
// DOM CONTENT LOADED
//
//
*/
document.addEventListener('DOMContentLoaded', () => {

  initButtons();  
  reloadParsers();

});  // CLOSED the DOMContentLoaded listener

// log('sidebar.js script loaded');




/*
// include ALL of the portal-specific checks
// i.e. LinkedIn, X, etc
*/
async function reloadParsers() {
  
  try {
    await checkForLinkedin();
  } catch (error) {
    logError('Error in reloadParsers:', error);
  }

  updateFormFromState();
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
      refresh(existingRecord);
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







// Add function to update outreach count display
function updateOutreachCount() {
  const outreachBtn = document.getElementById('outreachBtn');
  if (outreachBtn) {
    const countSpan = outreachBtn.querySelector('.outreach-count');
    if (countSpan) {
      countSpan.textContent = STATE.outreachCount || '0';
    }
  }
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









// Function to format STATE data as key=value pairs for notes field
function formatStateAsKeyValuePairs() {
  const pairs = [];
  
  // Add all non-null/non-empty values as key=value pairs
  if (STATE.title) pairs.push(`title=${STATE.title}`);
  if (STATE.org) pairs.push(`org=${STATE.org}`);
  if (STATE.www) pairs.push(`www=${STATE.www}`);
  if (STATE.location) pairs.push(`location=${STATE.location}`);
  if (STATE.phone) pairs.push(`phone=${STATE.phone}`);
  if (STATE.linkedin) pairs.push(`linkedin=${STATE.linkedin}`);
  if (STATE.on_x) pairs.push(`on_x=${STATE.on_x}`);
  if (STATE.outreachCount > 0) pairs.push(`outreachCount=${STATE.outreachCount}`);
  if (STATE.lastContact) pairs.push(`lastContact=${STATE.lastContact}`);
  if (STATE.hasReplied) pairs.push(`hasReplied=${STATE.hasReplied}`);
  
  // Add existing notes if any
  if (STATE.notes && !STATE.notes.includes('=')) {
    pairs.push(`notes=${STATE.notes}`);
  }
  
  return pairs.join(' ');
}






// Function to update form inputs from STATE
function updateFormFromState() {
  // Fill name and email in their labeled form boxes
  document.getElementById('name').value = STATE.name || '';
  document.getElementById('email').value = STATE.email || '';
  
  // Format everything else as key=value pairs in notes
  document.getElementById('notes').value = formatStateAsKeyValuePairs();
  
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
  
  clearState();
  // Clear all input fields
  document.getElementById('name').value = '';

  document.getElementById('notes').value = '';

  document.getElementById('email').value = '';

  // Clear the hasReplied button
  const hasReplied = document.getElementById('hasRepliedBtn');
  if (hasReplied) hasReplied.classList.remove('hasReplied');

  // Clear the outreach count
  const outreachBtn = document.getElementById('outreachBtn');
  const countSpan = outreachBtn.querySelector('.outreach-count');
  countSpan.textContent = '0';
  // log('Form cleared successfully');
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
