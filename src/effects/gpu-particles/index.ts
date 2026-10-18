import { BaseEffect, EffectContext } from '../../framework/effect';
import { ShaderProgram } from '../../core/program';
import { FolderApi } from 'tweakpane';
import vertSource from './shader.vert';
import fragSource from './shader.frag';

export class GpuParticlesEffect extends BaseEffect {
  public readonly id = 'gpu-particles';
  public readonly title = 'GPU Instanced 100k Particles';
  public readonly description = 'Zero-CPU 100,000 particle simulation powered by curl noise and cursor radial field.';

  private program: ShaderProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vboOrigin: WebGLBuffer | null = null;
  private vboSeed: WebGLBuffer | null = null;

  public readonly particleCount: number = 100000;

  public params = {
    pointSize: 4.0,
    noiseScale: 0.8,
    repelRadius: 0.65,
    repelStrength: 0.45
  };

  public init(ctx: EffectContext): void {
    const gl = ctx.gl;
    this.program = new ShaderProgram(gl, vertSource, fragSource);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Failed to create particle VAO');
    this.vao = vao;

    gl.bindVertexArray(this.vao);

    // Initialize 100k particle positions on a 3D volume
    const origins = new Float32Array(this.particleCount * 3);
    const seeds = new Float32Array(this.particleCount * 2);

    for (let i = 0; i < this.particleCount; i++) {
      const idx3 = i * 3;
      const idx2 = i * 2;

      // Random distribution within [-1.5, 1.5]
      origins[idx3 + 0] = (Math.random() - 0.5) * 3.0;
      origins[idx3 + 1] = (Math.random() - 0.5) * 3.0;
      origins[idx3 + 2] = (Math.random() - 0.5) * 2.0;

      seeds[idx2 + 0] = Math.random();
      seeds[idx2 + 1] = Math.random();
    }

    // Buffer 1: Origins (location = 0)
    this.vboOrigin = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboOrigin);
    gl.bufferData(gl.ARRAY_BUFFER, origins, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Buffer 2: Seeds (location = 1)
    this.vboSeed = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboSeed);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public resize(_width: number, _height: number, _dpr: number): void {}

  public render(ctx: EffectContext): void {
    if (!this.program || !this.vao) return;

    const gl = ctx.gl;

    // Enable additive blending for glowing particle cloud
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    this.program.use();
    this.program.setFloat('u_time', ctx.time);
    this.program.setVec2('u_resolution', ctx.width, ctx.height);
    this.program.setVec2('u_mouse', ctx.mouse.x, ctx.mouse.y);
    this.program.setFloat('u_pointSize', this.params.pointSize * ctx.dpr);
    this.program.setFloat('u_noiseScale', this.params.noiseScale);
    this.program.setFloat('u_repelRadius', this.params.repelRadius);
    this.program.setFloat('u_repelStrength', this.params.repelStrength);

    ctx.mathLut.bind(0);
    this.program.setInt('u_curveLut', 0);

    // Single draw call for 100,000 points
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
    gl.bindVertexArray(null);

    // Restore standard blending
    gl.disable(gl.BLEND);
  }

  public setupGui(folder: FolderApi): void {
    folder.addBinding(this.params, 'pointSize', { min: 1.0, max: 12.0, step: 0.5, label: 'Point Size' });
    folder.addBinding(this.params, 'noiseScale', { min: 0.1, max: 2.5, step: 0.05, label: 'Curl Frequency' });
    folder.addBinding(this.params, 'repelRadius', { min: 0.1, max: 1.5, step: 0.05, label: 'Cursor Radius' });
    folder.addBinding(this.params, 'repelStrength', { min: 0.0, max: 1.5, step: 0.05, label: 'Repel Force' });
  }

  public dispose(): void {
    const gl = this.program?.gl;
    if (this.program) {
      this.program.dispose();
      this.program = null;
    }
    if (gl && this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
    if (gl && this.vboOrigin) {
      gl.deleteBuffer(this.vboOrigin);
      this.vboOrigin = null;
    }
    if (gl && this.vboSeed) {
      gl.deleteBuffer(this.vboSeed);
      this.vboSeed = null;
    }
  }
}
