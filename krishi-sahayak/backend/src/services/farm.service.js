import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export const list = (ownerId) => prisma.farm.findMany({ where: { ownerId }, include: { crops: true }, orderBy: { createdAt: 'desc' } });
export const get = async (id, ownerId) => { const farm = await prisma.farm.findUnique({ where: { id }, include: { crops: true, soilRecords: true } }); if (!farm || farm.ownerId !== ownerId) throw new AppError('Farm not found', 404); return farm; };
export const create = (ownerId, input) => prisma.farm.create({ data: { ...input, ownerId } });
export const update = async (id, ownerId, input) => { await get(id, ownerId); return prisma.farm.update({ where: { id }, data: input }); };
export const remove = async (id, ownerId) => { await get(id, ownerId); await prisma.farm.delete({ where: { id } }); return { id }; };
