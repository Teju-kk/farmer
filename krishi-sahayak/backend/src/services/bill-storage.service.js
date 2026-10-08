import { Buffer } from 'node:buffer';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

function localPath(key) {
  if (!/^(?:[A-Za-z0-9_-]+\/)?[a-f0-9-]+\.(pdf|png|jpg)$/i.test(key)) throw new AppError('Bill not found', 404);
  const path = resolve(env.uploadDir, ...key.split('/'));
  if (!path.startsWith(`${resolve(env.uploadDir)}${sep}`)) throw new AppError('Bill not found', 404);
  return path;
}

function remoteUrl(key = '') {
  const path = key ? `/${key.split('/').map(encodeURIComponent).join('/')}` : '';
  return `${env.supabaseUrl}/storage/v1/object/${encodeURIComponent(env.storageBucket)}${path}`;
}

function storageError() {
  return new AppError('Private bill storage is temporarily unavailable. Please try again later.', 503);
}

export async function putBill(key, bytes, mime) {
  if (env.storageProvider === 'local') {
    const path = localPath(key);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
    return;
  }
  let response;
  try {
    response = await globalThis.fetch(remoteUrl(key), {
      method: 'POST', headers: { apikey: env.supabaseServiceRoleKey, Authorization: `Bearer ${env.supabaseServiceRoleKey}`, 'Content-Type': mime, 'x-upsert': 'false' },
      body: bytes, signal: globalThis.AbortSignal.timeout(15000),
    });
  } catch { throw storageError(); }
  if (!response.ok) throw storageError();
}

export async function getBill(key) {
  if (env.storageProvider === 'local') {
    try { return await readFile(localPath(key)); } catch (error) {
      if (error.code === 'ENOENT') throw new AppError('Bill file was not found.', 404);
      throw storageError();
    }
  }
  let response;
  try {
    response = await globalThis.fetch(remoteUrl(key), { headers: { apikey: env.supabaseServiceRoleKey, Authorization: `Bearer ${env.supabaseServiceRoleKey}` }, signal: globalThis.AbortSignal.timeout(15000) });
    if (response.status === 404) throw new AppError('Bill file was not found.', 404);
    if (!response.ok) throw storageError();
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw storageError();
  }
}

export async function deleteBillObject(key) {
  if (env.storageProvider === 'local') {
    try { await rm(localPath(key), { force: true }); } catch { throw storageError(); }
    return;
  }
  let response;
  try {
    response = await globalThis.fetch(remoteUrl(), {
      method: 'DELETE', headers: { apikey: env.supabaseServiceRoleKey, Authorization: `Bearer ${env.supabaseServiceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: [key] }), signal: globalThis.AbortSignal.timeout(15000),
    });
  } catch { throw storageError(); }
  if (!response.ok) throw storageError();
}
