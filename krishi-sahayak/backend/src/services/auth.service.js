import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { createHash, randomBytes } from 'node:crypto';
import { sendMail } from './mail.service.js';
const safeUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt });
const tokenFor = (user) => jwt.sign({ sub: user.id, role: user.role, email: user.email, ver: user.tokenVersion || 0 }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
export async function register(input) { const existing = await prisma.user.findUnique({ where: { email: input.email } }); if (existing) throw new AppError('An account already exists with this email', 409); const passwordHash = await bcrypt.hash(input.password, 12); const user = await prisma.user.create({ data: { name: input.name, email: input.email, phone: input.phone, role: 'FARMER', passwordHash, farmerProfile: { create: {} } } }); return { user: safeUser(user), token: tokenFor(user) }; }
export async function login({ email, password }) { const user = await prisma.user.findUnique({ where: { email } }); if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Invalid email or password', 401); return { user: safeUser(user), token: tokenFor(user) }; }
export async function getCurrentUser(id) { const user = await prisma.user.findUnique({ where: { id } }); if (!user || !user.isActive) throw new AppError('Your account is unavailable. Please sign in again.', 401); return safeUser(user); }

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) return false;
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  const link = `${env.frontendUrl}/reset-password#token=${encodeURIComponent(rawToken)}`;
  try {
    await sendMail({ to: user.email, subject: 'Reset your Krishi Sahayak password', text: `Use this link within 30 minutes to reset your password:\n\n${link}\n\nIf you did not request this, ignore this message.` });
    return true;
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    console.error('Password reset email delivery failed:', error.message);
    return false;
  }
}

export async function resetPassword(rawToken, password) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.expiresAt <= new Date()) throw new AppError('This password reset link is invalid or expired. Request a new one.', 400);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.deleteMany({ where: { id: reset.id, expiresAt: { gt: new Date() } } });
    if (!consumed.count) throw new AppError('This password reset link is invalid or expired. Request a new one.', 400);
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
    await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
  });
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) throw new AppError('Current password is incorrect', 422);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12), tokenVersion: { increment: 1 } } });
}
