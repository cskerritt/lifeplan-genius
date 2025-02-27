import { vi } from 'vitest';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock browser environment for tests
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.button = props.button || 0;
    this.ctrlKey = props.ctrlKey || false;
    this.pointerType = props.pointerType || 'mouse';
  }
}

// Setup global mocks
global.PointerEvent = MockPointerEvent as any;
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn().mockImplementation((blob) => `mock-url-${blob.size}`),
  });
}

// Clean up after each test
afterEach(() => {
  cleanup();
}); 