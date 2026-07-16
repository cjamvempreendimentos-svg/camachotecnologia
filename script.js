(() => {
  'use strict';

  const stylesheetHref = 'site-updates.css';
  if (!document.querySelector(`link[href="${stylesheetHref}"]`)) {
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
      portfolioLink
        ? navigation.insertBefore(sitesLink, portfolioLink)
        : navigation.appendChild(sitesLink);
    }

    menuButton.setAttribute('aria-controls', 'navlinks');

    const setMenuState = (isOpen) => {
      navigation.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      menuButton.textContent = isOpen ? '✕ Fechar' : '☰ Menu';
    };

    setMenuState(false);
    menuButton.addEventListener('click', () => {
      setMenuState(!navigation.classList.contains('open'));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('click', (event) => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuState(false);
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  }

  const modal = document.getElementById('imageModal');
  if (modal) {
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = modal.querySelector('.modal-content');
    let previousFocus = null;

    const getSafeAssetUrl = (source) => {
      if (!source) return null;
      try {
        const url = new URL(source, document.baseURI);
        return url.origin === window.location.origin && url.pathname.startsWith('/assets/')
          ? url.href
          : null;
      } catch {
        return null;
      }
    };

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      modalImage.removeAttribute('src');
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };

    document.querySelectorAll('[data-preview], [data-image]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const safeUrl = getSafeAssetUrl(trigger.dataset.preview || trigger.dataset.image);
        if (!safeUrl) return;

        previousFocus = document.activeElement;
        modalImage.src = safeUrl;
        modalImage.alt = trigger.dataset.title || 'Visualização ampliada';
        modalTitle.textContent = trigger.dataset.title || 'Visualização do sistema';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        modalContent?.focus();
      });
    });

    modal.querySelectorAll('[data-close-modal]').forEach((item) => {
      item.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  async function loadVisitorCounter() {
    const footerGrid = document.querySelector('.footer .footer-grid');
    if (!footerGrid) return;

    const counter = document.createElement('div');
    counter.className = 'visitor-counter';
    counter.setAttribute('aria-live', 'polite');

    const dot = document.createElement('span');
    dot.className = 'visitor-dot';
    dot.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.id = 'visitorCount';
    label.textContent = 'Visitas: —';

    counter.append(dot, label);
    footerGrid.insertAdjacentElement('afterend', counter);

    const visitStorageKey = 'camachoVisitCountedAt';
    const visitWindowMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    let alreadyCounted = false;

    try {
      const countedAt = Number(localStorage.getItem(visitStorageKey));
      const countedInCurrentSession = sessionStorage.getItem('camachoVisitCounted') === '1';

      if (Number.isFinite(countedAt) && countedAt > 0 && now - countedAt < visitWindowMs) {
        alreadyCounted = true;
      } else if (countedInCurrentSession) {
        localStorage.setItem(visitStorageKey, String(now));
        alreadyCounted = true;
      } else if (countedAt) {
        localStorage.removeItem(visitStorageKey);
      }
    } catch {
      try {
        alreadyCounted = sessionStorage.getItem('camachoVisitCounted') === '1';
      } catch {
        alreadyCounted = false;
      }
    }

    try {
      const response = await fetch('/api/visitor-count', {
        method: alreadyCounted ? 'GET' : 'POST',
        headers: { accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('counter-unavailable');

      const data = await response.json();
      const value = Number(data.count);
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('invalid-counter');

      if (!alreadyCounted) {
        try {
          localStorage.setItem(visitStorageKey, String(now));
          sessionStorage.setItem('camachoVisitCounted', '1');
        } catch {
          try {
            sessionStorage.setItem('camachoVisitCounted', '1');
          } catch {
            // O contador continua funcionando quando o armazenamento é bloqueado.
          }
        }
      }

      label.textContent = `Visitas: ${value.toLocaleString('pt-BR')}`;
    } catch {
      counter.remove();
    }
  }

  loadVisitorCounter();
})();
