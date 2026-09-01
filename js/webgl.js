/**
 * webgl.js — Immersive WebGL Background Scene
 * Three.js r128 · scroll-driven camera dolly · fbm noise shader · particle field
 * Three detection tiers: full / lite (particles only) / none (CSS gradient fallback)
 */

(function () {
  'use strict';

  /* ─── Tier Detection ───────────────────────────────────────────────── */
  function detectTier() {
    if (typeof WebGLRenderingContext === 'undefined') return 'none';
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'none';
    } catch { return 'none'; }

    const isMobileTouch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    const isLowCore = (navigator.hardwareConcurrency || 4) <= 2;
    if (isMobileTouch || isLowCore) return 'lite';
    return 'full';
  }

  const tier = detectTier();
  if (tier === 'none') {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  if (tier === 'lite') {
    // Lets the CSS grain/gradient fallback show through behind the sparse
    // particle field, keeping grain consistent across all three tiers.
    document.documentElement.classList.add('webgl-lite');
  }

  /* ─── Reduced Motion Guard ─────────────────────────────────────────── */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  /* ─── Three.js Import (ES module, loaded from script type=module) ──── */
  // THREE is attached to window by the UMD build loaded in index.html
  // This file is loaded as a regular script after the Three.js UMD bundle.

  /* ─── Accent colour (synced with CSS theme) ────────────────────────── */
  function getAccentVec3() {
    const theme = document.documentElement.dataset.theme || 'obsidian';
    const map = {
      obsidian: [0.231, 0.510, 0.965], // electric blue #3b82f6
      cyber:    [0.024, 0.714, 0.831], // teal #06b6d4
      nord:     [0.655, 0.545, 0.984], // aurora purple #a78bfa
    };
    return map[theme] || map.obsidian;
  }

  /* ─── GLSL Shaders (inline — avoids fetch() CORS on file://) ───────── */
  const BG_VERT = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const BG_FRAG = /* glsl */`
    precision mediump float;
    uniform float uTime;
    uniform float uScrollProgress;
    uniform vec3  uAccent;
    uniform vec2  uResolution;
    uniform vec2  uMouse;
    varying vec2  vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.1;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float scroll = uScrollProgress;

      // Warp UV with fbm for organic movement
      float warp = fbm(uv * 1.8 + vec2(uTime * 0.04, uTime * 0.03));
      vec2 warpedUv = uv + (vec2(warp) - 0.5) * (0.15 + scroll * 0.1);

      // Subtle cursor-reactive distortion — soft radial push near the pointer
      vec2 mouseUv = uMouse * 0.5 + 0.5;
      float mouseDist = distance(uv, mouseUv);
      float mouseInfluence = smoothstep(0.35, 0.0, mouseDist);
      warpedUv += (uv - mouseUv) * mouseInfluence * 0.10;

      float n = fbm(warpedUv * 2.4 + uTime * 0.035 + scroll * 0.2);

      // Dark cinematic palette: zinc-950 (#09090b) base
      vec3 base  = vec3(0.035, 0.035, 0.043);
      vec3 deep  = vec3(0.020, 0.020, 0.032);
      vec3 col   = mix(deep, base, n);

      // Accent haze — stronger near bottom (scroll progress)
      float hazeMask = (1.0 - vUv.y) * (0.5 + scroll * 0.5);
      col += uAccent * n * hazeMask * 0.055;

      // Film grain
      float grain = fract(
        sin(dot(gl_FragCoord.xy + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453
      );
      col += (grain - 0.5) * 0.016;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  /* ─── Scene Setup ───────────────────────────────────────────────────── */
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: tier !== 'full',
    powerPreference: tier === 'full' ? 'default' : 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (tier !== 'full') renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  /* ─── Background Quad ──────────────────────────────────────────────── */
  let bgUniforms = null;
  if (tier === 'full') {
    bgUniforms = {
      uTime:           { value: 0 },
      uScrollProgress: { value: 0 },
      uAccent:         { value: new THREE.Vector3(...getAccentVec3()) },
      uResolution:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse:          { value: new THREE.Vector2(0, 0) },
    };

    const bgGeo  = new THREE.PlaneGeometry(2, 2);
    const bgMat  = new THREE.ShaderMaterial({
      vertexShader:   BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms:       bgUniforms,
      depthWrite:     false,
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    scene.add(bgMesh);
  }

  /* ─── Particle Field ───────────────────────────────────────────────── */
  const PARTICLE_COUNT = tier === 'full' ? 1400 : 700;

  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  const pSizes     = new Float32Array(PARTICLE_COUNT);
  const pPhases    = new Float32Array(PARTICLE_COUNT); // drift phase

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPositions[i * 3]     = (Math.random() - 0.5) * 18;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    pSizes[i]   = Math.random() * 1.8 + 0.4;
    pPhases[i]  = Math.random() * Math.PI * 2;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1));

  const PARTICLE_VERT = /* glsl */`
    attribute float size;
    uniform float uTime;
    uniform float uScroll;
    void main() {
      vec3 pos = position;
      // Gentle orbital drift
      float phase = pos.x * 0.3 + pos.y * 0.2;
      pos.x += sin(uTime * 0.18 + phase) * 0.06;
      pos.y += cos(uTime * 0.14 + phase) * 0.04;
      pos.z += sin(uTime * 0.10 + phase * 1.3) * 0.03;
      // Scroll parallax (deeper particles move less)
      pos.y += uScroll * (1.0 - abs(pos.z) * 0.1) * -0.8;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (280.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `;

  const PARTICLE_FRAG = /* glsl */`
    precision mediump float;
    uniform vec3 uAccentP;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;
      float a = (0.5 - d) * 2.0;
      a = a * a; // soft falloff
      gl_FragColor = vec4(uAccentP, a * 0.35);
    }
  `;

  const pUniforms = {
    uTime:    { value: 0 },
    uScroll:  { value: 0 },
    uAccentP: { value: new THREE.Vector3(...getAccentVec3()) },
  };

  const pMat = new THREE.ShaderMaterial({
    vertexShader:   PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    uniforms:       pUniforms,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ─── Scroll Progress (updated externally by motion.js) ────────────── */
  let scrollProgress = 0;
  window.__webgl = {
    setScrollProgress(p) {
      scrollProgress = p;
      if (bgUniforms) bgUniforms.uScrollProgress.value = p;
      pUniforms.uScroll.value = p * 3.5;
    },
    setTheme() {
      const v = getAccentVec3();
      if (bgUniforms) bgUniforms.uAccent.value.set(...v);
      pUniforms.uAccentP.value.set(...v);
    },
  };

  /* ─── Cursor Tracking (full tier + fine pointer only) ───────────────── */
  let mouseX = 0, mouseY = 0;
  const canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (tier === 'full' && canHover) {
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  /* ─── Resize Handler ───────────────────────────────────────────────── */
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (bgUniforms) bgUniforms.uResolution.value.set(w, h);
  }
  window.addEventListener('resize', onResize);

  /* ─── Visibility Pause ─────────────────────────────────────────────── */
  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  /* ─── Render Loop ───────────────────────────────────────────────────── */
  let rafId;
  let lastTime = 0;
  const TARGET_FPS = tier === 'full' ? 60 : 30;
  const FRAME_BUDGET = 1000 / TARGET_FPS;

  function animate(ts) {
    rafId = requestAnimationFrame(animate);
    if (paused) return;

    // FPS cap for lite tier
    if (ts - lastTime < FRAME_BUDGET - 1) return;
    lastTime = ts;

    const t = ts * 0.001;

    if (bgUniforms) {
      bgUniforms.uTime.value = t;
      bgUniforms.uMouse.value.set(mouseX, mouseY);
    }
    pUniforms.uTime.value = t;

    // Camera dolly + subtle Y drift
    camera.position.z = 5 - scrollProgress * 2.0;
    camera.position.y = Math.sin(t * 0.08) * 0.04;

    renderer.render(scene, camera);
  }

  rafId = requestAnimationFrame(animate);

  /* ─── Cleanup ───────────────────────────────────────────────────────── */
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
  });

})();
