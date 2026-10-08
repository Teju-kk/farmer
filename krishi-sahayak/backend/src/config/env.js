import 'dotenv/config';
import { URL } from 'node:url';
const production = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const storageProvider = process.env.STORAGE_PROVIDER || (production ? 'supabase' : 'local');
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? (production ? 1 : 0));
if (!['local', 'supabase'].includes(storageProvider)) throw new Error('STORAGE_PROVIDER must be either local or supabase');
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
if (production && storageProvider !== 'supabase') throw new Error('Production bill storage must use the private Supabase Storage provider');
if (production && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
if (production && !process.env.FRONTEND_URL) throw new Error('FRONTEND_URL must list the production HTTPS frontend origin(s) in production');
if (production && process.env.FRONTEND_URL.split(',').some((value) => {
  try { const url = new URL(value.trim()); return url.protocol !== 'https:' || url.origin !== value.trim().replace(/\/$/, ''); }
  catch { return true; }
})) throw new Error('FRONTEND_URL must contain only exact HTTPS origins in production');
if (production && (!jwtSecret || jwtSecret.length < 32)) throw new Error('JWT_SECRET must contain at least 32 characters in production');
if (production && jwtSecret === 'development-only-secret-change-me') throw new Error('JWT_SECRET must not use the development fallback in production');
if (production && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.SUPPORT_EMAIL)) throw new Error('RESEND_API_KEY, EMAIL_FROM and SUPPORT_EMAIL are required in production');
if (production && !process.env.WEATHER_API_KEY) throw new Error('WEATHER_API_KEY is required for the commercial weather service in production');
if (production && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_STORAGE_BUCKET)) throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET are required for private production bill storage');
if (production && process.env.SUPABASE_URL) {
  try { if (new URL(process.env.SUPABASE_URL).protocol !== 'https:') throw new Error(); }
  catch { throw new Error('SUPABASE_URL must be a valid HTTPS URL in production'); }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: jwtSecret || 'development-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigins: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxyHops,
  production,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  supportEmail: process.env.SUPPORT_EMAIL,
  frontendUrl: process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  storageProvider,
  supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, ''),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  aiApiKey: process.env.AI_API_KEY,
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  weatherApiKey: process.env.WEATHER_API_KEY,
};
