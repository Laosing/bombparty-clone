import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => {
  const confetti = vi.fn() as any;
  confetti.reset = vi.fn();
  return { default: confetti };
});

// Mock activity-detector
vi.mock("activity-detector", () => ({
  default: () => ({
    on: vi.fn(),
    stop: vi.fn(),
  }),
}));
