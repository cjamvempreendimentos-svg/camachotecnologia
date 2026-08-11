import { json, readJson, changePassword } from './admin-shared.mjs';
export default async (request, context) => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const body = await readJson(request);
  const result = await changePassword(request, context, body.currentPassword, body.newPassword);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true });
};
export const config = { path: '/api/admin/change-password' };