// scripts/main.js

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// --- Web Audio API Synthesizer ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playJumpSound() {
    playTone(300, 'square', 0.2, 0.1);
    setTimeout(() => playTone(600, 'square', 0.2, 0.1), 50); // Ascending beep
}

function playCoinSound() {
    playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 50); // High chime
}

function playDeathSound() {
    playTone(150, 'sawtooth', 0.5, 0.2); // Low buzz
}
// ---------------------------------


// Game State
const gameState = {
    mode: 'MENU', // MENU, PLAYING, GAMEOVER, PHASE_TRANSITION
    score: 0,
    baseScore: 0,
    coinScore: 0,
    time: 0,
    startTime: 0,
    phase: 1,
    phaseStartTime: 0,
    finishLineSpawned: false
};

const menuScene = document.getElementById('menu-scene');
const gameoverScene = document.getElementById('gameover-scene');
const phaseScene = document.getElementById('phase-scene');
const phaseTitle = document.getElementById('phase-title');
const hud = document.getElementById('hud');
const phaseDisplay = document.querySelector('#phase-display span');
const scoreDisplay = document.querySelector('#score-display span');
const timeDisplay = document.querySelector('#time-display span');
const finalScoreDisplay = document.getElementById('final-score');
const finalTimeDisplay = document.getElementById('final-time');

// Buttons
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-continue').addEventListener('click', continuePhase);
document.getElementById('btn-quit').addEventListener('click', returnToMenu);

// Input Handling
const keys = {
    left: false,
    right: false,
    space: false,
    g: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
    if (e.code === 'KeyG') keys.g = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'KeyG') keys.g = false;
});

let lastTime = 0;

function startGame() {
    gameState.mode = 'PLAYING';
    gameState.score = 0;
    gameState.baseScore = 0; // Tracks points from time
    gameState.coinScore = 0; // Tracks points from coins
    gameState.time = 0;
    gameState.phase = 1;
    gameState.finishLineSpawned = false;
    gameState.startTime = Date.now();
    gameState.phaseStartTime = Date.now();

    
    // Reset Entities
    initPlayer();
    initGravity();
    initPlatforms();

    // UI transitions
    menuScene.classList.remove('active');
    menuScene.classList.add('hidden');
    gameoverScene.classList.remove('active');
    gameoverScene.classList.add('hidden');
    hud.classList.remove('hidden');

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState.mode = 'GAMEOVER';
    
    // UI transitions
    hud.classList.add('hidden');
    gameoverScene.classList.remove('hidden');
    gameoverScene.classList.add('active');
    
    finalScoreDisplay.textContent = Math.floor(gameState.score);
    finalTimeDisplay.textContent = gameState.time;
}

// Make startPhaseTransition accessible to platform.js
window.startPhaseTransition = function() {
    gameState.mode = 'PHASE_TRANSITION';
    
    // Show overlay
    phaseTitle.textContent = `Phase ${gameState.phase} Clear!`;
    phaseScene.classList.remove('hidden');
    phaseScene.classList.add('active');
    // Game loop halts here implicitly because mode is not PLAYING
};

function continuePhase() {
    gameState.phase++;
    gameState.phaseStartTime = Date.now();
    
    // Hide overlay
    phaseScene.classList.remove('active');
    phaseScene.classList.add('hidden');
    
    gameState.finishLineSpawned = false; // Reset for new phase
    
    // Update difficulty in platform generator
    advancePlatformPhase(gameState.phase);
    
    gameState.mode = 'PLAYING';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function returnToMenu() {
    gameState.mode = 'MENU';
    phaseScene.classList.remove('active');
    phaseScene.classList.add('hidden');
    gameoverScene.classList.remove('active');
    gameoverScene.classList.add('hidden');
    hud.classList.add('hidden');
    menuScene.classList.remove('hidden');
    menuScene.classList.add('active');
}

function gameLoop(timestamp) {
    if (gameState.mode !== 'PLAYING') return;

    const deltaTime = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;

    // Clear Canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update time and base score
    // Only update timers if we haven't spawned the finish line yet, so time feels "locked" at 15
    const now = Date.now();
    if (!gameState.finishLineSpawned) {
        gameState.time = Math.floor((now - gameState.startTime) / 1000);
    }
    const timeInPhase = Math.floor((now - gameState.phaseStartTime) / 1000);
    
    gameState.baseScore = gameState.time * 10; // 10 points per second
    gameState.score = gameState.baseScore + gameState.coinScore;
    
    // Phase check (try to end phase after 15 seconds)
    if (timeInPhase >= 15 && !gameState.finishLineSpawned) {
        if (window.spawnFinishLine) {
            spawnFinishLine();
            gameState.finishLineSpawned = true;
        }
    }
    
    // Updates
    updateGravity(keys, deltaTime);
    updatePlayer(keys, deltaTime);
    updatePlatforms(deltaTime);

    // Render
    drawPlatforms(ctx);
    drawPlayer(ctx);

    // Update HUD
    phaseDisplay.textContent = gameState.phase;
    scoreDisplay.textContent = Math.floor(gameState.score);
    timeDisplay.textContent = gameState.time;

    // Check Death
    if (checkPlayerDeath()) {
        playDeathSound();
        endGame();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// End of main.js
