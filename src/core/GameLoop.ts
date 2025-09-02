import { GameLoopConfig } from '../types';

// Gestión del ciclo principal del juego
export class GameLoop {
  private config: GameLoopConfig;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private frameId: number | null = null;
  
  private updateCallback: (deltaTime: number) => void = () => {};
  private renderCallback: (interpolation: number) => void = () => {};

  constructor(config: GameLoopConfig) {
    this.config = {
      targetFPS: config.targetFPS || 60,
      maxDeltaTime: config.maxDeltaTime || 0.05, // 50ms máximo
      enableFixedTimeStep: config.enableFixedTimeStep || false
    };
  }

  // Configurar callbacks
  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  setRenderCallback(callback: (interpolation: number) => void): void {
    this.renderCallback = callback;
  }

  // Iniciar el loop del juego
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.gameLoop();
  }

  // Detener el loop del juego
  stop(): void {
    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  // Loop principal del juego
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000; // Convertir a segundos
    
    console.log(`⏱️ [GAMELOOP] currentTime: ${currentTime}, lastTime: ${this.lastTime}, rawDelta: ${deltaTime}`);
    
    this.lastTime = currentTime;

    // Limitar deltaTime para evitar saltos grandes y establecer mínimo
    deltaTime = Math.min(deltaTime, this.config.maxDeltaTime);
    
    // Establecer deltaTime mínimo para evitar valores microscópicos
    const minDeltaTime = 1/120; // ~8.33ms mínimo (120 FPS máximo)
    if (deltaTime < minDeltaTime) {
      deltaTime = minDeltaTime;
    }
    
    console.log(`⏱️ [GAMELOOP] finalDelta: ${deltaTime}, maxDelta: ${this.config.maxDeltaTime}, minDelta: ${minDeltaTime}`);

    if (this.config.enableFixedTimeStep) {
      this.fixedTimeStepLoop(deltaTime);
    } else {
      this.variableTimeStepLoop(deltaTime);
    }

    this.frameId = requestAnimationFrame(this.gameLoop);
  };

  // Loop con paso de tiempo fijo (más estable para física)
  private fixedTimeStepLoop(deltaTime: number): void {
    const fixedDeltaTime = 1 / this.config.targetFPS;
    this.accumulator += deltaTime;

    // Ejecutar actualizaciones con paso fijo
    while (this.accumulator >= fixedDeltaTime) {
      this.updateCallback(fixedDeltaTime);
      this.accumulator -= fixedDeltaTime;
    }

    // Interpolación para renderizado suave
    const interpolation = this.accumulator / fixedDeltaTime;
    this.renderCallback(interpolation);
  }

  // Loop con paso de tiempo variable (más simple)
  private variableTimeStepLoop(deltaTime: number): void {
    this.updateCallback(deltaTime);
    this.renderCallback(1.0); // Sin interpolación
  }

  // Obtener FPS actual
  getCurrentFPS(): number {
    return this.isRunning ? this.config.targetFPS : 0;
  }

  // Verificar si está corriendo
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<GameLoopConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
