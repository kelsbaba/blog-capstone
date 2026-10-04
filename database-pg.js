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

pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error
    );
});

// =========================
// User Queries
// =========================

export async function createUser(
    username,
    email,
    passwordHash,
    createdAt
) {
    const result = await pool.query(
        `
        INSERT INTO users (
            username,
            email,
            password_hash,
            created_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            username,
            email,
            passwordHash,
            createdAt
        ]
    );

    return result.rows[0];
}

export async function getUserByUsername(username) {
    const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE username = $1
        `,
        [username]
    );

    return result.rows[0];
}

export async function getUserByEmail(email) {
    const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    return result.rows[0];
}

// =========================
// User Profile Queries
// =========================

export async function getUserById(userId) {
    const result = await pool.query(
        `
        SELECT
            id,
            username,
            email,
            display_name,
            bio,
            profile_image,
            created_at
        FROM users
        WHERE id = $1
        `,
        [userId]
    );

    return result.rows[0];
}

export async function updateUserProfile(
    userId,
    displayName,
    bio,
    profileImage
) {
    const result = await pool.query(
        `
        UPDATE users
        SET
            display_name = $1,
            bio = $2,
            profile_image = $3
        WHERE id = $4
        RETURNING
            id,
            username,
            email,
            display_name,
            bio,
            profile_image,
            created_at
        `,
        [
            displayName,
            bio,
            profileImage,
            userId
        ]
    );

    return result.rows[0];
}


// =========================
// Category Queries
// =========================

export async function getAllCategories() {
    const result = await pool.query(`
        SELECT *
        FROM categories
        ORDER BY name ASC
    `);

    return result.rows;
}

export async function getCategoryById(categoryId) {
    const result = await pool.query(
        `
        SELECT *
        FROM categories
        WHERE id = $1
        `,
        [categoryId]
    );

    return result.rows[0];
}

// =========================
// Post Queries
// =========================

export async function getAllPosts() {
    const result = await pool.query(`
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        ORDER BY posts.id DESC
    `);

    return result.rows;
}

export async function getPostsPaginated(
    postsPerPage,
    offset
) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        ORDER BY posts.id DESC
        LIMIT $1 OFFSET $2
        `,
        [
            postsPerPage,
            offset
        ]
    );

    return result.rows;
}

export async function getTotalPosts() {
    const result = await pool.query(`
        SELECT COUNT(*) AS count
        FROM posts
    `);

    return Number(result.rows[0].count);
}

export async function searchPosts(
    searchPattern
) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE
            posts.title ILIKE $1
            OR posts.content ILIKE $1
            OR posts.author ILIKE $1
            OR categories.name ILIKE $1
        ORDER BY posts.id DESC
        `,
        [searchPattern]
    );

    return result.rows;
}

export async function getTotalSearchPosts(searchPattern) {
    const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE
            posts.title ILIKE $1
            OR posts.content ILIKE $1
            OR posts.author ILIKE $1
            OR categories.name ILIKE $1
        `,
        [searchPattern]
    );

    return Number(result.rows[0].count);
}

export async function searchPostsPaginated(
    searchPattern,
    postsPerPage,
    offset
) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE
            posts.title ILIKE $1
            OR posts.content ILIKE $1
            OR posts.author ILIKE $1
            OR categories.name ILIKE $1
        ORDER BY posts.id DESC
        LIMIT $2 OFFSET $3
        `,
        [
            searchPattern,
            postsPerPage,
            offset
        ]
    );

    return result.rows;
}

export async function getPostsByCategory(
    categoryId
) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE posts.category_id = $1
        ORDER BY posts.id DESC
        `,
        [categoryId]
    );

    return result.rows;
}

export async function getPostsByCategoryPaginated(
    categoryId,
    postsPerPage,
    offset
) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE posts.category_id = $1
        ORDER BY posts.id DESC
        LIMIT $2 OFFSET $3
        `,
        [
            categoryId,
            postsPerPage,
            offset
        ]
    );

    return result.rows;
}

export async function getTotalPostsByCategory(
    categoryId
) {
    const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM posts
        WHERE category_id = $1
        `,
        [categoryId]
    );

    return Number(result.rows[0].count);
}

export async function getPostById(postId) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE posts.id = $1
        `,
        [postId]
    );

    return result.rows[0];
}

