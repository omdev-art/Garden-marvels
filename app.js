let gameData = {
    gold: 150,
    essence: 30,
    fertility: 100,
    world: 1,
    sprinklers: 0,
    plots: [
        { id: 0, unlocked: true, state: 'empty', seed: null, growth: 0 },
        { id: 1, unlocked: true, state: 'empty', seed: null, growth: 0 },
        { id: 2, unlocked: false, state: 'locked', seed: null, growth: 0, cost: 120 },
        { id: 3, unlocked: false, state: 'locked', seed: null, growth: 0, cost: 300 },
        { id: 4, unlocked: false, state: 'locked', seed: null, growth: 0, cost: 600 }
    ],
    seeds: {
        sunflower: { name: 'Sunflower', count: 8, time: 10, reward: 25, icon: '🌻', world: 1 },
        moonbloom: { name: 'Moonbloom', count: 3, time: 20, reward: 60, icon: '🌙', world: 1 },
        stellaris: { name: 'Stellaris Crystal', count: 0, time: 15, reward: 180, icon: '💎', world: 2 },
        voidsprout: { name: 'Void Sprout', count: 0, time: 25, reward: 450, icon: '🌌', world: 2 }
    },
    merchantStock: [
        { id: 'sunflower', name: 'Sunflower Seeds (x5)', cost: 40, type: 'seed', key: 'sunflower', qty: 5 },
        { id: 'moonbloom', name: 'Moonbloom Seeds (x3)', cost: 90, type: 'seed', key: 'moonbloom', qty: 3 },
        { id: 'antiRot', name: 'Anti-Rot Spray', cost: 30, type: 'item', key: 'antiRot', qty: 1 }
    ],
    pets: [
        { id: 'fox', name: 'Verdant Fox', icon: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=120&q=80', bonus: '+20% Gold Harvest', equipped: true },
        { id: 'owl', name: 'Mystic Owl', icon: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80', bonus: '-15% Growth Time', equipped: false }
    ],
    achievements: [
        { id: 'first_harvest', name: 'First Sprout', desc: 'Harvest your very first crop', completed: false },
        { id: 'world_traveler', name: 'Dimension Hopper', desc: 'Teleport to World 2', completed: false },
        { id: 'wealthy_farmer', name: 'Tycoon of Soil', desc: 'Accumulate 1,000 Gold', completed: false }
    ],
    antiRotCount: 2,
    catalystCount: 1,
    luckMultiplier: 1,
    codesRedeemed: { Om_thedev: false, Upvote_omexla: false, sorry_for_update: false, admin_5555: false }
};

let activePlotIndex = null;
let weatherTimer = 60;
let currentWeather = 'Sunny & Calm ☀️';

window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    renderPlots();
    renderInventory();
    renderPets();
    renderMerchantStock();
    renderAchievements();
    updateUI();
    setInterval(gameTick, 1000);
});

function gameTick() {
    weatherTimer--;
    if (weatherTimer <= 0) {
        weatherTimer = 60;
        const weathers = ['Sunny & Calm ☀️', 'Gentle Rain 🌧️ (Boost)', 'Mystic Fog 🌫️ (Mutation)', 'Solar Flare 🔥 (Speed)'];
        currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
        document.getElementById('weather-display').innerText = currentWeather;
        logMessage(`Weather shifted to: ${currentWeather}`);
    }
    document.getElementById('weather-timer').innerText = `Shift in ${weatherTimer}s`;

    let growthRate = 5 + (gameData.sprinklers * 2);
    if (currentWeather.includes('Solar Flare')) growthRate += 5;

    gameData.plots.forEach(plot => {
        if (plot.state === 'growing') {
            plot.growth += growthRate;
            if (plot.growth >= 100) {
                plot.growth = 100;
                plot.state = 'ready';
            }
        }
    });
    renderPlots();
}

function renderPlots() {
    const container = document.getElementById('plots-container');
    container.innerHTML = '';
    gameData.plots.forEach((plot, index) => {
        let card = document.createElement('div');
        card.onclick = () => handlePlotClick(index);

        if (!plot.unlocked) {
            card.className = 'plot-card locked';
            card.innerHTML = `<div class="plot-status">Locked Lane</div><div class="plot-icon">🔒</div><div class="plot-status">Cost: ${plot.cost}g</div>`;
        } else {
            card.className = `plot-card ${plot.state !== 'empty' ? 'active' : ''}`;
            let icon = '🟫';
            let statusText = 'Empty Soil';
            let bar = '';

            if (plot.state === 'growing') {
                icon = gameData.seeds[plot.seed].icon;
                statusText = `Growing (${plot.growth}%)`;
                bar = `<div class="progress-bar-container"><div class="progress-bar" style="width:${plot.growth}%"></div></div>`;
            } else if (plot.state === 'ready') {
                icon = gameData.seeds[plot.seed].icon;
                statusText = '✨ Ready to Harvest!';
            }
            card.innerHTML = `<div class="plot-status">Plot #${index + 1}</div><div class="plot-icon">${icon}</div><div class="plot-status">${statusText}</div>${bar}`;
        }
        container.appendChild(card);
    });
}

