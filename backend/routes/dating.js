/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * YOUANDINOTAI - Dating App API Routes
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The first 100% human-verified, zero-AI dating app.
 * YouAndINotAI DAO - Founder-Tier Platform (SURVIVAL MODE).
 *
 * Features:
 * - Human verification before matching
 * - Anti-AI message detection
 * - Age verification enforcement
 * - Founding member perks
 *
 * Created by Claude (Opus 4.5) - December 3, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  authMiddleware,
  requireAgeVerification,
  requireHumanVerification,
  registerUser,
  loginUser,
  logoutUser,
  setAgeVerified,
  setHumanVerified,
  getUserById
} from '../services/auth.js';
import { recordTransaction, DAO_REVENUE_CONFIG } from '../services/dao-revenue.js';

const router = express.Router();

// In-memory stores (will be replaced with Prisma)
const profiles = new Map();
const likes = new Map();
const matches = new Map();
const messages = new Map();
const foundingMembers = new Map();

// Founding member counter
let foundingMemberCount = 0;
const MAX_FOUNDING_MEMBERS = 100;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dating/register
 * Register a new dating app user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    const result = await registerUser({ email, password, displayName });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your age and humanity.',
      user: result.user,
      nextSteps: {
        ageVerification: '/api/dating/verify-age',
        humanVerification: '/api/dating/verify-human'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/dating/login
 * Login to dating app
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/dating/logout
 * Logout from dating app
 */
router.post('/logout', authMiddleware, (req, res) => {
  const { refreshToken } = req.body;
  const sessionId = req.headers['x-session-id'];

  logoutUser(sessionId, refreshToken);

  res.json({ success: true, message: 'Logged out successfully' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dating/verify-age
 * Complete age verification
 */
router.post('/verify-age', authMiddleware, (req, res) => {
  try {
    const { birthDate, attestation } = req.body;

    // Verify user is 18+
    const birth = new Date(birthDate);
    const today = new Date();
    const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));

    if (age < 18) {
      return res.status(403).json({
        error: 'You must be 18 or older to use this app',
        message: 'Age verification is required for all users.'
      });
    }

    if (!attestation) {
      return res.status(400).json({
        error: 'Age attestation required'
      });
    }

    // Mark user as age verified
    const verificationId = `age-${Date.now()}`;
    setAgeVerified(req.user.userId, verificationId);

    res.json({
      success: true,
      message: 'Age verified successfully',
      verificationId,
      nextStep: '/api/dating/verify-human'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/dating/verify-human
 * Complete human verification (Anti-AI)
 */
router.post('/verify-human', authMiddleware, (req, res) => {
  try {
    const { method, challenge, response } = req.body;

    // Simple verification (will be enhanced with actual human verification)
    // Methods: 'video', 'captcha', 'live-call'

    let score = 0;
    let verified = false;

    switch (method) {
      case 'video':
        // Video verification scores higher
        score = 95;
        verified = true;
        break;
      case 'captcha':
        // Basic captcha
        score = 70;
        verified = response === challenge.answer;
        break;
      case 'live-call':
        // Live call with human verifier
        score = 100;
        verified = true;
        break;
      default:
        return res.status(400).json({ error: 'Invalid verification method' });
    }

    if (!verified) {
      return res.status(400).json({
        error: 'Human verification failed',
        message: 'Please try again or use a different method'
      });
    }

    setHumanVerified(req.user.userId, method, score);

    res.json({
      success: true,
      message: 'You are verified as human!',
      score,
      method,
      badge: 'HUMAN_VERIFIED'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dating/profile
 * Get current user's profile
 */
router.get('/profile', authMiddleware, (req, res) => {
  const profile = profiles.get(req.user.userId);

  if (!profile) {
    return res.json({
      success: true,
      profile: null,
      message: 'Profile not created yet',
      createUrl: '/api/dating/profile'
    });
  }

  res.json({ success: true, profile });
});

/**
 * POST /api/dating/profile
 * Create or update profile
 */
router.post('/profile', authMiddleware, requireAgeVerification, (req, res) => {
  const {
    displayName,
    bio,
    gender,
    lookingFor,
    location,
    ageRangeMin,
    ageRangeMax,
    maxDistance
  } = req.body;

  const existingProfile = profiles.get(req.user.userId);

  const profile = {
    userId: req.user.userId,
    displayName: displayName || existingProfile?.displayName || 'Anonymous',
    bio: bio || existingProfile?.bio || '',
    gender: gender || existingProfile?.gender || null,
    lookingFor: lookingFor || existingProfile?.lookingFor || [],
    location: location || existingProfile?.location || null,
    ageRangeMin: ageRangeMin || existingProfile?.ageRangeMin || 18,
    ageRangeMax: ageRangeMax || existingProfile?.ageRangeMax || 99,
    maxDistance: maxDistance || existingProfile?.maxDistance || 50,
    photoUrls: existingProfile?.photoUrls || [],
    primaryPhoto: existingProfile?.primaryPhoto || null,
    isHumanVerified: req.user.humanVerified,
    isFoundingMember: foundingMembers.has(req.user.userId),
    updatedAt: new Date().toISOString()
  };

  profiles.set(req.user.userId, profile);

  res.json({
    success: true,
    message: existingProfile ? 'Profile updated' : 'Profile created',
    profile
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY & MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dating/discover
 * Get profiles to swipe on
 */
router.get('/discover', authMiddleware, requireAgeVerification, requireHumanVerification, (req, res) => {
  const myProfile = profiles.get(req.user.userId);

  if (!myProfile) {
    return res.status(400).json({
      error: 'Please complete your profile first',
      redirectTo: '/api/dating/profile'
    });
  }

  // Get potential matches (excluding already liked/matched)
  const likedUsers = new Set();
  for (const [key, like] of likes) {
    if (key.startsWith(req.user.userId + ':')) {
      likedUsers.add(like.toUserId);
    }
  }

  const matchedUsers = new Set();
  for (const [key, match] of matches) {
    if (match.userId1 === req.user.userId) matchedUsers.add(match.userId2);
    if (match.userId2 === req.user.userId) matchedUsers.add(match.userId1);
  }

  const potentialMatches = [];
  for (const [userId, profile] of profiles) {
    if (
      userId !== req.user.userId &&
      !likedUsers.has(userId) &&
      !matchedUsers.has(userId) &&
      profile.isHumanVerified
    ) {
      potentialMatches.push({
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        primaryPhoto: profile.primaryPhoto,
        isHumanVerified: profile.isHumanVerified,
        isFoundingMember: profile.isFoundingMember
      });
    }
  }

  res.json({
    success: true,
    profiles: potentialMatches.slice(0, 10), // Limit to 10
    remainingToday: req.user.isPremium ? 'Unlimited' : 10
  });
});

/**
 * POST /api/dating/like
 * Like a profile
 */
router.post('/like', authMiddleware, requireAgeVerification, requireHumanVerification, (req, res) => {
  const { targetUserId, isSuperLike } = req.body;

  if (targetUserId === req.user.userId) {
    return res.status(400).json({ error: 'Cannot like yourself' });
  }

  const likeKey = `${req.user.userId}:${targetUserId}`;
  const reverseLikeKey = `${targetUserId}:${req.user.userId}`;

  // Check if already liked
  if (likes.has(likeKey)) {
    return res.status(400).json({ error: 'Already liked this user' });
  }

  // Create like
  const like = {
    fromUserId: req.user.userId,
    toUserId: targetUserId,
    isSuperLike: isSuperLike || false,
    createdAt: new Date().toISOString()
  };

  likes.set(likeKey, like);

  // Check for mutual like (match!)
  if (likes.has(reverseLikeKey)) {
    const matchId = `${req.user.userId}:${targetUserId}`;
    const match = {
      id: matchId,
      userId1: req.user.userId,
      userId2: targetUserId,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    matches.set(matchId, match);

    return res.json({
      success: true,
      isMatch: true,
      match: {
        matchId,
        matchedWith: targetUserId
      },
      message: "It's a match! You can now message each other."
    });
  }

  res.json({
    success: true,
    isMatch: false,
    message: 'Like sent!'
  });
});

/**
 * POST /api/dating/pass
 * Pass on a profile
 */
router.post('/pass', authMiddleware, (req, res) => {
  const { targetUserId } = req.body;

  // For now, just acknowledge. Could track for algorithm later.
  res.json({ success: true, message: 'Passed' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHES & MESSAGING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dating/matches
 * Get all matches
 */
router.get('/matches', authMiddleware, (req, res) => {
  const userMatches = [];

  for (const [key, match] of matches) {
    if (match.userId1 === req.user.userId || match.userId2 === req.user.userId) {
      const otherUserId = match.userId1 === req.user.userId ? match.userId2 : match.userId1;
      const otherProfile = profiles.get(otherUserId);

      userMatches.push({
        matchId: match.id,
        matchedWith: {
          userId: otherUserId,
          displayName: otherProfile?.displayName || 'User',
          primaryPhoto: otherProfile?.primaryPhoto
        },
        createdAt: match.createdAt,
        isActive: match.isActive
      });
    }
  }

  res.json({
    success: true,
    matches: userMatches,
    count: userMatches.length
  });
});

/**
 * POST /api/dating/message
 * Send a message to a match
 */
router.post('/message', authMiddleware, requireHumanVerification, async (req, res) => {
  const { matchId, content } = req.body;

  const match = matches.get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  // Verify user is part of this match
  if (match.userId1 !== req.user.userId && match.userId2 !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const receiverId = match.userId1 === req.user.userId ? match.userId2 : match.userId1;

  // Anti-AI detection (simple version - will be enhanced)
  const aiScore = detectAIContent(content);

  const message = {
    id: `msg-${Date.now()}`,
    matchId,
    senderId: req.user.userId,
    receiverId,
    content,
    aiScore,
    flagged: aiScore > 80,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  // Store message
  if (!messages.has(matchId)) {
    messages.set(matchId, []);
  }
  messages.get(matchId).push(message);

  if (message.flagged) {
    console.log(`⚠️ AI-detected message flagged from ${req.user.userId}`);
  }

  res.json({
    success: true,
    message: {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      aiWarning: aiScore > 50 ? 'This message may have been AI-generated' : null
    }
  });
});

/**
 * GET /api/dating/messages/:matchId
 * Get messages for a match
 */
router.get('/messages/:matchId', authMiddleware, (req, res) => {
  const { matchId } = req.params;

  const match = matches.get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  // Verify user is part of this match
  if (match.userId1 !== req.user.userId && match.userId2 !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const matchMessages = messages.get(matchId) || [];

  // Mark messages as read
  matchMessages.forEach(msg => {
    if (msg.receiverId === req.user.userId && !msg.isRead) {
      msg.isRead = true;
      msg.readAt = new Date().toISOString();
    }
  });

  res.json({
    success: true,
    messages: matchMessages,
    count: matchMessages.length
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDING MEMBER PREORDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dating/preorder
 * Preorder founding membership
 */
router.post('/preorder', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (foundingMemberCount >= MAX_FOUNDING_MEMBERS) {
      return res.status(400).json({
        error: 'Founding member spots filled',
        message: 'All 100 founding member spots have been claimed!'
      });
    }

    // Check if already preordered
    for (const [id, member] of foundingMembers) {
      if (member.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already preordered' });
      }
    }

    foundingMemberCount++;
    const badgeNumber = foundingMemberCount;

    const member = {
      id: `fm-${Date.now()}`,
      email: email.toLowerCase(),
      name: name || 'Founding Member',
      badgeNumber,
      monthlyPrice: 14.99,
      regularPrice: 19.99,
      lifetimeDiscount: true,
      preorderDate: new Date().toISOString(),
      isActive: true
    };

    foundingMembers.set(member.id, member);

    // Record as transaction (will trigger when payment completes)
    console.log(`🎉 Founding Member #${badgeNumber}: ${email}`);

    res.json({
      success: true,
      message: `Welcome, Founding Member #${badgeNumber}!`,
      member: {
        badgeNumber,
        email: member.email,
        monthlyPrice: member.monthlyPrice,
        savings: 'Save $5/month for life (20% off)',
        perks: [
          'Founding Member badge on profile',
          'Early access to new features',
          'Vote on roadmap features',
          '$14.99/mo locked for life'
        ]
      },
      spotsRemaining: MAX_FOUNDING_MEMBERS - foundingMemberCount,
      checkoutUrl: '/checkout/founding-member' // Will integrate with Square
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/dating/founding-members/status
 * Get founding member availability
 */
router.get('/founding-members/status', (req, res) => {
  res.json({
    success: true,
    totalSpots: MAX_FOUNDING_MEMBERS,
    claimed: foundingMemberCount,
    remaining: MAX_FOUNDING_MEMBERS - foundingMemberCount,
    price: 14.99,
    regularPrice: 19.99,
    discount: '20% off for life',
    mission: 'Building authentic human connections'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simple AI content detection (will be enhanced with actual ML model)
 */
function detectAIContent(text) {
  // Basic heuristics (to be replaced with actual detection)
  let score = 0;

  // Check for common AI patterns
  const aiPatterns = [
    /as an ai/i,
    /i don't have personal/i,
    /i cannot provide/i,
    /i'm designed to/i,
    /my purpose is/i,
    /i am a language model/i
  ];

  aiPatterns.forEach(pattern => {
    if (pattern.test(text)) score += 30;
  });

  // Check for unusually formal language
  const formalWords = ['furthermore', 'additionally', 'consequently', 'nevertheless', 'notwithstanding'];
  formalWords.forEach(word => {
    if (text.toLowerCase().includes(word)) score += 5;
  });

  // Check for repetitive structure
  const sentences = text.split(/[.!?]/);
  if (sentences.length > 3) {
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => sum + Math.abs(s.length - avgLength), 0) / sentences.length;
    if (variance < 10) score += 10; // Very uniform sentence length
  }

  return Math.min(score, 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dating/stats
 * Get dating app stats (public)
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: profiles.size,
      humanVerifiedUsers: [...profiles.values()].filter(p => p.isHumanVerified).length,
      totalMatches: matches.size,
      foundingMembers: foundingMemberCount,
      foundingSpotsRemaining: MAX_FOUNDING_MEMBERS - foundingMemberCount
    },
    platform: {
      name: DAO_REVENUE_CONFIG.PLATFORM_NAME,
      type: 'Non-Charity DAO'
    }
  });
});

export default router;
