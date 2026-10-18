#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_image;
uniform sampler2D u_curveLut;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_radius;
uniform float u_intensity;
uniform float u_aberration;

void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;

    // Correct aspect ratio for circular distance check
    vec2 aspectUv = uv;
    aspectUv.x *= aspect;
    vec2 aspectMouse = u_mouse;
    aspectMouse.x *= aspect;

    vec2 dir = aspectUv - aspectMouse;
    float dist = length(dir);

    // Sample Shaping Curve from 1D Math LUT based on proximity
    float lutCoord = clamp(dist / max(u_radius, 0.001), 0.0, 1.0);
    float waveShaping = texture(u_curveLut, vec2(lutCoord, 0.5)).r;

    vec2 offset = vec2(0.0);
    if (dist < u_radius) {
        float falloff = (1.0 - dist / u_radius);
        float wave = sin(dist * 25.0 - u_time * 6.0) * 0.05 * waveShaping;
        
        // Displace UVs by mouse velocity momentum + ripple wave
        offset = (normalize(dir) * wave + u_velocity * 0.002) * falloff * u_intensity;
    }

    vec2 displacedUv = uv - offset;

    // Chromatic Aberration (RGB channel offset)
    float r = texture(u_image, displacedUv + offset * u_aberration).r;
    float g = texture(u_image, displacedUv).g;
    float b = texture(u_image, displacedUv - offset * u_aberration).b;

    // Edge boundary softness check
    if (displacedUv.x < 0.0 || displacedUv.x > 1.0 || displacedUv.y < 0.0 || displacedUv.y > 1.0) {
        fragColor = vec4(0.06, 0.08, 0.1, 1.0);
    } else {
        fragColor = vec4(r, g, b, 1.0);
    }
}
