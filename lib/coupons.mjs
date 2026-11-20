import { randomUUID, randomBytes } from 'node:crypto';
import { CAMPAIGN, TERMS_VERSION, getPlan, money, WHATSAPP } from './site-plans.mjs';
export class CouponError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
export function validateSignup(data) {
  if (!data || typeof data !== 'object' || data.website) throw new CouponError('Não foi possível concluir este cadastro.');
  const name = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const rawPhone = typeof data.phone === 'string' ? data.phone : '';
  let phone = rawPhone.replace(/\D/g, '');
  if ((phone.length === 12 || phone.length === 13) && phone.startsWith('55')) phone = phone.slice(2);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const plan = getPlan(data.planId);
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f<>]/.test(name)) throw new CouponError('Informe seu nome, com 2 a 100 caracteres.');
  if (!/^[1-9]\d9\d{8}$/.test(phone)) throw new CouponError('Informe um WhatsApp brasileiro com DDD e 9 dígitos.');
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new CouponError('Informe um e-mail válido.');
  if (!plan) throw new CouponError('Escolha uma das opções de site.');
  if (data.acceptedTerms !== true) throw new CouponError('Confirme que leu as condições do benefício.');
  return { name, phone, email, plan, marketingConsent: data.marketingConsent === true };
}
export function couponStatus(row, now = Date.now()) {
  if (row.used_at) return 'used';
  if (new Date(row.expires_at).getTime() <= now) return 'expired';
  return row.activated_at ? 'active' : 'pending';
}
export function couponSummary(row) {
  return { code: row.code, planId: row.plan_id, planName: getPlan(row.plan_id)?.name || row.plan_id, price: row.price, discount: row.discount, finalPrice: row.price-row.discount, expiresAt: row.expires_at, status: couponStatus(row) };
}
export function whatsappUrl(row) {
  const s = couponSummary(row);
  const message = `Olá, Camacho! Quero ativar meu cupom para criação de site.\nNome: ${row.name}\nCupom: ${s.code}\nPlano: ${s.planName}\nDesenvolvimento: ${money(s.price)}\nDesconto: ${money(s.discount)}\nValor com cupom: ${money(s.finalPrice)}\nSei que domínio, hospedagem, manutenção, consumo de IA e funcionalidades extras têm orçamento separado.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}
export async function issueCoupon(db, data) {
  const input = validateSignup(data);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const id = randomUUID(), code = `CT-${randomBytes(6).toString('hex').toUpperCase()}`;
    const result = await client.query(`INSERT INTO site_coupons (id,campaign,code,name,phone,email,plan_id,price,discount,terms_version,marketing_consent,expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()+INTERVAL '30 days') ON CONFLICT DO NOTHING RETURNING *`,
      [id,CAMPAIGN,code,input.name,input.phone,input.email,input.plan.id,input.plan.price,input.plan.discount,TERMS_VERSION,input.marketingConsent]);
    if (!result.rows.length) throw new CouponError('Já existe um cadastro com esse WhatsApp ou e-mail. Fale com a Camacho pelo WhatsApp para consultar seu benefício.',409);
    await client.query('INSERT INTO site_coupon_events (id,coupon_id,action) VALUES ($1,$2,$3)',[randomUUID(),id,'created']);
    await client.query('COMMIT');
    const row = result.rows[0];
    return { coupon: couponSummary(row), whatsappUrl: whatsappUrl(row) };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function transitionCoupon(db, code, action) {
  if (!/^CT-[A-F0-9]{12}$/.test(code || '') || !['activate','use'].includes(action)) throw new CouponError('Ação ou código inválido.');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM site_coupons WHERE code=$1 FOR UPDATE',[code]);
    const row = rows[0];
    if (!row) throw new CouponError('Cupom não encontrado.',404);
    const state = couponStatus(row);
    if ((action === 'activate' && state !== 'pending') || (action === 'use' && state !== 'active')) throw new CouponError('O estado do cupom mudou ou ele expirou. Atualize a lista.',409);
    const sql = action === 'activate' ? 'UPDATE site_coupons SET activated_at=NOW() WHERE code=$1 RETURNING *' : 'UPDATE site_coupons SET used_at=NOW() WHERE code=$1 RETURNING *';
    const updated = await client.query(sql,[code]);
    await client.query('INSERT INTO site_coupon_events (id,coupon_id,action) VALUES ($1,$2,$3)',[randomUUID(),row.id,action==='activate'?'activated':'used']);
    await client.query('COMMIT');
    return couponSummary(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function listCoupons(db, page=0) {
  const offset = Math.max(0,Math.min(10000,Math.floor(Number(page)||0)))*25;
  const result = await db.pool.query('SELECT * FROM site_coupons ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $1',[offset]);
  return { hasMore: result.rows.length > 25, coupons: result.rows.slice(0,25).map(row => ({...couponSummary(row),name:row.name,phone:row.phone,email:row.email,createdAt:row.created_at,activatedAt:row.activated_at,usedAt:row.used_at,marketingConsent:row.marketing_consent})) };
}
