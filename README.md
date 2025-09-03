# Expo Game Support

A complete game-development library for Expo/React Native that adds advanced physics, a robust game loop, and optimized touch input handling.

## 🚀 Features

- **Physics Engine**: Gravity, collisions, forces, impulses, sleeping
- **Optimized Game Loop**: Fixed or variable time step, FPS control
- **Advanced Touch Input**: Optimized gestures (tap, swipe, long press, double tap)
- **Collision Detection**: AABB and circle with basic resolution
- **Collision Events**: Collision start/end and trigger enter/exit callbacks
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

// Configure the game engine
const gameEngine = new GameEngine({
  width: 400,
  height: 600,
  gravity: new Vector2D(0, 981), // Gravity pointing down
  gameLoop: {
    targetFPS: 60,
    maxDeltaTime: 0.05,
    enableFixedTimeStep: true
  }
});

// Initialize and start
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

  // Wire PanResponder to touch input
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
      {/* Your game UI here */}
    </View>
  );
}
```

### Create game objects

```typescript
// Create a ball with physics
const ball = new GameObject({
  id: 'ball',
  position: new Vector2D(200, 100),
  size: new Vector2D(40, 40),
  physics: {
    mass: 1,
    velocity: new Vector2D(0, 0),
    acceleration: new Vector2D(0, 0),
    friction: 0.1,
    restitution: 0.8, // Bounciness
    isStatic: false
  }
});

// Add to the engine
gameEngine.addGameObject(ball);
```

### Handle touch input

```typescript
// Touch events
gameEngine.onTouch('player-input', (touchEvent) => {
  if (touchEvent.type === 'start') {
    console.log('Touch started at:', touchEvent.position);
  }
});

// Gestures
gameEngine.onGesture('player-gestures', (gesture) => {
  switch (gesture.type) {
    case 'tap':
      console.log('Tap at:', gesture.position);
      break;
    case 'swipe':
      console.log('Swipe direction:', gesture.direction);
      break;
  }
});
```

### Update loop

```typescript
gameEngine.onUpdate((deltaTime) => {
  // Game logic per frame
  const ball = gameEngine.getGameObject('ball');
  if (ball) {
    // Apply forces, check conditions, etc.
  }
});

gameEngine.onRender((interpolation) => {
  // Rendering (hook into your renderer of choice)
});
```

## 🎯 Advanced Examples

### Simple Pong

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
      gravity: new Vector2D(0, 0), // No gravity for Pong
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

    // Handle input to move the paddle
    this.gameEngine.onTouch('paddle-control', (touch) => {
      if (touch.type === 'move') {
        this.paddle.position.x = touch.position.x;
      }
    });

    // Game logic
    this.gameEngine.onUpdate((deltaTime) => {
      this.updateGame(deltaTime);
    });
  }

  private updateGame(deltaTime: number) {
    // Wall bounces
    if (this.ball.position.x <= 10 || this.ball.position.x >= 390) {
      this.ball.physics!.velocity.x *= -1;
    }
    if (this.ball.position.y <= 10) {
      this.ball.physics!.velocity.y *= -1;
    }

    // Reset if the ball leaves screen bottom
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

### Particle System

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

      // Destroy particle after 3 seconds
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

#### Main methods
- `initialize()`: Initialize engine
- `start()`: Start game
- `pause()`: Pause game
- `resume()`: Resume game
- `stop()`: Stop game

#### Object management
- `addGameObject(gameObject: GameObject)`: Add an object
- `removeGameObject(id: string)`: Remove an object
- `getGameObject(id: string)`: Get by ID
- `getAllGameObjects()`: Get all objects

#### Callbacks
- `onUpdate(callback: (deltaTime: number) => void)`: Update callback
- `onRender(callback: (interpolation: number) => void)`: Render callback
- `onTouch(id: string, callback: (event: TouchEvent) => void)`: Touch callback
- `onGesture(id: string, callback: (gesture: GestureEvent) => void)`: Gesture callback
- `onCollisionStart(cb)`, `onCollisionEnd(cb)`: Physics collision events
- `onTriggerEnter(cb)`, `onTriggerExit(cb)`: Trigger events

### GameObject

#### Constructor
```typescript
new GameObject(config: GameObjectConfig)
```

#### Properties
- `id: string`: Unique identifier
- `position: Vector2D`: World position
- `size: Vector2D`: Object size
- `rotation: number`: Radians
- `physics?: PhysicsBody`: Optional rigid body

#### Methods
- `update(deltaTime: number)`: Per-frame update
- `applyForce(force: Vector2D)`: Apply force
- `applyImpulse(impulse: Vector2D)`: Apply impulse
- `containsPoint(point: Vector2D)`: Point test
- `destroy()`: Destroy object

### Vector2D

#### Constructor
```typescript
new Vector2D(x: number = 0, y: number = 0)
```

#### Operations
- `add(vector: Vector2D)`
- `subtract(vector: Vector2D)`
- `multiply(scalar: number)`
- `divide(scalar: number)`
- `magnitude()`
- `normalize()`
- `dot(vector: Vector2D)`
- `distance(vector: Vector2D)`

## 🔧 Advanced Configuration

### Performance optimization

```typescript
// Configure for performance
const gameEngine = new GameEngine({
  width: 400,
  height: 600,
  gravity: new Vector2D(0, 981),
  gameLoop: {
    targetFPS: 30, // Reduce FPS on slower devices
    maxDeltaTime: 0.033, // Limit time jumps
    enableFixedTimeStep: false // Variable timestep for performance
  }
});

// Touch input config
gameEngine.touchInputManager.updateConfig({
  deadZone: 10, // Larger dead zone
  maxTouchPoints: 2, // Limit touch points
  touchSensitivity: 0.8 // Lower sensitivity
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgements

- Inspired by engines like Phaser and Matter.js
- Tuned specifically for the Expo/React Native ecosystem

---

Note: To minimize tunneling and improve stability, we recommend a fixed time step (`enableFixedTimeStep: true`) with `targetFPS` 60 for physics-heavy scenes. Collision and trigger events are available via `GameEngine.onCollisionStart/End` and `onTriggerEnter/Exit`.
