import { GameTouchEvent } from '../types';
import { Vector2D } from '../math/Vector2D';

// Gestor optimizado de inputs táctiles para juegos
export class TouchInputManager {
  private activeTouches: Map<number, GameTouchEvent> = new Map();
  private touchCallbacks: Map<string, (event: GameTouchEvent) => void> = new Map();
  private gestureCallbacks: Map<string, (gesture: GestureEvent) => void> = new Map();
  
  // Configuración de optimización
  private config = {
    touchSensitivity: 1.0,
    deadZone: 5, // píxeles
    maxTouchPoints: 10,
    gestureThreshold: 20, // píxeles para detectar gestos
    tapTimeout: 300, // ms para detectar tap
    doubleTapTimeout: 500, // ms para detectar doble tap
    longPressTimeout: 800 // ms para detectar long press
  };

  // Timers para gestos (compatible con DOM y Node typings)
  private tapTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTapTime: number = 0;
  private lastTapPosition: Vector2D | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // Configurar event listeners nativos
  private setupEventListeners(): void {
    // Touch events para móviles
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Mouse events para desktop (simulando touch)
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  // Manejar inicio de touch
  private handleTouchStart(event: Event): void {
    event.preventDefault();
    const touchEvent = event as globalThis.TouchEvent;
    
    for (let i = 0; i < touchEvent.changedTouches.length; i++) {
      const touch = touchEvent.changedTouches[i];
      const gameTouch = this.createGameTouchEvent(touch, 'start');
      
      this.activeTouches.set(touch.identifier, gameTouch);
      this.notifyTouchEvent(gameTouch);
      this.handleGestureStart(gameTouch);
    }
  }

  // Manejar movimiento de touch
  private handleTouchMove(event: Event): void {
    event.preventDefault();
    const touchEvent = event as globalThis.TouchEvent;
    
    for (let i = 0; i < touchEvent.changedTouches.length; i++) {
      const touch = touchEvent.changedTouches[i];
      const existingTouch = this.activeTouches.get(touch.identifier);
      
      if (existingTouch) {
        const gameTouch = this.createGameTouchEvent(touch, 'move');
        
        // Aplicar zona muerta para evitar micro-movimientos
        const distance = gameTouch.position.distance(existingTouch.position);
        if (distance > this.config.deadZone) {
          this.activeTouches.set(touch.identifier, gameTouch);
          this.notifyTouchEvent(gameTouch);
          this.handleGestureMove(gameTouch, existingTouch);
        }
      }
    }
  }

  // Manejar fin de touch
  private handleTouchEnd(event: Event): void {
    event.preventDefault();
    const touchEvent = event as globalThis.TouchEvent;
    
    for (let i = 0; i < touchEvent.changedTouches.length; i++) {
      const touch = touchEvent.changedTouches[i];
      const existingTouch = this.activeTouches.get(touch.identifier);
      
      if (existingTouch) {
        const gameTouch = this.createGameTouchEvent(touch, 'end');
        this.activeTouches.delete(touch.identifier);
        this.notifyTouchEvent(gameTouch);
        this.handleGestureEnd(gameTouch, existingTouch);
      }
    }
  }

  // Manejar cancelación de touch
  private handleTouchCancel(event: Event): void {
    const touchEvent = event as globalThis.TouchEvent;
    
    for (let i = 0; i < touchEvent.changedTouches.length; i++) {
      const touch = touchEvent.changedTouches[i];
      const existingTouch = this.activeTouches.get(touch.identifier);
      
      if (existingTouch) {
        const gameTouch = this.createGameTouchEvent(touch, 'cancel');
        this.activeTouches.delete(touch.identifier);
        this.notifyTouchEvent(gameTouch);
      }
    }
  }

  // Simular touch con mouse (para testing en desktop)
  private handleMouseDown(event: MouseEvent): void {
    const gameTouch: GameTouchEvent = {
      id: 0,
      position: new Vector2D(event.clientX, event.clientY),
      timestamp: Date.now(),
      type: 'start',
      pressure: 1.0
    };
    
    this.activeTouches.set(0, gameTouch);
    this.notifyTouchEvent(gameTouch);
    this.handleGestureStart(gameTouch);
  }

  private handleMouseMove(event: MouseEvent): void {
    const existingTouch = this.activeTouches.get(0);
    if (existingTouch) {
      const gameTouch: GameTouchEvent = {
        id: 0,
        position: new Vector2D(event.clientX, event.clientY),
        timestamp: Date.now(),
        type: 'move',
        pressure: 1.0
      };
      
      const distance = gameTouch.position.distance(existingTouch.position);
      if (distance > this.config.deadZone) {
        this.activeTouches.set(0, gameTouch);
        this.notifyTouchEvent(gameTouch);
        this.handleGestureMove(gameTouch, existingTouch);
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const existingTouch = this.activeTouches.get(0);
    if (existingTouch) {
      const gameTouch: GameTouchEvent = {
        id: 0,
        position: new Vector2D(event.clientX, event.clientY),
        timestamp: Date.now(),
        type: 'end',
        pressure: 0
      };
      
      this.activeTouches.delete(0);
      this.notifyTouchEvent(gameTouch);
      this.handleGestureEnd(gameTouch, existingTouch);
    }
  }

  // Crear evento de touch del juego
  private createGameTouchEvent(touch: Touch, type: GameTouchEvent['type']): GameTouchEvent {
    return {
      id: touch.identifier,
      position: new Vector2D(touch.clientX, touch.clientY),
      timestamp: Date.now(),
      type,
      pressure: touch.force || 1.0
    };
  }

  // Manejar inicio de gestos
  private handleGestureStart(touch: GameTouchEvent): void {
    // Configurar timer para long press
    this.longPressTimer = setTimeout(() => {
      this.notifyGesture({
        type: 'longpress',
        position: touch.position,
        touches: [touch]
      });
    }, this.config.longPressTimeout);
  }

  // Manejar movimiento de gestos
  private handleGestureMove(currentTouch: GameTouchEvent, previousTouch: GameTouchEvent): void {
    // Cancelar long press si hay movimiento
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Detectar swipe
    const distance = currentTouch.position.distance(previousTouch.position);
    if (distance > this.config.gestureThreshold) {
      const direction = currentTouch.position.subtract(previousTouch.position).normalize();
      this.notifyGesture({
        type: 'swipe',
        position: currentTouch.position,
        direction,
        distance,
        touches: [currentTouch]
      });
    }
  }

  // Manejar fin de gestos
  private handleGestureEnd(currentTouch: GameTouchEvent, startTouch: GameTouchEvent): void {
    // Cancelar timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const distance = currentTouch.position.distance(startTouch.position);
    const duration = currentTouch.timestamp - startTouch.timestamp;

    // Detectar tap
    if (distance < this.config.gestureThreshold && duration < this.config.tapTimeout) {
      const now = Date.now();
      
      // Verificar doble tap
      if (this.lastTapPosition && 
          this.lastTapPosition.distance(currentTouch.position) < this.config.gestureThreshold &&
          now - this.lastTapTime < this.config.doubleTapTimeout) {
        
        this.notifyGesture({
          type: 'doubletap',
          position: currentTouch.position,
          touches: [currentTouch]
        });
        
        this.lastTapPosition = null;
        this.lastTapTime = 0;
      } else {
        // Tap simple
        this.notifyGesture({
          type: 'tap',
          position: currentTouch.position,
          touches: [currentTouch]
        });
        
        this.lastTapPosition = currentTouch.position;
        this.lastTapTime = now;
      }
    }
  }

  // Notificar evento de touch
  private notifyTouchEvent(touch: GameTouchEvent): void {
    this.touchCallbacks.forEach(callback => callback(touch));
  }

  // Notificar gesto
  private notifyGesture(gesture: GestureEvent): void {
    this.gestureCallbacks.forEach(callback => callback(gesture));
  }

  // API pública
  onTouch(id: string, callback: (event: GameTouchEvent) => void): void {
    this.touchCallbacks.set(id, callback);
  }

  onGesture(id: string, callback: (gesture: GestureEvent) => void): void {
    this.gestureCallbacks.set(id, callback);
  }

  removeListener(id: string): void {
    this.touchCallbacks.delete(id);
    this.gestureCallbacks.delete(id);
  }

  getActiveTouches(): GameTouchEvent[] {
    return Array.from(this.activeTouches.values());
  }

  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  destroy(): void {
    // Limpiar event listeners
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));

    // Limpiar timers
    if (this.tapTimer) clearTimeout(this.tapTimer);
    if (this.longPressTimer) clearTimeout(this.longPressTimer);

    // Limpiar callbacks
    this.touchCallbacks.clear();
    this.gestureCallbacks.clear();
    this.activeTouches.clear();
  }
}

// Interfaz para eventos de gestos
export interface GestureEvent {
  type: 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pinch' | 'rotate';
  position: Vector2D;
  direction?: Vector2D;
  distance?: number;
  scale?: number;
  rotation?: number;
  touches: GameTouchEvent[];
}