function handlePlotClick(index) {
    let plot = gameData.plots[index];
    if (!plot.unlocked) {
        if (gameData.gold >= plot.cost) {
            gameData.gold -= plot.cost;
            plot.unlocked = true;
            plot.state = 'empty';
            logMessage(`Unlocked Plot #${index + 1}!`);
            renderPlots();
            updateUI();
        } else {
            logMessage(`Not enough gold for Plot #${index + 1}. Requires ${plot.cost}g.`);
        }
        return;
    }

    if (plot.state === 'empty') {
        activePlotIndex = index;
        openPlantModal();
    } else if (plot.state === 'ready') {
        let seedObj = gameData.seeds[plot.seed];
        let bonusGold = seedObj.reward * gameData.luckMultiplier;
        gameData.gold += bonusGold;
        gameData.essence += 3;
        seedObj.count += 1;
        plot.state = 'empty';
        plot.growth = 0;

        checkAchievements();
        logMessage(`Harvested ${seedObj.name}! Gained ${bonusGold} gold & 3 Essence.`);
        renderPlots();
        renderInventory();
        updateUI();
    }
}

function openPlantModal() {
    const list = document.getElementById('plant-options-list');
    list.innerHTML = '';
    for (let [key, seed] of Object.entries(gameData.seeds)) {
        if (seed.world === gameData.world && seed.count > 0) {
            list.innerHTML += `<div class="shop-row"><div><strong>${seed.icon} ${seed.name}</strong> (Owned: ${seed.count})</div><button class="btn" onclick="plantSeed('${key}')">Plant</button></div>`;
        }
    }
    if (!list.innerHTML) list.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center;">No seeds available for World ${gameData.world}! Visit Merchant.</div>`;
    openModal('plant-modal');
}

function plantSeed(key) {
    if (activePlotIndex === null || gameData.seeds[key].count <= 0) return;
    gameData.seeds[key].count--;
    let plot = gameData.plots[activePlotIndex];
    plot.state = 'growing';
    plot.seed = key;
    plot.growth = 0;
    closeModal('plant-modal');
    renderPlots();
    renderInventory();
    logMessage(`Planted ${gameData.seeds[key].name}.`);
}

function renderMerchantStock() {
    const list = document.getElementById('merchant-stock-list');
    list.innerHTML = '';
    gameData.merchantStock.forEach((item, idx) => {
        list.innerHTML += `<div class="shop-row"><div><strong>${item.name}</strong> - ${item.cost}g</div><button class="btn" onclick="buyMerchantItem(${idx})">Buy</button></div>`;
    });
}

function buyMerchantItem(idx) {
    let item = gameData.merchantStock[idx];
    if (gameData.gold >= item.cost) {
        gameData.gold -= item.cost;
        if (item.type === 'seed') {
            gameData.seeds[item.key].count += item.qty;
        } else if (item.type === 'item') {
            gameData.antiRotCount += item.qty;
        }
        logMessage(`Purchased ${item.name} from Merchant.`);
        updateUI();
        renderInventory();
    } else {
        logMessage("Not enough gold for merchant item.");
    }
}

function restockMerchantWithEssence() {
    if (gameData.essence >= 50) {
        gameData.essence -= 50;
        gameData.luckMultiplier = 3;
        showPopup("✨ 3x Luck Activated & Merchant Restocked!");
        logMessage("Restocked merchant with 50 Essence. 3x Luck active!");
        updateUI();
    } else {
        showPopup("❌ Need 50 Essence to restock!");
    }
}

function buySprinkler() {
    if (gameData.gold >= 150) {
        gameData.gold -= 150;
        gameData.sprinklers++;
        document.getElementById('sprinkler-count').innerText = gameData.sprinklers;
        logMessage("Built automatic sprinkler system.");
        updateUI();
    } else {
        logMessage("Not enough gold for sprinkler.");
    }
}

function buyItem(type) {
    if (type === 'antiRot' && gameData.gold >= 35) {
        gameData.gold -= 35;
        gameData.antiRotCount++;
        logMessage("Purchased Anti-Rot Spray.");
    } else if (type === 'catalyst' && gameData.gold >= 60) {
        gameData.gold -= 60;
        gameData.catalystCount++;
        logMessage("Purchased Growth Catalyst.");
    } else {
        logMessage("Not enough gold for supplies.");
    }
    updateUI();
    renderInventory();
}

function renderPets() {
    const container = document.getElementById('equipped-pets-display');
    container.innerHTML = '';
    gameData.pets.forEach(pet => {
        if (pet.equipped) {
            container.innerHTML += `<div class="pet-slot"><img src="${pet.icon}" alt="${pet.name}"><div><strong>${pet.name}</strong></div><div style="color:var(--accent-green);">${pet.bonus}</div></div>`;
        }
    });
}

