// parser.js
// GOAL: extract schema data for sidebar from whatever is in the DOM
// regex-based pruning and redaction

const REDACTED_TXT = '**********';
const PHONE_REGEX = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/g;
const MATCH_ALL = /^.+$/;

const VALIDATORS = {
    phone: PHONE_REGEX,
    email: EMAIL_REGEX,
    name: MATCH_ALL,
    date: MATCH_ALL,
    time: MATCH_ALL,
    location: MATCH_ALL,
    notes: MATCH_ALL
};

export function pruneShortLines(blob, minChars = 5) {
    const lines = blob.split(/\r?\n/);
    const kept = lines.filter(line => line.trim().length >= minChars);
    console.log(`[parser] Pruned ${lines.length - kept.length} short lines.`);
    return kept.join('\n');
}

export function extractAndRedact(blob, emailArray, phoneArray) {
    const safeReplace = (text, regex, array, label) => {
        return text.replace(regex, (match, offset) => {
            const before = text[offset - 1];
            const after = text[offset + match.length];

            if (label === 'phone' && (/\d/.test(before) || /\d/.test(after))) return match;
            if (label === 'email' && (/[@\.]/.test(before) || /[@\.]/.test(after))) return match;
            if (match.length < 7) return match;

            array.push(match);
            return REDACTED_TXT;
        });
    };

    let redacted = safeReplace(blob, EMAIL_REGEX, emailArray, 'email');
    redacted = safeReplace(redacted, PHONE_REGEX, phoneArray, 'phone');
    return redacted;
}

