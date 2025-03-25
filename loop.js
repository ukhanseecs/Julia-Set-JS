// Make sure Complex class is defined first
class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }
    
    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
    
    multiply(b) {
        return new Complex(
            this.re * b.re - this.im * this.im,
            this.re * b.im + this.im * b.re
        );
    }
    
    add(b) {
        return new Complex(
            this.re + b.re,
            this.im + b.im
        );
    }
}

let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;

let canvas_width = window.innerWidth;
let canvas_height=window.innerHeight;

// These appear to be undeclared globals
let mouse_x, mouse_y;

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
    // Get the canvas element and add click handler
    const canvas = document.getElementById('canvas1');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    canvas.addEventListener('click', onMouseClick);
    
    // Add wheel event listener for zooming
    canvas.addEventListener('wheel', function(event) {
        event.preventDefault(); // Prevent page scrolling
        
        // Get mouse position
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
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
    });
    
    // Setup dat.gui
    setupGUI();
    
    // Set initial center point
    juliaParams.center = { x: canvas_width / 2, y: canvas_height / 2 };
    
    // Create a first Julia set when page loads
    show = true;
    updateJuliaSet();
});

function setupGUI() {
    gui = new dat.GUI({ width: 300 });
    
    // Color mode
    gui.add(config, 'colorMode', ['colorful', 'blackwhite']).name('Color Mode').onChange(function(value) {
        colorMode = value;
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
        updateJuliaSet();
    });
    renderFolder.add(config, 'scale', 50, 1000, 1).name('Scale').onChange(function(value) {
        juliaParams.scale = value;
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
    updateJuliaSet();
}

function updateJuliaSet() {
    DrawJuliaSet(juliaParams.c, juliaParams.maxIterations, juliaParams.scale);
}

function onMouseClick(event) {
    juliaParams.center = { x: event.clientX, y: event.clientY };
    show = true;
    updateJuliaSet();
}

function IsInJuliaSet(c, x, y, maxIterations, scale){
    // Create z directly with the scaled coordinates
    let z = new Complex((x - juliaParams.center.x) / scale, (y - juliaParams.center.y) / scale);

    for(let i = 0; i < maxIterations; i++){
        z = z.multiply(z).add(c);
        if(z.abs() > juliaParams.escapeRadius){
            return i;
        }
    }
    return maxIterations;
}

function getColor(iterations, maxIterations) {
    // Black & white mode
    if (colorMode === "blackwhite") {
        if (iterations === maxIterations) {
            return [255, 255, 255, 255]; // White for points in the set
        } else {
            return [0, 0, 0, 255]; // Black for points outside the set
        }
    }
    
    // Colorful mode (original implementation)
    if (iterations === maxIterations) return [0, 0, 0, 255]; // Black for set
    
    // Map iteration count to a smooth color gradient
    const hue = 360 * iterations / maxIterations;
    const saturation = 100;
    const lightness = 50;
    
    // Convert HSL to RGB (simplified example)
    const rgb = hslToRgb(hue, saturation, lightness);
    return [...rgb, 255]; // RGB with alpha
}

// Add this helper function
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function DrawJuliaSet(c, maxIterations, scale){
    const imageData = ctx.createImageData(canvas_width, canvas_height);
    const data = imageData.data;
    
    // Set background color based on mode
    const backgroundColor = colorMode === "blackwhite" ? 0 : 255; // Black bg for B&W mode, white for colorful
    
    for(let y = 0; y < canvas_height; y++){
        for(let x = 0; x < canvas_width; x++){
            let iterations = IsInJuliaSet(c, x, y, maxIterations, scale);
            const colorValues = getColor(iterations, maxIterations);
            const index = (y * canvas_width + x) * 4;
            data[index] = colorValues[0];
            data[index + 1] = colorValues[1];
            data[index + 2] = colorValues[2];
            data[index + 3] = colorValues[3];
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function Loop(){
   animationID = requestAnimationFrame(Loop);

   let msNow = window.performance.now();
   let dt = msNow - msPrev;

   if(dt < msPerFrame) return;
   
   // Fix timing logic
   let excessTime = dt % msPerFrame;
   msPrev = msNow - excessTime;
   dt = dt / 1000;
  
   // Clear screen
   ctx.beginPath();
   ctx.fillStyle = colorMode === "blackwhite" ? "black" : "white";
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   // Update Julia set to always use the current parameter values
   if (show){
        updateJuliaSet();
   } 
}

Loop();
