import { GLContext } from './core/gl';
import { EffectManager } from './framework/manager';
import { AppUi } from './ui/gui';
import { PerformanceStats } from './ui/stats';

// Import All Effects
import { FluidGradientEffect } from './effects/fluid-gradient';
import { GpuParticlesEffect } from './effects/gpu-particles';
import { LiquidImageEffect } from './effects/liquid-image';
import { RaymarchingSdfEffect } from './effects/raymarching-sdf';

async function bootstrap() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #canvas not found in DOM.');
  }

  // 1. Initialize WebGL2 Context with DPR Capping & Extension Loading
  const glContext = new GLContext(canvas, {
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance',
    maxDpr: 2
  });

  // 2. Initialize Effect Manager
  const uiManager = new EffectManager(glContext);

  // 3. Register All Effects
  const fluidGradient = new FluidGradientEffect();
  const gpuParticles = new GpuParticlesEffect();
  const liquidImage = new LiquidImageEffect();
  const raymarchingSdf = new RaymarchingSdfEffect();

  uiManager.registerEffect(fluidGradient);
  uiManager.registerEffect(gpuParticles);
  uiManager.registerEffect(liquidImage);
  uiManager.registerEffect(raymarchingSdf);

  // 4. Initialize UI Dashboard (Tweakpane + Cartesian Graph)
  const appUi = new AppUi(uiManager);
  uiManager.pane = appUi.pane;

  // 5. Initialize Performance Monitor (FPS & Frame-Time)
  const stats = new PerformanceStats();
  glContext.onResize((w, h, dpr) => {
    stats.update(w, h, dpr);
  });

  // Hook stats into requestAnimationFrame loop
  const originalStart = uiManager.start.bind(uiManager);
  uiManager.start = () => {
    originalStart();
    const statsLoop = () => {
      stats.update(glContext.width, glContext.height, glContext.dpr);
      requestAnimationFrame(statsLoop);
    };
    requestAnimationFrame(statsLoop);
  };

  // 6. Mount default effect
  await uiManager.switchEffect(fluidGradient.id);

  // 7. Start render loop
  uiManager.start();

  console.log('WebGL2 Learning Environment running smoothly at 120 FPS.');
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((err) => {
    console.error('Fatal initialization error:', err);
  });
});
