// ============================================
// JVNNI — Enhancement Layer
// AI Assistant · Particles · Cursor · Magnetic
// ============================================

// --- LOGO FALLBACK: fix absolute paths for preview environments ---
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[src^="/img/jvnni-logo"]').forEach(img => {
      img.addEventListener('error', () => {
        const isInProducts = window.location.pathname.includes('/products/');
        const newPath = isInProducts ? '../img/jvnni-logo.jpeg' : 'img/jvnni-logo.jpeg';
        if (img.src !== newPath && !img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = newPath;
        }
      }, { once: true });
    });
  });
})();

// --- LOADING SCREEN ---
(function () {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.querySelector('.loader');
      if (loader) loader.classList.add('hidden');
    }, 1200);
  });
})();

// --- SCROLL PROGRESS ---
(function () {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (window.scrollY / h * 100) + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// --- CUSTOM CURSOR ---
(function () {
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';
  }, { passive: true });

  // The ring used to hold a rAF loop open for the whole session. Now it only
  // runs while it still has ground to cover, and restarts on the next move.
  let ringRunning = false;
  function animateRing() {
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) { ringRunning = false; return; }
    ringX += dx * 0.15;
    ringY += dy * 0.15;
    ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
    requestAnimationFrame(animateRing);
  }
  function kickRing() { if (!ringRunning) { ringRunning = true; requestAnimationFrame(animateRing); } }
  document.addEventListener('mousemove', kickRing, { passive: true });

  // Hover effects on interactive elements
  const hoverables = 'a, button, .product-card, .filter-chip, .brand-card, .review-card, input, textarea, .ai-toggle';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      dot.classList.add('hover');
      ring.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) {
      dot.classList.remove('hover');
      ring.classList.remove('hover');
    }
  });
})();

// --- PARTICLE BACKGROUND ---
(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  // Phones and reduced-motion visitors get no particle field. A full-viewport
  // canvas repainting every frame was one of the main reasons scrolling stuttered.
  if (window.matchMedia('(max-width: 900px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }
  let running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(draw);
  });
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const count = Math.min(50, Math.floor(window.innerWidth / 30));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      o: Math.random() * 0.3 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${p.o})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    if (running) requestAnimationFrame(draw);
  }
  draw();
})();

// --- MAGNETIC BUTTONS ---
(function () {
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 0.3;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

// --- ANIMATED COUNTERS ---
(function () {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        const suffix = el.dataset.counterSuffix || '';
        let current = 0;
        const duration = 1500;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          current = Math.floor(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

// --- PARALLAX HERO ---
(function () {
  const elements = document.querySelectorAll('.parallax');
  if (!elements.length) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        elements.forEach(el => {
          const speed = parseFloat(el.dataset.parallaxSpeed || 0.3);
          el.style.transform = `translateY(${y * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// --- BRAND MARQUEE (huge scrolling brand names) ---
function renderBrandMarquee() {
  const track = document.getElementById('brand-marquee-track');
  if (!track) return;

  // Exact brand order
  const brands = ['BALENCIAGA', 'OFF-WHITE', 'DIOR', 'AMIRI', 'PRADA', 'GUCCI', 'LOUIS VUITTON', 'GOYARD', 'RICK OWENS', 'CHROME HEARTS', 'PALACE', 'YSL'];
  // Duplicate for seamless loop
  const items = [...brands, ...brands];

  track.innerHTML = items.map(b => `<span class="brand-marquee-item" data-brand="${b}" onclick="filterBrandAndScroll('${b.replace(/'/g, "\\'")}');return false;" style="cursor:pointer">${b}</span>`).join('');
  // Also make the hero-stripe-track spans clickable as a fallback
  const stripeTrack = document.querySelector('.hero-stripe-track');
  if (stripeTrack && !stripeTrack.getAttribute('data-wired')) {
    stripeTrack.setAttribute('data-wired', '1');
    stripeTrack.querySelectorAll('span').forEach(span => {
      const brand = span.textContent.trim();
      if (brand) {
        span.style.cursor = 'pointer';
        span.setAttribute('data-brand', brand);
        span.addEventListener('click', function(e) {
          e.preventDefault();
          filterBrandAndScroll(brand);
          return false;
        });
      }
    });
  }
}

// --- CATEGORY PILLS ---
function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const categories = ['All', 'Sneakers', 'Tees', 'Hoodies', 'Apparel', 'Bags', 'Footwear', 'Slippers', 'Accessories'];

  container.innerHTML = categories.map((cat, i) => 
    `<button class="category-pill ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>`
  ).join('') + `<div class="sort-wrap"><select class="sort-select" id="sort-select">
    <option value="featured">Featured</option>
    <option value="price-low">Price: Low to High</option>
    <option value="price-high">Price: High to Low</option>
    <option value="brand-az">Brand A-Z</option>
  </select></div>`;

  container.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.category;
      activeCategory = cat;
      applyFilters();
    });
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    activeSort = e.target.value;
    applyFilters();
  });
}

// --- BRAND FILTER PILLS ---
function renderBrandPills() {
  const container = document.getElementById('brand-pills');
  if (!container) return;

  const brandCounts = {};
  PRODUCTS.forEach(p => {
    const b = p.brand || 'JVNNI';
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  });

  const sorted = Object.entries(brandCounts).sort((a, b) => a[0].localeCompare(b[0]));

  container.innerHTML = `<button class="brand-pill active" data-brand="ALL">ALL BRANDS</button>` +
    sorted.map(([brand]) => `<button class="brand-pill" data-brand="${brand}">${brand}</button>`).join('');

  // Add show more/less toggle
  if (sorted.length > 12) {
    container.classList.add('collapsed');
    const toggle = document.createElement('button');
    toggle.className = 'brand-pill-toggle';
    toggle.textContent = `+${sorted.length - 11} More`;
    container.appendChild(toggle);
    toggle.addEventListener('click', () => {
      container.classList.toggle('collapsed');
      if (container.classList.contains('collapsed')) {
        toggle.textContent = `+${sorted.length - 11} More`;
      } else {
        toggle.textContent = 'Show Less';
      }
    });
  }

  container.querySelectorAll('.brand-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelectorAll('.brand-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeBrand = pill.dataset.brand;
      applyFilters();
    });
  });
}

// --- FILTER STATE ---
let activeCategory = 'All';
let activeBrand = 'ALL';
let activeSort = 'featured';
let searchQuery = '';

// --- APPLY FILTERS (combines category + brand + search + sort) ---
function applyFilters() {
  let filtered = [...PRODUCTS];

  // Category filter
  if (activeCategory !== 'All') {
    const catMap = {
      'Sneakers': ['sneaker', 'runner', 'track', 'speed', 'dunk', 'jordan', 'yeezy', 'b22', 'b30', 'foam', 'slide', 'sandal'],
      'Tees': ['tee', 't-shirt', 'shirt'],
      'Hoodies': ['hoodie', 'sweatshirt', 'fleece'],
      'Apparel': ['jacket', 'pants', 'jeans', 'short', 'coat', 'vest', 'top', 'pant'],
      'Bags': ['bag', 'tote', 'messenger', 'backpack', 'neverfull', 'pouch', 'clutch'],
      'Footwear': ['shoe', 'boot', 'sneaker', 'runner', 'track', 'sandal', 'slide', 'foam', 'mule'],
      'Slippers': ['slide', 'sandal', 'foam', 'mule', 'slipper'],
      'Accessories': ['bracelet', 'earring', 'diamond', 'stud', 'ring', 'chain', 'necklace', 'watch', 'belt', 'sunglass', 'glove', 'scarf', 'hat', 'cap', 'beanie'],
    };
    const keywords = catMap[activeCategory] || [];
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      return keywords.some(kw => title.includes(kw));
    });
  }

  // Brand filter
  if (activeBrand !== 'ALL') {
    filtered = filtered.filter(p => (p.brand || 'JVNNI') === activeBrand);
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => {
      const title = (p.title || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      
      if (q.includes('under') || q.includes('below')) {
        const m = q.match(/\$?(\d+)/);
        if (m) return p.price <= parseInt(m[1]);
      }
      if (q.includes('over') || q.includes('above')) {
        const m = q.match(/\$?(\d+)/);
        if (m) return p.price >= parseInt(m[1]);
      }
      return title.includes(q) || brand.includes(q) || desc.includes(q);
    });
  }

  // Sort
  if (activeSort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  else if (activeSort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  else if (activeSort === 'brand-az') filtered.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));

  // Any filter/search/sort change starts back at page 1
  PAGER.items = filtered;
  PAGER.page = 1;
  renderFilteredProducts(filtered);
}

