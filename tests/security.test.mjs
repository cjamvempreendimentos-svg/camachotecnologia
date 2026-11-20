import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
// Exercise the real endpoint authorization boundary without connecting to any hosted store.
const state={custom:true,session:true,version:true};
await mock.module('../netlify/functions/admin-shared.mjs',{namedExports:{requireAdmin:async()=>state.session?{expiresAt:'2099-01-01'}:null,hasCustomAdminPassword:async()=>state.custom,requireCouponAdmin:async()=>state.version?{}:null}});
const {default:admin}=await import('../netlify/functions/admin-coupons.mjs');
const {default:signup}=await import('../netlify/functions/site-coupons.mjs');
test('anonymous visitors cannot list or change coupons',async()=>{
 state.session=false;
 for(const method of ['GET','POST'])assert.equal((await admin(new Request('https://example.com/api/admin/coupons',{method}),{})).status,401);
});
test('bootstrap-password sessions cannot access contacts',async()=>{
 state.session=true;state.custom=false;
 assert.equal((await admin(new Request('https://example.com/api/admin/coupons'),{})).status,403);
});
test('public endpoint has no listing route and rejects foreign origins before persistence',async()=>{
 assert.equal((await signup(new Request('https://example.com/api/site-coupons'))).status,405);
 const r=await signup(new Request('https://example.com/api/site-coupons',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'},body:'{}'}));assert.equal(r.status,403);
 assert.match(r.headers.get('cache-control'),/no-store/);
});

test('old or bootstrap sessions remain blocked after changing the password',async()=>{state.session=true;state.custom=true;state.version=false;assert.equal((await admin(new Request('https://example.com/api/admin/coupons'),{})).status,401);});
