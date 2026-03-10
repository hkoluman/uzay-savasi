export class MissionManager {
    constructor() {
        this.missions = [
            { id: 'kill_10', title_tr: '10 Düşman Avla', title_en: 'Hunt 10 Enemies', type: 'kill', target: 10, progress: 0, reward: 50, completed: false },
            { id: 'kill_kamikaze', title_tr: '3 Kamikaze Yok Et', title_en: 'Destroy 3 Kamikazes', type: 'kill_type', targetType: 'KAMIKAZE', target: 3, progress: 0, reward: 100, completed: false },
            { id: 'no_damage', title_tr: 'Hasar Almadan Dalga Geç', title_en: 'Clear Wave No Damage', type: 'no_damage', target: 1, progress: 0, reward: 150, completed: false },
            { id: 'score_1000', title_tr: '1000 Skor Yap', title_en: 'Reach 1000 Score', type: 'score', target: 1000, progress: 0, reward: 80, completed: false }
        ];
        this.activeMissions = [];
        this.completedToday = JSON.parse(localStorage.getItem('completedMissions') || '[]');
    }

    init() {
        // Pick 2-3 random missions that aren't completed "today" 
        // For simplicity, we just pick 3 for now
        this.activeMissions = this.missions.slice(0, 3).map(m => ({...m}));
    }

    updateProgress(type, data) {
        let changed = false;
        this.activeMissions.forEach((m, index) => {
            if (m.completed) return;

            if (m.type === type) {
                if (type === 'kill') { m.progress++; changed = true; }
                if (type === 'kill_type' && data.enemyType === m.targetType) { m.progress++; changed = true; }
                if (type === 'score' && m.progress !== data.score) { m.progress = data.score; changed = true; }
                if (type === 'no_damage' && data.waveCleared && !data.tookDamage) { m.progress++; changed = true; }

                if (m.progress >= m.target) {
                    this.completeMission(m);
                    changed = true;
                }
                
                if (changed) this.updateMissionItem(index);
            }
        });
    }

    completeMission(mission) {
        mission.completed = true;
        if (window.addCredits) window.addCredits(mission.reward);
        this.showToast(mission.title_tr + " TAMAMLANDI! +" + mission.reward + " Kredi");
    }

    updateUI() {
        const container = document.getElementById('mission-list');
        if (!container) return;

        const lang = localStorage.getItem('gameLanguage') || 'tr';
        container.innerHTML = this.activeMissions.map((m, i) => `
            <div id="mission-${i}" class="mission-item ${m.completed ? 'completed' : ''}">
                <div class="mission-title">${lang === 'tr' ? m.title_tr : m.title_en}</div>
                <div class="mission-bar">
                    <div class="mission-fill" style="width: ${(m.progress / m.target) * 100}%"></div>
                </div>
                <div class="mission-status">${Math.min(m.progress, m.target)}/${m.target}</div>
            </div>
        `).join('');
        
        // Cache references
        this._missionNodes = this.activeMissions.map((_, i) => ({
            fill: container.querySelector(`#mission-${i} .mission-fill`),
            status: container.querySelector(`#mission-${i} .mission-status`),
            root: container.querySelector(`#mission-${i}`)
        }));
    }

    updateMissionItem(index) {
        if (!this._missionNodes || !this._missionNodes[index]) return;
        const m = this.activeMissions[index];
        const nodes = this._missionNodes[index];
        
        const pct = Math.min((m.progress / m.target) * 100, 100);
        nodes.fill.style.width = pct + '%';
        nodes.status.innerText = `${Math.min(m.progress, m.target)}/${m.target}`;
        
        if (m.completed) nodes.root.classList.add('completed');
    }

    showToast(text) {
        const toast = document.createElement('div');
        toast.className = 'mission-toast';
        toast.innerText = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

export const Missions = new MissionManager();
