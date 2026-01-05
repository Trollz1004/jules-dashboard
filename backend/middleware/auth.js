/**
 * 🛡️ PRODUCTION AGE-GATING MIDDLEWARE
 *
 * ZERO-TOLERANCE POLICY:
 * - Default to SAFE mode if any doubt
 * - Block adult content unless explicitly verified 18+
 * - Require parental consent for under-13 users
 * - Auto-route to appropriate AI model
 *
 * FAIL-SAFE: If verification is uncertain → treat as child
 */

const requireAgeGate = (req, res, next) => {
  // FAIL-SAFE #1: Default to child mode if no user context
  const user = req.user || {};

  // FAIL-SAFE #2: If age is unknown/unverified → treat as child
  const isVerifiedAdult = user.age_verified_18 === true && user.age_verification_timestamp;
  const isVerifiedChild = user.is_under_13 === true;
  const hasParentalConsent = user.parental_consent_verified === true;

  // CRITICAL: Log all age-gate attempts for compliance audit
  console.log('[AGE-GATE]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    userId: user.id || 'anonymous',
    isVerifiedAdult,
    isVerifiedChild,
    hasParentalConsent,
    ip: req.ip,
  });

  // RULE #1: Under-13 users MUST have parental consent
  if (isVerifiedChild && !hasParentalConsent) {
    console.warn('[AGE-GATE] BLOCKED: Under-13 without parental consent', { userId: user.id });
    return res.status(403).json({
      blocked: true,
      reason: 'parental_consent_required',
      redirect: '/parental-consent',
      error: 'Parental consent required for Baby Grok access',
      message: 'Please have a parent or guardian verify your account',
    });
  }

  // RULE #2: Adult content routes require explicit 18+ verification
  const isAdultContentRequest =
    req.path.includes('/adult') ||
    req.body?.adult_mode === true ||
    req.query?.adult === 'true' ||
    req.path.includes('/grok-4') ||
    req.body?.uncensored === true;

  if (isAdultContentRequest && !isVerifiedAdult) {
    console.warn('[AGE-GATE] BLOCKED: Adult content request without 18+ verification', {
      userId: user.id,
      path: req.path,
    });
    return res.status(403).json({
      blocked: true,
      reason: 'adult_verification_required',
      redirect: '/age-verification',
      error: '18+ verification required',
      message: 'This content requires age verification',
    });
  }

  // RULE #3: FAIL-SAFE DEFAULT - If no verification, assume child mode
  // This protects against incomplete user records or auth bypass attempts
  const defaultToSafeMode = !isVerifiedAdult && !isVerifiedChild;

  if (defaultToSafeMode) {
    console.warn('[AGE-GATE] FAIL-SAFE: Unverified user defaulted to safe mode', {
      userId: user.id,
    });
  }

  // SET REQUEST FLAGS - Used by downstream routes
  req.babygrok_mode = isVerifiedChild || defaultToSafeMode; // Default to safe
  req.grok_model = req.babygrok_mode ? 'grok-3-kids' : 'grok-4';
  req.age_verified = isVerifiedAdult;
  req.parental_consent = hasParentalConsent;
  req.safe_mode_reason = defaultToSafeMode
    ? 'unverified'
    : isVerifiedChild
      ? 'child'
      : 'verified_adult';

  // AUDIT LOG: Track what model will be used
  console.log('[AGE-GATE] PASSED:', {
    userId: user.id,
    model: req.grok_model,
    safe_mode: req.babygrok_mode,
    reason: req.safe_mode_reason,
  });

  next();
};

/**
 * 🔒 STRICT ADULT-ONLY MIDDLEWARE
 * Use this for routes that should NEVER be accessible to children
 */
const requireAdultVerification = (req, res, next) => {
  const user = req.user || {};

  if (user.age_verified_18 !== true) {
    console.error('[ADULT-ONLY] BLOCKED: Unauthorized access attempt', {
      userId: user.id,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({
      blocked: true,
      reason: 'adults_only',
      redirect: '/age-verification',
      error: 'This content is restricted to verified adults (18+)',
      message: 'Complete age verification to continue',
    });
  }

  next();
};

/**
 * 🧒 PARENTAL CONSENT GATE
 * Ensures COPPA compliance for users under 13
 */
const requireParentalConsent = (req, res, next) => {
  const user = req.user || {};

  if (user.is_under_13 === true && user.parental_consent_verified !== true) {
    console.warn('[COPPA] BLOCKED: Under-13 without parental consent', {
      userId: user.id,
      path: req.path,
    });
    return res.status(403).json({
      blocked: true,
      reason: 'coppa_compliance',
      redirect: '/parental-consent',
      error: 'Parental consent required',
      message: 'Please have your parent or guardian approve your account',
    });
  }

  next();
};

export { requireAgeGate, requireAdultVerification, requireParentalConsent };
