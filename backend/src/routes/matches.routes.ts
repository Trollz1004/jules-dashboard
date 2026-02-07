import { Router } from 'express';
import { matchesController } from '../controllers';
import { authenticate, validate, paginationSchema } from '../middleware';

const router = Router();

/**
 * @route   GET /api/matches
 * @desc    Get all matches
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate(paginationSchema),
  matchesController.getMatches
);

/**
 * @route   GET /api/matches/new
 * @desc    Get new matches (last 24h, no messages yet)
 * @access  Private
 */
router.get(
  '/new',
  authenticate,
  matchesController.getNewMatches
);

/**
 * @route   GET /api/matches/stats
 * @desc    Get match statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  matchesController.getMatchStats
);

/**
 * @route   GET /api/matches/:matchId
 * @desc    Get match details
 * @access  Private
 */
router.get(
  '/:matchId',
  authenticate,
  matchesController.getMatch
);

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Unmatch
 * @access  Private
 */
router.delete(
  '/:matchId',
  authenticate,
  matchesController.unmatch
);

export default router;
