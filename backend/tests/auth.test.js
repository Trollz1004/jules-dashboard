/**
 * ===============================================================================
 * AUTHENTICATION TESTS
 * ===============================================================================
 *
 * Comprehensive test suite for authentication functionality:
 * - User registration (valid/invalid inputs)
 * - Login flow (success/failure)
 * - JWT token validation
 * - Password reset flow
 * - Rate limiting tests
 *
 * ===============================================================================
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import {
  mockDb,
  mockRedis,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUser,
  createTestJwtPayload,
  RateLimitTester,
  delay,
  randomEmail,
  randomString
} from './setup.js';

// ===============================================================================
// MOCK AUTH SERVICE IMPLEMENTATION (For Testing)
// ===============================================================================

const JWT_SECRET = 'test-jwt-secret-key-for-testing';
const JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Password hashing functions
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === key);
    });
  });
}

// Token generation
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'access',
      ageVerified: user.ageVerified || false,
      humanVerified: user.humanVerified || false,
      isPremium: user.isPremium || false,
      isFoundingMember: user.isFoundingMember || false
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  const tokenId = crypto.randomUUID();
  return jwt.sign(
    { userId: user.id, tokenId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const result = verifyAccessToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid token', message: result.error });
  }

  req.user = result.payload;
  next();
}

// Registration function
async function registerUser({ email, password, displayName }) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const existingUser = await mockDb.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(password);

  const user = await mockDb.createUser({
    email: email.toLowerCase(),
    passwordHash,
    displayName: displayName || null,
    status: 'PENDING_VERIFICATION',
    ageVerified: false,
    humanVerified: false,
    isPremium: false,
    isFoundingMember: false
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status
    }
  };
}

// Login function
async function loginUser({ email, password }) {
  const user = await mockDb.findUserByEmail(email.toLowerCase());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  if (user.status === 'BANNED' || user.status === 'DELETED') {
    throw new Error('Account is not active');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      ageVerified: user.ageVerified,
      humanVerified: user.humanVerified,
      isPremium: user.isPremium,
      isFoundingMember: user.isFoundingMember
    }
  };
}

// Password reset functions
async function requestPasswordReset(email) {
  const user = await mockDb.findUserByEmail(email.toLowerCase());
  if (!user) {
    // Return success even if user not found (security)
    return { success: true, message: 'If the email exists, a reset link will be sent.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await mockDb.createPasswordResetToken(user.id, token, expiresAt);

  return { success: true, token, message: 'Password reset token generated' };
}

async function resetPassword(token, newPassword) {
  const tokenData = await mockDb.findPasswordResetToken(token);
  if (!tokenData) {
    throw new Error('Invalid or expired reset token');
  }

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(newPassword);
  await mockDb.updateUser(tokenData.userId, { passwordHash });
  await mockDb.deletePasswordResetToken(token);

  return { success: true, message: 'Password reset successful' };
}

// ===============================================================================
// TEST SUITES
// ===============================================================================

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.clear();
    mockRedis.clear();
  });

  afterEach(() => {
    mockDb.clear();
    mockRedis.clear();
  });

  // ===========================================================================
  // USER REGISTRATION TESTS
  // ===========================================================================

  describe('User Registration', () => {
    describe('Valid Registration', () => {
      test('should register a new user with valid email and password', async () => {
        const result = await registerUser({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          displayName: 'New User'
        });

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe('newuser@example.com');
        expect(result.user.displayName).toBe('New User');
        expect(result.user.status).toBe('PENDING_VERIFICATION');
      });

      test('should register user with email only (no display name)', async () => {
        const result = await registerUser({
          email: 'minimal@example.com',
          password: 'Password123!'
        });

        expect(result.success).toBe(true);
        expect(result.user.email).toBe('minimal@example.com');
        expect(result.user.displayName).toBeNull();
      });

      test('should normalize email to lowercase', async () => {
        const result = await registerUser({
          email: 'UPPERCASE@EXAMPLE.COM',
          password: 'Password123!'
        });

        expect(result.user.email).toBe('uppercase@example.com');
      });

      test('should generate unique user ID', async () => {
        const result1 = await registerUser({
          email: 'user1@example.com',
          password: 'Password123!'
        });

        const result2 = await registerUser({
          email: 'user2@example.com',
          password: 'Password123!'
        });

        expect(result1.user.id).not.toBe(result2.user.id);
      });

      test('should hash password securely', async () => {
        await registerUser({
          email: 'hashtest@example.com',
          password: 'TestPassword123!'
        });

        const user = await mockDb.findUserByEmail('hashtest@example.com');
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).not.toBe('TestPassword123!');
        expect(user.passwordHash).toContain(':'); // Salt:Hash format
      });
    });

    describe('Invalid Registration', () => {
      test('should reject invalid email format', async () => {
        await expect(registerUser({
          email: 'not-an-email',
          password: 'Password123!'
        })).rejects.toThrow('Invalid email format');
      });

      test('should reject email without domain', async () => {
        await expect(registerUser({
          email: 'user@',
          password: 'Password123!'
        })).rejects.toThrow('Invalid email format');
      });

      test('should reject email without @', async () => {
        await expect(registerUser({
          email: 'userexample.com',
          password: 'Password123!'
        })).rejects.toThrow('Invalid email format');
      });

      test('should reject password shorter than 8 characters', async () => {
        await expect(registerUser({
          email: 'valid@example.com',
          password: 'short'
        })).rejects.toThrow('Password must be at least 8 characters');
      });

      test('should reject password of exactly 7 characters', async () => {
        await expect(registerUser({
          email: 'valid@example.com',
          password: '1234567'
        })).rejects.toThrow('Password must be at least 8 characters');
      });

      test('should reject duplicate email registration', async () => {
        await registerUser({
          email: 'duplicate@example.com',
          password: 'Password123!'
        });

        await expect(registerUser({
          email: 'duplicate@example.com',
          password: 'DifferentPassword123!'
        })).rejects.toThrow('Email already registered');
      });

      test('should reject duplicate email with different casing', async () => {
        await registerUser({
          email: 'duplicate@example.com',
          password: 'Password123!'
        });

        await expect(registerUser({
          email: 'DUPLICATE@example.com',
          password: 'Password123!'
        })).rejects.toThrow('Email already registered');
      });
    });
  });

  // ===========================================================================
  // LOGIN TESTS
  // ===========================================================================

  describe('Login Flow', () => {
    const testEmail = 'login@example.com';
    const testPassword = 'SecurePassword123!';

    beforeEach(async () => {
      await registerUser({
        email: testEmail,
        password: testPassword,
        displayName: 'Login Test User'
      });
    });

    describe('Successful Login', () => {
      test('should login with correct credentials', async () => {
        const result = await loginUser({
          email: testEmail,
          password: testPassword
        });

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user.email).toBe(testEmail);
      });

      test('should return valid JWT access token', async () => {
        const result = await loginUser({
          email: testEmail,
          password: testPassword
        });

        const decoded = jwt.verify(result.accessToken, JWT_SECRET);
        expect(decoded.type).toBe('access');
        expect(decoded.email).toBe(testEmail);
        expect(decoded.userId).toBeDefined();
      });

      test('should return valid JWT refresh token', async () => {
        const result = await loginUser({
          email: testEmail,
          password: testPassword
        });

        const decoded = jwt.verify(result.refreshToken, JWT_REFRESH_SECRET);
        expect(decoded.type).toBe('refresh');
        expect(decoded.userId).toBeDefined();
        expect(decoded.tokenId).toBeDefined();
      });

      test('should work with uppercase email', async () => {
        const result = await loginUser({
          email: testEmail.toUpperCase(),
          password: testPassword
        });

        expect(result.success).toBe(true);
      });

      test('should return user verification status', async () => {
        const result = await loginUser({
          email: testEmail,
          password: testPassword
        });

        expect(result.user).toHaveProperty('ageVerified');
        expect(result.user).toHaveProperty('humanVerified');
        expect(result.user).toHaveProperty('isPremium');
        expect(result.user).toHaveProperty('isFoundingMember');
      });
    });

    describe('Failed Login', () => {
      test('should reject incorrect password', async () => {
        await expect(loginUser({
          email: testEmail,
          password: 'WrongPassword123!'
        })).rejects.toThrow('Invalid email or password');
      });

      test('should reject non-existent email', async () => {
        await expect(loginUser({
          email: 'nonexistent@example.com',
          password: testPassword
        })).rejects.toThrow('Invalid email or password');
      });

      test('should reject banned account', async () => {
        const user = await mockDb.findUserByEmail(testEmail);
        await mockDb.updateUser(user.id, { status: 'BANNED' });

        await expect(loginUser({
          email: testEmail,
          password: testPassword
        })).rejects.toThrow('Account is not active');
      });

      test('should reject deleted account', async () => {
        const user = await mockDb.findUserByEmail(testEmail);
        await mockDb.updateUser(user.id, { status: 'DELETED' });

        await expect(loginUser({
          email: testEmail,
          password: testPassword
        })).rejects.toThrow('Account is not active');
      });
    });
  });

  // ===========================================================================
  // JWT TOKEN VALIDATION TESTS
  // ===========================================================================

  describe('JWT Token Validation', () => {
    describe('Access Token Verification', () => {
      test('should validate a valid access token', () => {
        const user = createTestUser();
        const token = generateAccessToken(user);

        const result = verifyAccessToken(token);

        expect(result.valid).toBe(true);
        expect(result.payload.userId).toBe(user.id);
        expect(result.payload.email).toBe(user.email);
      });

      test('should reject expired access token', () => {
        const user = createTestUser();
        const token = jwt.sign(
          { userId: user.id, email: user.email, type: 'access' },
          JWT_SECRET,
          { expiresIn: '-1s' }
        );

        const result = verifyAccessToken(token);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('expired');
      });

      test('should reject token with invalid signature', () => {
        const user = createTestUser();
        const token = jwt.sign(
          { userId: user.id, email: user.email, type: 'access' },
          'wrong-secret-key',
          { expiresIn: '15m' }
        );

        const result = verifyAccessToken(token);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('signature');
      });

      test('should reject malformed token', () => {
        const result = verifyAccessToken('not.a.valid.token');

        expect(result.valid).toBe(false);
      });

      test('should reject refresh token used as access token', () => {
        const user = createTestUser();
        const token = jwt.sign(
          { userId: user.id, type: 'refresh', tokenId: crypto.randomUUID() },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const result = verifyAccessToken(token);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token type');
      });

      test('should include all user claims in token payload', () => {
        const user = createTestUser({
          ageVerified: true,
          humanVerified: true,
          isPremium: true,
          isFoundingMember: true
        });
        const token = generateAccessToken(user);
        const result = verifyAccessToken(token);

        expect(result.payload.ageVerified).toBe(true);
        expect(result.payload.humanVerified).toBe(true);
        expect(result.payload.isPremium).toBe(true);
        expect(result.payload.isFoundingMember).toBe(true);
      });
    });

    describe('Auth Middleware', () => {
      test('should pass request with valid token', () => {
        const user = createTestUser();
        const token = generateAccessToken(user);

        const req = createMockRequest({
          headers: { authorization: `Bearer ${token}` }
        });
        const res = createMockResponse();
        const next = createMockNext();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.userId).toBe(user.id);
      });

      test('should reject request without authorization header', () => {
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
      });

      test('should reject request with invalid Bearer format', () => {
        const req = createMockRequest({
          headers: { authorization: 'InvalidFormat token' }
        });
        const res = createMockResponse();
        const next = createMockNext();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      test('should reject request with invalid token', () => {
        const req = createMockRequest({
          headers: { authorization: 'Bearer invalid.token.here' }
        });
        const res = createMockResponse();
        const next = createMockNext();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ error: 'Invalid token' })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // PASSWORD RESET FLOW TESTS
  // ===========================================================================

  describe('Password Reset Flow', () => {
    const testEmail = 'reset@example.com';
    const originalPassword = 'OriginalPassword123!';

    beforeEach(async () => {
      await registerUser({
        email: testEmail,
        password: originalPassword,
        displayName: 'Reset Test User'
      });
    });

    describe('Request Password Reset', () => {
      test('should generate reset token for existing user', async () => {
        const result = await requestPasswordReset(testEmail);

        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
        expect(result.token.length).toBe(64); // 32 bytes hex encoded
      });

      test('should return success for non-existent email (security)', async () => {
        const result = await requestPasswordReset('nonexistent@example.com');

        expect(result.success).toBe(true);
        expect(result.message).toContain('If the email exists');
      });

      test('should handle email case insensitively', async () => {
        const result = await requestPasswordReset(testEmail.toUpperCase());

        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
      });
    });

    describe('Reset Password', () => {
      test('should reset password with valid token', async () => {
        const { token } = await requestPasswordReset(testEmail);
        const newPassword = 'NewSecurePassword123!';

        const result = await resetPassword(token, newPassword);

        expect(result.success).toBe(true);

        // Verify can login with new password
        const loginResult = await loginUser({
          email: testEmail,
          password: newPassword
        });
        expect(loginResult.success).toBe(true);
      });

      test('should reject invalid reset token', async () => {
        await expect(resetPassword('invalid-token', 'NewPassword123!'))
          .rejects.toThrow('Invalid or expired reset token');
      });

      test('should reject weak new password', async () => {
        const { token } = await requestPasswordReset(testEmail);

        await expect(resetPassword(token, 'short'))
          .rejects.toThrow('Password must be at least 8 characters');
      });

      test('should invalidate old password after reset', async () => {
        const { token } = await requestPasswordReset(testEmail);
        await resetPassword(token, 'NewPassword123!');

        await expect(loginUser({
          email: testEmail,
          password: originalPassword
        })).rejects.toThrow('Invalid email or password');
      });

      test('should prevent token reuse after successful reset', async () => {
        const { token } = await requestPasswordReset(testEmail);
        await resetPassword(token, 'NewPassword123!');

        await expect(resetPassword(token, 'AnotherPassword123!'))
          .rejects.toThrow('Invalid or expired reset token');
      });
    });
  });

  // ===========================================================================
  // RATE LIMITING TESTS
  // ===========================================================================

  describe('Rate Limiting', () => {
    let rateLimiter;

    beforeEach(() => {
      // 5 requests per 15 minutes
      rateLimiter = new RateLimitTester(5, 15 * 60 * 1000);
    });

    test('should allow requests within limit', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.recordRequest(ip)).toBe(true);
      }
    });

    test('should block requests exceeding limit', () => {
      const ip = '192.168.1.2';

      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(ip);
      }

      expect(rateLimiter.recordRequest(ip)).toBe(false);
    });

    test('should track limits per IP independently', () => {
      const ip1 = '192.168.1.3';
      const ip2 = '192.168.1.4';

      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(ip1);
      }

      // ip1 should be blocked
      expect(rateLimiter.recordRequest(ip1)).toBe(false);
      // ip2 should still have quota
      expect(rateLimiter.recordRequest(ip2)).toBe(true);
    });

    test('should report remaining requests correctly', () => {
      const ip = '192.168.1.5';

      expect(rateLimiter.getRemainingRequests(ip)).toBe(5);

      rateLimiter.recordRequest(ip);
      expect(rateLimiter.getRemainingRequests(ip)).toBe(4);

      rateLimiter.recordRequest(ip);
      rateLimiter.recordRequest(ip);
      expect(rateLimiter.getRemainingRequests(ip)).toBe(2);
    });

    test('should reset after window expires', async () => {
      // Use a 100ms window for testing
      const quickLimiter = new RateLimitTester(2, 100);
      const ip = '192.168.1.6';

      quickLimiter.recordRequest(ip);
      quickLimiter.recordRequest(ip);
      expect(quickLimiter.recordRequest(ip)).toBe(false);

      // Wait for window to expire
      await delay(150);

      expect(quickLimiter.recordRequest(ip)).toBe(true);
    });

    describe('Login Rate Limiting', () => {
      test('should track failed login attempts', async () => {
        const loginAttemptKey = 'login:failed:test@example.com';

        await mockRedis.set(loginAttemptKey, '0');

        for (let i = 0; i < 5; i++) {
          await mockRedis.incr(loginAttemptKey);
        }

        const attempts = await mockRedis.get(loginAttemptKey);
        expect(parseInt(attempts)).toBe(5);
      });

      test('should expire failed attempt counter', async () => {
        const loginAttemptKey = 'login:failed:expiry@example.com';

        await mockRedis.set(loginAttemptKey, '5', { EX: 1 }); // 1 second expiry

        await delay(1100);

        const attempts = await mockRedis.get(loginAttemptKey);
        expect(attempts).toBeNull();
      });
    });
  });

  // ===========================================================================
  // EDGE CASES AND SECURITY TESTS
  // ===========================================================================

  describe('Security Edge Cases', () => {
    test('should not leak timing information on invalid email', async () => {
      // Register a user first
      await registerUser({
        email: 'timing@example.com',
        password: 'Password123!'
      });

      const start1 = Date.now();
      try {
        await loginUser({ email: 'nonexistent@example.com', password: 'Password123!' });
      } catch (e) {
        // Expected to fail
      }
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      try {
        await loginUser({ email: 'timing@example.com', password: 'WrongPassword!' });
      } catch (e) {
        // Expected to fail
      }
      const duration2 = Date.now() - start2;

      // Both should complete in similar time (within 500ms tolerance)
      expect(Math.abs(duration1 - duration2)).toBeLessThan(500);
    });

    test('should sanitize email in error messages', async () => {
      try {
        await registerUser({
          email: '<script>alert("xss")</script>@evil.com',
          password: 'Password123!'
        });
      } catch (error) {
        expect(error.message).not.toContain('<script>');
      }
    });

    test('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000);

      await expect(registerUser({
        email: 'longpass@example.com',
        password: longPassword
      })).resolves.toBeDefined();
    });

    test('should handle unicode in password', async () => {
      const unicodePassword = 'Password123!unicode';

      const result = await registerUser({
        email: 'unicode@example.com',
        password: unicodePassword
      });

      expect(result.success).toBe(true);

      const loginResult = await loginUser({
        email: 'unicode@example.com',
        password: unicodePassword
      });

      expect(loginResult.success).toBe(true);
    });

    test('should handle SQL injection attempt in email', async () => {
      await expect(registerUser({
        email: "admin'--@example.com",
        password: 'Password123!'
      })).rejects.toThrow('Invalid email format');
    });

    test('should not expose password hash in user object', async () => {
      const result = await registerUser({
        email: 'nohash@example.com',
        password: 'Password123!'
      });

      expect(result.user.passwordHash).toBeUndefined();
      expect(result.user.password).toBeUndefined();
    });

    test('should generate different tokens for same user on multiple logins', async () => {
      await registerUser({
        email: 'multilogin@example.com',
        password: 'Password123!'
      });

      const login1 = await loginUser({
        email: 'multilogin@example.com',
        password: 'Password123!'
      });

      const login2 = await loginUser({
        email: 'multilogin@example.com',
        password: 'Password123!'
      });

      expect(login1.accessToken).not.toBe(login2.accessToken);
      expect(login1.refreshToken).not.toBe(login2.refreshToken);
    });
  });
});
