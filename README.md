# WebGL2 Learning Lab

A zero-dependency, hardware-accelerated WebGL2 learning platform and high-performance shader laboratory written in strict TypeScript and GLSL 300 es.

---

## Architecture & Core Tenets

1. **Zero External 3D Libraries:** No Three.js, Babylon.js, or OGL. Everything communicates directly with raw WebGL2 API (`gl.*`).
2. **Strict Zero-GC in Hot Loop:** No heap allocations (`new Float32Array`, temporary objects, closures) inside the render loop to prevent Garbage Collector micro-stutters.
3. **VAO Standard:** All geometry attributes, buffers, strides, and instanced divisors are captured in pre-configured Vertex Array Objects. Render calls use a single `gl.bindVertexArray(vao)`.
4. **Shader Diagnostics:** Custom compilation wrapper intercepts GLSL compilation failures and outputs formatted contextual line snippets directly to the developer console.
5. **Interactive Cartesian Plane ($+X, -X, +Y, -Y$):** An interactive 2D graph allowing users to shape mathematical functions ($f(x)$) via Tweakpane which are instantly uploaded into a 1D Float32 texture LUT (`u_curveLut`) to modulate shader behavior in real time.

---

## Effects Gallery

| Effect | Technique | Performance | Documentation |
| :--- | :--- | :--- | :--- |
| **Domain-Warp Fluid Gradient** | Single-pass Fullscreen Quad + 4-octave fBm + Domain Warping | 1 Draw Call, 120 FPS | [Read docs](src/effects/fluid-gradient/README.md) |
| **GPU Instanced 100k Particles** | `gl.drawArrays(POINTS)` + 3D Curl Noise + Radial Cursor Repulsion | 1 Draw Call, 120 FPS | [Read docs](src/effects/gpu-particles/README.md) |
| **Liquid Image & Distortion** | Mouse Velocity Momentum + Refractive Sine Ripples + RGB Aberration | 1 Draw Call, 120 FPS | [Read docs](src/effects/liquid-image/README.md) |
| **Raymarched SDF Morphing** | Sphere Tracing + Continuous Polynomial $smin$ + Blinn-Phong Specular | 1 Draw Call, 120 FPS | [Read docs](src/effects/raymarching-sdf/README.md) |

---

## Development & Build

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript typecheck and production build
npm run build
```
