/**
 * Framebuffer Object (FBO) with Float32/Float16 Support and Ping-Pong Double Buffering.
 * Essential for physics, fluid simulations, and high precision render targets.
 */

export interface FBOOptions {
  width: number;
  height: number;
  format?: 'rgba8' | 'rgba16f' | 'rgba32f';
  filter?: 'linear' | 'nearest';
  wrap?: 'clamp' | 'repeat';
}

export class FrameBuffer {
  public readonly gl: WebGL2RenderingContext;
  public width: number;
  public height: number;
  public readonly fbo: WebGLFramebuffer;
  public readonly texture: WebGLTexture;
  private readonly internalFormat: number;
  private readonly format: number;
  private readonly type: number;
  private readonly filter: number;
  private readonly wrap: number;

  constructor(gl: WebGL2RenderingContext, options: FBOOptions) {
    this.gl = gl;
    this.width = options.width;
    this.height = options.height;

    // Resolve texture types and formats based on options
    if (options.format === 'rgba32f') {
      this.internalFormat = gl.RGBA32F;
      this.format = gl.RGBA;
      this.type = gl.FLOAT;
    } else if (options.format === 'rgba16f') {
      this.internalFormat = gl.RGBA16F;
      this.format = gl.RGBA;
      this.type = gl.HALF_FLOAT;
    } else {
      this.internalFormat = gl.RGBA8;
      this.format = gl.RGBA;
      this.type = gl.UNSIGNED_BYTE;
    }

    this.filter = options.filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
    this.wrap = options.wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;

    // Create FBO & Texture
    const fbo = gl.createFramebuffer();
    const texture = gl.createTexture();
    if (!fbo || !texture) {
      throw new Error('Failed to create WebGL Framebuffer or Texture');
    }
    this.fbo = fbo;
    this.texture = texture;

    this.initTexture();
  }

  private initTexture(): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      this.internalFormat,
      this.width,
      this.height,
      0,
      this.format,
      this.type,
      null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer initialization incomplete: status code ${status}`);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  public resize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      this.internalFormat,
      this.width,
      this.height,
      0,
      this.format,
      this.type,
      null
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  public bind(): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.width, this.height);
  }

  public unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public dispose(): void {
    const gl = this.gl;
    gl.deleteFramebuffer(this.fbo);
    gl.deleteTexture(this.texture);
  }
}

/**
 * Ping-Pong Framebuffer pair for iterative GPU computation (Euler fluid, simulations).
 */
export class PingPongBuffer {
  private currentRead: FrameBuffer;
  private currentWrite: FrameBuffer;

  constructor(gl: WebGL2RenderingContext, options: FBOOptions) {
    this.currentRead = new FrameBuffer(gl, options);
    this.currentWrite = new FrameBuffer(gl, options);
  }

  public get read(): FrameBuffer {
    return this.currentRead;
  }

  public get write(): FrameBuffer {
    return this.currentWrite;
  }

  public swap(): void {
    const temp = this.currentRead;
    this.currentRead = this.currentWrite;
    this.currentWrite = temp;
  }

  public resize(width: number, height: number): void {
    this.currentRead.resize(width, height);
    this.currentWrite.resize(width, height);
  }

  public dispose(): void {
    this.currentRead.dispose();
    this.currentWrite.dispose();
  }
}
