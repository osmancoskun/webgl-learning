/**
 * Fullscreen Quad Geometry (2 Triangles / 4 Vertices).
 * Uses a single pre-configured Vertex Array Object (VAO) to eliminate runtime attribute binding.
 *
 * Clip space coords: [-1, -1] to [1, 1]
 * UV coords: [0, 0] to [1, 1]
 */

export class FullscreenQuad {
  public readonly gl: WebGL2RenderingContext;
  public readonly vao: WebGLVertexArrayObject;
  private readonly vbo: WebGLBuffer;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create WebGLVertexArrayObject');
    }
    this.vao = vao;

    const vbo = gl.createBuffer();
    if (!vbo) {
      throw new Error('Failed to create WebGLBuffer');
    }
    this.vbo = vbo;

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // Quad with 2 triangles (triangle strip format)
    // Layout: [x, y, u, v]
    const vertexData = new Float32Array([
      // Triangle strip order:
      // (-1, 1)  (1, 1)
      // (-1, -1) (1, -1)
      -1.0,  1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0,
       1.0,  1.0, 1.0, 1.0,
       1.0, -1.0, 1.0, 0.0,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;

    // a_position (attribute location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

    // a_uv (attribute location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    // Unbind state
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Renders the fullscreen quad with a single draw call.
   */
  public render(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  public dispose(): void {
    const gl = this.gl;
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.vbo);
  }
}
