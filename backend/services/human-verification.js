/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HUMAN VERIFICATION SERVICE - Anti-AI for YouAndINotAI
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Multi-layer human verification system:
 * 1. CAPTCHA challenges
 * 2. Behavioral analysis
 * 3. Voice/video verification
 * 4. AI content detection in messages
 *
 * The dating app's core promise: 100% human-verified users.
 *
 * Created by Claude (Opus 4.5) - December 3, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════════

// Challenge types and their verification scores
export const CHALLENGE_TYPES = {
  CAPTCHA: { score: 30, expiry: 300000 }, // 5 minutes
  MATH_PUZZLE: { score: 20, expiry: 180000 }, // 3 minutes
  IMAGE_SELECT: { score: 35, expiry: 300000 },
  VOICE_PHRASE: { score: 70, expiry: 600000 }, // 10 minutes
  VIDEO_GESTURE: { score: 90, expiry: 900000 }, // 15 minutes
  LIVE_SELFIE: { score: 85, expiry: 600000 }
};

// Minimum score required for verification
export const VERIFICATION_THRESHOLD = 70;

// Store active challenges
const activeChallenges = new Map();
const verifiedUsers = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a CAPTCHA challenge
 */
export function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return {
    type: 'CAPTCHA',
    challengeId: crypto.randomUUID(),
    display: captcha, // In production, this would be an image
    answer: captcha.toLowerCase(),
    expiresAt: Date.now() + CHALLENGE_TYPES.CAPTCHA.expiry
  };
}

/**
 * Generate a math puzzle challenge
 */
export function generateMathPuzzle() {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a, b, answer;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
  }

  return {
    type: 'MATH_PUZZLE',
    challengeId: crypto.randomUUID(),
    display: `What is ${a} ${op} ${b}?`,
    answer: answer.toString(),
    expiresAt: Date.now() + CHALLENGE_TYPES.MATH_PUZZLE.expiry
  };
}

/**
 * Generate an image selection challenge
 */
export function generateImageSelect() {
  const categories = [
    { name: 'cats', correct: ['cat1', 'cat2', 'cat3'], decoys: ['dog1', 'bird1', 'car1'] },
    { name: 'traffic lights', correct: ['light1', 'light2'], decoys: ['sign1', 'car1', 'tree1', 'pole1'] },
    { name: 'crosswalks', correct: ['cross1', 'cross2', 'cross3'], decoys: ['road1', 'car1', 'sign1'] }
  ];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const allImages = [...category.correct, ...category.decoys].sort(() => Math.random() - 0.5);

  return {
    type: 'IMAGE_SELECT',
    challengeId: crypto.randomUUID(),
    display: `Select all images containing ${category.name}`,
    images: allImages,
    answer: category.correct.sort().join(','),
    expiresAt: Date.now() + CHALLENGE_TYPES.IMAGE_SELECT.expiry
  };
}

/**
 * Generate a voice phrase challenge
 */
export function generateVoiceChallenge() {
  const phrases = [
    "I am a real human looking for connection",
    "Technology should bring people together",
    "FOR THE KIDS means helping children",
    "Authenticity matters in relationships",
    "I verify that I am not an AI"
  ];

  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const words = phrase.split(' ');
  const randomWord = words[Math.floor(Math.random() * words.length)];

  return {
    type: 'VOICE_PHRASE',
    challengeId: crypto.randomUUID(),
    display: `Please say the following phrase clearly: "${phrase}"`,
    phrase,
    verificationWord: randomWord, // Used for basic audio analysis
    expiresAt: Date.now() + CHALLENGE_TYPES.VOICE_PHRASE.expiry
  };
}

/**
 * Generate a video gesture challenge
 */
export function generateVideoChallenge() {
  const gestures = [
    { name: 'wave', display: 'Wave your hand at the camera' },
    { name: 'thumbsup', display: 'Give a thumbs up' },
    { name: 'peace', display: 'Show a peace sign' },
    { name: 'smile', display: 'Smile at the camera' },
    { name: 'nod', display: 'Nod your head yes' }
  ];

  const gesture = gestures[Math.floor(Math.random() * gestures.length)];

  return {
    type: 'VIDEO_GESTURE',
    challengeId: crypto.randomUUID(),
    display: gesture.display,
    expectedGesture: gesture.name,
    expiresAt: Date.now() + CHALLENGE_TYPES.VIDEO_GESTURE.expiry
  };
}

