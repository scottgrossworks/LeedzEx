// fix_db.js - Utility to fix '0' phone numbers in database

const BASE_URL = "http://localhost:3000/marks";

// Function to fix a specific record by ID
async function fixPhoneNumberById(id) {
  try {
    console.log("FINDING PHONE NUMBERS...." + id);

    // 1. Fetch the record
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
      console.error(`Failed to fetch record with ID: ${id}`);
      return false;
    }
    
    const record = await response.json();
    console.log(`Found record: ${record.name}`);
    
    // 2. Fix phone numbers
    let needsUpdate = false;
    
    if (record.phone === 0 || record.phone === '0') {
      record.phone = null;
      needsUpdate = true;
      console.log(`Fixed phone number for ${record.name}`);
    }
    
    // 3. Update the record if needed
    if (needsUpdate) {
      const updateResponse = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });
      
      if (updateResponse.ok) {
        console.log(`Successfully updated record for ${record.name}`);
        return true;
      } else {
        console.error(`Failed to update record for ${record.name}`);
        return false;
      }
    } else {
      console.log(`No changes needed for ${record.name}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing record ${id}:`, error);
    return false;
  }
}

// Function to fix all records in the database
async function fixAllPhoneNumbers() {
  try {
    console.log("FIXING PHONE NUMBERS....");
    // 1. Fetch all records
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      console.error('Failed to fetch records');
      return;
    }
    
    const records = await response.json();
    console.log(`Found ${records.length} records to check`);
    
    // 2. Process each record
    let fixedCount = 0;
    for (const record of records) {
      if (record.phone === 0 || record.phone === '0') {
        console.log(`Found record with '0' phone: ${record.name} (ID: ${record.id})`);
        
        // Create updated record with null phone
        const updatedRecord = { ...record, phone: null };
        
        // Update the record using POST (server handles updates via POST)
        const updateResponse = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedRecord)
        });
        
        if (updateResponse.ok) {
          console.log(`Successfully updated record for ${record.name}`);
          fixedCount++;
        } else {
          console.error(`Failed to update record for ${record.name}`);
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} records with '0' phone numbers`);
  } catch (error) {
    console.error('Error fixing phone numbers:', error);
  }
}

// Fix a specific record
// Example: fixPhoneNumberById("albert#53679176");

// Fix all records
fixAllPhoneNumbers();

// Export functions for use in other scripts
module.exports = {
  fixPhoneNumberById,
  fixAllPhoneNumbers
};