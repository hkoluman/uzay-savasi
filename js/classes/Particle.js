export class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.color = '#fff';
        this.vx = 0;
        this.vy = 0;
        this.alpha = 1;
        this.type = 'default'; // 'default', 'smoke', 'debris'
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.sizeScale = 1;
        this.markedForDeletion = false;
    }

    reset(x, y, color, type = 'default') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.alpha = 1;
        this.markedForDeletion = false;
        this.rotation = Math.random() * Math.PI * 2;
        this.sizeScale = 1;

        if (type === 'smoke') {
            this.radius = Math.random() * 5 + 2;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1 - 0.5; // Drift up/back
            this.rotationSpeed = 0;
        } else if (type === 'debris') {
            this.radius = Math.random() * 4 + 2;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        } else {
            this.radius = Math.random() * 3 + 1;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.rotationSpeed = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'debris') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.radius, -this.radius / 2, this.radius * 2, this.radius);
            // Add a little highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(-this.radius, -this.radius / 2, this.radius, 1);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * this.sizeScale, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.type === 'smoke') {
            this.alpha -= 0.01;
            this.sizeScale += 0.02; // Expand
        } else {
            this.alpha -= 0.02;
        }

        if (this.alpha <= 0) this.markedForDeletion = true;
    }
}
