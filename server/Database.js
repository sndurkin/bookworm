import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

class Database {
  constructor() { }

  async setup() {
    this.db = await sqlite.open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
    });

    await this.db.exec(`CREATE TABLE IF NOT EXISTS story (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  sentences TEXT NOT NULL,
  grade TEXT NOT NULL,
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

  async insertStory({ title, sentences, grade, topic }) {
    await this.db.run(`INSERT INTO story (title, sentences, grade, topic) VALUES (?, ?, ?, ?)`,
      title,
      sentences,
      grade,
      topic,
    );
  }

  async getAllStories() {
    return await this.db.all('SELECT * FROM story');
  }

}

export default Database;
