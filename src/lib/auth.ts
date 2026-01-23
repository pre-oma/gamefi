// Password hashing utilities using Web Crypto API
// Note: SHA-256 is used for demo purposes. Production should use bcrypt/argon2.

/**
 * Generate a random salt for password hashing
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with SHA-256 and salt
 */
export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const passwordSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + passwordSalt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return { hash, salt: passwordSalt };
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Validate password strength
 * Returns an error message if invalid, or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (password.length > 100) {
    return 'Password must be less than 100 characters';
  }
  // For demo purposes, we keep requirements simple
  // Production should require mixed case, numbers, special chars
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
}
