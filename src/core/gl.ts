/**
 * WebGL2 Context Manager and Canvas Display Pipeline.
 * Handles DPR capping, canvas resizing, and extension loading.
 */

export interface GLContextOptions {
  alpha?: boolean;
  antialias?: boolean;
  depth?: boolean;
  stencil?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: WebGLPowerPreference;
  maxDpr?: number;
}

export interface WebGLExtensions {
  colorBufferFloat: EXT_color_buffer_float | null;
  textureFloatLinear: OES_texture_float_linear | null;
}

export class GLContext {
  public readonly gl: WebGL2RenderingContext;
  public readonly canvas: HTMLCanvasElement;
  public readonly extensions: WebGLExtensions;
  public width: number = 0;
  public height: number = 0;
  public dpr: number = 1;

  private readonly maxDpr: number;
  private resizeObserver: ResizeObserver | null = null;
  private onResizeCallbacks: Set<(w: number, h: number, dpr: number) => void> = new Set();

  constructor(canvas: HTMLCanvasElement, options: GLContextOptions = {}) {
    this.canvas = canvas;
    this.maxDpr = options.maxDpr ?? 2;

    const gl = canvas.getContext('webgl2', {
      alpha: options.alpha ?? false,
      antialias: options.antialias ?? true,
      depth: options.depth ?? false,
      stencil: options.stencil ?? false,
      premultipliedAlpha: options.premultipliedAlpha ?? true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference ?? 'high-performance'
    });

    if (!gl) {
      throw new Error('WebGL2 is not supported in this browser or hardware.');
    }
    this.gl = gl;

    // Load floating point texture extensions
    this.extensions = {
      colorBufferFloat: gl.getExtension('EXT_color_buffer_float'),
      textureFloatLinear: gl.getExtension('OES_texture_float_linear')
    };

    if (!this.extensions.colorBufferFloat) {
      console.warn('EXT_color_buffer_float is not available. Float FBO rendering might be restricted.');
    }

    this.updateSize();
    this.initResizeObserver();
  }

  public onResize(callback: (w: number, h: number, dpr: number) => void): () => void {
    this.onResizeCallbacks.add(callback);
    return () => this.onResizeCallbacks.delete(callback);
  }

  public updateSize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const displayWidth = Math.floor(this.canvas.clientWidth * dpr);
    const displayHeight = Math.floor(this.canvas.clientHeight * dpr);

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight || this.dpr !== dpr) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.width = displayWidth;
      this.height = displayHeight;
      this.dpr = dpr;

      this.gl.viewport(0, 0, displayWidth, displayHeight);

      for (const cb of this.onResizeCallbacks) {
        cb(displayWidth, displayHeight, dpr);
      }
      return true;
    }
    return false;
  }

  private initResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSize();
      });
      this.resizeObserver.observe(this.canvas);
    } else {
      window.addEventListener('resize', () => this.updateSize());
    }
  }

  public dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.onResizeCallbacks.clear();
  }
}
