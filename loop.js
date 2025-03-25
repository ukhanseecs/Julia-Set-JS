let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;

let canvas_width = window.innerWidth;
let canvas_height=window.innerHeight;

// These appear to be undeclared globals
let mouse_x, mouse_y;

let show = false;
// Add color mode tracking
let colorMode = "colorful"; // Default to colorful

addEventListener('click', onMouseClick);

// Add event listener for color mode selection
document.querySelectorAll('input[name="colorMode"]').forEach(input => {
    input.addEventListener('change', function() {
        colorMode = this.value;
        if (show) {
            DrawJuliaSet(juliaParams.c, juliaParams.maxIterations, juliaParams.scale);
        }
    });
});

const juliaParams = {
    c: new Complex(-0.8, 0.156),
    maxIterations: 100,
    scale: 300,
    escapeRadius: 2,
    center: { x: 0, y: 0 }
};

function onMouseClick(event) {
    juliaParams.center = { x: event.clientX, y: event.clientY };
    show = true; // Add this line to enable drawing
    DrawJuliaSet(juliaParams.c, juliaParams.maxIterations, juliaParams.scale); // Pass parameters
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
   // make_checkerboard();

   // Draw Julia set if enabled
   if (show){
        DrawJuliaSet(juliaParams.c, juliaParams.maxIterations, juliaParams.scale);
   } 
}

Loop();
