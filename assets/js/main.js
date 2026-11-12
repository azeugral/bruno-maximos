(function () {
  var d = document, html = d.documentElement, hero = d.querySelector('.hero');
  var WA = '351962953437';

  /* ---------- medidas do hero ---------- */
  var grande = d.getElementById('grande'), palco = d.getElementById('palco');
  function VW() { return html.clientWidth || innerWidth; }
  function ajustar() {
    var vw = VW(), vh = innerHeight, g = Math.max(16, Math.min(vw * .04, 56));
    var base = vh < 560 ? 76 : vw < 640 ? 190 : 170;
    var ah = Math.max(240, Math.min(vh - 84 - base, vw - (vw < 640 ? 0 : 2 * g), 1000));
    hero.style.setProperty('--ah', ah + 'px');
    grande.style.setProperty('--fs', '100px');
    var r = grande.scrollWidth / 100;
    var alvo = vw < 640 ? vw - 2 * g : Math.min(vw - 2 * g - (vw > 1100 ? 260 : 0), ah * 1.15);
    var fs = Math.max(40, alvo / r).toFixed(1) + 'px';
    grande.style.setProperty('--fs', fs); hero.style.setProperty('--fs', fs);
  }
  ajustar();
  addEventListener('resize', ajustar);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(ajustar);

  /* ---------- hero: do macro à peça inteira ----------
     Cada peça abre num close extremo (o olho, a pele) e afasta até a obra inteira em ~1,3 s.
     Só transform/opacity (GPU), sem vídeo nem WebGL: fluido também no celular. */
  var PH = [
    { n: 'premio', f: [.66, .36], z: 3.4, r: ['Nº 1', 'Realismo B&G · 1.º lugar'], s: '1.º lugar' },
    { n: 'poseidon', f: [.40, .42], z: 3.0, r: ['Nº 2', 'Poseidon · antebraço'], s: 'Mitologia' },
    { n: 'olho', f: [.45, .55], z: 3.8, r: ['Nº 3', 'O tempo · antebraço'], s: 'Olhar' },
    { n: 'leopardo', f: [.40, .42], z: 3.2, r: ['Nº 4', 'Leopardo · costas inteiras'], s: 'Fechamento' }
  ];
  var CICLO = 4600, ZOOM = 1350, EASE = 'cubic-bezier(.2,.75,.1,1)';
  var jan = d.getElementById('qJanela'), qz = d.getElementById('qZoom'), selo = d.getElementById('qSelo'), peca = d.getElementById('peca');
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  PH.forEach(function (p) { var im = new Image(); im.src = 'assets/img/h/' + p.n + '.webp'; p.im = im; });
  function num(v) { return '×' + v.toFixed(1).replace('.', ','); }
  function rotulo(p) {
    peca.style.opacity = 0; selo.classList.remove('on');
    setTimeout(function () { peca.children[0].textContent = p.r[0]; peca.children[1].textContent = p.r[1]; selo.textContent = p.s; peca.style.opacity = 1; selo.classList.add('on'); }, 260);
  }
  function abrirPeca(i, primeira) {
    var p = PH[i], im = jan.querySelector('img:last-child');
    if (!primeira) {
      im = d.createElement('img'); im.src = p.im.src; im.alt = p.r[1] + ', tatuagem realista de Bruno Máximos';
      jan.appendChild(im);
      var velhas = [].slice.call(jan.querySelectorAll('img')).slice(0, -1);
      setTimeout(function () { velhas.forEach(function (v) { v.remove(); }); }, 500);
    }
    im.style.transformOrigin = (p.f[0] * 100) + '% ' + (p.f[1] * 100) + '%';
    im.animate([{ transform: 'scale(' + p.z + ')', opacity: 0 }, { opacity: 1, offset: .14 }, { transform: 'scale(1)', opacity: 1 }], { duration: ZOOM, easing: EASE, fill: 'both' });
    im.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }], { duration: CICLO - ZOOM, delay: ZOOM, easing: 'linear', fill: 'forwards', composite: 'replace' });
    var t0 = performance.now();
    (function cont(t) {
      var k = Math.min(1, (t - t0) / ZOOM), e = 1 - Math.pow(1 - k, 4);
      qz.textContent = num(p.z + (1 - p.z) * e);
      if (k < 1) requestAnimationFrame(cont);
    })(t0);
    rotulo(p);
  }
  if (reduz) { qz.textContent = num(1); selo.classList.add('on'); }
  else {
    var atual = 0, vis = true;
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(palco);
    abrirPeca(0, true);
    setInterval(function () { if (!vis || d.hidden) return; atual = (atual + 1) % PH.length; abrirPeca(atual); }, CICLO);
  }

  /* entrada */
  d.querySelectorAll('.eti,.hero-base,.pre,.quadro').forEach(function (el) { el.classList.add('ent'); });
  requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('pronto'); }, 30); });

  /* ---------- topo e gaveta ---------- */
  var topo = d.getElementById('topo'), gav = d.getElementById('gaveta'), burger = d.getElementById('burger');
  function rolar() { topo.classList.toggle('solido', scrollY > 30); }
  addEventListener('scroll', rolar, { passive: true }); rolar();
  function gaveta(a) { gav.hidden = !a; burger.setAttribute('aria-expanded', a); d.body.style.overflow = a ? 'hidden' : ''; }
  burger.addEventListener('click', function () { gaveta(gav.hidden); });
  gav.addEventListener('click', function (e) { if (e.target.closest('a')) gaveta(false); });

  /* ---------- revelação ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  function observar() { d.querySelectorAll('.rev:not(.vis),.item:not(.vis)').forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); }); }

  /* ---------- portfólio ---------- */
  var grade = d.getElementById('grade'), mais = d.getElementById('mais'), filtro = 'todos';
  var passoN = matchMedia('(max-width:640px)').matches ? 8 : 12, limite = passoN;
  /* contagem real em cada filtro e no destaque */
  var nP = d.getElementById('nPecas'); if (nP) nP.textContent = PECAS.length;
  d.querySelectorAll('.filtros button').forEach(function (b) {
    var n = b.dataset.f === 'todos' ? PECAS.length : PECAS.filter(function (p) { return p.t === b.dataset.f; }).length;
    var c = d.createElement('sup'); c.textContent = n; b.appendChild(c);
  });
  var TAG = { realismo: 'Realismo', trash: 'Trash Polka', curadas: 'Cicatrizada', coberturas: 'Cobertura' };
  PECAS.forEach(function (p, i) {
    var f = d.createElement('figure'); f.className = 'item'; f.tabIndex = 0; f.dataset.i = i;
    f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Ampliar: ' + p.l);
    f.innerHTML = '<div class="fr"><img src="assets/img/p/' + p.c + '.webp" alt="' + p.l + ', tatuagem de Bruno Máximos" loading="lazy" width="800" height="1000"></div><figcaption>' + p.l + '</figcaption>';
    grade.appendChild(f);
  });
  var itens = [].slice.call(grade.children);
  function visiveis() { return itens.filter(function (el) { return filtro === 'todos' || PECAS[el.dataset.i].t === filtro; }); }
  function aplicar() {
    var v = visiveis();
    itens.forEach(function (el) { el.classList.add('sai'); });
    v.forEach(function (el, k) { if (k < limite) el.classList.remove('sai'); });
    mais.hidden = v.length <= limite;
  }
  aplicar(); observar();
  d.querySelectorAll('.filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('.filtros button').forEach(function (x) { x.classList.toggle('on', x === b); });
      filtro = b.dataset.f; limite = passoN; aplicar();
      grade.animate && grade.animate([{ opacity: .15, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.16,.84,.32,1)' });
    });
  });
  mais.addEventListener('click', function () { limite += passoN; aplicar(); });

  /* lightbox */
  var lb = d.getElementById('lb'), lbImg = d.getElementById('lbImg'), lbCap = d.getElementById('lbCap'), atual = 0, lista = [];
  function abrir(i) { lista = visiveis().map(function (el) { return +el.dataset.i; }); atual = Math.max(0, lista.indexOf(i)); mostrar(); lb.hidden = false; d.body.style.overflow = 'hidden'; }
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
  lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 45) passo(dx < 0 ? 1 : -1); tx = null; });

  /* ---------- marcação pelo WhatsApp ---------- */
  var form = d.getElementById('form'), erro = d.getElementById('erro');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), nome = (f.get('nome') || '').trim();
    if (!nome) { erro.hidden = false; form.nome.focus(); return; }
    erro.hidden = true;
    var l = ['Olá Bruno! Sou *' + nome + '* e gostava de marcar uma sessão.', '',
      '*Estilo:* ' + f.get('estilo'), '*Cobertura:* ' + f.get('cob'),
      '*Zona do corpo:* ' + ((f.get('zona') || '').trim() || 'a definir'),
      '*Tamanho:* ' + f.get('tamanho'), '*Disponibilidade:* ' + f.get('quando')];
    var ideia = (f.get('ideia') || '').trim();
    if (ideia) l.push('', '*Ideia:* ' + ideia);
    l.push('', '(pedido enviado pelo site)');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
  });
})();
