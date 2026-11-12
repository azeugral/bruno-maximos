/* Hero "tinta sobre o nome": a tinta real das peças (tirada da pele, tools/tinta.py) forma-se por
   cima do nome vermelho como numa sessão: traço, sombras escuras primeiro, depois os cinzas.
   Desenha sobre BRANCO; o canvas/vídeo entra com mix-blend-mode:multiply sobre o papel. */
(function () {
  var PECAS = ['velho', 'poseidon', 'lobo', 'olho'];
  var CICLO = 5.0;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  /* mesa de estêncil: traço roxo do decalque (0-.6 s) -> tinta preta, escuros primeiro (.3-1.5 s)
     -> fica -> a folha é arrancada num rasgo diagonal (4.3-5 s). Desenha sobre BRANCO (multiply). */
  var FS = [
    'precision highp float;varying vec2 v;',
    'uniform sampler2D T;uniform float f,sd;uniform vec2 px;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),q=fract(p);q=q*q*(3.-2.*q);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),q.x),mix(h(i+vec2(0,1)),h(i+1.),q.x),q.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}',
    'float tt(vec2 u){return texture2D(T,u).r;}',
    'float ease(float x){x=clamp(x,0.,1.);return 1.-pow(1.-x,3.);}',
    'void main(){vec2 u=vec2(v.x,1.-v.y);',
    ' float t=tt(u);',
    ' float gx=tt(u+vec2(px.x,0))-tt(u-vec2(px.x,0)),gy=tt(u+vec2(0,px.y))-tt(u-vec2(0,px.y));',
    ' float tr=smoothstep(.06,.18,length(vec2(gx,gy)))*smoothstep(.1,.28,t);',
    ' float ru=fb(u*5.+sd*13.);',
    ' float ch=clamp(u.y*.55+(1.-u.x)*.15+ru*.2,0.,1.);',
    /* decalque roxo */
    ' float est=tr*smoothstep(ch-.05,ch+.01,ease(f/.6)*1.1);',
    /* tinta: escuros chegam antes dos cinzas */
    ' float che=clamp(ch*.7+(1.-t)*.35,0.,1.);',
    ' float som=smoothstep(che-.06,che+.04,ease((f-.3)/1.2)*1.12);',
    ' float ink=pow(t,1.12)*som;',
    /* rasgo: borda serrilhada diagonal que atravessa a folha */
    ' float k=clamp((f-4.3)/.62,0.,1.);k=k*k*(3.-2.*k);',
    ' float d=(u.x*.62+u.y*.38)+(n(vec2(u.y*38.,sd))-.5)*.035+(fb(u*vec2(4.,16.)+sd)-.5)*.06;',
    ' float pos=k*1.35-.12;',
    ' float fica=smoothstep(pos-.004,pos+.004,d);',
    ' float sombra=k>0.&&k<1.?exp(-pow((d-pos-.012)/.012,2.))*.22:0.;',
    ' vec3 roxo=vec3(.42,.3,.66);',
    ' vec3 c=vec3(1.);',
    ' c*=mix(vec3(1.),roxo,est*.8*(1.-som*.85)*fica);',
    ' c*=1.-ink*.92*fica;',
    ' c*=1.-sombra;',
    ' c-=(h(u*800.+f)-.5)*.012;',
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
