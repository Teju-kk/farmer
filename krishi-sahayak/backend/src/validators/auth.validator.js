import { z } from 'zod';
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), email, phone: z.string().trim().min(8).max(20).optional(), password: z.string().min(8).max(128) }) });
export const loginSchema = z.object({ body: z.object({ email, password: z.string().min(1).max(128) }) });
export const forgotPasswordSchema = z.object({ body: z.object({ email }) });
export const resetPasswordSchema = z.object({ body: z.object({ token: z.string().min(32).max(200), password: z.string().min(8).max(128) }) });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1).max(128), password: z.string().min(8).max(128) }) });
