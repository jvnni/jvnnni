/**
 * JVNNI — Dynamic Product Route Handler
 * Vercel Serverless Function
 *
 * Handles /products/:handle for any active Shopify product.
 * Reads the PRODUCTS array from js/products.js (synced from Shopify).
 * Renders a complete HTML page with product-specific meta tags,
 * structured data, and the same CSS/JS as static product pages.
 *
 * Query parameters preserved: variant, country, currency, utm_*, and any unknown params.
 * - variant: Shopify variant ID → preselected by product.js on the client
 * - country/currency: Shopify Markets hints → silently ignored, never break the page
 * - utm_*: Google tracking → preserved in the URL, never interfere with product loading
 */
const fs = require('fs');
const path = require('path');

let _products = null;
function loadProducts() {
  if (_products) return _products;
  try {
    const productsJs = fs.readFileSync(path.join(process.cwd(), 'js', 'products.js'), 'utf-8');
    const fn = new Function(productsJs + '; return typeof PRODUCTS !== "undefined" ? PRODUCTS : [];');
    _products = fn();
  } catch (e) {
    _products = [];
  }
  return _products;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function jsonLd(p) {
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: (p.brand + ' ' + p.title).trim(),
    image: p.image || '',
    description: p.description || '',
    brand: { '@type': 'Brand', name: p.brand },
    offers: {
      '@type': 'Offer',
      url: 'https://jvnni.com/products/' + p.handle,
      priceCurrency: 'USD',
      price: String(p.price || ''),
      availability: p.status === 'ARCHIVED' || (p.inventory !== undefined && p.inventory <= 0)
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock'
    }
  };
  if (p.maxPrice && p.maxPrice !== p.price) {
    data.offers.highPrice = String(p.maxPrice);
  }
  return JSON.stringify(data, null, 2);
}

