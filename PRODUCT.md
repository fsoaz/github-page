# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience: technical recruiters and hiring managers evaluating Francisco Soares for backend/AI/platform engineering roles. Secondary: professional collaborators and peers who land on the site via GitHub or LinkedIn.

## Product Purpose

A personal portfolio and interactive terminal console that presents Francisco Soares as a backend engineer, and gives visitors enough evidence (skills, shipped projects, contact channel) to move him forward in a hiring process. Success is a recruiter/hiring manager reaching out via the contact form or direct channels.

## Positioning

The core pitch is the engineering work itself: high-concurrency Python backends, distributed data pipelines, and evidence-backed AI systems (e.g. WikiAI's citation-grounded generative search). The site's immersive, scroll-driven WebGL presentation and slide-up terminal easter egg are supporting craft signals, not the primary claim — they should reinforce the engineering story, not compete with it for attention.

## Operating Context

- Single-page static site (no backend, no build step), deployed on GitHub Pages.
- A single scrolling page (Hero, Skills, Projects, Contact) with a persistent top nav; a slide-up "Terminal" drawer (opened via the header button or the backtick key) offers custom commands (`help`, `whoami`, `neofetch`, `skills`, `projects`, `contact`, `theme`, `particles`, `matrix`, `clear`, `sudo`) as an optional easter egg, not a primary view.
- Contact form submits via Formspree (`https://formspree.io/f/xpqklvnk`); direct channels link to GitHub (`github.com/fsoaz`) and LinkedIn (`linkedin.com/in/francisco-soares-b89299427`).
- Three selectable accent themes (Obsidian, Cyber, Nord), a WebGL background scene (tiered full/lite/no-webgl fallback: fbm-noise shader with film grain and a particle field, scroll-driven camera dolly), and GSAP/ScrollTrigger/Lenis-driven scroll choreography (word-level reveals, magnetic buttons, 3D card tilt, cursor-reactive shader distortion).

## Capabilities and Constraints

- Zero framework dependencies, zero build step — pure HTML5/CSS3/vanilla JS, plus Three.js, GSAP/ScrollTrigger, and Lenis (all loaded via CDN `<script>` tags, no bundler) for the WebGL scene and scroll motion, intentionally kept build-step-free for GitHub Pages hosting.
- Must honor `prefers-reduced-motion` (already implemented: content renders immediately, ambient canvas loop stops).
- Currently open to full-time roles ("Open for engineering opportunities" badge is accurate). No resume/CV file exists yet to link — do not add a download link or fabricate one until a file is provided.

## Evidence on Hand

- Real GitHub repositories linked from the Featured Systems section: WikiAI Knowledge Engine (`github.com/fsoaz/wiki`, primary spotlight), Financial Market Dashboard, Sales Analytics Dashboard, Dental Radar Intelligence, Trial Reminder App (Android/Kotlin).
- Real project screenshots under `assets/images/` (e.g. `wikiai-cover.png`, `financial-market-cover.png`, `sales-dashboard.jpg`, `dental-radar.jpg`, `trial-reminder-cover.png`) and an avatar (`avatar.jpg`).
- No testimonials, case studies, employer references, press mentions, or downloadable resume exist. Do not fabricate any of these.

## Product Principles

1. The engineering substance (systems built, problems solved, stack depth) leads; the terminal/theme/motion craft supports and never distracts from it.
2. State only real, verifiable facts — real repos, real screenshots, real contact channels. Never invent metrics, testimonials, employers, or credentials.
3. Keep the zero-dependency, zero-build static-site constraint; new features must run on GitHub Pages with no server.
4. Preserve accessibility commitments already made (WCAG AA contrast, reduced-motion support, semantic/keyboard-navigable structure) in all future changes.

## Accessibility & Inclusion

WCAG AA contrast is an existing stated commitment (see README). `prefers-reduced-motion` is already honored. No additional user-specific accessibility requirement has been raised.
