import { GameObject } from "../core/GameObject";
import { GameEngine } from "../core/GameEngine";

export interface CleanupRule {
  condition: (object: GameObject) => boolean;
  onCleanup?: (object: GameObject) => void;
}

export class ObjectCleaner {
  private gameEngine: GameEngine;
  private rules: CleanupRule[] = [];

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  addRule(rule: CleanupRule): void {
    this.rules.push(rule);
  }

  // Common cleanup rules
  static offScreenLeft(screenWidth: number, buffer: number = 100): CleanupRule {
    return {
      condition: (obj) => obj.position.x + obj.size.x < -buffer,
      onCleanup: (obj) => console.log(`Cleaned up ${obj.id} (off-screen left)`)
    };
  }

  static offScreenRight(screenWidth: number, buffer: number = 100): CleanupRule {
    return {
      condition: (obj) => obj.position.x > screenWidth + buffer,
      onCleanup: (obj) => console.log(`Cleaned up ${obj.id} (off-screen right)`)
    };
  }

  static offScreenTop(buffer: number = 100): CleanupRule {
    return {
      condition: (obj) => obj.position.y + obj.size.y < -buffer,
      onCleanup: (obj) => console.log(`Cleaned up ${obj.id} (off-screen top)`)
    };
  }

  static offScreenBottom(screenHeight: number, buffer: number = 100): CleanupRule {
    return {
      condition: (obj) => obj.position.y > screenHeight + buffer,
      onCleanup: (obj) => console.log(`Cleaned up ${obj.id} (off-screen bottom)`)
    };
  }

  update(): void {
    const objects = this.gameEngine.getAllGameObjects();
    
    for (const object of objects) {
      for (const rule of this.rules) {
        if (rule.condition(object)) {
          rule.onCleanup?.(object);
          this.gameEngine.removeGameObject(object.id);
          break; // Only apply first matching rule
        }
      }
    }
  }

  clearRules(): void {
    this.rules = [];
  }
}
