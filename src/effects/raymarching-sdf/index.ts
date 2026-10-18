import { BaseEffect, EffectContext } from '../../framework/effect';
import { ShaderProgram } from '../../core/program';
import { FullscreenQuad } from '../../core/quad';
import { FolderApi } from 'tweakpane';
import vertSource from './shader.vert';
import fragSource from './shader.frag';

export class RaymarchingSdfEffect extends BaseEffect {
  public readonly id = 'raymarching-sdf';
  public readonly title = 'Raymarched SDF Morphing';
  public readonly description = 'Geometry-free procedural 3D metaball morphing rendered via Sphere Tracing and Blinn-Phong lighting.';

  private program: ShaderProgram | null = null;
  private quad: FullscreenQuad | null = null;

  public params = {
    smoothBlend: 0.55,
    shininess: 32.0,
    specularStrength: 1.2
  };

  public init(ctx: EffectContext): void {
    const gl = ctx.gl;
    this.program = new ShaderProgram(gl, vertSource, fragSource);
    this.quad = new FullscreenQuad(gl);
  }

  public resize(_width: number, _height: number, _dpr: number): void {}

  public render(ctx: EffectContext): void {
    if (!this.program || !this.quad) return;

    this.program.use();

    // Bind Math LUT to unit 0
    ctx.mathLut.bind(0);
    this.program.setInt('u_curveLut', 0);

    this.program.setFloat('u_time', ctx.time);
    this.program.setVec2('u_resolution', ctx.width, ctx.height);
    this.program.setVec2('u_mouse', ctx.mouse.x, ctx.mouse.y);
    this.program.setFloat('u_smoothBlend', this.params.smoothBlend);
    this.program.setFloat('u_shininess', this.params.shininess);
    this.program.setFloat('u_specularStrength', this.params.specularStrength);

    this.quad.render();
  }

  public setupGui(folder: FolderApi): void {
    folder.addBinding(this.params, 'smoothBlend', { min: 0.1, max: 1.5, step: 0.05, label: 'Metaball Blend' });
    folder.addBinding(this.params, 'shininess', { min: 4.0, max: 128.0, step: 2.0, label: 'Specular Shine' });
    folder.addBinding(this.params, 'specularStrength', { min: 0.0, max: 3.0, step: 0.1, label: 'Highlight Power' });
  }

  public dispose(): void {
    if (this.program) {
      this.program.dispose();
      this.program = null;
    }
    if (this.quad) {
      this.quad.dispose();
      this.quad = null;
    }
  }
}
