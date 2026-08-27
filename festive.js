/**
 * festive.js — Minimal Raksha Bandhan festive canvas animation
 * Very few, slow-drifting elements:
 *   - Delicate marigold petals
 *   - Soft golden sparkle dots (firefly-like)
 *   - Thin sacred red/gold threads
 */

(function () {
  const canvas = document.getElementById('festive-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ── PETAL ──────────────────────────────────────────────────────
  function Petal() { this.reset(true); }
  Petal.prototype.reset = function (init) {
    this.x      = Math.random() * W;
    this.y      = init ? Math.random() * H : -20;
    this.r      = 3 + Math.random() * 4;
    this.vx     = (Math.random() - 0.5) * 0.4;
    this.vy     = 0.25 + Math.random() * 0.5;
    this.rot    = Math.random() * Math.PI * 2;
    this.drot   = (Math.random() - 0.5) * 0.02;
    this.swing  = Math.random() * Math.PI * 2;
    this.sSpeed = 0.012 + Math.random() * 0.012;
    this.color  = Math.random() < 0.6 ? '#f5a623' : '#e8821a';
    this.alpha  = 0.45 + Math.random() * 0.3;
  };
  Petal.prototype.update = function () {
    this.swing += this.sSpeed;
    this.x += this.vx + Math.sin(this.swing) * 0.5;
    this.y += this.vy;
    this.rot += this.drot;
    if (this.y > H + 20) this.reset(false);
  };
  Petal.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.r, this.r * 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ── SPARKLE ────────────────────────────────────────────────────
  function Sparkle() { this.reset(true); }
  Sparkle.prototype.reset = function (init) {
    this.x     = Math.random() * W;
    this.y     = init ? Math.random() * H : Math.random() * H;
    this.size  = 1 + Math.random() * 2;
    this.vx    = (Math.random() - 0.5) * 0.2;
    this.vy    = 0.05 + Math.random() * 0.15;
    this.phase = Math.random() * Math.PI * 2;
    this.color = Math.random() < 0.7 ? '#d4af37' : '#fff8dc';
    this.life  = 0;
    this.maxLife = 200 + Math.random() * 200;
  };
  Sparkle.prototype.update = function () {
    this.phase += 0.04;
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life >= this.maxLife || this.y > H + 10) this.reset(false);
  };
  Sparkle.prototype.draw = function () {
    const alpha = 0.2 + Math.abs(Math.sin(this.phase)) * 0.7;
    const s = this.size * (0.7 + Math.abs(Math.sin(this.phase)) * 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ── THREAD ─────────────────────────────────────────────────────
  function Thread() { this.reset(true); }
  Thread.prototype.reset = function (init) {
    this.x     = Math.random() * W;
    this.y     = init ? Math.random() * H : -30;
    this.len   = 14 + Math.random() * 18;
    this.vx    = (Math.random() - 0.5) * 0.3;
    this.vy    = 0.2 + Math.random() * 0.4;
    this.rot   = Math.random() * Math.PI * 2;
    this.drot  = (Math.random() - 0.5) * 0.015;
    this.color = Math.random() < 0.65 ? '#c8364a' : '#d4af37';
    this.alpha = 0.4 + Math.random() * 0.3;
    this.swing  = Math.random() * Math.PI * 2;
    this.sSpeed = 0.01 + Math.random() * 0.015;
  };
  Thread.prototype.update = function () {
    this.swing += this.sSpeed;
    this.x += this.vx + Math.sin(this.swing) * 0.3;
    this.y += this.vy;
    this.rot += this.drot;
    if (this.y > H + 40) this.reset(false);
  };
  Thread.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.len / 2, 0);
    ctx.bezierCurveTo(
      -this.len / 4, -this.len * 0.25,
       this.len / 4,  this.len * 0.25,
       this.len / 2, 0
    );
    ctx.stroke();
    ctx.restore();
  };

  // ── BUILD — only 22 particles total ────────────────────────────
  function buildParticles() {
    particles = [];
    for (let i = 0; i < 8;  i++) particles.push(new Petal());
    for (let i = 0; i < 10; i++) particles.push(new Sparkle());
    for (let i = 0; i < 4;  i++) particles.push(new Thread());
  }

  // ── LOOP ───────────────────────────────────────────────────────
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(loop);
  }

  resize();
  buildParticles();
  loop();

  window.addEventListener('resize', resize);

})();

