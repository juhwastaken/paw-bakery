/**
 * Paw Bakery 🐾 — Kawaii Virtual Pet Game + Donut Run Minigame
 */

// ==================== STATE ====================
const petState = {
    hunger: 100,
    hygiene: 100,
    happiness: 100,
    coins: 50,
    isDirty: false,
    activeTool: null,
    activeEmoji: '🍓',
    petModel: '🐼',
    accessory: null,
    accessoryPos: { top: '5%', right: '15%' },
    ownedAccessories: ['none'],
    highScore: 0
};

// ==================== PERSISTENCE ====================
function saveGame() {
    const data = {
        hunger: petState.hunger,
        hygiene: petState.hygiene,
        happiness: petState.happiness,
        coins: petState.coins,
        petModel: petState.petModel,
        accessory: petState.accessory,
        ownedAccessories: petState.ownedAccessories,
        highScore: petState.highScore,
        accessoryPos: petState.accessoryPos
    };
    localStorage.setItem('pawBakery_save', JSON.stringify(data));
}

function loadGame() {
    const saved = localStorage.getItem('pawBakery_save');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(petState, data);
        updateBars();
        applyPetModel(petState.petModel);
        if (petState.accessory) {
            petAccessory.textContent = petState.accessory;
            petAccessory.style.top = petState.accessoryPos.top;
            petAccessory.style.right = petState.accessoryPos.right;
            petAccessory.style.left = petState.accessoryPos.left || 'auto';
        }
    }
}

// ==================== DOM ====================
const petImgDisplay = document.getElementById('pet-img');
const petContainer = document.getElementById('pet');
const petAccessory = document.getElementById('pet-accessory');
const selectionScreen = document.getElementById('selection-screen');
const wardrobeScreen = document.getElementById('wardrobe-screen');
const minigameScreen = document.getElementById('minigame-screen');
const startBtn = document.getElementById('start-game');
const closeWardrobeBtn = document.getElementById('close-wardrobe');
const petOptions = document.querySelectorAll('.pet-option');
const wardrobeItems = document.querySelectorAll('.wardrobe-item');

const hungerBar = document.getElementById('hunger-bar');
const hygieneBar = document.getElementById('hygiene-bar');
const happinessBar = document.getElementById('happiness-bar');
const dirtOverlay = document.getElementById('dirt-overlay');
const fxContainer = document.getElementById('fx-container');

const btnFood = document.getElementById('btn-food');
const btnBath = document.getElementById('btn-bath');
const btnShop = document.getElementById('btn-shop');
const btnMinigame = document.getElementById('btn-minigame');
const foodMenu = document.getElementById('food-menu');
const foodOpts = document.querySelectorAll('.food-opt');
const dragCursor = document.getElementById('drag-cursor');
const coinCountDisplay = document.getElementById('coin-count');

let eatingTimeout = null;

// ==================== INIT ====================
function init() {
    loadGame();
    updateBars();
    updateCoinHUD();
    setupSelection();
    setupWardrobe();
    setupInteractions();
    setInterval(() => {
        decayStats();
        saveGame();
    }, 5000);
    document.addEventListener('dragstart', e => e.preventDefault());
}

// ==================== SELECTION ====================
function setupSelection() {
    petOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            petOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            petState.petModel = opt.dataset.pet;
            applyPetModel(petState.petModel);
        });
    });

    startBtn.addEventListener('click', () => {
        if (!document.querySelector('.pet-option.selected')) {
            petOptions[0].classList.add('selected');
            petState.petModel = 'pandi';
        }
        selectionScreen.style.display = 'none';

        // Ensure starting pet is applied
        applyPetModel(petState.petModel);
    });
}

function applyPetModel(model) {
    if (petImgDisplay) {
        petImgDisplay.src = `assets/${model}.png`;
    }
}

