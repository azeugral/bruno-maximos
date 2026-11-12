(function () {
  var d = document, html = d.documentElement, hero = d.querySelector('.hero');
  var WA = '351962953437';
  var ROT = [['Nº 1', 'Realismo B&G · 1.º lugar'], ['Nº 2', 'Poseidon · braço'], ['Nº 3', 'Lobo · ombro'], ['Nº 4', 'O tempo · antebraço']];

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
    var alvo = vw < 640 ? vw - 2 * g : Math.min(vw - 2 * g - (vw > 1100 ? 260 : 0), ah * 1.9);
    grande.style.setProperty('--fs', Math.max(40, alvo / r).toFixed(1) + 'px');
  }
  ajustar();
  addEventListener('resize', ajustar);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(ajustar);

  /* ---------- arte ---------- */
  var cv = d.getElementById('arteCv'), vid = d.getElementById('arteVid'), fixa = d.getElementById('arteImg');
  var peca = d.getElementById('peca'), atualP = 0;
  function rotulo(i) {
    if (i === atualP) return; atualP = i;
    peca.style.opacity = 0;
    setTimeout(function () { peca.children[0].textContent = ROT[i][0]; peca.children[1].textContent = ROT[i][1]; peca.style.opacity = 1; }, 380);
  }
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search);

  function shader() {
    return HeroTinta.iniciar(cv, 'assets/hero/', { onPeca: function (i) { rotulo(i); } }).then(function (q) {
      cv.hidden = false; vid.hidden = true; fixa.hidden = true;
      var t0 = null, vis = true;
      new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(palco);
      (function loop(ts) {
        if (t0 === null) t0 = ts;
        if (vis && !d.hidden) q((ts - t0) / 1000);
        requestAnimationFrame(loop);
      })(performance.now());
    });
  }
  function parado() { cv.hidden = true; vid.hidden = true; fixa.hidden = false; }

  if (qs.has('render')) {
    d.querySelector('.nome').hidden = true;
    var w = +qs.get('w') || 1080;
    HeroTinta.iniciar(cv, 'assets/hero/', { render: true, w: w, h: w }).then(function (q) { window.__q = q; window.__pronto = true; });
  } else if (reduz) {
    parado();
  } else if (matchMedia('(pointer: coarse)').matches && VW() < 900) {
    /* telemóvel: vídeo do mesmo shader; se o modo de poupança recusar o play, volta ao WebGL */
    cv.hidden = true; vid.hidden = false;
    vid.poster = 'assets/img/hero-poster.webp';
    vid.src = 'assets/video/hero.mp4?v=3';
    vid.addEventListener('timeupdate', function () { rotulo(Math.floor(vid.currentTime / HeroTinta.ciclo) % HeroTinta.n); });
    var p = vid.play();
    if (p && p.catch) p.catch(function () { shader().catch(parado); });
  } else {
    shader().catch(parado);
  }

  /* entrada */
  d.querySelectorAll('.eti,.hero-base,.pre').forEach(function (el) { el.classList.add('ent'); });
  requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('pronto'); }, 80); });

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

  /* ---------- comparador pele × tinta ---------- */
  var comp = d.getElementById('comp'), range = d.getElementById('cRange');
  range.addEventListener('input', function () { comp.style.setProperty('--x', range.value + '%'); });
  d.querySelectorAll('#cTabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('#cTabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      var n = b.dataset.n;
      d.getElementById('cFoto').src = 'assets/hero/' + n + '-foto.webp';
      d.getElementById('cTinta').src = 'assets/hero/' + n + '.webp';
      comp.animate && comp.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.16,.84,.32,1)' });
    });
  });
  /* convite: o corte desliza uma vez quando aparece */
  new IntersectionObserver(function (e, o) {
    if (!e[0].isIntersecting) return; o.disconnect();
    var t0 = performance.now();
    (function an(t) {
      var k = Math.min(1, (t - t0) / 1800), v = 50 + Math.sin(k * Math.PI * 2) * 26 * (1 - k);
      comp.style.setProperty('--x', v + '%'); range.value = v; if (k < 1) requestAnimationFrame(an);
    })(t0);
  }, { threshold: .6 }).observe(comp);

  /* ---------- portfólio ---------- */
  var grade = d.getElementById('grade'), mais = d.getElementById('mais'), filtro = 'todos';
  var passoN = matchMedia('(max-width:640px)').matches ? 8 : 12, limite = passoN;
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
