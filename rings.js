/* Field rings — a vanilla-WebGL port of React Bits' MagicRings. The React/three.js
   host was replaced so the site keeps no dependencies and no build step, and the
   ring profile was reworked: the stock shader drives an un-clamped mix() factor of
   up to 2.0, which extrapolates past the ring colour into white, and its exp(-60d)
   falloff leaves no halo. Here the core, body and bloom are separate terms and the
   fronts composite additively, so the field reads as emitted light rather than
   drawn line. */
(function () {
  var mount = document.querySelector('[data-rings]');
  if (!mount) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var VERT = [
    'attribute vec2 aPosition;',
    'void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    '',
    'uniform float uTime, uAttenuation, uLineThickness;',
    'uniform float uBaseRadius, uRadiusStep, uScaleRate;',
    'uniform float uOpacity, uNoiseAmount, uRotation;',
    'uniform float uFadeIn, uFadeOut;',
    'uniform float uCoreGain, uDisperse, uBloomSpread, uBloomGain, uGlow;',
    'uniform float uUnit, uHorizon, uArc, uSweep;',
    'uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;',
    'uniform vec2 uResolution, uMouse;',
    'uniform vec3 uColor, uColorTwo;',
    'uniform int uRingCount;',
    '',
    'const float HP = 1.5707963;',
    'const float CYCLE = 3.45;',
    'const float GOLDEN = 2.39996;',
    '',
    'float fade(float t) {',
    '  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);',
    '}',
    '',
    'float ring(vec2 p, float ri, float fi, float t0, float px) {',
    '  float t = mod(uTime + t0, CYCLE);',
    '  float prog = t / CYCLE;',
    '  float r = ri + prog * uScaleRate;',
    '  float d = abs(length(p) - r);',
    '  float a = atan(abs(p.y), abs(p.x)) / HP;',
    '  float th = max(1.0 - a, 0.5) * px * uLineThickness;',
    '  float core = (1.0 - smoothstep(th, th * 1.5, d)) * uCoreGain;',
    /* a front is defined where it is born and dissolves as it travels outward */
    '  float att = uAttenuation / (1.0 + uDisperse * prog);',
    '  float body = exp(-att * d);',
    '  float bloom = exp(-att * uBloomSpread * d) * uBloomGain;',
    /* and it gives out as it passes the frame edge, rather than surviving as a
       pair of bright arcs off the left and right sides */
    '  float horizon = 1.0 - smoothstep(uHorizon, uHorizon + 0.35, r);',
    /* A front is an arc, not a closed ring — one soft segment whose heading is set
       by the golden angle per front and drifts slowly, so nothing ever traces a
       whole circle around the mark. */
    '  float ang = atan(p.y, p.x) - fi * GOLDEN - uTime * uSweep;',
    '  float arc = smoothstep(uArc, 1.0, cos(ang));',
    '  return (core + body + bloom) * fade(t) * horizon * arc * uGlow;',
    '}',
    '',
    'void main() {',
    '  float px = uUnit / min(uResolution.x, uResolution.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;',
    '  float cr = cos(uRotation), sr = sin(uRotation);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p -= uMouse * uMouseInfluence;',
    '  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;',
    '  p /= sc;',
    '  vec3 c = vec3(0.0);',
    '  float rcf = max(float(uRingCount) - 1.0, 1.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    if (i >= uRingCount) break;',
    '    float fi = float(i);',
    '    vec2 pr = p - fi * uParallax * uMouse;',
    '    vec3 rc = mix(uColor, uColorTwo, fi / rcf);',
    /* golden-ratio stagger: spreads the fronts across the cycle without lockstep */
    '    float t0 = mod(fi * CYCLE * 0.618, CYCLE);',
    '    c += rc * ring(pr, uBaseRadius + fi * uRadiusStep, fi, t0, px);',
    '  }',
    '  c *= 1.0 + uBurst * 2.0;',
    '  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (n - 0.5) * uNoiseAmount;',
    '  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);',
    '}'
  ].join('\n');

  /* Tuned for restraint: slow, soft, low-contrast — a field of wavefronts that are
     born around the wordmark and dissolve on their way past the viewport edge.
     Colours come from CSS custom properties so the page keeps one palette. */
  var P = {
    speed: 0.26,
    ringCount: 5,
    glow: 0.3,           /* light level of one front; keeps peaks off the ceiling */
    attenuation: 42,     /* loose falloff, so a front reads as glow not as a line */
    lineThickness: 1.8,
    coreGain: 0.15,      /* the centre line, dimmed well clear of blowing out */
    disperse: 1.6,       /* how much a front blurs over its own travel */
    bloomSpread: 0.3,    /* the halo's falloff, as a fraction of the body's */
    bloomGain: 0.1,
    horizon: 0.38,       /* radius where a front starts giving out; 0.5 is the frame */
    arc: -0.05,          /* how much of a circle a front covers; higher is shorter */
    sweep: 0.15,         /* how fast the arcs drift around the mark */
    baseRadius: 0.25,    /* clears the wordmark */
    radiusStep: 0.085,
    /* travel is one full step: each front hands off to where the next begins,
       so they never bunch up into a single fat band */
    scaleRate: 0.085,
    noiseAmount: 0.025,  /* dither: wide dim gradients band on near-black */
    rotation: 0,
    fadeIn: 0.7,
    fadeOut: 0.8,
    parallax: 0.05
  };

  function hexToRgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    if (isNaN(n)) return [1, 1, 1];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function readTheme() {
    var cs = getComputedStyle(mount);
    return {
      a: hexToRgb(cs.getPropertyValue('--ring-a')),
      b: hexToRgb(cs.getPropertyValue('--ring-b')),
      opacity: parseFloat(cs.getPropertyValue('--ring-opacity')) || 0.6
    };
  }

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl2', { alpha: true, antialias: false }) ||
           canvas.getContext('webgl', { alpha: true, antialias: false });
  if (!gl) return;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  /* one oversized triangle covers the whole clip space */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'aPosition');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  /* premultiplied normal blend, matching three.js' default renderer setup */
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  var U = {};
  ['uTime', 'uAttenuation', 'uLineThickness', 'uBaseRadius', 'uRadiusStep',
   'uScaleRate', 'uOpacity', 'uNoiseAmount', 'uRotation',
   'uFadeIn', 'uFadeOut', 'uArc', 'uSweep', 'uCoreGain', 'uDisperse', 'uBloomSpread', 'uBloomGain',
   'uGlow', 'uUnit', 'uHorizon',
   'uMouseInfluence', 'uHoverAmount', 'uHoverScale',
   'uParallax', 'uBurst', 'uResolution', 'uMouse', 'uColor', 'uColorTwo',
   'uRingCount'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  mount.appendChild(canvas);

  var theme = readTheme();
  var w = 0, h = 0, unit = 1;

  /* The layer now spans the viewport's long edge, so a flat dpr cap can ask for a
     very large buffer on wide displays. Soft fronts hide reduced sampling density
     far better than the old hard lines did, so trade resolution for the budget. */
  var MAX_PIXELS = 6.5e6;

  function resize() {
    var cw = mount.clientWidth, ch = mount.clientHeight;
    /* the layer is sized to the viewport's long edge; this converts the shader's
       layer-relative radii into fractions of the short edge instead */
    unit = cw / Math.max(1, Math.min(window.innerWidth, window.innerHeight));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var over = (cw * ch * dpr * dpr) / MAX_PIXELS;
    if (over > 1) dpr /= Math.sqrt(over);
    w = Math.max(1, Math.round(cw * dpr));
    h = Math.max(1, Math.round(ch * dpr));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    gl.viewport(0, 0, w, h);
  }

  function draw(elapsed) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uTime, elapsed);
    gl.uniform1f(U.uAttenuation, P.attenuation);
    gl.uniform1f(U.uLineThickness, P.lineThickness);
    gl.uniform1f(U.uGlow, P.glow);
    gl.uniform1f(U.uHorizon, P.horizon);
    gl.uniform1f(U.uArc, P.arc);
    gl.uniform1f(U.uSweep, P.sweep);
    gl.uniform1f(U.uUnit, unit);
    gl.uniform1f(U.uCoreGain, P.coreGain);
    gl.uniform1f(U.uDisperse, P.disperse);
    gl.uniform1f(U.uBloomSpread, P.bloomSpread);
    gl.uniform1f(U.uBloomGain, P.bloomGain);
    gl.uniform1f(U.uBaseRadius, P.baseRadius);
    gl.uniform1f(U.uRadiusStep, P.radiusStep);
    gl.uniform1f(U.uScaleRate, P.scaleRate);
    gl.uniform1f(U.uOpacity, theme.opacity);
    gl.uniform1f(U.uNoiseAmount, P.noiseAmount);
    gl.uniform1f(U.uRotation, P.rotation * Math.PI / 180);
    gl.uniform1f(U.uFadeIn, P.fadeIn);
    gl.uniform1f(U.uFadeOut, P.fadeOut);
    gl.uniform1f(U.uMouseInfluence, 0);
    gl.uniform1f(U.uHoverAmount, 0);
    gl.uniform1f(U.uHoverScale, 1);
    gl.uniform1f(U.uParallax, P.parallax);
    gl.uniform1f(U.uBurst, 0);
    gl.uniform2f(U.uResolution, w, h);
    gl.uniform2f(U.uMouse, 0, 0);
    gl.uniform3f(U.uColor, theme.a[0], theme.a[1], theme.a[2]);
    gl.uniform3f(U.uColorTwo, theme.b[0], theme.b[1], theme.b[2]);
    gl.uniform1i(U.uRingCount, P.ringCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();

  if (reduce.matches) {
    /* one still frame, on a beat where the fronts sit well spread, so the mark is
       never bare but nothing moves */
    var STILL = 1.2;
    draw(STILL);
    mount.classList.add('is-live');
    window.addEventListener('resize', function () { resize(); draw(STILL); });
    return;
  }

  var frame = 0, elapsed = 0, last = 0, visible = false;

  function tick(t) {
    frame = requestAnimationFrame(tick);
    var dt = last === 0 ? 0 : Math.min(t - last, 100);
    last = t;
    elapsed += dt * 0.001 * P.speed;
    draw(elapsed);
  }

  function start() {
    if (visible && !document.hidden && frame === 0) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function stop() {
    if (frame !== 0) { cancelAnimationFrame(frame); frame = 0; }
  }

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(mount);
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  var scheme = window.matchMedia('(prefers-color-scheme: dark)');
  var onScheme = function () { theme = readTheme(); };
  scheme.addEventListener ? scheme.addEventListener('change', onScheme)
                          : scheme.addListener(onScheme);

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0 }).observe(mount);

  mount.classList.add('is-live');
  start();
})();
