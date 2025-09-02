import { GameLoop } from "./GameLoop";
import { PhysicsEngine } from "../physics/PhysicsEngine";
import { TouchInputManager } from "../input/TouchInputManager";
import { TouchInputManagerRN } from "../input/TouchInputManagerRN";
import { GameObject } from "./GameObject";
import { Vector2D } from "../math/Vector2D";
import { GameEngineConfig, CollisionEvent } from "../types";

// Motor principal del juego que coordina todos los sistemas
export class GameEngine {
  private gameLoop: GameLoop;
  private physicsEngine: PhysicsEngine;
  private touchInputManager: TouchInputManager | TouchInputManagerRN;
  private gameObjects: Map<string, GameObject> = new Map();
  private config: GameEngineConfig;
  private isInitialized: boolean = false;

  // Callbacks del usuario
  private updateCallback: (deltaTime: number) => void = () => {};
  private renderCallback: (interpolation: number) => void = () => {};

  constructor(config: GameEngineConfig) {
    this.config = config;

    // Inicializar sistemas
    this.gameLoop = new GameLoop(config.gameLoop);
    this.physicsEngine = new PhysicsEngine(config.gravity);
    this.touchInputManager = this.createTouchInputManager();

    this.setupGameLoop();
  }

  // Crear el TouchInputManager apropiado según el entorno
  private createTouchInputManager(): TouchInputManager | TouchInputManagerRN {
    // Detectar si estamos en React Native
    if (
      typeof document === "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.product === "ReactNative"
    ) {
      return new TouchInputManagerRN();
    }
    // Detectar si estamos en un entorno sin DOM (como React Native)
    if (typeof document === "undefined") {
      return new TouchInputManagerRN();
    }
    // Usar TouchInputManager web por defecto
    return new TouchInputManager();
  }

  // Configurar el loop principal del juego
  private setupGameLoop(): void {
    this.gameLoop.setUpdateCallback((deltaTime: number) => {
      // deltaTime ya viene en segundos desde GameLoop
      this.update(deltaTime);
    });

    this.gameLoop.setRenderCallback((interpolation: number) => {
      this.render(interpolation);
    });
  }

  // Inicializar el motor
  initialize(): void {
    if (this.isInitialized) return;

    // Configurar callbacks de colisiones
    this.physicsEngine.onCollision((collision: CollisionEvent) => {
      this.handleCollision(collision);
    });

    this.isInitialized = true;
  }

  // Iniciar el juego
  start(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
    this.gameLoop.start();
  }

  // Pausar el juego
  pause(): void {
    this.gameLoop.stop();
  }

  // Reanudar el juego
  resume(): void {
    this.gameLoop.start();
  }

  // Detener el juego completamente
  stop(): void {
    this.gameLoop.stop();
    this.cleanup();
  }

  // Actualización principal del juego
  private update(deltaTime: number): void {
    // Actualizar física
    this.physicsEngine.update(deltaTime);

    // Actualizar objetos del juego
    for (const gameObject of this.gameObjects.values()) {
      if (gameObject.active) {
        gameObject.update(deltaTime);
      }
    }

    // Llamar callback de actualización del usuario
    this.updateCallback(deltaTime);

    // Limpiar objetos inactivos
    this.cleanupInactiveObjects();
  }

  // Renderizado del juego
  private render(interpolation: number): void {
    this.renderCallback(interpolation);
  }

  // Manejar colisiones
  private handleCollision(collision: CollisionEvent): void {
    const objA = this.gameObjects.get(collision.objectA);
    const objB = this.gameObjects.get(collision.objectB);

    if (objA && objB) {
      // Aquí se pueden agregar efectos de sonido, partículas, etc.
      console.log(`Colisión entre ${objA.id} y ${objB.id}`);
    }
  }

  // Limpiar objetos inactivos
  private cleanupInactiveObjects(): void {
    const toRemove: string[] = [];

    for (const [id, gameObject] of this.gameObjects.entries()) {
      if (!gameObject.active) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeGameObject(id);
    }
  }

  // API pública para gestión de objetos
  addGameObject(gameObject: GameObject): void {
    this.gameObjects.set(gameObject.id, gameObject);

    if (gameObject.physics) {
      this.physicsEngine.addObject(gameObject);
    }
  }

  removeGameObject(id: string): void {
    const gameObject = this.gameObjects.get(id);
    if (gameObject) {
      this.physicsEngine.removeObject(id);
      this.gameObjects.delete(id);
    }
  }

  getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }

  // API para callbacks del usuario
  onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  onRender(callback: (interpolation: number) => void): void {
    this.renderCallback = callback;
  }

  // API para input táctil
  onTouch(
    id: string,
    callback: (event: import("../types").GameTouchEvent) => void
  ): void {
    this.touchInputManager.onTouch(id, callback);
  }

  onGesture(
    id: string,
    callback: (
      gesture: import("../input/TouchInputManager").GestureEvent
    ) => void
  ): void {
    this.touchInputManager.onGesture(id, callback);
  }

  // API para física
  setGravity(gravity: Vector2D): void {
    this.physicsEngine.setGravity(gravity);
  }

  getGravity(): Vector2D {
    return this.physicsEngine.getGravity();
  }

  // Utilidades
  getObjectsInArea(center: Vector2D, radius: number): GameObject[] {
    const objectsInArea: GameObject[] = [];

    for (const gameObject of this.gameObjects.values()) {
      if (gameObject.active && gameObject.position.distance(center) <= radius) {
        objectsInArea.push(gameObject);
      }
    }

    return objectsInArea;
  }

  getObjectsAtPoint(point: Vector2D): GameObject[] {
    const objectsAtPoint: GameObject[] = [];

    for (const gameObject of this.gameObjects.values()) {
      if (gameObject.active && gameObject.containsPoint(point)) {
        objectsAtPoint.push(gameObject);
      }
    }

    return objectsAtPoint;
  }

  // Información del estado del motor
  getStats() {
    return {
      isRunning: this.gameLoop.getIsRunning(),
      fps: this.gameLoop.getCurrentFPS(),
      objectCount: this.gameObjects.size,
      physicsObjectCount: this.physicsEngine.getObjectCount(),
      activeTouches: this.touchInputManager.getActiveTouches().length,
    };
  }

  // Limpiar recursos
  private cleanup(): void {
    this.gameObjects.clear();
    this.physicsEngine.clear();
    this.touchInputManager.destroy();
  }

  // Métodos para React Native - conectar eventos táctiles manualmente
  handleTouchStart(nativeEvent: any): void {
    if (this.touchInputManager instanceof TouchInputManagerRN) {
      this.touchInputManager.handleTouchStart(nativeEvent);
    }
  }

  handleTouchMove(nativeEvent: any): void {
    if (this.touchInputManager instanceof TouchInputManagerRN) {
      this.touchInputManager.handleTouchMove(nativeEvent);
    }
  }

  handleTouchEnd(nativeEvent: any): void {
    if (this.touchInputManager instanceof TouchInputManagerRN) {
      this.touchInputManager.handleTouchEnd(nativeEvent);
    }
  }

  handleTouchCancel(nativeEvent: any): void {
    if (this.touchInputManager instanceof TouchInputManagerRN) {
      this.touchInputManager.handleTouchCancel(nativeEvent);
    }
  }

  // Destruir el motor completamente
  destroy(): void {
    this.stop();
    this.cleanup();
  }
}
