export interface Rect { x: number; y: number; width: number; height: number }
export interface DrawOptions {
  tint?: [number, number, number, number]; // RGBA 0..1
  flipX?: boolean;
  flipY?: boolean;
}

export interface IRenderer {
  resize(width: number, height: number): void;
  beginFrame(clearColor?: [number, number, number, number]): void;
  drawSprite(textureId: string, src: Rect, dst: Rect, opts?: DrawOptions): void;
  endFrame(): void;
  dispose(): void;
}

export type TextureInfo = {
  texture: WebGLTexture;
  width: number;
  height: number;
};

export interface ITextureRegistry {
  registerTexture(id: string, info: TextureInfo): void;
  unregisterTexture(id: string): void;
}
