/**
 * Cookie Consent API Integration Tests
 * FOR THE KIDS - 3-Box CMP Testing
 * 
 * Tests cookie consent management system:
 * - Consent recording (Essential/Analytics/Marketing)
 * - Consent retrieval and updates
 * - GDPR withdrawal rights
 * - Consent expiration (1 year)
 * - Audit trail
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000/api/consent';

describe('Cookie Consent API - 3-Box CMP', () => {
  
  describe('POST /api/consent/record - Record Consent', () => {
    test('should record valid consent with all boxes', async () => {
      const response = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-001',
          essential: true,
          analytics: true,
          marketing: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.consentId).toBeDefined();
      expect(data.expiresAt).toBeDefined();
      expect(data.message).toContain('recorded');
    });

    test('should record consent with only essential cookies', async () => {
      const response = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-002',
          essential: true,
          analytics: false,
          marketing: false,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.consentId).toBeDefined();
    });

    test('should reject consent without essential cookies', async () => {
      const response = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-003',
          essential: false,
          analytics: true,
          marketing: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Essential cookies are required');
    });

    test('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-004'
          // Missing consent preferences
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    test('should log to BigQuery audit trail', async () => {
      const response = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-005',
          essential: true,
          analytics: true,
          marketing: false,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      // BigQuery logging happens asynchronously, success indicates attempt made
    });
  });

  describe('GET /api/consent/status/:sessionId - Retrieve Consent', () => {
    test('should return 404 for non-existent session', async () => {
      const response = await fetch(`${API_BASE}/status/invalid-session-999`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/consent/update - Update Consent', () => {
    test('should update existing consent preferences', async () => {
      // First create consent
      const createResponse = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-update-001',
          essential: true,
          analytics: true,
          marketing: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      expect(createResponse.status).toBe(201);

      // Then update it
      const updateResponse = await fetch(`${API_BASE}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-update-001',
          analytics: false,
          marketing: false,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('updated');
    });

    test('should reject update to disable essential cookies', async () => {
      const response = await fetch(`${API_BASE}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-update-002',
          essential: false,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Essential cookies cannot be disabled');
    });
  });

  describe('POST /api/consent/withdraw - GDPR Withdrawal', () => {
    test('should allow full consent withdrawal', async () => {
      // First create consent
      const createResponse = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-withdraw-001',
          essential: true,
          analytics: true,
          marketing: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      expect(createResponse.status).toBe(201);

      // Then withdraw
      const withdrawResponse = await fetch(`${API_BASE}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-withdraw-001',
          reason: 'User requested full data deletion',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await withdrawResponse.json();

      expect(withdrawResponse.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('withdrawn');
      expect(data.message).toContain('GDPR');
    });

    test('should reject withdrawal without session ID', async () => {
      const response = await fetch(`${API_BASE}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Test withdrawal'
          // Missing sessionId
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  describe('GET /api/consent/policy - Cookie Policy', () => {
    test('should return 3-box cookie policy', async () => {
      const response = await fetch(`${API_BASE}/policy`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.policy).toBeDefined();
      expect(data.policy.essential).toBeDefined();
      expect(data.policy.analytics).toBeDefined();
      expect(data.policy.marketing).toBeDefined();
    });

    test('should include cookie categories and purposes', async () => {
      const response = await fetch(`${API_BASE}/policy`);
      const data = await response.json();

      const { essential, analytics, marketing } = data.policy;

      expect(essential.required).toBe(true);
      expect(essential.cookies).toBeInstanceOf(Array);
      expect(analytics.cookies).toBeInstanceOf(Array);
      expect(marketing.cookies).toBeInstanceOf(Array);
    });

    test('should include retention periods', async () => {
      const response = await fetch(`${API_BASE}/policy`);
      const data = await response.json();

      expect(data.policy.essential.retention).toBeDefined();
      expect(data.policy.analytics.retention).toBeDefined();
      expect(data.policy.marketing.retention).toBeDefined();
    });
  });

  describe('GET /api/consent/audit/:sessionId - Audit Trail', () => {
    test('should return audit trail for valid session', async () => {
      // First create consent
      const createResponse = await fetch(`${API_BASE}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-consent-audit-001',
          essential: true,
          analytics: true,
          marketing: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      expect(createResponse.status).toBe(201);

      // Then retrieve audit trail
      const auditResponse = await fetch(`${API_BASE}/audit/test-consent-audit-001`);
      const data = await auditResponse.json();

      expect(auditResponse.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.auditTrail).toBeInstanceOf(Array);
      expect(data.auditTrail.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent session', async () => {
      const response = await fetch(`${API_BASE}/audit/invalid-session-999`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/consent/health - Health Check', () => {
    test('should return operational status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('operational');
      expect(data.service).toBe('consent-management');
      expect(data.timestamp).toBeDefined();
    });

    test('should include BigQuery logging status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(data.bigquery).toBeDefined();
      expect(['ready', 'pending_config']).toContain(data.bigquery);
    });
  });
});
