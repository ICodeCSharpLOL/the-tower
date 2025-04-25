// ——— GLOBAL CANVAS SETUP ———
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ——— MOUSE HANDLING ———
const Mouse = { x: 0, y: 0, clicked: false };
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  Mouse.x = e.clientX - r.left;
  Mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', () => Mouse.clicked = true);
canvas.addEventListener('mouseup',   () => Mouse.clicked = false);

// ——— PATH DEFINITION ———
const path = [
  { x: 100, y: 100, color: }, { x: 300, y: 100 },
  { x: 300, y: 300 }, { x: 600, y: 300 },
  { x: 600, y: 500 }, { x: 900, y: 500 }
];
const TILE_SIZE = 20;

// ——— BUTTON SYSTEM ———
const ui = document.getElementById('ui');
function registerButton(label, callback) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.addEventListener('click', callback);
  ui.appendChild(btn);
}

// ——— ENEMY BASE CLASS ———
class Enemy {
  constructor(path) {
    this.path        = path;
    this.currentIndex= 0;
    const start      = path[0];
    this.x           = start.x;
    this.y           = start.y;
    this.speed       = 1.0;
    this.radius      = 10;
    this.maxHealth   = 20;
    this.health      = this.maxHealth;
    this.alive       = true;
  }

  update() {
    if (!this.alive) return;
    const tgt = this.path[this.currentIndex + 1];
    if (!tgt) { this.alive = false; return; }
    const dx = tgt.x - this.x, dy = tgt.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.speed) {
      this.x = tgt.x; this.y = tgt.y; this.currentIndex++;
    } else {
      this.x += dx/dist * this.speed;
      this.y += dy/dist * this.speed;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    // enemy circle
    ctx.beginPath();
    ctx.fillStyle = 'green';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    // health bar
    const barW = this.radius * 2;
    const barH = 4;
    const bx = this.x - this.radius;
    const by = this.y - this.radius - 10;
    // background (grey)
    ctx.fillStyle = 'grey';
    ctx.fillRect(bx, by, barW, barH);
    // foreground (red proportion)
    const hpPercent = this.health / this.maxHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(bx, by, barW * hpPercent, barH);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}

// ——— EXAMPLE EXTENDED ENEMY ———
class FastEnemy extends Enemy {
  constructor(path) {
    super(path);
    this.speed  = 2.0;
    this.radius = 8;
    this.maxHealth = 12;
    this.health = this.maxHealth;
  }
}

// ——— PARTICLES FOR DAMAGE ANIMATION ———
class Particle {
  constructor(x, y) {
    this.x = x; this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 30 + Math.random() * 20;
    this.radius = 2 + Math.random() * 2;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

// ——— SPAWNING & GLOBAL ARRAYS ———
const enemies  = [];
const particles= [];
function spawnEnemy(EnemyClass) {
  enemies.push(new EnemyClass(path));
}
registerButton('Spawn Basic', () => spawnEnemy(Enemy));
registerButton('Spawn Fast',  () => spawnEnemy(FastEnemy));

// ——— HELPERS ———
// is (x,y) inside any path tile
function isOnPath(x, y) {
  return path.some(p => {
    return x >= p.x - TILE_SIZE/2 &&
           x <= p.x + TILE_SIZE/2 &&
           y >= p.y - TILE_SIZE/2 &&
           y <= p.y + TILE_SIZE/2;
  });
}

// handle a click → deal damage & spawn particles
function handleClick() {
  const dmg = 5;
  enemies.forEach(e => {
    if (!e.alive) return;
    const dx = Mouse.x - e.x, dy = Mouse.y - e.y;
    if (Math.hypot(dx, dy) <= e.radius && isOnPath(e.x, e.y)) {
      e.takeDamage(dmg);
      // spawn ~6 particles
      for (let i = 0; i < 6; i++) {
        particles.push(new Particle(e.x, e.y));
      }
    }
  });
}

// ——— DRAW PATH ———
function drawPath(ctx) {
  for (let p of path) {
    ctx.fillStyle = 'red';
    ctx.fillRect(
      p.x - TILE_SIZE/2,
      p.y - TILE_SIZE/2,
      TILE_SIZE, TILE_SIZE
    );
  }
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let p of path.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = 'rgba(255,0,0,0.5)';
  ctx.stroke();
}

// ——— GAME LOOP ———
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (Mouse.clicked) {
    handleClick();
    Mouse.clicked = false;
  }

  drawPath(ctx);

  enemies.forEach(e => {
    e.update();
    e.draw(ctx);
  });

  // update & draw particles, then cull dead ones
  particles.forEach(p => { p.update(); p.draw(ctx); });
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(loop);
}
loop();