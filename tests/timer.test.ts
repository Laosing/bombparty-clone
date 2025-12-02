import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timer } from "../src/Timer";

describe("Timer", () => {
  let timer: Timer;

  beforeEach(() => {
    timer = new Timer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should set timer correctly", () => {
    timer.setTimer(10);
    expect(timer.getTime()).toBe(10);
  });

  it("should countdown", () => {
    timer.start(10);
    expect(timer.getTime()).toBe(10);

    vi.advanceTimersByTime(1000);
    expect(timer.getTime()).toBe(9);

    vi.advanceTimersByTime(2000);
    expect(timer.getTime()).toBe(7);
  });

  it("should emit secondsUpdated event", () => {
    const callback = vi.fn();
    timer.on("secondsUpdated", callback);
    timer.start(5);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });

  it("should emit targetAchieved event when finished", () => {
    const callback = vi.fn();
    timer.on("targetAchieved", callback);
    timer.start(2);

    vi.advanceTimersByTime(3000); // 2 seconds + 1 buffer
    expect(timer.getTime()).toBe(0);
    expect(callback).toHaveBeenCalled();
  });

  it("should stop when stop() is called", () => {
    timer.start(10);
    vi.advanceTimersByTime(2000);
    expect(timer.getTime()).toBe(8);

    timer.stop();
    vi.advanceTimersByTime(2000);
    expect(timer.getTime()).toBe(8); // Should stay at 8
  });
});