/* ---- PAGINATION ----
   198 products in one grid meant an endless scroll to reach the footer.
   Show a fixed page of products with Prev / page-number / Next controls. */
const PAGER = { items: [], page: 1, perPage: 24 };

function pagerTotalPages() {
  return Math.max(1, Math.ceil(PAGER.items.length / PAGER.perPage));
}

function goToPage(n) {
  const total = pagerTotalPages();
  PAGER.page = Math.min(Math.max(1, n), total);
  renderFilteredProducts(PAGER.items);
  // Bring them back to the top of the grid instead of leaving them mid-list
  const anchor = document.getElementById('shop') || document.getElementById('product-grid');
  if (anchor) {
    const y = anchor.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
window.goToPage = goToPage;

function renderPager() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  let host = document.getElementById('product-pager');
  if (!host) {
    host = document.createElement('nav');
    host.id = 'product-pager';
    host.className = 'product-pager';
    host.setAttribute('aria-label', 'Product pages');
    grid.insertAdjacentElement('afterend', host);
  }

  const total = pagerTotalPages();
  if (PAGER.items.length === 0 || total <= 1) { host.innerHTML = ''; return; }

  const cur = PAGER.page;
  const from = (cur - 1) * PAGER.perPage + 1;
  const to = Math.min(cur * PAGER.perPage, PAGER.items.length);

  // Compact window of page numbers so the row never overflows on mobile
  const nums = [];
  const push = n => { if (!nums.includes(n) && n >= 1 && n <= total) nums.push(n); };
  push(1);
  for (let n = cur - 1; n <= cur + 1; n++) push(n);
  push(total);
  nums.sort((a, b) => a - b);

  let numHtml = '';
  let prev = 0;
  nums.forEach(n => {
    if (prev && n - prev > 1) numHtml += `<span class="pager-gap" aria-hidden="true">…</span>`;
    numHtml += `<button type="button" class="pager-num${n === cur ? ' is-current' : ''}" data-page="${n}"${n === cur ? ' aria-current="page"' : ''} aria-label="Page ${n}">${n}</button>`;
    prev = n;
  });

  host.innerHTML = `
    <p class="pager-count">Showing <strong>${from}–${to}</strong> of <strong>${PAGER.items.length}</strong></p>
    <div class="pager-row">
      <button type="button" class="pager-btn pager-prev" data-page="${cur - 1}"${cur === 1 ? ' disabled' : ''} aria-label="Previous page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        <span>Prev</span>
      </button>
      <div class="pager-nums">${numHtml}</div>
      <button type="button" class="pager-btn pager-next" data-page="${cur + 1}"${cur === total ? ' disabled' : ''} aria-label="Next page">
        <span>Next</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>`;

  host.querySelectorAll('button[data-page]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.hasAttribute('disabled')) return;
      goToPage(parseInt(b.dataset.page, 10));
    });
  });
}

/* ---- SIZE SELECTION ON PRODUCT CARDS ----
   Customers can pick a size and add to cart directly from the shop grid
   without opening the product detail page. */

