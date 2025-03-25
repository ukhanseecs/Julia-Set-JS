import { Complex } from '../math/complex.js';
import { getJuliaColor } from '../rendering/colors.js';
import { getCanvasContext } from '../rendering/canvas.js';

export class JuliaSet {
    constructor(config = {}) {
        this.params = {
            c: new Complex(-0.8, 0.156),
            maxIterations: 100,
            scale: 300,
            escapeRadius: 2,
            center: { x: 0, y: 0 },
            colorMode: "colorful",
            ...config
        };
    }
    
    setCenter(x, y) {
        this.params.center = { x, y };
        return this;
    }
    
    setColorMode(mode) {
        this.params.colorMode = mode;
        return this;
    }
    
    calculateIterations(x, y) {
        const { c, maxIterations, scale, escapeRadius, center } = this.params;
        let z = new Complex((x - center.x) / scale, (y - center.y) / scale);

        for(let i = 0; i < maxIterations; i++) {
            z = z.multiply(z).add(c);
            if(z.abs() > escapeRadius) {
                return i;
            }
        }
        return maxIterations;
    }
    
    draw() {
        const { ctx, width, height } = getCanvasContext();
        const { maxIterations, colorMode } = this.params;
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                let iterations = this.calculateIterations(x, y);
                const colorValues = getJuliaColor(iterations, maxIterations, colorMode);
                const index = (y * width + x) * 4;
                data[index] = colorValues[0];
                data[index + 1] = colorValues[1];
                data[index + 2] = colorValues[2];
                data[index + 3] = colorValues[3];
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return this;
    }
}