import { json, readJson, login } from './admin-shared.mjs';
export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const body = await readJson(request);
  const result = await login(body.password);
  if (result?.error) return json({ error: result.error }, 503);
  if (!result) return json({ error: 'Senha inválida.' }, 401);
  return json(result);
};
export const config = { path: '/api/admin/login' };