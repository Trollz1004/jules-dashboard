/**
 * ===============================================================================
 * TEST SETUP - Mock Database, Redis, and Utilities
 * ===============================================================================
 *
 * Provides mock implementations for all external dependencies so tests can
 * run without actual infrastructure (database, Redis, external APIs).
 *
 * Created for Jest testing suite
 * ===============================================================================
 */

import { jest } from '@jest/globals';

// ===============================================================================
// MOCK DATABASE (In-Memory Store)
// ===============================================================================

class MockDatabase {
  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.likes = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.sessions = new Map();
    this.refreshTokens = new Map();
    this.passwordResetTokens = new Map();
  }

  // User operations
  async createUser(userData) {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email) {
    for (const [id, user] of this.users) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, data) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  // Profile operations
  async createProfile(profileData) {
    const profile = {
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.profiles.set(profileData.userId, profile);
    return profile;
  }

  async findProfileByUserId(userId) {
    return this.profiles.get(userId) || null;
  }

  async updateProfile(userId, data) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    const updated = { ...profile, ...data, updatedAt: new Date().toISOString() };
    this.profiles.set(userId, updated);
    return updated;
  }

  async searchProfiles(criteria) {
    const results = [];
    for (const [userId, profile] of this.profiles) {
      let matches = true;

      if (criteria.excludeUserId && userId === criteria.excludeUserId) {
        matches = false;
      }
      if (criteria.gender && profile.gender !== criteria.gender) {
        matches = false;
      }
      if (criteria.isHumanVerified !== undefined && profile.isHumanVerified !== criteria.isHumanVerified) {
        matches = false;
      }
      if (criteria.minAge && profile.age < criteria.minAge) {
        matches = false;
      }
      if (criteria.maxAge && profile.age > criteria.maxAge) {
        matches = false;
      }

      if (matches) {
        results.push(profile);
      }
    }
    return results.slice(0, criteria.limit || 10);
  }

  // Like operations
  async createLike(likeData) {
    const key = `${likeData.fromUserId}:${likeData.toUserId}`;
    const like = {
      ...likeData,
      createdAt: new Date().toISOString()
    };
    this.likes.set(key, like);
    return like;
  }

  async findLike(fromUserId, toUserId) {
    return this.likes.get(`${fromUserId}:${toUserId}`) || null;
  }

  async deleteLike(fromUserId, toUserId) {
    return this.likes.delete(`${fromUserId}:${toUserId}`);
  }

  // Match operations
  async createMatch(matchData) {
    const id = `match-${Date.now()}`;
    const match = {
      id,
      ...matchData,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this.matches.set(id, match);
    return match;
  }

  async findMatchById(id) {
    return this.matches.get(id) || null;
  }

  async findMatchesByUserId(userId) {
    const results = [];
    for (const [id, match] of this.matches) {
      if (match.userId1 === userId || match.userId2 === userId) {
        results.push(match);
      }
    }
    return results;
  }

  async updateMatch(id, data) {
    const match = this.matches.get(id);
    if (!match) return null;
    const updated = { ...match, ...data };
    this.matches.set(id, updated);
    return updated;
  }

  // Message operations
  async createMessage(messageData) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id,
      ...messageData,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    if (!this.messages.has(messageData.matchId)) {
      this.messages.set(messageData.matchId, []);
    }
    this.messages.get(messageData.matchId).push(message);
    return message;
  }

  async findMessagesByMatchId(matchId) {
    return this.messages.get(matchId) || [];
  }

  async markMessageAsRead(messageId, matchId) {
    const messages = this.messages.get(matchId) || [];
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.isRead = true;
      message.readAt = new Date().toISOString();
      return message;
    }
    return null;
  }

  // Session operations
  async createSession(sessionData) {
    const id = `session-${Date.now()}`;
    const session = {
      id,
      ...sessionData,
      createdAt: new Date(),
      lastActivityAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async findSession(id) {
    return this.sessions.get(id) || null;
  }

  async deleteSession(id) {
    return this.sessions.delete(id);
  }

  // Password reset token operations
  async createPasswordResetToken(userId, token, expiresAt) {
    this.passwordResetTokens.set(token, { userId, expiresAt });
    return { token, expiresAt };
  }

  async findPasswordResetToken(token) {
    const data = this.passwordResetTokens.get(token);
    if (!data) return null;
    if (new Date() > data.expiresAt) {
      this.passwordResetTokens.delete(token);
      return null;
    }
    return data;
  }

  async deletePasswordResetToken(token) {
    return this.passwordResetTokens.delete(token);
  }

  // Utility methods
  clear() {
    this.users.clear();
    this.profiles.clear();
    this.likes.clear();
    this.matches.clear();
    this.messages.clear();
    this.sessions.clear();
    this.refreshTokens.clear();
    this.passwordResetTokens.clear();
  }

  getStats() {
    return {
      users: this.users.size,
      profiles: this.profiles.size,
      likes: this.likes.size,
      matches: this.matches.size,
      messages: Array.from(this.messages.values()).reduce((sum, arr) => sum + arr.length, 0),
      sessions: this.sessions.size
    };
  }
}

// ===============================================================================
// MOCK REDIS
// ===============================================================================

class MockRedis {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
  }

  async get(key) {
    this._checkExpiration(key);
    return this.store.get(key) || null;
  }

  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX) {
      this.expirations.set(key, Date.now() + (options.EX * 1000));
    }
    return 'OK';
  }

  async del(key) {
    this.expirations.delete(key);
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    const value = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, value.toString());
    return value;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.expirations.set(key, Date.now() + (seconds * 1000));
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    const expiration = this.expirations.get(key);
    if (!expiration) return -1;
    const remaining = Math.ceil((expiration - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async exists(key) {
    this._checkExpiration(key);
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  _checkExpiration(key) {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
    }
  }

  clear() {
    this.store.clear();
    this.expirations.clear();
  }

  async flushall() {
    this.clear();
    return 'OK';
  }
}

// ===============================================================================
// TEST UTILITIES
// ===============================================================================

/**
 * Create a mock Express request object
 */
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn((header) => overrides.headers?.[header.toLowerCase()]),
    ...overrides
  };
}

