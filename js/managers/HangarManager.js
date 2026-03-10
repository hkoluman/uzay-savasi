export const HangarManager = {
    credits: 0,
    activeSkin: 0,
    ownedSkins: [0],
    upgrades: {
        fireRate: 0,    // Level 0 to 5
        maxSpeed: 0,    // Level 0 to 5
        hullStrength: 0, // Level 0 to 5
        missileCap: 0,   // Level 0 to 5
        critChance: 0,   // Level 0 to 5
        magnetRange: 0,  // Level 0 to 5
        droneLevel: 0    // Level 0 to 5
    },

    skins: [
        { name: 'skin_default', cost: 0, color: '#0ff', spriteKey: 'playerShips1' },
        { name: 'skin_custom', cost: 500, color: '#f00', spriteKey: 'playerShips2' },
        { name: 'skin_grey', cost: 1000, color: '#aaa', spriteKey: 'playerShips4' },
        { name: 'skin_yellow', cost: 2000, color: '#ff0', spriteKey: 'playerShips3' },
        { name: 'skin_boss', cost: 5000, color: '#f00', spriteKey: 'bossShip' },
        { name: 'skin_gold', cost: 10000, color: '#ffd700' },
        { name: 'skin_ghost', cost: 25000, color: '#555' }
    ],

    costs: {
        fireRate: [5, 25, 100, 500, 2000],
        maxSpeed: [5, 25, 100, 500, 2000],
        hullStrength: [5, 25, 100, 500, 2000],
        missileCap: [5, 25, 100, 500, 2000],
        critChance: [10, 50, 250, 1000, 5000],
        magnetRange: [5, 25, 100, 500, 2000],
        droneLevel: [50, 200, 800, 3000, 10000]
    },

    init() {
        console.log('Initializing HangarManager...');
        const savedCredits = localStorage.getItem('neonSpaceShooter_credits');
        const savedUpgrades = localStorage.getItem('neonSpaceShooter_upgrades');
        const savedSkins = localStorage.getItem('neonSpaceShooter_ownedSkins');
        const savedActiveSkin = localStorage.getItem('neonSpaceShooter_activeSkin');

        if (savedCredits) this.credits = parseInt(savedCredits);
        if (savedActiveSkin) this.activeSkin = parseInt(savedActiveSkin);
        
        try {
            if (savedSkins) {
                this.ownedSkins = JSON.parse(savedSkins);
                if (!Array.isArray(this.ownedSkins)) this.ownedSkins = [0];
            }
        } catch (e) {
            console.error('Failed to parse ownedSkins, resetting:', e);
            this.ownedSkins = [0];
        }

        try {
            if (savedUpgrades) {
                const parsed = JSON.parse(savedUpgrades);
                this.upgrades = Object.assign({}, this.upgrades, parsed);
            }
        } catch (e) {
            console.error('Failed to parse upgrades, resetting:', e);
        }

        console.log('HangarManager initialized.');
        
        // Setup debounced save
        this._saveTimeout = null;
    },

    requestSave() {
        if (this._saveTimeout) return;
        this._saveTimeout = setTimeout(() => {
            this.save();
            this._saveTimeout = null;
        }, 2000); // Save at most every 2 seconds
    },

    save() {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = null;
        }
        localStorage.setItem('neonSpaceShooter_credits', this.credits);
        localStorage.setItem('neonSpaceShooter_upgrades', JSON.stringify(this.upgrades));
        localStorage.setItem('neonSpaceShooter_ownedSkins', JSON.stringify(this.ownedSkins));
        localStorage.setItem('neonSpaceShooter_activeSkin', this.activeSkin);
    },

    addCredits(amount) {
        this.credits += Math.floor(amount / 10); // 10 score = 1 credit
        this.requestSave();
    },

    upgrade(type) {
        const currentLevel = this.upgrades[type];
        if (currentLevel >= 5) return false;

        const cost = this.costs[type][currentLevel];
        if (this.credits >= cost) {
            this.credits -= cost;
            this.upgrades[type]++;
            this.save(); // Immediate save for purchases
            return true;
        }
        return false;
    },

    getStat(type, baseValue) {
        const level = this.upgrades[type];
        switch (type) {
            case 'fireRate':
                // Lower is faster (150 -> 140 -> 130...)
                return baseValue - (level * 15);
            case 'maxSpeed':
                return baseValue + (level * 1.5);
            case 'hullStrength':
                return baseValue + (level * 20); // Base hull repair or max health
            case 'missileCap':
                return baseValue + (level * 5); // Start with more missiles
            case 'critChance':
                return level * 0.05; // 0% to 25% chance
            case 'magnetRange':
                return baseValue + (level * 50); // 150 to 400 range
            case 'droneLevel':
                return level; // Drone count or power level
            default:
                return baseValue;
        }
    },

    buySkin(index) {
        if (this.ownedSkins.includes(index)) return false;
        const cost = this.skins[index].cost;
        if (this.credits >= cost) {
            this.credits -= cost;
            this.ownedSkins.push(index);
            this.save();
            return true;
        }
        return false;
    },

    selectSkin(index) {
        if (this.ownedSkins.includes(index)) {
            this.activeSkin = index;
            this.save();
            return true;
        }
        return false;
    }
};
