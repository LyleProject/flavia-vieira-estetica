(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasG = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var WA = '5511996680606';
  var wa = function (t) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t); };

  /* links de WhatsApp com mensagem contextual (data-wa) */
  $$('[data-wa]').forEach(function (a) {
    a.setAttribute('href', wa(a.getAttribute('data-wa')));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  /* ---------- controle de scroll e menu ---------- */
  var lenis = null;
  if (hasG && !reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  }
  if (hasG) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  var lock = function (on) {
    if (lenis) { on ? lenis.stop() : lenis.start(); }
    else { root.style.overflow = on ? 'hidden' : ''; }
  };

  var hdr = $('.hdr'), burger = $('.burger');
  var setMenu = function (open) {
    hdr.classList.toggle('menu-open', open);
    d.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    lock(open);
  };
  burger.addEventListener('click', function () { setMenu(!hdr.classList.contains('menu-open')); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.classList.contains('menu-open')) setMenu(false); });

  var wipe = $('.wipe'), wiping = false;
  var wipeTo = function (jump) {
    if (wiping) return;
    wiping = true;
    gsap.set(wipe, { visibility: 'visible', yPercent: 100 });
    gsap.set('.wipe img', { opacity: 0, y: 14 });
    gsap.timeline({ onComplete: function () { wipe.style.visibility = 'hidden'; wiping = false; } })
      .to(wipe, { yPercent: 0, duration: .5, ease: 'power4.inOut' })
      .to('.wipe img', { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, '-=.15')
      .add(function () { jump(true); })
      .to('.wipe img', { opacity: 0, y: -10, duration: .22, ease: 'power2.in' }, '+=.28')
      .to(wipe, { yPercent: -100, duration: .6, ease: 'power4.inOut' }, '-=.05');
  };

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0 }); return; }
      var t = $(id);
      if (!t) return;
      e.preventDefault();
      var wasOpen = hdr.classList.contains('menu-open');
      if (wasOpen) setMenu(false);
      var off = id === '#tratamentos' ? 0 : -70;
      var jump = function (imm) {
        if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.4, immediate: !!imm });
        else if (imm) { window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY + off); }
        else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      };
      if (hasG && !reduce && wipe) wipeTo(jump); else jump(false);
      if (t.id) history.replaceState(null, '', id);
    });
  });

  var lastY = 0;
  var onScroll = function () {
    var y = window.scrollY || root.scrollTop;
    hdr.classList.toggle('is-solid', y > 40);
    hdr.classList.toggle('is-hidden', y > lastY && y > 500 && !hdr.classList.contains('menu-open'));
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- botão flutuante contextual ---------- */
  var fab = $('#fab');
  var msgs = {
    hero: 'Olá, Flávia! Vim pelo site e gostaria de agendar uma avaliação.',
    tratamentos: 'Olá! Vi os tratamentos no site e queria saber qual é o ideal para mim.',
    resultados: 'Olá! Vi os resultados no site e gostaria de agendar uma avaliação.',
    sobre: 'Olá, Flávia! Gostaria de conhecer a clínica e agendar uma avaliação.',
    faq: 'Olá! Tenho uma dúvida sobre os tratamentos.',
    contato: 'Olá! Gostaria de agendar uma avaliação.'
  };
  var showFab = function () {
    var y = window.scrollY || root.scrollTop;
    var c = $('#contato').getBoundingClientRect();
    var inContact = c.top < innerHeight * 0.5;
    fab.classList.toggle('is-on', y > 520 && !inContact);
  };
  window.addEventListener('scroll', showFab, { passive: true });
  showFab();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) fab.setAttribute('href', wa(msgs[e.target.getAttribute('data-ctx')] || msgs.hero));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    $$('[data-ctx]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- antes/depois ---------- */
  $$('.ba').forEach(function (fig) {
    var inp = $('input', fig);
    var set = function () { fig.style.setProperty('--p', inp.value + '%'); };
    inp.addEventListener('input', set);
    set();
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), lbImgs = $('.lb__imgs', lb), lbT = $('.lb__t', lb), lastFocus = null;
  var fig = function (src, alt, w, h, cap) {
    var f = d.createElement('figure'), i = d.createElement('img');
    i.src = src; i.alt = alt; if (w) i.width = w; if (h) i.height = h;
    f.appendChild(i);
    if (cap) { var c = d.createElement('figcaption'); c.textContent = cap; f.appendChild(c); }
    return f;
  };
  var openLb = function (nodes, title) {
    lastFocus = d.activeElement;
    lbImgs.textContent = '';
    nodes.forEach(function (n) { lbImgs.appendChild(n); });
    lbT.textContent = title || '';
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    lock(true);
    $('.lb__x', lb).focus();
  };
  var closeLb = function () {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
    lock(false);
    if (lastFocus) lastFocus.focus();
  };
  $$('.ba .zoom').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.ba'), w = f.dataset.w, h = f.dataset.h, t = f.dataset.title;
      openLb([
        fig(f.dataset.before, 'Antes: ' + t, w, h, 'Antes'),
        fig(f.dataset.after, 'Depois: ' + t, w, h, 'Depois')
      ], t);
    });
  });
  $$('[data-single]').forEach(function (b) {
    b.addEventListener('click', function () {
      openLb([fig(b.dataset.single, b.dataset.alt, b.dataset.w, b.dataset.h)], '');
    });
  });
  $('.lb__x', lb).addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__in')) closeLb(); });
  lb.addEventListener('cancel', function (e) { e.preventDefault(); closeLb(); });

  /* ---------- mapa sob demanda ---------- */
  var mapBtn = $('#loadmap');
  if (mapBtn) mapBtn.addEventListener('click', function () {
    var m = $('#map'), f = d.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('R. Ana Bauduíno Abreu, 151, Jordanésia, Cajamar - SP') + '&output=embed';
    f.title = 'Mapa com a localização da clínica em Cajamar-SP';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    m.textContent = ''; m.appendChild(f);
  });

  /* ---------- formulário (abre WhatsApp) ---------- */
  var form = $('#form'), t0 = Date.now();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('.err', form), nome = form.nome.value.trim();
    if (form.site.value) return;
    if (Date.now() - t0 < 2500) { err.textContent = 'Aguarde um instante e tente de novo.'; return; }
    if (nome.length < 2) { err.textContent = 'Informe o seu nome para continuarmos.'; form.nome.focus(); return; }
    err.textContent = '';
    var trat = form.trat.value, msg = form.msg.value.trim();
    var txt = 'Olá! Me chamo ' + nome + '. ' + (trat ? 'Tenho interesse em ' + trat.toLowerCase() + '. ' : 'Gostaria de agendar uma avaliação. ') + (msg ? msg + ' ' : '') + '(enviado pelo site)';
    window.open(wa(txt), '_blank', 'noopener');
  });

  /* ---------- a partir daqui: animações (precisam de GSAP) ---------- */
  if (!hasG) return;
  root.classList.add('js');

  /* divide títulos em palavras com máscara */
  var splitEl = function (el) {
    var kids = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    var walk = function (node, parent) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { parent.appendChild(d.createTextNode(' ')); return; }
          var w = d.createElement('span'), i = d.createElement('span');
          w.className = 'w'; i.className = 'wi'; i.textContent = tok;
          w.appendChild(i); parent.appendChild(w);
        });
      } else if (node.nodeType === 1) {
        var c = node.cloneNode(false); parent.appendChild(c);
        Array.prototype.slice.call(node.childNodes).forEach(function (k) { walk(k, c); });
      }
    };
    kids.forEach(function (k) { walk(k, el); });
  };

  var heroH = $('[data-split="hero"]');
  $$('[data-split]').forEach(splitEl);

  var counters = $$('[data-count]');
  var fmt = function (el, v) {
    var dec = +el.getAttribute('data-dec') || 0;
    el.textContent = v.toFixed(dec).replace('.', ',');
  };

  if (reduce) {
    $$('.loader').forEach(function (l) { l.style.display = 'none'; });
    return;
  }

  gsap.set('.wi', { yPercent: 115 });
  gsap.set('[data-reveal]', { opacity: 0, y: 34 });
  gsap.set('[data-hero="fade"]', { opacity: 0, y: 24 });
  gsap.set('[data-hero="fig"]', { opacity: 0, y: 40 });
  gsap.set('#heroimg', { scale: 1.18 });
  counters.forEach(function (c) { fmt(c, 0); });

  /* loader curto + revelação do hero */
  var loader = $('.loader');
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('.loader__bar i', { scaleX: 1, duration: .55, ease: 'power2.inOut' })
    .to('.loader__in', { opacity: 0, y: -10, duration: .25 }, '>-.02')
    .to(loader, { yPercent: -100, duration: .65, ease: 'power4.inOut', onComplete: function () { loader.style.display = 'none'; } }, '>-.05')
    .to('#heroimg', { scale: 1, duration: 2.6, ease: 'power2.out' }, '<.15')
    .to('[data-hero="fig"]', { opacity: 1, y: 0, duration: 1.1 }, '<.1')
    .to(heroH.querySelectorAll('.wi'), { yPercent: 0, duration: 1, stagger: .09, ease: 'power4.out' }, '<.05')
    .to('[data-hero="fade"]', { opacity: 1, y: 0, duration: .9, stagger: .1 }, '<.35');

  /* títulos */
  $$('[data-split]').forEach(function (el) {
    if (el === heroH) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(el.querySelectorAll('.wi'), { yPercent: 0, duration: 1, stagger: .07, ease: 'power4.out' }); }
    });
  });

  /* reveal com stagger */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%', once: true,
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .12, overwrite: true }); }
  });

  /* contadores (números reais) */
  counters.forEach(function (c) {
    var to = +c.getAttribute('data-count'), o = { v: 0 };
    ScrollTrigger.create({
      trigger: c, start: 'top 92%', once: true,
      onEnter: function () { gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', onUpdate: function () { fmt(c, o.v); } }); }
    });
  });

  /* parallax sutil */
  $$('[data-parallax]').forEach(function (img) {
    gsap.set(img, { scale: 1.14 });
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.to('.hero__fig', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.about__ghost', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* tratamentos: scroll horizontal pinado no desktop */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var sec = $('.treat'), track = $('.treat__track'), bar = $('.tprog i');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: sec, pin: true, scrub: 1, start: 'top top', anticipatePin: 1, invalidateOnRefresh: true,
        end: function () { return '+=' + dist(); },
        onUpdate: function (s) { gsap.set(bar, { scaleX: s.progress }); }
      }
    });
  });

  /* botões magnéticos + cursor (só desktop) */
  if (fine) {
    $$('.magnetic').forEach(function (b) {
      var xt = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yt = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        xt((e.clientX - r.left - r.width / 2) * .22); yt((e.clientY - r.top - r.height / 2) * .32);
      });
      b.addEventListener('pointerleave', function () { xt(0); yt(0); });
    });
    var cur = $('.cursor');
    var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) {
      cx(e.clientX); cy(e.clientY); cur.classList.add('is-on');
    }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var t = e.target;
      cur.classList.toggle('is-hover', !!t.closest('a,button,summary,select,input,textarea,.ba__stage'));
      cur.classList.toggle('on-dark', !!t.closest('.dark'));
    });
    d.documentElement.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
  }

  /* recalcula layout após fontes e imagens */
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
