#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_speed;
uniform float u_warpIntensity;
uniform float u_colorFrequency;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform vec3 u_colorD;
uniform sampler2D u_curveLut;

// 2D Hash function
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Simplex/Gradient Noise
float noise(vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = step(a.yx, a.xy);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;

    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));

    return dot(n, vec3(70.0));
}

// Fractional Brownian Motion (fBm)
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Inigo Quilez Cosine Palette
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
    float t = u_time * u_speed * 0.15;

    // Interactive mouse displacement
    vec2 mouseNorm = (u_mouse - 0.5) * 2.0;
    vec2 mouseOffset = mouseNorm * 0.25;

    // Domain Warping (2 iterations of fBm)
    // q = f(p), r = f(p + q), pattern = f(p + r)
    vec2 q = vec2(
        fbm(st + vec2(0.0, 0.0) + t * 0.4 + mouseOffset),
        fbm(st + vec2(5.2, 1.3) + t * 0.3)
    );

    vec2 r = vec2(
        fbm(st + 4.0 * q + vec2(1.7, 9.2) + t * 0.25),
        fbm(st + 4.0 * q + vec2(8.3, 2.8) + t * 0.35)
    );

    float f = fbm(st + u_warpIntensity * r);

    // Sample Shaping Curve from 1D Math LUT
    // Normalized sample between [0, 1]
    float lutCoord = clamp((f + 1.0) * 0.5, 0.0, 1.0);
    float shapedFactor = texture(u_curveLut, vec2(lutCoord, 0.5)).r;

    // Modulate color palette using shaped factor
    float colorT = clamp((f + shapedFactor * 0.5) * u_colorFrequency, 0.0, 1.0);
    vec3 col = palette(colorT, u_colorA, u_colorB, u_colorC, u_colorD);

    // Vignette
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