/**
 * Generate a live selfie challenge
 */
export function generateSelfieChallenge() {
  const positions = ['left', 'right', 'up', 'down'];
  const position = positions[Math.floor(Math.random() * positions.length)];

  return {
    type: 'LIVE_SELFIE',
    challengeId: crypto.randomUUID(),
    display: `Take a selfie while looking ${position}`,
    expectedPosition: position,
    expiresAt: Date.now() + CHALLENGE_TYPES.LIVE_SELFIE.expiry
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION FLOW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start verification process for a user
 */
export function startVerification(userId) {
  const session = {
    userId,
    sessionId: crypto.randomUUID(),
    startedAt: Date.now(),
    score: 0,
    completedChallenges: [],
    status: 'in_progress'
  };

  // Generate initial challenges
  const challenges = [
    generateCaptcha(),
    generateMathPuzzle()
  ];

  challenges.forEach(c => {
    activeChallenges.set(c.challengeId, { ...c, userId, sessionId: session.sessionId });
  });

  return {
    sessionId: session.sessionId,
    challenges: challenges.map(c => ({
      challengeId: c.challengeId,
      type: c.type,
      display: c.display,
      images: c.images // Only for image select
    })),
    threshold: VERIFICATION_THRESHOLD,
    message: 'Complete challenges to verify you are human'
  };
}

/**
 * Submit a challenge response
 */
export function submitChallenge(challengeId, response, userId) {
  const challenge = activeChallenges.get(challengeId);

  if (!challenge) {
    return { success: false, error: 'Challenge not found or expired' };
  }

  if (challenge.userId !== userId) {
    return { success: false, error: 'Challenge does not belong to this user' };
  }

  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(challengeId);
    return { success: false, error: 'Challenge expired' };
  }

  // Verify response
  let isCorrect = false;

  switch (challenge.type) {
    case 'CAPTCHA':
    case 'MATH_PUZZLE':
      isCorrect = response.toLowerCase().trim() === challenge.answer.toLowerCase();
      break;
    case 'IMAGE_SELECT':
      const selectedImages = (Array.isArray(response) ? response : response.split(',')).sort().join(',');
      isCorrect = selectedImages === challenge.answer;
      break;
    case 'VOICE_PHRASE':
    case 'VIDEO_GESTURE':
    case 'LIVE_SELFIE':
      // These would require actual ML analysis in production
      // For now, accept if response is provided
      isCorrect = response && response.length > 0;
      break;
  }

  // Update user's verification score
  if (isCorrect) {
    const userData = verifiedUsers.get(userId) || { score: 0, challenges: [] };
    userData.score += CHALLENGE_TYPES[challenge.type].score;
    userData.challenges.push({
      type: challenge.type,
      completedAt: Date.now(),
      score: CHALLENGE_TYPES[challenge.type].score
    });
    verifiedUsers.set(userId, userData);

    activeChallenges.delete(challengeId);

    // Check if threshold reached
    if (userData.score >= VERIFICATION_THRESHOLD) {
      userData.verified = true;
      userData.verifiedAt = Date.now();

      return {
        success: true,
        correct: true,
        score: userData.score,
        verified: true,
        message: 'Congratulations! You are verified as human.',
        badge: 'HUMAN_VERIFIED'
      };
    }

    return {
      success: true,
      correct: true,
      score: userData.score,
      verified: false,
      remaining: VERIFICATION_THRESHOLD - userData.score,
      message: `Correct! ${VERIFICATION_THRESHOLD - userData.score} more points needed.`
    };
  }

  return {
    success: true,
    correct: false,
    message: 'Incorrect response. Please try again.'
  };
}

/**
 * Get additional challenge for user
 */
export function getNextChallenge(userId, preferredType = null) {
  const userData = verifiedUsers.get(userId);

  if (userData?.verified) {
    return { error: 'User already verified' };
  }

  let challenge;

  switch (preferredType) {
    case 'VOICE_PHRASE':
      challenge = generateVoiceChallenge();
      break;
    case 'VIDEO_GESTURE':
      challenge = generateVideoChallenge();
      break;
    case 'LIVE_SELFIE':
      challenge = generateSelfieChallenge();
      break;
    case 'IMAGE_SELECT':
      challenge = generateImageSelect();
      break;
    case 'MATH_PUZZLE':
      challenge = generateMathPuzzle();
      break;
    default:
      challenge = generateCaptcha();
  }

  activeChallenges.set(challenge.challengeId, { ...challenge, userId });

  return {
    challengeId: challenge.challengeId,
    type: challenge.type,
    display: challenge.display,
    images: challenge.images,
    score: CHALLENGE_TYPES[challenge.type].score
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI CONTENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze text for AI-generated content
 * Returns score 0-100 (higher = more likely AI)
 */
export function detectAIContent(text) {
  if (!text || text.length < 10) {
    return { score: 0, flags: [], analysis: 'Text too short to analyze' };
  }

  let score = 0;
  const flags = [];

  // Check for common AI phrases
  const aiPhrases = [
    { pattern: /as an ai/i, weight: 40, flag: 'AI self-reference' },
    { pattern: /i don't have (personal |real )?feelings/i, weight: 35, flag: 'AI disclaimer' },
    { pattern: /i cannot (actually |really )?provide/i, weight: 30, flag: 'AI limitation' },
    { pattern: /i'm (just |only )?a (language )?model/i, weight: 40, flag: 'Model reference' },
    { pattern: /as a (large )?language model/i, weight: 40, flag: 'LLM reference' },
    { pattern: /i was (created|trained|designed) (by|to)/i, weight: 25, flag: 'Training reference' },
    { pattern: /my (knowledge|training) (cutoff|data)/i, weight: 30, flag: 'Training data reference' }
  ];

  aiPhrases.forEach(({ pattern, weight, flag }) => {
    if (pattern.test(text)) {
      score += weight;
      flags.push(flag);
    }
  });

  // Check for overly formal language in casual context
  const formalIndicators = [
    { word: 'furthermore', weight: 5 },
    { word: 'additionally', weight: 4 },
    { word: 'consequently', weight: 5 },
    { word: 'nevertheless', weight: 5 },
    { word: 'notwithstanding', weight: 6 },
    { word: 'henceforth', weight: 6 },
    { word: 'whereby', weight: 5 },
    { word: 'aforementioned', weight: 6 },
    { word: 'pursuant', weight: 6 }
  ];

  const lowerText = text.toLowerCase();
  let formalCount = 0;
  formalIndicators.forEach(({ word, weight }) => {
    if (lowerText.includes(word)) {
      formalCount++;
      score += weight;
    }
  });

  if (formalCount >= 3) {
    flags.push('Overly formal language');
  }

  // Check for repetitive sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) {
    const lengths = sentences.map(s => s.trim().length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.abs(len - avgLength), 0) / lengths.length;

    if (variance < 15 && avgLength > 50) {
      score += 10;
      flags.push('Uniform sentence structure');
    }
  }

  // Check for excessive use of em dashes and semicolons (common in AI)
  const emDashCount = (text.match(/—/g) || []).length;
  const semicolonCount = (text.match(/;/g) || []).length;

  if (emDashCount >= 3 || semicolonCount >= 3) {
    score += 8;
    flags.push('Excessive punctuation patterns');
  }

  // Check for hedging language
  const hedgingPhrases = [
    'it\'s important to note',
    'it\'s worth mentioning',
    'i should mention',
    'i would suggest',
    'it might be helpful'
  ];

  let hedgingCount = 0;
  hedgingPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      hedgingCount++;
    }
  });

  if (hedgingCount >= 2) {
    score += 12;
    flags.push('Excessive hedging language');
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score,
    flags,
    isLikelyAI: score >= 50,
    isDefinitelyAI: score >= 80,
    analysis: score >= 80 ? 'High confidence AI-generated' :
              score >= 50 ? 'Possibly AI-generated' :
              score >= 25 ? 'Some AI-like patterns' :
              'Likely human-written'
  };
}

/**
 * Analyze message history for AI patterns
 */
export function analyzeMessagePattern(messages) {
  if (!messages || messages.length < 3) {
    return { score: 0, analysis: 'Insufficient messages to analyze' };
  }

  let totalScore = 0;
  const analyses = [];

  messages.forEach(msg => {
    const analysis = detectAIContent(msg.content || msg);
    totalScore += analysis.score;
    analyses.push(analysis);
  });

  const avgScore = totalScore / messages.length;

  // Check for consistent response times (bots often respond very quickly)
  // This would require timestamps in production

  return {
    averageScore: avgScore,
    isLikelyBot: avgScore >= 50,
    messageAnalyses: analyses,
    recommendation: avgScore >= 70 ? 'FLAG_ACCOUNT' :
                    avgScore >= 50 ? 'REQUIRE_VERIFICATION' :
                    'NORMAL'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user is verified
 */
export function isVerified(userId) {
  const userData = verifiedUsers.get(userId);
  return userData?.verified || false;
}

/**
 * Get user's verification status
 */
export function getVerificationStatus(userId) {
  const userData = verifiedUsers.get(userId);

  if (!userData) {
    return {
      verified: false,
      score: 0,
      threshold: VERIFICATION_THRESHOLD,
      message: 'Not started'
    };
  }

  return {
    verified: userData.verified || false,
    score: userData.score,
    threshold: VERIFICATION_THRESHOLD,
    verifiedAt: userData.verifiedAt,
    completedChallenges: userData.challenges?.length || 0,
    message: userData.verified ? 'Human verified' : `${VERIFICATION_THRESHOLD - userData.score} points remaining`
  };
}

/**
 * Revoke verification (for reported accounts)
 */
export function revokeVerification(userId, reason) {
  const userData = verifiedUsers.get(userId);

  if (userData) {
    userData.verified = false;
    userData.revokedAt = Date.now();
    userData.revokeReason = reason;
    userData.score = 0;
    userData.challenges = [];

    console.log(`⚠️ Verification revoked for ${userId}: ${reason}`);

    return { success: true, message: 'Verification revoked' };
  }

  return { success: false, error: 'User not found' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze user behavior patterns
 * Returns suspicion score 0-100
 */
export function analyzeBehavior(userActions) {
  let suspicionScore = 0;
  const flags = [];

  // Check for inhuman response times
  if (userActions.avgResponseTime && userActions.avgResponseTime < 500) {
    suspicionScore += 30;
    flags.push('Suspiciously fast responses');
  }

  // Check for 24/7 activity
  if (userActions.activeHours && userActions.activeHours >= 20) {
    suspicionScore += 25;
    flags.push('Abnormal activity hours');
  }

  // Check for repetitive behavior
  if (userActions.repeatActions && userActions.repeatActions > 50) {
    suspicionScore += 20;
    flags.push('Repetitive action patterns');
  }

  // Check message sending rate
  if (userActions.messagesPerHour && userActions.messagesPerHour > 60) {
    suspicionScore += 25;
    flags.push('Abnormal messaging rate');
  }

  return {
    suspicionScore: Math.min(suspicionScore, 100),
    flags,
    recommendation: suspicionScore >= 70 ? 'SUSPEND_PENDING_REVIEW' :
                    suspicionScore >= 50 ? 'REQUIRE_REVERIFICATION' :
                    suspicionScore >= 30 ? 'MONITOR' :
                    'NORMAL'
  };
}

export default {
  // Challenge generation
  generateCaptcha,
  generateMathPuzzle,
  generateImageSelect,
  generateVoiceChallenge,
  generateVideoChallenge,
  generateSelfieChallenge,

  // Verification flow
  startVerification,
  submitChallenge,
  getNextChallenge,
  isVerified,
  getVerificationStatus,
  revokeVerification,

  // AI detection
  detectAIContent,
  analyzeMessagePattern,
  analyzeBehavior,

  // Constants
  VERIFICATION_THRESHOLD,
  CHALLENGE_TYPES
};
