// JVNNI — product page chrome: theme toggle + nav scroll state
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

  // mobile menu
  var mBtn = document.querySelector('.nav-menu-btn');
  var mLinks = document.querySelector('.nav-links');
  if (mBtn && mLinks) {
    mBtn.addEventListener('click', function () {
      var open = mBtn.classList.toggle('open');
      mLinks.classList.toggle('open', open);
      mBtn.setAttribute('aria-expanded', String(open));
    });
    mLinks.querySelectorAll('.nav-link').forEach(function (a) {
      a.addEventListener('click', function () {
        mBtn.classList.remove('open');
        mLinks.classList.remove('open');
        mBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var nav = document.querySelector('.nav');
  if (nav) {
    var ticking = false;
    var sync = function () { nav.classList.toggle('scrolled', window.scrollY > 20); ticking = false; };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(sync); ticking = true; }
    }, { passive: true });
    sync();
  }
})();
