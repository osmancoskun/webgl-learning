import { BaseEffect, EffectContext } from '../../framework/effect';
import { ShaderProgram } from '../../core/program';
import { FullscreenQuad } from '../../core/quad';
import { TextureUtil } from '../../core/texture';
import { FolderApi } from 'tweakpane';
import vertSource from './shader.vert';
import fragSource from './shader.frag';

export class LiquidImageEffect extends BaseEffect {
  public readonly id = 'liquid-image';
  public readonly title = 'Liquid Image & Hover Distortion';
  public readonly description = 'Interactive fluid ripples and chromatic aberration driven by mouse momentum on imagery.';

  private program: ShaderProgram | null = null;
  private quad: FullscreenQuad | null = null;
  private texture: WebGLTexture | null = null;

  public params = {
    radius: 0.35,
    intensity: 1.2,
    aberration: 0.8
  };

  public init(ctx: EffectContext): void {
    const gl = ctx.gl;
    this.program = new ShaderProgram(gl, vertSource, fragSource);
    this.quad = new FullscreenQuad(gl);

    // Procedural high-contrast checkerboard with colors for immediate displacement clarity
    this.texture = TextureUtil.createProceduralCheckerTexture(gl, 512);
  }

  public resize(_width: number, _height: number, _dpr: number): void {}

  public render(ctx: EffectContext): void {
    if (!this.program || !this.quad || !this.texture) return;

    const gl = ctx.gl;
    this.program.use();

    // Bind image texture to unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.program.setInt('u_image', 0);

    // Bind Math LUT to unit 1
    ctx.mathLut.bind(1);
    this.program.setInt('u_curveLut', 1);

    this.program.setFloat('u_time', ctx.time);
    this.program.setVec2('u_resolution', ctx.width, ctx.height);
    this.program.setVec2('u_mouse', ctx.mouse.x, ctx.mouse.y);
    this.program.setVec2('u_velocity', ctx.mouse.vx, ctx.mouse.vy);
    this.program.setFloat('u_radius', this.params.radius);
    this.program.setFloat('u_intensity', this.params.intensity);
    this.program.setFloat('u_aberration', this.params.aberration);

    this.quad.render();
  }

  public setupGui(folder: FolderApi): void {
    folder.addBinding(this.params, 'radius', { min: 0.1, max: 0.8, step: 0.02, label: 'Ripple Radius' });
    folder.addBinding(this.params, 'intensity', { min: 0.1, max: 3.0, step: 0.05, label: 'Wave Amplitude' });
    folder.addBinding(this.params, 'aberration', { min: 0.0, max: 2.5, step: 0.05, label: 'RGB Split' });
  }

  public dispose(): void {
    const gl = this.program?.gl;
    if (this.program) {
      this.program.dispose();
      this.program = null;
    }
    if (this.quad) {
      this.quad.dispose();
      this.quad = null;
    }
    if (gl && this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
  }
}
