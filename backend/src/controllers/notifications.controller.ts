import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { notificationService } from '../services';
import { getPaginationParams } from '../utils/helpers';

export const getNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    const unreadOnly = req.query.unreadOnly === 'true';

    const { notifications, unreadCount } = await notificationService.getNotifications(
      userId,
      { limit, offset: skip, unreadOnly }
    );

    const total = notifications.length; // For simplicity, could add proper count

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: notifications.length === limit,
        },
      },
    });
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'notificationIds must be a non-empty array',
      });
      return;
    }

    await notificationService.markAsRead(userId, notificationIds);

    res.json({
      success: true,
      message: 'Notifications marked as read',
    });
  }
);

export const markAllAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  }
);

export const deleteNotification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    await notificationService.deleteNotification(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  }
);
