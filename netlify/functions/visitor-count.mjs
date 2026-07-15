import { getDeployStore, getStore } from '@netlify/blobs';

const RESPONSE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...RESPONSE_HEADERS, ...extraHeaders }
});

const toHex = (buffer) => [...new Uint8Array(buffer)]
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', bytes));
}

function getVisitStore(context) {
  if (context.deploy?.context === 'production') {
    return getStore('camacho-site-visits', { consistency: 'strong' });
  }

  return getDeployStore('camacho-site-visits-preview');
}

async function loadTotal(store) {
  const summary = await store.get('summary/total', { type: 'json' });
  if (Number.isSafeInteger(summary?.count) && summary.count >= 0) return summary.count;

  const { blobs } = await store.list({ prefix: 'visits/' });
  const total = blobs.length;

  await store.setJSON('summary/total', { count: total, rebuiltAt: new Date().toISOString() });
  return total;
}

function requestIsSameSite(request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  if (origin && origin !== requestOrigin) return false;
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) return false;
  return true;
}

async function buildVisitKey(request, context) {
  const clientIp = String(context.ip || 'unknown').trim().slice(0, 80);
  const day = new Date().toISOString().slice(0, 10);
  const secret = globalThis.Netlify?.env?.get('VISITOR_HASH_SALT');
  const namespace = secret || context.site?.id || new URL(request.url).hostname;
  const fingerprint = await hash(`${namespace}|${day}|${clientIp}`);

  return `visits/${day}/${fingerprint}`;
}

export default async (request, context) => {
  if (!requestIsSameSite(request)) {
    return json({ error: 'Origem não autorizada.' }, 403);
  }

  try {
    const store = getVisitStore(context);
    let count = await loadTotal(store);

    if (request.method === 'POST') {
      const visitKey = await buildVisitKey(request, context);
      const existingVisit = await store.get(visitKey);

      if (!existingVisit) {
        await store.setJSON(visitKey, { createdAt: new Date().toISOString() });
        count += 1;
        await store.setJSON('summary/total', { count, updatedAt: new Date().toISOString() });
      }
    }

    return json({ count });
  } catch {
    return json({ error: 'Contador temporariamente indisponível.' }, 503);
  }
};

export const config = {
  path: '/api/visitor-count',
  method: ['GET', 'POST']
};
