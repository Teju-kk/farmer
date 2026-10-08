import { z } from 'zod';

const role = z.enum(['FARMER', 'MARKETER', 'ADMIN']);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export const adminUsersQuerySchema = z.object({
  query: z.object({
    role: role.optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  }),
});

export const adminUserIdSchema = z.object({ params: z.object({ id: z.string().min(1).max(100) }) });

export const createMarketerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email,
    phone: z.string().trim().min(8).max(20).optional(),
    organization: z.string().trim().max(120).optional(),
    marketLocation: z.string().trim().max(160).optional(),
  }).strict(),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1).max(100) }),
  body: z.object({
    role: z.enum(['FARMER', 'MARKETER']).optional(),
    isActive: z.boolean().optional(),
  }).strict().refine((body) => body.role !== undefined || body.isActive !== undefined, 'Provide a role or active-state change.'),
});
