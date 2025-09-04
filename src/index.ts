// Expo Game Support Library
// Exportaciones principales de la librería

export { GameEngine } from "./core/GameEngine";
export { PhysicsEngine } from "./physics/PhysicsEngine";
export { GameLoop } from "./core/GameLoop";
export { TouchInputManager } from "./input/TouchInputManager";
export { TouchInputManagerRN } from "./input/TouchInputManagerRN";
export { GameObject } from "./core/GameObject";
export { Vector2D } from "./math/Vector2D";
export { CollisionDetector } from "./physics/CollisionDetector";

// Utilities
export { BoundaryChecker } from "./utils/BoundaryChecker";
export { ObjectCleaner } from "./utils/ObjectCleaner";
export { ScoreZone, ScoreManager } from "./utils/ScoreZone";
export { ObjectSpawner } from "./utils/ObjectSpawner";

// Assets
export { AssetManager } from "./assets/AssetManager";
export { SpriteAnimator } from "./assets/SpriteAnimator";

// Rendering (optional)
export type {
  IRenderer,
  Rect as RenderRect,
  DrawOptions,
  TextureInfo,
  ITextureRegistry,
} from "./render/IRenderer";
export { GLRenderer } from "./render/GLRenderer";

// Tipos y interfaces
export type {
  GameObjectConfig,
  PhysicsBody,
  GameTouchEvent,
  GameLoopConfig,
  CollisionEvent,
} from "./types";

export type {
  AssetManifest,
  AssetId,
  ImageAsset,
  SpriteSheetAsset,
  SoundAsset,
  LoadedTexture,
  LoadedSpriteSheet,
  SoundHandle,
} from "./types/assets";
