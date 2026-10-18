#version 300 es
precision highp float;

// Per-instance attributes
layout(location = 0) in vec3 a_origin;  // (x, y, z) base grid position
layout(location = 1) in vec2 a_seed;    // random noise seed (phase, speed)

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_pointSize;
uniform float u_noiseScale;
uniform float u_repelRadius;
uniform float u_repelStrength;
uniform sampler2D u_curveLut;

out vec3 v_color;
out float v_distAlpha;

// Simplex-like pseudo 3D noise
vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return -1.0 + 2.0 * fract((p.xxy + p.yxx) * p.zyx);
}

// Curl Noise derived from finite difference of potential
vec3 curlNoise(vec3 p) {
    const float e = 0.05;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p_x0 = hash33(p - dx);
    vec3 p_x1 = hash33(p + dx);
    vec3 p_y0 = hash33(p - dy);
    vec3 p_y1 = hash33(p + dy);
    vec3 p_z0 = hash33(p - dz);
    vec3 p_z1 = hash33(p + dz);

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    return normalize(vec3(x, y, z) / (2.0 * e));
}

void main() {
    float t = u_time * (0.3 + a_seed.y * 0.2);
    vec3 pos = a_origin;

    // Curl noise perturbation
    vec3 noiseVec = curlNoise(pos * u_noiseScale + vec3(0.0, 0.0, t));
    pos += noiseVec * 0.15;

    // Aspect ratio correction for mouse interaction
    float aspect = u_resolution.x / u_resolution.y;
    vec2 mouseScreen = (u_mouse - 0.5) * 2.0;
    mouseScreen.x *= aspect;

    vec2 posScreen = pos.xy;
    posScreen.x *= aspect;

    // Radial distance to cursor
    vec2 diff = posScreen - mouseScreen;
    float dist = length(diff);

    // Sample Shaping Curve from Math LUT based on normalized distance
    float lutCoord = clamp(dist / u_repelRadius, 0.0, 1.0);
    float shapedDamping = texture(u_curveLut, vec2(lutCoord, 0.5)).r;

    // Repulsion force modulated by math curve
    if (dist < u_repelRadius && dist > 0.001) {
        vec2 dir = normalize(diff);
        float force = (1.0 - dist / u_repelRadius) * u_repelStrength * (0.5 + shapedDamping * 0.5);
        pos.xy += dir * force;
    }

    // Perspective projection simulation
    float zDist = pos.z + 2.0;
    gl_Position = vec4(pos.xy / zDist, pos.z * 0.1, 1.0);
    gl_Position.x /= aspect;

    // Size attenuation based on depth and cursor proximity
    gl_PointSize = max(1.0, (u_pointSize / zDist) * (1.0 + (1.0 - clamp(dist, 0.0, 1.0)) * 0.5));

    // Dynamic coloring based on velocity & position
    v_color = mix(
        vec3(0.2, 0.5, 1.0),
        vec3(0.95, 0.35, 0.8),
        clamp((pos.x + 1.0) * 0.5 + noiseVec.y * 0.3, 0.0, 1.0)
    );

    v_distAlpha = clamp(1.2 - (pos.z + 1.0) * 0.4, 0.2, 1.0);
}
