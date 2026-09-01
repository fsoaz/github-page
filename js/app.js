/**
 * app.js — Portfolio Application Engine
 * Handles: terminal drawer, theme switching, Web Audio synthesizer,
 * CLI command processing, keyboard shortcuts, ambient canvas (particles/matrix)
 *
 * Architecture: pure vanilla JS, no framework dependencies.
 * Zero DOM manipulation outside DOMContentLoaded to avoid hydration issues.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     GLOBAL STATE
  ──────────────────────────────────────────────────────────────────── */
  const state = {
    currentTheme:   'obsidian',
    audioEnabled:   false,
    audioCtx:       null,
    commandHistory: [],
    historyIndex:   -1,
    terminalOpen:   false,
    ambientMode:    'none', // 'particles' | 'matrix' | 'none'
  };

  /* ────────────────────────────────────────────────────────────────────
     DOM REFS
  ──────────────────────────────────────────────────────────────────── */
  const themeBtn        = document.getElementById('btn-theme');
  const audioBtn        = document.getElementById('btn-audio');
  const terminalBtn     = document.getElementById('btn-terminal');
  const terminalDrawer  = document.getElementById('terminal-drawer');
  const terminalBackdrop = document.getElementById('terminal-backdrop');
  const terminalLogs    = document.getElementById('terminal-logs');
  const terminalBody    = document.getElementById('terminal-body');
  const cliInput        = document.getElementById('cli-input');
  const ambientCanvas   = document.getElementById('ambient-canvas');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ────────────────────────────────────────────────────────────────────
     1. WEB AUDIO SYNTHESIZER
  ──────────────────────────────────────────────────────────────────── */
  function playKeyClick() {
    if (!state.audioEnabled) return;
    try {
      if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (state.audioCtx.state === 'suspended') state.audioCtx.resume();

      const now  = state.audioCtx.currentTime;
      const osc  = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + Math.random() * 180, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch { /* swallow audio errors */ }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      state.audioEnabled = !state.audioEnabled;
      audioBtn.classList.toggle('active', state.audioEnabled);
      audioBtn.setAttribute('aria-label',
        state.audioEnabled ? 'Mute keypress sound' : 'Enable keypress sound'
      );
      if (state.audioEnabled) playKeyClick();
    });
  }

  /* ────────────────────────────────────────────────────────────────────
     2. THEME SWITCHER (3 dark palettes)
  ──────────────────────────────────────────────────────────────────── */
  const THEMES = ['obsidian', 'cyber', 'nord'];
  const THEME_LABELS = {
    obsidian: '✦ Obsidian',
    cyber:    '⚡ Cyber',
    nord:     '❄ Nord',
  };

  function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    if (themeBtn) {
      themeBtn.setAttribute('title', `Theme: ${THEME_LABELS[theme]} — click to cycle`);
      themeBtn.setAttribute('aria-label', `Current theme: ${THEME_LABELS[theme]}. Click to change.`);
    }
    // Notify WebGL scene to update accent uniform
    if (window.__webgl) window.__webgl.setTheme();
    try { localStorage.setItem('fsoaz-theme', theme); } catch { /* ignore */ }
  }

  function cycleTheme() {
    const idx  = THEMES.indexOf(state.currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
  }

  if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

  // Restore saved theme
  try {
    const saved = localStorage.getItem('fsoaz-theme');
    if (saved && THEMES.includes(saved)) applyTheme(saved);
  } catch { /* ignore */ }

  /* ────────────────────────────────────────────────────────────────────
     3. TERMINAL DRAWER
  ──────────────────────────────────────────────────────────────────── */
  function openTerminal() {
    if (state.terminalOpen) return;
    state.terminalOpen = true;
    terminalDrawer?.classList.add('open');
    terminalBackdrop?.classList.add('visible');
    document.body.style.overflow = 'hidden';
    setTimeout(() => cliInput?.focus(), 400);
    if (!terminalLogs?.hasChildNodes()) {
      printWelcome();
    }
  }

  function closeTerminal() {
    if (!state.terminalOpen) return;
    state.terminalOpen = false;
    terminalDrawer?.classList.remove('open');
    terminalBackdrop?.classList.remove('visible');
    document.body.style.overflow = '';
  }

  function toggleTerminal() {
    state.terminalOpen ? closeTerminal() : openTerminal();
  }

  if (terminalBtn)     terminalBtn.addEventListener('click', toggleTerminal);
  if (terminalBackdrop) terminalBackdrop.addEventListener('click', closeTerminal);

  // Backtick shortcut
  document.addEventListener('keydown', e => {
    if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleTerminal();
    }
    if (e.key === 'Escape' && state.terminalOpen) {
      closeTerminal();
    }
  });

  // T-dot close button
  const tDotClose = document.querySelector('.t-dot-close');
  if (tDotClose) {
    tDotClose.style.cursor = 'pointer';
    tDotClose.addEventListener('click', closeTerminal);
  }

  /* ────────────────────────────────────────────────────────────────────
     4. TERMINAL COMMAND ENGINE
  ──────────────────────────────────────────────────────────────────── */
  function appendLog(html, cls = 'log-line-output') {
    if (!terminalLogs) return;
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = html;
    terminalLogs.appendChild(div);
    terminalBody?.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' });
  }

  function appendPromptLine(cmd) {
    appendLog(
      `<span class="prompt-user">fsoaz</span><span class="prompt-at">@</span>` +
      `<span class="prompt-host">dev</span><span class="prompt-sep">:</span>` +
      `<span class="prompt-path">~</span><span class="prompt-symbol"> $</span> ` +
      `<span style="color:var(--text-primary)">${escHtml(cmd)}</span>`,
      'log-line-prompt'
    );
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function printWelcome() {
    appendLog(`<span style="color:var(--accent)">Welcome to fsoaz@workstation (antigravity-sh)</span>`);
    appendLog(`Type <span style="color:var(--accent)">help</span> for available commands.`);
    appendLog('');
  }

  // Command definitions
  const COMMANDS = {
    help() {
      return [
        `<span style="color:var(--accent)">Available commands:</span>`,
        `  <span style="color:var(--text-primary)">whoami</span>     — identity & about`,
        `  <span style="color:var(--text-primary)">neofetch</span>   — system summary`,
        `  <span style="color:var(--text-primary)">skills</span>     — technical competencies`,
        `  <span style="color:var(--text-primary)">projects</span>   — featured systems`,
        `  <span style="color:var(--text-primary)">contact</span>    — channels & status`,
        `  <span style="color:var(--text-primary)">theme</span>      — cycle visual theme`,
        `  <span style="color:var(--text-primary)">particles</span>  — toggle ambient particles`,
        `  <span style="color:var(--text-primary)">matrix</span>     — toggle matrix rain`,
        `  <span style="color:var(--text-primary)">gui</span>        — close terminal`,
        `  <span style="color:var(--text-primary)">clear</span>      — clear output`,
        `  <span style="color:var(--text-primary)">sudo</span>       — you wish`,
      ];
    },

    whoami() {
      return [
        `<span style="color:var(--accent)">Francisco Soares</span>`,
        `Backend Engineer · Data, AI & Platform Automation`,
        ``,
        `Specialized in high-concurrency Python architectures, distributed data`,
        `pipelines, and evidence-backed AI interfaces.`,
        ``,
        `<span style="color:var(--text-muted)">Status:</span> <span style="color:var(--status-green)">● Open for backend / platform engineering roles</span>`,
      ];
    },

    neofetch() {
      return [
        `<span style="color:var(--accent)">fsoaz</span><span style="color:var(--text-muted)">@</span><span style="color:var(--status-green)">workstation</span>`,
        `──────────────────────────────`,
        `<span style="color:var(--text-muted)">OS:</span>       Debian Linux 6.8`,
        `<span style="color:var(--text-muted)">Shell:</span>    zsh 5.9 (antigravity-sh)`,
        `<span style="color:var(--text-muted)">Role:</span>     Backend Engineer`,
        `<span style="color:var(--text-muted)">Stack:</span>    Python · FastAPI · PostgreSQL · Redis · Docker`,
        `<span style="color:var(--text-muted)">Focus:</span>    High-concurrency APIs, data pipelines, AI systems`,
        `<span style="color:var(--text-muted)">Theme:</span>    ${document.documentElement.dataset.theme || 'obsidian'}`,
        `<span style="color:var(--text-muted)">WebGL:</span>   ${document.documentElement.classList.contains('no-webgl') ? 'disabled (CSS fallback)' : 'active'}`,
      ];
    },

    skills() {
      return [
        `<span style="color:var(--accent)">Technical Competencies</span>`,
        ``,
        `<span style="color:var(--text-primary)">Core Stack</span>  Backend & API Engineering`,
        `  Python 3.12 · FastAPI · AsyncIO · Celery · WebSockets · PyTest`,
        ``,
        `<span style="color:var(--text-primary)">Persistence</span>  Data Storage & Modeling`,
        `  PostgreSQL · Redis · SQLAlchemy · Alembic · Pandas · Query Tuning`,
        ``,
        `<span style="color:var(--text-primary)">Deployment</span>  Infrastructure & DevOps`,
        `  Docker & Compose · GitHub Actions · Linux/Bash · Nginx · Observability`,
      ];
    },

    projects() {
      return [
        `<span style="color:var(--accent)">Featured Systems</span>`,
        ``,
        `<span style="color:var(--text-primary)">01</span>  WikiAI Knowledge Engine`,
        `    <span style="color:var(--text-muted)">AI Search & Grounding · Next.js · FastAPI · Vector Grounding</span>`,
        `    <a href="https://github.com/fsoaz/wiki" target="_blank" style="color:var(--accent)">github.com/fsoaz/wiki</a>`,
        ``,
        `<span style="color:var(--text-primary)">02</span>  Financial Market Dashboard`,
        `    <span style="color:var(--text-muted)">Quantitative Analytics · Python · Streamlit · Plotly</span>`,
        `    <a href="https://github.com/fsoaz/financial-market-dashboard" target="_blank" style="color:var(--accent)">github.com/fsoaz/financial-market-dashboard</a>`,
        ``,
        `<span style="color:var(--text-primary)">03</span>  Sales Analytics Dashboard`,
        `    <span style="color:var(--text-muted)">Data Intelligence · Python · Pandas · Streamlit</span>`,
        `    <a href="https://github.com/fsoaz/sales-analysis-dashboard" target="_blank" style="color:var(--accent)">github.com/fsoaz/sales-analysis-dashboard</a>`,
        ``,
        `<span style="color:var(--text-primary)">04</span>  Dental Radar Intelligence`,
        `    <span style="color:var(--text-muted)">Market Signals & ML · Python · PostgreSQL · Scikit-Learn</span>`,
        `    <a href="https://github.com/fsoaz/dental-radar" target="_blank" style="color:var(--accent)">github.com/fsoaz/dental-radar</a>`,
        ``,
        `<span style="color:var(--text-primary)">05</span>  Trial Reminder App`,
        `    <span style="color:var(--text-muted)">Mobile Engineering · Kotlin · Android SDK · Room DB</span>`,
        `    <a href="https://github.com/fsoaz/TrialReminderApp" target="_blank" style="color:var(--accent)">github.com/fsoaz/TrialReminderApp</a>`,
      ];
    },

    contact() {
      return [
        `<span style="color:var(--accent)">Contact Channels</span>`,
        ``,
        `<span style="color:var(--text-primary)">GitHub</span>    <a href="https://github.com/fsoaz" target="_blank" style="color:var(--accent)">github.com/fsoaz</a>`,
        `<span style="color:var(--text-primary)">LinkedIn</span>  <a href="https://www.linkedin.com/in/francisco-soares-b89299427" target="_blank" style="color:var(--accent)">linkedin.com/in/francisco-soares-b89299427</a>`,
        ``,
        `<span style="color:var(--status-green)">● Open for full-time backend / platform engineering roles</span>`,
      ];
    },

    theme() {
      cycleTheme();
      return [`Theme switched to <span style="color:var(--accent)">${state.currentTheme}</span>.`];
    },

    particles() {
      if (state.ambientMode === 'particles') {
        state.ambientMode = 'none';
        stopAmbient();
        return [`Particles <span style="color:var(--text-muted)">disabled</span>.`];
      }
      state.ambientMode = 'particles';
      startParticles();
      return [`Particles <span style="color:var(--status-green)">enabled</span>. Use <span style="color:var(--accent)">particles</span> again to toggle off.`];
    },

    matrix() {
      if (state.ambientMode === 'matrix') {
        state.ambientMode = 'none';
        stopAmbient();
        return [`Matrix rain <span style="color:var(--text-muted)">disabled</span>.`];
      }
      state.ambientMode = 'matrix';
      startMatrix();
      return [`Matrix rain <span style="color:var(--status-green)">enabled</span>. Use <span style="color:var(--accent)">matrix</span> again to toggle off.`];
    },

    gui() {
      closeTerminal();
      return [];
    },

    clear() {
      if (terminalLogs) terminalLogs.innerHTML = '';
      return [];
    },

    sudo() {
      return [`<span style="color:#f43f5e">sudo: you don't have permission to do that... yet.</span>`];
    },
  };

  const AUTOCOMPLETE = Object.keys(COMMANDS);

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    playKeyClick();
    appendPromptLine(trimmed);

    state.commandHistory.unshift(trimmed);
    if (state.commandHistory.length > 50) state.commandHistory.pop();
    state.historyIndex = -1;

    const [cmd, ...args] = trimmed.split(/\s+/);
    const handler = COMMANDS[cmd.toLowerCase()];

    if (handler) {
      const lines = handler(args);
      if (lines?.length) {
        lines.forEach(l => appendLog(l));
        appendLog('');
      }
    } else {
      appendLog(
        `<span style="color:#f43f5e">command not found: ${escHtml(cmd)}</span> ` +
        `— try <span style="color:var(--accent)">help</span>`
      );
      appendLog('');
    }
  }

  /* CLI Input handling */
  if (cliInput) {
    cliInput.addEventListener('keydown', e => {
      playKeyClick();

      if (e.key === 'Enter') {
        e.preventDefault();
        const val = cliInput.value;
        cliInput.value = '';
        runCommand(val);
        return;
      }

      // History navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.historyIndex = Math.min(state.historyIndex + 1, state.commandHistory.length - 1);
        if (state.commandHistory[state.historyIndex] !== undefined) {
          cliInput.value = state.commandHistory[state.historyIndex];
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.historyIndex = Math.max(state.historyIndex - 1, -1);
        cliInput.value = state.historyIndex >= 0
          ? (state.commandHistory[state.historyIndex] || '')
          : '';
        return;
      }

      // Tab autocomplete
      if (e.key === 'Tab') {
        e.preventDefault();
        const val = cliInput.value.toLowerCase();
        const match = AUTOCOMPLETE.find(c => c.startsWith(val) && c !== val);
        if (match) cliInput.value = match;
        return;
      }
    });
  }

  /* Quick-action pills */
  document.querySelectorAll('.cmd-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.dataset.cmd;
      if (!cmd) return;
      openTerminal();
      setTimeout(() => runCommand(cmd), 250);
    });
  });

  /* ────────────────────────────────────────────────────────────────────
     5. AMBIENT CANVAS (Particles / Matrix) — 2D overlay inside terminal
  ──────────────────────────────────────────────────────────────────── */
  let ambientRaf = null;
  let ambCtx     = null;

  function getAmbientCanvas() {
    if (!ambientCanvas) return null;
    if (!ambCtx) ambCtx = ambientCanvas.getContext('2d');
    ambientCanvas.width  = window.innerWidth;
    ambientCanvas.height = window.innerHeight;
    return ambCtx;
  }

  function stopAmbient() {
    cancelAnimationFrame(ambientRaf);
    ambientRaf = null;
    if (ambCtx) ambCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
    if (ambientCanvas) ambientCanvas.style.opacity = '0';
  }

  /* Particles */
  function startParticles() {
    if (reducedMotion.matches) return;
    const ctx = getAmbientCanvas();
    if (!ctx) return;
    ambientCanvas.style.opacity = '1';

    const count = 120;
    const pts = Array.from({ length: count }, () => ({
      x:  Math.random() * ambientCanvas.width,
      y:  Math.random() * ambientCanvas.height,
      r:  Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      a:  Math.random(),
    }));

    function drawParticles() {
      ambientRaf = requestAnimationFrame(drawParticles);
      ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = ambientCanvas.width;
        if (p.x > ambientCanvas.width) p.x = 0;
        if (p.y < 0) p.y = ambientCanvas.height;
        if (p.y > ambientCanvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = p.a * 0.5;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    drawParticles();
  }

  /* Matrix rain */
  function startMatrix() {
    if (reducedMotion.matches) return;
    const ctx = getAmbientCanvas();
    if (!ctx) return;
    ambientCanvas.style.opacity = '1';

    const cols = Math.floor(ambientCanvas.width / 16);
    const drops = Array.from({ length: cols }, () => Math.random() * -50);
    const chars = 'アイウエオカキクケコ0123456789ABCDEF'.split('');

    function drawMatrix() {
      ambientRaf = requestAnimationFrame(drawMatrix);
      ctx.fillStyle = 'rgba(9,9,11,0.06)';
      ctx.fillRect(0, 0, ambientCanvas.width, ambientCanvas.height);
      ctx.fillStyle = '#22c55e';
      ctx.font = '14px JetBrains Mono, monospace';
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 16, y * 16);
        if (y * 16 > ambientCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5;
      });
    }
    drawMatrix();
  }

  /* ────────────────────────────────────────────────────────────────────
     6. CONTACT FORM — loading state & success message
  ──────────────────────────────────────────────────────────────────── */
  const contactForm = document.getElementById('main-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      const btn = contactForm.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Sending…</span>';
      }
    });
  }

  /* ────────────────────────────────────────────────────────────────────
     7. SMOOTH ANCHOR SCROLLING (works with Lenis)
  ──────────────────────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeTerminal();
      // Lenis smooth scroll if available, else native
      if (window.lenis) {
        window.lenis.scrollTo(target, { duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ────────────────────────────────────────────────────────────────────
     8. RESIZE HANDLER for ambient canvas
  ──────────────────────────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    if (ambientCanvas && state.ambientMode !== 'none') {
      ambientCanvas.width  = window.innerWidth;
      ambientCanvas.height = window.innerHeight;
    }
  });

});
