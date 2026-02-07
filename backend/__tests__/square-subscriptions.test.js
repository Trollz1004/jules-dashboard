/**
 * Square Subscriptions API Unit Tests
 * FOR THE KIDS - Tier 1 Compliance Testing
 *
 * Mocks the Square SDK and Prisma Client to test business logic
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Client } from 'square';
import { PrismaClient } from '@prisma/client';
import router from '../routes/square-subscriptions';

// Mock dependencies
jest.mock('square');
jest.mock('@prisma/client');

// Mock Express req/res
const mockRequest = (body, headers = {}) => ({
  body,
  headers,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Square Subscriptions API - FOR THE KIDS', () => {
  let checkoutApi;
  let subscriptionsApi;
  let ordersApi;
  let customersApi;
  let prisma;

  beforeEach(() => {
    // Reset mocks before each test
    checkoutApi = {
      createPaymentLink: jest.fn(),
    };
    subscriptionsApi = {
      cancelSubscription: jest.fn(),
    };
    ordersApi = {
      retrieveOrder: jest.fn(),
    };
    customersApi = {
      retrieveCustomer: jest.fn(),
    };
    prisma = {
      subscription: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
    };

    // Set up the mocked Square Client to return our mocked APIs
    Client.mockImplementation(() => ({
      checkoutApi,
      subscriptionsApi,
      ordersApi,
      customersApi,
    }));
    
    // Set up the mocked Prisma Client to return our mocked DB client
    PrismaClient.mockImplementation(() => prisma);
  });

  describe('POST /api/subscriptions/create-checkout', () => {
    // We need a way to get the handler function for the route
    // This is a bit tricky since the router is already initialized
    // A better approach would be to export the handlers from the route file
    // For now, let's try to find the handler in the router stack
    const createCheckoutHandler = router.stack.find(layer => layer.route.path === '/create-checkout' && layer.route.methods.post).route.stack[0].handle;

    test('should create a checkout link for a valid premium tier', async () => {
      const req = mockRequest({ tier: 'premium', userId: 'user-123', email: 'test@test.com' });
      const res = mockResponse();

      const mockApiResponse = {
        paymentLink: {
          url: 'https://sandbox.square.link/test',
          orderId: 'order-123',
        },
      };
      checkoutApi.createPaymentLink.mockResolvedValue({ result: mockApiResponse });

      await createCheckoutHandler(req, res);

      expect(checkoutApi.createPaymentLink).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        checkoutUrl: 'https://sandbox.square.link/test',
        orderId: 'order-123',
      });
    });
    
    test('should return 400 for an invalid tier', async () => {
        const req = mockRequest({ tier: 'invalid', userId: 'user-123', email: 'test@test.com' });
        const res = mockResponse();

        await createCheckoutHandler(req, res);

        expect(checkoutApi.createPaymentLink).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid subscription tier' });
    });

    test('should handle free tier without creating checkout link', async () => {
        const req = mockRequest({ tier: 'free', userId: 'user-123', email: 'test@test.com' });
        const res = mockResponse();

        await createCheckoutHandler(req, res);

        expect(checkoutApi.createPaymentLink).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            tier: 'free',
            message: 'Free tier activated'
        });
    });

  });

  describe('GET /api/subscriptions/status/:userId', () => {
    const getStatusHandler = router.stack.find(layer => layer.route.path === '/status/:userId' && layer.route.methods.get).route.stack[0].handle;

    test('should return active subscription status for a user', async () => {
        const req = { params: { userId: 'user-with-sub' } };
        const res = mockResponse();
        const mockSubscription = {
            tier: 'PREMIUM',
            status: 'ACTIVE',
            nextBillingDate: new Date(),
            cancelledAt: null,
        };
        prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

        await getStatusHandler(req, res);

        expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
            where: { userId: 'user-with-sub', status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            tier: 'PREMIUM',
            active: true,
        }));
    });

    test('should return free tier for user with no active subscription', async () => {
        const req = { params: { userId: 'user-without-sub' } };
        const res = mockResponse();
        prisma.subscription.findFirst.mockResolvedValue(null);

        await getStatusHandler(req, res);

        expect(res.json).toHaveBeenCalledWith({
            tier: 'FREE',
            active: true,
            features: expect.any(Array),
        });
    });
  });

    describe('POST /api/subscriptions/cancel/:userId', () => {
        const cancelHandler = router.stack.find(layer => layer.route.path === '/cancel/:userId' && layer.route.methods.post).route.stack[0].handle;

        test('should cancel an active subscription', async () => {
            const req = { params: { userId: 'user-to-cancel' } };
            const res = mockResponse();
            const mockSubscription = {
                id: 'sub-id-123',
                squareSubscriptionId: 'sq-sub-id-123',
            };
            prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
            subscriptionsApi.cancelSubscription.mockResolvedValue({ result: { subscription: { id: 'sq-sub-id-123' } } });

            await cancelHandler(req, res);

            expect(subscriptionsApi.cancelSubscription).toHaveBeenCalledWith('sq-sub-id-123');
            expect(prisma.subscription.update).toHaveBeenCalledWith({
                where: { id: 'sub-id-123' },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: expect.any(Date),
                },
            });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Subscription cancelled successfully',
            }));
        });

        test('should return 404 for a user with no active subscription to cancel', async () => {
            const req = { params: { userId: 'user-with-no-sub' } };
            const res = mockResponse();
            prisma.subscription.findFirst.mockResolvedValue(null);

            await cancelHandler(req, res);

            expect(subscriptionsApi.cancelSubscription).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'No active subscription found' });
        });
    });
    
    // Note: Webhook tests are complex due to signature verification.
    // These tests will focus on the logic inside the webhook handler, assuming signature is valid.
    // To test signature failure, we would need to mock crypto, which is more involved.
});
