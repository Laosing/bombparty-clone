import { Database } from "bun:sqlite";

export class DictionaryService {
  private db: Database;

  constructor() {
    // Database path relative to where the process runs (root)
    this.db = new Database("./data/dictionary.db", { readonly: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
  }

  getRandomWord(): string | undefined {
    // Bun's sqlite get() returns the first result directly
    const result = this.db
      .prepare(
        "SELECT * FROM English WHERE ROWID > (ABS(RANDOM()) % (SELECT max(ROWID) FROM English)) LIMIT 1;"
      )
      .get() as { word: string } | null;
    return result?.word;
  }

  checkWord(word: string): boolean {
    const result = this.db
      .prepare("SELECT * FROM English WHERE word = ?")
      .get(word) as { word: string } | null;
    return Boolean(result?.word);
  }
}

export const dictionaryService = new DictionaryService();
