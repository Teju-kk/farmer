import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
const include = { farm: { select: { id: true, name: true, areaUnit: true } }, activities: { orderBy: { dueDate: 'asc' } } };
export const list = (farmerId) => prisma.crop.findMany({ where: { farmerId }, include, orderBy: { createdAt: 'desc' } });
export const get = async (id, farmerId) => { const crop = await prisma.crop.findFirst({ where: { id, farmerId }, include }); if (!crop) throw new AppError('Crop not found', 404); return crop; };
export async function create(farmerId, input) { const farm = await prisma.farm.findFirst({ where: { id: input.farmId, ownerId: farmerId } }); if (!farm) throw new AppError('Farm not found', 404); return prisma.crop.create({ data: { ...input, farmerId }, include }); }
export const update = async (id, farmerId, input) => { await get(id, farmerId); return prisma.crop.update({ where: { id }, data: input, include }); };
export const remove = async (id, farmerId) => { await get(id, farmerId); await prisma.crop.delete({ where: { id } }); return { id }; };
export async function createActivity(cropId, farmerId, input) { const crop = await get(cropId, farmerId); const activity = await prisma.cropActivity.create({ data: { ...input, cropId } }); await prisma.notification.create({ data: { userId: farmerId, title: 'Field task added', message: `${input.title} · ${crop.name}`, type: 'ACTIVITY' } }); return activity; }
