import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, NotFoundError, BadRequestError, ConflictError } from '../middleware/error.middleware';
import { matchingService, notificationService } from '../services';
import { getPaginationParams, calculateAge } from '../utils/helpers';

export const discoverUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { limit } = getPaginationParams(undefined, req.query.limit as string);

    const suggestions = await matchingService.getMatchSuggestions(userId, limit);

    // Transform suggestions to hide sensitive data
    const users = suggestions.map(suggestion => ({
      id: suggestion.user.id,
      compatibilityScore: suggestion.compatibilityScore,
      distance: suggestion.distance,
      commonInterests: suggestion.commonInterests,
      profile: suggestion.user.profile ? {
        firstName: suggestion.user.profile.firstName,
        displayName: suggestion.user.profile.displayName,
        bio: suggestion.user.profile.bio,
        age: calculateAge(suggestion.user.profile.birthDate),
        gender: suggestion.user.profile.gender,
        lookingFor: suggestion.user.profile.lookingFor,
        interests: suggestion.user.profile.interests,
        occupation: suggestion.user.profile.occupation,
        city: suggestion.user.profile.city,
        country: suggestion.user.profile.country,
      } : null,
      photos: (suggestion.user as unknown as { photos?: { url: string; isPrimary: boolean }[] }).photos || [],
    }));

    res.json({
      success: true,
      data: users,
    });
  }
);

export const likeUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { userId: targetUserId } = req.params;
    const { isSuperLike } = req.body;

    if (userId === targetUserId) {
      throw new BadRequestError('Cannot like yourself');
    }

    // Check if target user exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId, isActive: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
    });

    if (block) {
      throw new BadRequestError('Cannot interact with this user');
    }

    // Check super like eligibility (premium feature)
    if (isSuperLike) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.isPremium) {
        throw new BadRequestError('Super likes require premium subscription');
      }
    }

    try {
      const result = await matchingService.processLike(userId, targetUserId, isSuperLike);

      // Notify about like
      await notificationService.notifyNewLike(targetUserId, userId, isSuperLike);

      if (result.matched) {
        // Notify both users about the match
        await Promise.all([
          notificationService.notifyNewMatch(userId, targetUserId),
          notificationService.notifyNewMatch(targetUserId, userId),
        ]);

        res.json({
          success: true,
          message: "It's a match!",
          data: { matched: true, matchId: result.matchId },
        });
        return;
      }

      res.json({
        success: true,
        message: isSuperLike ? 'Super like sent!' : 'Like sent!',
        data: { matched: false },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictError('Already liked this user');
      }
      throw error;
    }
  }
);

export const passUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { userId: targetUserId } = req.params;

    // We don't store passes explicitly, but we can track them if needed
    // For now, just return success
    res.json({
      success: true,
      message: 'User passed',
    });
  }
);

export const getLikedUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  birthDate: true,
                  city: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.like.count({ where: { fromUserId: userId } }),
    ]);

    const users = likes.map(like => ({
      id: like.toUser.id,
      likedAt: like.createdAt,
      isSuperLike: like.isSuperLike,
      profile: like.toUser.profile ? {
        firstName: like.toUser.profile.firstName,
        age: calculateAge(like.toUser.profile.birthDate),
        city: like.toUser.profile.city,
      } : null,
      photo: like.toUser.photos[0]?.url || null,
    }));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + likes.length < total,
        },
      },
    });
  }
);

export const getReceivedLikes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // Check if user is premium
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isPremium) {
      // For non-premium users, just return count
      const count = await prisma.like.count({
        where: { toUserId: userId },
      });

      res.json({
        success: true,
        data: {
          count,
          isPremiumRequired: true,
          message: 'Upgrade to premium to see who liked you',
        },
      });
      return;
    }

    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  birthDate: true,
                  city: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.like.count({ where: { toUserId: userId } }),
    ]);

    const users = likes.map(like => ({
      id: like.fromUser.id,
      likedAt: like.createdAt,
      isSuperLike: like.isSuperLike,
      profile: like.fromUser.profile ? {
        firstName: like.fromUser.profile.firstName,
        age: calculateAge(like.fromUser.profile.birthDate),
        city: like.fromUser.profile.city,
      } : null,
      photo: like.fromUser.photos[0]?.url || null,
    }));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + likes.length < total,
        },
      },
    });
  }
);

export const blockUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { userId: targetUserId } = req.params;
    const { reason } = req.body;

    if (userId === targetUserId) {
      throw new BadRequestError('Cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: targetUserId },
      },
    });

    if (existingBlock) {
      throw new ConflictError('User already blocked');
    }

    // Create block
    await prisma.block.create({
      data: {
        blockerId: userId,
        blockedId: targetUserId,
        reason,
      },
    });

    // Unmatch if matched
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
        status: 'MATCHED',
      },
    });

    if (match) {
      await matchingService.unmatch(userId, match.id);
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  }
);

export const unblockUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { userId: targetUserId } = req.params;

    const result = await prisma.block.deleteMany({
      where: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError('Block not found');
    }

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  }
);

export const getBlockedUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const users = blocks.map(block => ({
      id: block.blocked.id,
      blockedAt: block.createdAt,
      name: block.blocked.profile?.firstName || 'Unknown',
      photo: block.blocked.photos[0]?.url || null,
    }));

    res.json({
      success: true,
      data: users,
    });
  }
);

export const reportUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { userId: targetUserId } = req.params;
    const { reason, description } = req.body;

    if (userId === targetUserId) {
      throw new BadRequestError('Cannot report yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    await prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: targetUserId,
        reason,
        description,
      },
    });

    res.json({
      success: true,
      message: 'Report submitted successfully',
    });
  }
);
