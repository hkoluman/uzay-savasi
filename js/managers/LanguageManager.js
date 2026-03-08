export const LanguageManager = {
    currentLanguage: localStorage.getItem('neonSpaceShooter_lang') || 'tr',
    
    translations: {
        tr: {
            // UI General
            'score': 'SKOR',
            'high_score': 'REKOR',
            'start_title': 'NEON UZAY SAVAŞI',
            'start_prompt': 'Başlamak için Tıkla veya <span class="blink">SPACE</span> tuşuna bas',
            'game_over': 'OYUN BİTTİ',
            'final_score': 'Son Skor',
            'restart': 'TEKRAR OYNA',
            'hangar': 'HANGAR 🔧',
            'back_to_battle': 'SAVAŞA DÖN',
            'boss_coming': 'BOSS GELİYOR!',
            
            // Hangar Titles
            'hangar_title': 'UÇAK HANGARI',
            'credits': 'KREDİ',
            'upgrades': 'GELİŞTİRMELER',
            'skins': 'GÖRÜNÜM (SKINLER)',
            
            // Upgrade Names
            'upgrade_fireRate': 'ATIŞ HIZI',
            'upgrade_maxSpeed': 'MOTOR GÜCÜ',
            'upgrade_hullStrength': 'ZIRH KAPLAMA',
            'upgrade_missileCap': 'ROKET KAPASİTESİ',
            'upgrade_critChance': 'KRİTİK VURUŞ',
            'upgrade_magnetRange': 'MAGNET MENZİLİ',
            'upgrade_droneLevel': 'YARDIMCI DRONE',
            
            // Upgrade Descriptions
            'desc_fireRate': 'Mermiler daha seri çıkar',
            'desc_maxSpeed': 'Uçuş hızı artar',
            'desc_hullStrength': 'Üs dayanıklılığı artar',
            'desc_missileCap': 'Başlangıç mühimmatı artar',
            'desc_critChance': '%5 şansla x2 Hasar',
            'desc_magnetRange': 'Eşyaları uzaktan çeker',
            'desc_droneLevel': 'Otomatik ateş eden robot',
            
            // Hangar Controls
            'level': 'LVL',
            'max': 'MAX',
            'upgrade_btn': 'GELİŞTİR',
            'owned': 'SAHİP',
            'active': 'AKTİF',
            'select': 'SEÇ',
            'buy': 'SATIN AL',
            
            // Skins
            'skin_default': 'Mavi (Varsayılan)',
            'skin_custom': 'İkinci Kostüm',
            'skin_grey': 'Üçüncü Kostüm (Gri)',
            'skin_yellow': 'Dördüncü Kostüm (Sarı)',
            'skin_boss': 'Ulu Boss Gemisi',
            'skin_gold': 'Altın Kartal',
            'skin_ghost': 'Hayalet',
            
            // In-game
            'wave': 'DALGA',
            'rocket': 'ROKET (Q)',
            'objects': 'Objeler'
        },
        en: {
            // UI General
            'score': 'SCORE',
            'high_score': 'RECORD',
            'start_title': 'NEON SPACE WAR',
            'start_prompt': 'Click to Start or press <span class="blink">SPACE</span>',
            'game_over': 'GAME OVER',
            'final_score': 'Final Score',
            'restart': 'PLAY AGAIN',
            'hangar': 'HANGAR 🔧',
            'back_to_battle': 'BACK TO BATTLE',
            'boss_coming': 'BOSS IS COMING!',
            
            // Hangar Titles
            'hangar_title': 'AIRCRAFT HANGAR',
            'credits': 'CREDITS',
            'upgrades': 'UPGRADES',
            'skins': 'SKINS',
            
            // Upgrade Names
            'upgrade_fireRate': 'FIRE RATE',
            'upgrade_maxSpeed': 'ENGINE POWER',
            'upgrade_hullStrength': 'HULL ARMOR',
            'upgrade_missileCap': 'MISSILE CAPACITY',
            'upgrade_critChance': 'CRITICAL HIT',
            'upgrade_magnetRange': 'MAGNET RANGE',
            'upgrade_droneLevel': 'SUPPORT DRONE',
            
            // Upgrade Descriptions
            'desc_fireRate': 'Faster projectile firing',
            'desc_maxSpeed': 'Increases flight speed',
            'desc_hullStrength': 'Increases base durability',
            'desc_missileCap': 'More starting ammo',
            'desc_critChance': '5% chance for x2 Damage',
            'desc_magnetRange': 'Pulls items from afar',
            'desc_droneLevel': 'Auto-firing robot',
            
            // Hangar Controls
            'level': 'LVL',
            'max': 'MAX',
            'upgrade_btn': 'UPGRADE',
            'owned': 'OWNED',
            'active': 'ACTIVE',
            'select': 'SELECT',
            'buy': 'BUY',
            
            // Skins
            'skin_default': 'Blue (Default)',
            'skin_custom': 'Second Skin',
            'skin_grey': 'Third Skin (Grey)',
            'skin_yellow': 'Fourth Skin (Yellow)',
            'skin_boss': 'Ultimate Boss Ship',
            'skin_gold': 'Golden Eagle',
            'skin_ghost': 'Ghost',
            
            // In-game
            'wave': 'WAVE',
            'rocket': 'ROCKET (Q)',
            'objects': 'Objects'
        }
    },

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('neonSpaceShooter_lang', lang);
            this.updateUI();
        }
    },

    get(key) {
        return this.translations[this.currentLanguage][key] || key;
    },

    updateUI() {
        // Elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.innerHTML = this.get(key);
        });

        // Specific complex updates
        const startPrompt = document.querySelector('#start-screen p');
        if (startPrompt) {
            startPrompt.innerHTML = this.get('start_prompt');
        }
        
        // Update language buttons active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
        });
    }
};
