let canvas, ctx, gl, width, height;
let isWebGL = false;

export function initCanvas(canvasId, useWebGL = false) {
    canvas = document.getElementById(canvasId);
    
    if (useWebGL) {
        try {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                isWebGL = true;
                ctx = null; // We won't use the 2D context when using WebGL
                console.log('Using WebGL renderer');
            } else {
                // Fallback to 2D if WebGL not available
                ctx = canvas.getContext('2d');
                console.warn('WebGL not supported, falling back to Canvas 2D');
            }
        } catch (e) {
            ctx = canvas.getContext('2d');
            console.warn('WebGL error, falling back to Canvas 2D:', e);
        }
    } else {
        ctx = canvas.getContext('2d');
    }
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return { canvas, ctx, gl, isWebGL };
}

export function updateCanvasSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
    
    return { width, height };
}

export function getCanvasContext() {
    return { canvas, ctx, gl, width, height, isWebGL };
}

export function clearCanvas(colorMode) {
    if (isWebGL) {
        if (gl) {
            gl.clearColor(
                colorMode === "blackwhite" ? 0.0 : 1.0,
                colorMode === "blackwhite" ? 0.0 : 1.0,
                colorMode === "blackwhite" ? 0.0 : 1.0,
                1.0
            );
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    } else if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = colorMode === "blackwhite" ? "black" : "white";
        ctx.fillRect(0, 0, width, height);
    }
}