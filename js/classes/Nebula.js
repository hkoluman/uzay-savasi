export class Nebula {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        // Initial random Y so they aren't all at top
        this.y = Math.random() * this.canvasHeight;
    }

    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = -400; // Start far above
        this.size = Math.random() * 300 + 200;
        this.speed = Math.random() * 0.3 + 0.1; // Very slow
        this.opacity = Math.random() * 0.1 + 0.05; // Near transparent

        // Cosmic colors
        const colors = [
            'rgba(100, 0, 255,', // Purple
            'rgba(0, 100, 255,', // Blue
            'rgba(255, 0, 100,', // Pink
            'rgba(0, 255, 150,'  // Teal
        ];
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
    }

    draw(ctx) {
        ctx.save();
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, this.baseColor + this.opacity + ')');
        gradient.addColorStop(1, this.baseColor + '0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        if (this.y - this.size > this.canvasHeight) {
            this.reset();
        }
    }
}
