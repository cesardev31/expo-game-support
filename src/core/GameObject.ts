import { Vector2D } from "../math/Vector2D";
import { GameObjectConfig, PhysicsBody } from "../types";

// Clase base para todos los objetos del juego
export class GameObject {
  public id: string;
  public position: Vector2D;
  public size: Vector2D;
  public rotation: number;
  public physics?: PhysicsBody;
  public active: boolean;
  public visible: boolean;

  constructor(config: GameObjectConfig) {
    this.id = config.id;
    this.position = new Vector2D(config.position.x, config.position.y);
    this.size = new Vector2D(config.size.x, config.size.y);
    this.rotation = config.rotation || 0;
    this.active = true;
    this.visible = true;

    if (config.physics) {
      this.physics = {
        ...config.physics,
        force: new Vector2D(0, 0),
        angularVelocity: 0,
        angularAcceleration:
          typeof config.physics.angularAcceleration === 'number'
            ? config.physics.angularAcceleration
            : 0,
        linearDamping:
          typeof config.physics.linearDamping === 'number'
            ? config.physics.linearDamping
            : 0,
        angularDamping:
          typeof config.physics.angularDamping === 'number'
            ? config.physics.angularDamping
            : 0,
        affectedByGravity:
          typeof config.physics.affectedByGravity === 'boolean'
            ? config.physics.affectedByGravity
            : true,
      };
    }
  }

  // Actualizar el objeto cada frame
  update(deltaTime: number): void {
    if (!this.active) return;
  }

  // Actualizar física del objeto
  private updatePhysics(deltaTime: number): void {
    if (!this.physics) return;

    // Aplicar aceleración a la velocidad
    this.physics.velocity.x += this.physics.acceleration.x * deltaTime;
    this.physics.velocity.y += this.physics.acceleration.y * deltaTime;

    // Aplicar fuerza (F = ma)
    if (this.physics.mass > 0) {
      this.physics.velocity.x +=
        (this.physics.force.x / this.physics.mass) * deltaTime;
      this.physics.velocity.y +=
        (this.physics.force.y / this.physics.mass) * deltaTime;
    }

    // Aplicar fricción
    this.physics.velocity.x *= 1 - this.physics.friction * deltaTime;
    this.physics.velocity.y *= 1 - this.physics.friction * deltaTime;

    // Actualizar posición basada en velocidad
    this.position.x += this.physics.velocity.x * deltaTime;
    this.position.y += this.physics.velocity.y * deltaTime;

    // Actualizar rotación basada en velocidad angular
    this.rotation += this.physics.angularVelocity * deltaTime;

    // Resetear fuerzas para el siguiente frame
    this.physics.force.x = 0;
    this.physics.force.y = 0;
  }

  // Aplicar fuerza al objeto
  applyForce(force: Vector2D): void {
    if (!this.physics || this.physics.isStatic) return;

    this.physics.force.x += force.x;
    this.physics.force.y += force.y;
  }

  // Aplicar impulso (cambio instantáneo de velocidad)
  applyImpulse(impulse: Vector2D): void {
    if (!this.physics || this.physics.isStatic || this.physics.mass <= 0)
      return;

    this.physics.velocity.x += impulse.x / this.physics.mass;
    this.physics.velocity.y += impulse.y / this.physics.mass;
  }

  // Obtener bounds del objeto para colisiones
  getBounds() {
    return {
      left: this.position.x - this.size.x / 2,
      right: this.position.x + this.size.x / 2,
      top: this.position.y - this.size.y / 2,
      bottom: this.position.y + this.size.y / 2,
    };
  }

  // Verificar si un punto está dentro del objeto
  containsPoint(point: Vector2D): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  // Destruir el objeto
  destroy(): void {
    this.active = false;
    this.visible = false;
  }

  // Clonar el objeto
  clone(): GameObject {
    const config: GameObjectConfig = {
      id: this.id + "_clone",
      position: this.position.clone(),
      size: this.size.clone(),
      rotation: this.rotation,
      physics: this.physics ? { ...this.physics } : undefined,
    };
    return new GameObject(config);
  }
}
