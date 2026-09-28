import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
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


export default pool;