// ==================== WARDROBE ====================
function setupWardrobe() {
    wardrobeItems.forEach(item => {
        item.addEventListener('click', () => {
            const acc = item.dataset.acc;
            const price = parseInt(item.dataset.price || 0);

            if (acc === 'none') {
                petState.accessory = null;
                petAccessory.textContent = '';
                wardrobeItems.forEach(i => i.classList.remove('equipped'));
            } else if (petState.ownedAccessories.includes(acc)) {
                // Already owned, just equip
                wardrobeItems.forEach(i => i.classList.remove('equipped'));
                item.classList.add('equipped');
                petState.accessory = item.textContent;
                petAccessory.textContent = petState.accessory;
            } else if (petState.coins >= price) {
                // Buy it
                petState.coins -= price;
                petState.ownedAccessories.push(acc);
                wardrobeItems.forEach(i => i.classList.remove('equipped'));
                item.classList.add('equipped');
                petState.accessory = item.textContent;
                petAccessory.textContent = petState.accessory;
                updateCoinHUD();
                sounds.buy();
                saveGame();
            } else {
                // Can't afford
                item.style.animation = 'shake 0.3s';
                setTimeout(() => item.style.animation = '', 300);
            }
        });
    });

    closeWardrobeBtn.addEventListener('click', () => {
        wardrobeScreen.style.display = 'none';
    });
}

function updateCoinHUD() {
    if (coinCountDisplay) coinCountDisplay.textContent = petState.coins;
}

// ==================== AUDIO ====================
const sounds = {
    eat: () => playTone(300, 0.1, 'sine'),
    wash: () => playTone(600, 0.05, 'triangle'),
    jump: () => playTone(400, 0.2, 'square'),
    buy: () => playTone(800, 0.1, 'sine'),
    coin: () => playTone(1200, 0.1, 'sine'),
    hit: () => playTone(150, 0.3, 'sawtooth'),
    click: () => playTone(500, 0.05, 'sine')
};

function playTone(freq, dur, type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    } catch(e) { console.log('Audio blocked'); }
}

// ==================== BARS ====================
function updateBars() {
    hungerBar.style.width = `${petState.hunger}%`;
    hygieneBar.style.width = `${petState.hygiene}%`;
    happinessBar.style.width = `${petState.happiness}%`;
    if (petState.hygiene < 40 && !petState.isDirty) showDirt();
    else if (petState.hygiene > 80 && petState.isDirty) hideDirt();
}

function decayStats() {
    if (selectionScreen.style.display !== 'none') return;
    if (wardrobeScreen.style.display !== 'none') return;
    if (minigameScreen.style.display !== 'none') return;
    petState.hunger = Math.max(0, petState.hunger - 1);
    petState.hygiene = Math.max(0, petState.hygiene - 0.5);
    petState.happiness = Math.max(0, petState.happiness - 0.5);
    updateBars();
}

// ==================== DIRT ====================
function showDirt() {
    petState.isDirty = true;
    dirtOverlay.innerHTML = '';
    dirtOverlay.style.opacity = '1';
    for (let i = 0; i < 5; i++) {
        const spot = document.createElement('div');
        spot.className = 'dirt-spot';
        spot.style.width = `${Math.random() * 40 + 20}px`;
        spot.style.height = `${Math.random() * 30 + 15}px`;
        spot.style.top = `${Math.random() * 60 + 20}%`;
        spot.style.left = `${Math.random() * 60 + 20}%`;
        dirtOverlay.appendChild(spot);
    }
}

function hideDirt() {
    petState.isDirty = false;
    dirtOverlay.style.opacity = '0';
}

