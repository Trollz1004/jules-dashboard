import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/error.middleware';
import { matchingService } from '../services';
import { getPaginationParams, calculateAge } from '../utils/helpers';

export const getMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'MATCHED',
        },
        include: {
          user1: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  displayName: true,
                  birthDate: true,
                  city: true,
                  lastActiveAt: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          user2: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  displayName: true,
                  birthDate: true,
                  city: true,
                  lastActiveAt: true,
                },
              },
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          conversation: {
            select: {
              id: true,
              lastMessageAt: true,
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  content: true,
                  senderId: true,
                  createdAt: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [
          { conversation: { lastMessageAt: 'desc' } },
          { matchedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'MATCHED',
        },
      }),
    ]);

    const formattedMatches = matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      const lastMessage = match.conversation?.messages[0];

      return {
        id: match.id,
        matchedAt: match.matchedAt,
        conversationId: match.conversation?.id,
        lastMessageAt: match.conversation?.lastMessageAt,
        lastMessage: lastMessage ? {
          content: lastMessage.content.length > 50
            ? `${lastMessage.content.substring(0, 47)}...`
            : lastMessage.content,
          isFromMe: lastMessage.senderId === userId,
          createdAt: lastMessage.createdAt,
          status: lastMessage.status,
        } : null,
        user: {
          id: otherUser.id,
          name: otherUser.profile?.displayName || otherUser.profile?.firstName || 'Unknown',
          age: otherUser.profile ? calculateAge(otherUser.profile.birthDate) : null,
          city: otherUser.profile?.city,
          lastActiveAt: otherUser.profile?.lastActiveAt,
          photo: otherUser.photos[0]?.url || null,
        },
      };
    });

    res.json({
      success: true,
      data: {
        matches: formattedMatches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + matches.length < total,
        },
      },
    });
  }
);

export const getMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { matchId } = req.params;

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            profile: true,
            photos: {
              orderBy: { order: 'asc' },
            },
          },
        },
        user2: {
          select: {
            id: true,
            profile: true,
            photos: {
              orderBy: { order: 'asc' },
            },
          },
        },
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;

    res.json({
      success: true,
      data: {
        id: match.id,
        matchedAt: match.matchedAt,
        status: match.status,
        conversationId: match.conversation?.id,
        user: {
          id: otherUser.id,
          profile: otherUser.profile ? {
            firstName: otherUser.profile.firstName,
            displayName: otherUser.profile.displayName,
            bio: otherUser.profile.bio,
            age: calculateAge(otherUser.profile.birthDate),
            gender: otherUser.profile.gender,
            lookingFor: otherUser.profile.lookingFor,
            interests: otherUser.profile.interests,
            occupation: otherUser.profile.occupation,
            education: otherUser.profile.education,
            height: otherUser.profile.height,
            city: otherUser.profile.city,
            country: otherUser.profile.country,
          } : null,
          photos: otherUser.photos,
        },
      },
    });
  }
);

export const unmatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { matchId } = req.params;

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'MATCHED',
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    await matchingService.unmatch(userId, matchId);

    res.json({
      success: true,
      message: 'Unmatched successfully',
    });
  }
);

export const getMatchStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const [totalMatches, activeMatches, totalLikesSent, totalLikesReceived] = await Promise.all([
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'MATCHED',
        },
      }),
      prisma.like.count({
        where: { fromUserId: userId },
      }),
      prisma.like.count({
        where: { toUserId: userId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalMatches,
        activeMatches,
        totalLikesSent,
        totalLikesReceived,
        matchRate: totalLikesSent > 0
          ? Math.round((totalMatches / totalLikesSent) * 100)
          : 0,
      },
    });
  }
);

export const getNewMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // Get matches from last 24 hours that don't have any messages yet
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'MATCHED',
        matchedAt: { gte: oneDayAgo },
        conversation: {
          messages: {
            none: {},
          },
        },
      },
      include: {
        user1: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                birthDate: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        user2: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                birthDate: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { matchedAt: 'desc' },
    });

    const newMatches = matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        matchedAt: match.matchedAt,
        user: {
          id: otherUser.id,
          name: otherUser.profile?.firstName || 'Unknown',
          age: otherUser.profile ? calculateAge(otherUser.profile.birthDate) : null,
          photo: otherUser.photos[0]?.url || null,
        },
      };
    });

    res.json({
      success: true,
      data: newMatches,
    });
  }
);
