// http_utils.js
// Handles local DB communication for querying existing marks and submitting new ones

import { STATE } from './state.js';
import { log, logError } from "./sidebar.js";


const BASE_URL = "http://localhost:3000/marks";

// Function to read form values into STATE before saving
function readFormIntoState() {
  // Read the basic fields
  STATE.name = document.getElementById('name').value || null;
  STATE.email = document.getElementById('email').value || null;
  
  // Read notes field and parse key=value pairs
  const notesValue = document.getElementById('notes').value || '';
  STATE.notes = notesValue;
  
  // Parse key=value pairs from notes to populate other STATE fields
  if (notesValue) {
    const pairs = notesValue.split(' ');
    pairs.forEach(pair => {
      if (pair.includes('=')) {
        const [key, value] = pair.split('=');
        if (key && value && STATE.hasOwnProperty(key)) {
          // Convert string values to appropriate types
          if (key === 'outreachCount') {
            STATE[key] = parseInt(value) || 0;
          } else if (key === 'hasReplied') {
            STATE[key] = value === 'true';
          } else {
            STATE[key] = value;
          }
        }
      }
    });
  }
}

// Save or update data in the backend
export function saveData() {
  // Read current form values into STATE before sending
  readFormIntoState();
  
  if (!STATE.name || STATE.name.trim() === '') {
    logError('Error: Name field is required to save data.');
    return; 
  }

  // Create clean data object with only valid fields
  const data = {
    name: STATE.name,
    email: STATE.email,
    phone: STATE.phone,
    linkedin: STATE.linkedin,
    on_x: STATE.on_x,
    title: STATE.title,
    org: STATE.org,
    location: STATE.location,
    www: STATE.www,
    outreachCount: STATE.outreachCount,
    lastContact: STATE.lastContact,
    hasReplied: STATE.hasReplied,
    notes: STATE.notes
  };
  
  log('POSTing data to backend:', JSON.stringify(data, null, 2));
  
 
  fetch(BASE_URL, {
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
    log('Data saved successfully.');
    // log('Data saved successfully:', result);
  })
  .catch(error => {
    log('Error saving data:', error.message);
  });
}





// Find button functionality
// 1. recover form data
// 2. look for unique fields --- name, linkedin, on_x
// 3. SEARCH DB (curl http://localhost/marks?name=scott#gross)
// 4. Return matching mark (if any) and fill-in form fields
export async function findData(searchParams) {
  if (!searchParams || typeof searchParams !== 'object') {
    logError('Error: Search params must be an object.');
    return null;
  }
  
  let url = new URL( BASE_URL);
  let params = new URLSearchParams();
  
  // Handle each possible search parameter
  if (searchParams.name) {
    params.append('name', searchParams.name);
    log('Name being searched:', searchParams.name);
  }
  
  if (searchParams.linkedin) {
    params.append('linkedin', searchParams.linkedin);
    log('Linkedin being searched:', searchParams.linkedin);
  }
  
  if (searchParams.on_x) {
    params.append('on_x', searchParams.on_x);
    log('X handle being searched:', searchParams.on_x);
  }
  
  url.search = params.toString();
  // log('Searching with URL:', url.toString());
  
  try {
    // Make GET request to backend
    const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // log('Record found:', data[0]);
      const mark = data[0];

      // RETURN DB RECORD
      return mark;


    } else {
      log('No matching records found.');
      return null;
    }
  } catch (error) {
    log('Error finding data:', error.message);
    return null;
  }
}




