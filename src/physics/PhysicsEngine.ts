import { Vector2D } from "../math/Vector2D";
import { GameObject } from "../core/GameObject";
import { CollisionDetector } from "./CollisionDetector";
import {
  CollisionEvent,
  PhysicsComponent,
  RigidBody,
  Joint,
  Constraint,
  PhysicsMaterial,
  CollisionLayer,
} from "../types";

// Configuración del motor de físicas
export interface PhysicsConfig {
  maxSubsteps: number;
  maxDeltaTime: number;
  targetTimeStep: number;
  velocityThreshold: number;
  positionTolerance: number;
  enableSleeping: boolean;
  enableCCD: boolean; // Continuous Collision Detection
  broadPhaseOptimization: boolean;
  spatialHashCellSize: number;
}

// Mundo de físicas con límites
export interface WorldBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  wrap?: boolean; // Para wrapping de mundo
}

// Sistema de eventos de física
export interface PhysicsEvents {
  "collision-start": CollisionEvent;
  "collision-end": CollisionEvent;
  "trigger-enter": CollisionEvent;
  "trigger-exit": CollisionEvent;
  "object-sleep": GameObject;
  "object-wake": GameObject;
  "bounds-exit": GameObject;
}

// Motor de físicas completo para React Native/Expo
export class PhysicsEngine {
  private gravity: Vector2D;
  private collisionDetector: CollisionDetector;
  private gameObjects: Map<string, GameObject> = new Map();
  private rigidBodies: Map<string, RigidBody> = new Map();
  private joints: Map<string, Joint> = new Map();
  private constraints: Constraint[] = [];

  // Sistema de eventos
  private eventListeners: Map<keyof PhysicsEvents, Function[]> = new Map();
  private activeCollisions: Set<string> = new Set();
  private activeTriggers: Set<string> = new Set();

  // Materiales de física predefinidos
  private materials: Map<string, PhysicsMaterial> = new Map();

  // Configuración del mundo
  private config: PhysicsConfig;
  private worldBounds?: WorldBounds;

  // Optimización espacial
  private spatialHash: Map<string, Set<GameObject>> = new Map();
  private lastSpatialUpdate = 0;

  // Performance tracking
  private performanceMetrics = {
    lastFrameTime: 0,
    averageFrameTime: 16.67,
    collisionChecks: 0,
    objectsSimulated: 0,
    sleepingObjects: 0,
  };

  constructor(
    gravity: Vector2D = new Vector2D(0, 9.81),
    config?: Partial<PhysicsConfig>
  ) {
    this.gravity = gravity;
    this.collisionDetector = new CollisionDetector();

    // Configuración por defecto optimizada para React Native
    this.config = {
      maxSubsteps: 4,
      maxDeltaTime: 1 / 30, // 33ms máximo
      targetTimeStep: 1 / 60, // 16.67ms target para 60fps
      velocityThreshold: 0.5,
      positionTolerance: 0.1,
      enableSleeping: true,
      enableCCD: false, // Puede ser costoso en móviles
      broadPhaseOptimization: true,
      spatialHashCellSize: 100,
      ...config,
    };

    this.initializeMaterials();
    this.initializeEventSystem();
  }

  // Constraint system stubs used by resolveConstraints
  private resolvePositionConstraint(_constraint: Constraint, _dt: number): void {
    // TODO implement position constraint solver
  }

  private resolveVelocityConstraint(_constraint: Constraint, _dt: number): void {
    // TODO implement velocity constraint solver
  }

  private resolveAngleConstraint(_constraint: Constraint, _dt: number): void {
    // TODO implement angle constraint solver
  }

  // Public helpers expected by GameEngine
  onCollision(callback: (collision: CollisionEvent) => void): () => void {
    // Forward to collision-start event for now
    return this.on("collision-start", callback);
  }

  getObjectCount(): number {
    return this.gameObjects.size;
  }

  getActiveObjectCount(): number {
    let count = 0;
    for (const obj of this.gameObjects.values()) {
      if (obj.active) count++;
    }
    return count;
  }

  removeObject(id: string): void {
    this.gameObjects.delete(id);
    this.rigidBodies.delete(id);
    // Clean active collision/trigger sets
    this.activeCollisions.forEach((key) => {
      if (key.includes(id)) this.activeCollisions.delete(key);
    });
    this.activeTriggers.forEach((key) => {
      if (key.includes(id)) this.activeTriggers.delete(key);
    });
  }

  clear(): void {
    this.gameObjects.clear();
    this.rigidBodies.clear();
    this.joints.clear();
    this.constraints = [];
    this.activeCollisions.clear();
    this.activeTriggers.clear();
    this.spatialHash.clear();
  }

  setGravity(g: Vector2D): void {
    this.gravity = g.clone();
  }

  getGravity(): Vector2D {
    return this.gravity.clone();
  }

  // Inicializar materiales predefinidos
  private initializeMaterials(): void {
    // Materiales comunes para juegos
    this.materials.set("default", {
      density: 1.0,
      friction: 0.3,
      restitution: 0.3,
      linearDamping: 0.01,
      angularDamping: 0.01,
    });

    this.materials.set("bouncy", {
      density: 0.5,
      friction: 0.1,
      restitution: 0.9,
      linearDamping: 0.01,
      angularDamping: 0.05,
    });

    this.materials.set("ice", {
      density: 0.9,
      friction: 0.02,
      restitution: 0.1,
      linearDamping: 0.001,
      angularDamping: 0.001,
    });

    this.materials.set("metal", {
      density: 7.8,
      friction: 0.7,
      restitution: 0.2,
      linearDamping: 0.02,
      angularDamping: 0.02,
    });

    this.materials.set("rubber", {
      density: 1.2,
      friction: 0.9,
      restitution: 0.8,
      linearDamping: 0.1,
      angularDamping: 0.1,
    });
  }

  // Inicializar sistema de eventos
  private initializeEventSystem(): void {
    const events: (keyof PhysicsEvents)[] = [
      "collision-start",
      "collision-end",
      "trigger-enter",
      "trigger-exit",
      "object-sleep",
      "object-wake",
      "bounds-exit",
    ];

    events.forEach((event) => {
      this.eventListeners.set(event, []);
    });
  }

  // GESTIÓN DE OBJETOS

