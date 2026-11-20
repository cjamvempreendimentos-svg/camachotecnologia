import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { issueCoupon,transitionCoupon,listCoupons,validateSignup,couponStatus } from '../lib/coupons.mjs';
import { checkOrigin,readBody } from '../lib/coupon-http.mjs';
import { PLANS } from '../lib/site-plans.mjs';
let engine,db;
before(async()=>{
 engine=new PGlite();await engine.exec(await readFile(new URL('../netlify/database/migrations/20261120090000_site_coupons.sql',import.meta.url),'utf8'));
 const query=async(sql,params)=>engine.query(sql,params);
 db={pool:{query,connect:async()=>({query,release(){}})}};
});
after(async()=>engine.close());
const signup=(n=1,planId='institucional')=>({name:'Cliente Teste',phone:`7799000${String(n).padStart(4,'0')}`,email:`teste${n}@example.com`,planId,acceptedTerms:true,marketingConsent:false,website:''});
test('server ignores client prices and calculates every approved plan',async()=>{
 for(const [i,plan] of PLANS.entries()){
  const result=await issueCoupon(db,{...signup(i+1,plan.id),price:1,discount:99999});
  assert.equal(result.coupon.price,plan.price);assert.equal(result.coupon.discount,plan.discount);
  assert.equal(result.coupon.finalPrice,plan.price-plan.discount);assert.equal(result.coupon.status,'pending');
  assert.match(result.coupon.code,/^CT-[A-F0-9]{12}$/);
  assert.equal(new URL(result.whatsappUrl).pathname,'/5571992438726');
  assert.ok(decodeURIComponent(result.whatsappUrl).includes(result.coupon.code));
  assert.equal('email' in result.coupon,false);assert.equal('phone' in result.coupon,false);
 }
});
test('unique phone and email block duplicates and preserve the original coupon',async()=>{
 const c=await issueCoupon(db,signup(20));
 await assert.rejects(issueCoupon(db,{...signup(21),phone:signup(20).phone}),e=>e.status===409);
 await assert.rejects(issueCoupon(db,{...signup(22),email:signup(20).email}),e=>e.status===409);
 const rows=await db.pool.query('SELECT * FROM site_coupons WHERE code=$1',[c.coupon.code]);assert.equal(rows.rows.length,1);
});
test('cannot consume pending; activation then consumption is single use, with audit',async()=>{
 const c=await issueCoupon(db,signup(30)),code=c.coupon.code;
 await assert.rejects(transitionCoupon(db,code,'use'),e=>e.status===409);
 assert.equal((await transitionCoupon(db,code,'activate')).status,'active');
 await assert.rejects(transitionCoupon(db,code,'activate'),e=>e.status===409);
 assert.equal((await transitionCoupon(db,code,'use')).status,'used');
 await assert.rejects(transitionCoupon(db,code,'use'),e=>e.status===409);
 const events=await db.pool.query('SELECT action FROM site_coupon_events e JOIN site_coupons c ON c.id=e.coupon_id WHERE c.code=$1 ORDER BY e.created_at',[code]);
 assert.deepEqual(events.rows.map(r=>r.action),['created','activated','used']);
});
test('expired coupons cannot be activated or consumed',async()=>{
 const c=await issueCoupon(db,signup(40));await db.pool.query("UPDATE site_coupons SET expires_at=NOW()-INTERVAL '1 day' WHERE code=$1",[c.coupon.code]);
 await assert.rejects(transitionCoupon(db,c.coupon.code,'activate'),e=>e.status===409);
 assert.equal(couponStatus({expires_at:'2000-01-01'}),'expired');
});
test('transaction rollback prevents orphan coupons when auditing fails',async()=>{
 const broken={pool:{connect:async()=>{const c=await db.pool.connect();return {...c,query:(sql,params)=>{if(sql.startsWith('INSERT INTO site_coupon_events'))throw Error('audit unavailable');return c.query(sql,params);}}}}};
 await assert.rejects(issueCoupon(broken,signup(50)));
 assert.equal((await db.pool.query('SELECT * FROM site_coupons WHERE email=$1',[signup(50).email])).rows.length,0);
});
test('invalid input, honeypot, invalid plans and missing conditions are rejected',()=>{
 for(const patch of [{name:'<'},{phone:'111'},{email:'x'},{planId:'sistema'},{acceptedTerms:false},{website:'bot.example'}, {name:'x'.repeat(101)}])assert.throws(()=>validateSignup({...signup(99),...patch}));
 assert.equal(validateSignup({...signup(99),phone:'+55 (77) 99000-0099'}).phone,'77990000099');
});
test('cross-origin mutations and oversized streamed bodies are rejected',async()=>{
 assert.throws(()=>checkOrigin(new Request('https://example.com/api',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'}})),e=>e.status===403);
 assert.throws(()=>checkOrigin(new Request('https://example.com/api',{method:'POST'})));
 await assert.rejects(readBody(new Request('https://example.com/api',{method:'POST',body:'x'.repeat(4097)})),e=>e.status===413);
});
test('administrative list includes contacts but respects pagination',async()=>{
 const result=await listCoupons(db);assert.ok(result.coupons.length>0);assert.ok(result.coupons[0].email);assert.ok(result.coupons.length<=25);
});
