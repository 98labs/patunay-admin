import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup global test utilities
global.expect = expect;

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock electron API if tests try to access it
Object.defineProperty(window, 'electron', {
  value: {
    subscribeNfcCardDetection: vi.fn(),
    unsubscribeNfcCardDetection: vi.fn(),
    // Add other electron APIs as needed
  },
  writable: true,
});

// Mock environment variables
Object.defineProperty(process, 'env', {
  value: {
    NODE_ENV: 'test',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    ...process.env,
  },
  writable: true,
});