  // Agregar objeto con configuración automática
  addObject(gameObject: GameObject, materialName?: string): void {
    if (!gameObject.physics) {
      console.warn(
        `⚠️ [PHYSICS] Object ${gameObject.id} has no physics component`
      );
      return;
    }

    // Aplicar material si se especifica
    if (materialName && this.materials.has(materialName)) {
      this.applyMaterial(gameObject, materialName);
    }

    this.gameObjects.set(gameObject.id, gameObject);

    // Crear RigidBody para física avanzada
    this.createRigidBody(gameObject);

    console.log(
      `➕ [PHYSICS] Added object ${gameObject.id} with material: ${
        materialName || "default"
      }`
    );
  }

  // Crear RigidBody para un GameObject
  private createRigidBody(gameObject: GameObject): void {
    if (!gameObject.physics) return;

    const rigidBody: RigidBody = {
      id: gameObject.id,
      gameObject,
      shape: this.calculateShape(gameObject),
      centerOfMass: this.calculateCenterOfMass(gameObject),
      momentOfInertia: this.calculateMomentOfInertia(gameObject),
      collisionLayers: gameObject.physics.collisionLayers || [
        CollisionLayer.Default,
      ],
      collisionMask: gameObject.physics.collisionMask || [
        CollisionLayer.Default,
      ],
      isTrigger: gameObject.physics.isTrigger || false,
      lastPosition: gameObject.position.clone(),
      lastRotation: gameObject.rotation,
    };

    this.rigidBodies.set(gameObject.id, rigidBody);
  }

  // Calcular forma de colisión
  private calculateShape(gameObject: GameObject): any {
    // Implementar según el tipo de shape del GameObject
    return {
      type: "rectangle", // 'circle', 'polygon', 'compound'
      width: gameObject.size.x,
      height: gameObject.size.y,
      radius: Math.max(gameObject.size.x, gameObject.size.y) / 2,
    };
  }

  // Calcular centro de masa
  private calculateCenterOfMass(gameObject: GameObject): Vector2D {
    // Para formas simples, el centro geométrico
    return new Vector2D(0, 0);
  }

  // Calcular momento de inercia
  private calculateMomentOfInertia(gameObject: GameObject): number {
    if (!gameObject.physics) return 0;

    const mass = gameObject.physics.mass;
    const w = gameObject.size.x;
    const h = gameObject.size.y;

    // Para un rectángulo: I = m * (w² + h²) / 12
    return (mass * (w * w + h * h)) / 12;
  }

  // Aplicar material a un objeto
  applyMaterial(gameObject: GameObject, materialName: string): void {
    const material = this.materials.get(materialName);
    if (!material || !gameObject.physics) return;

    const physics = gameObject.physics;
    physics.friction = material.friction;
    physics.restitution = material.restitution;
    physics.linearDamping = material.linearDamping;
    physics.angularDamping = material.angularDamping;

    // Actualizar masa basada en densidad
    const volume = gameObject.size.x * gameObject.size.y;
    physics.mass = material.density * volume;
  }

  // SIMULACIÓN PRINCIPAL

  update(deltaTime: number): void {
    // Implementación principal está definida más abajo con manejo de pausa
    // Este método se mantiene para contexto pero su duplicado fue eliminado.
    if (this.isPaused) return;

    const startTime = performance.now();

    const clampedDeltaTime = Math.min(deltaTime, this.config.maxDeltaTime);
    if (clampedDeltaTime <= 0) return;

    const substeps = Math.ceil(clampedDeltaTime / this.config.targetTimeStep);
    const actualSubsteps = Math.min(substeps, this.config.maxSubsteps);
    const stepTime = clampedDeltaTime / actualSubsteps;

    this.performanceMetrics.collisionChecks = 0;
    this.performanceMetrics.objectsSimulated = 0;

    for (let step = 0; step < actualSubsteps; step++) {
      this.simulateStep(stepTime);
    }

    if (this.config.broadPhaseOptimization) {
      this.updateSpatialHash();
    }

    if (this.config.enableSleeping) {
      this.updateSleepStates();
    }

    if (this.worldBounds) {
      this.applyWorldBounds();
    }

    const endTime = performance.now();
    const frameTime = endTime - startTime;
    this.performanceMetrics.lastFrameTime = frameTime;
    this.performanceMetrics.averageFrameTime =
      this.performanceMetrics.averageFrameTime * 0.9 + frameTime * 0.1;
  }

  // SISTEMAS AVANZADOS

  // Sistema de joints/articulaciones
  createDistanceJoint(
    objA: GameObject,
    objB: GameObject,
    options: {
      length?: number;
      stiffness?: number;
      damping?: number;
      anchorA?: Vector2D;
      anchorB?: Vector2D;
    }
  ): string {
    const joint: Joint = {
      id: `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "distance",
      objectA: objA.id,
      objectB: objB.id,
      anchorA: options.anchorA || new Vector2D(0, 0),
      anchorB: options.anchorB || new Vector2D(0, 0),
      targetLength: options.length || objA.position.distance(objB.position),
      stiffness: options.stiffness || 1.0,
      damping: options.damping || 0.1,
      enabled: true,
    };

    this.joints.set(joint.id, joint);
    console.log(
      `🔗 [PHYSICS] Created distance joint between ${objA.id} and ${objB.id}`
    );
    return joint.id;
  }

  // Crear joint de revolución (bisagra)
  createRevoluteJoint(
    objA: GameObject,
    objB: GameObject,
    anchor: Vector2D,
    options?: {
      enableLimit?: boolean;
      lowerAngle?: number;
      upperAngle?: number;
      enableMotor?: boolean;
      motorSpeed?: number;
      maxMotorTorque?: number;
    }
  ): string {
    const joint: Joint = {
      id: `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "revolute",
      objectA: objA.id,
      objectB: objB.id,
      anchorA: anchor.clone(),
      anchorB: anchor.clone(),
      enabled: true,
      ...options,
    };

    this.joints.set(joint.id, joint);
    return joint.id;
  }

  // Resolver joints
  private resolveJoints(deltaTime: number): void {
    for (const joint of this.joints.values()) {
      if (!joint.enabled) continue;

      const objA = this.gameObjects.get(joint.objectA);
      const objB = this.gameObjects.get(joint.objectB);

      if (!objA || !objB || !objA.physics || !objB.physics) continue;

      switch (joint.type) {
        case "distance":
          this.resolveDistanceJoint(objA, objB, joint, deltaTime);
          break;
        case "revolute":
          this.resolveRevoluteJoint(objA, objB, joint, deltaTime);
          break;
        case "weld":
          this.resolveWeldJoint(objA, objB, joint, deltaTime);
          break;
      }
    }
  }

