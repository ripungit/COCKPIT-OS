"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.normalizeUsername = normalizeUsername;
exports.generateRandomString = generateRandomString;
exports.maskEmail = maskEmail;
exports.sha256 = sha256;
function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
function normalizeUsername(username) {
    return username.toLowerCase().trim();
}
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}
function maskEmail(email) {
    const [local, domain] = email.split('@');
    if (!local || !domain)
        return '***';
    if (local.length <= 1)
        return `${local}***@${domain}`;
    return `${local[0]}***@${domain}`;
}
function sha256(input) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
}
//# sourceMappingURL=strings.util.js.map