function renderPage(p) {
  const title = (p.brand + ' — ' + p.title).trim();
  const desc = (p.description || '').trim() ||
    ('A single ' + p.brand + ' piece, authenticated in house and photographed exactly as it will arrive. Condition is shown in the images above.');
  const shortDesc = desc.substring(0, 155);
  const canonical = 'https://jvnni.com/products/' + p.handle;
  const ogImage = p.image || '';
  const siteName = 'JVNNI';
  const priceLabel = p.maxPrice && p.maxPrice !== p.price
    ? '$' + p.price + '–$' + p.maxPrice
    : '$' + p.price;
  const cacheVer = '20260913200000';

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <script>
    (function () {
      var t = 'light';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="ZpBaXhW8L5YZQyuVWnqRSCQ2XCFuK7qU10__HiI5whw">
  <title>${escapeHtml(title)} | ${escapeHtml(siteName)}</title>
  <meta name="description" content="${escapeAttr(shortDesc)}">
  <link rel="canonical" href="${escapeAttr(canonical)}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(shortDesc)}">
  <meta property="og:image" content="${escapeAttr(ogImage)}">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <meta property="og:site_name" content="${escapeAttr(siteName)}">
  <meta property="og:price:amount" content="${escapeAttr(String(p.price || ''))}">
  <meta property="og:price:currency" content="USD">
  <meta property="product:retailer_item_id" content="${escapeAttr(String(p.id || ''))}">
  <meta property="product:brand" content="${escapeAttr(p.brand)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(shortDesc)}">
  <meta name="twitter:image" content="${escapeAttr(ogImage)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#00E5FF">
  <link rel="icon" type="image/jpeg" href="/img/jvnni-logo.jpeg">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300..900&display=swap" rel="stylesheet">

  <!-- CSS -->
  <link rel="stylesheet" href="/css/style.css?v=${cacheVer}">
  <link rel="stylesheet" href="/css/enhancements.css?v=${cacheVer}">
  <link rel="stylesheet" href="/css/product.css?v=${cacheVer}">
  <link rel="stylesheet" href="/css/fonts.css?v=${cacheVer}">

  <script type="application/ld+json">
${jsonLd(p)}
  </script>
</head>
<body class="pdp-body">
  <div class="bg-gradient-mesh" aria-hidden="true"></div>
  <div class="bg-grid" aria-hidden="true"></div>

  <!-- Nav -->
  <nav class="nav">
    <a href="/" class="nav-logo"><img src="/img/jvnni-logo.jpeg" alt="JVNNI" width="34" height="34" loading="eager" decoding="async"><span>JVNNI</span></a>
    <ul class="nav-links">
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/#shop" class="nav-link">Shop</a></li>
      <li><a href="/#shop" class="nav-link">Brands</a></li>
      <li><a href="/reviews.html" class="nav-link">Reviews</a></li>
      <li><a href="/#contact" class="nav-link">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <a class="nav-icon-btn" href="/#shop" aria-label="Search the collection">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      </a>
      <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
      <button class="nav-icon-btn nav-cart" id="nav-cart-btn" aria-label="Cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>
        <span class="nav-cart-badge">0</span>
      </button>
      <button class="nav-menu-btn" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <!-- Main -->
  <main class="pdp-main" id="pdp-root">
    <!-- product.js renders here -->
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-bottom">
      <p>&copy; 2026 JVNNI. All rights reserved.</p>
      <div class="footer-social">
        <a href="https://www.instagram.com/shopjvnni/" target="_blank" rel="noopener" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
        </a>
      </div>
    </div>
  </footer>

  <!-- Cart -->
  <div class="cart-overlay" id="cart-overlay"></div>
  <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart">
    <div class="cart-drawer-head">
      <h3>Your Bag</h3>
      <button class="cart-close" id="cart-close" aria-label="Close cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="cart-items" id="cart-items"></div>
    <div class="cart-empty" id="cart-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>
      <p>Your bag is empty</p>
      <a class="btn-3d btn-3d-ghost" href="/#shop">Browse Collection</a>
    </div>
    <div class="cart-foot" id="cart-foot">
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <span id="cart-subtotal-value">$0.00</span>
      </div>
      <p class="cart-note">Shipping and taxes calculated at checkout. Free shipping over $500.</p>
      <button class="btn-3d btn-3d-primary cart-checkout-btn" id="cart-checkout">
        Secure Checkout
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <div class="cart-trust">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Checkout secured by Shopify
      </div>
    </div>
  </aside>

  <!-- Scripts -->
  <script src="/js/products.js?v=${cacheVer}"></script>
  <script src="/js/cart.js?v=${cacheVer}"></script>
  <script src="/js/product.js?v=${cacheVer}"></script>
  <script src="/js/pdp-theme.js?v=${cacheVer}"></script>
  <script src="/js/perf.js?v=${cacheVer}"></script>
</body>
</html>`;
}

function renderNotFound(handle) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, follow">
  <title>Product Not Found | JVNNI</title>
  <meta name="description" content="This product is no longer available. Browse the full JVNNI collection.">
  <link rel="icon" type="image/jpeg" href="/img/jvnni-logo.jpeg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css?v=20260913200000">
  <link rel="stylesheet" href="/css/enhancements.css?v=20260913200000">
</head>
<body class="pdp-body">
  <div class="bg-gradient-mesh" aria-hidden="true"></div>
  <div class="bg-grid" aria-hidden="true"></div>
  <nav class="nav" id="main-nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo" aria-label="JVNNI home"><img src="/img/jvnni-logo.jpeg" alt="JVNNI" width="34" height="34" loading="eager" decoding="async"><span>JVNNI</span></a>
    </div>
  </nav>
  <main class="pdp-main" style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:2rem;">
    <div>
      <h1 style="font-family:'Archivo Black',sans-serif;font-size:clamp(2rem,5vw,3.5rem);margin-bottom:1rem;">Product Not Found</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem;">${escapeHtml(handle ? 'We could not find a product for "' + handle + '".' : 'This product is no longer available.')}</p>
      <a href="/#shop" class="btn-3d btn-3d-primary neon-beam" style="display:inline-block;padding:0.85rem 2.4rem;border-radius:999px;text-decoration:none;font-weight:800;font-size:0.82rem;letter-spacing:0.08em;">Browse the Collection</a>
    </div>
  </main>
  <script>
    setTimeout(function(){ window.location.href = '/#shop'; }, 5000);
  </script>
</body>
</html>`;
}

module.exports = (req, res) => {
  // Parse the URL to get query parameters
  const fullUrl = new URL(req.url, 'http://localhost');
  const params = fullUrl.searchParams;

  // Extract handle from query param (set by vercel.json rewrite)
  let handle = params.get('handle') || '';
  // Also try to extract from path if handle not in query
  if (!handle) {
    const pathParts = fullUrl.pathname.split('/').filter(Boolean);
    const productsIdx = pathParts.indexOf('products');
    if (productsIdx >= 0 && pathParts[productsIdx + 1]) {
      handle = pathParts[productsIdx + 1];
    }
  }

  // Normalize: remove .html extension
  handle = handle.replace(/\.html$/, '').trim();

  if (!handle) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderNotFound(''));
    return;
  }

  // Load products from products.js
  const products = loadProducts();
  const product = products.find(function (p) { return p.handle === handle; });

  if (!product) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderNotFound(handle));
    return;
  }

  // Render the page — query params (variant, country, currency, utm_*) stay in the URL
  // and are handled client-side by product.js
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
  });
  res.end(renderPage(product));
};
