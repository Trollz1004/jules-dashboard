import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const birthdaySchema = z
  .string()
  .min(1, 'Birthday is required')
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
    return actualAge >= 18;
  }, 'You must be at least 18 years old')
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age <= 120;
  }, 'Please enter a valid birthday');

export const bioSchema = z
  .string()
  .max(500, 'Bio must be less than 500 characters')
  .optional();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  name: nameSchema,
  birthday: birthdaySchema,
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  name: nameSchema,
  birthday: birthdaySchema,
  gender: z.enum(['Man', 'Woman', 'Non-binary', 'Other']).optional(),
  bio: bioSchema,
  interests: z.array(z.string()).min(3, 'Please select at least 3 interests').max(10, 'Maximum 10 interests allowed'),
  jobTitle: z.string().max(100, 'Job title must be less than 100 characters').optional(),
  company: z.string().max(100, 'Company must be less than 100 characters').optional(),
  school: z.string().max(100, 'School must be less than 100 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm').optional(),
  relationshipGoal: z.enum([
    'Long-term relationship',
    'Something casual',
    'New friends',
    'Still figuring it out',
  ]).optional(),
});

export const settingsSchema = z.object({
  showMe: z.enum(['men', 'women', 'everyone']),
  ageRange: z.object({
    min: z.number().min(18).max(99),
    max: z.number().min(18).max(99),
  }).refine((data) => data.min <= data.max, {
    message: 'Minimum age cannot be greater than maximum age',
  }),
  maxDistance: z.number().min(1).max(500),
  showDistance: z.boolean(),
  showAge: z.boolean(),
  notifications: z.object({
    matches: z.boolean(),
    messages: z.boolean(),
    likes: z.boolean(),
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const reportSchema = z.object({
  reason: z.enum([
    'inappropriate_photos',
    'inappropriate_messages',
    'fake_profile',
    'underage',
    'spam',
    'other',
  ]),
  details: z.string().max(1000, 'Details must be less than 1000 characters').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
