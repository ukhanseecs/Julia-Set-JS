export function hslToRgb(h, s, l) {
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

export function getJuliaColor(iterations, maxIterations, colorMode) {
    // Black & white mode
    if (colorMode === "blackwhite") {
        if (iterations === maxIterations) {
            return [255, 255, 255, 255]; // White for points in the set
        } else {
            return [0, 0, 0, 255]; // Black for points outside the set
        }
    }
    
    // Colorful mode
    if (iterations === maxIterations) return [0, 0, 0, 255]; // Black for set
    
    // Map iteration count to a smooth color gradient
    const hue = 360 * iterations / maxIterations;
    const saturation = 100;
    const lightness = 50;
    
    const rgb = hslToRgb(hue, saturation, lightness);
    return [...rgb, 255]; // RGB with alpha
}