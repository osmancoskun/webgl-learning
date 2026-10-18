# WebGL2 Learning Lab

A clean, zero-dependency WebGL2 playground and learning project built with Vite, TypeScript, and raw GLSL 300 es. No Three.js, no external 3D libraries—just direct GPU rendering focused on high performance and smooth visuals.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What's Inside

- **No 3D Frameworks:** Built directly with the native WebGL2 API (`gl.*`).
- **Zero-GC Render Loop:** Zero object allocations during rendering to avoid garbage collection frame drops.
- **GLSL 300 es & VAO:** Modern shader standards and pre-configured Vertex Array Objects for clean state management.
- **Interactive Cartesian Graph:** A live 2D $+X, -X, +Y, -Y$ graph allowing you to tweak math functions ($f(x)$) via GUI and send them directly to shaders through a 1D Float32 texture LUT (`u_curveLut`).
- **Live Performance Stats:** Real-time FPS, frame time (ms), and resolution display.

---

## Effects

1. **Domain-Warp Fluid Gradient** (`src/effects/fluid-gradient/`)
   - Smooth, organic background effect using Fractional Brownian Motion (fBm) and domain warping.
   - [Read documentation](src/effects/fluid-gradient/README.md)

2. **GPU Instanced 100k Particles** (`src/effects/gpu-particles/`)
   - 100,000 points animated entirely on the GPU with 3D curl noise and cursor physics.
   - [Read documentation](src/effects/gpu-particles/README.md)

3. **Liquid Image & Distortion** (`src/effects/liquid-image/`)
   - Interactive ripple and chromatic aberration displacement reacting to mouse speed.
   - [Read documentation](src/effects/liquid-image/README.md)

4. **Raymarched SDF Morphing** (`src/effects/raymarching-sdf/`)
   - Mathematical 3D shapes merging smoothly via Sphere Tracing and Blinn-Phong lighting without 3D models.
   - [Read documentation](src/effects/raymarching-sdf/README.md)

---

## Controls & Interaction

- **Effect Switcher:** Select any effect from the top dropdown in the controls panel.
- **Mouse / Touch:** Move your cursor across the screen to interact with the active effect (waves, particle repulsion, rotation).
- **Cartesian Math Controls:**
  - Choose a shaping function (Linear, Smoothstep, Sine, Damped Wave, Gaussian, or Custom).
  - Adjust Frequency, Amplitude, and Damping to see the curve and shader change in real time.
- **Effect Parameters:** Fine-tune speed, colors, particles, or lighting under each effect's folder.

---

## Project Structure

```text
src/
├── core/         # WebGL2 context, shader compiler, VAO quad, FBO, textures
├── math/         # Cartesian 2D canvas graph, math evaluator, 1D texture LUT
├── framework/    # BaseEffect lifecycle and EffectManager
├── effects/      # Individual effects with GLSL shaders and docs
├── ui/           # Tweakpane dashboard and FPS telemetry
└── main.ts       # Application entry point
```
