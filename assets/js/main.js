(function () {
  var d = document, html = d.documentElement, hero = d.querySelector('.hero');
  var WA = '351962953437';

  /* ---------- layout do hero ---------- */
  function VW() { return html.clientWidth || innerWidth; }
  function estreito() { return VW() < 640 || VW() / innerHeight < 1.05; }
  var n1 = d.querySelector('.n1'), n2 = d.querySelector('.n2'), arte = d.getElementById('arte');
  function ajustar() {
    var e = estreito();
    html.classList.toggle('estreito', e);
    var g = parseFloat(getComputedStyle(d.querySelector('.sec') || d.body).paddingLeft) || 16;
    var fs;
    hero.style.setProperty('--fs', '100px');
    var w1 = n1.scrollWidth / 100, w2 = n2.scrollWidth / 100;
    if (e) {
      var disp = VW() - 2 * Math.max(16, Math.min(VW() * .04, 48)) - 4;
      fs = disp / (w1 + w2 + .22);
      fs = Math.min(fs, innerHeight * .1);
    } else {
      var aw = arte.getBoundingClientRect().width;
      var gap = Math.min(56, Math.max(20, innerWidth * .03));
      var col = (VW() - aw) / 2 - gap - g;
      fs = col / Math.max(w1, w2);
      fs = Math.min(fs, arte.getBoundingClientRect().height * .24);
    }
    hero.style.setProperty('--fs', Math.max(28, fs).toFixed(1) + 'px');
  }
  ajustar();
  addEventListener('resize', ajustar);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(ajustar);

  /* ---------- arte animada ---------- */
  var img = arte.querySelector('.arte-img'), cv = d.getElementById('arteCv'), vid = d.getElementById('arteVid');
  var barras = [].slice.call(d.querySelectorAll('#barras i'));
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function marcar(i) { barras.forEach(function (b, k) { b.classList.toggle('on', k <= i); }); }
  marcar(0);
  var usarVideo = estreito() && matchMedia('(pointer: coarse)').matches;
  var qs = new URLSearchParams(location.search);
  if (qs.has('render')) {
    /* modo de captura: tools/gerar_video.py e tools/ver.py desenham quadro a quadro */
    var w = +qs.get('w') || 0, h = +qs.get('h') || 0;
    HeroRasgo.iniciar(cv, 'assets/img/hero/', { render: true, intro: qs.has('intro'), w: w, h: h }).then(function (q) {
      cv.hidden = false; img.style.opacity = 0; window.__q = q; window.__pronto = true;
    });
  } else if (!reduz && usarVideo) {
    vid.src = 'assets/video/hero.mp4?v=1'; vid.hidden = false;
    vid.addEventListener('playing', function () { img.style.opacity = 0; });
    vid.addEventListener('timeupdate', function () {
      marcar(Math.floor((vid.currentTime + .675) / 6.55) % 5);
    });
    vid.play().catch(function () {});
  } else if (!reduz && window.HeroRasgo) {
    var t0 = null, vis = true;
    HeroRasgo.iniciar(cv, 'assets/img/hero/', { intro: true, onPeca: marcar }).then(function (q) {
      cv.hidden = false; img.style.opacity = 0;
      new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(arte);
      function loop(ts) {
        if (t0 === null) t0 = ts;
        if (vis && !d.hidden) q((ts - t0) / 1000);
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }).catch(function () { cv.hidden = true; img.style.opacity = 1; });
  }

  /* entrada */
  [arte, d.querySelector('.hero-base')].forEach(function (el) { el.classList.add('entra'); });
  d.querySelectorAll('.nome span,.lado').forEach(function (el) { el.style.opacity = 0; el.style.transition = 'opacity 1s cubic-bezier(.16,.84,.32,1)'; });
  requestAnimationFrame(function () {
    setTimeout(function () {
      hero.classList.add('pronto');
      d.querySelectorAll('.nome span,.lado').forEach(function (el, i) { setTimeout(function () { el.style.opacity = 1; }, 150 + i * 120); });
    }, 60);
  });

  /* ---------- topo e menu ---------- */
  var topo = d.getElementById('topo'), menu = d.getElementById('menu'), burger = d.getElementById('burger');
  function rolar() { topo.classList.toggle('solido', scrollY > 30); }
  addEventListener('scroll', rolar, { passive: true }); rolar();
  burger.addEventListener('click', function () {
    var a = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', a); burger.setAttribute('aria-expanded', a); d.body.style.overflow = a ? 'hidden' : '';
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { menu.classList.remove('aberto'); burger.setAttribute('aria-expanded', false); d.body.style.overflow = ''; }
  });

  /* ---------- revelação ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  function observar(root) { (root || d).querySelectorAll('.rev:not(.vis)').forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); }); }
  observar();

  /* ---------- portfólio ---------- */
  var grade = d.getElementById('grade'), mais = d.getElementById('mais'), filtro = 'todos', limite = 12;
  var mob = matchMedia('(max-width:760px)').matches;
  if (mob) limite = 8;
  PECAS.forEach(function (p, i) {
    var f = d.createElement('figure'); f.className = 'item'; f.tabIndex = 0; f.dataset.i = i;
    f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Ampliar: ' + p.l);
    f.innerHTML = '<img src="assets/img/p/' + p.c + '.webp" alt="' + p.l + ', tatuagem de Bruno Máximos" loading="lazy" width="800" height="1000"><figcaption>' + p.l + '</figcaption>';
    grade.appendChild(f);
  });
  var itens = [].slice.call(grade.children);
  function visiveis() { return itens.filter(function (el) { var p = PECAS[el.dataset.i]; return filtro === 'todos' || p.t === filtro; }); }
  function aplicar() {
    var v = visiveis();
    itens.forEach(function (el) { el.classList.add('sai'); });
    v.forEach(function (el, k) { if (k < limite) el.classList.remove('sai'); });
    mais.hidden = v.length <= limite;
  }
  aplicar();
  d.querySelectorAll('.filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('.filtros button').forEach(function (x) { x.classList.toggle('on', x === b); });
      filtro = b.dataset.f; limite = mob ? 8 : 12; aplicar();
      grade.animate && grade.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.16,.84,.32,1)' });
    });
  });
  mais.addEventListener('click', function () { limite += mob ? 8 : 12; aplicar(); });

  /* lightbox */
  var lb = d.getElementById('lb'), lbImg = d.getElementById('lbImg'), lbCap = d.getElementById('lbCap'), atual = 0, lista = [];
  function abrir(i) {
    lista = visiveis().map(function (el) { return +el.dataset.i; });
    atual = Math.max(0, lista.indexOf(i)); mostrar(); lb.hidden = false; d.body.style.overflow = 'hidden';
  }
  function mostrar() { var p = PECAS[lista[atual]]; lbImg.src = 'assets/img/p/' + p.c + '.webp'; lbImg.alt = p.l; lbCap.textContent = p.l; }
  function passo(n) { atual = (atual + n + lista.length) % lista.length; mostrar(); }
  function fechar() { lb.hidden = true; d.body.style.overflow = ''; }
  grade.addEventListener('click', function (e) { var f = e.target.closest('.item'); if (f) abrir(+f.dataset.i); });
  grade.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = e.target.closest('.item'); if (f) abrir(+f.dataset.i); } });
  d.getElementById('lbX').onclick = fechar;
  d.getElementById('lbP').onclick = function () { passo(-1); };
  d.getElementById('lbS').onclick = function () { passo(1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) fechar(); });
  addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') fechar(); if (e.key === 'ArrowLeft') passo(-1); if (e.key === 'ArrowRight') passo(1);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 45) passo(dx < 0 ? 1 : -1); tx = null;
  });

  /* ---------- marcação pelo WhatsApp ---------- */
  var form = d.getElementById('form'), erro = d.getElementById('erro');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), nome = (f.get('nome') || '').trim();
    if (!nome) { erro.hidden = false; form.nome.focus(); return; }
    erro.hidden = true;
    var linhas = [
      'Olá Bruno! Sou *' + nome + '* e gostava de marcar uma sessão.', '',
      '*Estilo:* ' + f.get('estilo'),
      '*Cobertura:* ' + f.get('cob'),
      '*Zona do corpo:* ' + ((f.get('zona') || '').trim() || 'a definir'),
      '*Tamanho:* ' + f.get('tamanho'),
      '*Disponibilidade:* ' + f.get('quando')
    ];
    var ideia = (f.get('ideia') || '').trim();
    if (ideia) linhas.push('', '*Ideia:* ' + ideia);
    linhas.push('', '(pedido enviado pelo site)');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
  });
})();
