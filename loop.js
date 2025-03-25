import { Complex } from './js/math/complex.js';
import { initCanvas, clearCanvas, updateCanvasSize } from './js/rendering/canvas.js';
import { JuliaSet } from './js/julia/julia-set.js';

let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;

let canvas, ctx, canvas_width, canvas_height;
let animationID;

let show = false;
let colorMode = "colorful"; // Default to colorful

// Configuration object for dat.gui
const config = {
    colorMode: 'colorful',
    realPart: -0.8,
    imaginaryPart: 0.156,
    maxIterations: 100,
    scale: 300,
    resetView: function() {
        this.realPart = -0.8;
        this.imaginaryPart = 0.156;
        this.scale = 300;
        juliaParams.center = { x: canvas_width / 2, y: canvas_height / 2 };
        updateJuliaSet();
    },
    presets: 'default'
};

// Presets for interesting Julia sets
const presets = {
    'default': { re: -0.8, im: 0.156 },
    'dendrite': { re: 0, im: 1 },
    'spiral': { re: -0.75, im: 0.11 },
    'rabbit': { re: -0.123, im: 0.745 },
    'siegel disk': { re: -0.391, im: -0.587 }
};

// Julia set instance
let juliaSet;

const juliaParams = {
    c: new Complex(config.realPart, config.imaginaryPart),
    maxIterations: config.maxIterations,
    scale: config.scale,
    escapeRadius: 2,
    center: { x: 0, y: 0 }
};

// GUI instance
let gui;

// Ensure all DOM interactions happen after the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize canvas
    const canvasContext = initCanvas('canvas1');
    canvas = canvasContext.canvas;
    ctx = canvasContext.ctx;
    
    // Get dimensions
    const dimensions = updateCanvasSize();
    canvas_width = dimensions.width;
    canvas_height = dimensions.height;
    
    // Create Julia set instance
    juliaSet = new JuliaSet({
        c: juliaParams.c,
        maxIterations: juliaParams.maxIterations,
        scale: juliaParams.scale,
        escapeRadius: juliaParams.escapeRadius,
        center: juliaParams.center,
        colorMode: colorMode
    });
    
    // Set up event listeners
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('wheel', onMouseWheel);
    
    // Setup dat.gui
    setupGUI();
    
    // Set initial center point
    juliaParams.center = { x: canvas_width / 2, y: canvas_height / 2 };
    juliaSet.setCenter(juliaParams.center.x, juliaParams.center.y);
    
    // Create a first Julia set when page loads
    show = true;
    updateJuliaSet();
});

function onMouseWheel(event) {
    event.preventDefault(); // Prevent page scrolling
    
    // Calculate zoom factor based on wheel direction
    const zoomFactor = event.deltaY < 0 ? 1.2 : 0.8; // Zoom in or out
    
    // Update scale
    config.scale *= zoomFactor;
    juliaParams.scale = config.scale;
    
    // Keep scale within reasonable bounds
    config.scale = Math.max(50, Math.min(5000, config.scale));
    juliaParams.scale = config.scale;
    
    // Update the GUI slider
    for (let controller of Object.values(gui.__controllers)) {
        if (controller.property === 'scale') {
            controller.updateDisplay();
            break;
        }
    }
    
    // Redraw Julia set with new scale
    if (show) {
        updateJuliaSet();
    }
}

function setupGUI() {
    gui = new dat.GUI({ width: 300 });
    
    // Color mode
    gui.add(config, 'colorMode', ['colorful', 'blackwhite']).name('Color Mode').onChange(function(value) {
        colorMode = value;
        juliaSet.setColorMode(value);
        updateJuliaSet();
    });
    
    // Complex parameter controls
    const complexFolder = gui.addFolder('Complex Parameter (c)');
    complexFolder.add(config, 'realPart', -2, 2, 0.001).name('Real Part').onChange(updateJuliaParameter);
    complexFolder.add(config, 'imaginaryPart', -2, 2, 0.001).name('Imaginary Part').onChange(updateJuliaParameter);
    complexFolder.open();
    
    // Render settings
    const renderFolder = gui.addFolder('Render Settings');
    renderFolder.add(config, 'maxIterations', 10, 500, 1).name('Max Iterations').onChange(function(value) {
        juliaParams.maxIterations = value;
        juliaSet.params.maxIterations = value;
        updateJuliaSet();
    });
    renderFolder.add(config, 'scale', 50, 1000, 1).name('Scale').onChange(function(value) {
        juliaParams.scale = value;
        juliaSet.params.scale = value;
        updateJuliaSet();
    });
    
    // Presets
    gui.add(config, 'presets', Object.keys(presets)).name('Presets').onChange(function(preset) {
        const params = presets[preset];
        config.realPart = params.re;
        config.imaginaryPart = params.im;
        updateJuliaParameter();
        
        // Update GUI controllers
        for (let controller of Object.values(gui.__controllers)) {
            if (controller.property === 'realPart' || controller.property === 'imaginaryPart') {
                controller.updateDisplay();
            }
        }
    });
    
    // Reset view button
    gui.add(config, 'resetView').name('Reset View');
    
    // Instructions
    const instructionsFolder = gui.addFolder('Instructions');
    const instructions = {
        note1: 'Click: Set center point',
        note2: 'Mouse wheel: Zoom in/out'
    };
    instructionsFolder.add(instructions, 'note1').name('');
    instructionsFolder.add(instructions, 'note2').name('');
}

function updateJuliaParameter() {
    juliaParams.c = new Complex(config.realPart, config.imaginaryPart);
    juliaSet.params.c = juliaParams.c;
    updateJuliaSet();
}

function updateJuliaSet() {
    juliaSet.draw();
}

function onMouseClick(event) {
    juliaParams.center = { x: event.clientX, y: event.clientY };
    juliaSet.setCenter(event.clientX, event.clientY);
    show = true;
    updateJuliaSet();
}

function Loop() {
   animationID = requestAnimationFrame(Loop);

   let msNow = window.performance.now();
   let dt = msNow - msPrev;

   if(dt < msPerFrame) return;
   
   // Fix timing logic
   let excessTime = dt % msPerFrame;
   msPrev = msNow - excessTime;
   dt = dt / 1000;
  
   // Clear screen
   clearCanvas(colorMode);

   // Update Julia set to always use the current parameter values
   if (show) {
        updateJuliaSet();
   }
}

Loop();
