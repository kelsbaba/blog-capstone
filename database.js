import Database from "better-sqlite3";

// Create or open database
const db = new Database("blog.db");

// Create posts table
db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        date TEXT NOT NULL
    )
`);

console.log("Database connected successfully");

// Export database
export default db;