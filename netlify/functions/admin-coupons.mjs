import { getDatabase } from '@netlify/database';
import { listCoupons, transitionCoupon } from '../../lib/coupons.mjs';
import { json, checkOrigin, readBody, errorResponse } from '../../lib/coupon-http.mjs';
import { requireAdmin, hasCustomAdminPassword, requireCouponAdmin } from './admin-shared.mjs';
export default async (request,context) => {
  try {
    if (!['GET','POST'].includes(request.method)) return json({error:'Método não permitido.'},405);
    if (!await requireAdmin(request,context)) return json({error:'Sessão inválida. Entre novamente.'},401);
    if (!await hasCustomAdminPassword(context)) return json({error:'Altere a senha inicial do painel antes de acessar os cadastros e cupons.'},403);
    if (!await requireCouponAdmin(request,context)) return json({error:'Entre novamente no painel com sua senha atual para acessar os cupons.'},401);
    if (request.method === 'GET') return json(await listCoupons(getDatabase(),new URL(request.url).searchParams.get('page')));
    checkOrigin(request);
    const data = await readBody(request);
    return json({coupon:await transitionCoupon(getDatabase(),data.code,data.action)});
  } catch (error) { return errorResponse(error); }
};
export const config = {path:'/api/admin/coupons',method:['GET','POST']};
