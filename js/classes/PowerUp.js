export class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.markedForDeletion = false;

        const types = ['TRIPLE', 'RAPID', 'SHIELD', 'NUKE'];
        this.type = types[Math.floor(Math.random() * types.length)];

        this.color = '#fff';
        if (this.type === 'TRIPLE') this.color = '#ff0';
        if (this.type === 'RAPID') this.color = '#f00';
        if (this.type === 'SHIELD') this.color = '#0ff';
        if (this.type === 'NUKE') this.color = '#0f0';
        if (this.type === 'MISSILE') this.color = '#f80';
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '?';
        if (this.type === 'TRIPLE') icon = 'T';
        if (this.type === 'RAPID') icon = 'R';
        if (this.type === 'SHIELD') icon = 'S';
        if (this.type === 'NUKE') icon = 'N';
        if (this.type === 'MISSILE') icon = 'M';
        ctx.fillText(icon, 0, 2);

        ctx.restore();
    }

    update(playerX, playerY, range = 150) {
        // Magnet Effect
        if (playerX !== undefined && playerY !== undefined) {
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (dist < range) { // Magnet Range
                this.x += (playerX - this.x) * 0.05;
                this.y += (playerY - this.y) * 0.05;
            }
        }

        // Need canvas height for bounds check
        if (this.y > window.innerHeight) this.markedForDeletion = true;
        this.y += this.speed;
    }
}
