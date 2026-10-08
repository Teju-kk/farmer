import assert from 'node:assert/strict';
import { test } from 'node:test';
import { env } from '../src/config/env.js';
import { deleteBillObject, getBill, putBill } from '../src/services/bill-storage.service.js';

test('Supabase storage adapter keeps credentials server-side and scopes private object operations', async () => {
  const original = { provider: env.storageProvider, url: env.supabaseUrl, key: env.supabaseServiceRoleKey, bucket: env.storageBucket, fetch: globalThis.fetch };
  const requests = [];
  const bytes = Buffer.from('%PDF-1.7 test');
  env.storageProvider = 'supabase';
  env.supabaseUrl = 'https://storage.example.test';
  env.supabaseServiceRoleKey = 'test-service-role-secret';
  env.storageBucket = 'private-bills';
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return options.method === 'POST' || options.method === 'DELETE'
      ? new Response(null, { status: 200 })
      : new Response(bytes, { status: 200 });
  };

  try {
    const key = 'user-123/123e4567-e89b-12d3-a456-426614174000.pdf';
    await putBill(key, bytes, 'application/pdf');
    assert.match(requests[0].url, /\/storage\/v1\/object\/private-bills\/user-123\//);
    assert.equal(requests[0].options.headers.Authorization, 'Bearer test-service-role-secret');
    assert.equal(requests[0].options.headers['x-upsert'], 'false');
    assert.deepEqual(await getBill(key), bytes);
    await deleteBillObject(key);
    assert.equal(requests[2].options.method, 'DELETE');
    assert.deepEqual(JSON.parse(requests[2].options.body), { prefixes: [key] });
  } finally {
    env.storageProvider = original.provider;
    env.supabaseUrl = original.url;
    env.supabaseServiceRoleKey = original.key;
    env.storageBucket = original.bucket;
    globalThis.fetch = original.fetch;
  }
});

test('storage provider failures return a generic unavailable error', async () => {
  const original = { provider: env.storageProvider, url: env.supabaseUrl, key: env.supabaseServiceRoleKey, bucket: env.storageBucket, fetch: globalThis.fetch };
  env.storageProvider = 'supabase';
  env.supabaseUrl = 'https://storage.example.test';
  env.supabaseServiceRoleKey = 'test-service-role-secret';
  env.storageBucket = 'private-bills';
  globalThis.fetch = async () => { throw new Error('provider error including secret'); };
  try {
    await assert.rejects(getBill('user-123/123e4567-e89b-12d3-a456-426614174000.pdf'), (error) => error.status === 503 && !error.message.includes('secret'));
  } finally {
    env.storageProvider = original.provider;
    env.supabaseUrl = original.url;
    env.supabaseServiceRoleKey = original.key;
    env.storageBucket = original.bucket;
    globalThis.fetch = original.fetch;
  }
});