// Swap main card image when a thumbnail is clicked
function swapCardImage(thumb) {
  const cardIdx = thumb.getAttribute('data-card-idx');
  const imgIdx = parseInt(thumb.getAttribute('data-img-idx'));
  const mainImg = document.getElementById('card-img-' + cardIdx);
  if (!mainImg) return;
  const p = PRODUCTS[parseInt(cardIdx)];
  if (!p || !p.images || !p.images[imgIdx]) return;
  mainImg.src = IMGW(p.images[imgIdx], 300);
  mainImg.srcset = IMGSET(p.images[imgIdx], [320, 480, 640]);
  // Update active thumb
  const card = thumb.closest('.product-card');
  if (card) {
    card.querySelectorAll('.card-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  }
}

// Central helper: filter shop by brand and scroll to it
function filterBrandAndScroll(brand) {
  const container = document.getElementById('brand-pills');
  if (container) {
    const pill = container.querySelector('.brand-pill[data-brand="' + brand + '"]');
    if (pill) {
      container.querySelectorAll('.brand-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeBrand = pill.dataset.brand;
      applyFilters();
    } else {
      // Brand not in pills list — set directly
      activeBrand = brand;
      applyFilters();
    }
  } else {
    activeBrand = brand;
    applyFilters();
  }
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

/* Mobile-aware brand-link handler on shop cards.
   Desktop: existing behavior — filter shop by brand and scroll.
   Mobile: navigate to the product's real PDP URL (scope rule 1).
   Does NOT touch the ADD TO BAG handler, its variant ID, qty, price, or checkout logic. */
function handleCardBrandClick(e, brand, productHandle) {
  e.stopPropagation();
  // On ALL devices: clicking the brand name filters the shop grid by that brand.
  filterBrandAndScroll(brand);
  return false;
}

function selectCardSize(chip) {
  const card = chip.closest('.product-card');
  if (!card) return;
  card.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
  chip.classList.add('selected');
  // Update the add-to-cart button availability based on selected variant
  const addBtn = card.querySelector('.product-card-quick-add');
  const addTextBtn = card.querySelector('.product-card-btn-add');
  const isAvailable = chip.getAttribute('data-available') === 'true';
  if (addBtn) {
    if (isAvailable) {
      addBtn.classList.remove('disabled');
      addBtn.removeAttribute('disabled');
      addBtn.setAttribute('title', 'Add to bag');
    } else {
      addBtn.classList.add('disabled');
      addBtn.setAttribute('disabled', '');
      addBtn.setAttribute('title', 'Variant unavailable');
    }
  }
  if (addTextBtn) {
    if (isAvailable) {
      addTextBtn.classList.remove('disabled');
      addTextBtn.removeAttribute('disabled');
      addTextBtn.textContent = 'Add to Bag';
    } else {
      addTextBtn.classList.add('disabled');
      addTextBtn.setAttribute('disabled', '');
      addTextBtn.textContent = 'Unavailable';
    }
  }
}

function addToCartFromCard(handle, globalIdx) {
  const card = document.querySelector('.product-card[data-product-id="' + globalIdx + '"]');
  let variantId = null;
  if (card) {
    const selectedChip = card.querySelector('.size-chip.selected');
    if (selectedChip) variantId = selectedChip.getAttribute('data-variant-id');
  }
  // Fallback to product default variant
  if (!variantId && PRODUCTS[globalIdx]) {
    variantId = PRODUCTS[globalIdx].variantId || null;
  }
  if (window.JVNNICart) window.JVNNICart.add(handle, 1, variantId);
}

function renderFilteredProducts(items) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  // Keep the pager in sync when called directly (e.g. first paint)
  if (PAGER.items !== items) { PAGER.items = items; PAGER.page = 1; }

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-muted);">No products found. Try a different filter or search.</p>`;
    renderPager();
    return;
  }

  const start = (PAGER.page - 1) * PAGER.perPage;
  const pageItems = items.slice(start, start + PAGER.perPage);

  grid.innerHTML = pageItems.map((p, i) => {
    const globalIdx = PRODUCTS.indexOf(p);
    const imgs = (p.images && p.images.length > 0) ? p.images : [p.image];
    const img = imgs[0];
    const designer = p.brand || p.vendor || 'JVNNI';
    // Short description: truncate at word boundary, max ~120 chars
    let shortDesc = '';
    if (p.description) {
      const d = p.description.replace(/\s+/g, ' ').trim();
      if (d.length > 120) {
        shortDesc = d.substring(0, 117).replace(/\s+\S*$/, '') + '…';
      } else {
        shortDesc = d;
      }
    }
    // Gallery thumbnails (mini image switcher)
    const hasThumbs = imgs.length > 1;
    const thumbsHtml = hasThumbs ? '<div class="card-thumbs">' + imgs.slice(0, 5).map(function(timg, tIdx) {
      return '<button class="card-thumb' + (tIdx === 0 ? ' active' : '') + '" data-card-idx="' + globalIdx + '" data-img-idx="' + tIdx + '" onclick="event.stopPropagation();swapCardImage(this)" aria-label="View image ' + (tIdx + 1) + '">' +
        '<img src="' + IMGW(timg, 80) + '" alt="" width="40" height="40" loading="lazy" decoding="async" crossorigin="anonymous">' +
        '</button>';
    }).join('') + '</div>' : '';
    // Build clickable size chips from real Shopify variant/options data
    // Show sizes from Size option OR from variant titles when option is "Title" but variants have real names
    let sizeChips = '';
    let sizeSummaryHtml = '';
    let defaultVariantId = p.variantId || (p.variants && p.variants[0] ? p.variants[0].id : null);
    let sizeBadge = '';
    let selectedVariantAvailable = true;
    const sizeOpt = (p.options || []).find(o => /size/i.test(o.name || ''));
    if (sizeOpt && sizeOpt.values && sizeOpt.values.length > 0) {
      const sizes = sizeOpt.values.map(v => {
        const clean = String(v).replace(/^mens?\s*sz\.?\s*/i, "Men's ").replace(/^womens?\s*sz\.?\s*/i, "Women's ").trim();
        return clean;
      }).filter(v => v && !/^default title$/i.test(v));
      if (sizes.length > 0) {
        // Map each size to its variant ID (first matching available variant)
        const sizeVariants = sizes.map((s, idx) => {
          const originalValue = sizeOpt.values[idx];
          const variant = (p.variants || []).find(v => v.title && v.title.includes(originalValue));
          return { size: s, variantId: variant ? variant.id : defaultVariantId, available: variant ? variant.available : false };
        });
        // Default to first available variant
        const firstAvail = sizeVariants.find(sv => sv.available) || sizeVariants[0];
        defaultVariantId = firstAvail.variantId;
        selectedVariantAvailable = firstAvail.available;
        sizeBadge = sizes.length + ' Size' + (sizes.length > 1 ? 's' : '');
        sizeChips = '<div class="product-card-sizes">' +
          '<div class="product-card-sizes-chips">' +
          sizeVariants.map(sv =>
            '<button class="size-chip' + (sv === firstAvail ? ' selected' : '') + (!sv.available ? ' size-chip-disabled' : '') +
            '" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '" onclick="event.stopPropagation();selectCardSize(this)"' +
            (!sv.available ? ' disabled' : '') + '>' + sv.size + '</button>'
          ).join('') +
          '</div></div>';
        const summaryList = sizes.length > 4 ? sizes.slice(0, 4).join(', ') + ' +' + (sizes.length - 4) : sizes.join(', ');
        sizeSummaryHtml = '<p class="product-card-sizes-summary">' + (sizes.length > 1 ? 'Sizes: ' : 'Size: ') + summaryList + '</p>';
      }
    } else if (p.variants && p.variants.length > 1) {
      // No "Size" option but multiple variants — extract sizes from variant titles
      const sizes = p.variants.map(v => {
        const clean = String(v.title || '').replace(/^mens?\s*sz\.?\s*/i, "Men's ").replace(/^womens?\s*sz\.?\s*/i, "Women's ").split(' / ')[0].trim();
        return clean;
      }).filter(v => v && !/^default title$/i.test(v) && !/^#/.test(v));
      if (sizes.length > 0) {
        const uniqueSizes = [];
        const seen = {};
        sizes.forEach(s => { if (!seen[s]) { seen[s] = true; uniqueSizes.push(s); } });
        const sizeVariants = uniqueSizes.map(s => {
          const variant = (p.variants || []).find(v => {
            const c = String(v.title || '').replace(/^mens?\s*sz\.?\s*/i, "Men's ").replace(/^womens?\s*sz\.?\s*/i, "Women's ").split(' / ')[0].trim();
            return c === s;
          });
          return { size: s, variantId: variant ? variant.id : defaultVariantId, available: variant ? variant.available : false };
        });
        const firstAvail = sizeVariants.find(sv => sv.available) || sizeVariants[0];
        defaultVariantId = firstAvail.variantId;
        selectedVariantAvailable = firstAvail.available;
        sizeBadge = uniqueSizes.length + ' Size' + (uniqueSizes.length > 1 ? 's' : '');
        sizeChips = '<div class="product-card-sizes">' +
          '<div class="product-card-sizes-chips">' +
          sizeVariants.map(sv =>
            '<button class="size-chip' + (sv === firstAvail ? ' selected' : '') + (!sv.available ? ' size-chip-disabled' : '') +
            '" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '" onclick="event.stopPropagation();selectCardSize(this)"' +
            (!sv.available ? ' disabled' : '') + '>' + sv.size + '</button>'
          ).join('') +
          '</div></div>';
        const summaryList = uniqueSizes.length > 4 ? uniqueSizes.slice(0, 4).join(', ') + ' +' + (uniqueSizes.length - 4) : uniqueSizes.join(', ');
        sizeSummaryHtml = '<p class="product-card-sizes-summary">' + (uniqueSizes.length > 1 ? 'Sizes: ' : 'Size: ') + summaryList + '</p>';
      }
    } else if (p.description && /Size\s*:/i.test(p.description)) {
      // No Size option and no multiple variants, but size info is in the description
      const sizeMatch = p.description.match(/Size\s*:\s*([^.\n]+?)(?:\s+(?:Material|Condition|Brand|Model|Colorway|Upper|Outsole|Heel|Laces|Features|SKU|Item):|\.\s|$)/i);
      if (sizeMatch) {
        const sizeText = sizeMatch[1].trim();
        // Show full size string as a single chip
        const sizeVariants = [{ size: sizeText, variantId: defaultVariantId, available: true }];
        sizeBadge = '1 Size';
        sizeChips = '<div class="product-card-sizes">' +
          '<div class="product-card-sizes-chips">' +
          sizeVariants.map(sv =>
            '<button class="size-chip selected" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '" onclick="event.stopPropagation();selectCardSize(this)">' + sv.size + '</button>'
          ).join('') +
          '</div></div>';
        sizeSummaryHtml = '<p class="product-card-sizes-summary">Size: ' + sizeText + '</p>';
      }
    } else if (p.title && /\bsz\s*\d/i.test(p.title)) {
      // No Size option, no description size, but product title has size (e.g. "Mens Sz 10")
      const titleSizeMatch = p.title.match(/sz\s*(\d+)/i);
      if (titleSizeMatch) {
        const sz = 'sz' + titleSizeMatch[1];
        const sizeVariants = [{ size: sz, variantId: defaultVariantId, available: true }];
        sizeBadge = '1 Size';
        sizeChips = '<div class="product-card-sizes">' +
          '<div class="product-card-sizes-chips">' +
          sizeVariants.map(sv =>
            '<button class="size-chip selected" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '" onclick="event.stopPropagation();selectCardSize(this)">' + sv.size + '</button>'
          ).join('') +
          '</div></div>';
        sizeSummaryHtml = '<p class="product-card-sizes-summary">Size: ' + sz + '</p>';
      }
    } else {
      // No size data anywhere — show "One Size" as a blue chip
      const sizeVariants = [{ size: 'One Size', variantId: defaultVariantId, available: true }];
      sizeBadge = '1 Size';
      sizeChips = '<div class="product-card-sizes">' +
        '<div class="product-card-sizes-chips">' +
        sizeVariants.map(sv =>
          '<button class="size-chip selected" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '" onclick="event.stopPropagation();selectCardSize(this)">' + sv.size + '</button>'
        ).join('') +
        '</div></div>';
      sizeSummaryHtml = '<p class="product-card-sizes-summary">Size: One Size</p>';
    }
    return `<article class="product-card" data-product-id="${globalIdx}" ${i < 6 ? `data-stagger style="animation-delay:${i * 40}ms"` : ''}>
      <div class="product-card-image">
        <img class="card-main-img" id="card-img-${globalIdx}" src="${IMGW(img, 300)}" srcset="${IMGSET(img, [320, 480, 640])}" sizes="(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 300px" alt="${p.title}" width="300" height="300" loading="lazy" decoding="async" crossorigin="anonymous"
          onerror="this.style.background='var(--color-surface-2)';this.style.display='none';">
        <span class="product-card-badge">${designer}</span>
        ${sizeBadge ? '<span class="product-card-size-badge">' + sizeBadge + '</span>' : ''}
        <button class="product-card-quick-add${!selectedVariantAvailable ? ' disabled' : ''}" onclick="event.stopPropagation();${selectedVariantAvailable ? "addToCartFromCard('" + p.handle + "'," + globalIdx + ")" : ''}" aria-label="Add ${p.title} to bag" title="${selectedVariantAvailable ? 'Add to bag' : 'Variant unavailable'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>
        </button>
      </div>
      <div class="product-card-info">
        <a href="../index.html#shop" class="product-card-brand-link" data-brand="${designer.replace(/"/g, '&quot;')}" data-handle="${p.handle}" onclick="return handleCardBrandClick(event,'${designer.replace(/'/g, "\\'")}','${p.handle}');"><div class="product-card-brand">${designer}</div></a>
        <h3 class="product-card-title product-card-tap-target">${p.title}</h3>
        <div class="product-card-price">$${p.price.toFixed(2)}</div>
        ${shortDesc ? '<p class="product-card-desc">' + shortDesc + '</p>' : ''}
        ${sizeChips || sizeSummaryHtml}
        <div class="product-card-actions">
          <button class="product-card-btn-add${!selectedVariantAvailable ? ' disabled' : ''}" onclick="event.stopPropagation();${selectedVariantAvailable ? "addToCartFromCard('" + p.handle + "'," + globalIdx + ")" : ''}">${selectedVariantAvailable ? 'Add to Bag' : 'Unavailable'}</button>
        </div>
      </div>
    </article>`;
  }).join('');

  initCardTilt();
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const idx = parseInt(card.dataset.productId);
      if (window.matchMedia('(max-width: 767px)').matches) {
        // Mobile: tapping the card (main image / brand / title) opens the real PDP.
        // ADD TO BAG and the brand link already stopPropagation and handle themselves.
        const p = PRODUCTS[idx];
        if (p && p.handle) {
          window.__jvnni_return_brand = activeBrand || 'ALL';
          window.location.href = 'products/' + encodeURIComponent(p.handle) + '.html';
        }
        return;
      }
      openModalByIndex(idx);
    });
  });

  renderPager();
}

