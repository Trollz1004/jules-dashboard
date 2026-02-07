/**
 * Age Verification API Integration Tests
 * FOR THE KIDS - Tier 1 Compliance Testing
 * 
 * Tests multi-layer age verification system:
 * - Self-attestation (BASIC)
 * - Enhanced verification (Yoti/AWS)
 * - COPPA minor reporting
 * - Health checks
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000/api/age-verification';

describe('Age Verification API - FOR THE KIDS', () => {
  
  describe('POST /api/age-verification/attest - Self Attestation', () => {
    test('should accept valid self-attestation', async () => {
      const response = await fetch(`${API_BASE}/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-001',
          dateOfBirth: '1990-01-01',
          agreedToTerms: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.verificationToken).toBeDefined();
      expect(data.verificationLevel).toBe('BASIC');
      expect(data.message).toContain('attestation recorded');
    });

    test('should reject attestation without ToS agreement', async () => {
      const response = await fetch(`${API_BASE}/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-002',
          dateOfBirth: '1990-01-01',
          agreedToTerms: false,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('must agree to Terms');
    });

    test('should reject underage attestation (under 18)', async () => {
      const today = new Date();
      const recentDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      
      const response = await fetch(`${API_BASE}/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-003',
          dateOfBirth: recentDate.toISOString().split('T')[0],
          agreedToTerms: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Suite)'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('18 years old');
    });

    test('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE}/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-004'
          // Missing dateOfBirth and agreedToTerms
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  describe('POST /api/age-verification/enhanced - Third-Party Verification', () => {
    test('should accept valid enhanced verification request', async () => {
      const response = await fetch(`${API_BASE}/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken: 'test-token-001',
          provider: 'yoti',
          sessionId: 'test-session-005'
        })
      });

      const data = await response.json();

      // Enhanced verification returns redirect URL for Yoti
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.provider).toBe('yoti');
      expect(data.redirectUrl || data.message).toBeDefined();
    });

    test('should reject invalid provider', async () => {
      const response = await fetch(`${API_BASE}/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken: 'test-token-002',
          provider: 'invalid-provider',
          sessionId: 'test-session-006'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('provider');
    });
  });

  describe('GET /api/age-verification/status/:token - Verification Status', () => {
    test('should return 404 for non-existent token', async () => {
      const response = await fetch(`${API_BASE}/status/invalid-token-999`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/age-verification/report-minor - COPPA Compliance', () => {
    test('should accept valid minor report', async () => {
      const response = await fetch(`${API_BASE}/report-minor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-minor-001',
          reportedBy: 'system',
          evidenceDescription: 'User profile indicates age under 13',
          reporterContact: 'compliance@aidoesitall.website'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.reportId).toBeDefined();
      expect(data.message).toContain('COPPA report filed');
      expect(data.sla).toContain('24 hours');
    });

    test('should reject report without required fields', async () => {
      const response = await fetch(`${API_BASE}/report-minor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-minor-002'
          // Missing reportedBy and evidenceDescription
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  describe('GET /api/age-verification/health - Health Check', () => {
    test('should return operational status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('operational');
      expect(data.service).toBe('age-verification');
      expect(data.providers).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('should include provider status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(data.providers).toHaveProperty('yoti');
      expect(data.providers).toHaveProperty('aws_rekognition');
      expect(['ready', 'pending_config']).toContain(data.providers.yoti);
    });
  });
});
