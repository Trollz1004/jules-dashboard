/**
 * Email Service for Dating Platform
 *
 * Provides comprehensive email functionality including:
 * - Template rendering with Handlebars
 * - SendGrid and Mailgun integration
 * - Email queue support for bulk sending
 * - Unsubscribe token handling
 * - Rate limiting and retry logic
 */

const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Email provider clients (conditionally loaded)
let sgMail, mailgun;

/**
 * Email Service Configuration
 */
const config = {
  provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid' | 'mailgun'
  from: {
    email: process.env.EMAIL_FROM || 'noreply@yourdatingapp.com',
    name: process.env.EMAIL_FROM_NAME || 'Your Dating App',
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@yourdatingapp.com',
  templateDir: path.join(__dirname, '../templates/emails'),

  // Site configuration for templates
  site: {
    name: process.env.SITE_NAME || 'LoveConnect',
    url: process.env.SITE_URL || 'https://yourdatingapp.com',
    assetsUrl: process.env.ASSETS_URL || 'https://cdn.yourdatingapp.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdatingapp.com',
  },

  // Company info for footer
  company: {
    name: process.env.COMPANY_NAME || 'LoveConnect Inc.',
    address: process.env.COMPANY_ADDRESS || '123 Dating Street, San Francisco, CA 94102',
  },

  // Social links
  social: {
    facebook: process.env.SOCIAL_FACEBOOK || 'https://facebook.com/yourdatingapp',
    twitter: process.env.SOCIAL_TWITTER || 'https://twitter.com/yourdatingapp',
    instagram: process.env.SOCIAL_INSTAGRAM || 'https://instagram.com/yourdatingapp',
  },

  // Queue configuration
  queue: {
    enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY, 10) || 5000, // ms
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.EMAIL_RATE_LIMIT_ENABLED !== 'false',
    maxPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE, 10) || 100,
    maxPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR, 10) || 1000,
  },
};

/**
 * Template cache for performance
 */
const templateCache = new Map();
let baseTemplate = null;

/**
 * Queue instance (Bull or similar)
 */
let emailQueue = null;

/**
 * Rate limiter state
 */
const rateLimiter = {
  minuteCount: 0,
  hourCount: 0,
  minuteReset: Date.now() + 60000,
  hourReset: Date.now() + 3600000,
};

/**
 * Initialize the email service
 * Must be called before sending emails
 */
async function initialize() {
  // Initialize email provider
  if (config.provider === 'sendgrid') {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('[EmailService] SendGrid initialized');
  } else if (config.provider === 'mailgun') {
    const Mailgun = require('mailgun.js');
    const formData = require('form-data');
    const mg = new Mailgun(formData);
    mailgun = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });
    console.log('[EmailService] Mailgun initialized');
  }

  // Initialize queue if enabled
  if (config.queue.enabled) {
    const Bull = require('bull');
    emailQueue = new Bull('email-queue', config.queue.redisUrl, {
      defaultJobOptions: {
        attempts: config.queue.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.queue.retryDelay,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      },
    });

    // Process queue jobs
    emailQueue.process(async (job) => {
      const { to, subject, html, text, templateName, data } = job.data;
      await sendEmailDirect({ to, subject, html, text });
      console.log(`[EmailService] Queue job ${job.id} completed: ${templateName} to ${to}`);
    });

    // Queue event handlers
    emailQueue.on('failed', (job, err) => {
      console.error(`[EmailService] Queue job ${job.id} failed:`, err.message);
    });

    emailQueue.on('stalled', (job) => {
      console.warn(`[EmailService] Queue job ${job.id} stalled`);
    });

    console.log('[EmailService] Email queue initialized');
  }

  // Pre-load and compile base template
  await loadBaseTemplate();

  // Register Handlebars helpers
  registerHandlebarsHelpers();

  console.log('[EmailService] Initialization complete');
}

/**
 * Load and compile the base template
 */
async function loadBaseTemplate() {
  const basePath = path.join(config.templateDir, 'base.html');
  const baseContent = await fs.readFile(basePath, 'utf-8');
  baseTemplate = Handlebars.compile(baseContent);

  // Register base as a partial for extension
  Handlebars.registerPartial('base', baseContent);
}

/**
 * Register custom Handlebars helpers
 */
