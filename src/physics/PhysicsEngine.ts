import { Vector2D } from "../math/Vector2D";
import { GameObject } from "../core/GameObject";
import { CollisionDetector } from "./CollisionDetector";
import { CollisionEvent } from "../types";

// Motor de físicas para el juego
export class PhysicsEngine {
  private gravity: Vector2D;
  private collisionDetector: CollisionDetector;
  private gameObjects: Map<string, GameObject> = new Map();
  private collisionCallbacks: ((event: CollisionEvent) => void)[] = [];

  constructor(gravity: Vector2D = new Vector2D(0, 981)) {
    // 981 = gravedad terrestre en px/s²
    this.gravity = gravity;
    this.collisionDetector = new CollisionDetector();
  }

  // Agregar objeto al motor de físicas
  addObject(gameObject: GameObject): void {
    if (gameObject.physics) {
      this.gameObjects.set(gameObject.id, gameObject);
    }
  }

  // Remover objeto del motor de físicas
  removeObject(objectId: string): void {
    this.gameObjects.delete(objectId);
  }

  // Actualizar todas las físicas
  update(deltaTime: number): void {
    console.log(`🔧 [PHYSICS] PhysicsEngine.update called with dt=${deltaTime.toFixed(4)}, objects=${this.gameObjects.size}`);
    
    // Aplicar gravedad a todos los objetos
    this.applyGravity(deltaTime);

    // Actualizar física de cada objeto
    for (const gameObject of this.gameObjects.values()) {
      if (
        gameObject.active &&
        gameObject.physics &&
        !gameObject.physics.isStatic
      ) {
        console.log(`🔧 [PHYSICS] Updating physics for object ${gameObject.id}`);
        this.updateObjectPhysics(gameObject, deltaTime);
      }
    }

    // Detectar y resolver colisiones
    this.handleCollisions();
  }

  // Aplicar gravedad a todos los objetos
  private applyGravity(deltaTime: number): void {
    console.log(`🌍 [PHYSICS] Applying gravity ${this.gravity.x}, ${this.gravity.y} to ${this.gameObjects.size} objects`);
    for (const gameObject of this.gameObjects.values()) {
      if (
        gameObject.physics &&
        !gameObject.physics.isStatic &&
        gameObject.physics.mass > 0
      ) {
        // F = m * g (sin dt)
        const gravityForce = this.gravity.multiply(gameObject.physics.mass);
        console.log(`🌍 [PHYSICS] Applying gravity force ${gravityForce.x}, ${gravityForce.y} to ${gameObject.id}`);
        gameObject.applyForce(gravityForce);
      }
    }
  }

  // Actualizar física de un objeto específico
  private updateObjectPhysics(gameObject: GameObject, deltaTime: number): void {
    if (!gameObject.physics) return;

    console.log(`⚙️ [PHYSICS] Before update - ${gameObject.id}: pos(${gameObject.position.x.toFixed(2)}, ${gameObject.position.y.toFixed(2)}) vel(${gameObject.physics.velocity.x.toFixed(2)}, ${gameObject.physics.velocity.y.toFixed(2)}) force(${gameObject.physics.force.x.toFixed(2)}, ${gameObject.physics.force.y.toFixed(2)})`);

    // Aplicar aceleración
    const acceleration = new Vector2D(
      gameObject.physics.acceleration.x,
      gameObject.physics.acceleration.y
    );

    // Aplicar fuerzas (F = ma)
    if (gameObject.physics.mass > 0) {
      acceleration.x += gameObject.physics.force.x / gameObject.physics.mass;
      acceleration.y += gameObject.physics.force.y / gameObject.physics.mass;
    }

    console.log(`⚙️ [PHYSICS] Calculated acceleration: (${acceleration.x.toFixed(2)}, ${acceleration.y.toFixed(2)})`);

    // Actualizar velocidad
    gameObject.physics.velocity.x += acceleration.x * deltaTime;
    gameObject.physics.velocity.y += acceleration.y * deltaTime;

    // Aplicar fricción
    const friction = 1 - gameObject.physics.friction * deltaTime;
    gameObject.physics.velocity.x *= friction;
    gameObject.physics.velocity.y *= friction;

    console.log(`⚙️ [PHYSICS] After velocity update: (${gameObject.physics.velocity.x.toFixed(2)}, ${gameObject.physics.velocity.y.toFixed(2)})`);

    // Actualizar posición
    const oldX = gameObject.position.x;
    const oldY = gameObject.position.y;
    gameObject.position.x += gameObject.physics.velocity.x * deltaTime;
    gameObject.position.y += gameObject.physics.velocity.y * deltaTime;

    console.log(`⚙️ [PHYSICS] Position update: (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) -> (${gameObject.position.x.toFixed(2)}, ${gameObject.position.y.toFixed(2)})`);

    // Actualizar rotación
    gameObject.rotation += gameObject.physics.angularVelocity * deltaTime;

    // Resetear fuerzas
    gameObject.physics.force.x = 0;
    gameObject.physics.force.y = 0;
  }

