"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResetUrl = exports.hashToken = exports.generatePasswordResetToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a random password reset token with a 10-minute expiration
 * @returns Password reset token object with hashed token, plain token, and expiration
 */
const generatePasswordResetToken = () => {
    // Generate a random 32-byte buffer and convert to hex string
    const plainToken = crypto_1.default.randomBytes(32).toString('hex');
    // Hash the token for storage in the database
    const hashedToken = crypto_1.default.createHash('sha256').update(plainToken).digest('hex');
    // Set expiration to 10 minutes from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    return {
        token: hashedToken,
        plainToken,
        expires,
    };
};
exports.generatePasswordResetToken = generatePasswordResetToken;
/**
 * Hash a token for comparison with stored token
 * @param token The plain token to hash
 * @returns The hashed token
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
/**
 * Build the complete reset URL with the token
 * @param token The reset token
 * @param baseUrl The base URL of the frontend
 * @returns The complete reset URL
 */
const buildResetUrl = (token, baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000') => {
    return `${baseUrl}/reset-password?token=${token}`;
};
exports.buildResetUrl = buildResetUrl;