// --- BRAND NAME LINK: filter by brand when clicked on product card ---
document.addEventListener('jvnni-filter-brand', (e) => {
  const brand = e.detail;
  if (!brand) return;
  const pills = document.querySelectorAll('.brand-pill');
  pills.forEach(p => p.classList.remove('active'));
  const target = document.querySelector(`.brand-pill[data-brand="${brand}"]`);
  if (target) {
    target.classList.add('active');
    activeBrand = brand;
  } else {
    activeBrand = brand;
  }
  applyFilters();
  // Scroll to shop section
  const shop = document.getElementById('shop');
  if (shop) shop.scrollIntoView({ behavior: 'smooth' });
});

// --- SMART SEARCH ---
function initSmartSearch() {
  const input = document.getElementById('smart-search');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    }, 300);
  });
}

// Helper for quick-add and search result modals - uses global PRODUCTS index
function openModalByIndex(idx) {
  const p = PRODUCTS[idx];
  if (!p) return;

  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const modalImg = overlay.querySelector('.modal-image img');
  modalImg.src = p.image;
  modalImg.alt = p.title;
  overlay.querySelector('.modal-brand').textContent = p.brand || 'JVNNI';
  overlay.querySelector('.modal-title').textContent = p.title;
  overlay.querySelector('.modal-price').textContent = '$' + p.price.toFixed(2);
  // Short description for modal too (truncated at word boundary)
  let modalDesc = '';
  if (p.description) {
    const d = p.description.replace(/\s+/g, ' ').trim();
    if (d.length > 200) {
      modalDesc = d.substring(0, 197).replace(/\s+\S*$/, '') + '…';
    } else {
      modalDesc = d;
    }
  } else {
    modalDesc = 'Premium authenticated designer item. Comes with original packaging and authenticity verification.';
  }
  overlay.querySelector('.modal-desc').textContent = modalDesc;

  // --- SIZES ---
  const sizesEl = overlay.querySelector('.modal-sizes');
  const sizeOpt = (p.options || []).find(o => /size/i.test(o.name || ''));
  let modalSelectedVariantId = p.variantId || (p.variants && p.variants[0] ? p.variants[0].id : null);
  let modalSelectedAvailable = true;
  if (sizeOpt && sizeOpt.values && sizeOpt.values.length > 0) {
    const sizes = sizeOpt.values.map(v => {
      const clean = String(v).replace(/^mens?\s*sz\.?\s*/i, "Men's ").replace(/^womens?\s*sz\.?\s*/i, "Women's ").trim();
      return clean;
    }).filter(v => v && !/^default title$/i.test(v));
    if (sizes.length > 0) {
      // Map each size to its variant ID and availability
      const sizeVariants = sizes.map((s, idx) => {
        const originalValue = sizeOpt.values[idx];
        const variant = (p.variants || []).find(v => v.title && v.title.includes(originalValue));
        return { size: s, variantId: variant ? variant.id : modalSelectedVariantId, available: variant ? variant.available : false };
      });
      const firstAvail = sizeVariants.find(sv => sv.available) || sizeVariants[0];
      modalSelectedVariantId = firstAvail.variantId;
      modalSelectedAvailable = firstAvail.available;
      sizesEl.innerHTML = '<span class="modal-sizes-label">Available Sizes</span><div class="modal-sizes-chips">' +
        sizeVariants.map(sv =>
          '<button class="size-chip' + (sv === firstAvail ? ' selected' : '') + (!sv.available ? ' size-chip-disabled' : '') +
          '" data-variant-id="' + sv.variantId + '" data-available="' + sv.available + '"' +
          (!sv.available ? ' disabled' : '') + '>' + sv.size + '</button>'
        ).join('') +
        '</div>';
      sizesEl.style.display = '';
      // Wire up size chip clicks in modal
      sizesEl.querySelectorAll('.size-chip').forEach(chip => {
        chip.onclick = function(e) {
          e.stopPropagation();
          sizesEl.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          modalSelectedVariantId = chip.getAttribute('data-variant-id');
          modalSelectedAvailable = chip.getAttribute('data-available') === 'true';
          // Update add-to-bag button
          const addBtn = overlay.querySelector('#modal-add-cart');
          if (addBtn) {
            if (modalSelectedAvailable) {
              addBtn.classList.remove('disabled');
              addBtn.removeAttribute('disabled');
              addBtn.textContent = 'Add to Bag';
            } else {
              addBtn.classList.add('disabled');
              addBtn.setAttribute('disabled', '');
              addBtn.textContent = 'Unavailable';
            }
          }
        };
      });
    } else {
      sizesEl.style.display = 'none';
    }
  } else {
    sizesEl.style.display = 'none';
  }

  // --- GALLERY ---
  const images = p.images || (p.image ? [p.image] : []);
  const thumbsEl = overlay.querySelector('.modal-thumbs');
  const prevBtn = overlay.querySelector('.modal-gallery-prev');
  const nextBtn = overlay.querySelector('.modal-gallery-next');
  const countEl = overlay.querySelector('.modal-gallery-count');
  let currentImgIdx = 0;

  if (images.length > 1) {
    // Show gallery controls
    thumbsEl.innerHTML = images.map((src, i) =>
      '<button type="button" class="modal-thumb' + (i === 0 ? ' is-active' : '') + '" data-idx="' + i + '" aria-label="Show image ' + (i + 1) + ' of ' + images.length + '"><img src="' + src + '" alt="' + p.title + ' photo ' + (i + 1) + '" loading="lazy" decoding="async"></button>'
    ).join('');
    thumbsEl.style.display = '';
    prevBtn.style.display = '';
    nextBtn.style.display = '';
    countEl.textContent = '1 / ' + images.length;
    countEl.style.display = '';

    // Thumbnail click handler
    thumbsEl.querySelectorAll('.modal-thumb').forEach(thumb => {
      thumb.onclick = function(e) {
        e.stopPropagation();
        currentImgIdx = parseInt(this.dataset.idx);
        modalImg.src = images[currentImgIdx];
        thumbsEl.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('is-active'));
        this.classList.add('is-active');
        countEl.textContent = (currentImgIdx + 1) + ' / ' + images.length;
      };
    });

    // Prev/next handlers
    prevBtn.onclick = function(e) {
      e.stopPropagation();
      currentImgIdx = (currentImgIdx - 1 + images.length) % images.length;
      modalImg.src = images[currentImgIdx];
      thumbsEl.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('is-active'));
      thumbsEl.querySelector('.modal-thumb[data-idx="' + currentImgIdx + '"]')?.classList.add('is-active');
      countEl.textContent = (currentImgIdx + 1) + ' / ' + images.length;
    };
    nextBtn.onclick = function(e) {
      e.stopPropagation();
      currentImgIdx = (currentImgIdx + 1) % images.length;
      modalImg.src = images[currentImgIdx];
      thumbsEl.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('is-active'));
      thumbsEl.querySelector('.modal-thumb[data-idx="' + currentImgIdx + '"]')?.classList.add('is-active');
      countEl.textContent = (currentImgIdx + 1) + ' / ' + images.length;
    };
  } else {
    // Single image — hide gallery controls
    thumbsEl.style.display = 'none';
    thumbsEl.innerHTML = '';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    countEl.style.display = 'none';
  }

  // Route to this product's own detail page — never the homepage, never off-site
  const viewBtn = overlay.querySelector('#modal-view-shopify');
  if (viewBtn && p.handle) {
    viewBtn.href = 'products/' + encodeURIComponent(p.handle) + '.html';
    viewBtn.removeAttribute('target');
    viewBtn.setAttribute('aria-label', 'View full details for ' + p.title);
  }

  // Add to bag
  const addBtn = overlay.querySelector('#modal-add-cart');
  if (addBtn) {
    // Set initial state based on default selected variant
    if (!modalSelectedAvailable) {
      addBtn.classList.add('disabled');
      addBtn.setAttribute('disabled', '');
      addBtn.textContent = 'Unavailable';
    } else {
      addBtn.classList.remove('disabled');
      addBtn.removeAttribute('disabled');
      addBtn.textContent = 'Add to Bag';
    }
    addBtn.onclick = () => {
      if (!modalSelectedAvailable) return;
      if (window.JVNNICart) {
        window.JVNNICart.add(p.handle, 1, modalSelectedVariantId);
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        window.JVNNICart.open();
      }
    };
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// --- AI STYLE ASSISTANT ---
(function () {
  const toggle = document.querySelector('.ai-toggle');
  const panel = document.querySelector('.ai-panel');
  const closeBtn = document.querySelector('.ai-close');
  const messages = document.querySelector('.ai-messages');
  const input = document.querySelector('.ai-input');
  const sendBtn = document.querySelector('.ai-send');
  const suggestions = document.querySelector('.ai-suggestions');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => panel.classList.toggle('open'));
  closeBtn?.addEventListener('click', () => panel.classList.remove('open'));

  const greeting = `Hi! I'm JVNNI's AI Style Assistant. I can help you find the perfect piece from our 198-product collection. Ask me about brands, prices, styles, or just tell me what you're looking for.`;

  function addMessage(text, type = 'bot') {
    const msg = document.createElement('div');
    msg.className = type === 'user' ? 'ai-msg ai-msg-user' : 'ai-msg ai-msg-bot';
    // User-typed input is rendered as plain text so markup can never execute.
    // Bot copy is developer-authored and may contain trusted inline markup.
    if (type === 'user') {
      msg.textContent = text;
    } else {
      msg.innerHTML = text;
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function addProductCard(product) {
    const msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg-bot';
    msg.innerHTML = `Here's a match for you:`;
    const card = document.createElement('div');
    card.className = 'ai-msg-product';
    card.innerHTML = `
      <img src="${IMGW(product.image, 420)}" alt="${product.title}" loading="lazy" decoding="async" crossorigin="anonymous">
      <div class="ai-msg-product-info">
        <div class="ai-msg-product-brand">${product.brand || 'JVNNI'}</div>
        <div class="ai-msg-product-title">${product.title}</div>
        <div class="ai-msg-product-price">$${product.price.toFixed(2)}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      panel.classList.remove('open');
      // Find product index in PRODUCTS array and use openModalByIndex for full gallery+sizes
      const idx = PRODUCTS.findIndex(p => p.handle === product.handle);
      if (idx >= 0) {
        openModalByIndex(idx);
      } else {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
          overlay.querySelector('.modal-image img').src = product.image;
          overlay.querySelector('.modal-image img').alt = product.title;
          overlay.querySelector('.modal-brand').textContent = product.brand || 'JVNNI';
          overlay.querySelector('.modal-title').textContent = product.title;
          overlay.querySelector('.modal-price').textContent = '$' + product.price.toFixed(2);
          overlay.querySelector('.modal-desc').textContent = product.description || 'Premium authenticated designer item.';
          overlay.querySelector('.modal-sizes').style.display = 'none';
          overlay.querySelector('.modal-thumbs').style.display = 'none';
          overlay.querySelector('.modal-gallery-prev').style.display = 'none';
          overlay.querySelector('.modal-gallery-next').style.display = 'none';
          overlay.querySelector('.modal-gallery-count').style.display = 'none';
          overlay.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      }
    });
    msg.appendChild(card);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    return typing;
  }

  function aiResponse(query) {
    const q = query.toLowerCase();

    // Price queries
    if (q.includes('under') || q.includes('below') || q.includes('cheap')) {
      const match = q.match(/\$?(\d+)/);
      if (match) {
        const max = parseInt(match[1]);
        const results = PRODUCTS.filter(p => p.price <= max).slice(0, 3);
        if (results.length) {
          let response = `I found ${results.length} great options under $${max}. Here are some highlights:`;
          setTimeout(() => {
            addMessage(response);
            results.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
          }, 600);
          return;
        }
      }
    }

    if (q.includes('over') || q.includes('above') || q.includes('expensive') || q.includes('premium') || q.includes('luxury')) {
      const match = q.match(/\$?(\d+)/);
      const min = match ? parseInt(match[1]) : 500;
      const results = PRODUCTS.filter(p => p.price >= min).slice(0, 3);
      if (results.length) {
        setTimeout(() => {
          addMessage(`Here are our premium pieces over $${min}:`);
          results.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
        }, 600);
        return;
      }
    }

    // Brand queries
    for (const brand of BRANDS) {
      if (q.includes(brand.toLowerCase())) {
        const results = PRODUCTS.filter(p => p.brand === brand);
        if (results.length) {
          const sample = results.slice(0, 3);
          setTimeout(() => {
            addMessage(`We have ${results.length} ${brand} items in stock. Here are some standouts:`);
            sample.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
          }, 600);
          return;
        }
      }
    }

    // Category queries
    const categories = {
      'sneaker': ['sneaker', 'runner', 'track', 'speed', 'dunk', 'jordan'],
      'hoodie': ['hoodie', 'sweatshirt'],
      'tee': ['tee', 't-shirt', 'shirt'],
      'slide': ['slide', 'sandal', 'foam runner'],
      'bag': ['bag', 'tote', 'messenger', 'backpack'],
      'jewelry': ['bracelet', 'earring', 'diamond'],
    };

    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => q.includes(kw))) {
        const results = PRODUCTS.filter(p =>
          keywords.some(kw => p.title.toLowerCase().includes(kw) || (p.brand || '').toLowerCase().includes(kw))
        ).slice(0, 3);
        if (results.length) {
          setTimeout(() => {
            addMessage(`Here are some ${cat}s I think you'll love:`);
            results.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
          }, 600);
          return;
        }
      }
    }

    // Color queries
    const colors = ['black', 'white', 'blue', 'green', 'red', 'pink', 'orange', 'purple', 'gold', 'silver', 'cream', 'beige'];
    for (const color of colors) {
      if (q.includes(color)) {
        const results = PRODUCTS.filter(p =>
          p.title.toLowerCase().includes(color) || (p.description || '').toLowerCase().includes(color)
        ).slice(0, 3);
        if (results.length) {
          setTimeout(() => {
            addMessage(`Found some great ${color} pieces for you:`);
            results.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
          }, 600);
          return;
        }
      }
    }

    // Recommendation
    if (q.includes('recommend') || q.includes('suggest') || q.includes('best') || q.includes('popular') || q.includes('what should')) {
      const popular = PRODUCTS.filter(p => p.price >= 300 && p.price <= 800).sort(() => Math.random() - 0.5).slice(0, 3);
      setTimeout(() => {
        addMessage(`Based on our bestsellers, here are my top picks for you:`);
        popular.forEach((p, i) => setTimeout(() => addProductCard(p), i * 500 + 300));
      }, 600);
      return;
    }

    // Authenticity
    if (q.includes('authentic') || q.includes('real') || q.includes('legit') || q.includes('trust')) {
      setTimeout(() => {
        addMessage(`Every item at JVNNI is 100% authentic. We source directly from authorized retailers and trusted consignors. Each order includes original packaging, receipt, and proof of authenticity. We've served thousands of verified purchases with a 5.0 rating.`);
      }, 600);
      return;
    }

    // Shipping
    if (q.includes('ship') || q.includes('delivery') || q.includes('arrive') || q.includes('how long')) {
      setTimeout(() => {
        addMessage(`Most orders arrive within 3-5 business days. We offer free shipping on all orders over $500. You'll receive tracking information as soon as your order ships.`);
      }, 600);
      return;
    }

    // Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('start')) {
      setTimeout(() => {
        addMessage(`Hey! Welcome to JVNNI. I can help you find designer sneakers, hoodies, tees, bags, and more. What are you looking for today? You can ask about specific brands, price ranges, or styles.`);
      }, 600);
      return;
    }

    // Default
    setTimeout(() => {
      addMessage(`I can help you find products by brand, price, style, or color. Try asking:<br>• "Show me Balenciaga sneakers"<br>• "What's under $300?"<br>• "I want a black hoodie"<br>• "Recommend something premium"`);
    }, 600);
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';
    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      aiResponse(text);
    }, 400 + Math.random() * 400);
  }

  sendBtn?.addEventListener('click', () => sendMessage(input.value));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(input.value);
  });

  suggestions?.addEventListener('click', (e) => {
    const s = e.target.closest('.ai-suggestion');
    if (s) sendMessage(s.textContent);
  });

  // Initialize with greeting
  setTimeout(() => addMessage(greeting), 500);
})();

