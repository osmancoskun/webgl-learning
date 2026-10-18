/**
 * GLSL 300 es Shader Program with line diagnostics and automatic uniform caching.
 * Enforces zero-GC and zero runtime getUniformLocation calls.
 */

export class ShaderProgram {
  public readonly gl: WebGL2RenderingContext;
  public readonly program: WebGLProgram;
  private readonly uniforms: Map<string, WebGLUniformLocation> = new Map();
  private readonly vertexShader: WebGLShader;
  private readonly fragmentShader: WebGLShader;

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;
    this.vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    this.fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create WebGLProgram.');
    }
    this.program = program;

    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader program linking failed:\n${info}`);
    }

    this.cacheUniforms();
  }

  public use(): void {
    this.gl.useProgram(this.program);
  }

  public getUniformLocation(name: string): WebGLUniformLocation | undefined {
    return this.uniforms.get(name);
  }

  public setFloat(name: string, value: number): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniform1f(loc, value);
    }
  }

  public setInt(name: string, value: number): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniform1i(loc, value);
    }
  }

  public setVec2(name: string, x: number, y: number): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniform2f(loc, x, y);
    }
  }

  public setVec3(name: string, x: number, y: number, z: number): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniform3f(loc, x, y, z);
    }
  }

  public setVec4(name: string, x: number, y: number, z: number, w: number): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniform4f(loc, x, y, z, w);
    }
  }

  public setMat3(name: string, matrix: Float32List): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniformMatrix3fv(loc, false, matrix);
    }
  }

  public setMat4(name: string, matrix: Float32List): void {
    const loc = this.uniforms.get(name);
    if (loc !== undefined) {
      this.gl.uniformMatrix4fv(loc, false, matrix);
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error(`Unable to allocate shader of type ${type}`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'Unknown compilation error';
      const formattedDiagnostics = this.formatShaderError(info, source, type);
      gl.deleteShader(shader);
      throw new Error(formattedDiagnostics);
    }

    return shader;
  }

  private formatShaderError(errorLog: string, source: string, type: number): string {
    const typeName = type === this.gl.VERTEX_SHADER ? 'VERTEX SHADER' : 'FRAGMENT SHADER';
    const lines = source.split('\n');

    let output = `\n================== GLSL COMPILATION ERROR [${typeName}] ==================\n`;
    output += `${errorLog}\n`;
    output += `--------------------------- SOURCE CONTEXT ---------------------------\n`;

    // Attempt to extract line numbers from errorLog (format: ERROR: 0:line: message)
    const lineMatches = errorLog.matchAll(/ERROR:\s*\d+:(\d+):/g);
    const failedLines = new Set<number>();
    for (const match of lineMatches) {
      failedLines.add(parseInt(match[1], 10));
    }

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const isError = failedLines.has(lineNum);
      const prefix = isError ? '>>>' : '   ';
      output += `${prefix} ${lineNum.toString().padStart(4, ' ')} | ${line}\n`;
    });

    output += `=======================================================================\n`;
    return output;
  }

  private cacheUniforms(): void {
    const gl = this.gl;
    const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;

    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(this.program, i);
      if (info) {
        // Clean array names e.g. "u_lights[0]" -> "u_lights"
        const cleanName = info.name.replace(/\[0\]$/, '');
        const location = gl.getUniformLocation(this.program, info.name);
        if (location) {
          this.uniforms.set(cleanName, location);
          if (cleanName !== info.name) {
            this.uniforms.set(info.name, location);
          }
        }
      }
    }
  }

  public dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader);
    this.uniforms.clear();
  }
}
