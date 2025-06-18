
// Common regex patterns used across parsers
export const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;




// Portal Parser Interface
export class PortalParser {
    constructor() {
        if (this.constructor === PortalParser) {
            throw new Error("Abstract class 'PortalParser' cannot be instantiated directly.");
        }
    }

    /**
     * Get the value for a specific key from the current page
     * @param {string} [key] - Optional key to get specific data. If not provided, returns default value
     * @returns {string|null} The requested value or null if not found
     */
    getValue(key) {
        throw new Error("getValue() must be implemented by subclass");
    }

    /**
     * Get all supported keys for this parser
     * @returns {string[]} Array of supported keys
     */
    getKeys() {
        throw new Error("getKeys() must be implemented by subclass");
    }

    /**
     * Check if current page is relevant for this parser
     * @returns {boolean} True if the current page can be parsed
     */
    isRelevantPage() {
        throw new Error("isRelevantPage() must be implemented by subclass");
    }
}



// Define comprehensive reserved names list at the top of function
const RESERVED_PATHS = [
  'home', 'explore', 'notifications', 'messages', 
  'search', 'settings', 'i', 'compose', 'admin', 
  'help', 'about', 'privacy', 'terms', 'downloads',
  'bookmarks', 'lists', 'topics', 'moments'
];
















// Helper function to normalize a name for storage/searching
export function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\s/g, '#');  // Replace spaces with #
}





// Helper function to denormalize a name for display
export function denormalizeName(normalizedName) {
  if (!normalizedName) return '';
  
  // Replace # with spaces
  const nameWithSpaces = normalizedName.replace(/#/g, ' ');
  
  // Capitalize first letter of each word
  return nameWithSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}






export function extractMatches(text, regex, label) {
  const results = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const value = match[0];

    if (value.length < 7) continue;

    if (label === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) results.push(digits);
    } else {
      results.push(value.trim());
    }
  }

  return results;
}

export function pruneShortLines(blob, minChars = 5) {
  const lines = blob.split(/\r?\n/);
  return lines.filter(line => line.trim().length >= minChars).join('\n');
}


