export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
        this.enabled = true;
    }

    // Play a simple synthesized beep for shooting
    playShoot() {
        if (!this.enabled) return;
        this.playTone(400, 100, 'square', 0.1, 0.01);
    }

    // Play an explosion sound (noise)
    playExplosion() {
        if (!this.enabled) return;
        const dur = 0.3;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    playTone(freq, durMs, type = 'sine', vol = 0.2, fadeOut = 0.05) {
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
        this.playTone(600, 100, 'sine', 0.5);
        setTimeout(() => this.playTone(800, 100, 'sine', 0.5), 100);
        setTimeout(() => this.playTone(1000, 200, 'sine', 0.5), 200);
    }
}

export const sounds = new SoundManager();
