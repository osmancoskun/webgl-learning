/**
 * Asynchronous Texture Loader with seamless WebGL2 setup and procedural fallbacks.
 */

export interface TextureOptions {
  flipY?: boolean;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  generateMipmaps?: boolean;
}

export class TextureUtil {
  /**
   * Generates a 1x1 colored pixel texture for instant display while images load.
   */
  public static createSolidColorTexture(
    gl: WebGL2RenderingContext,
    r: number,
    g: number,
    b: number,
    a: number = 255
  ): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create solid texture');

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([r, g, b, a])
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * Loads an image from URL and uploads it to a WebGL2 texture.
   */
  public static async loadTexture(
    gl: WebGL2RenderingContext,
    url: string,
    options: TextureOptions = {}
  ): Promise<WebGLTexture> {
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');

    const flipY = options.flipY ?? true;
    const wrapS = options.wrapS ?? gl.CLAMP_TO_EDGE;
    const wrapT = options.wrapT ?? gl.CLAMP_TO_EDGE;
    const minFilter = options.minFilter ?? gl.LINEAR;
    const magFilter = options.magFilter ?? gl.LINEAR;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

        if (options.generateMipmaps) {
          gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        resolve(texture);
      };

      img.onerror = (err) => {
        gl.deleteTexture(texture);
        reject(new Error(`Failed to load texture from url: ${url}. Error: ${err}`));
      };

      img.src = url;
    });
  }

  /**
   * Generates a procedural test gradient pattern for fallback image testing.
   */
  public static createProceduralCheckerTexture(gl: WebGL2RenderingContext, size: number = 256): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create procedural texture');

    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const check = ((x >> 4) & 1) ^ ((y >> 4) & 1);
        const r = Math.floor((x / size) * 200 + 40);
        const g = Math.floor((y / size) * 200 + 40);
        const b = check ? 220 : 120;

        data[i + 0] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }
}
