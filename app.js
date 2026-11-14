/**
 * Tahseen Raza Ansari — Portfolio Interactive Engine
 * High-performance interactive physics, 3D doors, flip calendar, and time machine
 */

(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // Web Audio Synthesizer (Realistic Mechanical Click for Pull Cord & Switches)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  function playClickSound(isTug = false) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (isTug) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (_) {}
  }

  // --------------------------------------------------------------------------
  // Theme Switching (View Transitions API + LocalStorage)
  // --------------------------------------------------------------------------
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const THEME_KEY = 'tahseen-theme-mode';

  function getMode() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved;
    } catch (_) {}
    return 'light';
  }

  function setMode(mode, animate = true) {
    const apply = () => {
      root.setAttribute('data-mode', mode);
      if (root.dataset) root.dataset.mode = mode;
      if (themeMeta) {
        themeMeta.setAttribute('content', mode === 'dark' ? '#1A1818' : '#E8E4E0');
      }
      try {
        localStorage.setItem(THEME_KEY, mode);
      } catch (_) {}
    };

    if (animate && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  setMode(getMode(), false);

  const toggleTheme = () => {
    const currentMode = root.getAttribute('data-mode') || (root.dataset && root.dataset.mode) || 'light';
    const next = currentMode === 'dark' ? 'light' : 'dark';
    playClickSound(false);
    setMode(next, true);
  };

  // --------------------------------------------------------------------------
  // Pull Cord: Verlet Rope Physics (Theme Switcher)
  // --------------------------------------------------------------------------
  (function initPullCord() {
    const wrap = document.getElementById('cord');
    if (!wrap) return;
    const cv = wrap.querySelector('.cord__cv');
    const hit = document.getElementById('cordHit');
    if (!cv || !hit) return;
    const ctx = cv.getContext('2d');

    const N = 24;
    const G = 4500;
    const ITER = 14;
    let W = 320, H = 420, dpr = 1;
    let L = 180, EXT_MAX = 55, HIDDEN = 50, seg = 10, ax = 220;
    let pts = [];
    let ext = 0, extV = 0, armed = true;
    let grab = -1, grabOff = { x: 0, y: 0 }, target = null, ptr = null, ptrPrev = null;
    let downAt = 0, downPos = null, moved = 0;
    let lastT = 0, t = 0;

    function layout() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let offset = 4.5 * 16;
      if (vw >= 1024) {
        L = Math.min(220, Math.max(160, vh * 0.25));
        EXT_MAX = 65;
      } else if (vw >= 640) {
        L = Math.min(180, Math.max(130, vh * 0.2));
        EXT_MAX = 55;
      } else {
        L = 80;
        EXT_MAX = 45;
        offset = 2.2 * 16;
      }

      HIDDEN = EXT_MAX + 15;
      W = Math.min(vw, 340);
      H = Math.round(L + EXT_MAX + 140);
      wrap.style.height = H + 'px';
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);

      const newAx = W - offset;
      const total = L + HIDDEN;
      seg = total / N;

      if (!pts.length) {
        for (let i = 0; i <= N; i++) {
          const x = newAx, y = -HIDDEN + i * seg;
          pts.push({ x, y, px: x, py: y, w: i === 0 ? 0 : 1 });
        }
      } else {
        const dx = newAx - ax;
        for (const p of pts) {
          p.x += dx;
          p.px += dx;
        }
      }
      ax = newAx;
    }

    function step(dt) {
      t += dt;
      if (grab < 0) {
        const K = 700, C = 20;
        extV += (-K * ext - C * extV) * dt;
        ext += extV * dt;
      }

      if (ext > EXT_MAX * 0.78 && armed) {
        armed = false;
        toggleTheme();
      }
      if (ext < EXT_MAX * 0.25) armed = true;

      const a = pts[0];
      a.x = a.px = ax;
      a.y = a.py = -HIDDEN + ext;

      const damp = grab >= 0 ? 0.99 : 0.985;
      for (let i = 1; i <= N; i++) {
        if (i === grab) continue;
        const p = pts[i];
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + G * dt * dt;
      }

      if (grab >= 0 && target) {
        const g = pts[grab];
        g.px = g.x;
        g.py = g.y;
        g.x = target.x;
        g.y = target.y;
      }

      for (let k = 0; k < ITER; k++) {
        for (let i = 0; i < N; i++) {
          const p1 = pts[i], p2 = pts[i + 1];
          const w1 = (i === grab) ? 0 : p1.w;
          const w2 = (i + 1 === grab) ? 0 : p2.w;
          const sw = w1 + w2;
          if (!sw) continue;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - seg) / d / sw;
          p1.x += dx * diff * w1;
          p1.y += dy * diff * w1;
          p2.x -= dx * diff * w2;
          p2.y -= dy * diff * w2;
        }
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      if (!pts.length) return;

      // Draw braided cord
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < N; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[N];
      ctx.lineTo(last.x, last.y);

      const isDark = root.dataset.mode === 'dark';
      ctx.strokeStyle = isDark ? 'rgba(215, 205, 195, 0.75)' : 'rgba(75, 65, 65, 0.75)';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Brass bell tassel at the end
      const knob = pts[N];
      hit.style.left = knob.x + 'px';
      hit.style.top = knob.y + 'px';

      ctx.save();
      ctx.translate(knob.x, knob.y);

      // Brass bell shape
      const grad = ctx.createLinearGradient(-8, -12, 10, 14);
      grad.addColorStop(0, '#FFE8B0');
      grad.addColorStop(0.3, '#D4B062');
      grad.addColorStop(0.7, '#8E6B2C');
      grad.addColorStop(1, '#4A3412');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Highlight sheen
      ctx.beginPath();
      ctx.arc(-2.5, -3, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();

      ctx.restore();
    }

    let isSleeping = false;
    let restFrames = 0;
    let cordRaf = null;

    function wakeLoop() {
      if (isSleeping) {
        isSleeping = false;
        restFrames = 0;
        lastT = 0;
        cordRaf = requestAnimationFrame(loop);
      }
    }

    function loop(time) {
      if (isSleeping) return;
      if (!lastT) lastT = time;
      const dt = Math.min((time - lastT) / 1000, 0.033);
      lastT = time;

      step(dt);
      draw();

      // Sleep detection when rope has fully settled
      if (grab < 0 && Math.abs(ext) < 0.05 && Math.abs(extV) < 0.08) {
        let totalVel = 0;
        for (let i = 1; i <= N; i++) {
          totalVel += Math.abs(pts[i].x - pts[i].px) + Math.abs(pts[i].y - pts[i].py);
        }
        if (totalVel < 0.08) {
          restFrames++;
          if (restFrames > 30) {
            isSleeping = true;
            return;
          }
        } else {
          restFrames = 0;
        }
      } else {
        restFrames = 0;
      }

      cordRaf = requestAnimationFrame(loop);
    }

    const local = e => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    function startDrag(e) {
      wakeLoop();
      grab = N;
      const p = local(e), g = pts[N];
      grabOff = { x: p.x - g.x, y: p.y - g.y };
      ptr = ptrPrev = p;
      target = { x: g.x, y: g.y };
      downAt = performance.now();
      downPos = p;
      moved = 0;
      wrap.classList.add('dragging');
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    }

    function onMove(e) {
      if (grab < 0) return;
      e.preventDefault();
      ptrPrev = ptr;
      ptr = local(e);
      moved = Math.max(moved, Math.hypot(ptr.x - downPos.x, ptr.y - downPos.y));

      let tx = ptr.x - grabOff.x;
      let ty = ptr.y - grabOff.y;
      const bx = ax, by = -HIDDEN;
      const reach = N * seg;
      let dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1e-6;
      let need = d - reach;
      if (need > EXT_MAX) {
        const over = need - EXT_MAX;
        const allowed = reach + EXT_MAX + over * 0.15 / (1 + over / 150);
        tx = bx + dx / d * allowed;
        ty = by + dy / d * allowed;
        need = EXT_MAX;
      }
      const targetExt = Math.max(0, need);
      ext += (targetExt - ext) * 0.55;
      extV = (ext - targetExt) * 40;
      target = { x: Math.max(14, Math.min(W - 14, tx)), y: Math.min(H - 40, ty) };
    }

    function endDrag() {
      if (grab < 0) return;
      const tap = moved < 6 && (performance.now() - downAt < 300);
      grab = -1;
      target = null;
      wrap.classList.remove('dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);

      if (tap) {
        tug();
      }
    }

    function tug() {
      wakeLoop();
      playClickSound(true);
      extV = EXT_MAX * 38;
      pts[N].px = pts[N].x + 2;
    }

    hit.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { hit.setPointerCapture(e.pointerId); } catch (_) {}
      startDrag(e);
    });

    hit.addEventListener('click', e => {
      e.preventDefault();
      tug();
    });

    const handleResize = () => {
      layout();
      wakeLoop();
    };

    layout();
    window.addEventListener('resize', handleResize);
    cordRaf = requestAnimationFrame(loop);
  })();

  // --------------------------------------------------------------------------
  // Preloader Counter
  // --------------------------------------------------------------------------
  (function initLoader() {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loaderFill');
    const count = document.getElementById('loaderCount');
    if (!loader) return;

    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 14) + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        if (fill) fill.style.width = '100%';
        if (count) count.textContent = '100%';
        setTimeout(() => {
          loader.classList.add('done');
        }, 300);
      } else {
        if (fill) fill.style.width = p + '%';
        if (count) count.textContent = p + '%';
      }
    }, 40);

    // Failsafe: guarantee loader dismisses after 1.5s
    setTimeout(() => {
      if (!loader.classList.contains('done')) {
        clearInterval(interval);
        if (fill) fill.style.width = '100%';
        if (count) count.textContent = '100%';
        loader.classList.add('done');
      }
    }, 1500);
  })();

  // --------------------------------------------------------------------------
  // Live Local Clock & Date Header
  // --------------------------------------------------------------------------
  (function initClock() {
    const timeEl = document.querySelector('[data-time]');
    const dateEl = document.querySelector('[data-date]');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function tick() {
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;

      if (timeEl) timeEl.textContent = `${h}:${m}${ampm}`;
      if (dateEl) dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    }

    tick();
    setInterval(tick, 10000);

    // Scroll header blur
    const hdr = document.querySelector('.hdr');
    window.addEventListener('scroll', () => {
      if (hdr) {
        hdr.classList.toggle('scrolled', window.scrollY > 30);
      }
    }, { passive: true });
  })();

  // --------------------------------------------------------------------------
  // Mechanical 3D Flip Calendar (Hero Skills)
  // --------------------------------------------------------------------------
  (function initFlipCalendar() {
    const cal = document.getElementById('cal');
    if (!cal) return;

    const SKILLS = [
      'AI & ML Engineer',
      'Full-Stack Developer',
      'Computer Vision Dev',
      'Systems Programmer',
      'Creative Problem Solver'
    ];

    const face = cal.querySelector('.cal__face');
    const under = cal.querySelector('[data-under]');
    const leaf = cal.querySelector('.cal__leaf');
    const rings = cal.querySelector('.cal__rings');
    const n = SKILLS.length;
    let idx = 0;
    let flipping = false;

    // Build rings & holes
    const holeCount = 8;
    if (rings) rings.innerHTML = '<i></i>'.repeat(holeCount);
    cal.querySelectorAll('.cal__holes').forEach(h => {
      h.innerHTML = '<i></i>'.repeat(holeCount);
    });

    const paint = (el, k) => {
      const word = el.querySelector('.cal__word');
      const num = el.querySelector('.cal__no');
      if (word) word.textContent = SKILLS[k];
      if (num) num.textContent = `${String(k + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    };

    if (face) paint(face, 0);
    if (under) paint(under, 1);

    function flip() {
      if (flipping || !leaf || !face || !under) return;
      flipping = true;
      const next = (idx + 1) % n;
      paint(under, next);

      leaf.animate([
        { transform: 'translateZ(0.005em) rotateX(0deg)' },
        { transform: 'translateZ(0.005em) rotateX(-180deg)' }
      ], {
        duration: 650,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards'
      }).onfinish = () => {
        idx = next;
        paint(face, idx);
        leaf.style.transform = 'translateZ(0.005em) rotateX(0deg)';
        paint(under, (idx + 1) % n);
        flipping = false;
      };
    }

    setInterval(flip, 3200);
  })();

  // --------------------------------------------------------------------------
  // Interactive Holographic Ability Card (Tilt & Foil Sheen)
  // --------------------------------------------------------------------------
  (function initAbilityCard() {
    const card = document.getElementById('abilityCard');
    if (!card) return;

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotY = (x - 0.5) * 26;
      const rotX = (0.5 - y) * 26;

      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      card.style.setProperty('--mx', (x - 0.5).toFixed(3));
      card.style.setProperty('--my', (y - 0.5).toFixed(3));
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
      card.style.setProperty('--mx', '0');
      card.style.setProperty('--my', '0');
    });

    // Flip card on click
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      playClickSound(false);
    });
  })();

  // --------------------------------------------------------------------------
  // "My Work, One Door Per Skill" (Interactive 3D Doors & Showcase)
  // --------------------------------------------------------------------------
  const DOORS_INFO = [
    [
      'Web & Full-Stack Development',
      'High-performance web apps, resilient backends, and low-token architectures',
      [
        'Zero-Token Sentinel (Cost Collapser) · AI cost reduction',
        'MediKiosk / AyurKiosk · ABDM/FHIR compliant OPD healthcare',
        'PlanMyPaisa · Asynchronous Celery + Redis financial engine',
        'Netflix Streaming Clone · Pixel-perfect entertainment UI'
      ]
    ],
    [
      'AI & Computer Vision',
      'Multimodal pipelines, real-time vision, OCR & intelligent graph analytics',
      [
        'AI Manga Translator · Real-time OCR, translation & inpainting',
        'Driver Drowsiness & Emotion Detector with Hardware Buzzer',
        'Criminal Network Analysis System · SIH 2026 Team BitWiser',
        'Stock Market Predictor Tool · Predictive time-series ML modeling'
      ]
    ],
    [
      'Systems & Core Engineering',
      'High-performance computation, competitive programming & low-level memory engineering',
      [
        'High-Throughput Hybrid Calculator · C++ AST Parsing Engine',
        'Algorithmic Problem Solving · Codeforces & LeetCode (Graph & DP)',
        'Production Memory Debugging · Triaged heap bottlenecks & segfaults',
        'Object-Oriented Design & Low-Latency Concurrent Routines'
      ]
    ],
    [
      'Cloud, Databases & DevOps',
      'Reliable cloud architectures, automated CI/CD, and scalable database schemas',
      [
        'Automated CI/CD Pipelines · GitHub Actions & Docker containers',
        'Dual-Model Persistence · MySQL relational & MongoDB document storage',
        'Government Health Standards · Ayushman Bharat Digital Mission (ABDM)',
        'Multi-Cloud Deployment · AWS, Google Cloud, Vercel, Render & Railway'
      ]
    ]
  ];

  (function initDoors() {
    const sec = document.getElementById('works');
    if (!sec) return;

    const units = [...sec.querySelectorAll('.unit')];
    const dinfo = document.getElementById('dinfo');
    const dinfoH = dinfo?.querySelector('.dinfo__h');
    const dinfoT = dinfo?.querySelector('.dinfo__t');
    const dinfoP = dinfo?.querySelector('.dinfo__p');

    const showInfo = i => {
      if (!dinfo || !DOORS_INFO[i]) return;
      if (dinfoH) dinfoH.textContent = DOORS_INFO[i][0];
      if (dinfoT) dinfoT.textContent = DOORS_INFO[i][1];
      if (dinfoP) {
        dinfoP.innerHTML = DOORS_INFO[i][2].map(item => `<li>• ${item}</li>`).join('');
      }
      dinfo.classList.add('on');
    };

    const hideInfo = () => {
      if (dinfo) dinfo.classList.remove('on');
    };

    units.forEach((unit, idx) => {
      const doorway = unit.querySelector('.doorway');

      unit.addEventListener('pointerenter', () => {
        unit.classList.add('hovered');
        showInfo(idx);
      });

      unit.addEventListener('pointerleave', () => {
        unit.classList.remove('hovered');
        hideInfo();
      });

      if (doorway) {
        doorway.addEventListener('click', e => {
          e.preventDefault();
          openDoorShowcase(idx);
        });
      }
    });

    // Global function to open a door room showcase
    window.openDoorShowcase = function(doorIdx) {
      playClickSound(false);
      units.forEach((u, i) => {
        u.classList.toggle('opened', i === doorIdx);
      });

      setTimeout(() => {
        const showcase = document.getElementById(`showcase-${doorIdx}`);
        if (showcase) {
          showcase.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      }, 350);
    };

    // Close showcase
    window.closeDoorShowcase = function(doorIdx) {
      const showcase = document.getElementById(`showcase-${doorIdx}`);
      if (showcase) {
        showcase.classList.remove('active');
        document.body.style.overflow = '';
      }
      units.forEach(u => u.classList.remove('opened'));
      hideInfo();
    };

    // Keyboard escape to close room
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.room-showcase.active').forEach(sc => {
          sc.classList.remove('active');
        });
        document.body.style.overflow = '';
        units.forEach(u => u.classList.remove('opened'));
      }
    });
  })();

  // --------------------------------------------------------------------------
  // "Let's Go Back In Time" (3D Rotating Concentric Clock Dials Tunnel & Timeline)
  // --------------------------------------------------------------------------
  (function initStory() {
    const sec = document.getElementById('about');
    if (!sec) return;

    const line = sec.querySelector('.story__line');
    const list = sec.querySelector('.story__list');
    if (!line || !list) return;

    const chs = [...list.querySelectorAll('.ch')];
    const N = chs.length;
    if (N === 0) return;

    const cols = [...sec.querySelectorAll('.dg__c')];
    const when = sec.querySelector('.story__when');
    const count = sec.querySelector('.story__count');
    const rail = sec.querySelector('.story__rail');
    const dtrack = sec.querySelector('.story__dtrack');
    const cv = sec.querySelector('.story__bg');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const root = document.documentElement;

    let shownYear = '', shown = -1;
    function setYear(y) {
      if (y === shownYear) return;
      shownYear = y;
      String(y).split('').forEach((d, k) => {
        if (cols[k]) cols[k].style.setProperty('--d', d);
      });
    }

    function show(i) {
      if (i === shown) return;
      shown = i;
      chs.forEach((c, k) => {
        c.classList.toggle('active', k === i);
        c.classList.toggle('on', k === i);
      });
      if (chs[i]) {
        setYear(chs[i].dataset.y || '2026');
        if (when) when.textContent = chs[i].dataset.when || '';
        if (count) count.textContent = String(i + 1).padStart(2, '0');
      }
      sec.classList.toggle('is-now', i === 0);
      sec.dataset.ch = i;
    }

    // ---- 3D Rotating Concentric Clock Dials Tunnel ----
    let W = 0, H = 0, dpr = 1, rgb = '26,24,24';
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth || 600;
      H = cv.clientHeight || 500;
      cv.width = W * dpr;
      cv.height = H * dpr;
    }

    function readRgb() {
      const mode = root.getAttribute('data-mode') || 'light';
      rgb = mode === 'dark' ? '232,228,224' : '26,24,24';
    }

    new MutationObserver(readRgb).observe(root, {
      attributes: true,
      attributeFilter: ['data-mode']
    });

    const RINGS = 16, GAP = 340, FOCAL = 520, R = 620, TICKS = 60;
    const dust = Array.from({ length: 70 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 120 + Math.random() * 760,
      z: Math.random() * RINGS * GAP,
      s: 0.6 + Math.random() * 1.4
    }));

    let curP = 0;
    let animActive = false;
    let animRaf = null;
    const startTime = performance.now();

    function renderTunnel(now) {
      if (!animActive) return;
      const t = (now - startTime) * 0.001;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.55;
      const k = Math.min(W, H) / 900;
      const camZ = curP * (N - 1) * GAP * 1.6 + t * 18;
      const spin = -curP * Math.PI * 1.5 - t * 0.02;
      const len = RINGS * GAP;

      ctx.lineCap = 'round';
      for (let i = 0; i < RINGS; i++) {
        const z = ((i * GAP - camZ) % len + len) % len + 60;
        const s = (FOCAL / z) * k;
        const fog = Math.min(1, Math.max(0, (z - 260) / 1100)) * Math.max(0, 1 - z / len);
        if (fog <= 0.01) continue;

        const rr = R * s;
        const rot = spin + i * 0.21;

        // Concentric dial ring
        ctx.strokeStyle = `rgba(${rgb},${(fog * 0.12).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, 1.2 * s);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();

        // 60 Clock ticks (12 bold hour marks, 48 minute marks)
        const T = W < 768 ? 36 : TICKS;
        const every = T / 12;
        for (const hour of [false, true]) {
          const l = (hour ? 46 : 18) * s;
          ctx.beginPath();
          for (let j = 0; j < T; j++) {
            if ((j % every === 0) !== hour) continue;
            const a = rot + (j / T) * Math.PI * 2;
            const c = Math.cos(a);
            const d = Math.sin(a);
            ctx.moveTo(cx + c * (rr - l), cy + d * (rr - l));
            ctx.lineTo(cx + c * rr, cy + d * rr);
          }
          ctx.strokeStyle = `rgba(${rgb},${(fog * (hour ? 0.3 : 0.14)).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, (hour ? 3 : 1.4) * s);
          ctx.stroke();
        }

        // Single hand on each dial
        const ha = rot * 3 + i;
        ctx.strokeStyle = `rgba(${rgb},${(fog * 0.16).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, 2 * s);
        if (rr < Math.min(W, H) * 0.45) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ha) * rr * 0.55, cy + Math.sin(ha) * rr * 0.55);
          ctx.stroke();
        }
      }

      // 3D Drifting Dust particles
      for (const q of dust) {
        const z = ((q.z - camZ * 1.1) % len + len) % len + 40;
        const s = (FOCAL / z) * k;
        const fog = Math.min(1, Math.max(0, (z - 300) / 900)) * Math.max(0, 1 - z / len);
        const a = q.a + spin * 0.3;
        ctx.fillStyle = `rgba(${rgb},${(fog * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(a) * q.r * s,
          cy + Math.sin(a) * q.r * s,
          Math.max(0.4, q.s * s * 2.2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      animRaf = requestAnimationFrame(renderTunnel);
    }

    // Sticky timeline rail & traveling dot measurement
    let firstY = 0, lastY = 0, endY = 0;
    function measure() {
      if (!chs.length) return;
      const mark = c => list.offsetTop + c.offsetTop + (c.firstElementChild ? c.firstElementChild.offsetTop : 0) + 8;
      firstY = mark(chs[0]);
      lastY = mark(chs[N - 1]);
      const last = chs[N - 1];
      endY = list.offsetTop + last.offsetTop + last.offsetHeight;
      if (rail) {
        rail.style.setProperty('--r0', firstY + 'px');
        rail.style.setProperty('--rh', Math.max(0, endY - firstY) + 'px');
      }
      if (dtrack) {
        dtrack.style.setProperty('--r0', firstY + 'px');
        dtrack.style.setProperty('--rh', Math.max(0, endY - firstY) + 'px');
      }
      size();
    }

    function updateScroll() {
      const lr = line.getBoundingClientRect();
      const mid = window.innerHeight * 0.5;
      const y = Math.min(lastY, Math.max(firstY, mid - lr.top));
      curP = Math.max(0, Math.min(1, (y - firstY) / Math.max(1, lastY - firstY)));

      sec.style.setProperty('--p', curP.toFixed(4));
      sec.style.setProperty('--warm', curP.toFixed(3));
      sec.classList.toggle('at-start', curP < 0.002);

      let activeIdx = 0;
      for (let k = 0; k < N; k++) {
        if (lr.top + list.offsetTop + chs[k].offsetTop < mid + 60) {
          activeIdx = k;
        }
      }
      show(activeIdx);
    }

    // IntersectionObserver to pause loop when not on screen
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        animActive = entry.isIntersecting;
        if (animActive) {
          cancelAnimationFrame(animRaf);
          animRaf = requestAnimationFrame(renderTunnel);
        } else {
          cancelAnimationFrame(animRaf);
        }
      }, { threshold: 0.05 });
      io.observe(sec);
    } else {
      animActive = true;
      animRaf = requestAnimationFrame(renderTunnel);
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      updateScroll();
    });

    readRgb();
    measure();
    show(0);
    updateScroll();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measure();
        updateScroll();
      });
    }
  })();

  // --------------------------------------------------------------------------
  // Contact Modal / Project Request Drawer
  // --------------------------------------------------------------------------
  (function initContactModal() {
    const modal = document.getElementById('contactModal');
    const form = document.getElementById('reqForm');
    const closeBtn = document.getElementById('mClose');
    const doneBtn = document.getElementById('mDone');
    const successBox = document.getElementById('mSuccess');
    const formBox = document.getElementById('mForm');
    const serviceChips = document.querySelectorAll('.mchips button');

    if (!modal) return;

    window.openContactModal = function(serviceType = '') {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (formBox) formBox.hidden = false;
      if (successBox) successBox.hidden = true;

      if (serviceType) {
        serviceChips.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.service === serviceType);
        });
      }
      setTimeout(() => {
        document.getElementById('f-name')?.focus();
      }, 150);
    };

    window.closeContactModal = function() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-contact]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        openContactModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeContactModal);
    if (doneBtn) doneBtn.addEventListener('click', closeContactModal);

    modal.addEventListener('click', e => {
      if (e.target === modal) closeContactModal();
    });

    // Inquiry chips selection
    let selectedService = 'Full-Stack Web App';
    serviceChips.forEach(btn => {
      btn.addEventListener('click', () => {
        serviceChips.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedService = btn.dataset.service || btn.textContent.trim();
      });
    });

    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const name = (document.getElementById('f-name')?.value || '').trim();
        const email = (document.getElementById('f-email')?.value || '').trim();
        const phone = (document.getElementById('f-phone')?.value || '').trim();
        const proj = (document.getElementById('f-project')?.value || '').trim();

        const subject = `Portfolio Project Inquiry from ${name} [${selectedService}]`;
        const body = `Hi Tahseen,\n\nService: ${selectedService}\n\nProject Details:\n${proj}\n\n—\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`;

        // Fallback to mailto link directly to Tahseen
        const mailtoUrl = `mailto:tahseencode@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;

        if (formBox) formBox.hidden = true;
        if (successBox) successBox.hidden = false;
      });
    }
  })();

  // --------------------------------------------------------------------------
  // Mobile Navigation Drawer & Smooth Section Navigation
  // --------------------------------------------------------------------------
  (function initNavigation() {
    const navm = document.getElementById('navm');
    const menuBtn = document.getElementById('menuBtn');
    const navClose = document.getElementById('navClose');

    if (menuBtn && navm) {
      menuBtn.addEventListener('click', () => {
        navm.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }

    if (navClose && navm) {
      navClose.addEventListener('click', () => {
        navm.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    document.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-go');
        const target = document.getElementById(targetId);
        if (target) {
          if (navm) navm.classList.remove('open');
          document.body.style.overflow = '';
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  })();

  // --------------------------------------------------------------------------
  // Fullscreen Holographic Baroque Ability Card Modal (Rishi Thakor Style)
  // --------------------------------------------------------------------------
  (function initHoloCard() {
    const holo = document.getElementById('holo');
    const holoLd = document.getElementById('holoLd');
    const holoBar = document.getElementById('holoBar');
    const holoPct = document.getElementById('holoPct');
    const holoLite = document.getElementById('holoLite');
    const holoEmbers = document.getElementById('holoEmbers');
    const holoOpen = document.getElementById('holoOpen');
    const holoClose = document.getElementById('holoClose');
    const hcEl = document.getElementById('hc');
    if (!holo || !hcEl) return;

    let isOpen = false;
    let isFlipped = false;
    let rafId = null;
    let embersRaf = null;

    // Smooth Lerp Spring State
    let tgRX = 0, tgRY = 0, tgPX = 0, tgPY = 0, tgLift = 0;
    let crRX = 0, crRY = 0, crPX = 0, crPY = 0, crLift = 0;
    let swayT = 0;

    // Pointer Drag State
    let isDragging = false;
    let startX = 0, startY = 0;
    let baseRY = 0, baseRX = 0;

    // --- 1. Drifting Golden Ember Particles ---
    const EMBER_COUNT = 45;
    const embers = [];

    function initEmbers() {
      if (!holoEmbers) return;
      const w = (holoEmbers.width = window.innerWidth);
      const h = (holoEmbers.height = window.innerHeight);
      embers.length = 0;
      for (let i = 0; i < EMBER_COUNT; i++) {
        embers.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.8,
          vy: -(0.3 + Math.random() * 0.6),
          vx: (Math.random() - 0.5) * 0.35,
          alpha: 0.15 + Math.random() * 0.65,
          fade: 0.001 + Math.random() * 0.002,
          hue: 35 + Math.random() * 15,
          t: Math.random() * 100
        });
      }
    }

    function renderEmbers() {
      if (!isOpen || !holoEmbers) return;
      const ctx = holoEmbers.getContext('2d');
      const w = holoEmbers.width;
      const h = holoEmbers.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.t += 0.02;
        e.x += e.vx + Math.sin(e.t) * 0.25;
        e.y += e.vy;
        e.alpha -= e.fade;

        if (e.y < -10 || e.alpha <= 0) {
          e.x = Math.random() * w;
          e.y = h + 6;
          e.r = 0.6 + Math.random() * 1.8;
          e.vy = -(0.3 + Math.random() * 0.6);
          e.alpha = 0.2 + Math.random() * 0.6;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, e.alpha);
        ctx.fillStyle = `hsl(${e.hue}, 90%, 72%)`;
        ctx.shadowColor = `hsl(${e.hue}, 100%, 80%)`;
        ctx.shadowBlur = e.r * 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      embersRaf = requestAnimationFrame(renderEmbers);
    }

    window.addEventListener('resize', () => {
      if (isOpen && holoEmbers) {
        holoEmbers.width = window.innerWidth;
        holoEmbers.height = window.innerHeight;
      }
    });

    // --- 2. Card Animation Loop (3D Tilt & Idle Sway) ---
    function loopCard() {
      if (!isOpen) return;

      swayT += 0.016;
      // Idle breathing sway when not dragging/hovering
      if (tgLift < 0.2 && !isDragging) {
        tgRY = Math.sin(swayT * 0.7) * 2.2;
        tgRX = Math.cos(swayT * 0.5) * 1.5;
      }

      const lp = 0.09;
      crRX += (tgRX - crRX) * lp;
      crRY += (tgRY - crRY) * lp;
      crPX += (tgPX - crPX) * lp;
      crPY += (tgPY - crPY) * lp;
      crLift += (tgLift - crLift) * lp;

      hcEl.style.setProperty('--rx', crRX.toFixed(2) + 'deg');
      hcEl.style.setProperty('--ry', crRY.toFixed(2) + 'deg');
      hcEl.style.setProperty('--px', crPX.toFixed(3));
      hcEl.style.setProperty('--py', crPY.toFixed(3));
      hcEl.style.setProperty('--lift', crLift.toFixed(3));

      rafId = requestAnimationFrame(loopCard);
    }

    // --- 3. Pointer & Mouse Hover Interactions ---
    hcEl.addEventListener('pointermove', e => {
      if (isDragging) return;
      const rect = hcEl.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      tgRY = nx * 22;
      tgRX = -ny * 18;
      tgPX = nx * 1.2;
      tgPY = ny * 1.2;
      tgLift = 1;
      hcEl.classList.add('live');
    });

    hcEl.addEventListener('pointerleave', () => {
      if (isDragging) return;
      tgRX = 0;
      tgRY = 0;
      tgPX = 0;
      tgPY = 0;
      tgLift = 0;
      hcEl.classList.remove('live');
    });

    // --- 4. Pointer Drag-to-Rotate ---
    hcEl.addEventListener('pointerdown', e => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      baseRY = crRY;
      baseRX = crRX;
      try { hcEl.setPointerCapture(e.pointerId); } catch (_) {}
      hcEl.classList.add('grabbing', 'live');
    });

    window.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      tgRY = baseRY + dx * 0.42;
      tgRX = baseRX - dy * 0.28;
      tgPX = Math.max(-1, Math.min(1, dx / 200));
      tgPY = Math.max(-1, Math.min(1, dy / 200));
      tgLift = 1;
    }, { passive: true });

    window.addEventListener('pointerup', e => {
      if (!isDragging) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      isDragging = false;
      hcEl.classList.remove('grabbing');
      try { hcEl.releasePointerCapture(e.pointerId); } catch (_) {}

      // Click threshold: if moved < 6px, trigger flip
      if (dist < 6) {
        toggleFlip();
      }
    });

    // --- 5. Flip Card ---
    function toggleFlip() {
      isFlipped = !isFlipped;
      hcEl.classList.toggle('flip', isFlipped);
      playClickSound(false);
    }

    hcEl.addEventListener('dblclick', toggleFlip);

    hcEl.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleFlip();
      }
    });

    // --- Card Burning / Ignition Reveal Effect ---
    const hcBurn = document.getElementById('hcBurn');
    let burnRaf = null;
    const burnSparks = [];

    function playIgniteSound() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const actx = new AudioContext();
        if (actx.state === 'suspended') {
          actx.resume();
        }
        const dur = 1.4;
        const bufSize = Math.floor(actx.sampleRate * dur);
        const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.11;
          b2 = 0.86 * b2 + white * 0.25;
          data[i] = (b0 + b1 + b2) * 0.3;
        }
        const src = actx.createBufferSource();
        src.buffer = buf;

        const flt = actx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(220, actx.currentTime);
        flt.frequency.exponentialRampToValueAtTime(1400, actx.currentTime + 0.5);
        flt.frequency.exponentialRampToValueAtTime(280, actx.currentTime + dur);
        flt.Q.setValueAtTime(2.2, actx.currentTime);

        const gain = actx.createGain();
        gain.gain.setValueAtTime(0.001, actx.currentTime);
        gain.gain.linearRampToValueAtTime(0.24, actx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);

        src.connect(flt);
        flt.connect(gain);
        gain.connect(actx.destination);

        src.start();
        src.stop(actx.currentTime + dur);
      } catch (_) {}
    }

    function igniteCard() {
      if (!hcBurn) return;
      cancelAnimationFrame(burnRaf);
      burnSparks.length = 0;

      const rect = hcEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (w <= 0 || h <= 0) return;

      hcBurn.width = w;
      hcBurn.height = h;
      hcBurn.style.opacity = '1';
      hcEl.classList.add('igniting');

      const bCtx = hcBurn.getContext('2d');
      playIgniteSound();

      const duration = 1350;
      const startTime = performance.now();

      function flameLineY(x, p, t) {
        // Diagonal burn from bottom-left (x=0, y=h) to top-right (x=w, y=0)
        const totalDist = w + h * 0.95;
        const progDist = p * (totalDist + 140 * dpr) - 50 * dpr;
        const base = h - (progDist - x) * 0.95;
        // Organic flame waviness
        const n1 = Math.sin(x * 0.02 + t * 0.015) * 12 * dpr;
        const n2 = Math.cos(x * 0.05 - t * 0.022) * 6 * dpr;
        const n3 = Math.sin(x * 0.09 + t * 0.035) * 3 * dpr;
        return base + n1 + n2 + n3;
      }

      function stepBurn(now) {
        const elapsed = now - startTime;
        const rawP = Math.min(1, elapsed / duration);
        // Smoothstep easing
        const p = rawP * rawP * (3 - 2 * rawP);

        bCtx.clearRect(0, 0, w, h);

        // Generate polygon path along the flame boundary line
        const step = Math.max(4, Math.floor(6 * dpr));
        const pts = [];
        for (let x = 0; x <= w; x += step) {
          pts.push({ x, y: flameLineY(x, p, now) });
        }
        if (pts[pts.length - 1].x < w) {
          pts.push({ x: w, y: flameLineY(w, p, now) });
        }

        // 1. Draw charred unburnt ash layer (area above the flame line towards top-right)
        bCtx.save();
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.lineTo(w, 0);
        bCtx.lineTo(w, pts[pts.length - 1].y);
        for (let i = pts.length - 1; i >= 0; i--) {
          bCtx.lineTo(pts[i].x, pts[i].y);
        }
        bCtx.lineTo(0, pts[0].y);
        bCtx.closePath();

        const charGrad = bCtx.createLinearGradient(0, 0, w, h);
        charGrad.addColorStop(0, 'rgba(10, 8, 8, 0.99)');
        charGrad.addColorStop(0.5, 'rgba(16, 12, 10, 0.98)');
        charGrad.addColorStop(1, 'rgba(25, 14, 10, 0.97)');
        bCtx.fillStyle = charGrad;
        bCtx.fill();
        bCtx.restore();

        // 2. Draw Fiery Multi-Pass Glowing Border along pts
        if (p < 0.99) {
          bCtx.save();
          bCtx.beginPath();
          bCtx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            bCtx.lineTo(pts[i].x, pts[i].y);
          }

          // Outer fiery ember halo
          bCtx.strokeStyle = 'rgba(235, 65, 15, 0.65)';
          bCtx.lineWidth = 18 * dpr;
          bCtx.lineCap = 'round';
          bCtx.lineJoin = 'round';
          bCtx.shadowColor = '#ff3300';
          bCtx.shadowBlur = 16 * dpr;
          bCtx.stroke();

          // Mid molten orange flame
          bCtx.strokeStyle = 'rgba(255, 140, 25, 0.92)';
          bCtx.lineWidth = 9 * dpr;
          bCtx.shadowColor = '#ff9900';
          bCtx.shadowBlur = 9 * dpr;
          bCtx.stroke();

          // Core white-hot edge
          bCtx.strokeStyle = 'rgba(255, 252, 230, 0.98)';
          bCtx.lineWidth = 3 * dpr;
          bCtx.shadowColor = '#fff5cf';
          bCtx.shadowBlur = 4 * dpr;
          bCtx.stroke();
          bCtx.restore();

          // 3. Spawn sizzling flying sparks along the flame line
          const numSparks = Math.floor(Math.random() * 4) + 2;
          for (let k = 0; k < numSparks; k++) {
            const pick = pts[Math.floor(Math.random() * pts.length)];
            if (pick && pick.y > -20 && pick.y < h + 20) {
              burnSparks.push({
                x: pick.x,
                y: pick.y,
                vx: (Math.random() - 0.4) * 2.8 * dpr,
                vy: -(Math.random() * 3.5 + 1.5) * dpr,
                r: (0.8 + Math.random() * 1.8) * dpr,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.04,
                hue: 25 + Math.random() * 25
              });
            }
          }

          // Also burst sparks into outer holoEmbers chamber
          if (p > 0.08 && p < 0.92 && Math.random() < 0.4 && embers.length) {
            const cardRect = hcEl.getBoundingClientRect();
            embers.push({
              x: cardRect.left + (Math.random() * cardRect.width),
              y: cardRect.top + (Math.random() * cardRect.height),
              r: 1.2 + Math.random() * 2.2,
              vy: -(1.2 + Math.random() * 2.5),
              vx: (Math.random() - 0.5) * 2,
              alpha: 0.9,
              fade: 0.015,
              hue: 25 + Math.random() * 20,
              t: Math.random() * 10
            });
          }
        }

        // 4. Update and render burn sparks
        for (let i = burnSparks.length - 1; i >= 0; i--) {
          const sp = burnSparks[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy -= 0.05 * dpr;
          sp.alpha -= sp.decay;

          if (sp.alpha <= 0 || sp.y < -20) {
            burnSparks.splice(i, 1);
            continue;
          }

          bCtx.save();
          bCtx.globalAlpha = Math.max(0, sp.alpha);
          bCtx.fillStyle = `hsl(${sp.hue}, 100%, 75%)`;
          bCtx.shadowColor = `hsl(${sp.hue}, 100%, 80%)`;
          bCtx.shadowBlur = sp.r * 3;
          bCtx.beginPath();
          bCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        }

        if (rawP < 1 || burnSparks.length > 0) {
          burnRaf = requestAnimationFrame(stepBurn);
        } else {
          // Flame complete: fade out burn canvas to reveal pristine baroque card
          hcBurn.style.opacity = '0';
          hcEl.classList.remove('igniting');
          setTimeout(() => {
            bCtx.clearRect(0, 0, w, h);
          }, 450);
        }
      }

      burnRaf = requestAnimationFrame(stepBurn);
    }

    // --- 6. Open Modal with Preloader ---
    function showHolo() {
      if (isOpen) return;
      isOpen = true;
      isFlipped = false;
      hcEl.classList.remove('flip', 'live', 'grabbing');

      // Reset state
      crRX = crRY = crPX = crPY = crLift = 0;
      tgRX = tgRY = tgPX = tgPY = tgLift = 0;
      hcEl.style.setProperty('--rx', '0deg');
      hcEl.style.setProperty('--ry', '0deg');
      hcEl.style.setProperty('--px', '0');
      hcEl.style.setProperty('--py', '0');
      hcEl.style.setProperty('--lift', '0');

      // Preloader reset
      if (holoBar) holoBar.style.setProperty('--p', 0);
      if (holoPct) holoPct.textContent = '0%';
      if (holoLd) holoLd.classList.remove('out', 'gone');
      if (holoLite) holoLite.classList.remove('in');
      if (hcBurn) hcBurn.style.opacity = '1';

      // Unhide and show
      holo.removeAttribute('hidden');
      holo.classList.add('on');
      document.body.style.overflow = 'hidden';

      // Start embers
      initEmbers();
      cancelAnimationFrame(embersRaf);
      embersRaf = requestAnimationFrame(renderEmbers);

      // Start card physics loop
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loopCard);

      // Progress bar fill 0% -> 100% over 1.2s
      const duration = 1200;
      const startTime = performance.now();

      function stepLd(now) {
        if (!isOpen) return;
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        const pct = Math.floor(p * 100);

        if (holoBar) holoBar.style.setProperty('--p', p);
        if (holoPct) holoPct.textContent = pct + '%';

        if (p < 1) {
          requestAnimationFrame(stepLd);
        } else {
          // Preloader complete: fade out loader, reveal card & ignite burn effect
          if (holoLd) holoLd.classList.add('out');
          setTimeout(() => {
            if (holoLd) holoLd.classList.add('gone');
            if (holoLite) holoLite.classList.add('in');
            try { hcEl.focus({ preventScroll: true }); } catch (_) {}
            igniteCard();
          }, 400);
        }
      }
      requestAnimationFrame(stepLd);
    }

    // --- 7. Close Modal ---
    function hideHolo() {
      if (!isOpen) return;
      isOpen = false;
      holo.classList.remove('on');
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(embersRaf);
      cancelAnimationFrame(burnRaf);
      burnRaf = null;
      if (hcBurn) hcBurn.style.opacity = '0';
      hcEl.classList.remove('igniting');
      rafId = null;
      embersRaf = null;
      document.body.style.overflow = '';

      setTimeout(() => {
        holo.setAttribute('hidden', '');
        if (holoLite) holoLite.classList.remove('in');
        if (holoLd) holoLd.classList.remove('out', 'gone');
      }, 420);
    }

    // Triggers
    if (holoOpen) holoOpen.addEventListener('click', showHolo);

    const heroCard = document.getElementById('abilityCard');
    if (heroCard) {
      // Double clicking hero card opens full modal
      heroCard.addEventListener('dblclick', showHolo);
    }

    if (holoClose) holoClose.addEventListener('click', hideHolo);

    // Clicking outside card closes modal
    holo.addEventListener('click', e => {
      if (e.target === holo || e.target === holoLite) {
        hideHolo();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) {
        hideHolo();
      }
    });

    // Pause heavy card and ember rendering when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(embersRaf);
        rafId = null;
        embersRaf = null;
      } else if (isOpen) {
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(embersRaf);
        rafId = requestAnimationFrame(loopCard);
        embersRaf = requestAnimationFrame(renderEmbers);
      }
    });
  })();

})();

