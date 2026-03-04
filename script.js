/**
 * Paw Bakery 🐾 - Kawaii Virtual Pet Game
 */

const petState = {
    hunger: 100,
    hygiene: 100,
    happiness: 100,
    coins: 50,
    isDirty: false,
    activeTool: null,       // 'food' or 'sponge'
    activeEmoji: '🍓',     // The specific emoji being dragged
    petColor: 'pink',
    accessory: null         // Current accessory emoji or null
};

// ==================== DOM ELEMENTS ====================
const petImg = document.getElementById('pet-img');
const petContainer = document.getElementById('pet');
const petAccessory = document.getElementById('pet-accessory');
const selectionScreen = document.getElementById('selection-screen');
const wardrobeScreen = document.getElementById('wardrobe-screen');
const startBtn = document.getElementById('start-game');
const closeWardrobeBtn = document.getElementById('close-wardrobe');
const petOptions = document.querySelectorAll('.pet-option');
const wardrobeItems = document.querySelectorAll('.wardrobe-item');

const hungerBar = document.getElementById('hunger-bar');
const hygieneBar = document.getElementById('hygiene-bar');
const happinessBar = document.getElementById('happiness-bar');
const dirtOverlay = document.getElementById('dirt-overlay');

const btnFood = document.getElementById('btn-food');
const btnBath = document.getElementById('btn-bath');
const btnShop = document.getElementById('btn-shop');
const foodMenu = document.getElementById('food-menu');
const foodOpts = document.querySelectorAll('.food-opt');

const dragCursor = document.getElementById('drag-cursor');

// ==================== INIT ====================
function init() {
    updateBars();
    setupSelection();
    setupWardrobe();
    setupInteractions();
    setInterval(decayStats, 5000);

    // Prevent all image dragging globally
    document.addEventListener('dragstart', e => e.preventDefault());
}

// ==================== SELECTION SCREEN ====================
function setupSelection() {
    petOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            petOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            petState.petColor = opt.dataset.color;
            applyPetColor(petState.petColor);
        });
    });

    startBtn.addEventListener('click', () => {
        if (!document.querySelector('.pet-option.selected')) {
            // Auto-select first if none chosen
            petOptions[0].classList.add('selected');
            petState.petColor = 'pink';
        }
        selectionScreen.style.display = 'none';
    });
}

function applyPetColor(color) {
    if (color === 'lilac') petImg.style.filter = 'hue-rotate(280deg)';
    else if (color === 'mint') petImg.style.filter = 'hue-rotate(150deg)';
    else petImg.style.filter = 'none';
}

// ==================== WARDROBE ====================
function setupWardrobe() {
    wardrobeItems.forEach(item => {
        item.addEventListener('click', () => {
            wardrobeItems.forEach(i => i.classList.remove('equipped'));
            const acc = item.dataset.acc;

            if (acc === 'none') {
                petState.accessory = null;
                petAccessory.textContent = '';
            } else {
                item.classList.add('equipped');
                petState.accessory = item.textContent;
                petAccessory.textContent = petState.accessory;
            }
        });
    });

    closeWardrobeBtn.addEventListener('click', () => {
        wardrobeScreen.style.display = 'none';
    });
}

// ==================== STATUS BARS ====================
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
            jumpPet();
            spawnHearts();
            updateBars();
        }
    });

    // Food Menu Toggle
    btnFood.addEventListener('click', () => {
        if (petState.activeTool === 'food') {
            deactivateTool();
        } else {
            foodMenu.classList.toggle('active');
        }
    });

    // Individual Food Selection — THIS IS THE FIX
    foodOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = opt.dataset.emoji;
            petState.activeEmoji = emoji;

            // Highlight the chosen food
            foodOpts.forEach(o => o.classList.remove('selected-food'));
            opt.classList.add('selected-food');

            // Activate the tool with this specific emoji
            activateTool('food', emoji);
            foodMenu.classList.remove('active');
        });
    });

    // Bath
    btnBath.addEventListener('click', () => {
        if (petState.activeTool === 'sponge') {
            deactivateTool();
        } else {
            activateTool('sponge', '🧽');
        }
    });

    // Shop/Wardrobe
    btnShop.addEventListener('click', () => {
        wardrobeScreen.style.display = 'flex';
        deactivateTool();
    });

    // Mouse Move: drag the emoji cursor
    document.addEventListener('mousemove', (e) => {
        if (petState.activeTool) {
            dragCursor.style.left = `${e.clientX - 30}px`;
            dragCursor.style.top = `${e.clientY - 30}px`;
            checkInteraction(e.clientX, e.clientY);
        }
    });

    // Right click or Escape to cancel tool
    document.addEventListener('contextmenu', (e) => {
        if (petState.activeTool) {
            e.preventDefault();
            deactivateTool();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') deactivateTool();
    });
}

// ==================== TOOL MANAGEMENT ====================
function activateTool(type, emoji) {
    petState.activeTool = type;
    petState.activeEmoji = emoji;

    // Show the emoji as the drag cursor
    dragCursor.textContent = emoji;
    dragCursor.style.display = 'block';

    // Highlight the active button
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
        // Spawn a mini heart near the food
        if (Math.random() > 0.85) spawnFX(x, y, '❤️');
        updateBars();
    }
}

function washPet(x, y) {
    if (petState.hygiene < 100) {
        petState.hygiene = Math.min(100, petState.hygiene + 0.4);
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
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            spawnFX(
                petRect.left + Math.random() * petRect.width,
                petRect.top + Math.random() * petRect.height * 0.5,
                ['💖', '💕', '✨'][Math.floor(Math.random() * 3)]
            );
        }, i * 150);
    }
}

function spawnFX(x, y, emoji) {
    const el = document.createElement('div');
    el.className = 'heart-fx';
    el.textContent = emoji;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.getElementById('hearts-container').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function jumpPet() {
    petContainer.classList.remove('pet-idle');
    petContainer.classList.add('pet-jump');
    setTimeout(() => {
        petContainer.classList.remove('pet-jump');
        petContainer.classList.add('pet-idle');
    }, 500);
}

window.onload = init;
