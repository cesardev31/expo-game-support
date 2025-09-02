// Ejemplo completo: Juego de Pong usando expo-game-support
import { GameEngine, GameObject, Vector2D } from '../src';

export class PongGame {
  private gameEngine: GameEngine;
  private ball: GameObject;
  private playerPaddle: GameObject;
  private aiPaddle: GameObject;
  private walls: GameObject[] = [];
  
  private score = { player: 0, ai: 0 };
  private gameState: 'playing' | 'paused' | 'gameOver' = 'playing';

  constructor(width: number = 800, height: number = 600) {
    this.gameEngine = new GameEngine({
      width,
      height,
      gravity: new Vector2D(0, 0), // Sin gravedad para Pong
      gameLoop: {
        targetFPS: 60,
        maxDeltaTime: 0.016,
        enableFixedTimeStep: true
      }
    });

    this.setupGame(width, height);
    this.setupControls();
    this.setupGameLogic();
  }

  private setupGame(width: number, height: number) {
    // Crear pelota
    this.ball = new GameObject({
      id: 'ball',
      position: new Vector2D(width / 2, height / 2),
      size: new Vector2D(20, 20),
      physics: {
        mass: 1,
        velocity: new Vector2D(300, 200),
        acceleration: new Vector2D(0, 0),
        friction: 0,
        restitution: 1,
        isStatic: false
      }
    });

    // Crear paddle del jugador
    this.playerPaddle = new GameObject({
      id: 'player-paddle',
      position: new Vector2D(50, height / 2),
      size: new Vector2D(20, 100),
      physics: {
        mass: 10,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0.9,
        restitution: 0,
        isStatic: false
      }
    });

    // Crear paddle de la IA
    this.aiPaddle = new GameObject({
      id: 'ai-paddle',
      position: new Vector2D(width - 50, height / 2),
      size: new Vector2D(20, 100),
      physics: {
        mass: 10,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0.9,
        restitution: 0,
        isStatic: false
      }
    });

    // Crear paredes
    const wallThickness = 20;
    
    // Pared superior
    const topWall = new GameObject({
      id: 'top-wall',
      position: new Vector2D(width / 2, wallThickness / 2),
      size: new Vector2D(width, wallThickness),
      physics: {
        mass: 0,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0,
        restitution: 1,
        isStatic: true
      }
    });

    // Pared inferior
    const bottomWall = new GameObject({
      id: 'bottom-wall',
      position: new Vector2D(width / 2, height - wallThickness / 2),
      size: new Vector2D(width, wallThickness),
      physics: {
        mass: 0,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0,
        restitution: 1,
        isStatic: true
      }
    });

    this.walls = [topWall, bottomWall];

    // Agregar todos los objetos al motor
    this.gameEngine.addGameObject(this.ball);
    this.gameEngine.addGameObject(this.playerPaddle);
    this.gameEngine.addGameObject(this.aiPaddle);
    this.walls.forEach(wall => this.gameEngine.addGameObject(wall));
  }

  private setupControls() {
    // Control táctil para mover el paddle del jugador
    this.gameEngine.onTouch('paddle-control', (touch) => {
      if (this.gameState !== 'playing') return;

      if (touch.type === 'move' || touch.type === 'start') {
        const targetY = touch.position.y;
        const paddleY = this.playerPaddle.position.y;
        const force = (targetY - paddleY) * 15;
        
        this.playerPaddle.applyForce(new Vector2D(0, force));
      }
    });

    // Gestos para pausar/reanudar
    this.gameEngine.onGesture('game-control', (gesture) => {
      if (gesture.type === 'doubletap') {
        this.togglePause();
      }
    });
  }

  private setupGameLogic() {
    this.gameEngine.onUpdate((deltaTime) => {
      if (this.gameState !== 'playing') return;

      this.updateAI(deltaTime);
      this.checkBallBounds();
      this.constrainPaddles();
    });

    this.gameEngine.onRender((interpolation) => {
      this.render(interpolation);
    });
  }

