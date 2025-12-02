import { assertEquals } from "jsr:@std/assert";
import { Timer } from "../src/Timer.ts";

Deno.test("Timer - setTimer sets correct duration", () => {
  const timer = new Timer();
  timer.setTimer(10);
  assertEquals(timer.getTime(), 10);
});

Deno.test("Timer - reset restores default duration", () => {
  const timer = new Timer();
  timer.setTimer(10);
  timer.start();
  timer.reset();
  assertEquals(timer.getTime(), 10);
  timer.stop(); // Clean up to avoid leaks
});

Deno.test("Timer - events work", async () => {
  const timer = new Timer();
  timer.setTimer(1);

  let targetAchieved = false;
  const promise = new Promise<void>((resolve) => {
    timer.on("targetAchieved", () => {
      targetAchieved = true;
      resolve();
    });
  });

  timer.start();

  await promise;

  assertEquals(targetAchieved, true);
  timer.stop();
});
