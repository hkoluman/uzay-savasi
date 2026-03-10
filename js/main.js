import { Player } from './classes/Player.js';
import { Projectile } from './classes/Projectile.js';
import { Enemy } from './classes/Enemy.js';
import { Base } from './classes/Base.js';
import { PowerUp } from './classes/PowerUp.js';
import { Star } from './classes/Star.js';
import { Particle } from './classes/Particle.js';
import { Nebula } from './classes/Nebula.js';
import { WaveManager } from './managers/WaveManager.js';
import { Pool } from './utils/Pool.js';
import { HangarManager } from './managers/HangarManager.js';
import { SupportDrone } from './classes/SupportDrone.js';
import { sounds } from './managers/SoundManager.js';
import { LanguageManager } from './managers/LanguageManager.js';
import { AssetManager } from './managers/AssetManager.js';
import { Planet } from './classes/Planet.js';
import { Missions } from './managers/MissionManager.js';
LanguageManager.updateUI();
HangarManager.init();

// Wait for assets before starting
AssetManager.load().then(() => {
    console.log("Game assets ready.");
    requestAnimationFrame(gameLoop);
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Global State ---
const gameState = {
    running: false,
    gameOver: false
};

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) e.preventDefault();
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'Enter') && !gameState.running) initGame();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    initGame();
});

const muteBtn = document.getElementById('mute-btn');
const updateMuteIcon = () => {
    muteBtn.textContent = sounds.enabled ? '🔊' : '🔇';
    muteBtn.style.opacity = sounds.enabled ? '1' : '0.5';
};
updateMuteIcon();
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sounds.toggleEnabled();
    updateMuteIcon();
});

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        LanguageManager.setLanguage(btn.dataset.lang);
        updateHangarUI();
    });
});

// --- Hangar Logic ---
function updateHangarUI(forceRebuild = false) {
    const hangarScreen = document.getElementById('hangar-screen');
    const isVisible = !hangarScreen.classList.contains('hidden');

    document.getElementById('hangar-credits').innerText = HangarManager.credits;

    // Sadece hangar açıkken veya zorunlu olduğunda pahalı UI işlemlerini yap
    if (!isVisible && !forceRebuild) return;

    document.querySelectorAll('.upgrade-item').forEach(item => {
        const type = item.dataset.type;
        const level = HangarManager.upgrades[type];
        const cost = HangarManager.costs[type][level];

        item.querySelector('.level').innerText = level >= 5 ? LanguageManager.get('max') : `${LanguageManager.get('level')} ${level}`;
        const costSpan = item.querySelector('.cost');
        const btn = item.querySelector('.upgrade-btn');

        if (level >= 5) {
            costSpan.innerText = '-';
            btn.disabled = true;
        } else {
            costSpan.innerText = cost;
            btn.disabled = HangarManager.credits < cost;
        }
    });

    // Render Skins
    const skinsList = document.getElementById('skins-list');
    if (skinsList) {
        skinsList.innerHTML = '';
        HangarManager.skins.forEach((skin, index) => {
            const isOwned = HangarManager.ownedSkins.includes(index);
            const isActive = HangarManager.activeSkin === index;

            const skinItem = document.createElement('div');
            skinItem.className = 'skin-item';
            skinItem.style = `background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; border: 1px solid ${isActive ? skin.color : 'rgba(0,255,255,0.2)'}; transition: all 0.3s;`;
            if (isActive) skinItem.style.boxShadow = `0 0 15px ${skin.color}44`;

            skinItem.innerHTML = `
                <div style="width: 30px; height: 30px; background: ${skin.color}; border-radius: 5px; margin: 0 auto 10px; box-shadow: 0 0 10px ${skin.color}; transform: rotate(45deg);"></div>
                <div style="font-size: 14px; margin-bottom: 5px; font-weight: bold;">${LanguageManager.get(skin.name)}</div>
                <div style="font-size: 11px; color: #888; margin-bottom: 10px;">${isOwned ? (isActive ? `<span style="color:#0ff">${LanguageManager.get('active')}</span>` : LanguageManager.get('owned')) : skin.cost + ' ' + LanguageManager.get('credits')}</div>
                <button class="skin-btn ui-btn" data-index="${index}" style="padding: 5px; font-size: 11px; width: 100%; border-radius: 5px; background: ${isActive ? 'rgba(0,255,255,0.1)' : ''};" ${(!isOwned && HangarManager.credits < skin.cost) || isActive ? 'disabled' : ''}>
                    ${isOwned ? (isActive ? '---' : LanguageManager.get('select')) : LanguageManager.get('buy')}
                </button>
            `;
            skinsList.appendChild(skinItem);
        });
    }
}

