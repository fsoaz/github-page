/**
 * Portfolio motion layer. This module is intentionally isolated from app.js:
 * a failed CDN request leaves all primary interactions and content intact.
 */
import { animate, createTimeline, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function finish(targets) {
  targets.forEach((target) => {
    target.style.opacity = '';
    target.style.transform = '';
    target.style.willChange = 'auto';
  });
}

function playHero() {
  const primary = document.querySelector('[data-motion="hero-primary"]');
  const details = [...document.querySelectorAll('[data-motion="hero-detail"]')];
  const words = [...document.querySelectorAll('.hero-name .reveal-word')];

  if (!primary) return;

  const targets = [primary, ...details, ...words];
  createTimeline({
    defaults: { ease: 'outExpo' },
    onComplete: () => finish(targets),
  })
    .add(words, { opacity: [0, 1], y: ['110%', '0%'], duration: 620, delay: stagger(90) })
    .add(details, { opacity: [0, 1], y: [12, 0], duration: 360 }, '-=380');
}

function revealSection(section) {
  const header = section.querySelector('[data-motion-header]');
  const items = [...section.querySelectorAll('[data-motion-item]')];
  const targets = [header, ...items].filter(Boolean);

  section.querySelectorAll('.log-media').forEach((media) => {
    media.classList.remove('reveal-pending');
  });

  if (!targets.length) return;

  animate(targets, {
    opacity: [0, 1],
    y: [16, 0],
    delay: stagger(70),
    duration: 460,
    ease: 'outExpo',
    onComplete: () => finish(targets),
  });
}

function initializeMotion() {
  if (reduceMotion.matches) return;

  playHero();

  // Mark project media as pending so the clip-path wipe has something to reveal.
  // Left unset entirely if this code never runs (reduced motion / no-JS), so
  // images render fully visible by default per the CSS in style.css.
  document.querySelectorAll('.log-media').forEach((media) => {
    media.classList.add('reveal-pending');
  });

  const sections = [...document.querySelectorAll('[data-motion-section]')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      revealSection(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  sections.forEach((section) => observer.observe(section));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMotion, { once: true });
} else {
  initializeMotion();
}
