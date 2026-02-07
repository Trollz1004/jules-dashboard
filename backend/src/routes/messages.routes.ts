import { Router } from 'express';
import { messagesController } from '../controllers';
import {
  authenticate,
  validate,
  sendMessageSchema,
  paginationSchema,
} from '../middleware';
import { messageLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations
 * @access  Private
 */
router.get(
  '/conversations',
  authenticate,
  validate(paginationSchema),
  messagesController.getConversations
);

/**
 * @route   GET /api/messages/conversations/:conversationId
 * @desc    Get conversation details
 * @access  Private
 */
router.get(
  '/conversations/:conversationId',
  authenticate,
  messagesController.getConversation
);

/**
 * @route   GET /api/messages/conversations/:conversationId/messages
 * @desc    Get messages in a conversation
 * @access  Private
 */
router.get(
  '/conversations/:conversationId/messages',
  authenticate,
  validate(paginationSchema),
  messagesController.getMessages
);

/**
 * @route   POST /api/messages/conversations/:conversationId/messages
 * @desc    Send a message
 * @access  Private
 */
router.post(
  '/conversations/:conversationId/messages',
  authenticate,
  messageLimiter,
  validate(sendMessageSchema),
  messagesController.sendMessage
);

/**
 * @route   DELETE /api/messages/conversations/:conversationId/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete(
  '/conversations/:conversationId/messages/:messageId',
  authenticate,
  messagesController.deleteMessage
);

/**
 * @route   PUT /api/messages/conversations/:conversationId/mute
 * @desc    Mute/unmute a conversation
 * @access  Private
 */
router.put(
  '/conversations/:conversationId/mute',
  authenticate,
  messagesController.muteConversation
);

/**
 * @route   PUT /api/messages/conversations/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put(
  '/conversations/:conversationId/read',
  authenticate,
  messagesController.markAsRead
);

/**
 * @route   GET /api/messages/conversations/:conversationId/icebreaker
 * @desc    Get AI-generated icebreaker
 * @access  Private
 */
router.get(
  '/conversations/:conversationId/icebreaker',
  authenticate,
  messagesController.getIcebreaker
);

export default router;