  // Manejar colisiones entre objetos
  private handleCollisions(): void {
    const objects = Array.from(this.gameObjects.values());

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const objA = objects[i];
        const objB = objects[j];

        if (!objA.active || !objB.active) continue;
        if (!objA.physics || !objB.physics) continue;

        // Skip collision between pipes (both start with "pipe-")
        if (objA.id.startsWith("pipe-") && objB.id.startsWith("pipe-")) {
          continue;
        }

        const collision = this.collisionDetector.checkCollision(objA, objB);
        if (collision) {
          this.resolveCollision(objA, objB, collision);
          this.notifyCollision(collision);
        }
      }
    }
  }

  // Resolver colisión entre dos objetos
  private resolveCollision(
    objA: GameObject,
    objB: GameObject,
    collision: CollisionEvent
  ): void {
    if (!objA.physics || !objB.physics) return;

    // Separar objetos
    const normal = new Vector2D(collision.normal.x, collision.normal.y);
    const separation = normal.multiply(collision.penetration / 2);

    if (!objA.physics.isStatic) {
      objA.position = objA.position.subtract(separation);
    }
    if (!objB.physics.isStatic) {
      objB.position = objB.position.add(separation);
    }

    // Calcular velocidades relativas
    const relativeVelocity = new Vector2D(
      objB.physics.velocity.x - objA.physics.velocity.x,
      objB.physics.velocity.y - objA.physics.velocity.y
    );

    const velocityAlongNormal = relativeVelocity.dot(normal);

    // No resolver si los objetos se están separando
    if (velocityAlongNormal > 0) return;

    // Calcular restitución (rebote)
    const restitution = Math.min(
      objA.physics.restitution,
      objB.physics.restitution
    );

    // Calcular magnitud del impulso
    let impulseMagnitude = -(1 + restitution) * velocityAlongNormal;

    const totalMass = objA.physics.mass + objB.physics.mass;
    if (totalMass > 0) {
      impulseMagnitude /= totalMass;
    }

    // Aplicar impulso
    const impulse = normal.multiply(impulseMagnitude);

    if (!objA.physics.isStatic && objA.physics.mass > 0) {
      const impulseA = impulse.multiply(-objA.physics.mass);
      objA.applyImpulse(impulseA);
    }

    if (!objB.physics.isStatic && objB.physics.mass > 0) {
      const impulseB = impulse.multiply(objB.physics.mass);
      objB.applyImpulse(impulseB);
    }
  }

  // Notificar colisión a los callbacks
  private notifyCollision(collision: CollisionEvent): void {
    this.collisionCallbacks.forEach((callback) => callback(collision));
  }

  // Agregar callback de colisión
  onCollision(callback: (event: CollisionEvent) => void): void {
    this.collisionCallbacks.push(callback);
  }

  // Configurar gravedad
  setGravity(gravity: Vector2D): void {
    this.gravity = gravity;
  }

  // Obtener gravedad actual
  getGravity(): Vector2D {
    return this.gravity.clone();
  }

  // Limpiar todos los objetos
  clear(): void {
    this.gameObjects.clear();
  }

  // Obtener número de objetos
  getObjectCount(): number {
    return this.gameObjects.size;
  }
}
