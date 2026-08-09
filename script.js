(() => {
  'use strict';

  function mountHeleniaFloating() {
    if (document.querySelector('.helenia-floating')) return;

    const style = document.createElement('style');
    style.textContent = `
      .helenia-floating{position:fixed;right:18px;bottom:92px;z-index:140;width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fffdf8;color:#9d6e12;border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 2px #cba24b,0 15px 36px rgba(0,0,0,.32);text-decoration:none;transition:transform .2s ease,box-shadow .2s ease;isolation:isolate}
      .helenia-floating:before{content:'';position:absolute;inset:5px;border:1px solid #d8ba72;border-radius:50%;z-index:-1}
      .helenia-floating:hover,.helenia-floating:focus-visible{transform:translateY(-3px) scale(1.04);box-shadow:0 0 0 2px #d6ad54,0 20px 42px rgba(0,0,0,.38);outline:none}
      .helenia-float-mark{font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:.9;font-style:italic;color:#c89019;margin-top:2px}
      .helenia-float-name{font-family:Georgia,'Times New Roman',serif;font-size:10px;line-height:1;margin-top:5px;color:#8b6417}
      .helenia-float-online{position:absolute;right:8px;top:8px;width:8px;height:8px;border-radius:50%;background:#24b36b;border:2px solid #fff;box-shadow:0 0 0 1px rgba(36,179,107,.25)}
      .helenia-floating .helenia-float-tip{position:absolute;right:82px;white-space:nowrap;background:#06152a;color:#f5fbff;border:1px solid rgba(82,221,255,.24);border-radius:10px;padding:8px 11px;font:700 11px/1.2 Inter,Segoe UI,Arial,sans-serif;opacity:0;transform:translateX(6px);pointer-events:none;transition:.2s;box-shadow:0 10px 28px rgba(0,0,0,.25)}
      .helenia-floating:hover .helenia-float-tip,.helenia-floating:focus-visible .helenia-float-tip{opacity:1;transform:none}
      @media(max-width:650px){.helenia-floating{right:14px;bottom:88px;width:66px;height:66px}.helenia-float-mark{font-size:22px}.helenia-floating .helenia-float-tip{display:none}.floating{right:18px;bottom:16px}}
      @media(prefers-reduced-motion:reduce){.helenia-floating{transition:none}.helenia-floating:hover,.helenia-floating:focus-visible{transform:none}}
    `;
    document.head.appendChild(style);

    const link = document.createElement('a');
    link.className = 'helenia-floating';
    link.href = document.getElementById('helenia') ? '#helenia' : '/#helenia';
    link.setAttribute('aria-label', 'Conversar com a HelenIA');
    link.innerHTML = '<span class="helenia-float-mark" aria-hidden="true">H</span><span class="helenia-float-name" aria-hidden="true">HelenIA</span><i class="helenia-float-online" aria-hidden="true"></i><span class="helenia-float-tip" aria-hidden="true">Conversar com a HelenIA</span>';
    document.body.appendChild(link);
  }

  mountHeleniaFloating();

  const stylesheetHref = 'site-updates.css?v=20260808-5';
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href.includes('site-updates.css'))) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = stylesheetHref;
    document.head.appendChild(stylesheet);
  }

  const menuButton = document.getElementById('menuBtn');
  const navigation = document.getElementById('navlinks');
  if (menuButton && navigation) {
    if (!navigation.querySelector('a[href="sites.html"]')) {
      const sitesLink = document.createElement('a');
      sitesLink.href = 'sites.html';
      sitesLink.textContent = 'Sites';
      const portfolioLink = navigation.querySelector('a[href="portfolio.html"]');
      portfolioLink ? navigation.insertBefore(sitesLink, portfolioLink) : navigation.appendChild(sitesLink);
    }
    menuButton.setAttribute('aria-controls', 'navlinks');
    const setMenuState = isOpen => {
      navigation.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      menuButton.textContent = isOpen ? '✕ Fechar' : '☰ Menu';
    };
    setMenuState(false);
    menuButton.addEventListener('click', () => setMenuState(!navigation.classList.contains('open')));
    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuState(false)));
    document.addEventListener('click', event => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenuState(false);
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenuState(false); });
  }

  const revealItems = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) revealItems.forEach(item => item.classList.add('visible'));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  }

  const modal = document.getElementById('imageModal');
  if (modal) {
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = modal.querySelector('.modal-content');
    let previousFocus = null;
    const getSafeAssetUrl = source => {
      try { const url = new URL(source, document.baseURI); return url.origin === location.origin && url.pathname.startsWith('/assets/') ? url.href : null; }
      catch { return null; }
    };
    const closeModal = () => {
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); modalImage.removeAttribute('src');
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
    document.querySelectorAll('[data-preview], [data-image]').forEach(trigger => trigger.addEventListener('click', () => {
      const safeUrl = getSafeAssetUrl(trigger.dataset.preview || trigger.dataset.image); if (!safeUrl) return;
      previousFocus = document.activeElement; modalImage.src = safeUrl; modalImage.alt = trigger.dataset.title || 'Visualização ampliada'; modalTitle.textContent = trigger.dataset.title || 'Visualização do sistema';
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); modalContent?.focus();
    }));
    modal.querySelectorAll('[data-close-modal]').forEach(item => item.addEventListener('click', closeModal));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  }

  function getVisitorId() {
    const key = 'camachoAnalyticsVisitor';
    try {
      let value = localStorage.getItem(key);
      if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
      return value;
    } catch { return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  }
  const visitor = getVisitorId();
  const source = (() => {
    const params = new URLSearchParams(location.search);
    if (params.get('utm_source')) return params.get('utm_source').slice(0, 80);
    if (!document.referrer) return 'Direto';
    try { const host = new URL(document.referrer).hostname.replace(/^www\./, ''); return host === location.hostname ? 'Navegação interna' : host; }
    catch { return 'Direto'; }
  })();
  window.camachoTrack = (event, label = '') => {
    fetch('/api/metrics/track', {
      method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ event, visitor, page: location.pathname, source, label })
    }).catch(() => {});
  };
  window.camachoTrack('page_view');

  document.addEventListener('click', event => {
    const link = event.target.closest('a,button'); if (!link) return;
    const href = link.getAttribute('href') || '';
    const text = (link.textContent || '').trim().toLowerCase();
    if (href.includes('wa.me')) window.camachoTrack('whatsapp_click', 'WhatsApp');
    if (href.includes('instagram.com')) window.camachoTrack('instagram_click', 'Instagram');
    if (href.includes('portfolio') || text.includes('case') || text.includes('projeto')) window.camachoTrack('case_view', 'Portfólio');
    const interest = href.includes('sites') ? 'Sites' : text.includes('helenia') ? 'HelenIA' : text.includes('sistema') ? 'Sistemas' : text.includes('automação') || text.includes(' ia') ? 'Automação e IA' : text.includes('dashboard') ? 'Dashboards' : '';
    if (interest) window.camachoTrack('interest', interest);
  });

  async function loadVisitorCounter() {
    const footerGrid = document.querySelector('.footer .footer-grid'); if (!footerGrid) return;
    const counter = document.createElement('div'); counter.className = 'visitor-counter'; counter.setAttribute('aria-live', 'polite');
    const dot = document.createElement('span'); dot.className = 'visitor-dot'; dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.id = 'visitorCount'; label.textContent = 'Visitas: —'; counter.append(dot, label); footerGrid.insertAdjacentElement('afterend', counter);
    const key = 'camachoVisitCountedAt', windowMs = 86400000, now = Date.now(); let counted = false;
    try { const at = Number(localStorage.getItem(key)); counted = Number.isFinite(at) && at > 0 && now - at < windowMs; }
    catch { counted = false; }
    try {
      const response = await fetch('/api/visitor-count', { method: counted ? 'GET' : 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(); const data = await response.json(); const value = Number(data.count); if (!Number.isSafeInteger(value) || value < 0) throw new Error();
      if (!counted) try { localStorage.setItem(key, String(now)); } catch {}
      label.textContent = `Visitas: ${value.toLocaleString('pt-BR')}`;
    } catch { counter.remove(); }
  }
  loadVisitorCounter();
})();