// ============================================
// JVNNI — NEON SCROLL BEAM SYSTEM (optimized)
// Single shared rAF loop, IntersectionObserver-gated,
// paused on tab hide, cached positions to avoid layout thrash.
// ============================================
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;

  // ---- Inject the fixed neon rails + top/bottom beams ----
  function injectChrome() {
    if (document.querySelector('.neon-rail')) return;
    var frag = document.createDocumentFragment();

    ['left', 'right'].forEach(function (side) {
      var rail = document.createElement('div');
      rail.className = 'neon-rail neon-rail-' + side;
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<span class="neon-rail-fill"></span><span class="neon-rail-head"></span>';
      frag.appendChild(rail);
    });

    var base = document.createElement('div');
    base.className = 'neon-baseline';
    base.setAttribute('aria-hidden', 'true');
    base.innerHTML = '<span class="neon-baseline-fill"></span>';
    frag.appendChild(base);

    document.body.appendChild(frag);
  }

  // ---- Elements that get a scroll-driven fill beam ----
  // On mobile, use a reduced selector set for fewer beams
  var BEAM_SELECTOR = isMobile ? [
    '.section',
    '.product-card',
    '.btn-3d'
  ].join(',') : [
    '.section',
    '.product-card',
    '.proof-card',
    '.review-card',
    '.vproof-media',
    '.stat-pill',
    '.promise-card',
    '.value-card',
    '.brand-card',
    '.btn-3d'
  ].join(',');

  var tracked = [];      // [{el, top, height}]
  var visible = [];      // subset of tracked currently in viewport
  var io = null;
  var vh = 0;
  var scrollY = 0;
  var ticking = false;
  var paused = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // Cache element positions relative to document.
  // Only called on init, resize, or intersection change — NOT on scroll.
  function cachePositions() {
    vh = window.innerHeight || 1;
    for (var i = 0; i < tracked.length; i++) {
      var r = tracked[i].el.getBoundingClientRect();
      tracked[i].top = r.top + (window.scrollY || window.pageYOffset);
      tracked[i].height = r.height;
    }
  }

  // Recompute fill for a single element using cached position
  function computeFill(item) {
    var start = vh * 0.94;
    var span = vh * 0.52;
    var elemTop = item.top - scrollY;
    return clamp((start - elemTop) / span);
  }

  // Update fills for all visible elements — uses cached positions, no layout reads
  function updateFills() {
    for (var i = 0; i < visible.length; i++) {
      var fill = computeFill(visible[i]);
      visible[i].el.style.setProperty('--fill', fill.toFixed(3));
    }
    // Global page progress drives the side rails + baseline
    var max = (document.documentElement.scrollHeight - vh) || 1;
    var p = clamp(scrollY / max);
    root.style.setProperty('--scroll', p.toFixed(4));
  }

  // Single shared rAF loop
  function rafUpdate() {
    ticking = false;
    if (paused) return;
    updateFills();
  }

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset;
    if (ticking || paused) return;
    ticking = true;
    requestAnimationFrame(rafUpdate);
  }

  function onResize() {
    cachePositions();
    onScroll();
  }

  // Pause/resume on visibility change
  function onVisibility() {
    if (document.hidden) {
      paused = true;
    } else {
      paused = false;
      scrollY = window.scrollY || window.pageYOffset;
      onScroll();
    }
  }

  function collect() {
    var nodes = document.querySelectorAll(BEAM_SELECTOR);
    var newTracked = [];
    var existingMap = {};
    // Build map of existing tracked elements
    for (var i = 0; i < tracked.length; i++) {
      existingMap[tracked[i].el] = tracked[i];
    }

    for (var j = 0; j < nodes.length; j++) {
      var el = nodes[j];
      if (el.classList.contains('neon-beam')) {
        // Already tracked — keep cached position
        if (existingMap[el]) {
          newTracked.push(existingMap[el]);
          delete existingMap[el];
        }
        continue;
      }
      el.classList.add('neon-beam');
      var r = el.getBoundingClientRect();
      var item = {
        el: el,
        top: r.top + (window.scrollY || window.pageYOffset),
        height: r.height
      };
      newTracked.push(item);
      if (io) io.observe(el);
    }
    // Unobserve any removed elements
    for (var key in existingMap) {
      if (io) io.unobserve(existingMap[key].el);
    }
    tracked = newTracked;
    // Rebuild visible list from tracked
    visible = tracked.filter(function (item) {
      return visible.indexOf(item) !== -1 || item.el.isConnected;
    });
  }

  function init() {
    injectChrome();

    // Reduced motion: light everything once, no scroll loop
    if (reduce) {
      root.style.setProperty('--scroll', '1');
      document.querySelectorAll(BEAM_SELECTOR).forEach(function (el) {
        el.classList.add('neon-beam');
        el.style.setProperty('--fill', '1');
      });
      return;
    }

    // Mobile: simplified — light beams once, skip scroll loop
    if (isMobile) {
      root.style.setProperty('--scroll', '1');
      document.querySelectorAll(BEAM_SELECTOR).forEach(function (el) {
        el.classList.add('neon-beam');
        var r = el.getBoundingClientRect();
        var start = (window.innerHeight || 1) * 0.94;
        var span = (window.innerHeight || 1) * 0.52;
        var fill = clamp((start - r.top) / span);
        el.style.setProperty('--fill', fill.toFixed(3));
      });
      // Still update side rails on scroll (cheap — just reads scrollY)
      window.addEventListener('scroll', function () {
        scrollY = window.scrollY || window.pageYOffset;
        var max = (document.documentElement.scrollHeight - (window.innerHeight || 1)) || 1;
        root.style.setProperty('--scroll', clamp(scrollY / max).toFixed(4));
      }, { passive: true });
      return;
    }

    // Desktop: full scroll-driven beams
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var item = null;
        for (var i = 0; i < tracked.length; i++) {
          if (tracked[i].el === e.target) { item = tracked[i]; break; }
        }
        if (!item) return;

        if (e.isIntersecting) {
          if (visible.indexOf(item) === -1) visible.push(item);
          // Immediately set fill to avoid flash
          var fill = computeFill(item);
          item.el.style.setProperty('--fill', fill.toFixed(3));
        } else {
          var idx = visible.indexOf(item);
          if (idx !== -1) visible.splice(idx, 1);
          // Lock to settled end state
          var elemTop = item.top - scrollY;
          item.el.style.setProperty('--fill', elemTop < 0 ? '1' : '0');
        }
      });
      // Recache positions on intersection changes (layout may have shifted)
      cachePositions();
      if (!ticking && !paused) {
        ticking = true;
        requestAnimationFrame(rafUpdate);
      }
    }, { rootMargin: '120px 0px 120px 0px', threshold: 0 });

    scrollY = window.scrollY || window.pageYOffset;
    vh = window.innerHeight || 1;

    collect();
    cachePositions();
    updateFills();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // Re-collect when products / cards render in later (debounced)
    var moTimer = null;
    var mo = new MutationObserver(function () {
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(function () {
        collect();
        cachePositions();
        onScroll();
      }, 200);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
