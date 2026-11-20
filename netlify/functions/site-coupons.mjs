import { getDatabase } from '@netlify/database';
import { issueCoupon, validateSignup } from '../../lib/coupons.mjs';
import { json, checkOrigin, readBody, errorResponse } from '../../lib/coupon-http.mjs';
export default async request => {
  if (request.method !== 'POST') return json({error:'Método não permitido.'},405);
  try {
    checkOrigin(request);
    const data = await readBody(request);
    validateSignup(data);
    return json(await issueCoupon(getDatabase(),data),201);
  } catch (error) { return errorResponse(error); }
};
export const config = {path:'/api/site-coupons',method:'POST',rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:5}};