function renderInventory() {
    const container = document.getElementById('seeds-inventory');
    container.innerHTML = '';
    for (let [key, seed] of Object.entries(gameData.seeds)) {
        if (seed.world === gameData.world) {
            container.innerHTML += `<div class="shop-row"><div>${seed.icon} ${seed.name}</div><div>x${seed.count}</div></div>`;
        }
    }
    document.getElementById('inv-antirot').innerText = gameData.antiRotCount;
    document.getElementById('inv-catalyst').innerText = gameData.catalystCount;
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    let completedCount = 0;
    gameData.achievements.forEach(ach => {
        if (ach.completed) completedCount++;
        list.innerHTML += `<div class="shop-row"><div><strong>${ach.name}</strong><br><span style="color:var(--text-muted);">${ach.desc}</span></div><div>${ach.completed ? '✅ Done' : '🔒 Locked'}</div></div>`;
    });
    document.getElementById('ach-count').innerText = `${completedCount}/${gameData.achievements.length}`;
}

function checkAchievements() {
    gameData.achievements[0].completed = true;
    if (gameData.gold >= 1000) gameData.achievements[2].completed = true;
    renderAchievements();
}

function toggleWorld() {
    gameData.world = gameData.world === 1 ? 2 : 1;
    logMessage(`Teleported to World ${gameData.world}.`);
    updateUI();
    renderInventory();
}

function triggerRebirth() {
    if (gameData.essence >= 150) {
        gameData.essence -= 150;
        gameData.world = 2;
        gameData.seeds.stellaris.count += 10;
        gameData.achievements[1].completed = true;
        gameData.plots.forEach(p => { p.state = 'empty'; p.growth = 0; });
        closeModal('rebirth-modal');
        showPopup("🌌 WELCOME TO WORLD 2!");
        logMessage("Rebirth performed! Unlocked World 2 dimensions.");
        updateUI();
        renderPlots();
        renderInventory();
        renderAchievements();
    } else {
        showPopup("❌ Need 150 Essence to Rebirth!");
    }
}

function submitPromoCode() {
    let input = document.getElementById('promo-code-input');
    let val = input.value.trim();
    input.value = '';

    if (val === 'sorry_for_update' && !gameData.codesRedeemed.sorry_for_update) {
        gameData.codesRedeemed.sorry_for_update = true;
        gameData.gold += 1200;
        gameData.essence += 100;
        for (let k in gameData.seeds) gameData.seeds[k].count += 15;
        showPopup("🌟 Special Patch Compensation Claimed (+1200 Gold, +100 Essence)!");
        logMessage("Redeemed compensation code 'sorry_for_update'.");
    } else if (val === 'Om_thedev' && !gameData.codesRedeemed.Om_thedev) {
        gameData.codesRedeemed.Om_thedev = true;
        gameData.gold += 500;
        gameData.essence += 50;
        showPopup("🌱 Code Redeemed: +500 Gold!");
        logMessage("Redeemed code 'Om_thedev'.");
    } else if (val === '5555' && !gameData.codesRedeemed.admin_5555) {
        gameData.codesRedeemed.admin_5555 = true;
        gameData.gold += 99999;
        gameData.essence += 9999;
        gameData.fertility = 999;
        showPopup("⚡ ADMIN GOD MODE ACTIVE (Near Infinite Stats)!");
        logMessage("Admin code 5555 executed.");
    } else {
        showPopup("❌ Invalid or already used code.");
    }
    updateUI();
    renderInventory();
    closeModal('blog-modal');
}

function updateUI() {
    document.getElementById('res-gold').innerText = gameData.gold;
    document.getElementById('res-essence').innerText = gameData.essence;
    document.getElementById('stat-fertility').innerText = `${gameData.fertility}%`;
    document.getElementById('stat-world').innerText = `World ${gameData.world}`;
    document.getElementById('sprinkler-count').innerText = gameData.sprinklers;
}

function showPopup(text) {
    let p = document.getElementById('admin-popup');
    p.innerText = text;
    p.classList.add('show');
    setTimeout(() => p.classList.remove('show'), 3500);
}

function logMessage(msg) {
    let log = document.getElementById('console-log');
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    log.innerHTML += `[${time}] ${msg}<br>`;
    log.scrollTop = log.scrollHeight;
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function saveGame() { localStorage.setItem('sproutSpire_massive_v3', JSON.stringify(gameData)); logMessage("Game data successfully saved."); closeModal('settings-modal'); }
function loadGame() {
    let saved = localStorage.getItem('sproutSpire_massive_v3');
    if (saved) { try { gameData = { ...gameData, ...JSON.parse(saved) }; } catch(e){} }
}
function hardReset() {
    if (confirm("Are you sure you want to completely wipe all progress?")) { localStorage.removeItem('sproutSpire_massive_v3'); location.reload(); }
         }
