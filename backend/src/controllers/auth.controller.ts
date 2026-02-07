import { Request, Response } from 'express';
import { authService } from '../services';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, birthDate, gender } = req.body;

  try {
    const { user, tokens } = await authService.register({
      email,
      password,
      firstName,
      birthDate: new Date(birthDate),
      gender,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already registered') {
      throw new BadRequestError('Email already registered');
    }
    throw error;
  }
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { user, tokens } = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        throw new BadRequestError('Invalid email or password');
      }
      if (error.message === 'Account is deactivated') {
        throw new BadRequestError('Account is deactivated');
      }
    }
    throw error;
  }
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshTokens(refreshToken);

  if (!tokens) {
    throw new BadRequestError('Invalid or expired refresh token');
  }

  res.json({
    success: true,
    data: { tokens },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    try {
      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Current password is incorrect') {
        throw new BadRequestError('Current password is incorrect');
      }
      throw error;
    }
  }
);

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const user = await import('../utils/prisma').then(m => m.default.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
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
            profileComplete: true,
          },
        },
        photos: {
          orderBy: { order: 'asc' },
        },
        preferences: true,
      },
    }));

    res.json({
      success: true,
      data: user,
    });
  }
);

export const deactivateAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await import('../utils/prisma').then(m => m.default.user.update({
      where: { id: userId },
      data: { isActive: false },
    }));

    // Revoke all tokens
    await authService.revokeAllUserTokens(userId);

    logger.info(`Account deactivated: ${userId}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  }
);
