import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
export const listIncome = (farmerId) => prisma.income.findMany({ where: { farmerId }, include: { crop: { select: { name: true } } }, orderBy: { date: 'desc' } });
export const listExpenses = (farmerId) => prisma.expense.findMany({ where: { farmerId }, include: { crop: { select: { name: true } }, farm: { select: { name: true } } }, orderBy: { date: 'desc' } });
export async function createIncome(farmerId, input) { if (input.cropId && !await prisma.crop.findFirst({ where: { id: input.cropId, farmerId } })) throw new AppError('Crop not found', 404); const record = await prisma.income.create({ data: { ...input, farmerId } }); await prisma.notification.create({ data: { userId: farmerId, title: 'Income recorded', message: `${input.source}: ₹${Number(input.amount).toLocaleString('en-IN')}`, type: 'FINANCE' } }); return record; }
export async function createExpense(farmerId, input) {
  if (input.cropId && !await prisma.crop.findFirst({ where: { id: input.cropId, farmerId } })) throw new AppError('Crop not found', 404);
  if (input.farmId && !await prisma.farm.findFirst({ where: { id: input.farmId, ownerId: farmerId } })) throw new AppError('Farm not found', 404);
  if (input.cropId && input.farmId && !await prisma.crop.findFirst({ where: { id: input.cropId, farmId: input.farmId, farmerId } })) throw new AppError('Crop does not belong to this farm', 422);
  const record = await prisma.expense.create({ data: { ...input, farmerId } });
  await prisma.notification.create({ data: { userId: farmerId, title: 'Expense recorded', message: `${input.category}: ₹${Number(input.amount).toLocaleString('en-IN')}`, type: 'FINANCE' } });
  return record;
}
export async function summary(farmerId) { const [income, expenses] = await Promise.all([prisma.income.aggregate({ where: { farmerId }, _sum: { amount: true } }), prisma.expense.aggregate({ where: { farmerId }, _sum: { amount: true } })]); const totalIncome = Number(income._sum.amount || 0); const totalExpenses = Number(expenses._sum.amount || 0); return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses }; }