// --- INIT ENHANCEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  renderBrandMarquee();
  renderCategoryPills();
  renderBrandPills();
  initSmartSearch();
  // Restore brand/filter context if we're returning from a mobile PDP tap (card, brand link,
  // or carousel), so the visitor lands back where they were instead of a fresh 'ALL' view.
  const returnBrand = window.__jvnni_return_brand || null;
  if (returnBrand) {
    window.__jvnni_return_brand = null;
    const pill = document.querySelector('.brand-pill[data-brand="' + returnBrand + '"]');
    if (pill) {
      document.querySelectorAll('.brand-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    }
    activeBrand = returnBrand;
  }
  applyFilters();
});

// --- 3D COVERFLOW BRAND CAROUSEL ---
(function () {
  const track = document.getElementById('brand-3d-track');
  const stage = document.getElementById('brand-3d-stage');
  if (!track || !stage) return;

  const brands = ['BALENCIAGA', 'OFF-WHITE', 'DIOR', 'AMIRI', 'PRADA', 'GUCCI', 'LOUIS VUITTON', 'GOYARD', 'RICK OWENS', 'CHROME HEARTS', 'PALACE', 'YSL'];
  let current = 0;
  let isAnimating = false;

  // Create items
  track.innerHTML = brands.map((b, i) => 
    `<div class="brand-3d-item" data-brand="${b}" data-index="${i}">${b}</div>`
  ).join('');

  const items = track.querySelectorAll('.brand-3d-item');
  const counterEl = document.getElementById('brand-3d-current');

  function update() {
    items.forEach((item, i) => {
      const offset = i - current;
      const absOffset = Math.abs(offset);
      
      // Only show items within range
      if (absOffset > 3) {
        item.style.opacity = '0';
        item.style.transform = `translateX(${offset * 180}px) scale(0.5)`;
        item.style.pointerEvents = 'none';
        return;
      }
      
      item.style.pointerEvents = 'auto';
      item.style.opacity = absOffset === 0 ? '1' : Math.max(0.2, 1 - absOffset * 0.35);
      
      // Coverflow: center item flat, side items rotated and scaled down
      const x = offset * 180;
      const rotateY = offset * -35;
      const scale = absOffset === 0 ? 1.1 : Math.max(0.6, 1 - absOffset * 0.2);
      const z = absOffset === 0 ? 50 : -absOffset * 50;
      
      item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      item.style.zIndex = 100 - absOffset;
      item.style.filter = absOffset === 0 ? 'none' : `blur(${absOffset * 1.5}px)`;
      
      item.classList.toggle('active', absOffset === 0);
    });

    if (counterEl) counterEl.textContent = current + 1;
  }

  function goTo(index) {
    current = ((index % brands.length) + brands.length) % brands.length;
    update();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // Navigation buttons
  document.getElementById('brand-3d-next')?.addEventListener('click', next);
  document.getElementById('brand-3d-prev')?.addEventListener('click', prev);

  // Click on item — filter shop by that brand (all visible items, not just centered)
  items.forEach(item => {
    item.addEventListener('click', () => {
      const brand = item.dataset.brand;
      if (brand) {
        filterBrandAndScroll(brand);
      }
    });
  });

  // Drag/swipe support
  let dragStartX = 0;
  let isDragging = false;

  stage.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev(); else next();
    }
  });

  stage.addEventListener('touchstart', (e) => {
    dragStartX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev(); else next();
    }
  });

  // Auto-advance every 4 seconds
  let autoTimer = setInterval(next, 4000);

  // Pause on hover
  stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
  stage.addEventListener('mouseleave', () => { autoTimer = setInterval(next, 4000); });

  // Initial render
  update();
})();

