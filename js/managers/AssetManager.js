export const AssetManager = {
    images: {},
    loaded: false,
    
    config: {
        playerShips1: 'assets/player_ships1.png',
        playerShips2: 'assets/player_ships2.png',
        playerShips3: 'assets/player_ships3.png',
        playerShips4: 'assets/player_ships4.png',
        enemyShips: 'assets/enemy_ships.png',
        playerShips7: 'assets/player_ships7.png',
        playerShips8: 'assets/player_ships8.png',
        playerShips9: 'assets/player_ships9.png',
        bossShip: 'assets/boss_ship.png',
    },

    load() {
        const promises = [];
        console.log('Starting to load assets...');
        for (const [key, src] of Object.entries(this.config)) {
            promises.push(new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    console.log(`Loaded: ${key}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`ERROR: Failed to load asset: ${src}`);
                    // Resolve anyway to prevent game from hanging
                    resolve();
                };
                img.src = src;
            }));
        }

        return Promise.all(promises).then(() => {
            this.loaded = true;
            console.log('Finished loading attempts for all assets.');
        });
    },

    get(key) {
        return this.images[key];
    }
};
