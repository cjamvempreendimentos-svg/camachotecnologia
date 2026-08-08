import { json, requireAdmin, listMetrics } from './admin-shared.mjs';
const countBy=(rows,key)=>rows.reduce((acc,row)=>{const k=row[key]||'Não identificado';acc[k]=(acc[k]||0)+1;return acc;},{});
export default async (request) => {
  const session = await requireAdmin(request);
  if (!session) return json({ error: 'Não autorizado.' }, 401);
  const days = Number(new URL(request.url).searchParams.get('days') || 30);
  const rows = await listMetrics(days);
  const byEvent = countBy(rows,'event');
  const uniqueVisitors = new Set(rows.map(r=>r.visitor).filter(Boolean)).size;
  const started = byEvent.helenia_start || 0;
  const completed = byEvent.helenia_complete || 0;
  const contacts = (byEvent.whatsapp_click || 0) + (byEvent.helenia_contact || 0);
  return json({
    days,
    totals:{views:byEvent.page_view||0,visitors:uniqueVisitors,started,completed,abandoned:Math.max(started-completed,0),whatsapp:byEvent.whatsapp_click||0,instagram:byEvent.instagram_click||0,diagnostics:byEvent.helenia_contact||0,cases:byEvent.case_view||0,contacts},
    pages:countBy(rows.filter(r=>r.event==='page_view'),'page'),
    sources:countBy(rows.filter(r=>r.event==='page_view'),'source'),
    interests:countBy(rows.filter(r=>r.event==='interest'),'label')
  });
};
export const config = { path: '/api/admin/metrics' };