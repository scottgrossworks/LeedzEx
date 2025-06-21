//
//
//

// Portal Parser Interface
class PortalParser {


    constructor() {
        if (this.constructor === PortalParser) {
            throw new Error("Abstract class 'PortalParser' cannot be instantiated directly.");
        }

        // Common regex patterns used across parsers
        this.PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
        this.EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;
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


    
  // ───────────────────────────────────────────────────────────────
  //  ONE GENERIC STATIC HELPER  (observer + polling + timeout)
  // ───────────────────────────────────────────────────────────────
  static waitForElement(selector, timeout = 15000, pollMs = 120) {
    return new Promise((resolve, reject) => {
      const test = () => document.querySelector(selector);
      if (test()) return resolve(true);

      const obs = new MutationObserver(() => { if (test()) done(true); });
      const poll = setInterval(() => { if (test()) done(true); }, pollMs);
      const to   = setTimeout(()   => done(false), timeout);

      function done(found) {
        clearInterval(poll);
        clearTimeout(to);
        obs.disconnect();
        return found ? resolve(true) : reject(new Error(
          `waitForElement timed-out (${timeout} ms) waiting for ${selector}`));
      }
      obs.observe(document.documentElement, {childList:true,subtree:true});
    });
  }

  // each subclass **must** implement:
  async waitUntilReady() { throw new Error('waitUntilReady() not implemented'); }



}

window.PortalParser = PortalParser;

// Define comprehensive reserved names list at the top of function
const RESERVED_PATHS = [
  'home', 'explore', 'notifications', 'messages', 
  'search', 'settings', 'i', 'compose', 'admin', 
  'help', 'about', 'privacy', 'terms', 'downloads',
  'bookmarks', 'lists', 'topics', 'moments'
];







function extractMatches(text, regex, label) {
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

function pruneShortLines(blob, minChars = 5) {
  const lines = blob.split(/\r?\n/);
  return lines.filter(line => line.trim().length >= minChars).join('\n');
}


