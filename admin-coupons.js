import { money } from './lib/site-plans.mjs';
const section=document.getElementById('couponsPanel'), list=document.getElementById('couponList'), status=document.getElementById('couponsStatus');
const labels={pending:'Pendente de ativação',active:'Ativo',used:'Utilizado',expired:'Expirado'};
let page=0,loading=false;
const date=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value)):'—';
function text(tag,value,className=''){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
async function load(){
 const token=sessionStorage.getItem('camachoAdminToken');
 if(!token||document.getElementById('adminApp').hidden){list.replaceChildren();return;}
 if(loading)return;loading=true;status.textContent='Carregando cupons…';
 try{
  const response=await fetch(`/api/admin/coupons?page=${page}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'}),data=await response.json();
  if(!response.ok)throw new Error(data.error||'Não foi possível carregar.');
  list.replaceChildren();
  for(const c of data.coupons){
   const card=text('article','','coupon-admin-row');
   const head=text('div','','coupon-admin-heading');head.append(text('h3',c.name),text('span',labels[c.status]));card.append(head);
   card.append(text('p',`${c.phone} · ${c.email}`),text('p',`${c.planName} · ${money(c.price)} − ${money(c.discount)} = ${money(c.finalPrice)}`),text('p',c.code,'coupon-admin-code'),text('p',`Cadastro: ${date(c.createdAt)} · Validade: ${date(c.expiresAt)}`),text('p',`Ativação: ${date(c.activatedAt)} · Uso: ${date(c.usedAt)}`),text('p',c.marketingConsent?'Autorizou ofertas futuras.':'Sem autorização para ofertas futuras.'));
   const contact=document.createElement('a');contact.href=`https://wa.me/55${c.phone}`;contact.target='_blank';contact.rel='noopener noreferrer';contact.textContent='Abrir contato no WhatsApp';card.append(contact);
   if(['pending','active'].includes(c.status)){
    const button=text('button',c.status==='pending'?'Confirmar recebimento e ativar':'Marcar como utilizado');button.type='button';
    button.addEventListener('click',async()=>{
     const action=c.status==='pending'?'activate':'use';
     if(!window.confirm(action==='activate'?`Você recebeu a mensagem e deseja ativar ${c.code}?`:`Confirma que o desconto de ${money(c.discount)} foi aplicado na contratação? O cupom será bloqueado para novo uso.`))return;
     button.disabled=true;
     try{
      const r=await fetch('/api/admin/coupons',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${sessionStorage.getItem('camachoAdminToken')||''}`},body:JSON.stringify({code:c.code,action})}),d=await r.json();
      if(!r.ok)throw new Error(d.error||'Não foi possível atualizar.');
      await load();
     }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });card.append(button);
   }list.append(card);
  }
  document.getElementById('couponsPrevious').disabled=page===0;
  document.getElementById('couponsNext').disabled=!data.hasMore;
  status.textContent=data.coupons.length?`Página ${page+1} · ${data.coupons.length} cupons nesta página.`:'Nenhum cupom cadastrado.';
 }catch(error){list.replaceChildren();status.textContent=error.message;}finally{loading=false;}
}
document.getElementById('couponsRefresh').addEventListener('click',()=>load());
document.getElementById('couponsPrevious').addEventListener('click',()=>{if(!loading&&page>0){page--;load();}});
document.getElementById('couponsNext').addEventListener('click',()=>{if(!loading){page++;load();}});
const observer=new MutationObserver(()=>{if(document.getElementById('adminApp').hidden){list.replaceChildren();status.textContent='';page=0;}else load();});
observer.observe(document.getElementById('adminApp'),{attributes:true,attributeFilter:['hidden']});
load();
