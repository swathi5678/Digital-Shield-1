import { MockDatabase, initializeDatabase } from './schema.js';

let db: MockDatabase | null = null;

export function getDatabase(): MockDatabase {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db = null;
  }
}