function hideAllUI() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hangar-screen').classList.add('hidden');
}

function openHangar() {
    updateHangarUI(true);
    document.getElementById('hangar-screen').classList.remove('hidden');
}

document.getElementById('hangar-close-btn').addEventListener('click', () => {
    document.getElementById('hangar-screen').classList.add('hidden');
    // Eğer oyun bittiyse başlangıç ekranını göster
    if (gameState.gameOver) {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }
});

document.getElementById('start-hangar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openHangar();
});

document.getElementById('end-hangar-btn').addEventListener('click', () => {
    openHangar();
});


function refreshPlayerStats() {
    if (!player) return;
    player.gameConfig.FIRE_RATE = HangarManager.getStat('fireRate', 150);
    player.gameConfig.MAX_SPEED = HangarManager.getStat('maxSpeed', 10);
    player.missileCount = HangarManager.getStat('missileCap', 10);
    player.critChance = HangarManager.getStat('critChance', 0);
    player.magnetRange = HangarManager.getStat('magnetRange', 150);

    // Update Drones
    const newDroneLevel = HangarManager.getStat('droneLevel', 0);
    if (newDroneLevel > player.drones.length) {
        import('./classes/SupportDrone.js').then(m => {
            while (player.drones.length < newDroneLevel) {
                player.drones.push(new m.SupportDrone(player, player.drones.length, newDroneLevel));
            }
        });
    }
}

document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.closest('.upgrade-item').dataset.type;
        if (HangarManager.upgrade(type)) {
            updateHangarUI();
            refreshPlayerStats();
        }
    });
});

document.getElementById('skins-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('skin-btn')) {
        const index = parseInt(e.target.dataset.index);
        if (HangarManager.ownedSkins.includes(index)) {
            HangarManager.selectSkin(index);
        } else {
            if (HangarManager.buySkin(index)) {
                if (sounds) sounds.playPowerUp(); // Sound feedback
            }
        }
        updateHangarUI();
        if (player) {
            const skin = HangarManager.skins[HangarManager.activeSkin];
            player.color = skin.color;
        }
    }
});



// Entities
let player;
let base;
let enemies = [];
// Pools
// Pools
const projectilePool = new Pool(() => new Projectile(), (p, x, y, vx, vy, color, type) => p.reset(x, y, vx, vy, color, type), 100);
const particlePool = new Pool(() => new Particle(), (p, x, y, color) => p.reset(x, y, color), 100);

let powerUps = [];
let stars = [];
let nebulas = [];
let planets = [];
let speedLines = [];

// Shake & VFX
let shake = 0;
let glitchTime = 0;
function shakeScreen(amount) {
    shake = amount;
    glitchTime = 10; // Trigger glitch on damage
}

// Loop Vars
let lastTime = 0;
let score = 0;

// Setup Background
for (let i = 0; i < 150; i++) stars.push(new Star(canvas.width, canvas.height));
for (let i = 0; i < 5; i++) nebulas.push(new Nebula(canvas.width, canvas.height));
for (let i = 0; i < 1; i++) planets.push(new Planet(canvas.width, canvas.height));
for (let i = 0; i < 30; i++) speedLines.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    l: Math.random() * 80 + 20,
    s: Math.random() * 15 + 10
});

// High Score Logic
let highScore = localStorage.getItem('neonSpaceShooter_highScore') || 0;
document.getElementById('high-score').innerText = `${LanguageManager.get('high_score')}: ${highScore}`;

function initGame() {
    gameState.running = true;
    gameState.gameOver = false;
    score = 0;

    // Tüm UI ekranlarını temizle
    hideAllUI();

    // Update Score UI
    document.getElementById('score').innerText = `${LanguageManager.get('score')}: 0`;
    document.getElementById('high-score').innerText = `${LanguageManager.get('high_score')}: ${highScore}`;

    player = new Player(canvas.width / 2, canvas.height - 100);
    player.tookDamageThisWave = false;
    window.playerRef = player;
    base = new Base(canvas.width, canvas.height, gameOver);

    WaveManager.reset();

    // Clear Lists
    enemies = [];
    projectilePool.clear();
    particlePool.clear();
    powerUps = [];

    document.getElementById('score').classList.remove('hidden');

    Missions.init();
    Missions.updateUI();
}

window.addCredits = (amount) => {
    HangarManager.credits += amount;
    HangarManager.requestSave();

    // Throttle UI updates durante a batalha para 100ms
    const now = performance.now();
    if (!window._lastHangarUIUpdate || now - window._lastHangarUIUpdate > 100) {
        updateHangarUI();
        window._lastHangarUIUpdate = now;
    }
};

