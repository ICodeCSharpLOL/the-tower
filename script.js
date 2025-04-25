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
  { x: 100, y: 100, color:'blue' }, { x: 300, y: 100, color:'blue' }, 
  { x: 300, y: 300, color:'blue' }, { x: 100, y: 300, color:'blue' }, 
  { x: 100, y: 200, color:'blue' }, { x: 500, y: 200, color:'blue' },
 
  { x: 500, y: 300, color:'yellow' }, { x: 500, y: 500, color:'yellow'  },
  { x: 650, y: 500, color:'yellow'  },  { x: 650, y: 300, color:'yellow'}, 
  { x: 750, y: 300, color:'yellow'}, { x: 750, y: 500, color:'yellow'  },
 
  { x: 900, y: 500, color:'purple'  }, { x: 900, y: 300, color:'white' },{ x: 900, y: 100, color:'purple' }, 
  { x: 1000, y: 100, color:'purple' }, { x: 1000, y: 300, color:'white' },{ x: 1000, y: 500, color:'purple'  },
  { x: 1100, y: 500, color:'purple'  }, { x: 1100, y: 300, color:'white' },{ x: 1100, y: 100, color:'purple' }, 
  { x: 1200, y: 100, color:'purple' }, { x: 1200, y: 300, color:'white' },{ x: 1200, y: 500, color:'purple'  },

  { x: 900+400, y: 500, color:'purple'  },{ x: 1300, y: 300, color:'white' }, { x: 900+400, y: 100, color:'purple' }, 
  { x: 1000+400, y: 100, color:'purple' },{ x: 1400, y: 300, color:'white' }, { x: 1000+400, y: 500, color:'purple'  },
  { x: 1100+400, y: 500, color:'purple'  },{ x: 1500, y: 300, color:'white' }, { x: 1100+400, y: 100, color:'purple' }, 
  { x: 1200+400, y: 100, color:'purple' },{ x: 1600, y: 300, color:'white' }, { x: 1200+400, y: 500, color:'purple'  },

  { x: 1600, y: 800, color:'red' },{ x: 1000, y: 800, color:'red' }, 
  { x: 300, y: 800, color:'red' }, { x: 300, y: 600, color:'red' }
];
const TILE_SIZE = 50;

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
class SlowEnemy extends Enemy {
  constructor(path) {
    super(path);
    this.speed  = .5;
    this.radius = 11;
    this.maxHealth = 20;
    this.health = this.maxHealth;
  }
}
class BOSSEnemy extends Enemy {
  constructor(path) {
    super(path);
    this.speed  = .5;
    this.radius = 50;
    this.maxHealth = 2100;
    this.health = this.maxHealth;
  }
}

// ——— PARTICLES FOR DAMAGE ANIMATION ———
class Particle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.lineWidth = Math.random()*1.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 30 + Math.random() * 20;
    this.radius = (Math.random()*3.6) + Math.random() * 2;
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

    // Set the stroke style and line width
ctx.strokeStyle = 'red';
ctx.lineWidth = this.lineWidth;
// Draw the outline of the circle
ctx.stroke();
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
registerButton('Spawn Slow',  () => spawnEnemy(SlowEnemy));
registerButton('Spawn BOSS',  () => spawnEnemy(BOSSEnemy));

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
      for (let i = 0; i < 10; i++) {
        particles.push(new Particle(e.x, e.y));
      }
    }
  });
}

// ——— DRAW PATH ———
function drawPath(ctx) {
  //pathway
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let p of path.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = 'rgba(77, 55, 31,1)';
  ctx.lineWidth = 10;
  ctx.stroke();

  //squares
  for (let p of path) {
    let thickness = 3;
     ctx.fillStyle = 'black';
    //fill bigger square that becomes border
    ctx.fillRect(
      (p.x - TILE_SIZE/2) - thickness,
      (p.y - TILE_SIZE/2) - thickness,
      TILE_SIZE + (thickness*2), TILE_SIZE+ (thickness*2)
    );
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(
      p.x - TILE_SIZE/2,
      p.y - TILE_SIZE/2,
      TILE_SIZE, TILE_SIZE
    );
  }
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