export class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }
    
    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
    
    multiply(b) {
        return new Complex(
            this.re * b.re - this.im * b.im,
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