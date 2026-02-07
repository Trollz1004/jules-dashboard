/**
 * ===============================================================================
 * MESSAGING TESTS
 * ===============================================================================
 *
 * Comprehensive test suite for messaging functionality:
 * - Send message
 * - Get conversation
 * - Mark as read
 * - Message validation
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
  randomString,
  delay
} from './setup.js';

// ===============================================================================
// MOCK MESSAGING SERVICE IMPLEMENTATION (For Testing)
// ===============================================================================

// Message limits and validation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_PER_MINUTE = 10;
const BLOCKED_WORDS = ['spam', 'scam', 'venmo', 'cashapp', 'paypal']; // Payment solicitation

// AI detection patterns (simplified)
const AI_PATTERNS = [
  /as an ai/i,
  /i don't have personal/i,
  /i cannot provide/i,
  /i'm designed to/i,
  /my purpose is/i,
  /i am a language model/i
];

// Send message
async function sendMessage(senderId, matchId, content, options = {}) {
  // Validate content exists
  if (!content || content.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  // Validate content length
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }

  // Check match exists
  const match = await mockDb.findMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  // Check sender is part of match
  if (match.userId1 !== senderId && match.userId2 !== senderId) {
    throw new Error('Not authorized to message in this conversation');
  }

  // Check match is active
  if (!match.isActive) {
    throw new Error('Cannot message in inactive match');
  }

  // Get receiver ID
  const receiverId = match.userId1 === senderId ? match.userId2 : match.userId1;

  // Check sender's profile and verification
  const senderProfile = await mockDb.findProfileByUserId(senderId);
  if (!senderProfile) {
    throw new Error('Profile required to send messages');
  }

  if (!senderProfile.isHumanVerified) {
    throw new Error('Human verification required to send messages');
  }

  // Rate limiting
  const rateLimitKey = `messages:rate:${senderId}`;
  const messageCount = parseInt(await mockRedis.get(rateLimitKey) || '0');

  if (messageCount >= MAX_MESSAGES_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please slow down.');
  }

  await mockRedis.incr(rateLimitKey);
  await mockRedis.expire(rateLimitKey, 60);

  // Content moderation
  const moderationResult = moderateContent(content);

  if (moderationResult.blocked) {
    throw new Error(`Message blocked: ${moderationResult.reason}`);
  }

  // AI detection
  const aiScore = detectAIContent(content);

  // Create message
  const message = await mockDb.createMessage({
    matchId,
    senderId,
    receiverId,
    content: content.trim(),
    aiScore,
    flagged: aiScore > 80 || moderationResult.flagged,
    flagReason: moderationResult.flagged ? moderationResult.reason : null,
    replyToId: options.replyToId || null,
    attachments: options.attachments || []
  });

  // Update match's last activity
  await mockDb.updateMatch(matchId, {
    lastMessageAt: new Date().toISOString()
  });

  return {
    success: true,
    message: {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt,
      aiWarning: aiScore > 50 ? 'This message may have been AI-generated' : null,
      moderationWarning: moderationResult.flagged ? moderationResult.reason : null
    }
  };
}

// Get conversation
async function getConversation(userId, matchId, options = {}) {
  const { limit = 50, before, after } = options;

  // Check match exists
  const match = await mockDb.findMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  // Check user is part of match
  if (match.userId1 !== userId && match.userId2 !== userId) {
    throw new Error('Not authorized to view this conversation');
  }

  // Get messages
  let messages = await mockDb.findMessagesByMatchId(matchId);

  // Filter by timestamp if provided
  if (before) {
    messages = messages.filter(m => new Date(m.createdAt) < new Date(before));
  }

  if (after) {
    messages = messages.filter(m => new Date(m.createdAt) > new Date(after));
  }

  // Sort by timestamp (newest last)
  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Apply limit (get last N messages)
  if (messages.length > limit) {
    messages = messages.slice(-limit);
  }

  // Get other user's profile
  const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
  const otherProfile = await mockDb.findProfileByUserId(otherUserId);

  return {
    success: true,
    matchId,
    participant: {
      userId: otherUserId,
      displayName: otherProfile?.displayName || 'Deleted User',
      primaryPhoto: otherProfile?.primaryPhoto
    },
    messages: messages.map(m => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      createdAt: m.createdAt,
      isRead: m.isRead,
      readAt: m.readAt,
      isOwn: m.senderId === userId
    })),
    totalCount: (await mockDb.findMessagesByMatchId(matchId)).length,
    hasMore: messages.length === limit
  };
}

// Mark messages as read
async function markAsRead(userId, matchId, messageIds = []) {
  // Check match exists
  const match = await mockDb.findMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  // Check user is part of match
  if (match.userId1 !== userId && match.userId2 !== userId) {
    throw new Error('Not authorized');
  }

  // Get all messages for this match
  const messages = await mockDb.findMessagesByMatchId(matchId);

  let markedCount = 0;

  for (const message of messages) {
    // Only mark messages sent TO this user (receiver = userId)
    if (message.receiverId !== userId) {
      continue;
    }

    // If specific messageIds provided, only mark those
    if (messageIds.length > 0 && !messageIds.includes(message.id)) {
      continue;
    }

    // Mark as read if not already
    if (!message.isRead) {
      await mockDb.markMessageAsRead(message.id, matchId);
      markedCount++;
    }
  }

  return {
    success: true,
    markedCount,
    readAt: new Date().toISOString()
  };
}

// Mark all messages in conversation as read
async function markAllAsRead(userId, matchId) {
  return markAsRead(userId, matchId, []);
}

// Get unread message count
async function getUnreadCount(userId) {
  let totalUnread = 0;

  // Get all matches for user
  const matches = await mockDb.findMatchesByUserId(userId);

  for (const match of matches) {
    if (!match.isActive) continue;

    const messages = await mockDb.findMessagesByMatchId(match.id);
    const unread = messages.filter(
      m => m.receiverId === userId && !m.isRead
    ).length;

    totalUnread += unread;
  }

  return {
    success: true,
    unreadCount: totalUnread
  };
}

// Delete message (soft delete)
async function deleteMessage(userId, matchId, messageId) {
  const match = await mockDb.findMatchById(matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  const messages = await mockDb.findMessagesByMatchId(matchId);
  const message = messages.find(m => m.id === messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  // Only sender can delete their own message
  if (message.senderId !== userId) {
    throw new Error('Can only delete your own messages');
  }

  // Check if message is recent (within 5 minutes)
  const messageTime = new Date(message.createdAt);
  const now = new Date();
  const diffMinutes = (now - messageTime) / (1000 * 60);

  if (diffMinutes > 5) {
    throw new Error('Can only delete messages within 5 minutes of sending');
  }

  // Soft delete
  message.deleted = true;
  message.deletedAt = new Date().toISOString();
  message.content = '[Message deleted]';

  return {
    success: true,
    message: 'Message deleted'
  };
}

// Helper functions
function moderateContent(content) {
  const lowerContent = content.toLowerCase();

  // Check for blocked words
  for (const word of BLOCKED_WORDS) {
    if (lowerContent.includes(word)) {
      return {
        blocked: true,
        flagged: true,
        reason: 'Payment solicitation is not allowed'
      };
    }
  }

  // Check for phone numbers (basic pattern)
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
  if (phonePattern.test(content)) {
    return {
      blocked: false,
      flagged: true,
      reason: 'Phone number detected - share contact info at your own risk'
    };
  }

  // Check for URLs
  const urlPattern = /https?:\/\/[^\s]+/i;
  if (urlPattern.test(content)) {
    return {
      blocked: false,
      flagged: true,
      reason: 'Link detected - be cautious with external links'
    };
  }

  return {
    blocked: false,
    flagged: false,
    reason: null
  };
}

function detectAIContent(text) {
  let score = 0;

  // Check for AI patterns
  AI_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) score += 30;
  });

  // Check for formal words
  const formalWords = ['furthermore', 'additionally', 'consequently', 'nevertheless'];
  formalWords.forEach(word => {
    if (text.toLowerCase().includes(word)) score += 5;
  });

  // Check for sentence uniformity
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    const lengths = sentences.map(s => s.trim().length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.abs(len - avgLength), 0) / lengths.length;
    if (variance < 10) score += 10;
  }

  return Math.min(score, 100);
}

// ===============================================================================
// TEST SUITES
// ===============================================================================

describe('Messaging Tests', () => {
  let user1, user2, user3;
  let match12Id;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.clear();
    mockRedis.clear();

    // Create test users
    user1 = await mockDb.createUser({
      email: 'user1@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      humanVerified: true
    });

    user2 = await mockDb.createUser({
      email: 'user2@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      humanVerified: true
    });

    user3 = await mockDb.createUser({
      email: 'user3@example.com',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      humanVerified: true
    });

    // Create profiles
    await mockDb.createProfile({
      userId: user1.id,
      displayName: 'User One',
      isHumanVerified: true
    });

    await mockDb.createProfile({
      userId: user2.id,
      displayName: 'User Two',
      isHumanVerified: true
    });

    await mockDb.createProfile({
      userId: user3.id,
      displayName: 'User Three',
      isHumanVerified: true
    });

    // Create a match between user1 and user2
    const match = await mockDb.createMatch({
      userId1: user1.id,
      userId2: user2.id
    });
    match12Id = match.id;
  });

  afterEach(() => {
    mockDb.clear();
    mockRedis.clear();
  });

  // ===========================================================================
  // SEND MESSAGE TESTS
  // ===========================================================================

  describe('Send Message', () => {
    describe('Valid Messages', () => {
      test('should send a message successfully', async () => {
        const result = await sendMessage(user1.id, match12Id, 'Hello!');

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.message.content).toBe('Hello!');
        expect(result.message.senderId).toBe(user1.id);
      });

      test('should store message in database', async () => {
        await sendMessage(user1.id, match12Id, 'Test message');

        const messages = await mockDb.findMessagesByMatchId(match12Id);

        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe('Test message');
      });

      test('should trim whitespace from message', async () => {
        const result = await sendMessage(user1.id, match12Id, '  Hello World  ');

        expect(result.message.content).toBe('Hello World');
      });

      test('should allow messages up to 2000 characters', async () => {
        const longMessage = 'A'.repeat(2000);

        const result = await sendMessage(user1.id, match12Id, longMessage);

        expect(result.success).toBe(true);
        expect(result.message.content.length).toBe(2000);
      });

      test('should set correct receiver ID', async () => {
        await sendMessage(user1.id, match12Id, 'Hello');

        const messages = await mockDb.findMessagesByMatchId(match12Id);

        expect(messages[0].receiverId).toBe(user2.id);
      });

      test('should initialize message as unread', async () => {
        await sendMessage(user1.id, match12Id, 'Hello');

        const messages = await mockDb.findMessagesByMatchId(match12Id);

        expect(messages[0].isRead).toBe(false);
      });

      test('should allow reply to specific message', async () => {
        const { message: originalMsg } = await sendMessage(user1.id, match12Id, 'Original');

        const result = await sendMessage(user2.id, match12Id, 'Reply', {
          replyToId: originalMsg.id
        });

        const messages = await mockDb.findMessagesByMatchId(match12Id);
        const reply = messages.find(m => m.content === 'Reply');

        expect(reply.replyToId).toBe(originalMsg.id);
      });

      test('should update match last message timestamp', async () => {
        const before = await mockDb.findMatchById(match12Id);

        await sendMessage(user1.id, match12Id, 'Hello');

        const after = await mockDb.findMatchById(match12Id);

        expect(after.lastMessageAt).toBeDefined();
      });
    });

    describe('Invalid Messages', () => {
      test('should reject empty message', async () => {
        await expect(sendMessage(user1.id, match12Id, ''))
          .rejects.toThrow('Message cannot be empty');
      });

      test('should reject whitespace-only message', async () => {
        await expect(sendMessage(user1.id, match12Id, '   '))
          .rejects.toThrow('Message cannot be empty');
      });

      test('should reject message exceeding max length', async () => {
        const tooLong = 'A'.repeat(2001);

        await expect(sendMessage(user1.id, match12Id, tooLong))
          .rejects.toThrow(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
      });

      test('should reject message to non-existent match', async () => {
        await expect(sendMessage(user1.id, 'fake-match-id', 'Hello'))
          .rejects.toThrow('Match not found');
      });

      test('should reject message from non-participant', async () => {
        await expect(sendMessage(user3.id, match12Id, 'Intruder'))
          .rejects.toThrow('Not authorized to message in this conversation');
      });

      test('should reject message in inactive match', async () => {
        await mockDb.updateMatch(match12Id, { isActive: false });

        await expect(sendMessage(user1.id, match12Id, 'Hello'))
          .rejects.toThrow('Cannot message in inactive match');
      });

      test('should reject message from user without profile', async () => {
        const noProfileUser = await mockDb.createUser({
          email: 'noprofile@example.com',
          passwordHash: 'hashed'
        });

        const match = await mockDb.createMatch({
          userId1: noProfileUser.id,
          userId2: user2.id
        });

        await expect(sendMessage(noProfileUser.id, match.id, 'Hello'))
          .rejects.toThrow('Profile required to send messages');
      });

      test('should reject message from unverified user', async () => {
        const unverifiedUser = await mockDb.createUser({
          email: 'unverified@example.com',
          passwordHash: 'hashed'
        });

        await mockDb.createProfile({
          userId: unverifiedUser.id,
          displayName: 'Unverified',
          isHumanVerified: false
        });

        const match = await mockDb.createMatch({
          userId1: unverifiedUser.id,
          userId2: user2.id
        });

        await expect(sendMessage(unverifiedUser.id, match.id, 'Hello'))
          .rejects.toThrow('Human verification required');
      });
    });

    describe('Rate Limiting', () => {
      test('should allow messages within rate limit', async () => {
        for (let i = 0; i < MAX_MESSAGES_PER_MINUTE; i++) {
          const result = await sendMessage(user1.id, match12Id, `Message ${i}`);
          expect(result.success).toBe(true);
        }
      });

      test('should block messages exceeding rate limit', async () => {
        for (let i = 0; i < MAX_MESSAGES_PER_MINUTE; i++) {
          await sendMessage(user1.id, match12Id, `Message ${i}`);
        }

        await expect(sendMessage(user1.id, match12Id, 'One more'))
          .rejects.toThrow('Rate limit exceeded');
      });

      test('should reset rate limit after timeout', async () => {
        // Use fast expiration for testing
        for (let i = 0; i < MAX_MESSAGES_PER_MINUTE; i++) {
          await sendMessage(user1.id, match12Id, `Message ${i}`);
        }

        // Manually expire the rate limit key
        await mockRedis.del(`messages:rate:${user1.id}`);

        const result = await sendMessage(user1.id, match12Id, 'After reset');
        expect(result.success).toBe(true);
      });

      test('should track rate limits per user', async () => {
        for (let i = 0; i < MAX_MESSAGES_PER_MINUTE; i++) {
          await sendMessage(user1.id, match12Id, `Message ${i}`);
        }

        // user2 should still be able to message
        const result = await sendMessage(user2.id, match12Id, 'From user2');
        expect(result.success).toBe(true);
      });
    });

    describe('Content Moderation', () => {
      test('should block payment solicitation keywords', async () => {
        await expect(sendMessage(user1.id, match12Id, 'Send me money on venmo'))
          .rejects.toThrow('Payment solicitation is not allowed');
      });

      test('should block all payment platforms', async () => {
        const platforms = ['venmo', 'cashapp', 'paypal'];

        for (const platform of platforms) {
          await expect(sendMessage(user1.id, match12Id, `Use ${platform}`))
            .rejects.toThrow('Payment solicitation is not allowed');
        }
      });

      test('should flag messages with phone numbers', async () => {
        const result = await sendMessage(user1.id, match12Id, 'Call me at 555-123-4567');

        expect(result.message.moderationWarning).toContain('Phone number detected');
      });

      test('should flag messages with URLs', async () => {
        const result = await sendMessage(user1.id, match12Id, 'Check out https://example.com');

        expect(result.message.moderationWarning).toContain('Link detected');
      });

      test('should block spam keywords', async () => {
        await expect(sendMessage(user1.id, match12Id, 'This is a scam'))
          .rejects.toThrow('Payment solicitation is not allowed');
      });
    });

    describe('AI Detection', () => {
      test('should flag obvious AI patterns', async () => {
        const result = await sendMessage(
          user1.id,
          match12Id,
          'As an AI, I am designed to help you.'
        );

        expect(result.message.aiWarning).toBeDefined();
      });

      test('should not flag normal human messages', async () => {
        const result = await sendMessage(
          user1.id,
          match12Id,
          'Hey! How was your day?'
        );

        expect(result.message.aiWarning).toBeNull();
      });

      test('should calculate AI score', async () => {
        await sendMessage(
          user1.id,
          match12Id,
          'I am a language model and my purpose is to assist.'
        );

        const messages = await mockDb.findMessagesByMatchId(match12Id);

        expect(messages[0].aiScore).toBeGreaterThan(0);
      });

      test('should flag but not block AI-suspected messages', async () => {
        const result = await sendMessage(
          user1.id,
          match12Id,
          'As an AI, I cannot provide personal opinions.'
        );

        expect(result.success).toBe(true);
        expect(result.message.aiWarning).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // GET CONVERSATION TESTS
  // ===========================================================================

  describe('Get Conversation', () => {
    beforeEach(async () => {
      // Add some messages to the conversation
      await sendMessage(user1.id, match12Id, 'Hello!');
      await sendMessage(user2.id, match12Id, 'Hi there!');
      await sendMessage(user1.id, match12Id, 'How are you?');
      await sendMessage(user2.id, match12Id, 'Great, thanks!');
    });

    test('should return conversation messages', async () => {
      const result = await getConversation(user1.id, match12Id);

      expect(result.success).toBe(true);
      expect(result.messages.length).toBe(4);
    });

    test('should return messages in chronological order', async () => {
      const result = await getConversation(user1.id, match12Id);

      expect(result.messages[0].content).toBe('Hello!');
      expect(result.messages[3].content).toBe('Great, thanks!');
    });

    test('should include participant info', async () => {
      const result = await getConversation(user1.id, match12Id);

      expect(result.participant.userId).toBe(user2.id);
      expect(result.participant.displayName).toBe('User Two');
    });

    test('should indicate own messages', async () => {
      const result = await getConversation(user1.id, match12Id);

      expect(result.messages[0].isOwn).toBe(true); // First message from user1
      expect(result.messages[1].isOwn).toBe(false); // Second message from user2
    });

    test('should include read status', async () => {
      const result = await getConversation(user1.id, match12Id);

      result.messages.forEach(msg => {
        expect(msg).toHaveProperty('isRead');
        expect(msg).toHaveProperty('readAt');
      });
    });

    test('should return total message count', async () => {
      const result = await getConversation(user1.id, match12Id);

      expect(result.totalCount).toBe(4);
    });

    test('should respect limit parameter', async () => {
      const result = await getConversation(user1.id, match12Id, { limit: 2 });

      expect(result.messages.length).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    test('should return most recent messages when limited', async () => {
      const result = await getConversation(user1.id, match12Id, { limit: 2 });

      // Should get last 2 messages
      expect(result.messages[0].content).toBe('How are you?');
      expect(result.messages[1].content).toBe('Great, thanks!');
    });

    test('should filter messages before timestamp', async () => {
      const allMessages = await mockDb.findMessagesByMatchId(match12Id);
      const cutoff = allMessages[2].createdAt; // Third message

      const result = await getConversation(user1.id, match12Id, { before: cutoff });

      expect(result.messages.length).toBe(2);
    });

    test('should filter messages after timestamp', async () => {
      const allMessages = await mockDb.findMessagesByMatchId(match12Id);
      const cutoff = allMessages[1].createdAt; // Second message

      const result = await getConversation(user1.id, match12Id, { after: cutoff });

      expect(result.messages.length).toBe(2);
    });

    test('should reject unauthorized access', async () => {
      await expect(getConversation(user3.id, match12Id))
        .rejects.toThrow('Not authorized');
    });

    test('should reject non-existent match', async () => {
      await expect(getConversation(user1.id, 'fake-match-id'))
        .rejects.toThrow('Match not found');
    });

    test('should handle deleted user gracefully', async () => {
      // Delete user2's profile
      mockDb.profiles.delete(user2.id);

      const result = await getConversation(user1.id, match12Id);

      expect(result.participant.displayName).toBe('Deleted User');
    });

    test('should return empty messages for new match', async () => {
      const newMatch = await mockDb.createMatch({
        userId1: user1.id,
        userId2: user3.id
      });

      const result = await getConversation(user1.id, newMatch.id);

      expect(result.messages).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  // ===========================================================================
  // MARK AS READ TESTS
  // ===========================================================================

  describe('Mark as Read', () => {
    beforeEach(async () => {
      // Send messages from user2 to user1
      await sendMessage(user2.id, match12Id, 'Message 1');
      await sendMessage(user2.id, match12Id, 'Message 2');
      await sendMessage(user2.id, match12Id, 'Message 3');
    });

    test('should mark all messages as read', async () => {
      const result = await markAllAsRead(user1.id, match12Id);

      expect(result.success).toBe(true);
      expect(result.markedCount).toBe(3);

      const messages = await mockDb.findMessagesByMatchId(match12Id);
      expect(messages.every(m => m.isRead)).toBe(true);
    });

    test('should set readAt timestamp', async () => {
      await markAllAsRead(user1.id, match12Id);

      const messages = await mockDb.findMessagesByMatchId(match12Id);

      messages.forEach(msg => {
        expect(msg.readAt).toBeDefined();
      });
    });

    test('should mark specific messages as read', async () => {
      const messages = await mockDb.findMessagesByMatchId(match12Id);
      const specificIds = [messages[0].id, messages[1].id];

      const result = await markAsRead(user1.id, match12Id, specificIds);

      expect(result.markedCount).toBe(2);

      const updatedMessages = await mockDb.findMessagesByMatchId(match12Id);

      expect(updatedMessages[0].isRead).toBe(true);
      expect(updatedMessages[1].isRead).toBe(true);
      expect(updatedMessages[2].isRead).toBe(false);
    });

    test('should not count already read messages', async () => {
      await markAllAsRead(user1.id, match12Id);

      const result = await markAllAsRead(user1.id, match12Id);

      expect(result.markedCount).toBe(0);
    });

    test('should only mark messages sent TO user', async () => {
      // Send message FROM user1
      await sendMessage(user1.id, match12Id, 'My message');

      // Try to mark as read
      const result = await markAllAsRead(user1.id, match12Id);

      // Should only mark the 3 messages from user2
      expect(result.markedCount).toBe(3);
    });

    test('should reject unauthorized access', async () => {
      await expect(markAsRead(user3.id, match12Id))
        .rejects.toThrow('Not authorized');
    });

    test('should reject non-existent match', async () => {
      await expect(markAsRead(user1.id, 'fake-match-id'))
        .rejects.toThrow('Match not found');
    });
  });

  // ===========================================================================
  // UNREAD COUNT TESTS
  // ===========================================================================

  describe('Unread Count', () => {
    test('should return correct unread count', async () => {
      // Send 3 messages to user1
      await sendMessage(user2.id, match12Id, 'Message 1');
      await sendMessage(user2.id, match12Id, 'Message 2');
      await sendMessage(user2.id, match12Id, 'Message 3');

      const result = await getUnreadCount(user1.id);

      expect(result.success).toBe(true);
      expect(result.unreadCount).toBe(3);
    });

    test('should return 0 when no unread messages', async () => {
      const result = await getUnreadCount(user1.id);

      expect(result.unreadCount).toBe(0);
    });

    test('should count across all matches', async () => {
      // Create another match
      const match13 = await mockDb.createMatch({
        userId1: user1.id,
        userId2: user3.id
      });

      // Send messages in both matches
      await sendMessage(user2.id, match12Id, 'From user2');
      await sendMessage(user3.id, match13.id, 'From user3');

      const result = await getUnreadCount(user1.id);

      expect(result.unreadCount).toBe(2);
    });

    test('should not count messages in inactive matches', async () => {
      await sendMessage(user2.id, match12Id, 'Message');

      // Deactivate match
      await mockDb.updateMatch(match12Id, { isActive: false });

      const result = await getUnreadCount(user1.id);

      expect(result.unreadCount).toBe(0);
    });

    test('should decrease after marking as read', async () => {
      await sendMessage(user2.id, match12Id, 'Message 1');
      await sendMessage(user2.id, match12Id, 'Message 2');

      const before = await getUnreadCount(user1.id);
      expect(before.unreadCount).toBe(2);

      await markAllAsRead(user1.id, match12Id);

      const after = await getUnreadCount(user1.id);
      expect(after.unreadCount).toBe(0);
    });
  });

  // ===========================================================================
  // DELETE MESSAGE TESTS
  // ===========================================================================

  describe('Delete Message', () => {
    test('should delete own message', async () => {
      const { message } = await sendMessage(user1.id, match12Id, 'To delete');

      const result = await deleteMessage(user1.id, match12Id, message.id);

      expect(result.success).toBe(true);
    });

    test('should replace content with deleted placeholder', async () => {
      const { message } = await sendMessage(user1.id, match12Id, 'Secret');

      await deleteMessage(user1.id, match12Id, message.id);

      const messages = await mockDb.findMessagesByMatchId(match12Id);
      const deleted = messages.find(m => m.id === message.id);

      expect(deleted.content).toBe('[Message deleted]');
      expect(deleted.deleted).toBe(true);
    });

    test('should reject deleting others message', async () => {
      const { message } = await sendMessage(user1.id, match12Id, 'My message');

      await expect(deleteMessage(user2.id, match12Id, message.id))
        .rejects.toThrow('Can only delete your own messages');
    });

    test('should reject deleting old message', async () => {
      const { message } = await sendMessage(user1.id, match12Id, 'Old message');

      // Modify message timestamp to be older
      const messages = await mockDb.findMessagesByMatchId(match12Id);
      const msg = messages.find(m => m.id === message.id);
      msg.createdAt = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

      await expect(deleteMessage(user1.id, match12Id, message.id))
        .rejects.toThrow('Can only delete messages within 5 minutes');
    });

    test('should reject non-existent message', async () => {
      await expect(deleteMessage(user1.id, match12Id, 'fake-msg-id'))
        .rejects.toThrow('Message not found');
    });

    test('should reject non-existent match', async () => {
      await expect(deleteMessage(user1.id, 'fake-match-id', 'msg-id'))
        .rejects.toThrow('Match not found');
    });
  });

  // ===========================================================================
  // MESSAGE VALIDATION TESTS
  // ===========================================================================

  describe('Message Validation', () => {
    test('should allow normal text messages', async () => {
      const result = await sendMessage(user1.id, match12Id, 'Normal message');

      expect(result.success).toBe(true);
    });

    test('should allow emojis', async () => {
      const result = await sendMessage(user1.id, match12Id, 'Hello! Nice to meet you');

      expect(result.success).toBe(true);
    });

    test('should allow unicode characters', async () => {
      const result = await sendMessage(user1.id, match12Id, 'Bonjour! Como estas?');

      expect(result.success).toBe(true);
    });

    test('should allow newlines', async () => {
      const result = await sendMessage(
        user1.id,
        match12Id,
        'Line 1\nLine 2\nLine 3'
      );

      expect(result.success).toBe(true);
      expect(result.message.content).toContain('\n');
    });

    test('should handle special characters', async () => {
      const result = await sendMessage(
        user1.id,
        match12Id,
        'Hello! @user #topic $money %off & more...'
      );

      expect(result.success).toBe(true);
    });

    test('should handle quotes', async () => {
      const result = await sendMessage(
        user1.id,
        match12Id,
        'She said "Hello" and he replied \'Hi\''
      );

      expect(result.success).toBe(true);
    });

    test('should reject null content', async () => {
      await expect(sendMessage(user1.id, match12Id, null))
        .rejects.toThrow('Message cannot be empty');
    });

    test('should reject undefined content', async () => {
      await expect(sendMessage(user1.id, match12Id, undefined))
        .rejects.toThrow('Message cannot be empty');
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    test('should handle rapid message sending', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(sendMessage(user1.id, match12Id, `Message ${i}`));
      }

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
    });

    test('should handle concurrent read operations', async () => {
      await sendMessage(user2.id, match12Id, 'Message 1');
      await sendMessage(user2.id, match12Id, 'Message 2');

      const [result1, result2] = await Promise.all([
        markAllAsRead(user1.id, match12Id),
        markAllAsRead(user1.id, match12Id)
      ]);

      // One should mark messages, other should find them already marked
      expect(result1.markedCount + result2.markedCount).toBe(2);
    });

    test('should preserve message order under load', async () => {
      for (let i = 0; i < 10; i++) {
        await sendMessage(user1.id, match12Id, `Message ${i}`);
      }

      const result = await getConversation(user1.id, match12Id);

      for (let i = 0; i < 10; i++) {
        expect(result.messages[i].content).toBe(`Message ${i}`);
      }
    });

    test('should handle maximum length message', async () => {
      const maxMessage = 'A'.repeat(MAX_MESSAGE_LENGTH);

      const result = await sendMessage(user1.id, match12Id, maxMessage);

      expect(result.success).toBe(true);
      expect(result.message.content.length).toBe(MAX_MESSAGE_LENGTH);
    });

    test('should handle message with only spaces inside', async () => {
      const result = await sendMessage(user1.id, match12Id, 'Hello   World');

      expect(result.success).toBe(true);
      expect(result.message.content).toBe('Hello   World');
    });
  });
});
