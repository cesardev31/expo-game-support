// Expo Game Support Library
// Exportaciones principales de la librería

export { GameEngine } from "./core/GameEngine";
export { PhysicsEngine } from "./physics/PhysicsEngine";
export { GameLoop } from "./core/GameLoop";
export { TouchInputManager } from "./input/TouchInputManager";
export { GameObject } from "./core/GameObject";
export { Vector2D } from "./math/Vector2D";
export { CollisionDetector } from "./physics/CollisionDetector";

// Tipos y interfaces
export type {
  GameObjectConfig,
  PhysicsBody,
  GameTouchEvent,
  GameLoopConfig,
  CollisionEvent
} from './types';
