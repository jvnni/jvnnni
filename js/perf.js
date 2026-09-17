/* JVNNI performance guard
   Pauses decorative animations while they are off-screen or the tab is hidden,
   and stops the carousel autoplay from running in the background. Every one of
   these was quietly consuming a frame budget that ad traffic cannot spare. */
(function () {
  'use strict';

  var SELECTORS = [
    '.hero-carousel-block',
    '.neon-bar',
    '.hero-stripe',
    '.hero-stripe-alt',
    '.scroll-progress'
  ];

  function watch() {
    if (!('IntersectionObserver' in window)) return;
    var nodes = [];
    SELECTORS.forEach(function (sel) {
      Array.prototype.push.apply(nodes, document.querySelectorAll(sel));
    });
    if (!nodes.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-offscreen', !e.isIntersecting);
      });
    }, { rootMargin: '120px' });

    nodes.forEach(function (n) { io.observe(n); });
  }

  // A hidden tab should cost nothing at all.
  function pauseAll(hidden) {
    document.documentElement.classList.toggle('is-bg-tab', hidden);
  }
  document.addEventListener('visibilitychange', function () { pauseAll(document.hidden); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
})();
