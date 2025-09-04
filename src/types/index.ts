// Tipos y interfaces principales de la librería
import { Vector2D } from "../math/Vector2D";

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
  linearDamping?: number;
  angularDamping?: number;
  affectedByGravity?: boolean;
  isTrigger?: boolean;
  angularAcceleration?: number;
  collisionLayers?: CollisionLayer[];
  collisionMask?: CollisionLayer[];
}

// Capas de colisión para filtros simples
export enum CollisionLayer {
  Default = 1,
  Player = 2,
  Enemy = 4,
  Projectile = 8,
  Trigger = 16,
  Environment = 32,
}

// Materiales físicos predefinidos
export interface PhysicsMaterial {
  density: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
}

export interface PhysicsBody extends PhysicsBodyConfig {
  force: Vector2D;
  angularVelocity: number;
  // Campos adicionales usados por el motor extendido
  angularAcceleration: number;
  linearDamping: number;
  angularDamping: number;
  affectedByGravity: boolean;
  isTrigger?: boolean;
  // Sleeping
  isSleeping?: boolean;
  sleepTimer?: number;
  // Colisión
  collisionLayers?: CollisionLayer[];
  collisionMask?: CollisionLayer[];
  collisionGroup?: string;
  // Estado previo
  previousPosition?: Vector2D;
  previousVelocity?: Vector2D;
  // Fuerzas personalizadas acumuladas por frame
  customForces?: Vector2D[];
}

// Alias para componentes de física en el engine extendido
export type PhysicsComponent = PhysicsBody;

// Tipado mínimo para cuerpos rígidos usados internamente por el engine
export interface RigidBody {
  id: string;
  gameObject: any; // Evitar dependencia circular con GameObject
  shape: any;
  centerOfMass: Vector2D;
  momentOfInertia: number;
  collisionLayers: CollisionLayer[];
  collisionMask: CollisionLayer[];
  isTrigger: boolean;
  lastPosition: Vector2D;
  lastRotation: number;
}

// Restricciones/joints mínimas
export interface Joint {
  id: string;
  type: "distance" | "revolute" | "weld";
  objectA: string;
  objectB: string;
  enabled: boolean;
  // Opcionales comunes
  anchorA?: Vector2D;
  anchorB?: Vector2D;
  // Distance
  targetLength?: number;
  stiffness?: number;
  damping?: number;
  // Revolute
  enableLimit?: boolean;
  lowerAngle?: number;
  upperAngle?: number;
  enableMotor?: boolean;
  motorSpeed?: number;
  maxMotorTorque?: number;
}

export interface Constraint {
  type: "position" | "velocity" | "angle";
  enabled: boolean;
  // Datos específicos según tipo
  [key: string]: any;
}

export interface GameTouchEvent {
  id: number;
  position: Vector2D;
  timestamp: number;
  type: "start" | "move" | "end" | "cancel";
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
