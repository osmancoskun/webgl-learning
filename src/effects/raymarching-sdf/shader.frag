#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_smoothBlend;
uniform float u_shininess;
uniform float u_specularStrength;
uniform sampler2D u_curveLut;

// 2D Rotation Matrix
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// Signed Distance Function: Sphere
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// Signed Distance Function: Torus
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Signed Distance Function: Box
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Smooth Minimum (Polynomial smin by Inigo Quilez)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Scene Distance Field
float map(vec3 p) {
    float t = u_time * 0.8;

    // Interactive mouse rotation
    vec2 m = (u_mouse - 0.5) * 3.14159;
    p.yz *= rot(-m.y * 0.7);
    p.xz *= rot(-m.x * 0.7);

    // Primary central sphere
    vec3 pSphere = p;
    pSphere.y += sin(t * 1.5) * 0.25;
    float d1 = sdSphere(pSphere, 0.75);

    // Rotating orbiting torus
    vec3 pTorus = p;
    pTorus.xy *= rot(t * 1.2);
    pTorus.yz *= rot(t * 0.7);
    float d2 = sdTorus(pTorus, vec2(1.15, 0.25));

    // Morphing secondary metaball
    vec3 pMorph = p;
    pMorph.x += cos(t * 2.0) * 0.9;
    pMorph.z += sin(t * 2.0) * 0.9;
    float d3 = sdSphere(pMorph, 0.35);

    // Sample Shaping Curve from Math LUT to modulate blending softness
    float lutFactor = texture(u_curveLut, vec2(clamp(u_smoothBlend, 0.0, 1.0), 0.5)).r;
    float dynamicBlend = max(0.05, u_smoothBlend * (0.8 + lutFactor * 0.4));

    float blend = smin(d1, d2, dynamicBlend);
    return smin(blend, d3, dynamicBlend);
}

// Normal Calculation via Finite Differences (Tetrahedron technique)
vec3 calcNormal(vec3 p) {
    const float h = 0.001;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * map(p + k.xyy * h) +
        k.yyx * map(p + k.yyx * h) +
        k.yxy * map(p + k.yxy * h) +
        k.xxx * map(p + k.xxx * h)
    );
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

    // Camera setup
    vec3 ro = vec3(0.0, 0.0, -3.5); // Ray origin
    vec3 rd = normalize(vec3(uv, 1.6)); // Ray direction

    // Sphere Tracing loop
    float t = 0.0;
    const float tMax = 12.0;
    const int maxSteps = 80;
    bool hit = false;
    vec3 p = ro;

    for (int i = 0; i < maxSteps; i++) {
        p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) {
            hit = true;
            break;
        }
        if (t > tMax) break;
        t += d;
    }

    vec3 col = vec3(0.05, 0.07, 0.09); // Dark background

    if (hit) {
        vec3 n = calcNormal(p);
        vec3 lightPos1 = vec3(2.5, 3.0, -2.5);
        vec3 lightDir1 = normalize(lightPos1 - p);

        vec3 lightPos2 = vec3(-3.0, -1.5, -2.0);
        vec3 lightDir2 = normalize(lightPos2 - p);

        // Diffuse lighting
        float diff1 = max(dot(n, lightDir1), 0.0);
        float diff2 = max(dot(n, lightDir2), 0.0);

        // Blinn-Phong Specular
        vec3 viewDir = normalize(ro - p);
        vec3 halfDir1 = normalize(lightDir1 + viewDir);
        float spec1 = pow(max(dot(n, halfDir1), 0.0), u_shininess) * u_specularStrength;

        // Fresnel Rim Glow
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

        // Dynamic iridescent coloring
        vec3 baseColor = mix(vec3(0.1, 0.4, 0.95), vec3(0.95, 0.2, 0.6), (n.y + 1.0) * 0.5);
        vec3 lightColor1 = vec3(1.0, 0.9, 0.8);
        vec3 lightColor2 = vec3(0.3, 0.7, 1.0);

        col = baseColor * 0.15 // Ambient
            + baseColor * diff1 * lightColor1
            + lightColor2 * diff2 * 0.4
            + vec3(1.0) * spec1
            + vec3(0.4, 0.8, 1.0) * fresnel * 0.6;
    }

    // Gamma correction
    col = pow(col, vec3(0.4545));
    fragColor = vec4(col, 1.0);
}
