/* Hero "rasgo": a peça entra em tinta por cima do estêncil vermelho e cada troca
   passa por uma pincelada de Trash Polka. WebGL1, sem dependências. */
(function () {
  var FONTES = ['h2', 'h0', 'h1', 'h3', 'h5'];
  var HOLD = 5.2, SWEEP = 1.35, CICLO = HOLD + SWEEP, INTRO = 2.4;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;varying vec2 v;',
    'uniform sampler2D A,B;uniform float pr,rv,tm;uniform vec2 px;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}',
    'vec3 tx(sampler2D t,vec2 u){vec3 c=texture2D(t,u).rgb;c=(c-.5)*1.08+.5;return c;}',
    'float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}',
    'float edge(sampler2D t,vec2 u){float a=lum(tx(t,u+vec2(-px.x,0))),b=lum(tx(t,u+vec2(px.x,0))),',
    ' c=lum(tx(t,u+vec2(0,-px.y))),d=lum(tx(t,u+vec2(0,px.y)));return smoothstep(.06,.2,length(vec2(b-a,d-c)));}',
    'void main(){vec2 u=vec2(v.x,1.-v.y);',
    ' vec3 papel=vec3(.051,.051,.055),rub=vec3(.78,.086,.11);',
    ' vec3 a=tx(A,u);',
    /* intro: estêncil vermelho e depois tinta a alastrar */
    ' if(rv<1.){float v1=fb(u*4.)*.8+.15*u.y,v2=fb(u*3.+7.)*.75+.2*(1.-u.y);',
    '  float st=smoothstep(v1-.05,v1+.05,rv*2.4);',
    '  float ink=smoothstep(v2-.07,v2+.07,rv*1.35-.3);',
    '  vec3 s=mix(papel,rub,edge(A,u)*st*.9);a=mix(s,a,ink);}',
    ' float e=1.-pr;',
    ' float d=(u.x*.75+(1.-u.y)*.65)/1.4;',
    ' vec2 r=vec2(u.x*.75-(1.-u.y)*.65,d);',
    ' float st=fb(vec2(r.x*3.,r.y*38.))*.11+fb(u*6.)*.05;',
    ' float c=mix(-.32,1.32,pr);',
    ' float w=.2+.08*sin(pr*3.14);',
    ' float frente=smoothstep(c+w*.5-.01,c+w*.5+.01,d+st);',
    ' float tras=smoothstep(c-w*.5-.01,c-w*.5+.01,d+st);',
    ' vec3 b=tx(B,u);',
    ' vec3 col=mix(b,a,frente);',
    ' float banda=tras*(1.-frente);',
    ' float seco=smoothstep(.35,.8,fb(vec2(r.x*2.,r.y*90.)));',
    ' vec3 tinta=rub*(.78+.32*fb(u*18.))*(1.-.45*seco);',
    ' col=mix(col,tinta,banda*step(.001,pr)*step(pr,.999));',
    /* respingos à volta da pincelada */
    ' vec2 g=u*vec2(46.,57.5);vec2 gi=floor(g);float hh=h(gi);',
    ' float dd=(( (gi.x+.5)/46.)*.75+(1.-(gi.y+.5)/57.5)*.65)/1.4;',
    ' float perto=1.-smoothstep(0.,.17,abs(dd-c)-w*.5);',
    ' float gota=step(.84,hh)*perto*step(.001,pr)*step(pr,.999)*(1.-smoothstep(.12+.25*h(gi+3.),.14+.25*h(gi+3.),length(fract(g)-.5)));',
    ' col=mix(col,rub*.9,gota);',
    ' float vin=smoothstep(1.15,.35,length((u-.5)*vec2(1.,1.1)));col*=.82+.18*vin;',
    ' col+=(h(u*900.+tm)-.5)*.025;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function iniciar(cv, base, opt) {
    opt = opt || {};
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opt.render });
    if (!gl) return null;
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
    var pg = gl.createProgram();
    gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg); gl.useProgram(pg);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['A', 'B', 'pr', 'rv', 'tm', 'px'].forEach(function (k) { U[k] = gl.getUniformLocation(pg, k); });
    gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1);
    var tex = [];
    function carregar(src) {
      return new Promise(function (ok, erro) {
        var im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
        im.onload = function () {
          var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          ok(t);
        };
        im.onerror = erro; im.src = src;
      });
    }
    function tam() {
      var r = cv.getBoundingClientRect(), dp = opt.render ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(r.width * dp), h = Math.round(r.height * dp);
      if (opt.w) { w = opt.w; h = opt.h; }
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U.px, 1.4 / w, 1.4 / h);
    }
    /* t em segundos; intro só quando opt.intro */
    function quadro(t) {
      tam();
      var rv = 1, tt = t;
      if (opt.intro) { rv = Math.min(1, t / INTRO); tt = Math.max(0, t - INTRO); }
      var k = Math.floor(tt / CICLO), f = tt - k * CICLO;
      var pr = f < HOLD ? 0 : ease((f - HOLD) / SWEEP);
      var ia = k % tex.length, ib = (k + 1) % tex.length;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[ia]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[ib]);
      gl.uniform1f(U.pr, pr); gl.uniform1f(U.rv, rv); gl.uniform1f(U.tm, opt.render ? (t % 7) : t % 7);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (opt.onPeca) opt.onPeca(pr > .5 ? ib : ia);
    }
    return Promise.all(FONTES.map(function (n) { return carregar(base + n + '.jpg'); })).then(function (t) { tex = t; return quadro; });
  }

  window.HeroRasgo = { iniciar: iniciar, total: FONTES.length * CICLO, n: FONTES.length };
})();
