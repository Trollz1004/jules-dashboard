import { NotificationType } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  private static instance: NotificationService;
  private socketEmitter?: (userId: string, event: string, data: unknown) => void;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setSocketEmitter(emitter: (userId: string, event: string, data: unknown) => void): void {
    this.socketEmitter = emitter;
  }

  async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Check user preferences
      const preferences = await prisma.userPreference.findUnique({
        where: { userId: payload.userId },
      });

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        },
      });

      // Send real-time notification via socket
      if (preferences?.pushNotifications !== false && this.socketEmitter) {
        this.socketEmitter(payload.userId, 'notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          createdAt: notification.createdAt,
        });
      }

      logger.info(`Notification created for user ${payload.userId}: ${payload.type}`);
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyNewMatch(userId: string, matchedUserId: string): Promise<void> {
    const matchedUser = await prisma.user.findUnique({
      where: { id: matchedUserId },
      include: { profile: true },
    });

    if (!matchedUser?.profile) return;

    await this.createNotification({
      userId,
      type: 'NEW_MATCH',
      title: "It's a Match!",
      body: `You and ${matchedUser.profile.firstName} liked each other!`,
      data: {
        matchedUserId,
        matchedUserName: matchedUser.profile.firstName,
      },
    });
  }

  async notifyNewLike(userId: string, fromUserId: string, isSuperLike: boolean = false): Promise<void> {
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { profile: true },
    });

    // Only notify premium users about regular likes
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isPremium && !isSuperLike) return;

    await this.createNotification({
      userId,
      type: 'NEW_LIKE',
      title: isSuperLike ? 'Someone Super Liked you!' : 'Someone liked you!',
      body: user.isPremium && fromUser?.profile
        ? `${fromUser.profile.firstName} ${isSuperLike ? 'super ' : ''}liked your profile`
        : isSuperLike
          ? 'Someone special super liked your profile!'
          : 'Someone liked your profile!',
      data: user.isPremium ? { fromUserId } : {},
    });
  }

  async notifyNewMessage(
    userId: string,
    senderId: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { profile: true },
    });

    if (!sender?.profile) return;

    await this.createNotification({
      userId,
      type: 'NEW_MESSAGE',
      title: `Message from ${sender.profile.firstName}`,
      body: messagePreview.length > 50
        ? `${messagePreview.substring(0, 47)}...`
        : messagePreview,
      data: {
        senderId,
        conversationId,
        senderName: sender.profile.firstName,
      },
    });
  }

  async notifyProfileView(userId: string, viewerId: string): Promise<void> {
    // Only notify premium users
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isPremium) return;

    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });

    if (!viewer?.profile) return;

    // Rate limit profile view notifications (max 1 per viewer per day)
    const recentView = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'PROFILE_VIEW',
        data: {
          path: ['viewerId'],
          equals: viewerId,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentView) return;

    await this.createNotification({
      userId,
      type: 'PROFILE_VIEW',
      title: 'Someone viewed your profile',
      body: `${viewer.profile.firstName} checked out your profile`,
      data: { viewerId },
    });
  }

  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{
    notifications: Array<{
      id: string;
      type: NotificationType;
      title: string;
      body: string;
      data: unknown;
      isRead: boolean;
      createdAt: Date;
    }>;
    unreadCount: number;
  }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }
}

export default NotificationService.getInstance();
