(() => {
  'use strict';
  const login = document.getElementById('adminLogin');
  const app = document.getElementById('adminApp');
  const form = document.getElementById('loginForm');
  const status = document.getElementById('loginStatus');
  const period = document.getElementById('metricsPeriod');
  const tokenKey = 'camachoAdminToken';
  let token = sessionStorage.getItem(tokenKey) || '';
  const $ = id => document.getElementById(id);
  const pct = (a,b) => b ? `${Math.round((a/b)*100)}%` : '0%';
  const setText = (id,value) => { const el=$(id); if(el) el.textContent=String(value); };
  const renderRanking = (id,obj,empty='Sem dados no período') => {
    const el=$(id); if(!el) return; el.replaceChildren();
    const rows=Object.entries(obj||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
    if(!rows.length){el.innerHTML=`<div class="rank-row"><small>${empty}</small><b>—</b></div>`;return;}
    rows.forEach(([name,value])=>{const row=document.createElement('div');row.className='rank-row';const label=document.createElement('span');label.textContent=name;const count=document.createElement('b');count.textContent=value;row.append(label,count);el.append(row);});
  };
  function renderInsights(t){
    const el=$('insightList'); el.replaceChildren();
    const items=[];
    if(t.visitors===0) items.push('Ainda não há dados suficientes neste período.');
    else {
      if(t.started/t.visitors < .15) items.push('Poucos visitantes iniciam a HelenIA. Vale revisar a chamada e a posição do diagnóstico.');
      if(t.started && t.completed/t.started < .55) items.push('A HelenIA tem abandono relevante. Revise quantidade de perguntas e clareza das opções.');
      if(t.contacts/t.visitors < .05) items.push('A taxa de contato está baixa. Reforce os CTAs de WhatsApp e proposta.');
      if(t.contacts/t.visitors >= .1) items.push('Boa geração de contato no período. Identifique as páginas e interesses que mais contribuem.');
    }
    items.forEach(text=>{const row=document.createElement('div');row.className='insight';const span=document.createElement('span');span.textContent=text;row.append(span);el.append(row);});
  }
  function render(data){
    const t=data.totals;
    setText('metricVisitors',t.visitors); setText('metricViewsHint',`${t.views} acessos`); setText('metricHeleniaStarted',t.started); setText('metricHeleniaStartRate',`${pct(t.started,t.visitors)} dos visitantes`); setText('metricHeleniaCompleted',t.completed); setText('metricHeleniaCompletionRate',`${pct(t.completed,t.started)} dos iniciados`); setText('metricContacts',t.contacts); setText('metricContactRate',`${pct(t.contacts,t.visitors)} dos visitantes`); setText('metricViews',t.views); setText('metricWhatsapp',t.whatsapp); setText('metricInstagram',t.instagram); setText('metricAbandoned',t.abandoned); setText('metricAbandonRate',`${pct(t.abandoned,t.started)} dos iniciados`); setText('metricDiagnostics',t.diagnostics); setText('metricCases',t.cases);
    const max=Math.max(t.visitors,1); [['Visitors',t.visitors],['Started',t.started],['Completed',t.completed],['Contacts',t.contacts]].forEach(([id,v])=>{const bar=$(`funnel${id}`);if(bar)bar.style.width=`${Math.min(100,(v/max)*100)}%`;setText(`funnel${id}Value`,v);});
    setText('funnelSummary',t.visitors?`${pct(t.contacts,t.visitors)} dos visitantes geraram contato`:'Sem dados no período');
    renderRanking('interestList',data.interests,'Nenhum interesse específico registrado'); renderRanking('pageList',data.pages); renderRanking('sourceList',data.sources); renderInsights(t);
  }
  async function load(){
    if(!token)return;
    try{const res=await fetch(`/api/admin/metrics?days=${period.value}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});if(res.status===401){logout();return;}if(!res.ok)throw new Error();render(await res.json());}catch{setText('funnelSummary','Não foi possível carregar as métricas');}
  }
  function showApp(){login.hidden=true;app.hidden=false;setText('todayLabel',new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeZone:'America/Bahia'}).format(new Date()));load();}
  function logout(){token='';sessionStorage.removeItem(tokenKey);app.hidden=true;login.hidden=false;}
  form.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Entrando...';const password=$('adminPassword').value;try{const res=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});const data=await res.json();if(!res.ok){status.textContent=data.error||'Não foi possível entrar.';return;}token=data.token;sessionStorage.setItem(tokenKey,token);status.textContent='';showApp();}catch{status.textContent='Falha de conexão.';}});
  $('logoutButton').addEventListener('click',logout); $('refreshButton').addEventListener('click',load); period.addEventListener('change',load);
  if(token) showApp();
})();