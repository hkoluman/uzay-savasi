const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Game Configurations ---
const FRICTION = 0.95;
const ACCELERATION = 0.8;
const MAX_SPEED = 10;
const BULLET_SPEED = 15;
const ENEMY_BULLET_SPEED = 6;
const FIRE_RATE = 150;
const ENEMY_SPAWN_RATE = 1000; // Fixed spawn rate for stability

// --- Classes ---

class Base {
    constructor() {
        this.height = 15;
        this.health = 100;
        this.maxHealth = 100;
        this.color = '#0ff';
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.fillRect(0, canvas.height - this.height, canvas.width, this.height);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * healthPercent})`;
        if (this.health < 30) ctx.fillStyle = `rgba(255, 0, 0, 0.2)`;

        if (this.health > 0) {
            ctx.fillRect(50, canvas.height - 50, 40, 50);
            ctx.fillRect(150, canvas.height - 80, 60, 80);
            ctx.fillRect(canvas.width - 200, canvas.height - 60, 50, 60);
            ctx.fillRect(canvas.width - 100, canvas.height - 40, 30, 40);
            ctx.fillRect(canvas.width / 2 - 50, canvas.height - 70, 100, 70);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`ÜS SAĞLIĞI: %${Math.max(0, this.health)}`, 20, canvas.height - 30);

        ctx.fillStyle = '#333';
        ctx.fillRect(200, canvas.height - 45, 200, 20);
        ctx.fillStyle = this.health > 50 ? '#0f0' : '#f00';
        ctx.fillRect(200, canvas.height - 45, 200 * healthPercent, 20);

        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.color = '#f00';
        setTimeout(() => this.color = '#0ff', 100);
        shakeScreen(10);

        if (this.health <= 0) {
            gameOver();
        }
    }
}

class Boss {
    constructor() {
        this.width = 200;
        this.height = 100;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = -150;
        this.targetY = 50;
        this.health = 2000; // Reduced health for testing
        this.maxHealth = 2000;
        this.vx = 2;
        this.color = '#f00';
        this.markedForDeletion = false;
        this.phase = 'enter';
        this.lastShot = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#800';
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 4;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeRect(0, 0, this.width, this.height);

        // Health Bar
        ctx.fillStyle = '#300';
        ctx.fillRect(0, -20, this.width, 10);
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, -20, this.width * (this.health / this.maxHealth), 10);
        ctx.restore();
    }

    update() {
        if (this.phase === 'enter') {
            this.y += 2;
            if (this.y >= this.targetY) {
                this.phase = 'fight';
                WaveManager.showBossMessage = false;
            }
        } else if (this.phase === 'fight') {
            this.x += this.vx;
            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.vx *= -1;
            }

            const now = Date.now();
            if (now - this.lastShot > 1500) {
                [-1, 0, 1].forEach(offset => {
                    enemyBullets.push(new EnemyProjectile(
                        this.x + this.width / 2,
                        this.y + this.height,
                        offset * 2,
                        6
                    ));
                });
                this.lastShot = now;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#f00');
            WaveManager.bossDefeated();
        }
    }
}


class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.markedForDeletion = false;
        const types = ['TRIPLE', 'RAPID', 'SHIELD', 'NUKE'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.color = '#fff';
        if (this.type === 'TRIPLE') this.color = '#ff0';
        if (this.type === 'RAPID') this.color = '#f00';
        if (this.type === 'SHIELD') this.color = '#0ff';
        if (this.type === 'NUKE') this.color = '#0f0';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '?';
        if (this.type === 'TRIPLE') icon = 'T';
        if (this.type === 'RAPID') icon = 'R';
        if (this.type === 'SHIELD') icon = 'S';
        if (this.type === 'NUKE') icon = 'N';
        ctx.fillText(icon, 0, 2);
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.markedForDeletion = true;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = '#0ff';
        this.vx = 0;
        this.vy = 0;
        this.lastShot = 0;
        this.weaponLevel = 1;
        this.powerUp = null;
        this.powerUpTimer = 0;
        this.powerUpDuration = 5000;
        this.shield = false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.shield) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width, 0, Math.PI * 2);
            ctx.strokeStyle = '#0ff';
            ctx.stroke();
        }

        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    update(deltaTime) {
        if (this.powerUp) {
            this.powerUpTimer += deltaTime;
            if (this.powerUpTimer > this.powerUpDuration) {
                this.powerUp = null;
                this.powerUpTimer = 0;
            }
        }

        if (keys['ArrowLeft'] || keys['KeyA']) this.vx -= ACCELERATION;
        if (keys['ArrowRight'] || keys['KeyD']) this.vx += ACCELERATION;
        if (keys['ArrowUp'] || keys['KeyW']) this.vy -= ACCELERATION;
        if (keys['ArrowDown'] || keys['KeyS']) this.vy += ACCELERATION;

        this.vx *= FRICTION;
        this.vy *= FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width) this.x = canvas.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.y = canvas.height;

        if (keys['Space'] || keys['Enter']) {
            const now = Date.now();
            let currentFireRate = FIRE_RATE;
            if (this.powerUp === 'RAPID') currentFireRate = 75;

            if (now - this.lastShot > currentFireRate) {
                this.shoot();
                this.lastShot = now;
            }
        }
    }

    shoot() {
        const startX = this.x;
        const startY = this.y - this.height / 2;

        if (this.weaponLevel === 1) {
            bullets.push(new Projectile(startX, startY, 0, -BULLET_SPEED));
        } else {
            const count = Math.min(this.weaponLevel, 5);
            const spread = 10;
            const center = Math.floor(count / 2);
            for (let i = 0; i < count; i++) {
                let offsetAngle = (i - center) * spread * (Math.PI / 180);
                let vx = Math.sin(offsetAngle) * BULLET_SPEED;
                let vy = -Math.cos(offsetAngle) * BULLET_SPEED;
                bullets.push(new Projectile(startX, startY, vx, vy));
            }
        }
    }

    activatePowerUp(type) {
        if (type === 'NUKE') {
            enemies = [];
            enemyBullets = [];
            score += 50;
            shakeScreen(20);
        } else if (type === 'SHIELD') {
            this.shield = true;
        } else if (type === 'TRIPLE') {
            this.weaponLevel++;
        } else {
            this.powerUp = type;
            this.powerUpTimer = 0;
        }
    }
}

class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.color = '#ff0';
        this.markedForDeletion = false;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.markedForDeletion = true;
        }
    }
}

class EnemyProjectile extends Projectile {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy);
        this.color = '#f00';
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = Math.random() * 2 + 1;
        this.color = '#f0f';
        this.markedForDeletion = false;
        this.canShoot = Math.random() < 0.2;
        this.lastShot = Date.now();
        this.fireRate = 2000;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        if (this.canShoot) {
            ctx.fillStyle = '#f00';
            ctx.fillRect(-5, -5, 10, 10);
        }
        ctx.restore();
    }

    update(timestamp) {
        this.y += this.speed;
        if (this.canShoot && !gameState.gameOver) {
            if (timestamp - this.lastShot > this.fireRate) {
                let dx = player.x - this.x;
                let dy = player.y - this.y;
                let angle = Math.atan2(dy, dx);
                let vx = Math.cos(angle) * 5;
                let vy = Math.sin(angle) * 5;
                enemyBullets.push(new EnemyProjectile(this.x, this.y, vx, vy));
                this.lastShot = timestamp;
            }
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.alpha = 1;
        this.markedForDeletion = false;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.05;
        if (this.alpha <= 0) this.markedForDeletion = true;
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 2 + 0.5;
        this.brightness = Math.random();
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
}

// --- Wave Manager ---
const WaveManager = {
    currentWave: 1,
    enemiesToSpawn: 10,
    enemiesSpawned: 0,
    bossSpawned: false,
    showBossMessage: false,

    update: () => {
        if (!gameState.running) return;

        if (WaveManager.enemiesSpawned >= WaveManager.enemiesToSpawn && enemies.length === 0 && !WaveManager.bossSpawned) {
            WaveManager.nextWave();
        }

        if (WaveManager.currentWave === 5 && !WaveManager.bossSpawned) {
            WaveManager.spawnBoss();
        }
    },

    spawnBoss: () => {
        WaveManager.bossSpawned = true;
        WaveManager.showBossMessage = true;
        boss = new Boss();
    },

    nextWave: () => {
        WaveManager.currentWave++;
        WaveManager.enemiesToSpawn += 5;
        WaveManager.enemiesSpawned = 0;

        const waveText = document.createElement('div');
        waveText.innerText = `DALGA ${WaveManager.currentWave}`;
        waveText.style.position = 'absolute';
        waveText.style.top = '50%';
        waveText.style.left = '50%';
        waveText.style.transform = 'translate(-50%, -50%)';
        waveText.style.color = '#fff';
        waveText.style.fontFamily = 'Arial';
        waveText.style.fontSize = '4rem';
        waveText.style.animation = 'fadeOut 3s forwards';
        document.body.appendChild(waveText);
        setTimeout(() => waveText.remove(), 3000);
    },

    bossDefeated: () => {
        gameState.running = false;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `ZAFER! SKOR: ${score}`;
        document.querySelector('#game-over-screen h1').innerText = "EVREN KURTARILDI!";
    }
};

// --- Global State ---
let player;
let base;
let boss = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let powerUps = [];
let stars = [];
let keys = {};
let lastEnemySpawn = 0;
let lastTime = 0;
let score = 0;
let gameState = {
    running: false,
    gameOver: false
};
let shake = 0;

function shakeScreen(amount) {
    shake = amount;
}

// --- Setup ---
for (let i = 0; i < 50; i++) { // Reduced stars
    stars.push(new Star());
}

// --- Event Listeners ---
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener('keydown', (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    keys[e.code] = true;

    if ((e.code === 'Space' || e.code === 'Enter') && !gameState.running && !gameState.gameOver) {
        initGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    initGame();
});

// --- Game Functions ---

function initGame() {
    gameState.running = true;
    gameState.gameOver = false;
    score = 0;
    player = new Player(canvas.width / 2, canvas.height - 100);
    base = new Base();
    boss = null;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerUps = [];
    lastEnemySpawn = 0;
    lastTime = 0;

    WaveManager.currentWave = 1;
    WaveManager.enemiesSpawned = 0;
    WaveManager.enemiesToSpawn = 10;
    WaveManager.bossSpawned = false;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('score').classList.remove('hidden');
    document.getElementById('score').innerText = 'SKOR: 0';
}

function spawnEnemies(timestamp) {
    if (WaveManager.bossSpawned) return;

    if (timestamp - lastEnemySpawn > ENEMY_SPAWN_RATE && WaveManager.enemiesSpawned < WaveManager.enemiesToSpawn) {
        let x = Math.random() * (canvas.width - 50) + 25;
        enemies.push(new Enemy(x, -50));
        lastEnemySpawn = timestamp;
        WaveManager.enemiesSpawned++;
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollisions() {
    // Player Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        // Vs Enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < enemy.width / 2 + bullet.radius) {
                bullet.markedForDeletion = true;
                enemy.markedForDeletion = true;
                score += 10;
                document.getElementById('score').innerText = 'SKOR: ' + score;
                createExplosion(enemy.x, enemy.y, '#f0f');
                if (Math.random() < 0.15) powerUps.push(new PowerUp(enemy.x, enemy.y));
                break;
            }
        }

        // Vs Boss
        if (boss && !bullet.markedForDeletion) {
            if (bullet.x > boss.x && bullet.x < boss.x + boss.width &&
                bullet.y > boss.y && bullet.y < boss.y + boss.height) {
                bullet.markedForDeletion = true;
                boss.takeDamage(10);
                createExplosion(bullet.x, bullet.y, '#ff0');
            }
        }
    }

    // Enemy Bullets
    enemyBullets.forEach(bullet => {
        if (!bullet.markedForDeletion) {
            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < player.width / 2 + bullet.radius) {
                bullet.markedForDeletion = true;
                if (player.shield) {
                    player.shield = false;
                } else {
                    gameOver();
                }
            }
            if (bullet.y > canvas.height - 50) {
                bullet.markedForDeletion = true;
                base.takeDamage(10);
            }
        }
    });

    // Enemies
    enemies.forEach(enemy => {
        if (!enemy.markedForDeletion) {
            if (enemy.y > canvas.height - 50) {
                enemy.markedForDeletion = true;
                base.takeDamage(20);
                createExplosion(enemy.x, enemy.y, '#f00');
            }
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.width / 2 + enemy.width / 2) {
                if (player.shield) {
                    enemy.markedForDeletion = true;
                    player.shield = false;
                } else {
                    gameOver();
                }
            }
        }
    });

    // Powerups
    powerUps.forEach(powerUp => {
        if (!powerUp.markedForDeletion) {
            const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);
            if (dist < player.width / 2 + powerUp.width / 2) {
                powerUp.markedForDeletion = true;
                player.activatePowerUp(powerUp.type);
            }
        }
    });
}

function gameOver() {
    gameState.running = false;
    gameState.gameOver = true;
    setTimeout(() => {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = score;
        document.querySelector('#game-over-screen h1').innerText = "OYUN BİTTİ";
    }, 1000);
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    let shakeX = 0;
    let shakeY = 0;
    if (shake > 0) {
        shakeX = (Math.random() - 0.5) * shake;
        shakeY = (Math.random() - 0.5) * shake;
        shake *= 0.9;
        if (shake < 0.5) shake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    if (gameState.running) {
        base.draw();
        WaveManager.update();
        player.update(deltaTime);
        player.draw();
        spawnEnemies(timestamp);

        if (boss) {
            boss.update();
            boss.draw();
        }

        bullets.forEach(b => { b.update(); b.draw(); });
        enemyBullets.forEach(b => { b.update(); b.draw(); });
        enemies.forEach(e => { e.update(timestamp); e.draw(); });
        powerUps.forEach(p => { p.update(); p.draw(); });

        checkCollisions();

        if (WaveManager.showBossMessage) {
            ctx.fillStyle = 'red';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("BOSS GELİYOR!", canvas.width / 2, canvas.height / 2);
        }

        bullets = bullets.filter(b => !b.markedForDeletion);
        enemyBullets = enemyBullets.filter(b => !b.markedForDeletion);
        enemies = enemies.filter(e => !e.markedForDeletion);
        powerUps = powerUps.filter(p => !p.markedForDeletion);
        if (boss && boss.markedForDeletion) boss = null;
    }

    particles.forEach(p => { p.update(); p.draw(); });
    particles = particles.filter(p => !p.markedForDeletion);

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
