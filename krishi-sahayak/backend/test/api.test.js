import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server;
  let baseUrl;

before(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('API integration tests must not run against production.');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe('API public and access boundaries', () => {
  it('reports healthy status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, 'ok');
  });

  it('allows Vite on an alternate localhost port during development', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5174', 'Access-Control-Request-Method': 'GET' },
    });
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  });

  it('rejects access to account and farmer resources without a session', async () => {
    for (const path of ['/account/export', '/bills', '/notifications', '/schemes', '/weather']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, `${path} must require authentication`);
    }
  });

  it('keeps roles server-authoritative and enforces role boundaries and marketplace ownership', async () => {
    const password = 'RBAC-Test-Password-42';
    const fixtures = [];
    const offerIds = [];
    const listingIds = [];
    async function makeUser(role) {
      const user = await prisma.user.create({
        data: {
          name: `RBAC ${role}`,
          email: `${role.toLowerCase()}-${randomUUID()}@example.invalid`,
          passwordHash: await bcrypt.hash(password, 4),
          role,
          ...(role === 'FARMER' && { farmerProfile: { create: {} } }),
          ...(role === 'MARKETER' && { marketerProfile: { create: { organization: 'Test Market' } } }),
        },
      });
      fixtures.push(user.id);
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password }),
      });
      assert.equal(response.status, 200);
      const result = (await response.json()).data;
      assert.equal(result.user.role, role);
      return { id: user.id, token: result.token, user: result.user };
    }

    try {
      const publicRegistration = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Role Forgery Test', email: `forge-${randomUUID()}@example.invalid`, password, role: 'ADMIN' }),
      });
      assert.equal(publicRegistration.status, 201);
      const publicAccount = (await publicRegistration.json()).data;
      fixtures.push(publicAccount.user.id);
      assert.equal(publicAccount.user.role, 'FARMER');
      assert.equal((await prisma.user.findUnique({ where: { id: publicAccount.user.id } })).role, 'FARMER');

      const farmer = await makeUser('FARMER');
      const marketer = await makeUser('MARKETER');
      const admin = await makeUser('ADMIN');
      const roleChangeTarget = await makeUser('FARMER');
      const auth = (account) => ({ Authorization: `Bearer ${account.token}` });

      for (const account of [farmer, marketer]) {
        const response = await fetch(`${baseUrl}/admin/overview`, { headers: auth(account) });
        assert.equal(response.status, 403);
      }
      assert.equal((await fetch(`${baseUrl}/admin/overview`)).status, 401);
      assert.equal((await fetch(`${baseUrl}/admin/overview`, { headers: auth(admin) })).status, 200);

      assert.equal((await fetch(`${baseUrl}/farms`, { headers: auth(farmer) })).status, 200);
      assert.equal((await fetch(`${baseUrl}/farms`, { headers: auth(marketer) })).status, 403);
      assert.equal((await fetch(`${baseUrl}/marketer/summary`, { headers: auth(marketer) })).status, 200);
      assert.equal((await fetch(`${baseUrl}/marketer/summary`, { headers: auth(farmer) })).status, 403);
      assert.equal((await fetch(`${baseUrl}/marketer/summary`, { headers: auth(admin) })).status, 403);
      assert.equal((await fetch(`${baseUrl}/bills`, { headers: auth(marketer) })).status, 403);

      const forgedProfile = await fetch(`${baseUrl}/account/profile`, {
        method: 'PATCH', headers: { ...auth(farmer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'RBAC FARMER', role: 'ADMIN' }),
      });
      assert.equal(forgedProfile.status, 200);
      assert.equal((await forgedProfile.json()).data.role, 'FARMER');
      const forgedAdminChange = await fetch(`${baseUrl}/admin/users/${farmer.id}`, {
        method: 'PATCH', headers: { ...auth(admin), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN' }),
      });
      assert.equal(forgedAdminChange.status, 422);

      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        const marketerCreation = await fetch(`${baseUrl}/admin/marketers`, {
          method: 'POST', headers: { ...auth(admin), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Created by Admin', email: `created-marketer-${randomUUID()}@example.invalid`, organization: 'Test Market' }),
        });
        assert.equal(marketerCreation.status, 201);
        const createdMarketer = (await marketerCreation.json()).data;
        assert.equal(createdMarketer.user.role, 'MARKETER');
        assert.equal(createdMarketer.invitationSent, false);
        fixtures.push(createdMarketer.user.id);
      }

      const roleChange = await fetch(`${baseUrl}/admin/users/${roleChangeTarget.id}`, {
        method: 'PATCH', headers: { ...auth(admin), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'MARKETER' }),
      });
      assert.equal(roleChange.status, 200);
      assert.equal((await fetch(`${baseUrl}/farms`, { headers: auth(roleChangeTarget) })).status, 401);
      const roleChangeLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: roleChangeTarget.user.email, password }),
      });
      assert.equal((await roleChangeLogin.json()).data.user.role, 'MARKETER');

      const farmResponse = await fetch(`${baseUrl}/farms`, {
        method: 'POST', headers: { ...auth(farmer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Private Test Farm', area: 2, areaUnit: 'acres' }),
      });
      assert.equal(farmResponse.status, 201);
      const farmId = (await farmResponse.json()).data.id;
      assert.equal((await fetch(`${baseUrl}/farms/${farmId}`, { headers: auth(marketer) })).status, 403);

      const cropResponse = await fetch(`${baseUrl}/crops`, {
        method: 'POST', headers: { ...auth(farmer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Millet', farmId, area: 1, sowingDate: new Date().toISOString() }),
      });
      assert.equal(cropResponse.status, 201);
      const cropId = (await cropResponse.json()).data.id;
      assert.equal((await fetch(`${baseUrl}/crops/${cropId}`, { headers: auth(publicAccount) })).status, 404);
      const publicLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: publicAccount.user.email, password }),
      });
      const publicToken = (await publicLogin.json()).data.token;
      const otherFarmerHeaders = { Authorization: `Bearer ${publicToken}` };
      assert.equal((await fetch(`${baseUrl}/farms/${farmId}`, { headers: otherFarmerHeaders })).status, 404);
      assert.equal((await fetch(`${baseUrl}/crops/${cropId}`, { headers: otherFarmerHeaders })).status, 404);

      const listingResponse = await fetch(`${baseUrl}/listings`, {
        method: 'POST', headers: { ...auth(farmer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropName: 'Test Millet', quantity: 12, unit: 'kg', expectedPrice: 40, location: 'Mandya' }),
      });
      assert.equal(listingResponse.status, 201);
      const listingId = (await listingResponse.json()).data.id;
      listingIds.push(listingId);
      const marketResponse = await fetch(`${baseUrl}/marketer/listings`, { headers: auth(marketer) });
      assert.equal(marketResponse.status, 200);
      const marketListing = (await marketResponse.json()).data.find((entry) => entry.id === listingId);
      assert.ok(marketListing);
      assert.equal(Object.hasOwn(marketListing, 'farmerId'), false);
      const offerResponse = await fetch(`${baseUrl}/marketer/listings/${listingId}/offers`, {
        method: 'POST', headers: { ...auth(marketer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2, price: 42, message: 'Test offer' }),
      });
      assert.equal(offerResponse.status, 201);
      const offer = (await offerResponse.json()).data;
      offerIds.push(offer.id);
      const duplicateOffer = await fetch(`${baseUrl}/marketer/listings/${listingId}/offers`, {
        method: 'POST', headers: { ...auth(marketer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2, price: 42, message: 'Duplicate test' }),
      });
      assert.equal(duplicateOffer.status, 409);
      const offersForFarmer = await fetch(`${baseUrl}/farmer/offers`, { headers: auth(farmer) });
      assert.equal((await offersForFarmer.json()).data.some((entry) => entry.id === offer.id), true);
      const marketerExportResponse = await fetch(`${baseUrl}/account/export`, { headers: auth(marketer) });
      assert.equal(marketerExportResponse.status, 200);
      const marketerExport = await marketerExportResponse.json();
      assert.equal(marketerExport.account.role, 'MARKETER');
      assert.equal(marketerExport.account.marketerProfile.organization, 'Test Market');
      assert.equal(marketerExport.account.buyerOffers.some((entry) => entry.id === offer.id), true);
      const offersForOther = await fetch(`${baseUrl}/farmer/offers`, { headers: otherFarmerHeaders });
      assert.equal((await offersForOther.json()).data.some((entry) => entry.id === offer.id), false);
      const otherFarmerResponse = await fetch(`${baseUrl}/farmer/offers/${offer.id}`, {
        method: 'PATCH', headers: { ...otherFarmerHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      assert.equal(otherFarmerResponse.status, 404);
      const marketerOfferResponse = await fetch(`${baseUrl}/farmer/offers/${offer.id}`, {
        method: 'PATCH', headers: { ...auth(marketer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      assert.equal(marketerOfferResponse.status, 403);
      const answer = await fetch(`${baseUrl}/farmer/offers/${offer.id}`, {
        method: 'PATCH', headers: { ...auth(farmer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      assert.equal(answer.status, 200);
      assert.equal((await fetch(`${baseUrl}/farmer/offers`, { headers: auth(marketer) })).status, 403);
      const marketerDeletion = await fetch(`${baseUrl}/account`, {
        method: 'DELETE', headers: { ...auth(marketer), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      assert.equal(marketerDeletion.status, 200);
      assert.equal(await prisma.buyerOffer.findUnique({ where: { id: offer.id } }), null);
    } finally {
      if (offerIds.length) await prisma.buyerOffer.deleteMany({ where: { id: { in: offerIds } } });
      if (listingIds.length) await prisma.cropListing.deleteMany({ where: { id: { in: listingIds } } });
      if (fixtures.length) await prisma.user.deleteMany({ where: { id: { in: fixtures } } });
    }
  });

  it('validates registration before database access', async () => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', email: 'invalid', password: 'short' }),
    });
    assert.equal(response.status, 422);
  });

  it('supports registration, account export, deletion, and revokes the deleted session', async () => {
    const email = `api-test-${randomUUID()}@example.invalid`;
    let password = 'Temporary-Test-Password-42';
    let token;
    let userId;
    let billId;
    let otherUserId;
    try {
      const registration = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Test Farmer', email, password }),
      });
      assert.equal(registration.status, 201);
      const registered = await registration.json();
      token = registered.data.token;
      userId = registered.data.user.id;
      let headers = { Authorization: `Bearer ${token}` };

      if (!process.env.AI_API_KEY) {
        const unavailableAssistant = await fetch(`${baseUrl}/assistant`, {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'How should I plan irrigation?', locale: 'en' }),
        });
        assert.equal(unavailableAssistant.status, 503);
        assert.match((await unavailableAssistant.json()).message, /not configured/i);
      }

      const rawResetToken = randomUUID();
      await prisma.passwordResetToken.create({ data: { userId, tokenHash: createHash('sha256').update(rawResetToken).digest('hex'), expiresAt: new Date(Date.now() + 60_000) } });
      password = 'Reset-Test-Password-43';
      const reset = await fetch(`${baseUrl}/auth/password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawResetToken, password }),
      });
      assert.equal(reset.status, 200);
      const reusedReset = await fetch(`${baseUrl}/auth/password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawResetToken, password }),
      });
      assert.equal(reusedReset.status, 400);
      const expiredToken = randomUUID();
      await prisma.passwordResetToken.create({ data: { userId, tokenHash: createHash('sha256').update(expiredToken).digest('hex'), expiresAt: new Date(Date.now() - 60_000) } });
      const expiredReset = await fetch(`${baseUrl}/auth/password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: expiredToken, password }),
      });
      assert.equal(expiredReset.status, 400);
      const staleSession = await fetch(`${baseUrl}/auth/me`, { headers });
      assert.equal(staleSession.status, 401);
      const login = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(login.status, 200);
      token = (await login.json()).data.token;
      headers = { Authorization: `Bearer ${token}` };

      const exported = await fetch(`${baseUrl}/account/export`, { headers });
      assert.equal(exported.status, 200);
      const exportData = await exported.json();
      assert.equal(exportData.account.id, userId);
      assert.ok(Array.isArray(exportData.account.farms));

      const billUpload = await fetch(`${baseUrl}/bills`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'bill.pdf', contentBase64: Buffer.from('%PDF-1.7\nTest bill').toString('base64') }),
      });
      assert.equal(billUpload.status, 201);
      billId = (await billUpload.json()).data.id;
      const otherRegistration = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Other API Farmer', email: `other-${randomUUID()}@example.invalid`, password }),
      });
      assert.equal(otherRegistration.status, 201);
      const otherAccount = (await otherRegistration.json()).data;
      otherUserId = otherAccount.user.id;
      const otherBillDownload = await fetch(`${baseUrl}/bills/${billId}/file`, { headers: { Authorization: `Bearer ${otherAccount.token}` } });
      assert.equal(otherBillDownload.status, 404);
      const billDownload = await fetch(`${baseUrl}/bills/${billId}/file`, { headers });
      assert.equal(billDownload.status, 200);
      assert.equal(Buffer.from(await billDownload.arrayBuffer()).toString(), '%PDF-1.7\nTest bill');
      const billDelete = await fetch(`${baseUrl}/bills/${billId}`, { method: 'DELETE', headers });
      assert.equal(billDelete.status, 200);
      const otherDeletion = await fetch(`${baseUrl}/account`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${otherAccount.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      assert.equal(otherDeletion.status, 200);

      if (!process.env.RESEND_API_KEY) {
        const knownAddressReset = await fetch(`${baseUrl}/auth/password/forgot`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        assert.equal(knownAddressReset.status, 202);
        assert.equal((await knownAddressReset.json()).data.message, 'If an active account exists and email delivery is available, a reset link will be sent.');
      }

      const deletion = await fetch(`${baseUrl}/account`, {
        method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      assert.equal(deletion.status, 200);
      const revoked = await fetch(`${baseUrl}/auth/me`, { headers });
      assert.equal(revoked.status, 401);
    } finally {
      if (billId && token) await fetch(`${baseUrl}/bills/${billId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
      if (otherUserId) await prisma.user.deleteMany({ where: { id: otherUserId } });
    }
  });

  it('does not reveal whether an email address is registered for password recovery', async () => {
    const response = await fetch(`${baseUrl}/auth/password/forgot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `missing-${randomUUID()}@example.invalid` }),
    });
    assert.equal(response.status, 202);
    assert.match((await response.json()).data.message, /if an active account exists/i);
  });

  it('returns a useful 404 for unknown API routes', async () => {
    const response = await fetch(`${baseUrl}/not-a-route`);
    assert.equal(response.status, 404);
    assert.match((await response.json()).message, /not found/i);
  });
});
