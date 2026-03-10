// scripts/gravity/gravity.js

const gravityState = {
    direction: 1, // 1 = down, -1 = up
    strength: 1200, // pixels per second squared
    canInvert: true // cooldown prevention
};

function initGravity() {
    gravityState.direction = 1;
    gravityState.canInvert = true;
}

function updateGravity(keys, dt) {
    // Invert on G press (with simple edge detection to prevent holding)
    if (keys.g && gravityState.canInvert) {
        gravityState.direction *= -1;
        
        // Give the player an immediate vertical boost towards the new gravity
        // so mid-air inversions feel responsive and snappy
        if (typeof player !== 'undefined') {
             // Positively add velocity towards the new floor/ceiling
             player.vy = 400 * gravityState.direction;
             player.isGrounded = false;
        }

        gravityState.canInvert = false; // Require release
    } else if (!keys.g) {
        gravityState.canInvert = true;
    }
}

