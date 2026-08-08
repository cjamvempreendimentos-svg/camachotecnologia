import { getStore } from '@netlify/blobs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const store = () => getStore('camacho-admin', { consistency: 'strong' });
const metricsStore = () => getStore('camacho-metrics', { consistency: 'strong' });
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, max-age=0', 'x-content-type-options': 'nosniff' } });
export const readJson = async (req) => { try { return await req.json(); } catch { return {}; } };
const hash = (value) => createHash('sha256').update(String(value || '')).digest('hex');
const safeEqual = (a,b) => { const l = Buffer.from(String(a||'')); const r = Buffer.from(String(b||'')); return l.length === r.length && timingSafeEqual(l,r); };

export async function login(password) {
  const configured = globalThis.Netlify?.env?.get('CAMACHO_ADMIN_PASSWORD');
  if (!configured) return { error: 'CAMACHO_ADMIN_PASSWORD não configurada.' };
  if (!safeEqual(hash(password), hash(configured))) return null;
  const token = randomUUID();
  await store().setJSON(`session:${token}`, { expiresAt: new Date(Date.now() + 8 * 3600000).toISOString() });
  return { token };
}

export async function requireAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const session = await store().get(`session:${token}`, { type: 'json' });
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session;
}

export async function addMetric(data) {
  const allowed = new Set(['page_view','whatsapp_click','instagram_click','helenia_start','helenia_complete','helenia_contact','case_view','interest']);
  if (!allowed.has(data.event)) return false;
  await metricsStore().setJSON(`metric:${Date.now()}:${randomUUID()}`, {
    event: data.event,
    visitor: String(data.visitor || 'anonymous').slice(0,80),
    page: String(data.page || '/').slice(0,160),
    source: String(data.source || 'direct').slice(0,160),
    label: String(data.label || '').slice(0,80),
    createdAt: new Date().toISOString()
  });
  return true;
}

export async function listMetrics(days = 30) {
  const cutoff = Date.now() - Math.min(90, Math.max(1, Number(days)||30)) * 86400000;
  const s = metricsStore();
  const { blobs } = await s.list({ prefix: 'metric:' });
  const rows = [];
  for (const blob of blobs) {
    const item = await s.get(blob.key, { type: 'json' });
    if (item && new Date(item.createdAt).getTime() >= cutoff) rows.push(item);
  }
  return rows;
}