import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { prisma } from '../config/prisma.js';
export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError('Authentication is required', 401));
  let claims;
  try { claims = jwt.verify(token, env.jwtSecret); } catch { return next(new AppError('Invalid or expired token', 401)); }
  try {
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, role: true, isActive: true, tokenVersion: true } });
    if (!user?.isActive || (claims.ver ?? 0) !== user.tokenVersion) return next(new AppError('Your session has expired. Please sign in again.', 401));
    req.user = { sub: user.id, role: user.role };
    next();
  } catch (error) { next(error); }
}
export const requireRole = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : next(new AppError('You do not have permission for this action', 403));
export const authorize = requireRole;
