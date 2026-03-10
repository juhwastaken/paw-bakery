// scripts/platforms/platform.js

let obstacles = [];
let scrollSpeed = 300; // pixels per second
let spawnTimer = 0;
let nextSpawnDelay = 1.5; // seconds

const floorHeight = 200;
const ceilHeight = 200;

// Expose a global death flag
let isPlayerDead = false;

// Phase variables
let baseScrollSpeed = 300;
let baseSpawnDelay = 1.0;
let currentNeonColor = '#d400ff';
const neonColors = ['#d400ff', '#ff007f', '#00ffff', '#39ff14', '#ff3300'];

function initPlatforms() {
    obstacles = [];
    isPlayerDead = false;
    baseScrollSpeed = 300;
    baseSpawnDelay = 1.0;
    scrollSpeed = baseScrollSpeed;
    nextSpawnDelay = baseSpawnDelay;
    spawnTimer = 0;
    currentNeonColor = neonColors[0];
}

function advancePlatformPhase(phase) {
    obstacles = []; // Clear board
    
    // Scale difficulty
    baseScrollSpeed += 50; // Flat increase per phase
    baseSpawnDelay = Math.max(0.3, baseSpawnDelay - 0.15); // Faster spawns
    
    scrollSpeed = baseScrollSpeed;
    nextSpawnDelay = baseSpawnDelay;
    spawnTimer = 0;
    
    // Cycle colors
    currentNeonColor = neonColors[(phase - 1) % neonColors.length];
}

function spawnObstacle() {
    // 3 types of initial obstacles: Floor Spike, Ceiling Spike, Mid-air Enemy
    const typeRoll = Math.random();
    
    let yPos, width, height, type;

    if (typeRoll < 0.35) {
        // Floor Spike (bottom 200)
        width = 30;
        height = 40 + Math.random() * 40; // 40 to 80px tall
        yPos = canvas.height - floorHeight - height;
        type = 'spike';
    } else if (typeRoll < 0.7) {
        // Ceiling Spike (top 200)
        width = 30;
        height = 40 + Math.random() * 40;
        yPos = ceilHeight;
        type = 'spike';
    } else if (typeRoll < 0.85) {
        // Mid-air Enemy (floating in the 200px gap)
        width = 30;
        height = 30;
        yPos = 230 + Math.random() * 100;
        type = 'enemy';
    } else {
        // Coin (safe floating collectible)
        width = 20;
        height = 20;
        // Spawn anywhere between ceiling and floor
        yPos = ceilHeight + 10 + Math.random() * (canvas.height - floorHeight - ceilHeight - height - 20);
        type = 'coin';
    }

    obstacles.push({
        x: canvas.width,
        y: yPos,
        width: width,
        height: height,
        type: type,
        collected: false // Coin specific flag
    });
}

function spawnFinishLine() {
    obstacles.push({
        x: canvas.width,
        y: 0,
        width: canvas.width, // Full screen width sweep
        height: canvas.height,
        type: 'finish',
        collected: false
    });
}

function updatePlatforms(dt) {
    // Increase speed slightly over time within the phase
    scrollSpeed += 5 * dt;

    // Spawn new obstacles (Stop spawning if finish line is out)
    spawnTimer += dt;
    if (spawnTimer >= nextSpawnDelay && !gameState.finishLineSpawned) {
        spawnObstacle();
        spawnTimer = 0;
        // Randomize next spawn time around the base limit
        nextSpawnDelay = (Math.random() * 1.0 + baseSpawnDelay) * (baseScrollSpeed / scrollSpeed);
    }

    // Move obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= scrollSpeed * dt;

        // Collision logic (AABB)
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y &&
            !obs.collected
        ) {
            if (obs.type === 'coin') {
                obs.collected = true; // Mark as collected
                addScore(50);         // 50 points per coin
                if (window.playCoinSound) playCoinSound();
            } else if (obs.type === 'finish') {
                // Only trigger transition if the "wall of light" has reached the left side
                // This makes it look like it's sweeping the level clear.
                if (obs.x <= 0) {
                    obs.collected = true;
                    if (window.startPhaseTransition) startPhaseTransition();
                }
            } else {
                isPlayerDead = true; // Hit a spike or enemy
            }
        }

        // Cleanup offscreen
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawPlatforms(ctx) {
    ctx.save();
    
    // Draw Ceiling (Deep Purple with glowing neon edge)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0033'; // Deep background purple
    ctx.fillRect(0, 0, canvas.width, ceilHeight);
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = currentNeonColor;
    ctx.fillStyle = currentNeonColor; // Dynamic Neon edge
    ctx.fillRect(0, ceilHeight - 4, canvas.width, 4);

    // Draw Floor (Deep Purple with glowing neon edge)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0033';
    ctx.fillRect(0, canvas.height - floorHeight, canvas.width, floorHeight);
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = currentNeonColor;
    ctx.fillStyle = currentNeonColor; // Dynamic Neon edge
    ctx.fillRect(0, canvas.height - floorHeight, canvas.width, 4);

    // Draw Obstacles / Coins
    for (let obs of obstacles) {
        if (obs.collected) continue; // Skip drawn coins that are collected

        if (obs.type === 'coin') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
            ctx.fillStyle = '#ffff00'; // Neon yellow for coins
            ctx.beginPath();
            ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'finish') {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ffffff';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Bright white light
            ctx.fillRect(obs.x, obs.y, Math.min(obs.width, canvas.width - obs.x), obs.height);
        } else {
            if (obs.type === 'spike') {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff007f';
                ctx.fillStyle = '#ff007f'; // Neon pink
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                
                // Inner core for neon look
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);
            } else if (obs.type === 'enemy') {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff3300';
                ctx.fillStyle = '#ff3300'; // Neon hot orange for enemies
                
                // Draw as a diamond/mid-air spike
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y); // Top
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2); // Right
                ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height); // Bottom
                ctx.lineTo(obs.x, obs.y + obs.height / 2); // Left
                ctx.closePath();
                ctx.fill();
                
                // Inner core for neon look
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y + 6);
                ctx.lineTo(obs.x + obs.width - 6, obs.y + obs.height / 2);
                ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height - 6);
                ctx.lineTo(obs.x + 6, obs.y + obs.height / 2);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    ctx.restore();
}

// Override the stub checkPlayerDeath from player.js logic
window.checkPlayerDeath = function() {
    return isPlayerDead; // Read by main.js
};
