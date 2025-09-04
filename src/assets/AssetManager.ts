// AssetManager for images, spritesheets and sounds using Expo Asset and expo-av
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';
import type {
  AssetManifest,
  AssetId,
  LoadedTexture,
  LoadedSpriteSheet,
  SoundHandle,
  SpriteSheetAsset,
  SoundAsset,
} from '../types/assets';

export class AssetManager {
  private textures = new Map<AssetId, LoadedTexture>();
  private spritesheets = new Map<AssetId, LoadedSpriteSheet>();
  private sounds = new Map<AssetId, Audio.Sound>();
  private masterVolume = { music: 1, sound: 1 } as const;
  private currentMusicId: string | null = null;

  async preload(manifest: AssetManifest): Promise<void> {
    const tasks: Promise<any>[] = [];

    if (manifest.images) {
      for (const img of manifest.images) {
        tasks.push(this.loadImage(img.id, img.source, img.width, img.height));
      }
    }

    if (manifest.spritesheets) {
      for (const sheet of manifest.spritesheets) {
        tasks.push(this.loadSpriteSheet(sheet));
      }
    }

    if (manifest.sounds) {
      for (const snd of manifest.sounds) {
        tasks.push(this.loadSound(snd));
      }
    }

    await Promise.all(tasks);
  }

  async loadImage(id: AssetId, source: any, width?: number, height?: number): Promise<LoadedTexture> {
    const asset = Asset.fromModule(source);
    if (!asset.downloaded) {
      await asset.downloadAsync();
    }
    const loaded: LoadedTexture = {
      id,
      uri: asset.localUri ?? asset.uri,
      // Coerce possible nulls from expo-asset to undefined for typing
      width: width ?? (asset.width ?? undefined),
      height: height ?? (asset.height ?? undefined),
    };
    this.textures.set(id, loaded);
    return loaded;
  }

  async loadSpriteSheet(sheet: SpriteSheetAsset): Promise<LoadedSpriteSheet> {
    const base = await this.loadImage(sheet.id, sheet.source);
    const loaded: LoadedSpriteSheet = {
      ...base,
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
      margin: sheet.margin,
      spacing: sheet.spacing,
      animations: sheet.animations,
    };
    this.spritesheets.set(sheet.id, loaded);
    return loaded;
  }

