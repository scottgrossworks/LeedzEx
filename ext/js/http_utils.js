// http_utils.js
// Handles local DB communication for querying existing marks and submitting new ones
import { normalizeName, denormalizeName } from "./parser.js";
import { STATE, updateFormFromState } from "./sidebar.js";
import { log, logError } from "./sidebar.js";


const BASE_URL = "http://localhost:3000";





// Basic save functionality to test API connection
export function saveData() {

  if (!STATE.name || STATE.name.trim() === '') {
    logError('Error: Name field is required to save data.');
    return; 
  }

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





// Find button functionality
// 1. recover form data
// 2. look for unique fields --- name
// 3. SEARCH DB (curl http://localhost/marks?name=scott#gross)
// 4. Return matching mark (if any) and fill-in form fields
export function findData() {
  log('Searching for existing record...');
  
  if (!STATE.name || STATE.name.trim() === '') {
    logError('Error: Name field is required to find data.');
    return; 
  }
  // construct search query
  let name = normalizeName(STATE.name);
  const url = "http://localhost:3000/marks?name=" + encodeURIComponent(name);
  log('Searching with URL:', url);
  log('Normalized name being searched:', name);
  
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
      const mark = data[0];      // Copy the contents of the mark object from the DB into the STATE object      STATE.name = denormalizeName(mark.name);
      
      STATE.name = denormalizeName(mark.name);
      
      STATE.org = mark.org || null;
      STATE.title = mark.title || null;
      
      // Handle array fields - if DB sends arrays use them, otherwise create single-item arrays
      STATE.lists.location = Array.isArray(mark.location) ? mark.location : [mark.location || ''];
      STATE.lists.phone = Array.isArray(mark.phone) ? mark.phone : [mark.phone || ''];
      STATE.lists.email = Array.isArray(mark.email) ? mark.email : [mark.email || ''];
      
      STATE.linkedin = mark.linkedin || null;
      STATE.on_x = mark.on_x || null;
      STATE.notes = mark.notes || null;

      // Update the form fields
      updateFormFromState();
      STATE.notes = mark.notes || null;

      // Update the form fields based on the updated STATE
      updateFormFromState();


    } else {
      log('No matching records found.');
    }
  })
  .catch(error => {
    log('Error finding data:', error.message);
  });
}