function spawnEnemies(timestamp) {
    if (WaveManager.bossSpawned) return;

    const ENEMY_SPAWN_RATE = 1000;
    if (!window.lastEnemySpawn) window.lastEnemySpawn = 0;

    if (timestamp - window.lastEnemySpawn > ENEMY_SPAWN_RATE &&
        WaveManager.enemiesSpawned < WaveManager.enemiesToSpawn) {

        const padding = canvas.width * 0.2;
        let x = Math.random() * (canvas.width - padding * 2) + padding;
        const stats = WaveManager.getEnemyStats();

        // Elite Enemy Rotation Logic (Every 6 waves)
        const currentWave = WaveManager.currentWave;
        let eliteType = 'ADVANCED_FIGHTER'; // Default (Type 7)

        if (currentWave >= 6) {
            const cycle = Math.floor((currentWave - 6) / 6);
            // Cycle 0 (Wave 6-11): STRIKE_FIGHTER (Type 8)
            // Cycle 1 (Wave 12-17): ADVANCED_FIGHTER (Type 7)
            eliteType = (cycle % 2 === 0) ? 'STRIKE_FIGHTER' : 'ADVANCED_FIGHTER';
        }

        let type = 'NORMAL';
        const rand = Math.random();

        // Much higher spawn weights for the requested types
        if (rand < 0.40) {
            type = eliteType; // 40% chance for the current elite type (7 or 8)
        } else if (rand < 0.55 && currentWave >= 2) {
            type = 'KAMIKAZE'; // 15% chance for kamikaze if wave >= 2
        } else if (rand > 0.85 && currentWave >= 4) {
            type = 'SNIPER'; // 15% chance for sniper if wave >= 4
        }

        enemies.push(new Enemy(x, -50, stats, type));
        window.lastEnemySpawn = timestamp;
        WaveManager.enemiesSpawned++;
    }
}

function createExplosion(x, y, color) {
    if (sounds) sounds.playExplosion();
    // Expose for projectile smoke (Missile needs this)
    window.particlePool = particlePool;

    // Explosive light particles
    for (let i = 0; i < 15; i++) {
        particlePool.get(x, y, color);
    }
    // Metallic debris particles
    const debrisColor = color === '#0ff' ? '#444' : color;
    for (let i = 0; i < 5; i++) {
        particlePool.get(x, y, debrisColor, 'debris');
    }
    // Shockwave Ring
    particlePool.get(x, y, color, 'shockwave');
}

function gameOver() {
    gameState.running = false;
    gameState.gameOver = true;

    // Convert score to credits
    HangarManager.addCredits(score);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonSpaceShooter_highScore', highScore);
        document.getElementById('high-score').innerText = `REKOR: ${highScore}`;
    }

    setTimeout(() => {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = score;
        document.querySelector('#game-over-screen h1').innerText = LanguageManager.get('game_over');
    }, 1000);
}

