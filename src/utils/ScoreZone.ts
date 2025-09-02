import { GameObject } from "../core/GameObject";
import { Vector2D } from "../math/Vector2D";

export interface ScoreZoneConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  onScore?: (points: number, zone: ScoreZone) => void;
}

export class ScoreZone {
  public id: string;
  public config: ScoreZoneConfig;
  private triggered: boolean = false;
  private triggerObjectIds: Set<string> = new Set();

  constructor(id: string, config: ScoreZoneConfig) {
    this.id = id;
    this.config = config;
  }

  checkTrigger(gameObject: GameObject): boolean {
    // Skip if already triggered by this object
    if (this.triggerObjectIds.has(gameObject.id)) {
      return false;
    }

    // Check if object is within score zone
    const objLeft = gameObject.position.x;
    const objRight = gameObject.position.x + gameObject.size.x;
    const objTop = gameObject.position.y;
    const objBottom = gameObject.position.y + gameObject.size.y;

    const zoneLeft = this.config.x;
    const zoneRight = this.config.x + this.config.width;
    const zoneTop = this.config.y;
    const zoneBottom = this.config.y + this.config.height;

    const isInZone = objRight >= zoneLeft && 
                     objLeft <= zoneRight && 
                     objBottom >= zoneTop && 
                     objTop <= zoneBottom;

    if (isInZone) {
      this.triggerObjectIds.add(gameObject.id);
      this.config.onScore?.(this.config.points, this);
      return true;
    }

    return false;
  }

  reset(): void {
    this.triggered = false;
    this.triggerObjectIds.clear();
  }

  hasTriggered(objectId?: string): boolean {
    if (objectId) {
      return this.triggerObjectIds.has(objectId);
    }
    return this.triggered;
  }
}

export class ScoreManager {
  private zones: Map<string, ScoreZone> = new Map();
  private totalScore: number = 0;

  addZone(zone: ScoreZone): void {
    this.zones.set(zone.id, zone);
  }

  removeZone(zoneId: string): void {
    this.zones.delete(zoneId);
  }

  checkAllZones(gameObject: GameObject): number {
    let pointsScored = 0;
    
    for (const zone of this.zones.values()) {
      if (zone.checkTrigger(gameObject)) {
        pointsScored += zone.config.points;
      }
    }

    this.totalScore += pointsScored;
    return pointsScored;
  }

  getScore(): number {
    return this.totalScore;
  }

  resetScore(): void {
    this.totalScore = 0;
    for (const zone of this.zones.values()) {
      zone.reset();
    }
  }

  clearZones(): void {
    this.zones.clear();
  }
}
