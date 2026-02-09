import { readFileSync } from "fs";
import { join } from "path";

export class DictionaryService {
  private words: Set<string>;
  private wordList: string[];

  constructor() {
    const content = readFileSync(join(process.cwd(), "data/dictionary.txt"), "utf-8");
    this.wordList = content.split("\n").filter(Boolean);
    this.words = new Set(this.wordList);
  }

  getRandomWord(): string | undefined {
    return this.wordList[Math.floor(Math.random() * this.wordList.length)];
  }

  checkWord(word: string): boolean {
    return this.words.has(word);
  }
}

export const dictionaryService = new DictionaryService();
