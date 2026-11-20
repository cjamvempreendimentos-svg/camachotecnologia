// Local QA only. Uses an isolated, in-memory Postgres-compatible database; never hosted credentials.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { issueCoupon } from '../lib/coupons.mjs';
import { checkOrigin, readBody, json, errorResponse } from '../lib/coupon-http.mjs';
const engine=new PGlite();
await engine.exec(await readFile(new URL('../netlify/database/migrations/20261120090000_site_coupons.sql',import.meta.url),'utf8'));
const query=(sql,params)=>engine.query(sql,params),db={pool:{connect:async()=>({query,release(){}})}};
let queue=Promise.resolve();
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.txt':'text/plain','.xml':'application/xml'};
const root=resolve('dist');
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,`http://${req.headers.host}`);
 if(url.pathname==='/api/site-coupons'){
  const action=async()=>{
   let response;
   try{
    if(req.method!=='POST')response=json({error:'Método não permitido.'},405);
    else{const request=new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'});checkOrigin(request);response=json(await issueCoupon(db,await readBody(request)),201);}
   }catch(error){response=errorResponse(error);}
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  };
  queue=queue.then(action,action);return;
 }
 if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'API hospedada indisponível nesta prévia local.'}));return;}
 try{
  let name=decodeURIComponent(url.pathname);if(name==='/')name='/index.html';
  if(!extname(name))name+='.html';
  const file=resolve(root,'.'+name);if(!file.startsWith(root+'/'))throw Error();
  let body=await readFile(file);
  if(extname(file)==='.html')body=Buffer.from(body.toString().replace('<body>','<body><p style="padding:10px;text-align:center;background:#16334b;color:white">Prévia local · cadastros de teste, sem dados de produção</p>'));
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Não encontrado');}
});
const portArg=process.argv.indexOf('--port');
server.listen(Number(portArg>=0?process.argv[portArg+1]:process.env.PORT||3000),'0.0.0.0',()=>console.log(`Local preview ready on port ${server.address().port}`));
