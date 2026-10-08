import { z } from 'zod';
export const deleteAccountSchema = z.object({ body: z.object({ password: z.string().min(1).max(128) }) });
export const profileSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(20).optional() }) });
