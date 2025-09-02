import { GameObject } from "../core/GameObject";
import { Vector2D } from "../math/Vector2D";

export interface BoundaryConfig {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  onBoundaryHit?: (object: GameObject, boundary: string) => void;
}

export class BoundaryChecker {
  private config: BoundaryConfig;

  constructor(config: BoundaryConfig) {
    this.config = config;
  }

  checkBoundaries(gameObject: GameObject): boolean {
    let hitBoundary = false;
    const pos = gameObject.position;
    const size = gameObject.size;

    // Check left boundary
    if (this.config.minX !== undefined && pos.x < this.config.minX) {
      hitBoundary = true;
      this.config.onBoundaryHit?.(gameObject, 'left');
    }

    // Check right boundary
    if (this.config.maxX !== undefined && pos.x + size.x > this.config.maxX) {
      hitBoundary = true;
      this.config.onBoundaryHit?.(gameObject, 'right');
    }

    // Check top boundary
    if (this.config.minY !== undefined && pos.y < this.config.minY) {
      hitBoundary = true;
      this.config.onBoundaryHit?.(gameObject, 'top');
    }

    // Check bottom boundary
    if (this.config.maxY !== undefined && pos.y + size.y > this.config.maxY) {
      hitBoundary = true;
      this.config.onBoundaryHit?.(gameObject, 'bottom');
    }

    return hitBoundary;
  }

  updateConfig(newConfig: Partial<BoundaryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
