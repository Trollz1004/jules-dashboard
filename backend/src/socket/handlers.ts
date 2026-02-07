import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { notificationService } from '../services';
import logger from '../utils/logger';
import { JWTPayload, ChatMessage, TypingEvent, OnlineStatusEvent } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Store online users
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // Set up notification emitter
  notificationService.setSocketEmitter((userId: string, event: string, data: unknown) => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info(`User connected: ${userId}`);

    // Add to online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Update last active
    await prisma.profile.update({
      where: { userId },
      data: { lastActiveAt: new Date() },
    }).catch(() => {}); // Ignore if profile doesn't exist

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join conversation rooms
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    conversations.forEach(c => {
      socket.join(`conversation:${c.conversationId}`);
    });

    // Broadcast online status
    const matches = await getMatchedUserIds(userId);
    matches.forEach(matchedUserId => {
      emitToUser(io, matchedUserId, 'user:online', {
        userId,
        isOnline: true,
        lastActiveAt: new Date(),
      } as OnlineStatusEvent);
    });

    // Handle typing events
    socket.on('typing:start', async (data: { conversationId: string }) => {
      const { conversationId } = data;

      // Verify user is participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (participant) {
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId,
          isTyping: true,
        } as TypingEvent);
      }
    });

    socket.on('typing:stop', async (data: { conversationId: string }) => {
      const { conversationId } = data;

      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (participant) {
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId,
          isTyping: false,
        } as TypingEvent);
      }
    });

    // Handle message sending via socket
    socket.on('message:send', async (data: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Verify user is participant and get recipient
        const participant = await prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
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
          socket.emit('error', { message: 'Not a participant of this conversation' });
          return;
        }

        if (participant.conversation.match.status !== 'MATCHED') {
          socket.emit('error', { message: 'Cannot send message to unmatched conversation' });
          return;
        }

        const receiverId = participant.conversation.participants[0]?.userId;
        if (!receiverId) {
          socket.emit('error', { message: 'No recipient found' });
          return;
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
          socket.emit('error', { message: 'Cannot send message to this user' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            receiverId,
            content: content.trim(),
            status: 'SENT',
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        const chatMessage: ChatMessage = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          createdAt: message.createdAt,
        };

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', chatMessage);

        // Update message status to delivered if recipient is online
        if (isUserOnline(receiverId)) {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'DELIVERED' },
          });
          socket.emit('message:delivered', { messageId: message.id });
        }

        // Send push notification
        await notificationService.notifyNewMessage(
          receiverId,
          userId,
          conversationId,
          content
        );

      } catch (error) {
        logger.error('Socket message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read
    socket.on('message:read', async (data: { conversationId: string; messageIds: string[] }) => {
      try {
        const { conversationId, messageIds } = data;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            conversationId,
            receiverId: userId,
          },
          data: { status: 'READ' },
        });

        await prisma.conversationParticipant.update({
          where: { conversationId_userId: { conversationId, userId } },
          data: { lastReadAt: new Date() },
        });

        // Notify sender that messages were read
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          messageIds,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (error) {
        logger.error('Socket message read error:', error);
      }
    });

    // Handle joining a new conversation (after match)
    socket.on('conversation:join', (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
    });

    // Handle leaving a conversation
    socket.on('conversation:leave', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId}`);

      // Remove from online users
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Update last active
          await prisma.profile.update({
            where: { userId },
            data: { lastActiveAt: new Date() },
          }).catch(() => {});

          // Broadcast offline status
          const matches = await getMatchedUserIds(userId);
          matches.forEach(matchedUserId => {
            emitToUser(io, matchedUserId, 'user:offline', {
              userId,
              isOnline: false,
              lastActiveAt: new Date(),
            } as OnlineStatusEvent);
          });
        }
      }
    });
  });
}

// Helper functions
function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

function emitToUser(io: Server, userId: string, event: string, data: unknown): void {
  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}

async function getMatchedUserIds(userId: string): Promise<string[]> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'MATCHED',
    },
    select: {
      user1Id: true,
      user2Id: true,
    },
  });

  return matches.map(m => (m.user1Id === userId ? m.user2Id : m.user1Id));
}

export function getOnlineUsers(): Map<string, Set<string>> {
  return onlineUsers;
}

export function isOnline(userId: string): boolean {
  return isUserOnline(userId);
}
