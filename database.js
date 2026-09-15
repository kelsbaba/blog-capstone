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

// Create users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
`);

// Add user_id column to existing posts table
const postColumns = db.prepare(`
    PRAGMA table_info(posts)
`).all();

const hasUserIdColumn = postColumns.some(
    column => column.name === "user_id"
);

if (!hasUserIdColumn) {
    db.exec(`
        ALTER TABLE posts
        ADD COLUMN user_id INTEGER
    `);
}


// Create comments table
db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        date TEXT NOT NULL
    )
`);


console.log("Database connected successfully");

// Export database
export default db;