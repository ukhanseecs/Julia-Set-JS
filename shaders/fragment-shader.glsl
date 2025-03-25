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
