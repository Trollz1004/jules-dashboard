import { Router } from 'express';
import { usersController } from '../controllers';
import {
  authenticate,
  validate,
  likeUserSchema,
  blockUserSchema,
  reportUserSchema,
  paginationSchema,
} from '../middleware';
import { likeLimiter, searchLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/users/discover
 * @desc    Get user suggestions for swiping
 * @access  Private
 */
router.get(
  '/discover',
  authenticate,
  searchLimiter,
  usersController.discoverUsers
);

/**
 * @route   POST /api/users/:userId/like
 * @desc    Like a user
 * @access  Private
 */
router.post(
  '/:userId/like',
  authenticate,
  likeLimiter,
  validate(likeUserSchema),
  usersController.likeUser
);

/**
 * @route   POST /api/users/:userId/pass
 * @desc    Pass on a user
 * @access  Private
 */
router.post(
  '/:userId/pass',
  authenticate,
  usersController.passUser
);

/**
 * @route   GET /api/users/likes/sent
 * @desc    Get users you've liked
 * @access  Private
 */
router.get(
  '/likes/sent',
  authenticate,
  validate(paginationSchema),
  usersController.getLikedUsers
);

/**
 * @route   GET /api/users/likes/received
 * @desc    Get users who liked you (premium shows details)
 * @access  Private
 */
router.get(
  '/likes/received',
  authenticate,
  validate(paginationSchema),
  usersController.getReceivedLikes
);

/**
 * @route   POST /api/users/:userId/block
 * @desc    Block a user
 * @access  Private
 */
router.post(
  '/:userId/block',
  authenticate,
  validate(blockUserSchema),
  usersController.blockUser
);

/**
 * @route   DELETE /api/users/:userId/block
 * @desc    Unblock a user
 * @access  Private
 */
router.delete(
  '/:userId/block',
  authenticate,
  usersController.unblockUser
);

/**
 * @route   GET /api/users/blocked
 * @desc    Get blocked users
 * @access  Private
 */
router.get(
  '/blocked',
  authenticate,
  usersController.getBlockedUsers
);

/**
 * @route   POST /api/users/:userId/report
 * @desc    Report a user
 * @access  Private
 */
router.post(
  '/:userId/report',
  authenticate,
  validate(reportUserSchema),
  usersController.reportUser
);

export default router;
