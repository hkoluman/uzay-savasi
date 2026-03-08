export class SupportDrone {
    constructor(player, orbitIndex, totalDrones) {
        this.player = player;
        this.orbitIndex = orbitIndex;
        this.totalDrones = totalDrones;
        this.angle = 0; // Relative orbit angle
        this.orbitRadius = 60;
        this.x = 0;
        this.y = 0;
        this.width = 15;
        this.height = 15;
        this.color = '#0ff';
        this.lastShot = 0;
        this.fireRate = 800;
    }

    update(timestamp, projectilePool, enemies) {
        // Orbit logic
        this.angle += 0.05;
        const phase = (this.orbitIndex / this.totalDrones) * Math.PI * 2;
        this.x = this.player.x + Math.cos(this.angle + phase) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.angle + phase) * this.orbitRadius;

        // Auto-shoot logic
        const now = timestamp;
        if (now - this.lastShot > this.fireRate) {
            const nearestEnemy = this.findNearestEnemy(enemies);
            if (nearestEnemy) {
                const angleToEnemy = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const vx = Math.cos(angleToEnemy) * 10;
                const vy = Math.sin(angleToEnemy) * 10;

                projectilePool.get(this.x, this.y, vx, vy, '#0ff', 'player');
                this.lastShot = now;
            }
        }
    }

    findNearestEnemy(enemies) {
        let minDist = 500;
        let nearest = null;
        enemies.forEach(e => {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });
        return nearest;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Neon Drone Shape
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Small triangle/diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Eye/Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