// --- INIT ENHANCEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  renderBrandMarquee();
  renderCategoryPills();
  renderBrandPills();
  initSmartSearch();
  // Restore brand/filter context if we're returning from a mobile PDP tap (card, brand link,
  // or carousel), so the visitor lands back where they were instead of a fresh 'ALL' view.
  const returnBrand = window.__jvnni_return_brand || null;
  if (returnBrand) {
    window.__jvnni_return_brand = null;
    const pill = document.querySelector('.brand-pill[data-brand="' + returnBrand + '"]');
    if (pill) {
      document.querySelectorAll('.brand-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    }
    activeBrand = returnBrand;
  }
  applyFilters();
});

// --- 3D INTERACTIVE BRAND RING ---
(function () {
  const ring = document.getElementById('brand-3d-ring');
  const stage = document.getElementById('brand-3d-stage');
  if (!ring || !stage) return;

  const brands = ['BALENCIAGA', 'OFF-WHITE', 'DIOR', 'AMIRI', 'PRADA', 'GUCCI', 'LOUIS VUITTON', 'GOYARD', 'RICK OWENS', 'CHROME HEARTS', 'PALACE', 'YSL'];
  const radius = 400;
  const angleStep = 360 / brands.length;
  let rotation = 0;
  let autoSpeed = 0.15;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRotation = 0;
  let velocity = 0;
  let hoverBoost = 1;

  // Create brand items
  ring.innerHTML = brands.map((b, i) => {
    const angle = i * angleStep;
    return `<div class="brand-3d-item" data-brand="${b}" style="transform: rotateY(${angle}deg) translateZ(${radius}px)">${b}</div>`;
  }).join('');

  // Center the ring items
  ring.style.transformOrigin = 'center center';

  const items = ring.querySelectorAll('.brand-3d-item');

  // Click to filter
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      if (isDragging) return;
      e.stopPropagation();
      const brand = item.dataset.brand;
      // Find and click the matching brand pill
      const pill = document.querySelector(`.brand-pill[data-brand="${brand}"]`);
      if (pill) {
        pill.click();
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Drag interaction
  stage.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartRotation = rotation;
    velocity = 0;
    ring.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartX) * 0.5;
    rotation = dragStartRotation + delta;
    velocity = delta * 0.1;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    ring.style.transition = 'transform 0.1s linear';
  });

  // Touch support
  stage.addEventListener('touchstart', (e) => {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartRotation = rotation;
    velocity = 0;
    ring.style.transition = 'none';
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const delta = (e.touches[0].clientX - dragStartX) * 0.5;
    rotation = dragStartRotation + delta;
    velocity = delta * 0.1;
  }, { passive: true });

  stage.addEventListener('touchend', () => {
    isDragging = false;
    ring.style.transition = 'transform 0.1s linear';
  });

  // Hover to speed up
  stage.addEventListener('mouseenter', () => { hoverBoost = 3; });
  stage.addEventListener('mouseleave', () => { hoverBoost = 1; });

  // Animation loop
  function animate() {
    if (!isDragging) {
      // Apply velocity decay then resume auto-rotate
      if (Math.abs(velocity) > 0.1) {
        rotation += velocity;
        velocity *= 0.92;
      } else {
        velocity = 0;
        rotation += autoSpeed * hoverBoost;
      }
    }

    ring.style.transform = `rotateY(${-rotation}deg)`;

    // Update item opacity/scale based on position (front items visible, back hidden)
    items.forEach((item, i) => {
      const angle = (i * angleStep - rotation) % 360;
      const normalized = ((angle + 540) % 360) - 180;
      const absNorm = Math.abs(normalized);
      // Front items (0deg) fully visible, back items (180deg) invisible
      const opacity = Math.max(0, 1 - absNorm / 120);
      const blur = Math.min(3, absNorm / 60);
      item.style.opacity = opacity;
      item.style.filter = `blur(${blur}px)`;
      // Don't override the transform set by inline style - use CSS vars
      item.style.zIndex = Math.round(100 - absNorm);
    });

    requestAnimationFrame(animate);
  }
  animate();
})();

