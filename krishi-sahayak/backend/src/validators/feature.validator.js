import { z } from 'zod';
export const contactSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), subject: z.string().trim().min(3).max(160), message: z.string().trim().min(10).max(4000) }) });
export const schemeSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(160), officialUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Use a secure https link').optional(), status: z.enum(['RESEARCHING', 'APPLIED', 'WAITING', 'APPROVED', 'NOT_ELIGIBLE']).optional(), deadline: z.coerce.date().optional(), notes: z.string().max(2000).optional() }) });
export const schemeUpdateSchema = z.object({ body: schemeSchema.shape.body.partial() });
export const assistantSchema = z.object({ body: z.object({ question: z.string().trim().min(4).max(2000), locale: z.enum(['en', 'kn']).default('en') }) });
