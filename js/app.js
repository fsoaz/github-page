/**
 * Francisco Soares — Portfolio Engine & CLI Console
 * Architecture: Antigravity Particle Field + Dual-Mode GUI/CLI State Engine + Web Audio Synthesizer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Application State
  const state = {
    currentTheme: 'antigravity',
    currentView: 'gui',
    audioEnabled: false,
    ambientMode: 'none', // 'particles', 'matrix', or 'none' — off by default, toggle via CLI
    commandHistory: [],
    historyIndex: -1,
    audioCtx: null
  };

  // DOM References
  const cliView = document.getElementById('cli-view');
  const guiView = document.getElementById('gui-view');
  const btnToggleCli = document.getElementById('btn-toggle-cli');
  const btnToggleGui = document.getElementById('btn-toggle-gui');
  const btnHeroCli = document.getElementById('btn-hero-cli-trigger');
  
  const themeSelect = document.getElementById('theme-select');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  const iconSoundOff = document.getElementById('icon-sound-off');
  const iconSoundOn = document.getElementById('icon-sound-on');
  
  const terminalBody = document.getElementById('terminal-body');
  const terminalLogs = document.getElementById('terminal-logs');
  const cliInput = document.getElementById('cli-input');
  const ambientCanvas = document.getElementById('ambient-canvas');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const customCursor = document.getElementById('custom-cursor');

  /* ==========================================================================
     1. Web Audio API Tactile Keypress Synthesizer
     ========================================================================== */
  function playKeyClick() {
    if (!state.audioEnabled) return;
    try {
      if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      
      const now = state.audioCtx.currentTime;
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      
      // Soft mechanical acoustic click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + Math.random() * 180, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);
      
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (err) {
      console.warn('Audio feedback error:', err);
    }
  }

  btnToggleAudio.addEventListener('click', () => {
    state.audioEnabled = !state.audioEnabled;
    btnToggleAudio.classList.toggle('active', state.audioEnabled);
    if (state.audioEnabled) {
      iconSoundOff.classList.add('hidden');
      iconSoundOn.classList.remove('hidden');
      btnToggleAudio.setAttribute('title', 'Mute mechanical keypress sound (On)');
      playKeyClick();
    } else {
      iconSoundOff.classList.remove('hidden');
      iconSoundOn.classList.add('hidden');
      btnToggleAudio.setAttribute('title', 'Enable mechanical keypress sound (Off)');
    }
  });

  /* ==========================================================================
     2. View Switching & Global Keyboard Shortcuts
     ========================================================================== */
  function setView(viewName) {
    state.currentView = viewName;
    if (viewName === 'cli') {
      cliView.classList.add('active');
      guiView.classList.remove('active');
      btnToggleCli.classList.add('active');
      btnToggleCli.setAttribute('aria-selected', 'true');
      btnToggleGui.classList.remove('active');
      btnToggleGui.setAttribute('aria-selected', 'false');
      setTimeout(() => cliInput && cliInput.focus(), 50);
    } else {
      guiView.classList.add('active');
      cliView.classList.remove('active');
      btnToggleGui.classList.add('active');
      btnToggleGui.setAttribute('aria-selected', 'true');
      btnToggleCli.classList.remove('active');
      btnToggleCli.setAttribute('aria-selected', 'false');
    }
  }

  btnToggleCli.addEventListener('click', () => setView('cli'));
  btnToggleGui.addEventListener('click', () => setView('gui'));
  if (btnHeroCli) {
    btnHeroCli.addEventListener('click', () => setView('cli'));
  }

  // Keyboard shortcut: ` or ~ toggles terminal anywhere
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      setView(state.currentView === 'cli' ? 'gui' : 'cli');
    }
  });

  /* ==========================================================================
     3. Theme Management
     ========================================================================== */
  function setTheme(themeName) {
    state.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    if (themeSelect) themeSelect.value = themeName;
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

  /* ==========================================================================
     4. Antigravity Physics Particle & Digital Rain Canvas
     ========================================================================== */
  const ctx = ambientCanvas.getContext('2d');
  let animationFrameId = null;
  let particles = [];
  let matrixDrops = [];
  const matrixChars = '010101PYTHONFASTAPIDOCKERLINUXSQL01';
  let mouse = { x: null, y: null, radius: 120 };

  function initCanvas() {
    ambientCanvas.width = window.innerWidth;
    ambientCanvas.height = window.innerHeight;

    // Initialize Antigravity particle constellation
    const count = Math.min(Math.floor(window.innerWidth / 18), 65);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * ambientCanvas.width,
        y: Math.random() * ambientCanvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 1.6 + 0.8,
        baseAlpha: Math.random() * 0.45 + 0.2
      });
    }

    // Initialize Matrix Drops
    const cols = Math.floor(ambientCanvas.width / 22);
    matrixDrops = Array(cols).fill(1);
  }

  window.addEventListener('resize', initCanvas);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  initCanvas();

  function renderAmbient() {
    if (reducedMotionQuery.matches) {
      ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
      animationFrameId = null;
      return;
    }

    if (state.ambientMode === 'particles') {
      ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

      // Draw particle network with subtle Antigravity links
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = ambientCanvas.width;
        if (p.x > ambientCanvas.width) p.x = 0;
        if (p.y < 0) p.y = ambientCanvas.height;
        if (p.y > ambientCanvas.height) p.y = 0;

        // Mouse interaction (antigravity repulsion)
        if (mouse.x !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${p.baseAlpha})`;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            const linkAlpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
    } else if (state.ambientMode === 'matrix') {
      ctx.fillStyle = 'rgba(7, 9, 14, 0.08)';
      ctx.fillRect(0, 0, ambientCanvas.width, ambientCanvas.height);

      ctx.fillStyle = '#10b981';
      ctx.font = '13px monospace';

      for (let i = 0; i < matrixDrops.length; i++) {
        const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        ctx.fillText(text, i * 22, matrixDrops[i] * 22);

        if (matrixDrops[i] * 22 > ambientCanvas.height && Math.random() > 0.98) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
    } else {
      ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
    }

    animationFrameId = requestAnimationFrame(renderAmbient);
  }

  if (!reducedMotionQuery.matches) {
    renderAmbient();
  }

  reducedMotionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
      animationFrameId = null;
    } else if (!animationFrameId) {
      initCanvas();
      renderAmbient();
    }
  });

  /* ==========================================================================
     5. Terminal-Caret Cursor Accent
     Purely additive overlay (pointer:fine + motion-safe only); never disables
     or replaces the native cursor, never intercepts input.
     ========================================================================== */
  const pointerFineQuery = window.matchMedia('(pointer: fine)');

  function updateCursorMode() {
    const shouldEnable = pointerFineQuery.matches && !reducedMotionQuery.matches;
    document.body.classList.toggle('cursor-caret-active', shouldEnable);
  }

  if (customCursor) {
    updateCursorMode();
    pointerFineQuery.addEventListener('change', updateCursorMode);
    reducedMotionQuery.addEventListener('change', updateCursorMode);

    let cursorRaf = null;
    window.addEventListener('mousemove', (e) => {
      if (!document.body.classList.contains('cursor-caret-active')) return;
      if (cursorRaf) return;
      cursorRaf = requestAnimationFrame(() => {
        customCursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY - 2}px, 0)`;
        cursorRaf = null;
      });
    });
  }

  /* ==========================================================================
     6. Interactive Terminal Engine & Commands
     ========================================================================== */
  const commands = {
    help: () => `
<div class="cli-response">
  <p style="color:var(--accent-primary); font-weight:700; margin-bottom:8px;">✦ AVAILABLE SYSTEM COMMANDS:</p>
  <table style="width:100%; border-collapse: collapse; font-size:0.85rem;">
    <tr><td style="color:var(--accent-primary); padding:3px 0; width:130px; font-weight:600;">whoami</td><td>Engineer overview, philosophy and background</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">neofetch</td><td>System architecture specs & node metadata</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">skills</td><td>Technical competencies, backend & database stacks</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">projects</td><td>Featured backend, AI, and data production codebases</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">contact</td><td>Direct email and professional channels</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">particles</td><td>Toggle Antigravity physics constellation background</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">matrix</td><td>Toggle Matrix digital rain canvas</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">theme [name]</td><td>Switch theme (<span style="color:var(--text-secondary)">antigravity, cyber, dracula, monokai, nord, matrix</span>)</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">gui</td><td>Switch to GUI Overview view</td></tr>
    <tr><td style="color:var(--accent-primary); padding:3px 0; font-weight:600;">clear</td><td>Clear terminal screen buffer</td></tr>
  </table>
  <p style="margin-top:8px; font-size:0.78rem; color:var(--text-muted);">Tip: Press <kbd style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">Tab</kbd> for autocompletion or press <kbd style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">\`</kbd> to toggle between GUI and Terminal.</p>
</div>`,

    whoami: () => `
<div class="cli-response">
  <h3 style="color:var(--accent-primary); font-size:1.05rem; margin-bottom:4px;">Francisco Soares</h3>
  <p style="color:var(--accent-emerald); font-weight:600; margin-bottom:8px;">Backend Engineer &bull; Data, AI & Platform Automation</p>
  <p style="line-height:1.6; max-width:640px; color:var(--text-secondary);">
    Architects reliable Python microservices, high-performance database queries, and grounded AI experiences. Focused on clean engineering, observability, and robust automated workflows.
  </p>
</div>`,

    neofetch: () => `
<div class="cli-response">
  <div style="display:grid; grid-template-columns:auto 1fr; gap:20px; align-items:center;">
    <pre style="color:var(--accent-primary); font-size:0.75rem; line-height:1.1; font-weight:bold;">
    ___   _   ___________ 
   /   | / | / /_  __/   |
  / /| |/  |/ / / / / /| |
 / ___ / /|  / / / / ___ |
/_/  |_/_/ |_/ /_/ /_/  |_|
    </pre>
    <div style="font-size:0.85rem; line-height:1.5;">
      <p><strong style="color:var(--accent-primary)">OS:</strong> Debian Linux x86_64 &bull; Antigravity Node</p>
      <p><strong style="color:var(--accent-primary)">Host:</strong> Francisco Soares Engineering Workstation</p>
      <p><strong style="color:var(--accent-primary)">Kernel:</strong> 6.8.0-fsoaz-perf</p>
      <p><strong style="color:var(--accent-primary)">Stack:</strong> Python 3.12, FastAPI, PostgreSQL, Redis, Docker</p>
      <p><strong style="color:var(--accent-primary)">Uptime:</strong> 99.98% Continuous SLA</p>
      <p><strong style="color:var(--accent-primary)">Shell:</strong> zsh 5.9 (x86_64-linux)</p>
    </div>
  </div>
</div>`,

    skills: () => `
<div class="cli-response">
  <p style="color:var(--accent-primary); font-weight:700; margin-bottom:8px;">⚡ CORE TECHNICAL COMPETENCIES:</p>
  <div style="margin-bottom:8px;">
    <span style="color:var(--accent-emerald); font-weight:600;">Backend & APIs:</span>
    <span style="color:var(--text-secondary);"> Python 3.12, FastAPI, AsyncIO, Celery, REST, WebSockets, PyTest</span>
  </div>
  <div style="margin-bottom:8px;">
    <span style="color:var(--accent-amber); font-weight:600;">Data & Storage:</span>
    <span style="color:var(--text-secondary);"> PostgreSQL, Redis, SQLAlchemy, Alembic, Query Optimization, Pandas</span>
  </div>
  <div>
    <span style="color:var(--accent-purple); font-weight:600;">Cloud & Ops:</span>
    <span style="color:var(--text-secondary);"> Docker & Compose, GitHub Actions CI/CD, Linux Administration, Nginx</span>
  </div>
</div>`,

    projects: () => `
<div class="cli-response">
  <p style="color:var(--accent-primary); font-weight:700; margin-bottom:10px;">📦 PRODUCTION SYSTEMS & PROJECTS:</p>
  
  <div style="margin-bottom:10px;">
    <a href="https://github.com/fsoaz/wiki" target="_blank" style="color:var(--accent-primary); font-weight:700; text-decoration:none;">1. WikiAI ↗</a>
    <span style="color:var(--text-muted); font-size:0.8rem;"> [Next.js | FastAPI | Postgres | AI Search]</span>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:2px;">Evidence-backed encyclopedia platform with citation-grounded search and reviewer workflows.</p>
  </div>

  <div style="margin-bottom:10px;">
    <a href="https://github.com/fsoaz/financial-market-dashboard" target="_blank" style="color:var(--accent-primary); font-weight:700; text-decoration:none;">2. Financial Market Dashboard ↗</a>
    <span style="color:var(--text-muted); font-size:0.8rem;"> [Python | Streamlit | Plotly | Market APIs]</span>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:2px;">Multi-asset analytics platform for stocks, indexes, crypto, and correlation analysis.</p>
  </div>

  <div style="margin-bottom:10px;">
    <a href="https://github.com/fsoaz/sales-analysis-dashboard" target="_blank" style="color:var(--accent-primary); font-weight:700; text-decoration:none;">3. Sales Analysis Dashboard ↗</a>
    <span style="color:var(--text-muted); font-size:0.8rem;"> [Python | Streamlit | Plotly | Pandas]</span>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:2px;">Bilingual analytics dashboard for revenue and cohort performance comparisons.</p>
  </div>

  <div style="margin-bottom:10px;">
    <a href="https://github.com/fsoaz/dental-radar" target="_blank" style="color:var(--accent-primary); font-weight:700; text-decoration:none;">4. Dental Radar Intelligence ↗</a>
    <span style="color:var(--text-muted); font-size:0.8rem;"> [Python | PostgreSQL | Next.js | ML Signals]</span>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:2px;">B2B market signals and machine learning platform for clinic propensity scoring.</p>
  </div>

  <div>
    <a href="https://github.com/fsoaz/TrialReminderApp" target="_blank" style="color:var(--accent-primary); font-weight:700; text-decoration:none;">5. Trial Reminder Android ↗</a>
    <span style="color:var(--text-muted); font-size:0.8rem;"> [Kotlin | Android | Room DB | Exact Alarms]</span>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:2px;">Native subscription tracking utility with exact local notification alarms.</p>
  </div>
</div>`,

    contact: () => `
<div class="cli-response">
  <p style="color:var(--accent-primary); font-weight:700; margin-bottom:8px;">📬 DIRECT COMMUNICATION CHANNELS:</p>
  <ul style="list-style:none; padding:0; font-size:0.88rem; line-height:1.7;">
    <li>🐙 <strong>GitHub:</strong> <a href="https://github.com/fsoaz" target="_blank" style="color:var(--accent-primary); text-decoration:none;">github.com/fsoaz ↗</a></li>
    <li>💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/francisco-soares-b89299427" target="_blank" style="color:var(--accent-primary); text-decoration:none;">linkedin.com/in/francisco-soares-b89299427 ↗</a></li>
    <li>✉️ <strong>Message Form:</strong> Use the contact section in GUI overview or command <span style="color:var(--accent-emerald)">gui</span></li>
  </ul>
</div>`,

    particles: () => {
      state.ambientMode = state.ambientMode === 'particles' ? 'none' : 'particles';
      return `<div class="cli-response" style="color:var(--accent-emerald)">Antigravity particle field is now <strong>${state.ambientMode === 'particles' ? 'ACTIVE' : 'OFF'}</strong>.</div>`;
    },

    matrix: () => {
      state.ambientMode = state.ambientMode === 'matrix' ? 'particles' : 'matrix';
      return `<div class="cli-response" style="color:var(--accent-emerald)">Matrix digital rain is now <strong>${state.ambientMode === 'matrix' ? 'ACTIVE' : 'OFF'}</strong>.</div>`;
    },

    gui: () => {
      setView('gui');
      return `<div class="cli-response">Switched to GUI Overview.</div>`;
    },

    ui: () => {
      setView('gui');
      return `<div class="cli-response">Switched to GUI Overview.</div>`;
    },

    overview: () => {
      setView('gui');
      return `<div class="cli-response">Switched to GUI Overview.</div>`;
    },

    clear: () => {
      terminalLogs.innerHTML = '';
      return null;
    },

    sudo: () => `
<div class="cli-response" style="color:var(--accent-rose); font-weight:700;">
  ⛔ PERMISSION DENIED: Guest session is sandboxed. Elevated privileges restricted to primary engineer node.
</div>`,

    uptime: () => `
<div class="cli-response" style="color:var(--text-secondary)">
  System active for 428 days, 14 hours, 22 minutes. Status: Operational.
</div>`,

    date: () => `
<div class="cli-response" style="color:var(--text-secondary)">
  ${new Date().toUTCString()}
</div>`
  };

  /* ==========================================================================
     7. Command Execution & Input Parsing
     ========================================================================== */
  function executeCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    state.commandHistory.push(trimmed);
    state.historyIndex = state.commandHistory.length;

    const logLine = document.createElement('div');
    logLine.className = 'cli-output-block';
    logLine.innerHTML = `
      <div class="cli-prompt-line">
        <span class="cli-user">fsoaz</span>@<span class="cli-host">dev</span>:<span class="cli-path">~</span><span class="cli-symbol">$</span>
        <span style="color:var(--text-primary); font-weight:500;">${escapeHTML(trimmed)}</span>
      </div>
    `;

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg1 = parts[1] ? parts[1].toLowerCase() : null;

    let responseHTML = '';

    if (mainCmd === 'theme') {
      const themes = ['antigravity', 'cyber', 'dracula', 'monokai', 'nord', 'matrix'];
      if (arg1 && themes.includes(arg1)) {
        setTheme(arg1);
        responseHTML = `<div class="cli-response" style="color:var(--accent-primary)">Theme switched to <strong>${arg1}</strong>.</div>`;
      } else {
        responseHTML = `<div class="cli-response" style="color:var(--accent-amber)">Usage: theme [antigravity | cyber | dracula | monokai | nord | matrix]</div>`;
      }
    } else if (commands[mainCmd]) {
      responseHTML = commands[mainCmd]();
    } else {
      responseHTML = `
        <div class="cli-response" style="color:var(--accent-rose)">
          Command not recognized: <strong>${escapeHTML(mainCmd)}</strong>. Type <span style="color:var(--accent-primary); cursor:pointer; text-decoration:underline;" onclick="document.getElementById('cli-input').value='help'; document.getElementById('cli-input').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));">help</span> to view available commands.
        </div>
      `;
    }

    if (responseHTML) {
      const responseDiv = document.createElement('div');
      responseDiv.innerHTML = responseHTML;
      logLine.appendChild(responseDiv);
    }

    terminalLogs.appendChild(logLine);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Key Listeners on CLI Input
  if (cliInput) {
    cliInput.addEventListener('keydown', (e) => {
      playKeyClick();

      if (e.key === 'Enter') {
        const val = cliInput.value;
        cliInput.value = '';
        executeCommand(val);
      } else if (e.key === 'ArrowUp') {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          cliInput.value = state.commandHistory[state.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (state.historyIndex < state.commandHistory.length - 1) {
          state.historyIndex++;
          cliInput.value = state.commandHistory[state.historyIndex] || '';
        } else {
          state.historyIndex = state.commandHistory.length;
          cliInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const val = cliInput.value.trim().toLowerCase();
        const matches = Object.keys(commands).filter(c => c.startsWith(val));
        if (matches.length === 1) {
          cliInput.value = matches[0];
        }
      }
    });
  }

  // Quick Command Toolbar Pills
  document.querySelectorAll('.cmd-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.getAttribute('data-cmd');
      if (cmd) {
        if (cliInput) {
          cliInput.value = cmd;
          executeCommand(cmd);
          cliInput.focus();
        }
      }
    });
  });

  // Focus CLI when clicking terminal body
  const terminalCard = document.getElementById('terminal-card');
  if (terminalCard) {
    terminalCard.addEventListener('click', () => {
      if (cliView.classList.contains('active') && cliInput) {
        cliInput.focus();
      }
    });
  }

  // Initial boot sequence log
  executeCommand('neofetch');
});
