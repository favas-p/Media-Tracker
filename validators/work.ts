import { z } from 'zod';

export const workCategorySchema = z.enum([
  'poster',
  'video',
  'reels',
  'photo',
  'design',
  'social_media',
  'other',
]);

export const workPrioritySchema = z.enum(['low', 'medium', 'high']);
export const workStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

export const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Step title is required'),
  assignedTo: z.string().optional().nullable(),
  status: workStatusSchema.optional().default('pending'),
});

export const createWorkSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().optional(),
  category: workCategorySchema,
  priority: workPrioritySchema,
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid deadline date is required',
  }),
  assignedTo: z.array(z.string().min(1, 'Invalid user ID')).min(1, 'Assign to at least one member'),
  subtasks: z.array(subtaskSchema).optional().default([]),
  attachments: z.array(z.string().url('Invalid URL')).optional().default([]),
});

export const updateWorkSchema = createWorkSchema.partial().extend({
  status: workStatusSchema.optional(),
});

export const updateSubtaskStatusSchema = z.object({
  subtaskId: z.string().min(1, 'Subtask ID is required'),
  status: workStatusSchema,
});

export const updateWorkStatusSchema = z.object({
  status: workStatusSchema,
});

export const createCommentSchema = z.object({
  message: z.string().trim().min(1, 'Comment cannot be empty'),
});

export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput = z.infer<typeof updateWorkSchema>;
export type UpdateWorkStatusInput = z.infer<typeof updateWorkStatusSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