function registerHandlebarsHelpers() {
  // Encode URI component helper
  Handlebars.registerHelper('encodeURIComponent', function (str) {
    return encodeURIComponent(str);
  });

  // Date formatting helper
  Handlebars.registerHelper('formatDate', function (date, format) {
    const d = new Date(date);
    const options = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: 'numeric', minute: '2-digit', hour12: true },
      datetime: {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      },
    };
    return d.toLocaleDateString('en-US', options[format] || options.short);
  });

  // Pluralize helper
  Handlebars.registerHelper('pluralize', function (count, singular, plural) {
    return count === 1 ? singular : plural;
  });

  // Truncate text helper
  Handlebars.registerHelper('truncate', function (str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + '...';
  });

  // Conditional equality helper
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  // Greater than helper
  Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
  });

  // First initial helper
  Handlebars.registerHelper('firstInitial', function (name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  });
}

/**
 * Load and compile a template
 * @param {string} templateName - Name of the template file (without .html)
 * @returns {Function} Compiled Handlebars template
 */
async function loadTemplate(templateName) {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(config.templateDir, `${templateName}.html`);

  try {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(templateContent);
    templateCache.set(templateName, compiled);
    return compiled;
  } catch (error) {
    console.error(`[EmailService] Failed to load template ${templateName}:`, error.message);
    throw new Error(`Template not found: ${templateName}`);
  }
}

/**
 * Render an email template with data
 * @param {string} templateName - Name of the template
 * @param {Object} data - Template data
 * @returns {Object} { html, subject }
 */
async function renderTemplate(templateName, data) {
  const template = await loadTemplate(templateName);

  // Merge global data with provided data
  const templateData = {
    // Site configuration
    siteName: config.site.name,
    siteUrl: config.site.url,
    assetsUrl: config.site.assetsUrl,
    supportEmail: config.site.supportEmail,
    companyName: config.company.name,
    companyAddress: config.company.address,
    socialLinks: config.social,

    // Unsubscribe handling
    unsubscribeUrl: `${config.site.url}/unsubscribe`,
    emailType: templateName,

    // Current year for copyright
    currentYear: new Date().getFullYear(),

    // Provided data
    ...data,
  };

  const html = template(templateData);

  return { html, subject: data.subject || '' };
}

/**
 * Generate an unsubscribe token for a user
 * @param {string} userId - User ID
 * @param {string} emailType - Type of email for selective unsubscribe
 * @returns {string} Encrypted unsubscribe token
 */
function generateUnsubscribeToken(userId, emailType = 'all') {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'your-secret-key';
  const data = JSON.stringify({
    userId,
    emailType,
    timestamp: Date.now(),
  });

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.scryptSync(secret, 'salt', 32),
    crypto.randomBytes(16)
  );

  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');
  const iv = cipher.getIV ? cipher.getIV().toString('base64') : '';

  return Buffer.from(JSON.stringify({ encrypted, authTag, iv })).toString('base64url');
}

/**
 * Verify and decode an unsubscribe token
 * @param {string} token - Unsubscribe token
 * @returns {Object|null} Decoded data or null if invalid
 */
