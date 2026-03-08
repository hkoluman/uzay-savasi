import { Boss } from '../classes/Boss.js';
import { LanguageManager } from './LanguageManager.js';

export const WaveManager = {
    currentWave: 1,
    enemiesToSpawn: 10,
    enemiesSpawned: 0,
    bossSpawned: false,
    showBossMessage: false,
    boss: null,

    bossTriggered: false,
    missileDroppedInWave: false,

    reset() {
        this.currentWave = 1;
        this.enemiesToSpawn = 10;
        this.enemiesSpawned = 0;
        this.bossSpawned = false;
        this.bossTriggered = false;
        this.missileDroppedInWave = false;
        this.showBossMessage = false;
        this.boss = null;
    },

    getEnemyStats() {
        // Level increases every 5 waves (1-5: lvl 0, 6-10: lvl 1, etc.)
        const level = Math.floor((this.currentWave - 1) / 5);
        return {
            health: 1 + level,
            level: level
        };
    },

    update(activeEnemyCount, gameState, canvasWidth, onRefillMissiles) {
        if (!gameState.running) return;

        // Wave Completion Logic
        const isBossWave = this.currentWave % 5 === 0;

        if (isBossWave) {
            if (!this.bossSpawned && !this.bossTriggered) {
                this.spawnBoss(canvasWidth);
            }
        } else {
            if (this.enemiesSpawned >= this.enemiesToSpawn && activeEnemyCount === 0) {
                this.nextWave(onRefillMissiles);
            }
        }
    },

    spawnBoss(canvasWidth) {
        this.bossSpawned = true;
        this.bossTriggered = true;
        this.showBossMessage = true;
        this.boss = new Boss(canvasWidth, this.currentWave);
    },

    nextWave() {
        this.currentWave++;
        this.enemiesToSpawn += 5;
        this.enemiesSpawned = 0;
        this.bossTriggered = false; // Reset for next potential boss wave
        this.bossSpawned = false;   // Reset for next potential boss wave
        this.missileDroppedInWave = false;

        // Visual Notification
        const waveText = document.createElement('div');
        waveText.innerText = `${LanguageManager.get('wave')} ${this.currentWave}`;
        waveText.style.position = 'absolute';
        waveText.style.top = '50%';
        waveText.style.left = '50%';
        waveText.style.transform = 'translate(-50%, -50%)';
        waveText.style.color = '#fff';
        waveText.style.fontFamily = 'Arial';
        waveText.style.fontSize = '4rem';
        waveText.style.pointerEvents = 'none'; // Click through
        waveText.style.animation = 'fadeOut 3s forwards';

        // CSS Animation for fadeOut if not exists
        if (!document.getElementById('wave-style')) {
            const style = document.createElement('style');
            style.id = 'wave-style';
            style.innerHTML = `
                @keyframes fadeOut {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
                    10% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(waveText);
        setTimeout(() => waveText.remove(), 3000);
    },

    bossDefeated() {
        // Do NOT reset bossTriggered here, as it prevents another spawn in the same wave
        this.bossSpawned = false;
        this.showBossMessage = false;
        this.boss = null; // Ensure boss object is cleared

        // Trigger next wave after a delay
        setTimeout(() => {
            this.nextWave(() => {
                if (window.playerRef) window.playerRef.missileCount = 10;
            });
        }, 2000);
    }
};
