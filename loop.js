let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;

let canvas_width = window.innerWidth;
let canvas_height=window.innerHeight;

let show = false
addEventListener('click', function(event) {
    mouse_x = event.clientX;
    mouse_y = event.clientY;
    show = true
});

const escapeRadius = 2;
function IsInJuliaSet(c, x, y, maxIterations, scale){
    // Create z directly with the scaled coordinates
    let z = new Complex((x - mouse_x) / scale, (y - mouse_y) / scale);

    for(let i = 0; i < maxIterations; i++){
        z = z.multiply(z).add(c);
        if(z.abs() > escapeRadius){
            return i;
        }
    }
    return maxIterations;
}

function DrawJuliaSet(c, maxIterations, scale){
    const imageData = ctx.createImageData(canvas_width, canvas_height);
    const data = imageData.data;
    
    for(let y = 0; y < canvas_height; y++){
        for(let x = 0; x < canvas_width; x++){
            let iterations = IsInJuliaSet(c, x, y, maxIterations, scale);
            let color = Math.floor(iterations / maxIterations * 255);
            
            const index = (y * canvas_width + x) * 4;
            data[index] = color;     // R
            data[index + 1] = color; // G
            data[index + 2] = color; // B
            data[index + 3] = 255;   // A (fully opaque)
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
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   // make_checkerboard();

   // Draw Julia set if enabled
   if (show){
        DrawJuliaSet(new Complex(-0.8, 0.156), 100, 300);
   } 
}

Loop();
