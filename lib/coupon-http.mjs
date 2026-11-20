import { CouponError } from './coupons.mjs';
export const json = (body,status=200) => new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store, max-age=0', 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer', 'content-security-policy':"default-src 'none'; frame-ancestors 'none'" } });
export function checkOrigin(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new CouponError('Origem não autorizada.',403);
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw new CouponError('Envie os dados em JSON.',415);
}
export async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new CouponError('Cadastro inválido.');
  const chunks=[]; let total=0;
  while (true) {
    const {done,value}=await reader.read(); if(done) break;
    total+=value.byteLength;
    if(total>4096){await reader.cancel();throw new CouponError('Cadastro excede o tamanho permitido.',413);}
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new CouponError('Cadastro inválido.'); }
}
export const errorResponse = error => error instanceof CouponError ? json({error:error.message},error.status) : json({error:'Serviço temporariamente indisponível. Tente novamente ou fale com a Camacho pelo WhatsApp.'},503);
