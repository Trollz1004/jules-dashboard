import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { profileController } from '../controllers';
import {
  authenticate,
  validate,
  updateProfileSchema,
  updatePreferencesSchema,
  userIdParamSchema,
} from '../middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  },
});

/**
 * @route   GET /api/profile/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get(
  '/:userId',
  authenticate,
  validate(userIdParamSchema),
  profileController.getProfile
);

/**
 * @route   PUT /api/profile
 * @desc    Update own profile
 * @access  Private
 */
router.put(
  '/',
  authenticate,
  validate(updateProfileSchema),
  profileController.updateProfile
);

/**
 * @route   GET /api/profile/preferences/me
 * @desc    Get own preferences
 * @access  Private
 */
router.get(
  '/preferences/me',
  authenticate,
  profileController.getPreferences
);

/**
 * @route   PUT /api/profile/preferences
 * @desc    Update own preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authenticate,
  validate(updatePreferencesSchema),
  profileController.updatePreferences
);

/**
 * @route   POST /api/profile/photos
 * @desc    Upload a photo
 * @access  Private
 */
router.post(
  '/photos',
  authenticate,
  uploadLimiter,
  upload.single('photo'),
  profileController.uploadPhoto
);

/**
 * @route   DELETE /api/profile/photos/:photoId
 * @desc    Delete a photo
 * @access  Private
 */
router.delete(
  '/photos/:photoId',
  authenticate,
  profileController.deletePhoto
);

/**
 * @route   PUT /api/profile/photos/:photoId/primary
 * @desc    Set photo as primary
 * @access  Private
 */
router.put(
  '/photos/:photoId/primary',
  authenticate,
  profileController.setPrimaryPhoto
);

/**
 * @route   PUT /api/profile/photos/reorder
 * @desc    Reorder photos
 * @access  Private
 */
router.put(
  '/photos/reorder',
  authenticate,
  profileController.reorderPhotos
);

/**
 * @route   GET /api/profile/viewers
 * @desc    Get profile viewers (premium only)
 * @access  Private
 */
router.get(
  '/viewers/me',
  authenticate,
  profileController.getProfileViewers
);

export default router;