  private updateAI(deltaTime: number) {
    // IA simple: seguir la pelota
    const ballY = this.ball.position.y;
    const aiY = this.aiPaddle.position.y;
    const diff = ballY - aiY;
    
    // Velocidad de la IA (ajustable para dificultad)
    const aiSpeed = 200;
    const force = Math.sign(diff) * aiSpeed * deltaTime;
    
    this.aiPaddle.applyForce(new Vector2D(0, force));
  }

  private checkBallBounds() {
    const ballX = this.ball.position.x;
    const gameWidth = 800; // Asumiendo ancho fijo

    // Pelota sale por la izquierda (punto para IA)
    if (ballX < 0) {
      this.score.ai++;
      this.resetBall();
      this.checkGameOver();
    }
    
    // Pelota sale por la derecha (punto para jugador)
    if (ballX > gameWidth) {
      this.score.player++;
      this.resetBall();
      this.checkGameOver();
    }
  }

  private constrainPaddles() {
    const gameHeight = 600; // Asumiendo altura fija
    const paddleHeight = 100;

    // Limitar paddle del jugador
    const playerY = this.playerPaddle.position.y;
    if (playerY < paddleHeight / 2) {
      this.playerPaddle.position.y = paddleHeight / 2;
      this.playerPaddle.physics!.velocity.y = 0;
    }
    if (playerY > gameHeight - paddleHeight / 2) {
      this.playerPaddle.position.y = gameHeight - paddleHeight / 2;
      this.playerPaddle.physics!.velocity.y = 0;
    }

    // Limitar paddle de la IA
    const aiY = this.aiPaddle.position.y;
    if (aiY < paddleHeight / 2) {
      this.aiPaddle.position.y = paddleHeight / 2;
      this.aiPaddle.physics!.velocity.y = 0;
    }
    if (aiY > gameHeight - paddleHeight / 2) {
      this.aiPaddle.position.y = gameHeight - paddleHeight / 2;
      this.aiPaddle.physics!.velocity.y = 0;
    }
  }

  private resetBall() {
    const gameWidth = 800;
    const gameHeight = 600;
    
    this.ball.position = new Vector2D(gameWidth / 2, gameHeight / 2);
    
    // Velocidad aleatoria pero controlada
    const speed = 300;
    const angle = (Math.random() - 0.5) * Math.PI / 3; // ±30 grados
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    this.ball.physics!.velocity = new Vector2D(
      direction * speed * Math.cos(angle),
      speed * Math.sin(angle)
    );
  }

  private checkGameOver() {
    const maxScore = 5;
    if (this.score.player >= maxScore || this.score.ai >= maxScore) {
      this.gameState = 'gameOver';
      console.log(`¡Juego terminado! Ganador: ${this.score.player >= maxScore ? 'Jugador' : 'IA'}`);
    }
  }

  private togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.gameEngine.pause();
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.gameEngine.resume();
    }
  }

  private render(interpolation: number) {
    // Aquí iría la lógica de renderizado
    // En una implementación real, esto se conectaría con React Native o Canvas
    console.log(`Renderizando - Jugador: ${this.score.player}, IA: ${this.score.ai}`);
  }

  // API pública
  start() {
    this.gameEngine.initialize();
    this.gameEngine.start();
    console.log('¡Pong iniciado! Toca para mover tu paddle, doble tap para pausar');
  }

  stop() {
    this.gameEngine.stop();
  }

  restart() {
    this.score = { player: 0, ai: 0 };
    this.gameState = 'playing';
    this.resetBall();
    this.start();
  }

  getScore() {
    return { ...this.score };
  }

  getGameState() {
    return this.gameState;
  }

  getStats() {
    return {
      ...this.gameEngine.getStats(),
      score: this.score,
      gameState: this.gameState
    };
  }
}
