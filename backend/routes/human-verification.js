/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HUMAN VERIFICATION API ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints for the human verification system.
 * Used by YouAndINotAI dating app to verify users are human.
 *
 * Created by Claude (Opus 4.5) - December 3, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  startVerification,
  submitChallenge,
  getNextChallenge,
  getVerificationStatus,
  detectAIContent,
  analyzeMessagePattern,
  analyzeBehavior,
  VERIFICATION_THRESHOLD,
  CHALLENGE_TYPES
} from '../services/human-verification.js';
import { authMiddleware } from '../services/auth.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION FLOW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/verify-human/start
 * Start the human verification process
 */
router.post('/start', authMiddleware, (req, res) => {
  try {
    const result = startVerification(req.user.userId);

    res.json({
      success: true,
      ...result,
      challengeTypes: Object.keys(CHALLENGE_TYPES).map(type => ({
        type,
        score: CHALLENGE_TYPES[type].score,
        description: getChallengeDescription(type)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start verification', message: error.message });
  }
});

/**
 * POST /api/verify-human/submit
 * Submit a challenge response
 */
router.post('/submit', authMiddleware, (req, res) => {
  try {
    const { challengeId, response } = req.body;

    if (!challengeId || response === undefined) {
      return res.status(400).json({ error: 'Challenge ID and response required' });
    }

    const result = submitChallenge(challengeId, response, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit challenge', message: error.message });
  }
});

/**
 * GET /api/verify-human/challenge/:type
 * Get a new challenge of specific type
 */
router.get('/challenge/:type', authMiddleware, (req, res) => {
  try {
    const { type } = req.params;

    if (!CHALLENGE_TYPES[type]) {
      return res.status(400).json({
        error: 'Invalid challenge type',
        validTypes: Object.keys(CHALLENGE_TYPES)
      });
    }

    const challenge = getNextChallenge(req.user.userId, type);

    if (challenge.error) {
      return res.status(400).json({ error: challenge.error });
    }

    res.json({
      success: true,
      challenge
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get challenge', message: error.message });
  }
});

/**
 * GET /api/verify-human/status
 * Get current verification status
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    const status = getVerificationStatus(req.user.userId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/verify-human/analyze-text
 * Analyze text for AI-generated content
 */
router.post('/analyze-text', authMiddleware, (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const analysis = detectAIContent(text);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze text', message: error.message });
  }
});

/**
 * POST /api/verify-human/analyze-messages
 * Analyze message history for AI patterns
 */
router.post('/analyze-messages', authMiddleware, (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const analysis = analyzeMessagePattern(messages);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze messages', message: error.message });
  }
});

/**
 * POST /api/verify-human/analyze-behavior
 * Analyze user behavior for bot patterns
 */
router.post('/analyze-behavior', authMiddleware, (req, res) => {
  try {
    const { userActions } = req.body;

    if (!userActions) {
      return res.status(400).json({ error: 'User actions data required' });
    }

    const analysis = analyzeBehavior(userActions);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze behavior', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC INFO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/verify-human/info
 * Get information about the verification system
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    system: 'YouAndINotAI Human Verification',
    description: 'Multi-layer verification to ensure all users are real humans',
    threshold: VERIFICATION_THRESHOLD,
    challengeTypes: Object.keys(CHALLENGE_TYPES).map(type => ({
      type,
      score: CHALLENGE_TYPES[type].score,
      description: getChallengeDescription(type)
    })),
    features: [
      'CAPTCHA challenges',
      'Math puzzles',
      'Image selection',
      'Voice verification',
      'Video gesture verification',
      'Live selfie verification',
      'AI content detection',
      'Behavioral analysis'
    ],
    mission: '100% human-verified dating - no bots, no AI catfishing'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getChallengeDescription(type) {
  const descriptions = {
    CAPTCHA: 'Type the characters shown in the image',
    MATH_PUZZLE: 'Solve a simple math problem',
    IMAGE_SELECT: 'Select images matching a description',
    VOICE_PHRASE: 'Record yourself saying a phrase',
    VIDEO_GESTURE: 'Record a video making a specific gesture',
    LIVE_SELFIE: 'Take a selfie looking in a specific direction'
  };
  return descriptions[type] || type;
}

export default router;
