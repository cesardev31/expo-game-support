import { GameObject } from '../core/GameObject';
import { CollisionEvent } from '../types';
import { Vector2D } from '../math/Vector2D';

// Detector de colisiones entre objetos del juego
export class CollisionDetector {
  
  // Verificar colisión entre dos objetos
  checkCollision(objA: GameObject, objB: GameObject): CollisionEvent | null {
    // Por ahora implementamos colisión AABB (Axis-Aligned Bounding Box)
    return this.checkAABBCollision(objA, objB);
  }

  // Colisión AABB (rectángulos alineados con los ejes)
  private checkAABBCollision(objA: GameObject, objB: GameObject): CollisionEvent | null {
    const boundsA = objA.getBounds();
    const boundsB = objB.getBounds();

    console.log(`🔍 [COLLISION] Checking ${objA.id} vs ${objB.id}`);
    console.log(`🔍 [COLLISION] ${objA.id} bounds: left=${boundsA.left}, right=${boundsA.right}, top=${boundsA.top}, bottom=${boundsA.bottom}`);
    console.log(`🔍 [COLLISION] ${objB.id} bounds: left=${boundsB.left}, right=${boundsB.right}, top=${boundsB.top}, bottom=${boundsB.bottom}`);

    // Verificar si hay superposición
    const overlapX = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
    const overlapY = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);

    console.log(`🔍 [COLLISION] Overlaps: X=${overlapX}, Y=${overlapY}`);

    if (overlapX <= 0 || overlapY <= 0) {
      return null; // No hay colisión
    }

    // Determinar la dirección de la colisión
    let normal: Vector2D;
    let penetration: number;

    if (overlapX < overlapY) {
      // Colisión horizontal
      penetration = overlapX;
      normal = objA.position.x < objB.position.x ? 
        new Vector2D(-1, 0) : new Vector2D(1, 0);
    } else {
      // Colisión vertical
      penetration = overlapY;
      normal = objA.position.y < objB.position.y ? 
        new Vector2D(0, -1) : new Vector2D(0, 1);
    }

    // Punto de colisión (centro de la superposición)
    const point = new Vector2D(
      Math.max(boundsA.left, boundsB.left) + overlapX / 2,
      Math.max(boundsA.top, boundsB.top) + overlapY / 2
    );

    return {
      objectA: objA.id,
      objectB: objB.id,
      point,
      normal,
      penetration
    };
  }

  // Colisión circular (para objetos redondos)
  checkCircleCollision(objA: GameObject, objB: GameObject): CollisionEvent | null {
    const radiusA = Math.min(objA.size.x, objA.size.y) / 2;
    const radiusB = Math.min(objB.size.x, objB.size.y) / 2;
    
    const distance = objA.position.distance(objB.position);
    const minDistance = radiusA + radiusB;

    if (distance >= minDistance) {
      return null; // No hay colisión
    }

    const penetration = minDistance - distance;
    const normal = objB.position.subtract(objA.position).normalize();
    const point = objA.position.add(normal.multiply(radiusA));

    return {
      objectA: objA.id,
      objectB: objB.id,
      point,
      normal,
      penetration
    };
  }

  // Verificar si un punto está dentro de un objeto
  pointInObject(point: Vector2D, object: GameObject): boolean {
    return object.containsPoint(point);
  }

  // Raycast - lanzar un rayo y ver qué objetos intersecta
  raycast(origin: Vector2D, direction: Vector2D, maxDistance: number, objects: GameObject[]): GameObject[] {
    const hits: GameObject[] = [];
    const normalizedDirection = direction.normalize();

    for (const obj of objects) {
      if (!obj.active) continue;

      const bounds = obj.getBounds();
      const hit = this.rayIntersectsAABB(origin, normalizedDirection, bounds, maxDistance);
      
      if (hit) {
        hits.push(obj);
      }
    }

    // Ordenar por distancia
    hits.sort((a, b) => {
      const distA = origin.distance(a.position);
      const distB = origin.distance(b.position);
      return distA - distB;
    });

    return hits;
  }

  // Verificar intersección de rayo con AABB
  private rayIntersectsAABB(
    origin: Vector2D, 
    direction: Vector2D, 
    bounds: { left: number; right: number; top: number; bottom: number }, 
    maxDistance: number
  ): boolean {
    const invDirX = direction.x !== 0 ? 1 / direction.x : Infinity;
    const invDirY = direction.y !== 0 ? 1 / direction.y : Infinity;

    const t1 = (bounds.left - origin.x) * invDirX;
    const t2 = (bounds.right - origin.x) * invDirX;
    const t3 = (bounds.top - origin.y) * invDirY;
    const t4 = (bounds.bottom - origin.y) * invDirY;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    // Si tmax < 0, el rayo intersecta AABB pero está detrás del origen
    if (tmax < 0) return false;

    // Si tmin > tmax, el rayo no intersecta AABB
    if (tmin > tmax) return false;

    // Verificar si la intersección está dentro del rango máximo
    const distance = tmin >= 0 ? tmin : tmax;
    return distance <= maxDistance;
  }
}
