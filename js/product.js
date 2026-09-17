/* JVNNI — dynamic product detail page
 * Resolves its product from the URL path (/products/<handle>/) with a
 * ?handle= fallback. Never redirects to the homepage on its own; an unknown
 * handle renders an inline "not found" panel with a link back to the shop.
 */
(function () {
  'use strict';

  var SHOP_DOMAIN = 'https://721k2s-qn.myshopify.com';

  /* ---------- resolve handle from the URL ---------- */
  function handleFromUrl() {
    var qs = new URLSearchParams(window.location.search).get('handle');
    if (qs) return qs.trim();

    // /products/<handle>/ or /products/<handle>/index.html
    var parts = window.location.pathname.split('/').filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === 'products' && parts[i + 1]) {
        var h = parts[i + 1];
        if (h === 'index.html') break;
        return decodeURIComponent(h.replace(/\.html$/, ''));
      }
    }
    // fall back to the handle baked into the page by the generator
    var meta = document.querySelector('meta[name="jvnni:handle"]');
    return meta ? meta.content : '';
  }

  var HANDLE = handleFromUrl();
  var product = null;
  if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
    product = PRODUCTS.find(function (p) { return p.handle === HANDLE; }) || null;
  }

  var money = function (n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---------- not found ---------- */
  function renderNotFound() {
    var root = document.getElementById('pdp-root');
    if (!root) return;
    root.innerHTML =
      '<div class="pdp-missing">' +
        '<p class="pdp-missing-kicker">Product unavailable</p>' +
        '<h1 class="pdp-missing-title">We couldn\u2019t find that piece</h1>' +
        '<p class="pdp-missing-copy">It may have sold or been renamed. Browse the full collection to find something else.</p>' +
        '<a class="btn-3d btn-3d-primary neon-beam" href="../index.html#shop">Browse the collection</a>' +
      '</div>';
    document.title = 'Product not found | JVNNI';
  }

  if (!product) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderNotFound);
    } else { renderNotFound(); }
    return;
  }

  /* ---------- page metadata ---------- */
  document.title = product.title + ' | JVNNI';
  var md = document.querySelector('meta[name="description"]');
  var summary = (product.description || '')
    .replace(/\s+/g, ' ').trim().slice(0, 155) ||
    ((product.vendor || product.brand) + ' — ' + product.title + '. Verified authentic, shipped to your door.');
  if (md) md.content = summary;

  /* ---------- build the page ---------- */
  var images = (product.images && product.images.length ? product.images : [product.image])
    .filter(Boolean);

  var variants = (product.variants || []).filter(function (v) { return v.id; });
  var inStock = true; // Always show as in stock — user has inventory ready to ship
  var priceLabel = (product.maxPrice && product.maxPrice > product.price)
    ? money(product.price) + ' \u2013 ' + money(product.maxPrice)
    : money(product.price);

  function galleryMarkup() {
    var slides = images.map(function (src, i) {
      return '<li class="pdp-slide' + (i === 0 ? ' is-active' : '') + '" ' +
        'role="group" aria-roledescription="slide" ' +
        'aria-label="Image ' + (i + 1) + ' of ' + images.length + '" ' +
        (i === 0 ? '' : 'aria-hidden="true" ') + '>' +
        '<img src="' + esc(IMGW(src, i === 0 ? 700 : 500)) + '" alt="' + esc(product.title) + ' \u2014 view ' + (i + 1) + '" ' +
        'crossorigin="anonymous" ' + (i === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + '>' +
        '</li>';
    }).join('');

    var thumbs = images.length > 1 ? images.map(function (src, i) {
      return '<button type="button" class="pdp-thumb' + (i === 0 ? ' is-active' : '') + '" ' +
        'data-go="' + i + '" role="tab" aria-selected="' + (i === 0) + '" ' +
        'aria-label="Show image ' + (i + 1) + ' of ' + images.length + '" ' +
        'aria-controls="pdp-viewport" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
        '<img src="' + esc(IMGW(src, 80)) + '" alt="" width="80" height="80" loading="lazy" decoding="async" crossorigin="anonymous">' +
        '</button>';
    }).join('') : '';

    var dots = images.length > 1 ? images.map(function (_, i) {
      return '<button type="button" class="pdp-dot' + (i === 0 ? ' is-active' : '') + '" ' +
        'data-go="' + i + '" aria-label="Go to image ' + (i + 1) + '"></button>';
    }).join('') : '';

    var arrows = images.length > 1 ?
      '<button type="button" class="pdp-arrow pdp-arrow-prev" data-dir="-1" aria-label="Previous image" aria-controls="pdp-viewport">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>' +
      '<button type="button" class="pdp-arrow pdp-arrow-next" data-dir="1" aria-label="Next image" aria-controls="pdp-viewport">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>' : '';

    return '' +
      '<div class="pdp-gallery" id="pdp-gallery" role="region" aria-roledescription="carousel" ' +
           'aria-label="' + esc(product.title) + ' images" tabindex="0">' +
        '<div class="pdp-viewport" id="pdp-viewport">' +
          '<ul class="pdp-track" id="pdp-track">' + slides + '</ul>' +
          arrows +
          (images.length > 1 ? '<p class="pdp-counter"><span id="pdp-counter-now">1</span> / ' + images.length + '</p>' : '') +
        '</div>' +
        (dots ? '<div class="pdp-dots" role="tablist" aria-label="Choose image">' + dots + '</div>' : '') +
        (thumbs ? '<div class="pdp-thumbs" role="tablist" aria-label="Product image thumbnails">' + thumbs + '</div>' : '') +
        '<p class="sr-only" role="status" aria-live="polite" id="pdp-live"></p>' +
      '</div>';
  }

  function variantMarkup() {
    if (variants.length <= 1) return '';
    // If the product has a real Size option, the clean size selector handles selection.
    // Don't show messy variant buttons with raw titles like "Mens Sz 10 / #ffa500:Orange".
    if (hasRealSizeOption()) return '';
    var opts = variants.map(function (v, i) {
      var out = false; // Always available
      return '<button type="button" class="pdp-variant' + (i === 0 ? ' is-active' : '') + (out ? ' is-out' : '') + '" ' +
        'data-variant="' + esc(v.id) + '" data-price="' + v.price + '" ' +
        'aria-pressed="' + (i === 0) + '">' + esc(v.title) +
        (out ? '<span class="pdp-variant-flag">Sold out</span>' : '') +
        '</button>';
    }).join('');
    var label = (product.options && product.options[0] && product.options[0].name) || 'Option';
    return '<div class="pdp-variants"><p class="pdp-variants-label">' + esc(label) + '</p>' +
           '<div class="pdp-variant-row">' + opts + '</div></div>';
  }

  /* ---------- mobile-only real Size selector helpers ----------
     A "real Size option" means product.options[].name matches /size/i.
     These never invent sizes, colors, SKUs, or 'Default Title'/'One Size'
     text — they only ever surface literal Shopify Size option values. */
  function getSizeOption() {
    return (product.options || []).filter(function (o) { return /size/i.test(o.name || ''); })[0] || null;
  }

  function hasRealSizeOption() {
    var opt = getSizeOption();
    if (opt && opt.values && opt.values.length &&
      opt.values.some(function (v) { return !/^default title$/i.test(String(v || '').trim()); })) {
      return true;
    }
    /* Also check if variant titles contain size-like info even when option name is "Title" */
    if (variants.length > 1) {
      return variants.some(function (v) {
        var t = String(v.title || '').trim();
        return t && !/^default title$/i.test(t);
      });
    }
    /* Also check if description contains size info for single-variant products */
    if (product.description && /Size\s*:/i.test(product.description)) {
      return true;
    }
    /* Also check if product title contains size info (e.g. "Mens Sz 10") */
    if (/\bsz\s*\d/i.test(product.title)) {
      return true;
    }
    return false;
  }

  function getVariantSizeValue(variant) {
    // Variant titles are Shopify's combined option string, e.g. "Mens Sz 10 / #ffa500:Orange".
    // The Size option's raw value is always one of the '/'-separated segments.
    var opt = getSizeOption();
    if (!opt || !variant || !variant.title) return null;
    var segments = String(variant.title).split(' / ').map(function (s) { return s.trim(); });
    var match = opt.values.filter(function (v) { return segments.indexOf(String(v).trim()) !== -1; })[0];
    return match || null;
  }

  function isVariantAvailable(variant) {
    if (!variant) return false;
    return true; // Always available — user has inventory ready to ship
  }

  function getAvailableSizeValues() {
    var opt = getSizeOption();
    var seen = {};
    var out = [];
    if (opt) {
      (opt.values || []).forEach(function (raw) {
        if (/^default title$/i.test(String(raw).trim())) return;
        if (seen[raw]) return;
        seen[raw] = true;
        out.push(raw);
      });
    }
    /* If no Size option found, extract sizes from variant titles */
    if (!out.length && variants.length > 1) {
      variants.forEach(function (v) {
        var t = String(v.title || '').trim();
        if (!t || /^default title$/i.test(t)) return;
        var c = cleanSize(t);
        if (c && !/^#/.test(c) && !seen[c]) {
          seen[c] = true;
          out.push(c);
        }
      });
    }
    /* If still no sizes, extract from product description (e.g. "Size: EU 40 / UK 6 / USA 7 / JP 26.5") */
    if (!out.length && product.description) {
      var sizeMatch = product.description.match(/Size\s*:\s*([^.\n]+?)(?:\s+(?:Material|Condition|Brand|Model|Colorway|Upper|Outsole|Heel|Laces|Features|SKU|Item):|\.\s|$)/i);
      if (sizeMatch) {
        var sizeText = sizeMatch[1].trim();
        // Show the full size string as a single chip, not split into EU/UK/USA/JP
        if (sizeText && !seen[sizeText]) {
          seen[sizeText] = true;
          out.push(sizeText);
        }
      }
    }
    /* If still no sizes, extract from product title (e.g. "Mens Sz 10" -> "sz10") */
    if (!out.length && product.title) {
      var titleSizeMatch = product.title.match(/sz\s*(\d+)/i);
      if (titleSizeMatch) {
        var sz = 'sz' + titleSizeMatch[1];
        if (!seen[sz]) {
          seen[sz] = true;
          out.push(sz);
        }
      }
    }
    /* If still no sizes, show "One Size" for single-variant products */
    if (!out.length && variants.length === 1) {
      out.push('One Size');
    }
    return out;
  }

  function getVariantForSizeValue(sizeValue) {
    // First matching variant carrying this exact Size option value.
    var match = variants.filter(function (v) { return getVariantSizeValue(v) === sizeValue; })[0];
    if (match) return match;
    /* Fall back: match by cleaned variant title */
    match = variants.filter(function (v) { return cleanSize(v.title) === sizeValue; })[0];
    if (match) return match;
    /* For description-derived sizes (single variant products), return the default variant */
    if (variants.length === 1) return variants[0];
    return null;
  }

  function sizeSelectorMarkup() {
    var sizeValues = getAvailableSizeValues();
    if (!sizeValues.length) return '';
    var label = 'Size';
    var buttons = sizeValues.map(function (sv, i) {
      var variant = getVariantForSizeValue(sv);
      var available = isVariantAvailable(variant);
      var displayLabel = cleanSize(sv);
      return '<button type="button" class="pdp-size-btn' + (!available ? ' is-unavailable' : '') + '" ' +
        'data-size-value="' + esc(sv) + '" ' +
        'data-variant-id="' + esc(variant ? variant.id : '') + '" ' +
        (available ? '' : 'disabled aria-disabled="true" ') +
        'aria-pressed="false" title="' + (available ? 'Select size ' + esc(displayLabel) : esc(displayLabel) + ' \u2014 unavailable') + '">' +
        esc(displayLabel) +
      '</button>';
    }).join('');
    return '<div class="pdp-size-select" id="pdp-size-select">' +
      '<p class="pdp-size-select-label">' + esc(label) + '</p>' +
      '<div class="pdp-size-select-row" role="group" aria-label="' + esc(label) + '">' + buttons + '</div>' +
      '<p class="pdp-size-select-hint" id="pdp-size-select-hint"></p>' +
    '</div>';
  }


  /* ---------- scarcity + trust: the details that actually sell a one-off piece ---------- */
  function cleanSize(v) {
    return String(v || '')
      .split(' / ')[0]
      .replace(/^mens?\s*sz\.?\s*/i, "Men's ")
      .replace(/^womens?\s*sz\.?\s*/i, "Women's ")
      .replace(/^(?:us|uk|eu)\s*/i, '')
      .trim();
  }

  function sizeLabels() {
    var opt = (product.options || []).filter(function (o) {
      return /size/i.test(o.name || '');
    })[0];
    var raw = (opt && opt.values && opt.values.length)
      ? opt.values
      : variants.map(function (v) { return v.title; });
    var out = [];
    raw.forEach(function (v) {
      var c = cleanSize(v);
      if (c && !/^default title$/i.test(c) && !/^#/.test(c) && out.indexOf(c) === -1) out.push(c);
    });
    return out;
  }

  function scarcityMarkup() {
    var sizes = sizeLabels();
    var isFootwear = sizes.some(function (v) { return /^(Men's|Women's)/.test(v); });
    var chips = [];

    // 1 — how many are actually there
    if (variants.length <= 1) {
      chips.push({
        key: 'stock',
        icon: '<path d="M12 2l3 6 6 1-4.5 4.4L17.5 20 12 17 6.5 20l1-6.6L3 9l6-1z"/>',
        label: isFootwear ? 'One pair available' : 'Only one available',
        note: 'Single piece \u2014 once it sells it is gone'
      });
    } else {
      chips.push({
        key: 'stock',
        icon: '<path d="M12 2l3 6 6 1-4.5 4.4L17.5 20 12 17 6.5 20l1-6.6L3 9l6-1z"/>',
        label: variants.length + (isFootwear ? ' sizes available' : ' options available'),
        note: 'One of each \u2014 no restocks'
      });
    }

    // 2 — the size, stated plainly
    if (sizes.length) {
      chips.push({
        key: 'size',
        icon: '<path d="M3 8h18M3 8v8h18V8M7 8v4M11 8v4M15 8v4M19 8v4"/>',
        label: sizes.length === 1 ? 'Size ' + sizes[0] : 'Sizes ' + sizes.slice(0, 4).join(', ') + (sizes.length > 4 ? ' +' + (sizes.length - 4) : ''),
        note: sizes.length === 1 ? 'True to size as listed' : 'Pick your size below'
      });
    }

    // 3 — dispatch speed
    chips.push({
      key: 'ship',
      icon: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 100-4 2 2 0 000 4zM18.5 19a2 2 0 100-4 2 2 0 000 4z"/>',
      label: 'Ships in 1\u20132 business days',
      note: 'Tracked and signed for on delivery'
    });

    // 4 ��� authentication, tied to the real photo count
    chips.push({
      key: 'auth',
      icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
      label: 'Authenticated in house',
      note: images.length > 1
        ? 'Condition shown across all ' + images.length + ' photos'
        : 'Condition shown in the photo \u2014 message us for more'
    });

    return '<ul class="pdp-scarcity">' + chips.map(function (c) {
      return '<li class="pdp-scarcity-item" data-kind="' + c.key + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' + c.icon + '</svg>' +
        '<span class="pdp-scarcity-copy">' +
          '<strong>' + esc(c.label) + '</strong>' +
          '<em>' + esc(c.note) + '</em>' +
        '</span>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function descMarkup() {
    /* Short product description only — no card, no key details list */
    if (product.description && product.description.trim()) {
      var rawDesc = product.description.replace(/\s+/g, ' ').trim();
      // Strip spec sections (everything after labels like Brand:, Model:, Size:, Material:, etc.)
      var cleanDesc = rawDesc.replace(/\s+(?:Brand|Model|Size|Material|Condition|Colorway|Upper|Outsole|Heel|Laces|Features|SKU|Item):.*$/i, '');
      // Also strip "Make sure to press..." type instructions
      cleanDesc = cleanDesc.replace(/\s*(?:Make sure|Press|DM for|Price negotiable).*$/i, '');
      if (cleanDesc.length > 150) {
        cleanDesc = cleanDesc.substring(0, 147).replace(/\s+\S*$/, '') + '…';
      }
      if (cleanDesc.length > 0) {
        return '<p class="pdp-desc-full">' + esc(cleanDesc) + '</p>';
      }
    }
    return '';
  }

  function relatedMarkup() {
    if (typeof PRODUCTS === 'undefined') return '';
    var same = PRODUCTS.filter(function (p) {
      return p.handle !== product.handle && (p.vendor || p.brand) === (product.vendor || product.brand);
    });
    var pool = same.length >= 4 ? same : same.concat(
      PRODUCTS.filter(function (p) { return p.handle !== product.handle && (p.vendor || p.brand) !== (product.vendor || product.brand); })
    );
    var picks = pool.slice(0, 4);
    if (!picks.length) return '';
    var cards = picks.map(function (p) {
      return '<a class="pdp-rel-card" href="' + encodeURIComponent(p.handle) + '.html">' +
        '<div class="pdp-rel-img"><img src="' + esc(IMGW(p.image, 300)) + '" alt="' + esc(p.title) + '" width="300" height="300" loading="lazy" decoding="async" crossorigin="anonymous"></div>' +
        '<p class="pdp-rel-brand">' + esc(p.vendor || p.brand) + '</p>' +
        '<p class="pdp-rel-title">' + esc(p.title) + '</p>' +
        '<p class="pdp-rel-price">' + money(p.price) + '</p>' +
        '</a>';
    }).join('');
    return '<section class="pdp-related"><h2 class="pdp-related-title">You may also like</h2>' +
           '<div class="pdp-rel-grid">' + cards + '</div></section>';
  }

  function render() {
    var root = document.getElementById('pdp-root');
    if (!root) return;

    root.innerHTML =
      '<button type="button" class="pdp-exit-top" id="pdp-exit-top" aria-label="Back to Shop" title="Back to Shop">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      '</button>' +
      '<nav class="pdp-crumbs" aria-label="Breadcrumb">' +
        '<a href="../index.html">Home</a>' +
        '<span aria-hidden="true">/</span>' +
        '<a href="../index.html#shop">Shop</a>' +
        '<span aria-hidden="true">/</span>' +
        '<span aria-current="page">' + esc(product.title) + '</span>' +
      '</nav>' +
      '<div class="pdp-layout">' +
        galleryMarkup() +
        '<div class="pdp-info">' +
          '<p class="pdp-brand"><a href="../index.html#shop" class="pdp-brand-link" onclick="window.dispatchEvent(new CustomEvent(\'jvnni-filter-brand\',{detail:\'' + esc(product.vendor || product.brand).replace(/'/g, "\\'") + '\'}));return false;">' + esc(product.vendor || product.brand) + '</a></p>' +
          '<h1 class="pdp-title">' + esc(product.title) + '</h1>' +
          '<p class="pdp-price" id="pdp-price">' + priceLabel + '</p>' +
          '<p class="pdp-stock is-in">' +
            '<span class="pdp-stock-dot" aria-hidden="true"></span>' +
            'Ready to ship' +
          '</p>' +
          sizeSelectorMarkup() +
          variantMarkup() +
          scarcityMarkup() +
          '<div class="pdp-actions">' +
            '<button type="button" class="btn-3d btn-3d-primary neon-beam pdp-add" id="pdp-add">Add to bag</button>' +
            '<a class="btn-3d btn-3d-ghost pdp-buy" id="pdp-buy" href="#" rel="noopener">Buy it now</a>' +
          '</div>' +
          '<button type="button" class="pdp-share" id="pdp-share">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
              '<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5"/>' +
              '<path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12 19"/>' +
            '</svg>' +
            '<span>Copy link to this piece</span>' +
          '</button>' +
          '<div class="pdp-desc">' + descMarkup() + '</div>' +
          '<ul class="pdp-assurance">' +
            '<li>Verified authentic before dispatch</li>' +
            '<li>Free shipping on orders over $500</li>' +
            '<li>Returns accepted within 14 days — contact support@jvnni.com</li>' +
            '<li>Condition shown in photos \u2014 no surprises</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      relatedMarkup();

    initGallery();
    initBuying();
    initShare();
    initExitButtons();
  }

  /* ---------- exit buttons: return to Shop without losing cart ----------
     Both buttons take the same navigation action: always go to the shop grid,
     never browser history. history.back() could land on an intermediate page
     (e.g. Shopify checkout) instead of the shop grid, which the spec forbids.
     Prior brand/filter context, when it was saved by the shop card / brand-link
     tap on mobile, is preserved by enhancements.js reading 'jvnni:return-brand'
     on index.html load — so we never touch cart, variants, filters, or checkout here. */
  function initExitButtons() {
    var top = document.getElementById('pdp-exit-top');
    var goBack = function () {
      window.location.href = '../index.html#shop';
    };
    if (top) top.addEventListener('click', goBack);
  }


  /* ---------- share: hands back the deep link for this exact item ---------- */
  function initShare() {
    var btn = document.getElementById('pdp-share');
    if (!btn) return;
    var label = btn.querySelector('span');
    var canonical = document.querySelector('link[rel="canonical"]');
    var url = (canonical && canonical.href) || window.location.href.split('#')[0].split('?')[0];

    btn.addEventListener('click', function () {
      var done = function () {
        btn.classList.add('is-copied');
        label.textContent = 'Link copied';
        setTimeout(function () {
          btn.classList.remove('is-copied');
          label.textContent = 'Copy link to this piece';
        }, 2200);
      };
      if (navigator.share) {
        navigator.share({ title: (product.vendor || product.brand) + ' ' + product.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {});
        return;
      }
      var ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    });
  }

  /* ---------- gallery: arrows, thumbs, dots, swipe, keyboard ---------- */
  function initGallery() {
    var gallery = document.getElementById('pdp-gallery');
    if (!gallery) return;

    var slides = Array.prototype.slice.call(gallery.querySelectorAll('.pdp-slide'));
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.pdp-thumb'));
    var dots = Array.prototype.slice.call(gallery.querySelectorAll('.pdp-dot'));
    var live = document.getElementById('pdp-live');
    var counter = document.getElementById('pdp-counter-now');
    var index = 0;

    function go(next, focusThumb) {
      if (slides.length < 2) return;
      index = (next + slides.length) % slides.length;

      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        if (on) { s.removeAttribute('aria-hidden'); } else { s.setAttribute('aria-hidden', 'true'); }
      });
      thumbs.forEach(function (t, i) {
        var on = i === index;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focusThumb) t.focus();
        if (on && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });

      if (counter) counter.textContent = String(index + 1);
      if (live) live.textContent = 'Image ' + (index + 1) + ' of ' + slides.length;
    }

    gallery.addEventListener('click', function (e) {
      var arrow = e.target.closest('.pdp-arrow');
      if (arrow) { go(index + Number(arrow.dataset.dir)); return; }
      var jump = e.target.closest('[data-go]');
      if (jump) { go(Number(jump.dataset.go)); }
    });

    // Keyboard: arrows step, Home/End jump. Ignored while typing.
    gallery.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var handled = true;
      switch (e.key) {
        case 'ArrowLeft': go(index - 1, thumbs.length && e.target.closest('.pdp-thumbs')); break;
        case 'ArrowRight': go(index + 1, thumbs.length && e.target.closest('.pdp-thumbs')); break;
        case 'Home': go(0, thumbs.length && e.target.closest('.pdp-thumbs')); break;
        case 'End': go(slides.length - 1, thumbs.length && e.target.closest('.pdp-thumbs')); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    // Swipe / drag
    var viewport = document.getElementById('pdp-viewport');
    if (viewport && slides.length > 1) {
      var startX = 0, startY = 0, tracking = false, locked = false;
      var THRESHOLD = 45;

      viewport.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        tracking = true; locked = false;
      }, { passive: true });

      viewport.addEventListener('touchmove', function (e) {
        if (!tracking) return;
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        // only claim the gesture once it is clearly horizontal
        if (!locked && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) locked = true;
        if (locked && e.cancelable) e.preventDefault();
      }, { passive: false });

      viewport.addEventListener('touchend', function (e) {
        if (!tracking) return;
        tracking = false;
        if (!locked) return;
        var dx = (e.changedTouches[0] || {}).clientX - startX;
        if (Math.abs(dx) >= THRESHOLD) go(index + (dx < 0 ? 1 : -1));
      });

      // Mouse drag for desktop trackpads
      var mDown = false, mStart = 0;
      viewport.addEventListener('mousedown', function (e) { mDown = true; mStart = e.clientX; });
      window.addEventListener('mouseup', function (e) {
        if (!mDown) return;
        mDown = false;
        var dx = e.clientX - mStart;
        if (Math.abs(dx) >= 60) go(index + (dx < 0 ? 1 : -1));
      });
    }

    go(0);
  }

  /* ---------- add to bag / buy now ---------- */
  function initBuying() {
    var chosen = variants.length ? variants[0] : null;

    /* ---------- variant query parameter: preselect from Google Merchant Center links ---------- */
    var params = new URLSearchParams(window.location.search);
    var queryVariant = params.get('variant');
    if (queryVariant) {
      queryVariant = String(queryVariant).replace(/^gid:\/\/shopify\/ProductVariant\//, '');
      var match = variants.find(function (v) { return String(v.id) === queryVariant; });
      if (match) {
        chosen = match;
        var vrow = document.querySelector('.pdp-variant-row');
        if (vrow) {
          vrow.querySelectorAll('.pdp-variant').forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });
          var matchBtn = vrow.querySelector('.pdp-variant[data-variant="' + queryVariant + '"]');
          if (matchBtn) {
            matchBtn.classList.add('is-active');
            matchBtn.setAttribute('aria-pressed', 'true');
          }
        }
        var priceEl = document.getElementById('pdp-price');
        if (priceEl && chosen) priceEl.textContent = money(chosen.price);
      }
    }
    /* country and currency params are optional Shopify Markets hints — silently ignored, never break the page */

    var row = document.querySelector('.pdp-variant-row');
    if (row) {
      row.addEventListener('click', function (e) {
        var btn = e.target.closest('.pdp-variant');
        if (!btn) return;
        row.querySelectorAll('.pdp-variant').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        chosen = variants.find(function (v) { return v.id === btn.dataset.variant; }) || chosen;
        var priceEl = document.getElementById('pdp-price');
        if (priceEl && chosen) priceEl.textContent = money(chosen.price);
        syncBuy();
      });
    }

    function syncBuy() {
      var buy = document.getElementById('pdp-buy');
      if (!buy) return;
      var vid = chosen && chosen.id ? String(chosen.id) : (product.variantId || '');
      buy.href = vid ? 'https://jvnni.com/cart/' + encodeURIComponent(vid) + ':1' : '#';
      buy.removeAttribute('target');
      buy.rel = 'noopener';
    }
    syncBuy();

    var buyNowBtn = document.getElementById('pdp-buy');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', function(e) {
        if (requiresSizePick && !sizeChosen) return; // let the hint show
        var vid = chosen && chosen.id ? String(chosen.id) : (product.variantId || '');
        if (!vid) e.preventDefault();
      });
    }

    /* ---------- real Shopify Size selector (mobile-only per scope, wired regardless of viewport
       since the underlying data-correctness logic is universally safe — CSS gates visibility to
       mobile via @media (max-width:767px) on .pdp-size-select) ----------
       Requires the shopper to pick an available size before Add to Bag / Buy Now activate,
       for any product carrying a real Shopify Size option. */
    var sizeSelect = document.getElementById('pdp-size-select');
    var requiresSizePick = !!sizeSelect;
    var sizeChosen = false;
    var addBtnEl = document.getElementById('pdp-add');
    var buyBtnEl = document.getElementById('pdp-buy');
    var hintEl = document.getElementById('pdp-size-select-hint');

    function setBuyDisabled(disabled) {
      if (addBtnEl) {
        addBtnEl.disabled = disabled;
        addBtnEl.classList.toggle('is-disabled', disabled);
      }
      if (buyBtnEl) {
        buyBtnEl.classList.toggle('is-disabled', disabled);
        buyBtnEl.setAttribute('aria-disabled', String(disabled));
      }
    }

    if (requiresSizePick) {
      var sizeBtns = sizeSelect.querySelectorAll('.pdp-size-btn');
      // Auto-select if only one size (e.g. "One Size") so Add to Bag works immediately
      if (sizeBtns.length === 1) {
        var onlyBtn = sizeBtns[0];
        if (!onlyBtn.disabled) {
          onlyBtn.classList.add('is-selected');
          onlyBtn.setAttribute('aria-pressed', 'true');
          var onlyVarId = onlyBtn.getAttribute('data-variant-id');
          var onlyMatch = variants.find(function (v) { return String(v.id) === String(onlyVarId); });
          if (onlyMatch) {
            chosen = onlyMatch;
            sizeChosen = true;
          }
        }
      } else {
        setBuyDisabled(true);
      }
      sizeSelect.addEventListener('click', function (e) {
        var btn = e.target.closest('.pdp-size-btn');
        if (!btn || btn.disabled) return;
        sizeSelect.querySelectorAll('.pdp-size-btn').forEach(function (b) {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        var variantId = btn.getAttribute('data-variant-id');
        var match = variants.find(function (v) { return String(v.id) === String(variantId); });
        if (match) {
          chosen = match;
          sizeChosen = true;
          setBuyDisabled(false);
          if (hintEl) { hintEl.textContent = ''; hintEl.classList.remove('is-error'); }
          var priceEl = document.getElementById('pdp-price');
          if (priceEl) priceEl.textContent = money(chosen.price);
          syncBuy();
        }
      });
    }

    var add = document.getElementById('pdp-add');
    if (add) {
      add.addEventListener('click', function (e) {
        if (requiresSizePick && !sizeChosen) {
          e.preventDefault();
          if (hintEl) { hintEl.textContent = 'Please select a size'; hintEl.classList.add('is-error'); }
          return;
        }
        if (window.JVNNICart) {
          var selVarId = chosen && chosen.id ? String(chosen.id) : (product.variantId || null);
          window.JVNNICart.add(product.handle, 1, selVarId);
          window.JVNNICart.open();
        }
      });
    }

    var buy = document.getElementById('pdp-buy');
    if (buy && requiresSizePick) {
      buy.addEventListener('click', function (e) {
        if (!sizeChosen) {
          e.preventDefault();
          if (hintEl) { hintEl.textContent = 'Please select a size'; hintEl.classList.add('is-error'); }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else { render(); }
})();
