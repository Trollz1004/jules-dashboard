import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import usersRoutes from './users.routes';
import matchesRoutes from './matches.routes';
import messagesRoutes from './messages.routes';
import notificationsRoutes from './notifications.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/users', usersRoutes);
router.use('/matches', matchesRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