// Main Loop
function gameLoop(timestamp) {

    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (deltaTime > 50) deltaTime = 50;

    // FPS Calculation
    if (!window.fps) window.fps = 0;
    if (!window.frameCount) window.frameCount = 0;
    if (!window.lastFpsTime) window.lastFpsTime = 0;

    window.frameCount++;
    if (timestamp - window.lastFpsTime >= 1000) {
        window.fps = window.frameCount;
        window.frameCount = 0;
        window.lastFpsTime = timestamp;
    }

    // Shake & Glitch logic
    let shakeX = 0, shakeY = 0;
    let shaking = false;
    if (shake > 0) {
        shakeX = (Math.random() - 0.5) * shake;
        shakeY = (Math.random() - 0.5) * shake;
        shake *= 0.9;
        if (shake < 0.5) shake = 0;
        shaking = true;
    }

    const needsRestore = shaking || glitchTime > 0;
    if (needsRestore) {
        ctx.save();
        if (shaking) ctx.translate(shakeX, shakeY);
    }

    // Glitch Decrement (Cheaper alternative to filters)
    if (glitchTime > 0) {
        glitchTime -= deltaTime / 100;
        if (Math.random() < 0.3) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
            ctx.translate((Math.random() - 0.5) * 10, 0);
        }
    }

    // Clear background
    ctx.fillStyle = '#000814';
    ctx.fillRect(-50, -50, canvas.width + 100, canvas.height + 100);

    // Update & Draw Background Elements (Throttled for performance)
    if (!window._bgTick) window._bgTick = 0;
    window._bgTick++;

    // Process background logic every frame, but we could skip drawing if needed
    nebulas.forEach(n => n.update());
    planets.forEach(p => p.update(canvas.width, canvas.height));
    stars.forEach(s => s.update());

    // Only draw detailed BG every 2 frames if struggling
    if (window.fps > 45 || window._bgTick % 2 === 0) {
        nebulas.forEach(n => n.draw(ctx));
        planets.forEach(p => p.draw(ctx));
    }

    // Batch draw normal stars
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    stars.forEach(s => {
        if (!s.isShootingStar) {
            ctx.moveTo(s.x, s.y);
            ctx.arc(s.x, s.y, Math.max(0.1, s.size), 0, Math.PI * 2);
        }
    });
    ctx.fill();

    // Draw shooting stars individually
    ctx.lineWidth = 2;
    stars.forEach(s => {
        if (s.isShootingStar) {
            ctx.beginPath();
            ctx.strokeStyle = s.color || '#fff';
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - Math.cos(s.angle) * 30, s.y - Math.sin(s.angle) * 30);
            ctx.stroke();
        }
    });

    // Batch Draw Speed Lines
    const intensity = (WaveManager.bossSpawned ? 2 : 1);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    speedLines.forEach(l => {
        l.y += l.s * intensity;
        if (l.y > canvas.height) l.y = -l.l;
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + l.l);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (gameState.running) {
        window.currentWaveNum = WaveManager.currentWave; // Share with Enemy class
        // --- UPDATES ---
        base.draw(ctx);
        WaveManager.update(enemies.length, gameState, canvas.width, () => {
            player.missileCount = 10;
            Missions.updateProgress('no_damage', { waveCleared: true, tookDamage: player.tookDamageThisWave });
            player.tookDamageThisWave = false; // Reset for next wave
        });

        // Expose enemies for homing missiles
        window.enemiesList = enemies;

        // Pass projectilePool        // Update / Draw Player
        player.update(deltaTime, keys, canvas.width, canvas.height, projectilePool, enemies, timestamp);
        player.draw(ctx, keys);
        spawnEnemies(timestamp);

        if (WaveManager.boss) {
            WaveManager.boss.update(projectilePool, enemies);
            WaveManager.boss.draw(ctx);
            if (WaveManager.boss.markedForDeletion) {
                WaveManager.boss = null;
            }
        }

        // Entities Update & Draw
        projectilePool.update(deltaTime);
        projectilePool.draw(ctx);

        particlePool.update(deltaTime);
        particlePool.draw(ctx);

        enemies.forEach(e => {
            e.update(timestamp, projectilePool, player.x);
            e.draw(ctx);
        });
        powerUps.forEach(p => {
            p.update(player.x, player.y, player.magnetRange); // Pass magnet range
            p.draw(ctx);
        });

        // --- COLLISIONS ---
        const activeProjectiles = projectilePool.active;

        activeProjectiles.forEach(bullet => {
            if (bullet.markedForDeletion) return;

            if (bullet.type === 'player' || bullet.type === 'missile') {
                // Vs Enemies
                enemies.forEach(enemy => {
                    const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                    if (dist < enemy.width / 2 + (bullet.type === 'missile' ? 10 : bullet.radius) && !enemy.markedForDeletion) {
                        bullet.markedForDeletion = true;

                        // Missiles deal more damage (2)
                        // Player bullets: check for Critical Hit (Magenta color)
                        let damage = bullet.type === 'missile' ? 2 : 1;
                        if (bullet.color === '#f0f') {
                            damage *= 2; // Crit damage!
                            createExplosion(bullet.x, bullet.y, '#f0f'); // Magenta impact
                        }

                        if (enemy.takeDamage(damage)) {
                            score += 10 + (enemy.level * 5);
                            document.getElementById('score').innerText = LanguageManager.get('score') + ': ' + score;
                            createExplosion(enemy.x, enemy.y, enemy.color);

                            // Mission Progress
                            Missions.updateProgress('kill');
                            Missions.updateProgress('kill_type', { enemyType: enemy.type });
                            Missions.updateProgress('score', { score: score });
                            // Periodic Missile Drop (Every 3 waves)
                            if (WaveManager.currentWave % 3 === 0 && !WaveManager.missileDroppedInWave) {
                                const p = new PowerUp(enemy.x, enemy.y);
                                p.type = 'MISSILE';
                                p.color = '#f80';
                                powerUps.push(p);
                                WaveManager.missileDroppedInWave = true;
                            } else if (Math.random() < 0.15) {
                                powerUps.push(new PowerUp(enemy.x, enemy.y));
                            }
                        } else {
                            // Visual feedback for hit
                            createExplosion(bullet.x, bullet.y, '#fff');
                        }
                    }
                });

                // Vs Boss
                if (WaveManager.boss && !WaveManager.boss.markedForDeletion) {
                    const b = WaveManager.boss;
                    if (bullet.x > b.x && bullet.x < b.x + b.width &&
                        bullet.y > b.y && bullet.y < b.y + b.height) {
                        bullet.markedForDeletion = true;

                        // Missiles deal more damage (50)
                        // Player bullets: Crit check
                        let damage = bullet.type === 'missile' ? 50 : 10;
                        if (bullet.color === '#f0f') {
                            damage *= 2;
                            createExplosion(bullet.x, bullet.y, '#f0f');
                        }

                        b.takeDamage(damage, () => {
                            score += 1000;
                            HangarManager.addCredits(1000); // Bonus credits

                            // BOSS REWARD: Important Gifts (Power-ups)
                            for (let i = 0; i < 5; i++) {
                                const p = new PowerUp(b.x + Math.random() * b.width, b.y + Math.random() * b.height);
                                powerUps.push(p);
                            }

                            // BOSS REWARD: Free Drone Level!
                            if (HangarManager.upgrades.droneLevel < 5) {
                                HangarManager.upgrades.droneLevel++;
                                HangarManager.save();
                                player.droneLevel = HangarManager.upgrades.droneLevel;
                                player.drones.push(new SupportDrone(player, player.drones.length, player.droneLevel));
                                // Update all drones for orbit
                                player.drones.forEach(d => d.totalDrones = player.droneLevel);
                            }

                            base.repair(40);
                            WaveManager.bossDefeated();
                        });
                        createExplosion(bullet.x, bullet.y, '#ff0');
                    }
                }
            } else if (bullet.type === 'enemy') {
                // Vs Player
                const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
                if (dist < player.width / 2 + bullet.radius) {
                    bullet.markedForDeletion = true;
                    if (player.shield) {
                        player.shield = false;
                    } else {
                        base.takeDamage(10, shakeScreen);
                        player.tookDamageThisWave = true;
                        createExplosion(player.x, player.y, '#f00');
                    }
                }

                // Vs Base
                if (bullet.y > canvas.height - 50) {
                    bullet.markedForDeletion = true;
                    createExplosion(bullet.x, bullet.y, '#555');
                }
            }
        });

        // 3. Enemies -> Player/Base
        enemies.forEach(enemy => {
            if (enemy.markedForDeletion) return;
            if (enemy.y > canvas.height - 50) {
                enemy.markedForDeletion = true;
                base.takeDamage(20, shakeScreen);
                player.tookDamageThisWave = true;
                createExplosion(enemy.x, enemy.y, '#f00');
            }
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.width / 2 + enemy.width / 2) {
                if (player.shield) {
                    enemy.markedForDeletion = true;
                    player.shield = false;
                } else gameOver();
            }
        });

        // 4. PowerUps
        powerUps.forEach(p => {
            if (p.markedForDeletion) return;
            const dist = Math.hypot(player.x - p.x, player.y - p.y);
            if (dist < player.width / 2 + p.width / 2) {
                p.markedForDeletion = true;
                player.activatePowerUp(p.type, () => {
                    enemies = [];
                    projectilePool.active.forEach(b => {
                        if (b.type === 'enemy') b.markedForDeletion = true;
                    });

                    score += 50;
                    shakeScreen(20);
                });
            }
        });

        // Message
        if (WaveManager.showBossMessage) {
            ctx.fillStyle = 'red';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(LanguageManager.get('boss_coming'), canvas.width / 2, canvas.height / 2);
        }

        // Draw FPS
        ctx.fillStyle = '#0f0';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${window.fps}`, 10, 60);
        ctx.fillText(`${LanguageManager.get('objects')}: ${enemies.length + powerUps.length + projectilePool.active.length + particlePool.active.length}`, 10, 80);
        ctx.fillStyle = '#f30';
        ctx.fillText(LanguageManager.get('rocket') + `: ${player.missileCount}`, 10, 100);

        // Cleanup (Zero Allocation)
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].markedForDeletion) {
                enemies.splice(i, 1);
            }
        }
        for (let i = powerUps.length - 1; i >= 0; i--) {
            if (powerUps[i].markedForDeletion) {
                powerUps.splice(i, 1);
            }
        }
    }
    // End frame state restore
    if (needsRestore) {
        ctx.restore();
    }

    // Safety fallback: ensure global state is clean for next frame
    ctx.globalAlpha = 1;

    requestAnimationFrame(gameLoop);
}
