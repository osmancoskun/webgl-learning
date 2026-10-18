import { BaseEffect, EffectContext } from './effect';
import { GLContext } from '../core/gl';
import { MathLut } from '../math/lut';
import { MathFunctionState } from '../math/evaluator';
import { Pane, FolderApi } from 'tweakpane';

/**
 * Manages active effect lifecycle, seamless hot-swapping, resource disposal, and event dispatch.
 */
export class EffectManager {
  public readonly glContext: GLContext;
  public readonly mathLut: MathLut;
  public readonly mathState: MathFunctionState;

  private readonly effects: Map<string, BaseEffect> = new Map();
  private activeEffect: BaseEffect | null = null;
  private isSwitching: boolean = false;

  private readonly context: EffectContext;
  private readonly pane: Pane;
  private effectFolder: FolderApi | null = null;

  private startTime: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor(glContext: GLContext, pane: Pane) {
    this.glContext = glContext;
    this.pane = pane;

    const gl = glContext.gl;

    // Default mathematical function configuration
    this.mathState = {
      preset: 'sine',
      customExpr: 'sin(x * 3.1415)',
      frequency: 2.0,
      amplitude: 1.0,
      power: 2.0,
      decay: 1.5
    };

    this.mathLut = new MathLut(gl, 256);
    this.mathLut.update(this.mathState);

    // Pre-allocated context state (zero-GC)
    this.context = {
      gl,
      canvas: glContext.canvas,
      width: glContext.width,
      height: glContext.height,
      dpr: glContext.dpr,
      time: 0,
      deltaTime: 0,
      frame: 0,
      mouse: {
        x: 0.5,
        y: 0.5,
        targetX: 0.5,
        targetY: 0.5,
        vx: 0,
        vy: 0,
        isDown: false
      },
      mathLut: this.mathLut,
      mathState: this.mathState
    };

    this.initEvents();

    glContext.onResize((w, h, dpr) => {
      this.context.width = w;
      this.context.height = h;
      this.context.dpr = dpr;
      if (this.activeEffect) {
        this.activeEffect.resize(w, h, dpr);
      }
    });
  }

  public registerEffect(effect: BaseEffect): void {
    this.effects.set(effect.id, effect);
  }

  public getEffects(): BaseEffect[] {
    return Array.from(this.effects.values());
  }

  public getActiveEffect(): BaseEffect | null {
    return this.activeEffect;
  }

  public async switchEffect(id: string): Promise<void> {
    if (this.isSwitching) return;
    const target = this.effects.get(id);
    if (!target) {
      console.warn(`Effect with id "${id}" not found.`);
      return;
    }

    this.isSwitching = true;

    // Dispose previous active effect resources
    if (this.activeEffect) {
      this.activeEffect.dispose();
      this.activeEffect = null;
    }

    // Clear dynamic UI folder
    if (this.effectFolder) {
      this.effectFolder.dispose();
      this.effectFolder = null;
    }

    // Initialize target effect
    await target.init(this.context);
    target.resize(this.context.width, this.context.height, this.context.dpr);

    // Setup GUI parameters for target effect
    this.effectFolder = this.pane.addFolder({
      title: `${target.title} Controls`,
      expanded: true
    });
    target.setupGui(this.effectFolder);

    this.activeEffect = target;
    this.isSwitching = false;
  }

  private initEvents(): void {
    const canvas = this.glContext.canvas;

    window.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const normX = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      const normY = Math.min(Math.max(1.0 - (e.clientY - rect.top) / rect.height, 0), 1);

      this.context.mouse.targetX = normX;
      this.context.mouse.targetY = normY;
    });

    window.addEventListener('pointerdown', () => {
      this.context.mouse.isDown = true;
    });

    window.addEventListener('pointerup', () => {
      this.context.mouse.isDown = false;
    });
  }

  public start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    const loop = (now: number) => {
      const elapsed = (now - this.startTime) * 0.001;
      const dt = Math.min((now - this.lastTime) * 0.001, 0.1);
      this.lastTime = now;

      this.context.time = elapsed;
      this.context.deltaTime = dt;
      this.context.frame = ++this.frameCount;

      // Mouse smoothing (lerp & velocity calculation)
      const prevX = this.context.mouse.x;
      const prevY = this.context.mouse.y;
      this.context.mouse.x += (this.context.mouse.targetX - prevX) * 0.15;
      this.context.mouse.y += (this.context.mouse.targetY - prevY) * 0.15;
      this.context.mouse.vx = (this.context.mouse.x - prevX) / Math.max(dt, 0.001);
      this.context.mouse.vy = (this.context.mouse.y - prevY) / Math.max(dt, 0.001);

      // Render active effect if ready
      if (this.activeEffect && !this.isSwitching) {
        this.activeEffect.render(this.context);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  public dispose(): void {
    if (this.activeEffect) {
      this.activeEffect.dispose();
    }
    this.mathLut.dispose();
    this.glContext.dispose();
  }
}
