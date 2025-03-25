let canvas, ctx, width, height;

export function initCanvas(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    updateCanvasSize();
    
    window.addEventListener('resize', updateCanvasSize);
    return { canvas, ctx };
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
    return { canvas, ctx, width, height };
}

export function clearCanvas(colorMode) {
    ctx.beginPath();
    ctx.fillStyle = colorMode === "blackwhite" ? "black" : "white";
    ctx.fillRect(0, 0, width, height);
}