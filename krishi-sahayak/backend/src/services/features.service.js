import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URL, URLSearchParams } from 'node:url';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { sendMail } from './mail.service.js';
import { deleteBillObject, getBill, putBill } from './bill-storage.service.js';

export async function weather(location) {
  if (!location || location.trim().length < 2 || location.length > 100) throw new AppError('Enter a town or district name.', 422);
  const geoUrl = new URL(env.weatherApiKey ? 'https://customer-geocoding-api.open-meteo.com/v1/search' : 'https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.search = new URLSearchParams({ name: location.trim(), count: '1', language: 'en', format: 'json', ...(env.weatherApiKey && { apikey: env.weatherApiKey }) });
  let geoResponse;
  try { geoResponse = await globalThis.fetch(geoUrl, { signal: globalThis.AbortSignal.timeout(8000) }); }
  catch { throw new AppError('Weather service is temporarily unavailable. Try again shortly.', 502); }
  if (!geoResponse.ok) throw new AppError('Weather service is temporarily unavailable. Try again shortly.', 502);
  let places;
  try { places = await geoResponse.json(); } catch { throw new AppError('Weather service returned an invalid response. Try again shortly.', 502); }
  const place = places.results?.[0];
  if (!place) throw new AppError('No matching location was found. Try a nearby town or district.', 404);
  const forecastUrl = new URL(env.weatherApiKey ? 'https://customer-api.open-meteo.com/v1/forecast' : 'https://api.open-meteo.com/v1/forecast');
  forecastUrl.search = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code', timezone: 'auto', forecast_days: '5', ...(env.weatherApiKey && { apikey: env.weatherApiKey }) });
  let forecastResponse;
  try { forecastResponse = await globalThis.fetch(forecastUrl, { signal: globalThis.AbortSignal.timeout(8000) }); }
  catch { throw new AppError('Weather service is temporarily unavailable. Try again shortly.', 502); }
  if (!forecastResponse.ok) throw new AppError('Weather service is temporarily unavailable. Try again shortly.', 502);
  try { return { location: { name: place.name, region: place.admin1, country: place.country }, ...await forecastResponse.json(), source: 'Open-Meteo', attribution: 'Weather data by Open-Meteo.com' }; }
  catch { throw new AppError('Weather service returned an invalid response. Try again shortly.', 502); }
}

export const listSchemes = (userId) => prisma.trackedScheme.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
export const createScheme = (userId, input) => prisma.trackedScheme.create({ data: { ...input, userId } });
export async function updateScheme(userId, id, input) {
  const result = await prisma.trackedScheme.updateMany({ where: { id, userId }, data: input });
  if (!result.count) throw new AppError('Tracked scheme not found', 404);
  return prisma.trackedScheme.findUnique({ where: { id } });
}
export async function deleteScheme(userId, id) {
  const result = await prisma.trackedScheme.deleteMany({ where: { id, userId } });
  if (!result.count) throw new AppError('Tracked scheme not found', 404);
  return { id };
}

export const listNotifications = (userId) => prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
export async function markNotificationRead(userId, id) {
  const result = await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  if (!result.count) throw new AppError('Notification not found', 404);
  return { id, isRead: true };
}

export async function askAssistant(userId, question, locale) {
  if (!env.aiApiKey) throw new AppError('The farm assistant is not configured yet. Please contact support.', 503);
  let response;
  try {
    response = await globalThis.fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.aiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.aiModel, store: false, max_output_tokens: 700, instructions: `You are a cautious agriculture information assistant for Indian farmers. Reply in ${locale === 'kn' ? 'Kannada' : 'English'}. Give general educational information, ask for missing context, avoid definitive diagnoses or pesticide dosages, never claim official scheme eligibility or current market prices, and recommend a local agricultural extension officer for consequential crop/chemical decisions. Do not ask for personal identifiers.`, input: question }),
      signal: globalThis.AbortSignal.timeout(25000),
    });
  } catch { throw new AppError('The farm assistant could not answer right now. Please retry later.', 502); }
  if (!response.ok) throw new AppError('The farm assistant could not answer right now. Please retry later.', 502);
  let result;
  try { result = await response.json(); } catch { throw new AppError('The farm assistant returned an invalid response. Please retry.', 502); }
  const answer = result.output?.flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();
  if (!answer) throw new AppError('The farm assistant returned no answer. Please retry.', 502);
  const conversation = await prisma.aIConversation.create({ data: { userId, title: question.slice(0, 80), messages: { create: [{ role: 'user', content: question }, { role: 'assistant', content: answer }] } } });
  return { conversationId: conversation.id, answer, disclaimer: 'General information only. Confirm advice with a qualified local agronomist.' };
}

