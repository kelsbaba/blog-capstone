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
        CREATE TABLE IF NOT EXISTS friendships (
            id SERIAL PRIMARY KEY,

            sender_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            receiver_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            status VARCHAR(20) NOT NULL
                DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            CHECK (sender_id <> receiver_id),

            UNIQUE(sender_id, receiver_id)
        );
    `);

    console.log("✅ Friendships table created successfully.");

} catch (error) {

    console.error(
        "❌ Failed to create friendships table:",
        error
    );

} finally {

    await pool.end();
}