/**
 * Create a mock Express response object
 */
export function createMockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    send: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    set: jest.fn(function() {
      return this;
    }),
    cookie: jest.fn(function() {
      return this;
    }),
    clearCookie: jest.fn(function() {
      return this;
    })
  };
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Generate a valid test user
 */
export function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    id: `user-${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    displayName: 'Test User',
    passwordHash: 'hashed_password_placeholder',
    status: 'ACTIVE',
    ageVerified: true,
    humanVerified: true,
    isPremium: false,
    isFoundingMember: false,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate a valid test profile
 */
export function createTestProfile(userId, overrides = {}) {
  return {
    userId,
    displayName: 'Test Profile',
    bio: 'This is a test bio for testing purposes.',
    gender: 'other',
    lookingFor: ['friendship'],
    location: { city: 'Test City', country: 'Test Country' },
    ageRangeMin: 18,
    ageRangeMax: 99,
    maxDistance: 50,
    photoUrls: [],
    primaryPhoto: null,
    isHumanVerified: true,
    isFoundingMember: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate a valid JWT payload
 */
export function createTestJwtPayload(overrides = {}) {
  return {
    userId: `user-${Date.now()}`,
    email: 'test@example.com',
    type: 'access',
    ageVerified: true,
    humanVerified: true,
    isPremium: false,
    isFoundingMember: false,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    ...overrides
  };
}

/**
 * Wait for a specified duration
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
export function randomString(length = 10) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate random email
 */
export function randomEmail() {
  return `test-${randomString(8)}@example.com`;
}

// ===============================================================================
// MOCK FILE UPLOAD
// ===============================================================================

export function createMockFile(overrides = {}) {
  return {
    fieldname: 'photo',
    originalname: 'test-photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
    ...overrides
  };
}

// ===============================================================================
// RATE LIMITING TEST HELPER
// ===============================================================================

export class RateLimitTester {
  constructor(limitPerWindow, windowMs) {
    this.limitPerWindow = limitPerWindow;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  recordRequest(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    // Clean old requests
    const reqs = this.requests.get(ip).filter(t => t > windowStart);
    reqs.push(now);
    this.requests.set(ip, reqs);

    return reqs.length <= this.limitPerWindow;
  }

  getRemainingRequests(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const reqs = (this.requests.get(ip) || []).filter(t => t > windowStart);
    return Math.max(0, this.limitPerWindow - reqs.length);
  }

  reset() {
    this.requests.clear();
  }
}

// ===============================================================================
// GLOBAL TEST INSTANCES
// ===============================================================================

export const mockDb = new MockDatabase();
export const mockRedis = new MockRedis();

// ===============================================================================
// JEST SETUP/TEARDOWN
// ===============================================================================

export function setupTestEnvironment() {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockDb.clear();
    mockRedis.clear();
  });
}

export function cleanupTestEnvironment() {
  mockDb.clear();
  mockRedis.clear();
}

// ===============================================================================
// EXPORTS
// ===============================================================================

export default {
  MockDatabase,
  MockRedis,
  mockDb,
  mockRedis,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUser,
  createTestProfile,
  createTestJwtPayload,
  createMockFile,
  RateLimitTester,
  delay,
  randomString,
  randomEmail,
  setupTestEnvironment,
  cleanupTestEnvironment
};
