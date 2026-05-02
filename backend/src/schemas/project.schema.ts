import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').trim(),
  description: z.string().optional(),
});

export const AddMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
