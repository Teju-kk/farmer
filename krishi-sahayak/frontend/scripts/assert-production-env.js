import { isIP } from 'node:net';
import process from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { loadEnv } from 'vite';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fileEnv = loadEnv('production', repositoryRoot, 'VITE_');
const apiValue = process.env.VITE_API_URL || fileEnv.VITE_API_URL;
const supportEmail = process.env.VITE_SUPPORT_EMAIL || fileEnv.VITE_SUPPORT_EMAIL;

if (!apiValue) {
  throw new Error('VITE_API_URL is required for a production frontend build.');
}

let apiUrl;
try {
  apiUrl = new URL(apiValue);
} catch {
  throw new Error('VITE_API_URL must be an absolute HTTPS URL ending in /api.');
}

const hostname = apiUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
const reservedHosts = new Set(['example.com', 'example.net', 'example.org']);
const reservedSuffixes = ['.localhost', '.local', '.invalid', '.test', '.example', '.example.com', '.example.net', '.example.org'];
if (
  apiUrl.protocol !== 'https:' ||
  isIP(hostname) !== 0 ||
  reservedHosts.has(hostname) ||
  reservedSuffixes.some((suffix) => hostname.endsWith(suffix)) ||
  apiUrl.pathname.replace(/\/$/, '') !== '/api' ||
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.search ||
  apiUrl.hash
) {
  throw new Error('VITE_API_URL must use a public HTTPS hostname ending in /api; IP, local, and reserved example hosts are not allowed.');
}

const supportDomain = supportEmail?.split('@')[1]?.toLowerCase();
if (
  !supportEmail ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ||
  !supportDomain ||
  reservedHosts.has(supportDomain) ||
  reservedSuffixes.some((suffix) => supportDomain.endsWith(suffix))
) {
  throw new Error('VITE_SUPPORT_EMAIL must be set to a valid public support address for production.');
}