// ==================== INTERACTIONS ====================
function setupInteractions() {
    // Petting
    petContainer.addEventListener('click', () => {
        if (!petState.activeTool) {
            petState.happiness = Math.min(100, petState.happiness + 5);
            sounds.jump();
            jumpPet();
            spawnHearts();
            updateBars();
        }
    });

    // Food menu
    btnFood.addEventListener('click', () => {
        if (petState.activeTool === 'food') { deactivateTool(); return; }
        foodMenu.classList.toggle('active');
    });

    foodOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = opt.dataset.emoji;
            petState.activeEmoji = emoji;
            foodOpts.forEach(o => o.classList.remove('selected-food'));
            opt.classList.add('selected-food');
            activateTool('food', emoji);
            foodMenu.classList.remove('active');
        });
    });

    // Bath
    btnBath.addEventListener('click', () => {
        if (petState.activeTool === 'sponge') { deactivateTool(); return; }
        activateTool('sponge', '🧽');
    });

    // Shop
    btnShop.addEventListener('click', () => {
        wardrobeScreen.style.display = 'flex';
        deactivateTool();
    });

    // Minigame
    btnMinigame.addEventListener('click', () => {
        minigameScreen.style.display = 'flex';
        deactivateTool();
        startMinigame();
    });

    // Dragging Accessory
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    petAccessory.addEventListener('mousedown', (e) => {
        if (!petState.accessory) return;
        isDragging = true;
        const rect = petAccessory.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const petContainer = document.getElementById('pet');
            const parent = petContainer.getBoundingClientRect();
            
            // Mouse position relative to #pet, minus the grab offset
            // We use standard pixels here. CSS will interpret as px.
            let x = e.clientX - parent.left - dragOffset.x;
            let y = e.clientY - parent.top - dragOffset.y;
            
            // If the pet is scaled during breathing animation, dividing by the scale factor could be more accurate,
            // but for simplicity and since the scale is small (1.04), we can just set it directly.
            
            petAccessory.style.left = `${x}px`;
            petAccessory.style.top = `${y}px`;
            petAccessory.style.right = 'auto';
            
            petState.accessoryPos = { top: petAccessory.style.top, left: petAccessory.style.left };
        } else if (petState.activeTool) {
            dragCursor.style.left = `${e.clientX - 30}px`;
            dragCursor.style.top = `${e.clientY - 30}px`;
            checkInteraction(e.clientX, e.clientY);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            saveGame();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (petState.activeTool) { e.preventDefault(); deactivateTool(); }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') deactivateTool();
    });
}

// ==================== TOOLS ====================
function activateTool(type, emoji) {
    petState.activeTool = type;
    petState.activeEmoji = emoji;
    dragCursor.textContent = emoji;
    dragCursor.style.display = 'block';
    btnFood.classList.toggle('active-tool', type === 'food');
    btnBath.classList.toggle('active-tool', type === 'sponge');
}

function deactivateTool() {
    petState.activeTool = null;
    dragCursor.style.display = 'none';
    dragCursor.textContent = '';
    btnFood.classList.remove('active-tool');
    btnBath.classList.remove('active-tool');
    foodMenu.classList.remove('active');
}

// ==================== INTERACTION DETECTION ====================
function checkInteraction(x, y) {
    const petRect = petContainer.getBoundingClientRect();
    const pad = 30;
    const isOverPet = (
        x > petRect.left - pad && x < petRect.right + pad &&
        y > petRect.top - pad && y < petRect.bottom + pad
    );
    if (isOverPet) {
        if (petState.activeTool === 'food') feedPet(x, y);
        else if (petState.activeTool === 'sponge') washPet(x, y);
    }
}

function feedPet(x, y) {
    if (petState.hunger < 100) {
        petState.hunger = Math.min(100, petState.hunger + 0.3);
        sounds.eat();

        // Eating animation
        if (!eatingTimeout) {
            petContainer.classList.remove('pet-idle', 'pet-jump');
            petContainer.classList.add('pet-eating');
            eatingTimeout = setTimeout(() => {
                petContainer.classList.remove('pet-eating');
                petContainer.classList.add('pet-idle');
                eatingTimeout = null;
            }, 400);
        }

        // Food pop FX
        if (Math.random() > 0.85) {
            const pop = document.createElement('div');
            pop.className = 'food-pop';
            pop.textContent = petState.activeEmoji;
            const petRect = petContainer.getBoundingClientRect();
            const areaRect = document.getElementById('pet-area').getBoundingClientRect();
            pop.style.left = `${petRect.left - areaRect.left + Math.random() * petRect.width}px`;
            pop.style.top = `${petRect.top - areaRect.top}px`;
            fxContainer.appendChild(pop);
            setTimeout(() => pop.remove(), 800);
        }

        updateBars();
        deactivateTool(); // Make food disappear after giving it
    }
}

