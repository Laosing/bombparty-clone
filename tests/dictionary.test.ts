import { describe, it, expect } from "bun:test";
import { DictionaryService } from "../src/services/DictionaryService";

describe("DictionaryService", () => {
  const dictionaryService = new DictionaryService();

  it("should find a valid word", () => {
    expect(dictionaryService.checkWord("apple")).toBe(true);
  });

  it("should not find an invalid word", () => {
    expect(dictionaryService.checkWord("xyzabc")).toBe(false);
  });

  it("should return a random word", () => {
    const word = dictionaryService.getRandomWord();
    expect(typeof word).toBe("string");
    expect(word?.length).toBeGreaterThan(0);
  });
});
