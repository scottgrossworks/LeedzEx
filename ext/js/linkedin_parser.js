

// Broader LinkedIn regex: matches any URL containing 'linkedin.com'
const LINKEDIN_REGEX = /linkedin\.com/i;

class LinkedInParser extends window.PortalParser {
    constructor() {
        super();
        this.supportedKeys = ['profile', 'name', 'title', 'org', 'location'];
        this.realUrl = null;
        this._ready = false;
    }

    getKeys() {
        return this.supportedKeys;
    }

    // Accepts a url parameter for minimal sidebar/content separation
    isRelevantPage(url) {
        const testUrl = url || window.location.href;
        if (url) {
            this.realUrl = url; // Store the real URL when provided
        }
        return LINKEDIN_REGEX.test(testUrl);
    }

    async waitUntilReady() {
        await PortalParser.waitForElement('h1');   // blocks until <h1> exists
    }



    getValue(key, url) {
        // Always use the stored real URL or passed URL
        const testUrl = url || this.realUrl || window.location.href;
        if (!this.isRelevantPage(testUrl)) {
            return null;
        }


        // If no key provided, return profile URL (default behavior)
        if (!key) {
            return this._getProfileUrl(testUrl);
        }

        switch(key) {
            case 'profile':
                return this._getProfileUrl(testUrl);
            case 'name':
                return this._getName();
            case 'title':
                return this._getTitle();
            case 'org':
                return this._getOrg();
            case 'location':
                return this._getLocation();
            default:
                return null;
        }
    }


    // for LinkedIn, the profile URL should be the current tab’s URL
    // normalized (remove protocol and www)
    //
    _getProfileUrl(url) {
        if (!url) url = window.location.href;
        return url.replace(/^https?:\/\/(www\.)?/, '');
    }

    _getName() {
        // look for the <h1> tag
        const h1 = document.querySelector('h1');
        console.log("FOUND H1?", h1 ? h1.textContent : null);
        return h1 ? h1.textContent.trim() : null;
    }

    _getTitle() {
        // Try various LinkedIn selectors for title
        const titleElement = document.querySelector('[data-field="headline"]') ||
                           document.querySelector('.pv-top-card-section__headline') ||
                           document.querySelector('.profile-overview-card__headline');
        return titleElement ? titleElement.textContent.trim() : null;
    }

    _getOrg() {
        // Try various LinkedIn selectors for current organization
        const orgElement = document.querySelector('.pv-top-card-v2-section__company-name') ||
                         document.querySelector('.profile-overview-card__company-name');
        return orgElement ? orgElement.textContent.trim() : null;
    }

    _getLocation() {
        // Try various LinkedIn selectors for location
        const locationElement = document.querySelector('.pv-top-card-section__location') ||
                              document.querySelector('.profile-overview-card__location');
        return locationElement ? locationElement.textContent.trim() : null;
    }
}

window.LinkedInParser = LinkedInParser;