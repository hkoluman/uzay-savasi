export class Star {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * this.canvasHeight;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 2 + 0.5;
        this.brightness = Math.random();
        this.pulseDir = Math.random() > 0.5 ? 1 : -1;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;

        // Dynamic colors: Blueish, Reddish, Yellowish, White
        const colors = ['#fff', '#fff', '#fff', '#eef', '#fee', '#efe', '#ff0', '#0ff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];

        // Shooting star status
        this.isShootingStar = Math.random() < 0.005; // Rare
        if (this.isShootingStar) {
            this.speed = Math.random() * 15 + 10;
            this.size = Math.random() * 1 + 1;
            this.angle = Math.PI / 4 + (Math.random() * 0.2); // Diagonal
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.brightness;
        ctx.beginPath();

        if (this.isShootingStar) {
            // Draw a trail for shooting stars
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - Math.cos(this.angle) * 30, this.y - Math.sin(this.angle) * 30);
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    update() {
        if (this.isShootingStar) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            this.y += this.speed;

            // Twinkle effect
            this.brightness += this.pulseSpeed * this.pulseDir;
            if (this.brightness >= 1 || this.brightness <= 0.3) {
                this.pulseDir *= -1;
            }
        }

        if (this.y > this.canvasHeight || this.x > this.canvasWidth || this.x < 0) {
            this.reset();
            this.y = -20; // Start slightly above
        }
    }
}
