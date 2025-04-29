import crypto from 'crypto';

// Interface for password reset token data
export interface PasswordResetToken {
  token: string;        // Hashed token stored in the database
  plainToken: string;   // Plain token sent to the user (not stored)
  expires: Date;        // Expiration date (10 minutes from creation)
}

/**
 * Generate a random password reset token with a 10-minute expiration
 * @returns Password reset token object with hashed token, plain token, and expiration
 */
export const generatePasswordResetToken = (): PasswordResetToken => {
  // Generate a random 32-byte buffer and convert to hex string
  const plainToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage in the database
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  
  // Set expiration to 10 minutes from now
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  
  return {
    token: hashedToken,
    plainToken,
    expires,
  };
};

/**
 * Hash a token for comparison with stored token
 * @param token The plain token to hash
 * @returns The hashed token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Build the complete reset URL with the token
 * @param token The reset token
 * @param baseUrl The base URL of the frontend
 * @returns The complete reset URL
 */
export const buildResetUrl = (token: string, baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'): string => {
  return `${baseUrl}/reset-password?token=${token}`;
}; 