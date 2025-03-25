import { Complex } from './js/math/complex.js';
import { initCanvas, clearCanvas, updateCanvasSize, getCanvasContext } from './js/rendering/canvas.js';
import { JuliaSet } from './js/julia/julia-set.js';
import { WebGLJuliaRenderer } from './js/rendering/webgl-julia-renderer.js';

let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;
let animationID; // Define the animationID variable

let canvas, canvas_width, canvas_height;
let ctx, gl; // Add declarations for the rendering contexts

let show = false;
let colorMode = "colorful"; // Default to colorful

// Configuration object for dat.gui
const config = {
    colorMode: 'colorful',
    realPart: -0.8,
    imaginaryPart: 0.156,
    maxIterations: 100,
    scale: 300,
    useWebGL: true, // New option to toggle WebGL
    resetView: function() {
        this.realPart = -0.8;
        this.imaginaryPart = 0.156;
        this.scale = 300;
        this.maxIterations = 100; // Also reset iterations to default
        juliaParams.center = { x: canvas_width / 2, y: canvas_height / 2 };
        
        // Update all related parameters
        juliaParams.c = new Complex(this.realPart, this.imaginaryPart);
        juliaParams.scale = this.scale;
        juliaParams.maxIterations = this.maxIterations;
        
        // Update UI controllers
        updateAllControllers();
        
        // Update renderers
        const { isWebGL } = getCanvasContext();
        if (isWebGL && webglRenderer) {
            webglRenderer.updateParams({
                c: juliaParams.c,
                scale: juliaParams.scale,
                maxIterations: juliaParams.maxIterations
            });
            webglRenderer.setCenter(juliaParams.center.x, juliaParams.center.y);
        } else if (juliaSet) {
            juliaSet.params.c = juliaParams.c;
            juliaSet.params.scale = juliaParams.scale;
            juliaSet.params.maxIterations = juliaParams.maxIterations;
            juliaSet.setCenter(juliaParams.center.x, juliaParams.center.y);
        }
        
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

// Add WebGL renderer variable
let webglRenderer;

const juliaParams = {
    c: new Complex(config.realPart, config.imaginaryPart),
    maxIterations: config.maxIterations,
    scale: config.scale,
    escapeRadius: 2,
    center: { x: 0, y: 0 }
};

// GUI instance
let gui;

// Check WebGL support before initializing
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    try {
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// Ensure all DOM interactions happen after the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if WebGL is supported
    if (config.useWebGL && !checkWebGLSupport()) {
        console.warn("WebGL not supported by this browser. Falling back to Canvas 2D.");
        config.useWebGL = false;
    }
    
    // Initialize canvas with WebGL if enabled
    const canvasContext = initCanvas('canvas1', config.useWebGL);
    canvas = canvasContext.canvas;
    const isUsingWebGL = canvasContext.isWebGL;
    
    // Get proper context based on rendering mode
    if (isUsingWebGL) {
        ctx = null; // Won't be using 2D context
        gl = canvasContext.gl;
    } else {
        ctx = canvasContext.ctx;
        gl = null;
    }
    
    // Get dimensions
    const dimensions = updateCanvasSize();
    canvas_width = dimensions.width;
    canvas_height = dimensions.height;
    
    // Set up Julia set renderer
    if (isUsingWebGL) {
        // Create WebGL renderer
        webglRenderer = new WebGLJuliaRenderer(canvas, {
            c: juliaParams.c,
            maxIterations: juliaParams.maxIterations,
            scale: juliaParams.scale,
            escapeRadius: juliaParams.escapeRadius,
            center: { x: canvas_width / 2, y: canvas_height / 2 },
            colorMode: colorMode
        });
    } else {
        // Create regular Canvas 2D Julia set
        juliaSet = new JuliaSet({
            c: juliaParams.c,
            maxIterations: juliaParams.maxIterations,
            scale: juliaParams.scale,
            escapeRadius: juliaParams.escapeRadius,
            center: { x: canvas_width / 2, y: canvas_height / 2 },
            colorMode: colorMode
        });
    }
    
    // Set up event listeners
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('wheel', onMouseWheel);
    
    // Setup dat.gui
    setupGUI(isUsingWebGL);
    
    // Set initial center point
    juliaParams.center = { x: canvas_width / 2, y: canvas_height / 2 };
    
    if (isUsingWebGL) {
        webglRenderer.setCenter(juliaParams.center.x, juliaParams.center.y);
    } else {
        juliaSet.setCenter(juliaParams.center.x, juliaParams.center.y);
    }
    
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
    // Keep scale within reasonable bounds
    config.scale = Math.max(50, Math.min(5000, config.scale));
    juliaParams.scale = config.scale;
    
    // Update the renderer directly
    const { isWebGL } = getCanvasContext();
    if (isWebGL && webglRenderer) {
        webglRenderer.updateParams({ scale: config.scale });
    } else if (juliaSet) {
        // This line was missing - directly update the juliaSet params
        juliaSet.params.scale = config.scale;
    }
    
    // Update the GUI slider - more robust way to find the right controller
    if (gui && gui.__folders['Render Settings']) {
        for (let controller of Object.values(gui.__folders['Render Settings'].__controllers)) {
            if (controller.property === 'scale') {
                controller.updateDisplay();
                break;
            }
        }
    }
    
    show = true; // Ensure we redraw
    updateJuliaSet();
}

// Add this new helper function to update all controllers
function updateAllControllers() {
    if (!gui) return;
    
    // Update all controllers
    for (let controller of Object.values(gui.__controllers)) {
        if (typeof controller.property === 'string' && 
            (controller.property in config) && 
            controller.property !== 'presets' && 
            controller.property !== 'useWebGL') {
            controller.updateDisplay();
        }
    }
    
    // Also update any controllers in folders
    for (let folder of Object.values(gui.__folders)) {
        for (let controller of Object.values(folder.__controllers)) {
            if (typeof controller.property === 'string' && 
                (controller.property in config) && 
                controller.property !== 'presets' && 
                controller.property !== 'useWebGL') {
                controller.updateDisplay();
            }
        }
    }
}

// Update the GUI setup to include WebGL option
function setupGUI(isUsingWebGL) {
    gui = new dat.GUI({ width: 300 });
    
    // Add WebGL toggle (requires page reload)
    gui.add(config, 'useWebGL').name('Use WebGL (reload page)').onChange(function() {
        // Simply alert the user they need to reload
        alert('Please reload the page to switch rendering modes');
    });
    
    // Color mode
    gui.add(config, 'colorMode', ['colorful', 'blackwhite']).name('Color Mode').onChange(function(value) {
        colorMode = value;
        if (isUsingWebGL) {
            webglRenderer.setColorMode(value);
        } else {
            juliaSet.setColorMode(value);
        }
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
        
        // Force a complete update with the new maxIterations
        const { isWebGL } = getCanvasContext();
        if (isWebGL && webglRenderer) {
            // Ensure we explicitly set the value in the params
            webglRenderer.params.maxIterations = value;
            // Force full update and redraw
            show = true;
        } else if (juliaSet) {
            juliaSet.params.maxIterations = value;
            // Force redraw
            show = true;
        }
        
        updateJuliaSet();
    });
    
    // Fixed scale controller (removed duplicate)
    const scaleController = renderFolder.add(config, 'scale', 50, 1000, 1).name('Scale').onChange(function(value) {
        juliaParams.scale = value;
        if (isUsingWebGL) {
            webglRenderer.updateParams({ scale: value });
        } else {
            juliaSet.params.scale = value;
        }
        updateJuliaSet();
    });
    
    gui.add(config, 'presets', Object.keys(presets)).name('Presets').onChange(function(preset) {
        const params = presets[preset];
        config.realPart = params.re;
        config.imaginaryPart = params.im;
        
        // Update the Julia parameter
        juliaParams.c = new Complex(config.realPart, config.imaginaryPart);
        
        // Update renderers
        const { isWebGL } = getCanvasContext();
        if (isWebGL && webglRenderer) {
            webglRenderer.updateParams({ c: juliaParams.c });
        } else if (juliaSet) {
            juliaSet.params.c = juliaParams.c;
        }
        
        // Update all relevant controllers
        if (gui.__folders['Complex Parameter (c)']) {
            for (let controller of Object.values(gui.__folders['Complex Parameter (c)'].__controllers)) {
                if (controller.property === 'realPart' || controller.property === 'imaginaryPart') {
                    controller.updateDisplay();
                }
            }
        }
        
        updateJuliaSet();
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
    
    // Add WebGL-specific options if using WebGL
    if (isUsingWebGL) {
        const webglFolder = gui.addFolder('WebGL Options');
        const webglConfig = {
            maxIterationsHigh: 1000,
            applyHighIterations: function() {
                const newValue = webglConfig.maxIterationsHigh;
                juliaParams.maxIterations = newValue;
                config.maxIterations = newValue;
                
                // Ensure we explicitly set the value in the renderer
                webglRenderer.params.maxIterations = newValue;
                
                // Update main iterations slider
                for (let controller of Object.values(gui.__folders['Render Settings'].__controllers)) {
                    if (controller.property === 'maxIterations') {
                        controller.updateDisplay();
                    }
                }
                
                // Force a redraw
                show = true;
                updateJuliaSet();
            }
        };
        
        webglFolder.add(webglConfig, 'maxIterationsHigh', 100, 5000, 100)
            .name('High Iterations');
        webglFolder.add(webglConfig, 'applyHighIterations')
            .name('Apply High Iterations');
    }
}

function updateJuliaParameter() {
    juliaParams.c = new Complex(config.realPart, config.imaginaryPart);
    
    const { isWebGL } = getCanvasContext();
    if (isWebGL && webglRenderer) {
        webglRenderer.updateParams({ c: juliaParams.c });
    } else if (juliaSet) {
        juliaSet.params.c = juliaParams.c;
    }
    
    updateJuliaSet();
}

// Modify the updateJuliaSet function to properly handle WebGL changes
function updateJuliaSet() {
    const { isWebGL } = getCanvasContext();
    
    // Ensure we clear and redraw when parameters change
    clearCanvas(colorMode);
    
    if (isWebGL && webglRenderer) {
        // Force WebGL to update all uniforms on each redraw
        webglRenderer.updateParams({
            c: juliaParams.c,
            maxIterations: juliaParams.maxIterations,
            scale: juliaParams.scale,
            colorMode: colorMode
        });
        webglRenderer.draw();
    } else if (juliaSet) {
        juliaSet.draw();
    }
}

// Update the mouse click handler
function onMouseClick(event) {
    juliaParams.center = { x: event.clientX, y: event.clientY };
    
    const { isWebGL } = getCanvasContext();
    if (isWebGL && webglRenderer) {
        webglRenderer.setCenter(event.clientX, event.clientY);
    } else if (juliaSet) {
        juliaSet.setCenter(event.clientX, event.clientY);
        // Ensure scale is consistent here too
        juliaSet.params.scale = config.scale;
    }
    
    show = true;
    updateJuliaSet();
}

// Update the loop function to ensure it clears properly
function Loop() {
   // Since Julia sets only need to be redrawn when parameters change,
   // we can optimize this function to do less work

   // Cancel the previous animation frame
   if (animationID) {
       cancelAnimationFrame(animationID);
   }
   
   // Request a new frame (we keep this to handle any future animations if needed)
   animationID = requestAnimationFrame(() => {
       // Only update initially or when parameters have changed
       if (show) {
           updateJuliaSet();
           
           // Once drawn, no need to redraw until parameters change
           show = false;
       }
   });
}

// Initial draw
updateJuliaSet();
