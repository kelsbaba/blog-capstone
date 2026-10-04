import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
});

try {
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bio TEXT;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS profile_image TEXT;
    `);

    console.log("✅ User profile columns added successfully.");
} catch (error) {
    console.error("❌ Failed to add profile columns:", error);
} finally {
    await pool.end();
}