function identifyFile(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return { mime: 'application/pdf', extension: 'pdf' };
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: 'image/png', extension: 'png' };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', extension: 'jpg' };
  throw new AppError('Upload a PDF, PNG, or JPEG bill image.', 415);
}

export async function listBills(userId) {
  return prisma.bill.findMany({ where: { farmerId: userId }, orderBy: { createdAt: 'desc' }, select: { id: true, vendor: true, billDate: true, category: true, totalAmount: true, description: true, createdAt: true } });
}
export async function uploadBill(userId, input) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.contentBase64)) throw new AppError('The selected file is not valid base64 data.', 422);
  const buffer = Buffer.from(input.contentBase64, 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new AppError('Bill files must be 5 MB or smaller.', 413);
  const file = identifyFile(buffer);
  const objectKey = `${userId}/${randomUUID()}.${file.extension}`;
  await putBill(objectKey, buffer, file.mime);
  try {
    const bill = await prisma.bill.create({ data: { farmerId: userId, fileUrl: objectKey, vendor: input.vendor, billDate: input.billDate, category: input.category, totalAmount: input.totalAmount, description: input.description } });
    return { id: bill.id, vendor: bill.vendor, billDate: bill.billDate, category: bill.category, totalAmount: bill.totalAmount, description: bill.description, createdAt: bill.createdAt };
  } catch (error) {
    try { await deleteBillObject(objectKey); } catch { console.error('Bill object cleanup failed after database write failure.'); }
    throw error;
  }
}
export async function getBillFile(userId, id) {
  const bill = await prisma.bill.findFirst({ where: { id, farmerId: userId }, select: { fileUrl: true } });
  const ownerScoped = bill?.fileUrl.startsWith(`${userId}/`);
  const legacyLocalKey = env.storageProvider === 'local' && /^[a-f0-9-]+\.(pdf|png|jpg)$/i.test(bill?.fileUrl || '');
  if (!bill || (!ownerScoped && !legacyLocalKey)) throw new AppError('Bill not found', 404);
  const bytes = await getBill(bill.fileUrl);
  const mime = bill.fileUrl.endsWith('.pdf') ? 'application/pdf' : bill.fileUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return { bytes, mime };
}
export async function deleteBill(userId, id) {
  const bill = await prisma.bill.findFirst({ where: { id, farmerId: userId }, select: { fileUrl: true } });
  const ownerScoped = bill?.fileUrl.startsWith(`${userId}/`);
  const legacyLocalKey = env.storageProvider === 'local' && /^[a-f0-9-]+\.(pdf|png|jpg)$/i.test(bill?.fileUrl || '');
  if (!bill || (!ownerScoped && !legacyLocalKey)) throw new AppError('Bill not found', 404);
  await deleteBillObject(bill.fileUrl);
  await prisma.bill.delete({ where: { id } });
  return { id };
}

export async function submitContact(input) {
  if (!env.supportEmail) throw new AppError('Contact support is not configured. Please use the public support email.', 503);
  const ticket = await prisma.supportMessage.create({ data: input });
  try { await sendMail({ to: env.supportEmail, replyTo: input.email, subject: `[Krishi support ${ticket.id.slice(-6)}] ${input.subject}`, text: `From: ${input.name} <${input.email}>\n\n${input.message}` }); await prisma.supportMessage.delete({ where: { id: ticket.id } }); }
  catch { await prisma.supportMessage.delete({ where: { id: ticket.id } }); throw new AppError('Contact support is temporarily unavailable. Please use the support email shown on this page.', 503); }
  return { ticketId: ticket.id, message: 'Your message has been sent.' };
}
