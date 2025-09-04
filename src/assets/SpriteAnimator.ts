import type { LoadedSpriteSheet, SpriteAnimation } from '../types/assets';

export type AnimatorState = {
  name: string;
  frames: number[];
  fps: number;
  loop: boolean;
};

export class SpriteAnimator {
  private sheet: LoadedSpriteSheet;
  private state: AnimatorState | null = null;
  private frameIndex: number = 0; // index within frames array
  private elapsed: number = 0; // seconds accumulated for current frame
  private speed: number = 1; // multiplier on fps
  private finished: boolean = false;

  constructor(sheet: LoadedSpriteSheet, opts?: { speed?: number }) {
    this.sheet = sheet;
    if (opts?.speed) this.speed = opts.speed;
  }

  play(name: string, reset: boolean = true): void {
    const anim = this.getAnimation(name);
    if (!anim) throw new Error(`SpriteAnimator: animation '${name}' not found`);

    this.state = {
      name,
      frames: anim.frames,
      fps: anim.fps,
      loop: anim.loop ?? true,
    };

    if (reset) {
      this.frameIndex = 0;
      this.elapsed = 0;
      this.finished = false;
    }
  }

  stop(): void {
    this.state = null;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.finished = true;
  }

  setSpeed(multiplier: number): void {
    this.speed = Math.max(0, multiplier);
  }

  isFinished(): boolean {
    return this.finished;
  }

  update(deltaTime: number): void {
    if (!this.state || this.finished) return;
    const effectiveFps = Math.max(0.0001, this.state.fps * this.speed);
    const frameDuration = 1 / effectiveFps; // seconds per frame

    this.elapsed += deltaTime;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex += 1;

      if (this.frameIndex >= this.state.frames.length) {
        if (this.state.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = this.state.frames.length - 1;
          this.finished = true;
          break;
        }
      }
    }
  }

  getCurrentFrameIndex(): number | null {
    if (!this.state) return null;
    return this.state.frames[this.frameIndex] ?? null;
  }

  // Returns pixel rect for current frame within the spritesheet texture
  // Useful for renderers that draw a sub-rect from a texture atlas
  getCurrentFrameRect(): { x: number; y: number; width: number; height: number } | null {
    const frame = this.getCurrentFrameIndex();
    if (frame == null) return null;

    const texW = this.sheet.width ?? 0;
    const texH = this.sheet.height ?? 0;
    const fw = this.sheet.frameWidth;
    const fh = this.sheet.frameHeight;
    const margin = this.sheet.margin ?? 0;
    const spacing = this.sheet.spacing ?? 0;

    if (texW === 0 || texH === 0) {
      // Dimensions unknown; cannot compute a rect
      return { x: 0, y: 0, width: fw, height: fh };
    }

    const columns = Math.max(1, Math.floor((texW - margin * 2 + spacing) / (fw + spacing)));
    const col = frame % columns;
    const row = Math.floor(frame / columns);
    const x = margin + col * (fw + spacing);
    const y = margin + row * (fh + spacing);
    return { x, y, width: fw, height: fh };
  }

  private getAnimation(name: string): SpriteAnimation | undefined {
    return this.sheet.animations?.[name];
  }
}
