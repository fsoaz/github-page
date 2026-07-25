/**
 * Francisco Soares — Interactive Portfolio Engine
 * World-Class Frontend Architecture: CLI Shell Engine + GUI State Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    currentTheme: 'cyber',
    audioEnabled: false,
    matrixActive: false,
    commandHistory: [],
    historyIndex: -1,
    audioCtx: null
  };

  // DOM Elements
  const cliView = document.getElementById('cli-view');
  const guiView = document.getElementById('gui-view');
  const btnToggleCli = document.getElementById('btn-toggle-cli');
  const btnToggleGui = document.getElementById('btn-toggle-gui');
  const themeSelect = document.getElementById('theme-select');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  
  const terminalBody = document.getElementById('terminal-body');
  const terminalLogs = document.getElementById('terminal-logs');
  const cliInput = document.getElementById('cli-input');
  const matrixCanvas = document.getElementById('matrix-canvas');

  // Telemetry elements
  const cpuVal = document.getElementById('telemetry-cpu');
  const memVal = document.getElementById('telemetry-mem');
  const pingVal = document.getElementById('telemetry-ping');

  /* ==========================================================================
     1. Web Audio API Keypress Synthesizer
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
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, state.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio Context init error:", e);
    }
  }

  btnToggleAudio.addEventListener('click', () => {
    state.audioEnabled = !state.audioEnabled;
    btnToggleAudio.innerHTML = state.audioEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
    btnToggleAudio.classList.toggle('active', state.audioEnabled);
  });

  /* ==========================================================================
     2. View Switching & Theme Management
     ========================================================================== */
  function setView(viewName) {
    if (viewName === 'cli') {
      cliView.classList.add('active');
      guiView.classList.remove('active');
      btnToggleCli.classList.add('active');
      btnToggleGui.classList.remove('active');
      cliInput.focus();
    } else {
      guiView.classList.add('active');
      cliView.classList.remove('active');
      btnToggleGui.classList.add('active');
      btnToggleCli.classList.remove('active');
    }
  }

  btnToggleCli.addEventListener('click', () => setView('cli'));
  btnToggleGui.addEventListener('click', () => setView('gui'));

  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  function setTheme(themeName) {
    state.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    themeSelect.value = themeName;
  }

  /* ==========================================================================
     3. Matrix Digital Rain Canvas Effect
     ========================================================================== */
  const ctx = matrixCanvas.getContext('2d');
  let matrixInterval = null;
  const chars = '011010010101010101PYTHONFASTAPIDOCKERLINUXPOSTGRESQL01';
  let drops = [];

  function resizeCanvas() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const columns = Math.floor(matrixCanvas.width / 20);
    drops = Array(columns).fill(1);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawMatrix() {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.05)';
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    
    ctx.fillStyle = '#00ff66';
    ctx.font = '14px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      ctx.fillText(text, i * 20, drops[i] * 20);
      if (drops[i] * 20 > matrixCanvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  function toggleMatrix(forceState) {
    state.matrixActive = forceState !== undefined ? forceState : !state.matrixActive;
    if (state.matrixActive) {
      matrixCanvas.classList.add('active');
      if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 40);
    } else {
      matrixCanvas.classList.remove('active');
      if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
      }
    }
  }

  /* ==========================================================================
     4. Simulated Telemetry Teleprinter Loop
     ========================================================================== */
  setInterval(() => {
    if (cpuVal) cpuVal.textContent = (Math.random() * 4 + 1.2).toFixed(1) + '%';
    if (memVal) memVal.textContent = (Math.random() * 0.4 + 4.1).toFixed(1) + 'GB / 16GB';
    if (pingVal) pingVal.textContent = Math.floor(Math.random() * 6 + 10) + 'ms';
  }, 3000);

  /* ==========================================================================
     5. Interactive Terminal Engine Commands
     ========================================================================== */
  const commands = {
    help: () => `
<div class="cli-response">
  <p style="color: var(--accent-cyan); font-weight:700; margin-bottom:8px;">AVAILABLE SYSTEM COMMANDS:</p>
  <table style="width:100%; border-collapse: collapse; font-size:0.85rem;">
    <tr><td style="color:var(--accent-purple); padding:4px 0; width:130px;">whoami</td><td>Display Francisco's bio and engineering background</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">neofetch</td><td>Display system specs and ASCII profile card</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">skills</td><td>List technical stack, frameworks & cloud expertise</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">projects</td><td>Show featured backend projects & architecture</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">contact</td><td>Get social links and direct mail options</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">theme [name]</td><td>Change theme (<span style="color:var(--accent-cyan)">cyber, dracula, monokai, nord, matrix</span>)</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">matrix</td><td>Toggle Matrix digital rain background canvas</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">gui</td><td>Switch to Graphical Dashboard view</td></tr>
    <tr><td style="color:var(--accent-purple); padding:4px 0;">clear</td><td>Clear the terminal screen</td></tr>
  </table>
  <p style="margin-top:10px; font-size:0.8rem; color:var(--text-dim);">💡 Tip: You can press <kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Tab</kbd> for autocompletion or click quick command pills above!</p>
</div>`,

    whoami: () => `
<div class="cli-response">
  <h3 style="color:var(--accent-cyan); font-size:1.1rem; margin-bottom:6px;">Francisco Soares</h3>
  <p style="color:var(--accent-purple); font-weight:600; margin-bottom:10px;">Backend Engineer | Automation & Distributed Systems</p>
  <p style="line-height:1.6; max-width:650px; color:var(--text-main);">
    Passionate about architecting scalable Python backends, high-throughput data processing pipelines, and resilient microservices.
    Specialized in FastAPI, PostgreSQL performance tuning, Docker containerization, and observability instrumentation.
  </p>
</div>`,

    neofetch: () => `
<div class="cli-response">
  <div class="neofetch-grid">
    <div class="ascii-banner">
  _____              
 |  ___| __ ___  __ _ 
 | |_ | '__/ __|/ _\` |
 |  _|| |  \\__ \\ (_| |
 |_|  |_|  |___/\\__,_|
    </div>
    <div class="neofetch-meta">
      <p><span class="neofetch-label">OS:</span> Linux x86_64 (Antigravity Workstation)</p>
      <p><span class="neofetch-label">Host:</span> Francisco Soares Engineering Node</p>
      <p><span class="neofetch-label">Kernel:</span> 6.8.0-fsoaz-custom</p>
      <p><span class="neofetch-label">Uptime:</span> 99.98% SLA Availability</p>
      <p><span class="neofetch-label">Shell:</span> zsh 5.9 (x86_64-debian-linux-gnu)</p>
      <p><span class="neofetch-label">Core Languages:</span> Python 3.12, SQL, Bash / Shell, JS</p>
      <p><span class="neofetch-label">Frameworks:</span> FastAPI, Streamlit, Next.js, Celery</p>
      <p><span class="neofetch-label">Databases:</span> PostgreSQL, Redis, TimescaleDB</p>
      <p><span class="neofetch-label">DevOps:</span> Docker, Linux Admin, CI/CD, Prometheus</p>
    </div>
  </div>
</div>`,

    skills: () => `
<div class="cli-response">
  <p style="color:var(--accent-cyan); font-weight:700; margin-bottom:8px;">⚡ CORE SKILLS & ENGINE STACK:</p>
  <div style="margin-bottom:12px;">
    <span style="color:var(--accent-amber); font-weight:600; display:block; margin-bottom:4px;">Backend & APIs:</span>
    <div class="skill-pills-container">
      <span class="skill-tag">Python (FastAPI / AsyncIO)</span>
      <span class="skill-tag">RESTful & GraphQL APIs</span>
      <span class="skill-tag">Celery / Task Queues</span>
      <span class="skill-tag">PyTest / TDD</span>
    </div>
  </div>
  <div style="margin-bottom:12px;">
    <span style="color:var(--accent-purple); font-weight:600; display:block; margin-bottom:4px;">Data & Databases:</span>
    <div class="skill-pills-container">
      <span class="skill-tag">PostgreSQL (Query Tuning)</span>
      <span class="skill-tag">Redis Caching</span>
      <span class="skill-tag">SQLAlchemy / Alembic</span>
    </div>
  </div>
  <div>
    <span style="color:var(--accent-green); font-weight:600; display:block; margin-bottom:4px;">DevOps & Infrastructure:</span>
    <div class="skill-pills-container">
      <span class="skill-tag">Docker & Compose</span>
      <span class="skill-tag">Linux Systems Administration</span>
      <span class="skill-tag">GitHub Actions CI/CD</span>
      <span class="skill-tag">Observability & Logging</span>
    </div>
  </div>
</div>`,

    projects: () => `
<div class="cli-response">
  <p style="color:var(--accent-cyan); font-weight:700; margin-bottom:12px;">📦 FEATURED PROJECTS:</p>
  
  <div class="project-cli-card">
    <a href="https://github.com/fsoaz/sales-analysis-dashboard" target="_blank" class="project-cli-title">
      <span>1. Sales Analysis Dashboard</span>
      <span>↗</span>
    </a>
    <p class="project-cli-tech">Python | Streamlit | Next.js | Pandas</p>
    <p style="font-size:0.88rem; color:var(--text-muted);">
      Interactive data telemetry and analytics suite for evaluating sales performance, product profitability trends, and regional revenue velocity.
    </p>
  </div>

  <div class="project-cli-card">
    <a href="https://github.com/fsoaz/dental-radar" target="_blank" class="project-cli-title">
      <span>2. Dental Radar Platform</span>
      <span>↗</span>
    </a>
    <p class="project-cli-tech">Python | PostgreSQL | Next.js | Machine Learning</p>
    <p style="font-size:0.88rem; color:var(--text-muted);">
      B2B sales-intelligence radar engine scoring and ranking regional dental clinics based on purchase propensity algorithms.
    </p>
  </div>
</div>`,

    contact: () => `
<div class="cli-response">
  <p style="color:var(--accent-cyan); font-weight:700; margin-bottom:8px;">📬 CONNECT WITH FRANCISCO:</p>
  <ul style="list-style:none; padding:0;">
    <li style="margin-bottom:6px;">🐙 <strong>GitHub:</strong> <a href="https://github.com/fsoaz" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">github.com/fsoaz</a></li>
    <li style="margin-bottom:6px;">💼 <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/fsoaz" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">linkedin.com/in/fsoaz</a></li>
    <li style="margin-bottom:6px;">✉️ <strong>Contact Form:</strong> Available in GUI mode or via command <span style="color:var(--accent-amber)">gui</span></li>
  </ul>
</div>`,

    matrix: () => {
      toggleMatrix();
      return `<div class="cli-response" style="color:var(--accent-green)">Matrix digital rain effect ${state.matrixActive ? 'ACTIVATED' : 'DEACTIVATED'}.</div>`;
    },

    gui: () => {
      setView('gui');
      return `<div class="cli-response">Switched to Graphical GUI view mode.</div>`;
    },

    ui: () => {
      setView('gui');
      return `<div class="cli-response">Switched to Graphical GUI view mode.</div>`;
    },

    clear: () => {
      terminalLogs.innerHTML = '';
      return null;
    },

    sudo: () => `
<div class="cli-response" style="color:var(--accent-rose); font-weight:700;">
  ⛔ ACCESS DENIED: User 'fsoaz' is logged in as root. Standard visitors must use unprivileged subshell!
</div>`,

    date: () => `
<div class="cli-response" style="color:var(--text-muted)">
  ${new Date().toUTCString()}
</div>`
  };

  /* ==========================================================================
     6. Command Input Execution Handler
     ========================================================================== */
  function executeCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to history
    state.commandHistory.push(trimmed);
    state.historyIndex = state.commandHistory.length;

    // Render prompt line in terminal logs
    const logLine = document.createElement('div');
    logLine.className = 'cli-output-block';
    logLine.innerHTML = `
      <div class="cli-prompt-line">
        <span class="cli-user">fsoaz</span>@<span class="cli-host">dev</span>:<span class="cli-path">~</span><span class="cli-symbol">$</span>
        <span style="color:var(--text-main); font-weight:normal;">${escapeHTML(trimmed)}</span>
      </div>
    `;

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg1 = parts[1] ? parts[1].toLowerCase() : null;

    let responseHTML = '';

    if (mainCmd === 'theme') {
      if (arg1 && ['cyber', 'dracula', 'monokai', 'nord', 'matrix'].includes(arg1)) {
        setTheme(arg1);
        responseHTML = `<div class="cli-response" style="color:var(--accent-cyan)">Theme switched to <strong>${arg1}</strong>.</div>`;
      } else {
        responseHTML = `<div class="cli-response" style="color:var(--accent-amber)">Usage: theme [cyber | dracula | monokai | nord | matrix]</div>`;
      }
    } else if (commands[mainCmd]) {
      responseHTML = commands[mainCmd]();
    } else {
      responseHTML = `
        <div class="cli-response" style="color:var(--accent-rose)">
          Command not found: <strong>${escapeHTML(mainCmd)}</strong>. Type <span style="color:var(--accent-cyan); cursor:pointer;" onclick="document.getElementById('cli-input').value='help'; document.getElementById('cli-input').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));">help</span> for available commands.
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

  // Key Listeners
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

  // Quick Command Pill Click Delegates
  document.querySelectorAll('.cmd-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.getAttribute('data-cmd');
      if (cmd) {
        cliInput.value = cmd;
        executeCommand(cmd);
        cliInput.focus();
      }
    });
  });

  // Window Focus Click
  document.getElementById('terminal-card').addEventListener('click', () => {
    if (cliView.classList.contains('active')) {
      cliInput.focus();
    }
  });

  // Execute initial banner on boot
  executeCommand('neofetch');
});
