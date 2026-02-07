import crypto from 'crypto';

/**
 * Encryption Utilities for AiCollabForTheKids
 * Mission: FOR THE KIDS - Secure user data while supporting children's charities
 * 
 * Used for encrypting sensitive PII (government IDs) with AES-256-GCM
 * Per Jules' directive: Minimal retention, maximum security
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits for AES-256

/**
 * Get encryption key from environment
 * CRITICAL: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured in environment');
  }
  
  const keyBuffer = Buffer.from(key, 'hex');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex characters)`);
  }
  
  return keyBuffer;
}

/**
 * Encrypt sensitive data (e.g., government ID numbers, SSN)
 * Returns: { encrypted: string, iv: string, authTag: string }
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {Object} Encrypted data with IV and auth tag
 */
export function encrypt(plaintext) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 * 
 * @param {string} encrypted - Encrypted data (hex)
 * @param {string} iv - Initialization vector (hex)
 * @param {string} authTag - Authentication tag (hex)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encrypted, iv, authTag) {
  try {
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error.message);
    throw new Error('Decryption failed - data may be corrupted');
  }
}

/**
 * Hash data for privacy (one-way, for IP addresses, user agents, etc.)
 * Used when we need to track data without storing original value
 * 
 * @param {string} data - Data to hash
 * @param {string} salt - Salt (from environment or custom)
 * @returns {string} SHA-256 hash (hex)
 */
export function hashData(data, salt = process.env.SALT) {
  if (!salt) {
    throw new Error('SALT not configured in environment');
  }
  
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

/**
 * Generate secure random token (for session IDs, verification tokens, etc.)
 * 
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex-encoded random token
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate UUID v4
 * 
 * @returns {string} UUID
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Securely compare two strings (constant-time comparison)
 * Prevents timing attacks
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if equal
 */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}

/**
 * Hash password using bcrypt-compatible PBKDF2
 * (Use bcrypt library for production, this is fallback)
 * 
 * @param {string} password - Plain password
 * @param {number} rounds - Iteration count (default: 10000)
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password, rounds = 10000) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    
    crypto.pbkdf2(password, salt, rounds, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      
      // Format: rounds$salt$hash
      const hash = `${rounds}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
}

/**
 * Verify password against hash
 * 
 * @param {string} password - Plain password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const parts = hash.split('$');
    
    if (parts.length !== 3) {
      return resolve(false);
    }
    
    const rounds = parseInt(parts[0], 10);
    const salt = Buffer.from(parts[1], 'hex');
    const storedHash = parts[2];
    
    crypto.pbkdf2(password, salt, rounds, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      
      const computedHash = derivedKey.toString('hex');
      resolve(secureCompare(computedHash, storedHash));
    });
  });
}

/**
 * Sanitize filename for secure storage
 * Prevents path traversal attacks
 * 
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special chars
    .replace(/\.\.+/g, '.') // Remove multiple dots
    .substring(0, 255); // Limit length
}

/**
 * Generate secure upload path for ID verification
 * Format: YYYY/MM/DD/user_id/verification_id_timestamp.ext
 * 
 * @param {string} userId - User ID
 * @param {string} verificationId - Verification ID
 * @param {string} extension - File extension
 * @returns {string} Upload path
 */
export function generateSecureUploadPath(userId, verificationId, extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime();
  
  const safeExt = sanitizeFilename(extension);
  
  return `${year}/${month}/${day}/${userId}/${verificationId}_${timestamp}.${safeExt}`;
}

export default {
  encrypt,
  decrypt,
  hashData,
  generateToken,
  generateUUID,
  secureCompare,
  hashPassword,
  verifyPassword,
  sanitizeFilename,
  generateSecureUploadPath
};
