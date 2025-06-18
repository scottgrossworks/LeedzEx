// x_parser.js
import { PortalParser } from './parser.js';

// X/Twitter-specific regex patterns
const X_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_-]{4,15})/i;

// Define comprehensive reserved paths list
const RESERVED_PATHS = [
    'home', 'explore', 'notifications', 'messages', 
    'search', 'settings', 'i', 'compose', 'admin', 
    'help', 'about', 'privacy', 'terms', 'downloads',
    'bookmarks', 'lists', 'topics', 'moments'
];

export class XParser extends PortalParser {
    constructor() {
        super();
        this.supportedKeys = ['profile', 'handle', 'name', 'bio'];
    }

    getKeys() {
        return this.supportedKeys;
    }


    // FIXME FIXME FIXME
    // there may be a better way to implement this
    // Accept URL parameter for consistent behavior with LinkedInParser
    isRelevantPage(url) {
        const testUrl = url || window.location.href;
        console.log('XParser: Checking relevance for URL:', testUrl);
        
        if (!X_REGEX.test(testUrl)) {
            return false;
        }
        
        // Extract path from URL
        const urlPath = new URL(testUrl).pathname.slice(1);
        
        // Check if path is one of the reserved paths
        return !RESERVED_PATHS.includes(urlPath.toLowerCase());
    }

    getValue(key) {
        if (!this.isRelevantPage()) {
            return null;
        }

        // THIS IS WHAT WE ARE LOOKING FOR
        // If no key provided, return profile URL (default behavior)
        if (!key) {
            return this._getProfileUrl();
        }

        // 6/16 -- THIS IS ALL AUTO-GENERATED AND MAY OR MAY NOT WORK
        switch(key) {
            case 'profile':
                return this._getProfileUrl();
            case 'handle':
                return this._getHandle();
            case 'name':
                return this._getName();
            case 'bio':
                return this._getBio();
            default:
                return null;
        }
    }

    _getProfileUrl() {
        // Check URL first (most reliable)
        const url = window.location.href;
        const urlMatch = url.match(X_REGEX);
        
        if (urlMatch && 
            urlMatch[1].length >= 4 && 
            urlMatch[1].length <= 15 && 
            !RESERVED_PATHS.includes(urlMatch[1].toLowerCase())) {
            return `x.com/${urlMatch[1].toLowerCase()}`;
        }
        
        // Try to extract from canonical link
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            const canonicalUrl = canonicalLink.getAttribute('href');
            const canonicalMatch = canonicalUrl.match(X_REGEX);
            
            if (canonicalMatch && !RESERVED_PATHS.includes(canonicalMatch[1].toLowerCase())) {
                return `x.com/${canonicalMatch[1]}`;
            }
        }
        
        return null;
    }

    _getHandle() {
        const url = this._getProfileUrl();
        return url ? url.split('/').pop() : null;
    }

    _getName() {
        // Try various X/Twitter selectors for name
        const nameElement = document.querySelector('[data-testid="UserName"]') ||
                          document.querySelector('[data-testid="UserProfileHeader-Name"]');
        return nameElement ? nameElement.textContent.trim() : null;
    }

    _getBio() {
        // Try various X/Twitter selectors for bio
        const bioElement = document.querySelector('[data-testid="UserDescription"]') ||
                         document.querySelector('[data-testid="UserProfileHeader-bio"]');
        return bioElement ? bioElement.textContent.trim() : null;
    }
}