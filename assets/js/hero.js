/* Hero "tinta sobre o nome": a tinta real das peças (tirada da pele, tools/tinta.py) forma-se por
   cima do nome vermelho como numa sessão: traço, sombras escuras primeiro, depois os cinzas.
   Desenha sobre BRANCO; o canvas/vídeo entra com mix-blend-mode:multiply sobre o papel. */
(function () {
  var PECAS = ['velho', 'poseidon', 'lobo', 'olho'];
  var CICLO = 8.4;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;varying vec2 v;',
    'uniform sampler2D T;uniform float f,sd;uniform vec2 px;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),q=fract(p);q=q*q*(3.-2.*q);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),q.x),mix(h(i+vec2(0,1)),h(i+1.),q.x),q.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}',
    'float tt(vec2 u){return texture2D(T,u).r;}',
    'void main(){vec2 u=vec2(v.x,1.-v.y);',
    ' float t=tt(u);',
    /* traço: borda da tinta, como o contorno que abre a sessão */
    ' float gx=tt(u+vec2(px.x,0))-tt(u-vec2(px.x,0)),gy=tt(u+vec2(0,px.y))-tt(u-vec2(0,px.y));',
    ' float tr=smoothstep(.07,.2,length(vec2(gx,gy)))*smoothstep(.12,.3,t);',
    ' float ru=fb(u*5.+sd*13.);',
    /* chegada: diagonal de cima para baixo, escuros antes dos cinzas */
    ' float ch=clamp((u.y*.62+(1.-u.x)*.12)+(1.-t)*.3+ru*.14-.08,0.,1.);',
    ' float linha=smoothstep(ch-.04,ch+.02,clamp((f-.25)/1.1,0.,1.)*1.1);',
    ' float som=smoothstep(ch-.03,ch+.05,clamp((f-.9)/2.4,0.,1.)*1.12);',
    /* rasto do whip shading na frente da sombra */
    ' float rasto=som*(1.-smoothstep(0.,.08,clamp((f-.9)/2.4,0.,1.)*1.12-ch))*step(.5,h(floor(u*vec2(220.,90.))+sd));',
    ' float ink=max(pow(t,1.15)*som*(1.-.25*rasto),tr*linha*.8);',
    /* apagar: a tinta some em manchas de papel molhado */
    ' float sai=smoothstep(.0,1.,clamp((f-7.45)/.9,0.,1.));',
    ' ink*=1.-smoothstep(ru-.12,ru,sai*1.15);',
    /* respingos e meio-tom do Trash Polka, sempre com a tinta */
    ' vec2 g=u*vec2(64.);vec2 gi=floor(g);float r=h(gi+sd*7.);',
    ' float borda=smoothstep(.02,.25,tt((gi+.5)/64.))*(1.-smoothstep(.35,.7,tt((gi+.5)/64.)));',
    ' float gota=step(.93,r)*borda*(1.-smoothstep(.08+.2*h(gi+2.),.11+.2*h(gi+2.),length(fract(g)-.5)));',
    ' ink=max(ink,gota*som*(1.-sai));',
    ' vec3 c=vec3(1.)*(1.-ink*.9);',
    ' c-= (h(u*800.+f)-.5)*.012;',
    ' gl_FragColor=vec4(c,1.);}'
  ].join('\n');

  function iniciar(cv, base, opt) {
    opt = opt || {};
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opt.render });
    if (!gl) return Promise.reject('sem webgl');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
    var pg = gl.createProgram();
    gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg); gl.useProgram(pg);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['T', 'f', 'sd', 'px'].forEach(function (k) { U[k] = gl.getUniformLocation(pg, k); });
    gl.uniform1i(U.T, 0);
    function carregar(src) {
      return new Promise(function (ok, erro) {
        var im = new Image(); im.decoding = 'async';
        im.onload = function () {
          var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, im);
          [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR); });
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          ok(t);
        };
        im.onerror = erro; im.src = src;
      });
    }
    var tex = [];
    function quadro(t) {
      var r = cv.getBoundingClientRect(), dp = Math.min(window.devicePixelRatio || 1, 2);
      var w = opt.w || Math.round(r.width * dp), hh = opt.h || Math.round(r.height * dp);
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      gl.viewport(0, 0, w, hh);
      var k = Math.floor(t / CICLO), f = t - k * CICLO, i = k % tex.length;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
      gl.uniform1f(U.f, f); gl.uniform1f(U.sd, i + 1); gl.uniform2f(U.px, 1.5 / 1024, 1.5 / 1024);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (opt.onPeca) opt.onPeca(i, f);
    }
    return Promise.all(PECAS.map(function (n) { return carregar(base + n + '.webp'); })).then(function (t) { tex = t; return quadro; });
  }
  window.HeroTinta = { iniciar: iniciar, ciclo: CICLO, n: PECAS.length, pecas: PECAS };
})();
