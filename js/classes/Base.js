import { HangarManager } from '../managers/HangarManager.js';

export class Base {
    constructor(canvasWidth, canvasHeight, gameOverCallback) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gameOverCallback = gameOverCallback;

        this.height = 15;

        // Hangar Upgrades
        HangarManager.init();
        this.maxHealth = HangarManager.getStat('hullStrength', 100);
        this.health = this.maxHealth;
        this.color = '#0ff';
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.fillRect(0, this.canvasHeight - this.height, this.canvasWidth, this.height);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * healthPercent})`;
        if (this.health < 30) ctx.fillStyle = `rgba(255, 0, 0, 0.2)`;

        if (this.health > 0) {
            ctx.fillRect(50, this.canvasHeight - 50, 40, 50);
            ctx.fillRect(150, this.canvasHeight - 80, 60, 80);
            ctx.fillRect(this.canvasWidth - 200, this.canvasHeight - 60, 50, 60);
            ctx.fillRect(this.canvasWidth - 100, this.canvasHeight - 40, 30, 40);
            ctx.fillRect(this.canvasWidth / 2 - 50, this.canvasHeight - 70, 100, 70);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`ÜS SAĞLIĞI: %${Math.max(0, this.health)}`, 20, this.canvasHeight - 30);

        ctx.fillStyle = '#333';
        ctx.fillRect(200, this.canvasHeight - 45, 200, 20);
        ctx.fillStyle = this.health > 50 ? '#0f0' : '#f00';
        ctx.fillRect(200, this.canvasHeight - 45, 200 * healthPercent, 20);

        ctx.restore();
    }

    takeDamage(amount, onShake) {
        this.health -= amount;
        this.color = '#f00';
        setTimeout(() => this.color = '#0ff', 100);
        if (onShake) onShake(10);

        if (this.health <= 0) {
            if (this.gameOverCallback) this.gameOverCallback();
        }
    }

    repair(percent) {
        const amount = this.maxHealth * (percent / 100);
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        // Visual feedback for repair
        this.color = '#0f0';
        setTimeout(() => this.color = '#0ff', 200);
    }
}
