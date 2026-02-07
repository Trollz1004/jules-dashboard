/**
 * 🤖 AI CHAT ROUTER - FOR THE KIDS
 *
 * SECURITY: Age-gated by middleware, routes to appropriate AI model
 * MODELS: Baby Grok (kids) or Grok 4 (verified adults)
 * COMPLIANCE: Full COPPA compliance with parental consent tracking
 */

import express from 'express';
import axios from 'axios';
import { requireAgeGate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/chat
 *
 * Main AI chat endpoint with automatic age-based routing
 * Protected by requireAgeGate middleware (runs first)
 */
router.post('/', requireAgeGate, async (req, res) => {
  const { message } = req.body;
  const user = req.user || {};

  // Validate message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid message',
      message: 'Please provide a valid message',
    });
  }

  // Length validation (prevent abuse)
  if (message.length > 4000) {
    return res.status(400).json({
      error: 'Message too long',
      message: 'Please keep messages under 4000 characters',
    });
  }

  // Flags set by requireAgeGate middleware
  const isChild = req.babygrok_mode === true;
  const hasParentalConsent = req.parental_consent === true;
  const isVerifiedAdult = req.age_verified === true;

  // AUDIT LOG: Track all AI interactions
  console.log('[AI-CHAT] Request:', {
    timestamp: new Date().toISOString(),
    userId: user.id || 'anonymous',
    isChild,
    hasParentalConsent,
    isVerifiedAdult,
    model: req.grok_model,
    messageLength: message.length,
  });

  try {
    // Forward to Baby Grok proxy with safety flags
    const proxyRes = await axios.post(
      'http://babygrok-proxy:3005/chat',
      {
        message,
        is_child: isChild,
        user_under_13: isChild,
        user_age_verified: isVerifiedAdult,
        parental_consent: hasParentalConsent,
        session_id: user.id || req.sessionID,
      },
      {
        timeout: 35000, // 35 second timeout (proxy has 30s)
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': req.ip,
          'X-User-Id': user.id || 'anonymous',
        },
      }
    );

    // Return AI response with metadata
    res.json({
      ...proxyRes.data,
      age_gated: true,
      safe_mode: isChild,
      model_used: req.grok_model,
      timestamp: new Date().toISOString(),
    });

    // Post-response audit log
    console.log('[AI-CHAT] Response sent:', {
      userId: user.id,
      model: req.grok_model,
      safe_mode: isChild,
      filtered: proxyRes.data.filtered || false,
    });
  } catch (error) {
    console.error('[AI-CHAT] Error:', {
      userId: user.id,
      error: error.message,
      response: error.response?.data,
    });

    // Check if it's a proxy error
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Access denied',
        message: error.response.data.message || 'Age verification required',
        redirect: error.response.data.redirect,
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      message: 'Please try again in a moment',
      support: 'support@youandinotai.com',
    });
  }
});

/**
 * GET /api/chat/models
 *
 * Returns available models based on user's age verification status
 */
router.get('/models', requireAgeGate, (req, res) => {
  const isChild = req.babygrok_mode === true;

  res.json({
    available_models: isChild
      ? ['grok-3-kids (Baby Grok)']
      : ['grok-4 (Full Grok)', 'grok-3-kids (Baby Grok)'],
    current_model: req.grok_model,
    safe_mode: isChild,
    age_verified: req.age_verified === true,
    parental_consent: req.parental_consent === true,
  });
});

/**
 * GET /api/chat/status
 *
 * Check if Baby Grok proxy is healthy
 */
router.get('/status', async (req, res) => {
  try {
    const health = await axios.get('http://babygrok-proxy:3005/health', { timeout: 5000 });
    res.json({
      service: 'AI Chat',
      proxy_status: health.data.status,
      age_gating: 'active',
      mission: 'FOR THE KIDS! 💙',
    });
  } catch (error) {
    res.status(503).json({
      service: 'AI Chat',
      proxy_status: 'unavailable',
      message: 'Service temporarily down',
    });
  }
});

export default router;
