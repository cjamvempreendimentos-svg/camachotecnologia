import { getPlan, money } from './lib/site-plans.mjs';
const form = document.getElementById('benefitForm');
const dialog = document.getElementById('benefitDialog');
const status = document.getElementById('benefitStatus');
const submit = document.getElementById('benefitSubmit');
const select = form.elements.planId;
let lastTrigger = null, couponCode = '';
const updateSelection = () => {
 const plan = getPlan(select.value);
 document.getElementById('benefitSelection').textContent = plan ? `${money(plan.price)} − ${money(plan.discount)} de desconto = ${money(plan.price-plan.discount)} pelo desenvolvimento. Demais custos à parte.` : 'Escolha uma opção para conferir seu desconto.';
};
select.addEventListener('change',updateSelection);
document.querySelectorAll('[data-plan], [data-open-benefit]').forEach(link=>link.addEventListener('click',()=>{
 if(link.dataset.plan){select.value=link.dataset.plan;updateSelection();}
 form.elements.name.focus({preventScroll:true});
}));
document.getElementById('ribbonPause').addEventListener('click',event=>{
 const paused = event.currentTarget.getAttribute('aria-pressed') !== 'true';
 event.currentTarget.setAttribute('aria-pressed',String(paused));
 event.currentTarget.setAttribute('aria-label',paused?'Retomar faixa em movimento':'Pausar faixa em movimento');
 event.currentTarget.textContent = paused?'Retomar':'Pausar';
 document.querySelector('.benefits-ribbon').classList.toggle('is-paused',paused);
});
form.addEventListener('submit',async event=>{
 event.preventDefault(); if(submit.disabled) return;
 submit.disabled=true; status.textContent='Registrando seu benefício…';
 const values=new FormData(form);
 try {
  const response=await fetch('/api/site-coupons',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:values.get('name'),phone:values.get('phone'),email:values.get('email'),planId:values.get('planId'),website:values.get('website'),acceptedTerms:form.elements.acceptedTerms.checked,marketingConsent:form.elements.marketingConsent.checked})});
  if(response.status===429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||'Não foi possível cadastrar. Tente novamente.');
  const c=data.coupon;
  couponCode=c.code;
  document.getElementById('reopenCoupon').hidden=false;
  document.getElementById('couponCode').textContent=c.code;
  document.getElementById('couponPlan').textContent=c.planName;
  document.getElementById('couponDiscount').textContent=money(c.discount);
  document.getElementById('couponPrice').textContent=`De ${money(c.price)} por ${money(c.finalPrice)} com cupom.`;
  document.getElementById('couponExpiry').textContent=`Válido até ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'America/Sao_Paulo'}).format(new Date(c.expiresAt))}. A ativação não altera esse prazo.`;
  document.getElementById('couponWhatsapp').href=data.whatsappUrl;
  document.getElementById('copyStatus').textContent='';
  status.textContent='Cupom registrado. Envie a mensagem pelo WhatsApp para solicitar a ativação.';
  lastTrigger=document.activeElement;
  dialog.showModal();
 } catch(error) { status.textContent=error instanceof SyntaxError?'Serviço temporariamente indisponível. Tente novamente.':error.message; }
 finally {submit.disabled=false;}
});
dialog.querySelector('.benefit-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>lastTrigger?.focus());
document.getElementById('copyCoupon').addEventListener('click',async()=>{
 try {await navigator.clipboard.writeText(couponCode);document.getElementById('copyStatus').textContent='Código copiado.';}
 catch {document.getElementById('copyStatus').textContent=`Copie este código: ${couponCode}`;}
});

document.getElementById('reopenCoupon').addEventListener('click',()=>{lastTrigger=document.activeElement;dialog.showModal();});
