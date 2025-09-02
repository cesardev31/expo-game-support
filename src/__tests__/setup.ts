// Jest setup file
import 'jest-environment-jsdom';

// Mock para requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// Mock para performance.now()
global.performance = {
  now: jest.fn(() => Date.now()),
} as any;

// Mock para touch events
Object.defineProperty(window, 'TouchEvent', {
  writable: true,
  value: class MockTouchEvent extends Event {
    touches: TouchList;
    changedTouches: TouchList;
    targetTouches: TouchList;
    
    constructor(type: string, eventInitDict?: TouchEventInit) {
      super(type, eventInitDict);
      // Crear mock simple de TouchList
      this.touches = this.createMockTouchList(eventInitDict?.touches as Touch[] || []);
      this.changedTouches = this.createMockTouchList(eventInitDict?.changedTouches as Touch[] || []);
      this.targetTouches = this.createMockTouchList(eventInitDict?.targetTouches as Touch[] || []);
    }
    
    private createMockTouchList(touches: Touch[]): TouchList {
      const mockList = {
        length: touches.length,
        item: (index: number) => touches[index] || null,
        [Symbol.iterator]: () => touches[Symbol.iterator]()
      };
      
      // Agregar índices numéricos
      touches.forEach((touch, index) => {
        (mockList as any)[index] = touch;
      });
      
      return mockList as TouchList;
    }
  }
});

// Suprimir warnings de console en tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalConsoleWarn(...args);
};
