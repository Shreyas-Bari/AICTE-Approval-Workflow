import { hash, verify } from '@node-rs/argon2';

export const MAX_PASSWORD_INPUT_LENGTH = 1024;

/**
 * Hash a plaintext password using Argon2id with memory-hard parameters.
 * Recommended by OWASP for password hashing.
 *
 * @param password - Plaintext password to hash
 * @returns Argon2id password hash string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length > MAX_PASSWORD_INPUT_LENGTH) {
    throw new Error(`Password exceeds maximum allowed length of ${MAX_PASSWORD_INPUT_LENGTH} characters`);
  }

  return hash(password, {
    memoryCost: 19456, // 19 MB (OWASP minimum recommendation for Argon2id)
    timeCost: 2,       // 2 iterations
    parallelism: 1,    // Explicit single-threaded execution
    outputLen: 32
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 * Fails safely on invalid formats, oversized input, or mismatch without throwing uncaught errors.
 *
 * @param password - Plaintext password provided by user
 * @param passwordHash - Stored Argon2id hash string
 * @returns True if password matches hash, false otherwise
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (
    !password ||
    !passwordHash ||
    typeof password !== 'string' ||
    typeof passwordHash !== 'string' ||
    password.length > MAX_PASSWORD_INPUT_LENGTH
  ) {
    return false;
  }

  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
