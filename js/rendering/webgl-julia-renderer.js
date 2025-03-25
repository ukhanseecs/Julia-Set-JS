import { Complex } from '../math/complex.js';

export class WebGLJuliaRenderer {
    constructor(canvas, params) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        this.params = { ...params };
        this.initialized = false;
        this.pendingDraw = false;
        
        // Start async initialization
        this.init();
    }
    
    async init() {
        try {
            await this.initShaders();
            this.initBuffers();
            this.initialized = true;
            
            // If a draw was requested during initialization, do it now
            if (this.pendingDraw) {
                this.draw();
                this.pendingDraw = false;
            }
        } catch (error) {
            console.error('Failed to initialize WebGL renderer:', error);
        }
    }
    
    async loadShaderFile(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load shader: ${path}`);
        }
        return await response.text();
    }
    
    async initShaders() {
        // Load shaders from external files
        const vertexShaderSource = await this.loadShaderFile('/shaders/vertex-shader.glsl');
        const fragmentShaderSource = await this.loadShaderFile('/shaders/fragment-shader.glsl');
        
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
        // If not initialized yet, mark as pending and return
        if (!this.initialized) {
            this.pendingDraw = true;
            return this;
        }
        
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
        
        return this;
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