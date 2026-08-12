(() => {
  'use strict';
  if (/\/admin(?:\.html)?\/?$/i.test(location.pathname)) return;
  const endpoint='/api/metrics/track';
  const productionHosts=new Set(['camachotecnologia.com.br','www.camachotecnologia.com.br','camachotecnologia.netlify.app']);
  if(!productionHosts.has(location.hostname)) return;
  const key='camachoMetricVisitor';
  let visitor='';
  try{visitor=localStorage.getItem(key)||'';if(!visitor){visitor=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem(key,visitor)}}catch{visitor=`session-${Date.now()}-${Math.random().toString(36).slice(2)}`}
  const source=(()=>{const p=new URLSearchParams(location.search),utm=p.get('utm_source');if(utm)return utm.slice(0,160);if(!document.referrer)return'direct';try{const r=new URL(document.referrer);return r.hostname===location.hostname?'internal':r.hostname}catch{return'direct'}})();
  function track(event,label=''){const payload=JSON.stringify({event,visitor,page:location.pathname,source,label:String(label).slice(0,80)});fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:payload,credentials:'same-origin',keepalive:true}).catch(()=>{})}
  window.CamachoMetrics={track};
  track('page_view',document.title);
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.href||'',label=(a.textContent||a.getAttribute('aria-label')||'').trim();if(/wa\.me|whatsapp\.com/i.test(href))track('whatsapp_click',label||'WhatsApp');else if(/instagram\.com/i.test(href))track('instagram_click',label||'Instagram');else if(/portfolio\.html/i.test(href))track('case_view',label||'Case')},true);
})();
