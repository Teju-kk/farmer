import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export const listProducts = (query = {}) => prisma.product.findMany({ where: { isActive: true, ...(query.category && { category: { name: { equals: query.category, mode: 'insensitive' } } }), ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }) }, include: { category: true, supplier: { select: { businessName: true, location: true } } }, orderBy: { createdAt: 'desc' } });
export const listCategories = () => prisma.category.findMany({ orderBy: { name: 'asc' } });
export const listFarmerListings = (farmerId) => prisma.cropListing.findMany({ where: { farmerId }, include: { crop: { select: { id: true, farm: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } });
export async function createFarmerListing(farmerId, input) {
  if (input.cropId && !await prisma.crop.findFirst({ where: { id: input.cropId, farmerId } })) throw new AppError('Crop not found', 404);
  const listing = await prisma.cropListing.create({ data: { ...input, farmerId, imageUrls: [] } });
  await prisma.notification.create({ data: { userId: farmerId, title: 'Harvest listing created', message: `${listing.cropName} listing is saved in your workspace.`, type: 'MARKETPLACE' } });
  return listing;
}
export async function deleteFarmerListing(farmerId, listingId) {
  const result = await prisma.cropListing.deleteMany({ where: { id: listingId, farmerId } });
  if (!result.count) throw new AppError('Listing not found', 404);
  return { id: listingId };
}

export async function marketerSummary(marketerId) {
  const [activeListings, offers, pendingOffers] = await Promise.all([
    prisma.cropListing.count({ where: { status: 'ACTIVE', farmerId: { not: marketerId } } }),
    prisma.buyerOffer.count({ where: { buyerId: marketerId } }),
    prisma.buyerOffer.count({ where: { buyerId: marketerId, status: 'PENDING' } }),
  ]);
  return { activeListings, offers, pendingOffers };
}

export const getMarketerProfile = (userId) => prisma.marketerProfile.upsert({ where: { userId }, update: {}, create: { userId } });
export const updateMarketerProfile = async (userId, input) => {
  await prisma.marketerProfile.upsert({ where: { userId }, update: input, create: { userId, ...input } });
  return getMarketerProfile(userId);
};

export const marketListings = (marketerId) => prisma.cropListing.findMany({
  where: { status: 'ACTIVE', farmerId: { not: marketerId } },
  select: { id: true, cropName: true, variety: true, quantity: true, unit: true, expectedPrice: true, grade: true, harvestDate: true, location: true, description: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
  take: 100,
});

export const marketerOffers = (marketerId) => prisma.buyerOffer.findMany({
  where: { buyerId: marketerId },
  select: { id: true, quantity: true, price: true, message: true, status: true, createdAt: true, updatedAt: true, listing: { select: { id: true, cropName: true, variety: true, unit: true, location: true, status: true } } },
  orderBy: { createdAt: 'desc' },
  take: 100,
});

export async function createOffer(marketerId, listingId, input) {
  try {
    return await prisma.$transaction(async (tx) => {
      const listing = await tx.cropListing.findFirst({ where: { id: listingId, status: 'ACTIVE', farmerId: { not: marketerId } }, select: { id: true, farmerId: true, cropName: true, quantity: true } });
      if (!listing) throw new AppError('This market listing is no longer available.', 404);
      if (input.quantity > Number(listing.quantity)) throw new AppError('Offer quantity cannot exceed the listed harvest quantity.', 422);
      const existing = await tx.buyerOffer.findFirst({ where: { listingId, buyerId: marketerId, status: 'PENDING' }, select: { id: true } });
      if (existing) throw new AppError('You already have a pending offer for this listing.', 409);
      const offer = await tx.buyerOffer.create({ data: { buyerId: marketerId, listingId, quantity: input.quantity, price: input.price, message: input.message } });
      await tx.notification.create({ data: { userId: listing.farmerId, title: 'New market offer', message: `A marketer sent an offer for ${listing.cropName}.`, type: 'MARKETPLACE' } });
      return offer;
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.code === 'P2034') throw new AppError('An offer is already pending or the listing changed. Refresh and try again.', 409);
    throw error;
  }
}

export const farmerOffers = (farmerId) => prisma.buyerOffer.findMany({
  where: { listing: { farmerId } },
  select: {
    id: true, quantity: true, price: true, message: true, status: true, createdAt: true,
    listing: { select: { id: true, cropName: true, variety: true, unit: true, location: true, status: true } },
    buyer: { select: { name: true, marketerProfile: { select: { organization: true, marketLocation: true } } } },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});

export async function respondToOffer(farmerId, offerId, status) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.buyerOffer.findFirst({ where: { id: offerId, listing: { farmerId } }, select: { id: true, buyerId: true, listingId: true, status: true, listing: { select: { cropName: true } } } });
    if (!offer) throw new AppError('Offer not found', 404);
    if (offer.status !== 'PENDING') throw new AppError('This offer has already been answered.', 409);

    if (status === 'ACCEPTED') {
      const listingChange = await tx.cropListing.updateMany({ where: { id: offer.listingId, farmerId, status: 'ACTIVE' }, data: { status: 'NEGOTIATING' } });
      if (!listingChange.count) throw new AppError('This listing is no longer accepting offers.', 409);
    }
    const changed = await tx.buyerOffer.updateMany({ where: { id: offer.id, status: 'PENDING' }, data: { status } });
    if (!changed.count) throw new AppError('This offer has already been answered.', 409);

    if (status === 'ACCEPTED') {
      const otherOffers = await tx.buyerOffer.findMany({ where: { listingId: offer.listingId, id: { not: offer.id }, status: 'PENDING' }, select: { buyerId: true } });
      await tx.buyerOffer.updateMany({ where: { listingId: offer.listingId, id: { not: offer.id }, status: 'PENDING' }, data: { status: 'REJECTED' } });
      if (otherOffers.length) await tx.notification.createMany({ data: otherOffers.map(({ buyerId }) => ({ userId: buyerId, title: 'Listing update', message: `The ${offer.listing.cropName} listing is no longer accepting offers.`, type: 'MARKETPLACE' })) });
    }
    await tx.notification.create({ data: { userId: offer.buyerId, title: `Offer ${status.toLowerCase()}`, message: `Your offer for ${offer.listing.cropName} was ${status.toLowerCase()}.`, type: 'MARKETPLACE' } });
    return { id: offer.id, status };
  }, { isolationLevel: 'Serializable' }).catch((error) => {
    if (error instanceof AppError) throw error;
    if (error.code === 'P2034') throw new AppError('Another response is being processed for this listing. Refresh and try again.', 409);
    throw error;
  });
}

export async function cart(userId) { const found = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: { include: { supplier: { select: { businessName: true, location: true } } } } } } } }); return found || { id: null, items: [] }; }
export async function addToCart(userId, productId, quantity) {
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError('Product not found', 404);
  const userCart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
  const key = { cartId_productId: { cartId: userCart.id, productId } };
  const existing = await prisma.cartItem.findUnique({ where: key });
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) throw new AppError('Requested quantity exceeds available stock', 422);
  await prisma.cartItem.upsert({ where: key, update: { quantity: nextQuantity }, create: { cartId: userCart.id, productId, quantity: nextQuantity } });
  return cart(userId);
}
export async function removeFromCart(userId, productId) {
  const userCart = await prisma.cart.findUnique({ where: { userId } });
  if (!userCart) throw new AppError('Cart item not found', 404);
  const result = await prisma.cartItem.deleteMany({ where: { cartId: userCart.id, productId } });
  if (!result.count) throw new AppError('Cart item not found', 404);
  return cart(userId);
}
export async function checkout(userId) {
  const userCart = await cart(userId);
  if (!userCart.id || userCart.items.length === 0) throw new AppError('Your cart is empty', 422);
  return prisma.$transaction(async (tx) => {
    const orderItems = [];
    let total = 0;
    for (const item of userCart.items) {
      const product = await tx.product.findFirst({ where: { id: item.productId, isActive: true } });
      const changed = product && await tx.product.updateMany({ where: { id: item.productId, isActive: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
      if (!changed?.count) throw new AppError(`${item.product.name} no longer has enough stock`, 422);
      total += Number(product.price) * item.quantity;
      orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price });
    }
    const order = await tx.order.create({ data: { orderNumber: `KS-${randomUUID()}`, buyerId: userId, total, items: { create: orderItems } }, include: { items: { include: { product: true } } } });
    await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
    return order;
  });
}
