import { Projectile } from './Projectile.js';
import { Enemy } from './Enemy.js';
import { AssetManager } from '../managers/AssetManager.js';

export class Boss {
    constructor(canvasWidth, wave = 5) {
        this.width = 350; // Bigger for sprites
        this.height = 250;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = -300;
        this.targetY = 100;

        // Scaling Logic
        const bossLevel = Math.max(1, Math.floor(wave / 5));
        this.health = 3000 * bossLevel;
        this.maxHealth = this.health;
        this.bulletCount = 5 + (bossLevel * 2);

        this.vx = 1.5;
        this.color = '#f00';
        this.markedForDeletion = false;
        this.phase = 'enter';
        this.lastShot = 0;
        this.canvasWidth = canvasWidth;

        // Reinforcement logic
        this.milestones = [0.8, 0.6, 0.4, 0.2];
        this.nextMilestoneIndex = 0;
        this.pendingReinforcements = false;
    }

    draw(ctx) {
        const sprite = AssetManager.get('bossShip');
        let renderWidth = this.width;
        let renderHeight = this.height;

        if (sprite) {
            const aspectRatio = sprite.width / sprite.height;
            renderHeight = renderWidth / aspectRatio;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Pulsating scale
        const pulse = 1 + Math.sin(Date.now() / 1000) * 0.05;
        ctx.scale(pulse, pulse);
        
        // Boss sprites usually face DOWN in modern asset packs. 
        // If it's facing UP, we rotate. I'll keep it facing DOWN.
        // ctx.rotate(Math.PI); // Only if PNG faces up. Let's try natural first.

        // --- Engines ---
        const drawEngine = (ex, ey, s = 1) => {
            ctx.fillStyle = (Math.random() > 0.5) ? '#f30' : '#f00';
            const flameSize = (Math.random() * 30 + 60) * s;
            ctx.beginPath();
            ctx.moveTo(ex - 25 * s, ey);
            ctx.lineTo(ex, ey - flameSize);
            ctx.lineTo(ex + 25 * s, ey);
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(ex - 12 * s, ey);
            ctx.lineTo(ex, ey - flameSize * 0.6);
            ctx.lineTo(ex + 12 * s, ey);
            ctx.fill();
        };

        // Aligning engines with the visual "rear" of a down-facing ship (top part)
        // Since we are not rotated now, "ey" should be negative to be at the top.
        drawEngine(-renderWidth * 0.25, -renderHeight * 0.4, 0.8);
        drawEngine(0, -renderHeight * 0.45, 1.2);
        drawEngine(renderWidth * 0.25, -renderHeight * 0.4, 0.8);

        // --- Sprite Rendering ---
        if (sprite) {
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#f00';
            ctx.drawImage(sprite, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
            ctx.shadowBlur = 0;
        } else {
            // Fallback
            ctx.fillStyle = '#222';
            ctx.fillRect(-renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
        }

        ctx.restore();

        // --- Health Bar ---
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; 
        ctx.fillRect(0, renderHeight + 30, this.width, 15);
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, renderHeight + 30, this.width * (this.health / this.maxHealth), 15);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, renderHeight + 30, this.width, 15);
        ctx.restore();
    }

    update(projectilePool, enemies) {
        if (this.phase === 'enter') {
            this.y += 2;
            if (this.y >= this.targetY) {
                this.phase = 'fight';
            }
        } else if (this.phase === 'fight') {
            this.x += this.vx;
            if (this.x <= 0 || this.x + this.width >= this.canvasWidth) {
                this.vx *= -1;
            }

            const now = Date.now();
            if (now - this.lastShot > 1200) {
                // Dynamic Multi-shot logic (Fan shape)
                const spread = 80; // Total pixel spread
                const count = this.bulletCount;
                for (let i = 0; i < count; i++) {
                    const relativePos = (i / (count - 1)) - 0.5; // -0.5 to 0.5
                    const offsetX = relativePos * spread;
                    const vx = relativePos * 4; // Spread speed
                    projectilePool.get(
                        this.x + this.width / 2 + offsetX,
                        this.y + this.height,
                        vx, 7, '#f00', 'enemy'
                    );
                }
                this.lastShot = now;
            }

            // Reinforcement Spawning
            if (this.pendingReinforcements) {
                this.spawnReinforcements(enemies);
                this.pendingReinforcements = false;
            }
        }
    }

    spawnReinforcements(enemies) {
        const count = 4;
        for (let i = 0; i < count; i++) {
            const rx = this.x + (this.width / count) * i + (this.width / (count * 2));
            const ry = this.y + this.height / 2;
            // Level 0 (1HP) mini fighters
            enemies.push(new Enemy(rx, ry, { health: 1, level: 0 }));
        }
    }

    takeDamage(amount, onDefeat) {
        if (this.markedForDeletion) return;

        this.health -= amount;

        // Milestone Check
        if (this.nextMilestoneIndex < this.milestones.length) {
            if (this.health / this.maxHealth <= this.milestones[this.nextMilestoneIndex]) {
                this.pendingReinforcements = true;
                this.nextMilestoneIndex++;
            }
        }

        if (this.health <= 0) {
            this.health = 0;
            this.markedForDeletion = true;
            if (onDefeat) onDefeat();
        }
    }
}
