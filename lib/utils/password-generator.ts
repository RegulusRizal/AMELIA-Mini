/**
 * Generate a cryptographically secure password
 * @param length - Password length (default 12, minimum 8)
 * @returns A secure random password string
 */
export function generateSecurePassword(length: number = 12): string {
  // Enforce minimum length for security
  const len = Math.max(8, length);
  
  // Character sets
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  
  // Generate random values using Web Crypto API
  const randomValues = new Uint32Array(len);
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else if (typeof global !== 'undefined' && global.crypto) {
    // Node.js environment
    (global.crypto as any).getRandomValues(randomValues);
  } else {
    // Fallback to Node's crypto module (server-side)
    const crypto = require('crypto');
    crypto.randomFillSync(randomValues);
  }
  
  // Helper to pick a character from a set
  const pick = (set: string, index: number) => set[randomValues[index] % set.length];
  
  // Ensure at least one character from each set
  const password: string[] = [
    pick(upper, 0),
    pick(lower, 1),
    pick(digits, 2),
    pick(symbols, 3)
  ];
  
  // Fill the rest with random characters from all sets
  for (let i = 4; i < len; i++) {
    password.push(all[randomValues[i] % all.length]);
  }
  
  // Shuffle the password array using Fisher-Yates algorithm
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (errors.length === 0) {
    if (password.length >= 12 && /[A-Z].*[A-Z]/.test(password) && /[0-9].*[0-9]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}