  // Stubs for joint resolvers to satisfy typings
  private resolveRevoluteJoint(
    _objA: GameObject,
    _objB: GameObject,
    _joint: Joint,
    _deltaTime: number
  ): void {
    // TODO: Implement revolute joint solver
  }

  private resolveWeldJoint(
    _objA: GameObject,
    _objB: GameObject,
    _joint: Joint,
    _deltaTime: number
  ): void {
    // TODO: Implement weld joint solver
  }

  // Resolver joint de distancia
  private resolveDistanceJoint(
    objA: GameObject,
    objB: GameObject,
    joint: Joint,
    deltaTime: number
  ): void {
    const posA = objA.position.add(joint.anchorA!);
    const posB = objB.position.add(joint.anchorB!);

    const delta = posB.subtract(posA);
    const currentLength = delta.magnitude();
    const targetLength = joint.targetLength!;

    if (Math.abs(currentLength - targetLength) < 0.01) return;

    const difference = currentLength - targetLength;
    const normal = delta.normalize();

    // Calcular fuerza del resorte
    const springForce = normal.multiply(difference * joint.stiffness! * -1);

    // Aplicar amortiguación
    const relativeVelocity = objB.physics!.velocity.subtract(
      objA.physics!.velocity
    );
    const dampingForce = normal.multiply(
      relativeVelocity.dot(normal) * joint.damping! * -1
    );

    const totalForce = springForce.add(dampingForce);

    if (!objA.physics!.isStatic) objA.applyForce(totalForce.multiply(-1));
    if (!objB.physics!.isStatic) objB.applyForce(totalForce);
  }

  // Sistema de capas de colisión
  private shouldObjectsCollide(objA: GameObject, objB: GameObject): boolean {
    if (!objA.physics || !objB.physics) return false;

    const layersA = objA.physics.collisionLayers || [CollisionLayer.Default];
    const maskA = objA.physics.collisionMask || [CollisionLayer.Default];
    const layersB = objB.physics.collisionLayers || [CollisionLayer.Default];
    const maskB = objB.physics.collisionMask || [CollisionLayer.Default];

    // Verificar si A puede colisionar con las capas de B
    const aCanCollideWithB = layersB.some((layer) => maskA.includes(layer));
    const bCanCollideWithA = layersA.some((layer) => maskB.includes(layer));

    return aCanCollideWithB && bCanCollideWithA;
  }

  // OPTIMIZACIÓN ESPACIAL

  // Actualizar hash espacial para optimización
  private updateSpatialHash(): void {
    this.spatialHash.clear();

    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.active) continue;

      const bounds = gameObject.getBounds();
      const cellSize = this.config.spatialHashCellSize;

