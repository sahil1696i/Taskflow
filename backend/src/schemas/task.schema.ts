import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').trim(),
  description: z.string().optional(),
  assigneeId: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().datetime({ message: 'Due date must be a valid ISO 8601 datetime' }).optional(),
});

export const UpdateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.string().min(1).optional(),
}).refine(data => data.status !== undefined || data.assigneeId !== undefined, {
  message: 'At least one field (status or assigneeId) must be provided',
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, DONE' }),
  }),
});

export const ReassignTaskSchema = z.object({
  assigneeId: z.string().min(1, 'Assignee ID is required'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
