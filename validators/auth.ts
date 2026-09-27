import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(2, 'Username or Email must be at least 2 characters').optional(),
  email: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => !!(data.username || data.email), {
  message: 'Username or Email is required.',
  path: ['username'],
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  username: z.string().trim().min(2, 'Username must be at least 2 characters').optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['chairman', 'convener', 'member']),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const updateMemberSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['chairman', 'convener', 'member']),
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
