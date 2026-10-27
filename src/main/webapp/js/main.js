/* OBKGREEN · JS modular.
   Cada funcionalidad es un módulo independiente que se inicia al final. */
(function () {
  'use strict';

  /* ---- Menú móvil (activo) ---- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Cerrar al pulsar un enlace o Escape
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---- Copiar correo al portapapeles (activo) ---- */
  function initCopyEmail() {
    var btn = document.getElementById('copy-email');
    var status = document.getElementById('copy-status');
    if (!btn) return;

    function notify(msg) {
      // Estado visual: botón dorado con "¡Copiado!" (o aviso de error) durante 2 s
      var ok = msg.indexOf('No se') !== 0;
      var original = btn.dataset.label || (btn.dataset.label = btn.textContent);
      btn.textContent = ok ? '\u00a1Copiado!' : msg;
      btn.classList.toggle('is-copied', ok);
      btn.classList.toggle('is-error', !ok);
      if (status) status.textContent = ok ? 'Correo copiado al portapapeles' : msg;
      clearTimeout(btn._t);
      btn._t = setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('is-copied', 'is-error');
      }, 2000);
    }
    // Alternativa para navegadores sin Clipboard API o sin HTTPS
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { /* sin acción */ }
      document.body.removeChild(ta);
      return ok;
    }

    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(function () { notify('Correo copiado'); })
          .catch(function () { notify(fallbackCopy(text) ? 'Correo copiado' : 'No se pudo copiar'); });
      } else {
        notify(fallbackCopy(text) ? 'Correo copiado' : 'No se pudo copiar');
      }
    });
  }

  /* ---- Año del pie (activo) ---- */
  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---- Efectos visuales (activo) ---- */
  function initEffects() {
    var header = document.querySelector('.site-header');
    function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 10); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!('IntersectionObserver' in window)) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Menú: resalta el enlace de la sección visible
    var links = document.querySelectorAll('.nav a[href^="#"]');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

    // Aparición suave (una sola vez) de tarjetas y fotos
    if (reduce) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.panel, .gallery figure').forEach(function (el) {
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* ---- Buscador de normativa (activo) ---- */
  function initNormSearch() {
    var input = document.getElementById('norm-search'), msg = document.getElementById('norm-count');
    var blocks = document.querySelectorAll('[data-accordion] details');
    if (!input || !blocks.length) return;
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

    input.addEventListener('input', function () {
      var q = norm(input.value.trim()), total = 0;
      blocks.forEach(function (d) {
        var hits = 0;
        d.querySelectorAll('li').forEach(function (li) {
          var match = !q || norm(li.textContent).indexOf(q) !== -1;
          li.hidden = !match; if (q && match) hits++;
        });
        d.hidden = !!q && hits === 0;   // oculta bloques sin resultados
        d.open = !!q && hits > 0;       // abre los que coinciden
        total += hits;
      });
      msg.textContent = !q ? '' : (total ? total + (total === 1 ? ' resultado' : ' resultados') : 'Sin resultados para \u00ab' + input.value.trim() + '\u00bb.');
    });
  }

  /* ---- Verificación de edad, normativa y galería (activos) ---- */
  function initAgeGate() {
    // Modal +18. La decisión se recuerda solo durante la sesión (sessionStorage).
    var dlg = document.getElementById('age-gate');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    try { if (sessionStorage.getItem('obk-age') === 'ok') return; } catch (e) { /* sin almacenamiento */ }

    dlg.addEventListener('cancel', function (e) { e.preventDefault(); }); // Escape no lo cierra
    document.getElementById('age-yes').addEventListener('click', function () {
      try { sessionStorage.setItem('obk-age', 'ok'); } catch (e) { /* sin acción */ }
      dlg.close();
    });
    document.getElementById('age-no').addEventListener('click', function () {
      window.location.href = 'https://www.google.es';
    });
    dlg.showModal();
  }
  function initAccordion() {
    // Cada bloque es un <details> nativo; este botón abre o cierra todos a la vez.
    var btn = document.getElementById('acc-toggle');
    var items = document.querySelectorAll('[data-accordion] details');
    if (!btn || !items.length) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-pressed') !== 'true';
      items.forEach(function (d) { d.open = open; });
      btn.setAttribute('aria-pressed', String(open));
      btn.textContent = open ? 'Cerrar todo' : 'Desplegar todo';
    });
  }
  function initGallery() {
    // Lightbox accesible: flechas del teclado, Escape, clic fuera y deslizar en móvil.
    var imgs = Array.prototype.slice.call(document.querySelectorAll('[data-gallery] img'));
    var dlg = document.getElementById('lightbox');
    if (!dlg || !imgs.length || typeof dlg.showModal !== 'function') return;
    var big = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), i = 0, x0 = null;

    function show(n) {
      i = (n + imgs.length) % imgs.length;
      big.src = imgs[i].src; big.alt = imgs[i].alt;
      cap.textContent = imgs[i].alt + ' (' + (i + 1) + '/' + imgs.length + ')';
    }
    imgs.forEach(function (img, n) {
      img.closest('button').addEventListener('click', function () { show(n); dlg.showModal(); });
    });
    dlg.querySelector('[data-prev]').addEventListener('click', function () { show(i - 1); });
    dlg.querySelector('[data-next]').addEventListener('click', function () { show(i + 1); });
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initYear(); initNav(); initCopyEmail(); initEffects();
    initAgeGate(); initAccordion(); initNormSearch(); initGallery();
  });
})();