export async function createPost(
    title,
    content,
    author,
    date,
    userId,
    categoryId,
    image
) {
    const result = await pool.query(
        `
        INSERT INTO posts (
            title,
            content,
            author,
            date,
            user_id,
            category_id,
            image
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            title,
            content,
            author,
            date,
            userId,
            categoryId,
            image
        ]
    );

    return result.rows[0];
}

export async function updatePost(
    title,
    content,
    categoryId,
    image,
    postId
) {
    const result = await pool.query(
        `
        UPDATE posts
        SET
            title = $1,
            content = $2,
            category_id = $3,
            image = $4
        WHERE id = $5
        RETURNING *
        `,
        [
            title,
            content,
            categoryId,
            image,
            postId
        ]
    );

    return result.rows[0];
}

export async function deletePost(postId) {
    const result = await pool.query(
        `
        DELETE FROM posts
        WHERE id = $1
        RETURNING *
        `,
        [postId]
    );

    return result.rows[0];
}

 // =========================
 // Comment Queries
 // =========================

 export async function getCommentsByPostId(postId) {
     const result = await pool.query(
         `
         SELECT *
         FROM comments
         WHERE post_id = $1
         ORDER BY id ASC
         `,
         [postId]
     );

     return result.rows;
 }

 export async function getCommentById(commentId) {
     const result = await pool.query(
         `
         SELECT *
         FROM comments
         WHERE id = $1
         `,
         [commentId]
     );

     return result.rows[0];
 }

 export async function createComment(
     content,
     postId,
     userId,
     author,
     date
 ) {
     const result = await pool.query(
         `
         INSERT INTO comments (
             content,
             post_id,
             user_id,
             author,
             date
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *
         `,
         [
             content,
             postId,
             userId,
             author,
             date
         ]
     );

     return result.rows[0];
 }

 export async function deleteComment(commentId) {
     const result = await pool.query(
         `
         DELETE FROM comments
         WHERE id = $1
         RETURNING *
         `,
         [commentId]
     );

     return result.rows[0];
 }

 export async function updateComment(
     content,
     commentId
 ) {
     const result = await pool.query(
         `
         UPDATE comments
         SET content = $1
         WHERE id = $2
         RETURNING *
         `,
         [
             content,
             commentId
         ]
     );

     return result.rows[0];
 }

 // =========================
// Like Queries
// =========================

export async function getLike(
    postId,
    userId
) {
    const result = await pool.query(
        `
        SELECT *
        FROM likes
        WHERE post_id = $1
        AND user_id = $2
        `,
        [
            postId,
            userId
        ]
    );

    return result.rows[0];
}

export async function createLike(
    postId,
    userId
) {
    const result = await pool.query(
        `
        INSERT INTO likes (
            post_id,
            user_id
        )
        VALUES ($1, $2)
        RETURNING *
        `,
        [
            postId,
            userId
        ]
    );

    return result.rows[0];
}

export async function deleteLike(
    postId,
    userId
) {
    const result = await pool.query(
        `
        DELETE FROM likes
        WHERE post_id = $1
        AND user_id = $2
        RETURNING *
        `,
        [
            postId,
            userId
        ]
    );

    return result.rows[0];
}

export async function getLikeCount(
    postId
) {
    const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM likes
        WHERE post_id = $1
        `,
        [postId]
    );

    return Number(result.rows[0].count);
}

// =========================
// Profile Queries
// =========================

export async function getUserProfile(userId) {
    const result = await pool.query(
        `
        SELECT
            users.id,
            users.username,
            users.email,
            users.display_name,
            users.bio,
            users.profile_image,
            users.created_at,
            COUNT(DISTINCT posts.id) AS post_count,
            COUNT(DISTINCT comments.id) AS comment_count
        FROM users
        LEFT JOIN posts
            ON users.id = posts.user_id
        LEFT JOIN comments
            ON users.id = comments.user_id
        WHERE users.id = $1
        GROUP BY users.id
        `,
        [userId]
    );

    return result.rows[0];
}

export async function getUserPosts(userId) {
    const result = await pool.query(
        `
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE posts.user_id = $1
        ORDER BY posts.id DESC
        `,
        [userId]
    );

    return result.rows;
}

// =========================
// Friendship Queries
// =========================

export async function sendFriendRequest(senderId, receiverId) {
    const result = await pool.query(
        `
        INSERT INTO friendships (
            sender_id,
            receiver_id
        )
        VALUES ($1, $2)
        RETURNING *
        `,
        [
            senderId,
            receiverId
        ]
    );

    return result.rows[0];
}

export async function getFriendStatus(userId, otherUserId) {
    const result = await pool.query(
        `
        SELECT *
        FROM friendships
        WHERE
            (sender_id = $1 AND receiver_id = $2)
            OR
            (sender_id = $2 AND receiver_id = $1)
        ORDER BY id DESC
        LIMIT 1
        `,
        [
            userId,
            otherUserId
        ]
    );

    return result.rows[0];
}

export async function getPendingFriendRequests(userId) {
    const result = await pool.query(
        `
        SELECT
            friendships.*,
            users.username,
            users.display_name,
            users.profile_image
        FROM friendships
        JOIN users
            ON friendships.sender_id = users.id
        WHERE
            friendships.receiver_id = $1
            AND friendships.status = 'pending'
        ORDER BY friendships.created_at DESC
        `,
        [userId]
    );

    return result.rows;
}

export async function acceptFriendRequest(requestId, userId) {
    const result = await pool.query(
        `
        UPDATE friendships
        SET status = 'accepted'
        WHERE
            id = $1
            AND receiver_id = $2
            AND status = 'pending'
        RETURNING *
        `,
        [
            requestId,
            userId
        ]
    );

    return result.rows[0];
}

export async function rejectFriendRequest(requestId, userId) {
    const result = await pool.query(
        `
        UPDATE friendships
        SET status = 'rejected'
        WHERE
            id = $1
            AND receiver_id = $2
            AND status = 'pending'
        RETURNING *
        `,
        [
            requestId,
            userId
        ]
    );

    return result.rows[0];
}

export async function getFriends(userId) {
    const result = await pool.query(
        `
        SELECT
            users.id,
            users.username,
            users.display_name,
            users.profile_image,
            friendships.created_at
        FROM friendships
        JOIN users
            ON users.id =
                CASE
                    WHEN friendships.sender_id = $1
                        THEN friendships.receiver_id
                    ELSE friendships.sender_id
                END
        WHERE
            (
                friendships.sender_id = $1
                OR friendships.receiver_id = $1
            )
            AND friendships.status = 'accepted'
        ORDER BY friendships.created_at DESC
        `,
        [userId]
    );

    return result.rows;
}

// ===============================
// MESSAGE FUNCTIONS
// ===============================

// Save a new message
export async function createMessage(senderId, receiverId, content) {
    const result = await pool.query(
        `
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
        [senderId, receiverId, content]
    );

    return result.rows[0];
}


// Get conversation history between two users
export async function getConversation(userId, otherUserId) {
    const result = await pool.query(
        `
        SELECT
            m.id,
            m.sender_id,
            m.receiver_id,
            m.content,
            m.created_at,
            m.read_at,
            sender.username AS sender_username,
            sender.display_name AS sender_display_name,
            receiver.username AS receiver_username,
            receiver.display_name AS receiver_display_name
        FROM messages m
        JOIN users sender
            ON sender.id = m.sender_id
        JOIN users receiver
            ON receiver.id = m.receiver_id
        WHERE
            (m.sender_id = $1 AND m.receiver_id = $2)
            OR
            (m.sender_id = $2 AND m.receiver_id = $1)
        ORDER BY m.created_at ASC, m.id ASC;
        `,
        [userId, otherUserId]
    );

    return result.rows;
}


// Get the number of unread messages for a user
export async function getUnreadMessageCount(userId) {
    const result = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM messages
        WHERE receiver_id = $1
          AND read_at IS NULL;
        `,
        [userId]
    );

    return result.rows[0].count;
}

export async function getUnreadMessageCountsBySender(userId) {
    const result = await pool.query(
        `
        SELECT
            sender_id,
            COUNT(*)::int AS count
        FROM messages
        WHERE receiver_id = $1
          AND read_at IS NULL
        GROUP BY sender_id;
        `,
        [userId]
    );

    return result.rows;
}


// Mark messages from another user as read
export async function markMessagesAsRead(userId, otherUserId) {
    const result = await pool.query(
        `
        UPDATE messages
        SET read_at = CURRENT_TIMESTAMP
        WHERE receiver_id = $1
          AND sender_id = $2
          AND read_at IS NULL
        RETURNING *;
        `,
        [userId, otherUserId]
    );

    return result.rows;
}

export default pool;