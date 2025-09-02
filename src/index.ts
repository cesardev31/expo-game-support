// Expo Game Support Library
// Exportaciones principales de la librería

export { GameEngine } from "./core/GameEngine";
export { PhysicsEngine } from "./physics/PhysicsEngine";
export { GameLoop } from "./core/GameLoop";
export { TouchInputManager } from './input/TouchInputManager';
export { TouchInputManagerRN } from './input/TouchInputManagerRN';
export { GameObject } from "./core/GameObject";
export { Vector2D } from "./math/Vector2D";
export { CollisionDetector } from "./physics/CollisionDetector";

// Utilities
export { BoundaryChecker } from "./utils/BoundaryChecker";
export { ObjectCleaner } from "./utils/ObjectCleaner";
export { ScoreZone, ScoreManager } from "./utils/ScoreZone";
export { ObjectSpawner } from "./utils/ObjectSpawner";

// Tipos y interfaces
export type {
  GameObjectConfig,
  PhysicsBody,
  GameTouchEvent,
  GameLoopConfig,
  CollisionEvent
} from './types';
