import { readFile, writeFile } from 'node:fs/promises';

const ORIGIN = 'https://camachotecnologia.netlify.app';
const OG_IMAGE = `${ORIGIN}/assets/marca_digital.png`;
const version = (process.env.COMMIT_REF || process.env.DEPLOY_ID || Date.now().toString()).slice(0, 12);

const pages = {
  'index.html': {
    path: '/',
    title: 'Camacho Tecnologia | Sistemas, HelenIA e Automação',
    description: 'Engenharia de sistemas, automação, inteligência artificial, HelenIA, dashboards e sites estratégicos desenvolvidos para a operação real de empresas.'
  },
  'sobre.html': {
    path: '/sobre.html',
    title: 'Sobre | Camacho Tecnologia',
    description: 'Conheça a Camacho Tecnologia e a trajetória que combina desenvolvimento de software, inteligência artificial, gestão, processos e experiência operacional.'
  },
  'servicos.html': {
    path: '/servicos.html',
    title: 'Serviços | Camacho Tecnologia',
    description: 'Sistemas sob medida, automação, inteligência artificial, HelenIA, dashboards e soluções digitais para empresas e organizações.'
  },
  'sites.html': {
    path: '/sites.html',
    title: 'Sites profissionais | Camacho Tecnologia',
    description: 'Sites profissionais e estratégicos desenvolvidos para apresentar negócios, gerar confiança, organizar informações e apoiar a captação de clientes.'
  },
  'portfolio.html': {
    path: '/portfolio.html',
    title: 'Projetos e sistemas | Camacho Tecnologia',
    description: 'Conheça sistemas e soluções digitais desenvolvidos pela Camacho Tecnologia para saúde, comércio, alimentação, gestão pública e serviços.'
  },
  'processo.html': {
    path: '/processo.html',
    title: 'Processo de desenvolvimento | Camacho Tecnologia',
    description: 'Entenda como a Camacho Tecnologia transforma problemas reais em soluções digitais por meio de diagnóstico, arquitetura, validação e implantação.'
  },
  'contato.html': {
    path: '/contato.html',
    title: 'Contato | Camacho Tecnologia',
    description: 'Fale com a Camacho Tecnologia sobre sistemas, automação, inteligência artificial, HelenIA, dashboards ou sites para sua operação.'
  }
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Camacho Tecnologia',
  url: ORIGIN,
  image: OG_IMAGE,
  description: 'Engenharia de sistemas, automação, inteligência artificial, HelenIA, dashboards e sites estratégicos.',
  areaServed: 'BR',
  knowsAbout: ['Desenvolvimento de software', 'Automação', 'Inteligência artificial', 'Dashboards', 'Sites profissionais']
};

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function optimizeImages(html) {
  let firstContentImageSeen = false;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/\bdecoding=/.test(tag)) tag = tag.replace('<img', '<img decoding="async"');

    const isBrandImage = /favicon\.png/i.test(tag);
    if (isBrandImage) return tag;

    if (!firstContentImageSeen) {
      firstContentImageSeen = true;
      if (!/\bfetchpriority=/.test(tag)) tag = tag.replace('<img', '<img fetchpriority="high"');
      return tag;
    }

    if (!/\bloading=/.test(tag)) tag = tag.replace('<img', '<img loading="lazy"');
    return tag;
  });
}

for (const [file, meta] of Object.entries(pages)) {
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch {
    continue;
  }

  const canonical = `${ORIGIN}${meta.path}`;

  html = html
    .replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(meta.title)}</title>`)
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>.*?<\/script>/gis, '')
    .replace(/([\w.-]+\.(?:css|js))\?v=[^"']+/g, `$1?v=${version}`);

  const seo = [
    `<meta name="description" content="${escapeAttr(meta.description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="pt_BR">',
    '<meta property="og:site_name" content="Camacho Tecnologia">',
    `<meta property="og:title" content="${escapeAttr(meta.title)}">`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  ].join('');

  html = html.replace('</head>', `${seo}</head>`);
  html = optimizeImages(html);
  await writeFile(file, html);
}

console.log(`SEO técnico preparado para ${Object.keys(pages).length} páginas. Versão de assets: ${version}`);
