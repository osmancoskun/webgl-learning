import { MathEvaluator, MathFunctionState } from './evaluator';

/**
 * 1D Float32 Lookup Texture (LUT) Generator.
 * Uploads evaluated mathematical curve samples into a WebGL2 R32F texture for shader access.
 */

export class MathLut {
  public readonly gl: WebGL2RenderingContext;
  public readonly texture: WebGLTexture;
  public readonly samplesCount: number;
  private readonly buffer: Float32Array;
  private dirty: boolean = true;

  constructor(gl: WebGL2RenderingContext, samplesCount: number = 256) {
    this.gl = gl;
    this.samplesCount = samplesCount;
    this.buffer = new Float32Array(samplesCount);

    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create Math LUT WebGLTexture');
    }
    this.texture = texture;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // Initialize 1D data as Nx1 texture
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F,
      samplesCount,
      1,
      0,
      gl.RED,
      gl.FLOAT,
      this.buffer
    );

    // Linear filtering allows hardware interpolation between sampled curve values
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Updates the texture from the math function state.
   */
  public update(state: MathFunctionState): void {
    const samples = MathEvaluator.sample(state, this.samplesCount, -1, 1);
    this.buffer.set(samples);

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.samplesCount,
      1,
      gl.RED,
      gl.FLOAT,
      this.buffer
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.dirty = false;
  }

  public bind(unit: number = 0): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  public isDirty(): boolean {
    return this.dirty;
  }

  public setDirty(): void {
    this.dirty = true;
  }

  public dispose(): void {
    this.gl.deleteTexture(this.texture);
  }
}
