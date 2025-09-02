# Expo Game Support

A complete game-development library for Expo/React Native that adds advanced physics, a robust game loop, and optimized touch input handling.

## 🚀 Features

- **Physics Engine**: Gravity, collisions, forces, and impulses
- **Optimized Game Loop**: Fixed or variable time step, FPS control
- **Advanced Touch Input**: Optimized gestures (tap, swipe, long press, double tap)
- **Collision Detection**: AABB and circle with basic resolution
- **2D Math**: Comprehensive vector operations
- **TypeScript**: Fully typed for an improved DX

## 📦 Installation

```bash
npm install expo-game-support
```

### Required peer dependencies:
```bash
npm install expo react react-native react-native-gesture-handler react-native-reanimated
```

## 🎮 Basic Usage

### Initial setup (Web)

```typescript
import { GameEngine, GameObject, Vector2D } from 'expo-game-support';

// Configurar el motor del juego
const gameEngine = new GameEngine({
  width: 400,
  height: 600,
  gravity: new Vector2D(0, 981), // Gravedad hacia abajo
  gameLoop: {
    targetFPS: 60,
    maxDeltaTime: 0.05,
    enableFixedTimeStep: true
  }
});

// Inicializar y comenzar
gameEngine.initialize();
gameEngine.start();
```

### Setup for React Native/Expo

```tsx
import React, { useEffect, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { GameEngine, GameObject, Vector2D } from 'expo-game-support';

export default function GameComponent() {
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const gameEngine = new GameEngine({
      width: 400,
      height: 600,
      gravity: new Vector2D(0, 981),
      gameLoop: {
        targetFPS: 60,
        maxDeltaTime: 0.016,
        enableFixedTimeStep: true
      }
    });

    gameEngineRef.current = gameEngine;
    gameEngine.initialize();
    gameEngine.start();

    return () => gameEngine.stop();
  }, []);

  // Configurar PanResponder para eventos táctiles
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      gameEngineRef.current?.handleTouchStart(evt.nativeEvent);
    },
    onPanResponderMove: (evt) => {
      gameEngineRef.current?.handleTouchMove(evt.nativeEvent);
    },
    onPanResponderRelease: (evt) => {
      gameEngineRef.current?.handleTouchEnd(evt.nativeEvent);
    },
  });

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* Tu UI del juego aquí */}
    </View>
  );
}
```

### Crear objetos del juego

```typescript
// Crear una pelota con física
const ball = new GameObject({
  id: 'ball',
  position: new Vector2D(200, 100),
  size: new Vector2D(40, 40),
  physics: {
    mass: 1,
    velocity: new Vector2D(0, 0),
    acceleration: new Vector2D(0, 0),
    friction: 0.1,
    restitution: 0.8, // Rebote
    isStatic: false
  }
});

// Agregar al motor
gameEngine.addGameObject(ball);
```

### Manejar input táctil

```typescript
// Detectar toques
gameEngine.onTouch('player-input', (touchEvent) => {
  if (touchEvent.type === 'start') {
    console.log('Touch iniciado en:', touchEvent.position);
  }
});

// Detectar gestos
gameEngine.onGesture('player-gestures', (gesture) => {
  switch (gesture.type) {
    case 'tap':
      console.log('Tap en:', gesture.position);
      break;
    case 'swipe':
      console.log('Swipe dirección:', gesture.direction);
      break;
  }
});
```

### Ciclo de actualización

```typescript
gameEngine.onUpdate((deltaTime) => {
  // Lógica del juego cada frame
  const ball = gameEngine.getGameObject('ball');
  if (ball) {
    // Aplicar fuerzas, verificar condiciones, etc.
  }
});

gameEngine.onRender((interpolation) => {
  // Renderizado (usar con tu sistema de renderizado preferido)
});
```

## 🎯 Ejemplos Avanzados

### Juego de Pong Simple

```typescript
import { GameEngine, GameObject, Vector2D } from 'expo-game-support';

class PongGame {
  private gameEngine: GameEngine;
  private ball: GameObject;
  private paddle: GameObject;

  constructor() {
    this.gameEngine = new GameEngine({
      width: 400,
      height: 600,
      gravity: new Vector2D(0, 0), // Sin gravedad para Pong
      gameLoop: {
        targetFPS: 60,
        maxDeltaTime: 0.016,
        enableFixedTimeStep: true
      }
    });

    this.setupGame();
  }

  private setupGame() {
    // Crear pelota
    this.ball = new GameObject({
      id: 'ball',
      position: new Vector2D(200, 300),
      size: new Vector2D(20, 20),
      physics: {
        mass: 1,
        velocity: new Vector2D(200, 150),
        acceleration: new Vector2D(0, 0),
        friction: 0,
        restitution: 1,
        isStatic: false
      }
    });

    // Crear paddle
    this.paddle = new GameObject({
      id: 'paddle',
      position: new Vector2D(200, 550),
      size: new Vector2D(80, 20),
      physics: {
        mass: 10,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0.9,
        restitution: 0,
        isStatic: false
      }
    });

    this.gameEngine.addGameObject(this.ball);
    this.gameEngine.addGameObject(this.paddle);

    // Manejar input para mover paddle
    this.gameEngine.onTouch('paddle-control', (touch) => {
      if (touch.type === 'move') {
        this.paddle.position.x = touch.position.x;
      }
    });

    // Lógica del juego
    this.gameEngine.onUpdate((deltaTime) => {
      this.updateGame(deltaTime);
    });
  }

  private updateGame(deltaTime: number) {
    // Rebotar en paredes
    if (this.ball.position.x <= 10 || this.ball.position.x >= 390) {
      this.ball.physics!.velocity.x *= -1;
    }
    if (this.ball.position.y <= 10) {
      this.ball.physics!.velocity.y *= -1;
    }

    // Reiniciar si la pelota sale por abajo
    if (this.ball.position.y > 610) {
      this.resetBall();
    }
  }

  private resetBall() {
    this.ball.position = new Vector2D(200, 300);
    this.ball.physics!.velocity = new Vector2D(200, 150);
  }

  start() {
    this.gameEngine.initialize();
    this.gameEngine.start();
  }
}
```

