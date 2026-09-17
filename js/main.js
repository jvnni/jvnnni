// ============================================
// JVNNI — Interactive Frontend Logic
// ============================================

// --- THEME: always defaults to light, remembers an explicit toggle choice ---
(function () {
  var root = document.documentElement;
  var MOONSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SUNSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';

  function stored() {
    return window.__jvnni_theme || null;
  }
  // Always default to light — the inline head script already set this before first paint.
  var theme = root.getAttribute('data-theme') || stored() || 'light';
  root.setAttribute('data-theme', theme);

  var toggle = document.querySelector('[data-theme-toggle]');
  function paint() { if (toggle) toggle.innerHTML = theme === 'dark' ? SUNSVG : MOONSVG; }
  paint();

  if (toggle) {
    toggle.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      root.setAttribute('data-theme-source', 'user');
      window.__jvnni_theme = theme;
      paint();
    });
  }

  // Do NOT follow device color scheme — always default to light unless user toggled.
})();

// --- NAV SCROLL EFFECT ---
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  });
})();

// --- MOBILE MENU ---
(function () {
  const btn = document.querySelector('.nav-menu-btn');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();

// --- SMOOTH SCROLL ---
document.querySelectorAll('[data-scroll-to]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(el.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// --- SCROLL REVEAL ---
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// --- 3D CARD TILT ---
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -6;
      const rotateY = ((x - cx) / cx) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// --- PRODUCT RENDERING ---
function renderProducts(filter = 'ALL') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let items = PRODUCTS;
  if (filter !== 'ALL') {
    items = PRODUCTS.filter(p => p.brand === filter);
  }

  if (items.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-muted);">No products found. Try a different filter.</p>';
    return;
  }

  grid.innerHTML = items.map((p, i) => {
    const imgs = (p.images && p.images.length > 0) ? p.images : [p.image];
    const mainSrc = IMGW(imgs[0], 300);
    const mainSrcset = IMGSET(imgs[0], [320, 480, 640]);
    const hasThumbs = imgs.length > 1;
    const thumbsHtml = hasThumbs ? '<div class="card-thumbs">' + imgs.slice(0, 6).map(function(img, idx) {
      return '<button class="card-thumb' + (idx === 0 ? ' active' : '') + '" data-card-idx="' + i + '" data-img-idx="' + idx + '" aria-label="View image ' + (idx + 1) + '">' +
        '<img src="' + IMGW(img, 80) + '" alt="" width="40" height="40" loading="lazy" decoding="async" crossorigin="anonymous">' +
        '</button>';
    }).join('') + '</div>' : '';

    return '    <article class="product-card" data-product-id="' + i + '" data-stagger style="animation-delay:' + Math.min(i * 30, 600) + 'ms">' +
      '      <div class="product-card-image">' +
      '        <img class="card-main-img" id="card-img-' + i + '" src="' + mainSrc + '" srcset="' + mainSrcset + '" sizes="(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 300px" alt="' + p.title + '" width="300" height="300" loading="lazy" decoding="async" crossorigin="anonymous"' +
      '          onerror="this.style.background=&#39;var(--color-surface-2)&#39;;this.style.display=&#39;none&#39;;">' +
      '        <span class="product-card-badge">' + (p.brand || 'JVNNI') + '</span>' +
      thumbsHtml +
      '        <button class="product-card-quick-add" onclick="event.stopPropagation();openModalByIndex(' + i + ')" aria-label="Quick view">' +
      '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>' +
      '        </button>' +
      '      </div>' +
      '      <div class="product-card-info">' +
      '        <a href="#shop" class="product-card-brand-link" onclick="event.stopPropagation();window.dispatchEvent(new CustomEvent(\'jvnni-filter-brand\',{detail:\'' + (p.brand || 'JVNNI').replace(/'/g, "\\'") + '\'}));return false;"><div class="product-card-brand">' + (p.brand || 'JVNNI') + '</div></a>' +
      '        <h3 class="product-card-title">' + p.title + '</h3>' +
      '        <div class="product-card-price">' + p.price.toFixed(2) + '</div>' +
      '      </div>' +
    '    </article>';
  }).join('');

  // Thumbnail click handler — swap main card image
  grid.querySelectorAll('.card-thumb').forEach(function(thumb) {
    thumb.addEventListener('click', function(e) {
      e.stopPropagation();
      var cardIdx = parseInt(this.dataset.cardIdx);
      var imgIdx = parseInt(this.dataset.imgIdx);
      var p = PRODUCTS[cardIdx];
      if (!p) return;
      var imgs = (p.images && p.images.length > 0) ? p.images : [p.image];
      var mainImg = document.getElementById('card-img-' + cardIdx);
      if (mainImg && imgs[imgIdx]) {
        mainImg.src = IMGW(imgs[imgIdx], 300);
        mainImg.srcset = IMGSET(imgs[imgIdx], [320, 480, 640]);
      }
      // Update active state
      var card = this.closest('.product-card-image');
      if (card) {
        card.querySelectorAll('.card-thumb').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
      }
    });
  });

  // Re-init tilt and reveal
  initCardTilt();
  initModalTriggers();

  // Re-observe new reveal elements
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- FILTER CHIPS ---
function initFilters() {
  const container = document.getElementById('shop-filters');
  if (!container) return;

  // Add "ALL" + brands
  const allBrands = ['ALL', ...BRANDS];
  container.innerHTML = allBrands.map(brand => `
    <button class="filter-chip ${brand === 'ALL' ? 'active' : ''}" data-filter="${brand}">${brand}</button>
  `).join('');

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderProducts(chip.dataset.filter);
  });
}

// --- PRODUCT MODAL ---
function initModalTriggers() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.productId);
      openModal(id);
    });
  });
}

