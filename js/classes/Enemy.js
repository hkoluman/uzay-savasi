import { Projectile } from './Projectile.js';
import { AssetManager } from '../managers/AssetManager.js';

export class Enemy {
    constructor(x, y, stats = { health: 1, level: 0 }, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.width = 50; // Slightly larger for sprites
        this.height = 50;
        this.type = type; // NORMAL, KAMIKAZE, SNIPER

        // Stats
        this.level = stats.level;
        this.health = stats.health;
        this.maxHealth = stats.health;

        // Base values
        this.speed = Math.random() * 2 + 1;
        if (this.type === 'KAMIKAZE') this.speed = 4 + (this.level * 0.5);
        if (this.type === 'SNIPER') this.speed = 1.5;

        // Level Colors
        const levelColors = ['#f00', '#f90', '#90f', '#333'];
        const wingColors = ['#611', '#641', '#416', '#111'];

        this.color = levelColors[Math.min(this.level, levelColors.length - 1)];
        this.wingColor = wingColors[Math.min(this.level, wingColors.length - 1)];

        // Special Colors for Types
        if (this.type === 'KAMIKAZE') this.color = '#ff0'; // Yellow flash
        if (this.type === 'SNIPER') this.color = '#0ff'; // Cyan tech

        this.markedForDeletion = false;
        this.canShoot = (this.type !== 'KAMIKAZE') && (Math.random() < 0.2 + (this.level * 0.05));
        this.lastShot = Date.now();
        this.fireRate = Math.max(800, 2000 - (this.level * 200));
        if (this.type === 'SNIPER') this.fireRate = 1200;

        // Sniper specific
        this.vx = (Math.random() - 0.5) * 4; // Side movement
        
        // Sprite mapping
        this.spriteIndex = 0;
        if (this.type === 'KAMIKAZE') this.spriteIndex = 1;
        if (this.type === 'SNIPER') this.spriteIndex = 2;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true; // Destroyed
        }
        return false; // Still alive
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Add slight tilt based on wobble
        const tilt = Math.cos(Date.now() / 500) * 0.2;
        ctx.rotate(tilt + Math.PI); // Face down (Most enemy sprites face up by default)

        // --- Thrusters ---
        // Since we are rotated 180 (Math.PI), "down" is now visually "up" on screen.
        // The rear of the ship (where engines are) is at the "top" of the rotated coordinate system.
        ctx.fillStyle = (Math.random() > 0.5) ? this.color : '#fff';
        const flameSize = Math.random() * 5 + 10;
        ctx.beginPath();
        ctx.moveTo(-8, -this.height * 0.4);
        ctx.lineTo(0, -this.height * 0.4 - flameSize);
        ctx.lineTo(8, -this.height * 0.4);
        ctx.fill();

        // --- Sprite Rendering ---
        const sprite = AssetManager.get('enemyShips');
        if (sprite) {
            const ix = (this.spriteIndex % 2) * 512;
            const iy = Math.floor(this.spriteIndex / 2) * 512;

            ctx.drawImage(
                sprite,
                ix, iy, 512, 512,
                -this.width / 2, -this.height / 2, this.width, this.height
            );
        } else {
            // Fallback
            ctx.fillStyle = this.wingColor;
            ctx.beginPath();
            ctx.moveTo(0, this.height * 0.5);
            ctx.lineTo(this.width * 0.2, 0);
            ctx.lineTo(this.width * 0.2, -this.height * 0.4);
            ctx.lineTo(-this.width * 0.2, -this.height * 0.4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    update(timestamp, projectilePool, playerX) {
        if (this.type === 'KAMIKAZE') {
            // Kamikaze: Fast dive towards player
            if (playerX !== undefined) {
                const dx = playerX - this.x;
                this.x += dx * 0.03;
            }
            this.y += this.speed;
        } else if (this.type === 'SNIPER') {
            // Sniper: Hover in top 30% of screen
            if (this.y < 120) {
                this.y += this.speed;
            } else {
                this.x += this.vx;
                if (this.x < 50 || this.x > window.innerWidth - 50) this.vx *= -1;
            }
        } else {
            // NORMAL
            this.y += this.speed;
            this.x += Math.sin(timestamp / 500) * 2;
        }

        if (this.canShoot) {
            if (timestamp - this.lastShot > this.fireRate) {
                const bulletVy = this.type === 'SNIPER' ? 10 : 6;
                const bulletColor = this.type === 'SNIPER' ? '#0ff' : '#f00';
                projectilePool.get(this.x, this.y, 0, bulletVy, bulletColor, 'enemy');
                this.lastShot = timestamp;
            }
        }
    }
}