// --- 3D SHOE CAROUSEL ---
(function () {
  const track = document.getElementById('shoe-carousel-track');
  const stage = document.getElementById('shoe-carousel-stage');
  if (!track || !stage || typeof PRODUCTS === 'undefined') return;

  // Hand-picked house brands, in this order. One hero piece per brand: the
  // priciest one that actually has a CDN image behind it.
  // Every piece from the six hero houses whose photo has been cut out to a
  // transparent background — no white or black plates behind the product.
  // Shuffled on each visit so the reel never opens the same way twice.
  const CUTOUTS = (window.HERO_CUTOUTS || []);
  const byHandle = {};
  PRODUCTS.forEach(p => { byHandle[p.handle] = p; });

  const featured = CUTOUTS
    .map(c => {
      const p = byHandle[c.h];
      if (!p || !(p.price > 0)) return null;
      return { brand: c.b, title: p.title, price: p.price, handle: c.h, cut: c.i };
    })
    .filter(Boolean);

  // Fisher-Yates, so the brands interleave instead of arriving in blocks.
  for (let k = featured.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    const t = featured[k]; featured[k] = featured[r]; featured[r] = t;
  }

  if (featured.length < 3) return;

  let current = 0;

  track.innerHTML = featured.map((p, i) => {
    const isCutout = p.cut && /\.webp$/.test(p.cut);
    const itemClass = isCutout ? 'shoe-carousel-item is-cutout' : 'shoe-carousel-item is-photo';
    const imgAttrs = isCutout
      ? `<img data-src="${p.cut}" alt="${p.title}" width="560" height="560" crossorigin="anonymous" decoding="async">`
      : `<img data-src="${IMGW(p.cut, 400)}" alt="${p.title}" width="560" height="560" crossorigin="anonymous" decoding="async">`;
    return `<div class="${itemClass}" data-index="${i}">${imgAttrs}</div>`;
  }).join('');

  const items = track.querySelectorAll('.shoe-carousel-item');
  const infoBrand = document.querySelector('.shoe-carousel-brand');
  const infoTitle = document.querySelector('.shoe-carousel-title');
  const infoPrice = document.querySelector('.shoe-carousel-price');

  // Only the panels in play carry a real src, so opening the page costs five
  // images instead of sixty-five.
  function hydrate(centre) {
    const total = items.length;
    for (let d = -2; d <= 2; d++) {
      const idx = ((centre + d) % total + total) % total;
      const img = items[idx].querySelector('img');
      if (img && !img.getAttribute('src')) {
        img.setAttribute('src', img.dataset.src);
        img.setAttribute('fetchpriority', d === 0 ? 'high' : 'low');
      }
    }
  }

  function update() {
    hydrate(current);
    const total = items.length;
    items.forEach((item, i) => {
      // Wrap the offset so the ring is circular — there is always a previous
      // and a next panel flanking the middle one, even at the ends of the list.
      let offset = i - current;
      if (total > 1) {
        if (offset > total / 2) offset -= total;
        else if (offset < -total / 2) offset += total;
      }
      const absOffset = Math.abs(offset);

      if (absOffset > 3) {
        item.style.opacity = '0';
        const sp = parseFloat(getComputedStyle(stage).getPropertyValue('--carousel-spread')) || 200;
        item.style.transform = `translateX(${offset * sp * 0.6}px) scale(0.4)`;
        item.style.pointerEvents = 'none';
        return;
      }

      item.style.pointerEvents = 'auto';
      // Only the front panel and its two neighbours are shown, so nothing
      // gets clipped by the neon frame around the carousel.
      item.style.opacity = absOffset === 0 ? '1' : absOffset === 1 ? '0.72' : '0';

      const spread = parseFloat(getComputedStyle(stage).getPropertyValue('--carousel-spread')) || 200;
      const x = offset * spread;
      const rotateY = offset * -30;
      const scale = absOffset === 0 ? 1 : Math.max(0.55, 1 - absOffset * 0.22);
      const z = absOffset === 0 ? 60 : -absOffset * 40;

      item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      item.style.zIndex = 100 - absOffset;
      item.style.filter = absOffset === 0 ? 'none' : `blur(${absOffset * 1.5}px)`;
      item.classList.toggle('active', absOffset === 0);
    });

    const p = featured[current];
    if (p) {
      if (infoBrand) infoBrand.textContent = p.brand || 'JVNNI';
      if (infoTitle) infoTitle.textContent = p.title;
      if (infoPrice) infoPrice.textContent = '$' + p.price.toFixed(2);
      const info = document.getElementById('shoe-carousel-info');
      if (info) info.setAttribute('aria-label', 'View ' + p.title + ' — ' + (p.brand || 'JVNNI'));
    }
  }

  function goTo(index) {
    current = ((index % featured.length) + featured.length) % featured.length;
    update();
  }

  document.getElementById('shoe-next')?.addEventListener('click', () => goTo(current + 1));
  document.getElementById('shoe-prev')?.addEventListener('click', () => goTo(current - 1));

  // Desktop (unchanged): click a side item to bring it forward; click the front item to open its page.
  // Mobile-only fix: every visible item (centered or not) filters the shop grid by its brand and
  // scrolls/focuses the shop section, using the same filterBrandAndScroll() the brand pills use.
  const isMobileCarousel = () => window.matchMedia('(max-width: 767px)').matches;
  items.forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      if (isMobileCarousel()) {
        const p = featured[idx];
        if (p && p.brand) filterBrandAndScroll(p.brand);
        return;
      }
      if (idx !== current) { goTo(idx); return; }
      const p = featured[current];
      if (p && p.handle) window.location.href = 'products/' + encodeURIComponent(p.handle) + '.html';
    });
  });

  // The brand label below the panels is the explicit, keyboard-reachable link.
  const infoEl = document.getElementById('shoe-carousel-info');
  if (infoEl) {
    infoEl.setAttribute('role', 'link');
    infoEl.setAttribute('tabindex', '0');
    const openCurrent = () => {
      const p = featured[current];
      if (isMobileCarousel()) {
        if (p && p.brand) filterBrandAndScroll(p.brand);
        return;
      }
      if (p && p.handle) window.location.href = 'products/' + encodeURIComponent(p.handle) + '.html';
    };
    infoEl.addEventListener('click', openCurrent);
    infoEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCurrent(); }
    });
  }

  // Drag/swipe
  let dragStartX = 0;
  let isDragging = false;

  stage.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goTo(current - 1); else goTo(current + 1);
    }
  });

  stage.addEventListener('touchstart', (e) => {
    dragStartX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goTo(current - 1); else goTo(current + 1);
    }
  });

  // Auto-advance
  let autoTimer = setInterval(() => goTo(current + 1), 3500);
  stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
  stage.addEventListener('mouseleave', () => { autoTimer = setInterval(() => goTo(current + 1), 3500); });

  update();
})();

