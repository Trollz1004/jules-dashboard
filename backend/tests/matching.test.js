/**
 * ===============================================================================
 * MATCHING TESTS
 * ===============================================================================
 *
 * Comprehensive test suite for matching functionality:
 * - Like/pass actions
 * - Match creation on mutual likes
 * - Get matches list
 * - Unmatch flow
 *
 * ===============================================================================
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

import {
  mockDb,
  mockRedis,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUser,
  createTestProfile,
  randomEmail
} from './setup.js';

// ===============================================================================
// MOCK MATCHING SERVICE IMPLEMENTATION (For Testing)
// ===============================================================================

// Daily like limits
const FREE_DAILY_LIKES = 10;
const PREMIUM_DAILY_LIKES = Infinity;
const SUPER_LIKES_PER_DAY = {
  free: 1,
  premium: 5
};

// Like/Pass action service
async function likeUser(fromUserId, toUserId, options = {}) {
  const { isSuperLike = false } = options;

  // Validate users exist
  const fromUser = await mockDb.findUserById(fromUserId);
  const toUser = await mockDb.findUserById(toUserId);

  if (!fromUser) {
    throw new Error('User not found');
  }

  if (!toUser) {
    throw new Error('Target user not found');
  }

  // Prevent liking self
  if (fromUserId === toUserId) {
    throw new Error('Cannot like yourself');
  }

  // Check if user has profile
  const fromProfile = await mockDb.findProfileByUserId(fromUserId);
  if (!fromProfile) {
    throw new Error('Please complete your profile first');
  }

  // Check if target has profile
  const toProfile = await mockDb.findProfileByUserId(toUserId);
  if (!toProfile) {
    throw new Error('Target user has no profile');
  }

  // Check human verification (for matching, both users should be verified)
  if (!fromProfile.isHumanVerified) {
    throw new Error('Human verification required');
  }

  // Check if already liked
  const existingLike = await mockDb.findLike(fromUserId, toUserId);
  if (existingLike) {
    throw new Error('Already liked this user');
  }

  // Check if already matched
  const existingMatches = await mockDb.findMatchesByUserId(fromUserId);
  const alreadyMatched = existingMatches.some(
    m => (m.userId1 === toUserId || m.userId2 === toUserId) && m.isActive
  );
  if (alreadyMatched) {
    throw new Error('Already matched with this user');
  }

  // Check daily like limit
  const likesKey = `likes:${fromUserId}:${getTodayKey()}`;
  const todayLikes = parseInt(await mockRedis.get(likesKey) || '0');
  const dailyLimit = fromUser.isPremium ? PREMIUM_DAILY_LIKES : FREE_DAILY_LIKES;

  if (todayLikes >= dailyLimit) {
    throw new Error('Daily like limit reached');
  }

  // Check super like limit
  if (isSuperLike) {
    const superLikesKey = `superlikes:${fromUserId}:${getTodayKey()}`;
    const todaySuperLikes = parseInt(await mockRedis.get(superLikesKey) || '0');
    const superLikeLimit = fromUser.isPremium ?
      SUPER_LIKES_PER_DAY.premium : SUPER_LIKES_PER_DAY.free;

    if (todaySuperLikes >= superLikeLimit) {
      throw new Error('Daily super like limit reached');
    }

    await mockRedis.incr(superLikesKey);
    await mockRedis.expire(superLikesKey, 86400);
  }

  // Create the like
  const like = await mockDb.createLike({
    fromUserId,
    toUserId,
    isSuperLike
  });

  // Increment daily like counter
  await mockRedis.incr(likesKey);
  await mockRedis.expire(likesKey, 86400);

  // Check for mutual like (creates a match!)
  const reverseLike = await mockDb.findLike(toUserId, fromUserId);

  if (reverseLike) {
    // It's a match!
    const match = await mockDb.createMatch({
      userId1: fromUserId,
      userId2: toUserId,
      initiatedBy: toUserId, // First person to like
      matchedAt: new Date().toISOString()
    });

    return {
      success: true,
      isMatch: true,
      match: {
        id: match.id,
        matchedWith: {
          userId: toUserId,
          displayName: toProfile.displayName,
          primaryPhoto: toProfile.primaryPhoto
        },
        createdAt: match.createdAt
      },
      message: "It's a match! You can now message each other."
    };
  }

  return {
    success: true,
    isMatch: false,
    message: isSuperLike ? 'Super like sent!' : 'Like sent!',
    likesRemaining: dailyLimit === Infinity ? 'unlimited' : dailyLimit - todayLikes - 1
  };
}

async function passUser(fromUserId, toUserId) {
  // Validate users
  const fromUser = await mockDb.findUserById(fromUserId);
  if (!fromUser) {
    throw new Error('User not found');
  }

  // Record pass (for algorithm, not blocking)
  const passKey = `passes:${fromUserId}`;
  const passes = JSON.parse(await mockRedis.get(passKey) || '[]');
  passes.push({ toUserId, timestamp: Date.now() });

  // Keep only last 1000 passes
  if (passes.length > 1000) {
    passes.shift();
  }

  await mockRedis.set(passKey, JSON.stringify(passes));

  return {
    success: true,
    message: 'Passed'
  };
}

async function getMatches(userId, options = {}) {
  const { includeInactive = false, limit = 50 } = options;

  const matches = await mockDb.findMatchesByUserId(userId);

  // Filter and enrich matches
  const enrichedMatches = await Promise.all(
    matches
      .filter(m => includeInactive || m.isActive)
      .slice(0, limit)
      .map(async (match) => {
        const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
        const otherProfile = await mockDb.findProfileByUserId(otherUserId);

        return {
          matchId: match.id,
          isActive: match.isActive,
          matchedAt: match.createdAt,
          matchedWith: {
            userId: otherUserId,
            displayName: otherProfile?.displayName || 'Deleted User',
            primaryPhoto: otherProfile?.primaryPhoto || null,
            isHumanVerified: otherProfile?.isHumanVerified || false,
            isFoundingMember: otherProfile?.isFoundingMember || false
          },
          lastMessage: await getLastMessage(match.id),
          unreadCount: await getUnreadCount(match.id, userId)
        };
      })
  );

  // Sort by most recent activity
  enrichedMatches.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.matchedAt;
    const bTime = b.lastMessage?.createdAt || b.matchedAt;
    return new Date(bTime) - new Date(aTime);
  });

  return {
    success: true,
    matches: enrichedMatches,
    count: enrichedMatches.length
  };
}

async function unmatch(userId, matchId) {
  const match = await mockDb.findMatchById(matchId);

  if (!match) {
    throw new Error('Match not found');
  }

  // Verify user is part of this match
  if (match.userId1 !== userId && match.userId2 !== userId) {
    throw new Error('Not authorized');
  }

  // Check if already unmatched
  if (!match.isActive) {
    throw new Error('Already unmatched');
  }

  // Deactivate the match
  await mockDb.updateMatch(matchId, {
    isActive: false,
    unmatchedBy: userId,
    unmatchedAt: new Date().toISOString()
  });

  // Remove the likes
  const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
  await mockDb.deleteLike(userId, otherUserId);
  await mockDb.deleteLike(otherUserId, userId);

  return {
    success: true,
    message: 'Unmatched successfully'
  };
}

async function getLikesReceived(userId, options = {}) {
  const { showWhoLiked = false } = options; // Premium feature

  // Get user to check premium status
  const user = await mockDb.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Count likes received (not mutual)
  let likesReceived = 0;
  const likers = [];

  // Iterate through all likes to find those targeting this user
  for (const [key, like] of mockDb.likes) {
    if (like.toUserId === userId) {
      // Check if this is not already a match
      const reverseLike = await mockDb.findLike(userId, like.fromUserId);
      if (!reverseLike) {
        likesReceived++;
        if (showWhoLiked && user.isPremium) {
          const likerProfile = await mockDb.findProfileByUserId(like.fromUserId);
          likers.push({
            userId: like.fromUserId,
            displayName: likerProfile?.displayName,
            primaryPhoto: likerProfile?.primaryPhoto,
            isSuperLike: like.isSuperLike,
            likedAt: like.createdAt
          });
        }
      }
    }
  }

  const result = {
    success: true,
    count: likesReceived
  };

  if (showWhoLiked) {
    if (user.isPremium) {
      result.likers = likers;
    } else {
      result.message = 'Upgrade to Premium to see who liked you';
      result.likers = likers.map(l => ({
        ...l,
        displayName: 'Hidden',
        primaryPhoto: null // Blur in UI
      }));
    }
  }

  return result;
}

// Helper functions
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

async function getLastMessage(matchId) {
  const messages = await mockDb.findMessagesByMatchId(matchId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
}

async function getUnreadCount(matchId, userId) {
  const messages = await mockDb.findMessagesByMatchId(matchId);
  return messages.filter(m => m.receiverId === userId && !m.isRead).length;
}

// ===============================================================================
// TEST SUITES
// ===============================================================================

describe('Matching Tests', () => {
  let user1, user2, user3;
  let profile1, profile2, profile3;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.clear();
    mockRedis.clear();

    // Create test users
    user1 = await mockDb.createUser({
      email: 'user1@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      ageVerified: true,
      humanVerified: true,
      isPremium: false
    });

    user2 = await mockDb.createUser({
      email: 'user2@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      ageVerified: true,
      humanVerified: true,
      isPremium: false
    });

    user3 = await mockDb.createUser({
      email: 'user3@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      ageVerified: true,
      humanVerified: true,
      isPremium: true // Premium user
    });

    // Create profiles
    profile1 = await mockDb.createProfile({
      userId: user1.id,
      displayName: 'User One',
      bio: 'First test user',
      isHumanVerified: true
    });

    profile2 = await mockDb.createProfile({
      userId: user2.id,
      displayName: 'User Two',
      bio: 'Second test user',
      isHumanVerified: true
    });

    profile3 = await mockDb.createProfile({
      userId: user3.id,
      displayName: 'User Three',
      bio: 'Premium test user',
      isHumanVerified: true
    });
  });

  afterEach(() => {
    mockDb.clear();
    mockRedis.clear();
  });

  // ===========================================================================
  // LIKE TESTS
  // ===========================================================================

  describe('Like Actions', () => {
    describe('Valid Likes', () => {
      test('should like another user successfully', async () => {
        const result = await likeUser(user1.id, user2.id);

        expect(result.success).toBe(true);
        expect(result.isMatch).toBe(false);
        expect(result.message).toBe('Like sent!');
      });

      test('should track remaining likes for free users', async () => {
        const result = await likeUser(user1.id, user2.id);

        expect(result.likesRemaining).toBeDefined();
        expect(result.likesRemaining).toBe(FREE_DAILY_LIKES - 1);
      });

      test('should show unlimited likes for premium users', async () => {
        const result = await likeUser(user3.id, user1.id);

        expect(result.likesRemaining).toBe('unlimited');
      });

      test('should send super like successfully', async () => {
        const result = await likeUser(user1.id, user2.id, { isSuperLike: true });

        expect(result.success).toBe(true);
        expect(result.message).toBe('Super like sent!');
      });

      test('should increment daily like counter', async () => {
        await likeUser(user1.id, user2.id);

        const likesKey = `likes:${user1.id}:${getTodayKey()}`;
        const count = await mockRedis.get(likesKey);

        expect(parseInt(count)).toBe(1);
      });

      test('should record like in database', async () => {
        await likeUser(user1.id, user2.id);

        const like = await mockDb.findLike(user1.id, user2.id);

        expect(like).toBeDefined();
        expect(like.fromUserId).toBe(user1.id);
        expect(like.toUserId).toBe(user2.id);
      });
    });

    describe('Invalid Likes', () => {
      test('should reject liking self', async () => {
        await expect(likeUser(user1.id, user1.id))
          .rejects.toThrow('Cannot like yourself');
      });

      test('should reject liking non-existent user', async () => {
        await expect(likeUser(user1.id, 'non-existent-id'))
          .rejects.toThrow('Target user not found');
      });

      test('should reject like from non-existent user', async () => {
        await expect(likeUser('non-existent-id', user2.id))
          .rejects.toThrow('User not found');
      });

      test('should reject duplicate like', async () => {
        await likeUser(user1.id, user2.id);

        await expect(likeUser(user1.id, user2.id))
          .rejects.toThrow('Already liked this user');
      });

      test('should reject like from user without profile', async () => {
        const noProfileUser = await mockDb.createUser({
          email: 'noprofile@example.com',
          passwordHash: 'hashed',
          humanVerified: true
        });

        await expect(likeUser(noProfileUser.id, user2.id))
          .rejects.toThrow('Please complete your profile first');
      });

      test('should reject like to user without profile', async () => {
        const noProfileUser = await mockDb.createUser({
          email: 'noprofile2@example.com',
          passwordHash: 'hashed',
          humanVerified: true
        });

        await expect(likeUser(user1.id, noProfileUser.id))
          .rejects.toThrow('Target user has no profile');
      });

      test('should reject like from unverified user', async () => {
        const unverifiedUser = await mockDb.createUser({
          email: 'unverified@example.com',
          passwordHash: 'hashed',
          humanVerified: false
        });

        await mockDb.createProfile({
          userId: unverifiedUser.id,
          displayName: 'Unverified',
          isHumanVerified: false
        });

        await expect(likeUser(unverifiedUser.id, user2.id))
          .rejects.toThrow('Human verification required');
      });
    });

    describe('Daily Limits', () => {
      test('should enforce daily like limit for free users', async () => {
        // Use up all likes
        for (let i = 0; i < FREE_DAILY_LIKES; i++) {
          const tempUser = await mockDb.createUser({
            email: `temp${i}@example.com`,
            passwordHash: 'hashed',
            humanVerified: true
          });

          await mockDb.createProfile({
            userId: tempUser.id,
            displayName: `Temp ${i}`,
            isHumanVerified: true
          });

          await likeUser(user1.id, tempUser.id);
        }

        // Next like should fail
        await expect(likeUser(user1.id, user3.id))
          .rejects.toThrow('Daily like limit reached');
      });

      test('should enforce super like limit for free users', async () => {
        // Use super like
        await likeUser(user1.id, user2.id, { isSuperLike: true });

        // Create another user to super like
        const tempUser = await mockDb.createUser({
          email: 'temp@example.com',
          passwordHash: 'hashed',
          humanVerified: true
        });

        await mockDb.createProfile({
          userId: tempUser.id,
          displayName: 'Temp',
          isHumanVerified: true
        });

        // Second super like should fail
        await expect(likeUser(user1.id, tempUser.id, { isSuperLike: true }))
          .rejects.toThrow('Daily super like limit reached');
      });

      test('should allow more super likes for premium users', async () => {
        // Premium user can use multiple super likes
        for (let i = 0; i < SUPER_LIKES_PER_DAY.premium; i++) {
          const tempUser = await mockDb.createUser({
            email: `temp${i}@example.com`,
            passwordHash: 'hashed',
            humanVerified: true
          });

          await mockDb.createProfile({
            userId: tempUser.id,
            displayName: `Temp ${i}`,
            isHumanVerified: true
          });

          const result = await likeUser(user3.id, tempUser.id, { isSuperLike: true });
          expect(result.success).toBe(true);
        }
      });
    });
  });

  // ===========================================================================
  // PASS TESTS
  // ===========================================================================

  describe('Pass Actions', () => {
    test('should pass on user successfully', async () => {
      const result = await passUser(user1.id, user2.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Passed');
    });

    test('should record pass for algorithm', async () => {
      await passUser(user1.id, user2.id);

      const passKey = `passes:${user1.id}`;
      const passes = JSON.parse(await mockRedis.get(passKey));

      expect(passes.length).toBe(1);
      expect(passes[0].toUserId).toBe(user2.id);
    });

    test('should allow passing same user multiple times', async () => {
      await passUser(user1.id, user2.id);
      const result = await passUser(user1.id, user2.id);

      expect(result.success).toBe(true);
    });

    test('should reject pass from non-existent user', async () => {
      await expect(passUser('non-existent-id', user2.id))
        .rejects.toThrow('User not found');
    });

    test('should limit stored passes to 1000', async () => {
      // Simulate many passes
      const passKey = `passes:${user1.id}`;
      const manyPasses = Array.from({ length: 1000 }, (_, i) => ({
        toUserId: `user-${i}`,
        timestamp: Date.now()
      }));

      await mockRedis.set(passKey, JSON.stringify(manyPasses));

      // Add one more
      await passUser(user1.id, user2.id);

      const passes = JSON.parse(await mockRedis.get(passKey));
      expect(passes.length).toBe(1000);
    });
  });

  // ===========================================================================
  // MATCH CREATION TESTS
  // ===========================================================================

  describe('Match Creation', () => {
    test('should create match on mutual like', async () => {
      // User 1 likes User 2
      await likeUser(user1.id, user2.id);

      // User 2 likes User 1 back
      const result = await likeUser(user2.id, user1.id);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.message).toContain("It's a match");
    });

    test('should return matched user info', async () => {
      await likeUser(user1.id, user2.id);
      const result = await likeUser(user2.id, user1.id);

      expect(result.match.matchedWith.userId).toBe(user1.id);
      expect(result.match.matchedWith.displayName).toBe('User One');
    });

    test('should create match record in database', async () => {
      await likeUser(user1.id, user2.id);
      await likeUser(user2.id, user1.id);

      const matches = await mockDb.findMatchesByUserId(user1.id);

      expect(matches.length).toBe(1);
      expect(matches[0].isActive).toBe(true);
    });

    test('should reject liking already matched user', async () => {
      await likeUser(user1.id, user2.id);
      await likeUser(user2.id, user1.id); // Creates match

      // Try to like again (if somehow like was removed but match exists)
      await mockDb.deleteLike(user1.id, user2.id);

      await expect(likeUser(user1.id, user2.id))
        .rejects.toThrow('Already matched with this user');
    });

    test('should track who initiated the match', async () => {
      await likeUser(user1.id, user2.id); // User 1 initiated
      await likeUser(user2.id, user1.id);

      const matches = await mockDb.findMatchesByUserId(user1.id);

      expect(matches[0].initiatedBy).toBe(user1.id);
    });
  });

  // ===========================================================================
  // GET MATCHES TESTS
  // ===========================================================================

  describe('Get Matches List', () => {
    beforeEach(async () => {
      // Create some matches
      await likeUser(user1.id, user2.id);
      await likeUser(user2.id, user1.id); // Match 1

      await likeUser(user1.id, user3.id);
      await likeUser(user3.id, user1.id); // Match 2
    });

    test('should return all active matches', async () => {
      const result = await getMatches(user1.id);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.matches.length).toBe(2);
    });

    test('should include matched user details', async () => {
      const result = await getMatches(user1.id);

      const match = result.matches[0];

      expect(match.matchedWith).toBeDefined();
      expect(match.matchedWith.userId).toBeDefined();
      expect(match.matchedWith.displayName).toBeDefined();
    });

    test('should include match metadata', async () => {
      const result = await getMatches(user1.id);

      const match = result.matches[0];

      expect(match.matchId).toBeDefined();
      expect(match.isActive).toBe(true);
      expect(match.matchedAt).toBeDefined();
    });

    test('should exclude inactive matches by default', async () => {
      // Unmatch one
      const matches = await mockDb.findMatchesByUserId(user1.id);
      await unmatch(user1.id, matches[0].id);

      const result = await getMatches(user1.id);

      expect(result.count).toBe(1);
    });

    test('should include inactive matches when requested', async () => {
      const matches = await mockDb.findMatchesByUserId(user1.id);
      await unmatch(user1.id, matches[0].id);

      const result = await getMatches(user1.id, { includeInactive: true });

      expect(result.count).toBe(2);
    });

    test('should respect limit parameter', async () => {
      const result = await getMatches(user1.id, { limit: 1 });

      expect(result.matches.length).toBe(1);
    });

    test('should return empty array for user with no matches', async () => {
      const lonelyUser = await mockDb.createUser({
        email: 'lonely@example.com',
        passwordHash: 'hashed'
      });

      const result = await getMatches(lonelyUser.id);

      expect(result.success).toBe(true);
      expect(result.matches).toEqual([]);
      expect(result.count).toBe(0);
    });

    test('should handle deleted user profiles gracefully', async () => {
      // Delete user2's profile
      mockDb.profiles.delete(user2.id);

      const result = await getMatches(user1.id);

      const deletedMatch = result.matches.find(
        m => m.matchedWith.userId === user2.id
      );

      expect(deletedMatch.matchedWith.displayName).toBe('Deleted User');
    });

    test('should include unread message count', async () => {
      // Add a message
      const matches = await mockDb.findMatchesByUserId(user1.id);
      await mockDb.createMessage({
        matchId: matches[0].id,
        senderId: user2.id,
        receiverId: user1.id,
        content: 'Hello!'
      });

      const result = await getMatches(user1.id);

      const matchWithMessage = result.matches.find(
        m => m.matchedWith.userId === user2.id
      );

      expect(matchWithMessage.unreadCount).toBe(1);
    });
  });

  // ===========================================================================
  // UNMATCH TESTS
  // ===========================================================================

  describe('Unmatch Flow', () => {
    let matchId;

    beforeEach(async () => {
      await likeUser(user1.id, user2.id);
      await likeUser(user2.id, user1.id);

      const matches = await mockDb.findMatchesByUserId(user1.id);
      matchId = matches[0].id;
    });

    test('should unmatch successfully', async () => {
      const result = await unmatch(user1.id, matchId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Unmatched successfully');
    });

    test('should mark match as inactive', async () => {
      await unmatch(user1.id, matchId);

      const match = await mockDb.findMatchById(matchId);

      expect(match.isActive).toBe(false);
    });

    test('should record who unmatched', async () => {
      await unmatch(user1.id, matchId);

      const match = await mockDb.findMatchById(matchId);

      expect(match.unmatchedBy).toBe(user1.id);
      expect(match.unmatchedAt).toBeDefined();
    });

    test('should remove likes on unmatch', async () => {
      await unmatch(user1.id, matchId);

      const like1 = await mockDb.findLike(user1.id, user2.id);
      const like2 = await mockDb.findLike(user2.id, user1.id);

      expect(like1).toBeNull();
      expect(like2).toBeNull();
    });

    test('should reject unmatching non-existent match', async () => {
      await expect(unmatch(user1.id, 'non-existent-id'))
        .rejects.toThrow('Match not found');
    });

    test('should reject unmatching by non-participant', async () => {
      await expect(unmatch(user3.id, matchId))
        .rejects.toThrow('Not authorized');
    });

    test('should reject double unmatch', async () => {
      await unmatch(user1.id, matchId);

      await expect(unmatch(user1.id, matchId))
        .rejects.toThrow('Already unmatched');
    });

    test('should allow both users to view unmatched status', async () => {
      await unmatch(user1.id, matchId);

      const user1Matches = await getMatches(user1.id, { includeInactive: true });
      const user2Matches = await getMatches(user2.id, { includeInactive: true });

      expect(user1Matches.matches[0].isActive).toBe(false);
      expect(user2Matches.matches[0].isActive).toBe(false);
    });
  });

  // ===========================================================================
  // LIKES RECEIVED (WHO LIKED ME) TESTS
  // ===========================================================================

  describe('Likes Received', () => {
    beforeEach(async () => {
      // User 2 and 3 like User 1
      await likeUser(user2.id, user1.id);
      await likeUser(user3.id, user1.id, { isSuperLike: true });
    });

    test('should count likes received', async () => {
      const result = await getLikesReceived(user1.id);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    test('should not count mutual likes (matches)', async () => {
      // User 1 likes User 2 back (creates match)
      await likeUser(user1.id, user2.id);

      const result = await getLikesReceived(user1.id);

      expect(result.count).toBe(1); // Only User 3's like remains
    });

    test('should hide likers for free users', async () => {
      const result = await getLikesReceived(user1.id, { showWhoLiked: true });

      expect(result.message).toContain('Upgrade to Premium');
      expect(result.likers[0].displayName).toBe('Hidden');
      expect(result.likers[0].primaryPhoto).toBeNull();
    });

    test('should show likers for premium users', async () => {
      // Make user1 premium
      await mockDb.updateUser(user1.id, { isPremium: true });

      const result = await getLikesReceived(user1.id, { showWhoLiked: true });

      expect(result.likers[0].displayName).not.toBe('Hidden');
    });

    test('should indicate super likes', async () => {
      await mockDb.updateUser(user1.id, { isPremium: true });

      const result = await getLikesReceived(user1.id, { showWhoLiked: true });

      const superLike = result.likers.find(l => l.isSuperLike);
      expect(superLike).toBeDefined();
      expect(superLike.userId).toBe(user3.id);
    });

    test('should reject for non-existent user', async () => {
      await expect(getLikesReceived('non-existent-id'))
        .rejects.toThrow('User not found');
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    test('should handle rapid likes correctly', async () => {
      const tempUsers = [];

      // Create several users
      for (let i = 0; i < 5; i++) {
        const tempUser = await mockDb.createUser({
          email: `rapid${i}@example.com`,
          passwordHash: 'hashed',
          humanVerified: true
        });

        await mockDb.createProfile({
          userId: tempUser.id,
          displayName: `Rapid ${i}`,
          isHumanVerified: true
        });

        tempUsers.push(tempUser);
      }

      // Like them all quickly
      const results = await Promise.all(
        tempUsers.map(u => likeUser(user1.id, u.id))
      );

      expect(results.every(r => r.success)).toBe(true);
    });

    test('should maintain consistency after unmatch and re-like', async () => {
      // Create match
      await likeUser(user1.id, user2.id);
      await likeUser(user2.id, user1.id);

      // Unmatch
      const matches = await mockDb.findMatchesByUserId(user1.id);
      await unmatch(user1.id, matches[0].id);

      // Like again
      const result = await likeUser(user1.id, user2.id);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false); // Should not auto-match since other like was removed
    });

    test('should handle concurrent match creation', async () => {
      // Simulate both users liking at the same time
      const [result1, result2] = await Promise.all([
        likeUser(user1.id, user2.id),
        (async () => {
          // Small delay to ensure first like is recorded
          await new Promise(r => setTimeout(r, 10));
          return likeUser(user2.id, user1.id);
        })()
      ]);

      // One should be a match, one should be a regular like
      const matchCount = [result1, result2].filter(r => r.isMatch).length;

      expect(matchCount).toBeGreaterThanOrEqual(1);
    });
  });
});
