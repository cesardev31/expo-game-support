// Ejemplo básico de uso de expo-game-support
import { GameEngine, GameObject, Vector2D } from '../src';

export class BasicGameExample {
  private gameEngine: GameEngine;
  private player: GameObject;
  private enemies: GameObject[] = [];

  constructor() {
    // Configurar motor del juego
    this.gameEngine = new GameEngine({
      width: 400,
      height: 600,
      gravity: new Vector2D(0, 500), // Gravedad moderada
      gameLoop: {
        targetFPS: 60,
        maxDeltaTime: 0.05,
        enableFixedTimeStep: true
      }
    });

    this.setupGame();
  }

  private setupGame() {
    // Crear jugador
    this.player = new GameObject({
      id: 'player',
      position: new Vector2D(200, 500),
      size: new Vector2D(40, 40),
      physics: {
        mass: 1,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0.8,
        restitution: 0.3,
        isStatic: false
      }
    });

    this.gameEngine.addGameObject(this.player);

    // Configurar controles táctiles
    this.setupControls();

    // Configurar lógica del juego
    this.gameEngine.onUpdate((deltaTime) => {
      this.updateGame(deltaTime);
    });

    // Crear enemigos cada 2 segundos
    setInterval(() => {
      this.createEnemy();
    }, 2000);
  }

  private setupControls() {
    // Control de movimiento con touch
    this.gameEngine.onTouch('movement', (touch) => {
      if (touch.type === 'move' || touch.type === 'start') {
        const targetX = touch.position.x;
        const currentX = this.player.position.x;
        const force = (targetX - currentX) * 10;
        
        this.player.applyForce(new Vector2D(force, 0));
      }
    });

    // Salto con tap
    this.gameEngine.onGesture('jump', (gesture) => {
      if (gesture.type === 'tap') {
        // Solo saltar si está cerca del suelo
        if (this.player.position.y > 450) {
          this.player.applyImpulse(new Vector2D(0, -300));
        }
      }
    });
  }

  private createEnemy() {
    const enemy = new GameObject({
      id: `enemy_${Date.now()}`,
      position: new Vector2D(Math.random() * 360 + 20, 50),
      size: new Vector2D(30, 30),
      physics: {
        mass: 0.8,
        velocity: new Vector2D(0, 100),
        acceleration: new Vector2D(0, 0),
        friction: 0.1,
        restitution: 0.5,
        isStatic: false
      }
    });

    this.enemies.push(enemy);
    this.gameEngine.addGameObject(enemy);

    // Remover enemigo después de 10 segundos
    setTimeout(() => {
      enemy.destroy();
      this.enemies = this.enemies.filter(e => e !== enemy);
    }, 10000);
  }

  private updateGame(deltaTime: number) {
    // Mantener jugador dentro de los límites
    if (this.player.position.x < 20) {
      this.player.position.x = 20;
      this.player.physics!.velocity.x = 0;
    }
    if (this.player.position.x > 380) {
      this.player.position.x = 380;
      this.player.physics!.velocity.x = 0;
    }

    // Verificar colisiones jugador-enemigos
    for (const enemy of this.enemies) {
      if (enemy.active) {
        const distance = this.player.position.distance(enemy.position);
        if (distance < 35) {
          console.log('¡Colisión con enemigo!');
          enemy.destroy();
          this.enemies = this.enemies.filter(e => e !== enemy);
        }
      }
    }

    // Remover enemigos que salieron de la pantalla
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.position.y > 650) {
        enemy.destroy();
        return false;
      }
      return true;
    });
  }

  start() {
    this.gameEngine.initialize();
    this.gameEngine.start();
    console.log('Juego iniciado! Toca para mover, tap para saltar');
  }

  stop() {
    this.gameEngine.stop();
  }

  getStats() {
    return this.gameEngine.getStats();
  }
}
