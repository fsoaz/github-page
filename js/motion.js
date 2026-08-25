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
  const snapshot = document.querySelector('[data-motion="hero-snapshot"]');
  const details = [...document.querySelectorAll('[data-motion="hero-detail"]')];

  if (!primary || !snapshot) return;

  const targets = [primary, snapshot, ...details];
  createTimeline({
    defaults: { ease: 'outExpo' },
    onComplete: () => finish(targets),
  })
    .add(primary, { opacity: [0, 1], y: [18, 0], duration: 520 })
    .add(details, { opacity: [0, 1], y: [12, 0], duration: 360 }, '-=260')
    .add(snapshot, { opacity: [0, 1], y: [18, 0], duration: 460 }, '-=300');
}

function revealSection(section) {
  const header = section.querySelector('[data-motion-header]');
  const items = [...section.querySelectorAll('[data-motion-item]')];
  const targets = [header, ...items].filter(Boolean);

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
