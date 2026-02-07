import { Router } from 'express';
import { notificationsController } from '../controllers';
import { authenticate, validate, paginationSchema } from '../middleware';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Get notifications
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate(paginationSchema),
  notificationsController.getNotifications
);

/**
 * @route   PUT /api/notifications/read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.put(
  '/read',
  authenticate,
  notificationsController.markAsRead
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put(
  '/read-all',
  authenticate,
  notificationsController.markAllAsRead
);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  '/:notificationId',
  authenticate,
  notificationsController.deleteNotification
);

export default router;
