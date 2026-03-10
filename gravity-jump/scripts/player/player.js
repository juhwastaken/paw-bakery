// scripts/player/player.js

const player = {
    x: 200,
    y: 300,
    width: 20,
    height: 20,
    vx: 0,
    vy: 0,
    speed: 300,        // Horizontal speed px/s
    jumpForce: -600,   // Jump velocity
    isGrounded: false,
    color: '#00ffff'   // Neon Cyan
};

function initPlayer() {
    player.x = 100;
    player.y = canvas.height / 2 - player.height / 2; // Spawn dead center
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;
}

function updatePlayer(keys, dt) {
    // Horizontal Movement is now fixed (auto-runner)
    player.vx = 0;

    // Apply Gravity Acceleration
    player.vy += gravityState.direction * gravityState.strength * dt;

    // Jumping (needs to be grounded and space pressed)
    // The jump direction opposes the current gravity direction
    if (keys.space && player.isGrounded) {
        player.vy = player.jumpForce * gravityState.direction;
        player.isGrounded = false;
        if (window.playJumpSound) playJumpSound();
    }

    // Apply vertical velocity to position
    player.y += player.vy * dt;

    // Screen wrapping horizontal (no longer needed, but keeping player locked)
    player.x = 100; // Fixed position on screen

    // Floor and Ceiling Collision
    player.isGrounded = false;
    // Reference dynamically from platform.js variables
    const floorY = canvas.height - floorHeight;
    const ceilY = ceilHeight;

    // Floor collision
    if (player.y + player.height >= floorY) {
        player.y = floorY - player.height;
        player.vy = 0;
        if (gravityState.direction === 1) player.isGrounded = true;
    }
    
    // Ceiling collision
    if (player.y <= ceilY) {
        player.y = ceilY;
        player.vy = 0;
        if (gravityState.direction === -1) player.isGrounded = true;
    }
}

function drawPlayer(ctx) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Core white center for neon look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 4, player.y + 4, player.width - 8, player.height - 8);
    ctx.restore();
}

function checkPlayerDeath() {
    // Death is now checked in platform.js (obstacle collision)
    // We just return false here so main.js doesn't trigger death implicitly
    return false;
}
