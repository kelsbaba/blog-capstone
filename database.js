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

// Check existing posts table columns
const postColumns = db.prepare(`
    PRAGMA table_info(posts)
`).all();

// Add category_id column if it does not exist
const hasCategoryId = postColumns.some(
    column => column.name === "category_id"
);

if (!hasCategoryId) {
    db.exec(`
        ALTER TABLE posts
        ADD COLUMN category_id INTEGER
    `);
}

// Add user_id column if it does not exist
const hasUserIdColumn = postColumns.some(
    column => column.name === "user_id"
);

if (!hasUserIdColumn) {
    db.exec(`
        ALTER TABLE posts
        ADD COLUMN user_id INTEGER
    `);
}

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

// Create categories table
db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )
`);

// Create the likes table

db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

// Insert default categories
const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name)
    VALUES (?)
`);

const defaultCategories = [
    "Technology",
    "Programming",
    "Lifestyle",
    "Education",
    "Business",
    "News"
];

for (const category of defaultCategories) {
    insertCategory.run(category);
}

console.log("Database connected successfully");

// Export database
export default db;