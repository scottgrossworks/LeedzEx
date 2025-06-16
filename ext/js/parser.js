export const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;
export const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:[\w]+\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_]{3,100})/i;
export const X_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_-]{4,15})/i;


// Define comprehensive reserved names list at the top of function
const RESERVED_PATHS = [
  'home', 'explore', 'notifications', 'messages', 
  'search', 'settings', 'i', 'compose', 'admin', 
  'help', 'about', 'privacy', 'terms', 'downloads',
  'bookmarks', 'lists', 'topics', 'moments'
];



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



// is this a linkedin profile page?
// if so, return the personal linked-in url
// return --> linkedin.com/in/somebody
// or return null if not a linkedin profile page
export function findLinkedin() {
  // Check URL first (most reliable)
  const url = window.location.href; 
  const urlMatch = url.match(LINKEDIN_REGEX);
  
    // Add URL validation
    if (urlMatch && urlMatch[1].length >= 3) {
        return `linkedin.com/in/${urlMatch[1].toLowerCase()}`;
    }
  
  // Check page title
  const title = document.title;
  if (title.includes(' | LinkedIn') || title.includes('LinkedIn Profile')) {
    // Try to extract from canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    // Add error handling for getAttribute
    if (canonicalLink?.getAttribute('href')) {
      const canonicalUrl = canonicalLink.getAttribute('href');
      const canonicalMatch = canonicalUrl.match(LINKEDIN_REGEX);
      if (canonicalMatch) {
        return `linkedin.com/in/${canonicalMatch[1]}`;
      }
    }
    
    // Try to extract from meta tags
    const metaOgUrl = document.querySelector('meta[property="og:url"]');
    if (metaOgUrl) {
      const ogUrl = metaOgUrl.getAttribute('content');
      const ogMatch = ogUrl.match(LINKEDIN_REGEX);
      if (ogMatch) {
        return `linkedin.com/in/${ogMatch[1]}`;
      }
    }
    
    // If we know it's LinkedIn but couldn't extract the exact profile,
    // check for profile elements on the page
    const profileSection = document.querySelector('.profile-background-image') || 
                          document.querySelector('.pv-top-card');
    
    if (profileSection) {
      // We're on a profile page but couldn't extract the URL
      // Return a generic format based on the current URL
      const pathParts = window.location.pathname.split('/');
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'in' && i + 1 < pathParts.length) {
          return `linkedin.com/in/${pathParts[i+1]}`;
        }
      }
    }
  }
  
  // Not a LinkedIn profile page
  return null;
}






// is this an x profile page?
// if so, return the personal x url
// return --> x.com/somebody
// or return null if not an x profile page
export function findX() {
  // Check URL first (most reliable)
  const url = window.location.href;
  
  // Check both x.com and twitter.com (since Twitter was rebranded to X)
  const urlMatch = url.match(X_REGEX);
  
  // Validate username length and check against reserved names
  if (urlMatch && 
      urlMatch[1].length >= 4 && 
      urlMatch[1].length <= 15 && 
      !RESERVED_PATHS.includes(urlMatch[1].toLowerCase())) {
    return `x.com/${urlMatch[1].toLowerCase()}`;
  }
  
  // Check page title
  const title = document.title;
  if (title.includes(' / X') || title.includes(' on X') || 
      title.includes(' / Twitter') || title.includes(' on Twitter')) {
    
    // Try to extract from canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const canonicalUrl = canonicalLink.getAttribute('href');
      const canonicalMatch = canonicalUrl.match(X_REGEX);
      
      
      // Update other checks to use the same reservedPaths array
      if (canonicalMatch && !RESERVED_PATHS.includes(canonicalMatch[1].toLowerCase())) {
        return `x.com/${canonicalMatch[1]}`;
      }
    }
    
    // Try to extract from meta tags
    const metaOgUrl = document.querySelector('meta[property="og:url"]');
    if (metaOgUrl) {
      const ogUrl = metaOgUrl.getAttribute('content');
      const ogMatch = ogUrl.match(X_REGEX);
      
      if (ogMatch && !RESERVED_PATHS.includes(ogMatch[1].toLowerCase())) {
      return `x.com/${ogMatch[1]}`;
      }
      
    }
    
    // Check for profile elements on the page
    const profileHeader = document.querySelector('[data-testid="UserName"]') || 
                         document.querySelector('[data-testid="UserProfileHeader"]');
    
    if (profileHeader) {
      // We're on a profile page but couldn't extract the URL
      // Try to get from URL path
      const pathParts = window.location.pathname.split('/');
      
      if (pathParts.length > 1 && !RESERVED_PATHS.includes(pathParts[1].toLowerCase())) {
      return `x.com/${pathParts[1]}`;
      }
      

    }
  }
  
  // Not an X profile page
  return null;
}
