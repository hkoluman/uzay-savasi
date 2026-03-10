import { Projectile } from './Projectile.js';
import { AssetManager } from '../managers/AssetManager.js';

export class Enemy {
    constructor(x, y, stats = { health: 1, level: 0 }, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.width = 140; 
        this.height = 100;
        this.type = type; // NORMAL, KAMIKAZE, SNIPER, ADVANCED_FIGHTER, STRIKE_FIGHTER

        // Stats
        this.level = stats.level;
        this.health = stats.health;
        if (this.type === 'ADVANCED_FIGHTER') this.health = 4 + (this.level * 2);
        if (this.type === 'STRIKE_FIGHTER') this.health = 3 + (this.level * 1.5);
        this.maxHealth = this.health;

        // Base values
        this.speed = Math.random() * 2 + 1.5;
        if (this.type === 'KAMIKAZE') this.speed = 4 + (this.level * 0.5);
        if (this.type === 'SNIPER') this.speed = 1.8;
        if (this.type === 'ADVANCED_FIGHTER') this.speed = 2 + (this.level * 0.2);
        if (this.type === 'STRIKE_FIGHTER') this.speed = 2.5 + (this.level * 0.3);

        // Visual Elite Cycle (Every 6 waves)
        const currentWave = window.currentWaveNum || 1; // From main.js exposure
        const isCycle7 = currentWave < 6 || (Math.floor((currentWave - 6) / 6) % 2 !== 0);
        
        // Sprite Selection
        this.spriteKey = 'enemyShips';
        if (this.type === 'NORMAL' || this.type === 'ADVANCED_FIGHTER') {
            this.spriteKey = isCycle7 ? 'playerShips7' : 'playerShips8';
        } else if (this.type === 'STRIKE_FIGHTER') {
            this.spriteKey = 'playerShips8';
        } else if (this.type === 'KAMIKAZE') {
            this.spriteKey = 'playerShips9';
        }
        
        // Apply rotation / scale correction flag
        this.isCustomSprite = this.spriteKey.startsWith('playerShips');

        // Colors
        const levelColors = ['#f00', '#f90', '#90f', '#333'];
        this.color = levelColors[Math.min(this.level, levelColors.length - 1)];

        if (this.type === 'KAMIKAZE') this.color = '#ff0'; 
        if (this.type === 'SNIPER') this.color = '#0ff'; 
        if (this.type === 'ADVANCED_FIGHTER') this.color = '#f0f'; 
        if (this.type === 'STRIKE_FIGHTER') this.color = '#09f';

        this.markedForDeletion = false;
        this.canShoot = (this.type !== 'KAMIKAZE') && (Math.random() < 0.2 + (this.level * 0.05) || this.type === 'ADVANCED_FIGHTER' || this.type === 'STRIKE_FIGHTER');
        this.lastShot = performance.now();
        this.fireRate = Math.max(800, 2000 - (this.level * 200));
        
        if (this.type === 'SNIPER') this.fireRate = 1200;
        if (this.type === 'ADVANCED_FIGHTER') this.fireRate = 2000;
        if (this.type === 'STRIKE_FIGHTER') this.fireRate = 1000;

        this.burstCount = 0;
        this.isBursting = false;
        this.vx = (Math.random() - 0.5) * 4; 
        if (this.type === 'STRIKE_FIGHTER') this.vx = (Math.random() > 0.5 ? 5 : -5);
        
        this.spriteIndex = (this.type === 'KAMIKAZE') ? 1 : ((this.type === 'SNIPER') ? 2 : 0);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true; 
        }
        return false; 
    }

    draw(ctx) {
        const sprite = AssetManager.get(this.spriteKey);
        let renderWidth = this.width;
        let renderHeight = this.height;

        if (sprite && this.isCustomSprite) {
            const aspect = sprite.width / sprite.height;
            renderHeight = renderWidth / aspect;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        const tilt = Math.cos(Date.now() / 500) * 0.2;
        ctx.rotate(tilt + Math.PI); 

        // --- Thrusters ---
        ctx.fillStyle = (Math.random() > 0.5) ? this.color : '#fff';
        const flameSize = Math.random() * 5 + 10;
        ctx.beginPath();
        ctx.moveTo(-8, -renderHeight * 0.4);
        ctx.lineTo(0, -renderHeight * 0.4 - flameSize);
        ctx.lineTo(8, -renderHeight * 0.4);
        ctx.fill();

        // --- Sprite Rendering ---
        if (sprite) {
            if (this.isCustomSprite) {
                ctx.drawImage(sprite, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
            } else {
                const ix = (this.spriteIndex % 2) * 512;
                const iy = Math.floor(this.spriteIndex / 2) * 512;
                ctx.drawImage(
                    sprite,
                    ix, iy, 512, 512,
                    -this.width / 2, -this.height / 2, this.width, this.height
                );
            }
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, renderHeight * 0.5);
            ctx.lineTo(renderWidth * 0.2, 0);
            ctx.lineTo(renderWidth * 0.2, -renderHeight * 0.4);
            ctx.lineTo(-renderWidth * 0.2, -renderHeight * 0.4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    update(timestamp, projectilePool, playerX) {
        if (this.type === 'KAMIKAZE') {
            if (playerX !== undefined) {
                const dx = playerX - this.x;
                this.x += dx * 0.03;
            }
            this.y += this.speed;
        } else if (this.type === 'SNIPER') {
            if (this.y < 120) {
                this.y += this.speed;
            } else {
                this.x += this.vx;
                if (this.x < 50 || this.x > window.innerWidth - 50) this.vx *= -1;
            }
        } else if (this.type === 'ADVANCED_FIGHTER') {
            this.y += this.speed;
            this.x += Math.sin(timestamp / 1000) * 3;
        } else if (this.type === 'STRIKE_FIGHTER') {
            this.y += this.speed;
            this.x += this.vx;
            // High speed strafing boundaries
            if (this.x < 100 || this.x > window.innerWidth - 100) this.vx *= -1;
        } else {
            // NORMAL
            this.y += this.speed;
            this.x += Math.sin(timestamp / 500) * 2;
        }

        if (this.canShoot) {
            if (this.type === 'ADVANCED_FIGHTER') {
                if (!this.isBursting && timestamp - this.lastShot > this.fireRate) {
                    this.isBursting = true;
                    this.burstCount = 0;
                    this.lastBurstTime = 0;
                }

                if (this.isBursting) {
                    if (timestamp - this.lastBurstTime > 150) {
                        projectilePool.get(this.x, this.y, 0, 8, '#f0f', 'enemy');
                        this.burstCount++;
                        this.lastBurstTime = timestamp;
                        if (this.burstCount >= 3) {
                            this.isBursting = false;
                            this.lastShot = timestamp;
                        }
                    }
                }
            } else if (this.type === 'STRIKE_FIGHTER') {
                if (timestamp - this.lastShot > this.fireRate) {
                    // High-velocity railgun shot (Deep Blue)
                    projectilePool.get(this.x, this.y, 0, 12, '#0af', 'enemy');
                    this.lastShot = timestamp;
                }
            } else if (timestamp - this.lastShot > this.fireRate) {
                const bulletVy = this.type === 'SNIPER' ? 10 : 6;
                const bulletColor = this.type === 'SNIPER' ? '#0ff' : '#f00';
                projectilePool.get(this.x, this.y, 0, bulletVy, bulletColor, 'enemy');
                this.lastShot = timestamp;
            }
        }
    }
}
