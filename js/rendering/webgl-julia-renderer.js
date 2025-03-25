import { Complex } from '../math/complex.js';

export class WebGLJuliaRenderer {
    constructor(canvas, params) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        this.params = { ...params };
        this.initShaders();
        this.initBuffers();
    }
    
    initShaders() {
        // Vertex shader - just passes coordinates
        const vertexShaderSource = `
            attribute vec2 aPosition;
            
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;
        
        // Fragment shader - calculates Julia set
        const fragmentShaderSource = `
            precision highp float;
            
            uniform vec2 uResolution;
            uniform vec2 uComplex;
            uniform vec2 uCenter;
            uniform float uScale;
            uniform int uMaxIterations;
            uniform int uColorMode;
            
            // HSL to RGB conversion for smooth coloring
            vec3 hsl2rgb(float h, float s, float l) {
                float c = (1.0 - abs(2.0 * l - 1.0)) * s;
                float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
                float m = l - c/2.0;
                
                vec3 rgb;
                if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
                else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
                else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
                else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
                else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
                else rgb = vec3(c, 0.0, x);
                
                return rgb + vec3(m);
            }
            
            void main() {
                // Convert pixel coordinates to complex plane
                vec2 p = (gl_FragCoord.xy - uCenter) / uScale;
                
                // Initial z value is the point in complex plane
                vec2 z = p;
                float escapeRadius = 4.0; // escape radius squared
                
                int iterations = 0;
                
                // Julia set iteration z = z² + c
                for (int i = 0; i < 1000; i++) { // High limit, will break when needed
                    if (i >= uMaxIterations) {
                        iterations = uMaxIterations;
                        break;
                    }
                    
                    // Complex multiplication: (a+bi)² = a² - b² + 2abi
                    float zReal = z.x * z.x - z.y * z.y + uComplex.x;
                    float zImag = 2.0 * z.x * z.y + uComplex.y;
                    
                    z = vec2(zReal, zImag);
                    
                    // Check if point escapes
                    if (dot(z, z) > escapeRadius) {
                        iterations = i;
                        break;
                    }
                }
                
                // Coloring
                if (iterations == uMaxIterations) {
                    // Point is in set
                    gl_FragColor = uColorMode == 0 ? 
                        vec4(0.0, 0.0, 0.0, 1.0) : // Black for colorful mode
                        vec4(1.0, 1.0, 1.0, 1.0);  // White for B&W mode
                } else {
                    // Point escaped
                    if (uColorMode == 0) { // Colorful mode
                        float ratio = float(iterations) / float(uMaxIterations);
                        vec3 rgb = hsl2rgb(ratio, 1.0, 0.5);
                        gl_FragColor = vec4(rgb, 1.0);
                    } else { // B&W mode
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    }
                }
            }
        `;
        
        // Create shader program
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Get uniform locations
        this.uniforms = {
            uResolution: this.gl.getUniformLocation(this.program, 'uResolution'),
            uComplex: this.gl.getUniformLocation(this.program, 'uComplex'),
            uCenter: this.gl.getUniformLocation(this.program, 'uCenter'),
            uScale: this.gl.getUniformLocation(this.program, 'uScale'),
            uMaxIterations: this.gl.getUniformLocation(this.program, 'uMaxIterations'),
            uColorMode: this.gl.getUniformLocation(this.program, 'uColorMode')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    initBuffers() {
        // Create a full-screen quad (two triangles)
        const positions = new Float32Array([
            -1.0, -1.0,  // bottom left
             1.0, -1.0,  // bottom right
            -1.0,  1.0,  // top left
             1.0,  1.0   // top right
        ]);
        
        // Create buffer and load vertices
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // Get attribute location
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'aPosition');
    }
    
    draw() {
        // Set viewport and clear
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(this.params.colorMode === 'blackwhite' ? 0.0 : 1.0, 
                          this.params.colorMode === 'blackwhite' ? 0.0 : 1.0, 
                          this.params.colorMode === 'blackwhite' ? 0.0 : 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Use our program
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.uComplex, this.params.c.re, this.params.c.im);
        this.gl.uniform2f(this.uniforms.uCenter, this.params.center.x, this.params.center.y);
        this.gl.uniform1f(this.uniforms.uScale, this.params.scale);
        this.gl.uniform1i(this.uniforms.uMaxIterations, this.params.maxIterations);
        this.gl.uniform1i(this.uniforms.uColorMode, this.params.colorMode === 'colorful' ? 0 : 1);
        
        // Set up vertex attributes
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            this.positionAttributeLocation,
            2,                // size (components per iteration)
            this.gl.FLOAT,    // type
            false,            // normalize
            0,                // stride
            0                 // offset
        );
        
        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    setCenter(x, y) {
        this.params.center = { x, y };
        return this;
    }
    
    setColorMode(mode) {
        this.params.colorMode = mode;
        return this;
    }
    
    updateParams(params) {
        Object.assign(this.params, params);
        return this;
    }
}