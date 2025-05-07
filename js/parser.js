// parser.js
// GOAL: extract schema data for sidebar from whatever is in the DOM
// regex-based pruning and redaction

const REDACTED_TXT = '**********';
const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;



// This function is used to prune short lines from the blob of text
// It takes a blob of text and a minimum character length as input
//  
export function pruneShortLines(blob, minChars = 5) {
    const lines = blob.split(/\r?\n/);
    const kept = lines.filter(line => line.trim().length >= minChars);
    console.log(`[parser] Pruned ${lines.length - kept.length} short lines.`);
    return kept.join('\n');
  }
  

//
//Added specific validation for email addresses
//Checks for @ or . characters before/after potential email matches
//Separated the length check as its own condition
//Both types now have proper edge case handling
//This will help prevent false matches like:
//
//user@domain.com@example.com (would only match the first email)
//user.@domain..com (would be rejected due to adjacent dots)
//
//

  export function extractAndRedact(blob, emailArray, phoneArray) {

    console.log("[parser] Extracting and redacting emails and phone numbers.");

    // Helper to simulate negative lookbehind/lookahead
    const safeReplace = (text, regex, array, label) => {
      return text.replace(regex, (match, offset) => {
        const before = text[offset - 1];
        const after = text[offset + match.length];
        
        // Handle edge cases for both types
        if (label === 'phone' && (/\d/.test(before) || /\d/.test(after))) {
          return match; // Skip phone numbers with adjacent digits
        }
        if (label === 'email' && (/[@\.]/.test(before) || /[@\.]/.test(after))) {
          return match; // Skip email-like strings with adjacent @ or dots
        }
        if (match.length < 7) {
          return match; // Skip anything too short for either type
        }

        array.push(match);
        return REDACTED_TXT;
      });
    };
  
    let redacted = blob;
    
    redacted = safeReplace(redacted, EMAIL_REGEX, emailArray, 'email');
    redacted = safeReplace(redacted, PHONE_REGEX, phoneArray, 'phone');
  
    return redacted;
  
  }