function openModal(productId) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  // Find product by index in current filter
  const activeFilter = document.querySelector('.filter-chip.active');
  const filter = activeFilter ? activeFilter.dataset.filter : 'ALL';
  let items = PRODUCTS;
  if (filter !== 'ALL') items = PRODUCTS.filter(p => p.brand === filter);
  const p = items[productId];
  if (!p) return;

  overlay.querySelector('.modal-image img').src = p.image;
  overlay.querySelector('.modal-image img').alt = p.title;
  overlay.querySelector('.modal-brand').textContent = p.brand || 'JVNNI';
  overlay.querySelector('.modal-title').textContent = p.title;
  const priceEl = overlay.querySelector('.modal-price');
  if (priceEl) priceEl.textContent = '$' + p.price.toFixed(2);
  overlay.querySelector('.modal-desc').textContent = p.description || 'Premium authenticated designer item. Comes with original packaging and authenticity verification. Price negotiable — DM for more pics or proof of authenticity.';

  overlay.classList.add('open');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// --- CONTACT FORM ---
// This is a static site with no backend, so the form hands the message off to the
// customer's own email client addressed to support. It must never claim to have
// sent something it hasn't.
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const SUPPORT_EMAIL = 'support@jvnni.com';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    const name = (form.querySelector('[name="name"]') || {}).value || '';
    const email = (form.querySelector('[name="email"]') || {}).value || '';
    const message = (form.querySelector('[name="message"]') || {}).value || '';

    const subject = `JVNNI enquiry from ${name.trim() || 'a customer'}`;
    const body = `${message.trim()}\n\n—\nName: ${name.trim()}\nReply to: ${email.trim()}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    btn.textContent = 'Opening email...';
    btn.disabled = true;

    window.location.href = mailto;

    setTimeout(() => {
      btn.textContent = 'Check your email app';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    }, 600);
  });
})();

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  // Filtering handled by enhancements.js (brand pills + category pills + sort)
  initFilters();

  // Modal close handlers
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.modal-close') || e.target.closest('.modal-close-bottom')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }
});
