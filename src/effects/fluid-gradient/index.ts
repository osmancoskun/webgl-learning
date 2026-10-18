import { BaseEffect, EffectContext } from '../../framework/effect';
import { ShaderProgram } from '../../core/program';
import { FullscreenQuad } from '../../core/quad';
import { FolderApi } from 'tweakpane';
import vertSource from './shader.vert';
import fragSource from './shader.frag';

export class FluidGradientEffect extends BaseEffect {
  public readonly id = 'fluid-gradient';
  public readonly title = 'Domain-Warp Fluid Gradient';
  public readonly description = 'Smooth, generative SaaS hero background driven by fBm domain warping and 1D curve LUT.';

  private program: ShaderProgram | null = null;
  private quad: FullscreenQuad | null = null;

  // Effect parameters object for Tweakpane binding
  public params = {
    speed: 1.0,
    warpIntensity: 3.5,
    colorFrequency: 1.2,
    colorA: { r: 0.5, g: 0.5, b: 0.5 },
    colorB: { r: 0.5, g: 0.5, b: 0.5 },
    colorC: { r: 1.0, g: 1.0, b: 1.0 },
    colorD: { r: 0.0, g: 0.33, b: 0.67 }
  };

  public init(ctx: EffectContext): void {
    const gl = ctx.gl;
    this.program = new ShaderProgram(gl, vertSource, fragSource);
    this.quad = new FullscreenQuad(gl);
  }

  public resize(_width: number, _height: number, _dpr: number): void {
    // Viewport is updated automatically by GLContext
  }

  public render(ctx: EffectContext): void {
    if (!this.program || !this.quad) return;

    this.program.use();

    // Set cached uniforms (Zero runtime lookups)
    this.program.setFloat('u_time', ctx.time);
    this.program.setVec2('u_resolution', ctx.width, ctx.height);
    this.program.setVec2('u_mouse', ctx.mouse.x, ctx.mouse.y);
    this.program.setFloat('u_speed', this.params.speed);
    this.program.setFloat('u_warpIntensity', this.params.warpIntensity);
    this.program.setFloat('u_colorFrequency', this.params.colorFrequency);

    this.program.setVec3('u_colorA', this.params.colorA.r, this.params.colorA.g, this.params.colorA.b);
    this.program.setVec3('u_colorB', this.params.colorB.r, this.params.colorB.g, this.params.colorB.b);
    this.program.setVec3('u_colorC', this.params.colorC.r, this.params.colorC.g, this.params.colorC.b);
    this.program.setVec3('u_colorD', this.params.colorD.r, this.params.colorD.g, this.params.colorD.b);

    // Bind Math LUT to texture unit 0
    ctx.mathLut.bind(0);
    this.program.setInt('u_curveLut', 0);

    // Single draw call
    this.quad.render();
  }

  public setupGui(folder: FolderApi): void {
    folder.addBinding(this.params, 'speed', { min: 0.1, max: 3.0, step: 0.05, label: 'Flow Speed' });
    folder.addBinding(this.params, 'warpIntensity', { min: 0.5, max: 8.0, step: 0.1, label: 'Warp Distortion' });
    folder.addBinding(this.params, 'colorFrequency', { min: 0.2, max: 3.0, step: 0.1, label: 'Color Bands' });

    const colorsFolder = folder.addFolder({ title: 'Palette Modifiers', expanded: false });
    colorsFolder.addBinding(this.params, 'colorA', { label: 'Color Base' });
    colorsFolder.addBinding(this.params, 'colorB', { label: 'Color Amplitude' });
    colorsFolder.addBinding(this.params, 'colorC', { label: 'Color Frequency' });
    colorsFolder.addBinding(this.params, 'colorD', { label: 'Color Phase' });
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
