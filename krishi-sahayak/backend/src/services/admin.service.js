import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { requestPasswordReset } from './auth.service.js';

const userSelect = { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true };

export async function overview() {
  const [roleCounts, activeUsers, farms, crops, listings, pendingOffers, openSupport] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.farm.count(),
    prisma.crop.count(),
    prisma.cropListing.count({ where: { status: 'ACTIVE' } }),
    prisma.buyerOffer.count({ where: { status: 'PENDING' } }),
    prisma.supportMessage.count({ where: { status: 'OPEN' } }),
  ]);
  const usersByRole = Object.fromEntries(roleCounts.map(({ role, _count }) => [role, _count._all]));
  return {
    totalUsers: Object.values(usersByRole).reduce((sum, count) => sum + count, 0),
    activeUsers,
    farmers: usersByRole.FARMER || 0,
    marketers: usersByRole.MARKETER || 0,
    admins: usersByRole.ADMIN || 0,
    farms,
    crops,
    activeListings: listings,
    pendingOffers,
    openSupport,
  };
}

export async function listUsers({ role, search, page = 1 }) {
  const where = {
    ...(role && { role }),
    ...(search && { OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ] }),
  };
  const pageSize = 50;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, pageSize };
}

export async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { ...userSelect, _count: { select: { farms: true, crops: true, bills: true, cropListings: true, buyerOffers: true } } },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function createMarketer(input) {
  const temporaryPassword = randomBytes(32).toString('base64url');
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        role: 'MARKETER',
        marketerProfile: { create: { organization: input.organization, marketLocation: input.marketLocation } },
      },
      select: userSelect,
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('An account already exists with this email', 409);
    throw error;
  }
  const invitationSent = await requestPasswordReset(user.email);
  return { user, invitationSent };
}

export async function updateUser(id, input) {
  const current = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
  if (!current) throw new AppError('User not found', 404);

  const losesActiveAdmin = current.role === 'ADMIN' && current.isActive
    && (input.role !== undefined && input.role !== 'ADMIN' || input.isActive === false);
  const roleChanged = input.role !== undefined && input.role !== current.role;
  const activeChanged = input.isActive !== undefined && input.isActive !== current.isActive;
  const update = async (tx) => {
    if (losesActiveAdmin) {
        const remainingAdmins = await tx.user.count({ where: { role: 'ADMIN', isActive: true } });
        if (remainingAdmins <= 1) throw new AppError('At least one active administrator must remain.', 409);
    }
    const data = { ...input, ...((roleChanged || activeChanged) && { tokenVersion: { increment: 1 } }) };
    if (input.role === 'FARMER') data.farmerProfile = { upsert: { create: {}, update: {} } };
    if (input.role === 'MARKETER') data.marketerProfile = { upsert: { create: {}, update: {} } };
    return tx.user.update({ where: { id }, data, select: userSelect });
  };
  try {
    return await prisma.$transaction(update, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.code === 'P2034') throw new AppError('Another administrator update is in progress. Retry this change.', 409);
    throw error;
  }
}
