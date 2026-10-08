import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { URL } from 'node:url';
import {
  ActivityStatus,
  ApplicationStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const databaseHost = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname.toLowerCase() : '';
if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DEMO_SEED !== 'true' || !['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error('Demo seeding requires NODE_ENV=development, ALLOW_DEMO_SEED=true, and a loopback PostgreSQL URL.');
}

const replaceDemoRecords = (model, where) => model.deleteMany({ where });

async function main() {
  const demoCredentials = {
    admin: { email: 'admin@krishisahayak.demo', name: 'Demo Administrator', password: randomBytes(24).toString('base64url') },
    farmer: { email: 'farmer@krishisahayak.demo', name: 'Ananya Gowda', password: randomBytes(24).toString('base64url') },
    marketer: { email: 'marketer@krishisahayak.demo', name: 'FreshMart Marketer', password: randomBytes(24).toString('base64url') },
  };
  const hashes = Object.fromEntries(await Promise.all(Object.entries(demoCredentials).map(async ([key, value]) => [key, await bcrypt.hash(value.password, 12)])));

  const farmer = await prisma.user.upsert({
    where: { email: demoCredentials.farmer.email },
    update: { name: demoCredentials.farmer.name, passwordHash: hashes.farmer, role: UserRole.FARMER, isActive: true },
    create: {
      name: demoCredentials.farmer.name,
      email: demoCredentials.farmer.email,
      phone: '+919900000001',
      passwordHash: hashes.farmer,
      role: UserRole.FARMER,
      farmerProfile: {
        create: {
          district: 'Mandya',
          state: 'Karnataka',
          preferredLanguage: 'en',
        },
      },
      cart: { create: {} },
    },
  });

  const marketer = await prisma.user.upsert({
    where: { email: demoCredentials.marketer.email },
    update: { name: demoCredentials.marketer.name, passwordHash: hashes.marketer, role: UserRole.MARKETER, isActive: true },
    create: {
      name: demoCredentials.marketer.name,
      email: demoCredentials.marketer.email,
      phone: '+919900000002',
      passwordHash: hashes.marketer,
      role: UserRole.MARKETER,
      marketerProfile: { create: { organization: 'FreshMart Demo', marketLocation: 'Mandya' } },
    },
  });
  const buyer = marketer;

  await prisma.user.upsert({
    where: { email: demoCredentials.admin.email },
    update: { name: demoCredentials.admin.name, passwordHash: hashes.admin, role: UserRole.ADMIN, isActive: true },
    create: {
      name: demoCredentials.admin.name,
      email: demoCredentials.admin.email,
      passwordHash: hashes.admin,
      role: UserRole.ADMIN,
    },
  });

  const farm = await prisma.farm.upsert({
    where: { id: 'demo-farm-green-valley' },
    update: {},
    create: {
      id: 'demo-farm-green-valley',
      ownerId: farmer.id,
      name: 'Green Valley Farm',
      area: 4.5,
      areaUnit: 'acres',
      location: 'Near Maddur Road',
      district: 'Mandya',
      state: 'Karnataka',
      soilType: 'Red loam',
      irrigationType: 'Drip',
      latitude: 12.5218,
      longitude: 76.8951,
    },
  });

  const crop = await prisma.crop.upsert({
    where: { id: 'demo-crop-tomato' },
    update: {},
    create: {
      id: 'demo-crop-tomato',
      farmerId: farmer.id,
      farmId: farm.id,
      name: 'Tomato',
      variety: 'Arka Rakshak',
      area: 1.5,
      status: 'GROWING',
      sowingDate: new Date('2026-08-15'),
      expectedHarvestDate: new Date('2026-11-20'),
      notes: 'Demo crop data for development.',
    },
  });

  await replaceDemoRecords(prisma.cropActivity, {
    cropId: crop.id,
    status: ActivityStatus.PENDING,
    title: 'Irrigation',
    description: 'Check drip lines and irrigate for 45 minutes.',
  });
  await replaceDemoRecords(prisma.cropActivity, {
    cropId: crop.id,
    status: ActivityStatus.PENDING,
    title: 'Pest monitoring',
    description: 'Inspect leaves and stems; record observations only.',
  });

  await prisma.cropActivity.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-activity-tomato-irrigation',
        cropId: crop.id,
        title: 'Irrigation',
        description: 'Check drip lines and irrigate for 45 minutes.',
        dueDate: new Date('2026-09-12'),
        status: ActivityStatus.PENDING,
      },
      {
        id: 'demo-activity-tomato-pest-check',
        cropId: crop.id,
        title: 'Pest monitoring',
        description: 'Inspect leaves and stems; record observations only.',
        dueDate: new Date('2026-09-18'),
        status: ActivityStatus.PENDING,
      },
    ],
  });

  await prisma.soilRecord.upsert({
    where: { id: 'demo-soil-record' },
    update: {},
    create: {
      id: 'demo-soil-record',
      farmId: farm.id,
      ph: 6.8,
      nitrogen: 42,
      phosphorus: 18,
      potassium: 31,
      notes: 'Seeded demo soil record.',
    },
  });

  const seedsCategory = await prisma.category.upsert({
    where: { name: 'Seeds' },
    update: {},
    create: { name: 'Seeds', description: 'Demo seed products' },
  });

  const fertilizerCategory = await prisma.category.upsert({
    where: { name: 'Fertilizers' },
    update: {},
    create: { name: 'Fertilizers', description: 'Demo fertilizer products' },
  });

  const supplier = await prisma.supplier.upsert({
    where: { userId: marketer.id },
    update: {},
    create: {
      userId: marketer.id,
      businessName: 'Mandya Green Inputs',
      contact: '+919900000003',
      location: 'Mandya',
    },
  });

  await prisma.product.upsert({
    where: { id: 'demo-product-tomato-seed' },
    update: {},
    create: {
      id: 'demo-product-tomato-seed',
      supplierId: supplier.id,
      categoryId: seedsCategory.id,
      name: 'Tomato Seeds - Demo Pack',
      description: 'Seeded demo product. Not a live stock guarantee.',
      price: 480,
      unit: 'packet',
      stock: 50,
      cropSuitability: 'Tomato',
      inventory: { create: { quantity: 50 } },
    },
  });

  await prisma.product.upsert({
    where: { id: 'demo-product-organic-fertilizer' },
    update: {},
    create: {
      id: 'demo-product-organic-fertilizer',
      supplierId: supplier.id,
      categoryId: fertilizerCategory.id,
      name: 'Organic Fertilizer - Demo Bag',
      description: 'Seeded demo product for development workflows.',
      price: 850,
      unit: '50 kg bag',
      stock: 25,
      cropSuitability: 'Vegetables',
      inventory: { create: { quantity: 25 } },
    },
  });

  const listing = await prisma.cropListing.upsert({
    where: { id: 'demo-listing-tomato' },
    update: {},
    create: {
      id: 'demo-listing-tomato',
      farmerId: farmer.id,
      cropId: crop.id,
      cropName: 'Tomato',
      variety: 'Arka Rakshak',
      quantity: 800,
      unit: 'kg',
      expectedPrice: 24,
      grade: 'A',
      harvestDate: new Date('2026-11-20'),
      location: 'Mandya',
      description: 'Demo listing; not a real active sale.',
      imageUrls: [],
    },
  });

  await prisma.buyerOffer.upsert({
    where: { id: 'demo-offer-tomato' },
    update: {},
    create: {
      id: 'demo-offer-tomato',
      buyerId: buyer.id,
      listingId: listing.id,
      quantity: 500,
      price: 22,
      message: 'Demo buyer offer for workflow testing.',
    },
  });

  await prisma.marketPrice.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-market-price-tomato',
        crop: 'Tomato',
        market: 'Mandya APMC',
        location: 'Mandya',
        date: new Date('2026-09-01'),
        minPrice: 18,
        maxPrice: 28,
        modalPrice: 23,
        unit: 'kg',
        source: 'Seeded demo data',
      },
      {
        id: 'demo-market-price-maize',
        crop: 'Maize',
        market: 'Mandya APMC',
        location: 'Mandya',
        date: new Date('2026-09-01'),
        minPrice: 19,
        maxPrice: 24,
        modalPrice: 21,
        unit: 'kg',
        source: 'Seeded demo data',
      },
    ],
  });

  await replaceDemoRecords(prisma.income, {
    farmerId: farmer.id,
    source: 'Crop sale',
    amount: 128400,
    description: 'Demo income record.',
  });
  await replaceDemoRecords(prisma.expense, {
    farmerId: farmer.id,
    category: 'Seeds',
    amount: 4200,
    description: 'Demo tomato seeds expense.',
  });
  await replaceDemoRecords(prisma.expense, {
    farmerId: farmer.id,
    category: 'Irrigation',
    amount: 3100,
    description: 'Demo irrigation expense.',
  });

  await prisma.income.upsert({
    where: { id: 'demo-income-crop-sale' },
    update: {},
    create: {
      id: 'demo-income-crop-sale',
      farmerId: farmer.id,
      cropId: crop.id,
      source: 'Crop sale',
      amount: 128400,
      date: new Date('2026-09-05'),
      description: 'Demo income record.',
    },
  });

  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-expense-seeds',
        farmerId: farmer.id,
        cropId: crop.id,
        farmId: farm.id,
        category: 'Seeds',
        amount: 4200,
        date: new Date('2026-08-14'),
        description: 'Demo tomato seeds expense.',
      },
      {
        id: 'demo-expense-irrigation',
        farmerId: farmer.id,
        cropId: crop.id,
        farmId: farm.id,
        category: 'Irrigation',
        amount: 3100,
        date: new Date('2026-08-25'),
        description: 'Demo irrigation expense.',
      },
    ],
  });

  const scheme = await prisma.governmentScheme.upsert({
    where: { id: 'demo-scheme-karnataka-support' },
    update: {},
    create: {
      id: 'demo-scheme-karnataka-support',
      name: 'Demo Farmer Support Scheme',
      description: 'Seeded development record; verify official sources before applying.',
      eligibility: 'Potentially relevant based on the information provided. Final eligibility is determined by the relevant authority.',
      benefits: 'Demo benefit information.',
      requiredDocuments: 'Identity proof, land records, and bank details.',
      applicationProcess: 'Contact the relevant authority or official portal.',
      officialSource: 'https://example.gov.in',
      deadline: new Date('2026-12-31'),
      state: 'Karnataka',
    },
  });

  await prisma.schemeApplication.upsert({
    where: { farmerId_schemeId: { farmerId: farmer.id, schemeId: scheme.id } },
    update: {},
    create: {
      farmerId: farmer.id,
      schemeId: scheme.id,
      status: ApplicationStatus.APPLIED,
      notes: 'Demo application status.',
    },
  });

  await prisma.governmentPayment.upsert({
    where: { id: 'demo-government-payment' },
    update: {},
    create: {
      id: 'demo-government-payment',
      farmerId: farmer.id,
      schemeId: scheme.id,
      schemeName: scheme.name,
      amount: 2000,
      date: new Date('2026-09-08'),
      reference: 'Demo payment tracking record.',
      status: 'RECEIVED',
    },
  });

  await prisma.weatherRecord.upsert({
    where: { id: 'demo-weather-record' },
    update: {},
    create: {
      id: 'demo-weather-record',
      location: 'Mandya',
      temperature: 28,
      humidity: 68,
      rainProbability: 15,
      wind: 11,
      condition: 'Partly cloudy',
      forecast: {
        label: 'Seeded demo forecast',
        days: [
          { date: '2026-09-12', condition: 'Cloudy', rainProbability: 22 },
          { date: '2026-09-13', condition: 'Sunny', rainProbability: 8 },
        ],
      },
    },
  });

  await prisma.healthcareProvider.upsert({
    where: { id: 'demo-healthcare-provider' },
    update: {},
    create: {
      id: 'demo-healthcare-provider',
      name: 'Mandya Rural Health Clinic',
      specialization: 'General medicine',
      location: 'Mandya',
      contact: '+918000000001',
      availability: 'Mon-Sat, 9 AM - 5 PM',
    },
  });

  const transportProvider = await prisma.transportProvider.upsert({
    where: { id: 'demo-transport-provider' },
    update: {},
    create: {
      id: 'demo-transport-provider',
      name: 'Cauvery Farm Logistics',
      vehicleType: 'Mini truck',
      capacity: '2 tons',
      serviceArea: 'Mandya and Mysuru',
      contact: '+918000000002',
      approximatePrice: 2500,
    },
  });

  await prisma.transportRequest.upsert({
    where: { id: 'demo-transport-request' },
    update: {},
    create: {
      id: 'demo-transport-request',
      farmerId: farmer.id,
      providerId: transportProvider.id,
      cropId: crop.id,
      cropName: crop.name,
      quantity: 800,
      pickup: 'Green Valley Farm, Mandya',
      destination: 'Mandya APMC',
      scheduledDate: new Date('2026-11-21T07:00:00+05:30'),
      notes: 'Demo transport request.',
    },
  });

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-notification-activity',
        userId: farmer.id,
        title: 'Crop activity reminder',
        message: 'Irrigation is due for Tomato tomorrow.',
        type: 'CROP_ACTIVITY',
      },
      {
        id: 'demo-notification-scheme',
        userId: farmer.id,
        title: 'Government scheme update',
        message: 'Demo scheme application status was updated.',
        type: 'GOVERNMENT_SCHEME',
      },
    ],
  });

  await prisma.aIConversation.upsert({
    where: { id: 'demo-ai-conversation' },
    update: {},
    create: {
      id: 'demo-ai-conversation',
      userId: farmer.id,
      title: 'Demo assistant conversation',
      messages: {
        create: [
          {
            role: 'user',
            content: 'How much did I spend on irrigation?',
          },
          {
            role: 'assistant',
            content: 'This is demo data. Your irrigation expense record shows INR 3,100.',
            metadata: { source: 'user-specific-demo-data' },
          },
        ],
      },
    },
  });

  await prisma.review.upsert({
    where: { id: 'demo-review' },
    update: {},
    create: {
      id: 'demo-review',
      userId: farmer.id,
      rating: 5,
      content: 'Demo review for development.',
    },
  });

  await prisma.complaint.upsert({
    where: { id: 'demo-complaint' },
    update: {},
    create: {
      id: 'demo-complaint',
      userId: buyer.id,
      subject: 'Demo complaint',
      description: 'Seeded complaint record for admin workflows.',
    },
  });

  console.log('Seeded local demo data and accounts. These temporary credentials are development-only:');
  for (const [role, account] of Object.entries(demoCredentials)) console.log(`${role.toUpperCase()}: ${account.email} / ${account.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
