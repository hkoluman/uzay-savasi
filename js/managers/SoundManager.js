export class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.15; // Lowered from 0.3
        this.enabled = localStorage.getItem('gameMuted') !== 'true';
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggleEnabled() {
        this.enabled = !this.enabled;
        localStorage.setItem('gameMuted', !this.enabled);
        return this.enabled;
    }

    playShoot() {
        if (!this.enabled) return;
        this.init();
        // Sine wave is much softer than square
        this.playTone(350, 80, 'sine', 0.15, 0.05);
    }

    playExplosion() {
        if (!this.enabled) return;
        this.init();
        const dur = 0.4;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Use triangle for a softer "thump"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        gain.gain.setValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    playTone(freq, durMs, type = 'sine', vol = 0.2, fadeOut = 0.05) {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (durMs / 1000));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + (durMs / 1000));
    }

    playPowerUp() {
        if (!this.enabled) return;
        this.init();
        this.playTone(500, 150, 'sine', 0.3);
        setTimeout(() => this.playTone(700, 150, 'sine', 0.3), 120);
    }
}

export const sounds = new SoundManager();
