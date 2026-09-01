/**
 * motion.js — GSAP ScrollTrigger choreography + Lenis smooth scroll
 * Loads as ES module. Gracefully degrades if CDN fails.
 * Communicates with webgl.js via window.__webgl bridge.
 */

// ── Guard: skip everything under reduced-motion ─────────────────────────
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reducedMotion.matches) {
  // Make all reveal-pending elements immediately visible
  document.querySelectorAll('.reveal-word').forEach(el => {
    el.style.transform = 'translateY(0)';
    el.style.opacity   = '1';
  });
  document.querySelectorAll('.hero-status,.hero-subtitle,.hero-description,.hero-facts,.hero-cta-group').forEach(el => {
    el.style.opacity = '1';
  });
  // eslint-disable-next-line no-throw-literal
  throw 'motion: reduced-motion active — skipping all animations';
}

/* ── Lenis smooth scroll ─────────────────────────────────────────────── */
let lenis = null;

function initLenis() {
  if (typeof Lenis === 'undefined') {
    console.warn('motion: Lenis not loaded — using native scroll');
    return;
  }
  lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.8,
    infinite: false,
  });

  // Integrate Lenis into GSAP ticker (if GSAP available)
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback RAF loop
    function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);
  }

  // Feed scroll progress to WebGL scene
  lenis.on('scroll', ({ progress }) => {
    if (window.__webgl) window.__webgl.setScrollProgress(progress);
    updateParallaxLayers(progress);
  });
}

/* ── Parallax layers (subtle depth on non-canvas elements) ───────────── */
const parallaxImages   = document.querySelectorAll('.project-image-wrap');
const parallaxEyebrows = document.querySelectorAll('.section-eyebrow');

function updateParallaxLayers(progress) {
  // Hero content parallax out on scroll
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner) {
    const offset = progress * -80;
    heroInner.style.transform = `translateY(${offset}px)`;
    heroInner.style.opacity   = Math.max(0, 1 - progress * 3.5);
  }

  // Differential z-depth layers: images drift slower (feel "further back"),
  // eyebrow labels drift faster (feel "closer"), each at its own rate.
  parallaxImages.forEach((wrap) => {
    const rect = wrap.getBoundingClientRect();
    const centerDelta = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
    wrap.style.transform = `translateY(${centerDelta * -24}px)`;
  });

  parallaxEyebrows.forEach((label) => {
    const rect = label.getBoundingClientRect();
    const centerDelta = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
    label.style.transform = `translateY(${centerDelta * 10}px)`;
  });
}

/* ── GSAP is required for the choreography below ─────────────────────── */
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('motion: GSAP/ScrollTrigger not loaded — skipping scroll choreography');
    // Make everything visible as fallback
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Tell ScrollTrigger to use Lenis's scroll position
  if (lenis) {
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed',
    });
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  }

  /* ── Hero Animation ─────────────────────────────────────────────────── */
  playHeroEntrance();

  /* ── Section Reveals ────────────────────────────────────────────────── */
  revealSection('#skills-section');
  revealSection('#projects-section');
  revealSection('#contact-section');

  /* ── Magnetic Buttons ───────────────────────────────────────────────── */
  initMagneticButtons();

  /* ── 3D Card Tilt ───────────────────────────────────────────────────── */
  initCardTilt();

  ScrollTrigger.refresh();
}

/* ── Hero entrance ───────────────────────────────────────────────────── */
function playHeroEntrance() {
  const words   = document.querySelectorAll('.hero-name .reveal-word');
  const details = document.querySelectorAll('.hero-status, .hero-subtitle, .hero-description, .hero-facts, .hero-cta-group');

  if (!words.length) return;

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  tl.to(words, {
    y:        '0%',
    opacity:  1,
    duration: 0.9,
    stagger:  0.12,
  });

  tl.to(details, {
    opacity:  1,
    y:        0,
    duration: 0.5,
    stagger:  0.07,
    ease:     'power2.out',
  }, '-=0.5');
}

/* ── Generic section reveal ─────────────────────────────────────────── */
function revealSection(selector) {
  const section = document.querySelector(selector);
  if (!section) return;

  const revealItems  = section.querySelectorAll('[data-reveal]');
  const headingWords = section.querySelectorAll('.section-title .reveal-word');
  if (!revealItems.length && !headingWords.length) return;

  // Initial state (heading words start hidden via the .reveal-word CSS class)
  if (revealItems.length) gsap.set(revealItems, { opacity: 0, y: 28 });

  ScrollTrigger.create({
    trigger: section,
    start:   'top 78%',
    once:    true,
    onEnter() {
      if (headingWords.length) {
        gsap.to(headingWords, {
          y:        '0%',
          opacity:  1,
          duration: 0.7,
          stagger:  0.06,
          ease:     'expo.out',
        });
      }
      if (revealItems.length) {
        gsap.to(revealItems, {
          opacity:  1,
          y:        0,
          duration: 0.65,
          stagger:  0.07,
          ease:     'expo.out',
          clearProps: 'transform,opacity',
        });
      }
    },
  });
}

/* ── Magnetic button physics ─────────────────────────────────────────── */
function initMagneticButtons() {
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.34;
      const y = (e.clientY - r.top  - r.height / 2) * 0.34;
      gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out', overwrite: true });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: true });
    });
  });
}

/* ── CSS 3D card tilt (mouse tracking per card) ──────────────────────── */
function initCardTilt() {
  // Only on devices that support hover (pointer:fine)
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5; // -0.5 to 0.5
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotateY:   x * 10,
        rotateX:  -y * 7,
        duration:  0.35,
        ease:      'power2.out',
        overwrite: true,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY:  0,
        rotateX:  0,
        duration: 0.8,
        ease:     'elastic.out(1, 0.4)',
        overwrite: true,
      });
    });
  });
}

/* ── Custom cursor follower ──────────────────────────────────────────── */
function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  let mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.classList.add('visible');
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  // Hoverables — expand cursor ring
  document.querySelectorAll('a, button, [role="button"], .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(() => {
      gsap.set(cursor, { x: mx - 16, y: my - 16 });
    });
  } else {
    // Simple RAF fallback
    let cx = 0, cy = 0;
    function cursorRaf() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.transform = `translate(${cx - 16}px, ${cy - 16}px)`;
      requestAnimationFrame(cursorRaf);
    }
    requestAnimationFrame(cursorRaf);
  }
}

/* ── Init ────────────────────────────────────────────────────────────── */
function init() {
  initLenis();
  initGSAP();
  initCursor();
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
