import { Projectile } from './Projectile.js';
import { HangarManager } from '../managers/HangarManager.js';
import { SupportDrone } from './SupportDrone.js';
import { sounds } from '../managers/SoundManager.js';
import { AssetManager } from '../managers/AssetManager.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 140; // Widened for a more aggressive look
        this.height = 100;
        this.skinIndex = HangarManager.activeSkin;
        this.color = HangarManager.skins[this.skinIndex].color;
        this.vx = 0;
        this.vy = 0;
        this.lastShot = 0;
        this.weaponLevel = 1;
        this.powerUp = null;
        this.powerUpTimer = 0;
        this.powerUpDuration = 5000;
        this.shield = false;
        this.bankAngle = 0; // Tilting effect
        this.tiltSpeed = 0.1;
        this.maxTilt = 0.5;

        // Load Upgrades
        HangarManager.init();
        this.missileCount = HangarManager.getStat('missileCap', 10);
        this.critChance = HangarManager.getStat('critChance', 0);
        this.magnetRange = HangarManager.getStat('magnetRange', 150);
        this.droneLevel = HangarManager.getStat('droneLevel', 0);
        this.lastMissileTime = 0;
        this.muzzleFlashTimer = 0;
        this.muzzleFlashSize = 0;

        // Drones
        this.drones = [];
        for (let i = 0; i < this.droneLevel; i++) {
            this.drones.push(new SupportDrone(this, i, this.droneLevel));
        }

        // Configuration
        this.gameConfig = {
            FRICTION: 0.95,
            ACCELERATION: 0.8,
            MAX_SPEED: HangarManager.getStat('maxSpeed', 10),
            BULLET_SPEED: 15,
            FIRE_RATE: HangarManager.getStat('fireRate', 150),
            MISSILE_FIRE_RATE: 500
        };
    }

    draw(ctx, keys) {
        const skin = HangarManager.skins[this.skinIndex];
        const spriteKey = skin ? skin.spriteKey : 'playerShips1';
        const sprite = AssetManager.get(spriteKey);
        
        // Calculate display dimensions to maintain aspect ratio
        let renderWidth = this.width;
        let renderHeight = this.height;
        
        if (sprite) {
            const aspectRatio = sprite.width / sprite.height;
            renderHeight = renderWidth / aspectRatio;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.bankAngle);

        // --- Muzzle Flash ---
        if (this.muzzleFlashTimer > 0) {
            ctx.fillStyle = (Math.random() > 0.5) ? '#fff' : '#0ff';
            ctx.beginPath();
            // Align with front of ship
            ctx.arc(0, -renderHeight * 0.6, this.muzzleFlashSize * (this.muzzleFlashTimer / 4), 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            ctx.beginPath();
            ctx.arc(0, -renderHeight * 0.6, this.muzzleFlashSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // --- Exhaust / Afterburner ---
        if (keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || keys['Enter'] || keys['KeyQ']) {
            ctx.fillStyle = (Math.random() > 0.5) ? '#f30' : '#f80'; // Orange/Red for jets
            const flameSize = Math.random() * 15 + 25;
            
            const drawJet = (ox) => {
                ctx.beginPath();
                ctx.moveTo(ox - 10, renderHeight * 0.3);
                ctx.lineTo(ox, renderHeight * 0.3 + flameSize);
                ctx.lineTo(ox + 10, renderHeight * 0.3);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(ox - 5, renderHeight * 0.3);
                ctx.lineTo(ox, renderHeight * 0.3 + flameSize * 0.6);
                ctx.lineTo(ox + 5, renderHeight * 0.3);
                ctx.fill();
            };

            // Double jet engines
            drawJet(-renderWidth * 0.2);
            drawJet(renderWidth * 0.2);
        }

        // --- Shield ---
        if (this.shield) {
            ctx.beginPath();
            ctx.arc(0, 0, renderWidth * 0.55, 0, Math.PI * 2);
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.fill();
        }

        // --- Sprite Rendering ---
        if (sprite) {
            ctx.drawImage(
                sprite,
                -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight
            );
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -renderHeight / 2);
            ctx.lineTo(-renderWidth / 2, renderHeight / 2);
            ctx.lineTo(renderWidth / 2, renderHeight / 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw Drones
        this.drones.forEach(d => d.draw(ctx));
    }

    update(deltaTime, keys, canvasWidth, canvasHeight, projectilePool, enemies, timestamp) {
        // Update Drones
        this.drones.forEach(d => d.update(timestamp || Date.now(), projectilePool, enemies || []));
        if (this.powerUp) {
            this.powerUpTimer += deltaTime;
            if (this.powerUpTimer > this.powerUpDuration) {
                this.powerUp = null;
                this.powerUpTimer = 0;
            }
        }

        if (keys['ArrowLeft'] || keys['KeyA']) this.vx -= this.gameConfig.ACCELERATION;
        if (keys['ArrowRight'] || keys['KeyD']) this.vx += this.gameConfig.ACCELERATION;
        if (keys['ArrowUp'] || keys['KeyW']) this.vy -= this.gameConfig.ACCELERATION;
        if (keys['ArrowDown'] || keys['KeyS']) this.vy += this.gameConfig.ACCELERATION;

        this.vx *= this.gameConfig.FRICTION;
        this.vy *= this.gameConfig.FRICTION;

        // Banking logic
        const targetTilt = (this.vx / this.gameConfig.MAX_SPEED) * this.maxTilt;
        this.bankAngle += (targetTilt - this.bankAngle) * this.tiltSpeed;

        this.x += this.vx;
        this.y += this.vy;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > canvasWidth) this.x = canvasWidth;
        if (this.y < 0) this.y = 0;
        if (this.y > canvasHeight) this.y = canvasHeight;

        // Flash timer
        if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer--;

        // Shooting
        if (keys['Space'] || keys['Enter']) {
            const now = Date.now();
            let currentFireRate = this.gameConfig.FIRE_RATE;
            if (this.powerUp === 'RAPID') currentFireRate = 75;

            if (now - this.lastShot > currentFireRate) {
                this.shoot(projectilePool);
                this.lastShot = now;
            }
        }

        // Missile Launch (Q Key)
        if (keys['KeyQ'] && this.missileCount > 0) {
            const now = Date.now();
            if (now - this.lastMissileTime > this.gameConfig.MISSILE_FIRE_RATE) {
                this.launchMissile(window.enemiesList, projectilePool); // Assume global or shared list
                this.lastMissileTime = now;
            }
        }
    }

    launchMissile(enemies, projectilePool) {
        if (this.missileCount <= 0) return;

        // Find nearest enemy
        let nearest = null;
        let minDist = Infinity;
        enemies.forEach(e => {
            if (e.markedForDeletion) return;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        });

        // Launch Missile
        const missile = projectilePool.get(this.x, this.y - this.height / 2, 0, -5, '#f30', 'missile');
        if (missile) {
            missile.target = nearest;
            this.missileCount--;
            this.muzzleFlashTimer = 6;
            this.muzzleFlashSize = 15;
        }
    }

    shoot(projectilePool) {
        if (sounds) sounds.playShoot();
        const startX = this.x;
        const startY = this.y - this.height / 2;
        this.muzzleFlashTimer = 4;
        this.muzzleFlashSize = 10;

        const isCrit = Math.random() < this.critChance;
        const bulletColor = isCrit ? '#f0f' : '#ff0';

        if (this.weaponLevel === 1) {
            projectilePool.get(startX, startY, 0, -this.gameConfig.BULLET_SPEED, bulletColor, 'player');
        } else {
            const count = Math.min(this.weaponLevel, 5);
            const spread = 10;
            const center = Math.floor(count / 2);
            for (let i = 0; i < count; i++) {
                let offsetAngle = (i - center) * spread * (Math.PI / 180);
                let vx = Math.sin(offsetAngle) * this.gameConfig.BULLET_SPEED;
                let vy = -Math.cos(offsetAngle) * this.gameConfig.BULLET_SPEED;

                projectilePool.get(startX, startY, vx, vy, bulletColor, 'player');
            }
        }
    }

    activatePowerUp(type, onNuke) {
        if (sounds) sounds.playPowerUp();
        if (type === 'NUKE') {
            if (onNuke) onNuke();
        } else if (type === 'SHIELD') {
            this.shield = true;
        } else if (type === 'TRIPLE') {
            this.weaponLevel++;
        } else if (type === 'MISSILE') {
            this.missileCount += 3;
        } else {
            this.powerUp = type;
            this.powerUpTimer = 0;
        }
    }
}
