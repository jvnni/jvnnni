// JVNNI Cart — on-site cart with Shopify checkout handoff
(function () {
  const SHOP_DOMAIN = 'https://721k2s-qn.myshopify.com';

  // In-memory cart state (persistent storage is unavailable in the preview iframe)
  let memory = [];
  const store = {
    get() { return memory; },
    set(v) { memory = v; }
  };

  const money = (n) => '$' + Number(n).toFixed(2);

  const els = {};
  function cacheEls() {
    els.drawer = document.getElementById('cart-drawer');
    els.overlay = document.getElementById('cart-overlay');
    els.items = document.getElementById('cart-items');
    els.empty = document.getElementById('cart-empty');
    els.foot = document.getElementById('cart-foot');
    els.subtotal = document.getElementById('cart-subtotal-value');
    els.badge = document.querySelector('.nav-cart-badge');
  }

  function findProduct(handle) {
    if (typeof PRODUCTS === 'undefined') return null;
    return PRODUCTS.find(p => p.handle === handle) || null;
  }

  // Find a variant by ID within a product's variants array
  function findVariant(p, variantId) {
    if (!p || !variantId) return null;
    return (p.variants || []).find(v => String(v.id) === String(variantId)) || null;
  }

  // Clean up a variant title for display (e.g. "Mens Sz 10 / #DDC478:Sand" -> "Men's 10")
  function cleanVariantLabel(variant, p) {
    if (!variant) return '';
    // Never show "Default Title" as a size label
    const title = variant.title || '';
    if (/^default title$/i.test(title.trim())) return '';
    // If product has a Size option, extract just the size portion
    const sizeOpt = (p.options || []).find(o => /size/i.test(o.name || ''));
    if (sizeOpt && sizeOpt.values) {
      // Try to match the size value within the variant title
      for (const sv of sizeOpt.values) {
        if (title.includes(sv)) {
          return String(sv).replace(/^mens?\s*sz\.?\s*/i, "Men's ").replace(/^womens?\s*sz\.?\s*/i, "Women's ").trim();
        }
      }
    }
    // Fallback: use the variant title but strip color codes
    return title.replace(/\s*\/\s*#[0-9a-fA-F]{6}:[^,]+/g, '').trim();
  }

  // Unique line key per product+variant
  function lineKey(handle, variantId) {
    return handle + '::' + (variantId || 'default');
  }

  function render() {
    const cart = store.get();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

    if (els.badge) {
      els.badge.textContent = count;
      els.badge.style.display = count > 0 ? '' : '';
    }

    const isEmpty = cart.length === 0;
    if (els.empty) els.empty.style.display = isEmpty ? 'flex' : 'none';
    if (els.items) els.items.style.display = isEmpty ? 'none' : 'flex';
    if (els.foot) els.foot.style.display = isEmpty ? 'none' : 'block';

    if (els.subtotal) els.subtotal.textContent = money(subtotal);

    if (!els.items || isEmpty) return;

    els.items.innerHTML = cart.map(item => `
      <div class="cart-item" data-handle="${item.handle}" data-variant-id="${item.variantId || ''}">
        <div class="cart-item-img">
          <img src="${IMGW(item.image, 72)}" alt="${item.title}" width="72" height="72" loading="lazy" decoding="async" crossorigin="anonymous">
        </div>
        <div>
          <div class="cart-item-brand">${item.brand || 'JVNNI'}</div>
          <div class="cart-item-title">${item.title}</div>
          ${item.variantLabel ? '<div class="cart-item-variant">Size: ' + item.variantLabel + '</div>' : ''}
          ${item.status === 'DRAFT' ? '<div class="cart-item-draft">Enquire — not yet live</div>' : ''}
          <div class="cart-qty">
            <button data-act="dec" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button data-act="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${money(item.price * item.qty)}</div>
          <button class="cart-item-remove" data-act="remove">Remove</button>
        </div>
      </div>
    `).join('');
  }

  function toast(msg) {
    let t = document.querySelector('.cart-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'cart-toast';
      document.body.appendChild(t);
    }
    t.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg> ${msg}`;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function open() {
    els.drawer?.classList.add('open');
    els.overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    els.drawer?.classList.remove('open');
    els.overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function add(handle, qty, variantId) {
    const p = findProduct(handle);
    if (!p) return;
    const cart = store.get().slice();
    const v = findVariant(p, variantId);
    const vId = variantId || p.variantId || null;
    const vPrice = v ? v.price : p.price;
    const vLabel = v ? cleanVariantLabel(v, p) : '';
    const key = lineKey(handle, vId);
    const existing = cart.find(i => lineKey(i.handle, i.variantId) === key);
    if (existing) {
      existing.qty += (qty || 1);
    } else {
      cart.push({
        handle: p.handle,
        variantId: vId,
        variantLabel: vLabel,
        title: p.title,
        brand: p.brand,
        price: vPrice,
        image: p.image,
        status: p.status || 'ACTIVE',
        qty: qty || 1
      });
    }
    store.set(cart);
    render();
    toast('Added to bag');
  }

  function update(handle, variantId, delta) {
    const cart = store.get().slice();
    const key = lineKey(handle, variantId);
    const item = cart.find(i => lineKey(i.handle, i.variantId) === key);
    if (!item) return;
    item.qty += delta;
    const next = item.qty <= 0 ? cart.filter(i => lineKey(i.handle, i.variantId) !== key) : cart;
    store.set(next);
    render();
  }

  function remove(handle, variantId) {
    const key = lineKey(handle, variantId);
    store.set(store.get().filter(i => lineKey(i.handle, i.variantId) !== key));
    render();
  }

  function checkout() {
    const cart = store.get();
    if (!cart.length) return;

    const withVariant = cart.filter(i => i.variantId);

    if (!withVariant.length) {
      // No variant IDs available — fall back to the storefront
      window.open(SHOP_DOMAIN, '_blank', 'noopener');
      return;
    }

    // Open a blank tab synchronously to avoid popup blocking on iOS Safari
    var popup = window.open('', '_blank');
    const items = withVariant.map(i => ({ id: i.variantId, quantity: i.qty }));
    const checkoutBtn = document.getElementById('cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.6';
      checkoutBtn.textContent = 'Redirecting...';
    }

    fetch(SHOP_DOMAIN + '/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Cart add failed');
      return res.json();
    })
    .then(function() {
      if (popup && !popup.closed) {
        popup.location.href = SHOP_DOMAIN + '/checkout';
      } else {
        window.location.href = SHOP_DOMAIN + '/checkout';
      }
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '';
        checkoutBtn.textContent = 'Secure Checkout';
      }
    })
    .catch(function(err) {
      if (popup && !popup.closed) popup.close();
      // Fallback: use the bridge page if direct AJAX fails
      const pairs = withVariant.map(i => i.variantId + ':' + i.qty).join(',');
      window.open('/checkout/?items=' + encodeURIComponent(pairs), '_blank', 'noopener');
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '';
        checkoutBtn.textContent = 'Secure Checkout';
      }
    });
  }

  // Public API
  window.JVNNICart = { add, open, close, checkout, render, count: () => store.get().reduce((s, i) => s + i.qty, 0) };

  document.addEventListener('DOMContentLoaded', () => {
    cacheEls();
    render();

    document.getElementById('nav-cart-btn')?.addEventListener('click', open);
    document.getElementById('cart-close')?.addEventListener('click', close);
    els.overlay?.addEventListener('click', close);
    document.getElementById('cart-checkout')?.addEventListener('click', checkout);
    document.getElementById('cart-empty-shop')?.addEventListener('click', () => {
      close();
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Item controls
    els.items?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const row = btn.closest('.cart-item');
      const handle = row?.dataset.handle;
      const variantId = row?.dataset.variantId || null;
      if (!handle) return;
      const act = btn.dataset.act;
      if (act === 'inc') update(handle, variantId, 1);
      else if (act === 'dec') update(handle, variantId, -1);
      else if (act === 'remove') remove(handle, variantId);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  });
})();
