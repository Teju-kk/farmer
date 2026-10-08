import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { deleteBillObject } from './bill-storage.service.js';

export async function exportAccount(userId) {
  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, createdAt: true,
      farmerProfile: true, marketerProfile: true, farms: { include: { crops: { include: { activities: true } }, soilRecords: true } },
      crops: { include: { activities: true } }, income: true, expenses: true, bills: true, documents: true,
      cropListings: true, schemeApplications: { include: { scheme: true } }, trackedSchemes: true,
      buyerOffers: { select: { id: true, listingId: true, quantity: true, price: true, message: true, status: true, createdAt: true, updatedAt: true, listing: { select: { cropName: true, variety: true, unit: true, location: true } } } },
      governmentPayments: true, notifications: true, appointments: true, transportRequests: true,
      aiConversations: { include: { messages: true } }, purchaseOrders: { include: { items: true } },
    },
  });
  if (!data) throw new AppError('Account not found', 404);
  const supportMessages = await prisma.supportMessage.findMany({ where: { email: data.email }, select: { subject: true, message: true, status: true, createdAt: true } });
  return { exportedAt: new Date().toISOString(), service: 'Krishi Sahayak', account: data, supportMessages };
}

export async function deleteAccount(userId, password) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { bills: { select: { fileUrl: true } }, supplierProfile: true, healthcareProfile: true, transportProfile: true } });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) throw new AppError('Password is incorrect', 422);
  await prisma.$transaction(async (tx) => {
    if (user.role === 'ADMIN' && user.isActive) {
      const activeAdmins = await tx.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (activeAdmins <= 1) throw new AppError('The last active administrator cannot delete this account.', 409);
    }
    if (user.supplierProfile) {
      await tx.product.updateMany({ where: { supplierId: user.supplierProfile.id }, data: { isActive: false } });
      await tx.supplier.update({ where: { id: user.supplierProfile.id }, data: { businessName: 'Closed account', contact: null, location: null, userId: null } });
    }
    if (user.healthcareProfile) await tx.healthcareProvider.update({ where: { id: user.healthcareProfile.id }, data: { name: 'Former provider', contact: '', userId: null } });
    if (user.transportProfile) await tx.transportProvider.update({ where: { id: user.transportProfile.id }, data: { name: 'Former provider', contact: '', userId: null } });
    await tx.orderItem.deleteMany({ where: { order: { buyerId: userId } } });
    await tx.order.deleteMany({ where: { buyerId: userId } });
    await tx.buyerOffer.deleteMany({ where: { buyerId: userId } });
    await tx.supportMessage.deleteMany({ where: { email: user.email } });
    await tx.user.delete({ where: { id: userId } });
  }, { isolationLevel: 'Serializable' });
  const cleanupResults = await Promise.allSettled(user.bills.map((bill) => deleteBillObject(bill.fileUrl)));
  if (cleanupResults.some((result) => result.status === 'rejected')) console.error('One or more private bill objects could not be removed after account deletion.');
}

export async function updateProfile(userId, input) {
  const user = await prisma.user.update({ where: { id: userId }, data: { name: input.name, phone: input.phone || null }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
  return user;
}