/* ============================================================
   Travelling frame glow
   The old rotating conic gradient swept angularly, so on a wide, short box it
   crawled along the top and bottom and whipped across the short sides — it read
   as "only moving on the top". This walks a dashed stroke around the actual
   perimeter instead, so the comet travels at one constant speed all the way
   round the frame.
   ============================================================ */
(function frameRunner() {
  const block = document.querySelector('.hero-carousel-block');
  if (!block) return;
  const svg = block.querySelector('.frame-runner');
  if (!svg) return;
  const rects = Array.prototype.slice.call(svg.querySelectorAll('rect'));
  if (!rects.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let anims = [];

  function layout() {
    const w = Math.round(block.clientWidth);
    const h = Math.round(block.clientHeight);
    if (!w || !h) return;

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    const r = Math.min(24, Math.min(w, h) / 2);
    rects.forEach(function (rc) {
      rc.setAttribute('x', 1.5);
      rc.setAttribute('y', 1.5);
      rc.setAttribute('width', Math.max(0, w - 3));
      rc.setAttribute('height', Math.max(0, h - 3));
      rc.setAttribute('rx', r);
    });

    // rounded-rect perimeter: straight runs + one full circle of corners
    const per = 2 * (w - 3) + 2 * (h - 3) - 8 * r + 2 * Math.PI * r;
    const comet = Math.max(120, per * 0.13);
    rects.forEach(function (rc) {
      rc.style.strokeDasharray = comet + ' ' + Math.max(1, per - comet);
    });

    anims.forEach(function (a) { a.cancel(); });
    anims = [];
    if (reduce || !rects[0].animate) return;
    rects.forEach(function (rc) {
      anims.push(rc.animate(
        [{ strokeDashoffset: 0 }, { strokeDashoffset: -per }],
        { duration: 5600, iterations: Infinity, easing: 'linear' }
      ));
    });
  }

  layout();

  let raf = 0;
  const relayout = function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(layout);
  };
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(block);
  else window.addEventListener('resize', relayout, { passive: true });

  // Don't burn frames while the frame is scrolled away or the tab is hidden.
  const setPlaying = function (on) {
    anims.forEach(function (a) { try { on ? a.play() : a.pause(); } catch (e) {} });
  };
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      setPlaying(entries[0].isIntersecting);
    }, { rootMargin: '80px' }).observe(block);
  }
  document.addEventListener('visibilitychange', function () {
    setPlaying(document.visibilityState === 'visible');
  });
})();
