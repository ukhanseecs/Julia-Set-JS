import { initCanvas, clearCanvas } from './rendering/canvas.js';
import { JuliaSet } from './julia/julia-set.js';
import { setupControls } from './julia/ui.js';

// Animation variables
let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;
let animationID;
let show = false;

// Initialize the canvas
const { ctx } = initCanvas('canvas1');

// Create Julia set with default parameters
const juliaSet = new JuliaSet();

// Setup UI controls
setupControls(juliaSet);

function loop() {
    animationID = requestAnimationFrame(loop);

    let msNow = window.performance.now();
    let dt = msNow - msPrev;

    if(dt < msPerFrame) return;
    
    // Fix timing logic
    let excessTime = dt % msPerFrame;
    msPrev = msNow - excessTime;
    dt = dt / 1000;
    
    // Clear the canvas
    clearCanvas(juliaSet.params.colorMode);
    
    // Draw Julia set if enabled
    if (show) {
        juliaSet.draw();
    }
}

// Handle first click to show Julia set
document.addEventListener('click', () => {
    show = true;
}, { once: true });

// Start the animation loop
loop();

// Make juliaSet globally accessible for debugging
window.juliaSet = juliaSet;