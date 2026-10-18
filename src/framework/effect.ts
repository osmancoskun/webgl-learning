import { FolderApi } from 'tweakpane';
import { MathLut } from '../math/lut';
import { MathFunctionState } from '../math/evaluator';

/**
 * Shared context passed to effects on every frame.
 * All vectors and structs are pre-allocated to guarantee zero garbage collection.
 */
export interface EffectContext {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
  time: number;
  deltaTime: number;
  frame: number;
  mouse: {
    x: number;       // Normalized [0, 1]
    y: number;       // Normalized [0, 1]
    targetX: number; // Target for lerp smoothing
    targetY: number;
    vx: number;      // Velocity
    vy: number;
    isDown: boolean;
  };
  mathLut: MathLut;
  mathState: MathFunctionState;
}

/**
 * Base abstract class defining the lifecycle of a WebGL effect.
 */
export abstract class BaseEffect {
  public abstract readonly id: string;
  public abstract readonly title: string;
  public abstract readonly description: string;

  /**
   * Initializes GPU resources (programs, buffers, textures, VAOs).
   */
  public abstract init(ctx: EffectContext): void | Promise<void>;

  /**
   * Called when viewport or canvas size changes.
   */
  public abstract resize(width: number, height: number, dpr: number): void;

  /**
   * Draws the effect for the current frame.
   * MUST NOT perform new allocations in this method.
   */
  public abstract render(ctx: EffectContext): void;

  /**
   * Mounts effect-specific parameter controls onto the Tweakpane folder.
   */
  public abstract setupGui(folder: FolderApi): void;

  /**
   * Cleans up all GPU resources to prevent VRAM memory leaks.
   */
  public abstract dispose(): void;
}
