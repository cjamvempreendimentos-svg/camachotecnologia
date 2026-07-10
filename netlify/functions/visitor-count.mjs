import { getStore } from '@netlify/blobs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

async function countVisits(store) {
  let total = 0;
  let cursor;

  do {
    const page = await store.list({ prefix: 'visits/', cursor });
    total += page.blobs.length;
    cursor = page.cursor;
  } while (cursor);

  return total;
}

export default async (request) => {
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ error: 'Método não permitido.' }, 405);
  }

  try {
    const store = getStore('camacho-site-visits');

    if (request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const visitId = typeof payload.visitId === 'string'
        ? payload.visitId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
        : '';

      if (!visitId) {
        return json({ error: 'Identificador de visita inválido.' }, 400);
      }

      const key = `visits/${visitId}`;
      const existing = await store.get(key);

      if (!existing) {
        await store.setJSON(key, { createdAt: new Date().toISOString() });
      }
    }

    return json({ count: await countVisits(store) });
  } catch (error) {
    console.error('Erro no contador de visitas:', error);
    return json({ error: 'Não foi possível carregar o contador.' }, 500);
  }
};
