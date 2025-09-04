// Asset-related types for expo-game-support

export type AssetId = string;

export type ImageAsset = {
  id: AssetId;
  type: 'image';
  // require('path') or remote URI string
  source: any;
  width?: number;
  height?: number;
};

export type SpriteAnimation = {
  frames: number[];
  fps: number;
  loop?: boolean;
};

export type SpriteSheetAsset = {
  id: AssetId;
  type: 'spritesheet';
  source: any;
  frameWidth: number;
  frameHeight: number;
  margin?: number;
  spacing?: number;
  animations?: { [name: string]: SpriteAnimation };
};

export type SoundKind = 'sound' | 'music';

export type SoundAsset = {
  id: AssetId;
  type: SoundKind;
  source: any;
  volume?: number; // 0..1
  loop?: boolean;
};

export type AssetManifest = {
  images?: ImageAsset[];
  spritesheets?: SpriteSheetAsset[];
  sounds?: SoundAsset[];
};

export type LoadedTexture = {
  id: AssetId;
  uri: string;
  width?: number;
  height?: number;
};

export type LoadedSpriteSheet = LoadedTexture & {
  frameWidth: number;
  frameHeight: number;
  margin?: number;
  spacing?: number;
  animations?: { [name: string]: SpriteAnimation };
};

export type SoundHandle = {
  id: AssetId;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  unload: () => Promise<void>;
};
