import { json, readJson, addMetric } from './admin-shared.mjs';
function sameSite(request){const url=new URL(request.url);const origin=request.headers.get('origin');const fetchSite=request.headers.get('sec-fetch-site');if(origin&&origin!==url.origin)return false;if(fetchSite&&!['same-origin','same-site','none'].includes(fetchSite))return false;return true;}
export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!sameSite(request)) return json({ error: 'Origem não autorizada.' }, 403);
  const body = await readJson(request);
  const ok = await addMetric(body);
  return ok ? json({ ok: true }) : json({ error: 'Evento inválido.' }, 400);
};
export const config = { path: '/api/metrics/track' };