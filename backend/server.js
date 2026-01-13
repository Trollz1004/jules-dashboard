// CRITICAL: Load environment variables FIRST, before any other imports
// This ensures process.env is populated when ES modules run their top-level code
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Routes
import julesRoutes from './routes/jules.js';
import campaignRoutes from './routes/campaign.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhooks.js';
import paymentsRoutes from './routes/payments.js';
import ageVerificationRoutes from './routes/age-verification.js';
import consentRoutes from './routes/consent.js';
import transparencyRoutes from './routes/transparency.js';
import squareSubscriptionRoutes from './routes/square-subscriptions.js';
import communityRoutes from './routes/community.js';
import freeDaoRoutes from './routes/free-dao.js';
import datingRoutes from './routes/dating.js';
import kickstarterRoutes from './routes/kickstarter.js';
import humanVerificationRoutes from './routes/human-verification.js';
import droidRoutes from './routes/droid.js';
import merchRoutes from './routes/merch.js';
import affiliateRoutes from './routes/affiliates.js';
import infrastructureRoutes from './routes/infrastructure.js';
import aiStoreWebhookRoutes from './routes/ai-store-webhook.js';
import plaidIdentityRoutes from './routes/plaid-identity.js';
import treasuryRoutes from './routes/treasury.js';

// Services
import { DAO_REVENUE_CONFIG } from './services/dao-revenue.js';

dotenv.config();

// DAO Revenue Configuration
console.log('✅ DAO Platform Initialized:', DAO_REVENUE_CONFIG.PLATFORM_NAME);

const app = express();
app.set('trust proxy', 1); // Trust Cloudflare tunnel proxy
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: API KEY AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════
// Added: 2025-12-17 - Critical Security Hardening
// Protects sensitive routes from unauthorized access
// ═══════════════════════════════════════════════════════════════════════════════

const requireAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn('Unauthorized API access attempt', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required. Provide via X-API-Key header or apiKey query parameter.',
      service: 'YouAndINotAI Platform'
    });
  }

  next();
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://192.168.0.101:8080',
    'http://192.168.0.103:8080',
    'http://192.168.0.103:5173',
    'https://jules-dashboard.pages.dev',
    'https://theoretical-bras-difference-kirk.trycloudflare.com',
    'https://api.aidoesitall.website',
    'https://aidoesitall.website',
    'https://www.aidoesitall.website',
    'https://dashboard.aidoesitall.website',
    'https://youandinotai.com',
    'https://www.youandinotai.com',
    'https://youandinotai.online',
    'https://youandinotai.pages.dev',
    'https://ai-solutions.store',
    'https://www.ai-solutions.store',
    'https://ai-solutions-store.pages.dev'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
app.use(express.json());
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Root endpoint - API welcome page
app.get('/', (req, res) => {
  res.json({
    message: 'YouAndINotAI Dating Platform API',
    status: 'LIVE IN PRODUCTION',
    service: 'Royalty Deck of Hearts Backend',
    endpoints: {
      health: '/health',
      campaign: '/api/campaign/metrics',
      admin: '/api/admin/status',
      jules: '/api/jules/*',
      ageVerification: '/api/age-verification/*',
      consent: '/api/consent/*'
    },
    compliance: {
      ageVerification: 'Multi-layer (Self-attestation + Third-party)',
      cookieConsent: '3-Box System (Essential/Analytics/Marketing)',
      coppa: 'Safeguards active',
      reviewedBy: 'Jules (Gemini 3 Pro)'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'YouAndINotAI Platform API',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES WITH AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (No authentication required):
// - /api/age-verification/* - User-facing age verification
// - /api/consent/* - Cookie consent (GDPR compliance)
// - /api/transparency/* - Public transparency data
// - /api/kickstarter/* - Public campaign info
// - /api/verify-human/* - Human verification for public access
// - /api/webhooks/* - External webhooks (have their own signature validation)
//
// PROTECTED ROUTES (API key required):
// - /api/jules/* - AI command execution
// - /api/campaign/* - Campaign management
// - /api/admin/* - Administrative functions
// - /api/payments/* - Payment processing
// - /api/subscriptions/* - Subscription management
// - /api/community/* - Community management
// - /api/free-dao/* - DAO operations
// - /api/dating/* - Dating app backend
// - /api/droid/* - Droid orchestration
// - /api/merch/* - Merch store operations
// - /api/affiliates/* - Affiliate program management
// - /api/infra/* - Infrastructure expense management (Jules AI approval)
// ═══════════════════════════════════════════════════════════════════════════════

// PUBLIC ROUTES - No authentication required
app.use('/api/age-verification', ageVerificationRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/transparency', transparencyRoutes);
app.use('/api/kickstarter', kickstarterRoutes);
app.use('/api/verify-human', humanVerificationRoutes);
app.use('/api/webhooks', webhookRoutes); // Has own signature validation
app.use('/api/ai-store-webhook', aiStoreWebhookRoutes); // AI Solutions Store webhook handler
app.use('/api/plaid-identity', plaidIdentityRoutes); // Plaid identity verification
treasuryRoutes(app);

// PROTECTED ROUTES - Require API key authentication
app.use('/api/jules', requireAuth, julesRoutes);
app.use('/api/campaign', requireAuth, campaignRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/payments', requireAuth, paymentsRoutes);
app.use('/api/subscriptions', requireAuth, squareSubscriptionRoutes);
app.use('/api/community', requireAuth, communityRoutes);
app.use('/api/free-dao', requireAuth, freeDaoRoutes);
app.use('/api/dating', requireAuth, datingRoutes);
app.use('/api/droid', requireAuth, droidRoutes);
app.use('/api/merch', requireAuth, merchRoutes);
app.use('/api/affiliates', requireAuth, affiliateRoutes);
app.use('/api/infra', requireAuth, infrastructureRoutes);

// DAO Revenue endpoint (Public - read-only transparency)
app.get('/api/revenue', (req, res) => {
  res.json({
    success: true,
    config: DAO_REVENUE_CONFIG,
    message: 'DAO Revenue Configuration',
    verified: true,
    note: '100% to DAO Treasury'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RELAY PROXY - Mobile Claude → API → Sabertooth Relay
// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED: Requires API key authentication (internal infrastructure communication)
const RELAY_URL = 'http://192.168.0.103:3002';

app.all('/api/relay/*', requireAuth, async (req, res) => {
  try {
    const path = req.path.replace('/api/relay', '');
    const url = `${RELAY_URL}${path}`;

    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    };

    if (req.method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: 'Relay proxy error', message: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    service: 'YouAndINotAI Platform'
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 YouAndINotAI API Server running on port ${PORT}`);
  logger.info(`Service: Royalty Deck of Hearts Backend`);
});

export default app;
