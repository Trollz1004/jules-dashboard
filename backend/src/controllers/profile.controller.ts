import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { calculateAge } from '../utils/helpers';
import { notificationService } from '../services';

export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        isPremium: true,
        profile: {
          select: {
            firstName: true,
            displayName: true,
            bio: true,
            birthDate: true,
            gender: true,
            lookingFor: true,
            interests: true,
            occupation: true,
            education: true,
            height: true,
            city: true,
            country: true,
            lastActiveAt: true,
          },
        },
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundError('Profile not found');
    }

    // Record profile view
    if (userId !== currentUserId) {
      await prisma.profileView.create({
        data: {
          viewerId: currentUserId,
          viewedId: userId,
        },
      });

      // Notify about profile view
      await notificationService.notifyProfileView(userId, currentUserId);
    }

    // Calculate age from birthDate
    const age = calculateAge(user.profile.birthDate);

    res.json({
      success: true,
      data: {
        ...user,
        profile: {
          ...user.profile,
          age,
          birthDate: undefined, // Don't expose exact birth date
        },
      },
    });
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const updateData = req.body;

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundError('Profile not found');
    }

    // Handle birthDate conversion
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    // Update profile
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...updateData,
        lastActiveAt: new Date(),
        profileComplete: true, // Mark as complete after update
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  }
);

export const updatePreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const updateData = req.body;

    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  }
);

export const getPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundError('Preferences not found');
    }

    res.json({
      success: true,
      data: preferences,
    });
  }
);

export const uploadPhoto = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    // Get current photo count
    const photoCount = await prisma.photo.count({
      where: { userId },
    });

    if (photoCount >= 6) {
      throw new BadRequestError('Maximum 6 photos allowed');
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId,
        url: `/uploads/${file.filename}`,
        isPrimary: photoCount === 0, // First photo is primary
        order: photoCount,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: photo,
    });
  }
);

export const deletePhoto = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { photoId } = req.params;

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId },
    });

    if (!photo) {
      throw new NotFoundError('Photo not found');
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    // If deleted photo was primary, set another as primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.photo.findFirst({
        where: { userId },
        orderBy: { order: 'asc' },
      });

      if (nextPhoto) {
        await prisma.photo.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  }
);

export const setPrimaryPhoto = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { photoId } = req.params;

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId },
    });

    if (!photo) {
      throw new NotFoundError('Photo not found');
    }

    // Remove primary from all photos
    await prisma.photo.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    // Set new primary
    await prisma.photo.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });

    res.json({
      success: true,
      message: 'Primary photo updated',
    });
  }
);

export const reorderPhotos = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { photoIds } = req.body; // Array of photo IDs in new order

    if (!Array.isArray(photoIds)) {
      throw new BadRequestError('photoIds must be an array');
    }

    // Verify all photos belong to user
    const photos = await prisma.photo.findMany({
      where: { userId },
    });

    const userPhotoIds = new Set(photos.map(p => p.id));
    const validIds = photoIds.every((id: string) => userPhotoIds.has(id));

    if (!validIds) {
      throw new BadRequestError('Invalid photo IDs');
    }

    // Update order
    await Promise.all(
      photoIds.map((id: string, index: number) =>
        prisma.photo.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    res.json({
      success: true,
      message: 'Photos reordered successfully',
    });
  }
);

export const getProfileViewers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // Check if user is premium
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isPremium) {
      res.status(403).json({
        success: false,
        error: 'Premium subscription required to view profile visitors',
      });
      return;
    }

    const views = await prisma.profileView.findMany({
      where: { viewedId: userId },
      include: {
        viewer: {
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
      take: 50,
    });

    const viewersWithAge = views.map(view => ({
      ...view,
      viewer: {
        ...view.viewer,
        profile: view.viewer.profile ? {
          ...view.viewer.profile,
          age: calculateAge(view.viewer.profile.birthDate),
          birthDate: undefined,
        } : null,
      },
    }));

    res.json({
      success: true,
      data: viewersWithAge,
    });
  }
);
