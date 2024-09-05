import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

class Database {
  constructor() { }

  async setup() {
    this.db = await sqlite.open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
    });

    await this.db.exec(`CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  age INTEGER NOT NULL,
  topic TEXT NOT NULL
)`);

    // Close the DB when the app is about to exit
    process.on('exit', async () => {
      if (this.db) {
        await this.db.close();
        console.log('Database connection closed.');
      }
    });
  }

  async insertBook({ title, story, age, topic }) {
    await this.db.run(`INSERT INTO book (title, story, age, topic) VALUES (?, ?, ?, ?)`,
      title,
      story,
      age,
      topic,
    );
  }

  async getAllBooks() {
    return await this.db.all('SELECT * FROM book');
  }

}

export default Database;
