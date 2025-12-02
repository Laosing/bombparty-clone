import Database from "better-sqlite3";

export class DictionaryService {
  private db: Database.Database;

  constructor() {
    // Database path relative to where the process runs (root)
    this.db = new Database("./data/dictionary.db", { readonly: true });
    this.db.pragma("journal_mode = WAL");
  }

  getRandomWord(): string | undefined {
    const stmt = this.db
      .prepare(
        "SELECT * FROM English WHERE ROWID > (ABS(RANDOM()) % (SELECT max(ROWID) FROM English)) LIMIT 1;"
      )
      .get() as { word: string } | undefined;
    return stmt?.word;
  }

  checkWord(word: string): boolean {
    const stmt = this.db
      .prepare("SELECT * FROM English WHERE word = ?")
      .get(word) as { word: string } | undefined;
    return Boolean(stmt?.word);
  }
}

export const dictionaryService = new DictionaryService();
