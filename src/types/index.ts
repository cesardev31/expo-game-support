// Tipos y interfaces principales de la librería
import { Vector2D } from '../math/Vector2D';

export { Vector2D };

export interface GameObjectConfig {
  id: string;
  position: Vector2D;
  size: Vector2D;
  rotation?: number;
  physics?: PhysicsBodyConfig;
}

export interface PhysicsBodyConfig {
  mass: number;
  velocity: Vector2D;
  acceleration: Vector2D;
  friction: number;
  restitution: number;
  isStatic: boolean;
}

export interface PhysicsBody extends PhysicsBodyConfig {
  force: Vector2D;
  angularVelocity: number;
}

export interface GameTouchEvent {
  id: number;
  position: Vector2D;
  timestamp: number;
  type: 'start' | 'move' | 'end' | 'cancel';
  pressure?: number;
}

export interface GameLoopConfig {
  targetFPS: number;
  maxDeltaTime: number;
  enableFixedTimeStep: boolean;
}

export interface CollisionEvent {
  objectA: string;
  objectB: string;
  point: Vector2D;
  normal: Vector2D;
  penetration: number;
}

export interface GameEngineConfig {
  width: number;
  height: number;
  gravity: Vector2D;
  gameLoop: GameLoopConfig;
}
