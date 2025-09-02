import { GameObject } from "../core/GameObject";
import { GameEngine } from "../core/GameEngine";
import { Vector2D } from "../math/Vector2D";

export interface SpawnRule {
  interval: number; // milliseconds
  lastSpawn: number;
  spawnFunction: () => GameObject | GameObject[];
  condition?: () => boolean;
  maxObjects?: number;
  objectPrefix?: string; // to count objects with specific prefix
}

export class ObjectSpawner {
  private gameEngine: GameEngine;
  private rules: Map<string, SpawnRule> = new Map();

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  addSpawnRule(id: string, rule: SpawnRule): void {
    rule.lastSpawn = Date.now();
    this.rules.set(id, rule);
  }

  removeSpawnRule(id: string): void {
    this.rules.delete(id);
  }

  update(): void {
    const now = Date.now();

    for (const [id, rule] of this.rules.entries()) {
      // Check if enough time has passed
      if (now - rule.lastSpawn < rule.interval) {
        continue;
      }

      // Check condition if provided
      if (rule.condition && !rule.condition()) {
        continue;
      }

      // Check max objects limit if provided
      if (rule.maxObjects && rule.objectPrefix) {
        const existingCount = this.countObjectsWithPrefix(rule.objectPrefix);
        if (existingCount >= rule.maxObjects) {
          continue;
        }
      }

      // Spawn new object(s)
      const newObjects = rule.spawnFunction();
      const objectsArray = Array.isArray(newObjects) ? newObjects : [newObjects];

      for (const obj of objectsArray) {
        this.gameEngine.addGameObject(obj);
      }

      rule.lastSpawn = now;
    }
  }

  private countObjectsWithPrefix(prefix: string): number {
    const objects = this.gameEngine.getAllGameObjects();
    return objects.filter(obj => obj.id.startsWith(prefix)).length;
  }

  clearRules(): void {
    this.rules.clear();
  }

  // Helper method to create common spawn patterns
  static createIntervalSpawner(
    interval: number,
    spawnFunction: () => GameObject | GameObject[],
    options?: {
      condition?: () => boolean;
      maxObjects?: number;
      objectPrefix?: string;
    }
  ): SpawnRule {
    return {
      interval,
      lastSpawn: 0,
      spawnFunction,
      condition: options?.condition,
      maxObjects: options?.maxObjects,
      objectPrefix: options?.objectPrefix
    };
  }
}