      const minX = Math.floor(bounds.left / cellSize);
      const maxX = Math.floor(bounds.right / cellSize);
      const minY = Math.floor(bounds.top / cellSize);
      const maxY = Math.floor(bounds.bottom / cellSize);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          if (!this.spatialHash.has(key)) {
            this.spatialHash.set(key, new Set());
          }
          this.spatialHash.get(key)!.add(gameObject);
        }
      }
    }
  }

  // Obtener objetos cercanos para optimización
  private getNearbyObjects(gameObject: GameObject): GameObject[] {
    if (!this.config.broadPhaseOptimization) {
      return Array.from(this.gameObjects.values());
    }

    const bounds = gameObject.getBounds();
    const cellSize = this.config.spatialHashCellSize;
    const nearby = new Set<GameObject>();

    const minX = Math.floor(bounds.left / cellSize);
    const maxX = Math.floor(bounds.right / cellSize);
    const minY = Math.floor(bounds.top / cellSize);
    const maxY = Math.floor(bounds.bottom / cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const cell = this.spatialHash.get(key);
        if (cell) {
          cell.forEach((obj) => nearby.add(obj));
        }
      }
    }

    return Array.from(nearby);
  }

  // CONTINUOUS COLLISION DETECTION (CCD)

  // Detección continua de colisiones para objetos rápidos
  private applyContinuousCollisionDetection(
    gameObject: GameObject,
    deltaTime: number
  ): void {
    if (!this.config.enableCCD || !gameObject.physics) return;

    const physics = gameObject.physics;
    const speed = physics.velocity.magnitude();
    const threshold = Math.max(gameObject.size.x, gameObject.size.y);

    // Solo aplicar CCD si el objeto se mueve muy rápido
    if (speed * deltaTime <= threshold) return;

    // Crear múltiples puntos de muestreo a lo largo del movimiento
    const samples = Math.ceil((speed * deltaTime) / threshold);
    const stepSize = deltaTime / samples;

    const originalPosition = gameObject.position.clone();

    for (let i = 1; i <= samples; i++) {
      const progress = i / samples;
      const testPosition = originalPosition.add(
        physics.velocity.multiply(deltaTime * progress)
      );

      // Crear GameObject temporal para testing
      const testObject = { ...gameObject, position: testPosition };

      // Verificar colisiones en esta posición
      const nearbyObjects = this.getNearbyObjects(gameObject);
      for (const other of nearbyObjects) {
        if (other.id === gameObject.id) continue;
        if (!this.shouldCheckCollision(gameObject, other)) continue;

        const collision = this.collisionDetector.checkCollision(
          testObject as GameObject,
          other
        );
        if (collision) {
          // Interpolar posición de colisión
          const collisionTime = ((i - 1) / samples) * deltaTime;
          gameObject.position = originalPosition.add(
            physics.velocity.multiply(collisionTime)
          );

          // Resolver colisión temprana
          this.resolveCollision(gameObject, other, collision);
          return;
        }
      }
    }
  }

  // SISTEMAS DE ÁREA

  // Crear área de trigger
  createTriggerArea(
    id: string,
    position: Vector2D,
    size: Vector2D,
    layers?: CollisionLayer[]
  ): GameObject {
    const triggerObject = new GameObject({
      id,
      position: position.clone(),
      size: size.clone(),
      rotation: 0,
      physics: {
        mass: 0,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0,
        restitution: 0,
        isStatic: true,
        isTrigger: true,
        affectedByGravity: false,
        linearDamping: 0,
        angularDamping: 0,
        collisionLayers: layers || [CollisionLayer.Trigger],
        collisionMask: [
          CollisionLayer.Player,
          CollisionLayer.Enemy,
          CollisionLayer.Projectile,
        ],
      },
    });

    this.addObject(triggerObject);
    return triggerObject;
  }

  // FUERZAS Y CAMPOS

  // Aplicar fuerza de viento
  applyWind(force: Vector2D, affectedLayers?: CollisionLayer[]): void {
    for (const gameObject of this.gameObjects.values()) {
      if (!this.shouldSimulateObject(gameObject)) continue;

      // Verificar capas afectadas
      if (affectedLayers && gameObject.physics?.collisionLayers) {
        const hasAffectedLayer = gameObject.physics.collisionLayers.some(
          (layer) => affectedLayers.includes(layer)
        );
        if (!hasAffectedLayer) continue;
      }

      // Aplicar fuerza proporcional al área
      const area = gameObject.size.x * gameObject.size.y;
      const windForce = force.multiply(area * 0.001); // Factor de escala
      gameObject.applyForce(windForce);
    }
  }

  // Crear campo de fuerza radial (explosión, atracción)
  applyRadialForce(
    center: Vector2D,
    force: number,
    radius: number,
    mode: "explosion" | "implosion" = "explosion"
  ): void {
    for (const gameObject of this.gameObjects.values()) {
      if (!this.shouldSimulateObject(gameObject)) continue;

      const distance = gameObject.position.distance(center);
      if (distance > radius || distance < 0.1) continue;

      // Calcular fuerza basada en distancia
      const falloff = 1 - distance / radius;
      const direction = gameObject.position.subtract(center).normalize();

      if (mode === "implosion") {
        direction.x *= -1;
        direction.y *= -1;
      }

      const appliedForce = direction.multiply(
        force * falloff * gameObject.physics!.mass
      );
      gameObject.applyForce(appliedForce);

      console.log(
        `💥 [RADIAL] Applied force ${appliedForce.magnitude().toFixed(1)} to ${
          gameObject.id
        }`
      );
    }
  }

  // LÍMITES DEL MUNDO

  setWorldBounds(bounds: WorldBounds): void {
    this.worldBounds = bounds;
    console.log(`🌍 [PHYSICS] World bounds set:`, bounds);
  }

  private applyWorldBounds(): void {
    if (!this.worldBounds) return;

    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.physics || gameObject.physics.isStatic) continue;

      const bounds = gameObject.getBounds();
      const worldBounds = this.worldBounds;
      let bounced = false;

      // Límites horizontales
      if (bounds.left < worldBounds.left) {
        if (worldBounds.wrap) {
          gameObject.position.x = worldBounds.right - gameObject.size.x / 2;
        } else {
          gameObject.position.x = worldBounds.left + gameObject.size.x / 2;
          gameObject.physics.velocity.x =
            Math.abs(gameObject.physics.velocity.x) * 0.5;
          bounced = true;
        }
      } else if (bounds.right > worldBounds.right) {
        if (worldBounds.wrap) {
          gameObject.position.x = worldBounds.left + gameObject.size.x / 2;
        } else {
          gameObject.position.x = worldBounds.right - gameObject.size.x / 2;
          gameObject.physics.velocity.x =
            -Math.abs(gameObject.physics.velocity.x) * 0.5;
          bounced = true;
        }
      }

      // Límites verticales
      if (bounds.top < worldBounds.top) {
        gameObject.position.y = worldBounds.top + gameObject.size.y / 2;
        gameObject.physics.velocity.y =
          Math.abs(gameObject.physics.velocity.y) * 0.5;
        bounced = true;
      } else if (bounds.bottom > worldBounds.bottom) {
        if (worldBounds.wrap) {
          gameObject.position.y = worldBounds.top + gameObject.size.y / 2;
        } else {
          gameObject.position.y = worldBounds.bottom - gameObject.size.y / 2;
          gameObject.physics.velocity.y =
            -Math.abs(gameObject.physics.velocity.y) * 0.5;
          bounced = true;
        }
      }

      // Emitir evento si salió de límites
      if (bounced) {
        this.emit("bounds-exit", gameObject);
      }
    }
  }

  // SISTEMA DE EVENTOS

  on<K extends keyof PhysicsEvents>(
    event: K,
    callback: (data: PhysicsEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)!.push(callback);

    // Retornar función de cleanup
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emit<K extends keyof PhysicsEvents>(
    event: K,
    data: PhysicsEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `❌ [PHYSICS] Event callback error for ${event}:`,
            error
          );
        }
      });
    }
  }

  // RAYCAST PARA REACT NATIVE

  // Raycast para detección de línea de vista, etc.
  raycast(
    origin: Vector2D,
    direction: Vector2D,
    maxDistance: number,
    layers?: CollisionLayer[]
  ): {
    hit: boolean;
    object?: GameObject;
    point?: Vector2D;
    normal?: Vector2D;
    distance?: number;
  } {
    const normalizedDirection = direction.normalize();
    let closestHit: any = { hit: false, distance: Infinity };

    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.active || !gameObject.physics) continue;

      // Verificar capas
      if (layers && gameObject.physics.collisionLayers) {
        const hasValidLayer = gameObject.physics.collisionLayers.some((layer) =>
          layers.includes(layer)
        );
        if (!hasValidLayer) continue;
      }

      // Intersección ray-AABB simplificada
      const bounds = gameObject.getBounds();
      const hit = this.raycastAABB(
        origin,
        normalizedDirection,
        maxDistance,
        bounds
      );

      if (hit.hit && hit.distance! < closestHit.distance) {
        closestHit = {
          hit: true,
          object: gameObject,
          point: origin.add(normalizedDirection.multiply(hit.distance!)),
          normal: hit.normal,
          distance: hit.distance,
        };
      }
    }

    return closestHit;
  }

  // Raycast contra AABB
  private raycastAABB(
    origin: Vector2D,
    direction: Vector2D,
    maxDistance: number,
    bounds: any
  ): any {
    const tMin = new Vector2D(
      (bounds.left - origin.x) / direction.x,
      (bounds.top - origin.y) / direction.y
    );

    const tMax = new Vector2D(
      (bounds.right - origin.x) / direction.x,
      (bounds.bottom - origin.y) / direction.y
    );

    const t1 = new Vector2D(Math.min(tMin.x, tMax.x), Math.min(tMin.y, tMax.y));
    const t2 = new Vector2D(Math.max(tMin.x, tMax.x), Math.max(tMin.y, tMax.y));

    const tNear = Math.max(t1.x, t1.y);
    const tFar = Math.min(t2.x, t2.y);

    if (tNear > tFar || tFar < 0 || tNear > maxDistance) {
      return { hit: false };
    }

    const distance = tNear > 0 ? tNear : tFar;
    let normal = new Vector2D(0, 0);

    // Calcular normal de superficie
    if (t1.x > t1.y) {
      normal.x = direction.x > 0 ? -1 : 1;
    } else {
      normal.y = direction.y > 0 ? -1 : 1;
    }

    return { hit: true, distance, normal };
  }

  // GESTIÓN DE MATERIALES

  addMaterial(name: string, material: PhysicsMaterial): void {
    this.materials.set(name, material);
    console.log(`🧪 [PHYSICS] Added material: ${name}`);
  }

  getMaterial(name: string): PhysicsMaterial | undefined {
    return this.materials.get(name);
  }

  // UTILIDADES PARA REACT NATIVE

  // Pausar/reanudar físicas (importante para lifecycle de apps móviles)
  private isPaused = false;

  pause(): void {
    this.isPaused = true;
    console.log(`⏸️ [PHYSICS] Engine paused`);
  }

  resume(): void {
    this.isPaused = false;
    console.log(`▶️ [PHYSICS] Engine resumed`);
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  // Override del update principal para manejar pausa
  // (duplicate update method removed)

  // Simular un paso de física (actualizado)
  private simulateStep(deltaTime: number): void {
    // 1. Aplicar fuerzas externas (gravedad, viento, etc.)
    this.applyExternalForces(deltaTime);

    // 2. Aplicar CCD para objetos rápidos
    if (this.config.enableCCD) {
      for (const gameObject of this.gameObjects.values()) {
        if (this.shouldSimulateObject(gameObject)) {
          this.applyContinuousCollisionDetection(gameObject, deltaTime);
        }
      }
    }

    // 3. Integrar física de todos los objetos
    this.integratePhysics(deltaTime);

    // 4. Resolver joints y constraints
    this.resolveJoints(deltaTime);
    this.resolveConstraints(deltaTime);

    // 5. Detectar y resolver colisiones
    this.handleCollisions();

    // 6. Post-procesamiento
    this.postProcessPhysics(deltaTime);
  }

  // Aplicar fuerzas externas (implementación completa)
  private applyExternalForces(deltaTime: number): void {
    for (const gameObject of this.gameObjects.values()) {
      if (!this.shouldSimulateObject(gameObject)) continue;

      // Aplicar gravedad
      if (gameObject.physics!.affectedByGravity) {
        const gravityForce = this.gravity.multiply(gameObject.physics!.mass);
        gameObject.applyForce(gravityForce);
      }

      // Aplicar resistencia del aire/fricción
      this.applyDamping(gameObject, deltaTime);

      // Aplicar fuerzas personalizadas del objeto
      if (gameObject.physics!.customForces) {
        for (const customForce of gameObject.physics!.customForces) {
          gameObject.applyForce(customForce);
        }
        gameObject.physics!.customForces = []; // Reset custom forces
      }
    }
  }

  // Aplicar amortiguación mejorada
  private applyDamping(gameObject: GameObject, deltaTime: number): void {
    if (!gameObject.physics) return;

    const physics = gameObject.physics;

    // Fricción lineal (resistencia del aire) - exponential decay
    if (physics.linearDamping > 0) {
      const damping = Math.exp(-physics.linearDamping * deltaTime);
      physics.velocity.x *= damping;
      physics.velocity.y *= damping;
    }

    // Fricción angular - exponential decay
    if (physics.angularDamping > 0) {
      const damping = Math.exp(-physics.angularDamping * deltaTime);
      physics.angularVelocity *= damping;
    }
  }

  // Integrar física mejorada
  private integratePhysics(deltaTime: number): void {
    for (const gameObject of this.gameObjects.values()) {
      if (!this.shouldSimulateObject(gameObject)) continue;

      this.performanceMetrics.objectsSimulated++;
      this.integrateObject(gameObject, deltaTime);
    }
  }

  // Integrar objeto con Verlet mejorado
  private integrateObject(gameObject: GameObject, deltaTime: number): void {
    if (!gameObject.physics) return;

    const physics = gameObject.physics;

    // Guardar estado anterior para rollback si es necesario
    const previousPosition = gameObject.position.clone();
    const previousVelocity = physics.velocity.clone();

    // Calcular aceleración total
    const acceleration = new Vector2D(
      physics.acceleration.x,
      physics.acceleration.y
    );

    // Añadir aceleración por fuerzas (F = ma)
    if (physics.mass > 0) {
      acceleration.x += physics.force.x / physics.mass;
      acceleration.y += physics.force.y / physics.mass;
    }

    // Integración de velocidad (Verlet velocity)
    physics.velocity.x += acceleration.x * deltaTime;
    physics.velocity.y += acceleration.y * deltaTime;

    // Aplicar límites de velocidad para estabilidad numérica
    const maxVelocity = 2000; // px/s - ajustable según necesidades
    const speed = physics.velocity.magnitude();
    if (speed > maxVelocity) {
      const scale = maxVelocity / speed;
      physics.velocity.x *= scale;
      physics.velocity.y *= scale;
    }

    // Integración de posición
    gameObject.position.x += physics.velocity.x * deltaTime;
    gameObject.position.y += physics.velocity.y * deltaTime;

    // Integración angular
    physics.angularVelocity += physics.angularAcceleration * deltaTime;
    gameObject.rotation += physics.angularVelocity * deltaTime;

    // Normalizar rotación
    gameObject.rotation = gameObject.rotation % (2 * Math.PI);

    // Almacenar estados previos
    physics.previousPosition = previousPosition;
    physics.previousVelocity = previousVelocity;

    // Resetear fuerzas acumuladas
    physics.force.x = 0;
    physics.force.y = 0;
    physics.angularAcceleration = 0;
  }

  // Resolver constraints personalizados
  private resolveConstraints(deltaTime: number): void {
    for (const constraint of this.constraints) {
      if (!constraint.enabled) continue;

      switch (constraint.type) {
        case "position":
          this.resolvePositionConstraint(constraint, deltaTime);
          break;
        case "velocity":
          this.resolveVelocityConstraint(constraint, deltaTime);
          break;
        case "angle":
          this.resolveAngleConstraint(constraint, deltaTime);
          break;
      }
    }
  }

  // Post-procesamiento después de físicas
  private postProcessPhysics(deltaTime: number): void {
    // Verificar estabilidad numérica
    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.physics) continue;

      // Detectar valores NaN o infinitos
      if (!this.isValidPhysicsState(gameObject)) {
        console.error(
          `❌ [PHYSICS] Invalid physics state for ${gameObject.id}, resetting`
        );
        this.resetPhysicsState(gameObject);
      }

      // Aplicar threshold de velocidad mínima
      if (Math.abs(gameObject.physics.velocity.x) < 0.01) {
        gameObject.physics.velocity.x = 0;
      }
      if (Math.abs(gameObject.physics.velocity.y) < 0.01) {
        gameObject.physics.velocity.y = 0;
      }
    }
  }

  // Verificar estado válido de física
  private isValidPhysicsState(gameObject: GameObject): boolean {
    if (!gameObject.physics) return true;

    const p = gameObject.physics;
    return (
      !isNaN(gameObject.position.x) &&
      !isNaN(gameObject.position.y) &&
      !isNaN(p.velocity.x) &&
      !isNaN(p.velocity.y) &&
      !isNaN(p.force.x) &&
      !isNaN(p.force.y) &&
      isFinite(gameObject.position.x) &&
      isFinite(gameObject.position.y) &&
      isFinite(p.velocity.x) &&
      isFinite(p.velocity.y)
    );
  }

  // Resetear estado de física corrupto
  private resetPhysicsState(gameObject: GameObject): void {
    if (!gameObject.physics) return;

    gameObject.physics.velocity.x = 0;
    gameObject.physics.velocity.y = 0;
    gameObject.physics.force.x = 0;
    gameObject.physics.force.y = 0;
    gameObject.physics.angularVelocity = 0;
    gameObject.physics.angularAcceleration = 0;
  }

  // OPTIMIZACIONES PARA MÓVILES

  // Configurar calidad de físicas según performance del dispositivo
  setQualityLevel(level: "low" | "medium" | "high"): void {
    switch (level) {
      case "low":
        this.config.maxSubsteps = 2;
        this.config.targetTimeStep = 1 / 30;
        this.config.enableCCD = false;
        this.config.broadPhaseOptimization = true;
        this.config.spatialHashCellSize = 200;
        break;

      case "medium":
        this.config.maxSubsteps = 4;
        this.config.targetTimeStep = 1 / 60;
        this.config.enableCCD = false;
        this.config.broadPhaseOptimization = true;
        this.config.spatialHashCellSize = 100;
        break;

      case "high":
        this.config.maxSubsteps = 8;
        this.config.targetTimeStep = 1 / 120;
        this.config.enableCCD = true;
        this.config.broadPhaseOptimization = true;
        this.config.spatialHashCellSize = 50;
        break;
    }

    console.log(`🎛️ [PHYSICS] Quality level set to ${level}`);
  }

  // Obtener recomendación de calidad basada en FPS
  getRecommendedQuality(): "low" | "medium" | "high" {
    const avgFPS = 1000 / this.performanceMetrics.averageFrameTime;

    if (avgFPS < 30) return "low";
    if (avgFPS < 50) return "medium";
    return "high";
  }

  // MÉTODOS DE DEBUGGING Y ANÁLISIS

  // Obtener métricas de rendimiento
  getPerformanceMetrics(): typeof this.performanceMetrics & {
    fps: number;
    recommendedQuality: string;
  } {
    const fps = 1000 / this.performanceMetrics.averageFrameTime;
    return {
      ...this.performanceMetrics,
      fps: Math.round(fps),
      recommendedQuality: this.getRecommendedQuality(),
    };
  }

  // Debug: obtener información completa del estado
  getDebugInfo(): any {
    const activeObjects = this.getActiveObjectCount();
    const sleepingObjects = this.getObjectCount() - activeObjects;

    return {
      totalObjects: this.getObjectCount(),
      activeObjects,
      sleepingObjects,
      totalJoints: this.joints.size,
      totalConstraints: this.constraints.length,
      gravity: this.gravity,
      config: this.config,
      worldBounds: this.worldBounds,
      performance: this.getPerformanceMetrics(),
      spatialHashCells: this.spatialHash.size,
      isPaused: this.isPaused,
    };
  }

  // Exportar estado del mundo para serialización
  exportWorldState(): any {
    const objects: any[] = [];

    for (const gameObject of this.gameObjects.values()) {
      objects.push({
        id: gameObject.id,
        position: gameObject.position,
        rotation: gameObject.rotation,
        size: gameObject.size,
        physics: gameObject.physics,
        active: gameObject.active,
      });
    }

    return {
      objects,
      gravity: this.gravity,
      config: this.config,
      worldBounds: this.worldBounds,
      timestamp: Date.now(),
    };
  }

  // Importar estado del mundo
  importWorldState(worldState: any): void {
    this.clear();

    this.gravity = new Vector2D(worldState.gravity.x, worldState.gravity.y);
    this.config = { ...this.config, ...worldState.config };
    this.worldBounds = worldState.worldBounds;

    // Recrear objetos (requiere factory de GameObjects)
    console.log(
      `📦 [PHYSICS] Imported world state with ${worldState.objects.length} objects`
    );
  }

  // UTILIDADES ESPECÍFICAS PARA REACT NATIVE

  // Manejar cambios de orientación de pantalla
  handleOrientationChange(newOrientation: "portrait" | "landscape"): void {
    // Pausar brevemente durante el cambio
    this.pause();

    // Ajustar configuración según orientación
    if (newOrientation === "landscape") {
      // Landscape puede manejar más objetos
      this.setQualityLevel("medium");
    }

    setTimeout(() => {
      this.resume();
      console.log(`📱 [PHYSICS] Adapted to ${newOrientation} orientation`);
    }, 100);
  }

  // Optimización para background/foreground de app
  handleAppStateChange(appState: "active" | "background" | "inactive"): void {
    switch (appState) {
      case "background":
      case "inactive":
        this.pause();
        break;
      case "active":
        this.resume();
        break;
    }
  }

  // Ajuste automático de calidad basado en rendimiento
  enableAdaptiveQuality(enabled: boolean = true): void {
    if (!enabled) return;

    // Verificar rendimiento cada 2 segundos
    setInterval(() => {
      if (this.isPaused) return;

      const recommended = this.getRecommendedQuality();
      const current = this.getCurrentQualityLevel();

      if (recommended !== current) {
        console.log(
          `🎯 [PHYSICS] Auto-adjusting quality from ${current} to ${recommended}`
        );
        this.setQualityLevel(recommended);
      }
    }, 2000);
  }

  private getCurrentQualityLevel(): "low" | "medium" | "high" {
    if (this.config.maxSubsteps <= 2) return "low";
    if (this.config.maxSubsteps <= 4) return "medium";
    return "high";
  }

  // MÉTODOS HEREDADOS MEJORADOS

  private shouldSimulateObject(gameObject: GameObject): boolean {
    const p = gameObject.physics;
    return Boolean(
      gameObject.active &&
      p &&
      !p.isStatic &&
      (!this.config.enableSleeping || !p.isSleeping)
    );
  }

  private shouldCheckCollision(objA: GameObject, objB: GameObject): boolean {
    if (!objA.active || !objB.active) return false;
    if (!objA.physics || !objB.physics) return false;

    // Optimización: no verificar colisiones entre objetos estáticos
    if (objA.physics.isStatic && objB.physics.isStatic) return false;

    // Verificar capas de colisión
    if (!this.shouldObjectsCollide(objA, objB)) return false;

    // Skip collision between same group objects if specified
    if (
      objA.physics.collisionGroup &&
      objA.physics.collisionGroup === objB.physics.collisionGroup
    ) {
      return false;
    }

    // Verificar si están durmiendo
    if (
      this.config.enableSleeping &&
      objA.physics.isSleeping &&
      objB.physics.isSleeping
    )
      return false;

    return true;
  }

  private handleCollisions(): void {
    const objects = Array.from(this.gameObjects.values());
    const collisions: CollisionEvent[] = [];

    // Broad phase optimizado
    for (let i = 0; i < objects.length; i++) {
      const objA = objects[i];
      if (!objA.active || !objA.physics) continue;

      const nearbyObjects = this.config.broadPhaseOptimization
        ? this.getNearbyObjects(objA)
        : objects;

      for (const objB of nearbyObjects) {
        if (objA.id >= objB.id) continue; // Evitar duplicados
        if (!this.shouldCheckCollision(objA, objB)) continue;

        this.performanceMetrics.collisionChecks++;

        const collision = this.collisionDetector.checkCollision(objA, objB);
        if (collision) {
          collisions.push(collision);
        }
      }
    }

    // Resolver colisiones y manejar eventos
    this.processCollisions(collisions);
  }

  // Procesar colisiones con eventos
  private processCollisions(collisions: CollisionEvent[]): void {
    // Resolver colisiones físicas
    collisions.sort((a, b) => b.penetration - a.penetration);

    for (const collision of collisions) {
      const objA = this.gameObjects.get(collision.objectA);
      const objB = this.gameObjects.get(collision.objectB);

      if (!objA || !objB) continue;

      const collisionKey = this.getCollisionKey(objA.id, objB.id);
      const wasPreviouslyColliding = this.activeCollisions.has(collisionKey);

      // Manejar triggers vs colisiones sólidas
      if (objA.physics?.isTrigger || objB.physics?.isTrigger) {
        this.handleTriggerCollision(
          objA,
          objB,
          collision,
          wasPreviouslyColliding
        );
      } else {
        this.handleSolidCollision(
          objA,
          objB,
          collision,
          wasPreviouslyColliding
        );
      }

      this.activeCollisions.add(collisionKey);
    }

    // Detectar colisiones que terminaron
    this.detectEndedCollisions(collisions);
  }

  private handleTriggerCollision(
    objA: GameObject,
    objB: GameObject,
    collision: CollisionEvent,
    wasPrevious: boolean
  ): void {
    if (!wasPrevious) {
      this.emit("trigger-enter", collision);
      console.log(`🎯 [TRIGGER] Enter: ${objA.id} <-> ${objB.id}`);
    }
  }

  private handleSolidCollision(
    objA: GameObject,
    objB: GameObject,
    collision: CollisionEvent,
    wasPrevious: boolean
  ): void {
    // Resolver física de colisión
    this.resolveCollision(objA, objB, collision);

    if (!wasPrevious) {
      this.emit("collision-start", collision);
      console.log(`💥 [COLLISION] Start: ${objA.id} <-> ${objB.id}`);
    }
  }

  private detectEndedCollisions(currentCollisions: CollisionEvent[]): void {
    const currentCollisionKeys = new Set(
      currentCollisions.map((c) => this.getCollisionKey(c.objectA, c.objectB))
    );

    for (const previousKey of this.activeCollisions) {
      if (!currentCollisionKeys.has(previousKey)) {
        // Esta colisión terminó
        this.activeCollisions.delete(previousKey);

        const [idA, idB] = previousKey.split("|");
        const objA = this.gameObjects.get(idA);
        const objB = this.gameObjects.get(idB);

        if (objA && objB) {
          const endEvent: CollisionEvent = {
            objectA: objA.id,
            objectB: objB.id,
            point: new Vector2D(0, 0),
            normal: new Vector2D(0, 0),
            penetration: 0,
          };

          if (objA.physics?.isTrigger || objB.physics?.isTrigger) {
            this.emit("trigger-exit", endEvent);
          } else {
            this.emit("collision-end", endEvent);
          }
        }
      }
    }
  }

  private getCollisionKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  }

  // Actualizar estados de sueño mejorado
  private updateSleepStates(): void {
    for (const gameObject of this.gameObjects.values()) {
      if (!gameObject.physics || gameObject.physics.isStatic) continue;

      const physics = gameObject.physics;
      const speed = physics.velocity.magnitude();
      const angularSpeed = Math.abs(physics.angularVelocity);

      const wasAwake = !physics.isSleeping;

      // Marcar como durmiendo si se mueve muy lento
      if (speed < this.config.velocityThreshold && angularSpeed < 0.01) {
        physics.sleepTimer = (physics.sleepTimer || 0) + 1;
        if (physics.sleepTimer > 60) {
          // ~1 segundo a 60fps
          if (wasAwake) {
            physics.isSleeping = true;
            physics.velocity.x = 0;
            physics.velocity.y = 0;
            physics.angularVelocity = 0;
            this.performanceMetrics.sleepingObjects++;
            this.emit("object-sleep", gameObject);
          }
        }
      } else {
        if (!wasAwake) {
          this.emit("object-wake", gameObject);
          this.performanceMetrics.sleepingObjects--;
        }
        physics.sleepTimer = 0;
        physics.isSleeping = false;
      }
    }
  }

  // RESOLUCIÓN DE COLISIONES MEJORADA (mantener métodos existentes)
  private resolveCollision(
    objA: GameObject,
    objB: GameObject,
    collision: CollisionEvent
  ): void {
    if (!objA.physics || !objB.physics) return;

    const normal = collision.normal.clone();
    const penetration = collision.penetration;

    // 1. SEPARACIÓN POSICIONAL
    this.separateObjects(objA, objB, normal, penetration);

    // 2. RESOLUCIÓN DE VELOCIDADES
    this.resolveVelocities(objA, objB, normal);

    // Despertar objetos si estaban durmiendo
    if (this.config.enableSleeping) {
      if (objA.physics.isSleeping) {
        objA.physics.isSleeping = false;
        this.emit("object-wake", objA);
      }
      if (objB.physics.isSleeping) {
        objB.physics.isSleeping = false;
        this.emit("object-wake", objB);
      }
    }
  }

  // [Mantener todos los métodos de separación y resolución anteriores...]
  private separateObjects(
    objA: GameObject,
    objB: GameObject,
    normal: Vector2D,
    penetration: number
  ): void {
    const physicsA = objA.physics!;
    const physicsB = objB.physics!;

    let separationA = 0;
    let separationB = 0;

    if (physicsA.isStatic && physicsB.isStatic) {
      return;
    } else if (physicsA.isStatic) {
      separationB = penetration;
    } else if (physicsB.isStatic) {
      separationA = penetration;
    } else {
      const totalInverseMass = 1 / physicsA.mass + 1 / physicsB.mass;
      separationA = (penetration * (1 / physicsA.mass)) / totalInverseMass;
      separationB = (penetration * (1 / physicsB.mass)) / totalInverseMass;
    }

    if (separationA > 0) {
      const separationVectorA = normal.multiply(separationA);
      objA.position = objA.position.add(separationVectorA);
    }

    if (separationB > 0) {
      const separationVectorB = normal.multiply(-separationB);
      objB.position = objB.position.add(separationVectorB);
    }

    if (Math.abs(normal.y) > 0.7) {
      this.snapToSurface(objA, objB, normal);
    }
  }

  private snapToSurface(
    objA: GameObject,
    objB: GameObject,
    normal: Vector2D
  ): void {
    const physicsA = objA.physics!;
    const physicsB = objB.physics!;

    if (physicsA.isStatic && !physicsB.isStatic) {
      const boundsA = objA.getBounds();
      const halfHeightB = objB.size.y / 2;

      if (normal.y < -0.7) {
        objB.position.y = boundsA.top - halfHeightB;
      } else if (normal.y > 0.7) {
        objB.position.y = boundsA.bottom + halfHeightB;
      }
    } else if (!physicsA.isStatic && physicsB.isStatic) {
      const boundsB = objB.getBounds();
      const halfHeightA = objA.size.y / 2;

      if (normal.y > 0.7) {
        objA.position.y = boundsB.top - halfHeightA;
      } else if (normal.y < -0.7) {
        objA.position.y = boundsB.bottom + halfHeightA;
      }
    }
  }

  private resolveVelocities(
    objA: GameObject,
    objB: GameObject,
    normal: Vector2D
  ): void {
    const physicsA = objA.physics!;
    const physicsB = objB.physics!;

    const relativeVelocity = new Vector2D(
      physicsB.velocity.x - physicsA.velocity.x,
      physicsB.velocity.y - physicsA.velocity.y
    );

    const separatingVelocity = relativeVelocity.dot(normal);
    if (separatingVelocity > 0) return;

    const restitution = Math.min(physicsA.restitution, physicsB.restitution);
    const newSeparatingVelocity = -separatingVelocity * restitution;
    const deltaVelocity = newSeparatingVelocity - separatingVelocity;

    const totalInverseMass =
      this.getInverseMass(physicsA) + this.getInverseMass(physicsB);
    if (totalInverseMass <= 0) return;

    const impulseMagnitude = deltaVelocity / totalInverseMass;
    const impulse = normal.multiply(impulseMagnitude);

    if (!physicsA.isStatic) {
      const impulseA = impulse.multiply(-this.getInverseMass(physicsA));
      this.applyImpulseToObject(objA, impulseA);
    }

    if (!physicsB.isStatic) {
      const impulseB = impulse.multiply(this.getInverseMass(physicsB));
      this.applyImpulseToObject(objB, impulseB);
    }

    //this.applyFriction(objA, objB, normal, impulseMagnitude);
  }

  private getInverseMass(physics: PhysicsComponent): number {
    return physics.isStatic ? 0 : 1 / physics.mass;
  }

  private applyImpulseToObject(
    gameObject: GameObject,
    impulse: Vector2D
  ): void {
    if (!gameObject.physics || gameObject.physics.isStatic) return;

    gameObject.physics.velocity.x += impulse.x;
    gameObject.physics.velocity.y += impulse.y;
  }

  /*  private applyFriction(objA: GameObject, objB: GameObject, normal: Vector2D, normalImpulse: number): void {
    if (!objA.physics || !objB.physics) return;

    const tangent = new Vector2D(-normal.y, normal.x);
    const relativeVelocity = new Vector2D(
      objB.physics.velocity.x - objA.physics.velocity.x,
      objB.physics.velocity.y - objA.physics.velocity.y
    );

    const tangentialVelocity = relativeVelocity.dot(tangent);
    if (Math.abs(tangentialVelocity) < 0.01) return;

    const friction = (objA.physics.friction + objB.physics.friction) / 2;
    const totalInverseMass = this.getInverseMass(objA.physics) + this.getInverseMass(objB.physics);
    let frictionImpulse = -tangentialVelocity / totalInverseMass;

    const maxFriction = Math.abs(normalImpulse) * friction;
    frictionImpulse = Math.sign(frictionImpulse) * Math.min(Math.abs(frictionImpulse), maxFriction);

    const frictionVector = tangent.multiply(frictionImpulse);

    if (!objA.physics.isStatic) {
      const frictionA = frictionVector.multiply(-this.getInverseMass(objA.physics));
      objA.physics.velocity.x */
}
