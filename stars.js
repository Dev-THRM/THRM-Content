/* ===================================================
   THRM CONTENT — stars.js
   Animated star field canvas for the hero section.
   Renders twinkling stars + a faint shooting star
   occasionally. No libraries required.
=================================================== */

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // ── RESIZE ──────────────────────────────────────
  function resize() {
    const hero   = canvas.parentElement;
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  resize();
  window.addEventListener('resize', () => { resize(); buildStars(); }, { passive: true });

  // ── STAR CONFIG ──────────────────────────────────
  const STAR_COUNT   = 280;
  const BRIGHT_RATIO = 0.12; // fraction that are brighter/larger

  let stars = [];

  function buildStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const bright = Math.random() < BRIGHT_RATIO;
      stars.push({
        x:      Math.random(),          // 0–1 (normalised)
        y:      Math.random(),
        r:      bright
                  ? Math.random() * 1.4 + 0.9    // larger
                  : Math.random() * 0.8 + 0.2,   // tiny
        baseOpacity: bright
                  ? Math.random() * 0.5 + 0.45
                  : Math.random() * 0.35 + 0.1,
        twinkleSpeed:  Math.random() * 0.025 + 0.006,
        twinkleOffset: Math.random() * Math.PI * 2,
        // slight colour variation: cold white, cool blue, warm white
        hue: Math.random() < 0.3 ? 210 : Math.random() < 0.15 ? 40 : 0,
        sat: Math.random() < 0.3 ? 60 : 0,
      });
    }
  }

  buildStars();

  // ── SHOOTING STAR ────────────────────────────────
  let shootingStar = null;
  let nextShoot    = Date.now() + rand(4000, 10000);

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnShootingStar() {
    const startX = rand(0.1, 0.8);
    const startY = rand(0.0, 0.4);
    const angle  = rand(20, 45) * (Math.PI / 180);
    const speed  = rand(0.003, 0.006);
    const length = rand(0.08, 0.16);

    shootingStar = {
      x:      startX,
      y:      startY,
      dx:     Math.cos(angle) * speed,
      dy:     Math.sin(angle) * speed,
      length,
      opacity: 1,
      age:    0,
      life:   rand(60, 100), // frames
    };

    nextShoot = Date.now() + rand(5000, 14000);
  }

  // ── DRAW LOOP ────────────────────────────────────
  let frame = 0;

  function draw() {
    requestAnimationFrame(draw);

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    frame++;

    // ── Static stars
    stars.forEach(star => {
      const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
      const alpha   = Math.max(0, Math.min(1, star.baseOpacity + twinkle * 0.25));

      const color = star.hue === 0
        ? `rgba(255,255,255,${alpha})`
        : `hsla(${star.hue},${star.sat}%,95%,${alpha})`;

      ctx.beginPath();
      ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Cross-sparkle for bright stars
      if (star.r > 1.2 && alpha > 0.6) {
        const len = star.r * 3.5;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.35})`;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(star.x * W - len, star.y * H);
        ctx.lineTo(star.x * W + len, star.y * H);
        ctx.moveTo(star.x * W, star.y * H - len);
        ctx.lineTo(star.x * W, star.y * H + len);
        ctx.stroke();
      }
    });

    // ── Shooting star
    if (Date.now() > nextShoot && !shootingStar) spawnShootingStar();

    if (shootingStar) {
      const s    = shootingStar;
      s.age++;
      s.x      += s.dx;
      s.y      += s.dy;
      s.opacity = 1 - s.age / s.life;

      if (s.opacity <= 0 || s.x > 1.1 || s.y > 1.1) {
        shootingStar = null;
      } else {
        const x1 = s.x * W;
        const y1 = s.y * H;
        const x0 = x1 - Math.cos(Math.atan2(s.dy, s.dx)) * s.length * W;
        const y0 = y1 - Math.sin(Math.atan2(s.dy, s.dx)) * s.length * W;

        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(1, `rgba(220,230,255,${s.opacity * 0.9})`);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Glow at tip
        ctx.beginPath();
        ctx.arc(x1, y1, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
      }
    }
  }

  draw();
})();