function verifyUnsubscribeToken(token) {
  try {
    const secret = process.env.UNSUBSCRIBE_SECRET || 'your-secret-key';
    const { encrypted, authTag, iv } = JSON.parse(Buffer.from(token, 'base64url').toString());

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      crypto.scryptSync(secret, 'salt', 32),
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // Token expires after 30 days
    const tokenAge = Date.now() - data.timestamp;
    if (tokenAge > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[EmailService] Invalid unsubscribe token:', error.message);
    return null;
  }
}

/**
 * Check rate limiting
 * @returns {boolean} True if within limits
 */
function checkRateLimit() {
  if (!config.rateLimit.enabled) return true;

  const now = Date.now();

  // Reset counters if needed
  if (now >= rateLimiter.minuteReset) {
    rateLimiter.minuteCount = 0;
    rateLimiter.minuteReset = now + 60000;
  }
  if (now >= rateLimiter.hourReset) {
    rateLimiter.hourCount = 0;
    rateLimiter.hourReset = now + 3600000;
  }

  // Check limits
  if (rateLimiter.minuteCount >= config.rateLimit.maxPerMinute) {
    console.warn('[EmailService] Rate limit exceeded (per minute)');
    return false;
  }
  if (rateLimiter.hourCount >= config.rateLimit.maxPerHour) {
    console.warn('[EmailService] Rate limit exceeded (per hour)');
    return false;
  }

  // Increment counters
  rateLimiter.minuteCount++;
  rateLimiter.hourCount++;

  return true;
}

/**
 * Send email directly via provider
 * @param {Object} options - Email options
 */
async function sendEmailDirect({ to, subject, html, text }) {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded');
  }

  const msg = {
    to,
    from: config.from,
    replyTo: config.replyTo,
    subject,
    html,
    text: text || stripHtml(html),
  };

  try {
    if (config.provider === 'sendgrid') {
      await sgMail.send(msg);
    } else if (config.provider === 'mailgun') {
      await mailgun.messages.create(process.env.MAILGUN_DOMAIN, {
        from: `${config.from.name} <${config.from.email}>`,
        to: [to],
        subject,
        html,
        text: text || stripHtml(html),
      });
    }

    console.log(`[EmailService] Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Strip HTML tags for plain text version
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send a templated email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.templateName - Template name
 * @param {Object} options.data - Template data
 * @param {boolean} options.queue - Use queue (default: use config)
 */
async function sendEmail({ to, templateName, data, queue = config.queue.enabled }) {
  // Generate unsubscribe token
  const unsubscribeToken = data.userId
    ? generateUnsubscribeToken(data.userId, templateName)
    : '';

  // Render template
  const { html, subject } = await renderTemplate(templateName, {
    ...data,
    unsubscribeToken,
  });

  const emailSubject = data.subject || subject || `${config.site.name} Notification`;

  if (queue && emailQueue) {
    // Add to queue
    await emailQueue.add(
      {
        to,
        subject: emailSubject,
        html,
        templateName,
        data,
      },
      {
        priority: data.priority || 0, // Lower = higher priority
      }
    );
    console.log(`[EmailService] Email queued: ${templateName} to ${to}`);
  } else {
    // Send directly
    await sendEmailDirect({
      to,
      subject: emailSubject,
      html,
    });
  }
}

/**
 * Send bulk emails (always queued)
 * @param {Array} emails - Array of { to, templateName, data }
 * @param {Object} options - Bulk options
 */
async function sendBulkEmails(emails, options = {}) {
  if (!config.queue.enabled || !emailQueue) {
    throw new Error('Queue must be enabled for bulk emails');
  }

  const jobs = [];
  const batchSize = options.batchSize || 100;
  const delayBetweenBatches = options.delayBetweenBatches || 1000; // ms

  console.log(`[EmailService] Starting bulk send: ${emails.length} emails`);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const batchJobs = await Promise.all(
      batch.map(async ({ to, templateName, data }) => {
        const unsubscribeToken = data.userId
          ? generateUnsubscribeToken(data.userId, templateName)
          : '';

        const { html, subject } = await renderTemplate(templateName, {
          ...data,
          unsubscribeToken,
        });

        return emailQueue.add(
          {
            to,
            subject: data.subject || subject || `${config.site.name} Notification`,
            html,
            templateName,
            data,
          },
          {
            priority: options.priority || 10, // Lower priority for bulk
            delay: options.scheduleFor ? new Date(options.scheduleFor) - Date.now() : 0,
          }
        );
      })
    );

    jobs.push(...batchJobs);

    // Delay between batches to prevent overwhelming the queue
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`[EmailService] Bulk send complete: ${jobs.length} jobs queued`);

  return {
    totalQueued: jobs.length,
    jobIds: jobs.map((j) => j.id),
  };
}

/**
 * Get queue statistics
 * @returns {Object} Queue stats
 */
async function getQueueStats() {
  if (!emailQueue) {
    return { enabled: false };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    enabled: true,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

/**
 * Clear template cache (useful for development)
 */
function clearTemplateCache() {
  templateCache.clear();
  baseTemplate = null;
  console.log('[EmailService] Template cache cleared');
}

/**
 * Close the email service (cleanup)
 */
async function close() {
  if (emailQueue) {
    await emailQueue.close();
  }
  console.log('[EmailService] Service closed');
}

// ============================================================================
// Pre-built Email Sending Functions
// ============================================================================

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user) {
  await sendEmail({
    to: user.email,
    templateName: 'welcome',
    data: {
      subject: `Welcome to ${config.site.name}! Let's Find Your Perfect Match`,
      user: {
        firstName: user.firstName,
        email: user.email,
      },
      userId: user.id,
    },
  });
}

/**
 * Send new match notification
 */
async function sendMatchNotification(user, match) {
  await sendEmail({
    to: user.email,
    templateName: 'new-match',
    data: {
      subject: `You Have a New Match! ${match.firstName} Likes You Too`,
      user: {
        firstName: user.firstName,
        isPremium: user.isPremium,
      },
      match: {
        id: match.id,
        firstName: match.firstName,
        firstInitial: match.firstName.charAt(0).toUpperCase(),
        age: match.age,
        location: match.location,
        photoUrl: match.photoUrl,
        compatibilityScore: match.compatibilityScore,
        sharedInterests: match.sharedInterests?.length || 0,
        distance: match.distance,
        interests: match.interests?.slice(0, 5),
      },
      userId: user.id,
    },
  });
}

/**
 * Send new message notification
 */