  async loadSound(snd: SoundAsset): Promise<SoundHandle> {
    const { sound } = await Audio.Sound.createAsync(snd.source, {
      volume: (snd.volume ?? 1) * (snd.type === 'music' ? this.masterVolume.music : this.masterVolume.sound),
      isLooping: snd.loop ?? false,
      shouldPlay: false,
    });
    this.sounds.set(snd.id, sound);

    const handle: SoundHandle = {
      id: snd.id,
      play: async () => {
        await sound.replayAsync();
      },
      pause: async () => {
        try { await sound.pauseAsync(); } catch {}
      },
      stop: async () => {
        try { await sound.stopAsync(); } catch {}
      },
      setVolume: async (v: number) => {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, v)));
      },
      unload: async () => {
        try { await sound.unloadAsync(); } finally {
          this.sounds.delete(snd.id);
        }
      },
    };

    return handle;
  }

  has(id: AssetId): boolean {
    return this.textures.has(id) || this.spritesheets.has(id) || this.sounds.has(id);
  }

  getTexture(id: AssetId): LoadedTexture | undefined {
    return this.textures.get(id);
  }

  getSpriteSheet(id: AssetId): LoadedSpriteSheet | undefined {
    return this.spritesheets.get(id);
  }

  async getSound(id: AssetId): Promise<SoundHandle | undefined> {
    const sound = this.sounds.get(id);
    if (!sound) return undefined;
    return {
      id,
      play: async () => { await sound.replayAsync(); },
      pause: async () => { try { await sound.pauseAsync(); } catch {} },
      stop: async () => { try { await sound.stopAsync(); } catch {} },
      setVolume: async (v: number) => { await sound.setVolumeAsync(Math.max(0, Math.min(1, v))); },
      unload: async () => { try { await sound.unloadAsync(); } finally { this.sounds.delete(id); } },
    };
  }

  // ----------------------
  // High-level audio API
  // ----------------------

  async play(id: AssetId, opts?: { loop?: boolean; volume?: number }): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) throw new Error(`Sound '${id}' not loaded`);
    if (opts?.loop != null) await s.setIsLoopingAsync(!!opts.loop);
    if (opts?.volume != null) await s.setVolumeAsync(this._clamp01(opts.volume));
    await s.replayAsync();
  }

  async pause(id: AssetId): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) return;
    try { await s.pauseAsync(); } catch {}
  }

  async stop(id: AssetId): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) return;
    try { await s.stopAsync(); } catch {}
  }

  async setLoop(id: AssetId, loop: boolean): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) return;
    await s.setIsLoopingAsync(loop);
  }

  async setVolume(id: AssetId, volume: number): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) return;
    await s.setVolumeAsync(this._clamp01(volume));
  }

  async fadeTo(id: AssetId, target: number, durationMs: number = 500): Promise<void> {
    const s = this.sounds.get(id);
    if (!s) return;
    const status = await s.getStatusAsync();
    const start = (status as any).volume ?? 1;
    await this._tweenVolume(s, start, this._clamp01(target), durationMs);
  }

  async playMusic(id: AssetId, opts?: { volume?: number; loop?: boolean; crossfadeMs?: number }): Promise<void> {
    const toVol = this._clamp01(opts?.volume ?? 1);
    const loop = opts?.loop ?? true;
    const cross = Math.max(0, opts?.crossfadeMs ?? 0);

    const target = this.sounds.get(id);
    if (!target) throw new Error(`Music '${id}' not loaded`);
    await target.setIsLoopingAsync(loop);

    if (this.currentMusicId && this.currentMusicId !== id && cross > 0) {
      const prev = this.sounds.get(this.currentMusicId);
      if (prev) {
        // Prepare target at zero, then fade in while fading out previous
        await target.setVolumeAsync(0);
        await target.playAsync();
        await Promise.all([
          this._tweenVolume(prev, (await prev.getStatusAsync() as any).volume ?? 1, 0, cross),
          this._tweenVolume(target, 0, toVol, cross),
        ]);
        try { await prev.stopAsync(); } catch {}
      } else {
        await target.setVolumeAsync(toVol);
        await target.replayAsync();
      }
    } else {
      await target.setVolumeAsync(toVol);
      await target.replayAsync();
    }

    this.currentMusicId = id;
  }

  async crossfadeMusic(toId: AssetId, durationMs: number = 800): Promise<void> {
    return this.playMusic(toId, { crossfadeMs: durationMs, loop: true });
  }

  async setMasterVolume(kind: 'music' | 'sound', volume: number): Promise<void> {
    const v = this._clamp01(volume);
    // Update all loaded sounds of that kind
    for (const [id, snd] of this.sounds.entries()) {
      // Best-effort: no metadata to know kind here; honor by currentMusicId for 'music'
      if (kind === 'music') {
        if (this.currentMusicId === id) {
          await snd.setVolumeAsync(v);
        }
      } else {
        if (this.currentMusicId !== id) {
          await snd.setVolumeAsync(v);
        }
      }
    }
  }

  async stopAll(): Promise<void> {
    await Promise.all(Array.from(this.sounds.values()).map(s => s.stopAsync().catch(() => {})));
  }

  async pauseAll(): Promise<void> {
    await Promise.all(Array.from(this.sounds.values()).map(s => s.pauseAsync().catch(() => {})));
  }

  async resumeAll(): Promise<void> {
    await Promise.all(Array.from(this.sounds.values()).map(s => s.playAsync().catch(() => {})));
  }

  async unload(id: AssetId): Promise<void> {
    if (this.textures.has(id)) this.textures.delete(id);
    if (this.spritesheets.has(id)) this.spritesheets.delete(id);
    const s = this.sounds.get(id);
    if (s) {
      try { await s.unloadAsync(); } finally { this.sounds.delete(id); }
    }
  }

  async unloadAll(): Promise<void> {
    const unloads: Promise<any>[] = [];
    for (const s of this.sounds.values()) {
      unloads.push(s.unloadAsync().catch(() => {}));
    }
    this.textures.clear();
    this.spritesheets.clear();
    this.sounds.clear();
    this.currentMusicId = null;
    await Promise.all(unloads);
  }

  // Helpers
  private _clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

  private async _tweenVolume(sound: Audio.Sound, from: number, to: number, durationMs: number): Promise<void> {
    if (durationMs <= 0) {
      await sound.setVolumeAsync(this._clamp01(to));
      return;
    }
    const steps = 30;
    const interval = durationMs / steps;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const v = from + (to - from) * t;
      await sound.setVolumeAsync(this._clamp01(v));
      await new Promise(res => setTimeout(res, interval));
    }
  }
}
