import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Timer } from "../src/Timer";

describe("Timer", () => {
  let timer: Timer;

  beforeEach(() => {
    timer = new Timer();
  });

  afterEach(() => {
    // Cleanup
  });

  it("should set timer correctly", () => {
    timer.setTimer(10);
    expect(timer.getTime()).toBe(10);
  });

  it("should countdown", async () => {
    timer.start(10);
    expect(timer.getTime()).toBe(10);

    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(timer.getTime()).toBe(9);

    await new Promise(resolve => setTimeout(resolve, 2100));
    expect(timer.getTime()).toBe(7);

    timer.stop();
  });

  it("should emit secondsUpdated event", async () => {
    let called = false;
    timer.on("secondsUpdated", () => {
      called = true;
    });
    timer.start(5);

    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(called).toBe(true);

    timer.stop();
  });

  it("should emit targetAchieved event when finished", async () => {
    let called = false;
    timer.on("targetAchieved", () => {
      called = true;
    });
    timer.start(2);

    await new Promise(resolve => setTimeout(resolve, 3100));
    expect(timer.getTime()).toBe(0);
    expect(called).toBe(true);

    timer.stop();
  });

  it("should stop when stop() is called", async () => {
    timer.start(10);
    await new Promise(resolve => setTimeout(resolve, 2100));
    expect(timer.getTime()).toBe(8);

    timer.stop();
    await new Promise(resolve => setTimeout(resolve, 2100));
    expect(timer.getTime()).toBe(8); // Should stay at 8
  });
});
