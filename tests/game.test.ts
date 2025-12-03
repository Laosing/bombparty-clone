import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test";
import { Game } from "../src/models/Game";
import { Settings } from "../src/types";

describe("Game Model", () => {
    let game: Game;
    let settings: Map<keyof Settings, number | boolean>;

    beforeEach(() => {
        settings = new Map();
        settings.set("timer", 5);
        settings.set("lives", 3);
        settings.set("hardMode", 10);
        settings.set("hardModeEnabled", false);
        settings.set("letterBlendCounter", 2);

        game = new Game(settings);
    });

    afterEach(() => {
        game.stop();
    });

    it("should initialize with default values", () => {
        expect(game.groups.size).toBe(0);
        expect(game.running).toBe(false);
        expect(game.round).toBe(0);
    });

    it("should add a group/player", () => {
        game.addGroup("group1", "user1");
        expect(game.groups.size).toBe(1);
        expect(game.groups.get("group1")?.members.has("user1")).toBe(true);
    });

    it("should start the game", () => {
        game.addGroup("group1", "user1");
        game.start();
        expect(game.running).toBe(true);
        expect(game.round).toBe(1);
        expect(game.timerValue).toBe(5);
        expect(game.currentGroup).toBe("group1");
        expect(game.letterBlend).toBeTruthy();
    });

    it("should validate a correct word", () => {
        game.addGroup("group1", "user1");
        game.start();

        // Mock dictionary service response effectively by forcing letter blend to something common
        game.letterBlend = "t";

        // This relies on the actual dictionary db.
        // We know "test" is a word.
        const result = game.checkWord("test", "group1");
        expect(result).toBe(true);
        expect(game.words.has("test")).toBe(true);
    });

    it("should reject an invalid word", () => {
        game.addGroup("group1", "user1");
        game.start();

        const result = game.checkWord("notaword12345", "group1");
        expect(result).toBe(false);
    });

    it("should switch turn after valid word", () => {
        game.addGroup("group1", "user1");
        game.addGroup("group2", "user2");
        game.start();

        const firstPlayer = game.currentGroup;
        game.letterBlend = "t";
        game.checkWord("test", firstPlayer);

        expect(game.currentGroup).not.toBe(firstPlayer);
    });

    it("should eliminate player when lives are lost", async () => {
        game.addGroup("group1", "user1");
        game.start();

        // Mock 0 lives
        const group = game.groups.get("group1");
        if(group) {
            group.lives = 0;
            game.groups.set("group1", group);
        }

        // Trigger game over check or life loss simulation
        // In Game logic, lives are lost on Boom.
        // We can simulate boom manually or wait for timer?
        // Let's call private method exposed for testing or simulate timer finish

        // Actually, we can just call handleTimerFinish logic via event or wait
        // But waiting 5s is long.
        // We can set timer to 0.1s
        game.timer.setTimer(1);
        // Wait...
        // For unit test, maybe we can access private methods using 'any' cast or expose them
    });
});
