import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../types';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
    }
  };
};

// Auth validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    firstName: z.string().min(1, 'First name is required').max(50),
    birthDate: z.string().refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, 'Must be at least 18 years old'),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Profile validation schemas
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().max(50).optional(),
    displayName: z.string().max(50).optional(),
    bio: z.string().max(500).optional(),
    birthDate: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']).optional(),
    lookingFor: z.array(z.enum(['RELATIONSHIP', 'FRIENDSHIP', 'CASUAL', 'NETWORKING'])).optional(),
    interests: z.array(z.string().max(30)).max(20).optional(),
    occupation: z.string().max(100).optional(),
    education: z.string().max(100).optional(),
    height: z.number().min(100).max(300).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    minAge: z.number().min(18).max(100).optional(),
    maxAge: z.number().min(18).max(100).optional(),
    maxDistance: z.number().min(1).max(500).optional(),
    genderPreference: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'])).optional(),
    lookingFor: z.array(z.enum(['RELATIONSHIP', 'FRIENDSHIP', 'CASUAL', 'NETWORKING'])).optional(),
    showOnlineStatus: z.boolean().optional(),
    showDistance: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  }),
});

// Message validation schemas
export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message cannot be empty').max(2000),
  }),
  params: z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
  }),
});

// Like validation schemas
export const likeUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    isSuperLike: z.boolean().optional(),
  }),
});

// Block/Report validation schemas
export const blockUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const reportUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'UNDERAGE', 'OTHER']),
    description: z.string().max(1000).optional(),
  }),
});

// Pagination validation
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// UUID param validation
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});
