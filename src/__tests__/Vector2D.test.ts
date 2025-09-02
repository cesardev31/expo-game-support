import { Vector2D } from '../math/Vector2D';

describe('Vector2D', () => {
  describe('Constructor', () => {
    it('should create vector with default values', () => {
      const vector = new Vector2D();
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(0);
    });

    it('should create vector with provided values', () => {
      const vector = new Vector2D(3, 4);
      expect(vector.x).toBe(3);
      expect(vector.y).toBe(4);
    });
  });

  describe('Basic Operations', () => {
    it('should add vectors correctly', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 4);
      const result = v1.add(v2);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should subtract vectors correctly', () => {
      const v1 = new Vector2D(5, 7);
      const v2 = new Vector2D(2, 3);
      const result = v1.subtract(v2);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should multiply by scalar correctly', () => {
      const vector = new Vector2D(2, 3);
      const result = vector.multiply(2);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should divide by scalar correctly', () => {
      const vector = new Vector2D(6, 8);
      const result = vector.divide(2);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should throw error when dividing by zero', () => {
      const vector = new Vector2D(1, 1);
      expect(() => vector.divide(0)).toThrow('División por cero');
    });
  });

  describe('Vector Properties', () => {
    it('should calculate magnitude correctly', () => {
      const vector = new Vector2D(3, 4);
      expect(vector.magnitude()).toBe(5);
    });

    it('should calculate magnitude squared correctly', () => {
      const vector = new Vector2D(3, 4);
      expect(vector.magnitudeSquared()).toBe(25);
    });

    it('should normalize vector correctly', () => {
      const vector = new Vector2D(3, 4);
      const normalized = vector.normalize();
      
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
      expect(normalized.magnitude()).toBeCloseTo(1);
    });

    it('should handle zero vector normalization', () => {
      const vector = new Vector2D(0, 0);
      const normalized = vector.normalize();
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });
  });

  describe('Vector Operations', () => {
    it('should calculate dot product correctly', () => {
      const v1 = new Vector2D(2, 3);
      const v2 = new Vector2D(4, 5);
      const dot = v1.dot(v2);
      
      expect(dot).toBe(23); // 2*4 + 3*5 = 8 + 15 = 23
    });

    it('should calculate distance correctly', () => {
      const v1 = new Vector2D(0, 0);
      const v2 = new Vector2D(3, 4);
      const distance = v1.distance(v2);
      
      expect(distance).toBe(5);
    });

    it('should calculate angle correctly', () => {
      const vector = new Vector2D(1, 1);
      const angle = vector.angle();
      
      expect(angle).toBeCloseTo(Math.PI / 4);
    });

    it('should rotate vector correctly', () => {
      const vector = new Vector2D(1, 0);
      const rotated = vector.rotate(Math.PI / 2);
      
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(1);
    });
  });

  describe('Static Methods', () => {
    it('should create zero vector', () => {
      const zero = Vector2D.zero();
      expect(zero.x).toBe(0);
      expect(zero.y).toBe(0);
    });

    it('should create unit vectors', () => {
      expect(Vector2D.up()).toEqual(new Vector2D(0, -1));
      expect(Vector2D.down()).toEqual(new Vector2D(0, 1));
      expect(Vector2D.left()).toEqual(new Vector2D(-1, 0));
      expect(Vector2D.right()).toEqual(new Vector2D(1, 0));
    });
  });

  describe('Utility Methods', () => {
    it('should clone vector correctly', () => {
      const original = new Vector2D(3, 4);
      const cloned = original.clone();
      
      expect(cloned.x).toBe(original.x);
      expect(cloned.y).toBe(original.y);
      expect(cloned).not.toBe(original);
    });

    it('should convert to string correctly', () => {
      const vector = new Vector2D(3.14159, 2.71828);
      const str = vector.toString();
      
      expect(str).toBe('Vector2D(3.14, 2.72)');
    });
  });
});
