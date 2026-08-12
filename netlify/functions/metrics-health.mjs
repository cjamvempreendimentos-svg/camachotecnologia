import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export default async (_request,context)=>{
  try {
    const deployContext=context?.deploy?.context||process.env.CONTEXT||'unknown';
    const store=getStore('camacho-metrics',{consistency:'strong'});
    const key=`health:${Date.now()}:${randomUUID()}`;
    await store.setJSON(key,{ok:true,createdAt:new Date().toISOString(),deployContext});
    const saved=await store.get(key,{type:'json'});
    await store.delete(key);
    return json({ok:Boolean(saved?.ok),deployContext,siteUrl:process.env.URL||null,host:new URL(context?.site?.url||process.env.URL||'https://unknown.invalid').host});
  } catch(error) {
    console.error('metrics-health',error);
    return json({ok:false,error:error instanceof Error?error.message:'Falha desconhecida'},500);
  }
};
export const config={path:'/api/metrics/health'};