### Sistema de Partículas

```typescript
class ParticleSystem {
  private gameEngine: GameEngine;
  private particles: GameObject[] = [];

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  createExplosion(position: Vector2D, particleCount: number = 20) {
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 200;
      
      const particle = new GameObject({
        id: `particle_${Date.now()}_${i}`,
        position: position.clone(),
        size: new Vector2D(4, 4),
        physics: {
          mass: 0.1,
          velocity: new Vector2D(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ),
          acceleration: new Vector2D(0, 0),
          friction: 0.02,
          restitution: 0.3,
          isStatic: false
        }
      });

      this.particles.push(particle);
      this.gameEngine.addGameObject(particle);

      // Destruir partícula después de 3 segundos
      setTimeout(() => {
        particle.destroy();
        this.particles = this.particles.filter(p => p !== particle);
      }, 3000);
    }
  }
}
```

## 📚 API Reference

### GameEngine

#### Constructor
```typescript
new GameEngine(config: GameEngineConfig)
```

#### Métodos principales
- `initialize()`: Inicializa el motor
- `start()`: Inicia el juego
- `pause()`: Pausa el juego
- `resume()`: Reanuda el juego
- `stop()`: Detiene el juego

#### Gestión de objetos
- `addGameObject(gameObject: GameObject)`: Añade objeto al juego
- `removeGameObject(id: string)`: Remueve objeto del juego
- `getGameObject(id: string)`: Obtiene objeto por ID
- `getAllGameObjects()`: Obtiene todos los objetos

#### Callbacks
- `onUpdate(callback: (deltaTime: number) => void)`: Callback de actualización
- `onRender(callback: (interpolation: number) => void)`: Callback de renderizado
- `onTouch(id: string, callback: (event: TouchEvent) => void)`: Callback de touch
- `onGesture(id: string, callback: (gesture: GestureEvent) => void)`: Callback de gestos

### GameObject

#### Constructor
```typescript
new GameObject(config: GameObjectConfig)
```

#### Propiedades
- `id: string`: Identificador único
- `position: Vector2D`: Posición en el mundo
- `size: Vector2D`: Tamaño del objeto
- `rotation: number`: Rotación en radianes
- `physics?: PhysicsBody`: Cuerpo físico (opcional)

#### Métodos
- `update(deltaTime: number)`: Actualiza el objeto
- `applyForce(force: Vector2D)`: Aplica fuerza
- `applyImpulse(impulse: Vector2D)`: Aplica impulso
- `containsPoint(point: Vector2D)`: Verifica si contiene un punto
- `destroy()`: Destruye el objeto

### Vector2D

#### Constructor
```typescript
new Vector2D(x: number = 0, y: number = 0)
```

#### Operaciones
- `add(vector: Vector2D)`: Suma vectores
- `subtract(vector: Vector2D)`: Resta vectores
- `multiply(scalar: number)`: Multiplica por escalar
- `divide(scalar: number)`: Divide por escalar
- `magnitude()`: Magnitud del vector
- `normalize()`: Normaliza el vector
- `dot(vector: Vector2D)`: Producto punto
- `distance(vector: Vector2D)`: Distancia entre vectores

## 🔧 Configuración Avanzada

### Optimización de Rendimiento

```typescript
// Configurar para mejor rendimiento
const gameEngine = new GameEngine({
  width: 400,
  height: 600,
  gravity: new Vector2D(0, 981),
  gameLoop: {
    targetFPS: 30, // Reducir FPS en dispositivos lentos
    maxDeltaTime: 0.033, // Limitar saltos de tiempo
    enableFixedTimeStep: false // Usar paso variable para mejor rendimiento
  }
});

// Configurar input táctil
gameEngine.touchInputManager.updateConfig({
  deadZone: 10, // Zona muerta más grande
  maxTouchPoints: 2, // Limitar puntos de toque
  touchSensitivity: 0.8 // Reducir sensibilidad
});
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Inspirado en motores de juego como Phaser y Matter.js
- Optimizado específicamente para el ecosistema Expo/React Native
