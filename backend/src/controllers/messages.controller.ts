import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, NotFoundError, ForbiddenError, BadRequestError } from '../middleware/error.middleware';
import { notificationService, aiService } from '../services';
import { getPaginationParams } from '../utils/helpers';

export const getConversations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const [conversations, total] = await Promise.all([
      prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                where: { userId: { not: userId } },
                include: {
                  user: {
                    select: {
                      id: true,
                      profile: {
                        select: {
                          firstName: true,
                          displayName: true,
                          lastActiveAt: true,
                        },
                      },
                      photos: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          conversation: { lastMessageAt: 'desc' },
        },
        skip,
        take: limit,
      }),
      prisma.conversationParticipant.count({
        where: { userId },
      }),
    ]);

    const formattedConversations = conversations
      .filter(cp => cp.conversation.messages.length > 0) // Only show conversations with messages
      .map(cp => {
        const otherParticipant = cp.conversation.participants[0];
        const lastMessage = cp.conversation.messages[0];
        const unreadCount = cp.lastReadAt
          ? cp.conversation.messages.filter(
              m => m.createdAt > cp.lastReadAt! && m.senderId !== userId
            ).length
          : cp.conversation.messages.filter(m => m.senderId !== userId).length;

        return {
          id: cp.conversation.id,
          isMuted: cp.isMuted,
          lastMessageAt: cp.conversation.lastMessageAt,
          unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content.length > 50
              ? `${lastMessage.content.substring(0, 47)}...`
              : lastMessage.content,
            isFromMe: lastMessage.senderId === userId,
            createdAt: lastMessage.createdAt,
            status: lastMessage.status,
          } : null,
          participant: otherParticipant ? {
            id: otherParticipant.user.id,
            name: otherParticipant.user.profile?.displayName ||
                  otherParticipant.user.profile?.firstName ||
                  'Unknown',
            lastActiveAt: otherParticipant.user.profile?.lastActiveAt,
            photo: otherParticipant.user.photos[0]?.url || null,
          } : null,
        };
      });

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + conversations.length < total,
        },
      },
    });
  }
);

export const getConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    displayName: true,
                    lastActiveAt: true,
                  },
                },
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        match: {
          select: {
            id: true,
            status: true,
            matchedAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const otherParticipant = conversation.participants[0];

    res.json({
      success: true,
      data: {
        id: conversation.id,
        matchId: conversation.match.id,
        matchStatus: conversation.match.status,
        matchedAt: conversation.match.matchedAt,
        participant: otherParticipant ? {
          id: otherParticipant.user.id,
          name: otherParticipant.user.profile?.displayName ||
                otherParticipant.user.profile?.firstName ||
                'Unknown',
          lastActiveAt: otherParticipant.user.profile?.lastActiveAt,
          photo: otherParticipant.user.photos[0]?.url || null,
        } : null,
      },
    });
  }
);

export const getMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: { conversationId, isDeleted: false },
      }),
    ]);

    // Mark messages as read
    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          status: { not: 'READ' },
        },
        data: { status: 'READ' },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isFromMe: msg.senderId === userId,
      status: msg.status,
      createdAt: msg.createdAt,
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  }
);

export const sendMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        conversation: {
          include: {
            match: true,
            participants: {
              where: { userId: { not: userId } },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    if (participant.conversation.match.status !== 'MATCHED') {
      throw new BadRequestError('Cannot send message to unmatched conversation');
    }

    const receiverId = participant.conversation.participants[0]?.userId;
    if (!receiverId) {
      throw new BadRequestError('No recipient found');
    }

    // Check if blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: userId },
        ],
      },
    });

    if (block) {
      throw new ForbiddenError('Cannot send message to this user');
    }

    // Content moderation
    const moderation = await aiService.moderateContent(content);
    if (!moderation.isAppropriate) {
      throw new BadRequestError('Message contains inappropriate content');
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content,
        status: 'SENT',
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify recipient
    await notificationService.notifyNewMessage(
      receiverId,
      userId,
      conversationId,
      content
    );

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        isFromMe: true,
        status: message.status,
        createdAt: message.createdAt,
      },
    });
  }
);

export const deleteMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId, messageId } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: userId,
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Message deleted',
    });
  }
);

export const muteConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { muted } = req.body;

    const result = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: { isMuted: muted ?? true },
    });

    if (result.count === 0) {
      throw new NotFoundError('Conversation not found');
    }

    res.json({
      success: true,
      message: muted ? 'Conversation muted' : 'Conversation unmuted',
    });
  }
);

export const getIcebreaker = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    // Get conversation and participant details
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  include: {
                    profile: {
                      select: {
                        interests: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    // Get user's interests
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { interests: true },
    });

    const otherUserInterests = participant.conversation.participants[0]?.user.profile?.interests || [];
    const userInterests = userProfile?.interests || [];

    const icebreaker = await aiService.generateIcebreaker(userInterests, otherUserInterests);

    res.json({
      success: true,
      data: { icebreaker },
    });
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          status: { not: 'READ' },
        },
        data: { status: 'READ' },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  }
);
