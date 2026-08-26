# ✦ Francisco Soares — Systems Log & Terminal Console

A personal portfolio and interactive CLI shell built as one continuous engineering document — pure HTML5, CSS3, and Vanilla JavaScript, zero framework, zero build step.

Bridges an authentic Unix developer terminal with an editorial, accessible "systems log" overview for technical recruiters, engineering leaders, and collaborators.

---

## ✨ Architectural Features

- ✦ **Systems Log Design System**:
  - Flat ink/paper surfaces (no glassmorphism), hairline rules, and a persistent chapter-index rail running the page via pure CSS Grid — no scroll-tracking JS.
  - Monospace-led structural typography (JetBrains Mono) paired with oversized display headlines (Inter), balanced against **WCAG AA** contrast.
  - Dynamic dual-mode view: **Overview** & **Interactive Terminal Console**, sharing one visual language.
- ⌨️ **Interactive CLI Shell**:
  - Full shell engine with tab autocompletion (`Tab`), history navigation (`Up`/`Down`), and custom commands (`help`, `whoami`, `neofetch`, `skills`, `projects`, `contact`, `theme`, `particles`, `matrix`, `gui`, `clear`, `sudo`).
  - Instant keyboard toggle (`\`\`` / `~`) to switch seamlessly between GUI and Terminal from anywhere.
  - Mobile-ready quick-action command pills bar.
- 🌌 **Ambient Particle & Digital Rain Canvas** (opt-in):
  - Off by default; discoverable via CLI `$ particles` or `$ matrix` — an interactive constellation field or Matrix digital rain.
- 🎨 **Multi-Theme Palette Engine**:
  - Zero-latency accent-swap theming between **Antigravity**, **Cyber Blue**, **Dracula**, **Monokai**, **Nord Frost**, and **Matrix**, on one consistent flat ground.
- 🔊 **Acoustic Mechanical Key Synthesizer**:
  - Native Web Audio API keypress synthesizer providing subtle tactile feedback (zero external audio assets).
- ✨ **Purposeful Motion Layer**:
  - Anime.js-powered staggered hero headline reveal, one-time section reveals, and scroll-triggered clip-path image wipes on project entries.
  - Honors `prefers-reduced-motion`: content renders immediately and the ambient canvas loop is stopped.
- 🖱️ **Terminal-Caret Cursor Accent**:
  - A subtle blinking-caret overlay follows the pointer on fine-pointer, motion-safe devices — purely additive, never replaces the native cursor.
- 📱 **Responsive & Lightweight**:
  - Zero framework dependencies and zero build steps, optimized for GitHub Pages.

---

## 🛠️ Tech Stack

- **Core**: HTML5 (Semantic & Accessible), CSS3 (Tokens, Flexbox, CSS Grid, Glassmorphism), Vanilla JavaScript (ES6+)
- **Motion**: Anime.js 4.5.0 (pinned ES module loaded from jsDelivr)
- **Audio & Canvas**: Web Audio API, HTML5 Canvas API
- **Typography**: Inter & JetBrains Mono (Google Fonts)
