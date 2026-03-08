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
        this.activeMissions.forEach(m => {
            if (m.completed) return;

            if (m.type === type) {
                if (type === 'kill') m.progress++;
                if (type === 'kill_type' && data.enemyType === m.targetType) m.progress++;
                if (type === 'score') m.progress = data.score;
                if (type === 'no_damage' && data.waveCleared && !data.tookDamage) m.progress++;

                if (m.progress >= m.target) {
                    this.completeMission(m);
                }
            }
        });
        this.updateUI();
    }

    completeMission(mission) {
        mission.completed = true;
        // Credit reward logic will be integrated with HangarManager
        if (window.addCredits) window.addCredits(mission.reward);
        
        // Visual feedback
        this.showToast(mission.title_tr + " TAMAMLANDI! +" + mission.reward + " Kredi");
    }

    updateUI() {
        const container = document.getElementById('mission-list');
        if (!container) return;

        const lang = localStorage.getItem('gameLanguage') || 'tr';
        container.innerHTML = this.activeMissions.map(m => `
            <div class="mission-item ${m.completed ? 'completed' : ''}">
                <div class="mission-title">${lang === 'tr' ? m.title_tr : m.title_en}</div>
                <div class="mission-bar">
                    <div class="mission-fill" style="width: ${(m.progress / m.target) * 100}%"></div>
                </div>
                <div class="mission-status">${m.progress}/${m.target}</div>
            </div>
        `).join('');
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
