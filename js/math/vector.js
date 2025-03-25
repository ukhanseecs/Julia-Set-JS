export class Vec2d {
    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export function add(a, b) { 
    return new Vec2d(a.x + b.x, a.y + b.y); 
}

export function subtract(a, b) { 
    return new Vec2d(a.x - b.x, a.y - b.y); 
}

export function dotProduct(a, b) { 
    return (a.x * b.x + a.y * b.y); 
}

export function magnitude(a) { 
    return Math.sqrt((a.x * a.x) + (a.y * a.y) + (a.z * a.z));
}

export function multiply(a, scalar) {
    return new Vec2d(a.x * scalar, a.y * scalar, a.z * scalar);
}

export function normalize(a) {
    const mag = magnitude(a);
    return new Vec2d(a.x / mag, a.y / mag, a.z / mag);
}