function washPet(x, y) {
    if (petState.hygiene < 100) {
        petState.hygiene = Math.min(100, petState.hygiene + 0.4);
        sounds.wash();
        createBubble(x, y);
        updateBars();
    }
}

// ==================== VISUAL FX ====================
function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.random() * 15 + 8;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x + (Math.random() - 0.5) * 30}px`;
    bubble.style.top = `${y + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1200);
}

function spawnHearts() {
    const petRect = petContainer.getBoundingClientRect();
    const areaRect = document.getElementById('pet-area').getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'heart-fx';
            el.textContent = ['💖', '💕', '✨'][Math.floor(Math.random() * 3)];
            el.style.left = `${petRect.left - areaRect.left + Math.random() * petRect.width}px`;
            el.style.top = `${petRect.top - areaRect.top + Math.random() * petRect.height * 0.5}px`;
            fxContainer.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        }, i * 150);
    }
}

function jumpPet() {
    petContainer.classList.remove('pet-idle', 'pet-eating');
    petContainer.classList.add('pet-jump');
    setTimeout(() => {
        petContainer.classList.remove('pet-jump');
        petContainer.classList.add('pet-idle');
    }, 500);
}

// ==================== DONUT RUN MINIGAME ====================
let mgRunning = false;
let mgAnimFrame = null;

