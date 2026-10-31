/*
 * Phone number rules used by every form.
 *
 * Accepted:
 *   - Indian mobile: 10 digits starting with 6-9, optionally written with
 *     +91 / 91 / 0 in front and a space or "-" in the middle
 *     ("9876543210", "+91 98765 43210", "098765-43210")
 *   - other countries: "+" country code, then 6-14 digits
 *     ("+971 501234567", "+1 415-555-0134")
 */

export const PHONE_MAX_DIGITS = 15;

export const PHONE_ERROR = 'Enter a valid mobile number (10 digits for India, or + country code and number)';

// single spaces / hyphens may sit between any digits ("98765 43210", "987-654-3210")
const INDIAN = /^(?:\+?91[\s-]?|0)?[6-9](?:[\s-]?\d){9}$/;
const INTERNATIONAL = /^\+(?!91)\d(?:[\s-]?\d){6,14}$/;

/* same rule for the HTML pattern attribute (browsers compile it with the v flag) */
export const PHONE_PATTERN =
    '(?:\\+?91[\\s\\-]?|0)?[6-9](?:[\\s\\-]?[0-9]){9}|\\+(?!91)[0-9](?:[\\s\\-]?[0-9]){6,14}';

export const isValidPhone = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return false;
    return INDIAN.test(text) || INTERNATIONAL.test(text);
};

/* national number typed next to a separate country code select */
export const isValidNationalNumber = (value, countryCode = '+91') => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (countryCode === '+91') return /^[6-9]\d{9}$/.test(digits);
    return digits.length >= 6 && digits.length <= 14;
};

/*
 * Typing filter: digits, a leading "+", single spaces / hyphens between
 * digits; at most PHONE_MAX_DIGITS digits.
 */
export const cleanPhoneInput = (value) => {
    let text = String(value ?? '');
    // "+" anywhere before the first digit ("call +91 98765…")
    const firstDigit = text.search(/\d/);
    const plus = firstDigit > 0 && text.slice(0, firstDigit).includes('+');
    text = text
        .replace(/[^\d\s-]/g, ' ')
        .replace(/[\s-]{2,}/g, ' ')
        .replace(/^[\s-]+|[\s-]+$/g, '');
    let digits = 0;
    let out = '';
    for (const char of text) {
        if (/\d/.test(char)) {
            if (digits >= PHONE_MAX_DIGITS) break;
            digits += 1;
        }
        out += char;
    }
    return (plus ? '+' : '') + out;
};
