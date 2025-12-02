import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; // This imports the types and matchers directly usually, but let's check.
import * as matchers from '@testing-library/jest-dom/matchers';

// @ts-ignore
expect.extend(matchers);

afterEach(() => {
  cleanup();
});