function startMinigame() {
    const canvas = document.getElementById('minigame-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    mgRunning = true;

    // Player
    const player = {
        x: W / 2 - 20,
        y: H - 80,
        w: 40, h: 40,
        vx: 0, vy: 0,
        onGround: false,
        emoji: petState.petModel || '🐾' // use current pet emoji
    };

    // Platforms
    const platforms = [];
    const items = []; // Holds both donuts and bombs
    let score = 0;
    let scrollY = 0;
    let gameOver = false;
    let difficultyScore = 0; // Tracks game speed increment

    // Generate initial platforms
    // First platform under player
    platforms.push({ x: W / 2 - 40, y: H - 100, w: 80, h: 12 });
    
    for (let i = 1; i < 15; i++) {
        platforms.push({
            x: Math.random() * (W - 80),
            y: H - 100 - i * 60, // Fixed gap at start
            w: 80,
            h: 12
        });
    }

    // Place donuts/bombs on some platforms (starting from higher ones)
    platforms.forEach((p, i) => {
        if (i > 2 && Math.random() > 0.4) {
            items.push({ x: p.x + p.w / 2 - 10, y: p.y - 25, w: 20, h: 20, type: 'donut', collected: false });
        } else if (i > 5 && Math.random() > 0.8) {
            items.push({ x: p.x + p.w / 2 - 10, y: p.y - 25, w: 20, h: 20, type: 'bomb', collected: false });
        }
    });

    // Ground
    platforms.push({ x: 0, y: H - 30, w: W, h: 30 });

    // Controls
    const keys = {};
    const keyDown = (e) => { keys[e.key] = true; };
    const keyUp = (e) => { keys[e.key] = false; };
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    // Quit button
    const quitBtn = document.getElementById('mg-quit');
    const quitHandler = () => {
        mgRunning = false;
        cancelAnimationFrame(mgAnimFrame);
        minigameScreen.style.display = 'none';
        document.removeEventListener('keydown', keyDown);
        document.removeEventListener('keyup', keyUp);
        quitBtn.removeEventListener('click', quitHandler);

        // Reward
        petState.happiness = Math.min(100, petState.happiness + score * 2);
        petState.coins += score;
        updateBars();
    };
    quitBtn.addEventListener('click', quitHandler);

    function update() {
        // Movement
        if (keys['ArrowLeft'] || keys['a']) player.vx = -4;
        else if (keys['ArrowRight'] || keys['d']) player.vx = 4;
        else player.vx *= 0.85;

        // Gravity
        player.vy += 0.5;

        // Jump
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
            player.vy = -10;
            player.onGround = false;
        }

        player.x += player.vx;
        player.y += player.vy;

        // Wrap
        if (player.x < -player.w) player.x = W;
        if (player.x > W) player.x = -player.w;

        // Platform collision
        player.onGround = false;
        for (const p of platforms) {
            if (
                player.vy >= 0 &&
                player.x + player.w > p.x && player.x < p.x + p.w &&
                player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 8
            ) {
                player.y = p.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        }

        // Item collection (donuts and bombs)
        for (const it of items) {
            if (!it.collected &&
                player.x + player.w > it.x && player.x < it.x + it.w &&
                player.y + player.h > it.y && player.y < it.y + it.h
            ) {
                it.collected = true;
                if (it.type === 'donut') {
                    score++;
                    sounds.coin();
                    difficultyScore = Math.floor(score / 5);
                    document.getElementById('mg-score').textContent = `🍩 ${score}`;
                } else if (it.type === 'bomb') {
                    gameOver = true;
                    sounds.hit();
                }
            }
        }
        
        // Final score check
        if (gameOver || player.y > H + 50) {
            gameOver = true;
            if (score > petState.highScore) {
                petState.highScore = score;
                saveGame();
            }
        }

        // Scroll up when player goes above midpoint
        if (player.y < H / 2) {
            const diff = H / 2 - player.y;
            player.y = H / 2;
            for (const p of platforms) p.y += diff;
            for (const it of items) it.y += diff;
            scrollY += diff;

            // Generate new platforms above
            while (platforms[0].y > 0) {
                // Determine difficulty base gaps and widths
                const platGap = 45 + Math.min(30, difficultyScore * 3); // gap increases 
                const platWidth = Math.max(30, 70 + Math.random() * 40 - difficultyScore * 2);

                const newP = {
                    x: Math.random() * (W - platWidth),
                    y: platforms[0].y - platGap,
                    w: platWidth,
                    h: 12
                };
                platforms.unshift(newP);

                // Add donut or bomb
                if (Math.random() > 0.5) {
                    items.push({ x: newP.x + newP.w / 2 - 10, y: newP.y - 25, w: 20, h: 20, type: 'donut', collected: false });
                } else if (Math.random() > Math.max(0.4, 0.8 - (difficultyScore * 0.05))) {
                    items.push({ x: newP.x + newP.w / 2 - 10, y: newP.y - 25, w: 20, h: 20, type: 'bomb', collected: false });
                }
            }
        }

        // Fall death
        if (player.y > H + 50) {
            gameOver = true;
        }
    }

    function draw() {
        // Night sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.5, '#302b63');
        grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 67 + scrollY * 0.1) % W;
            const sy = (i * 43 + scrollY * 0.05) % H;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Platforms
        for (const p of platforms) {
            if (p.y < H + 20 && p.y > -20) {
                ctx.fillStyle = '#F8BBD0';
                ctx.beginPath();
                ctx.roundRect(p.x, p.y, p.w, p.h, 6);
                ctx.fill();
                ctx.strokeStyle = '#F48FB1';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Items (Donuts and Bombs)
        ctx.font = '20px serif';
        for (const it of items) {
            if (!it.collected && it.y < H + 20 && it.y > -20) {
                ctx.fillText(it.type === 'donut' ? '🍩' : '💣', it.x, it.y + 18);
            }
        }

        // Player
        ctx.font = '36px serif';
        ctx.fillText(player.emoji, player.x, player.y + player.h);

        // Game Over
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FFD1DC';
            ctx.font = '800 28px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', W / 2, H / 2 - 40);
            ctx.font = '600 20px Outfit';
            ctx.fillText(`🍩 ${score} donuts!`, W / 2, H / 2);
            ctx.fillStyle = '#FFF59D';
            ctx.fillText(`Recorde: ${petState.highScore}`, W / 2, H / 2 + 30);
            ctx.fillStyle = '#FFD1DC';
            ctx.fillText('Clique "Voltar"', W / 2, H / 2 + 70);
            ctx.textAlign = 'left';
        }
    }

    function gameLoop() {
        if (!mgRunning) return;
        if (!gameOver) update();
        draw();
        mgAnimFrame = requestAnimationFrame(gameLoop);
    }

    document.getElementById('mg-score').textContent = `🍩 0`;
    gameLoop();
}

window.onload = init;
