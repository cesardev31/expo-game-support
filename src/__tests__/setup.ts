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
      this.touches = (eventInitDict?.touches as TouchList) || ({} as TouchList);
      this.changedTouches = (eventInitDict?.changedTouches as TouchList) || ({} as TouchList);
      this.targetTouches = (eventInitDict?.targetTouches as TouchList) || ({} as TouchList);
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
