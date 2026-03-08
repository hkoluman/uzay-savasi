export const AssetManager = {
    images: {},
    loaded: false,
    
    config: {
        playerShips1: 'assets/player_ships1.png',
        playerShips2: 'assets/player_ships2.png',
        playerShips3: 'assets/player_ships3.png',
        playerShips4: 'assets/player_ships4.png',
        enemyShips: 'assets/enemy_ships.png',
        bossShip: 'assets/boss_ship.png',
    },

    load() {
        const promises = [];
        for (const [key, src] of Object.entries(this.config)) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: ${src}`);
                    reject();
                };
                img.src = src;
            }));
        }

        return Promise.all(promises).then(() => {
            this.loaded = true;
            console.log('All assets loaded.');
        });
    },

    get(key) {
        return this.images[key];
    }
};
