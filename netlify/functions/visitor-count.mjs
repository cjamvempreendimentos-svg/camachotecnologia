import { getDeployStore, getStore } from '@netlify/blobs';

const INITIAL_TOTAL = 8000;

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

  if (Number.isSafeInteger(summary?.count) && summary.count >= INITIAL_TOTAL) {
    return summary.count;
  }

  if (Number.isSafeInteger(summary?.count) && summary.count >= 0) {
    await store.setJSON('summary/total', {
      count: INITIAL_TOTAL,
      adjustedAt: new Date().toISOString()
    });
    return INITIAL_TOTAL;
  }

  const { blobs } = await store.list({ prefix: 'visits/' });
  const total = Math.max(blobs.length, INITIAL_TOTAL);

  await store.setJSON('summary/total', {
    count: total,
    rebuiltAt: new Date().toISOString()
  });
  return total;
}

function requestIsAllowed(request) {
  if (request.method === 'GET') return true;

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  // POST só é aceito quando o navegador comprova origem do próprio site.
  // Ausência dos cabeçalhos não é tratada como autorização.
  if (!origin || origin !== requestOrigin) return false;
  if (!fetchSite || !['same-origin', 'same-site'].includes(fetchSite)) return false;
  return true;
}

function getHashNamespace(request, context) {
  const secret = globalThis.Netlify?.env?.get('VISITOR_HASH_SALT');
  if (secret && secret.length >= 32) return `secret:${secret}`;

  // Preview pode usar um namespace efêmero, sem compartilhar identificadores com produção.
  if (context.deploy?.context !== 'production') {
    return `preview:${context.deploy?.id || new URL(request.url).hostname}`;
  }

  // Em produção, falha de forma segura: não cria hash de IP com salt previsível.
  throw new Error('VISITOR_HASH_SALT ausente ou curta');
}

async function buildVisitKey(request, context) {
  const clientIp = String(context.ip || 'unknown').trim().slice(0, 80);
  const day = new Date().toISOString().slice(0, 10);
  const namespace = getHashNamespace(request, context);
  const fingerprint = await hash(`${namespace}|${day}|${clientIp}`);

  return `visits/${day}/${fingerprint}`;
}

export default async (request, context) => {
  if (!requestIsAllowed(request)) {
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
