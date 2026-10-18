#version 300 es
precision highp float;

in vec3 v_color;
in float v_distAlpha;
out vec4 fragColor;

void main() {
    // Generate circular antialiased point shape from gl_PointCoord
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);
    if (distSq > 0.25) {
        discard;
    }

    // Soft feathered circular edge
    float alpha = smoothstep(0.25, 0.05, distSq) * v_distAlpha;

    // Glowing core
    vec3 col = v_color + vec3(0.3) * (1.0 - distSq * 4.0);
    fragColor = vec4(col, alpha);
}
