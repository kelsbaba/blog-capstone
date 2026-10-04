import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function createMessagesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,

                sender_id INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,

                receiver_id INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,

                content TEXT NOT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                read_at TIMESTAMP NULL,

                CHECK (sender_id <> receiver_id)
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
            ON messages(sender_id, receiver_id);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender
            ON messages(receiver_id, sender_id);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_created_at
            ON messages(created_at);
        `);

        console.log("✅ Messages table created successfully.");
    } catch (error) {
        console.error("❌ Error creating messages table:", error);
    } finally {
        await pool.end();
    }
}

createMessagesTable();