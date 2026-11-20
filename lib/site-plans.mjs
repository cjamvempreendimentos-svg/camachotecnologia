export const CAMPAIGN = 'sites-2026-v1';
export const TERMS_VERSION = '2026-11-20-v1';
export const WHATSAPP = '5571992438726';
export const PLANS = Object.freeze([
  { id: 'apresentacao', name: 'Página de apresentação', price: 1000, discount: 100, summary: 'Uma presença objetiva para começar.', features: ['Uma página com até 5 seções', 'Apresentação, serviços, fotos e contato', 'WhatsApp, redes sociais e localização'] },
  { id: 'profissional', name: 'Site profissional', price: 1500, discount: 200, summary: 'Mais espaço para apresentar seu diferencial.', features: ['Uma página com até 8 seções', 'Depoimentos e perguntas frequentes', 'Formulário de contato com envio por e-mail'] },
  { id: 'institucional', name: 'Site institucional', price: 2000, discount: 300, summary: 'Sua empresa apresentada por completo.', features: ['Até 5 páginas institucionais', 'Serviços organizados individualmente', 'Galeria e formulário de orçamento'] },
  { id: 'catalogo', name: 'Site com catálogo', price: 2500, discount: 400, summary: 'Apresente sua oferta e receba pedidos de orçamento.', features: ['Até 5 páginas institucionais', 'Catálogo de até 20 produtos ou serviços', 'Foto, descrição e orçamento pelo WhatsApp', 'Cadastro inicial incluído; sem loja ou checkout'] },
  { id: 'atendimento', name: 'Site completo com atendimento', price: 3000, discount: 500, summary: 'Apresentação, catálogo e atendimento inicial.', features: ['Tudo do plano com catálogo', 'Configuração inicial da HelenIA', 'Perguntas sobre a empresa e coleta de interesse', 'Encaminhamento ao WhatsApp', 'Consumo de IA contratado separadamente'] }
]);
export const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
export const getPlan = id => PLANS.find(plan => plan.id === id);
