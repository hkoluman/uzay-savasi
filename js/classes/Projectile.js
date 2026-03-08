export class Projectile {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4;
        this.color = '#ff0';
        this.markedForDeletion = false;
        this.type = 'player'; // 'player' or 'enemy'
    }

    // Reset method for Object Pooling
    reset(x, y, vx, vy, color = '#ff0', type = 'player') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.type = type;
        this.markedForDeletion = false;
        this.target = null; // Used for homing missiles
        this.timer = 0;     // Lifespan or animation timer
    }

    draw(ctx) {
        if (this.type === 'missile') {
            // Draw Missile
            ctx.save();
            ctx.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);

            // --- Shadow/Glow ---
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f30';

            // --- Missile Body (Larger) ---
            ctx.fillStyle = '#444'; // Steel grey
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;

            // Main fuselage
            ctx.beginPath();
            ctx.moveTo(12, 0);   // Nose tip
            ctx.lineTo(8, -4);   // Top nose
            ctx.lineTo(-12, -4); // Top body
            ctx.lineTo(-12, 4);  // Bottom body
            ctx.lineTo(8, 4);    // Bottom nose
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // --- Fins / Wings ---
            ctx.fillStyle = '#ff3300';
            // Back fins
            ctx.beginPath();
            ctx.moveTo(-12, -4);
            ctx.lineTo(-18, -8);
            ctx.lineTo(-12, -8);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-12, 4);
            ctx.lineTo(-18, 8);
            ctx.lineTo(-12, 8);
            ctx.closePath();
            ctx.fill();

            // --- Nose Cone ---
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(6, -4);
            ctx.lineTo(6, 4);
            ctx.closePath();
            ctx.fill();

            // --- Exhaust Flame ---
            const flameIntensity = Math.random();
            ctx.fillStyle = (flameIntensity > 0.5) ? '#ff0' : '#f00';
            ctx.beginPath();
            ctx.moveTo(-12, -2);
            ctx.lineTo(-25 - (flameIntensity * 10), 0);
            ctx.lineTo(-12, 2);
            ctx.fill();

            ctx.restore();
            ctx.shadowBlur = 0;
        } else {
            // Precise 2D Energy Bolt
            ctx.save();
            ctx.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);

            const isPlayer = this.type === 'player' || this.type === 'missile';
            const boltColor = isPlayer ? '#0ff' : '#f00'; // Cyan for player, Red for enemy

            // Outer Glow (Bloom)
            ctx.shadowBlur = 8;
            ctx.shadowColor = boltColor;

            // Bolt Shape (Tapered)
            ctx.fillStyle = boltColor;
            ctx.beginPath();
            ctx.moveTo(8, 0);       // Tip
            ctx.lineTo(-4, -2);    // Top back
            ctx.lineTo(-4, 2);     // Bottom back
            ctx.closePath();
            ctx.fill();

            // Inner White Core (Intensity)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-2, -1);
            ctx.lineTo(-2, 1);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }

    update(deltaTime) {
        if (this.type === 'missile' && this.target && !this.target.markedForDeletion) {
            // Homing logic: Rotate velocity towards target
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const angleToTarget = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.vy, this.vx);

            // Smoothly interpolate angle
            const turnSpeed = 0.15;
            let newAngle = currentAngle + (angleToTarget - currentAngle) * turnSpeed;

            const speed = Math.hypot(this.vx, this.vy);
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;

            // Emit smoke trail
            this.timer++;
            if (this.timer % 2 === 0 && window.particlePool) {
                window.particlePool.get(this.x - this.vx * 2, this.y - this.vy * 2, '#444', 'smoke');
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        const width = window.innerWidth;
        const height = window.innerHeight;

        if (this.y < -50 || this.y > height + 50 || this.x < -50 || this.x > width + 50) {
            this.markedForDeletion = true;
        }
    }
}
