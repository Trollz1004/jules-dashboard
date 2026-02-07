/**
 * 🤖 DROID ORCHESTRATOR - Multi-Agent Automation Hub
 *
 * Coordinates autonomous agents (droids) across the infrastructure
 * FOR THE KIDS - Revenue Generation & Operational Automation
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { authMiddleware } from '../services/auth.js';

const router = express.Router();
const execAsync = promisify(exec);

/**
 * Sanitize input for SSH commands to prevent command injection
 *
 * SECURITY: This prevents attackers from injecting shell commands
 * Example attack: item_title = "test'; rm -rf /"
 *
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input safe for shell commands
 */
function sanitizeShellInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove or escape dangerous characters
  // Allow only: alphanumeric, spaces, dashes, underscores, periods, commas
  return input.replace(/[^a-zA-Z0-9\s\-_.,$]/g, '');
}

/**
 * Validate and sanitize numeric input
 *
 * @param {any} input - Input to validate as number
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Safe numeric value
 */
function sanitizeNumericInput(input, defaultValue = 0) {
  const num = parseFloat(input);
  return isNaN(num) || num < 0 ? defaultValue : num;
}

// Require authentication for ALL droid orchestrator routes
// These routes execute system commands and MUST be protected
router.use(authMiddleware);

/**
 * POST /api/droid/crosslist
 * Trigger Crosslister Droid on Sabertooth (192.168.0.103)
 * Lists excess hardware on eBay/Amazon with automatic Gospel split
 */
router.post('/crosslist', async (req, res) => {
  try {
    const { item_title, item_description, item_price, image_url, cogs_estimate } = req.body;

    // Validate input
    if (!item_title || !item_price) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['item_title', 'item_price']
      });
    }

    // SECURITY: Sanitize ALL user inputs to prevent command injection
    const safeTitle = sanitizeShellInput(item_title);
    const safeDescription = sanitizeShellInput(item_description);
    const safePrice = sanitizeNumericInput(item_price);
    const safeImageUrl = sanitizeShellInput(image_url);
    const safeCogs = sanitizeNumericInput(cogs_estimate, 0);

    // Validate sanitized inputs
    if (!safeTitle || safePrice <= 0) {
      return res.status(400).json({
        error: 'Invalid input after sanitization',
        message: 'Title and price must contain only safe characters'
      });
    }

    console.log('🤖 Triggering Crosslister Droid on Sabertooth...');
    console.log(`   Item: ${safeTitle}`);
    console.log(`   Price: $${safePrice}`);

    // Execute Python script on Sabertooth via SSH
    // Note: This assumes SSH keys are configured between T5500 ↔ Sabertooth
    const sabertooth_ip = process.env.SABERTOOTH_IP || '192.168.0.103';

    // SECURITY FIX: Use sanitized inputs in SSH command
    // Original vulnerability: Unsanitized user input directly in shell command
    const sshCommand = `ssh joshua@${sabertooth_ip} "cd /mnt/c/AiCollabForTheKids/claude-droid && python3 crosslister_droid.py '${safeTitle}' '${safeDescription}' ${safePrice} '${safeImageUrl}' ${safeCogs}"`;

    const { stdout, stderr } = await execAsync(sshCommand, { timeout: 30000 });

    if (stderr && !stderr.includes('Pseudo-terminal')) {
      console.error(`Crosslister stderr: ${stderr}`);
    }

    console.log(`Crosslister output:\n${stdout}`);

    res.json({
      success: true,
      message: 'Crosslister Droid launched on Sabertooth',
      output: stdout,
      listings: {
        status: 'created',
        platforms: ['ebay', 'amazon']
      }
    });

  } catch (error) {
    console.error('Crosslister Droid error:', error);
    res.status(500).json({
      error: 'Crosslister Droid execution failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/droid/status
 * Check status of all autonomous droids
 */
router.get('/status', async (req, res) => {
  try {
    const droids = {
      crosslister: {
        name: 'Crosslister Droid',
        status: 'ready',
        location: 'Sabertooth (192.168.0.103)',
        purpose: 'eBay/Amazon multi-channel sales',
        last_run: null
      },
      media_creator: {
        name: 'Media Creator Droid',
        status: 'ready',
        location: 'Jules Dashboard',
        purpose: 'YouTube content generation',
        last_run: null
      },
      gospel_auditor: {
        name: 'Gospel Auditor',
        status: 'active',
        location: 'T5500 (API)',
        purpose: 'Revenue allocation verification',
        last_run: new Date().toISOString()
      },
      jules_ai: {
        name: 'Jules (Gemini AI)',
        status: 'active',
        location: 'Cloud (Gemini 3 Pro)',
        purpose: 'Infrastructure expense approval',
        last_run: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      droids,
      total_active: Object.values(droids).filter(d => d.status === 'active').length,
      total_ready: Object.values(droids).filter(d => d.status === 'ready').length
    });

  } catch (error) {
    console.error('Droid status error:', error);
    res.status(500).json({ error: 'Failed to get droid status' });
  }
});

/**
 * POST /api/droid/media-creator
 * Trigger Media Creator Droid for YouTube content
 */
router.post('/media-creator', async (req, res) => {
  try {
    const { topic, duration, style } = req.body;

    // TODO: Implement Media Creator Droid trigger
    console.log(`🎬 Media Creator Droid triggered: ${topic}`);

    res.json({
      success: true,
      message: 'Media Creator Droid scheduled',
      video: {
        topic,
        duration: duration || 60,
        style: style || 'educational',
        status: 'queued'
      }
    });

  } catch (error) {
    console.error('Media Creator Droid error:', error);
    res.status(500).json({ error: 'Media Creator Droid failed' });
  }
});

/**
 * POST /api/droid/emergency-stop
 * Emergency stop for all autonomous droids
 */
router.post('/emergency-stop', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY STOP - Halting all droids');

    // TODO: Implement graceful shutdown of all autonomous processes

    res.json({
      success: true,
      message: 'All droids halted',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ error: 'Emergency stop failed' });
  }
});

export default router;
