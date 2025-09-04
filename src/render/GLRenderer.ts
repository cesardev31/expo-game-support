// Minimal low-level GL renderer (WebGL ES 2.0 style) for Expo GL
// Note: Texture upload is delegated to the host via registerTexture().

import type { IRenderer, Rect, DrawOptions, TextureInfo } from './IRenderer';

export class GLRenderer implements IRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private attribPos = -1;
  private attribUV = -1;
  private uniProjection: WebGLUniformLocation | null = null;
  private uniTint: WebGLUniformLocation | null = null;
  private uniAlpha: WebGLUniformLocation | null = null;
  private uniSrc: WebGLUniformLocation | null = null;
  private uniTexSize: WebGLUniformLocation | null = null;

  private vb: WebGLBuffer | null = null;
  private ib: WebGLBuffer | null = null;
  private projection: Float32Array = new Float32Array(16);

  private textures = new Map<string, TextureInfo>();
  private viewportW = 0;
  private viewportH = 0;

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl;
    this.createProgram();
    this.createBuffers();
    this.resize(width, height);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha
  }

  registerTexture(id: string, info: TextureInfo): void {
    this.textures.set(id, info);
  }

  unregisterTexture(id: string): void {
    this.textures.delete(id);
  }

  resize(width: number, height: number): void {
    this.viewportW = width;
    this.viewportH = height;
    this.gl.viewport(0, 0, width, height);
    this.projection = ortho(0, width, height, 0, -1, 1);
  }

  beginFrame(clearColor: [number, number, number, number] = [0, 0, 0, 0]): void {
    const gl = this.gl;
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    if (this.uniProjection) gl.uniformMatrix4fv(this.uniProjection, false, this.projection);
  }

  drawSprite(textureId: string, src: Rect, dst: Rect, opts?: DrawOptions): void {
    const tex = this.textures.get(textureId);
    if (!tex || !this.program) return;

    const gl = this.gl;

    // Compute vertices for dst rect
    const x = dst.x; const y = dst.y; const w = dst.width; const h = dst.height;
    const flipX = !!opts?.flipX; const flipY = !!opts?.flipY;

    // Positions (x,y) and UV (u,v)
    // UVs computed from src rect over texture size
    const u0 = src.x / tex.width;
    const v0 = src.y / tex.height;
    const u1 = (src.x + src.width) / tex.width;
    const v1 = (src.y + src.height) / tex.height;

    const uvLeft = flipX ? u1 : u0;
    const uvRight = flipX ? u0 : u1;
    const uvTop = flipY ? v1 : v0;
    const uvBottom = flipY ? v0 : v1;

    const vertices = new Float32Array([
      //  x,     y,      u,        v
       x,      y,       uvLeft,   uvTop,
       x + w,  y,       uvRight,  uvTop,
       x + w,  y + h,   uvRight,  uvBottom,
       x,      y + h,   uvLeft,   uvBottom,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);

    if (this.uniTint) gl.uniform4fv(this.uniTint, opts?.tint ?? [1,1,1,1]);
    if (this.uniAlpha) gl.uniform1f(this.uniAlpha, (opts?.tint?.[3] ?? 1));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  endFrame(): void {
    // In Expo GL, the GLView usually handles present; gl.flush() is enough here
    this.gl.flush();
  }

  dispose(): void {
    const gl = this.gl;
    if (this.vb) gl.deleteBuffer(this.vb);
    if (this.ib) gl.deleteBuffer(this.ib);
    if (this.program) gl.deleteProgram(this.program);
    this.textures.clear();
  }

  private createProgram(): void {
    const gl = this.gl;
    const vsSrc = `
      attribute vec2 aPos;
      attribute vec2 aUV;
      uniform mat4 uProjection;
      varying vec2 vUV;
      void main() {
        vUV = aUV;
        gl_Position = uProjection * vec4(aPos.xy, 0.0, 1.0);
      }
    `;

    // Premultiplied alpha pipeline
    const fsSrc = `
      precision mediump float;
      varying vec2 vUV;
      uniform sampler2D uTex;
      uniform vec4 uTint;
      uniform float uAlpha;
      void main() {
        vec4 c = texture2D(uTex, vUV);
        // Apply tint in premultiplied alpha space
        vec3 rgb = c.rgb * uTint.rgb;
        float a = c.a * uAlpha;
        gl_FragColor = vec4(rgb * a, a);
      }
    `;

    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    if (!prog || !vs || !fs) throw new Error('GLRenderer: failed to create program');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog) || 'link error';
      throw new Error('GL link error: ' + info);
    }
    this.program = prog;

    gl.useProgram(prog);
    this.attribPos = gl.getAttribLocation(prog, 'aPos');
    this.attribUV = gl.getAttribLocation(prog, 'aUV');
    this.uniProjection = gl.getUniformLocation(prog, 'uProjection');
    this.uniTint = gl.getUniformLocation(prog, 'uTint');
    this.uniAlpha = gl.getUniformLocation(prog, 'uAlpha');

    // Setup vertex attrib pointers
    this.vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
    const stride = 4 * 4; // 4 floats per vertex (x,y,u,v)
    gl.enableVertexAttribArray(this.attribPos);
    gl.vertexAttribPointer(this.attribPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.attribUV);
    gl.vertexAttribPointer(this.attribUV, 2, gl.FLOAT, false, stride, 8);
  }

  private createBuffers(): void {
    const gl = this.gl;
    // Index buffer for two triangles (0,1,2, 0,2,3)
    this.ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2, 0,2,3]), gl.STATIC_DRAW);
  }
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh) || 'compile error';
    throw new Error('Shader compile error: ' + info);
  }
  return sh;
}

function ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0]  = -2 * lr;
  out[5]  = -2 * bt;
  out[10] = 2 * nf;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
