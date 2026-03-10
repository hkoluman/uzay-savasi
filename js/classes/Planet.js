export class Planet {
    constructor(canvasWidth, canvasHeight) {
        this.reset(canvasWidth, canvasHeight, true);
    }

    reset(canvasWidth, canvasHeight, initial = false) {
        this.size = Math.random() * 150 + 100;
        this.x = Math.random() * canvasWidth;
        this.y = initial ? Math.random() * canvasHeight : -this.size * 2;
        this.speed = Math.random() * 0.2 + 0.1;

        // Random sophisticated color palettes
        const palettes = [
            { base: '#1a2a6c', secondary: '#b21f1f', accent: '#fdbb2d' }, // Sunset
            { base: '#000428', secondary: '#004e92', accent: '#00d2ff' }, // Deep Sea
            { base: '#4b6cb7', secondary: '#182848', accent: '#ffffff' }, // Ice Planet
            { base: '#5d26c1', secondary: '#a17fe0', accent: '#59c173' }  // Alien Life
        ];
        this.palette = palettes[Math.floor(Math.random() * palettes.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.001;

        // Pre-render to offscreen canvas
        this.offscreen = document.createElement('canvas');
        const buffer = this.size * 2.5;
        this.offscreen.width = buffer;
        this.offscreen.height = buffer;
        const octx = this.offscreen.getContext('2d');
        const center = buffer / 2;

        octx.translate(center, center);

        // Core shadow/body
        const grad = octx.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, this.size * 0.1,
            0, 0, this.size
        );
        grad.addColorStop(0, this.palette.accent);
        grad.addColorStop(0.4, this.palette.secondary);
        grad.addColorStop(1, this.palette.base);

        octx.fillStyle = grad;
        octx.beginPath();
        octx.arc(0, 0, this.size, 0, Math.PI * 2);
        octx.fill();

        // Atmospheric glow
        const glow = octx.createRadialGradient(0, 0, this.size * 0.8, 0, 0, this.size * 1.2);
        glow.addColorStop(0, 'transparent');
        glow.addColorStop(0.8, this.palette.secondary + '33');
        glow.addColorStop(1, 'transparent');

        octx.fillStyle = glow;
        octx.beginPath();
        octx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
        octx.fill();

        // Subtle craters or surface details
        octx.globalAlpha = 0.2;
        octx.fillStyle = '#000';
        for (let i = 0; i < 5; i++) {
            const cx = Math.sin(i * 137.5) * this.size * 0.5;
            const cy = Math.cos(i * 137.5) * this.size * 0.5;
            const cs = Math.random() * 20 + 10;
            octx.beginPath();
            octx.arc(cx, cy, cs, 0, Math.PI * 2);
            octx.fill();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.offscreen, -this.offscreen.width / 2, -this.offscreen.height / 2);
        ctx.restore();
    }

    update(canvasWidth, canvasHeight) {
        this.y += this.speed;
        this.angle += this.rotationSpeed;
        if (this.y - this.size > canvasHeight) {
            this.reset(canvasWidth, canvasHeight);
        }
    }
}