async function sendMessageNotification(user, sender, message, conversationId) {
  const maxPreviewLength = 150;
  const messagePreview = message.content.substring(0, maxPreviewLength);

  await sendEmail({
    to: user.email,
    templateName: 'new-message',
    data: {
      subject: `${sender.firstName} sent you a message`,
      user: {
        firstName: user.firstName,
      },
      sender: {
        firstName: sender.firstName,
        firstInitial: sender.firstName.charAt(0).toUpperCase(),
        age: sender.age,
        location: sender.location,
        photoUrl: sender.photoUrl,
      },
      messagePreview,
      isMessageTruncated: message.content.length > maxPreviewLength,
      messageTime: formatRelativeTime(message.createdAt),
      conversationId,
      conversationStats: message.conversationStats,
      quickReplies: ['Hey! How are you?', 'Thanks for your message!', "I'd love to chat more"],
      userId: user.id,
    },
  });
}

/**
 * Send weekly digest email
 */
async function sendWeeklyDigest(user, stats) {
  await sendEmail({
    to: user.email,
    templateName: 'weekly-digest',
    data: {
      subject: `Your Weekly Dating Update - ${stats.profileViews} People Checked You Out!`,
      user: {
        firstName: user.firstName,
        isPremium: user.isPremium,
      },
      stats,
      pendingLikes: stats.pendingLikes,
      suggestedMatches: stats.suggestedMatches,
      weeklyTip: stats.weeklyTip || {
        title: 'Update Your Photos',
        content:
          'Profiles with at least 4 photos get 2x more matches. Consider adding some recent photos showing your hobbies!',
        linkUrl: `${config.site.url}/profile/photos`,
        linkText: 'Update photos now',
      },
      profileStrength: stats.profileStrength,
      userId: user.id,
    },
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, resetToken, requestInfo = {}) {
  const resetUrl = `${config.site.url}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    templateName: 'password-reset',
    data: {
      subject: `Reset Your ${config.site.name} Password`,
      user: {
        firstName: user.firstName,
        email: user.email,
      },
      resetUrl,
      expirationTime: '1 hour',
      requestDate: new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      requestIP: requestInfo.ip || 'Unknown',
      requestDevice: requestInfo.device || 'Unknown device',
      requestLocation: requestInfo.location || 'Unknown location',
      userId: user.id,
    },
    queue: false, // Send immediately, don't queue
  });
}

/**
 * Send email verification
 */
async function sendVerificationEmail(user, verificationCode, verificationUrl) {
  await sendEmail({
    to: user.email,
    templateName: 'verification',
    data: {
      subject: `Verify Your Email Address - ${config.site.name}`,
      user: {
        firstName: user.firstName,
      },
      verificationCode,
      verificationUrl,
      codeExpiration: '15 minutes',
      linkExpiration: '24 hours',
      userId: user.id,
    },
    queue: false, // Send immediately
  });
}

/**
 * Send subscription confirmation
 */
async function sendSubscriptionConfirmation(user, subscription, billing) {
  await sendEmail({
    to: user.email,
    templateName: 'subscription',
    data: {
      subject: `Welcome to ${config.site.name} ${subscription.planName}!`,
      user: {
        firstName: user.firstName,
      },
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        currency: subscription.currency || '$',
        amount: subscription.amount.toFixed(2),
        startDate: formatDate(subscription.startDate),
        nextBillingDate: formatDate(subscription.nextBillingDate),
        orderId: subscription.orderId,
        features: subscription.features || [
          {
            title: 'Unlimited Likes',
            description: 'Like as many profiles as you want without daily limits',
          },
          {
            title: 'See Who Likes You',
            description: 'View everyone who has liked your profile',
          },
          {
            title: 'Advanced Filters',
            description: 'Filter matches by more criteria including education, height, and more',
          },
          { title: 'Read Receipts', description: 'Know when your messages have been read' },
          { title: 'Priority Support', description: 'Get faster responses from our support team' },
        ],
      },
      billing: {
        name: billing.name,
        email: billing.email,
        address: billing.address,
        cardBrand: billing.cardBrand || 'VISA',
        cardLast4: billing.cardLast4,
      },
      receiptUrl: `${config.site.url}/billing/receipts/${subscription.orderId}`,
      userId: user.id,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for display
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Core functions
  initialize,
  close,
  sendEmail,
  sendBulkEmails,
  renderTemplate,
  clearTemplateCache,

  // Queue management
  getQueueStats,

  // Unsubscribe handling
  generateUnsubscribeToken,
  verifyUnsubscribeToken,

  // Pre-built email functions
  sendWelcomeEmail,
  sendMatchNotification,
  sendMessageNotification,
  sendWeeklyDigest,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSubscriptionConfirmation,

  // Configuration access
  config,
};
